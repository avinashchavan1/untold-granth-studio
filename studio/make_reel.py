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
import json, os, re, shutil, subprocess, sys
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
    for sh in s["shots"]:                                   # respect: no bare "राम" from devotees, brothers, wife, friends
        v = sh.get("voice")
        if not v or v in ok: continue
        for u in (sh.get("units") or [sh.get("hi", "")]):
            txt = u if isinstance(u, str) else u.get("say", "")
            if re.search(r"(?<![\u0900-\u097F])(?<!श्री)राम(?![\u0900-\u097F])", txt):
                probs.append(f"shot {sh['id']}: {v} calls Rama by bare name 'राम' — use {adr.get('forms', {}).get(v, adr.get('forms', {}).get('default', 'an honorific'))}")
    CALM = {"softly", "warmly", "curious", "serious", "thoughtfully", "pause", "sadly", "gently", "whispers"}   # the narrator is a calm storyteller: no shouting
    for sh in s["shots"]:
        if sh.get("voice") != "narrator": continue
        for u in sh.get("units") or []:
            for tag in re.findall(r"\[([^\]]+)\]", u if isinstance(u, str) else u.get("say", "")):
                if tag.strip().lower() not in CALM: probs.append(f"shot {sh['id']}: narrator tag [{tag}] makes him shout; use one of {sorted(CALM)}")
    th = s.get("thumbnail") or {}
    if not (th.get("hook") and th.get("line") and th.get("badge")): probs.append("no 'thumbnail' block (hook, stamp, line, badge, frame): every reel ships with a cover")
    if not any(sh.get("cta") for sh in s["shots"]): probs.append("no call-to-action shot (\"cta\": true on the closing line): YouTube needs its 'subscribe' version")
    if not s["shots"][0].get("card"): probs.append("shot 1 has no 'card': the hook must be on screen in the first second, not only in the subtitle")
    for c in s.get("claims", []):
        if not c.get("verified"): probs.append(f"UNVERIFIED claim: {c['claim']} ({c.get('ref')})")
    print(f"{s['reel']} — {s['title']}\n  shots {len(s['shots'])} · est. length {est:.0f}s (target 45-65, hard max ~90) · ElevenLabs chars/take {narr}")
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
        shots.append({**{k: sh[k] for k in ("id", "voice", "en", "hi", "card", "label", "scene", "cite") if k in sh}, "start": round(t, 4), "dur": d, "vStart": round(t + sh.get("lead", 0.3), 4), "speech": round(sp, 3), "sent": [0.0]}); t += d
    json.dump({"fps": 24, "shots": shots, "total": round(t, 4), "source_card": s.get("source_card"), "reel": s["reel"], "draft": True}, open(os.path.join(reel, "src", "timeline.json"), "w"), ensure_ascii=False, indent=1)
    print(f"draft timeline {t:.1f}s")

def sheet(reel):
    s = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8")); ser = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(reel))), "series.json")))
    out = os.path.join(reel, "out"); os.makedirs(out, exist_ok=True); rid = s["reel"]
    L = [f"# {rid} — {s['title']}", "", f"Source: {s.get('source', '')} — {ser['source']['edition']}", f"Status: {s.get('status', '')}", "", "## Claims", ""]
    for c in s.get("claims", []): L.append(f"- {'✅' if c.get('verified') else '⚠️ UNVERIFIED'} {c['claim']} — **{c['ref']}**" + (f"  \n  `{c['quote_sa']}`" if c.get("quote_sa") else ""))
    L += ["", "## Script (Hindi → English)", ""] + [f"{sh['id']}. [{sh.get('voice') or '—'}] {sh['hi']}" + (f"  \n   _{sh['en']}_" if sh.get("en") else "") + (f" ({sh['cite']})" if sh.get("cite") else "") for sh in s["shots"] if sh.get("hi")]
    if s.get("verify_note"): L += ["", "> " + s["verify_note"]]
    open(f"{out}/{rid}_citations.md", "w").write("\n".join(L) + "\n")
    hook = s["shots"][0]["en"]; tags = s.get("hashtags", ["#UntoldGranth", "#Ramayana", "#Valmiki", "#IndianMythology", "#Sanatan", "#UntoldRamayana"])
    open(f"{out}/{rid}_caption.txt", "w").write(f"{hook}\n\n{s.get('caption', '') + chr(10) + chr(10) if s.get('caption') else ''}Source: {s.get('source', '')}{'' if 'Critical' in s.get('source', '') else ' (' + ser['source']['edition'].split(';')[0] + ')'}\n\n{' '.join(tags)}\n")
    print("wrote", f"{out}/{rid}_citations.md", f"{out}/{rid}_caption.txt")

