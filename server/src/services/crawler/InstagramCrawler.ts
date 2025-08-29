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

    const posts: SocialMediaPost[] = [];
    const errors: string[] = [];

    try {
      // Try Instagram Basic Display API if credentials are available
      if (this.credentials?.accessToken) {
        const apiPosts = await this.crawlWithApi();
        posts.push(...apiPosts);
      } else {
        // Fall back to web scraping (limited due to Instagram's restrictions)
        const scrapedPosts = await this.crawlWithScraping();
        posts.push(...scrapedPosts);
      }
    } catch (error) {
      errors.push(
        `Instagram crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return {
      posts: posts.slice(0, this.config.maxPosts || 50),
      metadata: {
        totalFound: posts.length,
        crawledAt: new Date(),
        searchQuery: this.buildSearchQuery(),
        platform: SocialPlatform.INSTAGRAM,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
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
}
