interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class TokenCache {
  protected cache: Map<string, CacheEntry<any>>;
  protected readonly TTL: number;

  constructor(ttl: number = 60000) { // Default 1 minute cache
    this.cache = new Map();
    this.TTL = ttl;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any): void {
    if (Object.keys(data).length > 0) {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
  }

  getPartial(keys: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key of keys) {
      const data = this.get(key);
      if (data) {
        Object.assign(result, { [key]: data });
      }
    }
    return result;
  }

  setPartial(keys: string[], data: Record<string, any>): void {
    // Store combined data
    this.set(keys.sort().join(','), data);
    
    // Store individual entries
    for (const [key, value] of Object.entries(data)) {
      this.set(key, { [key]: value });
    }
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}