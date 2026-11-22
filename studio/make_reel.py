#!/usr/bin/env python3
"""STUDIO — one command line for every reel, any series, any book.

  python3 make_reel.py new      <series> <reel_id> "<title>"   scaffold a reel from the series template
  python3 make_reel.py check    <reel dir>      lint script.json (lengths, citations, cast, units)
  python3 make_reel.py voices   <reel dir> [takes] [shots]     character takes with Chatterbox (local, free)
  python3 make_reel.py narration <reel dir> list|api|import|chars   narrator lines (ElevenLabs)
  python3 make_reel.py draft    <reel dir>      silent timeline from estimated line lengths (preview visuals before any voice work)
  python3 make_reel.py pick     <reel dir>      choose the best take per line, build timeline.json
  python3 make_reel.py stills   <reel dir> 1s,10s,...          preview frames into <reel>/frames
  python3 make_reel.py audio    <reel dir>      score + sfx + voice mix -> audio/mix.wav (-14 LUFS)
  python3 make_reel.py draft-timeline <reel dir>       estimated timeline from the script (preview art before recording)
  python3 make_reel.py render   <reel dir>      frames (3 parallel) + mix -> out/<ID>_final.mp4
  python3 make_reel.py master   <reel dir>      BEST-QUALITY upload masters: lossless PNG re-render -> Instagram 1080p CRF12 + YouTube 4K
  python3 make_reel.py short    <reel dir>      SHORT CUT from script.json "short" (drop shots / keep units): timeline_short.json,
                                                short mixes, out/<ID>_INSTAGRAM_SHORT.mp4 (1080p) + <ID>_YOUTUBE_SHORT.mp4 (4K)
  python3 make_reel.py thumb    <reel dir> [3s,26s,...]   cover/thumbnail from script.json "thumbnail" -> out/<ID>_cover.jpg;
                                                with times: art-only candidates -> frames/thumb_candidates.jpg to pick the frame
  python3 make_reel.py desk     <reel dir> [preview_asset_id] [poster_asset_id]   publishing-desk entry (captions per platform)
  python3 make_reel.py sheet    <reel dir>      citation sheet + caption -> out/<ID>_citations.md, out/<ID>_caption.txt
  python3 make_reel.py all      <reel dir>      narration import -> pick -> audio + render

Engine paths: engine/js (renderer), engine/py (voice/audio), engine/models/cbenv (Chatterbox venv)."""
import json, os, re, shutil, subprocess, sys, time
CHN = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "channel.json"), encoding="utf-8"))   # the channel (repo root)
LANG = {"hi": "Hindi", "en": "English", "mr": "Marathi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam"}.get(CHN["language"]["narration"], CHN["language"]["narration"])
HERE = os.path.dirname(os.path.abspath(__file__)); PY = os.path.join(HERE, "engine", "py"); JS = os.path.join(HERE, "engine", "js")
CBPY = os.path.join(HERE, "engine", "models", "cbenv", "bin", "python")

def run(args, reel, **kw):
    env = dict(os.environ, REEL=os.path.abspath(reel)); print("$", " ".join(args), flush=True)
    return subprocess.run(args, env=env, check=True, **kw)

