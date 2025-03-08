import { WalletIntegrationService } from '../../blockchain/wallet-integration';
import { tokenRegistry } from '../../blockchain/token-registry';
import { validateTransaction } from '../security/contract-validator';
import { publicClient } from '../../blockchain/providers';
import { encodeAbiParameters, parseAbi } from 'viem';
import { transactionApi } from '../../api/transaction-api';

export interface TransferParams {
  // Token information (null for ETH)
  tokenAddress?: `0x${string}` | null;
  
  // Transfer details
  to: `0x${string}`;
  amount: string;
  
  // Chain information
  chainId: number;
  
  // Transaction options
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface TransferResult {
  transactionHash: `0x${string}`;
  tokenAddress: `0x${string}` | null;
  to: `0x${string}`;
  amount: string;
  amountInWei: string | bigint; // Allow either string or bigint
  status: 'pending' | 'success' | 'failed';
  confirmations?: number;
  receipt?: any;
  error?: string;
  timestamp: number;
}

export class TokenTransferAgent {
  // Instance transfers map
  private transfers = new Map<string, TransferResult>();
  
  // Static transfers registry (shared across instances)
  private static globalTransfers = new Map<string, TransferResult>();
  
  /**
   * Get all transfers (static method)
   * @returns Array of all transfers
   */
  static getAllTransfers(): TransferResult[] {
    return Array.from(this.globalTransfers.values());
  }
  
  /**
   * Get a specific transfer (static method)
   * @param hash Transaction hash
   * @returns Transfer result or null if not found
   */
  static getTransfer(hash: `0x${string}`): TransferResult | null {
    return this.globalTransfers.get(hash) || null;
  }
  
