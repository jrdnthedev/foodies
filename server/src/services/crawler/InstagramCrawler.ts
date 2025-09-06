import { BaseCrawler } from './BaseCrawler';
import {
  SocialMediaPost,
  CrawlerResult,
  SocialPlatform,
  ApiCredentials,
  CrawlerConfig,
  ScrapingOptions,
  InstagramApiResponse,
  InstagramMedia,
  UserProfile,
} from '../../types/crawler';

export class InstagramCrawler extends BaseCrawler {
  private credentials?: ApiCredentials['instagram'];

  constructor(
    config: CrawlerConfig,
    options: ScrapingOptions = {},
    credentials?: ApiCredentials['instagram']
  ) {
    super(config, options);
    this.credentials = credentials;
  }

  validateConfig(): boolean {
    return !!(this.config.hashtags?.length || this.config.usernames?.length);
  }

  async crawl(): Promise<CrawlerResult> {
    if (!this.validateConfig()) {
      throw new Error('Invalid configuration: At least one hashtag or username is required');
    }

    const isProfileSearch = this.config.searchType === 'profiles';
    const posts: SocialMediaPost[] = [];
    const profiles: UserProfile[] = [];
    const errors: string[] = [];

    try {
      if (isProfileSearch) {
        // Search for user profiles
        if (this.credentials?.accessToken) {
          console.log('🔑 Using Instagram API for profile search');
          const apiProfiles = await this.crawlProfilesWithApi();
          profiles.push(...apiProfiles);
        } else {
          console.log('🕷️ Falling back to web scraping for profiles (no API credentials)');
          const scrapedProfiles = await this.crawlProfilesWithScraping();
          profiles.push(...scrapedProfiles);
        }
      } else {
        // Try Instagram Basic Display API if credentials are available
        if (this.credentials?.accessToken) {
          const apiPosts = await this.crawlWithApi();
          posts.push(...apiPosts);
        } else {
          // Fall back to web scraping (limited due to Instagram's restrictions)
          const scrapedPosts = await this.crawlWithScraping();
          posts.push(...scrapedPosts);
        }
      }
    } catch (error) {
      errors.push(
        `Instagram crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    const result: CrawlerResult = {
      metadata: {
        totalFound: isProfileSearch ? profiles.length : posts.length,
        crawledAt: new Date(),
        searchQuery: this.buildSearchQuery(),
        platform: SocialPlatform.INSTAGRAM,
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
    if (!this.credentials?.accessToken) {
      throw new Error('Instagram API credentials not provided');
    }

    const posts: SocialMediaPost[] = [];

    // Instagram Basic Display API - get user's own media
    const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${this.credentials.accessToken}`;

    try {
      const data = await this.makeApiRequest<InstagramApiResponse>(url);

      if (data.data) {
        for (const media of data.data) {
          const post = this.parseApiPost(media);
          posts.push(post);
        }
      }
    } catch (error) {
      console.error('Instagram API request failed:', error);
      throw error;
    }

    return posts;
  }

  private async crawlWithScraping(): Promise<SocialMediaPost[]> {
    await this.initBrowser();
    const posts: SocialMediaPost[] = [];

    try {
      // Instagram heavily restricts scraping, so this is very limited
      if (this.config.hashtags?.length) {
        for (const hashtag of this.config.hashtags) {
          const hashtagPosts = await this.scrapeHashtag(hashtag);
          posts.push(...hashtagPosts);
        }
      }

      if (this.config.usernames?.length) {
        for (const username of this.config.usernames) {
          const userPosts = await this.scrapeUserProfile(username);
          posts.push(...userPosts);
        }
      }
    } finally {
      await this.closeBrowser();
    }

    return posts;
  }

  private async scrapeHashtag(hashtag: string): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];

    try {
      const url = `https://www.instagram.com/explore/tags/${hashtag}/`;
      await this.navigateToUrl(url);

      // Wait for content to load
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const html = await this.getPageContent();
      const $ = this.parseWithCheerio(html);

      // Instagram's structure is complex and changes frequently
      // This is a simplified example
      $('article a').each((_index: number, element: cheerio.Element) => {
        const href = $(element).attr('href');
        if (href && href.includes('/p/')) {
          // Extract basic post info from thumbnail view
          const post: SocialMediaPost = {
            id: this.generatePostId(SocialPlatform.INSTAGRAM),
            platform: SocialPlatform.INSTAGRAM,
            author: {
              username: 'unknown',
            },
            content: {
              text: `Post from hashtag #${hashtag}`,
            },
            engagement: {},
            metadata: {
              postUrl: `https://www.instagram.com${href}`,
              timestamp: new Date(),
              hashtags: [hashtag],
            },
          };
          posts.push(post);
        }
      });
    } catch (error) {
      console.error(`Error scraping hashtag ${hashtag}:`, error);
    }

    return posts;
  }

