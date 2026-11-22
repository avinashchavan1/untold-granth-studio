// ===== LF01 · Vali's death, as Valmiki tells it — full-length 16:9 =====
// World 1920x1920 (core.js FRAME 'wide'): the frame is the band y 560..1640; derived reels ('tall_from_wide') crop x 420..1500,
// so every shot keeps its action between x ~460 and ~1460. Characters: CH.vali / sugriva / tara / angada (series art, owner's picks).
const HZ = 1010, GROUND = 1265, BASE = 1525, FS = 560;           // horizon, ground line, feet line, figure size
const L_DAY = { rim: '#ffe6b0', rimA: 0.7, dir: 1, tint: '#3a2a10', tintA: 0.06 };
const L_GOLD = { rim: '#ffd27a', rimA: 0.85, dir: 1, tint: '#3a1e30', tintA: 0.14 };
const SUG_F = Object.assign({}, CH.sugriva, { garland: 'flowers' });                    // from 4.12.36
const SUG_G = Object.assign({}, CH.sugriva, { garland: 'gold' });                       // Vali's garland, 4.22.18
const SUG_K = Object.assign({}, CH.sugriva, { garland: 'gold', crown: true });          // crowned, 4.25.33
const VALI_NG = Object.assign({}, CH.vali, { garland: null });                          // after he gives the garland away
const MAYAVI = Object.assign({}, CH.maricha, { skin: '#3a3048', skinSh: '#1c1626' });
const sugOf = id => id >= 91 ? SUG_K : id >= 82 ? SUG_G : id >= 32 ? SUG_F : CH.sugriva;
const valiOf = id => id >= 82 ? VALI_NG : CH.vali;

// ---------- scenes (painted once, on the square world) ----------
function fgGrass(x, r, y0, col = '#050d1c') { for (let i = 0; i < 240; i++) { const px = -M + r() * (W + 2 * M), py = y0 + r() * 70, hh = 60 + r() * 150; stroke(x, px, py, px + (r() - .5) * 90, py - hh, 6 + r() * 8, jit(r() < .15 ? '#18404a' : col, r, 6), 1, (r() - .5) * .5); } }
function groundBand(x, r, top, stops) {
  x.save(); x.beginPath(); x.moveTo(-M, top + 20); for (let i = 0; i <= 24; i++) x.lineTo(-M + i * (W + 2 * M) / 24, top + Math.sin(i * 1.7) * 9 + (i % 3) * 4); x.lineTo(W + M, H + M); x.lineTo(-M, H + M); x.closePath(); x.clip();
  wash(x, r, -M, top - 10, W + 2 * M, H + M - top + 10, stops, { n: 520, alpha: 0.45, th: [16, 50], len: [120, 420] });
  for (let i = 0; i < 900; i++) { const px = -M + r() * (W + 2 * M), t = Math.pow(r(), 0.7), py = lerp(top + 8, 1700, t), hh = 8 + t * 30 + r() * 12; stroke(x, px, py, px + (r() - .5) * hh * 0.7, py - hh, 2 + t * 3.5, jit(r() < .22 ? '#3f7a70' : (r() < .5 ? '#1f4a4c' : '#0a1c2a'), r, 10), 0.7, (r() - .5) * .3); }
  x.restore();
}
const GR_DUSK = [[0, '#2a3a4a'], [.25, '#1b2d3e'], [1, '#081526']], GR_NIGHT = [[0, '#183440'], [.25, '#0f2434'], [1, '#060f20']], GR_DAY = [[0, '#5a6a3a'], [.3, '#3c4a2c'], [1, '#1a2414']];
const SKY_DAY = [[0, '#2a4a8a'], [.5, '#5a7ab0'], [.8, '#a8b8c8'], [1, '#e8cfa0']];
function buildWideForest(tod, seed = 101) {
  const r = rng(seed), sky = newLayer(0.05), far = newLayer(0.3), mid = newLayer(0.65), fg = newLayer(1.2);
  if (tod === 'day') wash(sky.x, r, -M, -M, W + 2 * M, HZ + M + 40, SKY_DAY, { n: 520, alpha: 0.4, th: [26, 80], len: [240, 700] });
  else paintSky(sky.x, r, tod, tod === 'night' ? [1420, 700, 46] : [1500, 760, 40], HZ);
  paintHills(far.x, r, tod === 'day' ? 'dusk' : tod, HZ);
  const lit = tod === 'day' ? { dark: '#1a3020', mid: '#2a5030', lit: '#5a8a4a', hi: '#9ac078' } : {};
  [[60, 1300, 1000, 360], [1880, 1290, 980, 380], [330, 1240, 700, 240], [1600, 1235, 720, 250]].forEach(([bx, by, h, sp], i) => paintTree(mid.x, r, bx, by, h, sp, Object.assign({ n: 260, litDir: i % 2 ? -1 : 1 }, lit)));
  groundBand(mid.x, r, GROUND, tod === 'day' ? GR_DAY : tod === 'night' ? GR_NIGHT : GR_DUSK);
  fgGrass(fg.x, r, 1660);
  for (let i = 0; i < 60; i++) { const a = r() * 1.2 - 0.2, px = -60 + r() * 380, py = 480 + r() * 200; dab(fg.x, px, py, 70 + r() * 60, 20 + r() * 16, a, jit('#050c1a', r, 5), 1); }
  return { layers: [sky, far, mid, fg] };
}
function buildCave() {
  const r = rng(202), sky = newLayer(0.05), mid = newLayer(0.6), fg = newLayer(1.2);
  paintSky(sky.x, r, 'night', [1520, 700, 44], HZ);
  const m = mid.x;   // the cliff with the cave mouth
  blob(m, [[300, GROUND + 30], [380, 900], [620, 700], [960, 640], [1300, 690], [1560, 880], [1640, GROUND + 30]], '#1a1a36', 1, 0.4);
  for (let i = 0; i < 260; i++) { const px = 340 + r() * 1260, py = 700 + r() * 560; stroke(m, px, py, px + 40 + r() * 80, py + 10 + r() * 30, 10 + r() * 22, jit(r() < .3 ? '#2c2c52' : '#121228', r, 6), 0.5); }
  blob(m, [[800, GROUND + 10], [790, 1080], [880, 990], [1040, 990], [1130, 1080], [1120, GROUND + 10]], '#020208', 1, 0.5);
  groundBand(m, r, GROUND, GR_NIGHT); fgGrass(fg.x, r, 1660);
  return { layers: [sky, mid, fg] };
}
function buildGate() {   // Kishkindha: a city inside the mountain, golden arches, banners (4.14.5)
  const r = rng(303), sky = newLayer(0.05), far = newLayer(0.3), mid = newLayer(0.65), fg = newLayer(1.2);
  paintSky(sky.x, r, 'dusk', [1560, 700, 36], HZ); paintHills(far.x, r, 'dusk', HZ);
  const m = mid.x; blob(m, [[120, GROUND + 20], [200, 820], [560, 640], [960, 590], [1380, 650], [1760, 830], [1820, GROUND + 20]], '#2a2048', 1, 0.4);
  for (let i = 0; i < 300; i++) { const px = 160 + r() * 1620, py = 640 + r() * 600; stroke(m, px, py, px + 40 + r() * 90, py + 8 + r() * 26, 10 + r() * 22, jit(r() < .3 ? '#3e3266' : '#1c1638', r, 6), 0.5); }
  [[700, 230], [960, 300], [1220, 230]].forEach(([ax, aw]) => { const top = GROUND - aw * 1.5;
    blob(m, [[ax - aw / 2, GROUND], [ax - aw / 2, top + aw * 0.5], [ax, top], [ax + aw / 2, top + aw * 0.5], [ax + aw / 2, GROUND]], '#120c20', 1, 0.3);
    line(m, [[ax - aw / 2 - 14, GROUND], [ax - aw / 2 - 14, top + aw * 0.5], [ax, top - 16], [ax + aw / 2 + 14, top + aw * 0.5], [ax + aw / 2 + 14, GROUND]], 16, '#e6b450', 0.95);
    glow(m, ax, GROUND - 120, aw * 0.6, '#ffb860', 0.35); });
  [560, 830, 1090, 1360].forEach(bx => { stroke(m, bx, 760, bx, 960, 5, '#4a3020'); poly(m, [[bx, 760], [bx + 80, 780], [bx, 810]], '#c41e1e', 0.95); });
  groundBand(m, r, GROUND, GR_DUSK); fgGrass(fg.x, r, 1660);
  return { layers: [sky, far, mid, fg] };
}
function buildPeak(tod = 'day') {    // Rishyamuka
  const r = rng(404), sky = newLayer(0.05), far = newLayer(0.3), mid = newLayer(0.65), fg = newLayer(1.2);
  if (tod === 'day') wash(sky.x, r, -M, -M, W + 2 * M, HZ + M + 60, SKY_DAY, { n: 520, alpha: 0.4, th: [26, 80], len: [240, 700] }); else paintSky(sky.x, r, tod, [1500, 720, 40], HZ);
  paintHills(far.x, r, 'dusk', HZ - 40);
  const m = mid.x; blob(m, [[-M, GROUND + 40], [-M, 1060], [300, 980], [700, 1080], [1000, 1150], [1400, 1100], [1800, 1020], [W + M, 1050], [W + M, GROUND + 40]], tod === 'day' ? '#5a4a3a' : '#2a2238', 1, 0.4);
  for (let i = 0; i < 160; i++) { const px = r() * W, py = 1000 + r() * 260; dab(m, px, py, 30 + r() * 70, 14 + r() * 30, r(), jit(tod === 'day' ? '#6e5a44' : '#3a3050', r, 8), 0.8); }
  groundBand(m, r, GROUND, tod === 'day' ? GR_DAY : GR_DUSK);
  paintTree(m, r, 250, 1290, 760, 260, tod === 'day' ? { n: 200, dark: '#1a3020', mid: '#2a5030', lit: '#5a8a4a', hi: '#9ac078' } : { n: 200 });
  fgGrass(fg.x, r, 1660);
  return { layers: [sky, far, mid, fg] };
}
function buildInner() {  // Vali's inner palace: warm lamplight, pillars
  const r = rng(505), back = newLayer(0.1), mid = newLayer(0.6);
  wash(back.x, r, -M, -M, W + 2 * M, H + 2 * M, [[0, '#1c0e1a'], [.35, '#4a2230'], [.6, '#7a3a2a'], [.8, '#3a1a20'], [1, '#12080e']], { n: 500, alpha: 0.4, th: [30, 90], len: [200, 600] });
  glow(back.x, 960, 1000, 700, '#ffb860', 0.3);
  [300, 700, 1220, 1620].forEach(px => { const m = mid.x; poly(m, [[px - 50, GROUND + 40], [px - 42, 560], [px + 42, 560], [px + 50, GROUND + 40]], '#2a1418'); line(m, [[px - 44, 600], [px + 44, 600]], 14, '#e6b450'); line(m, [[px - 50, GROUND], [px + 50, GROUND]], 14, '#e6b450'); stroke(m, px - 20, 640, px - 20, GROUND - 20, 6, '#5a3030', 0.6); });
  const m = mid.x; wash(m, r, -M, GROUND, W + 2 * M, 700, [[0, '#5a2a26'], [.4, '#3a1a1c'], [1, '#12080c']], { n: 300, alpha: 0.4 });
  return { layers: [back, mid] };
}
function buildRiver() {   // a quiet sandbank of the mountain river (4.24.30)
  const r = rng(606), sky = newLayer(0.05), far = newLayer(0.3), mid = newLayer(0.65), fg = newLayer(1.2);
  paintSky(sky.x, r, 'dusk', [1520, 780, 38], HZ); paintHills(far.x, r, 'dusk', HZ);
  wash(far.x, r, -M, HZ + 4, W + 2 * M, 200, [[0, '#7a4a6a'], [.5, '#3a3068'], [1, '#1c2050']], { n: 260, alpha: 0.5, th: [6, 16], len: [120, 420] });
  groundBand(mid.x, r, GROUND - 40, [[0, '#8a7a5a'], [.3, '#5a4a3a'], [1, '#1a1410']]);
  fgGrass(fg.x, r, 1660, '#0a0c14');
  return { layers: [sky, far, mid, fg] };
}
function buildCardBg() {
  const r = rng(707), bg = newLayer(0.1);
  wash(bg.x, r, -M, -M, W + 2 * M, H + 2 * M, [[0, '#0c0a1e'], [.3, '#1e1430'], [.5, '#3a2430'], [.7, '#1e1430'], [1, '#0c0a1e']], { n: 600, alpha: 0.4, th: [30, 90], len: [200, 600] });
  for (let i = 0; i < 40; i++) { const y = 700 + i * 24; stroke(bg.x, 300 + r() * 40, y, 1620 - r() * 40, y + (r() - .5) * 6, 3, '#6a4a3a', 0.18); }
  return { layers: [bg] };
}
const SC = { forestD: () => buildWideForest('dusk', 101), forestN: () => buildWideForest('night', 111), forestDay: () => buildWideForest('day', 121),
  cave: buildCave, gate: buildGate, peak: () => buildPeak('day'), peakD: () => buildPeak('dusk'), inner: buildInner, river: buildRiver, card: buildCardBg };
