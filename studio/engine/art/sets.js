// ===== storyreel-studio art library: painted sets (sky, hills, trees, huts, river, forest, palace, court, shore + bridge,
// battlefield, dawn peak, open sky + sun, Himalaya + herb peak, manuscript) and effects (fire, embers, mist, glow, thunderbolt, wind, torch) =====
// ===== Locations: forest hermitage, deep forest, hut doorway, palm-leaf manuscript — nocturne gouache =====
const SKY = {
  dusk: [[0, '#0b1033'], [.34, '#1b2159'], [.6, '#44306f'], [.78, '#7a4a7c'], [.9, '#b9614f'], [1, '#e08c52']],
  night: [[0, '#060a22'], [.4, '#0f1947'], [.7, '#212868'], [.9, '#383676'], [1, '#4d4589']],
  end: [[0, '#080c28'], [.4, '#141d50'], [.68, '#2c2c70'], [.86, '#5a4384'], [1, '#93607e']],
};
const HORIZON = 880;

function paintSky(x, r, tod, moon = [780, 330, 60], horizon = HORIZON) {
  wash(x, r, -M, -M, W + 2 * M, horizon + M + 40, SKY[tod], { n: 520, alpha: 0.4, th: [26, 80], len: [240, 700] });
  // cloud streaks
  for (let i = 0; i < 9; i++) {
    const cy = 120 + r() * (horizon - 330), cx = r() * W, L = 260 + r() * 420, t = cy / horizon;
    const dark = mix(gradCol(SKY[tod], t), '#0a0c28', 0.35), lit = mix(gradCol(SKY[tod], t), tod === 'dusk' && t > .6 ? '#f0a070' : '#9a9ad8', 0.4);
    for (let k = 0; k < 6; k++) stroke(x, cx - L / 2 + r() * 60, cy + k * 7 + r() * 8, cx + L / 2 - r() * 60, cy + k * 7 + r() * 8, 16 + r() * 16, k > 3 ? lit : dark, 0.35, (r() - .5) * .04);
  }
  // stars
  const ns = tod === 'dusk' ? 40 : 110;
  for (let i = 0; i < ns; i++) { const sx = -M + r() * (W + 2 * M), sy = -M + r() * (horizon * 0.72 + M); dab(x, sx, sy, 1.2 + r() * 2.2, 1.2 + r() * 2.2, 0, r() < .2 ? '#ffe9b0' : '#e6e6ff', (0.35 + r() * 0.6) * (1 - sy / horizon * 0.8)); }
  // moon with painted halo
  if (moon) {
    const [mx, my, mr] = moon;
    glow(x, mx, my, mr * 5.2, '#bfc4ff', tod === 'dusk' ? 0.16 : 0.26); glow(x, mx, my, mr * 2.3, '#f3ecd0', 0.35);
    for (let i = 0; i < 40; i++) { const a = r() * TAU, rr = mr * (1.25 + r() * 1.6); stroke(x, mx + Math.cos(a) * rr, my + Math.sin(a) * rr, mx + Math.cos(a + .35) * rr, my + Math.sin(a + .35) * rr, 10 + r() * 14, '#cfd0ff', 0.07); }
    dab(x, mx, my, mr, mr, 0, '#f4edd2'); dab(x, mx - mr * .18, my - mr * .1, mr * .8, mr * .82, 0, '#fbf6e2', 0.9);
    for (let i = 0; i < 9; i++) dab(x, mx + (r() - .4) * mr, my + (r() - .4) * mr, mr * (0.1 + r() * 0.16), mr * (0.08 + r() * 0.1), r() * 3, '#d9cfae', 0.45);
  }
}
function paintHills(x, r, tod, horizon = HORIZON) {
  const far = tod === 'dusk' ? '#4a356e' : '#262a66', near = tod === 'dusk' ? '#2c2558' : '#171c4c';
  [[far, 150, 0.9], [near, 95, 1.6]].forEach(([col, amp, rough], k) => {
    const pts = ridge(r, -M, W + M, horizon + 6 - k * 4, amp, 26, rough); x.beginPath(); x.moveTo(-M, horizon + 60); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(W + M, horizon + 60); x.closePath(); x.fillStyle = col; x.fill();
    x.save(); x.clip(); for (let i = 0; i < 160; i++) { const px = -M + r() * (W + 2 * M), py = horizon - r() * amp; stroke(x, px, py, px + 40 + r() * 90, py + 10 + r() * 22, 12 + r() * 20, jit(col, r, 14), 0.4); }
    const g = x.createLinearGradient(0, horizon - 70, 0, horizon + 10); g.addColorStop(0, rgba('#8f7fc0', 0)); g.addColorStop(1, rgba(tod === 'dusk' ? '#c98a8a' : '#7f7fc8', 0.38)); x.fillStyle = g; x.fillRect(-M, horizon - 70, W + 2 * M, 90); x.restore();
  });
}
function paintTree(x, r, bx, by, h, spread, o = {}) {
  const { dark = '#0a1728', mid = '#123040', lit = '#2e6068', hi = '#5a8f90', litDir = 1, n = 320 } = o;
  // trunk + limbs
  const top = [bx + spread * 0.12, by - h * 0.55];
  x.fillStyle = '#0b0f20'; x.beginPath(); x.moveTo(bx - h * 0.045, by); x.quadraticCurveTo(bx - h * 0.02, by - h * 0.3, top[0] - h * 0.02, top[1]); x.lineTo(top[0] + h * 0.02, top[1]); x.quadraticCurveTo(bx + h * 0.03, by - h * 0.3, bx + h * 0.06, by); x.closePath(); x.fill();
  for (let i = 0; i < 5; i++) stroke(x, top[0], top[1] + i * h * 0.05, top[0] + (r() - .5) * spread * 1.2, top[1] - h * (0.12 + r() * 0.25), h * 0.016, '#0b0f20', 1, (r() - .5) * .4);
  for (let i = 0; i < 12; i++) stroke(x, bx - h * 0.02 + r() * h * 0.05, by - r() * h * 0.5, bx - h * 0.02 + r() * h * 0.05, by - r() * h * 0.5 - 60, 5, '#2a2a4a', 0.35);
  // canopy: layered dabs dark -> lit
  const cx = bx + spread * 0.1, cy = by - h * 0.78, rx = spread, ry = h * 0.36;
  const pick = () => { const a = r() * TAU, d = Math.sqrt(r()); return [cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d * (0.8 + 0.3 * Math.cos(a * 3))]; };
  for (let i = 0; i < n; i++) { const p = pick(); dab(x, p[0], p[1], 34 + r() * 60, 22 + r() * 34, r() * 3, jit(dark, r, 8), 0.95); }
  for (let i = 0; i < n * 0.7; i++) { const p = pick(); dab(x, p[0], p[1], 20 + r() * 40, 12 + r() * 22, r() * 3, jit(mid, r, 10), 0.8); }
  for (let i = 0; i < n * 0.55; i++) { const p = pick(); const f = (p[0] - cx) / rx * litDir - (p[1] - cy) / ry; if (f < 0.1 + r() * 0.5) continue; dab(x, p[0], p[1], 12 + r() * 24, 6 + r() * 11, -0.5 + r(), jit(r() < .25 ? hi : lit, r, 12), 0.75); }
}
function paintHut(x, r, cx, base, w, h, o = {}) {
  const { glowA = 0.5, moonSide = 1, warm = '#a9824e' } = o;
  const eave = base - h * 0.44, apex = base - h, ww = w * 0.74;
  // wall
  x.fillStyle = '#28243c'; x.beginPath(); x.moveTo(cx - ww / 2, base); x.lineTo(cx - ww / 2 + 10, eave - 10); x.lineTo(cx + ww / 2 - 10, eave - 10); x.lineTo(cx + ww / 2, base); x.closePath(); x.fill();
  for (let i = 0; i < 90; i++) { const px = cx - ww / 2 + r() * ww, py = eave + r() * (base - eave); stroke(x, px, py, px + (r() - .5) * 6, py + 30 + r() * 70, 5 + r() * 7, r() < .5 ? '#352f4c' : '#1e1a30', 0.6); }
  for (let i = 0; i < 6; i++) { const py = eave + 30 + i * (base - eave - 40) / 5; stroke(x, cx - ww / 2 + 8, py, cx + ww / 2 - 8, py + (r() - .5) * 6, 4, '#4a4260', 0.5); }
  // door
  const dw = w * 0.2, dh = h * 0.34;
  x.fillStyle = '#0c0916'; x.beginPath(); x.moveTo(cx - dw / 2, base); x.lineTo(cx - dw / 2, base - dh + 14); x.quadraticCurveTo(cx, base - dh - 14, cx + dw / 2, base - dh + 14); x.lineTo(cx + dw / 2, base); x.closePath(); x.fill();
  if (glowA > 0) { x.save(); x.clip(); const g = x.createRadialGradient(cx, base - dh * 0.25, 4, cx, base - dh * 0.3, dh * 0.95); g.addColorStop(0, rgba('#ffd27a', glowA)); g.addColorStop(.5, rgba('#e2742c', glowA * 0.75)); g.addColorStop(1, rgba('#5a1e1a', 0)); x.fillStyle = g; x.fillRect(cx - dw, base - dh - 20, dw * 2, dh + 20); x.restore(); }
  stroke(x, cx - dw / 2 - 5, base, cx - dw / 2 - 5, base - dh, 9, '#6f6258', 0.9); stroke(x, cx + dw / 2 + 5, base, cx + dw / 2 + 5, base - dh, 9, '#6f6258', 0.9);
  stroke(x, cx - ww / 2 + 4, base, cx - ww / 2 + 12, eave, 10, '#5d5350', 0.9); stroke(x, cx + ww / 2 - 4, base, cx + ww / 2 - 12, eave, 10, '#5d5350', 0.9);
  // thatch roof
  const L = [cx - w * 0.6, eave + h * 0.06], R = [cx + w * 0.6, eave + h * 0.06];
  x.fillStyle = '#463c4e'; x.beginPath(); x.moveTo(L[0], L[1]); x.quadraticCurveTo(cx - w * 0.3, apex + h * 0.16, cx, apex); x.quadraticCurveTo(cx + w * 0.3, apex + h * 0.16, R[0], R[1]); x.quadraticCurveTo(cx, eave - h * 0.03, L[0], L[1]); x.closePath(); x.fill();
  x.save(); x.clip();
  for (let i = 0; i < 520; i++) {
    const a = (r() - .5) * 1.9, d0 = r() * 0.8, d1 = d0 + 0.14 + r() * 0.22, len = h * 0.62;
    const sx = cx + Math.sin(a) * d0 * w * 0.72, sy = apex + Math.cos(a) * d0 * len, ex = cx + Math.sin(a) * d1 * w * 0.72, ey = apex + Math.cos(a) * d1 * len;
    const side = Math.sin(a) * moonSide, col = side > 0.25 && r() < .55 ? (r() < .5 ? '#8a86b8' : '#a39bc4') : [r() < .2 ? warm : '#6b5a55', '#3a3247', '#584a58', '#2c2740'][Math.floor(r() * 4)];
    bristle(x, r, sx, sy, ex, ey, 8 + r() * 10, col, 0.55, 5);
  }
  if (glowA > 0) { const g = x.createRadialGradient(cx, base - dh, 10, cx, base - dh, w * 0.55); g.addColorStop(0, rgba('#e89a4a', glowA * 0.5)); g.addColorStop(1, rgba('#e89a4a', 0)); x.fillStyle = g; x.fillRect(cx - w, apex, w * 2, h); }
  x.restore();
  for (let i = 0; i < 70; i++) { const t = r(), px = lerp(L[0], R[0], t), py = L[1] - Math.sin(t * Math.PI) * h * 0.075; stroke(x, px, py - 6, px + (r() - .5) * 8, py + 14 + r() * 22, 3 + r() * 4, r() < .4 ? '#7a6a5c' : '#3d3447', 0.85); }
  dab(x, cx, apex + 4, 16, 22, 0, '#3a3247'); stroke(x, cx, apex - 4, cx, apex - 34, 6, '#4a4052');
  if (glowA > 0) { x.save(); x.translate(cx, base + 30); x.scale(1, 0.3); const g = x.createRadialGradient(0, 0, 4, 0, 0, w * 0.5); g.addColorStop(0, rgba('#f0a04a', glowA * 0.55)); g.addColorStop(1, rgba('#f0a04a', 0)); x.fillStyle = g; x.fillRect(-w, -w, w * 2, w * 2); x.restore(); }
}
function paintGround(x, r, top, tod, o = {}) {
  const stops = tod === 'dusk' ? [[0, '#22384a'], [.25, '#172b3e'], [1, '#081526']] : [[0, '#183440'], [.25, '#0f2434'], [1, '#060f20']];
  x.save(); x.beginPath(); x.moveTo(-M, top + 20); for (let i = 0; i <= 20; i++) x.lineTo(-M + i * (W + 2 * M) / 20, top + Math.sin(i * 1.7) * 7 + (i % 3) * 3); x.lineTo(W + M, H + M); x.lineTo(-M, H + M); x.closePath(); x.clip();
  wash(x, r, -M, top - 10, W + 2 * M, H + M - top + 10, stops, { n: 420, alpha: 0.45, th: [16, 50], len: [120, 420] });
  // trodden path
  if (o.path) { const [px, py, pw] = o.path; for (let i = 0; i < 90; i++) { const t = r(), yy = lerp(py, H + M, t), ww = pw * (0.5 + t * 2.2); stroke(x, px - ww / 2 + r() * ww * .6 + t * (o.pathDx || 0), yy, px - ww / 2 + r() * ww * .6 + ww * .4 + t * (o.pathDx || 0), yy + (r() - .5) * 8, 10 + r() * 20, jit('#3b3658', r, 10), 0.28); } }
  for (let i = 0; i < 700; i++) { const px = -M + r() * (W + 2 * M), t = Math.pow(r(), 0.7), py = lerp(top + 8, H + M, t), hh = 8 + t * 34 + r() * 14; stroke(x, px, py, px + (r() - .5) * hh * 0.7, py - hh, 2 + t * 3.5, jit(r() < .22 ? '#3f7a70' : (r() < .5 ? '#1f4a4c' : '#0a1c2a'), r, 10), 0.75, (r() - .5) * .3); }
  x.restore();
}

