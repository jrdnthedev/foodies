import { useState } from 'react';
import { SocialMediaSearch } from '../social-media-search/social-media-search';
import { SocialMediaSearchResults } from '../social-media-search-results/social-media-search-results';
import { SearchHistory } from '../search-history/search-history';
import { useSocialMediaSearch } from '../../hooks/useSocialMediaSearch';
import Card from '../../../../shared/components/card/card';

export default function Dashboard() {
  const [showHistory, setShowHistory] = useState(false);

  const {
    isLoading,
    isSearching,
    searchResult,
    searchHistory,
    error,
    searchBusiness,
    clearResults,
    loadSearchHistory,
  } = useSocialMediaSearch();

  const handleRetrySearch = (searchTerm: string, platforms: string[]) => {
    searchBusiness({
      businessName: searchTerm,
      platforms,
      maxPosts: 20,
      includeHashtags: true,
    });
    setShowHistory(false);
  };

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Discovery</h1>
      {/* heeadline section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Search for Businesses on Social Media
          </h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Find mentions, posts, and content related to any business across multiple social media
          platforms. Results are automatically logged for future reference.
        </p>
      </div>
      {/* search container */}

      <Card>
        {/* Search Form */}
        <SocialMediaSearch
          onSearch={searchBusiness}
          isSearching={isSearching}
          placeholder="Enter business name (e.g., 'Joe's Pizza', 'Main Street Cafe')"
        />

        {/* Search History Sidebar */}
        {showHistory && (
          <SearchHistory
            searchHistory={searchHistory}
            isLoading={isLoading}
            onLoadHistory={loadSearchHistory}
            onRetrySearch={handleRetrySearch}
          />
        )}
      </Card>
      {/*  */}
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={clearResults}
                  className="text-sm text-red-600 underline hover:text-red-800 mt-2"
                >
                  Clear and try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResult && <SocialMediaSearchResults result={searchResult} onClose={clearResults} />}

        {/* Help Text */}
        {!searchResult && !error && !isSearching && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Enter a business name to search across multiple social platforms</li>
              <li>• Choose which platforms to include in your search</li>
              <li>• Adjust search settings for more targeted results</li>
              <li>• All searches are logged in your activity history</li>
              <li>• Click on individual posts to view them on their original platform</li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
