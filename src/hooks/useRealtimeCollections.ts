// src/hooks/useRealtimeCollections.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PaymentCollection } from '@/types/database';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

interface UseRealtimeCollectionsOptions {
  userId?: string;
  enabled?: boolean;
}

// Create client outside component to prevent recreations
let supabaseClient: SupabaseClient | null = null;
const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

export function useRealtimeCollections(options: UseRealtimeCollectionsOptions = {}) {
  const { userId, enabled = true } = options;
  const [collections, setCollections] = useState<PaymentCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (channelRef.current) {
      console.log('Cleaning up collections subscription');
      const supabase = getSupabaseClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setIsConnected(false);
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
        const { data, error } = await supabase
          .from('payment_collections')
          .select('*')
          .eq('admin_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (mountedRef.current) {
          setCollections(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching collections:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch collections');
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    const setupRealtimeSubscription = () => {
      // Always cleanup existing subscription first
      cleanup();

      if (!mountedRef.current) return;

      // Create unique channel name
      const channelName = `payment_collections_${userId}_${Date.now()}`;

      console.log('Setting up collections subscription:', channelName);

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payment_collections',
            filter: `admin_id=eq.${userId}`,
          },
          payload => {
            if (!mountedRef.current) return;

            console.log('Collection realtime update:', payload);

            if (payload.eventType === 'INSERT') {
              const newCollection = payload.new as PaymentCollection;
              setCollections(prev => [newCollection, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedCollection = payload.new as PaymentCollection;
              setCollections(prev =>
                prev.map(collection =>
                  collection.id === updatedCollection.id ? updatedCollection : collection
                )
              );
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id: string }).id;
              setCollections(prev => prev.filter(collection => collection.id !== deletedId));
            }
          }
        )
        .subscribe(status => {
          console.log(`Collections subscription status: ${status}`);

          if (!mountedRef.current) return;

          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            // Retry connection after 5 seconds
            if (mountedRef.current && !reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (mountedRef.current) {
                  console.log('Retrying collections subscription...');
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

    // Fetch initial data and setup subscription
    fetchInitialData().then(() => {
      if (mountedRef.current) {
        setupRealtimeSubscription();
      }
    });

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [userId, enabled, cleanup]); // Remove supabase from dependencies

  const refreshCollections = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('payment_collections')
        .select('*')
        .eq('admin_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
      setError(null);
    } catch (err) {
      console.error('Error refreshing collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh collections');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    collections,
    isLoading,
    error,
    refreshCollections,
    isConnected,
  };
}
