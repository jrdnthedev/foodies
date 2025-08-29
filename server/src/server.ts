import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Simple logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Foodies API is running',
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Foodies API',
    version: '1.0.0',
    endpoints: {
      recipes: '/api/recipes',
      health: '/health',
    },
  });
});

// Simple recipes endpoint
app.get('/api/recipes', (req, res) => {
  const mockRecipes = [
    {
      id: '1',
      title: 'Classic Caesar Salad',
      description: 'A fresh and crispy Caesar salad with homemade dressing',
      category: 'Salads',
      prepTime: 15,
      cookTime: 0,
      servings: 4,
      difficulty: 'easy',
    },
    {
      id: '2',
      title: 'Spaghetti Carbonara',
      description: 'Traditional Italian pasta dish with eggs, cheese, and pancetta',
      category: 'Pasta',
      prepTime: 10,
      cookTime: 15,
      servings: 4,
      difficulty: 'medium',
    },
  ];

  res.json({
    success: true,
    data: mockRecipes,
  });
});

// 404 handler - using a more specific pattern
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api`);
});
