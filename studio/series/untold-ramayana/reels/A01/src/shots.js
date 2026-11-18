// ===== Reel A01 — "There Was No Lakshmana Rekha" — 18 shots (helpers live in series art/templates.js) =====
function buildScenes() {
  BG.hook = buildHook(); BG.herD = buildHermitage('dusk'); BG.herN = buildHermitage('night'); BG.herE = buildHermitage('end'); BG.forest = buildForest(); BG.doorD = buildDoorway('dusk'); BG.doorN = buildDoorway('night'); BG.ms = buildManuscript();
}

const SHOTS = {
  // 1 — hook: a glowing line draws itself, cracks and shatters
  1(ctx, u, p, sh, t, post) {
    const B1 = Math.max(1.25, sh.vStart - sh.start + sh.speech - 0.05), bg = BG.hook, cam = { z: lerp(1.0, 1.07, p), y: lerp(0, 20, p) + (u > B1 && u < B1 + 0.35 ? Math.sin(u * 90) * 9 * (B1 + 0.35 - u) * 3 : 0) };
    drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.mid);
    withCam(ctx, cam, 0.9, c => {
      const LY = x => 1300 + Math.sin((x - 60) / 960 * Math.PI) * 26, dp = ease(u, 0.12, Math.min(B1 - 0.2, 1.6)), sp = map(u, B1, B1 + 1.2);
      if (sp <= 0) {
        const x1 = 60 + 960 * dp; c.lineCap = 'round';
        [[70, 0.10, '#ffb43a'], [34, 0.25, '#ffcf5a'], [15, 0.6, '#ffe28a'], [6, 1, '#fff6cf']].forEach(([w, a, col]) => { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); for (let x = 60; x <= x1; x += 12) x === 60 ? c.moveTo(x, LY(x)) : c.lineTo(x, LY(x)); c.stroke(); }); c.globalAlpha = 1;
        if (dp < 1) { glow(c, x1, LY(x1), 150, '#ffe9a0', 0.9); for (let i = 0; i < 14; i++) { const a = hash(i + Math.floor(u * 24)) * TAU, d = 20 + hash(i * 3 + Math.floor(u * 24)) * 70; dab(c, x1 + Math.cos(a) * d, LY(x1) + Math.sin(a) * d * 0.6, 4, 4, 0, '#fff2b0', 0.9); } }
        else glow(c, 540, 1310, 520, '#ffcf5a', 0.12 + 0.05 * Math.sin(u * 14));
      } else {
        for (let i = 0; i < 30; i++) {
          const h1 = hash(i * 2.3), h2 = hash(i * 5.1), x0 = 60 + i * 32, vx = (h1 - 0.5) * 520, vy = -260 - h2 * 520, tt = sp * 1.2, x = x0 + vx * tt, y = LY(x0) + vy * tt + 900 * tt * tt, a = (1 - sp) * 1, ang = (h1 - 0.5) * 9 * tt;
          c.save(); c.translate(x + 16, y); c.rotate(ang); stroke(c, -18, 0, 18, 0, 22, '#ffb43a', 0.3 * a); stroke(c, -16, 0, 16, 0, 7, '#fff2c0', a); c.restore();
        }
        for (let i = 0; i < 70; i++) { const h1 = hash(i * 7.7), h2 = hash(i * 3.3), a0 = h1 * TAU, d = sp * (200 + h2 * 700), x = 60 + h2 * 960 + Math.cos(a0) * d * 0.5, y = 1300 - Math.abs(Math.sin(a0)) * d + 500 * sp * sp; dab(c, x, y, 3 + h1 * 4, 3 + h1 * 4, 0, h1 < 0.5 ? '#fff2b0' : '#ff9a3a', (1 - sp) * 0.95); }
        glow(c, 540, 1300, 700, '#ffd070', 0.5 * (1 - map(sp, 0, 0.3)));
        // cracked scar left on the ground
        for (let i = 0; i < 14; i++) { const x0 = 80 + i * 68; stroke(c, x0, LY(x0), x0 + 30 + hash(i) * 26, LY(x0) + (hash(i * 3) - 0.5) * 22, 4, '#1a1026', 0.6 * map(sp, 0, 0.3)); }
      }
    });
    drawLayer(ctx, cam, bg.fg);
    if (u > B1 && u < B1 + 0.17) { post.flash = (1 - map(u, B1, B1 + 0.17)) * 0.75; post.flashCol = '#fff0c8'; }
    post.ui = c => {
      const a = ease(u, 0.05, 0.4), s = lerp(1.25, 1, easeOut(map(u, 0.05, 0.45)));
      c.save(); c.translate(540, 640); c.scale(s, s);
      text(c, 'LAKSHMANA', 0, 0, { size: 118, weight: 900, color: C_IVORY, ls: 3, alpha: a, stroke: 10, shadow: 30 });
      text(c, 'REKHA', -38, 128, { size: 118, weight: 900, color: C_IVORY, ls: 3, alpha: a, stroke: 10, shadow: 30 }); text(c, '?', 250, 128, { size: 128, weight: 900, color: C_GOLD, alpha: a, stroke: 10, shadow: 30 });
      c.restore();
      if (u > B1) { const k = map(u, B1, B1 + 0.2), sc = lerp(2.6, 1, easeOut(k)); c.save(); c.translate(540, 960); c.rotate(-0.13); c.scale(sc, sc); c.globalAlpha = Math.min(1, k * 2.5);
        c.fillStyle = 'rgba(20,4,8,0.55)'; c.fillRect(-338, -66, 676, 132); c.strokeStyle = C_RED; c.lineWidth = 11; c.strokeRect(-330, -58, 660, 116); c.lineWidth = 3; c.strokeRect(-314, -43, 628, 86);
        text(c, 'NOT IN VALMIKI', 0, 25, { size: 66, weight: 900, color: C_RED, ls: 4, shadow: 0 }); c.restore(); }
    };
  },
  // 2 — source card (series template)
  2(ctx, u, p, sh, t, post) { sourceCard(ctx, u, p, sh, t, post, { title: ['VALMIKI', 'RAMAYANA'], sub: 'ARANYA KANDA  ·  CHAPTERS 42–47', edition: 'CRITICAL EDITION' }); },
  // 3 — the golden deer lures Rama into the forest
  3(ctx, u, p, sh, t, post) {
    const bg = BG.forest, cam = { x: lerp(-60, 90, p), z: 1.05 };
    drawLayer(ctx, cam, bg.back); drawLayer(ctx, cam, bg.l1); drawLayer(ctx, cam, bg.l2);
    withCam(ctx, cam, 0.6, c => {
      mist(c, t, 5, 6, [-200, 1050, 1500, 240], '#d6a8dc', 0.22, 26);
      const dx = lerp(210, 1340, Math.pow(p, 0.9)), ph = u * 8.5, lift = Math.max(0, Math.sin(ph)) * 120;
      for (let i = 1; i < 16; i++) { const q = dx - i * 34, l2 = Math.max(0, Math.sin(ph - i * 0.33)) * 120; dab(c, q + hash(i) * 20, 1090 - l2 + hash(i * 3) * 60, 5, 5, 0, '#ffe9a0', (1 - i / 16) * 0.8 * (0.5 + 0.5 * Math.sin(t * 20 + i))); glow(c, q, 1100 - l2, 60, '#ffd870', 0.1 * (1 - i / 16)); }
      drawDeer(c, dx, 1235, 215, ph, lift, 1);
    });
    drawLayer(ctx, cam, bg.l3);
    withCam(ctx, cam, 0.9, c => {
      const ph = u * 11.5, rx = lerp(-190, 560, p), bob = Math.abs(Math.sin(ph)) * 0.02;
      drawFigure(c, CH.rama, Object.assign(runPose(ph, { bow: 'F', bowAng: 0.35, brow: -0.35, eye: 1.05, smile: 0, gaze: [0.6, 0], dy: -bob }), {}), { x: rx, y: 1432, s: 570, face: 1 }, L_FOREST);
      mist(c, t, 9, 4, [-200, 1380, 1500, 200], '#8a6ab8', 0.16, 40);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 4 — the arrow strikes Maricha; he staggers and falls to his knees
  4(ctx, u, p, sh, t, post) {
    const HIT = 0.62, bg = BG.forest, shake = u > HIT && u < HIT + 0.4 ? (1 - map(u, HIT, HIT + 0.4)) * 14 : 0, cam = { x: 150 + Math.sin(u * 80) * shake, y: Math.cos(u * 70) * shake, z: lerp(1.1, 1.18, p) };
    drawLayer(ctx, cam, bg.back); drawLayer(ctx, cam, bg.l1); drawLayer(ctx, cam, bg.l2); withCam(ctx, cam, 0.6, c => mist(c, t, 5, 6, [-200, 1050, 1500, 240], '#d6a8dc', 0.2, 20)); drawLayer(ctx, cam, bg.l3);
    withCam(ctx, cam, 0.9, c => {
      const a0 = P({ lean: 0.04, head: -0.05, brow: -0.9, eye: 1.1, smile: -0.6, mouth: 0.2, aN: [-0.1, 0.33], aF: [0.14, 0.3], lN: [0.16, 0.05], lF: [-0.18, 0.05], gaze: [0.6, 0] });
      const a1 = P({ lean: -0.26, head: -0.3, brow: 0.6, eye: 1.3, smile: -0.8, mouth: 0.95, aN: [-0.22, -0.08], aF: [0.26, 0.02], lN: [0.28, 0.25], lF: [-0.3, 0.1], elN: -1, gaze: [0, -0.5] });
      const a2 = P({ lean: 0.3, head: 0.42, brow: 0.9, eye: 0.35, smile: -0.8, mouth: 0.45, aN: [0.1, 0.11], aF: [0.2, 0.36], lN: [0.32, 1.8], lF: [0.12, 1.66], gaze: [0, 0.6] });
      let pose = u < HIT ? a0 : u < HIT + 0.95 ? lerpPose(a0, a1, easeOut(map(u, HIT, HIT + 0.22))) : lerpPose(a1, a2, sm(map(u, HIT + 0.95, HIT + 2.0)));
      if (u > HIT && u < HIT + 0.95) pose.lean += Math.sin((u - HIT) * 9) * 0.05;
      const F = drawFigure(c, CH.maricha, pose, { x: 650, y: 1452, s: 780, face: -1 }, L_FOREST);
      const chest = [lerp(F.N[0], F.hip[0], 0.3) - 30, lerp(F.N[1], F.hip[1], 0.3)];
      if (u < HIT) { const k = map(u, 0.38, HIT), ax = lerp(-260, chest[0], k), ay = lerp(chest[1] - 60, chest[1], k); if (k > 0) { for (let i = 0; i < 9; i++) stroke(c, ax - 60 - i * 34, ay - (i * 2), ax - 90 - i * 34, ay - (i * 2), 10 - i, '#fff0c0', 0.5 * (1 - i / 9)); arrow(c, ax - 190, ay - 8, ax, ay); } }
      else { arrow(c, chest[0] - 150, chest[1] - 22, chest[0] + 8, chest[1]); const k = map(u, HIT, HIT + 0.5); if (k < 1) { glow(c, chest[0], chest[1], 120 + k * 420, '#fff0c8', (1 - k) * 0.9); for (let i = 0; i < 3; i++) { c.globalAlpha = (1 - k) * 0.8; c.strokeStyle = '#ffe9c0'; c.lineWidth = 8 * (1 - k) + 2; c.beginPath(); c.arc(chest[0], chest[1], 40 + k * (240 + i * 130), 0, TAU); c.stroke(); } c.globalAlpha = 1; } }
      mist(c, t, 9, 4, [-200, 1400, 1500, 200], '#8a6ab8', 0.16, 30);
    });
    drawLayer(ctx, cam, bg.fg);
    if (u > HIT && u < HIT + 0.2) { post.flash = (1 - map(u, HIT, HIT + 0.2)) * 0.8; post.flashCol = '#fff2d8'; }
  },
  // 5 — close on Maricha: "Ha Sita! Ha Lakshmana!" (lip-synced, echo rings)
  5(ctx, u, p, sh, t, post) {
    const bg = BG.forest, cam = { x: 120, y: -160, z: lerp(1.5, 1.62, p) }, m = mouthEnv(sh, u), lead = sh.vStart - sh.start;
    drawLayer(ctx, cam, bg.back); drawLayer(ctx, cam, bg.l1); drawLayer(ctx, cam, bg.l2); drawLayer(ctx, cam, bg.l3);
    ctx.fillStyle = 'rgba(10,6,34,0.35)'; ctx.fillRect(0, 0, W, H);
    const up = ease(u, 0.0, lead + 0.15), pose = P({ lean: lerp(0.3, 0.02, up), head: lerp(0.42, -0.5, up) - m * 0.06, brow: 0.9, browUp: 1, eye: lerp(0.35, 0.9, up) - m * 0.3, smile: -0.8, mouth: 0.12 + m * 1.05, aN: lerp(0.1, 0.02, up) > 0 ? [0.1, 0.11] : [0.1, 0.11], aF: [lerp(0.2, 0.3, up), lerp(0.36, -0.12, up)], lN: [0.32, 1.8], lF: [0.12, 1.66], gaze: [0.2, -0.7], handF: 'relaxed' });
    const zs = lerp(1500, 1580, p), F = drawFigure(ctx, CH.maricha, pose, { x: 430 + Math.sin(t * 31) * m * 4, y: 1830, s: zs, face: 1 }, Object.assign({}, L_FOREST, { shadow: 0 }));
    const chest = [lerp(F.N[0], F.hip[0], 0.32) + 60, lerp(F.N[1], F.hip[1], 0.32)]; arrow(ctx, chest[0] + 330, chest[1] - 60, chest[0], chest[1]);
    const mo = [F.HC[0] + 110, F.HC[1] - 30]; if (u > lead) ringEcho(ctx, mo[0], mo[1], u - lead, clamp(m * 1.6 + 0.25) * (1 - map(u, lead + sh.speech, sh.dur)));
    mist(ctx, t, 9, 4, [-200, 1500, 1500, 300], '#8a6ab8', 0.2, 40);
  },
  // 6 — Sita turns to Lakshmana: "Go! Save your brother!"
  6(ctx, u, p, sh, t, post) {
    const bg = BG.herD, cam = { z: lerp(1.1, 1.16, p), x: -30, y: 60 }, m = mouthEnv(sh, u), lead = sh.vStart - sh.start;
    hermitage(ctx, bg, cam, t);
    withCam(ctx, cam, 0.9, c => {
      const turn = ease(u, 0.02, 0.3), g = ease(u, 0.18, lead + 0.25);
      const s0 = P({ aN: [-0.03, 0.2], aF: [0.06, 0.24], brow: 0.5, browUp: 1, eye: 1.2, smile: -0.3, gaze: [0.5, 0] });
      const s1 = P({ lean: 0.1, aN: [-0.29, -0.03], elN: -1, handN: 'point', aF: [0.25, 0.1], brow: 0.8, browUp: 1, eye: 1.2, smile: -0.4, gaze: [0.6, 0], head: -0.04 });
      const sp = lerpPose(s0, s1, g); sp.mouth = m; sp.head += Math.sin(u * 13) * 0.02 * (m > 0.1 ? 1 : 0); sp.aF = [sp.aF[0] + Math.sin(u * 9) * 0.012, sp.aF[1] + Math.sin(u * 11) * 0.012];
      drawFigure(c, CH.sita, sp, { x: 330, y: 1392, s: 565, face: lerp(-1, 1, turn) }, L_DUSK);
      drawFigure(c, CH.lak, P({ bow: 'B', head: 0.06, brow: 0.35, eye: blink(t, 2), smile: -0.2, gaze: [0.5, 0], lean: 0.03 }), { x: 770, y: 1398, s: 600, face: -1 }, L_DUSK);
      leaves(c, t * 0.5, 4, 5);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 7 — but Lakshmana won't go
  7(ctx, u, p, sh, t, post) {
    const bg = BG.herD, cam = { z: lerp(1.2, 1.26, p), x: 70, y: 80 };
    hermitage(ctx, bg, cam, t);
    withCam(ctx, cam, 0.9, c => {
      drawFigure(c, CH.sita, P({ aN: [0.03, 0.2], aF: [0.1, 0.16], brow: lerp(0.6, 0.9, ease(u, 1.2, 2.2)), browUp: 1, eye: 1.2 * blink(t, 5), smile: -0.5, mouth: 0.04, gaze: [0.6, 0], lean: lerp(0.08, -0.02, ease(u, 0.3, 0.9)) }), { x: 330, y: 1392, s: 565, face: 1 }, L_DUSK);
      const m = mouthEnv(sh, u), g = easeOut(map(u, 0.1, 0.55)), shk = Math.sin(u * 7) * (u > 0.3 ? 1 : 0) * Math.max(0, 1 - map(u, 0.9, 1.4)) * 0.6;
      drawFigure(c, CH.lak, lerpPose(P({ bow: 'B', head: 0.06, brow: 0.35, smile: -0.2 }), P({ bow: 'B', aN: [lerp(0.2, 0.12, ease(u, 1.6, 2.4)), lerp(-0.01, 0.12, ease(u, 1.6, 2.4))], handN: 'palm', head: 0.06 + shk * 0.05 - m * 0.03, brow: 0.45, eye: 0.85 * blink(t, 2), smile: -0.2, mouth: m * 0.85, gaze: [0.4 + shk * 0.4, 0.1], lean: 0.0 }), g), { x: 770 + shk * 3, y: 1398, s: 600, face: -1 }, L_DUSK);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 8 — close-up: Sita, hurt then angry, doubts his intentions
  8(ctx, u, p, sh, t, post) {
    const bg = BG.herD, cam = { z: lerp(1.9, 2.0, p), x: -170, y: -120 };
    hermitage(ctx, bg, cam, t); ctx.fillStyle = 'rgba(12,8,40,0.3)'; ctx.fillRect(0, 0, W, H);
    const L8 = sh.vStart - sh.start, k = ease(u, L8 - 0.25, L8 + 0.4), pt = ease(u, L8 + 0.2, L8 + 0.75);
    const hurt = P({ brow: 1, browUp: 1, eye: 1.05, smile: -0.7, mouth: 0.1, tear: 0.3, gaze: [0.5, 0.1], aN: [0.02, 0.2], aF: [0.08, 0.18], head: 0.05 });
    const angry = P({ brow: -1, eye: 0.92, smile: -0.9, mouth: 0.22, tear: 1, gaze: [0.7, 0], aN: [0.27, 0.02], handN: 'point', aF: [0.06, 0.22], head: -0.06, lean: 0.07 });
    const ps = lerpPose(hurt, angry, k); ps.mouth = Math.max(0.04, mouthEnv(sh, u)); ps.aN = [lerp(0.02, 0.27, pt) + (pt >= 1 ? Math.sin(u * 16) * 0.006 : 0), lerp(0.2, 0.02, pt)]; ps.handN = pt > 0.4 ? 'point' : 'relaxed'; ps.tear = lerp(0.2, 1, ease(u, 0.3, 2.4)); ps.eye *= blink(t, 5);
    drawFigure(ctx, CH.sita, ps, { x: 420 + lerp(0, 30, k), y: 2590, s: lerp(1900, 1980, p), face: 1 }, Object.assign({}, L_DUSK, { shadow: 0 }));
  },
  // 9 — hurt, Lakshmana says only:
  9(ctx, u, p, sh, t, post) {
    const bg = BG.herD, cam = { z: lerp(1.12, 1.17, p), x: 20, y: 60 };
    hermitage(ctx, bg, cam, t);
    withCam(ctx, cam, 0.9, c => {
      const away = ease(u, 0.25, 0.6);
      drawFigure(c, CH.sita, P({ aN: [0.05, 0.19], aF: [0.07, 0.2], brow: 0.2, eye: lerp(0.95, 0.5, away), smile: -0.7, head: lerp(-0.03, 0.14, away), tear: 0.8, gaze: [0.3, 0.5] }), { x: 330, y: 1392, s: 565, face: lerp(1, -1, away) }, L_DUSK);
      const g = ease(u, 0.2, 1.0);
      drawFigure(c, CH.lak, lerpPose(P({ bow: 'B', aN: [0.16, 0.02], handN: 'relaxed', brow: 0.5, smile: -0.3 }), P({ bow: 'B', aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', head: 0.26, brow: 0.8, eye: 0.32, smile: -0.35, gaze: [0, 0.8], lean: 0.08 }), g), { x: 770, y: 1398, s: 600, face: -1 }, L_DUSK);
      leaves(c, t * 0.5, 4, 4);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 10 — Lakshmana: "May the gods of the forest protect you."
  10(ctx, u, p, sh, t, post) {
    const bg = BG.herD, cam = { z: lerp(1.75, 1.84, p), x: 220, y: -40 }, m = mouthEnv(sh, u);
    hermitage(ctx, bg, cam, t); ctx.fillStyle = 'rgba(12,8,40,0.28)'; ctx.fillRect(0, 0, W, H);
    drawFigure(ctx, CH.lak, P({ bow: 'B', aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', head: 0.2 - m * 0.03, brow: 0.85, browUp: 0.4, eye: 0.42 * blink(t, 1), smile: -0.25, mouth: m * 0.8, gaze: [0, 0.8], lean: 0.07 }), { x: 600, y: 2080, s: lerp(1260, 1300, p), face: -1 }, Object.assign({}, L_DUSK, { shadow: 0 }));
  },
  // 11 — he turns and walks away; Sita lowers her head (no narration)
  11(ctx, u, p, sh, t, post) {
    const bg = BG.herD, cam = { z: lerp(1.06, 1.0, p), x: 0, y: 30 };
    hermitage(ctx, bg, cam, t);
    withCam(ctx, cam, 0.9, c => {
      drawFigure(c, CH.sita, P({ aN: [0.05, 0.19], aF: [0.07, 0.2], brow: 0.6, eye: 0.3, smile: -0.7, head: lerp(0.14, 0.34, ease(u, 0.1, 1.2)), tear: 1, gaze: [0, 0.8] }), { x: 330, y: 1392, s: 565, face: -1 }, L_DUSK);
      const T0 = 0.95, turn = ease(u, T0, T0 + 0.32), w = map(u, T0 + 0.28, T0 + 0.5), om = 4.6, tw = Math.max(0, u - T0 - 0.3), S = 600, ph = tw * om, x = 770 + (0.39 * S / Math.PI) * om * tw * 0.98;
      const bowP = P({ bow: 'B', aN: [0.115, 0.1], aF: [0.115, 0.1], handN: 'namaste', handF: 'none', head: 0.12 + 0.2 * Math.sin(Math.PI * ease(u, 0.1, 0.85)), lean: 0.04 + 0.12 * Math.sin(Math.PI * ease(u, 0.1, 0.85)), brow: 0.7, eye: 0.4, smile: -0.3 });
      const pose = lerpPose(u < T0 ? bowP : P({ bow: 'B', head: 0.22, brow: 0.7, eye: 0.5, smile: -0.3 }), walkPose(ph, 0.4, { bow: 'B', head: 0.16, brow: 0.6, eye: 0.6, smile: -0.3, lean: 0.06 }), w);
      drawFigure(c, CH.lak, pose, { x, y: 1398, s: S, face: lerp(-1, 1, turn) }, L_DUSK);
      leaves(c, t * 0.6, 4, 6);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 12 — the empty doorway: no line, no spell, just a prayer
  12(ctx, u, p, sh, t, post) {
    const bg = BG.doorD, cam = { z: lerp(1.0, 1.07, p), y: lerp(-10, 14, p) };
    drawLayer(ctx, cam, bg.sky); ctx.fillStyle = rgba('#0a0a30', 0.3 * p); ctx.fillRect(0, 0, W, H);
    drawLayer(ctx, cam, bg.hut); withCam(ctx, cam, 0.8, c => { thatchFringe(c, t, bg, 1.2); leaves(c, t * 0.7, 21, 5, '#3a4a6a'); });
    drawLayer(ctx, cam, bg.fg); ctx.fillStyle = rgba('#080826', 0.12 + 0.2 * p); ctx.fillRect(0, 0, W, H);
    const st = sentenceStarts(sh, 3);
    post.ui = c => {
      [['NO LINE.', 800, C_IVORY], ['NO SPELL.', 912, C_IVORY], ['JUST A PRAYER.', 1036, C_GOLD]].forEach(([s, y, col], i) => { const a = ease(u, st[i] - 0.05, st[i] + 0.3); if (a > 0) text(c, s, 550, y + (1 - a) * 22, { size: i === 2 ? 80 : 84, weight: 900, color: col, ls: 5, alpha: a, stroke: 9, shadow: 30 }); });
    };
  },
  // 13 — Ravana arrives, disguised as a monk
  13(ctx, u, p, sh, t, post) {
    const bg = BG.herN, cam = { z: lerp(1.08, 1.16, p), x: lerp(-60, -10, p), y: 50 };
    hermitage(ctx, bg, cam, t, c => { drawFigure(c, CH.sita, P({ aN: [0.03, 0.22], aF: [0.07, 0.22], eye: blink(t, 3), smile: 0.1, gaze: [0.6, 0], head: -0.03 }), { x: 705, y: 1225, s: 300, face: -1 }, { rim: '#ffc070', rimA: 0.9, dir: 1, tint: '#30143a', tintA: 0.3, shadow: 0.4 }); });
    withCam(ctx, cam, 0.9, c => {
      const S = 650, om = 3.3, ph = u * om + 0.6, x = -150 + (0.39 * S / Math.PI) * om * u * 0.95;
      const pose = walkPose(ph, 0.4, { umbrella: 1, staff: 1, brow: -0.55, eye: 0.62 * blink(t, 4), smile: 0.75, gaze: [0.8, 0], lean: 0.05, handN: 'hold', handF: 'hold' });
      pose.aF = [0.13, 0.1 + Math.sin(ph * 2) * 0.006]; pose.aN = [0.17 + Math.sin(ph) * 0.03, 0.17];
      drawFigure(c, CH.monk, pose, { x, y: 1416, s: S, face: 1 }, L_NIGHT);
      fireflies(c, t, 3, 8, [80, 900, 900, 500], 0.8);
    });
    drawLayer(ctx, cam, bg.fg);
  },
  // 14 — eerie stillness: trees freeze, wind stops, the Godavari slows
  14(ctx, u, p, sh, t, post) {
    const bg = BG.herN, cam = { z: lerp(1.0, 1.04, p), y: 10 }, q = map(u, 0.15, 1.25), tau = u < 0.15 ? u : 0.15 + (q - q * q * q + q * q * q * q / 2) * 1.1, still = sm(q);
    hermitage(ctx, bg, cam, t, c => { drawFigure(c, CH.sita, P({ aN: [0.03, 0.22], aF: [0.07, 0.22], eye: 1, smile: 0.1, gaze: [0.6, 0] }), { x: 705, y: 1225, s: 300, face: -1 }, { rim: '#ffc070', rimA: 0.9, dir: 1, tint: '#30143a', tintA: 0.3, shadow: 0.4 }); }, 1, 20 + tau * 3);
    withCam(ctx, cam, 0.9, c => {
      drawFigure(c, CH.monk, P({ umbrella: 1, staff: 1, brow: -0.6, eye: 0.6, smile: 0.8, gaze: [0.8, 0], aF: [0.13, 0.1], aN: [0.17, 0.17], handN: 'hold', handF: 'hold', lN: [0.12, 0.03], lF: [-0.12, 0.03] }), { x: 330, y: 1416, s: 650, face: 1 }, L_NIGHT);
      leaves(c, 3 + tau * 2.2, 31, 26, '#3a6a70');
    });
    drawLayer(ctx, cam, bg.fg);
    post.sat = lerp(1, 0.22, still); ctx.fillStyle = rgba('#0a0c22', 0.2 * still); ctx.fillRect(0, 0, W, H);
    const st = sentenceStarts(sh, 3);
    post.ui = c => { [['THE TREES FROZE', 330], ['THE WIND STOPPED', 420], ['THE GODAVARI SLOWED', 510]].forEach(([s, y], i) => { const a = ease(u, st[i], st[i] + 0.35); if (a > 0) text(c, s, 540, y, { size: 62, weight: 800, color: i === 2 ? C_GOLD : C_IVORY, ls: lerp(18, 6, a), alpha: a, stroke: 8, shadow: 26 }); }); };
  },
  // 15 — Sita offers the guest a seat and food
  15(ctx, u, p, sh, t, post) {
    const bg = BG.doorN, cam = { z: lerp(1.03, 1.1, p), y: 20 };
    drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.hut);
    withCam(ctx, cam, 0.8, c => {
      thatchFringe(c, t, bg, 0.25); stroke(c, 612, 1262, 612, 1176, 8, '#6a4a24'); dab(c, 612, 1174, 26, 9, 0, '#b8862e'); flame(c, 612, 1168, 15, t, 7);
      // parasol leaning on the jamb + staff on the ground
      stroke(c, 800, 1300, 842, 900, 9, '#4a3a30'); poly(c, [[842, 900], [812, 1010], [836, 1150], [866, 1012]], '#75685a'); stroke(c, 760, 1436, 1010, 1404, 10, '#5a4030'); dab(c, 1004, 1392, 22, 23, 0, '#b8862e');
      const give = ease(u, 0.3, 1.4);
      drawFigure(c, CH.monk, P({ sit: 1, lean: 0.03, head: lerp(0.0, 0.1, ease(u, 1.3, 2.0)) - lerp(0, 0.1, ease(u, 2.2, 2.8)), brow: -0.5, eye: 0.6 * blink(t, 4), smile: 0.8, gaze: [0.8, -0.2], aN: [0.16, 0.24], aF: [lerp(0.12, 0.22, give), lerp(0.24, 0.15, give)], handN: 'relaxed' }), { x: 650, y: 1412, s: 640, face: -1 }, { rim: '#ffc070', rimA: 0.9, dir: -1, tint: '#40182c', tintA: 0.16 });
      drawFigure(c, CH.sita, P({ lean: lerp(0.02, 0.13, give), head: lerp(0, 0.08, give), aN: [lerp(0.06, 0.22, give), lerp(0.2, 0.13, give)], aF: [lerp(0.08, 0.2, give), lerp(0.2, 0.15, give)], pot: 1, handN: 'hold', eye: blink(t, 3), smile: 0.6, gaze: [0.6, 0.3] }), { x: 285, y: 1392, s: 600, face: 1 }, L_LAMP);
      const gl = ease(u, sh.dur - 1.0, sh.dur - 0.2); if (gl > 0) glow(c, 610, 842, 60, '#ff2a10', 0.5 * gl);
    });
    drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = rgba('#f4a03a', 0.03 + 0.02 * noise1(t * 8)); ctx.fillRect(0, 0, W, H);
  },
  // 16 — fire and smoke: the true form, ten-headed Ravana
  16(ctx, u, p, sh, t, post) {
    const B = sh.sent && sh.sent[1] ? clamp(sh.vStart - sh.start + sh.sent[1] - 0.22, 0.7, 2.8) : 0.85, bg = BG.doorN, shake = u > B && u < B + 0.6 ? (1 - map(u, B, B + 0.6)) * 18 : 0, cam = { z: lerp(1.0, 1.1, p), x: Math.sin(u * 85) * shake, y: 10 + Math.cos(u * 75) * shake };
    drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.hut); withCam(ctx, cam, 0.8, c => thatchFringe(c, t, bg, 1.6));
    const dark = ease(u, 0.2, 1.3); ctx.fillStyle = rgba('#1c0208', 0.72 * dark); ctx.fillRect(0, 0, W, H);
    withCam(ctx, cam, 0.85, c => {
      const fa = ease(u, 0.05, 0.8), rise = easeOut(map(u, B, B + 1.0)), eg = ease(u, B + 0.3, B + 1.2);
      // smoke
      for (let i = 0; i < 26; i++) { const h1 = hash(i * 3.1), h2 = hash(i * 7.3), life = (t * (0.18 + h2 * 0.16) + h1 * 3) % 1, x = 600 + (h1 - 0.5) * 900 + Math.sin(t + i) * 50, y = 1450 - life * 1500, r = 130 + life * 260; glow(c, x, y, r, '#180a20', 0.5 * fa * (1 - life)); }
      fire(c, 600, 1560, 520, 640 + rise * 240, t, 5, 13, fa);
      if (u < B + 0.25) { const ma = 1 - map(u, B - 0.1, B + 0.25); drawFigure(c, CH.monk, P({ lean: -0.04, head: -0.2, brow: -1, eye: 1.1, smile: 0.9, mouth: 0.5, aN: [-0.2, -0.06], aF: [0.24, -0.08], elN: -1, lN: [0.16, 0.03], lF: [-0.16, 0.03] }), { x: 640, y: 1420, s: lerp(640, 760, ease(u, 0, B)), face: -1 }, { tint: '#200006', tintA: lerp(0.3, 0.9, ease(u, 0.1, B)), rim: '#ff6a34', rimA: 1, dir: -1, alpha: ma, shadow: 0 }); }
      if (u > B) { c.save(); c.globalAlpha = Math.min(1, map(u, B, B + 0.3) * 1.2); const s = lerp(280, 440, rise); drawRavana(c, 590, lerp(1560, 1330, rise), s, t, eg, rise); c.globalAlpha = 1; c.restore(); const g2 = c.createLinearGradient(0, 600, 0, 1700); g2.addColorStop(0, 'rgba(255,90,40,0)'); g2.addColorStop(1, 'rgba(120,10,10,0.42)'); c.fillStyle = g2; c.fillRect(-200, 500, 1500, 1300); }
      fire(c, 600, 1640, 620, 330, t + 3, 9, 15, fa * 0.95);
      embers(c, t, 3, 46, 600, 1500, 520, fa);
    });
    withCam(ctx, cam, 1.0, c => {
      const rc = easeOut(map(u, 0.25, 0.9));
      drawFigure(c, CH.sita, lerpPose(P({ aN: [0.1, 0.16], aF: [0.1, 0.18], eye: 1.1, gaze: [0.6, -0.3] }), P({ lean: -0.2, head: -0.22, aN: [0.14, -0.06], handN: 'palm', aF: [0.2, -0.02], brow: 0.9, browUp: 1, eye: 1.35, mouth: 0.55, smile: -0.6, gaze: [0.5, -0.6], pleat: -0.03 }), rc), { x: lerp(250, 150, rc) + Math.sin(u * 30) * 2 * rc, y: 1650, s: 600, face: 1 }, Object.assign({}, L_FIRE, { shadow: 0.3 }));
    });
    if (u > B && u < B + 0.3) { post.flash = (1 - map(u, B, B + 0.3)) * 0.9; post.flashCol = '#ffd0a0'; }
  },
  // 17 — the Rekha was added in later retellings
  17(ctx, u, p, sh, t, post) {
    const bg = BG.herN, cam = { z: lerp(1.1, 1.0, p), y: 20 };
    hermitage(ctx, bg, cam, t); withCam(ctx, cam, 0.9, c => fireflies(c, t, 11, 34, [40, 700, 1000, 900], 1)); drawLayer(ctx, cam, bg.fg);
    ctx.fillStyle = 'rgba(5,6,22,0.42)'; ctx.fillRect(0, 0, W, H);
    const st = sentenceStarts(sh, 2), lead = st[0];
    post.ui = c => {
      const a = ease(u, 0.1, 0.5); text(c, 'LAKSHMANA REKHA', 540, 640, { size: 88, weight: 900, color: C_IVORY, ls: 3, alpha: a, stroke: 9, shadow: 30 });
      const k = ease(u, lead + 0.75, lead + 1.2); if (k > 0) { c.save(); c.strokeStyle = C_RED; c.lineWidth = 15; c.lineCap = 'round'; c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 10; c.beginPath(); c.moveTo(70, 622); c.lineTo(70 + 940 * k, 600); c.stroke(); c.restore(); }
      text(c, 'added in later retellings', 540, 736, { size: 47, font: 'Montserrat', weight: 600, italic: true, color: C_IVORY, alpha: ease(u, lead + 0.9, lead + 1.4), stroke: 7 });
      const a2 = ease(u, st[1] - 0.05, st[1] + 0.4); c.fillStyle = rgba(C_GOLD, 0.9 * a2); c.fillRect(540 - 250 * a2, 800, 500 * a2, 3);
      text(c, 'VALMIKI  ·  ARANYA KANDA 43–45', 540, 870, { size: 40, font: 'Montserrat', weight: 800, color: C_GOLD, ls: 4, alpha: a2, stroke: 7 });
    };
  },
  // 18 — end card (series template)
  18(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
