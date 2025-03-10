"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSummary = generateSummary;
const openai_1 = require("openai");
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
let openai = null;
function getOpenAIClient() {
    if (!openai) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key is not configured');
        }
        const configuration = new openai_1.Configuration({ apiKey });
        openai = new openai_1.OpenAIApi(configuration);
    }
    return openai;
}
function generateTokenPriceResponse(tokenName, data) {
    // Check if we have error information
    if (data?.error) {
        return `### ${tokenName} Price Information

I apologize, but I couldn't retrieve the current price for **${tokenName}**. This could be because:
- The token might not be listed on major exchanges
- The token symbol might be different than expected
- The token might only be available on specific platforms

To find accurate price information, you could:
1. Check decentralized exchanges (DEXs)
2. Visit the token's official website or community channels
3. Search with alternative token symbols
4. Check specialized crypto tracking platforms

Would you like to:
- Search for another token?
- Get information about major cryptocurrencies instead?
- Learn more about finding prices for newer tokens?`;
    }
    // Handle successful price data
    if (data?.current_price) {
        return `### Current ${tokenName} Price Data

**Price**: $${data.current_price.toFixed(6)}
**24h Change**: ${data.price_change_percentage_24h.toFixed(2)}%
**Market Cap**: $${formatMarketCap(data.market_cap)}

*Data source: ${data.source}*

Would you like to:
- See detailed market metrics?
- Compare with other tokens?
- View historical price data?`;
    }
    // Generic fallback response
    return `### ${tokenName} Price Query

I apologize, but I couldn't find current price information for **${tokenName}**. 
The token data might be unavailable or the token symbol might need verification.

Try checking:
- Popular crypto exchanges
- Token tracking websites
- The project's official channels

Would you like to search for a different token or get information about major cryptocurrencies instead?`;
}
function formatMarketCap(marketCap) {
    if (marketCap >= 1e9) {
        return `${(marketCap / 1e9).toFixed(2)}B`;
    }
    if (marketCap >= 1e6) {
        return `${(marketCap / 1e6).toFixed(2)}M`;
    }
    if (marketCap >= 1e3) {
        return `${(marketCap / 1e3).toFixed(2)}K`;
    }
    return marketCap.toString();
}
const SYSTEM_PROMPT = `You are an advanced blockchain and cryptocurrency analysis system providing detailed, accurate responses based on real-time market data, regulatory information, news, and comprehensive blockchain knowledge.

CONTEXT TYPES AND HANDLING:

1. Market Data (MARKET_DATA, COMPARISON):
   - Present prices with appropriate decimals (6 for < $1, 2 for >= $1)
   - Format market caps using B/M/K notation
   - Include percentage changes with +/- prefix
   - Show relevant volume and liquidity metrics
   - Compare multiple tokens when relevant

2. Technical Information (TECHNICAL):
   - Explain blockchain concepts clearly
   - Use appropriate technical terminology
   - Include code examples when relevant
   - Reference specific protocols or standards
   - Explain security implications

3. DeFi Analysis (DEFI):
   - Present TVL and yield data
   - Explain protocol mechanisms
   - Discuss risks and security considerations
   - Compare with similar protocols
   - Include liquidity metrics

4. Regulatory Updates (REGULATORY):
   - Summarize latest regulatory developments
   - Specify jurisdictions affected
   - Explain potential impact
   - Include compliance requirements
   - Reference official sources
   - Present risk assessments when available

5. News and Events (NEWS_EVENTS):
   - Summarize recent developments
   - Provide context and implications
   - Include relevant dates
   - Reference multiple sources
   - Maintain objectivity

6. Security Analysis (SECURITY):
   - Present risk assessments
   - Explain vulnerabilities
   - Provide security recommendations
   - Reference audits and incidents
   - Include best practices

RESPONSE STRUCTURE:

1. Market Data Format:
   - Prices: 6 decimals for < $1, 2 decimals for >= $1
   - Market Cap: Use B/M/K notation (e.g., $50.5B)
   - Percentages: Include +/- prefix, 2 decimal places
   - Time References: Include timezone or relative time

2. Regulatory Format:
   - Jurisdiction: Clearly state affected regions
   - Status: Indicate if proposed/enacted/under review
   - Impact: HIGH/MEDIUM/LOW classification
   - Compliance: List specific requirements
   - Sources: Reference official documentation

3. News Format:
   - Date: Recent first, include timestamps
   - Source: Credit reputable sources
   - Impact: Explain significance
   - Context: Provide background
   - Follow-up: Suggest related queries

4. Technical Format:
   - Concepts: Clear explanations
   - Code: Properly formatted examples
   - Standards: Reference specifications
   - Security: Note important considerations
   - Resources: Link to documentation

CRITICAL REQUIREMENTS:

1. Accuracy:
   - Never invent or estimate missing data
   - Clearly indicate data sources
   - Acknowledge limitations
   - State when information is incomplete
   - Update timestamps for time-sensitive data

2. Clarity:
   - Use appropriate technical terms
   - Explain complex concepts
   - Structure information logically
   - Highlight important points
   - Maintain consistent formatting

3. Context:
   - Reference relevant background
   - Explain implications
   - Compare with alternatives
   - Note important caveats
   - Suggest related queries

4. Sources:
   - Credit data providers
   - Reference official documents
   - Link to specifications
   - Cite regulatory bodies
   - Include timestamps

5. Response Formatting:
   - Use markdown for formatting
   - Create clear sections with headers
   - Use bullet points for lists
   - Format code blocks properly
   - Include line breaks for readability

6. Error Handling:
   - Acknowledge missing data
   - Explain why data might be unavailable
   - Suggest alternative sources
   - Provide guidance for finding information
   - Recommend follow-up queries

7. Conversation Continuity:
   - Reference previous context when relevant
   - Build upon earlier discussions
   - Maintain consistent terminology
   - Track user preferences
   - Suggest logical next queries`;
