// packages/advanced-agent/src/index.ts

export { 
  createAgent,
  agent,
  runAgent,
  checkAgentHealth,
  cleanupAgent
} from './agent';

export type { 
  Config,
  TimeSeriesData,
  AnalysisOptions
} from './types';

export { 
  PatternAnalyzer 
} from './analyzers/PatternAnalyzer';

export { 
  ultimateExpert 
} from './experts/ultimate';
