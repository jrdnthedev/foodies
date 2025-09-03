import { ScheduleConfidenceService } from '../services/ScheduleConfidenceService';
import { ScheduleCrawlerService } from '../services/crawler/ScheduleCrawlerService';
import { SocialPlatform, SocialMediaPost } from '../types/crawler';
import { Schedule } from '../types/vendor';

/**
 * Example demonstrating both approaches for storing schedule confidence scores:
 * 1. Simple approach: Store confidence in Schedule model only
 * 2. Hybrid approach: Store in Schedule model + detailed ActivityLog
 */

async function demonstrateApproaches() {
  console.log('🏗️  Schedule Confidence Storage Approaches Demo\n');

  // Mock existing schedules
  const existingSchedules: Schedule[] = [
    {
      vendorId: 'vendor_123',
      date: '2025-09-05',
      startTime: '10:00 AM',
      endTime: '3:00 PM',
      location: 'Downtown Market',
      source: 'twitter:old_post',
      confidence: 0.7,
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-01'),
    },
  ];

  console.log('📊 Approach 1: Simple - Store confidence in Schedule model only');
  await demonstrateSimpleApproach();

  console.log('\n📈 Approach 2: Hybrid - Schedule model + ActivityLog');
  await demonstrateHybridApproach(existingSchedules);

  console.log('\n🔍 Comparison Summary');
  compareApproaches();
}

async function demonstrateSimpleApproach() {
  const scheduleCrawler = new ScheduleCrawlerService();

  try {
    // Crawl schedules - confidence stored directly in Schedule objects
    const result = await scheduleCrawler.crawlVendorSchedules({
      vendorId: 'vendor_123',
      vendorName: 'Tasty Tacos Truck',
      searchTerms: ['Tasty Tacos'],
      maxPosts: 5,
    });

    console.log('Results from simple approach:');
    console.log(`- Found ${result.schedules.length} schedules`);
    console.log(`- Average confidence: ${result.summary.averageConfidence}`);

    if (result.schedules.length > 0) {
      console.log('- Sample schedule:');
      const sample = result.schedules[0];
      console.log(`  Date: ${sample.date}`);
      console.log(`  Time: ${sample.startTime} - ${sample.endTime}`);
      console.log(`  Location: ${sample.location}`);
      console.log(`  Confidence: ${Math.round(sample.confidence * 100)}%`);
      console.log(`  Source: ${sample.source}`);
    }

    console.log('\n✅ Pros of simple approach:');
    console.log('  - Fast queries (no joins needed)');
    console.log('  - Simple data model');
    console.log('  - Direct filtering by confidence');

    console.log('\n❌ Cons of simple approach:');
    console.log('  - No audit trail');
    console.log('  - Limited analytics');
    console.log("  - Can't track confidence changes over time");
  } catch (error) {
    console.error('Simple approach error:', error);
  }
}

