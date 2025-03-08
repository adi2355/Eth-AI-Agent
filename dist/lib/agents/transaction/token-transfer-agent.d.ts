export interface TransferParams {
    tokenAddress?: `0x${string}` | null;
    to: `0x${string}`;
    amount: string;
    chainId: number;
    gasLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}
export interface TransferResult {
    transactionHash: `0x${string}`;
    tokenAddress: `0x${string}` | null;
    to: `0x${string}`;
    amount: string;
    amountInWei: bigint;
    status: 'pending' | 'success' | 'failed';
    receipt?: any;
    error?: string;
}
export declare class TokenTransferAgent {
    private transfers;
    transferTokens(params: TransferParams): Promise<TransferResult>;
    private waitForTransfer;
    getTransfer(hash: `0x${string}`): TransferResult | null;
    getAllTransfers(): TransferResult[];
    getPendingTransfers(): TransferResult[];
}
export declare const tokenTransferAgent: TokenTransferAgent;
