// LEVEL ONE scene — The Path of Wisdom.
import { Base, makeValmiki, poseValmiki } from './base.js';
import { createLevel1, L1 } from './level1.js';
import { cw, gOf, clamp, smooth, lerp, T as CT, D4, camDir } from './core.js';
import { FollowCam } from './engine.js';
import { buildSlabs, buildRocks, buildCurbs, Avatar, syncBlock, makeBlocks, FLOOR_TOP, diffHud } from './common.js';
import { makeToranam, makePillar, makePlate, makeStoneGate, makeBrazier, tickBrazier, bevelBox } from './props.js';
import { makeWater, makeGrass } from './fx.js';
import { makeTex, drawMosaic } from './tex.js';

const PSI = { N: 0, E: -Math.PI / 2, S: Math.PI, W: Math.PI / 2 };

export class Scene1 extends Base {
  constructor(engine, cb) {
    super(engine, 'morning', { shadowSize: 34 });
    const THREE = this.THREE, M = this.M, T = this.T, sc = this.scene; this.cb = cb; this.engine = engine;
    const L = this.L = createLevel1(), w = L.world;
    this.cam = new FollowCam(THREE); this.cam.yaw = 0.3; this.cam.pitch = 0.85; this.cam.dist = 16;
    this.mode = 'play'; this.cinT = 0; this.prev = { gateB: false, gateW: false, plank: false, solved: false };
    this.ground(520, { r: 70, cx: 42, cz: 9 }, -0.9);
    buildSlabs(this, w, { seed: 11 }); buildCurbs(this, w);
    buildRocks(this, w, (gx) => gx >= 2 && gx <= 6 || (gx >= 25 && gx <= 28) || (gx >= 32 && gx <= 35), 6, 1.1);
    // --- rivers (three channels) with a dark bed
    this.waters = [];
    for (const [x0, x1] of [[4, 14], [50, 58], [64, 72]]) {
      const wt = makeWater(THREE, x1 - x0, 110); wt.position.set((x0 + x1) / 2, -0.42, 9); sc.add(wt); this.waters.push(wt);
      const bed = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 110), new THREE.MeshStandardMaterial({ map: T.dirt, color: '#5a5240', roughness: 1 })); bed.rotation.x = -Math.PI / 2; bed.position.set((x0 + x1) / 2, -2.2, 9); sc.add(bed);
    }
    this.addTick((t) => this.waters.forEach((wt) => { wt.userData.u.time.value = t; }));
    // --- puzzle A: blocks, pad, plank
    this.blockMeshes = makeBlocks(this, w);
    const padX = cw(4), padZ = cw(4);
    const lotus = new THREE.Mesh(new THREE.CircleGeometry(0.95, 28), new THREE.MeshStandardMaterial({ map: T.medal[0], roughness: 0.8 })); lotus.rotation.x = -Math.PI / 2; lotus.position.set(padX, FLOOR_TOP + 0.01, padZ); sc.add(lotus);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 12), M.gold); pin.position.set(padX, FLOOR_TOP + 0.2, padZ); pin.castShadow = true; sc.add(pin);
    this.plankPivot = new THREE.Group(); this.plankPivot.position.set(padX, FLOOR_TOP, padZ); sc.add(this.plankPivot);
    const plank = new THREE.Mesh(bevelBox(THREE, 1.6, 0.34, 3.0, 0.06), M.wood); plank.position.set(0, -0.05, -1.55); plank.castShadow = true; plank.receiveShadow = true; this.plankPivot.add(plank);
    for (const dz of [-0.1, -2.9]) { const band = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.06, 0.1), M.gold); band.position.set(0, 0.15, dz); this.plankPivot.add(band); }
    for (const sx of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 2.6), M.brass); rail.position.set(sx * 0.7, 0.16, -1.55); this.plankPivot.add(rail); }
    this.plankAng = 0;
    // --- puzzle B: courtyard
    const cx = cw(15), cz = cw(4);
    const mosaicTex = makeTex(THREE, 1024, (g, ww, hh) => drawMosaic(g, ww, hh, L1.mosaic), { clamp: true });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(3.3, 64), new THREE.MeshStandardMaterial({ map: mosaicTex, roughness: 0.75 })); disc.rotation.x = -Math.PI / 2; disc.position.set(cx, FLOOR_TOP + 0.015, cz); disc.receiveShadow = true; sc.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.09, 8, 64), M.gold); rim.rotation.x = Math.PI / 2; rim.position.set(cx, FLOOR_TOP + 0.05, cz); sc.add(rim);
    this.pillarObjs = {}; this.grooves = {}; this.beams = {};
    this.centerGroup = new THREE.Group(); this.centerGroup.position.set(cx, FLOOR_TOP, cz); sc.add(this.centerGroup);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 24), M.stoneDark); drum.position.y = 0.25; drum.castShadow = true; this.centerGroup.add(drum);
    this.petals = []; this.lotusTop = new THREE.Group(); this.lotusTop.position.y = 0.5; this.centerGroup.add(this.lotusTop);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const p = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.0, 6), M.gold); p.position.set(Math.cos(a) * 0.35, 0.4, Math.sin(a) * 0.35); p.userData.a = a; this.lotusTop.add(p); this.petals.push(p); }
    this.orb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), new THREE.MeshStandardMaterial({ color: '#7a4a1a', emissive: '#ffb040', emissiveIntensity: 0.0, roughness: 0.2 })); this.orb.position.y = 0.55; this.lotusTop.add(this.orb);
    this.orbGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: '#ffc060', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); this.orbGlow.scale.set(7, 7, 1); this.orbGlow.position.y = 0.6; this.lotusTop.add(this.orbGlow);
    this.centerLight = new THREE.PointLight('#ffb050', 0, 16, 2); this.centerLight.position.set(0, 2.2, 0); this.centerGroup.add(this.centerLight);
    for (const p of L.pillars) {
      const pm = makePillar(THREE, M, T, p.base); pm.position.set(cw(p.gx), FLOOR_TOP, cw(p.gz)); sc.add(pm); this.pillarObjs[p.id] = { m: pm, ang: PSI[p.id] + p.turns * Math.PI / 2, ok: 0 };
      pm.userData.rot.rotation.y = this.pillarObjs[p.id].ang;
      // glowing groove from pillar foot to the central disc
      const dx = cx - cw(p.gx), dz = cz - cw(p.gz), len = Math.hypot(dx, dz) - 1.4 - 3.3, ux = dx / Math.hypot(dx, dz), uz = dz / Math.hypot(dx, dz);
      const gm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, len), new THREE.MeshStandardMaterial({ color: '#4a3820', emissive: '#ffb040', emissiveIntensity: 0, roughness: 0.6 }));
      gm.position.set(cw(p.gx) + ux * (1.4 + len / 2), FLOOR_TOP + 0.03, cw(p.gz) + uz * (1.4 + len / 2)); gm.rotation.y = Math.atan2(ux, uz); sc.add(gm); this.grooves[p.id] = gm;
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 6), new THREE.MeshBasicMaterial({ color: '#ffd070', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      const a = new THREE.Vector3(cw(p.gx), FLOOR_TOP + 4.95, cw(p.gz)), bpt = new THREE.Vector3(cx, FLOOR_TOP + 1.25, cz), mid = a.clone().add(bpt).multiplyScalar(0.5);
      beam.position.copy(mid); beam.scale.y = a.distanceTo(bpt); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bpt.clone().sub(a).normalize()); sc.add(beam); this.beams[p.id] = beam;
    }
    // bronze chain linking the East pillar to the South pillar (they turn together)
    { const pe = L.pillars.find((p) => p.id === 'E'), ps = L.pillars.find((p) => p.id === 'S'), pts = [];
      const A = new THREE.Vector3(cw(pe.gx) - 0.4, FLOOR_TOP + 1.3, cw(pe.gz) + 0.7), B = new THREE.Vector3(cw(ps.gx) + 0.7, FLOOR_TOP + 1.3, cw(ps.gz) - 0.4);
      for (let i = 0; i <= 14; i++) { const u = i / 14, p = A.clone().lerp(B, u); p.y -= Math.sin(u * Math.PI) * 0.55; p.x += Math.sin(u * Math.PI) * 0.9; p.z += Math.sin(u * Math.PI) * 0.9; pts.push(p); }
      const chain = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.05, 6), M.brass); chain.castShadow = true; sc.add(chain);
      for (let i = 1; i < 14; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 6, 10), M.brass); l.position.copy(pts[i]); l.rotation.set(i * 0.8, i * 1.3, 0); sc.add(l); } }
    // courtyard braziers + banners
    this.hermitage({ braziers: [[cw(10.3), cw(0.7)], [cw(20.3), cw(0.7)], [cw(10.3), cw(7.9)], [cw(20.3), cw(7.9)], [cw(1), cw(1.3)], [cw(8.6), cw(7.6)]] });
    // --- gate B (stone door) with tall walls
    this.gateB = makeStoneGate(THREE, M, T, 3); this.gateB.rotation.y = Math.PI / 2; this.gateB.position.set(cw(21), FLOOR_TOP, cw(4)); sc.add(this.gateB);
    for (const gz of [0, 1, 2, 6, 7, 8]) { const wl = new THREE.Mesh(bevelBox(THREE, 2, 5.2, 2, 0.08), M.stone); wl.position.set(cw(21), 2.6, cw(gz)); wl.castShadow = true; wl.receiveShadow = true; sc.add(wl); }
    const lintelB = new THREE.Mesh(bevelBox(THREE, 2.2, 0.7, 6.4, 0.08), M.stoneDark); lintelB.position.set(cw(21), 5.0, cw(4)); lintelB.castShadow = true; sc.add(lintelB);
    // --- puzzle C: plates, moving platforms, lamps, final gateway
    this.plates = {}; for (const k in L1.plates) { const pm = makePlate(THREE, M, T, +k); pm.position.set(cw(L1.plates[k][0]), FLOOR_TOP, cw(L1.plates[k][1])); sc.add(pm); this.plates[k] = pm; }
    this.platMeshes = L.platforms.map((p) => {
      const g = new THREE.Group(); const sl = new THREE.Mesh(bevelBox(THREE, p.w - 0.04, 0.5, p.d - 0.04, 0.07), M.stone); sl.castShadow = true; sl.receiveShadow = true; g.add(sl);
      for (let i = -2; i <= 2; i++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, p.d - 0.5), M.wood); pl.position.set(i * 0.78 + 0.0, 0.27, 0); g.add(pl); }
      for (const sx of [-1, 1]) { const rim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, p.d), M.gold); rim.position.set(sx * (p.w / 2 - 0.05), 0.28, 0); g.add(rim); }
      const med = new THREE.Mesh(new THREE.CircleGeometry(0.7, 20), new THREE.MeshStandardMaterial({ map: T.medal[2], roughness: 0.8 })); med.rotation.x = -Math.PI / 2; med.position.y = 0.31; g.add(med);
      g.position.set(p.x, FLOOR_TOP - 0.25, p.z); sc.add(g); return g;
    });
    this.toranam = makeToranam(THREE, M, T, 7.4, 6.0); this.toranam.rotation.y = Math.PI / 2; this.toranam.position.set(cw(38), FLOOR_TOP, cw(4)); sc.add(this.toranam);
    this.gateW = makeStoneGate(THREE, M, T, 3); this.gateW.rotation.y = Math.PI / 2; this.gateW.position.set(cw(38), FLOOR_TOP, cw(4)); sc.add(this.gateW);
    this.lamps = [0, 1, 2].map((i) => { const br = makeBrazier(THREE, M, T, false); br.scale.setScalar(0.75); br.position.set(cw(38), 6.0 + 1.05, cw(4) + (i - 1) * 2.3); sc.add(br); return br; });
    // far side: Valmiki + Kush wait beyond the gateway
    this.val = makeValmiki(THREE, T); this.val.position.set(cw(40.8), FLOOR_TOP, cw(3.2)); this.val.rotation.y = -Math.PI / 2; sc.add(this.val);
    this.hermitage({ braziers: [[cw(39.2), cw(1.2)], [cw(39.2), cw(7)]] });
    this.luv = new Avatar(this, 'luv'); this.kush = new Avatar(this, 'kush');
    this.kushCh = { x: cw(41.3), z: cw(5.2), y: 0, face: -Math.PI / 2, moving: 0, walk: 0, pushing: false, jy: 0 };
    // backdrop of the hermitage
    this.hermitage({ huts: [[10, -13, 0.4, 1], [38, -14, -0.2, 1.1], [66, -13, 0.3, 1], [24, 31, 3.3, 1.05], [52, 33, 3.0, 1], [80, 30, 3.6, 1]], tulsi: [[28, -6], [56, 25]], havan: [[46, 27]] });
    this.forest([[-6, -10, 92, 26]], [-40, -60, 130, 80], 120, 77, 6);
    this.add(makeGrass(THREE, T, [[-4, -9, 90, -0.5, -0.3], [-4, 18.5, 90, 26, -0.3], [-4, -0.5, 1.5, 18, -0.3]], 700, 5));
    this.motes([-5, 0.5, -10, 90, 9, 28], 170, { color: '#fff1c0', size: 0.3 });
    this.shafts(8, [0, -8, 84, 20]);
    this.bunting({ x: cw(10), y: 5.2, z: cw(0.2) }, { x: cw(10), y: 5.2, z: cw(7.8) }, 0.9);
    this.focus.set(cw(0), 0, cw(4)); this.floatQ = [];
    this.hudBase = { level: 1, title: 'I · The Path of Wisdom', kind: 'puzzle' };
    this.last = { seq: 0 };
    cb.onHud && cb.onHud({ ...this.hudBase, progress: L.progress(), score: 0, objective: L.objective(), hint: null });
    this.hintT = 0;
    this.mode = 'brief'; cb.onBrief && cb.onBrief({ level: 1 }); // wait for the player to read the briefing
  }
  begin() { if (this.mode === 'brief') this.mode = 'play'; }
  add(o) { this.scene.add(o); return o; }
  headScreen() { const THREE = this.THREE, c = this.L.luv; return this.engine.project(new THREE.Vector3(c.x, c.y + 2.6, c.z)); }
  sfx(n, o) { this.cb.sfx && this.cb.sfx(n, o); }
  float(text, kind = 'score') { const p = this.headScreen(); this.cb.onFloat && this.cb.onFloat({ text, kind, x: p.x, y: p.y }); }

  handle(events) {
    const w = this.L.world;
    for (const e of events) {
      switch (e.type) {
        case 'push': this.sfx('push'); break;
        case 'settle': this.sfx('settle'); break;
        case 'splash': this.sfx('splash'); this.bursts.emit(e.x, 0.1, e.z, 36, '#d8eef0', 2.6, 4.5, 9); break;
        case 'fill': this.bursts.emit(cw(e.gx), 0.2, cw(e.gz), 18, '#b7d9de', 2, 2.5, 8); break;
        case 'plankTurn': this.sfx('turn'); break;
        case 'pillarTurn': this.sfx('turn'); this.cam.shake = Math.max(this.cam.shake, 0.18); break;
        case 'pillarOk': this.sfx('ok'); { const o = this.pillarObjs[e.id], p = o.m.position; this.bursts.emit(p.x, 5.2, p.z, 26, '#ffd774', 2, 4, 5); } break;
        case 'mechanism': this.sfx('mech'); this.cam.shake = 1.1; this.bursts.emit(cw(15), 1.6, cw(4), 90, '#ffd774', 5, 9, 4); this.float('The mechanism awakens', 'msg'); break;
        case 'plateOn': this.sfx('plate'); break;
        case 'lamp': this.sfx('lamp', { n: e.n }); break;
        case 'wrongOrder': this.sfx('wrong'); this.float('The flames die — begin again', 'msg'); break;
        case 'platePower': this.sfx('ok'); break;
        case 'finalGate': this.sfx('gate'); this.cam.shake = 0.8; break;
        case 'score': this.float(`+${e.pts}  ${e.label}`, 'score'); this.sfx('ok'); break;
        case 'puzzleB': this.sfx('gate'); this.cam.shake = 0.8; break;
        case 'denied': this.float(e.why, 'msg'); break;
        case 'reset': this.float('The stones return to their places', 'msg'); this.sfx('turn'); break;
        case 'levelDone': this.beginFinale(); break;
        default: break;
      }
    }
  }
  beginFinale() {
    this.mode = 'cin'; this.cinT = 0; this.stage = 0; this.sfx('win');
    this.cb.onHud && this.cb.onHud({ ...this.hudBase, progress: this.L.progress(), score: this.L.s.score, objective: '', hint: null, cinematic: true });
  }
  update(dt, input, engine) {
    dt = Math.min(dt, 1 / 30);
    const L = this.L, w = L.world, luv = L.luv, THREE = this.THREE;
    engine.touchAim = false;
    if (this.mode === 'brief') { /* briefing card is open: world waits */ }
    else if (this.mode === 'play') {
      input.yaw = this.cam.yaw;
      if (input.interact) L.interact();
      if (input.reset) L.reset();
      this.handle(L.update(dt, input));
    } else { this.handle(L.update(dt, { mx: 0, mz: 0, yaw: 0 })); this.finale(dt); }
    // --- visuals
    this.blockMeshes.forEach((m, i) => syncBlock(m, w.blocks[i], w));
    const pk = L.plank; let a0 = -pk.from * Math.PI / 2, a1 = -pk.dir * Math.PI / 2; while (a1 - a0 > Math.PI) a1 -= Math.PI * 2; while (a1 - a0 < -Math.PI) a1 += Math.PI * 2;
    this.plankPivot.rotation.y = pk.spin ? lerp(a0, a1, smooth(clamp(pk.rot, 0, 1))) : a1; this.plankPivot.position.y = FLOOR_TOP + (pk.spin ? Math.sin(clamp(pk.rot, 0, 1) * Math.PI) * 0.25 : 0);
    for (const p of L.pillars) {
      const o = this.pillarObjs[p.id], tgt = PSI[p.id] + p.turns * Math.PI / 2; o.ang += (tgt - o.ang) * Math.min(1, dt * 8); o.m.userData.rot.rotation.y = o.ang;
      const ok = p.p === p.solvedP && p.busy === 0 ? 1 : 0; o.ok += (ok - o.ok) * Math.min(1, dt * 5);
      o.m.userData.gem.material.emissiveIntensity = o.ok * 2.4; o.m.userData.glow.material.opacity = o.ok * 0.9;
      this.grooves[p.id].material.emissiveIntensity = o.ok * 1.8; this.beams[p.id].material.opacity = o.ok * 0.55 * (L.s.solved ? 1 : 0.6);
    }
    const mech = L.s.mech; this.lotusTop.position.y = 0.5 + smooth(mech) * 1.1; this.lotusTop.rotation.y += dt * (0.4 + mech * 4);
    this.petals.forEach((p) => { const open = smooth(mech); p.rotation.set(Math.sin(p.userData.a) * open * 0.9, 0, -Math.cos(p.userData.a) * open * 0.9); p.position.set(Math.cos(p.userData.a) * (0.35 + open * 0.3), 0.4, Math.sin(p.userData.a) * (0.35 + open * 0.3)); });
    this.orb.material.emissiveIntensity = mech * 3; this.orbGlow.material.opacity = mech * 0.95; this.centerLight.intensity = mech * 14;
    this.gateB.userData.slab.position.y = L.gateB.openAmt * 4.85; this.gateW.userData.slab.position.y = L.gateW.openAmt * 4.85;
    for (const k in this.plates) { const p = w.plates.find((q) => q.id === +k), pm = this.plates[k]; const tgt = p.pressed ? 1 : 0; pm.userData.press += (tgt - pm.userData.press) * Math.min(1, dt * 12); pm.userData.slab.position.y = 0.12 - pm.userData.press * 0.07; pm.userData.top.position.y = 0.215 - pm.userData.press * 0.07; pm.userData.top.material.emissiveIntensity = pm.userData.press * 1.2 + (this.plateDone(+k) ? 0.7 : 0); }
    L.platforms.forEach((p, i) => { this.platMeshes[i].position.set(p.x, FLOOR_TOP - 0.25 + Math.sin(this.t * 2 + i) * 0.012, p.z); });
    this.lamps.forEach((l, i) => tickBrazier(l, this.t, L.s.seq > i));
    if (L.gateB.open && !this.prev.gateB) { this.prev.gateB = true; this.sfx('gate'); }
    this.luv.sync(luv, dt, { dy: FLOOR_TOP });
    if (this.mode === 'play') this.kush.sync({ ...this.kushCh, y: 0 }, dt, { dy: FLOOR_TOP }); else this.kush.sync({ ...this.kushCh, y: 0 }, dt, { dy: FLOOR_TOP, face: this.kushCh.face });
    this.kush.m.position.set(this.kushCh.x, FLOOR_TOP, this.kushCh.z);
    poseValmiki(this.val, this.t, this.mode === 'cin' && this.speaking);
    // --- camera
    this.focus.set(luv.x, luv.y, luv.z);
    if (this.mode === 'play' || this.mode === 'brief') {
      const cp = L.camParams(); this.cam.update(dt, engine.camera, { x: luv.x, y: luv.y + FLOOR_TOP, z: luv.z }, { dist: cp.dist, pitch: cp.pitch, fov: cp.fov, lookY: 0.8 }, input);
    } else this.finaleCam(dt);
    this.baseUpdate(dt, this.focus);
    // --- HUD
    const h = L.hint(); const hint = this.mode === 'play' ? h : null;
    diffHud(this.cb, { ...this.hudBase, progress: L.progress(), score: L.s.score, objective: this.mode === 'play' ? L.objective() : '', hint, cinematic: this.mode === 'cin', steps: this.zoneSteps() });
    if (input.escape) this.cb.onEscape && this.cb.onEscape();
  }
  plateDone(k) { return this.L.s.seq >= k; }
  zoneSteps() { const s = this.L.s; return [{ k: 'A', done: s.A, label: 'The Broken Path' }, { k: 'B', done: s.B, label: 'The Ancient Mechanism' }, { k: 'C', done: s.C, label: 'The Final Passage' }]; }

  // ----- finale: Kush joins Luv; Valmiki praises them
  finale(dt) {
    this.cinT += dt; const L = this.L, w = L.world, luv = L.luv, k = this.kushCh;
    const tx = cw(39.2), tz = cw(4.0);
    if (this.stage === 0) { // Luv steps clear of the gateway, Kush runs over
      const dx = tx - luv.x, dz = tz - luv.z, d = Math.hypot(dx, dz);
      if (d > 0.4) w.stepChar(luv, dx / d, dz / d, dt, false, 3.2); else w.stepChar(luv, 0, 0, dt);
      const kx = cw(39.2) + 2.0, kz = cw(4.0) + 0.9, ex = kx - k.x, ez = kz - k.z, ed = Math.hypot(ex, ez);
      if (ed > 0.2) { const sp = 4.2 * dt; k.x += ex / ed * sp; k.z += ez / ed * sp; k.face = Math.atan2(ex, ez); k.moving += (1 - k.moving) * 0.2; k.walk += sp * 1.15; }
      else { k.moving *= 0.8; k.face = Math.atan2(luv.x - k.x, luv.z - k.z); }
      if (this.cinT > 1.0 && ed < 0.25 && d < 0.5) { this.stage = 1; luv.face = Math.atan2(k.x - luv.x, k.z - luv.z); }
    } else if (this.stage === 1) {
      this.stage = 2; this.speaking = true;
      const spk = this.cb.say([{ who: 'VALMIKI', text: 'Well done. Understanding the world around you is the beginning of wisdom.' }]);
      Promise.resolve(spk).then(() => { this.speaking = false; this.stage = 3; this.cb.onDone && this.cb.onDone({ score: L.s.score, resets: L.s.resets, rot: L.s.rot, time: L.s.time }); });
    }
    k.moving *= 0.97;
    w.stepChar(luv, 0, 0, dt);
  }
  finaleCam(dt) {
    const THREE = this.THREE, cam = this.engine.camera, t = this.cinT;
    const a = cw(39.6), z = cw(4), e = smooth(clamp(t / 6, 0, 1));
    const pos = new THREE.Vector3(lerp(cw(33), cw(36.5), e), lerp(5.5, 2.6, e), lerp(cw(8.5), cw(7.0), e)); const look = new THREE.Vector3(lerp(cw(38), a + 1.3, e), 1.5, z - 0.4);
    cam.position.lerp(pos, Math.min(1, dt * 2.2)); cam.lookAt(look); cam.fov += (40 - cam.fov) * Math.min(1, dt * 2); cam.updateProjectionMatrix();
  }
}