-- 0003_company_documents_storage.sql
--
-- A private Storage bucket for documents uploaded against a tracked company
-- during onboarding. Objects are stored under `{orgId}/{companyId}/{filename}`.
-- RLS mirrors the `companies` table: members can view, only admins can upload.
-- Shared project: bucket and policy names carry the `winback` prefix, and the
-- helper functions are schema-qualified because storage policies don't run
-- with the app's search path (docs/shared-supabase-db.md). CASE, not AND, so
-- the ::uuid cast can never run on another app's objects (e.g. continuum's
-- bucket): Postgres doesn't promise AND evaluates left to right.
-- No extraction pipeline wiring — files just land in Storage.

insert into storage.buckets (id, name, public)
values ('winback-documents', 'winback-documents', false)
on conflict (id) do nothing;

create policy "winback: company documents members read"
  on storage.objects for select
  using (
    case when bucket_id = 'winback-documents'
      then winback.is_org_member((storage.foldername(name))[1]::uuid)
      else false
    end
  );

create policy "winback: company documents admins upload"
  on storage.objects for insert
  with check (
    case when bucket_id = 'winback-documents'
      then winback.is_org_admin((storage.foldername(name))[1]::uuid)
      else false
    end
  );
