// Procedural Gurukul props: trees, huts, braziers, carved pillars, gates, targets, bridges.
import { rng, PAL } from './tex.js';

export function mats(THREE, T) {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  return {
    stone: std({ map: T.stone, bumpMap: T.stone, bumpScale: 1.2, roughness: 0.93, color: '#f3ead6' }),
    stoneDark: std({ map: T.stoneDark, bumpMap: T.stoneDark, bumpScale: 1.4, roughness: 0.95 }),
    wood: std({ map: T.wood, bumpMap: T.wood, bumpScale: 0.8, roughness: 0.78 }),
    bark: std({ map: T.bark, bumpMap: T.bark, bumpScale: 2, roughness: 1 }),
    grass: std({ map: T.grass, roughness: 1 }),
    dirt: std({ map: T.dirt, bumpMap: T.dirt, bumpScale: 0.8, roughness: 1 }),
    plaster: std({ map: T.plaster, roughness: 0.98 }),
    thatch: std({ map: T.thatch, bumpMap: T.thatch, bumpScale: 1.5, roughness: 1, side: THREE.DoubleSide }),
    gold: std({ color: '#cfa244', metalness: 0.8, roughness: 0.32 }),
    brass: std({ color: '#a8782a', metalness: 0.7, roughness: 0.4 }),
    leafA: std({ color: '#3f7a3a', roughness: 0.9, flatShading: true }),
    leafB: std({ color: '#5a9040', roughness: 0.9, flatShading: true }),
    leafC: std({ color: '#2d5f33', roughness: 0.95, flatShading: true }),
    flame: new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.92, depthWrite: false }),
    flameCore: new THREE.MeshBasicMaterial({ color: '#fff0b0', transparent: true, opacity: 0.95, depthWrite: false }),
    cloth: std({ color: '#b3382a', roughness: 0.9, side: THREE.DoubleSide }),
    clothG: std({ color: '#2f5d34', roughness: 0.9, side: THREE.DoubleSide }),
    marigold: std({ color: '#f09a1c', roughness: 0.8, emissive: '#5a2f00', emissiveIntensity: 0.2 }),
    marigold2: std({ color: '#f5c542', roughness: 0.8, emissive: '#5a4200', emissiveIntensity: 0.2 }),
    glowGold: new THREE.MeshBasicMaterial({ color: '#ffd774', transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending }),
  };
}

export function bevelBox(THREE, w, h, d, b = 0.07) {
  const s = new THREE.Shape(); const x = (w - 2 * b) / 2, y = (h - 2 * b) / 2;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.01, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 1 });
  g.translate(0, 0, -(d - 2 * b) / 2); g.computeVertexNormals();
  // box-project UVs so textures scale uniformly
  const p = g.attributes.position, uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (nz >= nx && nz >= ny) uv.setXY(i, p.getX(i) / 2, p.getY(i) / 2);
    else if (nx >= ny) uv.setXY(i, p.getZ(i) / 2, p.getY(i) / 2); else uv.setXY(i, p.getX(i) / 2, p.getZ(i) / 2);
  }
  uv.needsUpdate = true; return g;
}
const sh = (o, c = true, r = true) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = c; m.receiveShadow = r; } }); return o; };

export function makeTree(THREE, M, seed, scale = 1) {
  const r = rng(seed), g = new THREE.Group();
  const h = (5.5 + r() * 3.5) * scale, tr = (0.38 + r() * 0.18) * scale;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(tr * 0.62, tr * 1.25, h, 10, 4), M.bark);
  const tp = trunk.geometry.attributes.position;
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i) / h + 0.5; tp.setX(i, tp.getX(i) + Math.sin(y * 3 + seed) * 0.22 * scale * y); }
  trunk.geometry.computeVertexNormals(); trunk.position.y = h / 2; g.add(trunk);
  for (let i = 0; i < 5; i++) { // roots
    const a = i / 5 * 6.28 + r(), rt = new THREE.Mesh(new THREE.ConeGeometry(tr * 0.35, tr * 2.6, 6), M.bark);
    rt.position.set(Math.cos(a) * tr * 1.1, tr * 0.5, Math.sin(a) * tr * 1.1); rt.rotation.set(Math.sin(a) * 1.15, 0, -Math.cos(a) * 1.15); g.add(rt);
  }
  const mm = [M.leafA, M.leafB, M.leafC];
  const n = 9 + ((r() * 5) | 0);
  for (let i = 0; i < n; i++) {
    const rad = (1.5 + r() * 1.7) * scale;
    const geo = new THREE.IcosahedronGeometry(rad, 1); const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { const f = 0.82 + r() * 0.36; p.setXYZ(k, p.getX(k) * f, p.getY(k) * f * 0.8, p.getZ(k) * f); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mm[(r() * 3) | 0]);
    const a = r() * 6.28, d = r() * 2.7 * scale;
    m.position.set(Math.cos(a) * d, h * 0.82 + (r() - 0.3) * 2.2 * scale, Math.sin(a) * d); g.add(m);
  }
  return sh(g);
}

