#!/usr/bin/env python3
"""Live "what Claude is doing" status for the app's work panel (table work_status, lane 'main').

  python3 scripts/status.py set --reel A89 --step 5 --task "Drawing the art" [--detail ...] [--pct 40] [--eta 12] [--state working|waiting]
  python3 scripts/status.py idle
  python3 scripts/status.py watch-queue A18 A23 A101 [--studio DIR]   # follows renders reel by reel until every master is done
  python3 scripts/status.py watch-render A89                          # one reel (same as watch-queue with one code)
  python3 scripts/status.py batch R006 R007 R008 R009 --task "Next 4 reels"   # start a batch: the panel tracks every reel's step
  python3 scripts/status.py done R006                                 # a reel of the batch is finished (uploaded for review)
  python3 scripts/status.py auto R006 3 "Recording the voice"         # quiet best-effort update (used by make_reel.py)

Steps of a reel (shown as "step N of 8"):
  1 Research the verses · 2 Write the script · 3 Record the voices · 4 Compose the music
  5 Draw the art and animation · 6 Render the preview · 7 Render the 4K and 1080p masters · 8 Cover, checks and upload
The panel also shows `info`: the reel's title, the render phases, the queue of reels, recent events and an overall time estimate.
"""
import argparse, glob, json, os, re, sys, time, urllib.request
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from channel import SUPA as BASE, SID
H = {"apikey": "proxy-injected"}   # key injected by the environment proxy
STEPS = ["Research the verses", "Write the script", "Record the voices", "Compose the music", "Draw the art and animation",
         "Render the preview", "Render the 4K and 1080p masters", "Cover, checks and upload"]
# minutes of work per second of video on this machine (measured on 4 cores, Nov 2026); refined live from frame rates
COST = {"preview": 0.08, "lossless": 0.16, "instagram": 0.04, "youtube": 0.12}
PHASES = [("preview", "Drawing the preview frames"), ("preview_mux", "Joining the preview with the sound"),
          ("lossless", "Drawing lossless frames for the masters"), ("instagram", "Encoding the Instagram 1080p master"),
          ("youtube", "Encoding the YouTube 4K master")]
STATE = os.path.join(os.path.expanduser("~"), ".cache", "work_status_info.json")   # keeps events between calls

def now(): return datetime.now(timezone.utc).isoformat()
def api(method, q, body=None):
    rq = urllib.request.Request(f"{BASE}/rest/v1/{q}", json.dumps(body).encode() if body is not None else None,
                                {**H, "Content-Type": "application/json", "Prefer": "return=minimal"}, method=method)
    urllib.request.urlopen(rq, timeout=30).read()

def load_info():
    try: return json.load(open(STATE))
    except Exception: return {"events": []}
def save_info(info):
    os.makedirs(os.path.dirname(STATE), exist_ok=True); json.dump(info, open(STATE, "w"), ensure_ascii=False)

def event(info, text):
    ev = info.setdefault("events", [])
    if not ev or ev[-1]["text"] != text: ev.append({"at": now(), "text": text})
    info["events"] = ev[-8:]

def patch(row, info=None):
    row = {**row, "updated_at": now()}
    if info is not None: row["info"] = info; save_info(info)
    api("PATCH", "work_status?lane=eq.main", row)

# the reel's stage on its details page follows the work step (owner's rule, Nov 21 2026); never moves a reel backwards,
# and never sets review/approved/published (review is set at upload via stages.json + sync.py, the owner approves)
ORDER = ["idea", "researching", "scripted", "voiced", "rendered", "review", "approved", "published"]
STEP_STAGE = {1: "researching", 2: "scripted", 3: "voiced", 4: "voiced", 5: "voiced", 6: "rendered", 7: "rendered", 8: "rendered"}
def advance_stage(reel, step, info):
    want = STEP_STAGE.get(step)
    if not reel or not want or info.setdefault("stage_sent", {}).get(reel) == want: return
    try:
        from channel import SER
        if want == "voiced" and not glob.glob(os.path.join(SER, "reels", reel, "audio", "*.wav")) and not glob.glob(os.path.join(SER, "reels", reel, "audio", "takes", "*")):
            return                                        # art can be drawn before any voice exists: don't call the reel "voiced" yet
        sp = os.path.join(SER, "reels", "stages.json"); st = json.load(open(sp)) if os.path.exists(sp) else {}
        if os.path.isdir(os.path.join(SER, "reels", reel)) and (st.get(reel) not in ORDER or ORDER.index(st[reel]) < ORDER.index(want)):
            st[reel] = want; json.dump(st, open(sp, "w"), indent=1); open(sp, "a").write("\n")     # git copy, read by sync.py
        rq = urllib.request.Request(f"{BASE}/rest/v1/reels?select=stage&series_id=eq.{SID}&code=eq.{reel}", headers=H)
        cur = (json.loads(urllib.request.urlopen(rq, timeout=30).read()) or [{}])[0].get("stage")
        if cur is None or (cur in ORDER and ORDER.index(cur) < ORDER.index(want)):
            api("PATCH", f"reels?series_id=eq.{SID}&code=eq.{reel}", {"stage": want})
        info["stage_sent"][reel] = want
    except Exception as e: print("stage not updated:", e, file=sys.stderr)   # the work panel still updates