function lfScene(ctx, key, cam) { const bg = ensureScene('lf_' + key, SC[key]); bg.layers.forEach(L => drawLayer(ctx, cam, L)); }
const camOf = (p, o = {}) => ({ z: lerp(o.z0 || 1.0, o.z1 || 1.05, p), x: lerp(o.x0 || -18, o.x1 || 18, p), y: o.y || 0 });

// ---------- figures ----------
function fig(c, ch, x, face, o, light, s = FS, y = BASE) { return drawFigure(c, ch, P(Object.assign({ eye: 1 }, o || {})), { x, y, s, face }, light); }
function talk(sh, u, t, seed, who) { return { mouth: sh.voice === who ? mouthEnv(sh, u) : 0, eye: blink(t, seed) }; }
const BOW = { bow: 'F', aF: [0.17, 0.15], handF: 'hold' };
const DRAW = { bow: 'F', aF: [0.2, 0.0], aN: [0.05, 0.02], handF: 'hold', handN: 'fist' };
const NAMASTE = { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] };
const PUNCH = ph => ({ aN: [0.2 + 0.06 * Math.sin(ph), -0.02], handN: 'fist', aF: [0.12, 0.08], handF: 'fist', lean: 0.12, brow: 0.8, lN: [0.2, 0.05], lF: [-0.2, 0.05] });
function hidden(c, t, x, light) { fig(c, CH.rama, x, 1, Object.assign({}, BOW, { eye: blink(t, 2), gaze: [0.4, 0] }), light, FS * 0.92); fig(c, CH.lak, x - 150, 1, { bow: 'B', eye: blink(t, 5), gaze: [0.4, 0] }, light, FS * 0.9); }
function leafScreen(c, t, x0, x1) { const r = rng(9); for (let i = 0; i < 90; i++) { const px = x0 + r() * (x1 - x0), py = 900 + r() * 700; dab(c, px + Math.sin(t * 0.8 + i) * 4, py, 40 + r() * 50, 14 + r() * 12, r() * 3, jit('#0c1a20', r, 6), 0.95); } }
function lyingVali(c, sh, u, t, x = 960, light = L_DUSK, o = {}) { lying(c, valiOf(sh.id), x, GROUND + 140, FS * 0.95, Object.assign({ eye: sh.voice === 'vali' ? 0.6 : 0.3, mouth: sh.voice === 'vali' ? mouthEnv(sh, u) : 0, smile: -0.1 }, o), light);
  const ax = x - 150, ay = GROUND + 50; stroke(c, ax, ay, ax + 120, ay - 90, 6, '#d8c8a8'); }      // the arrow in his chest
