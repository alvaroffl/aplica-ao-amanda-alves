import type { Tables } from '@agendae/shared';
import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from './business';

export type Unit = Tables<'units'>;
export type Professional = Tables<'professionals'> & { unit_ids: string[]; service_ids: string[] };
export type Service = Tables<'services'> & { professional_ids: string[] };
export type Client = Tables<'clients'>;
export type BookingRow = Tables<'bookings'> & {
  client: Pick<Client, 'id' | 'name' | 'email' | 'phone'> | null;
  service: Pick<Service, 'id' | 'name'> | null;
  professional: Pick<Professional, 'id' | 'name' | 'color'> | null;
  unit: Pick<Unit, 'id' | 'name' | 'timezone'> | null;
  payments: Pick<Tables<'payments'>, 'id' | 'status' | 'amount_cents' | 'method'>[];
};

export const keys = {
  units: (b: string) => ['units', b] as const,
  professionals: (b: string) => ['professionals', b] as const,
  services: (b: string) => ['services', b] as const,
  bookings: (b: string, from: string, to: string) => ['bookings', b, from, to] as const,
  clients: (b: string, search: string) => ['clients', b, search] as const,
  client: (id: string) => ['client', id] as const,
};

export function useUnits() {
  const { business } = useBusiness();
  return useQuery({
    queryKey: keys.units(business.id),
    queryFn: async () => unwrap(await supabase.from('units').select('*').eq('business_id', business.id).order('name')),
  });
}

export function useProfessionals() {
  const { business } = useBusiness();
  return useQuery({
    queryKey: keys.professionals(business.id),
    queryFn: async () => {
      const rows = unwrap(
        await supabase
          .from('professionals')
          .select('*, professional_units(unit_id), service_professionals(service_id)')
          .eq('business_id', business.id)
          .order('sort_order')
          .order('name'),
      );
      return rows.map(({ professional_units, service_professionals, ...p }) => ({
        ...p,
        unit_ids: professional_units.map((u) => u.unit_id),
        service_ids: service_professionals.map((s) => s.service_id),
      })) as Professional[];
    },
  });
}

export function useServices() {
  const { business } = useBusiness();
  return useQuery({
    queryKey: keys.services(business.id),
    queryFn: async () => {
      const rows = unwrap(
        await supabase
          .from('services')
          .select('*, service_professionals(professional_id)')
          .eq('business_id', business.id)
          .order('sort_order')
          .order('name'),
      );
      return rows.map(({ service_professionals, ...s }) => ({
        ...s,
        professional_ids: service_professionals.map((x) => x.professional_id),
      })) as Service[];
    },
  });
}

export const BOOKING_SELECT =
  '*, client:clients(id, name, email, phone), service:services(id, name), professional:professionals(id, name, color), unit:units(id, name, timezone), payments(id, status, amount_cents, method)';

export function useBookings(fromIso: string, toIso: string) {
  const { business } = useBusiness();
  return useQuery({
    queryKey: keys.bookings(business.id, fromIso, toIso),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('bookings')
          .select(BOOKING_SELECT)
          .eq('business_id', business.id)
          .gte('starts_at', fromIso)
          .lt('starts_at', toIso)
          .in('status', ['pending_payment', 'confirmed', 'completed', 'no_show', 'cancelled'])
          .order('starts_at'),
      ) as unknown as BookingRow[],
  });
}
