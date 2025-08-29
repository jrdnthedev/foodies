import express from 'express';
import { TwitterCrawler } from '../services/crawler/TwitterCrawler';
import { RedditCrawler } from '../services/crawler/RedditCrawler';
import { InstagramCrawler } from '../services/crawler/InstagramCrawler';
import { YouTubeCrawler } from '../services/crawler/YouTubeCrawler';
import { SocialPlatform, CrawlerConfig, ScrapingOptions } from '../types/crawler';

const router = express.Router();

// Get available crawler platforms
router.get('/platforms', (_req, res) => {
  res.json({
    platforms: Object.values(SocialPlatform),
    message: 'Available social media platforms for crawling',
  });
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

    switch (platform.toUpperCase()) {
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
        });
    }

    const result = await crawler.crawl();

    res.json({
      success: true,
      platform,
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
router.get('/config/example/:platform?', (req, res) => {
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
    res.json({
      message: 'Configuration examples for all platforms',
      examples,
    });
  }
});

export default router;
