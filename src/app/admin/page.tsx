'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRealtimeCollections } from '@/hooks/useRealtimeCollections'
import { useRealtimePayments } from '@/hooks/useRealtimePayments'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'
import { PaymentNotificationManager } from '@/components/PaymentNotificationManager'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
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
    isConnected: collectionsConnected
  } = useRealtimeCollections({
    userId: user?.id,
    enabled: !!user?.id
  })

  const {
    payments,
    isLoading: paymentsLoading,
    newPaymentCount,
    clearNewPaymentCount,
    isConnected: paymentsConnected
  } = useRealtimePayments({
    userId: user?.id,
    enabled: !!user?.id,
    limit: 10
  })

  // Calculate real-time stats
  const stats = useRealtimeStats({
    collections,
    paymentsCount: payments.length
  })

  // Handle new payment notifications
  const handlePaymentNotificationShown = (payment: any) => {
    setLastActivity(`New payment of $${payment.amount.toFixed(2)} received`)
    // Clear the new payment count after showing notification
    setTimeout(() => {
      clearNewPaymentCount()
    }, 1000)
  }

  const connectionStatus = collectionsConnected && paymentsConnected ? 'connected' : 'connecting'

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-penn-red"></div>
        <span className="ml-2 text-text-primary">Loading dashboard...</span>
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
              <p className="text-text-muted text-sm">
                Session started: {loginTime}
              </p>
              {lastActivity && (
                <p className="text-green-600 text-sm">
                  Latest: {lastActivity}
                </p>
              )}
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-xs text-text-muted">
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
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
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
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd"/>
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
                  <span className="text-green-600 font-medium">
                    +{newPaymentCount} new
                  </span>
                )}
                {newPaymentCount === 0 && 'Last 10 payments'}
              </p>
            </div>
            <div className="text-blue-600 opacity-75">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Quick Actions</h3>
          <div className="space-y-2">
            <Link 
              href="/admin/collections/new"
              className="block w-full bg-penn-red hover:bg-lighter-red text-white text-center py-2 px-4 rounded-md transition-colors text-sm"
            >
              New Collection
            </Link>
            <Link 
              href="/admin/collections"
              className="block w-full border border-gray-300 text-text-primary text-center py-2 px-4 rounded-md hover:bg-gray-50 transition-colors text-sm"
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-primary text-lg font-semibold">Recent Payments</h3>
            {paymentsLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-penn-red"></div>
            )}
          </div>

          {collectionsError || paymentsLoading ? (
            <div className="text-center py-8">
              {collectionsError && (
                <p className="text-red-600 text-sm">{collectionsError}</p>
              )}
              {paymentsLoading && (
                <p className="text-text-muted text-sm">Loading payments...</p>
              )}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-background rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-medium text-sm truncate">
                      {payment.payer_name || 'Anonymous'}
                    </p>
                    <p className="text-text-muted text-xs">
                      {new Date(payment.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-semibold">
                      ${payment.amount.toFixed(2)}
                    </p>
                    <p className="text-text-muted text-xs capitalize">
                      {payment.status}
                    </p>
                  </div>
                </div>
              ))}
              
              {payments.length > 5 && (
                <div className="text-center pt-2">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-primary text-lg font-semibold">Active Collections</h3>
            {collectionsLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-penn-red"></div>
            )}
          </div>

          {collectionsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 text-sm">{collectionsError}</p>
            </div>
          ) : collectionsLoading ? (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">Loading collections...</p>
            </div>
          ) : collections.filter(c => c.is_active).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">No active collections</p>
              <Link 
                href="/admin/collections/new"
                className="text-penn-red hover:text-lighter-red text-sm font-medium mt-2 inline-block"
              >
                Create your first collection →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {collections.filter(c => c.is_active).slice(0, 3).map((collection) => {
                const progress = collection.target_amount 
                  ? (collection.current_amount / collection.target_amount) * 100 
                  : 0

                return (
                  <div key={collection.id} className="p-3 bg-background rounded-md">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-text-primary font-medium text-sm truncate flex-1">
                        {collection.title}
                      </h4>
                      <span className="text-green-600 font-semibold text-sm ml-2">
                        ${collection.current_amount.toFixed(2)}
                      </span>
                    </div>
                    
                    {collection.target_amount && (
                      <>
                        <div className="flex justify-between text-xs text-text-muted mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-penn-red h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
              
              {collections.filter(c => c.is_active).length > 3 && (
                <div className="text-center pt-2">
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