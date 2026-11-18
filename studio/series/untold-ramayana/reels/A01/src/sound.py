# Reel A01 sound cues — exec'd inside engine/py/build_audio.py (see its docstring for available names)
# ---- tanpura drone (bed) ----
seq = [0.75, 1.0, 1.0, 0.5]; t0 = 0.0; k = 0
tan = buf()
while t0 < E:
    place(tan, tanpura(SA * seq[k % 4]), t0, 0.5, (-0.35, 0.2, -0.1, 0.3)[k % 4]); t0 += 0.86; k += 1
# drone automation: thin in the chase, near-silent in the eerie shot, out under the fire, back for the end
ta = np.ones(N); auto(ta, 0, 0.6, 0, 0.9); auto(ta, st(3), st(3) + 0.3, 1, 0.55); auto(ta, st(3) + 0.3, st(6), 0.55, 0.55); auto(ta, st(6), st(6) + 0.5, 0.55, 1)
auto(ta, st(14) + 0.3, st(14) + 1.2, 1, 0.06); auto(ta, st(14) + 1.2, st(15), 0.06, 0.06); auto(ta, st(15), st(15) + 0.8, 0.06, 0.7); auto(ta, st(15) + 0.8, st(16), 0.7, 0.7)
auto(ta, st(16), st(16) + 0.8, 0.7, 0.0); auto(ta, st(16) + 0.8, st(17), 0, 0); auto(ta, st(17), st(17) + 1.2, 0, 0.8); auto(ta, st(17) + 1.2, st(18), 0.8, 0.8); auto(ta, st(18), st(18) + 0.5, 0.8, 1)
music += tan * ta[:, None]

# ---- bansuri phrases (Shivaranjani colour: S R g P D) ----
R_, g_, P_, D_ = 9 / 8, 6 / 5, 3 / 2, 5 / 3
place(music, bansuri([(0, 1.1, P_ / 2 * 2 / 2), (1.1, 0.5, D_ / 2), (1.6, 1.6, P_ / 2), (3.4, 0.5, g_ / 1), (3.9, 0.45, R_), (4.35, 1.4, 1)]), st(2) + 0.3, 0.30, -0.2)
place(music, bansuri([(0, 0.9, P_), (0.9, 0.35, D_), (1.25, 1.2, P_), (2.6, 0.5, g_), (3.1, 0.4, R_), (3.5, 1.4, g_), (5.1, 0.5, R_), (5.6, 1.8, 1)]), st(7) + 0.2, 0.34, 0.25)
place(music, bansuri([(0, 1.0, g_), (1.0, 0.5, R_), (1.5, 1.5, 1), (3.2, 0.7, D_ / 2), (3.9, 2.0, P_ / 2)]), st(10) + 0.4, 0.36, -0.25)
place(music, bansuri([(0, 1.3, 2), (1.3, 0.6, D_), (1.9, 2.2, P_)]), st(12) + 0.2, 0.26, 0.2)
place(music, bansuri([(0, 0.8, 1), (0.8, 0.4, R_), (1.2, 1.5, g_)]), st(15) + 0.5, 0.22, -0.2)
place(music, bansuri([(0, 0.7, P_), (0.7, 0.4, g_), (1.1, 0.5, R_), (1.6, 2.4, 1)]), st(18) + 0.3, 0.36, 0.1)

# ---- tabla: the chase (shots 3-4 up to the arrow) ----
beat = 0.165; pat = ["dha", "ge", "na", "ti", "na", "ka", "dhi", "na"]; t0 = st(3) + 0.1; k = 0; hit4 = st(4) + 0.62
while t0 < hit4 - 0.05:
    b = pat[k % 8]; g = 0.5 + 0.25 * min(1, (t0 - st(3)) / 3)
    if b in ("dha", "dhi", "ge"): place(music, bayan(), t0, 0.5 * g, -0.15)
    if b in ("dha", "dhi", "na"): place(music, dayan("na"), t0, 0.8 * g, 0.2)
    if b == "ti": place(music, dayan("ti"), t0, 0.7 * g, 0.2)
    if b == "ka": place(music, bandnoise(0.05, 900, 4000) * np.exp(-tt(0.05) * 80), t0, 0.35 * g, 0.1)
    t0 += beat; k += 1

