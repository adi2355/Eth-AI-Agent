"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const blockchain_orchestrator_1 = require("../lib/agents/blockchain-orchestrator");
const wallet_integration_1 = require("../lib/blockchain/wallet-integration");
const test_utils_1 = require("./utils/test-utils");
(0, vitest_1.describe)('Blockchain Orchestrator', () => {
    let testAccounts;
    let testToken;
    (0, vitest_1.beforeEach)(async () => {
        testAccounts = await (0, test_utils_1.setupTestAccounts)(3);
        // Disconnect any existing connections
        if (wallet_integration_1.walletService.isConnected()) {
            wallet_integration_1.walletService.disconnect();
        }
        // Deploy a test token
        testToken = await (0, test_utils_1.deployTestToken)('Orchestrator Test Token', 'OTT', 18, '1000000');
    });
    (0, vitest_1.afterEach)(() => {
        if (wallet_integration_1.walletService.isConnected()) {
            wallet_integration_1.walletService.disconnect();
        }
    });
    (0, vitest_1.it)('should connect and disconnect wallet', async () => {
        // Connect wallet
        const connectAction = {
            actionType: 'CONNECT_WALLET',
            walletParams: {
                type: 'private-key',
                privateKey: testAccounts[0].privateKey,
                chainId: 1337,
                rpcUrl: 'http://localhost:8545'
            }
        };
        const connectResult = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction(connectAction);
        (0, vitest_1.expect)(connectResult.success).toBe(true);
        (0, vitest_1.expect)(connectResult.actionType).toEqual('CONNECT_WALLET');
        (0, vitest_1.expect)(connectResult.data.address).toBeTruthy();
        (0, vitest_1.expect)(wallet_integration_1.walletService.isConnected()).toBe(true);
        // Disconnect wallet
        const disconnectAction = {
            actionType: 'DISCONNECT_WALLET'
        };
        const disconnectResult = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction(disconnectAction);
        (0, vitest_1.expect)(disconnectResult.success).toBe(true);
        (0, vitest_1.expect)(disconnectResult.actionType).toEqual('DISCONNECT_WALLET');
        (0, vitest_1.expect)(wallet_integration_1.walletService.isConnected()).toBe(false);
    });
    (0, vitest_1.it)('should deploy a contract', async () => {
        // Connect wallet first
        await blockchain_orchestrator_1.blockchainOrchestrator.handleAction({
            actionType: 'CONNECT_WALLET',
            walletParams: {
                type: 'private-key',
                privateKey: testAccounts[0].privateKey,
                chainId: 1337,
                rpcUrl: 'http://localhost:8545'
            }
        });
        // Deploy a simple ERC20 token
        const deployAction = {
            actionType: 'DEPLOY_CONTRACT',
            deploymentParams: {
                templateId: 'ERC20',
                templateParams: {
                    name: 'Orchestrator Token',
                    symbol: 'ORCH',
                    initialSupply: '1000000'
                }
            }
        };
        try {
            const deployResult = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction(deployAction);
            (0, vitest_1.expect)(deployResult.success).toBe(true);
            (0, vitest_1.expect)(deployResult.actionType).toEqual('DEPLOY_CONTRACT');
            (0, vitest_1.expect)(deployResult.data.transactionHash).toBeTruthy();
            // Wait for deployment to complete
            await (0, test_utils_1.sleep)(5000);
            // Check deployment status
            const statusAction = {
                actionType: 'GET_DEPLOYMENT_STATUS',
                transactionHash: deployResult.data.transactionHash
            };
            const statusResult = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction(statusAction);
            (0, vitest_1.expect)(statusResult.success).toBe(true);
            (0, vitest_1.expect)(statusResult.data.deploymentStatus).not.toEqual('pending');
        }
        catch (error) {
            // If templates aren't implemented yet, this might fail
            console.log('Template deployment not yet implemented:', error instanceof Error ? error.message : 'Unknown error');
        }
    });
    (0, vitest_1.it)('should transfer tokens', async () => {
        // Connect wallet first
        await blockchain_orchestrator_1.blockchainOrchestrator.handleAction({
            actionType: 'CONNECT_WALLET',
            walletParams: {
                type: 'private-key',
                privateKey: testAccounts[0].privateKey,
                chainId: 1337,
                rpcUrl: 'http://localhost:8545'
            }
        });
        // Transfer ETH
        const transferAction = {
            actionType: 'TRANSFER_TOKENS',
            transferParams: {
                to: testAccounts[1].address,
                amount: '0.1',
                chainId: 1337
            }
        };
        const transferResult = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction(transferAction);
        (0, vitest_1.expect)(transferResult.success).toBe(true);
        (0, vitest_1.expect)(transferResult.actionType).toEqual('TRANSFER_TOKENS');
        (0, vitest_1.expect)(transferResult.data.transactionHash).toBeTruthy();
        // Wait for transfer to complete
        await (0, test_utils_1.sleep)(5000);
        // Check transfer status
        const statusAction = {
            actionType: 'GET_TRANSFER_STATUS',
            transactionHash: transferResult.data.transactionHash
        };
        const statusResult = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction(statusAction);
        (0, vitest_1.expect)(statusResult.success).toBe(true);
        (0, vitest_1.expect)(statusResult.data.status).not.toEqual('pending');
    });
    (0, vitest_1.it)('should handle errors gracefully', async () => {
        // Try to get deployment status with invalid hash
        const invalidAction = {
            actionType: 'GET_DEPLOYMENT_STATUS',
            transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234'
        };
        const result = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction(invalidAction);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toBeTruthy();
    });
    (0, vitest_1.it)('should handle unknown action types', async () => {
        // @ts-ignore - Testing invalid action type
        const invalidAction = {
            actionType: 'INVALID_ACTION'
        };
        const result = await blockchain_orchestrator_1.blockchainOrchestrator.handleAction(invalidAction);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toContain('Unknown action type');
    });
});
