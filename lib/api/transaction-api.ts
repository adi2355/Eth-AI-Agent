import { TokenTransferAgent } from '../agents/transaction/token-transfer-agent';
import { ContractDeploymentAgent } from '../agents/deployment/contract-deployment-agent';
import { EventEmitter } from 'events';

// Create an event emitter for transaction updates
export const transactionEvents = new EventEmitter();

// Define a unified transaction interface
export interface TransactionRecord {
  transactionHash: `0x${string}`;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  type: 'transfer' | 'deploy';
  error?: string;
  confirmations?: number;
  
  // Transfer specific fields
  tokenAddress?: string | null;
  to?: string;
  amount?: string;
  
  // Deployment specific fields
  templateId?: string;
  contractAddress?: `0x${string}` | null;
}

/**
 * Central API for accessing transaction data from both token transfers and contract deployments
 */
export const transactionApi = {
  /**
   * Get all transactions (both transfers and deployments)
   * @returns Array of all transactions sorted by timestamp
   */
  getAllTransactions(): TransactionRecord[] {
    console.log('TransactionAPI: Getting all transactions');
    
    // Get transfers from TokenTransferAgent
    const transfers = TokenTransferAgent.getAllTransfers();
    console.log(`TransactionAPI: Found ${transfers.length} transfers`);
    
    // Get deployments from ContractDeploymentAgent
    const deployments = ContractDeploymentAgent.getAllDeployments();
    console.log(`TransactionAPI: Found ${deployments.length} deployments`);
    
    // Convert to unified format
    const unifiedTransactions: TransactionRecord[] = [
      // Map transfers to TransactionRecord
      ...transfers.map(tx => ({
        transactionHash: tx.transactionHash,
        status: tx.status,
        timestamp: tx.timestamp,
        type: 'transfer' as const,
        error: tx.error,
        tokenAddress: tx.tokenAddress,
        to: tx.to,
        amount: tx.amount,
        confirmations: tx.confirmations
      })),
      
      // Map deployments to TransactionRecord
      ...deployments.map(tx => ({
        transactionHash: tx.transactionHash,
        status: tx.deploymentStatus || 'pending',
        timestamp: tx.timestamp,
        type: 'deploy' as const,
        error: tx.error,
        templateId: tx.templateId,
        contractAddress: tx.contractAddress,
        confirmations: tx.confirmations
      }))
    ];
    
    // Sort by timestamp (newest first)
    return unifiedTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },
  
  /**
   * Get a specific transaction by hash
   * @param hash Transaction hash
   * @returns Transaction record or null if not found
   */
  getTransaction(hash: `0x${string}`): TransactionRecord | null {
    // Check if it's a transfer
    const transfer = TokenTransferAgent.getTransfer(hash);
    if (transfer) {
      return {
        transactionHash: transfer.transactionHash,
        status: transfer.status,
        timestamp: transfer.timestamp,
        type: 'transfer',
        error: transfer.error,
        tokenAddress: transfer.tokenAddress,
        to: transfer.to,
        amount: transfer.amount,
        confirmations: transfer.confirmations
      };
    }
    
    // Check if it's a deployment
    const deployment = ContractDeploymentAgent.getDeployment(hash);
    if (deployment) {
      return {
        transactionHash: deployment.transactionHash,
        status: deployment.deploymentStatus || 'pending',
        timestamp: deployment.timestamp,
        type: 'deploy',
        error: deployment.error,
        templateId: deployment.templateId,
        contractAddress: deployment.contractAddress,
        confirmations: deployment.confirmations
      };
    }
    
    // Not found
    return null;
  },

  /**
   * Manually trigger a transaction added event
   * @param transaction The transaction that was added
   */
  notifyTransactionAdded(transaction: TransactionRecord): void {
    console.log(`TransactionAPI: Emitting transaction:added event for ${transaction.transactionHash}`);
    transactionEvents.emit('transaction:added', transaction);
  },
  
  /**
   * Manually trigger a transaction updated event
   * @param transaction The transaction that was updated
   */
  notifyTransactionUpdated(transaction: TransactionRecord): void {
    console.log(`TransactionAPI: Emitting transaction:updated event for ${transaction.transactionHash}`);
    transactionEvents.emit('transaction:updated', transaction);
  },
  
  /**
   * Subscribe to transaction events
   * @param event Event name ('transaction:added' or 'transaction:updated')
   * @param callback Function to call when the event occurs
   */
  subscribe(event: 'transaction:added' | 'transaction:updated', callback: (transaction: TransactionRecord) => void): void {
    transactionEvents.on(event, callback);
  },
  
  /**
   * Unsubscribe from transaction events
   * @param event Event name ('transaction:added' or 'transaction:updated')
   * @param callback The callback function to remove
   */
  unsubscribe(event: 'transaction:added' | 'transaction:updated', callback: (transaction: TransactionRecord) => void): void {
    transactionEvents.off(event, callback);
  }
}; 