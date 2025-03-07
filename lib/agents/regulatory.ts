import { TokenCache } from './token-cache';

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

interface CrystalRiskData {
  address?: string;
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  categories: string[];
  lastUpdated: string;
}

interface RegulatorySearchParams {
  jurisdiction?: string;
  timeRange?: string;
  category?: string;
  asset?: string;
  status?: string;
}

class RegulatoryCache extends TokenCache {
  constructor() {
    super(1800000); // 30 minutes cache for regulatory data
  }
}

const regulatoryCache = new RegulatoryCache();

async function fetchCrystalData(address: string): Promise<CrystalRiskData> {
  const apiKey = process.env.CRYSTAL_API_KEY;
  if (!apiKey) {
    throw new Error('Crystal API key not configured');
  }

  const cacheKey = `crystal-${address}`;
  const cachedData = regulatoryCache.get(cacheKey);
  if (cachedData) return cachedData;

  try {
    const response = await fetch(
      `https://api.crystalblockchain.com/v1/risk/${address}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Crystal API error: ${response.status}`);
    }

    const data = await response.json();
    const riskData: CrystalRiskData = {
      address,
      riskScore: data.risk_score,
      riskLevel: data.risk_level,
      categories: data.risk_categories,
      lastUpdated: new Date().toISOString()
    };

    regulatoryCache.set(cacheKey, riskData);
    return riskData;
  } catch (error) {
    console.error('Crystal API error:', error);
    throw error;
  }
}

async function fetchChainalysisData(asset: string): Promise<any> {
  const apiKey = process.env.CHAINALYSIS_API_KEY;
  if (!apiKey) {
    throw new Error('Chainalysis API key not configured');
  }

  const cacheKey = `chainalysis-${asset}`;
  const cachedData = regulatoryCache.get(cacheKey);
  if (cachedData) return cachedData;

  try {
    const response = await fetch(
      `https://api.chainalysis.com/api/v1/asset/${asset}/compliance`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Chainalysis API error: ${response.status}`);
    }

    const data = await response.json();
    regulatoryCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Chainalysis API error:', error);
    throw error;
  }
}

export async function getRegulatoryUpdates(
  params: RegulatorySearchParams
): Promise<RegulatoryUpdate[]> {
  const cacheKey = `regulatory-${JSON.stringify(params)}`;
  const cachedData = regulatoryCache.get(cacheKey);
  if (cachedData) return cachedData;

  try {
    // Fetch from multiple sources and combine results
    const [crystalUpdates, chainalysisUpdates] = await Promise.all([
      params.asset ? fetchCrystalData(params.asset).then(data => ({
        id: `crystal-${params.asset}`,
        title: `Risk assessment for ${params.asset}`,
        summary: `Crystal Blockchain risk assessment for ${params.asset}`,
        jurisdiction: 'GLOBAL',
        authority: 'Crystal Blockchain',
        date: data.lastUpdated,
        url: 'https://crystalblockchain.com/',
        category: data.categories[0] || 'RISK_ASSESSMENT',
        impact: data.riskLevel,
        status: 'ENACTED',
        relatedAssets: [params.asset]
      })) : Promise.resolve(null),
      params.asset ? fetchChainalysisData(params.asset).then(data => ({
        id: `chainalysis-${params.asset}`,
        title: `Chainalysis report for ${params.asset}`,
        summary: data.summary || `Chainalysis report for ${params.asset}`,
        jurisdiction: 'GLOBAL',
        authority: 'Chainalysis',
        date: new Date().toISOString(),
        url: 'https://chainalysis.com/',
        category: 'RISK_ASSESSMENT',
        impact: data.riskLevel || 'MEDIUM',
        status: 'ENACTED',
        relatedAssets: [params.asset]
      })) : Promise.resolve(null)
    ]);

    // Use type assertion to help TypeScript understand the filter
    const updates = [
      crystalUpdates,
      chainalysisUpdates
    ].filter(Boolean) as RegulatoryUpdate[];

    regulatoryCache.set(cacheKey, updates);
    return updates;
  } catch (error) {
    console.error('Regulatory data fetch error:', error);
    throw error;
  }
}

export async function getComplianceRisk(
  asset: string
): Promise<{
  riskScore: number;
  riskLevel: string;
  details: string[];
}> {
  try {
    const [crystalData, chainalysisData] = await Promise.all([
      fetchCrystalData(asset),
      fetchChainalysisData(asset)
    ]);

    return {
      riskScore: (crystalData.riskScore + chainalysisData.riskScore) / 2,
      riskLevel: crystalData.riskLevel,
      details: [
        ...crystalData.categories,
        ...chainalysisData.riskFactors || []
      ]
    };
  } catch (error) {
    console.error('Compliance risk assessment error:', error);
    throw error;
  }
}