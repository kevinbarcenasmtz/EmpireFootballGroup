'use server'

import { Payment, PaymentCollection } from '@/types/database'
import { sendEmail, emailConfig } from '@/lib/email/resend-client'
import { generatePaymentReceiptEmail } from '@/lib/email/templates/payment-receipt'
import { generateAdminNotificationEmail } from '@/lib/email/templates/admin-notification'
import { createClient } from '@/utils/supabase/server'

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Send payment receipt email to the payer
 */
export async function sendPaymentReceiptEmail(
  payment: Payment,
  collection: PaymentCollection,
  receiptUrl?: string
): Promise<EmailResult> {
  try {
    if (!payment.payer_email) {
      return { success: false, error: 'No payer email provided' }
    }

    console.log('Sending payment receipt email:', {
      paymentId: payment.id,
      amount: payment.amount,
      payerEmail: payment.payer_email,
      collectionTitle: collection.title
    })

    const { html, text } = generatePaymentReceiptEmail({
      payment,
      collection,
      receiptUrl
    })

    const result = await sendEmail({
      to: payment.payer_email,
      subject: `Payment Receipt - ${collection.title} | Empire Football Group`,
      html,
      text,
      replyTo: emailConfig.supportEmail
    })

    if (result.success) {
      console.log('Payment receipt email sent successfully:', {
        emailId: result.id,
        paymentId: payment.id
      })
    } else {
      console.error('Failed to send payment receipt email:', result.error)
    }

    return result
  } catch (error) {
    console.error('Error in sendPaymentReceiptEmail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending receipt email'
    }
  }
}

/**
 * Send admin notification email for new payment
 */
export async function sendAdminNotificationEmail(
  payment: Payment,
  collection: PaymentCollection,
  adminEmail: string
): Promise<EmailResult> {
  try {
    console.log('Sending admin notification email:', {
      paymentId: payment.id,
      amount: payment.amount,
      adminEmail,
      collectionTitle: collection.title
    })

    const { html, text } = generateAdminNotificationEmail({
      payment,
      collection,
      adminEmail
    })

    const result = await sendEmail({
      to: adminEmail,
      subject: `💰 New Payment: $${payment.amount.toFixed(2)} for ${collection.title}`,
      html,
      text,
      replyTo: emailConfig.supportEmail
    })

    if (result.success) {
      console.log('Admin notification email sent successfully:', {
        emailId: result.id,
        paymentId: payment.id
      })
    } else {
      console.error('Failed to send admin notification email:', result.error)
    }

    return result
  } catch (error) {
    console.error('Error in sendAdminNotificationEmail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending admin notification'
    }
  }
}

/**
 * Send both receipt and admin notification emails
 */
export async function sendPaymentEmails(
  payment: Payment,
  collection: PaymentCollection,
  adminEmail: string,
  receiptUrl?: string
): Promise<{
  receiptResult: EmailResult
  adminResult: EmailResult
}> {
  try {
    console.log('Sending payment emails:', {
      paymentId: payment.id,
      hasPayerEmail: !!payment.payer_email,
      adminEmail,
      hasReceiptUrl: !!receiptUrl
    })

    // Send both emails concurrently
    const [receiptResult, adminResult] = await Promise.allSettled([
      sendPaymentReceiptEmail(payment, collection, receiptUrl),
      sendAdminNotificationEmail(payment, collection, adminEmail)
    ])

    const receiptRes: EmailResult = receiptResult.status === 'fulfilled' 
      ? receiptResult.value 
      : { success: false, error: receiptResult.reason?.message || 'Receipt email failed' }

    const adminRes: EmailResult = adminResult.status === 'fulfilled'
      ? adminResult.value
      : { success: false, error: adminResult.reason?.message || 'Admin email failed' }

    console.log('Payment emails results:', {
      receiptSuccess: receiptRes.success,
      adminSuccess: adminRes.success,
      paymentId: payment.id
    })

    return {
      receiptResult: receiptRes,
      adminResult: adminRes
    }
  } catch (error) {
    console.error('Error in sendPaymentEmails:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return {
      receiptResult: { success: false, error: errorMessage },
      adminResult: { success: false, error: errorMessage }
    }
  }
}

/**
 * Get admin email for a collection
 */
export async function getCollectionAdminEmail(collectionId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    // Get the admin user for this collection
    const { data: collection, error: collectionError } = await supabase
      .from('payment_collections')
      .select('admin_id')
      .eq('id', collectionId)
      .single()

    if (collectionError || !collection) {
      console.error('Failed to get collection admin:', collectionError)
      return null
    }

    // Get the admin user's email
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(collection.admin_id)

    if (userError || !user?.email) {
      console.error('Failed to get admin user email:', userError)
      return null
    }

    return user.email
  } catch (error) {
    console.error('Error getting collection admin email:', error)
    return null
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<EmailResult> {
  try {
    const testHtml = `
      <h2>Email Configuration Test</h2>
      <p>This is a test email to verify that your Empire Football Group email system is working correctly.</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
      <p>If you receive this email, your configuration is working properly!</p>
    `

    const result = await sendEmail({
      to: emailConfig.adminEmail,
      subject: 'Empire Football Group - Email Test',
      html: testHtml,
      text: 'Empire Football Group email configuration test. If you receive this, your setup is working!'
    })

    console.log('Email configuration test result:', result)
    return result
  } catch (error) {
    console.error('Email configuration test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email test failed'
    }
  }
}