"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAggregatorCalls = buildAggregatorCalls;
exports.executeAggregatorCalls = executeAggregatorCalls;
const token_data_1 = require("@/lib/token-data");
async function buildAggregatorCalls(analysis) {
    console.log('buildAggregatorCalls: Starting with analysis:', {
        primaryIntent: analysis.classification.primaryIntent,
        tokens: analysis.queryAnalysis.detectedTokens,
        needsApiCall: analysis.classification.needsApiCall
    });
    const spec = {
        primary: {},
        fallback: {}
    };
    // Handle different intent types
    switch (analysis.classification.primaryIntent) {
        case 'MARKET_DATA':
        case 'COMPARISON':
        case 'DEFI':
            // Market data logic with actual API calls
            if (analysis.classification.needsApiCall) {
                spec.primary.coingecko = {
                    method: 'GET',
                    tokens: analysis.queryAnalysis.detectedTokens,
                    timeframe: analysis.queryAnalysis.timeContext || 'current'
                };
            }
            break;
        case 'NEWS_EVENTS':
        case 'REGULATORY':
            if (analysis.classification.requiresWebSearch) {
                const contentTypes = analysis.dataRequirements.newsData?.types || ['announcement'];
                const timeRange = analysis.dataRequirements.newsData?.timeRange;
                spec.primary.news = {
                    method: 'GET',
                    contentTypes,
                    timeRange,
                    tokens: analysis.queryAnalysis.detectedTokens
                };
                // Add regulatory data requirements if needed
                if (analysis.classification.primaryIntent === 'REGULATORY') {
                    spec.primary.regulatory = {
                        method: 'GET',
                        jurisdiction: 'global',
                        timeRange
                    };
                }
            }
            break;
        case 'SECURITY':
            if (analysis.classification.requiresWebSearch) {
                spec.primary.security = {
                    method: 'GET',
                    contentTypes: ['security_incident'],
                    tokens: analysis.queryAnalysis.detectedTokens
                };
            }
            break;
    }
    return spec;
}
async function executeAggregatorCalls(spec) {
    console.log('executeAggregatorCalls: Starting with spec:', spec);
    const results = {
        primary: {},
        fallback: {}
    };
    try {
        // Validate spec
        if (!spec || typeof spec !== 'object') {
            throw new Error('Invalid aggregator specification');
        }
        // Handle CoinGecko data requests
        if (spec.primary.coingecko) {
            const { tokens } = spec.primary.coingecko;
            // Validate tokens array
            if (!Array.isArray(tokens)) {
                throw new Error('Invalid tokens specification');
            }
            if (tokens.length === 0) {
                throw new Error('No tokens specified for price lookup');
            }
            if (tokens.length > 5) {
                throw new Error('Too many tokens requested (maximum 5)');
            }
            // Get token details for each token with error handling
            const tokenDetailsPromises = tokens.map(async (token) => {
                try {
                    if (!token || typeof token !== 'string') {
                        throw new Error(`Invalid token: ${token}`);
                    }
                    const details = await (0, token_data_1.getTokenDetails)(token);
                    if (!details) {
                        console.warn(`No details found for token: ${token}`);
                        return null;
                    }
                    return details;
                }
                catch (error) {
                    console.error(`Error fetching details for token ${token}:`, error);
                    return null;
                }
            });
            const tokenDetails = await Promise.all(tokenDetailsPromises);
            // Filter out failed lookups and get valid token IDs
            const validTokenDetails = tokenDetails.filter(detail => detail !== null);
            if (validTokenDetails.length === 0) {
                throw new Error('No valid token details found');
            }
            const tokenIds = validTokenDetails
                .filter((detail) => detail !== null)
                .map(detail => detail.id);
            // Get token prices with error handling
            try {
                const prices = await (0, token_data_1.getTokenPrices)(tokenIds);
                results.primary.coingecko = {
                    tokenDetails: validTokenDetails,
                    prices
                };
            }
            catch (error) {
                console.error('Error fetching token prices:', error);
                throw new Error('Failed to fetch token prices');
            }
        }
        // Handle news data requests
        if (spec.primary.news) {
            // News data would be handled by a separate service
            results.primary.news = {
                status: 'success',
                message: 'News data would be fetched here'
            };
        }
        // Handle regulatory data requests
        if (spec.primary.regulatory) {
            // Regulatory data would be handled by a separate service
            results.primary.regulatory = {
                status: 'success',
                message: 'Regulatory data would be fetched here'
            };
        }
        // Handle security data requests
        if (spec.primary.security) {
            // Security data would be handled by a separate service
            results.primary.security = {
                status: 'success',
                message: 'Security data would be fetched here'
            };
        }
        return results;
    }
    catch (error) {
        console.error('Error executing aggregator calls:', error);
        // Enhanced error handling with specific error types
        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                throw new Error('API rate limit exceeded. Please try again in a moment.');
            }
            if (error.message.includes('API key')) {
                throw new Error('API configuration error. Please check your settings.');
            }
            if (error.message.includes('No valid token')) {
                throw new Error('Could not find data for the requested tokens. Please verify the token symbols.');
            }
            if (error.message.includes('Too many tokens')) {
                throw new Error('Please request fewer tokens (maximum 5 at a time).');
            }
            if (error.message.includes('Invalid token')) {
                throw new Error('Invalid token symbol provided. Please check the token name.');
            }
        }
        throw new Error('Failed to fetch token data. Please try again.');
    }
}
