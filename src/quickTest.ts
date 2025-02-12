// packages/advanced-agent/src/quickTest.ts

import { createAgent, PatternAnalyzer } from './index';

async function runQuickTest() {
  console.log('Starting quick test...');

  // Test agent creation
  const agent = createAgent("test-model");
  console.log('Agent created successfully');

  // Test pattern analysis
  const testData = Array.from({ length: 100 }, (_, i) => ({
    value: Math.sin(i / 10) + Math.random() * 0.1,
    timestamp: Date.now() + i * 1000
  }));

  const analyzer = new PatternAnalyzer(
    testData.map(d => d.value),
    testData.map(d => d.timestamp),
    { domain: 'financial' }
  );

  console.log('Running pattern analysis...');
  const analysis = await analyzer.analyzeHolistically();
  
  console.log('\nAnalysis Results:');
  console.log('- Trends detected:', analysis.timeSeries.trends.length);
  console.log('- Patterns found:', analysis.patterns?.length || 0);
  console.log('- Overall confidence:', analysis.metadata.confidence);
  
  // Test agent processing
  console.log('\nTesting agent processing...');
  await agent.start();
  
  const contextId = 'quick-test';
  await agent.send(contextId, {
    type: 'message',
    data: {
      content: 'Analyze this data',
      metadata: { data: testData }
    }
  });

  const memory = await agent.memory.get(contextId);
  console.log('- Outputs generated:', memory.outputs.length);
  console.log('- Thoughts recorded:', memory.thoughts.length);

  console.log('\nQuick test completed successfully!');
}

runQuickTest().catch(console.error);
