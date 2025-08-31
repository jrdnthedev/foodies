import { useState, useEffect, useCallback } from 'react';
import type { Vendor } from '../entities/vendor';
import type { ApiResponse, PaginatedResponse } from '../../../shared/types/api';

interface UseFetchVendorsOptions {
  page?: number;
  limit?: number;
  type?: string;
  autoFetch?: boolean;
}

interface UseFetchVendorsReturn {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => Promise<void>;
  fetchVendorById: (id: string) => Promise<Vendor | null>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function useFetchVendors(
  options: UseFetchVendorsOptions = {}
): UseFetchVendorsReturn {
  const { page = 1, limit = 10, type, autoFetch = true } = options;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (type) {
        params.append('type', type);
      }

      const response = await fetch(`${API_BASE_URL}/api/vendors?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PaginatedResponse<Vendor> = await response.json();

      if (data.success && data.data) {
        setVendors(data.data);
        setPagination(data.pagination || null);
      } else {
        throw new Error(data.error || 'Failed to fetch vendors');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, type]);

  const fetchVendorById = useCallback(async (id: string): Promise<Vendor | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Vendor> = await response.json();

      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch vendor');
      }
    } catch (err) {
      console.error('Error fetching vendor by ID:', err);
      return null;
    }
  }, []);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchVendors();
    }
  }, [fetchVendors, autoFetch]);

  return {
    vendors,
    loading,
    error,
    pagination,
    refetch: fetchVendors,
    fetchVendorById,
  };
}
