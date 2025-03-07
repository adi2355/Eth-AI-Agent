import { v4 as uuidv4 } from 'uuid';
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
  favoriteTokens: Map<string, number>; // token -> frequency
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
  continuityScore: number; // Measure of conversation coherence
}

export class ConversationStore {
  private static conversations = new Map<string, ChatMessage[]>();
  private static metadata = new Map<string, ConversationMetadata>();
  private static readonly MAX_MESSAGES = 50; // Increased from 20
  private static readonly EXPIRY_TIME = 24 * 60 * 60 * 1000; // Extended to 24 hours
  private static readonly TOPIC_RELEVANCE_DECAY = 0.8; // Topic relevance decay factor

  static getMessages(sessionId: string): ChatMessage[] {
    this.cleanExpiredSessions();
    return this.conversations.get(sessionId) || [];
  }

  static addMessage(sessionId: string, message: Omit<ChatMessage, 'id'>): void {
    const convo = this.getMessages(sessionId);
    const messageWithId: ChatMessage = {
      ...message,
      id: uuidv4(),
      timestamp: message.timestamp || Date.now()
    };

    convo.push(messageWithId);

    // Update metadata
    const metadata = this.getMetadata(sessionId);
    metadata.lastActive = Date.now();
    metadata.messageCount++;

    // Update topic metadata
    if (message.metadata?.intent) {
      this.updateTopicMetadata(metadata, message);
    }

    // Update user preferences
    if (message.metadata?.tokens) {
      this.updateUserPreferences(metadata, message);
    }

    // Calculate conversation continuity
    this.updateContinuityScore(metadata, convo);

    this.metadata.set(sessionId, metadata);
    this.truncate(sessionId);
    this.conversations.set(sessionId, convo);
  }

  private static updateTopicMetadata(metadata: ConversationMetadata, message: Omit<ChatMessage, 'id'>): void {
    const { intent, tokens = [], confidence = 0 } = message.metadata!;
    const topics = metadata.topics;
    
    if (!topics.has(intent!)) {
      topics.set(intent!, {
        name: intent!,
        frequency: 1,
        lastMentioned: message.timestamp,
        relatedTokens: tokens,
        confidence
      });
    } else {
      const topic = topics.get(intent!)!;
      topic.frequency++;
      topic.lastMentioned = message.timestamp;
      topic.relatedTokens = Array.from(new Set([...topic.relatedTokens, ...tokens]));
      topic.confidence = Math.max(topic.confidence, confidence);
    }
  }

  private static updateUserPreferences(metadata: ConversationMetadata, message: Omit<ChatMessage, 'id'>): void {
    const { tokens = [], contextualHints = [] } = message.metadata!;
    const prefs = metadata.userPreferences;

    // Update token frequencies
    tokens.forEach(token => {
      prefs.favoriteTokens.set(token, (prefs.favoriteTokens.get(token) || 0) + 1);
    });

    // Update interests based on contextual hints
    contextualHints.forEach(hint => prefs.interests.add(hint));

    // Infer technical level
    if (contextualHints.includes('TECHNICAL') || contextualHints.includes('CODE')) {
      prefs.technicalLevel = 'advanced';
    } else if (contextualHints.includes('INTERMEDIATE')) {
      prefs.technicalLevel = 'intermediate';
    }

    prefs.lastUpdated = message.timestamp;
  }

  private static updateContinuityScore(metadata: ConversationMetadata, messages: ChatMessage[]): void {
    if (messages.length < 2) {
      metadata.continuityScore = 1;
      return;
    }

    // Calculate continuity based on:
    // 1. Time between messages
    // 2. Topic consistency
    // 3. Token overlap
    let totalScore = 0;
    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];
      
      // Time factor (decay over time)
      const timeDiff = current.timestamp - previous.timestamp;
      const timeFactor = Math.exp(-timeDiff / (30 * 60 * 1000)); // 30 minute half-life

      // Topic consistency
      const topicFactor = current.metadata?.intent === previous.metadata?.intent ? 1 : 0.5;

      // Token overlap
      const currentTokens = new Set(current.metadata?.tokens || []);
      const previousTokens = new Set(previous.metadata?.tokens || []);
      const overlap = new Set([...currentTokens].filter(x => previousTokens.has(x)));
      const tokenFactor = overlap.size > 0 ? 1 : 0.7;

