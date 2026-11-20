// ===== Reel A07 — "Hanuman Thought Mandodari Was Sita" — 11 shots (CE Sundara 5.7–5.9) =====
// Hanuman searches Ravana's palace (5.7.1-3); sees Mandodari asleep, radiant like gold (5.8.48); thinks "This is Sita"
// and dances for joy (5.8.49-50); then reasons from Sita's character that it is not she (5.9.1-3). Kept modest throughout.
function buildScenes() { BG.pal = buildPalace(); BG.ms = buildManuscript(); }
const L_LAMPLIT = { rim: '#ffc878', rimA: 0.9, dir: 1, tint: '#3a1830', tintA: 0.16 };
const HS = 520;                                         // Hanuman's scale in the palace

function queen(c, bg, t, a = 1) {                       // Mandodari asleep on the couch, covered by a silk sheet to the shoulder
  const [cx, cy] = bg.couch;
  c.save(); c.globalAlpha = a;
  lying(c, CH.mandodari, cx + 270, cy - 4, 540, { eye: 0.02, smile: 0.2 }, L_LAMPLIT);
  blob(c, [[cx - 150, cy - 62], [cx + 290, cy - 56], [cx + 300, cy + 8], [cx - 160, cy + 6]], '#7a2a5a', 0.97, 0.3);   // silk cover to the shoulder
  stroke(c, cx - 150, cy - 60, cx + 290, cy - 54, 4, '#e6b450', 0.9);
  c.restore();
}

