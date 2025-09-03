import { SocialMediaCrawler } from './SocialMediaCrawler';
import { ScheduleParser } from '../parser/schedule-parser';
import {
  CrawlerConfig,
  SocialPlatform,
  ApiCredentials,
  SocialMediaPost,
  CrawlerResult,
} from '../../types/crawler';
import { Schedule } from '../../types/vendor';

export interface ScheduleCrawlerConfig extends CrawlerConfig {
  vendorId?: string;
  vendorName?: string;
  socialHandle?: string;
  minConfidence?: number; // Minimum confidence score for schedule extraction (0-1)
}

export interface ScheduleCrawlerResult {
  vendor: {
    id: string;
    name?: string;
    socialHandle?: string;
  };
  schedules: Schedule[];
  posts: SocialMediaPost[];
  crawlResults: Record<SocialPlatform, CrawlerResult>;
  summary: {
    totalPosts: number;
    totalSchedules: number;
    averageConfidence: number;
    platformBreakdown: Record<SocialPlatform, number>;
    errors: string[];
  };
}

export class ScheduleCrawlerService {
  private socialMediaCrawler: SocialMediaCrawler;
  private minConfidence: number;

  constructor(credentials: ApiCredentials = {}, options: { minConfidence?: number } = {}) {
    this.socialMediaCrawler = new SocialMediaCrawler(credentials);
    this.minConfidence = options.minConfidence || 0.5;
  }

  /**
   * Crawl social media platforms for a specific vendor and extract schedule information
   */
  async crawlVendorSchedules(config: ScheduleCrawlerConfig): Promise<ScheduleCrawlerResult> {
    const errors: string[] = [];

    try {
      // Build crawler config for vendor-specific search
      const crawlerConfig = this.buildCrawlerConfig(config);

      // Determine which platforms to search
      const platforms = this.determinePlatforms(config);

      // Crawl all platforms
      const crawlResults = await this.socialMediaCrawler.crawlMultiplePlatforms(
        platforms,
        crawlerConfig
      );

      // Collect all posts
      const allPosts: SocialMediaPost[] = [];
      for (const result of Object.values(crawlResults)) {
        allPosts.push(...result.posts);
        if (result.errors) {
          errors.push(...result.errors);
        }
      }

      // Extract schedules from posts
      const schedules = this.extractSchedulesFromPosts(
        allPosts,
        config.vendorId || 'unknown',
        config.minConfidence || this.minConfidence
      );

      // Calculate summary statistics
      const summary = this.calculateSummary(allPosts, schedules, crawlResults, errors);

      return {
        vendor: {
          id: config.vendorId || 'unknown',
          name: config.vendorName,
          socialHandle: config.socialHandle,
        },
        schedules,
        posts: allPosts,
        crawlResults,
        summary,
      };
    } catch (error) {
      throw new Error(
        `Schedule crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Crawl multiple vendors' schedules
   */
  async crawlMultipleVendorSchedules(
    vendors: Array<{
      id: string;
      name?: string;
      socialHandle?: string;
      searchTerms?: string[];
      hashtags?: string[];
    }>,
    baseConfig: Omit<ScheduleCrawlerConfig, 'vendorId' | 'vendorName' | 'socialHandle'> = {}
  ): Promise<ScheduleCrawlerResult[]> {
    const results: ScheduleCrawlerResult[] = [];

    for (const vendor of vendors) {
      try {
        const vendorConfig: ScheduleCrawlerConfig = {
          ...baseConfig,
          vendorId: vendor.id,
          vendorName: vendor.name,
          socialHandle: vendor.socialHandle,
          searchTerms: [
            ...(baseConfig.searchTerms || []),
            ...(vendor.searchTerms || []),
            vendor.name || '',
          ].filter(Boolean),
          hashtags: [...(baseConfig.hashtags || []), ...(vendor.hashtags || [])],
          usernames: vendor.socialHandle ? [vendor.socialHandle] : baseConfig.usernames,
        };

        const result = await this.crawlVendorSchedules(vendorConfig);
        results.push(result);

        // Add small delay between vendor crawls to be respectful to APIs
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to crawl vendor ${vendor.id}:`, error);
        // Continue with other vendors even if one fails
      }
    }