  /**
   * Transfer tokens
   * @param walletServiceInstance Wallet service
   * @param params Transfer parameters
   * @returns Transfer result
   */
  async transferTokens(
    walletServiceInstance: WalletIntegrationService,
    params: TransferParams
  ): Promise<TransferResult> {
    try {
      // Log detailed information about the wallet service
      console.log('TokenTransferAgent.transferTokens called with:', {
        walletServiceExists: !!walletServiceInstance,
        walletServiceType: walletServiceInstance ? typeof walletServiceInstance : 'undefined',
        hasWalletMethods: walletServiceInstance ? 
          (typeof walletServiceInstance.isConnected === 'function' && 
          typeof walletServiceInstance.sendTransaction === 'function') : 
          false,
        params: {
          to: params.to,
          amount: params.amount,
          isEthTransfer: !params.tokenAddress
        }
      });

      // Validate wallet connection
      if (!walletServiceInstance) {
        throw new Error("Wallet service instance not provided");
      }
      
      // Get connected wallet address (don't check .isConnected() as it may be a mock)
      const fromAddress = walletServiceInstance.getAddress();
      
      console.log('Wallet address retrieved:', { 
        fromAddress, 
        isConnected: walletServiceInstance.isConnected() 
      });
      
      if (!fromAddress) {
        throw new Error("Wallet not connected");
      }
      
      // Validate recipient address
      if (!params.to || !params.to.startsWith('0x')) {
        throw new Error("Invalid recipient address");
      }
      
      // Validate amount
      if (!params.amount || parseFloat(params.amount) <= 0) {
        throw new Error("Invalid amount");
      }
      
      // Determine if this is an ETH or token transfer
      const isEthTransfer = !params.tokenAddress;
      
      // Prepare transaction options
      const txOptions: any = {
        to: params.to,
      };
      
      let amountInWei: bigint;
      
      if (isEthTransfer) {
        // ETH transfer
        amountInWei = WalletIntegrationService.parseEther(params.amount);
        txOptions.value = amountInWei;
      } else {
        // Token transfer
        // Get token info from registry
        const tokenInfo = tokenRegistry.getToken(params.tokenAddress!, params.chainId);
        
        if (!tokenInfo) {
          throw new Error(`Token ${params.tokenAddress} not found in registry`);
        }
        
        // Calculate token amount based on decimals
        amountInWei = BigInt(Math.floor(parseFloat(params.amount) * 10 ** tokenInfo.decimals));
        
        // Prepare token transfer data
        const data = encodeAbiParameters(
          [{ type: 'address', name: 'to' }, { type: 'uint256', name: 'amount' }],
          [params.to, amountInWei]
        );
        
        txOptions.to = params.tokenAddress!;
        txOptions.data = data;
      }
      
      // Add gas parameters if provided
      if (params.gasLimit) {
        txOptions.gasLimit = BigInt(params.gasLimit);
      }
      
      if (params.maxFeePerGas) {
        txOptions.maxFeePerGas = BigInt(params.maxFeePerGas);
      }
      
      if (params.maxPriorityFeePerGas) {
        txOptions.maxPriorityFeePerGas = BigInt(params.maxPriorityFeePerGas);
      }
      
      // Send transaction
      const hash = await walletServiceInstance.sendTransaction(txOptions);
      
      // Create transfer result
      const transferResult: TransferResult = {
        transactionHash: hash,
        tokenAddress: params.tokenAddress || null,
        to: params.to,
        amount: params.amount,
        amountInWei: this.serializeBigInt(amountInWei), // Convert BigInt to string
        status: 'pending',
        timestamp: Date.now() // Add timestamp
      };
      
      // Store transfer in instance map
      this.transfers.set(hash, transferResult);
      
      // Store in global registry
      TokenTransferAgent.globalTransfers.set(hash, transferResult);
      
      console.log(`TokenTransferAgent: Transaction registered in global registry: ${hash}`);
      
      // Notify listeners about the new transaction
      transactionApi.notifyTransactionAdded({
        transactionHash: hash,
        status: 'pending',
        timestamp: transferResult.timestamp,
        type: 'transfer',
        tokenAddress: transferResult.tokenAddress,
        to: transferResult.to,
        amount: transferResult.amount
      });
      
      // Start waiting for confirmation in the background
      this.waitForTransfer(hash, walletServiceInstance).catch(error => {
        console.error(`Error waiting for transfer ${hash}:`, error);
      });
      
      return this.serializeTransferResult(transferResult);
    } catch (error) {
      // Enhanced error logging
      console.error('Token transfer error details:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        walletServiceExists: !!walletServiceInstance
      });
      throw new Error(`Failed to transfer tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Serialize a BigInt value to a string to ensure it can be JSON-serialized
   * @param value BigInt value to serialize
   * @returns String representation of the BigInt
   */
  private serializeBigInt(value: bigint): string {
    return value.toString();
  }

  /**
   * Serialize a transfer result to ensure all BigInt values are converted to strings
   * @param result Transfer result to serialize
   * @returns Serialized transfer result
   */
  private serializeTransferResult(result: TransferResult): TransferResult {
    return {
      ...result,
      amountInWei: typeof result.amountInWei === 'bigint' 
        ? this.serializeBigInt(result.amountInWei) 
        : result.amountInWei,
    };
  }

  /**
   * Wait for transfer confirmation
   * @param hash Transaction hash
   * @param walletServiceInstance Wallet service
   */
  private async waitForTransfer(
    hash: `0x${string}`,
    walletServiceInstance: WalletIntegrationService
  ): Promise<void> {
    try {
      console.log(`TokenTransferAgent: Waiting for confirmation of transaction ${hash}`);
      
      // Get current transfer
      const transfer = this.transfers.get(hash);
      if (!transfer) {
        console.warn(`TokenTransferAgent: Transfer ${hash} not found in instance map`);
        return;
      }
      
      // Wait for transaction confirmation
      const receipt = await walletServiceInstance.waitForTransaction(hash);
      
      console.log(`TokenTransferAgent: Transaction ${hash} confirmed:`, receipt);
      
      // Update transfer status
      transfer.status = receipt.status === 'success' ? 'success' : 'failed';
      transfer.confirmations = receipt.confirmations || 1;
      transfer.receipt = receipt;
      
      // Update both instance and global maps
      this.transfers.set(hash, transfer);
      TokenTransferAgent.globalTransfers.set(hash, transfer);
      
      console.log(`TokenTransferAgent: Updated global registry for transaction ${hash}`);
      
      // Notify listeners about the updated transaction
      transactionApi.notifyTransactionUpdated({
        transactionHash: hash,
        status: transfer.status,
        timestamp: transfer.timestamp,
        type: 'transfer',
        error: transfer.error,
        tokenAddress: transfer.tokenAddress,
        to: transfer.to,
        amount: transfer.amount,
        confirmations: transfer.confirmations
      });
    } catch (error) {
      console.error(`TokenTransferAgent: Error confirming transaction ${hash}:`, error);
      
      // Get current transfer
      const transfer = this.transfers.get(hash);
      if (transfer) {
        // Mark as failed
        transfer.status = 'failed';
        transfer.error = `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        
        // Update both instance and global maps
        this.transfers.set(hash, transfer);
        TokenTransferAgent.globalTransfers.set(hash, transfer);
        
        console.log(`TokenTransferAgent: Marked transaction ${hash} as failed in global registry`);
        
        // Notify listeners about the failed transaction
        transactionApi.notifyTransactionUpdated({
          transactionHash: hash,
          status: 'failed',
          timestamp: transfer.timestamp,
          type: 'transfer',
          error: transfer.error,
          tokenAddress: transfer.tokenAddress,
          to: transfer.to,
          amount: transfer.amount
        });
      }
    }
  }

  /**
   * Get a specific transfer
   * @param hash Transaction hash
   * @returns Transfer result or null if not found
   */
  getTransfer(hash: `0x${string}`): TransferResult | null {
    return this.transfers.get(hash) || null;
  }

  /**
   * Get all transfers
   * @returns Array of all transfers
   */
  getAllTransfers(): TransferResult[] {
    return Array.from(this.transfers.values());
  }

  /**
   * Get pending transfers
   * @returns Array of pending transfers
   */
  getPendingTransfers(): TransferResult[] {
    return Array.from(this.transfers.values()).filter(t => t.status === 'pending');
  }
}

// Export singleton instance
export const tokenTransferAgent = new TokenTransferAgent(); 