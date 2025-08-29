import { type Schedule } from './schedule';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  location: string;
  schedule: Schedule[];
  socialLinks: string[];
  claimedBy: string;
}
