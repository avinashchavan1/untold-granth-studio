-- Full-length (16:9) videos and the reels derived from them. One row per video, synced by scripts/sync.py from
-- studio/series/<id>/longform/<code>/longform.json (beats, research, characters, derived reels live in `plan`).
create table if not exists public.longform_videos (
  id uuid primary key default gen_random_uuid(),
  series_id text not null references public.series(id) on delete cascade,
  code text not null,
  title text not null,
  subtitle text,
  stage text not null default 'researching',
  plan jsonb not null default '{}'::jsonb,
  preview_path text,          -- storage path of the latest preview (reel-media bucket), when one exists
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (series_id, code)
);
alter table public.longform_videos enable row level security;
create policy "longform_videos admins all" on public.longform_videos for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
