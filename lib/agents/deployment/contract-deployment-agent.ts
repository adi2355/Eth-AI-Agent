import { parseAbi, encodeAbiParameters } from 'viem';
import { walletService, TransactionOptions, WalletIntegrationService } from '../../blockchain/wallet-integration';
import { publicClient } from '../../blockchain/providers';
import { validateContract } from '../security/contract-validator';
import { ContractTemplate, getTemplate } from './contract-templates';
import { compile } from './solidity-compiler';

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
  abi: any[];
  bytecode: `0x${string}`;
  constructorArgs: any[];
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  receipt?: any;
  error?: string;
}

export class ContractDeploymentAgent {
  private deployments = new Map<string, DeploymentResult>();

  // Generate contract from template or use provided source
  private async getContractSource(params: DeploymentParams): Promise<string> {
    // If source is provided directly, use it
    if (params.source) {
      return params.source;
    }
    
    // If template ID is provided, get template and fill parameters
    if (params.templateId) {
      const template = await getTemplate(params.templateId);
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
      // Check if wallet is connected
      if (!walletServiceInstance.isConnected()) {
        throw new Error('Wallet not connected');
      }
      
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
      
      // Prepare constructor args
      const constructorArgs = params.constructorArgs || [];
      
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
        abi,
        bytecode,
        constructorArgs
      };
      
      // Store the deployment
      this.deployments.set(txHash, deploymentResult);
      
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
      // Wait for transaction receipt
      const receipt = await walletServiceInstance.waitForTransaction(hash);
      
      // Update deployment result
      const deployment = this.deployments.get(hash);
      if (deployment) {
        deployment.deploymentStatus = receipt.status === 'success' ? 'success' : 'failed';
        deployment.contractAddress = receipt.contractAddress as `0x${string}` || null;
        deployment.receipt = receipt;
        deployment.gasUsed = receipt.gasUsed;
        deployment.effectiveGasPrice = receipt.effectiveGasPrice;
        
        this.deployments.set(hash, deployment);
      }
      
      // Verify contract if requested
      if (verify && deployment && deployment.contractAddress) {
        // TODO: Implement contract verification
      }
    } catch (error) {
      console.error('Deployment confirmation error:', error);
      
      // Update deployment status to failed
      const deployment = this.deployments.get(hash);
      if (deployment) {
        deployment.deploymentStatus = 'failed';
        deployment.error = `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.deployments.set(hash, deployment);
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