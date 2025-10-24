import { Agent } from './Agent';
import { AgentKey, AgentConfig, PageContext, UserSettings } from './types';

/**
 * Singleton registry for managing all cognitive safety agents
 */
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<AgentKey, Agent> = new Map();
  private initialized = false;
  
  private constructor() {}
  
  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }
  
  /**
   * Register a new agent
   */
  register(agent: Agent): void {
    if (this.agents.has(agent.key)) {
      throw new Error(`Agent ${agent.key} already registered`);
    }
    
    console.log(`Registering agent: ${agent.name} (${agent.key})`);
    this.agents.set(agent.key, agent);
  }
  
  /**
   * Get a specific agent by key
   */
  getAgent(key: AgentKey): Agent | undefined {
    return this.agents.get(key);
  }
  
  /**
   * Get all registered agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Initialize all registered agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('Initializing AgentRegistry...');
    
    const configs = await this.loadConfigs();
    const initPromises: Promise<void>[] = [];
    
    for (const [key, agent] of this.agents.entries()) {
      const config = configs[key] || agent.getDefaultConfig();
      initPromises.push(agent.initialize(config));
    }
    
    await Promise.all(initPromises);
    this.initialized = true;
    
    console.log(`Initialized ${this.agents.size} agents`);
  }
  
  /**
   * Shutdown all agents
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return;
    
    const shutdownPromises: Promise<void>[] = [];
    for (const agent of this.agents.values()) {
      shutdownPromises.push(agent.shutdown());
    }
    
    await Promise.all(shutdownPromises);
    this.initialized = false;
  }
  
  /**
   * Get agents that should run on the given page context
   */
  getActiveAgents(context: PageContext, userSettings: UserSettings): Agent[] {
    console.log('🔍 AgentRegistry.getActiveAgents() called');
    console.log('Available agents:', this.getAllAgents().map(a => a.key));
    console.log('User settings agents:', userSettings.agents);
    
    return this.getAllAgents().filter(agent => {
      console.log(`\n📋 Checking agent: ${agent.key}`);
      
      // Check if agent is enabled globally
      const isEnabled = userSettings.agents[agent.key];
      console.log(`  - Enabled: ${isEnabled}`);
      if (!isEnabled) {
        console.log(`  ❌ Agent disabled globally`);
        return false;
      }
      
      // Check domain-specific settings
      const domainSettings = userSettings.domains[context.domain];
      if (domainSettings && !domainSettings.enabled) {
        console.log(`  ❌ Domain disabled for this agent`);
        return false;
      }
      
      if (domainSettings?.agents && !domainSettings.agents[agent.key]) {
        console.log(`  ❌ Agent disabled for this domain`);
        return false;
      }
      
      // Check if agent can handle this page type
      console.log(`  - Calling canHandle()...`);
      const canHandle = agent.canHandle(context);
      console.log(`  - canHandle result: ${canHandle}`);
      
      if (canHandle) {
        console.log(`  ✅ Agent activated!`);
      } else {
        console.log(`  ❌ Agent cannot handle this page`);
      }
      
      return canHandle;
    });
  }
  
  /**
   * Update configuration for a specific agent
   */
  async updateAgentConfig(key: AgentKey, config: AgentConfig): Promise<void> {
    const agent = this.agents.get(key);
    if (!agent) {
      throw new Error(`Agent ${key} not found`);
    }
    
    if (!agent.validateConfig(config)) {
      throw new Error(`Invalid config for agent ${key}`);
    }
    
    // Save to storage
    const configs = await this.loadConfigs();
    configs[key] = config;
    await chrome.storage.local.set({ agentConfigs: configs });
    
    // Reinitialize agent with new config
    await agent.shutdown();
    await agent.initialize(config);
  }
  
  /**
   * Get current configuration for all agents
   */
  async getConfigs(): Promise<Record<AgentKey, AgentConfig>> {
    return await this.loadConfigs();
  }
  
  /**
   * Reset all agents to default configuration
   */
  async resetToDefaults(): Promise<void> {
    const defaultConfigs: Record<string, AgentConfig> = {};
    
    for (const [key, agent] of this.agents.entries()) {
      defaultConfigs[key] = agent.getDefaultConfig();
    }
    
    await chrome.storage.local.set({ agentConfigs: defaultConfigs });
    
    // Reinitialize all agents
    await this.shutdown();
    await this.initialize();
  }
  
  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalAgents: this.agents.size,
      initialized: this.initialized,
      agentKeys: Array.from(this.agents.keys())
    };
  }
  
  /**
   * Load agent configurations from storage
   */
  private async loadConfigs(): Promise<Record<AgentKey, AgentConfig>> {
    try {
      const stored = await chrome.storage.local.get('agentConfigs');
      return stored.agentConfigs || {};
    } catch (error) {
      console.error('Failed to load agent configs:', error);
      return {} as Record<AgentKey, AgentConfig>;
    }
  }
}
