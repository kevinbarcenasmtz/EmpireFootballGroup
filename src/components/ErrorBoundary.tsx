// src/components/ErrorBoundary.tsx
'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error reporting service integration here
      // Example: Sentry, LogRocket, etc.
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="bg-contrast rounded-lg border border-gray-200 p-8 text-center shadow-sm dark:border-gray-700">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-text-primary text-xl font-bold mb-4">
            Something went wrong
          </h2>
          <div className="text-left bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800 text-sm font-medium mb-2">Error Details:</p>
            <p className="text-red-700 text-sm font-mono">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
          </div>
          <div className="space-y-2 mb-4">
            <button
              onClick={this.handleRetry}
              className="bg-penn-red hover:bg-lighter-red text-white px-6 py-2 rounded-md transition-colors mr-2"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="border border-gray-300 text-text-primary px-6 py-2 rounded-md transition-colors hover:bg-gray-50"
            >
              Refresh Page
            </button>
          </div>
          <p className="text-text-muted text-xs">
            If this problem persists, please contact support
          </p>
        </div>
      )
    }

    return this.props.children
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
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}