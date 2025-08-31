# Foodies - Full Stack React + Express Application

A full-stack food vendor discovery application built with React + TypeScript + Vite frontend and Express.js backend. Features include vendor management, discovery through social media crawling, and a comprehensive food vendor platform.

## Features

### Frontend (React + TypeScript + Vite)

- Modern React application with TypeScript
- Responsive design with modular component architecture
- Domain-driven structure for scalability
- Testing setup with comprehensive test suites

### Backend (Express.js + TypeScript)

- RESTful API with Express.js
- TypeScript for type safety
- Social media crawler for content discovery
- Food vendor management system
- Comprehensive error handling and logging

### Social Media Crawler

- Multi-platform social media content crawling
- Supported platforms: Twitter/X, Instagram, Reddit, YouTube
- API-based and web scraping approaches
- Configurable search terms, hashtags, and user targeting
- Rate limiting and error handling

## Project Structure

```
├── src/                    # React frontend application
│   ├── app/               # Main app components and routing
│   ├── domains/           # Domain-specific modules
│   │   ├── discovery/     # Content discovery features
│   │   ├── user/          # User management
│   │   ├── vendor/        # Vendor management
│   │   └── ...            # Other domains
│   └── shared/            # Shared components and utilities
├── server/                # Express.js backend API
│   ├── src/
│   │   ├── controllers/   # API controllers
│   │   ├── services/      # Business logic and services
│   │   │   └── crawler/   # Social media crawler services
│   │   ├── routes/        # API routes
│   │   ├── types/         # TypeScript type definitions
│   │   └── middleware/    # Express middleware
│   └── package.json       # Backend dependencies
└── public/                # Static assets
```

## Development

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Run Full Stack Application

```bash
npm run dev:full
```

### Run Frontend Only

```bash
npm run dev
```

### Run Backend Only

```bash
npm run dev:server
```

## API Endpoints

For detailed API documentation, see [docs/api.md](docs/api.md).

**Quick Reference:**

### Vendors

- `GET /api/vendors` - Get all vendors (with pagination and filtering)
- `GET /api/vendors/:id` - Get vendor by ID
- `POST /api/vendors` - Create a new vendor

### Social Media Crawler

- `GET /api/crawler/platforms` - Get supported platforms
- `POST /api/crawler/crawl` - Crawl social media content
- `GET /api/crawler/config/example` - Get configuration examples

### Health & Info

- `GET /health` - Health check endpoint
- `GET /api` - API info and available endpoints

## Social Media Crawler

This project includes a comprehensive social media crawler that can gather food-related content from Twitter/X, Instagram, Reddit, and YouTube.

For detailed crawler documentation, see [docs/social-media-crawler.md](docs/social-media-crawler.md).

**Key Features:**

- Multi-platform support (Twitter/X, Instagram, Reddit, YouTube)
- Hybrid approach using APIs and web scraping
- Flexible search by keywords, hashtags, or usernames
- Rich data extraction with engagement metrics
- Built-in rate limiting and error handling

### Quick Start Examples

```bash
# Get all vendors
curl http://localhost:3001/api/vendors

# Get vendor by ID
curl http://localhost:3001/api/vendors/vendor_001

# Crawl Twitter for food content
curl -X POST http://localhost:3001/api/crawler/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "TWITTER",
    "config": {
      "searchTerms": ["food", "recipe"],
      "hashtags": ["foodie", "cooking"],
      "maxPosts": 10
    }
  }'
```

For more detailed examples and complete API documentation, see [docs/api.md](docs/api.md).

## Documentation

- [API Documentation](docs/api.md) - Complete API reference and examples
- [Social Media Crawler](docs/social-media-crawler.md) - Comprehensive crawler documentation

## Contributing

### Commit Message Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

#### Examples

```bash
# Feature addition
git commit -m "feat(vendor): add vendor management system"

# Bug fix
git commit -m "fix(api): resolve vendor API pagination issue"

# Documentation update
git commit -m "docs: update README with vendor API examples"

# Refactoring
git commit -m "refactor(components): simplify vendor card component"

# Breaking change
git commit -m "feat(api)!: change vendor response format

BREAKING CHANGE: vendor API now returns data in new format"
```

#### Scope Examples

- `crawler`: Social media crawler functionality
- `vendor`: Food vendor management
- `api`: Backend API changes
- `ui`: Frontend UI components
- `auth`: Authentication related changes
- `config`: Configuration changes
- `types`: TypeScript type definitions

### Development Guidelines

1. Write descriptive commit messages following the format above
2. Include tests for new features
3. Update documentation when adding new features
4. Follow TypeScript best practices
5. Use ESLint and Prettier for code formatting

## Technology Stack

## Technology Stack

### Frontend

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and development server
- **ESLint & Prettier** - Code linting and formatting

### Backend

- **Express.js** - Web application framework
- **TypeScript** - Type safety for backend code
- **Node.js** - JavaScript runtime

### Social Media Crawler

- **Cheerio** - Server-side HTML parsing
- **Puppeteer** - Web scraping and automation
- **Platform APIs** - Direct integration with social media APIs

## Environment Variables

Create a `.env` file in the server directory:

```env
# Social Media API Keys (optional)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
YOUTUBE_API_KEY=your_youtube_api_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in the root directory for frontend:

```env
VITE_API_URL=http://localhost:3001
```

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
