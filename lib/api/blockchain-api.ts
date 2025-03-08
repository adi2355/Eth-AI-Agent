import { BlockchainActionParams, BlockchainActionResult } from '../agents/blockchain-orchestrator';
import { TokenInfo } from '../blockchain/token-registry';
import { DeploymentResult, DeploymentParams } from '../agents/deployment/contract-deployment-agent';
import { TransferResult, TransferParams } from '../agents/transaction/token-transfer-agent';
import { ContractTemplate } from '../agents/deployment/contract-templates';
import { WalletConnectionOptions } from '../blockchain/wallet-integration';

/**
 * Blockchain API Service
 * 
 * This service provides a simplified interface for frontend applications
 * to interact with blockchain functionality via server-side API.
 */
export class BlockchainApiService {
  /**
   * Execute a blockchain action via the server API
   */
  private async executeBlockchainAction(action: BlockchainActionParams): Promise<BlockchainActionResult> {
    const response = await fetch('/api/blockchain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Connect to wallet
   * @param provider - Wallet provider (metamask, walletconnect, etc.)
   * @returns Connected wallet address
   */
  async connectWallet(provider: string): Promise<string> {
    const walletParams: WalletConnectionOptions = { 
      type: provider as any // Cast to any as a temporary solution
    };
    
    const result = await this.executeBlockchainAction({
      actionType: 'CONNECT_WALLET',
      walletParams
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to connect wallet');
    }
    
    return result.data.address;
  }
  
  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    await this.executeBlockchainAction({
      actionType: 'DISCONNECT_WALLET'
    });
  }
  
  /**
   * Deploy contract
   * @param templateId - Contract template ID
   * @param contractParams - Contract parameters
   * @param options - Deployment options
   * @returns Deployment result
   */
  async deployContract(
    templateId: string,
    contractParams: Record<string, any>,
    options: {
      value?: string;
      gasLimit?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
    } = {}
  ): Promise<DeploymentResult> {
    const deploymentParams: DeploymentParams = {
      templateId,
      templateParams: contractParams,
      value: options.value,
      gasLimit: options.gasLimit,
      maxFeePerGas: options.maxFeePerGas,
      maxPriorityFeePerGas: options.maxPriorityFeePerGas
    };
    
    const result = await this.executeBlockchainAction({
      actionType: 'DEPLOY_CONTRACT',
      deploymentParams
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to deploy contract');
    }
    
    return result.data;
  }
  
  /**
   * Transfer tokens
   * @param to - Recipient address
   * @param amount - Amount to transfer
   * @param tokenAddress - Token address (optional, if not provided, transfers ETH)
   * @param options - Transfer options
   * @returns Transfer result
   */
  async transferTokens(
    to: string,
    amount: string,
    tokenAddress?: string,
    options: {
      gasLimit?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
    } = {}
  ): Promise<TransferResult> {
    const transferParams: TransferParams = {
      to: to as `0x${string}`,
      amount,
      tokenAddress: tokenAddress as `0x${string}` | undefined,
      chainId: 1, // Default to Ethereum mainnet
      gasLimit: options.gasLimit,
      maxFeePerGas: options.maxFeePerGas,
      maxPriorityFeePerGas: options.maxPriorityFeePerGas
    };
    
    const result = await this.executeBlockchainAction({
      actionType: 'TRANSFER_TOKENS',
      transferParams
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to transfer tokens');
    }
    
    return result.data;
  }
  
  /**
   * Get token information
   * @param tokenAddress - Token address
   * @param chainId - Chain ID
   * @returns Token information
   */
  async getTokenInfo(tokenAddress: string, chainId: number): Promise<TokenInfo> {
    const result = await this.executeBlockchainAction({
      actionType: 'GET_TOKEN_INFO',
      tokenAddress: tokenAddress as `0x${string}`,
      chainId
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get token info');
    }
    
    return result.data;
  }
  
  /**
   * Get contract templates
   * @param category - Template category (optional)
   * @returns List of contract templates
   */
  async getContractTemplates(category?: string): Promise<ContractTemplate[]> {
    const result = await this.executeBlockchainAction({
      actionType: 'GET_CONTRACT_TEMPLATES',
      templateCategory: category
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get contract templates');
    }
    
    return result.data;
  }
  
  /**
   * Get deployment status
   * @param transactionHash - Transaction hash
   * @returns Deployment status
   */
  async getDeploymentStatus(transactionHash: string): Promise<DeploymentResult> {
    const result = await this.executeBlockchainAction({
      actionType: 'GET_DEPLOYMENT_STATUS',
      transactionHash: transactionHash as `0x${string}`
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get deployment status');
    }
    
    return result.data;
  }
  
  /**
   * Get transfer status
   * @param transactionHash - Transaction hash
   * @returns Transfer status
   */
  async getTransferStatus(transactionHash: string): Promise<TransferResult> {
    const result = await this.executeBlockchainAction({
      actionType: 'GET_TRANSFER_STATUS',
      transactionHash: transactionHash as `0x${string}`
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get transfer status');
    }
    
    return result.data;
  }
  
  /**
   * Execute custom blockchain action
   * @param params - Action parameters
   * @returns Action result
   */
  async executeAction(params: BlockchainActionParams): Promise<BlockchainActionResult> {
    return this.executeBlockchainAction(params);
  }
}

// Export singleton instance
export const blockchainApi = new BlockchainApiService(); 