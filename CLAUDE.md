# Untold Granth Studio: rules for every session

Short reels (9:16, ~60–75 s) that bust myths and reveal little-known facts from the **Valmiki Ramayana, Critical Edition (CE)**,
for Instagram **@untoldgranth.official** and YouTube **@untoldgranth**. Hindi narration, English everywhere else.
The owner reviews and posts from the app: https://untold-granth-studio.avinashchavan.com

## Start of every session (do this first, ~1 min)
1. `bash scripts/bootstrap.sh` (Python deps for the engine; ffmpeg/Playwright are preinstalled).
2. Read `studio/STYLE_GUIDE.md`, then `studio/series/untold-ramayana/series.json` (rules, cast lock, looks, CTA) and
   `studio/series/untold-ramayana/PLAN_100.md` (posting order). Research notes: `studio/series/untold-ramayana/research/`.
3. Where things stand: the app's Timeline page, or `studio/series/untold-ramayana/reels/stages.json`.
4. To change an OLD reel: restore its recorded audio first, `python3 scripts/audiopack.py pull <ID>` (never re-record).
5. Make a reel with the **make-reel** skill (`.claude/skills/make-reel/SKILL.md`): it has every step and command.

## Non-negotiable rules (the owner's, learned the hard way)
- **Accuracy first.** Every claim cites CE kanda.sarga.verse, read in the text itself (enjoylearningsanskrit.com
  book-N/chapter-M is the CE source we use). Absence claims ("not in Valmiki") need the whole episode read. When unsure, drop the claim.
  Name later sources with respect (Tulsidas's Ramcharitmanas, Hanuman Chalisa): "both are told with devotion", never mockery.
- **Show the audience the actual words.** Whenever a reel names a source, quote it: the popular version's exact line
  (e.g. Hanuman Chalisa chaupai 18 "जुग सहस्र जोजन पर भानू। लील्यो ताहि मधुर फल जानू॥") AND the key Valmiki verse it is compared with,
  each as a quote card: source + verse number, Devanagari (font Mukta), transliteration, English translation; the narrator reads it.
  Devanagari quotes are the one exception to "English on screen". Reference: A89 shot 11.
- **Open with the śloka (owner's format, APPROVED Nov 21 2026 on A07/A89; use it on every new and unposted reel).** Shot 2: the narrator FIRST names the source ("वाल्मीकि रामायण, <kanda>, सर्ग <n>।",
  source card), THEN recites one Sanskrit verse from that sarga very expressively (verse card: "Valmiki Ramayana · <Kanda> k.s.v",
  Devanagari in Mukta, English translation), then "ये है असली कहानी।". Pick the verse the payoff rests on (or the most striking one;
  one śloka, about 7–11 s). Copy the Devanagari from the CE page, never from memory. Only this line (`sloka_unit`) may use the
  expressive tags ([reverently] [slowly], [with deep devotion] [chanting], [solemnly] [expressively]); record one take with each,
  pick the take with the most pitch movement and intact words, pin it with `force_take`; the shouting guard still applies.
  Reference: A07 and A89 shot 2 (`slokaSource` in studio/engine/art/templates.js).
  The śloka is recited by the narrator Rudra (owner's pick after a 6-voice audition); no separate śloka voice.
  **A/B TEST (owner, Nov 27 2026): śloka position.** A35 + A34 use the "proof" format (no opening verse; right after the first reveal
  the narrator says "वाल्मीकि के शब्द:" and recites ONE half-verse ~5 s over the story art, verse band visible from frame 1;
  `derive_reel.py` spec `proof`); A36 + A103 keep the opening śloka. Post alternating A35, A36, A34, A103; compare at 48 h on the
  Dashboard ("Śloka format test": avg % viewed, watching at 0:05 / 0:20). Every other reel keeps the opening śloka until the owner decides.
- **Length follows the information:** 60–90 s is typical, up to ~120 s is fine when the evidence needs it. Never cut a quote,
  a citation or a step of the story just to be shorter.
- **Ask before choosing anything about a MAJOR character** (look OR voice). Major = `series.json → major_characters`
  (`locked` + `ask_user_when_first_needed`, e.g. Ravana, Mandodari, Vibhishana, Sugriva, Jambavan...). Show stills/audio
  options with AskUserQuestion BEFORE rendering. Locked looks: `series.json → character_looks` (baby Hanuman = style 'g':
  a little human boy, small monkey ears + tail). Minor characters: Claude chooses, then says which was picked.
- **Address rule:** characters don't call Rama by the bare name "राम" unless they are elders, gurus, sages or adversaries
  (`series.json → address.plain_name_ok`). Hanuman: "प्रभु / प्रभु श्रीराम" and "माता सीता"; Lakshmana: "भैया / आर्य / भ्राता श्रीराम";
  Sita: "आर्यपुत्र / स्वामी"; others in `address.forms`. `make_reel.py check` flags violations. The narrator may say "राम".
- **Keep viewers to the end (owner, Nov 22 2026): every script and every recording must hold attention.** Open with the question in the
  first seconds and promise its answer; end every shot/beat on an open question the next one answers; reveal surprises in steps,
  never all at once; vary rhythm (short lines, a [pause] before each reveal, a character's own voice or a quote card every 20-30 s in
  reels, every 60-90 s in long-form); music rises toward the climax and drops under verses. Calm tags still apply: engaging comes from
  the writing and pacing, not from shouting. Check retention in YouTube/Instagram analytics after 48 h and note where viewers drop.
- **Music is symphonic and pleasing to the ear (owner, Nov 22 2026):** orchestra (legato strings, horns, harp, woodwinds, soft choir) with
  Indian colour (bansuri, sitar/santoor, tanpura, soft tabla), a recurring melody, smooth swells; never harsh hits, booming or distorted drums,
  or shrill highs. `series.json → score_style` is appended to every score prompt (`engine/py/gen_score.py`). Pick the take that sounds best, not only the loudest arc.
- **Calm narrator:** only the tags [softly] [warmly] [curious] [serious] [thoughtfully] [pause]. Never [dramatically] or [excited]
  (they made him shout). The picker drops takes that rise more than 40 Hz above 125 Hz.
  **A/B TEST (owner, Nov 21 2026): the NEXT 2 reels (A17, A82) use `"narration_energy": "hook_reveal"`:** energetic tags
  ([excited] [dramatically] [intense]) only on shot 1 and shots marked `"reveal": true`, rest calm, shouting guard on. Details and how to
  compare: `series.json → experiments.narration_energy`. Every other reel stays calm until the owner decides.
- **Every voice is ElevenLabs** (narrator and all characters; `cast/cast.json`). `make_reel.py check` fails otherwise.
  Posted reels keep the audio they went out with.
- **English** for every written word (cards, subtitles, titles, covers, captions); Hindi narration only.
- **Endings:** Instagram/Facebook say FOLLOW ("फ़ॉलो करें"); YouTube says SUBSCRIBE ("सब्सक्राइब करें"). Both masters
  are checked by transcribing their last 4 s.
- **Shot 1 carries the hook card** (the question). Every reel gets a cover (`make_reel.py thumb`); faces must be clear of text.
- **Never post or publish** to Instagram/YouTube yourself. The owner posts from the app.
- **Secrets:** never ask for keys in chat. They are network secrets on the cloud environment (ElevenLabs, Netlify,
  Supabase, Hugging Face); code uses the placeholder `proxy-injected`. No personal info in external requests.
- **No model IDs** in commits or code. Commit messages end with the session's attribution lines.
- **Keep everything updated in git (owner, Nov 22 2026):** commit AND push after every meaningful step (research notes, script, art,
  timeline, cover, stages, desk rows, cast, engine/app/script changes), not only at the end; never leave untracked or unpushed work.
  Shared changes also go to the storyreel-studio template right away (template_sync + push). Audio lives in the HF audio packs, not git.
  **Merging (owner, Nov 22 2026): Claude merges its own work to `main` in both repos** (open a PR from the session branch, check it is
  clean/green, merge it, then restart the branch from `main`). The owner doesn't need to merge; just report what was merged.
- **Keep the owner updated**: short progress notes in chat, and the live bar in the app:
  `python3 scripts/status.py set --reel <ID> --step N` (1 research, 2 script, 3 voices, 4 music, 5 art, 6 preview,
  7 masters, 8 cover/upload; it also moves the reel's stage in the app: 1 researching, 2 scripted, 3-5 voiced, 6-8 rendered,
  never backwards; review is set at upload); `python3 scripts/status.py watch-render <ID> &` during renders; `status.py idle` when done;
  `--state waiting --task "Pick baby Hanuman's look"` when you need the owner.

## Layout (this repo runs the storyreel-studio template's shared code; the channel lives in channel.json + studio/series/untold-ramayana)
- `channel.json`: identity, handles, hashtags, base text + verse page (enjoylearningsanskrit.com CE), Supabase/Netlify/HF ids.
  `calendar.json`: festivals, theme words, weekly days (Hanuman on Tue/Sat) for the posting plan. `PLAYBOOK.md`: the generic rules.
- `studio/` = the reel engine (the ONLY working copy; render here). `studio/make_reel.py` is the CLI.
  - `engine/js` renderer (Playwright), `engine/py` audio (ElevenLabs TTS + music, take picker, mixing, covers).
  - `engine/art/{rigs,sets,templates}.js`: the SHARED art library (figures, sets, source/verse/quote/end cards). Load order per reel:
    reel/src > series/art > engine/art > engine/js.
  - `series/untold-ramayana/art/chars.js`: this series' cast (`Object.assign(CH, …)`) + Ravana, baby Hanuman, Rahu, Airavata;
    `art/bg.js`: old names of library sets (buildPampa, buildMithila, buildHimalaya, buildGanga, shivaBow…).
  - `series/untold-ramayana/series.json`: cast lock, looks, address rule (`protected_names: ["राम"]`), CTA, cast_meta, locations,
    manuscript verse, experiments. `reels/<ID>/src/{script.json,shots.js,timeline.json}` in git; `audio/` in the HF audio pack.
  - `series/untold-ramayana/cast/{cast.json,looks.json,portraits/}`: voices, portraits, who chose what.
- `src/` = the studio app (React + Vite + Tailwind; Supabase). Deploy: `bash scripts/deploy.sh` (Netlify).
- `supabase/` = migrations and edge functions (studio, job, oauth). Project ref `spsrryrycowxmgiofyxo`. Function secrets APP_URL,
  APP_URL_ALT, GITHUB_REPO, HF_MASTERS_REPO, IG_HANDLE are set. Deploy a function via the Management API; `studio` verify_jwt true, `job` false.
- `scripts/`: `sync.py`, `media.py` (an approved reel whose preview/cover changes goes back to review), `masters.py`, `audiopack.py`,
  `cast_media.py`, `status.py` (work panel: `watch-queue A23 A101 …`), `publish_job.py` (GitHub Actions publisher, runs from `main`),
  `source_verse.py <book> <chapter> <verses>` (CE verses from the page in channel.json), `template_sync.py`, `channel.py`.
- Renders are chunked and resumable (15 s chunks, `.done` markers): after a machine restart just run the same command again.

## Ramayana research notes (were in the skill; the make-reel skill is now generic)
- CE books: 1 Bala, 2 Ayodhya, 3 Aranya, 4 Kishkindha, 5 Sundara, 6 Yuddha, 7 Uttara. CE sarga numbers are lower than the vulgate's.
- Verses: `python3 scripts/source_verse.py 6 97 17` (enjoylearningsanskrit.com book-N/chapter-M). Popular texts: Ramcharitmanas at
  ramcharit.in (verbatim text; its page summaries can be wrong), Hanuman Chalisa. Model reels: A53 (battle), A89 (sky/dawn), A07 (palace),
  A23 (night battlefield, Himalaya), A18 (court, quote cards), A101 (two-part reel with `follows`).

## Keep the template in sync (owner's rule)
- After ANY change to the engine, art library, app, backend, scripts, skills or PLAYBOOK, run
  `python3 scripts/template_sync.py /home/user/storyreel-studio --commit` (attach/clone `avinashchavan1/storyreel-studio` first) and push it.
  It copies only shared paths and refuses to commit if a channel detail (name, handles, ids) would leak. Channel details belong in
  channel.json, calendar.json, studio/series/ and this CLAUDE.md.

## Full-length videos (owner, Nov 22 2026)
- NEW 16:9 full-length videos (~10–12 min), never stitched from old reels; 4–6 reels are DERIVED from each. Plan, method and the
  pilot (Vali's death, Kishkindha): `studio/series/untold-ramayana/LONGFORM.md`. Start it in a fresh session: "long-form pilot: Vali".

## Posting
- Timeline page plans the posting days and times (`src/lib/bestTime.ts` + `src/lib/occasions.ts`, data in `calendar.json`):
  - Days: every ordering of the ready reels is scored (≤8 reels: exact); score = festival fit (`calendar.json` occasions:
    Tulsi Vivah, Kartik Purnima, Vivah Panchami, Makar Sankranti, Maha Shivratri, Ram Navami, Hanuman Jayanti...) +
    Hanuman reels on Tue/Sat (`calendar.json → weekly`) + ★★★ reels on weekends + small plan-order cost; `"follows"` pairs stay back to back.
  - Times: an Indian evening-audience prior × the channel's own results (age-normalised).
  - Double posts (owner-approved rule): one reel a day by default; an OPTIONAL 2nd morning post (9–11 AM) only on a major
    festival (weight ≥ 5), when a second ready reel truly matches it and 5+ reels are ready (`doubleCandidate` in occasions.ts).
  - "Festival plan" section: upcoming occasions, the reels that fit, and "make X before <date>". Keep `calendar.json → occasions` updated
    a year ahead (check dates on two panchang sites; mark ±1-day ones `approx`). Plan production so festival reels are ready.
- A reel is marked published automatically when both Instagram and YouTube are posted (DB trigger).

## Sessions and tokens
- Up to 3 reels per session (4 when they share sets/characters, e.g. a two-part reel); owner approved Nov 21 2026. Start a new
  session when this one gets long; everything needed is in git, the HF audio packs and the app DB, so nothing is lost.
  The first message can simply be: "next reel".
