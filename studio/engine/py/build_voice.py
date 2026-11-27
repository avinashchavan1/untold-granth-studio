#!/usr/bin/env python3
"""v3 voices, stage B: pick the cleanest take of every unit (speech-recogniser match + sane length),
finish it lightly, and write audio/proc/sXX.wav + src/timeline.json. No pitch processing at all."""
import json, os, re, subprocess, wave, difflib, warnings
import numpy as np
warnings.filterwarnings("ignore")
from faster_whisper import WhisperModel

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reel import *
ROOT = REEL; SR = 48000; CB = os.path.join(AUD, "cb")
script = SCRIPT
UNITS = {sh["id"]: [(t, v, ex, cfg) for (t, v, say, ex, cfg) in units(sh)] for sh in SCRIPT["shots"]}
SH = {sh["id"]: sh for sh in SCRIPT["shots"]}
GAP = {i: sh["unit_gap"] for i, sh in SH.items() if "unit_gap" in sh}            # pause between units of one shot
GAIN = {i: sh["gain_db"] for i, sh in SH.items() if "gain_db" in sh}             # per-line level trim (dB)
NSENT = {i: sh["sentences"] for i, sh in SH.items() if "sentences" in sh}       # split one take into N sentences
SGAP = {i: sh.get("sentence_gap", 0.3) for i, sh in SH.items()}
FORCE = {(i, int(u)): k for i, sh in SH.items() for u, k in sh.get("force_take", {}).items()}   # take verified word-by-word
FX = {v: c.get("fx", "anull") for v, c in CAST.items()}
POST = {v: c.get("post", []) for v, c in CAST.items()}
ASRCUT = {v: c.get("asr_cut", True) for v, c in CAST.items()}
NOCUT = {(i, int(u)) for i, sh in SH.items() for u in sh.get("no_cut", [])}
NOCUT |= {(i, int(sh["sloka_unit"])) for i, sh in SH.items() if "sloka_unit" in sh}                  # the śloka: ASR can't spell Sanskrit, never cut it
NOCUT |= {(i, j) for i, us in UNITS.items() for j, (txt, v, ex, cfg) in enumerate(us) if re.search(r"[A-Za-z]", re.sub(r"\[[^\]]*\]", "", txt))}   # Latin words (Hinglish: "twist", "facts"): a Hindi ASR drops them, so never ASR-cut such a line
NOCUT |= {(i, u) for i, sh in SH.items() if "quote" in sh for u in range(len(sh.get("units", [])))}   # quote-card lines (Sanskrit/Awadhi)   # units whose last word ASR mishears: keep the whole take (A23 "इकसठ")
TEMPO = 1.0   # never speed up the narrator (user rule)
asr = WhisperModel("small", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^ऀ-ॿ]", "", s).replace("़", "")
def read_wav(p):
    w = wave.open(p); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    return (x.reshape(-1, w.getnchannels()).mean(1) if w.getnchannels() > 1 else x), sr
def write_wav(p, x, sr):
    with wave.open(p, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
def fade(x, sr, fi=0.012, fo=0.12):
    """raised-cosine fade in/out so no line starts or stops with a click or a hard cut"""
    x = x.copy(); a = min(len(x) // 4, int(fi * sr)); b = min(len(x) // 3, int(fo * sr))
    if a: x[:a] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a))
    if b: x[-b:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b))
    return x
def trim(x, sr, thr=0.035):
    """drop leading/trailing silence but keep the word's natural decay (0.3 s tail, owner Nov 2026: never chop a voice)"""
    k = int(0.03 * sr); smv = np.convolve(np.abs(x), np.ones(k) / k, "same"); idx = np.where(smv > thr * smv.max())[0]
    if not len(idx): return x
    tail = np.where(smv > 0.008 * smv.max())[0][-1]
    return fade(x[max(0, idx[0] - int(0.06 * sr)): min(len(x), max(idx[-1] + int(0.12 * sr), tail) + int(0.18 * sr))], sr)
