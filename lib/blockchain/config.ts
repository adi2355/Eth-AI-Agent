/**
 * Blockchain Configuration
 * 
 * This module provides configuration options for the blockchain integration.
 * It includes flags for enabling/disabling features based on the environment.
 */

// Environment detection
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';
export const IS_BROWSER = typeof window !== 'undefined';
export const IS_SERVER = !IS_BROWSER;

// Feature flags (can be overridden by environment variables)
export const USE_MOCKS = process.env.USE_BLOCKCHAIN_MOCKS === 'true' || IS_TEST;
export const USE_HARDHAT = process.env.USE_HARDHAT === 'true' || (IS_DEVELOPMENT && !USE_MOCKS);
export const USE_TESTNET = process.env.USE_TESTNET === 'true' || (!IS_DEVELOPMENT && !IS_TEST);

// Network configuration
export const DEFAULT_NETWORK = USE_TESTNET ? 'sepolia' : (USE_HARDHAT ? 'localhost' : 'mainnet');
export const DEFAULT_CHAIN_ID = getChainIdForNetwork(DEFAULT_NETWORK);

// RPC URLs
export const RPC_URLS: Record<string, string> = {
  mainnet: process.env.MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
  sepolia: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
  localhost: 'http://127.0.0.1:8545',
};

// Helper function to get chain ID for network
function getChainIdForNetwork(network: string): number {
  switch (network) {
    case 'mainnet': return 1;
    case 'sepolia': return 11155111;
    case 'localhost': return 1337;
    default: return 1;
  }
}

// Contract addresses for different networks
export const CONTRACT_ADDRESSES: Record<string, Record<string, string>> = {
  // Mainnet contract addresses
  mainnet: {
    SimpleToken: process.env.MAINNET_SIMPLE_TOKEN_ADDRESS || '',
  },
  
  // Sepolia contract addresses
  sepolia: {
    SimpleToken: process.env.SEPOLIA_SIMPLE_TOKEN_ADDRESS || '',
  },
  
  // Local Hardhat network addresses
  localhost: {
    SimpleToken: process.env.LOCAL_SIMPLE_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Default first deployment address
  },
};

// Get contract address for current network
export function getContractAddress(contractName: string): string {
  return CONTRACT_ADDRESSES[DEFAULT_NETWORK]?.[contractName] || '';
} 