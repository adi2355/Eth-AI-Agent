"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, RefreshCcw, ChevronDown, AlertCircle, Info } from 'lucide-react';
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

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize session with UUID
    setSessionId(uuidv4());
  }, []);

  const handleError = (error: unknown): ErrorAlert => {
    if (error instanceof Error) {
      // Rate limit errors
      if (error.message.includes('rate limit')) {
        return {
          type: 'rate-limit',
          message: 'API rate limit exceeded',
          suggestion: 'Please wait a moment before trying again',
          retryable: true
        };
      }
      
      // API configuration errors
      if (error.message.includes('API key')) {
        return {
          type: 'api-error',
          message: 'Service configuration error',
          suggestion: 'Please contact support if this persists',
          retryable: false
        };
      }

      // Not found errors
      if (error.message.includes('not found') || error.message.includes('No data available')) {
        return {
          type: 'not-found',
          message: 'Token not found',
          suggestion: 'Try checking the token symbol or searching for a different token',
          retryable: false
        };
      }

      // Network errors
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
          sessionId
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

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Blockchain Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-5rem)]">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              <p>👋 Hi! I can help you explore blockchain data.</p>
              <p className="mt-2">Try asking about token prices or market trends.</p>
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
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about token prices or trends (e.g., 'What is Bitcoin's price?')"
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