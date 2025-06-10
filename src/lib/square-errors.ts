// src/lib/square-errors.ts

export interface SquareError {
    code: string
    category: string
    detail: string
    userMessage: string
    retryable: boolean
  }
  
  export interface SquareErrorResponse {
    statusCode: number
    message: string
    body?: {
      errors?: SquareError[]
    }
  }
  
  /**
   * Maps Square error codes to user-friendly messages
   */
  export function getSquareErrorMessage(error: any): { message: string; retryable: boolean } {
    // Handle different error formats
    let statusCode: number | undefined
    let errorCode: string | undefined
    let errorDetail: string | undefined
  
    // Extract error information from different possible formats
    if (error?.statusCode) {
      statusCode = error.statusCode
    }
  
    if (error?.body?.errors && Array.isArray(error.body.errors) && error.body.errors.length > 0) {
      const squareError = error.body.errors[0]
      errorCode = squareError.code
      errorDetail = squareError.detail
    }
  
    console.log('Processing Square error:', {
      statusCode,
      errorCode,
      errorDetail,
      fullError: error
    })
  
    // Handle by specific error codes first
    if (errorCode) {
      switch (errorCode) {
        case 'CARD_DECLINED':
          return {
            message: 'Your card was declined. Please try a different payment method or contact your bank.',
            retryable: true
          }
        case 'INSUFFICIENT_FUNDS':
          return {
            message: 'Insufficient funds. Please try a different payment method.',
            retryable: true
          }
        case 'CARD_EXPIRED':
          return {
            message: 'Your card has expired. Please use a different payment method.',
            retryable: true
          }
        case 'INVALID_CARD':
          return {
            message: 'Invalid card information. Please check your card details and try again.',
            retryable: true
          }
        case 'CVV_FAILURE':
          return {
            message: 'Invalid security code (CVV). Please check and try again.',
            retryable: true
          }
        case 'ADDRESS_VERIFICATION_FAILURE':
          return {
            message: 'Address verification failed. Please check your billing address.',
            retryable: true
          }
        case 'INVALID_EXPIRATION':
          return {
            message: 'Invalid expiration date. Please check your card details.',
            retryable: true
          }
        case 'GENERIC_DECLINE':
          return {
            message: 'Payment was declined. Please try a different payment method.',
            retryable: true
          }
        case 'PAN_FAILURE':
          return {
            message: 'Invalid card number. Please check and try again.',
            retryable: true
          }
        case 'ALLOWABLE_PIN_TRIES_EXCEEDED':
          return {
            message: 'Too many PIN attempts. Please try again later or use a different card.',
            retryable: false
          }
        case 'PAYMENT_LIMIT_EXCEEDED':
          return {
            message: 'Payment limit exceeded. Please try a smaller amount or contact your bank.',
            retryable: true
          }
        case 'CARD_NOT_SUPPORTED':
          return {
            message: 'This card type is not supported. Please try a different payment method.',
            retryable: true
          }
        case 'VERIFY_CVV':
          return {
            message: 'Please verify your security code (CVV) and try again.',
            retryable: true
          }
        case 'VERIFY_AVS':
          return {
            message: 'Please verify your billing address and try again.',
            retryable: true
          }
        case 'CARD_TOKEN_EXPIRED':
          return {
            message: 'Payment session expired. Please refresh the page and try again.',
            retryable: false
          }
        case 'CARD_TOKEN_USED':
          return {
            message: 'Payment already processed. Please refresh the page.',
            retryable: false
          }
        case 'AMOUNT_TOO_HIGH':
          return {
            message: 'Payment amount is too high. Please try a smaller amount.',
            retryable: true
          }
        case 'AMOUNT_TOO_LOW':
          return {
            message: 'Payment amount is too low. Minimum amount is $1.00.',
            retryable: true
          }
        case 'INVALID_REQUEST_ERROR':
          return {
            message: 'Invalid payment request. Please refresh the page and try again.',
            retryable: false
          }
        case 'RATE_LIMITED':
          return {
            message: 'Too many payment attempts. Please wait a few minutes and try again.',
            retryable: false
          }
        case 'UNAUTHORIZED':
          return {
            message: 'Payment system authentication error. Please contact support.',
            retryable: false
          }
        case 'FORBIDDEN':
          return {
            message: 'Payment not authorized. Please contact support.',
            retryable: false
          }
        case 'NOT_FOUND':
          return {
            message: 'Payment collection not found. Please contact support.',
            retryable: false
          }
        default:
          return {
            message: `Payment error: ${errorDetail || errorCode}. Please try again or contact support.`,
            retryable: true
          }
      }
    }
  
    // Handle by HTTP status codes if no specific error code
    if (statusCode) {
      switch (statusCode) {
        case 400:
          return {
            message: 'Invalid payment information. Please check your card details and try again.',
            retryable: true
          }
        case 401:
          return {
            message: 'Payment system authentication error. Please contact support.',
            retryable: false
          }
        case 402:
          return {
            message: 'Payment was declined. Please try a different payment method.',
            retryable: true
          }
        case 403:
          return {
            message: 'Payment not authorized. Please contact support.',
            retryable: false
          }
        case 404:
          return {
            message: 'Payment collection not found. Please contact support.',
            retryable: false
          }
        case 409:
          return {
            message: 'Payment already processed or duplicate transaction detected.',
            retryable: false
          }
        case 422:
          return {
            message: 'Invalid payment data. Please check your information and try again.',
            retryable: true
          }
        case 429:
          return {
            message: 'Too many payment attempts. Please wait a few minutes and try again.',
            retryable: false
          }
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            message: 'Payment system temporarily unavailable. Please try again in a few minutes.',
            retryable: true
          }
        default:
          return {
            message: 'Payment processing failed. Please try again or contact support.',
            retryable: true
          }
      }
    }
  
    // Fallback for unknown errors
    return {
      message: 'Payment processing failed. Please try again or contact support.',
      retryable: true
    }
  }
  
  /**
   * Determines if an error should trigger a retry
   */
  export function isRetryableError(error: any): boolean {
    const { retryable } = getSquareErrorMessage(error)
    return retryable
  }
  
  /**
   * Log Square errors for debugging (without exposing sensitive data)
   */
  export function logSquareError(error: any, context: string = 'unknown') {
    const safeError = {
      context,
      statusCode: error?.statusCode,
      errorCode: error?.body?.errors?.[0]?.code,
      errorCategory: error?.body?.errors?.[0]?.category,
      timestamp: new Date().toISOString(),
      // Don't log sensitive data like tokens, card numbers, etc.
    }
  
    console.error('Square API Error:', safeError)
  
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service
      // Example: Sentry.captureException(error, { extra: safeError })
    }
  }