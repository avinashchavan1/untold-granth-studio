#!/usr/bin/env python3
"""ElevenLabs Music: generate score takes for a reel from script.json -> score.prompt (+ duration_s).
  python3 engine/py/gen_score.py <reel dir> [takes=2]      -> <reel>/audio/score_takes/take1.mp3 ...
Then listen/inspect, copy the chosen take to <reel>/audio/score.mp3 and set score.take in script.json.
API key is injected by the environment proxy (placeholder 'proxy-injected')."""
import json, os, sys, urllib.request
reel = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 2
s = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8"))["score"]
prompt = s["prompt"]; ms = int(1000 * s.get("duration_s", 72))
out = os.path.join(reel, "audio", "score_takes"); os.makedirs(out, exist_ok=True)
for k in range(1, n + 1):
    rq = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192",
                                json.dumps({"prompt": prompt, "music_length_ms": ms, "model_id": "music_v1", "force_instrumental": True}).encode(),
                                {"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
    open(os.path.join(out, f"take{k}.mp3"), "wb").write(urllib.request.urlopen(rq, timeout=600).read()); print("take", k, "ok", flush=True)
