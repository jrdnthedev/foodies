import { BaseCrawler } from './BaseCrawler';
import {
  SocialMediaPost,
  CrawlerResult,
  SocialPlatform,
  ApiCredentials,
  CrawlerConfig,
  ScrapingOptions,
  TwitterApiResponse,
  TwitterTweet,
  TwitterUser,
} from '../../types/crawler';

export class TwitterCrawler extends BaseCrawler {
  private credentials?: ApiCredentials['twitter'];

  constructor(
    config: CrawlerConfig,
    options: ScrapingOptions = {},
    credentials?: ApiCredentials['twitter']
  ) {
    super(config, options);
    this.credentials = credentials;
  }

  validateConfig(): boolean {
    return !!(
      this.config.searchTerms?.length ||
      this.config.hashtags?.length ||
      this.config.usernames?.length
    );
  }

  async crawl(): Promise<CrawlerResult> {
    if (!this.validateConfig()) {
      throw new Error(
        'Invalid configuration: At least one search term, hashtag, or username is required'
      );
    }

    const posts: SocialMediaPost[] = [];
    const errors: string[] = [];

    try {
      // Try API first if credentials are available
      if (this.credentials?.bearerToken) {
        const apiPosts = await this.crawlWithApi();
        posts.push(...apiPosts);
      } else {
        // Fall back to web scraping
        const scrapedPosts = await this.crawlWithScraping();
        posts.push(...scrapedPosts);
      }
    } catch (error) {
      errors.push(
        `Twitter crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return {
      posts: posts.slice(0, this.config.maxPosts || 50),
      metadata: {
        totalFound: posts.length,
        crawledAt: new Date(),
        searchQuery: this.buildSearchQuery(),
        platform: SocialPlatform.TWITTER,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async crawlWithApi(): Promise<SocialMediaPost[]> {
    if (!this.credentials?.bearerToken) {
      throw new Error('Twitter API credentials not provided');
    }

    const posts: SocialMediaPost[] = [];
    const searchQuery = this.buildSearchQuery();

    // Twitter API v2 search endpoint
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(searchQuery)}&max_results=${Math.min(this.config.maxPosts || 10, 100)}&tweet.fields=created_at,author_id,public_metrics,context_annotations&expansions=author_id&user.fields=username,name,verified,profile_image_url`;

    try {
      const data = await this.makeApiRequest<TwitterApiResponse>(url, {
        Authorization: `Bearer ${this.credentials.bearerToken}`,
      });

      if (data.data) {
        const users = data.includes?.users || [];
        const userMap = new Map(users.map((user: TwitterUser) => [user.id, user]));

        for (const tweet of data.data) {
          const author = userMap.get(tweet.author_id);
          const post = this.parseApiTweet(tweet, author);
          posts.push(post);
        }
      }
    } catch (error) {
      console.error('Twitter API request failed:', error);
      throw error;
    }

    return posts;
  }

  private async crawlWithScraping(): Promise<SocialMediaPost[]> {
    await this.initBrowser();
    const posts: SocialMediaPost[] = [];

    try {
      // Note: Twitter/X has strong anti-scraping measures
      // This is a basic example - in practice, you'd need more sophisticated techniques
      const searchQuery = this.buildSearchQuery();
      const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query&f=live`;

      await this.navigateToUrl(searchUrl);
      await this.scrollToLoadContent();

      const html = await this.getPageContent();
      const $ = this.parseWithCheerio(html);

      // Twitter's DOM structure changes frequently, so this is a simplified example
      $('article[data-testid="tweet"]').each((_index: number, element: cheerio.Element) => {
        try {
          const post = this.parseScrapedTweet($, $(element));
          if (post) {
            posts.push(post);
          }
        } catch (error) {
          console.error('Error parsing tweet:', error);
        }
      });
    } finally {
      await this.closeBrowser();
    }

    return posts;
  }

  private parseApiTweet(tweet: TwitterTweet, author?: TwitterUser): SocialMediaPost {
    return {
      id: this.generatePostId(SocialPlatform.TWITTER, tweet.id),
      platform: SocialPlatform.TWITTER,
      author: {
        username: author?.username || 'unknown',
        displayName: author?.name,
        profileUrl: author?.username ? `https://twitter.com/${author.username}` : undefined,
        avatarUrl: author?.profile_image_url,
        verified: author?.verified || false,
      },
      content: {
        text: tweet.text,
        hashtags: this.extractHashtags(tweet.text),
        mentions: this.extractMentions(tweet.text),
        links: this.extractUrls(tweet.text),
      },
      engagement: {
        likes: tweet.public_metrics?.like_count || 0,
        shares: tweet.public_metrics?.retweet_count || 0,
        comments: tweet.public_metrics?.reply_count || 0,
        views: tweet.public_metrics?.impression_count || 0,
      },
      metadata: {
        postUrl: `https://twitter.com/${author?.username}/status/${tweet.id}`,
        timestamp: new Date(tweet.created_at),
        hashtags: this.extractHashtags(tweet.text),
        mentions: this.extractMentions(tweet.text),
      },
      rawData: tweet,
    };
  }

  private parseScrapedTweet(_$: cheerio.Root, element: cheerio.Cheerio): SocialMediaPost | null {
    try {
      const text = element.find('[data-testid="tweetText"]').text();
      const username =
        element.find('[data-testid="User-Name"] a').first().attr('href')?.replace('/', '') ||
        'unknown';
      const displayName = element.find('[data-testid="User-Name"] span').first().text();

      // Extract engagement metrics (these selectors may need updating)
      const likes = this.parseNumber(element.find('[data-testid="like"]').text());
      const retweets = this.parseNumber(element.find('[data-testid="retweet"]').text());
      const replies = this.parseNumber(element.find('[data-testid="reply"]').text());

      return {
        id: this.generatePostId(SocialPlatform.TWITTER),
        platform: SocialPlatform.TWITTER,
        author: {
          username,
          displayName,
          profileUrl: `https://twitter.com/${username}`,
        },
        content: {
          text: this.cleanText(text),
          hashtags: this.extractHashtags(text),
          mentions: this.extractMentions(text),
          links: this.extractUrls(text),
        },
        engagement: {
          likes,
          shares: retweets,
          comments: replies,
        },
        metadata: {
          postUrl: `https://twitter.com/${username}/status/unknown`,
          timestamp: new Date(),
          hashtags: this.extractHashtags(text),
          mentions: this.extractMentions(text),
        },
      };
    } catch (error) {
      console.error('Error parsing scraped tweet:', error);
      return null;
    }
  }

  private parseNumber(text: string): number {
    if (!text) return 0;

    const cleanText = text.replace(/[^\d.KMB]/gi, '');
    const num = parseFloat(cleanText);

    if (text.includes('K')) return Math.floor(num * 1000);
    if (text.includes('M')) return Math.floor(num * 1000000);
    if (text.includes('B')) return Math.floor(num * 1000000000);

    return Math.floor(num) || 0;
  }

  private buildSearchQuery(): string {
    const parts: string[] = [];

    if (this.config.searchTerms?.length) {
      parts.push(...this.config.searchTerms);
    }

    if (this.config.hashtags?.length) {
      parts.push(...this.config.hashtags.map((tag: string) => `#${tag}`));
    }

    if (this.config.usernames?.length) {
      parts.push(...this.config.usernames.map((user: string) => `from:${user}`));
    }

    return parts.join(' OR ');
  }
}
