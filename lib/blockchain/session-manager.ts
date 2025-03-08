/**
 * Blockchain Session Manager
 * 
 * This module provides session management for blockchain operations,
 * allowing wallet connections to persist between requests.
 */

import { WalletIntegrationService, WalletType } from './wallet-integration';
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
  private cleanupTimer: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly DEFAULT_SESSION_ID = 'default-session';
  
  /**
   * Normalize session ID to handle undefined or empty strings
   * @param sessionId Session ID or undefined
   * @returns Normalized session ID
   */
  private normalizeSessionId(sessionId?: string): string {
    // If sessionId is undefined, empty, or null, use default session ID
    if (!sessionId) {
      console.log('SessionManager: Using default session ID due to undefined/empty session ID');
      return this.DEFAULT_SESSION_ID;
    }
    return sessionId;
  }
  
  /**
   * Get the wallet service for a session
   * @param sessionId Session ID
   * @returns WalletIntegrationService for the session or undefined if not found
   */
  getWalletService(sessionId: string): WalletIntegrationService | undefined {
    // Normalize session ID
    const normalizedSessionId = this.normalizeSessionId(sessionId);
    
    console.log(`SessionManager: Getting wallet service for session: ${normalizedSessionId}`, {
      sessionExists: this.sessions.has(normalizedSessionId),
      activeSessions: Array.from(this.sessions.keys()),
      totalSessions: this.sessions.size,
      originalSessionId: sessionId,
      usingNormalizedId: normalizedSessionId !== sessionId
    });
    
    const session = this.sessions.get(normalizedSessionId);
    
    if (session) {
      // Update last active time
      session.lastActive = Date.now();
      
      console.log(`SessionManager: Found session for ${normalizedSessionId}`, {
        walletServiceExists: !!session.walletService,
        walletAddress: session.address,
        chainId: session.chainId,
        walletIsConnected: session.walletService.isConnected(),
        mockConnection: session.walletService.getAddress() === '0x0000000000000000000000000000000000000000'
      });
      
      return session.walletService;
    }
    
    console.log(`SessionManager: No session found for ${normalizedSessionId}`);
    return undefined;
  }
  
  /**
   * Get the wallet address for a session
   * @param sessionId Session ID
   * @returns Wallet address if connected, undefined otherwise
   */
  getWalletAddress(sessionId: string): `0x${string}` | undefined {
    // Normalize session ID
    const normalizedSessionId = this.normalizeSessionId(sessionId);
    
    console.log(`SessionManager: Getting wallet address for session: ${normalizedSessionId}`);
    const session = this.sessions.get(normalizedSessionId);
    
    if (session) {
      console.log(`SessionManager: Found address for session ${normalizedSessionId}: ${session.address}`);
      return session.address;
    }
    
    console.log(`SessionManager: No address found for session ${normalizedSessionId}`);
    return undefined;
  }
  
  /**
   * Check if a wallet is connected for a session
   * @param sessionId Session ID
   * @returns True if wallet is connected, false otherwise
   */
  isWalletConnected(sessionId: string): boolean {
    // Normalize session ID
    const normalizedSessionId = this.normalizeSessionId(sessionId);
    
    console.log(`SessionManager: Checking if wallet is connected for session: ${normalizedSessionId}`);
    const session = this.sessions.get(normalizedSessionId);
    
    if (!session) {
      console.log(`SessionManager: No session found for ${normalizedSessionId}`);
      return false;
    }
    
    const isConnected = session.walletService.isConnected();
    console.log(`SessionManager: Wallet connection status for ${normalizedSessionId}: ${isConnected}`);
    return isConnected;
  }
  
  /**
   * Store a wallet connection for a session
   * @param sessionId Session ID
   * @param walletService Wallet service
   * @param address Wallet address
   * @param chainId Chain ID
   */
  storeConnection(
    sessionId: string,
    walletService: WalletIntegrationService,
    address: `0x${string}`,
    chainId?: number
  ): void {
    // Normalize session ID
    const normalizedSessionId = this.normalizeSessionId(sessionId);
    
    console.log(`SessionManager: Storing connection for session ${normalizedSessionId}`, {
      address,
      chainId,
      originalSessionId: sessionId,
      usingNormalizedId: normalizedSessionId !== sessionId,
      isMockAddress: address === '0x0000000000000000000000000000000000000000'
    });
    
    // For mock connections, set the mock address
    if (address === '0x0000000000000000000000000000000000000000') {
      console.log(`SessionManager: Setting mock address for session ${normalizedSessionId}`);
      walletService.setMockAddress(address);
    }
    
    this.sessions.set(normalizedSessionId, {
      walletService,
      address,
      lastActive: Date.now(),
      chainId
    });
    
    console.log(`SessionManager: Stored connection for session ${normalizedSessionId}`, {
      address,
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.keys())
    });
    
    // Make sure cleanup is scheduled
    this.scheduleCleanup();
  }
  
  /**
   * Remove a wallet connection for a session
   * @param sessionId Session ID
   */
  removeConnection(sessionId: string): void {
    // Normalize session ID
    const normalizedSessionId = this.normalizeSessionId(sessionId);
    
    console.log(`SessionManager: Removing connection for session ${normalizedSessionId}`);
    
    if (this.sessions.has(normalizedSessionId)) {
      this.sessions.delete(normalizedSessionId);
      console.log(`SessionManager: Connection removed for session ${normalizedSessionId}`);
    } else {
      console.log(`SessionManager: No connection found to remove for session ${normalizedSessionId}`);
    }
  }
  
  /**
   * Connect a wallet for a session
   * @param sessionId Session ID
   * @param provider Wallet provider type
   * @param chainId Chain ID to connect to
   * @returns Connected wallet address
   */
  async connectWallet(
    sessionId: string,
    provider: string,
    chainId?: number
  ): Promise<`0x${string}`> {
    // Normalize session ID
    const normalizedSessionId = this.normalizeSessionId(sessionId);
    
    console.log('SessionManager: Connecting wallet', {
      sessionId: normalizedSessionId,
      originalSessionId: sessionId,
      usingNormalizedId: normalizedSessionId !== sessionId,
      provider,
      chainId,
      mocksEnabled: USE_MOCKS,
      isServer: typeof window === 'undefined',
      existingSessions: Array.from(this.sessions.keys())
    });
    
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      console.log('SessionManager: Server-side wallet connection requested, using consistent address');
      
      // Use the SAME fixed address to ensure consistency with blockchain-test page
      const mockAddress = '0x87a89B578e769F172440581A4E3DE6823dd116bB';
      
      // Create a mock wallet service
      const walletService = new WalletIntegrationService();
      walletService.setMockAddress(mockAddress);
      
      // Store the connection
      this.storeConnection(normalizedSessionId, walletService, mockAddress, chainId);
      
      console.log(`SessionManager: Created mock wallet connection for server-side session ${normalizedSessionId} with address ${mockAddress}`);
      return mockAddress;
    }
    
    // For browser environments, use the real wallet connection
    console.log(`SessionManager: Attempting to connect to ${provider} wallet in browser environment`);
    const walletService = new WalletIntegrationService();
    
    try {
      const address = await walletService.connect(provider as WalletType, { 
        type: provider as WalletType,
        chainId 
      });
      
      console.log(`SessionManager: Successfully connected to wallet:`, {
        address,
        provider,
        chainId
      });
      
      // Store the connection
      this.storeConnection(normalizedSessionId, walletService, address, chainId);
      
      return address;
    } catch (error) {
      console.error('SessionManager: Error connecting wallet:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        sessionId: normalizedSessionId,
        provider
      });
      throw error;
    }
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