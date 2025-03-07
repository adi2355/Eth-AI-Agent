import { NextResponse } from 'next/server';
import { getTrendingTokens, getTokenPrices } from '@/lib/token-data';
import { withRateLimit } from '@/lib/rate-limit';
import { withAuth } from '@/lib/middleware';

const handler = withAuth(
  withRateLimit(async (req: Request) => {
    try {
      const trendingTokens = await getTrendingTokens();
      const tokenIds = trendingTokens.map(trend => trend.item.id);
      const tokenPrices = await getTokenPrices(tokenIds);

      const enrichedTrends = trendingTokens.map(trend => ({
        ...trend,
        price_data: tokenPrices[trend.item.id] || null,
      }));

      return NextResponse.json({ data: enrichedTrends });
    } catch (error) {
      console.error('Token data error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch token data' },
        { status: 500 }
      );
    }
  })
);

export { handler as GET };