def desk_row(reel, preview_id="", poster_id=""):
    """The publishing-desk entry for one reel (captions per platform, citations, master files) -> publish/desk/rows/<ID>.json"""
    s = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8")); ser = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(reel))), "series.json")))
    rid = s["reel"]; tags = " ".join(s.get("hashtags", ["#UntoldGranth", "#Ramayana", "#Valmiki", "#UntoldRamayana"]))
    hook_hi = s["shots"][0]["hi"]; hook_en = s["shots"][0]["en"]; src = s.get("source", ""); cap = s.get("caption", "")
    refs = "\n".join(f"• {c['claim']} — {c['ref'].split(' — ')[0]}" for c in s.get("claims", []) if c.get("verified"))
    tl = json.load(open(os.path.join(reel, "src", "timeline.json"))); secs = round(tl["total"])
    ask = s.get("comment_prompt", "")                                                            # ends the caption with a question to drive comments
    # English is the main language for every written word (captions, titles, covers); the narration stays Hindi
    ig = f"{hook_en}\n\n{cap}\n\n{ask + chr(10) + chr(10) if ask else ''}📜 Source: {src}\n🎧 Hindi narration · English subtitles\n\nFollow @untoldgranth.official for more untold stories from the original texts.\n\n{tags}"
    yt_title = (s.get("youtube_title") or f"{s['title']} | Valmiki Ramayana #Shorts")[:100]   # a question title beats a statement
    yt = f"{hook_en}\n\n{cap}\n\n{ask + chr(10) + chr(10) if ask else ''}Source: {src}\nVerses:\n{refs}\n\nHindi narration · English subtitles.\nSubscribe to Untold Granth for real stories from the original texts, with the verse on screen.\n\n{tags} #Shorts"
    row = {"title": s["title"], "series": ser.get("series_name", "").title(), "source": src, "length": f"{secs // 60}:{secs % 60:02d}",
           "captions": {"instagram": ig, "facebook": ig.replace("@untoldgranth.official", "Untold Granth"), "youtube_title": yt_title, "youtube_description": yt, **({"first_comment": ask} if ask else {})},
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

def render(reel):
    tl = json.load(open(os.path.join(reel, "src", "timeline.json"))); nf = round(tl["total"] * 24); cuts = [0, nf // 3, 2 * nf // 3, nf]
    out = os.path.join(os.path.abspath(reel), "out"); os.makedirs(out, exist_ok=True)
    env = dict(os.environ, REEL=os.path.abspath(reel))
    ps = [subprocess.Popen(["node", os.path.join(JS, "render.js"), "range", str(cuts[i]), str(cuts[i + 1]), f"{out}/seg{i}.mp4"], env=env, stdout=open(f"{out}/r{i}.log", "w"), stderr=subprocess.STDOUT) for i in range(3)]
    if not os.path.exists(os.path.join(reel, "audio", "mix.wav")): audio(reel)
    for p in ps:
        if p.wait(): sys.exit("render segment failed, see out/r*.log")
    open(f"{out}/list.txt", "w").write("".join(f"file 'seg{i}.mp4'\n" for i in range(3)))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", f"{out}/list.txt", "-c", "copy", f"{out}/video.mp4"], check=True)
    rid = json.load(open(os.path.join(reel, "src", "script.json")))["reel"]; final = f"{out}/{rid}_final.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{out}/video.mp4", "-i", os.path.join(reel, "audio", "mix.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-level:v", "4.1", "-crf", "22", "-maxrate", "3000k", "-bufsize", "6000k", "-pix_fmt", "yuv420p", "-g", "48",
                    "-af", "alimiter=limit=0.80:attack=3:release=60:level=disabled", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", "-shortest", final], check=True)
    for i in range(3): os.remove(f"{out}/seg{i}.mp4")
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
    tl = json.load(open(os.path.join(reel, "src", tlname))); nf = round(tl["total"] * 24); cuts = [0, nf // 3, 2 * nf // 3, nf]
    tmp = os.path.join(out, "lossless" + sfx); os.makedirs(tmp, exist_ok=True)
    env = lambda plat: dict(os.environ, REEL=os.path.abspath(reel), LOSSLESS="1", PLATFORM=plat, **({"TIMELINE": tlname} if short else {}))
    # segments 0-1 are shared; the last third holds the end card, so it is rendered once per platform (FOLLOW / SUBSCRIBE)
    jobs = [(0, "instagram", "seg0"), (1, "instagram", "seg1"), (2, "instagram", "seg2"), (2, "youtube", "seg2_youtube")]
    ps = [subprocess.Popen(["node", os.path.join(JS, "render.js"), "range", str(cuts[i]), str(cuts[i + 1]), f"{tmp}/{name}.mkv"], env=env(plat), stdout=open(f"{tmp}/{name}.log", "w"), stderr=subprocess.STDOUT) for i, plat, name in jobs]
    for p in ps:
        if p.wait(): sys.exit("lossless render failed, see out/lossless/*.log")
    open(f"{tmp}/list.txt", "w").write("file 'seg0.mkv'\nfile 'seg1.mkv'\nfile 'seg2.mkv'\n")
    open(f"{tmp}/list_youtube.txt", "w").write("file 'seg0.mkv'\nfile 'seg1.mkv'\nfile 'seg2_youtube.mkv'\n")
    yt_mix = os.path.join(reel, "audio", f"mix{sfx}_youtube.wav")
    if not os.path.exists(yt_mix): print(f"⚠ no audio/mix{sfx}_youtube.wav (no YouTube CTA takes): the YouTube master says 'follow' in the narration"); yt_mix = os.path.join(reel, "audio", f"mix{sfx}.wav")
    src = ["-f", "concat", "-safe", "0", "-i", f"{tmp}/list.txt", "-i", os.path.join(reel, "audio", f"mix{sfx}.wav"), "-map", "0:v", "-map", "1:a"]
    src_yt = ["-f", "concat", "-safe", "0", "-i", f"{tmp}/list_youtube.txt", "-i", yt_mix, "-map", "0:v", "-map", "1:a"]
    tags = ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", "-shortest"]
    lim = ["-af", "alimiter=limit=0.80:attack=3:release=60:level=disabled", "-ar", "48000", "-ac", "2", "-c:a", "aac"]
    ig = f"{out}/{rid}_INSTAGRAM_{'SHORT' if short else 'MASTER'}.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *src, "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "veryslow", "-crf", "12", "-tune", "grain",
                    "-profile:v", "high", "-level:v", "4.2", "-g", "24", "-keyint_min", "24", "-bf", "2", *lim, "-b:a", "320k", *tags, ig], check=True)
    yt = f"{out}/{rid}_YOUTUBE_{'SHORT' if short else 'MASTER'}.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *src_yt, "-vf", "scale=2160:3840:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-tune", "grain",
                    "-profile:v", "high", "-level:v", "5.2", "-g", "12", "-keyint_min", "12", "-bf", "2", *lim, "-b:a", "384k", *tags, yt], check=True)
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
    elif cmd == "all":
        run(["python3", os.path.join(PY, "narration.py"), "import"], reel); run(["python3", os.path.join(PY, "build_voice.py")], reel)
        audio(reel); render(reel)
    else: sys.exit(__doc__)
