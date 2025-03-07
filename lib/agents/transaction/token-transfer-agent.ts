import { walletService, WalletIntegrationService } from '../../blockchain/wallet-integration';
import { tokenRegistry } from '../../blockchain/token-registry';
import { validateTransaction } from '../security/contract-validator';
import { publicClient } from '../../blockchain/providers';

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
  amountInWei: bigint;
  status: 'pending' | 'success' | 'failed';
  receipt?: any;
  error?: string;
}

export class TokenTransferAgent {
  private transfers = new Map<string, TransferResult>();

  // Transfer ETH or tokens
  async transferTokens(params: TransferParams): Promise<TransferResult> {
    try {
      // Check if wallet is connected
      if (!walletService.isConnected()) {
        throw new Error('Wallet not connected');
      }
      
      // Validate recipient address
      if (!params.to || !params.to.startsWith('0x')) {
        throw new Error('Invalid recipient address');
      }
      
      // Validate amount
      if (!params.amount || isNaN(Number(params.amount)) || Number(params.amount) <= 0) {
        throw new Error('Invalid amount');
      }
      
      // Determine if this is an ETH transfer or token transfer
      const isEthTransfer = !params.tokenAddress;
      
      let amountInWei: bigint;
      let txHash: `0x${string}`;
      
      if (isEthTransfer) {
        // ETH transfer
        amountInWei = WalletIntegrationService.parseEther(params.amount);
        
        // Validate transaction
        const validationResult = await validateTransaction(params.to, amountInWei, undefined);
        if (!validationResult.valid) {
          throw new Error(`Transaction validation failed: ${validationResult.issues.map(i => i.title).join(', ')}`);
        }
        
        // Prepare transaction options
        const txOptions: any = {
          to: params.to,
          value: amountInWei,
          data: undefined
        };
        
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
        txHash = await walletService.sendTransaction(txOptions);
      } else {
        // Token transfer
        // Get token info
        const tokenInfo = await tokenRegistry.getToken(params.tokenAddress!, params.chainId);
        if (!tokenInfo) {
          // Try to load token info from blockchain
          await tokenRegistry.loadTokenInfo(params.tokenAddress!, params.chainId);
        }
        
        // Convert amount to token decimals
        const token = tokenRegistry.getToken(params.tokenAddress!, params.chainId);
        if (!token) {
          throw new Error(`Token information not found for ${params.tokenAddress}`);
        }
        
        // Calculate amount in wei based on token decimals
        amountInWei = WalletIntegrationService.parseEther(params.amount);
        if (token.decimals !== 18) {
          // Adjust for token decimals
          const decimalsDiff = 18 - token.decimals;
          if (decimalsDiff > 0) {
            amountInWei = amountInWei / BigInt(10 ** decimalsDiff);
          } else {
            amountInWei = amountInWei * BigInt(10 ** Math.abs(decimalsDiff));
          }
        }
        
        // Transfer tokens
        txHash = await tokenRegistry.transfer(
          params.tokenAddress!,
          params.to,
          amountInWei,
          params.chainId
        );
      }
      
      // Create transfer result
      const transferResult: TransferResult = {
        transactionHash: txHash,
        tokenAddress: params.tokenAddress || null,
        to: params.to,
        amount: params.amount,
        amountInWei,
        status: 'pending'
      };
      
      // Store the transfer
      this.transfers.set(txHash, transferResult);
      
      // Wait for transaction confirmation in the background
      this.waitForTransfer(txHash);
      
      return transferResult;
    } catch (error) {
      console.error('Token transfer error:', error);
      throw new Error(`Failed to transfer tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Wait for transfer confirmation
  private async waitForTransfer(hash: `0x${string}`): Promise<void> {
    try {
      // Wait for transaction receipt
      const receipt = await walletService.waitForTransaction(hash);
      
      // Update transfer result
      const transfer = this.transfers.get(hash);
      if (transfer) {
        transfer.status = receipt.status === 'success' ? 'success' : 'failed';
        transfer.receipt = receipt;
        
        this.transfers.set(hash, transfer);
      }
    } catch (error) {
      console.error('Transfer confirmation error:', error);
      
      // Update transfer status to failed
      const transfer = this.transfers.get(hash);
      if (transfer) {
        transfer.status = 'failed';
        transfer.error = `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.transfers.set(hash, transfer);
      }
    }
  }

  // Get transfer status
  getTransfer(hash: `0x${string}`): TransferResult | null {
    return this.transfers.get(hash) || null;
  }

  // Get all transfers
  getAllTransfers(): TransferResult[] {
    return Array.from(this.transfers.values());
  }

  // Get pending transfers
  getPendingTransfers(): TransferResult[] {
    return Array.from(this.transfers.values()).filter(transfer => transfer.status === 'pending');
  }
}

// Export singleton instance
export const tokenTransferAgent = new TokenTransferAgent(); 