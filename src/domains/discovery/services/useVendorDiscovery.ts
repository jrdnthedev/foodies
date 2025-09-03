import { useState, useEffect } from 'react';
import useFetchVendors from '../../vendor/services/useFetchVendors';
import { useScheduleCrawler } from './useScheduleCrawler';
import type { Vendor } from '../../vendor/entities/vendor';
import type { ScheduleAnalytics } from '../../../shared/types/schedule-crawler';
import type { ActivityLog } from '../../activity-log/entities/activity-log';

interface UseVendorDiscoveryOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface VendorDiscoveryState {
  vendors: Vendor[];
  selectedVendor: Vendor | null;
  analytics: ScheduleAnalytics | null;
  activityLog: ActivityLog[];
  isLoading: boolean;
  error: string | null;
}

export function useVendorDiscovery(options: UseVendorDiscoveryOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const {
    vendors,
    loading: vendorsLoading,
    error: vendorsError,
    refetch: refetchVendors,
  } = useFetchVendors();

  const {
    analytics,
    loading: crawlerLoading,
    error: crawlerError,
    loadAnalytics,
    checkHealth,
  } = useScheduleCrawler();

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [state, setState] = useState<VendorDiscoveryState>({
    vendors: [],
    selectedVendor: null,
    analytics: null,
    activityLog: [],
    isLoading: true,
    error: null,
  });

  // Update state when vendors change
  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      vendors,
      isLoading: vendorsLoading || crawlerLoading,
      error: vendorsError || crawlerError || null,
    }));
  }, [vendors, vendorsLoading, crawlerLoading, vendorsError, crawlerError]);

  // Update selected vendor
  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      selectedVendor,
    }));
  }, [selectedVendor]);

  // Update analytics and activity log
  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      analytics,
      activityLog,
    }));
  }, [analytics, activityLog]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        await Promise.all([
          refetchVendors(),
          selectedVendor ? loadAnalytics(selectedVendor.id) : Promise.resolve(),
          checkHealth(),
        ]);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchVendors, loadAnalytics, checkHealth, selectedVendor]);

  const selectVendor = (vendor: Vendor | null) => {
    setSelectedVendor(vendor);

    // Load vendor-specific data
    if (vendor) {
      loadAnalytics(vendor.id);
    }
  };

  const refreshAll = async () => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

      await Promise.all([
        refetchVendors(),
        selectedVendor ? loadAnalytics(selectedVendor.id) : Promise.resolve(),
        checkHealth(),
      ]);
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: error instanceof Error ? error.message : 'Failed to refresh data',
      }));
    } finally {
      setState((prevState) => ({ ...prevState, isLoading: false }));
    }
  };

  const getVendorWithScheduleCount = () => {
    return vendors.map((vendor: Vendor) => ({
      ...vendor,
      scheduleCount: vendor.schedule?.length || 0,
      hasActiveSchedules: vendor.schedule && vendor.schedule.length > 0,
    }));
  };

  const getActiveVendors = () => {
    return vendors.filter((vendor: Vendor) => vendor.schedule && vendor.schedule.length > 0);
  };

  const getInactiveVendors = () => {
    return vendors.filter((vendor: Vendor) => !vendor.schedule || vendor.schedule.length === 0);
  };

  const getTotalSchedules = () => {
    return vendors.reduce(
      (total: number, vendor: Vendor) => total + (vendor.schedule?.length || 0),
      0
    );
  };

  const getRecentActivity = (limit: number = 10) => {
    return activityLog
      .sort(
        (a: ActivityLog, b: ActivityLog) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  };

  const getVendorActivity = (vendorId: string, limit: number = 5) => {
    return activityLog
      .filter((entry: ActivityLog) => entry.vendorId === vendorId)
      .sort(
        (a: ActivityLog, b: ActivityLog) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  };

  const searchVendors = (query: string) => {
    if (!query.trim()) return vendors;

    const lowercaseQuery = query.toLowerCase();
    return vendors.filter(
      (vendor: Vendor) =>
        vendor.name.toLowerCase().includes(lowercaseQuery) ||
        vendor.type.toLowerCase().includes(lowercaseQuery) ||
        vendor.location.address.toLowerCase().includes(lowercaseQuery) ||
        vendor.socialLinks.twitter?.toLowerCase().includes(lowercaseQuery) ||
        vendor.socialLinks.instagram?.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Mock activity log for now - in real app would come from API
  const mockActivityLog = (vendorId?: string): ActivityLog[] => {
    const baseActivities: ActivityLog[] = [
      {
        id: '1',
        vendorId: vendorId || selectedVendor?.id || 'vendor-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        source: 'instagram',
        confidenceScore: 0.92,
        action: 'schedule_detected',
        metadata: {
          platform: 'instagram',
          postId: 'ig_post_123',
          originalText: 'Join us tomorrow 2-5pm at Central Park!',
          parsedData: {
            date: '2024-01-15',
            timeRange: '2:00 PM - 5:00 PM',
            location: 'Central Park',
          },
        },
      },
      {
        id: '2',
        vendorId: vendorId || selectedVendor?.id || 'vendor-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        source: 'twitter',
        confidenceScore: 0.88,
        action: 'schedule_updated',
        metadata: {
          platform: 'twitter',
          scheduleId: 'schedule_456',
          originalText: 'Update: We moved to the south entrance',
          parsedData: {
            location: 'Central Park - South Entrance',
          },
        },
      },
    ];

    return baseActivities;
  };

  // Update activity log when vendor changes
  useEffect(() => {
    if (selectedVendor) {
      setActivityLog(mockActivityLog(selectedVendor.id));
    }
  }, [selectedVendor, mockActivityLog]);

  return {
    // Core state
    ...state,

    // Actions
    selectVendor,
    refreshAll,

    // Computed data
    vendorsWithScheduleCount: getVendorWithScheduleCount(),
    activeVendors: getActiveVendors(),
    inactiveVendors: getInactiveVendors(),
    totalSchedules: getTotalSchedules(),
    recentActivity: getRecentActivity(),

    // Utilities
    getVendorActivity,
    searchVendors,

    // Statistics
    stats: {
      totalVendors: vendors.length,
      activeVendors: getActiveVendors().length,
      inactiveVendors: getInactiveVendors().length,
      totalSchedules: getTotalSchedules(),
      recentActivityCount: getRecentActivity().length,
    },
  };
}
