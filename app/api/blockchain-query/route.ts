import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/orchestrator';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const orchestrator = new AgentOrchestrator();

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { query, sessionId } = body;
    
    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await orchestrator.processQuery(query, sessionId);

    return NextResponse.json(result, { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process request' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}