export function makeHut(THREE, M, T, seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.75, 2.5, 20), M.plaster); wall.position.y = 1.25; g.add(wall);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 3.05, 0.5, 20), M.stoneDark); plinth.position.y = 0.25; g.add(plinth);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 3.3, 20, 1, true), M.thatch); roof.position.y = 4.1; g.add(roof);
  const rtip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 8), M.brass); rtip.position.y = 6; g.add(rtip);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.2), new THREE.MeshStandardMaterial({ color: '#1e130b', roughness: 1 })); door.position.set(0, 1.0, 2.68); g.add(door);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.3), M.wood); lintel.position.set(0, 1.95, 2.72); g.add(lintel);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 8), M.wood); p.position.set(sx * 0.7, 1.1, 2.75); g.add(p); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + 0.5; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 3.0, 6), M.wood); pole.position.set(Math.cos(a) * 3.55, 1.5, Math.sin(a) * 3.55); if (Math.sin(a) > 0.6) pole.visible = false; g.add(pole); }
  return sh(g);
}

export function makeBrazier(THREE, M, T, lit = true) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.2, 10), M.stoneDark); stem.position.y = 0.6; g.add(stem);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.22, 0.34, 14), M.brass); bowl.position.y = 1.3; g.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.045, 6, 18), M.gold); rim.rotation.x = Math.PI / 2; rim.position.y = 1.47; g.add(rim);
  const flame = new THREE.Group(); flame.position.y = 1.5; g.add(flame);
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 10, 1, true), M.flame); f1.position.y = 0.4; flame.add(f1);
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.6, 8, 1, true), M.flameCore); f2.position.y = 0.28; flame.add(f2);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: '#ffb050', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
  glow.scale.set(3.4, 3.4, 1); glow.position.y = 0.5; flame.add(glow);
  g.userData = { flame, glow, f1, f2, lit: 0, setLit(v) { this.lit = v; } };
  flame.visible = lit; sh(g, true, true); glow.castShadow = false;
  return g;
}
export function tickBrazier(b, t, lit) {
  const u = b.userData; u.lit += ((lit ? 1 : 0) - u.lit) * 0.12; const k = u.lit;
  u.flame.visible = k > 0.02;
  const fl = 1 + Math.sin(t * 17 + b.id) * 0.1 + Math.sin(t * 29) * 0.06;
  u.flame.scale.set(k * (0.9 + fl * 0.1), k * fl, k * (0.9 + fl * 0.1)); u.glow.material.opacity = 0.9 * k * (0.85 + 0.15 * Math.sin(t * 23 + b.id));
}

export function makeToranam(THREE, M, T, width = 6.4, height = 5.6) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 1.1), M.stone); base.position.set(sx * width / 2, 0.3, 0); g.add(base);
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.8, height, 0.8), M.stone); col.position.set(sx * width / 2, height / 2 + 0.3, 0); g.add(col);
    for (let i = 0; i < 5; i++) { const band = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.1, 0.88), M.gold); band.position.set(sx * width / 2, 0.9 + i * 0.95, 0); g.add(band); }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.1), M.stoneDark); cap.position.set(sx * width / 2, height + 0.55, 0); g.add(cap);
    const lot = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), M.gold); lot.scale.y = 0.7; lot.position.set(sx * width / 2, height + 1.0, 0); g.add(lot);
  }
  const lint = new THREE.Mesh(new THREE.BoxGeometry(width + 1.4, 0.8, 1.0), M.stone); lint.position.y = height + 0.4; g.add(lint);
  const lint2 = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.55, 0.85), M.stoneDark); lint2.position.y = height + 1.07; g.add(lint2);
  for (let i = 0; i < 9; i++) { const x = -width / 2 + (i + 0.5) * (width / 9); const tri = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 4), M.gold); tri.position.set(x, height + 1.6, 0); g.add(tri); }
  // marigold garland (catenary of small spheres)
  const n = 26;
  for (let i = 0; i <= n; i++) { const u = i / n, x = (u - 0.5) * width, y = height - 0.2 - Math.sin(u * Math.PI) * 0.7; const m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), i % 3 ? M.marigold : M.marigold2); m.position.set(x, y, 0.55); g.add(m); }
  return sh(g);
}

