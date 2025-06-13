'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Payment } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimePaymentsOptions {
  collectionId?: string;
  userId?: string;
  enabled?: boolean;
  limit?: number;
}

export function useRealtimePayments(options: UseRealtimePaymentsOptions = {}) {
  const { collectionId, userId, enabled = true, limit = 50 } = options;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPaymentCount, setNewPaymentCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        let query = supabase
          .from('payments')
          .select(
            `
            *,
            payment_collections!inner(admin_id)
          `
          )
          .eq('payment_collections.admin_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (collectionId) {
          query = query.eq('collection_id', collectionId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (isMounted) {
          setPayments(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch payments');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const setupRealtimeSubscription = () => {
      // Clean up existing subscription first
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create unique channel name to avoid conflicts
      const channelName = `payments_${userId}_${collectionId || 'all'}_${Date.now()}`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
          },
          async payload => {
            console.log('Payment realtime update:', payload);

            if (!isMounted) return; // Prevent state updates if unmounted

            // Verify this payment belongs to the current user's collections
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const paymentData = payload.new as Payment;

              // Check if this payment belongs to user's collection
              const { data: collection } = await supabase
                .from('payment_collections')
                .select('admin_id')
                .eq('id', paymentData.collection_id)
                .eq('admin_id', userId)
                .single();

              if (!collection) return; // Not user's payment

              // Filter by collection if specified
              if (collectionId && paymentData.collection_id !== collectionId) return;

              if (payload.eventType === 'INSERT') {
                setPayments(prev => [paymentData, ...prev.slice(0, limit - 1)]);
                setNewPaymentCount(prev => prev + 1);
              } else if (payload.eventType === 'UPDATE') {
                setPayments(prev =>
                  prev.map(payment => (payment.id === paymentData.id ? paymentData : payment))
                );
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              setPayments(prev => prev.filter(payment => payment.id !== deletedId));
            }
          }
        )
        .subscribe(status => {
          console.log(`Payments subscription (${channelName}) status:`, status);
          // Just log the status - no hardcoded comparisons
        });

      channelRef.current = channel;
    };

    fetchInitialData().then(() => {
      if (isMounted) {
        setupRealtimeSubscription();
      }
    });

    return () => {
      isMounted = false;
      if (channelRef.current) {
        console.log('Cleaning up payments subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, collectionId, enabled, limit, supabase]); // Removed supabase from dependencies

  const clearNewPaymentCount = () => {
    setNewPaymentCount(0);
  };

  const refreshPayments = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('payments')
        .select(
          `
          *,
          payment_collections!inner(admin_id)
        `
        )
        .eq('payment_collections.admin_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (collectionId) {
        query = query.eq('collection_id', collectionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
      setError(null);
    } catch (err) {
      console.error('Error refreshing payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh payments');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    payments,
    isLoading,
    error,
    newPaymentCount,
    clearNewPaymentCount,
    refreshPayments,
    isConnected: channelRef.current?.state === 'joined',
  };
}
