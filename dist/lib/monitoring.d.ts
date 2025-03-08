declare class Counter {
    private value;
    add(n: number): void;
    get(): number;
}
declare class Duration {
    private durations;
    record(duration: number): void;
    getAverage(): number;
}
export declare const queryCounter: Counter;
export declare const queryDuration: Duration;
export declare const queryErrors: Counter;
export declare const graphqlRequestDuration: Duration;
export declare const graphqlErrors: Counter;
export declare const cacheHits: Counter;
export declare const cacheMisses: Counter;
export {};
