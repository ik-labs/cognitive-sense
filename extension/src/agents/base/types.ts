// Core types for the agent framework

export type AgentKey = 'shopping_persuasion' | 'news_bias' | 'social_pulse';

export interface PageContext {
  // Page Identity
  url: URL;
  domain: string;
  path: string;
  title: string;
  language: string;
  
  // Content
  content: {
    text: string;                       // Visible text
    headings: string[];                 // H1-H6
    links: LinkInfo[];
    images: ImageInfo[];
    forms: FormInfo[];
  };
  
  // Metadata
  metadata: {
    type: PageType;                     // 'product' | 'article' | 'social' | 'video' | 'unknown'
    structured?: any;                   // JSON-LD, Open Graph, microdata
    charset: string;
    viewport: string;
  };
  
  // User State
  userState: {
    sessionDuration: number;            // ms on this page
    scrollDepth: number;                // 0-1
    interactions: number;               // Clicks, keypresses
    previousVisit?: Date;
  };
  
  // Performance
  timestamp: Date;
  buildTime: number;                    // ms to build context
}

export type PageType = 'product' | 'article' | 'social' | 'video' | 'unknown';

export interface LinkInfo {
  text: string;
  href: string;
}

export interface ImageInfo {
  src: string;
  alt: string;
}

export interface FormInfo {
  action: string;
  method: string;
  inputs: number;
}

export interface Detection {
  id: string;
  agentKey: AgentKey;
  type: string;                         // 'urgency', 'anchoring', etc.
  score: number;                        // 0-10
  severity: 'low' | 'medium' | 'high';
  
  // Content
  title: string;
  description: string;
  reasoning: string;
  
  // Details
  details: Array<{
    label: string;
    value: string;
    icon?: string;
  }>;
  
  // Actions
  actions: Array<{
    label: string;
    variant: 'primary' | 'secondary' | 'ghost';
    icon?: string;
    onClick: () => void;
  }>;
  
  // Metadata
  confidence: number;                   // 0-1
  timestamp: Date;
  pageUrl: string;
  learnMoreUrl?: string;
}

export interface AnalysisResult {
  detections: Detection[];
  overallScore: number;                 // 0-100
  riskLevel: 'safe' | 'caution' | 'warning' | 'danger';
  breakdown: Record<string, number>;    // Category scores
  recommendations: {
    primary: string;
    actions: Array<{
      label: string;
      icon: string;
      onClick: () => void;
      isHybrid?: boolean;
    }>;
  };
}

export interface OverlaySpec {
  type: 'tooltip' | 'badge' | 'highlight' | 'modal';
  severity: 'low' | 'medium' | 'high';
  anchor: {
    element: HTMLElement;
    position: 'top' | 'bottom' | 'left' | 'right';
    offset: number;
  };
  content: {
    title: string;
    description: string;
    details?: Array<{ label: string; value: string; }>;
    actions?: Array<{ label: string; onClick: () => void; }>;
  };
  autoHide?: boolean;
  autoHideDelay?: number;
}

export interface HybridResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AgentConfig {
  enabled: boolean;
  sensitivity: number;                  // 0-1 (how strict)
  thresholds: Record<string, number>;   // Per-detection-type thresholds
  domains: {
    whitelist?: string[];               // Only run on these
    blacklist?: string[];               // Never run on these
  };
  ui: {
    showOverlays: boolean;
    overlayPosition: 'top' | 'bottom' | 'left' | 'right';
    autoHideDelay?: number;             // ms
  };
}

export interface UserSettings {
  agents: Record<AgentKey, boolean>;
  sensitivity: number;
  hybridEnabled: boolean;
  domains: Record<string, {
    enabled: boolean;
    agents: Record<AgentKey, boolean>;
  }>;
}
