'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRealtimeCollections } from '@/hooks/useRealtimeCollections';
import { useRealtimePayments } from '@/hooks/useRealtimePayments';
import { useRealtimeStats } from '@/hooks/useRealtimeStats';
import { PaymentNotificationManager } from '@/components/PaymentNotificationManager';
import { Payment } from '@/types/database'; // Adjust path as needed

type ConnectionStatus = 'connected' | 'connecting';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginTime] = useState(new Date().toLocaleTimeString());
  const [lastActivity, setLastActivity] = useState<string>('');
  const router = useRouter();

  // Real-time hooks
  const {
    collections,
    isLoading: collectionsLoading,
    error: collectionsError,
    isConnected: collectionsConnected,
  } = useRealtimeCollections({
    userId: user?.id,
    enabled: !!user?.id,
  });

  const {
    payments,
    isLoading: paymentsLoading,
    newPaymentCount,
    clearNewPaymentCount,
    isConnected: paymentsConnected,
  } = useRealtimePayments({
    userId: user?.id,
    enabled: !!user?.id,
    limit: 10,
  });

  // Calculate real-time stats
  const stats = useRealtimeStats({
    collections,
    paymentsCount: payments.length,
  });

  // Handle new payment notifications
  const handlePaymentNotificationShown = (payment: Payment) => {
    setLastActivity(`New payment of $${payment.amount.toFixed(2)} received`);
    // Clear the new payment count after showing notification
    setTimeout(() => {
      clearNewPaymentCount();
    }, 1000);
  };

  const connectionStatus: ConnectionStatus =
    collectionsConnected && paymentsConnected ? 'connected' : 'connecting';

  // Auth state management
  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);

      if (!user) {
        router.push('/login');
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        router.push('/login');
      } else {
        setUser(session.user);
        setIsLoading(false);

        // Set access token cookie for RLS
        if (session.access_token) {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; secure; samesite=strict`;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[150px] items-center justify-center sm:min-h-[200px]">
        <div className="flex items-center space-x-3">
          <div className="border-penn-red h-5 w-5 animate-spin rounded-full border-b-2 sm:h-6 sm:w-6"></div>
          <span className="text-text-primary text-sm sm:text-base">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Payment Notifications */}
      <PaymentNotificationManager
        newPayments={payments}
        onNotificationShown={handlePaymentNotificationShown}
      />

      {/* Welcome Section - Mobile Optimized */}
      <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-text-primary mb-4 text-xl font-bold sm:text-2xl">Welcome Back!</h2>
            <div className="space-y-2">
              <p className="text-text-secondary text-sm sm:text-base">
                Welcome to the Empire Football Group payment management system.
              </p>
              <p className="text-text-secondary text-sm sm:text-base">
                Logged in as: <span className="font-medium">{user.email}</span>
              </p>
              <p className="text-text-muted text-xs sm:text-sm">Session started: {loginTime}</p>
              {lastActivity && (
                <p className="text-xs text-green-600 sm:text-sm">Latest: {lastActivity}</p>
              )}
            </div>
          </div>

          {/* Connection Status - Mobile optimized */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <div
              className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            <span className="text-text-muted text-xs whitespace-nowrap">
              {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Stats - Progressive Grid Layout */}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {/* Total Collections Card */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-penn-red mb-2 text-sm font-semibold sm:text-lg">
                Total Collections
              </h3>
              <p className="text-text-primary text-2xl font-bold sm:text-3xl">
                {collectionsLoading ? '...' : stats.totalCollections}
              </p>
              <p className="text-text-secondary text-xs sm:text-sm">
                {collectionsLoading ? '...' : stats.activeCollections} active
              </p>
            </div>
            <div className="text-penn-red flex-shrink-0 opacity-75">
              <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path
                  fillRule="evenodd"
                  d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Raised Card */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-penn-red mb-2 text-sm font-semibold sm:text-lg">Total Raised</h3>
              <p className="text-text-primary text-2xl font-bold sm:text-3xl">
                {collectionsLoading ? '...' : `$${stats.totalRaised.toFixed(2)}`}
              </p>
              <p className="text-text-secondary text-xs sm:text-sm">Across all collections</p>
            </div>
            <div className="flex-shrink-0 text-green-600 opacity-75">
              <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Payments Card */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-penn-red mb-2 text-sm font-semibold sm:text-lg">
                Recent Payments
              </h3>
              <p className="text-text-primary text-2xl font-bold sm:text-3xl">
                {paymentsLoading ? '...' : payments.length}
              </p>
              <p className="text-text-secondary text-xs sm:text-sm">
                {newPaymentCount > 0 && (
                  <span className="font-medium text-green-600">+{newPaymentCount} new</span>
                )}
                {newPaymentCount === 0 && 'Last 10 payments'}
              </p>
            </div>
            <div className="flex-shrink-0 text-blue-600 opacity-75">
              <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Quick Actions Card - Enhanced for Mobile */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 xl:col-span-1 dark:border-gray-700">
          <h3 className="text-penn-red mb-3 text-sm font-semibold sm:mb-2 sm:text-lg">
            Quick Actions
          </h3>
          <div className="space-y-3 sm:space-y-2">
            <Link
              href="/admin/collections/new"
              className="bg-penn-red hover:bg-lighter-red flex w-full items-center justify-center rounded-md px-4 py-3 text-center text-sm font-medium text-white transition-colors sm:py-2"
            >
              <span className="sm:hidden">+ New Collection</span>
              <span className="hidden sm:inline">New Collection</span>
            </Link>
            <Link
              href="/admin/collections"
              className="text-text-primary flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-3 text-center text-sm transition-colors hover:bg-gray-50 sm:py-2 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              <span className="sm:hidden">View All</span>
              <span className="hidden sm:inline">View Collections</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed - Mobile Optimized */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-text-primary text-base font-semibold sm:text-lg">
              Recent Payments
            </h3>
            {paymentsLoading && (
              <div className="border-penn-red h-3 w-3 animate-spin rounded-full border-b-2 sm:h-4 sm:w-4" />
            )}
          </div>

          {collectionsError || paymentsLoading ? (
            <div className="py-8 text-center">
              {collectionsError && (
                <p className="text-xs text-red-600 sm:text-sm">{collectionsError}</p>
              )}
              {paymentsLoading && (
                <p className="text-text-muted text-xs sm:text-sm">Loading payments...</p>
              )}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-text-muted text-xs sm:text-sm">No payments yet</p>
              <p className="text-text-muted mt-1 text-xs">Payments will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {payments.map((payment, index) => (
                <div
                  key={payment.id}
                  className={`rounded-lg border p-3 sm:p-4 ${
                    index < newPaymentCount
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm font-medium sm:text-base">
                        {payment.payer_name || 'Anonymous'}
                      </p>
                      <p className="text-text-muted text-xs sm:text-sm">
                        {new Date(payment.created_at).toLocaleDateString()} at{' '}
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-primary text-sm font-bold sm:text-base">
                        ${payment.amount.toFixed(2)}
                      </p>
                      {index < newPaymentCount && (
                        <span className="text-xs text-green-600">New!</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collections Overview */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-text-primary text-base font-semibold sm:text-lg">
              Active Collections
            </h3>
            {collectionsLoading && (
              <div className="border-penn-red h-3 w-3 animate-spin rounded-full border-b-2 sm:h-4 sm:w-4" />
            )}
          </div>

          {collectionsError || collectionsLoading ? (
            <div className="py-8 text-center">
              {collectionsError && (
                <p className="text-xs text-red-600 sm:text-sm">{collectionsError}</p>
              )}
              {collectionsLoading && (
                <p className="text-text-muted text-xs sm:text-sm">Loading collections...</p>
              )}
            </div>
          ) : collections.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-text-muted text-xs sm:text-sm">No collections yet</p>
              <Link
                href="/admin/collections/new"
                className="text-penn-red hover:text-lighter-red mt-2 inline-block text-xs underline sm:text-sm"
              >
                Create your first collection
              </Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {collections.slice(0, 5).map(collection => (
                <div
                  key={collection.id}
                  className="rounded-lg border border-gray-200 p-3 sm:p-4 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm font-medium sm:text-base">
                        {collection.title}
                      </p>
                      <p className="text-text-muted text-xs sm:text-sm">
                        {collection.target_amount
                          ? `$${collection.current_amount.toFixed(2)} of $${collection.target_amount.toFixed(2)}`
                          : `$${collection.current_amount.toFixed(2)} raised`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          collection.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                      >
                        {collection.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {collections.length > 5 && (
                <Link
                  href="/admin/collections"
                  className="text-penn-red hover:text-lighter-red block text-center text-xs underline sm:text-sm"
                >
                  View all {collections.length} collections
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
