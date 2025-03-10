export type IntentType = 'MARKET_DATA' | 'COMPARISON' | 'TECHNICAL' | 'DEFI' | 'REGULATORY' | 'NEWS_EVENTS' | 'SECURITY' | 'CONCEPTUAL' | 'HYBRID' | 'NEEDS_CONTEXT';
export type MarketDataType = 'price' | 'market_cap' | 'volume_24h' | 'trending' | 'supply' | 'volume' | 'defi_tvl' | 'yield' | 'liquidity';
export type TimeFrame = 'current' | '24h' | '7d' | '30d' | null;
export type TechnicalContentType = 'smart_contract' | 'protocol' | 'architecture' | 'implementation' | 'code_example';
export type NewsContentType = 'announcement' | 'update' | 'regulation' | 'policy' | 'security_incident' | 'market_event';
export type DefiContentType = 'protocol_metrics' | 'yield_data' | 'tvl_analysis' | 'pool_statistics' | 'farming_data';
export interface ComparisonRequest {
    isComparison: boolean;
    tokens: string[];
    aspects: string[];
    primaryMetric: string | null;
    technicalAspects?: string[];
    defiMetrics?: string[];
}
export interface WebSearchContext {
    needed: boolean;
    reason: string | null;
    suggestedQueries: string[];
    contentTypes: NewsContentType[];
    timeRange?: string;
}
export interface DataRequirements {
    marketData: {
        needed: boolean;
        types: MarketDataType[];
        timeframe: TimeFrame;
        tokenCount: number;
    };
    conceptualData: {
        needed: boolean;
        aspects: string[];
    };
    technicalData?: {
        needed: boolean;
        types: TechnicalContentType[];
        codeLanguages?: string[];
    };
    defiData?: {
        needed: boolean;
        types: DefiContentType[];
        protocols?: string[];
    };
    newsData?: {
        needed: boolean;
        types: NewsContentType[];
        timeRange?: string;
    };
}
export interface OriginalContext {
    rawQuery: string;
    timestamp: number;
    preprocessingSteps: PreprocessingStep[];
    metadata: QueryMetadata;
}
export interface PreprocessingStep {
    operation: string;
    input: string;
    output: string;
}
export interface QueryMetadata {
    tokens: string[];
    entities: string[];
    contextualHints: string[];
    technicalTerms?: string[];
    defiProtocols?: string[];
}
export interface RobustAnalysis {
    originalContext: OriginalContext;
    classification: {
        primaryIntent: IntentType;
        confidence: number;
        needsApiCall: boolean;
        ambiguityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        requiresWebSearch: boolean;
    };
    queryAnalysis: {
        sanitizedQuery: string;
        detectedTokens: string[];
        comparisonRequest: ComparisonRequest;
        detectedIntents: string[];
        timeContext: TimeFrame;
        marketIndicators: string[];
        conceptualIndicators: string[];
        webSearchContext: WebSearchContext;
    };
    dataRequirements: DataRequirements;
}
export interface Agent1Input {
    query: string;
}
export interface SummarizationInput {
    userQuery: string;
    analysis: RobustAnalysis;
    aggregatorResult: AggregatorResult | null;
    sessionId?: string;
    enhancedContext?: string;
}
export interface AggregatorResult {
    primary?: {
        coingecko?: any;
        defiLlama?: any;
        theGraph?: any;
        coinmarketcap?: any;
    };
    fallback?: {
        googleSearch?: any;
        webSearch?: any;
        potentialCoinGeckoLinks?: string[];
        firstSnippet?: string;
    };
}
export interface OrchestrationResult {
    analysis: RobustAnalysis;
    aggregatorData: AggregatorResult | null;
    response: string;
    suggestions?: string[];
    contextAnalysis?: {
        isCoherent: boolean;
        confidence: number;
    };
}
export interface AggregatorSpec {
    primary: {
        coingecko?: any;
        defiLlama?: any;
        theGraph?: any;
        news?: any;
        regulatory?: any;
        security?: any;
    };
    fallback: {
        coingecko?: any;
        webSearch?: any;
    };
}
