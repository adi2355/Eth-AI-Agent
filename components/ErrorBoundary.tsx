"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-lg mx-auto my-8 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {process.env.NODE_ENV === 'development' 
                ? this.state.error?.message || 'An unexpected error occurred'
                : 'An unexpected error occurred. Our team has been notified.'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                {this.state.error.stack}
              </pre>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              size="sm"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Link href="/" passHref>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}