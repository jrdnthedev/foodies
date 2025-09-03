import { useState } from 'react';
import Search from '../../../../shared/components/search/search';
import useDebounce from '../../../../shared/hooks/debounce/debounce';
import VendorList from '../vendor-list/vendor-list';
import { SocialMediaSearch } from '../social-media-search/social-media-search';
import { SocialMediaSearchResults } from '../social-media-search-results/social-media-search-results';
import { SearchHistory } from '../search-history/search-history';
import { useSocialMediaSearch } from '../../hooks/useSocialMediaSearch';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'vendors' | 'social'>('vendors');
  const [showHistory, setShowHistory] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRetrySearch = (searchTerm: string, platforms: string[]) => {
    searchBusiness({
      businessName: searchTerm,
      platforms,
      maxPosts: 20,
      includeHashtags: true,
    });
    setShowHistory(false);
  };

  console.log(debouncedSearchTerm);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Discovery</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vendors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vendor Directory
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'social'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Social Media Search
          </button>
        </nav>
      </div>

      {/* Vendor Directory Tab */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <Search
            placeholder="Search vendors..."
            ariaLabel="search vendors"
            name="discovery-search"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <VendorList />
        </div>
      )}

      {/* Social Media Search Tab */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Form */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
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
              <p className="text-sm text-gray-600 mb-4">
                Find mentions, posts, and content related to any business across multiple social
                media platforms. Results are automatically logged for future reference.
              </p>

              <SocialMediaSearch
                onSearch={searchBusiness}
                isSearching={isSearching}
                placeholder="Enter business name (e.g., 'Joe's Pizza', 'Main Street Cafe')"
              />
            </div>

            {/* Search History Sidebar */}
            {showHistory && (
              <div className="lg:col-span-1">
                <SearchHistory
                  searchHistory={searchHistory}
                  isLoading={isLoading}
                  onLoadHistory={loadSearchHistory}
                  onRetrySearch={handleRetrySearch}
                />
              </div>
            )}
          </div>

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
          {searchResult && (
            <SocialMediaSearchResults result={searchResult} onClose={clearResults} />
          )}

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
      )}
    </section>
  );
}
