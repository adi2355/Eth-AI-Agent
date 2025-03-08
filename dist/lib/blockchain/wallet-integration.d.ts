export type WalletType = 'metamask' | 'walletconnect' | 'private-key' | 'hardware';
export interface WalletConnectionOptions {
    type: WalletType;
    chainId?: number;
    privateKey?: string;
    rpcUrl?: string;
}
export interface TransactionOptions {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    nonce?: number;
}
export declare class WalletIntegrationService {
    private walletClient;
    private connectedChainId;
    private connectedAddress;
    private pendingTransactions;
    connect(options: WalletConnectionOptions): Promise<`0x${string}`>;
    isConnected(): boolean;
    getAddress(): `0x${string}`;
    sendTransaction(options: TransactionOptions): Promise<`0x${string}`>;
    waitForTransaction(hash: `0x${string}`, confirmations?: number): Promise<any>;
    getPendingTransactions(): any[];
    getTransaction(hash: `0x${string}`): any;
    disconnect(): void;
    static parseEther(amount: string): bigint;
    static parseGwei(amount: string): bigint;
}
export declare const walletService: WalletIntegrationService;