def check(reel):
    s = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8"))
    ser = os.path.dirname(os.path.dirname(os.path.abspath(reel)))
    cast = json.load(open(os.path.join(ser, "cast", "cast.json")))["voices"]
    probs, chars, narr = [], 0, 0
    for sh in s["shots"]:
        v = sh.get("voice")
        if v and v not in cast: probs.append(f"shot {sh['id']}: voice '{v}' is not in the locked cast")
        elif v and cast[v].get("engine") != "elevenlabs": probs.append(f"shot {sh['id']}: voice '{v}' uses {cast[v].get('engine')}; every voice must be ElevenLabs (cast.json)")
        if v:
            n = len(re.sub(r"[\s,।?!…]|\[[^\]]*\]", "", sh["hi"])); chars += n
            if cast.get(v, {}).get("engine") == "elevenlabs": narr += sum(len(u if isinstance(u, str) else u["say"]) for u in (sh.get("units") or [sh["hi"]]))
            if v != "narrator" and not sh.get("cite"): probs.append(f"shot {sh['id']}: dialogue without a verse citation ('cite')")
    est = chars / 14.5 + sum(sh.get("lead", 0.3) + sh.get("tail", 0.3) for sh in s["shots"]) + sum(sh.get("min", 0) for sh in s["shots"] if not sh.get("voice"))
    if not s.get("claims"): probs.append("no 'claims' list: every factual claim needs a reference")
    ser_ = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(reel))), "series.json"), encoding="utf-8"))
    adr = ser_.get("address", {}); ok = set(adr.get("plain_name_ok", ["narrator"]))
    names = adr.get("protected_names", []); pre = adr.get("honorific_prefixes", [])   # series.json → address: e.g. ["राम"], ["श्री"]
    for sh in s["shots"]:                                   # respect: a revered name is not used bare by devotees, family, friends
        v = sh.get("voice")
        if not v or v in ok: continue
        for u in (sh.get("units") or [sh.get("hi", "")]):
            txt = u if isinstance(u, str) else u.get("say", "")
            for nm in names:
                lb = "".join(f"(?<!{re.escape(x)})" for x in pre)
                if re.search(r"(?<![\u0900-\u097F])" + lb + re.escape(nm) + r"(?![\u0900-\u097F])", txt):
                    probs.append(f"shot {sh['id']}: {v} uses the bare name '{nm}' — use {adr.get('forms', {}).get(v, adr.get('forms', {}).get('default', 'an honorific'))}")
    CALM = {"softly", "warmly", "curious", "serious", "thoughtfully", "pause", "sadly", "gently", "whispers"}   # the narrator is a calm storyteller: no shouting
    EXPRESSIVE = {"reverently", "solemnly", "chanting", "with devotion", "with deep devotion", "slowly", "expressively", "majestically", "with feeling"}   # śloka line only (sloka_unit); the pitch guard still drops shouted takes
    ENERGY = {"excited", "dramatically", "intense", "energetic", "urgently", "with energy"}   # narration_energy test: hook + reveal only
    energy_on = s.get("narration_energy") == "hook_reveal"                               # owner's A/B test (Nov 21 2026); shouting guard still applies
    for sh in s["shots"]:
        if sh.get("voice") != "narrator": continue
        for ui, u in enumerate(sh.get("units") or []):
            ok_tags = CALM | (EXPRESSIVE if ui == sh.get("sloka_unit") else set())   # the opening śloka may be recited with feeling (owner's request)
            if energy_on and (sh["id"] == s["shots"][0]["id"] or sh.get("reveal")): ok_tags = ok_tags | ENERGY
            for tag in re.findall(r"\[([^\]]+)\]", u if isinstance(u, str) else u.get("say", "")):
                if tag.strip().lower() not in ok_tags: probs.append(f"shot {sh['id']}: narrator tag [{tag}] makes him shout; use one of {sorted(ok_tags)}")
    th = s.get("thumbnail") or {}
    if not (th.get("hook") and th.get("line") and th.get("badge")): probs.append("no 'thumbnail' block (hook, stamp, line, badge, frame): every reel ships with a cover")
    if not any(sh.get("cta") for sh in s["shots"]): probs.append("no call-to-action shot (\"cta\": true on the closing line): YouTube needs its 'subscribe' version")
    if not s["shots"][0].get("card"): probs.append("shot 1 has no 'card': the hook must be on screen in the first second, not only in the subtitle")
    for c in s.get("claims", []):
        if not c.get("verified"): probs.append(f"UNVERIFIED claim: {c['claim']} ({c.get('ref')})")
    print(f"{s['reel']} — {s['title']}\n  shots {len(s['shots'])} · est. length {est:.0f}s (target 60-90, up to ~120 when the evidence needs it) · ElevenLabs chars/take {narr}")
    for p in probs: print("  ⚠", p)
    if not probs: print("  ✓ script passes")
    return not probs

def new(series, rid, title):
    sd = os.path.join(HERE, "series", series); rd = os.path.join(sd, "reels", rid)
    if os.path.exists(rd): sys.exit(f"{rd} exists")
    tpl = os.path.join(sd, "reel_template")
    shutil.copytree(tpl, rd)
    p = os.path.join(rd, "src", "script.json"); s = json.load(open(p, encoding="utf-8")); s["reel"] = rid; s["title"] = title
    json.dump(s, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1); print("created", rd)

