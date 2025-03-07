import { z } from 'zod';
import type { RobustAnalysis } from './types';

// Custom error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public details?: z.ZodError
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class PreprocessingError extends Error {
  constructor(
    message: string,
    public step: string,
    public input?: string
  ) {
    super(message);
    this.name = 'PreprocessingError';
  }
}

export class LLMError extends Error {
  constructor(
    message: string,
    public response?: any
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// Validation schemas
const classificationSchema = z.object({
  primaryIntent: z.enum([
    'MARKET_DATA',
    'COMPARISON',
    'TECHNICAL',
    'DEFI',
    'REGULATORY',
    'NEWS_EVENTS',
    'SECURITY',
    'CONCEPTUAL',
    'HYBRID',
    'NEEDS_CONTEXT'
  ] as const),
  confidence: z.number().min(0).max(1),
  needsApiCall: z.boolean(),
  ambiguityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'] as const),
  requiresWebSearch: z.boolean()
});

const comparisonRequestSchema = z.object({
  isComparison: z.boolean(),
  tokens: z.array(z.string()).max(5),
  aspects: z.array(z.string()),
  primaryMetric: z.string().nullable()
});

const webSearchContextSchema = z.object({
  needed: z.boolean(),
  reason: z.string().nullable(),
  suggestedQueries: z.array(z.string())
});

const queryAnalysisSchema = z.object({
  sanitizedQuery: z.string().min(1),
  detectedTokens: z.array(z.string()).max(5),
  comparisonRequest: comparisonRequestSchema,
  detectedIntents: z.array(z.string()),
  timeContext: z.enum(['current', '24h', '7d', '30d'] as const).nullable(),
  marketIndicators: z.array(z.string()),
  conceptualIndicators: z.array(z.string()),
  webSearchContext: webSearchContextSchema
});

const marketDataSchema = z.object({
  needed: z.boolean(),
  types: z.array(z.string()),
  timeframe: z.enum(['current', '24h', '7d', '30d'] as const).nullable(),
  tokenCount: z.number().min(0).max(5)
});

const conceptualDataSchema = z.object({
  needed: z.boolean(),
  aspects: z.array(z.string())
});

const dataRequirementsSchema = z.object({
  marketData: marketDataSchema,
  conceptualData: conceptualDataSchema
});

const preprocessingStepSchema = z.object({
  operation: z.string(),
  input: z.string(),
  output: z.string()
});

const queryMetadataSchema = z.object({
  tokens: z.array(z.string()),
  entities: z.array(z.string()),
  contextualHints: z.array(z.string())
});

const originalContextSchema = z.object({
  rawQuery: z.string(),
  timestamp: z.number(),
  preprocessingSteps: z.array(preprocessingStepSchema),
  metadata: queryMetadataSchema
});

const llmResponseSchema = z.object({
  classification: classificationSchema,
  queryAnalysis: queryAnalysisSchema,
  dataRequirements: dataRequirementsSchema
});

const robustAnalysisSchema = z.object({
  originalContext: originalContextSchema,
  classification: classificationSchema,
  queryAnalysis: queryAnalysisSchema,
  dataRequirements: dataRequirementsSchema
});

export function validateLLMResponse(response: string): any {
  try {
    const parsed = JSON.parse(response);
    return llmResponseSchema.parse(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new LLMError('Invalid JSON in LLM response', response);
    }
    if (error instanceof z.ZodError) {
      const details = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new LLMError(`Invalid response structure: ${details}`, response);
    }
    throw error;
  }
}

export function validateAnalysis(analysis: unknown): void {
  try {
    robustAnalysisSchema.parse(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        `Invalid analysis: ${firstError.message}`,
        firstError.path.join('.'),
        error
      );
    }
    throw error;
  }
}