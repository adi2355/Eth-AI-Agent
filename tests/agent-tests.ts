import { analyzeUserQuery } from '../lib/agents/intent.js';
import { buildAggregatorCalls, executeAggregatorCalls } from '../lib/agents/aggregator.js';
import { generateSummary } from '../lib/agents/summarization.js';
import type { RobustAnalysis } from '../lib/agents/types.js';

// Test cases
const TEST_CASES = [
  {
    query: "What is the price of Bitcoin?",
    expectedIntent: "MARKET_DATA",
    requiresApi: true
  },
  {
    query: "Show me trending tokens",
    expectedIntent: "MARKET_DATA",
    requiresApi: true
  },
  {
    query: "What is a blockchain?",
    expectedIntent: "CONCEPTUAL",
    requiresApi: false
  }
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest(testCase: typeof TEST_CASES[0]) {
  console.log(`\nTesting: "${testCase.query}"`);
  
  try {
    // Test Agent 1 (Intent Analysis)
    console.log('\nAgent 1 - Intent Analysis:');
    const analysis = await analyzeUserQuery({ query: testCase.query });
    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    // Validate analysis
    if (analysis.classification.primaryIntent !== testCase.expectedIntent) {
      throw new Error(`Expected intent ${testCase.expectedIntent}, got ${analysis.classification.primaryIntent}`);
    }

    // Test Agent 2 (Data Aggregation) if needed
    let data = null;
    if (testCase.requiresApi) {
      console.log('\nAgent 2 - Data Aggregation:');
      const spec = await buildAggregatorCalls(analysis);
      console.log('Aggregator Spec:', JSON.stringify(spec, null, 2));
      
      try {
        data = await executeAggregatorCalls(spec);
        console.log('Data:', JSON.stringify(data, null, 2));
      } catch (error) {
        console.warn('API call failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Test Agent 3 (Response Generation)
    console.log('\nAgent 3 - Response Generation:');
    const response = await generateSummary({
      userQuery: testCase.query,
      analysis,
      aggregatorResult: data
    });
    console.log('Response:', response);

    return true;
  } catch (error) {
    console.error('Test failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function runTests() {
  console.log('Starting tests...');
  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    const success = await runTest(testCase);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    await delay(2000); // Delay between tests to avoid rate limits
  }

  console.log('\nTest Results:');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${TEST_CASES.length}`);

  process.exit(failed > 0 ? 1 : 0);
}

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});