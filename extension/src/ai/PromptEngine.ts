/**
 * Chrome Built-in AI Prompt API wrapper for manipulation detection
 */

export interface PromptRequest {
  prompt: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PromptResponse {
  text: string;
  confidence: number;
  reasoning?: string;
  score?: number; // Add score to the response
  detected?: boolean; // Add detected flag
}

export class PromptEngine {
  private session: any = null;
  private isAvailable = false;

  async initialize(): Promise<void> {
    try {
      // Check if Chrome Built-in AI LanguageModel is available
      if (typeof (window as any).LanguageModel === 'undefined') {
        console.log('ℹ️ Chrome Built-in AI Prompt API not available - using fallback detection');
        return;
      }

      const LanguageModel = (window as any).LanguageModel;
      
      // Check availability
      const availability = await LanguageModel.availability();
      console.log('Prompt API availability:', availability);

      if (availability !== 'available' && availability !== 'readily') {
        console.log('Prompt API not ready:', availability);
        return;
      }

      // Create session with output language
      this.session = await LanguageModel.create({
        temperature: 0.3,
        topK: 3,
        systemPrompt: 'You are an expert at detecting psychological manipulation tactics in online content.',
        outputLanguage: 'en' // Specify English output
      });

      this.isAvailable = true;
      console.log('✅ PromptEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PromptEngine:', error);
      this.isAvailable = false;
    }
  }

  async detect(request: PromptRequest): Promise<PromptResponse> {
    if (!this.isAvailable || !this.session) {
      return this.fallbackDetection(request);
    }

    try {
      // Truncate context to avoid quota exceeded errors
      // Keep it very small - Gemini Nano has limited quota
      const truncatedRequest = {
        ...request,
        context: request.context ? request.context.substring(0, 200) : undefined
      };
      
      const fullPrompt = this.buildPrompt(truncatedRequest);
      const response = await this.session.prompt(fullPrompt);
      
      // Log AI response for debugging
      console.log('🤖 Gemini Nano response:', response);
      
      return this.parseResponse(response);
    } catch (error: any) {
      // If quota exceeded or other AI error, fall back to pattern detection
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('too large')) {
        console.log('Input too large for AI, using fallback detection');
      } else {
        console.error('Prompt API failed:', error);
      }
      return this.fallbackDetection(request);
    }
  }

