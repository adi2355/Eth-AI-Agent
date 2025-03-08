import { z } from 'zod';
export declare class ValidationError extends Error {
    field: string;
    details?: z.ZodError;
    constructor(message: string, field: string, details?: z.ZodError);
}
export declare class PreprocessingError extends Error {
    step: string;
    input?: string;
    constructor(message: string, step: string, input?: string);
}
export declare class LLMError extends Error {
    response?: any;
    constructor(message: string, response?: any);
}
export declare function validateLLMResponse(response: string): any;
export declare function validateAnalysis(analysis: unknown): void;