async function generateSummary(input) {
    const { userQuery, analysis, aggregatorResult, sessionId, enhancedContext } = input;
    try {
        const client = getOpenAIClient();
        // Check if we have any valid data
        const hasValidData = aggregatorResult?.primary?.coingecko ||
            aggregatorResult?.primary?.coinmarketcap;
        // If this is a price query and we have token data, use the specialized formatter
        if (analysis.classification.primaryIntent === 'MARKET_DATA' &&
            analysis.queryAnalysis.detectedTokens.length === 1) {
            const tokenName = analysis.queryAnalysis.detectedTokens[0];
            const tokenData = aggregatorResult?.primary?.coingecko?.[tokenName] ||
                aggregatorResult?.primary?.coinmarketcap?.[tokenName];
            if (tokenData) {
                return generateTokenPriceResponse(tokenName, tokenData);
            }
        }
        // Format the system message to include context handling instructions
        const systemMessage = `${SYSTEM_PROMPT}\n\nWhen generating responses:
1. Consider the user's technical level and interests
2. Maintain conversation continuity with previous topics
3. Use appropriate terminology based on user's expertise
4. Reference relevant history when appropriate
5. Adapt explanation depth based on user preferences`;
        // Build the conversation context
        const messages = [
            { role: "system", content: systemMessage }
        ];
        // Add enhanced context if available
        if (enhancedContext) {
            messages.push({
                role: "system",
                content: `Conversation Context:\n${enhancedContext}`
            });
        }
        // If no valid data, provide a helpful response
        if (!hasValidData && analysis.classification.needsApiCall) {
            messages.push({
                role: "system",
                content: `Generate a helpful response for a failed data fetch. Query: "${userQuery}". 
Consider:
1. Common reasons for missing data
2. Alternative ways to find the information
3. Suggestions for similar tokens or topics
4. Guidance on verifying token information
5. Next steps the user can take`
            });
        }
        else {
            // Add the current query and data
            messages.push({
                role: "system",
                content: `Query: ${userQuery}\n\nAnalysis Context:\n${JSON.stringify(analysis, null, 2)}\n\nAvailable Data:\n${JSON.stringify(aggregatorResult, null, 2)}`
            });
        }
        const completion = await client.createChatCompletion({
            model: OPENAI_MODEL,
            messages,
            temperature: 0.3,
            max_tokens: 700,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        });
        const response = completion.data.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response from GPT');
        }
        return response.trim();
    }
    catch (error) {
        console.error('Summary generation error:', error);
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                throw new Error('OpenAI API key is not configured');
            }
            if (error.message.includes('429')) {
                throw new Error('Rate limit exceeded. Please try again in a moment');
            }
            if (error.message.includes('401')) {
                throw new Error('Authentication failed. Please check API key configuration');
            }
            if (error.message.includes('insufficient_quota')) {
                throw new Error('OpenAI API quota exceeded. Please try again later');
            }
            throw error;
        }
        throw new Error('Failed to generate summary');
    }
}
