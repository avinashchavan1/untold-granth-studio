// ===== Cast sheet: one portrait per shot (art only), rendered with the same rigs and gouache finish as the reels =====
function buildScenes() {}
const L_PORT = { rim: '#ffe0a0', rimA: 0.6, dir: 1 };
function backdrop(c, t, col) {
  const r = rng(7); wash(c, r, -M, -M, W + 2 * M, H + 2 * M, [[0, '#14122e'], [.45, '#2a2048'], [.75, col || '#6a4a5a'], [1, '#2a1e2a']], { n: 420, alpha: 0.45, th: [30, 90], len: [200, 600] });
  glow(c, 540, 1000, 620, '#ffd890', 0.28); dab(c, 540, 1585, 330, 40, 0, '#0a0814', 0.45);
}
const fig = (key, pose, o = {}) => (c, t) => drawFigure(c, CH[key], P(Object.assign({ eye: 1, smile: 0.3, gaze: [0.25, 0] }, pose || {})), { x: o.x || 540, y: o.y || 1580, s: o.s || 980, face: o.face || 1 }, L_PORT);
const CAST = [
  ['rama', fig('rama', { bow: 'B' })], ['lakshmana', fig('lak', { bow: 'B' })], ['sita', fig('sita', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] })],
  ['hanuman', fig('hanuman', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] })],
  ['hanuman_child', (c, t) => drawBalHanuman(c, 540, 1230, 560, t, { style: 'g', pose: 'sit', smile: 1 })],
  ['ravana', (c, t) => drawRavana(c, 540, 1340, 380, t, 1, 0)],
  ['shabari', fig('shabari', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] })], ['ahalya', fig('ahalya', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] })],
  ['gautama', fig('gautama')], ['vishvamitra', fig('vishva')], ['maricha', fig('maricha')],
  ['nala', fig('nala')], ['vanara', fig('vanara')], ['sagara', fig('sagara', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] })],
  ['guha', fig('guha')], ['boatman', fig('boatman')], ['mandodari', fig('mandodari')], ['vibhishana', fig('vibhishana', { handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] })],
  ['matali', fig('matali')], ['indra', fig('indra')],
  ['jambavan', fig('jambavan', { smile: 0, handN: 'namaste', handF: 'none', aN: [0.115, 0.1], aF: [0.115, 0.1] })],
  ['rahu', (c, t) => drawRahu(c, 540, 1050, 430, t, 1)], ['airavata', (c, t) => drawAiravata(c, 470, 1500, 300, t, -1)],
];
const SHOTS = {}; CAST.forEach(([k, draw], i) => { SHOTS[i + 1] = (ctx, u, p, sh, t) => { backdrop(ctx, t); draw(ctx, 1.0); }; });
