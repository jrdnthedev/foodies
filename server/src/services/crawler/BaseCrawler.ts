import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { CrawlerConfig, CrawlerResult, SocialPlatform, ScrapingOptions } from '../../types/crawler';

export abstract class BaseCrawler {
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  protected config: CrawlerConfig;
  protected options: ScrapingOptions;

  constructor(config: CrawlerConfig, options: ScrapingOptions = {}) {
    this.config = config;
    this.options = {
      headless: true,
      timeout: 30000,
      scrollToLoad: false,
      maxScrolls: 3,
      delay: 1000,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      ...options,
    };
  }

  async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.options.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
        ],
      });
    }

    if (!this.page) {
      this.page = await this.browser.newPage();

      // Make the browser less detectable
      await this.page.evaluateOnNewDocument(`
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      `);

      await this.page.setUserAgent(this.options.userAgent!);
      await this.page.setViewport(this.options.viewport!);

      // Set reasonable timeouts
      await this.page.setDefaultTimeout(this.options.timeout!);
      await this.page.setDefaultNavigationTimeout(this.options.timeout!);
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async navigateToUrl(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initBrowser() first.');
    }

    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: this.options.timeout,
    });

    if (this.options.waitForSelector) {
      await this.page.waitForSelector(this.options.waitForSelector, {
        timeout: this.options.timeout,
      });
    }
  }

  protected async scrollToLoadContent(): Promise<void> {
    if (!this.page || !this.options.scrollToLoad) return;

    for (let i = 0; i < this.options.maxScrolls!; i++) {
      await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

      await new Promise((resolve) => setTimeout(resolve, this.options.delay!));
    }
  }

  protected async getPageContent(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initBrowser() first.');
    }
    return await this.page.content();
  }

  protected parseWithCheerio(html: string): cheerio.Root {
    return cheerio.load(html);
  }

  protected async makeApiRequest<T = unknown>(
    url: string,
    headers: Record<string, string> = {}
  ): Promise<T> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.options.userAgent!,
          ...headers,
        },
        timeout: this.options.timeout,
      });
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  protected generatePostId(platform: SocialPlatform, originalId?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return originalId || `${platform}_${timestamp}_${random}`;
  }

  protected extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return text.match(hashtagRegex)?.map((tag) => tag.substring(1)) || [];
  }

  protected extractMentions(text: string): string[] {
    const mentionRegex = /@[\w\u0590-\u05ff]+/g;
    return text.match(mentionRegex)?.map((mention) => mention.substring(1)) || [];
  }

  protected extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  protected cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
  }

  // Abstract methods that must be implemented by platform-specific crawlers
  abstract crawl(): Promise<CrawlerResult>;
  abstract validateConfig(): boolean;
}
