/**
 * Blockchain Session Manager
 * 
 * This module provides session management for blockchain operations,
 * allowing wallet connections to persist between requests.
 */

import { WalletIntegrationService } from './wallet-integration';
import { USE_MOCKS } from './config';

// Map to store wallet connections by session ID
interface SessionData {
  walletService: WalletIntegrationService;
  address: `0x${string}`;
  lastActive: number;
  chainId?: number;
}

class BlockchainSessionManager {
  private sessions: Map<string, SessionData> = new Map();
  
  // Session timeout in milliseconds (30 minutes)
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;
  
  /**
   * Get wallet service for a session
   * @param sessionId Session ID
   * @returns Wallet service if connected, undefined otherwise
   */
  getWalletService(sessionId: string): WalletIntegrationService | undefined {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      // Update last active time
      session.lastActive = Date.now();
      return session.walletService;
    }
    
    return undefined;
  }
  
  /**
   * Get wallet address for a session
   * @param sessionId Session ID
   * @returns Wallet address if connected, undefined otherwise
   */
  getWalletAddress(sessionId: string): `0x${string}` | undefined {
    const session = this.sessions.get(sessionId);
    return session?.address;
  }
  
  /**
   * Check if a session has a connected wallet
   * @param sessionId Session ID
   * @returns true if wallet is connected, false otherwise
   */
  isWalletConnected(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    // Verify wallet is still connected
    return session.walletService.isConnected();
  }
  
  /**
   * Store a wallet connection for a session
   * @param sessionId Session ID
   * @param walletService Wallet service instance
   * @param address Wallet address
   * @param chainId Chain ID
   */
  storeConnection(
    sessionId: string,
    walletService: WalletIntegrationService,
    address: `0x${string}`,
    chainId?: number
  ): void {
    this.sessions.set(sessionId, {
      walletService,
      address,
      lastActive: Date.now(),
      chainId
    });
    
    // Start cleanup timer if not already running
    this.scheduleCleanup();
  }
  
  /**
   * Remove a wallet connection for a session
   * @param sessionId Session ID
   */
  removeConnection(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      // Disconnect wallet
      session.walletService.disconnect();
      // Remove session
      this.sessions.delete(sessionId);
    }
  }
  
  /**
   * Create and connect a new wallet for a session
   * @param sessionId Session ID
   * @param provider Wallet provider
   * @param chainId Chain ID
   * @returns Connected wallet address
   */
  async connectWallet(
    sessionId: string,
    provider: string,
    chainId?: number
  ): Promise<`0x${string}`> {
    // First check if session already has a wallet
    if (this.isWalletConnected(sessionId)) {
      return this.getWalletAddress(sessionId)!;
    }
    
    // Create a new wallet service
    const walletService = new WalletIntegrationService();
    
    // Connect wallet
    const address = await walletService.connect({
      type: provider as any,
      chainId: chainId || 1
    });
    
    // Store connection
    this.storeConnection(sessionId, walletService, address, chainId);
    
    return address;
  }
  
  /**
   * Clean up expired sessions
   */
  private cleanupSessions(): void {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.SESSION_TIMEOUT) {
        this.removeConnection(sessionId);
      }
    }
  }
  
  /**
   * Schedule periodic cleanup of expired sessions
   */
  private scheduleCleanup(): void {
    // Run cleanup every 5 minutes
    setInterval(() => this.cleanupSessions(), 5 * 60 * 1000);
  }
}

// Export singleton instance
export const sessionManager = new BlockchainSessionManager(); 