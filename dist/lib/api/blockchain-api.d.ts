import { BlockchainActionParams, BlockchainActionResult } from '../agents/blockchain-orchestrator';
import { TokenInfo } from '../blockchain/token-registry';
import { DeploymentResult } from '../agents/deployment/contract-deployment-agent';
import { TransferResult } from '../agents/transaction/token-transfer-agent';
import { ContractTemplate } from '../agents/deployment/contract-templates';
/**
 * Blockchain API Service
 *
 * This service provides a simplified interface for frontend applications
 * to interact with blockchain functionality.
 */
export declare class BlockchainApiService {
    /**
     * Connect to wallet
     * @param provider - Wallet provider (metamask, walletconnect, etc.)
     * @returns Connected wallet address
     */
    connectWallet(provider: string): Promise<string>;
    /**
     * Disconnect wallet
     */
    disconnectWallet(): void;
    /**
     * Deploy contract
     * @param templateId - Contract template ID
     * @param contractParams - Contract parameters
     * @param options - Deployment options
     * @returns Deployment result
     */
    deployContract(templateId: string, contractParams: Record<string, any>, options?: {
        value?: string;
        gasLimit?: string;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
    }): Promise<DeploymentResult>;
    /**
     * Transfer tokens
     * @param to - Recipient address
     * @param amount - Amount to transfer
     * @param tokenAddress - Token address (optional, if not provided, transfers ETH)
     * @param options - Transfer options
     * @returns Transfer result
     */
    transferTokens(to: string, amount: string, tokenAddress?: string, options?: {
        gasLimit?: string;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
    }): Promise<TransferResult>;
    /**
     * Get token information
     * @param tokenAddress - Token address
     * @param chainId - Chain ID
     * @returns Token information
     */
    getTokenInfo(tokenAddress: string, chainId: number): Promise<TokenInfo>;
    /**
     * Get contract templates
     * @param category - Template category (optional)
     * @returns List of contract templates
     */
    getContractTemplates(category?: string): Promise<ContractTemplate[]>;
    /**
     * Get deployment status
     * @param transactionHash - Transaction hash
     * @returns Deployment status
     */
    getDeploymentStatus(transactionHash: string): Promise<DeploymentResult>;
    /**
     * Get transfer status
     * @param transactionHash - Transaction hash
     * @returns Transfer status
     */
    getTransferStatus(transactionHash: string): Promise<TransferResult>;
    /**
     * Execute custom blockchain action
     * @param params - Action parameters
     * @returns Action result
     */
    executeAction(params: BlockchainActionParams): Promise<BlockchainActionResult>;
}
export declare const blockchainApi: BlockchainApiService;
