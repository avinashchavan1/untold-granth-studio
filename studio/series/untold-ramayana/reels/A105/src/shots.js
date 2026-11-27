// ===== Reel A105 — "The Curse That Came True That Night" (part 2 of 2; follows A62) — 11 shots (CE Ayodhya 2.57.34-39; 2.58) =====
// Shared look and helpers copied from A62 (same cast, same sets).
// Popular: "Shravan Kumar" carries his blind parents in a kavad on pilgrimage. CE: Dasharatha tells the story himself, at midnight, to Kausalya (2.57.3);
// then crown prince, unmarried Kausalya, the rains (2.57.10); a night hunt on the Sarayu, a sound like a pot filling, an arrow at the sound (2.57.14-17);
// "how could a weapon fall on an ascetic like me?" (2.57.18); alone at night for water (2.57.19); his words (2.57.23, 29, 31); never named
// (only तापस / मुनिपुत्र, 2.57.27, 2.58.40-42). Manas: "तापस अंध साप सुधि आई" (no name either).
// Dasharatha: owner's look C (CH.dasharatha) in the palace; the YOUNG prince is only a moonlit silhouette (no new major-character look).
// Minor looks (Claude's picks): the young ascetic, his blind parents.
const SLOKA = {"lines": ["पुत्रव्यसनजं दुःखं यदेतन्मम साम्प्रतम् ।", "एवं त्वं पुत्रशोकेन राजन् कालं करिष्यसि ॥"], "ref": "AYODHYA KANDA 2.58.46",
  "en": "“As I now grieve the loss of my son, so you too, O King, will die of grief for a son.”",
  "translit": "putravyasanajaṃ duḥkhaṃ yadetanmama sāmpratam, evaṃ tvaṃ putraśokena rājan kālaṃ kariṣyasi"};
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


function vimana(c, x, y, s, t, a) { c.save(); c.globalAlpha = a; glow(c, x, y, s * 2.2, '#fff0c0', 0.35); glow(c, x, y, s * 0.9, '#ffffff', 0.3);
  blob(c, [[x - s, y], [x + s, y], [x + s * 0.7, y + s * 0.3], [x - s * 0.7, y + s * 0.3]], '#e6b450', 1, 0.2);
  blob(c, [[x - s * 0.5, y], [x - s * 0.3, y - s * 0.7], [x, y - s], [x + s * 0.3, y - s * 0.7], [x + s * 0.5, y]], '#f5d27a', 1, 0.2); c.restore(); }
const ashram = (ctx, cam, t, mid) => { hermitage(ctx, BG.ash, cam, t, mid, 0.4); drawLayer(ctx, cam, BG.ash.fg); };