/** Carved pillar for the pillar puzzle. Face k carries symbol (base-k) mod 4. group yaw handled by caller. */
export function makePillar(THREE, M, T, base) {
  const g = new THREE.Group();
  const plinth = new THREE.Mesh(bevelBox(THREE, 2.1, 0.5, 2.1, 0.08), M.stone); plinth.position.y = 0.25; g.add(plinth);
  const rot = new THREE.Group(); g.add(rot); g.userData.rot = rot;
  const shaft = new THREE.Mesh(bevelBox(THREE, 1.4, 3.4, 1.4, 0.07), M.stone); shaft.position.y = 2.2; rot.add(shaft);
  for (let k = 0; k < 4; k++) {
    const sym = (((base - k) % 4) + 4) % 4;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.08), new THREE.MeshStandardMaterial({ map: T.medal[sym], roughness: 0.8, emissive: '#000', emissiveMap: T.medal[sym] }));
    const a = k * Math.PI / 2; face.position.set(Math.sin(a) * 0.72, 2.45, Math.cos(a) * 0.72); face.rotation.y = a; rot.add(face);
    const col = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.5), M.gold); col.position.y = 1.0; rot.add(col);
  }
  const col2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.5), M.gold); col2.position.y = 3.9; rot.add(col2);
  const cap = new THREE.Mesh(bevelBox(THREE, 1.8, 0.4, 1.8, 0.06), M.stoneDark); cap.position.y = 4.2; rot.add(cap);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const pet = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 5), M.gold); pet.position.set(Math.cos(a) * 0.42, 4.6, Math.sin(a) * 0.42); pet.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45); rot.add(pet); }
  const gem = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshStandardMaterial({ color: '#7a4a1a', emissive: '#ff9a2a', emissiveIntensity: 0.0, roughness: 0.2, metalness: 0.2 })); gem.position.y = 4.95; rot.add(gem);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: '#ffc060', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); glow.scale.set(3.2, 3.2, 1); glow.position.y = 4.95; rot.add(glow);
  g.userData.gem = gem; g.userData.glow = glow;
  return sh(g);
}

export function makeBlock(THREE, M, T) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(bevelBox(THREE, 1.86, 1.5, 1.86, 0.09), M.stone); b.position.y = 0.75; g.add(b);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshStandardMaterial({ map: T.medal[1], roughness: 0.85 })); top.rotation.x = -Math.PI / 2; top.position.y = 1.505; g.add(top);
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.52, 0.2), M.gold); c.position.set(x * 0.9, 0.75, z * 0.9); c.scale.set(0.5, 1, 0.5); g.add(c); }
  return sh(g);
}
export function makePlate(THREE, M, T, n = 0) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.16, 20), M.gold); ring.position.y = 0.08; g.add(ring);
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.92, 0.18, 20), new THREE.MeshStandardMaterial({ map: n ? T.dots[n - 1] : T.stoneDark, roughness: 0.85, emissive: '#ff9a2a', emissiveIntensity: 0 }));
  slab.position.y = 0.12; g.add(slab);
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.86, 24), new THREE.MeshStandardMaterial({ map: n ? T.dots[n - 1] : T.medal[0], roughness: 0.85, emissive: '#ff9a2a', emissiveIntensity: 0, emissiveMap: n ? T.dots[n - 1] : T.medal[0] }));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.215; g.add(top);
  g.userData = { slab, top, press: 0 }; return sh(g, false, true);
}

export function makeStoneGate(THREE, M, T, widthCells = 3) {
  const g = new THREE.Group(); const w = widthCells * 2;
  const slab = new THREE.Group(); g.add(slab);
  const s = new THREE.Mesh(bevelBox(THREE, w - 0.15, 4.6, 0.9, 0.08), M.stone); s.position.y = 2.3; slab.add(s);
  const m = new THREE.Mesh(new THREE.CircleGeometry(1.15, 28), new THREE.MeshStandardMaterial({ map: T.medal[0], roughness: 0.8 })); m.position.set(0, 2.4, 0.47); slab.add(m);
  const m2 = m.clone(); m2.rotation.y = Math.PI; m2.position.z = -0.47; slab.add(m2);
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.1, 0.96), M.gold); b.position.y = 0.55 + i * 0.95; slab.add(b); }
  g.userData.slab = slab; g.userData.h = 4.7; return sh(g);
}
export function makePortcullis(THREE, M, widthCells = 3) {
  const g = new THREE.Group(); const w = widthCells * 2, slab = new THREE.Group(); g.add(slab);
  const n = widthCells * 4;
  for (let i = 0; i <= n; i++) { const x = -w / 2 + 0.2 + i * ((w - 0.4) / n); const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.8, 8), M.wood); bar.position.set(x, 2.4, 0); slab.add(bar); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), M.brass); tip.rotation.x = Math.PI; tip.position.set(x, -0.1, 0); slab.add(tip); }
  for (const y of [1.0, 2.4, 3.8]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, 0.26), M.brass); b.position.y = y; slab.add(b); }
  g.userData.slab = slab; g.userData.h = 5; return sh(g);
}