const SHOTS = {
  // 1 — hook: a shadow behind a gold pillar watches a sleeping queen; the question
  1(ctx, u, p, sh, t, post) {
    const bg = BG.pal, cam = { z: lerp(1.15, 1.25, p), x: 40, y: 120 };
    palace(ctx, bg, cam, t, c => { queen(c, bg, t);
      drawFigure(c, CH.hanuman, P({ lean: 0.1, head: 0.05, eye: blink(t, 3), smile: 0.4, gaze: [0.6, 0.3], tail: Math.sin(t * 2), aN: [0.1, 0.12], aF: [0.12, 0.1] }), { x: 980, y: PAL_FLOOR, s: HS, face: -1 }, Object.assign({}, L_LAMPLIT, { tint: '#120818', tintA: 0.55 })); });
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => { (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.25, 0.55 + i * 0.25); if (q > 0) textFit(c, s, 540, 560 + i * 124 + (1 - q) * 22, { size: 112, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); }); };
  },
  2(ctx, u, p, sh, t, post) { sourceCard(ctx, u, p, sh, t, post, TL.source_card); },
  // 3 — at night, searching for Sita, Hanuman moves between the gold pillars of Ravana's palace
  3(ctx, u, p, sh, t, post) {
    const bg = BG.pal, cam = { z: lerp(1.0, 1.06, p), x: lerp(-60, 40, p), y: 40 };
    palace(ctx, bg, cam, t, c => {
      drawFigure(c, CH.hanuman, walkPose(u * 3.6, 0.3, { lean: 0.15, head: 0.05, eye: blink(t, 3), smile: 0.1, gaze: [0.5, 0], tail: Math.sin(t * 2), brow: 0.3 }), { x: lerp(1100, 700, p), y: PAL_FLOOR, s: HS, face: -1 }, L_LAMPLIT);
    });
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { const q = ease(u, 0.6, 1.1); if (q > 0) { text(c, "RAVANA'S PALACE", 540, 480, { size: 84, weight: 900, color: C_GOLD, ls: 8, alpha: q, stroke: 9, shadow: 30 }); text(c, 'LANKA · NIGHT', 540, 556, { size: 40, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 10, alpha: q, stroke: 6, shadow: 20 }); } };
  },
  // 4 — on a gleaming couch, a queen asleep, radiant like gold: Mandodari
  4(ctx, u, p, sh, t, post) {
    const bg = BG.pal, cam = { z: lerp(1.25, 1.45, p), x: 0, y: lerp(180, 260, p) }, st = sentenceStarts(sh, 2);
    palace(ctx, bg, cam, t, c => { glow(c, bg.couch[0], bg.couch[1] - 60, 320, '#ffd890', 0.25); queen(c, bg, t); });
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { const q = ease(u, st[1] - 0.1, st[1] + 0.4); if (q > 0) { text(c, 'MANDODARI', 540, 520 + (1 - q) * 20, { size: 108, weight: 900, color: C_GOLD, ls: 10, alpha: q, stroke: 10, shadow: 32 }); text(c, "RAVANA'S CHIEF QUEEN", 540, 600 + (1 - q) * 20, { size: 42, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 8, alpha: q, stroke: 6, shadow: 20 }); } };
  },
  // 5 — "This is Sita!" — Hanuman's face lights up
  5(ctx, u, p, sh, t, post) {
    const bg = BG.pal, cam = { z: lerp(1.6, 1.75, p), x: 260, y: 320 }, joy = ease(u, 0.6, 1.6);
    palace(ctx, bg, cam, t, c => {
      queen(c, bg, t, 0.7);
      glow(c, 900, PAL_FLOOR - 420, 260, '#ffe0a0', 0.3 * joy);
      drawFigure(c, CH.hanuman, P({ head: -0.05, eye: lerp(1, 1.25, joy), brow: -0.2 * joy, smile: lerp(0.2, 0.9, joy), mouth: 0.3 * joy, gaze: [-0.6, 0.2], tail: Math.sin(t * 4) * (1 + joy), aN: [0.08, 0.1], aF: [0.1, 0.08] }), { x: 920, y: PAL_FLOOR, s: HS * 1.1, face: -1 }, L_LAMPLIT);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 6 — overjoyed: slaps his arms, kisses his tail, sings, climbs the pillars and leaps down (5.8.50)
  6(ctx, u, p, sh, t, post) {
    const bg = BG.pal, cam = { z: 1.05, x: 0, y: 40 }, ph = u / sh.dur;
    palace(ctx, bg, cam, t, c => {
      queen(c, bg, t, 0.8);
      let x, y, pose;
      if (ph < 0.3) { const k = ph / 0.3; x = 820; y = PAL_FLOOR - Math.abs(Math.sin(u * 7)) * 60; pose = P({ aN: [0.2, -0.15 + 0.2 * Math.sin(u * 14)], aF: [0.2, -0.12 - 0.2 * Math.sin(u * 14)], handN: 'palm', handF: 'palm', smile: 1, mouth: 0.5, eye: 1.2, tail: Math.sin(u * 8) * 2 }); }
      else if (ph < 0.55) { x = 860; y = PAL_FLOOR; pose = P({ aN: [0.3, -0.2], handN: 'hold', aF: [0.25, -0.15], head: 0.2, smile: 0.9, eye: 0.3, tail: 3.5 }); }
      else { const k = (ph - 0.55) / 0.45; x = 1040 - 20 * Math.sin(k * 6); y = lerp(PAL_FLOOR, 820, Math.sin(Math.min(1, k * 1.4) * Math.PI)); pose = P({ aN: [0.12, -0.3], aF: [0.18, -0.28], handN: 'hold', handF: 'hold', smile: 1, mouth: 0.4, eye: 1.2, tail: Math.sin(u * 8) * 2, lean: -0.1 }); }
      drawFigure(c, CH.hanuman, pose, { x, y, s: HS, face: -1 }, L_LAMPLIT);
      if (ph > 0.3 && ph < 0.55) dab(c, x - HS * 0.12, y - HS * 0.6, 8, 8, 0, '#ff8aa0', 0.6);   // the kiss on his tail
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 7 — "Wait. Apart from Rama, Sita would neither sleep nor adorn herself."
  7(ctx, u, p, sh, t, post) {
    const bg = BG.pal, cam = { z: lerp(1.45, 1.55, p), x: 220, y: 280 }, m = mouthEnv(sh, u), st = sentenceStarts(sh, 2), stop = ease(u, 0, 0.5);
    palace(ctx, bg, cam, t, c => {
      queen(c, bg, t, 0.6);
      const hp = P({ aN: [0.24, -0.02], handN: 'palm', aF: [0.08, 0.12], head: 0.08, brow: 0.6 * stop, eye: blink(t, 3), smile: lerp(0.8, -0.1, stop), mouth: m * 0.8, gaze: [-0.4, 0.3], tail: Math.sin(t) * 0.5 });
      hp.head += Math.sin(u * 9) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.hanuman, hp, { x: 900, y: PAL_FLOOR, s: HS * 1.1, face: -1 }, L_LAMPLIT);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 8 — "…not even Indra. This is not Sita." — he turns away from the sleeping queen, with respect
  8(ctx, u, p, sh, t, post) {
    const bg = BG.pal, cam = { z: lerp(1.4, 1.3, p), x: 180, y: 240 }, m = mouthEnv(sh, u), st = sentenceStarts(sh, 2), turn = ease(u, st[1] + 0.2, st[1] + 1.0);
    palace(ctx, bg, cam, t, c => {
      queen(c, bg, t, 0.6 * (1 - turn * 0.5));
      const hp = P({ aN: [0.12, 0.08], aF: [0.1, 0.1], head: lerp(0.0, 0.15, turn), brow: 0.5, eye: blink(t, 3) * lerp(1, 0.6, turn), smile: lerp(0, 0.25, turn), mouth: m * 0.8, gaze: [lerp(-0.4, 0.5, turn), 0.2], tail: Math.sin(t) * 0.5 });
      hp.head += Math.sin(u * 9) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.hanuman, hp, { x: 900, y: PAL_FLOOR, s: HS * 1.1, face: turn > 0.5 ? 1 : -1 }, L_LAMPLIT);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 9 — A MOMENT'S JOY. HER CHARACTER TOLD THE TRUTH.
  9(ctx, u, p, sh, t, post) {
    const bg = BG.pal, cam = { z: lerp(1.0, 1.05, p), y: 20 }, st = sentenceStarts(sh, 2);
    palace(ctx, bg, cam, t, c => queen(c, bg, t, 0.8)); drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#080826', 0.4); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) textFit(c, s, 540, 600 + i * 120 + (1 - q) * 22, { size: i ? 72 : 96, weight: 900, color: col || C_IVORY, ls: 5, alpha: q, stroke: 10, shadow: 30 }); });
  },
  // 10 — "It's in Valmiki" (a reveal, not a myth-buster: no strike-through)
  10(ctx, u, p, sh, t, post) {
    const bg = BG.ms, cam = { z: lerp(1.05, 1.12, p), y: 10 };
    drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms); withCam(ctx, cam, 0.8, c => flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3));
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.2 + i * 0.35, 0.6 + i * 0.35); if (q > 0) text(c, s, 540, 580 + i * 120 + (1 - q) * 20, { size: i ? 112 : 80, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 30 }); });
  },
  11(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
