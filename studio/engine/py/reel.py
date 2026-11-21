"""Shared paths + data for one reel. Every engine script does `from reel import *`.

Which reel?  env REEL=<path to reel dir>  (make_reel.py sets it), e.g.
    studio/series/<series>/reels/<ID>
Layout:
    <series>/series.json           series identity (logo, title, tagline, palette, source rules)
    <series>/cast/cast.json        LOCKED voices (engine, reference clip, delivery, fx, mix gain)
    <series>/art/*.js              series art: characters, locations, templates (source/end cards)
    <reel>/src/script.json         the reel: shots, lines, units, timing, citations
    <reel>/src/shots.js            per-shot choreography
    <reel>/src/sound.py            per-reel music + sfx cues (optional, else a default bed)
"""
import json, os, re

REEL = os.path.abspath(os.environ.get("REEL", "."))
SERIES = os.path.dirname(os.path.dirname(REEL))
STUDIO = os.path.dirname(os.path.dirname(SERIES))
ENGINE = os.path.join(STUDIO, "engine")
SRC = os.path.join(REEL, "src")
AUD = os.path.join(REEL, "audio")
for d in ("audio/cb", "audio/narrator", "audio/proc", "audio/raw", "out", "frames"):
    os.makedirs(os.path.join(REEL, d), exist_ok=True)

def jload(p): return json.load(open(p, encoding="utf-8"))
SCRIPT = jload(os.path.join(SRC, "script.json"))
SER = jload(os.path.join(SERIES, "series.json"))
CAST = jload(os.path.join(SERIES, "cast", "cast.json"))["voices"]
FPS = SCRIPT.get("fps", 24)

TAG = re.compile(r"\[[^\]]*\]\s*")
def clean(s): return TAG.sub("", s).strip()

def units(shot):
    """One unit = one generation (whole sentences). A shot may split into several units.
    unit fields: say (text, may carry ElevenLabs [tags]), ex / cfg (Chatterbox overrides).
    Returns [(spoken_text_without_tags, voice, say_with_tags, ex, cfg)]."""
    v = shot.get("voice")
    if not v: return []
    us = shot.get("units") or [{"say": shot["hi"]}]
    out = []
    for u in us:
        u = {"say": u} if isinstance(u, str) else u
        cv = CAST[v]
        out.append((clean(u["say"]), v, u["say"], u.get("ex", cv.get("ex", 0.6)), u.get("cfg", cv.get("cfg", 0.4))))
    return out

def take_path(sid, i, k, ext="wav", sub="cb", var=""): return os.path.join(AUD, sub, f"s{sid:02d}{var}_{i}_t{k}.{ext}")

def cta_units(shot):
    """The YouTube version of a call-to-action shot ("cta": true): same voice and delivery tags, the subscribe line
    (shot "hi_youtube", else series.json cta.youtube.say). Empty for other shots."""
    if not shot.get("cta") or not shot.get("voice"): return []
    line = shot.get("hi_youtube") or SER.get("cta", {}).get("youtube", {}).get("say")
    if not line: return []
    first = units(shot)[0]; tags = re.match(r"^(?:\s*\[[^\]]*\]\s*)*", first[2]).group(0)      # keep the leading delivery [tags]
    v = shot["voice"]; return [(clean(line), v, tags + line, first[3], first[4])]
