import { ConversationContext } from '@/lib/types/conversation';
import { RobustAnalysis } from '@/lib/agents/types';
export declare class ConversationManager {
    private contexts;
    private readonly MAX_TOPICS;
    private readonly MAX_MESSAGES;
    private readonly CONTEXT_EXPIRY;
    constructor();
    private initializeContext;
    getContext(sessionId: string): ConversationContext;
    updateContext(sessionId: string, analysis: RobustAnalysis, response: string): void;
    private updateTopics;
    private updateUserPreferences;
    suggestNextTopics(sessionId: string): string[];
    private shuffleArray;
    cleanupExpiredContexts(): void;
}
