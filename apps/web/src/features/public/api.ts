import type {
  PublicBooking,
  PublicBooking as Booking,
  PublicBusiness,
  Slot,
} from '@agendae/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ApiError, callFunction } from '@/lib/api';
import { rpc } from '@/lib/rest';

export function usePublicBusiness(slug: string | undefined) {
  return useQuery({
    queryKey: ['public-business', slug],
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const data = await rpc<PublicBusiness | null>('get_public_business', { p_slug: slug! });
      if (!data) throw new ApiError('BUSINESS_NOT_FOUND', 404);
      return data;
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
    queryFn: () =>
      rpc<Slot[]>('get_available_slots', {
        p_service_id: serviceId!,
        p_unit_id: unitId!,
        p_from: from,
        p_to: to,
        ...(professionalId ? { p_professional_id: professionalId } : {}),
      }),
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
      const data = await rpc<Booking | null>('get_booking_by_token', { p_token: token! });
      if (!data) throw new ApiError('INVALID_TOKEN', 404);
      return data;
    },
    // aguardando pagamento: o aviso em tempo real (PaymentPanel) atualiza na hora;
    // a consulta periódica é a rede de segurança se o WebSocket cair
    refetchInterval: (q) => (q.state.data?.status === 'pending_payment' ? 8000 : false),
  });
}

export function useRescheduleSlots(token: string, from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: ['reschedule-slots', token, from, to],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: () =>
      rpc<Omit<Slot, 'professional_id'>[]>('get_reschedule_slots', {
        p_token: token,
        p_from: from,
        p_to: to,
      }),
  });
}

export async function rescheduleByToken(token: string, startsAt: string) {
  return rpc<Booking>('reschedule_booking_by_token', { p_token: token, p_starts_at: startsAt });
}

export async function cancelByToken(token: string, reason: string) {
  return rpc<Booking>('cancel_booking_by_token', { p_token: token, p_reason: reason });
}

export async function exportMyData(token: string) {
  return rpc<unknown>('lgpd_export_by_token', { p_token: token });
}

export async function deleteMyData(token: string) {
  await rpc<null>('lgpd_delete_by_token', { p_token: token });
}

export function simulatePayment(paymentId: string) {
  return callFunction<{ result: string }>('dev-payments', { paymentId });
}