def draft(reel):
    s = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8")); t = 0.0; shots = []
    for sh in s["shots"]:
        sp = len(re.sub(r"[\s,।?!…]", "", sh["hi"])) / 11.0 if sh.get("voice") else 0.0      # Rudra's dramatic pace ~11 chars/s
        d = round(max(sh.get("min", 0), sh.get("lead", 0.3) + sp + sh.get("tail", 0.3)) * 24) / 24
        shots.append({**{k: sh[k] for k in ("id", "voice", "en", "hi", "card", "label", "scene", "cite", "quote", "sloka", "act", "beat", "link", "units", "cta", "reveal", "art_from") if k in sh}, "start": round(t, 4), "dur": d, "vStart": round(t + sh.get("lead", 0.3), 4), "speech": round(sp, 3), "sent": [0.0]}); t += d
    json.dump({"fps": 24, "shots": shots, "total": round(t, 4), "source_card": s.get("source_card"), "acts": s.get("acts"), "frame": s.get("frame", "tall"), "reel": s["reel"], "draft": True}, open(os.path.join(reel, "src", "timeline.json"), "w"), ensure_ascii=False, indent=1)
    print(f"draft timeline {t:.1f}s")

def sheet(reel):
    s = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8")); ser = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(reel))), "series.json")))
    out = os.path.join(reel, "out"); os.makedirs(out, exist_ok=True); rid = s["reel"]
    L = [f"# {rid} — {s['title']}", "", f"Source: {s.get('source', '')} — {ser['source']['edition']}", f"Status: {s.get('status', '')}", "", "## Claims", ""]
    for c in s.get("claims", []): L.append(f"- {'✅' if c.get('verified') else '⚠️ UNVERIFIED'} {c['claim']} — **{c['ref']}**" + (f"  \n  `{c['quote_sa']}`" if c.get("quote_sa") else ""))
    L += ["", "## Script (Hindi → English)", ""] + [f"{sh['id']}. [{sh.get('voice') or '—'}] {sh['hi']}" + (f"  \n   _{sh['en']}_" if sh.get("en") else "") + (f" ({sh['cite']})" if sh.get("cite") else "") for sh in s["shots"] if sh.get("hi")]
    if s.get("verify_note"): L += ["", "> " + s["verify_note"]]
    open(f"{out}/{rid}_citations.md", "w").write("\n".join(L) + "\n")
    hook = s["shots"][0]["en"]; tags = s.get("hashtags", CHN["hashtags"])
    open(f"{out}/{rid}_caption.txt", "w").write(f"{hook}\n\n{s.get('caption', '') + chr(10) + chr(10) if s.get('caption') else ''}Source: {s.get('source', '')}{'' if 'Critical' in s.get('source', '') else ' (' + ser['source']['edition'].split(';')[0] + ')'}\n\n{' '.join(tags)}\n")
    print("wrote", f"{out}/{rid}_citations.md", f"{out}/{rid}_caption.txt")

