import { BaseCrawler } from './BaseCrawler';
import {
  SocialMediaPost,
  CrawlerResult,
  SocialPlatform,
  ApiCredentials,
  CrawlerConfig,
  ScrapingOptions,
  YouTubeApiResponse,
  YouTubeVideo,
  YouTubeChannel,
  UserProfile,
} from '../../types/crawler';

export class YouTubeCrawler extends BaseCrawler {
  private credentials?: ApiCredentials['youtube'];

  constructor(
    config: CrawlerConfig,
    options: ScrapingOptions = {},
    credentials?: ApiCredentials['youtube']
  ) {
    super(config, options);
    this.credentials = credentials;
  }

  validateConfig(): boolean {
    return !!(this.config.searchTerms?.length || this.config.usernames?.length);
  }

  async crawl(): Promise<CrawlerResult> {
    if (!this.validateConfig()) {
      throw new Error('Invalid configuration: At least one search term or username is required');
    }

    const isProfileSearch = this.config.searchType === 'profiles';
    const posts: SocialMediaPost[] = [];
    const profiles: UserProfile[] = [];
    const errors: string[] = [];

    try {
      if (isProfileSearch) {
        // Search for channels/profiles
        if (this.credentials?.apiKey) {
          console.log('🔑 Using YouTube API for channel search');
          const apiProfiles = await this.crawlChannelsWithApi();
          profiles.push(...apiProfiles);
        } else {
          console.log('🕷️ Falling back to web scraping for channels (no API credentials)');
          const scrapedProfiles = await this.crawlChannelsWithScraping();
          profiles.push(...scrapedProfiles);
        }
      } else {
        // Try YouTube Data API if credentials are available
        if (this.credentials?.apiKey) {
          const apiPosts = await this.crawlWithApi();
          posts.push(...apiPosts);
        } else {
          // Fall back to web scraping
          const scrapedPosts = await this.crawlWithScraping();
          posts.push(...scrapedPosts);
        }
      }
    } catch (error) {
      errors.push(
        `YouTube crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    const result: CrawlerResult = {
      metadata: {
        totalFound: isProfileSearch ? profiles.length : posts.length,
        crawledAt: new Date(),
        searchQuery: this.buildSearchQuery(),
        platform: SocialPlatform.YOUTUBE,
        searchType: isProfileSearch ? 'profiles' : 'posts',
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    if (isProfileSearch) {
      result.profiles = profiles.slice(0, this.config.maxProfiles || 50);
    } else {
      result.posts = posts.slice(0, this.config.maxPosts || 50);
    }

    return result;
  }

  private async crawlWithApi(): Promise<SocialMediaPost[]> {
    if (!this.credentials?.apiKey) {
      throw new Error('YouTube API key not provided');
    }

    const posts: SocialMediaPost[] = [];

    if (this.config.searchTerms?.length) {
      for (const term of this.config.searchTerms) {
        const searchPosts = await this.searchVideos(term);
        posts.push(...searchPosts);
      }
    }

    if (this.config.usernames?.length) {
      for (const username of this.config.usernames) {
        const channelPosts = await this.getChannelVideos(username);
        posts.push(...channelPosts);
      }
    }

    return posts;
  }

  private async searchVideos(searchTerm: string): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    const maxResults = Math.min(this.config.maxPosts || 25, 50);

    try {
      // YouTube Data API v3 search endpoint
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchTerm)}&type=video&maxResults=${maxResults}&order=date&key=${this.credentials!.apiKey}`;

      const searchData = await this.makeApiRequest<YouTubeApiResponse>(searchUrl);

      if (searchData.items) {
        // Get video statistics
        const videoIds = searchData.items
          .map((item: YouTubeVideo) => (typeof item.id === 'string' ? item.id : item.id.videoId))
          .join(',');
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${this.credentials!.apiKey}`;

        const statsData = await this.makeApiRequest<YouTubeApiResponse>(statsUrl);
        const statsMap = new Map(
          statsData.items?.map((item: YouTubeVideo) => [
            typeof item.id === 'string' ? item.id : item.id.videoId,
            item,
          ]) || []
        );

        for (const item of searchData.items) {
          const videoId = typeof item.id === 'string' ? item.id : item.id.videoId;
          const stats = statsMap.get(videoId);
          const post = this.parseApiVideo(item, stats);
          posts.push(post);
        }
      }
    } catch (error) {
      console.error(`Error searching YouTube for "${searchTerm}":`, error);
      throw error;
    }

    return posts;
  }

  private async getChannelVideos(channelName: string): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];

    try {
      // First, get channel ID
      const channelUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=1&key=${this.credentials!.apiKey}`;
      const channelData = await this.makeApiRequest<YouTubeApiResponse>(channelUrl);

      if (!channelData.items?.length) {
        throw new Error(`Channel "${channelName}" not found`);
      }

      const firstChannel = channelData.items[0];
      const channelId =
        typeof firstChannel.id === 'string' ? firstChannel.id : firstChannel.snippet.channelId;
      const maxResults = Math.min(this.config.maxPosts || 25, 50);

      // Get channel's videos
      const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=${maxResults}&order=date&key=${this.credentials!.apiKey}`;
      const videosData = await this.makeApiRequest<YouTubeApiResponse>(videosUrl);

      if (videosData.items) {
        for (const item of videosData.items) {
          const post = this.parseApiVideo(item);
          posts.push(post);
        }
      }
    } catch (error) {
      console.error(`Error getting videos for channel ${channelName}:`, error);
      throw error;
    }

    return posts;
  }

  private async crawlWithScraping(): Promise<SocialMediaPost[]> {
    await this.initBrowser();
    const posts: SocialMediaPost[] = [];

    try {
      if (this.config.searchTerms?.length) {
        for (const term of this.config.searchTerms) {
          const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}&sp=CAI%253D`;
          await this.navigateToUrl(searchUrl);
          await this.scrollToLoadContent();

          const html = await this.getPageContent();
          const $ = this.parseWithCheerio(html);

          // Parse YouTube video results
          $('div#contents ytd-video-renderer').each((_index: number, element: cheerio.Element) => {
            try {
              const post = this.parseScrapedVideo($, $(element));
              if (post) {
                posts.push(post);
              }
            } catch (error) {
              console.error('Error parsing YouTube video:', error);
            }
          });
        }
      }
    } finally {
      await this.closeBrowser();
    }

    return posts;
  }

