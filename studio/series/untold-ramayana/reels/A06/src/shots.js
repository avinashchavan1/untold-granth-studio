// ===== Reel A06 — "No Boatman Washed Rama's Feet" — 12 shots (CE Ayodhya 2.44–2.46) =====
// Guha, king of the Nishadas and Rama's friend (2.44.9-12); Lakshmana washes Rama's feet that night (2.44.25);
// Guha keeps watch (2.44.26); at dawn the boatmen row them across (2.46.61-66); Sita prays mid-river (2.46.67-68).
function buildScenes() { BG.gn = buildGanga('night'); BG.gd = buildGanga('dawn'); BG.ms = buildManuscript(); }
const MEMORY = { tint: '#c89a5a', tintA: 0.55, rim: '#ffe0a0', rimA: 0.7, dir: 1, shadow: 0.3 };   // the popular image, as a fading memory
const L_DAWN = { rim: '#ffc890', rimA: 0.9, dir: -1, tint: '#40284a', tintA: 0.12 };

function lying(c, ch, x, y, s, pose, light) {           // a figure asleep on the ground: feet at (x, y), head to the left
  c.save(); c.translate(x, y - s * 0.07); c.rotate(-Math.PI / 2);
  drawFigure(c, ch, P(Object.assign({ eye: 0.05, smile: 0.1, aN: [0.04, 0.3], aF: [0.05, 0.3] }, pose)), { x: 0, y: 0, s, face: 1 }, Object.assign({}, light, { shadow: 0 }));
  c.restore();
}
function drops(c, x, y, t, a = 1) { for (let i = 0; i < 10; i++) { const k = (t * 1.6 + i / 10) % 1; dab(c, x + Math.sin(i * 2.3) * 14, y + k * 50, 3, 4, 0, '#cfe6ff', a * (1 - k)); } }

