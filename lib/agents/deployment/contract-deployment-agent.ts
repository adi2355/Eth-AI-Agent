import { parseAbi, encodeAbiParameters } from 'viem';
import { walletService, TransactionOptions, WalletIntegrationService } from '../../blockchain/wallet-integration';
import { publicClient } from '../../blockchain/providers';
import { validateContract } from '../security/contract-validator';
import { ContractTemplate, getAllTemplates } from './contract-templates';
import { compile } from './solidity-compiler';
import { transactionApi } from '../../api/transaction-api';

export interface DeploymentParams {
  // Contract source or template information
  source?: string;
  templateId?: string;
  templateParams?: Record<string, any>;
  
  // Constructor parameters (if any)
  constructorArgs?: any[];
  
  // Deployment options
  value?: string; // ETH value in string format (e.g. "0.1")
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  
  // Verification options
  verify?: boolean;
  compilerVersion?: string;
  optimizationRuns?: number;
}

export interface DeploymentResult {
  transactionHash: `0x${string}`;
  contractAddress: `0x${string}` | null;
  deploymentStatus: 'pending' | 'success' | 'failed';
  templateId?: string;
  abi: any[];
  bytecode: `0x${string}`;
  constructorArgs: any[];
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  receipt?: any;
  error?: string;
  timestamp: number;
  confirmations?: number;
}

export class ContractDeploymentAgent {
  private deployments = new Map<string, DeploymentResult>();
  
  // Static deployments registry (shared across instances)
  private static globalDeployments = new Map<string, DeploymentResult>();
  
  /**
   * Get all deployments (static method)
   * @returns Array of all deployments
   */
  static getAllDeployments(): DeploymentResult[] {
    return Array.from(this.globalDeployments.values());
  }
  
  /**
   * Get a specific deployment (static method)
   * @param hash Transaction hash
   * @returns Deployment result or null if not found
   */
  static getDeployment(hash: `0x${string}`): DeploymentResult | null {
    return this.globalDeployments.get(hash) || null;
  }

  /**
   * Find a template by ID
   * @param templateId Template ID
   * @returns Template or undefined if not found
   */
  private async findTemplate(templateId: string): Promise<ContractTemplate | undefined> {
    const templates = await getAllTemplates();
    return templates.find((template: ContractTemplate) => template.id === templateId);
  }

  // Generate contract from template or use provided source
  private async getContractSource(params: DeploymentParams): Promise<string> {
    // If source is provided directly, use it
    if (params.source) {
      return params.source;
    }
    
    // If template ID is provided, get template and fill parameters
    if (params.templateId) {
      const template = await this.findTemplate(params.templateId);
      if (!template) {
        throw new Error(`Template with ID ${params.templateId} not found`);
      }
      
      // Replace template parameters
      let source = template.source;
      if (params.templateParams) {
        for (const [key, value] of Object.entries(params.templateParams)) {
          const placeholder = `{{${key}}}`;
          source = source.replace(new RegExp(placeholder, 'g'), String(value));
        }
      }
      
      return source;
    }
    
    throw new Error('Either source or templateId must be provided');
  }

