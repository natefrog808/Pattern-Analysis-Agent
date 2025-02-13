import { processors } from './processors';
import { PriorityQueue } from './utils/queue';
import { generateProcessingMetrics } from './utils/metrics';
import { ImageAnalysis, AnalysisOptions } from './types';
import _ from 'lodash';

export class ImageProcessingManager {
  private analyses = new Map<string, ImageAnalysis>();
  private batches = new Map<string, string[]>();
  private processingQueue = new PriorityQueue<ImageAnalysis>();
  private running = false;
  private maxConcurrent = 3;

  constructor(options: { maxConcurrent?: number } = {}) {
    this.maxConcurrent = options.maxConcurrent || 3;
  }

  async scheduleAnalysis(analysis: ImageAnalysis, options: AnalysisOptions = {}) {
    const startTime = Date.now();
    
    // Add to tracking
    this.analyses.set(analysis.id, {
      ...analysis,
      status: 'pending',
      progress: {
        currentStep: 0,
        totalSteps: analysis.tasks.length,
        startTime,
        lastUpdate: startTime
      }
    });

    // Add to queue with priority
    this.processingQueue.enqueue(
      analysis,
      options.priority || 1
    );

    // Start processing if not already running
    if (!this.running) {
      this.processQueue();
    }
  }

  async scheduleBatch(analyses: ImageAnalysis[], options: {
    maxConcurrent?: number;
    timeout?: number;
    priority?: number;
  } = {}) {
    const batchId = `batch-${Date.now()}`;
    const analysisIds = analyses.map(a => a.id);
    
    // Track batch
    this.batches.set(batchId, analysisIds);

    // Schedule all analyses
    for (const analysis of analyses) {
      await this.scheduleAnalysis(analysis, {
        priority: options.priority,
        timeout: options.timeout
      });
    }

    return batchId;
  }

  private async processQueue() {
    this.running = true;

    while (this.processingQueue.size > 0) {
      // Process up to maxConcurrent analyses
      const batch = [];
      while (batch.length < this.maxConcurrent && this.processingQueue.size > 0) {
        const analysis = this.processingQueue.dequeue();
        if (analysis) {
          batch.push(analysis);
        }
      }

      // Process batch concurrently
      await Promise.all(
        batch.map(analysis => this.processAnalysis(analysis))
      );
    }

    this.running = false;
  }

  private async processAnalysis(analysis: ImageAnalysis) {
    const storedAnalysis = this.analyses.get(analysis.id);
    if (!storedAnalysis) return;

    try {
      storedAnalysis.status = 'processing';
      const startTime = Date.now();

      for (const task of analysis.tasks) {
        // Skip if analysis was cancelled
        if (storedAnalysis.status === 'cancelled') {
          break;
        }

        const processor = processors[task.type];
        if (!processor) {
          throw new Error(`No processor found for type: ${task.type}`);
        }

        // Process task
        const result = await processor.process(
          analysis.imageData,
          task.options
        );

        // Update results
        storedAnalysis.results = storedAnalysis.results || [];
        storedAnalysis.results.push({
          taskId: task.id,
          ...result,
          timestamp: Date.now()
        });

        // Update progress
        storedAnalysis.progress.currentStep++;
        storedAnalysis.progress.lastUpdate = Date.now();
      }

      // Mark as completed if not cancelled
      if (storedAnalysis.status !== 'cancelled') {
        storedAnalysis.status = 'completed';
      }

      // Generate final metrics
      storedAnalysis.metrics = generateProcessingMetrics(
        startTime,
        storedAnalysis.results.length
      );

    } catch (error) {
      storedAnalysis.status = 'failed';
      storedAnalysis.error = error.message;
      throw error;
    }
  }

  // Public methods for status and control
  async getAnalysis(id: string): Promise<ImageAnalysis | undefined> {
    return this.analyses.get(id);
  }

  async getBatchStatus(batchId: string) {
    const analysisIds = this.batches.get(batchId);
    if (!analysisIds) return null;

    const analyses = analysisIds
      .map(id => this.analyses.get(id))
      .filter((a): a is ImageAnalysis => !!a);

    return {
      batchId,
      status: this.calculateBatchStatus(analyses),
      progress: this.calculateBatchProgress(analyses),
      analyses
    };
  }

  async cancelAnalysis(id: string) {
    const analysis = this.analyses.get(id);
    if (analysis) {
      analysis.status = 'cancelled';
      analysis.progress.lastUpdate = Date.now();
    }
  }

  async cancelBatch(batchId: string) {
    const analysisIds = this.batches.get(batchId);
    if (!analysisIds) return;

    await Promise.all(
      analysisIds.map(id => this.cancelAnalysis(id))
    );
  }

  async cleanupBatch(batchId: string, options: {
    deleteResults?: boolean;
    archiveResults?: boolean;
  } = {}) {
    const analysisIds = this.batches.get(batchId);
    if (!analysisIds) return;

    if (options.deleteResults) {
      analysisIds.forEach(id => this.analyses.delete(id));
    }

    if (options.archiveResults) {
      // Implement archiving logic here
    }

    this.batches.delete(batchId);
  }

  // Helper methods
  private calculateBatchStatus(analyses: ImageAnalysis[]) {
    if (analyses.every(a => a.status === 'completed')) return 'completed';
    if (analyses.every(a => a.status === 'cancelled')) return 'cancelled';
    if (analyses.some(a => a.status === 'failed')) return 'failed';
    if (analyses.some(a => a.status === 'processing')) return 'processing';
    return 'pending';
  }

  private calculateBatchProgress(analyses: ImageAnalysis[]) {
    const totalSteps = _.sumBy(analyses, a => a.progress.totalSteps);
    const completedSteps = _.sumBy(analyses, a => a.progress.currentStep);
    const startTime = _.min(analyses.map(a => a.progress.startTime)) || Date.now();
    const lastUpdate = _.max(analyses.map(a => a.progress.lastUpdate)) || Date.now();

    return {
      currentStep: completedSteps,
      totalSteps,
      startTime,
      lastUpdate
    };
  }
}
