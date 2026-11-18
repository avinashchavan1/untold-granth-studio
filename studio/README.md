# Studio — reusable reel engine

```
studio/
  make_reel.py                 one CLI: new · check · draft · stills · voices · narration · pick · audio · render · sheet · all
  STYLE_GUIDE.md               the rules (truth, structure, voice, visuals, sound, delivery, checklist) — book-agnostic
  .claude/skills/make-reel/    the same workflow as a Claude Code skill ("make the next reel")
  engine/js                    canvas gouache renderer + Playwright frame capture (shared by every series)
  engine/py                    reel.py (paths) · cb_generate (Chatterbox) · narration (ElevenLabs) · build_voice (take picker) · build_audio (score/mix library)
  engine/fonts, engine/models  fonts; Chatterbox venv (models/cbenv)
  series/untold-ramayana/
    series.json                logo, title, tagline, CTA, base text + edition, palette
    cast/                      LOCKED voices (cast.json + reference clips)
    art/                       characters (chars.js), locations (bg.js), templates.js (source card, end card, titleShot)
    reel_template/             what `make_reel.py new` copies
    PLAN_100.md                the next 100 reels
    reels/A01/                 src/{script.json, shots.js, sound.py, timeline.json} · audio/ · out/
```

Quick start (new reel):
```bash
python3 make_reel.py new untold-ramayana A02 "Shabari never tasted the berries"
python3 make_reel.py check  series/untold-ramayana/reels/A02
python3 make_reel.py draft  series/untold-ramayana/reels/A02 && python3 make_reel.py stills series/untold-ramayana/reels/A02 1s,5s,12s
python3 make_reel.py voices series/untold-ramayana/reels/A02 1,2,3,4
python3 make_reel.py narration series/untold-ramayana/reels/A02 list     # then generate (connector) or: narration ... api
python3 make_reel.py all    series/untold-ramayana/reels/A02
python3 make_reel.py sheet  series/untold-ramayana/reels/A02
```
Needs: python3 (numpy, faster-whisper), node + playwright (chromium), ffmpeg; Chatterbox venv for character voices.
