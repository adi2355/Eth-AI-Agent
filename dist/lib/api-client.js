"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchBlockchainData = fetchBlockchainData;
exports.fetchChatResponse = fetchChatResponse;
const llm_1 = require("./llm");
const blockchain_1 = require("./blockchain");
// Client-side API functions
async function fetchBlockchainData(query) {
    try {
        const data = await (0, blockchain_1.processBlockchainQuery)(query);
        if (!data) {
            throw new Error('No data returned from blockchain query');
        }
        return { data };
    }
    catch (error) {
        console.error('Blockchain query error:', error);
        throw error;
    }
}
async function fetchChatResponse(query, context) {
    try {
        if (!query) {
            throw new Error('Query is required');
        }
        if (!context || !context.data) {
            throw new Error('Context data is required');
        }
        const response = await (0, llm_1.generateResponse)(query, context.data, context.conversationHistory, {
            queryType: context.queryType || 'trending',
            temperature: 0.7,
            maxTokens: 500
        });
        return { response };
    }
    catch (error) {
        console.error('Chat error:', error);
        throw error;
    }
}
