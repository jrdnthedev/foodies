import { Router } from 'express';
import { ScheduleCrawlerController } from '../controllers/schedule-crawler-controller';

const router = Router();
const scheduleCrawlerController = new ScheduleCrawlerController();

// Crawl schedules for a single vendor
router.post('/vendor-schedule', (req, res) =>
  scheduleCrawlerController.crawlVendorSchedule(req, res)
);

// Crawl schedules for multiple vendors
router.post('/multiple-vendor-schedules', (req, res) =>
  scheduleCrawlerController.crawlMultipleVendorSchedules(req, res)
);

// Get schedules for a specific date range
router.get('/schedules/:vendorId', (req, res) =>
  scheduleCrawlerController.getSchedulesForDateRange(req, res)
);

// Test schedule parsing without crawling
router.post('/test-parse', (req, res) => scheduleCrawlerController.testScheduleParsing(req, res));

// Process schedules with detailed confidence logging (hybrid approach)
router.post('/process-with-logging', (req, res) =>
  scheduleCrawlerController.processSchedulesWithLogging(req, res)
);

// Get schedule analytics
router.get('/analytics/:vendorId', (req, res) =>
  scheduleCrawlerController.getScheduleAnalytics(req, res)
);

// Update crawler configuration
router.put('/config', (req, res) => scheduleCrawlerController.updateConfig(req, res));

// Health check endpoint
router.get('/health', (req, res) => scheduleCrawlerController.healthCheck(req, res));

export default router;
