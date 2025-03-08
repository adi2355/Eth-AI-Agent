import { createWalletClient, http, custom, parseEther, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia, arbitrum } from 'viem/chains';
import { publicClient } from './providers';
import { USE_MOCKS } from './config';
import * as mockProvider from './mock-provider';

// Supported wallet types
export type WalletType = 'metamask' | 'walletconnect' | 'private-key' | 'hardware' | 'mock';

// Wallet connection options
export interface WalletConnectionOptions {
  type: WalletType;
  chainId?: number;
  privateKey?: string;
  rpcUrl?: string;
}

// Transaction options 
export interface TransactionOptions {
  to: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}

export class WalletIntegrationService {
  private walletClient: any = null;
  private connectedChainId: number | null = null;
  private connectedAddress: `0x${string}` = '0x0000000000000000000000000000000000000000';
  private pendingTransactions = new Map<string, any>();
  private walletType: WalletType | null = null;
  private address: `0x${string}` | null = null;
  private provider: any = null;
  private signer: any = null;
  private chainId: number = 1;
  private isMockConnection: boolean = false;

  /**
   * Set a mock wallet address for server-side operations
   * This allows the wallet to appear as connected without an actual wallet
   * @param address Mock wallet address
   */
  setMockAddress(address: `0x${string}`): void {
    this.address = address;
    this.walletType = 'mock';
    this.isMockConnection = true;
    
    // Create a self-contained mock wallet client that doesn't depend on USE_MOCKS
    this.walletClient = {
      sendTransaction: (options: any) => {
        console.log('Mock wallet client sendTransaction called with:', options);
        
        // Generate a mock transaction hash directly without using mockProvider
        return new Promise((resolve) => {
          setTimeout(() => {
            // Generate mock transaction hash
            const txHash = `0x${Math.floor(Math.random() * 10**16).toString(16).padStart(64, '0')}` as `0x${string}`;
            console.log(`Generated mock transaction hash: ${txHash}`);
            resolve(txHash);
          }, 1000);
        });
      },
      // Add other methods as needed
      getAddress: () => this.address,
      getChainId: () => this.chainId
    };
    
    console.log(`Set mock wallet address: ${address} with self-contained mock wallet client`, {
      walletClientInitialized: !!this.walletClient,
      mockMethods: this.walletClient ? Object.keys(this.walletClient) : []
    });
  }