def squeeze(x, sr, maxgap=0.22, thr=0.05):
    """shorten every silence inside a take to at most maxgap seconds"""
    k = int(0.02 * sr); env = np.convolve(np.abs(x), np.ones(k) / k, "same"); q = env < thr * env.max()
    out = []; i = 0; n = len(x); mg = int(maxgap * sr)
    while i < n:
        if q[i]:
            j = i
            while j < n and q[j]: j += 1
            out.append(x[i:j] if j - i <= mg else np.concatenate([x[i:i + mg // 2], x[j - mg // 2:j]])); i = j
        else:
            j = i
            while j < n and not q[j]: j += 1
            out.append(x[i:j]); i = j
    return np.concatenate(out)
def heard(x, sr):
    a = np.interp(np.arange(0, len(x), sr / 16000), np.arange(len(x)), x).astype(np.float32)
    segs, _ = asr.transcribe(a, language="hi", beam_size=5); return " ".join(s.text.strip() for s in segs)
def cut_to_line(x, sr, txt):
    """keep only the spoken line: cut right after the word where the transcript best matches the script (drops babble after it)"""
    a = np.interp(np.arange(0, len(x), sr / 16000), np.arange(len(x)), x).astype(np.float32)
    segs, _ = asr.transcribe(a, language="hi", beam_size=5, word_timestamps=True)
    words = [w for sg in segs for w in (sg.words or [])]
    if not words: return x, "", 0.0
    best = (-1, 0)
    for j in range(1, len(words) + 1):
        r = difflib.SequenceMatcher(None, norm(txt), norm("".join(w.word for w in words[:j]))).ratio()
        if r > best[0] + 1e-6: best = (r, j)
    r, j = best
    if j == len(words): return x, " ".join(w.word.strip() for w in words), r      # nothing extra after the line: never cut real speech
    if r < 0.8 or words[-1].end - words[j].start < 0.6:                            # unsure, or only a word's worth "extra" (ASR misheard the end): keep it all
        return x, " ".join(w.word.strip() for w in words), r
    end = min(len(x), int(max(words[j - 1].end + 0.14, words[j].start - 0.05) * sr))   # cut just before the first babbled word
    return trim(x[:end], sr), " ".join(w.word.strip() for w in words[:j]), r
def pitch(x, sr):
    """median voiced f0 (Hz) by autocorrelation: catches a take where the voice jumps into a shout"""
    f = []; n = int(0.064 * sr)
    for i in range(0, len(x) - n, n // 2):
        fr = x[i:i + n]
        if np.sqrt(np.mean(fr ** 2)) < 0.03: continue
        cc = np.correlate(fr, fr, "full")[n - 1:]; lo, hi = sr // 350, sr // 65; f.append(sr / (lo + np.argmax(cc[lo:hi])))
    return float(np.median(f)) if f else 0.0
F0 = {v: (c.get("f0_hz"), c.get("f0_max_rise", 40)) for v, c in CAST.items()}
def pauses(x, sr, n):
    """start times of n sentences inside one take, from its n-1 longest silences"""
    k = int(0.02 * sr); smv = np.convolve(np.abs(x), np.ones(k) / k, "same"); q = smv < 0.06 * smv.max(); runs = []; a = -1
    for i in range(0, len(q), 64):
        if q[i] and a < 0: a = i
        if (not q[i]) and a >= 0:
            if a > 0.3 * sr and i - a > 0.12 * sr: runs.append((a, i))
            a = -1
    runs.sort(key=lambda r: -(r[1] - r[0])); return [0.0] + [r[1] / sr for r in sorted(runs[: n - 1])]

def voice_track(sid, s, ulist, var=""):
    """Pick + finish the takes of one shot (var "y" = the YouTube call-to-action takes s<ID>y_*). Returns (timeline fields, speech length)."""
    if not ulist: return {}, 0.0
    vn = s["voice"]; parts = []; starts = []; pos = 0.0; sr0 = 24000
    for i, (txt, v, ex, cfg) in enumerate(ulist):
        cands = []
        for k in range(1, 13):
            p = os.path.join(CB, f"s{sid:02d}{var}_{i}_t{k}.wav")
            if not os.path.exists(p): continue
            x, sr0 = read_wav(p); x = trim(x, sr0)
            x, h, sim = cut_to_line(x, sr0, txt) if ASRCUT[v] and (sid, i) not in NOCUT else (x, heard(x, sr0), None)
            if sim is None: sim = difflib.SequenceMatcher(None, norm(txt), norm(h)).ratio()
            SLK = {(i2, int(sh2["sloka_unit"])) for i2, sh2 in SH.items() if "sloka_unit" in sh2}
            if not NSENT.get(sid) and (sid, i) not in SLK: x = squeeze(x, sr0, 0.32 if len(ulist) == 1 else 0.30)   # keep natural breaths; the śloka keeps its own pauses
            cands.append(dict(k=k, x=x, dur=len(x) / sr0, h=h, sim=sim, f0=pitch(x, sr0)))
        cands_all = list(cands)
        ref, rise = F0.get(v, (None, 40))
        if ref and cands:                              # drop shouted takes (pitch far above the voice's normal range)
            calm = [c for c in cands if c["f0"] <= ref + rise]
            if calm: cands = calm
            else: log.append(f"⚠ s{sid:02d}{var}_{i}: every take is above {ref + rise} Hz (shouting?) — regenerate with a calmer tag")
        nch = len(re.sub(r"[\s,।?!]", "", txt)); exp = nch / 14.5 + (0.45 * (NSENT.get(sid, 1) - 1))   # expected length at a natural pace
        if ASRCUT[v]:
            keep = [c for c in cands if c["dur"] <= 1.45 * exp + 0.25]       # drop runaway / rambling takes
            cands = keep or sorted(cands, key=lambda c: c["dur"])[:1]
        med = np.median([c["dur"] for c in cands]); top = max(c["sim"] for c in cands)
        ok = [c for c in cands if c["sim"] >= top - 0.06 and c["dur"] >= 0.55 * med] or cands
        best = min(ok, key=lambda c: c["dur"] - 5.0 * c["sim"])
        if (sid, i) in FORCE and not var: best = next(c for c in cands_all if c["k"] == FORCE[(sid, i)])   # take verified word-by-word          # tightest of the clean takes
        log.append(f"s{sid:02d}{var}_{i} [{vn}] pick take {best['k']} sim {best['sim']:.2f} {best['dur']:.2f}s | " + " ; ".join(f"t{c['k']}:{c['sim']:.2f}/{c['dur']:.1f}s/{c['f0']:.0f}Hz" for c in cands) + f"\n      said : {txt}\n      heard: {best['h']}")
        x = best["x"]; x = x / (np.sqrt(np.mean(x[np.abs(x) > 0.02 * np.abs(x).max()] ** 2)) + 1e-9) * 0.12
        if NSENT.get(sid):
            st0 = pauses(x, sr0, NSENT[sid]); cut = [0] + [max(0, int(q * sr0) - int(0.04 * sr0)) for q in st0[1:]] + [len(x)]
            segs = [trim(x[cut[j]:cut[j + 1]], sr0) for j in range(len(cut) - 1)]; segs = [squeeze(g, sr0, 0.2) for g in segs]
            gap = SGAP[sid]; starts = []; acc = 0.0; parts2 = []
            for j, g in enumerate(segs):
                starts.append(acc); parts2.append(g); acc += len(g) / sr0
                if j < len(segs) - 1: parts2.append(np.zeros(int(gap * sr0))); acc += gap
            x = np.concatenate(parts2)
        else: starts.append(pos)
        parts.append(x); pos += len(x) / sr0
        if i < len(ulist) - 1: g = GAP.get(sid, 0.34); parts.append(np.zeros(int(g * sr0))); pos += g
    dry = np.concatenate(parts) * 10 ** (GAIN.get(sid, 0) / 20); pk = np.abs(dry).max()
    if pk > 0.95: dry = np.tanh(dry / pk * 1.5) / np.tanh(1.5) * 0.95
    if "demon_shadow" in POST[vn]:   # faint octave-down demon shadow under Rama's voice (locked treatment, cast.json)
        sh_in = os.path.join(ROOT, "audio/raw/_sh_in.wav"); sh_out = os.path.join(ROOT, "audio/raw/_sh_out.wav"); write_wav(sh_in, dry, sr0)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", sh_in, "-af", f"asetrate={sr0}*0.62,aresample={sr0},atempo=1.6129,lowpass=f=1800", sh_out], check=True)
        y, _ = read_wav(sh_out); y = np.pad(y[:len(dry)], (0, max(0, len(dry) - len(y)))); dry = dry + 0.45 * y
        pk = np.abs(dry).max(); dry = dry / pk * 0.9 if pk > 0.95 else dry
    tmp = os.path.join(ROOT, f"audio/raw/s{sid:02d}{var}_dry.wav"); proc = os.path.join(ROOT, f"audio/proc/s{sid:02d}{var}.wav"); write_wav(tmp, dry, sr0)
    tempo = TEMPO if vn == "narrator" else 1.0; fx = (f"atempo={tempo}," if tempo != 1.0 else "") + FX[vn]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-af", fx, "-ar", str(SR), "-ac", "1", proc], check=True)
    x, sr = read_wav(proc); k = int(0.02 * sr); smv = np.convolve(np.abs(x), np.ones(k) / k, "same"); a = max(0, np.where(smv > 0.04 * smv.max())[0][0] - int(0.02 * sr)); x = x[a:]
    stretch = 1 / tempo
    speech = min(len(x) / sr, len(dry) / sr0 * stretch + 0.06)
    hop = sr // FPS; rms = np.array([np.sqrt((x[j:j + hop] ** 2).mean()) for j in range(0, len(x), hop)]); rms = np.clip(rms / (np.percentile(rms, 95) + 1e-6), 0, 1)
    out = {"env": [round(float(v), 3) for v in rms], "sent": [round(q * stretch, 3) for q in starts]}
    write_wav(proc, x, sr); out.update(audio=f"audio/proc/s{sid:02d}{var}.wav", audioLen=round(len(x) / sr, 3))
    return out, speech

timeline = {"fps": FPS, "shots": []}; t = 0.0; log = []
for s in script["shots"]:
    sid = s["id"]; entry = {"id": sid, "voice": s["voice"], "en": s["en"], "hi": s["hi"], **{k: s[k] for k in ("card", "label", "scene", "cite", "quote", "sloka", "act", "beat", "link", "units", "cta", "reveal", "art_from", "proof") if k in s}}; speech = 0.0
    if s["voice"]:
        tr, speech = voice_track(sid, s, UNITS[sid]); entry.update(tr)
        if s.get("cta"):                 # YouTube says "subscribe" instead of "follow": second set of takes, same shot length
            yu = [(t, v, ex, cfg) for (t, v, say, ex, cfg) in cta_units(s)]
            if yu and any(f.startswith(f"s{sid:02d}y_") for f in os.listdir(CB)):
                ty, sy = voice_track(sid, s, yu, "y"); entry["audio_youtube"] = ty["audio"]; speech = max(speech, sy)
            else: log.append(f"s{sid:02d} cta: no YouTube takes (s{sid:02d}y_*) yet: run make_reel.py narration <reel> api, then import")
    lead = s.get("lead", 0.3); tail = s.get("tail", 0.3); dur = max(s.get("min", 0), lead + speech + tail); dur = round(np.ceil(dur * FPS) / FPS, 4)
    entry.update(start=round(t, 4), dur=dur, vStart=round(t + lead, 4), aStart=round(t + lead, 4), speech=round(speech, 3)); timeline["shots"].append(entry); t += dur
timeline["total"] = round(t, 4); timeline["source_card"] = SCRIPT.get("source_card"); timeline["acts"] = SCRIPT.get("acts"); timeline["frame"] = SCRIPT.get("frame", "tall"); timeline["reel"] = SCRIPT["reel"]
json.dump(timeline, open(os.path.join(ROOT, "src/timeline.json"), "w"), ensure_ascii=False, indent=1)
open(os.path.join(ROOT, "audio/pick_log.txt"), "w").write("\n".join(log))
print("\n".join(log))
for e in timeline["shots"]: print(f"s{e['id']:02d} start {e['start']:6.2f} dur {e['dur']:5.2f} speech {e['speech']:5.2f} sent {e.get('sent')}")
print("TOTAL", timeline["total"])
