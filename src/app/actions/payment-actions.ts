// src/app/actions/payment-actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { revalidatePath } from 'next/cache';
import { validateServerEnvironment, EnvironmentError } from '@/lib/env-validation';
import { getSquareErrorMessage, logSquareError } from '@/lib/square-errors';
import { sendPaymentEmails, getCollectionAdminEmail } from './email-actions';
import { Client, Environment } from 'square/legacy';

export async function processPayment(formData: FormData) {
  try {
    // Validate server environment first
    const env = validateServerEnvironment();

    const sourceId = formData.get('sourceId') as string;
    const collectionSlug = formData.get('collectionSlug') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const payerEmail = formData.get('payerEmail') as string;
    const payerName = formData.get('payerName') as string;

    // Comprehensive input validation
    const validationError = validatePaymentInputs({
      sourceId,
      collectionSlug,
      amount,
      payerEmail,
      payerName,
    });

    if (validationError) {
      return { error: validationError };
    }

    console.log('Processing payment:', {
      sourceId: sourceId.substring(0, 10) + '...',
      collectionSlug,
      amount,
      payerEmail,
      payerName: payerName.substring(0, 2) + '...',
      environment: env.SQUARE_ENVIRONMENT,
    });

    // Create Square client using legacy SDK
    const squareClient = new Client({
      accessToken: env.SQUARE_ACCESS_TOKEN,
      environment:
        env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
    });

    // Use regular client for reading collection (this is public access)
    const supabase = await createClient();

    // Create service client for database writes (bypasses RLS)
    const serviceSupabase = createServiceClient();

    // Get collection details using regular client (public read access)
    const { data: collection, error: collectionError } = await supabase
      .from('payment_collections')
      .select('*')
      .eq('slug', collectionSlug)
      .eq('is_active', true)
      .single();

    if (collectionError || !collection) {
      console.error('Collection not found:', collectionError);
      return { error: 'Collection not found or inactive' };
    }

    // Check if collection has a maximum and if this payment would exceed it
    if (
      collection.target_amount &&
      collection.current_amount + amount > collection.target_amount * 1.1
    ) {
      return { error: 'This payment would exceed the collection target. Please contact support.' };
    }

    // STEP 1: Generate deterministic idempotency key
    // Use a combination of collection, email, amount, and timestamp (rounded to nearest minute)
    // This prevents duplicate charges within a 1-minute window
    const timestamp = Math.floor(Date.now() / 60000) * 60000; // Round to nearest minute
    const idempotencyKey = `${collectionSlug}-${payerEmail.toLowerCase()}-${amount}-${timestamp}-${sourceId.substring(0, 8)}`;
    
    console.log('Generated idempotency key:', idempotencyKey);

    // STEP 2: Check for existing payment with this idempotency key
    const { data: existingIdempotency } = await serviceSupabase
      .from('payment_idempotency')
      .select('*')
      .eq('key', idempotencyKey)
      .single();

    if (existingIdempotency) {
      console.log('Found existing idempotency record:', existingIdempotency);
      
      // If payment was completed, return the existing payment
      if (existingIdempotency.status === 'completed' && existingIdempotency.payment_id) {
        const { data: existingPayment } = await serviceSupabase
          .from('payments')
          .select('*')
          .eq('id', existingIdempotency.payment_id)
          .single();

        if (existingPayment) {
          console.log('Returning existing successful payment');
          return {
            success: true,
            payment: existingPayment,
            paymentId: existingPayment.square_payment_id,
            isDuplicate: true,
            message: 'This payment has already been processed successfully.'
          };
        }
      }
      
      // If payment is still pending (processing), prevent duplicate
      if (existingIdempotency.status === 'pending') {
        const timeSinceCreation = Date.now() - new Date(existingIdempotency.created_at).getTime();
        
        // If less than 30 seconds old, it's likely still processing
        if (timeSinceCreation < 30000) {
          return { 
            error: 'A payment is already being processed. Please wait a moment and check your email for confirmation.' 
          };
        }
        
        // If older than 30 seconds and still pending, it likely failed
        // Update status to failed and continue with new payment
        await serviceSupabase
          .from('payment_idempotency')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('key', idempotencyKey);
      }
    }

    // STEP 3: Create or update idempotency record
    const { error: idempotencyError } = await serviceSupabase
      .from('payment_idempotency')
      .upsert({
        key: idempotencyKey,
        collection_id: collection.id,
        amount: amount,
        payer_email: payerEmail.toLowerCase().trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (idempotencyError) {
      console.error('Failed to create idempotency record:', idempotencyError);
      return { error: 'Failed to initialize payment. Please try again.' };
    }

    // STEP 4: Process payment with Square
    try {
      const { result } = await squareClient.paymentsApi.createPayment({
        sourceId,
        idempotencyKey: idempotencyKey, // Use our deterministic key
        amountMoney: {
          amount: BigInt(Math.round(amount * 100)), // Convert to cents as BigInt
          currency: 'USD',
        },
        buyerEmailAddress: payerEmail.toLowerCase().trim(), // Add buyer email to Square
        note: `Payment for: ${collection.title}`, // Add payment note
      });

      console.log('Square payment result:', {
        paymentId: result.payment?.id,
        status: result.payment?.status,
        environment: env.SQUARE_ENVIRONMENT,
      });

      // STEP 5: Store payment in database
      const { data: payment, error: paymentError } = await serviceSupabase
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
            idempotency_key: idempotencyKey,
          },
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Database error:', paymentError);
        
        // Update idempotency record to failed
        await serviceSupabase
          .from('payment_idempotency')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('key', idempotencyKey);
          
        return {
          error: 'Failed to record payment. Please contact support with your payment confirmation.',
        };
      }

      // STEP 6: Update idempotency record to completed
      await serviceSupabase
        .from('payment_idempotency')
        .update({ 
          status: 'completed',
          payment_id: payment.id,
          updated_at: new Date().toISOString()
        })
        .eq('key', idempotencyKey);

      // STEP 7: Update collection current_amount
      const { error: updateError } = await serviceSupabase
        .from('payment_collections')
        .update({
          current_amount: collection.current_amount + amount,
        })
        .eq('id', collection.id);

      if (updateError) {
        console.error('Failed to update collection amount:', updateError);
        // Don't fail the payment for this, just log it
      }

      // Get admin email for notifications
      const adminEmail = await getCollectionAdminEmail(collection.id);

      // Send emails asynchronously (don't block payment success)
      if (adminEmail) {
        console.log('Sending payment emails...');

        sendPaymentEmails(
          payment,
          { ...collection, current_amount: collection.current_amount + amount },
          adminEmail,
          result.payment?.receiptUrl
        )
          .then(({ receiptResult, adminResult }) => {
            console.log('Email results:', {
              paymentId: payment.id,
              receiptSent: receiptResult.success,
              adminNotified: adminResult.success,
              receiptError: receiptResult.error,
              adminError: adminResult.error,
            });
          })
          .catch(error => {
            console.error('Error sending payment emails:', error);
          });
      } else {
        console.warn('No admin email found for collection, skipping admin notification');
      }

      revalidatePath(`/pay/${collectionSlug}`);
      return {
        success: true,
        payment: payment,
        paymentId: result.payment?.id,
        receiptUrl: result.payment?.receiptUrl,
        emailsQueued: !!adminEmail,
      };
      
    } catch (squareError) {
      console.error('Square payment error:', squareError);
      
      // Update idempotency record to failed
      await serviceSupabase
        .from('payment_idempotency')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('key', idempotencyKey);
      
      // Handle Square API errors
      if (squareError && typeof squareError === 'object' && 'statusCode' in squareError) {
        logSquareError(squareError, 'payment-processing');
        const { message } = getSquareErrorMessage(squareError);
        return { error: message };
      }
      
      throw squareError; // Re-throw to be caught by outer try-catch
    }
    
  } catch (error) {
    console.error('Payment processing error:', error);

    if (error instanceof EnvironmentError) {
      console.error('Environment configuration error:', error.message);
      return { error: 'Payment system configuration error. Please contact support.' };
    }

    // Handle Square API errors with specific error messages
    if (error && typeof error === 'object' && 'statusCode' in error) {
      logSquareError(error, 'payment-processing');
      const { message } = getSquareErrorMessage(error);
      return { error: message };
    }

    return { error: 'Payment processing failed. Please try again.' };
  }
}

