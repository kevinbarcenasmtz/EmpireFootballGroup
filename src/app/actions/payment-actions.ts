// src/app/actions/payment-actions.ts
'use server'

import { randomUUID } from 'crypto'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateServerEnvironment, EnvironmentError } from '@/lib/env-validation'
import { getSquareErrorMessage, logSquareError } from '@/lib/square-errors'
import { sendPaymentEmails, getCollectionAdminEmail } from './email-actions'

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

    // Comprehensive input validation
    const validationError = validatePaymentInputs({
      sourceId,
      collectionSlug,
      amount,
      payerEmail,
      payerName
    })

    if (validationError) {
      return { error: validationError }
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

    // Get admin email for notifications
    const adminEmail = await getCollectionAdminEmail(collection.id)
    
    // Send emails asynchronously (don't block payment success)
    if (adminEmail) {
      console.log('Sending payment emails...')
      
      // Send emails in the background
      sendPaymentEmails(
        payment,
        { ...collection, current_amount: collection.current_amount + amount }, // Updated collection amount
        adminEmail,
        result.payment?.receiptUrl
      ).then(({ receiptResult, adminResult }) => {
        console.log('Email results:', {
          paymentId: payment.id,
          receiptSent: receiptResult.success,
          adminNotified: adminResult.success,
          receiptError: receiptResult.error,
          adminError: adminResult.error
        })
      }).catch(error => {
        console.error('Error sending payment emails:', error)
      })
    } else {
      console.warn('No admin email found for collection, skipping admin notification')
    }

    revalidatePath(`/pay/${collectionSlug}`)
    return { 
      success: true, 
      payment: payment,
      paymentId: result.payment?.id,
      receiptUrl: result.payment?.receiptUrl,
      emailsQueued: !!adminEmail
    }

  } catch (error) {
    console.error('Payment processing error:', error)
    
    if (error instanceof EnvironmentError) {
      console.error('Environment configuration error:', error.message)
      return { error: 'Payment system configuration error. Please contact support.' }
    }
    
    // Handle Square API errors with specific error messages
    if (error && typeof error === 'object' && 'statusCode' in error) {
      logSquareError(error, 'payment-processing')
      const { message } = getSquareErrorMessage(error)
      return { error: message }
    }
    
    return { error: 'Payment processing failed. Please try again.' }
  }
}

/**
 * Validate payment inputs with comprehensive checks
 */
function validatePaymentInputs(inputs: {
  sourceId: string
  collectionSlug: string
  amount: number
  payerEmail: string
  payerName: string
}): string | null {
  const { sourceId, collectionSlug, amount, payerEmail, payerName } = inputs

  // Basic required field validation
  if (!sourceId || !collectionSlug || !amount || !payerEmail || !payerName) {
    return 'All payment fields are required'
  }

  // Amount validation
  if (isNaN(amount) || amount <= 0) {
    return 'Invalid payment amount'
  }

  if (amount < 1) {
    return 'Minimum payment amount is $1.00'
  }

  if (amount > 10000) {
    return 'Maximum payment amount is $10,000'
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(payerEmail)) {
    return 'Please enter a valid email address'
  }

  // Name validation
  const trimmedName = payerName.trim()
  if (trimmedName.length < 2) {
    return 'Please enter a valid name (at least 2 characters)'
  }

  if (trimmedName.length > 100) {
    return 'Name is too long (maximum 100 characters)'
  }

  // Collection slug validation
  if (!/^[a-z0-9-]+$/.test(collectionSlug)) {
    return 'Invalid collection identifier'
  }

  // Source ID validation (basic check for Square token format)
  if (!sourceId.startsWith('ccof:') && !sourceId.startsWith('cnon:')) {
    return 'Invalid payment token format'
  }

  return null // All validations passed
}