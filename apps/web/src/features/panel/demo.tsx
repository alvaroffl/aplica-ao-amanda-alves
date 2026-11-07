import { useQuery } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from './business';

/** true enquanto houver registros is_demo no negócio atual. */
export function useDemoData() {
  const { business } = useBusiness();
  return useQuery({
    queryKey: ['demo-data', business.id],
    queryFn: async () =>
      Boolean(unwrap(await supabase.rpc('business_has_demo_data', { p_business_id: business.id }))),
    staleTime: 60_000,
  });
}

/** Aviso discreto no topo do painel: dados fictícios da apresentação. */
export function DemoBanner() {
  const { t } = useTranslation();
  const { can } = useBusiness();
  const demo = useDemoData();
  if (!demo.data) return null;
  return (
    <div
      role="note"
      className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
    >
      <FlaskConical className="size-4 shrink-0 text-warning" aria-hidden />
      <span className="font-medium">{t('demo.banner')}</span>
      <span className="text-muted-foreground">{t('demo.bannerText')}</span>
      {can('settings.manage') && (
        <Link
          to="/painel/configuracoes"
          className="ml-auto font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('demo.manage')}
        </Link>
      )}
    </div>
  );
}
