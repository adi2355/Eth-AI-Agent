"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOrchestrator = void 0;
const agents_1 = require("./agents");
const conversation_store_1 = require("./conversation-store");
const context_builder_1 = require("./conversation/context-builder");
class AgentOrchestrator {
    constructor() {
        // Clean up expired sessions periodically
        setInterval(() => {
            conversation_store_1.ConversationStore.cleanExpiredSessions();
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    checkApiKeys() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('API configuration error: OpenAI API key is not configured');
        }
        if (!process.env.COINMARKETCAP_API_KEY) {
            console.warn('Warning: CoinMarketCap API key not configured - fallback functionality may be limited');
        }
        if (!process.env.COINGECKO_API_KEY) {
            console.warn('Warning: CoinGecko API key not configured - API rate limits may be restricted');
        }
    }
    async withRetry(operation, maxRetries = 3, initialDelay = 1000) {
        let lastError = null;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Operation timed out')), 30000); // 30s timeout
                });
                const operationPromise = operation();
                return await Promise.race([operationPromise, timeoutPromise]);
            }
            catch (error) {
                lastError = error;
                const isRetryable = error instanceof Error && (error.message.includes('socket hang up') ||
                    error.message.includes('rate limit') ||
                    error.message.includes('timeout') ||
                    error.message.includes('ECONNRESET') ||
                    error.message.includes('ETIMEDOUT'));
                if (isRetryable && i < maxRetries - 1) {
                    const delay = initialDelay * Math.pow(2, i);
                    console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
        throw lastError || new Error('Operation failed after retries');
    }
    async handleProcessingError(error) {
        console.error('Orchestration error:', error);
        if (error instanceof Error) {
            // Authentication errors
            if (error.message.includes('401') || error.message.includes('unauthorized') || error.message.includes('invalid api key')) {
                throw new Error('Service configuration error: API key is invalid or not configured properly. Please check your environment settings.');
            }
            // Rate limiting
            if (error.message.includes('429') || error.message.includes('rate limit')) {
                throw new Error('Service is currently busy. Please try again in a moment.');
            }
            // API errors
            if (error.message.includes('socket hang up') || error.message.includes('ECONNRESET')) {
                throw new Error('Connection interrupted. Please try again.');
            }
            if (error.message.includes('timeout')) {
                throw new Error('Request timed out. Please try again.');
            }
            // Service errors
            if (error.message.includes('503') || error.message.includes('502')) {
                throw new Error('Service is temporarily unavailable. Please try again later.');
            }
            // Return the original error message if it's from our own validation
            if (error.message.includes('API configuration error') ||
                error.message.includes('Session ID is required')) {
                throw error;
            }
        }
        // Generic error for unhandled cases
        throw new Error('An unexpected error occurred. Please try again later.');
    }
    async processQuery(query, sessionId) {
        console.log('Starting query processing:', { query, sessionId });
        try {
            // Check API keys first
            this.checkApiKeys();
            if (!sessionId) {
                throw new Error('Session ID is required for conversation memory');
            }
            // Step 1: Intent Analysis with retry
            console.log('Running intent analysis...');
            const analysis = await this.withRetry(() => (0, agents_1.analyzeUserQuery)({ query }), 3, 1000);
            // Step 2: Build Enhanced Context
            const enhancedContext = (0, context_builder_1.buildEnhancedContext)(sessionId, analysis);
            const formattedContext = (0, context_builder_1.formatContextForPrompt)(enhancedContext);
            // Analyze conversation continuity
            const continuityAnalysis = (0, context_builder_1.analyzeContextContinuity)(enhancedContext);
            console.log('Context analysis:', {
                isCoherent: continuityAnalysis.isCoherent,
                confidence: continuityAnalysis.confidence
            });
            // Store user message with metadata
            conversation_store_1.ConversationStore.addMessage(sessionId, {
                role: 'user',
                content: query,
                timestamp: Date.now(),
                metadata: {
                    intent: analysis.classification.primaryIntent,
                    confidence: analysis.classification.confidence,
                    tokens: analysis.queryAnalysis.detectedTokens,
                    contextConfidence: continuityAnalysis.confidence
                }
            });
            let aggregatorData = null;
            let response;
            // Step 3: Process based on intent and context with retry
            try {
                if (analysis.classification.needsApiCall || analysis.classification.requiresWebSearch) {
                    console.log('Building aggregator spec...');
                    const aggregatorSpec = await (0, agents_1.buildAggregatorCalls)(analysis);
                    console.log('Executing aggregator calls with retry...');
                    aggregatorData = await this.withRetry(() => (0, agents_1.executeAggregatorCalls)(aggregatorSpec), 3, 2000);
                }
                // Step 4: Generate Response with Enhanced Context and retry
                console.log('Generating response with enhanced context...');
                response = await this.withRetry(() => (0, agents_1.generateSummary)({
                    userQuery: query,
                    analysis,
                    aggregatorResult: aggregatorData,
                    sessionId,
                    enhancedContext: formattedContext
                }), 3, 1000);
                // Store assistant response with metadata
                conversation_store_1.ConversationStore.addMessage(sessionId, {
                    role: 'assistant',
                    content: response,
                    timestamp: Date.now(),
                    metadata: {
                        intent: analysis.classification.primaryIntent,
                        tokens: analysis.queryAnalysis.detectedTokens,
                        contextConfidence: continuityAnalysis.confidence
                    }
                });
                // Add follow-up suggestion if conversation flow needs bridging
                if (continuityAnalysis.suggestedFollowUp) {
                    response += `\n\n${continuityAnalysis.suggestedFollowUp}`;
                }
                // Generate contextual suggestions
                const suggestions = this.generateSuggestions(analysis, enhancedContext);
                return {
                    analysis,
                    aggregatorData,
                    response,
                    suggestions,
                    contextAnalysis: {
                        isCoherent: continuityAnalysis.isCoherent,
                        confidence: continuityAnalysis.confidence
                    }
                };
            }
            catch (error) {
                console.error('Branch processing error:', error);
                // Attempt recovery with fallback processing
                response = await this.withRetry(() => (0, agents_1.generateSummary)({
                    userQuery: query,
                    analysis,
                    aggregatorResult: null,
                    sessionId,
                    enhancedContext: formattedContext
                }), 3, 1000);
                return {
                    analysis,
                    aggregatorData: null,
                    response,
                    suggestions: []
                };
            }
        }
        catch (error) {
            return this.handleProcessingError(error);
        }
    }
    generateSuggestions(analysis, enhancedContext) {
        const suggestions = [];
        // Add topic-based suggestions
        switch (analysis.classification.primaryIntent) {
            case 'MARKET_DATA':
                if (enhancedContext.userPreferences.technicalLevel === 'advanced') {
                    suggestions.push('Would you like to see detailed market metrics?', 'Should we analyze the trading volume patterns?');
                }
                else {
                    suggestions.push('How does this compare to other tokens?', 'Would you like to see the price history?');
                }
                break;
            case 'TECHNICAL':
                suggestions.push('Would you like to see code examples?', 'Should we explore security implications?');
                break;
            case 'DEFI':
                suggestions.push('Would you like to analyze the protocol risks?', 'Should we compare yields across platforms?');
                break;
            case 'REGULATORY':
                suggestions.push('Would you like to see compliance requirements?', 'Should we check jurisdictional differences?');
                break;
            case 'SECURITY':
                suggestions.push('Would you like to see recent audit findings?', 'Should we review security best practices?');
                break;
            case 'NEWS_EVENTS':
                suggestions.push('Would you like to see related developments?', 'Should we analyze market impact?');
                break;
        }
        // Add personalized suggestions based on user preferences
        if (enhancedContext.userPreferences.favoriteTokens.length) {
            const favoriteToken = enhancedContext.userPreferences.favoriteTokens[0];
            suggestions.push(`What's the latest price of ${favoriteToken}?`, `How has ${favoriteToken} performed recently?`);
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
}
exports.AgentOrchestrator = AgentOrchestrator;
