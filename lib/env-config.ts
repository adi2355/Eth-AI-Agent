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

function validateEnv(): EnvConfig {
  const requiredVars = [
    'COINGECKO_API_KEY',
    'COINMARKETCAP_API_KEY',
    'OPENAI_API_KEY'
  ];

  const missingVars = requiredVars.filter(
    varName => !process.env[varName]
  );

  // In development mode, use placeholder values for missing variables
  const isDev = process.env.NODE_ENV === 'development';
  
  if (missingVars.length > 0 && !isDev) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY || (isDev ? 'development_key' : ''),
    COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY || (isDev ? 'development_key' : ''),
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || (isDev ? 'development_key' : ''),
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

export const envConfig = validateEnv();

// Rate limit tracking
let lastCoinGeckoCall = 0;
let lastCoinMarketCapCall = 0;

export function canCallCoinGecko(): boolean {
  const now = Date.now();
  const timeSinceLastCall = now - lastCoinGeckoCall;
  const minInterval = (60 * 1000) / envConfig.API_RATE_LIMITS.COINGECKO; // Convert rate per minute to ms interval
  return timeSinceLastCall >= minInterval;
}

export function canCallCoinMarketCap(): boolean {
  const now = Date.now();
  const timeSinceLastCall = now - lastCoinMarketCapCall;
  const minInterval = (60 * 1000) / envConfig.API_RATE_LIMITS.COINMARKETCAP;
  return timeSinceLastCall >= minInterval;
}

export function recordCoinGeckoCall(): void {
  lastCoinGeckoCall = Date.now();
}

export function recordCoinMarketCapCall(): void {
  lastCoinMarketCapCall = Date.now();
}

// Environment helpers
export function isDevelopment(): boolean {
  return envConfig.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return envConfig.NODE_ENV === 'production';
}

// API key access
export function getApiKey(service: 'COINGECKO' | 'COINMARKETCAP' | 'OPENAI'): string {
  switch (service) {
    case 'COINGECKO':
      return envConfig.COINGECKO_API_KEY;
    case 'COINMARKETCAP':
      return envConfig.COINMARKETCAP_API_KEY;
    case 'OPENAI':
      return envConfig.OPENAI_API_KEY;
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

// API base URL access
export function getApiBaseUrl(service: 'COINGECKO' | 'COINMARKETCAP'): string {
  return envConfig.API_BASE_URLS[service];
}

// Rate limit info
export function getRateLimit(service: 'COINGECKO' | 'COINMARKETCAP'): number {
  return envConfig.API_RATE_LIMITS[service];
}

// Time until next allowed call
export function getTimeUntilNextCall(service: 'COINGECKO' | 'COINMARKETCAP'): number {
  const now = Date.now();
  const lastCall = service === 'COINGECKO' ? lastCoinGeckoCall : lastCoinMarketCapCall;
  const minInterval = (60 * 1000) / getRateLimit(service);
  const timeUntilNext = Math.max(0, minInterval - (now - lastCall));
  return timeUntilNext;
}