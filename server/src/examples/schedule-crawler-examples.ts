import { ScheduleCrawlerService } from '../services/crawler/ScheduleCrawlerService';
import { SocialPlatform, SocialMediaPost } from '../types/crawler';
import { ScheduleParser } from '../services/parser/schedule-parser';

/**
 * Example usage of the Schedule Crawler Service
 * This demonstrates how to integrate the schedule parser with the crawler
 */

async function exampleUsage() {
  try {
    // Initialize the service with API credentials
    const scheduleCrawler = new ScheduleCrawlerService(
      {
        twitter: {
          bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
        },
        instagram: {
          accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
        },
      },
      {
        minConfidence: 0.6, // Only accept schedules with 60% confidence or higher
      }
    );

    console.log('🚀 Starting schedule crawler examples...\n');

    // Example 1: Crawl a specific vendor's schedule
    console.log('📅 Example 1: Crawling specific vendor schedule');
    const vendorResult = await scheduleCrawler.crawlVendorSchedules({
      vendorId: 'vendor_123',
      vendorName: 'Tasty Tacos Food Truck',
      socialHandle: 'tastytacos_truck',
      searchTerms: ['Tasty Tacos', 'food truck'],
      hashtags: ['tastytacos', 'foodtruck'],
      platform: SocialPlatform.TWITTER,
      maxPosts: 20,
      dateRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
        to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Next 2 weeks
      },
    });

    console.log(`Found ${vendorResult.schedules.length} schedules for ${vendorResult.vendor.name}`);
    console.log('Schedules:', vendorResult.schedules);
    console.log('Summary:', vendorResult.summary);
    console.log('');

    // Example 2: Crawl multiple vendors at once
    console.log('📋 Example 2: Crawling multiple vendors');
    const multipleResults = await scheduleCrawler.crawlMultipleVendorSchedules(
      [
        {
          id: 'vendor_1',
          name: 'Pizza Paradise',
          socialHandle: 'pizzaparadise',
          searchTerms: ['Pizza Paradise'],
          hashtags: ['pizzaparadise'],
        },
        {
          id: 'vendor_2',
          name: 'Burger Bliss',
          socialHandle: 'burgerbliss',
          searchTerms: ['Burger Bliss'],
          hashtags: ['burgerbliss'],
        },
      ],
      {
        maxPosts: 15,
        dateRange: {
          from: new Date(),
          to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        },
      }
    );

    console.log(`Crawled ${multipleResults.length} vendors:`);
    multipleResults.forEach((result) => {
      console.log(`- ${result.vendor.name}: ${result.schedules.length} schedules found`);
    });
    console.log('');

    // Example 3: Get schedules for a specific date range
    console.log('📆 Example 3: Getting schedules for specific date range');
    const dateRangeSchedules = await scheduleCrawler.getSchedulesForDateRange(
      'vendor_123',
      {
        from: new Date(),
        to: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Next 3 days
      },
      {
        vendorName: 'Tasty Tacos Food Truck',
        socialHandle: 'tastytacos_truck',
      }
    );

    console.log(`Found ${dateRangeSchedules.length} schedules for the next 3 days`);
    console.log('Schedules:', dateRangeSchedules);
    console.log('');

    // Example 4: Test schedule parsing directly
    console.log('🧪 Example 4: Testing schedule parsing');
    const { ScheduleParser } = await import('../services/parser/schedule-parser');

    const testTexts = [
      "We'll be at Central Park tomorrow from 11:30am-2:30pm serving our famous tacos! 🌮",
      "This Saturday we're serving at Riverside Market 10am-4pm. Come hungry!",
      "📍 Downtown Plaza this Friday 12-6pm. Don't miss our weekend special!",
      'Open today at Main Street Food Court until 3pm',
      'Next week schedule: Mon-Wed at City Center, Thu-Fri at Park Square',
    ];

    testTexts.forEach((text, index) => {
      const parsed = ScheduleParser.parseSchedule(text);
      console.log(`\nTest ${index + 1}: "${text}"`);
      console.log('Parsed:', {
        date: parsed.date,
        timeRange: parsed.timeRange,
        location: parsed.location,
        confidence: Math.round(parsed.confidence * 100) + '%',
      });
      console.log('Valid:', parsed.confidence >= 0.5);

      // Note: For testing with full post data and enhanced confidence calculation,
      // you would create a mock SocialMediaPost object and use parseScheduleFromPost
    });

    // Example 5: Enhanced confidence calculation with social media post data
    console.log('\n🔍 Example 5: Enhanced confidence calculation with post data');
    const mockPost = {
      id: 'test_post_123',
      platform: SocialPlatform.TWITTER,
      author: {
        username: 'tastytacos_truck',
        verified: true, // Verified accounts get bonus points
      },
      content: {
        text: "We'll be at Central Park tomorrow from 11:30am-2:30pm serving our famous tacos! 🌮",
        images: ['https://example.com/taco-image.jpg'], // Posts with images get bonus points
      },
      engagement: { likes: 50, shares: 10, comments: 5 },
      metadata: {
        postUrl: 'https://twitter.com/tastytacos_truck/status/123',
        timestamp: new Date(),
        hashtags: ['tacos', 'foodtruck'],
      },
    };

    const enhancedParsed = ScheduleParser.parseScheduleFromPost(mockPost as SocialMediaPost);
    console.log('Enhanced parsing result:', {
      date: enhancedParsed.schedule.date,
      timeRange: enhancedParsed.schedule.timeRange,
      location: enhancedParsed.schedule.location,
      confidence: Math.round(enhancedParsed.schedule.confidence * 100) + '%',
      isValid: enhancedParsed.isValidSchedule,
    });

    console.log('Confidence factors considered:');
    console.log('- Author verified: ✅ (+40 points)');
    console.log('- Has image: ✅ (+10 points)');
    console.log('- Date found: ✅ (+15 points)');
    console.log('- Time range found: ✅ (+15 points)');
    console.log('- Location found: ✅ (+20 points)');
    console.log('Total possible: 100 points (converted to 0-1 scale)');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

/**
 * Advanced example: Custom filtering and processing
 */
async function advancedExample() {
  try {
    console.log('\n🔧 Advanced Example: Custom filtering and processing\n');

    const scheduleCrawler = new ScheduleCrawlerService();

    // Get raw crawl results for custom processing
    const result = await scheduleCrawler.crawlVendorSchedules({
      vendorId: 'advanced_vendor',
      vendorName: 'Gourmet Grilled Cheese',
      searchTerms: ['Gourmet Grilled Cheese', 'food truck'],
      maxPosts: 30,
    });

    // Custom filtering: Only schedules for weekends
    const weekendSchedules = result.schedules.filter((schedule) => {
      const date = new Date(schedule.date);
      const dayOfWeek = date.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    });

    console.log(
      `Found ${weekendSchedules.length} weekend schedules out of ${result.schedules.length} total`
    );

    // Custom analysis: Group by location
    const locationGroups = result.schedules.reduce(
      (groups, schedule) => {
        const location = schedule.location || 'Unknown';
        if (!groups[location]) {
          groups[location] = [];
        }
        groups[location].push(schedule);
        return groups;
      },
      {} as Record<string, typeof result.schedules>
    );

    console.log('\nSchedules by location:');
    Object.entries(locationGroups).forEach(([location, schedules]) => {
      console.log(`- ${location}: ${schedules.length} schedules`);
    });

    // Custom analysis: Posts with high confidence but no schedule extracted
    const highConfidencePostsWithoutSchedule = result.posts.filter((post) => {
      const parsed = ScheduleParser.parseScheduleFromPost(post);
      return parsed.schedule.confidence > 0.7 && !parsed.isValidSchedule;
    });

    console.log(
      `\nFound ${highConfidencePostsWithoutSchedule.length} high-confidence posts without valid schedules`
    );
    console.log('These might need manual review or parser improvements.');
  } catch (error) {
    console.error('❌ Error in advanced example:', error);
  }
}

// Export functions for use in other files
export { exampleUsage, advancedExample };

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('🍽️  Foodies Schedule Crawler Examples\n');

  exampleUsage()
    .then(() => advancedExample())
    .then(() => {
      console.log('\n✅ All examples completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Examples failed:', error);
      process.exit(1);
    });
}
