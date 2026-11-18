#!/usr/bin/env python3
"""Upload a reel's full-quality masters to the private Hugging Face repo and attach them in the studio app.
   python3 scripts/masters.py <reel_code> [studio_dir]
Hugging Face token + Supabase key are injected by the environment proxy (never stored in code)."""
import json, os, sys, urllib.request, urllib.parse
os.environ.setdefault("HF_TOKEN", "hf_proxyinjected000000000000000000000")
from huggingface_hub import HfApi
REPO = "Avinash1443/untold-granth-masters"; SB = "https://spsrryrycowxmgiofyxo.supabase.co/rest/v1/"
code = sys.argv[1]; st = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "studio")
out = os.path.join(st, "series", "untold-ramayana", "reels", code, "out")
SPEC = {"master_instagram": ("INSTAGRAM", "1080×1920 · H.264 High CRF 12 · AAC 320k · Instagram & Facebook"),
        "master_youtube": ("YOUTUBE", "2160×3840 (4K) · H.264 High CRF 14 · AAC 384k · YouTube")}
def rest(method, q, body=None, prefer="return=minimal"):
    r = urllib.request.Request(SB + q, json.dumps(body).encode() if body is not None else None, {"apikey": "proxy-injected", "Content-Type": "application/json", "Prefer": prefer}, method=method)
    b = urllib.request.urlopen(r, timeout=60).read(); return json.loads(b) if b else None
reel = rest("GET", f"reels?select=id&series_id=eq.untold-ramayana&code=eq.{code}", prefer="return=representation")[0]
api = HfApi()
for kind, (tag, spec) in SPEC.items():
    p = os.path.join(out, f"{code}_{tag}_MASTER.mp4")
    if not os.path.exists(p): print("missing", p); continue
    dest = f"untold-ramayana/{code}/{os.path.basename(p)}"
    api.upload_file(path_or_fileobj=p, path_in_repo=dest, repo_id=REPO, repo_type="dataset", commit_message=f"{code} {tag.lower()} master")
    url = f"https://huggingface.co/datasets/{REPO}/resolve/main/{urllib.parse.quote(dest)}?download=true"
    rest("DELETE", f"files?reel_id=eq.{reel['id']}&kind=eq.{kind}")
    rest("POST", "files", [{"reel_id": reel["id"], "series_id": "untold-ramayana", "kind": kind, "store": "external", "path": dest, "url": url, "bytes": os.path.getsize(p), "spec": spec}])
    print("attached", code, kind, f"{os.path.getsize(p) / 1e6:.0f} MB", url)
