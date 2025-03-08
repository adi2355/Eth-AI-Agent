import { NextRequest, NextResponse } from 'next/server';
import { blockchainOrchestrator } from '@/lib/agents/blockchain-orchestrator';
import { BlockchainActionParams } from '@/lib/agents/blockchain-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (!action || !action.actionType) {
      return NextResponse.json(
        { error: 'Invalid request: actionType is required' },
        { status: 400 }
      );
    }
    
    // Execute the blockchain action on the server
    const result = await blockchainOrchestrator.handleAction(action as BlockchainActionParams);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Blockchain API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 