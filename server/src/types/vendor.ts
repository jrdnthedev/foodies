export interface Location {
  lat: number;
  lng: number;
  address: string;
}
export interface SocialLinks {
  instagram: string | null;
  twitter: string | null;
}
export interface Schedule {
  vendorId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  source: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: string;
  location: Location;
  schedule: Schedule[];
  socialLinks: SocialLinks;
  claimedBy: string | null;
}