function rain(c, t, a = 1) { for (let i = 0; i < 260; i++) { const h1 = hash(i * 3.1), h2 = hash(i * 7.3), x = ((h1 * (W + 400) + t * 260) % (W + 400)) - 200, y = ((h2 * 1300 + t * (900 + h1 * 400)) % 1300) + 480; stroke(c, x, y, x - 24, y + 70, 2, '#b8c8e8', 0.35 * a); } }

// ---------- UI (frame coordinates, FW x FH) ----------
const CX = FW / 2;
function chip(c, ref, a = 1) { if (!ref || a <= 0) return; text(c, 'VALMIKI RAMAYANA · CE ' + ref, FW - 50, 70, { size: 26, font: 'Montserrat', weight: 800, color: C_GOLD, align: 'right', ls: 3, alpha: 0.9 * a, stroke: 5, shadow: 10 }); }
function hookLines(c, u, lines) { lines.forEach(([s, col], i) => { const a = ease(u, 0.15 + i * 0.5, 0.5 + i * 0.5); if (a > 0) textFit(c, s, CX, 230 + i * 110 + (1 - a) * 16, { size: 96, weight: 900, color: col || C_IVORY, ls: 6, alpha: a, stroke: 10, shadow: 30 }, 1700); }); }
function actTitle(c, u, act) { const N = ['', 'ACT I', 'ACT II', 'ACT III', 'ACT IV'][act.n], a = Math.min(ease(u, 0.2, 0.8), 1 - ease(u, 3.6, 4.4)); if (a <= 0 || !N) return;
  text(c, N, 80, 190, { size: 46, font: 'Montserrat', weight: 800, color: C_GOLD, align: 'left', ls: 10, alpha: a, stroke: 6 }); text(c, act.name.toUpperCase(), 80, 270, { size: 66, weight: 900, color: C_IVORY, align: 'left', ls: 4, alpha: a, stroke: 9, shadow: 24 }); }
function enLines(c, en, y, a, max = 1600, size = 44) { const w = en.split(' '); if (w.join(' ').length < 70) { textFit(c, en, CX, y, { size, font: 'Montserrat', weight: 800, color: C_IVORY, alpha: a, stroke: 6, shadow: 20 }, max); return; } const h = Math.ceil(w.length / 2);
  [w.slice(0, h).join(' '), w.slice(h).join(' ')].forEach((l, i) => textFit(c, l, CX, y + i * 58, { size, font: 'Montserrat', weight: 800, color: C_IVORY, alpha: a, stroke: 6, shadow: 20 }, max)); }
function cardBg(ctx, t, u) { lfScene(ctx, 'card', { z: lerp(1.02, 1.08, Math.min(1, u / 10)) }); glow(ctx, 960, 1100, 700, '#ffd890', 0.12); flame(ctx, 960, 1560, 22, t, 3); }
// verse / quote card, wide: source + ref, Devanagari (Mukta), transliteration, English
function wideQuote(ctx, u, t, post, Q, enAt) {
  cardBg(ctx, t, u);
  post.ui = c => {
    const q0 = ease(u, 0.05, 0.4); if (q0 > 0) { text(c, Q.source, CX, 150, { size: 60, weight: 900, color: C_GOLD, ls: 6, alpha: q0, stroke: 8, shadow: 30 }); text(c, Q.ref, CX, 205, { size: 30, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 5, alpha: q0, stroke: 5 }); }
    const q1 = ease(u, 0.2, 0.7); if (q1 > 0) { Q.lines.forEach((l, i) => textFit(c, l, CX, 350 + i * 104 + (1 - q1) * 12, { size: 80, font: 'Mukta', weight: 700, color: C_GOLD, alpha: q1, stroke: 8, shadow: 30 }, 1700));
      const tl = Q.translit.length > 90 && Q.translit.includes(', ') ? Q.translit.split(', ') : [Q.translit]; tl.forEach((l, i) => textFit(c, l + (i < tl.length - 1 ? ',' : ''), CX, 350 + Q.lines.length * 104 + 10 + i * 42, { size: 32, font: 'Montserrat', weight: 600, color: C_IVORY, alpha: 0.85 * q1, stroke: 5 }, 1600)); }
    const q2 = ease(u, enAt, enAt + 0.45); if (q2 > 0) enLines(c, Q.en, 350 + Q.lines.length * 104 + 150, q2);
  };
}
function wideSource(ctx, u, t, post, title, sub) {
  cardBg(ctx, t, u);
  post.ui = c => { const a = ease(u, 0.15, 0.6); text(c, title, CX, 420, { size: 110, weight: 900, color: C_GOLD, ls: 8, alpha: a, stroke: 9, shadow: 30 });
    const w = 420 * ease(u, 0.4, 1.0); c.fillStyle = rgba(C_IVORY, 0.8 * a); c.fillRect(CX - w, 470, w * 2, 3);
    text(c, sub, CX, 545, { size: 42, font: 'Montserrat', weight: 700, color: C_IVORY, ls: 5, alpha: ease(u, 0.5, 1.0), stroke: 6 });
    text(c, 'CRITICAL EDITION', CX, 605, { size: 30, font: 'Montserrat', weight: 700, color: C_GOLD, ls: 6, alpha: ease(u, 0.7, 1.2), stroke: 5 }); };
}
function wideEnd(ctx, u, p, sh, t, post) {
  lfScene(ctx, 'peakD', camOf(p, { z0: 1.02, z1: 1.06 }));
  const E = FS * 0.78, EY = BASE + 40; fig(ctx, CH.lak, 720, 1, { bow: 'B', eye: blink(t, 1), smile: 0.5, gaze: [0.4, 0] }, L_DUSK, E, EY); fig(ctx, CH.rama, 880, 1, Object.assign({}, BOW, { eye: blink(t, 2), smile: 0.6 }), L_DUSK, E * 1.04, EY);
  fig(ctx, CH.hanuman, 1060, -1, Object.assign({}, NAMASTE, { eye: blink(t, 3), smile: 0.6 }), L_DUSK, E, EY); fig(ctx, SUG_K, 1220, -1, { eye: blink(t, 4), smile: 0.4 }, L_DUSK, E, EY);
  rain(ctx, t, 0.5); const C = (SERIES.cta || {}).youtube || {};
  post.ui = c => { const a = ease(u, 0.2, 0.8); text(c, [].concat(SERIES.title || 'UNTOLD GRANTH').join(' '), CX, 170, { size: 84, weight: 900, color: C_GOLD, ls: 8, alpha: a, stroke: 9, shadow: 30 }); if (SERIES.tagline) text(c, SERIES.tagline, CX, 235, { size: 34, font: 'Montserrat', weight: 700, color: C_IVORY, ls: 3, alpha: a, stroke: 5 });
    const b = ease(u, 0.8, 1.3); if (b > 0) { c.save(); c.globalAlpha = b; c.fillStyle = '#c81e1e'; const bw = 480, bh = 96; c.beginPath(); c.roundRect(CX - bw / 2, 290, bw, bh, 48); c.fill(); c.restore(); text(c, C.button || 'SUBSCRIBE', CX, 355, { size: 50, font: 'Montserrat', weight: 800, color: '#ffffff', ls: 4, alpha: b, shadow: 0 }); }
    (C.handles_line || []).forEach((h, i) => text(c, h, CX, 440 + i * 44, { size: 30, font: 'Montserrat', weight: 700, color: C_IVORY, ls: 3, alpha: ease(u, 1.2, 1.7), stroke: 5 })); };
  post.noLogo = true;
}

