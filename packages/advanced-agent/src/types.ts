import { z } from 'zod';

// Base Schemas
export const BaseDataSchema = z.object({
  value: z.union([z.number(), z.string(), z.boolean()]),
  timestamp: z.number(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const TimeSeriesSchema = BaseDataSchema.extend({
  value: z.number(),
  domain: z.enum(['financial', 'medical', 'environmental']).optional(),
  confidence: z.number().min(0).max(1).optional()
});

// Pattern Types
export const PatternTypeSchema = z.enum([
  'trend',
  'seasonality',
  'outlier',
  'changepoint',
  'cycle',
  'anomaly',
  'correlation'
]);

export const PatternSchema = z.object({
  type: PatternTypeSchema,
  confidence: z.number().min(0).max(1),
  significance: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.any()),
  affectedRange: z.object({
    start: z.number(),
    end: z.number()
  })
});

// Analysis Result Types
export const DecompositionSchema = z.object({
  trend: z.array(z.number()),
  seasonal: z.array(z.number()),
  residuals: z.array(z.number())
});

export const CycleSchema = z.object({
  period: z.number(),
  strength: z.number(),
  confidence: z.number()
});

export const ChangePointSchema = z.object({
  index: z.number(),
  confidence: z.number(),
  type: z.enum(['level', 'trend', 'variance'])
});

// Domain-Specific Schemas
export const FinancialMetricsSchema = z.object({
  volatility: z.object({
    daily: z.number(),
    rolling: z.array(z.number())
  }),
  sharpeRatio: z.number(),
  beta: z.number(),
  maxDrawdown: z.number()
});

export const TradingPatternSchema = z.object({
  supportLevels: z.array(z.number()),
  resistanceLevels: z.array(z.number()),
  patterns: z.array(z.object({
    type: z.string(),
    confidence: z.number(),
    range: z.tuple([z.number(), z.number()])
  }))
});

export const RiskAssessmentSchema = z.object({
  varDaily: z.number(),
  stressTest: z.record(z.string(), z.number()),
  tailRisk: z.object({
    expectedShortfall: z.number(),
    worstCase: z.number()
  })
});

// Analysis Types
export type TimeSeriesData = z.infer<typeof TimeSeriesSchema>;
export type Pattern = z.infer<typeof PatternSchema>;
export type Decomposition = z.infer<typeof DecompositionSchema>;
export type Cycle = z.infer<typeof CycleSchema>;
export type ChangePoint = z.infer<typeof ChangePointSchema>;
export type FinancialMetrics = z.infer<typeof FinancialMetricsSchema>;
export type TradingPattern = z.infer<typeof TradingPatternSchema>;
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

// Configuration Types
export interface AnalysisOptions {
  domain?: 'financial' | 'medical' | 'environmental';
  contextWindow?: number;
  confidenceThreshold?: number;
}

export interface VisualizationOptions {
  showTrend: boolean;
  showSeasonality: boolean;
  highlightAnomalies: boolean;
  annotations?: Array<{
    type: string;
    timestamp: number;
    value: number;
    label?: string;
  }>;
}

// Analysis Result Types
export interface TimeSeriesAnalysis {
  decomposition: Decomposition;
  cycles: Cycle[];
  changePoints: ChangePoint[];
  patterns: Pattern[];
}

export interface ComprehensiveStats {
  basic: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  };
  distribution: {
    skewness: number;
    kurtosis: number;
    quantiles: {
      q1: number;
      q3: number;
    };
  };
}

export interface DomainSpecificInsights {
  financial?: {
    metrics: FinancialMetrics;
    tradingPatterns: TradingPattern;
    riskAssessment: RiskAssessment;
  };
  medical?: {
    // Add medical-specific types
  };
  environmental?: {
    // Add environmental-specific types
  };
}

export interface AnalysisMetadata {
  confidence: number;
  quality: number;
  recommendations: string[];
}

// Complete Analysis Result
export interface HolisticAnalysis {
  timeSeries: TimeSeriesAnalysis;
  statistics: ComprehensiveStats;
  domainInsights: DomainSpecificInsights;
  correlations: Array<{
    variables: [string, string];
    coefficient: number;
    significance: number;
  }>;
  metadata: AnalysisMetadata;
}

// Service Types
export interface CacheOptions {
  maxSize: number;
  ttl: number;
}

export interface AnalyticsEvent {
  event: string;
  data: any;
  timestamp: number;
}

// Error Types
export class AnalysisError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export enum ErrorCode {
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  INVALID_DOMAIN = 'INVALID_DOMAIN',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  CACHE_ERROR = 'CACHE_ERROR'
}