// ---- forest hermitage by a river (wide) ----
function buildHermitage(tod) {
  const r = rng(tod === 'dusk' ? 11 : tod === 'night' ? 22 : 33);
  const sky = newLayer(0.05), far = newLayer(0.25), mid = newLayer(0.6), fg = newLayer(1.25);
  paintSky(sky.x, r, tod);
  paintHills(far.x, r, tod);
  // river band (static part)
  const rv = tod === 'dusk' ? [[0, '#6a4674'], [.4, '#3a3068'], [1, '#1c2050']] : [[0, '#3c3a7c'], [.4, '#222864'], [1, '#121844']];
  wash(far.x, r, -M, HORIZON - 4, W + 2 * M, 150, rv, { n: 240, alpha: 0.5, th: [6, 16], len: [120, 420] });
  for (let i = 0; i < 26; i++) { const px = -M + r() * (W + 2 * M), py = HORIZON - 6 + r() * 10; dab(far.x, px, py - 8, 22 + r() * 40, 9 + r() * 14, 0, jit('#151a44', r, 6), 0.95); }
  for (let i = 0; i < 16; i++) { const px = 40 + r() * (W - 80), py = HORIZON + 40 + r() * 80, s = 0.6 + (py - HORIZON) / 120; dab(far.x, px, py, 30 * s, 8 * s, 0, '#122c3a', 0.95); stroke(far.x, px - 26 * s, py - 3, px + 20 * s, py - 6 * s * 0.5, 2.5, '#3c7a78', 0.7); if (r() < .45) { dab(far.x, px + 6, py - 9 * s, 7 * s, 6 * s, 0, '#e3b3cc', 0.9); dab(far.x, px + 6, py - 11 * s, 3.5 * s, 4 * s, 0, '#f6dde6', 0.9); } }
  // ground with hut + mango tree
  paintGround(mid.x, r, HORIZON + 118, tod, { path: [800, 1160, 90], pathDx: -260 });
  paintTree(mid.x, r, 990, 1090, 620, 250, { n: 150, litDir: -1 });
  paintHut(mid.x, r, 800, 1170, 520, 540, { glowA: tod === 'dusk' ? 0.35 : 0.75, moonSide: 1 });
  // clay pots by the door
  [[965, 1182, 30], [1012, 1196, 22]].forEach(([px, py, s]) => { dab(mid.x, px, py, s, s * 0.9, 0, '#5d3830'); dab(mid.x, px, py - s * 0.85, s * 0.5, s * 0.22, 0, '#7a4a3c'); stroke(mid.x, px - s * 0.7, py - s * 0.3, px - s * 0.3, py - s * 0.75, 4, '#c7805a', 0.55); });
  paintTree(mid.x, r, 120, 1300, 1050, 430, { n: 380, litDir: 1 });
  // foreground: dark grass + overhanging leaves
  const f = fg.x;
  for (let i = 0; i < 260; i++) { const px = -M + r() * (W + 2 * M), py = H + 40 + r() * 60, hh = 120 + r() * 200; stroke(f, px, py, px + (r() - .5) * 120, py - hh, 6 + r() * 9, jit(r() < .15 ? '#18404a' : '#050d1c', r, 6), 1, (r() - .5) * .5); }
  for (let i = 0; i < 70; i++) { const a = r() * 1.2 - 0.2, px = -60 + r() * 420, py = -90 + r() * 240; dab(f, px, py, 70 + r() * 60, 20 + r() * 16, a, jit('#050c1a', r, 5), 1); }
  return { tod, layers: [sky, far, mid, fg], sky, far, mid, fg };
}
// animated river glitter + moon path (drawn live on top of the 'far' layer)
function riverLive(ctx, t, tod, motion = 1) {
  for (let i = 0; i < 70; i++) {
    const h1 = hash(i * 3.3), h2 = hash(i * 9.7), y = HORIZON + 14 + h2 * 110, col = Math.abs(h1 * W - 780) < 150 ? '#f1e6c4' : (tod === 'dusk' ? '#e2a084' : '#9aa0e8');
    const x = h1 * (W + 200) - 100 + Math.sin(t * (0.5 + h2) * motion + i) * 16, a = (0.25 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(t * (1.2 + h1 * 2) * motion + i * 2.1), 2)) * (Math.abs(h1 * W - 780) < 150 ? 1 : 0.55);
    stroke(ctx, x, y, x + 26 + h2 * 60, y, 2.5 + h2 * 3, col, a);
  }
}

// ---- Hook shot: low angle on the ground in front of the hut ----
function buildHook() {
  const r = rng(51), sky = newLayer(0.05), mid = newLayer(0.5), fg = newLayer(1.2);
  paintSky(sky.x, r, 'dusk', [860, 250, 52], 980);
  paintHills(sky.x, r, 'dusk', 990);
  paintTree(mid.x, r, 40, 1080, 900, 330, { n: 240 });
  paintGround(mid.x, r, 1010, 'dusk', { path: [540, 1060, 150] });
  paintHut(mid.x, r, 560, 1060, 760, 740, { glowA: 0.45, moonSide: 1 });
  for (let i = 0; i < 200; i++) { const px = -M + r() * (W + 2 * M), py = H + 50 + r() * 40, hh = 90 + r() * 190; stroke(fg.x, px, py, px + (r() - .5) * 110, py - hh, 6 + r() * 10, jit(r() < .2 ? '#1c4850' : '#050d1c', r, 6), 1, (r() - .5) * .5); }
  return { layers: [sky, mid, fg], sky, mid, fg };
}

// ---- Deep forest ----
function buildForest() {
  const r = rng(77), back = newLayer(0.05), l1 = newLayer(0.3), l2 = newLayer(0.55), l3 = newLayer(0.85), fg = newLayer(1.3);
  wash(back.x, r, -M, -M, W + 2 * M, H + 2 * M, [[0, '#0d0b2e'], [.3, '#2a2160'], [.52, '#6a4a94'], [.62, '#9a6aa6'], [.75, '#3a2a68'], [1, '#100c2c']], { n: 600, alpha: 0.35, th: [30, 90], len: [200, 600] });
  glow(back.x, 560, 1010, 620, '#e0a6cc', 0.42); glow(back.x, 560, 1010, 260, '#f6d6e0', 0.35);
  const trunks = (L, n, col, wMin, wMax, baseMin, baseMax, hi) => {
    for (let i = 0; i < n; i++) {
      const bx = -M + (i + r()) / n * (W + 2 * M), by = lerp(baseMin, baseMax, r()), ww = lerp(wMin, wMax, r()), lean = (r() - .5) * 90, c = jit(col, r, 8);
      const x = L.x; x.fillStyle = c; x.beginPath(); x.moveTo(bx - ww * 0.8, by); x.quadraticCurveTo(bx - ww * 0.4 + lean * 0.3, by - 500, bx + lean - ww * 0.3, -M); x.lineTo(bx + lean + ww * 0.3, -M); x.quadraticCurveTo(bx + ww * 0.4 + lean * 0.3, by - 500, bx + ww * 0.8, by); x.closePath(); x.fill();
      if (hi) for (let k = 0; k < 9; k++) { const t = r(), yy = lerp(by, -M, t), xx = bx + lean * t * t + ww * 0.28; stroke(x, xx, yy, xx + lean * 0.02, yy - 50 - r() * 90, ww * 0.12, hi, 0.5); }
      if (r() < .6) { const yy = by - 300 - r() * 700, dir = r() < .5 ? -1 : 1; stroke(x, bx + lean * 0.3, yy, bx + dir * (90 + r() * 160), yy - 110 - r() * 120, ww * 0.22, c, 1, dir * 0.2); }
    }
  };
  trunks(l1, 15, '#6c5596', 12, 24, 1040, 1120, null);
  mist(l1.x, 0, 3, 7, [-M, 900, W + 2 * M, 300], '#c79ad0', 0.3, 0);
  trunks(l2, 9, '#3b2f70', 28, 46, 1150, 1270, '#7a66b0');
  const g2 = l2.x; for (let i = 0; i < 120; i++) { const px = -M + r() * (W + 2 * M), py = 1180 + r() * 140; dab(g2, px, py, 40 + r() * 60, 12 + r() * 16, 0, jit('#2b235c', r, 8), 0.9); }
  // near ground + path
  const g = l3.x; g.save(); g.beginPath(); g.moveTo(-M, 1290); for (let i = 0; i <= 12; i++) g.lineTo(-M + i * (W + 2 * M) / 12, 1280 + Math.sin(i * 2.1) * 14); g.lineTo(W + M, H + M); g.lineTo(-M, H + M); g.closePath(); g.clip();
  wash(g, r, -M, 1260, W + 2 * M, H + M - 1260, [[0, '#2a2260'], [.3, '#181444'], [1, '#07071c']], { n: 300, alpha: 0.45, th: [18, 50] });
  for (let i = 0; i < 140; i++) { const t = r(), yy = lerp(1285, H + M, t), ww = 60 + t * 620, cx = 560 - t * 60; stroke(g, cx - ww / 2 + r() * ww * 0.7, yy, cx - ww / 2 + r() * ww * 0.7 + ww * 0.3, yy + (r() - .5) * 10, 10 + t * 26, jit('#4a3c84', r, 10), 0.3); }
  for (let i = 0; i < 380; i++) { const px = -M + r() * (W + 2 * M), t = Math.pow(r(), .8), py = lerp(1290, H + M, t), hh = 12 + t * 40; if (Math.abs(px - (560 - t * 60)) < 40 + t * 280 && r() < .8) continue; stroke(g, px, py, px + (r() - .5) * hh, py - hh, 3 + t * 4, jit(r() < .2 ? '#4a4a9a' : '#0c0a2a', r, 8), 0.8, (r() - .5) * .4); }
  g.restore();
  trunks(l3, 4, '#17143c', 54, 84, 1330, 1460, '#4a3f86');
  // foreground frame
  const f = fg.x; f.fillStyle = '#07081a';
  [[-70, 150], [1085, 130]].forEach(([bx, ww], k) => { f.beginPath(); f.moveTo(bx - ww, H + M); f.quadraticCurveTo(bx - ww * 0.3, 900, bx - ww * 0.5 + (k ? 60 : -40), -M); f.lineTo(bx + ww * 0.5 + (k ? 60 : -40), -M); f.quadraticCurveTo(bx + ww * 0.4, 900, bx + ww, H + M); f.closePath(); f.fill(); });
  for (let i = 0; i < 120; i++) { const px = -M + r() * (W + 2 * M), py = -M + r() * 300 * Math.abs(px - 540) / 540; dab(f, px, py, 60 + r() * 70, 18 + r() * 16, r() * 3, jit('#07081a', r, 4), 1); }
  for (let i = 0; i < 150; i++) { const px = -M + r() * (W + 2 * M), py = H + 60, hh = 100 + r() * 190; stroke(f, px, py, px + (r() - .5) * 130, py - hh, 7 + r() * 10, jit('#06071a', r, 5), 1, (r() - .5) * .5); }
  return { layers: [back, l1, l2, l3, fg], back, l1, l2, l3, fg };
}

