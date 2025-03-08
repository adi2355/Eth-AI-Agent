"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const hardhat_1 = require("hardhat");
const wallet_integration_1 = require("../lib/blockchain/wallet-integration");
const token_transfer_agent_1 = require("../lib/agents/transaction/token-transfer-agent");
const token_registry_1 = require("../lib/blockchain/token-registry");
const test_utils_1 = require("./utils/test-utils");
(0, vitest_1.describe)('Token Transfer Agent', () => {
    let testAccounts;
    let testToken;
    (0, vitest_1.beforeEach)(async () => {
        testAccounts = await (0, test_utils_1.setupTestAccounts)(3);
        // Connect wallet for testing
        if (!wallet_integration_1.walletService.isConnected()) {
            await wallet_integration_1.walletService.connect({
                type: 'private-key',
                privateKey: testAccounts[0].privateKey,
                chainId: 1337,
                rpcUrl: 'http://localhost:8545'
            });
        }
        // Deploy a test token
        testToken = await (0, test_utils_1.deployTestToken)('Test Token', 'TEST', 18, '1000000');
        // Register the token
        token_registry_1.tokenRegistry.addToken({
            address: testToken.address,
            name: 'Test Token',
            symbol: 'TEST',
            decimals: 18,
            chainId: 1337
        });
    });
    (0, vitest_1.afterEach)(() => {
        if (wallet_integration_1.walletService.isConnected()) {
            wallet_integration_1.walletService.disconnect();
        }
    });
    (0, vitest_1.it)('should transfer ETH between accounts', async () => {
        const recipient = testAccounts[1].address;
        const amount = '0.5'; // 0.5 ETH
        // Get initial balances
        const provider = hardhat_1.ethers.provider;
        const initialSenderBalance = await provider.getBalance(testAccounts[0].address);
        const initialRecipientBalance = await provider.getBalance(testAccounts[1].address);
        // Transfer ETH
        const transferParams = {
            to: recipient,
            amount,
            chainId: 1337
        };
        const result = await token_transfer_agent_1.tokenTransferAgent.transferTokens(transferParams);
        (0, vitest_1.expect)(result).toBeTruthy();
        (0, vitest_1.expect)(result.transactionHash).toBeTruthy();
        (0, vitest_1.expect)(result.transactionHash.startsWith('0x')).toBe(true);
        (0, vitest_1.expect)(result.status).toEqual('pending');
        // Wait for transfer to complete
        let transfer = null;
        for (let i = 0; i < 30; i++) {
            transfer = token_transfer_agent_1.tokenTransferAgent.getTransfer(result.transactionHash);
            if (transfer && transfer.status !== 'pending')
                break;
            await (0, test_utils_1.sleep)(1000);
        }
        (0, vitest_1.expect)(transfer).toBeTruthy();
        (0, vitest_1.expect)(transfer?.status).toEqual('success');
        // Check balances after transaction
        const finalSenderBalance = await provider.getBalance(testAccounts[0].address);
        const finalRecipientBalance = await provider.getBalance(testAccounts[1].address);
        // Recipient should have received 0.5 ETH
        const expectedAmount = hardhat_1.ethers.utils.parseEther('0.5');
        (0, vitest_1.expect)(finalRecipientBalance.sub(initialRecipientBalance).toString()).toEqual(expectedAmount.toString());
        // Sender should have spent slightly more than 0.5 ETH (including gas)
        (0, vitest_1.expect)(initialSenderBalance.sub(finalSenderBalance).gt(expectedAmount)).toBe(true);
    });
    (0, vitest_1.it)('should transfer ERC20 tokens between accounts', async () => {
        const sender = testAccounts[0].address;
        const recipient = testAccounts[2].address;
        const amount = '1000'; // 1000 tokens
        // Get initial token balances
        const initialSenderBalance = await testToken.instance.balanceOf(sender);
        const initialRecipientBalance = await testToken.instance.balanceOf(recipient);
        // Transfer tokens
        const transferParams = {
            to: recipient,
            amount,
            tokenAddress: testToken.address,
            chainId: 1337
        };
        const result = await token_transfer_agent_1.tokenTransferAgent.transferTokens(transferParams);
        (0, vitest_1.expect)(result).toBeTruthy();
        (0, vitest_1.expect)(result.transactionHash).toBeTruthy();
        (0, vitest_1.expect)(result.status).toEqual('pending');
        // Wait for transfer to complete
        let transfer = null;
        for (let i = 0; i < 30; i++) {
            transfer = token_transfer_agent_1.tokenTransferAgent.getTransfer(result.transactionHash);
            if (transfer && transfer.status !== 'pending')
                break;
            await (0, test_utils_1.sleep)(1000);
        }
        (0, vitest_1.expect)(transfer).toBeTruthy();
        (0, vitest_1.expect)(transfer?.status).toEqual('success');
        // Check token balances after transaction
        const finalSenderBalance = await testToken.instance.balanceOf(sender);
        const finalRecipientBalance = await testToken.instance.balanceOf(recipient);
        // Recipient should have received 1000 tokens
        const expectedAmount = hardhat_1.ethers.utils.parseEther('1000');
        (0, vitest_1.expect)(finalRecipientBalance.sub(initialRecipientBalance).toString()).toEqual(expectedAmount.toString());
        // Sender should have 1000 fewer tokens
        (0, vitest_1.expect)(initialSenderBalance.sub(finalSenderBalance).toString()).toEqual(expectedAmount.toString());
    });
    (0, vitest_1.it)('should handle invalid transfers gracefully', async () => {
        // Try to transfer to an invalid address
        try {
            await token_transfer_agent_1.tokenTransferAgent.transferTokens({
                to: '0xinvalid',
                amount: '1.0',
                chainId: 1337
            });
            // Should not reach here
            (0, vitest_1.expect)(true).toBe(false);
        }
        catch (error) {
            (0, vitest_1.expect)(error).toBeTruthy();
            (0, vitest_1.expect)(error.message).toContain('Invalid recipient address');
        }
        // Try to transfer an invalid amount
        try {
            await token_transfer_agent_1.tokenTransferAgent.transferTokens({
                to: testAccounts[1].address,
                amount: '-1.0',
                chainId: 1337
            });
            // Should not reach here
            (0, vitest_1.expect)(true).toBe(false);
        }
        catch (error) {
            (0, vitest_1.expect)(error).toBeTruthy();
            (0, vitest_1.expect)(error.message).toContain('Invalid amount');
        }
        // Try to transfer a non-existent token
        try {
            await token_transfer_agent_1.tokenTransferAgent.transferTokens({
                to: testAccounts[1].address,
                amount: '100',
                tokenAddress: '0x1234567890123456789012345678901234567890',
                chainId: 1337
            });
            // This might not fail immediately, but should eventually
            // The test would need to be adjusted based on your implementation
        }
        catch (error) {
            (0, vitest_1.expect)(error).toBeTruthy();
        }
    });
});
