/* 3D battle engine (three.js). Used by AssaultOnLankaGame.jsx */
import * as THREE from "three";

/* ------------------------------ GAME ENGINE ------------------------------ */
const NEW_LIGHTS = parseInt(THREE.REVISION, 10) >= 155;
const LK = NEW_LIGHTS ? Math.PI : 1;

export function createGame(root, cb, snd) {
  const q = (n) => root.querySelector(`[data-h="${n}"]`);
  const hud = { cmb: q("cmb"), cmbn: q("cmbn"), wvp: q("wvp"), k0: q("k0"), rad: q("rad"), dn: q("dn"), hp: q("hp"), hpt: q("hpt"), k1: q("k1"), k2: q("k2"), wvt: q("wvt"), wvs: q("wvs"), ban: q("ban"), bt: q("bt"), bs: q("bs"), hint: q("hint"), vig: q("vig") };
  const mount = q("mount");
  const R = Math.random, TAU = Math.PI * 2, V3 = THREE.Vector3;
  const lerp = (a, b, t) => a + (b - a) * t, cp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ang = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const rom = (n) => ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || n;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.domElement.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;display:block";
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace; else renderer.outputEncoding = THREE.sRGBEncoding;
  mount.appendChild(renderer.domElement);
  const cv = renderer.domElement;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
  /* Always sizes the canvas to the real on-screen size of the mount (fixes the "game stuck in a corner" bug).
     Runs on window/visualViewport/fullscreen changes, via ResizeObserver, and as a cheap safety check inside the loop. */
  let rw = 2, rh = 2, rp = 0;
  const resize = () => {
    const w = Math.max(2, Math.round(mount.clientWidth || root.clientWidth || window.innerWidth)), h = Math.max(2, Math.round(mount.clientHeight || root.clientHeight || window.innerHeight)), pr = Math.min(window.devicePixelRatio || 1, 2);
    if (w === rw && h === rh && pr === rp) return; rw = w; rh = h; rp = pr;
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  };
  const rzOn = [["resize", window], ["orientationchange", window], ["fullscreenchange", document]];
  rzOn.forEach(([e, t]) => t.addEventListener(e, resize));
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);
  let ro = null; if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(resize); ro.observe(mount); ro.observe(root); }
  resize();
  const srgb = (t) => { if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = THREE.sRGBEncoding; return t; };
  const ctex = (w, h, fn) => { const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); return srgb(new THREE.CanvasTexture(c)); };

  /* sky, fog, lights */
  scene.background = ctex(2, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); [[0, "#120b2a"], [0.4, "#6e2a4a"], [0.7, "#e0703a"], [1, "#f8c870"]].forEach((s) => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  scene.fog = new THREE.FogExp2(0xb85a34, 0.0105);
  scene.add(new THREE.HemisphereLight(0xffc890, 0x40251a, 0.95 * LK));
  const sun = new THREE.DirectionalLight(0xffd29a, 1.5 * LK); sun.position.set(30, 50, 40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 150 }); sun.shadow.bias = -0.0006; scene.add(sun, sun.target);
  const sunS = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "#fff6d0"); g.addColorStop(0.3, "rgba(255,190,90,.7)"); g.addColorStop(1, "rgba(255,120,40,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }), fog: false, blending: THREE.AdditiveBlending, depthWrite: false }));
  sunS.scale.set(140, 140, 1); sunS.position.set(-50, 28, -210); scene.add(sunS);

  /* sky dome (follows the camera), stars, drifting clouds, far mountains */
  const skyG = new THREE.Group(); scene.add(skyG);
  const domeT = ctex(4, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); [[0, "#07051a"], [0.22, "#1c0f35"], [0.36, "#58244a"], [0.46, "#c8553a"], [0.5, "#ffb560"], [0.53, "#f6a455"], [0.58, "#a8502f"], [1, "#2a120c"]].forEach((c) => g.addColorStop(c[0], c[1])); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(440, 32, 24), new THREE.MeshBasicMaterial({ map: domeT, side: THREE.BackSide, fog: false, depthWrite: false })); dome.renderOrder = -20; skyG.add(dome);
  const SN = 380, sp2 = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) { const a = R() * TAU, e = 0.3 + R() * 1.05; sp2[i * 3] = Math.cos(a) * Math.cos(e) * 400; sp2[i * 3 + 1] = Math.sin(e) * 400; sp2[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 400; }
  const sg2 = new THREE.BufferGeometry(); sg2.setAttribute("position", new THREE.BufferAttribute(sp2, 3));
  skyG.add(new THREE.Points(sg2, new THREE.PointsMaterial({ color: 0xffe9cc, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0.8, fog: false, depthWrite: false })));
  const cloudT = ctex(256, 96, (x, w, h) => { for (let i = 0; i < 26; i++) { const cx = 30 + R() * (w - 60), cy = 30 + R() * (h - 52), r = 14 + R() * 26, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, "rgba(255,170,110,.32)"); g.addColorStop(1, "rgba(255,170,110,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
  const clouds = []; for (let i = 0; i < 12; i++) { const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudT, transparent: true, fog: false, depthWrite: false, opacity: 0.55 + R() * 0.4 })); const a = (R() - 0.5) * 3.2 - Math.PI / 2, el = 0.12 + R() * 0.3; c.position.set(Math.cos(a) * 360, Math.sin(el) * 360 + 10, Math.sin(a) * 360); c.scale.set(150 + R() * 120, 46 + R() * 30, 1); skyG.add(c); clouds.push(c); }
  const mtM = new THREE.MeshBasicMaterial({ color: 0x2a1226, fog: false });
  for (let i = 0; i < 16; i++) { const h = 38 + R() * 46, m = new THREE.Mesh(new THREE.ConeGeometry(34 + R() * 30, h, 5 + (R() * 3 | 0)), mtM); m.position.set(-340 + i * 45 + R() * 20, h / 2 - 6, -262 - R() * 26); m.rotation.y = R() * 3; scene.add(m); }

  /* ground + sea */
  const gt = ctex(256, 256, (x, w, h) => { x.fillStyle = "#7a5a3a"; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${60 + R() * 90 | 0},${40 + R() * 60 | 0},${25 + R() * 40 | 0},.35)`; x.fillRect(R() * w, R() * h, 1 + R() * 5, 1 + R() * 5); } });
  gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(76, 76);
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(760, 760), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; scene.add(gnd);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(500, 200), new THREE.MeshStandardMaterial({ color: 0x1e5a7a, roughness: 0.2, metalness: 0.6 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.2, 160); scene.add(sea);

  /* golden Lanka */
  const gold = new THREE.MeshStandardMaterial({ color: 0xc89a35, metalness: 0.7, roughness: 0.4, emissive: 0x2a1400 }), redM = new THREE.MeshStandardMaterial({ color: 0x9a2a1c, roughness: 0.6 });
  const box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; scene.add(b); return b; };
  for (let x = -154; x <= 154; x += 14) { if (Math.abs(x) < 16) continue; box(14, 16, 4, x, 8, -88, gold); for (let k = -5; k <= 5; k += 5) box(2.6, 2.4, 4.4, x + k, 17.2, -88, gold); }
  for (let x = -150; x <= 150; x += 28) { const t = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.6, 30, 12), gold); t.position.set(x, 15, -88); t.castShadow = true; scene.add(t); const r = new THREE.Mesh(new THREE.ConeGeometry(5.6, 8, 12), redM); r.position.set(x, 34, -88); scene.add(r); }
  for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 42, 12), gold); t.position.set(s * 18, 21, -88); scene.add(t); const r = new THREE.Mesh(new THREE.ConeGeometry(8, 12, 12), redM); r.position.set(s * 18, 48, -88); scene.add(r); }
  box(30, 3, 4, 0, 26, -88, gold);
  for (let i = 0; i < 9; i++) { const h = 24 + R() * 30, m = new THREE.Mesh(new THREE.CylinderGeometry(3 + R() * 3, 5 + R() * 3, h, 10), gold); m.position.set(-70 + i * 17, h / 2, -118 - R() * 10); scene.add(m); const c = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 10), redM); c.position.set(m.position.x, h + 2, m.position.z); scene.add(c); }
  const torches = [], flames = [];
  for (const x of [-30, -10, 10, 30]) {
    const l = new THREE.PointLight(0xff7a2a, NEW_LIGHTS ? 90 : 2.2, 45, NEW_LIGHTS ? 2 : 1); l.position.set(x, 4, -70); scene.add(l); torches.push(l);
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 7), new THREE.MeshBasicMaterial({ color: 0xffa030 })); f.position.set(x, 3.2, -70); scene.add(f); flames.push(f); box(0.3, 3, 0.3, x, 1.5, -70, redM);
  }
  const rk = new THREE.MeshStandardMaterial({ color: 0x5b4a3e, roughness: 1, flatShading: true });
  for (let i = 0; i < 40; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + R() * 1.8), rk); r.position.set((R() - 0.5) * 130, 0.3, -60 + R() * 105); r.rotation.set(R() * 3, R() * 3, 0); r.castShadow = r.receiveShadow = true; scene.add(r); }
  /* glowing golden gate, lit windows, cobbled war road, scorch marks, planted spears, vanara tents */
  const ggT = ctex(128, 256, (x, w, h) => { const g = x.createRadialGradient(64, 236, 6, 64, 190, 170); g.addColorStop(0, "rgba(255,248,205,1)"); g.addColorStop(0.3, "rgba(255,176,70,.92)"); g.addColorStop(0.7, "rgba(190,60,20,.78)"); g.addColorStop(1, "rgba(90,20,8,.7)"); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const gateM = new THREE.Mesh(new THREE.PlaneGeometry(27, 23), new THREE.MeshBasicMaterial({ map: ggT, transparent: true, opacity: 0.95, fog: false })); gateM.position.set(0, 11.5, -87); scene.add(gateM);
  for (const sx of [-1, 1]) box(2.2, 25, 4.6, sx * 14.4, 12.5, -88, gold);
  const gateL = new THREE.PointLight(0xff7a24, NEW_LIGHTS ? 160 : 2.6, 60, NEW_LIGHTS ? 2 : 1); gateL.position.set(0, 8, -80); scene.add(gateL);
  const winN = 22 * 2, winI = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, 2.6, 0.3), new THREE.MeshBasicMaterial({ color: 0xffc860 }), winN), wm = new THREE.Matrix4(); let wi = 0;
  for (let x = -154; x <= 154; x += 14) { if (Math.abs(x) < 16) continue; for (const k of [-3.2, 3.2]) { if (wi < winN) { wm.makeTranslation(x + k, 8.4, -85.85); winI.setMatrixAt(wi++, wm); } } }
  winI.count = wi; winI.instanceMatrix.needsUpdate = true; scene.add(winI);
  const roadT = ctex(128, 512, (x, w, h) => { x.fillStyle = "#6b4e36"; x.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { const sx = (i % 6) * 22 + (R() - 0.5) * 6, sy = (i / 6 | 0) * 36 + R() * 6; x.fillStyle = `rgba(${150 + R() * 60 | 0},${110 + R() * 40 | 0},${75 + R() * 30 | 0},.5)`; x.fillRect(sx + 2, sy + 2, 18, 28); x.strokeStyle = "rgba(20,10,4,.5)"; x.strokeRect(sx + 2, sy + 2, 18, 28); } });
  roadT.wrapS = roadT.wrapT = THREE.RepeatWrapping; roadT.repeat.set(1, 3);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(24, 150), new THREE.MeshStandardMaterial({ map: roadT, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, -12); road.receiveShadow = true; scene.add(road);
  const scT = ctex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, "rgba(14,5,2,.9)"); g.addColorStop(0.55, "rgba(28,10,5,.55)"); g.addColorStop(1, "rgba(30,12,6,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = "rgba(255,140,50,.55)"; x.lineWidth = 2; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + R() * 0.4; let px = 64, py = 64; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += Math.cos(a + (R() - 0.5) * 0.6) * 11; py += Math.sin(a + (R() - 0.5) * 0.6) * 11; x.lineTo(px, py); } x.stroke(); } });
  const decalG = new THREE.PlaneGeometry(1, 1); decalG.rotateX(-Math.PI / 2);
  const mkDecal = (op) => { const m = new THREE.Mesh(decalG, new THREE.MeshBasicMaterial({ map: scT, transparent: true, depthWrite: false, opacity: op, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); scene.add(m); return m; };
  for (let i = 0; i < 12; i++) { const m = mkDecal(0.8); m.position.set((R() - 0.5) * 110, 0.05, -50 + R() * 85); m.scale.setScalar(5 + R() * 7); m.rotation.y = R() * 6; }
  const spM = new THREE.MeshStandardMaterial({ color: 0x4a2f1a, roughness: 0.9 }), spT = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.8, roughness: 0.35 });
  for (let i = 0; i < 26; i++) { const g = new THREE.Group(), sh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 4.4, 6), spM), tp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 6), spT); sh.position.y = 2.2; tp.position.y = 4.6; g.add(sh, tp); g.position.set((R() - 0.5) * 120, 0, -62 + R() * 100); g.rotation.set((R() - 0.5) * 0.6, 0, (R() - 0.5) * 0.6); g.traverse((o) => { o.castShadow = true; }); scene.add(g); }
  const tentM = new THREE.MeshStandardMaterial({ color: 0xc05a24, roughness: 0.9, emissive: 0x200a02, flatShading: true });
  for (let i = 0; i < 10; i++) { const sx = i % 2 ? 1 : -1, t = new THREE.Mesh(new THREE.ConeGeometry(4.6, 5.6, 6), tentM); t.position.set(sx * (79 + R() * 14), 2.8, -4 + (i >> 1) * 11); t.rotation.y = R() * 3; t.castShadow = true; scene.add(t); }
  /* Rama's banners (waving) */
  const flags = [], fm = new THREE.MeshStandardMaterial({ color: 0xe8761e, side: THREE.DoubleSide, emissive: 0x401800 });
  for (let i = 0; i < 8; i++) { const x = -45 + i * 13, z = 40 + (i % 2) * 4; box(0.25, 9, 0.25, x, 4.5, z, new THREE.MeshStandardMaterial({ color: 0x4a2a14 })); const f = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2), fm); f.position.set(x + 1.7, 8, z); scene.add(f); flags.push(f); }
  /* embers */
  const EN = 280, ep = new Float32Array(EN * 3); for (let i = 0; i < EN; i++) { ep[i * 3] = (R() - 0.5) * 160; ep[i * 3 + 1] = R() * 30; ep[i * 3 + 2] = -80 + R() * 140; }
  const eg = new THREE.BufferGeometry(); eg.setAttribute("position", new THREE.BufferAttribute(ep, 3));
  const embers = new THREE.Points(eg, new THREE.PointsMaterial({ color: 0xffa040, size: 0.35, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(embers);

  /* characters */
  function mk(o) {
    const g = new THREE.Group(), M = (c, e, m) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: m || 0, emissive: e || 0 });
    const sk = M(o.skin), cl = M(o.cloth), dk = M(0x1a0d08), gl = new THREE.MeshBasicMaterial({ color: o.eye });
    const A = (geo, m, x, y, z, p) => { const s = new THREE.Mesh(geo, m); s.position.set(x, y, z); s.castShadow = true; (p || g).add(s); return s; };
    const S = (r, w = 12) => new THREE.SphereGeometry(r, w, w - 2), C = (a, b, h) => new THREE.CylinderGeometry(a, b, h, 10);
    A(C(0.5, 0.42, 1.1), sk, 0, 1.75, 0); A(C(0.44, 0.52, 0.55), cl, 0, 1.1, 0); A(S(0.42), sk, 0, 2.6, 0);
    A(S(0.07, 6), gl, -0.15, 2.66, 0.37); A(S(0.07, 6), gl, 0.15, 2.66, 0.37);
    const L = [], Ar = [];
    for (const sx of [-1, 1]) {
      const l = new THREE.Group(); l.position.set(sx * 0.24, 1, 0); g.add(l); A(C(0.17, 0.13, 1), sk, 0, -0.5, 0, l); A(new THREE.BoxGeometry(0.3, 0.16, 0.45), dk, 0, -1, 0.1, l); L.push(l);
      const a = new THREE.Group(); a.position.set(sx * 0.68, 2.2, 0); g.add(a); A(C(0.14, 0.12, 1), sk, 0, -0.5, 0, a); A(S(0.17), sk, 0, -1.02, 0, a);
      if (o.monkey) A(C(0.17, 0.17, 0.12), M(0xf2b84b, 0x442200, 0.8), 0, -0.3, 0, a); Ar.push(a);
    }
    const w = new THREE.Group(); w.position.set(0, -1, 0); w.rotation.x = Math.PI / 2; Ar[1].add(w);
    A(C(0.07, 0.09, 1.7), M(o.wood || 0x5a3a1c), 0, 0.55, 0, w); A(S(o.mace || 0.3, 10), M(o.head, o.monkey ? 0x3a2200 : 0, o.metal), 0, 1.5, 0, w);
    if (o.monkey) {
      A(S(0.3), M(0xf0c9a0), 0, 2.55, 0.2).scale.set(1, 0.85, 0.6); for (const sx of [-1, 1]) A(S(0.15), sk, sx * 0.43, 2.65, 0);
      for (let i = 0; i < 6; i++) A(S(0.12 - i * 0.008, 8), sk, 0, 1.2 + Math.sin(i * 0.55) * 0.7, -0.4 - Math.sin(i * 0.6) * 0.35);
      if (o.crown) A(C(0.3, 0.34, 0.14), M(0xf2b84b, 0x553300, 0.9), 0, 2.98, 0);
    } else {
      for (const sx of [-1, 1]) { const h = A(new THREE.ConeGeometry(0.1, 0.55, 6), M(0xe8dcc0), sx * 0.24, 3.05, 0); h.rotation.z = -sx * 0.35; const t = A(new THREE.ConeGeometry(0.05, 0.25, 5), M(0xf4ecd8), sx * 0.14, 2.42, 0.38); t.rotation.x = Math.PI; }
    }
    if (o.armor) {
      const am = M(o.armor, 0, 0.55); A(new THREE.SphereGeometry(0.47, 14, 8, 0, TAU, 0, Math.PI * 0.55), am, 0, 2.62, 0);
      for (const sx of [-1, 1]) { const pd = A(S(0.32, 10), am, sx * 0.62, 2.42, 0); pd.scale.set(1, 0.6, 1); if (o.spikes) { const sp = A(new THREE.ConeGeometry(0.1, 0.5, 6), M(0xd8c8a0, 0, 0.5), sx * 0.66, 2.78, 0); sp.rotation.z = -sx * 0.25; } }
      A(C(0.54, 0.54, 0.16), M(0x8a6a2a, 0x201000, 0.8), 0, 1.42, 0);
      if (o.spikes) A(new THREE.ConeGeometry(0.16, 0.45, 6), M(0xd8c8a0), 0, 3.1, 0);
    }
    let cape = null; if (o.cape) { const cm = new THREE.MeshStandardMaterial({ color: 0xc9301f, roughness: 0.7, side: THREE.DoubleSide, emissive: 0x300800 }); cape = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.7, 1, 4), cm); cape.geometry.translate(0, -0.85, 0); cape.position.set(0, 2.45, -0.45); cape.castShadow = true; g.add(cape); }
    g.userData = { L, Ar, sk, cape }; return g;
  }
  const CF = { mon: { s: 1, hp: 60, sp: 7.5, dmg: 14, rg: 2.6, r: 0.7 }, rak: { s: 1.1, hp: 75, sp: 4.4, dmg: 10, rg: 2.6, r: 0.8 }, gnt: { s: 2.5, hp: 260, sp: 2.7, dmg: 30, rg: 5.2, r: 1.8 } };
  function mkbar(root3, col, s) {
    const f = (c) => { const p = new THREE.Sprite(new THREE.SpriteMaterial({ color: c, depthTest: false, transparent: true })); p.renderOrder = 10; return p; };
    const b = f(0), g = f(col); b.scale.set(1.7 * s, 0.2, 1); b.position.y = 3.7 * s; g.center.set(0, 0.5); g.scale.set(1.6 * s, 0.14, 1); g.position.set(-0.8 * s, 3.7 * s, 0); g.renderOrder = 11; root3.add(b, g); return [b, g];
  }
  let U = [], E = [], A = [], P, T = 0, shake = 0, kills = 0, wave = 0, queue = [], qt = 0, clearT = 0, lastHit = 0, won = 0, hitStop = 0, drumT = 0, hintT = 0;
  let s = "menu", st = 0, yaw = 0, pitch = 0.38, locked = 0, hadLock = 0, sprintK = 0, disposed = false, raf = 0;
  let combo = 0, comboT = 0, bestCombo = 0, waveTotal = 1, fovK = 0, radT = 0, dnN = 0;
  const dist = 11, learn = { move: 0, atk: 0, stone: 0, leap: 0, slam: 0 };
  const setS = (x) => { s = x; root.dataset.phase = x; cb.phase(x); };
  root.dataset.phase = "menu"; root.dataset.wave = "0";

  function unit(t, x, z, pl) {
    const c = CF[t];
    const o = t === "rak" ? { skin: [0x6b2a3a, 0x4b3a70, 0x7a4a2a][R() * 3 | 0], cloth: 0x2a1a1a, eye: 0xff3a1a, head: 0x555a60, metal: 0.3, armor: 0x363b44 }
      : t === "gnt" ? { skin: 0x56673f, cloth: 0x3a2a1a, eye: 0xffa800, head: 0x4a3322, mace: 0.5, wood: 0x3a2616, armor: 0x7a5a22, spikes: 1 }
        : { skin: pl ? 0xe3a132 : [0xc8832e, 0xa86a28, 0x9a6a3a][R() * 3 | 0], cloth: pl ? 0xd23b2a : 0xe07a2a, eye: 0x111111, monkey: 1, head: 0xe8b04a, metal: 0.8, crown: pl, cape: pl };
    const m = mk(o), r3 = new THREE.Group(); m.scale.setScalar(c.s); r3.add(m); r3.position.set(x, 0, z); scene.add(r3);
    const hp = pl ? 130 : c.hp;
    const u = Object.assign({ t, root: r3, m, hp, max: hp, ally: t === "mon", pl, kx: 0, kz: 0, vx: 0, vz: 0, vy: 0, ph: R() * 6, atk: 0, ad: pl ? 0.5 : 0.6, cd: R(), flash: 0, dead: 0, dt: 0, ry: pl ? Math.PI : 0, hit: 0, idx: A.length, grounded: 1, jumps: 0, L: m.userData.L, Ar: m.userData.Ar, sk: m.userData.sk, cape: m.userData.cape, sg: 0, cdK: 0, cdS: 0, fl: 0 }, c);
    if (pl) { const rg = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.06, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffc040 })); rg.rotation.x = Math.PI / 2; rg.position.y = 0.05; r3.add(rg); }
    else { const b = mkbar(r3, u.ally ? 0x58d46c : 0xe0443a, c.s); u.bar = b[1]; u.barBg = b[0]; }
    U.push(u); (u.ally ? A : E).push(u); return u;
  }

  /* effects */
  const PG = new THREE.BoxGeometry(0.2, 0.2, 0.2), parts = [];
  for (let i = 0; i < 180; i++) { const m = new THREE.Mesh(PG, new THREE.MeshBasicMaterial({ color: 0xffaa33 })); m.visible = false; scene.add(m); parts.push({ m, v: new V3(), l: 0 }); }
  let pi = 0;
  const burst = (x, y, z, col, n = 10, sp = 6) => { for (let i = 0; i < n; i++) { const p = parts[pi++ % 180]; p.m.position.set(x, y, z); p.m.material.color.setHex(col); p.v.set((R() - 0.5) * sp, R() * sp * 0.9 + 1, (R() - 0.5) * sp); p.l = 0.7; p.m.visible = true; } };
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 56), new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring); let ringT = 9, ringR = 10;
  const stG = new THREE.DodecahedronGeometry(0.32), stM = new THREE.MeshStandardMaterial({ color: 0x8a8078, flatShading: true }), stones = [];
  const near = (u, list, md = 1e9) => { let b = null, bd = md; const p = u.root.position; for (const o of list) { if (o.dead) continue; const p2 = o.root.position, d = Math.hypot(p2.x - p.x, p2.z - p.z); if (d < bd) { bd = d; b = o; } } return [b, bd]; };

  /* extra effects: smoke puffs, swing arc, shock dome, scorch decals, impact light, floating damage, radar */
  const pfT = ctex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, "rgba(236,196,146,.8)"); g.addColorStop(1, "rgba(160,110,70,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  const puffs = []; for (let i = 0; i < 56; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pfT, transparent: true, depthWrite: false, opacity: 0 })); sp.visible = false; scene.add(sp); puffs.push({ sp, v: new V3(), l: 0, m: 1, s: 1 }); } let pfi = 0;
  function puff(x, y, z, size = 2, n = 3, sp = 3) { for (let i = 0; i < n; i++) { const p = puffs[pfi++ % 56]; p.sp.position.set(x + (R() - 0.5) * size * 0.6, y, z + (R() - 0.5) * size * 0.6); p.v.set((R() - 0.5) * sp, R() * sp * 0.35 + 0.3, (R() - 0.5) * sp); p.l = p.m = 0.8 + R() * 0.5; p.s = size * (0.7 + R() * 0.6); p.sp.visible = true; } }
  const swMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const swM = new THREE.Mesh(new THREE.RingGeometry(2.6, 5.7, 44, 1, -1.2, 2.4), swMat); swM.rotation.x = -Math.PI / 2; const swG = new THREE.Group(); swG.add(swM); swG.visible = false; scene.add(swG); let swT = 0;
  const domeM = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 12, 0, TAU, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })); domeM.visible = false; scene.add(domeM);
  const decals = []; for (let i = 0; i < 6; i++) { const m = mkDecal(0); m.visible = false; decals.push({ m, l: 0 }); } let dci = 0;
  function scorch(x, z, r) { const d = decals[dci++ % 6]; d.m.position.set(x, 0.07, z); d.m.scale.setScalar(r * 2.3); d.m.rotation.y = R() * 6; d.m.material.opacity = 1; d.m.visible = true; d.l = 8; }
  const flL = new THREE.PointLight(0xffb060, 0, 32, NEW_LIGHTS ? 2 : 1); scene.add(flL); let flI = 0;
  const flash = (x, y, z, i) => { flL.position.set(x, y, z); flI = Math.max(flI, i); };
  const pv = new V3();
  function dmgNum(x, y, z, val, kind) { if (!hud.dn || dnN > 14) return; pv.set(x, y, z).project(cam); if (pv.z > 1) return; const e = document.createElement("div"); e.className = "alk-dn" + (kind ? " " + kind : ""); e.textContent = Math.round(val); e.style.left = ((pv.x * 0.5 + 0.5) * rw + (R() - 0.5) * 34) + "px"; e.style.top = ((-pv.y * 0.5 + 0.5) * rh) + "px"; hud.dn.appendChild(e); dnN++; setTimeout(() => { e.remove(); dnN--; }, 950); }
  const rx = hud.rad && hud.rad.getContext("2d");
  function radar() {
    if (!rx) return; const W = hud.rad.width, c = W / 2, sc = (c - 8) / 42, pp = P.root.position, sn = Math.sin(yaw), cs = Math.cos(yaw);
    rx.clearRect(0, 0, W, W); rx.fillStyle = "rgba(20,8,4,.55)"; rx.beginPath(); rx.arc(c, c, c, 0, TAU); rx.fill();
    rx.strokeStyle = "rgba(242,184,75,.22)"; rx.lineWidth = 1.5; for (const r of [0.33, 0.66, 1]) { rx.beginPath(); rx.arc(c, c, (c - 3) * r, 0, TAU); rx.stroke(); } rx.beginPath(); rx.moveTo(c, 4); rx.lineTo(c, W - 4); rx.moveTo(4, c); rx.lineTo(W - 4, c); rx.stroke();
    rx.save(); rx.translate(c, c); rx.rotate(T * 1.7); rx.fillStyle = "rgba(255,196,80,.14)"; rx.beginPath(); rx.moveTo(0, 0); rx.arc(0, 0, c - 3, -0.7, 0); rx.closePath(); rx.fill(); rx.restore();
    for (const u of U) { if (u.dead || u === P) continue; const dx = u.root.position.x - pp.x, dz = u.root.position.z - pp.z; let sx = (dx * cs - dz * sn) * sc, sy = (-dx * sn - dz * cs) * sc; const l = Math.hypot(sx, sy), edge = l > c - 8; if (edge) { sx *= (c - 8) / l; sy *= (c - 8) / l; }
      rx.globalAlpha = edge ? 0.5 : 1; rx.fillStyle = u.ally ? "#7be08a" : u.t === "gnt" ? "#ff7a2a" : "#ff4a3a"; rx.beginPath(); rx.arc(c + sx, c - sy, u.t === "gnt" ? 5.2 : u.ally ? 3 : 3.6, 0, TAU); rx.fill(); }
    rx.globalAlpha = 1; rx.fillStyle = "#ffd36a"; rx.beginPath(); rx.moveTo(c, c - 9); rx.lineTo(c + 6.5, c + 7); rx.lineTo(c, c + 3.5); rx.lineTo(c - 6.5, c + 7); rx.closePath(); rx.fill();
  }
  function updCombo() { if (!hud.cmb) return; if (combo >= 2) { hud.cmbn.textContent = "×" + combo; hud.cmb.style.opacity = 1; hud.cmb.classList.remove("pop"); void hud.cmb.offsetWidth; hud.cmb.classList.add("pop"); } else hud.cmb.style.opacity = 0; }

  function banner(t, sub) { hud.bt.textContent = t; hud.bs.textContent = sub || ""; hud.ban.style.opacity = 1; clearTimeout(banner.t); banner.t = setTimeout(() => { hud.ban.style.opacity = 0; }, 2800); }
  function hurt(u, d, src, kb = 5) {
    if (u.dead) return; u.hp -= d; u.flash = 0.12; const p = u.root.position; burst(p.x, 1.6 * u.s, p.z, u.ally || u.pl ? 0xffcc66 : 0xff5533, 8);
    if (src) { const dx = p.x - src.x, dz = p.z - src.z, l = Math.hypot(dx, dz) || 1, k = kb / (u.t === "gnt" ? 3 : 1); u.kx += dx / l * k; u.kz += dz / l * k; }
    if (u.pl) { shake = Math.max(shake, 0.5); hud.vig.style.opacity = 0.9; lastHit = T; snd.play("hurt"); } else snd.play(d > 35 ? "heavy" : "hit");
    if (u.bar) u.bar.scale.x = Math.max(0.001, u.hp / u.max * 1.6 * u.s);
    if (!u.ally) { dmgNum(p.x, p.y + 3.2 * u.s, p.z, d, u.pl ? "pl" : d >= 40 ? "big" : ""); flash(p.x, 2, p.z, u.pl ? 0.6 : Math.min(1, d / 40)); }
    if (u.hp <= 0) die(u);
  }
  function die(u) {
    u.dead = 1; u.dt = 0; const p = u.root.position; burst(p.x, 1.5, p.z, 0xffe080, 22, 10); snd.play(u.t === "gnt" ? "roar" : "die"); if (u.t === "gnt") shake = Math.max(shake, 0.8);
    if (!u.ally && !u.pl) { kills++; combo++; comboT = 3.2; if (combo > bestCombo) bestCombo = combo; updCombo(); puff(p.x, 0.6, p.z, 2.4 * u.s, 3, 3); } if (u.bar) { u.bar.visible = false; u.barBg.visible = false; } if (u.pl) finish(0);
  }
  function jump() { const p = P; if (p.grounded) { p.vy = 11; p.grounded = 0; p.jumps = 1; p.fl = 0; snd.play("jump"); puff(p.root.position.x, 0.2, p.root.position.z, 2, 3, 3); } else if (p.jumps === 1) { p.vy = 19; p.jumps = 2; p.fl = 0; learn.leap = 1; snd.play("leap"); const o = p.root.position; burst(o.x, o.y, o.z, 0xffe0a0, 16, 8); puff(o.x, o.y, o.z, 2.4, 4, 4); fovK = 5; } }
  function attack() { if (P.atk > 0 || P.dead) return; P.atk = P.ad; P.hit = 0; learn.atk = 1; snd.play("swing"); const [t] = near(P, E, 14); if (t) { const a = t.root.position, b = P.root.position; P.ry = Math.atan2(a.x - b.x, a.z - b.z); } P.kx += Math.sin(P.ry) * 6; P.kz += Math.cos(P.ry) * 6; swT = 0.3; swG.visible = true; }
  function stone() {
    if (P.cdK > 0 || P.dead) return; P.cdK = 0.7; learn.stone = 1; const p = P.root.position, [t] = near(P, E, 45), d = new V3(-Math.sin(yaw), 0, -Math.cos(yaw));
    if (t) { const o = t.root.position; d.set(o.x - p.x, 0, o.z - p.z).normalize(); }
    P.ry = Math.atan2(d.x, d.z); const m = new THREE.Mesh(stG, stM); m.castShadow = true; m.position.set(p.x + d.x, p.y + 3, p.z + d.z); scene.add(m); stones.push({ m, v: new V3(d.x * 34, 2.5, d.z * 34), l: 2 }); P.atk = 0.3; P.ad = 0.3; snd.play("throw");
  }
  function slam(free) {
    if (!free && (P.cdS > 0 || P.dead)) return; if (!free) { P.cdS = 6; learn.slam = 1; } const p = P.root.position, r = free ? 9 : 14; ring.position.set(p.x, 0.2, p.z); ring.visible = true; ringT = 0; ringR = r;
    for (const e of E) if (!e.dead && Math.hypot(e.root.position.x - p.x, e.root.position.z - p.z) < r + e.r) hurt(e, free ? 32 : 55, p, 16);
    burst(p.x, 0.3, p.z, 0xd8b070, 40, 16); shake = free ? 0.9 : 1.3; snd.play("slam"); scorch(p.x, p.z, r * 0.55); puff(p.x, 0.4, p.z, free ? 4 : 6, free ? 8 : 14, free ? 10 : 16); flash(p.x, 2.5, p.z, 1.6); fovK = free ? 5 : 9; domeM.position.set(p.x, 0, p.z); domeM.visible = true;
  }
  function nextWave() {
    wave++; const r = 8 + wave * 3, g = wave * 2 - 1; queue = []; for (let i = 0; i < r; i++) queue.push("rak"); for (let i = 0; i < g; i++) queue.push("gnt"); queue.sort(() => R() - 0.5); qt = 1.5; clearT = 0; waveTotal = Math.max(1, queue.length); root.dataset.wave = String(wave);
    let n = 0; for (const a of A) if (!a.dead) n++; for (; n < 8; n++) { const p = P.root.position, a = R() * TAU; unit("mon", p.x + Math.cos(a) * 7, Math.min(46, p.z + Math.abs(Math.sin(a)) * 7)); }
    for (const a of A) if (!a.dead && a.hp < a.max) { a.hp = a.max; a.bar.scale.x = 1.6 * a.s; }
    P.hp = Math.min(P.max, P.hp + 35); snd.play("horn"); setTimeout(() => snd.play("conch"), 700);
    banner("Wave " + rom(wave), wave === 1 ? "Rakshasa warriors pour from the gates" : wave === 2 ? "Giants march with the Rakshasas" : "Lanka throws every warrior it has");
  }
  function reset() {
    for (const u of U) scene.remove(u.root); for (const x of stones) scene.remove(x.m); U = []; E = []; A = []; stones.length = 0; kills = 0; wave = 0; queue = []; won = 0; T = 0; shake = 0; clearT = 0; combo = 0; bestCombo = 0; comboT = 0; root.dataset.wave = "0"; if (hud.cmb) hud.cmb.style.opacity = 0;
    P = unit("mon", 0, 28, 1); for (let i = 0; i < 8; i++) unit("mon", Math.cos(i) * 6, 30 + Math.abs(Math.sin(i)) * 4); yaw = 0; pitch = 0.38; Object.keys(learn).forEach((k) => { learn[k] = 0; });
  }
  function finish(v) {
    if (v) { won = 1; snd.play("win"); } else snd.play("lose");
    setS(v ? "win" : "lose"); cb.end({ win: !!v, kills, wave, combo: bestCombo, time: Math.round(T) }); if (document.exitPointerLock) document.exitPointerLock();
  }

  /* input */
  const keys = {}, joy = { x: 0, y: 0 };
  const lock = () => { try { const r = cv.requestPointerLock && cv.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { /* */ } };
  const pause = () => { if (s !== "play") return; setS("pause"); if (document.exitPointerLock) document.exitPointerLock(); };
  const onKD = (e) => {
    keys[e.code] = 1; if (["Space", "ArrowUp", "ArrowDown"].includes(e.code) && s !== "menu") e.preventDefault();
    if (s !== "play") return; if (e.code === "Space" && !e.repeat) jump(); if (e.code === "KeyJ" && !e.repeat) attack(); if (e.code === "KeyK") stone(); if (e.code === "KeyF" && !e.repeat) slam(); if (e.code === "Escape") pause();
  };
  const onKU = (e) => { keys[e.code] = 0; };
  const onLock = () => { locked = document.pointerLockElement === cv; if (locked) hadLock = 1; else if (s === "play" && hadLock) pause(); };
  const onMM = (e) => { if (locked && s !== "menu") { yaw -= e.movementX * 0.0027; pitch = cp(pitch + e.movementY * 0.0022, 0.12, 1.25); } };
  const onMD = (e) => { if (s !== "play") return; if (!locked) lock(); e.button === 2 ? stone() : attack(); };
  const noCtx = (e) => e.preventDefault();
  window.addEventListener("keydown", onKD); window.addEventListener("keyup", onKU); document.addEventListener("pointerlockchange", onLock); window.addEventListener("mousemove", onMM); cv.addEventListener("mousedown", onMD); cv.addEventListener("contextmenu", noCtx);
  const stk = q("stk"), kn = q("knob"), look = q("look"); const tcl = [];
  if (stk) {
    let sid = null, lid = null, lx = 0, ly = 0;
    const mv = (e) => { const r = stk.getBoundingClientRect(); let x = (e.clientX - r.left - 65) / 45, y = (e.clientY - r.top - 65) / 45; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } joy.x = x; joy.y = y; kn.style.transform = `translate(${x * 40}px,${y * 40}px)`; };
    const on = (el, ev, f) => { el.addEventListener(ev, f); tcl.push(() => el.removeEventListener(ev, f)); };
    on(stk, "pointerdown", (e) => { sid = e.pointerId; stk.setPointerCapture(sid); mv(e); }); on(stk, "pointermove", (e) => { if (e.pointerId === sid) mv(e); });
    const up = () => { sid = null; joy.x = joy.y = 0; kn.style.transform = ""; }; on(stk, "pointerup", up); on(stk, "pointercancel", up);
    on(look, "pointerdown", (e) => { lid = e.pointerId; look.setPointerCapture(lid); lx = e.clientX; ly = e.clientY; });
    on(look, "pointermove", (e) => { if (e.pointerId !== lid) return; yaw -= (e.clientX - lx) * 0.006; pitch = cp(pitch + (e.clientY - ly) * 0.004, 0.12, 1.25); lx = e.clientX; ly = e.clientY; }); on(look, "pointerup", () => { lid = null; });
    [["bA", attack], ["bS", stone], ["bJ", jump], ["bF", () => slam()]].forEach(([n, f]) => on(q(n), "pointerdown", (e) => { e.preventDefault(); if (s === "play") f(); }));
  }

  /* animation + AI */
  function anim(u, sp, dt) {
    u.ph += dt * (sp * 1.1 + 2); const k = cp(sp / 6, 0, 1), sn = Math.sin(u.ph), air = !u.grounded;
    u.L[0].rotation.x = air ? -0.6 : sn * 0.9 * k; u.L[1].rotation.x = air ? 0.5 : -sn * 0.9 * k; u.Ar[0].rotation.x = air ? -2.4 : -sn * 0.8 * k;
    let r = -1.1 + Math.sin(u.ph * 0.5) * 0.05 - k * 0.2; if (u.atk > 0) { const qq = 1 - u.atk / u.ad; r = lerp(-2.9, -0.2, 1 - (1 - qq) * (1 - qq)); } u.Ar[1].rotation.x = r;
    let th = 0; if (u.pl && u.jumps === 2) { u.fl += dt * 3.4; th = -Math.min(u.fl, 1) * TAU; } u.m.rotation.x = th; if (u.cape) u.cape.rotation.x = 0.1 + k * 0.7 + Math.sin(u.ph * 1.3) * 0.08 + (air ? 0.5 : 0); const c = 1.0 * u.s; u.m.position.set(0, c * (1 - Math.cos(th)) + Math.abs(sn) * 0.1 * k, -c * Math.sin(th));
  }
  const flashM = (u, dt) => { u.flash -= dt; u.sk.emissive.setHex(u.flash > 0 ? 0xaa2200 : 0); };
  function stepUnit(u, dt) {
    const pos = u.root.position; flashM(u, dt);
    if (u.dead) { u.dt += dt; u.m.rotation.x = -Math.min(u.dt * 4, 1.5); if (u.dt > 2) pos.y -= dt * 1.5; if (u.dt > 4) { scene.remove(u.root); u.rm = 1; } return; }
    const [t, d] = u.ally ? near(u, E) : near(u, [P, ...A]); let mx = 0, mz = 0, sp = 0;
    if (u.ally && !t) { const pp = P.root.position, a = u.idx * 1.1, rr = 4 + u.idx % 3, dx = pp.x + Math.cos(a) * rr - pos.x, dz = pp.z + Math.sin(a) * rr - pos.z, dd = Math.hypot(dx, dz); if (dd > 1.5) { mx = dx / dd; mz = dz / dd; sp = dd > 12 ? u.sp * 1.7 : u.sp * 0.8; } u.ry += ang(u.ry, Math.atan2(mx, mz)) * cp(dt * 8, 0, 1); }
    else if (t) {
      const tp = t.root.position, dx = tp.x - pos.x, dz = tp.z - pos.z, reach = u.rg + t.r * 0.5; if (d > reach * 0.8) { mx = dx / d; mz = dz / d; sp = u.sp; }
      u.ry += ang(u.ry, Math.atan2(dx, dz)) * cp(dt * 8, 0, 1); u.cd -= dt; if (d < reach && u.cd <= 0 && u.atk <= 0) { u.atk = 0.6; u.hit = 0; u.cd = u.ally ? 0.9 : 1.4 + R() * 0.5; }
      if (u.atk > 0 && u.atk < 0.3 && !u.hit) { u.hit = 1; if (d < u.rg + t.r + 1.2) { hurt(t, u.dmg, pos, u.t === "gnt" ? 9 : 3); if (u.t === "gnt" && t.pl) shake = Math.max(shake, 0.9); } }
    }
    if (u.atk > 0) u.atk -= dt;
    pos.x += (mx * sp + u.kx) * dt; pos.z += (mz * sp + u.kz) * dt; const kd = Math.exp(-dt * 6); u.kx *= kd; u.kz *= kd;
    if (u.t === "gnt" && sp > 0.5) { const sg = Math.sin(u.ph) > 0 ? 1 : 0; if (sg !== u.sg) { u.sg = sg; const pd = Math.hypot(pos.x - P.root.position.x, pos.z - P.root.position.z); puff(pos.x, 0.2, pos.z, 3.4, 3, 3); if (pd < 32) shake = Math.max(shake, 0.28 * (1 - pd / 32)); } }
    pos.y = u.ally && sp > 0 ? Math.abs(Math.sin(u.ph * 0.6)) * (sp > 9 ? 1.5 : 0.3) : 0; u.root.rotation.y = u.ry; anim(u, sp, dt);
  }
  function stepPlayer(dt) {
    const p = P, pos = p.root.position; flashM(p, dt); if (p.dead) return;
    yaw += ((keys.KeyQ ? 1 : 0) - (keys.KeyE ? 1 : 0)) * dt * 2;
    const mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x, mz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + joy.y;
    const sn = Math.sin(yaw), cs = Math.cos(yaw); let wx = cs * mx + sn * mz, wz = -sn * mx + cs * mz; const l = Math.hypot(wx, wz); if (l > 1) { wx /= l; wz /= l; }
    const run = (keys.ShiftLeft || keys.ShiftRight) && l > 0.1, spT = l > 0.05 ? (run ? 14 : 9) * Math.min(1, l) : 0; sprintK = lerp(sprintK, run ? 1 : 0, dt * 6);
    p.vx = lerp(p.vx, l > 0.05 ? wx / Math.max(l, 1) * spT : 0, Math.min(1, dt * 10)); p.vz = lerp(p.vz, l > 0.05 ? wz / Math.max(l, 1) * spT : 0, Math.min(1, dt * 10));
    pos.x += (p.vx + p.kx) * dt; pos.z += (p.vz + p.kz) * dt; const kd = Math.exp(-dt * 7); p.kx *= kd; p.kz *= kd;
    const sp = Math.hypot(p.vx, p.vz); if (sp > 1) learn.move = 1; if (sp > 0.5 && p.atk <= 0) p.ry += ang(p.ry, Math.atan2(p.vx, p.vz)) * cp(dt * 12, 0, 1);
    if (p.grounded && sp > 7 && R() < dt * (sp > 11 ? 14 : 7)) puff(pos.x, 0.2, pos.z, 1.5, 1, 1.5);
    p.vy -= 30 * dt; pos.y += p.vy * dt; if (pos.y <= 0) { if (!p.grounded) { if (p.vy < -16) slam(1); else { snd.play("land"); puff(pos.x, 0.2, pos.z, 2.6, 4, 4); } } pos.y = 0; p.vy = 0; p.grounded = 1; p.jumps = 0; p.fl = 0; }
    if (p.atk > 0) {
      p.atk -= dt; const k = 1 - p.atk / p.ad;
      if (p.ad === 0.5 && k > 0.4 && !p.hit) { p.hit = 1; let n = 0; for (const e of E) { if (e.dead) continue; const dx = e.root.position.x - pos.x, dz = e.root.position.z - pos.z, d = Math.hypot(dx, dz); if (d < 5.4 + e.r && Math.abs(ang(p.ry, Math.atan2(dx, dz))) < 1.4) { hurt(e, 40, pos, 10); n++; } } if (n) { shake = Math.max(shake, 0.45); hitStop = 0.05; burst(pos.x + Math.sin(p.ry) * 2.5, 2, pos.z + Math.cos(p.ry) * 2.5, 0xffe080, 10, 8); } }
      if (p.atk <= 0) p.ad = 0.5;
    }
    p.cdK -= dt; p.cdS -= dt; if (T - lastHit > 5) p.hp = Math.min(p.max, p.hp + dt * 4);
    p.root.rotation.y = p.ry; anim(p, sp, dt);
  }
  function camStep(dt) {
    const pp = P.root.position, d = dist + sprintK * 1.5, cy = Math.cos(pitch);
    const des = new V3(pp.x + Math.sin(yaw) * cy * d, pp.y + 3.2 + Math.sin(pitch) * d, pp.z + Math.cos(yaw) * cy * d), lk = new V3(pp.x, pp.y + 3, pp.z);
    if (s === "intro") { const e = cp(st / 5.5, 0, 1), k = e * e * (3 - 2 * e); cam.position.lerpVectors(new V3(70, 34, 95), des, k); cam.position.y += Math.sin(k * Math.PI) * 8; lk.lerpVectors(new V3(0, 14, -80), lk, k); }
    else cam.position.lerp(des, 1 - Math.exp(-dt * 9));
    if (s === "win" || s === "lose") yaw += dt * 0.25;
    if (cam.position.y < 1.2) cam.position.y = 1.2; shake *= Math.exp(-dt * 6); cam.position.x += (R() - 0.5) * shake; cam.position.y += (R() - 0.5) * shake;
    cam.lookAt(lk); fovK *= Math.exp(-dt * 5); cam.fov = lerp(cam.fov, 60 + sprintK * 9 + fovK, dt * 8); cam.updateProjectionMatrix();
  }
  const HINTS = [["move", "Move with W A S D (Shift to sprint)"], ["atk", "Left-click or press J to swing your gada"], ["stone", "Right-click or press K to hurl a stone"], ["leap", "Press Space twice for a high leap, land hard for a free shockwave"], ["slam", "Press F for the ground slam"]];
  let last = performance.now();
  function loop(now) {
    if (disposed) return; raf = requestAnimationFrame(loop); let dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (hitStop > 0) { hitStop -= dt; dt *= 0.1; } T += dt;
    if (((raf | 0) & 31) === 0) resize();
    skyG.position.copy(cam.position); clouds.forEach((c, i) => { c.position.x += dt * (1 + (i % 3)) * 0.9; if (c.position.x > 380) c.position.x = -380; });
    gateL.intensity = (NEW_LIGHTS ? 160 : 2.6) * (1 + Math.sin(T * 9) * 0.12 + Math.sin(T * 23) * 0.06); gateM.material.opacity = 0.9 + Math.sin(T * 7) * 0.06;
    torches.forEach((t, i) => { t.intensity = (NEW_LIGHTS ? 90 : 2.2) * (1 + Math.sin(T * 18 + t.position.x) * 0.2); flames[i].scale.y = 1 + Math.sin(T * 20 + i) * 0.25; });
    flags.forEach((f, i) => { f.rotation.y = Math.sin(T * 3 + i) * 0.35; });
    const ea = eg.attributes.position; for (let i = 0; i < EN; i++) { ea.array[i * 3 + 1] += dt * (1.5 + (i % 5) * 0.4); ea.array[i * 3] += Math.sin(T + i) * dt * 0.8; if (ea.array[i * 3 + 1] > 32) ea.array[i * 3 + 1] = 0; } ea.needsUpdate = true;
    if (s === "menu") { cam.position.set(Math.sin(T * 0.12) * 42, 13, Math.cos(T * 0.12) * 42 + 10); cam.lookAt(0, 10, -60); renderer.render(scene, cam); return; }
    if (s === "intro") { st += dt; if (st > 5.5) { setS("play"); nextWave(); } }
    if (s === "play" || s === "intro" || s === "win" || s === "lose") {
      if (s === "play") {
        stepPlayer(dt); const foes = E.filter((e) => !e.dead).length + queue.length;
        drumT -= dt; if (drumT <= 0) { drumT = 0.62 - 0.25 * Math.min(1, foes / 20); snd.play("drum", 0.28 + 0.2 * Math.min(1, foes / 20)); }
        if (queue.length && (qt -= dt) <= 0) { const t = queue.pop(), sx = (R() - 0.5) * 50, sz = -66 - R() * 8; unit(t, sx, sz); puff(sx, 0.4, sz, t === "gnt" ? 5 : 3, 3, 3); qt = 0.45; }
        else if (!queue.length && !E.some((e) => !e.dead) && !clearT) { clearT = 3.2; if (wave >= 3 && !won) { banner("Victory!", "Lanka’s first assault is broken"); setTimeout(() => { if (s === "play") finish(1); }, 1800); } else banner("Wave cleared", "Regroup, the next wave approaches"); }
        if (clearT > 0 && (clearT -= dt) <= 0 && (wave < 3 || won)) nextWave();
        hintT -= dt; if (hintT <= 0) { hintT = 0.4; const h = HINTS.find((x) => !learn[x[0]]); hud.hint.textContent = h ? h[1] : "Stay close to your companions · Shift to sprint · Q / E turn the camera"; }
      }
      for (const u of U) if (u !== P) stepUnit(u, dt); else if (s !== "play") { flashM(u, dt); anim(u, 0, dt); }
      for (let i = 0; i < U.length; i++) { const a = U[i]; if (a.dead) continue; for (let j = i + 1; j < U.length; j++) { const b = U[j]; if (b.dead) continue; const dx = b.root.position.x - a.root.position.x, dz = b.root.position.z - a.root.position.z, d = Math.hypot(dx, dz), m = a.r + b.r; if (d < m && d > 0.001) { const k = (m - d) / d * 0.5; a.root.position.x -= dx * k; a.root.position.z -= dz * k; b.root.position.x += dx * k; b.root.position.z += dz * k; } } }
      for (const u of U) { const p = u.root.position; p.x = cp(p.x, -75, 75); p.z = cp(p.z, -80, 48); }
      U = U.filter((u) => !u.rm); E = E.filter((u) => !u.rm); A = A.filter((u) => !u.rm);
      for (let i = stones.length - 1; i >= 0; i--) {
        const sn = stones[i]; sn.l -= dt; sn.v.y -= 9 * dt; sn.m.position.addScaledVector(sn.v, dt); sn.m.rotation.x += dt * 12; burst(sn.m.position.x, sn.m.position.y, sn.m.position.z, 0xffd080, 1, 1.2); let hit = sn.m.position.y < 0.3 || sn.l <= 0;
        for (const e of E) { if (e.dead) continue; const p = e.root.position; if (Math.hypot(p.x - sn.m.position.x, p.z - sn.m.position.z) < e.r + 0.5 && sn.m.position.y < 4.2 * e.s) { hurt(e, 42, sn.m.position, 7); snd.play("stoneHit"); hit = 1; break; } }
        if (hit) { burst(sn.m.position.x, sn.m.position.y, sn.m.position.z, 0xb0a090, 8, 6); scene.remove(sn.m); stones.splice(i, 1); }
      }
      for (const p of parts) { if (p.l <= 0) continue; p.l -= dt; p.v.y -= 16 * dt; p.m.position.addScaledVector(p.v, dt); p.m.scale.setScalar(Math.max(p.l / 0.7, 0)); if (p.l <= 0) p.m.visible = false; }
      for (const p of puffs) { if (p.l <= 0) continue; p.l -= dt; const k = 1 - p.l / p.m; p.sp.position.addScaledVector(p.v, dt); p.v.multiplyScalar(Math.max(0, 1 - dt * 2.2)); p.sp.scale.setScalar(p.s * (0.6 + k * 1.7)); p.sp.material.opacity = (1 - k) * 0.65; if (p.l <= 0) p.sp.visible = false; }
      for (const d of decals) { if (d.l <= 0) continue; d.l -= dt; d.m.material.opacity = Math.min(1, d.l / 3); if (d.l <= 0) d.m.visible = false; }
      flI *= Math.exp(-dt * 9); flL.intensity = flI * (NEW_LIGHTS ? 130 : 2.6);
      if (swT > 0) { swT -= dt; const k = 1 - Math.max(swT, 0) / 0.3, pp = P.root.position; swG.position.set(pp.x, pp.y + 1.5, pp.z); swG.rotation.y = P.ry - Math.PI / 2 + lerp(0.9, -0.9, k); swMat.opacity = 0.8 * Math.sin(Math.min(1, k) * Math.PI); if (swT <= 0) swG.visible = false; }
      if (domeM.visible) { const k = ringT / 0.6; domeM.scale.setScalar(Math.max(0.1, ringR * k * 0.75)); domeM.material.opacity = 0.5 * (1 - k); if (k >= 1) domeM.visible = false; }
      if (combo > 0 && s === "play" && (comboT -= dt) <= 0) { combo = 0; updCombo(); }
      if (hud.k0) hud.k0.style.setProperty("--cd", cp(P.atk / P.ad, 0, 1));
      hud.k1.classList.toggle("rdy", P.cdK <= 0); hud.k2.classList.toggle("rdy", P.cdS <= 0);
      if (hud.wvp) hud.wvp.style.width = (100 - 100 * (E.filter((e) => !e.dead).length + queue.length) / waveTotal) + "%";
      root.classList.toggle("alk-low", P.hp / P.max < 0.3 && s === "play"); if ((radT -= dt) <= 0) { radT = 0.04; radar(); }
      if (ringT < 0.6) { ringT += dt; const k = ringT / 0.6; ring.scale.setScalar(ringR * k); ring.material.opacity = 1 - k; if (ringT >= 0.6) ring.visible = false; }
      sun.position.set(P.root.position.x + 30, 50, P.root.position.z + 40); sun.target.position.copy(P.root.position);
      const pct = Math.max(0, P.hp / P.max * 100); hud.hp.style.width = pct + "%"; hud.hpt.textContent = Math.ceil(Math.max(0, P.hp));
      hud.k1.style.setProperty("--cd", cp(P.cdK / 0.7, 0, 1)); hud.k2.style.setProperty("--cd", cp(P.cdS / 6, 0, 1));
      hud.vig.style.opacity = Math.max(+hud.vig.style.opacity - dt * 2, P.hp / P.max < 0.3 && s === "play" ? 0.35 + Math.sin(T * 6) * 0.1 : 0);
      hud.wvt.textContent = "Wave " + rom(wave); hud.wvs.textContent = `Foes ${E.filter((e) => !e.dead).length + queue.length} · Allies ${A.filter((a) => !a.dead).length} · Slain ${kills}`;
    }
    if (s === "pause") { renderer.render(scene, cam); return; }
    camStep(dt); renderer.render(scene, cam);
  }
  reset(); raf = requestAnimationFrame(loop);

  return {
    start() { snd.init(); snd.startBed(); reset(); lock(); st = 0; setS("intro"); banner("The First Clash", "The gates of Lanka open"); snd.play("conch"); },
    resume() { setS("play"); lock(); },
    pause,
    restart() { reset(); st = 0; setS("intro"); banner("The First Clash", "Try again"); lock(); },
    keepFighting() { setS("play"); lock(); nextWave(); },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); clearTimeout(banner.t); rzOn.forEach(([e, t]) => t.removeEventListener(e, resize)); if (window.visualViewport) window.visualViewport.removeEventListener("resize", resize); if (ro) ro.disconnect(); window.removeEventListener("keydown", onKD); window.removeEventListener("keyup", onKU);
      document.removeEventListener("pointerlockchange", onLock); window.removeEventListener("mousemove", onMM); cv.removeEventListener("mousedown", onMD); cv.removeEventListener("contextmenu", noCtx); tcl.forEach((f) => f());
      if (document.exitPointerLock) document.exitPointerLock();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
      renderer.dispose(); if (cv.parentNode) cv.parentNode.removeChild(cv);
    },
  };
}