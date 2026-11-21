---
name: make-reel
description: Produce one cited story reel (9:16, narration in the channel's language, English subtitles, verse-cited) end to end with the studio engine: verify the verses, script.json, ElevenLabs narration + music, shots.js art, render, QA, cover, upload to the studio app. Use when the user asks for the next reel, a reel on a topic, or a change to an existing reel.
---

# make-reel

Rules live in `CLAUDE.md` and `PLAYBOOK.md`; read them first. Work in `studio/` (cd into it for `make_reel.py`; run `scripts/*` from the repo root).
S = `series/<series id>` (channel.json → series.id); R = `S/reels/<ID>`. Keep the owner posted: one-line chat updates +
`python3 scripts/status.py set --reel <ID> --step N` (1 research … 8 cover/upload); it also moves the reel's stage in the app, never backwards).

## 1. Research (step 1)
- Topic = next `idea` row of the series plan (★★★ first) unless the owner names one; check `S/research/` notes.
- Read the base text itself: `python3 scripts/source_verse.py <book> <chapter> <verses>` (URL pattern in channel.json → source.verse_url).
  Read the whole episode, not just the verse you expect. Grep the translations for the key words. Save original text + translation of every verse you cite.
- The popular version: find its real source text and copy its exact words (never from memory).
- Every claim → `claims[]` with ref + `verified: true` only if you read it. If an edition's wording is ambiguous, drop that detail.
  Save notes to `S/research/<ID>_*.md` and commit.

## 2. Script (step 2)
- `python3 make_reel.py new <series id> <ID> "<Title>"`, then write `R/src/script.json` (model: `series/example/reels/X01`):
  shot 1 hook question + `card`; shot 2 source + verse; story shots (each with `cite`); 1–2 payoff cards; last shot `"cta": true`.
- QUOTE CARDS (`"quote"` on the shot): for every source the reel names — the popular version AND the key base-text verse — the narrator reads
  the exact line; the screen shows source + ref, original script (font Mukta), transliteration, English.
- SHOT 2 = SOURCE THEN VERSE: units = ["<source>, <book>, <chapter>।", "<expressive tags> <verse copied from the source page, … at the caesura>",
  "[serious] <'this is the real story' in the narration language>"], `"sloka_unit": 1`, `"sloka": {lines, ref, en, translit}`; shots.js `slokaSource(...)`.
  Record the verse 3 ways (tags [reverently] [slowly] / [with deep devotion] [chanting] / [solemnly] [expressively]) as s02_1_t1..t3, measure pitch
  movement (librosa pyin, std in semitones) + ASR, pin the best take that stays under the shouting guard: `"force_take": {"1": k}`.
- Narrator `units` with calm tags only; `unit_gap` between units; short shots get `"min"`. A one-word unit after a pause can get dropped: give it its own unit.
- Also: `source`, `source_card`, `avoid`, `verify_note`, `caption`, `youtube_title`, `comment_prompt`, `hashtags`,
  `thumbnail{hook,stamp,line,badge,frame,art_shift}`, `score{engine,file,duration_s,gain,duck,prompt}`, optional `"follows": "<ID>"`.
- `python3 make_reel.py check R` must pass. Length: estimate × ~1.5 is closer to the real narrator pace; if the real total goes far past 120 s,
  propose splitting into two parts (`follows`), don't cut quotes or steps.

## 3. Voices + 4. Music (steps 3–4, background)
- Budget: `curl -sS -H "xi-api-key: proxy-injected" https://api.elevenlabs.io/v1/user/subscription`.
- `ELEVENLABS_API_KEY=proxy-injected nohup sh -c "python3 make_reel.py narration R api 2 && python3 make_reel.py narration R import" > R/out/narr.log 2>&1 &`
  (record the verse's 3 takes first so `api` skips them).
- New MAJOR character → audition 3 library voices on one of its lines (`/v1/shared-voices` search), send them, the owner picks. Minor: you pick.
- Music: `nohup python3 engine/py/gen_score.py R 2 &` → `R/audio/score_takes/take{1,2}.mp3`; pick by the energy curve vs. the story beats
  (quiet under the verse, peak at the climax), copy to `R/audio/score.mp3`, note it in `score.take`. Music may sit high: `score.gain` ~1.9, `score.duck` ~0.72.

## 5. Art (step 5)
- `R/src/shots.js` from the shared library (`engine/art`): sets `buildHermitage`, `buildForest`, `buildCourt`, `buildPalace`, `buildBattlefield`,
  `buildDawn`, `buildSkyHigh`, `buildSnowRange` (+ `herbPeak`), `buildShore` (+ `bridge`), `buildWideRiver`, `buildManuscript`…;
  `drawFigure(c, CH.<key>, P({...}), {x,y,s,face}, light)`, `lying`, `chariot`, `torch`, `greatBow`; cards `slokaSource`, `quoteCard`, `endCard`, `textFit`, `sentenceStarts`.
  Series characters go in `S/art/chars.js` (`Object.assign(CH, {...})`).
- New or changed major-character look → render 2–3 options as stills (`reels/_cast` sheet), ask with AskUserQuestion, THEN render; record it in
  `series.json → character_looks`. Keep elders and revered figures dignified.
- `python3 make_reel.py draft-timeline R` lets you check art before any audio exists.
- `python3 make_reel.py pick R` (read `audio/pick_log.txt`: heard ≈ said; no "⚠ shouting"), then `python3 make_reel.py audio R`.
- Check every line's start and end in `audio/mix.wav`: transcribe each shot (faster-whisper 'medium' for verse lines) and look for a word that stops
  dead. If one does, fix it in the engine (`no_cut`, trim/fade), never by shortening the line.
- Stills: `python3 make_reel.py stills R 2s,10s,...` → contact sheet. Nothing hidden behind subtitles (keep figures above y≈1450), text clear of faces.

## 6–7. Render (steps 6–7)
- `python3 make_reel.py render R > R/out/render_main.log 2>&1 &` + `python3 scripts/status.py watch-render <ID> &`. Send `out/<ID>_final.mp4` as soon as it exists.
- QA: duration, −14 LUFS (`ffmpeg -af ebur128`), 1080×1920 / 2160×3840, transcribe the last 4.3 s of each master (FOLLOW vs SUBSCRIBE).

## 8. Cover + upload (step 8)
- `python3 make_reel.py thumb R 2s,20s,...` → pick a frame, set `thumbnail.frame` (+ `art_shift`), `python3 make_reel.py thumb R`, LOOK at the cover.
- `python3 make_reel.py sheet R`, `python3 make_reel.py desk R`; set `S/reels/stages.json → <ID>: "review"`.
- From the repo root: `python3 scripts/sync.py`, `python3 scripts/media.py <ID> preview|thumbnail|citations|caption <file>`, `python3 scripts/masters.py <ID>`,
  `python3 scripts/audiopack.py push <ID>`, `python3 scripts/cast_media.py` if a character appeared or changed, `python3 scripts/status.py idle`.
- Commit + push. Send the owner the preview + cover with a short summary (claims checked, what to review).

## Changing an existing reel
`python3 scripts/audiopack.py pull <ID>` → edit `src/` → `pick` + `audio` only if the script changed → render → cover → upload as above.
