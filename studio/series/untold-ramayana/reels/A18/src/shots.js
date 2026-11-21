// ===== Reel A18 — "No Swayamvara at the Bow" — 13 shots (CE Bala 1.65-66, 1.72.17, 1.73-75; Ramcharitmanas Bal Kand) — for Vivah Panchami =====
// Sita is vīryaśulkā: her bride-price is valour (1.65.15); kings came EARLIER, couldn't even grasp the bow (1.65.16-20), besieged Mithila a year (1.65.21-23);
// Rama came with Vishvamitra only to SEE it (1.65.5-6); "I'll touch it, try to lift and draw it" (1.66.14); playfully strung, drawn, broken in the middle (1.66.15-17);
// thunder, all fall but four (1.66.18-19). No varmala in 1.65-72. Parashurama meets them on the road home after the wedding (1.73-75).
// The popular scene (assembly of kings, jayamala, Parashurama storming in) is Tulsidas's, told with devotion; shown in memory-gold.
// opening śloka (CE 1.72.17, the kanyadaan), Devanagari copied from the CE page
const SLOKA = {"lines": ["इयं सीता मम सुता सहधर्मचरी तव ।", "प्रतीच्छ चैनां भद्रं ते पाणिं गृह्णीष्व पाणिना ॥"], "ref": "BALA KANDA 1.72.17", "en": "“This is Sita, my daughter, your companion in dharma. Accept her; may you be blessed. Take her hand in your hand.”"};
const MANAS = { source: 'RAMCHARITMANAS', ref: 'BAL KAND · BEFORE DOHA 264', lines: ['गावहिं छबि अवलोकि सहेली।', 'सियँ जयमाल राम उर मेली॥'], translit: 'Gāvahiṃ chabi avaloki sahelī, siyaṃ jayamāla rāma ura melī',
  en: '“Seeing the beauty, her friends sing; Sita places the victory garland on Rama\'s chest.”' };
const VAL = { source: 'VALMIKI RAMAYANA', ref: 'BALA KANDA 1.66.17 · CRITICAL EDITION', lines: ['आरोपयित्वा मौर्वीं च पूरयामास वीर्यवान् ।', 'तद्बभञ्ज धनुर्मध्ये नरश्रेष्ठो महायशाः ॥'],
  translit: 'āropayitvā maurvīṃ ca pūrayāmāsa vīryavān, tad babhañja dhanur madhye naraśreṣṭho mahāyaśāḥ', en: '“Having strung it, the mighty one drew it full, and that best of men broke the bow in the middle.”' };

