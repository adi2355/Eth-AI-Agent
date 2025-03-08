"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientForChain = exports.polygonClient = exports.arbitrumClient = exports.sepoliaClient = exports.publicClient = void 0;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
// Get the RPC URL from environment variables or use default
const getRpcUrl = (network) => {
    const envVar = `${network.toUpperCase()}_RPC_URL`;
    return process.env[envVar] || getDefaultRpcUrl(network);
};
// Default public RPC URLs (consider using your own for production)
const getDefaultRpcUrl = (network) => {
    switch (network) {
        case 'mainnet': return 'https://eth-mainnet.g.alchemy.com/v2/demo';
        case 'sepolia': return 'https://eth-sepolia.g.alchemy.com/v2/demo';
        case 'arbitrum': return 'https://arb-mainnet.g.alchemy.com/v2/demo';
        case 'optimism': return 'https://opt-mainnet.g.alchemy.com/v2/demo';
        case 'polygon': return 'https://polygon-mainnet.g.alchemy.com/v2/demo';
        default: return 'https://eth-mainnet.g.alchemy.com/v2/demo';
    }
};
// Create public clients for different chains
exports.publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.mainnet,
    transport: (0, viem_1.http)(getRpcUrl('mainnet'))
});
exports.sepoliaClient = (0, viem_1.createPublicClient)({
    chain: chains_1.sepolia,
    transport: (0, viem_1.http)(getRpcUrl('sepolia'))
});
exports.arbitrumClient = (0, viem_1.createPublicClient)({
    chain: chains_1.arbitrum,
    transport: (0, viem_1.http)(getRpcUrl('arbitrum'))
});
exports.polygonClient = (0, viem_1.createPublicClient)({
    chain: chains_1.polygon,
    transport: (0, viem_1.http)(getRpcUrl('polygon'))
});
const getClientForChain = (chainId) => {
    switch (chainId) {
        case 1: return exports.publicClient;
        case 11155111: return exports.sepoliaClient;
        case 42161: return exports.arbitrumClient;
        case 137: return exports.polygonClient;
        default: return exports.publicClient;
    }
};
exports.getClientForChain = getClientForChain;
