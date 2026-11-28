#!/usr/bin/env python3
"""Music library: compose each score style ONCE, then fit library tracks to reels (owner, Nov 28 2026: saves ElevenLabs credits).

  python3 scripts/music_lib.py list                                   # tracks per style, length, how often used
  python3 scripts/music_lib.py add <style> <name> <file.mp3> [--note "..."]   # add a track (uploads to the HF masters repo)
  python3 scripts/music_lib.py pull                                   # download every track into the local cache
  python3 scripts/music_lib.py use <ID> [style] [--track NAME] [--avoid NAME,...]   # fit a track to the reel → audio/score.mp3
  python3 scripts/music_lib.py use <ID> --cues "1:epic_pulse,3:night_mystery,9:heroic_strings"   # a music PLAN by shot (see below)
  python3 scripts/music_lib.py compose <style> [seconds]             # one new ElevenLabs take for a style (~2k credits), added as a track

Music plan (owner, Nov 28 2026: "it should match the reel, the surroundings and the situation"): script.json → score.cues
[{"shot": 1, "style": "epic_pulse"}, {"shot": 3, "style": "night_mystery"}, ...] (or --cues). Each section from its shot's start to the
next cue takes a library track of its style (continuing a style where it left off), joined by 2.5 s crossfades; verses and quotes are
ducked by the mixer as always. Heroic strings carries the climax unless the story says otherwise.

Manifest (in git): studio/series/<id>/music/library.json. Audio: HF masters repo music/<style>/<name>.mp3, cache studio/series/<id>/music/files/.
`use` picks the least-used track of the style that is long enough (else the longest, extended by a crossfaded repeat of its middle),
fades it out at the reel's end, writes the reel's audio/score.mp3 and script.json → score {engine: "library", style, track, file, gain, duck}.
Then run `make_reel.py audio <reel>` and render as usual."""
import argparse, json, os, shutil, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from channel import SER, REELS, HF_MASTERS, SID
os.environ.setdefault("HF_TOKEN", "hf_proxyinjected000000000000000000000")
LIB = os.path.join(SER, "music"); MAN = os.path.join(LIB, "library.json"); CACHE = os.path.join(LIB, "files")

def load(): return json.load(open(MAN, encoding="utf-8")) if os.path.exists(MAN) else {"tracks": []}
def save(m): os.makedirs(LIB, exist_ok=True); open(MAN, "w", encoding="utf-8").write(json.dumps(m, ensure_ascii=False, indent=1) + "\n")
def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip() or 0)
def local(t): return os.path.join(CACHE, t["style"], t["name"] + ".mp3")
def hf():
    from huggingface_hub import HfApi
    return HfApi()

def fetch(t):
    p = local(t)
    if not os.path.exists(p):
        from huggingface_hub import hf_hub_download
        os.makedirs(os.path.dirname(p), exist_ok=True)
        shutil.copy(hf_hub_download(HF_MASTERS, t["path"], repo_type="dataset"), p)
    return p

def add(style, name, src, note=None, source=None):
    m = load()
    if any(t["style"] == style and t["name"] == name for t in m["tracks"]): sys.exit(f"{style}/{name} already in the library")
    t = {"style": style, "name": name, "path": f"music/{style}/{name}.mp3", "seconds": round(dur(src), 1), "source": source, "note": note, "used_by": []}
    os.makedirs(os.path.dirname(local(t)), exist_ok=True); shutil.copy(src, local(t))
    hf().upload_file(path_or_fileobj=src, path_in_repo=t["path"], repo_id=HF_MASTERS, repo_type="dataset", commit_message=f"music library: {style}/{name}")
    m["tracks"].append(t); save(m); print("added", t["path"], t["seconds"], "s")

