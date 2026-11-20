#!/usr/bin/env python3
"""Live "what Claude is doing" status for the app's progress bar (table work_status, lane 'main').

  python3 scripts/status.py set --reel A89 --step 5 --task "Drawing the art" [--detail ...] [--pct 40] [--state working|waiting]
  python3 scripts/status.py idle
  python3 scripts/status.py watch-render A89 [studio_dir]    # follows a make_reel render and updates the bar every 20 s until FINAL

Steps of a reel (shown as "step N of 8"):
  1 Research the verses · 2 Write the script · 3 Record the voices · 4 Compose the music
  5 Draw the art and animation · 6 Render the preview · 7 Render the 4K and 1080p masters · 8 Cover, checks and upload
"""
import argparse, glob, json, os, re, sys, time, urllib.request
from datetime import datetime, timezone

BASE = "https://spsrryrycowxmgiofyxo.supabase.co"; H = {"apikey": "proxy-injected"}   # key injected by the environment proxy
STEPS = ["Research the verses", "Write the script", "Record the voices", "Compose the music", "Draw the art and animation",
         "Render the preview", "Render the 4K and 1080p masters", "Cover, checks and upload"]

def patch(row):
    row = {**row, "updated_at": datetime.now(timezone.utc).isoformat()}
    rq = urllib.request.Request(f"{BASE}/rest/v1/work_status?lane=eq.main", json.dumps(row).encode(),
                                {**H, "Content-Type": "application/json", "Prefer": "return=minimal"}, method="PATCH")
    urllib.request.urlopen(rq, timeout=30).read()

def set_status(state="working", reel=None, step=None, task=None, detail=None, pct=None, eta=None, started=None):
    patch({"state": state, "reel_code": reel, "step": step, "steps": len(STEPS) if step else None,
           "task": task or (STEPS[step - 1] if step else None), "detail": detail, "pct": None if pct is None else round(max(0, min(100, pct)), 1),
           "eta_min": None if eta is None else round(eta, 1), **({"started_at": started} if started else {})})

def frames(logs):
    done = total = 0
    for f in logs:
        m = re.findall(r"(\d+) / (\d+)", open(f, errors="ignore").read()[-4000:])
        if m: d, t = map(int, m[-1]); done += d; total += t
    return done, total

def watch_render(code, studio):
    out = os.path.join(studio, "series", "untold-ramayana", "reels", code, "out"); main = os.path.join(out, "render_main.log")
    t0 = time.time(); started = datetime.now(timezone.utc).isoformat(); hist = []
    while True:
        log = open(main, errors="ignore").read() if os.path.exists(main) else ""
        if re.search(r"^FINAL", log, re.M):
            set_status(reel=code, step=8, detail="Render finished: checking both endings, making the cover, uploading", pct=0); return
        if "Traceback" in log:
            set_status(state="working", reel=code, step=7, detail="The render hit an error; fixing it", pct=None); return
        ml = sorted(glob.glob(os.path.join(out, "lossless", "*.log")))
        step, (d, t) = (7, frames(ml)) if ml else (6, frames(sorted(glob.glob(os.path.join(out, "r[0-9].log")))))
        pct = 100 * d / t if t else 0
        hist = [h for h in hist if h[0] > time.time() - 300 and h[1] == step] + [(time.time(), step, pct)]
        eta = None
        if len(hist) > 2 and hist[-1][2] > hist[0][2]:
            rate = (hist[-1][2] - hist[0][2]) / (hist[-1][0] - hist[0][0]); eta = (100 - pct) / rate / 60
        segs = len(ml) if ml else len(glob.glob(os.path.join(out, "r[0-9].log")))
        if t and d >= t - len(ml or [1]) * 30 and step == 7:   # all frames drawn: ffmpeg is compressing the final files (no counter)
            set_status(reel=code, step=7, pct=99, detail="All frames drawn; compressing the final 4K and 1080p files (a few minutes, no counter)"); time.sleep(20); continue
        set_status(reel=code, step=step, pct=pct, eta=eta, started=started if time.time() - t0 < 25 else None,
                   detail=f"{d:,} of {t:,} frames across {segs} parallel segments" if t else "starting the renderer")
        time.sleep(20)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("cmd"); ap.add_argument("code", nargs="?"); ap.add_argument("studio", nargs="?", default="/home/user/studio")
    for k in ("reel", "task", "detail", "state"): ap.add_argument("--" + k)
    ap.add_argument("--step", type=int); ap.add_argument("--pct", type=float); ap.add_argument("--eta", type=float)
    a = ap.parse_args()
    if a.cmd == "idle": patch({"state": "idle", "reel_code": None, "task": None, "detail": None, "step": None, "steps": None, "pct": None, "eta_min": None})
    elif a.cmd == "set": set_status(a.state or "working", a.reel, a.step, a.task, a.detail, a.pct, a.eta, datetime.now(timezone.utc).isoformat())
    elif a.cmd == "watch-render": watch_render(a.code, a.studio)
    else: sys.exit(__doc__)
    print("status:", a.cmd, a.code or a.reel or "")
