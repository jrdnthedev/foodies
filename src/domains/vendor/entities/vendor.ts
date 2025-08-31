import type { Location } from './location';
import { type Schedule } from './schedule';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  location: Location;
  schedule: Schedule[];
  socialLinks: {
    instagram?: string;
    twitter?: string | null;
    facebook?: string;
    website?: string;
  };
  claimedBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
