import { TwitterCrawler } from './TwitterCrawler';
import { InstagramCrawler } from './InstagramCrawler';
import { RedditCrawler } from './RedditCrawler';
import { YouTubeCrawler } from './YouTubeCrawler';
import {
  SocialMediaPost,
  CrawlerConfig,
  CrawlerResult,
  SocialPlatform,
  ApiCredentials,
  ScrapingOptions,
} from '../../types/crawler';

export class SocialMediaCrawler {
  private credentials: ApiCredentials;
  private defaultOptions: ScrapingOptions;

  constructor(credentials: ApiCredentials = {}, options: ScrapingOptions = {}) {
    this.credentials = credentials;
    this.defaultOptions = {
      headless: true,
      timeout: 30000,
      scrollToLoad: true,
      maxScrolls: 3,
      delay: 2000,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      ...options,
    };
  }

  async crawlPlatform(platform: SocialPlatform, config: CrawlerConfig): Promise<CrawlerResult> {
    const crawlerConfig = { ...config, platform };

    switch (platform) {
      case SocialPlatform.TWITTER:
        // const twitterCrawler = ;
        return await new TwitterCrawler(
          crawlerConfig,
          this.defaultOptions,
          this.credentials.twitter
        ).crawl();

      case SocialPlatform.INSTAGRAM:
        // const instagramCrawler = new InstagramCrawler(crawlerConfig, this.defaultOptions, this.credentials.instagram);
        return await new InstagramCrawler(
          crawlerConfig,
          this.defaultOptions,
          this.credentials.instagram
        ).crawl();

      case SocialPlatform.REDDIT:
        // const redditCrawler = new RedditCrawler(crawlerConfig, this.defaultOptions, this.credentials.reddit);
        return await new RedditCrawler(
          crawlerConfig,
          this.defaultOptions,
          this.credentials.reddit
        ).crawl();

      case SocialPlatform.YOUTUBE:
        // const youtubeCrawler = new YouTubeCrawler(crawlerConfig, this.defaultOptions, this.credentials.youtube);
        return await new YouTubeCrawler(
          crawlerConfig,
          this.defaultOptions,
          this.credentials.youtube
        ).crawl();

      default:
        throw new Error(`Platform ${platform} is not supported yet`);
    }
  }

  async crawlMultiplePlatforms(
    platforms: SocialPlatform[],
    config: CrawlerConfig
  ): Promise<Record<SocialPlatform, CrawlerResult>> {
    const results: Record<string, CrawlerResult> = {};
    const errors: string[] = [];

    // Crawl platforms in parallel for better performance
    const crawlPromises = platforms.map(async (platform) => {
      try {
        const result = await this.crawlPlatform(platform, config);
        results[platform] = result;
      } catch (error) {
        errors.push(`${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Create empty result for failed platform
        results[platform] = {
          posts: [],
          metadata: {
            totalFound: 0,
            crawledAt: new Date(),
            searchQuery: this.buildSearchQuery(config),
            platform,
          },
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    });

    await Promise.allSettled(crawlPromises);

    return results as Record<SocialPlatform, CrawlerResult>;
  }

  async searchAcrossAllPlatforms(config: CrawlerConfig): Promise<{
    allPosts: SocialMediaPost[];
    byPlatform: Record<SocialPlatform, CrawlerResult>;
    summary: {
      totalPosts: number;
      platformCounts: Record<SocialPlatform, number>;
      errors: string[];
    };
  }> {
    const supportedPlatforms = [
      SocialPlatform.TWITTER,
      SocialPlatform.INSTAGRAM,
      SocialPlatform.REDDIT,
      SocialPlatform.YOUTUBE,
    ];

    const byPlatform = await this.crawlMultiplePlatforms(supportedPlatforms, config);

    // Combine all posts
    const allPosts: SocialMediaPost[] = [];
    const platformCounts: Record<string, number> = {};
    const allErrors: string[] = [];

    for (const [platform, result] of Object.entries(byPlatform)) {
      allPosts.push(...result.posts);
      platformCounts[platform] = result.posts.length;
      if (result.errors) {
        allErrors.push(...result.errors.map((err) => `${platform}: ${err}`));
      }
    }

    // Sort by timestamp (newest first)
    allPosts.sort((a, b) => b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime());

    return {
      allPosts: allPosts.slice(0, config.maxPosts || 100),
      byPlatform,
      summary: {
        totalPosts: allPosts.length,
        platformCounts: platformCounts as Record<SocialPlatform, number>,
        errors: allErrors,
      },
    };
  }

  // Utility methods
  filterPostsByDateRange(
    posts: SocialMediaPost[],
    dateRange: { from: Date; to: Date }
  ): SocialMediaPost[] {
    return posts.filter((post) => {
      const postDate = post.metadata.timestamp;
      return postDate >= dateRange.from && postDate <= dateRange.to;
    });
  }

  filterPostsByEngagement(
    posts: SocialMediaPost[],
    minLikes: number = 0,
    minShares: number = 0
  ): SocialMediaPost[] {
    return posts.filter((post) => {
      const likes = post.engagement.likes || 0;
      const shares = post.engagement.shares || 0;
      return likes >= minLikes && shares >= minShares;
    });
  }

  groupPostsByHashtag(posts: SocialMediaPost[]): Record<string, SocialMediaPost[]> {
    const grouped: Record<string, SocialMediaPost[]> = {};

    posts.forEach((post) => {
      const hashtags = post.metadata.hashtags || [];
      hashtags.forEach((hashtag) => {
        if (!grouped[hashtag]) {
          grouped[hashtag] = [];
        }
        grouped[hashtag].push(post);
      });
    });

    return grouped;
  }

  getTopInfluencers(
    posts: SocialMediaPost[],
    limit: number = 10
  ): Array<{
    username: string;
    platform: SocialPlatform;
    postCount: number;
    totalEngagement: number;
    avgEngagement: number;
  }> {
    const influencerMap = new Map<
      string,
      {
        username: string;
        platform: SocialPlatform;
        postCount: number;
        totalEngagement: number;
      }
    >();

    posts.forEach((post) => {
      const key = `${post.author.username}_${post.platform}`;
      const engagement =
        (post.engagement.likes || 0) +
        (post.engagement.shares || 0) +
        (post.engagement.comments || 0);

      if (influencerMap.has(key)) {
        const existing = influencerMap.get(key)!;
        existing.postCount++;
        existing.totalEngagement += engagement;
      } else {
        influencerMap.set(key, {
          username: post.author.username,
          platform: post.platform,
          postCount: 1,
          totalEngagement: engagement,
        });
      }
    });

    return Array.from(influencerMap.values())
      .map((influencer) => ({
        ...influencer,
        avgEngagement: influencer.totalEngagement / influencer.postCount,
      }))
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, limit);
  }

  private buildSearchQuery(config: CrawlerConfig): string {
    const parts: string[] = [];

    if (config.searchTerms?.length) {
      parts.push(...config.searchTerms);
    }

    if (config.hashtags?.length) {
      parts.push(...config.hashtags.map((tag) => `#${tag}`));
    }

    if (config.usernames?.length) {
      parts.push(...config.usernames);
    }

    return parts.join(' OR ');
  }
}
