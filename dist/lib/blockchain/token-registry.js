"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenRegistry = exports.TokenRegistry = void 0;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const erc20_abi_1 = require("./abis/erc20-abi");
const wallet_integration_1 = require("./wallet-integration");
const viem_2 = require("viem");
// Common ERC20 ABI functions
const ERC20_ABI = (0, viem_2.parseAbi)([
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
class TokenRegistry {
    constructor() {
        this.tokens = new Map();
        this.chains = new Map();
        // Initialize supported chains
        this.initializeChains();
    }
    initializeChains() {
        // Mainnet
        this.chains.set(1, {
            chainId: 1,
            client: (0, viem_1.createPublicClient)({
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)()
            })
        });
        // Sepolia (Ethereum testnet)
        this.chains.set(11155111, {
            chainId: 11155111,
            client: (0, viem_1.createPublicClient)({
                chain: chains_1.sepolia,
                transport: (0, viem_1.http)()
            })
        });
        // Optimism
        this.chains.set(10, {
            chainId: 10,
            client: (0, viem_1.createPublicClient)({
                chain: chains_1.optimism,
                transport: (0, viem_1.http)()
            })
        });
        // Arbitrum
        this.chains.set(42161, {
            chainId: 42161,
            client: (0, viem_1.createPublicClient)({
                chain: chains_1.arbitrum,
                transport: (0, viem_1.http)()
            })
        });
    }
    // Get token key (chainId + address)
    getTokenKey(address, chainId) {
        return `${chainId}-${address.toLowerCase()}`;
    }
    // Add token to registry
    addToken(token) {
        const key = this.getTokenKey(token.address, token.chainId);
        this.tokens.set(key, token);
    }
    // Get token from registry
    getToken(address, chainId) {
        const key = this.getTokenKey(address, chainId);
        return this.tokens.get(key);
    }
    // Load token info from blockchain
    async loadTokenInfo(address, chainId) {
        // Check if chain is supported
        const chainConfig = this.chains.get(chainId);
        if (!chainConfig) {
            throw new Error(`Chain ID ${chainId} is not supported`);
        }
        try {
            // Create contract instance
            const contract = (0, viem_1.getContract)({
                address,
                abi: erc20_abi_1.erc20Abi,
                publicClient: chainConfig.client
            });
            // Get token info
            const [name, symbol, decimals] = await Promise.all([
                contract.read.name(),
                contract.read.symbol(),
                contract.read.decimals()
            ]);
            // Create token info
            const tokenInfo = {
                address,
                chainId,
                name: name,
                symbol: symbol,
                decimals: Number(decimals),
                isVerified: false
            };
            // Add to registry
            this.addToken(tokenInfo);
            return tokenInfo;
        }
        catch (error) {
            console.error('Error loading token info:', error);
            throw new Error(`Failed to load token info for ${address} on chain ${chainId}`);
        }
    }
    // Get all tokens
    getAllTokens() {
        return Array.from(this.tokens.values());
    }
    // Get tokens by chain
    getTokensByChain(chainId) {
        return this.getAllTokens().filter(token => token.chainId === chainId);
    }
    // Check if token exists
    hasToken(address, chainId) {
        const key = this.getTokenKey(address, chainId);
        return this.tokens.has(key);
    }
    // Remove token from registry
    removeToken(address, chainId) {
        const key = this.getTokenKey(address, chainId);
        return this.tokens.delete(key);
    }
    // Clear registry
    clearRegistry() {
        this.tokens.clear();
    }
    // Get token balance
    async getBalance(tokenAddress, ownerAddress, chainId) {
        const chainConfig = this.chains.get(chainId);
        if (!chainConfig) {
            throw new Error(`Chain ID ${chainId} is not supported`);
        }
        const balance = await chainConfig.client.readContract({
            address: tokenAddress,
            abi: erc20_abi_1.erc20Abi,
            functionName: 'balanceOf',
            args: [ownerAddress]
        });
        return balance;
    }
    // Transfer tokens
    async transfer(tokenAddress, to, amount, chainId) {
        if (!wallet_integration_1.walletService.isConnected()) {
            throw new Error('Wallet not connected');
        }
        // Encode the transfer function call
        const data = (0, viem_2.encodeFunctionData)({
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [to, amount]
        });
        // Create transaction options
        const txOptions = {
            to: tokenAddress,
            data,
            value: 0n
        };
        // Send the transaction
        return wallet_integration_1.walletService.sendTransaction(txOptions);
    }
    // Approve token spending
    async approve(tokenAddress, spender, amount, chainId) {
        if (!wallet_integration_1.walletService.isConnected()) {
            throw new Error('Wallet not connected');
        }
        // Encode the approve function call
        const data = (0, viem_2.encodeFunctionData)({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [spender, amount]
        });
        // Create transaction options
        const txOptions = {
            to: tokenAddress,
            data,
            value: 0n
        };
        // Send the transaction
        return wallet_integration_1.walletService.sendTransaction(txOptions);
    }
    // Get token allowance
    async getAllowance(tokenAddress, ownerAddress, spenderAddress, chainId) {
        const chainConfig = this.chains.get(chainId);
        if (!chainConfig) {
            throw new Error(`Chain ID ${chainId} is not supported`);
        }
        const allowance = await chainConfig.client.readContract({
            address: tokenAddress,
            abi: erc20_abi_1.erc20Abi,
            functionName: 'allowance',
            args: [ownerAddress, spenderAddress]
        });
        return allowance;
    }
}
exports.TokenRegistry = TokenRegistry;
// Export singleton instance
exports.tokenRegistry = new TokenRegistry();
// Common tokens
const COMMON_TOKENS = [
    {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        chainId: 1,
        logoURI: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png'
    },
    {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        chainId: 1,
        logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png'
    },
    {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        name: 'Tether',
        symbol: 'USDT',
        decimals: 6,
        chainId: 1,
        logoURI: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png'
    }
];
// Initialize common tokens
COMMON_TOKENS.forEach(token => exports.tokenRegistry.addToken(token));
