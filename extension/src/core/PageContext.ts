import { PageContext, PageType, LinkInfo, ImageInfo, FormInfo } from '@/agents/base/types';

/**
 * Builds comprehensive page context for agent analysis
 */
export class PageContextBuilder {
  
  async build(): Promise<PageContext> {
    const startTime = performance.now();
    
    const url = new URL(window.location.href);
    const domain = url.hostname;
    
    // Extract content
    const content = await this.extractContent();
    
    // Detect page type
    const pageType = this.detectPageType(content, url);
    
    // Extract metadata
    const metadata = this.extractMetadata(pageType);
    
    // Detect language (fallback to 'en' if Chrome AI unavailable)
    const language = await this.detectLanguage(content.text);
    
    // User state
    const userState = await this.getUserState(domain);
    
    const buildTime = performance.now() - startTime;
    
    return {
      url,
      domain,
      path: url.pathname,
      title: document.title,
      language,
      content,
      metadata,
      userState,
      timestamp: new Date(),
      buildTime
    };
  }
  
  /**
   * Extract all relevant content from the page
   */
  private async extractContent(): Promise<PageContext['content']> {
    // Extract visible text (excluding scripts, styles)
    const text = this.getVisibleText();
    
    // Extract headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => h.textContent?.trim() || '')
      .filter(Boolean);
    
    // Extract links
    const links: LinkInfo[] = Array.from(document.querySelectorAll('a[href]'))
      .map(a => ({
        text: a.textContent?.trim() || '',
        href: (a as HTMLAnchorElement).href
      }))
      .filter(link => link.text.length > 0);
    
    // Extract images
    const images: ImageInfo[] = Array.from(document.querySelectorAll('img[src]'))
      .map(img => ({
        src: (img as HTMLImageElement).src,
        alt: (img as HTMLImageElement).alt || ''
      }));
    
    // Extract forms
    const forms: FormInfo[] = Array.from(document.querySelectorAll('form'))
      .map(form => ({
        action: (form as HTMLFormElement).action || '',
        method: (form as HTMLFormElement).method || 'GET',
        inputs: form.querySelectorAll('input, select, textarea').length
      }));
    
    return { text, headings, links, images, forms };
  }
  