def desk_row(reel, preview_id="", poster_id=""):
    """The publishing-desk entry for one reel (captions per platform, citations, master files) -> publish/desk/rows/<ID>.json"""
    s = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8")); ser = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(reel))), "series.json")))
    rid = s["reel"]; tags = " ".join(s.get("hashtags", CHN["hashtags"]))
    hook_hi = s["shots"][0]["hi"]; hook_en = s["shots"][0]["en"]; src = s.get("source", ""); cap = s.get("caption", "")
    refs = "\n".join(f"• {c['claim']} — {c['ref'].split(' — ')[0]}" for c in s.get("claims", []) if c.get("verified"))
    tl = json.load(open(os.path.join(reel, "src", "timeline.json"))); secs = round(tl["total"])
    ask = s.get("comment_prompt", "")                                                            # ends the caption with a question to drive comments
    # English is the main language for every written word (captions, titles, covers); the narration stays Hindi
    ig = f"{hook_en}\n\n{cap}\n\n{ask + chr(10) + chr(10) if ask else ''}📜 Source: {src}\n🎧 {LANG} narration · English subtitles\n\n{CHN['captions']['instagram_follow'].format(instagram=CHN['handles']['instagram']['handle'], name=CHN['name'])}\n\n{tags}"
    yt_title = (s.get("youtube_title") or f"{s['title']} | " + CHN["captions"]["youtube_title_suffix"].format(book=CHN["series"]["book"]))[:100]   # a question title beats a statement
    yt = f"{hook_en}\n\n{cap}\n\n{ask + chr(10) + chr(10) if ask else ''}Source: {src}\nVerses:\n{refs}\n\n{LANG} narration · English subtitles.\n{CHN['captions']['youtube_subscribe'].format(name=CHN['name'])}\n\n{tags} #Shorts"
    row = {"title": s["title"], "series": ser.get("series_name", "").title(), "source": src, "length": f"{secs // 60}:{secs % 60:02d}",
           "captions": {"instagram": ig, "facebook": ig.replace(CHN["handles"]["instagram"]["handle"], CHN["name"]), "youtube_title": yt_title, "youtube_description": yt, **({"first_comment": ask} if ask else {})},
           "claims": [{"claim": c["claim"], "ref": c["ref"]} for c in s.get("claims", [])], "verify_note": s.get("verify_note", ""),
           "masters": {"instagram": {"file": f"{rid}_INSTAGRAM_MASTER.mp4", "spec": "1080×1920 · H.264 CRF 12 · AAC 320k"},
                       "facebook": {"file": f"{rid}_INSTAGRAM_MASTER.mp4", "spec": "1080×1920 · H.264 CRF 12 · AAC 320k"},
                       "youtube": {"file": f"{rid}_YOUTUBE_MASTER.mp4", "spec": "2160×3840 (4K) · H.264 CRF 14 · AAC 384k"}},
           "platforms": {"instagram": {"state": "todo", "url": "", "at": ""}, "youtube": {"state": "todo", "url": "", "at": ""}, "facebook": {"state": "todo", "url": "", "at": ""}},
           "review": {"done": False, "at": ""}}
    if preview_id: row["preview"] = preview_id
    if poster_id: row["poster"] = poster_id
    d = os.path.join(HERE, "publish", "desk", "rows"); os.makedirs(d, exist_ok=True); p = os.path.join(d, rid + ".json")
    json.dump(row, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1); print("desk row", p); return p

def has_yt_cta(reel):
    return any(s.get("audio_youtube") for s in json.load(open(os.path.join(reel, "src", "timeline.json")))["shots"])

def audio(reel):
    """audio/mix.wav (Instagram/Facebook: "follow") and, when the CTA shot has YouTube takes, audio/mix_youtube.wav ("subscribe")."""
    run(["python3", os.path.join(PY, "build_audio.py")], reel)
    if has_yt_cta(reel):
        env = dict(os.environ, REEL=os.path.abspath(reel), VARIANT="youtube"); print("$ VARIANT=youtube build_audio.py", flush=True)
        subprocess.run(["python3", os.path.join(PY, "build_audio.py")], env=env, check=True)

def draft_timeline(reel):
    """An ESTIMATED timeline from script.json (no audio yet): lets a new series preview its art with `stills` before recording voices.
    Replaced by the real one as soon as `pick` runs."""
    s = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8")); shots = []; t = 0.0
    for sh in s["shots"]:
        units = [u if isinstance(u, str) else u.get("say", "") for u in (sh.get("units") or [sh.get("hi", "")])]
        lens = [max(0.8, len(re.sub(r"\[[^\]]*\]|[\s,।?!…॥]", "", u)) / 11.0) for u in units]
        sent, acc = [], 0.0
        for i, L in enumerate(lens): sent.append(round(acc, 3)); acc += L + (sh.get("unit_gap", 0.35) if i < len(lens) - 1 else 0)
        lead, tail = sh.get("lead", 0.25), sh.get("tail", 0.3); dur = max(sh.get("min", 0), lead + acc + tail)
        shots.append({k: sh[k] for k in ("id", "voice", "en", "hi", "card", "label", "scene", "cite", "quote", "sloka", "act", "beat", "link", "units", "cta", "reveal", "art_from") if k in sh} | {"env": [], "sent": sent, "start": round(t, 4), "dur": round(dur, 4), "vStart": round(t + lead, 4), "aStart": round(t + lead, 4), "speech": round(acc, 3)})
        t += dur
    tl = {"fps": 24, "shots": shots, "total": round(t, 4), "source_card": s.get("source_card"), "acts": s.get("acts"), "frame": s.get("frame", "tall"), "reel": s["reel"], "draft": True}
    json.dump(tl, open(os.path.join(reel, "src", "timeline.json"), "w"), ensure_ascii=False); print(f"draft timeline {t:.1f}s (estimated; `pick` writes the real one)")

