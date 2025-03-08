"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Wallet, Send, FileCode, Blocks, AlertCircle, History } from 'lucide-react';
import { WalletConnect } from '@/components/WalletConnect';
import { blockchainApi } from '@/lib/api/blockchain-api';
import { USE_MOCKS, USE_HARDHAT, USE_TESTNET, DEFAULT_NETWORK } from '@/lib/blockchain/config';
import { TransferResult } from '@/lib/agents/transaction/token-transfer-agent';
import { transactionApi, TransactionRecord } from '@/lib/api/transaction-api';
import { TokenTransferAgent } from '@/lib/agents/transaction/token-transfer-agent';
import { ContractDeploymentAgent } from '@/lib/agents/deployment/contract-deployment-agent';

export default function BlockchainTestPage() {
  const [activeTab, setActiveTab] = useState('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [environment, setEnvironment] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Transaction history
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  
  // Transfer state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  
  // Contract deployment state
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('erc20-token');
  const [tokenName, setTokenName] = useState('Test Token');
  const [tokenSymbol, setTokenSymbol] = useState('TEST');
  const [tokenDecimals, setTokenDecimals] = useState('18');
  const [tokenSupply, setTokenSupply] = useState('1000000');
  
  // Memoize event handlers to prevent unnecessary re-renders
  const handleTransactionAdded = useCallback((transaction: TransactionRecord) => {
    console.log('🔵 Blockchain test page received transaction:added event:', transaction);
    setTransactions(prev => {
      // Check if transaction already exists
      const exists = prev.some(t => t.transactionHash === transaction.transactionHash);
      if (exists) {
        console.log('🔵 Transaction already exists, updating:', transaction.transactionHash);
        return prev.map(t => 
          t.transactionHash === transaction.transactionHash ? transaction : t
        );
      } else {
        console.log('🔵 Adding new transaction:', transaction.transactionHash);
        return [transaction, ...prev];
      }
    });
  }, []);

  const handleTransactionUpdated = useCallback((transaction: TransactionRecord) => {
    console.log('🟢 Blockchain test page received transaction:updated event:', transaction);
    setTransactions(prev => {
      // Check if transaction exists
      const exists = prev.some(t => t.transactionHash === transaction.transactionHash);
      if (exists) {
        console.log('🟢 Updating existing transaction:', transaction.transactionHash);
        return prev.map(t => 
          t.transactionHash === transaction.transactionHash ? transaction : t
        );
      } else {
        console.log('🟢 Transaction not found in state, adding:', transaction.transactionHash);
        return [transaction, ...prev];
      }
    });
  }, []);

  // Add a separate effect for transaction monitoring
  useEffect(() => {
    console.log('DEBUG - Setting up transaction event listeners');
    
    // Register event handlers
    transactionApi.subscribe('transaction:added', handleTransactionAdded);
    transactionApi.subscribe('transaction:updated', handleTransactionUpdated);
    
    // Initial load of transactions
    console.log('DEBUG - Loading initial transactions');
    loadTransactionHistory();
    
    // Return cleanup function
    return () => {
      console.log('DEBUG - Cleaning up transaction event listeners');
      transactionApi.unsubscribe('transaction:added', handleTransactionAdded);
      transactionApi.unsubscribe('transaction:updated', handleTransactionUpdated);
    };
  }, [handleTransactionAdded, handleTransactionUpdated]);

  // Add periodic debugging
  useEffect(() => {
    console.log('DEBUG - Setting up transaction debug interval');
    
    const logTransactions = () => {
      console.log('🔍 TRANSACTION DEBUG:');
      console.log('- API transactions:', transactionApi.getAllTransactions());
      console.log('- Component state:', transactions);
      console.log('- TokenTransferAgent transfers:', 
        TokenTransferAgent.getAllTransfers().length);
      console.log('- ContractDeploymentAgent deployments:', 
        ContractDeploymentAgent.getAllDeployments().length);
    };
    
    // Log immediately and then every 10 seconds
    logTransactions();
    const interval = setInterval(logTransactions, 10000);
    
    return () => {
      console.log('DEBUG - Cleaning up transaction debug interval');
      clearInterval(interval);
    };
  }, [transactions]);
  
  useEffect(() => {
    // Determine environment
    let envType = 'Unknown';
    if (USE_MOCKS) envType = 'Mock Implementation';
    else if (USE_HARDHAT) envType = 'Local Hardhat Network';
    else if (USE_TESTNET) envType = 'Public Testnet (Sepolia)';
    else envType = 'Mainnet';
    
    setEnvironment(`${envType} (${DEFAULT_NETWORK})`);
    
    // Set session ID to default-session for consistency with chat interface
    const defaultSessionId = 'default-session';
    setSessionId(defaultSessionId);
    console.log('Setting fixed session ID:', defaultSessionId);
    
    // Set the session ID in the blockchain API
    blockchainApi.setSessionId(defaultSessionId);
    console.log('Session ID set in blockchain API:', defaultSessionId);
    
    // Load contract templates
    loadTemplates();
    
    // Load transaction history from local storage
    loadTransactionHistory();
  }, []); // Empty dependency array so this only runs once on mount
  
  // Generate a unique session ID
  const generateSessionId = (): string => {
    // Always use "default-session" to match the chat interface
    console.log('Using default-session for consistency with chat interface');
    return 'default-session';
  };
  
  // Load transaction history from local storage
  const loadTransactionHistory = () => {
    try {
      console.log('Loading transactions from transaction API');
      const transactions = transactionApi.getAllTransactions();
      console.log(`Loaded ${transactions.length} transactions`);
      setTransactions(transactions);
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setError(`Failed to load transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Add a transaction to history
  const addTransaction = (hash: string, type: 'transfer' | 'deploy', details: any) => {
    try {
      console.log(`Adding transaction ${hash} to local state`);
      // Just add to local state for UI, the global registry already has it
      const newTransaction: TransactionRecord = {
        transactionHash: hash as `0x${string}`,
        status: 'pending',
        timestamp: Date.now(),
        type,
        ...(type === 'transfer' 
          ? { 
              tokenAddress: details.tokenAddress, 
              to: details.to, 
              amount: details.amount 
            } 
          : { 
              templateId: details.templateId,
              contractAddress: null
            }
        )
      };
      
      setTransactions(prev => {
        const updated = [newTransaction, ...prev.filter(t => t.transactionHash !== hash)];
        return updated;
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };
  
  // Update a transaction in history
  const updateTransaction = (hash: string, status: string, details: any) => {
    try {
      console.log(`Updating transaction ${hash} status to ${status}`);
      
      // Get the latest transaction data from our API
      const latestTransaction = transactionApi.getTransaction(hash as `0x${string}`);
      
      if (!latestTransaction) {
        console.warn(`Transaction ${hash} not found in global registry`);
        return;
      }
      
      // Update the local state for UI
      setTransactions(prev => {
        const updated = [...prev];
        const index = updated.findIndex(t => t.transactionHash === hash);
        
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            ...latestTransaction
          };
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };
  
  const loadTemplates = async () => {
    try {
      blockchainApi.setSessionId(sessionId!);
      const availableTemplates = await blockchainApi.getContractTemplates();
      console.log('Available templates:', availableTemplates);
      setTemplates(availableTemplates);
      
      // If no template is selected and we have templates, select the first one
      if (!selectedTemplate && availableTemplates.length > 0) {
        setSelectedTemplate('erc20-token'); // Default to ERC20 token template
        console.log('Selected default template: erc20-token');
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };
  
  const handleConnectWallet = async () => {
    try {
      console.log('Connecting wallet with session ID:', sessionId);
      
      // Connect wallet using the blockchain API
      const address = await blockchainApi.connectWallet('metamask');
      console.log('Wallet connected successfully:', address);
      
      // Update wallet address state
      setWalletAddress(address);
      
      // Show success message
      setSuccess(`Wallet connected: ${address}`);
      setError(null);
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(`Failed to connect wallet: ${err.message}`);
      setSuccess(null);
    }
  };
  
  const WalletConnectionSection = () => (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Session Information</h3>
            <p className="text-sm text-muted-foreground">
              Session ID: {sessionId || 'Not set'}
            </p>
            {walletAddress && (
              <p className="text-sm text-muted-foreground">
                Wallet: {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
              </p>
            )}
          </div>
          <Button 
            onClick={handleConnectWallet} 
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Wallet className="h-4 w-4" />
            <span>Connect Wallet</span>
          </Button>
        </div>
      </div>
      <WalletConnect onConnect={(address) => {
        console.log('Wallet connected via WalletConnect:', address);
        setWalletAddress(address);
      }} />
    </div>
  );
  
  const handleTransfer = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    console.log('Initiating token transfer:', {
      recipient,
      amount,
      tokenAddress: tokenAddress || 'ETH (native)',
      sessionId,
      walletAddress
    });
    
    try {
      // Check if wallet is connected
      if (!walletAddress) {
        console.error('Wallet not connected');
        setError('Wallet not connected. Please connect your wallet first.');
        setLoading(false);
        return;
      }
      
      // Verify session ID is set in the API
      console.log('Verifying session ID in blockchain API:', blockchainApi.getSessionId());
      if (blockchainApi.getSessionId() !== sessionId) {
        console.warn('Session ID mismatch, updating in API:', {
          current: blockchainApi.getSessionId(),
          expected: sessionId
        });
        blockchainApi.setSessionId(sessionId!);
      }
      
      const result = await blockchainApi.transferTokens(
        recipient,
        amount,
        tokenAddress || undefined
      );
      
      console.log('Transfer result:', result);
      setTxHash(result.transactionHash);
      setSuccess(`Transaction submitted: ${result.transactionHash}`);
      
      // Add to transaction history
      addTransaction(result.transactionHash, 'transfer', {
        recipient,
        amount,
        tokenAddress: tokenAddress || 'ETH',
        status: result.status
      });
    } catch (err: any) {
      console.error('Transfer failed:', err);
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeploy = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    console.log('Initiating contract deployment:', {
      template: 'erc20-token', // Force correct template ID
      params: {
        name: tokenName,
        symbol: tokenSymbol,
        decimals: parseInt(tokenDecimals, 10),
        initialSupply: tokenSupply
      },
      sessionId,
      walletAddress
    });
    
    try {
      // Check if wallet is connected
      if (!walletAddress) {
        console.error('Wallet not connected');
        setError('Wallet not connected. Please connect your wallet first.');
        setLoading(false);
        return;
      }
      
      // Verify session ID is set in the API
      console.log('Verifying session ID in blockchain API:', blockchainApi.getSessionId());
      if (blockchainApi.getSessionId() !== sessionId) {
        console.warn('Session ID mismatch, updating in API:', {
          current: blockchainApi.getSessionId(),
          expected: sessionId
        });
        blockchainApi.setSessionId(sessionId!);
      }
      
      // For ERC20 token template, provide parameters
      const params = {
        templateParams: {
          name: tokenName  // This is for replacing {{name}} in the template
        },
        constructorArgs: [
          tokenName,      // _name parameter
          tokenSymbol,    // _symbol parameter
          tokenSupply,    // _initialSupply parameter
          walletAddress   // _owner parameter
        ]
      };
      
      console.log('Deployment parameters:', params);
      
      const result = await blockchainApi.deployContract(
        'erc20-token', // Force correct template ID
        params
      );
      
      console.log('Deployment result:', result);
      setTxHash(result.transactionHash);
      setSuccess(`Contract deployed: ${result.contractAddress}`);
      
      // Add to transaction history
      addTransaction(result.transactionHash, 'deploy', {
        template: 'erc20-token',
        contractAddress: result.contractAddress,
        params,
        status: 'pending'
      });
    } catch (err: any) {
      console.error('Deployment failed:', err);
      setError(err.message || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefreshStatus = async () => {
    if (!txHash) return;
    
    setLoading(true);
    console.log('Refreshing transaction status for:', txHash);
    
    try {
      if (activeTab === 'transfer') {
        const status = await blockchainApi.getTransferStatus(txHash);
        console.log('Transfer status:', status);
        setSuccess(`Status: ${status.status}, Confirmations: ${status.confirmations || 0}`);
        
        // Update transaction in history
        updateTransaction(txHash, status.status, status);
      } else {
        const status = await blockchainApi.getDeploymentStatus(txHash);
        console.log('Deployment status:', status);
        
        // Extract status and confirmations with fallbacks
        const deployStatus = status.deploymentStatus || (status.contractAddress ? 'success' : 'pending');
        const confirmations = status.confirmations || 0;
        
        setSuccess(`Status: ${deployStatus}, Contract: ${status.contractAddress}, Confirmations: ${confirmations}`);
        
        // Update transaction in history
        updateTransaction(txHash, deployStatus, status);
      }
    } catch (err: any) {
      console.error('Error checking status:', err);
      setError(err.message || 'Failed to check status');
    } finally {
      setLoading(false);
    }
  };
  
  // Clear transaction history
  const clearTransactionHistory = () => {
    setTransactions([]);
    console.log('Transaction history cleared');
  };
  
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Testing Interface</CardTitle>
          <CardDescription>
            Test blockchain functionality in isolation
          </CardDescription>
          <div className="bg-muted p-2 rounded-md text-sm mt-2">
            <strong>Environment:</strong> {environment}
          </div>
        </CardHeader>
        <CardContent>
          <WalletConnectionSection />
          
          <Tabs defaultValue="wallet" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="wallet">
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </TabsTrigger>
              <TabsTrigger value="transfer">
                <Send className="h-4 w-4 mr-2" />
                Transfer
              </TabsTrigger>
              <TabsTrigger value="deploy">
                <FileCode className="h-4 w-4 mr-2" />
                Deploy Contract
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="wallet">
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your wallet using the button above to interact with blockchain functionality.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transfer">
              <Card>
                <CardHeader>
                  <CardTitle>Transfer Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient Address</Label>
                        <Input
                          id="recipient"
                          placeholder="0x..."
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          placeholder="1.0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tokenAddress">Token Address (Optional, leave empty for ETH)</Label>
                        <Input
                          id="tokenAddress"
                          placeholder="0x..."
                          value={tokenAddress}
                          onChange={(e) => setTokenAddress(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleTransfer}
                      disabled={loading || !recipient || !amount}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Send Transaction</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="deploy">
              <Card>
                <CardHeader>
                  <CardTitle>Deploy Contract</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template">Contract Template</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.length === 0 ? (
                            <SelectItem value="simple-token">Simple Token (ERC20)</SelectItem>
                          ) : (
                            templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="tokenName">Token Name</Label>
                      <Input
                        id="tokenName"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tokenSymbol">Token Symbol</Label>
                      <Input
                        id="tokenSymbol"
                        value={tokenSymbol}
                        onChange={(e) => setTokenSymbol(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tokenDecimals">Decimals</Label>
                        <Input
                          id="tokenDecimals"
                          value={tokenDecimals}
                          onChange={(e) => setTokenDecimals(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tokenSupply">Initial Supply</Label>
                        <Input
                          id="tokenSupply"
                          value={tokenSupply}
                          onChange={(e) => setTokenSupply(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleDeploy}
                      disabled={loading || !tokenName || !tokenSymbol}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>Deploy Contract</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* New Transaction History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    View and track your blockchain transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No transactions yet. Try sending a transaction or deploying a contract.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearTransactionHistory}
                        className="mb-4"
                      >
                        Clear History
                      </Button>
                      
                      {transactions.map((tx) => (
                        <Card key={tx.transactionHash} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">
                                  {tx.type === 'transfer' ? 'Token Transfer' : 'Contract Deployment'}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {tx.transactionHash}
                                </p>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs ${
                                tx.status === 'success' 
                                  ? 'bg-green-100 text-green-800' 
                                  : tx.status === 'failed' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {tx.status}
                              </div>
                            </div>
                            
                            <Separator className="my-2" />
                            
                            <div className="text-sm space-y-1">
                              <div className="grid grid-cols-2">
                                <span className="text-muted-foreground">Time:</span>
                                <span>{new Date(tx.timestamp).toLocaleString()}</span>
                              </div>
                              
                              {tx.type === 'transfer' && (
                                <>
                                  <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">To:</span>
                                    <span className="truncate">{tx.to}</span>
                                  </div>
                                  <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span>{tx.amount} {tx.tokenAddress === 'ETH' ? 'ETH' : 'Tokens'}</span>
                                  </div>
                                </>
                              )}
                              
                              {tx.type === 'deploy' && (
                                <>
                                  <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">Template:</span>
                                    <span>{tx.templateId}</span>
                                  </div>
                                  {tx.contractAddress && (
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Contract:</span>
                                      <span className="truncate">{tx.contractAddress}</span>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {tx.confirmations !== undefined && (
                                <div className="grid grid-cols-2">
                                  <span className="text-muted-foreground">Confirmations:</span>
                                  <span>{tx.confirmations}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setTxHash(tx.transactionHash);
                                  setActiveTab(tx.type === 'transfer' ? 'transfer' : 'deploy');
                                  handleRefreshStatus();
                                }}
                              >
                                Refresh Status
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mt-6 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {txHash && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm">
                <strong>Transaction Hash:</strong> {txHash}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshStatus}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>Refresh Status</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 