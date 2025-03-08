"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationManager = void 0;
class ConversationManager {
    constructor() {
        this.MAX_TOPICS = 5;
        this.MAX_MESSAGES = 10;
        this.CONTEXT_EXPIRY = 30 * 60 * 1000; // 30 minutes
        this.contexts = new Map();
        // Set up periodic cleanup
        setInterval(() => this.cleanupExpiredContexts(), 5 * 60 * 1000); // Every 5 minutes
    }
    initializeContext(sessionId) {
        return {
            sessionId,
            memory: {
                topics: [],
                userPreferences: {},
                lastInteraction: Date.now()
            },
            recentMessages: [],
        };
    }
    getContext(sessionId) {
        let context = this.contexts.get(sessionId);
        if (!context) {
            context = this.initializeContext(sessionId);
            this.contexts.set(sessionId, context);
        }
        // Update last interaction time
        context.memory.lastInteraction = Date.now();
        return context;
    }
    updateContext(sessionId, analysis, response) {
        const context = this.getContext(sessionId);
        // Update messages
        context.recentMessages.push({
            role: 'user',
            content: analysis.originalContext.rawQuery,
            timestamp: Date.now()
        });
        context.recentMessages.push({
            role: 'assistant',
            content: response,
            timestamp: Date.now()
        });
        // Trim messages to keep only recent ones
        if (context.recentMessages.length > this.MAX_MESSAGES) {
            context.recentMessages = context.recentMessages.slice(-this.MAX_MESSAGES);
        }
        // Update topics based on analysis
        this.updateTopics(context, analysis);
        // Update user preferences if detected
        this.updateUserPreferences(context, analysis);
        // Set current topic
        context.currentTopic = analysis.classification.primaryIntent;
        this.contexts.set(sessionId, context);
    }
    updateTopics(context, analysis) {
        const newTopic = {
            name: analysis.classification.primaryIntent,
            confidence: analysis.classification.confidence,
            lastDiscussed: Date.now(),
            relatedTokens: analysis.queryAnalysis.detectedTokens
        };
        const existingTopicIndex = context.memory.topics.findIndex(t => t.name === newTopic.name);
        if (existingTopicIndex !== -1) {
            // Update existing topic
            context.memory.topics[existingTopicIndex] = {
                ...context.memory.topics[existingTopicIndex],
                lastDiscussed: Date.now(),
                confidence: Math.max(context.memory.topics[existingTopicIndex].confidence, newTopic.confidence),
                relatedTokens: Array.from(new Set([
                    ...context.memory.topics[existingTopicIndex].relatedTokens,
                    ...newTopic.relatedTokens
                ]))
            };
        }
        else {
            // Add new topic
            context.memory.topics.push(newTopic);
        }
        // Keep only recent topics, sorted by last discussed
        context.memory.topics = context.memory.topics
            .sort((a, b) => b.lastDiscussed - a.lastDiscussed)
            .slice(0, this.MAX_TOPICS);
    }
    updateUserPreferences(context, analysis) {
        const prefs = context.memory.userPreferences;
        // Update favorite tokens
        if (analysis.queryAnalysis.detectedTokens.length > 0) {
            const tokenFrequency = new Map();
            // Count token frequency
            analysis.queryAnalysis.detectedTokens.forEach(token => {
                tokenFrequency.set(token, (tokenFrequency.get(token) || 0) + 1);
            });
            // Update favorites based on frequency
            prefs.favoriteTokens = Array.from(tokenFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([token]) => token)
                .slice(0, 5);
        }
        // Update risk tolerance
        if (analysis.queryAnalysis.detectedIntents.includes('risk_assessment')) {
            const riskTerms = analysis.queryAnalysis.detectedIntents.filter(intent => ['high_risk', 'moderate_risk', 'low_risk'].includes(intent));
            if (riskTerms.length > 0) {
                prefs.riskTolerance = riskTerms[0].includes('high') ? 'high' :
                    riskTerms[0].includes('low') ? 'low' : 'medium';
            }
        }
        // Update investment goals
        if (analysis.queryAnalysis.detectedIntents.includes('investment_strategy')) {
            const goals = analysis.queryAnalysis.conceptualIndicators
                .filter(indicator => ['long_term', 'short_term', 'growth', 'income', 'trading'].includes(indicator));
            if (goals.length > 0) {
                prefs.investmentGoals = Array.from(new Set([
                    ...(prefs.investmentGoals || []),
                    ...goals
                ]));
            }
        }
    }
    suggestNextTopics(sessionId) {
        const context = this.getContext(sessionId);
        const suggestions = [];
        // Add topic-based suggestions
        switch (context.currentTopic) {
            case 'MARKET_DATA':
                suggestions.push('How does this compare to other similar tokens?', 'What are the recent market trends?', 'Would you like to see the price history?');
                break;
            case 'COMPARISON':
                suggestions.push('Which token has better performance?', 'What are the key differences in technology?', 'How do their market caps compare?');
                break;
            case 'CONCEPTUAL':
                suggestions.push('Would you like to see some real-world examples?', 'How does this relate to other blockchain concepts?', 'What are the practical applications?');
                break;
            case 'HYBRID':
                suggestions.push('Would you like more detailed market data?', 'Should we focus on technical analysis?', 'Would you like to understand the underlying technology?');
                break;
        }
        // Add personalized suggestions
        if (context.memory.userPreferences.favoriteTokens?.length) {
            const favoriteToken = context.memory.userPreferences.favoriteTokens[0];
            suggestions.push(`What's the latest price of ${favoriteToken}?`, `How has ${favoriteToken} performed recently?`);
        }
        // Add risk-based suggestions
        if (context.memory.userPreferences.riskTolerance) {
            switch (context.memory.userPreferences.riskTolerance) {
                case 'high':
                    suggestions.push('Show me high-potential emerging tokens', 'What are the most volatile tokens today?');
                    break;
                case 'medium':
                    suggestions.push('Show me tokens with balanced risk-reward', 'What are the trending mid-cap tokens?');
                    break;
                case 'low':
                    suggestions.push('What are the most stable tokens?', 'Show me tokens with consistent performance');
                    break;
            }
        }
        // Randomize and limit suggestions
        return this.shuffleArray(suggestions).slice(0, 3);
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    cleanupExpiredContexts() {
        const now = Date.now();
        for (const [sessionId, context] of this.contexts.entries()) {
            if (now - context.memory.lastInteraction > this.CONTEXT_EXPIRY) {
                this.contexts.delete(sessionId);
            }
        }
    }
}
exports.ConversationManager = ConversationManager;
