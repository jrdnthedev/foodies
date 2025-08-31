import { SocialMediaCrawler } from '../services/crawler/SocialMediaCrawler';
import { SocialPlatform, CrawlerConfig, ApiCredentials } from '../types/crawler';

// Example usage of the Social Media Crawler
async function runCrawlerExamples() {
  // Initialize crawler with credentials (from environment variables)
  const credentials: ApiCredentials = {
    twitter: {
      bearerToken: process.env.TWITTER_BEARER_TOKEN ?? '',
    },
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY ?? '',
    },
    reddit: {
      userAgent: 'SocialMediaCrawler/1.0',
    },
  };

  const crawler = new SocialMediaCrawler(credentials, {
    headless: true,
    timeout: 30000,
    scrollToLoad: true,
    maxScrolls: 2,
    delay: 2000,
  });

  try {
    console.log('🚀 Starting Social Media Crawler Examples...\n');

    // Example 1: Search for food content on Reddit (no API key needed)
    console.log('📱 Example 1: Searching Reddit for food content...');
    const redditConfig: CrawlerConfig = {
      platform: SocialPlatform.REDDIT,
      searchTerms: ['delicious food', 'cooking tips'],
      maxPosts: 10,
    };

    const redditResult = await crawler.crawlPlatform(SocialPlatform.REDDIT, redditConfig);
    console.log(`Found ${redditResult.posts.length} Reddit posts`);
    console.log('Sample post:', redditResult.posts[0]?.content.text?.substring(0, 100) + '...\n');

    // Example 2: Search across multiple platforms
    console.log('🌐 Example 2: Multi-platform search...');
    const multiConfig: CrawlerConfig = {
      searchTerms: ['recipe'],
      hashtags: ['cooking'],
      maxPosts: 5,
    };

    const multiResults = await crawler.crawlMultiplePlatforms(
      [SocialPlatform.REDDIT, SocialPlatform.YOUTUBE],
      multiConfig
    );

    Object.entries(multiResults).forEach(([platform, result]) => {
      console.log(`${platform}: ${result.posts.length} posts found`);
    });

    // Example 3: Get influencer analysis
    console.log('\n👑 Example 3: Influencer analysis...');
    const influencerResults = await crawler.searchAcrossAllPlatforms({
      hashtags: ['foodie', 'cooking'],
      maxPosts: 50,
    });

    const topInfluencers = crawler.getTopInfluencers(influencerResults.allPosts, 5);
    console.log('Top 5 Food Influencers:');
    topInfluencers.forEach((influencer, index) => {
      console.log(
        `${index + 1}. @${influencer.username} (${influencer.platform}) - ${influencer.totalEngagement} total engagement`
      );
    });

    // Example 4: Hashtag analysis
    console.log('\n🏷️ Example 4: Hashtag analysis...');
    const hashtagGroups = crawler.groupPostsByHashtag(influencerResults.allPosts);
    const topHashtags = Object.entries(hashtagGroups)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 5);

    console.log('Top 5 Hashtags:');
    topHashtags.forEach(([hashtag, posts], index) => {
      console.log(`${index + 1}. #${hashtag} - ${posts.length} posts`);
    });

    console.log('\n✅ Crawler examples completed successfully!');
  } catch (error) {
    console.error('❌ Crawler example failed:', error);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCrawlerExamples();
}

export { runCrawlerExamples };
