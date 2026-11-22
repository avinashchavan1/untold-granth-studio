# Full-length videos (owner's decision, Nov 22 2026)

**Rule:** full-length videos are NEW productions (never stitched from existing reels). Reels are then DERIVED from the
full-length video: same research, same recorded beats, same art. Every accuracy, quote-card, śloka, calm-narrator and
major-character rule in CLAUDE.md applies to both.

## Pilot: "Vali's death, as Valmiki tells it" (Kishkindha Kanda)
- Owner picked: arc = Vali's death; frame = **16:9 wide** (YouTube long-form), ~10–12 min; then 4–6 derived 9:16 reels.
- Research first (CE Kishkindha, roughly the Sugriva alliance through Vali's death and Tara's lament; read every sarga of the arc,
  CE numbers via `scripts/source_verse.py 4 <sarga> <verses>`). Candidate beats to verify, not assume:
  why Rama shoots from hiding; the two duels and the garland; Tara's warning; Vali's accusation and Rama's answer;
  Vali's last words (Angada, Sugriva); Tara's lament. Popular versions (Ramcharitmanas Kishkindha Kand, ramcharit.in) quoted verbatim.
- **Major characters first needed here** (`series.json → major_characters.ask_user_when_first_needed`): **Vali, Sugriva, Tara, Angada**.
  Show look stills + 3-voice auditions with AskUserQuestion BEFORE rendering.

## How it is built (engine work, done once, then copied to the template)
1. **Beats:** the script is a list of self-contained beats (one scene + its verse), each with its own narration units/takes.
   The full video = intro + all beats + spoken links + outro (one SUBSCRIBE at the end). A derived reel = hook card + śloka (shot 2)
   + 3–5 beats + FOLLOW/SUBSCRIBE end card, with only the hook/links newly recorded; no re-recording of beats.
2. **Two frames from one drawing:** render canvas 1920×1080 for the full video; scenes keep the action inside a centred 9:16 safe zone
   so derived reels render the same scene at 1080×1920. Quote/source/śloka/end cards get a wide and a vertical layout.
3. **Music:** one score piece per act (3–4 per video), crossfaded.
4. **Delivery:** YouTube long-form master (16:9, chapters with CE verse refs in the description, wide thumbnail); derived reels go
   through the normal reel pipeline (stages, covers, masters, app review).

## Budget
- ~10–12 min narration ≈ 15–20k ElevenLabs characters for 2 takes (plan: 40k/month). Expect ~1 full-length video per month alongside a few reels.
