import { BaseCrawler } from './BaseCrawler';
import {
  SocialMediaPost,
  CrawlerResult,
  SocialPlatform,
  ApiCredentials,
  CrawlerConfig,
  ScrapingOptions,
  RedditApiResponse,
  RedditPost,
} from '../../types/crawler';

export class RedditCrawler extends BaseCrawler {
  private credentials?: ApiCredentials['reddit'];

  constructor(
    config: CrawlerConfig,
    options: ScrapingOptions = {},
    credentials?: ApiCredentials['reddit']
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
      // Reddit has a public JSON API that doesn't require authentication for basic access
      const apiPosts = await this.crawlWithApi();
      posts.push(...apiPosts);
    } catch (error) {
      errors.push(
        `Reddit crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // Fall back to web scraping if API fails
      try {
        const scrapedPosts = await this.crawlWithScraping();
        posts.push(...scrapedPosts);
      } catch (scrapeError) {
        errors.push(
          `Reddit scraping failed: ${scrapeError instanceof Error ? scrapeError.message : 'Unknown error'}`
        );
      }
    }

    return {
      posts: posts.slice(0, this.config.maxPosts || 50),
      metadata: {
        totalFound: posts.length,
        crawledAt: new Date(),
        searchQuery: this.buildSearchQuery(),
        platform: SocialPlatform.REDDIT,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async crawlWithApi(): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];

    // Reddit's JSON API endpoints
    if (this.config.searchTerms?.length) {
      for (const term of this.config.searchTerms) {
        const searchPosts = await this.searchReddit(term);
        posts.push(...searchPosts);
      }
    }

    if (this.config.usernames?.length) {
      for (const username of this.config.usernames) {
        const userPosts = await this.getUserPosts(username);
        posts.push(...userPosts);
      }
    }

    return posts;
  }

  private async searchReddit(searchTerm: string): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    const limit = Math.min(this.config.maxPosts || 25, 100);

    try {
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(searchTerm)}&limit=${limit}&sort=new`;
      const data = await this.makeApiRequest<RedditApiResponse>(url, {
        'User-Agent': this.credentials?.userAgent || this.options.userAgent!,
      });

      if (data.data?.children) {
        for (const child of data.data.children) {
          const post = this.parseRedditPost(child.data);
          posts.push(post);
        }
      }
    } catch (error) {
      console.error(`Error searching Reddit for "${searchTerm}":`, error);
      throw error;
    }

    return posts;
  }

  private async getUserPosts(username: string): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];
    const limit = Math.min(this.config.maxPosts || 25, 100);

    try {
      const url = `https://www.reddit.com/user/${username}/submitted.json?limit=${limit}&sort=new`;
      const data = await this.makeApiRequest<RedditApiResponse>(url, {
        'User-Agent': this.credentials?.userAgent || this.options.userAgent!,
      });

      if (data.data?.children) {
        for (const child of data.data.children) {
          const post = this.parseRedditPost(child.data);
          posts.push(post);
        }
      }
    } catch (error) {
      console.error(`Error getting posts for user ${username}:`, error);
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
          const searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(term)}&sort=new`;
          await this.navigateToUrl(searchUrl);
          await this.scrollToLoadContent();

          const html = await this.getPageContent();
          const $ = this.parseWithCheerio(html);

          // Parse Reddit posts from HTML
          $('[data-testid="post-container"]').each((_index: number, element: cheerio.Element) => {
            try {
              const post = this.parseScrapedPost($, $(element));
              if (post) {
                posts.push(post);
              }
            } catch (error) {
              console.error('Error parsing Reddit post:', error);
            }
          });
        }
      }
    } finally {
      await this.closeBrowser();
    }

    return posts;
  }

  private parseRedditPost(postData: RedditPost): SocialMediaPost {
    return {
      id: this.generatePostId(SocialPlatform.REDDIT, postData.id),
      platform: SocialPlatform.REDDIT,
      author: {
        username: postData.author,
        profileUrl: `https://www.reddit.com/user/${postData.author}`,
      },
      content: {
        text: this.cleanText(
          postData.title + (postData.selftext ? '\n\n' + postData.selftext : '')
        ),
        images: postData.url && this.isImageUrl(postData.url) ? [postData.url] : [],
        videos: postData.url && this.isVideoUrl(postData.url) ? [postData.url] : [],
        links: postData.url ? [postData.url] : [],
      },
      engagement: {
        likes: postData.ups || 0,
        comments: postData.num_comments || 0,
      },
      metadata: {
        postUrl: `https://www.reddit.com${postData.permalink}`,
        timestamp: new Date(postData.created_utc * 1000),
        hashtags: [], // Reddit doesn't use hashtags
        mentions: this.extractMentions(postData.selftext || ''),
      },
      rawData: postData,
    };
  }

  private parseScrapedPost(_$: cheerio.Root, element: cheerio.Cheerio): SocialMediaPost | null {
    try {
      const title = element.find('h3').text();
      const author = element.find('[data-testid="post_author_link"]').text().replace('u/', '');
      const upvotes = this.parseNumber(
        element.find('[data-testid="vote-arrows"] button').first().text()
      );
      const comments = this.parseNumber(element.find('[data-testid="comment-count"]').text());

      return {
        id: this.generatePostId(SocialPlatform.REDDIT),
        platform: SocialPlatform.REDDIT,
        author: {
          username: author || 'unknown',
          profileUrl: `https://www.reddit.com/user/${author}`,
        },
        content: {
          text: this.cleanText(title),
        },
        engagement: {
          likes: upvotes,
          comments,
        },
        metadata: {
          postUrl: 'https://www.reddit.com', // Would need to extract actual URL
          timestamp: new Date(),
        },
      };
    } catch (error) {
      console.error('Error parsing scraped Reddit post:', error);
      return null;
    }
  }

  private parseNumber(text: string): number {
    if (!text) return 0;

    const cleanText = text.replace(/[^\d.k]/gi, '');
    const num = parseFloat(cleanText);

    if (text.toLowerCase().includes('k')) return Math.floor(num * 1000);

    return Math.floor(num) || 0;
  }

  private isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  private isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|mov|avi)$/i.test(url) || url.includes('v.redd.it');
  }

  private buildSearchQuery(): string {
    const parts: string[] = [];

    if (this.config.searchTerms?.length) {
      parts.push(...this.config.searchTerms);
    }

    if (this.config.usernames?.length) {
      parts.push(...this.config.usernames.map((user: string) => `author:${user}`));
    }

    return parts.join(' OR ');
  }
}
