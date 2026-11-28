-- "For you" list: things only the owner can do (approve, connect, choose a look, top up a budget...).
-- Claude adds rows with `python3 scripts/status.py ask "..."`; the app also derives items (reels to approve, failed posts,
-- connection issues, low voice budget). The owner ticks a row done in the app.
create table if not exists public.owner_actions (
  id bigserial primary key,
  key text unique,                       -- stable id so re-asking the same thing updates it instead of duplicating
  title text not null,
  detail text,
  link text,                             -- app path ("/connections") or https URL
  reel_code text,
  priority int not null default 2,       -- 1 urgent · 2 normal · 3 when you have time
  due date,
  created_at timestamptz not null default now(),
  done_at timestamptz,
  done_by text
);
alter table public.owner_actions enable row level security;
drop policy if exists "owner_actions admins read" on public.owner_actions;
create policy "owner_actions admins read" on public.owner_actions for select to authenticated using ((select public.is_admin()));
drop policy if exists "owner_actions admins update" on public.owner_actions;
create policy "owner_actions admins update" on public.owner_actions for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
