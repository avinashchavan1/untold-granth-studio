-- storyreel-studio — core schema
-- Everything the channel needs: series (books) → characters, locations, docs, reels → claims, files, publications.
-- Access: only emails in app_admins can read or write anything (RLS on every table).

create extension if not exists "pgcrypto";

-- ---------- access ----------
create table public.app_admins (
  email text primary key,
  added_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------- enums ----------
create type public.reel_stage as enum ('idea', 'researching', 'scripted', 'voiced', 'rendered', 'review', 'approved', 'published');
create type public.reel_kind as enum ('myth_buster', 'reveal', 'dialogue');
create type public.platform as enum ('instagram', 'youtube', 'facebook', 'threads', 'moj', 'sharechat', 'josh', 'whatsapp');
create type public.pub_state as enum ('todo', 'scheduled', 'posted', 'skipped');
create type public.char_tier as enum ('major', 'minor');
create type public.char_status as enum ('needed', 'audition', 'provisional', 'locked');
create type public.file_kind as enum ('master_instagram', 'master_youtube', 'final', 'preview', 'poster', 'citations', 'caption', 'audio', 'voice_reference', 'audition', 'source', 'backup', 'other');
create type public.file_store as enum ('supabase', 'github_release', 'github_repo', 'external');
create type public.doc_kind as enum ('style_guide', 'plan', 'skill', 'readme', 'brief', 'note');

-- ---------- series (one per book / show) ----------
create table public.series (
  id text primary key,                         -- e.g. 'my-series'
  name text not null,                          -- 'My Series'
  book text not null,                          -- the base text
  edition text,                                -- e.g. 'Critical edition; English: <translator>'
  config jsonb not null default '{}'::jsonb,   -- series.json: logo, title, tagline, palette, fonts, mix, handles…
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.channels (
  platform public.platform primary key,
  handle text not null,
  url text,
  notes text
);

-- ---------- cast ----------
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  series_id text not null references public.series(id) on delete cascade,
  key text not null,                           -- 'hero', 'sage'
  name text not null,
  tier public.char_tier not null default 'minor',
  status public.char_status not null default 'needed',
  voice jsonb not null default '{}'::jsonb,    -- cast.json entry: engine, voice_id/ref, ex, cfg, fx, mix_gain, source, licence
  look jsonb not null default '{}'::jsonb,     -- rig colours / design notes from art/chars.js
  notes text,
  first_reel text,
  unique (series_id, key)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  series_id text not null references public.series(id) on delete cascade,
  key text not null,                           -- 'hermitage', 'pampa'
  name text not null,
  builder text,                                -- JS builder, e.g. buildPampa(tod)
  description text,
  unique (series_id, key)
);

-- ---------- reels ----------
create table public.reels (
  id uuid primary key default gen_random_uuid(),
  series_id text not null references public.series(id) on delete cascade,
  code text not null,                          -- 'A01'
  plan_no int,                                 -- position in the 100-reel plan
  title text not null,
  kind public.reel_kind,
  stage public.reel_stage not null default 'idea',
  source_ref text,                             -- 'Aranya · 74 (CE 69–70)'
  art_cost text,                               -- '●', '●●', '●●●'
  plan_note text,                              -- risks / ⚠ notes from the plan
  hook_hi text,
  hook_en text,
  length_s numeric,
  script jsonb,                                -- full script.json
  timeline jsonb,                              -- built timeline.json (optional)
  captions jsonb not null default '{}'::jsonb, -- {instagram, facebook, youtube_title, youtube_description}
  hashtags text[] not null default '{}',
  verify_note text,
  reviewed boolean not null default false,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (series_id, code)
);
create index reels_stage_idx on public.reels (stage);
create index reels_series_plan_idx on public.reels (series_id, plan_no);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels(id) on delete cascade,
  position int not null default 0,
  claim text not null,
  ref text not null,                           -- book.chapter.verse
  quote_sa text,                               -- original-script text of the verse
  verified boolean not null default false,
  sources text[] not null default '{}'
);
create index claims_reel_idx on public.claims (reel_id);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid references public.reels(id) on delete cascade,
  series_id text references public.series(id) on delete cascade,
  kind public.file_kind not null,
  store public.file_store not null,
  path text,                                   -- storage path (supabase) or asset name (github release)
  url text,                                    -- download / view URL
  bytes bigint,
  spec text,                                   -- '1080×1920 · H.264 CRF 12 · AAC 320k'
  sha256 text,
  created_at timestamptz not null default now()
);
create index files_reel_idx on public.files (reel_id);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels(id) on delete cascade,
  platform public.platform not null,
  state public.pub_state not null default 'todo',
  post_url text,
  scheduled_for timestamptz,
  posted_at timestamptz,
  external_id text,                            -- platform media id (for API publishing later)
  notes text,
  unique (reel_id, platform)
);

-- ---------- documents (style guide, plan, skill, briefs) ----------
create table public.docs (
  id uuid primary key default gen_random_uuid(),
  series_id text references public.series(id) on delete cascade,  -- null = studio-wide
  slug text not null unique,
  title text not null,
  kind public.doc_kind not null,
  body_md text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------- activity log ----------
create table public.activity (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text,
  reel_id uuid references public.reels(id) on delete cascade,
  action text not null,
  detail jsonb not null default '{}'::jsonb
);
create index activity_at_idx on public.activity (at desc);

-- ---------- updated_at ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger reels_touch before update on public.reels for each row execute function public.touch_updated_at();
create trigger series_touch before update on public.series for each row execute function public.touch_updated_at();
create trigger docs_touch before update on public.docs for each row execute function public.touch_updated_at();

-- ---------- row level security: admins only ----------
create index files_series_idx on public.files (series_id);
create index publications_reel_idx on public.publications (reel_id);
create index characters_series_idx on public.characters (series_id);
create index docs_series_idx on public.docs (series_id);
create index activity_reel_idx on public.activity (reel_id);
do $$
declare t text;
begin
  foreach t in array array['app_admins','series','channels','characters','locations','reels','claims','files','publications','docs','activity'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s admins all" on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t, t);
  end loop;
end $$;

-- ---------- storage: private bucket for previews, posters, docs (≤50 MB per file on the free plan) ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('reel-media', 'reel-media', false, 52428800)
on conflict (id) do nothing;

create policy "reel-media admins read" on storage.objects for select to authenticated using (bucket_id = 'reel-media' and (select public.is_admin()));
create policy "reel-media admins insert" on storage.objects for insert to authenticated with check (bucket_id = 'reel-media' and (select public.is_admin()));
create policy "reel-media admins update" on storage.objects for update to authenticated using (bucket_id = 'reel-media' and (select public.is_admin()));
create policy "reel-media admins delete" on storage.objects for delete to authenticated using (bucket_id = 'reel-media' and (select public.is_admin()));

-- owner login (add more editors with: insert into public.app_admins(email) values ('...'))
-- the first admin is added by setup (scripts/setup.sh prints: insert into public.app_admins (email) values ('<owner email>');)
