import express from 'express';
import { getAllRecipes, getRecipeById, createRecipe } from '../controllers/recipeController.js';

const router = express.Router();

// GET /api/recipes - Get all recipes with optional filtering and pagination
router.get('/', getAllRecipes);

// GET /api/recipes/:id - Get a specific recipe by ID
router.get('/:id', getRecipeById);

// POST /api/recipes - Create a new recipe
router.post('/', createRecipe);

export default router;
