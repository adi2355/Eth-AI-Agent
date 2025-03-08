"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheMisses = exports.cacheHits = exports.graphqlErrors = exports.graphqlRequestDuration = exports.queryErrors = exports.queryDuration = exports.queryCounter = void 0;
class Counter {
    constructor() {
        this.value = 0;
    }
    add(n) {
        this.value += n;
    }
    get() {
        return this.value;
    }
}
class Duration {
    constructor() {
        this.durations = [];
    }
    record(duration) {
        this.durations.push(duration);
    }
    getAverage() {
        if (this.durations.length === 0)
            return 0;
        return this.durations.reduce((a, b) => a + b, 0) / this.durations.length;
    }
}
// Query metrics
exports.queryCounter = new Counter();
exports.queryDuration = new Duration();
exports.queryErrors = new Counter();
// GraphQL metrics
exports.graphqlRequestDuration = new Duration();
exports.graphqlErrors = new Counter();
// Cache metrics
exports.cacheHits = new Counter();
exports.cacheMisses = new Counter();
