# Twitter/X API Authentication Setup Guide

## The Problem

Twitter/X now requires authentication for most content access, including search results. When you try to scrape Twitter without proper credentials, you'll encounter:

- Login redirects when accessing search pages
- Empty results or blocked requests
- "Rate limit exceeded" errors
- CAPTCHA challenges

## Solution: Twitter API v2 (Recommended ✅)

### Step 1: Get Twitter Developer Account

1. Visit [developer.twitter.com](https://developer.twitter.com)
2. Apply for a Developer Account (free tier available)
3. Describe your use case honestly (e.g., "Social media content analysis for food industry research")
4. Wait for approval (usually instant for basic access)

### Step 2: Create Twitter App

1. Go to the [Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create App" or "Create Project"
3. Fill in your app details:
   - **App Name**: `foodies-crawler` (or your preferred name)
   - **Description**: Social media content crawler for food industry
   - **Website**: Your project URL or GitHub repository
4. Save your app

### Step 3: Generate API Credentials

1. In your app dashboard, go to "Keys and tokens"
2. Generate a **Bearer Token** (this is essential!)
3. Copy and securely store your credentials

### Step 4: Configure Environment Variables

Create or update `.env` file in your server root:

```bash
# Essential for Twitter API access
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAMLhea...

# Optional: For additional API features
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

### Step 5: Test Your Setup

Run this test command in your server directory:

```bash
# Test API connection
npm run test:twitter-auth

# Or run the demo directly
npx ts-node src/examples/twitter-auth-demo.ts
```

### Step 6: Update Your Code

Use the enhanced TwitterAuthSolution:

```typescript
import { TwitterAuthSolution } from './services/crawler/TwitterAuthSolution';

// Check credentials first
const status = TwitterAuthSolution.validateCredentials();
if (!status.isValid) {
  console.log('❌ Twitter credentials not configured');
  return;
}

// Create authenticated crawler
const crawler = TwitterAuthSolution.createAuthenticatedCrawler({
  searchTerms: ['food', 'recipe'],
  hashtags: ['foodie', 'cooking'],
  maxPosts: 50,
});

// This will now work without login issues!
const results = await crawler.crawl();
```

## Alternative Solutions (Less Reliable ⚠️)

### Option 1: Nitter Instances

Nitter provides privacy-focused Twitter frontends that may work without auth:

```typescript
// Already implemented in your TwitterCrawler
// Will automatically try Nitter instances as fallback
```

**Pros**: No API credentials needed
**Cons**: Often blocked, limited features, may be unreliable

### Option 2: Browser Session Management

```typescript
// Store valid Twitter session cookies
// WARNING: Violates Twitter ToS and risks account suspension
await page.setCookie({
  name: 'auth_token',
  value: 'your_session_token',
  domain: '.x.com',
});
```

**Pros**: Full access like a logged-in user
**Cons**: Violates Terms of Service, account ban risk, complex to maintain

### Option 3: Proxy Rotation

```typescript
const browser = await puppeteer.launch({
  args: ['--proxy-server=proxy:port'],
});
```

**Pros**: May bypass some IP-based blocks
**Cons**: Expensive, still requires dealing with login, may be slow

## API Rate Limits & Costs

### Twitter API v2 Free Tier:

- **500K tweets/month** for search
- **2M tweets/month** for Academic Research
- **300 requests/15 minutes** rate limit
- No cost for basic usage

### Best Practices:

1. ✅ **Cache results** to reduce API calls
2. ✅ **Implement rate limiting** in your code
3. ✅ **Handle errors gracefully**
4. ✅ **Use specific search terms** to get better results
5. ❌ **Don't exceed rate limits**
6. ❌ **Don't create multiple apps to bypass limits**

## Troubleshooting

### "Invalid authentication credentials"

- Double-check your Bearer Token
- Ensure no extra spaces in `.env` file
- Verify your app permissions in Developer Portal

### "Rate limit exceeded"

- Wait for the rate limit window to reset (15 minutes)
- Implement proper delays between requests
- Consider upgrading to paid tier if needed

### "App suspended"

- Review Twitter Developer Policy
- Contact Twitter Support
- Ensure your use case complies with ToS

### Still getting login prompts?

1. Verify `TWITTER_BEARER_TOKEN` is set correctly
2. Check that your crawler is using API mode:
   ```typescript
   console.log('Has bearer token:', !!credentials?.bearerToken);
   ```
3. Enable debug logging to see which mode is being used

## Code Examples

### Basic Usage:

```typescript
import { TwitterCrawler } from './services/crawler/TwitterCrawler';

const crawler = new TwitterCrawler(
  { searchTerms: ['food'], maxPosts: 10 },
  {}, // options
  { bearerToken: process.env.TWITTER_BEARER_TOKEN }
);

const results = await crawler.crawl();
```

### Advanced Usage:

```typescript
const crawler = TwitterAuthSolution.createAuthenticatedCrawler({
  searchTerms: ['restaurant review'],
  hashtags: ['foodie', 'dining'],
  usernames: ['gordonramsay'],
  maxPosts: 100,
  dateRange: {
    from: new Date('2024-01-01'),
    to: new Date(),
  },
  includeReplies: false,
  includeRetweets: true,
});
```

## Security Notes

1. **Never commit credentials** to version control
2. **Use environment variables** for all API keys
3. **Rotate credentials** periodically
4. **Monitor usage** in Twitter Developer Portal
5. **Respect rate limits** to avoid suspension

## Support

- [Twitter Developer Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Twitter Developer Community](https://twittercommunity.com/)
- [API Status Page](https://api.twitterstat.us/)

---

**Need help?** Run the demo script to test your setup:

```bash
npx ts-node src/examples/twitter-auth-demo.ts
```
