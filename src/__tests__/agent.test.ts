// packages/advanced-agent/src/__tests__/agent.test.ts

import { describe, test, expect } from 'bun:test';
import { 
  createAgent,
  PatternAnalyzer,
  type TimeSeriesData,
  type HolisticAnalysis
} from '../index';

describe('Agent Initialization', () => {
  test('creates agent successfully', () => {
    const agent = createAgent("test-model");
    expect(agent).toBeDefined();
    expect(agent.container).toBeDefined();
    expect(agent.memory).toBeDefined();
  });

  test('initializes services', async () => {
    const agent = createAgent("test-model");
    await agent.start();
    
    const analytics = agent.container.resolve('analytics');
    const cache = agent.container.resolve('cache');
    
    expect(analytics).toBeDefined();
    expect(cache).toBeDefined();
  });
});

describe('Pattern Analysis', () => {
  const testData = generateTestData();

  test('analyzes time series data', async () => {
    const analyzer = new PatternAnalyzer(
      testData.map(d => d.value),
      testData.map(d => d.timestamp)
    );

    const analysis = await analyzer.analyzeHolistically();
    
    expect(analysis).toBeDefined();
    expect(analysis.timeSeries).toBeDefined();
    expect(analysis.statistics).toBeDefined();
    expect(analysis.metadata).toBeDefined();
  });

  test('detects patterns correctly', async () => {
    const trendData = generateTrendData();
    const analyzer = new PatternAnalyzer(
      trendData.map(d => d.value),
      trendData.map(d => d.timestamp),
      { domain: 'financial' }
    );

    const analysis = await analyzer.analyzeHolistically();
    
    expect(analysis.timeSeries.trends).toBeDefined();
    expect(analysis.timeSeries.trends.length).toBeGreaterThan(0);
    expect(analysis.timeSeries.trends[0].confidence).toBeGreaterThan(0.5);
  });
});

describe('End-to-End Analysis', () => {
  test('processes financial data', async () => {
    const agent = createAgent("test-model");
    await agent.start();

    const contextId = 'test-analysis';
    const data = generateFinancialData();

    await agent.send(contextId, {
      type: 'message',
      data: {
        content: 'Analyze this data',
        metadata: { data }
      }
    });

    const memory = await agent.memory.get(contextId);
    expect(memory.outputs.length).toBeGreaterThan(0);
    expect(memory.thoughts.length).toBeGreaterThan(0);
  });
});

// Test Helpers
function generateTestData(): TimeSeriesData[] {
  return Array.from({ length: 100 }, (_, i) => ({
    value: Math.sin(i / 10) + Math.random() * 0.1,
    timestamp: Date.now() + i * 1000,
    metadata: {}
  }));
}

function generateTrendData(): TimeSeriesData[] {
  return Array.from({ length: 100 }, (_, i) => ({
    value: i * 0.1 + Math.random() * 0.05,
    timestamp: Date.now() + i * 1000,
    metadata: {}
  }));
}

function generateFinancialData(): TimeSeriesData[] {
  return Array.from({ length: 100 }, (_, i) => ({
    value: 100 + i * 0.5 + Math.random() * 2 - 1,
    timestamp: Date.now() + i * 1000,
    metadata: {
      type: 'stock_price',
      symbol: 'TEST'
    }
  }));
}
