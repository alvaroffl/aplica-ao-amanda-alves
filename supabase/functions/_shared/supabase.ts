import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../packages/shared/src/index.ts';
import { getEnv } from './env.ts';

export type ServiceClient = SupabaseClient<Database>;

/** Cliente com service_role: só no servidor, nunca exposto ao navegador. */
export function serviceClient(): ServiceClient {
  const env = getEnv();
  return createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
