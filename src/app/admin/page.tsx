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
import { Payment, isSignupCollection } from '@/types/database';

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

  // Calculate stats for both collection types
  const paymentCollections = collections.filter(c => !isSignupCollection(c));
  const signupCollections = collections.filter(c => isSignupCollection(c));

  // Calculate real-time stats
  const stats = useRealtimeStats({
    collections: paymentCollections, // Only payment collections for financial stats
    paymentsCount: payments.length,
  });

  // Additional signup stats
  const signupStats = {
    totalSignupCollections: signupCollections.length,
    activeSignupCollections: signupCollections.filter(c => c.is_active).length,
  };

  // Handle new payment notifications
  const handlePaymentNotificationShown = (payment: Payment) => {
    setLastActivity(`New payment of $${payment.amount.toFixed(2)} received`);
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
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Payment Notifications */}
      <PaymentNotificationManager
        newPayments={payments}
        onNotificationShown={handlePaymentNotificationShown}
      />

      {/* Welcome Section */}
      <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-text-primary mb-4 text-xl font-bold sm:text-2xl">Welcome Back!</h2>
            <div className="space-y-2">
              <p className="text-text-secondary text-sm sm:text-base">
                Welcome to the Empire Football Group management system.
              </p>
              <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                <span className="text-text-muted">
                  Logged in at: <span className="font-medium">{loginTime}</span>
                </span>
                <span className="flex items-center gap-1">
                  <div
                    className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}
                  />
                  <span className="text-text-muted">
                    {connectionStatus === 'connected' ? 'Real-time active' : 'Connecting...'}
                  </span>
                </span>
              </div>
              {lastActivity && (
                <p className="text-text-secondary text-xs sm:text-sm">
                  <span className="font-medium">Last activity:</span> {lastActivity}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Enhanced for Both Collection Types */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Payment Collections Stats */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-text-secondary truncate text-sm font-medium">
                Payment Collections
              </p>
              <p className="text-text-primary text-2xl font-bold">{stats.totalCollections}</p>
              <p className="text-text-secondary text-xs sm:text-sm">
                {stats.activeCollections} active
              </p>
            </div>
            <div className="flex-shrink-0 text-blue-600 opacity-75">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        {/* Signup Collections Stats */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-text-secondary truncate text-sm font-medium">Signup Collections</p>
              <p className="text-text-primary text-2xl font-bold">
                {signupStats.totalSignupCollections}
              </p>
              <p className="text-text-secondary text-xs sm:text-sm">
                {signupStats.activeSignupCollections} active
              </p>
            </div>
            <div className="flex-shrink-0 text-green-600 opacity-75">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-text-secondary truncate text-sm font-medium">Total Revenue</p>
              <p className="text-text-primary text-2xl font-bold">
                ${stats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-text-secondary text-xs sm:text-sm">
                Across {paymentCollections.length} collection
                {paymentCollections.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex-shrink-0 text-green-600 opacity-75">
              <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-text-secondary truncate text-sm font-medium">Recent Payments</p>
              <p className="text-text-primary text-2xl font-bold">
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
      </div>

      {/* Quick Actions - Enhanced */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 xl:col-span-1 dark:border-gray-700">
          <h3 className="text-penn-red mb-3 text-sm font-semibold sm:mb-4 sm:text-lg">
            Quick Actions
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <Link
              href="/admin/collections/new"
              className="bg-penn-red hover:bg-lighter-red flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-center text-sm font-medium text-white transition-colors sm:py-2"
            >
              <span>💰</span>
              <span className="sm:hidden">New Payment Collection</span>
              <span className="hidden sm:inline">New Payment Collection</span>
            </Link>
            <Link
              href="/admin/collections/new"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-green-700 sm:py-2"
            >
              <span>📝</span>
              <span className="sm:hidden">New Signup Collection</span>
              <span className="hidden sm:inline">New Signup Collection</span>
            </Link>
            <Link
              href="/admin/collections"
              className="text-text-primary flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-3 text-center text-sm transition-colors hover:bg-gray-50 sm:py-2 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              <span className="sm:hidden">View All Collections</span>
              <span className="hidden sm:inline">View All Collections</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-4 lg:col-span-2">
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
              <div className="py-4 text-center">
                <p className="text-text-secondary text-sm">
                  {collectionsError ? 'Error loading data' : 'Loading payments...'}
                </p>
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-3">
                {payments.slice(0, 5).map(payment => {
                  const collection = collections.find(c => c.id === payment.collection_id);
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-text-primary text-sm font-medium">
                          {payment.payer_name || 'Anonymous'}
                        </p>
                        <p className="text-text-secondary text-xs">
                          {collection?.title || 'Unknown Collection'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          ${payment.amount.toFixed(2)}
                        </p>
                        <p className="text-text-muted text-xs">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {payments.length > 5 && (
                  <div className="text-center">
                    <Link
                      href="/admin/collections"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      View all payments →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 h-8 w-8 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </div>
                <p className="text-text-secondary text-sm">No recent payments</p>
                <p className="text-text-muted text-xs">
                  Payments will appear here when people pay through your collections
                </p>
              </div>
            )}
          </div>

          {/* Recent Collections */}
          <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-text-primary text-base font-semibold sm:text-lg">
                Recent Collections
              </h3>
              {collectionsLoading && (
                <div className="border-penn-red h-3 w-3 animate-spin rounded-full border-b-2 sm:h-4 sm:w-4" />
              )}
            </div>

            {collections.length > 0 ? (
              <div className="space-y-3">
                {collections.slice(0, 4).map(collection => (
                  <div
                    key={collection.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {isSignupCollection(collection) ? '📝' : '💰'}
                        </span>
                        <p className="text-text-primary truncate text-sm font-medium">
                          {collection.title}
                        </p>
                      </div>
                      <p className="text-text-secondary text-xs">
                        {isSignupCollection(collection)
                          ? 'Signup Collection'
                          : 'Payment Collection'}{' '}
                        •{collection.is_active ? ' Active' : ' Inactive'}
                      </p>
                    </div>
                    <div className="text-right">
                      {isSignupCollection(collection) ? (
                        <p className="text-sm font-medium text-green-600">Signups</p>
                      ) : (
                        <p className="text-sm font-medium text-green-600">
                          ${collection.current_amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-center">
                  <Link
                    href="/admin/collections"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    View all collections →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 h-8 w-8 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <p className="text-text-secondary text-sm">No collections yet</p>
                <p className="text-text-muted text-xs">
                  Create your first payment or signup collection to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
