export interface DeploymentParams {
    source?: string;
    templateId?: string;
    templateParams?: Record<string, any>;
    constructorArgs?: any[];
    value?: string;
    gasLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
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
export declare class ContractDeploymentAgent {
    private deployments;
    private getContractSource;
    deployContract(params: DeploymentParams): Promise<DeploymentResult>;
    private waitForDeployment;
    getDeployment(hash: `0x${string}`): DeploymentResult | null;
    getAllDeployments(): DeploymentResult[];
}
export declare const contractDeploymentAgent: ContractDeploymentAgent;
