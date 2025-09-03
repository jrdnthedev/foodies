import type { ActivityLog } from '../../domains/activity-log/entities/activity-log';
import type { Schedule } from '../../domains/vendor/entities/schedule';

// Schedule Crawler Types for Frontend
export interface ParsedScheduleData {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  timeRange: string | null;
  location: string | null;
  confidence: number; // 0-1 scale
  rawText: string;
}

export interface ScheduleCrawlResult {
  vendor: {
    id: string;
    name?: string;
    socialHandle?: string;
  };
  schedules: Schedule[];
  summary: {
    totalPosts: number;
    totalSchedules: number;
    averageConfidence: number;
    platformBreakdown: Record<string, number>;
    errors: string[];
  };
  activityLogs?: ActivityLog[];
  analytics?: ScheduleAnalytics;
}

export interface ScheduleAnalytics {
  averageConfidence: number;
  confidenceDistribution: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  actionBreakdown: Record<string, number>;
  platformBreakdown: Record<string, number>;
}

export interface ScheduleProcessingRequest {
  vendorId: string;
  vendorName?: string;
  socialHandle?: string;
  searchTerms?: string[];
  hashtags?: string[];
  maxPosts?: number;
  dateRange?: {
    from: string;
    to: string;
  };
  minConfidence?: number;
  existingSchedules?: Schedule[];
  includeAnalytics?: boolean;
}

export interface ScheduleProcessingResponse {
  success: boolean;
  data?: {
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
    analytics?: ScheduleAnalytics;
    activityLogs?: ActivityLog[];
  };
  error?: string;
  message?: string;
}

export interface ParseTestRequest {
  text: string;
  vendorId?: string;
}

export interface ParseTestResponse {
  success: boolean;
  data?: {
    parsed: ParsedScheduleData;
    schedule?: Schedule;
    isValid: boolean;
  };
  error?: string;
}

export const SocialPlatform = {
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  REDDIT: 'reddit',
  YOUTUBE: 'youtube',
} as const;

export type SocialPlatform = (typeof SocialPlatform)[keyof typeof SocialPlatform];

export interface HealthCheckResponse {
  success: boolean;
  status: string;
  timestamp: string;
  credentials: Record<string, boolean>;
  availablePlatforms: string[];
}