// ---------- per-shot choreography ----------
const S_ = {};
const qs = (id, fn) => { S_[id] = fn; };
// B00 cold open
qs(1, (c, u, p, sh, t, post) => { lfScene(c, 'forestD', camOf(p, { z0: 1.0, z1: 1.08 }));
  fig(c, CH.vali, 1150, -1, Object.assign(PUNCH(t * 3), { eye: 1 }), L_DUSK); fig(c, CH.sugriva, 860, 1, PUNCH(t * 3 + 1), L_DUSK);
  leafScreen(c, t, -M, 420); const k = ease(u, 1.2, 2.0); if (k > 0 && k < 1) arrow(c, lerp(300, 1100, k), 1150, lerp(380, 1180, k), 1135);
  post.ui = cc => hookLines(cc, u, sh.card); });
qs(2, (c, u, p, sh, t, post) => { const st = sentenceStarts(sh, 3), cut = Math.max(1.2, st[1] - 0.25);
  if (u < cut) return wideSource(c, u, t, post, 'VALMIKI RAMAYANA', 'KISHKINDHA KANDA · SARGA 17');
  const S = sh.sloka; wideQuote(c, u - cut, t, post, { source: 'THE SOURCE', ref: 'VALMIKI RAMAYANA · ' + S.ref, lines: S.lines, translit: S.translit, en: S.en }, Math.min(6, (sh.dur - cut) * 0.45)); });
qs(3, (c, u, p, sh, t, post) => { lfScene(c, 'forestD', camOf(p)); lyingVali(c, sh, u, t, 1000); fig(c, CH.rama, 700, 1, { bow: 'B', eye: blink(t, 2), gaze: [0.3, 0.1], head: 0.08 }, L_DUSK);
  post.ui = cc => { const a = Math.min(ease(u, 0.3, 0.8), 1 - ease(u, sh.dur - 0.6, sh.dur)); text(cc, 'BOTH SIDES. WORD FOR WORD.', CX, 180, { size: 64, weight: 900, color: C_GOLD, ls: 6, alpha: a, stroke: 8, shadow: 24 }); }; });
qs(4, (c, u, p, sh, t) => { lfScene(c, 'cave', camOf(p, { z0: 1.0, z1: 1.12, x0: 0, x1: 0 })); });
// B01 the cave
qs(5, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p)); fig(c, CH.vali, 1050, -1, { eye: blink(t, 1), smile: 0.2, gaze: [0.3, 0] }, L_DUSK); fig(c, CH.sugriva, 820, 1, Object.assign({}, NAMASTE, { eye: blink(t, 3) }), L_DUSK, FS * 0.95); });
qs(6, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.04, z1: 1.0 })); fig(c, MAYAVI, 1350, -1, { aN: [0.2, -0.1], aF: [0.16, -0.12], mouth: 0.7 + 0.3 * Math.sin(t * 6), brow: 1 }, L_NIGHT, FS * 1.05);
  const k = ease(u, sh.dur * 0.45, sh.dur * 0.9); fig(c, CH.vali, lerp(700, 980, k), 1, runPose(t * 6), L_DUSK); fig(c, CH.sugriva, lerp(520, 800, k), 1, runPose(t * 6 + 1), L_DUSK, FS * 0.96); });
qs(7, (c, u, p, sh, t) => { lfScene(c, 'cave', camOf(p)); fig(c, CH.vali, 1060, -1, { aN: [0.16, 0.02], eye: blink(t, 1), brow: 0.6, mouth: 0.2 * (1 + Math.sin(t * 7)) }, L_NIGHT); fig(c, CH.sugriva, 820, 1, Object.assign({}, NAMASTE, { eye: blink(t, 3) }), L_NIGHT, FS * 0.95); });
qs(8, (c, u, p, sh, t, post) => { lfScene(c, 'cave', camOf(p, { z0: 1.0, z1: 1.03 })); const seasons = Math.floor(u / sh.dur * 4) % 4;
  fig(c, CH.sugriva, 700, 1, { sit: 0.9, eye: blink(t, 3), gaze: [0.4, 0], head: 0.05 }, [L_NIGHT, L_DUSK, L_FOREST, L_NIGHT][seasons], FS * 0.95);
  petals(c, t, 4, seasons === 2 ? 30 : 8, 0.6, 600); post.ui = cc => hookLines(cc, u - 1.2, sh.card); });
qs(9, (c, u, p, sh, t) => { lfScene(c, 'cave', camOf(p, { z0: 1.03, z1: 1.1, x0: 0, x1: 0 })); const k = ease(u, 0.5, sh.dur * 0.6);
  c.save(); c.globalAlpha = 0.9; blob(c, [[880, GROUND + 6], [900 - 100 * k, GROUND + 30 + 60 * k], [960, GROUND + 50 + 120 * k], [1020 + 140 * k, GROUND + 40 + 70 * k], [1040, GROUND + 6]], '#8a1010', 0.9 * k); c.restore();
  ringEcho(c, 960, 1150, t, 0.35 * ease(u, sh.dur * 0.5, sh.dur * 0.7)); fig(c, CH.sugriva, 600, 1, { aN: [0.06, -0.2], aF: [0.08, -0.22], eye: 1.2, brow: -0.4, mouth: 0.4, lean: -0.08 }, L_NIGHT, FS * 0.95); });
qs(10, (c, u, p, sh, t) => { lfScene(c, 'cave', camOf(p)); const k = ease(u, 0.6, sh.dur * 0.55); blob(c, [[780 + 40 * (1 - k), GROUND + 20], [760, 1060], [880, 960], [1060, 960], [1160, 1080], [1150, GROUND + 20]], '#3a3a5a', k, 0.5);
  fig(c, CH.sugriva, lerp(640, 500, ease(u, sh.dur * 0.55, sh.dur)), -1, { eye: 0.5, smile: -0.4, head: 0.1, tear: 0.6 }, L_NIGHT, FS * 0.95); });
qs(11, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.06, z1: 1.0 })); const k = ease(u, 0.3, sh.dur); fig(c, CH.vali, lerp(1500, 1150, k), -1, walkPose(t * 4), L_DUSK, FS * 1.05); });
// B02
qs(12, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p)); fig(c, CH.vali, 1120, -1, { eye: blink(t, 1), brow: 0.9, smile: -0.4 }, L_DUSK, FS * 1.03); fig(c, Object.assign({}, CH.sugriva, { crown: true }), 830, 1, Object.assign({}, NAMASTE, { eye: blink(t, 3), head: 0.1 }), L_DUSK, FS * 0.95); });
qs(13, (c, u, p, sh, t) => { lfScene(c, 'cave', camOf(p, { z0: 1.05, z1: 1.12, x0: 0, x1: 0 })); const kick = Math.max(0, Math.sin(t * 5)); fig(c, CH.vali, 960, -1, { lN: [0.6 * kick, 0.1], aN: [0.1, -0.1], handN: 'fist', mouth: mouthEnv(sh, u), eye: 1, brow: 1, lean: -0.1 }, L_NIGHT, FS * 1.05); });
qs(14, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p)); fig(c, CH.vali, 1150, -1, { aN: [0.2, -0.02], handN: 'point', brow: 1, smile: -0.5, eye: blink(t, 1) }, L_DUSK, FS * 1.03);
  const k = ease(u, sh.dur * 0.3, sh.dur); fig(c, Object.assign({}, CH.sugriva, { sash: '#5a4a3a' }), lerp(820, 300, k), -1, walkPose(t * 3.2, 0.3, { head: 0.12, eye: 0.6 }), L_DUSK, FS * 0.95); });
