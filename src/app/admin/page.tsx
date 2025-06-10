'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalCollections: 0,
    activeCollections: 0,
    totalRaised: 0
  })
  const [loginTime] = useState(new Date().toLocaleString())

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Fetch basic stats
        const { data: collections } = await supabase
          .from('payment_collections')
          .select('is_active, current_amount')
          .eq('admin_id', user.id)
        
        if (collections) {
          const totalCollections = collections.length
          const activeCollections = collections.filter(c => c.is_active).length
          const totalRaised = collections.reduce((sum, c) => sum + (c.current_amount || 0), 0)
          
          setStats({ totalCollections, activeCollections, totalRaised })
        }
      }
    }
    getUser()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
        <h2 className="text-text-primary mb-4 text-2xl font-bold">Welcome Back!</h2>
        <div className="space-y-2">
          <p className="text-text-secondary">
            Welcome to the Empire Football Group payment management system.
          </p>
          {user && (
            <p className="text-text-secondary">
              Logged in as: <span className="font-medium">{user.email}</span>
            </p>
          )}
          <p className="text-text-muted text-sm">
            Session started: {loginTime}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Total Collections</h3>
          <p className="text-text-primary text-3xl font-bold">{stats.totalCollections}</p>
          <p className="text-text-secondary text-sm">{stats.activeCollections} active</p>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Total Raised</h3>
          <p className="text-text-primary text-3xl font-bold">${stats.totalRaised.toFixed(2)}</p>
          <p className="text-text-secondary text-sm">Across all collections</p>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Quick Actions</h3>
          <div className="space-y-2">
            <Link 
              href="/admin/collections/new"
              className="block w-full bg-penn-red hover:bg-lighter-red text-white text-center py-2 px-4 rounded-md transition-colors"
            >
              New Collection
            </Link>
            <Link 
              href="/admin/collections"
              className="block w-full border border-gray-300 text-text-primary text-center py-2 px-4 rounded-md hover:text-black hover:bg-amber-50 transition-colors"
            >
              View All Collections
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}