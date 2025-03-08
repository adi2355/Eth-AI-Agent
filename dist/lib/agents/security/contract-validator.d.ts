export interface SecurityIssue {
    severity: 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    line?: number;
    column?: number;
}
export interface ValidationResult {
    valid: boolean;
    issues: SecurityIssue[];
}
export declare function validateContract(source: string): Promise<ValidationResult>;
export declare function validateTransaction(to: string, value: bigint, data: string | undefined): Promise<ValidationResult>;
