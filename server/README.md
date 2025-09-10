# Foodies Backend API

Express.js backend server for the Foodies application with social media crawler and vendor management.

## Features

- **Express.js** server with TypeScript
- **CORS** enabled for frontend communication
- **Structured routing** with controllers and middleware
- **Error handling** middleware
- **Request logging** middleware
- **Environment configuration** with dotenv
- **Social Media Crawler** with multi-platform support
- **Profile and Post Search** capabilities
- **Database Migration System** for MongoDB
- **Vendor Management** with full CRUD operations

## API Endpoints

### Vendors

- `GET /api/vendors` - Get all vendors (supports pagination and filtering)
  - Query params: `page`, `limit`, `type`, `location`
- `GET /api/vendors/:id` - Get vendor by ID
- `POST /api/vendors` - Create new vendor

### Social Media Crawler

- `GET /api/crawler/platforms` - Get supported platforms
- `POST /api/crawler/crawl` - Crawl social media content
  - Supports both post search and profile search
  - Platform options: `TWITTER`, `INSTAGRAM`, `REDDIT`, `YOUTUBE`
- `GET /api/crawler/config/example` - Get configuration examples
- `GET /api/crawler/config/example/:platform` - Platform-specific examples

### Health Check

- `GET /health` - Server health status
- `GET /api` - API information and available endpoints

## Development

```bash
# Run backend only
npm run dev:server

# Run both frontend and backend
npm run dev:full

# Run database migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DATABASE` - Database name
- `TWITTER_BEARER_TOKEN` - Twitter API bearer token
- `YOUTUBE_API_KEY` - YouTube Data API key
- `INSTAGRAM_ACCESS_TOKEN` - Instagram access token
- `REDDIT_USER_AGENT` - Reddit API user agent

## Social Media Crawler Features

### Supported Platforms

- **Twitter/X**: API v2 integration with web scraping fallback
- **Instagram**: Basic Display API with limited web scraping
- **Reddit**: Public JSON API with comprehensive scraping
- **YouTube**: Data API v3 with video and channel search

### Search Types

- **Post Search**: Find posts containing keywords or hashtags
- **Profile Search**: Find user profiles by username or display name

### Rate Limiting

Built-in rate limiting respects platform limits:

- Twitter: 300 requests per 15 minutes
- Instagram: 200 requests per hour
- YouTube: 10,000 requests per day
- Reddit: 60 requests per minute

For detailed crawler documentation, see [../docs/social-media-crawler.md](../docs/social-media-crawler.md).

## Database System

### MongoDB Integration

- Vendor collection with full CRUD operations
- Geospatial indexing for location-based queries
- Full-text search capabilities
- Migration system for schema management

### Migration Commands

```bash
# Apply all pending migrations
npm run migrate

# Rollback the last migration
npm run migrate:rollback
```

For detailed migration documentation, see [../docs/migrations.md](../docs/migrations.md).
