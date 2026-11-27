// ===== Reel template — replace placeholder shots with real choreography (see reels/A01/src/shots.js) =====
// Every shot: (ctx, u = seconds into shot, p = 0..1 progress, sh = timeline entry, t = global seconds, post = {ui, sat, flash, noLogo})
function buildScenes() { BG.herN = buildHermitage('night'); BG.ms = buildManuscript(); }
const LAST = () => TL.shots[TL.shots.length - 1].id;
const SHOTS = new Proxy({
  1(ctx, u, p, sh, t, post) { titleShot(ctx, u, p, sh, t, post, sh.card || [[TL.reel, null]]); },
  2(ctx, u, p, sh, t, post) { sourceCard(ctx, u, p, sh, t, post, TL.source_card); },
}, { get: (o, k) => o[k] || (+k === LAST() ? endCard : (ctx, u, p, sh, t, post) => titleShot(ctx, u, p, sh, t, post, sh.card || [])) });