  /**
   * Connect to a wallet
   * @param type Type of wallet to connect to
   * @param options Connection options
   * @returns Connected wallet address
   */
  async connect(
    type: WalletType = 'metamask',
    options: WalletConnectionOptions = { type: 'metamask' }
  ): Promise<`0x${string}`> {
    try {
      // Check if we're in a server environment
      if (typeof window === 'undefined') {
        console.log('Server-side wallet connection requested, returning mock address');
        // Return a mock address for server-side rendering
        return '0x0000000000000000000000000000000000000000';
      }
      
      // Use mock provider if mocks are enabled
      if (USE_MOCKS) {
        console.log('Using mock provider for wallet connection');
        const address = await mockProvider.mockConnect();
        this.connectedAddress = address;
        return this.connectedAddress;
      }
      
      const chainId = options.chainId || 1; // Default to Ethereum mainnet
      let chain;
      
      // Determine the chain
      switch (chainId) {
        case 1:
          chain = mainnet;
          break;
        case 11155111:
          chain = sepolia;
          break;
        case 42161:
          chain = arbitrum;
          break;
        default:
          throw new Error(`Chain ID ${chainId} not supported`);
      }

      // Connect based on wallet type
      switch (type) {
        case 'metamask':
          if (!window.ethereum) {
            throw new Error('MetaMask not detected in browser');
          }
          
          this.walletClient = createWalletClient({
            chain,
            transport: custom(window.ethereum)
          });
          
          // Request accounts
          const accounts = await this.walletClient.requestAddresses();
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found in MetaMask');
          }
          
          this.connectedAddress = accounts[0];
          break;
          
        case 'private-key':
          if (!options.privateKey) {
            throw new Error('Private key is required');
          }
          
          // Create account from private key
          const account = privateKeyToAccount(options.privateKey as `0x${string}`);
          
          this.walletClient = createWalletClient({
            account,
            chain,
            transport: http(options.rpcUrl || 'https://eth-mainnet.g.alchemy.com/v2/demo')
          });
          
          this.connectedAddress = account.address;
          break;
          
        case 'walletconnect':
          throw new Error('WalletConnect integration not implemented yet');
          
        case 'hardware':
          throw new Error('Hardware wallet integration not implemented yet');
          
        case 'mock':
          if (this.address) {
            this.connectedAddress = this.address;
          } else {
            this.connectedAddress = '0x0000000000000000000000000000000000000000';
          }
          break;
          
        default:
          throw new Error(`Wallet type ${type} not supported`);
      }

      this.connectedChainId = chainId;
      
      console.log(`Wallet connected: ${this.connectedAddress} on chain ${chainId}`);
      return this.connectedAddress;
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if wallet is connected
   * @returns True if wallet is connected
   */
  isConnected(): boolean {
    // For mock connections, always return true
    if (this.isMockConnection && this.address) {
      return true;
    }
    
    if (USE_MOCKS) {
      return mockProvider.mockIsConnected();
    }
    
    return !!this.walletClient && !!this.connectedAddress;
  }

  /**
   * Get connected wallet address
   * @returns Wallet address or null if not connected
   */
  getAddress(): `0x${string}` | null {
    if (USE_MOCKS) {
      return mockProvider.mockGetAddress() as `0x${string}`;
    }
    
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    return this.connectedAddress!;
  }

  /**
   * Send a transaction
   * @param options Transaction options
   * @returns Transaction hash
   */
  async sendTransaction(options: TransactionOptions): Promise<`0x${string}`> {
    console.log('WalletIntegrationService.sendTransaction called with:', {
      isConnected: this.isConnected(),
      walletClient: this.walletClient ? 'exists' : 'null',
      walletType: this.walletType,
      isMockConnection: this.isMockConnection,
      mockAddress: this.address || 'not set',
      options
    });

    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }

    try {
      // For mock connections, use the mock wallet client directly
      if (this.isMockConnection) {
        console.log('Using mock wallet client for transaction');
        return await this.walletClient.sendTransaction({
          account: this.address,
          ...options
        });
      }
      
      if (USE_MOCKS) {
        return mockProvider.mockSendTransaction(options);
      }

      if (!this.walletClient) {
        console.error('Wallet client is null despite isConnected() returning true');
        throw new Error('Wallet client not initialized');
      }

      // If gas parameters aren't provided, estimate them
      if (!options.maxFeePerGas || !options.maxPriorityFeePerGas) {
        // Use default gas parameters for now
        // In a real implementation, we would estimate these values
        options.maxFeePerGas = options.maxFeePerGas || BigInt(30000000000); // 30 gwei
        options.maxPriorityFeePerGas = options.maxPriorityFeePerGas || BigInt(1500000000); // 1.5 gwei
      }

      // Add gas limit if not provided
      if (!options.gasLimit) {
        // Use a default gas limit for now
        // In a real implementation, we would estimate this value
        options.gasLimit = BigInt(21000); // Standard ETH transfer gas
      }

      // Send transaction
      const hash = await this.walletClient.sendTransaction({
        account: this.connectedAddress,
        ...options
      });

      // Record pending transaction
      this.pendingTransactions.set(hash, {
        hash,
        to: options.to,
        value: options.value,
        data: options.data,
        status: 'pending',
        timestamp: Date.now()
      });

      return hash;
    } catch (error) {
      console.error('Transaction error:', error);
      throw new Error(`Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(hash: `0x${string}`, confirmations = 1): Promise<any> {
    if (USE_MOCKS) {
      return mockProvider.mockWaitForTransaction(hash, confirmations);
    }
    
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations
      });

      // Update the transaction status
      if (this.pendingTransactions.has(hash)) {
        const tx = this.pendingTransactions.get(hash);
        this.pendingTransactions.set(hash, {
          ...tx,
          status: receipt.status === 'success' ? 'confirmed' : 'failed',
          receipt
        });
      }

      return receipt;
    } catch (error) {
      console.error('Transaction confirmation error:', error);
      
      // Update the transaction status to failed
      if (this.pendingTransactions.has(hash)) {
        const tx = this.pendingTransactions.get(hash);
        this.pendingTransactions.set(hash, {
          ...tx,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  // Get pending transactions
  getPendingTransactions(): any[] {
    return Array.from(this.pendingTransactions.values()).filter(tx => tx.status === 'pending');
  }

  // Get transaction by hash
  getTransaction(hash: `0x${string}`): any {
    if (USE_MOCKS) {
      return mockProvider.mockGetTransaction(hash);
    }
    
    return this.pendingTransactions.get(hash) || null;
  }

  // Disconnect wallet
  disconnect(): void {
    if (USE_MOCKS) {
      mockProvider.mockDisconnect();
    }
    
    this.walletClient = null;
    this.connectedAddress = '0x0000000000000000000000000000000000000000';
    this.connectedChainId = null;
    console.log('Wallet disconnected');
  }

  // Helper function to convert ETH string to wei BigInt
  static parseEther(amount: string): bigint {
    return parseEther(amount);
  }

  // Helper function to convert Gwei string to wei BigInt
  static parseGwei(amount: string): bigint {
    return parseGwei(amount);
  }
}

// Export singleton instance
export const walletService = new WalletIntegrationService(); 