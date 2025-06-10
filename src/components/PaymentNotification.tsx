'use client'

import { useState, useEffect } from 'react'
import { Payment } from '@/types/database'

interface PaymentNotificationProps {
  payment: Payment
  onDismiss: () => void
  autoHideDuration?: number
}

export function PaymentNotification({ 
  payment, 
  onDismiss, 
  autoHideDuration = 5000 
}: PaymentNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoHideDuration)
      
      return () => clearTimeout(timer)
    }
  }, [autoHideDuration])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss()
    }, 300) // Wait for exit animation
  }

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ease-in-out transform
      ${isVisible && !isExiting 
        ? 'translate-x-0 opacity-100' 
        : 'translate-x-full opacity-0'
      }
    `}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Success icon */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-text-primary">
                New Payment Received!
              </h4>
              <div className="mt-1 text-sm text-text-secondary">
                <p className="font-semibold text-green-600">
                  ${payment.amount.toFixed(2)}
                </p>
                {payment.payer_name && (
                  <p className="truncate">
                    from {payment.payer_name}
                  </p>
                )}
                <p className="text-xs text-text-muted">
                  {new Date(payment.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Progress bar for auto-hide */}
        {autoHideDuration > 0 && (
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div 
              className="bg-penn-red h-1 rounded-full transition-all ease-linear"
              style={{
                width: '100%',
                animation: `shrink ${autoHideDuration}ms linear`
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}