  private parseApiVideo(video: YouTubeVideo, stats?: YouTubeVideo): SocialMediaPost {
    const videoId = typeof video.id === 'string' ? video.id : video.id.videoId;

    return {
      id: this.generatePostId(SocialPlatform.YOUTUBE, videoId),
      platform: SocialPlatform.YOUTUBE,
      author: {
        username: video.snippet.channelTitle,
        displayName: video.snippet.channelTitle,
        profileUrl: `https://www.youtube.com/channel/${video.snippet.channelId}`,
      },
      content: {
        text: `${video.snippet.title}\n\n${video.snippet.description}`,
        videos: [`https://www.youtube.com/watch?v=${videoId}`],
        images: video.snippet.thumbnails?.high?.url
          ? [video.snippet.thumbnails.high.url]
          : video.snippet.thumbnails?.default?.url
            ? [video.snippet.thumbnails.default.url]
            : [],
      },
      engagement: {
        likes: stats?.statistics ? parseInt(stats.statistics.likeCount || '0') : 0,
        views: stats?.statistics ? parseInt(stats.statistics.viewCount || '0') : 0,
        comments: stats?.statistics ? parseInt(stats.statistics.commentCount || '0') : 0,
      },
      metadata: {
        postUrl: `https://www.youtube.com/watch?v=${videoId}`,
        timestamp: new Date(video.snippet.publishedAt),
        hashtags: this.extractHashtags(video.snippet.description || ''),
        mentions: this.extractMentions(video.snippet.description || ''),
      },
      rawData: video,
    };
  }

