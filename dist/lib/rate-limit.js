"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRateLimit = withRateLimit;
const server_1 = require("next/server");
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute
class RateLimiter {
    constructor() {
        this.requests = new Map();
    }
    check(ip) {
        const now = Date.now();
        const requestData = this.requests.get(ip);
        if (!requestData || now > requestData.resetTime) {
            // First request or window expired
            this.requests.set(ip, {
                count: 1,
                resetTime: now + WINDOW_MS,
            });
            return true;
        }
        if (requestData.count >= MAX_REQUESTS) {
            return false;
        }
        // Increment request count
        requestData.count++;
        return true;
    }
    cleanup() {
        const now = Date.now();
        for (const [ip, data] of this.requests.entries()) {
            if (now > data.resetTime) {
                this.requests.delete(ip);
            }
        }
    }
}
const limiter = new RateLimiter();
// Clean up expired entries every minute
setInterval(() => limiter.cleanup(), WINDOW_MS);
function withRateLimit(handler) {
    return async function (req) {
        // Get IP from headers or use a default value
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
        if (!limiter.check(ip)) {
            return server_1.NextResponse.json({ error: 'Too many requests, please try again later.' }, { status: 429 });
        }
        return handler(req);
    };
}
