// ===== Reel A102 — "Did Lakshmana Never Sleep?" (part 2 of 2; follows A17) — 12 shots (CE Ayodhya 2.41, 2.44-45, 2.47, 2.49-50) =====
// Night 1, Tamasa: Lakshmana awake all night with Sumantra, telling Rama's virtues (2.41.12-14). Night 2, Ganga at Shringaverapura:
// Guha offers him a bed, "we will keep watch" (2.45.2-3); Lakshmana: "how could I sleep while my brother lies on the ground?" (2.45.9).
// Night 3, under a tree past the Ganga: Rama, "from today we two must keep awake" (2.47.3). By the Yamuna (2.49.15), at night's end
// Rama gently wakes Lakshmana, who had been sleeping beside him (2.50.1-3). Calm narration (not in the energy test).
// opening śloka (CE 2.50.3), Devanagari copied from the CE page
const SLOKA = {"lines": ["स सुप्तः समये भ्रात्रा लक्ष्मणः प्रतिबोधितः ।", "जहौ निद्रां च तन्द्रीं च प्रसक्तं च पथि श्रमम् ॥"], "ref": "AYODHYA KANDA 2.50.3", "en": "“Lakshmana, who had been asleep, was woken at the right time by his brother; he shook off sleep, drowsiness and the weariness of the road.”"};
const VAL501 = { source: 'VALMIKI RAMAYANA', ref: 'AYODHYA KANDA 2.50.1 · CRITICAL EDITION', lines: ['अथ रात्र्यां व्यतीतायामवसुप्तमनन्तरम् ।', 'प्रबोधयामास शनैर्लक्ष्मणं रघुनन्दनः ॥'],
  translit: 'atha rātryāṃ vyatītāyāmavasuptamanantaram, prabodhayāmāsa śanairlakṣmaṇaṃ raghunandanaḥ',
  en: '“Then, as the night passed, Rama, the joy of the Raghus, gently woke Lakshmana, who had been sleeping beside him.”' };
Object.assign(CH, { urmila: { kind: 'woman', skin: '#ddb294', skinSh: '#a47a86', cloth: '#c23a5a', clothSh: '#7e1e3a', border: '#e6b450', hair: '#0d0a16' } });   // as in A17

