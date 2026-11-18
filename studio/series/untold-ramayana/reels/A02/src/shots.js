// ===== Reel A02 — "Shabari Never Tasted the Berries" — 14 shots (helpers live in series art/templates.js) =====
function buildScenes() {
  BG.pamD = buildPampa('dusk'); BG.pamN = buildPampa('night'); BG.forest = buildForest(); BG.ms = buildManuscript(); BG.herE = buildHermitage('end');
}
const SH_S = 560, SH_Y = 1405;                    // Shabari scale / feet line in the Pampa set
const stoop = o => P(Object.assign({ lean: 0.1, head: 0.08, smile: 0.25, brow: 0.15 }, o));   // her aged posture

// a jujube-like fruit, painted
function fruit(c, x, y, r, a = 1, bite = 0) {
  glow(c, x, y, r * 3.2, '#ffcf70', 0.35 * a);
  dab(c, x, y, r, r * 0.92, 0, '#c8582a', a); dab(c, x - r * 0.3, y - r * 0.35, r * 0.45, r * 0.35, -0.4, '#f0a050', a * 0.9); dab(c, x - r * 0.42, y - r * 0.45, r * 0.14, r * 0.1, -0.4, '#fff0c8', a * 0.9);
  stroke(c, x + 2, y - r * 0.9, x + r * 0.25, y - r * 1.4, r * 0.1, '#4a3020', a);
  if (bite > 0) { c.save(); c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 3; i++) dab(c, x + r * 0.82, y - r * 0.15 + i * r * 0.3, r * 0.32 * bite, r * 0.3 * bite, 0, '#000', a); c.restore(); }
}

