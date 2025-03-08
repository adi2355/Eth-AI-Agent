export interface TokenInfo {
    address: `0x${string}`;
    chainId: number;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
    isVerified?: boolean;
}
export declare class TokenRegistry {
    private tokens;
    private chains;
    constructor();
    private initializeChains;
    private getTokenKey;
    addToken(token: TokenInfo): void;
    getToken(address: `0x${string}`, chainId: number): TokenInfo | undefined;
    loadTokenInfo(address: `0x${string}`, chainId: number): Promise<TokenInfo>;
    getAllTokens(): TokenInfo[];
    getTokensByChain(chainId: number): TokenInfo[];
    hasToken(address: `0x${string}`, chainId: number): boolean;
    removeToken(address: `0x${string}`, chainId: number): boolean;
    clearRegistry(): void;
    getBalance(tokenAddress: `0x${string}`, ownerAddress: `0x${string}`, chainId: number): Promise<bigint>;
    transfer(tokenAddress: `0x${string}`, to: `0x${string}`, amount: bigint, chainId: number): Promise<`0x${string}`>;
    approve(tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint, chainId: number): Promise<`0x${string}`>;
    getAllowance(tokenAddress: `0x${string}`, ownerAddress: `0x${string}`, spenderAddress: `0x${string}`, chainId: number): Promise<bigint>;
}
export declare const tokenRegistry: TokenRegistry;