function buildScenes() { BG.gn = buildGanga('night'); BG.gd = buildGanga('dawn'); BG.forest = buildForest(); BG.pal = buildPalace(); BG.ms = buildManuscript(); }
const L_DAWN = { rim: '#ffc890', rimA: 0.9, dir: -1, tint: '#40284a', tintA: 0.12 };
const L_FOREST = { rim: '#e0b0ff', rimA: 0.8, dir: 1, tint: '#1a1450', tintA: 0.3 };
const MEMORY = { tint: '#c89a5a', tintA: 0.5, rim: '#ffe0a0', rimA: 0.7, dir: 1, shadow: 0.3 };
const dim = (ctx, a = 0.3) => { ctx.fillStyle = rgba('#05061a', a); ctx.fillRect(0, 0, W, H); };
const label = (c, s, y, q, col = C_GOLD, size = 110) => { if (q > 0) text(c, s, 540, y + (1 - q) * 18, { size, weight: 900, color: col, ls: 10, alpha: q, stroke: 10, shadow: 32 }); };
const cards = (c, sh, u, st, y0 = 560, gap = 124, size = 104) => (sh.card || []).forEach(([s, col], i) => { const at = st[Math.min(i, st.length - 1)]; const q = ease(u, at - 0.05, at + 0.35); if (q > 0) textFit(c, s, 540, y0 + i * gap + (1 - q) * 22, { size, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
const NCAM = (p, z0 = 1.12) => ({ z: lerp(z0, z0 + 0.08, p), x: 60, y: 260 });   // night-river framing that keeps the sleepers above the subtitles

// the sleepers on the bank (Rama and Sita), raised clear of the subtitles
function sleepers(c, light, dx = 0) { lying(c, CH.sita, 470 + dx, GANGA_BANK + 130, 380, {}, light); lying(c, CH.rama, 540 + dx, GANGA_BANK + 180, 400, { bow: 0, quiver: 0 }, light); }
function guard(c, ch, x, t, light, o = {}) { drawFigure(c, ch, P(Object.assign({ bow: 'N', aN: [0.08, 0.2], bowAng: 0.05, eye: blink(t, 2), gaze: [0.6, -0.1], brow: 0.3 }, o)), { x, y: GANGA_BANK + 230, s: 600, face: -1 }, light); }

const SHOTS = {
  // 1 — hook: by the river at night, Lakshmana on guard over the sleeping Rama and Sita
  1(ctx, u, p, sh, t, post) {
    const bg = BG.gn, cam = NCAM(p, 1.14);
    ganga(ctx, bg, cam, t, null, c => { sleepers(c, L_NIGHT); guard(c, CH.lak, 860, t, L_NIGHT); fireflies(c, t, 6, 12, [100, 1000, 900, 500], 0.6); });
    drawLayer(ctx, cam, bg.fg); dim(ctx, 0.3);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.25, 0.55 + i * 0.25); if (q > 0) textFit(c, s, 540, 520 + i * 124 + (1 - q) * 22, { size: 108, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
  },
  2(ctx, u, p, sh, t, post) { slokaSource(ctx, u, p, sh, t, post, SLOKA); },
  // 3 — part 1 recap: Urmila asleep in the palace (memory gold), fading to the river at night: PART 2
  3(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), x = ease(u, st[1] - 0.6, st[1] + 0.3);
    if (x < 1) { const bg = BG.pal, cam = { z: lerp(1.15, 1.22, p), x: 40, y: 120 }; const [cx, cy] = bg.couch;
      palace(ctx, bg, cam, t, c => { lying(c, CH.urmila, cx + 270, cy - 4, 540, { eye: 0.02, smile: 0.15 }, MEMORY); blob(c, [[cx - 150, cy - 62], [cx + 290, cy - 56], [cx + 300, cy + 8], [cx - 160, cy + 6]], '#7e1e3a', 0.97, 0.3); stroke(c, cx - 150, cy - 60, cx + 290, cy - 54, 4, '#e6b450', 0.9); });
      drawLayer(ctx, cam, bg.fg); ctx.fillStyle = rgba('#c89a5a', 0.16); ctx.fillRect(0, 0, W, H); dim(ctx, 0.3); }
    if (x > 0) { ctx.save(); ctx.globalAlpha = x; const bg = BG.gn, cam = NCAM(p, 1.0); ganga(ctx, bg, cam, t, null, c => fireflies(c, t, 4, 10, [100, 1100, 900, 400], 0.6)); drawLayer(ctx, cam, bg.fg); dim(ctx, 0.25); ctx.restore(); }
    post.ui = c => { const q = ease(u, 0.2, 0.6) * (1 - ease(u, st[1] - 0.4, st[1])); if (q > 0) { label(c, 'PART 1', 500, q, C_IVORY, 96); text(c, 'NO 14-YEAR SLEEP IN VALMIKI', 540, 590, { size: 40, font: 'Montserrat', weight: 800, color: C_GOLD, ls: 5, alpha: q, stroke: 6, shadow: 20 }); } cards(c, sh, u, [st[1]], 560, 124, 120); };
  },
  // 4 — night 1, the Tamasa: Rama and Sita asleep on leaves; Lakshmana sits up all night by the chariot, speaking of Rama's virtues
  4(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), bg = BG.gn, cam = NCAM(p, 1.12), m = 0.35 + 0.35 * Math.abs(Math.sin(t * 5));
    ganga(ctx, bg, cam, t, null, c => {
      chariot(c, 230, GANGA_BANK + 180, 170, 1);
      sleepers(c, L_NIGHT, 60);
      drawFigure(c, CH.lak, P({ sit: 1, bow: 'B', head: 0.04, eye: blink(t, 2), gaze: [-0.4, 0], mouth: u > st[1] + 1.5 ? m * 0.5 : 0, aN: [0.2, 0.14], handN: 'palm' }), { x: 880, y: GANGA_BANK + 250, s: 560, face: -1 }, L_NIGHT);
      fireflies(c, t, 8, 10, [100, 1100, 900, 400], 0.6);
    });
    drawLayer(ctx, cam, bg.fg); dim(ctx, 0.2);
    post.ui = c => { label(c, 'NIGHT 1', 470, ease(u, 0.2, 0.6)); text(c, 'THE TAMASA · 2.41.14', 540, 550, { size: 38, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 5, alpha: ease(u, 0.4, 0.8), stroke: 6, shadow: 20 }); };
  },
  // 5 — night 2, the Ganga: Guha, king of the Nishadas, comes to Lakshmana
  5(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), bg = BG.gn, cam = NCAM(p, 1.1), g = ease(u, st[1] - 0.6, st[1] + 1.4);
    ganga(ctx, bg, cam, t, null, c => {
      sleepers(c, L_NIGHT, -80); guard(c, CH.lak, 640, t, L_NIGHT, { gaze: [-0.5, 0] });
      drawFigure(c, CH.guha, walkPose(u * 4 * (1 - g), 0.36 * (1 - g), { bow: 'B', head: 0.05, eye: blink(t, 3), smile: 0.4, gaze: [-0.5, 0] }), { x: lerp(1250, 900, g), y: GANGA_BANK + 230, s: 600, face: -1 }, L_NIGHT);
    });
    drawLayer(ctx, cam, bg.fg); dim(ctx, 0.2);
    post.ui = c => { label(c, 'NIGHT 2', 470, ease(u, 0.2, 0.6)); text(c, 'THE GANGA · GUHA', 540, 550, { size: 38, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 5, alpha: ease(u, 0.4, 0.8), stroke: 6, shadow: 20 }); };
  },
  // 6 — Guha: "Prince, this bed is for you; sleep. We will keep watch all night." (2.45.2-3)
  6(ctx, u, p, sh, t, post) {
    const bg = BG.gn, cam = { z: lerp(1.3, 1.36, p), x: 180, y: 300 }, m = mouthEnv(sh, u);
    ganga(ctx, bg, cam, t, null, c => {
      sleepers(c, L_NIGHT, -160);
      guard(c, CH.lak, 560, t, L_NIGHT, { face: 1, gaze: [0.5, 0] });
      const gp = P({ bow: 'B', aN: [0.24, 0.06], handN: 'palm', aF: [0.16, 0.12], head: 0.03, eye: blink(t, 3), smile: 0.4, mouth: m * 0.8, gaze: [0.5, 0] });
      drawFigure(c, CH.guha, gp, { x: 860, y: GANGA_BANK + 230, s: 620, face: -1 }, L_NIGHT);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 7 — Lakshmana: "While my brother lies on the ground with Sita, how could I sleep?" (2.45.9) — he looks back at the sleepers
  7(ctx, u, p, sh, t, post) {
    const bg = BG.gn, cam = { z: lerp(1.3, 1.38, p), x: 120, y: 300 }, m = mouthEnv(sh, u), st = sentenceStarts(sh, 2), look = ease(u, 0.2, 1.2) * (1 - ease(u, st[1], st[1] + 0.8));
    ganga(ctx, bg, cam, t, null, c => {
      sleepers(c, L_NIGHT, -100);
      drawFigure(c, CH.lak, P({ bow: 'N', aN: [0.08, 0.2], bowAng: 0.05, eye: blink(t, 2), brow: 0.6, mouth: m * 0.8, gaze: [lerp(0.5, -0.6, look), 0.2 * look], head: 0.06 * look }), { x: 720, y: GANGA_BANK + 230, s: 640, face: 1 }, L_NIGHT);
      drawFigure(c, CH.guha, P({ bow: 'B', eye: blink(t, 3), smile: 0.1, gaze: [-0.5, 0], brow: 0.3 }), { x: 960, y: GANGA_BANK + 230, s: 620, face: -1 }, L_NIGHT);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 8 — night 3, across the Ganga, under a great tree: Rama turns to Lakshmana
  8(ctx, u, p, sh, t, post) {
    const bg = BG.forest, cam = { z: lerp(1.05, 1.12, p), x: 40, y: 0 };
    drawLayer(ctx, cam, bg.back); drawLayer(ctx, cam, bg.l1); drawLayer(ctx, cam, bg.l2); drawLayer(ctx, cam, bg.l3);
    withCam(ctx, cam, 0.85, c => {
      drawFigure(c, CH.sita, P({ sit: 1, eye: blink(t, 4), smile: 0.1, gaze: [0.4, 0] }), { x: 360, y: 1420, s: 520, face: 1 }, L_FOREST);
      drawFigure(c, CH.rama, P({ sit: 1, bow: 'B', eye: blink(t, 5), smile: 0.1, gaze: [0.5, 0] }), { x: 540, y: 1430, s: 560, face: 1 }, L_FOREST);
      drawFigure(c, CH.lak, P({ sit: 1, bow: 'B', eye: blink(t, 2), gaze: [-0.5, 0] }), { x: 780, y: 1430, s: 550, face: -1 }, L_FOREST);
      fireflies(c, t, 3, 10, [100, 1000, 800, 500], 0.6);
    });
    drawLayer(ctx, cam, bg.fg); dim(ctx, 0.2);
    post.ui = c => { label(c, 'NIGHT 3', 470, ease(u, 0.2, 0.6)); text(c, 'PAST THE GANGA · UNDER A TREE', 540, 550, { size: 38, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 5, alpha: ease(u, 0.4, 0.8), stroke: 6, shadow: 20 }); };
  },
  // 9 — Rama: "Lakshmana, from today we two must stay awake at night; Sita's safety rests on us both." (2.47.3)
  9(ctx, u, p, sh, t, post) {
    const bg = BG.forest, cam = { z: lerp(1.25, 1.3, p), x: 80, y: 120 }, m = mouthEnv(sh, u);
    drawLayer(ctx, cam, bg.back); drawLayer(ctx, cam, bg.l1); drawLayer(ctx, cam, bg.l2); drawLayer(ctx, cam, bg.l3);
    withCam(ctx, cam, 0.85, c => {
      drawFigure(c, CH.rama, P({ sit: 1, bow: 'B', aN: [0.2, 0.1], handN: 'palm', eye: blink(t, 5), smile: 0.15, mouth: m * 0.8, gaze: [0.5, 0], brow: 0.3 }), { x: 480, y: 1430, s: 600, face: 1 }, L_FOREST);
      drawFigure(c, CH.lak, P({ sit: 1, bow: 'B', eye: blink(t, 2), gaze: [-0.5, 0], head: 0.05 }), { x: 760, y: 1430, s: 580, face: -1 }, L_FOREST);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 10 — by the Yamuna, at dawn: quote card 2.50.1 (narrator reads it); then Rama gently wakes the sleeping Lakshmana
  10(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), qa = st[1] - 0.3, qb = st[2] - 0.2;
    if (u >= qa && u < qb) return quoteCard(ctx, u - qa, sh, t, post, Object.assign({ enAt: qb - qa - 0.1 }, VAL501));
    const bg = BG.gd, k = u < qa ? 0 : ease(u, qb, qb + 2.2), cam = { z: lerp(1.25, 1.36, ease(u, qb, sh.dur)), x: 40, y: 280 };
    ganga(ctx, bg, cam, t, null, c => {
      lying(c, CH.sita, 330, GANGA_BANK + 130, 380, { eye: lerp(0.05, 0.7, k) }, L_DAWN);
      lying(c, CH.lak, 640, GANGA_BANK + 190, 420, { bow: 0, quiver: 0, eye: lerp(0.02, 0.9, ease(u, qb + 1.4, qb + 2.6)) }, L_DAWN);
      drawFigure(c, CH.rama, P({ sit: 1, lean: 0.35 * k, bow: 'B', aN: [0.24, 0.3 * k], handN: 'palm', eye: blink(t, 5), smile: 0.35, gaze: [0.3, 0.6] }), { x: 840, y: GANGA_BANK + 250, s: 560, face: -1 }, L_DAWN);
    });
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { const q = u < qa ? ease(u, 0.2, 0.6) : 0; if (q > 0) { label(c, 'DAYS LATER', 480, q, C_IVORY, 96); text(c, 'BY THE YAMUNA · 2.49.15', 540, 560, { size: 38, font: 'Montserrat', weight: 800, color: C_GOLD, ls: 5, alpha: q, stroke: 6, shadow: 20 }); } };
  },
  // 11 — HE KEPT WATCH. HE SLEPT TOO. Dawn: the brothers stand together by the river
  11(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 4), bg = BG.gd, cam = { z: lerp(1.05, 1.1, p), x: 0, y: 120 };
    ganga(ctx, bg, cam, t, null, c => {
      drawFigure(c, CH.sita, P({ eye: blink(t, 4), smile: 0.3, gaze: [0.5, 0] }), { x: 380, y: GANGA_BANK + 230, s: 560, face: 1 }, L_DAWN);
      drawFigure(c, CH.rama, P({ bow: 'B', eye: blink(t, 5), smile: 0.35, gaze: [0.5, 0] }), { x: 560, y: GANGA_BANK + 240, s: 600, face: 1 }, L_DAWN);
      drawFigure(c, CH.lak, P({ bow: 'B', eye: blink(t, 2), smile: 0.35, gaze: [-0.5, 0] }), { x: 760, y: GANGA_BANK + 240, s: 590, face: -1 }, L_DAWN);
    });
    drawLayer(ctx, cam, bg.fg); dim(ctx, 0.3);
    post.ui = c => cards(c, sh, u, [st[0], st[1]], 480, 124, 104);
  },
  12(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