# ---- resumable renders: a finished piece gets <file>.done holding a stamp of its inputs; a re-run skips it while the stamp matches
def _stamp(reel):
    import hashlib
    h = hashlib.sha1(); ser = os.path.dirname(os.path.dirname(os.path.abspath(reel)))
    files = [os.path.join(reel, "audio", "mix.wav"), os.path.join(reel, "audio", "mix_youtube.wav"), os.path.join(reel, "src", "timeline.json"), os.path.join(reel, "src", "shots.js")]
    for d in (os.path.join(ser, "art"), os.path.join(JS, "..", "art"), JS):
        if os.path.isdir(d): files += sorted(os.path.join(d, f) for f in os.listdir(d) if f.endswith(".js"))
    for f in files:
        if os.path.exists(f): st = os.stat(f); h.update(f"{os.path.basename(f)}:{st.st_size}:{int(st.st_mtime)}".encode())
    return h.hexdigest()[:16]
def _playable(f):   # a video only counts as finished if ffprobe can read its duration (a cut-off encode has no index)
    if not f.endswith((".mp4", ".mkv")): return True
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True)
    return r.returncode == 0 and r.stdout.strip() not in ("", "N/A")
def _done(f, stamp): return os.path.exists(f) and os.path.exists(f + ".done") and open(f + ".done").read().strip() == stamp and _playable(f)
def _mark(f, stamp): open(f + ".done", "w").write(stamp)

CHUNK = 360   # frames per render chunk (15 s): a machine restart loses at most one chunk per worker; finished chunks are skipped on re-run
def _chunks(nf): return [(a, min(nf, a + CHUNK)) for a in range(0, nf, CHUNK)]
def _run_chunks(jobs, stamp, workers=3):
    """jobs: [(out_file, start, end, env, log)] rendered by render.js `range`, `workers` at a time; each finished file is marked done."""
    todo = [j for j in jobs if not _done(j[0], stamp)]; running = []
    while todo or running:
        while todo and len(running) < workers:
            f, a, b, env, log = todo.pop(0)
            running.append((subprocess.Popen(["node", os.path.join(JS, "render.js"), "range", str(a), str(b), f], env=env, stdout=open(log, "w"), stderr=subprocess.STDOUT), f))
        time.sleep(2)
        for pr, f in list(running):
            if pr.poll() is None: continue
            running.remove((pr, f))
            if pr.returncode: [q.kill() for q, _ in running]; sys.exit(f"render chunk failed, see {f}.log")
            _mark(f, stamp)

