'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          console.log('No valid user session, redirecting to login')
          router.push('/login')
          return
        }

        setUser(user)
        
        // Store access token in cookie for middleware (following Reddit pattern)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; secure; samesite=strict`
        }
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        // Clear access token cookie
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        setUser(null)
        router.push('/login')
      } else if (session?.user) {
        setUser(session.user)
        // Update access token cookie
        if (session.access_token) {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; secure; samesite=strict`
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      const supabase = createClient()
      await supabase.auth.signOut()
      // The auth state change will handle cleanup and redirect
    }
  }

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
        <div className="flex items-center space-x-2">
          <div className="border-penn-red h-6 w-6 animate-spin rounded-full border-b-2"></div>
          <span className="text-text-primary">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="bg-background min-h-screen">
      <nav className="bg-contrast border-b border-gray-200 shadow-sm dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-text-primary text-xl font-semibold">
              Empire Football Group Admin
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-text-secondary hidden sm:block">
                Welcome, {user.email}
              </p>
              <button
                onClick={handleLogout}
                className="bg-penn-red hover:bg-lighter-red rounded-md px-4 py-2 text-sm text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}