#!/usr/bin/env python3
"""Character voices (run with the Chatterbox venv python): generates N takes of every unit whose voice
has engine=chatterbox in cast.json. Timbre comes from the LOCKED reference clip of that character.
usage:  REEL=<reel dir> cbenv/bin/python cb_generate.py [takes=1,2,3,4] [only_shots=5,6]"""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reel import *
import torch, torchaudio as ta
torch.set_num_threads(int(os.environ.get("THREADS", "4")))
_ol = torch.load
def _l(*a, **k):
    k["map_location"] = torch.device("cpu"); return _ol(*a, **k)
torch.load = _l
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

takes = [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else "1,2,3,4").split(",")]
only = [int(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else None
jobs = [(sh["id"], i, u) for sh in SCRIPT["shots"] for i, u in enumerate(units(sh))
        if CAST[u[1]].get("engine") == "chatterbox" and (not only or sh["id"] in only)]
todo = [(sid, i, u, k) for sid, i, u in jobs for k in takes if not os.path.exists(take_path(sid, i, k))]
print(f"{len(todo)} takes to generate", flush=True)
if todo:
    m = ChatterboxMultilingualTTS.from_pretrained(device=torch.device("cpu"))
    for n, (sid, i, (txt, v, say, ex, cfg), k) in enumerate(todo, 1):
        t0 = time.time(); torch.manual_seed(1000 * sid + 10 * i + k)
        ref = os.path.join(SERIES, "cast", CAST[v].get("ref", f"voices/{v}.wav"))
        w = m.generate(txt, language_id=SER.get("tts_language", "hi"), audio_prompt_path=ref, exaggeration=ex, cfg_weight=cfg, temperature=0.8)
        ta.save(take_path(sid, i, k), w, m.sr)
        print(f"[{n}/{len(todo)}] s{sid:02d}_{i} {v} take {k}: {w.shape[-1] / m.sr:.2f}s in {time.time() - t0:.0f}s", flush=True)
print("GEN_DONE")
