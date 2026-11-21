# storyreel-studio: plan for the generic template (owner-approved Nov 21 2026)

Goal: ship everything we built for Untold Granth (engine, studio app, Supabase backend, publishing, skills, playbook) as a
**private template repo `avinashchavan1/storyreel-studio`** with NO story in it. Each new channel (Mahabharata, Vishnu Purana,
Krishna stories...) = "Use this template" → `setup.sh` → its own app + database. This repo (untold-granth-studio) keeps working unchanged.

## Owner's decisions
- Shape: **template repo** (one channel per copy), not a multi-series app.
- Include: **example series**, **reusable art library**, **playbook docs**, **publishing pipeline** (all four).
- Repo: **new private repo `storyreel-studio`** (created; the Claude GitHub App must include it, then `add_repo`).
- Hosting: **separate per channel** (own Supabase project, Netlify site, HF masters/audio repos). Keys stay network secrets.

## How to run this work
Start a NEW session with BOTH repos selected (untold-granth-studio = source, storyreel-studio = target). Build in the target repo;
never edit the source repo for this. First message: "build storyreel-studio from docs/STORYREEL_TEMPLATE_PLAN.md".

## What is already generic (keep as is)
- `studio/engine/js` renderer: serves layers `reel/src > series/art > engine/js` (render.js), plus `series.js` from series.json.
- `studio/engine/py`: TTS (ElevenLabs), take picker (ASR, shouting guard, never-chop trim + fades, no_cut, śloka unsqueezed),
  mixing (score.gain / score.duck per reel), covers, masters.
- `make_reel.py` CLI (new, check, narration, pick, audio, stills, render, thumb, sheet, desk).

## The split (source → template)
| Area | Story/owner-specific today | In the template |
|---|---|---|
| Identity | "Untold Granth", @untoldgranth.official, @untoldgranth, app URL | `channel.json` (name, handles, language, app_url, tagline, logo) read by app + scripts + engine |
| Base text | Valmiki CE, enjoylearningsanskrit.com, kanda.sarga.verse | `channel.json → source` {name, edition, citation_format "book.chapter.verse", fetch_url_pattern}; `scripts/ce_verse.py` → `scripts/source_verse.py` |
| Infra | Supabase ref spsrryrycowxmgiofyxo, HF Avinash1443/untold-granth-masters, Netlify site | `channel.json → infra` placeholders; setup checklist; nothing hard-coded |
| Series | `studio/series/untold-ramayana` | `studio/series/example` (tiny demo); real series created by `make_reel.py new-series` |
| Art | `series/untold-ramayana/art/{chars,bg,templates}.js` | new layer `studio/engine/art/` = shared library (generic rigs: man/woman/monk/sage/king/vanara/bear, sets: palace, court, battlefield, sky, dawn, Himalaya, forest, manuscript; templates: sourceCard, slokaSource→verseSource, quoteCard, endCard); series art overrides. Ramayana-only looks (CH.rama, CH.hanuman...) stay in the source repo |
| Occasions | Hindu festival calendar in `src/lib/occasions.ts` | `channel.json → occasions` (data, not code), with the Hindu calendar as an opt-in preset |
| Address rule | Rama-specific forms | `series.json → address` (already data); keep the checker generic |
| Docs | CLAUDE.md, STYLE_GUIDE.md, make-reel SKILL.md | `PLAYBOOK.md` (rules below), CLAUDE.md template with `{{channel}}` blanks, generic make-reel skill |
| Publish desk rows, brand/ | Untold Granth data | removed; `brand/make_brand.py` kept, driven by channel.json |
| Supabase | migrations 0001-0009, functions studio/job/oauth | kept; strip seeds and names; `seed_sql.py` reads channel.json |

Files with references to clean (from a grep on Nov 21): CLAUDE.md, scripts/{sync,seed_sql,cast_media,masters,media,audiopack,status,deploy,ce_verse}.py/sh,
brand/{profiles.json,make_brand.py}, studio/{STYLE_GUIDE.md,README.md,make_reel.py,package.json,engine/py/thumbnail.py},
.claude/skills/make-reel/SKILL.md (+ studio copy), src/pages/{Legal,Connections,Timeline,Ideas}.tsx, src/lib/{occasions,bestTime}.ts,
supabase/migrations/0001_init.sql, supabase/functions/{_shared/util.ts,studio/index.ts,oauth/index.ts}, README.md, publish/desk/rows/*.

## PLAYBOOK.md (generic rules learned the hard way)
1. Accuracy first: every claim cites the base text, read in the text; absence claims need the whole episode read; unsure → drop it.
2. Show the actual words: quote the popular version AND the base-text verse as quote cards (source + ref, original script, transliteration, translation; narrator reads it).
3. Open with the verse: shot 2 = source line → one expressive verse (3 takes with expressive tags, pick by pitch movement + intact words) → "this is the real story".
4. Length follows the information (60-120 s); never cut a quote, citation or story step; split into parts ("follows") when longer.
5. Ask the owner before any major character's look or voice (stills + audio options); minor ones: Claude picks and says so; keep elders dignified.
6. Calm narrator tags only; shouting guard; never chop a voice (natural tails, fades, no ASR cut on verse/quote lines).
7. Respect later traditions: "both are told with devotion".
8. English on screen (except original-script quotes); narration language per channel.
9. Endings per platform (FOLLOW vs SUBSCRIBE), checked by transcribing the last seconds.
10. Never post yourself; the owner posts from the app. Secrets are network secrets only.
11. Festival-aware posting plan; up to 3-4 reels per session.

## Example series (studio/series/example)
2-3 generic characters (a sage, a king, a narrator-only scene), one 30-40 s demo reel (hook → source + verse → 3 story shots → quote card → CTA)
using a public-domain text, so `make_reel.py check/stills/render` work on day one (TTS needs the channel's own ElevenLabs key).

## setup.sh <channel-id>
Asks: channel name, handles (IG/YT), narration language, base text + edition + source site, colours; writes `channel.json`,
`studio/series/<id>/series.json`, CLAUDE.md from the template; prints the checklist: create Supabase project (run migrations, deploy
functions), Netlify site, HF masters + audio repos, add network secrets (ElevenLabs, Netlify, Supabase, HF), audition the narrator.

## Done when
- Template repo builds the app (`npm run build`), passes `make_reel.py check` and renders the example reel's stills.
- `grep -ri "ramayana|untold|valmiki|hanuman|spsrryrycowxmgiofyxo|avinash"` finds nothing outside the optional Hindu-calendar preset.
- README: what it is, the setup steps, the per-reel workflow.
