// src/components/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error reporting service integration here
      // Example: Sentry, LogRocket, etc.
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="bg-contrast rounded-lg border border-gray-200 p-8 text-center shadow-sm dark:border-gray-700">
          <div className="mb-4 text-4xl text-red-600">⚠️</div>
          <h2 className="text-text-primary mb-4 text-xl font-bold">Something went wrong</h2>
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-left">
            <p className="mb-2 text-sm font-medium text-red-800">Error Details:</p>
            <p className="font-mono text-sm text-red-700">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
          </div>
          <div className="mb-4 space-y-2">
            <button
              onClick={this.handleRetry}
              className="bg-penn-red hover:bg-lighter-red mr-2 rounded-md px-6 py-2 text-white transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="text-text-primary rounded-md border border-gray-300 px-6 py-2 transition-colors hover:bg-gray-50"
            >
              Refresh Page
            </button>
          </div>
          <p className="text-text-muted text-xs">
            If this problem persists, please contact support
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
