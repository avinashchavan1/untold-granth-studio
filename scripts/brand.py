#!/usr/bin/env python3
"""Rebuild and publish the brand kit to the studio.
   python3 scripts/brand.py            render brand/*.png|jpg (brand/make_brand.py), upload them to storage reel-media/brand/,
                                       and store brand/profiles.json on the channels rows (Profiles page + "Apply to YouTube")."""
import json, mimetypes, os, subprocess, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from channel import C, SID, SUPA, STUDIO, SER, REELS, HF_MASTERS, HANDLES
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); BRAND = os.path.join(ROOT, "brand")
BASE = SUPA; H = {"apikey": "proxy-injected"}
ASSETS = ["avatar_1080.png", "youtube_profile_800.png", "youtube_banner_2560x1440.jpg", "youtube_watermark_300.png"]
SOCIAL = os.path.join(BRAND, "kit", "social")          # Facebook cover, Instagram highlight covers, intro post (brand/make_social_kit.py)
if os.path.isdir(SOCIAL): ASSETS += [os.path.join("kit", "social", f) for f in sorted(os.listdir(SOCIAL)) if f.endswith((".png", ".jpg"))]

if "--no-render" not in sys.argv:
    subprocess.run([sys.executable, "make_brand.py"], cwd=BRAND, check=True)
# Facebook cover (1640x924, 16:9 like the YouTube banner, whose centre safe area fits Facebook's desktop crop): made from the banner when the kit has none
FB_COVER = os.path.join(SOCIAL, "facebook_cover_1640x924.jpg"); BANNER = os.path.join(BRAND, "youtube_banner_2560x1440.jpg")
if os.path.exists(BANNER) and (not os.path.exists(FB_COVER) or os.path.getmtime(FB_COVER) < os.path.getmtime(BANNER)):
    from PIL import Image
    os.makedirs(SOCIAL, exist_ok=True); Image.open(BANNER).convert("RGB").resize((1640, 924), Image.LANCZOS).save(FB_COVER, quality=92)
    if os.path.join("kit", "social", os.path.basename(FB_COVER)) not in ASSETS: ASSETS.append(os.path.join("kit", "social", os.path.basename(FB_COVER)))
    print("made", FB_COVER)
for name in ASSETS:
    path = os.path.join(BRAND, name); ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
    rq = urllib.request.Request(f"{BASE}/storage/v1/object/reel-media/brand/{os.path.basename(name)}", open(path, "rb").read(),
                                {**H, "Content-Type": ctype, "x-upsert": "true", "Cache-Control": "max-age=60"}, method="POST")
    urllib.request.urlopen(rq, timeout=120).read(); print("uploaded brand/" + name, f"{os.path.getsize(path) / 1e3:.0f} kB")

prof = json.load(open(os.path.join(BRAND, "profiles.json")))
for platform, p in prof.items():
    row = {"platform": platform, "profile": p, "handle": HANDLES.get(platform, {}).get("handle") or p.get("handle") or "@" + p.get("username", ""),
           "url": HANDLES.get(platform, {}).get("url") or p.get("url")}
    rq = urllib.request.Request(f"{BASE}/rest/v1/channels?on_conflict=platform", json.dumps(row).encode(),
                                {**H, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}, method="POST")
    urllib.request.urlopen(rq, timeout=60).read(); print("profile saved:", platform)
