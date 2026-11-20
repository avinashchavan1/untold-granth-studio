// ===== Reel A92 — "Ravana Never Taught Lakshmana" — 11 shots (CE Yuddha 6.97, 6.100) =====
// Matali urges the Brahmastra (6.97.2), Agastya's gift (6.97.4); it strikes Ravana's chest and pierces his heart (6.97.16-17);
// bow falls, life departs, he falls lifeless from the chariot (6.97.20-21); Lakshmana crowns Vibhishana (6.100.11-12).
function buildScenes() { BG.war = buildBattlefield(); BG.ms = buildManuscript(); }
const L_WAR = { rim: '#ff9a5a', rimA: 0.9, dir: 1, tint: '#3a0a10', tintA: 0.22 };
const MEMORY = { tint: '#c89a5a', tintA: 0.55, rim: '#ffe0a0', rimA: 0.7, dir: 1, shadow: 0.3 };
const RV = [800, WAR_GROUND - 30];                       // Ravana's chariot (right)
const RM = [250, WAR_GROUND + 40];                       // Rama's chariot (left)

function ramaChariot(c, t, pose) {
  chariot(c, RM[0], RM[1], 260, 1, '#b08a3a', '#e6b450');
  drawFigure(c, CH.matali, P({ sit: 1, aN: [0.3, 0.05], aF: [0.3, 0.08], handN: 'hold', handF: 'hold', eye: blink(t, 6), gaze: [0.6, 0] }), { x: RM[0] + 150, y: RM[1] - 150, s: 380, face: 1 }, L_WAR);
  drawFigure(c, CH.rama, P(Object.assign({ bow: 'N', aN: [0.18, -0.02], bowAng: 0.0, aF: [0.2, -0.05], handF: 'fist', head: 0.0, eye: blink(t, 5), brow: 0.35, gaze: [0.6, 0] }, pose || {})), { x: RM[0] - 20, y: RM[1] - 140, s: 560, face: 1 }, L_WAR);
}
function ravanaChariot(c, t, opts = {}) {
  const fall = opts.fall || 0, a = opts.a === undefined ? 1 : opts.a;
  chariot(c, RV[0] + 60, RV[1] + 40, 300, -1, '#4a1a20', '#7a1a1a');
  c.save(); c.globalAlpha = a; c.translate(RV[0], RV[1] - 110 + fall * 260); c.rotate(-fall * 1.2); c.translate(-RV[0], -(RV[1] - 110));
  drawRavana(c, RV[0], RV[1] - 110, 230, t, (1 - fall) * (opts.glow === undefined ? 1 : opts.glow), 0);
  c.restore();
}

