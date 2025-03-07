import { analyzeUserQuery } from '@/lib/agents';

const TEST_QUERIES = [
  // Price queries
  "What is the price of Bitcoin?",
  "Show me ETH price",
  "How much is BNB worth?",
  
  // Trending queries
  "What coins are trending?",
  "Show me popular tokens",
  "Which cryptocurrencies are hot right now?",
  
  // Conceptual queries
  "What is a gas fee?",
  "How do smart contracts work?",
  "Explain blockchain technology",
  
  // Edge cases
  "shw me gud coins", // Malformed
  "", // Empty
  "price", // Ambiguous
];

async function runTests() {
  console.log('🧪 Testing Agent #1 Query Analysis\n');
  
  for (const query of TEST_QUERIES) {
    console.log(`Query: "${query}"`);
    try {
      if (!query) {
        console.log('❌ Empty query - Skipping\n');
        continue;
      }
      
      const result = await analyzeUserQuery({ query });
      console.log('Result:', JSON.stringify(result, null, 2));
      
      // Validate result structure
      const isValid = 
        typeof result.classification?.needsApiCall === 'boolean' &&
        result.classification?.primaryIntent !== undefined;
        
      console.log(isValid ? '✅ Valid response' : '❌ Invalid response structure');
    } catch (error) {
      console.log('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    }
    console.log('\n---\n');
  }
}

runTests().catch(console.error);