  // Deploy a contract
  async deployContract(
    walletServiceInstance: WalletIntegrationService,
    params: DeploymentParams
  ): Promise<DeploymentResult> {
    try {
      console.log('ContractDeploymentAgent.deployContract called with:', {
        walletServiceExists: !!walletServiceInstance,
        templateId: params.templateId,
        constructorArgs: params.constructorArgs,
      });

      // Validate wallet connection
      if (!walletServiceInstance) {
        throw new Error("Wallet service instance not provided");
      }
      
      // Get connected wallet address
      const deployer = walletServiceInstance.getAddress();
      
      if (!deployer) {
        throw new Error("Wallet not connected");
      }
      
      console.log(`ContractDeploymentAgent: Using deployer address ${deployer}`);
      
      // Find template
      const template = params.templateId ? await this.findTemplate(params.templateId) : undefined;
      
      if (params.templateId && !template) {
        throw new Error(`Template with ID ${params.templateId} not found`);
      }
      
      if (params.templateId) {
        console.log(`ContractDeploymentAgent: Found template ${params.templateId}`);
      }
      
      // Prepare constructor arguments
      const constructorArgs = params.constructorArgs || [];
      
      // Get contract source
      const source = await this.getContractSource(params);
      
      // Compile contract
      const compilation = await compile(source);
      
      // Check for compilation errors
      if (compilation.errors && compilation.errors.length > 0) {
        const errorMessages = compilation.errors
          .filter(error => error.severity === 'error')
          .map(error => error.message)
          .join('\n');
        
        throw new Error(`Compilation failed:\n${errorMessages}`);
      }
      
      // Get contract info
      const contractName = Object.keys(compilation.contracts)[0];
      const contract = compilation.contracts[contractName];
      
      // Ensure contract has bytecode
      if (!contract.evm || !contract.evm.bytecode || !contract.evm.bytecode.object) {
        throw new Error('Compiled contract has no bytecode');
      }
      
      // Get ABI and bytecode
      const abi = contract.abi;
      const bytecode = `0x${contract.evm.bytecode.object}` as `0x${string}`;
      
      // Validate contract
      const securityCheck = validateContract(abi, bytecode);
      if (!securityCheck.valid) {
        throw new Error(`Contract security check failed: ${securityCheck.issues.map(i => i.title).join(', ')}`);
      }
      
      // Prepare transaction options
      const txOptions: any = {
        data: bytecode
      };
      
      // Add value if provided (for payable constructors)
      if (params.value) {
        txOptions.value = WalletIntegrationService.parseEther(params.value);
      }
      
      // Add gas parameters if provided
      if (params.gasLimit) {
        txOptions.gasLimit = BigInt(params.gasLimit);
      }
      if (params.maxFeePerGas) {
        txOptions.maxFeePerGas = BigInt(params.maxFeePerGas);
      }
      if (params.maxPriorityFeePerGas) {
        txOptions.maxPriorityFeePerGas = BigInt(params.maxPriorityFeePerGas);
      }
      
      // Deploy contract
      const txHash = await walletServiceInstance.sendTransaction(txOptions);
      
      // Create deployment result
      const deploymentResult: DeploymentResult = {
        transactionHash: txHash,
        contractAddress: null, // Will be updated after confirmation
        deploymentStatus: 'pending',
        templateId: params.templateId,
        abi,
        bytecode,
        constructorArgs,
        timestamp: Date.now()
      };
      
      // Store in instance map
      this.deployments.set(txHash, deploymentResult);
      
      // Store in global registry
      ContractDeploymentAgent.globalDeployments.set(txHash, deploymentResult);
      
      console.log(`ContractDeploymentAgent: Deployment registered in global registry: ${txHash}`);
      
      // Notify listeners about the new deployment
      transactionApi.notifyTransactionAdded({
        transactionHash: txHash,
        status: 'pending',
        timestamp: deploymentResult.timestamp,
        type: 'deploy',
        templateId: deploymentResult.templateId,
        contractAddress: null
      });
      
      // Wait for deployment confirmation in the background
      this.waitForDeployment(txHash, params.verify || false, walletServiceInstance);
      
      return deploymentResult;
    } catch (error) {
      console.error('Contract deployment error:', error);
      throw new Error(`Contract deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Wait for deployment confirmation
  private async waitForDeployment(
    hash: `0x${string}`, 
    verify: boolean = false,
    walletServiceInstance: WalletIntegrationService
  ): Promise<void> {
    try {
      console.log(`ContractDeploymentAgent: Waiting for confirmation of deployment ${hash}`);
      
      // Get current deployment
      const deployment = this.deployments.get(hash);
      if (!deployment) {
        console.warn(`ContractDeploymentAgent: Deployment ${hash} not found in instance map`);
        return;
      }
      
      // Wait for transaction receipt
      const receipt = await walletServiceInstance.waitForTransaction(hash);
      
      console.log(`ContractDeploymentAgent: Deployment ${hash} confirmed:`, receipt);
      
      // Extract contract address from receipt
      const contractAddress = receipt.contractAddress as `0x${string}` | null;
      
      // Update deployment status
      deployment.deploymentStatus = receipt.status === 'success' ? 'success' : 'failed';
      deployment.contractAddress = contractAddress;
      deployment.gasUsed = receipt.gasUsed;
      deployment.effectiveGasPrice = receipt.effectiveGasPrice;
      deployment.receipt = receipt;
      
      // Update both instance and global maps
      this.deployments.set(hash, deployment);
      ContractDeploymentAgent.globalDeployments.set(hash, deployment);
      
      console.log(`ContractDeploymentAgent: Updated global registry for deployment ${hash}`);
      
      // Notify listeners about the updated deployment
      transactionApi.notifyTransactionUpdated({
        transactionHash: hash,
        status: deployment.deploymentStatus || 'pending',
        timestamp: deployment.timestamp,
        type: 'deploy',
        error: deployment.error,
        templateId: deployment.templateId,
        contractAddress: deployment.contractAddress,
        confirmations: deployment.confirmations
      });
      
      // Verify contract if requested
      if (verify && deployment && deployment.contractAddress) {
        // TODO: Implement contract verification
      }
    } catch (error) {
      console.error(`ContractDeploymentAgent: Error confirming deployment ${hash}:`, error);
      
      // Get current deployment
      const deployment = this.deployments.get(hash);
      if (deployment) {
        // Mark as failed
        deployment.deploymentStatus = 'failed';
        deployment.error = `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        
        // Update both instance and global maps
        this.deployments.set(hash, deployment);
        ContractDeploymentAgent.globalDeployments.set(hash, deployment);
        
        console.log(`ContractDeploymentAgent: Marked deployment ${hash} as failed in global registry`);
        
        // Notify listeners about the failed deployment
        transactionApi.notifyTransactionUpdated({
          transactionHash: hash,
          status: 'failed',
          timestamp: deployment.timestamp,
          type: 'deploy',
          error: deployment.error,
          templateId: deployment.templateId,
          contractAddress: null
        });
      }
    }
  }

  // Get deployment status
  getDeployment(hash: `0x${string}`): DeploymentResult | null {
    return this.deployments.get(hash) || null;
  }

  // Get all deployments
  getAllDeployments(): DeploymentResult[] {
    return Array.from(this.deployments.values());
  }
}

// Export singleton instance
export const contractDeploymentAgent = new ContractDeploymentAgent(); 