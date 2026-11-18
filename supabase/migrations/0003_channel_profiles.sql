-- Profile copy per platform (name, bio/description, keywords, links, manual steps), shown on the Profiles page
-- and applied to YouTube by the studio function. Source of truth: brand/profiles.json (scripts/brand.py).
alter table public.channels add column if not exists profile jsonb not null default '{}'::jsonb;
alter table public.channels add column if not exists applied jsonb not null default '{}'::jsonb;  -- what was last pushed by the app, and when
