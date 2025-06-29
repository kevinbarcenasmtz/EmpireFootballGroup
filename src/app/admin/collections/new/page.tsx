'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCollection } from '../actions';
import { CollectionType } from '@/types/database';

export default function NewCollectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [collectionType, setCollectionType] = useState<CollectionType>('payment');
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');

    const result = await createCollection(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push('/admin/collections');
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header - Mobile responsive */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-text-primary text-xl font-bold sm:text-2xl">Create New Collection</h1>
          <p className="text-text-secondary mt-2 text-sm sm:text-base">
            {collectionType === 'payment'
              ? 'Set up a new payment collection for your team'
              : 'Set up a new signup collection for practices or games'}
          </p>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <form action={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Collection Type Selector */}
            <div>
              <label
                htmlFor="collection_type"
                className="text-text-primary mb-2 block text-sm font-medium"
              >
                Collection Type *
              </label>
              <select
                id="collection_type"
                name="collection_type"
                value={collectionType}
                onChange={e => setCollectionType(e.target.value as CollectionType)}
                className="text-text-primary bg-contrast w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-base dark:border-gray-600"
                required
              >
                <option value="payment">💰 Payment Collection</option>
                <option value="signup">📝 Signup Collection</option>
              </select>
              <p className="text-text-secondary mt-1 text-xs sm:text-sm">
                {collectionType === 'payment'
                  ? 'Collect payments for fees, equipment, etc.'
                  : 'Track attendance for practices, games, or events'}
              </p>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="text-text-primary mb-2 block text-sm font-medium">
                {collectionType === 'payment' ? 'Collection Title' : 'Event Title'} *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder={
                  collectionType === 'payment'
                    ? 'e.g., Team Registration Fees'
                    : 'e.g., Practice - January 15'
                }
                className="text-text-primary bg-contrast w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-base dark:border-gray-600"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="text-text-primary mb-2 block text-sm font-medium"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder={
                  collectionType === 'payment'
                    ? 'What is this payment for?'
                    : 'Additional details about the event'
                }
                className="text-text-primary bg-contrast w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-base dark:border-gray-600"
              />
            </div>

            {/* Payment Collection Specific Fields */}
            {collectionType === 'payment' && (
              <div>
                <label
                  htmlFor="target_amount"
                  className="text-text-primary mb-2 block text-sm font-medium"
                >
                  Target Amount (optional)
                </label>
                <div className="relative">
                  <span className="text-text-secondary absolute top-1/2 left-3 -translate-y-1/2 text-sm sm:text-base">
                    $
                  </span>
                  <input
                    id="target_amount"
                    name="target_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-text-primary bg-contrast w-full rounded-md border border-gray-300 py-2 pr-3 pl-8 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-base dark:border-gray-600"
                  />
                </div>
                <p className="text-text-secondary mt-1 text-xs sm:text-sm">
                  Leave blank if you don&apos;t have a specific target amount
                </p>
              </div>
            )}

            {/* Signup Collection Specific Fields */}
            {collectionType === 'signup' && (
              <>
                {/* Hidden target_amount for signup collections */}
                <input type="hidden" name="target_amount" value="" />

                {/* Event Date */}
                <div>
                  <label
                    htmlFor="event_date"
                    className="text-text-primary mb-2 block text-sm font-medium"
                  >
                    Event Date & Time
                  </label>
                  <input
                    id="event_date"
                    name="event_date"
                    type="datetime-local"
                    className="text-text-primary bg-contrast w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-base dark:border-gray-600"
                  />
                  <p className="text-text-secondary mt-1 text-xs sm:text-sm">
                    When is this event happening?
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="text-text-primary mb-2 block text-sm font-medium"
                  >
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g., Main Field, Gym A, etc."
                    className="text-text-primary bg-contrast w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-base dark:border-gray-600"
                  />
                  <p className="text-text-secondary mt-1 text-xs sm:text-sm">
                    Where is this event taking place?
                  </p>
                </div>
              </>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 sm:p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-700 sm:text-base dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-text-primary w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 sm:w-auto sm:text-base dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-penn-red hover:bg-lighter-red w-full rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 sm:w-auto sm:text-base"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  `Create ${collectionType === 'payment' ? 'Payment' : 'Signup'} Collection`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
