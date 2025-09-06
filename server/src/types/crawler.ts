// Social Media Crawler Types

export enum SocialPlatform {
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  REDDIT = 'reddit',
  YOUTUBE = 'youtube',
}

export interface SocialMediaPost {
  id: string;
  platform: SocialPlatform;
  author: {
    username: string;
    displayName?: string;
    profileUrl?: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  content: {
    text?: string;
    images?: string[];
    videos?: string[];
    links?: string[];
    hashtags?: string[];
    mentions?: string[];
  };
  engagement: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
  metadata: {
    postUrl: string;
    timestamp: Date;
    hashtags?: string[];
    mentions?: string[];
  };
  rawData?: TwitterTweet | InstagramMedia | RedditPost | YouTubeVideo;
}

export interface CrawlerConfig {
  platform?: SocialPlatform;
  searchType?: 'posts' | 'profiles'; // New field to specify search type
  searchTerms?: string[];
  hashtags?: string[];
  usernames?: string[];
  maxPosts?: number;
  maxProfiles?: number; // New field for profile search limits
  dateRange?: {
    from: Date;
    to: Date;
  };
  includeReplies?: boolean;
  includeRetweets?: boolean;
}

export interface UserProfile {
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

export interface CrawlerResult {
  posts?: SocialMediaPost[]; // Keep for backward compatibility
  profiles?: UserProfile[]; // New field for profile search results
  metadata: {
    totalFound: number;
    crawledAt: Date;
    searchQuery: string;
    platform: SocialPlatform;
    searchType: 'posts' | 'profiles'; // New field to indicate search type
  };
  errors?: string[];
}

export interface ScrapingOptions {
  headless?: boolean;
  timeout?: number;
  scrollToLoad?: boolean;
  maxScrolls?: number;
  delay?: number;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  waitForSelector?: string;
}

export interface ApiCredentials {
  twitter?: {
    bearerToken: string;
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessTokenSecret?: string;
  };
  instagram?: {
    accessToken: string;
    clientId?: string;
    clientSecret?: string;
  };
  reddit?: {
    clientId?: string;
    clientSecret?: string;
    userAgent?: string;
  };
  youtube?: {
    apiKey: string;
  };
}

// Platform-specific API response types

// Twitter/X API Types
export interface TwitterApiResponse {
  data?: TwitterTweet[];
  includes?: {
    users?: TwitterUser[];
    media?: TwitterMedia[];
  };
  meta?: {
    result_count: number;
    next_token?: string;
  };
}

export interface TwitterTweet {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  attachments?: {
    media_keys?: string[];
  };
  referenced_tweets?: Array<{
    type: string;
    id: string;
  }>;
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified?: boolean;
  description?: string;
  location?: string;
  url?: string;
  created_at?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

export interface TwitterMedia {
  media_key: string;
  type: string;
  url?: string;
  preview_image_url?: string;
}

// Instagram API Types
export interface InstagramUser {
  id: string;
  username: string;
  account_type?: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  media_count?: number;
  followers_count?: number;
  follows_count?: number;
  name?: string;
  biography?: string;
  website?: string;
  profile_picture_url?: string;
}

export interface InstagramApiResponse {
  data?: InstagramMedia[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  permalink: string;
  timestamp: string;
}

// Reddit API Types
export interface RedditUser {
  id: string;
  name: string;
  created_utc: number;
  comment_karma: number;
  link_karma: number;
  is_gold?: boolean;
  is_mod?: boolean;
  verified?: boolean;
  has_verified_email?: boolean;
  icon_img?: string;
  subreddit?: {
    display_name?: string;
    title?: string;
    public_description?: string;
    subscribers?: number;
    banner_img?: string;
  };
}

export interface RedditApiResponse {
  data?: {
    children: Array<{
      data: RedditPost;
    }>;
    after?: string;
    before?: string;
  };
}

export interface RedditPost {
  id: string;
  title: string;
  selftext?: string;
  author: string;
  subreddit: string;
  url?: string;
  permalink: string;
  created_utc: number;
  ups: number;
  downs: number;
  num_comments: number;
  thumbnail?: string;
  is_video?: boolean;
}

// YouTube API Types
export interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    country?: string;
  };
  statistics?: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  brandingSettings?: {
    channel?: {
      title: string;
      description: string;
      keywords?: string;
      trackingAnalyticsAccountId?: string;
      moderateComments?: boolean;
      unsubscribedTrailer?: string;
      defaultLanguage?: string;
      country?: string;
    };
    image?: {
      bannerExternalUrl?: string;
    };
  };
}

// YouTube API Types
export interface YouTubeApiResponse {
  items?: YouTubeVideo[];
  nextPageToken?: string;
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeVideo {
  id: string | { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}
