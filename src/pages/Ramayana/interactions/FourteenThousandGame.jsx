import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Heart, Pause, Play, RotateCcw, Sparkles as SparkleIcon, Volume2, VolumeX } from "lucide-react";
import "./FourteenThousandGame.css";

const WAVES = [
  { name: "The Advancing Host", count: 8, speed: 1.25 },
  { name: "The Commanders' Formation", count: 12, speed: 1.5 },
  { name: "The Last Stand", count: 16, speed: 1.75 },
];
const SKINS = ["#5d4a6e", "#4a5a6b", "#6b4a52", "#4d6358"];
const SKIN_TONE = "#b87a55";

/* ---------- Helpers ---------- */
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
/* stretches a unit-height cylinder between two points */
function place(mesh, A, B) {
  if (!mesh) return;
  _d.subVectors(B, A);
  const len = _d.length();
  mesh.position.copy(A).add(B).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(_up, _d.normalize());
  mesh.scale.set(1, len, 1);
}
function makeTexture(base, blots, speckle, repeat) {
  const size = 512, c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d"), r = rng(11);
  x.fillStyle = base; x.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    x.globalAlpha = 0.12 + r() * 0.2; x.fillStyle = blots[Math.floor(r() * blots.length)];
    x.beginPath(); x.arc(r() * size, r() * size, 2 + r() * 12, 0, 6.283); x.fill();
  }
  x.globalAlpha = 0.35; x.strokeStyle = speckle; x.lineWidth = 1;
  for (let i = 0; i < 1400; i++) {
    const px = r() * size, py = r() * size;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 4, py - 3 - r() * 5); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8;
  if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- Sound (synthesised) ---------- */
function useSfx(enabled) {
  const ctx = useRef(null);
  return useCallback((type) => {
    if (!enabled) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = ctx.current || (ctx.current = new AC());
    if (c.state === "suspended") c.resume();
    const P = { twang: ["triangle", 420, 110, 0.14, 0.13], hit: ["sawtooth", 200, 50, 0.3, 0.14], hurt: ["sawtooth", 120, 40, 0.5, 0.18], drum: ["sine", 90, 40, 0.35, 0.25], clear: ["triangle", 440, 880, 0.6, 0.1] }[type];
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = P[0]; o.frequency.setValueAtTime(P[1], t); o.frequency.exponentialRampToValueAtTime(P[2], t + P[3]);
    g.gain.setValueAtTime(P[4], t); g.gain.exponentialRampToValueAtTime(0.0001, t + P[3] + 0.05);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + P[3] + 0.1);
  }, [enabled]);
}

