export interface ContractTemplate {
    id: string;
    name: string;
    description: string;
    category: 'token' | 'nft' | 'defi' | 'utility' | 'governance';
    source: string;
    parameters: TemplateParameter[];
    defaultValues?: Record<string, any>;
    version: string;
    author: string;
}
export interface TemplateParameter {
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'address' | 'uint256' | 'uint8';
    required: boolean;
    defaultValue?: any;
    options?: any[];
}
export declare function getTemplate(id: string): Promise<ContractTemplate | null>;
export declare function getAllTemplates(): Promise<ContractTemplate[]>;
export declare function getTemplatesByCategory(category: string): Promise<ContractTemplate[]>;
export declare function registerTemplate(template: ContractTemplate): void;
