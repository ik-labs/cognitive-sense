/**
 * Central manager for all Chrome Built-in AI engines
 */

import { PromptEngine } from './PromptEngine';
import { SummarizerEngine } from './SummarizerEngine';
import { WriterEngine } from './WriterEngine';
import { LanguageEngine } from './LanguageEngine';

export class AIEngineManager {
  private static instance: AIEngineManager;
  
  public prompt: PromptEngine;
  public summarizer: SummarizerEngine;
  public writer: WriterEngine;
  public language: LanguageEngine;
  
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.prompt = new PromptEngine();
    this.summarizer = new SummarizerEngine();
    this.writer = new WriterEngine();
    this.language = new LanguageEngine();
  }

  static getInstance(): AIEngineManager {
    if (!AIEngineManager.instance) {
      AIEngineManager.instance = new AIEngineManager();
    }
    return AIEngineManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    console.log('Initializing AI Engine Manager...');
    
    try {
      // Initialize all engines in parallel
      await Promise.all([
        this.prompt.initialize(),
        this.summarizer.initialize(),
        this.writer.initialize(),
        this.language.initialize()
      ]);

      this.initialized = true;
      console.log('AI Engine Manager initialized successfully');
      
      // Log capabilities
      this.logCapabilities();
    } catch (error) {
      console.error('Failed to initialize AI Engine Manager:', error);
      throw error;
    }
  }

  private logCapabilities(): void {
    const capabilities = {
      prompt: this.prompt.isReady(),
      summarizer: this.summarizer.isReady(),
      writer: this.writer.isReady(),
      language: this.language.isReady()
    };

    console.log('AI Engine Capabilities:', capabilities);
    
    const availableCount = Object.values(capabilities).filter(Boolean).length;
    const totalCount = Object.keys(capabilities).length;
    
    console.log(`${availableCount}/${totalCount} AI engines available`);
    
    if (availableCount === 0) {
      console.warn('⚠️ No Chrome Built-in AI engines available - using fallback detection');
    } else if (availableCount < totalCount) {
      console.warn(`⚠️ Some AI engines unavailable - hybrid fallback mode enabled`);
    } else {
      console.log('✅ All AI engines ready - full AI-powered detection enabled');
    }
  }

  /**
   * Check overall AI availability
   */
  getAvailability(): {
    overall: boolean;
    engines: {
      prompt: boolean;
      summarizer: boolean;
      writer: boolean;
      language: boolean;
    };
    fallbackMode: boolean;
  } {
    const engines = {
      prompt: this.prompt.isReady(),
      summarizer: this.summarizer.isReady(),
      writer: this.writer.isReady(),
      language: this.language.isReady()
    };

    const availableCount = Object.values(engines).filter(Boolean).length;
    const overall = availableCount > 0;
    const fallbackMode = availableCount < 4;

    return {
      overall,
      engines,
      fallbackMode
    };
  }

  /**
   * Comprehensive content analysis using all available engines
   */
  async analyzeContent(content: {
    text: string;
    url: string;
    pageType: string;
  }): Promise<{
    summary: any;
    language: string;
    keyInsights: string[];
    manipulationSignals: string[];
  }> {
    try {
      // Detect language first
      const languageResult = await this.language.detectLanguage(content.text);
      
      // Summarize content for efficient analysis
      const summaryResult = await this.summarizer.summarizeForDetection(content.text);
      
      // Extract manipulation signals using prompt engine
      const promptResult = await this.prompt.detect({
        prompt: `Analyze this ${content.pageType} page content for manipulation tactics: ${summaryResult.productInfo} ${summaryResult.pricingInfo} ${summaryResult.urgencySignals}`,
        context: `URL: ${content.url}, Language: ${languageResult.language}`
      });

      return {
        summary: summaryResult,
        language: languageResult.language,
        keyInsights: summaryResult.keyTerms,
        manipulationSignals: this.extractSignalsFromPromptResponse(promptResult.text)
      };
    } catch (error) {
      console.error('Content analysis failed:', error);
      
      // Fallback analysis
      return {
        summary: { productInfo: '', pricingInfo: '', reviewInfo: '', urgencySignals: '', keyTerms: [] },
        language: 'en',
        keyInsights: [],
        manipulationSignals: []
      };
    }
  }

  /**
   * Generate user-friendly detection results
   */
  async generateDetectionContent(detection: {
    type: string;
    score: number;
    severity: 'low' | 'medium' | 'high';
    evidence: string[];
    pageLanguage: string;
  }): Promise<{
    tooltip: { title: string; description: string; };
    warning?: { title: string; content: string; };
  }> {
    try {
      // Generate tooltip content
      const tooltipResult = await this.writer.generateTooltip(detection);
      
      // Translate if needed
      const translatedTooltip = await this.language.translateTooltip({
        title: tooltipResult.title || 'Manipulation Detected',
        description: tooltipResult.content,
        targetLanguage: detection.pageLanguage
      });

      let warning;
      if (detection.severity === 'high') {
        const warningResult = await this.writer.generateWarning([detection]);
        warning = {
          title: warningResult.title || 'High Risk Detected',
          content: warningResult.content
        };
      }

      return {
        tooltip: translatedTooltip,
        warning
      };
    } catch (error) {
      console.error('Failed to generate detection content:', error);
      
      // Fallback content
      return {
        tooltip: {
          title: detection.pageLanguage === 'hi' ? 'हेरफेर का पता चला' : 'Manipulation Detected',
          description: `${detection.type} manipulation detected (score: ${detection.score}/10)`
        }
      };
    }
  }

  private extractSignalsFromPromptResponse(response: string): string[] {
    const signals: string[] = [];
    
    // Extract from JSON if present
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.evidence && Array.isArray(parsed.evidence)) {
          signals.push(...parsed.evidence);
        }
      }
    } catch {
      // Fallback to text parsing
      const lines = response.split('\n');
      lines.forEach(line => {
        if (line.includes('detected') || line.includes('manipulation') || line.includes('evidence')) {
          signals.push(line.trim());
        }
      });
    }
    
    return signals.slice(0, 5); // Limit to top 5 signals
  }

  /**
   * Cleanup all engines
   */
  async destroy(): Promise<void> {
    console.log('Shutting down AI Engine Manager...');
    
    await Promise.all([
      this.prompt.destroy(),
      this.summarizer.destroy(),
      this.writer.destroy(),
      this.language.destroy()
    ]);

    this.initialized = false;
    this.initializationPromise = null;
    
    console.log('AI Engine Manager shut down');
  }

  /**
   * Health check for all engines
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    engines: Record<string, 'ready' | 'unavailable' | 'error'>;
    message: string;
  }> {
    const engines: Record<string, 'ready' | 'unavailable' | 'error'> = {
      prompt: this.prompt.isReady() ? 'ready' : 'unavailable',
      summarizer: this.summarizer.isReady() ? 'ready' : 'unavailable',
      writer: this.writer.isReady() ? 'ready' : 'unavailable',
      language: this.language.isReady() ? 'ready' : 'unavailable'
    };

    const readyCount = Object.values(engines).filter(status => status === 'ready').length;
    
    let status: 'healthy' | 'degraded' | 'critical';
    let message: string;

    if (readyCount === 4) {
      status = 'healthy';
      message = 'All AI engines operational';
    } else if (readyCount >= 2) {
      status = 'degraded';
      message = `${readyCount}/4 AI engines operational - using hybrid mode`;
    } else {
      status = 'critical';
      message = `Only ${readyCount}/4 AI engines operational - using fallback mode`;
    }

    return { status, engines, message };
  }

  isReady(): boolean {
    return this.initialized;
  }
}
