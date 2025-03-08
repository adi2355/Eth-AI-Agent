/**
 * Mock Blockchain Provider
 * 
 * This module provides mock implementations of blockchain functionality for testing
 * and development without requiring a real blockchain connection.
 */

import { USE_MOCKS } from './config';

// Mock wallet state
let mockConnected = false;
let mockAddress = '0x0000000000000000000000000000000000000000';
let mockBalance = BigInt('1000000000000000000000'); // 1000 ETH
let mockTokenBalances: Record<string, bigint> = {};

// Mock transaction state
const mockTransactions = new Map<string, any>();
let txCounter = 1;

// Mock token data
const mockTokens: Record<string, any> = {
  '0x1234567890123456789012345678901234567890': {
    name: 'Test Token',
    symbol: 'TEST',
    decimals: 18,
    totalSupply: BigInt('1000000000000000000000000'), // 1 million tokens
  }
};

/**
 * Check if mocks are enabled
 */
export function isMockEnabled(): boolean {
  console.log('isMockEnabled check:', {
    USE_MOCKS,
    environment: typeof process !== 'undefined' ? process.env.NODE_ENV : 'client'
  });
  return USE_MOCKS;
}

/**
 * Mock connect to wallet
 */
export function mockConnect(address?: string): Promise<`0x${string}`> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockConnected = true;
      if (address) {
        mockAddress = address as `0x${string}`;
      } else {
        // Generate a random-looking address if none provided
        mockAddress = `0x${Math.floor(Math.random() * 10**16).toString(16).padStart(40, '0')}` as `0x${string}`;
      }
      resolve(mockAddress as `0x${string}`);
    }, 500); // Simulate network delay
  });
}

/**
 * Mock disconnect wallet
 */
export function mockDisconnect(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockConnected = false;
      resolve();
    }, 300);
  });
}

/**
 * Check if wallet is connected
 */
export function mockIsConnected(): boolean {
  return mockConnected;
}

/**
 * Get connected wallet address
 */
export function mockGetAddress(): `0x${string}` {
  return mockConnected ? mockAddress as `0x${string}` : '0x0000000000000000000000000000000000000000';
}

/**
 * Mock send transaction
 */
export function mockSendTransaction(options: any): Promise<`0x${string}`> {
  console.log('mockSendTransaction called with options:', options);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate mock transaction hash
      const txHash = `0x${Math.floor(Math.random() * 10**16).toString(16).padStart(64, '0')}` as `0x${string}`;
      
      console.log(`Generated mock transaction hash: ${txHash}`);
      
      // Record the transaction
      mockTransactions.set(txHash, {
        hash: txHash,
        to: options.to,
        from: mockAddress,
        value: options.value || BigInt(0),
        data: options.data || '0x',
        status: 'pending',
        timestamp: Date.now(),
        gasUsed: BigInt(21000),
        blockNumber: null,
        confirmations: 0,
      });
      
      // Start confirmation simulation for this transaction
      simulateConfirmations(txHash);
      
      resolve(txHash);
    }, 1000);
  });
}

/**
 * Simulate transaction confirmations
 */
function simulateConfirmations(txHash: string): void {
  const tx = mockTransactions.get(txHash);
  if (!tx) return;
  
  // Initial confirmation after 2 seconds
  setTimeout(() => {
    const updatedTx = mockTransactions.get(txHash);
    if (updatedTx) {
      updatedTx.status = 'confirmed';
      updatedTx.blockNumber = 12345678 + txCounter++;
      updatedTx.confirmations = 1;
      mockTransactions.set(txHash, updatedTx);
      
      // Simulate more confirmations
      for (let i = 2; i <= 12; i++) {
        setTimeout(() => {
          const tx = mockTransactions.get(txHash);
          if (tx) {
            tx.confirmations = i;
            mockTransactions.set(txHash, tx);
          }
        }, i * 1000); // Each confirmation 1 second apart
      }
    }
  }, 2000);
}

/**
 * Mock wait for transaction
 */
export function mockWaitForTransaction(txHash: string, confirmations = 1): Promise<any> {
  return new Promise((resolve, reject) => {
    const checkConfirmation = () => {
      const tx = mockTransactions.get(txHash);
      if (!tx) {
        reject(new Error('Transaction not found'));
        return;
      }
      
      if (tx.confirmations >= confirmations) {
        resolve(tx);
      } else {
        setTimeout(checkConfirmation, 1000);
      }
    };
    
    checkConfirmation();
  });
}

/**
 * Mock get transaction
 */
export function mockGetTransaction(txHash: string): any {
  return mockTransactions.get(txHash) || null;
}

/**
 * Mock get pending transactions
 */
export function mockGetPendingTransactions(): any[] {
  return Array.from(mockTransactions.values())
    .filter(tx => tx.status === 'pending');
}

/**
 * Mock token transfer
 */
export function mockTransferToken(tokenAddress: string, to: string, amount: bigint): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const token = mockTokens[tokenAddress];
      if (!token) {
        reject(new Error('Token not found'));
        return;
      }
      
      // Mock successful transfer
      const txHash = `0x${Math.floor(Math.random() * 10**16).toString(16).padStart(64, '0')}`;
      
      // Record the transaction
      mockTransactions.set(txHash, {
        hash: txHash,
        to: tokenAddress,
        from: mockAddress,
        value: BigInt(0),
        data: `0xa9059cbb000000000000000000000000${to.substring(2)}${amount.toString(16).padStart(64, '0')}`,
        status: 'pending',
        timestamp: Date.now(),
        gasUsed: BigInt(65000),
        blockNumber: null,
        confirmations: 0,
        tokenTransfer: {
          token: tokenAddress,
          from: mockAddress,
          to: to,
          amount: amount
        }
      });
      
      // Start confirmation simulation
      simulateConfirmations(txHash);
      
      resolve(txHash);
    }, 1500);
  });
}

/**
 * Mock deploy contract
 */
export function mockDeployContract(abi: any[], bytecode: string, args: any[]): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate a contract address
      const contractAddress = `0x${Math.floor(Math.random() * 10**16).toString(16).padStart(40, '0')}`;
      
      // Generate mock transaction hash
      const txHash = `0x${Math.floor(Math.random() * 10**16).toString(16).padStart(64, '0')}`;
      
      // Record the deployment transaction
      mockTransactions.set(txHash, {
        hash: txHash,
        from: mockAddress,
        to: null,
        value: BigInt(0),
        data: bytecode,
        status: 'pending',
        timestamp: Date.now(),
        gasUsed: BigInt(1500000),
        blockNumber: null,
        confirmations: 0,
        contractAddress: contractAddress
      });
      
      // Start confirmation simulation
      simulateConfirmations(txHash);
      
      // Return the contract
      resolve({
        address: contractAddress,
        deployTransaction: mockTransactions.get(txHash)
      });
    }, 2000);
  });
} 