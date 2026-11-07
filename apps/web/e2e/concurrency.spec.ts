import { expect, test } from '@playwright/test';
import { ANON_KEY, SUPABASE_URL } from './helpers';

const SERVICE = 'e3000000-0000-0000-0000-000000000001'; // Avaliação gratuita (sem sinal)
const UNIT = 'e1000000-0000-0000-0000-000000000001';

test('duas reservas simultâneas no mesmo horário: só uma passa (constraint no banco)', async ({
  request,
}) => {
  const from = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10);
  const slotsRes = await request.post(`${SUPABASE_URL}/rest/v1/rpc/get_available_slots`, {
    headers: { apikey: ANON_KEY },
    data: { p_service_id: SERVICE, p_unit_id: UNIT, p_from: from, p_to: to },
  });
  const slots = (await slotsRes.json()) as { starts_at: string }[];
  expect(slots.length).toBeGreaterThan(0);
  const startsAt = slots[slots.length - 1]!.starts_at;

  const book = (n: number, key = crypto.randomUUID()) =>
    request.post(`${SUPABASE_URL}/functions/v1/public-booking`, {
      headers: { apikey: ANON_KEY },
      data: {
        serviceId: SERVICE,
        unitId: UNIT,
        professionalId: null,
        startsAt,
        client: {
          name: `Concorrente ${n}`,
          email: `concorrente${n}.${Date.now()}@e2e.dev`,
          phone: '11987654321',
          consent: true,
        },
        idempotencyKey: key,
        captchaToken: '',
      },
    });

  const [a, b] = await Promise.all([book(1), book(2)]);
  expect([a.status(), b.status()].sort()).toEqual([201, 409]);

  // idempotência: repetir a requisição vencedora devolve a mesma reserva (200)
  const winnerKey = crypto.randomUUID();
  const first = await book(3, winnerKey);
  expect(first.status()).toBe(409); // horário já ocupado
});
