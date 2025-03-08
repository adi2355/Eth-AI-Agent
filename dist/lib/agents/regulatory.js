"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegulatoryUpdates = getRegulatoryUpdates;
exports.getComplianceRisk = getComplianceRisk;
const token_cache_1 = require("./token-cache");
class RegulatoryCache extends token_cache_1.TokenCache {
    constructor() {
        super(1800000); // 30 minutes cache for regulatory data
    }
}
const regulatoryCache = new RegulatoryCache();
async function fetchCrystalData(address) {
    const apiKey = process.env.CRYSTAL_API_KEY;
    if (!apiKey) {
        throw new Error('Crystal API key not configured');
    }
    const cacheKey = `crystal-${address}`;
    const cachedData = regulatoryCache.get(cacheKey);
    if (cachedData)
        return cachedData;
    try {
        const response = await fetch(`https://api.crystalblockchain.com/v1/risk/${address}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Crystal API error: ${response.status}`);
        }
        const data = await response.json();
        const riskData = {
            address,
            riskScore: data.risk_score,
            riskLevel: data.risk_level,
            categories: data.risk_categories,
            lastUpdated: new Date().toISOString()
        };
        regulatoryCache.set(cacheKey, riskData);
        return riskData;
    }
    catch (error) {
        console.error('Crystal API error:', error);
        throw error;
    }
}
async function fetchChainalysisData(asset) {
    const apiKey = process.env.CHAINALYSIS_API_KEY;
    if (!apiKey) {
        throw new Error('Chainalysis API key not configured');
    }
    const cacheKey = `chainalysis-${asset}`;
    const cachedData = regulatoryCache.get(cacheKey);
    if (cachedData)
        return cachedData;
    try {
        const response = await fetch(`https://api.chainalysis.com/api/v1/asset/${asset}/compliance`, {
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Chainalysis API error: ${response.status}`);
        }
        const data = await response.json();
        regulatoryCache.set(cacheKey, data);
        return data;
    }
    catch (error) {
        console.error('Chainalysis API error:', error);
        throw error;
    }
}
async function getRegulatoryUpdates(params) {
    const cacheKey = `regulatory-${JSON.stringify(params)}`;
    const cachedData = regulatoryCache.get(cacheKey);
    if (cachedData)
        return cachedData;
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
        ].filter(Boolean);
        regulatoryCache.set(cacheKey, updates);
        return updates;
    }
    catch (error) {
        console.error('Regulatory data fetch error:', error);
        throw error;
    }
}
async function getComplianceRisk(asset) {
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
    }
    catch (error) {
        console.error('Compliance risk assessment error:', error);
        throw error;
    }
}
