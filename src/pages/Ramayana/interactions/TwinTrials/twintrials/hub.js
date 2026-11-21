// The Gurukul training ground: opening cinematic and the closing tableau with Valmiki.
import { Base, spawnBrothers, makeValmiki, poseBrother, poseValmiki } from './base.js';
import { makeToranam, makeTree, makeBrazier } from './props.js';
import { makeWater } from './fx.js';
import { clamp, smooth, lerp } from './core.js';

export const buildGurukulGround = (b, o = {}) => {
  const THREE = b.THREE, M = b.M, T = b.T, sc = b.scene;
  b.ground(500, { r: 38 });
  // paved circular training ground with a gold inlay ring
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(15, 15.4, 0.3, 64), M.stone.clone()); disc.material.map = T.stone.clone(); disc.material.map.repeat.set(9, 9); disc.material.map.needsUpdate = true;
  disc.material.bumpMap = disc.material.map; disc.position.y = 0.12; disc.receiveShadow = true; disc.castShadow = true; sc.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(13.2, 0.1, 6, 96), M.gold); ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; sc.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(8.6, 0.06, 6, 80), M.gold); ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.3; sc.add(ring2);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const d = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 10), M.gold); d.position.set(Math.cos(a) * 10.9, 0.28, Math.sin(a) * 10.9); sc.add(d); }
  // dirt apron
  const apron = new THREE.Mesh(new THREE.CircleGeometry(22, 48), M.dirt.clone()); apron.material.map = T.dirt.clone(); apron.material.map.repeat.set(7, 7); apron.material.map.needsUpdate = true;
  apron.rotation.x = -Math.PI / 2; apron.position.y = 0.02; apron.receiveShadow = true; sc.add(apron);
  b.hermitage({
    huts: [[-17, -11, 0.5, 1], [17, -12, -0.5, 1.05], [-6, -23, 0.1, 1.15], [8, -25, -0.2, 0.95], [-27, 3, 1.2, 0.95]],
    tulsi: [[-9, -6], [12, 6]], havan: [[10, -5]], braziers: [[-6.5, 8], [6.5, 8]],
  });
  // stream running past the training ground
  const w = makeWater(THREE, 12, 120, { alpha: 0.88 }); w.position.set(-33, 0.08, -10); w.rotation.z = 0; sc.add(w); b.addTick((t) => { w.userData.u.time.value = t; });
  const bank = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 120), M.stoneDark); bank.position.set(-26.6, 0.1, -10); sc.add(bank);
  // arched entrance with garlands
  const tor = makeToranam(THREE, M, T, 8, 6); tor.position.set(0, 0, 21); sc.add(tor);
  b.bunting({ x: -17, y: 3.6, z: 8 }, { x: -6.5, y: 3.6, z: 8 }, 0.7); b.bunting({ x: 6.5, y: 3.6, z: 8 }, { x: 17, y: 3.6, z: 8 }, 0.7);
  for (const x of [-17, 17]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4, 8), M.wood); p.position.set(x, 2, 8); p.castShadow = true; sc.add(p); }
  // practise targets and weapon rack hint at what's ahead
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(bevelBoxLite(THREE), M.stoneDark); s.position.set(-11 + i * 7.3, 0.55, 12 + (i % 2) * 2.5); s.rotation.y = i; s.castShadow = true; sc.add(s); }
  b.forest([[-36, -36, 36, 28]], [-100, -100, 100, 80], 70, 33, 6.5);
  b.motes([-30, 0.5, -30, 30, 9, 26], 150, { color: '#fff1c0', size: 0.3 });
  b.motes([-30, 6, -30, 30, 13, 26], 40, { color: '#d6e8a0', size: 0.5, opacity: 0.6, seed: 4 });
  b.shafts(7, [-22, -22, 22, 12]);
};
function bevelBoxLite(THREE) { return new THREE.BoxGeometry(1.6, 1.1, 1.6); }

