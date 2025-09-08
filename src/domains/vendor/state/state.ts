import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Vendor } from '../entities/vendor';
import type { PaginatedResponse } from '../../../shared/types/api';

interface VendorState {
  // Data
  vendors: Vendor[];
  selectedVendor: Vendor | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  followedVendors: Vendor[];
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error states
  error: string | null;

  // Filters
  filters: {
    type?: string;
    search?: string;
  };
}

interface VendorActions {
  // Data actions
  setVendors: (vendors: Vendor[]) => void;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  removeVendor: (id: string) => void;

  removeFollowedVendor: (id: string) => void;
  selectVendor: (vendor: Vendor | null) => void;
  getVendorById: (id: string) => Vendor | null;
  selectVendorById: (id: string) => void;

  // Async actions
  fetchVendors: (page?: number, limit?: number) => Promise<void>;
  createVendor: (vendorData: Omit<Vendor, 'id'>) => Promise<void>;
  updateVendorById: (id: string, updates: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;

  // Filter actions
  setFilters: (filters: Partial<VendorState['filters']>) => void;
  clearFilters: () => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState: VendorState = {
  vendors: [],
  selectedVendor: null,
  followedVendors: [],
  pagination: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  filters: {},
};

export const useVendorStore = create<VendorState & VendorActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Data actions
      setVendors: (vendors: Vendor[]) => set({ vendors }),

      addVendor: (vendor: Vendor) =>
        set((state: VendorState & VendorActions) => ({
          followedVendors: [...state.followedVendors, vendor],
        })),

      updateVendor: (id: string, updates: Partial<Vendor>) =>
        set((state: VendorState & VendorActions) => ({
          vendors: state.vendors.map((vendor: Vendor) =>
            vendor.id === id ? { ...vendor, ...updates } : vendor
          ),
        })),

      removeVendor: (id: string) =>
        set((state: VendorState & VendorActions) => ({
          vendors: state.vendors.filter((vendor: Vendor) => vendor.id !== id),
          selectedVendor: state.selectedVendor?.id === id ? null : state.selectedVendor,
          followedVendors: state.followedVendors.filter((vendor: Vendor) => vendor.id !== id),
        })),

      removeFollowedVendor: (id: string) =>
        set((state: VendorState & VendorActions) => ({
          followedVendors: state.followedVendors.filter((vendor: Vendor) => vendor.id !== id),
        })),

      selectVendor: (vendor: Vendor) => set({ selectedVendor: vendor }),

      getVendorById: (id: string) => {
        const { vendors } = get();
        return vendors.find((vendor) => vendor.id === id) || null;
      },

      selectVendorById: (id: string) => {
        const vendor = get().getVendorById(id);
        set({ selectedVendor: vendor });
      },

      // Async actions
      fetchVendors: async (page = 1, limit = 10) => {
        set({ isLoading: true, error: null });

        try {
          const { type } = get().filters;
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(type && { type }),
          });

          const response = await fetch(`/api/vendors?${queryParams}`);
          if (!response.ok) throw new Error('Failed to fetch vendors');

          const data: PaginatedResponse<Vendor> = await response.json();

          set({
            vendors: data.data,
            pagination: data.pagination,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch vendors',
            isLoading: false,
          });
        }
      },

      createVendor: async (vendorData: Omit<Vendor, 'id'>) => {
        set({ isCreating: true, error: null });

        try {
          const response = await fetch('/api/vendors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vendorData),
          });

          if (!response.ok) throw new Error('Failed to create vendor');

          const result = await response.json();
          get().addVendor(result.data);
          set({ isCreating: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create vendor',
            isCreating: false,
          });
        }
      },

      // Filter actions
      setFilters: (filters: Partial<{ type?: string; search?: string }>) =>
        set((state: VendorState & VendorActions) => ({
          filters: { ...state.filters, ...filters },
        })),

      clearFilters: () => set({ filters: {} }),

      // Utility actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    { name: 'vendor-store' }
  )
);
