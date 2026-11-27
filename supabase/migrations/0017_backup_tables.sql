-- Lists the public tables for the weekly backup (supabase/functions/_shared/backup.ts). Read-only.
create or replace function public.backup_tables() returns setof text language sql security definer set search_path = public as
'select tablename::text from pg_tables where schemaname = ''public'' order by tablename';
revoke all on function public.backup_tables() from public, anon, authenticated;
