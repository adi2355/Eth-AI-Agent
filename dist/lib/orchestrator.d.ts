import { OrchestrationResult } from './agents';
export declare class AgentOrchestrator {
    constructor();
    private checkApiKeys;
    private withRetry;
    private handleProcessingError;
    processQuery(query: string, sessionId?: string): Promise<OrchestrationResult>;
    private generateSuggestions;
    private shuffleArray;
}
