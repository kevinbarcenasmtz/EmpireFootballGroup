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

  const paymentUrl = `${window.location.origin}/pay/${localCollection.slug}`;

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    // Show temporary feedback
    const button = document.querySelector(`#copy-btn-${localCollection.id}`);
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1500);
    }
  };

  const progress = localCollection.target_amount
    ? (localCollection.current_amount / localCollection.target_amount) * 100
    : 0;

  const recentPayment = payments[0]; // Most recent payment
  const totalPayments = payments.length;

  return (
    <div
      className={`bg-contrast w-full rounded-lg border border-gray-200 p-4 shadow-sm transition-all duration-300 sm:p-6 dark:border-gray-700 ${recentPaymentAnimation ? 'ring-opacity-50 shadow-lg ring-2 ring-green-500' : ''} `}
    >
      {/* Header - Responsive layout */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-text-primary text-base font-semibold break-words sm:text-lg">
              {localCollection.title}
            </h3>
            {/* Real-time indicator */}
            {isConnected && (
              <div className="flex items-center">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              </div>
            )}
          </div>
          {localCollection.description && (
            <p className="text-text-secondary text-sm break-words">{localCollection.description}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 self-start">
          <span
            className={`rounded-full px-2 py-1 text-xs whitespace-nowrap ${
              localCollection.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
            }`}
          >
            {localCollection.is_active ? 'Active' : 'Inactive'}
          </span>
          {newPaymentCount > 0 && (
            <span className="bg-penn-red animate-bounce rounded-full px-2 py-1 text-xs text-white">
              +{newPaymentCount}
            </span>
          )}
        </div>
      </div>

      {/* Progress section with real-time updates */}
      <div className="mb-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-text-secondary">Collected</span>
          <span
            className={`text-text-primary text-right font-medium transition-all duration-300 ${
              recentPaymentAnimation ? 'scale-110 text-green-600' : ''
            }`}
          >
            <span className="block sm:inline">${localCollection.current_amount.toFixed(2)}</span>
            {localCollection.target_amount && (
              <span className="text-text-secondary block sm:inline">
                {' '}
                / ${localCollection.target_amount.toFixed(2)}
              </span>
            )}
          </span>
        </div>
        {localCollection.target_amount && (
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                recentPaymentAnimation ? 'bg-green-500' : 'bg-penn-red'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}

        {/* Payment stats */}
        <div className="text-text-muted mt-1 flex justify-between text-xs">
          <span>
            {totalPayments} payment{totalPayments !== 1 ? 's' : ''}
          </span>
          {recentPayment && (
            <span>
              Last: ${recentPayment.amount.toFixed(2)} •{' '}
              {new Date(recentPayment.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Recent payment highlight */}
      {recentPayment && recentPaymentAnimation && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center text-sm">
            <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span className="text-green-800 dark:text-green-200">
              New payment: ${recentPayment.amount.toFixed(2)}
              {recentPayment.payer_name && ` from ${recentPayment.payer_name}`}
            </span>
          </div>
        </div>
      )}

      {/* Payment link - Mobile responsive */}
      <div className="mb-4 rounded-md bg-gray-50 p-3 dark:bg-gray-800">
        <p className="text-text-secondary mb-1 text-xs">Payment Link:</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <code className="text-text-primary flex-1 rounded bg-white p-1 text-xs break-all sm:truncate dark:bg-gray-900">
            {paymentUrl}
          </code>
          <button
            id={`copy-btn-${localCollection.id}`}
            onClick={handleCopyLink}
            className="text-penn-red hover:text-lighter-red self-start text-xs font-medium whitespace-nowrap transition-colors sm:self-auto"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Recent payments list (if any) */}
      {payments.length > 0 && (
        <div className="mb-4 rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-text-secondary mb-2 text-xs">Recent Payments:</p>
          <div className="space-y-1">
            {payments.slice(0, 3).map(payment => (
              <div key={payment.id} className="flex justify-between text-xs">
                <span className="text-text-primary truncate">
                  {payment.payer_name || 'Anonymous'}
                </span>
                <span className="ml-2 font-medium text-green-600">
                  ${payment.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {payments.length > 3 && (
              <p className="text-text-muted text-xs">
                +{payments.length - 3} more payment{payments.length - 3 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions - Mobile responsive */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={handleToggleStatus}
          disabled={isLoading}
          className={`flex-1 rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
            localCollection.is_active
              ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="mr-1 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
              {localCollection.is_active ? 'Deactivating...' : 'Activating...'}
            </div>
          ) : localCollection.is_active ? (
            'Deactivate'
          ) : (
            'Activate'
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 transition-colors hover:bg-red-200 disabled:opacity-50 sm:flex-shrink-0 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-text-muted text-center text-xs sm:text-left">
          Created {new Date(localCollection.created_at).toLocaleDateString()}
        </p>
        {isConnected && (
          <div className="flex items-center text-xs text-green-600">
            <div className="mr-1 h-1 w-1 rounded-full bg-green-500"></div>
            Live
          </div>
        )}
      </div>
    </div>
  );
}
