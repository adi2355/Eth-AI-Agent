import { Configuration, OpenAIApi } from 'openai';
import { RobustAnalysis, Agent1Input, PreprocessingStep, QueryMetadata } from './types';
import { validateAnalysis, validateLLMResponse, PreprocessingError, LLMError } from './validation';

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
let openai: OpenAIApi | null = null;

function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    
    const configuration = new Configuration({ apiKey });
    openai = new OpenAIApi(configuration);
  }
  return openai;
}

const SYSTEM_PROMPT = `You are an advanced blockchain and cryptocurrency analysis system specializing in intent classification. Your task is to analyze and categorize user queries across multiple domains while being resilient to ambiguous, malformed, or complex inputs.

CLASSIFICATION CATEGORIES:

1. MARKET_DATA
   - Price inquiries and market statistics
   - Trading volume and liquidity information
   - Market cap and supply metrics
   - Historical price data requests
   Examples: "What's BTC price?", "Show ETH trading volume"

2. COMPARISON
   - Direct token comparisons
   - Performance analysis between assets
   - Market metric comparisons
   - Technology or feature comparisons
   Examples: "Compare BTC and ETH", "Which has better performance?"

3. TECHNICAL
   - Smart contract inquiries
   - Blockchain architecture questions
   - Protocol specifications
   - Development and implementation
   Examples: "How do ERC20 tokens work?", "Explain Ethereum's consensus"

4. DEFI
   - Yield farming and liquidity
   - Lending protocols
   - DEX mechanics
   - Tokenomics
   Examples: "How does liquidity mining work?", "Explain impermanent loss"

5. REGULATORY
   - Legal and compliance questions
   - Regulatory updates
   - Policy impact analysis
   - Jurisdictional inquiries
   Examples: "Latest crypto regulations", "Is mining legal in China?"

6. NEWS_EVENTS
   - Recent developments
   - Project updates
   - Market events
   - Industry announcements
   Examples: "Latest Bitcoin news", "Updates on ETH merge"

7. SECURITY
   - Network security
   - Wallet safety
   - Smart contract audits
   - Attack vectors and risks
   Examples: "Is hardware wallet safe?", "Common DeFi exploits"

8. CONCEPTUAL
   - Basic blockchain concepts
   - Cryptocurrency fundamentals
   - General educational queries
   Examples: "What are gas fees?", "How does mining work?"

9. HYBRID
   - Queries spanning multiple categories
   - Complex multi-part questions
   Example: "Compare ETH price and explain smart contracts"

10. NEEDS_CONTEXT
    - Ambiguous queries
    - Incomplete information
    - Context-dependent questions
    Example: "Is it better?", "What's the difference?"

11. DEPLOY_CONTRACT
    - Requests to deploy smart contracts
    - Specific contract template mentions
    - Contract deployment parameters
    Examples: "Deploy an ERC20 token", "Create a new token called MyToken"

12. TRANSFER_TOKENS
    - Requests to send tokens or ETH
    - Mentions of specific recipients and amounts
    Examples: "Send 0.1 ETH to 0x123...", "Transfer 100 USDC to my friend"

13. CONNECT_WALLET
    - Requests to connect a wallet
    - MetaMask or wallet connection mentions
    Examples: "Connect my wallet", "Link MetaMask"

DETECTION RULES:

1. Token Detection:
   - Common tokens: BTC, ETH, SOL, DOGE, ADA, BNB, XRP, DOT, MATIC, AVAX, LINK, UNI, ATOM, LTC
   - Special cases: LUNA -> terra-luna-2, LUNC -> terra-luna
   - Handle both symbols and full names: Bitcoin, Ethereum, etc.
   - Process token pairs in comparisons
   - Maximum 5 tokens per query
   - Normalize token names consistently

2. Intent Analysis:
   - Primary intent based on strongest category match
   - Secondary intents for hybrid queries
   - Confidence level assessment
   - Ambiguity detection

3. Market Indicators:
   - Price-related terms
   - Volume and liquidity metrics
   - Trading signals
   - Technical analysis terms

4. Conceptual Indicators:
   - Educational keywords
   - Definition requests
   - How-to questions
   - Explanation markers

5. Time Context:
   - Current vs historical
   - Specific timeframes
   - Trend analysis periods
   - Future predictions

6. Blockchain Transaction Detection:
   - Wallet addresses (0x...)
   - Token amounts and symbols
   - Contract template names (ERC20, ERC721)
   - Transaction verbs (send, transfer, deploy, create)
   - Wallet connection terms (connect, link, integrate)

CRITICAL RESPONSE REQUIREMENTS:

Return a valid JSON response with EXACTLY this structure:

{
  "classification": {
    "primaryIntent": "MARKET_DATA" | "COMPARISON" | "TECHNICAL" | "DEFI" | 
                    "REGULATORY" | "NEWS_EVENTS" | "SECURITY" | "CONCEPTUAL" | 
                    "HYBRID" | "NEEDS_CONTEXT" | "DEPLOY_CONTRACT" | 
                    "TRANSFER_TOKENS" | "CONNECT_WALLET",
    "confidence": <number between 0 and 1>,
    "needsApiCall": <boolean>,
    "ambiguityLevel": "LOW" | "MEDIUM" | "HIGH",
    "requiresWebSearch": <boolean>
  },
  "queryAnalysis": {
    "sanitizedQuery": <string>,
    "detectedTokens": <string[]>,
    "comparisonRequest": {
      "isComparison": <boolean>,
      "tokens": <string[]>,
      "aspects": <string[]>,
      "primaryMetric": <string | null>
    },
    "detectedIntents": <string[]>,
    "timeContext": "current" | "24h" | "7d" | "30d" | null,
    "marketIndicators": <string[]>,
    "conceptualIndicators": <string[]>,
    "webSearchContext": {
      "needed": <boolean>,
      "reason": <string | null>,
      "suggestedQueries": <string[]>
    },
    "detectedEntities": <string[]>,
    "entityParams": {
      "name": <string | null>,
      "symbol": <string | null>,
      "initialSupply": <string | null>
    },
    "recipient": <string | null>,
    "amount": <string | null>,
    "tokenAddress": <string | null>
  },
  "dataRequirements": {
    "marketData": {
      "needed": <boolean>,
      "types": <string[]>,
      "timeframe": "current" | "24h" | "7d" | "30d" | null,
      "tokenCount": <number>
    },
    "conceptualData": {
      "needed": <boolean>,
      "aspects": <string[]>
    }
  }
}

CRITICAL REQUIREMENTS:
1. ALWAYS include ALL fields exactly as shown above
2. NEVER omit any fields or change the structure
3. ALWAYS validate token count <= 5
4. ENSURE all string arrays contain valid strings
5. SET needsApiCall=true for any market data requests
6. SET requiresWebSearch=true for news/regulatory queries
7. INCLUDE clear reason when webSearchContext.needed=true
8. VALIDATE all enums match specified values exactly
9. For market data:
   - Set tokenCount accurately
   - Include all required data types
   - Set timeframe appropriately
10. For comparisons:
    - Set comparisonRequest.isComparison = true
    - Include all detected tokens in comparisonRequest.tokens
    - List relevant aspects in comparisonRequest.aspects
    - Set primaryMetric based on query focus
11. For news/regulatory/security queries:
    - Set requiresWebSearch = true
    - Include clear reason in webSearchContext
    - Provide relevant suggestedQueries
12. For conceptual/technical queries:
    - Set marketData.needed = false
    - Set marketData.tokenCount = 0
    - Include relevant aspects in conceptualData
13. For blockchain transactions:
    - For DEPLOY_CONTRACT: Extract templateId, name, symbol, initialSupply, etc.
    - For TRANSFER_TOKENS: Extract to (recipient address), amount, tokenAddress (if specified)
    - For CONNECT_WALLET: Extract wallet type (metamask, walletconnect)
    - Include detectedEntities, entityParams, recipient, amount, tokenAddress as appropriate`;

