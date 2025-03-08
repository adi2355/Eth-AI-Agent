import { createPublicClient, http, getContract, PublicClient } from 'viem';
import { mainnet, sepolia, optimism, arbitrum } from 'viem/chains';
import { erc20Abi } from './abis/erc20-abi';
import { TransactionOptions, WalletIntegrationService } from './wallet-integration';
import { parseAbi, encodeFunctionData } from 'viem';

// Token information interface
export interface TokenInfo {
  address: `0x${string}`;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  isVerified?: boolean;
}

// Chain configuration
interface ChainConfig {
  chainId: number;
  client: PublicClient;
}

// Common ERC20 ABI functions
const ERC20_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)'
]);

export class TokenRegistry {
  private tokens: Map<string, TokenInfo> = new Map();
  private chains: Map<number, ChainConfig> = new Map();
  
  constructor() {
    // Initialize supported chains
    this.initializeChains();
  }
  
  private initializeChains(): void {
    // Mainnet
    this.chains.set(1, {
      chainId: 1,
      client: createPublicClient({
        chain: mainnet,
        transport: http()
      })
    });
    
    // Sepolia (Ethereum testnet)
    this.chains.set(11155111, {
      chainId: 11155111,
      client: createPublicClient({
        chain: sepolia,
        transport: http()
      })
    });
    
    // Optimism
    this.chains.set(10, {
      chainId: 10,
      client: createPublicClient({
        chain: optimism,
        transport: http()
      })
    });
    
    // Arbitrum
    this.chains.set(42161, {
      chainId: 42161,
      client: createPublicClient({
        chain: arbitrum,
        transport: http()
      })
    });
  }
  
  // Get token key (chainId + address)
  private getTokenKey(address: `0x${string}`, chainId: number): string {
    return `${chainId}-${address.toLowerCase()}`;
  }
  
  // Add token to registry
  addToken(token: TokenInfo): void {
    const key = this.getTokenKey(token.address, token.chainId);
    this.tokens.set(key, token);
  }
  
  // Get token from registry
  getToken(address: `0x${string}`, chainId: number): TokenInfo | undefined {
    const key = this.getTokenKey(address, chainId);
    return this.tokens.get(key);
  }
  
  // Load token info from blockchain
  async loadTokenInfo(address: `0x${string}`, chainId: number): Promise<TokenInfo> {
    // Check if chain is supported
    const chainConfig = this.chains.get(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ID ${chainId} is not supported`);
    }
    
    try {
      // Create contract instance
      const contract = getContract({
        address,
        abi: erc20Abi,
        publicClient: chainConfig.client
      });
      
      // Get token info
      const [name, symbol, decimals] = await Promise.all([
        contract.read.name(),
        contract.read.symbol(),
        contract.read.decimals()
      ]);
      
      // Create token info
      const tokenInfo: TokenInfo = {
        address,
        chainId,
        name: name as string,
        symbol: symbol as string,
        decimals: Number(decimals),
        isVerified: false
      };
      
      // Add to registry
      this.addToken(tokenInfo);
      
      return tokenInfo;
    } catch (error) {
      console.error('Error loading token info:', error);
      throw new Error(`Failed to load token info for ${address} on chain ${chainId}`);
    }
  }
  
  // Get all tokens
  getAllTokens(): TokenInfo[] {
    return Array.from(this.tokens.values());
  }
  
  // Get tokens by chain
  getTokensByChain(chainId: number): TokenInfo[] {
    return this.getAllTokens().filter(token => token.chainId === chainId);
  }
  
  // Check if token exists
  hasToken(address: `0x${string}`, chainId: number): boolean {
    const key = this.getTokenKey(address, chainId);
    return this.tokens.has(key);
  }
  
  // Remove token from registry
  removeToken(address: `0x${string}`, chainId: number): boolean {
    const key = this.getTokenKey(address, chainId);
    return this.tokens.delete(key);
  }
  
  // Clear registry
  clearRegistry(): void {
    this.tokens.clear();
  }
  
  // Get token balance
  async getBalance(tokenAddress: `0x${string}`, ownerAddress: `0x${string}`, chainId: number): Promise<bigint> {
    const chainConfig = this.chains.get(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ID ${chainId} is not supported`);
    }
    
    const balance = await chainConfig.client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [ownerAddress]
    });
    
    return balance as bigint;
  }
  
  // Transfer tokens
  async transfer(
    walletServiceInstance: WalletIntegrationService,
    tokenAddress: `0x${string}`, 
    to: `0x${string}`, 
    amount: bigint, 
    chainId: number
  ): Promise<`0x${string}`> {
    if (!walletServiceInstance.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    // Encode the transfer function call
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, amount]
    });
    
    // Create transaction options
    const txOptions: TransactionOptions = {
      to: tokenAddress,
      data,
      value: 0n
    };
    
    // Send the transaction
    return walletServiceInstance.sendTransaction(txOptions);
  }
  
  // Approve token spending
  async approve(
    walletServiceInstance: WalletIntegrationService,
    tokenAddress: `0x${string}`, 
    spender: `0x${string}`, 
    amount: bigint, 
    chainId: number
  ): Promise<`0x${string}`> {
    if (!walletServiceInstance.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    // Encode the approve function call
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount]
    });
    
    // Create transaction options
    const txOptions: TransactionOptions = {
      to: tokenAddress,
      data,
      value: 0n
    };
    
    // Send the transaction
    return walletServiceInstance.sendTransaction(txOptions);
  }
  
  // Get token allowance
  async getAllowance(
    tokenAddress: `0x${string}`,
    ownerAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    chainId: number
  ): Promise<bigint> {
    const chainConfig = this.chains.get(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ID ${chainId} is not supported`);
    }
    
    const allowance = await chainConfig.client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [ownerAddress, spenderAddress]
    });
    
    return allowance as bigint;
  }
}

// Export singleton instance
export const tokenRegistry = new TokenRegistry();

// Common tokens
const COMMON_TOKENS: TokenInfo[] = [
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    chainId: 1,
    logoURI: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png'
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    chainId: 1,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png'
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`,
    name: 'Tether',
    symbol: 'USDT',
    decimals: 6,
    chainId: 1,
    logoURI: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png'
  }
];

// Initialize common tokens
COMMON_TOKENS.forEach(token => tokenRegistry.addToken(token)); 