# Schedule Crawler Integration

This integration combines the social media crawler with an intelligent schedule parser to automatically extract food truck schedules from social media posts.

## Features

- **Multi-platform crawling**: Searches Twitter, Instagram, Reddit, and YouTube for schedule information
- **Intelligent parsing**: Extracts dates, times, and locations from natural language posts
- **Confidence scoring**: Rates the reliability of extracted schedule data (0-1 scale)
- **Flexible configuration**: Supports vendor-specific search terms, hashtags, and date ranges
- **Batch processing**: Can crawl multiple vendors simultaneously
- **API endpoints**: RESTful API for easy integration

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Social Media    │    │ Schedule Parser  │    │ Vendor Schedule │
│ Crawler         │───▶│ Service          │───▶│ Database        │
│                 │    │                  │    │                 │
│ • Twitter       │    │ • Date extraction│    │ • Structured    │
│ • Instagram     │    │ • Time parsing   │    │   schedule data │
│ • Reddit        │    │ • Location found │    │ • Source track  │
│ • YouTube       │    │ • Confidence     │    │ • Deduplication │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Usage

### 1. Basic Vendor Schedule Crawling

```typescript
import { ScheduleCrawlerService } from './services/crawler/ScheduleCrawlerService';

const scheduleCrawler = new ScheduleCrawlerService({
  twitter: { bearerToken: 'your_token' },
  instagram: { accessToken: 'your_token' },
});

const result = await scheduleCrawler.crawlVendorSchedules({
  vendorId: 'vendor_123',
  vendorName: 'Tasty Tacos Food Truck',
  socialHandle: 'tastytacos_truck',
  searchTerms: ['Tasty Tacos', 'food truck'],
  hashtags: ['tastytacos', 'foodtruck'],
  maxPosts: 20,
});

console.log(`Found ${result.schedules.length} schedules`);
```

### 2. Multiple Vendor Crawling

```typescript
const results = await scheduleCrawler.crawlMultipleVendorSchedules([
  {
    id: 'vendor_1',
    name: 'Pizza Paradise',
    socialHandle: 'pizzaparadise',
  },
  {
    id: 'vendor_2',
    name: 'Burger Bliss',
    socialHandle: 'burgerbliss',
  },
]);
```

### 3. Direct Schedule Parsing

```typescript
import { ScheduleParser } from './services/parser/schedule-parser';

const text = "We'll be at Central Park tomorrow from 11:30am-2:30pm serving tacos!";
const parsed = ScheduleParser.parseSchedule(text);

console.log({
  date: parsed.date, // "tomorrow"
  timeRange: parsed.timeRange, // "11:30am-2:30pm"
  location: parsed.location, // "Central Park"
  confidence: parsed.confidence, // 0.85
});
```

## API Endpoints

### POST /api/schedule-crawler/vendor-schedule

Crawl schedules for a single vendor.

**Request:**

```json
{
  "vendorId": "vendor_123",
  "vendorName": "Tasty Tacos Food Truck",
  "socialHandle": "tastytacos_truck",
  "searchTerms": ["Tasty Tacos", "food truck"],
  "hashtags": ["tastytacos", "foodtruck"],
  "maxPosts": 20,
  "dateRange": {
    "from": "2025-09-01T00:00:00Z",
    "to": "2025-09-15T00:00:00Z"
  },
  "minConfidence": 0.6
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "vendor": {
      "id": "vendor_123",
      "name": "Tasty Tacos Food Truck",
      "socialHandle": "tastytacos_truck"
    },
    "schedules": [
      {
        "vendorId": "vendor_123",
        "date": "2025-09-05",
        "startTime": "11:30 AM",
        "endTime": "2:30 PM",
        "location": "Central Park",
        "source": "twitter:1234567890"
      }
    ],
    "summary": {
      "totalPosts": 15,
      "totalSchedules": 3,
      "averageConfidence": 0.73,
      "platformBreakdown": {
        "twitter": 10,
        "instagram": 5
      }
    }
  }
}
```

### POST /api/schedule-crawler/multiple-vendor-schedules

Crawl schedules for multiple vendors.

### GET /api/schedule-crawler/schedules/:vendorId

Get schedules for a specific vendor and date range.

