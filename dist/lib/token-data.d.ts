export interface TokenPrice {
    current_price: number;
    market_cap: number;
    price_change_percentage_24h: number;
    source: 'coingecko' | 'coinmarketcap';
}
export interface TokenInfo {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    total_volume: number;
    high_24h: number | null;
    low_24h: number | null;
    price_change_24h: number;
    price_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
    ath: number | null;
    ath_date: string | null;
    source: 'coingecko' | 'coinmarketcap';
}
export interface TokenTrend {
    item: {
        id: string;
        coin_id: number;
        name: string;
        symbol: string;
        market_cap_rank: number;
        thumb: string;
        small: string;
        large: string;
        slug: string;
        price_btc: number;
        score: number;
    };
}
export declare function getTrendingTokens(): Promise<TokenTrend[]>;
export declare function getTokenDetails(query: string): Promise<TokenInfo | null>;
export declare function getTokenPrices(tokens: string[]): Promise<Record<string, TokenPrice>>;
