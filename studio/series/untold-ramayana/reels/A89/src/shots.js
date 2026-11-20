// ===== Reel A89 — "Did Baby Hanuman Swallow the Sun?" — 12 shots (CE Kishkindha 4.65; Uttara 7.35-36) =====
// Leaps at the rising sun thinking it a fruit (4.65.19); 300 yojanas, pushed back by its blaze, not dejected (4.65.20);
// Uttara: Vayu keeps him cool, reaches the sun (7.35.28-30); Rahu, then Airavata (7.35.32-44); Indra's thunderbolt,
// falls on the mountain, left jaw broken (4.65.21-22, 7.35.46-47); hence "Hanuman" (7.36.11). No swallowing anywhere.
// The jaw is shown only as a flash and a gentle fall: no injury detail.
function buildScenes() { BG.dawn = buildDawn(); BG.sky = buildSkyHigh(); BG.ms = buildManuscript(); }
const SUNHI = [800, 470];                                   // the sun high in the open sky
function skyHigh(ctx, cam, t, mid, drift = 1) {
  const bg = BG.sky; drawLayer(ctx, cam, bg.sky);
  if (mid) withCam(ctx, cam, 0.2, mid);
  drawLayer(ctx, Object.assign({}, cam, { x: (cam.x || 0) + ((t * 40 * drift) % 300) }), bg.cl);
  drawLayer(ctx, Object.assign({}, cam, { x: (cam.x || 0) + ((t * 90 * drift) % 400) }), bg.fg);
}
function dawn(ctx, cam, t, sunY, mid, sunX = 700) {
  const bg = BG.dawn; drawLayer(ctx, cam, bg.sky);
  if (sunY !== null) withCam(ctx, cam, 0.1, c => sunDisc(c, sunX, sunY, 70, t));
  drawLayer(ctx, cam, bg.far); drawLayer(ctx, cam, bg.mid);
  if (mid) withCam(ctx, cam, 0.6, mid);
  drawLayer(ctx, cam, bg.fg);
}
const PEAK_SEAT = [DAWN_PEAK[0] + 10, DAWN_PEAK[1] - 70];