qs(15, (c, u, p, sh, t, post) => { lfScene(c, 'cave', camOf(p, { z0: 1.0, z1: 1.04 })); blob(c, [[780, GROUND + 20], [760, 1060], [880, 960], [1060, 960], [1160, 1080], [1150, GROUND + 20]], '#3a3a5a', 1, 0.5);
  fig(c, CH.sugriva, 560, 1, { eye: blink(t, 3), head: 0.06 }, L_NIGHT, FS * 0.9); fig(c, CH.vali, 1380, -1, { eye: blink(t, 1), brow: 0.8 }, L_NIGHT, FS * 0.9); post.ui = cc => hookLines(cc, u - 0.3, sh.card); });
qs(16, (c, u, p, sh, t) => { lfScene(c, 'peak', camOf(p)); fig(c, CH.sugriva, 980, -1, { eye: blink(t, 3), gaze: [0.3, -0.05] }, L_DAY, FS * 0.9); fig(c, CH.hanuman, 760, 1, { eye: blink(t, 4) }, L_DAY, FS * 0.85); });
qs(17, (c, u, p, sh, t) => { lfScene(c, 'forestDay', camOf(p)); const k = ease(u, 0, sh.dur); fig(c, CH.lak, lerp(1500, 1260, k), -1, walkPose(t * 3, 0.35, { bow: 'B' }), L_DAY, FS * 0.95); fig(c, CH.rama, lerp(1340, 1090, k), -1, walkPose(t * 3 + 1, 0.35, { bow: 'B', head: 0.08 }), L_DAY); });
// B03 friendship by fire
qs(18, (c, u, p, sh, t) => { lfScene(c, 'peak', camOf(p)); fig(c, CH.lak, 1380, -1, { bow: 'B', eye: blink(t, 5) }, L_DAY, FS * 0.95); fig(c, CH.rama, 1210, -1, { bow: 'B', eye: blink(t, 2), smile: 0.4 }, L_DAY);
  fig(c, CH.hanuman, 980, -1, Object.assign({}, NAMASTE, { eye: blink(t, 4), smile: 0.5 }), L_DAY, FS * 0.95); const k = ease(u, sh.dur * 0.6, sh.dur); fig(c, CH.sugriva, 760, 1, { aN: [lerp(0.06, 0.24, k), lerp(0.36, 0.08, k)], eye: blink(t, 3), smile: 0.4 }, L_DAY, FS * 0.95); });
qs(19, (c, u, p, sh, t) => { lfScene(c, 'peak', camOf(p, { z0: 1.06, z1: 1.1 })); fig(c, CH.rama, 1130, -1, { bow: 'B', aN: [0.22, 0.1], eye: blink(t, 2), smile: 0.6 }, L_DAY); fig(c, CH.sugriva, 820, 1, Object.assign({ aN: [0.24, 0.08], smile: 0.5 }, talk(sh, u, t, 3, 'sugriva')), L_DAY, FS * 0.96); });
qs(20, (c, u, p, sh, t) => { lfScene(c, 'peakD', camOf(p)); const a = t * 0.35; fire(c, 960, BASE - 20, 70, 180, t, 7, 7);
  [[CH.rama, 0], [CH.sugriva, Math.PI]].forEach(([ch, o]) => { const x = 960 + Math.cos(a + o) * 300, f = Math.sin(a + o) > 0 ? -1 : 1; fig(c, ch, x, f, { eye: blink(t, 2), smile: 0.4, bow: ch === CH.rama ? 'B' : undefined }, L_FIRE, FS * (0.92 + 0.06 * Math.sin(a + o))); });
  fig(c, CH.hanuman, 560, 1, Object.assign({}, NAMASTE, { eye: blink(t, 4), smile: 0.5 }), L_FIRE, FS * 0.85); embers(c, t, 3, 30, 960, BASE - 60, 120); });
qs(21, (c, u, p, sh, t) => { lfScene(c, 'peakD', camOf(p)); fig(c, CH.sugriva, 960, 1, { eye: blink(t, 3), smile: -0.3, gaze: [0.5, -0.05], head: 0.08 }, L_DUSK, FS * 1.05); });
// B04 seven sala trees
function salaRow(c, t, k) { for (let i = 0; i < 7; i++) { const x = 880 + i * 120, h = 640 + (i % 3) * 60; stroke(c, x, BASE - 30, x + 6, BASE - 30 - h, 26, '#2a1c14'); dab(c, x, BASE - 30 - h, 90, 120, 0, '#1e3a24', 0.95); dab(c, x - 20, BASE - h, 70, 90, 0, '#2e5030', 0.9); if (k > (i + 1) / 8) dab(c, x, 1240, 18, 18, 0, '#ffe08a', 0.9); } }
qs(22, (c, u, p, sh, t, post) => { lfScene(c, 'forestDay', camOf(p)); const k = ease(u, 1.5, 3.2); salaRow(c, t, k); fig(c, CH.rama, 600, 1, k > 0 ? Object.assign({}, BOW, { eye: 1 }) : Object.assign({}, DRAW, { eye: 0.9 }), L_DAY);
  if (k > 0 && k < 1) { const x = lerp(700, 1800, k); arrow(c, x - 80, 1240, x, 1240); glow(c, x, 1240, 80, '#ffe08a', 0.6); } fig(c, CH.sugriva, 420, 1, { eye: 1.2, brow: -0.4, mouth: 0.3 * k }, L_DAY, FS * 0.92); post.ui = cc => hookLines(cc, u - 3.0, sh.card); });
qs(23, (c, u, p, sh, t) => { lfScene(c, 'forestDay', camOf(p, { z0: 1.05, z1: 1.09 })); fig(c, CH.rama, 1150, -1, { bow: 'B', eye: blink(t, 2), smile: 0.3 }, L_DAY); fig(c, CH.sugriva, 820, 1, Object.assign({}, NAMASTE, talk(sh, u, t, 3, 'sugriva')), L_DAY, FS * 0.95); });
qs(24, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.0, z1: 1.1, x0: 0, x1: 0 })); });
// Act II · B05 first duel
qs(25, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p)); const k = ease(u, sh.dur * 0.5, sh.dur); fig(c, CH.sugriva, 760, 1, { aN: [0.1, -0.2], aF: [0.1, -0.22], mouth: 0.8, brow: 1, lean: -0.1 }, L_DUSK, FS * 0.96); if (k > 0) fig(c, CH.vali, lerp(1500, 1150, k), -1, runPose(t * 6), L_DUSK, FS * 1.02); leafScreen(c, t, 1600, 2000); });
qs(26, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p)); fig(c, CH.sugriva, 860, 1, PUNCH(t * 4), L_DUSK, FS * 0.98); fig(c, CH.vali, 1080, -1, PUNCH(t * 4 + 2), L_DUSK, FS * 0.98);
  const k = ease(u, sh.dur * 0.35, sh.dur * 0.5); if (k > 0) { leafScreen(c, t, 1550, 2000); fig(c, CH.rama, 1450, -1, Object.assign({}, DRAW, { eye: 1, brow: 0.4 }), L_DUSK, FS * 0.9); } });
