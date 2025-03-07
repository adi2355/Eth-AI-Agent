import * as solc from 'solc';

export interface CompilerOptions {
  optimizer?: {
    enabled: boolean;
    runs: number;
  };
  version?: string;
  evmVersion?: string;
}

export interface CompilationResult {
  contracts: Record<string, any>;
  sources: Record<string, any>;
  errors?: Array<{
    message: string;
    severity: 'error' | 'warning';
    type: string;
  }>;
}

export async function compile(source: string, options: CompilerOptions = {}): Promise<CompilationResult> {
  // Prepare compiler input
  const input = {
    language: 'Solidity',
    sources: {
      'main.sol': {
        content: source
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata']
        }
      },
      optimizer: options.optimizer || {
        enabled: false,
        runs: 200
      },
      evmVersion: options.evmVersion || 'paris'
    }
  };

  // Compile the contract
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  // Check for errors
  const errors = output.errors?.filter((error: any) => error.severity === 'error');
  if (errors && errors.length > 0) {
    return {
      contracts: {},
      sources: {},
      errors: output.errors
    };
  }

  return {
    contracts: output.contracts['main.sol'],
    sources: output.sources,
    errors: output.errors
  };
} 