export interface ActivityLog {
  id: string;
  vendorId: string;
  timestamp: Date;
  source: string;
  confidenceScore: number;
  action: 'schedule_detected' | 'schedule_updated' | 'schedule_rejected' | 'manual_review';
  metadata?: {
    scheduleId?: string;
    originalText?: string;
    parsedData?: {
      date?: string;
      timeRange?: string;
      location?: string;
    };
    platform?: string;
    postId?: string;
  };
}