// ---- Hut doorway (close) ----
const DOOR = { x0: 350, x1: 750, top: 650, base: 1262, eaveL: [-40, 610], eaveR: [1260, 470] };
function buildDoorway(tod) {
  const r = rng(tod === 'dusk' ? 91 : 92), sky = newLayer(0.08), hut = newLayer(0.8), fg = newLayer(1.2), lit = tod !== 'dusk';
  paintSky(sky.x, r, lit ? 'night' : 'dusk', null, 1080); paintHills(sky.x, r, lit ? 'night' : 'dusk', 1090);
  if (!lit) { glow(sky.x, 70, 1050, 300, '#f08a4a', 0.55); dab(sky.x, 70, 1062, 46, 46, 0, '#f6a860'); dab(sky.x, 70, 1062, 34, 34, 0, '#ffd9a0', 0.8); }
  paintHills(sky.x, r, lit ? 'night' : 'dusk', 1150);
  const x = hut.x, D = DOOR;
  // ground
  paintGround(x, r, 1250, lit ? 'night' : 'dusk', { path: [540, 1262, 420] });
  // wall
  const eaveY = px => lerp(D.eaveL[1], D.eaveR[1], (px - D.eaveL[0]) / (D.eaveR[0] - D.eaveL[0]));
  x.fillStyle = '#231f38'; x.beginPath(); x.moveTo(170, D.base + 6); x.lineTo(170, eaveY(170) - 30); x.lineTo(W + M, eaveY(W + M) - 30); x.lineTo(W + M, D.base + 6); x.closePath(); x.fill();
  for (let i = 0; i < 520; i++) { const px = 175 + r() * (W + M - 175), py = 560 + r() * (D.base - 560); stroke(x, px, py, px + (r() - .5) * 8, py + 40 + r() * 90, 5 + r() * 8, ['#322c4c', '#1b1830', '#3e3656', '#272240'][Math.floor(r() * 4)], 0.6); }
  for (let i = 0; i < 9; i++) { const py = 640 + i * 72; stroke(x, 176, py + 14, W + M, py - 6 + (r() - .5) * 8, 5, '#4a4262', 0.5); }
  // doorway
  x.fillStyle = '#0a0814'; x.fillRect(D.x0, D.top, D.x1 - D.x0, D.base - D.top + 4);
  if (lit) {
    x.save(); x.beginPath(); x.rect(D.x0, D.top, D.x1 - D.x0, D.base - D.top + 4); x.clip();
    const g = x.createRadialGradient(610, 1120, 6, 600, 1080, 520); g.addColorStop(0, rgba('#ffd98a', 0.95)); g.addColorStop(.25, rgba('#f09a3c', 0.7)); g.addColorStop(.7, rgba('#8a3320', 0.35)); g.addColorStop(1, rgba('#2a1020', 0)); x.fillStyle = g; x.fillRect(D.x0, D.top, 400, 620);
    for (let i = 0; i < 60; i++) { const px = D.x0 + r() * 400, py = D.top + r() * 600; stroke(x, px, py, px + 30 + r() * 60, py + (r() - .5) * 20, 14 + r() * 20, r() < .5 ? '#f0a04a' : '#7a2c20', 0.12); }
    x.restore();
  } else { x.save(); x.beginPath(); x.rect(D.x0, D.top, 400, 616); x.clip(); glow(x, 550, 1200, 380, '#8a4a5a', 0.3); x.restore(); }
  // bamboo jambs, lintel, corner post
  const bamboo = (x1, y1, x2, y2, w) => { stroke(x, x1, y1, x2, y2, w, '#55493f'); stroke(x, x1 - w * 0.22, y1, x2 - w * 0.22, y2, w * 0.3, lit ? '#b98a55' : '#8a7a78', 0.7); const n = Math.floor(Math.hypot(x2 - x1, y2 - y1) / 120); for (let i = 1; i <= n; i++) { const t = i / (n + 1); stroke(x, lerp(x1, x2, t) - w / 2, lerp(y1, y2, t), lerp(x1, x2, t) + w / 2, lerp(y1, y2, t), 4, '#2c2630', 0.8); } };
  bamboo(D.x0 - 12, D.base + 6, D.x0 - 12, D.top - 30, 26); bamboo(D.x1 + 12, D.base + 6, D.x1 + 12, D.top - 30, 26); bamboo(D.x0 - 44, D.top - 16, D.x1 + 44, D.top - 22, 24); bamboo(182, D.base + 8, 182, 600, 28);
  // warm spill on ground
  if (lit) { x.save(); x.translate(560, 1330); x.scale(1, 0.34); const g = x.createRadialGradient(0, 0, 10, 0, 0, 560); g.addColorStop(0, rgba('#f2a04a', 0.5)); g.addColorStop(1, rgba('#f2a04a', 0)); x.fillStyle = g; x.fillRect(-600, -600, 1200, 1200); x.restore(); }
  // grass mat
  poly(x, [[300, 1322], [700, 1322], [770, 1422], [236, 1422]], lit ? '#6a5f44' : '#474a50');
  for (let i = 0; i < 26; i++) { const t = i / 25; stroke(x, lerp(300, 236, t) + 6, lerp(1322, 1422, t), lerp(700, 770, t) - 6, lerp(1322, 1422, t), 2.5, lit ? '#9a8656' : '#666a70', 0.6); }
  for (let i = 0; i < 16; i++) { const t = i / 15; stroke(x, lerp(300, 700, t), 1324, lerp(236, 770, t), 1420, 2, '#2c2a30', 0.4); }
  // clay pots
  [[905, 1196, 62], [1002, 1226, 44], [948, 1262, 30]].forEach(([px, py, s]) => {
    dab(x, px, py + s * 0.9, s * 1.1, s * 0.22, 0, '#05050f', 0.5);
    dab(x, px, py, s, s * 0.92, 0, '#5a342e'); dab(x, px + s * 0.25, py + s * 0.1, s * 0.7, s * 0.7, 0, '#3c2228', 0.7);
    dab(x, px, py - s * 0.9, s * 0.52, s * 0.2, 0, '#6e4236'); dab(x, px, py - s * 0.92, s * 0.36, s * 0.12, 0, '#1a0f16');
    stroke(x, px - s * 0.72, py - s * 0.25, px - s * 0.35, py - s * 0.72, s * 0.12, lit ? '#e8935a' : '#b57a70', 0.7); for (let k = 0; k < 4; k++) stroke(x, px - s * 0.8, py - s * 0.1 + k * s * 0.18, px + s * 0.8, py - s * 0.1 + k * s * 0.18, 2, '#2c1a20', 0.35, 0.08);
  });
  // thatch roof mass above the eave (fringe is drawn live)
  x.fillStyle = '#3d3449'; x.beginPath(); x.moveTo(-M, -M); x.lineTo(W + M, -M); x.lineTo(W + M, eaveY(W + M)); x.lineTo(-M, eaveY(-M)); x.closePath(); x.fill();
  x.save(); x.clip();
  for (let i = 0; i < 1100; i++) { const px = -M + r() * (W + 2 * M), ey = eaveY(px), py = -M + r() * (ey + M), L = 60 + r() * 110; bristle(x, r, px, py, px - 14 + r() * 10, Math.min(ey + 6, py + L), 9 + r() * 12, ['#6b5a55', '#3a3247', '#584a58', '#2c2740', lit ? '#9a7248' : '#7a6aa0'][Math.floor(r() * 5)], 0.55, 5); }
  const sh = x.createLinearGradient(0, 380, 0, 640); sh.addColorStop(0, 'rgba(8,6,20,0)'); sh.addColorStop(1, 'rgba(8,6,20,0.55)'); x.fillStyle = sh; x.fillRect(-M, 380, W + 2 * M, 300);
  x.restore();
  for (let i = 0; i < 150; i++) { const px = -M + r() * (W + 2 * M), py = H + 50, hh = 70 + r() * 150; stroke(fg.x, px, py, px + (r() - .5) * 100, py - hh, 6 + r() * 9, jit('#050c1a', r, 5), 1, (r() - .5) * .5); }
  return { layers: [sky, hut, fg], sky, hut, fg, eaveY, lit };
}
function thatchFringe(ctx, t, dw, wind = 1) {
  for (let i = 0; i < 210; i++) {
    const h1 = hash(i * 1.7), h2 = hash(i * 4.3), px = -M + i * (W + 2 * M) / 210 + h1 * 6, ey = dw.eaveY(px), L = 34 + h2 * 62;
    const sw = (noise1(t * 0.9 + px * 0.004) * 16 + Math.sin(t * 2.3 + i) * 3) * wind * (0.4 + h1);
    stroke(ctx, px, ey - 8, px + sw, ey + L, 3 + h2 * 4, ['#6b5a55', '#3a3247', '#7d6a58', '#2c2740'][i % 4], 0.95, sw * 0.004);
  }
}

