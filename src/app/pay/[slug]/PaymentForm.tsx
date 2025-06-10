// src/app/pay/[slug]/PaymentForm.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { processPayment } from '@/app/actions/payment-actions'
import { PaymentCollection } from '@/types/database'
import { getClientEnvironment } from '@/lib/env-validation'
import { PaymentRetryManager } from '@/lib/payment-retry'
import { getSquareErrorMessage } from '@/lib/square-errors'

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
  const [isInitializing, setIsInitializing] = useState(true)
  const [initializationError, setInitializationError] = useState<string>('')
  const [retryState, setRetryState] = useState<{
    isRetrying: boolean
    attempt: number
    maxAttempts: number
    canRetry: boolean
  }>({
    isRetrying: false,
    attempt: 0,
    maxAttempts: 3,
    canRetry: true
  })
  
  const cardRef = useRef<any>(null)
  const paymentsRef = useRef<any>(null)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const retryManagerRef = useRef<PaymentRetryManager>(new PaymentRetryManager())

  const finalAmount = useCustomAmount ? parseFloat(customAmount) || 0 : amount
  const isFormValid = finalAmount >= 1 && payerName.trim() && payerEmail.trim()

  // Initialize Square Web Payments SDK
  useEffect(() => {
    const initializeSquare = async () => {
      try {
        // Get environment variables
        const env = getClientEnvironment()
        
        console.log('Environment variables check:', {
          hasSquareAppId: !!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
          squareAppIdLength: env.NEXT_PUBLIC_SQUARE_APPLICATION_ID?.length || 0,
          hasSquareLocationId: !!env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
          squareLocationIdLength: env.NEXT_PUBLIC_SQUARE_LOCATION_ID?.length || 0,
        })

        // Check if required Square variables exist
        if (!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || !env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
          const missing = []
          if (!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID) missing.push('NEXT_PUBLIC_SQUARE_APPLICATION_ID')
          if (!env.NEXT_PUBLIC_SQUARE_LOCATION_ID) missing.push('NEXT_PUBLIC_SQUARE_LOCATION_ID')
          
          throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
        }

        // Check if Square SDK is loaded
        if (typeof window === 'undefined' || !window.Square) {
          throw new Error('Square SDK not loaded')
        }

        // Check if the card container element exists
        const cardContainer = document.getElementById('card-container')
        if (!cardContainer) {
          throw new Error('The element #card-container was not found')
        }

        console.log('Card container found, initializing Square...')
        console.log('Initializing Square with:', {
          applicationId: env.NEXT_PUBLIC_SQUARE_APPLICATION_ID.substring(0, 20) + '...',
          locationId: env.NEXT_PUBLIC_SQUARE_LOCATION_ID.substring(0, 10) + '...'
        })

        const payments = window.Square.payments(
          env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
          env.NEXT_PUBLIC_SQUARE_LOCATION_ID
        )
        
        paymentsRef.current = payments
        
        const card = await payments.card({
          style: {
            input: {
              fontSize: '14px',
              fontFamily: 'inherit',
              color: '#374151',
            },
            '.input-container': {
              borderRadius: '6px',
              borderColor: '#D1D5DB',
            },
            '.input-container.is-focus': {
              borderColor: '#9F1315',
            },
            '.input-container.is-error': {
              borderColor: '#EF4444',
            },
          }
        })
        
        await card.attach('#card-container')
        
        cardRef.current = card
        setSquareInitialized(true)
        setError('')
        setInitializationError('')
        console.log('Square initialized successfully')
        
      } catch (error) {
        console.error('Failed to initialize Square:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setInitializationError(errorMessage)
        
        if (errorMessage.includes('Missing required environment variables')) {
          setError(`Configuration error: ${errorMessage}. Please contact support.`)
        } else if (errorMessage.includes('#card-container was not found')) {
          setError('Payment form container not ready. Please try again.')
        } else {
          setError('Failed to load payment form. Please refresh the page and try again.')
        }
      } finally {
        setIsInitializing(false)
      }
    }

    // Wait for both Square SDK and DOM to be ready
    let attempts = 0
    const maxAttempts = 20
    
    const tryInitialize = () => {
      attempts++
      console.log(`Square initialization attempt ${attempts}/${maxAttempts}`)
      
      // Check if Square SDK is available
      if (typeof window === 'undefined' || !window.Square) {
        console.log('Square SDK not ready, retrying...')
        if (attempts < maxAttempts) {
          setTimeout(tryInitialize, 1000)
        } else {
          console.error('Square SDK failed to load after maximum attempts')
          setError('Payment system could not load. Please refresh the page.')
          setInitializationError('Square SDK failed to load')
          setIsInitializing(false)
        }
        return
      }

      // Check if the card container element exists
      const cardContainer = document.getElementById('card-container')
      if (!cardContainer) {
        console.log('Card container not ready, retrying...')
        if (attempts < maxAttempts) {
          setTimeout(tryInitialize, 500)
        } else {
          console.error('Card container failed to render after maximum attempts')
          setError('Payment form could not initialize. Please refresh the page.')
          setInitializationError('Card container element not found')
          setIsInitializing(false)
        }
        return
      }

      // Both Square SDK and card container are ready
      console.log('Square SDK and card container both ready, initializing...')
      initializeSquare()
    }

    // Start trying to initialize after a short delay
    const timer = setTimeout(tryInitialize, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result)
    setSuccess(true)
    setIsProcessing(false)
    setRetryState(prev => ({ ...prev, isRetrying: false, attempt: 0 }))
  }

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error)
    
    // Get user-friendly error message
    const { message, retryable } = getSquareErrorMessage(error)
    setError(message)
    
    // Update retry state
    const currentRetryState = retryManagerRef.current.getRetryState()
    setRetryState({
      isRetrying: false,
      attempt: currentRetryState.attempt,
      maxAttempts: currentRetryState.totalAttempts,
      canRetry: retryable && currentRetryState.canRetry
    })
    
    setIsProcessing(false)
  }

  const executePayment = async (): Promise<any> => {
    if (!cardRef.current) {
      throw new Error('Payment form not initialized')
    }

    // Tokenize the card
    const tokenResult = await cardRef.current.tokenize()
    
    if (tokenResult.status !== 'OK') {
      throw new Error('Card validation failed. Please check your payment information.')
    }

    // Process payment via server action
    const formData = new FormData()
    formData.append('sourceId', tokenResult.token)
    formData.append('collectionSlug', collection.slug)
    formData.append('amount', finalAmount.toString())
    formData.append('payerEmail', payerEmail)
    formData.append('payerName', payerName)

    const result = await processPayment(formData)

    if (result.error) {
      // Create error object for retry manager
      const error = new Error(result.error)
      ;(error as any).isServerError = true
      throw error
    }

    return result
  }

  const handlePayNow = async () => {
    if (!isFormValid) return

    setIsProcessing(true)
    setError('')

    try {
      // Execute payment with retry logic
      const result = await retryManagerRef.current.executeWithRetry(
        executePayment,
        (attempt, error) => {
          console.log(`Payment retry attempt ${attempt}:`, error.message)
          setRetryState(prev => ({
            ...prev,
            isRetrying: true,
            attempt: attempt
          }))
        }
      )

      handlePaymentSuccess(result)
    } catch (error) {
      handlePaymentError(error)
    }
  }

  const handleRetryPayment = async () => {
    // Reset retry manager and try again
    retryManagerRef.current.reset()
    setRetryState(prev => ({ ...prev, attempt: 0, canRetry: true }))
    await handlePayNow()
  }

  const handleRetryInitialization = () => {
    setIsInitializing(true)
    setInitializationError('')
    setError('')
    setSquareInitialized(false)
    // Force a page reload to restart everything cleanly
    window.location.reload()
  }

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="bg-contrast rounded-lg border border-gray-200 p-8 text-center shadow-sm dark:border-gray-700">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-penn-red"></div>
          <span className="text-text-primary">Loading payment form...</span>
        </div>
        <p className="text-text-secondary text-sm">
          Setting up secure payment processing
        </p>
        <p className="text-text-muted text-xs mt-2">
          This may take a few seconds
        </p>
        
        {/* Render the card container early so it's available when Square tries to attach */}
        <div className="hidden">
          <div id="card-container"></div>
        </div>
      </div>
    )
  }

  // Show error state if initialization failed
  if (initializationError && !squareInitialized) {
    return (
      <div className="bg-contrast rounded-lg border border-gray-200 p-8 text-center shadow-sm dark:border-gray-700">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h2 className="text-text-primary text-xl font-bold mb-4">
          Payment System Unavailable
        </h2>
        <div className="text-left bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800 text-sm font-medium mb-2">Error Details:</p>
          <p className="text-red-700 text-sm">{initializationError}</p>
        </div>
        <div className="space-y-2 mb-4">
          <button
            onClick={handleRetryInitialization}
            className="bg-penn-red hover:bg-lighter-red text-white px-6 py-2 rounded-md transition-colors mr-2"
          >
            Try Again
          </button>
        </div>
        <p className="text-text-muted text-xs">
          If this problem persists, please contact support
        </p>
      </div>
    )
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
      
      {/* Development info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <p className="text-blue-800 text-xs">
            Debug: Square initialized: {squareInitialized ? 'Yes' : 'No'}
            {retryState.attempt > 0 && ` | Retry attempt: ${retryState.attempt}/${retryState.maxAttempts}`}
          </p>
        </div>
      )}
      
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
          ref={cardContainerRef}
          className="min-h-[60px] border border-gray-300 rounded-md p-2 bg-white"
        ></div>
        {!squareInitialized && !isInitializing && (
          <p className="text-text-muted text-sm mt-1">
            Payment form not ready. Please refresh the page.
          </p>
        )}
        {squareInitialized && (
          <p className="text-green-600 text-sm mt-1">
            ✓ Secure payment form ready
          </p>
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

      {/* Retry State Display */}
      {retryState.isRetrying && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <p className="text-yellow-800 text-sm">
              Retrying payment... (attempt {retryState.attempt}/{retryState.maxAttempts})
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
          {retryState.canRetry && retryState.attempt > 0 && (
            <button
              onClick={handleRetryPayment}
              className="mt-2 text-penn-red hover:text-lighter-red text-sm font-medium underline"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Processing State */}
      {isProcessing && !retryState.isRetrying && (
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

      {!squareInitialized && !isProcessing && !isInitializing && (
        <p className="text-text-muted text-sm text-center mt-2">
          Payment form failed to load. Please try again.
        </p>
      )}
    </div>
  )
}