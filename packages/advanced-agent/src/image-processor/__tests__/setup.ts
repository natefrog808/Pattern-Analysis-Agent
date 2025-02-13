// packages/advanced-agent/src/image-processor/__tests__/setup.ts

import { jest } from '@jest/globals';
import { ImageProcessingManager } from '../manager';

// Mock setup
jest.mock('../processors', () => ({
  processors: {
    segmentation: {
      process: jest.fn(),
      validateInput: jest.fn()
    },
    textDetection: {
      process: jest.fn(),
      validateInput: jest.fn()
    },
    faceAnalysis: {
      process: jest.fn(),
      validateInput: jest.fn()
    }
  }
}));

// Test utilities
export const createTestImage = () => ({
  id: 'test-image',
  imageData: 'base64-mock-data',
  tasks: [
    {
      id: 'task-1',
      type: 'segmentation',
      goal: 'Test segmentation'
    }
  ]
});

export const createTestBatch = (count: number) => 
  Array.from({ length: count }, (_, i) => ({
    ...createTestImage(),
    id: `test-image-${i}`
  }));
