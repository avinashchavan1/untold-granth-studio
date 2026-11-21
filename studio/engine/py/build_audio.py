#!/usr/bin/env python3
"""Score + sound design + voice mix for any reel. Everything is synthesised (no samples, no licences).
This file is the LIBRARY (instruments, sfx, ducking, loudness). The reel's own cues live in
<reel>/src/sound.py and are exec'd here with all of these names available:
  st(id) shot start · S[id] shot timing (vStart, speech, sent) · E total length · SA tonic (D)
  place(buf, sig, start, gain, pan) · music / sfx buffers · auto(curve, t1, t2, v1, v2) · default_bed()
  tanpura · bansuri · dayan/bayan (tabla) · taiko · choir · strings · whoosh · step · crickets · bandnoise · hit()"""
import json, os, wave, subprocess
import numpy as np

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reel import REEL as ROOT, CAST
SR = 48000
SHORT = os.environ.get("SHORT") == "1"          # the short cut (src/timeline_short.json) -> audio/mix_short*.wav
TL = json.load(open(os.path.join(ROOT, "src/timeline_short.json" if SHORT else "src/timeline.json")))
VARIANT = os.environ.get("VARIANT", "")          # "youtube": the subscribe call to action -> audio/mix_youtube.wav
SUFFIX = ("_short" if SHORT else "") + ("_youtube" if VARIANT == "youtube" else "")
FPS = TL["fps"]; TOTAL = TL["total"]; N = int((TOTAL + 0.6) * SR)
S = {s["id"]: s for s in TL["shots"]}
st = lambda i: S[i]["start"]
rg = np.random.default_rng(7)
SA = 146.83  # D

def boxavg(x, k):
    """moving average, same output as np.convolve(x, np.ones(k) / k, "same") but O(n) via a running sum"""
    k = max(1, int(k)); c = np.concatenate([[0.0], np.cumsum(x, dtype=np.float64)]); n = len(x); lo = k // 2
    i = np.arange(n); a = np.clip(i - lo, 0, n); b = np.clip(i - lo + k, 0, n)
    return (c[b] - c[a]) / k
