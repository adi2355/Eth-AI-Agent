export type UserRole = 'basic' | 'advanced';
export interface AuthenticatedUser {
    address: string;
    role: UserRole;
    nonce: string;
}
export declare function generateNonce(): string;
export declare function storeNonce(address: string): string;
export declare function verifyNonce(address: string, nonce: string): boolean;
export declare function verifySignature(message: string, signature: string, address: string): Promise<AuthenticatedUser>;
export declare function generateToken(user: AuthenticatedUser): string;
export declare function verifyToken(token: string): AuthenticatedUser | null;
