-- Smart timing + Autopilot.
-- peers: similar channels whose public posts we study (YouTube Data API / Instagram Business Discovery; no scraping)
create table if not exists public.peers (
  id          uuid primary key default gen_random_uuid(),
  platform    public.platform not null,
  handle      text not null,                 -- @handle (YouTube) or username (Instagram)
  external_id text,                          -- YouTube channel id / Instagram user id
  title       text,
  followers   bigint,
  active      boolean not null default true,
  source      text not null default 'auto',  -- 'auto' (found by search) or 'owner'
  last_scan   timestamptz,
  last_error  text,
  created_at  timestamptz not null default now(),
  unique (platform, handle)
);
-- their recent posts: publish time + public performance
create table if not exists public.peer_posts (
  platform     public.platform not null,
  post_id      text not null,
  peer_id      uuid not null references public.peers(id) on delete cascade,
  published_at timestamptz not null,
  duration_s   numeric,
  views        bigint,
  likes        bigint,
  comments     bigint,
  fetched_at   timestamptz not null default now(),
  primary key (platform, post_id)
);
create index if not exists peer_posts_peer_idx on public.peer_posts (peer_id, published_at desc);
-- our own audience activity (Instagram online_followers: followers online per hour, IST)
create table if not exists public.audience_hourly (
  platform public.platform not null,
  hour_ist smallint not null check (hour_ist between 0 and 23),
  value    numeric not null,
  updated_at timestamptz not null default now(),
  primary key (platform, hour_ist)
);
-- the model: a score per platform × weekday (0 = Sun, IST) × hour (IST), plus how it was built
create table if not exists public.timing_model (
  platform   public.platform primary key,
  grid       jsonb not null,           -- [7][24] scores, mean 1
  top        jsonb not null default '[]'::jsonb,
  parts      jsonb not null default '{}'::jsonb,   -- weights + sample sizes per source
  updated_at timestamptz not null default now()
);
-- autopilot settings (one row)
create table if not exists public.autopilot (
  id          smallint primary key default 1 check (id = 1),
  enabled     boolean not null default false,
  platforms   text[] not null default '{instagram,youtube,facebook}',
  days_ahead  smallint not null default 7,
  updated_by  text,
  updated_at  timestamptz not null default now(),
  last_run    jsonb not null default '{}'::jsonb
);
insert into public.autopilot (id) values (1) on conflict do nothing;

do $$ declare t text; begin
  foreach t in array array['peers','peer_posts','audience_hourly','timing_model','autopilot'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s admins read" on public.%I', t, t);
    execute format('create policy "%s admins read" on public.%I for select to authenticated using ((select public.is_admin()))', t, t);
  end loop;
end $$;

alter table public.autopilot add column if not exists post_days smallint[] not null default '{1,2,4,5}';  -- 0 = Sun (IST); from calendar.json post_days
alter table public.autopilot add column if not exists peer_search text[] not null default '{}';  -- YouTube search terms used once to find similar channels (set per channel)
