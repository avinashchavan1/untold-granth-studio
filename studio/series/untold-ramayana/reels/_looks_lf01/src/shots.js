// ===== LF01 look options (Vali & Sugriva, Tara, Angada): portraits only, same rigs and finish as the reels =====
function buildScenes() {}
const L_PORT = { rim: '#ffe0a0', rimA: 0.6, dir: 1 };
function backdrop(c, t, col) {
  const r = rng(7); wash(c, r, -M, -M, W + 2 * M, H + 2 * M, [[0, '#14122e'], [.45, '#2a2048'], [.75, col || '#6a4a5a'], [1, '#2a1e2a']], { n: 420, alpha: 0.45, th: [30, 90], len: [200, 600] });
  glow(c, 540, 1000, 620, '#ffd890', 0.28); dab(c, 540, 1585, 330, 40, 0, '#0a0814', 0.45);
}
// brothers: Valmiki says they could not be told apart (4.12.30-31), so one look for both; Vali wears Indra's golden garland (4.17.5), Sugriva the flower creeper (4.12.36)
const BRO = {
  v1: { kind: 'man', vanara: true, crown: true, skin: '#c08a3a', skinSh: '#7e5426', muzzle: '#f2dcb0', cloth: '#a8301e', clothSh: '#661c14', sash: '#e6b450', hair: '#9a6224' },   // golden-brown (4.16.13 'hemapingala'), crowned, red
  v2: { kind: 'man', vanara: true, band: true, skin: '#8e5a2c', skinSh: '#56361c', muzzle: '#e6c8a0', cloth: '#2c3a6a', clothSh: '#1a2242', sash: '#e6b450', hair: '#6a3e1c' },   // deep tawny, gold head band, indigo
  v3: { kind: 'man', vanara: true, crown: true, skin: '#d2a466', skinSh: '#8e6a3e', muzzle: '#f6e6c8', cloth: '#1e6a4a', clothSh: '#10402c', sash: '#e6b450', hair: '#b07a3a' },   // honey-gold, crowned, green
};
const TARA = {
  t1: { kind: 'woman', vanara: true, skin: '#c8945a', skinSh: '#86603a', muzzle: '#f4e0c0', cloth: '#7a1e4a', clothSh: '#4a1030', border: '#e6b450', blouse: '#a8304a', hair: '#7a4a22' },   // vanara queen: fur face like the others
  t2: { kind: 'woman', ears: true, tail: true, fur: '#b07a3e', skin: '#d8a878', skinSh: '#a07a70', cloth: '#7a1e4a', clothSh: '#4a1030', border: '#e6b450', blouse: '#a8304a', hair: '#1a1210' },   // human face, small monkey ears + tail (like baby Hanuman's approved style)
  t3: { kind: 'woman', skin: '#dcb088', skinSh: '#a6807a', cloth: '#1e5a6a', clothSh: '#10343e', border: '#e6b450', blouse: '#2a7a8a', hair: '#0d0a16' },   // fully human queen, no vanara signs
};
const ANG = {
  a1: { kind: 'man', vanara: true, band: true, skin: '#c69044', skinSh: '#82582a', muzzle: '#f4e2bc', cloth: '#d88a1e', clothSh: '#9a5a14', sash: '#b8261e', hair: '#a06a2a' },   // young prince, gold band, saffron
  a2: { kind: 'man', vanara: true, crown: true, skin: '#c08a3a', skinSh: '#7e5426', muzzle: '#f2dcb0', cloth: '#a8301e', clothSh: '#661c14', sash: '#e6b450', hair: '#9a6224' },   // father's palette (option 1), small crown
};
const fig = (ch, pose, o = {}) => (c, t) => drawFigure(c, ch, P(Object.assign({ eye: 1, smile: 0.2, gaze: [0.25, 0] }, pose || {})), { x: o.x || 540, y: o.y || 1580, s: o.s || 980, face: o.face || 1 }, L_PORT);
const pair = (k) => (c, t) => {   // Vali (golden garland) and Sugriva (flower creeper) side by side, same look
  drawFigure(c, BRO[k], P({ eye: 1, smile: 0, brow: 0.6, gaze: [0.3, 0], garland: 'gold', handN: 'fist' }), { x: 330, y: 1580, s: 860, face: 1 }, L_PORT);
  drawFigure(c, Object.assign({}, BRO[k], { crown: false, band: false }), P({ eye: 1, smile: 0, brow: 0.3, gaze: [0.3, 0], garland: 'flowers' }), { x: 760, y: 1580, s: 860, face: -1 }, L_PORT);
};
const LOOKS = [
  ['brothers_1', pair('v1')], ['brothers_2', pair('v2')], ['brothers_3', pair('v3')],
  ['tara_1', fig(TARA.t1, { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] })],
  ['tara_2', fig(TARA.t2, { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] })],
  ['tara_3', fig(TARA.t3, { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] })],
  ['angada_1', fig(ANG.a1, {}, { s: 860 })], ['angada_2', fig(ANG.a2, {}, { s: 860 })],
];
const SHOTS = {}; LOOKS.forEach(([k, draw], i) => { SHOTS[i + 1] = (ctx, u, p, sh, t) => { backdrop(ctx, t); draw(ctx, 1.0); }; });
