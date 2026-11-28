#!/usr/bin/env python3
"""ElevenLabs Music: generate score takes for a reel from script.json -> score.prompt (+ duration_s).
  python3 engine/py/gen_score.py <reel dir> [takes=2]      -> <reel>/audio/score_takes/take1.mp3 ...
series.json → score_style (e.g. 'symphonic, no harsh hits') is appended to every prompt.
Then listen/inspect, copy the chosen take to <reel>/audio/score.mp3 and set score.take in script.json.
API key is injected by the environment proxy (placeholder 'proxy-injected')."""
import re, json, os, sys, urllib.request
reel = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 2
s = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8"))["score"]
ser = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(reel))), "series.json")
_ser = json.load(open(ser, encoding="utf-8")) if os.path.exists(ser) else {}
# series.json → score_styles: a palette; script.json → score.style picks one (falls back to score_style, the series default sound)
style = (_ser.get("score_styles") or {}).get(s.get("style") or "", "") or _ser.get("score_style", "")
prompt = s["prompt"] + ("" if not style or style[:40] in s["prompt"] else " " + style);
prompt = re.sub(r"\s*\((?:[^()]*\b(?:owner|reel|A\d+|20\d\d)\b[^()]*)\)", "", re.sub(r"\blike reel [A-Z]\d+\b", "", prompt));
ms = int(1000 * s.get("duration_s", 72))   # (above: no reel ids / notes in the prompt, the copyright filter rejects them)
out = os.path.join(reel, "audio", "score_takes"); os.makedirs(out, exist_ok=True)
for k in range(1, n + 1):
    rq = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192",
                                json.dumps({"prompt": prompt, "music_length_ms": ms, "model_id": "music_v1", "force_instrumental": True}).encode(),
                                {"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
    data = urllib.request.urlopen(rq, timeout=600).read(); open(os.path.join(out, f"take{k}.mp3"), "wb").write(data); print("take", k, "ok", flush=True)
