import { BlockchainActionParams, BlockchainActionResult } from '../agents/blockchain-orchestrator';
import { TokenInfo } from '../blockchain/token-registry';
import { DeploymentResult, DeploymentParams } from '../agents/deployment/contract-deployment-agent';
import { TransferResult, TransferParams } from '../agents/transaction/token-transfer-agent';
import { ContractTemplate } from '../agents/deployment/contract-templates';
import { WalletConnectionOptions } from '../blockchain/wallet-integration';
import { WalletIntegrationService } from '../blockchain/wallet-integration';

/**
 * Blockchain API Service
 * 
 * This service provides a simplified interface for frontend applications
 * to interact with blockchain functionality via server-side API.
 */
export class BlockchainApiService {
  // Session management
  private sessionId: string | null = null;

  /**
   * Set the session ID for blockchain operations
   * @param sessionId Session ID to use
   */
  setSessionId(sessionId: string): void {
    console.log(`BlockchainAPI: Setting session ID to ${sessionId}`);
    this.sessionId = sessionId;
  }

  /**
   * Get the current session ID
   * @returns Current session ID or null if not set
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Execute a blockchain action via the server API
   */
  private async executeBlockchainAction(action: BlockchainActionParams): Promise<BlockchainActionResult> {
    console.log('BlockchainAPI: Executing blockchain action:', {
      actionType: action.actionType,
      sessionId: this.sessionId,
      hasSessionId: !!this.sessionId,
      params: action
    });

    if (!this.sessionId && action.actionType !== 'CONNECT_WALLET') {
      console.warn('BlockchainAPI: No session ID set for blockchain action:', action.actionType);
    }

    try {
      const requestBody = { 
        action,
        sessionId: this.sessionId || undefined
      };
      
      console.log('BlockchainAPI: Sending request to server:', {
        endpoint: '/api/blockchain',
        method: 'POST',
        body: requestBody
      });
      
      const response = await fetch('/api/blockchain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
        console.error('BlockchainAPI: Error response from server:', {
          status: response.status,
          errorData,
          action: action.actionType
        });
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('BlockchainAPI: Response from server:', {
        success: result.success,
        actionType: result.actionType,
        hasData: !!result.data,
        error: result.error
      });
      
      return result;
    } catch (error) {
      console.error('BlockchainAPI: Request failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        action: action.actionType
      });
      throw error;
    }
  }

  /**
   * Connect to wallet
   * @param provider - Wallet provider (metamask, walletconnect, etc.)
   * @returns Connected wallet address
   */
  async connectWallet(provider: string): Promise<string> {
    console.log('BlockchainAPI: Connecting wallet:', {
      provider,
      sessionId: this.sessionId
    });
    
    const walletParams: WalletConnectionOptions = { 
      type: provider as any // Cast to any as a temporary solution
    };
    
    try {
      // First try to connect directly in the browser
      if (typeof window !== 'undefined') {
        console.log('BlockchainAPI: Attempting browser wallet connection');
        // We're in the browser, try to connect directly
        try {
          const walletService = new WalletIntegrationService();
          const address = await walletService.connect(provider as any, walletParams);
          console.log('BlockchainAPI: Browser wallet connection successful:', address);
          return address;
        } catch (browserError) {
          console.error('BlockchainAPI: Browser wallet connection failed:', browserError);
          // Fall through to server-side approach if browser connection fails
        }
      }
      
      // If we're not in the browser or direct connection failed, use the server API
      console.log('BlockchainAPI: Attempting server-side wallet connection');
      const result = await this.executeBlockchainAction({
        actionType: 'CONNECT_WALLET',
        walletParams
      });
      
      if (!result.success) {
        console.error('BlockchainAPI: Server-side wallet connection failed:', result.error);
        throw new Error(result.error || 'Failed to connect wallet');
      }
      
      // If the server indicates we need a browser connection, throw an appropriate error
      if (result.data.needsBrowserConnection) {
        console.log('BlockchainAPI: Server indicates browser connection is needed');
      }
      
      console.log('BlockchainAPI: Wallet connection successful:', result.data.address);
      return result.data.address;
    } catch (error) {
      console.error('BlockchainAPI: Wallet connection error:', error);
      throw error;
    }
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
    console.log('BlockchainAPI: Transferring tokens:', {
      to,
      amount,
      tokenAddress: tokenAddress || 'ETH (native)',
      options,
      sessionId: this.sessionId
    });
    
    if (!this.sessionId) {
      console.error('BlockchainAPI: No session ID set for token transfer');
      throw new Error('No session ID set in blockchain API');
    }

    const transferParams: TransferParams = {
      to: to as `0x${string}`,
      amount,
      tokenAddress: tokenAddress as `0x${string}` | undefined,
      chainId: 1, // Default to Ethereum mainnet
      gasLimit: options.gasLimit,
      maxFeePerGas: options.maxFeePerGas,
      maxPriorityFeePerGas: options.maxPriorityFeePerGas
    };
    
    try {
      const result = await this.executeBlockchainAction({
        actionType: 'TRANSFER_TOKENS',
        transferParams
      });
      
      if (!result.success) {
        console.error('BlockchainAPI: Token transfer failed:', {
          error: result.error,
          params: transferParams
        });
        throw new Error(result.error || 'Failed to transfer tokens');
      }
      
      console.log('BlockchainAPI: Token transfer successful:', {
        transactionHash: result.data.transactionHash,
        status: result.data.status
      });
      
      return result.data;
    } catch (error) {
      console.error('BlockchainAPI: Token transfer exception:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        params: transferParams
      });
      throw error;
    }
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

  /**
   * Get wallet connection status
   * @returns Wallet connection status
   */
  async getWalletStatus(): Promise<{ connected: boolean; address: string | null }> {
    console.log('BlockchainAPI: Getting wallet status for session:', this.sessionId);
    
    try {
      const result = await this.executeBlockchainAction({
        actionType: 'GET_WALLET_STATUS'
      });
      
      if (!result.success) {
        console.error('BlockchainAPI: Failed to get wallet status:', result.error);
        return { connected: false, address: null };
      }
      
      console.log('BlockchainAPI: Wallet status:', result.data);
      return { 
        connected: result.data.connected, 
        address: result.data.address 
      };
    } catch (error) {
      console.error('BlockchainAPI: Error getting wallet status:', error);
      return { connected: false, address: null };
    }
  }
}

// Export singleton instance
export const blockchainApi = new BlockchainApiService(); 