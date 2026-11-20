// ===== Reel A53 — "How Ravana Actually Died" — 11 shots (CE Yuddha 6.96-97; Ramcharitmanas Lanka 101-102) =====
// Rama severs Ravana's head, an identical one appears (6.96.20-21); a hundred heads, no end (6.96.22-24);
// Matali reminds Rama: the Brahmastra (6.97.1-3); it strikes the chest and pierces the heart (6.97.16-17).
// The navel nectar and the 31 arrows are from Tulsidas's Ramcharitmanas (Lanka 101.3, doha 102).
// Severed heads are shown as a flash of light and a head re-forming: no gore.
function buildScenes() { BG.war = buildBattlefield(); BG.ms = buildManuscript(); }
const L_WAR = { rim: '#ff9a5a', rimA: 0.9, dir: 1, tint: '#3a0a10', tintA: 0.22 };
const MEMORY = { tint: '#c89a5a', tintA: 0.55, rim: '#ffe0a0', rimA: 0.7, dir: 1, shadow: 0.3 };
const RV = [800, WAR_GROUND - 30];                       // Ravana's chariot (right)
const RM = [250, WAR_GROUND + 40];                       // Rama's chariot (left)
const RS = 230, RB = RV[1] - 110;                         // Ravana's scale and base on his chariot
const headXY = i => [RV[0] + RS * (i - 4.5) * 0.208, RB + RS * (-1.4 + (i - 4.5) ** 2 * 0.004)];
const BOW = [RM[0] + 200, RM[1] - 525];                   // arrows leave Rama's bow here

function ramaChariot(c, t, pose) {
  chariot(c, RM[0], RM[1], 260, 1, '#b08a3a', '#e6b450');
  drawFigure(c, CH.matali, P({ sit: 1, aN: [0.3, 0.05], aF: [0.3, 0.08], handN: 'hold', handF: 'hold', eye: blink(t, 6), gaze: [0.6, 0] }), { x: RM[0] + 150, y: RM[1] - 150, s: 380, face: 1 }, L_WAR);
  drawFigure(c, CH.rama, P(Object.assign({ bow: 'N', aN: [0.18, -0.02], bowAng: 0.0, aF: [0.2, -0.05], handF: 'fist', head: 0.0, eye: blink(t, 5), brow: 0.35, gaze: [0.6, 0] }, pose || {})), { x: RM[0] - 20, y: RM[1] - 140, s: 560, face: 1 }, L_WAR);
}
function ravanaChariot(c, t, opts = {}) {
  const fall = opts.fall || 0, a = opts.a === undefined ? 1 : opts.a;
  chariot(c, RV[0] + 60, RV[1] + 40, 300, -1, '#4a1a20', '#7a1a1a');
  c.save(); c.globalAlpha = a; c.translate(RV[0], RB + fall * 260); c.rotate(-fall * 1.2); c.translate(-RV[0], -RB);
  drawRavana(c, RV[0], RB, RS, t, (1 - fall) * (opts.glow === undefined ? 1 : opts.glow), 0, opts.hs);
  c.restore();
}
// one arrow streak from Rama's bow to head i (k = flight 0..1)
function shaft(c, i, k, a = 1) {
  if (k <= 0 || k >= 1) return; const [hx, hy] = headXY(i), x = lerp(BOW[0], hx, k), y = lerp(BOW[1], hy, k) - Math.sin(k * Math.PI) * 50;
  stroke(c, x - 70, y + (hy - BOW[1]) * 0.06, x, y, 5, '#ffe8b8', 0.9 * a); glow(c, x, y, 30, '#fff0c0', 0.6 * a);
}
// head i struck at ts (flash of light), re-formed at tr (gold ring)
function strikeFX(c, i, u, ts, tr) {
  const [hx, hy] = headXY(i), f = ease(u, ts, ts + 0.08) * (1 - ease(u, ts + 0.1, ts + 0.6)), g = ease(u, tr, tr + 0.45) * (1 - ease(u, tr + 0.5, tr + 1.2));
  if (f > 0) { glow(c, hx, hy, 120, '#fff4d0', 0.9 * f); for (let j = 0; j < 10; j++) { const an = j * 0.628 + i, d = 30 + 90 * map(u, ts, ts + 0.6); dab(c, hx + Math.cos(an) * d, hy + Math.sin(an) * d, 5, 5, 0, '#ffd890', 0.8 * f); } }
  if (g > 0) { glow(c, hx, hy, 80, '#f6c244', 0.55 * g); c.save(); c.globalAlpha = 0.7 * g; c.strokeStyle = '#f6c244'; c.lineWidth = 4; c.beginPath(); c.arc(hx, hy, 46 + 30 * (1 - g), 0, Math.PI * 2); c.stroke(); c.restore(); }
}
const regrow = (u, ts, tr) => u < ts ? 1 : u < tr ? 0 : easeOut(map(u, tr, tr + 0.45));

