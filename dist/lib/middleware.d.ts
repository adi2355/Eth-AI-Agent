import type { NextRequest } from 'next/server';
import { type UserRole } from './auth';
export declare function withAuth(handler: Function, requiredRole?: UserRole): (req: NextRequest) => Promise<any>;
