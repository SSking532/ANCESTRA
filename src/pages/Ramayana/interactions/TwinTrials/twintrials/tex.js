// Procedural canvas textures — the whole game ships with zero external assets.
export const PAL = {
  ivory: '#f4ecd8', parchment: '#e8d9b5', brown: '#3b2a1d', gold: '#b8893a', goldHi: '#e7c36a', forest: '#2f5d34',
  saffron: '#c9702a', vermilion: '#b3382a', stone: '#c9b48c',
};
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function makeTex(THREE, size, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = o.w || size; c.height = o.h || size;
  const g = c.getContext('2d'); draw(g, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
  t.anisotropy = 8;
  if (o.srgb !== false) { if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; else if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; }
  t.needsUpdate = true;
  return t;
}
const speckle = (g, w, h, n, cols, amin, amax, smin, smax, r) => {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = amin + r() * (amax - amin); g.fillStyle = cols[(r() * cols.length) | 0];
    const s = smin + r() * (smax - smin); g.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.8));
  }
  g.globalAlpha = 1;
};
const wrapDraw = (g, w, h, fn) => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { g.save(); g.translate(dx, dy); fn(); g.restore(); } };

export function drawStone(g, w, h, seed = 1, dark = false) {
  const r = rng(seed);
  const base = dark ? ['#7a6a55', '#6c5d4a', '#85745d'] : ['#cdb88f', '#c2ab81', '#d5c29d', '#b9a37a'];
  g.fillStyle = dark ? '#6a5b49' : '#c5b08a'; g.fillRect(0, 0, w, h);
  const n = 4, cell = w / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const off = (j % 2) * cell * 0.5;
    const x = i * cell + off + 3, y = j * cell + 3;
    g.fillStyle = base[(r() * base.length) | 0];
    wrapDraw(g, w, h, () => { g.fillRect(x, y, cell - 6, cell - 6); });
    const gr = g.createLinearGradient(x, y, x + cell, y + cell);
    gr.addColorStop(0, 'rgba(255,245,220,0.18)'); gr.addColorStop(1, 'rgba(40,25,10,0.2)');
    g.fillStyle = gr; wrapDraw(g, w, h, () => { g.fillRect(x, y, cell - 6, cell - 6); });
  }
  speckle(g, w, h, 1600, ['#5a4a33', '#8c7956', '#e8dcc0', '#3d2f20'], 0.05, 0.3, 1, 3, r);
  g.strokeStyle = 'rgba(50,36,20,0.45)'; g.lineWidth = 1;
  for (let i = 0; i < 7; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 26; y += (r() - 0.5) * 26; g.lineTo(x, y); } g.stroke(); }
}
export function drawWood(g, w, h, seed = 3) {
  const r = rng(seed); g.fillStyle = '#6b4a2c'; g.fillRect(0, 0, w, h);
  const planks = 6, pw = w / planks;
  for (let i = 0; i < planks; i++) {
    g.fillStyle = ['#7a5633', '#6a4a2b', '#835d38', '#5f4226'][(r() * 4) | 0]; g.fillRect(i * pw + 1, 0, pw - 2, h);
    for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(30,18,8,${0.08 + r() * 0.2})`; g.lineWidth = 0.6 + r() * 1.2; g.beginPath(); const x = i * pw + r() * pw; g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 8, h * 0.3, x + (r() - 0.5) * 8, h * 0.7, x + (r() - 0.5) * 4, h); g.stroke(); }
    g.fillStyle = 'rgba(20,10,0,0.6)'; g.fillRect(i * pw, 0, 1.5, h);
  }
}
export function drawBark(g, w, h, seed = 4) {
  const r = rng(seed); g.fillStyle = '#4b3826'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${20 + r() * 40},${14 + r() * 24},8,${0.25 + r() * 0.5})`; g.lineWidth = 1 + r() * 4; g.beginPath(); const x = r() * w; g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 16, h * 0.33, x + (r() - 0.5) * 16, h * 0.66, x + (r() - 0.5) * 6, h); g.stroke(); }
  speckle(g, w, h, 500, ['#7a6246', '#2a1e12'], 0.1, 0.4, 1, 3, r);
}
export function drawGrass(g, w, h, seed = 5) {
  const r = rng(seed); g.fillStyle = '#4a7a3a'; g.fillRect(0, 0, w, h);
  const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); gr.addColorStop(0, 'rgba(120,160,70,0.35)'); gr.addColorStop(1, 'rgba(20,60,30,0.25)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5200; i++) { const x = r() * w, y = r() * h; g.strokeStyle = ['#356a2e', '#5b8f3f', '#7ea84b', '#2d5a2a', '#9ab85a'][(r() * 5) | 0]; g.globalAlpha = 0.15 + r() * 0.4; g.lineWidth = 1 + r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - 3 - r() * 7); g.stroke(); }
  g.globalAlpha = 1;
  speckle(g, w, h, 60, ['#e8d870', '#f2f0e0'], 0.5, 0.9, 1, 2.2, r);
}
export function drawDirt(g, w, h, seed = 6) {
  const r = rng(seed); g.fillStyle = '#a88a5c'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 2600, ['#8b6f45', '#c9ae7e', '#6f5636', '#d8c398'], 0.1, 0.45, 1, 4, r);
  for (let i = 0; i < 90; i++) { g.fillStyle = ['#8d8576', '#a79d8a', '#6b6454'][(r() * 3) | 0]; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
}
export function drawStraw(g, w, h, seed = 7) {
  const r = rng(seed); g.fillStyle = '#c9a24a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1300; i++) { g.strokeStyle = ['#e3c36c', '#b88c36', '#d6b256', '#9a7326', '#f0d890'][(r() * 5) | 0]; g.globalAlpha = 0.3 + r() * 0.6; g.lineWidth = 1 + r() * 1.5; g.beginPath(); const x = r() * w, y = r() * h, a = r() * 6.28, l = 10 + r() * 26; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  g.globalAlpha = 1;
}
export function drawThatch(g, w, h, seed = 8) {
  const r = rng(seed); g.fillStyle = '#9b7a3e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1100; i++) { g.strokeStyle = ['#c0a05a', '#7d5f2c', '#a98846', '#5f4620', '#d1b46c'][(r() * 5) | 0]; g.globalAlpha = 0.4 + r() * 0.5; g.lineWidth = 1 + r() * 2; g.beginPath(); const x = r() * w, y = r() * h; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y + 14 + r() * 28); g.stroke(); }
  g.globalAlpha = 1;
  for (let y = 0; y < h; y += h / 7) { g.fillStyle = 'rgba(40,24,6,0.35)'; g.fillRect(0, y, w, 3); }
}
export function drawPlaster(g, w, h, seed = 9) {
  const r = rng(seed); g.fillStyle = '#d8c3a0'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 1800, ['#b89c74', '#eadcc0', '#9f8560'], 0.06, 0.28, 1, 5, r);
  g.fillStyle = '#7a3f26'; g.fillRect(0, h - h * 0.14, w, h * 0.14); // terracotta band
  g.fillStyle = '#f0e6cc'; for (let x = 6; x < w; x += 22) { g.beginPath(); g.moveTo(x, h - h * 0.14); g.lineTo(x + 8, h - h * 0.14 + 10); g.lineTo(x + 16, h - h * 0.14); g.fill(); }
}
export function drawLeafCard(g, w, h) {
  g.clearRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#2d5a2a'); gr.addColorStop(1, '#a6c45a');
  g.fillStyle = gr;
  for (let i = 0; i < 9; i++) { const x = (i + 0.5) * w / 9, bw = w / 22, th = h * (0.45 + ((i * 37) % 10) / 20), lean = ((i * 53) % 9 - 4) * 3; g.beginPath(); g.moveTo(x - bw, h); g.quadraticCurveTo(x - bw * 0.3, h - th * 0.6, x + lean, h - th); g.quadraticCurveTo(x + bw * 0.3, h - th * 0.6, x + bw, h); g.fill(); }
}
export function drawGlow(g, w, h, inner = 'rgba(255,230,160,1)', mid = 'rgba(255,170,60,0.45)') {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(0.35, mid); gr.addColorStop(1, 'rgba(255,150,40,0)');
  g.clearRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}
