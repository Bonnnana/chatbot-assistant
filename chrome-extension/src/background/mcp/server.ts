import type { MCPRequest, MCPResponse, LearnedApiAction, TaskContext } from './types';
import { mcpStorage } from './storage';
import { SimilarityMatcher } from './similarity';
import { ApiLearner } from './api-learner';
import { createLogger } from '../log';

const logger = createLogger('MCPServer');

export class MCPServer {
  /**
   * Process a task request and determine if to use learned API actions or execute normally
   */
  static async processRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      logger.info(`Processing MCP request for task: ${request.task}`);

      // Get all learned API actions
      const learnedActions = await mcpStorage.getAllLearnedApiActions();

      if (learnedActions.length === 0) {
        logger.info('No learned API actions available, will execute normally');
        return {
          success: true,
          isNewTask: true,
        };
      }

      // Check if we should use learned actions
      const shouldUseLearned = await SimilarityMatcher.shouldUseLearnedActions(
        request.task,
        request.context,
        learnedActions,
      );

      logger.info(`Should use learned actions: ${shouldUseLearned}`);
      logger.info(`Available learned actions: ${learnedActions.length}`);
      learnedActions.forEach(action => {
        logger.info(
          `- ${action.id}: "${action.taskDescription}" (${action.apiCalls.length} API calls, confidence: ${action.successRate})`,
        );
      });

      if (shouldUseLearned) {
        // Find the best matching learned action
        const bestMatch = await SimilarityMatcher.getBestMatch(request.task, request.context, learnedActions);

        logger.info(
          `Best match found: ${bestMatch ? bestMatch.learnedAction.id : 'none'} (confidence: ${bestMatch?.confidence || 'N/A'})`,
        );

        if (bestMatch && bestMatch.learnedAction.apiCalls.length > 0) {
          logger.info(
            `Using learned API action: ${bestMatch.learnedAction.id} (confidence: ${bestMatch.confidence}) with ${bestMatch.learnedAction.apiCalls.length} API calls`,
          );

          return {
            success: true,
            learnedAction: bestMatch.learnedAction,
            apiCalls: bestMatch.learnedAction.apiCalls,
            isNewTask: false,
          };
        } else if (bestMatch && bestMatch.learnedAction.apiCalls.length === 0) {
          logger.info(
            `Found learned action with 0 API calls: ${bestMatch.learnedAction.id}, falling back to normal execution`,
          );
        } else if (!bestMatch) {
          logger.info(`No best match found despite shouldUseLearned=true`);
        }
      }

      logger.info('No suitable learned API action found, will execute normally');
      return {
        success: true,
        isNewTask: true,
      };
    } catch (error) {
      logger.error('Error processing MCP request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isNewTask: true,
      };
    }
  }

  /**
   * Start monitoring network requests for a task
   */
  static startNetworkMonitoring(taskId: string): void {
    ApiLearner.startMonitoring(taskId);
  }

  /**
   * Stop monitoring network requests for a task
   */
  static stopNetworkMonitoring(taskId: string): void {
    ApiLearner.stopMonitoring(taskId);
  }

  /**
   * Record a network request
   */
  static recordNetworkRequest(taskId: string, request: any): void {
    const networkRequest = {
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      queryParams: this.extractQueryParams(request.url),
      timestamp: Date.now(),
    };

    ApiLearner.recordRequest(taskId, networkRequest);
  }

  /**
   * Record a network response
   */
  static recordNetworkResponse(taskId: string, response: any): void {
    const networkResponse = {
      status: response.status,
      headers: response.headers,
      data: response.data,
      timestamp: Date.now(),
    };

    ApiLearner.recordResponse(taskId, networkResponse);
  }

  /**
   * Learn from network monitoring
   */
  static async learnFromNetworkMonitoring(
    taskId: string,
    task: string,
    context: TaskContext,
    executionTime: number,
  ): Promise<LearnedApiAction> {
    try {
      logger.info(`Learning from network monitoring: ${task}`);

      const learnedAction = await ApiLearner.learnFromNetworkMonitoring(taskId, task, context, executionTime);

      // Only store if we actually learned API calls
      if (learnedAction.apiCalls.length > 0) {
        logger.info(
          `Successfully learned API action: ${learnedAction.id} with ${learnedAction.apiCalls.length} API calls`,
        );
        return learnedAction;
      } else {
        logger.info(`No API calls learned, not storing action: ${learnedAction.id}`);
        // Don't store actions with 0 API calls
        return learnedAction;
      }
    } catch (error) {
      logger.error('Error learning from network monitoring:', error);
      throw error;
    }
  }

  /**
   * Execute learned API calls
   */
  static async executeLearnedApiCalls(
    learnedAction: LearnedApiAction,
    currentTask?: string,
  ): Promise<{ success: boolean; results: any[] }> {
    try {
      logger.info(`Executing learned API calls for: ${learnedAction.taskDescription}`);

      const results = await ApiLearner.executeLearnedApiCalls(learnedAction, currentTask);

      const success = results.every(r => r.success);

      // Update success rate based on execution results
      await ApiLearner.updateSuccessRate(learnedAction.id, success);

      logger.info(`Learned API action execution completed with ${success ? 'success' : 'failure'}`);

      return {
        success,
        results,
      };
    } catch (error) {
      logger.error('Error executing learned API calls:', error);
      throw error;
    }
  }

  /**
   * Extract query parameters from URL
   */
  private static extractQueryParams(url: string): Record<string, string> {
    try {
      const urlObj = new URL(url);
      const params: Record<string, string> = {};

      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return params;
    } catch (error) {
      return {};
    }
  }

  /**
   * Get learning statistics
   */
  static async getLearningStats() {
    return await ApiLearner.getLearningStats();
  }

  /**
   * Clear all learned API actions
   */
  static async clearLearnedApiActions(): Promise<void> {
    await mcpStorage.clearAllLearnedApiActions();
    logger.info('All learned API actions cleared');
  }

  /**
   * Get all learned API actions
   */
  static async getAllLearnedApiActions(): Promise<LearnedApiAction[]> {
    return await mcpStorage.getAllLearnedApiActions();
  }

  /**
   * Delete a specific learned API action
   */
  static async deleteLearnedApiAction(id: string): Promise<void> {
    await mcpStorage.deleteLearnedApiAction(id);
    logger.info(`Learned API action deleted: ${id}`);
  }
}
