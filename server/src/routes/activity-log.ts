import express from 'express';

// Server-side ActivityLog interface
interface ActivityLog {
  id: string;
  vendorId: string;
  timestamp: Date;
  source: string;
  confidenceScore: number;
  action:
    | 'schedule_detected'
    | 'schedule_updated'
    | 'schedule_rejected'
    | 'manual_review'
    | 'business_search';
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
    searchTerm?: string;
    resultsCount?: number;
    platforms?: string[];
    success?: boolean;
    errorMessage?: string;
  };
}

const router = express.Router();

// In-memory storage for demo purposes
// In production, this would be stored in a database
const activityLogs: ActivityLog[] = [];
let nextId = 1;

// Get activity logs
router.get('/', (req, res) => {
  try {
    const { action, source, limit = 50 } = req.query;

    let filteredLogs = activityLogs;

    if (action) {
      filteredLogs = filteredLogs.filter((log) => log.action === action);
    }

    if (source) {
      filteredLogs = filteredLogs.filter((log) => log.source === source);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    const limitNum = parseInt(limit as string);
    if (limitNum > 0) {
      filteredLogs = filteredLogs.slice(0, limitNum);
    }

    res.json({
      success: true,
      data: filteredLogs,
      total: activityLogs.length,
    });
  } catch (error) {
    console.error('Activity log fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create activity log
router.post('/', (req, res) => {
  try {
    const { action, source, metadata, vendorId, confidenceScore } = req.body;

    if (!action || !source) {
      return res.status(400).json({
        success: false,
        error: 'Action and source are required',
        example: {
          action: 'business_search',
          source: 'social_media_crawler',
          metadata: {
            searchTerm: "Joe's Pizza",
            resultsCount: 15,
            platforms: ['TWITTER', 'INSTAGRAM'],
            success: true,
          },
        },
      });
    }

    const newLog: ActivityLog = {
      id: nextId.toString(),
      vendorId: vendorId || 'unknown',
      timestamp: new Date(),
      source,
      confidenceScore: confidenceScore || 0,
      action: action as ActivityLog['action'],
      metadata,
    };

    activityLogs.push(newLog);
    nextId++;

    res.status(201).json({
      success: true,
      data: newLog,
      message: 'Activity log created successfully',
    });
  } catch (error) {
    console.error('Activity log creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create activity log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get activity log by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const log = activityLogs.find((log) => log.id === id);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Activity log not found',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Activity log fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete activity log (for cleanup)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = activityLogs.findIndex((log) => log.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Activity log not found',
      });
    }

    const deletedLog = activityLogs.splice(index, 1)[0];

    res.json({
      success: true,
      data: deletedLog,
      message: 'Activity log deleted successfully',
    });
  } catch (error) {
    console.error('Activity log deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete activity log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
