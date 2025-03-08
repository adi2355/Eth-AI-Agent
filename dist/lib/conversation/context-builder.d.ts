import { ChatMessage } from '../conversation-store';
import { RobustAnalysis } from '../agents/types';
export interface EnhancedContext {
    recentMessages: ChatMessage[];
    userPreferences: {
        favoriteTokens: string[];
        technicalLevel: string;
        interests: string[];
    };
    conversationMetrics: {
        continuityScore: number;
        dominantTopics: string[];
        messageCount: number;
    };
    currentQuery: {
        analysis: RobustAnalysis;
        relatedTopics: string[];
        detectedTokens: string[];
    };
}
export declare function buildEnhancedContext(sessionId: string, currentAnalysis: RobustAnalysis, maxMessages?: number): EnhancedContext;
export declare function formatContextForPrompt(context: EnhancedContext): string;
export declare function analyzeContextContinuity(context: EnhancedContext): {
    isCoherent: boolean;
    confidence: number;
    suggestedFollowUp?: string;
};
export declare function predictNextTopics(context: EnhancedContext): string[];