// ---- Palm-leaf manuscript source card ----
function buildManuscript() {
  const r = rng(131), bg = newLayer(0.2), ms = newLayer(0.8);
  const x = bg.x;
  wash(x, r, -M, -M, W + 2 * M, H + 2 * M, [[0, '#0b0714'], [.4, '#1d1018'], [.62, '#3a1f16'], [.8, '#24120f'], [1, '#0a0610']], { n: 520, alpha: 0.4, th: [30, 90] });
  // wooden floor boards hint
  for (let i = 0; i < 80; i++) { const py = 1250 + r() * 800; stroke(x, -M + r() * 300, py, W + M - r() * 300, py + (r() - .5) * 10, 8 + r() * 14, jit('#2c1710', r, 10), 0.35); }
  const m = ms.x;
  // carved stand (rehal)
  const wood = '#4a2817', woodHi = '#8a5230', woodDk = '#24110c';
  poly(m, [[250, 1350], [330, 1350], [760, 1120], [700, 1090]], woodDk); poly(m, [[830, 1350], [750, 1350], [320, 1120], [380, 1090]], wood);
  for (let i = 0; i < 26; i++) { const t = r(); stroke(m, lerp(790, 350, t) + (r() - .5) * 30, lerp(1335, 1105, t), lerp(790, 350, t) + (r() - .5) * 30 - 26, lerp(1335, 1105, t) - 14, 5, r() < .5 ? woodHi : woodDk, 0.55); }
  for (let i = 0; i < 6; i++) { const t = (i + .5) / 6, cx = lerp(790, 350, t), cy = lerp(1335, 1105, t); dab(m, cx, cy, 13, 9, -0.5, woodHi, 0.6); dab(m, cx, cy, 6, 4, -0.5, woodDk, 0.8); }
  dab(m, 540, 1372, 330, 26, 0, '#070409', 0.6);
  // palm leaves stack
  m.save(); m.translate(540, 1050); m.rotate(-0.05);
  for (let k = 5; k >= 0; k--) {
    const oy = k * 13, ox = (k % 2 ? 1 : -1) * k * 5, wv = 860, hv = 92, c = mix('#c9a467', '#7c5a30', k / 7);
    m.fillStyle = c; m.beginPath(); m.moveTo(-wv / 2 + ox, -hv / 2 + oy + 6); m.quadraticCurveTo(ox, -hv / 2 + oy - 6, wv / 2 + ox, -hv / 2 + oy + 6); m.quadraticCurveTo(wv / 2 + ox + 10, oy, wv / 2 + ox, hv / 2 + oy - 6); m.quadraticCurveTo(ox, hv / 2 + oy + 6, -wv / 2 + ox, hv / 2 + oy - 6); m.quadraticCurveTo(-wv / 2 + ox - 10, oy, -wv / 2 + ox, -hv / 2 + oy + 6); m.fill();
    if (k === 0) {
      for (let i = 0; i < 60; i++) stroke(m, -wv / 2 + r() * wv, -hv / 2 + 8 + r() * (hv - 16), -wv / 2 + r() * wv + 80 + r() * 160, -hv / 2 + 8 + r() * (hv - 16), 3 + r() * 5, r() < .5 ? '#e2c183' : '#a8834a', 0.35);
      stroke(m, -wv / 2 + 14, -hv / 2 + 9, wv / 2 - 14, -hv / 2 + 9, 3, '#f0d79e', 0.6);
      m.fillStyle = '#2a1508'; m.font = '600 27px FreeSerif, "Noto Serif Devanagari", serif'; m.textAlign = 'center'; m.textBaseline = 'middle';
      const ML = (typeof SERIES !== 'undefined' && SERIES.manuscript_lines) || ['॥ श्रीः ॥', '॥ इति कथा ॥']; m.fillText(ML[0], -8, -19); m.fillText(ML[1], 8, 19);   // series.json → manuscript_lines (the text painted on the leaf)
      dab(m, -250, 0, 7, 7, 0, '#3a2010'); dab(m, 250, 0, 7, 7, 0, '#3a2010');
    }
  }
  // red string
  for (let k = 0; k < 3; k++) stroke(m, -8 + k * 8, -60, -14 + k * 8, 130, 6, k === 1 ? '#c42a22' : '#8f1a18', 1);
  stroke(m, -20, -14, 30, -44, 6, '#c42a22'); stroke(m, 10, -12, -34, -50, 6, '#a82020'); dab(m, 0, -14, 12, 10, 0, '#d43a2c'); stroke(m, 0, -10, 46, 40, 5, '#a82020', 1, .3); stroke(m, 0, -10, -52, 34, 5, '#c42a22', 1, -.3);
  m.restore();
  // marigolds + petals
  const mar = (px, py, s) => { for (let i = 0; i < 26; i++) { const a = r() * TAU, d = r() * s; dab(m, px + Math.cos(a) * d, py + Math.sin(a) * d * 0.7, s * 0.34, s * 0.2, a, jit(r() < .5 ? '#e88a22' : '#f4b53a', r, 14), 0.95); } dab(m, px, py, s * 0.3, s * 0.2, 0, '#c2601a'); };
  mar(212, 1420, 44); mar(300, 1470, 34); mar(868, 1438, 40); mar(150, 1500, 26);
  for (let i = 0; i < 46; i++) { const px = 120 + r() * 840, py = 1380 + r() * 180; dab(m, px, py, 9 + r() * 8, 4 + r() * 3, r() * 3, jit(r() < .5 ? '#e88a22' : '#f4b53a', r, 14), 0.9); }
  // brass lamp body (flame drawn live)
  const lx = 890, ly = 1010; dab(m, lx, ly + 232, 74, 16, 0, '#070409', 0.6);
  poly(m, [[lx - 54, ly + 226], [lx + 54, ly + 226], [lx + 30, ly + 196], [lx - 30, ly + 196]], '#8a6424'); stroke(m, lx, ly + 200, lx, ly + 60, 18, '#9a7228'); dab(m, lx, ly + 130, 22, 14, 0, '#b88a34'); dab(m, lx, ly + 86, 16, 10, 0, '#b88a34');
  m.fillStyle = '#a67c2c'; m.beginPath(); m.moveTo(lx - 62, ly + 34); m.quadraticCurveTo(lx, ly + 84, lx + 62, ly + 34); m.lineTo(lx + 84, ly + 30); m.quadraticCurveTo(lx + 70, ly + 20, lx + 62, ly + 22); m.lineTo(lx - 62, ly + 22); m.closePath(); m.fill();
  stroke(m, lx - 56, ly + 24, lx + 58, ly + 24, 5, '#f6d680', 0.9); stroke(m, lx - 40, ly + 48, lx - 12, ly + 62, 5, '#f0c868', 0.6); stroke(m, lx - 6, ly + 196, lx - 6, ly + 70, 4, '#f0c868', 0.6);
  return { layers: [bg, ms], bg, ms, lamp: [lx + 72, ly + 16] };
}
function flame(ctx, x, y, s, t, seed = 0) {
  const f = 1 + noise1(t * 9 + seed) * 0.12 + Math.sin(t * 23 + seed) * 0.05, sway = noise1(t * 4 + seed * 3) * s * 0.18;
  glow(ctx, x, y - s * 0.6, s * 9 * f, '#f4a03a', 0.30); glow(ctx, x, y - s * 0.6, s * 3.6, '#ffd884', 0.55);
  const fl = (h, w, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.5, x + sway, y - h * f); ctx.quadraticCurveTo(x + w * 1.1, y - h * 0.5, x + w, y); ctx.quadraticCurveTo(x, y + w * 0.9, x - w, y); ctx.fill(); };
  fl(s * 2.3, s * 0.62, '#f0782a'); fl(s * 1.75, s * 0.44, '#ffc24a'); fl(s * 1.05, s * 0.26, '#fff3c0');
}

// ---- an elder's hermitage on a lotus lake ----
// tod: 'dusk' (arrival) | 'night' (the departure into fire). Returns layers + anchor points.
function buildLakeHermitage(tod) {
  const r = rng(tod === 'dusk' ? 71 : 72);
  const sky = newLayer(0.05), far = newLayer(0.25), mid = newLayer(0.6), fg = newLayer(1.25);
  paintSky(sky.x, r, tod, [300, 360, 54]);
  paintHills(far.x, r, tod);
  // the lake: wide calm band with lotus pads + pink lotuses
  const lk = tod === 'dusk' ? [[0, '#7a5480'], [.45, '#4a3a78'], [1, '#22285a']] : [[0, '#3c3a7c'], [.4, '#222864'], [1, '#121844']];
  wash(far.x, r, -M, HORIZON - 4, W + 2 * M, 230, lk, { n: 300, alpha: 0.55, th: [6, 16], len: [140, 460] });
  for (let i = 0; i < 70; i++) { const px = -M + r() * (W + 2 * M), py = HORIZON + 30 + r() * 190, s = 0.5 + (py - HORIZON) / 160;
    dab(far.x, px, py, 26 * s, 8 * s, 0, jit('#1f4a3e', r, 8), 0.95); stroke(far.x, px - 18 * s, py - 2, px + 16 * s, py - 4, 2, '#3f7a5e', 0.6);
    if (r() < 0.35) { dab(far.x, px + 4, py - 9 * s, 7 * s, 9 * s, -0.3, '#e88aa8', 0.95); dab(far.x, px - 4, py - 9 * s, 7 * s, 9 * s, 0.3, '#f4a6bc', 0.95); dab(far.x, px, py - 12 * s, 5 * s, 9 * s, 0, '#ffd0dc', 0.95); } }
  paintGround(mid.x, r, HORIZON + 240, tod, { path: [430, 1180, 80], pathDx: 200 });
  paintTree(mid.x, r, 70, 1250, 980, 360, { n: 300, litDir: 1 });
  paintTree(mid.x, r, 1010, 1180, 760, 300, { n: 220, litDir: -1 });
  paintHut(mid.x, r, 300, 1215, 380, 400, { glowA: tod === 'dusk' ? 0.3 : 0.6, moonSide: 1 });
  // bark garments (valkala) of the departed sages, still wet, draped over a cord between two posts
  const c0 = [600, 1010], c1 = [980, 990];
  [c0, c1].forEach(([px, py]) => { stroke(mid.x, px, py - 20, px + 4, py + 250, 9, '#3a281c', 1); });
  stroke(mid.x, c0[0], c0[1], c1[0], c1[1], 4, '#c8a878', 0.8);
  for (let i = 0; i < 4; i++) { const px = 650 + i * 84, py = 1007 - i * 5, h = 110 + r() * 50, w = 30 + r() * 8;
    const pts = [[px - w - 8, py - 6], [px + w + 8, py - 6], [px + w + 4, py + 18], [px + w, py + h * 0.6], [px + w - 6, py + h], [px + 10, py + h - 10], [px - 4, py + h + 6], [px - w + 4, py + h - 4], [px - w, py + h * 0.5], [px - w - 4, py + 18]];
    blob(mid.x, pts, jit(['#9a7a54', '#8a6c4a', '#a8865c', '#7e6244'][i], r, 6), 0.97, 0.5);
    blob(mid.x, [[px - w - 8, py - 6], [px + w + 8, py - 6], [px + w + 6, py + 16], [px - w - 6, py + 16]], '#6e5236', 0.9, 0.3);    // fold over the cord
    for (let k = 0; k < 4; k++) stroke(mid.x, px - w + 10 + k * (w / 2), py + 22, px - w + 8 + k * (w / 2) + (r() - 0.5) * 8, py + h - 12, 2.5, '#5a4430', 0.5);
    dab(mid.x, px + 6, py + h * 0.55, w * 0.7, h * 0.3, 0, '#3a2c3c', 0.25);                       // damp darkening
    stroke(mid.x, px + 2, py + h + 8, px + 2, py + h + 24, 2.2, '#9ab8d8', 0.6); }
  // the sages' fire altar (vedi): stepped brick platform, west-facing
  const alt = [800, 1270];
  [[150, 34, '#6e3c2c'], [116, 30, '#84483a'], [84, 26, '#9a5644']].forEach(([w, h, c], k) => { const y = alt[1] - k * 28; blob(mid.x, [[alt[0] - w, y], [alt[0] + w, y], [alt[0] + w - 10, y - h], [alt[0] - w + 10, y - h]], jit(c, r, 8), 1, 0.12); stroke(mid.x, alt[0] - w + 10, y - h, alt[0] + w - 10, y - h, 3, '#c07a5c', 0.6);
    for (let j = 0; j < w / 14; j++) stroke(mid.x, alt[0] - w + 14 + j * 28 + (k % 2) * 14, y - h + 4, alt[0] - w + 14 + j * 28 + (k % 2) * 14, y - 3, 2, '#3e2018', 0.45);
    stroke(mid.x, alt[0] - w + 6, y - h / 2, alt[0] + w - 6, y - h / 2, 1.5, '#3e2018', 0.35); });
  for (let i = 0; i < 9; i++) dab(mid.x, alt[0] - 70 + i * 17, alt[1] - 86, 7, 5, 0, i % 2 ? '#f4e2b0' : '#e8a040', 0.95);   // unwithered flower offerings
  // fruit basket (leaf-lined) near the hut door
  const bk = [470, 1232]; dab(mid.x, bk[0], bk[1], 52, 20, 0, '#4a3020'); blob(mid.x, [[bk[0] - 54, bk[1] - 6], [bk[0] + 54, bk[1] - 6], [bk[0] + 40, bk[1] + 26], [bk[0] - 40, bk[1] + 26]], '#7a5232', 1, 0.3);
  for (let i = 0; i < 6; i++) dab(mid.x, bk[0] - 44 + i * 16, bk[1] - 12, 18, 7, 0.3 * (i - 3), '#2f6a3a', 0.95);
  for (let i = 0; i < 14; i++) { const a = r() * Math.PI, d = r() * 36; dab(mid.x, bk[0] + Math.cos(a) * d, bk[1] - 14 - Math.sin(a) * 12, 9, 9, 0, ['#e0a030', '#c8482a', '#a8b040', '#e8c860'][i % 4], 1); }
  const f = fg.x;
  for (let i = 0; i < 240; i++) { const px = -M + r() * (W + 2 * M), py = H + 40 + r() * 60, hh = 110 + r() * 180; stroke(f, px, py, px + (r() - .5) * 120, py - hh, 6 + r() * 9, jit(r() < .15 ? '#18404a' : '#050d1c', r, 6), 1, (r() - .5) * .5); }
  return { tod, layers: [sky, far, mid, fg], sky, far, mid, fg, alt, basket: bk, hut: [300, 1215] };
}
function lakeHermitage(ctx, bg, cam, t, mid) {
  drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far); withCam(ctx, cam, bg.far.depth, c => riverLive(c, t, bg.tod, 0.5)); drawLayer(ctx, cam, bg.mid);
  withCam(ctx, cam, bg.mid.depth, c => { glow(c, bg.alt[0], bg.alt[1] - 90, 120, '#ffcf70', 0.18 + 0.06 * Math.sin(t * 2.3)); });   // the altar still glows
  if (mid) withCam(ctx, cam, 0.6, mid);
}

