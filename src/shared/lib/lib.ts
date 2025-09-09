import type { SocialMediaProfile } from '../../domains/discovery/services/social-media-search.service';

let counter = 0;

export const generateUniqueId = (profile: SocialMediaProfile): string => {
  const timestamp = Date.now();
  const uniqueCounter = ++counter;
  return `${profile.platform}-${profile.username}-${timestamp}-${uniqueCounter}`;
};
