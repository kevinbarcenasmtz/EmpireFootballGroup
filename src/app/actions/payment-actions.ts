// src/app/actions/payment-actions.ts
'use server'

import { randomUUID } from 'crypto'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Try using the legacy Square SDK instead
import { Client, Environment } from 'square/legacy'

export async function processPayment(formData: FormData) {
  try {
    const sourceId = formData.get('sourceId') as string
    const collectionSlug = formData.get('collectionSlug') as string
    const amount = parseFloat(formData.get('amount') as string)
    const payerEmail = formData.get('payerEmail') as string
    const payerName = formData.get('payerName') as string

    // Validate inputs
    if (!sourceId || !collectionSlug || !amount || amount <= 0) {
      return { error: 'Invalid payment data' }
    }

    if (amount < 1) {
      return { error: 'Minimum payment amount is $1.00' }
    }

    console.log('Processing payment:', {
      sourceId: sourceId.substring(0, 10) + '...',
      collectionSlug,
      amount,
      payerEmail,
      payerName
    });

    // Create Square client using legacy SDK
    const squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
    });

    const supabase = await createClient()

    // Get collection details
    const { data: collection, error: collectionError } = await supabase
      .from('payment_collections')
      .select('*')
      .eq('slug', collectionSlug)
      .eq('is_active', true)
      .single()

    if (collectionError || !collection) {
      return { error: 'Collection not found or inactive' }
    }

    // Process payment with Square using legacy SDK
    const { result } = await squareClient.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)), // Convert to cents as BigInt
        currency: 'USD',
      },
    });

    console.log('Square payment result:', {
      paymentId: result.payment?.id,
      status: result.payment?.status
    });

    // Store payment in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        collection_id: collection.id,
        square_payment_id: result.payment?.id,
        amount: amount,
        currency: 'USD',
        payer_email: payerEmail,
        payer_name: payerName,
        status: 'completed',
        metadata: {
          square_result: result,
        }
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Database error:', paymentError)
      return { error: 'Failed to record payment' }
    }

    // Update collection current_amount atomically
    const { error: updateError } = await supabase
      .from('payment_collections')
      .update({
        current_amount: collection.current_amount + amount
      })
      .eq('id', collection.id)

    if (updateError) {
      console.error('Failed to update collection amount:', updateError)
    }

    revalidatePath(`/pay/${collectionSlug}`)
    return { 
      success: true, 
      payment: payment,
      paymentId: result.payment?.id,
      receiptUrl: result.payment?.receiptUrl
    }

  } catch (error) {
    console.error('Payment processing error:', error)
    
    // Handle any Square errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      console.error('Square Error Details:', {
        statusCode: (error as any).statusCode,
        message: (error as any).message,
        body: (error as any).body
      })
    }
    
    return { error: 'Payment processing failed. Please try again.' }
  }
}