def use(code, style=None, track=None, avoid=()):
    reel = os.path.join(REELS, code); sp = os.path.join(reel, "src", "script.json"); s = json.load(open(sp, encoding="utf-8"))
    ser = json.load(open(os.path.join(SER, "series.json"), encoding="utf-8")); dfl = ser.get("score_defaults") or {}
    tl = json.load(open(os.path.join(reel, "src", "timeline.json"), encoding="utf-8")); last = tl["shots"][-1]; need = last["start"] + last["dur"]
    style = style or (s.get("score") or {}).get("style") or "heroic_strings"
    m = load(); pool = [t for t in m["tracks"] if t["style"] == style and t["name"] not in avoid]
    if track: pool = [t for t in pool if t["name"] == track]
    if not pool: sys.exit(f"no {style} track in the library (music_lib.py compose {style})")
    for t in m["tracks"]: t["used_by"] = [c for c in t["used_by"] if c != code]
    long_enough = [t for t in pool if t["seconds"] >= need - 3]
    t = min(long_enough, key=lambda t: (len(t["used_by"]), -t["seconds"])) if long_enough else max(pool, key=lambda t: t["seconds"])
    src = fetch(t); out = os.path.join(reel, "audio", "score.mp3"); os.makedirs(os.path.dirname(out), exist_ok=True)
    fade = 3.0
    if t["seconds"] >= need - 3:
        flt = f"atrim=0:{need:.2f},afade=t=out:st={max(0, need - fade):.2f}:d={fade}"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", flt, "-c:a", "libmp3lame", "-b:a", "192k", out], check=True)
    else:   # too short: repeat its middle (from 30 %) with a 4 s crossfade, then trim and fade
        a = t["seconds"] * 0.3
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-i", src, "-filter_complex",
                        f"[1:a]atrim=start={a:.2f},asetpts=PTS-STARTPTS[b];[0:a][b]acrossfade=d=4:c1=tri:c2=tri,atrim=0:{need:.2f},afade=t=out:st={max(0, need - fade):.2f}:d={fade}[o]",
                        "-map", "[o]", "-c:a", "libmp3lame", "-b:a", "192k", out], check=True)
    old = s.get("score") or {}
    s["score"] = {"engine": "library", "style": style, "track": t["name"], "file": "audio/score.mp3", "gain": dfl.get("gain", 2.3), "duck": dfl.get("duck", 0.6),
                  "take": f"library {style}/{t['name']} ({t['seconds']:.0f} s) fitted to {need:.0f} s", **({"previous": old.get("previous") or {k: v for k, v in old.items() if k != "previous"}} if old else {})}
    json.dump(s, open(sp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    t["used_by"].append(code); save(m); print(f"{code}: {style}/{t['name']} ({t['seconds']:.0f} s) → {need:.0f} s · now run: make_reel.py audio")

def body_start(p):
    """first second where the track reaches its working level (within 6 dB of its median), so a style entering mid-reel lands with energy"""
    import numpy as np
    a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True).stdout, np.int16).astype(float)
    db = np.array([20 * np.log10(np.sqrt(np.mean(a[i:i + 8000] ** 2)) / 32768 + 1e-9) for i in range(0, len(a) - 8000, 8000)])
    ok = np.where(db >= np.median(db) - 6)[0]; return float(min(ok[0], 30)) if len(ok) else 0.0

