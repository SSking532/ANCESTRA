import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./HanumanAwakeningGame.css";
import "./HanumanAwakeningGame.addon.css";

const AUDIO_SRC = "/audio/hanuman.mp3"; // public/audio/hanuman.mp3

const mantraFragments = ["मनोजवं","मारुततुल्यवेगं","जितेन्द्रियं","बुद्धिमतां वरिष्ठम्","वातात्मजं","वानरयूथमुख्यं","श्रीरामदूतं","शरणं प्रपद्ये"];
const shuffledFragments = ["वातात्मजं","मनोजवं","श्रीरामदूतं","जितेन्द्रियं","वानरयूथमुख्यं","मारुततुल्यवेगं","शरणं प्रपद्ये","बुद्धिमतां वरिष्ठम्"];
const flyingCards = [
  ...mantraFragments.map((text, i) => ({ id: `correct-${i}`, text, correct: true })),
  { id: "decoy-1", text: "महाबलम्", correct: false },
  { id: "decoy-2", text: "दशाननम्", correct: false },
  { id: "decoy-3", text: "सागरम्", correct: false },
  { id: "decoy-4", text: "विजयते", correct: false },
  { id: "decoy-5", text: "धर्मात्मजम्", correct: false },
];
const cardPositions = [
  { x: "8%", y: "25%" },{ x: "28%", y: "48%" },{ x: "48%", y: "22%" },{ x: "69%", y: "43%" },
  { x: "84%", y: "19%" },{ x: "17%", y: "68%" },{ x: "42%", y: "72%" },{ x: "74%", y: "70%" },
  { x: "5%", y: "48%" },{ x: "35%", y: "15%" },{ x: "59%", y: "57%" },{ x: "91%", y: "51%" },{ x: "25%", y: "83%" },
];
const shuffle = (items) => {
  const r = [...items];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};

const RefMantra = ({ found }) => (
  <div className="hg-ref-mantra" aria-label="The sacred verse">
    {mantraFragments.map((f) => (
      <span key={f} className={found(f) ? "is-found" : ""}>{f}</span>
    ))}
  </div>
);

/* ------------------------------ 3D HELPERS ------------------------------ */
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const ease = (t) => 1 - Math.pow(1 - clamp01(t), 3);
const STD = (o) => new THREE.MeshStandardMaterial(o);

