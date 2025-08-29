# Social Media Crawler Implementation

This implementation provides a comprehensive social media crawler using Puppeteer, Cheerio, and various Social APIs.

## Features

- **Multi-platform support**: Twitter/X, Instagram, Reddit, YouTube
- **Hybrid approach**: Uses APIs when available, falls back to web scraping
- **Flexible configuration**: Search by terms, hashtags, usernames
- **Rich data extraction**: Posts, engagement metrics, author info
- **Analysis tools**: Influencer analysis, hashtag trending, engagement filtering

## API Endpoints

### Get Supported Platforms

```
GET /api/crawler/platforms
```

### Crawl Single Platform

```
POST /api/crawler/platform/:platform
```

### Crawl Multiple Platforms

```
POST /api/crawler/platforms
```

### Search All Platforms

```
POST /api/crawler/search
```

### Get Influencer Analysis

```
POST /api/crawler/influencers?limit=10&minEngagement=100
```

### Get Hashtag Analysis

```
POST /api/crawler/hashtags
```

## Example Usage

### 1. Search for Food Content on Twitter

```bash
curl -X POST http://localhost:3001/api/crawler/platform/twitter \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerms": ["delicious food", "cooking tips"],
    "hashtags": ["foodie", "recipe"],
    "maxPosts": 25,
    "includeReplies": false
  }'
```

### 2. Multi-Platform Food Influencer Search

```bash
curl -X POST http://localhost:3001/api/crawler/platforms \
  -H "Content-Type: application/json" \
  -d '{
    "platforms": ["twitter", "instagram", "youtube"],
    "config": {
      "usernames": ["gordonramsay", "jamieoliver"],
      "maxPosts": 20
    }
  }'
```

### 3. Search All Platforms for Trending Food

```bash
curl -X POST http://localhost:3001/api/crawler/search \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerms": ["viral food"],
    "hashtags": ["foodtrend", "viral"],
    "maxPosts": 100,
    "dateRange": {
      "from": "2024-01-01T00:00:00Z",
      "to": "2024-12-31T23:59:59Z"
    }
  }'
```

### 4. Get Top Food Influencers

```bash
curl -X POST http://localhost:3001/api/crawler/influencers?limit=10 \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "hashtags": ["foodie", "cooking", "recipe"],
      "maxPosts": 200
    }
  }'
```

## Environment Variables Setup

Create a `.env` file in your server directory:

```env
# Twitter/X API (https://developer.twitter.com/)
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here

# Instagram API (https://developers.facebook.com/docs/instagram-basic-display-api/)
INSTAGRAM_ACCESS_TOKEN=your_access_token_here
INSTAGRAM_CLIENT_ID=your_client_id_here
INSTAGRAM_CLIENT_SECRET=your_client_secret_here

# YouTube Data API (https://developers.google.com/youtube/v3)
YOUTUBE_API_KEY=your_api_key_here

# Reddit API (https://www.reddit.com/prefs/apps)
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=YourApp/1.0 by YourUsername
```

## Configuration Options

### CrawlerConfig

```typescript
{
  platform?: SocialPlatform;
  searchTerms?: string[];        // Keywords to search for
  hashtags?: string[];           // Hashtags to search (without #)
  usernames?: string[];          // Usernames to crawl
  maxPosts?: number;             // Maximum posts to return
  dateRange?: {                  // Filter by date range
    from: Date;
    to: Date;
  };
  includeReplies?: boolean;      // Include reply posts
  includeRetweets?: boolean;     // Include retweets/shares
}
```

### ScrapingOptions

```typescript
{
  headless?: boolean;            // Run browser in headless mode
  timeout?: number;              // Request timeout in ms
  waitForSelector?: string;      // CSS selector to wait for
  scrollToLoad?: boolean;        // Scroll to load more content
  maxScrolls?: number;           // Maximum scroll attempts
  delay?: number;                // Delay between actions in ms
  userAgent?: string;            // Custom user agent
  viewport?: {                   // Browser viewport size
    width: number;
    height: number;
  };
}
```

## Response Format

### Single Platform Response

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "twitter_1234567890_abc123",
        "platform": "twitter",
        "author": {
          "username": "foodie_chef",
          "displayName": "Chef Foodie",
          "profileUrl": "https://twitter.com/foodie_chef",
          "verified": true
        },
        "content": {
          "text": "Just made the most amazing pasta! #foodie #cooking",
          "images": ["https://example.com/image.jpg"],
          "hashtags": ["foodie", "cooking"],
          "mentions": ["helper_chef"]
        },
        "engagement": {
          "likes": 150,
          "shares": 25,
          "comments": 12
        },
        "metadata": {
          "postUrl": "https://twitter.com/foodie_chef/status/1234567890",
          "timestamp": "2024-01-15T10:30:00Z"
        }
      }
    ],
    "metadata": {
      "totalFound": 25,
      "crawledAt": "2024-01-15T12:00:00Z",
      "searchQuery": "delicious food OR #foodie",
      "platform": "twitter"
    }
  }
}
```

## Important Notes

1. **Legal Compliance**: Always check and comply with each platform's Terms of Service and robots.txt
2. **Rate Limiting**: Implement proper delays to avoid being blocked
3. **API Keys**: Keep your API credentials secure and never commit them to version control
4. **Error Handling**: The crawler includes comprehensive error handling and fallback mechanisms
5. **Data Privacy**: Be mindful of user privacy and data protection regulations

## Platform-Specific Limitations

- **Twitter**: Requires API access for reliable data; web scraping is heavily restricted
- **Instagram**: Very limited scraping capabilities; API only returns user's own content
- **Reddit**: Public JSON API works well; scraping is possible but rate-limited
- **YouTube**: API is most reliable; generous free tier quotas available

## Getting Started

1. Install dependencies (already done):

   ```bash
   npm install puppeteer cheerio axios @types/puppeteer
   ```

2. Set up your environment variables in `.env`

3. Start your server:

   ```bash
   npm run dev:server
   ```

4. Test the crawler:
   ```bash
   curl http://localhost:3001/api/crawler/platforms
   ```

The crawler is now ready to use! Start with the platforms endpoint to see what's available and configured.
