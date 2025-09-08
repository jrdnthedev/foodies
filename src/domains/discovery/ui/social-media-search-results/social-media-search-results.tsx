import type {
  SocialMediaPost,
  SocialMediaProfile,
  SocialMediaSearchResult,
} from '../../services/social-media-search.service';
import { SocialMediaPostCard } from '../social-media-post-card/social-media-post-card';
import { SocialMediaProfileCard } from '../social-media-profile-card/social-media-profile-card';

interface SocialMediaSearchResultsProps {
  result: SocialMediaSearchResult;
  onClose: () => void;
}

export function SocialMediaSearchResults({ result, onClose }: SocialMediaSearchResultsProps) {
  const { businessName, searchType, allPosts, allProfiles, byPlatform, summary } = result;
  const isProfileSearch = searchType === 'profiles';

  const totalResults = isProfileSearch ? summary.totalProfiles || 0 : summary.totalPosts || 0;

  const resultItems = isProfileSearch ? allProfiles : allPosts;

  return (
    <>
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isProfileSearch ? 'Profile' : 'Social Media'} Results for "{businessName}"
            </h3>
            <p className="text-sm text-gray-600">
              Found {totalResults} {isProfileSearch ? 'profiles' : 'posts'} across{' '}
              {Object.keys(summary.platformCounts).length} platforms
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

      {/* Results */}
      <div>
        {resultItems && resultItems.length > 0 ? (
          <>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {isProfileSearch ? 'Matching Profiles' : 'Recent Posts'} ({resultItems.length}):
            </h4>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {resultItems.map((item: SocialMediaProfile | SocialMediaPost) => {
                if (isProfileSearch && allProfiles) {
                  const profile = item as (typeof allProfiles)[0];
                  return (
                    <SocialMediaProfileCard
                      key={`${profile.platform}-${profile.id}`}
                      profile={profile}
                    />
                  );
                } else if (!isProfileSearch && allPosts) {
                  const post = item as (typeof allPosts)[0];
                  return <SocialMediaPostCard key={`${post.platform}-${post.id}`} post={post} />;
                }
                return null;
              })}
              {resultItems.length > 10 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Showing 10 of {resultItems.length} {isProfileSearch ? 'profiles' : 'posts'}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No {isProfileSearch ? 'profiles' : 'posts'} found for this business.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search terms or checking different platforms.
            </p>
          </div>
        )}
      </div>

      {/* Platform Details (Expandable sections) */}
      {Object.keys(byPlatform).length > 0 && (
        <div>
          <details>
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Platform Details
            </summary>
            <div className="mt-3 space-y-3">
              {Object.entries(byPlatform).map(([platform, data]) => {
                const itemCount = isProfileSearch
                  ? data.profiles?.length || 0
                  : data.posts?.length || 0;

                return (
                  <div key={platform}>
                    <h5 className="font-medium text-sm capitalize">{platform}</h5>
                    <p className="text-xs text-gray-600">
                      {itemCount} {isProfileSearch ? 'profiles' : 'posts'} found • Crawled at{' '}
                      {new Date(data.metadata.crawledAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Query: {data.metadata.searchQuery}</p>
                    <p className="text-xs text-gray-500">Search Type: {data.metadata.searchType}</p>
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      )}
    </>
  );
}
