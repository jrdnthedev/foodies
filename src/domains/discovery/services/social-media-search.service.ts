import type { ApiResponse } from '../../../shared/types/api';

export interface SocialMediaSearchRequest {
  businessName: string;
  platforms?: string[];
  maxPosts?: number;
  includeHashtags?: boolean;
}

export interface SocialMediaPost {
  id: string;
  platform: string;
  author: {
    username: string;
    displayName?: string;
    profileUrl?: string;
    verified?: boolean;
  };
  content: {
    text?: string;
    images?: string[];
    hashtags?: string[];
  };
  engagement: {
    likes?: number;
    shares?: number;
    comments?: number;
  };
  metadata: {
    postUrl: string;
    timestamp: Date;
  };
}

export interface SocialMediaSearchResult {
  businessName: string;
  allPosts: SocialMediaPost[];
  byPlatform: Record<
    string,
    {
      posts: SocialMediaPost[];
      metadata: {
        totalFound: number;
        crawledAt: Date;
        searchQuery: string;
        platform: string;
      };
    }
  >;
  summary: {
    totalPosts: number;
    platformCounts: Record<string, number>;
    errors: string[];
  };
}

export interface SearchLog {
  id: string;
  searchTerm: string;
  timestamp: Date;
  resultsCount: number;
  platforms: string[];
  success: boolean;
  errorMessage?: string;
}

class SocialMediaSearchService {
  private readonly baseUrl = '/api/crawler';

  async searchBusiness(
    request: SocialMediaSearchRequest
  ): Promise<ApiResponse<SocialMediaSearchResult>> {
    try {
      // Prepare search terms based on business name
      const businessNameNormalized = request.businessName.trim();
      const searchTerms = [
        businessNameNormalized,
        `"${businessNameNormalized}"`, // Exact match
        businessNameNormalized.replace(/\s+/g, ''), // No spaces version
        // Add common variations
        businessNameNormalized.toLowerCase(),
        // Split into individual words for broader matching
        ...businessNameNormalized.split(/\s+/).filter((word) => word.length > 2),
      ];

      // Add hashtag versions if requested
      if (request.includeHashtags) {
        const hashtagVersion = businessNameNormalized.replace(/\s+/g, '').toLowerCase();
        searchTerms.push(`#${hashtagVersion}`);
        // Also add hashtag with business name words
        businessNameNormalized.split(/\s+/).forEach((word) => {
          if (word.length > 2) {
            searchTerms.push(`#${word.toLowerCase()}`);
          }
        });
      }

      const crawlerConfig = {
        searchTerms,
        maxPosts: request.maxPosts || 20,
        dateRange: {
          from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days (increased from 30)
          to: new Date(),
        },
      };

      // Use the crawler's search across all platforms endpoint
      console.log('Search request:', {
        businessName: request.businessName,
        searchTerms,
        platforms: request.platforms,
        config: crawlerConfig,
      });

      const response = await fetch(`${this.baseUrl}/search-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: crawlerConfig,
          platforms: request.platforms || ['TWITTER', 'INSTAGRAM', 'REDDIT', 'YOUTUBE'],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search failed:', response.status, response.statusText, errorText);
        throw new Error(`Search failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Search result:', {
        totalPosts: result.summary?.totalPosts || 0,
        platformCounts: result.summary?.platformCounts || {},
        errors: result.summary?.errors || [],
      });

      return {
        success: true,
        data: {
          businessName: request.businessName,
          ...result,
        },
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async logSearch(searchLog: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await fetch('/api/activity-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'business_search',
          source: 'social_media_crawler',
          metadata: {
            searchTerm: searchLog.searchTerm,
            resultsCount: searchLog.resultsCount,
            platforms: searchLog.platforms,
            success: searchLog.success,
            errorMessage: searchLog.errorMessage,
          },
          timestamp: new Date(),
        }),
      });
    } catch (error) {
      console.error('Failed to log search:', error);
      // Don't throw here - logging failures shouldn't break the main flow
    }
  }

  async getSearchHistory(): Promise<ApiResponse<SearchLog[]>> {
    try {
      const response = await fetch('/api/activity-log?action=business_search');
      const result = await response.json();

      return {
        success: true,
        data: result.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch search history',
      };
    }
  }
}

export const socialMediaSearchService = new SocialMediaSearchService();
