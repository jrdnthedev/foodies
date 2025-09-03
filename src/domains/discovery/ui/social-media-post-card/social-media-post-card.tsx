import type { SocialMediaPost } from '../../services/social-media-search.service';

interface SocialMediaPostCardProps {
  post: SocialMediaPost;
}

export function SocialMediaPostCard({ post }: SocialMediaPostCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      twitter: 'bg-blue-100 text-blue-800',
      instagram: 'bg-pink-100 text-pink-800',
      reddit: 'bg-orange-100 text-orange-800',
      youtube: 'bg-red-100 text-red-800',
    };
    return colors[platform.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getPlatformColor(post.platform)}`}
          >
            {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
          </span>
          {post.author.verified && <span className="text-blue-500 text-xs">✓ Verified</span>}
        </div>
        <span className="text-sm text-gray-500">{formatDate(post.metadata.timestamp)}</span>
      </div>

      {/* Author */}
      <div className="flex items-center gap-2 mb-3">
        <div>
          <p className="font-medium text-sm">{post.author.displayName || post.author.username}</p>
          <p className="text-xs text-gray-500">@{post.author.username}</p>
        </div>
      </div>

      {/* Content */}
      {post.content.text && (
        <p className="text-sm text-gray-800 mb-3 line-clamp-3">{post.content.text}</p>
      )}

      {/* Hashtags */}
      {post.content.hashtags && post.content.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {post.content.hashtags.slice(0, 3).map((hashtag, index) => (
            <span key={index} className="text-xs text-blue-600">
              #{hashtag}
            </span>
          ))}
          {post.content.hashtags.length > 3 && (
            <span className="text-xs text-gray-500">+{post.content.hashtags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Images */}
      {post.content.images && post.content.images.length > 0 && (
        <div className="mb-3">
          <img
            src={post.content.images[0]}
            alt="Post content"
            className="w-full h-32 object-cover rounded"
            loading="lazy"
          />
          {post.content.images.length > 1 && (
            <p className="text-xs text-gray-500 mt-1">
              +{post.content.images.length - 1} more images
            </p>
          )}
        </div>
      )}

      {/* Engagement */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex gap-4">
          {post.engagement.likes !== undefined && (
            <span>❤️ {post.engagement.likes.toLocaleString()}</span>
          )}
          {post.engagement.shares !== undefined && (
            <span>🔄 {post.engagement.shares.toLocaleString()}</span>
          )}
          {post.engagement.comments !== undefined && (
            <span>💬 {post.engagement.comments.toLocaleString()}</span>
          )}
        </div>
        <a
          href={post.metadata.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          View Post
        </a>
      </div>
    </div>
  );
}
