import { Schedule } from '../../types/vendor';
import { SocialMediaPost } from '../../types/crawler';
import { calculateConfidence } from '../confidence-score/confidence-score';

/**
 * ScheduleParser - Extracts schedule information from text and social media posts
 *
 * This parser integrates with the external confidence-score service to provide
 * more accurate confidence calculations when full social media post data is available.
 *
 * Features:
 * - Enhanced confidence scoring using social media signals (verification, images)
 * - Fallback confidence calculation for plain text parsing
 * - Multiple date/time/location pattern recognition
 * - Structured output compatible with vendor schedule format
 */

export interface ParsedScheduleData {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  timeRange: string | null;
  location: string | null;
  confidence: number; // 0-1 scale indicating how confident we are in the parsing
  rawText: string;
}

export interface ScheduleParsingResult {
  schedule: ParsedScheduleData;
  isValidSchedule: boolean;
  vendorId?: string;
  source: string;
}

export class ScheduleParser {
  // Enhanced regex patterns
  private static readonly DAY_PATTERNS = [
    /(?:this\s+)?(?:today|tomorrow)/i,
    /(?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g, // MM/DD or MM/DD/YY format
    /\d{1,2}-\d{1,2}(?:-\d{2,4})?/g, // MM-DD or MM-DD-YY format
    /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?/i,
  ];

  private static readonly TIME_PATTERNS = [
    /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\s*[-–]\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)/i,
    /(\d{1,2})(?:[:.](\d{2}))?\s*[-–]\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)/i,
    /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)/i,
    /(\d{1,2})(?:[:.](\d{2}))\s*[-–]\s*(\d{1,2})(?:[:.](\d{2}))/g, // 24-hour format
  ];

  private static readonly LOCATION_PATTERNS = [
    /(?:at|@)\s+([A-Za-z\s]+(?:Park|Market|Square|Plaza|Street|Ave|Avenue|Blvd|Boulevard|Center|Mall))/i,
    /(?:location|venue):\s*([A-Za-z\s]+)/i,
    /(?:where|location):\s*([^.!?]+)/i,
    /📍\s*([^.!?]+)/i, // Location emoji
    /🏪\s*([^.!?]+)/i, // Store emoji
    /🍴\s*([^.!?]+)/i, // Food emoji
  ];

  private static readonly FOOD_TRUCK_KEYWORDS = [
    'food truck',
    'food van',
    'mobile kitchen',
    'food trailer',
    'serving',
    'open',
    'available',
    'selling',
    'menu',
  ];

  /**
   * Parse schedule information from text content
   */
  public static parseSchedule(text: string, post?: SocialMediaPost): ParsedScheduleData {
    const cleanText = this.cleanText(text);

    const date = this.extractDate(cleanText);
    const timeData = this.extractTime(cleanText);
    const location = this.extractLocation(cleanText);

    // Use external confidence calculation if post data is available
    const confidence = post
      ? this.calculateConfidenceFromPost(post, { date, timeData, location })
      : this.calculateBasicConfidence(date, timeData, location, cleanText);

    return {
      date,
      startTime: timeData.startTime,
      endTime: timeData.endTime,
      timeRange: timeData.timeRange,
      location,
      confidence,
      rawText: text,
    };
  }

  /**
   * Parse schedule from a social media post
   */
  public static parseScheduleFromPost(
    post: SocialMediaPost,
    vendorId?: string
  ): ScheduleParsingResult {
    const text = post.content.text || '';
    const schedule = this.parseSchedule(text, post); // Pass post data for better confidence calculation
    const isValidSchedule = this.isValidScheduleData(schedule);

    return {
      schedule,
      isValidSchedule,
      vendorId,
      source: `${post.platform}:${post.id}`,
    };
  }

  /**
   * Convert parsed schedule data to vendor schedule format
   */
  public static toVendorSchedule(parsed: ScheduleParsingResult, vendorId: string): Schedule | null {
    if (!parsed.isValidSchedule || !parsed.schedule.date) {
      return null;
    }

    const normalizedDate = this.normalizeDate(parsed.schedule.date);
    if (!normalizedDate) {
      return null;
    }

    return {
      vendorId,
      date: normalizedDate,
      startTime: parsed.schedule.startTime || 'TBD',
      endTime: parsed.schedule.endTime || 'TBD',
      location: parsed.schedule.location || 'TBD',
      source: parsed.source,
      confidence: parsed.schedule.confidence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Process multiple posts to extract schedules
   */
  public static extractSchedulesFromPosts(posts: SocialMediaPost[], vendorId?: string): Schedule[] {
    const schedules: Schedule[] = [];

    for (const post of posts) {
      const parsed = this.parseScheduleFromPost(post, vendorId);

      if (parsed.isValidSchedule) {
        const schedule = this.toVendorSchedule(parsed, vendorId || 'unknown');
        if (schedule) {
          schedules.push(schedule);
        }
      }
    }

    // Remove duplicates and sort by date
    return this.deduplicateSchedules(schedules);
  }

  private static extractDate(text: string): string | null {
    for (const pattern of this.DAY_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    return null;
  }

  private static extractTime(text: string): {
    startTime: string | null;
    endTime: string | null;
    timeRange: string | null;
  } {
    for (const pattern of this.TIME_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const timeRange = match[0];

        // Try to parse start and end times
        if (match.length >= 6) {
          const startTime = this.formatTime(match[1], match[2], match[3]);
          const endTime = this.formatTime(match[4], match[5], match[6] || match[3]);

          return {
            startTime,
            endTime,
            timeRange: timeRange.trim(),
          };
        } else if (match.length >= 3) {
          const time = this.formatTime(match[1], match[2], match[3]);
          return {
            startTime: time,
            endTime: null,
            timeRange: timeRange.trim(),
          };
        }

        return {
          startTime: null,
          endTime: null,
          timeRange: timeRange.trim(),
        };
      }
    }

    return {
      startTime: null,
      endTime: null,
      timeRange: null,
    };
  }

  private static extractLocation(text: string): string | null {
    for (const pattern of this.LOCATION_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  private static formatTime(hour: string, minute?: string, period?: string): string {
    if (!hour) return '';

    const h = parseInt(hour);
    const m = minute ? parseInt(minute) : 0;

    if (period) {
      return `${h}:${m.toString().padStart(2, '0')} ${period.toUpperCase()}`;
    }

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate confidence using the external confidence score service for social media posts
   */
  private static calculateConfidenceFromPost(
    post: SocialMediaPost,
    parsedData: {
      date: string | null;
      timeData: { startTime: string | null; endTime: string | null; timeRange: string | null };
      location: string | null;
    }
  ): number {
    const confidenceInput = {
      text: post.content.text || '',
      authorVerified: post.author.verified || false,
      hasImage: (post.content.images && post.content.images.length > 0) || false,
      parsedSchedule: {
        date: parsedData.date,
        timeRange: parsedData.timeData.timeRange,
        location: parsedData.location,
      },
    };

    // Convert from 0-100 scale to 0-1 scale
    return calculateConfidence(confidenceInput) / 100;
  }

  /**
   * Fallback confidence calculation for cases without full post data
   */
  private static calculateBasicConfidence(
    date: string | null,
    timeData: { startTime: string | null; endTime: string | null; timeRange: string | null },
    location: string | null,
    text: string
  ): number {
    let confidence = 0;

    // Date presence and quality
    if (date) {
      confidence += 0.4;
      if (date.match(/\d+/)) confidence += 0.1; // Specific dates get bonus
    }

    // Time presence and quality
    if (timeData.timeRange) {
      confidence += 0.3;
      if (timeData.startTime && timeData.endTime) confidence += 0.1;
    }

    // Location presence
    if (location) {
      confidence += 0.2;
    }

    // Food truck related keywords
    const lowerText = text.toLowerCase();
    for (const keyword of this.FOOD_TRUCK_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        confidence += 0.05;
        break;
      }
    }

    return Math.min(confidence, 1.0);
  }

  private static isValidScheduleData(schedule: ParsedScheduleData): boolean {
    return (
      schedule.confidence >= 0.5 &&
      (schedule.date !== null || schedule.timeRange !== null || schedule.location !== null)
    );
  }

  private static normalizeDate(dateStr: string): string | null {
    const today = new Date();
    const lowerDate = dateStr.toLowerCase();

    // Handle relative dates
    if (lowerDate.includes('today')) {
      return today.toISOString().split('T')[0];
    }

    if (lowerDate.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    // Handle day names
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = days.findIndex((day) => lowerDate.includes(day));

    if (dayIndex !== -1) {
      const targetDate = new Date(today);
      const currentDay = today.getDay();
      const daysUntilTarget = (dayIndex - currentDay + 7) % 7;

      if (daysUntilTarget === 0 && !lowerDate.includes('this')) {
        // If it's the same day and doesn't say "this", assume next week
        targetDate.setDate(targetDate.getDate() + 7);
      } else {
        targetDate.setDate(targetDate.getDate() + daysUntilTarget);
      }

      return targetDate.toISOString().split('T')[0];
    }

    // Handle MM/DD format
    const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]) - 1; // JS months are 0-indexed
      const day = parseInt(dateMatch[2]);
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear();

      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    }

    return null;
  }

  private static deduplicateSchedules(schedules: Schedule[]): Schedule[] {
    const seen = new Set<string>();
    const unique: Schedule[] = [];

    for (const schedule of schedules) {
      const key = `${schedule.vendorId}-${schedule.date}-${schedule.location}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(schedule);
      }
    }

    return unique.sort((a, b) => a.date.localeCompare(b.date));
  }

  private static cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
  }
}
