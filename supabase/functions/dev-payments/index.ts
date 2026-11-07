/**
 * POST /functions/v1/dev-payments  { "paymentId": "<uuid>" }
 * SOMENTE DESENVOLVIMENTO: simula a aprovação de um pagamento do provedor
 * "fake". Recusado quando PAYMENTS_PROVIDER != fake ou em produção.
 */
import { getEnv, isProduction } from '../_shared/env.ts';
import { fail, json, preflight } from '../_shared/http.ts';
import { serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight(req);
  if (req.method !== 'POST') return fail(req, 'METHOD_NOT_ALLOWED', 405);
  if (isProduction() || getEnv().paymentsProvider !== 'fake') return fail(req, 'FORBIDDEN', 403);

  const { paymentId } = (await req.json().catch(() => ({}))) as { paymentId?: string };
  if (!paymentId) return fail(req, 'VALIDATION_ERROR', 422);

  const db = serviceClient();
  const { data: row } = await db
    .from('payments')
    .select('id, provider')
    .eq('id', paymentId)
    .maybeSingle();
  if (!row || row.provider !== 'fake') return fail(req, 'VALIDATION_ERROR', 404);

  const { data, error } = await db.rpc('confirm_payment', {
    p_payment_id: paymentId,
    p_provider_payment_id: `fake-${paymentId}`,
    p_raw: { simulated: true } as never,
  });
  if (error) return fail(req, 'INTERNAL_ERROR', 500);
  return json(req, { result: data });
});
