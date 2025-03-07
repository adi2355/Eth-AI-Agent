import type { RobustAnalysis } from '@/lib/agents/types';

export interface ConversationTopic {
  name: string;
  confidence: number;
  lastDiscussed: number;
  relatedTokens: string[];
}

export interface ConversationMemory {
  topics: ConversationTopic[];
  userPreferences: {
    favoriteTokens?: string[];
    riskTolerance?: 'low' | 'medium' | 'high';
    investmentGoals?: string[];
  };
  lastInteraction: number;
}

export interface ConversationContext {
  sessionId: string;
  memory: ConversationMemory;
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  currentTopic?: string;
}