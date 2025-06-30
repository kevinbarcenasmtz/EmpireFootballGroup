// src/hooks/useRealtimeSignups.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlayerSignup, SignupSummary } from '@/types/database';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

interface UseRealtimeSignupsOptions {
  collectionId: string;
  userId?: string;
  enabled?: boolean;
}

// Singleton client
let supabaseClient: SupabaseClient | null = null;
const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

export function useRealtimeSignups(options: UseRealtimeSignupsOptions) {
  const { collectionId, enabled = true } = options;
  const [signups, setSignups] = useState<PlayerSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Calculate summary from signups
  const summary: SignupSummary = {
    yes: signups.filter(s => s.status === 'yes').length,
    no: signups.filter(s => s.status === 'no').length,
    maybe: signups.filter(s => s.status === 'maybe').length,
    total: signups.length,
  };

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (channelRef.current) {
      console.log('Cleaning up signups subscription');
      const supabase = getSupabaseClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!enabled || !collectionId) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();

    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('player_signups')
          .select('*')
          .eq('collection_id', collectionId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (mountedRef.current) {
          setSignups(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching signups:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch signups');
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

      const channelName = `signups_${collectionId}_${Date.now()}`;
      
      console.log('Setting up signups subscription:', channelName);

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'player_signups',
            filter: `collection_id=eq.${collectionId}`,
          },
          (payload) => {
            if (!mountedRef.current) return;

            console.log('Signup realtime update:', payload);

            if (payload.eventType === 'INSERT') {
              const newSignup = payload.new as PlayerSignup;
              setSignups(prev => [newSignup, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedSignup = payload.new as PlayerSignup;
              setSignups(prev =>
                prev.map(signup => 
                  signup.id === updatedSignup.id ? updatedSignup : signup
                )
              );
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id: string }).id;
              setSignups(prev => prev.filter(signup => signup.id !== deletedId));
            }
          }
        )
        .subscribe((status) => {
          console.log(`Signups subscription status: ${status}`);
          
          if (!mountedRef.current) return;

          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            if (mountedRef.current && !reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (mountedRef.current) {
                  console.log('Retrying signups subscription...');
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
  }, [enabled, collectionId, cleanup]);

  return {
    signups,
    isLoading,
    error,
    isConnected,
    summary,
  };
}

export default useRealtimeSignups;