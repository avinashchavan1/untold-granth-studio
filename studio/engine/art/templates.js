// ===== storyreel-studio art library: card templates (source card, verse card, quote card, title shot, end card) =====
// ===== templates & shared helpers — reusable by every reel =====

const L_DUSK = { rim: '#f4b48c', rimA: 0.85, dir: 1, tint: '#262060', tintA: 0.2 };
const L_NIGHT = { rim: '#c2ccff', rimA: 0.85, dir: 1, tint: '#141c5c', tintA: 0.3 };
const L_FOREST = { rim: '#f0bfe0', rimA: 0.85, dir: 1, tint: '#1c1456', tintA: 0.28 };
const L_LAMP = { rim: '#ffc878', rimA: 0.9, dir: 1, tint: '#40182c', tintA: 0.14 };
const L_FIRE = { rim: '#ff6a34', rimA: 0.95, dir: 1, tint: '#4a0810', tintA: 0.34 };

function leaves(ctx, tau, seed, n, col = '#2e6068') {
  for (let i = 0; i < n; i++) {
    const h1 = hash(seed + i * 2.1), h2 = hash(seed + i * 6.3), h3 = hash(seed + i * 9.9);
    const x = ((h1 * 1300 - 100 - tau * (40 + h2 * 60)) % 1300 + 1300) % 1300 - 110 + Math.sin(tau * 2 + i) * 30, y = ((h2 * 1500 + tau * (90 + h3 * 80)) % 1500) + 60, a = tau * (1.5 + h3 * 2) + i;
    dab(ctx, x, y, 13 + h3 * 9, 5 + h1 * 3, a, mix(col, '#0a1a28', h3 * 0.6), 0.9);
  }
}
function arrow(ctx, x1, y1, x2, y2, a = 1) {
  const ang = Math.atan2(y2 - y1, x2 - x1); ctx.save(); ctx.globalAlpha = a;
  stroke(ctx, x1, y1, x2, y2, 6, '#d8c8a8'); ctx.translate(x2, y2); ctx.rotate(ang); poly(ctx, [[10, 0], [-18, -10], [-18, 10]], '#e8ecf4'); ctx.restore();
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x1, y1); ctx.rotate(ang); poly(ctx, [[0, 0], [-10, -13], [34, -13], [44, 0]], '#c81e1e'); poly(ctx, [[0, 0], [-10, 13], [34, 13], [44, 0]], '#e8e0d0'); ctx.restore();
}
function tongue(ctx, x, y, w, h, sway, col, a = 1) { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.bezierCurveTo(x - w * 1.2, y - h * 0.45, x + sway - w * 0.2, y - h * 0.7, x + sway, y - h); ctx.bezierCurveTo(x + sway + w * 0.3, y - h * 0.6, x + w * 1.2, y - h * 0.4, x + w, y); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
function fire(ctx, cx, base, w, h, t, seed, n, a = 1) {
  if (a <= 0) return;
  glow(ctx, cx, base - h * 0.4, Math.max(w, h) * 1.25, '#ff3a14', 0.5 * a);
  [['#8a1010', 1.0, 1.0], ['#d6301a', 0.85, 0.85], ['#f2741e', 0.62, 0.66], ['#ffc64a', 0.38, 0.44], ['#fff0b0', 0.16, 0.2]].forEach(([col, hs, ws], li) => {
    for (let i = 0; i < n; i++) {
      const h1 = hash(seed + i * 3.7 + li * 13), px = cx + (i / (n - 1) - 0.5) * w * 2 * (0.95 - li * 0.08) + noise1(t * 2 + i * 5 + li) * 22, env = 1 - Math.pow(Math.abs(i / (n - 1) - 0.5) * 2, 2) * 0.55;
      const hh = h * hs * env * (0.62 + 0.38 * (0.5 + 0.5 * noise1(t * (5 + h1 * 4) + i * 9 + li * 3)));
      tongue(ctx, px, base, w / n * 1.7 * ws + 12, hh, noise1(t * 3.5 + i * 2.2 + li) * w * 0.14, col, a * 0.95);
    }
  });
}
function embers(ctx, t, seed, n, cx, base, spread, a = 1) {
  for (let i = 0; i < n; i++) { const h1 = hash(seed + i * 1.9), h2 = hash(seed + i * 4.1), life = (t * (0.35 + h2 * 0.5) + h1 * 5) % 1, x = cx + (h1 - 0.5) * spread * 2 + Math.sin(t * 3 + i) * 40 * life, y = base - life * (700 + h2 * 700); dab(ctx, x, y, 3 + h2 * 4, 3 + h2 * 4, 0, life < 0.4 ? '#ffe08a' : '#ff6a2a', (1 - life) * a); }
}
function ringEcho(ctx, x, y, t, a) { for (let i = 0; i < 4; i++) { const p = (t * 0.9 + i / 4) % 1, r = 70 + p * 520; ctx.globalAlpha = (1 - p) * 0.6 * a; ctx.strokeStyle = '#f6e6ff'; ctx.lineWidth = 10 * (1 - p) + 3; ctx.beginPath(); ctx.arc(x, y, r, -1.25, 0.35); ctx.stroke(); } ctx.globalAlpha = 1; }
function hermitage(ctx, bg, cam, t, mid, motion = 1, tau) {
  drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far); withCam(ctx, cam, bg.far.depth, c => riverLive(c, tau === undefined ? t : tau, bg.tod, motion)); drawLayer(ctx, cam, bg.mid);
  if (mid) withCam(ctx, cam, 0.6, mid);
}
const stand = o => P(o);


