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
    
    // Special handling for wallet connections
    if (action.actionType === 'CONNECT_WALLET') {
      // For wallet connections, we need to return a mock success response
      // since actual wallet connections must happen in the browser
      return NextResponse.json({
        success: true,
        actionType: 'CONNECT_WALLET',
        data: {
          // Return a placeholder address that will be replaced by the actual browser-side connection
          address: '0x0000000000000000000000000000000000000000',
          needsBrowserConnection: true
        }
      });
    }
    
    // For other actions, execute them on the server
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