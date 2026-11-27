-- Full-length videos post through the same machinery as reels (approval, masters, publish jobs, publications):
-- each long-form video also has a reels row of kind 'longform' (same code as longform_videos.code). It posts to YouTube only,
-- so it is "published" as soon as YouTube is posted. The reel lists and the posting plan leave kind 'longform' out.
alter type public.reel_kind add value if not exists 'longform';
