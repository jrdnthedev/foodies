import { useState } from 'react';

export default function FollowContainer({
  vendorId,
  initialFollowState = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState<boolean>(initialFollowState);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    // TODO: Add API call to update follow status
    // updateFollowStatus(vendorId, !isFollowing);
    console.log(vendorId);
  };
  return (
    <button
      onClick={handleFollowToggle}
      className={`p-1 rounded-full transition-all duration-200 ${
        isFollowing ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
      }`}
    >
      {isFollowing ? '❤️' : '🤍'}
    </button>
  );
}

interface FollowButtonProps {
  vendorId: string;
  initialFollowState?: boolean;
}