export function drawRays(g, w, h) {
  g.clearRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,240,200,0)'); gr.addColorStop(0.5, 'rgba(255,240,200,0.85)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.7, 'rgba(0,0,0,0.6)'); v.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
}

// ---------- engraved symbols (lotus, sun, wave, mountain) ----------
export function drawSymbol(g, k, cx, cy, R, col = '#e2bd68', lw = 5) {
  g.save(); g.translate(cx, cy); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  if (k === 0) { // lotus
    for (let i = -2; i <= 2; i++) { g.save(); g.rotate(i * 0.42); g.beginPath(); g.moveTo(0, R * 0.45); g.quadraticCurveTo(R * 0.42, -R * 0.1, 0, -R * 0.85); g.quadraticCurveTo(-R * 0.42, -R * 0.1, 0, R * 0.45); g.stroke(); g.restore(); }
    g.beginPath(); g.arc(0, R * 0.55, R * 0.28, 0, Math.PI, false); g.stroke();
  } else if (k === 1) { // sun
    g.beginPath(); g.arc(0, 0, R * 0.34, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, R * 0.16, 0, 7); g.fill();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, l = i % 2 ? 0.74 : 0.9; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.46, Math.sin(a) * R * 0.46); g.lineTo(Math.cos(a) * R * l, Math.sin(a) * R * l); g.stroke(); }
  } else if (k === 2) { // waves
    for (let j = -1; j <= 1; j++) { g.beginPath(); for (let x = -R * 0.8; x <= R * 0.8; x += 4) { const y = j * R * 0.42 + Math.sin(x / R * 5.2) * R * 0.14; x === -R * 0.8 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
  } else { // mountain
    g.beginPath(); g.moveTo(-R * 0.85, R * 0.55); g.lineTo(-R * 0.25, -R * 0.45); g.lineTo(R * 0.05, R * 0.05); g.lineTo(R * 0.32, -R * 0.25); g.lineTo(R * 0.85, R * 0.55); g.closePath(); g.stroke();
    g.beginPath(); g.arc(R * 0.5, -R * 0.62, R * 0.14, 0, 7); g.stroke();
  }
  g.restore();
}
export function drawMedallion(g, w, h, k, lit = false) {
  g.fillStyle = '#7d6b53'; g.fillRect(0, 0, w, h);
  const r = rng(40 + k); speckle(g, w, h, 500, ['#5a4a35', '#9d8a6b'], 0.1, 0.3, 1, 3, r);
  g.fillStyle = lit ? '#4e3b25' : '#3f2f1f'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.43, 0, 7); g.fill();
  g.strokeStyle = '#b8893a'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h / 2, w * 0.43, 0, 7); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.arc(w / 2, h / 2, w * 0.37, 0, 7); g.stroke();
  drawSymbol(g, k, w / 2, h / 2, w * 0.3, '#e7c36a', 7);
}
export function drawMosaic(g, w, h, map) { // map: {N,E,S,W} -> symbol id
  g.fillStyle = '#5b4a36'; g.fillRect(0, 0, w, h);
  const c = w / 2, r = rng(77);
  for (let i = 0; i < 3000; i++) { g.fillStyle = ['#8a7556', '#6f5d44', '#a08a68'][(r() * 3) | 0]; g.globalAlpha = 0.5; const a = r() * 6.28, d = Math.sqrt(r()) * c; g.fillRect(c + Math.cos(a) * d, c + Math.sin(a) * d, 3, 3); }
  g.globalAlpha = 1;
  const ring = (rad, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(c, c, rad, 0, 7); g.stroke(); };
  ring(c * 0.96, '#d9b25c', 7); ring(c * 0.9, '#2d221a', 3); ring(c * 0.52, '#d9b25c', 4); ring(c * 0.2, '#d9b25c', 4);
  for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283; g.fillStyle = i % 2 ? '#c9702a' : '#2f5d34'; g.beginPath(); g.arc(c + Math.cos(a) * c * 0.93, c + Math.sin(a) * c * 0.93, 4, 0, 7); g.fill(); }
  for (let i = 0; i < 8; i++) { g.save(); g.translate(c, c); g.rotate(i * Math.PI / 4); g.strokeStyle = '#d9b25c'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -c * 0.2); g.quadraticCurveTo(c * 0.07, -c * 0.12, 0, -c * 0.02); g.quadraticCurveTo(-c * 0.07, -c * 0.12, 0, -c * 0.2); g.stroke(); g.restore(); }
  const place = (key, dx, dy) => { const x = c + dx * c * 0.72, y = c + dy * c * 0.72; g.fillStyle = '#2d221a'; g.beginPath(); g.arc(x, y, c * 0.2, 0, 7); g.fill(); g.strokeStyle = '#d9b25c'; g.lineWidth = 5; g.beginPath(); g.arc(x, y, c * 0.2, 0, 7); g.stroke(); drawSymbol(g, map[key], x, y, c * 0.15, '#f0cd7a', 5); };
  place('N', 0, -1); place('E', 1, 0); place('S', 0, 1); place('W', -1, 0);
}
export function drawDots(g, w, h, n) {
  g.fillStyle = '#6a5a44'; g.fillRect(0, 0, w, h);
  const r = rng(90 + n); speckle(g, w, h, 600, ['#4a3b29', '#8f7b5a'], 0.1, 0.3, 1, 3, r);
  g.strokeStyle = '#b8893a'; g.lineWidth = 7; g.strokeRect(14, 14, w - 28, h - 28);
  g.fillStyle = '#e7c36a'; const cs = n === 1 ? [[0.5, 0.5]] : n === 2 ? [[0.33, 0.5], [0.67, 0.5]] : [[0.5, 0.3], [0.3, 0.68], [0.7, 0.68]];
  for (const [x, y] of cs) { g.beginPath(); g.arc(x * w, y * h, w * 0.085, 0, 7); g.fill(); g.strokeStyle = '#2d221a'; g.lineWidth = 3; g.stroke(); }
}
export function drawTarget(g, w, h) {
  const c = w / 2;
  const rings = [['#e8d7a8', 1], ['#a3282a', 0.82], ['#e8d7a8', 0.64], ['#2f5d34', 0.46], ['#e8d7a8', 0.3], ['#b8893a', 0.16]];
  g.fillStyle = '#c9a24a'; g.fillRect(0, 0, w, h);
  const r = rng(5); for (let i = 0; i < 1500; i++) { g.strokeStyle = ['#e3c36c', '#b88c36', '#9a7326'][(r() * 3) | 0]; g.globalAlpha = 0.5; g.lineWidth = 1; g.beginPath(); const x = r() * w, y = r() * h, a = r() * 6.28; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.stroke(); }
  g.globalAlpha = 1;
  for (const [col, f] of rings) { g.fillStyle = col; g.globalAlpha = 0.93; g.beginPath(); g.arc(c, c, c * f * 0.97, 0, 7); g.fill(); }
  g.globalAlpha = 1; g.strokeStyle = 'rgba(40,24,6,0.7)'; g.lineWidth = 3; for (const [, f] of rings) { g.beginPath(); g.arc(c, c, c * f * 0.97, 0, 7); g.stroke(); }
  speckle(g, w, h, 900, ['#5c4318', '#f3e2a8'], 0.05, 0.25, 1, 3, r);
}
export function drawParchment(g, w, h) {
  g.fillStyle = '#e8d9b5'; g.fillRect(0, 0, w, h); const r = rng(12); speckle(g, w, h, 1200, ['#d3be92', '#f4ead0', '#b99f6e'], 0.05, 0.25, 1, 4, r);
}

