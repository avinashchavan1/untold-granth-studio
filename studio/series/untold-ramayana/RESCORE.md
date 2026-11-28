# Re-score every unreleased reel with the heroic strings score (owner, Nov 28 2026)

Owner: "all unreleased videos should have the new heroic scoring", "in the order they are gonna be posted".
Style `heroic_strings` (series.json → score_styles; A23's sound), `score_defaults` gain 2.3, duck 0.6.
ONE reel at a time: score (2 takes) → pick by the energy curve (quiet under verses, peak at the climax) → `make_reel.py audio`
→ render → QA → upload (`status.py done`) → `status.py ask "Re-approve <ID> before <slot>"` (a re-scored reel goes back to review).

Cost: a NEW score (2 takes of ~95 s) ≈ 2.4k ElevenLabs credits (measured on A34). Since Nov 28 2026 (owner agreed) the reels use the
MUSIC LIBRARY instead: `python3 scripts/music_lib.py use <ID> heroic_strings` fits a library track (0 credits), then `make_reel.py audio`
and render. Library: 6 heroic_strings tracks (A23 ×2, A104 ×2, A34 ×2), 2 royal_court (A18). New styles are composed once each
(`music_lib.py compose <style>`, ~2k credits) after the Creator upgrade.

Prompts: describe the story's moods WITHOUT names, reel ids or dates (the music API's copyright filter rejects them; gen_score.py strips
"like reel A23 (...)" notes). `score.file` in script.json is the file the mixer uses (build_audio.py honours it since Nov 28 2026).

| Order | Reel | Posts (IST) | Status |
|---|---|---|---|
| — | A36 | Nov 28, 7 PM | not possible (posted before the score could be made) |
| 1 | A34 | Nov 29 | done (take 2), uploaded Nov 28 → owner re-approves |
| 2 | A103 | Nov 30 | library a104_alt; rendering Nov 28 → owner re-approves |
| — | A23 | Dec 1 | already the heroic strings sound (the reference) |
| 3 | A101 | Dec 2 | next (library, no credits) |
| 4 | A17 | Dec 3 | next (library, no credits) |
| 5 | A102 | Dec 4 | next (library, no credits) |
| 6 | A18 | Dec 14 | has royal_court (Nov 28); redo as heroic_strings |
| 7 | A62 | not scheduled | next (library, no credits) |
| 8 | A105 | after A62 (follows) | next (library, no credits) |
| — | A104 | not scheduled | done (heroic_strings, Nov 28) |
| 9 | A82 | not scheduled | next (library, no credits) |
| 10 | LF01 | long-form | per act, heroic_strings |
| new | A38 | not scheduled | heroic_strings from the start |

A/B note: A35 (posted) and A36 keep the old music, A34 and A103 get the new score, so each śloka-format arm has one of each.
Re-check the order against the schedule before each one: a reel posting sooner goes first.
