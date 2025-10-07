/**
 * UrgencyDetector - Detects artificial urgency and time pressure tactics
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
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

      // Analyze with AI
      for (const content of urgencyContent) {
        const detection = await this.analyzeUrgencyContent(content, context, aiManager);
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

  private extractUrgencyContent(context: PageContext): Array<{
    text: string;
    element?: HTMLElement;
    type: 'countdown' | 'scarcity' | 'time_limit' | 'pressure';
  }> {
    const content: Array<{
      text: string;
      element?: HTMLElement;
      type: 'countdown' | 'scarcity' | 'time_limit' | 'pressure';
    }> = [];

    const pageText = context.content.text;
    const lines = pageText.split('\n').map(line => line.trim()).filter(Boolean);

    for (const line of lines) {
      const lower = line.toLowerCase();
      
      // Countdown timers
      if (this.hasCountdownPattern(lower)) {
        content.push({
          text: line,
          type: 'countdown'
        });
      }
      
      // Stock scarcity
      else if (this.hasScarcityPattern(lower)) {
        content.push({
          text: line,
          type: 'scarcity'
        });
      }
      
      // Time-limited offers
      else if (this.hasTimeLimitPattern(lower)) {
        content.push({
          text: line,
          type: 'time_limit'
        });
      }
      
      // Pressure language
      else if (this.hasPressurePattern(lower)) {
        content.push({
          text: line,
          type: 'pressure'
        });
      }
    }

    // Also check for countdown elements in DOM
    this.findCountdownElements().forEach(element => {
      content.push({
        text: element.textContent || '',
        element,
        type: 'countdown'
      });
    });

    return content.slice(0, 10); // Limit to prevent overload
  }

  private hasCountdownPattern(text: string): boolean {
    const patterns = [
      /\d+:\d+:\d+/, // HH:MM:SS
      /\d+h\s*\d+m\s*\d+s/, // 2h 30m 15s
      /\d+\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\s*(left|remaining)/,
      /(expires?|ends?)\s*in\s*\d+/,
      /countdown/,
      /timer/
    ];
    
    return patterns.some(pattern => pattern.test(text));
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

  private hasTimeLimitPattern(text: string): boolean {
    const patterns = [
      /(limited\s*time|time\s*limited)\s*(offer|deal|sale)/,
      /(today\s*only|24\s*hours?\s*only)/,
      /(expires?|ends?)\s*(today|tonight|soon)/,
      /flash\s*(sale|deal)/,
      /(deal|offer|sale)\s*expires?/,
      /while\s*supplies?\s*last/
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }

  private hasPressurePattern(text: string): boolean {
    const patterns = [
      /(act|buy|order)\s*now/,
      /don'?t\s*(miss|wait)/,
      /hurry\s*(up)?/,
      /urgent/,
      /last\s*chance/,
      /final\s*(hours?|minutes?|days?)/,
      /selling\s*fast/,
      /won'?t\s*last\s*long/
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
      '[data-timer]'
    ];

    const elements: HTMLElement[] = [];
    
    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
      elements.push(...Array.from(found));
    });

    return elements;
  }

  private async analyzeUrgencyContent(
    content: { text: string; type: string; element?: HTMLElement },
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      // Truncate content to avoid quota issues
      const truncatedText = content.text.length > 500 
        ? content.text.substring(0, 500) + '...' 
        : content.text;
      
      // Use AI to analyze the urgency content with minimal context
      const prompt = `Analyze this text for urgency manipulation tactics: "${truncatedText}"`;
      
      const aiResult = await aiManager.prompt.detect({
        prompt,
        context: `Type: ${content.type}` // Minimal context
      });

      // Parse AI response
      const score = this.extractScoreFromResponse(aiResult.text);
      const isManipulative = score >= 6 || aiResult.text.toLowerCase().includes('manipulation');

      if (!isManipulative && score < 4) {
        return null; // Not manipulative enough
      }

      // Calculate severity
      const severity = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';

      // Generate detection
      return {
        id: `urgency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'shopping_persuasion',
        type: 'urgency',
        score,
        severity,
        title: this.generateTitle(content.type, severity),
        description: this.generateDescription(content.text, content.type),
        reasoning: aiResult.reasoning || 'AI detected urgency manipulation',
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
