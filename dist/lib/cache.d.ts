declare class InMemoryCache {
    private cache;
    constructor();
    private generateKey;
    get<T>(query: string, params: any): Promise<T | null>;
    set(query: string, params: any, data: any): Promise<void>;
    private cleanup;
}
export declare const cache: InMemoryCache;
export {};
