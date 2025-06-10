// src/app/pay/[slug]/page.tsx
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PaymentPageClient from './PaymentPageClient'

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

  // Pass the collection data to the client component
  return <PaymentPageClient collection={collection} />
}