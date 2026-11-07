import { inviteSchema, professionalSchema, type MemberRole } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';
import { EmptyState, ErrorState, PageHeader } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toApiError, unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/utils';
import { useAuth } from '@/providers/auth';
import { useBusiness } from '../business';
import { keys, useProfessionals, useServices, useUnits, type Professional } from '../data';

const COLORS = ['#7c3aed', '#0891b2', '#db2777', '#ea580c', '#16a34a', '#2563eb', '#ca8a04', '#9333ea', '#dc2626', '#0d9488'];

export function TeamPage() {
  const { t } = useTranslation();
  const professionals = useProfessionals();
  const [editing, setEditing] = React.useState<Professional | 'new' | null>(null);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('team.title')}
        description={t('team.subtitle')}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus aria-hidden /> {t('team.newProfessional')}
          </Button>
        }
      />
      <section aria-labelledby="pros-title" className="space-y-3">
        <h2 id="pros-title" className="text-lg font-semibold">
          {t('team.professionals')}
        </h2>
        {professionals.isPending ? (
          <Skeleton className="h-32" />
        ) : professionals.isError ? (
          <ErrorState error={professionals.error} onRetry={() => void professionals.refetch()} />
        ) : professionals.data.length === 0 ? (
          <EmptyState title={t('team.empty')} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {professionals.data.map((p) => (
              <Card key={p.id} className="flex items-center gap-3 p-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: p.color }} aria-hidden>
                  {initials(p.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('team.servicesCount', { count: p.service_ids.length })}
                    {p.user_id ? ` · ${t('team.hasAccess')}` : ''}
                  </p>
                  {!p.active && <Badge variant="secondary" className="mt-1">{t('common.inactive')}</Badge>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label={`${t('common.edit')} ${p.name}`}>
                  <Pencil aria-hidden />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
      <MembersSection />
      <ProfessionalDialog editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

type ProForm = z.input<typeof professionalSchema>;

function ProfessionalDialog({ editing, onClose }: { editing: Professional | 'new' | null; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { business } = useBusiness();
  const units = useUnits();
  const services = useServices();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProForm, unknown, z.output<typeof professionalSchema>>({ resolver: zodResolver(professionalSchema) });

  React.useEffect(() => {
    if (!editing) return;
    const p = editing === 'new' ? null : editing;
    reset({
      name: p?.name ?? '',
      bio: p?.bio ?? '',
      color: p?.color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
      active: p?.active ?? true,
      unit_ids: p?.unit_ids ?? (units.data ?? []).map((u) => u.id),
      service_ids: p?.service_ids ?? [],
    });
  }, [editing, reset, units.data]);

  const unitIds = watch('unit_ids') ?? [];
  const serviceIds = watch('service_ids') ?? [];
  const color = watch('color');
  const active = watch('active');

  const toggle = (field: 'unit_ids' | 'service_ids', list: string[], id: string, on: boolean) =>
    setValue(field, on ? [...list, id] : list.filter((x) => x !== id), { shouldDirty: true, shouldValidate: true });

  const onSubmit = handleSubmit(async ({ unit_ids, service_ids, ...values }) => {
    try {
      const payload = { ...values, bio: values.bio || null, business_id: business.id };
      const id =
        editing === 'new'
          ? unwrap(await supabase.from('professionals').insert(payload).select('id').single()).id
          : unwrap(await supabase.from('professionals').update(payload).eq('id', (editing as Professional).id).select('id').single()).id;
      unwrap(await supabase.from('professional_units').delete().eq('professional_id', id));
      unwrap(await supabase.from('professional_units').insert(unit_ids.map((u) => ({ business_id: business.id, professional_id: id, unit_id: u }))));
      unwrap(await supabase.from('service_professionals').delete().eq('professional_id', id));
      if (service_ids.length) {
        unwrap(await supabase.from('service_professionals').insert(service_ids.map((s) => ({ business_id: business.id, professional_id: id, service_id: s }))));
      }
      await qc.invalidateQueries({ queryKey: keys.professionals(business.id) });
      await qc.invalidateQueries({ queryKey: keys.services(business.id) });
      toast.success(editing === 'new' ? t('team.createdHint') : t('common.saved'));
      onClose();
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`));
    }
  });

  return (
    <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing === 'new' ? t('team.newProfessional') : t('team.editProfessional')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label={t('team.name')} htmlFor="name" error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>
          <Field label={t('team.bio')} htmlFor="bio" error={errors.bio?.message} hint={t('team.bioHint')}>
            <Textarea rows={2} {...register('bio')} />
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t('team.color')}</legend>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c, { shouldDirty: true })}
                  aria-label={c}
                  aria-pressed={color === c}
                  className="size-8 rounded-full ring-offset-2 ring-offset-card aria-pressed:ring-2 aria-pressed:ring-foreground"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </fieldset>
          {(units.data?.length ?? 0) > 1 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t('team.units')}</legend>
              {units.data!.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={unitIds.includes(u.id)} onCheckedChange={(v) => toggle('unit_ids', unitIds, u.id, v === true)} />
                  {u.name}
                </label>
              ))}
              {errors.unit_ids && <p className="text-xs text-destructive">{t(errors.unit_ids.message ?? 'validation.unitRequired')}</p>}
            </fieldset>
          )}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t('team.services')}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(services.data ?? []).map((s) => (
                <label key={s.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <Checkbox checked={serviceIds.includes(s.id)} onCheckedChange={(v) => toggle('service_ids', serviceIds, s.id, v === true)} />
                  {s.name}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span className="font-medium">{t('team.active')}</span>
            <Switch checked={active} onCheckedChange={(v) => setValue('active', v, { shouldDirty: true })} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Acesso ao painel (membros e convites)
// ---------------------------------------------------------------------------
type InviteForm = z.input<typeof inviteSchema>;

function MembersSection() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { business } = useBusiness();
  const { user } = useAuth();
  const professionals = useProfessionals();
  const members = useQuery({
    queryKey: ['members', business.id],
    queryFn: async () => {
      const rows = unwrap(await supabase.from('business_members').select('user_id, role').eq('business_id', business.id));
      const profiles = unwrap(
        await supabase.from('profiles').select('id, full_name, email').in('id', rows.map((r) => r.user_id)),
      );
      return rows.map((r) => ({ ...r, profile: profiles.find((p) => p.id === r.user_id) }));
    },
  });
  const invites = useQuery({
    queryKey: ['invites', business.id],
    queryFn: async () =>
      unwrap(await supabase.from('invitations').select('*').eq('business_id', business.id).is('accepted_at', null).order('created_at')),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm, unknown, z.output<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'professional', professional_id: null },
  });
  const role = watch('role');

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ['members', business.id] });
    await qc.invalidateQueries({ queryKey: ['invites', business.id] });
    await qc.invalidateQueries({ queryKey: keys.professionals(business.id) });
  };

  const onInvite = handleSubmit(async (v) => {
    try {
      const result = unwrap(
        await supabase.rpc('invite_member', {
          p_business_id: business.id,
          p_email: v.email,
          p_role: v.role,
          ...(v.professional_id ? { p_professional_id: v.professional_id } : {}),
        }),
      );
      toast.success(result === 'added' ? t('team.memberAdded') : t('team.inviteSent'));
      reset({ email: '', role: 'professional', professional_id: null });
      await refresh();
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`));
    }
  });

  const changeRole = async (userId: string, newRole: MemberRole) => {
    const { error } = await supabase.from('business_members').update({ role: newRole }).eq('business_id', business.id).eq('user_id', userId);
    if (error) toast.error(t(`errors.${toApiError(error).code}`));
    else toast.success(t('common.saved'));
    await refresh();
  };

  const remove = async (userId: string) => {
    const { error } = await supabase.from('business_members').delete().eq('business_id', business.id).eq('user_id', userId);
    if (error) toast.error(t(`errors.${toApiError(error).code}`));
    await refresh();
  };

  const cancelInvite = async (id: string) => {
    await supabase.from('invitations').delete().eq('id', id);
    await refresh();
  };

  return (
    <section aria-labelledby="members-title" className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle id="members-title">{t('team.access')}</CardTitle>
          <CardDescription>{t('team.accessHint')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.isPending ? (
            <Skeleton className="h-20" />
          ) : (
            (members.data ?? []).map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.profile?.full_name || m.profile?.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.profile?.email}</p>
                </div>
                <NativeSelect
                  className="h-9 w-36 text-sm"
                  value={m.role}
                  aria-label={t('team.role')}
                  disabled={m.user_id === user?.id}
                  onChange={(e) => void changeRole(m.user_id, e.target.value as MemberRole)}
                >
                  {(['admin', 'reception', 'professional'] as const).map((r) => (
                    <option key={r} value={r}>
                      {t(`roles.${r}`)}
                    </option>
                  ))}
                </NativeSelect>
                {m.user_id !== user?.id && (
                  <Button variant="ghost" size="icon-sm" onClick={() => void remove(m.user_id)} aria-label={t('team.removeMember')}>
                    <Trash2 aria-hidden />
                  </Button>
                )}
              </div>
            ))
          )}
          {(invites.data ?? []).map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-lg border border-dashed p-3">
              <Mail className="size-4 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{i.email}</p>
                <p className="text-xs text-muted-foreground">
                  {t('team.pendingInvite')} · {t(`roles.${i.role}`)}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => void cancelInvite(i.id)} aria-label={t('team.cancelInvite')}>
                <Trash2 aria-hidden />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('team.invite')}</CardTitle>
          <CardDescription>{t('team.inviteHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onInvite} noValidate className="space-y-4">
            <Field label={t('auth.email')} htmlFor="invite-email" error={errors.email?.message}>
              <Input type="email" {...register('email')} />
            </Field>
            <Field label={t('team.role')} htmlFor="invite-role">
              <NativeSelect {...register('role')}>
                <option value="professional">{t('roles.professional')}</option>
                <option value="reception">{t('roles.reception')}</option>
                <option value="admin">{t('roles.admin')}</option>
              </NativeSelect>
            </Field>
            <p className="text-xs text-muted-foreground">{t(`team.roleHint.${role}`)}</p>
            {role === 'professional' && (
              <Field label={t('team.linkProfessional')} htmlFor="invite-pro">
                <NativeSelect {...register('professional_id', { setValueAs: (v: string) => v || null })}>
                  <option value="">{t('common.none')}</option>
                  {(professionals.data ?? [])
                    .filter((p) => !p.user_id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </NativeSelect>
              </Field>
            )}
            <Button type="submit" loading={isSubmitting}>
              <UserPlus aria-hidden /> {t('team.sendInvite')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