// ---- a deserted sage's hermitage (overgrown hut, cold ash altar, smoky air) ----
// tod: 'dusk'. Anchors: alt = the ash altar where Ahalya keeps her penance; hut = the empty hut.
function buildRuinedHermitage(tod = 'dusk') {
  const r = rng(91);
  const sky = newLayer(0.05), far = newLayer(0.25), mid = newLayer(0.6), fg = newLayer(1.25);
  paintSky(sky.x, r, tod, [760, 300, 58]);
  paintHills(far.x, r, tod);
  for (let i = 0; i < 9; i++) paintTree(far.x, r, -40 + i * 150 + r() * 60, HORIZON + 40, 260 + r() * 140, 110, { n: 50, litDir: i % 2 ? 1 : -1 });   // the forest closing in
  paintGround(mid.x, r, HORIZON + 170, tod, { path: [560, 1200, 90], pathDx: 120 });
  paintTree(mid.x, r, 1000, 1150, 820, 300, { n: 240, litDir: -1 });
  paintHut(mid.x, r, 790, 1180, 420, 440, { glowA: 0.0, moonSide: 1 });
  // creepers over the empty hut + fallen thatch
  for (let i = 0; i < 46; i++) { const px = 600 + r() * 380, py = 840 + r() * 300; stroke(mid.x, px, py, px + (r() - 0.5) * 30, py + 40 + r() * 70, 3, jit('#2f5a3e', r, 10), 0.8, 0.2); dab(mid.x, px, py + 20, 9, 5, r() * 3, jit('#3c7048', r, 10), 0.85); }
  // the old fire altar: stepped bricks under a mound of grey ash (no fire for years)
  const alt = [400, 1262];
  [[140, 30, '#5c3a30'], [108, 26, '#6e4636']].forEach(([w, h, c], k) => { const y = alt[1] - k * 26; blob(mid.x, [[alt[0] - w, y], [alt[0] + w, y], [alt[0] + w - 10, y - h], [alt[0] - w + 10, y - h]], jit(c, r, 8), 1, 0.12); stroke(mid.x, alt[0] - w + 10, y - h, alt[0] + w - 10, y - h, 3, '#a07060', 0.5); });
  blob(mid.x, [[alt[0] - 92, alt[1] - 50], [alt[0] - 60, alt[1] - 74], [alt[0], alt[1] - 84], [alt[0] + 66, alt[1] - 72], [alt[0] + 94, alt[1] - 50]], '#8c8a90', 1, 0.4);
  for (let i = 0; i < 30; i++) dab(mid.x, alt[0] - 80 + r() * 160, alt[1] - 56 - r() * 22, 6 + r() * 8, 3 + r() * 3, 0, jit('#b4b2b8', r, 10), 0.8);
  // scattered dry leaves and a broken water pot
  for (let i = 0; i < 60; i++) dab(mid.x, 140 + r() * 860, HORIZON + 230 + r() * 260, 6 + r() * 5, 3, r() * 3, jit('#8a5a32', r, 14), 0.7);
  dab(mid.x, 640, 1268, 26, 20, 0, '#5d3830'); poly(mid.x, [[628, 1250], [650, 1246], [646, 1262]], '#2a1a18');
  paintTree(mid.x, r, 90, 1300, 1080, 420, { n: 360, litDir: 1 });
  const f = fg.x;
  for (let i = 0; i < 260; i++) { const px = -M + r() * (W + 2 * M), py = H + 40 + r() * 60, hh = 120 + r() * 200; stroke(f, px, py, px + (r() - .5) * 120, py - hh, 6 + r() * 9, jit(r() < .15 ? '#18404a' : '#050d1c', r, 6), 1, (r() - .5) * .5); }
  return { tod, layers: [sky, far, mid, fg], sky, far, mid, fg, alt, hut: [790, 1180] };
}
// draws the set with live drifting smoke
function ruinedHermitage(ctx, bg, cam, t, mid, smoke = 1) {
  drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far); drawLayer(ctx, cam, bg.mid);
  withCam(ctx, cam, bg.mid.depth, c => mist(c, t, 31, 7, [-200, 950, 1500, 380], '#c8c2d8', 0.16 * smoke, 14));
  if (mid) withCam(ctx, cam, 0.6, mid);
}

// ---- a shore — open sea at dusk, an island a dark line on the horizon (bridge drawn live by bridge()) ----
const SHORE_Y = 1440, BRIDGE_VP = [900, HORIZON + 2];   // the road runs to the island (right of the horizon)
function buildShore(tod = 'dusk') {
  const r = rng(404);
  const sky = newLayer(0.05), far = newLayer(0.25), mid = newLayer(0.6), fg = newLayer(1.25);
  paintSky(sky.x, r, tod, [300, 330, 56]);
  // the island: a low dark line on the right of the horizon
  blob(far.x, [[760, HORIZON + 4], [820, HORIZON - 26], [900, HORIZON - 40], [990, HORIZON - 30], [1060, HORIZON - 44], [1160, HORIZON - 18], [1200, HORIZON + 4]], '#1a1838', 0.95, 0.3);
  // the sea: wide band, darker towards the shore
  const sea = tod === 'dusk' ? [[0, '#8a5a86'], [.18, '#4a3a7c'], [.6, '#26306a'], [1, '#14204a']] : [[0, '#3c3a7c'], [.4, '#222864'], [1, '#121844']];
  wash(far.x, r, -M, HORIZON - 4, W + 2 * M, SHORE_Y - HORIZON + 40, sea, { n: 520, alpha: 0.55, th: [6, 18], len: [160, 520] });
  for (let i = 0; i < 160; i++) { const t = Math.pow(r(), 1.6), y = lerp(HORIZON + 6, SHORE_Y - 10, t), w = 30 + t * 220; stroke(far.x, -M + r() * (W + 2 * M), y, -M + r() * (W + 2 * M) + w, y + (r() - .5) * 4, 2 + t * 6, jit(r() < .3 ? '#a8a0d8' : '#2e3a7a', r, 10), 0.35 + t * 0.3); }
  // beach + rocks + palms
  const m = mid.x;
  m.save(); m.beginPath(); m.moveTo(-M, SHORE_Y); for (let i = 0; i <= 20; i++) m.lineTo(-M + i * (W + 2 * M) / 20, SHORE_Y + Math.sin(i * 1.3) * 10); m.lineTo(W + M, H + M); m.lineTo(-M, H + M); m.closePath(); m.clip();
  wash(m, r, -M, SHORE_Y - 10, W + 2 * M, H + M - SHORE_Y, [[0, '#b89a7c'], [.2, '#8a6e5e'], [1, '#3a2c34']], { n: 360, alpha: 0.5, th: [12, 40], len: [120, 380] });
  for (let i = 0; i < 400; i++) dab(m, -M + r() * (W + 2 * M), SHORE_Y + r() * 520, 2 + r() * 3, 1.5, 0, jit('#d8c0a0', r, 20), 0.5);
  m.restore();
  [[110, SHORE_Y + 60, 70], [990, SHORE_Y + 90, 90], [880, SHORE_Y + 40, 46]].forEach(([px, py, s]) => { blob(m, [[px - s, py], [px - s * 0.7, py - s * 0.6], [px, py - s * 0.8], [px + s * 0.8, py - s * 0.5], [px + s, py]], jit('#3c3448', r, 8), 1, 0.3); stroke(m, px - s * 0.5, py - s * 0.5, px + s * 0.3, py - s * 0.7, 4, '#6a6080', 0.5); });
  paintTree(m, r, 40, SHORE_Y + 160, 900, 260, { n: 160, litDir: 1 });
  paintTree(m, r, 1090, SHORE_Y + 200, 980, 300, { n: 180, litDir: -1 });
  const f = fg.x;
  for (let i = 0; i < 200; i++) { const px = -M + r() * (W + 2 * M), py = H + 40 + r() * 60, hh = 90 + r() * 150; stroke(f, px, py, px + (r() - .5) * 120, py - hh, 6 + r() * 9, jit(r() < .15 ? '#18404a' : '#0a0c18', r, 6), 1, (r() - .5) * .5); }
  return { tod, layers: [sky, far, mid, fg], sky, far, mid, fg };
}
// live sea: glitter + foam lines along the shore
function seaLive(ctx, t, a = 1) {
  for (let i = 0; i < 90; i++) { const h1 = hash(i * 3.1), h2 = hash(i * 7.7), y = HORIZON + 10 + Math.pow(h2, 1.5) * (SHORE_Y - HORIZON - 30), x = h1 * (W + 200) - 100 + Math.sin(t * (0.4 + h2) + i) * 20;
    stroke(ctx, x, y, x + 20 + h2 * 80, y, 2 + h2 * 4, Math.abs(h1 * W - 300) < 140 ? '#f1e6c4' : '#b8b0e8', a * (0.2 + 0.5 * Math.pow(0.5 + 0.5 * Math.sin(t * (1 + h1 * 2) + i * 2.1), 2))); }
  for (let k = 0; k < 3; k++) { const ph = (t * 0.25 + k / 3) % 1, y = SHORE_Y - 30 + ph * 36; ctx.globalAlpha = a * 0.5 * Math.sin(ph * Math.PI); ctx.strokeStyle = '#f4ecf8'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const x = -40 + i * 48; ctx.lineTo(x, y + Math.sin(i * 1.7 + t * 2 + k) * 6); } ctx.stroke(); ctx.globalAlpha = 1; }
}
// a causeway of trees and rocks, lying ON the sea, from the near shore towards the island; prog 0..1 = how far it reaches
function bridge(ctx, prog, t, glowA = 0) {
  if (prog <= 0) return;
  const y0 = SHORE_Y + 10, y1 = BRIDGE_VP[1], K = Math.pow(prog, 0.7), yEnd = lerp(y0, y1, K);
  // perspective: depth z = 1/(y - horizon); width and x follow z so the road narrows smoothly to the island
  const ed = y => { const d = Math.max(2, y - HORIZON), s = d / (y0 - HORIZON), cx = lerp(BRIDGE_VP[0], 520, s), w = 190 * s; return [cx - w, cx + w, s]; };
  const path = (side) => { const pts = []; for (let y = y0; y >= yEnd; y -= 4) pts.push([ed(y)[side], y]); return pts; };
  const L = path(0), R = path(1);
  // side face (thickness) + water line
  ctx.beginPath(); L.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); for (let i = L.length - 1; i >= 0; i--) { const s = ed(L[i][1])[2]; ctx.lineTo(L[i][0] - 4 * s, L[i][1] + 26 * s); } ctx.closePath(); ctx.fillStyle = '#2a2230'; ctx.fill();
  ctx.beginPath(); R.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); for (let i = R.length - 1; i >= 0; i--) { const s = ed(R[i][1])[2]; ctx.lineTo(R[i][0] + 4 * s, R[i][1] + 26 * s); } ctx.closePath(); ctx.fillStyle = '#221c28'; ctx.fill();
  // top surface
  ctx.beginPath(); L.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); ctx.fillStyle = '#5a5060'; ctx.fill();
  // rocks and logs, smaller with distance
  for (let i = 0; i < 420; i++) { const k = Math.pow(hash(i * 1.37), 1.8), y = lerp(y0, y1, k); if (y < yEnd) continue; const [a, b, s] = ed(y), x = lerp(a, b, hash(i * 5.3));
    if (i % 5 === 0) stroke(ctx, x - 26 * s, y, x + 26 * s, y - 3 * s, 6 * s + 0.5, '#6a4a30', 0.95); else dab(ctx, x, y, 13 * s + 0.6, 6 * s + 0.4, hash(i) * 3, ['#7a7086', '#635a70', '#8e8698', '#544c60'][i % 4], 0.95); }
  // foam along both edges
  for (let y = y0; y >= yEnd; y -= 10) { const [a, b, s] = ed(y), w = Math.sin(t * 2 + y * 0.05) * 3 * s; stroke(ctx, a - 10 * s, y + 24 * s + w, a + 4 * s, y + 22 * s, 3 * s + 0.5, '#e8eef8', 0.5); stroke(ctx, b - 4 * s, y + 22 * s, b + 10 * s, y + 24 * s - w, 3 * s + 0.5, '#e8eef8', 0.5); }
  if (glowA > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let y = y0; y >= yEnd; y -= 8) { const [a, b, s] = ed(y); dab(ctx, (a + b) / 2, y, (b - a) * 0.55, 3 * s + 1, 0, '#ffe8a0', glowA * 0.07); } ctx.restore(); }
}
function shore(ctx, bg, cam, t, mid, prog = 0, glowA = 0) {
  drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far); withCam(ctx, cam, bg.far.depth, c => seaLive(c, t)); withCam(ctx, cam, bg.far.depth, c => bridge(c, prog, t, glowA));
  drawLayer(ctx, cam, bg.mid); if (mid) withCam(ctx, cam, 0.6, mid);
}

