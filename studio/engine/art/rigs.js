// ===== storyreel-studio art library: figure rigs (gouache cut-outs with poses, blinks, gaze, IK hands) =====
// A character is data: CH.<key> = { kind: 'man'|'woman'|'monk'|'demon', skin, skinSh, cloth, clothSh, sash|border|blouse, hair,
//   optional flags: god (crown), sage (beard; monk+sage = matted jata), elder, plain (no jewellery), vanara (muzzle, fur cap, tail),
//   bear (round ears, long snout; with vanara), band (gold head band), crown (vanara crown), bow (bow + quiver), ruff,
//   garland: 'gold'|'flowers' (also per pose: P({garland})), ears + tail (vanara signs on a human face; fur = ear colour) }.
// Draw: drawFigure(ctx, CH.key, P({ pose overrides }), { x, y, s, face: ±1 }, light). A series adds its own cast in art/chars.js:
//   Object.assign(CH, { hero: {...}, ... });
const CH = {
  hero:     { kind: 'man', skin: '#d9ae90', skinSh: '#9c7886', cloth: '#e6cc9e', clothSh: '#a98a74', sash: '#dba24c', hair: '#0e0c18', bow: true },
  heroine:  { kind: 'woman', skin: '#dfb699', skinSh: '#a67e8a', cloth: '#dc8a2c', clothSh: '#9c5a36', border: '#b8261e', hair: '#0d0a16' },
  brother:  { kind: 'man', skin: '#c99d7c', skinSh: '#8c6a78', cloth: '#236a50', clothSh: '#123c3a', sash: '#3a8a68', hair: '#0e0c18', bow: true },
  king:     { kind: 'man', god: true, sage: true, skin: '#d4a882', skinSh: '#987062', cloth: '#efe2c4', clothSh: '#b0a088', sash: '#e6b450', hair: '#ece6dc' },
  queen:    { kind: 'woman', skin: '#ecc8a0', skinSh: '#b08a86', cloth: '#7a1e4a', clothSh: '#4a1030', border: '#e6b450', blouse: '#a8304a', hair: '#0d0a16' },
  sage:     { kind: 'monk', sage: true, skin: '#a87a5a', skinSh: '#6a4a4a', cloth: '#b88e5c', clothSh: '#76583a', hair: '#ebe5da' },
  ascetic:  { kind: 'monk', sage: true, skin: '#9c6c4c', skinSh: '#5e4040', cloth: '#cc7a2e', clothSh: '#8a4a24', hair: '#bcb4a8' },
  warrior_sage: { kind: 'monk', sage: true, bow: true, skin: '#a8724a', skinSh: '#6a4436', cloth: '#8a4a2a', clothSh: '#5a2e1a', hair: '#1a1418' },
  elder_woman: { kind: 'woman', elder: true, skin: '#a97a5c', skinSh: '#6c4a4c', cloth: '#8d6a44', clothSh: '#56402c', border: '#6a4a2c', blouse: '#6e5034', hair: '#dcd6cc' },
  villager: { kind: 'man', skin: '#9a6a48', skinSh: '#62423a', cloth: '#d8ccb4', clothSh: '#988c76', sash: '#7a6a52', hair: '#14101c' },
  hunter:   { kind: 'man', skin: '#8e5e40', skinSh: '#5a3a30', cloth: '#7a5232', clothSh: '#4a321e', sash: '#a8302a', hair: '#0e0c18', bow: true },
  monkey:   { kind: 'man', vanara: true, skin: '#8a6038', skinSh: '#553a24', muzzle: '#dcbc96', cloth: '#5a3a22', clothSh: '#3a2416', sash: '#8a5a2a', hair: '#5a3a1e' },
  bear:     { kind: 'man', vanara: true, bear: true, elder: true, band: true, skin: '#7a6e66', skinSh: '#4a403c', muzzle: '#d8cfc2', ruff: '#f2eee6', cloth: '#8a1a1c', clothSh: '#561018', sash: '#e6b450', hair: '#9a8e84' },
  demon:    { kind: 'demon', skin: '#52695c', skinSh: '#28393e', cloth: '#1a1622', clothSh: '#0e0c14', hair: '#07070e' },
  deity:    { kind: 'man', god: true, skin: '#3f78b4', skinSh: '#22487a', cloth: '#b4201c', clothSh: '#6e1420', sash: '#e6b450', hair: '#0e1a34' },
};
const GOLD = '#f0c060', GOLDSH = '#b07a2a';
const POSE0 = { lean: 0.02, head: 0, aN: [-0.062, 0.358], aF: [0.05, 0.362], lN: [0.1, 0.03], lF: [-0.11, 0.03], brow: 0, eye: 1, mouth: 0, smile: 0.15, gaze: [0, 0], tear: 0, handN: 'relaxed', handF: 'relaxed', sit: 0, bowAng: 0, pleat: 0, elN: 1, elF: 1, dy: 0 };
function P(o) { return Object.assign({}, POSE0, o || {}); }
function lerpPose(a, b, t) {
  const o = {}; for (const k in a) { const va = a[k], vb = b[k] === undefined ? va : b[k]; o[k] = Array.isArray(va) ? va.map((v, i) => lerp(v, vb[i], t)) : typeof va === 'number' ? lerp(va, vb, t) : (t > 0.5 ? vb : va); } return o;
}
function walkPose(ph, A = 0.42, base) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return Object.assign(P(base), { lN: [A * s, 0.08 + 0.6 * Math.max(0, c)], lF: [-A * s, 0.08 + 0.6 * Math.max(0, -c)], aN: [-0.06 - 0.11 * s, 0.34], aF: [0.055 + 0.11 * s, 0.345], pleat: -s * 0.03 });
}
function runPose(ph, base) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return Object.assign(P(base), { lean: 0.3, lN: [0.2 + 0.8 * s, 0.25 + 1.2 * Math.max(0, c)], lF: [0.2 - 0.8 * s, 0.25 + 1.2 * Math.max(0, -c)], aN: [-0.02 - 0.15 * s, 0.22 - 0.03 * c], aF: [0.2 + 0.05 * s, 0.14], pleat: -0.05 });
}
function ik(sh, tg, l1, l2, sgn) {
  let dx = tg[0] - sh[0], dy = tg[1] - sh[1], d = Math.hypot(dx, dy); const mx = l1 + l2 - 1e-4; if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; } if (d < 0.02) d = 0.02;
  const a = Math.atan2(dy, dx), b = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)) * sgn;
  return { el: [sh[0] + Math.cos(a + b) * l1, sh[1] + Math.sin(a + b) * l1], hand: [sh[0] + dx, sh[1] + dy] };
}
const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];

