"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestAccounts = setupTestAccounts;
exports.deployTestToken = deployTestToken;
exports.createMockWalletProvider = createMockWalletProvider;
exports.sleep = sleep;
const hardhat_1 = require("hardhat");
const viem_1 = require("viem");
// Setup test accounts with ETH
async function setupTestAccounts(count = 5, ethAmount = '10') {
    const accounts = [];
    const signers = await hardhat_1.ethers.getSigners();
    for (let i = 0; i < count && i < signers.length; i++) {
        accounts.push({
            address: signers[i].address,
            privateKey: signers[i].privateKey,
            signer: signers[i]
        });
    }
    return accounts;
}
// Deploy a test ERC20 token for testing
async function deployTestToken(name = 'Test Token', symbol = 'TEST', decimals = 18, totalSupply = '1000000') {
    const TokenFactory = await hardhat_1.ethers.getContractFactory('TestERC20');
    const token = await TokenFactory.deploy(name, symbol, decimals, (0, viem_1.parseEther)(totalSupply));
    await token.deployed();
    return {
        address: token.address,
        instance: token
    };
}
// Mock wallet provider for testing
function createMockWalletProvider(privateKey) {
    const wallet = new hardhat_1.ethers.Wallet(privateKey, hardhat_1.ethers.provider);
    return {
        getAddress: async () => wallet.address,
        signMessage: async (message) => wallet.signMessage(message),
        sendTransaction: async (tx) => wallet.sendTransaction(tx)
    };
}
// Sleep function for tests
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
