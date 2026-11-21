// ===== Reel A23 — "Hanuman Took the Mountain Back" (part 1 of 2; part 2 = A101) — 16 shots (CE Yuddha 6.61, 6.88-89; Hanuman Chalisa 11; Ramcharitmanas Lanka) =====
// Trip 1 (6.61): Indrajit's Brahmastra fells Rama, Lakshmana and the army; old Jambavan, blind with arrows, asks first for Hanuman (18-22);
// Himalaya, between Kailasa and Rishabha (29-34); the herbs hide (58); Hanuman rebukes the mountain, lifts the peak (59-61); a second sun (63);
// the fragrance alone heals (67); he carries the mountain BACK (68). Trip 2 (6.88-89): Ravana's Maya-made spear strikes Lakshmana (6.88.30-35);
// Sushena sends Hanuman again (6.89.9-16); "I don't know the herbs, so I brought the whole peak" (6.89.21); Sushena heals him (6.89.22-24).
// No gore: the fallen army are still silhouettes; arrows are thin dark strokes.
// opening śloka (CE 6.61.68), Devanagari copied from the CE page
const SLOKA = {"lines": ["ततो हरिर्गन्धवहात्मजस्तु तमोषधीशैलमुदग्रवीर्यः ।", "निनाय वेगाद्धिमवन्तमेव पुनश्च रामेण समाजगाम ॥"], "ref": "YUDDHA KANDA 6.61.68", "en": "“Then the mighty son of the wind swiftly carried that herb mountain back to the Himalaya, and rejoined Rama.”"};
// quote texts (same as script.json shots 3, 15, 20 "quote")
const CHALISA = { source: 'HANUMAN CHALISA', ref: 'CHAUPAI 11  ·  A HYMN OF DEVOTION', lines: ['लाय सजीवन लखन जियाये।', 'श्री रघुवीर हरषि उर लाये॥'], translit: 'Lāya sajīvana lakhana jiyāye, śrī raghuvīra haraṣi ura lāye',
  en: '“You brought the Sanjeevani and revived Lakshmana; Shri Raghuvir, overjoyed, held you to his heart.”' };
const VAL67 = { source: 'VALMIKI RAMAYANA', ref: 'YUDDHA KANDA 6.61.67 · CRITICAL EDITION', lines: ['तावप्युभौ मानुषराजपुत्रौ तं गन्धमाघ्राय महौषधीनाम् ।', 'बभूवतुस्तत्र तदा विशल्याव् उत्तस्थुरन्ये च हरिप्रवीराः ॥'],
  translit: 'tāvapyubhau mānuṣarājaputrau taṃ gandhamāghrāya mahauṣadhīnām, babhūvatustatra tadā viśalyāv uttasthuranye ca haripravīrāḥ',
  en: '“Just by smelling the fragrance of the great herbs, both princes were freed of their arrows; and the other vanara heroes rose.”' };
const MANAS = { source: 'RAMCHARITMANAS', ref: 'LANKA KAND · AFTER DOHA 56', lines: ['देखा सैल न औषध चीन्हा।', 'सहसा कपि उपारि गिरि लीन्हा॥'], translit: 'Dekhā saila na auṣadha cīnhā, sahasā kapi upāri giri līnhā',
  en: '“He saw the mountain but could not tell the herb; at once the monkey uprooted the whole mountain.”' };

