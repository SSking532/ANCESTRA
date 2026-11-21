// Renderer, post-processing, input and camera rig shared by all scenes.
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Engine {
  constructor(THREE, canvas, hooks = {}) {
    this.THREE = THREE; this.canvas = canvas; this.hooks = hooks; this.scene = null; this.running = false;
    this.keys = new Set(); this.edge = { jump: false, interact: false, switch: false, reset: false, escape: false };
    this.stick = { x: 0, y: 0 }; this.look = { x: 0, y: 0 }; this.ptr = { x: 0, y: 0, nx: 0, ny: 0, in: false };
    this.lmb = false; this.rmb = false; this.t = 0; this.fpsAcc = 0; this.fpsN = 0; this.pr = Math.min(window.devicePixelRatio || 1, 2);
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 900);
    this.dragging = null; this.paused = false; this.touchAim = false;
    this.maxShadow = (typeof navigator !== 'undefined' && (/Mobi|Android/i.test(navigator.userAgent || '') || (navigator.deviceMemory && navigator.deviceMemory <= 4))) ? 1024 : 2048;
    this.renderErr = 0; this.updErr = 0; this.lost = false;
  }
  async init() {
    const THREE = this.THREE;
    let r = null, lastErr = null;
    for (const opts of [{ antialias: true, powerPreference: 'high-performance', alpha: false }, { antialias: false, alpha: false }, { antialias: false }]) {
      try { r = new THREE.WebGLRenderer({ canvas: this.canvas, ...opts }); break; } catch (e) {
        lastErr = e; // a canvas whose context failed can't be reused: swap in a fresh one
        const fresh = document.createElement('canvas'); fresh.className = this.canvas.className; fresh.tabIndex = 0; const par = this.canvas.parentNode;
        if (par) { par.replaceChild(fresh, this.canvas); } this.canvas = fresh;
      }
    }
    if (!r) throw lastErr || new Error('WebGL unavailable');
    this.renderer = r;
    // GPU context loss used to leave a permanently blank canvas: allow the browser to restore it, and tell the UI if it never does.
    this.onLost = (e) => { e.preventDefault(); this.lost = true; clearTimeout(this.lostT); this.lostT = setTimeout(() => { if (this.lost) this.fatal(new Error('WebGL context lost')); }, 4000); };
    this.onRestored = () => { this.lost = false; clearTimeout(this.lostT); try { if (this.scene) this.buildComposer(this.scene.scene); this.resize(); } catch (e) { /* noop */ } };
    this.canvas.addEventListener('webglcontextlost', this.onLost, false); this.canvas.addEventListener('webglcontextrestored', this.onRestored, false);
    r.setPixelRatio(this.pr);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    if ('outputColorSpace' in r) r.outputColorSpace = THREE.SRGBColorSpace; else r.outputEncoding = THREE.sRGBEncoding;
    this.composer = null;
    try {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
        import('three/examples/jsm/postprocessing/EffectComposer.js'), import('three/examples/jsm/postprocessing/RenderPass.js'),
        import('three/examples/jsm/postprocessing/UnrealBloomPass.js'), import('three/examples/jsm/postprocessing/OutputPass.js'),
      ]);
      this.C = { EffectComposer, RenderPass, UnrealBloomPass, OutputPass };
      this.useComposer = true;
    } catch (e) { this.useComposer = false; }
    this.bindInput(); this.resize();
    this.onResize = () => this.resize(); window.addEventListener('resize', this.onResize);
  }
  buildComposer(scene) {
    if (!this.useComposer) return;
    const { EffectComposer, RenderPass, UnrealBloomPass, OutputPass } = this.C, THREE = this.THREE;
    try {
      this.disposeComposer();
      const c = this.composer = new EffectComposer(this.renderer);
      c.addPass(new RenderPass(scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(this.w, this.h), 0.38, 0.7, 0.88); c.addPass(this.bloom);
      c.addPass(new OutputPass()); c.setPixelRatio && c.setPixelRatio(this.pr); c.setSize(this.w, this.h);
    } catch (e) { this.composer = null; this.useComposer = false; }
  }
  fatal(err) { const f = this.hooks && this.hooks.onFatal; if (f) { this.hooks.onFatal = null; try { f(err); } catch (e) { /* noop */ } } }
  disposeComposer() {
    const c = this.composer; if (!c) return;
    try { (c.passes || []).forEach((p) => { try { p.dispose && p.dispose(); } catch (e) { /* noop */ } }); } catch (e) { /* noop */ }
    try { c.dispose && c.dispose(); } catch (e) { /* noop */ }
    this.composer = null; this.bloom = null;
  }
  /** Free the current scene (geometry, materials, shadow map, composer targets) BEFORE the next scene is built. */
  clearScene() {
    const old = this.scene; this.scene = null;
    if (old && old.dispose) { try { old.dispose(); } catch (e) { console.error('[TwinTrials] dispose error', e); } }
    this.disposeComposer();
    try { this.renderer && this.renderer.renderLists && this.renderer.renderLists.dispose(); } catch (e) { /* noop */ }
  }
  setScene(sc) {
    if (this.scene && this.scene !== sc && this.scene.dispose) { try { this.scene.dispose(); } catch (e) { /* noop */ } }
    this.renderErr = 0; this.updErr = 0;
    this.scene = sc; this.buildComposer(sc.scene);
    this.edge = { jump: false, interact: false, switch: false, reset: false, escape: false };
    if (!this.running) { this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame((n) => this.loop(n)); }
  }
  resize() {
    const p = this.canvas.parentElement || this.canvas; this.w = Math.max(2, p.clientWidth); this.h = Math.max(2, p.clientHeight);
    this.renderer.setPixelRatio(this.pr); this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h; this.camera.updateProjectionMatrix();
    if (this.composer) { this.composer.setPixelRatio && this.composer.setPixelRatio(this.pr); this.composer.setSize(this.w, this.h); }
  }
  /* ---------------- input ---------------- */
  bindInput() {
    const k = this.keys, cv = this.canvas;
    this.kd = (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      const c = e.code; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) e.preventDefault();
      if (!k.has(c)) {
        if (c === 'Space') this.edge.jump = true; if (c === 'KeyE') this.edge.interact = true; if (c === 'KeyQ' || c === 'Tab') { this.edge.switch = true; if (c === 'Tab') e.preventDefault(); }
        if (c === 'KeyR') this.edge.reset = true; if (c === 'Escape') this.edge.escape = true;
      }
      k.add(c);
    };
    this.ku = (e) => k.delete(e.code);
    window.addEventListener('keydown', this.kd); window.addEventListener('keyup', this.ku);
    this.blur = () => { k.clear(); this.lmb = false; this.rmb = false; }; window.addEventListener('blur', this.blur);
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    this.pd = (e) => {
      this.updPtr(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      if (e.pointerType === 'touch') { this.dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 }; this.ptr.in = true; if (this.touchAim) this.lmb = true; return; }
      if (e.button === 0) this.lmb = true; if (e.button === 2 || e.button === 1) { this.rmb = true; this.dragging = { id: e.pointerId, x: e.clientX, y: e.clientY }; }
    };
    this.pm = (e) => {
      this.updPtr(e);
      if (this.dragging && this.dragging.id === e.pointerId && (e.pointerType === 'touch' ? !this.touchAim : this.rmb)) {
        this.look.x += e.clientX - this.dragging.x; this.look.y += e.clientY - this.dragging.y; this.dragging.x = e.clientX; this.dragging.y = e.clientY;
      } else if (this.dragging && this.dragging.id === e.pointerId) { this.dragging.x = e.clientX; this.dragging.y = e.clientY; }
    };
    this.pu = (e) => {
      if (e.pointerType === 'touch') { if (this.dragging && this.dragging.id === e.pointerId) this.dragging = null; if (this.touchAim) this.lmb = false; return; }
      if (e.button === 0) this.lmb = false; if (e.button === 2 || e.button === 1) { this.rmb = false; this.dragging = null; }
    };
    cv.addEventListener('pointerdown', this.pd); cv.addEventListener('pointermove', this.pm); window.addEventListener('pointerup', this.pu); cv.addEventListener('pointercancel', this.pu);
  }
  updPtr(e) {
    const b = this.canvas.getBoundingClientRect();
    this.ptr.x = e.clientX - b.left; this.ptr.y = e.clientY - b.top; this.ptr.nx = this.ptr.x / b.width * 2 - 1; this.ptr.ny = -(this.ptr.y / b.height * 2 - 1); this.ptr.in = true;
  }
  /** called by the on-screen touch UI */
  press(name) { this.edge[name] = true; }
  setLmb(v) { this.lmb = v; }
  setStick(x, y) { this.stick.x = x; this.stick.y = y; }
  frameInput() {
    const k = this.keys; let mx = 0, mz = 0;
    if (k.has('KeyA') || k.has('ArrowLeft')) mx -= 1; if (k.has('KeyD') || k.has('ArrowRight')) mx += 1;
    if (k.has('KeyW') || k.has('ArrowUp')) mz += 1; if (k.has('KeyS') || k.has('ArrowDown')) mz -= 1;
    mx += this.stick.x; mz += -this.stick.y;
    const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
    const inp = { mx, mz, yaw: 0, jump: this.edge.jump, interact: this.edge.interact, switch: this.edge.switch, reset: this.edge.reset, escape: this.edge.escape, lmb: this.lmb, ptr: this.ptr, lookX: this.look.x, lookY: this.look.y, w: this.w, h: this.h };
    this.edge.jump = this.edge.interact = this.edge.switch = this.edge.reset = this.edge.escape = false; this.look.x = this.look.y = 0;
    return inp;
  }
  /* ---------------- loop ---------------- */
  loop(now) {
    this.raf = requestAnimationFrame((n) => this.loop(n));
    let dt = (now - this.last) / 1000; this.last = now; if (dt > 0.1) dt = 0.1; this.t += dt;
    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc > 2.5) { const avg = this.fpsAcc / this.fpsN; this.fpsAcc = 0; this.fpsN = 0; this.adapt(avg); }
    if (this.scene && !this.lost) {
      if (!this.paused) { try { this.scene.update(dt, this.frameInput(), this); this.updErr = 0; } catch (e) { console.error('[TwinTrials] update error', e); if (++this.updErr > 90) this.fatal(e); } }
      try { if (this.composer && this.useComposer) this.composer.render(dt); else this.renderer.render(this.scene.scene, this.camera); this.renderErr = 0; }
      catch (e) { console.error('[TwinTrials] render error', e); this.useComposer = false; if (++this.renderErr > 30) this.fatal(e); }
    }
  }
  adapt(avgDt) {
    if (avgDt > 0.03 && this.pr > 0.85) { this.pr = Math.max(0.85, this.pr - 0.2); this.resize(); }
    else if (avgDt > 0.045 && this.bloom && this.bloom.enabled !== false) { this.bloom.enabled = false; }
  }
  project(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.w, y: (-p.y * 0.5 + 0.5) * this.h, vis: p.z < 1 && p.z > -1 };
  }
  dispose() {
    cancelAnimationFrame(this.raf); this.running = false; clearTimeout(this.lostT);
    if (this.onLost) { this.canvas.removeEventListener('webglcontextlost', this.onLost); this.canvas.removeEventListener('webglcontextrestored', this.onRestored); }
    window.removeEventListener('keydown', this.kd); window.removeEventListener('keyup', this.ku); window.removeEventListener('resize', this.onResize); window.removeEventListener('blur', this.blur); window.removeEventListener('pointerup', this.pu);
    this.canvas.removeEventListener('pointerdown', this.pd); this.canvas.removeEventListener('pointermove', this.pm);
    if (this.scene && this.scene.dispose) { try { this.scene.dispose(); } catch (e) { /* noop */ } }
    try { const A = this.assets; if (A) { const seen = (t) => { if (Array.isArray(t)) t.forEach(seen); else if (t && t.dispose) t.dispose(); }; Object.values(A.T || {}).forEach(seen); Object.values(A.M || {}).forEach((m) => m && m.dispose && m.dispose()); } } catch (e) { /* noop */ }
    try { this.disposeComposer(); this.renderer.dispose(); this.renderer.forceContextLoss && this.renderer.forceContextLoss(); } catch (e) { /* noop */ }
  }
}

