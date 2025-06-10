'use client'

import { useState, useEffect } from 'react'
import { PaymentCollection } from '@/types/database'
import { toggleCollectionStatus, deleteCollection } from './actions'
import { useRealtimePayments } from '@/hooks/useRealtimePayments'

interface CollectionCardProps {
  collection: PaymentCollection
  userId?: string
}

export function CollectionCard({ collection, userId }: CollectionCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [localCollection, setLocalCollection] = useState(collection)
  const [recentPaymentAnimation, setRecentPaymentAnimation] = useState(false)
  
  // Real-time payments for this specific collection
  const {
    payments,
    newPaymentCount,
    clearNewPaymentCount,
    isConnected
  } = useRealtimePayments({
    collectionId: collection.id,
    userId: userId,
    enabled: !!userId,
    limit: 5
  })

  // Update local collection state when prop changes (from realtime updates)
  useEffect(() => {
    setLocalCollection(collection)
  }, [collection])

  // Animate when new payments come in
  useEffect(() => {
    if (newPaymentCount > 0) {
      setRecentPaymentAnimation(true)
      const timer = setTimeout(() => {
        setRecentPaymentAnimation(false)
        clearNewPaymentCount()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [newPaymentCount, clearNewPaymentCount])
  
  const paymentUrl = `${window.location.origin}/pay/${localCollection.slug}`
  
  const handleToggleStatus = async () => {
    setIsLoading(true)
    const result = await toggleCollectionStatus(localCollection.id, !localCollection.is_active)
    if (result.success) {
      setLocalCollection(prev => ({ ...prev, is_active: !prev.is_active }))
    }
    setIsLoading(false)
  }
  
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      setIsLoading(true)
      await deleteCollection(localCollection.id)
      setIsLoading(false)
    }
  }
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl)
    // Show temporary feedback
    const button = document.querySelector(`#copy-btn-${localCollection.id}`)
    if (button) {
      const originalText = button.textContent
      button.textContent = 'Copied!'
      setTimeout(() => {
        button.textContent = originalText
      }, 1500)
    }
  }

  const progress = localCollection.target_amount 
    ? (localCollection.current_amount / localCollection.target_amount) * 100 
    : 0

  const recentPayment = payments[0] // Most recent payment
  const totalPayments = payments.length

  return (
    <div className={`
      bg-contrast rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm dark:border-gray-700 w-full
      transition-all duration-300
      ${recentPaymentAnimation ? 'ring-2 ring-green-500 ring-opacity-50 shadow-lg' : ''}
    `}>
      {/* Header - Responsive layout */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-text-primary font-semibold text-base sm:text-lg break-words">
              {localCollection.title}
            </h3>
            {/* Real-time indicator */}
            {isConnected && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          {localCollection.description && (
            <p className="text-text-secondary text-sm break-words">
              {localCollection.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 self-start">
          <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
            localCollection.is_active 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
          }`}>
            {localCollection.is_active ? 'Active' : 'Inactive'}
          </span>
          {newPaymentCount > 0 && (
            <span className="px-2 py-1 text-xs rounded-full bg-penn-red text-white animate-bounce">
              +{newPaymentCount}
            </span>
          )}
        </div>
      </div>

      {/* Progress section with real-time updates */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">Collected</span>
          <span className={`text-text-primary font-medium text-right transition-all duration-300 ${
            recentPaymentAnimation ? 'text-green-600 scale-110' : ''
          }`}>
            <span className="block sm:inline">
              ${localCollection.current_amount.toFixed(2)}
            </span>
            {localCollection.target_amount && (
              <span className="text-text-secondary block sm:inline">
                {' '}/ ${localCollection.target_amount.toFixed(2)}
              </span>
            )}
          </span>
        </div>
        {localCollection.target_amount && (
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                recentPaymentAnimation ? 'bg-green-500' : 'bg-penn-red'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}
        
        {/* Payment stats */}
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span>{totalPayments} payment{totalPayments !== 1 ? 's' : ''}</span>
          {recentPayment && (
            <span>
              Last: ${recentPayment.amount.toFixed(2)} • {new Date(recentPayment.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Recent payment highlight */}
      {recentPayment && recentPaymentAnimation && (
        <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-green-800 dark:text-green-200">
              New payment: ${recentPayment.amount.toFixed(2)}
              {recentPayment.payer_name && ` from ${recentPayment.payer_name}`}
            </span>
          </div>
        </div>
      )}

      {/* Payment link - Mobile responsive */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <p className="text-text-secondary text-xs mb-1">Payment Link:</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <code className="text-text-primary text-xs flex-1 break-all sm:truncate bg-white dark:bg-gray-900 p-1 rounded">
            {paymentUrl}
          </code>
          <button
            id={`copy-btn-${localCollection.id}`}
            onClick={handleCopyLink}
            className="text-penn-red hover:text-lighter-red text-xs font-medium self-start sm:self-auto whitespace-nowrap transition-colors"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Recent payments list (if any) */}
      {payments.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-text-secondary text-xs mb-2">Recent Payments:</p>
          <div className="space-y-1">
            {payments.slice(0, 3).map((payment) => (
              <div key={payment.id} className="flex justify-between text-xs">
                <span className="text-text-primary truncate">
                  {payment.payer_name || 'Anonymous'}
                </span>
                <span className="text-green-600 font-medium ml-2">
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
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors disabled:opacity-50 ${
            localCollection.is_active
              ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
              {localCollection.is_active ? 'Deactivating...' : 'Activating...'}
            </div>
          ) : (
            localCollection.is_active ? 'Deactivate' : 'Activate'
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="px-3 py-2 text-sm bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 rounded-md transition-colors disabled:opacity-50 sm:flex-shrink-0"
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <div className="flex justify-between items-center mt-3">
        <p className="text-text-muted text-xs text-center sm:text-left">
          Created {new Date(localCollection.created_at).toLocaleDateString()}
        </p>
        {isConnected && (
          <div className="flex items-center text-xs text-green-600">
            <div className="w-1 h-1 bg-green-500 rounded-full mr-1"></div>
            Live
          </div>
        )}
      </div>
    </div>
  )
}