/* ---------- Instancing helper (keeps a dense forest cheap) ---------- */
function Inst({ items, shadow = false, children }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const d = new THREE.Object3D(), c = new THREE.Color();
    items.forEach((it, i) => {
      d.position.set(it.p[0], it.p[1], it.p[2]);
      d.rotation.set(0, it.r || 0, 0);
      const s = it.s; Array.isArray(s) ? d.scale.set(s[0], s[1], s[2]) : d.scale.setScalar(s);
      d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, c.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);
  return <instancedMesh ref={ref} args={[null, null, items.length]} castShadow={shadow} frustumCulled={false}>{children}</instancedMesh>;
}

/* ---------- Environment ---------- */
function Sun() {
  const l = useRef(null);
  const { scene } = useThree();
  useEffect(() => {
    const L = l.current; if (!L) return undefined;
    L.target.position.set(0, 0, -14); scene.add(L.target);
    return () => scene.remove(L.target);
  }, [scene]);
  return (
    <directionalLight ref={l} position={[-26, 29, -60]} intensity={3} color="#fff1d0" castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-left={-32} shadow-camera-right={32}
      shadow-camera-top={32} shadow-camera-bottom={-32} shadow-camera-near={1} shadow-camera-far={120} shadow-bias={-0.0004} />
  );
}

function Banner({ x, z }) {
  const flag = useRef(null);
  const dir = x < 0 ? 1 : -1;
  useFrame(({ clock }) => {
    const g = flag.current; if (!g) return;
    const p = g.geometry.attributes.position, t = clock.elapsedTime + z;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i); p.setZ(i, Math.sin(u * 3.4 - t * 4) * 0.13 * u); }
    p.needsUpdate = true;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.1, 0]} castShadow><cylinderGeometry args={[0.05, 0.07, 4.2, 8]} /><meshStandardMaterial color="#5a3a1c" roughness={0.7} /></mesh>
      <mesh position={[0, 4.28, 0]}><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color="#f2c25a" metalness={0.8} roughness={0.25} /></mesh>
      <group position={[0, 3.55, 0]} scale={[dir, 1, 1]}>
        <mesh ref={flag} position={[0.8, 0, 0]} castShadow>
          <planeGeometry args={[1.6, 0.95, 12, 3]} /><meshStandardMaterial color="#e8821e" side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function Clouds() {
  const g = useRef(null);
  const clouds = useMemo(() => { const r = rng(3); return Array.from({ length: 10 }, () => ({
    x: (r() - 0.5) * 280, y: 46 + r() * 28, z: -70 - r() * 100, s: 0.8 + r() * 1.2,
    puffs: Array.from({ length: 6 }, () => [(r() - 0.5) * 14, (r() - 0.5) * 2.5, (r() - 0.5) * 5, 3.5 + r() * 3]),
  })); }, []);
  useFrame((_, dt) => g.current?.children.forEach((c, i) => { c.position.x += dt * (0.6 + i * 0.05); if (c.position.x > 160) c.position.x = -160; }));
  return (
    <group ref={g}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {c.puffs.map((p, j) => (
            <mesh key={j} position={[p[0], p[1], p[2]]} scale={[1, 0.7, 0.8]}>
              <sphereGeometry args={[p[3], 12, 10]} />
              <meshBasicMaterial color={p[1] < -0.4 ? "#dbe6f1" : "#ffffff"} transparent opacity={0.93} fog={false} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Bird({ r, h, sp, ph }) {
  const g = useRef(null), w1 = useRef(null), w2 = useRef(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * sp + ph, o = g.current; if (!o) return;
    o.position.set(Math.cos(t) * r, h + Math.sin(t * 2) * 1.2, -45 + Math.sin(t) * r * 0.6);
    o.rotation.y = Math.atan2(-Math.sin(t) * r, Math.cos(t) * r * 0.6);
    const f = Math.sin(clock.elapsedTime * 9 + ph) * 0.7;
    w1.current.rotation.z = f; w2.current.rotation.z = -f;
  });
  return (
    <group ref={g}>
      <mesh><sphereGeometry args={[0.12, 6, 6]} /><meshBasicMaterial color="#2b2a28" /></mesh>
      <group ref={w1}><mesh position={[-0.35, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.7, 0.2]} /><meshBasicMaterial color="#2b2a28" side={THREE.DoubleSide} /></mesh></group>
      <group ref={w2}><mesh position={[0.35, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.7, 0.2]} /><meshBasicMaterial color="#2b2a28" side={THREE.DoubleSide} /></mesh></group>
    </group>
  );
}

function Scenery({ onMiss }) {
  const { grass, dirt } = useMemo(() => ({
    grass: makeTexture("#6e9c3f", ["#5a8a35", "#82b04c", "#7ba341", "#4f7f30"], "#a5cf68", [70, 70]),
    dirt: makeTexture("#b98f56", ["#a57c46", "#caa56b", "#9b7440", "#d4b27a"], "#8a6636", [3, 60]),
  }), []);
  const d = useMemo(() => {
    const r = rng(7);
    const pine = { trunk: [], c1: [], c2: [], c3: [] }, round = { trunk: [], a: [], b: [] };
    const pal = ["#2f6b3a", "#3a7d44", "#2b5f36", "#4a8c3f"], pal2 = ["#5a9a3c", "#6aa84a", "#7bb356", "#d9a441"];
    for (let i = 0; i < 270; i++) {
      const side = r() < 0.5 ? -1 : 1, x = side * (6.5 + Math.pow(r(), 1.4) * 46), z = 12 - r() * 140, s = 0.8 + r() * 0.9, rot = r() * 6.28;
      if (r() < 0.72) {
        const c = pal[Math.floor(r() * pal.length)];
        pine.trunk.push({ p: [x, 1.3 * s, z], s, c: "#6b4a2e", r: rot });
        pine.c1.push({ p: [x, 3.1 * s, z], s, c, r: rot });
        pine.c2.push({ p: [x, 4.5 * s, z], s: s * 0.78, c, r: rot });
        pine.c3.push({ p: [x, 5.8 * s, z], s: s * 0.55, c, r: rot });
      } else {
        const c = pal2[Math.floor(r() * pal2.length)];
        round.trunk.push({ p: [x, 1.2 * s, z], s: [s, s, s], c: "#6a4a2c", r: rot });
        round.a.push({ p: [x, 3.9 * s, z], s: [s * 1.1, s * 0.95, s * 1.1], c, r: rot });
        round.b.push({ p: [x + 0.7 * s, 4.6 * s, z - 0.4 * s], s: s * 0.7, c, r: rot });
      }
    }
    const tufts = [], flowers = [], rocks = [], stones = [];
    const gp = ["#7fb34e", "#6aa040", "#92c05a", "#5f9638"], fp = ["#ffd45e", "#ff7a9c", "#ffffff", "#ff9b3d"];
    for (let i = 0; i < 800; i++) {
      const side = r() < 0.5 ? -1 : 1;
      tufts.push({ p: [side * (4.8 + r() * 36), 0.2, 10 - r() * 110], s: [0.7 + r() * 0.9, 0.7 + r() * 1.1, 0.7 + r() * 0.9], c: gp[Math.floor(r() * 4)], r: r() * 6 });
    }
    for (let i = 0; i < 220; i++) {
      const side = r() < 0.5 ? -1 : 1;
      flowers.push({ p: [side * (4.9 + r() * 7), 0.22, 10 - r() * 70], s: 0.6 + r() * 0.6, c: fp[Math.floor(r() * 4)] });
    }
    for (let i = 0; i < 50; i++) {
      const side = r() < 0.5 ? -1 : 1, s = 0.3 + r() * 0.8;
      rocks.push({ p: [side * (5.5 + r() * 20), s * 0.3, 8 - r() * 90], s: [s, s * 0.7, s], c: "#8d8a80", r: r() * 6 });
    }
    for (let i = 0; i < 90; i++) {
      const side = i % 2 ? 1 : -1;
      stones.push({ p: [side * (4.6 + r() * 0.4), 0.05, 10 - (i >> 1) * 1.6 - r()], s: 0.12 + r() * 0.16, c: "#a39a88", r: r() * 6 });
    }
    const mountains = Array.from({ length: 16 }, (_, i) => {
      const s = 26 + r() * 22;
      return { p: [-170 + i * 22 + (r() - 0.5) * 14, s * 0.5, -135 - r() * 20], s: [s * 1.2, s, s * 1.2], c: i % 2 ? "#6f8f86" : "#7c9a8a", r: r() * 6 };
    });
    return { pine, round, tufts, flowers, rocks, stones, mountains };
  }, []);
  const banners = useMemo(() => [-6, -18, -30, -42].flatMap((z) => [[-4.4, z], [4.4, z]]), []);

  return (
    <>
      <fog attach="fog" args={["#cfe0d6", 30, 175]} />
      <Sky sunPosition={[-45, 50, -80]} turbidity={5} rayleigh={1.3} mieCoefficient={0.004} mieDirectionalG={0.82} />
      <Clouds />
      {[0, 1, 2, 3, 4].map((i) => <Bird key={i} r={18 + i * 6} h={14 + i * 2.5} sp={0.12 + i * 0.02} ph={i * 1.7} />)}

      <hemisphereLight args={["#cfe6ff", "#6d8a45", 1.15]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 14]} intensity={1.1} color="#ffe9c4" />
      <Sun />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, -70]} receiveShadow onClick={(e) => { e.stopPropagation(); onMiss(e.point); }}>
        <planeGeometry args={[320, 320]} /><meshStandardMaterial map={grass} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, -60]} receiveShadow>
        <planeGeometry args={[9, 300]} /><meshStandardMaterial map={dirt} roughness={1} />
      </mesh>
      {/* invisible backdrop so clicks on the sky still loose an arrow */}
      <mesh position={[0, 40, -150]} onClick={(e) => { e.stopPropagation(); onMiss(e.point); }}>
        <planeGeometry args={[600, 300]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Inst items={d.mountains}><coneGeometry args={[1, 1, 5]} /><meshStandardMaterial flatShading roughness={1} /></Inst>
      <Inst items={d.pine.trunk} shadow><cylinderGeometry args={[0.2, 0.34, 2.6, 7]} /><meshStandardMaterial roughness={1} /></Inst>
      <Inst items={d.pine.c1} shadow><coneGeometry args={[1.6, 3.2, 8]} /><meshStandardMaterial flatShading roughness={0.9} /></Inst>
      <Inst items={d.pine.c2} shadow><coneGeometry args={[1.6, 3.2, 8]} /><meshStandardMaterial flatShading roughness={0.9} /></Inst>
      <Inst items={d.pine.c3} shadow><coneGeometry args={[1.6, 3.2, 8]} /><meshStandardMaterial flatShading roughness={0.9} /></Inst>
      <Inst items={d.round.trunk} shadow><cylinderGeometry args={[0.2, 0.32, 2.4, 7]} /><meshStandardMaterial roughness={1} /></Inst>
      <Inst items={d.round.a} shadow><icosahedronGeometry args={[1.7, 1]} /><meshStandardMaterial flatShading roughness={0.9} /></Inst>
      <Inst items={d.round.b} shadow><icosahedronGeometry args={[1.7, 1]} /><meshStandardMaterial flatShading roughness={0.9} /></Inst>
      <Inst items={d.tufts}><coneGeometry args={[0.12, 0.6, 4]} /><meshStandardMaterial roughness={1} /></Inst>
      <Inst items={d.flowers}><sphereGeometry args={[0.08, 6, 6]} /><meshStandardMaterial roughness={0.7} /></Inst>
      <Inst items={d.rocks} shadow><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial flatShading roughness={1} /></Inst>
      <Inst items={d.stones}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial flatShading roughness={1} /></Inst>

      {banners.map(([x, z]) => <Banner key={`${x}${z}`} x={x} z={z} />)}
      <Sparkles count={160} scale={[30, 8, 60]} size={3} speed={0.3} color="#fff4c2" opacity={0.6} position={[0, 3.5, -20]} />
    </>
  );
}