  private parseScrapedVideo(_$: cheerio.Root, element: cheerio.Cheerio): SocialMediaPost | null {
    try {
      const title = element.find('#video-title').text();
      const channelName = element.find('#channel-name a').text();
      const views = element.find('#metadata-line span').first().text();
      const videoLink = element.find('#video-title').attr('href');

      if (!title || !videoLink) return null;

      return {
        id: this.generatePostId(SocialPlatform.YOUTUBE),
        platform: SocialPlatform.YOUTUBE,
        author: {
          username: channelName || 'unknown',
          displayName: channelName,
        },
        content: {
          text: this.cleanText(title),
          videos: [`https://www.youtube.com${videoLink}`],
        },
        engagement: {
          views: this.parseViewCount(views),
        },
        metadata: {
          postUrl: `https://www.youtube.com${videoLink}`,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      console.error('Error parsing scraped YouTube video:', error);
      return null;
    }
  }

  private parseViewCount(viewText: string): number {
    if (!viewText) return 0;

    const match = viewText.match(/([0-9,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''));
    }

    return 0;
  }

  private buildSearchQuery(): string {
    const parts: string[] = [];

    if (this.config.searchTerms?.length) {
      parts.push(...this.config.searchTerms);
    }

    return parts.join(' OR ');
  }

  private async crawlChannelsWithApi(): Promise<UserProfile[]> {
    if (!this.credentials?.apiKey) {
      throw new Error('YouTube API key is required');
    }

    const profiles: UserProfile[] = [];

    if (!this.config.searchTerms?.length) {
      throw new Error('Search terms are required for channel search');
    }

    for (const searchTerm of this.config.searchTerms) {
      try {
        console.log(`🔍 Searching YouTube for channels matching: ${searchTerm}`);

        // YouTube API v3 search endpoint for channels
        const maxResults = Math.min(this.config.maxProfiles || 10, 50);
        const url = `https://www.googleapis.com/youtube/v3/search`;
        const params = new URLSearchParams({
          key: this.credentials.apiKey,
          q: searchTerm,
          part: 'snippet',
          type: 'channel',
          maxResults: maxResults.toString(),
        });

        const searchData = await this.makeApiRequest<YouTubeApiResponse>(
          `${url}?${params.toString()}`
        );

        if (searchData.items && searchData.items.length > 0) {
          console.log(`📊 YouTube API returned ${searchData.items.length} channels`);

          // Get detailed channel information
          const channelIds = searchData.items
            .map((item) => {
              if (typeof item.id === 'string') return item.id;
              if (item.snippet?.channelId) return item.snippet.channelId;
              return null;
            })
            .filter((id) => id !== null) as string[];

          const channelUrl = `https://www.googleapis.com/youtube/v3/channels`;
          const channelParams = new URLSearchParams({
            key: this.credentials.apiKey,
            id: channelIds.join(','),
            part: 'snippet,statistics,brandingSettings',
          });

          const channelData = await this.makeApiRequest<{ items?: YouTubeChannel[] }>(
            `${channelUrl}?${channelParams.toString()}`
          );

          if (channelData.items) {
            for (const channel of channelData.items) {
              const profile = this.parseApiChannel(channel, searchTerm);
              profiles.push(profile);
            }
          }
        } else {
          console.log(`⚠️ No channels found for search term: ${searchTerm}`);
        }
      } catch (error) {
        console.error(`❌ Channel search failed for "${searchTerm}":`, error);
        continue;
      }
    }

    return profiles;
  }

  private async crawlChannelsWithScraping(): Promise<UserProfile[]> {
    console.log('⚠️ Warning: YouTube channel scraping may be limited without API');

    await this.initBrowser();
    const profiles: UserProfile[] = [];

    try {
      if (!this.config.searchTerms?.length) {
        throw new Error('Search terms are required for channel search');
      }

      for (const searchTerm of this.config.searchTerms) {
        try {
          console.log(`🔍 Searching for YouTube channels matching: ${searchTerm}`);

          // Method 1: Try direct channel access if it looks like a channel name
          if (this.isValidChannelHandle(searchTerm)) {
            const profile = await this.scrapeChannelDirectly(searchTerm);
            if (profile) {
              profiles.push(profile);
              console.log(`✅ Found channel: @${searchTerm}`);
            }
          }

          // Method 2: Try YouTube search
          const searchProfiles = await this.searchChannelsViaScraping(searchTerm);
          profiles.push(...searchProfiles);

          if (profiles.length >= (this.config.maxProfiles || 10)) {
            break;
          }
        } catch (error) {
          console.error(`❌ Channel scraping failed for "${searchTerm}":`, error);
          continue;
        }
      }
    } finally {
      await this.closeBrowser();
    }

    return profiles;
  }

  private async scrapeChannelDirectly(channelHandle: string): Promise<UserProfile | null> {
    try {
      // Try different URL formats for YouTube channels
      const possibleUrls = [
        `https://www.youtube.com/@${channelHandle}`,
        `https://www.youtube.com/c/${channelHandle}`,
        `https://www.youtube.com/user/${channelHandle}`,
      ];

      for (const url of possibleUrls) {
        try {
          console.log(`📍 Checking channel URL: ${url}`);
          await this.navigateToUrl(url);

          const currentUrl = await this.page!.url();
          if (!currentUrl.includes('channel') && !currentUrl.includes('@')) {
            continue; // Try next URL format
          }

          const html = await this.getPageContent();
          const $ = this.parseWithCheerio(html);

          // Extract channel information
          const channelName =
            $('meta[name="title"]').attr('content') ||
            $('meta[property="og:title"]').attr('content');
          const description =
            $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content');
          const avatar = $('meta[property="og:image"]').attr('content');

          // Try to extract subscriber count from page
          let subscribers = 0;
          const subscriberText = html.match(/(\d+(?:\.\d+)?[KMB]?) subscribers/i);
          if (subscriberText) {
            subscribers = this.parseSubscriberCount(subscriberText[1]);
          }

          if (channelName) {
            return {
              id: this.generatePostId(SocialPlatform.YOUTUBE, channelHandle),
              platform: SocialPlatform.YOUTUBE,
              username: channelHandle,
              displayName: channelName,
              description: description,
              profileUrl: currentUrl,
              avatarUrl: avatar,
              verified: html.includes('verified') || html.includes('Verified'),
              metrics: {
                followers: subscribers > 0 ? subscribers : undefined,
              },
              matchReason: `Direct channel access for "${channelHandle}"`,
              metadata: {},
            };
          }
        } catch (error) {
          console.log(`❌ Failed to access ${url}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error(`Error scraping YouTube channel ${channelHandle}:`, error);
    }

    return null;
  }

  private async searchChannelsViaScraping(searchTerm: string): Promise<UserProfile[]> {
    const profiles: UserProfile[] = [];

    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}&sp=EgIQAg%253D%253D`; // Channel filter
      console.log(`🌐 YouTube channel search: ${searchUrl}`);

      await this.navigateToUrl(searchUrl);
      await this.scrollToLoadContent();

      const html = await this.getPageContent();
      const $ = this.parseWithCheerio(html);

      // Look for channel results in search
      $('a[href*="/channel/"], a[href*="/@"]').each((index, element) => {
        if (profiles.length >= (this.config.maxProfiles || 10)) return false;

        try {
          const $element = $(element);
          const href = $element.attr('href');
          const channelName = $element.text().trim();

          if (href && channelName && channelName.toLowerCase().includes(searchTerm.toLowerCase())) {
            const channelId = href.includes('/@')
              ? href.split('/@')[1].split('/')[0]
              : href.split('/channel/')[1]?.split('/')[0];

            if (channelId && !profiles.find((p) => p.username === channelId)) {
              profiles.push({
                id: this.generatePostId(SocialPlatform.YOUTUBE, channelId),
                platform: SocialPlatform.YOUTUBE,
                username: channelId,
                displayName: channelName,
                profileUrl: `https://www.youtube.com${href}`,
                matchReason: `Channel name "${channelName}" contains "${searchTerm}"`,
                metadata: {},
              });
            }
          }
        } catch (error) {
          console.error(`Error parsing channel element ${index}:`, error);
        }
      });

      console.log(`📊 Found ${profiles.length} channels from search`);
    } catch (error) {
      console.log(`❌ YouTube channel search failed for: ${searchTerm}`, error);
    }

    return profiles;
  }

  private parseApiChannel(channel: YouTubeChannel, searchTerm: string): UserProfile {
    return {
      id: this.generatePostId(SocialPlatform.YOUTUBE, channel.id),
      platform: SocialPlatform.YOUTUBE,
      username: channel.snippet.customUrl || channel.id,
      displayName: channel.snippet.title,
      description: channel.snippet.description,
      profileUrl: `https://www.youtube.com/channel/${channel.id}`,
      avatarUrl: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
      bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl,
      verified: false, // YouTube API doesn't easily expose verification status
      metrics: {
        followers: channel.statistics?.subscriberCount
          ? parseInt(channel.statistics.subscriberCount)
          : undefined,
        posts: channel.statistics?.videoCount ? parseInt(channel.statistics.videoCount) : undefined,
      },
      metadata: {
        createdAt: new Date(channel.snippet.publishedAt),
        location: channel.snippet.country,
      },
      matchReason: `Channel matches search term "${searchTerm}"`,
      rawData: channel,
    };
  }

  private parseSubscriberCount(text: string): number {
    const num = parseFloat(text);

    if (text.includes('K')) return Math.floor(num * 1000);
    if (text.includes('M')) return Math.floor(num * 1000000);
    if (text.includes('B')) return Math.floor(num * 1000000000);

    return Math.floor(num) || 0;
  }

  private isValidChannelHandle(str: string): boolean {
    // YouTube channel handles can be 3-30 characters, alphanumeric and some special chars
    return /^[a-zA-Z0-9._-]{3,30}$/.test(str);
  }
}
