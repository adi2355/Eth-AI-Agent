import { ChatMessage } from '../conversation-store';
export interface ConversationContext {
    recentMessages: ChatMessage[];
    topics: string[];
    userPreferences?: {
        favoriteTokens?: string[];
        preferredTimeframes?: string[];
    };
}
export declare function buildContext(messages: ChatMessage[]): ConversationContext;
