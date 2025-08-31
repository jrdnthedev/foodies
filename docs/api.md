# API Documentation

## Base URL

All API endpoints are available at: `http://localhost:3001/api`

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": <response_data>,
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "message": "Optional additional information"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [<array_of_items>],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

## Vendor Endpoints

### Get All Vendors

```http
GET /api/vendors
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by vendor type (e.g., "Mexican", "Italian")

**Example:**

```bash
curl "http://localhost:3001/api/vendors?page=1&limit=5&type=Mexican"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "vendor_001",
      "name": "Taco Time",
      "type": "Mexican",
      "location": {
        "lat": 43.6532,
        "lng": -79.3832,
        "address": "123 Queen St W, Toronto, ON"
      },
      "schedule": [
        {
          "vendorId": "vendor_001",
          "date": "2025-08-29",
          "startTime": "11:30",
          "endTime": "14:00",
          "location": "Downtown Park",
          "source": "Instagram"
        }
      ],
      "socialLinks": {
        "instagram": "https://instagram.com/tacotime_to",
        "twitter": "https://twitter.com/tacotime_to"
      },
      "claimedBy": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 3,
    "totalPages": 1
  }
}
```

### Get Vendor by ID

```http
GET /api/vendors/:id
```

**Example:**

```bash
curl http://localhost:3001/api/vendors/vendor_001
```

### Create New Vendor

```http
POST /api/vendors
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Pizza Palace",
  "type": "Italian",
  "location": {
    "lat": 43.6532,
    "lng": -79.3832,
    "address": "123 Main St, Toronto, ON"
  },
  "socialLinks": {
    "instagram": "https://instagram.com/pizzapalace"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Palace",
    "type": "Italian",
    "location": {
      "lat": 43.6532,
      "lng": -79.3832,
      "address": "123 Main St, Toronto, ON"
    },
    "socialLinks": {
      "instagram": "https://instagram.com/pizzapalace"
    }
  }'
```

## Social Media Crawler Endpoints

### Get Supported Platforms

```http
GET /api/crawler/platforms
```

**Example:**

```bash
curl http://localhost:3001/api/crawler/platforms
```

**Response:**

```json
{
  "platforms": ["TWITTER", "INSTAGRAM", "REDDIT", "YOUTUBE"],
  "message": "Available social media platforms for crawling"
}
```

### Crawl Social Media Content

```http
POST /api/crawler/crawl
Content-Type: application/json
```

**Request Body:**

```json
{
  "platform": "TWITTER",
  "config": {
    "searchTerms": ["food", "recipe"],
    "hashtags": ["foodie", "cooking"],
    "maxPosts": 10
  },
  "options": {
    "timeout": 30000
  },
  "credentials": {
    "twitter": {
      "bearerToken": "your_bearer_token"
    }
  }
}
```

**Example:**

```bash
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

### Get Configuration Examples

```http
GET /api/crawler/config/example
GET /api/crawler/config/example/:platform
```

**Examples:**

```bash
# Get all platform examples
curl http://localhost:3001/api/crawler/config/example

# Get Twitter-specific example
curl http://localhost:3001/api/crawler/config/example/twitter
```

## Health & Info Endpoints

### Health Check

```http
GET /health
```

**Example:**

```bash
curl http://localhost:3001/health
```

**Response:**

```json
{
  "status": "OK",
  "message": "Foodies API is running",
  "timestamp": "2025-08-31T12:00:00.000Z"
}
```

### API Information

```http
GET /api
```

**Example:**

```bash
curl http://localhost:3001/api
```

**Response:**

```json
{
  "message": "Welcome to Foodies API",
  "version": "1.0.0",
  "endpoints": {
    "vendor": "/api/vendors",
    "crawler": "/api/crawler",
    "health": "/health"
  }
}
```

## Error Codes

| Status Code | Description           |
| ----------- | --------------------- |
| 200         | Success               |
| 201         | Created               |
| 400         | Bad Request           |
| 404         | Not Found             |
| 500         | Internal Server Error |

## Rate Limiting

Currently, there are no specific rate limits implemented, but it's recommended to:

- Limit crawler requests to avoid overwhelming social media platforms
- Implement reasonable delays between requests
- Respect platform-specific rate limits when using their APIs