function ensureScene(key, make) { if (!BG[key]) BG[key] = make(); return BG[key]; }

// SOURCE CARD — palm-leaf manuscript with the reel's citation. opts: {title:[l1,l2], sub, edition}
function sourceCard(ctx, u, p, sh, t, post, opts) {
  const bg = ensureScene('ms', buildManuscript), cam = { z: lerp(1.0, 1.11, p), y: lerp(-20, 30, p) };
  drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms);
  withCam(ctx, cam, 0.8, c => { flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3); for (let i = 0; i < 26; i++) { const h1 = hash(i * 2.9), h2 = hash(i * 8.1); dab(c, 120 + h1 * 840 + Math.sin(t * 0.5 + i) * 30, 700 + ((h2 * 800 - t * (10 + h1 * 16)) % 800 + 800) % 800, 2.5, 2.5, 0, '#ffd890', 0.25 + 0.3 * Math.sin(t * 2 + i * 3) ** 2); } });
  ctx.fillStyle = rgba('#f4a03a', 0.05 + 0.03 * noise1(t * 8)); ctx.fillRect(0, 0, W, H);
  post.ui = c => {
    const a = ease(u, 0.15, 0.6), dy = (1 - easeOut(map(u, 0.15, 0.7))) * 30;
    text(c, opts.title[0], 540, 400 + dy, { size: 104, weight: 900, color: C_GOLD, ls: 8, alpha: a, stroke: 8, shadow: 30 });
    text(c, opts.title[1], 540, 506 + dy, { size: 104, weight: 900, color: C_GOLD, ls: 8, alpha: a, stroke: 8, shadow: 30 });
    const w = 380 * ease(u, 0.4, 1.0); c.fillStyle = rgba(C_IVORY, 0.8 * a); c.fillRect(540 - w, 548, w * 2, 3);
    text(c, opts.sub, 540, 618, { size: 39, font: 'Montserrat', weight: 700, color: C_IVORY, ls: 4, alpha: ease(u, 0.5, 1.0), stroke: 6 });
    if (opts.edition) text(c, opts.edition, 540, 672, { size: 30, font: 'Montserrat', weight: 700, color: C_GOLD, ls: 6, alpha: ease(u, 0.7, 1.2), stroke: 5 });
  };
}

