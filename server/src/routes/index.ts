import express from 'express';
import recipeRoutes from './recipes.js';

const router = express.Router();

// Mount route modules
router.use('/recipes', recipeRoutes);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to Foodies API',
    version: '1.0.0',
    endpoints: {
      recipes: '/api/recipes',
      health: '/health',
    },
  });
});

export default router;
