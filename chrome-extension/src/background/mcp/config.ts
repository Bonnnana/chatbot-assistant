export interface MCPConfig {
  enabled: boolean;
  similarityThreshold: number;
  maxMatches: number;
  learningEnabled: boolean;
  autoCleanup: boolean;
  maxStoredActions: number;
  cleanupInterval: number; // in milliseconds
}

export const DEFAULT_MCP_CONFIG: MCPConfig = {
  enabled: true,
  similarityThreshold: 0.7,
  maxMatches: 5,
  learningEnabled: true,
  autoCleanup: true,
  maxStoredActions: 1000,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
};

export class MCPConfigManager {
  private static instance: MCPConfigManager;
  private config: MCPConfig = DEFAULT_MCP_CONFIG;

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): MCPConfigManager {
    if (!MCPConfigManager.instance) {
      MCPConfigManager.instance = new MCPConfigManager();
    }
    return MCPConfigManager.instance;
  }

  private async loadConfig(): Promise<void> {
    try {
      // Load from storage if available
      const stored = localStorage.getItem('mcp_config');
      if (stored) {
        this.config = { ...DEFAULT_MCP_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load MCP config, using defaults:', error);
    }
  }

  async saveConfig(): Promise<void> {
    try {
      localStorage.setItem('mcp_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save MCP config:', error);
    }
  }

  getConfig(): MCPConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<MCPConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getSimilarityThreshold(): number {
    return this.config.similarityThreshold;
  }

  getMaxMatches(): number {
    return this.config.maxMatches;
  }

  isLearningEnabled(): boolean {
    return this.config.learningEnabled;
  }

  shouldAutoCleanup(): boolean {
    return this.config.autoCleanup;
  }

  getMaxStoredActions(): number {
    return this.config.maxStoredActions;
  }

  getCleanupInterval(): number {
    return this.config.cleanupInterval;
  }
}
