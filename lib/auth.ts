import { verifyMessage } from 'viem';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SESSION_DURATION = '24h';

export type UserRole = 'basic' | 'advanced';

export interface AuthenticatedUser {
  address: string;
  role: UserRole;
  nonce: string;
}

// Store nonces in memory (use Redis in production)
const nonces = new Map<string, { value: string; expires: number }>();

export function generateNonce(): string {
  return createHash('sha256')
    .update(Math.random().toString())
    .digest('hex');
}

export function storeNonce(address: string): string {
  const nonce = generateNonce();
  nonces.set(address.toLowerCase(), {
    value: nonce,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
  return nonce;
}

export function verifyNonce(address: string, nonce: string): boolean {
  const storedNonce = nonces.get(address.toLowerCase());
  if (!storedNonce) return false;
  if (Date.now() > storedNonce.expires) return false;
  return storedNonce.value === nonce;
}

export async function verifySignature(message: string, signature: string, address: string): Promise<AuthenticatedUser> {
  try {
    const isValid = await verifyMessage({
      message,
      signature: signature as `0x${string}`,
      address: address as `0x${string}`,
    });
    
    if (!isValid) throw new Error('Invalid signature');
    
    // Here you could look up the user's role in a database
    // For now, we'll assign 'basic' to all new users
    const user: AuthenticatedUser = {
      address,
      role: 'basic',
      nonce: generateNonce(),
    };

    return user;
  } catch (error) {
    throw new Error('Signature verification failed');
  }
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      sub: user.address,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: SESSION_DURATION }
  );
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      address: decoded.sub,
      role: decoded.role,
      nonce: generateNonce(),
    };
  } catch {
    return null;
  }
}