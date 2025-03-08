interface EnvConfig {
    COINGECKO_API_KEY: string;
    COINMARKETCAP_API_KEY: string;
    OPENAI_API_KEY: string;
    NODE_ENV: string;
    API_RATE_LIMITS: {
        COINGECKO: number;
        COINMARKETCAP: number;
    };
    API_BASE_URLS: {
        COINGECKO: string;
        COINMARKETCAP: string;
    };
}
export declare const envConfig: EnvConfig;
export declare function canCallCoinGecko(): boolean;
export declare function canCallCoinMarketCap(): boolean;
export declare function recordCoinGeckoCall(): void;
export declare function recordCoinMarketCapCall(): void;
export declare function isDevelopment(): boolean;
export declare function isProduction(): boolean;
export declare function getApiKey(service: 'COINGECKO' | 'COINMARKETCAP' | 'OPENAI'): string;
export declare function getApiBaseUrl(service: 'COINGECKO' | 'COINMARKETCAP'): string;
export declare function getRateLimit(service: 'COINGECKO' | 'COINMARKETCAP'): number;
export declare function getTimeUntilNextCall(service: 'COINGECKO' | 'COINMARKETCAP'): number;
export {};
