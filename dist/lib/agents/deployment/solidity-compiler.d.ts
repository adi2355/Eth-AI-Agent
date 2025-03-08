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
export declare function compile(source: string, options?: CompilerOptions): Promise<CompilationResult>;
