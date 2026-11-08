import { bookingPolicySchema } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toApiError, unwrap, unwrapMaybe } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type Form = z.input<typeof bookingPolicySchema>;
type Output = z.output<typeof bookingPolicySchema>;

const DEFAULTS: Output = {
  reschedule_min_hours: 24,
  refund_min_hours: 24,
  refund_percent: 100,
  client_can_reschedule: true,
  client_can_cancel: true,
  notes: '',
  is_demo: false,
};

/** Política de remarcação e cancelamento, por regra (somente admin edita). */
export function PolicyCard({ businessId }: { businessId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const policy = useQuery({
    queryKey: ['booking-policy', businessId],
    queryFn: async () =>
      unwrapMaybe(
        await supabase
          .from('booking_policies')
          .select('*')
          .eq('business_id', businessId)
          .maybeSingle(),
      ),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Form, unknown, Output>({ resolver: zodResolver(bookingPolicySchema) });

  React.useEffect(() => {
    const p = policy.data;
    reset(p ? { ...p, notes: p.notes ?? '' } : DEFAULTS);
  }, [policy.data, reset]);

  const onSubmit = handleSubmit(async (v) => {
    try {
      unwrap(
        await supabase
          .from('booking_policies')
          .upsert({ business_id: businessId, ...v, notes: v.notes || null })
          .select()
          .single(),
      );
      await qc.invalidateQueries({ queryKey: ['booking-policy', businessId] });
      await qc.invalidateQueries({ queryKey: ['demo-data', businessId] });
      toast.success(t('common.saved'));
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
    }
  });

  const Toggle = ({
    name,
    label,
    hint,
  }: {
    name: 'client_can_reschedule' | 'client_can_cancel' | 'is_demo';
    label: string;
    hint: string;
  }) => (
    <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="text-muted-foreground">{hint}</span>
      </span>
      <Switch
        checked={Boolean(watch(name))}
        onCheckedChange={(v) => setValue(name, v, { shouldDirty: true })}
      />
    </label>
  );

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('settings.policy.title')}
            {policy.data?.is_demo && <Badge variant="outline">{t('demo.badge')}</Badge>}
          </CardTitle>
          <CardDescription>{t('settings.policy.hint')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label={t('settings.policy.reschedule')}
              htmlFor="reschedule_min_hours"
              error={errors.reschedule_min_hours?.message}
              hint={t('settings.policy.rescheduleHint')}
            >
              <Input type="number" min={0} max={720} {...register('reschedule_min_hours')} />
            </Field>
            <Field
              label={t('settings.policy.refundWindow')}
              htmlFor="refund_min_hours"
              error={errors.refund_min_hours?.message}
              hint={t('settings.policy.refundWindowHint')}
            >
              <Input type="number" min={0} max={720} {...register('refund_min_hours')} />
            </Field>
            <Field
              label={t('settings.policy.refundPercent')}
              htmlFor="refund_percent"
              error={errors.refund_percent?.message}
              hint={t('settings.policy.refundPercentHint')}
            >
              <Input type="number" min={0} max={100} {...register('refund_percent')} />
            </Field>
          </div>
          <Toggle
            name="client_can_reschedule"
            label={t('settings.policy.clientReschedule')}
            hint={t('settings.policy.clientRescheduleHint')}
          />
          <Toggle
            name="client_can_cancel"
            label={t('settings.policy.clientCancel')}
            hint={t('settings.policy.clientCancelHint')}
          />
          <Field
            label={t('settings.policy.notes')}
            htmlFor="policy_notes"
            error={errors.notes?.message}
            hint={t('settings.policy.notesHint')}
          >
            <Textarea rows={3} {...register('notes')} />
          </Field>
          <Toggle name="is_demo" label={t('demo.flagLabel')} hint={t('demo.flagHint')} />
          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              {t('settings.policy.save')}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
