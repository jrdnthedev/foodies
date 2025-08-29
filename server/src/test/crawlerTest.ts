import { SocialMediaCrawler } from '../services/crawler/SocialMediaCrawler.js';
import { SocialPlatform, CrawlerConfig } from '../types/crawler.js';

async function testCrawler() {
  console.log('🧪 Testing Social Media Crawler...\n');

  // Test configuration
  const config: CrawlerConfig = {
    searchTerms: ['food'],
    maxPosts: 5,
  };

  const crawler = new SocialMediaCrawler(
    {
      reddit: {
        userAgent: 'TestCrawler/1.0',
      },
    },
    {
      headless: true,
      timeout: 15000,
    }
  );

  try {
    // Test Reddit crawler (no API key needed)
    console.log('📱 Testing Reddit crawler...');
    const redditResult = await crawler.crawlPlatform(SocialPlatform.REDDIT, config);

    console.log(`✅ Reddit: Found ${redditResult.posts.length} posts`);
    if (redditResult.posts.length > 0) {
      console.log(`   Sample: ${redditResult.posts[0].content.text?.substring(0, 100)}...`);
    }

    console.log('\n🎉 Crawler test completed successfully!');
  } catch (error) {
    console.error('❌ Crawler test failed:', error);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCrawler();
}

export { testCrawler };
