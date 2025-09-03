import express from 'express';
import { TwitterCrawler } from '../services/crawler/TwitterCrawler';
import { RedditCrawler } from '../services/crawler/RedditCrawler';
import { InstagramCrawler } from '../services/crawler/InstagramCrawler';
import { YouTubeCrawler } from '../services/crawler/YouTubeCrawler';
import { SocialMediaCrawler } from '../services/crawler/SocialMediaCrawler';
import { SocialPlatform, CrawlerConfig, ScrapingOptions } from '../types/crawler';

const router = express.Router();

// Get available crawler platforms
router.get('/platforms', (_req, res) => {
  res.json({
    platforms: Object.values(SocialPlatform),
    message: 'Available social media platforms for crawling',
  });
});

// Search across all platforms - NEW ENDPOINT
router.post('/search-all', async (req, res) => {
  try {
    const { config, platforms, options, credentials } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Config is required',
        example: {
          config: {
            searchTerms: ['business name', '"exact business name"'],
            maxPosts: 20,
            dateRange: {
              from: '2024-01-01T00:00:00.000Z',
              to: '2024-12-31T23:59:59.999Z',
            },
          },
          platforms: ['TWITTER', 'INSTAGRAM', 'REDDIT', 'YOUTUBE'],
          options: {
            timeout: 30000,
          },
        },
      });
    }

    const crawlerConfig: CrawlerConfig = {
      ...config,
      dateRange: config.dateRange
        ? {
            from: new Date(config.dateRange.from),
            to: new Date(config.dateRange.to),
          }
        : undefined,
    };

    const scrapingOptions: ScrapingOptions = options || {};

    // Normalize platform names to lowercase to match enum values
    const rawPlatforms = platforms || Object.values(SocialPlatform);
    const normalizedPlatforms = rawPlatforms.map((platform: string) => platform.toLowerCase());

    // Validate that all platforms are supported
    const validPlatforms = Object.values(SocialPlatform);
    const invalidPlatforms = normalizedPlatforms.filter(
      (platform: string) => !validPlatforms.includes(platform as SocialPlatform)
    );

    if (invalidPlatforms.length > 0) {
      return res.status(400).json({
        error: 'Invalid platforms provided',
        invalidPlatforms,
        validPlatforms,
        hint: 'Platform names should be lowercase: twitter, instagram, reddit, youtube',
      });
    }

    const targetPlatforms = normalizedPlatforms as SocialPlatform[];

    // Add environment-based credentials if not provided
    const defaultCredentials = {
      reddit: {
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        userAgent: process.env.REDDIT_USER_AGENT || 'foodies/1.0',
      },
      twitter: {
        bearerToken: process.env.TWITTER_BEARER_TOKEN,
      },
      youtube: {
        apiKey: process.env.YOUTUBE_API_KEY,
      },
      instagram: {
        // Add Instagram credentials if you have them
      },
    };

    // Merge provided credentials with defaults
    const finalCredentials = {
      ...defaultCredentials,
      ...credentials,
    };

    const socialMediaCrawler = new SocialMediaCrawler(finalCredentials, scrapingOptions);
    const result = await socialMediaCrawler.crawlMultiplePlatforms(targetPlatforms, crawlerConfig);

    // Transform the result to match the expected format
    const allPosts = Object.values(result).flatMap((platformResult) => platformResult.posts);
    const platformCounts = Object.entries(result).reduce(
      (acc, [platform, platformResult]) => {
        acc[platform] = platformResult.posts.length;
        return acc;
      },
      {} as Record<string, number>
    );

    const allErrors = Object.values(result).flatMap(
      (platformResult) => platformResult.errors || []
    );

    // Sort by timestamp (newest first)
    allPosts.sort((a, b) => b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime());

    const response = {
      success: true,
      allPosts: allPosts.slice(0, crawlerConfig.maxPosts || 100),
      byPlatform: result,
      summary: {
        totalPosts: allPosts.length,
        platformCounts,
        errors: allErrors,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Multi-platform crawler error:', error);
    res.status(500).json({
      error: 'Multi-platform crawling failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Crawl social media posts
router.post('/crawl', async (req, res) => {
  try {
    const { platform, config, options, credentials } = req.body;

    if (!platform || !config) {
      return res.status(400).json({
        error: 'Platform and config are required',
        example: {
          platform: 'TWITTER',
          config: {
            searchTerms: ['food', 'recipe'],
            maxPosts: 10,
          },
          options: {
            timeout: 30000,
          },
        },
      });
    }

    let crawler;
    const crawlerConfig: CrawlerConfig = config;
    const scrapingOptions: ScrapingOptions = options || {};

    // Normalize platform to lowercase to match enum values
    const normalizedPlatform = platform.toLowerCase();

    switch (normalizedPlatform) {
      case SocialPlatform.TWITTER:
        crawler = new TwitterCrawler(crawlerConfig, scrapingOptions, credentials?.twitter);
        break;
      case SocialPlatform.REDDIT:
        crawler = new RedditCrawler(crawlerConfig, scrapingOptions, credentials?.reddit);
        break;
      case SocialPlatform.INSTAGRAM:
        crawler = new InstagramCrawler(crawlerConfig, scrapingOptions, credentials?.instagram);
        break;
      case SocialPlatform.YOUTUBE:
        crawler = new YouTubeCrawler(crawlerConfig, scrapingOptions, credentials?.youtube);
        break;
      default:
        return res.status(400).json({
          error: `Unsupported platform: ${platform}`,
          supportedPlatforms: Object.values(SocialPlatform),
          hint: 'Platform names should be lowercase: twitter, instagram, reddit, youtube',
        });
    }

    const result = await crawler.crawl();

    res.json({
      success: true,
      platform: normalizedPlatform,
      result,
    });
  } catch (error) {
    console.error('Crawler error:', error);
    res.status(500).json({
      error: 'Crawling failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get crawler configuration example
router.get('/config/example', (_req, res) => {
  const examples = {
    [SocialPlatform.TWITTER]: {
      platform: SocialPlatform.TWITTER,
      config: {
        searchTerms: ['food', 'recipe', 'cooking'],
        hashtags: ['foodie', 'cooking', 'recipe'],
        usernames: ['foodnetwork', 'bonappetit'],
        maxPosts: 20,
      },
      options: {
        timeout: 30000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      credentials: {
        twitter: {
          bearerToken: 'your_bearer_token_here',
        },
      },
    },
    [SocialPlatform.REDDIT]: {
      platform: SocialPlatform.REDDIT,
      config: {
        searchTerms: ['food', 'recipe'],
        subreddits: ['food', 'recipes', 'cooking'],
        maxPosts: 15,
      },
      options: {
        timeout: 30000,
      },
    },
    [SocialPlatform.INSTAGRAM]: {
      platform: SocialPlatform.INSTAGRAM,
      config: {
        hashtags: ['food', 'recipe', 'cooking'],
        usernames: ['foodnetwork'],
        maxPosts: 10,
      },
      options: {
        timeout: 30000,
      },
    },
    [SocialPlatform.YOUTUBE]: {
      platform: SocialPlatform.YOUTUBE,
      config: {
        searchTerms: ['cooking tutorial', 'recipe video'],
        channelIds: ['UCbpMy0Fg74eXXkvxJrtEn3w'], // Example channel
        maxPosts: 10,
      },
      options: {
        timeout: 30000,
      },
      credentials: {
        youtube: {
          apiKey: 'your_youtube_api_key_here',
        },
      },
    },
  };

  res.json({
    message: 'Configuration examples for all platforms',
    examples,
  });
});

router.get('/config/example/:platform', (req, res) => {
  const { platform } = req.params;

  const examples = {
    [SocialPlatform.TWITTER]: {
      platform: SocialPlatform.TWITTER,
      config: {
        searchTerms: ['food', 'recipe', 'cooking'],
        hashtags: ['foodie', 'cooking', 'recipe'],
        usernames: ['foodnetwork', 'bonappetit'],
        maxPosts: 20,
      },
      options: {
        timeout: 30000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      credentials: {
        twitter: {
          bearerToken: 'your_bearer_token_here',
        },
      },
    },
    [SocialPlatform.REDDIT]: {
      platform: SocialPlatform.REDDIT,
      config: {
        searchTerms: ['food', 'recipe'],
        subreddits: ['food', 'recipes', 'cooking'],
        maxPosts: 15,
      },
      options: {
        timeout: 30000,
      },
    },
    [SocialPlatform.INSTAGRAM]: {
      platform: SocialPlatform.INSTAGRAM,
      config: {
        hashtags: ['food', 'recipe', 'cooking'],
        usernames: ['foodnetwork'],
        maxPosts: 10,
      },
      options: {
        timeout: 30000,
      },
    },
    [SocialPlatform.YOUTUBE]: {
      platform: SocialPlatform.YOUTUBE,
      config: {
        searchTerms: ['cooking tutorial', 'recipe video'],
        channelIds: ['UCbpMy0Fg74eXXkvxJrtEn3w'], // Example channel
        maxPosts: 10,
      },
      options: {
        timeout: 30000,
      },
      credentials: {
        youtube: {
          apiKey: 'your_youtube_api_key_here',
        },
      },
    },
  };

  if (platform && platform.toUpperCase() in examples) {
    res.json(examples[platform.toUpperCase() as SocialPlatform]);
  } else {
    res.status(400).json({
      error: `Unsupported platform: ${platform}`,
      supportedPlatforms: Object.values(SocialPlatform),
    });
  }
});

export default router;
