// Content Script Entry Point for CognitiveSense

import { AgentRegistry } from '../agents/base/AgentRegistry';
import { AIEngineManager } from '../ai/AIEngineManager';
import { ShoppingPersuasionAgent } from '../agents/shopping/ShoppingAgent';
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
  private analysisTimeout: number | null = null;
  
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
      
      // Register Shopping Agent in content script context
      console.log('Registering Shopping Agent...');
      this.registry.register(new ShoppingPersuasionAgent());
      
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
      }
      
      // Save to storage for side panel
      await chrome.storage.local.set({
        latestDetections: allDetections,
        latestScore: overallScore,
        latestUrl: window.location.href,
        latestTimestamp: new Date().toISOString()
      });

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
      console.error('Page analysis failed:', error);
    } finally {
      this.isAnalyzing = false;
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
    // Debounced re-analysis on DOM changes
    const observer = new MutationObserver(() => {
      if (this.analysisTimeout) {
        clearTimeout(this.analysisTimeout);
      }
      
      this.analysisTimeout = window.setTimeout(() => {
        this.analyzePage();
      }, 2000); // Wait 2 seconds after last change
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false // Don't trigger on style changes
    });
    
    // Re-analyze on significant scroll (new content may be visible)
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset;
      const scrollDelta = Math.abs(scrollTop - lastScrollTop);
      
      // If scrolled more than 50% of viewport height
      if (scrollDelta > window.innerHeight * 0.5) {
        lastScrollTop = scrollTop;
        
        if (this.analysisTimeout) {
          clearTimeout(this.analysisTimeout);
        }
        
        this.analysisTimeout = window.setTimeout(() => {
          this.analyzePage();
        }, 1000);
      }
    });
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
