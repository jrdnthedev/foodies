import { Schedule } from '../types/vendor';
import { SocialMediaPost } from '../types/crawler';
import { ScheduleParser, ScheduleParsingResult } from './parser/schedule-parser';

export interface ActivityLog {
  id: string;
  vendorId: string;
  timestamp: Date;
  source: string;
  confidenceScore: number;
  action: 'schedule_detected' | 'schedule_updated' | 'schedule_rejected' | 'manual_review';
  metadata?: {
    scheduleId?: string;
    originalText?: string;
    parsedData?: {
      date?: string;
      timeRange?: string;
      location?: string;
    };
    platform?: string;
    postId?: string;
  };
}

export interface ScheduleProcessingResult {
  schedule?: Schedule;
  activityLog: ActivityLog;
  action: 'created' | 'updated' | 'rejected' | 'duplicate';
  reason?: string;
}

/**
 * Service that implements the hybrid approach for storing schedule confidence scores
 * - Stores confidence in the Schedule model for operational use
 * - Logs all parsing attempts in ActivityLog for audit and analytics
 */
export class ScheduleConfidenceService {
  private minConfidence: number;

  constructor(minConfidence: number = 0.5) {
    this.minConfidence = minConfidence;
  }

  /**
   * Process a social media post and create both schedule and activity log entries
   */
  async processScheduleFromPost(
    post: SocialMediaPost,
    vendorId: string,
    existingSchedules: Schedule[] = []
  ): Promise<ScheduleProcessingResult> {
    const parseResult = ScheduleParser.parseScheduleFromPost(post, vendorId);

    // Create activity log entry for this parsing attempt
    const activityLog = this.createActivityLog(parseResult, post, vendorId);

    // Check if confidence meets threshold
    if (!parseResult.isValidSchedule || parseResult.schedule.confidence < this.minConfidence) {
      return {
        activityLog: {
          ...activityLog,
          action: 'schedule_rejected',
        },
        action: 'rejected',
        reason: `Confidence ${Math.round(parseResult.schedule.confidence * 100)}% below threshold ${Math.round(this.minConfidence * 100)}%`,
      };
    }

    // Convert to vendor schedule format
    const schedule = ScheduleParser.toVendorSchedule(parseResult, vendorId);
    if (!schedule) {
      return {
        activityLog: {
          ...activityLog,
          action: 'schedule_rejected',
        },
        action: 'rejected',
        reason: 'Failed to convert parsed data to valid schedule',
      };
    }

    // Check for duplicates and determine action
    const { action, existingSchedule } = this.determineAction(schedule, existingSchedules);

    let finalSchedule = schedule;
    let activityAction: ActivityLog['action'] = 'schedule_detected';

    if (action === 'updated' && existingSchedule) {
      // Update existing schedule with new confidence if it's higher
      if (schedule.confidence > existingSchedule.confidence) {
        finalSchedule = {
          ...existingSchedule,
          confidence: schedule.confidence,
          source: schedule.source,
          updatedAt: new Date(),
        };
        activityAction = 'schedule_updated';
      } else {
        // Keep existing schedule but log the attempt
        finalSchedule = existingSchedule;
        activityAction = 'schedule_detected';
      }
    }

    return {
      schedule: finalSchedule,
      activityLog: {
        ...activityLog,
        action: activityAction,
        metadata: {
          ...activityLog.metadata,
          scheduleId: finalSchedule.vendorId + '_' + finalSchedule.date,
        },
      },
      action,
    };
  }

  /**
   * Process multiple posts in batch
   */
  async processMultipleSchedules(
    posts: SocialMediaPost[],
    vendorId: string,
    existingSchedules: Schedule[] = []
  ): Promise<{
    schedules: Schedule[];
    activityLogs: ActivityLog[];
    summary: {
      created: number;
      updated: number;
      rejected: number;
      duplicates: number;
    };
  }> {
    const schedules: Schedule[] = [];
    const activityLogs: ActivityLog[] = [];
    const summary = { created: 0, updated: 0, rejected: 0, duplicates: 0 };

    for (const post of posts) {
      const result = await this.processScheduleFromPost(post, vendorId, [
        ...existingSchedules,
        ...schedules,
      ]);

      if (result.schedule) {
        // Check if we already processed this schedule in this batch
        const isDuplicate = schedules.some(
          (s) => s.date === result.schedule!.date && s.location === result.schedule!.location
        );

        if (!isDuplicate) {
          schedules.push(result.schedule);
        }
      }

      activityLogs.push(result.activityLog);
      summary[result.action as keyof typeof summary]++;
    }

    return {
      schedules,
      activityLogs,
      summary,
    };
  }

