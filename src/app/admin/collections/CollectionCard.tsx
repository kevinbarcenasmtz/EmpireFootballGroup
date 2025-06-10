'use client'

import { useState } from 'react'
import { PaymentCollection } from '@/types/database'
import { toggleCollectionStatus, deleteCollection } from './actions'

interface CollectionCardProps {
  collection: PaymentCollection
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const paymentUrl = `${window.location.origin}/pay/${collection.slug}`
  
  const handleToggleStatus = async () => {
    setIsLoading(true)
    await toggleCollectionStatus(collection.id, !collection.is_active)
    setIsLoading(false)
  }
  
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      setIsLoading(true)
      await deleteCollection(collection.id)
      setIsLoading(false)
    }
  }
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl)
    alert('Payment link copied to clipboard!')
  }

  const progress = collection.target_amount 
    ? (collection.current_amount / collection.target_amount) * 100 
    : 0

  return (
    <div className="bg-contrast rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm dark:border-gray-700 w-full">
      {/* Header - Responsive layout */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-text-primary font-semibold text-base sm:text-lg mb-1 break-words">
            {collection.title}
          </h3>
          {collection.description && (
            <p className="text-text-secondary text-sm break-words">
              {collection.description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 self-start">
          <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
            collection.is_active 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
          }`}>
            {collection.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Progress section */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">Collected</span>
          <span className="text-text-primary font-medium text-right">
            <span className="block sm:inline">
              ${collection.current_amount.toFixed(2)}
            </span>
            {collection.target_amount && (
              <span className="text-text-secondary block sm:inline">
                {' '}/ ${collection.target_amount.toFixed(2)}
              </span>
            )}
          </span>
        </div>
        {collection.target_amount && (
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className="bg-penn-red h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Payment link - Mobile responsive */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <p className="text-text-secondary text-xs mb-1">Payment Link:</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <code className="text-text-primary text-xs flex-1 break-all sm:truncate bg-white dark:bg-gray-900 p-1 rounded">
            {paymentUrl}
          </code>
          <button
            onClick={handleCopyLink}
            className="text-penn-red hover:text-lighter-red text-xs font-medium self-start sm:self-auto whitespace-nowrap"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Actions - Mobile responsive */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={handleToggleStatus}
          disabled={isLoading}
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors disabled:opacity-50 ${
            collection.is_active
              ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
          }`}
        >
          {collection.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="px-3 py-2 text-sm bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 rounded-md transition-colors disabled:opacity-50 sm:flex-shrink-0"
        >
          Delete
        </button>
      </div>

      <p className="text-text-muted text-xs mt-3 text-center sm:text-left">
        Created {new Date(collection.created_at).toLocaleDateString()}
      </p>
    </div>
  )
}