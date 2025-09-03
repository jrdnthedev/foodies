import type {
  ScheduleCrawlResult,
  ScheduleProcessingRequest,
  ScheduleProcessingResponse,
  ParseTestRequest,
  ParseTestResponse,
  HealthCheckResponse,
  ScheduleAnalytics,
  Schedule,
} from '../../../shared/types/schedule-crawler';
import type { ApiResponse } from '../../../shared/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ScheduleCrawlerService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || `${API_BASE_URL}/api/schedule-crawler`;
  }

  /**
   * Crawl schedules for a single vendor (simple approach)
   */
  async crawlVendorSchedules(request: ScheduleProcessingRequest): Promise<ScheduleCrawlResult> {
    const response = await fetch(`${this.baseUrl}/vendor-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<ScheduleCrawlResult> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to crawl vendor schedules');
    }

    return data.data;
  }

  /**
   * Process schedules with detailed logging (hybrid approach)
   */
  async processSchedulesWithLogging(
    request: ScheduleProcessingRequest
  ): Promise<ScheduleProcessingResponse['data']> {
    const response = await fetch(`${this.baseUrl}/process-with-logging`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ScheduleProcessingResponse = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to process schedules with logging');
    }

    return data.data;
  }

  /**
   * Get schedules for a specific vendor and date range
   */
  async getSchedulesForDateRange(
    vendorId: string,
    fromDate: string,
    toDate: string,
    options?: {
      vendorName?: string;
      socialHandle?: string;
      platform?: string;
    }
  ): Promise<{ schedules: Schedule[]; totalSchedules: number }> {
    const params = new URLSearchParams({
      from: fromDate,
      to: toDate,
    });

    if (options?.vendorName) params.append('vendorName', options.vendorName);
    if (options?.socialHandle) params.append('socialHandle', options.socialHandle);
    if (options?.platform) params.append('platform', options.platform);

    const response = await fetch(`${this.baseUrl}/schedules/${vendorId}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<{ schedules: Schedule[]; totalSchedules: number }> =
      await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get schedules for date range');
    }

    return data.data;
  }

  /**
   * Test schedule parsing without crawling
   */
  async testScheduleParsing(request: ParseTestRequest): Promise<ParseTestResponse['data']> {
    const response = await fetch(`${this.baseUrl}/test-parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ParseTestResponse = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to test schedule parsing');
    }

    return data.data;
  }

  /**
   * Get schedule analytics for a vendor
   */
  async getScheduleAnalytics(
    vendorId: string,
    dateRange?: { from: string; to: string }
  ): Promise<{
    analytics: ScheduleAnalytics;
    totalActivities: number;
  }> {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);

    const url = `${this.baseUrl}/analytics/${vendorId}${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<{
      analytics: ScheduleAnalytics;
      totalActivities: number;
    }> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get schedule analytics');
    }

    return data.data;
  }

  /**
   * Update crawler configuration
   */
  async updateConfig(config: { minConfidence?: number }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<never> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update configuration');
    }
  }

  /**
   * Check service health and available platforms
   */
  async getHealthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: HealthCheckResponse = await response.json();

    if (!data.success) {
      throw new Error('Health check failed');
    }

    return data;
  }

  /**
   * Crawl multiple vendors
   */
  async crawlMultipleVendors(
    vendors: Array<{
      id: string;
      name?: string;
      socialHandle?: string;
      searchTerms?: string[];
      hashtags?: string[];
    }>,
    baseConfig?: Omit<ScheduleProcessingRequest, 'vendorId' | 'vendorName' | 'socialHandle'>
  ): Promise<{
    vendors: ScheduleCrawlResult[];
    summary: {
      totalVendors: number;
      successfulCrawls: number;
      totalSchedules: number;
      totalPosts: number;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/multiple-vendor-schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendors,
        baseConfig,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<{
      vendors: ScheduleCrawlResult[];
      summary: {
        totalVendors: number;
        successfulCrawls: number;
        totalSchedules: number;
        totalPosts: number;
      };
    }> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to crawl multiple vendors');
    }

    return data.data;
  }
}

// Create a singleton instance
export const scheduleCrawlerService = new ScheduleCrawlerService();
