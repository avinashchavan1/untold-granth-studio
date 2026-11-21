---
name: make-reel
description: Produce one "Untold" scripture reel (9:16, Hindi narration, English subtitles, verse-cited) end to end with the studio engine: verify the verses, script.json, ElevenLabs narration + music, shots.js art, render, QA, cover, upload to the studio app. Use when the user asks for the next reel, a reel on a topic, or a change to an existing reel.
---

# make-reel

Rules live in `CLAUDE.md` (repo root); read it first. Work in `studio/` (cd into it for `make_reel.py`; run `scripts/*` from the repo root).
R = `series/untold-ramayana/reels/<ID>`. Keep the owner posted: one-line chat updates + `python3 scripts/status.py set --reel <ID> --step N`.

## 1. Research (step 1, ~15 min)
- Topic = next `idea` row of `series/untold-ramayana/PLAN_100.md` (★★★ first) unless the owner names one; check `research/` notes.
- Fetch CE chapters: `curl -sS -o <scratch>/y97.html https://enjoylearningsanskrit.com/scriptures/ramayana/book-6/chapter-97/`, then
  parse verses with `re.findall(r"(\d+)\. ([A-Z“\"(][^।॥]{10,600}?) words Devanagari", text)` and grep for the key words.
  Book numbers: 1 Bala, 2 Ayodhya, 3 Aranya, 4 Kishkindha, 5 Sundara, 6 Yuddha, 7 Uttara. CE sarga numbers are lower than the vulgate's.
- The popular version: find its real source (Ramcharitmanas text at ramcharit.in, Hanuman Chalisa, etc.) and quote it.
- Every claim → `claims[]` with ref + `verified: true` only if you read it. Save notes to `research/<ID>_*.md` and commit.

