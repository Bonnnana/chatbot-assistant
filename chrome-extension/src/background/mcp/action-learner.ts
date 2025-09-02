import type { LearnedAction, ActionStep, ActionResult, TaskContext } from './types';
import type { AgentStepHistory, AgentStepRecord } from '../agent/history';
import type { ActionResult as AgentActionResult } from '../agent/types';
import { mcpStorage } from './storage';
import { createLogger } from '../log';

const logger = createLogger('ActionLearner');

export class ActionLearner {
  /**
   * Learn from agent execution history
   */
  static async learnFromExecution(
    taskId: string,
    task: string,
    history: AgentStepHistory,
    context: TaskContext,
    executionTime: number,
  ): Promise<LearnedAction> {
    logger.info(`Learning actions from execution for task: ${task}`);

    const actions: ActionStep[] = [];
    let stepNumber = 0;

    // Extract actions from each step in the history
    for (const record of history.history) {
      if (record.result && record.result.length > 0) {
        for (const result of record.result) {
          const actionStep = this.extractActionStep(stepNumber, result, record);
          if (actionStep) {
            actions.push(actionStep);
            stepNumber++;
          }
        }
      }
    }

    // Create learned action
    const learnedAction: LearnedAction = {
      id: this.generateActionId(task, context),
      taskDescription: task,
      taskHash: this.generateTaskHash(task),
      actions,
      successRate: 1.0, // Initial success rate
      lastUsed: Date.now(),
      createdAt: Date.now(),
      executionTime,
      context,
    };

    // Store the learned action
    await mcpStorage.storeLearnedAction(learnedAction);

    logger.info(`Learned ${actions.length} actions for task: ${task}`);
    return learnedAction;
  }

  /**
   * Extract action step from agent result
   */
  private static extractActionStep(
    stepNumber: number,
    result: AgentActionResult,
    record: AgentStepRecord,
  ): ActionStep | null {
    // Determine agent type based on the record context
    const agentType = this.determineAgentType(record);

    // Extract action information
    const action = this.extractActionName(result, record);
    const parameters = this.extractActionParameters(result, record);

    // Convert to MCP ActionResult
    const mcpResult: ActionResult = {
      success: result.success,
      extractedContent: result.extractedContent || undefined,
      error: result.error || undefined,
      interactedElement: result.interactedElement || undefined,
    };

    return {
      stepNumber,
      agentType,
      action,
      parameters,
      result: mcpResult,
      timestamp: Date.now(),
    };
  }

  /**
   * Determine which agent type executed this step
   */
  private static determineAgentType(record: AgentStepRecord): 'planner' | 'navigator' | 'validator' {
    // This is a simplified approach - in a real implementation,
    // you might want to track agent types more explicitly

    if (record.modelOutput) {
      const output = record.modelOutput.toLowerCase();

      if (output.includes('plan') || output.includes('goal') || output.includes('step')) {
        return 'planner';
      } else if (output.includes('click') || output.includes('type') || output.includes('navigate')) {
        return 'navigator';
      } else if (output.includes('validate') || output.includes('check') || output.includes('verify')) {
        return 'validator';
      }
    }

    // Default to navigator as it's the most common
    return 'navigator';
  }

