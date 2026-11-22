// ===== storyreel-studio renderer — core: math, colour, gouache painting helpers, post =====
// FRAME (from the reel's script.json "frame" or env FRAME): 'tall' = classic 9:16 reel (art world 1080x1920 = the frame);
// 'wide' = full-length 16:9 video: art is painted once on a 1920x1920 world and the frame is a 1920x1080 band of it;
// 'tall_from_wide' = a reel derived from a wide production: same 1920x1920 world, frame = its centre 1080x1920 column.
const FRAME_ = (typeof FRAME !== 'undefined' && FRAME) || 'tall', WORLD_SQ = FRAME_ !== 'tall';
const W = WORLD_SQ ? 1920 : 1080, H = 1920, FPS = 24, TAU = Math.PI * 2, M = 170; // world size; M = layer margin for camera moves
const FW = FRAME_ === 'wide' ? 1920 : 1080, FH = FRAME_ === 'wide' ? 1080 : 1920;   // output frame
const CROP = { x: FRAME_ === 'tall_from_wide' ? 420 : 0, y: FRAME_ === 'wide' ? 560 : 0 };   // default window into the world (a shot may move it: post.crop)
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const map = (t, a, b) => clamp((t - a) / (b - a));
const ease = (t, a, b) => sm(map(t, a, b));
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = t => Math.pow(clamp(t), 3);
const backOut = t => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };

// ---- colour ----
function rgb(c) { if (c[0] === '#') { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; } const m = c.match(/[\d.]+/g).map(Number); return m; }
const toHex = a => '#' + a.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
function mix(a, b, t) { const A = rgb(a), B = rgb(b); return toHex([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]); }
function rgba(c, a) { const A = rgb(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }
function jit(c, r, amt = 12) { const A = rgb(c), d = (r() - 0.5) * 2 * amt; return toHex([A[0] + d + (r() - .5) * amt * .6, A[1] + d + (r() - .5) * amt * .6, A[2] + d + (r() - .5) * amt * .6]); }
function gradCol(stops, t) { t = clamp(t); for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const a = stops[i - 1], b = stops[i]; return mix(a[1], b[1], (t - a[0]) / (b[0] - a[0] || 1)); } return stops[stops.length - 1][1]; }

function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---- brush primitives ----
function stroke(ctx, x1, y1, x2, y2, w, col, alpha = 1, bend = 0) {
  ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2 + bend * (y2 - y1), (y1 + y2) / 2 - bend * (x2 - x1), x2, y2); ctx.stroke(); ctx.globalAlpha = 1;
}
function dab(ctx, x, y, rx, ry, rot, col, alpha = 1) { ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(1e-4, rx), Math.max(1e-4, ry), rot, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
// dry-brush: a bundle of thin broken bristle lines
function bristle(ctx, r, x1, y1, x2, y2, w, col, alpha = 0.6, n = 7) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let i = 0; i < n; i++) {
    const o = (i / (n - 1) - .5) * w, a = r() * 0.25, b = 1 - r() * 0.25;
    stroke(ctx, x1 + dx * a + nx * o, y1 + dy * a + ny * o, x1 + dx * b + nx * o, y1 + dy * b + ny * o, w / n * (0.6 + r() * 0.9), col, alpha * (0.4 + r() * 0.6));
  }
}
// smooth closed/open curve through points (Catmull-Rom -> bezier)
function curve(ctx, pts, closed = true, tension = 0.5) {
  const n = pts.length; if (n < 2) return;
  const P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  ctx.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), k = tension / 3 * 2;
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k / 2, p1[1] + (p2[1] - p0[1]) * k / 2, p2[0] - (p3[0] - p1[0]) * k / 2, p2[1] - (p3[1] - p1[1]) * k / 2, p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}
function blob(ctx, pts, col, alpha = 1, tension = 0.5) { ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.beginPath(); curve(ctx, pts, true, tension); ctx.fill(); ctx.globalAlpha = 1; }
function poly(ctx, pts, col, alpha = 1) { ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
function line(ctx, pts, w, col, alpha = 1, smooth = true) { ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); if (smooth) curve(ctx, pts, false); else pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.globalAlpha = 1; }
// tapered limb between two points
function limb(ctx, a, b, w1, w2, col, alpha = 1) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(a[0] + nx * w1 / 2, a[1] + ny * w1 / 2); ctx.lineTo(b[0] + nx * w2 / 2, b[1] + ny * w2 / 2);
  ctx.arc(b[0], b[1], w2 / 2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true);
  ctx.lineTo(a[0] - nx * w1 / 2, a[1] - ny * w1 / 2);
  ctx.arc(a[0], a[1], w1 / 2, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true);
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
}
// gouache wash: flat gradient then many overlapping opaque-ish strokes sampled from the gradient
function wash(ctx, r, x, y, w, h, stops, o = {}) {
  const { n = 500, len = [160, 520], th = [18, 60], alpha = 0.35, jitter = 10, angle = 0, vertical = true } = o;
  const g = vertical ? ctx.createLinearGradient(0, y, 0, y + h) : ctx.createLinearGradient(x, 0, x + w, 0);
  stops.forEach(s => g.addColorStop(s[0], s[1])); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h, t = vertical ? (py - y) / h : (px - x) / w, L = lerp(len[0], len[1], r()), a = angle + (r() - .5) * 0.12;
    stroke(ctx, px - Math.cos(a) * L / 2, py - Math.sin(a) * L / 2, px + Math.cos(a) * L / 2, py + Math.sin(a) * L / 2, lerp(th[0], th[1], r()), jit(gradCol(stops, t), r, jitter), alpha, (r() - .5) * 0.06);
  }
}
// ridge silhouette points across the width
function ridge(r, x0, x1, base, amp, steps, rough = 1) {
  const pts = []; let ph = r() * 10, ph2 = r() * 10;
  for (let i = 0; i <= steps; i++) { const t = i / steps; pts.push([lerp(x0, x1, t), base - amp * (0.5 + 0.5 * Math.sin(t * 5.3 + ph)) * (0.6 + 0.4 * Math.sin(t * 13 * rough + ph2)) - r() * amp * 0.08]); }
  return pts;
}

