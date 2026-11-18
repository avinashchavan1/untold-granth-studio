---
name: make-reel
description: Produce one "Untold" scripture reel (9:16, Hindi narration, English subtitles, verse-cited) end to end with the studio engine — research and verify the verses, write script.json, voices (ElevenLabs narrator + Chatterbox characters), shots.js choreography, sound cues, render, QA and citation sheet. Use when the user asks for the next reel, a reel on a topic/episode, or to start a new series from another book.
---

# make-reel

Read `studio/STYLE_GUIDE.md` first (truth rules, reel anatomy, voice, visual, sound, checklist). Work inside `studio/` of the untold-granth-studio repo. One reel = `series/<series>/reels/<ID>/`.

## Steps (report progress + time estimates to the user after each)

1. **Pick the topic** — next unchecked row of `series/<series>/PLAN_100.md` unless the user names one.
2. **Verify before writing (≈20–40 min).** Read the episode in the base text (CE Sanskrit + a translation; see
   `series.json → source.check_against`). Write every claim with kanda.sarga.verse + Sanskrit into
   `claims[]`. Absence claims ("not in Valmiki") need a whole-text search. If a claim can't be verified, drop it.
3. **Scaffold** — `python3 make_reel.py new <series> <ID> "<title>"`, then write `src/script.json`:
   hook → source card → 6–14 story shots → payoff → end card. Narrator units carry ElevenLabs tags; character
   units carry `ex`/`cfg`. Character dialogue = the verse, tightened. Run `make_reel.py check`.
4. **Art** — write `src/shots.js` (copy patterns from `reels/A01/src/shots.js`; use `sourceCard`, `endCard`,
   `titleShot`, `hermitage`, `drawFigure(CH.<who>, P({...}))`). New character → add a locked rig to
   `art/chars.js`; new place → a `build*()` in `art/bg.js`. Preview with `make_reel.py draft` + `stills`.
   Look at the stills; fix anatomy, overlaps, text in the bottom 22%.
5. **Voices**
   - Narrator: `make_reel.py narration <reel> list` → generate each with the ElevenLabs connector
     (`creative_generate_speech`, voice_id + model from cast.json, one flow per reel), download each result to
     the listed `audio/narrator/sXX_i_tK.mp3` path. (Or `narration api` when an API key/network secret exists.)
     Budget: ~1.3k characters per reel incl. retakes; check `account_get_usage` first.
   - Characters: `make_reel.py voices <reel> 1,2,3,4` (CPU, ~1–2 min per take; run in background with nohup).
   - New character: audition 3–6 openly-licensed references with the same line. If it's in `series.json → major_characters.ask_user_when_first_needed`, send the audition and let the user pick; otherwise pick it yourself (fit + ASR match), lock it in cast.json, and just mention the choice.
6. **Pick + time** — `make_reel.py narration <reel> import`, then `make_reel.py pick <reel>`. Read
   `audio/pick_log.txt`: every "heard" must match "said"; pin with `force_take` or regenerate.
7. **Sound** — write `src/sound.py` cues (see A01's) or rely on `default_bed()`; `make_reel.py audio <reel>`
   (expect music ≈ −18 dB under voice).
8. **Render** — `nohup python3 make_reel.py render <reel> &` (≈25–40 min for 60–90 s). Verify with ffprobe +
   loudness (−14 LUFS) + 6–8 stills.
9. **Deliver** — send `out/<ID>_final.mp4`, the citation sheet (claims + refs) and caption; ask for human
   review before posting. Never post/publish to any platform yourself without explicit approval.
10. **Persist + publish desk** — `python3 scripts/sync.py studio` (set the reel's stage in `studio/series/<series>/reels/stages.json` first), `python3 scripts/media.py <ID> preview|poster|citations|caption <file>`, attach masters with `python3 scripts/release.py <ID>` (GitHub Release), then commit and push. The reel then appears in the Untold Granth Studio app for review and posting.

## Rules that bit us before
- Don't speed up the narrator; cut words instead. Keep music low. No added dialogue (A01 "भाभी" incident).
- Valmiki numbering: say "Critical Edition"; wisdomlib/Shastri (vulgate) numbers differ.
- Never clone a real person's voice without consent; never ask for secrets in chat (use the credential form).
