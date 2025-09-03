import express from 'express';
import crawlerRoutes from './crawler';
import vendorRoutes from './vendor';
import scheduleCrawlerRoutes from './schedule-crawler';
import activityLogRoutes from './activity-log';

const router = express.Router();

// Mount route modules
router.use('/crawler', crawlerRoutes);
router.use('/schedule-crawler', scheduleCrawlerRoutes);
router.use('/vendors', vendorRoutes);
router.use('/activity-log', activityLogRoutes);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to Foodies API',
    version: '1.0.0',
    endpoints: {
      vendor: '/api/vendors',
      crawler: '/api/crawler',
      scheduleCrawler: '/api/schedule-crawler',
      activityLog: '/api/activity-log',
      health: '/health',
    },
    scheduleParsingApproaches: {
      basic: 'GET /api/schedule-crawler/vendor-schedule',
      withLogging: 'POST /api/schedule-crawler/process-with-logging',
      analytics: 'GET /api/schedule-crawler/analytics/:vendorId',
    },
    socialMediaSearch: {
      searchAll: 'POST /api/crawler/search-all',
      platforms: 'GET /api/crawler/platforms',
      activityLog: 'GET /api/activity-log?action=business_search',
    },
  });
});

export default router;
