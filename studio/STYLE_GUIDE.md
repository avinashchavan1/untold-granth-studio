# Studio Style Guide — "Untold" scripture reels

This guide works for any book. Untold Ramayana (Valmiki) is the first series. The same rules, engine and
checklist apply to a Mahabharata, Bhagavata, Puranas, Panchatantra or Upanishad series. Only the
**series folder** changes: `series.json`, `cast/`, `art/`.

---

## 1. The promise (why people follow)

> *"The real version, from the original text, with the verse number on screen."*

Every reel either **busts a popular belief** ("there was no Lakshmana Rekha") or **reveals a moment almost
nobody knows** ("Hanuman first mistook Mandodari for Sita"). Every claim is traceable to a verse.
Accuracy is the brand: one wrong claim can sink the page. Reverence is not optional either: we correct
retellings, we never mock the tradition or the people who believe them.

## 2. Truth rules (non-negotiable)

1. **One base text per series**, named on screen. For Ramayana this is the Valmiki Ramayana, Baroda
   **Critical Edition** (English: Bibek Debroy). Chapter numbers follow the Critical Edition.
   The vulgate/Gita Press numbering is often +1 to +12 sargas off, so always say which one you mean.
2. **Every factual claim goes in `script.json → claims[]`** with `ref` (kanda.sarga.verse), the Sanskrit
   (`quote_sa`) where possible, and `verified: true` only after it has been read in the text.
   `make_reel.py check` refuses unverified claims.
3. **Two independent sources** for each claim: the CE Sanskrit (e.g. enjoylearningsanskrit.com CE text) plus a
   translation (Debroy; or Shastri/wisdomlib, vulgate numbers). If they disagree, the CE wins and the reel says less.
4. **Dialogue is translation, not invention.** A character may only say what the verse says,
   tightened for speech. No added insults, relationships, names or props. In A01 we removed "भाभी" and
   "red-hot iron arrows" because they are not in the CE.
5. **Say "later retellings", never "fake".** For example: "The Lakshmana Rekha came from later tellings, not from Valmiki."
   Name the later source (Ramcharitmanas, Adhyatma, Kamba, folk) only when you have verified it.
6. **Absence claims need care.** "X is not in Valmiki" means it is absent from the whole CE, not only from that
   chapter. Search the full text (all kandas) before saying it.
7. **Uttara Kanda and the Bala Kanda frame are later layers** by scholarly consensus. When a reel uses them, the
   source card says so ("UTTARA KANDA") and the script avoids "Valmiki says…" absolutes.
8. **Sensitive episodes** (Sita's exile, Shambuka, Vali's killing, caste, women's agency) are handled with
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
  - **Who picks:** the user picks only for *major, recurring* characters (list in `series.json → major_characters`: Hanuman, Ravana, Bharata, Dasharatha, Kaikeyi, Sugriva, Vibhishana…). For minor or one-episode characters (Shabari, Jatayu, Guha, Ahalya…), Claude auditions, picks by fit and pronunciation, locks the voice and notes the choice in `cast.json`. No need to ask.
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
  - ⚠ **Open design question:** Valmiki repeatedly calls Rama *śyāma* (dark). The current rig is light-skinned, following the original brief. Decide once, lock it, and note it in `cast.json`.
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

## 7. Delivery

- **Upload masters (best quality; these are what you post).** `make_reel.py render` makes them automatically, or run `make_reel.py master`.
  - **Source:** every frame is re-rendered as PNG into a lossless intermediate; no JPEG step anywhere.
  - **`<ID>_INSTAGRAM_MASTER.mp4`:** 1080×1920 (Instagram's maximum), 24 fps, H.264 High@4.2, preset veryslow, CRF 12, tune grain (keeps the gouache paper texture), 1 s GOP, BT.709, AAC-LC 320 kbps at 48 kHz. Also used for Facebook Reels.
  - **`<ID>_YOUTUBE_MASTER.mp4`:** 2160×3840 (4K, Lanczos upscale), so YouTube serves its higher-bitrate VP9/AV1 version to every viewer. H.264 High@5.2, CRF 14, tune grain, 0.5 s GOP, BT.709, AAC-LC 384 kbps (YouTube's recommended audio bitrate).
  - **Size:** several hundred MB per reel, on purpose. Platforms re-encode everything, so the cleaner the upload, the better viewers see it.
- **Cover / thumbnail (every reel):** `out/<ID>_cover.jpg` (1080×1920 JPEG, under 2 MB), from `make_reel.py thumb` (also run by `render`).
  - Art: one clean frame from the reel (no subtitles, cards or logo), chosen so the story reads at a glance and faces stay clear of the title.
  - Type: series label in gold Cinzel; the myth in big ivory Hindi (Mukta Bold, one line where possible); a red "वाल्मीकि में नहीं" stamp on myth-busters; the English title in gold Cinzel; a verse badge that matches the reel's claims.
  - Every word sits inside y 240–1680, the Instagram profile-grid crop (3:4) and clear of the Reels UI.
  - The publisher sends it as the Instagram Reels cover and the YouTube thumbnail.
- **`out/<ID>_final.mp4`:** small preview and sharing copy (WhatsApp, review). Never upload this one.
- **Loudness:** −14 LUFS integrated, true peak ≤ −1.5 dBFS.
- **Paperwork:** `<ID>_citations.md` and `<ID>_caption.txt`; `make_reel.py desk` builds the publishing-desk entry with per-platform captions.
- **Publishing desk:** the Untold Granth Studio page tracks every reel: preview, citation check, copy caption, open platform, mark posted.
- **Long-form later:** stitch 6–10 related reels into a 6–10 minute chapter video at 16:9.

## 8. Review checklist (every reel)

- [ ] `make_reel.py check` passes: all claims `verified: true` with refs
- [ ] Every character line matches its verse; nothing added
- [ ] The source card shows the right kanda and chapters, plus "CRITICAL EDITION"
- [ ] `pick_log.txt`: every "heard" line matches "said" (no babble, no missing words)
- [ ] Stills checked: hook, source card, every character's first appearance, the reveal, the end card
- [ ] Length 45–65 s (≤ 90 s); −14 LUFS; the voice is clearly audible over the music on a phone speaker
- [ ] Cover checked (frame, Hindi spelling, badge = claims, inside the grid crop)
- [ ] Instagram + YouTube masters built; desk entry added; posted only after the citation box is ticked
- [ ] Respect pass: nothing mocking, gory or sexualised; sensitive topic handled with context
- [ ] A person read the citation sheet against the text

## 9. Making a new series (another book)

1. `cp -r series/untold-ramayana series/<new>`. Keep the `reel_template/`, delete `reels/`.
2. Edit `series.json`: logo, title lines, tagline, CTA, base text and edition, citation format, palette.
3. Cast: keep the narrator for brand continuity (recommended), then audition and lock new character voices in `cast/`.
4. Art: add character rigs to `art/chars.js` and locations to `art/bg.js`; update `sourceCard`/`endCard` art if needed.
5. Write `PLAN.md` for the series, then `make_reel.py new <series> <ID> "<title>"`.

One channel, many series (recommended): the channel is the umbrella brand, and each book is a named series and playlist.
