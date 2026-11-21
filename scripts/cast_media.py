#!/usr/bin/env python3
"""Cast & world media: portraits, voice samples, where each character appears, and who chose the look/voice.

  python3 scripts/cast_media.py [studio_dir]

Needs portraits already rendered (studio reels/_cast, see that shots.js) into <series>/cast/portraits/<key>.jpg.
Uploads to storage reel-media/<series>/cast/, writes <series>/cast/looks.json; scripts/sync.py puts it in the characters table.
"""
import glob, json, os, re, subprocess, sys, tempfile, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from channel import C, SID, SUPA, STUDIO, SER, REELS, HF_MASTERS, HANDLES

STUDIO = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "studio")

BASE = SUPA; H = {"apikey": "proxy-injected"}   # key injected by the environment proxy

_M = json.load(open(os.path.join(SER, "series.json"))).get("cast_meta", {})
RIG = _M.get("rig_to_character", {})      # CH key used in shots.js -> character key, e.g. {"bro": "brother"}; default: same key
FN = _M.get("draw_functions", {})         # special draw functions -> character key, e.g. {"drawDragon": "dragon"}
NOTES = _M.get("notes", {})               # character key -> one-line note shown in the app

def up(local, key, ctype):
    rq = urllib.request.Request(f"{BASE}/storage/v1/object/reel-media/{key}", open(local, "rb").read(), {**H, "Content-Type": ctype, "x-upsert": "true"}, method="POST")
    urllib.request.urlopen(rq, timeout=120).read(); return key

def main():
    sj = json.load(open(os.path.join(SER, "series.json"))); cast = json.load(open(os.path.join(SER, "cast", "cast.json")))["voices"]
    stages = json.load(open(os.path.join(SER, "reels", "stages.json")))
    approved = {k for k, v in sj.get("character_looks", {}).items() if v.get("approved_by") == "user"}
    reels = sorted(d for d in os.listdir(os.path.join(SER, "reels")) if re.fullmatch(r"[A-Z]+\d+", d))
    appears, voiced_in = {}, {}
    for code in reels:
        src = os.path.join(SER, "reels", code, "src")
        js = open(os.path.join(src, "shots.js"), errors="ignore").read() if os.path.exists(os.path.join(src, "shots.js")) else ""
        for rk in set(re.findall(r"CH\.(\w+)", js)):
            if rk in RIG or rk in cast or rk in sj.get("character_looks", {}): appears.setdefault(RIG.get(rk, rk), []).append(code)
        for fn, k in FN.items():
            if k and fn + "(" in js: appears.setdefault(k, []).append(code)
        try: s = json.load(open(os.path.join(src, "script.json")))
        except Exception: continue
        for sh in s.get("shots", []):
            v = sh.get("voice")
            if v: voiced_in.setdefault(v, [])
            if v and code not in voiced_in[v]: voiced_in[v].append(code)
    out = {}
    for f in sorted(glob.glob(os.path.join(SER, "cast", "portraits", "*.jpg"))):
        k = os.path.splitext(os.path.basename(f))[0]
        ins = sorted(set(appears.get(k, []) + voiced_in.get(k, [])))
        posted = [c for c in ins if stages.get(c) == "published"]
        chosen = "user" if k in approved else ("seen" if posted else "claude")
        out[k] = {"portrait": up(f, f"{SID}/cast/{k}.jpg", "image/jpeg"), "appears_in": ins, "posted_in": posted, "look_chosen": chosen, "note": NOTES.get(k)}
        print("portrait", k, ins, chosen)
    # voice samples: the first line each voice speaks, from the produced reels (processed take)
    for k in cast:
        for code in voiced_in.get(k, []):
            s = json.load(open(os.path.join(SER, "reels", code, "src", "script.json")))
            sh = next((x for x in s["shots"] if x.get("voice") == k and x.get("hi") and not x.get("cta")), None)
            wav = os.path.join(SER, "reels", code, "audio", "proc", f"s{sh['id']:02d}.wav") if sh else None
            if not wav or not os.path.exists(wav): continue
            mp3 = os.path.join(tempfile.gettempdir(), f"voice_{k}.mp3")
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav, "-t", "14", "-af", "afade=t=out:st=13.4:d=0.6", "-ac", "1", "-b:a", "128k", mp3], check=True)
            out.setdefault(k, {})["voice_sample"] = up(mp3, f"{SID}/cast/voice_{k}.mp3", "audio/mpeg")
            out[k]["voice_line"] = {"reel": code, "shot": sh["id"], "hi": sh["hi"], "en": sh.get("en", "")}
            out[k].setdefault("appears_in", sorted(set(voiced_in.get(k, []))))
            print("voice", k, code, sh["id"]); break
    # voices re-cast on ElevenLabs after their reels were posted: play the new voice (audition on the same line), not the old take
    for k, v in cast.items():
        aud = os.path.join(SER, "cast", "audition", "el_minor", f"{k}.mp3")
        if v.get("previous_chatterbox") and os.path.exists(aud):
            out.setdefault(k, {})["voice_sample"] = up(aud, f"{SID}/cast/voice_{k}.mp3", "audio/mpeg")
            line = out[k].get("voice_line") or {}; out[k]["voice_line"] = {**line, "reel": "new ElevenLabs voice", "note": "posted reels keep the old take"}
            print("voice (new ElevenLabs)", k)
    json.dump(out, open(os.path.join(SER, "cast", "looks.json"), "w"), ensure_ascii=False, indent=1)
    print("wrote cast/looks.json", len(out))

if __name__ == "__main__": main()
