
export interface BlockchainApi {
  connectWallet(provider: string): Promise<string>;
  deployContract(templateId: string, params: any, options?: any): Promise<{
    transactionHash: string;
    contractAddress: string;
    deploymentStatus: string;
  }>;
  transferTokens(to: string, amount: string, tokenAddress?: string): Promise<{
    transactionHash: string;
    status: string;
  }>;
}

export const blockchainApi: BlockchainApi;
