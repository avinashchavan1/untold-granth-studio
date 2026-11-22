// ===== Reel A82 — "Who Was Shanta?" — 15 shots (CE Bala 1.8-10, 1.17; Srimad Bhagavatam 9.23.7-8) =====
// Popular / Bhagavata: Dasharatha gave his own daughter Shanta to his friend Romapada. CE: drought in Anga under Lomapada (1.8.11-12);
// bring Rishyashringa and give him the maiden Shanta (1.8.15-16); rain falls, the king gives her in marriage (1.9.28-32);
// prophecy: the king of Anga "will have a daughter named Shanta" (1.10.3); Dasharatha: "I am childless" (1.10.5);
// Dasharatha to Lomapada: "let YOUR daughter Shanta come to my city" (1.10.19); welcomed in Ayodhya (1.10.28-29); leaves (1.17.5).
// Dasharatha: owner's look C (CH.dasharatha in art/chars.js). Minor looks (Claude's picks): Lomapada, Shanta, Rishyashringa, Sumantra.
// opening śloka (CE 1.10.19), Devanagari copied from the CE page
const SLOKA = {"lines": ["शान्ता तव सुता राजन् सह भर्त्रा विशाम्पते ।", "मदीयं नगरं यातु कार्यं हि महदुद्यतम् ॥"], "ref": "BALA KANDA 1.10.19", "en": "“O king, lord of the people, let your daughter Shanta come to my city with her husband, for a great task is at hand.”"};
const BHAG = { source: 'SRIMAD BHAGAVATAM', ref: '9.23.7–8 · A PURANA OF DEVOTION', lines: ['रोमपाद इति ख्यातस्तस्मै दशरथः सखा ।', 'शान्तां स्वकन्यां प्रायच्छत्'],
  translit: 'romapāda iti khyātas tasmai daśarathaḥ sakhā, śāntāṃ sva-kanyāṃ prāyacchat', en: '“To Romapada, his friend Dasharatha gave his own daughter, Shanta.”' };
const VAL103 = { source: 'VALMIKI RAMAYANA', ref: 'BALA KANDA 1.10.3 · CRITICAL EDITION', lines: ['अङ्गराजेन सख्यं च तस्य राज्ञो भविष्यति ।', 'कन्या चास्य महाभागा शान्ता नाम भविष्यति ॥'],
  translit: 'aṅgarājena sakhyaṃ ca tasya rājño bhaviṣyati, kanyā cāsya mahābhāgā śāntā nāma bhaviṣyati',
  en: '“That king will be a friend of the king of Anga; and he, the king of Anga, will have a fortunate daughter named Shanta.”' };

Object.assign(CH, {
  lomapada: { kind: 'man', god: true, sage: true, skin: '#c8946c', skinSh: '#8a5e52', cloth: '#2a6a3a', clothSh: '#163e22', sash: '#e6b450', hair: '#141018' },     // king of Anga: black beard, gold crown, green and gold
  shanta:   { kind: 'woman', skin: '#dcae90', skinSh: '#a27884', cloth: '#1f7a7a', clothSh: '#0f4a4e', border: '#e6b450', hair: '#0d0a16' },                       // teal sari, gold border
  rishya:   { kind: 'monk', sage: true, skin: '#a8784e', skinSh: '#6a4a3a', cloth: '#9a6a3a', clothSh: '#5e3e22', hair: '#1a1418' },                                // young forest sage: dark jata, bark-brown
  brahmin:  { kind: 'monk', sage: true, skin: '#b07e5a', skinSh: '#6e4a40', cloth: '#efe2c4', clothSh: '#b0a088', hair: '#d8d0c4' },                                // an elder Brahmin of Anga: white jata, ivory
  sumantra: { kind: 'man', elder: true, sage: true, plain: true, skin: '#c8946c', skinSh: '#8a5e52', cloth: '#efe2c4', clothSh: '#b0a088', sash: '#3a5a9a', hair: '#bcb4aa' },   // minister and charioteer: grey, ivory, blue sash
});

