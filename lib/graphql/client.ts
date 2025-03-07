import { GraphQLClient } from 'graphql-request';
import { cache } from '../cache';
import { graphqlRequestDuration, graphqlErrors } from '../monitoring';

const GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';

// Create a simple client without extending GraphQLClient
const baseClient = new GraphQLClient(GRAPH_URL);

// Create a wrapper function that adds caching
async function cachedRequest<T = any>(
  document: string,
  variables?: Record<string, any>
): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get<T>(document, variables);
  if (cached) {
    return cached;
  }

  const startTime = Date.now();
  try {
    const data = await baseClient.request<T>(document, variables);
    
    // Record request duration
    graphqlRequestDuration.record(Date.now() - startTime);

    // Cache the result
    await cache.set(document, variables, data);

    return data;
  } catch (error) {
    graphqlErrors.add(1);
    throw error;
  }
}

// Export an object with the request method
export const graphClient = {
  request: cachedRequest
};