// src/app/actions/payment-actions.ts
'use server'

import { randomUUID } from 'crypto'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateServerEnvironment, EnvironmentError } from '@/lib/env-validation'

// Try using the legacy Square SDK instead
import { Client, Environment } from 'square/legacy'

export async function processPayment(formData: FormData) {
  try {
    // Validate server environment first
    const env = validateServerEnvironment()
    
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

    // Additional validation for maximum amount (safety check)
    if (amount > 10000) {
      return { error: 'Maximum payment amount is $10,000' }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(payerEmail)) {
      return { error: 'Please enter a valid email address' }
    }

    // Validate name (basic sanitization)
    if (!payerName.trim() || payerName.trim().length < 2) {
      return { error: 'Please enter a valid name' }
    }

    console.log('Processing payment:', {
      sourceId: sourceId.substring(0, 10) + '...',
      collectionSlug,
      amount,
      payerEmail,
      payerName: payerName.substring(0, 2) + '...',
      environment: env.SQUARE_ENVIRONMENT
    });

    // Create Square client using legacy SDK
    const squareClient = new Client({
      accessToken: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
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
      console.error('Collection not found:', collectionError)
      return { error: 'Collection not found or inactive' }
    }

    // Check if collection has a maximum and if this payment would exceed it
    if (collection.target_amount && (collection.current_amount + amount) > (collection.target_amount * 1.1)) {
      return { error: 'This payment would exceed the collection target. Please contact support.' }
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
      status: result.payment?.status,
      environment: env.SQUARE_ENVIRONMENT
    });

    // Store payment in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        collection_id: collection.id,
        square_payment_id: result.payment?.id,
        amount: amount,
        currency: 'USD',
        payer_email: payerEmail.toLowerCase().trim(),
        payer_name: payerName.trim(),
        status: 'completed',
        metadata: {
          square_environment: env.SQUARE_ENVIRONMENT,
          square_location_id: env.SQUARE_LOCATION_ID,
        }
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Database error:', paymentError)
      return { error: 'Failed to record payment. Please contact support with your payment confirmation.' }
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
      // Don't fail the payment for this, just log it
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
    
    if (error instanceof EnvironmentError) {
      console.error('Environment configuration error:', error.message)
      return { error: 'Payment system configuration error. Please contact support.' }
    }
    
    // Handle any Square errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      console.error('Square Error Details:', {
        statusCode: (error as any).statusCode,
        message: (error as any).message,
      })
      
      // Handle specific Square error codes
      const statusCode = (error as any).statusCode
      if (statusCode === 400) {
        return { error: 'Invalid payment information. Please check your card details.' }
      } else if (statusCode === 401) {
        return { error: 'Payment system authentication error. Please contact support.' }
      } else if (statusCode === 402) {
        return { error: 'Payment was declined. Please try a different payment method.' }
      } else if (statusCode >= 500) {
        return { error: 'Payment system temporarily unavailable. Please try again in a few minutes.' }
      }
    }
    
    return { error: 'Payment processing failed. Please try again.' }
  }
}