/** Orbiting third-person camera with smoothing, shake and aim-mode blending. */
export class FollowCam {
  constructor(THREE) { this.T = THREE; this.yaw = 0.0; this.pitch = 0.8; this.dist = 15; this.fov = 46; this.pos = new THREE.Vector3(); this.look = new THREE.Vector3(); this.shake = 0; this.init = false; this.manual = 0; }
  update(dt, cam, target, params, input, aimBias = null) {
    const THREE = this.T;
    const lx = input.lookX || 0, ly = input.lookY || 0;
    if (lx || ly) { this.yaw -= lx * 0.0055; this.pitch = clamp(this.pitch + ly * 0.0045, 0.12, 1.35); this.manual = 2.5; }
    this.manual = Math.max(0, this.manual - dt);
    if (aimBias && this.manual <= 0) { let d = aimBias.yaw - this.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; this.yaw += d * Math.min(1, dt * 3.5); }
    const k = Math.min(1, dt * 4);
    this.dist += (params.dist - this.dist) * k; this.fov += (params.fov - this.fov) * k;
    const pt = params.pitch;
    if (this.manual <= 0 && !this.pitchLocked) this.pitch += (pt - this.pitch) * Math.min(1, dt * 1.2);
    const cp = Math.cos(this.pitch), off = new THREE.Vector3(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp).multiplyScalar(this.dist);
    const want = new THREE.Vector3(target.x, target.y + (params.lookY ?? 1.2), target.z);
    if (!this.init) { this.look.copy(want); this.init = true; }
    this.look.lerp(want, Math.min(1, dt * 6));
    const pos = this.look.clone().add(off);
    if (params.shoulder) { const r = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); pos.addScaledVector(r, params.shoulder); }
    this.pos.lerp(pos, Math.min(1, dt * 7)); if (this.pos.distanceTo(pos) > 30) this.pos.copy(pos);
    this.shake = Math.max(0, this.shake - dt * 2.4);
    cam.position.copy(this.pos); if (this.shake > 0) cam.position.add(new THREE.Vector3((Math.random() - 0.5) * this.shake * 0.4, (Math.random() - 0.5) * this.shake * 0.4, 0));
    cam.lookAt(this.look); if (Math.abs(cam.fov - this.fov) > 0.05) { cam.fov = this.fov; cam.updateProjectionMatrix(); }
  }
}