function preprocessQuery(query: string): PreprocessingStep[] {
  const steps: PreprocessingStep[] = [];
  
  try {
    if (!query?.trim()) {
      throw new PreprocessingError('Empty query', 'sanitize');
    }

    let processed = query.trim();
    steps.push({
      operation: 'sanitize',
      input: query,
      output: processed
    });

    processed = processed.toLowerCase();
    const tokenMappings: Record<string, string> = {
      'btc': 'bitcoin',
      'eth': 'ethereum',
      'sol': 'solana',
      'doge': 'dogecoin',
      'ada': 'cardano',
      'bnb': 'binancecoin',
      'xrp': 'ripple',
      'dot': 'polkadot',
      'matic': 'polygon',
      'avax': 'avalanche-2',
      'link': 'chainlink',
      'uni': 'uniswap',
      'atom': 'cosmos',
      'ltc': 'litecoin',
      'luna': 'terra-luna-2',
      'lunc': 'terra-luna'
    };

    for (const [abbr, full] of Object.entries(tokenMappings)) {
      processed = processed.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
    }
    steps.push({
      operation: 'normalize_tokens',
      input: processed,
      output: processed
    });

    return steps;
  } catch (error) {
    if (error instanceof PreprocessingError) {
      throw error;
    }
    throw new PreprocessingError(
      'Preprocessing failed',
      'unknown',
      query
    );
  }
}

