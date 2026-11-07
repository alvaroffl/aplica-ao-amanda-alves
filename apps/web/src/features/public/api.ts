import type { PublicBooking, PublicBooking as Booking, PublicBusiness, Slot } from '@agendae/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ApiError, callFunction, unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export function usePublicBusiness(slug: string | undefined) {
  return useQuery({
    queryKey: ['public-business', slug],
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const data = unwrap(await supabase.rpc('get_public_business', { p_slug: slug! }));
      if (!data) throw new ApiError('BUSINESS_NOT_FOUND', 404);
      return data as unknown as PublicBusiness;
    },
  });
}

export function useSlots(params: {
  serviceId?: string;
  unitId?: string;
  professionalId?: string | null;
  from: string;
  to: string;
}) {
  const { serviceId, unitId, professionalId, from, to } = params;
  return useQuery({
    queryKey: ['slots', serviceId, unitId, professionalId ?? 'any', from, to],
    enabled: Boolean(serviceId && unitId),
    staleTime: 20_000,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      unwrap(
        await supabase.rpc('get_available_slots', {
          p_service_id: serviceId!,
          p_unit_id: unitId!,
          p_from: from,
          p_to: to,
          ...(professionalId ? { p_professional_id: professionalId } : {}),
        }),
      ) as Slot[],
  });
}

export interface CreateBookingInput {
  serviceId: string;
  unitId: string;
  professionalId: string | null;
  startsAt: string;
  client: { name: string; email: string; phone: string; notes?: string; consent: true };
  idempotencyKey: string;
  captchaToken: string;
  paymentMethod?: 'pix' | 'card';
}

export function createBooking(input: CreateBookingInput) {
  return callFunction<PublicBooking>('public-booking', input);
}

// ---------------------------------------------------------------------------
// Link seguro (/r/:token)
// ---------------------------------------------------------------------------
export function useBookingByToken(token: string | undefined) {
  return useQuery({
    queryKey: ['booking-token', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const data = unwrap(await supabase.rpc('get_booking_by_token', { p_token: token! }));
      if (!data) throw new ApiError('INVALID_TOKEN', 404);
      return data as unknown as Booking;
    },
    // aguardando pagamento: consulta a cada 4s até confirmar ou expirar
    refetchInterval: (q) => (q.state.data?.status === 'pending_payment' ? 4000 : false),
  });
}

export function useRescheduleSlots(token: string, from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: ['reschedule-slots', token, from, to],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      unwrap(await supabase.rpc('get_reschedule_slots', { p_token: token, p_from: from, p_to: to })) as Omit<Slot, 'professional_id'>[],
  });
}

export async function rescheduleByToken(token: string, startsAt: string) {
  return unwrap(await supabase.rpc('reschedule_booking_by_token', { p_token: token, p_starts_at: startsAt })) as unknown as Booking;
}

export async function cancelByToken(token: string, reason: string) {
  return unwrap(await supabase.rpc('cancel_booking_by_token', { p_token: token, p_reason: reason })) as unknown as Booking;
}

export async function exportMyData(token: string) {
  return unwrap(await supabase.rpc('lgpd_export_by_token', { p_token: token }));
}

export async function deleteMyData(token: string) {
  unwrap(await supabase.rpc('lgpd_delete_by_token', { p_token: token }));
}

export function simulatePayment(paymentId: string) {
  return callFunction<{ result: string }>('dev-payments', { paymentId });
}
