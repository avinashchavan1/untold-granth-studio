-- Posting system tables: connection secrets, publish jobs and OAuth state.
-- integrations + oauth_states: RLS on, no policies, so only the edge functions (service role) can read or write them.
-- publish_jobs: admins can read their job status in the app; only the edge functions write.

create table if not exists public.integrations (
  provider     text primary key,
  data         jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  updated_at   timestamptz not null default now()
);
alter table public.integrations enable row level security;

create table if not exists public.oauth_states (
  state      text primary key,
  provider   text not null,
  return_to  text,
  created_at timestamptz not null default now()
);
alter table public.oauth_states enable row level security;

create table if not exists public.publish_jobs (
  id               uuid primary key default gen_random_uuid(),
  reel_id          uuid not null references public.reels(id) on delete cascade,
  platform         text not null,
  status           text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  step             text,
  log              text not null default '',
  options          jsonb not null default '{}'::jsonb,
  requested_by     text,
  token_hash       text,
  token_expires_at timestamptz,
  result_url       text,
  external_id      text,
  created_at       timestamptz not null default now(),
  started_at       timestamptz,
  finished_at      timestamptz
);
create index if not exists publish_jobs_reel_idx on public.publish_jobs (reel_id, created_at desc);
alter table public.publish_jobs enable row level security;
drop policy if exists "publish_jobs admins read" on public.publish_jobs;
create policy "publish_jobs admins read" on public.publish_jobs for select to authenticated using ((select public.is_admin()));
revoke all on public.publish_jobs from anon;
-- the app may read every column except the one-time token hash
revoke all on public.publish_jobs from authenticated;
grant select (id, reel_id, platform, status, step, log, options, requested_by, result_url, external_id, created_at, started_at, finished_at) on public.publish_jobs to authenticated;
revoke all on public.integrations, public.oauth_states from anon, authenticated;