const SHOTS = {
  // 1 — hook: the famous image (a boatman washing Rama's feet at the boat) dissolves like a ripple on the question
  1(ctx, u, p, sh, t, post) {
    const B1 = Math.max(1.6, sh.vStart - sh.start + sh.speech - 0.1), bg = BG.gd, cam = { z: lerp(1.3, 1.42, p), x: 40, y: 250 }, fade = ease(u, B1, B1 + 1.0);
    ganga(ctx, bg, cam, t, c => { if (fade < 1) boat(c, 640, GANGA_BANK - 30, 260, null); }, c => {
      if (fade < 1) { c.save(); c.globalAlpha = 1 - fade;
        drawFigure(c, CH.rama, P({ bow: 'B', head: 0.1, eye: blink(t, 5), smile: 0.2, gaze: [0.4, 0.6] }), { x: 640, y: GANGA_BANK + 260, s: 600, face: -1 }, MEMORY);
        drawFigure(c, CH.boatman, P({ sit: 1, lean: 0.4, head: 0.2, pot: true, aN: [0.24, 0.24], handN: 'hold', aF: [0.22, 0.3], eye: 0.5, smile: 0.4 }), { x: 430, y: GANGA_BANK + 280, s: 560, face: 1 }, MEMORY);
        c.restore(); }
      if (fade > 0) for (let k = 0; k < 4; k++) { const r = 60 + (fade * 3 + k * 0.5) % 2 * 260; c.globalAlpha = (1 - fade) * 0.5; c.strokeStyle = '#ffe8c0'; c.lineWidth = 3; c.beginPath(); c.ellipse(560, GANGA_BANK + 180, r, r * 0.25, 0, 0, TAU); c.stroke(); } c.globalAlpha = 1;
    });
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => { (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.25, 0.55 + i * 0.25); if (q > 0) textFit(c, s, 540, 560 + i * 124 + (1 - q) * 22, { size: i ? 84 : 104, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); }); };
  },
  2(ctx, u, p, sh, t, post) { sourceCard(ctx, u, p, sh, t, post, TL.source_card); },
  // 3 — the three reach the Ganga at dusk; Guha, king of the Nishadas, comes to meet his friend
  3(ctx, u, p, sh, t, post) {
    const bg = BG.gn, cam = { z: lerp(1.0, 1.1, p), x: 20, y: 60 }, st = sentenceStarts(sh, 2), g = ease(u, st[1] - 0.3, st[1] + 1.6);
    ganga(ctx, bg, cam, t, null, c => {
      drawFigure(c, CH.sita, P({ head: 0.06, eye: blink(t, 4), smile: 0.1, gaze: [0.5, 0] }), { x: 220, y: GANGA_BANK + 290, s: 560, face: 1 }, L_NIGHT);
      drawFigure(c, CH.rama, P({ bow: 'B', head: 0.04, eye: blink(t, 5), smile: 0.2 * g, gaze: [0.5, 0] }), { x: 370, y: GANGA_BANK + 300, s: 600, face: 1 }, L_NIGHT);
      drawFigure(c, CH.lak, P({ bow: 'B', head: 0.04, eye: blink(t, 2), gaze: [0.5, 0] }), { x: 520, y: GANGA_BANK + 305, s: 585, face: 1 }, L_NIGHT);
      if (g > 0) drawFigure(c, CH.guha, walkPose(u * 4 * (1 - g), 0.36 * (1 - g), { bow: 'B', head: 0.05, eye: blink(t, 3), smile: 0.6, gaze: [0.5, 0], aN: [0.115, 0.1], aF: [0.115, 0.1], handN: g > 0.9 ? 'namaste' : 'relaxed', handF: g > 0.9 ? 'none' : 'relaxed' }), { x: lerp(1200, 820, g), y: GANGA_BANK + 300, s: 600, face: -1 }, L_NIGHT);
      fireflies(c, t, 4, 10, [100, 1100, 900, 400], 0.6);
    });
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { const q = ease(u, st[1] + 0.3, st[1] + 0.8); if (q > 0) { text(c, 'GUHA', 540, 480 + (1 - q) * 20, { size: 110, weight: 900, color: C_GOLD, ls: 12, alpha: q, stroke: 10, shadow: 32 }); text(c, 'KING OF THE NISHADAS', 540, 560 + (1 - q) * 20, { size: 46, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 8, alpha: q, stroke: 6, shadow: 22 }); } };
  },
  // 4 — Guha: "Rama, this land is yours, just as Ayodhya is. What may I do for you?"
  4(ctx, u, p, sh, t, post) {
    const bg = BG.gn, cam = { z: lerp(1.3, 1.36, p), x: 160, y: 160 }, m = mouthEnv(sh, u);
    ganga(ctx, bg, cam, t, null, c => {
      drawFigure(c, CH.rama, P({ bow: 'B', aN: [0.2, 0.12], handN: 'palm', head: 0.04, eye: blink(t, 5), smile: 0.45, gaze: [0.5, 0] }), { x: 470, y: GANGA_BANK + 300, s: 620, face: 1 }, L_NIGHT);
      const gp = P({ bow: 'B', aN: [0.24, 0.06], handN: 'palm', aF: [0.16, 0.12], head: 0.03, eye: blink(t, 3), smile: 0.55, mouth: m * 0.8, gaze: [0.5, 0] });
      gp.head += Math.sin(u * 10) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.guha, gp, { x: 760, y: GANGA_BANK + 300, s: 620, face: -1 }, L_NIGHT);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 5 — that night: Rama and Sita asleep on the ground; Lakshmana washes Rama's feet
  5(ctx, u, p, sh, t, post) {
    const bg = BG.gn, cam = { z: lerp(1.35, 1.45, p), x: -60, y: 260 }, st = sentenceStarts(sh, 2), w = ease(u, st[1] - 0.2, st[1] + 0.6);
    ganga(ctx, bg, cam, t, null, c => {
      lying(c, CH.sita, 520, GANGA_BANK + 260, 470, {}, L_NIGHT);
      lying(c, CH.rama, 620, GANGA_BANK + 330, 500, { bow: 0, quiver: 0 }, L_NIGHT);
      drawFigure(c, CH.lak, P({ sit: 1, lean: lerp(0.15, 0.45, w), head: 0.2 + 0.1 * w, pot: true, aN: [0.24, 0.26], handN: 'hold', aF: [0.22, 0.3], handF: 'palm', eye: blink(t, 2) * 0.7, smile: 0.25, bow: 'B' }), { x: 800, y: GANGA_BANK + 350, s: 560, face: -1 }, L_NIGHT);
      if (w > 0.3) drops(c, 650, GANGA_BANK + 250, t, w);
      fireflies(c, t, 8, 8, [100, 1100, 900, 400], 0.5);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 6 — Guha and Lakshmana keep watch all night, bows in hand
  6(ctx, u, p, sh, t, post) {
    const bg = BG.gn, cam = { z: lerp(1.05, 1.1, p), x: 0, y: 80 };
    ganga(ctx, bg, cam, t, null, c => {
      lying(c, CH.sita, 330, GANGA_BANK + 240, 380, {}, L_NIGHT); lying(c, CH.rama, 400, GANGA_BANK + 290, 400, { bow: 0, quiver: 0 }, L_NIGHT);
      drawFigure(c, CH.lak, P({ bow: 'N', aN: [0.08, 0.2], bowAng: 0.05, head: 0.0, eye: blink(t, 2), gaze: [0.6, -0.1], brow: 0.3 }), { x: 700, y: GANGA_BANK + 300, s: 580, face: -1 }, L_NIGHT);
      drawFigure(c, CH.guha, P({ bow: 'N', aN: [0.08, 0.2], bowAng: 0.05, head: 0.0, eye: blink(t, 3), gaze: [0.6, -0.1], brow: 0.3 }), { x: 880, y: GANGA_BANK + 300, s: 600, face: -1 }, L_NIGHT);
      fireflies(c, t, 6, 12, [100, 1000, 900, 500], 0.6);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 7 — WHO WASHED HIS FEET? LAKSHMANA.
  7(ctx, u, p, sh, t, post) {
    const bg = BG.gn, cam = { z: lerp(1.5, 1.56, p), x: -60, y: 320 }, st = sentenceStarts(sh, 2);
    ganga(ctx, bg, cam, t, null, c => {
      lying(c, CH.rama, 620, GANGA_BANK + 330, 500, { bow: 0, quiver: 0 }, L_NIGHT);
      drawFigure(c, CH.lak, P({ sit: 1, lean: 0.45, head: 0.3, pot: true, aN: [0.24, 0.26], handN: 'hold', aF: [0.22, 0.3], handF: 'palm', eye: 0.6, smile: 0.25, bow: 'B' }), { x: 800, y: GANGA_BANK + 350, s: 560, face: -1 }, L_NIGHT);
      drops(c, 650, GANGA_BANK + 250, t, 1);
    });
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) textFit(c, s, 540, 520 + i * 130 + (1 - q) * 22, { size: i ? 112 : 76, weight: 900, color: col || C_IVORY, ls: 5, alpha: q, stroke: 10, shadow: 32 }); });
  },
  // 8 — dawn: a boat at the bank; the boatmen row and it sets out across the Ganga
  8(ctx, u, p, sh, t, post) {
    const bg = BG.gd, cam = { z: lerp(1.05, 1.0, p), x: 0, y: 40 }, st = sentenceStarts(sh, 2), go = ease(u, st[1] - 0.2, sh.dur + 2);
    const bx = lerp(560, 760, go), by = lerp(GANGA_BANK - 20, HORIZON + 260, go), bs = lerp(300, 170, go);
    ganga(ctx, bg, cam, t, c => {
      boat(c, bx, by, bs, cc => {
        drawFigure(cc, CH.boatman, P({ sit: 1, lean: 0.25 + 0.15 * Math.sin(t * 3), aN: [0.25, 0.1], aF: [0.25, 0.12], handN: 'hold', handF: 'hold', eye: 1 }), { x: bx - bs * 0.75, y: by, s: bs * 1.3, face: 1 }, L_DAWN);
        stroke(cc, bx - bs * 0.55, by - bs * 0.2, bx - bs * 0.2 + Math.sin(t * 3) * bs * 0.1, by + bs * 0.3, bs * 0.03, '#5a3a24', 1);           // oar
        drawFigure(cc, CH.sita, P({ sit: 1, handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], eye: blink(t, 4), smile: 0.2 }), { x: bx - bs * 0.2, y: by, s: bs * 1.4, face: 1 }, L_DAWN);
        drawFigure(cc, CH.rama, P({ sit: 1, bow: 'B', eye: blink(t, 5), smile: 0.2, gaze: [0.5, -0.1] }), { x: bx + bs * 0.2, y: by, s: bs * 1.45, face: 1 }, L_DAWN);
        drawFigure(cc, CH.lak, P({ sit: 1, bow: 'B', eye: blink(t, 2), gaze: [0.5, -0.1] }), { x: bx + bs * 0.55, y: by, s: bs * 1.4, face: 1 }, L_DAWN);
      });
      if (go > 0) for (let k = 0; k < 3; k++) { c.globalAlpha = 0.4; c.strokeStyle = '#ffe8d0'; c.lineWidth = 2; c.beginPath(); c.ellipse(bx - bs * (1 + k * 0.4), by + bs * 0.12, bs * 0.3, bs * 0.05, 0, 0, TAU); c.stroke(); } c.globalAlpha = 1;
    }, c => {
      const fade = 1 - ease(u, st[1] - 0.2, st[1] + 1.2);
      if (fade > 0) { c.save(); c.globalAlpha = fade; drawFigure(c, CH.guha, P({ bow: 'B', aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', head: 0.06, eye: blink(t, 3), smile: 0.3, tear: 0.4 }), { x: 900, y: GANGA_BANK + 300, s: 600, face: -1 }, L_DAWN); c.restore(); }
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 9 — mid-river, Sita joins her palms and prays to the Ganga
  9(ctx, u, p, sh, t, post) {
    const bg = BG.gd, cam = { z: lerp(1.6, 1.7, p), x: 120, y: -40 }, bx = 760, by = HORIZON + 260, bs = 170;
    ganga(ctx, bg, cam, t, c => {
      glow(c, bx - bs * 0.2, by - bs * 0.6, 200, '#fff0c8', 0.3);
      boat(c, bx, by, bs, cc => {
        drawFigure(cc, CH.boatman, P({ sit: 1, lean: 0.25 + 0.15 * Math.sin(t * 3), aN: [0.25, 0.1], aF: [0.25, 0.12], handN: 'hold', handF: 'hold', eye: 1 }), { x: bx - bs * 0.75, y: by, s: bs * 1.3, face: 1 }, L_DAWN);
        drawFigure(cc, CH.sita, P({ sit: 1, handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], eye: 0.3, head: 0.08, smile: 0.3 }), { x: bx - bs * 0.2, y: by, s: bs * 1.4, face: -1 }, L_DAWN);
        drawFigure(cc, CH.rama, P({ sit: 1, bow: 'B', eye: blink(t, 5), smile: 0.3, gaze: [-0.5, 0] }), { x: bx + bs * 0.2, y: by, s: bs * 1.45, face: -1 }, L_DAWN);
        drawFigure(cc, CH.lak, P({ sit: 1, bow: 'B', eye: blink(t, 2), gaze: [-0.5, 0] }), { x: bx + bs * 0.55, y: by, s: bs * 1.4, face: -1 }, L_DAWN);
      });
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 10 — NO BARGAIN. NO FOOT-WASHING AT THE BOAT. JUST A FRIEND AND A BOAT.
  10(ctx, u, p, sh, t, post) {
    const bg = BG.gd, cam = { z: lerp(1.0, 1.05, p), y: lerp(-10, 20, p) }, st = sentenceStarts(sh, 3);
    ganga(ctx, bg, cam, t, c => boat(c, 860, HORIZON + 140, 90, null)); drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#080826', 0.32 + 0.12 * p); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) textFit(c, s, 545, 560 + i * 116 + (1 - q) * 22, { size: i === 0 ? 88 : 64, weight: 900, color: col || C_IVORY, ls: 4, alpha: q, stroke: 9, shadow: 30 }); });
  },
  // 11 — "The Kevat story — not in Valmiki"
  11(ctx, u, p, sh, t, post) {
    const bg = BG.ms, cam = { z: lerp(1.05, 1.12, p), y: 10 }, st = sentenceStarts(sh, 2);
    drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms); withCam(ctx, cam, 0.8, c => flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3));
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => {
      const q0 = ease(u, 0.2, 0.6); if (q0 > 0) text(c, 'THE KEVAT STORY', 540, 560, { size: 76, weight: 900, color: C_IVORY, ls: 4, alpha: q0, stroke: 9, shadow: 28 });
      const q1 = ease(u, st[1] - 0.05, st[1] + 0.3); if (q1 > 0) { text(c, 'NOT IN VALMIKI', 540, 690 + (1 - q1) * 20, { size: 92, weight: 900, color: C_GOLD, ls: 5, alpha: q1, stroke: 10, shadow: 32 }); const w = 360 * easeOut(map(u, st[1], st[1] + 0.35)); c.fillStyle = rgba(C_RED, 0.9); c.fillRect(540 - w, 538, w * 2, 8); }
    };
  },
  12(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
