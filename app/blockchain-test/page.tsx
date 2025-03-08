"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Wallet, Send, FileCode, Blocks, AlertCircle } from 'lucide-react';
import { WalletConnect } from '@/components/WalletConnect';
import { blockchainApi } from '@/lib/api/blockchain-api';
import { USE_MOCKS, USE_HARDHAT, USE_TESTNET, DEFAULT_NETWORK } from '@/lib/blockchain/config';

export default function BlockchainTestPage() {
  const [activeTab, setActiveTab] = useState('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [environment, setEnvironment] = useState('');
  
  // Transfer state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  
  // Contract deployment state
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [tokenName, setTokenName] = useState('Test Token');
  const [tokenSymbol, setTokenSymbol] = useState('TEST');
  const [tokenDecimals, setTokenDecimals] = useState('18');
  const [tokenSupply, setTokenSupply] = useState('1000000');
  
  useEffect(() => {
    // Determine environment
    let envType = 'Unknown';
    if (USE_MOCKS) envType = 'Mock Implementation';
    else if (USE_HARDHAT) envType = 'Local Hardhat Network';
    else if (USE_TESTNET) envType = 'Public Testnet (Sepolia)';
    else envType = 'Mainnet';
    
    setEnvironment(`${envType} (${DEFAULT_NETWORK})`);
    
    // Load contract templates
    loadTemplates();
  }, []);
  
  const loadTemplates = async () => {
    try {
      const templates = await blockchainApi.getContractTemplates();
      setTemplates(templates);
      if (templates.length > 0) {
        setSelectedTemplate(templates[0].id);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };
  
  const handleTransfer = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await blockchainApi.transferTokens(
        recipient,
        amount,
        tokenAddress || undefined
      );
      
      setTxHash(result.transactionHash);
      setSuccess(`Transaction submitted: ${result.transactionHash}`);
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeploy = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // For SimpleToken template, provide parameters
      const params = {
        name: tokenName,
        symbol: tokenSymbol,
        decimals: parseInt(tokenDecimals, 10),
        initialSupply: tokenSupply
      };
      
      const result = await blockchainApi.deployContract(
        selectedTemplate,
        params
      );
      
      setTxHash(result.transactionHash);
      setSuccess(`Contract deployed: ${result.contractAddress}`);
    } catch (err: any) {
      setError(err.message || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefreshStatus = async () => {
    if (!txHash) return;
    
    setLoading(true);
    try {
      if (activeTab === 'transfer') {
        const status = await blockchainApi.getTransferStatus(txHash);
        setSuccess(`Status: ${status.status}, Confirmations: ${status.confirmations}`);
      } else if (activeTab === 'deploy') {
        const status = await blockchainApi.getDeploymentStatus(txHash);
        setSuccess(`Status: ${status.status}, Contract: ${status.contractAddress}, Confirmations: ${status.confirmations}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get status');
    } finally {
      setLoading(false);
    }
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
          <div className="mb-6">
            <WalletConnect />
          </div>
          
          <Tabs defaultValue="wallet" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
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
          </Tabs>
          
          {txHash && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-2 rounded-md text-sm break-all">
                      <strong>Transaction Hash:</strong> {txHash}
                    </div>
                    
                    <Button onClick={handleRefreshStatus} disabled={loading}>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Blocks className="mr-2 h-4 w-4" />
                      )}
                      Refresh Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mt-6 bg-green-50 border-green-300 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 