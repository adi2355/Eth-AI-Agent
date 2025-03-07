import { cacheHits, cacheMisses } from './monitoring';

const CACHE_TTL = 60 * 5; // 5 minutes

class InMemoryCache {
  private cache: Map<string, { data: any; expires: number }>;

  constructor() {
    this.cache = new Map();
  }

  private generateKey(query: string, params: any): string {
    return `blockchain:${query}:${JSON.stringify(params)}`;
  }

  async get<T>(query: string, params: any): Promise<T | null> {
    try {
      const key = this.generateKey(query, params);
      const cached = this.cache.get(key);

      if (cached && Date.now() < cached.expires) {
        cacheHits.add(1);
        return cached.data;
      }

      if (cached) {
        this.cache.delete(key); // Clean up expired entry
      }

      cacheMisses.add(1);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(query: string, params: any, data: any): Promise<void> {
    try {
      const key = this.generateKey(query, params);
      this.cache.set(key, {
        data,
        expires: Date.now() + CACHE_TTL * 1000,
      });

      // Clean up old entries periodically
      if (this.cache.size > 1000) { // Arbitrary limit
        this.cleanup();
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new InMemoryCache();