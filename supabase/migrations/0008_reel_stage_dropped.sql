-- Reels merged or abandoned leave the pipeline (board, lists, counts) but stay findable under Plan → Dropped or merged
alter type public.reel_stage add value if not exists 'dropped';
