// Shared scene scaffolding: lights, sky, fog, ground, hermitage dressing.
import { buildTextures, rng } from './tex.js';
import { mats, makeHut, makeTulsi, makeHavan, makeTree, makeBrazier, bevelBox } from './props.js';
import { makeSky, makeForest, makeGrass, makeGround, Motes, Bursts, makeShafts, makeMist } from './fx.js';
import { makeBrother, makeValmiki, poseBrother, poseValmiki } from './chars.js';

export function assets(engine) {
  if (!engine.assets) { const THREE = engine.THREE, T = buildTextures(THREE); engine.assets = { T, M: mats(THREE, T) }; }
  return engine.assets;
}

export const TONES = {
  morning: { sky: { top: '#5b93c4', mid: '#b9d5e4', hor: '#f7e4bd' }, fog: '#eadbb8', fogD: 0.011, sun: '#ffe0aa', sunI: 3.0, hemiS: '#cfe6ff', hemiG: '#8a7a50', hemiI: 0.85, exp: 1.05 },
  noon: { sky: { top: '#4f8dc7', mid: '#b4d3e6', hor: '#eef0e2' }, fog: '#dfe6d8', fogD: 0.009, sun: '#fff0cf', sunI: 3.2, hemiS: '#d6ebff', hemiG: '#7f8f55', hemiI: 0.9, exp: 1.0 },
  golden: { sky: { top: '#6a7fb4', mid: '#e7b88e', hor: '#f9d49a' }, fog: '#e9c796', fogD: 0.012, sun: '#ffc27a', sunI: 3.1, hemiS: '#ffd9b0', hemiG: '#7a6040', hemiI: 0.8, exp: 1.08 },
  gorge: { sky: { top: '#56819f', mid: '#a9c7d2', hor: '#e6dfc3' }, fog: '#cfd8cc', fogD: 0.014, sun: '#ffe7b8', sunI: 3.0, hemiS: '#cfe6ff', hemiG: '#6e7b55', hemiI: 0.85, exp: 1.04 },
};

