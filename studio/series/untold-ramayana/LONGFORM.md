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

## Budget and pace (owner, Nov 27 2026: 2 full-length videos a month)
- One full-length video ≈ 15–20k ElevenLabs characters (2 takes); two a month ≈ 35–40k. Their 8 derived reels need only short hooks.
- With a daily reel the rest of the month (~22 standalone reels × ~2.5–3k) the total is ≈ 100k characters/month: ElevenLabs Creator (100k).
- Autopilot posts at most one full-length video a week (Sunday 11 AM IST), so two a month fit.

## Next five (planned Nov 27 2026, plan only: nothing researched or generated yet)
Each has `longform/<code>/longform.json` (stage "idea", visible on the app's Long-form page). Every beat says "verify in the CE before scripting".
Posting: Autopilot puts an approved long-form video on YouTube on a Sunday at 11 AM IST (the channel's best long-form slot), never on a day
that already has a long-form video; reels keep their own one-a-day evening slot.

| Code | Title | Arc | Derived reels (plan IDs) | Owner decisions first | Suggested |
|---|---|---|---|---|---|
| LF02 | Hanuman's Leap to Lanka | Sundara, opening sargas | A41, A42, A43, A44 | **Ravana** (look + voice, needed by LF02-LF06), Mandodari (check A07's look) | Jan 2027 (1st half) |
| LF03 | Sita in the Ashoka Grove: Her Own Words | Sundara, middle sargas | A45, A08, A10, A09 | none new | Jan 2027 (2nd half) |
| LF04 | Lanka Burns: the Tail, the Fire and the Fear | Sundara, later sargas | A46, A47, A48 | Indrajit; Vibhishana if he speaks | Feb 2027 (1st half) |
| LF05 | Jatayu and Sampati: the Two Brothers of the Sky | Aranya (Jatayu) + Kishkindha end (Sampati) | A27, A28, A40, A39 | none new | Feb 2027 (2nd half) |
| LF06 | Ravana's Brothers: the Two Who Warned Him | Yuddha (Vibhishana, Kumbhakarna, Ravana's funeral) | A97, A19, A26, A20 | Vibhishana, Kumbhakarna | Mar 2027 (1st half) or Dussehra |

Why this order: Hanuman arcs perform best and share sets (Lanka) and characters, so LF02-LF04 reuse art; LF05 needs almost no new
decisions; LF06 needs the most owner picks and suits Dussehra. Start a session with "long-form: LF02".
