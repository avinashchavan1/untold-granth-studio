# Reel A02 sound cues — exec'd inside engine/py/build_audio.py (see its docstring for available names)
R_, g_, P_, D_ = 9 / 8, 6 / 5, 3 / 2, 5 / 3

# ---- tanpura bed, thinned under the fire, back for the close ----
seq = [0.75, 1.0, 1.0, 0.5]; t0 = 0.0; k = 0; tan = buf()
while t0 < E: place(tan, tanpura(SA * seq[k % 4]), t0, 0.5, (-0.35, 0.2, -0.1, 0.3)[k % 4]); t0 += 0.86; k += 1
ta = np.ones(N)
auto(ta, 0, 0.6, 0, 0.9); auto(ta, st(11), st(11) + 1.0, 1, 0.45); auto(ta, st(11) + 1.0, st(12), 0.45, 0.45); auto(ta, st(12), st(12) + 0.8, 0.45, 0.9)
music += tan * ta[:, None]

# ---- bansuri: the waiting woman (gentle, Shivaranjani colour) ----
place(music, bansuri([(0, 1.1, P_ / 2), (1.1, 0.5, D_ / 2), (1.6, 1.6, P_ / 2), (3.4, 0.5, g_), (3.9, 0.45, R_), (4.35, 1.4, 1)]), st(2) + 0.3, 0.28, -0.2)
place(music, bansuri([(0, 1.2, 1), (1.2, 0.5, R_), (1.7, 1.4, g_), (3.3, 0.6, R_), (3.9, 1.8, 1)]), st(4) + 0.3, 0.32, 0.25)
place(music, bansuri([(0, 0.9, P_), (0.9, 0.4, D_), (1.3, 1.3, P_), (2.8, 0.5, g_), (3.3, 1.6, R_)]), st(7) + 0.5, 0.24, -0.25)
place(music, bansuri([(0, 1.0, g_), (1.0, 0.5, R_), (1.5, 1.5, 1), (3.2, 0.7, D_ / 2), (3.9, 2.0, P_ / 2)]), st(9) + 0.4, 0.30, 0.2)
place(music, bansuri([(0, 0.7, P_), (0.7, 0.4, g_), (1.1, 0.5, R_), (1.6, 2.4, 1)]), st(14) + 0.3, 0.34, 0.1)

# ---- strings + choir ----
place(music, strings(st(4) - st(3) + 0.4, [1, 1.5], a=1.2, r=0.8), st(3), 0.10)                               # the walk west
place(music, strings(st(8) - st(5) + 0.4, [1, 1.25, 1.5], a=1.6, r=1.2), st(5), 0.11)                          # the meeting (warm, major)
place(music, strings(st(11) - st(10) + 0.4, [1, 1.2, 1.5], a=1.5, r=0.8), st(10), 0.10)                        # asking leave
place(music, strings(st(12) - st(11) + 1.2, [1, 1.25, 1.5, 2], a=1.0, r=1.8), st(11), 0.16)                    # ascension
place(music, choir(st(12) - st(11) + 0.8, [1, 1.25, 1.5, 2], a=1.8, r=1.6), st(11) + 1.2, 0.22)
place(music, strings(E - st(14) + 0.4, [1, 1.25, 1.5, 2], a=1.0, r=1.6), st(14), 0.15)

# ---- hits ----
B1 = st(1) + max(1.4, S[1]['vStart'] - S[1]['start'] + S[1]['speech'] - 0.05)
hit(B1, 0.8, [1, 1.5, 2])                                                                                        # the fruit crumbles
for i, x in enumerate(sentence_starts(S[8], 3)): place(music, taiko(1.2, 64, 42, 0.2), st(8) + x - 0.03, 0.35 + 0.12 * i)
for i, x in enumerate(sentence_starts(S[12], 3)): place(music, taiko(1.3, 60, 40, 0.15), st(12) + x - 0.03, 0.45 + 0.15 * i)
hit(st(13) + sentence_starts(S[13], 2)[1] - 0.03, 0.75, [1, 1.5])                                                 # NOT IN VALMIKI

