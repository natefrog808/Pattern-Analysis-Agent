// packages/advanced-agent/src/analyzers/detectors.ts

import _ from 'lodash';
import { computeLocalRegression, findPeaks, calculateAutocorrelation } from './statistics';

export async function analyzeTrends(
  data: number[], 
  windowSize: number
): Promise<Array<{ 
  start: number; 
  end: number; 
  slope: number; 
  confidence: number;
}>> {
  const trends = [];
  const smoothed = data.map((_, i) => computeLocalRegression(data, windowSize, i));
  
  // Find trend segments using change point detection
  const changePoints = findTrendChangePoints(smoothed);
  
  // Analyze each segment
  for (let i = 0; i < changePoints.length - 1; i++) {
    const start = changePoints[i];
    const end = changePoints[i + 1];
    const segment = smoothed.slice(start, end);
    
    const trend = analyzeTrendSegment(segment);
    if (trend.confidence > 0.5) {
      trends.push({
        start,
        end,
        ...trend
      });
    }
  }
  
  return trends;
}

export async function analyzeSeasonality(
  data: number[]
): Promise<{
  period: number;
  strength: number;
  components: number[];
}> {
  // Detect primary seasonality using autocorrelation
  const acf = calculateAutocorrelation(data);
  const peaks = findPeaks(acf.map(a => a.coefficient));
  
  // Find the most significant period
  const period = peaks.length > 0 
    ? peaks[0].index 
    : 1;
  
  // Extract seasonal component
  const components = extractSeasonalComponent(data, period);
  
  // Calculate strength of seasonality