# ---- strings / choir / hits ----
place(music, strings(st(6) - st(3) + 0.3, [1, 1.5], a=0.8, r=0.6, trem=0.35), st(3), 0.16)                     # chase tension
place(music, strings(st(12) - st(8) + 0.5, [1, 1.2, 1.5], a=1.5, r=2.0), st(8), 0.12)                          # hurt
place(music, strings(st(14) - st(13) + 0.4, [1, 16 / 15], a=2.2, r=0.5, trem=0.2), st(13), 0.24)               # the monk arrives
place(music, strings(st(16) - st(15) + 0.9, [1, 1.5, 16 / 15 * 2], a=2.5, r=0.2), st(15), 0.13)                # unease under the welcome
burst = st(16) + (min(2.8, max(0.7, S[16]["vStart"] - S[16]["start"] + S[16]["sent"][1] - 0.22)) if len(S[16].get("sent", [])) > 1 else 0.85)
place(music, strings(st(17) - burst + 0.8, [1, 16 / 15, 1.5, 2.4], a=0.05, r=1.5, trem=0.3), burst, 0.32)      # the reveal
place(music, choir(st(17) - burst + 0.6, [1, 1.2, 1.5, 2, 2 * 16 / 15], a=0.08, r=1.6), burst, 0.30)
place(music, strings(st(18) - st(17) + 0.6, [1, 1.5, 2], a=1.2, r=1.5), st(17), 0.12)
place(music, strings(E - st(18) + 0.4, [1, 1.25, 1.5, 2], a=1.0, r=1.6), st(18), 0.15)                          # warm close (major)
B1 = st(1) + max(1.25, S[1]['vStart'] - S[1]['start'] + S[1]['speech'] - 0.05)
hit(B1, 0.85, [1, 1.5, 2])                 # NOT IN VALMIKI stamp
hit(hit4, 0.9, [1, 1.2, 1.5])                        # the arrow
for i, x in enumerate(sentence_starts(S[12], 3)): place(music, taiko(1.3, 60, 40, 0.15), st(12) + x - 0.03, 0.45 + 0.15 * i)
hit(burst, 1.25, None); place(music, taiko(2.2, 52, 30, 0.9), burst + 0.03, 0.9)
hit(st(17) + sentence_starts(S[17], 2)[0] + 0.78, 0.55, [1, 1.5])
for i, x in enumerate(sentence_starts(S[14], 3)): place(music, np.sin(2 * np.pi * 36 * tt(0.7)) * np.exp(-tt(0.7) * 5), st(14) + x, 0.5)  # sub pulse in the stillness

# ---------------- sound effects ----------------
# 1: line shimmer, shatter
d = 0.9; t = tt(d); place(sfx, (np.sin(2 * np.pi * np.cumsum(900 + 1900 * t / d) / SR) * 0.25 + whoosh(d, 2000, 5000, 4000, 11000, 2) * 0.5) * env_ad(d, 0.1, 0.15), st(1) + 0.1, 0.28)
for i in range(46):
    f = rg.uniform(1800, 7500); dd = rg.uniform(0.08, 0.5); t = tt(dd); place(sfx, np.sin(2 * np.pi * f * t) * np.exp(-t * rg.uniform(9, 30)), B1 + rg.uniform(0, 0.5) ** 2 * 1.4, rg.uniform(0.04, 0.13), rg.uniform(-0.8, 0.8))