const glowTexture = () => {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

function buildHanuman(glowTex) {
  const fur = STD({ color: 0xd98c3a, roughness: 0.95, emissive: 0x2a1204 });
  const furDark = STD({ color: 0xa8602a, roughness: 1 });
  const furLight = STD({ color: 0xf0b060, roughness: 1, emissive: 0x3a1c08 });
  const skin = STD({ color: 0xb5633a, roughness: 0.7 });
  const gold = STD({ color: 0xffc94d, metalness: 1, roughness: 0.25, emissive: 0x553300 });
  const cloth = STD({ color: 0xe8601a, roughness: 0.8, side: THREE.DoubleSide });
  const ruby = STD({ color: 0xff2a3a, emissive: 0xaa0010, roughness: 0.2 });
  const white = STD({ color: 0xfff6dd, emissive: 0x998866 });
  const pupil = STD({ color: 0x1a0805, emissive: 0xff7a1a, emissiveIntensity: 0 });
  const sph = (r) => new THREE.SphereGeometry(r, 24, 18);
  const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const tuftGeo = new THREE.ConeGeometry(0.06, 0.32, 5);
  const up = new THREE.Vector3(0, 1, 0);
  const tufts = (mat, n, cx, cy, cz, sx, sy, sz, minZ, parent) => {
    for (let i = 0; i < n; i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.35, Math.random() - 0.5).normalize();
      if (d.z < minZ) { i--; continue; }
      const m = new THREE.Mesh(tuftGeo, mat);
      m.position.set(cx + d.x * sx, cy + d.y * sy, cz + d.z * sz);
      m.quaternion.setFromUnitVectors(up, d); m.scale.setScalar(0.7 + Math.random() * 0.8);
      parent.add(m);
    }
  };

  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  // torso, chest, belly, dhoti, belt
  add(sph(1), fur, 0, 2.85, 0, body).scale.set(0.95, 0.95, 0.6);
  add(sph(0.55), skin, 0, 3.0, -0.3, body).scale.set(1.05, 0.9, 0.4);
  add(sph(0.7), fur, 0, 2.15, 0, body).scale.set(1, 0.8, 0.7);
  add(new THREE.CylinderGeometry(0.62, 0.98, 0.95, 28, 1, true), cloth, 0, 1.75, 0, body);
  const belt = add(new THREE.TorusGeometry(0.68, 0.07, 10, 32), gold, 0, 2.2, 0, body); belt.rotation.x = Math.PI / 2;
  add(new THREE.CylinderGeometry(0.2, 0.26, 0.4, 14), fur, 0, 3.8, 0, body);
  tufts(furLight, 70, 0, 2.85, 0, 0.95, 0.95, 0.6, -0.1, body); // fur tufts on back and sides
  // necklaces
  [[0.62, 3.55], [0.5, 3.35]].forEach(([r, y]) => { const n = add(new THREE.TorusGeometry(r, 0.055, 10, 40), gold, 0, y, -0.1, body); n.rotation.x = Math.PI / 2.4; });
  add(sph(0.11), ruby, 0, 3.12, -0.55, body);

  // head
  const head = new THREE.Group(); head.position.set(0, 4.35, 0); body.add(head);
  add(sph(0.5), fur, 0, 0, 0, head);
  tufts(furLight, 34, 0, 0, 0, 0.5, 0.5, 0.5, -0.05, head);
  add(sph(0.36), skin, 0, -0.05, -0.32, head).scale.set(1, 1.05, 0.7);
  add(sph(0.2), skin, 0, -0.2, -0.5, head).scale.set(1.2, 0.8, 1);
  add(new THREE.BoxGeometry(0.04, 0.14, 0.03), ruby, 0, 0.3, -0.46, head); // tilak
  [-1, 1].forEach((s) => {
    add(sph(0.075), white, s * 0.15, 0.05, -0.5, head);
    add(sph(0.04), pupil, s * 0.15, 0.05, -0.57, head);
    const b = add(new THREE.BoxGeometry(0.2, 0.04, 0.06), furDark, s * 0.15, 0.17, -0.53, head); b.rotation.z = -s * 0.25;
    add(sph(0.14), skin, s * 0.52, 0, 0, head).scale.set(0.5, 1, 1);
    add(new THREE.TorusGeometry(0.07, 0.016, 8, 16), gold, s * 0.58, -0.14, 0, head).rotation.y = Math.PI / 2; // earrings
    const t = add(new THREE.ConeGeometry(0.12, 0.3, 8), fur, s * 0.4, -0.28, -0.22, head); t.rotation.z = s * 0.5; t.rotation.x = Math.PI;
  });
  const jaw = new THREE.Group(); jaw.position.set(0, -0.28, -0.3); head.add(jaw);
  add(sph(0.2), skin, 0, -0.05, -0.12, jaw).scale.set(1, 0.5, 1);
  add(sph(0.16), STD({ color: 0x1a0805 }), 0, 0.03, -0.1, jaw).scale.set(1, 0.4, 1);
  [-1, 1].forEach((s) => add(new THREE.BoxGeometry(0.04, 0.06, 0.03), white, s * 0.07, 0.06, -0.26, jaw));
  // crown
  add(new THREE.CylinderGeometry(0.4, 0.5, 0.3, 24, 1, true), gold, 0, 0.5, 0, head).material.side = THREE.DoubleSide;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2; const h = i === 0 ? 0.5 : 0.3;
    add(new THREE.ConeGeometry(0.07, h, 8), gold, Math.sin(a) * 0.46, 0.65 + h / 2, -Math.cos(a) * 0.46, head);
    add(sph(0.045), ruby, Math.sin(a) * 0.46, 0.55, -Math.cos(a) * 0.46, head);
  }
  add(sph(0.08), ruby, 0, 0.5, -0.5, head);
  // halo + glow
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
  add(new THREE.RingGeometry(0.95, 1.08, 64), haloMat, 0, 0.2, 0.5, head);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc060, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.35, depthWrite: false, fog: false }));
  glow.scale.set(4, 4, 1); glow.position.set(0, 0.1, 0.4); head.add(glow);

  // arms
  const arms = [-1, 1].map((sgn) => {
    const sh = new THREE.Group(); sh.position.set(sgn * 1.05, 3.45, 0); body.add(sh);
    add(sph(0.3), fur, 0, 0, 0, sh);
    add(new THREE.CylinderGeometry(0.2, 0.17, 0.9, 16), fur, 0, -0.45, 0, sh);
    add(new THREE.TorusGeometry(0.2, 0.05, 8, 20), gold, 0, -0.3, 0, sh).rotation.x = Math.PI / 2;
    const el = new THREE.Group(); el.position.y = -0.9; sh.add(el);
    add(sph(0.19), fur, 0, 0, 0, el);
    add(new THREE.CylinderGeometry(0.17, 0.13, 0.85, 16), fur, 0, -0.42, 0, el);
    add(new THREE.TorusGeometry(0.15, 0.04, 8, 20), gold, 0, -0.7, 0, el).rotation.x = Math.PI / 2;
    add(sph(0.16), skin, 0, -0.92, 0, el).scale.set(1, 1.2, 0.8);
    return { sh, el, sgn };
  });
  // legs
  const legs = [-1, 1].map((sgn) => {
    const hip = new THREE.Group(); hip.position.set(sgn * 0.38, 1.9, 0); body.add(hip);
    add(new THREE.CylinderGeometry(0.28, 0.2, 0.95, 16), fur, 0, -0.47, 0, hip);
    const knee = new THREE.Group(); knee.position.y = -0.95; hip.add(knee);
    add(sph(0.2), fur, 0, 0, 0, knee);
    add(new THREE.CylinderGeometry(0.2, 0.15, 0.95, 16), fur, 0, -0.47, 0, knee);
    add(new THREE.TorusGeometry(0.16, 0.04, 8, 20), gold, 0, -0.8, 0, knee).rotation.x = Math.PI / 2;
    add(sph(0.2), skin, 0, -0.97, -0.12, knee).scale.set(1, 0.5, 1.6);
    return { hip, knee };
  });
  // tail
  const tail = new THREE.Group(); tail.position.set(0, 2.0, 0.45); body.add(tail);
  const curve = new THREE.CatmullRomCurve3([[0,0,0],[0,-0.4,0.9],[0,0.2,1.7],[0,1.4,2.0],[0,2.6,1.5],[0,3.2,0.6],[0,3.0,-0.2]].map((p) => new THREE.Vector3(...p)));
  add(new THREE.TubeGeometry(curve, 48, 0.13, 10), fur, 0, 0, 0, tail);
  add(sph(0.24), furLight, 0, 3.0, -0.2, tail);
  tufts(furLight, 14, 0, 3.0, -0.2, 0.24, 0.24, 0.24, -1, tail);

  // energy aura (grows with him)
  const aura = new THREE.Mesh(new THREE.SphereGeometry(3.4, 32, 24), new THREE.MeshBasicMaterial({ color: 0xffb050, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, fog: false }));
  aura.position.y = 2.8; root.add(aura);
  return { root, body, head, jaw, arms, legs, tail, glow, halo: haloMat, pupil, aura };
}

