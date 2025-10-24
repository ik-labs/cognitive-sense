// Service Worker for CognitiveSense Chrome Extension

import { AgentRegistry } from '@/agents/base/AgentRegistry';
import { LocalStorageManager } from '@/storage/LocalStorage';
import { ShoppingPersuasionAgent } from '@/agents/shopping/ShoppingAgent';
// Note: MultiLanguageManager is only used in content script and panel, not in service worker

console.log('CognitiveSense Service Worker starting...');

const storage = new LocalStorageManager();

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('CognitiveSense installed:', details.reason);
  
  try {
    // Initialize agent registry
    const registry = AgentRegistry.getInstance();
    
    // Register Shopping Persuasion Agent
    registry.register(new ShoppingPersuasionAgent());
    
    await registry.initialize();
    
    // Set up default settings if first install
    if (details.reason === 'install') {
      await initializeDefaultSettings();
      
      // Show welcome page
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('welcome.html') 
      });
    }
    
    console.log('CognitiveSense initialized successfully');
  } catch (error) {
    console.error('Failed to initialize CognitiveSense:', error);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('CognitiveSense starting up...');
  
  try {
    const registry = AgentRegistry.getInstance();
    
    // Register Shopping Persuasion Agent
    registry.register(new ShoppingPersuasionAgent());
    
    await registry.initialize();
  } catch (error) {
    console.error('Failed to start CognitiveSense:', error);
  }
});

// Handle messages from content scripts and panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Service worker received message:', message.type);
  
  switch (message.type) {
    case 'DETECTION_COMPLETE':
      handleDetectionComplete(message.data, sender);
      break;
      
    case 'OPEN_SIDE_PANEL':
      if (sender.tab?.id) {
        chrome.sidePanel.open({ tabId: sender.tab.id })
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ error: error.message }));
        return true;
      }
      break;
      
    case 'HYBRID_REQUEST':
      handleHybridRequest(message.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep message channel open for async response
      
    case 'UPDATE_BADGE':
      updateBadge(message.data, sender.tab?.id);
      break;
      
    case 'GET_SETTINGS':
      storage.getUserSettings()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'SAVE_SETTINGS':
      storage.saveUserSettings(message.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
});

// Handle action button click (open side panel)
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  }
});

// Handle tab updates (new page loads)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      // Update last visit for this domain
      const url = new URL(tab.url);
      await storage.updateLastVisit(url.hostname);
      
      // Reset badge for new page
      chrome.action.setBadgeText({ text: '', tabId });
    } catch (error) {
      console.error('Failed to handle tab update:', error);
    }
  }
});

/**
 * Initialize default settings on first install
 */
async function initializeDefaultSettings(): Promise<void> {
  try {
    const defaultSettings = {
      agents: {
        shopping_persuasion: true,
        social_media: false,   // Phase 2: Social media agent
        news_bias: false,
        social_pulse: false
      },
      sensitivity: 0.7,
      hybridEnabled: true,
      domains: {}
    };
    
    await storage.saveUserSettings(defaultSettings);
    console.log('Default settings initialized');
  } catch (error) {
    console.error('Failed to initialize default settings:', error);
  }
}

/**
 * Handle detection completion from content script
 */
async function handleDetectionComplete(data: {
  detections: any[];
  overallScore: number;
  url: string;
}, sender: chrome.runtime.MessageSender): Promise<void> {
  try {
    // Update badge with detection count
    const count = data.detections.length;
    const tabId = sender.tab?.id;
    
    if (tabId) {
      if (count > 0) {
        chrome.action.setBadgeText({ 
          text: String(count), 
          tabId 
        });
        
        // Set badge color based on overall score
        const color = data.overallScore >= 70 ? '#ef4444' : // Red
                     data.overallScore >= 50 ? '#f97316' : // Orange  
                     data.overallScore >= 30 ? '#f59e0b' : // Yellow
                     '#10b981'; // Green
        
        chrome.action.setBadgeBackgroundColor({ 
          color, 
          tabId 
        });
      } else {
        chrome.action.setBadgeText({ text: '', tabId });
      }
    }
    
    // Save detections to history
    for (const detection of data.detections) {
      await storage.saveDetection(detection);
    }
    
    console.log(`Processed ${count} detections for ${data.url}`);
  } catch (error) {
    console.error('Failed to handle detection complete:', error);
  }
}

/**
 * Handle hybrid API requests
 */
async function handleHybridRequest(data: {
  endpoint: string;
  payload: any;
}): Promise<any> {
  try {
    // Check if hybrid features are enabled
    const settings = await storage.getUserSettings();
    if (!settings.hybridEnabled) {
      throw new Error('Hybrid features are disabled');
    }
    
    // Make API call to backend
    const apiUrl = 'https://api.cognitivesense.app'; // TODO: Update with actual URL
    const response = await fetch(`${apiUrl}/api/shopping/${data.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'demo-key' // TODO: Use proper API key management
      },
      body: JSON.stringify(data.payload)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Hybrid request successful:', data.endpoint);
    
    return result;
  } catch (error) {
    console.error('Hybrid request failed:', error);
    throw error;
  }
}

/**
 * Update extension badge
 */
function updateBadge(data: {
  count: number;
  score: number;
}, tabId?: number): void {
  if (!tabId) return;
  
  try {
    if (data.count > 0) {
      chrome.action.setBadgeText({ 
        text: String(data.count), 
        tabId 
      });
      
      // Color based on risk level
      const color = data.score >= 70 ? '#dc2626' : // Red (danger)
                   data.score >= 50 ? '#ea580c' : // Orange (warning)
                   data.score >= 30 ? '#d97706' : // Yellow (caution)
                   '#059669'; // Green (safe)
      
      chrome.action.setBadgeBackgroundColor({ color, tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  } catch (error) {
    console.error('Failed to update badge:', error);
  }
}

// Handle extension shutdown
self.addEventListener('beforeunload', async () => {
  console.log('CognitiveSense shutting down...');
  
  try {
    const registry = AgentRegistry.getInstance();
    await registry.shutdown();
  } catch (error) {
    console.error('Failed to shutdown cleanly:', error);
  }
});

console.log('CognitiveSense Service Worker loaded');