// END CARD — the series' three leads (CH.brother, CH.heroine, CH.hero; override CH entries or endCard in series art) at the hermitage + series title, tagline and the platform's call to action (FOLLOW on Instagram/Facebook, SUBSCRIBE on YouTube)
const CTA = Object.assign({ button: 'FOLLOW' }, (SERIES.cta || {})[typeof PLATFORM !== 'undefined' ? PLATFORM : 'instagram'] || {});
function endCard(ctx, u, p, sh, t, post) {
  const bg = ensureScene('herE', () => buildHermitage('end')), cam = { z: lerp(1.03, 1.08, p), y: 40 };
  hermitage(ctx, bg, cam, t);
  withCam(ctx, cam, 0.9, c => {
    const br = Math.sin(t * 1.6) * 0.012, L = Object.assign({}, L_NIGHT, { tint: '#2a1c58', tintA: 0.16, rim: '#e6dcff' });
    drawFigure(c, CH.brother, P({ bow: 'B', eye: blink(t, 1), smile: 0.6, gaze: [0.5, 0], pleat: br, head: -0.02 }), { x: 262, y: 1404, s: 575, face: 1 }, L);
    drawFigure(c, CH.heroine, P({ aN: [0.06, 0.25], aF: [0.085, 0.25], eye: blink(t, 4), smile: 0.75, gaze: [0.5, 0], head: -0.02 }), { x: 820, y: 1402, s: 555, face: -1 }, L);
    drawFigure(c, CH.hero, P({ bow: 'F', aF: [0.17, 0.15], handF: 'hold', eye: blink(t, 7), smile: 0.7, gaze: [0.3, 0], pleat: br * 1.4, head: -0.03 }), { x: 545, y: 1412, s: 610, face: 1 }, L);
    fireflies(c, t, 5, 18, [40, 800, 1000, 700], 0.9);
  });
  drawLayer(ctx, cam, bg.fg);
  const g = ctx.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, 'rgba(5,6,22,0.72)'); g.addColorStop(1, 'rgba(5,6,22,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 760);
  post.noLogo = true;
  post.ui = c => {
    const a = ease(u, 0.1, 0.6), s = lerp(1.12, 1, easeOut(map(u, 0.1, 0.7)));
    c.save(); c.translate(540, 360); c.scale(s, s); glow(c, 0, 30, 520, '#f6c244', 0.14 * a);
    text(c, SERIES.title[0], 0, 0, { size: 122, weight: 900, color: C_GOLD, ls: 14, alpha: a, stroke: 9, shadow: 34 }); text(c, SERIES.title[1], 0, 128, { size: 122, weight: 900, color: C_GOLD, ls: 6, alpha: a, stroke: 9, shadow: 34 }); c.restore();
    const w = 300 * ease(u, 0.5, 1.0); c.fillStyle = rgba(C_IVORY, 0.85); c.fillRect(540 - w, 528, w * 2, 3);
    if (SERIES.series_name) { const q = ease(u, 0.3, 0.8); text(c, SERIES.series_name + ' SERIES', 540, 210, { size: 34, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 8, alpha: q, stroke: 6 }); c.fillStyle = rgba(C_GOLD, 0.8 * q); c.fillRect(380, 232, 320, 3); }
    text(c, SERIES.tagline, 540, 598, { size: 39, font: 'Montserrat', weight: 600, italic: true, color: C_IVORY, alpha: ease(u, 0.6, 1.1), stroke: 6 });
    const b = backOut(map(u, 0.9, 1.35)); if (b > 0) { const pu = 1 + Math.sin(u * 5) * 0.025; c.save(); c.translate(540, 1560); c.scale(b * pu, b * pu); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 26; c.shadowOffsetY = 8; const label = CTA.button, fsz = label.length > 7 ? 50 : 56; c.font = `800 ${fsz}px Montserrat`; c.letterSpacing = '7px'; const tw = c.measureText(label).width, bw = Math.max(460, tw + 200), x0 = -bw / 2;
      c.fillStyle = C_RED; c.beginPath(); c.roundRect(x0, -62, bw, 124, 62); c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = C_GOLD; c.lineWidth = 5; c.stroke();
      c.fillStyle = C_IVORY; c.fillRect(x0 + 40, -5, 44, 10); c.fillRect(x0 + 57, -22, 10, 44); text(c, label, x0 + 104 + tw / 2, fsz * 0.36, { size: fsz, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 7, shadow: 0 }); c.restore(); }
    const handles = CTA.handles_line || SERIES.handles_line;
    if (handles) [].concat(handles).forEach((l, i) => text(c, l, 540, 1680 + i * 44, { size: 30, font: 'Montserrat', weight: 700, color: C_IVORY, ls: 2, alpha: ease(u, 1.1, 1.6), stroke: 5 }));
  };
}

