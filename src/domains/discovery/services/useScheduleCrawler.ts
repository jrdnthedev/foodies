import { useState, useCallback, useEffect } from 'react';
import { scheduleCrawlerService } from '../services/scheduleCrawlerService';
import type {
  ScheduleCrawlResult,
  ScheduleProcessingRequest,
  ScheduleAnalytics,
  Schedule,
  HealthCheckResponse,
  ParseTestResponse,
} from '../../../shared/types/schedule-crawler';

interface UseScheduleCrawlerReturn {
  // State
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  analytics: ScheduleAnalytics | null;
  healthStatus: HealthCheckResponse | null;

  // Actions
  crawlVendorSchedules: (request: ScheduleProcessingRequest) => Promise<ScheduleCrawlResult | null>;
  processWithLogging: (request: ScheduleProcessingRequest) => Promise<void>;
  getSchedulesInDateRange: (vendorId: string, from: string, to: string) => Promise<void>;
  testParsing: (text: string, vendorId?: string) => Promise<ParseTestResponse['data'] | null>;
  loadAnalytics: (vendorId: string, dateRange?: { from: string; to: string }) => Promise<void>;
  checkHealth: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export function useScheduleCrawler(): UseScheduleCrawlerReturn {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ScheduleAnalytics | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(null);

  const crawlVendorSchedules = useCallback(async (request: ScheduleProcessingRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await scheduleCrawlerService.crawlVendorSchedules(request);
      setSchedules(result.schedules);
      if (result.analytics) {
        setAnalytics(result.analytics);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to crawl schedules';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const processWithLogging = useCallback(async (request: ScheduleProcessingRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await scheduleCrawlerService.processSchedulesWithLogging(request);
      if (result) {
        setSchedules(result.schedules);
        if (result.analytics) {
          setAnalytics(result.analytics);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process schedules';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSchedulesInDateRange = useCallback(
    async (vendorId: string, from: string, to: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await scheduleCrawlerService.getSchedulesForDateRange(vendorId, from, to);
        setSchedules(result.schedules);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get schedules';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const testParsing = useCallback(async (text: string, vendorId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await scheduleCrawlerService.testScheduleParsing({ text, vendorId });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test parsing';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(
    async (vendorId: string, dateRange?: { from: string; to: string }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await scheduleCrawlerService.getScheduleAnalytics(vendorId, dateRange);
        setAnalytics(result.analytics);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkHealth = useCallback(async () => {
    try {
      const health = await scheduleCrawlerService.getHealthCheck();
      setHealthStatus(health);
    } catch (err) {
      console.error('Health check failed:', err);
      setHealthStatus(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setSchedules([]);
    setAnalytics(null);
    setError(null);
    setLoading(false);
  }, []);

  // Check health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    schedules,
    loading,
    error,
    analytics,
    healthStatus,
    crawlVendorSchedules,
    processWithLogging,
    getSchedulesInDateRange,
    testParsing,
    loadAnalytics,
    checkHealth,
    clearError,
    reset,
  };
}

// Hook for managing multiple vendors
interface UseMultiVendorCrawlerReturn {
  results: ScheduleCrawlResult[];
  loading: boolean;
  error: string | null;
  summary: {
    totalVendors: number;
    successfulCrawls: number;
    totalSchedules: number;
    totalPosts: number;
  } | null;
  crawlMultipleVendors: (
    vendors: Array<{
      id: string;
      name?: string;
      socialHandle?: string;
      searchTerms?: string[];
      hashtags?: string[];
    }>
  ) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export function useMultiVendorCrawler(): UseMultiVendorCrawlerReturn {
  const [results, setResults] = useState<ScheduleCrawlResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<UseMultiVendorCrawlerReturn['summary']>(null);

  const crawlMultipleVendors = useCallback(
    async (
      vendors: Array<{
        id: string;
        name?: string;
        socialHandle?: string;
        searchTerms?: string[];
        hashtags?: string[];
      }>
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await scheduleCrawlerService.crawlMultipleVendors(vendors);
        setResults(result.vendors);
        setSummary(result.summary);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to crawl multiple vendors';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setSummary(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    results,
    loading,
    error,
    summary,
    crawlMultipleVendors,
    clearError,
    reset,
  };
}