/* ---------- First-person camera ---------- */
function Rig({ shake }) {
  useFrame(({ camera, pointer, clock }, dt) => {
    const s = shake.current; shake.current = Math.max(0, s - dt * 2.6);
    const k = Math.min(dt * 5, 1), t = clock.elapsedTime;
    camera.rotation.y += (-pointer.x * 0.2 + Math.sin(t * 60) * s * 0.012 - camera.rotation.y) * k;
    camera.rotation.x += (pointer.y * 0.08 + Math.cos(t * 55) * s * 0.01 - camera.rotation.x) * k;
    camera.position.y = 1.65 + Math.sin(t * 1.3) * 0.015;
  });
  return null;
}

/* ---------- Arrow + bow ---------- */
function ArrowModel() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.012, 0.012, 1.1, 6]} /><meshStandardMaterial color="#d9c28d" roughness={0.6} /></mesh>
      <mesh position={[0, 0, 0.62]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.035, 0.15, 8]} /><meshStandardMaterial color="#f4d27c" metalness={0.85} roughness={0.25} emissive="#a8701c" emissiveIntensity={0.5} /></mesh>
      {[0, 2.1, 4.2].map((r) => (
        <mesh key={r} position={[0, 0, -0.5]} rotation={[0, 0, r]}><boxGeometry args={[0.005, 0.1, 0.17]} /><meshStandardMaterial color="#c0301f" /></mesh>
      ))}
    </group>
  );
}

