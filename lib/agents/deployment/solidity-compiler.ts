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

// This is a server-side only module
// We'll use dynamic imports to ensure it only runs on the server
export async function compile(source: string, options: CompilerOptions = {}): Promise<CompilationResult> {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    console.error('Solidity compiler cannot run in browser environment');
    return {
      contracts: {},
      sources: {},
      errors: [{
        message: 'Solidity compilation is only available on the server side',
        severity: 'error',
        type: 'EnvironmentError'
      }]
    };
  }
  
  try {
    // Dynamic import to ensure this only runs on the server
    const solc = await import('solc');
    
    // Prepare input for the compiler
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: source
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        },
        optimizer: options.optimizer || {
          enabled: false,
          runs: 200
        },
        evmVersion: options.evmVersion || 'london'
      }
    };
    
    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    // Check for errors
    if (output.errors) {
      const hasError = output.errors.some((error: any) => error.severity === 'error');
      if (hasError) {
        return {
          contracts: {},
          sources: {},
          errors: output.errors
        };
      }
    }
    
    return {
      contracts: output.contracts['contract.sol'],
      sources: output.sources,
      errors: output.errors
    };
  } catch (error) {
    console.error('Solidity compilation error:', error);
    return {
      contracts: {},
      sources: {},
      errors: [{
        message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'error',
        type: 'CompilationError'
      }]
    };
  }
} 