// ===== Untold Ramayana: this series' cast, on top of the shared art library (studio/engine/art/rigs.js → CH, drawFigure, parashu…) =====
// Locked looks (owner's picks are recorded in series.json → character_looks).
Object.assign(CH, {
  rama:    { kind: 'man',   skin: '#d9ae90', skinSh: '#9c7886', cloth: '#e6cc9e', clothSh: '#a98a74', sash: '#dba24c', hair: '#0e0c18', bow: true },
  lak:     { kind: 'man',   skin: '#c99d7c', skinSh: '#8c6a78', cloth: '#236a50', clothSh: '#123c3a', sash: '#3a8a68', hair: '#0e0c18', bow: true },
  sita:    { kind: 'woman', skin: '#dfb699', skinSh: '#a67e8a', cloth: '#dc8a2c', clothSh: '#9c5a36', border: '#b8261e', hair: '#0d0a16' },
  shabari: { kind: 'woman', elder: true, skin: '#a97a5c', skinSh: '#6c4a4c', cloth: '#8d6a44', clothSh: '#56402c', border: '#6a4a2c', blouse: '#6e5034', hair: '#dcd6cc' },   // A02: aged ascetic, bark-coloured robe, no jewellery
  monk:    { kind: 'monk',  skin: '#8e5c42', skinSh: '#573642', cloth: '#dc7c22', clothSh: '#8f4a28', hair: '#0b090f' },
  ahalya:  { kind: 'woman', plain: true, skin: '#e4bea2', skinSh: '#a8808a', cloth: '#d9ccb0', clothSh: '#9a8c74', border: '#8a6a3a', blouse: '#b09068', hair: '#14101c' },   // A03: ascetic, plain robe, no jewellery
  gautama: { kind: 'monk', sage: true, skin: '#a87a5a', skinSh: '#6a4a4a', cloth: '#b88e5c', clothSh: '#76583a', hair: '#ebe5da' },    // A03: elder sage, white jata + beard, bark/deerskin robe
  vishva:  { kind: 'monk', sage: true, skin: '#9c6c4c', skinSh: '#5e4040', cloth: '#cc7a2e', clothSh: '#8a4a24', hair: '#bcb4a8' },    // A03: Vishvamitra, grey jata, saffron robe
  nala:    { kind: 'man', vanara: true, skin: '#a8743e', skinSh: '#6a4628', muzzle: '#e8c8a0', cloth: '#7a4a2a', clothSh: '#4a2c1a', sash: '#c88a3a', hair: '#7a4a24' },     // A04: vanara engineer, son of Vishvakarma
  vanara:  { kind: 'man', vanara: true, skin: '#8a6038', skinSh: '#553a24', muzzle: '#dcbc96', cloth: '#5a3a22', clothSh: '#3a2416', sash: '#8a5a2a', hair: '#5a3a1e' },     // generic monkey of the army
  vanara2: { kind: 'man', vanara: true, skin: '#b08a5a', skinSh: '#76583a', muzzle: '#eedcbc', cloth: '#6a4a2a', clothSh: '#42301c', sash: '#a07040', hair: '#806040' },
  sagara:  { kind: 'man', god: true, skin: '#3f78b4', skinSh: '#22487a', cloth: '#b4201c', clothSh: '#6e1420', sash: '#e6b450', hair: '#0e1a34' },   // A04: the Ocean — lapis-blue, gold, red garlands and garments (CE 6.15.2)
  guha:    { kind: 'man', skin: '#8e5e40', skinSh: '#5a3a30', cloth: '#7a5232', clothSh: '#4a321e', sash: '#a8302a', hair: '#0e0c18', bow: true },   // A06: king of the Nishadas, forest hunter-chief
  boatman: { kind: 'man', skin: '#9a6a48', skinSh: '#62423a', cloth: '#d8ccb4', clothSh: '#988c76', sash: '#7a6a52', hair: '#14101c' },
  hanuman: { kind: 'man', vanara: true, crown: true, skin: '#c8743a', skinSh: '#86482a', muzzle: '#f2d4a8', cloth: '#b4201c', clothSh: '#6e1420', sash: '#e6b450', hair: '#a85a24' },   // A07: crowned, red-orange, red cloth
  mandodari: { kind: 'woman', skin: '#ecc8a0', skinSh: '#b08a86', cloth: '#7a1e4a', clothSh: '#4a1030', border: '#e6b450', blouse: '#a8304a', hair: '#0d0a16' },     // A07: Ravana's chief queen, 'radiant like gold'
  vibhishana: { kind: 'man', god: true, skin: '#6e5a62', skinSh: '#43343e', cloth: '#ece2cc', clothSh: '#a89c84', sash: '#e6b450', hair: '#0e0c18' },   // A92: the righteous rakshasa prince, crowned king of Lanka
  matali:  { kind: 'man', skin: '#c89a78', skinSh: '#8a6a60', cloth: '#e8d8b0', clothSh: '#a8987a', sash: '#4a7ab8', hair: '#14101c' },                         // Indra's charioteer
  indra:   { kind: 'man', god: true, skin: '#e8c08a', skinSh: '#b08a66', cloth: '#e6b450', clothSh: '#a87a2a', sash: '#c41e1e', hair: '#14101c' },   // A89: king of the gods, on Airavata
  jambavan: { kind: 'man', vanara: true, bear: true, elder: true, band: true, skin: '#7a6e66', skinSh: '#4a403c', muzzle: '#d8cfc2', ruff: '#f2eee6', cloth: '#8a1a1c', clothSh: '#561018', sash: '#e6b450', hair: '#9a8e84' },   // A23: Jambavan, aged king of the bears, son of Prajapati (6.61.14): silvered fur, white brows and beard, gold band, deep red cloth
  sushena: { kind: 'man', vanara: true, elder: true, skin: '#9a7a5a', skinSh: '#5e4a3a', muzzle: '#e8d6bc', cloth: '#e6dcc4', clothSh: '#a89c84', sash: '#3a8a68', hair: '#c8c0b4' },   // A23: Sushena, the vanara chief who heals Lakshmana (6.89): greying, pale cloth, green sash (Claude's pick, minor)
  janaka: { kind: 'man', god: true, sage: true, skin: '#d4a882', skinSh: '#987062', cloth: '#efe2c4', clothSh: '#b0a088', sash: '#e6b450', hair: '#ece6dc' },   // A18: Janaka, the royal sage (rajarshi): white hair and beard, gold crown, ivory and gold (owner's pick)
  parashurama: { kind: 'monk', sage: true, bow: true, skin: '#a8724a', skinSh: '#6a4436', cloth: '#8a4a2a', clothSh: '#5a2e1a', hair: '#1a1418' },   // A18: Parashurama, warrior-sage: black jata and beard, bark-brown robe, rudraksha, axe (parashu()) + bow (owner's pick)
  maricha: { kind: 'demon', skin: '#52695c', skinSh: '#28393e', cloth: '#1a1622', clothSh: '#0e0c14', hair: '#07070e' },
});
// the library's end card and generic scenes use hero / heroine / brother: here they are Rama, Sita and Lakshmana
Object.assign(CH, { hero: CH.rama, heroine: CH.sita, brother: CH.lak, monkey: CH.vanara, demon: CH.maricha });

