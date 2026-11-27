// ===== Reel A62 — "The Young Ascetic Had No Name" (part 1 of 2; A105 follows) — 13 shots (CE Ayodhya 2.57; 2.58 for the name) =====
// Popular: "Shravan Kumar" carries his blind parents in a kavad on pilgrimage. CE: Dasharatha tells the story himself, at midnight, to Kausalya (2.57.3);
// then crown prince, unmarried Kausalya, the rains (2.57.10); a night hunt on the Sarayu, a sound like a pot filling, an arrow at the sound (2.57.14-17);
// "how could a weapon fall on an ascetic like me?" (2.57.18); alone at night for water (2.57.19); his words (2.57.23, 29, 31); never named
// (only तापस / मुनिपुत्र, 2.57.27, 2.58.40-42). Manas: "तापस अंध साप सुधि आई" (no name either).
// Dasharatha: owner's look C (CH.dasharatha) in the palace; the YOUNG prince is only a moonlit silhouette (no new major-character look).
// Minor looks (Claude's picks): the young ascetic, his blind parents.
const SLOKA = {"lines": ["एकेन खलु बाणेन मर्मण्यभिहते मयि ।", "द्वावन्धौ निहतौ वृद्धौ माता जनयिता च मे ॥"], "ref": "AYODHYA KANDA 2.57.30",
  "en": "“With one arrow, struck in my vital spot, two are killed with me: my blind, aged mother and father.”",
  "translit": "ekena khalu bāṇena marmaṇyabhihate mayi, dvāvandhau nihatau vṛddhau mātā janayitā ca me"};
const MANAS = { source: 'RAMCHARITMANAS', ref: 'TULSIDAS · AYODHYA KAND · BEFORE DOHA 155', lines: ['तापस अंध साप सुधि आई।', 'कौसल्यहि सब कथा सुनाई॥'],
  translit: 'tāpas andh sāp sudhi āī, kausalyahi sab kathā sunāī', en: '“He remembered the blind ascetic\'s curse, and told Kausalya the whole story.”' };

Object.assign(CH, {
  muniputra: { kind: 'monk', skin: '#b07e58', skinSh: '#6e4a40', cloth: '#a07a4e', clothSh: '#64482c', hair: '#141018' },          // the young ascetic: dark hair, bark and deerskin
  andhamuni: { kind: 'monk', sage: true, skin: '#a87a5a', skinSh: '#6a4a4a', cloth: '#9a7a52', clothSh: '#5e4a30', hair: '#e4ded4' }, // his blind father: white jata and beard
  andhamata: { kind: 'woman', elder: true, plain: true, skin: '#a97a5c', skinSh: '#6c4a4c', cloth: '#8d6a44', clothSh: '#56402c', border: '#6a4a2c', blouse: '#6e5034', hair: '#dcd6cc' },   // his blind mother
});

function buildScenes() { BG.river = buildWideRiver('night'); BG.pal = buildPalace(); BG.ash = buildHermitage('night'); BG.ms = buildManuscript(); }
const L_MOON = { rim: '#c8d8ff', rimA: 0.85, dir: -1, tint: '#141a44', tintA: 0.3 };

