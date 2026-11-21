#!/usr/bin/env python3
"""Back up / restore a reel's recorded audio (voice takes, picks, music score, final mixes) on the private Hugging Face repo.
Git keeps only reels/<ID>/src; the audio is too big for git but is needed to re-render a reel without re-recording.

  python3 scripts/audiopack.py push <ID>|all [studio_dir]     # after a reel's audio is final
  python3 scripts/audiopack.py pull <ID>|all [studio_dir]     # in a fresh session, before re-rendering an old reel
Hugging Face token is injected by the environment proxy (never stored in code)."""
import os, sys, tarfile, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from channel import C, SID, SUPA, STUDIO, SER, REELS, HF_MASTERS, HANDLES
os.environ.setdefault("HF_TOKEN", "hf_proxyinjected000000000000000000000")
from huggingface_hub import HfApi, hf_hub_download
REPO = HF_MASTERS
cmd, which = sys.argv[1], sys.argv[2]
st = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "studio")
reels = REELS
SKIP = ("raw", "score_takes")          # raw = re-derivable intermediates; score_takes = unused alternatives
api = HfApi()

def push(code):
    a = os.path.join(reels, code, "audio")
    if not os.path.isdir(a): print("no audio for", code); return
    tmp = os.path.join(tempfile.gettempdir(), f"{code}_audio.tar.gz")
    with tarfile.open(tmp, "w:gz") as t:
        for n in sorted(os.listdir(a)):
            if n in SKIP or n.startswith("mix_raw"): continue
            t.add(os.path.join(a, n), arcname=n)
    api.upload_file(path_or_fileobj=tmp, path_in_repo=f"{SID}/{code}/{code}_audio.tar.gz", repo_id=REPO, repo_type="dataset", commit_message=f"{code} audio pack")
    print("pushed", code, f"{os.path.getsize(tmp) / 1e6:.0f} MB"); os.remove(tmp)

def pull(code):
    f = hf_hub_download(REPO, f"{SID}/{code}/{code}_audio.tar.gz", repo_type="dataset")
    a = os.path.join(reels, code, "audio"); os.makedirs(a, exist_ok=True)
    with tarfile.open(f) as t: t.extractall(a, filter="data")
    print("pulled", code, "->", a)

codes = sorted(d for d in os.listdir(reels) if d.startswith("A") and os.path.isdir(os.path.join(reels, d, "src"))) if which == "all" else [which]
for c in codes:
    try: (push if cmd == "push" else pull)(c)
    except Exception as e: print("failed", c, type(e).__name__, str(e)[:200])
