export interface CachedAction {
  taskType: string;
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
    description: string;
  }>;
  successCount: number;
  lastUsed: number;
}

export class ActionCache {
  private cache = new Map<string, CachedAction>();
  private readonly maxCacheSize = 20;

  saveActionSequence(taskType: string, actions: any[], success: boolean): void {
    if (!success) return;

    const key = this.generateKey(taskType);
    const existing = this.cache.get(key);

    if (existing) {
      existing.successCount++;
      existing.lastUsed = Date.now();
    } else {
      this.cache.set(key, {
        taskType,
        actions: this.parseActions(actions),
        successCount: 1,
        lastUsed: Date.now(),
      });
    }

    this.cleanup();
  }

  getCachedActions(taskType: string): CachedAction | null {
    const key = this.generateKey(taskType);
    const cached = this.cache.get(key);

    if (cached && cached.successCount >= 2) {
      cached.lastUsed = Date.now();
      return cached;
    }

    return null;
  }

  private generateKey(taskType: string): string {
    return taskType.toLowerCase();
  }

  private parseActions(actions: any[]): Array<{ type: string; parameters: Record<string, any>; description: string }> {
    return actions.map(action => {
      const actionType = Object.keys(action)[0];
      const params = action[actionType];
      return {
        type: actionType,
        parameters: params,
        description: params.intent || actionType,
      };
    });
  }

  private cleanup(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);

    const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  getStats(): { total: number; successful: number } {
    const total = this.cache.size;
    const successful = Array.from(this.cache.values()).filter(c => c.successCount >= 2).length;
    return { total, successful };
  }
}