def buf(): return np.zeros((N, 2), dtype=np.float64)
def place(b, sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[: N - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    b[i:i + len(sig), 0] += sig * gain * l * 1.414; b[i:i + len(sig), 1] += sig * gain * r * 1.414
def tt(d): return np.arange(int(d * SR)) / SR
def env_ad(d, a=0.01, r=0.1):
    t = tt(d); e = np.minimum(1, t / max(a, 1e-4)) * np.minimum(1, (d - t) / max(r, 1e-4)); return np.clip(e, 0, 1)
def bandnoise(d, lo, hi, seed=None):
    n = int(d * SR); x = (np.random.default_rng(seed) if seed is not None else rg).standard_normal(n)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); m = np.exp(-0.5 * ((np.log(np.maximum(f, 1)) - np.log(np.sqrt(lo * hi))) / (np.log(hi / lo) / 2.2)) ** 2)
    y = np.fft.irfft(X * m, n); return y / (np.abs(y).max() + 1e-9)
def sentence_starts(s, n):
    if len(s.get("sent", [])) >= n: return [s["vStart"] - s["start"] + x for x in s["sent"][:n]]
    lead = s["vStart"] - s["start"]; env = s.get("env", []); runs = []; a = -1
    for i, v in enumerate(env):
        q = v < 0.09
        if q and a < 0: a = i
        if (not q) and a >= 0:
            if a > 4 and i - a >= 3 and i < s["speech"] * FPS: runs.append((a, i))
            a = -1
    runs.sort(key=lambda r: -(r[1] - r[0])); picks = sorted(runs[: n - 1]); out = [lead] + [lead + r[1] / FPS for r in picks]
    while len(out) < n: out.append(lead + s["speech"] * len(out) / n)
    return out

# ---------------- instruments ----------------
def tanpura(f, d=3.2):
    t = tt(d); y = np.zeros_like(t)
    for n in range(1, 26):
        a = 1 / n ** 0.75 * (1 + 0.7 * np.sin(2 * np.pi * (0.35 + 0.06 * n) * t + n * 1.3))  # jawari shimmer
        y += a * np.exp(-t * (0.45 + 0.085 * n)) * np.sin(2 * np.pi * f * n * (1 + 0.0004 * n) * t + n)
    return y * np.minimum(1, t / 0.012) / 4.5
def bansuri(notes, breath=0.05):
    """notes: [(start, dur, ratio)] relative, Sa = 2*SA. Legato with glides + vibrato."""
    end = max(s + d for s, d, _ in notes) + 0.6; t = tt(end); f = np.zeros_like(t); amp = np.zeros_like(t)
    for s, d, r in notes:
        i0, i1 = int(s * SR), int((s + d) * SR); f[i0:] = 2 * SA * r
        e = np.minimum(1, (t[i0:i1] - s) / 0.09) * np.minimum(1, (s + d - t[i0:i1]) / 0.16); amp[i0:i1] = np.maximum(amp[i0:i1], e)
    f[f == 0] = 2 * SA
    k = int(0.05 * SR); ker = np.hanning(k); ker /= ker.sum(); f = np.convolve(f, ker, "same"); amp = np.convolve(amp, ker, "same")
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.clip(boxavg(amp, int(0.3 * SR)), 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    y = np.sin(ph) + 0.33 * np.sin(2 * ph + 0.4) + 0.1 * np.sin(3 * ph) + 0.04 * np.sin(4 * ph)
    y += breath * 6 * bandnoise(end, 1500, 7000, 3)[: len(t)] * (0.6 + 0.4 * amp)
    return y * amp * 0.5
def dayan(kind):
    d = {"na": 0.32, "ti": 0.07, "tun": 0.5}[kind]; t = tt(d); f = 2 * SA
    y = np.sin(2 * np.pi * f * t) * (0.5 if kind == "na" else 1.0) + 0.7 * np.sin(2 * np.pi * f * 2.02 * t) + (0.6 if kind != "tun" else 0.1) * np.sin(2 * np.pi * f * 3.01 * t)
    y += 0.5 * bandnoise(d, 2000, 8000) * np.exp(-t * 90)
    return y * np.exp(-t * (14 if kind == "na" else 60 if kind == "ti" else 7)) * 0.4
def bayan(d=0.4, f0=98, f1=64):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 14); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * np.minimum(1, t / 0.004)
def taiko(d=1.6, f0=70, f1=38, noise=0.5):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 9); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    y += noise * bandnoise(d, 60, 900) * np.exp(-t * 16) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2.02) / SR) * np.exp(-t * 8)
    return y * np.minimum(1, t / 0.003)
def choir(d, ratios, a=0.4, r=1.2, base=SA):
    t = tt(d); y = np.zeros_like(t)
    for q, ra in enumerate(ratios):
        f = base * ra
        for n in range(1, 13):
            fr = f * n; form = np.exp(-0.5 * ((fr - 700) / 260) ** 2) + 0.6 * np.exp(-0.5 * ((fr - 1150) / 300) ** 2) + 0.25 * np.exp(-0.5 * ((fr - 2700) / 500) ** 2) + 0.08
            y += form / n ** 0.3 * np.sin(2 * np.pi * fr * t * (1 + 0.003 * np.sin(2 * np.pi * (4.6 + q * 0.4) * t + q)) + q * n)
    return y / (np.abs(y).max() + 1e-9) * env_ad(d, a, r)
def strings(d, ratios, a=1.5, r=1.5, base=SA / 2, trem=0.0):
    t = tt(d); y = np.zeros_like(t)
    for q, ra in enumerate(ratios):
        for det in (-0.004, 0.0, 0.005):
            f = base * ra * (1 + det)
            for n in range(1, 11): y += np.sin(2 * np.pi * f * n * t + q + n * det * 900) / n ** 1.15
    y /= np.abs(y).max() + 1e-9
    if trem: y *= 1 - trem * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t))
    return y * env_ad(d, a, r)
