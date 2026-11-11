-- 0003_company_documents_storage.sql
--
-- A private Storage bucket for documents uploaded against a tracked company
-- during onboarding. Objects are stored under `{orgId}/{companyId}/{filename}`.
-- RLS mirrors the `companies` table: members can view, only admins can upload.
-- Shared project: bucket and policy names carry the `winback` prefix, and the
-- helper functions are schema-qualified because storage policies don't run
-- with the app's search path (docs/shared-supabase-db.md).
-- No extraction pipeline wiring — files just land in Storage.

insert into storage.buckets (id, name, public)
values ('winback-documents', 'winback-documents', false)
on conflict (id) do nothing;

create policy "winback: company documents members read"
  on storage.objects for select
  using (
    bucket_id = 'winback-documents'
    and winback.is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "winback: company documents admins upload"
  on storage.objects for insert
  with check (
    bucket_id = 'winback-documents'
    and winback.is_org_admin((storage.foldername(name))[1]::uuid)
  );
