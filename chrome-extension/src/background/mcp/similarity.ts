import type { TaskContext, LearnedApiAction } from './types';
import { createLogger } from '../log';

const logger = createLogger('SimilarityMatcher');

export interface SimilarityMatch {
  learnedAction: LearnedApiAction;
  similarityScore: number;
  confidence: number;
}

export class SimilarityMatcher {
  /**
   * Calculate similarity between two tasks
   */
  static calculateTaskSimilarity(task1: string, task2: string): number {
    const words1 = task1.toLowerCase().split(/\s+/);
    const words2 = task2.toLowerCase().split(/\s+/);

    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;

    return commonWords.length / totalWords;
  }

  /**
   * Calculate similarity between two contexts
   */
  static calculateContextSimilarity(context1: TaskContext, context2: TaskContext): number {
    let similarity = 0;
    let totalFactors = 0;

    // URL similarity (domain matching)
    if (context1.url && context2.url && context1.url !== 'unknown' && context2.url !== 'unknown') {
      try {
        const domain1 = new URL(context1.url).hostname;
        const domain2 = new URL(context2.url).hostname;
        const urlSimilarity = domain1 === domain2 ? 1.0 : 0.0;
        similarity += urlSimilarity;
        totalFactors++;
      } catch (error) {
        // Skip URL similarity if URLs are invalid
        console.warn('Invalid URL in context similarity:', context1.url, context2.url);
      }
    }

    // Page title similarity
    if (context1.pageTitle && context2.pageTitle) {
      const titleSimilarity = this.calculateTaskSimilarity(context1.pageTitle, context2.pageTitle);
      similarity += titleSimilarity;
      totalFactors++;
    }

    // Element count similarity (normalized)
    if (context1.elementCount > 0 && context2.elementCount > 0) {
      const countDiff = Math.abs(context1.elementCount - context2.elementCount);
      const maxCount = Math.max(context1.elementCount, context2.elementCount);
      const countSimilarity = 1.0 - countDiff / maxCount;
      similarity += countSimilarity;
      totalFactors++;
    }

    return totalFactors > 0 ? similarity / totalFactors : 0;
  }

  /**
   * Calculate overall similarity between a task and a learned action
   */
  static calculateSimilarity(task: string, context: TaskContext, learnedAction: LearnedApiAction): number {
    const taskSimilarity = this.calculateTaskSimilarity(task, learnedAction.taskDescription);
    const contextSimilarity = this.calculateContextSimilarity(context, learnedAction.context);

    // Weight task similarity more heavily than context similarity
    const weightedSimilarity = taskSimilarity * 0.7 + contextSimilarity * 0.3;

    return weightedSimilarity;
  }

  /**
   * Find the best matching learned action
   */
  static async getBestMatch(
    task: string,
    context: TaskContext,
    learnedActions: LearnedApiAction[],
  ): Promise<SimilarityMatch | null> {
    if (learnedActions.length === 0) {
      return null;
    }

    let bestMatch: SimilarityMatch | null = null;
    let highestSimilarity = 0;

    for (const learnedAction of learnedActions) {
      const similarity = this.calculateSimilarity(task, context, learnedAction);

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = {
          learnedAction,
          similarityScore: similarity,
          confidence: similarity * learnedAction.successRate,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Determine if we should use learned actions based on similarity threshold
   */
  static async shouldUseLearnedActions(
    task: string,
    context: TaskContext,
    learnedActions: LearnedApiAction[],
  ): Promise<boolean> {
    const bestMatch = await this.getBestMatch(task, context, learnedActions);

    if (!bestMatch) {
      return false;
    }

    // Use learned actions if confidence is above threshold
    const confidenceThreshold = 0.6;
    const shouldUse = bestMatch.confidence >= confidenceThreshold;

    logger.info(
      `Similarity check: confidence=${bestMatch.confidence.toFixed(3)}, threshold=${confidenceThreshold}, shouldUse=${shouldUse}`,
    );

    return shouldUse;
  }

  /**
   * Get all similar actions above a threshold
   */
  static async getSimilarActions(
    task: string,
    context: TaskContext,
    learnedActions: LearnedApiAction[],
    threshold: number = 0.5,
  ): Promise<SimilarityMatch[]> {
    const matches: SimilarityMatch[] = [];

    for (const learnedAction of learnedActions) {
      const similarity = this.calculateSimilarity(task, context, learnedAction);
      const confidence = similarity * learnedAction.successRate;

      if (confidence >= threshold) {
        matches.push({
          learnedAction,
          similarityScore: similarity,
          confidence,
        });
      }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  }
}