const SIL = { rim: '#b8ccff', rimA: 1.0, dir: -1, tint: '#05061a', tintA: 0.86, shadow: 0 };      // the young prince: a moonlit silhouette
const MEMORY = { tint: '#c89a5a', tintA: 0.5, rim: '#ffe0a0', rimA: 0.7, dir: 1, shadow: 0.3 };
const RB = RIVER_BANK, PF = PAL_FLOOR;
const dim = (ctx, a = 0.3) => { ctx.fillStyle = rgba('#05061a', a); ctx.fillRect(0, 0, W, H); };
const label = (c, s, y, q, col = C_GOLD, size = 96) => { if (q > 0) textFit(c, s, 540, y + (1 - q) * 18, { size, weight: 900, color: col, ls: 8, alpha: q, stroke: 10, shadow: 32 }, 960); };
const sub = (c, s, y, q, col = C_IVORY) => { if (q > 0) text(c, s, 540, y, { size: 40, font: 'Montserrat', weight: 800, color: col, ls: 5, alpha: q, stroke: 6, shadow: 20 }); };
const cards = (c, sh, u, st, y0 = 520, gap = 120, size = 96) => (sh.card || []).forEach(([s, col], i) => { const at = st[Math.min(i, st.length - 1)]; const q = ease(u, at - 0.05, at + 0.35); if (q > 0) textFit(c, s, 540, y0 + i * gap + (1 - q) * 22, { size, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }, 960); });
const fig = (c, k, pose, x, y, s, face, light) => drawFigure(c, CH[k], P(Object.assign({ eye: 1, gaze: [0.4, 0] }, pose)), { x, y, s, face }, light);
// a clay water pot (ghata)
function pot(c, x, y, s, tilt = 0, full = 1) {
  c.save(); c.translate(x, y); c.rotate(tilt);
  dab(c, 0, 0, s * 0.5, s * 0.46, 0, '#8a4a26'); dab(c, -s * 0.12, -s * 0.12, s * 0.22, s * 0.16, 0, '#b0683a');
  blob(c, [[-s * 0.2, -s * 0.42], [s * 0.2, -s * 0.42], [s * 0.26, -s * 0.56], [-s * 0.26, -s * 0.56]], '#7a3e1e', 1, 0.2);
  stroke(c, -s * 0.44, -s * 0.06, s * 0.44, -s * 0.06, s * 0.04, '#5a2a14', 0.7);
  if (full > 0) dab(c, 0, -s * 0.55, s * 0.22, s * 0.05, 0, rgba('#9ab8e8', 0.8 * full));
  c.restore();
}
function rain(c, t, a = 1) { for (let i = 0; i < 150; i++) { const h = hash(i * 3.1), x = (h * 1400 + t * 120) % 1300 - 100, y = (hash(i * 7.7) * 2100 + t * 1500) % 2100 - 100; stroke(c, x, y, x - 14, y + 60, 2, '#cfe2ff', 0.38 * a); } }
function ripples(c, x, y, t, a = 1) { for (let k = 0; k < 3; k++) { const r = ((t * 60 + k * 50) % 150); c.save(); c.globalAlpha = a * (1 - r / 150) * 0.7; c.strokeStyle = '#c8d8ff'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, r * 1.6, r * 0.35, 0, 0, Math.PI * 2); c.stroke(); c.restore(); } }
function arrowFly(c, x0, y0, x1, y1, q) { if (q <= 0 || q >= 1) return; const x = lerp(x0, x1, q), y = lerp(y0, y1, q), dx = (x1 - x0), dy = (y1 - y0), L = Math.hypot(dx, dy);
  stroke(c, x - dx / L * 220, y - dy / L * 220, x, y, 5, '#fff0c8', 0.35); stroke(c, x - dx / L * 90, y - dy / L * 90, x, y, 4, '#e8d0a0', 1); glow(c, x, y, 60, '#ffe0a0', 0.4); }
const night = (ctx, cam, t, mid, r = 0) => { wideRiver(ctx, BG.river, cam, t, null, mid); drawLayer(ctx, cam, BG.river.fg); if (r > 0) rain(ctx, t, r); };
function prince(c, x, y, s, face, aim) { fig(c, 'dasharatha', aim ? { bow: 'B', aN: [0.26, -0.02], aF: [0.24, 0.02], eye: 0.8, gaze: [0.5, 0] } : { bow: 'B', eye: 0.8 }, x, y, s, face, SIL); glow(c, x, y - s * 0.8, s * 0.5, '#8aa0ff', 0.06); }
function ascetic(c, x, y, s, face, pose, light = L_MOON) { fig(c, 'muniputra', pose, x, y, s, face, light); }