function buildScenes() { BG.mit = buildMithila(); BG.war = buildBattlefield(); BG.dawn = buildDawn(); BG.ms = buildManuscript(); }
const F = MIT_FLOOR;
const L_DAY = { rim: '#fff0c8', rimA: 0.7, dir: 1, tint: '#6a4a2a', tintA: 0.08 };
const MEMORY = { rim: '#ffe0a0', rimA: 0.7, dir: 1, tint: '#c89a5a', tintA: 0.35 };
const KING = { kind: 'man', god: true, skin: '#c8987a', skinSh: '#8c6a62', cloth: '#5a2a6a', clothSh: '#341840', sash: '#e6b450', hair: '#1a1418' };
const KING2 = Object.assign({}, KING, { cloth: '#2a5a4a', clothSh: '#183a30', skin: '#b88a6a' });
const memoryTint = (ctx, a = 1) => { ctx.fillStyle = rgba('#c89a5a', 0.2 * a); ctx.fillRect(0, 0, W, H); };
const label = (c, s, y, q, col = C_GOLD, size = 96) => { if (q > 0) textFit(c, s, 540, y + (1 - q) * 18, { size, weight: 900, color: col, ls: 8, alpha: q, stroke: 10, shadow: 32 }, 1000); };
const sub = (c, s, y, q, col = C_IVORY) => { if (q > 0) text(c, s, 540, y, { size: 38, font: 'Montserrat', weight: 800, color: col, ls: 5, alpha: q, stroke: 6, shadow: 20 }); };
const cardLines = (c, sh, u, at, y0 = 430, gap = 124, size = 104) => (sh.card || []).forEach(([s, col], i) => { const a = at(i), q = ease(u, a - 0.05, a + 0.35); if (q > 0) textFit(c, s, 540, y0 + i * gap + (1 - q) * 22, { size, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }, 1000); });
// the popular scene: Sita garlands Rama before an assembly of kings (memory gold)
function garlandScene(c, t, k) {
  [[120, F - 60, 380, KING], [960, F - 60, 380, KING2], [240, F - 120, 320, KING2], [840, F - 120, 320, KING]].forEach(([x, y, s, ch]) => drawFigure(c, ch, P({ eye: blink(t + x, 5), smile: 0.1, gaze: [x < 540 ? 0.5 : -0.5, 0] }), { x, y, s, face: x < 540 ? 1 : -1 }, MEMORY));
  drawFigure(c, CH.rama, P({ aN: [0.06, 0.16], aF: [0.05, 0.2], eye: blink(t, 5), smile: 0.6, gaze: [0.5, 0] }), { x: 430, y: F + 120, s: 640, face: 1 }, MEMORY);
  const fS = drawFigure(c, CH.sita, P({ aN: [0.2, lerp(0.1, -0.12, k)], aF: [0.2, lerp(0.12, -0.1, k)], handN: 'hold', handF: 'hold', eye: blink(t, 4), smile: 0.6, gaze: [-0.5, -0.1], head: 0.1 }), { x: 680, y: F + 120, s: 600, face: -1 }, MEMORY);
  // the garland: an arc of flowers between Sita's hands, moving onto Rama's shoulders as k -> 1
  const gx = lerp((fS.handN[0] + fS.handF[0]) / 2, 455, k), gy = lerp((fS.handN[1] + fS.handF[1]) / 2, F + 120 - 640 * 0.68, k);
  for (let i = 0; i < 14; i++) { const a = Math.PI * (0.1 + 0.8 * i / 13); dab(c, gx + Math.cos(a) * 70, gy + Math.sin(a) * 70, 11, 9, 0, ['#f4a6bc', '#f6d27a', '#ffffff', '#e8607a'][i % 4], 0.95); }
}
// the bow lifted by Rama: figure first, then the bow across his raised hands
function ramaWithBow(c, x, y, s, t, lift, strung, brk, light) {
  const f = drawFigure(c, CH.rama, P({ aN: [lerp(0.16, 0.06, lift), lerp(0.14, -0.4, lift)], aF: [lerp(0.16, 0.16, lift), lerp(0.14, -0.38, lift)], handN: 'hold', handF: 'hold', eye: blink(t, 5), smile: 0.4, brow: 0.2, gaze: [0.2, -0.3 * lift] }), { x, y, s, face: 1 }, light);
  shivaBow(c, (f.handN[0] + f.handF[0]) / 2, Math.min((f.handN[1] + f.handF[1]) / 2 - 10, y - s * (0.85 + 0.12 * lift)), s * 0.7, lerp(0.15, -0.05, lift), t, brk, strung);
}