// ---- textures (paper grain + brush overlay), generated once ----
const TEX = {};
function makeTextures() {
  // paper grain
  const g = mk(FW / 2, FH / 2), gc = g.getContext('2d'), id = gc.createImageData(FW / 2, FH / 2), r = rng(7);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - .5) * 70 + (r() - .5) * 30; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  gc.putImageData(id, 0, 0); TEX.grain = g;
  // brush overlays (3 variants -> gentle boil)
  TEX.brush = [];
  for (let k = 0; k < 3; k++) {
    const c = mk(FW, FH), x = c.getContext('2d'), q = rng(100 + k * 31);
    x.fillStyle = '#808080'; x.fillRect(0, 0, FW, FH);
    for (let i = 0; i < 900; i++) {
      const px = q() * FW, py = q() * FH, a = (q() - .5) * 0.9 + (q() < .5 ? 0 : 0.5), L = 60 + q() * 260, v = q() < .5 ? 255 : 0;
      bristle(x, q, px, py, px + Math.cos(a) * L, py + Math.sin(a) * L, 14 + q() * 46, v ? '#ffffff' : '#000000', 0.10 + q() * 0.10, 6);
    }
    TEX.brush.push(c);
  }
  // vignette
  const v = mk(FW, FH), vx = v.getContext('2d'), VR = Math.max(FW, FH), vg = vx.createRadialGradient(FW / 2, FH * 0.48, VR * 0.25, FW / 2, FH * 0.5, VR * 0.72);
  vg.addColorStop(0, 'rgba(6,8,26,0)'); vg.addColorStop(1, 'rgba(6,8,26,0.62)'); vx.fillStyle = vg; vx.fillRect(0, 0, FW, FH); TEX.vig = v;
}

// ---- camera helper: draw fn in a parallax-transformed space ----
function withCam(ctx, cam, depth, fn) {
  const z = 1 + ((cam.z || 1) - 1) * (0.55 + 0.45 * depth);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2 - (cam.x || 0) * (0.15 + 0.85 * depth), -H / 2 - (cam.y || 0) * (0.15 + 0.85 * depth));
  if (cam.rot) { ctx.translate(W / 2, H / 2); ctx.rotate(cam.rot); ctx.translate(-W / 2, -H / 2); }
  fn(ctx); ctx.restore();
}
function drawLayer(ctx, cam, layer) { withCam(ctx, cam, layer.depth, c => c.drawImage(layer.c, -M, -M)); }
function newLayer(depth) { const c = mk(W + 2 * M, H + 2 * M), x = c.getContext('2d'); x.translate(M, M); return { c, x, depth }; }

// ---- shared ambient effects ----
function fireflies(ctx, t, seed, n, box, alpha = 1) {
  for (let i = 0; i < n; i++) {
    const h1 = hash(seed + i * 3.1), h2 = hash(seed + i * 7.7), h3 = hash(seed + i * 1.3);
    const x = box[0] + h1 * box[2] + Math.sin(t * (0.3 + h3 * 0.5) + h2 * 9) * 60 + noise1(t * 0.4 + i * 11) * 40;
    const y = box[1] + h2 * box[3] + Math.cos(t * (0.25 + h1 * 0.4) + h3 * 9) * 45 + noise1(t * 0.35 + i * 5) * 40;
    const b = Math.pow(0.5 + 0.5 * Math.sin(t * (1.1 + h2 * 1.6) + h1 * 20), 2.2) * alpha;
    if (b < 0.02) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 26); g.addColorStop(0, rgba('#f4e27a', 0.55 * b)); g.addColorStop(1, rgba('#f4e27a', 0));
    ctx.fillStyle = g; ctx.fillRect(x - 26, y - 26, 52, 52); dab(ctx, x, y, 3.4, 3.4, 0, '#fff6b0', b);
  }
}
function mist(ctx, t, seed, n, box, col, alpha, speed = 12) {
  for (let i = 0; i < n; i++) {
    const h1 = hash(seed + i * 2.3), h2 = hash(seed + i * 5.9), h3 = hash(seed + i * 9.1);
    const w = 380 + h3 * 420, x = ((box[0] + h1 * (box[2] + w) + t * speed * (0.5 + h2)) % (box[2] + w)) - w / 2 + box[0], y = box[1] + h2 * box[3];
    const g = ctx.createRadialGradient(x, y, 0, x, y, w / 2); g.addColorStop(0, rgba(col, alpha * (0.5 + 0.5 * h3))); g.addColorStop(1, rgba(col, 0));
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.32); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - w / 2, w, w); ctx.restore();
  }
}
function glow(ctx, x, y, rad, col, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
