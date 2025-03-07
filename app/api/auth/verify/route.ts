import { NextResponse } from 'next/server';
import { verifySignature, generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { message, signature, address } = await req.json();
    
    const user = await verifySignature(message, signature, address);
    const token = generateToken(user);
    
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}