  /**
   * Get visible text content, excluding scripts and styles
   */
  private getVisibleText(): string {
    // Clone the document to avoid modifying the original
    const clone = document.cloneNode(true) as Document;
    
    // Remove script and style elements
    const elementsToRemove = clone.querySelectorAll('script, style, noscript');
    elementsToRemove.forEach(el => el.remove());
    
    // Get text content
    const text = clone.body?.innerText || '';
    
    // Clean up whitespace
    return text.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Detect the type of page based on content and URL patterns
   */
  private detectPageType(content: PageContext['content'], url: URL): PageType {
    // Check for product page indicators
    const hasPrice = /\$|₹|£|€|¥|\d+[.,]\d{2}/.test(content.text);
    const hasAddToCart = /add to (cart|bag|basket)|buy now|purchase/i.test(content.text);
    const hasProductSchema = !!document.querySelector('[itemtype*="Product"], [typeof*="Product"]');
    const isEcommerceDomain = /amazon|flipkart|myntra|ebay|croma|shopify|woocommerce/i.test(url.hostname);
    
    if ((hasPrice && hasAddToCart) || hasProductSchema || (isEcommerceDomain && hasPrice)) {
      return 'product';
    }
    
    // Check for article indicators
    const hasArticleSchema = !!document.querySelector('article, [itemtype*="Article"], [typeof*="Article"]');
    const hasAuthor = /by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/i.test(content.text) || 
                     !!document.querySelector('[rel="author"], .author, .byline');
    const hasPublishDate = !!document.querySelector('time[datetime], [property*="published"], .publish-date');
    const isNewsDomain = /news|blog|medium|substack|wordpress/i.test(url.hostname);
    
    if (hasArticleSchema || (hasAuthor && hasPublishDate) || isNewsDomain) {
      return 'article';
    }
    
    // Check for social media indicators
    const hasSocialDomain = /facebook|twitter|instagram|reddit|tiktok|linkedin|youtube/i.test(url.hostname);
    const hasLikeButton = /like|upvote|react|share|comment/i.test(content.text);
    const hasSocialElements = !!document.querySelector('[data-testid*="like"], .like-button, .upvote, .react');
    
    if (hasSocialDomain || (hasLikeButton && hasSocialElements)) {
      return 'social';
    }
    
    // Check for video indicators
    const hasVideo = !!document.querySelector('video, [src*="youtube"], [src*="vimeo"]');
    const isVideoDomain = /youtube|vimeo|twitch|netflix|hulu/i.test(url.hostname);
    
    if (hasVideo || isVideoDomain) {
      return 'video';
    }
    
    return 'unknown';
  }
  
  /**
   * Extract structured metadata from the page
   */
  private extractMetadata(pageType: PageType): PageContext['metadata'] {
    // Extract structured data (JSON-LD, microdata, etc.)
    const structured = this.extractStructuredData();
    
    // Get charset and viewport
    const charsetMeta = document.querySelector('meta[charset]') as HTMLMetaElement;
    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    return {
      type: pageType,
      structured,
      charset: charsetMeta?.getAttribute('charset') || 'UTF-8',
      viewport: viewportMeta?.content || ''
    };
  }
  
  /**
   * Extract structured data (JSON-LD, microdata, Open Graph)
   */
  private extractStructuredData(): any {
    const structured: any = {};
    
    // JSON-LD
    const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
    if (jsonLdElements.length > 0) {
      try {
        structured.jsonLd = Array.from(jsonLdElements).map(el => JSON.parse(el.textContent || ''));
      } catch (error) {
        console.warn('Failed to parse JSON-LD:', error);
      }
    }
    
    // Open Graph
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    if (ogTags.length > 0) {
      structured.openGraph = {};
      ogTags.forEach(tag => {
        const property = (tag as HTMLMetaElement).getAttribute('property')?.replace('og:', '');
        const content = (tag as HTMLMetaElement).content;
        if (property && content) {
          structured.openGraph[property] = content;
        }
      });
    }
    
    return Object.keys(structured).length > 0 ? structured : undefined;
  }
  
  /**
   * Detect page language using Chrome's built-in AI or fallback methods
   */
  private async detectLanguage(text: string): Promise<string> {
    try {
      // Try Chrome's Language Detector API
      if ('ai' in window && 'languageDetector' in (window as any).ai) {
        const detector = await (window as any).ai.languageDetector.create();
        const results = await detector.detect(text.slice(0, 1000));
        if (results && results.length > 0) {
          return results[0].detectedLanguage;
        }
      }
    } catch (error) {
      console.warn('Chrome Language Detector not available:', error);
    }
    
    // Fallback: check HTML lang attribute
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      return htmlLang.split('-')[0]; // Get primary language code
    }
    
    // Fallback: simple heuristic detection
    return this.detectLanguageHeuristic(text);
  }
  
  /**
   * Simple heuristic language detection
   */
  private detectLanguageHeuristic(text: string): string {
    const sample = text.slice(0, 500).toLowerCase();
    
    // Hindi detection (Devanagari script)
    if (/[\u0900-\u097F]/.test(sample)) return 'hi';
    
    // Tamil detection
    if (/[\u0B80-\u0BFF]/.test(sample)) return 'ta';
    
    // Spanish detection (common words)
    if (/\b(el|la|de|que|y|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|una|está|las|los|del|al)\b/.test(sample)) {
      return 'es';
    }
    
    // French detection
    if (/\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|plus|pouvoir)\b/.test(sample)) {
      return 'fr';
    }
    
    // Default to English
    return 'en';
  }
  
  /**
   * Get user state information for this domain
   */
  private async getUserState(domain: string): Promise<PageContext['userState']> {
    // Track session start time
    const sessionKey = `session:${domain}`;
    
    try {
      const stored = await chrome.storage.local.get(sessionKey);
      const sessionStart = stored[sessionKey] || Date.now();
      
      // Store session start if not exists
      if (!stored[sessionKey]) {
        await chrome.storage.local.set({ [sessionKey]: sessionStart });
      }
      
      return {
        sessionDuration: Date.now() - sessionStart,
        scrollDepth: this.getScrollDepth(),
        interactions: 0, // Will be tracked by event listeners
        previousVisit: stored[`lastVisit:${domain}`] ? new Date(stored[`lastVisit:${domain}`]) : undefined
      };
    } catch (error) {
      console.error('Failed to get user state:', error);
      return {
        sessionDuration: 0,
        scrollDepth: 0,
        interactions: 0
      };
    }
  }
  
  /**
   * Calculate current scroll depth
   */
  private getScrollDepth(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (scrollHeight <= 0) return 1; // Fully visible page
    
    return Math.min(scrollTop / scrollHeight, 1);
  }
}