// ---------- head ----------
const FACE = [[-0.02, -0.5], [0.25, -0.44], [0.39, -0.26], [0.42, -0.08], [0.44, 0.03], [0.5, 0.13], [0.43, 0.19], [0.42, 0.28], [0.36, 0.42], [0.2, 0.5], [0.0, 0.44], [-0.2, 0.3], [-0.36, 0.1], [-0.42, -0.15], [-0.3, -0.4]];
function drawEye(x, e, w, h, p, iris, fem, lash) {
  const open = clamp(p.eye, 0, 1.3);
  if (open < 0.18) { line(x, [[e[0] - w, e[1]], [e[0], e[1] + h * 0.5], [e[0] + w, e[1] - 0.005]], 0.022, lash); return; }
  const top = e[1] - h * 1.9 * open, bot = e[1] + h * 1.1 * open;
  x.save(); x.beginPath(); x.moveTo(e[0] - w, e[1] + 0.012); x.quadraticCurveTo(e[0] - w * 0.1, top, e[0] + w, e[1]); x.quadraticCurveTo(e[0], bot, e[0] - w, e[1] + 0.012); x.closePath();
  x.fillStyle = '#ece6dc'; x.fill(); x.clip();
  const ix = e[0] + p.gaze[0] * w * 0.42, iy = e[1] - h * 0.25 + p.gaze[1] * h * 0.7, ir = h * 1.25;
  if (iris.glow) { x.fillStyle = iris.col; x.fillRect(e[0] - w, e[1] - h * 3, w * 2, h * 6); dab(x, ix, iy, ir * 0.55, ir * 0.55, 0, '#fff0a0'); }
  else { dab(x, ix, iy, ir, ir, 0, iris.col); dab(x, ix, iy, ir * 0.55, ir * 0.55, 0, '#07050a'); dab(x, ix - ir * 0.35, iy - ir * 0.4, ir * 0.28, ir * 0.28, 0, '#ffffff', 0.95); }
  x.fillStyle = 'rgba(40,20,50,0.25)'; x.fillRect(e[0] - w, top - 0.01, w * 2, h * 0.9);
  x.restore();
  x.strokeStyle = lash; x.lineWidth = fem ? 0.03 : 0.024; x.lineCap = 'round'; x.beginPath(); x.moveTo(e[0] - w * (fem ? 1.25 : 1.05), e[1] + 0.002 - (fem ? 0.02 : 0)); x.quadraticCurveTo(e[0] - w * 0.1, top - 0.006, e[0] + w, e[1]); x.stroke();
}
function drawHeadBack(x, ch, p) { // hair mass that sits behind neck/shoulders
  const k = ch.kind;
  if (k === 'man') blob(x, [[-0.44, -0.1], [-0.56, 0.35], [-0.52, 0.78], [-0.3, 0.86], [-0.16, 0.55], [-0.2, 0.2]], ch.hair);
  if (k === 'woman') blob(x, [[-0.44, -0.2], [-0.6, 0.2], [-0.5, 0.56], [-0.26, 0.6], [-0.14, 0.4], [-0.2, 0.1]], ch.hair);
  if (ch.sage) blob(x, [[-0.4, -0.3], [-0.62, 0.15], [-0.6, 0.7], [-0.36, 0.86], [-0.18, 0.5], [-0.2, 0.1]], ch.hair);
  if (k === 'demon') { const pts = []; for (let i = 0; i < 22; i++) { const a = 1.25 + i / 21 * 3.9, rr = (i % 2 ? 0.62 : 1.02) + 0.2 * Math.sin(i * 2.7) + (a > 2.2 && a < 4.2 ? 0.45 : 0); pts.push([-0.08 + Math.cos(a) * rr * 0.8, 0.05 + Math.sin(a) * rr]); } blob(x, pts, ch.hair, 1, 0.25); }
}
function drawHead(x, ch, p) {
  const k = ch.kind, fem = k === 'woman', dem = k === 'demon', monk = k === 'monk';
  const sx = dem ? 1.12 : monk ? 1.06 : 1;
  x.save(); x.scale(sx, 1);
  // face
  x.save(); x.beginPath(); curve(x, FACE, true); x.fillStyle = ch.skin; x.fill(); x.clip();
  blob(x, [[-0.5, -0.5], [-0.2, -0.35], [-0.12, 0.0], [0.0, 0.26], [0.22, 0.52], [0.0, 0.6], [-0.5, 0.5]], ch.skinSh, 0.62);
  blob(x, [[0.2, 0.3], [0.44, 0.34], [0.4, 0.56], [0.1, 0.56]], ch.skinSh, 0.35);
  if (monk) { for (let i = 0; i < 3; i++) stroke(x, 0.1, -0.33 + i * 0.06, 0.4, -0.31 + i * 0.06, 0.022, '#e4ded6', 0.8, 0.05); dab(x, 0.1, -0.42, 0.2, 0.08, -0.3, '#c8906a', 0.35); }
  x.restore();
  // ear + earring
  dab(x, -0.14, 0.03, 0.065, 0.1, 0.1, mix(ch.skin, ch.skinSh, 0.45)); line(x, [[-0.13, -0.03], [-0.17, 0.03], [-0.13, 0.07]], 0.016, ch.skinSh, 0.8);
  if (ch.vanara) { dab(x, -0.16, -0.02, 0.12, 0.15, 0, ch.skin); dab(x, -0.15, -0.01, 0.07, 0.09, 0, ch.muzzle, 0.8); }
  if (!dem && !ch.elder && !ch.plain && !ch.vanara) { dab(x, -0.14, 0.16, 0.038, 0.038, 0, GOLD); if (fem) { dab(x, -0.14, 0.23, 0.05, 0.045, 0, GOLD); dab(x, -0.14, 0.275, 0.02, 0.02, 0, '#b8261e'); } } else if (dem) dab(x, -0.14, 0.17, 0.05, 0.05, 0, GOLD);
  // hair
  if (ch.vanara) {      // fur cap with a ragged edge, a light muzzle round mouth and nose, a heavy brow
    const pts = []; for (let i = 0; i < 18; i++) { const a = Math.PI * 1.05 + i / 17 * Math.PI * 0.95, rr = 0.56 + (i % 2) * 0.05; pts.push([0.0 + Math.cos(a) * rr * 0.95, -0.02 + Math.sin(a) * rr]); }
    pts.push([0.38, -0.2], [0.3, -0.28], [0.1, -0.3], [-0.1, -0.2], [-0.22, 0.12], [-0.4, 0.26]); blob(x, pts, ch.hair, 1, 0.2);
    blob(x, [[0.08, 0.02], [0.3, -0.02], [0.5, 0.08], [0.54, 0.24], [0.44, 0.42], [0.24, 0.48], [0.06, 0.38], [0.02, 0.18]], ch.muzzle, 1, 0.35);
    dab(x, 0.47, 0.16, 0.035, 0.025, 0, '#2a1a12'); line(x, [[0.0, -0.17], [0.2, -0.22], [0.42, -0.16]], 0.05, mix(ch.hair, '#000000', 0.35), 0.8);
    if (ch.bear) {      // a venerable old bear-king: small round ears, long pale snout, big dark nose, heavy white brows, flowing white beard
      dab(x, 0.12, -0.6, 0.085, 0.085, 0, ch.hair); dab(x, 0.12, -0.6, 0.04, 0.04, 0, ch.skinSh, 0.6);
      dab(x, -0.3, -0.54, 0.1, 0.1, 0, ch.hair); dab(x, -0.3, -0.54, 0.048, 0.048, 0, ch.skinSh, 0.6);
      blob(x, [[0.04, -0.04], [0.34, -0.1], [0.62, 0.04], [0.68, 0.2], [0.56, 0.36], [0.3, 0.42], [0.06, 0.34], [-0.02, 0.14]], ch.muzzle, 1, 0.3);
      dab(x, 0.63, 0.08, 0.07, 0.05, 0, '#17100e'); dab(x, 0.61, 0.06, 0.022, 0.014, 0, '#6a5a52', 0.7);
      blob(x, [[-0.26, 0.16], [0.0, 0.3], [0.3, 0.4], [0.5, 0.36], [0.46, 0.56], [0.3, 0.8], [0.1, 0.96], [-0.04, 0.78], [-0.2, 0.52]], ch.ruff || ch.hair, 1, 0.35);   // beard
      for (let i = 0; i < 5; i++) stroke(x, -0.1 + i * 0.1, 0.42 + (i % 2) * 0.06, -0.02 + i * 0.08, 0.8 - (i % 3) * 0.06, 0.012, mix(ch.ruff || ch.hair, '#7a7066', 0.5), 0.5, 0.2);
      if (ch.elder) { line(x, [[0.0, -0.18], [0.2, -0.26], [0.44, -0.2], [0.52, -0.12]], 0.06, '#f2eee6', 0.95); for (let i = 0; i < 3; i++) stroke(x, 0.3 + i * 0.07, -0.22, 0.42 + i * 0.08, -0.12 + i * 0.02, 0.014, '#f2eee6', 0.8, 0.2); }
      if (ch.band) { line(x, [[-0.52, -0.3], [-0.1, -0.44], [0.3, -0.36]], 0.05, GOLD, 1); dab(x, -0.08, -0.44, 0.04, 0.05, 0, '#c41e1e'); }
    }
    if (ch.crown) { blob(x, [[-0.36, -0.46], [-0.3, -0.78], [-0.12, -0.98], [0.04, -0.8], [0.12, -0.5]], GOLD, 1, 0.3); blob(x, [[-0.3, -0.5], [-0.24, -0.74], [-0.12, -0.86], [-0.08, -0.5]], GOLDSH, 0.7); dab(x, -0.12, -0.64, 0.045, 0.055, 0, '#c41e1e'); stroke(x, -0.38, -0.47, 0.14, -0.5, 0.05, GOLD, 1, 0.1); }
  } else if (k === 'man') {
    blob(x, [[0.36, -0.3], [0.22, -0.5], [-0.05, -0.58], [-0.34, -0.48], [-0.5, -0.2], [-0.5, 0.1], [-0.4, 0.3], [-0.24, 0.28], [-0.215, 0.08], [-0.2, -0.08], [-0.03, -0.21], [0.18, -0.31]], ch.hair);
    dab(x, -0.1, -0.7, 0.2, 0.19, 0, ch.hair); stroke(x, -0.25, -0.56, 0.05, -0.56, 0.035, GOLD, 0.95, -0.15);
    if (ch.god) { blob(x, [[-0.3, -0.55], [-0.24, -0.9], [-0.1, -1.08], [0.02, -0.9], [0.1, -0.56]], GOLD, 1, 0.3); blob(x, [[-0.24, -0.6], [-0.18, -0.86], [-0.1, -0.98], [-0.06, -0.6]], GOLDSH, 0.7); dab(x, -0.1, -0.72, 0.04, 0.05, 0, '#c41e1e'); }
    stroke(x, -0.2, -0.78, -0.02, -0.8, 0.03, '#3a3a66', 0.7, 0.3); stroke(x, -0.3, -0.36, 0.1, -0.46, 0.03, '#3a3a66', 0.55, 0.2);
  } else if (fem) {
    blob(x, [[0.35, -0.3], [0.22, -0.5], [-0.05, -0.58], [-0.34, -0.48], [-0.5, -0.2], [-0.52, 0.12], [-0.42, 0.38], [-0.25, 0.36], [-0.21, 0.1], [-0.17, -0.1], [0.02, -0.27], [0.2, -0.34]], ch.hair);
    stroke(x, -0.3, -0.36, 0.1, -0.47, 0.03, ch.elder ? '#f4f0ea' : '#3a3a66', 0.55, 0.2);
    if (ch.elder) { for (let i = 0; i < 4; i++) stroke(x, -0.36 + i * 0.1, -0.5 + i * 0.02, -0.2 + i * 0.12, -0.56 + i * 0.03, 0.012, '#9c968e', 0.5, 0.2); dab(x, -0.42, -0.36, 0.16, 0.14, 0, ch.hair); dab(x, 0.3, -0.24, 0.018, 0.05, 0, '#efe6d4'); }
    else if (!ch.plain) { line(x, [[0.345, -0.31], [0.22, -0.5], [-0.02, -0.575]], 0.05, GOLD); line(x, [[0.345, -0.31], [0.22, -0.5], [-0.02, -0.575]], 0.016, '#fff0b8', 0.8);
    poly(x, [[0.16, -0.5], [0.24, -0.66], [0.3, -0.46]], GOLD); dab(x, 0.235, -0.54, 0.028, 0.028, 0, '#c4261e');
    dab(x, 0.33, -0.19, 0.028, 0.03, 0, '#c4261e'); }
  } else if (monk && ch.sage) {
    blob(x, [[0.34, -0.32], [0.2, -0.5], [-0.05, -0.57], [-0.34, -0.47], [-0.5, -0.2], [-0.5, 0.12], [-0.38, 0.3], [-0.24, 0.26], [-0.215, 0.06], [-0.2, -0.1], [-0.02, -0.25], [0.18, -0.34]], ch.hair);
    dab(x, -0.08, -0.74, 0.22, 0.2, 0, ch.hair); dab(x, -0.08, -0.9, 0.14, 0.13, 0, ch.hair);                       // matted jata, coiled high
    for (let i = 0; i < 5; i++) stroke(x, -0.26 + i * 0.09, -0.62 - (i % 2) * 0.05, -0.2 + i * 0.07, -0.86 + (i % 3) * 0.05, 0.016, mix(ch.hair, '#6a6058', 0.45), 0.6, 0.3);
    line(x, [[-0.28, -0.6], [-0.08, -0.56], [0.12, -0.6]], 0.03, mix(ch.hair, '#7a6a5a', 0.5), 0.8);          // band of twisted locks
  } else if (monk) {
    dab(x, -0.3, -0.5, 0.1, 0.085, -0.5, ch.hair); stroke(x, -0.34, -0.5, -0.5, -0.36, 0.05, ch.hair, 1, -0.3);
  } else if (dem) {
    blob(x, [[0.38, -0.28], [0.2, -0.52], [-0.05, -0.6], [-0.36, -0.5], [-0.52, -0.2], [-0.5, 0.12], [-0.3, 0.2], [-0.2, -0.08], [-0.03, -0.24], [0.18, -0.33]], ch.hair, 1, 0.3);
    const horn = (bx, by, tx, ty, w) => { x.fillStyle = '#cdc2a6'; x.beginPath(); x.moveTo(bx - w, by); x.quadraticCurveTo(bx - w * 1.6, (by + ty) / 2, tx, ty); x.quadraticCurveTo(bx + w * 0.4, (by + ty) / 2, bx + w, by); x.closePath(); x.fill(); stroke(x, bx + w * 0.5, by, tx, ty, w * 0.5, '#7a7088', 0.6, 0.2); };
    horn(-0.24, -0.46, -0.42, -1.08, 0.1); horn(0.14, -0.47, 0.34, -1.02, 0.09);
  }
  // brows
  const bw = fem ? 0.026 : dem ? 0.055 : monk ? 0.05 : 0.036, by = -0.2 - (p.browUp || 0) * 0.05;
  line(x, [[0.02, by + p.brow * 0.04], [0.12, by - 0.035], [0.225, by - p.brow * 0.05 + 0.0]], bw, ch.hair);
  line(x, [[0.3, by - p.brow * 0.05 + 0.005], [0.36, by - 0.025], [0.41, by + p.brow * 0.02 + 0.01]], bw * 0.85, ch.hair);
  // eyes
  const iris = dem ? { glow: 1, col: '#e02414' } : { col: '#3a1c0c' };
  if (dem) { glow(x, 0.13, -0.06, 0.3, '#ff3a1a', 0.5); }
  drawEye(x, [0.125, -0.055], 0.105, 0.058, p, iris, fem, ch.hair); drawEye(x, [0.35, -0.062], 0.062, 0.054, p, iris, fem, ch.hair);
  // nose hint
  line(x, [[0.405, 0.145], [0.385, 0.185], [0.42, 0.195]], 0.014, ch.skinSh, 0.8);
  if (fem && !ch.elder && !ch.plain) dab(x, 0.4, 0.15, 0.012, 0.012, 0, GOLD);
  if (ch.elder) { line(x, [[0.04, -0.33], [0.2, -0.35], [0.36, -0.32]], 0.008, ch.skinSh, 0.55); line(x, [[0.07, -0.29], [0.2, -0.305], [0.33, -0.285]], 0.007, ch.skinSh, 0.45); line(x, [[0.43, 0.2], [0.4, 0.27], [0.36, 0.33]], 0.01, ch.skinSh, 0.6); line(x, [[0.02, 0.0], [0.06, 0.03]], 0.007, ch.skinSh, 0.5); line(x, [[0.02, -0.02], [0.07, -0.0]], 0.006, ch.skinSh, 0.45); }
  if (ch.sage) {   // long beard from the jaw; the mouth is painted on top of it
    blob(x, [[-0.14, 0.06], [0.02, 0.24], [0.2, 0.2], [0.44, 0.22], [0.47, 0.36], [0.38, 0.62], [0.24, 0.92], [0.08, 1.02], [-0.04, 0.78], [-0.16, 0.4]], ch.hair, 1, 0.35);
    for (let i = 0; i < 6; i++) stroke(x, 0.0 + i * 0.07, 0.34 + (i % 2) * 0.05, 0.02 + i * 0.05, 0.86 - i * 0.05, 0.012, mix(ch.hair, '#7a7068', 0.5), 0.55, 0.2);
    line(x, [[0.16, 0.25], [0.3, 0.215], [0.46, 0.25]], 0.05, ch.hair);                                     // moustache
  }
  // mouth
  const m = [0.3, 0.3], o = clamp(p.mouth, 0, 1.2), s = p.smile, wN = dem ? 0.13 : 0.088, wF = dem ? 0.075 : 0.055;
  const L = [m[0] - wN, m[1] - s * 0.035 + 0.004], R = [m[0] + wF, m[1] - s * 0.03 - 0.004], lip = fem ? (ch.elder ? '#7e4a48' : '#a6303a') : mix(ch.skinSh, '#5a1e28', 0.5);
  if (o > 0.06) {
    const up = m[1] - 0.012 - o * 0.02, dn = m[1] + 0.02 + o * (dem ? 0.2 : 0.13);
    x.save(); x.beginPath(); x.moveTo(L[0], L[1]); x.quadraticCurveTo(m[0], up - 0.015, R[0], R[1]); x.quadraticCurveTo(m[0] + 0.01, dn + (dn - m[1]) * 0.9, L[0], L[1]); x.closePath(); x.fillStyle = '#2c0a12'; x.fill(); x.clip();
    if (o > 0.25) { x.fillStyle = '#efe8dc'; x.fillRect(L[0], up - 0.03, wN + wF, 0.045); dab(x, m[0] - 0.01, dn + 0.03, 0.07, 0.05, 0, '#b0404a', 0.9); }
    x.restore();
    x.strokeStyle = lip; x.lineWidth = fem ? 0.024 : 0.018; x.lineCap = 'round'; x.beginPath(); x.moveTo(L[0], L[1]); x.quadraticCurveTo(m[0], up - 0.02, R[0], R[1]); x.stroke();
    if (fem) { x.beginPath(); x.moveTo(L[0] + 0.02, L[1] + (dn - m[1]) * 0.75); x.quadraticCurveTo(m[0], dn + (dn - m[1]) * 0.5, R[0] - 0.01, R[1] + (dn - m[1]) * 0.7); x.stroke(); }
  } else {
    x.strokeStyle = fem ? '#7a1e2a' : '#4a1c22'; x.lineWidth = 0.018; x.lineCap = 'round'; x.beginPath(); x.moveTo(L[0], L[1]); x.quadraticCurveTo(m[0], m[1] + s * 0.035 + 0.006, R[0], R[1]); x.stroke();
    if (fem) { blob(x, [[L[0] + 0.02, L[1] + 0.008], [m[0], m[1] + s * 0.03 + 0.012], [R[0] - 0.012, R[1] + 0.008], [m[0] + 0.01, m[1] + 0.06 + s * 0.02]], lip, 0.95); blob(x, [[L[0] + 0.015, L[1]], [m[0] - 0.03, m[1] - 0.03], [m[0], m[1] - 0.012], [m[0] + 0.03, m[1] - 0.028], [R[0] - 0.01, R[1]], [m[0], m[1] + s * 0.03 + 0.004]], '#8e2632', 0.95); }
  }
  if (dem) { poly(x, [[L[0] + 0.02, L[1] + 0.03], [L[0] + 0.045, L[1] - 0.11], [L[0] + 0.075, L[1] + 0.03]], '#efe8d6'); poly(x, [[R[0] - 0.05, R[1] + 0.03], [R[0] - 0.03, R[1] - 0.09], [R[0] - 0.005, R[1] + 0.03]], '#efe8d6'); }
  if (monk && !ch.sage) { // big curled moustache
    x.strokeStyle = ch.hair; x.lineCap = 'round'; x.lineWidth = 0.075; x.beginPath(); x.moveTo(0.39, 0.225); x.bezierCurveTo(0.26, 0.2, 0.12, 0.34, 0.02, 0.24); x.stroke();
    x.lineWidth = 0.04; x.beginPath(); x.moveTo(0.04, 0.26); x.bezierCurveTo(-0.06, 0.24, -0.06, 0.1, 0.03, 0.12); x.stroke();
    x.lineWidth = 0.06; x.beginPath(); x.moveTo(0.4, 0.225); x.bezierCurveTo(0.47, 0.22, 0.52, 0.28, 0.55, 0.2); x.stroke(); x.lineWidth = 0.03; x.beginPath(); x.moveTo(0.55, 0.21); x.quadraticCurveTo(0.58, 0.14, 0.53, 0.12); x.stroke();
  }
  // tears
  if (p.tear > 0.02) { const a = clamp(p.tear); dab(x, 0.07, 0.03, 0.018, 0.022, 0, '#dff0ff', 0.9 * a); line(x, [[0.075, 0.04], [0.06, 0.12 + 0.1 * a], [0.075, 0.2 + 0.16 * a]], 0.02, '#cfe6ff', 0.75 * a); dab(x, 0.075, 0.2 + 0.16 * a, 0.022, 0.03, 0, '#eaf6ff', 0.9 * a); dab(x, 0.33, 0.02, 0.014, 0.018, 0, '#dff0ff', 0.8 * a); }
  if (ch.ears && !ch.vanara) { dab(x, -0.3, -0.34, 0.1, 0.11, -0.3, ch.fur || ch.skin); dab(x, -0.29, -0.33, 0.055, 0.06, -0.3, mix(ch.fur || ch.skin, '#3a2014', 0.45), 0.8); }   // vanara sign on a human face: small rounded ear above the hairline
  x.restore();
}

