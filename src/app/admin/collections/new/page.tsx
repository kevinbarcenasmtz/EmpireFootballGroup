'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCollection } from '../actions';

export default function NewCollectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
            Set up a new payment collection for your team
          </p>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-4 shadow-sm sm:p-6 dark:border-gray-700">
          <form action={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="title" className="text-text-primary mb-2 block text-sm font-medium">
                Collection Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                disabled={isLoading}
                placeholder="e.g., Season Dues Spring 2025"
                className="bg-background text-text-primary border-text-secondary focus:border-penn-red focus:ring-penn-red w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:opacity-50 sm:text-base"
              />
              <p className="text-text-muted mt-1 text-xs">
                This will be displayed on the payment page
              </p>
            </div>

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
                disabled={isLoading}
                placeholder="Optional description about what this payment is for..."
                className="bg-background text-text-primary border-text-secondary focus:border-penn-red focus:ring-penn-red w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:opacity-50 sm:text-base"
              />
            </div>

            <div>
              <label
                htmlFor="target_amount"
                className="text-text-primary mb-2 block text-sm font-medium"
              >
                Target Amount (Optional)
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
                  disabled={isLoading}
                  placeholder="0.00"
                  className="bg-background text-text-primary border-text-secondary focus:border-penn-red focus:ring-penn-red w-full rounded-md border py-2 pr-3 pl-7 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:opacity-50 sm:text-base"
                />
              </div>
              <p className="text-text-muted mt-1 text-xs">
                Leave empty if you don&apos;t have a specific target amount
              </p>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Buttons - Mobile responsive */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-penn-red hover:bg-lighter-red order-2 flex items-center justify-center rounded-md px-6 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:order-1"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
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
                className="text-text-primary order-1 rounded-md border border-gray-300 px-6 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:order-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
