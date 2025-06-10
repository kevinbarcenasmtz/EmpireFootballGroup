import { createClient } from '@/utils/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
        <h2 className="text-text-primary mb-4 text-2xl font-bold">Dashboard</h2>
        <p className="text-text-secondary">
          Welcome to the Empire Football Group payment management system.
        </p>
        <p className="text-text-secondary mt-2">
          Logged in as: {"kevin"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Collections</h3>
          <p className="text-text-secondary">Manage payment collections</p>
          <p className="text-text-muted mt-4 text-sm">Coming in Phase 2</p>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Payments</h3>
          <p className="text-text-secondary">View payment history</p>
          <p className="text-text-muted mt-4 text-sm">Coming in Phase 3</p>
        </div>

        <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
          <h3 className="text-penn-red mb-2 text-lg font-semibold">Analytics</h3>
          <p className="text-text-secondary">Payment insights</p>
          <p className="text-text-muted mt-4 text-sm">Coming in Phase 4</p>
        </div>
      </div>
    </div>
  )
}