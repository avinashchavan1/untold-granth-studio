-- Live "what is Claude doing right now" status, shown as a progress bar on every page of the app.
-- One row per lane ('main'); written by scripts/status.py from the studio (service role), read by admins.
create table if not exists public.work_status (
  lane text primary key default 'main',
  state text not null default 'idle' check (state in ('working', 'waiting', 'idle')),
  reel_code text,
  task text,                 -- e.g. "Rendering the 4K and 1080p masters"
  detail text,               -- e.g. "segment 2 of 3 · 1380 / 1783 frames"
  step int,                  -- pipeline step, 1..steps
  steps int,
  pct numeric check (pct is null or (pct >= 0 and pct <= 100)),
  eta_min numeric,
  started_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.work_status enable row level security;
create policy "work_status admins read" on public.work_status for select to authenticated using ((select public.is_admin()));
insert into public.work_status (lane, state, task) values ('main', 'idle', null) on conflict do nothing;
