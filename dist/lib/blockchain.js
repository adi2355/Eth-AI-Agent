"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBlockchainQuery = processBlockchainQuery;
const token_data_1 = require("./token-data");
let conversationContext = {
    currentPage: 1,
    messages: [],
};
async function processBlockchainQuery(query) {
    if (!query?.trim()) {
        throw new Error('Query is required');
    }
    const lowercaseQuery = query.toLowerCase();
    try {
        // Store user message in context
        conversationContext.messages.push({ role: 'user', content: query });
        // Determine query type and get relevant data
        let data;
        if (lowercaseQuery.includes('trending') || lowercaseQuery.includes('popular')) {
            const trendingTokens = await (0, token_data_1.getTrendingTokens)();
            if (!trendingTokens?.length) {
                throw new Error('No trending tokens found');
            }
            const tokenIds = trendingTokens.map(trend => trend.item.id);
            const tokenPrices = await (0, token_data_1.getTokenPrices)(tokenIds);
            data = {
                trending: trendingTokens,
                prices: tokenPrices,
            };
        }
        else if (lowercaseQuery.includes('price') ||
            lowercaseQuery.includes('bitcoin') ||
            lowercaseQuery.includes('eth')) {
            // Extract token name from query
            const tokenQuery = lowercaseQuery.includes('bitcoin') ? 'bitcoin' :
                lowercaseQuery.includes('eth') ? 'ethereum' :
                    lowercaseQuery.split(' ').find(word => !['what', 'is', 'the', 'price', 'of', 'show', 'me', 'tell'].includes(word));
            if (!tokenQuery) {
                throw new Error('Please specify which token you want to check');
            }
            const tokenInfo = await (0, token_data_1.getTokenDetails)(tokenQuery);
            if (!tokenInfo) {
                throw new Error(`Could not find information for token "${tokenQuery}"`);
            }
            data = { tokenInfo };
        }
        else {
            throw new Error('Please ask about trending tokens or specific token prices');
        }
        // Store data in context
        if (data) {
            conversationContext.lastResults = data;
            conversationContext.lastQuery = query;
        }
        return data;
    }
    catch (error) {
        console.error('Error processing blockchain query:', error);
        throw error;
    }
}
