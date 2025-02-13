import { EventEmitter } from 'events';

export interface ProgressData {
  currentStep: number;
  totalSteps: number;
  startTime: number;
  lastUpdate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  metadata?: Record<string, any>;
}

export interface ProgressUpdate extends ProgressData {
  id: string;
  percentage: number;
  duration: number;
  estimatedTimeRemaining: number;
}

export class ProgressTracker extends EventEmitter {
  private progresses = new Map<string, ProgressData>();
  private updateInterval: NodeJS.Timer | null = null;
  private listeners = new Map<string, Set<(progress: ProgressUpdate) => void>>();

  constructor(private options: {
    updateFrequency?: number;
    enableAutoCleanup?: boolean;
    cleanupDelay?: number;
  } = {}) {
    super();
    
    // Start update interval if frequency is specified
    if (options.updateFrequency) {
      this.startUpdateInterval();
    }
  }

  startTracking(id: string, totalSteps: number, metadata?: Record<string, any>) {
    const progress: ProgressData = {
      currentStep: 0,
      totalSteps,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      status: 'pending',
      metadata
    };

    this.progresses.set(id, progress);
    this.emitUpdate(id, progress);
  }

  updateProgress(id: string, update: Partial<ProgressData>) {
    const progress = this.progresses.get(id);
    if (!progress) return;

    Object.assign(progress, {
      ...update,
      lastUpdate: Date.now()
    });

    this.emitUpdate(id, progress);

    // Auto cleanup if enabled and completed
    if (
      this.options.enableAutoCleanup &&
      (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled')
    ) {
      setTimeout(() => {
        this.stopTracking(id);
      }, this.options.cleanupDelay || 5000);
    }
  }

  getProgress(id: string): ProgressUpdate | null {
    const progress = this.progresses.get(id);
    if (!progress) return null;

    return this.formatProgressUpdate(id, progress);
  }

  stopTracking(id: string) {
    this.progresses.delete(id);
    this.listeners.delete(id);
    this.emit('tracking-stopped', id);
  }

  onProgress(id: string, callback: (progress: ProgressUpdate) => void) {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    this.listeners.get(id)?.add(callback);

    // Send initial update if available
    const progress = this.progresses.get(id);
    if (progress) {
      callback(this.formatProgressUpdate(id, progress));
    }

    // Return cleanup function
    return () => {
      this.listeners.get(id)?.delete(callback);
    };
  }

  getAllProgresses(): Record<string, ProgressUpdate> {
    const updates: Record<string, ProgressUpdate> = {};
    for (const [id, progress] of this.progresses.entries()) {
      updates[id] = this.formatProgressUpdate(id, progress);
    }
    return updates;
  }

  private startUpdateInterval() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      for (const [id, progress] of this.progresses.entries()) {
        if (progress.status === 'processing') {
          this.emitUpdate(id, progress);
        }
      }
    }, this.options.updateFrequency || 1000);
  }

  private stopUpdateInterval() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private emitUpdate(id: string, progress: ProgressData) {
    const update = this.formatProgressUpdate(id, progress);
    
    // Emit to specific listeners
    this.listeners.get(id)?.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in progress listener:', error);
      }
    });

    // Emit general event
    this.emit('progress', update);
  }

  private formatProgressUpdate(id: string, progress: ProgressData): ProgressUpdate {
    const now = Date.now();
    const duration = now - progress.startTime;
    const percentage = (progress.currentStep / progress.totalSteps) * 100;
    
    // Calculate estimated time remaining
    const timePerStep = duration / progress.currentStep;
    const remainingSteps = progress.totalSteps - progress.currentStep;
    const estimatedTimeRemaining = timePerStep * remainingSteps;

    return {
      id,
      ...progress,
      percentage,
      duration,
      estimatedTimeRemaining: isFinite(estimatedTimeRemaining) ? estimatedTimeRemaining : 0
    };
  }

  // Cleanup resources
  destroy() {
    this.stopUpdateInterval();
    this.progresses.clear();
    this.listeners.clear();
    this.removeAllListeners();
  }
}

// Event tracking utilities
export const createProgressTracker = (options?: {
  updateFrequency?: number;
  enableAutoCleanup?: boolean;
  cleanupDelay?: number;
}) => {
  return new ProgressTracker(options);
};

export interface BatchProgressData {
  batchId: string;
  items: Map<string, ProgressData>;
  metadata?: Record<string, any>;
}

export class BatchProgressTracker extends ProgressTracker {
  private batches = new Map<string, BatchProgressData>();

  startBatch(batchId: string, items: string[], metadata?: Record<string, any>) {
    const batchData: BatchProgressData = {
      batchId,
      items: new Map(),
      metadata
    };

    items.forEach(itemId => {
      this.startTracking(itemId, 100); // Default to 100 steps
      batchData.items.set(itemId, this.getProgress(itemId)!);
    });

    this.batches.set(batchId, batchData);
    this.emit('batch-started', batchId);
  }

  updateBatchItem(batchId: string, itemId: string, update: Partial<ProgressData>) {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    this.updateProgress(itemId, update);
    batch.items.set(itemId, this.getProgress(itemId)!);
    this.emit('batch-item-updated', { batchId, itemId, update });
  }

  getBatchProgress(batchId: string) {
    const batch = this.batches.get(batchId);
    if (!batch) return null;

    const items = Array.from(batch.items.values());
    const totalProgress = items.reduce(
      (acc, item) => acc + (item.percentage || 0),
      0
    ) / items.length;

    return {
      batchId,
      totalProgress,
      items: Object.fromEntries(batch.items),
      metadata: batch.metadata
    };
  }

  completeBatch(batchId: string) {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    batch.items.forEach((_, itemId) => {
      this.updateProgress(itemId, { status: 'completed' });
    });

    this.batches.delete(batchId);
    this.emit('batch-completed', batchId);
  }
}