const SHOTS = {
  // 1 — hook: midnight in Ayodhya, the old king and a guttering lamp; "the curse came true that very night"
  1(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.2, 1.3, p), x: 0, y: 200 };
    palace(ctx, BG.pal, cam, t, c => fig(c, 'dasharatha', { sit: 1, eye: 0.45, head: 0.14, gaze: [0.3, 0.5], brow: 0.7, smile: -0.3 }, 470, PF, 660, 1, L_LAMP));
    drawLayer(ctx, cam, BG.pal.fg); dim(ctx, 0.35); post.ui = c => cards(c, sh, u, [0.15, 0.9], 250, 120, 100);
  },
  2(ctx, u, p, sh, t, post) { slokaSource(ctx, u, p, sh, t, post, SLOKA); },
  // 3 — last time: the arrow in the dark (recap of A62)
  3(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), cam = { z: lerp(1.1, 1.18, p), x: 0, y: 140 }, fire = st[1] + 1.2;
    night(ctx, cam, t, c => { prince(c, 250, RB + 40, 620, 1, true); arrowFly(c, 420, RB - 470, 880, RB - 300, ease(u, fire, fire + 0.35));
      if (u > st[2]) ascetic(c, 880, RB + 20, 560, -1, { eye: 0.6, brow: 0.9, smile: -0.6, aN: [0.14, 0.24], aF: [0.16, 0.22] }); }, 0.6);
    dim(ctx, 0.25); post.ui = c => cards(c, sh, u, [0.1, 0.5], 250, 116, 88);
  },
  // 4 — "Take the arrow out; go tell my father." Dasharatha draws it out, and he dies (2.57.34-38)
  4(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), cam = { z: lerp(1.25, 1.32, p), x: 0, y: 240 }, out = ease(u, st[1], st[1] + 1.2);
    night(ctx, cam, t, c => {
      lying(c, CH.muniputra, 1050, RB + 10, 540, { eye: 0.5 * (1 - ease(u, st[1] + 1.5, sh.dur)), brow: 0.6, smile: -0.2, mouth: u < st[1] ? 0.3 : 0 }, L_MOON);
      stroke(c, 760, RB - 110 - out * 160, 800, RB - 220 - out * 160, 5, '#e8d0a0', 1 - out * 0.3);
      fig(c, 'dasharatha', { sit: 1, eye: 0.6, head: 0.15, gaze: [0.5, 0.4], aN: [0.32, 0.12 - out * 0.2], aF: [0.25, 0.3] }, 240, RB + 30, 560, 1, SIL);
    });
    dim(ctx, 0.2 + 0.15 * ease(u, st[1] + 1.5, sh.dur));
  },
  // 5 — he carries the filled pot to the ashram; the old father hears footsteps (2.58.2-5)
  5(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.1, 1.16, p), x: 0, y: 160 }, g = ease(u, 0, sh.dur * 0.8), x = lerp(1100, 860, g);
    ashram(ctx, cam, t, c => { fig(c, 'andhamuni', { sit: 1, eye: 0.02, head: 0.1, gaze: [0.5, -0.2] }, 330, RB + 10, 500, 1, L_LAMP); fig(c, 'andhamata', { sit: 1, eye: 0.02, head: 0.12 }, 520, RB + 10, 450, 1, L_LAMP);
      flame(c, 430, RB - 70, 20, t, 2); glow(c, 430, RB - 80, 240, '#ffb860', 0.22);
      drawFigure(c, CH.dasharatha, walkPose(u * 2.6 * (1 - g), 0.25 * (1 - g), { eye: 0.7, aN: [0.3, -0.05], aF: [0.1, 0.1] }), { x, y: RB + 30, s: 580, face: -1 }, SIL); pot(c, x - 120, RB - 330, 110, 0, 1); });
    dim(ctx, 0.2);
  },
  // 6 — the blind father: "Son, why so late? Bring the water quickly. You are the eyes of us blind ones." (2.58.5, 2.58.8)
  6(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), cam = { z: lerp(1.3, 1.38, p), x: 120, y: 280 };
    ashram(ctx, cam, t, c => { const dp = P({ sit: 1, eye: 0.02, head: 0.06, gaze: [0.5, -0.1], smile: 0.3, mouth: m * 0.8, aN: [0.24, 0.02], handN: 'palm' }); drawFigure(c, CH.andhamuni, dp, { x: 360, y: RB + 10, s: 560, face: 1 }, L_LAMP);
      fig(c, 'andhamata', { sit: 1, eye: 0.02, head: 0.1, smile: 0.2 }, 560, RB + 10, 480, 1, L_LAMP); flame(c, 470, RB - 70, 20, t, 2); glow(c, 470, RB - 80, 240, '#ffb860', 0.22); });
    dim(ctx, 0.15);
  },
  // 7 — Dasharatha tells the truth; "had you not told me yourself… because it was unknowing, you live" (2.58.11-21)
  7(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), cam = { z: lerp(1.15, 1.22, p), x: 0, y: 180 };
    ashram(ctx, cam, t, c => { fig(c, 'andhamuni', { sit: 1, eye: 0.02, head: -0.05, brow: 0.9, smile: -0.5, gaze: [0.5, 0] }, 330, RB + 10, 520, 1, L_LAMP); fig(c, 'andhamata', { sit: 1, eye: 0.02, head: 0.2, smile: -0.4 }, 520, RB + 10, 460, 1, L_LAMP);
      flame(c, 430, RB - 70, 20, t, 2); glow(c, 430, RB - 80, 240, '#ffb860', 0.22);
      fig(c, 'dasharatha', { sit: 1, eye: 0.5, head: 0.2, gaze: [-0.5, 0.4], handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] }, 820, RB + 30, 560, -1, SIL); });
    dim(ctx, 0.2); post.ui = c => { if (u > st[1] && u < st[2] + 1) sub(c, '2.58.19', 300, ease(u, st[1], st[1] + 0.4), C_GOLD); };
  },
  // 8 — REVEAL: the son appears in divine form and rises to heaven in a vimana (2.58.39-42)
  8(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 4), cam = { z: lerp(1.05, 1.12, p), x: 0, y: 120 }, a = ease(u, st[1] - 0.3, st[1] + 1.0), up = ease(u, st[3], sh.dur);
    ashram(ctx, cam, t, c => { fig(c, 'andhamuni', { sit: 1, eye: 0.02, head: -0.15, smile: 0.1, gaze: [0.3, -0.6] }, 330, RB + 10, 500, 1, L_LAMP); fig(c, 'andhamata', { sit: 1, eye: 0.02, head: -0.15, smile: 0.1 }, 520, RB + 10, 450, 1, L_LAMP); });
    const y = lerp(1050, 520, up); vimana(ctx, 700, y + 60, 160, t, a * up);
    ctx.save(); ctx.globalAlpha = a; glow(ctx, 700, y - 200, 380, '#fff0c0', 0.4); ascetic(ctx, 700, y, 480, -1, { eye: 1, smile: 0.5, gaze: [-0.5, 0.3], aN: [0.2, 0.1], handN: 'palm' }, { rim: '#fff0c0', rimA: 1, dir: 1, tint: '#fff0c0', tintA: 0.25 }); ctx.restore();
    petals(ctx, t, 7, 22, a * 0.8); dim(ctx, 0.1);
    post.ui = c => cards(c, sh, u, [st[0] + 0.4, st[0] + 1.2], 250, 116, 96);
  },
  // 9 — the curse: "as I grieve for my son today, so you too will die of grief for a son" (2.58.44-46)
  9(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.3, 1.4, p), x: 120, y: 280 };
    ashram(ctx, cam, t, c => { fig(c, 'andhamuni', { sit: 1, eye: 0.02, head: 0.05, brow: 1, smile: -0.6, mouth: 0.25 * Math.abs(Math.sin(u * 7)), gaze: [0.5, 0], aN: [0.3, -0.12], handN: 'palm' }, 360, RB + 10, 560, 1, { rim: '#ff9a60', rimA: 0.9, dir: 1, tint: '#3a0a14', tintA: 0.3 });
      fig(c, 'dasharatha', { sit: 1, eye: 0.5, head: 0.25, handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] }, 860, RB + 30, 540, -1, SIL); });
    ctx.fillStyle = rgba('#5a0a14', 0.18); ctx.fillRect(0, 0, W, H); dim(ctx, 0.15);
  },
  // 10 — years later, Rama goes to the forest; at that same midnight the curse comes true; "हा राघव" (2.57.3; 2.58.56-57)
  10(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), cam = { z: lerp(1.15, 1.25, p), x: 0, y: 190 }, end = ease(u, st[2], sh.dur);
    palace(ctx, BG.pal, cam, t, c => { if (u < st[2]) fig(c, 'dasharatha', { sit: 1, eye: 0.4, head: 0.15, gaze: [0.3, 0.5], brow: 0.7, smile: -0.3 }, 470, PF, 660, 1, L_LAMP);
      else lying(c, CH.dasharatha, 760, PF - 150, 560, { eye: 0.02, smile: -0.1 }, L_LAMP); });
    drawLayer(ctx, cam, BG.pal.fg); dim(ctx, 0.3 + 0.35 * end);
    post.ui = c => cards(c, sh, u, [st[1] + 1.0, st[1] + 1.6], 250, 120, 100);
  },
  11(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