async function demonstrateHybridApproach(existingSchedules: Schedule[]) {
  const confidenceService = new ScheduleConfidenceService(0.5);

  // Mock social media posts
  const mockPosts: SocialMediaPost[] = [
    {
      id: 'twitter_post_1',
      platform: SocialPlatform.TWITTER,
      author: {
        username: 'tastytacos_truck',
        verified: true, // High confidence factor
      },
      content: {
        text: "Tomorrow we'll be at Central Park from 11:30am-2:30pm! Come hungry! 🌮",
        images: ['https://example.com/taco-image.jpg'], // Another confidence factor
      },
      engagement: { likes: 50, shares: 10, comments: 5 },
      metadata: {
        postUrl: 'https://twitter.com/tastytacos_truck/status/123',
        timestamp: new Date(),
        hashtags: ['tacos', 'foodtruck'],
      },
    },
    {
      id: 'instagram_post_1',
      platform: SocialPlatform.INSTAGRAM,
      author: {
        username: 'tastytacos_truck',
        verified: false, // Lower confidence
      },
      content: {
        text: 'Maybe downtown tomorrow sometime?', // Vague - low confidence
        images: [],
      },
      engagement: { likes: 5, shares: 0, comments: 1 },
      metadata: {
        postUrl: 'https://instagram.com/p/abc123',
        timestamp: new Date(),
        hashtags: [],
      },
    },
  ];

  try {
    const result = await confidenceService.processMultipleSchedules(
      mockPosts,
      'vendor_123',
      existingSchedules
    );

    console.log('Results from hybrid approach:');
    console.log(`- Created: ${result.summary.created} schedules`);
    console.log(`- Updated: ${result.summary.updated} schedules`);
    console.log(`- Rejected: ${result.summary.rejected} schedules`);
    console.log(`- Activity logs: ${result.activityLogs.length} entries`);

    console.log('\nSchedules with confidence:');
    result.schedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${schedule.date} at ${schedule.location}`);
      console.log(`     Confidence: ${Math.round(schedule.confidence * 100)}%`);
      console.log(`     Source: ${schedule.source}`);
    });

    console.log('\nActivity Log Sample:');
    result.activityLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. Action: ${log.action}`);
      console.log(`     Confidence: ${Math.round(log.confidenceScore * 100)}%`);
      console.log(`     Platform: ${log.metadata?.platform}`);
      console.log(`     Text: "${log.metadata?.originalText?.substring(0, 50)}..."`);
    });

    // Demonstrate analytics
    const analytics = confidenceService.getScheduleAnalytics(result.activityLogs);
    console.log('\nAnalytics:');
    console.log(`- Average confidence: ${Math.round(analytics.averageConfidence * 100)}%`);
    console.log('- Confidence distribution:', analytics.confidenceDistribution);
    console.log('- Platform breakdown:', analytics.platformBreakdown);
    console.log('- Action breakdown:', analytics.actionBreakdown);

    console.log('\n✅ Pros of hybrid approach:');
    console.log('  - Complete audit trail');
    console.log('  - Rich analytics capabilities');
    console.log('  - Track confidence evolution');
    console.log('  - Debug parsing decisions');

    console.log('\n❌ Cons of hybrid approach:');
    console.log('  - More complex queries');
    console.log('  - Additional storage overhead');
    console.log('  - Risk of data inconsistency');
  } catch (error) {
    console.error('Hybrid approach error:', error);
  }
}

function compareApproaches() {
  console.log('┌─────────────────────┬─────────────────┬─────────────────────┐');
  console.log('│ Aspect              │ Simple Approach │ Hybrid Approach     │');
  console.log('├─────────────────────┼─────────────────┼─────────────────────┤');
  console.log('│ Query Performance   │ ⭐⭐⭐⭐⭐        │ ⭐⭐⭐             │');
  console.log('│ Storage Efficiency  │ ⭐⭐⭐⭐⭐        │ ⭐⭐⭐             │');
  console.log('│ Audit Trail         │ ⭐               │ ⭐⭐⭐⭐⭐          │');
  console.log('│ Analytics           │ ⭐⭐             │ ⭐⭐⭐⭐⭐          │');
  console.log('│ Debugging           │ ⭐⭐             │ ⭐⭐⭐⭐⭐          │');
  console.log('│ Implementation      │ ⭐⭐⭐⭐⭐        │ ⭐⭐⭐             │');
  console.log('│ Data Consistency    │ ⭐⭐⭐⭐⭐        │ ⭐⭐⭐             │');
  console.log('└─────────────────────┴─────────────────┴─────────────────────┘');

  console.log('\n🎯 Recommendation:');
  console.log('Use the HYBRID APPROACH because:');
  console.log('1. Food truck schedules change frequently - audit trail is valuable');
  console.log('2. Confidence scores help identify which sources are most reliable');
  console.log('3. Analytics can improve parsing algorithms over time');
  console.log('4. Manual review capabilities for low-confidence schedules');
  console.log("5. Better debugging when schedules aren't detected correctly");

  console.log('\n📝 Implementation Strategy:');
  console.log('1. Store confidence in Schedule model for operational queries');
  console.log('2. Log all parsing attempts in ActivityLog for audit/analytics');
  console.log('3. Use background jobs to analyze activity logs and improve parsing');
  console.log('4. Provide manual review interface for low-confidence schedules');
}

// Export for use in other files
export { demonstrateApproaches };

// Run demo if executed directly
if (require.main === module) {
  demonstrateApproaches()
    .then(() => {
      console.log('\n🎉 Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error);
      process.exit(1);
    });
}
