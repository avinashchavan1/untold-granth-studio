-- Every stats reading (hourly while a post is new, then every 6 h, then daily): per-reel growth curves and "views at 24 h".
create table if not exists public.stats_log (
  reel_id  uuid not null references public.reels(id) on delete cascade,
  platform public.platform not null,
  at       timestamptz not null default now(),
  views    bigint, likes bigint, comments bigint, shares bigint, saves bigint, reach bigint,
  primary key (reel_id, platform, at)
);
create index if not exists stats_log_reel_idx on public.stats_log (reel_id, platform, at);
alter table public.stats_log enable row level security;
drop policy if exists "stats_log admins read" on public.stats_log;
create policy "stats_log admins read" on public.stats_log for select to authenticated using ((select public.is_admin()));
-- when "Refresh now" last ran (10-minute cooldown, keeps us far from Meta/YouTube rate limits)
alter table public.channels add column if not exists stats_refreshed_at timestamptz;
