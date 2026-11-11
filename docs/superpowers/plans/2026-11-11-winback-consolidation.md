# WinBack Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `rochak779/Winback-1` the single, public, working `rochak779/winback`. Its live demo runs again on the shared `Rochak's Hobby` Supabase project, the two other WinBack repos are retired, and the portfolio links to it.

**Architecture:** Winback-1 is already the finished one-deal prototype, with the audit trail and the portfolio-format README. Nothing is ported from `winback-final`; it is archived as an unfinished v2. The only code change is moving the app's database objects into a dedicated `winback` schema on the shared project, following the shared-database contract that Marg and Umeed already use. The remaining work is configuration, verification, README polish and GitHub/Vercel housekeeping.

**Tech Stack:** Next.js (App Router), `@supabase/ssr`, Supabase Postgres + Storage, Gemini, Vitest, pnpm, Vercel, `gh` CLI, `psql`.

**Spec:** decisions agreed on 11 Nov 2026 (summarised in "Decisions" below), plus the shared-database contract at `~/orca/projects/Marg/docs/shared-supabase-db.md`. Executors read both.

## Decisions (agreed with Rochak, 11 Nov 2026)

- Canonical repo: **Winback-1 → renamed `winback`**. Do not port anything from `winback-final`. It is ~55% complete per its `HANDOVER.md`/`CHECKLIST.md`.
- `winback-final`: **archive, keep private**. Do not delete it; it holds unfinished v2 work.
- `winback` (private one-day scaffold, 4 commits, created 2026-09-05): **delete**. This frees the name.
- Live demo: **restore** on the shared `Rochak's Hobby` project (ref `aqvpdfdfsterpdumjglx`) in schema `winback`.
- Portfolio case-study claims stay as they are ("working prototype, one deal, sample data"). Only the GitHub URL changes.

## Global Constraints

- Follow `Marg/docs/shared-supabase-db.md` exactly. Key rules:
  - Everything goes in schema `winback`.
  - Pin `search_path = winback, extensions, pg_temp` on every function.
  - Storage bucket and policy names are prefixed `winback-` and `"winback: …"`, and policies are scoped by `bucket_id`.
  - No objects in `public`. No triggers on `auth.users`.
- **Never** run `supabase db push`, `supabase db reset --linked`, `supabase db pull` or `supabase link` against the shared project. Apply migrations only with `pnpm db:migrate`.
- Don't change shared auth settings (Site URL, email templates, providers). Adding WinBack's own redirect URLs is allowed.
- Leave the `umeed` and `marg` schemas, and their Exposed-schemas entries, untouched.
- Never commit `SUPABASE_DB_URL`, the service role key or the DB password. The shared service role key exposes every hobby app.
- Don't rewrite Git history. The repo is already public, so if a secret is found, **rotate** it.
- Every GitHub/Vercel/Supabase action that is outward-facing or hard to undo needs Rochak's explicit OK at the moment it is run. That covers deleting, archiving, renaming, making public, changing env vars, promoting to production and the dashboard changes.
- Portfolio repo edits need Rochak's explicit "go" (portfolio project rule).

## Review Focus

1. **Umeed or Marg regress after WinBack lands in the shared project.** Both must still sign in and load their core screen. Owned by Task 5, step "smoke-test the other apps".
2. **Auth emails point at another app's Site URL.** Sign-up uses the shared Site URL unless `emailRedirectTo` is passed. Expected: WinBack's confirmation link returns to WinBack. Owned by Task 3, test `sign-up passes emailRedirectTo`.
3. **Cross-user data leak under the new schema.** User B must read none of user A's `orgs`/`companies`/`runs`/`run_audit` rows. Owned by Task 4, `verify-shared-schema` checks.
4. **Audit trail stops being append-only.** UPDATE/DELETE on `winback.run_audit` and DELETE on `winback.runs` must be denied for the owner. Owned by Task 4.
5. **Storage upload breaks after the bucket rename.** Onboarding upload and dashboard listing must work in `winback-documents`. Owned by Task 3 (code) and Task 5 (live check).

