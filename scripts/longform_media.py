#!/usr/bin/env python3
"""Upload a full-length video's review copy, wide thumbnail and YouTube description to the app's Long-form page.
   python3 scripts/longform_media.py <code>      e.g. LF01
Reads studio/series/<id>/reels/<code>/out/: <code>_final.mp4 (re-encoded to a <= 48 MB 480p review copy), <code>_thumb_wide.jpg,
<code>_youtube_description.txt. Sets longform_videos.preview_path and plan.thumb_path / plan.youtube_description / plan.master.
The 4K master itself goes to the masters repo (scripts/masters.py or the HF masters upload), not to Storage."""
import json, os, subprocess, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from channel import SID, SUPA, STUDIO
code = sys.argv[1]; OUT = os.path.join(STUDIO, "series", SID, "reels", code, "out"); H = {"apikey": "proxy-injected"}
def up(local, name, ctype):
    key = f"{SID}/{code}/{name}"
    rq = urllib.request.Request(f"{SUPA}/storage/v1/object/reel-media/{key}", open(local, "rb").read(), {**H, "Content-Type": ctype, "x-upsert": "true"}, method="POST")
    urllib.request.urlopen(rq, timeout=900).read(); print("uploaded", key, f"{os.path.getsize(local) / 1e6:.1f} MB"); return key
src = os.path.join(OUT, f"{code}_final.mp4"); web = os.path.join(OUT, f"{code}_review.mp4")
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]))
vk = int((46 * 8 * 1024) / dur) - 64                                      # kbit/s so the file lands under ~46 MB
if not os.path.exists(web) or os.path.getmtime(web) < os.path.getmtime(src):
    for ps in (1, 2):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vf", "scale=854:480:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-b:v", f"{vk}k", "-pass", str(ps),
                        "-passlogfile", os.path.join(OUT, "x264pass"), *(["-an", "-f", "null", "/dev/null"] if ps == 1 else ["-c:a", "aac", "-b:a", "64k", "-ac", "2", "-movflags", "+faststart", web])], check=True)
pv = up(web, os.path.basename(web), "video/mp4")
th = os.path.join(OUT, f"{code}_thumb_wide.jpg"); tk = up(th, os.path.basename(th), "image/jpeg") if os.path.exists(th) else None
ds = os.path.join(OUT, f"{code}_youtube_description.txt"); desc = open(ds).read() if os.path.exists(ds) else None
def rest(method, q, body=None):
    r = urllib.request.Request(f"{SUPA}/rest/v1/{q}", json.dumps(body).encode() if body is not None else None, {**H, "Content-Type": "application/json", "Prefer": "return=representation"}, method=method)
    b = urllib.request.urlopen(r, timeout=60).read(); return json.loads(b) if b else None
row = rest("GET", f"longform_videos?select=plan&series_id=eq.{SID}&code=eq.{code}")[0]; plan = row["plan"]
plan.update({"thumb_path": tk, "youtube_description": desc, "length": f"{int(dur // 60)}:{int(dur % 60):02d}",
             "master": f"{code}_YOUTUBE_MASTER.mp4 · 3840x2160 · H.264 CRF 16 · AAC 384k (masters repo)"})
rest("PATCH", f"longform_videos?series_id=eq.{SID}&code=eq.{code}", {"preview_path": pv, "plan": plan, "stage": "review"})
lf = os.path.join(STUDIO, "series", SID, "longform", code, "longform.json")   # keep the plan file in step (sync.py rewrites the DB plan from it)
if os.path.exists(lf):
    d = json.load(open(lf, encoding="utf-8")); d.update({k: plan[k] for k in ("thumb_path", "youtube_description", "length", "master")}); d["stage"] = "review"
    json.dump(d, open(lf, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("Long-form page updated:", code)