export function buildTextures(THREE) {
  const T = {};
  T.stone = makeTex(THREE, 512, (g, w, h) => drawStone(g, w, h, 1), { repeat: [1, 1] });
  T.stoneDark = makeTex(THREE, 512, (g, w, h) => drawStone(g, w, h, 2, true));
  T.wood = makeTex(THREE, 256, drawWood);
  T.bark = makeTex(THREE, 256, drawBark);
  T.grass = makeTex(THREE, 512, drawGrass);
  T.dirt = makeTex(THREE, 512, drawDirt);
  T.straw = makeTex(THREE, 256, drawStraw);
  T.thatch = makeTex(THREE, 256, drawThatch);
  T.plaster = makeTex(THREE, 256, drawPlaster);
  T.leaf = makeTex(THREE, 128, (g, w, h) => drawLeafCard(g, w, h), { clamp: true });
  T.glow = makeTex(THREE, 128, (g, w, h) => drawGlow(g, w, h), { clamp: true });
  T.glowBlue = makeTex(THREE, 128, (g, w, h) => drawGlow(g, w, h, 'rgba(255,255,255,1)', 'rgba(200,225,255,0.4)'), { clamp: true });
  T.rays = makeTex(THREE, 128, (g, w, h) => drawRays(g, w, h), { clamp: true });
  T.target = makeTex(THREE, 512, drawTarget, { clamp: true });
  T.parchment = makeTex(THREE, 256, drawParchment);
  T.medal = [0, 1, 2, 3].map((k) => makeTex(THREE, 256, (g, w, h) => drawMedallion(g, w, h, k), { clamp: true }));
  T.dots = [1, 2, 3].map((n) => makeTex(THREE, 256, (g, w, h) => drawDots(g, w, h, n), { clamp: true }));
  T.stone.repeat.set(1, 1); [T.stone, T.stoneDark].forEach((t) => t.anisotropy = 8);
  return T;
}