// ---------- Ravana, true form (frontal, ten crowned heads) ----------
function ravanaHead(x, cx, cy, r, t, i, eyeGlow) {
  const skin = '#8e5c42', sh = '#553442';
  x.save(); x.translate(cx, cy); x.scale(r, r);
  // crown (tall, tiered)
  blob(x, [[-0.62, -0.5], [-0.5, -1.2], [-0.2, -1.75], [0, -2.25], [0.2, -1.75], [0.5, -1.2], [0.62, -0.5], [0, -0.38]], '#e2aa3c', 1, 0.3);
  blob(x, [[-0.62, -0.5], [-0.5, -1.2], [-0.2, -1.75], [0, -2.25], [-0.05, -1.2], [-0.1, -0.42]], '#a8742a', 0.75, 0.3);
  for (let k = 0; k < 3; k++) stroke(x, -0.56 + k * 0.1, -0.62 - k * 0.42, 0.56 - k * 0.1, -0.62 - k * 0.42, 0.09, '#f8dc86', 0.9, 0.12);
  dab(x, 0, -0.95, 0.13, 0.17, 0, '#c41e1e'); dab(x, 0, -2.26, 0.09, 0.12, 0, '#f8dc86'); stroke(x, -0.66, -0.47, 0.66, -0.47, 0.16, '#f0c050', 1, 0.1);
  // face
  blob(x, [[-0.6, -0.45], [0.6, -0.45], [0.66, 0.1], [0.42, 0.72], [0, 0.95], [-0.42, 0.72], [-0.66, 0.1]], skin, 1, 0.4);
  blob(x, [[-0.6, -0.45], [-0.1, -0.45], [-0.2, 0.3], [-0.05, 0.9], [-0.42, 0.72], [-0.66, 0.1]], sh, 0.55, 0.4);
  for (let k = 0; k < 3; k++) stroke(x, -0.3, -0.36 + k * 0.07, 0.3, -0.36 + k * 0.07, 0.03, '#e4ded6', 0.7);
  // brows + glowing eyes
  line(x, [[-0.52, -0.2], [-0.3, -0.24], [-0.06, -0.06]], 0.1, '#0b090f'); line(x, [[0.52, -0.2], [0.3, -0.24], [0.06, -0.06]], 0.1, '#0b090f');
  const g = eyeGlow * (0.8 + 0.2 * Math.sin(t * 9 + i));
  glow(x, -0.27, 0.02, 0.5, '#ff3010', 0.6 * g); glow(x, 0.27, 0.02, 0.5, '#ff3010', 0.6 * g);
  blob(x, [[-0.44, 0.0], [-0.27, -0.09], [-0.1, 0.03], [-0.27, 0.1]], mix('#2a0808', '#ff3a14', g)); blob(x, [[0.44, 0.0], [0.27, -0.09], [0.1, 0.03], [0.27, 0.1]], mix('#2a0808', '#ff3a14', g));
  dab(x, -0.27, 0.01, 0.05, 0.05, 0, mix('#000', '#ffe890', g)); dab(x, 0.27, 0.01, 0.05, 0.05, 0, mix('#000', '#ffe890', g));
  line(x, [[-0.06, 0.3], [0, 0.36], [0.06, 0.3]], 0.04, sh);
  // moustache + mouth
  x.strokeStyle = '#0b090f'; x.lineCap = 'round'; x.lineWidth = 0.15;
  x.beginPath(); x.moveTo(0, 0.47); x.bezierCurveTo(-0.25, 0.42, -0.45, 0.72, -0.66, 0.5); x.stroke(); x.beginPath(); x.moveTo(0, 0.47); x.bezierCurveTo(0.25, 0.42, 0.45, 0.72, 0.66, 0.5); x.stroke();
  x.lineWidth = 0.07; x.beginPath(); x.moveTo(-0.66, 0.5); x.quadraticCurveTo(-0.8, 0.36, -0.7, 0.26); x.stroke(); x.beginPath(); x.moveTo(0.66, 0.5); x.quadraticCurveTo(0.8, 0.36, 0.7, 0.26); x.stroke();
  blob(x, [[-0.2, 0.62], [0, 0.58], [0.2, 0.62], [0, 0.72]], '#2c0a12'); stroke(x, -0.12, 0.62, 0.12, 0.62, 0.03, '#efe8dc', 0.9);
  dab(x, -0.68, 0.2, 0.09, 0.12, 0, '#f0c050'); dab(x, 0.68, 0.2, 0.09, 0.12, 0, '#f0c050');
  x.restore();
}
function drawRavana(ctx, cx, base, s, t, eyeGlow, rise, hs) {   // hs: optional i -> head scale (0 = gone, 1 = whole), for the severed-and-regrown heads (Yuddha 6.96)
  const x = ctx, skin = '#8e5c42', sh = '#553442';
  x.save(); x.translate(cx, base); x.scale(s, s);
  const br = 1 + Math.sin(t * 2.2) * 0.012;
  // far arm (his right, viewer left) raised with fist; bow arm (viewer right)
  limb(x, [-0.36, -1.04], [-0.62, -0.78], 0.2, 0.17, sh); limb(x, [-0.62, -0.78], [-0.66, -1.16 - rise * 0.06], 0.16, 0.13, skin); dab(x, -0.66, -1.2 - rise * 0.06, 0.09, 0.09, 0, skin); stroke(x, -0.7, -1.0, -0.6, -1.0, 0.07, '#f0c050');
  // bow
  x.save(); x.translate(0.72, -0.74); line(x, [[-0.06, -0.62], [0.0, -0.56], [0.1, -0.3], [0.0, 0], [0.1, 0.3], [0.0, 0.56], [-0.06, 0.62]], 0.04, '#7a4a2a'); stroke(x, -0.06, -0.62, -0.06, 0.62, 0.008, '#f0e6d0', 0.8); stroke(x, 0.01, -0.6, -0.05, -0.63, 0.03, '#f0c050'); stroke(x, 0.01, 0.6, -0.05, 0.63, 0.03, '#f0c050'); x.restore();
  // torso
  blob(x, [[-0.34, 0], [-0.3, -0.5], [-0.46, -0.95], [-0.3, -1.12], [0, -1.16], [0.3, -1.12], [0.46, -0.95], [0.3, -0.5], [0.34, 0]], skin, 1, 0.4);
  blob(x, [[-0.34, 0], [-0.3, -0.5], [-0.46, -0.95], [-0.3, -1.12], [-0.08, -1.1], [-0.14, -0.5], [-0.1, 0]], sh, 0.6, 0.4);
  line(x, [[-0.2, -0.8], [0, -0.74], [0.2, -0.8]], 0.016, sh, 0.7);
  // ornaments
  blob(x, [[-0.3, -1.1], [0, -0.86], [0.3, -1.1], [0.26, -1.14], [0, -0.96], [-0.26, -1.14]], '#f0c050'); dab(x, 0, -0.88, 0.05, 0.06, 0, '#c41e1e');
  line(x, [[-0.24, -1.06], [0, -0.55], [0.24, -1.06]], 0.022, '#f0c050'); dab(x, 0, -0.55, 0.06, 0.07, 0, '#f0c050'); dab(x, 0, -0.55, 0.03, 0.035, 0, '#1e8a8a');
  // red dhoti + gold belt
  blob(x, [[-0.37, -0.06], [-0.5, 0.5], [0, 0.6], [0.5, 0.5], [0.37, -0.06], [0, -0.14]], '#b4201c', 1, 0.3); blob(x, [[-0.37, -0.06], [-0.5, 0.5], [-0.15, 0.58], [-0.1, -0.1]], '#6e1420', 0.7, 0.3);
  blob(x, [[-0.08, -0.1], [0.08, -0.1], [0.14, 0.56], [-0.14, 0.56]], '#d43a24', 1, 0.2); for (let i = -1; i <= 1; i++) stroke(x, i * 0.04, -0.06, i * 0.08, 0.54, 0.012, '#6e1420', 0.7);
  line(x, [[-0.37, -0.08], [0, -0.14], [0.37, -0.08]], 0.09, '#f0c050'); dab(x, 0, -0.13, 0.08, 0.07, 0, '#f8dc86'); dab(x, 0, -0.13, 0.035, 0.03, 0, '#c41e1e');
  // near arm holding the bow
  limb(x, [0.38, -1.03], [0.6, -0.72], 0.2, 0.17, skin); limb(x, [0.6, -0.72], [0.72, -0.76], 0.16, 0.13, skin); dab(x, 0.73, -0.75, 0.085, 0.09, 0, skin); stroke(x, 0.44, -0.9, 0.56, -0.98, 0.07, '#f0c050');
  // shoulder ridge + ten heads (outer first)
  blob(x, [[-1.0, -1.2], [-0.6, -1.3], [0, -1.32], [0.6, -1.3], [1.0, -1.2], [0.9, -1.06], [0.4, -1.0], [0, -0.98], [-0.4, -1.0], [-0.9, -1.06]], sh, 1, 0.4);
  line(x, [[-0.95, -1.12], [0, -1.04], [0.95, -1.12]], 0.05, '#f0c050');
  const order = [0, 9, 1, 8, 2, 7, 3, 6, 4, 5];
  order.forEach(i => { const d = i - 4.5, ad = Math.abs(d), hx = d * 0.208, r = 0.168 - ad * 0.009, hy = (-1.4 + ad * ad * 0.004 + Math.sin(t * 1.6 + i * 0.9) * 0.008) * br; const k = hs ? hs(i) : 1; if (k > 0.01) ravanaHead(x, hx, hy, r * k, t, i, eyeGlow); });
  x.restore();
}