// ---- a wide sacred river at night/dawn — far bank, a tree on the near bank ----
// tod: 'night' (a riverside camp) | 'dawn' (the boat)
const RIVER_BANK = 1330;
function buildWideRiver(tod = 'night') {
  const r = rng(tod === 'night' ? 606 : 607);
  const sky = newLayer(0.05), far = newLayer(0.25), mid = newLayer(0.6), fg = newLayer(1.25);
  paintSky(sky.x, r, tod === 'night' ? 'night' : 'dusk', [760, 300, 52]);
  if (tod === 'dawn') { glow(sky.x, 300, HORIZON - 40, 520, '#ffc890', 0.45); glow(sky.x, 300, HORIZON - 20, 200, '#fff0c8', 0.5); }
  for (let i = 0; i < 12; i++) paintTree(far.x, r, -60 + i * 110 + r() * 50, HORIZON + 28, 160 + r() * 90, 80, { n: 34, litDir: 1 });    // far bank
  const rv = tod === 'night' ? [[0, '#3c3a7c'], [.3, '#262c66'], [1, '#121844']] : [[0, '#c89a8a'], [.25, '#7a6a9a'], [.6, '#3e4a86'], [1, '#1e2a5c']];
  wash(far.x, r, -M, HORIZON + 30, W + 2 * M, RIVER_BANK - HORIZON, rv, { n: 480, alpha: 0.55, th: [6, 18], len: [160, 520] });
  for (let i = 0; i < 130; i++) { const t = Math.pow(r(), 1.5), y = lerp(HORIZON + 36, RIVER_BANK - 20, t); stroke(far.x, -M + r() * (W + 2 * M), y, -M + r() * (W + 2 * M) + 40 + t * 200, y, 2 + t * 5, jit(tod === 'night' ? '#8a90d8' : '#f0c8a8', r, 12), 0.25 + t * 0.25); }
  const m = mid.x;
  m.save(); m.beginPath(); m.moveTo(-M, RIVER_BANK); for (let i = 0; i <= 20; i++) m.lineTo(-M + i * (W + 2 * M) / 20, RIVER_BANK + Math.sin(i * 1.9) * 12); m.lineTo(W + M, H + M); m.lineTo(-M, H + M); m.closePath(); m.clip();
  wash(m, r, -M, RIVER_BANK - 10, W + 2 * M, H + M - RIVER_BANK, tod === 'night' ? [[0, '#2a3048'], [1, '#0a1020']] : [[0, '#6a5a4e'], [.3, '#3e3a3e'], [1, '#141824']], { n: 360, alpha: 0.5, th: [12, 40], len: [120, 380] });
  for (let i = 0; i < 500; i++) { const px = -M + r() * (W + 2 * M), py = RIVER_BANK + 10 + Math.pow(r(), 0.8) * 560, hh = 8 + r() * 26; stroke(m, px, py, px + (r() - .5) * 10, py - hh, 2 + r() * 2, jit(r() < .3 ? '#3f7a70' : '#1f4a4c', r, 10), 0.7); }
  m.restore();
  paintTree(m, r, 140, RIVER_BANK + 120, 1050, 380, { n: 340, litDir: 1 });       // the ingudi tree they sleep under
  // a bed of grass under the tree
  for (let i = 0; i < 90; i++) stroke(m, 160 + r() * 420, RIVER_BANK + 150 + r() * 40, 160 + r() * 420, RIVER_BANK + 150 + r() * 40, 5, jit('#6a7a4a', r, 14), 0.6);
  const f = fg.x;
  for (let i = 0; i < 180; i++) { const px = -M + r() * (W + 2 * M), py = H + 40 + r() * 60, hh = 90 + r() * 150; stroke(f, px, py, px + (r() - .5) * 120, py - hh, 6 + r() * 9, jit(r() < .15 ? '#18404a' : '#0a0c18', r, 6), 1, (r() - .5) * .5); }
  return { tod, layers: [sky, far, mid, fg], sky, far, mid, fg };
}
function wideRiverLive(ctx, t, tod, a = 1) {
  for (let i = 0; i < 80; i++) { const h1 = hash(i * 3.1), h2 = hash(i * 7.7), y = HORIZON + 40 + Math.pow(h2, 1.4) * (RIVER_BANK - HORIZON - 60), x = h1 * (W + 200) - 100 + ((t * (20 + h2 * 30)) % 200);
    stroke(ctx, x, y, x + 20 + h2 * 70, y, 2 + h2 * 4, tod === 'night' ? '#c8ccf8' : '#ffe0c0', a * (0.15 + 0.45 * Math.pow(0.5 + 0.5 * Math.sin(t * (1 + h1 * 2) + i * 2.1), 2))); }
}
function wideRiver(ctx, bg, cam, t, river, mid) {
  drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far); withCam(ctx, cam, bg.far.depth, c => { wideRiverLive(c, t, bg.tod); if (river) river(c); });
  drawLayer(ctx, cam, bg.mid); if (mid) withCam(ctx, cam, 0.6, mid);
}
// a wooden river boat; draws its hull, then the riders (callback), then the near gunwale over their legs
function boat(ctx, x, y, s, riders) {
  blob(ctx, [[x - s, y - s * 0.12], [x + s, y - s * 0.12], [x + s * 0.82, y + s * 0.12], [x - s * 0.8, y + s * 0.12]], '#4a2e1e', 1, 0.2);
  if (riders) riders(ctx);
  blob(ctx, [[x - s * 1.06, y - s * 0.16], [x + s * 1.06, y - s * 0.16], [x + s * 0.86, y + s * 0.1], [x - s * 0.84, y + s * 0.1]], '#6a4428', 1, 0.2);
  stroke(ctx, x - s * 1.04, y - s * 0.15, x + s * 1.04, y - s * 0.15, s * 0.03, '#a0703c', 0.9);
  for (let i = 0; i < 6; i++) stroke(ctx, x - s * 0.9 + i * s * 0.36, y - s * 0.12, x - s * 0.88 + i * s * 0.36, y + s * 0.08, s * 0.012, '#3a2414', 0.6);
}

// ---- a palace inner chamber at night — gold pillars, hanging lamps, a crystal couch ----
const PAL_FLOOR = 1420;
function buildPalace() {
  const r = rng(707);
  const sky = newLayer(0.05), far = newLayer(0.3), mid = newLayer(0.6), fg = newLayer(1.25);
  wash(sky.x, r, -M, -M, W + 2 * M, H + 2 * M, [[0, '#120a1e'], [.5, '#22102a'], [1, '#1a0c1c']], { n: 300, alpha: 0.6, th: [20, 60], len: [200, 600] });
  // back wall: carved panels + arches
  for (let i = 0; i < 6; i++) { const x = -40 + i * 230; blob(far.x, [[x, PAL_FLOOR - 60], [x, 520], [x + 90, 400], [x + 180, 520], [x + 180, PAL_FLOOR - 60]], jit('#3a1a30', r, 8), 0.9, 0.2); stroke(far.x, x + 10, 530, x + 170, 530, 6, '#8a6a30', 0.6); for (let k = 0; k < 5; k++) dab(far.x, x + 30 + k * 30, 600 + k * 70, 10, 10, 0, '#c8a040', 0.35); }
  // floor: polished tiles
  wash(mid.x, r, -M, PAL_FLOOR - 40, W + 2 * M, H + M - PAL_FLOOR + 40, [[0, '#4a2a2a'], [.3, '#2a1820'], [1, '#100810']], { n: 260, alpha: 0.6, th: [10, 30], len: [200, 500] });
  for (let i = 0; i < 14; i++) stroke(mid.x, 540 + (i - 7) * 40, PAL_FLOOR - 30, 540 + (i - 7) * 220, H + M, 2, '#6a4a30', 0.35);
  // gold pillars (5.7.20-21: jewelled, many, tall)
  [[40, 1.0], [1060, 1.0], [230, 0.7], [890, 0.7]].forEach(([px, k]) => { const w = 34 * k + 12;      // fewer, slimmer, darker: the room, not the pillars, is the subject
    blob(mid.x, [[px - w, PAL_FLOOR], [px - w * 0.8, 120], [px + w * 0.8, 120], [px + w, PAL_FLOOR]], '#7a5826', 1, 0.15); blob(mid.x, [[px - w * 0.8, PAL_FLOOR], [px - w * 0.6, 120], [px - w * 0.1, 120], [px - w * 0.2, PAL_FLOOR]], '#4a3418', 0.75);
    for (let y = 240; y < PAL_FLOOR; y += 240) { stroke(mid.x, px - w, y, px + w, y, 6, '#c8a048', 0.8); dab(mid.x, px, y + 26, 6, 8, 0, ['#c41e1e', '#1e8a8a', '#f8dc86'][(y / 240) % 3 | 0], 0.85); } });
  // the crystal couch (5.8.1) with a gold frame and a silk cover
  const cx = 560, cy = PAL_FLOOR - 150;
  blob(mid.x, [[cx - 330, cy + 90], [cx - 320, cy - 10], [cx + 320, cy - 10], [cx + 330, cy + 90]], '#c8d4e4', 0.85, 0.1); stroke(mid.x, cx - 330, cy - 10, cx + 330, cy - 10, 8, '#e0b850', 1);
  for (let i = 0; i < 4; i++) stroke(mid.x, cx - 300 + i * 200, cy + 90, cx - 300 + i * 200, cy + 170, 14, '#8a6428', 1);
  blob(mid.x, [[cx - 320, cy - 6], [cx + 320, cy - 6], [cx + 310, cy + 50], [cx - 310, cy + 50]], '#5a1a4a', 1, 0.2);
  const f = fg.x; for (let i = 0; i < 60; i++) dab(f, -M + r() * (W + 2 * M), H - 20 + r() * 80, 80, 30, 0, '#06030a', 0.9);
  return { layers: [sky, far, mid, fg], sky, far, mid, fg, couch: [cx, cy] };
}
function lamps(ctx, t) {      // hanging oil lamps, flickering
  [[180, 260], [430, 200], [690, 200], [940, 260]].forEach(([x, y], i) => { stroke(ctx, x, 0, x, y - 20, 3, '#8a6a30', 0.8); dab(ctx, x, y, 22, 12, 0, '#c89a40'); flame(ctx, x, y - 14, 14, t, i); glow(ctx, x, y, 260, '#ffb860', 0.16 + 0.04 * Math.sin(t * 7 + i)); });
}
function palace(ctx, bg, cam, t, mid) {
  drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far); drawLayer(ctx, cam, bg.mid); withCam(ctx, cam, 0.6, c => lamps(c, t)); if (mid) withCam(ctx, cam, 0.6, mid);
}

