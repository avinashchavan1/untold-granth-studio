-- A reel is "published" as soon as it is posted on Instagram AND YouTube (app or marked by hand). Facebook is optional.
create or replace function public.mark_published_when_live() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(distinct platform) from public.publications
      where reel_id = new.reel_id and state = 'posted' and platform in ('instagram', 'youtube')) = 2 then
    update public.reels set stage = 'published' where id = new.reel_id and stage <> 'published';
  end if;
  return new;
end $$;
revoke execute on function public.mark_published_when_live() from public, anon, authenticated;
drop trigger if exists publications_mark_published on public.publications;
create trigger publications_mark_published after insert or update of state on public.publications
  for each row when (new.state = 'posted') execute function public.mark_published_when_live();
update public.reels r set stage = 'published'
where stage <> 'published' and (select count(distinct platform) from public.publications p
  where p.reel_id = r.id and p.state = 'posted' and p.platform in ('instagram', 'youtube')) = 2;
