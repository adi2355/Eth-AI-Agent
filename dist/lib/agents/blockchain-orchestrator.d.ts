import { DeploymentParams } from './deployment/contract-deployment-agent';
import { TransferParams } from './transaction/token-transfer-agent';
import { WalletConnectionOptions } from '../blockchain/wallet-integration';
export type BlockchainActionType = 'CONNECT_WALLET' | 'DISCONNECT_WALLET' | 'DEPLOY_CONTRACT' | 'TRANSFER_TOKENS' | 'GET_TOKEN_INFO' | 'GET_CONTRACT_TEMPLATES' | 'GET_DEPLOYMENT_STATUS' | 'GET_TRANSFER_STATUS';
export interface BlockchainActionParams {
    actionType: BlockchainActionType;
    walletParams?: WalletConnectionOptions;
    deploymentParams?: DeploymentParams;
    transferParams?: TransferParams;
    tokenAddress?: `0x${string}`;
    chainId?: number;
    templateCategory?: string;
    transactionHash?: `0x${string}`;
}
export interface BlockchainActionResult {
    success: boolean;
    actionType: BlockchainActionType;
    data?: any;
    error?: string;
}
export declare class BlockchainOrchestrator {
    handleAction(params: BlockchainActionParams): Promise<BlockchainActionResult>;
    private connectWallet;
    private disconnectWallet;
    private deployContract;
    private transferTokens;
    private getTokenInfo;
    private getContractTemplates;
    private getDeploymentStatus;
    private getTransferStatus;
}
export declare const blockchainOrchestrator: BlockchainOrchestrator;
