import { useState, useCallback } from 'react';
import {
  socialMediaSearchService,
  type SocialMediaSearchRequest,
  type SocialMediaSearchResult,
  type SearchLog,
} from '../services/social-media-search.service';

interface UseSocialMediaSearchReturn {
  isLoading: boolean;
  isSearching: boolean;
  searchResult: SocialMediaSearchResult | null;
  searchHistory: SearchLog[];
  error: string | null;
  searchBusiness: (request: SocialMediaSearchRequest) => Promise<void>;
  clearResults: () => void;
  loadSearchHistory: () => Promise<void>;
}

export function useSocialMediaSearch(): UseSocialMediaSearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SocialMediaSearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchBusiness = useCallback(async (request: SocialMediaSearchRequest) => {
    setIsSearching(true);
    setError(null);

    try {
      const result = await socialMediaSearchService.searchBusiness(request);

      if (result.success && result.data) {
        setSearchResult(result.data);

        // Log the successful search
        await socialMediaSearchService.logSearch({
          searchTerm: request.businessName,
          resultsCount: result.data.summary.totalPosts,
          platforms: request.platforms || ['TWITTER', 'INSTAGRAM', 'REDDIT', 'YOUTUBE'],
          success: true,
        });
      } else {
        const errorMessage = result.error || 'Search failed';
        setError(errorMessage);

        // Log the failed search
        await socialMediaSearchService.logSearch({
          searchTerm: request.businessName,
          resultsCount: 0,
          platforms: request.platforms || ['TWITTER', 'INSTAGRAM', 'REDDIT', 'YOUTUBE'],
          success: false,
          errorMessage,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);

      // Log the failed search
      await socialMediaSearchService.logSearch({
        searchTerm: request.businessName,
        resultsCount: 0,
        platforms: request.platforms || ['TWITTER', 'INSTAGRAM', 'REDDIT', 'YOUTUBE'],
        success: false,
        errorMessage,
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResult(null);
    setError(null);
  }, []);

  const loadSearchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await socialMediaSearchService.getSearchHistory();
      if (result.success && result.data) {
        setSearchHistory(result.data);
      }
    } catch (err) {
      console.error('Failed to load search history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    isSearching,
    searchResult,
    searchHistory,
    error,
    searchBusiness,
    clearResults,
    loadSearchHistory,
  };
}
