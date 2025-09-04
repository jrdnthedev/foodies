import { TwitterCrawler } from './TwitterCrawler';
import { ApiCredentials, CrawlerConfig, ScrapingOptions } from '../../types/crawler';

/**
 * Enhanced Twitter Crawler that handles authentication issues
 */
export class TwitterAuthSolution {
  /**
   * Create a Twitter crawler with proper authentication setup
   */
  static createAuthenticatedCrawler(
    config: CrawlerConfig,
    options: ScrapingOptions = {}
  ): TwitterCrawler {
    // Priority 1: Use API credentials if available
    const credentials: Partial<ApiCredentials['twitter']> = {
      bearerToken: process.env.TWITTER_BEARER_TOKEN || undefined,
      apiKey: process.env.TWITTER_API_KEY || undefined,
      apiSecret: process.env.TWITTER_API_SECRET || undefined,
      accessToken: process.env.TWITTER_ACCESS_TOKEN || undefined,
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || undefined,
    };

    console.log('🔐 Twitter Authentication Status:', {
      hasBearerToken: !!credentials.bearerToken,
      hasApiKey: !!credentials.apiKey,
      hasAccessToken: !!credentials.accessToken,
    });

    // Only pass credentials if at least bearerToken is available
    const validCredentials = credentials.bearerToken
      ? (credentials as ApiCredentials['twitter'])
      : undefined;

    return new TwitterCrawler(config, options, validCredentials);
  }

  /**
   * Check if Twitter API credentials are properly configured
   */
  static validateCredentials(): { isValid: boolean; message: string; setup: string[] } {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
      return {
        isValid: false,
        message: '❌ Twitter Bearer Token not found',
        setup: [
          '1. Visit https://developer.twitter.com',
          '2. Create a Developer Account',
          '3. Create a new App',
          '4. Generate Bearer Token',
          '5. Add TWITTER_BEARER_TOKEN to your .env file',
          '',
          'Example .env:',
          'TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAMLhea...',
        ],
      };
    }

    // Basic validation of Bearer Token format
    if (!bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA') || bearerToken.length < 80) {
      // Check if it's a different valid Twitter Bearer Token format
      const isValidFormat =
        bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA') && bearerToken.length >= 80;
      const isAlternativeFormat =
        bearerToken.match(/^[A-Za-z0-9+/=%]{100,}$/) && bearerToken.length >= 100;

      if (!isValidFormat && !isAlternativeFormat) {
        return {
          isValid: false,
          message: '❌ Twitter Bearer Token appears to be invalid (wrong format or too short)',
          setup: [
            'Your Bearer Token looks incorrect. Please:',
            '1. Go to https://developer.twitter.com/en/portal/dashboard',
            '2. Select your app',
            '3. Go to "Keys and tokens"',
            '4. Regenerate Bearer Token',
            '5. Copy the FULL token to your .env file',
            '',
            'Valid Bearer Token should:',
            '- Be around 100+ characters long',
            '- Not contain spaces or line breaks',
            '- Be a base64-like string',
          ],
        };
      }
    }

    return {
      isValid: true,
      message: '✅ Twitter API credentials found and appear valid',
      setup: [],
    };
  }

  /**
   * Get setup instructions for Twitter API access
   */
  static getSetupInstructions(): string {
    return `
# Twitter API Setup Instructions

## The Problem
Twitter/X requires authentication for most content access. Without proper API credentials, 
you'll encounter login redirects when trying to scrape content.

## Solution: Twitter API v2

### Step 1: Get Twitter Developer Access
1. Visit https://developer.twitter.com
2. Apply for a Developer Account (free tier available)
3. Create a new App in the Developer Portal
4. Navigate to "Keys and tokens"
5. Generate a "Bearer Token"

### Step 2: Configure Environment Variables
Create or update your .env file in the server directory:

\`\`\`bash
# Essential for avoiding login issues
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAMLhea...

# Optional: For additional API features
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
\`\`\`

### Step 3: Usage Example
\`\`\`typescript
import { TwitterAuthSolution } from './TwitterAuthSolution';

// Check credentials first
const status = TwitterAuthSolution.validateCredentials();
if (!status.isValid) {
  console.log(status.message);
  status.setup.forEach(step => console.log(step));
  return;
}

// Create authenticated crawler
const crawler = TwitterAuthSolution.createAuthenticatedCrawler({
  searchTerms: ['food', 'recipe'],
  hashtags: ['foodie', 'cooking'],
  maxPosts: 50
});

const results = await crawler.crawl();
\`\`\`

## Alternative Solutions (Less Reliable)

### Option 1: Nitter Instances
- Uses privacy-focused Twitter frontends
- May be blocked or rate-limited
- Limited functionality compared to API

### Option 2: Proxy Rotation
- Rotate IP addresses to avoid blocks
- Requires proxy service subscription
- May violate Twitter Terms of Service

### Option 3: Browser Automation with Sessions
- Store valid session cookies
- High risk of account suspension
- Violates Twitter Terms of Service

## Rate Limits

Twitter API v2 Free Tier:
- 500K tweets/month
- 2M tweets/month (Academic Research)
- Rate limits: 300 requests/15 minutes

## Best Practices

1. ✅ Use official API when possible
2. ✅ Implement proper rate limiting
3. ✅ Handle errors gracefully
4. ✅ Cache results to reduce API calls
5. ❌ Don't scrape without permission
6. ❌ Don't violate Terms of Service
7. ❌ Don't create fake accounts
    `;
  }
}

/**
 * Example usage and testing utilities
 */
export class TwitterTestHelper {
  /**
   * Test Twitter API connectivity
   */
  static async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const bearerToken = process.env.TWITTER_BEARER_TOKEN;
      if (!bearerToken) {
        return {
          success: false,
          message: 'TWITTER_BEARER_TOKEN not found in environment variables',
        };
      }

      // Simple test query
      const testConfig: CrawlerConfig = {
        searchTerms: ['hello world'],
        maxPosts: 1,
      };

      const crawler = TwitterAuthSolution.createAuthenticatedCrawler(testConfig);
      const result = await crawler.crawl();

      if (result.posts.length > 0 || (result.errors && result.errors.length === 0)) {
        return {
          success: true,
          message: '✅ Twitter API connection successful',
        };
      } else {
        return {
          success: false,
          message: `❌ Twitter API test failed: ${result.errors?.join(', ') || 'Unknown error'}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Twitter API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Print detailed setup information
   */
  static printSetupInfo(): void {
    const status = TwitterAuthSolution.validateCredentials();

    console.log('\n🐦 Twitter Crawler Setup Status');
    console.log('='.repeat(50));
    console.log(status.message);

    if (!status.isValid) {
      console.log('\n📋 Setup Instructions:');
      status.setup.forEach((step) => console.log(step));
    }

    console.log('\n📚 For complete setup guide, see:');
    console.log('server/src/config/twitter-auth-setup.md');
  }
}
