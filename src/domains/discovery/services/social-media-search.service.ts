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
        businessNameNormalized, // Original: "Pizza Nova"
        `"${businessNameNormalized}"`, // Exact match: "Pizza Nova"
        businessNameNormalized.replace(/\s+/g, ''), // No spaces version: "PizzaNova"
        businessNameNormalized.toLowerCase(), // Lowercase: "pizza nova"
      ];

      // Add hashtag versions if requested
      if (request.includeHashtags) {
        const hashtagVersion = businessNameNormalized.replace(/\s+/g, '').toLowerCase();
        searchTerms.push(`#${hashtagVersion}`); // #pizzanova

        // Also add hashtag with original casing
        const hashtagOriginal = businessNameNormalized.replace(/\s+/g, '');
        if (hashtagOriginal !== hashtagVersion) {
          searchTerms.push(`#${hashtagOriginal}`); // #PizzaNova
        }
      }

      // Only split into individual words in very specific cases to avoid noise
      const words = businessNameNormalized.split(/\s+/);
      const businessSuffixes = [
        'restaurant',
        'cafe',
        'bar',
        'grill',
        'kitchen',
        'bistro',
        'diner',
        'pizza',
        'burger',
      ];

      // Only add individual words if:
      // 1. Business name contains common food/restaurant suffixes, OR
      // 2. It's a single word (no splitting needed), OR
      // 3. One of the words is very generic and commonly used alone
      const hasBusinessSuffix = words.some((word) => businessSuffixes.includes(word.toLowerCase()));
      const hasGenericWord = words.some((word) =>
        ['pizza', 'burger', 'coffee', 'taco', 'sushi'].includes(word.toLowerCase())
      );

      if (hasBusinessSuffix || hasGenericWord) {
        words.forEach((word) => {
          if (word.length > 2) {
            searchTerms.push(word);
            if (request.includeHashtags) {
              searchTerms.push(`#${word.toLowerCase()}`);
            }
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