    return results;
  }

  /**
   * Extract schedule information from posts with confidence filtering
   */
  private extractSchedulesFromPosts(
    posts: SocialMediaPost[],
    vendorId: string,
    minConfidence: number = 0.5
  ): Schedule[] {
    const schedules: Schedule[] = [];

    for (const post of posts) {
      try {
        const parsed = ScheduleParser.parseScheduleFromPost(post, vendorId);

        if (parsed.isValidSchedule && parsed.schedule.confidence >= minConfidence) {
          const schedule = ScheduleParser.toVendorSchedule(parsed, vendorId);
          if (schedule) {
            schedules.push(schedule);
          }
        }
      } catch (error) {
        console.error('Error parsing schedule from post:', error);
      }
    }

    return this.deduplicateAndSortSchedules(schedules);
  }

  /**
   * Build crawler configuration based on vendor information
   */
  private buildCrawlerConfig(config: ScheduleCrawlerConfig): CrawlerConfig {
    const searchTerms = [
      ...(config.searchTerms || []),
      config.vendorName || '',
      'food truck',
      'schedule',
      'location',
      'serving',
      'open',
    ].filter(Boolean);

    const hashtags = [...(config.hashtags || []), 'foodtruck', 'foodie', 'schedule'];

    return {
      searchTerms,
      hashtags,
      usernames: config.socialHandle ? [config.socialHandle] : config.usernames,
      maxPosts: config.maxPosts || 50,
      dateRange: config.dateRange || {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
        to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Next 2 weeks
      },
      includeReplies: config.includeReplies || false,
      includeRetweets: config.includeRetweets || true,
    };
  }

  /**
   * Determine which platforms to search based on configuration
   */
  private determinePlatforms(config: ScheduleCrawlerConfig): SocialPlatform[] {
    if (config.platform) {
      return [config.platform];
    }

    // Default to all platforms
    return [
      SocialPlatform.TWITTER,
      SocialPlatform.INSTAGRAM,
      SocialPlatform.REDDIT,
      SocialPlatform.YOUTUBE,
    ];
  }

  /**
   * Calculate summary statistics for the crawl result
   */
  private calculateSummary(
    posts: SocialMediaPost[],
    schedules: Schedule[],
    crawlResults: Record<SocialPlatform, CrawlerResult>,
    errors: string[]
  ): ScheduleCrawlerResult['summary'] {
    const platformBreakdown: Record<SocialPlatform, number> = {} as Record<SocialPlatform, number>;

    for (const [platform, result] of Object.entries(crawlResults)) {
      platformBreakdown[platform as SocialPlatform] = result.posts.length;
    }

    // Calculate average confidence of extracted schedules
    const confidenceSum = posts.reduce((sum, post) => {
      const parsed = ScheduleParser.parseScheduleFromPost(post);
      return sum + parsed.schedule.confidence;
    }, 0);

    const averageConfidence = posts.length > 0 ? confidenceSum / posts.length : 0;

    return {
      totalPosts: posts.length,
      totalSchedules: schedules.length,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      platformBreakdown,
      errors,
    };
  }

  /**
   * Remove duplicate schedules and sort by date
   */
  private deduplicateAndSortSchedules(schedules: Schedule[]): Schedule[] {
    const seen = new Set<string>();
    const unique: Schedule[] = [];

    for (const schedule of schedules) {
      const key = `${schedule.vendorId}-${schedule.date}-${schedule.startTime}-${schedule.location}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(schedule);
      }
    }

    return unique.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get schedule data for a specific date range
   */
  async getSchedulesForDateRange(
    vendorId: string,
    dateRange: { from: Date; to: Date },
    config: Omit<ScheduleCrawlerConfig, 'vendorId' | 'dateRange'> = {}
  ): Promise<Schedule[]> {
    const result = await this.crawlVendorSchedules({
      ...config,
      vendorId,
      dateRange,
    });

    return result.schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= dateRange.from && scheduleDate <= dateRange.to;
    });
  }

  /**
   * Update minimum confidence threshold
   */
  setMinConfidence(confidence: number): void {
    if (confidence < 0 || confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }
    this.minConfidence = confidence;
  }
}