// ---- A89: baby Hanuman: round, big-headed, curly tail; faces +x. o: { pose: 'sit'|'reach'|'fly'|'fall', face, rot, eye, smile, mouthO, glow }
function drawBabyHanuman(ctx, cx, cy, s, t, o = {}) {
  const x = ctx, pose = o.pose || 'sit', skin = '#d07c3e', sh = '#8e4e2c', muz = '#f6dab0', eye = o.eye === undefined ? 1 : o.eye;
  x.save(); x.translate(cx, cy); if (o.rot) x.rotate(o.rot); x.scale(s * (o.face || 1), s);
  if (o.glow) glow(x, 0, -0.3, 1.4, '#ffe0a0', 0.5 * o.glow);
  const sw = Math.sin(t * 3);
  const tail = pose === 'fly' || pose === 'fall' ? [[-0.25, 0.15], [-0.7, 0.25], [-1.0, 0.05 + sw * 0.05], [-1.15, -0.2], [-1.0, -0.32], [-0.9, -0.2]] : [[-0.22, 0.25], [-0.6, 0.3], [-0.8, 0.0 + sw * 0.04], [-0.75, -0.35], [-0.6, -0.42], [-0.52, -0.3]];
  line(x, tail, 0.09, sh); line(x, tail, 0.06, skin);
  const legs = { sit: [[[-0.12, 0.25], [-0.32, 0.42], [0.0, 0.48]], [[0.12, 0.25], [0.34, 0.42], [0.08, 0.5]]],
    reach: [[[-0.1, 0.28], [-0.14, 0.55], [-0.06, 0.62]], [[0.1, 0.28], [0.16, 0.55], [0.24, 0.6]]],
    fly: [[[-0.1, 0.25], [-0.42, 0.42], [-0.62, 0.4]], [[0.1, 0.25], [-0.25, 0.5], [-0.48, 0.55]]],
    fall: [[[-0.1, 0.25], [-0.2, 0.5], [-0.05, 0.58]], [[0.1, 0.25], [0.3, 0.45], [0.36, 0.3]]] }[pose];
  legs.forEach(L => { line(x, L, 0.15, sh); line(x, L, 0.12, skin); dab(x, L[2][0], L[2][1], 0.08, 0.05, 0, sh); });
  dab(x, 0, 0.05, 0.3, 0.34, 0, skin); dab(x, 0.05, 0.1, 0.18, 0.22, 0, muz, 0.7);
  blob(x, [[-0.28, 0.14], [0.28, 0.14], [0.24, 0.3], [0, 0.36], [-0.24, 0.3]], '#c41e1e', 1, 0.4); line(x, [[-0.28, 0.14], [0.28, 0.14]], 0.04, '#f0c050');
  const arms = { sit: [[[-0.22, -0.12], [-0.3, 0.1], [-0.18, 0.22]], [[0.22, -0.12], [0.34, 0.08], [0.22, 0.2]]],
    reach: [[[-0.2, -0.14], [0.05, -0.5], [0.22, -0.78]], [[0.22, -0.12], [0.4, -0.45], [0.5, -0.7]]],
    fly: [[[-0.2, -0.12], [0.2, -0.35], [0.55, -0.42]], [[0.22, -0.12], [0.5, -0.2], [0.75, -0.22]]],
    fall: [[[-0.2, -0.12], [-0.42, -0.4], [-0.5, -0.62]], [[0.22, -0.12], [0.46, -0.32], [0.6, -0.5]]] }[pose];
  arms.forEach(A => { line(x, A, 0.13, sh); line(x, A, 0.1, skin); dab(x, A[2][0], A[2][1], 0.07, 0.07, 0, skin); const m = [lerp(A[1][0], A[2][0], .6), lerp(A[1][1], A[2][1], .6)]; dab(x, m[0], m[1], 0.05, 0.035, 0, '#f0c050'); });
  const hx = 0.04, hy = -0.5;
  [-1, 1].forEach(k => { dab(x, hx + k * 0.33, hy - 0.02, 0.1, 0.12, 0, sh); dab(x, hx + k * 0.33, hy - 0.02, 0.06, 0.08, 0, muz); });
  dab(x, hx, hy, 0.34, 0.32, 0, skin); blob(x, [[hx - 0.3, hy - 0.12], [hx - 0.12, hy - 0.34], [hx + 0.1, hy - 0.36], [hx + 0.3, hy - 0.14], [hx, hy - 0.22]], sh, 0.5, 0.4);
  line(x, [[hx - 0.02, hy - 0.3], [hx + 0.04, hy - 0.42], [hx + 0.1, hy - 0.38]], 0.04, sh);
  dab(x, hx + 0.08, hy + 0.1, 0.2, 0.15, 0, muz);
  [-0.06, 0.16].forEach(ex => { if (eye > 0.2) { dab(x, hx + ex, hy - 0.07, 0.055, 0.065 * eye, 0, '#1a1018'); dab(x, hx + ex + 0.015, hy - 0.09, 0.018, 0.018, 0, '#ffffff'); } else line(x, [[hx + ex - 0.05, hy - 0.06], [hx + ex, hy - 0.04], [hx + ex + 0.05, hy - 0.06]], 0.02, '#1a1018'); });
  dab(x, hx + 0.1, hy + 0.04, 0.03, 0.02, 0, '#5a2a1a');
  const sm = o.smile === undefined ? 0.6 : o.smile; line(x, [[hx, hy + 0.13], [hx + 0.09, hy + 0.13 + 0.05 * sm], [hx + 0.18, hy + 0.12]], 0.022, '#5a2a1a');
  if (o.mouthO) dab(x, hx + 0.09, hy + 0.16, 0.04, 0.05 * o.mouthO, 0, '#7a2a2a');
  dab(x, hx - 0.14, hy + 0.06, 0.05, 0.03, 0, '#e86a5a', 0.4);
  x.restore();
}
// ---- A89: Rahu, who "retains only his head" (7.35.41): a huge dark smoky head with glowing eyes
function drawRahu(ctx, cx, cy, s, t, a = 1) {
  const x = ctx; x.save(); x.translate(cx, cy); x.scale(s, s);
  for (let i = 0; i < 26; i++) { const an = i / 26 * TAU + Math.sin(t + i) * 0.1, d = 0.95 + 0.25 * hash(i); dab(x, Math.cos(an) * d, Math.sin(an) * d * 0.9 - 0.1, 0.28, 0.2, an, i % 2 ? '#1a1030' : '#2a1640', 0.7 * a); }
  dab(x, 0, 0, 0.9, 0.85, 0, '#241838', a); dab(x, -0.2, -0.2, 0.5, 0.4, 0, '#3a2654', 0.6 * a);
  [-0.32, 0.32].forEach(ex => { stroke(x, ex - 0.22, -0.3 + (ex > 0 ? 0.06 : 0), ex + 0.2, -0.3 + (ex > 0 ? 0 : 0.06), 0.09, '#0c0816', a); dab(x, ex, -0.12, 0.13, 0.08, 0, '#ffcc40', a); dab(x, ex, -0.12, 0.05, 0.05, 0, '#ff5a1a', a); glow(x, ex, -0.12, 0.3, '#ff9a3a', 0.4 * a); });
  blob(x, [[-0.45, 0.25], [0, 0.18], [0.45, 0.25], [0.3, 0.5], [0, 0.56], [-0.3, 0.5]], '#0a0610', a, 0.4);
  [-0.3, -0.1, 0.1, 0.3].forEach((fx, i) => blob(x, [[fx - 0.05, 0.22], [fx + 0.05, 0.22], [fx, 0.34 + (i % 2) * 0.05]], '#f2e6d0', a, 0.2));
  for (let i = -2; i <= 2; i++) blob(x, [[i * 0.18 - 0.08, -0.72], [i * 0.18, -0.95 - (2 - Math.abs(i)) * 0.06], [i * 0.18 + 0.08, -0.72]], '#a07a2a', 0.9 * a, 0.2);
  x.restore();
}
// ---- A89: Airavata, Indra's white king of elephants (7.35.38, 44); face -1 = facing left
function drawAiravata(ctx, cx, base, s, t, face = -1) {
  const x = ctx, wh = '#eef0f4', sh = '#b8bcd0', gold = '#e6b450';
  x.save(); x.translate(cx, base); x.scale(s * -face, s);
  [-0.55, -0.3, 0.35, 0.6].forEach((lx, i) => blob(x, [[lx - 0.12, -0.5], [lx + 0.12, -0.5], [lx + 0.13, 0], [lx - 0.13, 0]], i % 2 ? sh : wh, 1, 0.2));
  blob(x, [[-0.85, -0.5], [-0.8, -0.95], [-0.4, -1.15], [0.3, -1.15], [0.7, -1.0], [0.85, -0.6], [0.7, -0.4], [-0.7, -0.4]], wh, 1, 0.45);
  blob(x, [[-0.85, -0.5], [-0.8, -0.8], [-0.3, -0.7], [0.4, -0.75], [0.85, -0.6], [0.7, -0.4], [-0.7, -0.4]], sh, 0.35, 0.45);
  blob(x, [[-0.4, -1.1], [0.35, -1.1], [0.4, -0.6], [0, -0.52], [-0.45, -0.6]], '#b4201c', 1, 0.3); line(x, [[-0.45, -0.6], [0, -0.52], [0.4, -0.6]], 0.05, gold); for (let i = 0; i < 6; i++) dab(x, -0.38 + i * 0.15, -0.58, 0.03, 0.04, 0, gold);
  dab(x, 0.95, -0.95, 0.35, 0.33, 0, wh); blob(x, [[0.75, -1.15], [0.55, -1.0], [0.55, -0.7], [0.75, -0.62], [0.85, -0.9]], sh, 1, 0.4);
  blob(x, [[0.85, -1.25], [1.05, -1.32], [1.2, -1.22], [1.0, -1.12]], gold, 1, 0.3);
  const sw = Math.sin(t * 1.4) * 0.06; line(x, [[1.15, -0.85], [1.3, -0.6], [1.32, -0.3 + sw], [1.25, -0.12], [1.35, -0.05]], 0.14, wh); line(x, [[1.15, -0.85], [1.3, -0.6], [1.32, -0.3 + sw]], 0.04, sh, 0.5);
  line(x, [[1.12, -0.78], [1.3, -0.72], [1.42, -0.8]], 0.05, '#fff8e8'); line(x, [[1.05, -0.76], [1.2, -0.66], [1.3, -0.7]], 0.04, '#f0e6d0');
  dab(x, 1.02, -1.0, 0.035, 0.035, 0, '#1a1018');
  x.restore();
}

