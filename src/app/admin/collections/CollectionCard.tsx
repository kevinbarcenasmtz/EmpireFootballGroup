'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PaymentCollection, getCollectionTypeInfo, isSignupCollection } from '@/types/database';
import { useRealtimePayments } from '@/hooks/useRealtimePayments';
import { useRealtimeSignups } from '@/hooks/useRealtimeSignups';
import { toggleCollectionStatus, deleteCollection } from './actions';

interface CollectionCardProps {
  collection: PaymentCollection;
  userId: string;
}

export function CollectionCard({ collection, userId }: CollectionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [localCollection, setLocalCollection] = useState(collection);
  const router = useRouter();

  // Get collection type info for display
  const typeInfo = getCollectionTypeInfo(collection);
  const isSignup = isSignupCollection(collection);

  // Use appropriate real-time hook based on collection type
  const {
    payments,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useRealtimePayments({
    userId,
    collectionId: isSignup ? undefined : collection.id,
    enabled: !isSignup,
    limit: 5,
  });

  const {
    signups,
    summary: signupSummary,
    isLoading: signupsLoading,
    error: signupsError,
  } = useRealtimeSignups({
    collectionId: isSignup ? collection.id : '',
    userId,
    enabled: isSignup,
  });

  // Update local collection state when props change
  useEffect(() => {
    setLocalCollection(collection);
  }, [collection]);

  const handleCopyLink = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const linkPath = isSignup ? `/signup/${collection.slug}` : `/pay/${collection.slug}`;
    const fullUrl = `${baseUrl}${linkPath}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const handleToggleStatus = async () => {
    setIsLoading(true);
    const result = await toggleCollectionStatus(collection.id, !localCollection.is_active);
    
    if (result.success) {
      setLocalCollection(prev => ({ ...prev, is_active: !prev.is_active }));
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${collection.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    const result = await deleteCollection(collection.id);
    
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  // Get event details from settings for signup collections
  const eventDate = isSignup && collection.settings?.event_date 
    ? new Date(collection.settings.event_date as string).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const eventLocation = isSignup && collection.settings?.location 
    ? collection.settings.location as string 
    : null;

  return (
    <div className="bg-contrast relative rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:shadow-md sm:p-6 dark:border-gray-700">
      {/* Status Badge */}
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium sm:text-sm ${
            localCollection.is_active
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {localCollection.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Header */}
      <div className="mb-4 pr-16">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">{typeInfo.icon}</span>
          <h3 className="text-text-primary text-base font-semibold sm:text-lg">
            {collection.title}
          </h3>
        </div>
        
        {collection.description && (
          <p className="text-text-secondary text-sm sm:text-base">{collection.description}</p>
        )}

        {/* Event Details for Signup Collections */}
        {isSignup && (eventDate || eventLocation) && (
          <div className="mt-2 space-y-1">
            {eventDate && (
              <p className="text-text-secondary flex items-center gap-1 text-xs sm:text-sm">
                <span>📅</span>
                {eventDate}
              </p>
            )}
            {eventLocation && (
              <p className="text-text-secondary flex items-center gap-1 text-xs sm:text-sm">
                <span>📍</span>
                {eventLocation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Metric Display */}
      <div className="mb-4">
        {isSignup ? (
          // Signup Collection Metrics
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-sm font-medium">Total Signups:</span>
              <span className="text-text-primary text-xl font-bold">
                {signupsLoading ? '...' : signupSummary.total}
              </span>
            </div>
            
            {signupSummary.total > 0 && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-green-50 p-2 dark:bg-green-900/20">
                  <div className="text-sm font-bold text-green-700 dark:text-green-400">
                    {signupSummary.yes}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-500">Yes</div>
                </div>
                <div className="rounded-md bg-yellow-50 p-2 dark:bg-yellow-900/20">
                  <div className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                    {signupSummary.maybe}
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-500">Maybe</div>
                </div>
                <div className="rounded-md bg-red-50 p-2 dark:bg-red-900/20">
                  <div className="text-sm font-bold text-red-700 dark:text-red-400">
                    {signupSummary.no}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-500">No</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Payment Collection Metrics
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm font-medium">
              {collection.target_amount ? 'Progress:' : 'Total Raised:'}
            </span>
            <div className="text-right">
              <span className="text-text-primary text-xl font-bold">
                ${collection.current_amount.toFixed(2)}
              </span>
              {collection.target_amount && (
                <span className="text-text-secondary block text-xs">
                  of ${collection.target_amount.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar (Payment Collections Only) */}
      {!isSignup && collection.target_amount && (
        <div className="mb-4">
          <div className="bg-contrast h-2 overflow-hidden rounded-full border border-gray-200 dark:border-gray-600">
            <div
              className="bg-penn-red h-full transition-all duration-300"
              style={{
                width: `${Math.min((collection.current_amount / collection.target_amount) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-text-secondary mt-1 text-xs text-right">
            {Math.round((collection.current_amount / collection.target_amount) * 100)}% complete
          </p>
        </div>
      )}

      {/* Copy Link Button */}
      <div className="mb-4">
        <button
          onClick={handleCopyLink}
          className="text-text-primary hover:bg-contrast-hover w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium transition-colors dark:border-gray-600"
        >
          {copyFeedback ? (
            <span className="flex items-center justify-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {copyFeedback}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="sm:hidden">Copy {typeInfo.actionText} Link</span>
              <span className="hidden sm:inline">Copy {typeInfo.actionText} Link</span>
            </span>
          )}
        </button>
      </div>

      {/* Recent Activity */}
      {!isSignup && payments.length > 0 && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 sm:p-4 dark:bg-blue-900/20">
          <p className="text-text-secondary mb-3 text-xs font-medium sm:text-sm">
            Recent Payments:
          </p>
          <div className="space-y-2 sm:space-y-1">
            {payments.slice(0, 3).map(payment => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-2 rounded-md bg-white p-2 sm:bg-transparent sm:p-1 dark:bg-gray-800 sm:dark:bg-transparent"
              >
                <span className="text-text-primary min-w-0 flex-1 truncate text-sm font-medium sm:text-xs">
                  {payment.payer_name || 'Anonymous'}
                </span>
                <span className="text-sm font-bold text-green-600 sm:text-xs">
                  ${payment.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {payments.length > 3 && (
              <p className="text-text-muted text-center text-xs font-medium sm:text-left">
                +{payments.length - 3} more payment{payments.length - 3 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Signups */}
      {isSignup && signups.length > 0 && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 sm:p-4 dark:bg-green-900/20">
          <p className="text-text-secondary mb-3 text-xs font-medium sm:text-sm">
            Recent Signups:
          </p>
          <div className="space-y-2 sm:space-y-1">
            {signups.slice(0, 3).map(signup => (
              <div
                key={signup.id}
                className="flex items-center justify-between gap-2 rounded-md bg-white p-2 sm:bg-transparent sm:p-1 dark:bg-gray-800 sm:dark:bg-transparent"
              >
                <span className="text-text-primary min-w-0 flex-1 truncate text-sm font-medium sm:text-xs">
                  {signup.player_name}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  signup.status === 'yes' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  signup.status === 'maybe' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {signup.status.toUpperCase()}
                </span>
              </div>
            ))}
            {signups.length > 3 && (
              <p className="text-text-muted text-center text-xs font-medium sm:text-left">
                +{signups.length - 3} more signup{signups.length - 3 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
        <button
          onClick={handleToggleStatus}
          disabled={isLoading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 sm:py-2 ${
            localCollection.is_active
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
          }`}
        >
          {localCollection.is_active ? 'Deactivate' : 'Activate'}
        </button>

        {/* View Details Button */}
        {isSignup && signups.length > 0 && (
          <Link
            href={`/admin/collections/${collection.id}/signups`}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-100 px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 sm:py-2 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            View Signups
          </Link>
        )}

        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 sm:py-2"
        >
          Delete
        </button>
      </div>
    </div>
  );
}