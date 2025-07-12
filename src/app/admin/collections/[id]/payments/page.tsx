'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PaymentCollection, Payment } from '@/types/database';
import { useRealtimePayments } from '@/hooks/useRealtimePayments';
import { getPayments } from '@/app/admin/collections/actions';

export default function PaymentsPage() {
  const params = useParams();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<PaymentCollection | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use real-time payments hook
  const {
    payments: realtimePayments,
    isConnected,
  } = useRealtimePayments({
    userId: collection?.admin_id,
    collectionId,
    enabled: !!collection?.admin_id,
    limit: 100,
  });

  const loadCollection = useCallback(async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('payment_collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      if (error || !data) {
        setError('Collection not found');
        return;
      }

      if (data.collection_type === 'signup') {
        setError('This is not a payment collection');
        return;
      }

      setCollection(data);
    } catch (err) {
      console.error('Error loading collection:', err);
      setError('Failed to load collection');
    }
  }, [collectionId]);

  const loadPayments = useCallback(async () => {
    if (!collection) return;

    try {
      const result = await getPayments(collectionId);
      if (result.error) {
        setError(result.error);
      } else {
        setPayments(result.payments || []);
      }
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  }, [collectionId, collection]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  useEffect(() => {
    if (collection) {
      loadPayments();
    }
  }, [collection, loadPayments]);

  // Update payments when real-time data changes
  useEffect(() => {
    if (realtimePayments.length > 0) {
      // Filter for completed payments only
      const completedPayments = realtimePayments.filter(p => p.status === 'completed');
      setPayments(completedPayments);
    }
  }, [realtimePayments]);

  // Calculate summary stats
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paymentCount = payments.length;

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="border-penn-red h-5 w-5 animate-spin rounded-full border-b-2 sm:h-6 sm:w-6"></div>
          <span className="text-text-primary text-sm sm:text-base">Loading payments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-text-primary mb-2 text-xl font-bold">Error</h1>
          <p className="text-text-secondary mb-4">{error}</p>
          <Link
            href="/admin/collections"
            className="bg-penn-red hover:bg-lighter-red inline-block rounded-md px-4 py-2 text-white transition-colors"
          >
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Link
            href="/admin/collections"
            className="text-text-secondary hover:text-text-primary flex items-center gap-1 text-sm transition-colors"
          >
            ← Back to Collections
          </Link>
        </div>

        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">💰</span>
              <h1 className="text-text-primary truncate text-xl font-bold sm:text-2xl">
                {collection.title}
              </h1>
            </div>
            {collection.description && (
              <p className="text-text-secondary text-sm sm:text-base">{collection.description}</p>
            )}
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-text-secondary text-xs">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="bg-contrast rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Total Revenue</p>
                <p className="text-text-primary text-2xl font-bold">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="text-green-500">
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-contrast rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Total Payments</p>
                <p className="text-text-primary text-2xl font-bold">{paymentCount}</p>
              </div>
              <div className="text-blue-500">
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {payments.length > 0 ? (
        <div className="bg-contrast overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6 dark:text-gray-400">
                    Payer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6 dark:text-gray-400">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6 dark:text-gray-400">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <div className="text-text-primary text-sm font-medium">
                        {payment.payer_name || 'Anonymous'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <div className="text-sm font-bold text-green-600">
                        ${payment.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <div className="text-text-secondary text-sm">
                        {new Date(payment.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <div className="text-text-secondary text-sm">
                        {payment.payer_email || 'Not provided'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-contrast rounded-lg border border-gray-200 p-8 text-center shadow-sm dark:border-gray-700">
          <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <h3 className="text-text-primary mb-2 text-lg font-medium">No payments yet</h3>
          <p className="text-text-secondary mb-4 text-sm">
            Payments will appear here once people start contributing to this collection.
          </p>
        </div>
      )}
    </div>
  );
}