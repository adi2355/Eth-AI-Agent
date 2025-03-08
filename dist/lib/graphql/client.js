"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphClient = void 0;
const graphql_request_1 = require("graphql-request");
const cache_1 = require("../cache");
const monitoring_1 = require("../monitoring");
const GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
// Create a simple client without extending GraphQLClient
const baseClient = new graphql_request_1.GraphQLClient(GRAPH_URL);
// Create a wrapper function that adds caching
async function cachedRequest(document, variables) {
    // Try to get from cache first
    const cached = await cache_1.cache.get(document, variables);
    if (cached) {
        return cached;
    }
    const startTime = Date.now();
    try {
        const data = await baseClient.request(document, variables);
        // Record request duration
        monitoring_1.graphqlRequestDuration.record(Date.now() - startTime);
        // Cache the result
        await cache_1.cache.set(document, variables, data);
        return data;
    }
    catch (error) {
        monitoring_1.graphqlErrors.add(1);
        throw error;
    }
}
// Export an object with the request method
exports.graphClient = {
    request: cachedRequest
};
