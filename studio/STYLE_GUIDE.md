# Studio Style Guide — story reels with citations

This guide works for any book. The same rules, engine and
checklist apply to a Mahabharata, Bhagavata, Puranas, Panchatantra or Upanishad series. Only the
**series folder** changes: `series.json`, `cast/`, `art/`.

---

## 1. The promise (why people follow)

> *"The real version, from the original text, with the verse number on screen."*

Every reel either **busts a popular belief** ("that famous line isn't in the text") or **reveals a moment almost
nobody knows** ("the hero first mistook a stranger for the person he was searching for"). Every claim is traceable to a verse.
Accuracy is the brand: one wrong claim can sink the page. Reverence is not optional either: we correct
retellings, we never mock the tradition or the people who believe them.

## 2. Truth rules (non-negotiable)

1. **One base text per series**, named on screen. Use one edition (ideally a critical edition) and follow its
   chapter numbers; popular printed editions often number chapters differently, so always say which one you mean.
2. **Every factual claim goes in `script.json → claims[]`** with `ref` (book.chapter.verse), the original text
   (`quote_sa`) where possible, and `verified: true` only after it has been read in the text.
   `make_reel.py check` refuses unverified claims.
3. **Two independent sources** for each claim: the base text in the original language (channel.json → source.verse_url) plus a
   respected translation. If they disagree, the base edition wins and the reel says less.
4. **Dialogue is translation, not invention.** A character may only say what the verse says,
   tightened for speech. No added insults, relationships, names or props. For example, an earlier reel removed a kinship term and
   "red-hot iron arrows" because they are not in the CE.
5. **Say "later retellings", never "fake".** For example: "This scene came from later tellings, not from the base text."
   Name the later source (Ramcharitmanas, Adhyatma, Kamba, folk) only when you have verified it.
6. **Absence claims need care.** "X is not in the text" means it is absent from the whole base text, not only from that
   chapter. Search the full text (all books) before saying it.
7. **Later layers of a text** (sections scholars date later) are named on the source card when a reel uses them,
   and the script avoids "the author says…" absolutes.