def batch_progress(info, reel=None, step=None, task=None, pct=None):
    """info.reels = {code: {step, task, state}} for the current batch; info.batch_pct = overall % (8 steps per reel)."""
    reels = info.get("reels") or {}
    if reel in reels and step:
        r = reels[reel]
        if r.get("state") != "done": r.update({"step": max(step, r.get("step") or 0) if step <= len(STEPS) else step, "task": task or r.get("task"), "state": "running", "pct": pct})
        for c, o in reels.items():                      # one reel runs at a time; others keep their place
            if c != reel and o.get("state") == "running":
                o["state"] = "paused"
                if (o.get("step") or 0) >= 6: o.update({"step": 8, "task": "Rendered · waiting for upload", "pct": 0})
    if reels:
        tot = 0.0
        for o in reels.values():
            if o.get("state") == "done": tot += 1
            elif o.get("step"): tot += (o["step"] - 1 + (o.get("pct") or 0) / 100) / len(STEPS)
        info["batch_pct"] = round(100 * tot / len(reels), 1)

def adopt_reel(info, reel):
    """The reel being worked on always shows in the batch grid: a finished batch is replaced by a new one for this reel,
    an unfinished batch gets the reel added at the end (otherwise the panel kept showing an old, finished batch)."""
    if not reel or reel in (info.get("reels") or {}): return
    reels = info.get("reels") or {}
    if not reels or all(o.get("state") == "done" for o in reels.values()):
        info["batch"] = {"title": f"{reel}", "codes": [reel], "started": now()}; info["reels"] = {}
        try: info["batch"]["title"] = f"{reel} · {title_of(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'studio'), reel)}"
        except Exception: pass
    else:
        info.setdefault("batch", {}).setdefault("codes", []).append(reel)
    info["reels"][reel] = {"step": 0, "task": "Queued", "state": "queued"}

def set_status(state="working", reel=None, step=None, task=None, detail=None, pct=None, eta=None, started=None, info=None, log=True):
    info = info if info is not None else load_info()
    if state == "working": adopt_reel(info, reel)
    advance_stage(reel, step, info)
    task = task or (STEPS[step - 1] if step else None)
    batch_progress(info, reel, step, task, pct)
    if log and task: event(info, f"{reel + ': ' if reel else ''}{task}" + (f" ({detail})" if detail and len(detail) < 70 else ""))
    if state == "waiting": info["phases"] = []
    patch({"state": state, "reel_code": reel, "step": step, "steps": len(STEPS) if step else None, "task": task, "detail": detail,
           "pct": None if pct is None else round(max(0, min(100, pct)), 1), "eta_min": None if eta is None else round(eta, 1),
           **({"started_at": started} if started else {})}, info)

# ---------------- render queue watcher ----------------
def frames(logs):
    done = total = 0
    for f in logs:
        m = re.findall(r"(\d+) / (\d+)", open(f, errors="ignore").read()[-4000:])
        if m: d, t = map(int, m[-1]); done += d; total += t
    return done, total

def reel_dir(studio, code): return os.path.join(studio, "series", SID, "reels", code)
def title_of(studio, code):
    try: return json.load(open(os.path.join(reel_dir(studio, code), "src", "script.json"), encoding="utf-8"))["title"]
    except Exception: return code
def secs_of(studio, code):
    try: return json.load(open(os.path.join(reel_dir(studio, code), "src", "timeline.json")))["total"]
    except Exception: return 100.0
def fresh(f, mix):      # an output counts as done only if newer than the reel's current sound mix
    return os.path.exists(f) and (not os.path.exists(mix) or os.path.getmtime(f) > os.path.getmtime(mix))

