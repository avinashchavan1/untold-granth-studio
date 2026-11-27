#!/usr/bin/env python3
"""Score a reel's hook options (script.json → hook_options) and save the scores, so the app's Script tab can show them.
   python3 scripts/hook_options.py R011            score R011's options (English line), write score + why back
   Each option: {"hi": "<Hinglish narration line>", "en": "<English>", "card": ["LINE 1", "LINE 2"]}. Option 1 = Claude's pick.
Scores come from scripts/vendor/hookscore.py (MIT): length, concrete detail, stakes, payload first, aimed at the viewer.
They catch weak hooks; they don't predict views (see the header of hookscore.py)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "vendor"))
import hookscore
from channel import SER  # noqa: E402  (series folder)

rid = sys.argv[1]
p = os.path.join(SER, "reels", rid, "src", "script.json"); s = json.load(open(p, encoding="utf-8"))
opts = s.get("hook_options") or []
if not opts: sys.exit(f"{rid}: no hook_options in script.json")
for o in opts:
    results, overall, verdict, flags = hookscore.run(o["en"])
    o["score"] = round(overall)
    name, (sc, detail) = min(results.items(), key=lambda kv: kv[1][0])
    o["why"] = f"{verdict.lower()} · weakest: {name.lower()} ({detail})" + (f" · {'; '.join(flags)}" if flags else "")
    print(f"{o['score']:>3}  {o['en']}")
json.dump(s, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
