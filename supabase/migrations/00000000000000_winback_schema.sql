-- 00000000000000_winback_schema.sql
--
-- Bootstrap for the shared `Rochak's Hobby` Supabase project: WinBack owns the
-- `winback` schema and nothing else. See docs/shared-supabase-db.md, section 6.
create schema if not exists winback;
comment on schema winback is 'WinBack — https://github.com/rochak779/winback';

grant usage on schema winback to anon, authenticated, service_role;

grant all on all tables    in schema winback to anon, authenticated, service_role;
grant all on all routines  in schema winback to anon, authenticated, service_role;
grant all on all sequences in schema winback to anon, authenticated, service_role;

alter default privileges for role postgres in schema winback
  grant all on tables    to anon, authenticated, service_role;
alter default privileges for role postgres in schema winback
  grant all on routines  to anon, authenticated, service_role;
alter default privileges for role postgres in schema winback
  grant all on sequences to anon, authenticated, service_role;