def plan_progress(folder, key, mix):
    """(done frames, total frames, chunks done, chunks) for a chunked render pass described by <folder>/plan.json (written by make_reel)."""
    pf = os.path.join(folder, "plan.json")
    if not os.path.exists(pf) or (os.path.exists(mix) and os.path.getmtime(pf) < os.path.getmtime(mix)): return None
    plan = json.load(open(pf)); names = plan.get(key, []); fr = plan.get("frames", {}); done = total = nd = 0
    for n in names:
        total += fr.get(n, 0)
        if os.path.exists(os.path.join(folder, n + ".done")): done += fr.get(n, 0); nd += 1; continue
        log = os.path.join(folder, (n[:-4] + ".log") if key == "lossless" else ("r" + n[3:-4] + ".log"))
        if os.path.exists(log) and os.path.getmtime(log) >= os.path.getmtime(pf) - 5:   # ignore logs left by an older run
            # the renderer logs ABSOLUTE frame numbers ("2256 / 2520" = frame 2256, chunk ends at 2520): count from the chunk's start
            d, t = frames([log]); start = max(0, t - fr.get(n, 0))
            done += max(0, min(fr.get(n, 0), d - start))
    return done, total, nd, len(names)

def phase_of(studio, code):
    """(phase key, done fraction 0..1, detail) for one reel, read from its out/ folder; ('done', 1, '') when both masters exist."""
    R = reel_dir(studio, code); out = os.path.join(R, "out"); mix = os.path.join(R, "audio", "mix.wav"); ll = os.path.join(out, "lossless")
    yt, ig, final = (os.path.join(out, f"{code}_{k}.mp4") for k in ("YOUTUBE_MASTER", "INSTAGRAM_MASTER", "final"))
    if fresh(yt, mix) and fresh(ig, mix) and os.path.exists(ig + ".done") and os.path.exists(yt + ".done") and not os.path.isdir(ll): return "done", 1.0, ""
    secs = secs_of(studio, code)
    def since(marks):   # how far into an encode we are: time since the previous phase finished, against its usual length
        ts = [os.path.getmtime(m) for m in marks if os.path.exists(m)]
        return min(0.97, (time.time() - max(ts)) / 60 / max(0.5, COST_PH[0] * secs)) if ts else 0.0
    COST_PH = [0.0]
    lp = plan_progress(ll, "lossless", mix)
    if lp:
        d, t, nd, n = lp
        if nd < n: return "lossless", (d / t if t else 0), f"{d:,} of {t:,} lossless frames · chunk {nd} of {n} done · 3 at a time"
        if not (fresh(ig, mix) and os.path.exists(ig + ".done")):
            COST_PH[0] = COST["instagram"]; return "instagram", since(glob.glob(os.path.join(ll, "*.mkv.done"))), "1080p, best quality (time left is estimated: no frame counter while compressing)"
        COST_PH[0] = COST["youtube"]; return "youtube", since([ig + ".done"]), "2160×3840, best quality (time left is estimated: no frame counter while compressing)"
    if fresh(final, mix): return "lossless", 0.0, "starting the lossless renderer"
    pp = plan_progress(out, "preview", mix)
    if pp:
        d, t, nd, n = pp
        if nd < n: return "preview", (d / t if t else 0), f"{d:,} of {t:,} frames · chunk {nd} of {n} done · 3 at a time"
        return "preview_mux", 0.5, "joining the chunks and the sound"
    return "queued", 0.0, "waiting for its turn"

def remaining_min(key, frac, secs, rate=None):
    order = [p for p, _ in PHASES]; left = 0.0
    if key == "done": return 0.0
    if key == "queued": return secs * sum(COST.values())
    i = order.index(key)
    cur = COST.get(key, 0.02) * secs * (1 - frac)
    if rate and key in ("preview", "lossless"): cur = rate
    left += cur
    for p in order[i + 1:]: left += COST.get(p, 0.02) * secs
    return left

