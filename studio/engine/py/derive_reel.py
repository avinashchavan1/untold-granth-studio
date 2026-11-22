#!/usr/bin/env python3
"""Derive a 9:16 reel from a full-length (wide) production: same recorded lines, same drawings, only the hook and the ending are new.
  python3 engine/py/derive_reel.py <wide reel dir> <new reel id> <spec.json>
spec.json: {"title": "...", "beats": ["B07", "B08", "B09"] (whole beats, in order) or "shots": [wide shot ids, in order], "drop": [shot ids to leave out, e.g. links that point outside the reel],
            "hook": {"units": ["[thoughtfully] ..."], "en": "...", "card": [["LINE", null], ["LINE", "#f6c244"]], "art_from": <wide shot id>},
            "sloka_from": 2 (reuse the wide video's opening-verse shot) or "sloka_shot": {a full shot-2 dict with sloka, sloka_unit, sloka_takes} (recorded new),
            "thumbnail": {...}, "caption": "...", "youtube_title": "...", "hashtags": [...], "comment_prompt": "..."}
Writes <series>/reels/<id>/src/script.json (frame "tall_from_wide", each shot "art_from": its wide shot id) and a shots.js that reuses the wide
production's art; copies the recorded takes (audio/narrator + audio/cb) under the new shot numbers. Then: narration api (records only the hook and the CTA),
narration import, pick, audio, render, thumb, as for any reel."""
import json, os, shutil, sys, glob, re
src, rid, specp = os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3]
S = json.load(open(os.path.join(src, "src", "script.json"), encoding="utf-8")); spec = json.load(open(specp, encoding="utf-8"))
dst = os.path.join(os.path.dirname(src), rid); [os.makedirs(os.path.join(dst, d), exist_ok=True) for d in ("src", "audio/narrator", "audio/cb", "out")]
byid = {sh["id"]: sh for sh in S["shots"]}; shots = []; copy = []
def add(sh, art_from, takes_from=None):
    n = dict(sh); n["id"] = len(shots) + 1; n["art_from"] = art_from; n.pop("act", None); n.pop("force_take", None) if takes_from is None else None
    shots.append(n); copy.append((takes_from, n["id"]))
h = spec["hook"]; add({"voice": "narrator", "hi": " ".join(re.sub(r"\[[^\]]*\]\s*", "", u) for u in h["units"]), "en": h["en"], "units": h["units"], "card": h["card"], "cite": h.get("cite"), "lead": 0.3, "tail": 0.4, "min": 2.8}, h["art_from"])
if spec.get("sloka_from"): add(byid[spec["sloka_from"]], spec["sloka_from"], spec["sloka_from"])
elif spec.get("sloka_shot"): add(spec["sloka_shot"], spec["sloka_shot"].get("art_from", 2))      # a new opening verse (recorded for this reel; art = the wide verse card)
drop = set(spec.get("drop", []))
ids = spec.get("shots") or [sh["id"] for b in spec.get("beats", []) for sh in S["shots"] if sh.get("beat") == b]
for i in ids:
    sh = byid[i]
    if i not in drop and not sh.get("cta"): add(sh, i, i)
cta = {"voice": "narrator", "hi": "ऐसी और अनसुनी कहानियों के लिए, फ़ॉलो करें।", "en": "", "units": ["[warmly] ऐसी और अनसुनी कहानियों के लिए, फ़ॉलो करें।"], "lead": 0.43, "tail": 0.68, "min": 3.7, "cta": True}
add(cta, max(sh["id"] for sh in S["shots"]))
out = {k: S[k] for k in ("series", "fps", "source", "unit_gap", "avoid", "verify_note") if k in S}
out.update({"reel": rid, "title": spec["title"], "status": "scripted", "frame": "tall_from_wide", "derived_from": S["reel"], "source_card": S.get("source_card"),
            "claims": [c for c in S.get("claims", []) if any(c["claim"] == sh.get("en") for sh in shots)] or S.get("claims", [])[:3],
            "score": {"engine": "excerpt of the wide production's score", "file": "audio/score.wav", "gain": S.get("score", {}).get("gain", 1.5), "duck": S.get("score", {}).get("duck", 0.72)}})
for k in ("thumbnail", "caption", "youtube_title", "hashtags", "comment_prompt", "follows"):
    if k in spec: out[k] = spec[k]
out["shots"] = shots
json.dump(out, open(os.path.join(dst, "src", "script.json"), "w"), ensure_ascii=False, indent=1)
n = 0
for old, new in copy:
    if old is None: continue
    for sub, ext in (("narrator", "mp3"), ("cb", "wav")):
        for f in glob.glob(os.path.join(src, "audio", sub, f"s{old:02d}_*_t*.{ext}")):
            shutil.copy2(f, os.path.join(dst, "audio", sub, re.sub(r"^s\d+_", f"s{new:02d}_", os.path.basename(f)))); n += 1
# the art: the wide production's shots.js, with each derived shot drawn by its "art_from" shot
js = open(os.path.join(src, "src", "shots.js"), encoding="utf-8").read()
js += "\n// ---- derived reel " + rid + " (from " + S["reel"] + "): each shot is drawn by the wide shot it came from (timeline art_from) ----\n" + \
      "const _buildWide = buildScenes; buildScenes = function () { _buildWide(); (TL.shots || []).forEach(sh => { const from = sh.art_from; if (!from || !S_[from]) return;\n" + \
      "  SHOTS[sh.id] = (c, u, p, s, t, post) => { c.save(); c.translate(960, 1250); c.scale(1.15, 1.15); c.translate(-960, -1450);   // 9:16 framing: action above the subtitles\n" + \
      "    S_[from](c, u, p, Object.assign({}, s, { id: from }), t, post); c.restore(); const inner = post.ui;\n" + \
      "    post.ui = cc => { if (inner && !s.card) inner(cc); if (s.card) hookLines(cc, u, s.card); if (s.cite && !s.quote && !s.sloka && !s.cta) chip(cc, s.cite, ease(u, 0.3, 0.8)); }; }; }); };\n"
open(os.path.join(dst, "src", "shots.js"), "w", encoding="utf-8").write(js)
# music: the wide score's excerpts under the borrowed beats are uneven; use the act the reel's beats mostly come from (whole piece, faded)
print(f"{rid}: {len(shots)} shots ({len(copy) - 2} reused + hook + CTA), {n} take files copied -> {dst}")
