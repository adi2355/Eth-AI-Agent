"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestEnvironment = setupTestEnvironment;
const hardhat_1 = require("hardhat");
require("../scripts/load-env");
// Setup global hooks for tests
async function setupTestEnvironment() {
    // Start a local hardhat node if needed
    // Check if a node is already running
    try {
        const provider = new hardhat_1.ethers.providers.JsonRpcProvider('http://localhost:8545');
        await provider.getBlockNumber();
        console.log('Connected to local Ethereum node');
    }
    catch (error) {
        console.error('Failed to connect to local Ethereum node. Make sure to start a node with:');
        console.error('npx hardhat node');
        process.exit(1);
    }
}
// Setup testing environment
setupTestEnvironment().catch(console.error);
// Optional: Additional setup
global.IS_REACT_ACT_ENVIRONMENT = true;
