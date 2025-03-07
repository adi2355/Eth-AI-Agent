import { createWalletClient, http, custom, parseEther, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia, arbitrum } from 'viem/chains';
import { publicClient } from './providers';

// Supported wallet types
export type WalletType = 'metamask' | 'walletconnect' | 'private-key' | 'hardware';

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
  private connectedAddress: `0x${string}` | null = null;
  private pendingTransactions = new Map<string, any>();

  // Connect to a wallet
  async connect(options: WalletConnectionOptions): Promise<`0x${string}`> {
    try {
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
      switch (options.type) {
        case 'metamask':
          if (typeof window === 'undefined' || !window.ethereum) {
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
          
        default:
          throw new Error(`Wallet type ${options.type} not supported`);
      }

      this.connectedChainId = chainId;
      
      console.log(`Wallet connected: ${this.connectedAddress} on chain ${chainId}`);
      return this.connectedAddress;
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.walletClient !== null && this.connectedAddress !== null;
  }

  // Get connected address
  getAddress(): `0x${string}` {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    return this.connectedAddress!;
  }

  // Send a transaction
  async sendTransaction(options: TransactionOptions): Promise<`0x${string}`> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }

    try {
      // If gas parameters aren't provided, estimate them
      if (!options.maxFeePerGas || !options.maxPriorityFeePerGas) {
        const feeData = await publicClient.estimateFeesPerGas();
        options.maxFeePerGas = options.maxFeePerGas || feeData.maxFeePerGas;
        options.maxPriorityFeePerGas = options.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas;
      }

      // If gas limit isn't provided, estimate it
      if (!options.gasLimit) {
        const gasLimit = await publicClient.estimateGas({
          account: this.connectedAddress!,
          to: options.to,
          value: options.value || 0n,
          data: options.data
        });
        
        // Add a 20% buffer to the gas limit to be safe
        options.gasLimit = (gasLimit * 120n) / 100n;
      }

      // If nonce isn't provided, get the next nonce
      if (options.nonce === undefined) {
        options.nonce = await publicClient.getTransactionCount({
          address: this.connectedAddress!
        });
      }

      // Send the transaction
      const hash = await this.walletClient.sendTransaction({
        account: this.walletClient.account || this.connectedAddress!,
        to: options.to,
        value: options.value || 0n,
        data: options.data,
        gasLimit: options.gasLimit,
        maxFeePerGas: options.maxFeePerGas,
        maxPriorityFeePerGas: options.maxPriorityFeePerGas,
        nonce: options.nonce
      });

      // Store the pending transaction
      this.pendingTransactions.set(hash, {
        ...options,
        hash,
        timestamp: Date.now(),
        status: 'pending'
      });

      return hash;
    } catch (error) {
      console.error('Transaction error:', error);
      throw new Error(`Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(hash: `0x${string}`, confirmations = 1): Promise<any> {
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
    return this.pendingTransactions.get(hash);
  }

  // Disconnect wallet
  disconnect(): void {
    this.walletClient = null;
    this.connectedAddress = null;
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