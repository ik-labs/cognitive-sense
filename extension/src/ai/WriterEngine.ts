/**
 * Chrome Built-in AI Writer API wrapper for generating user-friendly content
 */

export interface WriteRequest {
  type: 'tooltip' | 'warning' | 'explanation' | 'recommendation';
  context: string;
  tone?: 'friendly' | 'professional' | 'urgent' | 'educational';
  length?: 'short' | 'medium' | 'long';
  audience?: 'general' | 'technical' | 'beginner';
}

export interface WriteResponse {
  content: string;
  title?: string;
  confidence: number;
}

export class WriterEngine {
  private writer: any = null;
  private isAvailable = false;

  async initialize(): Promise<void> {
    try {
      // Check if Chrome Built-in AI Writer is available
      if (typeof (window as any).Writer === 'undefined') {
        console.log('ℹ️ Chrome Built-in AI Writer API not available - using fallback');
        return;
      }

      const Writer = (window as any).Writer;
      
      // Check availability
      const availability = await Writer.availability();
      console.log('Writer API availability:', availability);

      if (availability !== 'available' && availability !== 'ready') {
        console.log('Writer API not ready:', availability);
        return;
      }

      // Create writer
      this.writer = await Writer.create({
        tone: 'formal',
        format: 'plain-text',
        length: 'short'
      });

      this.isAvailable = true;
      console.log('✅ WriterEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WriterEngine:', error);
      this.isAvailable = false;
    }
  }

  async write(request: WriteRequest): Promise<WriteResponse> {
    if (!this.isAvailable || !this.writer) {
      return this.fallbackWriting(request);
    }

    try {
      const prompt = this.buildWritePrompt(request);
      const content = await this.writer.write(prompt);
      
      return {
        content,
        title: this.generateTitle(request),
        confidence: 0.8
      };
    } catch (error) {
      console.error('Writer API failed:', error);
      return this.fallbackWriting(request);
    }
  }

  /**
   * Generate tooltip content for detected manipulation
   */
  async generateTooltip(detection: {
    type: string;
    score: number;
    evidence: string[];
    severity: 'low' | 'medium' | 'high';
  }): Promise<WriteResponse> {
    const request: WriteRequest = {
      type: 'tooltip',
      context: `Detected ${detection.type} manipulation (score: ${detection.score}/10, severity: ${detection.severity}). Evidence: ${detection.evidence.join(', ')}`,
      tone: detection.severity === 'high' ? 'urgent' : 'friendly',
      length: 'short',
      audience: 'general'
    };

    return this.write(request);
  }

  /**
   * Generate warning message for high-risk detections
   */
  async generateWarning(detections: Array<{
    type: string;
    score: number;
    severity: 'low' | 'medium' | 'high';
  }>): Promise<WriteResponse> {
    const highRiskCount = detections.filter(d => d.severity === 'high').length;
    const totalScore = detections.reduce((sum, d) => sum + d.score, 0);
    
    const request: WriteRequest = {
      type: 'warning',
      context: `Found ${detections.length} manipulation tactics with ${highRiskCount} high-risk items. Total manipulation score: ${totalScore}`,
      tone: 'urgent',
      length: 'medium',
      audience: 'general'
    };

    return this.write(request);
  }

  /**
   * Generate educational explanation about manipulation tactics
   */
  async generateExplanation(tacticType: string): Promise<WriteResponse> {
    const request: WriteRequest = {
      type: 'explanation',
      context: `Explain ${tacticType} manipulation tactics in online shopping`,
      tone: 'educational',
      length: 'medium',
      audience: 'general'
    };

    return this.write(request);
  }

  /**
   * Generate recommendations for safer shopping
   */
  async generateRecommendations(context: {
    detectedTactics: string[];
    riskLevel: 'safe' | 'caution' | 'warning' | 'danger';
    pageType: string;
  }): Promise<WriteResponse> {
    const request: WriteRequest = {
      type: 'recommendation',
      context: `User is on a ${context.pageType} page with ${context.riskLevel} risk level. Detected tactics: ${context.detectedTactics.join(', ')}`,
      tone: 'professional',
      length: 'medium',
      audience: 'general'
    };

    return this.write(request);
  }

  private buildWritePrompt(request: WriteRequest): string {
    const { type, context, tone, length, audience } = request;

    let prompt = '';

    switch (type) {
      case 'tooltip':
        prompt = `Write a brief, helpful tooltip that explains this manipulation tactic to users: ${context}. `;
        break;
      case 'warning':
        prompt = `Write a clear warning message about these manipulation tactics: ${context}. `;
        break;
      case 'explanation':
        prompt = `Write an educational explanation about: ${context}. `;
        break;
      case 'recommendation':
        prompt = `Write helpful recommendations for this situation: ${context}. `;
        break;
    }

    prompt += `Use a ${tone || 'friendly'} tone, keep it ${length || 'short'}, and write for a ${audience || 'general'} audience. `;
    prompt += 'Be clear, actionable, and empowering. Focus on helping users make informed decisions.';

    return prompt;
  }