// ---------- props ----------
function drawBow(x, hand, ang, flipString) {
  x.save(); x.translate(hand[0], hand[1]); x.rotate(ang);
  line(x, [[-0.035, -0.34], [0.0, -0.3], [0.05, -0.16], [0.0, 0], [0.05, 0.16], [0.0, 0.3], [-0.035, 0.34]], 0.02, '#6e4a2c'); line(x, [[0.03, -0.2], [0.05, -0.16], [0.02, -0.06]], 0.008, '#c9955a', 0.7);
  stroke(x, -0.035, -0.34, -0.035, 0.34, 0.005, '#e8e0d0', 0.75);
  stroke(x, 0.0, -0.035, 0.0, 0.035, 0.03, GOLDSH); stroke(x, 0.012, -0.33, -0.03, -0.345, 0.014, GOLD); stroke(x, 0.012, 0.33, -0.03, 0.345, 0.014, GOLD);
  x.restore();
}
function drawHand(x, h, el, type, col, colSh) {
  const a = Math.atan2(h[1] - el[1], h[0] - el[0]);
  x.save(); x.translate(h[0], h[1]); x.rotate(a);
  if (type === 'point') { dab(x, 0.012, 0, 0.024, 0.02, 0, col); limb(x, [0.02, -0.006], [0.085, -0.012], 0.016, 0.011, col); dab(x, 0.018, 0.012, 0.016, 0.011, 0.3, colSh, 0.6); }
  else if (type === 'palm') { x.rotate(-a - 0.15); blob(x, [[-0.022, 0.012], [-0.026, -0.03], [-0.018, -0.066], [0.0, -0.074], [0.018, -0.066], [0.026, -0.03], [0.022, 0.012], [0, 0.022]], col); for (let i = -1; i <= 1; i++) stroke(x, i * 0.009, -0.07, i * 0.009, -0.035, 0.003, colSh, 0.7); limb(x, [0.02, -0.005], [0.04, -0.03], 0.014, 0.01, col); }
  else if (type === 'fist' || type === 'hold') { dab(x, 0.012, 0, 0.025, 0.022, 0, col); stroke(x, 0.02, -0.012, 0.02, 0.012, 0.004, colSh, 0.6); }
  else if (type === 'none') { }
  else { blob(x, [[-0.01, -0.016], [0.03, -0.018], [0.058, -0.004], [0.05, 0.014], [0.02, 0.02], [-0.01, 0.016]], col); }
  x.restore();
}

