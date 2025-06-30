// src/hooks/useRealtimePayments.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Payment } from '@/types/database';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

interface UseRealtimePaymentsOptions {
  userId?: string;
  collectionId?: string;
  enabled?: boolean;
  limit?: number;
}

// Singleton client
let supabaseClient: SupabaseClient | null = null;
const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

export function useRealtimePayments(options: UseRealtimePaymentsOptions = {}) {
  const { userId, collectionId, enabled = true, limit = 10 } = options;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPaymentCount, setNewPaymentCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const processingRef = useRef(new Set<string>());

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (channelRef.current) {
      console.log('Cleaning up payments subscription');
      const supabase = getSupabaseClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setIsConnected(false);
    processingRef.current.clear();
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !userId) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();

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

        if (mountedRef.current) {
          setPayments(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch payments');
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    const setupRealtimeSubscription = () => {
      cleanup();

      if (!mountedRef.current) return;

      const channelName = `payments_${userId}_${collectionId || 'all'}_${Date.now()}`;

      console.log('Setting up payments subscription:', channelName);

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
            if (!mountedRef.current) return;

            console.log('Payment realtime update:', payload);

            // Type-safe ID extraction
            let payloadId: string | undefined;

            if (payload.eventType === 'DELETE') {
              // For DELETE events, the ID is in payload.old
              const oldRecord = payload.old as Record<string, unknown>;
              payloadId = typeof oldRecord.id === 'string' ? oldRecord.id : undefined;
            } else {
              // For INSERT/UPDATE events, the ID is in payload.new
              const newRecord = payload.new as Record<string, unknown>;
              payloadId = typeof newRecord.id === 'string' ? newRecord.id : undefined;
            }

            if (!payloadId) {
              console.warn('Payload missing ID:', payload);
              return;
            }

            // Prevent duplicate processing
            const eventKey = `${payload.eventType}_${payloadId}`;
            if (processingRef.current.has(eventKey)) {
              console.log('Skipping duplicate event:', eventKey);
              return;
            }
            processingRef.current.add(eventKey);

            try {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const paymentData = payload.new as Payment;

                // Verify this payment belongs to user's collection
                const { data: collection } = await supabase
                  .from('payment_collections')
                  .select('admin_id')
                  .eq('id', paymentData.collection_id)
                  .eq('admin_id', userId)
                  .single();

                if (!collection) return;

                if (collectionId && paymentData.collection_id !== collectionId) return;

                if (payload.eventType === 'INSERT') {
                  setPayments(prev => [paymentData, ...prev.slice(0, limit - 1)]);
                  setNewPaymentCount(prev => prev + 1);
                } else if (payload.eventType === 'UPDATE') {
                  setPayments(prev =>
                    prev.map(payment => (payment.id === paymentData.id ? paymentData : payment))
                  );
                }
              } else if (payload.eventType === 'DELETE' && payloadId) {
                setPayments(prev => prev.filter(payment => payment.id !== payloadId));
              }
            } finally {
              // Remove from processing set after a delay
              setTimeout(() => {
                processingRef.current.delete(eventKey);
              }, 1000);
            }
          }
        )
        .subscribe(status => {
          console.log(`Payments subscription status: ${status}`);

          if (!mountedRef.current) return;

          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            if (mountedRef.current && !reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (mountedRef.current) {
                  console.log('Retrying payments subscription...');
                  setupRealtimeSubscription();
                }
              }, 5000);
            }
          } else if (status === 'TIMED_OUT') {
            setIsConnected(false);
          }
        });

      channelRef.current = channel;
    };

    fetchInitialData().then(() => {
      if (mountedRef.current) {
        setupRealtimeSubscription();
      }
    });

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [userId, collectionId, enabled, limit, cleanup]);

  const clearNewPaymentCount = useCallback(() => {
    setNewPaymentCount(0);
  }, []);

  const refreshPayments = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
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
  }, [userId, collectionId, limit]);

  return {
    payments,
    isLoading,
    error,
    newPaymentCount,
    clearNewPaymentCount,
    refreshPayments,
    isConnected,
  };
}