---

### Task 1: Sync the workspace and set a green baseline

**Files:**
- Workspace: `~/orca/projects/Winback/winback` (existing Winback-1 clone; 22 commits behind, untracked `.claude/` and `docs/superpowers/plans/2026-09-05-audit-trail.md`).

**Interfaces:** Produces an up-to-date `main` with passing typecheck/tests/build.

- [ ] **Step 1:** Run `git fetch && git diff --no-index docs/superpowers/plans/2026-09-05-audit-trail.md <(git show origin/main:docs/superpowers/plans/2026-09-05-audit-trail.md)`.
  - If identical: delete the untracked copy.
  - If different: move it to `~/orca/projects/Winback/` and tell Rochak.
- [ ] **Step 2:** Run `git pull --ff-only`. Expected: fast-forward to `5c8eaea` or later.
- [ ] **Step 3:** Run `pnpm install && pnpm typecheck && pnpm test && pnpm build`. Expected: all pass. Record any pre-existing failure in this plan before changing code, and don't fix it silently.
- [ ] **Step 4:** Create the branch: `git switch -c shared-db-schema`.

### Task 2: Secret scan of the full history

**Files:**
- Modify: `scripts/scan-secrets.sh:13`. Remove the placeholder `FIREBASE_API_KEY_ALLOWLIST="<INSERT_API_KEY_IF_KNOWN_OR_SKIP_FOR_NOW>"` and the allowlist logic. Firebase is no longer used (see Task 6).

- [ ] **Step 1:** Run `bash scripts/scan-secrets.sh`. Expected: exit 0.
- [ ] **Step 2:** Run `git log -p --all | grep -nE 'eyJhbGciOi[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|SUPABASE_SERVICE_ROLE_KEY=.+|postgres(ql)?://[^ ]*:[^ ]*@'`. Expected: no matches. Any match means that key has been public since September: stop, tell Rochak, and rotate it before continuing.
- [ ] **Step 3:** Commit: `git commit -am "chore(security): drop stale Firebase allowlist from secret scan"`.

### Task 3: Make the app schema-aware (code)

