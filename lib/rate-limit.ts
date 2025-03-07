import { NextRequest, NextResponse } from 'next/server';

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.requests = new Map();
  }

  check(ip: string): boolean {
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

  cleanup(): void {
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

export function withRateLimit(handler: Function) {
  return async function (req: NextRequest) {
    // Get IP from headers or use a default value
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    
    if (!limiter.check(ip)) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        { status: 429 }
      );
    }

    return handler(req);
  };
}