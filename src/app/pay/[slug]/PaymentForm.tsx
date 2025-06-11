// src/app/pay/[slug]/PaymentForm.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { processPayment } from '@/app/actions/payment-actions';
import { PaymentCollection } from '@/types/database';
import { getClientEnvironment } from '@/lib/env-validation';
import { PaymentRetryManager } from '@/lib/payment-retry';
import { getSquareErrorMessage } from '@/lib/square-errors';

interface PaymentFormProps {
  collection: PaymentCollection;
}

const SUGGESTED_AMOUNTS = [5, 10, 20, 25];

// Square SDK types
interface SquareTokenizeResult {
  status: 'OK' | 'ERROR';
  token?: string;
  errors?: Array<{
    type: string;
    field: string;
    message: string;
  }>;
}

interface SquareCard {
  tokenize(): Promise<SquareTokenizeResult>;
  attach(selector: string): Promise<void>;
}

interface SquareCardOptions {
  style: {
    input: {
      fontSize: string;
      fontFamily: string;
      color: string;
    };
    '.input-container': {
      borderRadius: string;
      borderColor: string;
    };
    '.input-container.is-focus': {
      borderColor: string;
    };
    '.input-container.is-error': {
      borderColor: string;
    };
  };
}

interface SquarePayments {
  card(options: SquareCardOptions): Promise<SquareCard>;
}

interface SquareSDK {
  payments(applicationId: string, locationId: string): SquarePayments;
}

interface PaymentResult {
  paymentId?: string;
  receiptUrl?: string;
  success: boolean;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  maxAttempts: number;
  canRetry: boolean;
}

// Declare Square types for TypeScript
declare global {
  interface Window {
    Square: SquareSDK;
  }
}

