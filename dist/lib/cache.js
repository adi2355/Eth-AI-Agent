"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
const monitoring_1 = require("./monitoring");
const CACHE_TTL = 60 * 5; // 5 minutes
class InMemoryCache {
    constructor() {
        this.cache = new Map();
    }
    generateKey(query, params) {
        return `blockchain:${query}:${JSON.stringify(params)}`;
    }
    async get(query, params) {
        try {
            const key = this.generateKey(query, params);
            const cached = this.cache.get(key);
            if (cached && Date.now() < cached.expires) {
                monitoring_1.cacheHits.add(1);
                return cached.data;
            }
            if (cached) {
                this.cache.delete(key); // Clean up expired entry
            }
            monitoring_1.cacheMisses.add(1);
            return null;
        }
        catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    async set(query, params, data) {
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
        }
        catch (error) {
            console.error('Cache set error:', error);
        }
    }
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (value.expires < now) {
                this.cache.delete(key);
            }
        }
    }
}
exports.cache = new InMemoryCache();
