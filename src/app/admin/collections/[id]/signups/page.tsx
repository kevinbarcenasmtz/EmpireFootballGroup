'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PaymentCollection, PlayerSignup, SignupStatus } from '@/types/database';
import { useRealtimeSignups } from '@/hooks/useRealtimeSignups';
import { getSignups, deleteSignup } from '@/app/admin/collections/actions';
import { getCollectionForSignup } from '@/actions/signup-actions';

export default function SignupsPage() {
  const params = useParams();
  const router = useRouter();
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
    error: signupsError,
    isConnected
  } = useRealtimeSignups({
    collectionId,
    enabled: !!collectionId
  });

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
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
  };

  const handleDeleteSignup = async (signupId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to delete ${playerName}'s signup? This action cannot be undone.`)) {
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
  const filteredSignups = signups.filter(signup => {
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

  const eventLocation = collection?.settings?.location as string || null;

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
        <div className="max-w-md mx-auto text-center py-12">
          <div className="mx-auto mb-4 h-16 w-16 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-text-primary mb-2 text-xl font-bold">Error Loading Signups</h1>
          <p className="text-text-secondary text-base mb-4">{error}</p>
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
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/admin/collections"
            className="text-text-secondary hover:text-text-primary"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-text-primary text-xl font-bold sm:text-2xl">
            Signups: {collection?.title}
          </h1>
        </div>
        
        {collection?.description && (
          <p className="text-text-secondary text-sm sm:text-base mb-2">
            {collection.description}
          </p>
        )}

        {/* Event Details */}
        {(eventDate || eventLocation) && (
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
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
        <div className="flex items-center gap-2 mt-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-text-secondary">
            {isConnected ? 'Real-time updates active' : 'Connection lost'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center dark:bg-gray-800 dark:border-gray-700">
          <div className="text-2xl font-bold text-text-primary">{summary.total}</div>
          <div className="text-sm text-text-secondary">Total</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center dark:bg-green-900/20 dark:border-green-800">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.yes}</div>
          <div className="text-sm text-green-600 dark:text-green-500">Yes</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center dark:bg-yellow-900/20 dark:border-yellow-800">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{summary.maybe}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-500">Maybe</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center dark:bg-red-900/20 dark:border-red-800">
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
              { key: 'no', label: 'No', count: summary.no }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key as SignupStatus | 'all')}
                className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
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
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-blue-900 font-medium dark:text-blue-100">Share Signup Link</h3>
              <p className="text-blue-700 text-sm dark:text-blue-300">Send this link to players so they can sign up</p>
            </div>
            <button
              onClick={() => {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                const signupUrl = `${baseUrl}/signup/${collection?.slug}`;
                navigator.clipboard.writeText(signupUrl);
                // You could add a toast notification here
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
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
          <div className="hidden sm:block bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Signed Up
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {filteredSignups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">
                        {signup.player_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        signup.status === 'yes' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        signup.status === 'maybe' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {signup.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {signup.player_phone || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">
                      {signup.notes || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(signup.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
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
          <div className="sm:hidden space-y-3">
            {filteredSignups.map((signup) => (
              <div key={signup.id} className="bg-white rounded-lg border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-text-primary font-medium">{signup.player_name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    signup.status === 'yes' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    signup.status === 'maybe' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {signup.status.toUpperCase()}
                  </span>
                </div>
                
                {signup.player_phone && (
                  <p className="text-text-secondary text-sm mb-1">
                    📱 {signup.player_phone}
                  </p>
                )}
                
                {signup.notes && (
                  <p className="text-text-secondary text-sm mb-2">
                    💬 {signup.notes}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>
                    {new Date(signup.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
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
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center dark:bg-gray-800 dark:border-gray-700">
          <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286" />
            </svg>
          </div>
          <h3 className="text-text-primary mb-2 text-lg font-medium">
            {filterStatus === 'all' ? 'No signups yet' : `No "${filterStatus}" responses`}
          </h3>
          <p className="text-text-secondary text-base">
            {filterStatus === 'all' 
              ? 'Share the signup link to start collecting responses'
              : `No players have responded "${filterStatus}" yet`
            }
          </p>
        </div>
      )}
    </div>
  );
}