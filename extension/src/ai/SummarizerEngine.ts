/**
 * Chrome Built-in AI Summarizer API wrapper for content compression
 */

export interface SummaryRequest {
  content: string;
  type?: 'key-points' | 'tl-dr' | 'teaser' | 'headline';
  length?: 'short' | 'medium' | 'long';
  format?: 'markdown' | 'plain-text';
}

export interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  confidence: number;
}

export class SummarizerEngine {
  private summarizer: any = null;
  private isAvailable = false;

  async initialize(): Promise<void> {
    try {
      // Check if Chrome Built-in AI Summarizer is available
      if (typeof (window as any).Summarizer === 'undefined') {
        console.log('ℹ️ Chrome Built-in AI Summarizer API not available - using fallback');
        return;
      }

      const Summarizer = (window as any).Summarizer;
      
      // Check availability
      const availability = await Summarizer.availability();
      console.log('Summarizer API availability:', availability);

      if (availability !== 'available' && availability !== 'ready') {
        console.log('Summarizer API not ready:', availability);
        return;
      }

      // Create summarizer
      this.summarizer = await Summarizer.create({
        type: 'key-points',
        format: 'plain-text',
        length: 'medium'
      });

      this.isAvailable = true;
      console.log('✅ SummarizerEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SummarizerEngine:', error);
      this.isAvailable = false;
    }
  }

  async summarize(request: SummaryRequest): Promise<SummaryResponse> {
    if (!this.isAvailable || !this.summarizer) {
      return this.fallbackSummarization(request);
    }

    try {
      const summary = await this.summarizer.summarize(request.content);
      
      return {
        summary,
        keyPoints: this.extractKeyPoints(summary),
        confidence: 0.8
      };
    } catch (error) {
      console.error('Summarizer API failed:', error);
      return this.fallbackSummarization(request);
    }
  }

  /**
   * Summarize page content for manipulation analysis
   */
  async summarizeForDetection(content: string): Promise<{
    productInfo: string;
    pricingInfo: string;
    reviewInfo: string;
    urgencySignals: string;
    keyTerms: string[];
  }> {
    // Compress content to focus on manipulation-relevant parts
    const sections = this.extractSections(content);
    
    const summaries = await Promise.all([
      this.summarize({ 
        content: sections.product, 
        type: 'key-points',
        length: 'short'
      }),
      this.summarize({ 
        content: sections.pricing, 
        type: 'tl-dr',
        length: 'short'
      }),
      this.summarize({ 
        content: sections.reviews, 
        type: 'key-points',
        length: 'short'
      }),
      this.summarize({ 
        content: sections.urgency, 
        type: 'tl-dr',
        length: 'short'
      })
    ]);

    return {
      productInfo: summaries[0].summary,
      pricingInfo: summaries[1].summary,
      reviewInfo: summaries[2].summary,
      urgencySignals: summaries[3].summary,
      keyTerms: this.extractKeyTerms(content)
    };
  }

  private extractSections(content: string): {
    product: string;
    pricing: string;
    reviews: string;
    urgency: string;
  } {
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    
    const product: string[] = [];
    const pricing: string[] = [];
    const reviews: string[] = [];
    const urgency: string[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();
      
      // Product information
      if (lower.includes('product') || lower.includes('item') || 
          lower.includes('description') || lower.includes('feature')) {
        product.push(line);
      }
      
      // Pricing information
      if (lower.includes('price') || lower.includes('$') || lower.includes('₹') ||
          lower.includes('discount') || lower.includes('save') || 
          lower.includes('was') || lower.includes('now')) {
        pricing.push(line);
      }
      
      // Review information
      if (lower.includes('review') || lower.includes('rating') || 
          lower.includes('star') || lower.includes('customer') ||
          lower.includes('bought') || lower.includes('purchased')) {
        reviews.push(line);
      }
      
      // Urgency signals
      if (lower.includes('limited') || lower.includes('hurry') ||
          lower.includes('expires') || lower.includes('countdown') ||
          lower.includes('only') || lower.includes('left') ||
          lower.includes('urgent') || lower.includes('last chance')) {
        urgency.push(line);
      }
    }

    return {
      product: product.join('\n') || 'No product information found',
      pricing: pricing.join('\n') || 'No pricing information found',
      reviews: reviews.join('\n') || 'No review information found',
      urgency: urgency.join('\n') || 'No urgency signals found'
    };
  }

  private extractKeyPoints(summary: string): string[] {
    // Extract bullet points or numbered items
    const bulletPoints = summary.match(/[•\-\*]\s*(.+)/g);
    if (bulletPoints) {
      return bulletPoints.map(point => point.replace(/[•\-\*]\s*/, '').trim());
    }

    // Extract numbered points
    const numberedPoints = summary.match(/\d+\.\s*(.+)/g);
    if (numberedPoints) {
      return numberedPoints.map(point => point.replace(/\d+\.\s*/, '').trim());
    }

    // Split by sentences as fallback
    return summary.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .slice(0, 5);
  }

  private extractKeyTerms(content: string): string[] {
    // Extract important terms for manipulation detection
    const manipulationTerms = [
      // Urgency
      'limited time', 'hurry', 'expires', 'countdown', 'urgent', 'rush',
      'last chance', 'ending soon', 'while supplies last', 'act now',
      
      // Anchoring
      'was', 'now', 'save', 'discount', 'off', 'reduced', 'sale',
      'original price', 'retail price', 'compare at', 'worth',
      
      // Social Proof
      'customers bought', 'trending', 'popular', 'bestseller',
      'highly rated', 'recommended', 'people viewing', 'recently purchased',
      
      // FOMO
      'exclusive', 'limited edition', 'rare', 'unique', 'special offer',
      'members only', 'invitation only', 'select customers',
      
      // Bundling
      'bundle', 'package deal', 'combo', 'together', 'add-on',
      'subscription', 'auto-renew', 'recurring', 'monthly'
    ];

    const foundTerms: string[] = [];
    const contentLower = content.toLowerCase();

    for (const term of manipulationTerms) {
      if (contentLower.includes(term)) {
        foundTerms.push(term);
      }
    }

    return [...new Set(foundTerms)]; // Remove duplicates
  }

  private fallbackSummarization(request: SummaryRequest): SummaryResponse {
    const { content } = request;
    
    // Simple extractive summarization
    const sentences = content.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    // Score sentences by keyword relevance
    const keywordScores = sentences.map(sentence => {
      const lower = sentence.toLowerCase();
      let score = 0;
      
      // Manipulation keywords get higher scores
      const keywords = [
        'price', 'discount', 'save', 'limited', 'exclusive', 'urgent',
        'review', 'rating', 'popular', 'trending', 'bestseller',
        'offer', 'deal', 'sale', 'expires', 'countdown'
      ];
      
      keywords.forEach(keyword => {
        if (lower.includes(keyword)) score += 1;
      });
      
      return { sentence, score };
    });

    // Select top sentences
    const topSentences = keywordScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.sentence);

    const summary = topSentences.join('. ');
    
    return {
      summary: summary || 'Content summary not available',
      keyPoints: topSentences,
      confidence: 0.6
    };
  }

  async destroy(): Promise<void> {
    if (this.summarizer) {
      try {
        await this.summarizer.destroy();
      } catch (error) {
        console.error('Failed to destroy summarizer:', error);
      }
      this.summarizer = null;
    }
    this.isAvailable = false;
  }

  isReady(): boolean {
    return this.isAvailable && this.summarizer !== null;
  }
}
