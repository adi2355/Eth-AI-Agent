"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenCache = void 0;
class TokenCache {
    constructor(ttl = 60000) {
        this.cache = new Map();
        this.TTL = ttl;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    set(key, data) {
        if (Object.keys(data).length > 0) {
            this.cache.set(key, {
                data,
                timestamp: Date.now()
            });
        }
    }
    getPartial(keys) {
        const result = {};
        for (const key of keys) {
            const data = this.get(key);
            if (data) {
                Object.assign(result, { [key]: data });
            }
        }
        return result;
    }
    setPartial(keys, data) {
        // Store combined data
        this.set(keys.sort().join(','), data);
        // Store individual entries
        for (const [key, value] of Object.entries(data)) {
            this.set(key, { [key]: value });
        }
    }
    clear() {
        this.cache.clear();
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.TTL) {
                this.cache.delete(key);
            }
        }
    }
}
exports.TokenCache = TokenCache;
