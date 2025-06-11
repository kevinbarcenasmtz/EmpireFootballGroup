// src/app/pay/[slug]/PaymentPageClient.tsx
'use client';

import React from 'react';
import PaymentForm from './PaymentForm';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PaymentCollection } from '@/types/database';

interface PaymentPageClientProps {
  collection: PaymentCollection;
}

export default function PaymentPageClient({ collection }: PaymentPageClientProps) {
  const progress = collection.target_amount
    ? (collection.current_amount / collection.target_amount) * 100
    : 0;

  const handlePaymentError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Payment form error:', error, errorInfo);

    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service
      // Example: Sentry.captureException(error, { extra: errorInfo })
    }
  };

  return (
    <div className="bg-background min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Collection Info */}
        <div className="bg-contrast mb-6 rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <h1 className="text-text-primary mb-4 text-2xl font-bold">{collection.title}</h1>

          {collection.description && (
            <p className="text-text-secondary mb-4">{collection.description}</p>
          )}

          {/* Progress Display */}
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-text-secondary">Raised so far</span>
              <span className="text-text-primary font-medium">
                ${collection.current_amount.toFixed(2)}
                {collection.target_amount && (
                  <span className="text-text-secondary">
                    {' '}
                    / ${collection.target_amount.toFixed(2)}
                  </span>
                )}
              </span>
            </div>

            {collection.target_amount && (
              <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="bg-penn-red h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Payment Form with Error Boundary */}
        <ErrorBoundary onError={handlePaymentError}>
          <PaymentForm collection={collection} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
