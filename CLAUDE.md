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
  Reference: A07 and A89 shot 2 (`slokaSource` in art/templates.js).
  The śloka is recited by the narrator Rudra (owner's pick after a 6-voice audition); no separate śloka voice.
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
- Timeline page plans the posting days and times (`src/lib/bestTime.ts` + `src/lib/occasions.ts`):
  - Days: every ordering of the ready reels is scored (≤8 reels: exact); score = festival fit (OCCASIONS calendar:
    Tulsi Vivah, Kartik Purnima, Vivah Panchami, Makar Sankranti, Maha Shivratri, Ram Navami, Hanuman Jayanti...) +
    Hanuman reels on Tue/Sat + ★★★ reels on weekends + small plan-order cost; `"follows"` pairs stay back to back.
  - Times: an Indian evening-audience prior × the channel's own results (age-normalised).
  - Double posts (owner-approved rule): one reel a day by default; an OPTIONAL 2nd morning post (9–11 AM) only on a major
    festival (weight ≥ 5), when a second ready reel truly matches it and 5+ reels are ready (`doubleCandidate` in occasions.ts).
  - "Festival plan" section: upcoming occasions, the reels that fit, and "make X before <date>". Keep OCCASIONS updated
    a year ahead (check dates on two panchang sites; mark ±1-day ones `approx`). Plan production so festival reels are ready.
- A reel is marked published automatically when both Instagram and YouTube are posted (DB trigger).

## Sessions and tokens
- Up to 3 reels per session (4 when they share sets/characters, e.g. a two-part reel); owner approved Nov 21 2026. Start a new
  session when this one gets long; everything needed is in git, the HF audio packs and the app DB, so nothing is lost.
  The first message can simply be: "next reel".
