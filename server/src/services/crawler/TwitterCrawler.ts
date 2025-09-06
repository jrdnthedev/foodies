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
  UserProfile,
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

    const isProfileSearch = this.config.searchType === 'profiles';

    console.log(`🐦 Starting Twitter ${isProfileSearch ? 'profile' : 'post'} crawl with config:`, {
      searchType: this.config.searchType || 'posts',
      searchTerms: this.config.searchTerms,
      hashtags: this.config.hashtags,
      usernames: this.config.usernames,
      maxResults: isProfileSearch ? this.config.maxProfiles : this.config.maxPosts,
      hasApiCredentials: !!this.credentials?.bearerToken,
    });

    const posts: SocialMediaPost[] = [];
    const profiles: UserProfile[] = [];
    const errors: string[] = [];

    try {
      if (isProfileSearch) {
        // Search for user profiles
        if (this.credentials?.bearerToken) {
          console.log('🔑 Using Twitter API for profile search');
          const apiProfiles = await this.crawlProfilesWithApi();
          profiles.push(...apiProfiles);
          console.log(`✅ Twitter API returned ${apiProfiles.length} profiles`);
        } else {
          console.log('🕷️ Falling back to web scraping for profiles (no API credentials)');
          const scrapedProfiles = await this.crawlProfilesWithScraping();
          profiles.push(...scrapedProfiles);
          console.log(`✅ Twitter scraping returned ${scrapedProfiles.length} profiles`);
        }
      } else {
        // Original post search functionality
        if (this.credentials?.bearerToken) {
          console.log('🔑 Using Twitter API with bearer token');
          const apiPosts = await this.crawlWithApi();
          posts.push(...apiPosts);
          console.log(`✅ Twitter API returned ${apiPosts.length} posts`);
        } else {
          console.log('🕷️ Falling back to web scraping (no API credentials)');
          const scrapedPosts = await this.crawlWithScraping();
          posts.push(...scrapedPosts);
          console.log(`✅ Twitter scraping returned ${scrapedPosts.length} posts`);
        }
      }
    } catch (error) {
      const errorMessage = `Twitter crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMessage);
      errors.push(errorMessage);
    }

    const result: CrawlerResult = {
      metadata: {
        totalFound: isProfileSearch ? profiles.length : posts.length,
        crawledAt: new Date(),
        searchQuery: this.buildSearchQuery(),
        platform: SocialPlatform.TWITTER,
        searchType: isProfileSearch ? 'profiles' : 'posts',
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    if (isProfileSearch) {
      result.profiles = profiles.slice(0, this.config.maxProfiles || 50);
    } else {
      result.posts = posts.slice(0, this.config.maxPosts || 50);
    }

    console.log(`🎯 Twitter ${isProfileSearch ? 'profile' : 'post'} crawl complete:`, {
      resultsFound: isProfileSearch ? result.profiles?.length : result.posts?.length,
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

      // Enhanced error handling for common issues
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as {
          response?: {
            status: number;
            data?: { errors?: Array<{ title: string; detail: string }> };
            headers?: Record<string, string>;
          };
        };
        const status = axiosError.response?.status;
        const errorData = axiosError.response?.data;

        if (status === 400) {
          console.error('🚫 Bad Request (400) - Possible issues:');
          if (errorData?.errors) {
            errorData.errors.forEach((err: { title: string; detail: string }) => {
              console.error(`   - ${err.title}: ${err.detail}`);
            });
          }
          console.error('   - Your Bearer Token might be invalid or expired');
          console.error('   - Check your Twitter Developer Portal for valid credentials');
          console.error('   - Ensure your app has the correct permissions');
        } else if (status === 401) {
          console.error('🚫 Unauthorized (401) - Invalid or expired Bearer Token');
        } else if (status === 403) {
          console.error('🚫 Forbidden (403) - Account suspended or insufficient permissions');
        } else if (status === 429) {
          console.error('🚫 Rate Limited (429) - Too many requests, wait before retrying');
          const resetTime = axiosError.response?.headers?.['x-rate-limit-reset'];
          if (resetTime) {
            const resetDate = new Date(parseInt(resetTime) * 1000);
            console.error(`   - Rate limit resets at: ${resetDate.toLocaleString()}`);
          }
        }
      }

      throw error;
    }

    return posts;
  }

  private async crawlWithScraping(): Promise<SocialMediaPost[]> {
    console.log('⚠️ Warning: Twitter web scraping requires authentication and may violate ToS');
    console.log('🔧 Consider using Twitter API v2 with Bearer Token for reliable access');

    await this.initBrowser();
    const posts: SocialMediaPost[] = [];

    try {
      const searchQuery = this.buildSearchQuery();
      if (!searchQuery.trim()) {
        throw new Error('Search query cannot be empty');
      }

      // Try alternative approaches before direct scraping
      const alternativeResults = await this.tryAlternativeApproaches(searchQuery);
      if (alternativeResults.length > 0) {
        return alternativeResults;
      }

      // Note: Twitter/X has strong anti-scraping measures and requires login
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query&f=live`;

      console.log('🌐 Attempting Twitter search (likely to fail without auth):', searchUrl);

      // Enhanced stealth measures
      if (this.page) {
        // More aggressive stealth
        await this.setupStealthMode();

        // Set additional headers
        await this.page.setExtraHTTPHeaders({
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Cache-Control': 'no-cache',
          'Upgrade-Insecure-Requests': '1',
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

  private async crawlProfilesWithApi(): Promise<UserProfile[]> {
    if (!this.credentials?.bearerToken) {
      throw new Error('Twitter API credentials not provided');
    }

    const profiles: UserProfile[] = [];

    if (!this.config.searchTerms?.length) {
      throw new Error('Search terms are required for profile search');
    }

    // Twitter API v2 users search endpoint
    const maxResults = Math.min(this.config.maxProfiles || 10, 100);

    for (const searchTerm of this.config.searchTerms) {
      try {
        // Try searching by display name using Twitter's user search endpoint
        const searchUrl = `https://api.x.com/2/users/search`;
        const params = new URLSearchParams({
          q: searchTerm,
          max_results: maxResults.toString(),
          'user.fields':
            'created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type',
        });

        const fullUrl = `${searchUrl}?${params.toString()}`;

        console.log('🐦 Making Twitter User Search API request:', fullUrl);

        try {
          const data = await this.makeApiRequest<{
            data?: TwitterUser[];
            meta?: { result_count?: number; next_token?: string };
          }>(fullUrl, {
            Authorization: `Bearer ${this.credentials.bearerToken}`,
          });

          if (data.data && data.data.length > 0) {
            console.log(`📊 Twitter User API response: ${data.data.length} users found`);

            for (const user of data.data) {
              const profile = this.parseApiUserProfile(user, searchTerm);
              profiles.push(profile);
            }
          } else {
            console.log(`⚠️ No users found for search term: ${searchTerm}`);
          }
        } catch (apiError) {
          console.log(`❌ User search API failed for "${searchTerm}", trying username lookup...`);

          // Fallback: try direct username lookup if the search term could be a username
          if (this.isValidUsername(searchTerm)) {
            try {
              const userUrl = `https://api.x.com/2/users/by/username/${searchTerm}`;
              const userParams = new URLSearchParams({
                'user.fields':
                  'created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type',
              });

              const userData = await this.makeApiRequest<{ data?: TwitterUser }>(
                `${userUrl}?${userParams.toString()}`,
                { Authorization: `Bearer ${this.credentials.bearerToken}` }
              );

              if (userData.data) {
                const profile = this.parseApiUserProfile(userData.data, searchTerm);
                profiles.push(profile);
                console.log(`✅ Found user by username: ${searchTerm}`);
              }
            } catch {
              console.log(`❌ Username lookup failed for: ${searchTerm}`);
              throw apiError; // Re-throw original error
            }
          } else {
            throw apiError;
          }
        }
      } catch (error) {
        console.error(`❌ Profile search failed for "${searchTerm}":`, error);
        continue; // Continue with next search term
      }
    }

    return profiles;
  }

  private async crawlProfilesWithScraping(): Promise<UserProfile[]> {
    console.log('⚠️ Warning: Twitter profile scraping requires authentication and may violate ToS');
    console.log('🔧 Consider using Twitter API v2 with Bearer Token for reliable access');

    await this.initBrowser();
    const profiles: UserProfile[] = [];

    try {
      if (!this.config.searchTerms?.length) {
        throw new Error('Search terms are required for profile search');
      }

      for (const searchTerm of this.config.searchTerms) {
        try {
          console.log(`🔍 Searching for profiles matching: ${searchTerm}`);

          // Try different approaches for profile search
          await this.searchProfilesByScraping(searchTerm, profiles);

          if (profiles.length >= (this.config.maxProfiles || 10)) {
            break; // Stop if we have enough profiles
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

  private async searchProfilesByScraping(
    searchTerm: string,
    profiles: UserProfile[]
  ): Promise<void> {
    // Method 1: Try direct username access if it looks like a username
    if (this.isValidUsername(searchTerm)) {
      try {
        const profileUrl = `https://x.com/${searchTerm}`;
        console.log(`📍 Checking direct profile URL: ${profileUrl}`);

        await this.navigateToUrl(profileUrl);
        const currentUrl = await this.page!.url();

        if (!currentUrl.includes('login') && !currentUrl.includes('suspended')) {
          const profile = await this.scrapeProfileFromPage(searchTerm, searchTerm);
          if (profile) {
            profiles.push(profile);
            console.log(`✅ Found profile for username: ${searchTerm}`);
            return;
          }
        }
      } catch {
        console.log(`❌ Direct profile access failed for: ${searchTerm}`);
      }
    }

    // Method 2: Try Twitter search for people
    try {
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(searchTerm)}&src=typed_query&f=user`;
      console.log(`🌐 Trying Twitter people search: ${searchUrl}`);

      await this.navigateToUrl(searchUrl);

      // Check if we're blocked or redirected
      const currentUrl = await this.page!.url();
      if (currentUrl.includes('login') || currentUrl.includes('i/flow')) {
        console.log('🚫 X/Twitter requires authentication for people search');
        throw new Error('Authentication required');
      }

      // Wait for results to load
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await this.scrollToLoadContent();

      const html = await this.getPageContent();
      const $ = this.parseWithCheerio(html);

      // Try to find user profile elements in search results
      const profileElements = $(
        '[data-testid="UserCell"], [data-testid="user-cell"], [data-testid="User-Names"]'
      );

      console.log(`📊 Found ${profileElements.length} potential profile elements`);

      profileElements.each((index, element) => {
        if (profiles.length >= (this.config.maxProfiles || 10)) return false; // Stop processing

        try {
          const $element = $(element);
          const username = this.extractUsernameFromElement($element);
          const displayName = this.extractDisplayNameFromElement($element);

          if (username && this.profileMatchesSearch(username, displayName, searchTerm)) {
            const profile: UserProfile = {
              id: this.generatePostId(SocialPlatform.TWITTER, username),
              platform: SocialPlatform.TWITTER,
              username: username,
              displayName: displayName,
              profileUrl: `https://x.com/${username}`,
              avatarUrl: this.extractAvatarFromElement($element),
              verified: this.extractVerificationFromElement($element),
              matchReason: `Username or display name contains "${searchTerm}"`,
              metadata: {
                isPrivate: false,
              },
            };

            profiles.push(profile);
            console.log(`✅ Found matching profile: @${username} (${displayName})`);
          }
        } catch (error) {
          console.error(`Error parsing profile element ${index}:`, error);
        }
      });
    } catch (error) {
      console.log(`❌ People search failed for: ${searchTerm}`, error);
    }
  }

  private async scrapeProfileFromPage(
    username: string,
    searchTerm: string
  ): Promise<UserProfile | null> {
    try {
      const html = await this.getPageContent();
      const $ = this.parseWithCheerio(html);

      // Try to extract profile information from the page
      const displayName = $('[data-testid="UserName"] span').first().text() || username;
      const description = $('[data-testid="UserDescription"]').text().trim();
      const avatar = $('[data-testid="UserAvatar"] img').attr('src');
      const isVerified = $('[data-testid="UserName"] svg[aria-label*="Verified"]').length > 0;

      // Extract metrics if available
      const followersText = $('[href$="/followers"] span').last().text();
      const followingText = $('[href$="/following"] span').last().text();

      const followers = this.parseNumber(followersText);
      const following = this.parseNumber(followingText);

      return {
        id: this.generatePostId(SocialPlatform.TWITTER, username),
        platform: SocialPlatform.TWITTER,
        username: username,
        displayName: displayName,
        description: description || undefined,
        profileUrl: `https://x.com/${username}`,
        avatarUrl: avatar,
        verified: isVerified,
        metrics: {
          followers: followers > 0 ? followers : undefined,
          following: following > 0 ? following : undefined,
        },
        matchReason: `Profile found for search term "${searchTerm}"`,
        metadata: {
          isPrivate: html.includes('protected') || html.includes('private'),
        },
      };
    } catch (error) {
      console.error('Error scraping profile page:', error);
      return null;
    }
  }

  private parseApiUserProfile(user: TwitterUser, searchTerm: string): UserProfile {
    return {
      id: this.generatePostId(SocialPlatform.TWITTER, user.id),
      platform: SocialPlatform.TWITTER,
      username: user.username,
      displayName: user.name,
      description: user.description,
      profileUrl: `https://x.com/${user.username}`,
      avatarUrl: user.profile_image_url,
      verified: user.verified || false,
      metrics: {
        followers: user.public_metrics?.followers_count,
        following: user.public_metrics?.following_count,
        posts: user.public_metrics?.tweet_count,
      },
      metadata: {
        createdAt: user.created_at ? new Date(user.created_at) : undefined,
        location: user.location,
        website: user.url,
      },
      matchReason: `Profile matches search term "${searchTerm}"`,
      rawData: user,
    };
  }

  private isValidUsername(str: string): boolean {
    // Twitter usernames are 1-15 characters, alphanumeric plus underscore
    return /^[a-zA-Z0-9_]{1,15}$/.test(str);
  }

  private profileMatchesSearch(
    username: string,
    displayName: string | undefined,
    searchTerm: string
  ): boolean {
    const term = searchTerm.toLowerCase();
    const usernameMatch = username.toLowerCase().includes(term);
    const displayNameMatch = displayName?.toLowerCase().includes(term);

    return usernameMatch || !!displayNameMatch;
  }

  private extractUsernameFromElement($element: cheerio.Cheerio): string | null {
    // Try various selectors for username
    const selectors = [
      'a[href^="/"]',
      '[data-testid="User-Names"] a',
      '.username',
      '[data-testid="UserName"] a',
    ];

    for (const selector of selectors) {
      const href = $element.find(selector).attr('href');
      if (href && href.startsWith('/') && href.length > 1) {
        return href.substring(1).split('/')[0]; // Remove leading slash and get username
      }
    }

    return null;
  }

  private extractDisplayNameFromElement($element: cheerio.Cheerio): string | undefined {
    const selectors = [
      '[data-testid="User-Names"] span',
      '.display-name',
      '[data-testid="UserName"] span',
    ];

    for (const selector of selectors) {
      const name = $element.find(selector).first().text().trim();
      if (name && !name.startsWith('@')) {
        return name;
      }
    }

    return undefined;
  }

  private extractAvatarFromElement($element: cheerio.Cheerio): string | undefined {
    return $element.find('img[src*="profile_images"]').attr('src');
  }

  private extractVerificationFromElement($element: cheerio.Cheerio): boolean {
    return $element.find('svg[aria-label*="Verified"]').length > 0;
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

  /**
   * Try alternative approaches before falling back to direct scraping
   */
  private async tryAlternativeApproaches(searchQuery: string): Promise<SocialMediaPost[]> {
    console.log('🔍 Trying alternative approaches for Twitter content...');

    // Approach 1: Try Nitter instances (privacy-focused Twitter frontend)
    try {
      const nitterResults = await this.tryNitterScraping(searchQuery);
      if (nitterResults.length > 0) {
        console.log(`✅ Found ${nitterResults.length} posts via Nitter`);
        return nitterResults;
      }
    } catch (error) {
      console.log(
        '❌ Nitter approach failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // Approach 2: Try guest access patterns
    try {
      const guestResults = await this.tryGuestAccess();
      if (guestResults.length > 0) {
        console.log(`✅ Found ${guestResults.length} posts via guest access`);
        return guestResults;
      }
    } catch (error) {
      console.log(
        '❌ Guest access failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    return [];
  }

  /**
   * Enhanced stealth mode setup
   */
  private async setupStealthMode(): Promise<void> {
    if (!this.page) return;

    // Simple request interception to block unnecessary resources
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['stylesheet', 'image', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Add random delays to appear more human-like
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000));
  }

  /**
   * Try scraping via Nitter instances
   */
  private async tryNitterScraping(searchQuery: string): Promise<SocialMediaPost[]> {
    const nitterInstances = [
      'https://nitter.net',
      'https://nitter.it',
      'https://nitter.snopyta.org',
      'https://nitter.nixnet.services',
    ];

    for (const instance of nitterInstances) {
      try {
        console.log(`🦅 Trying Nitter instance: ${instance}`);
        const searchUrl = `${instance}/search?f=tweets&q=${encodeURIComponent(searchQuery)}`;

        await this.navigateToUrl(searchUrl);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const html = await this.getPageContent();
        const $ = this.parseWithCheerio(html);

        const posts: SocialMediaPost[] = [];

        // Nitter uses different selectors than Twitter
        $('.timeline-item').each((_, element) => {
          const $element = $(element);
          const text = $element.find('.tweet-content').text().trim();
          const username = $element.find('.username').text().trim().replace('@', '');
          const displayName = $element.find('.fullname').text().trim();

          if (text && username) {
            posts.push({
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
                likes: 0,
                shares: 0,
                comments: 0,
              },
              metadata: {
                postUrl: `https://x.com/${username}/status/unknown`,
                timestamp: new Date(),
                hashtags: this.extractHashtags(text),
                mentions: this.extractMentions(text),
              },
            });
          }
        });

        if (posts.length > 0) {
          return posts;
        }
      } catch (error) {
        console.log(
          `❌ Nitter instance ${instance} failed:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        continue;
      }
    }

    return [];
  }

  /**
   * Try guest access patterns
   */
  private async tryGuestAccess(): Promise<SocialMediaPost[]> {
    try {
      // Some Twitter endpoints might still work with guest tokens
      console.log('🎭 Attempting guest access patterns...');

      // This is a placeholder for guest access implementation
      // Guest access requires reverse-engineering Twitter's guest token system
      // which is complex and may violate ToS

      console.log('⚠️ Guest access not fully implemented - requires Twitter guest token system');
      return [];
    } catch (error) {
      console.log(
        '❌ Guest access failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return [];
    }
  }
}
