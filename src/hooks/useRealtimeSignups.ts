'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlayerSignup, SignupSummary } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSignupsOptions {
  collectionId: string;
  userId?: string;
  enabled?: boolean;
}

export function useRealtimeSignups(options: UseRealtimeSignupsOptions) {
  const { collectionId, enabled = true } = options;
  const [signups, setSignups] = useState<PlayerSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // Calculate summary from signups
  const summary: SignupSummary = {
    yes: signups.filter(s => s.status === 'yes').length,
    no: signups.filter(s => s.status === 'no').length,
    maybe: signups.filter(s => s.status === 'maybe').length,
    total: signups.length,
  };

  useEffect(() => {
    if (!enabled || !collectionId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('player_signups')
          .select('*')
          .eq('collection_id', collectionId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (isMounted) {
          setSignups(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching signups:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch signups');
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
        channelRef.current = null;
      }

      const channelName = `signups_${collectionId}_${Date.now()}`;

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
          payload => {
            console.log('Signup realtime update:', payload);

            if (!isMounted) return;

            if (payload.eventType === 'INSERT') {
              const newSignup = payload.new as PlayerSignup;
              setSignups(prev => [newSignup, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedSignup = payload.new as PlayerSignup;
              setSignups(prev =>
                prev.map(signup => (signup.id === updatedSignup.id ? updatedSignup : signup))
              );
            } else if (payload.eventType === 'DELETE') {
              const deletedSignup = payload.old as PlayerSignup;
              setSignups(prev => prev.filter(signup => signup.id !== deletedSignup.id));
            }
          }
        )
        .subscribe(status => {
          console.log('Signups subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });

      channelRef.current = channel;
    };

    fetchInitialData();
    setupRealtimeSubscription();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, collectionId, supabase]);

  return {
    signups,
    isLoading,
    error,
    isConnected,
    summary,
  };
}

export default useRealtimeSignups;
