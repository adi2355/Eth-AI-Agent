/**
 * Project Bolt Blockchain Integration
 *
 * This is the main entry point for the blockchain integration.
 */
export declare const blockchainApi: {
    connectWallet: (provider: string) => Promise<string>;
    deployContract: (templateId: string, params: any, options?: any) => Promise<{
        transactionHash: string;
        contractAddress: string;
        deploymentStatus: string;
    }>;
    transferTokens: (to: string, amount: string, tokenAddress?: string) => Promise<{
        transactionHash: string;
        status: string;
    }>;
};
