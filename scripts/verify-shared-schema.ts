// ============================================================================
// scripts/verify-shared-schema.ts
//
// Verifies WinBack's footprint on the shared `Rochak's Hobby` Supabase project
// (docs/shared-supabase-db.md): nothing landed in `public`, RLS is on every
// table, one user can't read another's data, the audit trail is append-only,
// and the documents bucket is scoped per org.
//
// Run before `pnpm db:migrate` to record the baseline:
//   pnpm tsx scripts/verify-shared-schema.ts --snapshot
// Run after it to verify:
//   pnpm tsx scripts/verify-shared-schema.ts
//
// Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY and SUPABASE_DB_URL (env or .env.local).
// Creates two throwaway users through the service role and deletes them, and
// everything they created, at the end. Exits non-zero if any check fails.
// ============================================================================

import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const SCHEMA = 'winback';
const BUCKET = 'winback-documents';
const BASELINE_FILE = '.verify-baseline.json';
const WINBACK_TABLES = ['profiles', 'orgs', 'org_members', 'invites', 'companies', 'runs', 'run_audit'];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set. Add it to .env.local and try again.`);
    process.exit(1);
  }
  return value;
}

const dbUrl = requireEnv('SUPABASE_DB_URL');

function sql(query: string): string {
  return execFileSync('psql', [dbUrl, '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', query], {
    encoding: 'utf8',
  }).trim();
}

const publicWinbackTableCount = () =>
  Number(
    sql(
      `select count(*) from pg_tables where schemaname = 'public' and tablename in (${WINBACK_TABLES.map((t) => `'${t}'`).join(', ')})`,
    ),
  );

if (process.argv.includes('--snapshot')) {
  const count = publicWinbackTableCount();
  writeFileSync(BASELINE_FILE, JSON.stringify({ publicWinbackTables: count, at: new Date().toISOString() }) + '\n');
  console.log(`Baseline saved to ${BASELINE_FILE}: ${count} WinBack-named tables already in public.`);
  process.exit(0);
}

const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

const clientOptions = { db: { schema: SCHEMA }, auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, clientOptions) as unknown as SupabaseClient;

let failures = 0;
async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    failures++;
    console.log(`FAIL ${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function makeUser(label: string) {
  const email = `winback-verify-${label}-${randomUUID().slice(0, 8)}@example.com`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`create user ${label}: ${error?.message}`);
  const client = createClient(url, anonKey, clientOptions) as unknown as SupabaseClient;
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`sign in ${label}: ${signInError.message}`);
  return { id: data.user.id, client };
}

