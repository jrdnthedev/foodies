import express from 'express';
import recipeRoutes from './recipes';
import crawlerRoutes from './crawler';

const router = express.Router();

// Mount route modules
router.use('/recipes', recipeRoutes);
router.use('/crawler', crawlerRoutes);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to Foodies API',
    version: '1.0.0',
    endpoints: {
      recipes: '/api/recipes',
      crawler: '/api/crawler',
      health: '/health',
    },
  });
});

export default router;
