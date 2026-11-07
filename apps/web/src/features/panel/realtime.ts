import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useBusiness } from './business';

/** Atualiza a agenda em tempo real quando chega/muda uma reserva (RLS aplicada). */
export function useRealtimeBookings() {
  const { business } = useBusiness();
  const qc = useQueryClient();
  React.useEffect(() => {
    const channel = supabase
      .channel(`bookings:${business.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `business_id=eq.${business.id}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ['bookings', business.id] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [business.id, qc]);
}
