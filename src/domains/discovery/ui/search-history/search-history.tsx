import { useEffect } from 'react';
import type { SearchLog } from '../../services/social-media-search.service';

interface SearchHistoryProps {
  searchHistory: SearchLog[];
  isLoading: boolean;
  onLoadHistory: () => void;
  onRetrySearch?: (searchTerm: string, platforms: string[]) => void;
}

export function SearchHistory({
  searchHistory,
  isLoading,
  onLoadHistory,
  onRetrySearch,
}: SearchHistoryProps) {
  useEffect(() => {
    onLoadHistory();
  }, [onLoadHistory]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Search History</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Search History</h3>
        <button
          onClick={onLoadHistory}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Refresh
        </button>
      </div>

      {searchHistory.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No search history yet. Try searching for a business!
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {searchHistory.map((log: SearchLog) => (
            <div
              key={log.id}
              className={`p-3 border rounded-lg ${
                log.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{log.searchTerm}</p>
                  <p className="text-xs text-gray-600">
                    {formatDate(log.timestamp)} • {log.platforms?.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {log.success ? (
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                      {log.resultsCount} results
                    </span>
                  ) : (
                    <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                      Failed
                    </span>
                  )}
                  {onRetrySearch && (
                    <button
                      onClick={() => onRetrySearch(log.searchTerm, log.platforms)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
              {!log.success && log.errorMessage && (
                <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
