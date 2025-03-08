declare function cachedRequest<T = any>(document: string, variables?: Record<string, any>): Promise<T>;
export declare const graphClient: {
    request: typeof cachedRequest;
};
export {};
