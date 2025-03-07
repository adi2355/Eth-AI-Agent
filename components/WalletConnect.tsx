"use client";

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async () => {
    if (!address) return;

    setIsAuthenticating(true);
    try {
      // Get nonce
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const { nonce } = await nonceRes.json();

      // Create message
      const message = `Sign this message to authenticate with BlockchainGPT\nNonce: ${nonce}`;

      // Sign message
      const signature = await signMessageAsync({
        message,
      });

      // Verify signature
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          signature,
          address,
        }),
      });

      const { token } = await verifyRes.json();
      
      // Store the token
      localStorage.setItem('auth_token', token);
      
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsAuthenticating(true);
      const result = await connectAsync({
        connector: injected(),
      });
      if (result?.accounts?.[0]) {
        await handleSignIn();
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('auth_token');
    disconnect();
  };

  // Prevent hydration errors by not rendering until mounted
  if (!mounted) {
    return (
      <Button variant="outline" disabled className="flex items-center space-x-2">
        <Wallet className="h-4 w-4" />
        <span>Loading...</span>
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        onClick={handleDisconnect}
        className="flex items-center space-x-2"
      >
        <Wallet className="h-4 w-4" />
        <span>{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isAuthenticating}
      className="flex items-center space-x-2"
    >
      {isAuthenticating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      <span>Connect Wallet</span>
    </Button>
  );
}