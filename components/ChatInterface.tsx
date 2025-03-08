"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, RefreshCcw, ChevronDown, AlertCircle, Info, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { v4 as uuidv4 } from 'uuid';
import { blockchainApi } from '@/lib/api/blockchain-api';
import { ContractTemplateSelector } from './ContractTemplateSelector';
import { TransactionForm } from './TransactionForm';
import { WalletIntegrationService } from '@/lib/blockchain/wallet-integration';

interface ErrorAlert {
  type: 'rate-limit' | 'api-error' | 'not-found' | 'network' | 'unknown';
  message: string;
  suggestion?: string;
  retryable: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: ErrorAlert;
  data?: any;
  suggestions?: string[];
  contextAnalysis?: {
    isCoherent: boolean;
    confidence: number;
  };
}

const ErrorAlertComponent = ({ error, onRetry }: { error: ErrorAlert; onRetry?: () => void }) => (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <div>
        <p className="font-medium">{error.message}</p>
        {error.suggestion && (
          <p className="text-sm mt-1 text-muted-foreground">{error.suggestion}</p>
        )}
      </div>
      {error.retryable && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

const MessageComponent = ({ 
  message, 
  onRetry, 
  onSuggestionClick 
}: { 
  message: Message; 
  onRetry: () => void;
  onSuggestionClick: (suggestion: string) => void;
}) => {
  const isError = message.error !== undefined;
  const hasApiSource = message.data?.source === 'coingecko' || message.data?.source === 'coinmarketcap';
  const hasTxData = message.data?.transactionHash;
  const txStatus = message.data?.status || 'pending';

  const messageClasses = [
    "max-w-[80%] rounded-lg px-4 py-2",
    message.role === 'user' 
      ? "bg-primary text-primary-foreground" 
      : isError 
        ? "bg-destructive/10 text-destructive" 
        : "bg-muted"
  ].join(' ');

  const containerClasses = [
    "flex gap-2",
    message.role === 'user' ? "justify-end" : "justify-start"
  ].join(' ');

  return (
    <div className={containerClasses}>
      {message.role === 'assistant' && (
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={messageClasses}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {hasApiSource && (
          <div className="flex items-center gap-1 text-xs opacity-70 mt-1">
            <Info className="h-3 w-3" />
            <span>Data source: {message.data.source}</span>
          </div>
        )}

        {hasTxData && (
          <div className="mt-2 text-xs border-t pt-2">
            <div className="flex items-center gap-2">
              <span className={
                txStatus === 'success' ? 'text-green-500' :
                txStatus === 'failed' ? 'text-red-500' :
                'text-yellow-500'
              }>
                {txStatus === 'success' ? '✓' :
                 txStatus === 'failed' ? '✗' : '⟳'}
              </span>
              <span className="font-mono">{message.data.transactionHash.slice(0, 6)}...{message.data.transactionHash.slice(-4)}</span>
              {txStatus === 'pending' && (
                <Loader2 className="h-3 w-3 animate-spin ml-2" />
              )}
            </div>
          </div>
        )}

        {message.contextAnalysis && (
          <div className="flex items-center gap-2 text-xs opacity-70 mt-1 border-t pt-1">
            {message.contextAnalysis.isCoherent ? (
              <>
                <span className="text-green-500">✓</span>
                <span>Context aligned</span>
                <span className="text-muted-foreground">
                  ({(message.contextAnalysis.confidence * 100).toFixed(0)}% confidence)
                </span>
              </>
            ) : (
              <>
                <span className="text-yellow-500">⚠</span>
                <span>Context shift detected</span>
                <span className="text-muted-foreground">
                  ({(message.contextAnalysis.confidence * 100).toFixed(0)}% confidence)
                </span>
              </>
            )}
          </div>
        )}

        <p className="text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>

        {isError && message.error?.retryable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium">Suggested queries:</p>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QUICK_QUERIES = [
  {
    label: 'Bitcoin price',
    query: 'What is the current price of Bitcoin?',
  },
  {
    label: 'ETH price',
    query: 'What is the current price of Ethereum?',
  },
  {
    label: 'Compare BTC & ETH',
    query: 'Compare Bitcoin and Ethereum prices',
  },
];

const BLOCKCHAIN_ACTIONS = [
  {
    label: 'Deploy ERC20 Token',
    query: 'I want to deploy an ERC20 token called MyToken with symbol MTK',
  },
  {
    label: 'Send ETH',
    query: 'I want to send 0.01 ETH',
  },
  {
    label: 'Connect Wallet',
    query: 'Connect my wallet',
  },
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionId, setSessionId] = useState<string>('default-session');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transactions, setTransactions] = useState<{
    hash: string;
    status: 'pending' | 'success' | 'failed';
    type: 'transfer' | 'deploy';
  }[]>([]);
  const [pendingTransaction, setPendingTransaction] = useState<{
    type: 'transfer' | 'deploy';
    params: any;
  } | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionFormValues, setTransactionFormValues] = useState({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setSessionId('default-session');
  }, []);

  useEffect(() => {
    // Set the session ID in the blockchain API
    blockchainApi.setSessionId(sessionId);
    console.log('ChatInterface: Set blockchain API session ID:', sessionId);
    
    setMessages([]);
    
    try {
      const savedMessages = localStorage.getItem(`chat_messages_${sessionId}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      console.error('Failed to restore messages:', error);
    }
  }, [sessionId]);
  
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save messages:', error);
      }
    }
  }, [messages, sessionId]);

  const handleError = (error: unknown): ErrorAlert => {
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return {
          type: 'rate-limit',
          message: 'API rate limit exceeded',
          suggestion: 'Please wait a moment before trying again',
          retryable: true
        };
      }
      
      if (error.message.includes('API key')) {
        return {
          type: 'api-error',
          message: 'Service configuration error',
          suggestion: 'Please contact support if this persists',
          retryable: false
        };
      }

      if (error.message.includes('not found') || error.message.includes('No data available')) {
        return {
          type: 'not-found',
          message: 'Token not found',
          suggestion: 'Try checking the token symbol or searching for a different token',
          retryable: false
        };
      }

      if (error.message.includes('network') || error.message.includes('ECONNRESET')) {
        return {
          type: 'network',
          message: 'Network connection error',
          suggestion: 'Please check your internet connection',
          retryable: true
        };
      }

      return {
        type: 'unknown',
        message: error.message,
        retryable: true
      };
    }

    return {
      type: 'unknown',
      message: 'An unexpected error occurred',
      retryable: true
    };
  };

  const handleSubmit = async (e: React.FormEvent | string, isRetry = false) => {
    if (typeof e !== 'string' && e?.preventDefault) {
      e.preventDefault();
    }
    const queryText = typeof e === 'string' ? e : input;
    
    if (!queryText.trim() || !sessionId || isLoading) return;

    if (!isRetry) {
      setRetryCount(0);
    }

    const userMessage: Message = {
      role: 'user',
      content: queryText,
      timestamp: new Date(),
    };

    if (!isRetry) {
      setMessages(prev => [...prev, userMessage]);
    }
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: queryText,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        data: data.data,
        suggestions: data.suggestions,
        contextAnalysis: data.contextAnalysis
      };

      setMessages(prev => {
        if (isRetry) {
          return [...prev.slice(0, -1), assistantMessage];
        }
        return [...prev, assistantMessage];
      });
    } catch (error) {
      const errorAlert = handleError(error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: errorAlert.message + (errorAlert.suggestion ? `\n\n${errorAlert.suggestion}` : ''),
        timestamp: new Date(),
        error: errorAlert,
      };

      setMessages(prev => {
        if (isRetry) {
          return [...prev.slice(0, -1), errorMessage];
        }
        return [...prev, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  const connectWallet = async () => {
    try {
      // Set the session ID to 'default-session' for consistency
      console.log('ChatInterface: Connecting wallet with session ID:', sessionId);
      
      // Connect the wallet through the blockchain API
      const address = await blockchainApi.connectWallet('metamask');
      console.log('ChatInterface: Connected to wallet with address:', address);
      
      // Set the wallet address in state
      setWalletAddress(address);
      
      // Create success message
      const newMessage: Message = {
        role: 'assistant',
        content: `✅ Wallet connected successfully!\n\nAddress: \`${address.slice(0, 6)}...${address.slice(-4)}\`\n\nYou can now perform blockchain operations like deploying contracts and sending transactions.`,
        timestamp: new Date(),
        data: {
          blockchain: {
            actionType: 'CONNECT_WALLET',
            address
          }
        }
      };
      
      setMessages(prev => [...prev, newMessage]);
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      const newMessage: Message = {
        role: 'assistant',
        content: 'Failed to connect wallet. Please try again.',
        timestamp: new Date(),
        error: {
          type: 'api-error',
          message: 'Failed to connect wallet',
          suggestion: error instanceof Error ? error.message : 'Please check if MetaMask is installed and unlocked.',
          retryable: true
        }
      };
      
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const checkTransactionStatus = async (hash: string, type: 'transfer' | 'deploy') => {
    try {
      if (type === 'transfer') {
        const result = await blockchainApi.getTransferStatus(hash);
        return {
          hash,
          status: result.status as 'pending' | 'success' | 'failed',
          type
        };
      } else {
        const result = await blockchainApi.getDeploymentStatus(hash);
        return {
          hash,
          status: result.deploymentStatus as 'pending' | 'success' | 'failed',
          type
        };
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return {
        hash,
        status: 'failed' as const,
        type
      };
    }
  };

  useEffect(() => {
    const txMessages = messages.filter(msg => msg.data?.transactionHash);
    const newTxs = txMessages.map(msg => ({
      hash: msg.data.transactionHash as string,
      status: 'pending' as const,
      type: msg.content.includes('Contract') ? 'deploy' as const : 'transfer' as const
    })).filter(tx => !transactions.some(t => t.hash === tx.hash));
    
    if (newTxs.length > 0) {
      setTransactions(prev => [...prev, ...newTxs]);
    }
    
    const interval = setInterval(async () => {
      const pending = transactions.filter(tx => tx.status === 'pending');
      if (pending.length === 0) {
        clearInterval(interval);
        return;
      }
      
      const updates = await Promise.all(
        pending.map(tx => checkTransactionStatus(tx.hash, tx.type))
      );
      
      setTransactions(prev => 
        prev.map(tx => {
          const update = updates.find(u => u.hash === tx.hash);
          return update || tx;
        })
      );
      
      updates
        .filter(u => u.status !== 'pending')
        .forEach(tx => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: tx.status === 'success'
              ? `${tx.type === 'deploy' ? 'Contract deployment' : 'Transaction'} successful! Hash: ${tx.hash}`
              : `${tx.type === 'deploy' ? 'Contract deployment' : 'Transaction'} failed. Hash: ${tx.hash}`,
            timestamp: new Date(),
            data: { transactionHash: tx.hash, status: tx.status }
          }]);
        });
        
    }, 5000);
    
    return () => clearInterval(interval);
  }, [messages, transactions]);

  useEffect(() => {
    const lastAssistantMsg = messages
      .filter(msg => msg.role === 'assistant')
      .pop();
      
    if (lastAssistantMsg?.data?.blockchain?.actionType === 'TRANSFER_TOKENS') {
      setPendingTransaction({
        type: 'transfer',
        params: lastAssistantMsg.data.blockchain.data
      });
    } else if (lastAssistantMsg?.data?.blockchain?.actionType === 'DEPLOY_CONTRACT') {
      setPendingTransaction({
        type: 'deploy',
        params: lastAssistantMsg.data.blockchain.data
      });
    }
  }, [messages]);

  useEffect(() => {
    const lastUserMsg = messages
      .filter(msg => msg.role === 'user')
      .pop();
      
    if (lastUserMsg) {
      const content = lastUserMsg.content.toLowerCase();
      
      if (content.includes('deploy') && 
          content.includes('contract') && 
          !content.includes('erc20') &&
          !content.includes('erc721') &&
          !content.includes('erc1155')) {
        setShowTemplateSelector(true);
      }
      
      if ((content.includes('send') || 
           content.includes('transfer')) &&
          !content.match(/0x[a-fA-F0-9]{40}/)) {
        
        setShowTransactionForm(true);
        
        const amount = content.match(/\d+(\.\d+)?/)?.[0];
        if (amount) {
          setTransactionFormValues({ amount });
        }
      }
    }
  }, [messages]);

  // Add a useEffect to check wallet connection on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // Check if the wallet is already connected in the session
        const walletStatus = await blockchainApi.getWalletStatus();
        console.log('ChatInterface: Checking existing wallet connection:', walletStatus);
        
        if (walletStatus && walletStatus.connected && walletStatus.address) {
          // If wallet is already connected, update the state
          console.log('ChatInterface: Found existing wallet connection:', walletStatus.address);
          setWalletAddress(walletStatus.address);
        }
      } catch (error) {
        console.error('ChatInterface: Error checking wallet connection:', error);
      }
    };
    
    checkWalletConnection();
  }, []);

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Blockchain Assistant
          </div>
          <div className="flex items-center gap-2">
            {walletAddress ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 px-3 bg-muted rounded-full">
                <Wallet className="h-3 w-3" />
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={connectWallet} 
                disabled={isConnecting}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-5rem)]">
        {pendingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">
                Confirm {pendingTransaction.type === 'transfer' ? 'Transaction' : 'Contract Deployment'}
              </h3>
              
              {pendingTransaction.type === 'transfer' && (
                <div className="space-y-2 mb-4">
                  <p><span className="font-medium">Send:</span> {pendingTransaction.params.amount} {pendingTransaction.params.tokenAddress ? 'tokens' : 'ETH'}</p>
                  <p><span className="font-medium">To:</span> {pendingTransaction.params.to}</p>
                  {pendingTransaction.params.tokenAddress && (
                    <p><span className="font-medium">Token:</span> {pendingTransaction.params.tokenAddress}</p>
                  )}
                </div>
              )}
              
              {pendingTransaction.type === 'deploy' && (
                <div className="space-y-2 mb-4">
                  <p><span className="font-medium">Contract:</span> {pendingTransaction.params.templateId}</p>
                  <p><span className="font-medium">Name:</span> {pendingTransaction.params.templateParams?.name}</p>
                  <p><span className="font-medium">Symbol:</span> {pendingTransaction.params.templateParams?.symbol}</p>
                </div>
              )}
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setPendingTransaction(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      let result;
                      if (pendingTransaction.type === 'transfer') {
                        result = await blockchainApi.transferTokens(
                          pendingTransaction.params.to,
                          pendingTransaction.params.amount,
                          pendingTransaction.params.tokenAddress
                        );
                      } else {
                        result = await blockchainApi.deployContract(
                          pendingTransaction.params.templateId,
                          pendingTransaction.params.templateParams
                        );
                      }
                      
                      setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: pendingTransaction.type === 'transfer' 
                          ? `Transaction sent with hash: ${result.transactionHash}` 
                          : `Contract deployment initiated with hash: ${result.transactionHash}`,
                        timestamp: new Date(),
                        data: { transactionHash: result.transactionHash }
                      }]);
                    } catch (error) {
                      console.error('Transaction error:', error);
                      setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        timestamp: new Date(),
                        error: {
                          type: 'api-error',
                          message: 'Transaction failed',
                          retryable: true
                        }
                      }]);
                    } finally {
                      setPendingTransaction(null);
                    }
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {showTemplateSelector && (
          <ContractTemplateSelector
            onSelect={(templateId) => {
              handleSubmit(`I want to deploy a ${templateId} contract`);
              setShowTemplateSelector(false);
            }}
            onCancel={() => setShowTemplateSelector(false)}
          />
        )}

        {showTransactionForm && (
          <TransactionForm
            initialValues={transactionFormValues}
            onSubmit={(data) => {
              const query = `I want to send ${data.amount} ${data.tokenAddress ? 'tokens' : 'ETH'} to ${data.to}${data.tokenAddress ? ' using token ' + data.tokenAddress : ''}`;
              handleSubmit(query);
              setShowTransactionForm(false);
            }}
            onCancel={() => setShowTransactionForm(false)}
          />
        )}

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              <p>👋 Hi! I can help you explore blockchain data and perform transactions.</p>
              <p className="mt-2">Try asking about token prices or connecting your wallet to make transactions.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <MessageComponent
              key={index}
              message={message}
              onRetry={() => handleSubmit(messages[messages.length - 2].content, true)}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p>Processing your request...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t pt-4 px-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {QUICK_QUERIES.map((item, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleSubmit(item.query)}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Wallet className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {BLOCKCHAIN_ACTIONS.map((item, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => walletAddress || item.label === 'Connect Wallet' ? 
                                   handleSubmit(item.query) : 
                                   connectWallet()}
                    disabled={!walletAddress && item.label !== 'Connect Wallet'}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tokens or blockchain operations..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}