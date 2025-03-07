import { ChatMessage } from '../conversation-store';

export interface ConversationContext {
  recentMessages: ChatMessage[];
  topics: string[];
  userPreferences?: {
    favoriteTokens?: string[];
    preferredTimeframes?: string[];
  };
}

export function buildContext(messages: ChatMessage[]): ConversationContext {
  const topics = new Set<string>();
  const favoriteTokens = new Set<string>();
  const preferredTimeframes = new Set<string>();

  messages.forEach(msg => {
    if (msg.metadata?.intent) {
      topics.add(msg.metadata.intent);
    }
    if (msg.metadata?.tokens) {
      msg.metadata.tokens.forEach(token => favoriteTokens.add(token));
    }
  });

  return {
    recentMessages: messages.slice(-5),
    topics: Array.from(topics),
    userPreferences: {
      favoriteTokens: Array.from(favoriteTokens),
      preferredTimeframes: Array.from(preferredTimeframes)
    }
  };
}