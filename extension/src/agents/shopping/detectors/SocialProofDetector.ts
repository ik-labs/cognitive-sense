/**
 * SocialProofDetector - Detects fake or manipulative social proof tactics
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { PromptEngine } from '../../../ai/PromptEngine';
import { ShoppingDetector } from '../ShoppingAgent';

interface SocialProofData {
  type: 'reviews' | 'purchases' | 'views' | 'trending' | 'testimonial';
  text: string;
  numbers?: {
    count: number;
    rating?: number;
    percentage?: number;
  };
  timeframe?: string;
  element?: HTMLElement;
}

export class SocialProofDetector implements ShoppingDetector {
  name = 'SocialProofDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      // Extract social proof content
      let socialProofData = this.extractSocialProofData(context);
      
      if (socialProofData.length === 0) {
        return detections;
      }

      // Deduplicate social proof data
      socialProofData = this.deduplicateSocialProof(socialProofData);
      console.log(`📊 Social Proof: Analyzing ${socialProofData.length} unique claims`);

      // Analyze each social proof claim (limit to 2)
      for (const data of socialProofData.slice(0, 2)) {
        const detection = await this.analyzeSocialProof(data, context, aiManager);
        if (detection) {
          detections.push(detection);
        }
      }

      return detections;
    } catch (error) {
      console.error('SocialProofDetector failed:', error);
      return detections;
    }
  }

  private extractSocialProofData(context: PageContext): SocialProofData[] {
    const data: SocialProofData[] = [];
    const pageText = context.content.text;
    const lines = pageText.split('\n').map(line => line.trim()).filter(Boolean);

    for (const line of lines) {
      if (line.length > 300) continue; // Skip very long lines
      
      const _lowerLine = line.toLowerCase();
      
      // Review patterns
      const reviewData = this.extractReviewData(line, _lowerLine);
      if (reviewData) data.push(reviewData);
      
      // Purchase count patterns
      const purchaseData = this.extractPurchaseData(line, _lowerLine);
      if (purchaseData) data.push(purchaseData);
      
      // View count patterns
      const viewData = this.extractViewData(line, _lowerLine);
      if (viewData) data.push(viewData);
      
      // Trending patterns
      const trendingData = this.extractTrendingData(line, _lowerLine);
      if (trendingData) data.push(trendingData);
      
      // Testimonial patterns
      const testimonialData = this.extractTestimonialData(line, _lowerLine);
      if (testimonialData) data.push(testimonialData);
    }

    // Also extract from DOM elements
    this.extractFromDOM().forEach(domData => {
      data.push(domData);
    });

    return data.slice(0, 15); // Limit to prevent overload
  }

  private deduplicateSocialProof(data: SocialProofData[]): SocialProofData[] {
    const seen = new Set<string>();
    const filtered = data.filter(item => {
      // Deduplicate by type and normalized text
      const normalized = item.text.toLowerCase().replace(/\s+/g, ' ').substring(0, 100);
      const key = `${item.type}:${normalized}`;
      
      if (seen.has(key)) {
        console.log(`🔄 Skipping duplicate social proof: ${item.type}`);
        return false;
      }
      seen.add(key);
      return true;
    });

    // Also deduplicate by type (only 1 of each type)
    const typeSeen = new Set<string>();
    return filtered.filter(item => {
      if (typeSeen.has(item.type)) {
        console.log(`🔄 Skipping duplicate type: ${item.type}`);
        return false;
      }
      typeSeen.add(item.type);
      return true;
    });
  }

  private extractReviewData(line: string, _lowerLine: string): SocialProofData | null {
    // Review count patterns - more aggressive
    const reviewPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:out\s*of\s*)?5\s*stars?/i,
      /(\d+(?:,\d{3})*)\s*(?:customer\s*)?reviews?/i,
      /(\d+(?:,\d{3})*)\s*(?:user\s*)?ratings?/i,
      /rated\s*(\d+(?:\.\d+)?)\s*(?:out\s*of\s*5|\/5|\*)/i,
      /(\d+(?:\.\d+)?)\s*stars?\s*(?:out\s*of\s*5|\/5)/i,
      /(\d+)%\s*(?:of\s*)?(?:customers?\s*)?(?:recommend|satisfied|positive)/i,
      /stars?\s*from/i,
      /rating|review|stars?|score/i
    ];

    for (const pattern of reviewPatterns) {
      if (pattern.test(line)) {
        const match = line.match(/(\d+(?:\.\d+)?)/);
        const number = match ? parseFloat(match[1].replace(/,/g, '')) : 4.5;
        
        return {
          type: 'reviews',
          text: line,
          numbers: { rating: number, count: 0 }
        };
      }
    }

    return null;
  }

  private extractPurchaseData(line: string, _lowerLine: string): SocialProofData | null {
    const purchasePatterns = [
      /(\d+(?:,\d{3})*)\s*(?:people\s*)?(?:bought|purchased|ordered)/i,
      /(\d+(?:,\d{3})*)\s*sold\s*(?:in\s*(?:last\s*)?(\w+))?/i,
      /(\d+(?:,\d{3})*)\s*customers?\s*bought\s*(?:this\s*)?(?:in\s*(?:last\s*)?(\w+))?/i,
      /bestseller\s*#(\d+)/i
    ];

    for (const pattern of purchasePatterns) {
      const match = line.match(pattern);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        const timeframe = match[2] || null;
        
        return {
          type: 'purchases',
          text: line,
          numbers: { count },
          timeframe: timeframe || undefined
        };
      }
    }

    return null;
  }

  private extractViewData(line: string, _lowerLine: string): SocialProofData | null {
    const viewPatterns = [
      /(\d+(?:,\d{3})*)\s*(?:people\s*)?(?:viewing|looking\s*at|watching)/i,
      /(\d+(?:,\d{3})*)\s*(?:users?\s*)?(?:online|active)/i,
      /(\d+(?:,\d{3})*)\s*in\s*(?:cart|basket)/i
    ];

    for (const pattern of viewPatterns) {
      const match = line.match(pattern);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        
        return {
          type: 'views',
          text: line,
          numbers: { count }
        };
      }
    }

    return null;
  }

  private extractTrendingData(line: string, _lowerLine: string): SocialProofData | null {
    const trendingKeywords = [
      'trending', 'popular', 'hot', 'bestseller', 'top rated',
      'most popular', 'customer favorite', 'staff pick'
    ];

    const hasTrendingKeyword = trendingKeywords.some(keyword => 
      _lowerLine.includes(keyword)
    );

    if (hasTrendingKeyword) {
      return {
        type: 'trending',
        text: line
      };
    }

    return null;
  }

  private extractTestimonialData(line: string, _lowerLine: string): SocialProofData | null {
    // Look for testimonial patterns
    const testimonialIndicators = [
      /[""]([^""]+)[""].*-\s*([A-Z][a-z]+)/,  // "Quote" - Name
      /customer\s*says?:?\s*[""]([^""]+)[""]/, // Customer says: "quote"
      /testimonial/i
    ];

    for (const pattern of testimonialIndicators) {
      if (pattern.test(line)) {
        return {
          type: 'testimonial',
          text: line
        };
      }
    }

    return null;
  }

  private extractFromDOM(): SocialProofData[] {
    const data: SocialProofData[] = [];
    
    // Review elements
    const reviewSelectors = [
      '[class*="review"]', '[class*="rating"]', '[class*="star"]',
      '[data-rating]', '[data-reviews]'
    ];

    reviewSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
      elements.forEach(element => {
        const text = element.textContent || '';
        if (text && text.length < 200) {
          const reviewData = this.extractReviewData(text, text.toLowerCase());
          if (reviewData) {
            reviewData.element = element;
            data.push(reviewData);
          }
        }
      });
    });

    return data;
  }

  private async analyzeSocialProof(
    data: SocialProofData,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      // Use AI to analyze the social proof claim
      const prompt = `${PromptEngine.prompts.socialProof}\n\n"${data.text}"\n\nType: ${data.type}${data.numbers ? `\nNumbers: ${JSON.stringify(data.numbers)}` : ''}${data.timeframe ? `\nTimeframe: ${data.timeframe}` : ''}`;
      
      const aiResult = await aiManager.prompt.detect({
        prompt,
        context: `Page: ${context.url.href}, Type: ${data.type}`
      });

      // Analyze suspiciousness
      const suspiciousFactors = this.analyzeSuspiciousFactors(data);
      const score = this.calculateSocialProofScore(data, suspiciousFactors, aiResult.text);

      if (score < 4) return null;

      const severity = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';

      return {
        id: `social_proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'shopping_persuasion',
        type: 'social_proof',
        score,
        severity,
        title: this.generateTitle(data, severity),
        description: this.generateDescription(data, suspiciousFactors),
        reasoning: aiResult.reasoning || 'Social proof analysis',
        details: [
          { label: 'Type', value: data.type },
          { label: 'Content', value: data.text.slice(0, 100) + (data.text.length > 100 ? '...' : '') },
          ...(data.numbers ? [{ label: 'Numbers', value: JSON.stringify(data.numbers) }] : []),
          ...(suspiciousFactors.length > 0 ? [{ label: 'Red Flags', value: suspiciousFactors.join(', ') }] : [])
        ],
        actions: [
          {
            label: 'Verify Reviews',
            variant: 'primary',
            icon: '🔍',
            onClick: () => this.verifyReviews(data)
          },
          {
            label: 'Learn More',
            variant: 'secondary',
            icon: '📚',
            onClick: () => this.showSocialProofEducation()
          }
        ],
        confidence: aiResult.confidence,
        timestamp: new Date(),
        pageUrl: context.url.href,
        learnMoreUrl: 'https://cognitivesense.app/learn/social-proof'
      };
    } catch (error) {
      console.error('Failed to analyze social proof:', error);
      return this.fallbackAnalysis(data, context);
    }
  }

  private analyzeSuspiciousFactors(data: SocialProofData): string[] {
    const factors: string[] = [];
    
    if (data.numbers) {
      const { count, rating, percentage } = data.numbers;
      
      // Suspiciously round numbers
      if (count && count % 100 === 0 && count >= 1000) {
        factors.push('Round number count');
      }
      
      // Perfect or near-perfect ratings
      if (rating && rating >= 4.8) {
        factors.push('Suspiciously high rating');
      }
      
      // Perfect percentages
      if (percentage && (percentage >= 95 || percentage % 10 === 0)) {
        factors.push('Suspiciously high percentage');
      }
      
      // Unrealistic numbers
      if (count && count > 100000) {
        factors.push('Unrealistically high count');
      }
    }

    // Vague timeframes
    if (data.timeframe) {
      const vague = ['recently', 'lately', 'this week', 'today'];
      if (vague.some(term => data.timeframe!.toLowerCase().includes(term))) {
        factors.push('Vague timeframe');
      }
    }

    // Generic testimonials
    if (data.type === 'testimonial') {
      const generic = ['amazing', 'best ever', 'life changing', 'perfect'];
      if (generic.some(term => data.text.toLowerCase().includes(term))) {
        factors.push('Generic testimonial language');
      }
    }

    // Trending claims without specifics
    if (data.type === 'trending' && !data.numbers) {
      factors.push('Unsubstantiated trending claim');
    }

    return factors;
  }

  private calculateSocialProofScore(
    data: SocialProofData,
    suspiciousFactors: string[],
    aiResponse: string
  ): number {
    let score = 0;

    // Base score by type
    switch (data.type) {
      case 'reviews':
        score += data.numbers?.rating && data.numbers.rating >= 4.9 ? 6 : 3;
        break;
      case 'purchases':
        score += data.numbers?.count && data.numbers.count % 100 === 0 ? 5 : 2;
        break;
      case 'views':
        score += 4; // Views are often inflated
        break;
      case 'trending':
        score += 5; // Trending claims are often unsubstantiated
        break;
      case 'testimonial':
        score += 4;
        break;
    }

    // Add points for suspicious factors
    score += suspiciousFactors.length * 1.5;

    // AI response analysis
    const lowerResponse = aiResponse.toLowerCase();
    if (lowerResponse.includes('fake') || lowerResponse.includes('suspicious')) {
      score += 3;
    }
    if (lowerResponse.includes('misleading') || lowerResponse.includes('exaggerated')) {
      score += 2;
    }

    return Math.min(10, Math.round(score));
  }

  private generateTitle(data: SocialProofData, severity: string): string {
    const typeNames = {
      reviews: 'Reviews',
      purchases: 'Purchase Claims',
      views: 'View Counts',
      trending: 'Trending Claims',
      testimonial: 'Testimonials'
    };

    const severityPrefixes = {
      high: '⚠️ Suspicious',
      medium: '⚠️ Questionable',
      low: 'Potential'
    };

    const typeName = typeNames[data.type] || 'Social Proof';
    const prefix = severityPrefixes[severity as keyof typeof severityPrefixes] || '';

    return `${prefix} ${typeName}`;
  }

  private generateDescription(data: SocialProofData, factors: string[]): string {
    let description = '';
    
    switch (data.type) {
      case 'reviews':
        description = 'Review ratings and counts may be inflated or fake.';
        break;
      case 'purchases':
        description = 'Purchase count claims are often exaggerated to create social pressure.';
        break;
      case 'views':
        description = 'View counts and "people watching" claims are frequently inflated.';
        break;
      case 'trending':
        description = 'Trending and popularity claims often lack verification.';
        break;
      case 'testimonial':
        description = 'Customer testimonials may be fabricated or cherry-picked.';
        break;
    }

    if (factors.length > 0) {
      description += ` Red flags: ${factors.join(', ').toLowerCase()}.`;
    }

    return description;
  }

  private fallbackAnalysis(data: SocialProofData, context: PageContext): Detection | null {
    const suspiciousFactors = this.analyzeSuspiciousFactors(data);
    
    if (suspiciousFactors.length === 0) return null;

    let score = suspiciousFactors.length * 2;
    
    // Boost score for certain types
    if (data.type === 'trending') score += 2;
    if (data.type === 'views') score += 1;

    if (score < 4) return null;

    const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

    return {
      id: `social_proof_fallback_${Date.now()}`,
      agentKey: 'shopping_persuasion',
      type: 'social_proof',
      score: Math.min(10, score),
      severity,
      title: this.generateTitle(data, severity),
      description: this.generateDescription(data, suspiciousFactors),
      reasoning: 'Pattern-based social proof detection',
      details: [
        { label: 'Type', value: data.type },
        { label: 'Red Flags', value: suspiciousFactors.join(', ') }
      ],
      actions: [
        {
          label: 'Verify Claims',
          variant: 'primary',
          icon: '🔍',
          onClick: () => this.verifyReviews(data)
        }
      ],
      confidence: 0.6,
      timestamp: new Date(),
      pageUrl: context.url.href
    };
  }

  private verifyReviews(data: SocialProofData): void {
    let message = '💡 How to Verify Social Proof:\n\n';
    
    switch (data.type) {
      case 'reviews':
        message += `• Check review dates - are they clustered?\n• Look for detailed, specific reviews\n• Verify on multiple platforms\n• Watch for generic language\n• Check reviewer profiles`;
        break;
      case 'purchases':
        message += `• Cross-check on other sites\n• Look for specific timeframes\n• Verify with similar products\n• Check if numbers seem realistic`;
        break;
      case 'trending':
        message += `• Look for specific metrics\n• Check trending lists on other sites\n• Verify with search trends\n• Look for supporting evidence`;
        break;
      default:
        message += `• Cross-reference claims on other sites\n• Look for specific details\n• Check for supporting evidence\n• Trust but verify`;
    }
    
    alert(message);
  }

  private showSocialProofEducation(): void {
    const message = `
🎓 About Social Proof Manipulation:

• Fake reviews are common in e-commerce
• Purchase counts are often inflated
• "Trending" claims may be unsubstantiated
• Perfect ratings (4.9-5.0) are suspicious
• Round numbers (1000, 5000) are red flags

💡 What to do:
• Read reviews carefully for specifics
• Check multiple review platforms
• Look for balanced feedback (pros/cons)
• Verify claims on independent sites
• Trust your instincts about "too good to be true"
    `;
    
    alert(message);
  }
}
