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

  // Deploy a smart contract
  async deployContract(params: DeploymentParams): Promise<DeploymentResult> {
    try {
      // Check if wallet is connected
      if (!walletService.isConnected()) {
        throw new Error('Wallet not connected');
      }
      
      // Get contract source
      const source = await this.getContractSource(params);
      
      // Validate contract security
      const securityResults = await validateContract(source);
      if (!securityResults.valid) {
        throw new Error(`Contract failed security validation: ${securityResults.issues.map(i => i.title).join(', ')}`);
      }
      
      // Compile the contract
      const compilation = await compile(source, {
        optimizer: {
          enabled: true,
          runs: params.optimizationRuns || 200
        },
        version: params.compilerVersion
      });
      
      if (compilation.errors && compilation.errors.length > 0) {
        throw new Error(`Compilation failed: ${compilation.errors.map((e: { message: string }) => e.message).join(', ')}`);
      }
      
      // Find the main contract (assuming it's the last one)
      const contractNames = Object.keys(compilation.contracts);
      const contractName = contractNames[contractNames.length - 1];
      const contract = compilation.contracts[contractName];
      
      // Prepare deployment data
      const bytecode = contract.evm.bytecode.object as `0x${string}`;
      const abi = JSON.parse(contract.abi);
      
      // Encode constructor arguments if provided
      let data = bytecode;
      if (params.constructorArgs && params.constructorArgs.length > 0) {
        // Find constructor in ABI
        const constructorAbi = abi.find((item: any) => item.type === 'constructor');
        if (constructorAbi) {
          const encodedArgs = encodeAbiParameters(
            constructorAbi.inputs,
            params.constructorArgs
          );
          data = `${bytecode}${encodedArgs.slice(2)}`; // remove 0x prefix from args
        }
      }
      
      // Prepare transaction options
      const txOptions: TransactionOptions = {
        to: '0x' as `0x${string}`, // Empty address for contract deployment
        data: data as `0x${string}`,
        value: params.value ? WalletIntegrationService.parseEther(params.value) : 0n,
      };
      
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
      
      // Send deployment transaction
      const hash = await walletService.sendTransaction(txOptions);
      
      // Create initial deployment result
      const deploymentResult: DeploymentResult = {
        transactionHash: hash,
        contractAddress: null,
        deploymentStatus: 'pending',
        abi,
        bytecode,
        constructorArgs: params.constructorArgs || []
      };
      
      // Store the deployment
      this.deployments.set(hash, deploymentResult);
      
      // Wait for transaction confirmation in the background
      this.waitForDeployment(hash, params.verify);
      
      return deploymentResult;
      
    } catch (error) {
      console.error('Contract deployment error:', error);
      throw new Error(`Failed to deploy contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Wait for deployment confirmation
  private async waitForDeployment(hash: `0x${string}`, verify: boolean = false): Promise<void> {
    try {
      // Wait for transaction receipt
      const receipt = await walletService.waitForTransaction(hash);
      
      // Update deployment result
      const deployment = this.deployments.get(hash);
      if (deployment) {
        deployment.deploymentStatus = receipt.status === 'success' ? 'success' : 'failed';
        deployment.contractAddress = receipt.contractAddress as `0x${string}` || null;
        deployment.gasUsed = receipt.gasUsed;
        deployment.effectiveGasPrice = receipt.effectiveGasPrice;
        deployment.receipt = receipt;
        
        // Verify contract on Etherscan if requested
        if (verify && receipt.status === 'success' && receipt.contractAddress) {
          try {
            // Verification logic would go here
            // This would typically call the Etherscan API
            console.log(`Contract verification requested for ${receipt.contractAddress}`);
          } catch (verifyError) {
            console.error('Contract verification error:', verifyError);
            deployment.error = `Deployment succeeded but verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`;
          }
        }
        
        this.deployments.set(hash, deployment);
      }
    } catch (error) {
      console.error('Deployment confirmation error:', error);
      
      // Update deployment status to failed
      const deployment = this.deployments.get(hash);
      if (deployment) {
        deployment.deploymentStatus = 'failed';
        deployment.error = `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
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