function Bow({ kick }) {
  const g = useRef(null), nock = useRef(null), sU = useRef(null), sL = useRef(null), fR = useRef(null), slR = useRef(null), hR = useRef(null);
  const limb = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.64, 0.2), new THREE.Vector3(0, -0.34, 0.04), new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.34, 0.04), new THREE.Vector3(0, 0.64, 0.2)]), 40, 0.017, 8), []);
  const v = useMemo(() => ({ tU: new THREE.Vector3(0, 0.64, 0.2), tL: new THREE.Vector3(0, -0.64, 0.2), N: new THREE.Vector3(), H: new THREE.Vector3(), E: new THREE.Vector3(), M: new THREE.Vector3() }), []);
  useFrame(({ camera, clock }, dt) => {
    const k = kick.current; kick.current = Math.max(0, k - dt * 2.6);
    const draw = THREE.MathUtils.smoothstep(1 - k, 0.15, 0.85); // 0 at release, 1 fully drawn
    const o = g.current; if (!o) return;
    o.position.copy(camera.position); o.quaternion.copy(camera.quaternion);
    o.translateX(0.27); o.translateY(-0.3 + Math.sin(clock.elapsedTime * 1.3) * 0.006); o.translateZ(-0.95 + k * 0.08);
    o.rotateZ(-0.05); o.rotateY(0.07);
    v.N.set(0, 0, 0.2 + draw * 0.42);
    place(sU.current, v.tU, v.N); place(sL.current, v.tL, v.N);
    nock.current.position.set(0, 0.012, v.N.z - 0.5); nock.current.visible = draw > 0.25;
    v.H.set(0.015, -0.03, v.N.z + 0.03); v.E.set(0.3, -0.3, v.N.z + 0.7);
    hR.current.position.copy(v.H);
    place(fR.current, v.H, v.E);
    v.M.lerpVectors(v.H, v.E, 0.4); place(slR.current, v.M, v.E);
  });
  const skin = <meshStandardMaterial color={SKIN_TONE} roughness={0.8} />;
  return (
    <group ref={g}>
      <mesh geometry={limb}><meshStandardMaterial color="#7b4a24" roughness={0.45} metalness={0.1} /></mesh>
      <mesh position={[0, 0.64, 0.2]}><sphereGeometry args={[0.024, 10, 8]} /><meshStandardMaterial color="#f2c25a" metalness={0.85} roughness={0.25} /></mesh>
      <mesh position={[0, -0.64, 0.2]}><sphereGeometry args={[0.024, 10, 8]} /><meshStandardMaterial color="#f2c25a" metalness={0.85} roughness={0.25} /></mesh>
      <mesh><capsuleGeometry args={[0.032, 0.2, 4, 10]} /><meshStandardMaterial color="#4a2512" roughness={0.7} /></mesh>
      <mesh ref={sU}><cylinderGeometry args={[0.0035, 0.0035, 1, 4]} /><meshStandardMaterial color="#f5ecd0" /></mesh>
      <mesh ref={sL}><cylinderGeometry args={[0.0035, 0.0035, 1, 4]} /><meshStandardMaterial color="#f5ecd0" /></mesh>
      {/* left hand gripping the bow */}
      <mesh position={[0, -0.01, 0.02]} scale={[1.1, 1.2, 1.1]}><sphereGeometry args={[0.052, 12, 10]} />{skin}</mesh>
      <mesh position={[-0.15, -0.24, 0.42]} rotation={[0.95, 0.1, 0.3]}><cylinderGeometry args={[0.042, 0.052, 0.8, 10]} />{skin}</mesh>
      <mesh position={[-0.2, -0.32, 0.55]} rotation={[0.95, 0.1, 0.3]}><cylinderGeometry args={[0.06, 0.066, 0.55, 10]} /><meshStandardMaterial color="#c9701d" roughness={0.8} /></mesh>
      {/* arrow + right (string) hand */}
      <group ref={nock}><group rotation={[0, Math.PI, 0]}><ArrowModel /></group></group>
      <mesh ref={hR} scale={[1, 1.1, 1.2]}><sphereGeometry args={[0.04, 10, 8]} />{skin}</mesh>
      <mesh ref={fR}><cylinderGeometry args={[0.04, 0.05, 1, 10]} />{skin}</mesh>
      <mesh ref={slR}><cylinderGeometry args={[0.058, 0.066, 1, 10]} /><meshStandardMaterial color="#c9701d" roughness={0.8} /></mesh>
    </group>
  );
}

