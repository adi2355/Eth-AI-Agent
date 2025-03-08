"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractDeploymentAgent = exports.ContractDeploymentAgent = void 0;
const viem_1 = require("viem");
const wallet_integration_1 = require("../../blockchain/wallet-integration");
const contract_validator_1 = require("../security/contract-validator");
const contract_templates_1 = require("./contract-templates");
const solidity_compiler_1 = require("./solidity-compiler");
class ContractDeploymentAgent {
    constructor() {
        this.deployments = new Map();
    }
    // Generate contract from template or use provided source
    async getContractSource(params) {
        // If source is provided directly, use it
        if (params.source) {
            return params.source;
        }
        // If template ID is provided, get template and fill parameters
        if (params.templateId) {
            const template = await (0, contract_templates_1.getTemplate)(params.templateId);
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
    async deployContract(params) {
        try {
            // Check if wallet is connected
            if (!wallet_integration_1.walletService.isConnected()) {
                throw new Error('Wallet not connected');
            }
            // Get contract source
            const source = await this.getContractSource(params);
            // Validate contract security
            const securityResults = await (0, contract_validator_1.validateContract)(source);
            if (!securityResults.valid) {
                throw new Error(`Contract failed security validation: ${securityResults.issues.map(i => i.title).join(', ')}`);
            }
            // Compile the contract
            const compilation = await (0, solidity_compiler_1.compile)(source, {
                optimizer: {
                    enabled: true,
                    runs: params.optimizationRuns || 200
                },
                version: params.compilerVersion
            });
            if (compilation.errors && compilation.errors.length > 0) {
                throw new Error(`Compilation failed: ${compilation.errors.map((e) => e.message).join(', ')}`);
            }
            // Find the main contract (assuming it's the last one)
            const contractNames = Object.keys(compilation.contracts);
            const contractName = contractNames[contractNames.length - 1];
            const contract = compilation.contracts[contractName];
            // Prepare deployment data
            const bytecode = contract.evm.bytecode.object;
            const abi = JSON.parse(contract.abi);
            // Encode constructor arguments if provided
            let data = bytecode;
            if (params.constructorArgs && params.constructorArgs.length > 0) {
                // Find constructor in ABI
                const constructorAbi = abi.find((item) => item.type === 'constructor');
                if (constructorAbi) {
                    const encodedArgs = (0, viem_1.encodeAbiParameters)(constructorAbi.inputs, params.constructorArgs);
                    data = `${bytecode}${encodedArgs.slice(2)}`; // remove 0x prefix from args
                }
            }
            // Prepare transaction options
            const txOptions = {
                to: '0x', // Empty address for contract deployment
                data: data,
                value: params.value ? wallet_integration_1.WalletIntegrationService.parseEther(params.value) : 0n,
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
            const hash = await wallet_integration_1.walletService.sendTransaction(txOptions);
            // Create initial deployment result
            const deploymentResult = {
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
        }
        catch (error) {
            console.error('Contract deployment error:', error);
            throw new Error(`Failed to deploy contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Wait for deployment confirmation
    async waitForDeployment(hash, verify = false) {
        try {
            // Wait for transaction receipt
            const receipt = await wallet_integration_1.walletService.waitForTransaction(hash);
            // Update deployment result
            const deployment = this.deployments.get(hash);
            if (deployment) {
                deployment.deploymentStatus = receipt.status === 'success' ? 'success' : 'failed';
                deployment.contractAddress = receipt.contractAddress || null;
                deployment.gasUsed = receipt.gasUsed;
                deployment.effectiveGasPrice = receipt.effectiveGasPrice;
                deployment.receipt = receipt;
                // Verify contract on Etherscan if requested
                if (verify && receipt.status === 'success' && receipt.contractAddress) {
                    try {
                        // Verification logic would go here
                        // This would typically call the Etherscan API
                        console.log(`Contract verification requested for ${receipt.contractAddress}`);
                    }
                    catch (verifyError) {
                        console.error('Contract verification error:', verifyError);
                        deployment.error = `Deployment succeeded but verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`;
                    }
                }
                this.deployments.set(hash, deployment);
            }
        }
        catch (error) {
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
    getDeployment(hash) {
        return this.deployments.get(hash) || null;
    }
    // Get all deployments
    getAllDeployments() {
        return Array.from(this.deployments.values());
    }
}
exports.ContractDeploymentAgent = ContractDeploymentAgent;
// Export singleton instance
exports.contractDeploymentAgent = new ContractDeploymentAgent();
