// LEVEL TWO scene — The Test of Precision (interactive archery).
import { Base, makeValmiki, poseValmiki } from './base.js';
import { createRange, CHALLENGES, ORDER } from './level2.js';
import { solveShot } from './archery.js';
import { clamp, smooth, lerp } from './core.js';
import { Avatar, pointerRay, aimPoint, orient, diffHud } from './common.js';
import { makeTarget, makeHut, makeToranam, bevelBox } from './props.js';
import { makeArrow } from './chars.js';
import { makeGrass } from './fx.js';

export class Scene2 extends Base {
  constructor(engine, cb) {
    super(engine, 'noon', { shadowSize: 44, shadow: 2048 });
    const THREE = this.THREE, M = this.M, T = this.T, sc = this.scene; this.cb = cb; this.engine = engine;
    this.sunOff.set(-26, 44, 30);
    const R = this.R = createRange(); this.mode = 'intro'; this.introT = 0; this.cinT = 0; this.stage = 0;
    this.ground(520, { r: 60, cx: 0, cz: -26 }, -0.05);
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(34, 74), M.dirt.clone()); lane.material.map = T.dirt.clone(); lane.material.map.repeat.set(9, 18); lane.material.map.needsUpdate = true;
    lane.rotation.x = -Math.PI / 2; lane.position.set(0, 0.03, -27); lane.receiveShadow = true; sc.add(lane);
    for (const sx of [-1, 1]) { const edge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 74), M.stoneDark); edge.position.set(sx * 17.2, 0.08, -27); edge.receiveShadow = true; sc.add(edge); }
    // shooting platform
    const plat = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.34, 4.2), M.wood); plat.position.set(0, 0.17, -0.4); plat.castShadow = true; plat.receiveShadow = true; sc.add(plat);
    for (const z of [-2.5, 1.7]) { const st = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.1, 0.18), M.gold); st.position.set(0, 0.36, z); sc.add(st); }
    // fences, banners, distance markers
    for (const sx of [-1, 1]) for (let z = 6; z > -64; z -= 4) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.6, 6), M.wood); p.position.set(sx * 18.2, 0.8, z); p.castShadow = true; sc.add(p);
    }
    for (const sx of [-1, 1]) for (const y of [0.7, 1.3]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 70), M.wood); r.position.set(sx * 18.2, y, -28); r.castShadow = true; sc.add(r); }
    this.banners = [];
    for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) {
      const z = -4 - i * 13, g = new THREE.Group(); g.position.set(sx * 19.5, 0, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 7, 8), M.wood); pole.position.y = 3.5; pole.castShadow = true; g.add(pole);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M.gold); tip.position.y = 7.1; g.add(tip);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3, 8, 1), (i + (sx > 0 ? 1 : 0)) % 2 ? M.cloth : M.clothG); flag.position.set(-sx * 1.2, 6.2, 0); flag.rotation.y = Math.PI / 2; g.add(flag); this.banners.push(flag);
      const band = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.16), M.gold.clone()); band.position.set(0, 0.5, 0.01); flag.add(band);
      sc.add(g);
    }
    for (const z of [-15, -30, -45, -60]) for (const sx of [-1, 1]) { const m = new THREE.Mesh(bevelBox(THREE, 0.9, 1.5, 0.9, 0.06), M.stone); m.position.set(sx * 15.6, 0.75, z); m.castShadow = true; sc.add(m); const b = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.1, 0.96), M.gold); b.position.set(sx * 15.6, 1.2, z); sc.add(b); }
    // weapon racks + hay on the flanks of the platform
    for (const sx of [-1, 1]) {
      const rack = new THREE.Group(); rack.position.set(sx * 7.8, 0, 0.4);
      for (const x of [-0.9, 0.9]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 6), M.wood); p.position.set(x, 0.9, 0); rack.add(p); }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2, 0.08, 0.1), M.wood); bar.position.y = 1.3; rack.add(bar);
      for (let i = 0; i < 3; i++) { const bw = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 6, 20, Math.PI * 0.8), M.wood); bw.rotation.set(0, Math.PI / 2, Math.PI / 2 + 0.3); bw.position.set(-0.6 + i * 0.6, 0.9, 0); rack.add(bw); }
      rack.traverse((o) => { if (o.isMesh) o.castShadow = true; }); sc.add(rack);
      for (let i = 0; i < 3; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.9, 12), new THREE.MeshStandardMaterial({ map: T.straw, roughness: 1 })); h.rotation.z = Math.PI / 2; h.position.set(sx * (9.5 + i * 0.1), 0.45 + (i % 2) * 0.1, 2.2 - i * 1.0); h.castShadow = true; sc.add(h); }
    }
    // earthen butt behind the targets
    const mound = new THREE.Mesh(new THREE.BoxGeometry(46, 5.5, 6), new THREE.MeshStandardMaterial({ map: T.dirt, color: '#8b7452', roughness: 1 })); mound.position.set(0, 2.2, -66); mound.castShadow = true; mound.receiveShadow = true; sc.add(mound);
    const crest = new THREE.Mesh(new THREE.BoxGeometry(46.4, 0.4, 6.4), new THREE.MeshStandardMaterial({ map: T.grass, roughness: 1 })); crest.position.set(0, 5.0, -66); sc.add(crest);
    this.hermitage({ huts: [[-33, -18, 0.6, 1.05], [36, -33, -0.6, 1], [-36, -46, 1.0, 1.1], [34, -6, -1.2, 0.95]], tulsi: [[-27, -6]], braziers: [[-10.5, 2.2], [10.5, 2.2]] });
    this.forest([[-21, -70, 21, 14]], [-110, -140, 110, 60], 130, 91, 6);
    sc.add(makeGrass(THREE, T, [[-30, -70, -18.6, 8, 0], [18.6, -70, 30, 8, 0], [-17, 4, 17, 10, 0]], 600, 9));
    this.motes([-24, 0.5, -64, 24, 12, 8], 160, { color: '#fff4cc', size: 0.3 });
    this.shafts(7, [-12, -40, 12, 0]);
    // targets
    this.tm = []; this.arrowMeshes = new Map();
    this.luv = new Avatar(this, 'luv'); this.kush = new Avatar(this, 'kush');
    this.chs = { luv: { x: -1.25, y: 0.34, z: -0.8, face: Math.PI, moving: 0, walk: 0 }, kush: { x: 1.25, y: 0.34, z: -0.8, face: Math.PI, moving: 0, walk: 0 } };
    this.val = makeValmiki(THREE, T); this.val.position.set(5.2, 0.34, -2.4); this.val.rotation.y = -Math.PI / 2 - 0.3; this.val.visible = false; sc.add(this.val);
    this.aimYaw = 0; this.aimPitch = 0; this.drawSfx = false; this.camPos = new THREE.Vector3(0, 2.6, 6.4); this.camLook = new THREE.Vector3(0, 2.2, -20);
    this.speaking = false; this.pending = null; this.nextT = -1;
    this.start('A');
  }
  buildTargets() {
    const THREE = this.THREE, M = this.M, T = this.T;
    this.tm.forEach((m) => this.scene.remove(m.g)); this.tm = [];
    this.rails && this.scene.remove(this.rails); this.rails = new THREE.Group();
    this.R.targets.forEach((t, i) => {
      const moving = t.dir !== 0 && t.a !== undefined;
      const g = makeTarget(THREE, M, T, t.r, !moving && this.R.key !== 'C');
      if (moving) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, t.y + 0.4, 8), M.wood); post.position.set(0, -(t.y + 0.4) / 2 - t.r * 0.0, -0.3); post.castShadow = true; g.add(post);
        const cart = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.9), M.wood); cart.position.set(0, -t.y - 0.2, -0.3); g.add(cart);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(t.b - t.a + 3, 0.12, 0.28), M.wood); rail.position.set((t.a + t.b) / 2, 0.08, t.z - 0.3); this.rails.add(rail);
        for (const e of [t.a - 1.2, t.b + 1.2]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), M.stoneDark); s.position.set(e, 0.3, t.z - 0.3); this.rails.add(s); } }
      if (this.R.key === 'C') { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, t.y + 0.5, 8), M.wood); pole.position.set(0, -(t.y + 0.5) / 2, -0.35); pole.castShadow = true; g.add(pole);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.3, 10), M.stoneDark); base.position.set(0, -t.y - 0.2, -0.35); g.add(base); }
      g.position.set(t.x, t.y, t.z); this.scene.add(g); this.tm.push({ g, shake: 0, sink: 0 });
    });
    this.rails.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); this.scene.add(this.rails);
  }
  start(key) {
    this.R.start(key); this.R.drain(); // the 'challenge' banner is shown after the player reads the briefing (see begin())
    this.buildTargets(); this.clearArrows(); this.introT = 0; this.bannerShown = false;
    if (key === 'A' && !this.seenIntro) this.mode = 'intro'; else this.enterBrief();
    this.seenIntro = true;
    this.engine.setLmb && this.engine.setLmb(false);
    this.emitHud();
  }
  enterBrief() {
    const R = this.R; this.mode = 'brief';
    this.cb.onBrief && this.cb.onBrief({ level: 2, key: R.key, arrows: R.ch.arrows, need: R.ch.need, of: R.ch.targets.length });
  }
  begin() {
    if (this.mode !== 'brief') return;
    const R = this.R; this.mode = 'banner'; this.introT = 0;
    this.cb.onBanner && this.cb.onBanner({ key: R.key, title: R.ch.title, arrows: R.ch.arrows, need: R.ch.need, of: R.ch.targets.length }); this.sfx('conch');
  }
  retry() { this.cb.onChallengeFail && this.cb.onChallengeFail(null); this.R.retry(); this.buildTargets(); this.clearArrows(); this.mode = 'banner'; this.emitHud(); }
  clearArrows() { this.arrowMeshes.forEach((m) => this.scene.remove(m)); this.arrowMeshes.clear(); this.R.sim.clear(); }
  sfx(n, o) { this.cb.sfx && this.cb.sfx(n, o); }
  emitHud() {
    const R = this.R;
    diffHud(this.cb, { level: 2, title: 'II · The Test of Precision', kind: 'archery', progress: { done: Object.keys(R.done).length, total: 3 }, score: R.banked + R.cur, challenge: R.ch ? { key: R.key, title: R.ch.title } : null,
      arrows: { left: R.arrowsLeft, max: R.ch ? R.ch.arrows : 0 }, hits: { n: R.hits, need: R.ch ? R.ch.need : 0, of: R.ch ? R.ch.targets.length : 0 }, phase: R.phase, shooter: R.shooter, objective: '', hint: null, cinematic: this.mode === 'cin' });
  }
  float(text, kind, vec) { const s = this.engine.project(vec); this.cb.onFloat && this.cb.onFloat({ text, kind, x: s.x, y: s.y }); }

  handle(events) {
    const THREE = this.THREE, R = this.R;
    for (const e of events) {
      if (e.type === 'challenge') { this.cb.onBanner && this.cb.onBanner({ key: e.key, title: e.title, arrows: R.ch.arrows, need: R.ch.need, of: R.ch.targets.length }); this.sfx('conch'); }
      if (e.type === 'shot') this.sfx('release');
      if (e.type === 'hit') {
        const p = e.point; this.tm[e.id] && (this.tm[e.id].shake = 1);
        this.bursts.emit(p.x, p.y, p.z, e.bull ? 60 : 30, e.bull ? '#ffd774' : '#e8c874', 3.2, 3, 7);
        if (e.bull) this.bursts.emit(p.x, p.y, p.z, 24, '#ff9a4a', 5, 2, 3);
        this.sfx(e.bull ? 'bull' : 'hit'); this.float(`${e.ring}  +${e.pts}`, e.bull ? 'bull' : 'hit', new THREE.Vector3(p.x, p.y + 0.8, p.z));
      }
      if (e.type === 'miss') { this.bursts.emit(e.x, Math.max(e.y, 0.05), e.z, 14, '#b89a68', 2, 2.5, 8); this.sfx('thud'); }
      if (e.type === 'activate') { this.sfx('ok'); }
      if (e.type === 'expire') { this.float('Too slow', 'msg', new THREE.Vector3(R.targets[e.id].x, R.targets[e.id].y + 1, R.targets[e.id].z)); this.sfx('wrong'); }
      if (e.type === 'clear') { this.sfx('win'); this.cb.onChallengeClear && this.cb.onChallengeClear({ key: e.key, bonus: e.bonus, score: e.score, arrowsLeft: e.arrowsLeft }); this.nextT = 3.0; this.mode = 'cleared'; }
      if (e.type === 'fail') { this.sfx('wrong'); this.cb.onChallengeFail && this.cb.onChallengeFail({ key: e.key, hits: e.hits, need: R.ch.need }); this.mode = 'failed'; }
    }
  }
  setAimSides() { const R = this.R; this.active = R.shooter; }

  update(dt, input, engine) {
    dt = Math.min(dt, 1 / 30); const THREE = this.THREE, R = this.R, cam = engine.camera;
    engine.touchAim = true;
    if (!input.ptr.in) { input.ptr.x = input.w / 2; input.ptr.y = input.h * 0.45; }
    if (input.reset && (this.mode === 'failed' || this.mode === 'live')) { this.retry(); }
    // ---- mode flow
    if (this.mode === 'intro') { this.introT += dt; if (this.introT > 3.2) { this.introT = 0; this.enterBrief(); } }
    if (this.mode === 'banner') { this.introT += dt; R.update(dt); if (R.phase === 'live') this.mode = 'live'; }
    else if (this.mode === 'live' || this.mode === 'cleared' || this.mode === 'failed') {
      this.handleAim(input, dt);
      R.update(dt);
    }
    if (this.mode === 'intro' || this.mode === 'brief') { R.update(0); }
    this.handle(R.drain());
    if (this.mode === 'cleared' && this.nextT > 0) { this.nextT -= dt; if (this.nextT <= 0) { const i = ORDER.indexOf(R.key); if (i < 2) this.start(ORDER[i + 1]); else this.beginFinale(); } }
    // ---- visuals
    this.syncTargets(dt); this.syncArrows(dt); this.syncChars(dt);
    this.banners.forEach((f, i) => { f.rotation.z = Math.sin(this.t * 2 + i) * 0.08; f.rotation.x = Math.sin(this.t * 3 + i * 1.7) * 0.04; });
    this.camera(dt, input);
    this.focus.set(0, 0, -20);
    this.baseUpdate(dt, this.focus);
    this.emitHud();
    if (this.mode === 'cin') { this.cinT += dt; this.finale(dt); }
    if (input.escape) this.cb.onEscape && this.cb.onEscape();
  }

  handleAim(input, dt) {
    const THREE = this.THREE, R = this.R, bow = R.bow, ptr = input.ptr;
    const can = this.mode === 'live' && R.canShoot();
    if (can && input.lmb && !bow.drawing && !this.lmbHeld) { bow.begin(); this.sfx('draw'); }
    if (!input.lmb && bow.drawing) {
      const rel = bow.release();
      if (rel.ok && can) {
        const sw = this.lastSway || { x: 0, y: 0 };
        const ray = pointerRay(THREE, this.engine, ptr, sw), org = R.origin(), live = R.liveTargets();
        const ap = aimPoint(THREE, this.engine, ray, live, ptr);
        const v = solveShot(org, ap, rel.speed); R.fire(org, v);
        this.aimYaw = Math.atan2(v.x, -v.z) * 0.8; this.recoil = 1;
      }
    }
    if (bow.drawing && !can) bow.reset();
    this.lmbHeld = input.lmb;
    const sw = bow.drawing ? bow.swayOffset() : { x: 0, y: 0 }; this.lastSway = sw;
    // aim direction for the shooter pose
    const ray = pointerRay(THREE, this.engine, ptr, sw), ap = aimPoint(THREE, this.engine, ray, R.liveTargets(), ptr), o = R.origin();
    const dx = ap.x - o.x, dy = ap.y - o.y, dz = ap.z - o.z, hl = Math.hypot(dx, dz) || 1;
    this.aimYaw += (clamp(Math.atan2(dx, -dz), -0.8, 0.8) - this.aimYaw) * Math.min(1, dt * 10); this.aimPitch += (clamp(Math.atan2(dy, hl), -0.3, 0.6) - this.aimPitch) * Math.min(1, dt * 10);
    this.cb.onAim && this.cb.onAim({ x: ptr.x + sw.x, y: ptr.y + sw.y, draw: bow.draw, sway: bow.sway, active: can, drawing: bow.drawing, locked: !!ap.locked, fatigue: bow.fatigue, cursor: { x: ptr.x, y: ptr.y } });
  }
  syncTargets(dt) {
    const R = this.R;
    R.targets.forEach((t, i) => {
      const m = this.tm[i]; if (!m) return; const g = m.g, u = g.userData;
      const vis = R.key !== 'C' || t.live || t.hit; g.visible = vis;
      const pop = smooth(t.pop); g.position.set(t.x, t.y - (1 - pop) * (t.y + 1.5), t.z); g.scale.setScalar(0.4 + 0.6 * pop);
      m.shake = Math.max(0, m.shake - dt * 2.2); u.disc.rotation.x = Math.sin(this.t * 38) * m.shake * 0.12; u.disc.position.z = -m.shake * 0.12;
      const live = t.live && !t.hit, pulse = 0.55 + 0.45 * Math.sin(this.t * 5 + i);
      u.halo.material.opacity += ((live && R.key === 'C' ? 0.95 : live ? 0.18 * pulse : 0) - u.halo.material.opacity) * Math.min(1, dt * 10);
      u.spr.material.opacity += ((live && R.key === 'C' ? 0.9 : 0) - u.spr.material.opacity) * Math.min(1, dt * 10);
      if (live && R.key === 'C' && R.active === i) { const f = 1 - R.activeT / R.ch.windows[i]; u.halo.scale.setScalar(1 + (1 - f) * 0.5 + Math.sin(this.t * 8) * 0.03); } else u.halo.scale.setScalar(1);
    });
  }
  syncArrows(dt) {
    const THREE = this.THREE, sim = this.R.sim, seen = new Set();
    for (const a of sim.arrows) {
      seen.add(a.id); let m = this.arrowMeshes.get(a.id);
      if (!m) {
        m = new THREE.Group(); const ar = makeArrow(THREE, this.T); m.add(ar);
        const tr = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 14 }, () => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); tr.frustumCulled = false; this.scene.add(tr); m.userData.tr = tr; m.userData.hist = [];
        this.scene.add(m); this.arrowMeshes.set(a.id, m);
      }
      const d = a.stuck ? (a.dir || { x: a.vx, y: a.vy, z: a.vz }) : { x: a.vx, y: a.vy, z: a.vz };
      orient(THREE, m, d.x, d.y, d.z);
      const len = Math.hypot(d.x, d.y, d.z) || 1, back = a.stuck ? 0.32 : 0;
      m.position.set(a.x - d.x / len * back, a.y - d.y / len * back, a.z - d.z / len * back);
      const h = m.userData.hist; if (!a.stuck) { h.push([a.x, a.y, a.z]); if (h.length > 14) h.shift(); }
      const tr = m.userData.tr, p = tr.geometry.attributes.position; for (let i = 0; i < 14; i++) { const q = h[Math.max(0, h.length - 14 + i)] || h[0] || [a.x, a.y, a.z]; p.setXYZ(i, q[0], q[1], q[2]); } p.needsUpdate = true;
      tr.material.opacity = a.stuck ? Math.max(0, 0.55 - a.fade * 1.5) : 0.55;
      if (a.stuck && a.ground && a.fade > 3.5) m.visible = a.fade < 4.6 ? Math.floor(a.fade * 12) % 2 === 0 : false;
    }
    this.arrowMeshes.forEach((m, id) => { if (!seen.has(id)) { this.scene.remove(m); this.scene.remove(m.userData.tr); this.arrowMeshes.delete(id); } });
  }
  syncChars(dt) {
    const R = this.R, bow = R.bow, live = this.mode === 'live' || this.mode === 'cleared' || this.mode === 'failed';
    this.recoil = Math.max(0, (this.recoil || 0) - dt * 3);
    for (const id of ['luv', 'kush']) {
      const av = this[id], ch = this.chs[id], active = R.shooter === id && live && this.mode !== 'cin';
      const o = { dy: 0 };
      if (this.mode === 'cin') { av.sync(ch, dt, { dy: 0 }); av.m.position.set(ch.x, ch.y, ch.z); av.m.rotation.y = ch.face; continue; }
      av.m.position.set(ch.x, ch.y, ch.z);
      const face = active ? Math.PI + (this.aimYaw || 0) * -0.5 : Math.PI + (id === 'luv' ? 0.18 : -0.18) * (R.shooter === id ? 0 : 1);
      av.sync(ch, dt, { dy: 0, face, aiming: active, draw: active ? Math.max(bow.draw, 0) : 0, aimYaw: this.aimYaw || 0, aimPitch: this.aimPitch || 0, bowOut: false, hasArrow: R.arrowsLeft > 0 && !R.sim.inFlight() || bow.drawing, look: 0 });
      av.m.position.set(ch.x, ch.y, ch.z);
    }
    if (this.mode !== 'cin') { // the resting brother watches; Kush fidgets, Luv is composed
    }
  }
  camera(dt, input) {
    const THREE = this.THREE, cam = this.engine.camera; let pos, look, fov = 52;
    if (this.mode === 'cin') { this.cinCam(dt); return; }
    if (this.mode === 'intro') {
      const e = smooth(clamp(this.introT / 3.2, 0, 1)); pos = new THREE.Vector3(lerp(-14, 0, e), lerp(14, 2.7, e), lerp(26, 6.6, e)); look = new THREE.Vector3(0, lerp(3, 2.2, e), lerp(-30, -20, e)); fov = lerp(58, 52, e);
    } else {
      const px = clamp(input.ptr.nx || 0, -1, 1), py = clamp(input.ptr.ny || 0, -1, 1);
      const draw = this.R.bow.draw; const shooterX = this.R.shooter === 'luv' ? -1.25 : 1.25;
      pos = new THREE.Vector3(lerp(0, shooterX * 0.6, 0.6) + px * 0.5, 2.55 - draw * 0.25, 6.3 - draw * 2.4); look = new THREE.Vector3(px * 3.2 + shooterX * 0.1, 2.0 + py * 1.4, -20); fov = 52 - draw * 8;
    }
    this.camPos.lerp(pos, Math.min(1, dt * 4)); this.camLook.lerp(look, Math.min(1, dt * 5));
    cam.position.copy(this.camPos); cam.lookAt(this.camLook); if (Math.abs(cam.fov - fov) > 0.05) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 6); cam.updateProjectionMatrix(); }
  }
  beginFinale() {
    this.mode = 'cin'; this.cinT = 0; this.stage = 0; this.clearArrows(); this.val.visible = true; this.R.bow.reset();
    this.cb.onAim && this.cb.onAim({ active: false }); this.cb.onChallengeClear && this.cb.onChallengeClear(null);
    const l = this.chs.luv, k = this.chs.kush; l.face = Math.PI; k.face = Math.PI;
  }
  finale(dt) {
    const l = this.chs.luv, k = this.chs.kush, tl = -0.95, tk = 0.95;
    const stepTo = (c, x) => { const d = x - c.x; if (Math.abs(d) > 0.05) { c.x += Math.sign(d) * Math.min(Math.abs(d), 1.6 * dt); c.moving += (1 - c.moving) * 0.2; c.walk += 1.6 * dt * 1.15; c.face = d > 0 ? Math.PI / 2 : -Math.PI / 2; } else { c.moving *= 0.85; c.face = Math.PI; } };
    stepTo(l, tl); stepTo(k, tk);
    poseValmiki(this.val, this.t, this.speaking);
    if (this.stage === 0 && this.cinT > 2.6) {
      this.stage = 1; this.speaking = true;
      Promise.resolve(this.cb.say([{ who: 'VALMIKI', text: 'Precision is not achieved through haste. It comes through patience, attention and discipline.' }])).then(() => { this.speaking = false; this.stage = 2; const R = this.R; this.cb.onDone && this.cb.onDone({ score: R.banked, accuracy: R.accuracy(), precision: R.precision(), bulls: R.stats.bulls, shots: R.stats.shots, hits: R.stats.hits }); });
    }
  }
  cinCam(dt) {
    const THREE = this.THREE, cam = this.engine.camera, t = this.cinT, e = smooth(clamp(t / 5, 0, 1));
    const pos = new THREE.Vector3(lerp(5.5, 1.9, e), lerp(3.4, 1.85, e), lerp(-4.5, -6.3, e)), look = new THREE.Vector3(lerp(0, 1.6, e), 1.55, -1.0);
    this.camPos.lerp(pos, Math.min(1, dt * 3)); this.camLook.lerp(look, Math.min(1, dt * 3)); cam.position.copy(this.camPos); cam.lookAt(this.camLook); cam.fov += (40 - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix();
  }
}