### POST /api/schedule-crawler/test-parse

Test schedule parsing without crawling.

### GET /api/schedule-crawler/health

Check service health and API credentials status.

## Configuration

### Environment Variables

```bash
# Twitter/X API
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret

# Instagram API
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret

# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret
REDDIT_USER_AGENT=your_app_name

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key
```

### Service Configuration

```typescript
const scheduleCrawler = new ScheduleCrawlerService(credentials, {
  minConfidence: 0.6, // Only accept schedules with 60%+ confidence
});

// Update confidence threshold
scheduleCrawler.setMinConfidence(0.7);
```

## Schedule Parser

The schedule parser uses advanced regex patterns and natural language processing to extract:

### Date Patterns

- Relative dates: "today", "tomorrow", "this Saturday"
- Specific dates: "9/5", "September 5th"
- Day names: "Monday", "next Friday"

### Time Patterns

- Time ranges: "11:30am-2:30pm", "11-2pm"
- Single times: "2pm", "14:00"
- 12/24 hour formats

### Location Patterns

- Address indicators: "at Central Park", "@Downtown Market"
- Location emoji: "📍 Main Street"
- Venue types: "Park", "Market", "Square", "Plaza"

### Confidence Scoring

The parser uses an external confidence scoring service that evaluates multiple factors:

#### Social Media Signals (when parsing from posts)

- **Author verification** (40 points): Verified accounts are more trustworthy
- **Image presence** (10 points): Posts with images often indicate actual events
- **Date extraction** (15 points): Specific dates found in text
- **Time extraction** (15 points): Time ranges found in text
- **Location extraction** (20 points): Specific locations identified

#### Fallback Scoring (for plain text parsing)

- **Date presence** (40% weight): Higher for specific dates vs. relative dates
- **Time presence** (30% weight): Higher for complete time ranges
- **Location presence** (20% weight): Bonus for recognized location types
- **Food truck keywords** (10% weight): Presence of relevant terms

The confidence score is normalized to a 0-1 scale, with scores ≥0.5 considered valid schedules.

## Error Handling

The service includes comprehensive error handling:

- **API rate limits**: Automatic retry with exponential backoff
- **Invalid credentials**: Clear error messages for missing tokens
- **Parsing failures**: Logs errors but continues processing other posts
- **Network timeouts**: Configurable timeout settings

## Performance Considerations

### Optimizations

- **Parallel crawling**: Multiple platforms crawled simultaneously
- **Caching**: Results cached to avoid redundant API calls
- **Deduplication**: Removes duplicate schedules automatically
- **Batch processing**: Efficient handling of multiple vendors

### Rate Limiting

- Respects platform API limits
- Adds delays between vendor crawls
- Implements exponential backoff for failures

## Monitoring and Logging

### Health Checks

```bash
curl http://localhost:3001/api/schedule-crawler/health
```

### Logging

- Structured JSON logs
- Error tracking with context
- Performance metrics
- API usage statistics

## Testing

### Unit Tests

```bash
npm test services/parser/schedule-parser.test.ts
```

### Integration Tests

```bash
npm test services/crawler/ScheduleCrawlerService.test.ts
```

### Manual Testing

```bash
# Test parsing
curl -X POST http://localhost:3001/api/schedule-crawler/test-parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Tomorrow at Central Park from 11am-2pm!"}'
```

## Troubleshooting

### Common Issues

1. **No schedules found**
   - Check API credentials
   - Verify search terms match vendor posts
   - Lower confidence threshold
   - Increase maxPosts limit

2. **Low confidence scores**
   - Posts may be too vague
   - Missing time or location information
   - Consider manual review of high-confidence posts

3. **API errors**
   - Check rate limits
   - Verify token expiration
   - Review network connectivity

### Debug Mode

```typescript
const result = await scheduleCrawler.crawlVendorSchedules({
  // ... config
  debug: true, // Enables verbose logging
});
```

## Future Enhancements

- **Machine learning**: Train models on historical schedule data
- **Real-time updates**: Webhook notifications for new schedules
- **Mobile app integration**: Push notifications for favorite vendors
- **Analytics dashboard**: Track schedule accuracy and trends
- **Multi-language support**: Parse schedules in different languages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

This project is licensed under the MIT License.
