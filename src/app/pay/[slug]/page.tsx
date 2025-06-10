// src/app/pay/[slug]/page.tsx
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PaymentForm from './PaymentForm'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function PaymentPage({ params }: PageProps) {
  // Await params in Next.js 15
  const { slug } = await params
  
  const supabase = await createClient()
  
  const { data: collection, error } = await supabase
    .from('payment_collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !collection) {
    notFound()
  }

  const progress = collection.target_amount 
    ? (collection.current_amount / collection.target_amount) * 100 
    : 0

  return (
    <div className="bg-background min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Collection Info */}
        <div className="bg-contrast rounded-lg border border-gray-200 p-6 mb-6 shadow-sm dark:border-gray-700">
          <h1 className="text-text-primary text-2xl font-bold mb-4">
            {collection.title}
          </h1>
          
          {collection.description && (
            <p className="text-text-secondary mb-4">
              {collection.description}
            </p>
          )}

          {/* Progress Display */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">Raised so far</span>
              <span className="text-text-primary font-medium">
                ${collection.current_amount.toFixed(2)}
                {collection.target_amount && (
                  <span className="text-text-secondary">
                    {' '}/ ${collection.target_amount.toFixed(2)}
                  </span>
                )}
              </span>
            </div>
            {collection.target_amount && (
              <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                <div 
                  className="bg-penn-red h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Form */}
        <PaymentForm collection={collection} />
      </div>
    </div>
  )
}