#!/usr/bin/env python3
"""Rebuild and publish the brand kit to the studio.
   python3 scripts/brand.py            render brand/*.png|jpg (brand/make_brand.py), upload them to storage reel-media/brand/,
                                       and store brand/profiles.json on the channels rows (Profiles page + "Apply to YouTube")."""
import json, mimetypes, os, subprocess, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from channel import C, SID, SUPA, STUDIO, SER, REELS, HF_MASTERS, HANDLES
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); BRAND = os.path.join(ROOT, "brand")
BASE = SUPA; H = {"apikey": "proxy-injected"}
ASSETS = ["avatar_1080.png", "youtube_profile_800.png", "youtube_banner_2560x1440.jpg", "youtube_watermark_300.png"]

if "--no-render" not in sys.argv:
    subprocess.run([sys.executable, "make_brand.py"], cwd=BRAND, check=True)
for name in ASSETS:
    path = os.path.join(BRAND, name); ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
    rq = urllib.request.Request(f"{BASE}/storage/v1/object/reel-media/brand/{name}", open(path, "rb").read(),
                                {**H, "Content-Type": ctype, "x-upsert": "true", "Cache-Control": "max-age=60"}, method="POST")
    urllib.request.urlopen(rq, timeout=120).read(); print("uploaded brand/" + name, f"{os.path.getsize(path) / 1e3:.0f} kB")

prof = json.load(open(os.path.join(BRAND, "profiles.json")))
for platform, p in prof.items():
    rq = urllib.request.Request(f"{BASE}/rest/v1/channels?platform=eq.{platform}", json.dumps({"profile": p}).encode(),
                                {**H, "Content-Type": "application/json", "Prefer": "return=minimal"}, method="PATCH")
    urllib.request.urlopen(rq, timeout=60).read(); print("profile saved:", platform)
