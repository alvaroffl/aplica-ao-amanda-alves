import { useQueryClient } from '@tanstack/react-query';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
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
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteMyData, exportMyData } from '../public/api';

/** Direitos do titular (LGPD art. 18): acesso/portabilidade e eliminação. */
export function PrivacyPanel({ token, onDeleted }: { token: string; onDeleted: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState<'export' | 'delete' | null>(null);

  const doExport = async () => {
    setBusy('export');
    try {
      const data = await exportMyData(token);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      Object.assign(document.createElement('a'), {
        href: url,
        download: 'meus-dados.json',
      }).click();
      URL.revokeObjectURL(url);
      toast.success(t('manage.privacy.exported'));
    } catch {
      toast.error(t('errors.INTERNAL_ERROR'));
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async () => {
    setBusy('delete');
    try {
      await deleteMyData(token);
      qc.removeQueries({ queryKey: ['booking-token', token] });
      onDeleted();
    } catch {
      toast.error(t('errors.INTERNAL_ERROR'));
      setBusy(null);
    }
  };

  return (
    <details className="group rounded-xl border bg-card p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium">
        <ShieldCheck className="size-4 text-success" aria-hidden />
        {t('manage.privacy.title')}
      </summary>
      <div className="mt-3 space-y-3 text-sm text-muted-foreground">
        <p>{t('manage.privacy.text')}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" onClick={doExport} loading={busy === 'export'}>
            <Download aria-hidden /> {t('manage.privacy.export')}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 aria-hidden /> {t('manage.privacy.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('manage.privacy.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('manage.privacy.deleteText')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={doDelete}
                  disabled={busy === 'delete'}
                >
                  {t('manage.privacy.deleteConfirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </details>
  );
}
