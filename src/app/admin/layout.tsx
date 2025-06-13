'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          console.log('No valid user session, redirecting to login');
          router.push('/login');
          return;
        }
        setUser(user);

        // Update cookie for any token refresh scenarios
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; secure; samesite=strict`;
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        // Clear access token cookie
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setUser(null);
        router.push('/login');
      } else if (session?.user) {
        setUser(session.user);
        // Update access token cookie on auth state changes
        if (session.access_token) {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; secure; samesite=strict`;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
        <div className="flex items-center space-x-3">
          <div className="border-penn-red h-5 w-5 animate-spin rounded-full border-b-2 sm:h-6 sm:w-6"></div>
          <span className="text-text-primary text-sm sm:text-base">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Mobile-Responsive Admin Navigation */}
      <nav className="bg-contrast border-border border-b shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side - Logo/Title and Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Link href="/admin" className="flex items-center gap-2">
                  <div className="bg-penn-red flex h-8 w-8 items-center justify-center rounded-md text-white">
                    <span className="text-sm font-bold">E</span>
                  </div>
                  <h1 className="text-text-primary hidden text-lg font-semibold sm:block">
                    Empire Admin
                  </h1>
                  <h1 className="text-text-primary text-base font-semibold sm:hidden">Admin</h1>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <div className="ml-6 flex items-baseline space-x-4">
                  <Link
                    href="/admin"
                    className="text-text-secondary hover:text-text-primary rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/collections"
                    className="text-text-secondary hover:text-text-primary rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Collections
                  </Link>
                  <Link
                    href="/admin/collections/new"
                    className="bg-penn-red rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                  >
                    New Collection
                  </Link>
                </div>
              </div>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center gap-3">
              {/* User info - hidden on small screens */}
              <div className="hidden text-right sm:block">
                <div className="text-text-primary text-sm font-medium">{user.email}</div>
                <div className="text-text-muted text-xs">Administrator</div>
              </div>

              {/* Desktop Logout */}
              <button
                onClick={handleLogout}
                className="bg-penn-red hidden rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 active:bg-red-700 sm:block"
              >
                Logout
              </button>

              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="text-text-primary hover:text-text-secondary inline-flex items-center justify-center rounded-md p-2 transition-colors md:hidden"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="border-border border-t md:hidden">
            <div className="space-y-1 px-4 pt-2 pb-3">
              {/* User info on mobile */}
              <div className="border-border mb-3 border-b pb-3">
                <div className="text-text-primary text-sm font-medium">{user.email}</div>
                <div className="text-text-muted text-xs">Administrator</div>
              </div>

              {/* Navigation links */}
              <Link
                href="/admin"
                className="text-text-secondary hover:text-text-primary block rounded-md px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/collections"
                className="text-text-secondary hover:text-text-primary block rounded-md px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Collections
              </Link>
              <Link
                href="/admin/collections/new"
                className="bg-penn-red block rounded-md px-3 py-2 text-base font-medium text-white transition-colors hover:bg-red-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                New Collection
              </Link>

              {/* Mobile logout */}
              <button
                onClick={handleLogout}
                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}