const SHOTS = {
  // 1 — hook: the famous image (Rama's arrow at Ravana's glowing navel), in memory gold, dissolving into embers
  1(ctx, u, p, sh, t, post) {
    const B1 = Math.max(1.6, sh.vStart - sh.start + sh.speech - 0.1), bg = BG.war, cam = { z: lerp(1.2, 1.3, p), x: 40, y: 200 }, fade = ease(u, B1, B1 + 1.0);
    const NV = [760, WAR_GROUND + 20 - 0.3 * 210];
    battlefield(ctx, bg, cam, t, c => {
      if (fade < 1) { c.save(); c.globalAlpha = 1 - fade;
        drawRavana(c, 760, WAR_GROUND + 20, 210, t, 0.4, 0);
        const pulse = 0.6 + 0.4 * Math.sin(t * 5); glow(c, NV[0], NV[1], 70 * pulse + 30, '#fff0a0', 0.85); glow(c, NV[0], NV[1], 16, '#ffffff', 0.9);
        drawFigure(c, CH.rama, P({ bow: 'N', aN: [0.2, -0.02], aF: [0.18, -0.02], handF: 'fist', eye: 1, brow: 0.4, gaze: [0.6, 0.1] }), { x: 260, y: WAR_GROUND + 120, s: 560, face: 1 }, MEMORY);
        const k = ease(u, 0.6, B1); if (k > 0) { const ax = lerp(420, NV[0] - 40, k), ay = lerp(WAR_GROUND - 300, NV[1], k); stroke(c, ax - 90, ay - 30 * (1 - k), ax, ay, 5, '#fff4d0', 0.9); }
        c.restore(); }
      if (fade > 0) embers(c, t, 9, 30, 560, WAR_GROUND, 500, 1 - fade);
    }, 0.6);
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => { (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.25, 0.55 + i * 0.25); if (q > 0) textFit(c, s, 540, 560 + i * 124 + (1 - q) * 22, { size: 108, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); }); };
  },
  2(ctx, u, p, sh, t, post) { sourceCard(ctx, u, p, sh, t, post, TL.source_card); },
  // 3 — Rama severs a head (a flash of light) ... and at once an identical head appears (6.96.20-21)
  3(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.28, 1.36, p), x: 170, y: 230 }, st = sentenceStarts(sh, 2);
    const fly = [st[0] + 0.5, st[0] + 1.0], ts = fly[1], tr = Math.max(ts + 0.8, st[1] + 0.25), H5 = 5;
    battlefield(ctx, bg, cam, t, c => {
      ramaChariot(c, t, { aN: [0.3, -0.04], aF: u > ts ? [0.0, -0.06] : [0.04, -0.06], handF: u > ts ? 'palm' : 'fist', brow: 0.45, eye: 1 });
      ravanaChariot(c, t, { hs: i => i === H5 ? regrow(u, ts, tr) : 1 });
      shaft(c, H5, map(u, fly[0], fly[1]));
      strikeFX(c, H5, u, ts, tr);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 4 — again and again: a hundred heads, no end (6.96.22-24)
  4(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.12, 1.2, p), x: 120, y: 160 }, st = sentenceStarts(sh, 2), end = sh.vStart - sh.start + sh.speech;
    const N = 9, gap = Math.max(0.4, (end - 0.6) / N), hits = Array.from({ length: N }, (_, j) => ({ i: [2, 7, 4, 0, 9, 5, 3, 8, 1][j], ts: 0.35 + j * gap }));
    battlefield(ctx, bg, cam, t, c => {
      ramaChariot(c, t, { aN: [0.3, -0.04], aF: [0.02, -0.06], handF: (u / gap) % 1 < 0.5 ? 'fist' : 'palm', brow: 0.5, eye: 1 });
      ravanaChariot(c, t, { hs: i => { const h = hits.find(q => q.i === i && u > q.ts - 0.3 && u < q.ts + 0.9); return h ? regrow(u, h.ts, h.ts + 0.35) : 1; } });
      hits.forEach(h => { shaft(c, h.i, map(u, h.ts - 0.3, h.ts)); strikeFX(c, h.i, u, h.ts, h.ts + 0.35); });
    });
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.25 * ease(u, st[1] - 0.2, st[1] + 0.3)); ctx.fillRect(0, 0, W, H);
    const t2 = st[1] + (end - st[1]) * 0.55;
    post.ui = c => {
      const n = Math.min(100, Math.max(1, Math.round(100 * easeIn(map(u, 0.3, st[1] + 0.2))))), qn = ease(u, 0.3, 0.6) * (1 - ease(u, st[1] + 0.1, st[1] + 0.4));
      if (qn > 0) text(c, '×' + n, 540, 520, { size: 130, weight: 900, color: C_GOLD, ls: 4, alpha: qn, stroke: 10, shadow: 34 });
      [[sh.card[0], st[1]], [sh.card[1], t2]].forEach(([[s, col], at], i) => { const q = ease(u, at - 0.05, at + 0.3); if (q > 0) textFit(c, s, 540, 520 + i * 124 + (1 - q) * 22, { size: 100, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 32 }); });
    };
  },
  // 5 — so far it's the story we know... but who tells Rama what to do? (the popular answer, Vibhishana, appears in memory gold)
  5(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.0, 1.06, p), x: 0, y: 60 }, st = sentenceStarts(sh, 2), q = ease(u, st[1], st[1] + 0.6);
    battlefield(ctx, bg, cam, t, c => {
      ramaChariot(c, t, { aN: [0.14, 0.04], aF: [0.16, 0.06], head: 0.05, brow: 0.5, gaze: [0.5, 0.2] });
      ravanaChariot(c, t);
      if (q > 0) { c.save(); c.globalAlpha = 0.85 * q; drawFigure(c, CH.vibhishana, P({ handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], head: 0.05, eye: blink(t, 4), gaze: [-0.6, 0] }), { x: 520, y: WAR_GROUND + 90, s: 560, face: -1 }, MEMORY); c.restore(); }
    });
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { if (q > 0) text(c, '?', 540, 520, { size: 200, weight: 900, color: C_GOLD, alpha: q, stroke: 12, shadow: 40 }); };
  },
  // 6 — not Vibhishana: Matali, Indra's charioteer, reminds Rama: the Brahmastra (6.97.1-3)
  6(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.0, 1.08, p), x: 0, y: 60 }, st = sentenceStarts(sh, 2), gone = ease(u, 0.2, 1.0), talk = ease(u, st[1] - 0.2, st[1] + 0.3);
    const end = sh.vStart - sh.start + sh.speech, blaze = ease(u, end - 0.7, end + 0.3);
    battlefield(ctx, bg, cam, t, c => {
      ramaChariot(c, t, blaze > 0 ? { aN: [0.24, -0.06], aF: [0.02, -0.08], handF: 'fist', brow: 0.5, eye: 1 } : { gaze: [0.6, talk * 0.6] });
      ravanaChariot(c, t);
      if (gone < 1) { c.save(); c.globalAlpha = 0.85 * (1 - gone); drawFigure(c, CH.vibhishana, P({ handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], head: 0.05, eye: 1, gaze: [-0.6, 0] }), { x: 520, y: WAR_GROUND + 90, s: 560, face: -1 }, MEMORY); c.restore(); }
      if (talk > 0) drawFigure(c, CH.matali, P({ sit: 1, aN: [0.28, -0.25], handN: 'point', aF: [0.3, 0.08], handF: 'hold', head: -0.1, eye: blink(t, 6), mouth: mouthEnv(sh, u) * 0.7, gaze: [-0.5, -0.2] }), { x: RM[0] + 150, y: RM[1] - 150, s: 380, face: -1 }, L_WAR);
      if (blaze > 0) { glow(c, RM[0] + 120, RM[1] - 520, 100 + 140 * blaze, '#fff0b0', 0.5 * blaze); stroke(c, RM[0] - 20, RM[1] - 520, RM[0] + 200, RM[1] - 525, 6, '#fff4d0', 0.9 * blaze); }
    });
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => {
      const q0 = ease(u, 0.1, 0.4) * (1 - ease(u, st[1] - 0.3, st[1])); if (q0 > 0) { text(c, 'NOT VIBHISHANA', 540, 500, { size: 84, weight: 900, color: C_IVORY, ls: 6, alpha: q0, stroke: 9, shadow: 30 }); const w = 330 * easeOut(map(u, 0.3, 0.7)); c.fillStyle = rgba(C_RED, 0.9 * q0); c.fillRect(540 - w, 490, w * 2, 8); }
      const q = ease(u, st[1] + 0.2, st[1] + 0.6) * (1 - ease(u, end - 1.15, end - 0.8)); if (q > 0) { text(c, 'MATALI', 540, 480, { size: 96, weight: 900, color: C_GOLD, ls: 10, alpha: q, stroke: 9, shadow: 30 }); text(c, "INDRA'S CHARIOTEER", 540, 552, { size: 40, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 8, alpha: q, stroke: 6, shadow: 20 }); }
      if (blaze > 0) text(c, 'BRAHMASTRA', 540, 500, { size: 100, weight: 900, color: C_GOLD, ls: 10, alpha: blaze, stroke: 10, shadow: 34 });
    };
  },
  // 7 — it strikes Ravana's chest and pierces his heart; he falls (6.97.16-21) — light, not wounds
  7(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.05, 1.12, p), x: 60, y: 40 }, k = ease(u, 0.3, 1.2), hit = ease(u, 1.2, 1.4) * (1 - ease(u, 1.4, 2.8));
    const fall = easeOut(map(u, sh.dur - 2.2, sh.dur - 0.2));
    post.flash = 0.55 * hit; post.flashCol = '#fff8e0';
    battlefield(ctx, bg, cam, t, c => {
      ramaChariot(c, t, { aN: [0.3, -0.02], aF: [0.0, -0.06], handF: 'palm', brow: 0.4 });
      ravanaChariot(c, t, { glow: 1 - hit, fall, a: 1 - 0.2 * fall });
      brahmastra(c, BOW[0], BOW[1], RV[0], RV[1] - 330, k < 1 ? k : 0, t);
      if (u > 1.2) glow(c, RV[0], RV[1] - 330 + fall * 200, 220, '#fff0b0', 0.7 * (1 - ease(u, 1.4, 3.4)));
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 8 — NOT THE NAVEL. THE HEART.
  8(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.0, 1.04, p), y: 40 }, st = sentenceStarts(sh, 2);
    battlefield(ctx, bg, cam, t, c => chariot(c, RV[0] + 60, RV[1] + 40, 300, -1, '#4a1a20', '#7a1a1a'), 1.4);
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.35); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) textFit(c, s, 540, 580 + i * 130 + (1 - q) * 22, { size: 104, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 32 }); });
  },
  // 9 — the navel nectar and the 31 arrows: Goswami Tulsidas's Ramcharitmanas, 16th century (Lanka 101.3, doha 102)
  9(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), u2 = Math.max(0, u - (st[1] - 0.2));
    sourceCard(ctx, u2, p, sh, t, post, { title: ['RAMCHARIT', 'MANAS'], sub: 'LANKA KAND  ·  101–102', edition: 'GOSWAMI TULSIDAS  ·  16TH CENTURY' });
    const ui = post.ui; post.ui = c => {
      const q = ease(u, 0.1, 0.4) * (1 - ease(u, st[1] - 0.4, st[1] - 0.1));
      if (q > 0) { textFit(c, 'NECTAR IN THE NAVEL', 540, 470, { size: 74, weight: 900, color: C_IVORY, ls: 4, alpha: q, stroke: 9, shadow: 28 }); text(c, '31 ARROWS', 540, 580, { size: 96, weight: 900, color: C_GOLD, ls: 6, alpha: ease(u, 0.6, 0.9) * q, stroke: 10, shadow: 30 }); }
      if (u > st[1] - 0.2) ui(c);
    };
  },
  // 10 — "both told with devotion — but the navel arrow is not in Valmiki"
  10(ctx, u, p, sh, t, post) {
    const bg = BG.ms, cam = { z: lerp(1.05, 1.12, p), y: 10 }, st = sentenceStarts(sh, 2);
    drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms); withCam(ctx, cam, 0.8, c => flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3));
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => {
      const q0 = ease(u, st[1] - 0.1, st[1] + 0.3); if (q0 > 0) textFit(c, 'NAVEL ARROW', 540, 560, { size: 90, weight: 900, color: C_IVORY, ls: 4, alpha: q0, stroke: 9, shadow: 28 });
      const at = st[1] + 0.9, q1 = ease(u, at, at + 0.3); if (q1 > 0) { text(c, 'NOT IN VALMIKI', 540, 690 + (1 - q1) * 20, { size: 92, weight: 900, color: C_GOLD, ls: 5, alpha: q1, stroke: 10, shadow: 32 }); const w = 300 * easeOut(map(u, at, at + 0.35)); c.fillStyle = rgba(C_RED, 0.9); c.fillRect(540 - w, 548, w * 2, 8); }
    };
  },
  11(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