  /**
   * Get schedule analytics based on activity logs
   */
  getScheduleAnalytics(activityLogs: ActivityLog[]): {
    averageConfidence: number;
    confidenceDistribution: Record<string, number>;
    sourceBreakdown: Record<string, number>;
    actionBreakdown: Record<string, number>;
    platformBreakdown: Record<string, number>;
  } {
    if (activityLogs.length === 0) {
      return {
        averageConfidence: 0,
        confidenceDistribution: {},
        sourceBreakdown: {},
        actionBreakdown: {},
        platformBreakdown: {},
      };
    }

    const avgConfidence =
      activityLogs.reduce((sum, log) => sum + log.confidenceScore, 0) / activityLogs.length;

    const confidenceRanges = ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'];
    const confidenceDistribution: Record<string, number> = confidenceRanges.reduce(
      (acc, range) => ({ ...acc, [range]: 0 }),
      {}
    );

    const sourceBreakdown: Record<string, number> = {};
    const actionBreakdown: Record<string, number> = {};
    const platformBreakdown: Record<string, number> = {};

    activityLogs.forEach((log) => {
      // Confidence distribution
      const confidencePercent = log.confidenceScore * 100;
      const rangeIndex = Math.min(Math.floor(confidencePercent / 20), 4);
      confidenceDistribution[confidenceRanges[rangeIndex]]++;

      // Source breakdown
      sourceBreakdown[log.source] = (sourceBreakdown[log.source] || 0) + 1;

      // Action breakdown
      actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;

      // Platform breakdown
      const platform = log.metadata?.platform || 'unknown';
      platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
    });

    return {
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      confidenceDistribution,
      sourceBreakdown,
      actionBreakdown,
      platformBreakdown,
    };
  }

  /**
   * Filter schedules by confidence threshold
   */
  filterSchedulesByConfidence(schedules: Schedule[], minConfidence: number): Schedule[] {
    return schedules.filter((schedule) => schedule.confidence >= minConfidence);
  }

  /**
   * Get schedules that need manual review (low confidence but not rejected)
   */
  getSchedulesForManualReview(
    schedules: Schedule[],
    minConfidence: number = 0.3,
    maxConfidence: number = 0.6
  ): Schedule[] {
    return schedules.filter(
      (schedule) => schedule.confidence >= minConfidence && schedule.confidence < maxConfidence
    );
  }

  private createActivityLog(
    parseResult: ScheduleParsingResult,
    post: SocialMediaPost,
    vendorId: string
  ): ActivityLog {
    return {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vendorId,
      timestamp: new Date(),
      source: parseResult.source,
      confidenceScore: parseResult.schedule.confidence,
      action: 'schedule_detected', // Will be updated based on processing result
      metadata: {
        originalText: post.content.text,
        parsedData: {
          date: parseResult.schedule.date || undefined,
          timeRange: parseResult.schedule.timeRange || undefined,
          location: parseResult.schedule.location || undefined,
        },
        platform: post.platform,
        postId: post.id,
      },
    };
  }

  private determineAction(
    newSchedule: Schedule,
    existingSchedules: Schedule[]
  ): { action: 'created' | 'updated' | 'duplicate'; existingSchedule?: Schedule } {
    const existing = existingSchedules.find(
      (s) =>
        s.vendorId === newSchedule.vendorId &&
        s.date === newSchedule.date &&
        s.location === newSchedule.location
    );

    if (!existing) {
      return { action: 'created' };
    }

    // If new schedule has higher confidence, consider it an update
    if (newSchedule.confidence > existing.confidence) {
      return { action: 'updated', existingSchedule: existing };
    }

    return { action: 'duplicate', existingSchedule: existing };
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

  /**
   * Get current minimum confidence threshold
   */
  getMinConfidence(): number {
    return this.minConfidence;
  }
}
