# Re-score unreleased reels with the music palette (owner, Nov 28 2026)

Owner loved A23's soaring strings and wants every unreleased reel to get a palette score (`series.json → score_styles`),
music a little louder (`score_defaults`: gain 2.3, duck 0.6). Budget: owner is upgrading ElevenLabs to Creator (100k/month);
start each re-score only after confirming the limit (`/v1/user/subscription`). ONE reel at a time: score (2 takes) → pick → audio →
render → check → upload (`status.py done`) → tell the owner. Re-scored reels go back to review: tell the owner before their slot.

Not re-scored: A36, A34, A103 (śloka A/B test; A35 already posted with the old music), posted reels, A23 (it IS the reference sound).

| Order | Reel | Posts | score.style | Status |
|---|---|---|---|---|
| 1 | A18 | Dec 14 | royal_court | todo (budget already covers it) |
| 2 | A104 | — | heroic_strings | todo (budget already covers it) |
| 3 | A101 | Dec 2 | battle_epic | todo (after Creator) |
| 4 | A17 | Dec 3 | tender_sorrow | todo |
| 5 | A102 | Dec 4 | night_mystery | todo |
| 6 | A62 | — | night_mystery | todo |
| 7 | A105 | — | tender_sorrow | todo |
| 8 | A82 | — | devotional_glow | todo |
| 9 | LF01 | — | per act (gen_score_acts.py, act styles) | todo |

Re-check the order against the schedule before each one: a reel posting sooner goes first.
