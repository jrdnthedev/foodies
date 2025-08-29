import express from 'express';
import { Recipe, ApiResponse, PaginatedResponse } from '../types/index.js';

// Mock data for demonstration
const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Classic Caesar Salad',
    description: 'A fresh and crispy Caesar salad with homemade dressing',
    ingredients: [
      '1 large head romaine lettuce',
      '1/2 cup parmesan cheese, grated',
      '1/4 cup olive oil',
      '2 cloves garlic, minced',
      '2 anchovy fillets',
      '1 lemon, juiced',
      'Salt and pepper to taste',
    ],
    instructions: [
      'Wash and chop the romaine lettuce',
      'Make dressing by mixing olive oil, garlic, anchovies, and lemon juice',
      'Toss lettuce with dressing',
      'Top with parmesan cheese',
      'Season with salt and pepper',
    ],
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    difficulty: 'easy',
    category: 'Salads',
    imageUrl: '/salad.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    title: 'Spaghetti Carbonara',
    description: 'Traditional Italian pasta dish with eggs, cheese, and pancetta',
    ingredients: [
      '400g spaghetti',
      '200g pancetta, diced',
      '4 large eggs',
      '100g pecorino romano, grated',
      '2 cloves garlic, minced',
      'Black pepper to taste',
    ],
    instructions: [
      'Cook spaghetti according to package instructions',
      'Cook pancetta until crispy',
      'Whisk eggs with cheese and pepper',
      'Combine hot pasta with pancetta',
      'Add egg mixture off heat, tossing quickly',
      'Serve immediately',
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: 'medium',
    category: 'Pasta',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

export const getAllRecipes = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;

    let filteredRecipes = mockRecipes;

    if (category) {
      filteredRecipes = mockRecipes.filter(
        (recipe) => recipe.category.toLowerCase() === category.toLowerCase()
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex);

    const response: PaginatedResponse<Recipe> = {
      success: true,
      data: paginatedRecipes,
      pagination: {
        page,
        limit,
        total: filteredRecipes.length,
        totalPages: Math.ceil(filteredRecipes.length / limit),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getRecipeById = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const recipe = mockRecipes.find((r) => r.id === id);

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found',
      });
      return;
    }

    const response: ApiResponse<Recipe> = {
      success: true,
      data: recipe,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const createRecipe = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const newRecipe: Recipe = {
      id: (mockRecipes.length + 1).toString(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRecipes.push(newRecipe);

    const response: ApiResponse<Recipe> = {
      success: true,
      data: newRecipe,
      message: 'Recipe created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};
