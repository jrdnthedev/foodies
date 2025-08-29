import { CrawlerConfig } from '../types/crawler.js';

// Example configurations for different use cases

export const exampleConfigs = {
  // Search for food-related content across platforms
  foodContent: {
    searchTerms: ['delicious food', 'cooking tips', 'recipe'],
    hashtags: ['foodie', 'cooking', 'recipe', 'delicious'],
    maxPosts: 50,
    includeReplies: false,
    includeRetweets: false,
  } as CrawlerConfig,

  // Monitor specific food influencers
  foodInfluencers: {
    usernames: ['gordonramsay', 'jamieoliver', 'thefoodbabe'],
    maxPosts: 30,
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      to: new Date(),
    },
  } as CrawlerConfig,

  // Track trending food hashtags
  trendingFood: {
    hashtags: ['viral', 'trending', 'foodtrend', 'recipeviral'],
    maxPosts: 100,
    includeReplies: false,
  } as CrawlerConfig,

  // Restaurant reviews and mentions
  restaurantMentions: {
    searchTerms: ['restaurant review', 'food delivery', 'dining experience'],
    hashtags: ['restaurant', 'foodreview', 'dining'],
    maxPosts: 75,
  } as CrawlerConfig,
};

// Environment variables needed for API access
export const requiredEnvVars = {
  twitter: [
    'TWITTER_BEARER_TOKEN', // For Twitter API v2
    'TWITTER_API_KEY', // Optional: for v1.1 API
    'TWITTER_API_SECRET',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_TOKEN_SECRET',
  ],
  instagram: [
    'INSTAGRAM_ACCESS_TOKEN', // Instagram Basic Display API
    'INSTAGRAM_CLIENT_ID',
    'INSTAGRAM_CLIENT_SECRET',
  ],
  youtube: [
    'YOUTUBE_API_KEY', // YouTube Data API v3
  ],
  reddit: [
    'REDDIT_CLIENT_ID', // Optional: for authenticated requests
    'REDDIT_CLIENT_SECRET',
    'REDDIT_USER_AGENT', // Required for Reddit API
  ],
};

// Rate limiting recommendations
export const rateLimits = {
  twitter: {
    apiCallsPerWindow: 300, // Per 15 minutes
    windowMinutes: 15,
    recommendedDelay: 1000, // Between requests
  },
  instagram: {
    apiCallsPerWindow: 200, // Per hour
    windowMinutes: 60,
    recommendedDelay: 2000,
  },
  youtube: {
    apiCallsPerWindow: 10000, // Per day
    windowMinutes: 1440,
    recommendedDelay: 100,
  },
  reddit: {
    apiCallsPerWindow: 60, // Per minute
    windowMinutes: 1,
    recommendedDelay: 1000,
  },
};

// Best practices and limitations
export const crawlerNotes = {
  general: [
    'Always respect robots.txt and platform terms of service',
    'Implement proper rate limiting to avoid being blocked',
    'Use API access when available for better reliability',
    'Store credentials securely in environment variables',
    'Monitor for changes in platform HTML structure',
  ],

  twitter: [
    'Twitter API v2 requires approval for elevated access',
    'Free tier has limited monthly tweet cap',
    'Web scraping is heavily restricted and may require login',
    'Consider using Twitter Academic Research product for large-scale analysis',
  ],

  instagram: [
    "Instagram Basic Display API only returns user's own content",
    'Instagram Graph API requires business verification',
    'Web scraping is very limited due to anti-bot measures',
    'Consider Instagram Content Publishing API for business accounts',
  ],

  reddit: [
    'Reddit has a public JSON API that works without authentication',
    'Rate limiting is important - Reddit will block aggressive scrapers',
    'API is more reliable than scraping for Reddit',
    'Pushshift API can be used for historical data',
  ],

  youtube: [
    'YouTube Data API v3 is the most reliable method',
    'Free tier has generous daily quota',
    'Web scraping may trigger bot detection',
    'Video transcripts require separate API calls',
  ],
};
