"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const hardhat_1 = require("hardhat");
const wallet_integration_1 = require("../lib/blockchain/wallet-integration");
const test_utils_1 = require("./utils/test-utils");
(0, vitest_1.describe)('Wallet Integration Service', () => {
    let testAccounts;
    (0, vitest_1.beforeEach)(async () => {
        testAccounts = await (0, test_utils_1.setupTestAccounts)(2);
        // Disconnect any existing connections
        if (wallet_integration_1.walletService.isConnected()) {
            wallet_integration_1.walletService.disconnect();
        }
    });
    (0, vitest_1.afterEach)(() => {
        if (wallet_integration_1.walletService.isConnected()) {
            wallet_integration_1.walletService.disconnect();
        }
    });
    (0, vitest_1.it)('should connect using a private key', async () => {
        const options = {
            type: 'private-key',
            privateKey: testAccounts[0].privateKey,
            chainId: 1337,
            rpcUrl: 'http://localhost:8545'
        };
        const address = await wallet_integration_1.walletService.connect(options);
        (0, vitest_1.expect)(address.toLowerCase()).toEqual(testAccounts[0].address.toLowerCase());
        (0, vitest_1.expect)(wallet_integration_1.walletService.isConnected()).toBe(true);
        (0, vitest_1.expect)(wallet_integration_1.walletService.getAddress().toLowerCase()).toEqual(testAccounts[0].address.toLowerCase());
    });
    (0, vitest_1.it)('should send ETH between accounts', async () => {
        // Connect to first account
        await wallet_integration_1.walletService.connect({
            type: 'private-key',
            privateKey: testAccounts[0].privateKey,
            chainId: 1337,
            rpcUrl: 'http://localhost:8545'
        });
        const recipient = testAccounts[1].address;
        const amount = BigInt('1000000000000000000'); // 1 ETH
        // Get initial balances
        const provider = hardhat_1.ethers.provider;
        const initialSenderBalance = await provider.getBalance(testAccounts[0].address);
        const initialRecipientBalance = await provider.getBalance(testAccounts[1].address);
        // Send transaction
        const hash = await wallet_integration_1.walletService.sendTransaction({
            to: recipient,
            value: amount
        });
        (0, vitest_1.expect)(hash).toBeTruthy();
        (0, vitest_1.expect)(hash.startsWith('0x')).toBe(true);
        // Wait for transaction to be mined
        await wallet_integration_1.walletService.waitForTransaction(hash);
        // Check balances after transaction
        const finalSenderBalance = await provider.getBalance(testAccounts[0].address);
        const finalRecipientBalance = await provider.getBalance(testAccounts[1].address);
        // Recipient should have received 1 ETH
        (0, vitest_1.expect)(finalRecipientBalance.sub(initialRecipientBalance).toString()).toEqual(amount.toString());
        // Sender should have spent slightly more than 1 ETH (including gas)
        (0, vitest_1.expect)(initialSenderBalance.sub(finalSenderBalance).gt(amount)).toBe(true);
    });
    (0, vitest_1.it)('should track pending transactions', async () => {
        // Connect to first account
        await wallet_integration_1.walletService.connect({
            type: 'private-key',
            privateKey: testAccounts[0].privateKey,
            chainId: 1337,
            rpcUrl: 'http://localhost:8545'
        });
        const hash = await wallet_integration_1.walletService.sendTransaction({
            to: testAccounts[1].address,
            value: BigInt('100000000000000000') // 0.1 ETH
        });
        // Check pending transaction
        const pendingTxs = wallet_integration_1.walletService.getPendingTransactions();
        (0, vitest_1.expect)(pendingTxs.length).toBe(1);
        (0, vitest_1.expect)(pendingTxs[0].hash).toEqual(hash);
        (0, vitest_1.expect)(pendingTxs[0].status).toEqual('pending');
        // Wait for confirmation
        await wallet_integration_1.walletService.waitForTransaction(hash);
        // Should no longer be pending
        const updatedPendingTxs = wallet_integration_1.walletService.getPendingTransactions();
        (0, vitest_1.expect)(updatedPendingTxs.length).toBe(0);
        // Should be able to get the transaction
        const tx = wallet_integration_1.walletService.getTransaction(hash);
        (0, vitest_1.expect)(tx).toBeTruthy();
        (0, vitest_1.expect)(tx.status).toEqual('confirmed');
    });
    (0, vitest_1.it)('should handle transaction errors gracefully', async () => {
        // Connect to first account
        await wallet_integration_1.walletService.connect({
            type: 'private-key',
            privateKey: testAccounts[0].privateKey,
            chainId: 1337,
            rpcUrl: 'http://localhost:8545'
        });
        try {
            // Try to send more ETH than the account has
            const excessiveAmount = BigInt('10000000000000000000000'); // 10,000 ETH
            await wallet_integration_1.walletService.sendTransaction({
                to: testAccounts[1].address,
                value: excessiveAmount
            });
            // Should not reach here
            (0, vitest_1.expect)(true).toBe(false);
        }
        catch (error) {
            (0, vitest_1.expect)(error).toBeTruthy();
            (0, vitest_1.expect)(error.message).toContain('insufficient funds');
        }
    });
});