// ---- a battlefield before a walled city at dusk — smoky red sky, walls and towers, fires ----
const WAR_GROUND = 1360;
function buildBattlefield() {
  const r = rng(920);
  const sky = newLayer(0.05), far = newLayer(0.25), mid = newLayer(0.6), fg = newLayer(1.25);
  wash(sky.x, r, -M, -M, W + 2 * M, HORIZON + M, [[0, '#2a0e1a'], [.45, '#6a1e1e'], [.8, '#c45a2a'], [1, '#e89a4a']], { n: 320, alpha: 0.6, th: [20, 60], len: [200, 600] });
  for (let i = 0; i < 18; i++) dab(sky.x, r() * W, 200 + r() * 500, 220 + r() * 200, 50 + r() * 40, 0, jit('#3a1820', r, 10), 0.35);   // smoke banks
  // the city's walls and towers on the horizon
  blob(far.x, [[-M, HORIZON + 10], [-M, HORIZON - 70], [W + M, HORIZON - 70], [W + M, HORIZON + 10]], '#2a1420', 1, 0.1);
  for (let i = 0; i < 9; i++) { const x = 40 + i * 130, h = 120 + r() * 160, w = 40 + r() * 30; blob(far.x, [[x - w, HORIZON - 60], [x - w, HORIZON - 60 - h], [x - w * 0.5, HORIZON - 80 - h], [x, HORIZON - 110 - h - r() * 40], [x + w * 0.5, HORIZON - 80 - h], [x + w, HORIZON - 60 - h], [x + w, HORIZON - 60]], jit('#341a26', r, 8), 1, 0.15); dab(far.x, x, HORIZON - 70 - h * 0.5, 6, 9, 0, '#ffb060', 0.5); }
  // the field: scorched earth, broken arrows, a fallen banner
  wash(mid.x, r, -M, HORIZON + 20, W + 2 * M, H + M - HORIZON, [[0, '#4a2a26'], [.4, '#2a1a1e'], [1, '#100a10']], { n: 420, alpha: 0.55, th: [12, 40], len: [120, 420] });
  for (let i = 0; i < 70; i++) { const x = r() * W, y = HORIZON + 80 + Math.pow(r(), 0.7) * 700, l = 20 + r() * 40, a = r() * 3; stroke(mid.x, x, y, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.3, 2, '#2a1810', 0.7); }
  stroke(mid.x, 880, WAR_GROUND - 10, 980, WAR_GROUND - 220, 6, '#3a2414', 1); blob(mid.x, [[980, WAR_GROUND - 220], [1060, WAR_GROUND - 200], [1040, WAR_GROUND - 170], [975, WAR_GROUND - 180]], '#7a1a1a', 0.9, 0.3);
  const f = fg.x; for (let i = 0; i < 160; i++) { const px = -M + r() * (W + 2 * M), py = H + 40 + r() * 60, hh = 60 + r() * 120; stroke(f, px, py, px + (r() - .5) * 80, py - hh, 6 + r() * 9, jit('#120a0e', r, 6), 1, (r() - .5) * .5); }
  return { layers: [sky, far, mid, fg], sky, far, mid, fg };
}
function battlefield(ctx, bg, cam, t, mid, smoke = 1) {
  drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far);
  withCam(ctx, cam, bg.far.depth, c => { fire(c, 200, HORIZON - 40, 40, 70, t, 1, 6, 0.7); fire(c, 760, HORIZON - 50, 30, 50, t, 2, 5, 0.6); });
  drawLayer(ctx, cam, bg.mid);
  withCam(ctx, cam, bg.mid.depth, c => { mist(c, t, 61, 6, [-200, 900, 1500, 500], '#5a3a40', 0.25 * smoke, 16); embers(c, t, 4, 14, 540, WAR_GROUND, 600, 0.6); });
  if (mid) withCam(ctx, cam, 0.6, mid);
}
// the Brahmastra in flight: a white-gold streak with a burning head (k 0..1 along from -> to)
function brahmastra(c, x0, y0, x1, y1, k, t) {
  if (k <= 0) return; const x = lerp(x0, x1, Math.min(1, k)), y = lerp(y0, y1, Math.min(1, k));
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) { const q = Math.max(0, Math.min(1, k) - i * 0.03); stroke(c, lerp(x0, x1, q), lerp(y0, y1, q), x, y, 18 - i, i < 3 ? '#ffffff' : '#ffd070', 0.35 * (1 - i / 14)); }
  glow(c, x, y, 160, '#fff0b0', 0.6); glow(c, x, y, 50, '#ffffff', 0.8); c.restore();
}

// ---- dawn on a rocky mountain spur ----
const DAWN_PEAK = [250, 1330];        // rocky spur: the child sits here, and falls back here
function buildDawn() {
  const r = rng(889), sky = newLayer(0.05), far = newLayer(0.25), mid = newLayer(0.6), fg = newLayer(1.25);
  wash(sky.x, r, -M, -M, W + 2 * M, HORIZON + M + 60, [[0, '#141436'], [.3, '#3a2e6a'], [.55, '#8a4a72'], [.75, '#d8705a'], [.9, '#f4a45a'], [1, '#ffd890']], { n: 520, alpha: 0.45, th: [26, 80], len: [240, 700] });
  for (let i = 0; i < 10; i++) { const cy = 200 + r() * (HORIZON - 360), cx = r() * W, L = 260 + r() * 420, t = cy / HORIZON; for (let k = 0; k < 5; k++) stroke(sky.x, cx - L / 2 + r() * 60, cy + k * 7 + r() * 8, cx + L / 2 - r() * 60, cy + k * 7 + r() * 8, 14 + r() * 14, k > 2 ? mix('#ffb07a', '#ffe0b0', t) : '#5a3a6a', 0.3, (r() - .5) * .04); }
  [['#6a3e6e', 170, 0.9, 0], ['#3a2a52', 100, 1.5, 6]].forEach(([col, amp, rough, k]) => { const pts = ridge(r, -M, W + M, HORIZON + 6 - k, amp, 26, rough), x = far.x; x.beginPath(); x.moveTo(-M, HORIZON + 90); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(W + M, HORIZON + 90); x.closePath(); x.fillStyle = col; x.fill(); });
  wash(mid.x, r, -M, HORIZON + 40, W + 2 * M, H + M - HORIZON, [[0, '#2a2a44'], [.3, '#1c2236'], [1, '#0a0e1c']], { n: 420, alpha: 0.5, th: [14, 44], len: [120, 420] });
  for (let i = 0; i < 60; i++) { const px = -M + r() * (W + 2 * M), py = HORIZON + 60 + r() * 140; dab(mid.x, px, py, 50 + r() * 60, 30 + r() * 30, 0, jit(r() < .3 ? '#3a3a5a' : '#22283e', r, 8), 0.9); dab(mid.x, px + 10, py - 14, 26, 12, 0, '#c87a6a', 0.25); }
  paintTree(mid.x, r, 940, 1520, 1000, 340, { n: 260, dark: '#141a2a', mid: '#22304a', lit: '#6a5a7a', hi: '#d89a7a', litDir: -1 });
  const P = DAWN_PEAK;
  blob(mid.x, [[-M, H + M], [-M, P[1] + 40], [P[0] - 160, P[1] + 10], [P[0] - 60, P[1] - 30], [P[0] + 40, P[1] - 20], [P[0] + 150, P[1] + 30], [P[0] + 260, P[1] + 160], [P[0] + 330, H + M]], '#2a2234', 1, 0.3);
  blob(mid.x, [[P[0] - 60, P[1] - 30], [P[0] + 40, P[1] - 20], [P[0] + 150, P[1] + 30], [P[0] + 60, P[1] + 12], [P[0] - 20, P[1] - 8]], '#b0705a', 0.55, 0.3);
  for (let i = 0; i < 40; i++) { const x = P[0] - 200 + r() * 500, y = P[1] + 40 + r() * 400; stroke(mid.x, x, y, x + 20 + r() * 40, y + (r() - .5) * 10, 3, '#1a1424', 0.5); }
  const f = fg.x; for (let i = 0; i < 160; i++) { const px = -M + r() * (W + 2 * M), py = H + 40 + r() * 60, hh = 60 + r() * 140; stroke(f, px, py, px + (r() - .5) * 80, py - hh, 6 + r() * 9, jit('#0e0c18', r, 6), 1, (r() - .5) * .5); }
  return { layers: [sky, far, mid, fg], sky, far, mid, fg };
}
// ---- the open sky above the clouds (flights) ----
function buildSkyHigh() {
  const r = rng(731), sky = newLayer(0.05), cl = newLayer(0.4), fg = newLayer(1.0);
  wash(sky.x, r, -M, -M, W + 2 * M, H + 2 * M, [[0, '#0e1640'], [.35, '#2a3a7a'], [.6, '#7a6a9a'], [.8, '#f0a070'], [1, '#ffd0a0']], { n: 600, alpha: 0.4, th: [30, 90], len: [240, 700] });
  for (let i = 0; i < 70; i++) dab(sky.x, -M + r() * (W + 2 * M), -M + r() * 700, 1.2 + r() * 2, 1.2 + r() * 2, 0, '#e6e6ff', 0.2 + r() * 0.4);
  for (let i = 0; i < 120; i++) { const px = -M + r() * (W + 2 * M), py = 1350 + Math.pow(r(), 0.7) * 700; dab(cl.x, px, py, 90 + r() * 120, 40 + r() * 40, 0, jit(r() < .4 ? '#f6c8b0' : '#d8a8b8', r, 10), 0.75); dab(cl.x, px - 20, py - 20, 60 + r() * 60, 22, 0, '#ffe6d0', 0.4); }
  for (let i = 0; i < 20; i++) dab(fg.x, -M + r() * (W + 2 * M), 1750 + r() * 300, 160 + r() * 120, 60 + r() * 30, 0, '#f0d0d0', 0.5);
  return { layers: [sky, cl, fg], sky, cl, fg };
}
// the sun, "like a cluster of hibiscus flowers" (7.35.23)
function sunDisc(c, x, y, rad, t, a = 1) {
  glow(c, x, y, rad * 4, '#ffb060', 0.35 * a); glow(c, x, y, rad * 2.2, '#ffd890', 0.5 * a);
  for (let i = 0; i < 14; i++) { const an = i / 14 * TAU + t * 0.1; dab(c, x + Math.cos(an) * rad * 0.55, y + Math.sin(an) * rad * 0.55, rad * 0.55, rad * 0.5, an, i % 2 ? '#ff6a3a' : '#ff8a3a', 0.55 * a); }
  dab(c, x, y, rad, rad, 0, '#ff7a3a', 0.9 * a); dab(c, x, y, rad * 0.8, rad * 0.8, 0, '#ffa04a', 0.9 * a); dab(c, x - rad * 0.2, y - rad * 0.2, rad * 0.45, rad * 0.45, 0, '#ffd27a', 0.8 * a);
}
// heat rings pushing outward from the sun (4.65.20: driven back by its radiance)
function heatRings(c, x, y, rad, t, a = 1) { for (let i = 0; i < 4; i++) { const k = (t * 0.7 + i / 4) % 1; c.save(); c.globalAlpha = a * 0.5 * (1 - k); c.strokeStyle = '#ffd890'; c.lineWidth = 10 * (1 - k) + 2; c.beginPath(); c.arc(x, y, rad * (1.2 + k * 2.2), 0, TAU); c.stroke(); c.restore(); } }
// Indra's thunderbolt: a jagged white-blue bolt (k 0..1 = how far it has reached)
function vajra(c, x0, y0, x1, y1, k, t, seed = 3) {
  if (k <= 0) return; const r = rng(seed + Math.floor(t * 12)), n = 9, pts = [[x0, y0]];
  for (let i = 1; i <= n; i++) { const q = i / n * Math.min(1, k); pts.push([lerp(x0, x1, q) + (i < n ? (r() - .5) * 90 : 0), lerp(y0, y1, q) + (i < n ? (r() - .5) * 40 : 0)]); }
  c.save(); c.globalCompositeOperation = 'lighter'; line(c, pts, 26, '#6a8aff', 0.35, false); line(c, pts, 10, '#cfe0ff', 0.8, false); line(c, pts, 4, '#ffffff', 1, false);
  const e = pts[pts.length - 1]; glow(c, e[0], e[1], 140, '#cfe0ff', 0.7); c.restore();
}
// Vayu keeping the child cool (7.35.28): pale-blue spiralling streams
function windSwirl(c, x, y, rad, t, a = 1) {
  for (let i = 0; i < 7; i++) { const ph = t * 1.6 + i * 0.9, pts = []; for (let j = 0; j < 14; j++) { const an = ph + j * 0.32, rr = rad * (0.6 + 0.5 * j / 14) * (1 + 0.15 * Math.sin(i)); pts.push([x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.55]); } line(c, pts, 5 - i * 0.4, i % 2 ? '#bfe6ff' : '#e6f6ff', 0.45 * a); }
}

