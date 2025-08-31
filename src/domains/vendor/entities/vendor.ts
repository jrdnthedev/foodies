import type { Location } from './location';
import { type Schedule } from './schedule';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  location: Location;
  schedule: Schedule[];
  socialLinks: string[];
  claimedBy: string | null;
}
