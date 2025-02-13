// packages/advanced-agent/src/image-processor/performance/index.ts

import { performance, PerformanceObserver } from 'perf_hooks';

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observer: PerformanceObserver;

  constructor() {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const existing = this.metrics.get(entry.name) || [];
        this.metrics.set(entry.name, [...existing, entry.duration]);
      });
    });

    this.observer.observe({ entryTypes: ['measure'] });
  }

  startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }

  endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }

  getMetrics(name: string) {
    const measurements = this.metrics.get(name) || [];
    return {
      average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      count: measurements.length
    };
  }

  getAllMetrics() {
    return Object.fromEntries(
      Array.from(this.metrics.entries()).map(([key, values]) => [
        key,
        this.getMetrics(key)
      ])
    );
  }

  clearMetrics() {
    this.metrics.clear();
  }
}
