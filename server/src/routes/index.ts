import express from 'express';
import crawlerRoutes from './crawler';
import vendorRoutes from './vendor';
const router = express.Router();

// Mount route modules
router.use('/crawler', crawlerRoutes);
router.use('/vendors', vendorRoutes);
// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to Foodies API',
    version: '1.0.0',
    endpoints: {
      vendor: '/api/vendors',
      crawler: '/api/crawler',
      health: '/health',
    },
  });
});

export default router;
