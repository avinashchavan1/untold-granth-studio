// ===== Reel A38 — "Why Didn't Hanuman Defeat Vali?" — 12 shots (CE Uttara 7.35-36; Kishkindha 4.65-66) =====
// Rama asks Agastya why Hanuman didn't burn Vali like a creeper (7.35.11). Agastya: the child, full of the gods' boons, troubled
// the hermitages (7.36.27-31); the Bhrigu and Angiras sages cursed him not to know his strength for a long time (7.36.32-34);
// so he didn't know it when Vali hounded Sugriva (7.36.39-40). Grammar learned facing the sun (7.36.42). Jambavan's reminder (4.65.7, 4.66.1).
// Baby Hanuman = locked look style 'g'. Agastya and the two cursing sages are minor characters (Claude's choice, below).
const SLOKA = { lines: ['बाधसे यत् समाश्रित्य बलमस्मान्प्लवंगम ।', 'तद्दीर्घकालं वेत्तासि नास्माकं शापमोहितः ॥'], ref: 'UTTARA KANDA 7.36.33',
  en: '“O monkey, the strength you lean on to harass us, you will not know it for a long time, bewildered by our curse.”' };
const MANAS = { source: 'RAMCHARITMANAS', ref: 'TULSIDAS · KISHKINDHA KAND · AFTER DOHA 29', lines: ['कहइ रीछपति सुनु हनुमाना।', 'का चुप साधि रहेहु बलवाना।।'],
  translit: 'kahai rīchhapati sunu hanumānā, kā chup sādhi rahehu balavānā', en: '“Said the king of bears: listen, Hanuman, O mighty one, why do you sit silent?”' };
Object.assign(CH, {
  agastya: { kind: 'monk', sage: true, skin: '#8a5a3c', skinSh: '#54362a', cloth: '#c46a24', clothSh: '#80421a', hair: '#e8e2d6' },   // short, dark, white jata + beard, saffron
  bhrigu:  { kind: 'monk', sage: true, skin: '#a87a5a', skinSh: '#6a4a4a', cloth: '#9a6a3a', clothSh: '#5e4026', hair: '#d8d2c6' },
  angiras: { kind: 'monk', sage: true, skin: '#9c6c4c', skinSh: '#5e4040', cloth: '#d8c4a0', clothSh: '#988468', hair: '#b4aca0' },
});
const RAMA_K = Object.assign({}, CH.rama, { crown: true, bow: false });    // Uttara: the crowned king in court
function buildScenes() { BG.sh = buildShore('dusk'); BG.shN = buildShore('night'); BG.court = buildCourt(); BG.her = buildHermitage('end'); BG.herD = buildHermitage('dusk');
  BG.dawn = buildDawn(); BG.sky = buildSkyHigh(); BG.ms = buildManuscript(); }