// TITLE SHOT — generic painted backdrop + big staggered lines (hooks, reveals, "NOT IN THE TEXT" beats).
// lines: [[text, colour?], ...]  · appear on the narrator's sentence starts when the shot has several sentences
function titleShot(ctx, u, p, sh, t, post, lines, scene = 'herN') {
  const bg = ensureScene(scene, () => buildHermitage(scene === 'herD' ? 'dusk' : scene === 'herE' ? 'end' : 'night')), cam = { z: lerp(1.0, 1.08, p), y: lerp(0, 24, p) };
  hermitage(ctx, bg, cam, t); drawLayer(ctx, cam, bg.fg);
  ctx.fillStyle = rgba('#05061a', 0.35); ctx.fillRect(0, 0, W, H);
  const st = sentenceStarts(sh, Math.min(lines.length, (sh.sent || [0]).length || 1));
  post.ui = c => lines.forEach(([s, col], i) => {
    const a = ease(u, (st[Math.min(i, st.length - 1)] || 0.2) + 0.08 * i - 0.05, (st[Math.min(i, st.length - 1)] || 0.2) + 0.08 * i + 0.35);
    if (a > 0) text(c, s, 540, 760 + i * 118 + (1 - a) * 22, { size: 92, weight: 900, color: col || C_IVORY, ls: 5, alpha: a, stroke: 9, shadow: 30 });
  });
}

// a figure asleep on the ground or a couch: feet at (x, y), head to the left (rotated rig; no ground shadow)
function lying(c, ch, x, y, s, pose, light) {
  c.save(); c.translate(x, y - s * 0.07); c.rotate(-Math.PI / 2);
  drawFigure(c, ch, P(Object.assign({ eye: 0.05, smile: 0.1, aN: [0.04, 0.3], aF: [0.05, 0.3] }, pose)), { x: 0, y: 0, s, face: 1 }, Object.assign({}, light, { shadow: 0 }));
  c.restore();
}

// flowers raining from the sky (gods' blessing)
function petals(c, t, seed, n, a = 1, top = -100) {
  for (let i = 0; i < n; i++) {
    const h1 = hash(seed + i * 1.7), h2 = hash(seed + i * 4.3), y = top + ((t * (90 + h2 * 80) + h1 * 2100) % 2100), x = h1 * 1240 - 80 + Math.sin(t * 1.3 + i) * 40;
    const col = ['#f4a6bc', '#ffd0dc', '#f6d27a', '#ffffff', '#e88aa8'][i % 5];
    dab(c, x, y, 9 + h2 * 6, 5 + h2 * 3, t * (1 + h1) + i, col, 0.9 * a); dab(c, x + 2, y - 1, 4, 2.5, t + i, '#fff6e8', 0.6 * a);
  }
}
// a war chariot seen from the side: wheel, platform, pole-flag; riders are drawn by the caller
function chariot(c, x, y, s, face = 1, col = '#8a5a2a', flag = '#c41e1e') {
  c.save(); c.translate(x, y); c.scale(face * s, s);
  blob(c, [[-0.9, -0.55], [0.7, -0.55], [0.9, -0.2], [-0.9, -0.2]], col, 1, 0.2); stroke(c, -0.9, -0.55, 0.7, -0.55, 0.05, '#e6b450', 1);
  for (let k = 0; k < 5; k++) stroke(c, -0.8 + k * 0.36, -0.52, -0.8 + k * 0.36, -0.22, 0.02, '#3a2414', 0.6);
  c.lineWidth = 0.07; c.strokeStyle = '#4a2e1a'; c.beginPath(); c.arc(-0.3, -0.1, 0.42, 0, TAU); c.stroke();
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; stroke(c, -0.3, -0.1, -0.3 + Math.cos(a) * 0.4, -0.1 + Math.sin(a) * 0.4, 0.03, '#6a4428', 1); }
  dab(c, -0.3, -0.1, 0.07, 0.07, 0, '#e6b450'); stroke(c, -0.9, -0.55, -1.0, -1.9, 0.03, '#5a3a24', 1);
  blob(c, [[-1.0, -1.9], [-0.5, -1.8], [-0.62, -1.68], [-0.5, -1.55], [-1.0, -1.6]], flag, 1, 0.2);
  c.restore();
}