const SHOTS = {
  // 1 — hook: the scene we grew up with (memory gold): the garland before the kings
  1(ctx, u, p, sh, t, post) {
    mithila(ctx, BG.mit, { z: lerp(1.05, 1.12, p), y: 60 }, t, c => garlandScene(c, t, ease(u, 0.4, 2.2)));
    memoryTint(ctx); ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => cardLines(c, sh, u, i => 0.15 + i * 0.3, 430, 124, 108);
  },
  2(ctx, u, p, sh, t, post) { slokaSource(ctx, u, p, sh, t, post, SLOKA); },
  // 3 — Ramcharitmanas: the assembly and the jayamala, then the quote card (narrator reads it)
  3(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), qa = Math.max(0.1, st[1] - 0.3);
    if (u >= qa) return quoteCard(ctx, u - qa, sh, t, post, Object.assign({ enAt: Math.max(3, sh.dur - qa - 4.5) }, MANAS));
    mithila(ctx, BG.mit, { z: 1.1, y: 60 }, t, c => garlandScene(c, t, ease(u, 0.3, qa)));
    memoryTint(ctx); post.ui = c => sub(c, 'RAMCHARITMANAS · GOSWAMI TULSIDAS', 380, ease(u, 0.1, 0.5), C_GOLD);
  },
  // 4 — but in Valmiki, that day: no assembly of kings, no garland (the court, empty but for the bow-chest)
  4(ctx, u, p, sh, t, post) {
    mithila(ctx, BG.mit, { z: lerp(1.0, 1.05, p), y: 40 }, t, c => bowChest(c, 540, F + 120, 300, 0));
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => cardLines(c, sh, u, i => [0.3, 1.6][i], 430, 124, 108);
  },
  // 5 — Janaka: "My daughter's bride-price is valour; if Rama strings this bow, I give Sita" (1.65.15, 27); Vishvamitra seated listening
  5(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), cam = { z: lerp(1.3, 1.36, p), x: 40, y: 240 };
    mithila(ctx, BG.mit, cam, t, c => {
      drawFigure(c, CH.vishva, P({ sit: 1, aN: [0.1, 0.18], aF: [0.08, 0.2], eye: blink(t, 6), smile: 0.2, gaze: [-0.5, 0] }), { x: 830, y: F + 100, s: 560, face: -1 }, L_DAY);
      const jp = P({ aN: [0.22, -0.02], handN: 'palm', aF: [0.06, 0.14], eye: blink(t, 4), brow: 0.2, smile: 0.25, mouth: m * 0.8, gaze: [0.5, 0] }); jp.head += Math.sin(u * 9) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.janaka, jp, { x: 360, y: F + 130, s: 680, face: 1 }, L_DAY);
    });
    post.ui = c => { const q = ease(u, 0.4, 0.8) * (1 - ease(u, sh.dur - 0.6, sh.dur)); if (q > 0) { text(c, 'VĪRYAŚULKĀ', 540, 360, { size: 84, weight: 900, color: C_GOLD, ls: 6, alpha: q, stroke: 9, shadow: 30 }); sub(c, 'HER BRIDE-PRICE IS VALOUR', 430, q); } };
  },
  // 6 — kings came before: couldn't even grasp it (1.65.16-20); in anger they besieged Mithila for a year (1.65.21-23)
  6(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3);
    if (u < st[2] - 0.15) {
      mithila(ctx, BG.mit, { z: 1.15, y: 120 }, t, c => {
        shivaBow(c, 540, F - 70, 360, 0.02, t);
        [[330, KING], [750, KING2]].forEach(([x, ch], i) => { const strain = 0.5 + 0.5 * Math.sin(t * 7 + i); drawFigure(c, ch, P({ lean: 0.35, aN: [0.2, 0.1], aF: [0.24, 0.08], handN: 'hold', handF: 'hold', brow: 0.9, smile: -0.4 * strain, eye: 0.6, gaze: [0.5, 0.3] }), { x, y: F + 60, s: 520, face: x < 540 ? 1 : -1 }, L_DAY); });
      });
      post.ui = c => label(c, "IT WOULDN'T MOVE", 400, ease(u, st[1], st[1] + 0.4), C_IVORY, 88);
      return;
    }
    const v = u - st[2];
    battlefield(ctx, BG.war, { z: lerp(1.0, 1.06, ease(v, 0, sh.dur - st[2])), y: 0 }, t, null);
    post.ui = c => { label(c, 'MITHILA BESIEGED', 400, ease(v, 0.1, 0.5), C_GOLD, 88); sub(c, 'FOR A WHOLE YEAR', 480, ease(v, 0.4, 0.8)); };
  },
  // 7 — Rama had only come with Vishvamitra, to SEE the bow (1.65.5-6; 1.66.12)
  7(ctx, u, p, sh, t, post) {
    const walk = ease(u, 0, sh.dur * 0.8), sw = Math.sin(t * 6) * 0.15 * (walk < 1 ? 1 : 0);
    mithila(ctx, BG.mit, { z: 1.08, y: 60 }, t, c => {
      bowChest(c, 820, F + 140, 240, ease(u, sh.dur * 0.5, sh.dur));
      drawFigure(c, CH.vishva, P({ lN: [0.1 + sw, 0.03], lF: [-0.11 - sw, 0.03], eye: blink(t, 6), smile: 0.3, gaze: [0.6, 0] }), { x: lerp(-60, 260, walk), y: F + 120, s: 560, face: 1 }, L_DAY);
      drawFigure(c, CH.lak, P({ lN: [0.1 - sw, 0.03], lF: [-0.11 + sw, 0.03], eye: blink(t, 4), smile: 0.3, gaze: [0.6, 0] }), { x: lerp(-260, 60, walk), y: F + 160, s: 560, face: 1 }, L_DAY);
      drawFigure(c, CH.rama, P({ lN: [0.1 + sw, 0.03], lF: [-0.11 - sw, 0.03], eye: blink(t, 5), smile: 0.4, gaze: [0.6, 0.1] }), { x: lerp(-140, 470, walk), y: F + 200, s: 620, face: 1 }, L_DAY);
    });
    post.ui = c => sub(c, 'ONLY TO SEE THE BOW', 380, ease(u, 0.6, 1.0), C_GOLD);
  },
  // 8 — Rama: "I will touch this bow; I'll also try to lift it and draw it" (1.66.14)
  8(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), cam = { z: lerp(1.35, 1.42, p), x: 60, y: 260 };
    mithila(ctx, BG.mit, cam, t, c => {
      bowChest(c, 780, F + 40, 240, 1); shivaBow(c, 780, F - 80, 300, 0.02, t);
      const rp = P({ aN: [0.24, 0.02], handN: 'palm', aF: [0.06, 0.14], eye: blink(t, 5), smile: 0.35, mouth: m * 0.8, gaze: [0.5, 0.2] }); rp.head += Math.sin(u * 9) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.rama, rp, { x: 360, y: F + 130, s: 660, face: 1 }, L_DAY);
    });
  },
  // 9 — before thousands, he lifts it as if in play; Valmiki's words (1.66.17) on a quote card
  9(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 4), qa = Math.max(0.1, st[1] - 0.25);
    if (u >= qa) return quoteCard(ctx, u - qa, sh, t, post, Object.assign({ enAt: st[3] - qa }, VAL));
    const lift = ease(u, 0.4, qa - 0.2);
    mithila(ctx, BG.mit, { z: 1.12, y: 120 }, t, c => {
      for (let i = 0; i < 18; i++) { const x = 40 + i * 60, y = F - 40 - (i % 3) * 18; dab(c, x, y, 20, 26, 0, '#3a2418', 0.8); dab(c, x, y - 34, 13, 13, 0, '#5a3a28', 0.9); }   // the watching crowd
      ramaWithBow(c, 540, F + 200, 680, t, lift, 0, 0, L_DAY);
    });
    post.ui = c => sub(c, 'THOUSANDS WATCHING', 380, ease(u, 0.3, 0.7), C_GOLD);
  },
  // 10 — the crash like thunder, the earth shakes (1.66.18); all fall but the sage, the king and the two brothers (1.66.19)
  10(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), brk = ease(u, 0.0, 0.8), hit = ease(u, 0.05, 0.15) * (1 - ease(u, 0.15, 1.2)), fall = ease(u, st[1] - 0.3, st[1] + 0.6);
    post.flash = 0.7 * hit; post.flashCol = '#fff4d0';
    const shake = (1 - ease(u, 0.2, 2.0)) * 14, cam = { z: 1.12, x: Math.sin(t * 60) * shake, y: 120 + Math.cos(t * 53) * shake };
    mithila(ctx, BG.mit, cam, t, c => {
      for (let i = 0; i < 18; i++) { const x = 40 + i * 60, y = F - 40 - (i % 3) * 18; c.save(); c.translate(x, y); c.rotate(fall * (i % 2 ? 1.3 : -1.3)); dab(c, 0, 0, 20, 26, 0, '#3a2418', 0.8); dab(c, 0, -34, 13, 13, 0, '#5a3a28', 0.9); c.restore(); }
      drawFigure(c, CH.vishva, P({ eye: 1, smile: 0.2, gaze: [0.5, 0] }), { x: 120, y: F + 140, s: 540, face: 1 }, L_DAY);
      drawFigure(c, CH.janaka, P({ eye: 1, browUp: 1, smile: 0.4, gaze: [0.5, 0] }), { x: 920, y: F + 140, s: 560, face: -1 }, L_DAY);
      drawFigure(c, CH.lak, P({ eye: blink(t, 4), smile: 0.4, gaze: [0.5, 0] }), { x: 300, y: F + 200, s: 580, face: 1 }, L_DAY);
      ramaWithBow(c, 560, F + 220, 660, t, 1, 0, brk, L_DAY);
    });
    post.ui = c => label(c, 'IT BROKE IN THE MIDDLE', 400, ease(u, 0.6, 1.0) * (1 - ease(u, st[1] - 0.3, st[1])), C_GOLD, 84);
  },
  // 11 — and Parashurama? Not at the bow: on the road home, after the wedding (1.73.7-22): a dark sky, the axe-bearer on the road
  11(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), come = ease(u, st[1], sh.dur), cam = { z: lerp(1.15, 1.25, come), x: -80, y: 160 };
    ctx.save(); dawn(ctx, cam, t, null, c => {
      const f = drawFigure(c, CH.parashurama, P({ bow: 'F', aN: [0.16, 0.06], handN: 'fist', eye: 1, brow: 0.8, smile: -0.2, gaze: [0.4, 0] }), { x: lerp(1200, 760, come), y: DAWN_PEAK[1] + 120, s: 620, face: -1 }, { rim: '#ff9a5a', rimA: 0.8, dir: -1, tint: '#1a1030', tintA: 0.3 });
      parashu(c, f.handN[0], f.handN[1], 330, 0.15);
      drawFigure(c, CH.rama, P({ eye: blink(t, 5), smile: 0.1, brow: 0.3, gaze: [0.6, 0] }), { x: 330, y: DAWN_PEAK[1] + 160, s: 600, face: 1 }, { rim: '#ffd0a0', rimA: 0.7, dir: 1 });
    }); ctx.restore();
    ctx.fillStyle = rgba('#0a0618', 0.35 * ease(u, st[1], st[1] + 1)); ctx.fillRect(0, 0, W, H);   // 1.73.15-16: a dreadful darkness
    post.ui = c => { label(c, 'NOT AT THE BOW', 400, ease(u, 0.6, 1.0) * (1 - ease(u, st[1] - 0.3, st[1])), C_IVORY, 92); label(c, 'ON THE ROAD HOME', 400, ease(u, st[1] + 0.4, st[1] + 0.8), C_GOLD, 92); sub(c, 'AFTER THE WEDDING · 1.73', 480, ease(u, st[1] + 0.6, st[1] + 1.0)); };
  },
  // 12 — no swayamvara, no garland: a father's vow and a broken bow. Rama and Sita together (the wedding), petals
  12(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3);
    mithila(ctx, BG.mit, { z: lerp(1.2, 1.28, p), y: 200 }, t, c => {
      drawFigure(c, CH.janaka, P({ aN: [0.2, 0.04], handN: 'palm', aF: [0.18, 0.06], handF: 'palm', eye: blink(t, 5), smile: 0.6, gaze: [0.5, 0.1] }), { x: 180, y: F + 120, s: 560, face: 1 }, L_DAY);
      drawFigure(c, CH.sita, P({ aN: [0.14, 0.1], aF: [0.1, 0.14], eye: blink(t, 4), smile: 0.6, gaze: [0.4, 0] }), { x: 520, y: F + 180, s: 600, face: 1 }, L_DAY);
      drawFigure(c, CH.rama, P({ aN: [0.16, 0.1], aF: [0.05, 0.2], eye: blink(t, 5), smile: 0.6, gaze: [-0.5, 0] }), { x: 800, y: F + 200, s: 640, face: -1 }, L_DAY);
      petals(c, t, 7, 30, ease(u, 0.2, 1.2));
    });
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => cardLines(c, sh, u, i => i === 0 ? st[0] : st[1] + (i - 1) * 1.3, 380, 112, 96);
  },
  13(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
function dawn(ctx, cam, t, sunY, mid) {
  const bg = BG.dawn; drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far); drawLayer(ctx, cam, bg.mid);
  if (mid) withCam(ctx, cam, 0.6, mid); drawLayer(ctx, cam, bg.fg);
}
