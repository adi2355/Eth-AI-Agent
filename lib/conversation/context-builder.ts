import { ChatMessage, ConversationStore } from '../conversation-store';
import { RobustAnalysis, IntentType } from '../agents/types';

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

export function buildEnhancedContext(
  sessionId: string,
  currentAnalysis: RobustAnalysis,
  maxMessages = 5
): EnhancedContext {
  // Get conversation summary
  const summary = ConversationStore.getConversationSummary(sessionId);
  const recentMessages = ConversationStore.getRecentContext(sessionId, maxMessages);
  const prefs = ConversationStore.getUserPreferences(sessionId);

  // Find related topics from history
  const relatedTopics = ConversationStore.getTopics(sessionId)
    .filter(topic => {
      // Topic is related if it:
      // 1. Shares tokens with current query
      // 2. Has the same intent
      // 3. Was recently discussed
      const hasSharedTokens = topic.relatedTokens.some(token => 
        currentAnalysis.queryAnalysis.detectedTokens.includes(token)
      );
      
      const hasSameIntent = topic.name === currentAnalysis.classification.primaryIntent;
      
      const isRecent = (Date.now() - topic.lastMentioned) < (30 * 60 * 1000); // 30 minutes
      
      return hasSharedTokens || hasSameIntent || isRecent;
    })
    .map(topic => topic.name);

  return {
    recentMessages,
    userPreferences: {
      favoriteTokens: Array.from(prefs.favoriteTokens.keys()),
      technicalLevel: prefs.technicalLevel,
      interests: Array.from(prefs.interests)
    },
    conversationMetrics: {
      continuityScore: summary.continuityScore,
      dominantTopics: summary.dominantTopics,
      messageCount: summary.messageCount
    },
    currentQuery: {
      analysis: currentAnalysis,
      relatedTopics,
      detectedTokens: currentAnalysis.queryAnalysis.detectedTokens
    }
  };
}

export function formatContextForPrompt(context: EnhancedContext): string {
  const sections: string[] = [];

  // Format conversation history
  if (context.recentMessages.length > 0) {
    sections.push('Recent Conversation:\n' + context.recentMessages
      .map(msg => {
        const tokens = msg.metadata?.tokens?.join(', ') || '';
        const intent = msg.metadata?.intent || '';
        return `${msg.role.toUpperCase()}: ${msg.content}\n[tokens: ${tokens}, intent: ${intent}]`;
      })
      .join('\n\n')
    );
  }

  // Format user preferences
  sections.push('User Context:\n' + JSON.stringify({
    technicalLevel: context.userPreferences.technicalLevel,
    interests: context.userPreferences.interests,
    favoriteTokens: context.userPreferences.favoriteTokens
  }, null, 2));

  // Format conversation metrics
  sections.push('Conversation Metrics:\n' + JSON.stringify({
    messageCount: context.conversationMetrics.messageCount,
    continuityScore: context.conversationMetrics.continuityScore.toFixed(2),
    dominantTopics: context.conversationMetrics.dominantTopics
  }, null, 2));

  // Format current query information
  sections.push('Current Query Context:\n' + JSON.stringify({
    intent: context.currentQuery.analysis.classification.primaryIntent,
    confidence: context.currentQuery.analysis.classification.confidence.toFixed(2),
    detectedTokens: context.currentQuery.detectedTokens,
    relatedTopics: context.currentQuery.relatedTopics,
    timeContext: context.currentQuery.analysis.queryAnalysis.timeContext,
    marketIndicators: context.currentQuery.analysis.queryAnalysis.marketIndicators,
    conceptualIndicators: context.currentQuery.analysis.queryAnalysis.conceptualIndicators
  }, null, 2));

  return sections.join('\n\n');
}

export function analyzeContextContinuity(context: EnhancedContext): {
  isCoherent: boolean;
  confidence: number;
  suggestedFollowUp?: string;
} {
  const continuityScore = context.conversationMetrics.continuityScore;
  const currentIntent = context.currentQuery.analysis.classification.primaryIntent;
  const recentIntents = context.recentMessages
    .filter(msg => msg.metadata?.intent)
    .map(msg => msg.metadata!.intent);

  // Check if current query follows conversation flow
  const isRelatedToRecent = recentIntents.includes(currentIntent) ||
    context.currentQuery.relatedTopics.some(topic => 
      recentIntents.includes(topic as IntentType)
    );

  // Calculate confidence based on multiple factors
  const intentConfidence = context.currentQuery.analysis.classification.confidence;
  const topicRelevance = isRelatedToRecent ? 1 : 0.5;
  const overallConfidence = (continuityScore * 0.3 + intentConfidence * 0.4 + topicRelevance * 0.3);

  // Generate follow-up suggestion if conversation seems disconnected
  let suggestedFollowUp: string | undefined;
  if (!isRelatedToRecent && context.recentMessages.length > 0) {
    const lastTopic = recentIntents[recentIntents.length - 1];
    suggestedFollowUp = `Would you like to know how this relates to our previous discussion about ${lastTopic?.toLowerCase()}?`;
  }

  return {
    isCoherent: continuityScore > 0.7 && isRelatedToRecent,
    confidence: overallConfidence,
    suggestedFollowUp
  };
}

export function predictNextTopics(context: EnhancedContext): string[] {
  const currentIntent = context.currentQuery.analysis.classification.primaryIntent;
  const suggestions: string[] = [];

  // Add suggestions based on current intent
  switch (currentIntent) {
    case 'MARKET_DATA':
      suggestions.push(
        'price trends',
        'market comparison',
        'volume analysis'
      );
      break;
    case 'TECHNICAL':
      suggestions.push(
        'security implications',
        'implementation details',
        'best practices'
      );
      break;
    case 'DEFI':
      suggestions.push(
        'yield strategies',
        'liquidity analysis',
        'protocol comparison'
      );
      break;
    case 'REGULATORY':
      suggestions.push(
        'compliance requirements',
        'jurisdictional analysis',
        'risk assessment'
      );
      break;
    case 'SECURITY':
      suggestions.push(
        'audit findings',
        'security measures',
        'risk mitigation'
      );
      break;
    case 'NEWS_EVENTS':
      suggestions.push(
        'market impact',
        'related developments',
        'future implications'
      );
      break;
    default:
      suggestions.push(
        'market overview',
        'technical details',
        'latest updates'
      );
  }

  // Add suggestions based on user preferences
  if (context.userPreferences.technicalLevel === 'advanced') {
    suggestions.push(
      'technical deep dive',
      'architecture analysis',
      'security audit'
    );
  }

  // Add token-specific suggestions
  context.userPreferences.favoriteTokens.slice(0, 2).forEach(token => {
    suggestions.push(`${token} analysis`, `${token} performance`);
  });

  // Return top 5 unique suggestions
  return Array.from(new Set(suggestions)).slice(0, 5);
}