async function main() {
  // --- Catalog checks ---------------------------------------------------------
  await check('public has no winback tables', () => {
    assert(existsSync(BASELINE_FILE), `no ${BASELINE_FILE}; run with --snapshot before migrating`);
    const before = JSON.parse(readFileSync(BASELINE_FILE, 'utf8')).publicWinbackTables as number;
    const now = publicWinbackTableCount();
    assert(now <= before, `public has ${now} WinBack-named tables, baseline was ${before}`);
  });

  await check('rls on every winback table', () => {
    const tables = Number(sql(`select count(*) from pg_tables where schemaname = '${SCHEMA}' and tablename <> '_migrations'`));
    assert(tables === WINBACK_TABLES.length, `expected ${WINBACK_TABLES.length} tables in ${SCHEMA}, found ${tables}`);
    const missing = sql(
      `select string_agg(tablename, ', ') from pg_tables where schemaname = '${SCHEMA}' and tablename <> '_migrations' and not rowsecurity`,
    );
    assert(missing === '', `RLS off on: ${missing}`);
  });

  // --- Behaviour checks through the API, as real users ------------------------
  const userIds: string[] = [];
  let orgA: string | undefined;
  const objectPaths: string[] = [];

  try {
    const a = await makeUser('a');
    userIds.push(a.id);
    const b = await makeUser('b');
    userIds.push(b.id);

    const { data: orgId, error: orgError } = await a.client.rpc('create_org', { p_name: 'Verify Org A' });
    if (orgError || !orgId) throw new Error(`create_org: ${orgError?.message}`);
    orgA = orgId as string;

    const { data: company, error: companyError } = await a.client
      .from('companies')
      .insert({ org_id: orgA, name: 'Verify Co A' })
      .select('id')
      .single();
    if (companyError || !company) throw new Error(`insert company: ${companyError?.message}`);

    const runId = `verify-run-${randomUUID()}`;
    const { error: runError } = await a.client.from('runs').insert({ id: runId, user_id: a.id });
    if (runError) throw new Error(`insert run: ${runError.message}`);

    const auditId = `verify-audit-${randomUUID()}`;
    const { error: auditError } = await a.client
      .from('run_audit')
      .insert({ id: auditId, run_id: runId, user_id: a.id, actor: 'system', action: 'session_created' });
    if (auditError) throw new Error(`insert run_audit: ${auditError.message}`);

    await check("user B cannot read user A's org/company/run/audit", async () => {
      const targets: [string, string, string][] = [
        ['orgs', 'id', orgA!],
        ['companies', 'id', company.id],
        ['runs', 'id', runId],
        ['run_audit', 'id', auditId],
      ];
      for (const [table, column, value] of targets) {
        const asA = await a.client.from(table).select(column).eq(column, value);
        assert(!asA.error && asA.data?.length === 1, `${table}: owner can't see own row (${asA.error?.message ?? 'no rows'})`);
        const asB = await b.client.from(table).select(column).eq(column, value);
        assert(!asB.error, `${table}: ${asB.error?.message}`);
        assert(asB.data?.length === 0, `${table}: B read ${asB.data?.length} of A's rows`);
      }
    });

    const auditRowExists = async () => {
      const { data } = await a.client.from('run_audit').select('id, note').eq('id', auditId);
      return data?.[0];
    };

    await check('run_audit update denied', async () => {
      const { data } = await a.client.from('run_audit').update({ note: 'tampered' }).eq('id', auditId).select('id');
      assert((data?.length ?? 0) === 0, `update affected ${data?.length} rows`);
      const row = await auditRowExists();
      assert(row && row.note === null, 'audit row changed');
    });

    await check('run_audit delete denied', async () => {
      const { data } = await a.client.from('run_audit').delete().eq('id', auditId).select('id');
      assert((data?.length ?? 0) === 0, `delete affected ${data?.length} rows`);
      assert(await auditRowExists(), 'audit row is gone');
    });

    await check('runs delete denied', async () => {
      const { data } = await a.client.from('runs').delete().eq('id', runId).select('id');
      assert((data?.length ?? 0) === 0, `delete affected ${data?.length} rows`);
      assert(await auditRowExists(), 'audit row is gone (cascade)');
    });

    await check('bucket upload scoped', async () => {
      const prefix = `${orgA}/${company.id}`;
      const path = `${prefix}/x.txt`;
      const { error: uploadError } = await a.client.storage
        .from(BUCKET)
        .upload(path, new Blob(['verify'], { type: 'text/plain' }), { upsert: true });
      assert(!uploadError, `A upload: ${uploadError?.message}`);
      objectPaths.push(path);
      const asA = await a.client.storage.from(BUCKET).list(prefix);
      assert(asA.data?.length === 1, `A sees ${asA.data?.length ?? 0} objects (${asA.error?.message ?? ''})`);
      const asB = await b.client.storage.from(BUCKET).list(prefix);
      assert((asB.data?.length ?? 0) === 0, `B sees ${asB.data?.length} of A's objects`);
    });
  } catch (err) {
    failures++;
    console.log(`FAIL setup: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    // Service role bypasses RLS. Deleting the org cascades to companies,
    // memberships and invites; deleting the users cascades to runs/run_audit.
    if (objectPaths.length) await admin.storage.from(BUCKET).remove(objectPaths);
    if (orgA) await admin.from('orgs').delete().eq('id', orgA);
    for (const id of userIds) await admin.auth.admin.deleteUser(id);
  }

  console.log(failures === 0 ? '✓ all checks passed' : `✗ ${failures} check(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