/* ---------- Rakshasa ---------- */
function Rakshasa({ enemy: e, posRef, paused, onReach, onGone }) {
  const g = useRef(null), aL = useRef(null), aR = useRef(null), lL = useRef(null), lR = useRef(null), bar = useRef(null);
  const reached = useRef(false), gone = useRef(false), deadT = useRef(0);
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: e.skin, roughness: 0.75, flatShading: true, emissive: "#ff2a10", emissiveIntensity: 0 }), [e.skin]);
  const commander = e.type === "commander", brute = e.type === "brute";
  const accent = commander ? "#d9b25c" : brute ? "#8a2b1e" : "#3b2d26";
  const eye = commander ? "#ff3b1f" : "#ffd23a";
  const horn = brute || commander ? 1.35 : 1;

  useEffect(() => {
    const o = g.current; if (!o) return undefined;
    posRef.current[e.id] = o.position;
    o.traverse((m) => { if (m.isMesh && !m.userData.hit) m.castShadow = true; });
    return () => { delete posRef.current[e.id]; };
  }, [e.id, posRef]);

  useFrame(({ clock }, dt) => {
    const o = g.current; if (!o) return;
    const t = clock.elapsedTime * e.speed * 2.4 + e.phase;
    skinMat.emissiveIntensity = Math.max(0, 1 - (performance.now() - e.hitAt) / 260) * 1.6;
    if (bar.current) bar.current.scale.x = Math.max(0.001, e.hp / e.maxHp);
    if (e.dead) {
      deadT.current += dt;
      o.rotation.x += (-1.5 - o.rotation.x) * Math.min(dt * 7, 1);
      o.position.y += (-0.3 - o.position.y) * Math.min(dt * 3, 1);
      o.position.z -= dt * 1.4;
      if (deadT.current > 0.9) {
        const k = Math.max(0, 1 - (deadT.current - 0.9) / 0.4);
        o.scale.setScalar(e.size * k);
        if (k <= 0 && !gone.current) { gone.current = true; onGone(e.id); }
      }
      return;
    }
    if (paused || reached.current) return;
    o.position.z += e.speed * dt;
    o.position.y = Math.abs(Math.sin(t)) * 0.1;
    o.rotation.y = Math.sin(t * 0.5) * 0.08;
    lL.current.rotation.x = Math.sin(t) * 0.7; lR.current.rotation.x = -Math.sin(t) * 0.7;
    aL.current.rotation.x = -Math.sin(t) * 0.5; aR.current.rotation.x = -1.1 + Math.sin(t) * 0.25;
    if (o.position.z > 3.4) { reached.current = true; onReach(e.id); }
  });

  const cloth = <meshStandardMaterial color="#8a2b1e" roughness={0.9} side={THREE.DoubleSide} />;
  const ivory = <meshStandardMaterial color="#efe3c6" roughness={0.5} />;
  return (
    <group ref={g} position={[e.x, 0, e.z]} scale={e.size}>
      <mesh userData={{ hit: true }} position={[0, 1.4, 0.1]}><boxGeometry args={[1.6, 3, 1.3]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>

      {/* torso, belt, loincloth, armour */}
      <mesh position={[0, 1.35, 0]} scale={[1, 1, 0.82]} material={skinMat}><capsuleGeometry args={[0.38, 0.62, 6, 10]} /></mesh>
      <mesh position={[0, 1.05, 0]}><cylinderGeometry args={[0.4, 0.38, 0.1, 10]} /><meshStandardMaterial color="#d9b25c" metalness={0.7} roughness={0.35} /></mesh>
      <mesh position={[0, 0.78, 0.04]}><boxGeometry args={[0.6, 0.5, 0.3]} />{cloth}</mesh>
      <mesh position={[0, 1.42, 0.3]}><boxGeometry args={[0.66, 0.5, 0.14]} /><meshStandardMaterial color={accent} metalness={0.55} roughness={0.45} /></mesh>
      <mesh position={[0, 1.46, 0.39]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#efe3c6" /></mesh>
      {[-0.5, 0.5].map((x) => <mesh key={x} position={[x, 1.78, 0]}><sphereGeometry args={[0.2, 10, 8]} /><meshStandardMaterial color={accent} metalness={0.5} roughness={0.5} /></mesh>)}

      {/* head */}
      <mesh position={[0, 2.05, 0]} scale={[1, 1.05, 0.95]} material={skinMat}><sphereGeometry args={[0.3, 16, 12]} /></mesh>
      <mesh position={[0, 1.88, 0.18]} scale={[1.1, 0.6, 0.9]} material={skinMat}><sphereGeometry args={[0.22, 10, 8]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.12, 2.1, 0.27]}><sphereGeometry args={[0.055, 8, 8]} /><meshBasicMaterial color={eye} /></mesh>
          <mesh position={[s * 0.12, 2.18, 0.28]} rotation={[0, 0, s * 0.45]}><boxGeometry args={[0.17, 0.04, 0.06]} /><meshStandardMaterial color="#1c1410" /></mesh>
          <mesh position={[s * 0.13, 1.85, 0.3]}>{ivory}<coneGeometry args={[0.035, 0.2, 5]} /></mesh>
          <mesh position={[s * 0.2 * horn + s * 0.04, 2.36 + 0.08 * horn, 0]} rotation={[0, 0, -s * 0.5]}>{ivory}<coneGeometry args={[0.07 * horn, 0.45 * horn, 6]} /></mesh>
          <mesh position={[s * 0.32, 2.05, 0]} rotation={[0, 0, -s * 1.3]} material={skinMat}><coneGeometry args={[0.09, 0.3, 5]} /></mesh>
        </group>
      ))}
      {commander && <mesh position={[0, 2.33, 0]}><cylinderGeometry args={[0.28, 0.22, 0.16, 8]} /><meshStandardMaterial color="#e0b85e" metalness={0.85} roughness={0.25} emissive="#7a5516" emissiveIntensity={0.5} /></mesh>}
      {commander && (
        <group position={[0, 0, -0.4]}>
          <mesh position={[0, 2.2, 0]}><cylinderGeometry args={[0.03, 0.03, 2.4, 6]} /><meshStandardMaterial color="#3a2a1e" /></mesh>
          <mesh position={[0.4, 3, 0]}><planeGeometry args={[0.8, 0.55]} />{cloth}</mesh>
        </group>
      )}

      {/* arms: left bare, right wields a spiked mace */}
      <group ref={aL} position={[-0.5, 1.7, 0]}>
        <mesh position={[0, -0.38, 0]} material={skinMat}><capsuleGeometry args={[0.11, 0.55, 4, 8]} /></mesh>
        <mesh position={[0, -0.5, 0]}><cylinderGeometry args={[0.125, 0.125, 0.12, 8]} /><meshStandardMaterial color="#d9b25c" metalness={0.7} roughness={0.35} /></mesh>
      </group>
      <group ref={aR} position={[0.5, 1.7, 0]}>
        <mesh position={[0, -0.38, 0]} material={skinMat}><capsuleGeometry args={[0.11, 0.55, 4, 8]} /></mesh>
        <mesh position={[0, -0.8, 0.5]} rotation={[1.1, 0, 0]}><cylinderGeometry args={[0.045, 0.06, 1.1, 6]} /><meshStandardMaterial color="#3a2a1e" /></mesh>
        <mesh position={[0, -0.55, 1.0]}><sphereGeometry args={[0.2, 8, 8]} /><meshStandardMaterial color="#2a2220" metalness={0.6} roughness={0.4} /></mesh>
        {[[0, 0.2, 0], [0.2, 0, 0], [-0.2, 0, 0], [0, 0, 0.2]].map((p, i) => (
          <mesh key={i} position={[p[0], -0.55 + p[1], 1.0 + p[2]]} rotation={[p[2] ? Math.PI / 2 : 0, 0, p[0] ? (p[0] > 0 ? -Math.PI / 2 : Math.PI / 2) : 0]}>
            <coneGeometry args={[0.05, 0.14, 5]} /><meshStandardMaterial color="#9a9a9a" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* legs */}
      {[[lL, -0.2], [lR, 0.2]].map(([ref, x]) => (
        <group key={x} ref={ref} position={[x, 0.7, 0]}>
          <mesh position={[0, -0.35, 0]} material={skinMat}><capsuleGeometry args={[0.13, 0.5, 4, 8]} /></mesh>
          <mesh position={[0, -0.72, 0.08]}><boxGeometry args={[0.24, 0.12, 0.36]} /><meshStandardMaterial color="#2a2018" roughness={0.9} /></mesh>
        </group>
      ))}

      {/* arrows left in the body */}
      {(e.dead || e.hp < e.maxHp) && (
        <group position={[0.12, 1.45, 0.32]} rotation={[0.25, 0.35, 0]}>
          <mesh position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.012, 0.012, 0.7, 6]} /><meshStandardMaterial color="#d9c28d" /></mesh>
          <mesh position={[0, 0, 0.58]}><boxGeometry args={[0.01, 0.07, 0.1]} /><meshStandardMaterial color="#b3261e" /></mesh>
        </group>
      )}

      {/* health bar for tougher foes */}
      {e.maxHp > 1 && !e.dead && (
        <group position={[0, commander ? 3.05 : 2.85, 0]}>
          <mesh><planeGeometry args={[0.96, 0.13]} /><meshBasicMaterial color="#1a1008" /></mesh>
          <group ref={bar} position={[-0.45, 0, 0.01]}>
            <mesh position={[0.45, 0, 0]}><planeGeometry args={[0.9, 0.08]} /><meshBasicMaterial color={commander ? "#f2c25a" : "#ff6a3c"} /></mesh>
          </group>
        </group>
      )}
    </group>
  );
}

