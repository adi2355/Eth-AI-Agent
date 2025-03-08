"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const blockchain_api_1 = require("../lib/api/blockchain-api");
const blockchain_orchestrator_1 = require("../lib/agents/blockchain-orchestrator");
const test_utils_1 = require("./utils/test-utils");
// Mock the blockchain orchestrator
vitest_1.vi.mock('../lib/agents/blockchain-orchestrator', () => {
    return {
        blockchainOrchestrator: {
            handleAction: vitest_1.vi.fn()
        }
    };
});
(0, vitest_1.describe)('Blockchain API Service', () => {
    let testAccounts;
    (0, vitest_1.beforeEach)(async () => {
        testAccounts = await (0, test_utils_1.setupTestAccounts)(2);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should connect wallet', async () => {
        // Mock successful wallet connection
        blockchain_orchestrator_1.blockchainOrchestrator.handleAction.mockResolvedValue({
            success: true,
            actionType: 'CONNECT_WALLET',
            data: { address: testAccounts[0].address }
        });
        const address = await blockchain_api_1.blockchainApi.connectWallet('metamask');
        (0, vitest_1.expect)(address).toEqual(testAccounts[0].address);
        (0, vitest_1.expect)(blockchain_orchestrator_1.blockchainOrchestrator.handleAction).toHaveBeenCalledWith({
            actionType: 'CONNECT_WALLET',
            walletParams: { type: 'metamask' }
        });
    });
    (0, vitest_1.it)('should handle wallet connection errors', async () => {
        // Mock failed wallet connection
        blockchain_orchestrator_1.blockchainOrchestrator.handleAction.mockResolvedValue({
            success: false,
            actionType: 'CONNECT_WALLET',
            error: 'Connection failed'
        });
        await (0, vitest_1.expect)(blockchain_api_1.blockchainApi.connectWallet('metamask')).rejects.toThrow('Connection failed');
    });
    (0, vitest_1.it)('should disconnect wallet', async () => {
        // Mock successful wallet disconnection
        blockchain_orchestrator_1.blockchainOrchestrator.handleAction.mockResolvedValue({
            success: true,
            actionType: 'DISCONNECT_WALLET'
        });
        blockchain_api_1.blockchainApi.disconnectWallet();
        (0, vitest_1.expect)(blockchain_orchestrator_1.blockchainOrchestrator.handleAction).toHaveBeenCalledWith({
            actionType: 'DISCONNECT_WALLET'
        });
    });
    (0, vitest_1.it)('should deploy contract', async () => {
        // Mock successful contract deployment
        const mockDeploymentResult = {
            transactionHash: '0x1234567890abcdef',
            contractAddress: '0xabcdef1234567890',
            deploymentStatus: 'success'
        };
        blockchain_orchestrator_1.blockchainOrchestrator.handleAction.mockResolvedValue({
            success: true,
            actionType: 'DEPLOY_CONTRACT',
            data: mockDeploymentResult
        });
        const result = await blockchain_api_1.blockchainApi.deployContract('ERC20', { name: 'Test Token', symbol: 'TEST', initialSupply: '1000000' }, { value: '0.1' });
        (0, vitest_1.expect)(result).toEqual(mockDeploymentResult);
        (0, vitest_1.expect)(blockchain_orchestrator_1.blockchainOrchestrator.handleAction).toHaveBeenCalledWith({
            actionType: 'DEPLOY_CONTRACT',
            deploymentParams: {
                templateId: 'ERC20',
                templateParams: { name: 'Test Token', symbol: 'TEST', initialSupply: '1000000' },
                value: '0.1',
                gasLimit: undefined,
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined
            }
        });
    });
    (0, vitest_1.it)('should transfer tokens', async () => {
        // Mock successful token transfer
        const mockTransferResult = {
            transactionHash: '0x1234567890abcdef',
            status: 'success'
        };
        blockchain_orchestrator_1.blockchainOrchestrator.handleAction.mockResolvedValue({
            success: true,
            actionType: 'TRANSFER_TOKENS',
            data: mockTransferResult
        });
        const result = await blockchain_api_1.blockchainApi.transferTokens('0xabcdef1234567890', '100', '0x0987654321fedcba');
        (0, vitest_1.expect)(result).toEqual(mockTransferResult);
        (0, vitest_1.expect)(blockchain_orchestrator_1.blockchainOrchestrator.handleAction).toHaveBeenCalledWith({
            actionType: 'TRANSFER_TOKENS',
            transferParams: {
                to: '0xabcdef1234567890',
                amount: '100',
                tokenAddress: '0x0987654321fedcba',
                chainId: 1,
                gasLimit: undefined,
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined
            }
        });
    });
    (0, vitest_1.it)('should get token info', async () => {
        // Mock successful token info retrieval
        const mockTokenInfo = {
            address: '0x1234567890abcdef',
            name: 'Test Token',
            symbol: 'TEST',
            decimals: 18,
            chainId: 1
        };
        blockchain_orchestrator_1.blockchainOrchestrator.handleAction.mockResolvedValue({
            success: true,
            actionType: 'GET_TOKEN_INFO',
            data: mockTokenInfo
        });
        const result = await blockchain_api_1.blockchainApi.getTokenInfo('0x1234567890abcdef', 1);
        (0, vitest_1.expect)(result).toEqual(mockTokenInfo);
        (0, vitest_1.expect)(blockchain_orchestrator_1.blockchainOrchestrator.handleAction).toHaveBeenCalledWith({
            actionType: 'GET_TOKEN_INFO',
            tokenAddress: '0x1234567890abcdef',
            chainId: 1
        });
    });
    (0, vitest_1.it)('should get contract templates', async () => {
        // Mock successful template retrieval
        const mockTemplates = [
            { id: 'ERC20', name: 'ERC20 Token' },
            { id: 'ERC721', name: 'NFT Collection' }
        ];
        blockchain_orchestrator_1.blockchainOrchestrator.handleAction.mockResolvedValue({
            success: true,
            actionType: 'GET_CONTRACT_TEMPLATES',
            data: mockTemplates
        });
        const result = await blockchain_api_1.blockchainApi.getContractTemplates('token');
        (0, vitest_1.expect)(result).toEqual(mockTemplates);
        (0, vitest_1.expect)(blockchain_orchestrator_1.blockchainOrchestrator.handleAction).toHaveBeenCalledWith({
            actionType: 'GET_CONTRACT_TEMPLATES',
            templateCategory: 'token'
        });
    });
    (0, vitest_1.it)('should execute custom actions', async () => {
        // Mock successful custom action
        const mockResult = {
            success: true,
            actionType: 'CUSTOM_ACTION',
            data: { custom: 'data' }
        };
        blockchain_orchestrator_1.blockchainOrchestrator.handleAction.mockResolvedValue(mockResult);
        const customAction = {
            actionType: 'DEPLOY_CONTRACT',
            deploymentParams: {
                source: 'contract Test {}',
                constructorArgs: []
            }
        };
        const result = await blockchain_api_1.blockchainApi.executeAction(customAction);
        (0, vitest_1.expect)(result).toEqual(mockResult);
        (0, vitest_1.expect)(blockchain_orchestrator_1.blockchainOrchestrator.handleAction).toHaveBeenCalledWith(customAction);
    });
});
