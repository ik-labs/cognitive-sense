/**
 * UrgencyDetector - Detects artificial urgency and time pressure tactics
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { ContentGenerator } from '../../../ai/ContentGenerator';
import { Debug } from '../../../utils/Debug';
import { ShoppingDetector } from '../ShoppingAgent';

export class UrgencyDetector implements ShoppingDetector {
  name = 'UrgencyDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      // Extract urgency-related content
      const urgencyContent = this.extractUrgencyContent(context);
      
      if (urgencyContent.length === 0) {
        return detections;
      }

      // Get diverse set of urgency elements for better coverage
      // Take 1 of each type for variety in scoring
      const topContent: typeof urgencyContent = [];
      const typesSeen = new Set<string>();
      
      for (const content of urgencyContent) {
        if (!typesSeen.has(content.type) && topContent.length < 2) {
          topContent.push(content);
          typesSeen.add(content.type);
        }
      }
      
      // If we have less than 2, add more (but avoid duplicates)
      if (topContent.length < 2) {
        for (const content of urgencyContent) {
          if (topContent.length >= 2) break;
          if (!topContent.includes(content)) {
            topContent.push(content);
          }
        }
      }
      
      console.log(`⚡ Fast mode: Analyzing ${topContent.length} diverse urgency elements (${urgencyContent.length} total)`);
      
      // Batch analyze with AI for better performance
      const analysisPromises = topContent.map(content => 
        this.analyzeUrgencyContent(content, context, aiManager)
      );
      
      const results = await Promise.all(analysisPromises);
      
      // Filter out null results
      for (const detection of results) {
        if (detection) {
          detections.push(detection);
        }
      }

      return detections;
    } catch (error) {
      console.error('UrgencyDetector failed:', error);
      return detections;
    }
  }

  private extractUrgencyContent(_context: PageContext): Array<{
    text: string;
    element?: HTMLElement;
    type: 'countdown' | 'scarcity' | 'time_limit' | 'pressure';
  }> {
    const content: Array<{
      text: string;
      element?: HTMLElement;
      type: 'countdown' | 'scarcity' | 'time_limit' | 'pressure';
    }> = [];

    // Prioritize DOM elements with countdown/timer classes
    const countdownElements = this.findCountdownElements();
    console.log(`🔍 Found ${countdownElements.length} countdown elements`);
    countdownElements.forEach(element => {
      content.push({
        text: element.textContent || '',
        element,
        type: 'countdown'
      });
    });

    // Find scarcity elements
    const scarcityElements = this.findScarcityElements();
    console.log(`🔍 Found ${scarcityElements.length} scarcity elements`);
    scarcityElements.forEach(element => {
      content.push({
        text: element.textContent || '',
        element,
        type: 'scarcity'
      });
    });

    // Find urgency/pressure elements
    const pressureElements = this.findPressureElements();
    console.log(`🔍 Found ${pressureElements.length} pressure elements`);
    pressureElements.forEach(element => {
      content.push({
        text: element.textContent || '',
        element,
        type: 'pressure'
      });
    });

    console.log(`📊 Total urgency content found: ${content.length}`);
    
    // Filter out junk content and deduplicate
    const seen = new Set<string>();
    const filtered = content.filter(item => {
      const text = item.text.trim();
      
      // Filter out empty, very short, or junk content
      if (text.length < 5) return false;
      if (text.startsWith('{') || text.startsWith('[')) return false; // JSON
      if (text.includes('AUI_TEMPLATE')) return false; // Config data
      if (text.includes('weblab')) return false; // Internal data
      
      // Deduplicate by normalized text content (case-insensitive, remove extra spaces)
      const normalized = text.toLowerCase().replace(/\s+/g, ' ').substring(0, 150);
      if (seen.has(normalized)) {
        console.log(`🔄 Skipping duplicate: "${text.substring(0, 50)}..."`);
        return false;
      }
      seen.add(normalized);
      return true;
    });
    
    console.log(`📊 After filtering and deduplication: ${filtered.length} unique elements`);
    
    // Further deduplicate by semantic similarity (same type + similar text)
    const semanticSeen = new Set<string>();
    const semanticFiltered = filtered.filter(item => {
      // Create a semantic key based on type and first keywords
      const words = item.text.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
      const semanticKey = `${item.type}:${words}`;
      
      if (semanticSeen.has(semanticKey)) {
        console.log(`🔄 Skipping semantically similar: "${item.text.substring(0, 50)}..."`);
        return false;
      }
      semanticSeen.add(semanticKey);
      return true;
    });
    
    console.log(`📊 After semantic deduplication: ${semanticFiltered.length} unique elements`);
    return semanticFiltered.slice(0, 10); // Limit to prevent overload
  }

  private hasScarcityPattern(text: string): boolean {
    const patterns = [
      /only\s*\d+\s*(left|remaining|in\s*stock)/,
      /\d+\s*(left|remaining)\s*(in\s*stock)?/,
      /(low|limited)\s*stock/,
      /almost\s*(gone|sold\s*out)/,
      /hurry.*\d+.*left/,
      /\d+\s*people.*viewing/,
      /\d+\s*in.*cart/
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }

  private findCountdownElements(): HTMLElement[] {
    const selectors = [
      '[class*="countdown"]',
      '[class*="timer"]',
      '[id*="countdown"]',
      '[id*="timer"]',
      '[data-countdown]',
      '[data-timer]',
      '[class*="deal-end"]',
      '[class*="time-left"]',
      '[class*="deal"]',
      '[class*="festival"]',
      '[class*="sale"]'
    ];

    const elements = this.findElementsBySelectors(selectors);
    
    // Also search for elements containing countdown-like text
    const allElements = Array.from(document.querySelectorAll('div, span, p')) as HTMLElement[];
    const textBasedElements = allElements.filter(el => {
      const text = (el.textContent || '').toLowerCase();
      // Look for countdown patterns in text
      return (
        /\d+\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)/.test(text) ||
        /festival.*\d+/.test(text) ||
        /deal.*\d+/.test(text) ||
        text.includes('no_of_hours') ||
        text.includes('no_of_minutes') ||
        text.includes('no_of_seconds')
      );
    });

    return [...elements, ...textBasedElements].slice(0, 20);
  }

  private findScarcityElements(): HTMLElement[] {
    const selectors = [
      '[class*="stock"]',
      '[class*="inventory"]',
      '[class*="availability"]',
      '[class*="quantity"]'
    ];

    const elements = this.findElementsBySelectors(selectors);
    
    // Filter to only elements with scarcity text
    return elements.filter(el => {
      const text = (el.textContent || '').toLowerCase();
      return this.hasScarcityPattern(text);
    });
  }

  private findPressureElements(): HTMLElement[] {
    const selectors = [
      '[class*="urgent"]',
      '[class*="hurry"]',
      '[class*="limited"]',
      '[class*="exclusive"]',
      '[class*="flash"]'
    ];

    return this.findElementsBySelectors(selectors);
  }

  private findElementsBySelectors(selectors: string[]): HTMLElement[] {
    const elements: HTMLElement[] = [];
    
    selectors.forEach(selector => {
      try {
        const found = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
        elements.push(...Array.from(found));
      } catch (e) {
        // Ignore invalid selectors
      }
    });

    // Remove duplicates and hidden elements
    const uniqueElements = Array.from(new Set(elements));
    return uniqueElements.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0; // Only visible elements
    });
  }

  private async analyzeUrgencyContent(
    content: { text: string; type: string; element?: HTMLElement },
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      // Truncate content to avoid quota issues and speed up processing
      const truncatedText = content.text.length > 200 
        ? content.text.substring(0, 200) + '...' 
        : content.text;
      
      // Use AI to analyze with specific, fast prompt
      const prompt = `Rate urgency manipulation (0-10): "${truncatedText}"\nCountdown timers, scarcity claims, time pressure = high score.`;
      
      const aiResult = await aiManager.prompt.detect({
        prompt
        // No context for maximum speed
      });

      // Use the score directly from the AI response (already parsed in PromptEngine)
      const score = aiResult.score || this.extractScoreFromResponse(aiResult.text);
      const isManipulative = (aiResult.detected !== undefined ? aiResult.detected : score >= 6);

      if (!isManipulative && score < 4) {
        return null; // Not manipulative enough
      }

      // Calculate severity (adjusted thresholds for shopping context)
      const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';
      
      console.log(`📊 Detection: score=${score}, severity=${severity}, detected=${aiResult.detected}`);
      Debug.detectionFound('Urgency', score, severity);

      // Generate user-friendly content using Writer API
      const contentGenerator = new ContentGenerator();
      const detection: Detection = {
        id: `urgency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'shopping_persuasion' as any,
        type: 'urgency',
        score,
        severity,
        title: this.generateTitle(content.type, severity),
        description: this.generateDescription(content.text, content.type),
        reasoning: aiResult.reasoning || 'AI detected urgency manipulation',
        element: content.element, // Include DOM element for highlighting
        details: [
          { label: 'Type', value: content.type.replace('_', ' ') },
          { label: 'Content', value: content.text.slice(0, 100) + (content.text.length > 100 ? '...' : '') },
          { label: 'Confidence', value: `${Math.round(aiResult.confidence * 100)}%` }
        ],
        actions: [
          {
            label: 'Take Time',
            variant: 'primary',
            icon: '⏰',
            onClick: () => this.suggestCoolingOff()
          },
          {
            label: 'Learn More',
            variant: 'secondary',
            icon: '📚',
            onClick: () => this.showUrgencyEducation()
          }
        ],
        confidence: aiResult.confidence,
        timestamp: new Date(),
        pageUrl: context.url.href,
        learnMoreUrl: 'https://cognitivesense.app/learn/urgency-tactics'
      };

      // Generate AI-powered user-friendly content (wait for it)
      try {
        Debug.apiCall('Writer', 'start');
        const warning = await contentGenerator.generateUserFriendlyWarning(detection as any);
        (detection as any).userFriendlyWarning = warning;
        Debug.contentGenerated('Urgency', 'userFriendlyWarning');
      } catch (err) {
        Debug.warning('Warning generation skipped', err);
      }

      try {
        const tip = await contentGenerator.generateEducationalTip(detection as any);
        (detection as any).educationalTip = tip;
        Debug.contentGenerated('Urgency', 'educationalTip');
      } catch (err) {
        Debug.warning('Tip generation skipped', err);
      }

      return detection;
    } catch (error) {
      console.error('Failed to analyze urgency content:', error);
      
      // Fallback analysis
      return this.fallbackAnalysis(content, context);
    }
  }

  private extractScoreFromResponse(response: string): number {
    // Try to extract score from AI response
    const scoreMatch = response.match(/score[:\s]*(\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
      return Math.min(10, Math.max(0, parseFloat(scoreMatch[1])));
    }

    // Fallback scoring based on keywords
    const manipulationKeywords = [
      'artificial', 'fake', 'misleading', 'pressure', 'manipulation',
      'deceptive', 'false', 'exaggerated', 'suspicious'
    ];

    const urgencyKeywords = [
      'urgent', 'hurry', 'limited', 'countdown', 'expires', 'last chance'
    ];

    let score = 0;
    const lowerResponse = response.toLowerCase();

    manipulationKeywords.forEach(keyword => {
      if (lowerResponse.includes(keyword)) score += 2;
    });

    urgencyKeywords.forEach(keyword => {
      if (lowerResponse.includes(keyword)) score += 1;
    });

    return Math.min(10, score);
  }

  private generateTitle(type: string, severity: string): string {
    const titles = {
      countdown: {
        high: '⚠️ Suspicious Countdown Timer',
        medium: '⚠️ Artificial Time Pressure',
        low: 'Countdown Timer Detected'
      },
      scarcity: {
        high: '⚠️ Fake Stock Scarcity',
        medium: '⚠️ Questionable Stock Claims',
        low: 'Low Stock Warning'
      },
      time_limit: {
        high: '⚠️ Misleading Time Limit',
        medium: '⚠️ Artificial Deadline',
        low: 'Limited Time Offer'
      },
      pressure: {
        high: '⚠️ High Pressure Tactics',
        medium: '⚠️ Urgency Pressure',
        low: 'Pressure Language Detected'
      }
    };

    return titles[type as keyof typeof titles]?.[severity as keyof typeof titles.countdown] || 
           'Urgency Tactic Detected';
  }

  private generateDescription(text: string, type: string): string {
    const descriptions = {
      countdown: 'This countdown timer may be artificial or reset regularly to create false urgency.',
      scarcity: 'Stock scarcity claims are often exaggerated to pressure quick decisions.',
      time_limit: 'Limited time offers are frequently extended or repeated to create false urgency.',
      pressure: 'This language is designed to pressure you into making quick decisions without proper consideration.'
    };

    const baseDescription = descriptions[type as keyof typeof descriptions] || 
                           'This content uses urgency tactics to pressure purchasing decisions.';
    
    return `${baseDescription} Content: "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`;
  }

  private fallbackAnalysis(
    content: { text: string; type: string },
    context: PageContext
  ): Detection | null {
    const text = content.text.toLowerCase();
    let score = 0;

    // Score based on pattern matching
    if (content.type === 'countdown') score += 6;
    if (content.type === 'scarcity') score += 5;
    if (content.type === 'time_limit') score += 4;
    if (content.type === 'pressure') score += 7;

    // Additional scoring
    if (text.includes('only') && /\d+/.test(text)) score += 2;
    if (text.includes('hurry') || text.includes('urgent')) score += 2;
    if (text.includes('last chance') || text.includes('final')) score += 3;

    if (score < 4) return null;

    const severity = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';

    return {
      id: `urgency_fallback_${Date.now()}`,
      agentKey: 'shopping_persuasion',
      type: 'urgency',
      score: Math.min(10, score),
      severity,
      title: this.generateTitle(content.type, severity),
      description: this.generateDescription(content.text, content.type),
      reasoning: 'Pattern-based urgency detection',
      details: [
        { label: 'Type', value: content.type.replace('_', ' ') },
        { label: 'Content', value: content.text.slice(0, 100) }
      ],
      actions: [
        {
          label: 'Take Time',
          variant: 'primary',
          icon: '⏰',
          onClick: () => this.suggestCoolingOff()
        }
      ],
      confidence: 0.6,
      timestamp: new Date(),
      pageUrl: context.url.href
    };
  }

  private suggestCoolingOff(): void {
    alert('💡 Consider taking a 24-hour cooling-off period before making this purchase. Real urgent deals are rare in online shopping.');
  }

  private showUrgencyEducation(): void {
    const message = `
🎓 About Urgency Tactics:

• Countdown timers are often artificial and reset regularly
• "Limited time" offers frequently get extended
• Stock scarcity is commonly exaggerated
• Real urgent deals are rare in e-commerce

💡 What to do:
• Take time to research the product
• Compare prices on other sites
• Check if the "deal" appears regularly
• Ask yourself: "Do I really need this now?"
    `;
    
    alert(message);
  }
}