export default function PaymentForm({ collection }: PaymentFormProps) {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [squareInitialized, setSquareInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string>('');
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    maxAttempts: 3,
    canRetry: true,
  });

  const cardRef = useRef<SquareCard | null>(null);
  const paymentsRef = useRef<SquarePayments | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const retryManagerRef = useRef<PaymentRetryManager>(new PaymentRetryManager());

  const finalAmount = useCustomAmount ? parseFloat(customAmount) || 0 : amount;
  const isFormValid = finalAmount >= 1 && payerName.trim() && payerEmail.trim();

  // Initialize Square Web Payments SDK
  useEffect(() => {
    const initializeSquare = async () => {
      try {
        // Get environment variables
        const env = getClientEnvironment();

        console.log('Environment variables check:', {
          hasSquareAppId: !!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
          squareAppIdLength: env.NEXT_PUBLIC_SQUARE_APPLICATION_ID?.length || 0,
          hasSquareLocationId: !!env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
          squareLocationIdLength: env.NEXT_PUBLIC_SQUARE_LOCATION_ID?.length || 0,
        });

        // Check if required Square variables exist
        if (!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || !env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
          const missing = [];
          if (!env.NEXT_PUBLIC_SQUARE_APPLICATION_ID)
            missing.push('NEXT_PUBLIC_SQUARE_APPLICATION_ID');
          if (!env.NEXT_PUBLIC_SQUARE_LOCATION_ID) missing.push('NEXT_PUBLIC_SQUARE_LOCATION_ID');

          throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        // Check if Square SDK is loaded
        if (typeof window === 'undefined' || !window.Square) {
          throw new Error('Square SDK not loaded');
        }

        // Check if the card container element exists
        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) {
          throw new Error('The element #card-container was not found');
        }

        console.log('Card container found, initializing Square...');
        console.log('Initializing Square with:', {
          applicationId: env.NEXT_PUBLIC_SQUARE_APPLICATION_ID.substring(0, 20) + '...',
          locationId: env.NEXT_PUBLIC_SQUARE_LOCATION_ID.substring(0, 10) + '...',
        });

        const payments = window.Square.payments(
          env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
          env.NEXT_PUBLIC_SQUARE_LOCATION_ID
        );

        paymentsRef.current = payments;

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
          },
        });

        await card.attach('#card-container');

        cardRef.current = card;
        setSquareInitialized(true);
        setError('');
        setInitializationError('');
        console.log('Square initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Square:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setInitializationError(errorMessage);

        if (errorMessage.includes('Missing required environment variables')) {
          setError(`Configuration error: ${errorMessage}. Please contact support.`);
        } else if (errorMessage.includes('#card-container was not found')) {
          setError('Payment form container not ready. Please try again.');
        } else {
          setError('Failed to load payment form. Please refresh the page and try again.');
        }
      } finally {
        setIsInitializing(false);
      }
    };

    // Wait for both Square SDK and DOM to be ready
    let attempts = 0;
    const maxAttempts = 20;

    const tryInitialize = () => {
      attempts++;
      console.log(`Square initialization attempt ${attempts}/${maxAttempts}`);

      // Check if Square SDK is available
      if (typeof window === 'undefined' || !window.Square) {
        console.log('Square SDK not ready, retrying...');
        if (attempts < maxAttempts) {
          setTimeout(tryInitialize, 1000);
        } else {
          console.error('Square SDK failed to load after maximum attempts');
          setError('Payment system could not load. Please refresh the page.');
          setInitializationError('Square SDK failed to load');
          setIsInitializing(false);
        }
        return;
      }

      // Check if the card container element exists
      const cardContainer = document.getElementById('card-container');
      if (!cardContainer) {
        console.log('Card container not ready, retrying...');
        if (attempts < maxAttempts) {
          setTimeout(tryInitialize, 500);
        } else {
          console.error('Card container failed to render after maximum attempts');
          setError('Payment form could not initialize. Please refresh the page.');
          setInitializationError('Card container element not found');
          setIsInitializing(false);
        }
        return;
      }

      // Both Square SDK and card container are ready
      console.log('Square SDK and card container both ready, initializing...');
      initializeSquare();
    };

    // Start trying to initialize after a short delay
    const timer = setTimeout(tryInitialize, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentResult(result);
    setSuccess(true);
    setIsProcessing(false);
    setRetryState(prev => ({ ...prev, isRetrying: false, attempt: 0 }));
  };

  const handlePaymentError = (error: Error | unknown) => {
    console.error('Payment error:', error);

    // Get user-friendly error message
    const { message, retryable } = getSquareErrorMessage(error);
    setError(message);

    // Update retry state
    const currentRetryState = retryManagerRef.current.getRetryState();
    setRetryState({
      isRetrying: false,
      attempt: currentRetryState.attempt,
      maxAttempts: currentRetryState.totalAttempts,
      canRetry: retryable && currentRetryState.canRetry,
    });

    setIsProcessing(false);
  };

  const executePayment = async (): Promise<PaymentResult> => {
    if (!cardRef.current) {
      throw new Error('Payment form not initialized');
    }

    // Tokenize the card
    const tokenResult = await cardRef.current.tokenize();

    if (tokenResult.status !== 'OK') {
      throw new Error('Card validation failed. Please check your payment information.');
    }

    if (!tokenResult.token) {
      throw new Error('Failed to generate payment token.');
    }

    // Process payment via server action
    const formData = new FormData();
    formData.append('sourceId', tokenResult.token);
    formData.append('collectionSlug', collection.slug);
    formData.append('amount', finalAmount.toString());
    formData.append('payerEmail', payerEmail);
    formData.append('payerName', payerName);

    const result = await processPayment(formData);

    if (result.error) {
      // Create error object for retry manager
      const error = new Error(result.error);
      (error as Error & { isServerError: boolean }).isServerError = true;
      throw error;
    }

    return result as PaymentResult;
  };

  const handlePayNow = async () => {
    if (!isFormValid) return;

    setIsProcessing(true);
    setError('');

    try {
      // Execute payment with retry logic
      const result = await retryManagerRef.current.executeWithRetry(
        executePayment,
        (attempt, error) => {
          console.log(`Payment retry attempt ${attempt}:`, error.message);
          setRetryState(prev => ({
            ...prev,
            isRetrying: true,
            attempt: attempt,
          }));
        }
      );

      handlePaymentSuccess(result);
    } catch (error) {
      handlePaymentError(error);
    }
  };

  const handleRetryPayment = async () => {
    // Reset retry manager and try again
    retryManagerRef.current.reset();
    setRetryState(prev => ({ ...prev, attempt: 0, canRetry: true }));
    await handlePayNow();
  };

  const handleRetryInitialization = () => {
    setIsInitializing(true);
    setInitializationError('');
    setError('');
    setSquareInitialized(false);
    // Force a page reload to restart everything cleanly
    window.location.reload();
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="bg-contrast rounded-lg border border-gray-200 p-8 text-center shadow-sm dark:border-gray-700">
        <div className="mb-4 flex items-center justify-center space-x-2">
          <div className="border-penn-red h-6 w-6 animate-spin rounded-full border-b-2"></div>
          <span className="text-text-primary">Loading payment form...</span>
        </div>
        <p className="text-text-secondary text-sm">Setting up secure payment processing</p>
        <p className="text-text-muted mt-2 text-xs">This may take a few seconds</p>

        {/* Render the card container early so it's available when Square tries to attach */}
        <div className="hidden">
          <div id="card-container"></div>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (initializationError && !squareInitialized) {
    return (
      <div className="bg-contrast rounded-lg border border-gray-200 p-8 text-center shadow-sm dark:border-gray-700">
        <div className="mb-4 text-4xl text-red-600">⚠️</div>
        <h2 className="text-text-primary mb-4 text-xl font-bold">Payment System Unavailable</h2>
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-left">
          <p className="mb-2 text-sm font-medium text-red-800">Error Details:</p>
          <p className="text-sm text-red-700">{initializationError}</p>
        </div>
        <div className="mb-4 space-y-2">
          <button
            onClick={handleRetryInitialization}
            className="bg-penn-red hover:bg-lighter-red mr-2 rounded-md px-6 py-2 text-white transition-colors"
          >
            Try Again
          </button>
        </div>
        <p className="text-text-muted text-xs">If this problem persists, please contact support</p>
      </div>
    );
  }

  if (success && paymentResult) {
    return (
      <div className="bg-contrast rounded-lg border border-gray-200 p-8 text-center shadow-sm dark:border-gray-700">
        <div className="mb-4 text-5xl text-green-600">✓</div>
        <h2 className="text-text-primary mb-4 text-2xl font-bold">Payment Successful!</h2>
        <div className="mb-6 space-y-2">
          <p className="text-text-secondary">
            Thank you for your contribution of{' '}
            <span className="font-semibold">${finalAmount.toFixed(2)}</span>
          </p>
          {paymentResult.paymentId && (
            <p className="text-text-muted text-sm">Payment ID: {paymentResult.paymentId}</p>
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
        <p className="text-text-muted text-sm">A confirmation has been sent to {payerEmail}</p>
      </div>
    );
  }

  return (
    <div className="bg-contrast rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700">
      <h2 className="text-text-primary mb-6 text-xl font-bold">Make a Payment</h2>

      {/* Development info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-800">
            Debug: Square initialized: {squareInitialized ? 'Yes' : 'No'}
            {retryState.attempt > 0 &&
              ` | Retry attempt: ${retryState.attempt}/${retryState.maxAttempts}`}
          </p>
        </div>
      )}

      {/* Amount Selection */}
      <div className="mb-6">
        <label className="text-text-primary mb-3 block text-sm font-medium">Select Amount</label>

        {/* Suggested Amounts */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SUGGESTED_AMOUNTS.map(suggestedAmount => (
            <button
              key={suggestedAmount}
              type="button"
              onClick={() => {
                setAmount(suggestedAmount);
                setUseCustomAmount(false);
                setError('');
              }}
              className={`rounded-md border p-3 text-center transition-colors ${
                !useCustomAmount && amount === suggestedAmount
                  ? 'border-penn-red bg-penn-red text-white'
                  : 'text-text-primary hover:border-penn-red border-gray-300'
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
            onChange={e => {
              setUseCustomAmount(e.target.checked);
              setError('');
            }}
            className="text-penn-red focus:ring-penn-red h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="custom-amount" className="text-text-primary text-sm">
            Custom amount:
          </label>
          <div className="relative flex-1">
            <span className="text-text-secondary absolute top-1/2 left-3 -translate-y-1/2">$</span>
            <input
              type="number"
              step="0.01"
              min="1"
              value={customAmount}
              onChange={e => {
                setCustomAmount(e.target.value);
                setError('');
              }}
              disabled={!useCustomAmount}
              placeholder="1.00"
              className="bg-background text-text-primary border-text-secondary focus:border-penn-red focus:ring-penn-red w-full rounded-md border py-2 pr-3 pl-7 text-sm focus:ring-1 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {finalAmount < 1 && finalAmount > 0 && (
          <p className="mt-1 text-sm text-red-600">Minimum payment amount is $1.00</p>
        )}
      </div>

      {/* Payer Information */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-text-primary mb-1 block text-sm font-medium">Full Name *</label>
          <input
            type="text"
            required
            value={payerName}
            onChange={e => {
              setPayerName(e.target.value);
              setError('');
            }}
            disabled={isProcessing}
            className="bg-background text-text-primary border-text-secondary focus:border-penn-red focus:ring-penn-red w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-text-primary mb-1 block text-sm font-medium">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={payerEmail}
            onChange={e => {
              setPayerEmail(e.target.value);
              setError('');
            }}
            disabled={isProcessing}
            className="bg-background text-text-primary border-text-secondary focus:border-penn-red focus:ring-penn-red w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Square Card Container */}
      <div className="mb-6">
        <label className="text-text-primary mb-3 block text-sm font-medium">
          Payment Information
        </label>
        <div
          id="card-container"
          ref={cardContainerRef}
          className="min-h-[60px] rounded-md border border-gray-300 bg-white p-2"
        ></div>
        {!squareInitialized && !isInitializing && (
          <p className="text-text-muted mt-1 text-sm">
            Payment form not ready. Please refresh the page.
          </p>
        )}
        {squareInitialized && (
          <p className="mt-1 text-sm text-green-600">✓ Secure payment form ready</p>
        )}
      </div>

      {/* Payment Summary */}
      <div className="mb-4 rounded-md bg-gray-50 p-4 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">Total Amount:</span>
          <span className="text-text-primary text-lg font-bold">${finalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Retry State Display */}
      {retryState.isRetrying && (
        <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-yellow-600"></div>
            <p className="text-sm text-yellow-800">
              Retrying payment... (attempt {retryState.attempt}/{retryState.maxAttempts})
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
          {retryState.canRetry && retryState.attempt > 0 && (
            <button
              onClick={handleRetryPayment}
              className="text-penn-red hover:text-lighter-red mt-2 text-sm font-medium underline"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Processing State */}
      {isProcessing && !retryState.isRetrying && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-800">Processing your payment...</p>
          </div>
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePayNow}
        disabled={!isFormValid || !squareInitialized || isProcessing}
        className="bg-penn-red hover:bg-lighter-red w-full rounded-md px-6 py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : `Pay $${finalAmount.toFixed(2)}`}
      </button>

      {!isFormValid && (
        <p className="text-text-muted mt-2 text-center text-sm">
          {finalAmount < 1
            ? 'Enter amount of $1.00 or more'
            : 'Complete all required fields to continue'}
        </p>
      )}

      {!squareInitialized && !isProcessing && !isInitializing && (
        <p className="text-text-muted mt-2 text-center text-sm">
          Payment form failed to load. Please try again.
        </p>
      )}
    </div>
  );
}
