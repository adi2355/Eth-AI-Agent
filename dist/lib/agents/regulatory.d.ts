interface RegulatoryUpdate {
    id: string;
    title: string;
    summary: string;
    jurisdiction: string;
    authority: string;
    date: string;
    url: string;
    category: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'PROPOSED' | 'ENACTED' | 'UNDER_REVIEW';
    relatedAssets?: string[];
}
interface RegulatorySearchParams {
    jurisdiction?: string;
    timeRange?: string;
    category?: string;
    asset?: string;
    status?: string;
}
export declare function getRegulatoryUpdates(params: RegulatorySearchParams): Promise<RegulatoryUpdate[]>;
export declare function getComplianceRisk(asset: string): Promise<{
    riskScore: number;
    riskLevel: string;
    details: string[];
}>;
export {};
