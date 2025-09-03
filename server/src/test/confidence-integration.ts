import { ScheduleParser } from '../services/parser/schedule-parser';
import { SocialPlatform, SocialMediaPost } from '../types/crawler';

/**
 * Quick test to demonstrate the confidence score integration
 */
function testConfidenceIntegration() {
  console.log('🧪 Testing Schedule Parser Confidence Integration\n');

  // Test 1: Plain text parsing (uses fallback confidence calculation)
  console.log('Test 1: Plain text parsing');
  const plainText = "We'll be at Central Park tomorrow from 11:30am-2:30pm serving tacos!";
  const plainResult = ScheduleParser.parseSchedule(plainText);
  console.log('Text:', plainText);
  console.log('Result:', {
    date: plainResult.date,
    timeRange: plainResult.timeRange,
    location: plainResult.location,
    confidence: Math.round(plainResult.confidence * 100) + '%',
  });
  console.log('Uses: Basic confidence calculation\n');

  // Test 2: Social media post parsing (uses enhanced confidence calculation)
  console.log('Test 2: Social media post parsing');
  const mockPost = {
    id: 'test_post_123',
    platform: SocialPlatform.TWITTER,
    author: {
      username: 'tastytacos_truck',
      verified: true, // +40 points
    },
    content: {
      text: "We'll be at Central Park tomorrow from 11:30am-2:30pm serving tacos! 🌮",
      images: ['https://example.com/image.jpg'], // +10 points
    },
    engagement: { likes: 50, shares: 10, comments: 5 },
    metadata: {
      postUrl: 'https://twitter.com/test/status/123',
      timestamp: new Date(),
      hashtags: ['tacos'],
    },
  };

  const postResult = ScheduleParser.parseScheduleFromPost(mockPost as SocialMediaPost);
  console.log('Post from verified account with image');
  console.log('Result:', {
    date: postResult.schedule.date,
    timeRange: postResult.schedule.timeRange,
    location: postResult.schedule.location,
    confidence: Math.round(postResult.schedule.confidence * 100) + '%',
    isValid: postResult.isValidSchedule,
  });
  console.log('Uses: Enhanced confidence calculation with social media signals\n');

  // Test 3: Comparison showing the difference
  console.log('Test 3: Confidence comparison');
  console.log('Same text content:');
  console.log(`- Plain text confidence: ${Math.round(plainResult.confidence * 100)}%`);
  console.log(
    `- Social media post confidence: ${Math.round(postResult.schedule.confidence * 100)}%`
  );
  console.log(
    `- Difference: +${Math.round((postResult.schedule.confidence - plainResult.confidence) * 100)}% from social signals`
  );

  console.log('\n✅ Integration test completed successfully!');
}

// Export for use in other files
export { testConfidenceIntegration };

// Run test if executed directly
if (require.main === module) {
  testConfidenceIntegration();
}
