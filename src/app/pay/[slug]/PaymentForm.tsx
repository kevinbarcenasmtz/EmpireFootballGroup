// src/app/pay/[slug]/PaymentForm.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { processPayment } from '@/app/actions/payment-actions'
import { PaymentCollection } from '@/types/database'

interface PaymentFormProps {
  collection: PaymentCollection
}

const SUGGESTED_AMOUNTS = [5, 10, 20, 25]

// Declare Square types for TypeScript
declare global {
  interface Window {
    Square: any
  }
}

export default function PaymentForm({ collection }: PaymentFormProps) {
  const [amount, setAmount] = useState<number>(50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [useCustomAmount, setUseCustomAmount] = useState(false)
  const [payerName, setPayerName] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [squareInitialized, setSquareInitialized] = useState(false)
  
  const cardRef = useRef<any>(null)
  const paymentsRef = useRef<any>(null)

  const finalAmount = useCustomAmount ? parseFloat(customAmount) || 0 : amount
  const isFormValid = finalAmount >= 1 && payerName.trim() && payerEmail.trim()

  // Initialize Square Web Payments SDK
  useEffect(() => {
    const initializeSquare = async () => {
      if (typeof window !== 'undefined' && window.Square) {
        try {
          const payments = window.Square.payments(
            process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
            process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
          )
          
          paymentsRef.current = payments
          
          const card = await payments.card()
          await card.attach('#card-container')
          
          cardRef.current = card
          setSquareInitialized(true)
        } catch (error) {
          console.error('Failed to initialize Square:', error)
          setError('Failed to load payment form. Please refresh the page.')
        }
      }
    }

    // Wait a bit for Square script to load
    const timer = setTimeout(initializeSquare, 100)
    return () => clearTimeout(timer)
  }, [])

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result)
    setSuccess(true)
    setIsProcessing(false)
  }

  const handlePayNow = async () => {
    if (!cardRef.current || !isFormValid) return

    setIsProcessing(true)
    setError('')

    try {
      // Tokenize the card
      const tokenResult = await cardRef.current.tokenize()
      
      if (tokenResult.status === 'OK') {
        // Process payment via server action
        const formData = new FormData()
        formData.append('sourceId', tokenResult.token)
        formData.append('collectionSlug', collection.slug)
        formData.append('amount', finalAmount.toString())
        formData.append('payerEmail', payerEmail)
        formData.append('payerName', payerName)

        const result = await processPayment(formData)

        if (result.error) {
          setError(result.error)
          setIsProcessing(false)
        } else {
          handlePaymentSuccess(result)
        }
      } else {
        setError('Card validation failed. Please check your payment information.')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('Payment processing failed. Please try again.')
      setIsProcessing(false)
    }
  }

  if (success && paymentResult) {
    return (
      <div className="bg-contrast rounded-lg border border-gray-200 p-8 text-center shadow-sm dark:border-gray-700">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-text-primary text-2xl font-bold mb-4">
          Payment Successful!
        </h2>
        <div className="space-y-2 mb-6">
          <p className="text-text-secondary">
            Thank you for your contribution of <span className="font-semibold">${finalAmount.toFixed(2)}</span>
          </p>
          {paymentResult.paymentId && (
            <p className="text-text-muted text-sm">
              Payment ID: {paymentResult.paymentId}
            </p>
          )}
          {paymentResult.receiptUrl && (
            <a 
              href={paymentResult.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-penn-red hover:text-lighter-red text-sm underline"
            >
              View Receipt
            </a>
          )}
        </div>
        <p className="text-text-muted text-sm">
          A confirmation has been sent to {payerEmail}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
      <h2 className="text-text-primary text-xl font-bold mb-6">Make a Payment</h2>
      
      {/* Amount Selection */}
      <div className="mb-6">
        <label className="text-text-primary block text-sm font-medium mb-3">
          Select Amount
        </label>
        
        {/* Suggested Amounts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {SUGGESTED_AMOUNTS.map((suggestedAmount) => (
            <button
              key={suggestedAmount}
              type="button"
              onClick={() => {
                setAmount(suggestedAmount)
                setUseCustomAmount(false)
                setError('')
              }}
              className={`p-3 text-center border rounded-md transition-colors ${
                !useCustomAmount && amount === suggestedAmount
                  ? 'border-penn-red bg-penn-red text-white'
                  : 'border-gray-300 text-text-primary hover:border-penn-red'
              }`}
            >
              ${suggestedAmount}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="custom-amount"
            checked={useCustomAmount}
            onChange={(e) => {
              setUseCustomAmount(e.target.checked)
              setError('')
            }}
            className="h-4 w-4 text-penn-red focus:ring-penn-red border-gray-300 rounded"
          />
          <label htmlFor="custom-amount" className="text-text-primary text-sm">
            Custom amount:
          </label>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="1"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setError('')
              }}
              disabled={!useCustomAmount}
              placeholder="1.00"
              className="bg-background text-text-primary border-text-secondary w-full rounded-md border pl-7 pr-3 py-2 text-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red disabled:opacity-50"
            />
          </div>
        </div>
        
        {finalAmount < 1 && finalAmount > 0 && (
          <p className="text-red-600 text-sm mt-1">
            Minimum payment amount is $1.00
          </p>
        )}
      </div>

      {/* Payer Information */}
      <div className="grid gap-4 mb-6 sm:grid-cols-2">
        <div>
          <label className="text-text-primary block text-sm font-medium mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={payerName}
            onChange={(e) => {
              setPayerName(e.target.value)
              setError('')
            }}
            disabled={isProcessing}
            className="bg-background text-text-primary border-text-secondary w-full rounded-md border px-3 py-2 text-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-text-primary block text-sm font-medium mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={payerEmail}
            onChange={(e) => {
              setPayerEmail(e.target.value)
              setError('')
            }}
            disabled={isProcessing}
            className="bg-background text-text-primary border-text-secondary w-full rounded-md border px-3 py-2 text-sm focus:border-penn-red focus:outline-none focus:ring-1 focus:ring-penn-red disabled:opacity-50"
          />
        </div>
      </div>

      {/* Square Card Container */}
      <div className="mb-6">
        <label className="text-text-primary block text-sm font-medium mb-3">
          Payment Information
        </label>
        <div 
          id="card-container" 
          className="min-h-[60px] border border-gray-300 rounded-md p-2"
        ></div>
        {!squareInitialized && (
          <p className="text-text-muted text-sm mt-1">Loading payment form...</p>
        )}
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary text-sm">Total Amount:</span>
          <span className="text-text-primary text-lg font-bold">
            ${finalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-blue-800 text-sm">Processing your payment...</p>
          </div>
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePayNow}
        disabled={!isFormValid || !squareInitialized || isProcessing}
        className="w-full bg-penn-red hover:bg-lighter-red text-white font-semibold py-3 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay $${finalAmount.toFixed(2)}`}
      </button>

      {!isFormValid && (
        <p className="text-text-muted text-sm text-center mt-2">
          {finalAmount < 1 ? 'Enter amount of $1.00 or more' : 'Complete all required fields to continue'}
        </p>
      )}
    </div>
  )
}