function extractMetadata(query: string, steps: PreprocessingStep[]): QueryMetadata {
  try {
    const processedQuery = steps[steps.length - 1].output;
    
    const commonTokens = [
      'bitcoin', 'ethereum', 'solana', 'dogecoin', 'cardano',
      'binancecoin', 'ripple', 'polkadot', 'polygon', 'avalanche-2',
      'chainlink', 'uniswap', 'cosmos', 'litecoin', 'terra-luna-2',
      'terra-luna'
    ];

    const tokens = processedQuery
      .split(/\s+/)
      .filter(token => 
        token.length > 1 && 
        !['price', 'show', 'me', 'what', 'is', 'the', 'of', 'and', 'vs', 'versus', 'compare'].includes(token)
      );

    const uniqueTokens = Array.from(new Set(tokens))
      .filter(token => 
        commonTokens.includes(token) || 
        /^[a-z0-9]+$/.test(token)
      )
      .slice(0, 5);

    const hints = [];
    if (query.includes('price')) hints.push('PRICE_QUERY');
    if (query.includes('compare') || query.includes('vs') || query.includes('versus')) hints.push('COMPARISON');
    if (query.includes('trend')) hints.push('TREND_ANALYSIS');
    if (query.includes('how') || query.includes('what')) hints.push('EDUCATIONAL');
    if (uniqueTokens.length > 1) hints.push('MULTI_TOKEN');
    if (query.includes('news') || query.includes('latest')) hints.push('NEWS');
    if (query.includes('regulation') || query.includes('legal')) hints.push('REGULATORY');
    if (query.includes('security') || query.includes('safe')) hints.push('SECURITY');
    if (query.includes('defi') || query.includes('yield')) hints.push('DEFI');

    return {
      tokens: uniqueTokens,
      entities: uniqueTokens.filter(token => commonTokens.includes(token)),
      contextualHints: hints
    };
  } catch (error) {
    throw new PreprocessingError(
      'Metadata extraction failed',
      'metadata',
      query
    );
  }
}

async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof Error && error.message.includes('rate limit')) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

export async function analyzeUserQuery(input: Agent1Input): Promise<RobustAnalysis> {
  try {
    const startTime = Date.now();
    const preprocessingSteps = preprocessQuery(input.query);
    const metadata = extractMetadata(input.query, preprocessingSteps);

    const client = getOpenAIClient();
    const completion = await retryWithExponentialBackoff(async () => {
      return client.createChatCompletion({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: preprocessingSteps[preprocessingSteps.length - 1].output }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });
    });

    const response = completion.data.choices[0]?.message?.content;
    if (!response) {
      throw new LLMError('No response from OpenAI');
    }

    const parsedResponse = validateLLMResponse(response);
    
    const analysis: RobustAnalysis = {
      originalContext: {
        rawQuery: input.query,
        timestamp: startTime,
        preprocessingSteps,
        metadata
      },
      classification: parsedResponse.classification,
      queryAnalysis: parsedResponse.queryAnalysis,
      dataRequirements: parsedResponse.dataRequirements
    };

    validateAnalysis(analysis);

    return analysis;

  } catch (error) {
    console.error('Intent analysis error:', error);
    
    if (error instanceof PreprocessingError) {
      throw new Error(`Preprocessing failed at ${error.step}: ${error.message}`);
    }
    if (error instanceof LLMError) {
      throw new Error(`LLM error: ${error.message}`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error during analysis');
  }
}