import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/orchestrator';

const orchestrator = new AgentOrchestrator();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Custom JSON serializer that handles BigInt values
 * @param key Property key
 * @param value Property value
 * @returns Serialized value
 */
function bigIntSerializer(key: string, value: any): any {
  // Convert BigInt to string
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  console.log('Chat API: Starting request processing');
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  try {
    let body;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      body = JSON.parse(text);
      console.log('Chat API: Request body parsed:', body);
    } catch (error) {
      console.error('Chat API: JSON parsing error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { query, sessionId } = body;

    console.log('Chat API: Extracted sessionId:', sessionId);
    console.log('Chat API: Extracted query:', query);

    if (!query?.trim()) {
      console.log('Chat API: Empty query received');
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!sessionId?.trim()) {
      console.log('Chat API: No sessionId received');
      return NextResponse.json(
        { 
          error: 'Session ID is required',
          debug: { 
            body,
            headers: Object.fromEntries(req.headers.entries())
          }
        },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Chat API: Starting chat pipeline for query:', query);
    console.log('Chat API: Using session ID:', sessionId);

    const result = await orchestrator.processQuery(query, sessionId);

    console.log('Chat API: Pipeline complete. Analysis:', result.analysis.classification.primaryIntent);
    console.log('Chat API: Generated response:', result.response);

    // Use the custom serializer to handle BigInt values
    const responseData = {
      response: result.response,
      data: result.aggregatorData,
      analysis: result.analysis,
      suggestions: result.suggestions,
      contextAnalysis: result.contextAnalysis
    };

    // Create a serialized version of the response data
    const serializedData = JSON.stringify(responseData, bigIntSerializer);
    
    // Return the response with the serialized data
    return new NextResponse(serializedData, { 
      status: 200, 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Chat API error:', error);
  
    let errorMessage = 'Failed to process chat request';
    let statusCode = 500;
  
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Service configuration error';
        statusCode = 503;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Service is busy, please try again in a moment';
        statusCode = 429;
      } else if (error.message.includes('validation')) {
        errorMessage = error.message;
        statusCode = 400;
      } else if (error.message.includes('Session ID is required')) {
        errorMessage = 'Session ID is required';
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }
  
    // Use the custom serializer for error responses as well
    const errorData = {
      error: errorMessage,
      status: statusCode
    };
  
    const serializedError = JSON.stringify(errorData, bigIntSerializer);
  
    return new NextResponse(serializedError, {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}