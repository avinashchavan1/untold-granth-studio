# The playbook: rules learned the hard way

These come from producing a real channel (100+ planned reels, owner-reviewed). They are the product as much as the code is.
Each rule has a mechanism in the engine; keep both.

## Truth
1. **Accuracy first.** Every claim in a reel cites the base text (`book.chapter.verse` or the channel's format) and was READ in the text
   (`scripts/source_verse.py`, never memory). `claims[]` with `verified: true` only after reading; `make_reel.py check` refuses unverified claims.
2. **Absence claims** ("X is not in the text") need the whole episode read, ideally a whole-text search. When unsure, drop the claim.
3. **Ambiguous text → say less.** If an edition's wording is unclear (e.g. "kings" vs "men"), leave the detail out.
4. **Respect later traditions.** Name later retellings with respect ("both are told with devotion"); never "fake", never mockery.
5. **Later layers and sensitive episodes** get context, the text's own words, and no editorial dunking.

## Show the words
6. **Quote cards.** Whenever a reel names a source, show its exact line: the popular version AND the base-text verse it is compared with
   (source + ref, original script, transliteration, translation); the narrator reads it (`quoteCard`).
7. **Open with the verse.** Shot 2: the narrator names the source (source card) → recites ONE verse expressively (verse card) →
   "this is the real story". Record 3 takes with different expressive tags; pick the most pitch movement with every word intact; pin it (`force_take`).

## Story
8. **Hook card on shot 1** (the question, on screen in the first second). Every reel ships a cover (`make_reel.py thumb`), faces clear of text.
9. **Length follows the information** (60–120 s). Never cut a quote, citation or story step to be shorter; split into parts (`"follows"`) instead.
10. **Major characters:** the owner picks look AND voice (stills + audio options first). Minor ones: Claude picks and says which. Elders and the revered stay dignified, never cute.
11. **Address rule:** revered names aren't used bare by devotees/family (`series.json → address.protected_names`); `check` flags it.

## Sound
12. **One narrator, calm.** Only calm tags ([softly] [warmly] [curious] [serious] [thoughtfully] [pause]); dramatic tags make TTS shout.
    The picker drops takes that rise far above the voice's normal pitch (shouting guard). Avoid [curious] if your narrator tends to rise on it.
    Optional test: `"narration_energy": "hook_reveal"` in script.json allows livelier tags ([excited] [dramatically] [intense]) on the hook
    and shots marked `"reveal": true` only (guard still on). Compare views at 48 h against calm reels of similar fame before adopting it.
13. **Never chop a voice.** Lines end with their natural tail and a fade; verse and quote lines are never ASR-cut (ASR can't spell scripture);
    the verse keeps its own pauses. If a word is cut, fix the engine, not just the reel.
14. **Music may sit high** when it serves the reel (`score.gain`, `score.duck`); one take per reel chosen by its energy curve vs. the story beats.
15. **Endings per platform:** FOLLOW on Instagram/Facebook, SUBSCRIBE on YouTube; both masters checked by transcribing their last seconds.

## Work
16. **The owner posts.** Claude never publishes. Keys are network secrets only, never in chat or code (`proxy-injected`).
17. **Keep the owner updated:** short chat notes + the live progress bar (`scripts/status.py`).
18. **Festival-aware posting:** `calendar.json` (occasions, theme words, weekly days); plan production so festival reels are ready in time.
19. **Up to 3–4 reels per session**, then a fresh session; everything lives in git, the audio packs and the app DB.
