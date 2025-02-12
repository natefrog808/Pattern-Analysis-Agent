// packages/advanced-agent/src/agent.ts

import { z } from 'zod';
import { createDreams, createMemoryStore, LogLevel, type Config } from 'daydreams';
import { expert, input, output, action } from './utils';
import { createContainer } from './container';
import { LRUCache } from 'lru-cache';
import { ultimateExpert } from './experts/ultimate';
import { MessageSchema, TimeSeriesSchema } from './types';

// Memory service configuration
const memoryService = {
  register: (container) => {
    container.singleton('memory', () => createMemoryStore());
  },
  boot: async (container) => {
    const store = container.resolve('memory');
    await store.clear();
  }
};

// Cache service configuration
const cacheService = {
  register: (container) => {
    container.singleton('cache', () => new LRUCache({
      max: 1000,
      maxAge: 1000 * 60 * 10 // 10 minutes
    }));
  }
};

// Analytics service configuration
const analyticsService = {
  register: (container) => {
    container.singleton('analytics', () => ({
      events: [] as any[],
      trackEvent: (event: string, data: any) => {
        const eventData = { event, data, timestamp: Date.now() };
        this.events.push(eventData);
        console.log(`[Analytics] ${event}:`, JSON.stringify(data, null, 2));
      }
    }));
  }
};

// Input handlers
const messageInput = input({
  schema: MessageSchema,
  handler: async (data, context, agent) => {
    const analytics = agent.container.resolve('analytics');
    analytics.trackEvent('message_received', { 
      contextId: context.id, 
      content: data.content 
    });

    context.memory.inputs.push({
      ref: 'input',
      type: 'message',
      data: data,
      timestamp: Date.now()
    });
    return true;
  }
});

// Output handlers
const messageOutput = output({
  description: 'Send a message response',
  schema: MessageSchema,
  handler: async (data, context, agent) => {
    const analytics = agent.container.resolve('analytics');
    context.memory.outputs.push({
      ref: 'output',
      type: 'message',
      data: data,
      timestamp: Date.now()
    });
    analytics.trackEvent('message_sent', { 
      contextId: context.id, 
      content: data.content 
    });
    return true;
  }
});

// Create base agent configuration
const createAgentConfig = (model: string): Config => ({
  memory: createMemoryStore(),
  model,
  logger: LogLevel.DEBUG,
  container: createContainer(),
  
  // Register core services
  services: [
    memoryService,
    analyticsService,
    cacheService
  ],

  // Register input/output handlers
  inputs: {
    message: messageInput
  },
  outputs: {
    message: messageOutput
  },

  // Register experts
  experts: {
    ultimate: ultimateExpert
  },

  // Context configuration
  context: createContextHandler(
    (contextId) => ({
      inputs: [],
      outputs: [],
      thoughts: [],
      calls: [],
      results: [],
      metadata: {
        created: Date.now(),
        lastUpdated: Date.now()
      }
    }),
    (memory) => {
      return [
        ...memory.inputs.map(formatInput),
        ...memory.outputs.map(formatOutput),
        ...memory.thoughts.map(formatThought)
      ].join('\n');
    }
  )
});

// Create agent instance
export const createAgent = (model: string) => {
  const config = createAgentConfig(model);
  return createDreams(config);
};

// Create default agent
export const agent = createAgent("your-model");

// Error wrapper for agent execution
export async function runAgent(contextId: string) {
  const analytics = agent.container.resolve('analytics');
  const startTime = Date.now();
  
  try {
    await agent.start();
    await agent.run(contextId);
    
    analytics.trackEvent('agent_run_complete', {
      contextId,
      duration: Date.now() - startTime
    });
  } catch (error) {
    analytics.trackEvent('agent_run_error', {
      contextId,
      error: error.message,
      duration: Date.now() - startTime
    });
    throw error;
  } finally {
    const events = analytics.getEvents();
    console.log(`Agent run completed with ${events.length} events logged`);
  }
}

// Export helper functions
export const checkAgentHealth = async () => {
  const analytics = agent.container.resolve('analytics');
  const memory = agent.container.resolve('memory');
  const cache = agent.container.resolve('cache');

  return {
    analytics: analytics.events.length,
    memory: await memory.get('health-check'),
    cache: cache.length,
    status: 'healthy'
  };
};

export const cleanupAgent = async () => {
  const memory = agent.container.resolve('memory');
  const cache = agent.container.resolve('cache');

  await memory.clear();
  cache.clear();
};
