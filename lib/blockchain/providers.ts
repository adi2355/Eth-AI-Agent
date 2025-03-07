import { createPublicClient, http } from 'viem';
import { mainnet, sepolia, arbitrum, optimism, polygon } from 'viem/chains';

// Get the RPC URL from environment variables or use default
const getRpcUrl = (network: string): string => {
  const envVar = `${network.toUpperCase()}_RPC_URL`;
  return process.env[envVar] || getDefaultRpcUrl(network);
};

// Default public RPC URLs (consider using your own for production)
const getDefaultRpcUrl = (network: string): string => {
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
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(getRpcUrl('mainnet'))
});

export const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(getRpcUrl('sepolia'))
});

export const arbitrumClient = createPublicClient({
  chain: arbitrum,
  transport: http(getRpcUrl('arbitrum'))
});

export const polygonClient = createPublicClient({
  chain: polygon,
  transport: http(getRpcUrl('polygon'))
});

export const getClientForChain = (chainId: number) => {
  switch (chainId) {
    case 1: return publicClient;
    case 11155111: return sepoliaClient;
    case 42161: return arbitrumClient;
    case 137: return polygonClient;
    default: return publicClient;
  }
}; 