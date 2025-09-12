import type { Location } from './location';
import { type Schedule } from './schedule';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  location: Location;
  schedule: Schedule[];
  socialLinks: {
    instagram?: string | null;
    twitter?: string | null;
    facebook?: string | null;
    reddit?: string | null;
  };
  claimedBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