// Opening śloka + source card (shot 2 of every reel). S = { lines: [two Devanagari half-verses], ref: 'BOOK 5 · 5.9.2', en: 'translation' }.
// Unit 1 ("<source>, <book>, <chapter>।") shows the source card; from unit 2 (the verse, recited with feeling) the verse card.
function slokaSource(ctx, u, p, sh, t, post, S) {
  // order: the source line first (source card), then the śloka recited with feeling (verse card), then "ये है असली कहानी"
  const st = sentenceStarts(sh, 3), cut = Math.max(1.2, st[1] - 0.25);
  if (u < cut) return sourceCard(ctx, u, p, sh, t, post, TL.source_card);
  const p0 = p; u = u - cut; const len = Math.max(2, sh.dur - cut);
  const bg = ensureScene('ms', buildManuscript), cam = { z: lerp(1.02, 1.1, u / len), y: 10 };
  drawLayer(ctx, cam, bg.bg); withCam(ctx, cam, 0.8, c => { glow(c, 540, 700, 560, '#ffd890', 0.14); flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3); });
  ctx.fillStyle = rgba('#05061a', 0.45); ctx.fillRect(0, 0, W, H);
  post.ui = c => {
    const q0 = ease(u, 0.05, 0.45); if (q0 > 0) { text(c, (SERIES.source_title || 'THE SOURCE').toUpperCase(), 540, 330, { size: 70, weight: 900, color: C_GOLD, ls: 6, alpha: q0, stroke: 9, shadow: 30 }); text(c, S.ref, 540, 392, { size: 34, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 5, alpha: q0, stroke: 5 }); }
    const q1 = ease(u, 0.25, 0.8); if (q1 > 0) S.lines.forEach((l, i) => textFit(c, l, 540, 540 + i * 112 + (1 - q1) * 14, { size: 76, font: 'Mukta', weight: 700, color: C_GOLD, alpha: q1, stroke: 8, shadow: 30 }, 980));
    const q2 = ease(u, Math.min(len * 0.4, 3.0), Math.min(len * 0.4, 3.0) + 0.5); if (q2 > 0) { const w = S.en.split(' '), h = Math.ceil(w.length / 2);
      [w.slice(0, h).join(' '), w.slice(h).join(' ')].forEach((l, i) => textFit(c, l, 540, 800 + i * 60, { size: 44, font: 'Montserrat', weight: 800, color: C_IVORY, alpha: q2, stroke: 6, shadow: 20 }, 960)); }
  };
}

// Quote card for a later source's exact words (Ramcharitmanas, Chalisa...). u = seconds since the quote started.
// Q = { source: 'LATER RETELLING', ref: 'CHAPTER 101.3', lines: [2 Devanagari lines], translit, en, enAt (s, when the translation appears) }
function quoteCard(ctx, u, sh, t, post, Q) {
  const bg = ensureScene('ms', buildManuscript), cam = { z: lerp(1.03, 1.1, Math.min(1, u / 8)), y: 10 };
  drawLayer(ctx, cam, bg.bg); withCam(ctx, cam, 0.8, c => { glow(c, 540, 700, 560, '#ffd890', 0.12); flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3); });
  ctx.fillStyle = rgba('#05061a', 0.45); ctx.fillRect(0, 0, W, H);
  post.ui = c => {
    const q0 = ease(u, 0.05, 0.4); if (q0 > 0) { text(c, Q.source, 540, 330, { size: 72, weight: 900, color: C_GOLD, ls: 6, alpha: q0, stroke: 9, shadow: 30 }); text(c, Q.ref, 540, 394, { size: 34, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 5, alpha: q0, stroke: 5 }); }
    const q1 = ease(u, 0.2, 0.7); if (q1 > 0) { Q.lines.forEach((l, i) => textFit(c, l, 540, 560 + i * 116 + (1 - q1) * 14, { size: 84, font: 'Mukta', weight: 700, color: C_GOLD, alpha: q1, stroke: 8, shadow: 30 }, 980));
      const tl = Q.translit.length > 80 && Q.translit.includes(', ') ? Q.translit.split(', ') : [Q.translit];      // long verses: one line per half
      tl.forEach((l, i) => textFit(c, l + (i < tl.length - 1 ? ',' : ''), 540, 790 + i * 44 - (tl.length - 1) * 10, { size: 33, font: 'Montserrat', weight: 600, color: C_IVORY, alpha: 0.85 * q1, stroke: 5 }, 960)); }
    const at = Q.enAt || 3.5, q2 = ease(u, at, at + 0.45); if (q2 > 0) { const w = Q.en.split(' '), h = Math.ceil(w.length / 2);
      [w.slice(0, h).join(' '), w.slice(h).join(' ')].forEach((l, i) => textFit(c, l, 540, 905 + i * 60, { size: 44, font: 'Montserrat', weight: 800, color: C_IVORY, alpha: q2, stroke: 6, shadow: 20 }, 960)); }
  };
}
