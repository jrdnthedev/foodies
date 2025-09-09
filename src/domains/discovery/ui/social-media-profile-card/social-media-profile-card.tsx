import Card from '../../../../shared/components/card/card';
import type { SocialMediaProfile } from '../../services/social-media-search.service';
import FollowContainer from '../../../../shared/components/follow-container/follow-container';
import type { Vendor } from '../../../vendor/entities/vendor';
import { generateUniqueId } from '../../../../shared/lib/lib';

interface SocialMediaProfileCardProps {
  profile: SocialMediaProfile;
}

export function SocialMediaProfileCard({ profile }: SocialMediaProfileCardProps) {
  const formatNumber = (num: number | undefined): string => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPlatformIcon = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return '🐦';
      case 'instagram':
        return '📷';
      case 'reddit':
        return '🤖';
      case 'youtube':
        return '📺';
      default:
        return '🔗';
    }
  };

  const getPlatformColor = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return 'bg-blue-500';
      case 'instagram':
        return 'bg-pink-500';
      case 'reddit':
        return 'bg-orange-500';
      case 'youtube':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  const convertToVendor = (profile: SocialMediaProfile): Vendor => {
    const id = generateUniqueId(profile);
    return {
      id: id,
      name: profile.displayName || profile.username,
      type: 'social-media', // or determine based on profile content
      location: {
        // You'll need to provide default values or extract from profile.metadata?.location
        address: profile.metadata?.location || '',
        lat: 0,
        lng: 0,
      },
      schedule: [], // Empty array as social media profiles don't have schedules
      socialLinks: {
        instagram: profile.platform === 'instagram' ? profile.profileUrl : undefined,
        twitter: profile.platform === 'twitter' ? profile.profileUrl : null,
        facebook: profile.platform === 'facebook' ? profile.profileUrl : null,
        website: profile.platform === 'website' ? profile.profileUrl : null,
      },
      claimedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };
  console.log(profile);
  return (
    <Card>
      <div className="flex flex-col gap-2">
        {/* Avatar */}
        <div className="grid grid-cols-[3rem_auto_4rem] justify-stretch gap-2">
          <div className="flex-shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName || profile.username}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to platform icon if avatar fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${getPlatformColor(
                profile.platform
              )} ${profile.avatarUrl ? 'hidden' : ''}`}
            >
              {getPlatformIcon(profile.platform)}
            </div>
          </div>
          {/* Header */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900 truncate ">
                {profile.displayName || profile.username}
              </h3>
              {profile.verified && (
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-label="Verified"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            {/* Username */}
            <p className="text-sm text-gray-600">@{profile.username}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">{getPlatformIcon(profile.platform)}</span>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 capitalize">{profile.platform}</span>
              <FollowContainer vendor={convertToVendor(profile)} />
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex flex-col gap-2">
          {/* Description */}
          {profile.description && (
            <p className="text-sm text-gray-700 line-clamp-2">{profile.description}</p>
          )}

          {/* Metrics */}
          {profile.metrics && (
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {profile.metrics.followers !== undefined && (
                <div className="flex items-center space-x-1">
                  <span>👥</span>
                  <span>{formatNumber(profile.metrics.followers)} followers</span>
                </div>
              )}
              {profile.metrics.following !== undefined && (
                <div className="flex items-center space-x-1">
                  <span>➡️</span>
                  <span>{formatNumber(profile.metrics.following)} following</span>
                </div>
              )}
              {profile.metrics.posts !== undefined && (
                <div className="flex items-center space-x-1">
                  <span>📝</span>
                  <span>{formatNumber(profile.metrics.posts)} posts</span>
                </div>
              )}
            </div>
          )}

          {/* Match Reason */}
          {profile.matchReason && (
            <div className="px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <span className="font-medium">Match:</span> {profile.matchReason}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {profile.metadata?.isPrivate && (
                <span className="px-2 py-1 bg-gray-100 rounded">🔒 Private</span>
              )}
              {profile.metadata?.isBusinessAccount && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">🏢 Business</span>
              )}
              {profile.metadata?.location && (
                <span className="flex items-center space-x-1">
                  <span>📍</span>
                  <span>{profile.metadata.location}</span>
                </span>
              )}
            </div>
            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              View Profile →
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