export class Base {
  constructor(engine, tone = 'morning', opt = {}) {
    const THREE = this.THREE = engine.THREE; this.engine = engine;
    const { T, M } = assets(engine); this.T = T; this.M = M;
    const tn = this.tone = TONES[tone];
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(tn.fog, tn.fogD);
    this.sky = makeSky(THREE, tn.sky); this.scene.add(this.sky);
    this.hemi = new THREE.HemisphereLight(tn.hemiS, tn.hemiG, tn.hemiI); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(tn.sun, tn.sunI);
    this.sunOff = new THREE.Vector3(-34, 46, -22); this.sun.castShadow = true; const sm = Math.min(opt.shadow || 2048, engine.maxShadow || 2048); this.sun.shadow.mapSize.set(sm, sm);
    const S = opt.shadowSize || 30, sc = this.sun.shadow.camera; sc.left = -S; sc.right = S; sc.top = S; sc.bottom = -S; sc.near = 5; sc.far = 140; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.00035; this.sun.shadow.normalBias = 0.05;
    this.scene.add(this.sun); this.scene.add(this.sun.target);
    const fill = new THREE.DirectionalLight('#aac8ff', 0.35); fill.position.set(30, 20, 30); this.scene.add(fill);
    this.bursts = new Bursts(THREE, T); this.scene.add(this.bursts.mesh);
    this.t = 0; this.focus = new THREE.Vector3(); this.extras = [];
    engine.renderer.toneMappingExposure = tn.exp;
    this.floats = [];
  }
  addTick(fn) { this.extras.push(fn); }
  baseUpdate(dt, focus) {
    this.t += dt; const f = focus || this.focus;
    this.sun.position.set(f.x + this.sunOff.x, f.y + this.sunOff.y, f.z + this.sunOff.z); this.sun.target.position.set(f.x, f.y, f.z); this.sun.target.updateMatrixWorld();
    this.sky.position.copy(this.engine.camera.position); this.sky.userData.u.time.value = this.t;
    this.bursts.update(dt);
    for (const fn of this.extras) fn(this.t, dt);
  }
  /** Ring of forest around the play area, skipping rectangles [x0,z0,x1,z1]. */
  forest(keepouts, bounds, n, seed = 21, minGap = 5) {
    const r = rng(seed), pts = [];
    let guard = 0;
    while (pts.length < n && guard++ < n * 60) {
      const x = bounds[0] + r() * (bounds[2] - bounds[0]), z = bounds[1] + r() * (bounds[3] - bounds[1]);
      if (keepouts.some((k) => x > k[0] && x < k[2] && z > k[1] && z < k[3])) continue;
      if (pts.some((p) => Math.hypot(p[0] - x, p[1] - z) < minGap)) continue;
      pts.push([x, z, 0.85 + r() * 0.85, 0]);
    }
    const f = makeForest(this.THREE, this.M, pts, seed); this.scene.add(f); return f;
  }
  motes(box, n = 120, o = {}) { const m = new Motes(this.THREE, this.T, n, box, o); this.scene.add(m.mesh); this.addTick((t) => m.update(t)); return m; }
  shafts(n, area) { const s = makeShafts(this.THREE, this.T, n, area); this.scene.add(s); this.addTick((t) => s.userData.tick(t)); return s; }
  ground(size = 460, flatR = { r: 40 }, y = 0) { const g = makeGround(this.THREE, this.M, size, flatR); g.position.y = y; this.scene.add(g); return g; }
  /** huts, tulsi, havan, bunting — traditional hermitage dressing. */
  hermitage(spots) {
    const THREE = this.THREE, M = this.M, T = this.T;
    spots.huts && spots.huts.forEach(([x, z, ry = 0, s = 1], i) => { const h = makeHut(THREE, M, T, i + 1); h.position.set(x, 0, z); h.rotation.y = ry; h.scale.setScalar(s); this.scene.add(h); });
    spots.tulsi && spots.tulsi.forEach(([x, z]) => { const t = makeTulsi(THREE, M); t.position.set(x, 0, z); this.scene.add(t); });
    spots.havan && spots.havan.forEach(([x, z]) => { const h = makeHavan(THREE, M, T); h.position.set(x, 0, z); this.scene.add(h); this.addTick((t) => { const u = h.userData; const f = 1 + Math.sin(t * 15) * 0.08 + Math.sin(t * 27) * 0.05; u.flame.scale.set(1, f, 1); u.glow.material.opacity = 0.75 + Math.sin(t * 21) * 0.1; }); });
    spots.braziers && spots.braziers.forEach(([x, z, y = 0]) => { const b = makeBrazier(THREE, M, T, true); b.position.set(x, y, z); this.scene.add(b); this.addTick((t) => { const u = b.userData, f = 1 + Math.sin(t * 17 + x) * 0.1 + Math.sin(t * 29) * 0.06; u.flame.scale.set(0.9 + f * 0.1, f, 0.9 + f * 0.1); u.glow.material.opacity = 0.8 + Math.sin(t * 23 + x) * 0.12; }); });
  }
  /** Garland of mango leaves and marigolds strung between two points. */
  bunting(a, b, sag = 0.9, n = 22) {
    const THREE = this.THREE, M = this.M, g = new THREE.Group();
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = a.x + (b.x - a.x) * u, z = a.z + (b.z - a.z) * u, y = a.y + (b.y - a.y) * u - Math.sin(u * Math.PI) * sag;
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 5), i % 3 === 0 ? M.marigold2 : i % 3 === 1 ? M.marigold : M.leafB); m.position.set(x, y, z); m.scale.y = 1.2; g.add(m);
    }
    this.scene.add(g); return g;
  }
  pathStones(path, w, y = 0.02) { // dirt path strip between points
    const THREE = this.THREE, g = new THREE.Group();
    for (let i = 0; i < path.length - 1; i++) {
      const [x0, z0] = path[i], [x1, z1] = path[i + 1], len = Math.hypot(x1 - x0, z1 - z0);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), this.M.dirt.clone()); m.material.map = this.M.dirt.map.clone(); m.material.map.repeat.set(w / 4, len / 4); m.material.map.needsUpdate = true;
      m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(x1 - x0, z1 - z0) * -1 + Math.PI; m.rotation.order = 'YXZ'; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; g.add(m);
    }
    this.scene.add(g); return g;
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    // everything created once per engine (shared materials + textures) must survive; everything else this scene made is freed
    const shared = new Set(), A = this.engine.assets, addT = (t) => { if (Array.isArray(t)) t.forEach(addT); else if (t) shared.add(t); };
    if (A) { Object.values(A.M || {}).forEach((m) => m && shared.add(m)); Object.values(A.T || {}).forEach(addT); }
    const texKeys = ['map', 'bumpMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap'], seen = new Set();
    this.scene.traverse((o) => {
      if (o.geometry && o.geometry.dispose) o.geometry.dispose();
      if (o.isInstancedMesh && o.dispose) { try { o.dispose(); } catch (e) { /* noop */ } }
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) {
        if (!m || shared.has(m) || seen.has(m)) continue; seen.add(m);
        for (const k of texKeys) { const t = m[k]; if (t && !shared.has(t) && t.dispose) t.dispose(); }
        if (m.dispose) m.dispose();
      }
    });
    try { if (this.sun && this.sun.shadow && this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; } } catch (e) { /* noop */ }
    if (this.sky && this.sky.material) { try { this.sky.material.dispose(); } catch (e) { /* noop */ } }
    this.extras.length = 0;
  }
}

/** Character wrappers shared across scenes. */
export function spawnBrothers(base, parent) {
  const THREE = base.THREE;
  const luv = makeBrother(THREE, 'luv', base.T), kush = makeBrother(THREE, 'kush', base.T);
  parent.add(luv); parent.add(kush);
  return { luv, kush };
}
export { makeBrother, makeValmiki, poseBrother, poseValmiki, bevelBox };