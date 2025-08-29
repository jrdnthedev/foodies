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

    const posts: SocialMediaPost[] = [];
    const errors: string[] = [];

    try {
      // Try YouTube Data API if credentials are available
      if (this.credentials?.apiKey) {
        const apiPosts = await this.crawlWithApi();
        posts.push(...apiPosts);
      } else {
        // Fall back to web scraping
        const scrapedPosts = await this.crawlWithScraping();
        posts.push(...scrapedPosts);
      }
    } catch (error) {
      errors.push(
        `YouTube crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return {
      posts: posts.slice(0, this.config.maxPosts || 50),
      metadata: {
        totalFound: posts.length,
        crawledAt: new Date(),
        searchQuery: this.buildSearchQuery(),
        platform: SocialPlatform.YOUTUBE,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
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
      rawData: { video, stats },
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
}
