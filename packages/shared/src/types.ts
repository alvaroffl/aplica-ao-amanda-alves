import type { Database } from './database.types.ts';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export type BookingStatus = Enums<'booking_status'>;
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
    cancellation_window_hours: number;
    booking_hold_min: number;
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
    professional_ids: string[];
  }[];
  professionals: {
    id: string;
    name: string;
    bio: string | null;
    avatar_url: string | null;
    color: string;
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
  replayed?: boolean;
  refund?: boolean;
  business: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
    cancellation_window_hours: number;
  };
  service: { id: string; name: string; duration_min: number };
  professional: { id: string; name: string };
  unit: { id: string; name: string; address: string | null; timezone: string };
  client: { name: string; email: string | null; phone: string | null };
  payment: {
    id: string;
    status: Enums<'payment_status'>;
    method: 'pix' | 'card';
    amount_cents: number;
    pix_qr_code: string | null;
    pix_qr_code_base64: string | null;
    checkout_url: string | null;
    expires_at: string | null;
    provider: string;
  } | null;
  policy?: {
    deadline: string;
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
