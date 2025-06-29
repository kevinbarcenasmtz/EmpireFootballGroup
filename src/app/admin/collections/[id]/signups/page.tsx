'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PaymentCollection, PlayerSignup, SignupStatus } from '@/types/database';
import useRealtimeSignups from '@/hooks/useRealtimeSignups';
import { deleteSignup } from '@/app/admin/collections/actions';

export default function SignupsPage() {
  const params = useParams();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<PaymentCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SignupStatus | 'all'>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Use real-time signups hook
  const {
    signups,
    summary,
    isLoading: signupsLoading,
    isConnected,
  } = useRealtimeSignups({
    collectionId,
    enabled: !!collectionId,
  });

  const loadCollection = useCallback(async () => {
    try {
      // We need to get the collection by ID, but our existing function uses slug
      // For now, we'll use a simple approach - this could be optimized later
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('payment_collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      if (error || !data) {
        setError('Collection not found');
        return;
      }

      if (data.collection_type !== 'signup') {
        setError('This is not a signup collection');
        return;
      }

      setCollection(data);
    } catch (err) {
      console.error('Error loading collection:', err);
      setError('Failed to load collection');
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const handleDeleteSignup = async (signupId: string, playerName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${playerName}'s signup? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(signupId);
    const result = await deleteSignup(signupId);

    if (result.error) {
      alert(`Failed to delete signup: ${result.error}`);
    }

    setIsDeleting(null);
  };

  // Filter signups based on status
  const filteredSignups = signups.filter((signup: PlayerSignup) => {
    if (filterStatus === 'all') return true;
    return signup.status === filterStatus;
  });

  // Get event details
  const eventDate = collection?.settings?.event_date
    ? new Date(collection.settings.event_date as string).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const eventLocation =
    collection?.settings?.location && typeof collection.settings.location === 'string'
      ? collection.settings.location
      : null;

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="border-penn-red h-5 w-5 animate-spin rounded-full border-b-2 sm:h-6 sm:w-6"></div>
          <span className="text-text-primary text-sm sm:text-base">Loading signups...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-text-primary mb-2 text-xl font-bold">Error Loading Signups</h1>
          <p className="text-text-secondary mb-4 text-base">{error}</p>
          <Link
            href="/admin/collections"
            className="bg-penn-red hover:bg-lighter-red inline-block rounded-md px-4 py-2 text-sm text-white transition-colors"
          >
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Link href="/admin/collections" className="text-text-secondary hover:text-text-primary">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-text-primary text-xl font-bold sm:text-2xl">
            Signups: {collection?.title}
          </h1>
        </div>

        {collection?.description && (
          <p className="text-text-secondary mb-2 text-sm sm:text-base">{collection.description}</p>
        )}

        {/* Event Details */}
        {(eventDate || eventLocation) && (
          <div className="text-text-secondary flex flex-wrap gap-4 text-sm">
            {eventDate && (
              <span className="flex items-center gap-1">
                <span>📅</span>
                {eventDate}
              </span>
            )}
            {eventLocation && (
              <span className="flex items-center gap-1">
                <span>📍</span>
                {eventLocation}
              </span>
            )}
          </div>
        )}

        {/* Real-time connection status */}
        <div className="mt-2 flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-text-secondary text-xs">
            {isConnected ? 'Real-time updates active' : 'Connection lost'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="text-text-primary text-2xl font-bold">{summary.total}</div>
          <div className="text-text-secondary text-sm">Total</div>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.yes}</div>
          <div className="text-sm text-green-600 dark:text-green-500">Yes</div>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {summary.maybe}
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-500">Maybe</div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.no}</div>
          <div className="text-sm text-red-600 dark:text-red-500">No</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { key: 'all', label: 'All', count: summary.total },
              { key: 'yes', label: 'Yes', count: summary.yes },
              { key: 'maybe', label: 'Maybe', count: summary.maybe },
              { key: 'no', label: 'No', count: summary.no },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key as SignupStatus | 'all')}
                className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                  filterStatus === tab.key
                    ? 'border-penn-red text-penn-red'
                    : 'text-text-secondary hover:text-text-primary border-transparent hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="text-text-muted ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:bg-gray-800">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Copy Signup Link */}
      <div className="mb-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Share Signup Link</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Send this link to players so they can sign up
              </p>
            </div>
            <button
              onClick={() => {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                const signupUrl = `${baseUrl}/signup/${collection?.slug}`;
                navigator.clipboard.writeText(signupUrl);
                // You could add a toast notification here
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Signups List */}
      {signupsLoading ? (
        <div className="flex justify-center py-8">
          <div className="border-penn-red h-6 w-6 animate-spin rounded-full border-b-2"></div>
        </div>
      ) : filteredSignups.length > 0 ? (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white sm:block dark:border-gray-700 dark:bg-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-text-secondary px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Player
                  </th>
                  <th className="text-text-secondary px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Status
                  </th>
                  <th className="text-text-secondary px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Phone
                  </th>
                  <th className="text-text-secondary px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Notes
                  </th>
                  <th className="text-text-secondary px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Signed Up
                  </th>
                  <th className="text-text-secondary px-6 py-3 text-right text-xs font-medium tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {filteredSignups.map((signup: PlayerSignup) => (
                  <tr key={signup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-text-primary text-sm font-medium">
                        {signup.player_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          signup.status === 'yes'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : signup.status === 'maybe'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                      >
                        {signup.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-text-secondary px-6 py-4 text-sm whitespace-nowrap">
                      {signup.player_phone || '—'}
                    </td>
                    <td className="text-text-secondary max-w-xs truncate px-6 py-4 text-sm">
                      {signup.notes || '—'}
                    </td>
                    <td className="text-text-secondary px-6 py-4 text-sm whitespace-nowrap">
                      {new Date(signup.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteSignup(signup.id, signup.player_name)}
                        disabled={isDeleting === signup.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                      >
                        {isDeleting === signup.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 sm:hidden">
            {filteredSignups.map((signup: PlayerSignup) => (
              <div
                key={signup.id}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-text-primary font-medium">{signup.player_name}</h3>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      signup.status === 'yes'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : signup.status === 'maybe'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {signup.status.toUpperCase()}
                  </span>
                </div>

                {signup.player_phone && (
                  <p className="text-text-secondary mb-1 text-sm">📱 {signup.player_phone}</p>
                )}

                {signup.notes && (
                  <p className="text-text-secondary mb-2 text-sm">💬 {signup.notes}</p>
                )}

                <div className="text-text-muted flex items-center justify-between text-xs">
                  <span>
                    {new Date(signup.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={() => handleDeleteSignup(signup.id, signup.player_name)}
                    disabled={isDeleting === signup.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400"
                  >
                    {isDeleting === signup.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286"
              />
            </svg>
          </div>
          <h3 className="text-text-primary mb-2 text-lg font-medium">
            {filterStatus === 'all' ? 'No signups yet' : `No "${filterStatus}" responses`}
          </h3>
          <p className="text-text-secondary text-base">
            {filterStatus === 'all'
              ? 'Share the signup link to start collecting responses'
              : `No players have responded "${filterStatus}" yet`}
          </p>
        </div>
      )}
    </div>
  );
}