      totalScore += (timeFactor + topicFactor + tokenFactor) / 3;
    }

    metadata.continuityScore = totalScore / (messages.length - 1);
  }

  static truncate(sessionId: string, maxMessages = this.MAX_MESSAGES): void {
    const convo = this.getMessages(sessionId);
    if (convo.length > maxMessages) {
      // Keep system messages and recent messages
      const systemMessages = convo.filter(m => m.role === 'system');
      const recentMessages = convo.slice(-maxMessages + systemMessages.length);
      const truncated = [...systemMessages, ...recentMessages];
      
      this.conversations.set(sessionId, truncated);
      
      // Update metadata
      const metadata = this.getMetadata(sessionId);
      metadata.messageCount = truncated.length;
      this.metadata.set(sessionId, metadata);
    }
  }

  static getMetadata(sessionId: string): ConversationMetadata {
    if (!this.metadata.has(sessionId)) {
      this.metadata.set(sessionId, {
        lastActive: Date.now(),
        messageCount: 0,
        topics: new Map(),
        userPreferences: {
          favoriteTokens: new Map(),
          preferredTimeframes: new Set(),
          interests: new Set(),
          technicalLevel: 'basic',
          lastUpdated: Date.now()
        },
        continuityScore: 1
      });
    }
    return this.metadata.get(sessionId)!;
  }

  static createSession(): string {
    const sessionId = uuidv4();
    this.conversations.set(sessionId, []);
    this.metadata.set(sessionId, this.getMetadata(sessionId));
    return sessionId;
  }

  static cleanExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, metadata] of this.metadata.entries()) {
      if (now - metadata.lastActive > this.EXPIRY_TIME) {
        this.conversations.delete(sessionId);
        this.metadata.delete(sessionId);
      }
    }
  }

  static getRecentContext(sessionId: string, maxMessages = 5): ChatMessage[] {
    const messages = this.getMessages(sessionId);
    const metadata = this.getMetadata(sessionId);
    
    // Apply topic relevance decay
    const now = Date.now();
    metadata.topics.forEach((topic, key) => {
      const age = (now - topic.lastMentioned) / (60 * 60 * 1000); // Hours
      const relevance = Math.pow(this.TOPIC_RELEVANCE_DECAY, age);
      if (relevance < 0.1) {
        metadata.topics.delete(key);
      }
    });

    // Get messages with high continuity
    return messages
      .slice(-maxMessages)
      .filter(msg => {
        // Keep messages that:
        // 1. Are recent (< 1 hour old)
        // 2. Share topics with current conversation
        // 3. Have overlapping tokens with recent messages
        const age = (now - msg.timestamp) / (60 * 60 * 1000);
        if (age < 1) return true;
        
        const hasRelevantTopic = msg.metadata?.intent && 
          metadata.topics.has(msg.metadata.intent);
        
        const hasTokenOverlap = msg.metadata?.tokens?.some(token => 
          metadata.userPreferences.favoriteTokens.has(token));
        
        return hasRelevantTopic || hasTokenOverlap;
      });
  }

  static getTopics(sessionId: string): TopicMetadata[] {
    const metadata = this.getMetadata(sessionId);
    return Array.from(metadata.topics.values())
      .sort((a, b) => b.lastMentioned - a.lastMentioned);
  }

  static getUserPreferences(sessionId: string): UserPreferences {
    return this.getMetadata(sessionId).userPreferences;
  }

  static getFavoriteTokens(sessionId: string, limit = 5): string[] {
    const prefs = this.getUserPreferences(sessionId);
    return Array.from(prefs.favoriteTokens.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([token]) => token);
  }

  static getConversationSummary(sessionId: string): {
    messageCount: number;
    continuityScore: number;
    dominantTopics: string[];
    userLevel: string;
    favoriteTokens: string[];
  } {
    const metadata = this.getMetadata(sessionId);
    const topics = Array.from(metadata.topics.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)
      .map(t => t.name);

    return {
      messageCount: metadata.messageCount,
      continuityScore: metadata.continuityScore,
      dominantTopics: topics,
      userLevel: metadata.userPreferences.technicalLevel,
      favoriteTokens: this.getFavoriteTokens(sessionId)
    };
  }
}