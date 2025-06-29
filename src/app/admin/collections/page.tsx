'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { PaymentCollection, CollectionType, isSignupCollection } from '@/types/database';
import { CollectionCard } from './CollectionCard';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<PaymentCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<CollectionType | 'all'>('all');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      await fetchCollections(user.id);
    };

    const fetchCollections = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('payment_collections')
          .select('*')
          .eq('admin_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setCollections(data || []);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch collections');
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [router]);

  // Filter collections based on selected type
  const filteredCollections = collections.filter(collection => {
    if (filterType === 'all') return true;
    if (filterType === 'signup') return isSignupCollection(collection);
    if (filterType === 'payment') return !isSignupCollection(collection);
    return true;
  });

  // Count collections by type
  const signupCount = collections.filter(isSignupCollection).length;
  const paymentCount = collections.length - signupCount;

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="border-penn-red h-5 w-5 animate-spin rounded-full border-b-2 sm:h-6 sm:w-6"></div>
          <span className="text-text-primary text-sm sm:text-base">Loading collections...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header - Responsive */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-text-primary truncate text-xl font-bold sm:text-2xl">
            Collections
          </h1>
          <p className="text-text-secondary mt-1 text-sm sm:text-base">
            Manage your teams payment and signup collections • Real-time updates enabled
          </p>
        </div>
        <div className="flex-shrink-0">
          <Link
            href="/admin/collections/new"
            className="bg-penn-red hover:bg-lighter-red block w-full rounded-md px-4 py-2 text-center text-sm text-white transition-colors sm:w-auto sm:text-base"
          >
            <span className="sm:hidden">+ New</span>
            <span className="hidden sm:inline">New Collection</span>
          </Link>
          </div>
      </div>

      {/* Filter Tabs - Mobile Responsive */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setFilterType('all')}
              className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                filterType === 'all'
                  ? 'border-penn-red text-penn-red'
                  : 'text-text-secondary hover:text-text-primary border-transparent hover:border-gray-300'
              }`}
            >
              All Collections
              <span className="text-text-muted ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:bg-gray-800">
                {collections.length}
              </span>
            </button>
            <button
              onClick={() => setFilterType('payment')}
              className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                filterType === 'payment'
                  ? 'border-penn-red text-penn-red'
                  : 'text-text-secondary hover:text-text-primary border-transparent hover:border-gray-300'
              }`}
            >
              💰 Payments
              <span className="text-text-muted ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:bg-gray-800">
                {paymentCount}
              </span>
            </button>
            <button
              onClick={() => setFilterType('signup')}
              className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                filterType === 'signup'
                  ? 'border-penn-red text-penn-red'
                  : 'text-text-secondary hover:text-text-primary border-transparent hover:border-gray-300'
              }`}
            >
              📝 Signups
              <span className="text-text-muted ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:bg-gray-800">
                {signupCount}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Collections Grid */}
      {filteredCollections && filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCollections.map(collection => (
            <CollectionCard key={collection.id} collection={collection} userId={user.id} />
          ))}
        </div>
      ) : (
        <div className="bg-contrast rounded-lg border border-gray-200 p-6 text-center shadow-sm sm:p-12 dark:border-gray-700">
          {collections.length === 0 ? (
            // No collections at all
            <>
              <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286"
                  />
                </svg>
              </div>
              <h3 className="text-text-primary mb-2 text-base font-medium sm:text-lg">
                No collections yet
              </h3>
              <p className="text-text-secondary mb-4 text-sm sm:mb-6 sm:text-base">
                Create your first payment or signup collection to get started with real-time updates
              </p>
              <Link
                href="/admin/collections/new"
                className="bg-penn-red hover:bg-lighter-red inline-block rounded-md px-4 py-2 text-sm text-white transition-colors sm:px-6 sm:py-3 sm:text-base"
              >
                Create First Collection
              </Link>
            </>
          ) : (
            // Has collections but none match filter
            <>
              <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-text-primary mb-2 text-base font-medium sm:text-lg">
                No {filterType} collections found
              </h3>
              <p className="text-text-secondary mb-4 text-sm sm:mb-6 sm:text-base">
                {filterType === 'payment' 
                  ? 'Create a payment collection to start collecting fees and donations'
                  : 'Create a signup collection to track attendance for practices and games'
                }
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setFilterType('all')}
                  className="text-text-primary inline-block rounded-md border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50 sm:px-6 sm:py-3 sm:text-base dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  View All Collections
                </button>
                <Link
                  href="/admin/collections/new"
                  className="bg-penn-red hover:bg-lighter-red inline-block rounded-md px-4 py-2 text-sm text-white transition-colors sm:px-6 sm:py-3 sm:text-base"
                >
                  Create {filterType === 'payment' ? 'Payment' : 'Signup'} Collection
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}