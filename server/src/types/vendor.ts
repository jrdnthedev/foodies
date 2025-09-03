export interface Location {
  lat: number;
  lng: number;
  address: string;
}
export interface SocialLinks {
  instagram: string | null;
  twitter: string | null;
  facebook?: string | null;
  website?: string | null;
}
export interface Schedule {
  vendorId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  source: string;
  confidence: number; // 0-1 scale confidence score
  createdAt?: Date; // When this schedule was first detected
  updatedAt?: Date; // When this schedule was last updated
}

export interface Vendor {
  id: string;
  name: string;
  type: string;
  location: Location;
  schedule: Schedule[];
  socialLinks: SocialLinks;
  claimedBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
