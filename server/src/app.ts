import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getAllRecipes, createRecipe } from './controllers/recipeController.js';
import { AppError } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
// const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Foodies API is running',
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get('/api', (_req, res) => {
  res.json({
    message: 'Welcome to Foodies API',
    version: '1.0.0',
    endpoints: {
      recipes: '/api/recipes',
      health: '/health',
    },
  });
});

// Recipe routes
app.get('/api/recipes', getAllRecipes);
// Temporarily disabled: app.get('/api/recipes/:id', getRecipeById);
app.post('/api/recipes', createRecipe);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware (should be last)
app.use((err: AppError, _req: express.Request, res: express.Response) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`Error ${statusCode}: ${message}`);
  console.error(err.stack);

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

export default app;
