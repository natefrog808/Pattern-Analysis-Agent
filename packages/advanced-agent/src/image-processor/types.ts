import { z } from 'zod';

// Basic Types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ProcessingMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  itemsProcessed: number;
  averageTimePerItem: number;
  peakMemoryUsage?: number;
  processorUtilization?: number;
}

// Task Types and Schemas
export const ImageTaskType = z.enum([
  'object_detection',
  'segmentation',
  'classification',
  'text_detection',
  'face_detection',
  'sentiment_analysis',
  'custom'
]);

export const ImageTaskSchema = z.object({
  id: z.string().describe("Unique identifier for the task"),
  type: ImageTaskType,
  options: z.record(z.any()).optional(),
  goal: z.string().describe("Purpose of this task"),
  priority: z.number().default(1),
  timeout: z.number().optional()
});

export type ImageTask = z.infer<typeof ImageTaskSchema>;

// Analysis Types and Schemas
export const ImageAnalysisSchema = z.object({
  id: z.string().describe("Unique identifier for the analysis"),
  name: z.string().describe("Name/description of the analysis"),
  imageData: z.string().describe("Base64 encoded image data"),
  tasks: z.array(ImageTaskSchema),
  options: z.object({
    priority: z.number().optional(),
    timeout: z.number().optional(),
    batchSize: z.number().optional(),
    retryAttempts: z.number().optional(),
    customModels: z.array(z.string()).optional()
  }).optional()
});

export type ImageAnalysis = z.infer<typeof ImageAnalysisSchema> & {
  status: ProcessingStatus;
  progress: {
    currentStep: number;
    totalSteps: number;
    startTime: number;
    lastUpdate: number;
  };
  results?: Array<{
    taskId: string;
    timestamp: number;
    data: any;
  }>;
  error?: string;
  metrics?: ProcessingMetrics;
};

// Result Types and Schemas
export const DetectionResultSchema = z.object({
  label: z.string(),
  confidence: z.number(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  mask?: z.string().optional(),
  attributes?: z.record(z.any()).optional()
});

export const SegmentationResultSchema = z.object({
  mask: z.string(),
  label: z.string(),
  confidence: z.number(),
  area: z.number(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  color: z.string()
});

export const TextDetectionResultSchema = z.object({
  content: z.string(),
  confidence: z.number(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  language: z.string().optional(),
  orientation: z.number().optional()
});

export const FaceAnalysisResultSchema = z.object({
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  landmarks: z.array(z.tuple([z.number(), z.number()])),
  attributes: z.object({
    age: z.number(),
    gender: z.string(),
    emotion: z.string(),
    glasses: z.boolean(),
    headPose: z.tuple([z.number(), z.number(), z.number()])
  }),
  confidence: z.number()
});

// Batch Processing Types
export interface BatchOptions {
  maxConcurrent?: number;
  timeout?: number;
  priority?: number;
  retryAttempts?: number;
  onProgress?: (progress: BatchProgress) => void;
  onComplete?: (results: BatchResults) => void;
  onError?: (error: Error) => void;
}

export interface BatchProgress {
  batchId: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  currentProgress: number;
  startTime: number;
  estimatedTimeRemaining?: number;
  itemStatuses: Record<string, {
    status: ProcessingStatus;
    progress: number;
    error?: string;
  }>;
}

export interface BatchResults {
  batchId: string;
  results: Record<string, {
    status: ProcessingStatus;
    data?: any;
    error?: string;
    metrics: ProcessingMetrics;
  }>;
  metrics: {
    totalDuration: number;
    averageItemDuration: number;
    successRate: number;
    failureRate: number;
  };
}

// Error Types
export class ProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  TIMEOUT = 'TIMEOUT',
  BATCH_FAILED = 'BATCH_FAILED',
  INVALID_TASK = 'INVALID_TASK'
}

// Event Types
export type ProcessingEvent = {
  type: 'start' | 'progress' | 'complete' | 'error' | 'cancel';
  id: string;
  timestamp: number;
  data: any;
};

export type BatchEvent = {
  type: 'batch_start' | 'batch_progress' | 'batch_complete' | 'batch_error';
  batchId: string;
  timestamp: number;
  data: any;
};

// Configuration Types
export interface ProcessorConfig {
  maxRetries?: number;
  timeout?: number;
  validateInput?: boolean;
  enableMetrics?: boolean;
  customModels?: string[];
}

export interface BatchConfig extends ProcessorConfig {
  maxConcurrent?: number;
  batchSize?: number;
  progressive?: boolean;
}

// Export everything
export type {
  ImageTask,
  ImageAnalysis,
  ProcessingMetrics,
  BatchOptions,
  BatchProgress,
  BatchResults,
  ProcessingEvent,
  BatchEvent,
  ProcessorConfig,
  BatchConfig
};