/**
 * Validate payment inputs with comprehensive checks
 */
function validatePaymentInputs(inputs: {
  sourceId: string;
  collectionSlug: string;
  amount: number;
  payerEmail: string;
  payerName: string;
}): string | null {
  const { sourceId, collectionSlug, amount, payerEmail, payerName } = inputs;

  // Basic required field validation
  if (!sourceId || !collectionSlug || !amount || !payerEmail || !payerName) {
    return 'All payment fields are required';
  }

  // Amount validation
  if (isNaN(amount) || amount <= 0) {
    return 'Invalid payment amount';
  }

  if (amount < 1) {
    return 'Minimum payment amount is $1.00';
  }

  if (amount > 10000) {
    return 'Maximum payment amount is $10,000';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payerEmail)) {
    return 'Please enter a valid email address';
  }

  // Name validation
  const trimmedName = payerName.trim();
  if (trimmedName.length < 2) {
    return 'Please enter a valid name (at least 2 characters)';
  }

  if (trimmedName.length > 100) {
    return 'Name is too long (maximum 100 characters)';
  }

  // Collection slug validation
  if (!/^[a-z0-9-]+$/.test(collectionSlug)) {
    return 'Invalid collection identifier';
  }

  // Source ID validation (basic check for Square token format)
  if (!sourceId.startsWith('ccof:') && !sourceId.startsWith('cnon:')) {
    return 'Invalid payment token format';
  }

  return null; // All validations passed
}