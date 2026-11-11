import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DB_SCHEMA } from './schema';

export function createBrowserSupabaseClient() {
  // Cast once: a schema-scoped client is typed SupabaseClient<any, 'winback'>,
  // which doesn't assign to the plain SupabaseClient the rest of the app uses.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: DB_SCHEMA } },
  ) as unknown as SupabaseClient;
}
