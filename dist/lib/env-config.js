"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = void 0;
exports.canCallCoinGecko = canCallCoinGecko;
exports.canCallCoinMarketCap = canCallCoinMarketCap;
exports.recordCoinGeckoCall = recordCoinGeckoCall;
exports.recordCoinMarketCapCall = recordCoinMarketCapCall;
exports.isDevelopment = isDevelopment;
exports.isProduction = isProduction;
exports.getApiKey = getApiKey;
exports.getApiBaseUrl = getApiBaseUrl;
exports.getRateLimit = getRateLimit;
exports.getTimeUntilNextCall = getTimeUntilNextCall;
function validateEnv() {
    const requiredVars = [
        'COINGECKO_API_KEY',
        'COINMARKETCAP_API_KEY',
        'OPENAI_API_KEY'
    ];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    return {
        COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
        COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        NODE_ENV: process.env.NODE_ENV || 'development',
        API_RATE_LIMITS: {
            COINGECKO: parseInt(process.env.COINGECKO_RATE_LIMIT || '50'),
            COINMARKETCAP: parseInt(process.env.COINMARKETCAP_RATE_LIMIT || '30')
        },
        API_BASE_URLS: {
            COINGECKO: process.env.COINGECKO_API_BASE || 'https://api.coingecko.com/api/v3',
            COINMARKETCAP: process.env.COINMARKETCAP_API_BASE || 'https://pro-api.coinmarketcap.com/v1'
        }
    };
}
exports.envConfig = validateEnv();
// Rate limit tracking
let lastCoinGeckoCall = 0;
let lastCoinMarketCapCall = 0;
function canCallCoinGecko() {
    const now = Date.now();
    const timeSinceLastCall = now - lastCoinGeckoCall;
    const minInterval = (60 * 1000) / exports.envConfig.API_RATE_LIMITS.COINGECKO; // Convert rate per minute to ms interval
    return timeSinceLastCall >= minInterval;
}
function canCallCoinMarketCap() {
    const now = Date.now();
    const timeSinceLastCall = now - lastCoinMarketCapCall;
    const minInterval = (60 * 1000) / exports.envConfig.API_RATE_LIMITS.COINMARKETCAP;
    return timeSinceLastCall >= minInterval;
}
function recordCoinGeckoCall() {
    lastCoinGeckoCall = Date.now();
}
function recordCoinMarketCapCall() {
    lastCoinMarketCapCall = Date.now();
}
// Environment helpers
function isDevelopment() {
    return exports.envConfig.NODE_ENV === 'development';
}
function isProduction() {
    return exports.envConfig.NODE_ENV === 'production';
}
// API key access
function getApiKey(service) {
    switch (service) {
        case 'COINGECKO':
            return exports.envConfig.COINGECKO_API_KEY;
        case 'COINMARKETCAP':
            return exports.envConfig.COINMARKETCAP_API_KEY;
        case 'OPENAI':
            return exports.envConfig.OPENAI_API_KEY;
        default:
            throw new Error(`Unknown service: ${service}`);
    }
}
// API base URL access
function getApiBaseUrl(service) {
    return exports.envConfig.API_BASE_URLS[service];
}
// Rate limit info
function getRateLimit(service) {
    return exports.envConfig.API_RATE_LIMITS[service];
}
// Time until next allowed call
function getTimeUntilNextCall(service) {
    const now = Date.now();
    const lastCall = service === 'COINGECKO' ? lastCoinGeckoCall : lastCoinMarketCapCall;
    const minInterval = (60 * 1000) / getRateLimit(service);
    const timeUntilNext = Math.max(0, minInterval - (now - lastCall));
    return timeUntilNext;
}
