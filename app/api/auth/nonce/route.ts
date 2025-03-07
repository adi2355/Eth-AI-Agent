import { NextResponse } from 'next/server';
import { storeNonce } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    const nonce = storeNonce(address);
    
    return NextResponse.json({ nonce });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}