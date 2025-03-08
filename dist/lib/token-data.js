"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendingTokens = getTrendingTokens;
exports.getTokenDetails = getTokenDetails;
exports.getTokenPrices = getTokenPrices;
const env_config_1 = require("./env-config");
async function fetchCoinGecko(endpoint) {
    const response = await fetch(`${(0, env_config_1.getApiBaseUrl)('COINGECKO')}${endpoint}`, {
        headers: {
            'x-cg-pro-api-key': (0, env_config_1.getApiKey)('COINGECKO'),
            'Accept': 'application/json'
        }
    });
    if (!response.ok) {
        if (response.status === 429) {
            throw new Error('CoinGecko rate limit exceeded');
        }
        throw new Error(`CoinGecko API error: ${response.status}`);
    }
    return response;
}
async function fetchCoinMarketCap(endpoint) {
    const response = await fetch(`${(0, env_config_1.getApiBaseUrl)('COINMARKETCAP')}${endpoint}`, {
        headers: {
            'X-CMC_PRO_API_KEY': (0, env_config_1.getApiKey)('COINMARKETCAP'),
            'Accept': 'application/json'
        }
    });
    if (!response.ok) {
        if (response.status === 429) {
            throw new Error('CoinMarketCap rate limit exceeded');
        }
        throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    const data = await response.json();
    if (data.status?.error_code) {
        throw new Error(`CoinMarketCap error: ${data.status.error_message}`);
    }
    return data.data;
}
async function getTrendingTokens() {
    try {
        if ((0, env_config_1.canCallCoinGecko)()) {
            const response = await fetchCoinGecko('/search/trending');
            const data = await response.json();
            (0, env_config_1.recordCoinGeckoCall)();
            if (data?.coins) {
                return data.coins;
            }
        }
        // Fallback to CoinMarketCap trending
        if ((0, env_config_1.canCallCoinMarketCap)()) {
            const data = await fetchCoinMarketCap('/cryptocurrency/trending/latest');
            (0, env_config_1.recordCoinMarketCapCall)();
            if (data) {
                // Transform to match CoinGecko format
                return data.map((coin) => ({
                    item: {
                        id: coin.slug,
                        coin_id: coin.id,
                        name: coin.name,
                        symbol: coin.symbol,
                        market_cap_rank: coin.cmc_rank,
                        thumb: coin.logo || '',
                        small: coin.logo || '',
                        large: coin.logo || '',
                        slug: coin.slug,
                        price_btc: coin.quote?.BTC?.price || 0,
                        score: 0
                    }
                }));
            }
        }
        return [];
    }
    catch (error) {
        console.error('Error fetching trending tokens:', error);
        return [];
    }
}
async function searchToken(query) {
    if (!query?.trim()) {
        throw new Error('Search query is required');
    }
    try {
        // Try CoinGecko first
        if ((0, env_config_1.canCallCoinGecko)()) {
            try {
                const response = await fetchCoinGecko(`/search?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (data.coins?.length > 0) {
                    // Find best match based on exact symbol/name match or highest market cap rank
                    const exactSymbolMatch = data.coins.find((coin) => coin.symbol.toLowerCase() === query.toLowerCase());
                    if (exactSymbolMatch) {
                        (0, env_config_1.recordCoinGeckoCall)();
                        return {
                            id: exactSymbolMatch.id,
                            symbol: exactSymbolMatch.symbol.toLowerCase(),
                            name: exactSymbolMatch.name
                        };
                    }
                    const exactNameMatch = data.coins.find((coin) => coin.name.toLowerCase() === query.toLowerCase());
                    if (exactNameMatch) {
                        (0, env_config_1.recordCoinGeckoCall)();
                        return {
                            id: exactNameMatch.id,
                            symbol: exactNameMatch.symbol.toLowerCase(),
                            name: exactNameMatch.name
                        };
                    }
                    // Otherwise return the highest ranked result
                    const bestMatch = data.coins.reduce((best, current) => {
                        return (current.market_cap_rank < best.market_cap_rank) ? current : best;
                    }, data.coins[0]);
                    (0, env_config_1.recordCoinGeckoCall)();
                    return {
                        id: bestMatch.id,
                        symbol: bestMatch.symbol.toLowerCase(),
                        name: bestMatch.name
                    };
                }
            }
            catch (error) {
                console.warn('CoinGecko search failed:', error);
            }
        }
        // Fallback to CoinMarketCap
        if ((0, env_config_1.canCallCoinMarketCap)()) {
            try {
                const data = await fetchCoinMarketCap(`/cryptocurrency/map?symbol=${encodeURIComponent(query)}`);
                if (data?.length > 0) {
                    // Sort by rank and take the best match
                    const bestMatch = data.sort((a, b) => a.rank - b.rank)[0];
                    (0, env_config_1.recordCoinMarketCapCall)();
                    return {
                        id: bestMatch.id.toString(),
                        symbol: bestMatch.symbol.toLowerCase(),
                        name: bestMatch.name
                    };
                }
            }
            catch (error) {
                console.warn('CoinMarketCap search failed:', error);
            }
        }
        return null;
    }
    catch (error) {
        console.error('Token search error:', error);
        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please try again in a moment.');
            }
            if (error.message.includes('API key')) {
                throw new Error('API configuration error. Please check your settings.');
            }
        }
        throw new Error('Failed to search for token');
    }
}
async function getTokenDetails(query) {
    if (!query?.trim()) {
        throw new Error('Token query is required');
    }
    try {
        // First search for the token
        const tokenMatch = await searchToken(query);
        if (!tokenMatch) {
            return null;
        }
        console.log(`Found token match:`, tokenMatch);
        // Try CoinGecko first
        if ((0, env_config_1.canCallCoinGecko)()) {
            try {
                const response = await fetchCoinGecko(`/coins/${tokenMatch.id}?localization=false&tickers=false&community_data=false&developer_data=false`);
                const data = await response.json();
                if (data?.market_data) {
                    (0, env_config_1.recordCoinGeckoCall)();
                    return {
                        id: data.id,
                        symbol: data.symbol,
                        name: data.name,
                        current_price: data.market_data.current_price.usd,
                        market_cap: data.market_data.market_cap.usd,
                        market_cap_rank: data.market_cap_rank,
                        total_volume: data.market_data.total_volume.usd,
                        high_24h: data.market_data.high_24h?.usd || null,
                        low_24h: data.market_data.low_24h?.usd || null,
                        price_change_24h: data.market_data.price_change_24h || 0,
                        price_change_percentage_24h: data.market_data.price_change_percentage_24h || 0,
                        circulating_supply: data.market_data.circulating_supply,
                        total_supply: data.market_data.total_supply,
                        max_supply: data.market_data.max_supply,
                        ath: data.market_data.ath?.usd || null,
                        ath_date: data.market_data.ath_date?.usd || null,
                        source: 'coingecko'
                    };
                }
            }
            catch (error) {
                console.warn('CoinGecko details fetch failed:', error);
            }
        }
        // Fallback to CoinMarketCap
        if ((0, env_config_1.canCallCoinMarketCap)()) {
            try {
                const data = await fetchCoinMarketCap(`/cryptocurrency/quotes/latest?symbol=${tokenMatch.symbol}`);
                if (data && data[tokenMatch.symbol]) {
                    const coinData = data[tokenMatch.symbol][0];
                    const quote = coinData.quote.USD;
                    (0, env_config_1.recordCoinMarketCapCall)();
                    return {
                        id: coinData.slug,
                        symbol: coinData.symbol.toLowerCase(),
                        name: coinData.name,
                        current_price: quote.price,
                        market_cap: quote.market_cap,
                        market_cap_rank: coinData.cmc_rank,
                        total_volume: quote.volume_24h,
                        high_24h: null, // Not available in this endpoint
                        low_24h: null, // Not available in this endpoint
                        price_change_24h: quote.volume_change_24h || 0,
                        price_change_percentage_24h: quote.percent_change_24h || 0,
                        circulating_supply: coinData.circulating_supply,
                        total_supply: coinData.total_supply,
                        max_supply: coinData.max_supply,
                        ath: null,
                        ath_date: null,
                        source: 'coinmarketcap'
                    };
                }
            }
            catch (error) {
                console.warn('CoinMarketCap details fetch failed:', error);
            }
        }
        throw new Error('Failed to fetch token details from all available sources');
    }
    catch (error) {
        console.error('Token details fetch error:', error);
        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please try again in a moment.');
            }
            if (error.message.includes('API key')) {
                throw new Error('API configuration error. Please check your settings.');
            }
        }
        return null;
    }
}
async function getTokenPrices(tokens) {
    const results = {};
    for (const token of tokens) {
        const tokenInfo = await getTokenDetails(token);
        if (tokenInfo) {
            results[token] = {
                current_price: tokenInfo.current_price,
                market_cap: tokenInfo.market_cap,
                price_change_percentage_24h: tokenInfo.price_change_percentage_24h,
                source: tokenInfo.source
            };
        }
    }
    return results;
}
