interface CacheEntry<T> {
    data: T;
    timestamp: number;
}
export declare class TokenCache {
    protected cache: Map<string, CacheEntry<any>>;
    protected readonly TTL: number;
    constructor(ttl?: number);
    get(key: string): any | null;
    set(key: string, data: any): void;
    getPartial(keys: string[]): Record<string, any>;
    setPartial(keys: string[], data: Record<string, any>): void;
    clear(): void;
    cleanup(): void;
}
export {};