  private async scrapeUserProfile(username: string): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];

    try {
      const url = `https://www.instagram.com/${username}/`;
      await this.navigateToUrl(url);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const html = await this.getPageContent();
      const $ = this.parseWithCheerio(html);

      // Extract posts from profile grid
      $('article a').each((_index: number, element: cheerio.Element) => {
        const href = $(element).attr('href');
        if (href && href.includes('/p/')) {
          const post: SocialMediaPost = {
            id: this.generatePostId(SocialPlatform.INSTAGRAM),
            platform: SocialPlatform.INSTAGRAM,
            author: {
              username,
              profileUrl: `https://www.instagram.com/${username}/`,
            },
            content: {
              text: `Post by @${username}`,
            },
            engagement: {},
            metadata: {
              postUrl: `https://www.instagram.com${href}`,
              timestamp: new Date(),
            },
          };
          posts.push(post);
        }
      });
    } catch (error) {
      console.error(`Error scraping user ${username}:`, error);
    }

    return posts;
  }

  private parseApiPost(media: InstagramMedia): SocialMediaPost {
    return {
      id: this.generatePostId(SocialPlatform.INSTAGRAM, media.id),
      platform: SocialPlatform.INSTAGRAM,
      author: {
        username: 'me', // API only returns user's own posts
      },
      content: {
        text: media.caption || '',
        images: media.media_type === 'IMAGE' ? [media.media_url] : [],
        videos: media.media_type === 'VIDEO' ? [media.media_url] : [],
      },
      engagement: {},
      metadata: {
        postUrl: media.permalink,
        timestamp: new Date(media.timestamp),
        hashtags: media.caption ? this.extractHashtags(media.caption) : [],
        mentions: media.caption ? this.extractMentions(media.caption) : [],
      },
      rawData: media,
    };
  }

  private buildSearchQuery(): string {
    const parts: string[] = [];

    if (this.config.hashtags?.length) {
      parts.push(...this.config.hashtags.map((tag: string) => `#${tag}`));
    }

    if (this.config.usernames?.length) {
      parts.push(...this.config.usernames.map((user: string) => `@${user}`));
    }

    return parts.join(' ');
  }

  private async crawlProfilesWithApi(): Promise<UserProfile[]> {
    console.log('⚠️ Instagram Basic Display API does not support user search');
    console.log('🔧 Instagram profile search requires Instagram Graph API with business account');

    // Instagram Basic Display API is limited to the authenticated user's own content
    // For profile search, we would need Instagram Graph API with proper app review
    throw new Error('Instagram profile search via API is not available with Basic Display API');
  }

  private async crawlProfilesWithScraping(): Promise<UserProfile[]> {
    console.log('⚠️ Warning: Instagram profile scraping is heavily restricted and may violate ToS');
    console.log('🔧 Consider using Instagram Graph API for business accounts');

    await this.initBrowser();
    const profiles: UserProfile[] = [];

    try {
      if (!this.config.searchTerms?.length) {
        throw new Error('Search terms are required for profile search');
      }

      for (const searchTerm of this.config.searchTerms) {
        try {
          console.log(`🔍 Searching for Instagram profiles matching: ${searchTerm}`);

          // Method 1: Try direct username access
          if (this.isValidInstagramUsername(searchTerm)) {
            const profile = await this.scrapeProfileDirectly(searchTerm);
            if (profile) {
              profiles.push(profile);
              console.log(`✅ Found profile: @${searchTerm}`);
            }
          }

          // Method 2: Try Instagram search (very limited without login)
          const searchProfiles = await this.searchProfilesViaScraping(searchTerm);
          profiles.push(...searchProfiles);

          if (profiles.length >= (this.config.maxProfiles || 10)) {
            break;
          }
        } catch (error) {
          console.error(`❌ Profile scraping failed for "${searchTerm}":`, error);
          continue;
        }
      }
    } finally {
      await this.closeBrowser();
    }

    return profiles;
  }

  private async scrapeProfileDirectly(username: string): Promise<UserProfile | null> {
    try {
      const profileUrl = `https://www.instagram.com/${username}/`;
      console.log(`📍 Checking direct profile URL: ${profileUrl}`);

      await this.navigateToUrl(profileUrl);

      // Check if profile exists and is accessible
      const currentUrl = await this.page!.url();
      if (currentUrl.includes('accounts/login') || currentUrl.includes('404')) {
        console.log(`❌ Profile ${username} not found or login required`);
        return null;
      }

      const html = await this.getPageContent();
      const $ = this.parseWithCheerio(html);

      // Try to extract profile data from page
      const displayName = $('meta[property="og:title"]').attr('content')?.split('•')[0]?.trim();
      const description = $('meta[property="og:description"]').attr('content');
      const avatar = $('meta[property="og:image"]').attr('content');

      // Try to extract follower counts from script tags (Instagram loads data via JSON)
      let followers = 0;
      const following = 0;
      const posts = 0;

      const scripts = $('script[type="application/ld+json"]');
      scripts.each((_, script) => {
        try {
          const content = $(script).html();
          if (content) {
            const data = JSON.parse(content);
            if (data.mainEntityOfPage && data.mainEntityOfPage.interactionStatistic) {
              const stats = data.mainEntityOfPage.interactionStatistic;
              stats.forEach((stat: { interactionType: string; userInteractionCount: string }) => {
                if (stat.interactionType === 'http://schema.org/FollowAction') {
                  followers = parseInt(stat.userInteractionCount) || 0;
                }
              });
            }
          }
        } catch {
          // Ignore JSON parsing errors
        }
      });

      return {
        id: this.generatePostId(SocialPlatform.INSTAGRAM, username),
        platform: SocialPlatform.INSTAGRAM,
        username: username,
        displayName: displayName || username,
        description: description,
        profileUrl: profileUrl,
        avatarUrl: avatar,
        verified: html.includes('verified') || html.includes('Verified'),
        metrics: {
          followers: followers > 0 ? followers : undefined,
          following: following > 0 ? following : undefined,
          posts: posts > 0 ? posts : undefined,
        },
        matchReason: `Direct profile access for username "${username}"`,
        metadata: {
          isPrivate: html.includes('This Account is Private'),
          isBusinessAccount: html.includes('Business') || html.includes('business'),
        },
      };
    } catch (error) {
      console.error(`Error scraping Instagram profile ${username}:`, error);
      return null;
    }
  }

  private async searchProfilesViaScraping(searchTerm: string): Promise<UserProfile[]> {
    const profiles: UserProfile[] = [];

    try {
      // Instagram search is very limited without login
      console.log('🚫 Instagram search requires authentication');
      console.log('⚠️ Cannot search for profiles without logging in');

      // Note: Instagram heavily restricts search functionality without authentication
      // Most search features require login and may trigger bot detection
    } catch (error) {
      console.log(`❌ Instagram search failed for: ${searchTerm}`, error);
    }

    return profiles;
  }

  private isValidInstagramUsername(str: string): boolean {
    // Instagram usernames are 1-30 characters, alphanumeric, period, and underscore
    return /^[a-zA-Z0-9._]{1,30}$/.test(str);
  }
}