function buildScenes() { BG.war = buildBattlefield(); BG.him = buildHimalaya(); BG.sky = buildSkyHigh(); BG.ms = buildManuscript(); }
const L_TORCH = { rim: '#ffb060', rimA: 0.9, dir: 1, tint: '#141c5c', tintA: 0.32 };
const L_HIM = { rim: '#d8f0c0', rimA: 0.8, dir: -1, tint: '#141c5c', tintA: 0.22 };
const L_WAR = { rim: '#ff9a5a', rimA: 0.9, dir: 1, tint: '#3a0a10', tintA: 0.22 };
const G = WAR_GROUND;
const night = (ctx, a = 0.55) => { ctx.fillStyle = rgba('#060a26', a); ctx.fillRect(0, 0, W, H); };
const cards = (c, sh, u, st, y0 = 470, gap = 124, size = 104) => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, (st[i] === undefined ? st[st.length - 1] + 0.4 * i : st[i]) - 0.05, (st[i] === undefined ? st[st.length - 1] + 0.4 * i : st[i]) + 0.35); if (q > 0) textFit(c, s, 540, y0 + i * gap + (1 - q) * 22, { size, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
const label = (c, s, y, q, col = C_GOLD, size = 96) => { if (q > 0) text(c, s, 540, y + (1 - q) * 18, { size, weight: 900, color: col, ls: 8, alpha: q, stroke: 10, shadow: 32 }); };
const sub = (c, s, y, q, col = C_IVORY) => { if (q > 0) text(c, s, 540, y, { size: 38, font: 'Montserrat', weight: 800, color: col, ls: 5, alpha: q, stroke: 6, shadow: 20 }); };
// Hanuman flying with the peak held overhead (faces +x)
function flyPeak(c, x, y, s, t, o = {}) {
  herbPeak(c, x + s * 0.18, y - s * 0.6, s * 0.75, t, { glow: o.glow === undefined ? 1 : o.glow, herbs: o.herbs === undefined ? 1 : o.herbs, root: 1 });
  drawFigure(c, CH.hanuman, P({ lean: 0.5, aN: [0.08, -0.3], aF: [0.14, -0.3], handN: 'hold', handF: 'hold', lN: [-0.4, 0.5], lF: [-0.7, 0.3], eye: blink(t, 4), brow: 0.3, smile: 0.3, gaze: [0.6, -0.2], tail: Math.sin(t * 2) }), { x, y, s, face: o.face || 1 }, o.light || L_HIM);
}
// a few fallen vanaras far off: still silhouettes, no wounds
function fallenArmy(c, t, a = 1) { [[160, G + 40, 220], [380, G + 10, 190], [720, G + 30, 210], [930, G + 60, 230], [560, G + 90, 200]].forEach(([x, y, s], i) => { c.save(); c.globalAlpha = a; lying(c, CH.vanara, x, y, s, { eye: 0 }, { tint: '#0a0c24', tintA: 0.6 }); c.restore(); }); }
// Jambavan lying wounded, propped on an elbow; arrows as thin dark strokes stuck in the ground and his side
function jambavanDown(c, x, y, s, t, m = 0, o = {}) {
  drawFigure(c, CH.jambavan, P({ sit: 1, lean: -0.06, aN: [-0.06, 0.3], aF: [0.12, 0.18], handN: 'palm', handF: 'relaxed', eye: o.eye === undefined ? 0.25 : o.eye, brow: 0.5, smile: 0, mouth: m * 0.7, gaze: [0.2, -0.2], head: 0.08 }), { x, y, s, face: o.face || 1 }, o.light || L_TORCH);
  for (let i = 0; i < 7; i++) { const side = i % 2 ? 1 : -1, ax = x + side * s * (0.3 + (i % 3) * 0.08), ay = y + s * (0.01 + (i % 4) * 0.02); stroke(c, ax, ay, ax - s * 0.06, ay - s * 0.16, 3, '#1a120e', 0.9); dab(c, ax - s * 0.06, ay - s * 0.16, 5, 3, 0, '#d8ccb0', 0.8); }
}

const LIB = {
  // 1 — hook: the image we know: Hanuman with the mountain, in memory gold
  1(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.05, 1.12, p), y: 40 };
    skyHigh(ctx, cam, t, c => flyPeak(c, 430 + 60 * p, 1220 - 40 * p, 520, t, { light: { rim: '#ffe0a0', rimA: 0.8, dir: 1 } }), 0.4);
    ctx.fillStyle = rgba('#c89a5a', 0.16); ctx.fillRect(0, 0, W, H); ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.3, 0.55 + i * 0.3); if (q > 0) textFit(c, s, 540, 430 + i * 124 + (1 - q) * 22, { size: 108, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
  },
  2(ctx, u, p, sh, t, post) { slokaSource(ctx, u, p, sh, t, post, SLOKA); },
  // 3 — the line we all sing: Hanuman Chalisa, chaupai 11 (the narrator reads it)
  3(ctx, u, p, sh, t, post) { const st = sentenceStarts(sh, 3); quoteCard(ctx, u, sh, t, post, Object.assign({ enAt: st[2] }, CHALISA)); },
  // 4 — but in Valmiki: TWICE; and the first time, Lakshmana was not the only one who fell
  4(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), cam = { z: lerp(1.0, 1.06, p), y: 0 };
    skyHigh(ctx, cam, t, c => { flyPeak(c, 300, 1200, 330, t, { glow: 0.8 }); flyPeak(c, 760, 1500, 330, t, { glow: 0.8 }); }, 0.6);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => { label(c, 'TWICE', 470, ease(u, st[0] + 1.0, st[0] + 1.4), C_GOLD, 150); sub(c, 'IN VALMIKI · YUDDHA KANDA 61 & 89', 560, ease(u, st[0] + 1.2, st[0] + 1.6)); };
  },
  // 5 — Indrajit's Brahmastra; both brothers fall; sixty-seven crore vanaras (6.61.1-4, 12)
  5(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), k = ease(u, 0.1, 0.9), hit = ease(u, 0.85, 0.95) * (1 - ease(u, 0.95, 1.8)), cam = { z: lerp(1.05, 1.12, p), y: 40 };
    post.flash = 0.5 * hit; post.flashCol = '#fff0c0';
    battlefield(ctx, BG.war, cam, t, c => {
      fallenArmy(c, t, ease(u, st[1] - 0.3, st[1] + 0.4));
      lying(c, CH.rama, 600, G - 10, 560, { bow: 0, quiver: 0 }, L_WAR); lying(c, CH.lak, 900, G + 50, 540, { bow: 0, quiver: 0 }, L_WAR);
      brahmastra(c, 1100, 200, 640, G - 60, k, t);
    });
    night(ctx, 0.2);
    post.ui = c => { label(c, 'BRAHMASTRA', 470, ease(u, 0.2, 0.6) * (1 - ease(u, st[1] - 0.3, st[1])), '#fff0c0', 92); label(c, '67 CRORE', 470, ease(u, st[1], st[1] + 0.4), C_GOLD, 120); sub(c, 'VANARAS FELL WITH THEM', 560, ease(u, st[1] + 0.2, st[1] + 0.6)); };
  },
  // 6 — night: Hanuman and Vibhishana with torches; old Jambavan, pierced, cannot see (6.61.7, 13-17)
  6(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), walk = ease(u, 0, st[1] + 0.5), cam = { z: lerp(1.0, 1.25, ease(u, st[1] - 0.5, sh.dur)), x: lerp(0, 120, ease(u, st[1] - 0.5, sh.dur)), y: lerp(0, 220, ease(u, st[1] - 0.5, sh.dur)) };
    battlefield(ctx, BG.war, cam, t, null, 0.5); night(ctx, 0.6);
    withCam(ctx, cam, 0.6, c => {
      fallenArmy(c, t, 0.9);
      jambavanDown(c, 780, G + 180, 600, t, 0, { face: -1 });
      const hx = lerp(120, 380, walk), sw = Math.sin(t * 6) * 0.15 * (walk < 1 ? 1 : 0);
      drawFigure(c, CH.vibhishana, P({ aN: [0.2, -0.18], handN: 'hold', lN: [0.1 + sw, 0.03], lF: [-0.11 - sw, 0.03], eye: blink(t, 5), brow: 0.4, gaze: [0.6, 0.2] }), { x: hx - 110, y: G + 260, s: 560, face: 1 }, L_TORCH);
      drawFigure(c, CH.hanuman, P({ aN: [0.22, -0.2], handN: 'hold', lN: [0.1 - sw, 0.03], lF: [-0.11 + sw, 0.03], eye: blink(t, 4), brow: 0.5, gaze: [0.6, 0.2], tail: Math.sin(t) }), { x: hx + 60, y: G + 300, s: 600, face: 1 }, L_TORCH);
      torch(c, hx - 110 + 560 * 0.24, G + 260 - 560 * 0.78, t, 1); torch(c, hx + 60 + 600 * 0.25, G + 300 - 600 * 0.8, t, 2);
    });
    post.ui = c => sub(c, 'NIGHT · THE BATTLEFIELD', 380, ease(u, 0.2, 0.6) * (1 - ease(u, st[1] - 0.3, st[1])), C_GOLD);
  },
  // 7 — Jambavan: "Does Hanuman, the best of the vanaras, still live?" (6.61.18)
  7(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), cam = { z: lerp(1.75, 1.85, p), x: 200, y: 360 };
    battlefield(ctx, BG.war, cam, t, null, 0.4); night(ctx, 0.6);
    withCam(ctx, cam, 0.6, c => { glow(c, 560, G - 40, 420, '#ffb050', 0.3); jambavanDown(c, 700, G + 120, 640, t, m, { face: -1, eye: 0.2 }); torch(c, 420, G - 160, t, 2, 0.9); });
  },
  // 8 — Vibhishana is puzzled: why Hanuman, before the princes? (6.61.19-20)
  8(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.5, 1.58, p), x: 40, y: 300 };
    battlefield(ctx, BG.war, cam, t, null, 0.4); night(ctx, 0.6);
    withCam(ctx, cam, 0.6, c => {
      jambavanDown(c, 780, G + 200, 600, t, 0, { face: -1 });
      drawFigure(c, CH.vibhishana, P({ aN: [0.2, -0.18], handN: 'hold', aF: [0.1, 0.12], handF: 'palm', head: -0.06, eye: blink(t, 4), brow: -0.5, browUp: 1, smile: 0, gaze: [0.5, 0.3] }), { x: 330, y: G + 270, s: 600, face: 1 }, L_TORCH);
      torch(c, 330 + 600 * 0.24, G + 270 - 600 * 0.78, t, 1);
    });
    post.ui = c => label(c, 'WHY HANUMAN?', 430, ease(u, 0.6, 1.0), C_GOLD, 100);
  },
  // 9 — Jambavan: "While that hero lives, even a beaten army is unbeaten..." (6.61.21-22); Hanuman kneels, listening
  9(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), cam = { z: lerp(1.45, 1.55, p), x: 120, y: 300 };
    battlefield(ctx, BG.war, cam, t, null, 0.4); night(ctx, 0.6);
    withCam(ctx, cam, 0.6, c => {
      glow(c, 560, G - 40, 420, '#ffb050', 0.3);
      drawFigure(c, CH.hanuman, P({ sit: 0.7, lean: 0.25, aN: [0.18, -0.15], handN: 'hold', aF: [0.12, 0.1], eye: blink(t, 4), brow: 0.3, smile: 0, gaze: [0.6, 0.3], tail: Math.sin(t) }), { x: 420, y: G + 290, s: 560, face: 1 }, L_TORCH);
      torch(c, 420 + 560 * 0.22, G + 290 - 560 * 0.66, t, 2);
      jambavanDown(c, 790, G + 200, 600, t, m, { face: -1 });
    });
  },
  // 10 — Hanuman touches his feet (6.61.24); Jambavan sends him to the Himalaya, between Rishabha and Kailasa (6.61.29-31)
  10(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2);
    if (u < st[1] - 0.15) {
      const cam = { z: 1.5, x: 120, y: 300 };
      battlefield(ctx, BG.war, cam, t, null, 0.4); night(ctx, 0.6);
      withCam(ctx, cam, 0.6, c => {
        glow(c, 560, G - 40, 420, '#ffb050', 0.3);
        drawFigure(c, CH.hanuman, P({ sit: 1, lean: 0.85, head: 0.3, aN: [0.3, 0.2], aF: [0.32, 0.22], handN: 'palm', handF: 'palm', eye: 0.1, smile: 0.2, tail: Math.sin(t) }), { x: 500, y: G + 290, s: 560, face: 1 }, L_TORCH);
        jambavanDown(c, 790, G + 200, 600, t, 0, { face: -1 });
        torch(c, 380, G + 180, t, 2, 0.9);
      });
      return;
    }
    const v = u - st[1], cam = { z: lerp(1.0, 1.08, ease(v, 0, sh.dur - st[1])), y: 0 };
    himalaya(ctx, BG.him, cam, t, c => herbPeak(c, 540, HIM_BASE + 40, 520, t, { glow: 1, herbs: 0.6 }));
    post.ui = c => { const q = ease(v, 0.2, 0.6); label(c, 'HIMALAYA', 330, q, C_GOLD, 100);
      if (q > 0) { text(c, 'KAILASA', 170, 900, { size: 34, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 4, alpha: q, stroke: 5 }); text(c, 'RISHABHA', 930, 900, { size: 34, font: 'Montserrat', weight: 800, color: C_GOLD, ls: 4, alpha: q, stroke: 5 }); }
      sub(c, 'THE HERB MOUNTAIN', HIM_BASE - 600, ease(v, 1.0, 1.4), '#d8ffc8');
      (sh.card || []).slice(1).forEach(([s2, col], i) => { const q2 = ease(v, 2.0 + i * 0.5, 2.4 + i * 0.5); if (q2 > 0) textFit(c, s2, 540, 1500 + i * 80, { size: 52, font: 'Montserrat', weight: 900, color: col || C_IVORY, ls: 2, alpha: q2, stroke: 7, shadow: 24 }, 1000); });
      if (sh.card) { const q3 = ease(v, 1.8, 2.2); if (q3 > 0) text(c, sh.card[0][0], 540, 1420, { size: 60, weight: 900, color: C_IVORY, ls: 6, alpha: q3, stroke: 8, shadow: 26 }); } };
  },
  // 11 — four herbs (6.61.32-34): the four lights on the peak, named
  11(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), cam = { z: lerp(1.3, 1.4, p), y: 200 };
    himalaya(ctx, BG.him, cam, t, c => herbPeak(c, 540, HIM_BASE + 40, 520, t, { glow: 1, herbs: 1 }));
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, (i ? st[1] + (i - 1) * 0.9 : st[0]) - 0.05, (i ? st[1] + (i - 1) * 0.9 : st[0]) + 0.35); if (q > 0) textFit(c, s, 540, 330 + i * 104 + (1 - q) * 18, { size: i ? 62 : 96, font: i ? 'Montserrat' : undefined, weight: 900, color: col || C_IVORY, ls: i ? 2 : 6, alpha: q, stroke: 9, shadow: 30 }, 1000); });
  },
  // 12 — he arrives; the herbs, sensing a seeker, hide (6.61.55-58)
  12(ctx, u, p, sh, t, post) {
    const land = ease(u, 0, 1.0), hide = ease(u, 1.4, 2.6), cam = { z: lerp(1.15, 1.25, p), y: 120 };
    himalaya(ctx, BG.him, cam, t, c => {
      herbPeak(c, 640, HIM_BASE + 40, 520, t, { glow: lerp(1, 0.35, hide), herbs: 1 - hide });
      drawFigure(c, CH.hanuman, P({ aN: [0.16, 0.05], aF: [0.1, 0.12], handN: 'palm', eye: blink(t, 4), brow: lerp(0, 0.4, hide), browUp: hide, smile: lerp(0.4, 0, hide), gaze: [0.6, -0.4], tail: Math.sin(t) }), { x: 260, y: lerp(HIM_BASE - 400, HIM_BASE + 160, land), s: 560, face: 1 }, L_HIM);
    });
    post.ui = c => label(c, 'THE HERBS HID', 400, ease(u, 1.8, 2.3), '#d8ffc8', 96);
  },
  // 13 — Hanuman: "Is this your decision, to show no compassion to Lord Rama? Then see the strength of my arms." (6.61.59-60)
  13(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), st = sentenceStarts(sh, 2), cam = { z: lerp(1.35, 1.45, p), x: -80, y: 260 }, raise = ease(u, st[1], st[1] + 0.8);
    himalaya(ctx, BG.him, cam, t, c => {
      herbPeak(c, 700, HIM_BASE + 40, 520, t, { glow: 0.35, herbs: 0 });
      const hp = P({ aN: [lerp(0.24, 0.1, raise), lerp(-0.02, -0.28, raise)], aF: [lerp(0.08, 0.14, raise), lerp(0.12, -0.28, raise)], handN: raise > 0.5 ? 'fist' : 'palm', handF: 'fist', eye: blink(t, 4), brow: 0.9, smile: -0.3, mouth: m * 0.9, gaze: [0.6, -0.2], tail: Math.sin(t * 2) });
      hp.head += Math.sin(u * 9) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.hanuman, hp, { x: 330, y: HIM_BASE + 160, s: 640, face: 1 }, L_HIM);
    });
  },
  // 14 — he tears off the whole peak (6.61.61); on the sun's path, a second sun beside the sun (6.61.63)
  14(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), lift = ease(u, 0.2, st[1] - 0.2), hit = ease(u, 0.2, 0.35) * (1 - ease(u, 0.35, 1.2));
    post.flash = 0.35 * hit; post.flashCol = '#fff0c0';
    if (u < st[1] - 0.1) {
      himalaya(ctx, BG.him, { z: 1.2, y: 140 }, t, c => {
        const py = HIM_BASE + 40 - 420 * easeIn(lift);
        herbPeak(c, 640, py, 520, t, { glow: 0.6 + 0.4 * lift, herbs: 0, root: lift });
        drawFigure(c, CH.hanuman, P({ aN: [0.1, -0.3], aF: [0.16, -0.3], handN: 'hold', handF: 'hold', eye: blink(t, 4), brow: 0.6, smile: 0.2, gaze: [0.4, -0.6], tail: Math.sin(t * 2), lean: 0.1 }), { x: 520, y: HIM_BASE + 160 - 460 * easeIn(lift), s: 600, face: 1 }, L_HIM);
      });
      return;
    }
    const v = u - st[1], cam = { z: lerp(1.0, 1.08, ease(v, 0, sh.dur - st[1])), y: 0 };
    skyHigh(ctx, cam, t, c => { sunDisc(c, 820, 420, 110, t); glow(c, 380, 820, 360, '#ffd890', 0.45); flyPeak(c, lerp(240, 400, ease(v, 0, 3)), 1200, 460, t, { glow: 1.4, light: { rim: '#ffe0a0', rimA: 0.9, dir: 1 } }); }, 1.6);
    post.ui = c => label(c, 'A SECOND SUN', 330, ease(v, 0.8, 1.2), C_GOLD, 96);
  },
  // 15 — Valmiki's own words: the fragrance alone heals both princes (6.61.67), quote card from the 2nd unit
  15(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), qa = Math.max(0.1, st[1] - 0.3);
    if (u >= qa) return quoteCard(ctx, u - qa, sh, t, post, Object.assign({ enAt: st[2] - qa }, VAL67));
    const cam = { z: 1.3, x: 60, y: 240 };
    battlefield(ctx, BG.war, cam, t, c => { herbPeak(c, 760, G - 120, 380, t, { glow: 1.2, herbs: 1, root: 1 }); lying(c, CH.rama, 330, G + 200, 470, { bow: 0, quiver: 0 }, L_WAR); lying(c, CH.lak, 520, G + 260, 450, { bow: 0, quiver: 0 }, L_WAR); }, 0.4);
    night(ctx, 0.35);
  },
  // 16 — then he carried the mountain back to the Himalaya, and returned to Rama (6.61.68)
  16(ctx, u, p, sh, t, post) {
    const k = ease(u, 0.2, 2.4), cam = { z: lerp(1.0, 1.06, p), y: 0 };
    himalaya(ctx, BG.him, cam, t, c => {
      const set = ease(k, 0.75, 1), py = lerp(HIM_BASE - 380, HIM_BASE + 40, ease(k, 0.4, 1));
      herbPeak(c, lerp(260, 540, ease(k, 0, 0.6)), py, 520, t, { glow: 1, herbs: 0.4 + 0.6 * set, root: 1 - set });
      if (set < 1) drawFigure(c, CH.hanuman, P({ lean: 0.3, aN: [0.1, -0.3], aF: [0.16, -0.3], handN: 'hold', handF: 'hold', eye: blink(t, 4), smile: 0.4, gaze: [0.5, 0.3], lN: [-0.3, 0.5], lF: [-0.5, 0.3], tail: Math.sin(t * 2) }), { x: lerp(160, 440, ease(k, 0, 0.6)), y: py + 120, s: 560, face: 1 }, L_HIM);
      else { const fly = ease(u, 2.6, 4.0); drawFigure(c, CH.hanuman, P({ lean: 0.5, aN: [0.3, -0.25], aF: [0.1, 0.15], handN: 'palm', eye: blink(t, 4), smile: 0.6, gaze: [-0.6, -0.3], lN: [-0.4, 0.5], lF: [-0.7, 0.3], tail: Math.sin(t * 2) }), { x: lerp(320, -200, fly), y: lerp(HIM_BASE - 100, HIM_BASE - 700, fly), s: 520, face: -1 }, L_HIM); }
    });
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 1.8 + i * 0.35, 2.2 + i * 0.35); if (q > 0) textFit(c, s, 540, 400 + i * 124 + (1 - q) * 22, { size: 112, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
  },
  // 17 — the second time, much later: Ravana (not Meghnad) hurls the Maya-made spear; it strikes Lakshmana's chest (6.88.30-35)
  17(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), k = ease(u, st[1] + 0.2, st[1] + 1.0), fell = ease(u, st[1] + 1.0, st[1] + 1.8), cam = { z: lerp(1.05, 1.1, p), y: 40 };
    post.flash = 0.4 * ease(u, st[1] + 0.95, st[1] + 1.05) * (1 - ease(u, st[1] + 1.05, st[1] + 1.8)); post.flashCol = '#ffd0a0';
    battlefield(ctx, BG.war, cam, t, c => {
      chariot(c, 860, G - 10, 300, -1, '#4a1a20', '#7a1a1a'); drawRavana(c, 800, G - 120, 230, t, 1, 0);
      if (fell < 0.5) drawFigure(c, CH.lak, P({ bow: 'N', aN: [0.2, -0.02], aF: [0.2, -0.05], handF: 'fist', eye: blink(t, 5), brow: 0.5, gaze: [0.6, 0] }), { x: 260, y: G + 220, s: 560, face: 1 }, L_WAR);
      else lying(c, CH.lak, 230, G + 240, 520, { bow: 0, quiver: 0 }, L_WAR);
      if (k > 0 && k < 1) brahmastra(c, 700, G - 330, 330, G - 60, k, t);
    });
    post.ui = c => { label(c, 'THE SECOND TIME', 430, ease(u, 0.1, 0.5) * (1 - ease(u, st[1] - 0.3, st[1])), C_GOLD, 92);
      const q = ease(u, st[1] + 1.8, st[1] + 2.2); label(c, 'RAVANA', 430, q, C_IVORY, 110); sub(c, 'NOT MEGHNAD', 520, q, C_GOLD); };
  },
  // 18 — Sushena sees Lakshmana is alive (6.89.9-11) and sends Hanuman again, to the same mountain (6.89.13-16)
  18(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), go = ease(u, st[1] + 0.8, st[1] + 2.2), cam = { z: lerp(1.3, 1.36, p), x: 40, y: 260 };
    battlefield(ctx, BG.war, cam, t, c => {
      lying(c, CH.lak, 860, G + 90, 540, { bow: 0, quiver: 0, eye: 0 }, L_WAR);
      drawFigure(c, CH.sushena, P({ sit: 1, lean: 0.4, aN: [0.28, 0.12], handN: 'palm', aF: [0.16, 0.1], eye: blink(t, 4), brow: 0.3, smile: lerp(0, 0.3, ease(u, st[0] + 1, st[0] + 2)), gaze: [0.4, 0.5] }), { x: 260, y: G + 80, s: 560, face: 1 }, L_WAR);
      drawFigure(c, CH.rama, P({ aN: [0.06, 0.16], aF: [0.05, 0.2], eye: blink(t, 5), brow: 0.6, smile: -0.1, gaze: [-0.4, 0.5], head: 0.1 }), { x: 660, y: G - 30, s: 580, face: -1 }, L_WAR);
      drawFigure(c, CH.hanuman, P({ lean: lerp(0, 0.5, go), aN: [0.1, 0.12], aF: [0.06, 0.14], eye: blink(t, 4), brow: 0.4, gaze: [0.3, -0.3], tail: Math.sin(t) }), { x: lerp(940, 1350, go), y: lerp(G - 20, G - 650, go), s: 600, face: 1 }, L_WAR);
    }, 0.5);
    post.ui = c => sub(c, 'SUSHENA · A VANARA CHIEF', 380, ease(u, 0.3, 0.7) * (1 - ease(u, st[1] - 0.2, st[1] + 0.2)), C_GOLD);
  },
  // 19 — Hanuman: "I don't know those herbs. So I have brought the whole peak." (6.89.17-21)
  19(ctx, u, p, sh, t, post) {
    const m = mouthEnv(sh, u), cam = { z: lerp(1.3, 1.38, p), x: 60, y: 220 };
    battlefield(ctx, BG.war, cam, t, c => {
      herbPeak(c, 820, G - 20, 520, t, { glow: 1, herbs: 1, root: 1 });
      drawFigure(c, CH.sushena, P({ aN: [0.12, 0.1], aF: [0.08, 0.14], eye: blink(t, 4), brow: 0.2, smile: 0.4, gaze: [0.5, 0] }), { x: 230, y: G + 110, s: 580, face: 1 }, L_WAR);
      const hp = P({ aN: [0.24, -0.04], handN: 'palm', aF: [0.08, 0.12], eye: blink(t, 4), brow: 0.2, browUp: 0.6, smile: 0.4, mouth: m * 0.8, gaze: [-0.6, 0], tail: Math.sin(t) });
      hp.head += Math.sin(u * 9) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.hanuman, hp, { x: 540, y: G + 120, s: 660, face: -1 }, L_WAR);
    }, 0.4);
  },
  // 20 — here Tulsidas's Ramcharitmanas says the same; quote card from the 2nd unit
  20(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), qa = Math.max(0.1, st[1] - 0.3);
    if (u >= qa) return quoteCard(ctx, u - qa, sh, t, post, Object.assign({ enAt: st[2] - qa }, MANAS));
    battlefield(ctx, BG.war, { z: 1.25, x: 120, y: 200 }, t, c => herbPeak(c, 640, G + 120, 560, t, { glow: 1, herbs: 1, root: 1 }), 0.4);
    post.ui = c => { label(c, 'HERE, BOTH AGREE', 430, ease(u, 0.2, 0.6), C_GOLD, 90); };
  },
  // 21 — Sushena crushes the herb and has Lakshmana smell it; Lakshmana rises, free of pain (6.89.22-24)
  21(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), rise = ease(u, sh.dur * 0.55, sh.dur * 0.85), cam = { z: lerp(1.4, 1.3, p), x: 40, y: 260 };
    battlefield(ctx, BG.war, cam, t, c => {
      if (rise < 0.5) lying(c, CH.lak, 860, G + 90, 540, { bow: 0, quiver: 0, eye: lerp(0, 1, ease(u, sh.dur * 0.45, sh.dur * 0.55)) }, L_WAR);
      else drawFigure(c, CH.lak, P({ sit: lerp(1, 0, rise), aN: [0.1, 0.1], aF: [0.08, 0.14], eye: blink(t, 4), smile: 0.5, gaze: [-0.5, 0] }), { x: 600, y: G + 90, s: 580, face: -1 }, L_WAR);
      drawFigure(c, CH.sushena, P({ sit: 1, lean: 0.4, aN: [0.3, 0.08], handN: 'hold', aF: [0.2, 0.06], handF: 'hold', eye: blink(t, 4), smile: 0.3, gaze: [0.4, 0.4] }), { x: 260, y: G + 80, s: 560, face: 1 }, L_WAR);
      const hx = 260 + 560 * 0.28, hy = G + 80 - 560 * 0.4; for (let i = 0; i < 6; i++) { const k = (t * 0.6 + i / 6) % 1; dab(c, lerp(hx, 860 - 430, k), lerp(hy, G + 90 - 90, k) - Math.sin(k * Math.PI) * 30, 6, 6, 0, '#c8ffb0', 0.6 * (1 - k) * (1 - rise)); }
      glow(c, 520, G - 20, 260, '#c8ffb0', 0.25 * rise);
    }, 0.4);
  },
  // 22 — not once: twice. First for both brothers and the army; then for Lakshmana. Both told with devotion.
  22(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), cam = { z: lerp(1.0, 1.05, p), y: 0 };
    skyHigh(ctx, cam, t, c => { sunDisc(c, 820, 420, 100, t, 0.8); flyPeak(c, 380, 1380, 520, t, { glow: 1.2, light: { rim: '#ffe0a0', rimA: 0.9, dir: 1 } }); }, 0.8);
    ctx.fillStyle = rgba('#05061a', 0.35); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const at = i === 0 ? st[0] : st[1] + (i - 1) * 1.6, q = ease(u, at - 0.05, at + 0.35); if (q > 0) textFit(c, s, 540, 360 + i * (i ? 100 : 0) + (i ? 110 : 0) + (1 - q) * 22, { size: i ? 70 : 150, weight: 900, color: col || C_IVORY, ls: 5, alpha: q, stroke: 10, shadow: 32 }, 1000); });
  },
  23(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
  // A23 part 1 ending: "that was the first trip; the second, for Lakshmana, in part 2": Hanuman flies back toward Lanka
  teaser(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.0, 1.06, p), y: 0 };
    skyHigh(ctx, cam, t, c => { sunDisc(c, 860, 380, 90, t, 0.7); drawFigure(c, CH.hanuman, P({ lean: 0.5, aN: [0.3, -0.25], aF: [0.1, 0.15], handN: 'palm', eye: blink(t, 4), smile: 0.5, gaze: [0.6, -0.1], lN: [-0.4, 0.5], lF: [-0.7, 0.3], tail: Math.sin(t * 2) }), { x: lerp(200, 640, p), y: 1300 - 120 * p, s: 560, face: 1 }, { rim: '#ffe0a0', rimA: 0.8, dir: 1 }); }, 0.8);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    const st = sentenceStarts(sh, 2);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.35); if (q > 0) textFit(c, s, 540, 470 + i * 130 + (1 - q) * 22, { size: i ? 84 : 110, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
  },
  // A101 hook: Lakshmana fallen on the battlefield, the spear's glow fading; WHO STRUCK LAKSHMANA?
  hook2(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.25, 1.32, p), x: -60, y: 220 };
    battlefield(ctx, BG.war, cam, t, c => { lying(c, CH.lak, 820, G + 60, 560, { bow: 0, quiver: 0, eye: 0 }, L_WAR); glow(c, 600, G - 60, 220, '#ffd0a0', 0.4 + 0.2 * Math.sin(t * 3)); }, 0.6);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.3, 0.55 + i * 0.3); if (q > 0) textFit(c, s, 540, 430 + i * 124 + (1 - q) * 22, { size: 108, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
  },
  // A101 bridge: "Valmiki tells it too, but it was the mountain's SECOND trip; the first in part 1"
  bridge(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), cam = { z: lerp(1.0, 1.06, p), y: 0 };
    skyHigh(ctx, cam, t, c => flyPeak(c, lerp(300, 420, p), 1250, 480, t, { glow: 1.1, light: { rim: '#ffe0a0', rimA: 0.9, dir: 1 } }), 0.6);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => { label(c, 'TRIP 2 OF 2', 450, ease(u, st[1] - 0.05, st[1] + 0.35), C_GOLD, 110); sub(c, 'TRIP 1: IN PART 1', 550, ease(u, st[1] + 1.4, st[1] + 1.8)); };
  },
};
// reel shot -> library scene (A23 = part 1; A101 = part 2 reuses this file with its own map and śloka)
const MAP = { 1: 1, 2: 2, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 12, 11: 13, 12: 14, 13: 15, 14: 16, 15: 'teaser', 16: 23 };
const SHOTS = {}; for (const k in MAP) SHOTS[k] = LIB[MAP[k]];
// the open sky, shared with A89's flight (clouds drift with t)
function skyHigh(ctx, cam, t, mid, drift = 1) {
  const bg = BG.sky; drawLayer(ctx, cam, bg.sky);
  if (mid) withCam(ctx, cam, 0.2, mid);
  drawLayer(ctx, Object.assign({}, cam, { x: (cam.x || 0) + ((t * 40 * drift) % 300) }), bg.cl);
  drawLayer(ctx, Object.assign({}, cam, { x: (cam.x || 0) + ((t * 90 * drift) % 400) }), bg.fg);
}