// ---------- full figure ----------
const _fig = { a: null, b: null };
function figureBuffers() { if (!_fig.a) { _fig.a = mk(W, H); _fig.b = mk(W, H); } return _fig; }
// pl: {x, y, s, face}; light: {tint, tintA, rim, rimA, dir, shadow}
function drawFigure(ctx, ch, pose, pl, light = {}) {
  const { a: A, b: B } = figureBuffers(), x = A.getContext('2d'), T = ctx.getTransform(), S = pl.s, f = (pl.face < 0 ? -1 : 1) * Math.max(Math.abs(pl.face === undefined ? 1 : pl.face), 0.1);
  // ground shadow (drawn straight on ctx)
  if (light.shadow !== 0) { ctx.save(); ctx.translate(pl.x, pl.y + S * 0.004); ctx.scale(1, 0.22); glow(ctx, 0, 0, S * 0.24, '#03040f', light.shadow || 0.55); ctx.restore(); }
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.setTransform(T); x.transform(S * f, 0, 0, S, pl.x, pl.y); x.lineJoin = 'round';
  const info = figureBody(x, ch, pose);
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (light.tint) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = rgba(light.tint, light.tintA === undefined ? 0.25 : light.tintA); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
  if (light.rim) {
    const b = B.getContext('2d'), zs = Math.hypot(T.a, T.b) * S, d = (light.dir || 1), off = clamp(zs * 0.0055, 2, 7);
    b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H); b.drawImage(A, 0, 0); b.globalCompositeOperation = 'destination-out'; b.drawImage(A, -d * off, off * 0.75);
    b.globalCompositeOperation = 'source-in'; b.fillStyle = light.rim; b.fillRect(0, 0, W, H); b.globalCompositeOperation = 'source-over';
    x.globalAlpha = light.rimA === undefined ? 0.8 : light.rimA; x.drawImage(B, 0, 0); x.globalAlpha = 1;
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = light.alpha === undefined ? 1 : light.alpha; ctx.drawImage(A, 0, 0); ctx.restore();
  const pt = q => [pl.x + S * f * q[0], pl.y + S * q[1]];
  return { pt, hip: pt(info.hip), N: pt(info.N), HC: pt(info.HC), handN: pt(info.handN), handF: pt(info.handF) };
}
function figureBody(x, ch, p) {
  const k = ch.kind, man = k === 'man', fem = k === 'woman', monk = k === 'monk', dem = k === 'demon';
  const TH = 0.245, SH = 0.245, UA = 0.17, FA = 0.16, bw = dem ? 1.4 : monk ? 1.22 : fem ? 0.86 : 1; // body width factor
  const skin = ch.skin, skinSh = ch.skinSh, cloth = ch.cloth, clothSh = ch.clothSh;
  // --- legs (FK) -> hip height
  const leg = (off, ang, bend) => { const kn = [off + Math.sin(ang) * TH, Math.cos(ang) * TH], ft = [kn[0] + Math.sin(ang - bend) * SH, kn[1] + Math.cos(ang - bend) * SH]; return { kn, ft }; };
  let LN = leg(-0.022, p.lN[0], p.lN[1]), LF = leg(0.024, p.lF[0], p.lF[1]);
  const low = Math.max(LN.kn[1], LN.ft[1] + 0.022, LF.kn[1], LF.ft[1] + 0.022);
  let hipY = -low + p.dy; if (p.sit > 0) hipY = lerp(hipY, -0.085, p.sit);
  const hip = [0, hipY], sh = pt => add(pt, hip);
  LN = { kn: sh(LN.kn), ft: sh(LN.ft) }; LF = { kn: sh(LF.kn), ft: sh(LF.ft) };
  const lean = p.lean, N = add(hip, rot([0, -0.3], lean)), shN = add(N, rot([-0.058 * bw, 0.032], lean)), shF = add(N, rot([0.062 * bw, 0.036], lean));
  const aN = ik(shN, add(N, p.aN), UA, FA, p.elN), aF = ik(shF, add(N, p.aF), UA, FA, p.elF);
  const headRot = p.head + lean * 0.45, HS = 0.135 * (dem ? 1.12 : 1), HC = add(N, rot([0.022, -0.1], lean * 0.8 + p.head * 0.3));
  const armW = dem ? 1.5 : monk ? 1.2 : fem ? 0.8 : 1;
  const drawArm = (a, shd, far, handType) => {
    const c = far ? mix(skin, skinSh, 0.55) : skin;
    limb(x, shd, a.el, 0.052 * armW, 0.042 * armW, c); limb(x, a.el, a.hand, 0.04 * armW, 0.03 * armW, c);
    if (!far) { limb(x, add(shd, [0.004, 0.012]), add(a.el, [0.004, 0.01]), 0.022 * armW, 0.018 * armW, skinSh, 0.45); }
    if (fem) { limb(x, shd, [lerp(shd[0], a.el[0], 0.48), lerp(shd[1], a.el[1], 0.48)], 0.058, 0.052, ch.blouse ? (far ? mix(ch.blouse, '#000000', 0.3) : ch.blouse) : far ? '#7a1c1e' : '#b8261e'); if (!ch.elder && !ch.plain) for (let i = 0; i < 3; i++) { const t = 0.8 + i * 0.07, c2 = [lerp(a.el[0], a.hand[0], t), lerp(a.el[1], a.hand[1], t)]; dab(x, c2[0], c2[1], 0.02, 0.02, 0, i === 1 ? '#c4261e' : GOLD); } }
    if (man) { const c2 = [lerp(shd[0], a.el[0], 0.45), lerp(shd[1], a.el[1], 0.45)]; const an = Math.atan2(a.el[1] - shd[1], a.el[0] - shd[0]); x.save(); x.translate(c2[0], c2[1]); x.rotate(an); x.fillStyle = GOLD; x.fillRect(-0.012, -0.027, 0.024, 0.054); x.fillStyle = GOLDSH; x.fillRect(-0.012, 0.008, 0.024, 0.019); x.restore(); }
    if (dem) { const c2 = [lerp(a.el[0], a.hand[0], 0.82), lerp(a.el[1], a.hand[1], 0.82)]; dab(x, c2[0], c2[1], 0.03, 0.03, 0, GOLDSH); }
    if (handType !== 'namaste') drawHand(x, a.hand, a.el, handType, c, skinSh);
  };
  // --- back layer: far arm, back hair, quiver, far leg
  x.save(); x.translate(HC[0], HC[1]); x.rotate(headRot); x.scale(HS, HS); drawHeadBack(x, ch, p); x.restore();
  if (monk && p.umbrella) { // parasol in far hand
    const h = aF.hand, top = [h[0] - 0.02, HC[1] - 0.2]; stroke(x, h[0], h[1] + 0.06, top[0], top[1], 0.014, '#4a3a30');
    x.fillStyle = '#7d6f5c'; x.beginPath(); x.moveTo(top[0] - 0.3, top[1] + 0.04); x.quadraticCurveTo(top[0] - 0.2, top[1] - 0.15, top[0], top[1] - 0.17); x.quadraticCurveTo(top[0] + 0.2, top[1] - 0.15, top[0] + 0.3, top[1] + 0.04); x.quadraticCurveTo(top[0], top[1] - 0.03, top[0] - 0.3, top[1] + 0.04); x.fill();
    for (let i = -3; i <= 3; i++) stroke(x, top[0], top[1] - 0.17, top[0] + i * 0.095, top[1] + 0.03 - Math.abs(i) * 0.002, 0.006, '#4a4038', 0.7, i * 0.03);
    for (let i = -4; i <= 4; i++) stroke(x, top[0] + i * 0.07, top[1] + 0.02, top[0] + i * 0.07, top[1] + 0.05, 0.008, '#5a4e42', 0.9);
    dab(x, top[0], top[1] - 0.175, 0.016, 0.02, 0, GOLDSH);
  }
  if ((ch.vanara && !ch.bear) || ch.tail) { const ph = (p.tail || 0); line(x, [add(hip, [-0.05, 0.0]), add(hip, [-0.2, 0.06]), add(hip, [-0.32 + ph * 0.04, -0.06]), add(hip, [-0.33 + ph * 0.06, -0.22]), add(hip, [-0.26 + ph * 0.05, -0.32])], 0.034, ch.fur || ch.skin); dab(x, hip[0] - 0.26 + ph * 0.05, hip[1] - 0.33, 0.03, 0.03, 0, ch.skinSh); }
  if (ch.bow && p.bow === 'F') drawBow(x, aF.hand, p.bowAng);
  if (ch.bow && p.bow === 'B') drawBow(x, add(N, rot([-0.09, 0.03], lean)), 0.3 + lean);
  drawArm(aF, shF, true, p.handF);
  if (ch.bow && p.quiver !== 0) { const q0 = add(N, rot([-0.125, -0.085], lean)), q1 = add(N, rot([-0.035, 0.2], lean)); limb(x, q1, q0, 0.04, 0.055, '#5c3a2a'); stroke(x, q0[0], q0[1], q1[0], q1[1], 0.008, '#c98a4a', 0.5); for (let i = 0; i < 3; i++) { const e = add(q0, rot([-0.012 + i * 0.014, -0.06 - i * 0.008], lean)); stroke(x, q0[0] + (i - 1) * 0.012, q0[1], e[0], e[1], 0.006, '#3a2a22'); stroke(x, e[0], e[1] + 0.02, e[0] - 0.002, e[1] - 0.012, 0.016, i === 1 ? '#c4261e' : '#e8e0d0'); } }
  const drawLeg = (L, far) => {
    const c = far ? clothSh : cloth, s = far ? mix(skin, skinSh, 0.6) : skin, h = add(hip, [far ? 0.024 : -0.022, 0]);
    if (man || dem) {
      const lw = dem ? 1.45 : 1;
      limb(x, L.kn, L.ft, 0.058 * lw, 0.04 * lw, s);
      if (man) { limb(x, h, L.kn, 0.11, 0.085, c); limb(x, L.kn, [lerp(L.kn[0], L.ft[0], 0.5), lerp(L.kn[1], L.ft[1], 0.5)], 0.085, 0.072, c); }
      else { limb(x, h, L.kn, 0.115 * lw, 0.08 * lw, s); }
    } else if (monk) { limb(x, h, L.kn, 0.13, 0.115, c); limb(x, L.kn, add(L.ft, [0, -0.03]), 0.115, 0.1, c); }
    if (!fem) { const an = p.lN[0] - p.lN[1]; blob(x, [[L.ft[0] - 0.03, L.ft[1] - 0.012], [L.ft[0] + 0.03, L.ft[1] - 0.014], [L.ft[0] + 0.075, L.ft[1] + 0.012], [L.ft[0] + 0.06, L.ft[1] + 0.024], [L.ft[0] - 0.03, L.ft[1] + 0.022]], s); }
  };
  if (!fem && p.sit < 0.5) drawLeg(LF, true);
  // --- woman: pallu tail behind + skirt
  if (fem) {
    blob(x, [add(N, rot([0.06, 0.0], lean)), add(N, rot([-0.03, 0.0], lean)), add(N, rot([-0.095, 0.05], lean)), add(hip, [-0.118 + p.pleat, 0.04]), add(hip, [-0.07 + p.pleat, 0.06]), add(N, rot([-0.06, 0.12], lean))], clothSh);
    line(x, [add(hip, [-0.12 + p.pleat, 0.04]), add(hip, [-0.07 + p.pleat, 0.062])], 0.02, ch.border);
    const hem = -0.012, sw = p.pleat;
    blob(x, [[-0.078, hipY - 0.02], [-0.1, hipY + 0.2], [-0.125 + sw, hem - 0.05], [-0.13 + sw, hem], [0.0 + sw, hem + 0.008], [0.145 + sw, hem], [0.135 + sw, hem - 0.06], [0.1, hipY + 0.2], [0.075, hipY - 0.02]], cloth, 1, 0.35);
    blob(x, [[-0.078, hipY - 0.02], [-0.1, hipY + 0.2], [-0.125 + sw, hem - 0.05], [-0.13 + sw, hem], [-0.04 + sw, hem + 0.004], [-0.03, hipY + 0.2], [-0.02, hipY]], clothSh, 0.7, 0.35);
    for (let i = 0; i < 5; i++) stroke(x, 0.045 + i * 0.004, hipY + 0.02, 0.02 + i * 0.03 + sw, hem - 0.03, 0.006, clothSh, 0.7, 0.04);
    line(x, [[-0.128 + sw, hem - 0.018], [0.0 + sw, hem - 0.008], [0.142 + sw, hem - 0.018]], 0.034, ch.border); if (!ch.elder && !ch.plain) line(x, [[-0.126 + sw, hem - 0.044], [0.0 + sw, hem - 0.034], [0.14 + sw, hem - 0.044]], 0.008, GOLD, 0.9);
    dab(x, 0.07 + sw, hem + 0.004, 0.035, 0.012, 0, skin); dab(x, -0.02 + sw, hem + 0.004, 0.03, 0.011, 0, mix(skin, skinSh, 0.5));
  }
  // --- seated lap (monk)
  if (p.sit >= 0.5) { blob(x, [[-0.16, hipY - 0.02], [-0.21, hipY + 0.06], [-0.1, hipY + 0.092], [0.14, hipY + 0.092], [0.27, hipY + 0.07], [0.25, hipY + 0.0], [0.1, hipY - 0.05]], cloth, 1, 0.4); blob(x, [[-0.16, hipY + 0.02], [-0.2, hipY + 0.07], [0.05, hipY + 0.092], [0.02, hipY + 0.04]], clothSh, 0.7); dab(x, 0.2, hipY + 0.078, 0.05, 0.016, 0, skin); }
  else if (!fem) drawLeg(LN, false);
  if (monk && p.sit < 0.5) { const b0 = [Math.min(LN.ft[0], LF.ft[0]) - 0.06, Math.max(LN.ft[1], LF.ft[1]) - 0.035], b1 = [Math.max(LN.ft[0], LF.ft[0]) + 0.06, b0[1]]; blob(x, [add(hip, [-0.085, 0]), b0, [(b0[0] + b1[0]) / 2, b0[1] + 0.012], b1, add(hip, [0.085, 0])], cloth, 1, 0.3); for (let i = 0; i < 4; i++) stroke(x, hip[0] - 0.03 + i * 0.03, hip[1] + 0.04, lerp(b0[0], b1[0], 0.2 + i * 0.2), b0[1], 0.007, clothSh, 0.7); blob(x, [add(hip, [-0.085, 0]), b0, [lerp(b0[0], b1[0], 0.3), b0[1] + 0.008], add(hip, [-0.02, 0.1])], clothSh, 0.6); }
  // --- torso
  const tp = pts => pts.map(q => add(hip, rot([q[0] * bw, q[1]], lean)));
  if (man || dem) {
    blob(x, tp([[-0.072, 0.0], [-0.068, -0.1], [-0.094, -0.24], [-0.08, -0.3], [-0.02, -0.315], [0.045, -0.312], [0.088, -0.29], [0.092, -0.21], [0.066, -0.1], [0.072, 0.0], [0, 0.03]]), skin, 1, 0.4);
    blob(x, tp([[-0.072, 0.0], [-0.068, -0.1], [-0.094, -0.24], [-0.08, -0.3], [-0.03, -0.29], [-0.035, -0.12], [-0.02, 0.02]]), skinSh, 0.5, 0.4);
    line(x, tp([[0.03, -0.215], [0.06, -0.2], [0.082, -0.215]]), 0.006, skinSh, 0.6);
    if (man) {
      line(x, tp([[0.075, -0.295], [0.02, -0.17], [-0.07, -0.03]]), 0.042, ch.sash); line(x, tp([[0.082, -0.285], [0.03, -0.165], [-0.058, -0.03]]), 0.008, mix(ch.sash, '#ffffff', 0.4), 0.6);
      line(x, tp([[-0.035, -0.3], [0.02, -0.255], [0.07, -0.292]]), 0.014, GOLD);
      if (ch.god) { for (let i = 0; i < 9; i++) { const t = i / 8, q = add(hip, rot([lerp(-0.06, 0.07, t) * bw, -0.3 + Math.sin(t * Math.PI) * 0.17], lean)); dab(x, q[0], q[1], 0.016, 0.016, 0, i % 2 ? '#d42a2a' : '#f0503a'); } } dab(x, add(hip, rot([0.02, -0.248], lean))[0], add(hip, rot([0.02, -0.248], lean))[1], 0.014, 0.016, 0, '#c4261e');
      // hip wrap + pleats
      blob(x, tp([[-0.09, -0.035], [-0.088, 0.07], [0, 0.1], [0.09, 0.065], [0.085, -0.04], [0, -0.055]]), cloth, 1, 0.4);
      blob(x, [add(hip, [0.02, -0.02]), add(hip, [0.075, 0.02]), add(hip, [0.07 + p.pleat, 0.27]), add(hip, [0.0 + p.pleat, 0.285])], mix(cloth, '#ffffff', 0.12), 1, 0.2);
      for (let i = 0; i < 3; i++) stroke(x, hip[0] + 0.035 + i * 0.012, hip[1] + 0.0, hip[0] + 0.012 + i * 0.022 + p.pleat, hip[1] + 0.27, 0.006, clothSh, 0.7);
      line(x, tp([[-0.088, -0.03], [0, -0.012], [0.088, -0.035]]), 0.026, ch.sash); line(x, tp([[-0.088, -0.038], [0, -0.02], [0.088, -0.043]]), 0.006, GOLD, 0.8);
    } else {
      blob(x, tp([[-0.085, -0.04], [-0.09, 0.08], [-0.03, 0.16], [0.05, 0.15], [0.09, 0.07], [0.085, -0.04], [0, -0.05]]), cloth, 1, 0.3);
      line(x, tp([[-0.085, -0.035], [0, -0.02], [0.085, -0.04]]), 0.02, GOLDSH);
    }
  } else if (fem) {
    blob(x, tp([[-0.072, 0.0], [-0.062, -0.11], [-0.085, -0.24], [-0.076, -0.3], [-0.02, -0.315], [0.045, -0.31], [0.08, -0.29], [0.09, -0.215], [0.062, -0.11], [0.07, 0.0], [0, 0.03]]), skin, 1, 0.4);
    blob(x, tp([[-0.085, -0.17], [-0.085, -0.24], [-0.076, -0.3], [-0.02, -0.315], [0.045, -0.31], [0.08, -0.29], [0.092, -0.215], [0.086, -0.17], [0.0, -0.155]]), ch.blouse || '#b8261e', 1, 0.4);
    // pallu drape across the chest to the far shoulder
    blob(x, tp([[-0.086, 0.05], [0.082, 0.05], [0.072, -0.1], [0.098, -0.21], [0.086, -0.3], [0.03, -0.318], [-0.02, -0.22], [-0.075, -0.1]]), cloth, 1, 0.3);
    line(x, tp([[-0.078, -0.1], [-0.02, -0.22], [0.03, -0.318]]), 0.022, ch.border); if (!ch.elder && !ch.plain) line(x, tp([[-0.064, -0.09], [-0.006, -0.212], [0.044, -0.31]]), 0.006, GOLD, 0.9);
    for (let i = 0; i < 3; i++) line(x, tp([[-0.03 + i * 0.03, -0.01], [0.02 + i * 0.022, -0.14], [0.05 + i * 0.012, -0.29]]), 0.005, clothSh, 0.6);
    line(x, tp([[-0.03, -0.305], [0.01, -0.262], [0.055, -0.3]]), 0.012, ch.elder || ch.plain ? '#5a2e1c' : GOLD);
  } else if (monk) {
    blob(x, tp([[-0.08, 0.0], [-0.085, -0.1], [-0.092, -0.24], [-0.078, -0.3], [-0.02, -0.315], [0.045, -0.31], [0.085, -0.29], [0.1, -0.2], [0.1, -0.08], [0.08, 0.0], [0, 0.03]]), skin, 1, 0.4);
    blob(x, tp([[-0.086, 0.02], [0.086, 0.02], [0.104, -0.1], [0.1, -0.21], [0.086, -0.3], [0.03, -0.318], [-0.03, -0.2], [-0.09, -0.1]]), cloth, 1, 0.3);
    blob(x, tp([[-0.086, 0.02], [-0.02, 0.02], [-0.03, -0.1], [-0.03, -0.2], [-0.09, -0.1]]), clothSh, 0.6, 0.3);
    for (let i = 0; i < 3; i++) line(x, tp([[-0.02 + i * 0.03, 0.0], [0.03 + i * 0.02, -0.14], [0.05 + i * 0.012, -0.29]]), 0.006, clothSh, 0.7);
    for (let i = 0; i < 13; i++) { const t = i / 12, q = add(hip, rot([lerp(-0.03, 0.07, t) * bw, -0.3 + Math.sin(t * Math.PI) * 0.15], lean)); dab(x, q[0], q[1], 0.0085, 0.0085, 0, '#2c1610'); }
  }
  // --- garland: ch.garland = 'gold' (a jewelled golden chain, e.g. Indra's gift to Vali) | 'flowers' (a flowering creeper, e.g. Sugriva's gajapushpi)
  if (ch.garland || p.garland) {
    const g = p.garland || ch.garland, n = g === 'gold' ? 15 : 13;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), q = add(hip, rot([lerp(-0.07, 0.08, t) * bw, -0.305 + Math.sin(t * Math.PI) * 0.24], lean));
      if (g === 'gold') { dab(x, q[0], q[1], 0.024, 0.021, 0, i % 2 ? '#ffd65a' : GOLD); dab(x, q[0] - 0.006, q[1] - 0.006, 0.008, 0.007, 0, '#fff4c0', 0.9); if (i % 3 === 1) dab(x, q[0], q[1] + 0.004, 0.009, 0.009, 0, i % 2 ? '#c41e3a' : '#2a7a9a'); }
      else { dab(x, q[0], q[1], 0.02, 0.012, t * 3, '#2e7a2a'); if (i % 2 === 0) { dab(x, q[0], q[1], 0.026, 0.023, 0, i % 4 ? '#fbf6ea' : '#f4a8c0'); dab(x, q[0], q[1], 0.006, 0.006, 0, '#e8b23a'); } } }
    if (g === 'gold') { const q = add(hip, rot([0.005 * bw, -0.05], lean)); dab(x, q[0], q[1], 0.036, 0.044, 0, '#ffd65a'); dab(x, q[0], q[1], 0.016, 0.02, 0, '#c41e3a'); }
  }
  // --- braid, head
  if (fem && !ch.elder) { const BR = ch.plain ? ch.hair : GOLD; const b0 = add(N, rot([-0.05, -0.06], lean)), b1 = add(N, rot([-0.05, 0.04], lean)), b2 = add(N, rot([0.0, 0.2], lean)); for (let i = 0; i <= 9; i++) { const t = i / 9, q = [(1 - t) * (1 - t) * b0[0] + 2 * t * (1 - t) * b1[0] + t * t * b2[0], (1 - t) * (1 - t) * b0[1] + 2 * t * (1 - t) * b1[1] + t * t * b2[1]]; dab(x, q[0], q[1], lerp(0.022, 0.012, t), lerp(0.026, 0.016, t), (i % 2 ? 0.5 : -0.5), i % 2 ? '#1a1630' : ch.hair); } dab(x, b2[0], b2[1] + 0.012, 0.01, 0.012, 0, BR); stroke(x, b2[0], b2[1] + 0.02, b2[0] + 0.004, b2[1] + 0.055, 0.014, ch.hair); }
  limb(x, add(N, rot([0.005, 0.01], lean)), add(HC, rot([-0.012, 0.045], headRot)), 0.056 * (dem ? 1.5 : monk ? 1.25 : fem ? 0.82 : 1), 0.048 * (dem ? 1.4 : monk ? 1.2 : fem ? 0.82 : 1), mix(skin, skinSh, 0.55));
  x.save(); x.translate(HC[0], HC[1]); x.rotate(headRot); x.scale(HS, HS); drawHead(x, ch, p); x.restore();
  // --- near arm + things held in the near hand
  if (monk && p.staff) { const h = aN.hand, top = [h[0] + 0.02, h[1] - 0.42], bot = [h[0] - 0.035, Math.min(0, h[1] + 0.55)]; stroke(x, bot[0], bot[1], top[0], top[1], 0.018, '#5a4030'); stroke(x, bot[0] + 0.004, bot[1], top[0] + 0.004, top[1], 0.005, '#a07850', 0.6);
    const pot = [h[0] + 0.012, h[1] - 0.2]; stroke(x, pot[0], pot[1] - 0.05, pot[0] + 0.03, pot[1] + 0.03, 0.005, '#2c1c14'); dab(x, pot[0] + 0.035, pot[1] + 0.07, 0.038, 0.04, 0, '#b8862e'); dab(x, pot[0] + 0.035, pot[1] + 0.03, 0.02, 0.008, 0, '#8a6020'); dab(x, pot[0] + 0.022, pot[1] + 0.06, 0.012, 0.018, 0.3, '#f6dc8a', 0.8); line(x, [[pot[0] + 0.07, pot[1] + 0.06], [pot[0] + 0.1, pot[1] + 0.04], [pot[0] + 0.105, pot[1] + 0.02]], 0.01, '#b8862e'); }
  if (ch.bow && p.bow === 'N') drawBow(x, aN.hand, p.bowAng);
  if (p.pot) { const h = aN.hand; dab(x, h[0] + 0.03, h[1] + 0.005, 0.042, 0.04, 0, '#8a4e3a'); dab(x, h[0] + 0.03, h[1] - 0.034, 0.024, 0.009, 0, '#6a3628'); dab(x, h[0] + 0.016, h[1] - 0.004, 0.012, 0.018, 0.3, '#e8a878', 0.8); }
  drawArm(aN, shN, false, p.handN);
  if (p.handN === 'namaste') { const h = aN.hand; x.save(); x.translate(h[0], h[1]); x.rotate(0.2); blob(x, [[-0.02, 0.022], [-0.022, -0.03], [0.0, -0.078], [0.022, -0.03], [0.02, 0.022]], skin); stroke(x, 0.0, -0.07, 0.0, 0.01, 0.004, skinSh, 0.8); x.restore(); }
  return { hip, N, HC, handN: aN.hand, handF: aF.hand };
}

