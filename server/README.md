# Foodies Backend API

Express.js backend server for the Foodies application.

## Features

- **Express.js** server with TypeScript
- **CORS** enabled for frontend communication
- **Structured routing** with controllers and middleware
- **Error handling** middleware
- **Request logging** middleware
- **Environment configuration** with dotenv
- **Mock recipe data** for development

## API Endpoints

### Recipes

- `GET /api/recipes` - Get all recipes (supports pagination and filtering)
  - Query params: `page`, `limit`, `category`
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create new recipe

### Health Check

- `GET /health` - Server health status

## Development

```bash
# Run backend only
npm run dev:server

# Run both frontend and backend
npm run dev:full
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
