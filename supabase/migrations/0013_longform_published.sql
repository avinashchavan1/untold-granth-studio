create or replace function public.mark_published_when_live() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select kind::text from public.reels where id = new.reel_id) = 'longform' then
    if new.platform = 'youtube' then update public.reels set stage = 'published' where id = new.reel_id and stage <> 'published'; end if;
  elsif (select count(distinct platform) from public.publications
      where reel_id = new.reel_id and state = 'posted' and platform in ('instagram', 'youtube')) = 2 then
    update public.reels set stage = 'published' where id = new.reel_id and stage <> 'published';
  end if;
  update public.longform_videos l set stage = 'published' from public.reels r
    where r.id = new.reel_id and r.kind::text = 'longform' and new.platform = 'youtube' and l.series_id = r.series_id and l.code = r.code;
  return new;
end $$;
revoke execute on function public.mark_published_when_live() from public, anon, authenticated;
