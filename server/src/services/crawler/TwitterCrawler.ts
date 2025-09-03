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

    console.log('🐦 Starting Twitter crawl with config:', {
      searchTerms: this.config.searchTerms,
      hashtags: this.config.hashtags,
      usernames: this.config.usernames,
      maxPosts: this.config.maxPosts,
      hasApiCredentials: !!this.credentials?.bearerToken,
    });

    const posts: SocialMediaPost[] = [];
    const errors: string[] = [];

    try {
      // Try API first if credentials are available
      if (this.credentials?.bearerToken) {
        console.log('🔑 Using Twitter API with bearer token');
        const apiPosts = await this.crawlWithApi();
        posts.push(...apiPosts);
        console.log(`✅ Twitter API returned ${apiPosts.length} posts`);
      } else {
        console.log('🕷️ Falling back to web scraping (no API credentials)');
        // Fall back to web scraping
        const scrapedPosts = await this.crawlWithScraping();
        posts.push(...scrapedPosts);
        console.log(`✅ Twitter scraping returned ${scrapedPosts.length} posts`);
      }
    } catch (error) {
      const errorMessage = `Twitter crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMessage);
      errors.push(errorMessage);
    }

    const result = {
      posts: posts.slice(0, this.config.maxPosts || 50),
      metadata: {
        totalFound: posts.length,
        crawledAt: new Date(),
        searchQuery: this.buildSearchQuery(),
        platform: SocialPlatform.TWITTER,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('🎯 Twitter crawl complete:', {
      postsFound: result.posts.length,
      totalFound: result.metadata.totalFound,
      hasErrors: !!result.errors?.length,
    });

    return result;
  }

  private async crawlWithApi(): Promise<SocialMediaPost[]> {
    if (!this.credentials?.bearerToken) {
      throw new Error('Twitter API credentials not provided');
    }

    const posts: SocialMediaPost[] = [];
    const searchQuery = this.buildSearchQuery();

    if (!searchQuery.trim()) {
      throw new Error('Search query cannot be empty');
    }

    // Twitter API v2 search endpoint with proper parameters
    const maxResults = Math.min(this.config.maxPosts || 10, 100);
    const url = `https://api.x.com/2/tweets/search/recent`;

    const params = new URLSearchParams({
      query: searchQuery,
      max_results: maxResults.toString(),
      'tweet.fields': 'created_at,author_id,public_metrics,context_annotations,lang',
      expansions: 'author_id',
      'user.fields': 'username,name,verified,profile_image_url,public_metrics',
    });

    const fullUrl = `${url}?${params.toString()}`;

    try {
      console.log('🐦 Making Twitter API request:', fullUrl);

      const data = await this.makeApiRequest<TwitterApiResponse>(fullUrl, {
        Authorization: `Bearer ${this.credentials.bearerToken}`,
      });

      console.log('📊 Twitter API response:', {
        dataCount: data.data?.length || 0,
        usersCount: data.includes?.users?.length || 0,
        meta: data.meta,
      });

      if (data.data && data.data.length > 0) {
        const users = data.includes?.users || [];
        const userMap = new Map(users.map((user: TwitterUser) => [user.id, user]));

        for (const tweet of data.data) {
          const author = tweet.author_id ? userMap.get(tweet.author_id) : undefined;
          const post = this.parseApiTweet(tweet, author);
          posts.push(post);
        }
      } else {
        console.log('⚠️ No tweets found in API response');
      }
    } catch (error) {
      console.error('❌ Twitter API request failed:', error);
      throw error;
    }

    return posts;
  }

  private async crawlWithScraping(): Promise<SocialMediaPost[]> {
    console.log('⚠️ Warning: Twitter web scraping is very limited due to anti-bot measures');

    await this.initBrowser();
    const posts: SocialMediaPost[] = [];

    try {
      const searchQuery = this.buildSearchQuery();
      if (!searchQuery.trim()) {
        throw new Error('Search query cannot be empty');
      }

      // Note: Twitter/X has strong anti-scraping measures
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query&f=live`;

      console.log('🌐 Navigating to Twitter search:', searchUrl);

      // Add more stealth-like behavior
      if (this.page) {
        // Disable images and CSS to speed up loading and reduce detection
        await this.page.setRequestInterception(true);
        this.page.on('request', (req) => {
          const resourceType = req.resourceType();
          if (
            resourceType === 'stylesheet' ||
            resourceType === 'image' ||
            resourceType === 'font'
          ) {
            req.abort();
          } else {
            req.continue();
          }
        });
      }

      await this.navigateToUrl(searchUrl);

      // Check if we're being redirected or blocked
      const currentUrl = await this.page!.url();
      console.log('📍 Current URL after navigation:', currentUrl);

      if (currentUrl.includes('login') || currentUrl.includes('i/flow')) {
        console.log('� X/Twitter is requiring login - cannot proceed with scraping');
        throw new Error('X/Twitter requires authentication for search results');
      }

      // Wait longer for dynamic content and try different waiting strategies
      console.log('⏳ Waiting for content to load...');

      try {
        // Try to wait for common X elements
        await this.page!.waitForSelector('main[role="main"]', { timeout: 10000 });
      } catch {
        console.log('⚠️ Main element not found, continuing anyway...');
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      await this.scrollToLoadContent();

      // Get page title and check for blocks
      const pageTitle = await this.page!.title();
      console.log('📄 Page title:', pageTitle);

      const html = await this.getPageContent();

      // Debug: Log a sample of the HTML to see what we're getting
      console.log('📝 HTML sample (first 500 chars):', html.substring(0, 500));
      console.log('📝 HTML contains "tweet":', html.includes('tweet'));
      console.log('📝 HTML contains "article":', html.includes('article'));
      console.log('📝 HTML contains "data-testid":', html.includes('data-testid'));

      const $ = this.parseWithCheerio(html);

      console.log('� Looking for tweet elements...');

      // Try multiple selectors that X/Twitter might use
      const selectors = [
        'article[data-testid="tweet"]',
        'div[data-testid="tweet"]',
        '[data-testid="tweet"]',
        'article',
        'div[data-testid="tweetText"]',
        '[data-testid="tweetText"]',
        'div[role="article"]',
      ];

      let foundElements = 0;

      for (const selector of selectors) {
        const elements = $(selector);
        foundElements = elements.length;
        console.log(`� Selector "${selector}" found ${foundElements} elements`);

        if (foundElements > 0) {
          elements.each((_index: number, element: cheerio.Element) => {
            try {
              const $element = $(element);

              // Try to extract any text content
              const textContent = $element.text().trim();
              console.log(`📝 Element ${_index} text preview:`, textContent.substring(0, 100));

              if (selector.includes('tweet') && !selector.includes('tweetText')) {
                // Try to parse as full tweet
                const post = this.parseScrapedTweet($, $element);
                if (post) {
                  posts.push(post);
                }
              } else if (textContent && textContent.length > 20) {
                // Create basic post from text content
                posts.push({
                  id: this.generatePostId(SocialPlatform.TWITTER),
                  platform: SocialPlatform.TWITTER,
                  author: {
                    username: 'unknown',
                    displayName: 'Unknown User',
                  },
                  content: {
                    text: this.cleanText(textContent),
                    hashtags: this.extractHashtags(textContent),
                    mentions: this.extractMentions(textContent),
                    links: this.extractUrls(textContent),
                  },
                  engagement: {
                    likes: 0,
                    shares: 0,
                    comments: 0,
                  },
                  metadata: {
                    postUrl: searchUrl,
                    timestamp: new Date(),
                    hashtags: this.extractHashtags(textContent),
                    mentions: this.extractMentions(textContent),
                  },
                });
              }
            } catch (error) {
              console.error('Error parsing element:', error);
            }
          });

          if (posts.length > 0) {
            console.log(`✅ Found posts using selector: ${selector}`);
            break; // Stop trying other selectors if we found something
          }
        }
      }

      console.log(`📊 Found ${foundElements} elements total, parsed ${posts.length} posts`);

      // If still no posts, let's try to see what content is actually available
      if (posts.length === 0) {
        console.log('🔍 No posts found, investigating page structure...');

        // Check for common blocking indicators
        const blockingIndicators = [
          'rate limit',
          'try again',
          'login',
          'sign in',
          'verify',
          'suspicious',
          'automated',
        ];

        const lowercaseHtml = html.toLowerCase();
        for (const indicator of blockingIndicators) {
          if (lowercaseHtml.includes(indicator)) {
            console.log(`🚫 Possible blocking detected: "${indicator}" found in page content`);
          }
        }

        // Look for any text that might indicate what's happening
        const bodyText = $('body').text().substring(0, 1000);
        console.log('📄 Body text sample:', bodyText);
      }
    } catch (error) {
      console.error('❌ Twitter scraping failed:', error);
      throw error;
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
        profileUrl: author?.username ? `https://x.com/${author.username}` : undefined,
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
        views: 0, // impression_count not available in this API response
      },
      metadata: {
        postUrl: `https://x.com/${author?.username}/status/${tweet.id}`,
        timestamp: tweet.created_at ? new Date(tweet.created_at) : new Date(),
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
          profileUrl: `https://x.com/${username}`,
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
          postUrl: `https://x.com/${username}/status/unknown`,
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

    const query = parts.join(' OR ');
    console.log('🔍 Built search query:', query);

    return query;
  }
}
