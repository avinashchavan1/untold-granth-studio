#!/usr/bin/env python3
"""Music per act (full-length videos): one ElevenLabs Music piece per act, sized from the real timeline, crossfaded into audio/score.wav.
  python3 engine/py/gen_score_acts.py <reel dir> [gen|join|all]
script.json → acts: [{n, name, music: "<prompt for this act>"}]; shots carry "act". Act 0 (a cold open) shares act 1's piece unless it has its own music.
series.json → score_style is appended to every prompt (symphonic, no harsh hits). Pieces: audio/score_acts/act<N>.mp3 (kept; delete one to redo it).
Then build_audio uses audio/score.wav like any reel's score (score.gain / score.duck in script.json)."""
import json, os, subprocess, sys, urllib.request
reel = os.path.abspath(sys.argv[1]); cmd = sys.argv[2] if len(sys.argv) > 2 else "all"
S = json.load(open(os.path.join(reel, "src", "script.json"), encoding="utf-8")); TL = json.load(open(os.path.join(reel, "src", "timeline.json")))
ser = json.load(open(os.path.join(os.path.dirname(os.path.dirname(reel)), "series.json"), encoding="utf-8")); style = ser.get("score_style", "")
acts = {a["n"]: a for a in S.get("acts", [])}; act_of = {sh["id"]: sh.get("act", 0) for sh in S["shots"]}
spans = {}
for sh in TL["shots"]:
    a = act_of.get(sh["id"], 0); a = a if acts.get(a, {}).get("music") else min([k for k in acts if acts[k].get("music")] or [a])   # acts without music use the first act that has some
    s0, s1 = spans.get(a, (sh["start"], sh["start"] + sh["dur"])); spans[a] = (min(s0, sh["start"]), max(s1, sh["start"] + sh["dur"]))
XF = 4.0; out = os.path.join(reel, "audio", "score_acts"); os.makedirs(out, exist_ok=True)
order = sorted(spans)
if cmd in ("gen", "all"):
    for a in order:
        f = os.path.join(out, f"act{a}.mp3")
        if os.path.exists(f): continue
        L = spans[a][1] - spans[a][0] + XF + 2; ms = int(min(300, max(10, L)) * 1000)
        prompt = acts[a]["music"] + (" " + style if style else "")
        rq = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192", json.dumps({"prompt": prompt, "music_length_ms": ms, "model_id": "music_v1", "force_instrumental": True}).encode(), {"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
        data = urllib.request.urlopen(rq, timeout=900).read(); open(f, "wb").write(data); print(f"act {a}: {ms / 1000:.0f}s ok", flush=True)
if cmd in ("join", "all"):
    # place each piece at its act start; overlap XF seconds and crossfade (equal-power) into the next
    ins, flt = [], []
    for i, a in enumerate(order):
        ins += ["-i", os.path.join(out, f"act{a}.mp3")]
        d = (spans[order[i + 1]][0] - spans[a][0] + XF) if i + 1 < len(order) else (TL["total"] - spans[a][0] + 1)
        flt.append(f"[{i}:a]aresample=48000,atrim=0:{d:.3f},afade=t=in:d={0.5 if i == 0 else XF}:curve=qsin,afade=t=out:st={max(0, d - XF):.3f}:d={XF}:curve=qsin,adelay={int(max(0, spans[a][0] - (XF if i else 0)) * 1000)}|{int(max(0, spans[a][0] - (XF if i else 0)) * 1000)}[a{i}]")
    flt.append("".join(f"[a{i}]" for i in range(len(order))) + f"amix=inputs={len(order)}:normalize=0,atrim=0:{TL['total'] + 0.5:.3f}[o]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(flt), "-map", "[o]", "-ac", "2", os.path.join(reel, "audio", "score.wav")], check=True)
    print("score.wav:", ", ".join(f"act {a} {spans[a][0]:.0f}-{spans[a][1]:.0f}s" for a in order))
