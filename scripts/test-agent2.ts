import { analyzeUserQuery, buildAggregatorCalls, executeAggregatorCalls } from '../lib/agents/index.js';

interface TestCase {
  input: string;
  expectedIntent: string;
  expectedTokens: string[] | null;
  shouldNeedApiCall: boolean;
  expectedAggregator?: {
    endpoints: string[];
    params?: Record<string, any>;
  };
}

const TEST_CASES: Record<string, TestCase[]> = {
  price_queries: [
    {
      input: "What is the price of Bitcoin?",
      expectedIntent: "MARKET_DATA",
      expectedTokens: ["bitcoin"],
      shouldNeedApiCall: true,
      expectedAggregator: {
        endpoints: ["/simple/price"],
        params: { ids: ["bitcoin"], vs_currencies: "usd" }
      }
    },
    {
      input: "Show me ETH price",
      expectedIntent: "MARKET_DATA",
      expectedTokens: ["ethereum"],
      shouldNeedApiCall: true
    }
  ],
  
  trending_queries: [
    {
      input: "What coins are trending?",
      expectedIntent: "MARKET_DATA",
      expectedTokens: null,
      shouldNeedApiCall: true,
      expectedAggregator: {
        endpoints: ["/search/trending"]
      }
    }
  ],
  
  hybrid_queries: [
    {
      input: "Compare ETH and BTC prices and technology",
      expectedIntent: "HYBRID",
      expectedTokens: ["ethereum", "bitcoin"],
      shouldNeedApiCall: true
    }
  ],
  
  edge_cases: [
    {
      input: "what is luna???!!!",
      expectedIntent: "NEEDS_CONTEXT",
      expectedTokens: ["luna"],
      shouldNeedApiCall: false
    }
  ]
};

function assertExpected(actual: any, expected: any, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Multi-Agent Pipeline Tests\n');
  
  let passCount = 0;
  let failCount = 0;
  const errors: Record<string, Error[]> = {};
  
  for (const [category, cases] of Object.entries(TEST_CASES)) {
    console.log(`\nTesting category: ${category}`);
    
    for (const testCase of cases) {
      try {
        console.log(`\nQuery: "${testCase.input}"`);
        
        // Test Agent #1
        const analysis = await analyzeUserQuery({ query: testCase.input });
        
        // Validate intent classification
        assertExpected(analysis.classification.primaryIntent, testCase.expectedIntent, "Intent mismatch");
        assertExpected(analysis.classification.needsApiCall, testCase.shouldNeedApiCall, "API call flag mismatch");
        
        if (testCase.expectedTokens) {
          assertExpected(
            analysis.queryAnalysis.detectedTokens.sort(),
            testCase.expectedTokens.sort(),
            "Tokens mismatch"
          );
        }
        
        // Only test Agent #2 if API call needed
        if (testCase.shouldNeedApiCall) {
          const aggregatorSpec = await buildAggregatorCalls(analysis);
          
          if (testCase.expectedAggregator) {
            if (aggregatorSpec.primary?.coingecko) {
              assertExpected(
                [aggregatorSpec.primary.coingecko.endpoint],
                testCase.expectedAggregator.endpoints,
                "Endpoints mismatch"
              );
              
              if (testCase.expectedAggregator.params) {
                const hasAllParams = Object.entries(testCase.expectedAggregator.params)
                  .every(([key, value]) => 
                    JSON.stringify(aggregatorSpec.primary?.coingecko?.params?.[key]) === JSON.stringify(value)
                  );
                if (!hasAllParams) {
                  throw new Error("Parameters mismatch");
                }
              }
            }
          }
          
          // Optional: Execute calls with mocking
          if (process.env.EXECUTE_CALLS === 'true') {
            const mockOptions = {
              simulateRateLimit: false,
              simulateTimeout: false
            };
            
            const results = await executeAggregatorCalls(aggregatorSpec);
            if (!results) {
              throw new Error("No results returned from aggregator calls");
            }
          }
        }
        
        console.log('✅ Passed');
        passCount++;
        
      } catch (error) {
        console.log('❌ Failed:', error instanceof Error ? error.message : 'Unknown error');
        failCount++;
        if (!errors[category]) errors[category] = [];
        errors[category].push(error as Error);
      }
    }
  }
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log(`Total: ${passCount + failCount}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (Object.keys(errors).length > 0) {
    console.log('\n❌ Errors by category:');
    for (const [category, categoryErrors] of Object.entries(errors)) {
      console.log(`\n${category}:`);
      categoryErrors.forEach(error => console.log(`  - ${error.message}`));
    }
  }
}

// Add error handling for the whole suite
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});