const POSES = {
  idle: { armOut: 0.14, armFwd: 0.05, elbow: 0.25, thigh: 0, shin: 0, plant: 1, jaw: 0, head: 0, lean: 0 },
  pray: { armOut: -0.3, armFwd: 0.75, elbow: 1.95, thigh: 0.08, shin: -0.1, plant: 1, jaw: 0, head: -0.12, lean: 0.02 },
  roar: { armOut: 2.55, armFwd: 0.1, elbow: 0.35, thigh: 0.05, shin: -0.05, plant: 1, jaw: 1, head: 0.3, lean: 0.14 },
  crouch: { armOut: 0.5, armFwd: -0.6, elbow: 0.3, thigh: 0.9, shin: -1.45, plant: 1, jaw: 0.2, head: 0.1, lean: -0.35 },
  fly: { armOut: 0.25, armFwd: 3.0, elbow: 0.15, thigh: -0.7, shin: 0.9, plant: 0, jaw: 1, head: -0.1, lean: 0 },
};

/* -------------------------------- COMPONENT -------------------------------- */
export default function HanumanAwakeningGame({ onClose }) {
  const [stage, setStage] = useState("intro");
  const [cards, setCards] = useState([]);
  const [caught, setCaught] = useState([]);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [flash, setFlash] = useState(false);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const stageRef = useRef("intro");
  const stageStart = useRef(performance.now() / 1000);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => { stageRef.current = stage; stageStart.current = performance.now() / 1000; }, [stage]);

  /* ---- audio: starts as Hanuman begins to grow, fades out when the game closes ---- */
  useEffect(() => {
    if (!audioRef.current) { audioRef.current = new Audio(AUDIO_SRC); audioRef.current.preload = "auto"; }
    const a = audioRef.current; let tm, fade;
    if (stage === "awakening") { a.pause(); a.currentTime = 0; a.volume = 1; tm = setTimeout(() => a.play().catch(() => {}), 1500); }
    else if (stage === "closed") { fade = setInterval(() => { a.volume = Math.max(0, a.volume - 0.08); if (a.volume <= 0) { a.pause(); clearInterval(fade); } }, 120); }
    else if (stage !== "complete") { a.pause(); a.currentTime = 0; }
    return () => { clearTimeout(tm); clearInterval(fade); };
  }, [stage]);
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  /* ---- the jump: show it, white flash, then the game closes ---- */
  useEffect(() => {
    if (stage !== "complete") return;
    setFlash(false);
    const t1 = setTimeout(() => setFlash(true), 5200);
    const t2 = setTimeout(() => { setFlash(false); setStage("closed"); if (onClose) onClose(); }, 6900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [stage]);

  /* ---- 3D scene ---- */
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xd9955a, 300, 2600);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 4000);
    const glowTex = glowTexture();

    // sky
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2500, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: "varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "varying vec3 p;void main(){float h=clamp(p.y,-.1,1.);vec3 c=mix(vec3(1.,.72,.38),vec3(.66,.34,.22),smoothstep(0.,.25,h));c=mix(c,vec3(.1,.07,.16),smoothstep(.2,.9,h));gl_FragColor=vec4(c,1.);}",
    }));
    scene.add(sky);
    const starPos = []; for (let i = 0; i < 500; i++) { const a = Math.random() * 6.28, e = 0.35 + Math.random() * 1.1; starPos.push(Math.cos(a) * Math.cos(e) * 2300, Math.sin(e) * 2300, Math.sin(a) * Math.cos(e) * 2300); }
    const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3)), new THREE.PointsMaterial({ size: 5, color: 0xfff1c5, fog: false, transparent: true, opacity: 0.7 }));
    scene.add(stars);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(110, 32, 16), new THREE.MeshBasicMaterial({ color: 0xfff2c4, fog: false })); sun.position.set(0, 90, -1800); scene.add(sun);
    const sprite = (color, op, sc, x, y, z, add) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op, depthWrite: false, fog: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); s.scale.set(sc, sc * (add ? 1 : 0.35), 1); s.position.set(x, y, z); scene.add(s); return s; };
    sprite(0xffb050, 0.9, 1100, 0, 90, -1790, true);
    for (let i = 0; i < 14; i++) sprite(i % 2 ? 0xffc79a : 0xb86a58, 0.3, 300 + Math.random() * 400, (Math.random() - 0.5) * 2600, 120 + Math.random() * 400, -1500 + Math.random() * 900, false);
    // god rays from the sun
    for (let i = 0; i < 7; i++) {
      const ray = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffcf8a, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      ray.scale.set(90, 1400, 1); ray.position.set((i - 3) * 160, 500, -1700); ray.material.rotation = (i - 3) * 0.16; scene.add(ray);
    }

    // lights
    const hemi = new THREE.HemisphereLight(0xffd9a0, 0x3a2016, 0.9); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffc880, 2.4); key.position.set(-30, 60, -200); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe6c0, 0.9); fill.position.set(30, 20, 60); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff9a50, 1.2); rim.position.set(40, 30, 120); scene.add(rim);

    // ocean, cliff, mountains, Lanka
    const oceanGeo = new THREE.PlaneGeometry(3000, 3000, 60, 60);
    const ocean = new THREE.Mesh(oceanGeo, STD({ color: 0x2a6a80, metalness: 0.35, roughness: 0.3, flatShading: true })); ocean.rotation.x = -Math.PI / 2; ocean.position.y = -60; scene.add(ocean);
    const rock = (c) => STD({ color: c, roughness: 1, flatShading: true });
    const cliff = new THREE.Mesh(new THREE.CylinderGeometry(60, 75, 120, 14, 3), rock(0x6b4430)); cliff.position.set(0, -60, 54); scene.add(cliff);
    for (let i = 0; i < 22; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + Math.random() * 2.2), rock(0x5a3826)); r.position.set((Math.random() - 0.5) * 50, 0.3, 4 + Math.random() * 30); scene.add(r); }
    const peak = (x, y, z, r, h, c) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), rock(c)); m.position.set(x, y + h / 2, z); scene.add(m); };
    for (let i = 0; i < 18; i++) peak((Math.random() - 0.5) * 900, -10, 160 + Math.random() * 400, 50 + Math.random() * 60, 90 + Math.random() * 130, 0x7a4a34);
    for (let i = 0; i < 14; i++) peak((Math.random() < 0.5 ? -1 : 1) * (250 + Math.random() * 500), -60, -100 - Math.random() * 1000, 60 + Math.random() * 70, 70 + Math.random() * 120, 0x6a4a3c);
    for (let i = 0; i < 9; i++) { peak((i - 4) * 55, -60, -1500 + Math.random() * 60, 50, 60 + Math.random() * 60, 0x8a6a3a); const d = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 12), STD({ color: 0xffc94d, metalness: 1, roughness: 0.3, emissive: 0x664400 })); d.position.set((i - 4) * 55, 20 + (i % 3) * 14, -1500); scene.add(d); }

    // embers
    const N = 600, ep = new Float32Array(N * 3); for (let i = 0; i < N; i++) { ep[i * 3] = (Math.random() - 0.5) * 160; ep[i * 3 + 1] = Math.random() * 90 - 10; ep[i * 3 + 2] = Math.random() * 240 - 160; }
    const embers = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(ep, 3)), new THREE.PointsMaterial({ size: 0.7, color: 0xffc060, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(embers);

    // shockwave rings
    const rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.3; m.visible = false; scene.add(m); return m; });

    // leap trail
    const trail = Array.from({ length: 36 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); scene.add(s); return s; });
    let trailI = 0;

    // Hanuman + mace
    const H = buildHanuman(glowTex); scene.add(H.root);
    const gada = new THREE.Group();
    gada.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.4, 10), STD({ color: 0x8a5a2a })));
    const gh = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), STD({ color: 0xffc94d, metalness: 1, roughness: 0.3 })); gh.position.y = 1.4; gada.add(gh);
    gada.position.set(2.1, 1.1, -0.2); gada.rotation.z = -0.2; scene.add(gada);

    const resize = () => { const p = canvas.parentElement; const w = p.clientWidth, h = p.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();

    const cur = { ...POSES.idle }; const lookV = new THREE.Vector3(0, 4, -14); camera.position.set(7, 3.6, 9);
    let shift = 0;
    const tp = new THREE.Vector3(), tl = new THREE.Vector3(); let last = performance.now() / 1000, raf;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now() / 1000, dt = Math.min(now - last, 0.05); last = now;
      const st = stageRef.current, t = now - stageStart.current;
      let pose = POSES.idle, kCam = 2, s = 1, jawPulse = 0, glowAmt = 0;
      const R = H.root; let leapU = -1;

      if (st === "catch" || st === "arrange") pose = POSES.pray;
      if (st === "awakening") { pose = t < 1.2 ? POSES.pray : POSES.roar; s = 1 + 21 * ease((t - 1.6) / 5); glowAmt = clamp01((t - 1.5) / 3); if (t > 3.3) jawPulse = 1; }
      if (st === "complete" || st === "closed") { s = 22; pose = t < 1.4 ? POSES.crouch : POSES.fly; leapU = clamp01((t - 1.4) / 5); glowAmt = 1; if (t > 1.4) jawPulse = 1; }

      const a = 1 - Math.exp(-dt * 4);
      Object.keys(pose).forEach((k) => { cur[k] += (pose[k] - cur[k]) * a; });

      // pose application
      H.arms.forEach(({ sh, el, sgn }) => { sh.rotation.z = sgn * cur.armOut; sh.rotation.x = cur.armFwd; el.rotation.x = cur.elbow + Math.sin(now * 2) * 0.02; });
      H.legs.forEach(({ hip, knee }) => { hip.rotation.x = cur.thigh; knee.rotation.x = cur.shin; });
      const drop = 1.9 - 0.95 * (Math.cos(cur.thigh) + Math.cos(cur.thigh + cur.shin));
      H.body.position.y = -Math.max(0, drop) * cur.plant;
      H.body.rotation.x = cur.lean; H.body.scale.y = 1 + Math.sin(now * 1.8) * 0.008;
      H.head.rotation.x = cur.head; H.head.rotation.y = st === "intro" ? Math.sin(now * 0.3) * 0.25 : 0;
      H.jaw.rotation.x = -(cur.jaw * (jawPulse ? 0.75 + 0.25 * Math.sin(now * 14) : 1)) * 0.7;
      H.tail.rotation.y = Math.sin(now * 1.5) * 0.15; H.tail.rotation.x = Math.sin(now * 1.1) * 0.05 + (leapU >= 0 ? 0.4 : 0);
      H.glow.material.opacity = 0.3 + glowAmt * 0.6; H.glow.scale.setScalar(4 + glowAmt * 4 + Math.sin(now * 5) * 0.2);
      H.halo.opacity = 0.4 + glowAmt * 0.5 + Math.sin(now * 3) * 0.05;
      H.pupil.emissiveIntensity = glowAmt * 2.5;
      H.aura.material.opacity = glowAmt * (0.13 + 0.04 * Math.sin(now * 4)); H.aura.scale.setScalar(1 + 0.03 * Math.sin(now * 3));
      hemi.intensity = 0.9 + glowAmt * 0.7; key.intensity = 2.4 + glowAmt * 1.4; renderer.toneMappingExposure = 1.1 + glowAmt * 0.25;
      gada.visible = st !== "awakening" && st !== "complete" && st !== "closed";

      // root transform
      if (leapU >= 0) {
        const jt = Math.max(0, t - 1.4);
        s = 22 + 6 * leapU;
        R.position.set(0, leapU > 0 ? 170 * Math.sin(Math.PI * Math.min(leapU, 0.999)) - 60 * leapU * leapU : 0, -(60 * jt + 20 * jt * jt));
        R.rotation.x = leapU > 0 ? -1.0 * Math.sin(Math.PI * leapU) : 0;
      } else { R.position.set(0, 0, 0); R.rotation.x = 0; }
      R.scale.setScalar(s);

      // trail
      trail.forEach((p) => { p.material.opacity *= 0.93; p.scale.multiplyScalar(0.99); });
      if (leapU > 0) { const p = trail[trailI++ % trail.length]; p.position.set(R.position.x, R.position.y + 45, R.position.z + 15); p.scale.set(60, 60, 1); p.material.opacity = 0.7; }

      // camera: every stage has a fixed, deliberate shot. shiftT slides Hanuman beside the UI.
      const mx = mouse.current.x, my = mouse.current.y, wide = window.innerWidth > 900;
      let shiftT = 0, fovT = 50;
      if (st === "intro") { tp.set(6 + Math.sin(now * 0.15) * 1.2 + mx * 1.2, 3.2 + my * 0.5, 11.5 - Math.min(t, 10) * 0.15); tl.set(0, 4, -8); shiftT = wide ? -0.2 : 0; }
      else if (st === "catch") { tp.set(3.5 + mx * 1.2, 2.4 + my * 0.5, 9); tl.set(0, 5, -20); }
      else if (st === "arrange") { tp.set(4.4 + mx * 0.6, 3.3 + my * 0.3, -8.5); tl.set(0, 3.3, 0); shiftT = wide ? 0.2 : 0; }
      else if (st === "awakening") { tp.set(0, 0.5 * s + 2.5, -(12 + 5.0 * s)); tl.set(0, 2.6 * s, 0); kCam = 1.6; fovT = t > 3.3 ? 58 : 50; }
      else if (t < 1.4) { tp.set(0, 13, -122); tl.set(0, 57, 0); kCam = 2; fovT = 56; }
      else { tp.set(R.position.x + 260, R.position.y * 0.6 + 50, R.position.z - 20); tl.set(R.position.x, R.position.y + 40, R.position.z - 90); kCam = 2.5; fovT = 60; }
      const ca = 1 - Math.exp(-dt * kCam);
      camera.position.lerp(tp, ca); lookV.lerp(tl, ca);
      shift += (shiftT - shift) * ca; camera.fov += (fovT - camera.fov) * (1 - Math.exp(-dt * 2));
      const vw = canvas.clientWidth, vh = canvas.clientHeight;
      camera.setViewOffset(vw, vh, shift * vw, 0, vw, vh);
      if (st === "awakening" && t > 3 && t < 7) { const sh = s * 0.03 * (1 - (t - 3) / 4); camera.position.x += (Math.random() - 0.5) * sh; camera.position.y += (Math.random() - 0.5) * sh; }
      camera.lookAt(lookV); sky.position.copy(camera.position); stars.position.copy(camera.position);

      // rings
      const base = st === "awakening" ? 3.2 : st === "complete" ? 1.4 : 1e9;
      rings.forEach((r, i) => { const k = (t - (base + i * 0.6)) / 2.5; r.visible = k >= 0 && k <= 1; if (r.visible) { r.scale.setScalar(5 + k * 260); r.material.opacity = (1 - k) * 0.8; } });

      // ocean + embers
      const pos = oceanGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, Math.sin(x * 0.02 + now) * 3 + Math.cos(y * 0.025 + now * 0.8) * 2.5); }
      pos.needsUpdate = true;
      const ea = embers.geometry.attributes.position; const sp = 2 + glowAmt * 14;
      for (let i = 0; i < N; i++) { let y = ea.getY(i) + dt * sp; if (y > 90) y = -10; ea.setY(i, y); ea.setX(i, ea.getX(i) + Math.sin(now + i) * dt * 0.8); }
      ea.needsUpdate = true; embers.material.size = 0.7 + glowAmt * 1.5;

      renderer.render(scene, camera);
    };
    loop();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); scene.traverse((o) => { o.geometry?.dispose?.(); }); };
  }, []);

  /* ---- game logic ---- */
  useEffect(() => {
    if (stage !== "catch") return;
    setCards(shuffle(flyingCards).map((card, index) => ({ ...card, position: cardPositions[index], delay: `${(index % 6) * -0.8}s`, duration: `${7 + (index % 4) * 1.2}s` })));
    setCaught([]); setFeedback("");
  }, [stage]);

  const startGame = () => { setCaught([]); setSelected([]); setWrongAttempts(0); setStage("catch"); };
  const catchCard = (card) => {
    if (caught.includes(card.id)) return;
    if (!card.correct) { setFeedback("This fragment does not belong to the sacred verse. Look carefully."); setTimeout(() => setFeedback(""), 1800); return; }
    const next = [...caught, card.id]; setCaught(next); setFeedback("A fragment of the mantra has been recovered.");
    if (next.length === mantraFragments.length) setTimeout(() => { setFeedback(""); setStage("arrange"); }, 900);
  };
  const selectFragment = (f) => { if (selected.includes(f) || selected.length >= 8) return; setSelected((c) => [...c, f]); setFeedback(""); };
  const removeFragment = (i) => setSelected((c) => c.filter((_, idx) => idx !== i));
  const checkMantra = () => {
    if (selected.length !== 8) { setFeedback("The mantra is incomplete. Place all eight fragments first."); return; }
    if (selected.every((f, i) => f === mantraFragments[i])) { setFeedback("The sacred verse is complete."); setTimeout(() => setStage("awakening"), 1000); }
    else { setWrongAttempts((v) => v + 1); setFeedback("The sequence is not yet correct. Reflect and try again."); }
  };
  const clearArrangement = () => { setSelected([]); setFeedback(""); };
  const restart = () => { setStage("intro"); setCaught([]); setSelected([]); setFeedback(""); setFlash(false); };

  return (
    <section
      className={`hanuman-game hanuman-game--${stage}`}
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mouse.current = { x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: -((e.clientY - r.top) / r.height - 0.5) * 2 }; }}
    >
      <canvas ref={canvasRef} className="hg-canvas" />
      <div className="hg-vignette" />

      <div className="hg-topbar">
        <div className="hg-brand"><span className="hg-brand-symbol">ॐ</span><span>ANCESTRA</span></div>
        <span className="hg-chapter-label">SUNDARA KANDA · CHAPTER XII</span>
      </div>

      {stage === "intro" && (
        <div className="hg-intro-screen">
          <div className="hg-intro-copy">
            <span className="hg-eyebrow">A MOMENT OF REMEMBRANCE</span>
            <h1>The Awakening<br />of Hanuman</h1>
            <div className="hg-gold-line" />
            <p>The ocean lies before the Vanara army. The mission awaits. Yet Hanuman has forgotten the immeasurable strength within him.</p>
            <p className="hg-intro-secondary">Remember the sacred verse. Awaken the strength that was always yours.</p>
            <button className="hg-primary-button" onClick={startGame}><span>BEGIN THE AWAKENING</span><span className="hg-button-arrow">↗</span></button>
          </div>
          <div className="hg-intro-bottom"><span>MAHENDRA MOUNTAIN</span><span>THE SOUTHERN SHORE</span></div>
        </div>
      )}

      {stage === "catch" && (
        <div className="hg-catch-screen">
          <div className="hg-mantra-heading">
            <span className="hg-eyebrow">THE SACRED VERSE</span>
            <RefMantra found={(f) => caught.includes(`correct-${mantraFragments.indexOf(f)}`)} />
            <p>Catch the eight true fragments hidden among the drifting words.</p>
          </div>
          <div className="hg-catch-progress">
            <div className="hg-progress-label"><span>FRAGMENTS RECOVERED</span><strong>{caught.length} / 8</strong></div>
            <div className="hg-progress-track"><div className="hg-progress-fill" style={{ width: `${(caught.length / 8) * 100}%` }} /></div>
          </div>
          <div className="hg-card-field">
            {cards.map((card, index) => {
              const isCaught = caught.includes(card.id);
              return (
                <button key={card.id} className={`hg-flying-card ${isCaught ? "is-caught" : ""}`}
                  style={{ "--card-x": card.position.x, "--card-y": card.position.y, "--card-delay": card.delay, "--card-duration": card.duration, "--card-index": index }}
                  onClick={() => catchCard(card)} disabled={isCaught} aria-label={`Catch Sanskrit fragment ${card.text}`}>
                  <span className="hg-card-corner">✧</span><span>{card.text}</span><span className="hg-card-corner hg-card-corner--bottom">✧</span>
                </button>
              );
            })}
          </div>
          <div className="hg-catch-instruction"><span className="hg-instruction-icon">✦</span>Select only the fragments that belong to the sacred verse</div>
          {feedback && <div className="hg-feedback">{feedback}</div>}
        </div>
      )}

      {stage === "arrange" && (
        <div className="hg-arrange-screen">
          <div className="hg-arrange-heading">
            <span className="hg-eyebrow">THE WISDOM OF REMEMBRANCE</span>
            <h2>Restore the Sacred Verse</h2>
            <p>The fragments have been found. Arrange them in the correct order to complete the invocation.</p>
            <RefMantra found={(f) => selected.includes(f)} />
          </div>
          <div className="hg-arrange-panel">
            <div className="hg-arrange-label"><span>THE MANTRA</span><span>{selected.length} / 8 PLACED</span></div>
            <div className="hg-answer-slots">
              {Array.from({ length: 8 }).map((_, i) => (
                <button key={i} className={`hg-answer-slot ${selected[i] ? "has-fragment" : ""}`} onClick={() => removeFragment(i)} disabled={!selected[i]} aria-label={`Remove fragment from position ${i + 1}`}>
                  {selected[i] || <span>{String(i + 1).padStart(2, "0")}</span>}
                </button>
              ))}
            </div>
            <div className="hg-fragment-bank">
              <span className="hg-bank-label">AVAILABLE FRAGMENTS</span>
              <div className="hg-bank-items">
                {shuffledFragments.map((f) => (
                  <button key={f} className={`hg-bank-fragment ${selected.includes(f) ? "is-used" : ""}`} onClick={() => selectFragment(f)} disabled={selected.includes(f)}>{f}<span>＋</span></button>
                ))}
              </div>
            </div>
            <div className="hg-arrange-actions">
              <button className="hg-text-button" onClick={clearArrangement}>RESET ORDER</button>
              <button className="hg-primary-button" onClick={checkMantra}><span>COMPLETE THE MANTRA</span><span className="hg-button-arrow">↗</span></button>
            </div>
          </div>
          {feedback && <div className="hg-feedback">{feedback}</div>}
        </div>
      )}

      {stage === "awakening" && (
        <div className="hg-awakening-screen">
          <div className="hg-awakening-mantra">
            <span>मनोजवं मारुततुल्यवेगं</span><span>जितेन्द्रियं बुद्धिमतां वरिष्ठम्</span>
            <span>वातात्मजं वानरयूथमुख्यं</span><span>श्रीरामदूतं शरणं प्रपद्ये॥</span>
          </div>
          <div className="hg-awakening-copy">
            <span className="hg-eyebrow">THE MEMORY RETURNS</span>
            <h2>Remember Who You Are.</h2>
            <p>The strength you seek was never absent. It was waiting to be remembered.</p>
          </div>
          <div className="hg-awakening-chant">JAI SHRI RAMA!</div>
          <button className="hg-leap-button" onClick={() => setStage("complete")}>WITNESS THE GREAT LEAP <span>↗</span></button>
        </div>
      )}

      {stage === "complete" && flash && <div className="hg-flash" />}

      {stage === "closed" && (
        <div className="hg-closed">
          <span className="hg-eyebrow">THE LEAP IS COMPLETE</span>
          <h2>JAI SHRI RAMA</h2>
          <div className="hg-complete-mantra">श्रीरामदूतं शरणं प्रपद्ये॥</div>
          <button className="hg-primary-button" onClick={restart}><span>PLAY AGAIN</span><span className="hg-button-arrow">↻</span></button>
        </div>
      )}
    </section>
  );
}