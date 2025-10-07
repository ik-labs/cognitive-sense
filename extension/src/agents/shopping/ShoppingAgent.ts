/**
 * Shopping Persuasion Agent - Detects manipulation tactics on e-commerce sites
 */

import { BaseAgent } from '../base/Agent';
import { 
  AgentKey, 
  AgentConfig, 
  PageContext, 
  Detection, 
  AnalysisResult, 
  OverlaySpec 
} from '../base/types';
import { AIEngineManager } from '../../ai/AIEngineManager';

// Import detectors
import { UrgencyDetector } from './detectors/UrgencyDetector';
// import { AnchoringDetector } from './detectors/AnchoringDetector';
// import { SocialProofDetector } from './detectors/SocialProofDetector';
// import { FOMODetector } from './detectors/FOMODetector';
// import { BundlingDetector } from './detectors/BundlingDetector';
// import { DarkPatternDetector } from './detectors/DarkPatternDetector';

export interface ShoppingDetector {
  name: string;
  detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]>;
}

export class ShoppingPersuasionAgent extends BaseAgent {
  key: AgentKey = 'shopping_persuasion';
  name = 'Shopping Persuasion Agent';
  description = 'Detects psychological manipulation tactics on e-commerce websites';
  icon = '🛒';
  version = '1.0.0';

  private aiManager: AIEngineManager;
  private detectors: ShoppingDetector[] = [];

  constructor() {
    super();
    this.aiManager = AIEngineManager.getInstance();
  }

  protected async onInitialize(): Promise<void> {
    console.log('Initializing Shopping Persuasion Agent...');
    
    // Note: AI engines will be initialized in content script context
    // Service worker just sets up the agent structure
    
    // Initialize detectors
    this.detectors = [
      new UrgencyDetector()
      // TODO: Add other detectors after fixing TypeScript issues
      // new AnchoringDetector(),
      // new SocialProofDetector(),
      // new FOMODetector(),
      // new BundlingDetector(),
      // new DarkPatternDetector()
    ];

    console.log(`Shopping Agent initialized with ${this.detectors.length} detectors`);
  }

  protected async onShutdown(): Promise<void> {
    await this.aiManager.destroy();
    this.detectors = [];
  }

  /**
   * Check if this agent should run on the given page
   */
  canHandle(context: PageContext): boolean {
    console.log('Shopping Agent canHandle check:', {
      domain: context.domain,
      type: context.metadata.type,
      url: context.url.href
    });

    // Check if this is a shopping/product page
    if (context.metadata.type === 'product') {
      console.log('✅ Detected as product page');
      return true;
    }

    // Check domain patterns
    const domain = context.domain.toLowerCase();
    const shoppingSites = [
      'amazon', 'flipkart', 'myntra', 'ebay', 'croma', 'nykaa',
      'shopify', 'woocommerce', 'bigcommerce', 'etsy', 'alibaba',
      'walmart', 'target', 'bestbuy', 'homedepot', 'lowes'
    ];

    const isShoppingSite = shoppingSites.some(site => domain.includes(site));
    if (isShoppingSite) {
      console.log('✅ Detected as shopping site:', domain);
      return true;
    }

    // Check content patterns
    const content = context.content.text.toLowerCase();
    const hasShoppingIndicators = [
      'add to cart', 'buy now', 'purchase', 'checkout',
      'price', 'discount', 'sale', 'offer',
      'reviews', 'rating', 'stars'
    ].some(indicator => content.includes(indicator));

    const hasProductStructure = context.content.links.some(link => 
      link.href.includes('/product/') || 
      link.href.includes('/item/') ||
      link.href.includes('/p/')
    );

    console.log('Content check:', { hasShoppingIndicators, hasProductStructure });

    return hasShoppingIndicators && hasProductStructure;
  }

  /**
   * Run all detectors and return found manipulations
   */
  async detect(context: PageContext): Promise<Detection[]> {
    if (!this.isEnabled()) {
      return [];
    }

    console.log(`Running shopping detection on ${context.url.href}`);
    
    try {
      // Run all detectors in parallel
      const detectionPromises = this.detectors.map(async (detector) => {
        try {
          const detections = await detector.detect(context, this.aiManager);
          console.log(`${detector.name}: ${detections.length} detections`);
          return detections;
        } catch (error) {
          console.error(`${detector.name} failed:`, error);
          return [];
        }
      });

      const detectionResults = await Promise.all(detectionPromises);
      const allDetections = detectionResults.flat();

      // Filter by sensitivity threshold
      const sensitivity = this.getSensitivity();
      const filteredDetections = allDetections.filter(detection => {
        const threshold = this.getThreshold(detection.type);
        return detection.score >= threshold * sensitivity;
      });

      console.log(`Shopping Agent found ${filteredDetections.length} detections (${allDetections.length} before filtering)`);
      
      return filteredDetections;
    } catch (error) {
      console.error('Shopping detection failed:', error);
      return [];
    }
  }

  /**
   * Analyze detections and calculate overall risk
   */
  analyze(detections: Detection[]): AnalysisResult {
    if (detections.length === 0) {
      return {
        detections,
        overallScore: 0,
        riskLevel: 'safe',
        breakdown: {},
        recommendations: {
          primary: 'No manipulation tactics detected. This appears to be a trustworthy page.',
          actions: []
        }
      };
    }

    // Calculate category breakdown
    const breakdown: Record<string, number> = {};
    const categoryScores: Record<string, number[]> = {};

    detections.forEach(detection => {
      if (!categoryScores[detection.type]) {
        categoryScores[detection.type] = [];
      }
      categoryScores[detection.type].push(detection.score);
    });

    // Average scores per category
    Object.entries(categoryScores).forEach(([category, scores]) => {
      breakdown[category] = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );
    });

