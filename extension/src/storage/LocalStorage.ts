import { Detection, AgentKey, AgentConfig, UserSettings } from '@/agents/base/types';

/**
 * Manages local storage operations for the extension
 */
export class LocalStorageManager {
  
  // Detection History
  async saveDetection(detection: Detection): Promise<void> {
    try {
      const history = await this.getDetectionHistory();
      
      // Add to beginning of array
      history.unshift(detection);
      
      // Keep only last 100 detections
      if (history.length > 100) {
        history.length = 100;
      }
      
      await chrome.storage.local.set({ detectionHistory: history });
    } catch (error) {
      console.error('Failed to save detection:', error);
    }
  }
  
  async getDetectionHistory(limit: number = 50): Promise<Detection[]> {
    try {
      const result = await chrome.storage.local.get('detectionHistory');
      const history = result.detectionHistory || [];
      return history.slice(0, limit);
    } catch (error) {
      console.error('Failed to get detection history:', error);
      return [];
    }
  }
  
  async clearDetectionHistory(): Promise<void> {
    try {
      await chrome.storage.local.remove('detectionHistory');
    } catch (error) {
      console.error('Failed to clear detection history:', error);
    }
  }
  
  // Agent Configuration
  async saveAgentConfig(key: AgentKey, config: AgentConfig): Promise<void> {
    try {
      const configs = await this.getAllAgentConfigs();
      configs[key] = config;
      await chrome.storage.local.set({ agentConfigs: configs });
    } catch (error) {
      console.error('Failed to save agent config:', error);
    }
  }
  
  async getAllAgentConfigs(): Promise<Record<AgentKey, AgentConfig>> {
    try {
      const result = await chrome.storage.local.get('agentConfigs');
      return result.agentConfigs || {};
    } catch (error) {
      console.error('Failed to get agent configs:', error);
      return {} as Record<AgentKey, AgentConfig>;
    }
  }
  
  // User Settings
  async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      await chrome.storage.local.set({ userSettings: settings });
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  }
  
  async getUserSettings(): Promise<UserSettings> {
    try {
      const result = await chrome.storage.local.get('userSettings');
      return result.userSettings || this.getDefaultUserSettings();
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return this.getDefaultUserSettings();
    }
  }
  
  private getDefaultUserSettings(): UserSettings {
    return {
      agents: {
        shopping_persuasion: true,
        social_media: false,   // Phase 2: Social media agent
        news_bias: false,      // Future agents disabled by default
        social_pulse: false
      },
      sensitivity: 0.7,
      hybridEnabled: true,
      domains: {}
    };
  }
  
  // Domain-specific Settings
  async saveDomainSettings(domain: string, settings: {
    enabled: boolean;
    agents: Record<AgentKey, boolean>;
  }): Promise<void> {
    try {
      const userSettings = await this.getUserSettings();
      userSettings.domains[domain] = settings;
      await this.saveUserSettings(userSettings);
    } catch (error) {
      console.error('Failed to save domain settings:', error);
    }
  }
  
  async getDomainSettings(domain: string): Promise<{
    enabled: boolean;
    agents: Record<AgentKey, boolean>;
  } | null> {
    try {
      const userSettings = await this.getUserSettings();
      return userSettings.domains[domain] || null;
    } catch (error) {
      console.error('Failed to get domain settings:', error);
      return null;
    }
  }
  
  // Session Tracking
  async updateSessionStart(domain: string): Promise<void> {
    try {
      const sessionKey = `session:${domain}`;
      await chrome.storage.local.set({ [sessionKey]: Date.now() });
    } catch (error) {
      console.error('Failed to update session start:', error);
    }
  }
  
  async updateLastVisit(domain: string): Promise<void> {
    try {
      const visitKey = `lastVisit:${domain}`;
      await chrome.storage.local.set({ [visitKey]: Date.now() });
    } catch (error) {
      console.error('Failed to update last visit:', error);
    }
  }
  
  // Behavioral Learning Data
  async saveBehaviorData(agentKey: AgentKey, data: {
    dismissedDetections: string[];
    acceptedRecommendations: string[];
    thresholdAdjustments: Record<string, number>;
  }): Promise<void> {
    try {
      const key = `behavior:${agentKey}`;
      await chrome.storage.local.set({ [key]: data });
    } catch (error) {
      console.error('Failed to save behavior data:', error);
    }
  }
  
  async getBehaviorData(agentKey: AgentKey): Promise<{
    dismissedDetections: string[];
    acceptedRecommendations: string[];
    thresholdAdjustments: Record<string, number>;
  }> {
    try {
      const key = `behavior:${agentKey}`;
      const result = await chrome.storage.local.get(key);
      return result[key] || {
        dismissedDetections: [],
        acceptedRecommendations: [],
        thresholdAdjustments: {}
      };
    } catch (error) {
      console.error('Failed to get behavior data:', error);
      return {
        dismissedDetections: [],
        acceptedRecommendations: [],
        thresholdAdjustments: {}
      };
    }
  }
  
  // Privacy & Export
  async exportAllData(): Promise<{
    detectionHistory: Detection[];
    agentConfigs: Record<AgentKey, AgentConfig>;
    userSettings: UserSettings;
    behaviorData: Record<AgentKey, any>;
    exportDate: string;
  }> {
    try {
      const [history, configs, settings] = await Promise.all([
        this.getDetectionHistory(1000), // Export all history
        this.getAllAgentConfigs(),
        this.getUserSettings()
      ]);
      
      // Get behavior data for all agents
      const behaviorData = {} as Record<AgentKey, any>;
      const agentKeys: AgentKey[] = ['shopping_persuasion', 'news_bias', 'social_pulse'];
      
      for (const key of agentKeys) {
        behaviorData[key] = await this.getBehaviorData(key);
      }
      
      return {
        detectionHistory: history,
        agentConfigs: configs,
        userSettings: settings,
        behaviorData,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }
  
  async deleteAllData(): Promise<void> {
    try {
      // Get all keys from storage
      const allData = await chrome.storage.local.get(null);
      const keysToDelete = Object.keys(allData);
      
      // Remove all data
      await chrome.storage.local.remove(keysToDelete);
      
      console.log('All user data deleted');
    } catch (error) {
      console.error('Failed to delete all data:', error);
      throw error;
    }
  }
  
  // Storage Statistics
  async getStorageStats(): Promise<{
    bytesUsed: number;
    itemCount: number;
    detectionCount: number;
  }> {
    try {
      const allData = await chrome.storage.local.get(null);
      const bytesUsed = await chrome.storage.local.getBytesInUse();
      const history = await this.getDetectionHistory(1000);
      
      return {
        bytesUsed,
        itemCount: Object.keys(allData).length,
        detectionCount: history.length
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { bytesUsed: 0, itemCount: 0, detectionCount: 0 };
    }
  }
}
