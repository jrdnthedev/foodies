import { useState } from 'react';
import Button from '../../../../shared/components/button/button';

export default function ButtonContainer({
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
  return <Button onClick={handleFollowToggle}>{isFollowing ? 'Following' : 'Follow'}</Button>;
}

interface FollowButtonProps {
  vendorId: string;
  initialFollowState?: boolean;
}
