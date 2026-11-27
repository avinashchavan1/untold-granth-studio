-- Post everywhere + scheduling.
-- 1. publication states the publisher already writes ('posting', 'failed') but the enum never had
alter type public.pub_state add value if not exists 'posting';
alter type public.pub_state add value if not exists 'failed';

-- 2. what a scheduled post should use (privacy etc.), who scheduled it, and the last scheduler error
alter table public.publications add column if not exists schedule_options jsonb not null default '{}'::jsonb;
alter table public.publications add column if not exists scheduled_by text;
alter table public.publications add column if not exists last_error text;
create index if not exists publications_due_idx on public.publications (scheduled_for) where state = 'scheduled';

-- 3. the timer: every 5 minutes the database asks the job function to start any posts that are due.
--    (pg_cron + pg_net; the shared secret lives only in cron.job and the function's CRON_SECRET.)
create extension if not exists pg_cron;
create extension if not exists pg_net;
-- the schedule itself is created by scripts/schedule_setup.py (it needs the project URL and the secret)
