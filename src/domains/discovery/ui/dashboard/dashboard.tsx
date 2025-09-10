import { SocialMediaSearch } from '../social-media-search/social-media-search';
import { SocialMediaSearchResults } from '../social-media-search-results/social-media-search-results';
import Card from '../../../../shared/components/card/card';
import { useSocialMediaSearch } from '../../../../shared/hooks/social-media-search/social-media-search';

export default function Dashboard() {
  const { isSearching, searchResult, error, searchBusiness, clearResults } = useSocialMediaSearch();

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Discovery</h1>
      {/* headline section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Search for Businesses on Social Media
        </h2>
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
      </Card>

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
          <ol
            className="text-sm text-blue-700 space-y-1 pl-[17px]"
            style={{ listStyleType: 'lower-roman' }}
          >
            <li>Enter a business name to search across multiple social platforms</li>
            <li>Choose which platforms to include in your search</li>
            <li>Adjust search settings for more targeted results</li>
            <li>All searches are logged in your activity history</li>
            <li>Click on individual posts to view them on their original platform</li>
          </ol>
        </div>
      )}
    </section>
  );
}