**Files:**
- Create: `src/lib/supabase/schema.ts` with `export const DB_SCHEMA = 'winback' as const;` and `export const DOCUMENTS_BUCKET = 'winback-documents' as const;`
- Modify: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`. Pass `{ db: { schema: DB_SCHEMA } }` (server: merge with the existing `cookies` options). Cast once to `SupabaseClient` per the contract's TypeScript note.
- Modify: `src/app/dashboard/page.tsx:54`, `src/app/onboarding/page.tsx:117`. Replace `'company-documents'` with `DOCUMENTS_BUCKET`.
- Create: `src/lib/auth/sign-up.ts` with `export function signUpWithRedirect(supabase: SupabaseClient, email: string, password: string, origin: string)`. It returns `supabase.auth.signUp({ email, password, options: { emailRedirectTo: \`${origin}/sign-in\` } })`.
- Modify: `src/app/sign-up/page.tsx:25`. Call `signUpWithRedirect(supabase, email, password, window.location.origin)`.
- Check: `grep -rn "createClient(\|createServerClient(\|createBrowserClient(" src scripts` must list only the two files above. Any other client gets the same schema option.
- Test: `src/lib/supabase/schema.test.ts`, `src/lib/auth/sign-up.test.ts`. Vitest runs in the `node` environment with no DOM library, so test pure functions only and add no dependencies.

**Interfaces:** Produces `DB_SCHEMA`, `DOCUMENTS_BUCKET` (Task 4 uses the same literal values in SQL).

- [ ] **Step 1: Write the failing tests.**
  - `schema.test.ts` → `it('browser client targets the winback schema')`. Mock `@supabase/ssr`'s `createBrowserClient`, call `createBrowserSupabaseClient()`, and assert the third argument contains `{ db: { schema: 'winback' } }`.
  - Same file → `it('server client targets the winback schema')`. Mock `next/headers` `cookies` and `createServerClient`, and assert `db.schema === 'winback'` and that `cookies.getAll` is still present.
  - `sign-up.test.ts` → `it('sign-up passes emailRedirectTo')`. Call `signUpWithRedirect(fake, 'a@b.co', 'pw123456', 'https://winback-1.vercel.app')` with `fake = { auth: { signUp: vi.fn() } }`. Assert `signUp` received `{ email: 'a@b.co', password: 'pw123456', options: { emailRedirectTo: 'https://winback-1.vercel.app/sign-in' } }`.
- [ ] **Step 2:** Run `pnpm test src/lib/supabase src/lib/auth`. Expected: 3 FAIL.
- [ ] **Step 3:** Implement the file changes listed above.
- [ ] **Step 4:** Run `pnpm test && pnpm typecheck && pnpm build`. Expected: PASS.
- [ ] **Step 5:** Commit: `git commit -m "feat(db): target the winback schema and prefixed documents bucket"`.

### Task 4: Make the migrations schema-aware and add the runner

The shared database has never run WinBack's migrations, so edit `0001`–`0006` in place, per the contract's section 7, step 3.

**Files:**
- Create: `supabase/migrations/00000000000000_winback_schema.sql`. Use the contract's section 6 bootstrap with `<app>` = `winback` and the comment `'WinBack — https://github.com/rochak779/winback'`.
- Modify: `supabase/migrations/0001_auth_foundation.sql` … `0006_runs_no_delete.sql`:
  - Every `create function`/`create or replace function` (`is_org_member`, `is_org_admin`, `get_invite_preview`, `accept_invite`, `create_org`) gets `set search_path = winback, extensions, pg_temp`. Replace any existing `search_path = public`.
  - `0003`: bucket id/name become `'winback-documents'`. Policies are renamed to `"winback: company documents members read"` / `"winback: company documents admins upload"`, keep `bucket_id = 'winback-documents'`, and call `winback.is_org_member(...)` / `winback.is_org_admin(...)` schema-qualified, because storage policies don't run with the app's search path.
  - Confirm with `grep -n "public\.\|auth\.users" supabase/migrations/*.sql` that only foreign-key `references auth.users(id)` remains. There must be no trigger on `auth.users`.
- Create: `scripts/db-migrate.sh`, copied verbatim from the contract's section 5 with `APP="winback"`. Add `"db:migrate": "scripts/db-migrate.sh"` to `package.json`.
- Create: `scripts/verify-shared-schema.ts`, run with `pnpm tsx scripts/verify-shared-schema.ts`. It uses the anon key and two throwaway users created via the service role, and deletes them at the end.
- Modify: `.env.example`. Add an empty `SUPABASE_DB_URL=` and a comment pointing to the contract.
- Create: `docs/shared-supabase-db.md`, a verbatim copy of Marg's contract, with the registry gaining a row: `winback` | WinBack (PE diligence prototype) | github.com/rochak779/winback | — | — | `winback-documents`. Link it from `AGENTS.md`/`CLAUDE.md`.

**Interfaces:** Consumes `DB_SCHEMA`/`DOCUMENTS_BUCKET` literals from Task 3. Produces `pnpm db:migrate` and `verify-shared-schema`, both used in Task 5.

- [ ] **Step 1: Write `verify-shared-schema.ts`.** It exits non-zero on any failed check. Each check prints `PASS <name>` or `FAIL <name>`:
  - `public has no winback tables`: `select count(*) from pg_tables where schemaname='public' and tablename in ('profiles','orgs','org_members','invites','companies','runs','run_audit')` returns the same count as a snapshot taken before migrating (it must not increase).
  - `rls on every winback table`: `select count(*) from pg_tables where schemaname='winback' and tablename<>'_migrations' and not rowsecurity` = 0.
  - `user B cannot read user A's org/company/run/audit`: A creates an org via `rpc('create_org')`, a company, a run and one audit row. B's `.from(...).select()` returns 0 rows for each.
  - `run_audit update denied` and `run_audit delete denied`: A's update/delete affects 0 rows.
  - `runs delete denied`: A's delete on its own run affects 0 rows, and the audit row still exists.
  - `bucket upload scoped`: A uploads `{orgA}/{companyA}/x.txt` to `winback-documents`. B listing that prefix returns 0 objects.
- [ ] **Step 2:** Edit the migrations and add the bootstrap/runner as listed above.
- [ ] **Step 3:** Static check: `grep -c "set search_path = winback, extensions, pg_temp" supabase/migrations/*.sql` matches the number of `create … function` statements. `grep -n "company-documents" -r supabase src` returns nothing.
- [ ] **Step 4:** Commit: `git commit -m "feat(db): schema-aware migrations, per-app runner and RLS verification for the shared project"`.

### Task 5: Apply to the shared project and verify the live app

Needs Rochak to be present: dashboard access, DB password and the Vercel OK.

- [ ] **Step 1 (pre-flight):** Run `psql "$SUPABASE_DB_URL" -Atc "select nspname from pg_namespace order by 1"`. Expected: no `winback` yet, while `umeed` and `marg` are present. Snapshot `select schemaname, count(*) from pg_tables group by 1` and `select count(*) from pg_policies where schemaname in ('umeed','marg','storage')` to `~/orca/projects/Winback/shared-db-before.txt`.
- [ ] **Step 2 (Rochak, dashboard):** Project Settings → Data API → Exposed schemas → **add** `winback` and keep the others. Auth → URL Configuration → Redirect URLs → add `https://winback-1.vercel.app/**` and `http://localhost:3000/**`. After Task 7's rename, also add the new domain.
- [ ] **Step 3:** Put the shared values in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (session pooler, port 5432, `aws-1-…` host).
- [ ] **Step 4:** Run `pnpm db:migrate`. Expected: seven `→ applying` lines, then `✓ winback is up to date`. Run it again; expected: only `✓ winback is up to date`.
- [ ] **Step 5:** Run `pnpm tsx scripts/verify-shared-schema.ts`. Expected: every line `PASS`, exit 0.
- [ ] **Step 6:** Re-run the step 1 snapshot and diff it against `shared-db-before.txt`. Expected: the only differences are the new `winback` schema/tables and the two `winback:` storage policies.
- [ ] **Step 7 (smoke-test the other apps):** Sign in to Umeed and Marg (live URLs) and load each app's main screen. Expected: unchanged.
- [ ] **Step 8:** Run `pnpm tsx scripts/gemini-smoke.ts`. Expected: a successful model call. If the key fails, Rochak issues a new one before Task 6.
- [ ] **Step 9:** Local golden path with `pnpm dev`, all on WinBack's own pages:
  1. Sign up a demo account, confirm the email and sign in.
  2. Onboarding: create an org and upload the sample documents.
  3. Dashboard → deal: run extract → benchmark → portfolio → crosscheck.
  4. Accept one finding, dismiss one, edit one, set the memo status.
  5. Open `/deal/[id]/audit`. Expected: stage, model and analyst entries appear in order, and the ƒ markers open their calculations.
- [ ] **Step 10:** Rerun `pnpm test && pnpm build`, then commit any fix-ups.

### Task 6: Vercel environment and deploy

Rochak must OK each env change and the production promotion.

- [ ] **Step 1:** In the `winback-1` project (Production + Preview), set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to the shared values. Use `vercel env rm/add --project winback-1`, or the dashboard.
- [ ] **Step 2:** Run `grep -rniE "firebase|firestore" src scripts`. If there are no matches, remove the stale vars `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIRESTORE_DATABASE_ID` and `NEXT_PUBLIC_FIREBASE_{API_KEY,AUTH_DOMAIN,PROJECT_ID}`. Confirm `MOCK_LLM` is unset in Production; the app throws at startup if it is `1` in production.
- [ ] **Step 3:** Push the branch. Expected: a Vercel preview deploys. Repeat Task 5 step 9 on the preview URL (add the preview domain pattern to Redirect URLs if sign-in redirects fail).
- [ ] **Step 4:** Merge to `main`. Expected: production deploys. Repeat step 9's sign-in and audit view on `https://winback-1.vercel.app`.
- [ ] **Step 5:** Create the public demo login Rochak chooses, through the app's own sign-up, and record it in the README only if he wants it public.

### Task 7: README polish

**Files:** Modify `README.md`.

- [ ] **Step 1:** Remove the hidden `TODO(Rochak)` comment block. Add a real screenshot of the crosscheck screen from the working demo at `docs/readme/screenshot.png` (≤ 300 KB, WebP or PNG) with the existing alt text.
- [ ] **Step 2:** Under the title, add `**Built independently by Rochak Agarwal:** product concept, design and implementation.`, matching the portfolio's "Sole product builder".
- [ ] **Step 3:** Add `[Watch the demo →](https://youtu.be/AXVH13EHEqU)` beside the live-app link. Keep "Results & evidence" and "Scope & limits" wording as is; it matches the portfolio claims.
- [ ] **Step 4:** Add a short "Database" section: shared Supabase project, schema `winback`, `pnpm db:migrate` only, and a link to `docs/shared-supabase-db.md`.
- [ ] **Step 5:** Commit and push: `git commit -am "docs(readme): screenshot, builder credit, demo video and database notes"`.

### Task 8: GitHub and hosting consolidation

Each step is irreversible or outward-facing: ask Rochak immediately before each one.

- [ ] **Step 1:** Run `gh auth refresh -h github.com -s delete_repo`. This one is interactive, so Rochak runs it himself as `! gh auth refresh -h github.com -s delete_repo`.
- [ ] **Step 2:** Run `gh repo archive rochak779/winback-final --yes`. Expected: `gh repo view rochak779/winback-final --json isArchived,visibility` reports `true`, `PRIVATE`.
- [ ] **Step 3:** Run `gh repo view rochak779/winback --json name,createdAt` and check `createdAt` is `2026-09-05T14:03:29Z`, so it's the scaffold. Then run `gh repo delete rochak779/winback --yes`. Restorable for 90 days from GitHub settings.
- [ ] **Step 4:** Run `gh repo rename winback -R rochak779/Winback-1 --yes`, then `git remote set-url origin https://github.com/rochak779/winback.git`. Expected: `curl -sI https://github.com/rochak779/Winback-1` returns a 301 to `/rochak779/winback`.
- [ ] **Step 5:** In Vercel `winback-1` → Git, confirm the repo shows as `rochak779/winback`. Push an empty commit and confirm auto-deploy still fires.
- [ ] **Step 6 (optional, Rochak's choice):**
  - Rename the Vercel project to `winback` if `winback.vercel.app` is free. Add the new domain to Supabase Redirect URLs and the README, and keep `winback-1.vercel.app` working.
  - Delete the Vercel project `winback-final`; its app can't sign in because its database no longer exists.
  - Delete the paused Supabase project `winback` (`lcmeyvqpyumpdokfryol`) once Task 5 has passed. Its data was demo-only, but confirm with Rochak first.

### Task 9: Portfolio link

Work in `~/orca/projects/Portfolio`, with Rochak's "go".

**Files:** Modify `content/portfolio-content.ts:57`: change `https://github.com/rochak779/winback-final` to `https://github.com/rochak779/winback`.

- [ ] **Step 1:** Make the edit. Nothing else in the WinBack case study changes.
- [ ] **Step 2:** Run `npm run typecheck && npm run build`. Expected: privacy check passes and 25 pages build.
- [ ] **Step 3:** Start the preview, then run `curl -s http://localhost:3005/projects/winback | grep -o 'https://github.com/rochak779/winback[^"]*'`. Expected: exactly `https://github.com/rochak779/winback`. `curl -sL -o /dev/null -w '%{http_code}' https://github.com/rochak779/winback` returns `200` while logged out.
- [ ] **Step 4:** Add a dated status note to the portfolio `AGENTS.md`/handover per project convention. No publication.