const SHOTS = {
  // 1 — hook: the image we grew up with (the sun at the child's mouth), in memory gold, dissolving into embers
  1(ctx, u, p, sh, t, post) {
    const B1 = Math.max(1.6, sh.vStart - sh.start + sh.speech - 0.1), cam = { z: lerp(1.05, 1.12, p), y: 40 }, fade = ease(u, B1, B1 + 1.0);
    skyHigh(ctx, cam, t, c => {
      if (fade < 1) { c.save(); c.globalAlpha = 1 - fade;
        drawBabyHanuman(c, 470, 1000, 300, t, { pose: 'fly', smile: 0.2, mouthO: 1, rot: -0.15 });
        sunDisc(c, 640, 860, 70 * lerp(1, 0.85, p), t);
        c.restore(); }
      if (fade > 0) embers(c, t, 9, 30, 560, 1300, 500, 1 - fade);
    }, 0.3);
    ctx.fillStyle = rgba('#c89a5a', 0.18 * (1 - fade)); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => { (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.25, 0.55 + i * 0.25); if (q > 0) textFit(c, s, 540, 470 + i * 124 + (1 - q) * 22, { size: 108, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); }); };
  },
  2(ctx, u, p, sh, t, post) { sourceCard(ctx, u, p, sh, t, post, TL.source_card); },
  // 3 — Valmiki tells it twice; first, Jambavan tells it to Hanuman himself
  3(ctx, u, p, sh, t, post) {
    const cam = { z: lerp(1.0, 1.05, p), y: 30 }, st = sentenceStarts(sh, 2);
    dawn(ctx, cam, t, HORIZON + 40 - 30 * p, null);
    ctx.fillStyle = rgba('#05061a', 0.25); ctx.fillRect(0, 0, W, H);
    post.ui = c => {
      const q0 = ease(u, st[0] + 0.1, st[0] + 0.5); if (q0 > 0) text(c, 'TOLD TWICE', 540, 520 + (1 - q0) * 20, { size: 108, weight: 900, color: C_GOLD, ls: 8, alpha: q0, stroke: 10, shadow: 34 });
      const q1 = ease(u, st[1] - 0.05, st[1] + 0.35); if (q1 > 0) { text(c, '1 · KISHKINDHA KANDA', 540, 640, { size: 44, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 4, alpha: q1, stroke: 6, shadow: 20 }); text(c, 'JAMBAVAN TELLS HANUMAN', 540, 696, { size: 34, font: 'Montserrat', weight: 700, color: C_GOLD, ls: 4, alpha: q1, stroke: 5 }); }
    };
  },
  // 4 — little Hanuman sees the rising sun, takes it for a fruit, and leaps (4.65.19)
  4(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), leap = ease(u, st[1] + 0.2, st[1] + 1.6), cam = { z: lerp(1.25, 1.1, ease(u, st[1], st[1] + 1.5)), x: lerp(-180, 0, leap), y: lerp(260, 0, leap) };
    const sunY = HORIZON - 230 - 60 * p;
    dawn(ctx, cam, t, sunY, c => {
      const reach = ease(u, st[0] + 1.2, st[0] + 1.8), pose = leap > 0.02 ? 'fly' : reach > 0.5 ? 'reach' : 'sit';
      const bx = lerp(PEAK_SEAT[0], 470, easeIn(leap)), by = lerp(PEAK_SEAT[1], sunY + 120, leap) - Math.sin(leap * Math.PI) * 160;
      if (leap > 0) for (let i = 0; i < 12; i++) { const k = Math.max(0, leap - i * 0.03); dab(c, lerp(PEAK_SEAT[0], 470, easeIn(k)), lerp(PEAK_SEAT[1], sunY + 120, k) - Math.sin(k * Math.PI) * 160, 10 - i * 0.6, 10 - i * 0.6, 0, '#ffe0a0', 0.4 * (1 - i / 12)); }
      drawBabyHanuman(c, bx, by, 150, t, { pose, smile: 0.9, rot: pose === 'fly' ? -0.6 : 0, eye: blink(t, 3) });
    }, 470);
    post.ui = c => { const q = ease(u, st[0] + 1.0, st[0] + 1.4) * (1 - ease(u, st[1] - 0.2, st[1] + 0.2)); if (q > 0) text(c, 'A FRUIT?', 540, 330, { size: 100, weight: 900, color: C_GOLD, ls: 8, alpha: q, stroke: 10, shadow: 34 }); };
  },
  // 5 — three hundred yojanas; the sun's blaze pushes him back; he doesn't lose heart (4.65.20)
  5(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), cam = { z: 1.0, y: 0 }, push = ease(u, st[1], st[1] + 1.4), cheer = ease(u, st[1] + 2.0, st[1] + 2.6);
    skyHigh(ctx, cam, t, c => {
      sunDisc(c, SUNHI[0], SUNHI[1], 110, t); heatRings(c, SUNHI[0], SUNHI[1], 110, t, 0.3 + 0.7 * push);
      const fx = lerp(lerp(160, 520, ease(u, 0, st[1])), 300, push), fy = lerp(lerp(1150, 800, ease(u, 0, st[1])), 1000, push);
      drawBabyHanuman(c, fx, fy, 170, t, { pose: push > 0.1 && cheer < 0.5 ? 'fall' : 'fly', rot: push > 0.1 && cheer < 0.5 ? -0.5 - push * 0.8 : -0.45, smile: lerp(0.9, 0.2, push) + cheer, eye: push > 0.2 && cheer < 0.5 ? 0.6 : 1 });
    }, 2.2);
    post.ui = c => {
      const q = ease(u, st[0] + 0.1, st[0] + 0.5) * (1 - ease(u, st[1] - 0.3, st[1])); if (q > 0) { text(c, '300', 540, 470, { size: 150, weight: 900, color: C_GOLD, ls: 6, alpha: q, stroke: 12, shadow: 36 }); text(c, 'YOJANAS', 540, 560, { size: 56, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 10, alpha: q, stroke: 6, shadow: 20 }); }
    };
  },
  // 6 — Uttara Kanda: the Wind god keeps him cool; the sun doesn't burn him; he reaches the sun's chariot (7.35.28-30)
  6(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), near = ease(u, st[1], sh.dur), cam = { z: lerp(1.0, 1.35, near), x: lerp(0, 150, near), y: lerp(0, -220, near) };
    skyHigh(ctx, cam, t, c => {
      sunDisc(c, SUNHI[0], SUNHI[1], lerp(110, 150, near), t);
      const fx = lerp(220, SUNHI[0] - 230, near), fy = lerp(1050, SUNHI[1] + 150, near);
      windSwirl(c, fx, fy, 200, t, ease(u, 0.3, 1.0));
      drawBabyHanuman(c, fx, fy, 170, t, { pose: 'fly', rot: -0.4, smile: 1, eye: blink(t, 3) });
    }, 1.2);
    ctx.fillStyle = rgba('#7ab8e8', 0.08 * ease(u, 0.3, 1.0)); ctx.fillRect(0, 0, W, H);
    post.ui = c => {
      const q0 = ease(u, 0.1, 0.5) * (1 - ease(u, st[1] - 0.3, st[1])); if (q0 > 0) { text(c, 'UTTARA KANDA', 540, 470, { size: 84, weight: 900, color: C_GOLD, ls: 8, alpha: q0, stroke: 9, shadow: 30 }); text(c, 'VAYU, THE WIND GOD, KEEPS HIM COOL', 540, 545, { size: 34, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 3, alpha: q0, stroke: 5, shadow: 18 }); }
    };
  },
  // 7 — there he meets Rahu ... and then Indra's elephant Airavata: another fruit! (7.35.32-44)
  7(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), end = sh.vStart - sh.start + sh.speech, rahu = ease(u, 0.1, 0.8) * (1 - ease(u, st[0] + 1.6, st[0] + 2.2)), ele = ease(u, st[0] + 1.7, st[0] + 2.4);
    const cam = { z: 1.0, y: 0 };
    skyHigh(ctx, cam, t, c => {
      sunDisc(c, 900, 360, 90, t, 0.8);
      if (rahu > 0) drawRahu(c, lerp(1250, 760, rahu), 760, 260, t, rahu);
      if (ele > 0) { const ex = lerp(1300, 820, ele); drawAiravata(c, ex, 1300, 230, t, -1); drawFigure(c, CH.indra, P({ sit: 1, handN: 'hold', aN: [0.2, -0.05], aF: [0.2, 0.05], handF: 'fist', eye: blink(t, 5), brow: 0.5, gaze: [-0.6, 0] }), { x: ex + 10, y: 1300 - 230 * 1.05, s: 300, face: -1 }, { rim: '#ffe0a0', rimA: 0.6, dir: -1 }); }
      const tgt = ele > 0.5 ? [560, 1080] : [500, 860], k = ease(u, 0.6, 1.4);
      drawBabyHanuman(c, lerp(200, tgt[0], k), lerp(1100, tgt[1], k), 160, t, { pose: 'reach', rot: 0.5, smile: 1, eye: 1 });
    }, 0.6);
    post.ui = c => {
      if (rahu > 0.2) text(c, 'RAHU', 540, 470, { size: 96, weight: 900, color: C_IVORY, ls: 10, alpha: rahu, stroke: 9, shadow: 30 });
      const q = ease(u, st[0] + 2.2, st[0] + 2.6); if (q > 0) { text(c, 'AIRAVATA', 540, 470, { size: 96, weight: 900, color: C_GOLD, ls: 10, alpha: q, stroke: 9, shadow: 30 }); text(c, "INDRA'S ELEPHANT", 540, 542, { size: 40, font: 'Montserrat', weight: 800, color: C_IVORY, ls: 8, alpha: q, stroke: 6, shadow: 20 }); }
    };
  },
  // 8 — Indra hurls the thunderbolt; the child falls on a mountain; his left jaw breaks (4.65.21-22; 7.35.46-47)
  8(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), k = ease(u, 0.3, 0.7), hit = ease(u, 0.7, 0.8) * (1 - ease(u, 0.8, 1.8));
    post.flash = 0.6 * hit; post.flashCol = '#e6f0ff';
    if (u < st[1]) {
      const fall = ease(u, 0.8, st[1]);
      skyHigh(ctx, { z: 1.0, y: 0 }, t, c => {
        sunDisc(c, 900, 360, 90, t, 0.8);
        vajra(c, 1100, -60, 520, 860, k, t);
        drawBabyHanuman(c, lerp(520, 420, fall), lerp(880, 1700, easeIn(fall)), 160, t, { pose: u > 0.75 ? 'fall' : 'reach', rot: u > 0.75 ? 1.2 + fall * 3 : 0.5, eye: u > 0.75 ? 0 : 1, smile: 0.3 });
      }, 0.4);
    } else {
      const v = u - st[1], cam = { z: lerp(1.5, 1.6, p), x: -230, y: 300 };
      dawn(ctx, cam, t, HORIZON - 160, c => {
        drawBabyHanuman(c, PEAK_SEAT[0] + 20, PEAK_SEAT[1] + 40, 140, t, { pose: 'sit', rot: -1.45, eye: 0, smile: 0, glow: 0.4 + 0.2 * Math.sin(t * 2) });
        glow(c, PEAK_SEAT[0] + 20, PEAK_SEAT[1] + 20, 160, '#ffe0c0', 0.25 * ease(v, 0, 0.6));
      });
      ctx.fillStyle = rgba('#0a0a24', 0.25); ctx.fillRect(0, 0, W, H);
    }
    post.ui = c => { const q = ease(u, 0.3, 0.7) * (1 - ease(u, st[1] - 0.3, st[1])); if (q > 0) text(c, 'VAJRA', 540, 470, { size: 100, weight: 900, color: '#cfe0ff', ls: 12, alpha: q, stroke: 10, shadow: 34 }); };
  },
  // 9 — HANU = JAW. HANUMAN. (4.65.22; 7.36.11): the child sits up, blessed, glowing
  9(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), cam = { z: lerp(1.4, 1.48, p), x: -200, y: 260 };
    dawn(ctx, cam, t, HORIZON - 200, c => drawBabyHanuman(c, PEAK_SEAT[0], PEAK_SEAT[1], 150, t, { pose: 'sit', smile: 1, eye: blink(t, 4), glow: 0.5 + 0.5 * ease(u, st[1], st[1] + 0.8) }));
    ctx.fillStyle = rgba('#05061a', 0.3); ctx.fillRect(0, 0, W, H);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, st[i] - 0.05, st[i] + 0.3); if (q > 0) textFit(c, s, 540, 470 + i * 140 + (1 - q) * 22, { size: i ? 120 : 96, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 32 }); });
  },
  // 10 — SWALLOWED THE SUN? NOT IN VALMIKI.
  10(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2);
    skyHigh(ctx, { z: lerp(1.0, 1.05, p), y: 0 }, t, c => sunDisc(c, 540, 1000, 120, t), 0.3);
    ctx.fillStyle = rgba('#05061a', 0.35); ctx.fillRect(0, 0, W, H);
    post.ui = c => {
      const q0 = ease(u, st[0] - 0.05, st[0] + 0.3); if (q0 > 0) textFit(c, sh.card[0][0], 540, 520, { size: 92, weight: 900, color: C_IVORY, ls: 4, alpha: q0, stroke: 9, shadow: 28 });
      const q1 = ease(u, st[1] + 0.5, st[1] + 0.8); if (q1 > 0) { text(c, sh.card[1][0], 540, 650 + (1 - q1) * 20, { size: 92, weight: 900, color: C_GOLD, ls: 5, alpha: q1, stroke: 10, shadow: 32 }); const w = 330 * easeOut(map(u, st[1] + 0.5, st[1] + 0.85)); c.fillStyle = rgba(C_RED, 0.9); c.fillRect(540 - w, 508, w * 2, 8); }
    };
  },
  // 11 — that beautiful line is from the Hanuman Chalisa, sung with devotion
  11(ctx, u, p, sh, t, post) { sourceCard(ctx, u, p, sh, t, post, { title: ['HANUMAN', 'CHALISA'], sub: 'VERSE 18  ·  A HYMN OF DEVOTION', edition: 'NOT PART OF VALMIKI' }); },
  12(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
