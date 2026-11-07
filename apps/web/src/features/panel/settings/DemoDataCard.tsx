import { useQueryClient } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toApiError, unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useDemoData } from '../demo';

/** Remove de uma vez os dados fictícios usados na apresentação. */
export function DemoDataCard({ businessId }: { businessId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const demo = useDemoData();
  const [busy, setBusy] = React.useState(false);

  if (!demo.data) return null;

  const purge = async () => {
    setBusy(true);
    try {
      unwrap(await supabase.rpc('purge_demo_data', { p_business_id: businessId }));
      await qc.invalidateQueries();
      toast.success(t('demo.purged'));
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-warning/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="size-4" aria-hidden /> {t('demo.cardTitle')}
        </CardTitle>
        <CardDescription>{t('demo.cardText')}</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" loading={busy}>
              {t('demo.purge')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>{t('demo.purgeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('demo.purgeText')}</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => void purge()}>
                {t('demo.purgeConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
