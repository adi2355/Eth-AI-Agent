"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMError = exports.PreprocessingError = exports.ValidationError = void 0;
exports.validateLLMResponse = validateLLMResponse;
exports.validateAnalysis = validateAnalysis;
const zod_1 = require("zod");
// Custom error types
class ValidationError extends Error {
    constructor(message, field, details) {
        super(message);
        this.field = field;
        this.details = details;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class PreprocessingError extends Error {
    constructor(message, step, input) {
        super(message);
        this.step = step;
        this.input = input;
        this.name = 'PreprocessingError';
    }
}
exports.PreprocessingError = PreprocessingError;
class LLMError extends Error {
    constructor(message, response) {
        super(message);
        this.response = response;
        this.name = 'LLMError';
    }
}
exports.LLMError = LLMError;
// Validation schemas
const classificationSchema = zod_1.z.object({
    primaryIntent: zod_1.z.enum([
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
    ]),
    confidence: zod_1.z.number().min(0).max(1),
    needsApiCall: zod_1.z.boolean(),
    ambiguityLevel: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']),
    requiresWebSearch: zod_1.z.boolean()
});
const comparisonRequestSchema = zod_1.z.object({
    isComparison: zod_1.z.boolean(),
    tokens: zod_1.z.array(zod_1.z.string()).max(5),
    aspects: zod_1.z.array(zod_1.z.string()),
    primaryMetric: zod_1.z.string().nullable()
});
const webSearchContextSchema = zod_1.z.object({
    needed: zod_1.z.boolean(),
    reason: zod_1.z.string().nullable(),
    suggestedQueries: zod_1.z.array(zod_1.z.string())
});
const queryAnalysisSchema = zod_1.z.object({
    sanitizedQuery: zod_1.z.string().min(1),
    detectedTokens: zod_1.z.array(zod_1.z.string()).max(5),
    comparisonRequest: comparisonRequestSchema,
    detectedIntents: zod_1.z.array(zod_1.z.string()),
    timeContext: zod_1.z.enum(['current', '24h', '7d', '30d']).nullable(),
    marketIndicators: zod_1.z.array(zod_1.z.string()),
    conceptualIndicators: zod_1.z.array(zod_1.z.string()),
    webSearchContext: webSearchContextSchema
});
const marketDataSchema = zod_1.z.object({
    needed: zod_1.z.boolean(),
    types: zod_1.z.array(zod_1.z.string()),
    timeframe: zod_1.z.enum(['current', '24h', '7d', '30d']).nullable(),
    tokenCount: zod_1.z.number().min(0).max(5)
});
const conceptualDataSchema = zod_1.z.object({
    needed: zod_1.z.boolean(),
    aspects: zod_1.z.array(zod_1.z.string())
});
const dataRequirementsSchema = zod_1.z.object({
    marketData: marketDataSchema,
    conceptualData: conceptualDataSchema
});
const preprocessingStepSchema = zod_1.z.object({
    operation: zod_1.z.string(),
    input: zod_1.z.string(),
    output: zod_1.z.string()
});
const queryMetadataSchema = zod_1.z.object({
    tokens: zod_1.z.array(zod_1.z.string()),
    entities: zod_1.z.array(zod_1.z.string()),
    contextualHints: zod_1.z.array(zod_1.z.string())
});
const originalContextSchema = zod_1.z.object({
    rawQuery: zod_1.z.string(),
    timestamp: zod_1.z.number(),
    preprocessingSteps: zod_1.z.array(preprocessingStepSchema),
    metadata: queryMetadataSchema
});
const llmResponseSchema = zod_1.z.object({
    classification: classificationSchema,
    queryAnalysis: queryAnalysisSchema,
    dataRequirements: dataRequirementsSchema
});
const robustAnalysisSchema = zod_1.z.object({
    originalContext: originalContextSchema,
    classification: classificationSchema,
    queryAnalysis: queryAnalysisSchema,
    dataRequirements: dataRequirementsSchema
});
function validateLLMResponse(response) {
    try {
        const parsed = JSON.parse(response);
        return llmResponseSchema.parse(parsed);
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            throw new LLMError('Invalid JSON in LLM response', response);
        }
        if (error instanceof zod_1.z.ZodError) {
            const details = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new LLMError(`Invalid response structure: ${details}`, response);
        }
        throw error;
    }
}
function validateAnalysis(analysis) {
    try {
        robustAnalysisSchema.parse(analysis);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const firstError = error.errors[0];
            throw new ValidationError(`Invalid analysis: ${firstError.message}`, firstError.path.join('.'), error);
        }
        throw error;
    }
}
