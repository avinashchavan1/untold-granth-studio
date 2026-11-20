// ===== Reel A03 — "Ahalya Was Never Stone" — 14 shots (helpers live in series art/templates.js) =====
// Valmiki (CE 1.47–48): cursed to live unseen in the hermitage on air, in penance; purified when Rama comes;
// she appears radiant "like the full moon veiled by smoke"; Rama and Lakshmana touch HER feet; flowers rain.
function buildScenes() {
  BG.gau = buildGautama('dusk'); BG.forest = buildForest(); BG.ms = buildManuscript();
}
const AH_S = 560, AH_Y = 1405;                         // Ahalya scale / feet line at the altar
const STONE = { tint: '#86848c', tintA: 0.93, rim: '#d8d6e0', rimA: 0.5, dir: 1, shadow: 0.6 };   // the myth: a statue
const L_PAST = { rim: '#f4c890', rimA: 0.8, dir: 1, tint: '#4a2c18', tintA: 0.28 };             // flashback warmth
const RADIANT = { rim: '#fff4d0', rimA: 0.95, dir: 1, tint: '#40306a', tintA: 0.08 };

function penance(c, x, y, s, a, t, light) {            // Ahalya seated on the ash in penance, eyes closed
  if (a <= 0.01) return;
  c.save(); c.globalAlpha = a;
  drawFigure(c, CH.ahalya, P({ sit: 1, handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], eye: 0.1, head: 0.06, smile: 0.1 }), { x, y, s, face: 1 }, Object.assign({}, light, { alpha: a, shadow: 0.4 * a }));
  c.restore();
}
function shimmer(c, x, y, t, a) {                       // the unseen presence: a faint haze of light
  if (a <= 0.01) return;
  for (let i = 0; i < 18; i++) { const h = hash(i * 3.7), yy = y - ((t * 60 + h * 400) % 400); dab(c, x - 80 + h * 160 + Math.sin(t * 2 + i) * 10, yy, 3, 6, 0, '#fff0c8', a * (1 - (y - yy) / 400) * 0.8); }
  glow(c, x, y - 160, 170, '#fff0c8', 0.12 * a);
}

