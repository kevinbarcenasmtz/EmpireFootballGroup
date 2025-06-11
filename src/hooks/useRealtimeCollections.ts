'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PaymentCollection } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeCollectionsOptions {
  userId?: string;
  enabled?: boolean;
}

export function useRealtimeCollections(options: UseRealtimeCollectionsOptions = {}) {
  const { userId, enabled = true } = options;
  const [collections, setCollections] = useState<PaymentCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        const { data, error } = await supabase
          .from('payment_collections')
          .select('*')
          .eq('admin_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (isMounted) {
          setCollections(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching collections:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch collections');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const setupRealtimeSubscription = () => {
      // Clean up existing subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel('payment_collections_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payment_collections',
            filter: `admin_id=eq.${userId}`,
          },
          payload => {
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
              const deletedId = payload.old.id;
              setCollections(prev => prev.filter(collection => collection.id !== deletedId));
            }
          }
        )
        .subscribe(status => {
          console.log('Collections subscription status:', status);
        });

      channelRef.current = channel;
    };

    fetchInitialData().then(() => {
      setupRealtimeSubscription();
    });

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, supabase]);

  const refreshCollections = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
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
  };

  return {
    collections,
    isLoading,
    error,
    refreshCollections,
    isConnected: channelRef.current?.state === 'joined',
  };
}
