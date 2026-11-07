import type { Database } from './database.types.ts';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export type BookingStatus = Enums<'booking_status'>;
export type PaymentStatus = Enums<'payment_status'>;

/** Política de remarcação/cancelamento (public.booking_policies, sem metadados). */
export interface BookingPolicy {
  reschedule_min_hours: number;
  refund_min_hours: number;
  refund_percent: number;
  client_can_reschedule: boolean;
  client_can_cancel: boolean;
  notes: string | null;
}
export type MemberRole = Enums<'member_role'>;

/** Retorno de public.get_public_business(slug) */
export interface PublicBusiness {
  business: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    phone: string | null;
    email: string | null;
    timezone: string;
    locale: string;
    currency: string;
    booking_hold_min: number;
    max_installments: number;
    payment_methods: ('pix' | 'card')[];
    policy: BookingPolicy;
  };
  units: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    timezone: string;
  }[];
  services: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    duration_min: number;
    price_cents: number;
    deposit_type: 'none' | 'fixed' | 'percent';
    deposit_value: number;
    deposit_cents: number;
    is_demo: boolean;
    professional_ids: string[];
  }[];
  professionals: {
    id: string;
    name: string;
    bio: string | null;
    avatar_url: string | null;
    color: string;
    /** formação/credenciais: só vem preenchido quando a clínica informar */
    credentials: string | null;
    unit_ids: string[];
  }[];
}

export interface Slot {
  professional_id: string;
  starts_at: string;
  ends_at: string;
}

/** Retorno de public.booking_public_payload / get_booking_by_token */
export interface PublicBooking {
  id: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  deposit_cents: number;
  hold_expires_at: string | null;
  notes: string | null;
  cancelled_at: string | null;
  cancelled_by: 'client' | 'business' | 'system' | null;
  manage_token: string;
  /** canal de Realtime (Broadcast) com o status do pagamento */
  realtime_topic?: string;
  replayed?: boolean;
  refund?: boolean;
  business: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
    max_installments: number;
    policy: BookingPolicy;
  };
  service: { id: string; name: string; duration_min: number };
  professional: { id: string; name: string };
  unit: { id: string; name: string; address: string | null; timezone: string };
  client: { name: string; email: string | null; phone: string | null };
  payment: {
    id: string;
    status: PaymentStatus;
    method: 'pix' | 'card';
    /** tipo informado pelo provedor: credit_card, debit_card, account_money, bank_transfer… */
    method_detail: string | null;
    installments: number | null;
    amount_cents: number;
    refunded_cents: number;
    pix_qr_code: string | null;
    pix_qr_code_base64: string | null;
    checkout_url: string | null;
    expires_at: string | null;
    provider: string;
    provider_payment_id: string | null;
    /** pagamento em sandbox/teste: nenhuma cobrança real */
    test_mode: boolean;
    updated_at: string;
  } | null;
  policy?: {
    reschedule_deadline: string;
    refund_deadline: string;
    refund_percent: number;
    can_cancel: boolean;
    can_reschedule: boolean;
    refund_eligible: boolean;
  };
}

export interface ReportSummary {
  total: number;
  confirmed: number;
  completed: number;
  no_show: number;
  cancelled: number;
  no_show_rate: number;
  revenue_realized_cents: number;
  revenue_expected_cents: number;
  deposits_cents: number;
  booked_minutes: number;
  available_minutes: number;
  occupancy_rate: number;
  top_services: { id: string; name: string; count: number; revenue_cents: number }[];
  by_day: { day: string; bookings: number; no_show: number; revenue_cents: number }[];
}