const SHOTS = {
  // 1 — hook: the popular image — a woman of stone by the altar — then it crumbles to dust on the question
  1(ctx, u, p, sh, t, post) {
    const B1 = Math.max(1.6, sh.vStart - sh.start + sh.speech - 0.1), bg = BG.gau, cam = { z: lerp(1.35, 1.5, p), x: 160, y: 300 + (u > B1 && u < B1 + 0.4 ? Math.sin(u * 90) * 10 * (B1 + 0.4 - u) * 2.5 : 0) };
    const crack = ease(u, B1, B1 + 0.9);
    gautamaSet(ctx, bg, cam, t, c => {
      if (crack < 1) { c.save(); c.globalAlpha = 1 - crack; drawFigure(c, CH.ahalya, P({ sit: 1, handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], eye: 0.1, head: 0.06 }), { x: bg.alt[0], y: AH_Y - 40, s: AH_S, face: 1 }, STONE); c.restore(); }
      if (crack > 0) for (let i = 0; i < 70; i++) { const an = hash(i) * TAU, d = easeOut(crack) * (40 + hash(i * 7) * 300); dab(c, bg.alt[0] + Math.cos(an) * d, AH_Y - 200 + Math.sin(an) * d * 0.6 + crack * 120, 7 * (1 - crack) + 1, 6 * (1 - crack) + 1, an, i % 3 ? '#a8a6ae' : '#6e6c74', 1 - crack); }
      mist(c, t, 7, 4, [0, 1100, 900, 300], '#c8c2d8', 0.25 * crack, 30);
    });
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => { (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.25, 0.55 + i * 0.25); if (q > 0) text(c, s, 540, 560 + i * 124 + (1 - q) * 22, { size: 112, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); }); };
  },
  2(ctx, u, p, sh, t, post) { sourceCard(ctx, u, p, sh, t, post, TL.source_card); },
  // 3 — Vishvamitra leads the brothers through the forest; they reach an empty hermitage
  3(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), there = u >= st[1] - 0.1;
    if (!there) {
      const bg = BG.forest, cam = { x: lerp(80, -40, p), z: 1.05 };
      drawLayer(ctx, cam, bg.back); drawLayer(ctx, cam, bg.l1);
      withCam(ctx, cam, 0.6, c => {
        mist(c, t, 5, 6, [-200, 1050, 1500, 240], '#d6a8dc', 0.2, 26);
        const ph = u * 4.2, x = lerp(820, 380, map(u, 0, st[1]));
        drawFigure(c, CH.lak, walkPose(ph + 1.3, 0.36, { bow: 'B', head: 0.04, eye: blink(t, 2), smile: 0.1 }), { x: x + 330, y: 1395, s: 545, face: -1 }, L_FOREST);
        drawFigure(c, CH.rama, walkPose(ph, 0.36, { bow: 'B', head: 0.05, eye: blink(t, 5), smile: 0.15, gaze: [0.3, 0.1] }), { x: x + 170, y: 1400, s: 575, face: -1 }, L_FOREST);
        drawFigure(c, CH.vishva, walkPose(ph + 0.6, 0.3, { staff: true, aN: [0.14, 0.12], head: 0.05, eye: blink(t, 7), smile: 0.1 }), { x, y: 1400, s: 590, face: -1 }, L_FOREST);
      });
      drawLayer(ctx, cam, bg.l2);
    } else {
      const bg = BG.gau, k = map(u, st[1], sh.dur), cam = { z: lerp(1.0, 1.08, k), x: lerp(-40, 0, k), y: 40 };
      gautamaSet(ctx, bg, cam, t, c => {
        drawFigure(c, CH.vishva, P({ staff: true, aN: [0.14, 0.12], aF: [0.16, 0.08], handF: 'point', head: 0.05, eye: blink(t, 7), gaze: [0.6, 0] }), { x: 150, y: 1430, s: 600, face: 1 }, L_DUSK);
        drawFigure(c, CH.rama, P({ bow: 'B', head: 0.04, eye: blink(t, 5), gaze: [0.6, 0], smile: 0.05 }), { x: 300, y: 1450, s: 615, face: 1 }, L_DUSK);
        drawFigure(c, CH.lak, P({ bow: 'B', head: 0.04, eye: blink(t, 2), gaze: [0.6, 0] }), { x: 430, y: 1460, s: 600, face: 1 }, L_DUSK);
      });
      drawLayer(ctx, cam, bg.fg);
      post.ui = c => { const q = ease(u, st[1] + 0.2, st[1] + 0.6); if (q > 0) { text(c, "SAGE GAUTAMA'S", 540, 470 + (1 - q) * 20, { size: 64, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 6, alpha: q, stroke: 8, shadow: 26 }); text(c, 'HERMITAGE', 540, 580 + (1 - q) * 20, { size: 100, weight: 900, color: C_GOLD, ls: 10, alpha: q, stroke: 10, shadow: 32 }); } };
    }
  },
  // 4 — long ago: Gautama returns; Ahalya bows her head (sepia flashback; nothing else shown)
  4(ctx, u, p, sh, t, post) {
    const bg = BG.gau, cam = { z: lerp(1.15, 1.22, p), x: 60, y: 110 };
    post.sat = 0.45;
    gautamaSet(ctx, bg, cam, t, c => {
      drawFigure(c, CH.ahalya, P({ handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], head: 0.22, lean: 0.06, eye: 0.35, smile: -0.2, tear: 0.4 }), { x: 380, y: AH_Y, s: AH_S, face: 1 }, L_PAST);
      drawFigure(c, CH.gautama, P({ staff: true, aN: [0.14, 0.12], head: -0.02, brow: 0.7, eye: blink(t, 4) * 0.9, smile: -0.5, gaze: [0.5, 0.1] }), { x: 760, y: 1415, s: 610, face: -1 }, L_PAST);
    }, 0.5);
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#3a2010', 0.22); ctx.fillRect(0, 0, W, H);
    post.ui = c => { const q = ease(u, 0.2, 0.6); if (q > 0) text(c, 'LONG AGO', 540, 470, { size: 70, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 14, alpha: q * 0.9, stroke: 7, shadow: 24 }); };
  },
  // 5 — Gautama's curse (two sentences); on "unseen by all beings" she fades from sight
  5(ctx, u, p, sh, t, post) {
    const bg = BG.gau, cam = { z: lerp(1.3, 1.38, p), x: 120, y: 160 }, m = mouthEnv(sh, u), st = sentenceStarts(sh, 2), fade = ease(u, st[1] + 0.4, sh.dur - 0.3);
    post.sat = 0.45;
    gautamaSet(ctx, bg, cam, t, c => {
      penance(c, 400, AH_Y, AH_S, 1 - 0.82 * fade, t, L_PAST); shimmer(c, 400, AH_Y, t, fade);
      const gp = P({ staff: true, aN: [0.14, 0.12], aF: [0.2, -0.12], handF: 'palm', elF: -1, head: -0.03 - m * 0.02, brow: 0.6, eye: blink(t, 4), smile: -0.4, mouth: m * 0.8, gaze: [0.4, 0.3] });
      gp.head += Math.sin(u * 10) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.gautama, gp, { x: 760, y: 1415, s: 630, face: -1 }, L_PAST);
    }, 0.5);
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#3a2010', 0.22); ctx.fillRect(0, 0, W, H);
  },
  // 6 — "…when Rama, son of Dasharatha, comes to this forest, you will be purified" — his hand softens to a blessing
  6(ctx, u, p, sh, t, post) {
    const bg = BG.gau, cam = { z: lerp(1.42, 1.5, p), x: 200, y: 200 }, m = mouthEnv(sh, u);
    post.sat = 0.5;
    gautamaSet(ctx, bg, cam, t, c => {
      shimmer(c, 400, AH_Y, t, 1); penance(c, 400, AH_Y, AH_S, 0.18, t, L_PAST);
      const gp = P({ staff: true, aN: [0.14, 0.12], aF: [0.18, -0.02], handF: 'palm', head: 0.02, brow: 0.2, eye: blink(t, 4), smile: 0.1, mouth: m * 0.8, gaze: [0.4, 0.4] });
      gp.head += Math.sin(u * 10) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.gautama, gp, { x: 760, y: 1415, s: 630, face: -1 }, L_PAST);
    }, 0.4);
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#3a2010', 0.18); ctx.fillRect(0, 0, W, H);
  },
  // 7 — not stone: invisible, in penance (cards over the shimmering altar, present day)
  7(ctx, u, p, sh, t, post) {
    const bg = BG.gau, cam = { z: lerp(1.25, 1.32, p), x: -40, y: 150 }, st = sentenceStarts(sh, 3);
    gautamaSet(ctx, bg, cam, t, c => { shimmer(c, 400, AH_Y, t, 1); penance(c, 400, AH_Y, AH_S, 0.12, t, L_DUSK); }, 1.3);
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) text(c, s, 540, 520 + i * 116 + (1 - q) * 22, { size: 90, weight: 900, color: col || C_IVORY, ls: 5, alpha: q, stroke: 9, shadow: 30 }); });
  },
  // 8 — Rama steps in… and she appears, radiant, like the full moon veiled in smoke
  8(ctx, u, p, sh, t, post) {
    const bg = BG.gau, cam = { z: lerp(1.05, 1.15, p), x: lerp(40, 0, p), y: lerp(60, 90, p) }, st = sentenceStarts(sh, 2), app = ease(u, Math.max(1.2, st[1] - 0.4), Math.max(2.4, st[1] + 1.2)), walk = ease(u, 0, 1.6);
    gautamaSet(ctx, bg, cam, t, c => {
      if (app > 0) { glow(c, 400, AH_Y - 300, 420, '#fff2c8', 0.32 * app); glow(c, 400, AH_Y - 320, 160, '#ffffff', 0.22 * app); }
      shimmer(c, 400, AH_Y, t, 1 - app);
      if (app > 0) { c.save(); c.globalAlpha = app; drawFigure(c, CH.ahalya, P({ handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], head: 0.04, eye: lerp(0.1, blink(t, 3), ease(u, st[1] + 0.8, st[1] + 1.4)), smile: 0.35 }), { x: 400, y: AH_Y, s: AH_S, face: 1 }, Object.assign({}, RADIANT, { alpha: app })); c.restore(); }
      mist(c, t, 13, 6, [120, 1000, 560, 380], '#e6e0f0', 0.3 * app, 18);                      // the veil of smoke
      drawFigure(c, CH.rama, walkPose(u * 4 * (1 - walk), 0.34 * (1 - walk), { bow: 'B', head: 0.04, eye: blink(t, 5), smile: 0.2 * app, gaze: [0.5, 0] }), { x: lerp(1000, 760, walk), y: 1415, s: 610, face: -1 }, L_DUSK);
      drawFigure(c, CH.lak, P({ bow: 'B', head: 0.04, eye: blink(t, 2), gaze: [0.5, 0], smile: 0.1 * app }), { x: lerp(1160, 920, walk), y: 1410, s: 590, face: -1 }, L_DUSK);
    }, 1 + app);
    drawLayer(ctx, cam, bg.fg);
  },
  // 9 — Rama and Lakshmana bow and touch HER feet
  9(ctx, u, p, sh, t, post) {
    const bg = BG.gau, cam = { z: lerp(1.2, 1.3, p), x: 60, y: 330 }, b = Math.sin(Math.PI * ease(u, 0.4, sh.dur - 0.2)) * 0.85 + ease(u, 0.4, 1.2) * 0.15;
    gautamaSet(ctx, bg, cam, t, c => {
      glow(c, 400, AH_Y - 300, 380, '#fff2c8', 0.26);
      drawFigure(c, CH.ahalya, P({ handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], head: 0.16, eye: blink(t, 3) * 0.8, smile: 0.5, tear: 0.4, gaze: [0.5, 0.6] }), { x: 400, y: AH_Y, s: AH_S, face: 1 }, RADIANT);
      // kneeling, bowing low, hands reaching her feet (CE 1.48.17)
      const bow = o => P(Object.assign({ bow: 'B', sit: 1, lean: 0.3 + 0.45 * b, head: 0.2 + 0.25 * b, aN: [0.24 + 0.08 * b, 0.26 + 0.1 * b], aF: [0.2 + 0.08 * b, 0.28 + 0.1 * b], handN: 'palm', handF: 'palm', eye: 0.4, smile: 0.3 }, o));
      drawFigure(c, CH.lak, bow({}), { x: 780, y: 1412, s: 585, face: -1 }, L_DUSK);
      drawFigure(c, CH.rama, bow({}), { x: 610, y: 1418, s: 600, face: -1 }, L_DUSK);
    }, 1.2);
    drawLayer(ctx, cam, bg.fg);
  },
  // 10 — remembering Gautama's words, she receives them with honour (water for their feet)
  10(ctx, u, p, sh, t, post) {
    const bg = BG.gau, cam = { z: lerp(1.25, 1.3, p), x: 80, y: 150 }, off = ease(u, 0.6, 1.6);
    gautamaSet(ctx, bg, cam, t, c => {
      glow(c, 400, AH_Y - 300, 380, '#fff2c8', 0.24);
      drawFigure(c, CH.ahalya, P({ pot: true, aN: [lerp(0.06, 0.24, off), lerp(0.24, 0.12, off)], handN: 'hold', aF: [0.1, 0.18], head: 0.06, eye: blink(t, 3), smile: 0.55, gaze: [0.5, 0.2] }), { x: 420, y: AH_Y, s: AH_S, face: 1 }, RADIANT);
      drawFigure(c, CH.rama, P({ bow: 'B', aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', head: 0.08, eye: blink(t, 5), smile: 0.4, gaze: [0.5, 0.2] }), { x: 680, y: 1415, s: 600, face: -1 }, L_DUSK);
      drawFigure(c, CH.lak, P({ bow: 'B', aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', head: 0.08, eye: blink(t, 2), smile: 0.3, gaze: [0.5, 0.2] }), { x: 860, y: 1410, s: 585, face: -1 }, L_DUSK);
    }, 1.2);
    drawLayer(ctx, cam, bg.fg);
  },
  // 11 — flowers rain from the sky; the drums of the gods (Vishvamitra watches)
  11(ctx, u, p, sh, t, post) {
    const bg = BG.gau, cam = { z: lerp(1.0, 1.1, p), x: 0, y: lerp(20, 60, p) }, rain = ease(u, 0.2, 1.4);
    const beat = [0.9, 1.5, 2.1, 2.7].reduce((a, b) => Math.max(a, u > b ? Math.max(0, 1 - (u - b) * 5) : 0), 0);
    post.flash = 0.06 * beat; post.flashCol = '#ffe8b0';
    gautamaSet(ctx, bg, cam, t, c => {
      glow(c, 540, 300, 700, '#fff0d0', 0.25 * rain);
      drawFigure(c, CH.vishva, P({ staff: true, aN: [0.14, 0.12], head: -0.1, eye: blink(t, 7), smile: 0.4, gaze: [0.3, -0.7] }), { x: 160, y: 1430, s: 600, face: 1 }, L_DUSK);
      drawFigure(c, CH.ahalya, P({ handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], head: -0.12, eye: blink(t, 3), smile: 0.6, gaze: [0.2, -0.8] }), { x: 410, y: AH_Y, s: AH_S, face: 1 }, RADIANT);
      drawFigure(c, CH.rama, P({ bow: 'B', aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', head: -0.12, eye: blink(t, 5), smile: 0.4, gaze: [-0.2, -0.8] }), { x: 700, y: 1415, s: 600, face: -1 }, L_DUSK);
      drawFigure(c, CH.lak, P({ bow: 'B', head: -0.12, eye: blink(t, 2), smile: 0.3, gaze: [-0.2, -0.8] }), { x: 880, y: 1410, s: 585, face: -1 }, L_DUSK);
    }, 0.8);
    petals(ctx, t, 3, Math.round(90 * rain), rain);
    drawLayer(ctx, cam, bg.fg);
  },
  // 12 — three stamps over the hermitage, petals still falling
  12(ctx, u, p, sh, t, post) {
    const bg = BG.gau, cam = { z: lerp(1.0, 1.06, p), y: lerp(-10, 20, p) }, st = sentenceStarts(sh, 3);
    gautamaSet(ctx, bg, cam, t, null, 0.8); petals(ctx, t, 3, 50, 0.7); drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#080826', 0.3 + 0.12 * p); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) text(c, s, 545, 780 + i * 116 + (1 - q) * 22, { size: i === 2 ? 76 : 86, weight: 900, color: col || C_IVORY, ls: 5, alpha: q, stroke: 9, shadow: 30 }); });
  },
  // 13 — "Ahalya of stone — not in Valmiki" on the manuscript
  13(ctx, u, p, sh, t, post) {
    const bg = BG.ms, cam = { z: lerp(1.05, 1.12, p), y: 10 }, st = sentenceStarts(sh, 2);
    drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms); withCam(ctx, cam, 0.8, c => flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3));
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => {
      const q0 = ease(u, 0.2, 0.6); if (q0 > 0) text(c, 'AHALYA OF STONE', 540, 560, { size: 74, weight: 900, color: C_IVORY, ls: 4, alpha: q0, stroke: 9, shadow: 28 });
      const q1 = ease(u, st[1] - 0.05, st[1] + 0.3); if (q1 > 0) { text(c, 'NOT IN VALMIKI', 540, 690 + (1 - q1) * 20, { size: 92, weight: 900, color: C_GOLD, ls: 5, alpha: q1, stroke: 10, shadow: 32 }); const w = 360 * easeOut(map(u, st[1], st[1] + 0.35)); c.fillStyle = rgba(C_RED, 0.9); c.fillRect(540 - w, 538, w * 2, 8); }
    };
  },
  14(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
