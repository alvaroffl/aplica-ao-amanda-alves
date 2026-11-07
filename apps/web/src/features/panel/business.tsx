import type { MemberRole, Tables } from '@agendae/shared';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { unwrap, unwrapMaybe } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';

export type Business = Tables<'businesses'>;
export interface Membership {
  role: MemberRole;
  business: Business;
}

/** Matriz de permissões da interface (espelha as políticas RLS do banco). */
const PERMISSIONS = {
  'settings.manage': ['admin'],
  'services.manage': ['admin'],
  'team.manage': ['admin'],
  'units.manage': ['admin'],
  'availability.manageAll': ['admin'],
  'timeoff.manageAll': ['admin', 'reception'],
  'agenda.viewAll': ['admin', 'reception'],
  'clients.edit': ['admin', 'reception'],
  'clients.lgpd': ['admin'],
  'reports.view': ['admin', 'reception'],
  'notifications.view': ['admin', 'reception'],
  'payments.view': ['admin', 'reception'],
  'payments.refund': ['admin'],
} as const satisfies Record<string, readonly MemberRole[]>;

export type Permission = keyof typeof PERMISSIONS;

interface BusinessContextValue {
  memberships: Membership[];
  business: Business;
  role: MemberRole;
  myProfessionalId: string | null;
  can: (permission: Permission) => boolean;
  switchBusiness: (id: string) => void;
}

const BusinessContext = React.createContext<BusinessContextValue | null>(null);
const STORAGE_KEY = 'agendae-business';

export function useMemberships() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['memberships', user?.id],
    enabled: Boolean(user),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('business_members')
          .select('role, business:businesses(*)')
          .eq('user_id', user!.id),
      ) as unknown as Membership[],
  });
}

export function BusinessProvider({
  memberships,
  children,
}: {
  memberships: Membership[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = React.useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const current = memberships.find((m) => m.business.id === selectedId) ?? memberships[0]!;

  const myPro = useQuery({
    queryKey: ['my-professional', current.business.id, user?.id],
    queryFn: async () =>
      unwrapMaybe(
        await supabase
          .from('professionals')
          .select('id')
          .eq('business_id', current.business.id)
          .eq('user_id', user!.id)
          .maybeSingle(),
      ),
  });

  const value = React.useMemo<BusinessContextValue>(
    () => ({
      memberships,
      business: current.business,
      role: current.role,
      myProfessionalId: myPro.data?.id ?? null,
      can: (p) => (PERMISSIONS[p] as readonly MemberRole[]).includes(current.role),
      switchBusiness: (id) => {
        setSelectedId(id);
        try {
          localStorage.setItem(STORAGE_KEY, id);
        } catch {
          /* ignore */
        }
      },
    }),
    [memberships, current, myPro.data],
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = React.useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness fora do BusinessProvider');
  return ctx;
}
