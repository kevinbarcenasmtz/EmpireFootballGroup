'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loginTime] = useState(new Date().toLocaleString())

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Collections</h3>
          <p className="text-text-secondary">Manage payment collections</p>
          <p className="text-text-muted mt-4 text-sm">Coming in Phase 2</p>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Payments</h3>
          <p className="text-text-secondary">View payment history</p>
          <p className="text-text-muted mt-4 text-sm">Coming in Phase 3</p>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Analytics</h3>
          <p className="text-text-secondary">Payment insights</p>
          <p className="text-text-muted mt-4 text-sm">Coming in Phase 4</p>
        </div>
      </div>
    </div>
  )
}