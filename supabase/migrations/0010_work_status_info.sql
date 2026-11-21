-- Richer live status for the collapsible work panel: queue of reels, sub-phases, recent events, overall estimate.
-- info = { title, phase, phases: [{name, state: done|running|todo, pct?}], queue: [{code, title, state, note?}],
--          events: [{at, text}], overall_eta_min, elapsed_min }
alter table public.work_status add column if not exists info jsonb not null default '{}'::jsonb;
