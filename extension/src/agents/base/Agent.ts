import { 
  AgentKey, 
  AgentConfig, 
  PageContext, 
  Detection, 
  AnalysisResult, 
  OverlaySpec, 
  HybridResult 
} from './types';

/**
 * Base Agent interface that all cognitive safety agents must implement
 */
export interface Agent {
  // Identity
  key: AgentKey;
  name: string;
  description: string;
  icon: string;                         // Emoji or icon path
  version: string;
  
  // Lifecycle
  initialize(config: AgentConfig): Promise<void>;
  shutdown(): Promise<void>;
  
  // Detection
  canHandle(context: PageContext): boolean;
  detect(context: PageContext): Promise<Detection[]>;
  analyze(detections: Detection[]): AnalysisResult;
  
  // UI
  render(detection: Detection): OverlaySpec;
  getSidebarComponent(): any;           // React component
  
  // Hybrid (Optional)
  hybridAction?(detection: Detection, action: string): Promise<HybridResult>;
  
  // Configuration
  getDefaultConfig(): AgentConfig;
  validateConfig(config: AgentConfig): boolean;
}

/**
 * Abstract base class providing common functionality
 */
export abstract class BaseAgent implements Agent {
  abstract key: AgentKey;
  abstract name: string;
  abstract description: string;
  abstract icon: string;
  abstract version: string;
  
  protected config: AgentConfig | null = null;
  protected initialized = false;
  
  async initialize(config: AgentConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error(`Invalid config for agent ${this.key}`);
    }
    
    this.config = config;
    await this.onInitialize();
    this.initialized = true;
  }
  
  async shutdown(): Promise<void> {
    await this.onShutdown();
    this.initialized = false;
    this.config = null;
  }
  
  // Template methods for subclasses
  protected async onInitialize(): Promise<void> {
    // Override in subclasses
  }
  
  protected async onShutdown(): Promise<void> {
    // Override in subclasses
  }
  
  // Abstract methods that must be implemented
  abstract canHandle(context: PageContext): boolean;
  abstract detect(context: PageContext): Promise<Detection[]>;
  abstract analyze(detections: Detection[]): AnalysisResult;
  abstract render(detection: Detection): OverlaySpec;
  abstract getSidebarComponent(): any;
  
  // Default implementations
  getDefaultConfig(): AgentConfig {
    return {
      enabled: true,
      sensitivity: 0.7,
      thresholds: {},
      domains: {},
      ui: {
        showOverlays: true,
        overlayPosition: 'bottom',
        autoHideDelay: 5000
      }
    };
  }
  
  validateConfig(config: AgentConfig): boolean {
    return (
      typeof config.enabled === 'boolean' &&
      typeof config.sensitivity === 'number' &&
      config.sensitivity >= 0 && config.sensitivity <= 1 &&
      typeof config.ui === 'object'
    );
  }
  
  // Helper methods
  protected isEnabled(): boolean {
    return this.config?.enabled ?? false;
  }
  
  protected getSensitivity(): number {
    return this.config?.sensitivity ?? 0.7;
  }
  
  protected getThreshold(type: string): number {
    return this.config?.thresholds[type] ?? 5; // Default threshold
  }
  
  protected shouldShowOverlays(): boolean {
    return this.config?.ui.showOverlays ?? true;
  }
  
  protected generateId(): string {
    return `${this.key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  protected calculateOverallScore(detections: Detection[]): number {
    if (detections.length === 0) return 0;
    
    // Weighted average based on severity
    const weights = { low: 1, medium: 2, high: 3 };
    let weightedSum = 0;
    let totalWeight = 0;
    
    detections.forEach(detection => {
      const weight = weights[detection.severity];
      weightedSum += detection.score * weight;
      totalWeight += weight;
    });
    
    return Math.round((weightedSum / totalWeight) * 10); // Scale to 0-100
  }
  
  protected getRiskLevel(score: number): 'safe' | 'caution' | 'warning' | 'danger' {
    if (score >= 70) return 'danger';
    if (score >= 50) return 'warning';
    if (score >= 30) return 'caution';
    return 'safe';
  }
}
