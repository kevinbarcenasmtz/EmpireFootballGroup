'use client';

import { useState, useEffect } from 'react';
import { PaymentCollection } from '@/types/database';
import { toggleCollectionStatus, deleteCollection } from './actions';
import { useRealtimePayments } from '@/hooks/useRealtimePayments';

interface CollectionCardProps {
  collection: PaymentCollection;
  userId?: string;
}

export function CollectionCard({ collection, userId }: CollectionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localCollection, setLocalCollection] = useState(collection);
  const [recentPaymentAnimation, setRecentPaymentAnimation] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>('');

  // Real-time payments for this specific collection
  const { payments, newPaymentCount, clearNewPaymentCount, isConnected } = useRealtimePayments({
    collectionId: collection.id,
    userId: userId,
    enabled: !!userId,
    limit: 5,
  });

  // Update local collection state when prop changes (from realtime updates)
  useEffect(() => {
    setLocalCollection(collection);
  }, [collection]);

  // Animate when new payments come in
  useEffect(() => {
    if (newPaymentCount > 0) {
      setRecentPaymentAnimation(true);
      const timer = setTimeout(() => {
        setRecentPaymentAnimation(false);
        clearNewPaymentCount();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [newPaymentCount, clearNewPaymentCount]);

  const paymentUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/pay/${localCollection.slug}` : '';

  const handleToggleStatus = async () => {
    setIsLoading(true);
    const result = await toggleCollectionStatus(localCollection.id, !localCollection.is_active);
    if (result.success) {
      setLocalCollection(prev => ({ ...prev, is_active: !prev.is_active }));
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      setIsLoading(true);
      await deleteCollection(localCollection.id);
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (e: unknown) {
      console.log((e as Error).message);
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const progress = localCollection.target_amount
    ? (localCollection.current_amount / localCollection.target_amount) * 100
    : 0;

  const recentPayment = payments[0]; // Most recent payment
  const totalPayments = payments.length;

  return (
    <div
      className={`bg-contrast w-full rounded-lg border border-gray-200 p-4 shadow-sm transition-all duration-300 sm:p-6 dark:border-gray-700 ${
        recentPaymentAnimation ? 'ring-opacity-50 shadow-lg ring-2 ring-green-500' : ''
      }`}
    >
      {/* Header - Enhanced Mobile Layout */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start gap-2">
            <h3 className="text-text-primary text-base leading-tight font-semibold break-words sm:text-lg">
              {localCollection.title}
            </h3>
            {/* Real-time indicator - Mobile optimized */}
            {isConnected && (
              <div className="mt-1 flex flex-shrink-0 items-center">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              </div>
            )}
          </div>
          {localCollection.description && (
            <p className="text-text-secondary text-sm leading-relaxed break-words sm:text-base">
              {localCollection.description}
            </p>
          )}
        </div>

        {/* Status Badges - Mobile Enhanced */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:flex-col sm:items-end">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap sm:text-sm ${
              localCollection.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
            }`}
          >
            {localCollection.is_active ? 'Active' : 'Inactive'}
          </span>
          {newPaymentCount > 0 && (
            <span className="bg-penn-red animate-bounce rounded-full px-2 py-1 text-xs font-medium text-white sm:text-sm">
              +{newPaymentCount}
            </span>
          )}
        </div>
      </div>

      {/* Progress Section - Mobile Enhanced */}
      <div className="mb-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-text-secondary text-sm font-medium">Amount Collected</span>
          <div
            className={`text-text-primary text-lg font-bold transition-all duration-300 sm:text-xl ${
              recentPaymentAnimation ? 'scale-105 text-green-600' : ''
            }`}
          >
            <span className="block sm:inline">${localCollection.current_amount.toFixed(2)}</span>
            {localCollection.target_amount && (
              <span className="text-text-secondary text-sm font-normal sm:text-base">
                {' '}
                of ${localCollection.target_amount.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar - Enhanced for Mobile */}
        {localCollection.target_amount && (
          <div className="mb-3">
            <div className="h-3 w-full rounded-full bg-gray-200 sm:h-2 dark:bg-gray-700">
              <div
                className={`h-3 rounded-full transition-all duration-500 sm:h-2 ${
                  recentPaymentAnimation ? 'bg-green-500' : 'bg-penn-red'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <div className="text-text-muted flex justify-between text-xs sm:text-sm">
              <span>{Math.round(progress)}% Complete</span>
              <span>
                ${(localCollection.target_amount - localCollection.current_amount).toFixed(2)}{' '}
                remaining
              </span>
            </div>
          </div>
        )}

        {/* Payment Stats - Mobile Optimized */}
        <div className="text-text-muted flex flex-col gap-1 text-xs sm:flex-row sm:justify-between sm:text-sm">
          <span className="font-medium">
            {totalPayments} payment{totalPayments !== 1 ? 's' : ''}
          </span>
          {recentPayment && (
            <span className="truncate">
              Latest: ${recentPayment.amount.toFixed(2)} •{' '}
              {new Date(recentPayment.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Recent Payment Highlight - Mobile Enhanced */}
      {recentPayment && recentPaymentAnimation && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              New payment: ${recentPayment.amount.toFixed(2)}
              {recentPayment.payer_name && (
                <span className="block text-xs font-normal sm:ml-1 sm:inline">
                  from {recentPayment.payer_name}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Payment Link - Mobile Optimized */}
      <div className="mb-4 rounded-lg bg-gray-50 p-3 sm:p-4 dark:bg-gray-800">
        <p className="text-text-secondary mb-2 text-xs font-medium sm:text-sm">Payment Link:</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
          <div className="min-w-0 flex-1">
            <code className="text-text-primary block w-full rounded-md bg-white p-2 text-xs leading-relaxed break-all sm:p-3 sm:text-sm dark:bg-gray-900">
              {paymentUrl}
            </code>
          </div>
          <button
            onClick={handleCopyLink}
            className="bg-penn-red flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 active:bg-red-800 sm:px-3 sm:py-2 sm:text-xs sm:whitespace-nowrap"
          >
            {copyFeedback ? (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {copyFeedback}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="sm:hidden">Copy Link</span>
                <span className="hidden sm:inline">Copy</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Recent Payments List - Mobile Enhanced */}
      {payments.length > 0 && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 sm:p-4 dark:bg-blue-900/20">
          <p className="text-text-secondary mb-3 text-xs font-medium sm:text-sm">
            Recent Payments:
          </p>
          <div className="space-y-2 sm:space-y-1">
            {payments.slice(0, 3).map(payment => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-2 rounded-md bg-white p-2 sm:bg-transparent sm:p-1 dark:bg-gray-800 sm:dark:bg-transparent"
              >
                <span className="text-text-primary min-w-0 flex-1 truncate text-sm font-medium sm:text-xs">
                  {payment.payer_name || 'Anonymous'}
                </span>
                <span className="text-sm font-bold text-green-600 sm:text-xs">
                  ${payment.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {payments.length > 3 && (
              <p className="text-text-muted text-center text-xs font-medium sm:text-left">
                +{payments.length - 3} more payment{payments.length - 3 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
        <button
          onClick={handleToggleStatus}
          disabled={isLoading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 sm:py-2 ${
            localCollection.is_active
              ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
          }`}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>{localCollection.is_active ? 'Deactivating...' : 'Activating...'}</span>
            </>
          ) : (
            <span>{localCollection.is_active ? 'Deactivate' : 'Activate'}</span>
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-md bg-red-100 px-4 py-3 text-sm font-medium text-red-800 transition-colors hover:bg-red-200 active:bg-red-300 disabled:opacity-50 sm:flex-shrink-0 sm:py-2 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Delete</span>
            </>
          )}
        </button>
      </div>

      {/* Footer - Mobile Enhanced */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-text-muted text-xs sm:text-sm">
          Created {new Date(localCollection.created_at).toLocaleDateString()}
        </p>
        {isConnected && (
          <div className="flex items-center gap-1 text-xs text-green-600 sm:text-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
            <span className="font-medium">Live Updates</span>
          </div>
        )}
      </div>
    </div>
  );
}
