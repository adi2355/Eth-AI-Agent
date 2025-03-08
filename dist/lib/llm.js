"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResponse = generateResponse;
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
// System prompt template for different query types
const SYSTEM_PROMPTS = {
    trending: `You are an expert cryptocurrency analyst specializing in market trends and token analysis. Your role is to:
1. Analyze the provided trending token data and their price movements
2. Highlight significant price changes and market movements
3. Provide brief, factual insights about each trending token
4. Format the response in a clear, easy-to-read manner
5. Only use the data provided - do not make assumptions or predictions

When discussing tokens:
- Always include the token symbol in uppercase
- Show percentage changes with 2 decimal places
- Format large numbers for readability (e.g., "$1.2M" instead of "1200000")
- Highlight significant movements (>5% changes)
- If price data is missing, acknowledge it explicitly`,
    tokenInfo: `You are a cryptocurrency token specialist providing detailed token analysis. Your role is to:
1. Present the token's key metrics clearly and accurately
2. Explain price movements and market position
3. Compare current prices to ATH when relevant
4. Format numbers for easy reading
5. Only use the provided data - no speculation or predictions

When presenting token information:
- Lead with the token's full name and symbol
- Format market cap and volume figures clearly
- Show price changes as percentages with 2 decimal places
- Include supply information when available
- If any key data is missing, acknowledge it explicitly`,
    transactions: `You are a blockchain transaction analyst specializing in DeFi activities. Your role is to:
1. Summarize recent transaction patterns
2. Identify significant swaps or liquidity events
3. Present transaction volumes clearly
4. Group similar transactions when relevant
5. Only discuss transactions in the provided data

When analyzing transactions:
- Format amounts with appropriate decimals
- Group similar transaction types together
- Highlight large value movements
- Show timestamps in a human-readable format
- If transaction details are incomplete, state it clearly`
};
async function generateResponse(query, data, context, options = { queryType: 'trending' }) {
    try {
        // Validate input data
        if (!query.trim()) {
            throw new Error('Query cannot be empty');
        }
        if (!data) {
            throw new Error('Data is required');
        }
        const client = getOpenAIClient();
        // Format data based on query type
        const formattedData = formatDataForPrompt(data, options.queryType);
        const systemPrompt = SYSTEM_PROMPTS[options.queryType];
        const userContext = context ? `Previous context:\n${context}\n\n` : '';
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${userContext}Available Data:\n${formattedData}\n\nUser Question: ${query}` }
        ];
        const completion = await client.createChatCompletion({
            model: OPENAI_MODEL,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 500,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
        });
        const response = completion.data.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response received from OpenAI');
        }
        return response;
    }
    catch (error) {
        console.error('LLM error:', error);
        // Improve error handling with specific error types
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                throw new Error('OpenAI API key is invalid or not configured');
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
        throw new Error('An unexpected error occurred while processing your request');
    }
}
function formatDataForPrompt(data, queryType) {
    if (!data)
        return 'No data available.';
    switch (queryType) {
        case 'trending':
            return formatTrendingData(data);
        case 'tokenInfo':
            return formatTokenInfo(data);
        case 'transactions':
            return formatTransactionData(data);
        default:
            return JSON.stringify(data, null, 2);
    }
}
function formatTrendingData(data) {
    if (!data.trending?.length)
        return 'No trending data available.';
    return data.trending.map(trend => {
        const price = data.prices[trend.item.id];
        return `Token: ${trend.item.name} (${trend.item.symbol.toUpperCase()})
- Market Cap Rank: ${trend.item.market_cap_rank ?? 'N/A'}
- Current Price: ${price?.current_price ? `$${price.current_price.toFixed(6)}` : 'N/A'}
- 24h Change: ${price?.price_change_percentage_24h ? `${price.price_change_percentage_24h.toFixed(2)}%` : 'N/A'}
- Market Cap: ${price?.market_cap ? `$${formatNumber(price.market_cap)}` : 'N/A'}`;
    }).join('\n\n');
}
function formatTokenInfo(data) {
    if (!data.tokenDetails?.length)
        return 'No token information available.';
    return data.tokenDetails.map(token => {
        const price = data.prices[token.id];
        return `Token: ${token.name} (${token.symbol.toUpperCase()})
Current Price: $${token.current_price?.toFixed(6) ?? 'N/A'}
Market Cap: $${formatNumber(token.market_cap)} (Rank #${token.market_cap_rank ?? 'N/A'})
24h Trading Volume: $${formatNumber(token.total_volume)}
24h Price Change: ${token.price_change_percentage_24h?.toFixed(2) ?? 'N/A'}%
24h Range: $${token.low_24h?.toFixed(6) ?? 'N/A'} - $${token.high_24h?.toFixed(6) ?? 'N/A'}
All-Time High: $${token.ath?.toFixed(6) ?? 'N/A'} (${token.ath_date ? new Date(token.ath_date).toLocaleDateString() : 'N/A'})
Supply Information:
- Circulating: ${formatNumber(token.circulating_supply)}
- Total: ${token.total_supply ? formatNumber(token.total_supply) : 'N/A'}
- Max: ${token.max_supply ? formatNumber(token.max_supply) : 'N/A'}`;
    }).join('\n\n');
}
function formatTransactionData(data) {
    if (!data?.transactions?.length)
        return 'No transaction data available.';
    return data.transactions.map((tx) => {
        let actionType = 'Unknown';
        let details = '';
        if (tx.swaps?.length) {
            actionType = 'Swap';
            const swap = tx.swaps[0];
            details = `${swap.pair.token0.symbol}/${swap.pair.token1.symbol} ($${parseFloat(swap.amountUSD).toFixed(2)})`;
        }
        else if (tx.mints?.length) {
            actionType = 'Liquidity Addition';
            const mint = tx.mints[0];
            details = `${mint.pair.token0.symbol}/${mint.pair.token1.symbol}`;
        }
        else if (tx.burns?.length) {
            actionType = 'Liquidity Removal';
            const burn = tx.burns[0];
            details = `${burn.pair.token0.symbol}/${burn.pair.token1.symbol}`;
        }
        return `Transaction Type: ${actionType}
Details: ${details}
Timestamp: ${new Date(tx.timestamp * 1000).toLocaleString()}`;
    }).join('\n\n');
}
function formatNumber(num) {
    if (num === null || num === undefined)
        return 'N/A';
    if (num >= 1e9) {
        return `${(num / 1e9).toFixed(2)}B`;
    }
    if (num >= 1e6) {
        return `${(num / 1e6).toFixed(2)}M`;
    }
    if (num >= 1e3) {
        return `${(num / 1e3).toFixed(2)}K`;
    }
    return num.toString();
}
