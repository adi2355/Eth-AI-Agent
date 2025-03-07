import { generateResponse } from './llm';
import { processBlockchainQuery } from './blockchain';

// Client-side API functions
export async function fetchBlockchainData(query: string) {
  try {
    const data = await processBlockchainQuery(query);
    if (!data) {
      throw new Error('No data returned from blockchain query');
    }
    return { data };
  } catch (error) {
    console.error('Blockchain query error:', error);
    throw error;
  }
}

export async function fetchChatResponse(query: string, context: any) {
  try {
    if (!query) {
      throw new Error('Query is required');
    }

    if (!context || !context.data) {
      throw new Error('Context data is required');
    }

    const response = await generateResponse(
      query,
      context.data,
      context.conversationHistory,
      {
        queryType: context.queryType || 'trending',
        temperature: 0.7,
        maxTokens: 500
      }
    );

    return { response };
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
}