'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCollection } from '../actions'

export default function NewCollectionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError('')
    
    const result = await createCollection(formData)
    
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push('/admin/collections')
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header - Mobile responsive */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-text-primary text-xl sm:text-2xl font-bold">
            Create New Collection
          </h1>
          <p className="text-text-secondary mt-2 text-sm sm:text-base">
            Set up a new payment collection for your team
          </p>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm dark:border-gray-700">
          <form action={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="title" className="text-text-primary block text-sm font-medium mb-2">
                Collection Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                disabled={isLoading}
                placeholder="e.g., Season Dues Spring 2025"
                className="bg-background text-text-primary border-text-secondary w-full rounded-md border px-3 py-2 shadow-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red disabled:opacity-50 text-sm sm:text-base"
              />
              <p className="text-text-muted text-xs mt-1">
                This will be displayed on the payment page
              </p>
            </div>

            <div>
              <label htmlFor="description" className="text-text-primary block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                disabled={isLoading}
                placeholder="Optional description about what this payment is for..."
                className="bg-background text-text-primary border-text-secondary w-full rounded-md border px-3 py-2 shadow-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red disabled:opacity-50 text-sm sm:text-base resize-none"
              />
            </div>

            <div>
              <label htmlFor="target_amount" className="text-text-primary block text-sm font-medium mb-2">
                Target Amount (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm sm:text-base">
                  $
                </span>
                <input
                  id="target_amount"
                  name="target_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                  placeholder="0.00"
                  className="bg-background text-text-primary border-text-secondary w-full rounded-md border pl-7 pr-3 py-2 shadow-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red disabled:opacity-50 text-sm sm:text-base"
                />
              </div>
              <p className="text-text-muted text-xs mt-1">
                Leave empty if you don't have a specific target amount
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Buttons - Mobile responsive */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-penn-red hover:bg-lighter-red text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-2 sm:order-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Collection'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border border-gray-300 text-text-primary px-6 py-2 rounded-md transition-colors hover:bg-gray-50 disabled:opacity-50 order-1 sm:order-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}