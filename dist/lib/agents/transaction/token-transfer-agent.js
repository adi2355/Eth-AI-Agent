"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenTransferAgent = exports.TokenTransferAgent = void 0;
const wallet_integration_1 = require("../../blockchain/wallet-integration");
const token_registry_1 = require("../../blockchain/token-registry");
const contract_validator_1 = require("../security/contract-validator");
class TokenTransferAgent {
    constructor() {
        this.transfers = new Map();
    }
    // Transfer ETH or tokens
    async transferTokens(params) {
        try {
            // Check if wallet is connected
            if (!wallet_integration_1.walletService.isConnected()) {
                throw new Error('Wallet not connected');
            }
            // Validate recipient address
            if (!params.to || !params.to.startsWith('0x')) {
                throw new Error('Invalid recipient address');
            }
            // Validate amount
            if (!params.amount || isNaN(Number(params.amount)) || Number(params.amount) <= 0) {
                throw new Error('Invalid amount');
            }
            // Determine if this is an ETH transfer or token transfer
            const isEthTransfer = !params.tokenAddress;
            let amountInWei;
            let txHash;
            if (isEthTransfer) {
                // ETH transfer
                amountInWei = wallet_integration_1.WalletIntegrationService.parseEther(params.amount);
                // Validate transaction
                const validationResult = await (0, contract_validator_1.validateTransaction)(params.to, amountInWei, undefined);
                if (!validationResult.valid) {
                    throw new Error(`Transaction validation failed: ${validationResult.issues.map(i => i.title).join(', ')}`);
                }
                // Prepare transaction options
                const txOptions = {
                    to: params.to,
                    value: amountInWei,
                    data: undefined
                };
                // Add gas parameters if provided
                if (params.gasLimit) {
                    txOptions.gasLimit = BigInt(params.gasLimit);
                }
                if (params.maxFeePerGas) {
                    txOptions.maxFeePerGas = BigInt(params.maxFeePerGas);
                }
                if (params.maxPriorityFeePerGas) {
                    txOptions.maxPriorityFeePerGas = BigInt(params.maxPriorityFeePerGas);
                }
                // Send transaction
                txHash = await wallet_integration_1.walletService.sendTransaction(txOptions);
            }
            else {
                // Token transfer
                // Get token info
                const tokenInfo = await token_registry_1.tokenRegistry.getToken(params.tokenAddress, params.chainId);
                if (!tokenInfo) {
                    // Try to load token info from blockchain
                    await token_registry_1.tokenRegistry.loadTokenInfo(params.tokenAddress, params.chainId);
                }
                // Convert amount to token decimals
                const token = token_registry_1.tokenRegistry.getToken(params.tokenAddress, params.chainId);
                if (!token) {
                    throw new Error(`Token information not found for ${params.tokenAddress}`);
                }
                // Calculate amount in wei based on token decimals
                amountInWei = wallet_integration_1.WalletIntegrationService.parseEther(params.amount);
                if (token.decimals !== 18) {
                    // Adjust for token decimals
                    const decimalsDiff = 18 - token.decimals;
                    if (decimalsDiff > 0) {
                        amountInWei = amountInWei / BigInt(10 ** decimalsDiff);
                    }
                    else {
                        amountInWei = amountInWei * BigInt(10 ** Math.abs(decimalsDiff));
                    }
                }
                // Transfer tokens
                txHash = await token_registry_1.tokenRegistry.transfer(params.tokenAddress, params.to, amountInWei, params.chainId);
            }
            // Create transfer result
            const transferResult = {
                transactionHash: txHash,
                tokenAddress: params.tokenAddress || null,
                to: params.to,
                amount: params.amount,
                amountInWei,
                status: 'pending'
            };
            // Store the transfer
            this.transfers.set(txHash, transferResult);
            // Wait for transaction confirmation in the background
            this.waitForTransfer(txHash);
            return transferResult;
        }
        catch (error) {
            console.error('Token transfer error:', error);
            throw new Error(`Failed to transfer tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Wait for transfer confirmation
    async waitForTransfer(hash) {
        try {
            // Wait for transaction receipt
            const receipt = await wallet_integration_1.walletService.waitForTransaction(hash);
            // Update transfer result
            const transfer = this.transfers.get(hash);
            if (transfer) {
                transfer.status = receipt.status === 'success' ? 'success' : 'failed';
                transfer.receipt = receipt;
                this.transfers.set(hash, transfer);
            }
        }
        catch (error) {
            console.error('Transfer confirmation error:', error);
            // Update transfer status to failed
            const transfer = this.transfers.get(hash);
            if (transfer) {
                transfer.status = 'failed';
                transfer.error = `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                this.transfers.set(hash, transfer);
            }
        }
    }
    // Get transfer status
    getTransfer(hash) {
        return this.transfers.get(hash) || null;
    }
    // Get all transfers
    getAllTransfers() {
        return Array.from(this.transfers.values());
    }
    // Get pending transfers
    getPendingTransfers() {
        return Array.from(this.transfers.values()).filter(transfer => transfer.status === 'pending');
    }
}
exports.TokenTransferAgent = TokenTransferAgent;
// Export singleton instance
exports.tokenTransferAgent = new TokenTransferAgent();
