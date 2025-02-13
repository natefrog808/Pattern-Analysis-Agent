// packages/advanced-agent/src/image-processor/actions.ts

// ... previous imports and initializations ...

export const batchAnalyzeImages = action({
  name: 'batch-analyze-images',
  schema: z.object({
    analyses: z.array(ImageAnalysisSchema),
    batchOptions: z.object({
      maxConcurrent: z.number().optional(),
      timeout: z.number().optional(),
      priority: z.number().optional()
    }).optional()
  }),
  async handler(call, ctx, agent) {
    const batchId = `batch-${Date.now()}`;
    const analyses = call.data.analyses.map(analysis => ({
      ...analysis,
      batchId,
      status: 'pending',
      progress: {
        currentStep: 0,
        totalSteps: analysis.tasks.length,
        startTime: Date.now(),
        lastUpdate: Date.now()
      },
      results: []
    }));

    // Queue all analyses with priority
    analyses.forEach(analysis => {
      analysisQueue.enqueue(
        analysis, 
        call.data.batchOptions?.priority || analysis.options?.priority || 1
      );
    });

    // Start batch processing
    await imageProcessingManager.scheduleBatch(
      analyses, 
      call.data.batchOptions
    );

    // Store batch information
    ctx.memory.results.push({
      ref: 'action_result',
      callId: call.id,
      data: {
        batchId,
        analyses: analyses.map(a => ({ id: a.id, status: a.status }))
      },
      name: call.name,
      timestamp: Date.now(),
      processed: false
    });

    return {
      batchId,
      analysisIds: analyses.map(a => a.id),
      visualization: (
        <BatchProgress 
          analyses={analyses}
          batchId={batchId}
          onCancel={() => imageProcessingManager.cancelBatch(batchId)}
        />
      )
    };
  }
});

export const getBatchStatus = action({
  name: 'get-batch-status',
  schema: z.object({
    batchId: z.string()
  }),
  async handler(call, ctx, agent) {
    const batchInfo = await imageProcessingManager.getBatchStatus(call.data.batchId);
    if (!batchInfo) {
      throw new Error('Batch not found');
    }

    return {
      batchId: call.data.batchId,
      status: batchInfo.status,
      progress: batchInfo.progress,
      analyses: batchInfo.analyses,
      visualization: (
        <BatchProgress 
          analyses={batchInfo.analyses}
          batchId={call.data.batchId}
          onCancel={() => imageProcessingManager.cancelBatch(call.data.batchId)}
        />
      )
    };
  }
});

export const cancelBatch = action({
  name: 'cancel-batch',
  schema: z.object({
    batchId: z.string()
  }),
  async handler(call, ctx, agent) {
    await imageProcessingManager.cancelBatch(call.data.batchId);
    return { 
      cancelled: true,
      visualization: (
        <BatchCancelledStatus batchId={call.data.batchId} />
      )
    };
  }
});

export const retryAnalysis = action({
  name: 'retry-analysis',
  schema: z.object({
    analysisId: z.string(),
    options: z.object({
      priority: z.number().optional(),
      timeout: z.number().optional()
    }).optional()
  }),
  async handler(call, ctx, agent) {
    const analysis = await imageProcessingManager.getAnalysis(call.data.analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }

    // Reset analysis state
    analysis.status = 'pending';
    analysis.progress = {
      currentStep: 0,
      totalSteps: analysis.tasks.length,
      startTime: Date.now(),
      lastUpdate: Date.now()
    };
    analysis.results = [];
    analysis.error = undefined;

    // Re-queue with optional new priority
    analysisQueue.enqueue(
      analysis, 
      call.data.options?.priority || analysis.options?.priority || 1
    );

    // Schedule processing
    await imageProcessingManager.scheduleAnalysis(analysis, call.data.options);

    return {
      analysisId: analysis.id,
      status: 'retrying',
      visualization: (
        <AnalysisProgress 
          progress={analysis.progress}
          showRetryAttempt={true}
        />
      )
    };
  }
});

export const cleanupBatch = action({
  name: 'cleanup-batch',
  schema: z.object({
    batchId: z.string(),
    options: z.object({
      deleteResults: z.boolean().optional(),
      archiveResults: z.boolean().optional()
    }).optional()
  }),
  async handler(call, ctx, agent) {
    await imageProcessingManager.cleanupBatch(
      call.data.batchId, 
      call.data.options
    );
    return {
      cleaned: true,
      visualization: (
        <BatchCleanupStatus 
          batchId={call.data.batchId}
          options={call.data.options}
        />
      )
    };
  }
});

// Export all actions
export const imageActions = [
  startImageAnalysis,
  getAnalysisStatus,
  cancelAnalysis,
  batchAnalyzeImages,
  getBatchStatus,
  cancelBatch,
  retryAnalysis,
  cleanupBatch
];
