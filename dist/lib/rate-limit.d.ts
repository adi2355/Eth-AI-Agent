import { NextRequest } from 'next/server';
export declare function withRateLimit(handler: Function): (req: NextRequest) => Promise<any>;
