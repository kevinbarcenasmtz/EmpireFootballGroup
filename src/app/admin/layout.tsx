import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
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
              <p className="text-text-secondary">Welcome, {data.user.email}</p>
              <form action="/auth/signout" method="post">
                <button 
                  type="submit"
                  className="bg-penn-red hover:bg-lighter-red rounded-md px-4 py-2 text-sm text-white transition-colors"
                >
                  Logout
                </button>
              </form>
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