// ---- a snow range at night: a white dome peak (left) and a golden peak (right); a glowing herb mountain is drawn live (herbPeak) ----
const SNOW_BASE = 1240;
function buildSnowRange() {
  const r = rng(623), sky = newLayer(0.05), far = newLayer(0.25), mid = newLayer(0.6), fg = newLayer(1.25);
  wash(sky.x, r, -M, -M, W + 2 * M, H + 2 * M, [[0, '#070a24'], [.4, '#16204a'], [.7, '#2a3a6a'], [1, '#4a5a8a']], { n: 520, alpha: 0.45, th: [26, 80], len: [240, 700] });
  for (let i = 0; i < 160; i++) dab(sky.x, -M + r() * (W + 2 * M), -M + r() * 900, 1 + r() * 2.2, 1 + r() * 2.2, 0, '#eef0ff', 0.2 + r() * 0.6);
  // distant snow ranges
  [['#3a4a7a', 260, 1.2, 0, 700], ['#2a365e', 200, 1.6, 0, 820]].forEach(([col, amp, rough, k, hz]) => { const pts = ridge(r, -M, W + M, hz, amp, 30, rough), x = far.x; x.beginPath(); x.moveTo(-M, H + M); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(W + M, H + M); x.closePath(); x.fillStyle = col; x.fill();
    pts.forEach((p, i) => { if (i % 2 === 0 && p[1] < hz) dab(x, p[0], p[1] + 14, 26, 10, 0, '#dfe6ff', 0.35); }); });
  // Kailasa: a white dome-peak (left); Rishabha: golden (right)
  blob(far.x, [[-60, 900], [60, 520], [170, 430], [280, 520], [400, 900]], '#cfd8f4', 1, 0.35); blob(far.x, [[60, 600], [170, 450], [250, 560], [170, 620]], '#ffffff', 0.6, 0.4);
  blob(far.x, [[700, 900], [820, 560], [930, 470], [1040, 560], [1160, 900]], '#b88a3a', 1, 0.35); blob(far.x, [[820, 620], [930, 490], [1010, 600], [930, 660]], '#f6c244', 0.7, 0.4);
  wash(mid.x, r, -M, SNOW_BASE - 40, W + 2 * M, H + M - SNOW_BASE, [[0, '#28304e'], [.4, '#1a1e36'], [1, '#0a0c1a']], { n: 380, alpha: 0.55, th: [14, 44], len: [120, 420] });
  for (let i = 0; i < 40; i++) { const px = -M + r() * (W + 2 * M), py = SNOW_BASE + r() * 160; dab(mid.x, px, py, 50 + r() * 60, 18 + r() * 14, 0, '#c8d0ee', 0.18); }
  const f = fg.x; for (let i = 0; i < 120; i++) { const px = -M + r() * (W + 2 * M), py = H + 40 + r() * 60, hh = 50 + r() * 110; stroke(f, px, py, px + (r() - .5) * 80, py - hh, 6 + r() * 9, jit('#0a0c18', r, 6), 1, (r() - .5) * .5); }
  return { layers: [sky, far, mid, fg], sky, far, mid, fg };
}
function snowRange(ctx, bg, cam, t, mid) { drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far); drawLayer(ctx, cam, bg.mid); if (mid) withCam(ctx, cam, 0.6, mid); drawLayer(ctx, cam, bg.fg); }
// the herb mountain / its torn-off peak: base centre (x, y), height s. o.glow 0..1 (the mountain's own blaze, 6.61.55-56),
// o.herbs 0..1 (the four shining herbs; 0 = hidden, 6.61.58), o.root 0..1 (a ragged torn base when carried)
function herbPeak(c, x, y, s, t, o = {}) {
  const g = o.glow === undefined ? 1 : o.glow, hb = o.herbs === undefined ? 1 : o.herbs;
  c.save(); c.translate(x, y); c.scale(s, s);
  if (g > 0) { glow(c, 0, -0.45, 1.1, '#ffd890', 0.35 * g); glow(c, 0, -0.5, 0.6, '#c8ffb0', 0.25 * g); }
  blob(c, [[-0.62, 0], [-0.46, -0.36], [-0.28, -0.6], [-0.1, -0.9], [0.06, -1.0], [0.2, -0.78], [0.38, -0.56], [0.56, -0.28], [0.66, 0]], '#4a5a52', 1, 0.3);
  blob(c, [[0.06, -1.0], [0.2, -0.78], [0.38, -0.56], [0.56, -0.28], [0.66, 0], [0.2, 0], [0.12, -0.5]], '#33403e', 0.8, 0.3);
  blob(c, [[-0.1, -0.9], [0.06, -1.0], [0.2, -0.78], [0.1, -0.74], [0.0, -0.8], [-0.1, -0.76]], '#eef2ff', 0.95, 0.3);          // snow cap
  for (let i = 0; i < 14; i++) { const a = hash(i * 3.1), b = hash(i * 7.7), px = -0.45 + a * 0.95, py = -0.08 - b * 0.5 * (1 - Math.abs(px)); dab(c, px, py, 0.05, 0.07, 0, i % 3 ? '#2e5a3a' : '#3e7a46', 0.9); }   // trees
  for (let i = 0; i < 5; i++) dab(c, -0.3 + i * 0.15, -0.2 - (i % 2) * 0.12, 0.02, 0.012, 0, '#f6c244', 0.7);          // gold veins (6.61.61: 'with gold, thousands of minerals')
  if (o.root) for (let i = 0; i < 8; i++) { const px = -0.52 + i * 0.15; dab(c, px, 0.02, 0.09, 0.035 + hash(i) * 0.03 * o.root, 0, i % 2 ? '#6a4a34' : '#5a3e2a', o.root); }   // torn earth under the lifted peak
  if (hb > 0) [[-0.22, -0.42], [0.1, -0.58], [0.28, -0.3], [-0.04, -0.24]].forEach(([hx, hy], i) => { const tw = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7); glow(c, hx, hy, 0.16, ['#b8ffb0', '#fff0a0', '#ffd27a', '#c8f0ff'][i], 0.8 * hb * tw); dab(c, hx, hy, 0.022, 0.022, 0, '#ffffff', hb); });
  c.restore();
}
// a hand-held torch: flame tip at (x, y)
function torch(c, x, y, t, seed = 0, a = 1) { stroke(c, x, y + 10, x - 6, y + 120, 9, '#4a2e1a', a); glow(c, x, y, 220, '#ffb050', 0.35 * a); flame(c, x, y, 18, t, seed); }

// ---- a royal court by day: warm sandstone arches, open sky behind, festoons ----
const COURT_FLOOR = 1420;
function buildCourt() {
  const r = rng(181), sky = newLayer(0.05), far = newLayer(0.3), mid = newLayer(0.6), fg = newLayer(1.25);
  wash(sky.x, r, -M, -M, W + 2 * M, H + 2 * M, [[0, '#3a5a9a'], [.45, '#8aaad0'], [.8, '#f0d8b0'], [1, '#e8c090']], { n: 300, alpha: 0.5, th: [20, 60], len: [200, 600] });
  for (let i = 0; i < 6; i++) { const x = -40 + i * 230; blob(far.x, [[x, COURT_FLOOR - 60], [x, 520], [x + 90, 400], [x + 180, 520], [x + 180, COURT_FLOOR - 60]], jit('#c89a6a', r, 8), 0.95, 0.2);
    blob(far.x, [[x + 30, COURT_FLOOR - 60], [x + 30, 560], [x + 90, 470], [x + 150, 560], [x + 150, COURT_FLOOR - 60]], '#f6e2b8', 0.55, 0.2); stroke(far.x, x + 10, 530, x + 170, 530, 6, '#e6b450', 0.8); }
  for (let i = 0; i < 9; i++) { const x = 60 + i * 120; stroke(far.x, x, 300, x, 340, 3, '#e6b450', 0.8); dab(far.x, x, 350, 18, 12, 0, ['#f4a6bc', '#f6d27a', '#ffffff'][i % 3], 0.9); }   // festoons
  wash(mid.x, r, -M, COURT_FLOOR - 40, W + 2 * M, H + M - COURT_FLOOR + 40, [[0, '#b08a5a'], [.3, '#8a6440'], [1, '#3a2418']], { n: 260, alpha: 0.6, th: [10, 30], len: [200, 500] });
  for (let i = 0; i < 14; i++) stroke(mid.x, 540 + (i - 7) * 40, COURT_FLOOR - 30, 540 + (i - 7) * 220, H + M, 2, '#d8b070', 0.35);
  [[40, 1.0], [1060, 1.0]].forEach(([px, k]) => { const w = 46; blob(mid.x, [[px - w, COURT_FLOOR], [px - w * 0.8, 120], [px + w * 0.8, 120], [px + w, COURT_FLOOR]], '#a8783a', 1, 0.15); for (let y = 240; y < COURT_FLOOR; y += 240) stroke(mid.x, px - w, y, px + w, y, 6, '#f0c860', 0.9); });
  const f = fg.x; for (let i = 0; i < 60; i++) dab(f, -M + r() * (W + 2 * M), H - 20 + r() * 80, 80, 30, 0, '#1a0e08', 0.8);
  return { layers: [sky, far, mid, fg], sky, far, mid, fg };
}
function court(ctx, bg, cam, t, mid) { drawLayer(ctx, cam, bg.sky); drawLayer(ctx, cam, bg.far); drawLayer(ctx, cam, bg.mid); if (mid) withCam(ctx, cam, 0.6, mid); drawLayer(ctx, cam, bg.fg); }
// a great divine bow: a huge dark-gold recurve, centre (x, y), half-length L, angle ang; brk 0..1 = broken in the middle and the halves falling apart
function greatBow(c, x, y, L, ang, t, brk = 0, strung = 0) {
  c.save(); c.translate(x, y); c.rotate(ang);
  const half = (sgn) => { c.save(); if (brk > 0) { c.translate(sgn * brk * 60, brk * 40); c.rotate(sgn * brk * 0.5); }
    const pts = [[0, 0], [sgn * L * 0.35, -L * 0.06], [sgn * L * 0.7, -L * 0.04], [sgn * L * 0.92, L * 0.06], [sgn * L, L * 0.02]];
    line(c, pts, L * 0.055, '#3a2a1a'); line(c, pts, L * 0.035, '#8a6428'); line(c, pts.slice(0, 3), L * 0.012, '#f0c860', 0.8);
    dab(c, sgn * L, L * 0.02, L * 0.03, L * 0.03, 0, '#f0c860'); c.restore(); };
  half(-1); half(1);
  if (brk <= 0) { dab(c, 0, 0, L * 0.05, L * 0.06, 0, '#c41e1e'); stroke(c, -L * 0.06, 0, L * 0.06, 0, L * 0.04, '#e6b450', 1); }
  else { glow(c, 0, 0, L * 0.5 * (1 - brk * 0.5), '#fff4d0', 0.8 * (1 - brk)); }
  if (strung > 0 && brk <= 0) { c.globalAlpha = strung; c.strokeStyle = '#f6f0e0'; c.lineWidth = 3; c.beginPath(); c.moveTo(-L, L * 0.02); c.lineTo(0, L * (0.02 + 0.25 * strung)); c.lineTo(L, L * 0.02); c.stroke(); c.globalAlpha = 1; }
  c.restore();
}
// the eight-wheeled chest the bow is kept in (1.66.4)
function bowChest(c, x, y, w, open = 0) {
  blob(c, [[x - w, y - w * 0.18], [x + w, y - w * 0.18], [x + w * 0.96, y + w * 0.06], [x - w * 0.96, y + w * 0.06]], '#6a3a1e', 1, 0.1); stroke(c, x - w, y - w * 0.18, x + w, y - w * 0.18, 6, '#e6b450', 1);
  for (let i = 0; i < 4; i++) { const wx = x - w * 0.8 + i * w * 0.53; dab(c, wx, y + w * 0.1, w * 0.08, w * 0.08, 0, '#3a2414'); dab(c, wx, y + w * 0.1, w * 0.03, w * 0.03, 0, '#e6b450'); }
  if (open > 0) blob(c, [[x - w, y - w * 0.18], [x + w, y - w * 0.18], [x + w * 0.9, y - w * 0.18 - w * 0.3 * open], [x - w * 0.9, y - w * 0.18 - w * 0.3 * open]], '#8a4a26', 0.9, 0.1);
  for (let i = 0; i < 6; i++) dab(c, x - w * 0.8 + i * w * 0.32, y - w * 0.2, 10, 6, 0, ['#f4a6bc', '#f6d27a', '#ffffff'][i % 3], 0.9);   // garlands on the bow-chest (1.66.2)
}