// ---- A89 v2: Bal Hanuman: a little human child with a monkey face and tail (pick a style with the user)
// style 'a' = the A07 Hanuman as a child (fur cap, cream muzzle, no crown); 'b' = traditional Bal Hanuman (small gold mukut, tilak, earrings);
// 'c' = mostly human child (black hair, light muzzle, monkey ears and tail). pose: 'sit' | 'reach' | 'fly' | 'fall'. Faces +x.
function drawBalHanuman(ctx, cx, cy, s, t, o = {}) {
  const x = ctx, st = o.style || 'a', pose = o.pose || 'sit', eye = o.eye === undefined ? 1 : o.eye;
  const human = st === 'd' || st === 'e' || st === 'f' || st === 'g';
  const skin = st === 'c' ? '#d89a62' : st === 'd' ? '#e48e52' : st === 'e' || st === 'f' || st === 'g' ? '#c98d62' : '#d8783a', sh = st === 'c' ? '#9a6440' : st === 'd' ? '#a85e34' : st === 'e' || st === 'f' || st === 'g' ? '#8e5e40' : '#96502a', muz = '#f4d6ae', GOLD_ = '#f0c050', dhoti = '#c41e1e';
  x.save(); x.translate(cx, cy); if (o.rot) x.rotate(o.rot); x.scale(s * (o.face || 1), s);
  if (o.glow) glow(x, 0, -0.4, 1.5, '#ffe0a0', 0.5 * o.glow);
  const sw = Math.sin(t * 3);
  // tail
  const tail = pose === 'fly' || pose === 'fall' ? [[-0.12, 0.12], [-0.5, 0.2], [-0.82, 0.02 + sw * 0.04], [-0.95, -0.22], [-0.82, -0.34], [-0.72, -0.24]] : [[-0.12, 0.2], [-0.42, 0.28], [-0.62, 0.05 + sw * 0.04], [-0.6, -0.28], [-0.48, -0.36], [-0.4, -0.26]];
  line(x, tail, 0.065, sh); line(x, tail, 0.042, skin);
  // legs (human child legs with feet)
  const legs = { sit: [[[-0.08, 0.2], [-0.26, 0.38], [0.02, 0.46]], [[0.08, 0.2], [0.3, 0.36], [0.1, 0.48]]],
    reach: [[[-0.07, 0.22], [-0.1, 0.48], [-0.08, 0.7]], [[0.07, 0.22], [0.12, 0.48], [0.14, 0.7]]],
    fly: [[[-0.07, 0.2], [-0.36, 0.34], [-0.62, 0.36]], [[0.07, 0.2], [-0.22, 0.42], [-0.48, 0.5]]],
    fall: [[[-0.07, 0.2], [-0.16, 0.46], [-0.02, 0.6]], [[0.07, 0.2], [0.28, 0.4], [0.36, 0.26]]] }[pose];
  legs.forEach(L => { line(x, L, 0.13, sh); line(x, L, 0.105, skin); const f = L[2], b = L[1]; const an = Math.atan2(f[1] - b[1], f[0] - b[0]); dab(x, f[0] + Math.cos(an) * 0.03, f[1] + Math.sin(an) * 0.03 + 0.015, 0.075, 0.04, an * 0.3, skin); if (st === 'b') dab(x, lerp(b[0], f[0], 0.85), lerp(b[1], f[1], 0.85), 0.05, 0.025, an, GOLD_); });
  // torso: a child's chest and round belly
  blob(x, [[-0.17, -0.3], [0.17, -0.3], [0.21, -0.05], [0.18, 0.16], [0, 0.22], [-0.18, 0.16], [-0.21, -0.05]], skin, 1, 0.5);
  blob(x, [[-0.17, -0.3], [-0.05, -0.3], [-0.1, 0.0], [-0.08, 0.2], [-0.18, 0.16], [-0.21, -0.05]], sh, 0.35, 0.5);
  dab(x, 0.02, 0.0, 0.1, 0.12, 0, muz, st === 'c' || human ? 0 : 0.35);   // light belly fur
  // dhoti
  blob(x, [[-0.2, 0.08], [0.2, 0.08], [0.22, 0.26], [0.04, 0.3], [-0.2, 0.26]], dhoti, 1, 0.4); line(x, [[-0.2, 0.08], [0.2, 0.08]], 0.035, GOLD_);
  if (st === 'b' || human) { line(x, [[-0.14, -0.28], [0.0, -0.12], [0.14, -0.28]], 0.022, GOLD_); dab(x, 0, -0.12, 0.03, 0.035, 0, '#c41e1e'); }   // necklace
  if (st !== 'c' && !human) line(x, [[-0.15, -0.3], [0.04, -0.05], [0.17, 0.08]], 0.028, '#f6e6c0', 0.9);   // sacred thread
  // arms with hands
  const arms = { sit: [[[-0.17, -0.25], [-0.26, -0.02], [-0.16, 0.14]], [[0.17, -0.25], [0.28, -0.04], [0.2, 0.12]]],
    reach: [[[-0.16, -0.26], [0.0, -0.56], [0.12, -0.82]], [[0.17, -0.25], [0.32, -0.52], [0.4, -0.78]]],
    fly: [[[-0.16, -0.25], [0.14, -0.42], [0.46, -0.5]], [[0.17, -0.25], [0.42, -0.3], [0.7, -0.32]]],
    fall: [[[-0.16, -0.25], [-0.36, -0.46], [-0.42, -0.66]], [[0.17, -0.25], [0.4, -0.4], [0.54, -0.58]]] }[pose];
  arms.forEach(A => { line(x, A, 0.095, sh); line(x, A, 0.075, skin); dab(x, A[2][0], A[2][1], 0.055, 0.06, 0, skin); const m = [lerp(A[1][0], A[2][0], .7), lerp(A[1][1], A[2][1], .7)]; dab(x, m[0], m[1], 0.04, 0.03, 0, GOLD_); });
  // head: a child's head (human shape) with a monkey muzzle
  const hx = 0.03, hy = -0.56;
  dab(x, hx - 0.01, hy + 0.22, 0.07, 0.06, 0, skin);   // neck
  if (st === 'f') [-1, 1].forEach(k => { dab(x, hx + k * 0.265, hy + 0.03, 0.045, 0.07, 0, skin); dab(x, hx + k * 0.27, hy + 0.03, 0.022, 0.042, 0, sh, 0.5); });   // human ears
  else if (st === 'g') [-1, 1].forEach(k => { dab(x, hx + k * 0.27, hy + 0.0, 0.06, 0.08, 0, sh); dab(x, hx + k * 0.27, hy + 0.0, 0.035, 0.05, 0, '#e8b896'); });   // slightly monkey ears
  else [-1, 1].forEach(k => { dab(x, hx + k * 0.27, hy + 0.02, 0.075, 0.09, 0, sh); dab(x, hx + k * 0.27, hy + 0.02, 0.045, 0.06, 0, muz); });   // ears
  dab(x, hx, hy, 0.27, 0.29, 0, skin);
  if (st === 'a') { blob(x, [[hx - 0.27, hy - 0.02], [hx - 0.2, hy - 0.24], [hx, hy - 0.32], [hx + 0.2, hy - 0.24], [hx + 0.27, hy - 0.02], [hx + 0.14, hy - 0.12], [hx, hy - 0.14], [hx - 0.14, hy - 0.12]], sh, 0.8, 0.4); for (let i = 0; i < 7; i++) stroke(x, hx - 0.21 + i * 0.07, hy - 0.13, hx - 0.2 + i * 0.07, hy - 0.08, 0.02, sh, 0.8); }
  if (st === 'b') { blob(x, [[hx - 0.24, hy - 0.12], [hx - 0.12, hy - 0.27], [hx + 0.12, hy - 0.27], [hx + 0.24, hy - 0.12], [hx, hy - 0.18]], '#1a1018', 0.85, 0.4);
    blob(x, [[hx - 0.17, hy - 0.2], [hx - 0.12, hy - 0.42], [hx, hy - 0.54], [hx + 0.12, hy - 0.42], [hx + 0.17, hy - 0.2]], GOLD_, 1, 0.3); dab(x, hx, hy - 0.33, 0.035, 0.045, 0, '#c41e1e'); stroke(x, hx - 0.19, hy - 0.2, hx + 0.19, hy - 0.2, 0.035, GOLD_);
    [-1, 1].forEach(k => dab(x, hx + k * 0.27, hy + 0.12, 0.03, 0.04, 0, GOLD_)); stroke(x, hx + 0.02, hy - 0.16, hx + 0.02, hy - 0.08, 0.03, '#c41e1e'); }
  if (st === 'c') { blob(x, [[hx - 0.27, hy - 0.02], [hx - 0.18, hy - 0.26], [hx + 0.04, hy - 0.33], [hx + 0.24, hy - 0.2], [hx + 0.26, hy - 0.04], [hx + 0.1, hy - 0.16], [hx - 0.12, hy - 0.14]], '#1a1018', 0.95, 0.4); line(x, [[hx, hy - 0.3], [hx + 0.06, hy - 0.4], [hx + 0.12, hy - 0.36]], 0.035, '#1a1018'); }
  if (human) {   // a little human child's face: black hair with a top-knot, eyebrows, nose, lips; only a hint of muzzle, monkey ears and the tail stay
    blob(x, [[hx - 0.27, hy + 0.02], [hx - 0.2, hy - 0.24], [hx + 0.02, hy - 0.32], [hx + 0.22, hy - 0.22], [hx + 0.27, hy - 0.02], [hx + 0.16, hy - 0.15], [hx - 0.02, hy - 0.18], [hx - 0.16, hy - 0.12]], '#15101a', 1, 0.4);
    dab(x, hx - 0.02, hy - 0.36, 0.07, 0.06, 0, '#15101a'); dab(x, hx - 0.02, hy - 0.36, 0.075, 0.02, 0, GOLD_, 0.9);   // top-knot with a gold band
    stroke(x, hx + 0.035, hy - 0.13, hx + 0.035, hy - 0.06, 0.022, '#c41e1e');   // small tilak
    if (st === 'd' || st === 'e') dab(x, hx + 0.07, hy + 0.12, 0.12, 0.08, 0, muz, 0.45);   // just a hint of muzzle (D/E only)
    [-0.06, 0.13].forEach(ex => line(x, [[hx + ex - 0.05, hy - 0.09], [hx + ex, hy - 0.11], [hx + ex + 0.05, hy - 0.095]], 0.016, '#15101a'));   // eyebrows
    [-0.06, 0.13].forEach(ex => { if (eye > 0.2) { dab(x, hx + ex, hy - 0.025, 0.05, 0.035 * eye, 0, '#fbf3ea'); dab(x, hx + ex + 0.008, hy - 0.025, 0.03, 0.032 * eye, 0, '#2a1a14'); dab(x, hx + ex + 0.018, hy - 0.035, 0.01, 0.01, 0, '#ffffff'); } else line(x, [[hx + ex - 0.04, hy - 0.02], [hx + ex, hy - 0.005], [hx + ex + 0.04, hy - 0.02]], 0.016, '#2a1a14'); });
    line(x, [[hx + 0.06, hy + 0.0], [hx + 0.09, hy + 0.06], [hx + 0.06, hy + 0.075]], 0.014, sh);   // nose
    const smh = o.smile === undefined ? 0.6 : o.smile; line(x, [[hx + 0.0, hy + 0.13], [hx + 0.065, hy + 0.13 + 0.035 * smh], [hx + 0.13, hy + 0.125]], 0.02, '#a8443a');
    if (o.mouthO) dab(x, hx + 0.065, hy + 0.15, 0.03, 0.035 * o.mouthO, 0, '#7a2a2a');
    dab(x, hx - 0.1, hy + 0.07, 0.045, 0.028, 0, '#f07a6a', 0.3); dab(x, hx + 0.2, hy + 0.07, 0.035, 0.025, 0, '#f07a6a', 0.25);
    x.restore(); return;
  }
  // muzzle: monkey mouth area (smaller for style c)
  const mz = st === 'c' ? 0.7 : 1; dab(x, hx + 0.07, hy + 0.11, 0.15 * mz, 0.11 * mz, 0, muz);
  [-0.06, 0.12].forEach(ex => { if (eye > 0.2) { dab(x, hx + ex, hy - 0.03, 0.045, 0.055 * eye, 0, '#1a1018'); dab(x, hx + ex + 0.013, hy - 0.05, 0.015, 0.015, 0, '#ffffff'); } else line(x, [[hx + ex - 0.04, hy - 0.02], [hx + ex, hy], [hx + ex + 0.04, hy - 0.02]], 0.018, '#1a1018'); });
  if (st !== 'c') line(x, [[hx - 0.12, hy - 0.1], [hx + 0.03, hy - 0.11], [hx + 0.19, hy - 0.1]], 0.025, sh, 0.8);   // little brow ridge
  dab(x, hx + 0.08, hy + 0.06, 0.025, 0.018, 0, '#5a2a1a');
  const sm = o.smile === undefined ? 0.6 : o.smile; line(x, [[hx + 0.0, hy + 0.13], [hx + 0.08, hy + 0.13 + 0.04 * sm], [hx + 0.16, hy + 0.12]], 0.018, '#5a2a1a');
  if (o.mouthO) dab(x, hx + 0.08, hy + 0.15, 0.035, 0.04 * o.mouthO, 0, '#7a2a2a');
  dab(x, hx - 0.12, hy + 0.08, 0.04, 0.025, 0, '#e86a5a', 0.35);
  x.restore();
}
