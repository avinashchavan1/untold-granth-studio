// ===== Reel A04 — "No Squirrel at Rama's Bridge" — 12 shots (CE Yuddha 6.15) =====
// The Ocean rises and names Nala (6.15.1-9); Nala speaks only because asked (6.15.13); the monkeys hurl trees and
// mountains (6.15.14-21); a bridge 10 x 100 yojanas, shining like Svati's path (6.15.20-22); all beings watch, the army crosses.
// opening śloka (CE 6.15.20), Devanagari from the CE page via scripts/ce_verse.py
const SLOKA = {"lines": ["दशयोजनविस्तीर्णं शतयोजनमायतम् ।", "नलश्चक्रे महासेतुं मध्ये नदनदीपतेः ॥"], "ref": "YUDDHA KANDA 6.15.20", "en": "“Nala built a great bridge, ten yojanas wide and a hundred yojanas long, in the middle of the ocean.”", "translit": "daśayojanavistīrṇaṃ śatayojanamāyatam, nalaścakre mahāsetuṃ madhye nadanadīpateḥ"};
function buildScenes() { BG.sh = buildShore('dusk'); BG.ms = buildManuscript(); }
const MK = [CH.vanara, CH.vanara2, CH.vanara];

function squirrel(c, x, y, s, a = 1, ph = 0) {          // the loved image from later retellings: a palm squirrel with three stripes
  c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(s, s);
  blob(c, [[-0.9, -0.2], [-1.3, -0.9], [-1.0, -1.5], [-0.5, -1.3], [-0.6, -0.6], [-0.3, -0.2]], '#8a6a4a', 1, 0.4);         // bushy tail
  blob(c, [[-0.5, 0], [-0.4, -0.45], [0.1, -0.55], [0.5, -0.35], [0.55, 0], [0, 0.08]], '#9a7650', 1, 0.4);                  // body
  for (let i = 0; i < 3; i++) stroke(c, -0.35 + i * 0.05, -0.38 + i * 0.13, 0.4, -0.42 + i * 0.13, 0.05, i === 1 ? '#f4e8d0' : '#3a2a1a', 0.9);
  dab(c, 0.62, -0.42, 0.22, 0.18, 0, '#9a7650'); dab(c, 0.7, -0.46, 0.04, 0.04, 0, '#1a1010'); dab(c, 0.52, -0.6, 0.07, 0.09, 0, '#8a6a4a');
  dab(c, 0.4, -0.05 + Math.sin(ph) * 0.03, 0.12, 0.09, 0, '#c8bca8');                                                       // the pebble
  c.restore();
}
function boulder(c, x, y, r, seed = 0) { blob(c, [[x - r, y + r * 0.5], [x - r * 0.9, y - r * 0.5], [x - r * 0.2, y - r], [x + r * 0.8, y - r * 0.6], [x + r, y + r * 0.4], [x + r * 0.2, y + r * 0.8]], ['#6e6676', '#5a5262', '#847c8a'][seed % 3], 1, 0.3); stroke(c, x - r * 0.5, y - r * 0.5, x + r * 0.3, y - r * 0.7, r * 0.12, '#a8a0b0', 0.6); }
function tree(c, x, y, len, ang, seed = 0) {            // an uprooted tree carried on the shoulder
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len; stroke(c, x, y, ex, ey, len * 0.07, '#5a3a24', 1);
  for (let i = 0; i < 9; i++) { const h = hash(seed * 11 + i), d = len * (0.55 + h * 0.5); dab(c, x + Math.cos(ang) * d + (hash(i * 3 + seed) - 0.5) * len * 0.35, y + Math.sin(ang) * d + (hash(i * 7 + seed) - 0.5) * len * 0.35, len * 0.16, len * 0.12, h * 3, ['#2f6a4a', '#3c7a52', '#24563c'][i % 3], 0.95); }
  for (let i = 0; i < 4; i++) stroke(c, x, y, x - Math.cos(ang + 0.6 * (i - 1.5)) * len * 0.15, y - Math.sin(ang + 0.6 * (i - 1.5)) * len * 0.15, 3, '#4a301c', 0.9);   // roots
}
function splash(c, x, y, k, s = 1) {                     // water thrown up as a rock lands (6.15.19)
  if (k <= 0 || k >= 1) return;
  for (let i = 0; i < 26; i++) { const an = -Math.PI * (0.1 + 0.8 * hash(i * 2.1)), v = (120 + hash(i * 5.3) * 260) * s, tt = k * 1.1; dab(c, x + Math.cos(an) * v * tt, y + Math.sin(an) * v * tt + 300 * tt * tt * s, 6 * s * (1 - k) + 1, 6 * s * (1 - k) + 1, 0, '#e8eef8', 0.9 * (1 - k)); }
  glow(c, x, y, 120 * s, '#dfe8ff', 0.3 * (1 - k));
}
function carrier(c, ch, x, y, s, face, ph, kind, seed) {  // a running monkey with a boulder overhead or a tree on the shoulder
  const pose = runPose(ph, { aN: kind === 'rock' ? [0.07, -0.22] : [0.12, -0.05], aF: kind === 'rock' ? [0.12, -0.24] : [0.16, -0.02], handN: 'hold', handF: 'hold', smile: 0.4, eye: 1, lean: 0.18, tail: Math.sin(ph) });
  const f = drawFigure(c, ch, pose, { x, y, s, face }, L_DUSK);
  const h = [(f.handN[0] + f.handF[0]) / 2, (f.handN[1] + f.handF[1]) / 2];
  if (kind === 'rock') boulder(c, h[0], h[1] - s * 0.09, s * 0.12, seed); else tree(c, h[0] - face * s * 0.05, h[1], s * 0.75, face > 0 ? Math.PI * 1.08 : -0.08, seed);
}