qs(27, (c, u, p, sh, t) => { lfScene(c, 'forestD', camOf(p)); const k = ease(u, 0, sh.dur); fig(c, CH.sugriva, lerp(1300, 600, k), -1, runPose(t * 5, { eye: 0.6, brow: -0.5 }), L_DUSK, FS * 0.96); for (let i = 0; i < 6; i++) dab(c, lerp(1300, 600, k) + i * 70, BASE - 5, 10, 4, 0, '#8a1010', 0.7); });
qs(28, (c, u, p, sh, t) => { lfScene(c, 'peakD', camOf(p, { z0: 1.04, z1: 1.08 })); fig(c, CH.rama, 1150, -1, { bow: 'B', eye: blink(t, 2), smile: -0.1, head: 0.05 }, L_DUSK); fig(c, CH.sugriva, 830, 1, Object.assign({ smile: -0.5, brow: -0.4, head: 0.12, aN: [0.1, 0.2] }, talk(sh, u, t, 3, 'sugriva')), L_DUSK, FS * 0.95); });
qs(29, (c, u, p, sh, t) => { lfScene(c, 'peakD', camOf(p, { z0: 1.06, z1: 1.1 })); fig(c, CH.rama, 1100, -1, Object.assign({ bow: 'B', aN: [0.2, 0.08], smile: 0.3 }, talk(sh, u, t, 2, 'rama')), L_DUSK); fig(c, CH.sugriva, 820, 1, { eye: blink(t, 3), smile: -0.2 }, L_DUSK, FS * 0.95);
  c.save(); c.globalAlpha = 0.5 * ease(u, sh.dur * 0.5, sh.dur * 0.7); fig(c, CH.vali, 1500, -1, { eye: 1 }, L_DUSK, FS * 0.8); fig(c, CH.sugriva, 1700, -1, { eye: 1 }, L_DUSK, FS * 0.8); c.restore(); });
const quoteShot = (c, u, p, sh, t, post) => { const n = sh.units.length, st = sentenceStarts(sh, n), at = n > 2 ? st[2] : Math.min(sh.dur - 2, st[1] + 4); wideQuote(c, u, t, post, sh.quote, at); };
[30, 42, 60, 66, 80, 93, 94, 95].forEach(id => qs(id, quoteShot));
qs(31, (c, u, p, sh, t) => { lfScene(c, 'forestDay', camOf(p, { z0: 1.0, z1: 1.15, x0: 0, x1: 40 })); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; dab(c, 1020 + Math.cos(a) * 26, 1280 + Math.sin(a) * 18, 18, 10, a, '#fbf6ea', 0.95); } dab(c, 1020, 1280, 10, 10, 0, '#e8b23a'); });
// B06 two garlands
qs(32, (c, u, p, sh, t) => { lfScene(c, 'forestDay', camOf(p)); const k = ease(u, sh.dur * 0.55, sh.dur * 0.8); fig(c, CH.rama, 1350, -1, { bow: 'B', aN: [0.2, 0.06], eye: blink(t, 2), smile: 0.4 }, L_DAY);
  fig(c, CH.lak, 1080, -1, { bow: 'B', aN: [lerp(0.1, 0.22, k), lerp(0.3, -0.05, k)], eye: blink(t, 5) }, L_DAY, FS * 0.95); fig(c, k >= 1 ? SUG_F : CH.sugriva, 800, 1, { eye: blink(t, 3), smile: 0.4 * k }, L_DAY, FS * 0.95); });
qs(33, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.0, z1: 1.04 })); fig(c, SUG_F, 760, 1, { eye: blink(t, 3) }, L_DUSK, FS * 1.05); fig(c, CH.vali, 1160, -1, { eye: blink(t, 1), smile: 0.2 }, L_GOLD, FS * 1.05);
  const g = ease(u, sh.dur * 0.35, sh.dur * 0.6); glow(c, 1150, 1180, 160, '#ffd65a', 0.4 * g); glow(c, 760, 1180, 140, '#ffffff', 0.25 * g); });
qs(34, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.12, z1: 1.2, x0: 120, x1: 140, y: 40 })); fig(c, CH.vali, 1160, -1, { eye: blink(t, 1) }, L_GOLD, FS * 1.05); glow(c, 1150, 1180, 180, '#ffd65a', 0.35 + 0.1 * Math.sin(t * 2)); });
// B07 Tara's warning
qs(35, (c, u, p, sh, t) => { const k = u < sh.dur * 0.45; if (k) { lfScene(c, 'gate', camOf(p)); fig(c, SUG_F, 960, 1, { aN: [0.1, -0.2], aF: [0.1, -0.22], mouth: 0.8, brow: 1 }, L_DUSK); }
  else { lfScene(c, 'inner', camOf(p)); fig(c, CH.vali, 960, 1, { brow: 1, smile: -0.5, eye: 1, aN: [0.14, 0.1], handN: 'fist' }, L_LAMP, FS * 1.03); } });
qs(36, (c, u, p, sh, t) => { lfScene(c, 'inner', camOf(p)); fig(c, CH.vali, 1150, -1, { brow: 0.9, eye: blink(t, 1) }, L_LAMP, FS * 1.03); fig(c, CH.tara, lerp(500, 800, ease(u, 0, sh.dur * 0.6)), 1, walkPose(t * 3, 0.3, { eye: blink(t, 6) }), L_LAMP, FS * 0.92); });
[37, 38, 39].forEach(id => qs(id, (c, u, p, sh, t) => { lfScene(c, 'inner', camOf(p, { z0: 1.04, z1: 1.08 })); fig(c, CH.vali, 1130, -1, { brow: id === 39 ? 0.4 : 0.8, eye: blink(t, 1), smile: -0.2 }, L_LAMP, FS * 1.03);
  fig(c, CH.tara, 840, 1, Object.assign(id === 39 ? NAMASTE : { aN: [0.16, 0.14], aF: [0.1, 0.2] }, talk(sh, u, t, 6, 'tara'), { smile: -0.2, brow: -0.3 }), L_LAMP, FS * 0.92); }));
qs(40, (c, u, p, sh, t) => { lfScene(c, 'inner', camOf(p, { z0: 1.1, z1: 1.16, x0: 120, x1: 140 })); fig(c, CH.vali, 1130, -1, { brow: 0.6, eye: blink(t, 1) }, L_LAMP, FS * 1.03); });
// B08
qs(41, (c, u, p, sh, t) => { lfScene(c, 'inner', camOf(p, { z0: 1.06, z1: 1.1 })); fig(c, CH.vali, 1100, -1, Object.assign({ aN: [0.18, 0.12], smile: 0.3 }, talk(sh, u, t, 1, 'vali')), L_LAMP, FS * 1.03); fig(c, CH.tara, 820, 1, { eye: blink(t, 6), smile: -0.3, brow: -0.4 }, L_LAMP, FS * 0.92); });
qs(43, (c, u, p, sh, t) => { lfScene(c, 'inner', camOf(p)); const a = t * 0.6; fig(c, CH.vali, 960, 1, { eye: blink(t, 1) }, L_LAMP, FS * 1.03); fig(c, CH.tara, 960 + Math.cos(a) * 260, Math.sin(a) > 0 ? -1 : 1, Object.assign({}, NAMASTE, { eye: 0.7, smile: -0.2, tear: 0.6 }), L_LAMP, FS * (0.88 + 0.05 * Math.sin(a))); for (let i = 0; i < 5; i++) torch(c, 380 + i * 290, 900, t, i, 0.6); });
qs(44, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p)); const k = ease(u, 0, sh.dur); fig(c, CH.vali, lerp(1500, 1200, k), -1, walkPose(t * 4, 0.42, { brow: 1 }), L_DUSK, FS * 1.03); fig(c, SUG_F, 760, 1, { brow: 0.8, eye: 1 }, L_DUSK); });
// B09 the arrow
qs(45, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p)); const tire = ease(u, sh.dur * 0.5, sh.dur); fig(c, SUG_F, 860 - 60 * tire, 1, Object.assign(PUNCH(t * (4 - 2 * tire)), { lean: 0.12 - 0.2 * tire }), L_DUSK); fig(c, CH.vali, 1080, -1, PUNCH(t * 4 + 2), L_DUSK); leafScreen(c, t, 1600, 2000); });
qs(46, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.0, z1: 1.06 })); const k = ease(u, sh.dur * 0.5, sh.dur * 0.62);
  fig(c, CH.vali, 1000 + 30 * k, -1, k >= 1 ? { lean: -0.3, aN: [-0.1, 0.1], eye: 1.3, mouth: 0.6 } : PUNCH(t * 4 + 2), L_DUSK); fig(c, SUG_F, 760, 1, { lean: -0.05, eye: 1 }, L_DUSK);
  leafScreen(c, t, 1640, 2000); fig(c, CH.rama, 1500, -1, Object.assign({}, DRAW, { eye: 1, brow: 0.5 }), L_DUSK, FS * 0.92); if (k > 0 && k < 1) arrow(c, lerp(1460, 1050, k) + 60, 1200, lerp(1460, 1050, k), 1200); });
