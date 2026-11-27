# The playbook: rules learned the hard way

These come from producing a real channel (100+ planned reels, owner-reviewed). They are the product as much as the code is.
Each rule has a mechanism in the engine; keep both.

## Truth
1. **Accuracy first.** Every claim in a reel cites the base text (`book.chapter.verse` or the channel's format) and was READ in the text
   (`scripts/source_verse.py`, never memory). `claims[]` with `verified: true` only after reading; `make_reel.py check` refuses unverified claims.
2. **Absence claims** ("X is not in the text") need the whole episode read, ideally a whole-text search. When unsure, drop the claim.
3. **Ambiguous text → say less.** If an edition's wording is unclear (e.g. "kings" vs "men"), leave the detail out.
4. **Respect later traditions.** Name later retellings with respect ("both are told with devotion"); never "fake", never mockery.
5. **Later layers and sensitive episodes** get context, the text's own words, and no editorial dunking.

## Show the words
6. **Quote cards.** Whenever a reel names a source, show its exact line: the popular version AND the base-text verse it is compared with
   (source + ref, original script, transliteration, translation); the narrator reads it (`quoteCard`).
7. **Open with the verse.** Shot 2: the narrator names the source (source card) → recites ONE verse expressively (verse card) →
   "this is the real story". Record 3 takes with different expressive tags; pick the most pitch movement with every word intact; pin it (`force_take`).

## Story
8. **Hook card on shot 1** (the question, on screen in the first second). Every reel ships a cover (`make_reel.py thumb`), faces clear of text.
9. **Length follows the information** (60–120 s). Never cut a quote, citation or story step to be shorter; split into parts (`"follows"`) instead.
10. **Major characters:** the owner picks look AND voice (stills + audio options first). Minor ones: Claude picks and says which. Elders and the revered stay dignified, never cute.
11. **Address rule:** revered names aren't used bare by devotees/family (`series.json → address.protected_names`); `check` flags it.

9b. **Keep viewers to the end.** Hook question in the first seconds with a promise of the answer; every shot/beat ends on an open
    question the next one answers; reveal in steps; change rhythm often (a character's line or a quote card every 20-30 s in reels,
    every 60-90 s in full-length videos; a [pause] before reveals); music builds to the climax. Engagement comes from writing and
    pacing, never from shouting tags. Read the platforms' retention graphs at 48 h and fix the pattern where viewers leave.

## Sound
12. **One narrator, calm.** Only calm tags ([softly] [warmly] [curious] [serious] [thoughtfully] [pause]); dramatic tags make TTS shout.
    The picker drops takes that rise far above the voice's normal pitch (shouting guard). Avoid [curious] if your narrator tends to rise on it.
    Optional test: `"narration_energy": "hook_reveal"` in script.json allows livelier tags ([excited] [dramatically] [intense]) on the hook
    and shots marked `"reveal": true` only (guard still on). Compare views at 48 h against calm reels of similar fame before adopting it.
    In practice [dramatically]/[excited] made the narrator shout in every take (whole line ~200–240 Hz); `[serious] [intense]` gives lift at a
    normal pitch. Questions also tend to rise into the shout range: re-record with a calmer tag or phrase the line as a statement.
13. **Never chop a voice.** Lines end with their natural tail and a fade; verse and quote lines are never ASR-cut (ASR can't spell scripture);
    the verse keeps its own pauses. If a word is cut, fix the engine, not just the reel.
14a. **Music is pleasing to the ear.** Symphonic and melodic (orchestra plus the culture's own instruments), a recurring theme,
    smooth swells; no harsh hits, distorted drums or shrill highs. Put the house sound in `series.json → score_style`; `gen_score.py`
    appends it to every prompt.
14. **Music may sit high** when it serves the reel (`score.gain`, `score.duck`); one take per reel chosen by its energy curve vs. the story beats.
15. **Endings per platform:** FOLLOW on Instagram/Facebook, SUBSCRIBE on YouTube; both masters checked by transcribing their last seconds.

## Work
16. **The owner posts.** Claude never publishes. Keys are network secrets only, never in chat or code (`proxy-injected`).
17. **Keep the owner updated:** short chat notes + the live progress bar (`scripts/status.py`).
18. **Festival-aware posting:** `calendar.json` (occasions, theme words, weekly days); plan production so festival reels are ready in time.
19. **Up to 3–4 reels per session**, then a fresh session; everything lives in git, the audio packs and the app DB.
20. **Shot files never redeclare library names.** A reel's `shots.js` loads after `engine/art`; a `const` that already exists there
    (e.g. a light like `L_FOREST`) stops the whole render. Prefix reel-local names or check `engine/art/*.js` first.
21. **Previews stay under 50 MB.** `scripts/media.py` re-encodes a longer reel's preview automatically; masters go to the masters repo.

## Full-length videos
22. **Full-length videos are NEW productions, never stitched from existing reels.** Reels are then DERIVED from the full-length video
    (same research, same recorded beats, same art), so one production feeds both YouTube long-form and 4–6 reels.
23. **Pick an arc, not a moment:** a whole episode where the base text differs from popular versions (~10–12 min). Read every chapter of the
    arc; the same Truth and Show-the-words rules apply (quote cards for both sides, one verse to open the video and each derived reel).
24. **Write in self-contained beats.** Each beat = one scene + its verse, with its own narration takes. Full video = intro + beats + short
    spoken links + one SUBSCRIBE outro. Derived reel = hook card + opening verse + 3–5 beats + platform end card; only hooks/links are new
    recordings, beats are never re-recorded.
25. **Draw once for two frames.** Full video 16:9 (1920×1080); every scene keeps its action inside a centred 9:16 safe zone so derived reels
    render the same scene at 1080×1920. Source/verse/quote/end cards get a wide and a vertical layout.
26. **Music per act** (3–4 score pieces per video, crossfaded), chosen by energy curve like reels.
27. **Delivery:** YouTube long-form master with chapters (verse refs in the description) and a wide thumbnail; derived reels go through
    the normal reel pipeline (stages, covers, masters, owner review).
28. **Budget:** ~10–12 min of narration is ~15–20k TTS characters for two takes; plan the month around it (about one full-length video
    per month on a 40k-character plan, plus a few reels). The channel's plan and current pilot live in its series folder (`LONGFORM.md`).

## Live status (baked into the pipeline)
29. **The app's work panel updates itself.** `make_reel.py` reports every step (narration, pick, audio, stills, render, thumb) to
    `scripts/status.py`, and a render starts the frame watcher (phases, %, time left). For several reels, open a batch first:
    `python3 scripts/status.py batch R006 R007 --task "Next 2 reels"`; `scripts/upload_reel.sh` marks each reel done after upload.
    Research and script steps are set by hand (`status.py set --reel X --step 1|2`). Set `NO_STATUS=1` to silence it.
30. **Upload each reel as soon as it renders.** In a batch, run `render` then `scripts/upload_reel.sh <ID>` per reel inside the loop, never render all first and upload at the end: finished reels must reach the app right away (owner's rule).
31. **Posting runs from the app, on a timer.** Each reel page has **Post everywhere** (Instagram, YouTube, Facebook Page; now or at a time), the
    Timeline has **Auto-fill** (schedules every checked reel at the best times), and the server timer (`scripts/schedule_setup.py`, pg_cron every 5 min)
    starts due posts with the app closed. A daily timer refreshes **Stats** (views, followers, weekly report) and the **health banner**.
    One tick ("I checked the citations") reviews the whole reel and marks every claim; per-claim ticks are optional. The owner's **request queue** (`python3 scripts/request_queue.py`) comes
    before the plan order; every new script carries 3 scored `hook_options` (`python3 scripts/hook_options.py <ID>`) and the owner's pick wins.
32. **One or two reels at a time (owner's rule).** Render (and record) at most 1–2 reels at once, in small batches, each uploaded as soon as it finishes
    (rule 30), so the machine never overloads and the owner sees reels completing one by one in Live studio. Never start a long chain of many renders in parallel.
33. **Best time + Autopilot.** Every morning the server studies similar channels' real posts (YouTube Data API, Instagram Business Discovery;
    no scraping; Instagram hashtag data needs Meta's Public Content Access review), our Instagram audience's online hours (100+ followers) and our
    own results, and builds a weekday × hour score per platform (Best time page). Autopilot, off until the owner turns it on, schedules only
    CHECKED reels into the best slot of each posting day. Similar channels: found once from `autopilot.peer_search`, editable on the page.
34. **Every link is in git.** `studio/series/<id>/MEDIA.md` (+ `media.json`) lists each reel's Hugging Face masters, audio pack, Storage paths
    (preview, cover, citations, caption) and live post links. `upload_reel.sh` rewrites it; after posts, `bootstrap.sh` runs `python3 scripts/media_index.py --commit`
    at the start of a session so the live links are committed too. Never hand-edit it.
