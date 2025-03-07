import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, type UserRole, type AuthenticatedUser } from './auth';

export function withAuth(handler: Function, requiredRole?: UserRole) {
  return async function (req: NextRequest) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (requiredRole && user.role !== requiredRole) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Pass the user to the handler function instead of modifying the request
    return handler(req, user);
  };
}