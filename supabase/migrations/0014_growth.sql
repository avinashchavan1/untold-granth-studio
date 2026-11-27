-- Growth features: daily stats history, follower counts, per-claim review ticks, hook choice, reel request queue.

-- daily snapshot per posted reel and platform (Stats page trends; filled by the daily timer)
create table if not exists public.stats_daily (
  reel_id  uuid not null references public.reels(id) on delete cascade,
  platform public.platform not null,
  day      date not null,
  stats    jsonb not null default '{}'::jsonb,
  primary key (reel_id, platform, day)
);
alter table public.stats_daily enable row level security;
drop policy if exists "stats_daily admins read" on public.stats_daily;
create policy "stats_daily admins read" on public.stats_daily for select to authenticated using ((select public.is_admin()));

-- follower / subscriber count per platform per day
create table if not exists public.follower_daily (
  platform  public.platform not null,
  day       date not null,
  followers bigint,
  extra     jsonb not null default '{}'::jsonb,
  primary key (platform, day)
);
alter table public.follower_daily enable row level security;
drop policy if exists "follower_daily admins read" on public.follower_daily;
create policy "follower_daily admins read" on public.follower_daily for select to authenticated using ((select public.is_admin()));

-- review ticks per claim, keyed by the claim text (claims rows are rebuilt on every sync, the reel row is not)
alter table public.reels add column if not exists claim_checks jsonb not null default '{}'::jsonb;
-- the hook the owner picked from the script's hook_options (shown on the Script tab)
alter table public.reels add column if not exists hook_choice jsonb;
-- reel request queue: the owner presses "Make this"; Claude makes requests in queue order
alter table public.reels add column if not exists requested_at timestamptz;
alter table public.reels add column if not exists request_pos int;
alter table public.reels add column if not exists request_note text;
alter table public.reels add column if not exists requested_by text;
create index if not exists reels_request_idx on public.reels (request_pos) where requested_at is not null;

-- health checks the app shows as a banner (written by the studio function's "health" action and the daily timer)
alter table public.channels add column if not exists health jsonb not null default '{}'::jsonb;
