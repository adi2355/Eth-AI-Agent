"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainApi = exports.BlockchainApiService = void 0;
const blockchain_orchestrator_1 = require("../agents/blockchain-orchestrator");
/**
 * Blockchain API Service
 *
 * This service provides a simplified interface for frontend applications
 * to interact with blockchain functionality.
 */
class BlockchainApiService {
    /**
     * Connect to wallet
     * @param provider - Wallet provider (metamask, walletconnect, etc.)
     * @returns Connected wallet address
     */
    async connectWallet(provider) {
        const walletParams = {
            type: provider // Cast to any as a temporary solution
        };
        const result = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction({
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
    disconnectWallet() {
        blockchain_orchestrator_1.blockchainOrchestrator.handleAction({
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
    async deployContract(templateId, contractParams, options = {}) {
        const deploymentParams = {
            templateId,
            templateParams: contractParams,
            value: options.value,
            gasLimit: options.gasLimit,
            maxFeePerGas: options.maxFeePerGas,
            maxPriorityFeePerGas: options.maxPriorityFeePerGas
        };
        const result = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction({
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
    async transferTokens(to, amount, tokenAddress, options = {}) {
        const transferParams = {
            to: to,
            amount,
            tokenAddress: tokenAddress,
            chainId: 1, // Default to Ethereum mainnet
            gasLimit: options.gasLimit,
            maxFeePerGas: options.maxFeePerGas,
            maxPriorityFeePerGas: options.maxPriorityFeePerGas
        };
        const result = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction({
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
    async getTokenInfo(tokenAddress, chainId) {
        const result = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction({
            actionType: 'GET_TOKEN_INFO',
            tokenAddress: tokenAddress,
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
    async getContractTemplates(category) {
        const result = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction({
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
    async getDeploymentStatus(transactionHash) {
        const result = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction({
            actionType: 'GET_DEPLOYMENT_STATUS',
            transactionHash: transactionHash
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
    async getTransferStatus(transactionHash) {
        const result = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction({
            actionType: 'GET_TRANSFER_STATUS',
            transactionHash: transactionHash
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
    async executeAction(params) {
        return blockchain_orchestrator_1.blockchainOrchestrator.handleAction(params);
    }
}
exports.BlockchainApiService = BlockchainApiService;
// Export singleton instance
exports.blockchainApi = new BlockchainApiService();
