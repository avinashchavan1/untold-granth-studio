// REEL=<reel dir> node render.js stills 10,200,4.5s,...   |   REEL=<reel dir> node render.js clean 51s,72.5s  (art-only PNGs for thumbnails)   |   REEL=<reel dir> node render.js range <start> <end> <out.mp4>
// env PLATFORM=instagram|youtube picks the call to action on the end card (series.json → cta).
// Serves one virtual folder /x/ that layers: reel/src  >  series/art  >  engine/art (shared library)  >  engine/js   (first match wins),
// plus /x/series.js generated from series.json, and /fonts/ (series/fonts > engine/fonts).
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process');
const REEL = path.resolve(process.env.REEL || '.'), SERIES = path.resolve(REEL, '..', '..'), ENGINE = path.resolve(__dirname, '..');
const LAYERS = [path.join(REEL, 'src'), path.join(SERIES, 'art'), path.join(ENGINE, 'art'), path.join(ENGINE, 'js')], FONTS = [path.join(SERIES, 'fonts'), path.join(ENGINE, 'fonts')];
const resolve = u => { const [, dir, ...rest] = u.split('/'); const name = rest.join('/'); const roots = dir === 'fonts' ? FONTS : dir === 'x' ? LAYERS : [];
  for (const r of roots) { const f = path.join(r, name); if (f.startsWith(r) && fs.existsSync(f)) return f; } return null; };
fs.mkdirSync(path.join(REEL, 'frames'), { recursive: true });
const SCRIPT_ = (() => { try { return JSON.parse(fs.readFileSync(path.join(REEL, 'src', 'script.json'), 'utf8')); } catch (e) { return {}; } })();
const FRAME = process.env.FRAME || SCRIPT_.frame || 'tall';   // tall | wide | tall_from_wide (see core.js)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png' };
(async () => {
  const srv = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split('?')[0]);
    if (u === '/x/series.js') { s.writeHead(200, { 'Content-Type': 'text/javascript' }); s.end('const SERIES = ' + fs.readFileSync(path.join(SERIES, 'series.json'), 'utf8') + ';\nconst PLATFORM = ' + JSON.stringify(process.env.PLATFORM || 'instagram') + ';\nconst FRAME = ' + JSON.stringify(FRAME) + ';'); return; }
    if (u === '/x/timeline.json' && process.env.TIMELINE) { s.writeHead(200, { 'Content-Type': 'application/json' }); s.end(fs.readFileSync(path.join(REEL, 'src', process.env.TIMELINE))); return; }   // short cut
    const f = resolve(u); if (!f) { s.writeHead(404); s.end(); return; } fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(d); }); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: FRAME === 'wide' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 } });
  pg.on('console', m => console.log('[page]', m.text())); pg.on('pageerror', e => console.log('[pageerror]', e.message, e.stack));
  await pg.goto(`http://127.0.0.1:${port}/x/index.html`); await pg.waitForFunction('window.READY===true', null, { timeout: 180000 });
  const mode = process.argv[2];
  const LOSSLESS = process.env.LOSSLESS === '1';   // masters: PNG frames -> lossless x264 (no JPEG step anywhere)
  const grab = async (n, q) => Buffer.from((await pg.evaluate(([n, q, L]) => L ? (renderFrame(n, q), document.getElementById('final').toDataURL('image/png')) : renderFrame(n, q), [n, q, LOSSLESS])).split(',')[1], 'base64');
  if (mode === 'clean') {
    await pg.evaluate(() => { window.CLEAN = true; });
    for (const tok of process.argv[3].split(',')) { const n = tok.includes('s') ? await pg.evaluate(s => Math.round(parseFloat(s) * FPS), tok.replace('s', '')) : +tok;
      await pg.evaluate(n => renderFrame(n, 1), n); const png = await pg.evaluate(() => document.getElementById('final').toDataURL('image/png'));
      const f = path.join(REEL, 'frames', `clean_${String(n).padStart(4, '0')}.png`); fs.writeFileSync(f, Buffer.from(png.split(',')[1], 'base64')); console.log('clean', f); }
  } else if (mode === 'stills') {
    for (const tok of process.argv[3].split(',')) { const n = tok.includes('s') ? await pg.evaluate(s => Math.round(parseFloat(s) * FPS), tok.replace('s', '')) : +tok; const t0 = Date.now(); fs.writeFileSync(path.join(REEL, 'frames', `f${String(n).padStart(4, '0')}.jpg`), await grab(n, 0.9)); console.log('frame', n, Date.now() - t0, 'ms'); }
  } else {
    const a = +process.argv[3], b = +process.argv[4], out = process.argv[5];
    const enc = LOSSLESS ? ['-c:v', 'png', '-i', '-', '-c:v', 'libx264rgb', '-preset', 'ultrafast', '-qp', '0', '-pix_fmt', 'rgb24']
                         : ['-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p'];
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '24', ...enc, '-r', '24', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let n = a; n < b; n++) { const buf = await grab(n, 0.95); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if ((n - a) % 48 === 0) console.log(out, n, '/', b); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await br.close(); srv.close();
})();
