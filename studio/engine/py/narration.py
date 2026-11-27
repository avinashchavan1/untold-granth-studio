#!/usr/bin/env python3
"""Narrator lines for voices with engine=elevenlabs.

  list    -> prints every narrator unit + the exact request (voice_id, model, text with [tags]) and the
             file name it must be saved as. Use this when generating through the ElevenLabs connector.
  api     -> generates them directly with the ElevenLabs HTTP API (needs ELEVENLABS_API_KEY, or a network
             secret for api.elevenlabs.io injected by the environment proxy). Skips files that exist.
  import  -> converts audio/narrator/sXX_i_tK.mp3 into audio/cb/sXX_i_tK.wav for the take picker.
  chars   -> character count (ElevenLabs bills per character)."""
import os, sys, json, subprocess, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reel import *

def narr_units():
    """(shot id, unit index, voice, text, variant): variant "y" = the YouTube call-to-action line of a "cta" shot."""
    for sh in SCRIPT["shots"]:
        for var, us in (("", units(sh)), ("y", cta_units(sh))):
            for i, (txt, v, say, ex, cfg) in enumerate(us):
                if CAST[v].get("engine") == "elevenlabs": yield sh["id"], i, v, say, var

cmd = sys.argv[1] if len(sys.argv) > 1 else "list"
if cmd == "list":
    for sid, i, v, say, var in narr_units():
        c = CAST[v]; print(json.dumps({"file": f"audio/narrator/s{sid:02d}{var}_{i}_t1.mp3", "voice_id": c["voice_id"], "model_id": c["model"], "prompt": say}, ensure_ascii=False))
elif cmd == "chars":
    n = sum(len(say) for sid, i, v, say, var in narr_units()); print(n, "characters (x takes)")
elif cmd == "api":
    takes = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    key = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")
    for sid, i, v, say, var in narr_units():
        c = CAST[v]
        for k in range(1, takes + 1):
            p = take_path(sid, i, k, "mp3", "narrator", var)
            if os.path.exists(p): continue
            req = {"text": say, "model_id": c["model"], "language_code": c.get("language", "hi")}
            if c.get("voice_settings"): req["voice_settings"] = c["voice_settings"]          # cast.json → voice_settings (e.g. stability) when the owner picked one
            body = json.dumps(req).encode()
            rq = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{c['voice_id']}?output_format=mp3_44100_128", body,
                                        {"xi-api-key": key, "Content-Type": "application/json"})
            data = urllib.request.urlopen(rq, timeout=120).read(); open(p, "wb").write(data); print("saved", p, flush=True)   # fetch first: a refused request must not leave an empty file
elif cmd == "import":
    n = 0
    for f in sorted(os.listdir(os.path.join(AUD, "narrator"))):
        if not f.endswith(".mp3"): continue
        dst = os.path.join(AUD, "cb", f[:-4] + ".wav")
        if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(os.path.join(AUD, "narrator", f)): continue
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(AUD, "narrator", f), "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le", dst], check=True); n += 1
    print("imported", n, "narrator takes")