  async detectBatch(requests: PromptRequest[]): Promise<PromptResponse[]> {
    if (!this.isAvailable || !this.session) {
      return requests.map(req => this.fallbackDetection(req));
    }

    // Process in parallel with a concurrency limit to avoid overwhelming the API
    const BATCH_SIZE = 3; // Process 3 at a time
    const results: PromptResponse[] = [];
    
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(req => this.detect(req))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  private buildPrompt(request: PromptRequest): string {
    const { prompt, context } = request;
    
    return `${prompt}

${context ? `Context: ${context}\n` : ''}

Respond with ONLY valid JSON, no other text:
{"detected": true/false, "score": 0-10, "confidence": 0.0-1.0, "reasoning": "brief explanation"}

Be concise and use only valid JSON format.`;
  }

  private parseResponse(response: string): PromptResponse {
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanResponse = cleanResponse.replace(/```/g, '');
      
      // Try to extract JSON from response - use a more flexible regex
      const jsonMatch = cleanResponse.match(/\{[^{}]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      let jsonStr = jsonMatch[0];
      
      // Extract key-value pairs manually to avoid quote issues in reasoning
      const detectedMatch = jsonStr.match(/"detected"\s*:\s*(true|false)/i);
      const scoreMatch = jsonStr.match(/"score"\s*:\s*(\d+(?:\.\d+)?)/i);
      const confidenceMatch = jsonStr.match(/"confidence"\s*:\s*(\d+(?:\.\d+)?)/i);
      const reasoningMatch = jsonStr.match(/"reasoning"\s*:\s*"([^"]*(?:"[^"]*"[^"]*)*[^"]*)"/i);
      
      // Build response from extracted values (more reliable than JSON.parse)
      return {
        text: response,
        detected: detectedMatch ? detectedMatch[1] === 'true' : false,
        score: scoreMatch ? parseFloat(scoreMatch[1]) : 5,
        confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
        reasoning: reasoningMatch ? reasoningMatch[1].substring(0, 200) : 'AI analysis completed'
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw response:', response.substring(0, 200));
      
      // Fallback parsing
      const score = this.extractScore(response);
      const detected = response.toLowerCase().includes('detected') || 
                      response.toLowerCase().includes('manipulation') ||
                      score > 5;

      return {
        text: response,
        confidence: detected ? 0.6 : 0.3,
        reasoning: 'Parsed from unstructured response'
      };
    }
  }

  private extractScore(text: string): number {
    // Try to extract a score from text
    const scoreMatch = text.match(/score[:\s]*(\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
      return Math.min(10, Math.max(0, parseFloat(scoreMatch[1])));
    }

    // Fallback: count manipulation keywords
    const keywords = [
      'urgent', 'limited', 'hurry', 'scarcity', 'exclusive', 'deal',
      'discount', 'sale', 'offer', 'now', 'today', 'expires'
    ];

    const keywordCount = keywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;

    return Math.min(10, keywordCount * 1.5);
  }

  private fallbackDetection(request: PromptRequest): PromptResponse {
    // Simple heuristic-based detection when AI is unavailable
    const { prompt } = request;
    const content = prompt.toLowerCase();
    
    const urgencyWords = ['urgent', 'hurry', 'limited time', 'expires', 'countdown'];
    const anchoringWords = ['was', 'now', 'save', 'discount', 'off', '%'];
    const socialWords = ['popular', 'trending', 'bought', 'customers', 'reviews'];
    const fomoWords = ['exclusive', 'limited', 'rare', 'last chance', 'only'];

    let score = 0;
    const evidence: string[] = [];

    urgencyWords.forEach(word => {
      if (content.includes(word)) {
        score += 2;
        evidence.push(`Urgency: "${word}"`);
      }
    });

    anchoringWords.forEach(word => {
      if (content.includes(word)) {
        score += 1.5;
        evidence.push(`Anchoring: "${word}"`);
      }
    });

    socialWords.forEach(word => {
      if (content.includes(word)) {
        score += 1;
        evidence.push(`Social proof: "${word}"`);
      }
    });

    fomoWords.forEach(word => {
      if (content.includes(word)) {
        score += 2;
        evidence.push(`FOMO: "${word}"`);
      }
    });

    const finalScore = Math.min(10, score);
    
    return {
      text: `Fallback detection completed. Score: ${finalScore}/10. Evidence: ${evidence.join(', ')}`,
      confidence: finalScore > 5 ? 0.7 : 0.4,
      reasoning: `Heuristic analysis found ${evidence.length} manipulation indicators`
    };
  }

  async destroy(): Promise<void> {
    if (this.session) {
      try {
        await this.session.destroy();
      } catch (error) {
        console.error('Failed to destroy prompt session:', error);
      }
      this.session = null;
    }
    this.isAvailable = false;
  }

  isReady(): boolean {
    return this.isAvailable && this.session !== null;
  }

  // Predefined prompts for different detection types
  static prompts = {
    urgency: `Analyze this content for urgency manipulation tactics:
- Countdown timers that create false time pressure
- "Limited time" offers without clear end dates
- Stock scarcity claims that may be artificial
- Language designed to rush purchasing decisions

Content to analyze:`,

    anchoring: `Analyze this content for price anchoring manipulation:
- Inflated "original" prices to make current price seem better
- Fake discounts or misleading percentage savings
- "Was/Now" pricing that may be deceptive
- Reference prices that don't reflect actual market value

Content to analyze:`,

    socialProof: `Analyze this content for social proof manipulation:
- Fake or suspicious review patterns
- Unverifiable purchase count claims
- "Trending" or "popular" claims without evidence
- Testimonials that may be fabricated

Content to analyze:`,

    fomo: `Analyze this content for FOMO (Fear of Missing Out) tactics:
- Exclusivity claims designed to pressure decisions
- "Last chance" messaging without justification
- Artificial scarcity to create urgency
- Emotional pressure to act immediately

Content to analyze:`,

    bundling: `Analyze this content for bundling manipulation:
- Forced product combinations
- Hidden additional costs
- Subscription traps or auto-renewals
- "Free" offers with hidden requirements

Content to analyze:`,

    darkPatterns: `Analyze this content for dark pattern UI manipulation:
- Misleading button labels or actions
- Hidden or obscured important information
- Difficult cancellation or opt-out processes
- Design that tricks users into unintended actions

Content to analyze:`
  };
}
