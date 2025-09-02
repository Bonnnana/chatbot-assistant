import type { LearnedApiAction, TaskContext } from './types';
import { createLogger } from '../log';

const logger = createLogger('MCPServerStorage');

const STORAGE_KEYS = {
  LEARNED_API_ACTIONS: 'mcp_learned_api_actions',
  API_LEARNING_METRICS: 'mcp_api_learning_metrics',
};

export class MCPServerStorage {
  /**
   * Store a learned API action
   */
  static async storeLearnedApiAction(action: LearnedApiAction): Promise<void> {
    try {
      const existingActions = await this.getAllLearnedApiActions();
      existingActions.push(action);

      await chrome.storage.local.set({
        [STORAGE_KEYS.LEARNED_API_ACTIONS]: existingActions,
      });

      logger.info(`Stored learned API action: ${action.id}`);
    } catch (error) {
      logger.error('Error storing learned API action:', error);
      throw error;
    }
  }

  /**
   * Get all learned API actions
   */
  static async getAllLearnedApiActions(): Promise<LearnedApiAction[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.LEARNED_API_ACTIONS);
      return result[STORAGE_KEYS.LEARNED_API_ACTIONS] || [];
    } catch (error) {
      logger.error('Error getting learned API actions:', error);
      return [];
    }
  }

  /**
   * Get a specific learned API action by ID
   */
  static async getLearnedApiAction(id: string): Promise<LearnedApiAction | null> {
    try {
      const actions = await this.getAllLearnedApiActions();
      return actions.find(action => action.id === id) || null;
    } catch (error) {
      logger.error('Error getting learned API action:', error);
      return null;
    }
  }

  /**
   * Update success rate for a learned API action
   */
  static async updateApiActionSuccessRate(id: string, success: boolean): Promise<void> {
    try {
      const actions = await this.getAllLearnedApiActions();
      const actionIndex = actions.findIndex(action => action.id === id);

      if (actionIndex !== -1) {
        const action = actions[actionIndex];
        const currentRate = action.successRate;
        const newRate = currentRate * 0.9 + (success ? 0.1 : 0);

        actions[actionIndex] = {
          ...action,
          successRate: newRate,
          lastUsed: Date.now(),
        };

        await chrome.storage.local.set({
          [STORAGE_KEYS.LEARNED_API_ACTIONS]: actions,
        });

        logger.info(`Updated success rate for API action ${id}: ${newRate.toFixed(3)}`);
      }
    } catch (error) {
      logger.error('Error updating API action success rate:', error);
    }
  }

  /**
   * Delete a learned API action
   */
  static async deleteLearnedApiAction(id: string): Promise<void> {
    try {
      const actions = await this.getAllLearnedApiActions();
      const filteredActions = actions.filter(action => action.id !== id);

      await chrome.storage.local.set({
        [STORAGE_KEYS.LEARNED_API_ACTIONS]: filteredActions,
      });

      logger.info(`Deleted learned API action: ${id}`);
    } catch (error) {
      logger.error('Error deleting learned API action:', error);
      throw error;
    }
  }

  /**
   * Clear all learned API actions
   */
  static async clearAllLearnedApiActions(): Promise<void> {
    try {
      await chrome.storage.local.remove(STORAGE_KEYS.LEARNED_API_ACTIONS);
      logger.info('All learned API actions cleared');
    } catch (error) {
      logger.error('Error clearing learned API actions:', error);
      throw error;
    }
  }

  /**
   * Get API learning metrics
   */
  static async getApiLearningMetrics() {
    try {
      const actions = await this.getAllLearnedApiActions();

      const totalTasksLearned = actions.length;
      const totalApiCallsStored = actions.reduce((sum, action) => sum + action.apiCalls.length, 0);
      const averageSuccessRate =
        actions.length > 0 ? actions.reduce((sum, action) => sum + action.successRate, 0) / actions.length : 0;

      // Get most common API endpoints
      const endpointCounts = new Map<string, number>();
      actions.forEach(action => {
        action.apiCalls.forEach(call => {
          const domain = new URL(call.url).hostname;
          endpointCounts.set(domain, (endpointCounts.get(domain) || 0) + 1);
        });
      });

      const mostCommonEndpoints = Array.from(endpointCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([domain]) => domain);

      return {
        totalTasksLearned,
        totalApiCallsStored,
        averageSuccessRate,
        mostCommonEndpoints,
      };
    } catch (error) {
      logger.error('Error getting API learning metrics:', error);
      return {
        totalTasksLearned: 0,
        totalApiCallsStored: 0,
        averageSuccessRate: 0,
        mostCommonEndpoints: [],
      };
    }
  }
}

// Export singleton instance
export const mcpStorage = MCPServerStorage;
