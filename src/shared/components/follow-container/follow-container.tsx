import { useState } from 'react';
import { useVendorStore } from '../../../domains/vendor/state/state';
import type { Vendor } from '../../../domains/vendor/entities/vendor';
import { useNavigate } from 'react-router-dom';

export default function FollowContainer({ vendor, initialFollowState = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState<boolean>(initialFollowState);
  const { followVendor, removeVendor, followedVendors } = useVendorStore();
  const navigate = useNavigate();

  const handleFollowToggle = () => {
    const newFollowState = !isFollowing;
    setIsFollowing(newFollowState);

    if (newFollowState) {
      followVendor(vendor);
    } else {
      removeVendor(vendor.id);
      navigate(`/vendor-dashboard`);
    }

    console.log('Follow state:', newFollowState, followedVendors);
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
  vendor: Vendor;
  initialFollowState?: boolean;
}
