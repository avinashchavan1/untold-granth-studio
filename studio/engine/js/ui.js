// ===== Text, subtitles, logo — gold / ivory / blood-red; Cinzel (titles) + Montserrat (subtitles) =====
const P_ = (typeof SERIES !== 'undefined' && SERIES.palette) || {}; const C_GOLD = P_.gold || '#f6c244', C_IVORY = P_.ivory || '#fbf3df', C_RED = P_.red || '#c81e1e', C_INK = P_.ink || '#07061a';
function text(ctx, str, x, y, o = {}) {
  const { size = 60, font = 'Cinzel', weight = 800, color = C_IVORY, align = 'center', ls = 0, alpha = 1, stroke = 0, strokeCol = C_INK, shadow = 18, italic = false } = o;
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = ls + 'px'; ctx.lineJoin = 'round';
  if (shadow) { ctx.shadowColor = 'rgba(3,3,14,0.85)'; ctx.shadowBlur = shadow; ctx.shadowOffsetY = 3; }
  if (stroke) { ctx.strokeStyle = strokeCol; ctx.lineWidth = stroke; ctx.strokeText(str, x, y); }
  ctx.fillStyle = color; ctx.fillText(str, x, y); ctx.restore();
}
// text() that shrinks the size until the line fits maxW (cards with long lines never run off the screen)
function textFit(ctx, str, x, y, o = {}, maxW = 960) {
  let size = o.size || 60; const fnt = o.font || 'Cinzel', wt = o.weight || 800;
  ctx.save(); ctx.letterSpacing = (o.ls || 0) + 'px';
  for (; size > 28; size -= 2) { ctx.font = `${o.italic ? 'italic ' : ''}${wt} ${size}px ${fnt}`; if (ctx.measureText(str).width <= maxW) break; }
  ctx.restore(); text(ctx, str, x, y, Object.assign({}, o, { size }));
}
function logo(ctx, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  // small diya mark
  const x = 62, y = 150; ctx.fillStyle = C_GOLD; ctx.beginPath(); ctx.moveTo(x - 17, y - 6); ctx.quadraticCurveTo(x, y + 14, x + 17, y - 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.quadraticCurveTo(x + 9, y - 16, x, y - 9); ctx.quadraticCurveTo(x - 9, y - 16, x, y - 30); ctx.fill();
  ctx.restore();
  text(ctx, SERIES.logo, 92, 158, { size: 29, weight: 700, color: C_GOLD, align: 'left', ls: 4, alpha: a, shadow: 10 });
}
// subtitles: lower third, bold, spoken word in gold
function layoutSub(ctx, en) {
  ctx.font = '800 58px Montserrat'; ctx.letterSpacing = '0px';
  const words = en.split(' '), lines = []; let cur = [];
  words.forEach(w => { const test = cur.concat(w).join(' '); if (cur.length && ctx.measureText(test).width > (FW > FH ? 1500 : 900)) { lines.push(cur); cur = [w]; } else cur.push(w); }); if (cur.length) lines.push(cur);
  const groups = []; if (lines.length === 3 && FW <= FH) groups.push(lines); else for (let i = 0; i < lines.length; i += 2) groups.push(lines.slice(i, i + 2));
  // balance: avoid a single orphan word group
  return groups;
}
function subtitle(ctx, sh, u) {
  if (!sh.en) return;
  const lead = sh.vStart - sh.start, t0 = lead - 0.12, t1 = lead + sh.speech + 0.3; if (u < t0 || u > t1) return;
  const groups = layoutSub(ctx, sh.en), words = sh.en.split(' ');
  const wts = words.map(w => w.replace(/[^\w]/g, '').length + 1.5 + (/[,.:!?]/.test(w) ? 2.2 : 0)), tot = wts.reduce((a, b) => a + b, 0);
  const f = clamp((u - lead) / sh.speech, 0, 0.9999) * tot; let acc = 0, cur = 0; for (let i = 0; i < words.length; i++) { if (f >= acc) cur = i; acc += wts[i]; }
  let idx = 0, gi = 0; for (let g = 0; g < groups.length; g++) { const n = groups[g].reduce((a, l) => a + l.length, 0); if (cur >= idx && cur < idx + n) { gi = g; break; } idx += n; }
  const grp = groups[gi], a = Math.min(map(u, t0, t0 + 0.12), 1 - map(u, t1 - 0.12, t1));
  ctx.save(); ctx.font = '800 58px Montserrat'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.globalAlpha = a;
  const lh = 78, y0 = (FW > FH ? 958 : 1490) - (grp.length - 1) * lh / 2; let wi = idx;
  grp.forEach((ln, li) => {
    const sp = ctx.measureText(' ').width, widths = ln.map(w => ctx.measureText(w).width), full = widths.reduce((a, b) => a + b, 0) + sp * (ln.length - 1); let x = FW / 2 - full / 2; const y = y0 + li * lh;
    ln.forEach((w, k) => {
      const on = wi === cur && u >= lead;
      ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(3,3,14,0.9)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4; ctx.strokeStyle = C_INK; ctx.lineWidth = 12; ctx.strokeText(w, x, y);
      ctx.shadowColor = 'transparent'; ctx.fillStyle = on ? C_GOLD : C_IVORY; ctx.fillText(w, x, y);
      x += widths[k] + sp; wi++;
    });
  });
  ctx.restore();
}
// sentence start times (relative to shot start), found from the pauses in the voice envelope
function sentenceStarts(sh, n) {
  if (sh.sent && sh.sent.length >= n) return sh.sent.slice(0, n).map(x => sh.vStart - sh.start + x);
  const lead = sh.vStart - sh.start, env = sh.env || [], runs = []; let s = -1;
  for (let i = 0; i < env.length; i++) { const q = env[i] < 0.09; if (q && s < 0) s = i; if (!q && s >= 0) { if (s > 4 && i - s >= 3 && i < sh.speech * FPS) runs.push([s, i]); s = -1; } }
  runs.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0])); const picks = runs.slice(0, n - 1).sort((a, b) => a[0] - b[0]).map(r => lead + r[1] / FPS);
  const out = [lead].concat(picks); while (out.length < n) out.push(lead + sh.speech * out.length / n); return out;
}
function mouthEnv(sh, u) { const lead = sh.vStart - sh.start, i = (u - lead) * FPS, e = sh.env || []; if (i < 0 || i >= e.length - 1) return 0; const a = Math.floor(i), v = lerp(e[a], e[a + 1] || 0, i - a); return clamp(v * 1.15 - 0.05); }
const blink = (t, seed) => { const c = (t + seed * 1.37) % 3.3; return c < 0.14 ? 0.12 : 1; };