place(sfx, bandnoise(0.5, 2500, 12000) * np.exp(-tt(0.5) * 12), B1, 0.4)
# 2: lamp crackle
for i in range(22): place(sfx, bandnoise(0.02, 1500, 6000) * np.exp(-tt(0.02) * 200), st(2) + rg.uniform(0.2, 5.3), rg.uniform(0.03, 0.09), 0.5)
# 3: deer hooves + Rama running + wind through trees
dur3 = st(4) - st(3)
for i in range(int(dur3 * 8.5 / np.pi * 2)): place(sfx, step(0.6, i) , st(3) + i * np.pi / 8.5 / 2 + 0.05, 0.22 * max(0.15, 1 - i * np.pi / 17 / dur3), -0.5 + i * 0.07)
for i in range(int(dur3 * 11.5 / np.pi)): place(sfx, step(1.0, 50 + i), st(3) + 0.2 + i * np.pi / 11.5, 0.3, -0.6 + i * 0.09)
place(sfx, whoosh(st(6) - st(3), 150, 700, 250, 1100, 4) * env_ad(st(6) - st(3), 1.0, 1.0), st(3), 0.13)
# 4: arrow
place(sfx, whoosh(0.3, 1500, 5000, 500, 2500, 5) * env_ad(0.3, 0.12, 0.02), hit4 - 0.28, 0.5, -0.5)
place(sfx, step(1.6, 9), hit4, 0.6); place(sfx, bandnoise(1.0, 60, 240, 11) * env_ad(1.0, 0.1, 0.6), hit4 + 1.0, 0.25)   # body drops to its knees
place(sfx, step(1.5, 10), hit4 + 1.75, 0.5)
# crickets + night air around the hermitage
night(st(1), B1 + 0.1, 0.25, 1); night(st(6), st(12) + 0.2, 0.3, 2); night(st(12), st(14) + 0.75, 0.3, 3); night(st(15), st(16) + 0.3, 0.2, 4); night(st(17), E + 0.3, 0.3, 6)
# 11: Lakshmana's footsteps, walking away
for i in range(3): place(sfx, step(1.0, 70 + i), st(11) + 1.27 + i * np.pi / 4.6, 0.32 * (1 - i * 0.22), 0.3 + i * 0.25)
# 12: a gust through the thatch
place(sfx, whoosh(3.2, 200, 1200, 300, 2200, 8) * env_ad(3.2, 1.2, 1.5), st(12) + 0.1, 0.2)
# 13: monk's steps + staff
for i in range(4): place(sfx, step(1.2, 80 + i), st(13) + 0.25 + i * np.pi / 3.3, 0.34, -0.5 + i * 0.12); place(sfx, np.sin(2 * np.pi * 420 * tt(0.06)) * np.exp(-tt(0.06) * 60) + step(0.4, 90 + i)[: int(0.06 * SR)], st(13) + 0.55 + i * np.pi / 3.3, 0.16, -0.3 + i * 0.12)
# 14: the world stops — thin glassy tone
d = st(15) - st(14) - 1.0; t = tt(d); place(sfx, (np.sin(2 * np.pi * 2217 * t) + 0.6 * np.sin(2 * np.pi * 2223 * t) + 0.4 * np.sin(2 * np.pi * 3329 * t)) * env_ad(d, 1.2, 0.8), st(14) + 0.9, 0.022)
# 15: clay pot set down, water
place(sfx, np.sin(2 * np.pi * 310 * tt(0.2)) * np.exp(-tt(0.2) * 25) + 0.5 * bandnoise(0.2, 400, 2000) * np.exp(-tt(0.2) * 40), st(15) + 1.5, 0.18, -0.3)
for i in range(10): f = rg.uniform(900, 2400); place(sfx, np.sin(2 * np.pi * (f + 600 * tt(0.07) / 0.07) * tt(0.07)) * env_ad(0.07, 0.01, 0.04), st(15) + 1.7 + i * 0.07 + rg.uniform(0, 0.03), 0.05, -0.2)
# 16: fire whoosh, gasp, boom, roar
d16 = burst - st(16) + 0.08
place(sfx, whoosh(d16, 100, 600, 500, 6000, 12) * env_ad(d16, d16 * 0.85, 0.04) ** 2, st(16) + 0.0, 0.5)
place(sfx, whoosh(0.4, 900, 3000, 1500, 5000, 13) * env_ad(0.4, 0.25, 0.08), st(16) + 0.4, 0.2, -0.6)   # Sita's gasp
fr = st(17) - burst + 0.5; roar = bandnoise(fr, 80, 1400, 14) * (0.6 + 0.4 * np.abs(bandnoise(fr, 2, 9, 15))) + 0.4 * bandnoise(fr, 1500, 6000, 16) * np.abs(bandnoise(fr, 6, 20, 17))
place(sfx, roar * env_ad(fr, 0.03, 0.9), burst, 0.42)
# 17: strike-through swish
place(sfx, whoosh(0.35, 800, 4000, 300, 1500, 18) * env_ad(0.35, 0.1, 0.1), st(17) + sentence_starts(S[17], 2)[0] + 0.72, 0.3)

