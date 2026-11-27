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
PF = spec.get("proof"); proof_cut = None      # "proof śloka" format: no opening verse; one half-verse over the story art right after the first reveal
for i in ids:
    sh = byid[i]
    if i not in drop and not sh.get("cta"): add(sh, i, i)
    if PF and i == PF["after"]:
        vs = byid[PF["verse_take"][0]]; vq = vs.get("sloka") or vs.get("quote"); line = vq["lines"][PF["half"]].rstrip(" ।॥") + ("।" if PF["half"] == 0 else "॥")
        intro = byid[PF["intro_from"][0]]["units"][PF["intro_from"][1]]
        add({"voice": "narrator", "hi": re.sub(r"\[[^\]]*\]\s*", "", intro) + " " + line, "en": "", "units": [intro, "[softly] " + line], "unit_gap": 0.35, "lead": 0.2, "tail": 0.45,
             "sloka_unit": 1, "cite": PF["ref"], "proof": {"lines": [line], "ref": PF["ref"], "en": PF["en"], "translit": vq["translit"].split(", ")[PF["half"]]}}, i)
        proof_cut = len(shots)
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
if PF and proof_cut:   # its takes: the recorded "Valmiki's words:" intro, and the chosen take of the verse cut at its caesura (no new recording)
    import wave, numpy as np, subprocess
    io = PF["intro_from"]; vt = PF["verse_take"]
    for sub, ext in (("narrator", "mp3"), ("cb", "wav")):
        f = os.path.join(src, "audio", sub, f"s{io[0]:02d}_{io[1]}_t1.{ext}"); shutil.copy2(f, os.path.join(dst, "audio", sub, f"s{proof_cut:02d}_0_t1.{ext}"))
    w = wave.open(os.path.join(src, "audio", "cb", f"s{vt[0]:02d}_{vt[1]}_t{vt[2]}.wav")); sr = w.getframerate(); ch = w.getnchannels()
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64).reshape(-1, ch).mean(1) / 32768
    hop = int(0.02 * sr); env = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)]); q = env < max(0.012, 0.08 * env.max())
    best, run, st = (0, 0), 0, 0
    for k, v in enumerate(q):
        if v: run, st = (run + 1, st if run else k)
        else: run = 0
        if run and 0.3 * len(q) < k < 0.75 * len(q) and run > best[1]: best = (st, run)
    mid = int((best[0] + best[1] / 2) * hop); part = x[:mid] if PF["half"] == 0 else x[mid:]
    part = part / max(1e-9, np.abs(part).max()) * np.abs(x).max(); nf = int(0.12 * sr); part[-nf:] *= np.linspace(1, 0, nf); part[:int(0.01 * sr)] *= np.linspace(0, 1, int(0.01 * sr))
    out_w = os.path.join(dst, "audio", "cb", f"s{proof_cut:02d}_1_t1.wav"); mp = out_w.replace("/cb/", "/narrator/").replace(".wav", ".mp3")
    with wave.open(out_w, "wb") as o: o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes((np.clip(part, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out_w, mp], check=True); os.utime(out_w)          # wav newer than mp3: `narration import` keeps it
    print(f"proof verse: half {PF['half']} of s{vt[0]:02d}_{vt[1]}_t{vt[2]} cut at {mid / sr:.2f}s -> {len(part) / sr:.1f}s")
# the art: the wide production's shots.js, with each derived shot drawn by its "art_from" shot
js = open(os.path.join(src, "src", "shots.js"), encoding="utf-8").read()
js += "\n// ---- derived reel " + rid + " (from " + S["reel"] + "): each shot is drawn by the wide shot it came from (timeline art_from) ----\n" + \
      "const _buildWide = buildScenes; buildScenes = function () { _buildWide(); (TL.shots || []).forEach(sh => { const from = sh.art_from; if (!from || !S_[from]) return;\n" + \
      "  SHOTS[sh.id] = (c, u, p, s, t, post) => { c.save(); c.translate(960, 1250); c.scale(1.15, 1.15); c.translate(-960, -1450);   // 9:16 framing: action above the subtitles\n" + \
      "    S_[from](c, u, p, Object.assign({}, s, { id: from }), t, post); c.restore(); const inner = post.ui;\n" + \
      "    post.ui = cc => { if (inner && !s.card) inner(cc); if (s.card) hookLines(cc, u, s.card); if (s.proof) proofBand(cc, s.proof, u); else if (s.cite && !s.quote && !s.sloka && !s.cta) chip(cc, s.cite, ease(u, 0.3, 0.8)); }; }; }); };\n" + \
      "// the proof śloka: the verse over the story, source + Devanagari + English all visible from the first frame\n" + \
      "function proofBand(c, Q, u) { const a = ease(u, 0, 0.3), y = TALL ? 300 : 120; c.save(); c.globalAlpha = 0.72 * a; c.fillStyle = '#07061a'; c.fillRect(0, y - 70, FW, 330); c.restore();\n" + \
      "  text(c, 'VALMIKI RAMAYANA · KISHKINDHA ' + Q.ref, CX, y, { size: 30, font: 'Montserrat', weight: 800, color: C_GOLD, ls: 4, alpha: a, stroke: 5 });\n" + \
      "  Q.lines.forEach((l, i) => textFit(c, l, CX, y + 95 + i * 86, { size: 66, font: 'Mukta', weight: 700, color: C_GOLD, alpha: a, stroke: 8, shadow: 24 }, MW));\n" + \
      "  textFit(c, Q.translit, CX, y + 150, { size: 28, font: 'Montserrat', weight: 600, color: C_IVORY, alpha: 0.85 * a, stroke: 4 }, MW); enLines(c, Q.en, y + 205, a, MW, 36); }\n"
open(os.path.join(dst, "src", "shots.js"), "w", encoding="utf-8").write(js)
# music: the wide score's excerpts under the borrowed beats are uneven; use the act the reel's beats mostly come from (whole piece, faded)
print(f"{rid}: {len(shots)} shots ({len(copy) - 2} reused + hook + CTA), {n} take files copied -> {dst}")
