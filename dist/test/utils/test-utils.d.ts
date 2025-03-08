export declare function setupTestAccounts(count?: number, ethAmount?: string): Promise<any[]>;
export declare function deployTestToken(name?: string, symbol?: string, decimals?: number, totalSupply?: string): Promise<{
    address: `0x${string}`;
    instance: any;
}>;
export declare function createMockWalletProvider(privateKey: string): {
    getAddress: () => Promise<`0x${string}`>;
    signMessage: (message: string) => Promise<string>;
    sendTransaction: (tx: any) => Promise<import("ethers/lib.commonjs").TransactionResponse>;
};
export declare function sleep(ms: number): Promise<unknown>;
