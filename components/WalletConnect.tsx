"use client";

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { blockchainApi } from '@/lib/api/blockchain-api';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Call onConnect when address changes
  useEffect(() => {
    if (isConnected && address && onConnect) {
      onConnect(address);
    }
  }, [address, isConnected, onConnect]);

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
      setError(null);
      
    } catch (error) {
      console.error('Authentication failed:', error);
      setError('Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);
      
      // Try our blockchain API first
      try {
        const connectedAddress = await blockchainApi.connectWallet('metamask');
        console.log('Connected via blockchain API:', connectedAddress);
        
        // Call onConnect callback if provided
        if (onConnect) {
          onConnect(connectedAddress);
        }
        
        // If we get here, we're connected
        await handleSignIn();
        return;
      } catch (apiError) {
        console.error('Blockchain API connection failed, falling back to wagmi:', apiError);
        // Fall back to wagmi
      }
      
      // Fallback to wagmi
      const result = await connectAsync({
        connector: injected(),
      });
      if (result?.accounts?.[0]) {
        // Call onConnect callback if provided
        if (onConnect) {
          onConnect(result.accounts[0]);
        }
        
        await handleSignIn();
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setError('Wallet connection failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('auth_token');
    disconnect();
    
    // Also disconnect via our API
    try {
      blockchainApi.disconnectWallet();
    } catch (error) {
      console.error('API disconnect error:', error);
    }
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
    <div className="flex flex-col">
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
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}