-- Supabase flagged winback._migrations (rls_disabled_in_public, 14 Nov 2026):
-- the schema bootstrap's blanket grants gave anon/authenticated full access to
-- the runner's history table, so anyone with the anon key could read or delete
-- rows (a deleted row makes db:migrate re-apply old migrations).
-- The runner connects as the table owner, so RLS with no policies doesn't block it.
-- Already applied by hand on 2026-11-17; this file records it and is idempotent.
alter table winback._migrations enable row level security;
revoke all on winback._migrations from anon, authenticated;
