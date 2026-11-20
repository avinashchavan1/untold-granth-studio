#!/usr/bin/env python3
"""Short cut of a voiced reel (YouTube Shorts keep viewers better at 35–60 s).

script.json:
  "short": {"drop": [5, 7, 9],                 shots left out entirely
            "units": {"6": [1], "8": [0]},     for these shots keep only these narration units (0-based)
            "en": {"6": "…", "8": "…"}}        English subtitle for a trimmed shot (must match what is still said)

Writes src/timeline_short.json and audio/proc/sXX_short.wav (+ sXXy_short.wav for the YouTube call to action).
No new voice is generated: it re-times the picked takes."""
import json, os, subprocess, sys, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reel import *

ROOT = REEL; TLP = os.path.join(ROOT, "src", "timeline.json")
spec = SCRIPT.get("short") or sys.exit("script.json has no 'short' block")
tl = json.load(open(TLP)); FPS_ = tl["fps"]; drop = set(spec.get("drop", [])); keep_units = {int(k): v for k, v in spec.get("units", {}).items()}

def rd(p):
    w = wave.open(p); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768; return x, sr
def wr(p, x, sr):
    with wave.open(p, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())

def trim(s, key, out_name):
    """keep only the listed units of the shot's narration: spans come from the unit starts the picker recorded"""
    x, sr = rd(os.path.join(ROOT, s[key])); starts = s.get("sent") or [0.0]; n = len(starts); bounds = []
    for k in range(n):
        a = max(0.0, starts[k] - 0.03); b = (starts[k + 1] - 0.08) if k + 1 < n else len(x) / sr
        bounds.append((a, b))
    parts = []
    for i, k in enumerate(keep_units[s["id"]]):
        a, b = bounds[k]; seg = x[int(a * sr): int(b * sr)]
        if i: parts.append(np.zeros(int(0.3 * sr)))
        parts.append(seg)
    y = np.concatenate(parts); fade = int(0.02 * sr); y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
    p = os.path.join(ROOT, "audio", "proc", out_name); wr(p, y, sr); return os.path.relpath(p, ROOT), len(y) / sr, bounds

shots, t = [], 0.0
for s in tl["shots"]:
    if s["id"] in drop: continue
    e = dict(s); lead = s["vStart"] - s["start"]; tail = s["dur"] - lead - s["speech"]
    if s["id"] in keep_units and s.get("audio"):
        e["audio"], speech, bounds = trim(s, "audio", f"s{s['id']:02d}_short.wav")
        if s.get("audio_youtube"): e["audio_youtube"], _, _ = trim(s, "audio_youtube", f"s{s['id']:02d}y_short.wav")
        env = s.get("env") or []; ks = keep_units[s["id"]]
        e["env"] = sum([env[int(bounds[k][0] * FPS_): int(bounds[k][1] * FPS_)] for k in ks], []) if env else []
        e["speech"] = round(speech, 3); e["audioLen"] = round(speech, 3); e["sent"] = [0.0]
        e["en"] = spec.get("en", {}).get(str(s["id"]), s.get("en", ""))
        e["dur"] = round(np.ceil((lead + speech + max(0.25, tail)) * FPS_) / FPS_, 4)
    e["start"] = round(t, 4); e["vStart"] = round(t + lead, 4); e["aStart"] = round(t + lead, 4)
    shots.append(e); t += e["dur"]
out = dict(tl, shots=shots, total=round(t, 4), short=True)
json.dump(out, open(os.path.join(ROOT, "src", "timeline_short.json"), "w"), ensure_ascii=False, indent=1)
print(f"short cut: {len(shots)} of {len(tl['shots'])} shots, {t:.1f}s (full {tl['total']:.1f}s) -> src/timeline_short.json")
for e in shots: print(f"  s{e['id']:02d} {e['start']:6.2f} +{e['dur']:5.2f}  {(e.get('en') or '')[:70]}")
