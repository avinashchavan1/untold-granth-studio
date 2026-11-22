// ===== Reel A17 — "Did Urmila Sleep for 14 Years?" (part 1 of 2; A102 follows) — 8 shots (CE Bala 1.70-72, 1.76; 2.110.51; whole-text search) =====
// Urmila is named only at her wedding (1.70.21-22, 1.71.3, 1.72.18, 1.76.9) and once by Sita (2.110.51). No Nidra Devi, no 14-year sleep.
// The later telling is shown as a warm, fading memory (gold tint); Nidra Devi only as a soft moon-glow, never as a figure. Urmila stays modest:
// asleep on a couch, covered to the shoulder (like A07's palace scene).
// opening śloka (CE 1.72.18), Devanagari copied from the CE page
const SLOKA = {"lines": ["लक्ष्मणागच्छ भद्रं ते ऊर्मिलामुद्यतां मया ।", "प्रतीच्छ पाणिं गृह्णीष्व मा भूत् कालस्य पर्ययः ॥"], "ref": "BALA KANDA 1.72.18", "en": "“Lakshmana, come! May good fortune be yours. Accept Urmila, whom I offer. Take her hand; let there be no delay.”"};
const VAL7021 = { source: 'VALMIKI RAMAYANA', ref: 'BALA KANDA 1.70.21 · CRITICAL EDITION', lines: ['सीतां रामाय भद्रं ते', 'ऊर्मिलां लक्ष्मणाय च ।'], translit: 'sītāṃ rāmāya bhadraṃ te ūrmilāṃ lakṣmaṇāya ca',
  en: '“I give Sita to Rama, and Urmila to Lakshmana. May good fortune be yours!”' };

// Urmila (minor, Claude's pick): Sita's younger sister; rose-red sari with a gold border
Object.assign(CH, { urmila: { kind: 'woman', skin: '#ddb294', skinSh: '#a47a86', cloth: '#c23a5a', clothSh: '#7e1e3a', border: '#e6b450', hair: '#0d0a16' } });