qs(47, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p)); const k = ease(u, 0, 1.4); if (k < 1) { c.save(); c.translate(1000, BASE); c.rotate(-k * Math.PI / 2 * 0.95); c.translate(-1000, -BASE); fig(c, CH.vali, 1000, -1, { eye: 1, mouth: 0.4 }, L_DUSK); c.restore(); } else lyingVali(c, sh, u, t, 1000); });
qs(48, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.05, z1: 1.12, x0: 40, x1: 40 })); lyingVali(c, sh, u, t, 1000, L_GOLD); glow(c, 1000, BASE - 160, 220, '#ffd65a', 0.35 + 0.12 * Math.sin(t * 2.4)); });
qs(49, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p)); lyingVali(c, sh, u, t, 1000); const k = ease(u, 0, sh.dur); fig(c, CH.rama, lerp(1600, 1360, k), -1, walkPose(t * 2.6, 0.3, { bow: 'B' }), L_DUSK); fig(c, CH.lak, lerp(1780, 1540, k), -1, walkPose(t * 2.6 + 1, 0.3, { bow: 'B' }), L_DUSK, FS * 0.95); });
// Act III · B10-B13: Vali on the ground, Rama standing
const debate = (c, u, p, sh, t, z = [1.02, 1.06]) => { lfScene(c, 'gate', camOf(p, { z0: z[0], z1: z[1] })); lyingVali(c, sh, u, t, 900, L_DUSK);
  fig(c, CH.rama, 1300, -1, Object.assign({ bow: 'B', head: 0.08, gaze: [0.3, 0.15], smile: 0 }, talk(sh, u, t, 2, 'rama')), L_DUSK); fig(c, CH.lak, 1480, -1, { bow: 'B', eye: blink(t, 5), head: 0.06 }, L_DUSK, FS * 0.95); fig(c, SUG_F, 520, 1, { eye: blink(t, 3), head: 0.1, smile: -0.2 }, L_DUSK, FS * 0.92); };
[50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 61, 63, 64, 65, 67].forEach(id => qs(id, (c, u, p, sh, t) => debate(c, u, p, sh, t, id % 2 ? [1.02, 1.06] : [1.06, 1.1])));
qs(62, (c, u, p, sh, t, post) => { lfScene(c, 'gate', camOf(p, { z0: 1.0, z1: 1.08 })); leafScreen(c, t, 1500, 2000); lyingVali(c, sh, u, t, 900); post.ui = cc => hookLines(cc, u - 0.3, sh.card); });
qs(68, (c, u, p, sh, t) => debate(c, u, p, sh, t, [1.1, 1.14]));
qs(69, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.1, z1: 1.16 })); c.save(); c.translate(900, BASE - 60); c.rotate(-0.35); c.translate(-900, -(BASE - 60));
  fig(c, valiOf(69), 900, 1, Object.assign({}, NAMASTE, { sit: 1, eye: 0.6, smile: -0.1 }), L_DUSK, FS * 0.95); c.restore(); fig(c, CH.rama, 1300, -1, { bow: 'B', eye: blink(t, 2), head: 0.1, smile: 0.2 }, L_DUSK); });
[70, 71].forEach(id => qs(id, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.06, z1: 1.1 })); c.save(); c.translate(900, BASE - 60); c.rotate(-0.35); c.translate(-900, -(BASE - 60));
  fig(c, CH.vali, 900, 1, Object.assign({}, NAMASTE, { sit: 1, smile: -0.1, tear: id === 71 ? 0.7 : 0 }, talk(sh, u, t, 1, 'vali')), L_DUSK, FS * 0.95); c.restore(); fig(c, CH.rama, 1300, -1, { bow: 'B', eye: blink(t, 2), head: 0.1, smile: 0.2 }, L_DUSK); }));
qs(72, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p)); lyingVali(c, sh, u, t, 900); fig(c, CH.tara, lerp(300, 620, ease(u, 0, sh.dur)), 1, runPose(t * 5, { eye: 1.1, brow: -0.5 }), L_DUSK, FS * 0.92); });
// Act IV · B14-B16
qs(73, (c, u, p, sh, t) => { lfScene(c, 'forestD', camOf(p)); for (let i = 0; i < 4; i++) fig(c, CH.vanara, lerp(700 + i * 120, 300 + i * 120, ease(u, 0, sh.dur)), -1, runPose(t * 6 + i), L_DUSK, FS * 0.8);
  fig(c, CH.tara, lerp(900, 1300, ease(u, sh.dur * 0.3, sh.dur)), 1, runPose(t * 5, { eye: 1.1 }), L_DUSK, FS * 0.92); });
const grief = (c, u, p, sh, t, z = [1.04, 1.08]) => { lfScene(c, 'gate', camOf(p, { z0: z[0], z1: z[1] })); lyingVali(c, sh, u, t, 960, L_DUSK);
  fig(c, CH.tara, 740, 1, Object.assign({ sit: 0.8, aN: [0.18, 0.2], aF: [0.16, 0.22], smile: -0.6, brow: -0.6, tear: 0.8 }, talk(sh, u, t, 6, 'tara')), L_DUSK, FS * 0.9);
  fig(c, CH.angada, 1200, -1, Object.assign({ sit: 0.7, smile: -0.5, tear: 0.8, head: 0.1 }, talk(sh, u, t, 8, 'angada')), L_DUSK, FS * 0.82); };
[74, 75, 86, 88].forEach(id => qs(id, (c, u, p, sh, t) => grief(c, u, p, sh, t)));
qs(87, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.1, z1: 1.16, x0: 80, x1: 80 })); lyingVali(c, sh, u, t, 960, L_DUSK, { eye: 0 }); fig(c, CH.angada, 1180, -1, Object.assign({ sit: 1, aN: [0.24, 0.3], aF: [0.22, 0.32], tear: 0.9, smile: -0.5 }, talk(sh, u, t, 8, 'angada')), L_DUSK, FS * 0.82); });
const farewell = (c, u, p, sh, t, z) => { lfScene(c, 'gate', camOf(p, { z0: z[0], z1: z[1] })); lyingVali(c, sh, u, t, 960, L_DUSK);
  fig(c, sugOf(sh.id), 1280, -1, { sit: 0.6, eye: blink(t, 3), smile: -0.5, tear: 0.6, head: 0.12, aN: sh.id === 81 ? [0.2, 0.2] : undefined }, L_DUSK, FS * 0.9);
  fig(c, CH.tara, 620, 1, { sit: 0.8, eye: blink(t, 6), smile: -0.5, tear: 0.6 }, L_DUSK, FS * 0.88); if (sh.id === 78 || sh.id === 84) fig(c, CH.angada, 800, 1, { sit: 0.9, smile: -0.6, tear: 0.9, head: 0.15 }, L_DUSK, FS * 0.8); };