    // Calculate overall score (weighted by severity)
    const overallScore = this.calculateOverallScore(detections);
    const riskLevel = this.getRiskLevel(overallScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(detections, riskLevel);

    return {
      detections,
      overallScore,
      riskLevel,
      breakdown,
      recommendations
    };
  }

  /**
   * Render overlay for a specific detection
   */
  render(detection: Detection): OverlaySpec {
    // Find the best element to anchor the overlay to
    const anchorElement = this.findAnchorElement(detection);
    
    return {
      type: detection.severity === 'high' ? 'tooltip' : 'badge',
      severity: detection.severity,
      anchor: {
        element: anchorElement,
        position: 'top',
        offset: 8
      },
      content: {
        title: detection.title,
        description: detection.description,
        details: detection.details,
        actions: detection.actions
      },
      autoHide: detection.severity === 'low',
      autoHideDelay: 5000
    };
  }

  /**
   * Get React component for sidebar display
   */
  getSidebarComponent(): any {
    // TODO: Return React component for Day 4
    return null;
  }

  /**
   * Handle hybrid cloud actions (optional)
   */
  async hybridAction(detection: Detection, action: string): Promise<any> {
    switch (action) {
      case 'price_history':
        return this.getPriceHistory(detection);
      case 'alternatives':
        return this.getAlternatives(detection);
      case 'verify_reviews':
        return this.verifyReviews(detection);
      default:
        throw new Error(`Unknown hybrid action: ${action}`);
    }
  }

  /**
   * Get default configuration for shopping agent
   */
  getDefaultConfig(): AgentConfig {
    return {
      enabled: true,
      sensitivity: 0.7,
      thresholds: {
        urgency: 6,
        anchoring: 5,
        social_proof: 6,
        fomo: 7,
        bundling: 5,
        dark_patterns: 8
      },
      domains: {
        whitelist: [], // Run on all domains by default
        blacklist: ['localhost', '127.0.0.1'] // Skip local development
      },
      ui: {
        showOverlays: true,
        overlayPosition: 'top',
        autoHideDelay: 5000
      }
    };
  }

  private findAnchorElement(detection: Detection): HTMLElement {
    // Try to find the most relevant element based on detection type
    let selector = '';
    
    switch (detection.type) {
      case 'urgency':
        selector = '[class*="countdown"], [class*="timer"], [class*="urgent"], [class*="limited"]';
        break;
      case 'anchoring':
        selector = '[class*="price"], [class*="discount"], [class*="save"], [class*="was"]';
        break;
      case 'social_proof':
        selector = '[class*="review"], [class*="rating"], [class*="star"], [class*="popular"]';
        break;
      case 'fomo':
        selector = '[class*="exclusive"], [class*="limited"], [class*="rare"], [class*="special"]';
        break;
      case 'bundling':
        selector = '[class*="bundle"], [class*="combo"], [class*="package"], [class*="add"]';
        break;
      case 'dark_patterns':
        selector = 'button, [role="button"], input[type="submit"], [class*="btn"]';
        break;
    }

    // Try to find specific element
    const specificElement = document.querySelector(selector) as HTMLElement;
    if (specificElement) {
      return specificElement;
    }

    // Fallback to main content area
    const mainElement = document.querySelector('main, [role="main"], #main, .main') as HTMLElement;
    if (mainElement) {
      return mainElement;
    }

    // Ultimate fallback
    return document.body;
  }

  private generateRecommendations(_detections: Detection[], riskLevel: string): AnalysisResult['recommendations'] {
    const actions = [];
    
    // Risk-based primary recommendation
    let primary = '';
    switch (riskLevel) {
      case 'danger':
        primary = '⚠️ High manipulation risk detected. Consider avoiding this purchase or researching elsewhere.';
        actions.push({
          label: 'Find Alternatives',
          icon: '🔍',
          onClick: () => this.findAlternatives(),
          isHybrid: true
        });
        break;
      case 'warning':
        primary = '⚠️ Multiple manipulation tactics detected. Take time to verify claims before purchasing.';
        actions.push({
          label: 'Check Price History',
          icon: '📊',
          onClick: () => this.checkPriceHistory(),
          isHybrid: true
        });
        break;
      case 'caution':
        primary = '⚠️ Some manipulation detected. Verify product details and compare prices.';
        break;
      default:
        primary = 'Low manipulation risk. This appears to be a trustworthy page.';
    }

    // Add common actions
    if (riskLevel !== 'safe') {
      actions.push(
        {
          label: 'Verify Reviews',
          icon: '⭐',
          onClick: () => this.verifyReviewsAction(),
          isHybrid: true
        },
        {
          label: 'Learn More',
          icon: '📚',
          onClick: () => this.showEducation()
        }
      );
    }

    return { primary, actions };
  }

  // Hybrid action implementations
  private async getPriceHistory(_detection: Detection): Promise<any> {
    // TODO: Implement in Day 5
    return { message: 'Price history feature coming soon' };
  }

  private async getAlternatives(_detection: Detection): Promise<any> {
    // TODO: Implement in Day 5
    return { message: 'Alternative products feature coming soon' };
  }

  private async verifyReviews(_detection: Detection): Promise<any> {
    // TODO: Implement in Day 5
    return { message: 'Review verification feature coming soon' };
  }

  private findAlternatives(): void {
    console.log('Finding alternatives...');
  }

  private checkPriceHistory(): void {
    console.log('Checking price history...');
  }

  private verifyReviewsAction(): void {
    console.log('Verifying reviews...');
  }

  private showEducation(): void {
    console.log('Showing educational content...');
  }
}