function buildScenes() { BG.pal = buildPalace(); BG.gn = buildGanga('night'); BG.ms = buildManuscript(); }
const L_LAMPLIT = { rim: '#ffc878', rimA: 0.9, dir: 1, tint: '#3a1830', tintA: 0.16 };
const MEMORY = { tint: '#c89a5a', tintA: 0.5, rim: '#ffe0a0', rimA: 0.7, dir: 1, shadow: 0.3 };   // the later telling, as a warm memory
const memWash = (ctx, a = 0.16) => { ctx.fillStyle = rgba('#c89a5a', a); ctx.fillRect(0, 0, W, H); };
const dim = (ctx, a = 0.3) => { ctx.fillStyle = rgba('#05061a', a); ctx.fillRect(0, 0, W, H); };
const cards = (c, sh, u, st, y0 = 560, gap = 124, size = 104) => (sh.card || []).forEach(([s, col], i) => { const at = st[Math.min(i, st.length - 1)] + (i >= st.length ? 0.4 * i : 0); const q = ease(u, at - 0.05, at + 0.35); if (q > 0) textFit(c, s, 540, y0 + i * gap + (1 - q) * 22, { size, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });

// Urmila asleep on the palace couch, covered by a silk sheet to the shoulder
function urmilaAsleep(c, bg, t, light, a = 1) {
  const [cx, cy] = bg.couch;
  c.save(); c.globalAlpha = a;
  lying(c, CH.urmila, cx + 270, cy - 4, 540, { eye: 0.02, smile: 0.15 }, light);
  blob(c, [[cx - 150, cy - 62], [cx + 290, cy - 56], [cx + 300, cy + 8], [cx - 160, cy + 6]], '#7e1e3a', 0.97, 0.3);
  stroke(c, cx - 150, cy - 60, cx + 290, cy - 54, 4, '#e6b450', 0.9);
  c.restore();
}
// a soft moon-glow: Nidra Devi in the later telling (no figure)
function nidraGlow(c, x, y, t, a = 1) { if (a <= 0) return; glow(c, x, y, 420, '#e8e0ff', 0.35 * a); glow(c, x, y, 160, '#ffffff', 0.35 * a); for (let i = 0; i < 14; i++) { const k = (t * 0.25 + i / 14) % 1; dab(c, x + Math.sin(i * 2.7 + t) * 260 * k, y + Math.cos(i * 1.9) * 200 * k, 5, 5, 0, '#f4f0ff', a * (1 - k) * 0.8); } }

const SHOTS = {
  // 1 — hook: a lamp-lit palace at night; Urmila asleep (memory gold), the question
  1(ctx, u, p, sh, t, post) {
    const bg = BG.pal, cam = { z: lerp(1.15, 1.25, p), x: 40, y: 120 };
    palace(ctx, bg, cam, t, c => urmilaAsleep(c, bg, t, MEMORY)); drawLayer(ctx, cam, bg.fg);
    memWash(ctx); dim(ctx, 0.3);
    post.ui = c => (sh.card || []).forEach(([s, col], i) => { const q = ease(u, 0.15 + i * 0.25, 0.55 + i * 0.25); if (q > 0) textFit(c, s, 540, 560 + i * 124 + (1 - q) * 22, { size: 104, weight: 900, color: col || C_IVORY, ls: 6, alpha: q, stroke: 10, shadow: 34 }); });
  },
  2(ctx, u, p, sh, t, post) { slokaSource(ctx, u, p, sh, t, post, SLOKA); },
  // 3 — the later telling: Lakshmana on guard under a moon-glow by the Ganga; then Urmila asleep in Ayodhya (warm memory)
  3(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 4), x = ease(u, st[3] - 0.6, st[3] + 0.4);
    if (x < 1) {
      const bg = BG.gn, cam = { z: lerp(1.15, 1.24, ease(u, 0, st[3])), x: 60, y: 260 };
      ganga(ctx, bg, cam, t, c => nidraGlow(c, 760, 520, t, ease(u, st[1], st[1] + 1.2)), c => {
        lying(c, CH.sita, 470, GANGA_BANK + 130, 380, {}, MEMORY); lying(c, CH.rama, 540, GANGA_BANK + 180, 400, { bow: 0, quiver: 0 }, MEMORY);
        drawFigure(c, CH.lak, P({ bow: 'N', aN: [0.08, 0.2], bowAng: 0.05, eye: blink(t, 2), gaze: [0.4, -0.5], brow: 0.3, head: -0.06 }), { x: 860, y: GANGA_BANK + 230, s: 600, face: -1 }, MEMORY);
      });
      drawLayer(ctx, cam, bg.fg); memWash(ctx, 0.18); dim(ctx, 0.15);
    }
    if (x > 0) { ctx.save(); ctx.globalAlpha = x; const bg = BG.pal, cam = { z: lerp(1.2, 1.28, ease(u, st[3], sh.dur)), x: 40, y: 140 };
      palace(ctx, bg, cam, t, c => urmilaAsleep(c, bg, t, MEMORY)); drawLayer(ctx, cam, bg.fg); memWash(ctx); dim(ctx, 0.2); ctx.restore(); }
    post.ui = c => { const q = ease(u, 0.2, 0.6); if (q > 0) { text(c, 'A LATER TELLING', 540, 470 + (1 - q) * 18, { size: 76, weight: 900, color: C_GOLD, ls: 8, alpha: q, stroke: 9, shadow: 28 }); } };
  },
  // 4 — the story remembers her with love; but what does Valmiki say? (palace lamp, then the manuscript)
  4(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), x = ease(u, st[1] - 0.5, st[1] + 0.3);
    if (x < 1) { const bg = BG.pal, cam = { z: lerp(1.25, 1.32, p), x: 40, y: 140 }; palace(ctx, bg, cam, t, c => urmilaAsleep(c, bg, t, MEMORY)); drawLayer(ctx, cam, bg.fg); memWash(ctx); dim(ctx, 0.25); }
    if (x > 0) { ctx.save(); ctx.globalAlpha = x; const bg = BG.ms, cam = { z: lerp(1.05, 1.1, p), y: 10 };
      drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms); withCam(ctx, cam, 0.8, c => flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3)); dim(ctx, 0.3); ctx.restore(); }
    post.ui = c => { const q = ease(u, st[1], st[1] + 0.4); if (q > 0) text(c, 'IN VALMIKI?', 540, 600 + (1 - q) * 20, { size: 110, weight: 900, color: C_GOLD, ls: 6, alpha: q, stroke: 10, shadow: 32 }); };
  },
  // 5 — Urmila's name in Valmiki: at her wedding; Janaka's words (1.70.21) on a quote card, read by the narrator
  5(ctx, u, p, sh, t, post) { const st = sentenceStarts(sh, 3); quoteCard(ctx, u, sh, t, post, Object.assign({ enAt: st[2] }, VAL7021)); },
  // 6 — once more, Sita to Anasuya (2.110.51); that is all. NO NIDRA DEVI. NO 14-YEAR SLEEP.
  6(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 3), bg = BG.ms, cam = { z: lerp(1.05, 1.14, p), y: 10 };
    drawLayer(ctx, cam, bg.bg); drawLayer(ctx, cam, bg.ms); withCam(ctx, cam, 0.8, c => flame(c, bg.lamp[0], bg.lamp[1], 26, t, 3)); dim(ctx, 0.35 + 0.1 * p);
    post.ui = c => {
      const q0 = ease(u, 0.2, 0.6) * (1 - ease(u, st[1] - 0.3, st[1])); if (q0 > 0) { text(c, 'ONCE MORE', 540, 560, { size: 96, weight: 900, color: C_IVORY, ls: 6, alpha: q0, stroke: 10, shadow: 30 }); text(c, 'SITA TO ANASUYA · 2.110.51', 540, 650, { size: 40, font: 'Montserrat', weight: 800, color: C_GOLD, ls: 5, alpha: q0, stroke: 6, shadow: 20 }); }
      const q1 = ease(u, st[1], st[1] + 0.4) * (1 - ease(u, st[2] - 0.3, st[2])); if (q1 > 0) text(c, "THAT'S ALL.", 540, 600, { size: 110, weight: 900, color: C_IVORY, ls: 6, alpha: q1, stroke: 10, shadow: 30 });
      cards(c, sh, u, [st[2], st[2] + 1.2], 560, 124, 96);
    };
  },
  // 7 — so what were Lakshmana's nights like? By the Ganga: Rama and Sita asleep, Lakshmana with his bow (A102 follows)
  7(ctx, u, p, sh, t, post) {
    const st = sentenceStarts(sh, 2), bg = BG.gn, cam = { z: lerp(1.12, 1.2, p), x: 60, y: 260 };
    ganga(ctx, bg, cam, t, null, c => {
      lying(c, CH.sita, 470, GANGA_BANK + 130, 380, {}, L_NIGHT); lying(c, CH.rama, 540, GANGA_BANK + 180, 400, { bow: 0, quiver: 0 }, L_NIGHT);
      drawFigure(c, CH.lak, P({ bow: 'N', aN: [0.08, 0.2], bowAng: 0.05, eye: blink(t, 2), gaze: [0.6, -0.1], brow: 0.3 }), { x: 860, y: GANGA_BANK + 230, s: 600, face: -1 }, L_NIGHT);
      fireflies(c, t, 6, 12, [100, 1000, 900, 500], 0.6);
    });
    drawLayer(ctx, cam, bg.fg); dim(ctx, 0.2);
    post.ui = c => cards(c, sh, u, [st[1], st[1] + 0.4], 520, 120, 100);
  },
  8(ctx, u, p, sh, t, post) { endCard(ctx, u, p, sh, t, post); },
};
