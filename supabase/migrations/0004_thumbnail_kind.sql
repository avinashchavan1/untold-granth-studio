-- Reel covers (out/<ID>_cover.jpg): Instagram Reels cover + YouTube thumbnail
alter type public.file_kind add value if not exists 'thumbnail';