def render(reel):
    tl = json.load(open(os.path.join(reel, "src", "timeline.json"))); nf = round(tl["total"] * 24)
    out = os.path.join(os.path.abspath(reel), "out"); os.makedirs(out, exist_ok=True)
    env = dict(os.environ, REEL=os.path.abspath(reel))
    if not os.path.exists(os.path.join(reel, "audio", "mix.wav")): audio(reel)
    stamp = _stamp(reel); ch = _chunks(nf)
    rid = json.load(open(os.path.join(reel, "src", "script.json")))["reel"]; final = f"{out}/{rid}_final.mp4"
    if json.load(open(os.path.join(reel, "src", "script.json"))).get("frame") == "wide":   # full-length 16:9: one lossless render -> YouTube 4K master -> preview
        if not _done(final, stamp):
            yt = master(reel)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", yt, "-vf", "scale=1920:1080:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", "4500k", "-bufsize", "9000k",
                            "-g", "48", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", final], check=True); _mark(final, stamp)
        print("FINAL", final); return
    if _done(final, stamp):                                  # preview already made for these exact inputs: go straight to the masters
        master(reel); print("FINAL", final); return
    names = [f"{out}/seg{i:02d}.mp4" for i in range(len(ch))]
    json.dump({"preview": [os.path.basename(n) for n in names], "frames": {os.path.basename(n): b - a for n, (a, b) in zip(names, ch)}}, open(f"{out}/plan.json", "w"))
    _run_chunks([(n, a, b, env, f"{out}/r{i:02d}.log") for i, (n, (a, b)) in enumerate(zip(names, ch))], stamp)
    open(f"{out}/list.txt", "w").write("".join(f"file '{os.path.basename(n)}'\n" for n in names))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", f"{out}/list.txt", "-c", "copy", f"{out}/video.mp4"], check=True)
    rid = json.load(open(os.path.join(reel, "src", "script.json")))["reel"]; final = f"{out}/{rid}_final.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{out}/video.mp4", "-i", os.path.join(reel, "audio", "mix.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-level:v", "4.1", "-crf", "22", "-maxrate", "3000k", "-bufsize", "6000k", "-pix_fmt", "yuv420p", "-g", "48",
                    "-af", "alimiter=limit=0.80:attack=3:release=60:level=disabled", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", "-shortest", final], check=True)
    _mark(final, stamp)
    for n in names:
        for f in (n, n + ".done"):
            if os.path.exists(f): os.remove(f)
    master(reel)
    if (json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8")).get("thumbnail") or {}).get("frame"): thumb(reel)
    else: print("⚠ no thumbnail.frame in script.json: run make_reel.py thumb <reel> <times> to pick one, then make_reel.py thumb <reel>")
    print("FINAL", final)

def thumb(reel, times=None):
    """Cover / thumbnail. With times: render art-only candidates and a contact sheet to choose script.json thumbnail.frame."""
    if times:
        run(["node", os.path.join(JS, "render.js"), "clean", times], reel)
        from PIL import Image, ImageDraw
        fs = sorted(f for f in os.listdir(os.path.join(reel, "frames")) if f.startswith("clean_"))
        sh = Image.new("RGB", (270 * len(fs), 510), "white"); d = ImageDraw.Draw(sh)
        for i, f in enumerate(fs):
            sh.paste(Image.open(os.path.join(reel, "frames", f)).convert("RGB").resize((270, 480)), (i * 270, 0)); d.text((i * 270 + 8, 488), f"{int(f[6:10]) / 24:.1f}s", fill="black")
        p = os.path.join(reel, "frames", "thumb_candidates.jpg"); sh.save(p, quality=90); print("candidates", p); return
    th = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8")).get("thumbnail") or {}
    if not th.get("frame"): sys.exit('set script.json thumbnail.frame first (pick one with: make_reel.py thumb <reel> 3s,20s,40s,...)')
    run(["python3", os.path.join(PY, "thumbnail.py")], reel)

def short(reel):
    """Short cut: re-time the picked takes (shortcut.py), build both short mixes, render lossless (end-card third per platform),
    encode Instagram 1080p + YouTube 4K short masters with the same settings as the full masters."""
    run(["python3", os.path.join(PY, "shortcut.py")], reel)
    for var in ("", "youtube"):
        env = dict(os.environ, REEL=os.path.abspath(reel), SHORT="1", VARIANT=var); print(f"$ SHORT=1 VARIANT={var} build_audio.py", flush=True)
        subprocess.run(["python3", os.path.join(PY, "build_audio.py")], env=env, check=True)
    master(reel, short=True)

def master(reel, short=False):
    """BEST-QUALITY UPLOAD MASTERS (big on purpose; platforms re-encode, so the cleaner the upload the better viewers see):
      1. every frame re-rendered as PNG -> lossless RGB x264 intermediate (no JPEG anywhere)
      2. <ID>_INSTAGRAM_MASTER.mp4  1080x1920, H.264 High, veryslow, CRF 12, tune grain, GOP 1 s, BT.709, AAC 320k/48k
      3. <ID>_YOUTUBE_MASTER.mp4    2160x3840 (Lanczos) so YouTube serves its higher-bitrate VP9/AV1 tier, with the YouTube
                                    call to action (SUBSCRIBE end card + audio/mix_youtube.wav),
                                    H.264 High, slow, CRF 14, tune grain, GOP 0.5 s, BT.709, AAC 384k/48k
    out/<ID>_final.mp4 stays the small preview / WhatsApp copy."""
    out = os.path.join(os.path.abspath(reel), "out"); rid = json.load(open(os.path.join(reel, "src", "script.json")))["reel"]
    tlname = "timeline_short.json" if short else "timeline.json"; sfx = "_short" if short else ""
    tl = json.load(open(os.path.join(reel, "src", tlname))); nf = round(tl["total"] * 24)
    ig0, yt0, stamp0 = f"{out}/{rid}_INSTAGRAM_{'SHORT' if short else 'MASTER'}.mp4", f"{out}/{rid}_YOUTUBE_{'SHORT' if short else 'MASTER'}.mp4", _stamp(reel)
    if _done(ig0, stamp0) and _done(yt0, stamp0): print("MASTER", ig0, "(already done)"); print("MASTER", yt0, "(already done)"); return
    tmp = os.path.join(out, "lossless" + sfx); os.makedirs(tmp, exist_ok=True)
    env = lambda plat: dict(os.environ, REEL=os.path.abspath(reel), LOSSLESS="1", PLATFORM=plat, **({"TIMELINE": tlname} if short else {}))
    # every chunk once (Instagram's FOLLOW end card); the chunks holding the end card again for YouTube (SUBSCRIBE)
    cta = next((s_ for s_ in tl["shots"] if s_.get("cta")), tl["shots"][-1]); cta_f = int(cta["start"] * 24)
    ch = _chunks(nf); stamp = _stamp(reel)
    if json.load(open(os.path.join(reel, "src", "script.json"))).get("frame") == "wide":   # full-length 16:9 is YouTube only: every chunk once (SUBSCRIBE), 3840x2160 master
        names = [f"{tmp}/w{i:02d}.mkv" for i in range(len(ch))]; yt = f"{out}/{rid}_YOUTUBE_MASTER.mp4"
        json.dump({"lossless": [os.path.basename(n) for n in names], "frames": {os.path.basename(n): b_ - a_ for n, (a_, b_) in zip(names, ch)}}, open(f"{tmp}/plan.json", "w"))
        _run_chunks([(n, a_, b_, dict(env("youtube"), LOSSLESS="0"), n[:-4] + ".log") for n, (a_, b_) in zip(names, ch)], stamp)   # CRF 15 chunks: lossless 14 min of 1080p would not fit the disk
        open(f"{tmp}/list.txt", "w").write("".join(f"file '{os.path.basename(n)}'\n" for n in names))
        mix = os.path.join(reel, "audio", "mix_youtube.wav"); mix = mix if os.path.exists(mix) else os.path.join(reel, "audio", "mix.wav")
        if not _done(yt, stamp): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", f"{tmp}/list.txt", "-i", mix, "-map", "0:v", "-map", "1:a",
                        "-vf", "scale=3840:2160:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-tune", "grain", "-profile:v", "high", "-level:v", "5.2",
                        "-g", "48", "-bf", "2", "-af", "alimiter=limit=0.80:attack=3:release=60:level=disabled", "-ar", "48000", "-ac", "2", "-c:a", "aac", "-b:a", "384k",
                        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", "-shortest", yt], check=True)
        _mark(yt, stamp); print("MASTER", yt, f"{os.path.getsize(yt) / 1e6:.0f} MB"); subprocess.run(["rm", "-rf", tmp]); return yt
    ig_names = [f"{tmp}/k{i:02d}.mkv" for i in range(len(ch))]
    yt_names = [f"{tmp}/k{i:02d}_youtube.mkv" if b_ > cta_f else ig_names[i] for i, (a_, b_) in enumerate(ch)]
    jobs = [(n, a_, b_, env("instagram"), n[:-4] + ".log") for n, (a_, b_) in zip(ig_names, ch)]
    jobs += [(n, a_, b_, env("youtube"), n[:-4] + ".log") for n, (a_, b_) in zip(yt_names, ch) if n.endswith("_youtube.mkv")]
    json.dump({"lossless": [os.path.basename(j[0]) for j in jobs], "frames": {os.path.basename(j[0]): j[2] - j[1] for j in jobs}}, open(f"{tmp}/plan.json", "w"))
    _run_chunks(jobs, stamp)
    open(f"{tmp}/list.txt", "w").write("".join(f"file '{os.path.basename(n)}'\n" for n in ig_names))
    open(f"{tmp}/list_youtube.txt", "w").write("".join(f"file '{os.path.basename(n)}'\n" for n in yt_names))
    yt_mix = os.path.join(reel, "audio", f"mix{sfx}_youtube.wav")
    if not os.path.exists(yt_mix): print(f"⚠ no audio/mix{sfx}_youtube.wav (no YouTube CTA takes): the YouTube master says 'follow' in the narration"); yt_mix = os.path.join(reel, "audio", f"mix{sfx}.wav")
    src = ["-f", "concat", "-safe", "0", "-i", f"{tmp}/list.txt", "-i", os.path.join(reel, "audio", f"mix{sfx}.wav"), "-map", "0:v", "-map", "1:a"]
    src_yt = ["-f", "concat", "-safe", "0", "-i", f"{tmp}/list_youtube.txt", "-i", yt_mix, "-map", "0:v", "-map", "1:a"]
    tags = ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", "-shortest"]
    lim = ["-af", "alimiter=limit=0.80:attack=3:release=60:level=disabled", "-ar", "48000", "-ac", "2", "-c:a", "aac"]
    ig = f"{out}/{rid}_INSTAGRAM_{'SHORT' if short else 'MASTER'}.mp4"
    if not _done(ig, stamp): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *src, "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "veryslow", "-crf", "12", "-tune", "grain",
                    "-profile:v", "high", "-level:v", "4.2", "-g", "24", "-keyint_min", "24", "-bf", "2", *lim, "-b:a", "320k", *tags, ig], check=True)
    _mark(ig, stamp)
    yt = f"{out}/{rid}_YOUTUBE_{'SHORT' if short else 'MASTER'}.mp4"
    if not _done(yt, stamp): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *src_yt, "-vf", "scale=2160:3840:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-tune", "grain",
                    "-profile:v", "high", "-level:v", "5.2", "-g", "12", "-keyint_min", "12", "-bf", "2", *lim, "-b:a", "384k", *tags, yt], check=True)
    _mark(yt, stamp)
    for f in (ig, yt): print("MASTER", f, f"{os.path.getsize(f) / 1e6:.0f} MB")
    subprocess.run(["rm", "-rf", tmp])