const SHOTS = {
  // 1 — hook: the famous squirrel on the half-built bridge… crumbles to sand on the question
  1(ctx, u, p, sh, t, post) {
    const B1 = Math.max(1.6, sh.vStart - sh.start + sh.speech - 0.1), bg = BG.sh, cam = { z: lerp(1.5, 1.65, p), x: 20, y: 380 };
    const crack = ease(u, B1, B1 + 0.9);
    shore(ctx, bg, cam, t, c => {
      if (crack < 1) squirrel(c, 520, SHORE_Y - 4, 70, 1 - crack, u * 6);
      if (crack > 0) for (let i = 0; i < 60; i++) { const an = hash(i) * TAU, d = easeOut(crack) * (30 + hash(i * 7) * 220); dab(c, 560 + Math.cos(an) * d, SHORE_Y + Math.sin(an) * d * 0.5 + crack * 90, 5 * (1 - crack) + 1, 5 * (1 - crack) + 1, an, i % 3 ? '#c8a880' : '#8a6a4a', 1 - crack); }
    }, 0.45);
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => { (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.25, 0.55 + i * 0.25); if (q > 0) text(c, s, 540, 560 + i * 124 + (1 - q) * 22, { size: i ? 96 : 104, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); }); };
  },
  2(ctx, u, p, sh, t, post) { slokaSource(ctx, u, p, sh, t, post, SLOKA); },
  // 3 — Rama at the shore; the Ocean himself rises from the waves with joined palms
  3(ctx, u, p, sh, t, post) {
    const bg = BG.sh, cam = { z: lerp(1.0, 1.12, p), x: 0, y: lerp(40, 90, p) }, st = sentenceStarts(sh, 2), rise = ease(u, st[1] - 0.2, st[1] + 2.2), WL = SHORE_Y - 220;
    shore(ctx, bg, cam, t, c => {
      if (rise > 0) {
        glow(c, 700, WL - 200, 360, '#9ad0ff', 0.35 * rise);
        c.save(); c.beginPath(); c.rect(-200, -400, 1500, WL + 400); c.clip();
        drawFigure(c, CH.sagara, P({ handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1], eye: blink(t, 4), smile: 0.3, head: 0.04 }), { x: 720, y: WL + lerp(460, 180, rise), s: 620, face: -1 }, { rim: '#bfe4ff', rimA: 0.9, dir: -1, tint: '#10306a', tintA: 0.15 });
        c.restore();
        for (let k = 0; k < 3; k++) { c.globalAlpha = 0.6 * rise; c.strokeStyle = '#eaf4ff'; c.lineWidth = 5 - k; c.beginPath(); c.ellipse(720, WL + 4, 170 + k * 40 + Math.sin(t * 2 + k) * 8, 18 + k * 6, 0, 0, TAU); c.stroke(); } c.globalAlpha = 1;
      }
      drawFigure(c, CH.rama, P({ bow: 'N', aN: [0.08, 0.2], bowAng: 0.1, head: -0.05, eye: blink(t, 5), smile: 0.0, gaze: [0.6, -0.2], brow: 0.2 }), { x: 260, y: SHORE_Y + 330, s: 700, face: 1 }, L_DUSK);
    }, 0.12);
    drawLayer(ctx, cam, bg.fg);
  },
  // 4 — the Ocean: "This is Nala, son of Vishvakarma… let him build on me; I will hold it up"
  4(ctx, u, p, sh, t, post) {
    const bg = BG.sh, cam = { z: lerp(1.3, 1.36, p), x: 120, y: 140 }, m = mouthEnv(sh, u), st = sentenceStarts(sh, 2), WL = SHORE_Y - 220, pt = ease(u, 0.6, 1.2) * (1 - ease(u, st[1], st[1] + 0.6));
    shore(ctx, bg, cam, t, c => {
      glow(c, 700, WL - 200, 360, '#9ad0ff', 0.3);
      c.save(); c.beginPath(); c.rect(-200, -400, 1500, WL + 400); c.clip();
      const gp = P({ handN: pt > 0.3 ? 'point' : 'palm', aF: [0.16, 0.05], handF: 'palm', eye: blink(t, 4), smile: 0.3, mouth: m * 0.8, head: 0.03, gaze: [0.5, 0.2] });
      gp.aN = [lerp(0.115, 0.3, pt), lerp(0.1, 0.02, pt)]; gp.head += Math.sin(u * 9) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.sagara, gp, { x: 720, y: WL + 180, s: 620, face: -1 }, { rim: '#bfe4ff', rimA: 0.9, dir: -1, tint: '#10306a', tintA: 0.15 });
      c.restore();
      for (let k = 0; k < 3; k++) { c.globalAlpha = 0.55; c.strokeStyle = '#eaf4ff'; c.lineWidth = 5 - k; c.beginPath(); c.ellipse(720, WL + 4, 170 + k * 40 + Math.sin(t * 2 + k) * 8, 18 + k * 6, 0, 0, TAU); c.stroke(); } c.globalAlpha = 1;
      drawFigure(c, CH.nala, P({ head: 0.12, eye: blink(t, 3), smile: 0.2, aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', tail: Math.sin(t) }), { x: 250, y: SHORE_Y + 300, s: 560, face: 1 }, L_DUSK);
    }, 0.12);
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { const q = ease(u, 0.8, 1.2) * (1 - ease(u, sh.dur - 0.5, sh.dur)); if (q > 0) text(c, 'NALA', 300, 1260, { size: 64, font: 'Montserrat', weight: 800, color: C_GOLD, ls: 10, alpha: q, stroke: 7, shadow: 22 }); };
  },
  // 5 — Nala: "Unasked, I would never speak of my own skills. Let the bridge begin, today."
  5(ctx, u, p, sh, t, post) {
    const bg = BG.sh, cam = { z: lerp(1.42, 1.5, p), x: -120, y: 220 }, m = mouthEnv(sh, u), st = sentenceStarts(sh, 2), go = ease(u, st[1] - 0.1, st[1] + 0.6);
    shore(ctx, bg, cam, t, c => {
      const np = P({ head: lerp(0.12, -0.02, go), eye: blink(t, 3), smile: lerp(0.15, 0.5, go), handN: go > 0.4 ? 'palm' : 'namaste', aF: [0.115, 0.1], handF: go > 0.4 ? 'relaxed' : 'none', mouth: m * 0.8, tail: Math.sin(t * 1.5), gaze: [0.5, 0] });
      np.aN = [lerp(0.115, 0.26, go), lerp(0.1, -0.12, go)]; np.head += Math.sin(u * 10) * 0.012 * (m > 0.1 ? 1 : 0);
      drawFigure(c, CH.nala, np, { x: 420, y: SHORE_Y + 300, s: 640, face: 1 }, L_DUSK);
    }, 0.12);
    drawLayer(ctx, cam, bg.fg);
  },
  // 6 — hundreds of thousands of monkeys: trees uprooted, rocks like mountains hurled into the sea
  6(ctx, u, p, sh, t, post) {
    const bg = BG.sh, cam = { z: lerp(1.05, 1.12, p), x: 0, y: 60 };
    shore(ctx, bg, cam, t, c => {
      for (let i = 0; i < 4; i++) { const k = ((u * 0.55 + i * 0.27) % 1); splash(c, 380 + i * 170, SHORE_Y - 120 - i * 20, k, 0.9); }
      for (let i = 0; i < 7; i++) { const lane = i % 3, sp = 260 + hash(i) * 120, x = ((u * sp + i * 300) % 1500) - 200, y = SHORE_Y + 160 + lane * 120, s = 300 + lane * 60;
        carrier(c, MK[i % 3], x, y, s, 1, u * 9 + i, i % 2 ? 'tree' : 'rock', i); }
    }, Math.min(1, u / 4) * 0.3);
    drawLayer(ctx, cam, bg.fg);
  },
  // 7 — TREES. ROCKS. MOUNTAINS. (the sea thrown up into the sky)
  7(ctx, u, p, sh, t, post) {
    const bg = BG.sh, cam = { z: lerp(1.2, 1.28, p), x: 40, y: 120 }, st = sentenceStarts(sh, 3);
    shore(ctx, bg, cam, t, c => { for (let i = 0; i < 3; i++) splash(c, 420 + i * 200, SHORE_Y - 160, ease(u, st[i], st[i] + 1.1), 1.3); }, 0.45);
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) text(c, s, 540, 540 + i * 120 + (1 - q) * 22, { size: 100, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 32 }); });
  },
  // 8 — Nala's bridge reaches across: 100 x 10 yojanas, shining like the path of Svati
  8(ctx, u, p, sh, t, post) {
    const bg = BG.sh, cam = { z: lerp(1.0, 1.04, p), x: 0, y: lerp(0, -30, p) }, st = sentenceStarts(sh, 2), shine = ease(u, st[1], st[1] + 1.2);
    shore(ctx, bg, cam, t, c => {
      for (let i = 0; i < 40; i++) { const k = i / 39, x = lerp(560, 690, k) + Math.sin(i) * 6, y = lerp(260, 120, k); dab(c, x, y, 3, 3, 0, '#fff4d0', shine * (0.4 + 0.6 * hash(i))); }   // Svati's path in the sky
      drawFigure(c, CH.nala, P({ aN: [0.3, -0.05], handN: 'point', aF: [0.1, 0.18], eye: blink(t, 3), smile: 0.5, tail: Math.sin(t), gaze: [0.6, -0.3] }), { x: 230, y: SHORE_Y + 330, s: 560, face: 1 }, L_DUSK);
    }, 0.5 + 0.5 * ease(u, 0, sh.dur * 0.6), shine);
    drawLayer(ctx, cam, bg.fg);
    post.ui = c => { const q = ease(u, 0.8, 1.2); if (q > 0) { text(c, '100 × 10', 540, 500, { size: 112, weight: 900, color: C_GOLD, ls: 6, alpha: q, stroke: 10, shadow: 32 }); text(c, 'YOJANAS', 540, 590, { size: 54, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 14, alpha: q, stroke: 7, shadow: 24 }); } };
  },
  // 9 — gods and sages watch; the whole army crosses on Nala's bridge
  9(ctx, u, p, sh, t, post) {
    const bg = BG.sh, cam = { z: lerp(1.04, 1.1, p), x: 0, y: -20 }, st = sentenceStarts(sh, 2), cross = ease(u, st[1] - 0.3, sh.dur);
    shore(ctx, bg, cam, t, c => {
      for (let i = 0; i < 7; i++) { const x = 120 + i * 150 + Math.sin(t * 0.6 + i) * 20, y = 200 + hash(i) * 120; glow(c, x, y, 70, '#fff0c8', 0.35); dab(c, x, y, 8, 12, 0, '#fff8e0', 0.8); }   // the watching gods
      for (let i = 0; i < 40; i++) { const k = ((cross * 0.9 + i / 40) % 1), y = lerp(SHORE_Y + 10, BRIDGE_VP[1] + 6, Math.pow(k, 0.45)), sc = Math.max(0.03, (y - HORIZON) / (SHORE_Y + 10 - HORIZON)), x = lerp(520, BRIDGE_VP[0], 1 - (y - HORIZON) / (SHORE_Y + 40 - HORIZON)) + (hash(i * 3) - 0.5) * 260 * sc;
        if (cross > 0) { dab(c, x, y - 40 * sc, 12 * sc + 1, 22 * sc + 1, 0, '#2a1c18', 0.9 * Math.min(1, cross * 4)); dab(c, x, y - 70 * sc, 9 * sc + 1, 9 * sc + 1, 0, '#2a1c18', 0.9 * Math.min(1, cross * 4)); } }
    }, 1, 1);
    drawLayer(ctx, cam, bg.fg);
  },
  // 10 — NO SQUIRREL. NO NAME ON THE STONES. THE OCEAN HELD IT.
  10(ctx, u, p, sh, t, post) {
    const bg = BG.sh, cam = { z: lerp(1.0, 1.05, p), y: lerp(-10, 20, p) }, st = sentenceStarts(sh, 3);
    shore(ctx, bg, cam, t, null, 1, 0.6); drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#080826', 0.32 + 0.12 * p); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) text(c, s, 545, 560 + i * 116 + (1 - q) * 22, { size: i === 1 ? 66 : 86, weight: 900, color: col || C_IVORY, ls: 4, alpha: q, stroke: 9, shadow: 30 }); });
  },
  // 11 — "The squirrel — not in Valmiki" on the manuscript
  11(ctx, u, p, sh, t, post) {
    const bg = BG.ms, cam = { z: lerp(1.05, 1.12, p), y: 10 }, st = sentenceStarts(sh, 2);
    drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms); withCam(ctx, cam, 0.8, c => flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3));
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => {
      const q0 = ease(u, 0.2, 0.6); if (q0 > 0) text(c, 'THE SQUIRREL', 540, 560, { size: 80, weight: 900, color: C_IVORY, ls: 4, alpha: q0, stroke: 9, shadow: 28 });
      const q1 = ease(u, st[1] - 0.05, st[1] + 0.3); if (q1 > 0) { text(c, 'NOT IN VALMIKI', 540, 690 + (1 - q1) * 20, { size: 92, weight: 900, color: C_GOLD, ls: 5, alpha: q1, stroke: 10, shadow: 32 }); const w = 330 * easeOut(map(u, st[1], st[1] + 0.35)); c.fillStyle = rgba(C_RED, 0.9); c.fillRect(540 - w, 538, w * 2, 8); }
    };
  },
  12(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