const SHOTS = {
  // 1 — hook: a half-bitten fruit glows over the basket, then crumbles into light on the question
  1(ctx, u, p, sh, t, post) {
    const B1 = Math.max(1.4, sh.vStart - sh.start + sh.speech - 0.05), bg = BG.pamD, cam = { z: lerp(1.45, 1.6, p), x: -100, y: 360 + (u > B1 && u < B1 + 0.35 ? Math.sin(u * 90) * 8 * (B1 + 0.35 - u) * 3 : 0) };
    pampa(ctx, bg, cam, t); drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.35); ctx.fillRect(0, 0, W, H);
    const sp = map(u, B1, B1 + 1.0), a = ease(u, 0.15, 0.7);
    if (sp <= 0) { fruit(ctx, 540, 1150 + Math.sin(u * 2) * 8, 70 * a + 1, a, ease(u, 0.6, 1.1)); }
    else for (let i = 0; i < 40; i++) { const an = hash(i) * TAU, d = easeOut(sp) * (60 + hash(i * 7) * 260); dab(ctx, 540 + Math.cos(an) * d, 1150 + Math.sin(an) * d * 0.8 - sp * 60, 5 * (1 - sp) + 1, 5 * (1 - sp) + 1, 0, i % 3 ? '#ffcf70' : '#f08040', 1 - sp); }
    post.ui = c => { (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.2 + i * 0.25, 0.6 + i * 0.25); if (q > 0) text(c, s, 540, 640 + i * 124 + (1 - q) * 22, { size: 112, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); }); };
  },
  2(ctx, u, p, sh, t, post) { sourceCard(ctx, u, p, sh, t, post, TL.source_card); },
  // 3 — the brothers walk west through the forest towards Pampa
  3(ctx, u, p, sh, t, post) {
    const bg = BG.forest, cam = { x: lerp(80, -80, p), z: 1.05 };
    drawLayer(ctx, cam, bg.back); drawLayer(ctx, cam, bg.l1);
    withCam(ctx, cam, 0.6, c => {
      mist(c, t, 5, 6, [-200, 1050, 1500, 240], '#d6a8dc', 0.2, 26);
      const ph = u * 4.4, x = lerp(860, 300, p);
      drawFigure(c, CH.lak, walkPose(ph + 1.3, 0.38, { bow: 'B', head: 0.06, brow: 0.4, eye: blink(t, 2), smile: -0.2, lean: 0.05 }), { x: x + 230, y: 1395, s: 560, face: -1 }, L_DUSK);
      drawFigure(c, CH.rama, walkPose(ph, 0.38, { bow: 'B', head: 0.08, brow: 0.5, eye: blink(t, 5), smile: -0.35, lean: 0.05, gaze: [0.2, 0.2] }), { x, y: 1400, s: 590, face: -1 }, L_DUSK);
    });
    drawLayer(ctx, cam, bg.l2);
  },
  // 4 — the empty hermitage; an old woman waits at the door, eyes on the path
  4(ctx, u, p, sh, t, post) {
    const bg = BG.pamD, cam = { z: lerp(1.0, 1.12, p), x: lerp(0, -60, p), y: lerp(20, 70, p) }, st = sentenceStarts(sh, 2);
    pampa(ctx, bg, cam, t, c => {
      drawFigure(c, CH.shabari, stoop({ aN: [0.02, 0.24], aF: [0.07, 0.25], eye: blink(t, 3) * 0.85, gaze: [0.6, 0], head: 0.02 + Math.sin(t * 0.7) * 0.01 }), { x: 420, y: SH_Y, s: SH_S, face: 1 }, L_DUSK);
      fireflies(c, t, 7, 10, [100, 900, 900, 500], 0.7);
    });
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { const q = ease(u, st[1] - 0.05, st[1] + 0.35); if (q > 0) text(c, 'SHABARI', 540, 520 + (1 - q) * 20, { size: 118, weight: 900, color: C_GOLD, ls: 12, alpha: q, stroke: 10, shadow: 34 }); };
  },
  // 5 — they arrive; she rises with joined palms and bows to their feet
  5(ctx, u, p, sh, t, post) {
    const bg = BG.pamD, cam = { z: lerp(1.08, 1.14, p), x: 40, y: 60 };
    pampa(ctx, bg, cam, t, c => {
      const bw = Math.sin(Math.PI * ease(u, 1.0, 3.6));
      drawFigure(c, CH.shabari, stoop({ aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', lean: 0.1 + 0.3 * bw, head: 0.1 + 0.25 * bw, eye: lerp(0.9, 0.35, bw), smile: 0.5, tear: 0.6 }), { x: 420, y: SH_Y, s: SH_S, face: 1 }, L_DUSK);
      const arr = easeOut(map(u, 0, 0.9));
      drawFigure(c, CH.rama, P({ bow: 'B', aN: [0.06, 0.24], head: 0.06, brow: 0.2, eye: blink(t, 5), smile: 0.35, gaze: [0.5, 0.3] }), { x: lerp(900, 720, arr), y: 1410, s: 600, face: -1 }, L_DUSK);
      drawFigure(c, CH.lak, P({ bow: 'B', head: 0.06, eye: blink(t, 2), smile: 0.2, gaze: [0.5, 0.3] }), { x: lerp(1060, 900, arr), y: 1405, s: 575, face: -1 }, L_DUSK);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 6 — Rama asks about her penance (gentle, respectful)
  6(ctx, u, p, sh, t, post) {
    const bg = BG.pamD, cam = { z: lerp(1.28, 1.33, p), x: 160, y: 120 }, m = mouthEnv(sh, u);
    pampa(ctx, bg, cam, t, c => {
      drawFigure(c, CH.shabari, stoop({ aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', eye: blink(t, 3), smile: 0.55, gaze: [0.5, -0.1] }), { x: 420, y: SH_Y, s: SH_S, face: 1 }, L_DUSK);
      const rp = P({ bow: 'B', aN: [0.16, 0.12], handN: 'palm', elN: 1, head: 0.05 - m * 0.02, brow: 0.25, eye: blink(t, 5), smile: 0.3, mouth: m * 0.8, gaze: [0.5, 0.25] });
      rp.head += Math.sin(u * 11) * 0.015 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.rama, rp, { x: 720, y: 1410, s: 600, face: -1 }, L_DUSK);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 7 — Shabari: "My teachers said Rama would come… for you I gathered forest fruit"
  7(ctx, u, p, sh, t, post) {
    const bg = BG.pamD, cam = { z: lerp(1.3, 1.38, p), x: lerp(-60, -110, p), y: 140 }, m = mouthEnv(sh, u), st = sentenceStarts(sh, 2), g = ease(u, st[1] - 0.2, st[1] + 0.5);
    pampa(ctx, bg, cam, t, c => {
      const pose = lerpPose(stoop({ aN: [0.06, 0.2], aF: [0.1, 0.18], eye: blink(t, 3), smile: 0.45, gaze: [0.5, -0.15], tear: 0.5 }),
                            stoop({ aN: [0.27, 0.12], handN: 'palm', aF: [0.1, 0.18], eye: blink(t, 3), smile: 0.6, gaze: [0.4, 0.3], head: 0.12, tear: 0.5 }), g);
      pose.mouth = m * 0.75; pose.head += Math.sin(u * 9) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.shabari, pose, { x: 420, y: SH_Y, s: SH_S, face: 1 }, L_DUSK);
      glow(c, bg.basket[0], bg.basket[1] - 20, 90, '#ffcf70', 0.25 * g);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 8 — close on the basket: that's all. Forest fruit. No "ber".
  8(ctx, u, p, sh, t, post) {
    const bg = BG.pamD, cam = { z: lerp(1.75, 1.95, p), x: -106, y: 400 }, st = sentenceStarts(sh, 3);
    pampa(ctx, bg, cam, t); drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.25); ctx.fillRect(0, 0, W, H);
    post.ui = c => [['THAT\'S ALL.', C_IVORY], ['FOREST FRUIT.', C_IVORY], ['NO "BER".', C_GOLD]].forEach(([s, col], i) => {
      const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) text(c, s, 540, 520 + i * 112 + (1 - q) * 22, { size: 88, weight: 900, color: col, ls: 5, alpha: q, stroke: 9, shadow: 30 });
    });
  },
  // 9 — the Matanga forest: the altar still glows, the bark robes are still wet
  9(ctx, u, p, sh, t, post) {
    const bg = BG.pamD, cam = { z: 1.32, x: lerp(120, 330, p), y: lerp(170, 230, p) };
    pampa(ctx, bg, cam, t, c => {
      for (let i = 0; i < 4; i++) { const px = 642 + i * 82, h = 160, ph = (t * 0.9 + i * 0.37) % 1; dab(c, px, 1000 - i * 5 + h + 10 + ph * 70, 3, 5, 0, '#bcd4f0', 0.7 * (1 - ph)); }
      glow(c, bg.alt[0], bg.alt[1] - 90, 200, '#ffd27a', 0.18 + 0.08 * Math.sin(t * 3));
      embers(c, t, 3, 10, bg.alt[0], bg.alt[1] - 80, 120, 0.7);
      drawFigure(c, CH.shabari, stoop({ aN: [0.3, 0.05], handN: 'palm', aF: [0.08, 0.2], eye: blink(t, 3), smile: 0.4, gaze: [0.6, 0] }), { x: 560, y: SH_Y, s: SH_S * 0.92, face: 1 }, L_DUSK);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 10 — Shabari asks leave to go to her teachers (night has fallen)
  10(ctx, u, p, sh, t, post) {
    const bg = BG.pamN, cam = { z: lerp(1.3, 1.36, p), x: -40, y: 130 }, m = mouthEnv(sh, u);
    pampa(ctx, bg, cam, t, c => {
      const pose = stoop({ aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', eye: blink(t, 3) * 0.8, smile: 0.6, gaze: [0.4, -0.25], head: 0.04, mouth: m * 0.7 });
      drawFigure(c, CH.shabari, pose, { x: 420, y: SH_Y, s: SH_S, face: 1 }, L_NIGHT);
      drawFigure(c, CH.rama, P({ bow: 'B', aN: [0.06, 0.24], head: 0.08, brow: 0.35, eye: blink(t, 5), smile: 0.2, gaze: [0.5, 0.2] }), { x: 760, y: 1410, s: 600, face: -1 }, L_NIGHT);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 11 — she walks into the fire and rises as light (no harm shown: the figure becomes a flame)
  11(ctx, u, p, sh, t, post) {
    const bg = BG.pamN, cam = { z: lerp(1.05, 1.16, p), x: 0, y: lerp(40, -40, p) }, FX = 560, FY = 1420;
    const walk = ease(u, 0.3, 1.9), into = ease(u, 1.5, 2.3), rise = ease(u, 2.0, sh.dur - 0.3);
    pampa(ctx, bg, cam, t, c => {
      drawFigure(c, CH.rama, P({ bow: 'B', aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', head: 0.04 - rise * 0.12, eye: blink(t, 5), smile: 0.2, gaze: [-0.2, -0.6 * rise] }), { x: 840, y: 1415, s: 590, face: -1 }, L_NIGHT);
      drawFigure(c, CH.lak, P({ bow: 'B', aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', head: 0.04 - rise * 0.12, eye: blink(t, 2), gaze: [-0.2, -0.6 * rise] }), { x: 990, y: 1408, s: 565, face: -1 }, L_NIGHT);
      fire(c, FX, FY, 150, 260 + 60 * into, t, 3, 18, 1);
      c.save(); c.globalAlpha = 1 - into;
      drawFigure(c, CH.shabari, walkPose(u * 3.2 * (1 - walk * 0.0), 0.25 * (1 - into), { lean: 0.08, head: 0.04, smile: 0.6, eye: 0.6, aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none' }), { x: lerp(330, FX - 120, walk), y: SH_Y, s: SH_S, face: 1 }, L_NIGHT);
      c.restore();
      if (into > 0) { const y = lerp(FY - 260, 380, rise); glow(c, FX - 120, SH_Y - 280, 160, '#fff2c0', 0.5 * into * (1 - rise)); glow(c, FX, y, 220, '#fff2c0', 0.55 * into); glow(c, FX, y, 70, '#ffffff', 0.5 * into); for (let i = 0; i < 24; i++) { const h = hash(i * 5.1); dab(c, FX + Math.sin(t * 2 + i) * 40 * h, y + 60 + ((t * 120 + i * 37) % 420), 3, 3, 0, '#ffe8a0', 0.7 * into * (1 - h * 0.5)); } }
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 12 — three stamps over the empty hermitage
  12(ctx, u, p, sh, t, post) {
    const bg = BG.pamN, cam = { z: lerp(1.0, 1.08, p), y: lerp(-10, 20, p) }, st = sentenceStarts(sh, 3);
    pampa(ctx, bg, cam, t, c => embers(c, t, 9, 8, 560, 1400, 90, 0.5)); drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#080826', 0.25 + 0.15 * p); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) text(c, s, 545, 800 + i * 116 + (1 - q) * 22, { size: i === 2 ? 82 : 86, weight: 900, color: col || C_IVORY, ls: 5, alpha: q, stroke: 9, shadow: 30 }); });
  },
  // 13 — "Not in Valmiki" — the manuscript again, the claim stamped
  13(ctx, u, p, sh, t, post) {
    const bg = BG.ms, cam = { z: lerp(1.05, 1.12, p), y: 10 }, st = sentenceStarts(sh, 2);
    drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms); withCam(ctx, cam, 0.8, c => flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3));
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => {
      const q0 = ease(u, 0.2, 0.6); if (q0 > 0) text(c, 'TASTED BERRIES', 540, 560, { size: 74, weight: 900, color: C_IVORY, ls: 4, alpha: q0, stroke: 9, shadow: 28 });
      const q1 = ease(u, st[1] - 0.05, st[1] + 0.3); if (q1 > 0) { text(c, 'NOT IN VALMIKI', 540, 690 + (1 - q1) * 20, { size: 92, weight: 900, color: C_GOLD, ls: 5, alpha: q1, stroke: 10, shadow: 32 }); const w = 330 * easeOut(map(u, st[1], st[1] + 0.35)); c.fillStyle = rgba(C_RED, 0.9); c.fillRect(540 - w, 538, w * 2, 8); }
    };
  },
  14(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