export function makeTarget(THREE, M, T, r = 1.15, onStand = true) {
  const g = new THREE.Group();
  const disc = new THREE.Group(); g.add(disc); g.userData.disc = disc;
  const face = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 40), [new THREE.MeshStandardMaterial({ map: T.straw, roughness: 1 }), new THREE.MeshStandardMaterial({ map: T.target, roughness: 1 }), new THREE.MeshStandardMaterial({ map: T.straw, roughness: 1 })]);
  face.rotation.x = Math.PI / 2; disc.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.07, 8, 40), M.wood); rim.position.z = 0.1; disc.add(rim);
  const back = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.07, 8, 40), M.wood); back.position.z = -0.1; disc.add(back);
  const halo = new THREE.Mesh(new THREE.RingGeometry(r * 1.08, r * 1.4, 48), new THREE.MeshBasicMaterial({ color: '#ffd774', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.z = 0.2; disc.add(halo); g.userData.halo = halo;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: '#ffd070', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); spr.scale.set(r * 5, r * 5, 1); spr.position.z = 0.3; disc.add(spr); g.userData.spr = spr;
  if (onStand) {
    const h = 3.4;
    for (const [x, rz] of [[-0.55, 0.22], [0.55, -0.22], [0, 0]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, h, 6), M.wood); leg.position.set(x, -h / 2 + 0.1, -0.5 + (x === 0 ? -0.35 : 0)); leg.rotation.z = rz * 0.2; leg.rotation.x = x === 0 ? -0.25 : 0.12; g.add(leg); }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 6), M.wood); pole.position.set(0, -0.55, -0.15); g.add(pole);
  }
  return sh(g);
}
export function makeLamp(THREE, T) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: '#ffbb66', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 })); return s;
}
export function makeTulsi(THREE, M) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.5), M.plaster); base.position.y = 0.45; g.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 1.7), M.stone); top.position.y = 0.95; g.add(top);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.5, 10), M.dirt); pot.position.y = 1.2; g.add(pot);
  for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), i % 2 ? M.leafB : M.leafA); const a = i * 2.4; l.position.set(Math.cos(a) * 0.22, 1.5 + i * 0.07, Math.sin(a) * 0.22); l.scale.set(1, 0.7, 1); g.add(l); }
  return sh(g);
}
export function makeHavan(THREE, M, T) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.6 - i * 0.55, 0.22, 2.6 - i * 0.55), M.stone); s.position.y = 0.11 + i * 0.22; g.add(s); }
  const pit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.0), new THREE.MeshStandardMaterial({ color: '#1a0f08' })); pit.position.y = 0.7; g.add(pit);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 5), M.wood); l.position.set(Math.cos(i * 1.1) * 0.2, 0.9, Math.sin(i * 1.1) * 0.2); l.rotation.set(Math.sin(i * 1.1) * 0.6, 0, -Math.cos(i * 1.1) * 0.6); g.add(l); }
  const br = makeBrazier(THREE, M, T, true); br.visible = false; // reuse flame only
  const flame = new THREE.Group(); flame.position.y = 0.8;
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.4, 10, 1, true), M.flame); f1.position.y = 0.6; flame.add(f1);
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 8, 1, true), M.flameCore); f2.position.y = 0.4; flame.add(f2);
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: '#ffa040', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 })); gl.scale.set(5, 5, 1); gl.position.y = 0.8; flame.add(gl);
  g.add(flame); g.userData = { flame, glow: gl };
  return sh(g);
}
export function tickHavan(h, t) { const u = h.userData, f = 1 + Math.sin(t * 15) * 0.08 + Math.sin(t * 27) * 0.05; u.flame.scale.set(1, f, 1); u.glow.material.opacity = 0.75 + Math.sin(t * 21) * 0.1; }
