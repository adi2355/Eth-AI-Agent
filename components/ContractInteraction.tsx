"use client";

import { useState } from 'react';
// import { useContractWrite, useContractRead } from 'wagmi';
// import { parseEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CONTRACT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const; // Example ERC20 contract
const CONTRACT_ABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_to",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export function ContractInteraction() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const isLoading = false;
  const contractData = null;

  // Commented out due to wagmi version compatibility issues
  /*
  const { data: contractData } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'balanceOf',
  });

  const { write: transfer, isPending: isLoading } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'transfer',
  });
  */

  const handleTransfer = async () => {
    // Commented out due to wagmi version compatibility issues
    /*
    if (!amount || !recipient || !transfer) return;
    
    try {
      transfer({
        args: [recipient, parseEther(amount)],
      });
      console.log('Transaction submitted');
    } catch (error) {
      console.error('Transfer failed:', error);
    }
    */
    console.log('Transfer functionality disabled');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Interaction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Recipient Address</label>
            <Input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="mt-1"
            />
          </div>
          <Button 
            onClick={handleTransfer}
            disabled={isLoading || !amount || !recipient}
          >
            {isLoading ? 'Transferring...' : 'Transfer'}
          </Button>
          {contractData && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Contract Balance: {String(contractData)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}