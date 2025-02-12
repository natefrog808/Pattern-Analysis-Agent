// packages/advanced-agent/src/analyzers/statistics.ts

import _ from 'lodash';

export function computeLocalRegression(
  data: number[], 
  window: number, 
  index: number
): number {
  const start = Math.max(0, index - Math.floor(window / 2));
  const end = Math.min(data.length, index + Math.floor(window / 2) + 1);
  const slice = data.slice(start, end);
  
  const weights = generateWeights(slice.length, 'tricube');
  const weightedSum = _.sum(slice.map((v, i) => v * weights[i]));
  const weightSum = _.sum(weights);
  
  return weightedSum / weightSum;
}

export function findPeaks(
  data: number[], 
  minProminence = 0.1
): Array<{ index: number; value: number; prominence: number }> {
  const peaks = [];
  
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
      const prominence = calculateProminence(data, i);
      if (prominence >= minProminence) {
        peaks.push({ index: i, value: data[i], prominence });
      }
    }
  }
  
  return peaks;
}

export function calculateAutocorrelation(
  data: number[], 
  maxLag = 20
): Array<{ lag: number; coefficient: number; significance: number }> {
  const mean = _.mean(data);
  const variance = _.variance(data);
  const n = data.length;
  
  return _.range(1, maxLag + 1).map(lag => {
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < n - lag; i++) {
      sum += (data[i] - mean) * (data[i + lag] - mean);
      count++;
    }
    
    const coefficient = sum / (count * variance);
    const significance = calculateSignificance(coefficient, count);
    
    return { lag, coefficient, significance };
  });
}

// Helper functions
function generateWeights(length: number, type: 'tricube' | 'gaussian' = 'tricube'): number[] {
  if (type === 'tricube') {
    return Array.from({ length }, (_, i) => {
      const x = Math.abs(2 * i / (length - 1) - 1);
      return x <= 1 ? Math.pow(1 - Math.pow(x, 3), 3) : 0;
    });
  } else {
    return Array.from({ length }, (_, i) => {
      const x = 2 * i / (length - 1) - 1;
      return Math.exp(-Math.pow(x, 2) / 0.5);
    });
  }
}

function calculateProminence(data: number[], peakIndex: number): number {
  let leftMin = data[peakIndex];
  let rightMin = data[peakIndex];
  
  // Find minimum on left side
  for (let i = peakIndex - 1; i >= 0; i--) {
    if (data[i] > data[peakIndex]) break;
    leftMin = Math.min(leftMin, data[i]);
  }
  
  // Find minimum on right side
  for (let i = peakIndex + 1; i < data.length; i++) {
    if (data[i] > data[peakIndex]) break;
    rightMin = Math.min(rightMin, data[i]);
  }
  
  return data[peakIndex] - Math.max(leftMin, rightMin);
}

function calculateSignificance(coefficient: number, n: number): number {
  const tStatistic = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
  return 2 * (1 - normalCDF(Math.abs(tStatistic)));
}

function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
