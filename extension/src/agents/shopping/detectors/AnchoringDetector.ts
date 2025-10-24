/**
 * AnchoringDetector - Detects price anchoring and misleading discount tactics
 */

import { PageContext, Detection } from '../../base/types';
import { AIEngineManager } from '../../../ai/AIEngineManager';
import { PromptEngine } from '../../../ai/PromptEngine';
import { ShoppingDetector } from '../ShoppingAgent';

interface PriceInfo {
  current: number;
  original?: number;
  discount?: number;
  discountPercent?: number;
  currency: string;
  text: string;
  element?: HTMLElement;
}

export class AnchoringDetector implements ShoppingDetector {
  name = 'AnchoringDetector';

  async detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]> {
    const detections: Detection[] = [];
    
    try {
      // Extract pricing information
      const priceInfo = this.extractPriceInfo(context);
      
      if (priceInfo.length === 0) {
        return detections;
      }

      // Analyze each price for anchoring tactics
      for (const price of priceInfo) {
        const detection = await this.analyzePriceAnchoring(price, context, aiManager);
        if (detection) {
          detections.push(detection);
        }
      }

      return detections;
    } catch (error) {
      console.error('AnchoringDetector failed:', error);
      return detections;
    }
  }

  private extractPriceInfo(context: PageContext): PriceInfo[] {
    const prices: PriceInfo[] = [];
    const pageText = context.content.text;
    
    // Extract prices from text content
    const pricePatterns = [
      // USD: $99.99, $1,234.56
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      // INR: ₹99, ₹1,234, ₹12,345.50
      /₹(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      // EUR: €99.99
      /€(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      // GBP: £99.99
      /£(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
    ];

    const lines = pageText.split('\n').map(line => line.trim()).filter(Boolean);
    
    for (const line of lines) {
      // Skip if line is too long (likely not a price display)
      if (line.length > 200) continue;
      
      const _lowerLine = line.toLowerCase();
      
      // Look for pricing patterns
      for (const pattern of pricePatterns) {
        const matches = [...line.matchAll(pattern)];
        
        for (const match of matches) {
          const fullMatch = match[0];
          const currency = fullMatch.charAt(0);
          const amount = parseFloat(match[1].replace(/,/g, ''));
          
          // Determine price type based on context
          const priceType = this.determinePriceType(line, _lowerLine);
          
          if (priceType) {
            const priceInfo: PriceInfo = {
              current: priceType === 'current' ? amount : 0,
              original: priceType === 'original' ? amount : undefined,
              currency,
              text: line
            };
            
            // Try to find related prices (was/now patterns)
            const relatedPrice = this.findRelatedPrice(line, amount, currency);
            if (relatedPrice) {
              if (priceType === 'current') {
                priceInfo.original = relatedPrice;
              } else {
                priceInfo.current = relatedPrice;
              }
            }
            
            // Calculate discount if we have both prices
            if (priceInfo.current && priceInfo.original && priceInfo.original > priceInfo.current) {
              priceInfo.discount = priceInfo.original - priceInfo.current;
              priceInfo.discountPercent = Math.round((priceInfo.discount / priceInfo.original) * 100);
            }
            
            prices.push(priceInfo);
          }
        }
      }
    }

    // Also extract from DOM elements
    this.extractPricesFromDOM().forEach(domPrice => {
      prices.push(domPrice);
    });

    return this.deduplicatePrices(prices);
  }

  private determinePriceType(_line: string, _lowerLine: string): 'current' | 'original' | null {
    // Current price indicators
    const currentIndicators = [
      'now', 'sale', 'special', 'today', 'current', 'price',
      'offer', 'deal', 'save', 'reduced'
    ];
    
    // Original price indicators
    const originalIndicators = [
      'was', 'originally', 'retail', 'msrp', 'list', 'regular',
      'before', 'compare', 'worth', 'value'
    ];

    const hasCurrentIndicator = currentIndicators.some(indicator => 
      _lowerLine.includes(indicator)
    );
    
    const hasOriginalIndicator = originalIndicators.some(indicator => 
      _lowerLine.includes(indicator)
    );

    if (hasOriginalIndicator && !hasCurrentIndicator) return 'original';
    if (hasCurrentIndicator && !hasOriginalIndicator) return 'current';
    
    // Default to current if ambiguous
    return 'current';
  }

  private findRelatedPrice(line: string, currentAmount: number, currency: string): number | null {
    // Look for was/now patterns in the same line
    const patterns = [
      new RegExp(`was\\s*\\${currency}([\\d,]+(?:\\.\\d{2})?)`, 'i'),
      new RegExp(`\\${currency}([\\d,]+(?:\\.\\d{2})?)\\s*was`, 'i'),
      new RegExp(`originally\\s*\\${currency}([\\d,]+(?:\\.\\d{2})?)`, 'i'),
      new RegExp(`retail\\s*\\${currency}([\\d,]+(?:\\.\\d{2})?)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount !== currentAmount) {
          return amount;
        }
      }
    }

    return null;
  }

  private extractPricesFromDOM(): PriceInfo[] {
    const prices: PriceInfo[] = [];
    
    // Common price selectors
    const selectors = [
      '[class*="price"]',
      '[class*="cost"]',
      '[class*="amount"]',
      '[data-price]',
      '.price-current',
      '.price-original',
      '.price-was',
      '.price-now',
      '.sale-price',
      '.regular-price'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
      
      elements.forEach(element => {
        const text = element.textContent || '';
        const priceMatch = text.match(/[₹$€£](\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
        
        if (priceMatch) {
          const currency = priceMatch[0].charAt(0);
          const amount = parseFloat(priceMatch[1].replace(/,/g, ''));
          
          prices.push({
            current: amount,
            currency,
            text,
            element
          });
        }
      });
    });

    return prices;
  }

  private deduplicatePrices(prices: PriceInfo[]): PriceInfo[] {
    const seen = new Set<string>();
    const filtered = prices.filter(price => {
      // Deduplicate by exact price match
      const key = `${price.current}-${price.original}-${price.currency}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Also deduplicate by discount percentage (avoid multiple items with same discount)
    const discountSeen = new Set<number>();
    return filtered.filter(price => {
      const discount = price.discountPercent || 0;
      if (discountSeen.has(discount)) {
        console.log(`🔄 Skipping duplicate discount: ${discount}%`);
        return false;
      }
      discountSeen.add(discount);
      return true;
    }).slice(0, 2); // Limit to 2 anchoring detections max
  }

  private async analyzePriceAnchoring(
    price: PriceInfo,
    context: PageContext,
    aiManager: AIEngineManager
  ): Promise<Detection | null> {
    try {
      // Skip if no discount information
      if (!price.original || !price.discount || !price.discountPercent) {
        return null;
      }

      // Use AI to analyze the pricing
      const prompt = `${PromptEngine.prompts.anchoring}\n\nPricing: "${price.text}"\nCurrent: ${price.currency}${price.current}\nOriginal: ${price.currency}${price.original}\nDiscount: ${price.discountPercent}%`;
      
      const aiResult = await aiManager.prompt.detect({
        prompt,
        context: `Page: ${context.url.href}, Discount: ${price.discountPercent}%`
      });

      // Analyze discount suspiciousness
      const suspiciousFactors = this.analyzeSuspiciousFactors(price);
      const score = this.calculateAnchoringScore(price, suspiciousFactors, aiResult.text);

      if (score < 4) return null;

      const severity = score >= 8 ? 'high' : score >= 6 ? 'medium' : 'low';

      return {
        id: `anchoring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentKey: 'shopping_persuasion',
        type: 'anchoring',
        score,
        severity,
        title: this.generateTitle(price, severity),
        description: this.generateDescription(price, suspiciousFactors),
        reasoning: aiResult.reasoning || 'Price anchoring analysis',
        details: [
          { label: 'Current Price', value: `${price.currency}${price.current}` },
          { label: 'Original Price', value: `${price.currency}${price.original}` },
          { label: 'Discount', value: `${price.discountPercent}% (${price.currency}${price.discount})` },
          { label: 'Suspicious Factors', value: suspiciousFactors.join(', ') }
        ],
        actions: [
          {
            label: 'Check Price History',
            variant: 'primary',
            icon: '📊',
            onClick: () => this.checkPriceHistory(price)
          },
          {
            label: 'Compare Prices',
            variant: 'secondary',
            icon: '🔍',
            onClick: () => this.comparePrices(price)
          }
        ],
        confidence: aiResult.confidence,
        timestamp: new Date(),
        pageUrl: context.url.href,
        learnMoreUrl: 'https://cognitivesense.app/learn/price-anchoring'
      };
    } catch (error) {
      console.error('Failed to analyze price anchoring:', error);
      return this.fallbackAnalysis(price, context);
    }
  }

  private analyzeSuspiciousFactors(price: PriceInfo): string[] {
    const factors: string[] = [];
    
    if (!price.discountPercent) return factors;

    // Very high discount percentages are suspicious
    if (price.discountPercent >= 70) {
      factors.push('Extremely high discount');
    } else if (price.discountPercent >= 50) {
      factors.push('Very high discount');
    }

    // Round numbers for original prices are suspicious
    if (price.original && price.original % 100 === 0) {
      factors.push('Round number original price');
    }

    // Odd current prices with round originals
    if (price.original && price.current && 
        price.original % 100 === 0 && price.current % 1 !== 0) {
      factors.push('Suspiciously precise current price');
    }

    // Check for common anchoring patterns in text
    const text = price.text.toLowerCase();
    if (text.includes('compare at') || text.includes('elsewhere')) {
      factors.push('Comparative pricing claims');
    }

    if (text.includes('msrp') || text.includes('retail')) {
      factors.push('MSRP/retail price reference');
    }

    return factors;
  }

  private calculateAnchoringScore(
    price: PriceInfo,
    suspiciousFactors: string[],
    aiResponse: string
  ): number {
    let score = 0;

    // Base score from discount percentage
    if (price.discountPercent) {
      if (price.discountPercent >= 80) score += 8;
      else if (price.discountPercent >= 70) score += 6;
      else if (price.discountPercent >= 60) score += 4;
      else if (price.discountPercent >= 50) score += 3;
      else if (price.discountPercent >= 30) score += 2;
    }

    // Add points for suspicious factors
    score += suspiciousFactors.length * 1.5;

    // AI response analysis
    const lowerResponse = aiResponse.toLowerCase();
    if (lowerResponse.includes('suspicious') || lowerResponse.includes('misleading')) {
      score += 2;
    }
    if (lowerResponse.includes('artificial') || lowerResponse.includes('inflated')) {
      score += 3;
    }

    return Math.min(10, Math.round(score));
  }

  private generateTitle(price: PriceInfo, severity: string): string {
    const discount = price.discountPercent || 0;
    
    const titles = {
      high: `⚠️ Suspicious ${discount}% Discount`,
      medium: `⚠️ Questionable Pricing (${discount}% off)`,
      low: `Price Anchoring Detected (${discount}% off)`
    };

    return titles[severity as keyof typeof titles] || 'Price Anchoring Detected';
  }

  private generateDescription(price: PriceInfo, factors: string[]): string {
    const discount = price.discountPercent || 0;
    let description = `This ${discount}% discount may use price anchoring to make the deal seem better than it is.`;
    
    if (factors.length > 0) {
      description += ` Suspicious factors: ${factors.join(', ').toLowerCase()}.`;
    }
    
    description += ' Consider researching the typical market price for this product.';
    
    return description;
  }

  private fallbackAnalysis(price: PriceInfo, context: PageContext): Detection | null {
    if (!price.discountPercent || price.discountPercent < 30) return null;

    let score = 0;
    
    // Score based on discount percentage
    if (price.discountPercent >= 70) score = 8;
    else if (price.discountPercent >= 60) score = 6;
    else if (price.discountPercent >= 50) score = 5;
    else if (price.discountPercent >= 40) score = 4;
    else score = 3;

    const severity = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';

    return {
      id: `anchoring_fallback_${Date.now()}`,
      agentKey: 'shopping_persuasion',
      type: 'anchoring',
      score,
      severity,
      title: this.generateTitle(price, severity),
      description: `${price.discountPercent}% discount detected. High discounts may indicate price anchoring tactics.`,
      reasoning: 'Pattern-based price anchoring detection',
      details: [
        { label: 'Discount', value: `${price.discountPercent}%` },
        { label: 'Current Price', value: `${price.currency}${price.current}` }
      ],
      actions: [
        {
          label: 'Research Price',
          variant: 'primary',
          icon: '🔍',
          onClick: () => this.comparePrices(price)
        }
      ],
      confidence: 0.6,
      timestamp: new Date(),
      pageUrl: context.url.href
    };
  }

  private checkPriceHistory(_price: PriceInfo): void {
    // TODO: Implement hybrid price history check
    alert(`💡 Price History Check:\n\nResearch this product's price history on sites like:\n• Google Shopping\n• PriceGrabber\n• Shopping comparison sites\n\nLook for the typical selling price over the past 3-6 months.`);
  }

  private comparePrices(price: PriceInfo): void {
    // TODO: Implement price comparison
    alert(`💡 Price Comparison:\n\nCompare this price on:\n• Amazon\n• Other major retailers\n• Price comparison websites\n• Manufacturer's official site\n\nCurrent price: ${price.currency}${price.current}\nClaimed original: ${price.currency}${price.original}`);
  }
}