def watch_queue(codes, studio):
    info = load_info(); started = now(); t0 = time.time(); hist = {}
    info["events"] = info.get("events", [])
    while True:
        # re-read the shared parts every loop: other commands (batch, done, set) change them while this watcher runs,
        # and writing back a stale copy brought back old, finished batches
        fresh = load_info()
        for k in ("batch", "reels", "batch_pct", "events"): info[k] = fresh.get(k, info.get(k))
        queue, total_left, cur = [], 0.0, None
        for c in codes:
            key, frac, det = phase_of(studio, c); secs = secs_of(studio, c)
            rate_left = None
            if key in ("preview", "lossless"):
                h = [x for x in hist.get(c, []) if x[0] > time.time() - 300 and x[1] == key] + [(time.time(), key, frac)]; hist[c] = h
                if len(h) > 2 and h[-1][2] > h[0][2]: rate_left = (1 - frac) / ((h[-1][2] - h[0][2]) / (h[-1][0] - h[0][0])) / 60
            left = remaining_min(key, frac, secs, rate_left); total_left += left
            state = "done" if key == "done" else ("queued" if key == "queued" or cur else "running")
            if state == "running" and cur is None: cur = (c, key, frac, det, left, secs)
            queue.append({"code": c, "title": title_of(studio, c), "state": state, "note": f"{secs:.0f} s reel" + ("" if state == "done" else f" · ~{max(1, round(left))} min")})
        info["queue"] = queue; info["overall_eta_min"] = round(total_left, 1); info["elapsed_min"] = round((time.time() - t0) / 60, 1)
        if cur is None:
            info["phases"] = []; event(info, "All renders finished: " + ", ".join(codes))
            set_status(reel=codes[-1], step=8, task="Renders finished: checks, covers and upload next", detail=None, pct=100, eta=None, info=info, log=False); return
        c, key, frac, det, left, secs = cur
        order = [p for p, _ in PHASES]; i = order.index(key)
        info["title"] = title_of(studio, c); info["phase"] = dict(PHASES)[key]
        info["phases"] = [{"name": n, "state": "done" if j < i else ("running" if j == i else "todo"), **({"pct": round(100 * frac)} if j == i and p in ("preview", "lossless") else {})} for j, (p, n) in enumerate(PHASES)]
        done_w = sum(COST.get(p, 0.02) for p in order[:i]) + COST.get(key, 0.02) * frac; pct = 100 * done_w / sum(COST.get(p, 0.02) for p in order)
        step = 6 if key in ("preview", "preview_mux") else 7
        event(info, f"{c}: {dict(PHASES)[key]}")
        set_status(reel=c, step=step, task=dict(PHASES)[key], detail=det, pct=pct, eta=left, started=started if time.time() - t0 < 25 else None, info=info, log=False)
        time.sleep(20)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("cmd"); ap.add_argument("codes", nargs="*")
    ap.add_argument("--studio", default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "studio"))
    for k in ("reel", "task", "detail", "state"): ap.add_argument("--" + k)
    ap.add_argument("--step", type=int); ap.add_argument("--pct", type=float); ap.add_argument("--eta", type=float)
    a = ap.parse_args()
    if a.cmd == "idle":
        info = load_info(); info.update({"queue": [], "phases": [], "title": None, "phase": None, "overall_eta_min": None, "batch": None, "reels": {}, "batch_pct": None}); event(info, "Idle")
        patch({"state": "idle", "reel_code": None, "task": None, "detail": None, "step": None, "steps": None, "pct": None, "eta_min": None}, info)
    elif a.cmd == "set": set_status(a.state or "working", a.reel, a.step, a.task, a.detail, a.pct, a.eta, now())
    elif a.cmd == "batch":
        info = load_info(); info["batch"] = {"title": a.task or f"{len(a.codes)} reels", "codes": a.codes, "started": now()}
        info["reels"] = {c: {"step": 0, "task": "Queued", "state": "queued"} for c in a.codes}; info["batch_pct"] = 0.0
        event(info, f"Batch started: {info['batch']['title']} ({', '.join(a.codes)})")
        patch({"state": "working", "reel_code": a.codes[0] if a.codes else None, "task": info["batch"]["title"], "detail": "starting", "step": None, "pct": 0, "started_at": now()}, info)
    elif a.cmd == "done":
        info = load_info()
        for c in a.codes:
            if c in (info.get("reels") or {}): info["reels"][c].update({"state": "done", "step": len(STEPS), "task": "Ready for your review", "pct": 100})
            event(info, f"{c}: uploaded, ready for your review")
        batch_progress(info)
        left = [c for c, o in (info.get("reels") or {}).items() if o.get("state") != "done"]
        if info.get("reels") and not left:
            event(info, f"Batch finished: {info.get('batch', {}).get('title', '')}")
            patch({"state": "idle", "task": None, "detail": None, "step": None, "pct": None, "eta_min": None}, info)
        else: patch({"task": f"{a.codes[-1]} done · next: {left[0]}" if left else "Done"}, info)
    elif a.cmd == "auto":                                    # never fails the caller (make_reel.py)
        try: set_status("working", a.codes[0], int(a.codes[1]), " ".join(a.codes[2:]) or None, a.detail, None, None, None)
        except Exception as e: print("status not updated:", e, file=sys.stderr)
    elif a.cmd in ("watch-queue", "watch-render"): watch_queue(a.codes, a.studio)
    else: sys.exit(__doc__)
    print("status:", a.cmd, " ".join(a.codes) or a.reel or "")