export class HubScene extends Base {
  constructor(engine, mode, cb) {
    super(engine, mode === 'outro' ? 'golden' : 'morning', { shadowSize: 32 });
    const THREE = this.THREE; this.cb = cb; this.mode = mode; this.shot = mode === 'outro' ? 'valmiki' : 'aerial'; this.shotT = 0; this.speaker = null; this.time = 0;
    buildGurukulGround(this);
    this.val = makeValmiki(THREE, this.T); this.val.position.set(0, 0.28, -4.2); this.scene.add(this.val);
    const { luv, kush } = spawnBrothers(this, this.scene); this.luv = luv; this.kush = kush;
    luv.position.set(-2.3, 0.28, 2.4); kush.position.set(2.3, 0.28, 2.4); luv.rotation.y = Math.PI; kush.rotation.y = Math.PI;
    this.walk = 0; this.fade = 1;
    this.focus.set(0, 0, 0); this.cam = engine.camera; this.cam.fov = 46; this.cam.updateProjectionMatrix();
    if (mode === 'intro') { this.luv.position.z = 1.9; this.kush.position.z = 1.9; }
    this.confetti = 0;
  }
  setShot(n) { this.shot = n; this.shotT = 0; }
  setSpeaker(w) { this.speaker = w; }
  celebrate() { this.confetti = 1; for (let i = 0; i < 4; i++) setTimeout(() => this.bursts.emit((i - 1.5) * 3, 3, -1, 40, i % 2 ? '#ffd774' : '#ff9a4a', 4, 7, 4), i * 260); }
  update(dt, input, engine) {
    this.time += dt; this.shotT += dt; const t = this.time, cam = this.cam, THREE = this.THREE;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    let pos, look, fov = 46;
    const e = smooth(clamp(this.shotT / 6.5, 0, 1)), s = this.shotT;
    switch (this.shot) {
      case 'aerial': pos = V(lerp(-18, 0, e), lerp(62, 7.5, e * e * (3 - 2 * e)), lerp(66, 13, e)); look = V(0, lerp(0, 1.8, e), lerp(-8, -3, e)); fov = lerp(55, 44, e); break;
      case 'valmiki': { const k = clamp(s / 14, 0, 1); pos = V(lerp(1.6, 0.5, k), lerp(2.3, 2.1, k), lerp(7.4, 5.2, k)); look = V(lerp(-0.2, 0, k), 2.0, -4.2); fov = lerp(40, 34, k); break; }
      case 'luv': { const k = clamp(s / 8, 0, 1); pos = V(-1.0 + k * 0.2, 1.75, 0.2 + k * 0.3); look = V(-2.3, 1.6, 2.4); fov = lerp(36, 31, k); break; }
      case 'kush': { const k = clamp(s / 8, 0, 1); pos = V(1.0 - k * 0.2, 1.75, 0.2 + k * 0.3); look = V(2.3, 1.6, 2.4); fov = lerp(36, 31, k); break; }
      case 'wide': { const k = clamp(s / 14, 0, 1); pos = V(lerp(-8, -4, k), lerp(3.2, 4.2, k), lerp(11, 9, k)); look = V(0, 1.6, -1.5); fov = 42; break; }
      case 'walk': { const k = clamp(s / 5, 0, 1); pos = V(0, lerp(3.2, 4.4, k), lerp(9, 5.5, k)); look = V(0, 1.4, lerp(-4, -10, k)); fov = 44; this.walkOut = k; break; }
      case 'orbit': { const a = s * 0.12 - 0.5; pos = V(Math.sin(a) * 9, 3.4 + Math.sin(s * 0.2) * 0.4, Math.cos(a) * 9 - 1.5); look = V(0, 1.7, -0.6); fov = 42; break; }
      default: pos = V(0, 4, 12); look = V(0, 1.5, 0);
    }
    cam.position.copy(pos); cam.lookAt(look); if (Math.abs(cam.fov - fov) > 0.02) { cam.fov = fov; cam.updateProjectionMatrix(); }
    this.focus.set(0, 0, 0);
    // brothers: turn their heads to the speaker; walk away in the 'walk' shot
    let moving = 0;
    if (this.shot === 'walk') { const k = this.walkOut || 0; if (s > 0.8) { moving = 1; this.walk += dt * 4.4; this.luv.position.z -= dt * 1.7; this.kush.position.z -= dt * 1.7; this.luv.rotation.y = Math.PI; } }
    poseBrother(this.luv, { t, moving, walk: this.walk, idleAnim: 'calm', look: this.speaker === 'VALMIKI' ? -0.02 : 0 });
    poseBrother(this.kush, { t, moving, walk: this.walk, idleAnim: 'eager', look: 0 });
    // dancing head turn toward speaking brother
    const lh = this.luv.userData.head, kh = this.kush.userData.head;
    kh.rotation.y = this.speaker === 'LUV' ? -0.35 : 0; lh.rotation.y = this.speaker === 'KUSH' ? 0.35 : 0;
    poseValmiki(this.val, t, this.speaker === 'VALMIKI');
    this.baseUpdate(dt, this.focus);
    if (input.escape) this.cb && this.cb.onEscape && this.cb.onEscape();
  }
}