if __name__ == "__main__":
    if len(sys.argv) < 3: sys.exit(__doc__)
    cmd, reel, rest = sys.argv[1], sys.argv[2], sys.argv[3:]
    if cmd == "new": new(reel, rest[0], rest[1])
    elif cmd == "check": sys.exit(0 if check(reel) else 1)
    elif cmd == "voices": run([CBPY, os.path.join(PY, "cb_generate.py")] + rest, reel)
    elif cmd == "narration": run(["python3", os.path.join(PY, "narration.py")] + (rest or ["list"]), reel)
    elif cmd == "draft": draft(reel)
    elif cmd == "sheet": sheet(reel)
    elif cmd == "master": master(reel)
    elif cmd == "short": short(reel)
    elif cmd == "thumb": thumb(reel, rest[0] if rest else None)
    elif cmd == "desk": desk_row(reel, *(rest + ["", ""])[:2])
    elif cmd == "pick": run(["python3", os.path.join(PY, "build_voice.py")], reel)
    elif cmd == "stills": run(["node", os.path.join(JS, "render.js"), "stills"] + rest, reel)
    elif cmd == "audio": audio(reel)
    elif cmd == "render": render(reel)
    elif cmd == "draft-timeline": draft_timeline(reel)
    elif cmd == "all":
        run(["python3", os.path.join(PY, "narration.py"), "import"], reel); run(["python3", os.path.join(PY, "build_voice.py")], reel)
        audio(reel); render(reel)
    else: sys.exit(__doc__)
