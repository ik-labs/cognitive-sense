/**
 * Social Media Agent - Detects manipulation tactics on social platforms
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
import { MisinformationDetector } from './detectors/MisinformationDetector';
import { EmotionalManipulationDetector } from './detectors/EmotionalManipulationDetector';
import { EchoChamberDetector } from './detectors/EchoChamberDetector';
import { FakeAccountDetector } from './detectors/FakeAccountDetector';
import { ToxicContentDetector } from './detectors/ToxicContentDetector';
import { PoliticalManipulationDetector } from './detectors/PoliticalManipulationDetector';

export interface SocialDetector {
  name: string;
  detect(context: PageContext, aiManager: AIEngineManager): Promise<Detection[]>;
}

export class SocialMediaAgent extends BaseAgent {
  key: AgentKey = 'social_media';
  name = 'Social Media Agent';
  description = 'Detects manipulation tactics on social media platforms';
  icon = '📱';
  version = '1.0.0';

  private detectors: SocialDetector[] = [];
  private aiManager: AIEngineManager | null = null;

  protected async onInitialize(): Promise<void> {
    console.log('Initializing Social Media Agent...');
    
    // Initialize detectors
    this.detectors = [
      new MisinformationDetector(),
      new EmotionalManipulationDetector(),
      new EchoChamberDetector(),
      new FakeAccountDetector(),
      new ToxicContentDetector(),
      new PoliticalManipulationDetector()
    ];

    console.log(`Social Agent initialized with ${this.detectors.length} detectors`);
  }

  protected async onShutdown(): Promise<void> {
    this.detectors = [];
    this.aiManager = null;
  }

  canHandle(context: PageContext): boolean {
    const domain = context.domain.toLowerCase();
    
    console.log('SocialMediaAgent canHandle check:', {
      domain: context.domain,
      type: context.metadata.type,
      url: context.url.href || context.url
    });
    
    // Explicit domain matching for all social platforms
    const socialPlatforms = [
      'facebook.com',
      'twitter.com',
      'x.com',
      'instagram.com',
      'tiktok.com',
      'linkedin.com',
      'reddit.com',
      'threads.net',
      'mastodon.social',
      'bluesky.social',
      'threads.app',
      'instagram.com',
      'youtube.com',
      'tiktok.com'
    ];

    // Check for exact domain match or partial match
    const isSocialPlatform = socialPlatforms.some(platform => {
      return domain === platform || domain.endsWith('.' + platform) || domain.includes(platform);
    });

    if (isSocialPlatform) {
      console.log(`✅ SocialMediaAgent: Detected as social media page: ${domain}`);
      return true;
    }

    console.log(`❌ SocialMediaAgent: Not a social platform: ${domain}`);
    return false;
  }

  async detect(context: PageContext): Promise<Detection[]> {
    if (!this.initialized) {
      console.warn('Social Agent not initialized');
      return [];
    }

    try {
      this.aiManager = (context as any).aiManager;
      
      console.log('Running social media detection...');
      const allDetections: Detection[] = [];

      // Run all detectors in parallel
      const detectionPromises = this.detectors.map(detector =>
        detector.detect(context, this.aiManager!)
          .catch(error => {
            console.error(`${detector.name} failed:`, error);
            return [];
          })
      );

      const results = await Promise.all(detectionPromises);
      results.forEach(detections => allDetections.push(...detections));

      // Log results
      this.detectors.forEach((detector, index) => {
        const count = results[index]?.length || 0;
        console.log(`${detector.name}: ${count} detections`);
      });

      console.log(`Social Agent found ${allDetections.length} detections total`);
      return allDetections;
    } catch (error) {
      console.error('Social Agent detection failed:', error);
      return [];
    }
  }

  analyze(detections: Detection[]): AnalysisResult {
    if (detections.length === 0) {
      return {
        detections: [],
        overallScore: 0,
        riskLevel: 'safe',
        breakdown: {},
        recommendations: {
          primary: 'No social media manipulation detected',
          actions: []
        }
      };
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore(detections);
    
    // Group by type
    const breakdown: Record<string, number> = {};
    detections.forEach(d => {
      breakdown[d.type] = (breakdown[d.type] || 0) + 1;
    });

    const riskLevel = this.getRiskLevel(overallScore);

    return {
      detections,
      overallScore,
      riskLevel,
      breakdown,
      recommendations: {
        primary: `${detections.length} social media manipulation tactics detected`,
        actions: []
      }
    };
  }

  render(detection: Detection): OverlaySpec {
    return {
      type: 'badge',
      severity: detection.severity,
      anchor: {
        element: detection.element || document.body,
        position: 'top',
        offset: 10
      },
      content: {
        title: detection.title,
        description: detection.description
      }
    };
  }

  getSidebarComponent(): any {
    // Returns React component for sidebar
    return null; // Handled by Panel.tsx
  }

  getDefaultConfig(): AgentConfig {
    return {
      enabled: true,
      sensitivity: 0.7,
      thresholds: {
        misinformation: 5,
        emotional_manipulation: 4,
        echo_chamber: 6,
        fake_account: 7,
        toxicity: 6,
        political_manipulation: 5
      },
      domains: {
        whitelist: [
          'facebook.com',
          'twitter.com',
          'x.com',
          'instagram.com',
          'tiktok.com',
          'linkedin.com',
          'reddit.com'
        ]
      },
      ui: {
        showOverlays: true,
        overlayPosition: 'top',
        autoHideDelay: 5000
      }
    };
  }
}