def whoosh(d, lo0, hi0, lo1, hi1, seed=1):
    n = int(d * SR); x = np.random.default_rng(seed).standard_normal(n); out = np.zeros(n); hop = 2048
    for i in range(0, n - hop, hop // 2):
        p = i / n; lo = lo0 * (lo1 / lo0) ** p; hi = hi0 * (hi1 / hi0) ** p
        seg = x[i:i + hop] * np.hanning(hop); X = np.fft.rfft(seg); f = np.fft.rfftfreq(hop, 1 / SR); X[(f < lo) | (f > hi)] = 0; out[i:i + hop] += np.fft.irfft(X, hop)
    return out / (np.abs(out).max() + 1e-9)
def step(heavy=1.0, seed=0):
    d = 0.16; t = tt(d); return (bandnoise(d, 70, 500, seed) * np.exp(-t * 34) + 0.5 * bandnoise(d, 1200, 5000, seed + 1) * np.exp(-t * 70)) * heavy
def crickets(d, seed=0):
    t = tt(d); r = np.random.default_rng(seed); y = np.zeros_like(t)
    for k in range(3):
        f = 4100 + k * 520 + r.uniform(-80, 80); rate = 0.55 + 0.13 * k; ph = r.uniform(0, 1)
        gate = ((t * rate + ph) % 1 < 0.42).astype(float) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (34 + 3 * k) * t)))
        gate = np.convolve(gate, np.ones(80) / 80, "same"); y += np.sin(2 * np.pi * f * t) * gate * (0.6 - 0.15 * k)
    return y * 0.2

music, sfx, voice = buf(), buf(), buf()
E = TOTAL


music, sfx, voice = buf(), buf(), buf()
E = TOTAL
tA = np.arange(N) / SR
def auto(a, t1, t2, v1, v2):
    m = (tA >= t1) & (tA < t2); a[m] = v1 + (v2 - v1) * (tA[m] - t1) / max(t2 - t1, 1e-6)
def hit(t, g, ch=None):
    place(music, taiko(), t, 0.95 * g); place(music, taiko(1.2, 110, 55, 0.8), t + 0.004, 0.4 * g, 0.3)
    if ch: place(music, choir(2.4, ch, a=0.03, r=2.0), t, 0.26 * g)
def night(a, b, g, seed):
    place(sfx, crickets(b - a, seed) * env_ad(b - a, 0.4, 0.4), a, g, 0.0); place(sfx, crickets(b - a, seed + 5) * env_ad(b - a, 0.4, 0.4), a, g * 0.7, 0.6)
    place(sfx, whoosh(b - a, 120, 500, 160, 600, seed) * env_ad(b - a, 0.8, 0.8), a, 0.06)
def default_bed():
    """safe fallback score: tanpura drone all through, a bansuri phrase after the source card, warm strings on the end card"""
    seq = [0.75, 1.0, 1.0, 0.5]; t0 = 0.0; k = 0
    while t0 < E: place(music, tanpura(SA * seq[k % 4]), t0, 0.5, (-0.35, 0.2, -0.1, 0.3)[k % 4]); t0 += 0.86; k += 1
    ids = sorted(S)
    if len(ids) > 2: place(music, bansuri([(0, 1.0, 1.5), (1.0, 0.5, 5 / 3), (1.5, 1.6, 1.5), (3.3, 0.5, 6 / 5), (3.8, 1.5, 1)]), st(ids[1]) + 0.3, 0.30, -0.2)
    place(music, strings(E - st(ids[-1]) + 0.4, [1, 1.25, 1.5, 2], a=1.0, r=1.6), st(ids[-1]), 0.15)

cue = os.path.join(ROOT, "src", "sound.py")
if os.path.exists(cue): exec(open(cue, encoding="utf-8").read())
else: default_bed()

# ---------------- composed score (ElevenLabs Music): audio/score.mp3|wav replaces the synthesized music ----------------
# Same loudness as the synthesized bed the mix was tuned for; still ducked under every line; sfx (sound.py) stay.
for _f in ("score.wav", "score.mp3"):
    _p = os.path.join(ROOT, "audio", _f)
    if not os.path.exists(_p): continue
    _off = float(json.load(open(os.path.join(ROOT, "src", "script.json"), encoding="utf-8")).get("score", {}).get("offset_s", 0))   # skip a quiet intro
    _raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", str(_off), "-i", _p, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    _sc = np.frombuffer(_raw, dtype=np.float32).astype(np.float64).reshape(-1, 2)
    _L = min(len(_sc), N); _sc = np.concatenate([_sc[:_L], np.zeros((N - _L, 2))]); _sc[: int(0.25 * SR)] *= np.linspace(0, 1, int(0.25 * SR))[:, None]
    _ref = np.sqrt(np.mean(music ** 2)); _ref = _ref if _ref > 1e-5 else 0.05
    _sc = _sc / (np.sqrt(np.mean(_sc[: min(_L, int(TOTAL * SR))] ** 2)) + 1e-9) * _ref * float(json.load(open(os.path.join(ROOT, "src", "script.json"), encoding="utf-8")).get("score", {}).get("gain", 1.0))
    if _L < N:   # score shorter than the reel: crossfade (2 s) into the synthesized bed so the end card is never silent
        _x = max(0, _L - 2 * SR); _w = np.ones(N); _w[_x:_L] = np.linspace(1, 0, _L - _x); _w[_L:] = 0
        _sc = _sc * _w[:, None] + music * (1 - _w)[:, None]
        print(f"score ends at {_L / SR:.1f}s of {N / SR:.1f}s: crossfaded into the synthesized bed")
    music = _sc
    print("score:", _f, f"{len(_raw) / 8 / SR:.1f}s, level matched to the synthesized bed"); break

