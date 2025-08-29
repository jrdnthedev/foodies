# Social Media Crawler

A comprehensive social media crawler implementation using **Puppeteer**, **Cheerio**, and **Social APIs** for your Foodies application.

## 🚀 Features

- **Multi-Platform Support**: Twitter/X, Instagram, Reddit, YouTube
- **Hybrid Approach**: Uses official APIs when available, falls back to web scraping
- **Flexible Search**: Search by keywords, hashtags, or usernames
- **Rich Data Extraction**: Posts, engagement metrics, author information
- **Analysis Tools**: Influencer analysis, hashtag trending, engagement filtering
- **Rate Limiting**: Built-in delays and respect for platform limits
- **Error Handling**: Comprehensive error handling with fallback mechanisms

## 📁 Project Structure

```
server/src/
├── services/crawler/
│   ├── BaseCrawler.ts          # Abstract base class
│   ├── TwitterCrawler.ts       # Twitter/X implementation
│   ├── InstagramCrawler.ts     # Instagram implementation
│   ├── RedditCrawler.ts        # Reddit implementation
│   ├── YouTubeCrawler.ts       # YouTube implementation
│   ├── SocialMediaCrawler.ts   # Main orchestrator
│   └── index.ts                # Exports
├── controllers/
│   └── crawlerController.ts    # API endpoints
├── routes/
│   └── crawler.ts              # Route definitions
├── types/
│   └── crawler.ts              # TypeScript interfaces
├── config/
│   └── crawler.example.ts      # Example configurations
├── examples/
│   └── crawlerExample.ts       # Usage examples
└── test/
    └── crawlerTest.ts          # Basic tests
```

## 🛠️ Installation

Dependencies are already installed:

- `puppeteer` - Web scraping and browser automation
- `cheerio` - Server-side HTML parsing
- `axios` - HTTP requests for API calls
- `@types/puppeteer` - TypeScript types
- `@types/cheerio` - TypeScript types

## ⚙️ Configuration

### Environment Variables

Copy `server/.env.example` to `server/.env` and configure your API keys:

```env
# Twitter/X API v2
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_API_KEY=your_api_key_here

# Instagram Basic Display API
INSTAGRAM_ACCESS_TOKEN=your_access_token_here

# YouTube Data API v3
YOUTUBE_API_KEY=your_api_key_here

# Reddit API (optional - public API works without auth)
REDDIT_USER_AGENT=YourAppName/1.0 by YourUsername
```

### Getting API Keys

1. **Twitter**: Visit [developer.twitter.com](https://developer.twitter.com/)
2. **Instagram**: Visit [developers.facebook.com](https://developers.facebook.com/docs/instagram-basic-display-api/)
3. **YouTube**: Visit [console.developers.google.com](https://console.developers.google.com/)
4. **Reddit**: Visit [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)

## 🔌 API Endpoints

### Get Supported Platforms

```http
GET /api/crawler/platforms
```

### Crawl Single Platform

```http
POST /api/crawler/platform/:platform
Content-Type: application/json

{
  "searchTerms": ["delicious food"],
  "hashtags": ["foodie", "recipe"],
  "maxPosts": 25
}
```

### Search All Platforms

```http
POST /api/crawler/search
Content-Type: application/json

{
  "searchTerms": ["viral food"],
  "hashtags": ["foodtrend"],
  "maxPosts": 100
}
```

### Get Influencer Analysis

```http
POST /api/crawler/influencers?limit=10&minEngagement=100
Content-Type: application/json

{
  "config": {
    "hashtags": ["foodie", "cooking"],
    "maxPosts": 200
  }
}
```

## 💻 Usage Examples

### Basic Search

```typescript
import { SocialMediaCrawler, SocialPlatform } from './services/crawler';

const crawler = new SocialMediaCrawler({
  reddit: { userAgent: 'MyApp/1.0' },
});

const result = await crawler.crawlPlatform(SocialPlatform.REDDIT, {
  searchTerms: ['delicious food'],
  maxPosts: 10,
});

console.log(`Found ${result.posts.length} posts`);
```

### Multi-Platform Search

```typescript
const results = await crawler.crawlMultiplePlatforms(
  [SocialPlatform.REDDIT, SocialPlatform.YOUTUBE],
  {
    hashtags: ['cooking', 'recipe'],
    maxPosts: 20,
  }
);
```

### Influencer Analysis

```typescript
const analysis = await crawler.searchAcrossAllPlatforms({
  hashtags: ['foodie'],
  maxPosts: 100,
});

const topInfluencers = crawler.getTopInfluencers(analysis.allPosts, 10);
```

## 🎯 Platform-Specific Features

### Twitter/X

- ✅ API support (v2)
- ✅ Search by keywords, hashtags, users
- ✅ Engagement metrics
- ⚠️ Web scraping limited due to anti-bot measures

### Instagram

- ⚠️ API only returns user's own content
- ✅ Basic web scraping for hashtags/users
- ⚠️ Heavy anti-scraping measures

### Reddit

- ✅ Public JSON API (no auth needed)
- ✅ Search and user post retrieval
- ✅ Reliable web scraping fallback

### YouTube

- ✅ Data API v3 support
- ✅ Video search and channel crawling
- ✅ Engagement metrics and statistics

## 🚦 Rate Limiting & Best Practices

- **Twitter**: 300 requests per 15 minutes
- **Instagram**: 200 requests per hour
- **YouTube**: 10,000 requests per day
- **Reddit**: 60 requests per minute

The crawler automatically implements delays and respects rate limits.

## 🧪 Testing

Run the basic test:

```bash
npx tsx server/src/test/crawlerTest.ts
```

Run the comprehensive examples:

```bash
npx tsx server/src/examples/crawlerExample.ts
```

## 📊 Data Structure

Each crawled post returns:

```typescript
{
  id: string;
  platform: SocialPlatform;
  author: {
    username: string;
    displayName?: string;
    profileUrl?: string;
    verified?: boolean;
  };
  content: {
    text?: string;
    images?: string[];
    videos?: string[];
    hashtags?: string[];
    mentions?: string[];
  };
  engagement: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
  metadata: {
    postUrl: string;
    timestamp: Date;
    hashtags?: string[];
    mentions?: string[];
  };
}
```

## ⚠️ Important Notes

1. **Legal Compliance**: Always respect platform Terms of Service and robots.txt
2. **Rate Limiting**: Don't overwhelm platforms with requests
3. **API Keys**: Keep credentials secure and never commit them
4. **Data Privacy**: Respect user privacy and data protection laws
5. **Platform Changes**: Social media platforms frequently change their HTML structure

## 🔧 Troubleshooting

### Common Issues

1. **"Browser not found"**: Install Chromium manually if needed
2. **API rate limits**: Reduce request frequency or upgrade API tier
3. **Scraping blocked**: Use different user agents or implement proxy rotation
4. **Empty results**: Check if platform structure has changed

### Debug Mode

Enable debug mode by setting `headless: false` in crawler options to see browser actions.

## 🚀 Getting Started

1. Start your server:

   ```bash
   npm run dev:server
   ```

2. Test the crawler endpoints:

   ```bash
   curl http://localhost:3001/api/crawler/platforms
   ```

3. Try a basic search:
   ```bash
   curl -X POST http://localhost:3001/api/crawler/platform/reddit \
     -H "Content-Type: application/json" \
     -d '{"searchTerms": ["food"], "maxPosts": 5}'
   ```

The social media crawler is now ready to help you gather food-related content from across social platforms! 🍽️