## 2. Script (step 2)
- `python3 make_reel.py new untold-ramayana <ID> "<Title>"`, then write `R/src/script.json` (copy A53/A89 as the model):
  shot 1 hook question + `card`; shot 2 source card; 6–9 story shots (each with `cite`); 1–2 payoff cards; last shot `"cta": true`.
  QUOTE CARDS: for every source the reel names (the popular version's text, and the key Valmiki verse), a shot where the narrator
  reads the exact line and the screen shows source + verse no., Devanagari (`font: 'Mukta'`), transliteration, English (copy A89 shot 11).
  Length 60–120 s: let the evidence breathe; never drop a quote to save time.
  SHOT 2 = SOURCE THEN ŚLOKA: units = ["वाल्मीकि रामायण, <kanda>, सर्ग <n>।", "<expressive tags> <Sanskrit verse, Devanagari from the CE page, with … at the caesura>",
  "[serious] ये है असली कहानी।"], `"sloka_unit": 1`, `en: ""`; shots.js: `const SLOKA = {lines, ref, en}` + `slokaSource(ctx,u,p,sh,t,post,SLOKA)`.
  Record the verse 3 ways (tags [reverently] [slowly] / [with deep devotion] [chanting] / [solemnly] [expressively]) as s02_1_t1..t3,
  measure pitch movement (librosa pyin, std in semitones) + ASR match, pin the best with `"force_take": {"1": k}` (see A07/A89 script.json).
  The CE page holds each verse's Devanagari next to its translation: save both when you research (pick the verse in step 1).
  Narrator `units` with calm tags only; `unit_gap` between units; short shots get `"min"`.
  Also: `source`, `source_card`, `avoid`, `verify_note`, `caption`, `youtube_title`, `comment_prompt`, `hashtags`,
  `thumbnail{hook,stamp,line,badge,frame:"",art_shift:0}`, `score{engine,file,duration_s,gain}`, optional `"follows": "<ID>"`.
- `python3 make_reel.py check R` must pass (lengths, citations, cast, address rule, calm tags, hook card, CTA).
- A one-word unit after a `[pause]` can get dropped by TTS: give it its own unit (A53 "हृदय").

## 3. Voices + 4. Music (steps 3–4, run both in the background)
- Budget: `curl -sS -H "xi-api-key: proxy-injected" https://api.elevenlabs.io/v1/user/subscription` (40k chars/month; a reel ≈ 1.6–1.9k at 2 takes).
- `ELEVENLABS_API_KEY=proxy-injected nohup sh -c "python3 make_reel.py narration R api 2 && python3 make_reel.py narration R import" > R/out/narr.log 2>&1 &`
- Character voices: ElevenLabs only, voice ids in `cast/cast.json`. A NEW major character → audition 3 voices, send them, the owner picks.
- Music: write `script.json → score.prompt` (instrumental, sits under a voice, one hit at the climax; see A89/A53 for wording),
  `nohup python3 engine/py/gen_score.py R 2 &` → `R/audio/score_takes/take1.mp3, take2.mp3`; copy the better one to `R/audio/score.mp3`,
  note it in `score.take`.

## 5. Art (step 5)
- `R/src/shots.js`: reuse sets/rigs (`buildBattlefield`, `buildDawn`, `buildSkyHigh`, `buildPalace`, `buildShore`, `buildGanga`,
  `buildGautama`, `buildManuscript`; `drawFigure(c, CH.<key>, P({...}), {x,y,s,face}, light)`, `drawRavana`, `drawBalHanuman(...,{style:'g'})`,
  `drawRahu`, `drawAiravata`; `sourceCard`, `endCard`, `textFit`, `sentenceStarts`). Models: A53 (battle), A89 (sky/dawn), A07 (palace).
- New major-character look or a changed one → render 2–3 options as stills, send them, ask with AskUserQuestion, THEN render.
  Record the pick in `series.json → character_looks`.
- `python3 make_reel.py pick R` (read `audio/pick_log.txt`: every "heard" ≈ "said"; no "⚠ shouting"), then `python3 make_reel.py audio R`.
- Stills: `python3 make_reel.py stills R 2s,10s,...` → look at a contact sheet. Check: nothing hidden behind text or trees,
  text clear of faces, the story readable with the sound off.
- Transcribe every shot of `audio/mix.wav` with faster-whisper ('small', language 'hi') and compare with the script.

## 6–7. Render (steps 6–7, ~40 min)
- `python3 make_reel.py render R > R/out/render_main.log 2>&1` in the background + `python3 scripts/status.py watch-render <ID> &`.
- Output: `out/<ID>_final.mp4` (preview), `<ID>_INSTAGRAM_MASTER.mp4` (1080p), `<ID>_YOUTUBE_MASTER.mp4` (4K).
- QA: duration, −14 LUFS (`ffmpeg -af ebur128`), sizes 1080×1920 / 2160×3840, transcribe the last 4.3 s of each master
  (FOLLOW vs SUBSCRIBE).

## 8. Cover + upload (step 8)
- `rm -f R/frames/clean_*.png` (cached frames go stale after art changes), `python3 make_reel.py thumb R 2s,20s,...` → pick a frame,
  set `thumbnail.frame` (+ `art_shift`: positive pushes art down, negative pulls up), `python3 make_reel.py thumb R`, LOOK at `out/<ID>_cover.jpg`.
- `python3 make_reel.py sheet R`, `python3 make_reel.py desk R`; set `reels/stages.json → <ID>: "review"`.
- From the repo root: `python3 scripts/sync.py studio`, `python3 scripts/media.py <ID> preview|thumbnail|citations|caption <file>`,
  `python3 scripts/masters.py <ID>` (add `--short` only for a short cut), `python3 scripts/audiopack.py push <ID>`,
  `python3 scripts/cast_media.py` if a character appeared or changed, `rm -rf R/out/lossless`, `python3 scripts/status.py idle`.
- Commit + push. Send the owner `out/<ID>_final.mp4` + cover with a short summary (claims checked, what to review).

## Changing an existing reel
`python3 scripts/audiopack.py pull <ID>` → edit `src/` → `pick` + `audio` only if the script changed (otherwise keep the mix) →
render → cover → upload as above. A stage that must go back (e.g. review → voiced while re-rendering) is set in the DB directly;
`sync.py` never moves stages backwards.