const SHOTS = {
  // 1 — hook: a night river, an empty clay pot bobbing where a young man fell (the name Valmiki never gives)
  1(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.12, 1.2, p), x: 0, y: 120 };
    night(ctx, cam, t, c => { ripples(c, 600, RB - 40, t); pot(c, 600, RB - 60 + Math.sin(t * 2) * 6, 130, 0.6 + Math.sin(t * 1.3) * 0.08, 0); });
    dim(ctx, 0.25); post.ui = c => cards(c, sh, u, [0.15, sentenceStarts(sh, 1)[0] + 0.4], 470, 124, 104);
  },
  2(ctx, u, p, sh, t, post) { slokaSource(ctx, u, p, sh, t, post, SLOKA); },
  // 3 — the story we know (memory gold): a son carrying his blind parents in a kavad
  3(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.1, 1.16, p), x: 0, y: 160 }, bg = BG.ash, x = lerp(300, 720, ease(u, 0, sh.dur));
    hermitage(ctx, bg, cam, t, c => {
      const wp = walkPose(u * 2.4, 0.25, { eye: blink(t, 4), smile: 0.2, aN: [0.42, -0.34], aF: [0.42, -0.34] });
      stroke(c, x - 330, RB - 520, x + 330, RB - 520, 12, '#8a6a3a', 1);                                   // the pole across his shoulders
      [-1, 1].forEach(sd => { const bx = x + sd * 300; stroke(c, bx - 60, RB - 520, bx - 75, RB - 330, 3, '#6a4a2a', 0.9); stroke(c, bx + 60, RB - 520, bx + 75, RB - 330, 3, '#6a4a2a', 0.9);
        fig(c, sd < 0 ? 'andhamata' : 'andhamuni', { sit: 1, eye: 0.02, smile: 0.2 }, bx, RB - 300, 330, -sd, MEMORY);
        blob(c, [[bx - 115, RB - 370], [bx + 115, RB - 370], [bx + 95, RB - 270], [bx - 95, RB - 270]], '#9a7034', 1, 0.2); });
      drawFigure(c, CH.muniputra, wp, { x, y: RB + 10, s: 600, face: 1 }, MEMORY);
    }, 0.4);
    drawLayer(ctx, cam, bg.fg); ctx.fillStyle = rgba('#c89a5a', 0.16); ctx.fillRect(0, 0, W, H); dim(ctx, 0.15);
    post.ui = c => label(c, 'THE STORY WE KNOW', 400, ease(u, 0.2, 0.6), C_GOLD, 80);
  },
  // 4 — but in Valmiki, Dasharatha tells it himself, at midnight, to Kausalya (2.57.3)
  4(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.15, 1.22, p), x: 0, y: 180 };
    palace(ctx, BG.pal, cam, t, c => fig(c, 'dasharatha', { sit: 1, eye: 0.55, head: 0.1, gaze: [0.3, 0.4], brow: 0.6, smile: -0.25 }, 470, PF, 660, 1, L_LAMP));
    drawLayer(ctx, cam, BG.pal.fg); dim(ctx, 0.3);
    post.ui = c => { label(c, 'AYODHYA', 400, ease(u, 0.2, 0.6)); sub(c, 'MIDNIGHT · 2.57.3', 480, ease(u, 0.4, 0.8)); };
  },
  // 5 — Dasharatha: "My queen, you were not even married then, and I was the crown prince. It was the rainy season." (2.57.10)
  5(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), cam = { z: lerp(1.35, 1.42, p), x: -60, y: 300 };
    palace(ctx, BG.pal, cam, t, c => { const dp = P({ sit: 1, eye: blink(t, 4) * 0.8, head: 0.05, gaze: [0.5, 0.1], brow: 0.5, smile: -0.1, mouth: m * 0.8, aN: [0.2, 0.08], handN: 'palm' }); dp.head += Math.sin(u * 9) * 0.01 * (m > 0.1 ? 1 : 0); drawFigure(c, CH.dasharatha, dp, { x: 460, y: PF, s: 680, face: 1 }, L_LAMP); });
    drawLayer(ctx, cam, BG.pal.fg); dim(ctx, 0.2);
    if (u > sh.dur * 0.7) rain(ctx, t, ease(u, sh.dur * 0.7, sh.dur));
  },
  // 6 — night, rain, the Sarayu: a sound like a pot filling; he thinks it's an elephant and shoots at the sound (2.57.14-17)
  6(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), cam = { z: lerp(1.1, 1.22, p), x: lerp(0, -60, p), y: 140 }, fire = st[2] + 1.6;
    night(ctx, cam, t, c => {
      if (u > st[1] - 0.2) ripples(c, 900, RB - 60, t, ease(u, st[1] - 0.2, st[1] + 0.5));
      prince(c, 250, RB + 40, 620, 1, u > st[2]);
      arrowFly(c, 420, RB - 470, 900, RB - 90, ease(u, fire, fire + 0.35));
    }, 0.9);
    dim(ctx, 0.2); post.ui = c => { if (u < st[1]) { label(c, 'THE SARAYU', 400, ease(u, 0.2, 0.6)); sub(c, 'A NIGHT IN THE RAINS', 480, ease(u, 0.4, 0.8)); } if (u > st[1] && u < st[2]) sub(c, '· A SOUND IN THE WATER ·', 420, ease(u, st[1], st[1] + 0.4), '#cfe2ff'); };
    post.flash = 0.2 * ease(u, fire + 0.3, fire + 0.4) * (1 - ease(u, fire + 0.4, fire + 0.9)); post.flashCol = '#ffffff';
  },
  // 7 — a human cry: "Ah! How could a weapon fall on an ascetic like me?" (2.57.18)
  7(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), cam = { z: lerp(1.3, 1.38, p), x: -80, y: 260 }, fall = ease(u, 0.2, sh.dur * 0.9);
    night(ctx, cam, t, c => {
      c.save(); c.translate(600, RB + 20); c.rotate(0.16 * fall); c.translate(-600, -RB - 20);
      ascetic(c, 600, RB + 20, 600, -1, { eye: 0.6, brow: 0.9, smile: -0.6, mouth: Math.max(m, 0.2), head: 0.12 * fall, aN: [0.14, 0.24], aF: [0.16, 0.22], gaze: [0, -0.3] });
      stroke(c, 560, RB - 330, 690, RB - 400, 5, '#e8d0a0', 1); glow(c, 580, RB - 330, 60, '#ff6040', 0.25 * fall); c.restore();
      pot(c, 820, RB - 30, 120, 1.2, 0.4); ripples(c, 820, RB - 20, t);
    }, 0.6);
    dim(ctx, 0.2);
  },
  // 8 — REVEAL: no pilgrimage, no kavad — he came alone, at night, to fetch water (2.57.19, 2.57.35)
  8(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), cam = { z: lerp(1.15, 1.22, p), x: 0, y: 170 };
    night(ctx, cam, t, c => { ascetic(c, 560, RB + 20, 620, 1, { eye: blink(t, 4), smile: 0.15, gaze: [0.5, 0.2], aN: [0.2, 0.18], aF: [0.05, 0.12] }); pot(c, 700, RB - 330, 130, 0, 1); });
    dim(ctx, 0.3); post.ui = c => cards(c, sh, u, [st[1], st[1] + 1.4], 250, 120, 100);
  },
  // 9 — "O King, what wrong did I do you? I only came for water… my blind mother and father… thirsty, waiting for me" (2.57.23, 29, 31)
  9(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), cam = { z: lerp(1.25, 1.32, p), x: 0, y: 240 };
    night(ctx, cam, t, c => {
      lying(c, CH.muniputra, 1050, RB + 10, 540, { eye: 0.4, brow: 0.7, smile: -0.3, mouth: m * 0.8, gaze: [-0.3, 0] }, L_MOON);
      stroke(c, 760, RB - 110, 800, RB - 220, 5, '#e8d0a0', 1);
      fig(c, 'dasharatha', { sit: 1, eye: 0.6, head: 0.15, gaze: [0.5, 0.4], aN: [0.25, 0.25], aF: [0.25, 0.3] }, 240, RB + 30, 560, 1, SIL);
    });
    dim(ctx, 0.2);
  },
  // 10 — Tulsidas gives no name either: "तापस अंध साप सुधि आई। कौसल्यहि सब कथा सुनाई॥" (quote card; the narrator reads it)
  10(ctx, u, p, sh, t, post) { const st = sentenceStarts(sh, 3), qa = Math.max(0, st[1] - 0.4); quoteCard(ctx, u - qa, sh, t, post, Object.assign({ enAt: st[2] - qa }, MANAS)); if (u < qa) { ctx.fillStyle = rgba('#05061a', 1 - u / Math.max(0.01, qa)); ctx.fillRect(0, 0, W, H); } },
  // 11 — the payoff: no name in Valmiki, only "the ascetic", "the sage's son"; the name Shravan came later; both told with devotion
  11(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 4), cam = { z: lerp(1.12, 1.2, p), x: 0, y: 170 };
    night(ctx, cam, t, c => { glow(c, 560, RB - 600, 520, '#c8d8ff', 0.18); ascetic(c, 560, RB + 20, 660, 1, { eye: blink(t, 4), smile: 0.3, gaze: [0.2, 0], handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] }); });
    dim(ctx, 0.3); post.ui = c => cards(c, sh, u, [st[0] + 0.6, st[1]], 250, 116, 92);
  },
  // 12 — tease part 2: the path to the ashram; two blind parents wait by a lamp
  12(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.1, 1.18, p), x: 0, y: 160 }, bg = BG.ash;
    hermitage(ctx, bg, cam, t, c => { fig(c, 'andhamuni', { sit: 1, eye: 0.02, head: 0.1, gaze: [0.4, -0.2] }, 470, RB + 10, 520, 1, L_LAMP); fig(c, 'andhamata', { sit: 1, eye: 0.02, head: 0.12 }, 690, RB + 10, 470, -1, L_LAMP); flame(c, 580, RB - 70, 22, t, 2); glow(c, 580, RB - 80, 260, '#ffb860', 0.25); }, 0.4);
    drawLayer(ctx, cam, bg.fg); dim(ctx, 0.3);
    post.ui = c => cards(c, sh, u, [sentenceStarts(sh, 2)[1] + 1.0, sentenceStarts(sh, 2)[1] + 1.6], 440, 124, 100);
  },
  13(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
