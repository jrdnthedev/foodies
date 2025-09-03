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
