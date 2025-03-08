import { IntentType } from './agents/types';
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    metadata?: {
        tokens?: string[];
        intent?: IntentType;
        confidence?: number;
        topics?: string[];
        entities?: string[];
        contextualHints?: string[];
        followUp?: boolean;
        referenceMessageId?: string;
        contextConfidence?: number;
    };
    id: string;
}
export interface TopicMetadata {
    name: string;
    frequency: number;
    lastMentioned: number;
    relatedTokens: string[];
    confidence: number;
}
export interface UserPreferences {
    favoriteTokens: Map<string, number>;
    preferredTimeframes: Set<string>;
    interests: Set<string>;
    technicalLevel: 'basic' | 'intermediate' | 'advanced';
    lastUpdated: number;
}
export interface ConversationMetadata {
    lastActive: number;
    messageCount: number;
    topics: Map<string, TopicMetadata>;
    userPreferences: UserPreferences;
    continuityScore: number;
}
export declare class ConversationStore {
    private static conversations;
    private static metadata;
    private static readonly MAX_MESSAGES;
    private static readonly EXPIRY_TIME;
    private static readonly TOPIC_RELEVANCE_DECAY;
    static getMessages(sessionId: string): ChatMessage[];
    static addMessage(sessionId: string, message: Omit<ChatMessage, 'id'>): void;
    private static updateTopicMetadata;
    private static updateUserPreferences;
    private static updateContinuityScore;
    static truncate(sessionId: string, maxMessages?: number): void;
    static getMetadata(sessionId: string): ConversationMetadata;
    static createSession(): string;
    static cleanExpiredSessions(): void;
    static getRecentContext(sessionId: string, maxMessages?: number): ChatMessage[];
    static getTopics(sessionId: string): TopicMetadata[];
    static getUserPreferences(sessionId: string): UserPreferences;
    static getFavoriteTokens(sessionId: string, limit?: number): string[];
    static getConversationSummary(sessionId: string): {
        messageCount: number;
        continuityScore: number;
        dominantTopics: string[];
        userLevel: string;
        favoriteTokens: string[];
    };
}