/* ---------- Flying arrows and impacts ---------- */
function Arrow({ arrow, posRef, paused, onHit }) {
  const g = useRef(null), p = useRef(arrow.from.clone()), last = useRef(arrow.target.clone()), done = useRef(false);
  useFrame((_, dt) => {
    if (done.current || paused || !g.current) return;
    const tp = arrow.enemyId && posRef.current[arrow.enemyId];
    if (tp) last.current.set(tp.x, tp.y + 1.35 * (arrow.size || 1), tp.z);
    const dir = last.current.clone().sub(p.current), dist = dir.length(), step = 70 * dt;
    if (dist <= step + 0.25) { done.current = true; onHit(arrow, last.current.clone()); return; }
    p.current.addScaledVector(dir.normalize(), step);
    g.current.position.copy(p.current); g.current.lookAt(last.current);
  });
  return (
    <group ref={g} position={arrow.from.toArray()} scale={1.15}>
      <ArrowModel />
      <mesh position={[0, 0, -1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.03, 1.8, 6]} /><meshBasicMaterial color="#fff0b8" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function Burst({ burst, onDone }) {
  const g = useRef(null), t = useRef(0);
  const dirs = useMemo(() => Array.from({ length: 14 }, () => new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9, Math.random() - 0.5).normalize().multiplyScalar(1.5 + Math.random() * 2.8)), []);
  useFrame((_, dt) => {
    t.current += dt;
    const k = t.current / 0.6;
    if (k >= 1) return onDone(burst.id);
    g.current.children.forEach((c, i) => {
      c.material.opacity = (1 - k) * (i === 0 ? 0.9 : 1);
      if (i === 0) c.scale.setScalar(0.3 + k * 2.4);
      else c.position.copy(dirs[i - 1]).multiplyScalar(t.current).add(new THREE.Vector3(0, -2.2 * t.current * t.current * 0.5, 0));
    });
  });
  return (
    <group ref={g} position={burst.pos.toArray()}>
      <mesh><sphereGeometry args={[0.3, 12, 12]} /><meshBasicMaterial color={burst.kill ? "#ffe29a" : "#e6d6a8"} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      {dirs.map((_, i) => <mesh key={i}><sphereGeometry args={[0.05, 6, 6]} /><meshBasicMaterial color={burst.kill ? "#ff9a2a" : "#c9b27a"} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>)}
    </group>
  );
}

function Battlefield(p) {
  const { camera } = useThree();
  const start = () => { camera.updateMatrixWorld(); return camera.localToWorld(new THREE.Vector3(0.27, -0.28, -1.2)); };
  return (
    <>
      <Scenery onMiss={(pt) => p.onFire(null, start(), pt)} />
      <Rig shake={p.shake} />
      {p.enemies.map((e) => (
        <group key={e.id}
          onClick={(ev) => { ev.stopPropagation(); if (!e.dead) p.onFire(e.id, start(), ev.point, e.size); }}
          onPointerOver={() => !e.dead && p.onAim(true)} onPointerOut={() => p.onAim(false)}>
          <Rakshasa enemy={e} posRef={p.posRef} paused={p.paused} onReach={p.onReach} onGone={p.onGone} />
        </group>
      ))}
      {p.arrows.map((a) => <Arrow key={a.id} arrow={a} posRef={p.posRef} paused={p.paused} onHit={p.onHit} />)}
      {p.bursts.map((b) => <Burst key={b.id} burst={b} onDone={p.onBurstDone} />)}
      <Bow kick={p.kick} />
    </>
  );
}

function createEnemies(w) {
  const cfg = WAVES[w];
  return Array.from({ length: cfg.count }, (_, i) => {
    const commander = w === 2 && i === cfg.count - 1;
    const brute = !commander && w > 0 && i % 4 === 3;
    const type = commander ? "commander" : brute ? "brute" : "grunt";
    const hp = commander ? 3 : brute ? 2 : 1;
    return {
      id: `${w}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      x: ((i % 6) - 2.5) * 1.9 + (Math.random() - 0.5) * 0.6,
      z: -32 - Math.floor(i / 6) * 5 - Math.random() * 3,
      speed: cfg.speed * (0.85 + Math.random() * 0.3) * (commander ? 0.7 : 1),
      phase: Math.random() * 6.28, type, hp, maxHp: hp,
      size: commander ? 1.5 : brute ? 1.25 : 1, skin: commander ? "#7a2c26" : brute ? "#6b3a30" : SKINS[i % SKINS.length],
      dead: false, hitAt: 0,
    };
  });
}

/* ---------- Game ---------- */
export default function FourteenThousandGame({ onClose }) {
  const [screen, setScreen] = useState("intro");
  const [wave, setWave] = useState(0);
  const [enemies, setEnemies] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [bursts, setBursts] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(true);
  const [notice, setNotice] = useState("");
  const [banner, setBanner] = useState(false);
  const [hurt, setHurt] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const posRef = useRef({}), kick = useRef(0), shake = useRef(0), cool = useRef(0), enemiesRef = useRef([]), root = useRef(null), streakRef = useRef(0);
  enemiesRef.current = enemies;
  const sfx = useSfx(sound);
  const alive = enemies.filter((e) => !e.dead).length;

  const setStreakBoth = useCallback((v) => { streakRef.current = v; setStreak(v); }, []);
  const onAim = useCallback((on) => root.current?.classList.toggle("is-aiming", on), []);

  const startWave = useCallback((i) => {
    setWave(i); setEnemies(createEnemies(i)); setArrows([]); setBursts([]);
    setPaused(false); setScreen("battle"); setNotice(""); setStreakBoth(0); setBanner(true);
    setTimeout(() => setBanner(false), 2800);
  }, [setStreakBoth]);

  const onFire = useCallback((enemyId, from, target, size = 1) => {
    if (screen !== "battle" || paused || performance.now() < cool.current) return;
    cool.current = performance.now() + 380;
    kick.current = 1; sfx("twang");
    setArrows((a) => [...a, { id: Math.random().toString(36).slice(2), enemyId, from, target, size }]);
  }, [screen, paused, sfx]);

  const onHit = useCallback((arrow, point) => {
    setArrows((a) => a.filter((x) => x.id !== arrow.id));
    const target = arrow.enemyId ? enemiesRef.current.find((e) => e.id === arrow.enemyId) : null;
    const valid = !!target && !target.dead;
    const kill = valid && target.hp <= 1;
    setBursts((b) => [...b, { id: arrow.id, pos: point, kill }]);
    if (!valid) { if (!arrow.enemyId) setStreakBoth(0); return; }
    sfx("hit"); shake.current = 0.6;
    const upd = (list) => list.map((e) => (e.id !== target.id || e.dead ? e : e.hp > 1 ? { ...e, hp: e.hp - 1, hitAt: performance.now() } : { ...e, dead: true }));
    enemiesRef.current = upd(enemiesRef.current);
    setEnemies(upd);
    if (kill) {
      const n = streakRef.current + 1;
      setStreakBoth(n); setBestStreak((b) => Math.max(b, n));
      const pts = (target.type === "commander" ? 500 : target.type === "brute" ? 200 : 100) + Math.min(n, 10) * 10;
      setScore((s) => s + pts);
      setNotice(target.type === "commander" ? "The commander falls" : "A divine shaft strikes true");
    } else setNotice("The arrow bites deep");
  }, [sfx, setStreakBoth]);

  const onReach = useCallback((id) => {
    setEnemies((l) => l.filter((e) => e.id !== id));
    setLives((v) => Math.max(0, v - 1)); setStreakBoth(0); shake.current = 1.4;
    setHurt((h) => h + 1); sfx("hurt"); setNotice("The line has been breached");
  }, [sfx, setStreakBoth]);
  const onGone = useCallback((id) => setEnemies((l) => l.filter((e) => e.id !== id)), []);
  const onBurstDone = useCallback((id) => setBursts((b) => b.filter((x) => x.id !== id)), []);

  useEffect(() => {
    if (screen !== "battle") return undefined;
    if (lives <= 0) { setScreen("defeat"); return undefined; }
    if (alive === 0) {
      const id = setTimeout(() => { sfx("clear"); setScreen("wave-clear"); }, 900);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [alive, lives, screen, sfx]);

  useEffect(() => { if (!notice) return undefined; const id = setTimeout(() => setNotice(""), 1700); return () => clearTimeout(id); }, [notice]);
  useEffect(() => {
    if (screen !== "battle" || paused) return undefined;
    const id = setInterval(() => { sfx("drum"); setTimeout(() => sfx("drum"), 260); }, 1800);
    return () => clearInterval(id);
  }, [screen, paused, sfx]);
  useEffect(() => {
    const k = (e) => { if (screen === "battle" && (e.key === "p" || e.key === "P" || e.key === " ")) { e.preventDefault(); setPaused((v) => !v); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [screen]);

  const nextWave = () => (wave < WAVES.length - 1 ? startWave(wave + 1) : setScreen("victory"));
  const reset = () => { setScreen("intro"); setWave(0); setEnemies([]); setArrows([]); setBursts([]); setScore(0); setLives(5); setPaused(false); setStreakBoth(0); setBestStreak(0); setNotice(""); };
  const onMove = (e) => { root.current?.style.setProperty("--mx", `${e.clientX}px`); root.current?.style.setProperty("--my", `${e.clientY}px`); };

  return (
    <div ref={root} onPointerMove={onMove} className={`fourteen-game${screen === "battle" ? " is-battle" : ""}`}>
      <div className="fourteen-game__world">
        <Canvas shadows camera={{ position: [0, 1.65, 5.2], fov: 62, near: 0.05, far: 1000 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
          <Battlefield enemies={enemies} arrows={arrows} bursts={bursts} posRef={posRef} kick={kick} shake={shake}
            paused={paused || screen !== "battle"} onFire={onFire} onHit={onHit} onReach={onReach} onGone={onGone} onBurstDone={onBurstDone} onAim={onAim} />
        </Canvas>
      </div>
      <div className="fourteen-game__sun" />
      <div className="fourteen-game__vignette" />
      <div className="fourteen-game__grain" />
      <div key={hurt} className={hurt ? "fourteen-game__hurt" : ""} />

      <header className="fourteen-game__top">
        <div className="fourteen-game__brand"><span>ANCESTRA</span><i /><small>Aranya Kanda · Chapter VIII</small></div>
        <div className="fourteen-game__top-actions">
          <button onClick={() => setSound((v) => !v)} aria-label="Toggle sound">{sound ? <Volume2 /> : <VolumeX />}</button>
          {screen === "battle" && <button onClick={() => setPaused((v) => !v)} aria-label="Pause battle">{paused ? <Play /> : <Pause />}</button>}
        </div>
      </header>

      {screen === "battle" && (
        <>
          <div className="fourteen-game__hud">
            <div className="fourteen-game__hud-stat"><small>Formation</small><strong>{wave + 1} <em>/ 3</em></strong></div>
            <div className="fourteen-game__hud-stat"><small>Focus</small><strong>{String(score).padStart(4, "0")}</strong></div>
            <div className="fourteen-game__hud-stat"><small>Foes left</small><strong>{alive}</strong>
              <div className="fourteen-game__foebar"><i style={{ width: `${(alive / WAVES[wave].count) * 100}%` }} /></div>
            </div>
            <div className="fourteen-game__hud-stat fourteen-game__hud-stat--end"><small>Outer line</small>
              <strong className="fourteen-game__hearts">{Array.from({ length: 5 }, (_, i) => <Heart key={i} fill={i < lives ? "currentColor" : "none"} />)}</strong>
            </div>
          </div>
          <div className="fourteen-game__reticle" />
          {streak >= 2 && <div key={streak} className="fourteen-game__combo">{streak} in a row</div>}
          <div className="fourteen-game__instruction">Click a rakshasa to loose an arrow</div>
          <AnimatePresence>
            {banner && (
              <motion.div key="banner" className="fourteen-game__banner" initial={{ opacity: 0, scale: 1.15 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.6 }}>
                <span>Wave {wave + 1}</span><strong>{WAVES[wave].name}</strong>
              </motion.div>
            )}
            {notice && !banner && <motion.div key="notice" className="fourteen-game__notice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{notice}</motion.div>}
          </AnimatePresence>
          {paused && <div className="fourteen-game__pause"><span>The battle is paused</span><button onClick={() => setPaused(false)}><Play size={16} /> Resume</button></div>}
        </>
      )}

      {/* The stage centres every card. Framer Motion owns each card's transform,
          so centring must never rely on a CSS transform (that was the misalignment bug). */}
      <div className="fourteen-game__stage">
        <AnimatePresence mode="wait">
          {screen === "intro" && (
            <motion.section className="fourteen-game__story-card" key="intro" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="fourteen-game__eyebrow"><SparkleIcon size={14} /> The army of Janasthana</div>
              <div className="fourteen-game__roman">XIV Thousand</div>
              <h1>The Fourteen <em>Thousand</em></h1>
              <p>Khara has gathered the strength of Janasthana. Fourteen thousand warriors advance toward Panchavati. Rama stands before the approaching host, bow in hand, while Sita and Lakshmana are sheltered beyond the battlefield.</p>
              <div className="fourteen-game__divider"><i />✦<i /></div>
              <button className="fourteen-game__primary" onClick={() => startWave(0)}>Enter the battlefield <ArrowRight size={17} /></button>
              <small>First person · Three formations · One stand</small>
            </motion.section>
          )}
          {screen === "wave-clear" && (
            <motion.section className="fourteen-game__story-card" key="wave" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="fourteen-game__eyebrow"><SparkleIcon size={14} /> Formation dispersed</div>
              <h2>{wave === 0 ? "The first host has fallen back." : wave === 1 ? "The commanders' line is broken." : "The final formation is silent."}</h2>
              <p>The forest grows quiet for a moment, yet the challenge is not over.</p>
              <div className="fourteen-game__scoreline"><span>Focus</span><strong>{score}</strong><span>Best streak {bestStreak}</span></div>
              <button className="fourteen-game__primary" onClick={nextWave}>{wave === 2 ? "Complete the battle" : "Face the next formation"} <ArrowRight size={17} /></button>
            </motion.section>
          )}
          {screen === "victory" && (
            <motion.section className="fourteen-game__story-card" key="victory" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="fourteen-game__eyebrow"><SparkleIcon size={14} /> The battle of Janasthana</div>
              <h1>The Forest <em>Is Still</em></h1>
              <p>The advancing formations have been overcome. Rama lowers his bow and turns toward the place where Sita and Lakshmana await. The battle is over, but its consequences will travel far beyond Panchavati.</p>
              <div className="fourteen-game__scoreline"><span>Final focus</span><strong>{score}</strong><span>Best streak {bestStreak}</span></div>
              <button className="fourteen-game__primary" onClick={() => onClose?.()}>Return to the story <ArrowRight size={17} /></button>
            </motion.section>
          )}
          {screen === "defeat" && (
            <motion.section className="fourteen-game__story-card" key="defeat" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="fourteen-game__eyebrow">The formation reached the line</div>
              <h2>The stand must continue.</h2>
              <p>Regroup and try the battlefield again. Each advancing formation asks for calm attention and a steady aim.</p>
              <div className="fourteen-game__divider"><i />✦<i /></div>
              <button className="fourteen-game__primary" onClick={reset}><RotateCcw size={16} /> Replay the battle</button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <footer className="fourteen-game__bottom"><span>The past cannot be changed</span><i>✦</i><span>The way we understand it can</span></footer>
    </div>
  );
}