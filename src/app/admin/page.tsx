'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRealtimeCollections } from '@/hooks/useRealtimeCollections'
import { useRealtimePayments } from '@/hooks/useRealtimePayments'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'
import { PaymentNotificationManager } from '@/components/PaymentNotificationManager'
import type { User } from '@supabase/supabase-js'

interface Payment {
  id: string
  amount: number
  payer_name?: string
  created_at: string
  status: string
}

interface Collection {
  id: string
  title: string
  current_amount: number
  target_amount?: number
  is_active: boolean
}

type ConnectionStatus = 'connected' | 'connecting'

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loginTime] = useState(new Date().toLocaleString())
  const [lastActivity, setLastActivity] = useState<string>('')

  const supabase = createClient()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // Real-time hooks
  const {
    collections,
    isLoading: collectionsLoading,
    error: collectionsError,
    isConnected: collectionsConnected,
  } = useRealtimeCollections({
    userId: user?.id,
    enabled: !!user?.id,
  })

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
  })

  // Calculate real-time stats
  const stats = useRealtimeStats({
    collections,
    paymentsCount: payments.length,
  })

  // Handle new payment notifications
  const handlePaymentNotificationShown = (payment: Payment) => {
    setLastActivity(`New payment of $${payment.amount.toFixed(2)} received`)
    // Clear the new payment count after showing notification
    setTimeout(() => {
      clearNewPaymentCount()
    }, 1000)
  }

  const connectionStatus: ConnectionStatus = collectionsConnected && paymentsConnected ? 'connected' : 'connecting'

  if (!user) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="border-penn-red h-6 w-6 animate-spin rounded-full border-b-2"></div>
        <span className="text-text-primary ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Notifications */}
      <PaymentNotificationManager
        newPayments={payments}
        onNotificationShown={handlePaymentNotificationShown}
      />

      {/* Welcome Section */}
      <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-text-primary mb-4 text-2xl font-bold">Welcome Back!</h2>
            <div className="space-y-2">
              <p className="text-text-secondary">
                Welcome to the Empire Football Group payment management system.
              </p>
              <p className="text-text-secondary">
                Logged in as: <span className="font-medium">{user.email}</span>
              </p>
              <p className="text-text-muted text-sm">Session started: {loginTime}</p>
              {lastActivity && <p className="text-sm text-green-600">Latest: {lastActivity}</p>}
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div
              className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            <span className="text-text-muted text-xs">
              {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-penn-red mb-2 text-lg font-semibold">Total Collections</h3>
              <p className="text-text-primary text-3xl font-bold">
                {collectionsLoading ? '...' : stats.totalCollections}
              </p>
              <p className="text-text-secondary text-sm">
                {collectionsLoading ? '...' : stats.activeCollections} active
              </p>
            </div>
            <div className="text-penn-red opacity-75">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
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

        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-penn-red mb-2 text-lg font-semibold">Total Raised</h3>
              <p className="text-text-primary text-3xl font-bold">
                {collectionsLoading ? '...' : `$${stats.totalRaised.toFixed(2)}`}
              </p>
              <p className="text-text-secondary text-sm">Across all collections</p>
            </div>
            <div className="text-green-600 opacity-75">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
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

        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-penn-red mb-2 text-lg font-semibold">Recent Payments</h3>
              <p className="text-text-primary text-3xl font-bold">
                {paymentsLoading ? '...' : payments.length}
              </p>
              <p className="text-text-secondary text-sm">
                {newPaymentCount > 0 && (
                  <span className="font-medium text-green-600">+{newPaymentCount} new</span>
                )}
                {newPaymentCount === 0 && 'Last 10 payments'}
              </p>
            </div>
            <div className="text-blue-600 opacity-75">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/admin/collections/new"
              className="bg-penn-red hover:bg-lighter-red block w-full rounded-md px-4 py-2 text-center text-sm text-white transition-colors"
            >
              New Collection
            </Link>
            <Link
              href="/admin/collections"
              className="text-text-primary block w-full rounded-md border border-gray-300 px-4 py-2 text-center text-sm transition-colors hover:bg-gray-50"
            >
              View Collections
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-text-primary text-lg font-semibold">Recent Payments</h3>
            {paymentsLoading && (
              <div className="border-penn-red h-4 w-4 animate-spin rounded-full border-b-2" />
            )}
          </div>

          {collectionsError || paymentsLoading ? (
            <div className="py-8 text-center">
              {collectionsError && <p className="text-sm text-red-600">{collectionsError}</p>}
              {paymentsLoading && <p className="text-text-muted text-sm">Loading payments...</p>}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-text-muted text-sm">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment: Payment) => (
                <div
                  key={payment.id}
                  className="bg-background flex items-center justify-between rounded-md p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary truncate text-sm font-medium">
                      {payment.payer_name || 'Anonymous'}
                    </p>
                    <p className="text-text-muted text-xs">
                      {new Date(payment.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${payment.amount.toFixed(2)}</p>
                    <p className="text-text-muted text-xs capitalize">{payment.status}</p>
                  </div>
                </div>
              ))}

              {payments.length > 5 && (
                <div className="pt-2 text-center">
                  <Link
                    href="/admin/payments"
                    className="text-penn-red hover:text-lighter-red text-sm font-medium"
                  >
                    View all payments →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Collections Summary */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-text-primary text-lg font-semibold">Active Collections</h3>
            {collectionsLoading && (
              <div className="border-penn-red h-4 w-4 animate-spin rounded-full border-b-2" />
            )}
          </div>

          {collectionsError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-red-600">{collectionsError}</p>
            </div>
          ) : collectionsLoading ? (
            <div className="py-8 text-center">
              <p className="text-text-muted text-sm">Loading collections...</p>
            </div>
          ) : collections.filter((c: Collection) => c.is_active).length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-text-muted text-sm">No active collections</p>
              <Link
                href="/admin/collections/new"
                className="text-penn-red hover:text-lighter-red mt-2 inline-block text-sm font-medium"
              >
                Create your first collection →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {collections
                .filter((c: Collection) => c.is_active)
                .slice(0, 3)
                .map((collection: Collection) => {
                  const progress = collection.target_amount
                    ? (collection.current_amount / collection.target_amount) * 100
                    : 0

                  return (
                    <div key={collection.id} className="bg-background rounded-md p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="text-text-primary flex-1 truncate text-sm font-medium">
                          {collection.title}
                        </h4>
                        <span className="ml-2 text-sm font-semibold text-green-600">
                          ${collection.current_amount.toFixed(2)}
                        </span>
                      </div>

                      {collection.target_amount && (
                        <>
                          <div className="text-text-muted mb-1 flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                              className="bg-penn-red h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}

              {collections.filter((c: Collection) => c.is_active).length > 3 && (
                <div className="pt-2 text-center">
                  <Link
                    href="/admin/collections"
                    className="text-penn-red hover:text-lighter-red text-sm font-medium"
                  >
                    View all collections →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}