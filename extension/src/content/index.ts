// Content Script Entry Point for CognitiveSense

import { AgentRegistry } from '../agents/base/AgentRegistry';
import { AIEngineManager } from '../ai/AIEngineManager';
import { ShoppingPersuasionAgent } from '../agents/shopping/ShoppingAgent';
import { SocialMediaAgent } from '../agents/social/SocialMediaAgent';
import { OverlayManager } from '../ui/OverlayManager';
import { PageContextBuilder } from '../core/PageContext';
import { LocalStorageManager } from '../storage/LocalStorage';

console.log('CognitiveSense content script loaded');

class ContentScript {
  private registry: AgentRegistry;
  private contextBuilder: PageContextBuilder;
  private storage: LocalStorageManager;
  private aiManager: AIEngineManager;
  private overlayManager: OverlayManager;
  private isAnalyzing = false;
  
  constructor() {
    this.registry = AgentRegistry.getInstance();
    this.contextBuilder = new PageContextBuilder();
    this.storage = new LocalStorageManager();
    this.aiManager = AIEngineManager.getInstance();
    this.overlayManager = new OverlayManager();
  }
  
  async initialize(): Promise<void> {
    try {
      console.log('Initializing CognitiveSense content script...');
      
      // Initialize AI engines in content script context (where window is available)
      console.log('Initializing AI engines...');
      await this.aiManager.initialize();
      
      // Register agents in content script context
      console.log('Registering agents...');
      this.registry.register(new ShoppingPersuasionAgent());
      this.registry.register(new SocialMediaAgent());
      
      // Initialize agent registry
      await this.registry.initialize();
      
      // Start page analysis
      await this.analyzePage();
      
      // Set up observers for dynamic content
      this.setupObservers();
      
      console.log('CognitiveSense content script initialized');
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }
  
  /**
   * Analyze the current page for manipulation tactics
   */
  async analyzePage(): Promise<void> {
    if (this.isAnalyzing) {
      console.log('Analysis already in progress, skipping...');
      return;
    }
    
    this.isAnalyzing = true;
    
    // Show loading indicator
    this.overlayManager.showLoading();
    
    try {
      console.log('Starting page analysis...');
      const startTime = performance.now();
      
      // Build page context
      const context = await this.contextBuilder.build();
      console.log(`Page context built in ${context.buildTime}ms`);
      
      // Get user settings
      const userSettings = await this.storage.getUserSettings();
      
      // Get active agents for this page
      const activeAgents = this.registry.getActiveAgents(context, userSettings);
      
      if (activeAgents.length === 0) {
        console.log('No active agents for this page');
        return;
      }
      
      console.log(`Running ${activeAgents.length} agents:`, activeAgents.map(a => a.name));
      
      // Run detections in parallel
      const detectionPromises = activeAgents.map(async (agent) => {
        try {
          // Attach aiManager to context for agents to use
          (context as any).aiManager = this.aiManager;
          const detections = await agent.detect(context);
          return { agent, detections };
        } catch (error) {
          console.error(`Agent ${agent.name} failed:`, error);
          return { agent, detections: [] };
        }
      });
      
      const results = await Promise.all(detectionPromises);
      
      // Collect all detections
      const allDetections = results.flatMap(r => r.detections);
      
      // Calculate overall analysis
      let overallScore = 0;
      const breakdown: Record<string, number> = {};
      
      if (allDetections.length > 0) {
        // Use the first agent's analyze method for overall scoring
        // TODO: Implement cross-agent scoring in future
        const primaryAgent = activeAgents[0];
        const analysis = primaryAgent.analyze(allDetections);
        overallScore = analysis.overallScore;
        
        // Render overlays for significant detections
        await this.renderOverlays(allDetections, activeAgents);
      } else {
        // No detections found - clear loading indicator
        this.overlayManager.clear();
        console.log('✅ Page is clean - no manipulation tactics detected');
      }
      
      // Save to storage for side panel (per URL)
      const urlHash = this.hashUrl(window.location.href);
      const storageData = {
        [`detections_${urlHash}`]: allDetections,
        [`score_${urlHash}`]: overallScore,
        [`timestamp_${urlHash}`]: new Date().toISOString(),
        // Also keep latest for backward compatibility
        latestDetections: allDetections,
        latestScore: overallScore,
        latestUrl: window.location.href,
        latestTimestamp: new Date().toISOString()
      };
      
      await chrome.storage.local.set(storageData);
      
      console.log(`💾 Saved detections for URL hash: ${urlHash}`);
      console.log(`📍 URL: ${window.location.href}`);
      console.log(`🔍 Detections stored: ${allDetections.length}`);

      // Send results to service worker and side panel
      chrome.runtime.sendMessage({
        type: 'DETECTION_COMPLETE',
        data: {
          detections: allDetections,
          overallScore,
          breakdown,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });
      
      const totalTime = performance.now() - startTime;
      console.log(`Page analysis completed in ${totalTime}ms. Found ${allDetections.length} detections.`);
    } catch (error) {
      // Handle extension context invalidated error gracefully
      if (error instanceof Error && error.message.includes('Extension context invalidated')) {
        console.warn('⚠️ Extension context invalidated - extension was reloaded');
        console.log('💡 Tip: Reload the page to re-analyze');
      } else {
        console.error('Page analysis failed:', error);
      }
    } finally {
      this.isAnalyzing = false;
      // Always clear loading indicator on error
      this.overlayManager.clear();
    }
  }
  
  /**
   * Render overlays for detections
   */
  private async renderOverlays(detections: any[], _agents: any[]): Promise<void> {
    console.log('Detections to render:', detections.map(d => ({
      type: d.type,
      score: d.score,
      severity: d.severity
    })));

    // Render visual overlays
    await this.overlayManager.render(detections);
  }
  
  /**
   * Set up observers for dynamic content changes
   */
  private setupObservers(): void {
    // For social media, add scroll detection to analyze new content
    // For shopping sites, keep page load only to avoid excessive API calls
    
    const isSocialMedia = this.isSocialMediaPage();
    
    if (isSocialMedia) {
      console.log('📱 Social media detected - enabling scroll-based analysis');
      this.setupScrollListener();
    } else {
      console.log('🛒 Shopping site detected - analysis on page load only');
    }
    
    console.log('✅ Observers setup complete');
  }

  /**
   * Check if current page is a social media platform
   */
  private isSocialMediaPage(): boolean {
    const socialDomains = [
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
      'youtube.com'
    ];
    
    const domain = window.location.hostname.toLowerCase();
    return socialDomains.some(d => domain.includes(d));
  }

  /**
   * Set up scroll listener for social media feeds
   */
  private setupScrollListener(): void {
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const SCROLL_DEBOUNCE_MS = 2000; // Wait 2 seconds after scroll stops
    
    window.addEventListener('scroll', () => {
      // Clear previous timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Debounce: only analyze after scroll stops for 2 seconds
      scrollTimeout = setTimeout(async () => {
        if (!this.isAnalyzing) {
          console.log('📜 Scroll detected - re-analyzing page for new content');
          await this.analyzePage();
        }
      }, SCROLL_DEBOUNCE_MS);
    }, { passive: true });
  }

  /**
   * Simple hash function for URL
   */
  private hashUrl(url: string): string {
    // Extract domain + path (without query params and fragments)
    const urlObj = new URL(url);
    const key = `${urlObj.hostname}${urlObj.pathname}`;
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  // Only run on HTTP(S) pages
  if (!window.location.href.startsWith('http')) {
    return;
  }
  
  // Skip if already initialized
  if ((window as any).cognitiveSenseInitialized) {
    return;
  }
  
  (window as any).cognitiveSenseInitialized = true;
  
  try {
    const contentScript = new ContentScript();
    await contentScript.initialize();
  } catch (error) {
    console.error('Failed to initialize CognitiveSense:', error);
  }
}

// Handle messages from service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'REANALYZE_PAGE':
      init();
      sendResponse({ success: true });
      break;
      
    default:
      console.log('Content script received unknown message:', message.type);
  }
});

console.log('CognitiveSense content script ready');
