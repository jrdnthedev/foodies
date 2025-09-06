# Profile Search Feature

This document explains the new profile search functionality that allows crawlers to search for user profiles/accounts instead of posts.

## Overview

The crawlers have been updated to support two types of searches:

1. **Post Search** (original functionality) - Finds posts containing search terms
2. **Profile Search** (new functionality) - Finds user profiles/accounts with usernames or display names containing search terms

## Key Changes

### 1. Updated Types (`types/crawler.ts`)

#### New `UserProfile` Interface

```typescript
interface UserProfile {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName?: string;
  description?: string;
  profileUrl: string;
  avatarUrl?: string;
  bannerUrl?: string;
  verified?: boolean;
  metrics?: {
    followers?: number;
    following?: number;
    posts?: number;
    likes?: number;
  };
  metadata?: {
    createdAt?: Date;
    location?: string;
    website?: string;
    isPrivate?: boolean;
    isBusinessAccount?: boolean;
  };
  matchReason?: string; // Why this profile matched the search
  rawData?: TwitterUser | InstagramUser | RedditUser | YouTubeChannel;
}
```

#### Updated `CrawlerConfig`

```typescript
interface CrawlerConfig {
  searchType?: 'posts' | 'profiles'; // New field
  maxProfiles?: number; // New field for profile limits
  // ... existing fields
}
```

#### Updated `CrawlerResult`

```typescript
interface CrawlerResult {
  posts?: SocialMediaPost[]; // Optional (for backward compatibility)
  profiles?: UserProfile[]; // New field for profile results
  metadata: {
    searchType: 'posts' | 'profiles'; // New required field
    // ... existing fields
  };
  errors?: string[];
}
```

### 2. Updated Crawlers

All crawlers (`TwitterCrawler`, `RedditCrawler`, `InstagramCrawler`, `YouTubeCrawler`) now support:

- Profile search via API (when available)
- Profile search via web scraping (fallback)
- Backward compatibility with post search

## Usage Examples

### Basic Profile Search

```typescript
import { TwitterCrawler } from './services/crawler/TwitterCrawler';

const crawler = new TwitterCrawler({
  searchType: 'profiles', // KEY: Set to 'profiles'
  searchTerms: ['foodie', 'chef', 'cooking'],
  maxProfiles: 10,
});

const result = await crawler.crawl();

// Access profile results
result.profiles?.forEach((profile) => {
  console.log(`@${profile.username} - ${profile.displayName}`);
  console.log(`Followers: ${profile.metrics?.followers}`);
  console.log(`Match: ${profile.matchReason}`);
});
```

### Search for Specific Usernames

```typescript
const crawler = new TwitterCrawler({
  searchType: 'profiles',
  searchTerms: ['gordonramsay', 'jamieoliver'], // Exact usernames
  maxProfiles: 5,
});
```

### Backward Compatible Post Search

```typescript
const crawler = new TwitterCrawler({
  searchType: 'posts', // Or omit (defaults to 'posts')
  searchTerms: ['delicious food'],
  maxPosts: 10,
});

const result = await crawler.crawl();
// Use result.posts as before
```

## Platform-Specific Behavior

### Twitter/X (`TwitterCrawler`)

- **API**: Uses Twitter API v2 user search endpoint
- **Scraping**: Searches Twitter's people search and direct profile access
- **Features**: Full profile data, metrics, verification status

### Reddit (`RedditCrawler`)

- **API**: Direct username lookup + indirect search via posts
- **Scraping**: Limited (profile search via web scraping is restrictive)
- **Features**: Karma, account age, subreddit info

### Instagram (`InstagramCrawler`)

- **API**: Limited (Basic Display API doesn't support user search)
- **Scraping**: Direct profile access only (search requires login)
- **Features**: Basic profile info, follower counts (limited)

### YouTube (`YouTubeCrawler`)

- **API**: Channel search via YouTube Data API v3
- **Scraping**: Channel search and direct channel access
- **Features**: Full channel data, subscriber counts, video counts

## API Requirements

### Twitter

```typescript
const credentials = {
  twitter: {
    bearerToken: 'your_bearer_token', // Twitter API v2
  },
};
```

### YouTube

```typescript
const credentials = {
  youtube: {
    apiKey: 'your_api_key', // YouTube Data API v3
  },
};
```

### Reddit (Optional)

```typescript
const credentials = {
  reddit: {
    clientId: 'your_client_id',
    clientSecret: 'your_client_secret',
  },
};
```

## Error Handling

The crawlers handle various error scenarios:

- Missing API credentials (falls back to scraping)
- Rate limiting
- Authentication requirements
- Profile privacy settings
- Platform-specific restrictions

## Performance Considerations

- **Profile search is generally faster** than post search as it returns fewer, more targeted results
- **API access is preferred** over scraping for reliability and performance
- **Caching** can be implemented on the client side using profile IDs
- **Rate limiting** applies - respect platform limits

## Migration Guide

### From Post Search to Profile Search

**Before:**

```typescript
const result = await crawler.crawl(); // Defaults to post search
result.posts.forEach((post) => {
  // Process posts
});
```

**After:**

```typescript
const crawler = new TwitterCrawler({
  searchType: 'profiles', // Add this line
  // ... other config
});

const result = await crawler.crawl();
result.profiles?.forEach((profile) => {
  // Process profiles instead
});
```

### Handling Both Types

```typescript
const result = await crawler.crawl();

if (result.metadata.searchType === 'profiles') {
  // Handle profiles
  result.profiles?.forEach(profile => { ... });
} else {
  // Handle posts
  result.posts?.forEach(post => { ... });
}
```

## Best Practices

1. **Use specific search terms** for better profile matching
2. **Set reasonable limits** (`maxProfiles`) to avoid overwhelming results
3. **Handle API credential failures** gracefully
4. **Cache profile results** when possible
5. **Respect platform ToS** and rate limits
6. **Validate usernames** before direct lookups

## Troubleshooting

### Common Issues

1. **No profiles found**
   - Check if search terms are too specific
   - Verify API credentials
   - Try alternative search terms

2. **API errors**
   - Check API key validity
   - Verify rate limit status
   - Test with simpler queries

3. **Scraping failures**
   - Platforms may require authentication
   - Anti-bot measures may block requests
   - Consider using official APIs

### Debug Tips

Enable verbose logging to see detailed search operations:

```typescript
const result = await crawler.crawl();
console.log('Search metadata:', result.metadata);
console.log('Errors:', result.errors);
```

## Future Enhancements

Potential improvements for future versions:

- Profile similarity scoring
- Bulk profile lookups
- Profile change detection
- Enhanced filtering options
- Cross-platform profile matching
