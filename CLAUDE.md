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
- **Length follows the information:** 60–90 s is typical, up to ~120 s is fine when the evidence needs it. Never cut a quote,
  a citation or a step of the story just to be shorter.
- **Ask before choosing anything about a MAJOR character** (look OR voice). Major = `series.json → major_characters`
  (`locked` + `ask_user_when_first_needed`, e.g. Ravana, Mandodari, Vibhishana, Sugriva, Jambavan...). Show stills/audio
  options with AskUserQuestion BEFORE rendering. Locked looks: `series.json → character_looks` (baby Hanuman = style 'g':
  a little human boy, small monkey ears + tail). Minor characters: Claude chooses, then says which was picked.
- **Address rule:** characters don't call Rama by the bare name "राम" unless they are elders, gurus, sages or adversaries
  (`series.json → address.plain_name_ok`). Hanuman: "प्रभु / प्रभु श्रीराम" and "माता सीता"; Lakshmana: "भैया / आर्य / भ्राता श्रीराम";
  Sita: "आर्यपुत्र / स्वामी"; others in `address.forms`. `make_reel.py check` flags violations. The narrator may say "राम".
- **Calm narrator:** only the tags [softly] [warmly] [curious] [serious] [thoughtfully] [pause]. Never [dramatically] or [excited]
  (they made him shout). The picker drops takes that rise more than 40 Hz above 125 Hz.
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
- **Keep the owner updated**: short progress notes in chat, and the live bar in the app:
  `python3 scripts/status.py set --reel <ID> --step N` (1 research, 2 script, 3 voices, 4 music, 5 art, 6 preview,
  7 masters, 8 cover/upload); `python3 scripts/status.py watch-render <ID> &` during renders; `status.py idle` when done;
  `--state waiting --task "Pick baby Hanuman's look"` when you need the owner.

## Layout
- `studio/` = the reel engine (the ONLY working copy; render here). `studio/make_reel.py` is the CLI.
  - `engine/js` canvas renderer (Playwright), `engine/py` audio (ElevenLabs TTS + music, mixing, covers).
  - `series/untold-ramayana/art/{chars.js,bg.js,templates.js}`: rigs and sets shared by all reels.
  - `series/untold-ramayana/reels/<ID>/src/{script.json,shots.js,timeline.json}` in git; `audio/` in the HF audio pack;
    `out/` and `frames/` are generated (git-ignored).
  - `series/untold-ramayana/cast/{cast.json,looks.json,portraits/}`: voices, portraits, who chose what.
- `src/` = the studio app (React + Vite + Tailwind; Supabase). Deploy: `bash scripts/deploy.sh` (Netlify).
- `supabase/` = migrations and edge functions (studio, job, oauth). Project ref `spsrryrycowxmgiofyxo`.
  Deploy a function via the Management API (see README); `studio` verify_jwt true, `job` false.
- `scripts/`: `sync.py` (studio → app DB; never moves a stage backwards), `media.py` (preview/cover/citations/caption to storage),
  `masters.py` (masters to HF `Avinash1443/untold-granth-masters`), `audiopack.py` (reel audio backup/restore),
  `cast_media.py` (portraits + voice samples for Cast & world), `status.py` (live progress bar), `publish_job.py` (GitHub Actions publisher).

## Posting
- Timeline page suggests the day and the best time per platform (`src/lib/bestTime.ts`): an Indian evening-audience
  prior × the channel's own results; Hanuman reels on Tue/Sat; `script.json → "follows"` keeps paired reels back to back.
- A reel is marked published automatically when both Instagram and YouTube are posted (DB trigger).

## Sessions and tokens
- One reel per session. Start a new session after a reel is delivered (or when this one gets long); everything needed
  is in git, the HF audio packs and the app DB, so nothing is lost. The first message can simply be: "next reel".
