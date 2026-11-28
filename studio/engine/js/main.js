// ===== main: load timeline, build locations, render frames with the gouache finish =====
let TL, BG = {}; const scene = mk(W, H), sctx = scene.getContext('2d'), fin = document.getElementById('final'), fctx = fin.getContext('2d'); fin.width = FW; fin.height = FH;
async function init() {
  TL = await (await fetch('timeline.json')).json();
  await Promise.all(['900 40px Cinzel', '700 40px Cinzel', '800 40px Cinzel', '800 40px Montserrat', '600 40px Montserrat', 'italic 600 40px Montserrat', '700 40px Montserrat', '700 40px Mukta'].map(f => document.fonts.load(f))); await document.fonts.ready;
  makeTextures();
  await (buildScenes() || Promise.resolve());   // defined by the reel's shots.js (may be async, e.g. to load proof photos)
  window.READY = true;
}
function renderFrame(n, q) {
  const t = n / FPS; let i = TL.shots.findIndex(s => t < s.start + s.dur - 1e-6); if (i < 0) i = TL.shots.length - 1;
  const sh = TL.shots[i], u = t - sh.start, p = clamp(u / sh.dur), post = { sat: 1, flash: 0 };
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1; sctx.globalCompositeOperation = 'source-over'; sctx.fillStyle = '#05060f'; sctx.fillRect(0, 0, W, H);
  SHOTS[sh.id](sctx, u, p, sh, t, post);
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1;
  // gouache finish: rough painted edges (boiling on threes), brush drag, paper grain, vignette
  const k = Math.floor(n / 3) % 3;
  fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.globalAlpha = 1; fctx.globalCompositeOperation = 'source-over';
  const cr = post.crop || CROP;   // window into the world (tall: the whole world)
  // optional camera (a series may define FX_CAM(sh, u, i, t) → { z, dx, dy, rot }: push-ins, drift, punches, whip-ins on the art only)
  const cam = typeof FX_CAM === 'function' ? FX_CAM(sh, u, i, t) : null;
  if (cam) { fctx.save(); fctx.translate(FW / 2 + (cam.dx || 0), FH / 2 + (cam.dy || 0)); fctx.rotate(cam.rot || 0); fctx.scale(cam.z || 1, cam.z || 1); fctx.translate(-FW / 2, -FH / 2); }
  fctx.filter = `url(#rough${k})` + (post.sat !== 1 ? ` saturate(${post.sat})` : ''); fctx.drawImage(scene, cr.x, cr.y, FW, FH, -10, -18, FW + 20, FH + 36); fctx.filter = 'none';
  if (cam) fctx.restore();
  fctx.globalCompositeOperation = 'overlay'; fctx.globalAlpha = 0.36; fctx.drawImage(TEX.brush[k], 0, 0);
  fctx.globalCompositeOperation = 'soft-light'; fctx.globalAlpha = 0.34; fctx.drawImage(TEX.grain, -(k * 37 % 40), -(k * 53 % 40), FW + 40, FH + 40);
  fctx.globalCompositeOperation = 'source-over'; fctx.globalAlpha = 1; fctx.drawImage(TEX.vig, 0, 0);
  if (post.flash > 0) { fctx.fillStyle = rgba(post.flashCol || '#ffffff', post.flash); fctx.fillRect(0, 0, FW, FH); }
  // soft cut-in on every shot, fade-in at the very start
  // a series may replace the soft cut with its own transition: FX_CUT(ctx, TL, i, u, t)
  if (typeof FX_CUT === 'function') FX_CUT(fctx, TL, i, u, t);
  else { const cut = 1 - map(u, 0, 3 / FPS); if (cut > 0 && i > 0) { fctx.fillStyle = `rgba(4,4,14,${cut * 0.5})`; fctx.fillRect(0, 0, FW, FH); } }
  if (t < 0.25) { fctx.fillStyle = `rgba(0,0,0,${1 - t / 0.25})`; fctx.fillRect(0, 0, FW, FH); }
  // UI on top (crisp): shot labels, subtitles, logo
  if (!window.CLEAN) {          // CLEAN = art only (thumbnails): no cards, subtitles or logo
    if (post.ui) post.ui(fctx);
    subtitle(fctx, sh, u);
    if (!post.noLogo) logo(fctx, 0.95);
    if (typeof FX_UI === 'function') FX_UI(fctx, sh, u, t, i, TL);   // series overlay on top: progress bar, beat sparkles, ...
  }
  return fin.toDataURL('image/jpeg', q || 0.92);
}
init().catch(e => console.log('INIT ERROR', e.message, e.stack));