def cued(code, cues, avoid=()):
    reel = os.path.join(REELS, code); sp = os.path.join(reel, "src", "script.json"); s = json.load(open(sp, encoding="utf-8"))
    ser = json.load(open(os.path.join(SER, "series.json"), encoding="utf-8")); dfl = ser.get("score_defaults") or {}
    tl = json.load(open(os.path.join(reel, "src", "timeline.json"), encoding="utf-8")); last = tl["shots"][-1]; need = last["start"] + last["dur"]
    start = {sh["id"]: sh["start"] for sh in tl["shots"]}; cues = sorted(cues, key=lambda c: start[c["shot"]]); cues[0] = {**cues[0], "shot": tl["shots"][0]["id"]}
    m = load()
    for t in m["tracks"]: t["used_by"] = [c for c in t["used_by"] if c != code]
    chosen, pos, segs, XF = {}, {}, [], 2.5
    for i, c in enumerate(cues):
        a = start[c["shot"]] if i else 0.0; b = start[cues[i + 1]["shot"]] if i + 1 < len(cues) else need
        st = c["style"]
        if st not in chosen:
            pool = [t for t in m["tracks"] if t["style"] == st and t["name"] not in avoid]
            if not pool: sys.exit(f"no {st} track in the library (music_lib.py compose {st})")
            chosen[st] = min(pool, key=lambda t: (len(t["used_by"]), -t["seconds"])); pos[st] = 0.0 if not i else body_start(fetch(chosen[st]))   # mid-reel: skip a quiet intro
        t = chosen[st]; L = (b - a) + (XF if i + 1 < len(cues) else 0)
        off = pos[st] if pos[st] + L <= t["seconds"] else max(0.0, t["seconds"] - L)   # continue the style; else its last stretch
        segs.append((fetch(t), off, L, st, t["name"], a, b)); pos[st] = off + (b - a)
    ins, flt = [], []
    for k, (src, off, L, *_ ) in enumerate(segs): ins += ["-i", src]; flt.append(f"[{k}:a]atrim=start={off:.2f}:duration={L:.2f},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo[s{k}]")
    cur = "s0"
    for k in range(1, len(segs)): flt.append(f"[{cur}][s{k}]acrossfade=d={XF}:c1=tri:c2=tri[x{k}]"); cur = f"x{k}"
    flt.append(f"[{cur}]atrim=0:{need:.2f},afade=t=out:st={max(0, need - 3):.2f}:d=3[o]")
    out = os.path.join(reel, "audio", "score.mp3"); os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(flt), "-map", "[o]", "-c:a", "libmp3lame", "-b:a", "192k", out], check=True)
    old = s.get("score") or {}
    s["score"] = {"engine": "library", "style": cues[-1]["style"], "cues": [{"shot": c["shot"], "style": c["style"]} for c in cues], "file": "audio/score.mp3",
                  "gain": dfl.get("gain", 2.3), "duck": dfl.get("duck", 0.6),
                  "take": " · ".join(f"{a:.0f}-{b:.0f} s {st}/{n}" for _, _, _, st, n, a, b in segs),
                  **({"previous": old.get("previous") or {k: v for k, v in old.items() if k not in ("previous", "cues")}} if old else {})}
    json.dump(s, open(sp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for t in chosen.values(): t["used_by"].append(code)
    save(m); print(code + ": " + s["score"]["take"] + " · now run: make_reel.py audio")

def compose(style, secs=150):
    import urllib.request
    ser = json.load(open(os.path.join(SER, "series.json"), encoding="utf-8")); prompt = (ser.get("score_styles") or {})[style]
    body = json.dumps({"prompt": prompt, "music_length_ms": int(secs * 1000), "model_id": "music_v1", "force_instrumental": True}).encode()
    rq = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192", body, {"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
    tmp = os.path.join(LIB, f"_new_{style}.mp3"); os.makedirs(LIB, exist_ok=True); open(tmp, "wb").write(urllib.request.urlopen(rq, timeout=900).read())
    n = 1 + sum(1 for t in load()["tracks"] if t["style"] == style)
    add(style, f"{style}_{n:02d}", tmp, note=f"composed for the library ({secs} s)"); os.remove(tmp)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("cmd"); ap.add_argument("args", nargs="*")
    ap.add_argument("--note"); ap.add_argument("--source"); ap.add_argument("--cues"); ap.add_argument("--track"); ap.add_argument("--avoid", default="")
    a = ap.parse_args()
    if a.cmd == "list":
        for t in sorted(load()["tracks"], key=lambda t: (t["style"], t["name"])): print(f"{t['style']:16} {t['name']:22} {t['seconds']:6.0f} s  used by {', '.join(t['used_by']) or '-'}  {t.get('note') or ''}")
    elif a.cmd == "add": add(a.args[0], a.args[1], a.args[2], a.note, a.source)
    elif a.cmd == "pull": [print("ok", fetch(t)) for t in load()["tracks"]]
    elif a.cmd == "use" and (a.cues or (len(a.args) == 1 and (json.load(open(os.path.join(REELS, a.args[0], "src", "script.json"), encoding="utf-8")).get("score") or {}).get("cues"))):
        cs = [{"shot": int(x.split(":")[0]), "style": x.split(":")[1]} for x in a.cues.split(",")] if a.cues else json.load(open(os.path.join(REELS, a.args[0], "src", "script.json"), encoding="utf-8"))["score"]["cues"]
        cued(a.args[0], cs, [x for x in a.avoid.split(",") if x])
    elif a.cmd == "use": use(a.args[0], a.args[1] if len(a.args) > 1 else None, a.track, [x for x in a.avoid.split(",") if x])
    elif a.cmd == "compose": compose(a.args[0], int(a.args[1]) if len(a.args) > 1 else 150)
    else: sys.exit(__doc__)
