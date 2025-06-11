import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CollectionCard } from './CollectionCard';

export default async function CollectionsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch user's collections
  const { data: collections, error } = await supabase
    .from('payment_collections')
    .select('*')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collections:', error);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header - Responsive */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-text-primary truncate text-xl font-bold sm:text-2xl">
            Payment Collections
          </h1>
          <p className="text-text-secondary mt-1 text-sm sm:text-base">
            Manage your team&apos;s payment collections • Real-time updates enabled
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

      {collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {collections.map(collection => (
            <CollectionCard key={collection.id} collection={collection} userId={user.id} />
          ))}
        </div>
      ) : (
        <div className="bg-contrast rounded-lg border border-gray-200 p-6 text-center shadow-sm sm:p-12 dark:border-gray-700">
          <h3 className="text-text-primary mb-2 text-base font-medium sm:text-lg">
            No collections yet
          </h3>
          <p className="text-text-secondary mb-4 text-sm sm:mb-6 sm:text-base">
            Create your first payment collection to get started with real-time updates
          </p>
          <Link
            href="/admin/collections/new"
            className="bg-penn-red hover:bg-lighter-red inline-block rounded-md px-4 py-2 text-sm text-white transition-colors sm:px-6 sm:py-3 sm:text-base"
          >
            Create First Collection
          </Link>
        </div>
      )}
    </div>
  );
}