const BH = (c, x, y, s, t, o = {}) => drawBalHanuman(c, x, y, s, t, Object.assign({ style: 'g' }, o));
const fig = (c, ch, pose, x, y, s, face, light) => drawFigure(c, ch, P(Object.assign({ eye: 1, gaze: [0.4, 0] }, pose)), { x, y, s, face }, light);
const L_DAY = { rim: '#fff0c8', rimA: 0.7, dir: 1, tint: '#30406a', tintA: 0.1 };
const L_SAGE = { rim: '#ffd890', rimA: 0.85, dir: -1, tint: '#40182c', tintA: 0.12 };
const HG = 1395;                                       // hermitage ground
const cardUI = (c, u, cards, at, y0 = 470) => cards.forEach(([s, col], i) => { const q = ease(u, at + i * 0.25, at + 0.4 + i * 0.25); if (q > 0) textFit(c, s, 540, y0 + i * 124 + (1 - q) * 22, { size: 100, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
const dim = (ctx, a, col = '#05061a') => { ctx.fillStyle = rgba(col, a); ctx.fillRect(0, 0, W, H); };
// Vali hounding Sugriva across the dusk hills (silhouettes), x0 = start of the chase
function chase(c, u, t, x0, light) {
  const k = (u * 220) % 1500, sx = x0 + k, vx = sx - 260;
  fig(c, CH.sugriva, Object.assign(walkPose(u * 9, 0.5), { lean: 0.25, gaze: [0.6, 0], eye: 1 }), sx, HG - 40, 380, 1, light);
  fig(c, CH.vali, Object.assign(walkPose(u * 9 + 1, 0.5), { lean: 0.3, handN: 'fist', aN: [0.3, -0.2], brow: 0.8, gaze: [0.6, 0] }), vx, HG - 40, 420, 1, light);
}
const SIL = { rim: '#f4b48c', rimA: 0.5, dir: 1, tint: '#0a0820', tintA: 0.75 };

const SHOTS = {
  // 1 — hook: Vali hounds Sugriva in the distance; mighty Hanuman stands and watches, doing nothing. Rama himself asked why.
  1(ctx, u, p, sh, t, post) {
    const bg = BG.herD, cam = { z: lerp(1.08, 1.16, p), x: 0, y: 40 }, st = sentenceStarts(sh, 2);
    hermitage(ctx, bg, cam, t, c => {
      chase(c, u, t, -300, SIL);
      fig(c, CH.hanuman, { aN: [0.1, 0.16], aF: [0.08, 0.2], eye: blink(t, 4), brow: 0.4, gaze: [-0.6, 0], tail: Math.sin(t * 1.5) * 0.5 }, 820, HG + 120, 640, -1, L_DUSK);
    });
    dim(ctx, 0.3);
    post.ui = c => cardUI(c, u, sh.card || [], Math.max(0.15, st[1] - 0.1));
  },
  2(ctx, u, p, sh, t, post) { slokaSource(ctx, u, p, sh, t, post, SLOKA); },
  // 3 — Tulsidas: on the seashore Jambavan asks Hanuman why he sits silent (quote card from the 2nd sentence)
  3(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), qa = st[1] - 0.25;
    if (u >= qa) return quoteCard(ctx, u - qa, sh, t, post, Object.assign({ enAt: Math.max(2.5, st[2] - qa - 0.1) }, MANAS));
    const bg = BG.sh, cam = { z: lerp(1.3, 1.36, p), x: 0, y: 300 };
    shore(ctx, bg, cam, t, c => {
      fig(c, CH.jambavan, { sit: 1, aN: [0.24, 0.0], handN: 'palm', eye: 0.3, brow: 0.5, gaze: [0.4, -0.1] }, 330, SHORE_Y + 20, 560, 1, L_DUSK);
      fig(c, CH.hanuman, { sit: 1, aN: [0.06, 0.2], aF: [0.06, 0.22], eye: 0.6, head: 0.12, gaze: [0.3, 0.4], tail: Math.sin(t) * 0.3 }, 760, SHORE_Y + 30, 600, -1, L_DUSK);
    }, 0.4);
    drawLayer(ctx, cam, bg.fg); dim(ctx, 0.2);
  },
  // 4 — Valmiki's Jambavan: "in strength, wisdom, brilliance and courage you surpass all; why don't you know yourself?" (4.65.7)
  4(ctx, u, p, sh, t, post) {
    const bg = BG.shN, cam = { z: lerp(1.35, 1.45, p), x: -120, y: 320 }, m = mouthEnv(sh, u);
    shore(ctx, bg, cam, t, c => {
      glow(c, 360, SHORE_Y - 260, 380, '#ffd890', 0.18);
      fig(c, CH.jambavan, { sit: 1, lean: 0.08, aN: [0.3, -0.06], handN: 'palm', eye: 0.35, brow: 0.5, mouth: m * 0.7, gaze: [0.5, -0.1], head: Math.sin(u * 11) * 0.015 * (m > 0.1 ? 1 : 0) }, 380, SHORE_Y + 20, 600, 1, L_NIGHT);
      fig(c, CH.hanuman, { sit: 1, aN: [0.06, 0.2], aF: [0.06, 0.22], eye: blink(t, 4), head: 0.06, gaze: [-0.5, -0.1], tail: Math.sin(t) * 0.3 }, 820, SHORE_Y + 30, 620, -1, L_NIGHT);
    }, 0.3);
    drawLayer(ctx, cam, bg.fg);
  },
  // 5 — he grows (4.66.1) ... but why had he forgotten? The answer comes much later, in the Uttara Kanda
  5(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), g = ease(u, 0.2, st[1] - 0.2), bg = BG.shN, cam = { z: lerp(1.2, 0.95, g), x: 0, y: lerp(240, 0, g) };
    shore(ctx, bg, cam, t, c => {
      glow(c, 700, SHORE_Y - 400 - 500 * g, 300 + 500 * g, '#ffc860', 0.3 * g);
      fig(c, CH.jambavan, { sit: 1, aN: [0.1, 0.1], eye: 0.4, brow: 0.3, smile: 0.4, gaze: [0.5, -0.8 * g] }, 300, SHORE_Y + 20, 520, 1, L_NIGHT);
      fig(c, CH.hanuman, { aN: [0.14, 0.08], aF: [0.14, 0.1], handN: 'fist', handF: 'fist', eye: blink(t, 4), brow: 0.4, smile: 0.3, gaze: [-0.3, -0.2], tail: Math.sin(t * 2) }, 720, SHORE_Y + 40, lerp(620, 1040, g), -1, { rim: '#ffd890', rimA: 0.6 + 0.4 * g, dir: -1, tint: '#141c5c', tintA: 0.25 });
    }, 0.3);
    drawLayer(ctx, cam, bg.fg); dim(ctx, 0.35 * ease(u, st[1] - 0.2, st[1] + 0.3));
    post.ui = c => {
      const q = ease(u, st[1] - 0.05, st[1] + 0.35); if (q > 0) textFit(c, 'WHY HAD HE FORGOTTEN?', 540, 300 + (1 - q) * 20, { size: 84, weight: 900, color: C_GOLD, ls: 4, alpha: q, stroke: 10, shadow: 32 });
      const q2 = ease(u, st[2] + 0.4, st[2] + 0.8); if (q2 > 0) text(c, 'ANSWER: UTTARA KANDA', 540, 380, { size: 44, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 5, alpha: q2, stroke: 6, shadow: 20 });
    };
  },
  // 6 — in his court, Rama asks the sage Agastya: why did Hanuman not burn Vali like a creeper, for Sugriva? (7.35.11)
  6(ctx, u, p, sh, t, post) {
    const bg = BG.court, cam = { z: lerp(1.12, 1.18, p), x: 0, y: 90 }, m = mouthEnv(sh, u);
    court(ctx, bg, cam, t, c => {
      fig(c, CH.agastya, { sit: 1, aN: [0.1, 0.16], aF: [0.08, 0.2], eye: blink(t, 6), smile: 0.3, gaze: [-0.5, 0], head: 0.04 }, 800, COURT_FLOOR + 40, 520, -1, L_DAY);
      fig(c, RAMA_K, { aN: [0.2, -0.02], handN: 'palm', aF: [0.06, 0.18], eye: blink(t, 5), brow: 0.4, mouth: m, smile: 0.1, gaze: [0.5, 0.05], head: Math.sin(u * 12) * 0.012 * (m > 0.1 ? 1 : 0) }, 360, COURT_FLOOR + 110, 660, 1, L_DAY);
    });
    post.ui = c => { const q = ease(u, 0.15, 0.5) * (1 - ease(u, sh.dur - 0.5, sh.dur)); if (q > 0) { text(c, 'UTTARA KANDA 7.35', 540, 330, { size: 56, weight: 900, color: C_GOLD, ls: 6, alpha: q, stroke: 8, shadow: 26 }); text(c, 'RAMA ASKS THE SAGE AGASTYA', 540, 388, { size: 34, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 4, alpha: q, stroke: 5 }); } };
  },
  // 7 — Agastya tells of the child: glowing with the gods' boons, fearless, playing pranks in the sages' hermitages (7.36.27-31)
  7(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), bg = BG.her, cam = { z: lerp(1.15, 1.22, p), x: 0, y: 80 }, boon = ease(u, st[1], st[1] + 0.8), play = ease(u, st[2], st[2] + 0.4);
    hermitage(ctx, bg, cam, t, c => {
      fig(c, CH.bhrigu, { sit: 1, aN: [0.1, 0.16], aF: [0.08, 0.2], eye: 0.1, head: 0.05, gaze: [0.3, 0.3] }, 840, HG + 20, 480, -1, L_DAY);
      const hop = Math.abs(Math.sin(u * 5)) * 120 * play, bx = lerp(300, 560 + Math.sin(u * 2.5) * 200, play);
      if (boon > 0) glow(c, bx, HG - 120 - hop, 220, '#ffe0a0', 0.4 * boon);
      BH(c, bx, HG - 70 - hop, 150, t, { pose: play > 0.3 && Math.sin(u * 5) > 0 ? 'reach' : 'sit', smile: 1, eye: blink(t, 3), glow: 0.3 + 0.5 * boon });
      leaves(c, t * 0.5, 3, 5);
    });
    post.ui = c => { const q = ease(u, st[1] + 0.1, st[1] + 0.5) * (1 - ease(u, st[2] - 0.2, st[2] + 0.1)); if (q > 0) text(c, "THE GODS' BOONS", 540, 420, { size: 84, weight: 900, color: C_GOLD, ls: 6, alpha: q, stroke: 9, shadow: 30 }); };
  },
  // 8 — Agastya: the Bhrigu and Angiras sages cursed him; the child's glow fades (7.36.32-34)
  8(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), bg = BG.herD, cam = { z: lerp(1.2, 1.3, p), x: 0, y: 100 }, curse = ease(u, st[1], st[1] + 1.6);
    hermitage(ctx, bg, cam, t, c => {
      fig(c, CH.bhrigu, { lean: 0.05, aN: [0.3, -0.3], handN: 'palm', aF: [0.06, 0.2], eye: 1, brow: 0.8, gaze: [-0.5, 0.2] }, 700, HG + 60, 560, -1, L_SAGE);
      fig(c, CH.angiras, { aN: [0.28, -0.24], handN: 'point', aF: [0.08, 0.2], eye: 1, brow: 0.8, gaze: [-0.5, 0.2] }, 900, HG + 40, 520, -1, L_SAGE);
      glow(c, 360, HG - 110, 220, '#ffe0a0', 0.4 * (1 - curse));
      for (let i = 0; i < 18; i++) { const k = map(curse, i * 0.03, 0.5 + i * 0.03); if (k > 0 && k < 1) dab(c, lerp(620, 380, k) + hash(i) * 40, lerp(HG - 330, HG - 120, k) + hash(i * 5) * 40, 6, 6, 0, '#e6d2ff', 0.7 * (1 - k)); }
      BH(c, 360, HG - 70, 150, t, { pose: 'sit', smile: lerp(0.8, 0, curse), eye: curse > 0.6 ? 0.5 : 1, glow: 0.8 * (1 - curse) });
    });
    dim(ctx, 0.2 + 0.2 * curse, '#0a0a24');
    post.ui = c => cardUI(c, u, sh.card || [], st[1] + 0.2, 330);
  },
  // 9 — so, when Vali hounded Sugriva, Hanuman didn't know his own strength: Agastya's answer to Rama (7.36.39-40)
  9(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), bg = BG.herD, cam = { z: lerp(1.1, 1.18, p), x: 0, y: 40 }, inC = u >= st[2] - 0.15;
    if (!inC) {
      hermitage(ctx, bg, cam, t, c => {
        chase(c, u, t, -300, SIL);
        fig(c, CH.hanuman, { aN: [0.1, 0.16], aF: [0.08, 0.2], eye: blink(t, 4), brow: 0.6, browUp: 0.5, gaze: [-0.6, 0], tail: Math.sin(t * 1.5) * 0.5 }, 820, HG + 120, 640, -1, L_DUSK);
      });
      dim(ctx, 0.3 * ease(u, st[1] - 0.2, st[1] + 0.3));
    } else {
      court(ctx, BG.court, { z: lerp(1.15, 1.2, p), x: 0, y: 90 }, t, c => {
        fig(c, CH.agastya, { sit: 1, aN: [0.24, -0.04], handN: 'palm', aF: [0.08, 0.2], eye: blink(t, 6), smile: 0.4, gaze: [-0.5, 0] }, 800, COURT_FLOOR + 40, 520, -1, L_DAY);
        fig(c, RAMA_K, { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], eye: blink(t, 5), smile: 0.5, gaze: [0.5, 0.05], head: 0.05 }, 360, COURT_FLOOR + 110, 660, 1, L_DAY);
      });
    }
    post.ui = c => { if (!inC) cardUI(c, u, sh.card || [], st[1] + 0.3); };
  },
  // 10 — and few know: he learned grammar facing the sun, moving backwards from its rising to its setting (7.36.42)
  10(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), go = map(u, st[1], sh.dur), sx = lerp(980, 720, go), sy = 520 + Math.sin(go * Math.PI) * -120, hx = lerp(560, 280, go);   // facing the sun, moving backwards ahead of it (east to west)
    skyHigh(ctx, { z: 1.0, y: 0 }, t, sx, sy, c => {
      fig(c, CH.hanuman, { lean: -0.15, aN: [0.24, -0.1], aF: [0.2, -0.06], handN: 'namaste', handF: 'none', lN: [0.1, 0.04], lF: [-0.06, 0.04], eye: blink(t, 4), smile: 0.4, gaze: [0.5, -0.4], tail: Math.sin(t * 2) }, hx, 1350, 520, sx < hx ? -1 : 1, { rim: '#ffe0a0', rimA: 0.9, dir: sx < hx ? -1 : 1 });
    });
    post.ui = c => { const q = ease(u, st[2], st[2] + 0.4); if (q > 0) cardUI(c, u, sh.card || [], st[2]); const q0 = ease(u, st[0], st[0] + 0.4) * (1 - ease(u, st[1] - 0.2, st[1] + 0.1)); if (q0 > 0) text(c, 'FEW KNOW THIS', 540, 470, { size: 84, weight: 900, color: C_IVORY, ls: 6, alpha: q0, stroke: 9, shadow: 30 }); };
  },
  // 11 — payoff: Tulsidas = Jambavan's reminder; Valmiki = the reason too, the sages' curse. Both told with devotion.
  11(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), bg = BG.sh, cam = { z: lerp(1.0, 1.06, p), x: 0, y: 40 };
    shore(ctx, bg, cam, t, c => {
      glow(c, 600, SHORE_Y - 700, 700, '#ffc860', 0.25);
      fig(c, CH.jambavan, { sit: 1, aN: [0.1, 0.1], eye: 0.4, smile: 0.5, gaze: [0.5, -0.6] }, 260, SHORE_Y + 20, 480, 1, L_DUSK);
      fig(c, CH.hanuman, { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], eye: blink(t, 4), smile: 0.5, gaze: [0.3, -0.2], tail: Math.sin(t * 2) }, 660, SHORE_Y + 60, 760, 1, { rim: '#ffd890', rimA: 0.9, dir: 1, tint: '#262060', tintA: 0.15 });
    }, 0.3);
    drawLayer(ctx, cam, bg.fg); dim(ctx, 0.35);
    post.ui = c => {
      const q0 = ease(u, st[0], st[0] + 0.35); if (q0 > 0) { text(c, 'TULSIDAS', 540, 330, { size: 72, weight: 900, color: C_GOLD, ls: 6, alpha: q0, stroke: 9, shadow: 28 }); text(c, 'JAMBAVAN REMINDS HIM', 540, 390, { size: 36, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 4, alpha: q0, stroke: 5 }); }
      const q1 = ease(u, st[1], st[1] + 0.35); if (q1 > 0) { text(c, 'VALMIKI', 540, 490, { size: 72, weight: 900, color: C_GOLD, ls: 6, alpha: q1, stroke: 9, shadow: 28 }); text(c, "THE REASON: THE SAGES' CURSE", 540, 550, { size: 36, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 4, alpha: q1, stroke: 5 }); }
    };
  },
  12(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
// the open sky with the sun at (sx, sy): reuses the A89 sky layers
function skyHigh(ctx, cam, t, sx, sy, mid) {
  const bg = BG.sky; drawLayer(ctx, cam, bg.sky); withCam(ctx, cam, 0.1, c => sunDisc(c, sx, sy, 90, t));
  drawLayer(ctx, Object.assign({}, cam, { x: (cam.x || 0) + ((t * 40) % 300) }), bg.cl);
  if (mid) withCam(ctx, cam, 0.6, mid);
}
