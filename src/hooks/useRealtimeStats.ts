'use client';

import { useState, useEffect } from 'react';
import { PaymentCollection } from '@/types/database';

interface RealtimeStats {
  totalCollections: number;
  activeCollections: number;
  totalRaised: number;
  totalPayments: number;
}

interface UseRealtimeStatsOptions {
  collections: PaymentCollection[];
  paymentsCount?: number;
}

export function useRealtimeStats({ collections, paymentsCount = 0 }: UseRealtimeStatsOptions) {
  const [stats, setStats] = useState<RealtimeStats>({
    totalCollections: 0,
    activeCollections: 0,
    totalRaised: 0,
    totalPayments: paymentsCount,
  });

  useEffect(() => {
    const totalCollections = collections.length;
    const activeCollections = collections.filter(c => c.is_active).length;
    const totalRaised = collections.reduce((sum, c) => sum + (c.current_amount || 0), 0);

    setStats({
      totalCollections,
      activeCollections,
      totalRaised,
      totalPayments: paymentsCount,
    });
  }, [collections, paymentsCount]);

  return stats;
}
