'use client'

import { useState, useEffect } from 'react'
import { PaymentNotification } from './PaymentNotification'
import { Payment } from '@/types/database'

interface NotificationItem {
  id: string
  payment: Payment
  timestamp: number
}

interface PaymentNotificationManagerProps {
  newPayments: Payment[]
  onNotificationShown?: (payment: Payment) => void
}

export function PaymentNotificationManager({ 
  newPayments, 
  onNotificationShown 
}: PaymentNotificationManagerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [lastPaymentCount, setLastPaymentCount] = useState(0)

  // Process new payments into notifications
  useEffect(() => {
    if (newPayments.length > lastPaymentCount && lastPaymentCount > 0) {
      // Get only the new payments since last update
      const newPaymentsToShow = newPayments.slice(0, newPayments.length - lastPaymentCount)
      
      newPaymentsToShow.forEach(payment => {
        const notificationId = `payment-${payment.id}-${Date.now()}`
        
        setNotifications(prev => [
          ...prev,
          {
            id: notificationId,
            payment,
            timestamp: Date.now()
          }
        ])

        // Call callback if provided
        if (onNotificationShown) {
          onNotificationShown(payment)
        }
      })
    }

    setLastPaymentCount(newPayments.length)
  }, [newPayments, lastPaymentCount, onNotificationShown])

  // Auto-cleanup old notifications (fallback)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now()
      setNotifications(prev => 
        prev.filter(notification => now - notification.timestamp < 10000) // Remove after 10 seconds
      )
    }, 5000)

    return () => clearInterval(cleanup)
  }, [])

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    )
  }

  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            top: `${1 + index * 6}rem`, // Stack notifications
            zIndex: 50 - index // Ensure newer notifications are on top
          }}
          className="fixed right-4"
        >
          <PaymentNotification
            payment={notification.payment}
            onDismiss={() => dismissNotification(notification.id)}
            autoHideDuration={5000}
          />
        </div>
      ))}
    </>
  )
}