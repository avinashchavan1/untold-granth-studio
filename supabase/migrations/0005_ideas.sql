-- Ideas inbox: quick notes to turn into reels later (Ideas page; "Promote to plan" creates a reel at stage idea)
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  body text not null check (length(body) between 1 and 4000),
  tags text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'promoted', 'dropped')),
  reel_id uuid references public.reels(id) on delete set null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ideas_status_idx on public.ideas (status, created_at desc);
alter table public.ideas enable row level security;
create policy "ideas admins read" on public.ideas for select to authenticated using ((select public.is_admin()));
create policy "ideas admins insert" on public.ideas for insert to authenticated with check ((select public.is_admin()));
create policy "ideas admins update" on public.ideas for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "ideas admins delete" on public.ideas for delete to authenticated using ((select public.is_admin()));
