import { RobustAnalysis, AggregatorSpec } from './types';
export declare function buildAggregatorCalls(analysis: RobustAnalysis): Promise<AggregatorSpec>;
export declare function executeAggregatorCalls(spec: AggregatorSpec): Promise<Record<string, any>>;
