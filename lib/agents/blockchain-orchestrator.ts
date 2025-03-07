import { contractDeploymentAgent, DeploymentParams, DeploymentResult } from './deployment/contract-deployment-agent';
import { tokenTransferAgent, TransferParams, TransferResult } from './transaction/token-transfer-agent';
import { walletService, WalletConnectionOptions } from '../blockchain/wallet-integration';
import { tokenRegistry, TokenInfo } from '../blockchain/token-registry';
import { getTemplate, ContractTemplate } from './deployment/contract-templates';

// Helper functions for contract templates
async function getAllTemplates(): Promise<ContractTemplate[]> {
  // In a real implementation, this would fetch all templates from a database or API
  // For now, we'll return a simple array of templates
  const templates: ContractTemplate[] = [];
  
  const erc20Template = await getTemplate('ERC20');
  const erc721Template = await getTemplate('ERC721');
  const erc1155Template = await getTemplate('ERC1155');
  
  if (erc20Template) templates.push(erc20Template);
  if (erc721Template) templates.push(erc721Template);
  if (erc1155Template) templates.push(erc1155Template);
  
  return templates;
}

async function getTemplatesByCategory(category: string): Promise<ContractTemplate[]> {
  // In a real implementation, this would filter templates by category
  const allTemplates = await getAllTemplates();
  return allTemplates.filter(template => template.category === category);
}

// Blockchain action types
export type BlockchainActionType = 
  | 'CONNECT_WALLET'
  | 'DISCONNECT_WALLET'
  | 'DEPLOY_CONTRACT'
  | 'TRANSFER_TOKENS'
  | 'GET_TOKEN_INFO'
  | 'GET_CONTRACT_TEMPLATES'
  | 'GET_DEPLOYMENT_STATUS'
  | 'GET_TRANSFER_STATUS';

// Blockchain action parameters
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

// Blockchain action result
export interface BlockchainActionResult {
  success: boolean;
  actionType: BlockchainActionType;
  data?: any;
  error?: string;
}

export class BlockchainOrchestrator {
  // Handle blockchain actions
  async handleAction(params: BlockchainActionParams): Promise<BlockchainActionResult> {
    try {
      switch (params.actionType) {
        case 'CONNECT_WALLET':
          return await this.connectWallet(params.walletParams!);
          
        case 'DISCONNECT_WALLET':
          return this.disconnectWallet();
          
        case 'DEPLOY_CONTRACT':
          return await this.deployContract(params.deploymentParams!);
          
        case 'TRANSFER_TOKENS':
          return await this.transferTokens(params.transferParams!);
          
        case 'GET_TOKEN_INFO':
          return await this.getTokenInfo(params.tokenAddress!, params.chainId!);
          
        case 'GET_CONTRACT_TEMPLATES':
          return await this.getContractTemplates(params.templateCategory);
          
        case 'GET_DEPLOYMENT_STATUS':
          return this.getDeploymentStatus(params.transactionHash!);
          
        case 'GET_TRANSFER_STATUS':
          return this.getTransferStatus(params.transactionHash!);
          
        default:
          throw new Error(`Unknown action type: ${params.actionType}`);
      }
    } catch (error) {
      console.error('Blockchain action error:', error);
      return {
        success: false,
        actionType: params.actionType,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Connect wallet
  private async connectWallet(params: WalletConnectionOptions): Promise<BlockchainActionResult> {
    try {
      const address = await walletService.connect(params);
      return {
        success: true,
        actionType: 'CONNECT_WALLET',
        data: { address }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'CONNECT_WALLET',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Disconnect wallet
  private disconnectWallet(): BlockchainActionResult {
    try {
      walletService.disconnect();
      return {
        success: true,
        actionType: 'DISCONNECT_WALLET'
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'DISCONNECT_WALLET',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Deploy contract
  private async deployContract(params: DeploymentParams): Promise<BlockchainActionResult> {
    try {
      const result = await contractDeploymentAgent.deployContract(params);
      return {
        success: true,
        actionType: 'DEPLOY_CONTRACT',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'DEPLOY_CONTRACT',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Transfer tokens
  private async transferTokens(params: TransferParams): Promise<BlockchainActionResult> {
    try {
      const result = await tokenTransferAgent.transferTokens(params);
      return {
        success: true,
        actionType: 'TRANSFER_TOKENS',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'TRANSFER_TOKENS',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get token info
  private async getTokenInfo(tokenAddress: `0x${string}`, chainId: number): Promise<BlockchainActionResult> {
    try {
      let tokenInfo = tokenRegistry.getToken(tokenAddress, chainId);
      
      if (!tokenInfo) {
        // Try to load token info from blockchain
        tokenInfo = await tokenRegistry.loadTokenInfo(tokenAddress, chainId);
      }
      
      return {
        success: true,
        actionType: 'GET_TOKEN_INFO',
        data: tokenInfo
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'GET_TOKEN_INFO',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get contract templates
  private async getContractTemplates(category?: string): Promise<BlockchainActionResult> {
    try {
      let templates: ContractTemplate[];
      
      if (category) {
        templates = await getTemplatesByCategory(category);
      } else {
        templates = await getAllTemplates();
      }
      
      return {
        success: true,
        actionType: 'GET_CONTRACT_TEMPLATES',
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'GET_CONTRACT_TEMPLATES',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get deployment status
  private getDeploymentStatus(transactionHash: `0x${string}`): BlockchainActionResult {
    try {
      const deployment = contractDeploymentAgent.getDeployment(transactionHash);
      
      if (!deployment) {
        throw new Error(`Deployment with hash ${transactionHash} not found`);
      }
      
      return {
        success: true,
        actionType: 'GET_DEPLOYMENT_STATUS',
        data: deployment
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'GET_DEPLOYMENT_STATUS',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get transfer status
  private getTransferStatus(transactionHash: `0x${string}`): BlockchainActionResult {
    try {
      const transfer = tokenTransferAgent.getTransfer(transactionHash);
      
      if (!transfer) {
        throw new Error(`Transfer with hash ${transactionHash} not found`);
      }
      
      return {
        success: true,
        actionType: 'GET_TRANSFER_STATUS',
        data: transfer
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'GET_TRANSFER_STATUS',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const blockchainOrchestrator = new BlockchainOrchestrator(); 