// ---------- golden deer ----------
function drawDeer(ctx, px, py, s, ph, lift, face = 1) {
  ctx.save(); ctx.translate(px, py - lift); ctx.scale(s * face, s);
  const x = ctx, gold = '#f0bf55', sh = '#b07a2c', ext = Math.sin(ph); // ext: +1 legs stretched, -1 gathered
  glow(x, 0, -0.5, 1.3, '#ffd870', 0.38);
  const legp = (hx, hy, a, b, far) => { const kn = [hx + Math.sin(a) * 0.3, hy + Math.cos(a) * 0.3], ft = [kn[0] + Math.sin(a - b) * 0.34, kn[1] + Math.cos(a - b) * 0.34]; limb(x, [hx, hy], kn, 0.09, 0.05, far ? sh : gold); limb(x, kn, ft, 0.045, 0.03, far ? sh : gold); dab(x, ft[0], ft[1], 0.03, 0.022, 0, '#3a2414'); };
  legp(0.3, -0.5, 0.25 + ext * 0.85, -0.2 + (1 - ext) * 0.5, true); legp(-0.34, -0.5, -0.2 - ext * 0.8, 0.3 + (1 - ext) * 0.55, true);
  blob(x, [[-0.5, -0.62], [-0.3, -0.78], [0.1, -0.76], [0.4, -0.8], [0.5, -0.6], [0.38, -0.44], [0.0, -0.4], [-0.36, -0.42]], gold, 1, 0.45);
  blob(x, [[-0.5, -0.62], [-0.36, -0.42], [0.0, -0.4], [0.38, -0.44], [0.2, -0.5], [-0.2, -0.52]], sh, 0.7, 0.45);
  blob(x, [[0.3, -0.72], [0.48, -1.02], [0.6, -1.06], [0.62, -0.92], [0.5, -0.6]], gold, 1, 0.4);
  blob(x, [[0.5, -1.08], [0.62, -1.16], [0.84, -1.04], [0.86, -0.98], [0.66, -0.94], [0.52, -0.96]], gold, 1, 0.4);
  dab(x, 0.85, -1.01, 0.022, 0.02, 0, '#2a1810'); dab(x, 0.68, -1.06, 0.022, 0.026, 0, '#1a1010'); dab(x, 0.675, -1.066, 0.008, 0.008, 0, '#fff');
  blob(x, [[0.5, -1.12], [0.42, -1.26], [0.52, -1.2], [0.57, -1.1]], gold); blob(x, [[-0.5, -0.66], [-0.6, -0.76], [-0.58, -0.6]], '#fff4d0');
  const ant = (bx, by, dir) => { line(x, [[bx, by], [bx + dir * 0.02, by - 0.2], [bx + dir * 0.12, by - 0.4]], 0.02, '#f8dc8a'); line(x, [[bx + dir * 0.02, by - 0.16], [bx + dir * 0.14, by - 0.2]], 0.014, '#f8dc8a'); line(x, [[bx + dir * 0.06, by - 0.3], [bx - dir * 0.04, by - 0.42]], 0.014, '#f8dc8a'); [[0.12, -0.4, '#7ad8f0'], [0.14, -0.2, '#e84a5a'], [-0.04, -0.42, '#8af0b0']].forEach(g => dab(x, bx + dir * g[0], by + g[1], 0.022, 0.022, 0, g[2])); };
  ant(0.56, -1.14, 1); ant(0.52, -1.14, -0.6);
  [[-0.3, -0.66], [-0.14, -0.7], [0.02, -0.64], [0.18, -0.7], [-0.22, -0.56], [0.1, -0.54], [0.32, -0.6], [-0.4, -0.58], [0.42, -0.86]].forEach(q => dab(x, q[0], q[1], 0.03, 0.026, 0, '#fffbe8', 0.95));
  legp(0.36, -0.5, 0.3 + ext * 0.95, -0.25 + (1 - ext) * 0.55, false); legp(-0.4, -0.5, -0.25 - ext * 0.9, 0.35 + (1 - ext) * 0.6, false);
  ctx.restore();
}

// a warrior-sage's axe (parashu): handle from the hand (x, y) up-and-out, crescent blade at the top. s = figure scale.
function parashu(c, x, y, s, ang = -0.35) {
  c.save(); c.translate(x, y); c.rotate(ang); stroke(c, 0, s * 0.06, 0, -s * 0.34, s * 0.014, '#5a3a22', 1);
  poly(c, [[0, -s * 0.37], [s * 0.06, -s * 0.4], [s * 0.12, -s * 0.42], [s * 0.15, -s * 0.36], [s * 0.16, -s * 0.31], [s * 0.14, -s * 0.25], [s * 0.1, -s * 0.22], [s * 0.05, -s * 0.25], [0, -s * 0.27]], '#c8ccd4'); line(c, [[s * 0.1, -s * 0.42], [s * 0.15, -s * 0.33], [s * 0.12, -s * 0.24]], s * 0.008, '#f4f6ff', 0.9);
  c.restore();
}

