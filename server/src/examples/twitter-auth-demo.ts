import 'dotenv/config';
import { TwitterAuthSolution, TwitterTestHelper } from '../services/crawler/TwitterAuthSolution';

/**
 * Example showing how to resolve Twitter authentication issues
 */
async function demonstrateTwitterSolution() {
  console.log('🐦 Twitter Authentication Solution Demo');
  console.log('='.repeat(50));

  // Step 1: Check if credentials are configured
  TwitterTestHelper.printSetupInfo();

  // Step 2: Validate credentials
  const validation = TwitterAuthSolution.validateCredentials();

  if (!validation.isValid) {
    console.log('\n❌ Cannot proceed without API credentials');
    console.log(TwitterAuthSolution.getSetupInstructions());
    return;
  }

  // Step 3: Test API connection
  console.log('\n🧪 Testing Twitter API connection...');
  const connectionTest = await TwitterTestHelper.testApiConnection();
  console.log(connectionTest.message);

  if (!connectionTest.success) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('- Verify your Bearer Token is correct');
    console.log('- Check that your Twitter App has the right permissions');
    console.log('- Ensure your Developer Account is active');
    return;
  }

  // Step 4: Demonstrate successful crawling
  console.log('\n🚀 Running successful Twitter crawl...');

  const crawler = TwitterAuthSolution.createAuthenticatedCrawler({
    searchTerms: ['food', 'recipe'],
    hashtags: ['cooking'],
    maxPosts: 10,
  });

  try {
    const results = await crawler.crawl();

    console.log('✅ Crawl successful!');
    console.log(`📊 Found ${results.posts.length} posts`);
    console.log(`🔍 Search query: ${results.metadata.searchQuery}`);

    // Show sample posts
    results.posts.slice(0, 3).forEach((post, index) => {
      console.log(`\n📝 Post ${index + 1}:`);
      console.log(`   👤 @${post.author.username}: ${post.author.displayName}`);
      console.log(`   💬 ${post.content.text?.substring(0, 100)}...`);
      console.log(`   👍 ${post.engagement.likes} likes, ${post.engagement.shares} shares`);
    });
  } catch (error) {
    console.error('❌ Crawl failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Auto-run the demo when this file is executed
demonstrateTwitterSolution().catch(console.error);

export { demonstrateTwitterSolution };
