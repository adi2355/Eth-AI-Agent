"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainOrchestrator = exports.BlockchainOrchestrator = void 0;
const contract_deployment_agent_1 = require("./deployment/contract-deployment-agent");
const token_transfer_agent_1 = require("./transaction/token-transfer-agent");
const wallet_integration_1 = require("../blockchain/wallet-integration");
const token_registry_1 = require("../blockchain/token-registry");
const contract_templates_1 = require("./deployment/contract-templates");
// Helper functions for contract templates
async function getAllTemplates() {
    // In a real implementation, this would fetch all templates from a database or API
    // For now, we'll return a simple array of templates
    const templates = [];
    const erc20Template = await (0, contract_templates_1.getTemplate)('ERC20');
    const erc721Template = await (0, contract_templates_1.getTemplate)('ERC721');
    const erc1155Template = await (0, contract_templates_1.getTemplate)('ERC1155');
    if (erc20Template)
        templates.push(erc20Template);
    if (erc721Template)
        templates.push(erc721Template);
    if (erc1155Template)
        templates.push(erc1155Template);
    return templates;
}
async function getTemplatesByCategory(category) {
    // In a real implementation, this would filter templates by category
    const allTemplates = await getAllTemplates();
    return allTemplates.filter(template => template.category === category);
}
class BlockchainOrchestrator {
    // Handle blockchain actions
    async handleAction(params) {
        try {
            switch (params.actionType) {
                case 'CONNECT_WALLET':
                    return await this.connectWallet(params.walletParams);
                case 'DISCONNECT_WALLET':
                    return this.disconnectWallet();
                case 'DEPLOY_CONTRACT':
                    return await this.deployContract(params.deploymentParams);
                case 'TRANSFER_TOKENS':
                    return await this.transferTokens(params.transferParams);
                case 'GET_TOKEN_INFO':
                    return await this.getTokenInfo(params.tokenAddress, params.chainId);
                case 'GET_CONTRACT_TEMPLATES':
                    return await this.getContractTemplates(params.templateCategory);
                case 'GET_DEPLOYMENT_STATUS':
                    return this.getDeploymentStatus(params.transactionHash);
                case 'GET_TRANSFER_STATUS':
                    return this.getTransferStatus(params.transactionHash);
                default:
                    throw new Error(`Unknown action type: ${params.actionType}`);
            }
        }
        catch (error) {
            console.error('Blockchain action error:', error);
            return {
                success: false,
                actionType: params.actionType,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Connect wallet
    async connectWallet(params) {
        try {
            const address = await wallet_integration_1.walletService.connect(params);
            return {
                success: true,
                actionType: 'CONNECT_WALLET',
                data: { address }
            };
        }
        catch (error) {
            return {
                success: false,
                actionType: 'CONNECT_WALLET',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Disconnect wallet
    disconnectWallet() {
        try {
            wallet_integration_1.walletService.disconnect();
            return {
                success: true,
                actionType: 'DISCONNECT_WALLET'
            };
        }
        catch (error) {
            return {
                success: false,
                actionType: 'DISCONNECT_WALLET',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Deploy contract
    async deployContract(params) {
        try {
            const result = await contract_deployment_agent_1.contractDeploymentAgent.deployContract(params);
            return {
                success: true,
                actionType: 'DEPLOY_CONTRACT',
                data: result
            };
        }
        catch (error) {
            return {
                success: false,
                actionType: 'DEPLOY_CONTRACT',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Transfer tokens
    async transferTokens(params) {
        try {
            const result = await token_transfer_agent_1.tokenTransferAgent.transferTokens(params);
            return {
                success: true,
                actionType: 'TRANSFER_TOKENS',
                data: result
            };
        }
        catch (error) {
            return {
                success: false,
                actionType: 'TRANSFER_TOKENS',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get token info
    async getTokenInfo(tokenAddress, chainId) {
        try {
            let tokenInfo = token_registry_1.tokenRegistry.getToken(tokenAddress, chainId);
            if (!tokenInfo) {
                // Try to load token info from blockchain
                tokenInfo = await token_registry_1.tokenRegistry.loadTokenInfo(tokenAddress, chainId);
            }
            return {
                success: true,
                actionType: 'GET_TOKEN_INFO',
                data: tokenInfo
            };
        }
        catch (error) {
            return {
                success: false,
                actionType: 'GET_TOKEN_INFO',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get contract templates
    async getContractTemplates(category) {
        try {
            let templates;
            if (category) {
                templates = await getTemplatesByCategory(category);
            }
            else {
                templates = await getAllTemplates();
            }
            return {
                success: true,
                actionType: 'GET_CONTRACT_TEMPLATES',
                data: templates
            };
        }
        catch (error) {
            return {
                success: false,
                actionType: 'GET_CONTRACT_TEMPLATES',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get deployment status
    getDeploymentStatus(transactionHash) {
        try {
            const deployment = contract_deployment_agent_1.contractDeploymentAgent.getDeployment(transactionHash);
            if (!deployment) {
                throw new Error(`Deployment with hash ${transactionHash} not found`);
            }
            return {
                success: true,
                actionType: 'GET_DEPLOYMENT_STATUS',
                data: deployment
            };
        }
        catch (error) {
            return {
                success: false,
                actionType: 'GET_DEPLOYMENT_STATUS',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get transfer status
    getTransferStatus(transactionHash) {
        try {
            const transfer = token_transfer_agent_1.tokenTransferAgent.getTransfer(transactionHash);
            if (!transfer) {
                throw new Error(`Transfer with hash ${transactionHash} not found`);
            }
            return {
                success: true,
                actionType: 'GET_TRANSFER_STATUS',
                data: transfer
            };
        }
        catch (error) {
            return {
                success: false,
                actionType: 'GET_TRANSFER_STATUS',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
exports.BlockchainOrchestrator = BlockchainOrchestrator;
// Export singleton instance
exports.blockchainOrchestrator = new BlockchainOrchestrator();