const SHOTS = {
  // 1 — hook: the famous image (Lakshmana bowing to the dying Ravana for a last lesson) dissolves into embers
  1(ctx, u, p, sh, t, post) {
    const B1 = Math.max(1.6, sh.vStart - sh.start + sh.speech - 0.1), bg = BG.war, cam = { z: lerp(1.2, 1.3, p), x: 40, y: 200 }, fade = ease(u, B1, B1 + 1.0);
    battlefield(ctx, bg, cam, t, c => {
      if (fade < 1) { c.save(); c.globalAlpha = 1 - fade;
        drawRavana(c, 760, WAR_GROUND + 20, 210, t, 0.2, 0);
        drawFigure(c, CH.lak, P({ sit: 1, lean: 0.3, head: 0.2, handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], eye: 0.5, smile: 0.1, bow: 'B' }), { x: 360, y: WAR_GROUND + 120, s: 560, face: 1 }, MEMORY);
        c.restore(); }
      if (fade > 0) embers(c, t, 9, 30, 560, WAR_GROUND, 500, 1 - fade);
    }, 0.6);
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => { (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.25, 0.55 + i * 0.25); if (q > 0) textFit(c, s, 540, 560 + i * 124 + (1 - q) * 22, { size: 108, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); }); };
  },
  2(ctx, u, p, sh, t, post) { sourceCard(ctx, u, p, sh, t, post, TL.source_card); },
  // 3 — the long duel; Matali, Indra's charioteer, tells Rama: release the Brahmastra
  3(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.0, 1.06, p), x: 0, y: 60 }, st = sentenceStarts(sh, 2), talk = ease(u, st[1] - 0.2, st[1] + 0.4);
    battlefield(ctx, bg, cam, t, c => {
      for (let i = 0; i < 6; i++) { const k = (u * 0.8 + i / 6) % 1; stroke(c, lerp(RM[0] + 120, RV[0] - 60, k), lerp(RM[1] - 420, RV[1] - 420, k) - Math.sin(k * Math.PI) * 60, lerp(RM[0] + 150, RV[0] - 30, k), lerp(RM[1] - 420, RV[1] - 420, k) - Math.sin(k * Math.PI) * 60, 4, '#ffd8a0', 0.7 * (1 - talk)); }   // arrows trading
      ramaChariot(c, t, { gaze: [0.6, talk * 0.6] });
      ravanaChariot(c, t);
      if (talk > 0) drawFigure(c, CH.matali, P({ sit: 1, aN: [0.28, -0.25], handN: 'point', aF: [0.3, 0.08], handF: 'hold', head: -0.1, eye: blink(t, 6), mouth: mouthEnv(sh, u) * 0.7, gaze: [-0.5, -0.2] }), { x: RM[0] + 150, y: RM[1] - 150, s: 380, face: -1 }, L_WAR);
    });
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { const q = ease(u, st[1] + 0.2, st[1] + 0.6); if (q > 0) { text(c, 'MATALI', 540, 480, { size: 96, weight: 900, color: C_GOLD, ls: 10, alpha: q, stroke: 9, shadow: 30 }); text(c, "INDRA'S CHARIOTEER", 540, 552, { size: 40, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 8, alpha: q, stroke: 6, shadow: 20 }); } };
  },
  // 4 — the same weapon the sage Agastya gave Rama: he nocks it, and it begins to blaze
  4(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.5, 1.62, p), x: -260, y: 260 }, blaze = ease(u, 0.3, sh.dur);
    battlefield(ctx, bg, cam, t, c => {
      ramaChariot(c, t, { aN: [0.24, -0.06], aF: [0.02, -0.08], handF: 'fist', brow: 0.5, eye: 1 });
      glow(c, RM[0] + 120, RM[1] - 520, 120 + 160 * blaze, '#fff0b0', 0.5 * blaze); glow(c, RM[0] + 120, RM[1] - 520, 40, '#ffffff', 0.7 * blaze);
      stroke(c, RM[0] - 20, RM[1] - 520, RM[0] + 200, RM[1] - 525, 6, '#fff4d0', 0.9 * blaze);
    });
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { const q = ease(u, 0.5, 1.0); if (q > 0) text(c, 'BRAHMASTRA', 540, 500, { size: 100, weight: 900, color: C_GOLD, ls: 10, alpha: q, stroke: 10, shadow: 34 }); };
  },
  // 5 — it strikes Ravana's chest and pierces his heart (light, not wounds)
  5(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.05, 1.15, p), x: 40, y: 40 }, k = ease(u, 0.4, 1.4), hit = ease(u, 1.4, 1.6) * (1 - ease(u, 1.6, 3.0));
    post.flash = 0.55 * hit; post.flashCol = '#fff8e0';
    battlefield(ctx, bg, cam, t, c => {
      ramaChariot(c, t, { aN: [0.3, -0.02], aF: [0.0, -0.06], handF: 'palm', brow: 0.4 });
      ravanaChariot(c, t, { glow: 1 - hit });
      brahmastra(c, RM[0] + 200, RM[1] - 525, RV[0], RV[1] - 330, k < 1 ? k : 0, t);
      if (u > 1.4) glow(c, RV[0], RV[1] - 330, 220, '#fff0b0', 0.7 * (1 - ease(u, 1.6, 3.4)));
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 6 — the bow slips, his life-breath leaves, and he falls from the chariot, lifeless
  6(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.15, 1.08, p), x: 120, y: 60 }, fall = easeOut(map(u, 0.8, 3.6));
    battlefield(ctx, bg, cam, t, c => {
      ravanaChariot(c, t, { fall, a: 1 - 0.2 * fall });
      if (fall > 0.9) for (let i = 0; i < 30; i++) { const an = hash(i) * Math.PI, d = (u - 3.4) * 140 * hash(i * 5); dab(c, RV[0] + 60 + Math.cos(an) * d, WAR_GROUND - Math.sin(an) * d * 0.4, 8, 5, 0, '#6a4a40', 0.6 * Math.max(0, 1 - (u - 3.4))); }
    }, 1.2);
    drawLayer(ctx, cam, bg.fg);
  },
  // 7 — ONE ARROW. THROUGH THE HEART. DEAD AT ONCE.
  7(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.0, 1.04, p), y: 40 }, st = sentenceStarts(sh, 3);
    battlefield(ctx, bg, cam, t, c => chariot(c, RV[0] + 60, RV[1] + 40, 300, -1, '#4a1a20', '#7a1a1a'), 1.4);
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.35); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) textFit(c, s, 540, 540 + i * 120 + (1 - q) * 22, { size: 100, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 32 }); });
  },
  // 8 — and Lakshmana? He crowns Vibhishana king, at Rama's command (6.100.11-12); flowers fall
  8(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.15, 1.22, p), x: 40, y: 120 }, st = sentenceStarts(sh, 2), pour = ease(u, st[1] + 0.6, st[1] + 2.2);
    battlefield(ctx, bg, cam, t, c => {
      glow(c, 560, WAR_GROUND - 400, 420, '#ffe0a0', 0.25);
      drawFigure(c, CH.rama, P({ bow: 'B', head: 0.05, eye: blink(t, 5), smile: 0.4, gaze: [0.5, 0] }), { x: 220, y: WAR_GROUND + 60, s: 600, face: 1 }, L_WAR);
      drawFigure(c, CH.vibhishana, P({ handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], head: 0.12, eye: 0.4, smile: 0.4 }), { x: 560, y: WAR_GROUND + 70, s: 610, face: 1 }, L_WAR);
      const lp = P({ pot: true, aN: [lerp(0.2, 0.1, pour), lerp(0.0, -0.32, pour)], handN: 'hold', aF: [0.14, 0.12], head: -0.1 * pour, eye: blink(t, 2), smile: 0.4, gaze: [-0.5, -0.3], bow: 'B' });
      drawFigure(c, CH.lak, lp, { x: 800, y: WAR_GROUND + 70, s: 590, face: -1 }, L_WAR);
      if (pour > 0.4) for (let i = 0; i < 12; i++) { const k2 = (t * 1.5 + i / 12) % 1; dab(c, 640 - k2 * 40 + Math.sin(i) * 6, WAR_GROUND - 520 + k2 * 120, 3, 5, 0, '#cfe6ff', 0.8 * (1 - k2)); }
      petals(c, t, 11, Math.round(50 * ease(u, 0.5, 2)), 0.9);
    }, 0.4);
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { const q = ease(u, st[1] + 0.4, st[1] + 0.9); if (q > 0) text(c, 'VIBHISHANA, KING OF LANKA', 540, 470, { size: 50, font: 'Montserrat', weight: 800, color: C_GOLD, ls: 6, alpha: q, stroke: 7, shadow: 24 }); };
  },
  // 9 — NO LAST LESSON. NO LAST WORDS.
  9(ctx, u, p, sh, t, post) {
    const bg = BG.war, cam = { z: lerp(1.0, 1.05, p), y: 20 }, st = sentenceStarts(sh, 2);
    battlefield(ctx, bg, cam, t, c => petals(c, t, 11, 40, 0.6), 0.8); drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#080826', 0.38); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) textFit(c, s, 540, 600 + i * 124 + (1 - q) * 22, { size: 100, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 32 }); });
  },
  // 10 — "Ravana's lesson — not in Valmiki"
  10(ctx, u, p, sh, t, post) {
    const bg = BG.ms, cam = { z: lerp(1.05, 1.12, p), y: 10 }, st = sentenceStarts(sh, 2);
    drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms); withCam(ctx, cam, 0.8, c => flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3));
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => {
      const q0 = ease(u, 0.2, 0.6); if (q0 > 0) textFit(c, "RAVANA'S LESSON", 540, 560, { size: 78, weight: 900, color: C_IVORY, ls: 4, alpha: q0, stroke: 9, shadow: 28 });
      const q1 = ease(u, st[1] - 0.05, st[1] + 0.3); if (q1 > 0) { text(c, 'NOT IN VALMIKI', 540, 690 + (1 - q1) * 20, { size: 92, weight: 900, color: C_GOLD, ls: 5, alpha: q1, stroke: 10, shadow: 32 }); const w = 360 * easeOut(map(u, st[1], st[1] + 0.35)); c.fillStyle = rgba(C_RED, 0.9); c.fillRect(540 - w, 538, w * 2, 8); }
    };
  },
  11(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
