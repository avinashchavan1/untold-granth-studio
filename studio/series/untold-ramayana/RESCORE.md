# Re-score every unreleased reel with the heroic strings score (owner, Nov 28 2026)

Owner: "all unreleased videos should have the new heroic scoring", "in the order they are gonna be posted".
Style `heroic_strings` (series.json → score_styles; A23's sound), `score_defaults` gain 2.3, duck 0.6.
ONE reel at a time: score (2 takes) → pick by the energy curve (quiet under verses, peak at the climax) → `make_reel.py audio`
→ render → QA → upload (`status.py done`) → `status.py ask "Re-approve <ID> before <slot>"` (a re-scored reel goes back to review).

Cost: 2 takes of ~95 s ≈ 2.4k ElevenLabs credits (measured on A34). The Starter plan (40k) is nearly used up:
continue after the owner upgrades to Creator or adds a key (ask with request_credential, never in chat).

Prompts: describe the story's moods WITHOUT names, reel ids or dates (the music API's copyright filter rejects them; gen_score.py strips
"like reel A23 (...)" notes). `score.file` in script.json is the file the mixer uses (build_audio.py honours it since Nov 28 2026).

| Order | Reel | Posts (IST) | Status |
|---|---|---|---|
| — | A36 | Nov 28, 7 PM | not possible (posted before the score could be made) |
| 1 | A34 | Nov 29 | done (take 2), uploaded Nov 28 → owner re-approves |
| 2 | A103 | Nov 30 | prompt ready; waits for credits |
| — | A23 | Dec 1 | already the heroic strings sound (the reference) |
| 3 | A101 | Dec 2 | waits for credits |
| 4 | A17 | Dec 3 | waits for credits |
| 5 | A102 | Dec 4 | waits for credits |
| 6 | A18 | Dec 14 | has royal_court (Nov 28); redo as heroic_strings |
| 7 | A62 | not scheduled | waits for credits |
| 8 | A105 | after A62 (follows) | waits for credits |
| — | A104 | not scheduled | done (heroic_strings, Nov 28) |
| 9 | A82 | not scheduled | waits for credits |
| 10 | LF01 | long-form | per act, heroic_strings |
| new | A38 | not scheduled | heroic_strings from the start |

A/B note: A35 (posted) and A36 keep the old music, A34 and A103 get the new score, so each śloka-format arm has one of each.
Re-check the order against the schedule before each one: a reel posting sooner goes first.
