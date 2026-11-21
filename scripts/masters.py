#!/usr/bin/env python3
"""Upload a reel's full-quality masters to the private Hugging Face repo and attach them in the studio app.
   python3 scripts/masters.py <reel_code> [studio_dir] [--short]
   --short: the short cut (<ID>_*_SHORT.mp4) becomes the file the app posts; the full-length masters are kept as backups.
Hugging Face token + Supabase key are injected by the environment proxy (never stored in code)."""
import json, os, sys, urllib.request, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from channel import C, SID, SUPA, STUDIO, SER, REELS, HF_MASTERS, HANDLES
os.environ.setdefault("HF_TOKEN", "hf_proxyinjected000000000000000000000")
from huggingface_hub import HfApi
REPO = HF_MASTERS; SB = SUPA + "/rest/v1/"
SHORT = "--short" in sys.argv; args = [a for a in sys.argv[1:] if a != "--short"]
code = args[0]; st = args[1] if len(args) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "studio")
out = os.path.join(REELS, code, "out")
SPEC = {"master_instagram": ("INSTAGRAM", "1080×1920 · H.264 High CRF 12 · AAC 320k · Instagram & Facebook"),
        "master_youtube": ("YOUTUBE", "2160×3840 (4K) · H.264 High CRF 14 · AAC 384k · YouTube")}
def rest(method, q, body=None, prefer="return=minimal"):
    r = urllib.request.Request(SB + q, json.dumps(body).encode() if body is not None else None, {"apikey": "proxy-injected", "Content-Type": "application/json", "Prefer": prefer}, method=method)
    b = urllib.request.urlopen(r, timeout=60).read(); return json.loads(b) if b else None
reel = rest("GET", f"reels?select=id&series_id=eq.{SID}&code=eq.{code}", prefer="return=representation")[0]
api = HfApi()
jobs = []
for kind, (tag, spec) in SPEC.items():
    if SHORT:
        jobs.append((kind, os.path.join(out, f"{code}_{tag}_SHORT.mp4"), "SHORT CUT · " + spec))                 # what gets posted
        jobs.append(("backup", os.path.join(out, f"{code}_{tag}_MASTER.mp4"), "full length · " + spec))         # kept, not posted
    else: jobs.append((kind, os.path.join(out, f"{code}_{tag}_MASTER.mp4"), spec))
for kind, p, spec in jobs:
    tag = os.path.basename(p)
    if not os.path.exists(p): print("missing", p); continue
    dest = f"{SID}/{code}/{os.path.basename(p)}"
    api.upload_file(path_or_fileobj=p, path_in_repo=dest, repo_id=REPO, repo_type="dataset", commit_message=f"{code} {tag}")
    url = f"https://huggingface.co/datasets/{REPO}/resolve/main/{urllib.parse.quote(dest)}?download=true"
    rest("DELETE", f"files?reel_id=eq.{reel['id']}&kind=eq.{kind}" + (f"&path=eq.{urllib.parse.quote(dest)}" if kind == "backup" else ""))
    rest("POST", "files", [{"reel_id": reel["id"], "series_id": SID, "kind": kind, "store": "external", "path": dest, "url": url, "bytes": os.path.getsize(p), "spec": spec}])
    print("attached", code, kind, f"{os.path.getsize(p) / 1e6:.0f} MB", url)
