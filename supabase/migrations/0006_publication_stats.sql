-- Engagement numbers per post (studio refresh_stats): views, likes, comments, shares, saves
alter table public.publications add column if not exists stats jsonb not null default '{}'::jsonb;
alter table public.publications add column if not exists stats_at timestamptz;