# ---------------- voices ----------------
def rd(p):
    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768; return x
VG = {v: c.get("mix_gain", 1.0) for v, c in CAST.items()}
for s in TL["shots"]:
    if not s.get("audio"): continue
    x = rd(os.path.join(ROOT, s.get("audio_youtube") if VARIANT == "youtube" and s.get("audio_youtube") else s["audio"])); x = x / (np.sqrt(np.mean(x[np.abs(x) > 0.02] ** 2)) + 1e-9) * 0.16 * VG[s["voice"]]
    place(voice, x, s.get("aStart", s["vStart"]), 1.0, 0.0)
    if "forest_echo" in CAST[s["voice"]].get("post", []):   # the cry rolls through the forest
        ex5 = x * env_ad(len(x) / SR + 1e-6, 0.01, 0.5)[:len(x)]; place(sfx, ex5, s["vStart"] + 1.05, 0.28, -0.7); place(sfx, ex5, s["vStart"] + 1.9, 0.15, 0.7)

# ---------------- mix: duck music under speech ----------------
ve = np.abs(voice).max(1); k = int(0.06 * SR); ve = boxavg(ve, k)
k2 = int(0.35 * SR); ve = np.maximum(ve, boxavg(ve, k2) * 1.5); ve = np.clip(ve / 0.08, 0, 1)
ve = np.concatenate([ve[int(0.15 * SR):], np.zeros(int(0.15 * SR))])   # look-ahead: music dips just before a line starts
DUCK = float(json.load(open(os.path.join(ROOT, "src", "script.json"), encoding="utf-8")).get("score", {}).get("duck", 0.86))   # how far music dips under speech (owner: music may sit higher)
duck = 1 - DUCK * ve; duck = boxavg(duck, int(0.08 * SR))
mix = voice * 1.0 + music * 0.20 * duck[:, None] + sfx * 0.85 * (1 - 0.55 * (1 - duck))[:, None]
act = ve > 0.5; gap = ve < 0.05
rms = lambda x, m: 20 * np.log10(np.sqrt(np.mean(x[m] ** 2)) + 1e-9)
MG = music * 0.20 * duck[:, None]; SG = sfx * 0.85 * (1 - 0.55 * (1 - duck))[:, None]
print("voice(active) %.1f dB | music under speech %.1f dB | music in gaps %.1f dB | sfx under speech %.1f dB | sfx in gaps %.1f dB" % (rms(voice, act), rms(MG, act), rms(MG, gap), rms(SG, act), rms(SG, gap)))
fo = np.clip((E + 0.25 - tA) / 0.5, 0, 1); mix *= fo[:, None]
mix = np.tanh(mix * 1.6) / 1.6
mix = mix[: int((E + 0.02) * SR)]
out = os.path.join(ROOT, f"audio/mix_raw{SUFFIX}.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix / (np.abs(mix).max() + 1e-9) * 0.9, -1, 1) * 32767).astype(np.int16).tobytes())
# two-pass loudness normalisation to -14 LUFS
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", out, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(r[r.rindex("{"): r.rindex("}") + 1])
final = os.path.join(ROOT, f"audio/mix{SUFFIX}.wav")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, "-af", f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true", "-ar", "48000", final], check=True)
print("raw loudness", j["input_i"], "LUFS ->", final)