# ---------------- sound effects ----------------
for i in range(14):                                                                                                # 1: crumble sparkle
    f = rg.uniform(1800, 6500); dd = rg.uniform(0.08, 0.4); t = tt(dd); place(sfx, np.sin(2 * np.pi * f * t) * np.exp(-t * rg.uniform(9, 30)), B1 + rg.uniform(0, 0.5) ** 2, rg.uniform(0.04, 0.1), rg.uniform(-0.8, 0.8))
for i in range(18): place(sfx, bandnoise(0.02, 1500, 6000) * np.exp(-tt(0.02) * 200), st(2) + rg.uniform(0.2, 5.0), rg.uniform(0.03, 0.08), 0.5)   # 2: lamp crackle
d3 = st(4) - st(3)                                                                                                 # 3: two pairs of footsteps
for i in range(int(d3 * 1.4)): place(sfx, step(0.8, 20 + i), st(3) + 0.2 + i / 1.4, 0.26, -0.3 + 0.03 * i); place(sfx, step(0.7, 60 + i), st(3) + 0.55 + i / 1.4, 0.2, 0.2 + 0.03 * i)
place(sfx, whoosh(d3, 150, 700, 250, 1100, 4) * env_ad(d3, 1.0, 1.0), st(3), 0.1)
def lake(a, b, g, seed):                                                                                          # gentle water lapping + birds at dusk
    place(sfx, bandnoise(b - a, 150, 900, seed) * (0.5 + 0.5 * np.abs(bandnoise(b - a, 0.3, 1.2, seed + 1))) * env_ad(b - a, 0.8, 0.8), a, g, -0.3)
lake(st(4), st(10), 0.07, 30)
for k2 in range(5):
    tb = st(4) + 1.0 + k2 * 3.7; d = 0.5; t = tt(d); place(sfx, np.sin(2 * np.pi * (2600 + 900 * np.sin(2 * np.pi * 7 * t)) * t) * env_ad(d, 0.05, 0.25), tb, 0.04, 0.6 - 0.25 * k2)
night(st(10), E + 0.3, 0.26, 7)
place(sfx, np.sin(2 * np.pi * 260 * tt(0.25)) * np.exp(-tt(0.25) * 18) * 0.6 + 0.4 * bandnoise(0.25, 300, 1600) * np.exp(-tt(0.25) * 30), st(7) + 3.0, 0.12, -0.2)   # 7: basket set down
dF = st(12) - st(11) + 0.6                                                                                         # 11: the fire, then the rising light
place(sfx, bandnoise(dF, 200, 3000, 41) * (0.6 + 0.4 * np.abs(bandnoise(dF, 3, 12, 42))) * env_ad(dF, 0.6, 1.2), st(11), 0.18, -0.1)
for i in range(40): place(sfx, bandnoise(0.02, 1500, 6000) * np.exp(-tt(0.02) * 200), st(11) + rg.uniform(0.2, dF - 0.3), rg.uniform(0.04, 0.1), rg.uniform(-0.4, 0.3))
place(sfx, whoosh(2.4, 300, 1500, 2000, 9000, 43) * env_ad(2.4, 1.6, 0.6), st(11) + 1.6, 0.2)
d = 3.0; t = tt(d); place(sfx, (np.sin(2 * np.pi * 1760 * t) + 0.5 * np.sin(2 * np.pi * 2637 * t)) * env_ad(d, 1.2, 1.4), st(11) + 2.2, 0.03)   # bell-like shimmer
place(sfx, whoosh(0.35, 800, 4000, 300, 1500, 18) * env_ad(0.35, 0.1, 0.1), st(13) + sentence_starts(S[13], 2)[1] + 0.05, 0.3)            # 13: strike-through swish
