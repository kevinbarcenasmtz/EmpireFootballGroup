'use client';

import { useMemo } from 'react';
import { PaymentCollection } from '@/types/database';

interface RealtimeStats {
  totalCollections: number;
  activeCollections: number;
  totalRevenue: number; // Changed from totalRaised to match admin page
  totalPayments: number;
}

interface UseRealtimeStatsOptions {
  collections: PaymentCollection[];
  paymentsCount?: number;
}

export function useRealtimeStats({ collections, paymentsCount = 0 }: UseRealtimeStatsOptions) {
  // Use useMemo to prevent infinite re-renders
  const stats = useMemo((): RealtimeStats => {
    const totalCollections = collections.length;
    const activeCollections = collections.filter(c => c.is_active).length;
    const totalRevenue = collections.reduce((sum, c) => sum + (c.current_amount || 0), 0);

    return {
      totalCollections,
      activeCollections,
      totalRevenue, // Fixed property name
      totalPayments: paymentsCount,
    };
  }, [collections, paymentsCount]);

  return stats;
}