qs(76, (c, u, p, sh, t) => farewell(c, u, p, sh, t, [1.0, 1.06]));
[77, 78, 79, 81, 84].forEach(id => qs(id, (c, u, p, sh, t) => farewell(c, u, p, sh, t, id % 2 ? [1.04, 1.08] : [1.06, 1.1])));
qs(82, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.08, z1: 1.22, x0: 180, x1: 260, y: 40 })); lyingVali(c, sh, u, t, 960, L_DUSK);
  fig(c, SUG_G, 1280, -1, { sit: 0.6, eye: 0.7, smile: -0.4, tear: 0.7, head: 0.12 }, L_GOLD, FS * 0.9); glow(c, 1280, 1230, 200, '#ffd65a', 0.4 + 0.15 * Math.sin(t * 2)); });
qs(83, (c, u, p, sh, t) => { lfScene(c, 'forestN', camOf(p)); const k = ease(u, 0, sh.dur); dab(c, 1420, 700, 46, 46, 0, '#f4edd2'); dab(c, 1420 + lerp(90, 10, k), 700, 46, 46, 0, '#0a0c24');
  fig(c, SUG_G, 960, 1, { eye: 0.6, smile: -0.6, tear: 0.8, head: 0.15 }, L_NIGHT, FS * 1.04); });
qs(85, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.0, z1: 1.08 })); lyingVali(c, sh, u, t, 960, L_NIGHT, { eye: lerp(0.3, 0, ease(u, 0.5, 2)) });
  fig(c, SUG_G, 1280, -1, { sit: 0.6, eye: 0.4, smile: -0.6, tear: 0.8, head: 0.2 }, L_NIGHT, FS * 0.9); fig(c, CH.tara, 620, 1, { sit: 0.8, eye: 0.4, smile: -0.6, tear: 0.8, head: 0.2 }, L_NIGHT, FS * 0.88); });
// B17 the fire and the rains
qs(89, (c, u, p, sh, t) => { lfScene(c, 'river', camOf(p)); const k = ease(u, sh.dur * 0.4, sh.dur);
  for (let i = 0; i < 5; i++) stroke(c, 800, BASE - 40 - i * 22, 1120, BASE - 40 - i * 22 + (i % 2) * 8, 18, '#5a3a22'); if (k > 0.6) fire(c, 960, BASE - 140, 120, 300, t, 4, 8, ease(k, 0.6, 1));
  fig(c, CH.angada, 700, 1, { eye: 0.6, smile: -0.5, tear: 0.6 }, L_FIRE, FS * 0.85); fig(c, SUG_G, 1250, -1, { eye: 0.6, smile: -0.5 }, L_FIRE, FS * 0.92); embers(c, t, 5, 30 * k, 960, BASE - 200, 160, k); });
qs(90, (c, u, p, sh, t) => { lfScene(c, 'river', camOf(p, { z0: 1.04, z1: 1.08 })); fire(c, 960, BASE - 140, 120, 300, t, 4, 8); embers(c, t, 5, 30, 960, BASE - 200, 160);
  fig(c, CH.rama, 1350, -1, { bow: 'B', eye: 0.7, smile: -0.2, head: 0.1 }, L_FIRE); fig(c, SUG_G, 600, 1, { eye: 0.6, smile: -0.5, tear: 0.5 }, L_FIRE, FS * 0.92); });
qs(91, (c, u, p, sh, t) => { if (u < sh.dur * 0.5) { lfScene(c, 'gate', camOf(p)); fig(c, SUG_K, 860, 1, { eye: blink(t, 3), smile: 0.2 }, L_GOLD); fig(c, CH.angada, 1080, -1, Object.assign({}, NAMASTE, { eye: blink(t, 8) }), L_GOLD, FS * 0.85); petals(c, t, 3, 30, 0.6, 500); }
  else { lfScene(c, 'peakD', camOf(p)); fig(c, CH.lak, 1150, -1, { bow: 'B', eye: blink(t, 5) }, L_DUSK, FS * 0.95); fig(c, CH.rama, 960, -1, { bow: 'B', eye: blink(t, 2), gaze: [0.5, 0] }, L_DUSK); } });
qs(92, (c, u, p, sh, t) => { lfScene(c, 'peakD', camOf(p, { z0: 1.0, z1: 1.06 })); fig(c, CH.lak, 1150, -1, { bow: 'B', eye: blink(t, 5) }, L_NIGHT, FS * 0.95); fig(c, CH.rama, 960, -1, { bow: 'B', eye: blink(t, 2), gaze: [0.5, -0.1] }, L_NIGHT); rain(c, t, ease(u, 0, 1.5)); });
// B18 outro
qs(96, (c, u, p, sh, t) => { lfScene(c, 'gate', camOf(p, { z0: 1.06, z1: 1.14, x0: 120, x1: 160 })); lyingVali(c, sh, u, t, 960, L_GOLD); fig(c, SUG_G, 1280, -1, { sit: 0.6, eye: 0.7, smile: -0.4 }, L_GOLD, FS * 0.9); glow(c, 1280, 1230, 200, '#ffd65a', 0.4); });
qs(97, (c, u, p, sh, t, post) => { lfScene(c, 'gate', camOf(p)); lyingVali(c, sh, u, t, 900); fig(c, CH.rama, 1300, -1, { bow: 'B', eye: blink(t, 2), head: 0.08 }, L_DUSK);
  post.ui = cc => { const a = ease(u, 0.4, 1.0); text(cc, "VALI'S QUESTION", 520, 190, { size: 58, weight: 900, color: C_IVORY, alpha: a, stroke: 8 }); text(cc, 'VS', CX, 190, { size: 44, font: 'Montserrat', weight: 800, color: C_GOLD, alpha: a, stroke: 6 }); text(cc, "RAMA'S ANSWER", 1400, 190, { size: 58, weight: 900, color: C_IVORY, alpha: a, stroke: 8 }); }; });
qs(98, wideEnd);

// ---------- dispatch: every shot gets its act title (first shot of an act) and its verse chip ----------
const SHOTS = {};
function buildScenes() { let lastAct = -1;     // TL is loaded by now
  (TL.shots || []).forEach(sh => { const first = sh.act !== lastAct; lastAct = sh.act; const actInfo = (TL.acts || [])[sh.act];
    SHOTS[sh.id] = (c, u, p, s, t, post) => { (S_[s.id] || ((cc) => lfScene(cc, 'forestD', camOf(p))))(c, u, p, s, t, post);
      const inner = post.ui; post.ui = cc => { if (inner) inner(cc); if (first && actInfo && actInfo.n > 0) actTitle(cc, u, actInfo); if (s.cite && !s.quote && !s.sloka && s.id !== 98) chip(cc, s.cite, ease(u, 0.3, 0.8)); }; }; }); }

// ---- derived reel A36 (from LF01): each shot is drawn by the wide shot it came from (timeline art_from) ----
const _buildWide = buildScenes; buildScenes = function () { _buildWide(); (TL.shots || []).forEach(sh => { const from = sh.art_from; if (!from || !S_[from]) return;
  SHOTS[sh.id] = (c, u, p, s, t, post) => { S_[from](c, u, p, Object.assign({}, s, { id: from }), t, post); const inner = post.ui;
    post.ui = cc => { if (inner && !s.card) inner(cc); if (s.card) hookLines(cc, u, s.card); if (s.cite && !s.quote && !s.sloka && !s.cta) chip(cc, s.cite, ease(u, 0.3, 0.8)); }; }; }); };
