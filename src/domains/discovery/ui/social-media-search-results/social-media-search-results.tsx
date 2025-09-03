import type { SocialMediaSearchResult } from '../../services/social-media-search.service';
import { SocialMediaPostCard } from '../social-media-post-card/social-media-post-card';

interface SocialMediaSearchResultsProps {
  result: SocialMediaSearchResult;
  onClose: () => void;
}

export function SocialMediaSearchResults({ result, onClose }: SocialMediaSearchResultsProps) {
  const { businessName, allPosts, byPlatform, summary } = result;

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Social Media Results for "{businessName}"
            </h3>
            <p className="text-sm text-gray-600">
              Found {summary.totalPosts} posts across {Object.keys(summary.platformCounts).length}{' '}
              platforms
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close results"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Platform Summary */}
      <div className="p-4 border-b">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Results by Platform:</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.platformCounts).map(([platform, count]) => (
            <span
              key={platform}
              className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
            >
              {platform}: {count} posts
            </span>
          ))}
        </div>
      </div>

      {/* Error Messages */}
      {summary.errors.length > 0 && (
        <div className="p-4 border-b bg-yellow-50">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            {summary.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Posts */}
      <div className="p-4">
        {allPosts.length > 0 ? (
          <>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Recent Posts ({allPosts.length}):
            </h4>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {allPosts.slice(0, 10).map((post) => (
                <SocialMediaPostCard key={`${post.platform}-${post.id}`} post={post} />
              ))}
              {allPosts.length > 10 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Showing 10 of {allPosts.length} posts</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts found for this business.</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search terms or checking different platforms.
            </p>
          </div>
        )}
      </div>

      {/* Platform Details (Expandable sections) */}
      {Object.keys(byPlatform).length > 0 && (
        <div className="border-t">
          <details className="p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Platform Details
            </summary>
            <div className="mt-3 space-y-3">
              {Object.entries(byPlatform).map(([platform, data]) => (
                <div key={platform} className="border rounded p-3 bg-gray-50">
                  <h5 className="font-medium text-sm capitalize">{platform}</h5>
                  <p className="text-xs text-gray-600">
                    {data.posts.length} posts found • Crawled at{' '}
                    {new Date(data.metadata.crawledAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Query: {data.metadata.searchQuery}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