function buildScenes() { BG.court = buildCourt(); BG.dawn = buildDawn(); BG.forest = buildForest(); BG.pal = buildPalace(); BG.ms = buildManuscript(); }
const L_DAY = { rim: '#fff0c8', rimA: 0.7, dir: 1, tint: '#6a4a2a', tintA: 0.08 };
const L_HOT = { rim: '#ffb070', rimA: 0.9, dir: 1, tint: '#6a2a10', tintA: 0.18 };
const L_RAIN = { rim: '#c8e0ff', rimA: 0.8, dir: -1, tint: '#1a2a5a', tintA: 0.25 };
const L_LAMPLIT = { rim: '#ffc878', rimA: 0.9, dir: 1, tint: '#3a1830', tintA: 0.16 };
const MEMORY = { tint: '#c89a5a', tintA: 0.5, rim: '#ffe0a0', rimA: 0.7, dir: 1, shadow: 0.3 };
const F = COURT_FLOOR;
const dim = (ctx, a = 0.3) => { ctx.fillStyle = rgba('#05061a', a); ctx.fillRect(0, 0, W, H); };
const label = (c, s, y, q, col = C_GOLD, size = 110) => { if (q > 0) text(c, s, 540, y + (1 - q) * 18, { size, weight: 900, color: col, ls: 8, alpha: q, stroke: 10, shadow: 32 }); };
const sub = (c, s, y, q, col = C_IVORY) => { if (q > 0) text(c, s, 540, y, { size: 40, font: 'Montserrat', weight: 800, color: col, ls: 5, alpha: q, stroke: 6, shadow: 20 }); };
const cards = (c, sh, u, st, y0 = 560, gap = 124, size = 100) => (sh.card || []).forEach(([s, col], i) => { const at = st[Math.min(i, st.length - 1)]; const q = ease(u, at - 0.05, at + 0.35); if (q > 0) textFit(c, s, 540, y0 + i * gap + (1 - q) * 22, { size, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
const fig = (c, k, pose, x, y, s, face, light) => drawFigure(c, CH[k], P(Object.assign({ eye: 1, gaze: [0.4, 0] }, pose)), { x, y, s, face }, light);
const ms = (ctx, p, t) => { const bg = BG.ms, cam = { z: lerp(1.05, 1.12, p), y: 10 }; drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms); withCam(ctx, cam, 0.8, c => flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3)); };
function dawn(ctx, cam, t, sunY, mid) { const bg = BG.dawn; drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far); drawLayer(ctx, cam, bg.mid); if (mid) withCam(ctx, cam, 0.6, mid); drawLayer(ctx, cam, bg.fg); }
function rain(c, t, a = 1) { for (let i = 0; i < 160; i++) { const h = hash(i * 3.1), x = (h * 1400 + t * 120) % 1300 - 100, y = (hash(i * 7.7) * 2100 + t * 1500) % 2100 - 100; stroke(c, x, y, x - 14, y + 60, 2, '#cfe2ff', 0.45 * a); } }
function cracks(c, a = 1) { for (let i = 0; i < 26; i++) { const x = hash(i) * 1080, y = F + 40 + hash(i * 2.3) * 400; stroke(c, x, y, x + 60 - hash(i * 5) * 120, y + 30, 3, '#5a2a10', 0.6 * a); } }

const SHOTS = {
  // 1 — hook: the image many know (memory gold): King Dasharatha and a young princess at his side in the court
  1(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.25, 1.32, p), x: 0, y: 220 };
    court(ctx, BG.court, cam, t, c => { fig(c, 'dasharatha', { smile: 0.35, gaze: [0.5, 0], eye: blink(t, 4) }, 420, F + 130, 680, 1, MEMORY); fig(c, 'shanta', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], smile: 0.3, eye: blink(t, 3), gaze: [-0.4, 0] }, 720, F + 120, 560, -1, MEMORY); });
    ctx.fillStyle = rgba('#c89a5a', 0.16); ctx.fillRect(0, 0, W, H); dim(ctx, 0.3);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.25, 0.55 + i * 0.25); if (q > 0) textFit(c, s, 540, 460 + i * 124 + (1 - q) * 22, { size: 108, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
  },
  2(ctx, u, p, sh, t, post) { slokaSource(ctx, u, p, sh, t, post, SLOKA); },
  // 3 — the famous story (memory gold): Dasharatha's daughter, Rama's elder sister
  3(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.2, 1.28, p), x: 0, y: 200 };
    court(ctx, BG.court, cam, t, c => { fig(c, 'dasharatha', { aN: [0.2, 0.12], handN: 'palm', smile: 0.4, gaze: [0.5, 0], eye: blink(t, 4) }, 400, F + 130, 680, 1, MEMORY); fig(c, 'shanta', { smile: 0.35, eye: blink(t, 3), gaze: [-0.4, 0] }, 700, F + 120, 560, -1, MEMORY); });
    ctx.fillStyle = rgba('#c89a5a', 0.18); ctx.fillRect(0, 0, W, H); dim(ctx, 0.2);
    post.ui = c => label(c, 'A FAMOUS STORY', 420, ease(u, 0.2, 0.6), C_GOLD, 84);
  },
  // 4 — Srimad Bhagavatam 9.23.7-8 on a quote card (the narrator reads it)
  4(ctx, u, p, sh, t, post) { const st = sentenceStarts(sh, 3); quoteCard(ctx, u, sh, t, post, Object.assign({ enAt: st[2] }, BHAG)); },
  // 5 — but Valmiki tells it differently (the manuscript)
  5(ctx, u, p, sh, t, post) { ms(ctx, p, t); dim(ctx, 0.3); post.ui = c => label(c, 'IN VALMIKI?', 600, ease(u, 0.3, 0.7)); },
  // 6 — Anga: a terrible drought under King Lomapada; the Brahmins: "bring Rishyashringa, give him the maiden Shanta" (1.8.11-16)
  6(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), cam = { z: lerp(1.1, 1.18, p), x: 0, y: 160 };
    dawn(ctx, cam, t, 520, c => {
      cracks(c);
      fig(c, 'lomapada', { brow: 0.6, smile: -0.1, eye: blink(t, 4), gaze: [0.4, -0.1] }, 380, F + 130, 640, 1, L_HOT);
      if (u > st[1] - 0.5) { const q = ease(u, st[1] - 0.5, st[1] + 0.5); c.save(); c.globalAlpha = q; fig(c, 'monk', { aN: [0.22, 0.04], handN: 'palm', eye: blink(t, 5), gaze: [-0.5, 0] }, 760, F + 120, 560, -1, L_HOT); fig(c, 'brahmin', { eye: blink(t, 6), gaze: [-0.5, 0] }, 930, F + 110, 540, -1, L_HOT); c.restore(); }
    });
    ctx.fillStyle = rgba('#ff8a30', 0.1); ctx.fillRect(0, 0, W, H); dim(ctx, 0.15);
    post.ui = c => { label(c, 'ANGA', 440, ease(u, 0.2, 0.6)); sub(c, 'A TERRIBLE DROUGHT · 1.8.12', 520, ease(u, 0.4, 0.8)); };
  },
  // 7 — the sage comes, the rain falls; the king of Anga gives Shanta in marriage (1.9.28-32)
  7(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.15, 1.22, p), x: 0, y: 180 }, r = ease(u, 0.3, 2.0), w = ease(u, sh.dur * 0.45, sh.dur * 0.75);
    court(ctx, BG.court, cam, t, c => {
      fig(c, 'lomapada', { aN: [0.2, 0.1], handN: 'palm', smile: 0.4, eye: blink(t, 4), gaze: [0.4, 0] }, 300, F + 130, 640, 1, L_RAIN);
      fig(c, 'shanta', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], smile: 0.3 * w, eye: blink(t, 3), gaze: [0.4, 0] }, 560, F + 120, 540, 1, L_RAIN);
      fig(c, 'rishya', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], smile: 0.25, eye: blink(t, 5), gaze: [-0.4, 0] }, 820, F + 130, 600, -1, L_RAIN);
    });
    rain(ctx, t, r); dim(ctx, 0.15);
    post.ui = c => label(c, 'RAIN', 440, ease(u, 0.4, 0.8) * (1 - ease(u, sh.dur * 0.45, sh.dur * 0.55)), '#cfe2ff', 120);
  },
  // 8 — years later, Ayodhya: Sumantra tells Dasharatha an old prophecy; then CE 1.10.3 on a quote card (narrator reads it)
  8(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), qa = st[1] - 0.3;
    if (u >= qa) return quoteCard(ctx, u - qa, sh, t, post, Object.assign({ enAt: st[2] - qa }, VAL103));
    const cam = { z: lerp(1.25, 1.3, p), x: 0, y: 220 }, m = 0.3 + 0.3 * Math.abs(Math.sin(t * 6));
    court(ctx, BG.court, cam, t, c => { fig(c, 'dasharatha', { sit: 1, eye: blink(t, 4), gaze: [0.5, 0], brow: 0.3 }, 380, F + 130, 640, 1, L_DAY); fig(c, 'sumantra', { aN: [0.2, 0.1], handN: 'palm', mouth: m, eye: blink(t, 5), gaze: [-0.5, 0] }, 760, F + 130, 620, -1, L_DAY); });
    post.ui = c => { label(c, 'AYODHYA', 440, ease(u, 0.2, 0.6)); sub(c, 'SUMANTRA AND DASHARATHA', 520, ease(u, 0.4, 0.8)); };
  },
  // 9 — in that prophecy Dasharatha says: "I am childless" (1.10.5)
  9(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.35, 1.42, p), x: -80, y: 300 };
    court(ctx, BG.court, cam, t, c => fig(c, 'dasharatha', { sit: 1, eye: 0.6, head: 0.12, gaze: [0.3, 0.5], brow: 0.6, smile: -0.2 }, 420, F + 130, 660, 1, L_DAY));
    dim(ctx, 0.3); post.ui = c => cards(c, sh, u, [sentenceStarts(sh, 1)[0] + 2.2], 520, 124, 100);
  },
  // 10 — Dasharatha goes to Anga; Lomapada receives him
  10(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.1, 1.16, p), x: 0, y: 180 }, g = ease(u, 0, sh.dur * 0.8);
    court(ctx, BG.court, cam, t, c => {
      fig(c, 'lomapada', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], smile: 0.5, eye: blink(t, 4), gaze: [0.4, 0] }, 330, F + 130, 640, 1, L_DAY);
      drawFigure(c, CH.dasharatha, walkPose(u * 3 * (1 - g), 0.3 * (1 - g), { eye: blink(t, 4), smile: 0.5, gaze: [-0.4, 0] }), { x: lerp(1200, 760, g), y: F + 130, s: 660, face: -1 }, L_DAY);
    });
    post.ui = c => { label(c, 'ANGA', 440, ease(u, 0.2, 0.6)); sub(c, 'DASHARATHA AND LOMAPADA', 520, ease(u, 0.4, 0.8)); };
  },
  // 11 — Dasharatha: "O king, let your daughter Shanta come to my city with her husband." (1.10.19)
  11(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), cam = { z: lerp(1.25, 1.3, p), x: 0, y: 230 };
    court(ctx, BG.court, cam, t, c => {
      fig(c, 'shanta', { eye: blink(t, 3), smile: 0.2, gaze: [0.4, 0] }, 200, F + 110, 520, 1, L_DAY);
      fig(c, 'rishya', { eye: blink(t, 5), gaze: [0.4, 0] }, 340, F + 120, 560, 1, L_DAY);
      fig(c, 'lomapada', { eye: blink(t, 4), smile: 0.3, gaze: [0.4, 0] }, 520, F + 130, 620, 1, L_DAY);
      const dp = P({ aN: [0.22, -0.02], handN: 'palm', aF: [0.06, 0.14], eye: blink(t, 4), smile: 0.3, mouth: m * 0.8, gaze: [-0.5, 0] }); dp.head += Math.sin(u * 9) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.dasharatha, dp, { x: 830, y: F + 130, s: 680, face: -1 }, L_DAY);
    });
  },
  // 12 — REVEAL: "YOUR DAUGHTER", says Dasharatha — Lomapada with Shanta at his side
  12(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), cam = { z: lerp(1.35, 1.48, p), x: -120, y: 300 };
    court(ctx, BG.court, cam, t, c => { fig(c, 'lomapada', { aN: [0.2, 0.14], handN: 'palm', eye: blink(t, 4), smile: 0.5, gaze: [-0.4, 0] }, 500, F + 130, 640, -1, L_DAY); fig(c, 'shanta', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], eye: blink(t, 3), smile: 0.4, gaze: [0.4, 0] }, 280, F + 110, 540, 1, L_DAY); });
    dim(ctx, 0.3); post.flash = 0.25 * ease(u, st[0] + 0.6, st[0] + 0.8) * (1 - ease(u, st[0] + 0.8, st[0] + 1.4)); post.flashCol = '#fff0c0';
    post.ui = c => cards(c, sh, u, [st[0] + 0.8, st[1]], 440, 124, 104);
  },
  // 13 — Ayodhya's inner palace welcomes Shanta (1.10.28-29); after the sacrifice she leaves with her husband (1.17.5); then Rama is born (1.17.6)
  13(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), bg = BG.pal, cam = { z: lerp(1.1, 1.18, p), x: 0, y: 160 }, go = ease(u, st[1] - 0.2, st[1] + 3.0);
    palace(ctx, bg, cam, t, c => {
      c.save(); c.globalAlpha = 1 - go;
      fig(c, 'shanta', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], eye: blink(t, 3), smile: 0.5, gaze: [0.4, 0] }, 460, PAL_FLOOR, 560, 1, L_LAMPLIT);
      fig(c, 'rishya', { eye: blink(t, 5), smile: 0.3, gaze: [0.4, 0] }, 640, PAL_FLOOR, 600, 1, L_LAMPLIT);
      c.restore();
      petals(c, t, 11, 26, ease(u, 0.2, 1.2));
    });
    drawLayer(ctx, cam, bg.fg);
    const born = ease(u, sh.dur - 3.2, sh.dur - 1.0); if (born > 0) { glow(ctx, 540, 820, 520, '#fff0c8', 0.5 * born); glow(ctx, 540, 820, 180, '#ffffff', 0.4 * born); }
  },
  // 14 — in Valmiki: Lomapada's daughter, Rishyashringa's wife; the sister story came later; both told with devotion
  14(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), cam = { z: lerp(1.05, 1.1, p), x: 0, y: 160 };
    court(ctx, BG.court, cam, t, c => { fig(c, 'lomapada', { eye: blink(t, 4), smile: 0.4, gaze: [0.4, 0] }, 300, F + 130, 640, 1, L_DAY); fig(c, 'shanta', { eye: blink(t, 3), smile: 0.4, gaze: [0.4, 0] }, 560, F + 120, 540, 1, L_DAY); fig(c, 'rishya', { eye: blink(t, 5), smile: 0.3, gaze: [-0.4, 0] }, 800, F + 130, 600, -1, L_DAY); });
    dim(ctx, 0.35);
    post.ui = c => cards(c, sh, u, [st[0], st[0] + 1.6], 460, 120, 92);
  },
  15(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
