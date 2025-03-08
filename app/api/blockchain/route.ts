import { NextRequest, NextResponse } from 'next/server';
import { blockchainOrchestrator } from '@/lib/agents/blockchain-orchestrator';
import { BlockchainActionParams } from '@/lib/agents/blockchain-orchestrator';
import { sessionManager } from '@/lib/blockchain/session-manager';
import { WalletIntegrationService } from '@/lib/blockchain/wallet-integration';
import { USE_MOCKS } from '@/lib/blockchain/config';

export async function POST(request: NextRequest) {
  console.log('Blockchain API Route: Request received');
  
  try {
    const body = await request.json();
    const { action, sessionId } = body;
    
    // Use default-session if sessionId is not provided
    const effectiveSessionId = sessionId || 'default-session';
    
    console.log('Blockchain API Route: Request body parsed', {
      actionType: action?.actionType,
      sessionId: effectiveSessionId,
      originalSessionId: sessionId,
      usingDefaultSession: !sessionId,
      hasAction: !!action,
      headers: Object.fromEntries(request.headers)
    });
    
    if (!action || !action.actionType) {
      console.error('Blockchain API Route: Invalid request - missing actionType');
      return NextResponse.json(
        { error: 'Invalid request: actionType is required' },
        { status: 400 }
      );
    }
    
    // Special handling for wallet connections
    if (action.actionType === 'CONNECT_WALLET') {
      console.log('Blockchain API Route: Handling wallet connection', {
        sessionId: effectiveSessionId,
        provider: action.walletParams?.type,
        forceRealWallet: action.walletParams?.forceRealWallet
      });
      
      // If forceRealWallet is set, skip the mock wallet creation
      if (action.walletParams?.forceRealWallet) {
        console.log('Blockchain API Route: forceRealWallet flag set, bypassing mock wallet');
        
        // Just return success and let the client handle the connection
        return NextResponse.json({
          success: true,
          actionType: 'CONNECT_WALLET',
          data: {
            needsBrowserConnection: true,
            message: 'Client should handle wallet connection directly'
          }
        });
      }
      
      // If mocks are enabled and forceRealWallet is not set, create a mock wallet
      if (USE_MOCKS && !action.walletParams?.forceRealWallet) {
        console.log('Blockchain API Route: Creating mock wallet service with consistent address');
        
        // Use a consistent mock address for testing
        const mockAddress = '0x87a89B578e769F172440581A4E3DE6823dd116bB';
        
        // Create and configure mock wallet service
        const mockWalletService = new WalletIntegrationService();
        mockWalletService.setMockAddress(mockAddress);
        
        // Store in session manager
        sessionManager.storeConnection(effectiveSessionId, mockWalletService, mockAddress);
        
        console.log(`Blockchain API Route: Registered mock wallet ${mockAddress} for session ${effectiveSessionId}`);
        console.log('Blockchain API Route: Mock wallet registered successfully');
        
        // Return success with mock address
        return NextResponse.json({
          success: true,
          actionType: 'CONNECT_WALLET',
          data: {
            address: mockAddress,
            provider: action.walletParams?.type
          }
        });
      }

      // For server-side regular connections (no mocks, no forceRealWallet)
      try {
        // Create a mock wallet service for server-side
        const walletService = new WalletIntegrationService();
        
        // Use a fixed address for server-side connections to maintain consistency
        const serverAddress = '0x87a89B578e769F172440581A4E3DE6823dd116bB' as `0x${string}`;
        
        // Register this connection in the session manager
        sessionManager.storeConnection(
          effectiveSessionId,
          walletService,
          serverAddress,
          action.walletParams?.chainId || 1
        );
        
        console.log(`Blockchain API Route: Registered server-side wallet connection for session ${effectiveSessionId}`);
        
        // Return success response with the server address
        return NextResponse.json({
          success: true,
          actionType: 'CONNECT_WALLET',
          data: {
            address: serverAddress,
            needsBrowserConnection: true
          }
        });
      } catch (error) {
        console.error('Blockchain API Route: Error setting up server-side wallet connection:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          sessionId: effectiveSessionId
        });
        
        return NextResponse.json({
          success: false,
          actionType: 'CONNECT_WALLET',
          error: 'Failed to set up server-side wallet connection'
        });
      }
    }
    
    // Add session ID to action params if provided
    const actionWithSession: BlockchainActionParams = {
      ...action,
      sessionId: effectiveSessionId
    };
    
    console.log('Blockchain API Route: Executing action with orchestrator', {
      actionType: action.actionType,
      sessionId: actionWithSession.sessionId,
      originalSessionId: sessionId,
      hasTransferParams: !!actionWithSession.transferParams,
      hasDeploymentParams: !!actionWithSession.deploymentParams,
      activeSessions: Array.from(sessionManager['sessions'].keys())
    });
    
    // For other actions, execute them on the server
    const result = await blockchainOrchestrator.handleAction(actionWithSession);
    
    console.log('Blockchain API Route: Action completed', {
      actionType: action.actionType,
      success: result.success,
      hasError: !!result.error,
      sessionId: actionWithSession.sessionId
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Blockchain API Route: Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 