  /**
   * Extract action name from result
   */
  private static extractActionName(result: AgentActionResult, record: AgentStepRecord): string {
    // First, try to extract specific browser actions from extracted content
    if (result.extractedContent) {
      const content = result.extractedContent.toLowerCase();

      // Look for specific browser actions
      if (content.includes('clicked') || content.includes('click')) {
        return 'click';
      }
      if (content.includes('typed') || content.includes('type') || content.includes('entered')) {
        return 'type';
      }
      if (content.includes('selected') || content.includes('select') || content.includes('option')) {
        return 'select';
      }
      if (content.includes('navigate') || content.includes('navigated') || content.includes('go to')) {
        return 'navigate';
      }
      if (content.includes('wait') || content.includes('waiting')) {
        return 'wait';
      }

      // Look for action patterns in extracted content
      const actionMatch = result.extractedContent.match(/(?:action|step|task):\s*(\w+)/i);
      if (actionMatch) {
        return actionMatch[1];
      }
    }

    if (record.modelOutput) {
      const output = record.modelOutput.toLowerCase();

      // Look for specific browser actions in model output
      if (output.includes('clicked') || output.includes('click')) {
        return 'click';
      }
      if (output.includes('typed') || output.includes('type') || output.includes('entered')) {
        return 'type';
      }
      if (output.includes('selected') || output.includes('select') || output.includes('option')) {
        return 'select';
      }
      if (output.includes('navigate') || output.includes('navigated') || output.includes('go to')) {
        return 'navigate';
      }
      if (output.includes('wait') || output.includes('waiting')) {
        return 'wait';
      }

      // Look for action patterns in model output
      const actionMatch = record.modelOutput.match(/(?:action|step|task):\s*(\w+)/i);
      if (actionMatch) {
        return actionMatch[1];
      }
    }

    // Default action names based on agent type
    const agentType = this.determineAgentType(record);
    switch (agentType) {
      case 'planner':
        return 'plan_task';
      case 'navigator':
        return 'click'; // Default to click for navigator actions
      case 'validator':
        return 'validate_result';
      default:
        return 'click'; // Default to click for unknown actions
    }
  }

  /**
   * Extract action parameters from result
   */
  private static extractActionParameters(result: AgentActionResult, record: AgentStepRecord): Record<string, any> {
    const parameters: Record<string, any> = {};

    // Extract parameters from result
    if (result.extractedContent) {
      // Look for parameter patterns
      const paramMatches = result.extractedContent.match(/(\w+):\s*([^\n\r,]+)/g);
      if (paramMatches) {
        paramMatches.forEach(match => {
          const [key, value] = match.split(':').map(s => s.trim());
          if (key && value) {
            parameters[key] = value;
          }
        });
      }

      // Extract specific action parameters
      const content = result.extractedContent.toLowerCase();

      // Extract text for click actions
      if (content.includes('clicked') && content.includes('index')) {
        const indexMatch = content.match(/index\s*(\d+)/);
        if (indexMatch) {
          parameters.index = parseInt(indexMatch[1]);
        }
      }

      // Extract text for type actions
      if (content.includes('typed') || content.includes('entered')) {
        const textMatch = content.match(/[""]([^""]+)[""]/);
        if (textMatch) {
          parameters.text = textMatch[1];
        }
      }

      // Extract URL for navigation
      if (content.includes('navigate') || content.includes('go to')) {
        const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          parameters.url = urlMatch[1];
        }
      }
    }

    // Add common parameters
    if (result.interactedElement) {
      parameters.element = {
        tag: result.interactedElement.tagName,
        text: result.interactedElement.textContent,
        attributes: result.interactedElement.attributes,
      };

      // Add selector for click actions
      if (result.interactedElement.xpath) {
        parameters.selector = result.interactedElement.xpath;
      }

      // Add text for click actions
      if (result.interactedElement.textContent) {
        parameters.text = result.interactedElement.textContent.trim();
      }
    }

    if (result.error) {
      parameters.error = result.error;
    }

    return parameters;
  }

  /**
   * Generate unique action ID
   */
  private static generateActionId(task: string, context: TaskContext): string {
    const taskHash = this.generateTaskHash(task);
    const contextHash = this.generateContextHash(context);
    return `action_${taskHash}_${contextHash}_${Date.now()}`;
  }

  /**
   * Generate task hash for similarity matching
   */
  private static generateTaskHash(task: string): string {
    // Simple hash function for task text
    let hash = 0;
    for (let i = 0; i < task.length; i++) {
      const char = task.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate context hash
   */
  private static generateContextHash(context: TaskContext): string {
    const contextString = `${context.url}_${context.pageTitle}_${context.elementCount}`;
    let hash = 0;
    for (let i = 0; i < contextString.length; i++) {
      const char = contextString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Update success rate for a learned action
   */
  static async updateSuccessRate(actionId: string, success: boolean): Promise<void> {
    await mcpStorage.updateSuccessRate(actionId, success);
  }

  /**
   * Get learning statistics
   */
  static async getLearningStats() {
    return await mcpStorage.getLearningMetrics();
  }
}
