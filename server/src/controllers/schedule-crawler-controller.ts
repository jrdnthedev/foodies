import { Request, Response } from 'express';
import { ScheduleCrawlerService } from '../services/crawler/ScheduleCrawlerService';
import { ScheduleConfidenceService, ActivityLog } from '../services/ScheduleConfidenceService';
import { ApiCredentials, SocialPlatform } from '../types/crawler';
import { Schedule } from '../types/vendor';

export class ScheduleCrawlerController {
  private scheduleCrawlerService: ScheduleCrawlerService;
  private scheduleConfidenceService: ScheduleConfidenceService;

  constructor() {
    // Initialize with environment-based credentials
    const credentials: ApiCredentials = {
      twitter: {
        bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
      },
      instagram: {
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
        clientId: process.env.INSTAGRAM_CLIENT_ID,
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      },
      reddit: {
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        userAgent: process.env.REDDIT_USER_AGENT || 'Foodies Schedule Crawler',
      },
      youtube: {
        apiKey: process.env.YOUTUBE_API_KEY || '',
      },
    };

    this.scheduleCrawlerService = new ScheduleCrawlerService(credentials, {
      minConfidence: 0.5,
    });

    this.scheduleConfidenceService = new ScheduleConfidenceService(0.5);
  }

  /**
   * Crawl schedules for a single vendor
   * POST /api/crawler/vendor-schedule
   */
  async crawlVendorSchedule(req: Request, res: Response): Promise<void> {
    try {
      const {
        vendorId,
        vendorName,
        socialHandle,
        searchTerms,
        hashtags,
        usernames,
        platform,
        maxPosts,
        dateRange,
        minConfidence,
      } = req.body;

      if (!vendorId && !vendorName && !socialHandle) {
        res.status(400).json({
          error: 'At least one of vendorId, vendorName, or socialHandle is required',
        });
        return;
      }

      const config = {
        vendorId: vendorId || `temp_${Date.now()}`,
        vendorName,
        socialHandle,
        searchTerms,
        hashtags,
        usernames,
        platform: platform as SocialPlatform,
        maxPosts: maxPosts || 50,
        dateRange: dateRange
          ? {
              from: new Date(dateRange.from),
              to: new Date(dateRange.to),
            }
          : undefined,
        minConfidence: minConfidence || 0.5,
      };

      const result = await this.scheduleCrawlerService.crawlVendorSchedules(config);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error crawling vendor schedule:', error);
      res.status(500).json({
        error: 'Failed to crawl vendor schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Crawl schedules for multiple vendors
   * POST /api/crawler/multiple-vendor-schedules
   */
  async crawlMultipleVendorSchedules(req: Request, res: Response): Promise<void> {
    try {
      const { vendors, baseConfig } = req.body;

      if (!Array.isArray(vendors) || vendors.length === 0) {
        res.status(400).json({
          error: 'vendors array is required and must not be empty',
        });
        return;
      }

      // Validate vendor objects
      for (const vendor of vendors) {
        if (!vendor.id && !vendor.name && !vendor.socialHandle) {
          res.status(400).json({
            error: 'Each vendor must have at least one of: id, name, or socialHandle',
          });
          return;
        }
      }

      const results = await this.scheduleCrawlerService.crawlMultipleVendorSchedules(
        vendors,
        baseConfig || {}
      );

      res.json({
        success: true,
        data: {
          vendors: results,
          summary: {
            totalVendors: vendors.length,
            successfulCrawls: results.length,
            totalSchedules: results.reduce((sum, r) => sum + r.schedules.length, 0),
            totalPosts: results.reduce((sum, r) => sum + r.posts.length, 0),
          },
        },
      });
    } catch (error) {
      console.error('Error crawling multiple vendor schedules:', error);
      res.status(500).json({
        error: 'Failed to crawl multiple vendor schedules',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get schedules for a specific date range
   * GET /api/crawler/schedules/:vendorId
   */
  async getSchedulesForDateRange(req: Request, res: Response): Promise<void> {
    try {
      const { vendorId } = req.params;
      const { from, to, vendorName, socialHandle, platform } = req.query;

      if (!from || !to) {
        res.status(400).json({
          error: 'from and to date parameters are required',
        });
        return;
      }

      const dateRange = {
        from: new Date(from as string),
        to: new Date(to as string),
      };

      if (isNaN(dateRange.from.getTime()) || isNaN(dateRange.to.getTime())) {
        res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)',
        });
        return;
      }

      const schedules = await this.scheduleCrawlerService.getSchedulesForDateRange(
        vendorId,
        dateRange,
        {
          vendorName: vendorName as string,
          socialHandle: socialHandle as string,
          platform: platform as SocialPlatform,
        }
      );

      res.json({
        success: true,
        data: {
          vendorId,
          dateRange,
          schedules,
          totalSchedules: schedules.length,
        },
      });
    } catch (error) {
      console.error('Error getting schedules for date range:', error);
      res.status(500).json({
        error: 'Failed to get schedules for date range',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Test schedule parsing without crawling
   * POST /api/crawler/test-parse
   */
  async testScheduleParsing(req: Request, res: Response): Promise<void> {
    try {
      const { text, vendorId } = req.body;

      if (!text) {
        res.status(400).json({
          error: 'text parameter is required',
        });
        return;
      }

      // Import ScheduleParser here to avoid circular dependency issues
      const { ScheduleParser } = await import('../services/parser/schedule-parser');

      const parsed = ScheduleParser.parseSchedule(text);
      const schedule = vendorId
        ? ScheduleParser.toVendorSchedule(
            {
              schedule: parsed,
              isValidSchedule: parsed.confidence >= 0.5,
              vendorId,
              source: 'test',
            },
            vendorId
          )
        : null;

      res.json({
        success: true,
        data: {
          parsed,
          schedule,
          isValid: parsed.confidence >= 0.5,
        },
      });
    } catch (error) {
      console.error('Error testing schedule parsing:', error);
      res.status(500).json({
        error: 'Failed to test schedule parsing',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update crawler configuration
   * PUT /api/crawler/config
   */
  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const { minConfidence } = req.body;

      if (minConfidence !== undefined) {
        if (typeof minConfidence !== 'number' || minConfidence < 0 || minConfidence > 1) {
          res.status(400).json({
            error: 'minConfidence must be a number between 0 and 1',
          });
          return;
        }

        this.scheduleCrawlerService.setMinConfidence(minConfidence);
      }

      res.json({
        success: true,
        message: 'Configuration updated successfully',
      });
    } catch (error) {
      console.error('Error updating crawler configuration:', error);
      res.status(500).json({
        error: 'Failed to update configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Process schedules with detailed confidence logging (hybrid approach)
   * POST /api/schedule-crawler/process-with-logging
   */
  async processSchedulesWithLogging(req: Request, res: Response): Promise<void> {
    try {
      const {
        vendorId,
        vendorName,
        socialHandle,
        searchTerms,
        hashtags,
        existingSchedules = [],
        includeAnalytics = true,
      } = req.body;

      if (!vendorId) {
        res.status(400).json({
          error: 'vendorId is required',
        });
        return;
      }

      // First crawl the social media posts
      const crawlResult = await this.scheduleCrawlerService.crawlVendorSchedules({
        vendorId,
        vendorName,
        socialHandle,
        searchTerms,
        hashtags,
        maxPosts: 30,
      });

      // Then process with confidence logging
      const processingResult = await this.scheduleConfidenceService.processMultipleSchedules(
        crawlResult.posts,
        vendorId,
        existingSchedules
      );

      const response: {
        success: boolean;
        data: {
          vendorId: string;
          schedules: Schedule[];
          summary: {
            created: number;
            updated: number;
            rejected: number;
            duplicates: number;
          };
          totalPosts: number;
          totalActivityLogs: number;
          analytics?: {
            averageConfidence: number;
            confidenceDistribution: Record<string, number>;
            sourceBreakdown: Record<string, number>;
            actionBreakdown: Record<string, number>;
            platformBreakdown: Record<string, number>;
          };
          activityLogs?: ActivityLog[];
        };
      } = {
        success: true,
        data: {
          vendorId,
          schedules: processingResult.schedules,
          summary: processingResult.summary,
          totalPosts: crawlResult.posts.length,
          totalActivityLogs: processingResult.activityLogs.length,
        },
      };

      // Include analytics if requested
      if (includeAnalytics) {
        response.data.analytics = this.scheduleConfidenceService.getScheduleAnalytics(
          processingResult.activityLogs
        );
      }

      // Include activity logs for debugging (optionally)
      if (req.query.includeActivityLogs === 'true') {
        response.data.activityLogs = processingResult.activityLogs;
      }

      res.json(response);
    } catch (error) {
      console.error('Error processing schedules with logging:', error);
      res.status(500).json({
        error: 'Failed to process schedules with logging',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get schedule analytics
   * GET /api/schedule-crawler/analytics/:vendorId
   */
  async getScheduleAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { vendorId } = req.params;
      const { from, to } = req.query;

      // In a real implementation, you would fetch activity logs from your database
      // For now, we'll return a mock response showing the structure
      const mockActivityLogs = [
        {
          id: 'activity_1',
          vendorId,
          timestamp: new Date(),
          source: 'twitter:123',
          confidenceScore: 0.85,
          action: 'schedule_detected' as const,
          metadata: {
            platform: 'twitter',
            originalText: 'Tomorrow at Central Park 11am-2pm!',
          },
        },
      ];

      const analytics = this.scheduleConfidenceService.getScheduleAnalytics(mockActivityLogs);

      res.json({
        success: true,
        data: {
          vendorId,
          dateRange: { from, to },
          analytics,
          totalActivities: mockActivityLogs.length,
        },
      });
    } catch (error) {
      console.error('Error getting schedule analytics:', error);
      res.status(500).json({
        error: 'Failed to get schedule analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  async healthCheck(_: Request, res: Response): Promise<void> {
    try {
      const hasCredentials = {
        twitter: !!process.env.TWITTER_BEARER_TOKEN,
        instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
        reddit: !!process.env.REDDIT_CLIENT_ID,
        youtube: !!process.env.YOUTUBE_API_KEY,
      };

      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        credentials: hasCredentials,
        availablePlatforms: Object.entries(hasCredentials)
          .filter(([, hasToken]) => hasToken)
          .map(([platform]) => platform),
      });
    } catch (error) {
      console.error('Error checking health:', error);
      res.status(500).json({
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