8. **Sensitive episodes** (violence, caste, women's agency, contested killings) are handled with
   context, the text's own words, and no editorial dunking. When in doubt, skip the episode.
9. **Human review before posting.** Every reel ships with a citation sheet. A person reads it against the text
   before upload.

## 3. Reel anatomy (45–65 s; hard max ~90 s)

| # | Beat | Length | Rules |
|---|------|--------|-------|
| 1 | **Hook question** | 2.5–4 s | A belief everyone knows, asked as a question. Big title text on screen, under 5 words. |
| 2 | **Source card** | 5–7 s | "वाल्मीकि रामायण, <कांड>, सर्ग X से Y। ये है असली कहानी।" Manuscript plus "CRITICAL EDITION". |
| 3–n | **Story** | 30–55 s | 6–14 shots, about one line each. Alternate narrator lines with character lines (the verse made speech). Escalate. |
| n-1 | **The reveal / payoff** | 4–6 s | Three short stamps ("कोई रेखा नहीं। कोई मंत्र नहीं। बस, एक प्रार्थना।") plus one big visual moment. |
| n | **End card** | 3.5–4.5 s | Series title, tagline and FOLLOW. CTA: "ऐसी और अनसुनी कहानियों के लिए, फ़ॉलो करें।" |

**Writing:**
- **Language:** Hinglish/Hindi in Devanagari, simple spoken Hindi; avoid Sanskritised Hindi unless it is quoted.
- **Sentences:** short, 8–14 words, each a complete thought (TTS performs whole sentences best).
- **Opening line:** start at the moment of tension; no "Long ago…".
- **Shots:** each shot is one picture and one line. If a line needs two pictures, split the shot.
- **Ending:** close by naming the myth again and the truth in one line.
- **Subtitles:** English, sentence case, at most about 2 lines. Leave them off where the screen already shows big text.

## 4. Voices

- **Narrator (locked):** ElevenLabs "Rudra – Intense Documentary Narrator" on eleven_v4.
  - Use audio tags to direct each line: `[curious]` for hooks, `[dramatically]` and `[intense]` for turns, `[softly]` for grief, `[cautiously]` for the villain's arrival, `[deep voice]` for reveals, `[warmly]` for the CTA, and `[pause]` inside lines.
  - Never speed the narrator up. If a reel runs long, cut words.
- **Characters (locked):** Chatterbox Multilingual, cloned only from openly licensed references (FLEURS CC-BY-4.0, IndicVoices-R).
  - Each character has one reference clip in `cast/voices/`, and its delivery (`ex`, `cfg`) and FX chain live in `cast.json`.
  - A new character gets an audition (3–6 candidates, same line), then it is locked.
  - **Who picks:** the user picks only for *major, recurring* characters (list in `series.json → major_characters`, e.g. the hero, the villain, the hero's family). For minor or one-episode characters (one-episode figures: a boatman, a hermit, a messenger…), Claude auditions, picks by fit and pronunciation, locks the voice and notes the choice in `cast.json`. No need to ask.
- **Consent:** never clone a real creator's or actor's voice without their written consent.
- **Picking takes:** `make_reel.py pick` speech-recognises every take, rejects takes that run on past the line, and picks the most accurate and tightest one.
  - When a picked take is wrong, pin the right take in the shot (`"force_take": {"0": 2}`).
  - Check `audio/pick_log.txt` ("said / heard") for every line.

## 5. Visual style — "nocturne gouache"

- **Look:** painted gouache cut-outs with rough edges (they boil every 3 frames), paper grain, brush drag and a vignette.
  - Palette: indigo/violet night, warm lamp gold, river teal.
  - Accents: gold `#f6c244`, ivory `#fbf3df`, red `#c81e1e` (CTA only).
  - All of this is generated in code, so it is consistent, free and repeatable.
- **Characters** are rigs in `art/chars.js`: locked skin, cloth and accessories per character, with poses, blinks, gaze and IK hands.
  - **Respect:** dignified poses for divine figures, no gore (cuts happen off-screen and are shown as light, sound and shadow), and no sexualised framing.
  - ⚠ **Match the text:** if the base text describes a character's appearance (e.g. skin colour), the rig follows the text; decide once and lock it.
- **Locations** are built once per series in `art/bg.js` (hermitage at dusk, night and end; forest; doorway; manuscript) and reused. A new location is a new `build*()` function.
- **Camera:** slow push-ins (1.00 → 1.08) and parallax layers; a small camera shake only on impacts.
- **Text on screen:**
  - Big Cinzel 900 titles, at most 3 words per line.
  - Montserrat for sub-lines and subtitles; subtitle words light up gold as they are spoken.
  - Shot labels are rare (at most 2 per reel).
  - Keep the bottom ~22% clear of key art for platform UI.
- **Templates** (`art/templates.js`):
  - `sourceCard()` and `endCard()` are mandatory and identical in every reel.
  - `titleShot()` is a generic shot that shows big text over a painted backdrop.

## 6. Sound

- **Score:** synthesised Indian palette: tanpura drone (bed), bansuri phrases (Shivaranjani colour), tabla for chases, strings, choir and taiko for reveals. No samples, so there are no licence or Content ID problems.
- **Mix:**
  - Voice is king. Music sits about 18 dB under the voice while someone speaks (ducked, with 0.15 s look-ahead) and about 8 dB under it in pauses.
  - SFX are subtle and literal: footsteps, crickets, lamp crackle, arrow, fire.
- **Loudness and format:** −14 LUFS integrated, true peak ≤ −1.5 dBFS. Stereo AAC 192k.

## 6a. Score (ElevenLabs Music)

- Every reel gets a composed instrumental score from ElevenLabs Music (`eleven_music_v2_5`), saved as `audio/score.mp3`; `build_audio` uses it instead of the synthesized bed, at the same level, ducked under every line. Sound effects from `sound.py` stay.
- Prompt it as sound, not story: a hook hit in the first second, tension through the setup, a lift at the reveal (about two thirds in), a warm resolve on the end card. Instrumental, sparse mid-range, nothing that fights the voice. Length = draft length + 15 s (the voiced cut runs longer than the draft); if it still runs short, `build_audio` crossfades into the synthesized bed. Kept in `script.json → score`.
- If a take opens quietly, set `score.offset_s` to start on its first swell instead of paying for another take. About 1,100 credits per take; generate 1–2 takes per reel and pick by ear.

## 6b. Language

- **English is the main language for every written word:** on-screen cards, subtitles, covers, titles, captions, descriptions, profiles.
- **Hindi is the narration only** (spoken). No Devanagari on screen, except Sanskrit verse used as art (for example the manuscript prop).
- **The hook is on screen:** shot 1 always has a `card` with the hook (e.g. "THE FAMOUS / LINE?"), the subtitle carries the full question, and the cover repeats it. `make_reel.py check` fails without it.

## 6c. Call to action per platform

- Instagram and Facebook: the narrator says **follow** and the end card says **FOLLOW**. YouTube: **subscribe** / **SUBSCRIBE**.
- The closing shot is marked `"cta": true`. `narration api` also generates its YouTube line (`series.json → cta.youtube.say`) as takes `s<ID>y_*`; `pick` builds both; `audio` writes `mix.wav` and `mix_youtube.wav`; `master` renders the end card per platform, so the YouTube master gets SUBSCRIBE and the subscribe narration.

## 6d. Reach (trial a few reels, then decide)

- **Short cut:** `script.json → short` drops whole shots or keeps only some narration units; `make_reel.py short` builds a ~50–60 s version from the same takes. During the trial the short cut is posted on both Instagram and YouTube (`masters.py <ID> --short`); the full-length masters are kept as backups.
- **Question title** (`youtube_title`), e.g. "Did a Squirrel Really Help Build Ram Setu?" — the phrase people search, as a question.
- **Question for the comments** (`comment_prompt`): asks which version the viewer grew up with. It ends the caption and is posted automatically as the first comment; pin it by hand.
- **Respect:** never call a loved story "fake"; say where it comes from.
- **Measure:** Dashboard → "How the reels are doing" → Refresh stats (views, likes, comments, shares). Compare the trial reels with earlier ones after 7 days.

## 7. Delivery

- **Upload masters (best quality; these are what you post).** `make_reel.py render` makes them automatically, or run `make_reel.py master`.
  - **Source:** every frame is re-rendered as PNG into a lossless intermediate; no JPEG step anywhere.
  - **`<ID>_INSTAGRAM_MASTER.mp4`:** 1080×1920 (Instagram's maximum), 24 fps, H.264 High@4.2, preset veryslow, CRF 12, tune grain (keeps the gouache paper texture), 1 s GOP, BT.709, AAC-LC 320 kbps at 48 kHz. Also used for Facebook Reels.
  - **`<ID>_YOUTUBE_MASTER.mp4`:** 2160×3840 (4K, Lanczos upscale), so YouTube serves its higher-bitrate VP9/AV1 version to every viewer. H.264 High@5.2, CRF 14, tune grain, 0.5 s GOP, BT.709, AAC-LC 384 kbps (YouTube's recommended audio bitrate).
  - **Size:** several hundred MB per reel, on purpose. Platforms re-encode everything, so the cleaner the upload, the better viewers see it.
- **Cover / thumbnail (every reel):** `out/<ID>_cover.jpg` (1080×1920 JPEG, under 2 MB), from `make_reel.py thumb` (also run by `render`).
  - Art: one clean frame from the reel (no subtitles, cards or logo), chosen so the story reads at a glance and faces stay clear of the title.
  - Type (all English): series label in gold Cinzel; the hook question big in ivory Montserrat ExtraBold (two lines max); a red "NOT IN THE TEXT" stamp on myth-busters; the payoff line in gold Cinzel; a verse badge that matches the reel's claims.
  - Every word sits inside y 240–1680, the Instagram profile-grid crop (3:4) and clear of the Reels UI.
  - The publisher sends it as the Instagram Reels cover and the YouTube thumbnail.
- **`out/<ID>_final.mp4`:** small preview and sharing copy (WhatsApp, review). Never upload this one.
- **Loudness:** −14 LUFS integrated, true peak ≤ −1.5 dBFS.
- **Paperwork:** `<ID>_citations.md` and `<ID>_caption.txt`; `make_reel.py desk` builds the publishing-desk entry with per-platform captions.
- **Publishing desk:** the studio app tracks every reel: preview, citation check, copy caption, open platform, mark posted.
- **Long-form later:** stitch 6–10 related reels into a 6–10 minute chapter video at 16:9.

## 8. Review checklist (every reel)

- [ ] `make_reel.py check` passes: all claims `verified: true` with refs
- [ ] Every character line matches its verse; nothing added
- [ ] The source card shows the right book and chapters, plus the edition
- [ ] `pick_log.txt`: every "heard" line matches "said" (no babble, no missing words)
- [ ] Stills checked: hook, source card, every character's first appearance, the reveal, the end card
- [ ] Length 45–65 s (≤ 90 s); −14 LUFS; the voice is clearly audible over the music on a phone speaker
- [ ] Cover checked (frame, Hindi spelling, badge = claims, inside the grid crop)
- [ ] Instagram + YouTube masters built; desk entry added; posted only after the citation box is ticked
- [ ] Respect pass: nothing mocking, gory or sexualised; sensitive topic handled with context
- [ ] A person read the citation sheet against the text

## 9. Making a new series (another book)

1. `cp -r series/example series/<new>` (or run `scripts/setup.sh`). Keep the `reel_template/`, delete `reels/`.
2. Edit `series.json`: logo, title lines, tagline, CTA, base text and edition, citation format, palette.
3. Cast: keep the narrator for brand continuity (recommended), then audition and lock new character voices in `cast/`.
4. Art: add character rigs to `art/chars.js` and locations to `art/bg.js`; update `sourceCard`/`endCard` art if needed.
5. Write `PLAN.md` for the series, then `make_reel.py new <series> <ID> "<title>"`.

One channel, many series (recommended): the channel is the umbrella brand, and each book is a named series and playlist.