  private generateTitle(request: WriteRequest): string {
    const { type } = request;
    
    switch (type) {
      case 'tooltip':
        return 'Manipulation Detected';
      case 'warning':
        return '⚠️ High Risk Detected';
      case 'explanation':
        return 'How This Works';
      case 'recommendation':
        return 'Recommendations';
      default:
        return 'CognitiveSense Alert';
    }
  }

  private fallbackWriting(request: WriteRequest): WriteResponse {
    const { type, context } = request;
    
    let content = '';
    let title = this.generateTitle(request);

    switch (type) {
      case 'tooltip':
        content = this.generateFallbackTooltip(context);
        break;
      case 'warning':
        content = this.generateFallbackWarning(context);
        break;
      case 'explanation':
        content = this.generateFallbackExplanation(context);
        break;
      case 'recommendation':
        content = this.generateFallbackRecommendation(context);
        break;
      default:
        content = 'Manipulation tactics detected. Review this content carefully before making decisions.';
    }

    return {
      content,
      title,
      confidence: 0.6
    };
  }

  private generateFallbackTooltip(context: string): string {
    if (context.includes('urgency')) {
      return 'This content uses urgency tactics to pressure quick decisions. Take time to consider if you really need this item.';
    }
    if (context.includes('anchoring')) {
      return 'The pricing shown may use anchoring to make the current price seem like a better deal than it actually is.';
    }
    if (context.includes('social proof')) {
      return 'Claims about popularity or reviews may be exaggerated. Verify reviews independently when possible.';
    }
    if (context.includes('fomo')) {
      return 'This content creates fear of missing out. Remember, good deals come regularly - you don\'t need to rush.';
    }
    if (context.includes('bundling')) {
      return 'Check if you actually need all items in this bundle. Sometimes buying separately is better value.';
    }
    if (context.includes('dark pattern')) {
      return 'The interface design may be trying to trick you. Read carefully before clicking any buttons.';
    }
    
    return 'Potential manipulation detected. Take a moment to consider this purchase carefully.';
  }

  private generateFallbackWarning(context: string): string {
    return `⚠️ Multiple manipulation tactics detected on this page. ${context} Consider taking a break before making any purchase decisions. Research the product and compare prices elsewhere.`;
  }

  private generateFallbackExplanation(context: string): string {
    if (context.includes('urgency')) {
      return 'Urgency tactics create artificial time pressure to rush your decisions. Real limited-time offers are rare - most "urgent" deals are marketing tactics.';
    }
    if (context.includes('anchoring')) {
      return 'Price anchoring shows inflated "original" prices to make current prices seem like great deals. Always research actual market prices.';
    }
    if (context.includes('social proof')) {
      return 'Social proof manipulation uses fake or misleading popularity claims. Genuine reviews are detailed and mention both pros and cons.';
    }
    
    return 'Manipulation tactics are designed to bypass rational thinking and trigger emotional purchasing decisions.';
  }

  private generateFallbackRecommendation(context: string): string {
    const recommendations = [
      '• Take a 24-hour cooling-off period before purchasing',
      '• Research the product on independent review sites',
      '• Compare prices across multiple retailers',
      '• Ask yourself: "Do I really need this item?"',
      '• Check return policies and warranty terms'
    ];

    if (context.includes('high') || context.includes('danger')) {
      recommendations.unshift('• Consider avoiding this purchase entirely');
    }

    return recommendations.join('\n');
  }

  async destroy(): Promise<void> {
    if (this.writer) {
      try {
        await this.writer.destroy();
      } catch (error) {
        console.error('Failed to destroy writer:', error);
      }
      this.writer = null;
    }
    this.isAvailable = false;
  }

  isReady(): boolean {
    return this.isAvailable && this.writer !== null;
  }

  // Predefined templates for common scenarios
  static templates = {
    urgencyTooltip: 'This countdown timer may be artificial. Real limited-time offers are rare in online shopping.',
    anchoringTooltip: 'The "original price" shown may be inflated to make this deal seem better than it is.',
    socialProofTooltip: 'Purchase counts and popularity claims are often exaggerated. Verify independently.',
    fomoTooltip: 'Don\'t let fear of missing out rush your decision. Good deals happen regularly.',
    bundlingTooltip: 'Check if you need all items in this bundle. Individual purchases might be better value.',
    darkPatternTooltip: 'This interface may be designed to trick you. Read all options carefully.',
    
    highRiskWarning: '⚠️ This page shows multiple manipulation tactics. Consider researching elsewhere before purchasing.',
    mediumRiskWarning: '⚠️ Some manipulation tactics detected. Take time to verify claims before deciding.',
    
    generalRecommendation: 'Take time to research this product, compare prices, and consider if you really need it.'
  };
}
