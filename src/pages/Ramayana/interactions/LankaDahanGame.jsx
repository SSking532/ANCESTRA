import React, {
  Component,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Flame, RotateCcw, Sparkles, X, Zap } from "lucide-react";
import "./LankaDahanGame.css";

/* ====================================================================
   LANKA DAHAN — the burning of the golden city
   A real-time 3D game (React Three Fiber). Fly Hanuman across Lanka with
   his tail aflame and set as many homes, towers, temples and palaces
   alight as you can before the night ends. Fire spreads on its own.
   Vibhishana's home and the Ashoka Vatika are protected by dharma.

   Controls   WASD / arrows  move        Shift  boost
              Space / click  fire-burst  Q / E  rotate camera
   Touch      joystick + BURST + BOOST buttons
   ==================================================================== */

const GAME_SECONDS = 60;
const INTRO_SECONDS = 3;
const CELL = 6.4;
const ROAD = CELL * 4;
const ROADS = [-2, -1, 0, 1, 2].map((k) => k * ROAD);
const WALL_R = 73;
const HERO_BOUND = 77;
const BURST_COOLDOWN = 3.4;
const BURST_RADIUS = 18;
const BURST_SPEED = 32;
const CRUISE = 15;
const BOOST = 27;
const REACH = 2.4;
const TAIL_N = 18;
const BEST_KEY = "ancestra.lankaDahan.best";

/* Lighting: point-light units changed in three r155 (physical units). */
const REV = parseInt(THREE.REVISION, 10) || 160;
const PHYS = REV >= 155;
const LK = PHYS ? 1 : 0.032; // point lights
const AK = PHYS ? Math.PI : 1; // ambient / hemisphere / directional

const CHAR = new THREE.Color("#1b1310");
const FOG_A = new THREE.Color("#1c1226");
const FOG_B = new THREE.Color("#4a1c16");

const TYPES = {
  home: { score: 10, label: "HOME" },
  mansion: { score: 25, label: "MANSION" },
  tower: { score: 40, label: "WATCH TOWER" },
  temple: { score: 50, label: "TEMPLE" },
  hall: { score: 120, label: "ROYAL HALL" },
  palace: { score: 300, label: "RAVANA'S PALACE" },
};

/* ====================================================================
   CITY GENERATION
   ==================================================================== */

function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WALLS = ["#c9a36b", "#b98a55", "#d9b57a", "#a9784a", "#c7ad8a", "#e0c18e"];
const TERRACOTTA = ["#8f3a2a", "#a4452c", "#7d3326"];
const GOLD_ROOFS = ["#d9a43a", "#e4b24a", "#cf9a2e"];

function flamePoints(b) {
  const { w, d, h } = b;
  let pts;
  switch (b.type) {
    case "home":
      pts = [[0, h + 1.2, 0], [1, h + 0.4, 0.6], [-0.9, h + 0.5, -0.5]];
      break;
    case "mansion":
      pts = [[0, h + 1.8, 0], [w * 0.3, h + 0.5, 0], [-w * 0.3, h + 0.5, d * 0.25]];
      break;
    case "tower":
      pts = [[0, h + 1.5, 0], [0, h * 0.55, w * 0.5], [0, h * 0.8, -w * 0.5]];
      break;
    case "temple":
      pts = [[0, h + 1.5, 0], [w * 0.3, h * 0.55, w * 0.3], [-w * 0.3, h * 0.4, -w * 0.3]];
      break;
    case "hall":
      pts = [[0, h + 3.2, 0], [w * 0.32, h + 0.6, d * 0.2], [-w * 0.32, h + 0.6, -d * 0.2], [3.6, h + 1.8, 0], [-3.6, h + 1.8, 0]];
      break;
    default:
      pts = [
        [0, h + 6.5, 0], [6.2, h + 1.6, 0], [-6.2, h + 1.6, 0],
        [6, h + 0.6, 3.5], [-6, h + 0.6, -3.5], [6, h + 0.6, -3.5], [-6, h + 0.6, 3.5],
        [7.5, h + 4, 5.7], [-7.5, h + 4, -5.7],
      ];
  }
  return pts.map(([x, y, z]) => ({ x, y, z, acc: Math.random() }));
}

function generateCity() {
  const rnd = mulberry32(20261113);
  const buildings = [];
  const protectedZones = [];
  const add = (b) => {
    b.id = buildings.length;
    b.burning = false;
    b.burnT = 0;
    b.intensity = 0;
    b.spreadT = 0;
    b.neighbors = [];
    b.mats = null;
    b.top = b.h;
    b.fp = null;
    buildings.push(b);
    return b;
  };

  const palace = add({
    type: "palace", x: 0, z: 0, w: 17, d: 13, h: 7.5, radius: 10.5,
    wall: "#d8b980", roofColor: "#e4b24a", goldRoof: true,
  });
  [[36, 20], [-30, -26], [6, 40], [-10, -42], [44, -8], [-44, 4]].forEach(([x, z]) =>
    add({
      type: "hall", x, z, w: 10, d: 8, h: 5, radius: 6.6,
      wall: "#d6b27a", roofColor: GOLD_ROOFS[0], goldRoof: true,
    })
  );

  protectedZones.push(
    { type: "vibhishana", x: 30, z: -28, radius: 8, label: "VIBHISHANA'S HOME", seen: false },
    { type: "ashoka", x: -34, z: 26, radius: 11.5, label: "ASHOKA VATIKA", seen: false }
  );

  const blocked = (x, z, r) => {
    for (const b of buildings) {
      if (Math.hypot(b.x - x, b.z - z) < (b.radius + r) * 0.85 + 0.7) return true;
    }
    for (const p of protectedZones) {
      if (Math.hypot(p.x - x, p.z - z) < p.radius + r + 1.2) return true;
    }
    return false;
  };

  for (let gz = -11; gz <= 11; gz++) {
    for (let gx = -11; gx <= 11; gx++) {
      if (gx % 4 === 0 || gz % 4 === 0) continue;
      const x = gx * CELL + (rnd() - 0.5) * 1.4;
      const z = gz * CELL + (rnd() - 0.5) * 1.4;
      const r = Math.hypot(x, z);
      if (r > WALL_R - 6) continue;
      if (rnd() < 0.1) continue;

      const roll = rnd();
      let type;
      if (r < 30) type = roll < 0.35 ? "tower" : roll < 0.65 ? "mansion" : roll < 0.8 ? "temple" : "home";
      else if (r < 50) type = roll < 0.15 ? "tower" : roll < 0.45 ? "mansion" : roll < 0.55 ? "temple" : "home";
      else type = roll < 0.08 ? "mansion" : "home";

      let w, d, h, radius;
      if (type === "home") {
        w = 3 + rnd() * 1.4; d = 3 + rnd() * 1.2; h = 2.2 + rnd() * 1.2;
        radius = Math.max(w, d) * 0.62;
      } else if (type === "mansion") {
        w = 5 + rnd(); d = 4.4 + rnd(); h = 3.6 + rnd() * 1.4;
        radius = Math.max(w, d) * 0.62;
      } else if (type === "tower") {
        w = 3 + rnd() * 0.6; d = w; h = 8 + rnd() * 4;
        radius = w * 0.68;
      } else {
        w = 5.2; d = 5.2; h = 6.3; radius = 3.5;
      }
      if (blocked(x, z, radius)) continue;

      const goldRoof = type !== "home";
      add({
        type, x, z, w, d, h, radius, goldRoof,
        wall: WALLS[(rnd() * WALLS.length) | 0],
        roofColor: goldRoof
          ? GOLD_ROOFS[(rnd() * GOLD_ROOFS.length) | 0]
          : TERRACOTTA[(rnd() * TERRACOTTA.length) | 0],
      });
    }
  }

  buildings.forEach((b) => {
    b.score = TYPES[b.type].score;
    b.fp = flamePoints(b);
  });
  buildings.forEach((a) => {
    buildings.forEach((c) => {
      if (a === c) return;
      const gap = Math.hypot(a.x - c.x, a.z - c.z) - a.radius - c.radius;
      if (gap < 4.4) a.neighbors.push(c);
    });
  });

  return { buildings, protectedZones, palace, total: buildings.length };
}

/* ====================================================================
   SHARED GEOMETRY / MATERIALS / TEXTURES (created lazily, client only)
   ==================================================================== */

let GEO = null;
function geos() {
  if (GEO) return GEO;
  GEO = {
    box: new THREE.BoxGeometry(1, 1, 1),
    pyr: new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4),
    cone: new THREE.ConeGeometry(1, 1, 14),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
    dome: new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    sph: new THREE.SphereGeometry(1, 16, 12),
  };
  return GEO;
}

let MAT = null;
function mats() {
  if (MAT) return MAT;
  MAT = {
    gold: new THREE.MeshStandardMaterial({
      color: "#e0a93c", metalness: 0.85, roughness: 0.32, emissive: "#3a2300",
    }),
    stone: new THREE.MeshStandardMaterial({ color: "#8d7a64", roughness: 0.95 }),
    cream: new THREE.MeshStandardMaterial({ color: "#eadcc0", roughness: 0.7 }),
    dark: new THREE.MeshStandardMaterial({ color: "#2a1a14", roughness: 0.9 }),
    lantern: new THREE.MeshBasicMaterial({ color: "#ffcf70" }),
    wall: new THREE.MeshStandardMaterial({
      color: "#c79a52", metalness: 0.35, roughness: 0.6, emissive: "#2a1a08",
    }),
    banner: new THREE.MeshStandardMaterial({ color: "#8e1d1d", roughness: 0.8, side: THREE.DoubleSide }),
  };
  return MAT;
}

const setSRGB = (tex) => {
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

let TEX_WINDOW = null;
function windowTex() {
  if (TEX_WINDOW) return TEX_WINDOW;
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#120d08";
  g.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 5; r++) {
    for (let k = 0; k < 4; k++) {
      if (Math.random() < 0.6) {
        const v = 150 + Math.random() * 105;
        g.fillStyle = `rgb(${v},${v * 0.72},${v * 0.36})`;
        g.fillRect(8 + k * 31, 8 + r * 24, 15, 16);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  TEX_WINDOW = setSRGB(t);
  return TEX_WINDOW;
}

let TEX_GLOW = null;
function glowTex() {
  if (TEX_GLOW) return TEX_GLOW;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,246,220,1)");
  grad.addColorStop(0.25, "rgba(255,206,120,0.7)");
  grad.addColorStop(1, "rgba(255,170,70,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  TEX_GLOW = setSRGB(new THREE.CanvasTexture(c));
  return TEX_GLOW;
}

let TEX_GROUND = null;
function groundTex() {
  if (TEX_GROUND) return TEX_GROUND;
  const SZ = 1024;
  const S = SZ / 160;
  const c = document.createElement("canvas");
  c.width = c.height = SZ;
  const g = c.getContext("2d");
  g.fillStyle = "#2b1d18";
  g.fillRect(0, 0, SZ, SZ);
  for (let i = 0; i < 9000; i++) {
    const v = Math.random();
    g.fillStyle = v > 0.5 ? "rgba(120,86,60,0.18)" : "rgba(8,4,3,0.25)";
    g.fillRect(Math.random() * SZ, Math.random() * SZ, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  const W = (v) => (v + 80) * S;
  g.fillStyle = "#4e382a";
  ROADS.forEach((v) => {
    g.fillRect(W(v - 2.8), 0, 5.6 * S, SZ);
    g.fillRect(0, W(v - 2.8), SZ, 5.6 * S);
  });
  // plaza + ring road
  g.beginPath(); g.arc(W(0), W(0), 17 * S, 0, Math.PI * 2);
  g.fillStyle = "#6b4c34"; g.fill();
  // golden inlay
  g.strokeStyle = "rgba(235,190,100,0.55)"; g.lineWidth = 1.2;
  g.beginPath(); g.arc(W(0), W(0), 17 * S, 0, Math.PI * 2); g.stroke();
  g.setLineDash([10, 14]);
  ROADS.forEach((v) => {
    g.beginPath(); g.moveTo(W(v), 0); g.lineTo(W(v), SZ); g.stroke();
    g.beginPath(); g.moveTo(0, W(v)); g.lineTo(SZ, W(v)); g.stroke();
  });
  TEX_GROUND = setSRGB(new THREE.CanvasTexture(c));
  TEX_GROUND.anisotropy = 4;
  return TEX_GROUND;
}

let TEX_NOISE = null;
function noiseTex() {
  if (TEX_NOISE) return TEX_NOISE;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 90 + Math.random() * 120;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(70, 70);
  TEX_NOISE = t;
  return t;
}

/* ====================================================================
   PARTICLES (fire / embers / glow / smoke) — one GPU points object each
   ==================================================================== */

class Pool {
  constructor(max, { drag = 0.9, buoy = 3.2 } = {}) {
    this.max = max;
    this.n = 0;
    this.timeScale = 1;
    this.drag = drag;
    this.buoy = buoy;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.age = new Float32Array(max);
    this.life = new Float32Array(max);
    this.ageN = new Float32Array(max);
    this.size = new Float32Array(max);
    this.sizeOut = new Float32Array(max);
    this.kind = new Float32Array(max);
  }

  emit(x, y, z, vx, vy, vz, life, size, kind) {
    const i = this.n;
    this.n = (i + 1) % this.max;
    const p = i * 3;
    this.pos[p] = x; this.pos[p + 1] = y; this.pos[p + 2] = z;
    this.vel[p] = vx; this.vel[p + 1] = vy; this.vel[p + 2] = vz;
    this.age[i] = 0; this.life[i] = life; this.ageN[i] = 0;
    this.size[i] = size; this.sizeOut[i] = size; this.kind[i] = kind;
  }

  update(rawDt) {
    const dt = rawDt * this.timeScale;
    if (dt <= 0) return;
    for (let i = 0; i < this.max; i++) {
      const L = this.life[i];
      if (L <= 0) continue;
      const a = this.age[i] + dt;
      if (a >= L) {
        this.life[i] = 0; this.sizeOut[i] = 0; this.ageN[i] = 1;
        continue;
      }
      this.age[i] = a;
      this.ageN[i] = a / L;
      const k = this.kind[i];
      const p = i * 3;
      const drag = Math.exp(-(k === 1 ? 0.15 : this.drag) * dt);
      this.vel[p] *= drag; this.vel[p + 2] *= drag;
      const by = k === 1 ? -7 : k === 2 ? 0.3 : this.buoy;
      this.vel[p + 1] = this.vel[p + 1] * drag + by * dt;
      this.pos[p] += this.vel[p] * dt;
      this.pos[p + 1] += this.vel[p + 1] * dt;
      this.pos[p + 2] += this.vel[p + 2] * dt;
      if (k === 1 && this.pos[p + 1] < 0.15) {
        this.life[i] = 0; this.sizeOut[i] = 0;
      }
    }
  }
}

const PARTICLE_VERT = `
uniform float uH;
uniform float uGrow;
attribute float aAge;
attribute float aSize;
attribute float aKind;
varying float vAge;
varying float vKind;
void main() {
  vAge = aAge;
  vKind = aKind;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float s = aSize * (0.55 + aAge * uGrow);
  gl_PointSize = s * uH * 0.5 * projectionMatrix[1][1] / max(-mv.z, 0.1);
  gl_Position = projectionMatrix * mv;
}`;

const PARTICLE_FRAG = `
uniform float uSmoke;
varying float vAge;
varying float vKind;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;
  float soft = 1.0 - smoothstep(0.0, 1.0, d);
  if (uSmoke > 0.5) {
    vec3 sc = mix(vec3(0.24, 0.17, 0.15), vec3(0.07, 0.06, 0.07), vAge);
    float sa = soft * soft * (1.0 - vAge) * 0.45;
    gl_FragColor = vec4(sc, sa);
    return;
  }
  vec3 col = mix(vec3(1.0, 0.96, 0.72), vec3(1.0, 0.5, 0.1), smoothstep(0.0, 0.4, vAge));
  col = mix(col, vec3(0.75, 0.08, 0.02), smoothstep(0.4, 0.95, vAge));
  float a = soft * (1.0 - vAge);
  if (vKind > 0.5 && vKind < 1.5) {
    col = vec3(1.0, 0.74, 0.32);
    a = (1.0 - smoothstep(0.0, 0.55, d)) * (1.0 - vAge * 0.6);
  } else if (vKind > 1.5) {
    col = vec3(1.0, 0.42, 0.1);
    a = soft * soft * 0.17 * (1.0 - vAge);
  }
  gl_FragColor = vec4(col, a);
}`;

function ParticleLayer({ pool, smoke = false }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pool.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aAge", new THREE.BufferAttribute(pool.ageN, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aSize", new THREE.BufferAttribute(pool.sizeOut, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aKind", new THREE.BufferAttribute(pool.kind, 1).setUsage(THREE.DynamicDrawUsage));
    return g;
  }, [pool]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uH: { value: 800 },
          uGrow: { value: smoke ? 2.2 : 0.9 },
          uSmoke: { value: smoke ? 1 : 0 },
        },
        vertexShader: PARTICLE_VERT,
        fragmentShader: PARTICLE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: smoke ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    [smoke]
  );

  useEffect(() => () => { geom.dispose(); mat.dispose(); }, [geom, mat]);

  useFrame((state, dt) => {
    pool.update(Math.min(dt, 0.05));
    mat.uniforms.uH.value = state.gl.domElement.height;
    const a = geom.attributes;
    a.position.needsUpdate = true;
    a.aAge.needsUpdate = true;
    a.aSize.needsUpdate = true;
    a.aKind.needsUpdate = true;
  });

  return <points geometry={geom} material={mat} frustumCulled={false} renderOrder={smoke ? 5 : 6} />;
}

/* ====================================================================
   SCENE: SKY, OCEAN, ISLAND, WALLS, MOUNTAINS
   ==================================================================== */

const SKY_VERT = `
varying vec3 vP;
void main() {
  vP = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SKY_FRAG = `
uniform float uFire;
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uLow;
varying vec3 vP;
void main() {
  float h = clamp(vP.y, -0.2, 1.0);
  vec3 c = mix(uLow, uMid, smoothstep(-0.05, 0.25, h));
  c = mix(c, uTop, smoothstep(0.2, 0.9, h));
  float glow = (1.0 - smoothstep(0.0, 0.5, abs(vP.y))) * uFire;
  c += vec3(0.95, 0.3, 0.07) * glow * 0.95;
  gl_FragColor = vec4(c, 1.0);
}`;

function SkyGroup({ rig }) {
  const ref = useRef();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uFire: { value: 0 },
          uTop: { value: new THREE.Color("#060714") },
          uMid: { value: new THREE.Color("#241230") },
          uLow: { value: new THREE.Color("#4a2030") },
        },
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );
  const stars = useMemo(() => {
    const n = 1400;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random();
      const v = 0.04 + Math.random() * 0.96;
      const th = u * Math.PI * 2;
      const rr = Math.sqrt(1 - v * v);
      arr[i * 3] = Math.cos(th) * rr * 520;
      arr[i * 3 + 1] = v * 520;
      arr[i * 3 + 2] = Math.sin(th) * rr * 520;
    }
    return arr;
  }, []);
  useEffect(() => {
    rig.current.skyGroup = ref.current;
    rig.current.skyMat = mat;
    return () => mat.dispose();
  }, [rig, mat]);
  return (
    <group ref={ref}>
      <mesh material={mat} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[560, 32, 16]} />
      </mesh>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={stars} count={stars.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={1.7} sizeAttenuation={false} transparent opacity={0.85} depthWrite={false} fog={false} />
      </points>
      <mesh position={[-190, 170, -330]}>
        <sphereGeometry args={[19, 32, 24]} />
        <meshBasicMaterial color="#f4eed6" fog={false} />
      </mesh>
      <sprite position={[-190, 170, -330]} scale={[150, 150, 1]}>
        <spriteMaterial map={glowTex()} color="#b9c8ff" transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
    </group>
  );
}

function Ocean({ rig }) {
  const ref = useRef();
  useEffect(() => { rig.current.ocean = ref.current; }, [rig]);
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position={[0, -0.7, 0]}>
      <planeGeometry args={[1400, 1400]} />
      <meshStandardMaterial
        color="#07122a" metalness={0.85} roughness={0.2}
        emissive="#04101e" bumpMap={noiseTex()} bumpScale={0.8}
      />
    </mesh>
  );
}

function Island() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <circleGeometry args={[80, 96]} />
        <meshStandardMaterial map={groundTex()} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.04, 0]}>
        <ringGeometry args={[79.5, 92, 96]} />
        <meshStandardMaterial color="#6e5840" roughness={1} />
      </mesh>
    </>
  );
}

function Walls() {
  const wallRef = useRef();
  const lampRef = useRef();
  const N = 72;
  useEffect(() => {
    const d = new THREE.Object3D();
    const len = (2 * Math.PI * WALL_R) / N + 0.25;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      d.position.set(Math.cos(a) * WALL_R, 1.7, Math.sin(a) * WALL_R);
      d.rotation.set(0, -a - Math.PI / 2, 0);
      d.scale.set(len, 3.4, 1.3);
      d.updateMatrix();
      wallRef.current.setMatrixAt(i, d.matrix);
      if (i % 2 === 0) {
        d.position.set(Math.cos(a) * WALL_R, 3.9, Math.sin(a) * WALL_R);
        d.rotation.set(0, 0, 0);
        d.scale.setScalar(0.22);
        d.updateMatrix();
        lampRef.current.setMatrixAt(i / 2, d.matrix);
      }
    }
    wallRef.current.instanceMatrix.needsUpdate = true;
    lampRef.current.instanceMatrix.needsUpdate = true;
  }, []);
  const G = geos();
  const M = mats();
  return (
    <>
      <instancedMesh ref={wallRef} args={[G.box, M.wall, N]} frustumCulled={false} />
      <instancedMesh ref={lampRef} args={[G.sph, M.lantern, N / 2]} frustumCulled={false} />
    </>
  );
}

function Mountains() {
  const items = useMemo(() => {
    const r = mulberry32(77);
    return Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2 + r() * 0.3;
      const dist = 165 + r() * 50;
      return { x: Math.cos(a) * dist, z: Math.sin(a) * dist, rad: 38 + r() * 20, h: 45 + r() * 35 };
    });
  }, []);
  return (
    <>
      {items.map((m, i) => (
        <mesh key={i} position={[m.x, m.h / 2 - 2, m.z]}>
          <coneGeometry args={[m.rad, m.h, 7]} />
          <meshStandardMaterial color="#1a1422" roughness={1} flatShading />
        </mesh>
      ))}
    </>
  );
}

/* ====================================================================
   BUILDINGS
   ==================================================================== */

function BuildingMeshes({ b, body, roof }) {
  const G = geos();
  const M = mats();
  const { w, d, h } = b;

  switch (b.type) {
    case "home":
      return (
        <>
          <mesh geometry={G.box} material={body} position={[0, h / 2, 0]} scale={[w, h, d]} />
          <mesh geometry={G.pyr} material={roof} position={[0, h + 0.85, 0]} scale={[w * 1.28, 1.7, d * 1.28]} />
          <mesh geometry={G.box} material={M.dark} position={[0, 0.9, d / 2 + 0.02]} scale={[0.9, 1.8, 0.08]} />
          <mesh geometry={G.sph} material={M.lantern} position={[w / 2 + 0.1, h * 0.7, d / 2]} scale={0.14} />
        </>
      );
    case "mansion":
      return (
        <>
          <mesh geometry={G.box} material={body} position={[0, h / 2, 0]} scale={[w, h, d]} />
          <mesh geometry={G.box} material={roof} position={[0, h + 0.2, 0]} scale={[w * 1.1, 0.4, d * 1.1]} />
          <mesh geometry={G.dome} material={roof} position={[0, h + 0.4, 0]} scale={[w * 0.3, w * 0.3, w * 0.3]} />
          <mesh geometry={G.cone} material={M.gold} position={[0, h + 0.4 + w * 0.3 + 0.35, 0]} scale={[0.12, 0.7, 0.12]} />
          {[-0.38, -0.13, 0.13, 0.38].map((k) => (
            <mesh key={k} geometry={G.cyl} material={M.cream} position={[k * w, h / 2, d / 2 + 0.3]} scale={[0.16, h, 0.16]} />
          ))}
        </>
      );
    case "tower": {
      const h1 = h * 0.5, h2 = h * 0.3, h3 = h * 0.2;
      return (
        <>
          <mesh geometry={G.box} material={body} position={[0, h1 / 2, 0]} scale={[w, h1, d]} />
          <mesh geometry={G.box} material={roof} position={[0, h1, 0]} scale={[w * 1.18, 0.25, d * 1.18]} />
          <mesh geometry={G.box} material={body} position={[0, h1 + h2 / 2, 0]} scale={[w * 0.78, h2, d * 0.78]} />
          <mesh geometry={G.box} material={roof} position={[0, h1 + h2, 0]} scale={[w * 0.96, 0.25, d * 0.96]} />
          <mesh geometry={G.box} material={body} position={[0, h1 + h2 + h3 / 2, 0]} scale={[w * 0.55, h3, d * 0.55]} />
          <mesh geometry={G.cone} material={roof} position={[0, h + 1.3, 0]} scale={[w * 0.6, 2.6, w * 0.6]} />
          <mesh geometry={G.sph} material={M.lantern} position={[0, h1 + h2 + h3 * 0.5, w * 0.3]} scale={0.18} />
        </>
      );
    }
    case "temple": {
      const tiers = [
        [1, 1.8, 0.9], [0.82, 1.6, 2.6], [0.64, 1.5, 4.15], [0.46, 1.4, 5.6],
      ];
      return (
        <>
          {tiers.map(([k, th, cy], i) => (
            <React.Fragment key={i}>
              <mesh geometry={G.box} material={body} position={[0, cy, 0]} scale={[w * k, th, w * k]} />
              <mesh geometry={G.box} material={roof} position={[0, cy - th / 2, 0]} scale={[w * k * 1.1, 0.18, w * k * 1.1]} />
            </React.Fragment>
          ))}
          <mesh geometry={G.sph} material={M.gold} position={[0, 6.55, 0]} scale={0.32} />
          <mesh geometry={G.cone} material={M.gold} position={[0, 7.2, 0]} scale={[0.18, 0.8, 0.18]} />
        </>
      );
    }
    case "hall":
      return (
        <>
          <mesh geometry={G.box} material={M.stone} position={[0, 0.3, d / 2 + 1]} scale={[w * 0.5, 0.6, 2]} />
          <mesh geometry={G.box} material={body} position={[0, h / 2, 0]} scale={[w, h, d]} />
          <mesh geometry={G.box} material={roof} position={[0, h + 0.2, 0]} scale={[w * 1.06, 0.4, d * 1.06]} />
          <mesh geometry={G.dome} material={roof} position={[0, h + 0.4, 0]} scale={[3, 3, 3]} />
          <mesh geometry={G.cone} material={M.gold} position={[0, h + 4.2, 0]} scale={[0.18, 1.6, 0.18]} />
          {[-3.6, 3.6].map((x) => (
            <React.Fragment key={x}>
              <mesh geometry={G.dome} material={roof} position={[x, h + 0.4, 0]} scale={[1.4, 1.4, 1.4]} />
              <mesh geometry={G.cone} material={M.gold} position={[x, h + 2.2, 0]} scale={[0.1, 0.8, 0.1]} />
            </React.Fragment>
          ))}
          {[-4, -2.4, -0.8, 0.8, 2.4, 4].map((x) => (
            <mesh key={x} geometry={G.cyl} material={M.cream} position={[x, h / 2, d / 2 + 0.3]} scale={[0.22, h, 0.22]} />
          ))}
        </>
      );
    default:
      return (
        <>
          <mesh geometry={G.box} material={M.stone} position={[0, 0.5, 0]} scale={[w * 1.12, 1, d * 1.18]} />
          <mesh geometry={G.box} material={body} position={[0, 4.25, 0]} scale={[w * 0.92, 6.5, d * 0.88]} />
          <mesh geometry={G.box} material={roof} position={[0, 7.75, 0]} scale={[w * 0.96, 0.5, d * 0.92]} />
          <mesh geometry={G.cyl} material={M.cream} position={[0, 8.55, 0]} scale={[4.4, 1.6, 4.4]} />
          <mesh geometry={G.dome} material={roof} position={[0, 9.35, 0]} scale={[4.6, 4.6, 4.6]} />
          <mesh geometry={G.cone} material={M.gold} position={[0, 15, 0]} scale={[0.25, 2.2, 0.25]} />
          {[-6.2, 6.2].map((x) => (
            <React.Fragment key={x}>
              <mesh geometry={G.cyl} material={M.cream} position={[x, 8.1, 0]} scale={[2.2, 1, 2.2]} />
              <mesh geometry={G.dome} material={roof} position={[x, 8.6, 0]} scale={[2.4, 2.4, 2.4]} />
              <mesh geometry={G.cone} material={M.gold} position={[x, 11.4, 0]} scale={[0.12, 1.1, 0.12]} />
            </React.Fragment>
          ))}
          {[[7.5, 5.7], [-7.5, 5.7], [7.5, -5.7], [-7.5, -5.7]].map(([x, z]) => (
            <React.Fragment key={`${x}${z}`}>
              <mesh geometry={G.box} material={body} position={[x, 5.5, z]} scale={[2.4, 9, 2.4]} />
              <mesh geometry={G.box} material={roof} position={[x, 10.1, z]} scale={[2.9, 0.4, 2.9]} />
              <mesh geometry={G.cone} material={roof} position={[x, 11.6, z]} scale={[1.9, 2.6, 1.9]} />
              <mesh geometry={G.sph} material={M.lantern} position={[x, 8.6, z + Math.sign(z) * 1.25]} scale={0.22} />
            </React.Fragment>
          ))}
          <mesh geometry={G.box} material={M.stone} position={[0, 0.4, d * 0.59 + 1.5]} scale={[7, 0.8, 3.2]} />
          <mesh geometry={G.box} material={M.stone} position={[0, 0.8, d * 0.59 + 0.7]} scale={[5.4, 0.8, 1.8]} />
          {[-6.8, -5.1, -3.4, -1.7, 0, 1.7, 3.4, 5.1, 6.8].map((x) => (
            <mesh key={x} geometry={G.cyl} material={M.cream} position={[x, 4.3, d * 0.44 + 0.4]} scale={[0.28, 6.2, 0.28]} />
          ))}
          {[-3, 3].map((x) => (
            <React.Fragment key={x}>
              <mesh geometry={G.cyl} material={M.gold} position={[x, 12, d * 0.3]} scale={[0.08, 6, 0.08]} />
              <mesh geometry={G.box} material={M.banner} position={[x + 0.8, 13.9, d * 0.3]} scale={[1.6, 1.1, 0.05]} />
            </React.Fragment>
          ))}
        </>
      );
  }
}

const Building = memo(function Building({ b }) {
  const body = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: b.wall, roughness: 0.88, metalness: 0.04,
        emissive: new THREE.Color("#ffb45a"), emissiveMap: windowTex(), emissiveIntensity: 0.7,
      }),
    [b]
  );
  const roof = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: b.roofColor,
        roughness: b.goldRoof ? 0.38 : 0.8,
        metalness: b.goldRoof ? 0.75 : 0.05,
        emissive: new THREE.Color("#000000"),
      }),
    [b]
  );
  useEffect(() => {
    b.mats = {
      body, roof,
      bodyBase: new THREE.Color(b.wall),
      roofBase: new THREE.Color(b.roofColor),
    };
    return () => { body.dispose(); roof.dispose(); };
  }, [b, body, roof]);

  return (
    <group position={[b.x, 0, b.z]}>
      <BuildingMeshes b={b} body={body} roof={roof} />
    </group>
  );
});

/* ====================================================================
   PROTECTED ZONES — Vibhishana's home & the Ashoka Vatika
   ==================================================================== */

function Protected({ city }) {
  const G = geos();
  const M = mats();
  const wards = useRef([]);
  const vib = city.protectedZones.find((z) => z.type === "vibhishana");
  const ash = city.protectedZones.find((z) => z.type === "ashoka");

  const trees = useMemo(() => {
    const r = mulberry32(5);
    return Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2 + r() * 0.3;
      const rad = 5.2 + r() * 4.2;
      return { x: Math.cos(a) * rad, z: Math.sin(a) * rad, s: 0.8 + r() * 0.6 };
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    wards.current.forEach((w, i) => {
      if (!w) return;
      w.scale.setScalar(w.userData.base * (1 + Math.sin(t * 1.6 + i) * 0.02));
      w.material.opacity = 0.07 + 0.03 * Math.sin(t * 2 + i);
    });
  });

  const wardMat = (
    <meshBasicMaterial
      color="#9dffd8" transparent opacity={0.08} side={THREE.DoubleSide}
      depthWrite={false} blending={THREE.AdditiveBlending} fog={false}
    />
  );
  const ring = (r) => (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.07, 0]}>
      <ringGeometry args={[r - 0.45, r, 72]} />
      <meshBasicMaterial color="#9dffd8" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );

  return (
    <>
      <group position={[vib.x, 0, vib.z]}>
        <mesh geometry={G.box} material={M.cream} position={[0, 1.8, 0]} scale={[6, 3.6, 5]} />
        <mesh geometry={G.pyr} position={[0, 4.5, 0]} scale={[7.6, 2.2, 6.6]}>
          <meshStandardMaterial color="#2e8f7a" roughness={0.6} metalness={0.2} />
        </mesh>
        <mesh geometry={G.cone} material={M.gold} position={[0, 5.9, 0]} scale={[0.12, 0.7, 0.12]} />
        <mesh geometry={G.box} material={M.dark} position={[0, 0.9, 2.52]} scale={[1, 1.8, 0.08]} />
        {[[-3.6, 3], [3.6, 3], [-3.6, -3], [3.6, -3]].map(([x, z]) => (
          <mesh key={`${x}${z}`} geometry={G.sph} material={M.lantern} position={[x, 0.5, z]} scale={0.22} />
        ))}
        <mesh
          ref={(m) => { if (m) { m.userData.base = vib.radius; wards.current[0] = m; } }}
          geometry={G.dome} scale={vib.radius}
        >
          {wardMat}
        </mesh>
        {ring(vib.radius)}
        <pointLight color="#8dffd0" intensity={22 * LK} distance={18} decay={2} position={[0, 4, 0]} />
      </group>

      <group position={[ash.x, 0, ash.z]}>
        {trees.map((t, i) => (
          <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
            <mesh geometry={G.cyl} position={[0, 1.2, 0]} scale={[0.22, 2.4, 0.22]}>
              <meshStandardMaterial color="#4a3020" roughness={1} />
            </mesh>
            <mesh geometry={G.sph} position={[0, 3.1, 0]} scale={[1.6, 1.4, 1.6]}>
              <meshStandardMaterial color="#2f7a4a" roughness={0.9} />
            </mesh>
            <mesh geometry={G.sph} position={[0.5, 4, 0.2]} scale={[1.1, 1, 1.1]}>
              <meshStandardMaterial color="#3a8c55" roughness={0.9} />
            </mesh>
          </group>
        ))}
        <group>
          <mesh geometry={G.cyl} position={[0, 2, 0]} scale={[0.5, 4, 0.5]}>
            <meshStandardMaterial color="#5a3a24" roughness={1} />
          </mesh>
          <mesh geometry={G.sph} position={[0, 5, 0]} scale={[3.2, 2.6, 3.2]}>
            <meshStandardMaterial color="#2f7a4a" roughness={0.9} />
          </mesh>
          {[[1.8, 5.4, 0.8], [-1.6, 5.8, 1.2], [0.4, 6.6, -1.4], [-0.9, 4.4, -2], [2.1, 4.6, -1], [0, 6.2, 1.8]].map(([x, y, z], i) => (
            <mesh key={i} geometry={G.sph} position={[x, y, z]} scale={0.5}>
              <meshStandardMaterial color="#ff7a3a" emissive="#ff5a1a" emissiveIntensity={0.9} />
            </mesh>
          ))}
          <mesh geometry={G.cone} position={[0, 0.5, 2.2]} scale={[0.5, 1, 0.5]}>
            <meshStandardMaterial color="#e89a3a" emissive="#7a4a10" roughness={0.8} />
          </mesh>
          <mesh geometry={G.sph} position={[0, 1.15, 2.2]} scale={0.22}>
            <meshStandardMaterial color="#f0c090" roughness={0.7} />
          </mesh>
          <pointLight color="#ffc48a" intensity={26 * LK} distance={16} decay={2} position={[0, 3, 3]} />
        </group>
        <mesh
          ref={(m) => { if (m) { m.userData.base = ash.radius; wards.current[1] = m; } }}
          geometry={G.dome} scale={ash.radius}
        >
          {wardMat}
        </mesh>
        {ring(ash.radius)}
      </group>
    </>
  );
}

/* ====================================================================
   HANUMAN (flying), FLAMING TAIL, FIRE LIGHTS, BURST RINGS
   ==================================================================== */

function HanumanModel({ rig }) {
  const G = geos();
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9733f", roughness: 0.7 }), []);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f0b27a", roughness: 0.7 }), []);
  const cloth = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f0b03a", roughness: 0.6, emissive: "#5a3300" }), []);
  const aura = useRef();

  useEffect(() => () => { skin.dispose(); face.dispose(); cloth.dispose(); }, [skin, face, cloth]);

  return (
    <group ref={(g) => { if (g) rig.current.hero = g; }}>
      <group ref={(g) => { if (g) rig.current.model = g; }} scale={1.5}>
        <sprite ref={aura} position={[0, 1.2, -0.2]} scale={[6, 6, 1]}>
          <spriteMaterial map={glowTex()} color="#ffb04a" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        {/* torso */}
        <mesh material={skin} position={[0, 0.95, 0]} scale={[1.15, 1, 0.85]}>
          <capsuleGeometry args={[0.38, 0.7, 6, 14]} />
        </mesh>
        <mesh material={cloth} position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.36, 0.5, 0.56, 16]} />
        </mesh>
        <mesh material={M_GOLD()} position={[0, 0.7, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.4, 0.05, 8, 24]} />
        </mesh>
        <mesh material={M_GOLD()} position={[0, 1.38, 0.05]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.36, 0.045, 8, 24]} />
        </mesh>
        {/* head */}
        <mesh material={skin} position={[0, 1.66, 0]} geometry={G.sph} scale={0.36} />
        <mesh material={face} position={[0, 1.62, 0.2]} geometry={G.sph} scale={[0.26, 0.24, 0.18]} />
        <mesh material={face} position={[0, 1.55, 0.33]} geometry={G.sph} scale={[0.14, 0.1, 0.1]} />
        {[-0.12, 0.12].map((x) => (
          <React.Fragment key={x}>
            <mesh position={[x, 1.7, 0.31]} geometry={G.sph} scale={0.05}>
              <meshBasicMaterial color="#fff4d0" />
            </mesh>
            <mesh material={skin} position={[x * 2.7, 1.68, 0]} geometry={G.sph} scale={0.1} />
          </React.Fragment>
        ))}
        {/* crown */}
        <mesh material={M_GOLD()} position={[0, 2.05, 0]}>
          <coneGeometry args={[0.28, 0.5, 12]} />
        </mesh>
        <mesh material={M_GOLD()} position={[0, 1.9, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.3, 0.05, 8, 20]} />
        </mesh>
        {/* left arm: reaching forward (up in model space) */}
        <mesh material={skin} position={[-0.62, 1.95, 0.05]} rotation-z={0.12}>
          <capsuleGeometry args={[0.11, 0.75, 4, 10]} />
        </mesh>
        <mesh material={face} position={[-0.66, 2.5, 0.05]} geometry={G.sph} scale={0.13} />
        {/* right arm raising the gada */}
        <mesh material={skin} position={[0.62, 1.45, 0.2]} rotation-z={-0.5}>
          <capsuleGeometry args={[0.11, 0.6, 4, 10]} />
        </mesh>
        <mesh material={face} position={[0.82, 1.78, 0.35]} geometry={G.sph} scale={0.13} />
        <mesh material={M_GOLD()} position={[0.82, 2.25, 0.35]}>
          <cylinderGeometry args={[0.045, 0.045, 0.95, 8]} />
        </mesh>
        <mesh material={M_GOLD()} position={[0.82, 2.85, 0.35]} geometry={G.sph} scale={0.24} />
        {/* legs trailing */}
        {[-0.17, 0.17].map((x) => (
          <mesh key={x} material={skin} position={[x, -0.18, -0.12]} rotation-x={-0.45}>
            <capsuleGeometry args={[0.12, 0.62, 4, 10]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// tiny helper so JSX above can reuse the shared gold material
function M_GOLD() {
  return mats().gold;
}

function TailModel({ rig }) {
  const G = geos();
  const segs = useRef([]);
  const hotMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ff9a3a", emissive: "#ff5a10", emissiveIntensity: 1.6, roughness: 0.4 }),
    []
  );
  const furMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9622e", roughness: 0.75 }), []);
  useEffect(() => {
    rig.current.tail = segs.current;
    return () => { hotMat.dispose(); furMat.dispose(); };
  }, [rig, hotMat, furMat]);
  return (
    <>
      {Array.from({ length: TAIL_N }, (_, i) => {
        const k = i / (TAIL_N - 1);
        const r = (0.2 - k * 0.1) * 1.5;
        return (
          <mesh
            key={i}
            ref={(m) => { if (m) segs.current[i] = m; }}
            geometry={G.sph}
            material={i >= TAIL_N - 5 ? hotMat : furMat}
            scale={r}
          />
        );
      })}
      <pointLight
        ref={(l) => { if (l) rig.current.tailLight = l; }}
        color="#ff8030" intensity={34 * LK} distance={26} decay={2}
      />
    </>
  );
}

function FireLights({ rig }) {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <pointLight
          key={i}
          ref={(l) => { if (l) rig.current.lights[i] = l; }}
          color="#ff7a2a" intensity={0} distance={36} decay={2}
        />
      ))}
    </>
  );
}

function BurstRings({ rig }) {
  const mk = (idx, op) => (
    <mesh
      ref={(m) => { if (m) rig.current.rings[idx] = m; }}
      rotation-x={-Math.PI / 2} visible={false} frustumCulled={false} renderOrder={7}
    >
      <ringGeometry args={[0.9, 1, 96]} />
      <meshBasicMaterial color="#ff8a30" transparent opacity={op} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
  return (
    <>
      {mk(0, 0.9)}
      <mesh
        ref={(m) => { if (m) rig.current.rings[1] = m; }}
        rotation-x={-Math.PI / 2} visible={false} frustumCulled={false} renderOrder={7}
      >
        <ringGeometry args={[0.55, 1, 96]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

/* ====================================================================
   GAME WORLD — all simulation lives here (refs, no React state per frame)
   ==================================================================== */

function makeState(city, mode) {
  return {
    phase: mode === "play" ? "intro" : mode === "title" ? "title" : "over",
    time: 0,
    introT: INTRO_SECONDS,
    timeLeft: GAME_SECONDS,
    score: 0,
    burned: 0,
    total: city.total,
    combo: 0,
    comboT: 0,
    bestCombo: 0,
    lastMult: 1,
    burstCd: 0,
    slow: 0,
    shake: 0,
    camYaw: 0,
    camLift: 0,
    orbit: Math.random() * 6.28,
    hero: { x: 0, y: 26, z: 62, vx: 0, vz: 0, yaw: Math.PI, pitch: 0.3, roll: 0 },
    look: new THREE.Vector3(0, 6, 0),
    waves: [],
    pops: [],
    burning: [],
    hudT: 0,
    lightT: 0,
    titleLit: false,
    finished: false,
    spreadAnnounced: false,
    tail: Array.from({ length: TAIL_N }, () => new THREE.Vector3(0, 26, 62)),
  };
}

const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const V1 = new THREE.Vector3();
const V2 = new THREE.Vector3();
const V3 = new THREE.Vector3();

function World({ mode, city, inputRef, cb, popupLayerRef, mapRef }) {
  const rig = useRef({ lights: [], rings: [], tail: [] });
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const cbRef = useRef(cb);
  cbRef.current = cb;

  const fire = useMemo(() => new Pool(3600, { drag: 0.9, buoy: 3.2 }), []);
  const smoke = useMemo(() => new Pool(1100, { drag: 0.45, buoy: 1.6 }), []);
  const S = useRef(null);
  if (!S.current) S.current = makeState(city, mode);

  useEffect(() => {
    mapRef.current.city = city;
    mapRef.current.state = S.current;
    return () => {
      const layer = popupLayerRef.current;
      if (layer) layer.innerHTML = "";
    };
  }, [city, mapRef, popupLayerRef]);

  useFrame((state, rawDt) => {
    const s = S.current;
    const g = rig.current;
    const camera = state.camera;
    const mode = modeRef.current;
    const hero = s.hero;
    const input = inputRef.current;
    const W = cbRef.current;
    const rnd = Math.random;

    let dt = Math.min(rawDt, 0.05);
    if (s.slow > 0) { s.slow -= dt; dt *= 0.35; }
    fire.timeScale = smoke.timeScale = s.slow > 0 ? 0.35 : 1;
    s.time += dt;

    if (mode === "end" && s.phase !== "over") s.phase = "over";

    /* ---------- helpers ---------- */
    const addPop = (text, x, y, z, cls) => {
      const layer = popupLayerRef.current;
      if (!layer) return;
      if (s.pops.length > 36) {
        const old = s.pops.shift();
        if (old.el.parentNode) old.el.parentNode.removeChild(old.el);
      }
      const el = document.createElement("div");
      el.className = `ld-pop ${cls || ""}`;
      el.textContent = text;
      layer.appendChild(el);
      s.pops.push({ el, x, y, z, t: 0 });
    };

    const emitFire = (x, y, z, sc = 1) =>
      fire.emit(x + (rnd() - 0.5) * 1.1 * sc, y, z + (rnd() - 0.5) * 1.1 * sc,
        (rnd() - 0.5) * 1.2, 1.6 + rnd() * 2.4, (rnd() - 0.5) * 1.2,
        0.7 + rnd() * 0.8, (1.3 + rnd() * 1.1) * sc, 0);
    const emitEmber = (x, y, z, spread = 3, up = 5) =>
      fire.emit(x, y, z, (rnd() - 0.5) * spread * 2, 2 + rnd() * up, (rnd() - 0.5) * spread * 2,
        1.4 + rnd() * 1.4, 0.2 + rnd() * 0.12, 1);
    const emitGlow = (x, y, z, sc) =>
      fire.emit(x, y, z, 0, 0.4, 0, 1.4 + rnd() * 0.6, (5 + rnd() * 3) * sc, 2);
    const emitSmoke = (x, y, z, sc) =>
      smoke.emit(x + (rnd() - 0.5), y, z + (rnd() - 0.5), (rnd() - 0.5) * 1.5 + 0.8,
        1.8 + rnd() * 1.6, (rnd() - 0.5) * 1.5, 2.6 + rnd() * 1.8, (2.4 + rnd() * 1.6) * sc, 0);

    const scaleOf = (b) => (b.type === "palace" ? 1.8 : b.type === "hall" ? 1.3 : b.type === "tower" ? 1.1 : 1);

    const ignite = (b, how) => {
      if (b.burning || b.protected) return;
      b.burning = true;
      b.burnT = 0;
      b.intensity = 0;
      if (b.mats) {
        b.mats.body.emissiveMap = null;
        b.mats.body.needsUpdate = true;
      }
      b.spreadT = 6 + rnd() * 5;
      s.burning.push(b);
      s.burned += 1;
      const scoring = s.phase === "run";
      let pts = 0;
      if (scoring) {
        if (how === "spread") {
          pts = Math.round(b.score * 0.5);
        } else {
          s.combo += 1;
          s.comboT = 3;
          s.bestCombo = Math.max(s.bestCombo, s.combo);
          const mult = Math.min(5, 1 + Math.floor(s.combo / 2));
          pts = b.score * mult;
          if (mult > s.lastMult && mult >= 3) W.onEvent({ kind: "combo", text: `COMBO ×${mult}` });
          s.lastMult = mult;
        }
        s.score += pts;
        addPop(`+${pts}`, b.x, b.h + 3, b.z, b.type === "palace" ? "ld-pop--big" : how === "spread" ? "ld-pop--small" : "");
        if (b.type === "palace") {
          s.timeLeft += 6;
          W.onEvent({ kind: "palace", text: "RAVANA'S PALACE BURNS · +6s" });
          s.shake = 1.2;
          addPop("+6s", b.x, b.h + 8, b.z, "ld-pop--time");
        } else if (b.type === "hall") {
          W.onEvent({ kind: "hall", text: "ROYAL HALL IGNITED" });
          s.shake = Math.max(s.shake, 0.4);
        } else if (b.type === "temple" && how !== "spread") {
          W.onEvent({ kind: "temple", text: "TEMPLE IGNITED" });
        }
      }
      // ignition burst
      const sc = scaleOf(b);
      b.fp.forEach((p) => {
        for (let k = 0; k < 6; k++) emitFire(b.x + p.x, p.y, b.z + p.z, sc);
        for (let k = 0; k < 5; k++) emitEmber(b.x + p.x, p.y, b.z + p.z, 4, 6);
      });
    };

    const sparkTrail = (a, c) => {
      const vx = (c.x - a.x) / 0.7, vz = (c.z - a.z) / 0.7;
      for (let k = 0; k < 14; k++) {
        fire.emit(a.x, a.h + 2, a.z, vx + (rnd() - 0.5), 6 + rnd() * 3, vz + (rnd() - 0.5), 0.7, 0.28, 1);
      }
    };

    const finish = () => {
      if (s.finished) return;
      s.finished = true;
      s.phase = "over";
      s.slow = 1.4;
      const complete = s.burned >= s.total;
      const bonus = complete ? Math.round(Math.max(0, s.timeLeft) * 20) : 0;
      s.score += bonus;
      W.onFinish({
        score: s.score, burned: s.burned, total: s.total, bestCombo: s.bestCombo,
        bonus, complete, timeLeft: Math.max(0, Math.ceil(s.timeLeft)),
        palace: city.palace.burning,
      });
    };

    /* ---------- title: light a few fires for atmosphere ---------- */
    if (mode === "title" && !s.titleLit && s.time > 0.8) {
      s.titleLit = true;
      [city.palace.neighbors[0], city.buildings[8], city.buildings[20], city.buildings[33]].forEach((b) => {
        if (b) ignite(b, "spread");
      });
    }

    /* ---------- phase flow ---------- */
    if (s.phase === "intro") {
      s.introT -= dt;
      if (s.introT <= 0) { s.introT = 0; s.phase = "run"; }
    } else if (s.phase === "run") {
      s.timeLeft -= dt;
      if (s.comboT > 0) {
        s.comboT -= dt;
        if (s.comboT <= 0) { s.combo = 0; s.lastMult = 1; }
      }
      if (s.burstCd > 0) s.burstCd = Math.max(0, s.burstCd - dt);
      if (s.timeLeft <= 0 || s.burned >= s.total) finish();
    }

    /* ---------- hero movement ---------- */
    const controllable = mode === "play" && s.phase === "run";
    let boosting = false;
    if (controllable) {
      const k = input.keys;
      let ix = (k.arrowright || k.d ? 1 : 0) - (k.arrowleft || k.a ? 1 : 0) + input.joy.x;
      let iz = (k.arrowdown || k.s ? 1 : 0) - (k.arrowup || k.w ? 1 : 0) + input.joy.y;
      const len = Math.hypot(ix, iz);
      if (len > 1) { ix /= len; iz /= len; }
      // cursor steers the camera: hold it toward a screen edge to turn,
      // move it up / down to tilt the view. Touch: drag on the scene.
      const DEAD = 0.18;
      const cx = input.cur.x;
      const turn = Math.abs(cx) > DEAD ? Math.sign(cx) * ((Math.abs(cx) - DEAD) / (1 - DEAD)) : 0;
      s.camYaw -= turn * Math.abs(turn) * dt * 2.3 + input.drag * 0.0065;
      input.drag = 0;
      s.camLiftT = input.cur.y * 10;
      boosting = !!(k.shift || input.boost) && len > 0.1;
      const sn = Math.sin(s.camYaw), cs = Math.cos(s.camYaw);
      const wx = ix * cs + iz * sn;
      const wz = -ix * sn + iz * cs;
      const spd = boosting ? BOOST : CRUISE;
      const f = Math.min(1, dt * (len > 0.05 ? 5 : 3));
      hero.vx += (wx * spd - hero.vx) * f;
      hero.vz += (wz * spd - hero.vz) * f;
      hero.x += hero.vx * dt;
      hero.z += hero.vz * dt;
      const rr = Math.hypot(hero.x, hero.z);
      if (rr > HERO_BOUND) {
        hero.x *= HERO_BOUND / rr; hero.z *= HERO_BOUND / rr;
      }
    } else if (mode === "title" || mode === "end") {
      const R = mode === "title" ? 30 : 21;
      s.orbit += dt * (mode === "title" ? 0.28 : 0.2);
      const nx = Math.cos(s.orbit) * R, nz = Math.sin(s.orbit) * R;
      hero.vx = (nx - hero.x) / Math.max(dt, 0.001);
      hero.vz = (nz - hero.z) / Math.max(dt, 0.001);
      if (!isFinite(hero.vx) || Math.hypot(hero.vx, hero.vz) > 60) { hero.vx = hero.vz = 0; }
      hero.x = nx; hero.z = nz;
    } else if (s.phase === "intro") {
      const q = clamp01(1 - s.introT / INTRO_SECONDS);
      const e = q * q * (3 - 2 * q);
      const nz = 62 - e * 16;
      hero.vz = (nz - hero.z) / Math.max(dt, 0.001);
      hero.vx = 0;
      hero.z = nz; hero.x = 0;
    } else {
      hero.vx *= Math.exp(-dt * 2); hero.vz *= Math.exp(-dt * 2);
      hero.x += hero.vx * dt; hero.z += hero.vz * dt;
    }

    // altitude follows the rooftops
    let top = 0;
    for (const b of city.buildings) {
      const dx = hero.x - b.x, dz = hero.z - b.z;
      if (dx * dx + dz * dz < (b.radius + 2.2) * (b.radius + 2.2)) top = Math.max(top, b.h);
    }
    let targetY = Math.max(4.4, top + 3.2) + (boosting ? 1.2 : 0) + Math.sin(s.time * 2) * 0.25;
    if (mode === "title") targetY = 15 + Math.sin(s.time * 0.6) * 2;
    if (mode === "end") targetY = 17;
    if (s.phase === "intro") targetY = 9;
    hero.y += (targetY - hero.y) * Math.min(1, dt * 3.2);

    const sp = Math.hypot(hero.vx, hero.vz);
    let turn = 0;
    if (sp > 1.2) {
      const dYaw = wrapAngle(Math.atan2(hero.vx, hero.vz) - hero.yaw);
      hero.yaw += dYaw * Math.min(1, dt * 8);
      turn = dYaw * 8;
    }
    hero.roll += (clamp01(Math.abs(turn) * 0.12) * -Math.sign(turn) * 0.6 - hero.roll) * Math.min(1, dt * 6);
    hero.pitch += (0.22 + Math.min(1, sp / BOOST) * 0.95 - hero.pitch) * Math.min(1, dt * 6);

    if (g.hero) {
      g.hero.position.set(hero.x, hero.y, hero.z);
      g.hero.rotation.y = hero.yaw;
      if (g.model) {
        g.model.rotation.x = hero.pitch;
        g.model.rotation.z = hero.roll;
        g.model.position.y = Math.sin(s.time * 3) * 0.12;
      }
      g.hero.updateMatrixWorld(true);
    }

    /* ---------- tail (rope follow) ---------- */
    if (g.model) {
      const root = g.model.localToWorld(V1.set(0, -0.55, -0.15));
      s.tail[0].copy(root);
      const segLen = 0.48;
      for (let i = 1; i < TAIL_N; i++) {
        const p = s.tail[i], q = s.tail[i - 1];
        V2.copy(p).sub(q);
        const dist = V2.length() || 0.001;
        V2.multiplyScalar(segLen / dist);
        p.copy(q).add(V2);
        p.y += dt * (0.5 + i * 0.12);
        p.x += Math.sin(s.time * 7 - i * 0.6) * 0.012 * i;
      }
    }
    const tip = s.tail[TAIL_N - 1];
    g.tail.forEach((m, i) => { if (m && s.tail[i]) m.position.copy(s.tail[i]); });
    if (g.tailLight) {
      g.tailLight.position.copy(tip);
      g.tailLight.intensity = (30 + Math.sin(s.time * 20) * 8) * LK;
    }

    // tail flame fx
    const tailRate = s.phase === "run" || mode !== "play" ? 58 : 40;
    s._tacc = (s._tacc || 0) + dt * tailRate;
    while (s._tacc >= 1) {
      s._tacc -= 1;
      emitFire(tip.x, tip.y + 0.2, tip.z, 1.15);
      if (rnd() < 0.3) emitEmber(tip.x, tip.y, tip.z, 2.2, 4);
    }
    for (let i = TAIL_N - 4; i < TAIL_N - 1; i++) {
      if (rnd() < dt * 14) emitFire(s.tail[i].x, s.tail[i].y, s.tail[i].z, 0.6);
    }

    /* ---------- ignition by contact ---------- */
    if (s.phase === "run") {
      for (const b of city.buildings) {
        if (b.burning || b.protected) continue;
        const dd = Math.hypot(hero.x - b.x, hero.z - b.z);
        if (dd < b.radius + REACH && hero.y < b.h + 6) { ignite(b, "touch"); continue; }
        for (let i = 3; i < TAIL_N; i += 3) {
          const p = s.tail[i];
          if (Math.hypot(p.x - b.x, p.z - b.z) < b.radius + 0.9 && p.y < b.h + 3.4) {
            ignite(b, "tail");
            break;
          }
        }
      }
    }

    /* ---------- fire burst ---------- */
    if (input.burst) {
      input.burst = false;
      if (s.phase === "run" && s.burstCd <= 0) {
        s.burstCd = BURST_COOLDOWN;
        s.waves.push({ x: hero.x, z: hero.z, r: 0 });
        s.shake = Math.max(s.shake, 0.9);
        W.onEvent({ kind: "burst" });
      }
    }
    for (let wi = s.waves.length - 1; wi >= 0; wi--) {
      const wv = s.waves[wi];
      wv.r += BURST_SPEED * dt;
      for (const b of city.buildings) {
        if (b.burning || b.protected) continue;
        const d0 = Math.hypot(b.x - wv.x, b.z - wv.z) - b.radius * 0.5;
        if (d0 <= wv.r && d0 <= BURST_RADIUS) ignite(b, "burst");
      }
      const steps = Math.min(60, 8 + Math.floor(wv.r * 2.2));
      for (let k = 0; k < steps; k++) {
        const a = rnd() * Math.PI * 2;
        const x = wv.x + Math.cos(a) * wv.r, z = wv.z + Math.sin(a) * wv.r;
        fire.emit(x, 0.8, z, Math.cos(a) * 3, 2 + rnd() * 3, Math.sin(a) * 3, 0.5 + rnd() * 0.4, 1.4 + rnd(), 0);
        if (rnd() < 0.3) emitEmber(x, 1, z, 3, 6);
      }
      if (wv.r > BURST_RADIUS + 4) s.waves.splice(wi, 1);
    }
    const wv0 = s.waves[0];
    [0, 1].forEach((ri) => {
      const m = g.rings[ri];
      if (!m) return;
      if (wv0) {
        m.visible = true;
        m.position.set(wv0.x, 1.1, wv0.z);
        const sc = Math.max(0.01, ri === 0 ? wv0.r : wv0.r * 0.93);
        m.scale.set(sc, sc, sc);
        m.material.opacity = (ri === 0 ? 0.9 : 0.25) * clamp01(1 - wv0.r / (BURST_RADIUS + 4));
      } else m.visible = false;
    });

    /* ---------- burning buildings ---------- */
    const camFocus = mode === "play" ? hero : { x: 0, z: 0 };
    for (const b of s.burning) {
      b.burnT += dt;
      b.intensity = Math.min(1, b.burnT / 2.4) * (b.burnT > 16 ? 0.72 : 1);
      const ch = clamp01((b.burnT - 3) / 12);
      if (b.mats) {
        const fl = 0.78 + 0.22 * Math.sin(s.time * 9 + b.id * 3.1) + 0.1 * Math.sin(s.time * 23 + b.id);
        b.mats.body.color.copy(b.mats.bodyBase).lerp(CHAR, ch * 0.82);
        b.mats.body.emissive.setRGB(1.0, 0.36, 0.08);
        b.mats.body.emissiveIntensity = (0.25 + b.intensity * 0.95 * fl) * (1 - ch * 0.6);
        b.mats.roof.color.copy(b.mats.roofBase).lerp(CHAR, ch * 0.9);
        b.mats.roof.emissive.setRGB(1.0, 0.3, 0.06);
        b.mats.roof.emissiveIntensity = b.intensity * 1.15 * fl * (1 - ch * 0.6);
      }

      const sc = scaleOf(b);
      const near = Math.hypot(b.x - camFocus.x, b.z - camFocus.z) < 60 ? 1 : 0.5;
      const rate = 8 * b.intensity * near * (ch > 0.9 ? 0.55 : 1);
      for (const p of b.fp) {
        p.acc += dt * rate;
        while (p.acc >= 1) {
          p.acc -= 1;
          emitFire(b.x + p.x, p.y, b.z + p.z, sc);
        }
      }
      b.sm = (b.sm || 0) + dt;
      if (b.sm > 0.14 && b.burnT > 1.2) {
        b.sm = 0;
        const p = b.fp[(rnd() * b.fp.length) | 0];
        emitSmoke(b.x + p.x, p.y + 1, b.z + p.z, sc);
        if (rnd() < 0.3) emitGlow(b.x + p.x, p.y + 0.5, b.z + p.z, sc);
        if (b.intensity > 0.7 && rnd() < 0.35) emitEmber(b.x + p.x, p.y + 0.5, b.z + p.z, 3, 5);
      }

      // spreading
      if (b.burnT > 2.2) {
        b.spreadT -= dt;
        if (b.spreadT <= 0) {
          b.spreadT = 10 + rnd() * 7;
          const cand = b.neighbors.filter((n) => !n.burning);
          if (cand.length) {
            const n = cand[(rnd() * cand.length) | 0];
            ignite(n, "spread");
            sparkTrail(b, n);
            if (!s.spreadAnnounced && s.phase === "run") {
              s.spreadAnnounced = true;
              W.onEvent({ kind: "chain", text: "THE FIRE SPREADS ON ITS OWN" });
            }
          }
        }
      }
    }

    // dynamic fire lights
    s.lightT -= dt;
    if (s.lightT <= 0) {
      s.lightT = 0.25;
      const list = s.burning
        .map((b) => ({ b, d: (b.x - camFocus.x) ** 2 + (b.z - camFocus.z) ** 2 }))
        .sort((a, c) => a.d - c.d)
        .slice(0, g.lights.length);
      g.lights.forEach((l, i) => { if (l) l.userData.target = list[i] ? list[i].b : null; });
    }
    g.lights.forEach((l, i) => {
      if (!l) return;
      const b = l.userData.target;
      if (b) {
        l.position.set(b.x, b.h + 3, b.z);
        const f = 0.8 + 0.3 * Math.sin(s.time * 11 + i * 2.3) + 0.1 * Math.sin(s.time * 27 + i);
        l.intensity += (90 * LK * b.intensity * f - l.intensity) * Math.min(1, dt * 10);
      } else {
        l.intensity += (0 - l.intensity) * Math.min(1, dt * 6);
      }
    });

    /* ---------- dharma: protected zones ---------- */
    if (s.phase === "run") {
      city.protectedZones.forEach((z) => {
        if (!z.seen && Math.hypot(hero.x - z.x, hero.z - z.z) < z.radius + 5) {
          z.seen = true;
          W.onEvent({ kind: "dharma", text: `${z.label} IS SPARED BY DHARMA` });
        }
      });
    }

    /* ---------- camera ---------- */
    s.shake *= Math.exp(-dt * 6);
    const sh = s.shake;
    let targetFov = 50;
    if (mode === "title" || mode === "end") {
      const R = mode === "title" ? 64 : 46;
      const a = s.time * (mode === "title" ? 0.05 : 0.04) + 0.6;
      camera.position.set(Math.cos(a) * R, (mode === "title" ? 24 : 26) + Math.sin(s.time * 0.2) * 3, Math.sin(a) * R);
      s.look.lerp(V3.set(0, 6, 0), 1 - Math.exp(-dt * 3));
      camera.lookAt(s.look);
    } else {
      const D = 17 + (boosting ? 4 : 0);
      s.camLift += ((s.camLiftT || 0) - s.camLift) * Math.min(1, dt * 4);
      V1.set(
        hero.x + Math.sin(s.camYaw) * D + hero.vx * 0.25,
        Math.max(5, 13 + hero.y * 0.8 + s.camLift),
        hero.z + Math.cos(s.camYaw) * D + hero.vz * 0.25
      );
      V2.set(hero.x + hero.vx * 0.3, hero.y * 0.6, hero.z + hero.vz * 0.3);
      if (s.phase === "intro") {
        const q = clamp01(1 - s.introT / INTRO_SECONDS);
        const e = q * q * (3 - 2 * q);
        V3.set(70, 60, 100).lerp(V1, e);
        camera.position.copy(V3);
        s.look.set(0, 8, 0).lerp(V2, e);
        camera.lookAt(s.look);
      } else {
        camera.position.lerp(V1, 1 - Math.exp(-dt * 5));
        s.look.lerp(V2, 1 - Math.exp(-dt * 8));
        camera.lookAt(s.look);
        if (s.phase === "run") targetFov = boosting ? 60 : 52;
      }
    }
    if (sh > 0.01) {
      camera.position.x += (rnd() - 0.5) * sh * 0.8;
      camera.position.y += (rnd() - 0.5) * sh * 0.8;
    }
    if (Math.abs(camera.fov - targetFov) > 0.02) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 4);
      camera.updateProjectionMatrix();
    }

    /* ---------- environment reacts to the fire ---------- */
    const ratio = s.total ? s.burned / s.total : 0;
    if (g.skyGroup) g.skyGroup.position.copy(camera.position);
    if (g.skyMat) {
      const u = g.skyMat.uniforms.uFire;
      u.value += (ratio - u.value) * Math.min(1, dt * 1.5);
    }
    if (state.scene.fog) state.scene.fog.color.lerpColors(FOG_A, FOG_B, ratio);
    if (g.ocean && g.ocean.material.bumpMap) g.ocean.material.bumpMap.offset.x += dt * 0.012;

    /* ---------- popups (DOM, projected from world) ---------- */
    if (s.pops.length) {
      const cw = state.gl.domElement.clientWidth, ch2 = state.gl.domElement.clientHeight;
      for (let i = s.pops.length - 1; i >= 0; i--) {
        const p = s.pops[i];
        p.t += rawDt;
        if (p.t > 1.3) {
          if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
          s.pops.splice(i, 1);
          continue;
        }
        V1.set(p.x, p.y + p.t * 3, p.z).project(camera);
        if (V1.z > 1) { p.el.style.opacity = 0; continue; }
        p.el.style.transform = `translate(${(V1.x * 0.5 + 0.5) * cw}px, ${(-V1.y * 0.5 + 0.5) * ch2}px) translate(-50%, -50%)`;
        p.el.style.opacity = String(1 - (p.t / 1.3) ** 2);
      }
    }

    /* ---------- HUD snapshot (10 Hz) ---------- */
    s.hudT -= rawDt;
    if (s.hudT <= 0) {
      s.hudT = 0.1;
      W.onHud({
        t: Math.max(0, Math.ceil(s.timeLeft)),
        score: s.score,
        burned: s.burned,
        total: s.total,
        combo: s.combo,
        mult: Math.min(5, 1 + Math.floor(s.combo / 2)),
        comboFrac: s.comboT > 0 ? clamp01(s.comboT / 3) : 0,
        cd: s.burstCd,
        intro: s.phase === "intro" ? Math.ceil(s.introT) : 0,
        go: s.phase === "run" && s.timeLeft > GAME_SECONDS - 0.9 + 0 && s.timeLeft <= GAME_SECONDS,
        boost: boosting,
      });
    }
  });

  const A = AK;
  return (
    <>
      <color attach="background" args={["#0b0918"]} />
      <fog attach="fog" args={["#1c1226", 50, 240]} />
      <ambientLight intensity={0.36 * A} color="#8a7ab0" />
      <hemisphereLight args={["#5a4a80", "#2a1a14", 0.42 * A]} />
      <directionalLight position={[-60, 90, -40]} intensity={0.6 * A} color="#9ab4ff" />

      <SkyGroup rig={rig} />
      <Ocean rig={rig} />
      <Island />
      <Walls />
      <Mountains />
      {city.buildings.map((b) => (
        <Building key={b.id} b={b} />
      ))}
      <Protected city={city} />
      <HanumanModel rig={rig} />
      <TailModel rig={rig} />
      <FireLights rig={rig} />
      <BurstRings rig={rig} />
      <ParticleLayer pool={smoke} smoke />
      <ParticleLayer pool={fire} />
    </>
  );
}

class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.error("Lanka Dahan 3D scene failed:", err);
  }
  render() {
    return this.state.failed ? (
      <div className="ld-fallback">
        <Flame size={28} />
        <p>The 3D scene could not start on this device.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}

/* ====================================================================
   UI: MINIMAP, JOYSTICK, HUD, SCREENS
   ==================================================================== */

function Minimap({ mapRef }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    const ctx = c.getContext("2d");
    const SZ = c.width;
    const R = SZ / 2;
    const sc = R / 84;
    let raf = 0;
    let last = 0;
    const draw = (ts) => {
      raf = requestAnimationFrame(draw);
      if (ts - last < 60) return;
      last = ts;
      const m = mapRef.current;
      ctx.clearRect(0, 0, SZ, SZ);
      if (!m.city || !m.state) return;
      const st = m.state;
      ctx.save();
      ctx.translate(R, R);
      ctx.rotate(st.camYaw);
      ctx.fillStyle = "rgba(20,12,16,0.92)";
      ctx.beginPath(); ctx.arc(0, 0, 80 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(226,184,111,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, WALL_R * sc, 0, Math.PI * 2); ctx.stroke();
      m.city.buildings.forEach((b) => {
        const sz = Math.max(2.2, b.radius * sc * 1.15);
        if (b.burning) {
          const f = 0.7 + 0.3 * Math.sin(ts * 0.012 + b.id);
          ctx.fillStyle = b.burnT > 14 ? "#6a2a1c" : `rgba(255,${Math.round(110 + 60 * f)},40,1)`;
        } else ctx.fillStyle = b.type === "palace" ? "#f0cf88" : "#b8925a";
        ctx.fillRect(b.x * sc - sz / 2, b.z * sc - sz / 2, sz, sz);
      });
      m.city.protectedZones.forEach((z) => {
        ctx.strokeStyle = "#7dffc8";
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(z.x * sc, z.z * sc, z.radius * sc * 0.8, 0, Math.PI * 2); ctx.stroke();
      });
      const h = st.hero;
      ctx.translate(h.x * sc, h.z * sc);
      ctx.rotate(Math.PI - h.yaw);
      ctx.fillStyle = "#fff1c8";
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4.5, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-4.5, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mapRef]);
  return <canvas ref={ref} className="ld-minimap" width={168} height={168} />;
}

function Joystick({ inputRef }) {
  const knob = useRef(null);
  const base = useRef(null);
  const active = useRef(false);
  const MAXR = 46;
  const move = (e) => {
    const r = base.current.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > MAXR) { dx = (dx / l) * MAXR; dy = (dy / l) * MAXR; }
    knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    inputRef.current.joy = { x: dx / MAXR, y: dy / MAXR };
  };
  const end = () => {
    active.current = false;
    knob.current.style.transform = "translate(0,0)";
    inputRef.current.joy = { x: 0, y: 0 };
  };
  return (
    <div
      ref={base}
      className="ld-joy"
      onPointerDown={(e) => { active.current = true; e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
      onPointerMove={(e) => active.current && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={knob} className="ld-joy-knob" />
    </div>
  );
}

const CAMERA = { fov: 50, near: 0.5, far: 900, position: [0, 40, 80] };
const GL = { antialias: true, powerPreference: "high-performance" };
const DPR = [1, 1.75];

const Scene = memo(function Scene({ mode, city, inputRef, cb, popupRef, mapRef }) {
  return (
    <SafeBoundary>
      <Canvas dpr={DPR} camera={CAMERA} gl={GL}>
        <World
          mode={mode}
          city={city}
          inputRef={inputRef}
          cb={cb}
          popupLayerRef={popupRef}
          mapRef={mapRef}
        />
      </Canvas>
    </SafeBoundary>
  );
});

const INITIAL_HUD = {
  t: GAME_SECONDS, score: 0, burned: 0, total: 0, combo: 0, mult: 1,
  comboFrac: 0, cd: 0, intro: 0, go: false, boost: false,
};

const RANKS = [
  [1, "LANKA DAHAN", "Not a single golden roof was left unburnt. The warning could not be clearer."],
  [0.75, "INFERNO", "Half the skyline is ash. Ravana's guards flee in every direction."],
  [0.5, "BLAZE", "Fire races through the streets of Lanka. The city will not forget this night."],
  [0.25, "EMBER", "The flames have taken hold, though much of Lanka still stands."],
  [0, "SPARK", "A first spark in the night. Lanka has been warned."],
];
const rankOf = (ratio) => RANKS.find(([min]) => ratio >= min - 1e-9) || RANKS[RANKS.length - 1];

function readBest() {
  if (typeof window === "undefined") return 0;
  try { return parseInt(window.localStorage.getItem(BEST_KEY) || "0", 10) || 0; } catch (e) { return 0; }
}
function writeBest(v) {
  try { window.localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* ignore */ }
}

export default function LankaDahanGame({ onComplete, onExit }) {
  const [screen, setScreen] = useState("title");
  const [runId, setRunId] = useState(0);
  const [hud, setHud] = useState(INITIAL_HUD);
  const [feed, setFeed] = useState([]);
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState(0);
  const [best, setBest] = useState(() => readBest());
  const [touch, setTouch] = useState(false);

  const inputRef = useRef({ keys: {}, joy: { x: 0, y: 0 }, cur: { x: 0, y: 0 }, drag: 0, burst: false, boost: false });
  const popupRef = useRef(null);
  const dragRef = useRef(null);
  const mapRef = useRef({});
  const timers = useRef([]);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const city = useMemo(() => generateCity(), [runId]);

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const later = useCallback((fn, ms) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);

  const onHud = useCallback((h) => setHud(h), []);
  const onEvent = useCallback(
    (ev) => {
      if (ev.kind === "burst") { setFlash((f) => f + 1); return; }
      const id = Math.random();
      setFeed((f) => [...f.slice(-3), { id, ...ev }]);
      later(() => setFeed((f) => f.filter((x) => x.id !== id)), 3600);
    },
    [later]
  );
  const onFinish = useCallback(
    (r) => {
      const prev = readBest();
      const isBest = r.score > prev;
      if (isBest) writeBest(r.score);
      setBest(Math.max(prev, r.score));
      setResult({ ...r, isBest });
      later(() => setScreen("end"), 1500);
    },
    [later]
  );
  const cb = useMemo(() => ({ onHud, onEvent, onFinish }), [onHud, onEvent, onFinish]);

  const startGame = useCallback(() => {
    inputRef.current = { keys: {}, joy: { x: 0, y: 0 }, cur: { x: 0, y: 0 }, drag: 0, burst: false, boost: false };
    setRunId((r) => r + 1);
    setHud(INITIAL_HUD);
    setFeed([]);
    setResult(null);
    setScreen("play");
    setFlash((f) => f + 1);
  }, []);

  const goTitle = useCallback(() => {
    setRunId((r) => r + 1);
    setHud(INITIAL_HUD);
    setFeed([]);
    setResult(null);
    setScreen("title");
  }, []);

  const handleExit = useCallback(() => {
    if (onExit) onExit();
    else if (onComplete) onComplete();
    else goTitle();
  }, [onExit, onComplete, goTitle]);

  /* keyboard */
  useEffect(() => {
    if (screen !== "play") return undefined;
    const down = (e) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === " " && !e.repeat) inputRef.current.burst = true;
      inputRef.current.keys[k] = true;
    };
    const up = (e) => { inputRef.current.keys[e.key.toLowerCase()] = false; };
    const blur = () => { inputRef.current.keys = {}; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen]);

  const mode = screen === "play" ? "play" : screen === "end" ? "end" : "title";
  const ratio = hud.total ? hud.burned / hud.total : 0;
  const urgent = screen === "play" && hud.t <= 10 && hud.intro === 0;
  const mm = String(Math.floor(hud.t / 60));
  const ss = String(hud.t % 60).padStart(2, "0");
  const ready = hud.cd <= 0;
  const rank = result ? rankOf(result.total ? result.burned / result.total : 0) : RANKS[RANKS.length - 1];

  return (
    <div
      className="ld-root"
      onPointerDown={(e) => {
        if (screenRef.current !== "play" || e.target.tagName !== "CANVAS") return;
        if (e.pointerType === "mouse") inputRef.current.burst = true;
        else dragRef.current = { id: e.pointerId, x: e.clientX };
      }}
      onPointerMove={(e) => {
        if (screenRef.current !== "play") return;
        if (e.pointerType === "mouse") {
          const r = e.currentTarget.getBoundingClientRect();
          inputRef.current.cur = {
            x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
            y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)),
          };
        } else if (dragRef.current && dragRef.current.id === e.pointerId) {
          inputRef.current.drag += e.clientX - dragRef.current.x;
          dragRef.current.x = e.clientX;
        }
      }}
      onPointerUp={() => { dragRef.current = null; }}
      onPointerCancel={() => { dragRef.current = null; }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") inputRef.current.cur = { x: 0, y: 0 };
      }}
    >
      <div className="ld-canvas-wrap">
        <Scene
          key={runId}
          mode={mode}
          city={city}
          inputRef={inputRef}
          cb={cb}
          popupRef={popupRef}
          mapRef={mapRef}
        />
      </div>

      <div ref={popupRef} className="ld-pops" />
      <div className="ld-heat" style={{ opacity: Math.min(0.75, ratio * 0.9) }} />
      <div className="ld-vignette" />

      {flash > 0 && (
        <motion.div
          key={flash}
          className="ld-flash"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
        />
      )}

      {(onExit || onComplete || screen !== "title") && (
        <button className="ld-exit" onClick={handleExit} aria-label="Exit" title="Exit">
          <X size={17} />
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* ---------------- TITLE ---------------- */}
        {screen === "title" && (
          <motion.div
            key="title"
            className="ld-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.6 }}
          >
            <motion.span className="ld-eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9 }}>
              <Sparkles size={14} /> SUNDARA KANDA · CHAPTER XII
            </motion.span>
            <motion.p className="ld-roman" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}>III</motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 26, filter: "blur(14px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.6, duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
            >
              LANKA <em>DAHAN</em>
            </motion.h1>
            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }}>
              THE BURNING OF THE GOLDEN CITY
            </motion.h2>
            <div className="ld-rule"><span />✦<span /></div>
            <motion.p className="ld-copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1.1 }}>
              They set Hanuman's tail alight to shame him. Now the whole of Lanka
              will learn what that fire can do. Burn the city — but spare what
              dharma protects.
            </motion.p>
            <motion.div className="ld-chips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9, duration: 1 }}>
              <span><b>60</b> SECONDS</span>
              <span><b>{city.total}</b> BUILDINGS</span>
              <span><b>2</b> SACRED PLACES SPARED</span>
            </motion.div>
            <motion.div className="ld-keys" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1, duration: 1 }}>
              <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> FLY</span>
              <span><kbd>SHIFT</kbd> BOOST</span>
              <span><kbd>SPACE</kbd> FIRE-BURST</span>
              <span>🖱 CURSOR · CAMERA</span>
            </motion.div>
            <motion.button
              className="ld-primary"
              onClick={startGame}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.8 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              BEGIN THE FLIGHT <ArrowRight size={17} />
            </motion.button>
            {best > 0 && <small className="ld-best">BEST · {best.toLocaleString()}</small>}
          </motion.div>
        )}

        {/* ---------------- HUD ---------------- */}
        {screen === "play" && (
          <motion.div key="hud" className="ld-hud" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="ld-hud-top">
              <div className="ld-brand">
                <Flame size={18} />
                <div><b>LANKA DAHAN</b><small>THE NIGHT OF FIRE</small></div>
              </div>

              <div className={`ld-clock ${urgent ? "is-urgent" : ""}`}>
                <span>TIME</span>
                <strong>{mm}:{ss}</strong>
              </div>

              <div className="ld-score">
                <span>SCORE</span>
                <strong>{hud.score.toLocaleString()}</strong>
                <div className={`ld-combo ${hud.combo >= 2 ? "is-on" : ""}`}>
                  <b>×{hud.mult}</b>
                  <i><u style={{ width: `${hud.comboFrac * 100}%` }} /></i>
                  <small>COMBO {hud.combo}</small>
                </div>
              </div>
            </div>

            <div className="ld-feed">
              <AnimatePresence>
                {feed.map((f) => (
                  <motion.div
                    key={f.id}
                    className={`ld-feed-item ld-feed--${f.kind}`}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {f.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="ld-bottom">
              <div className="ld-bl">
                {!touch && <Minimap mapRef={mapRef} />}
                {touch && <Joystick inputRef={inputRef} />}
              </div>

              <div className="ld-burnbar">
                <div className="ld-burnbar-top">
                  <span>LANKA IGNITED</span>
                  <b>{hud.burned}<small> / {hud.total}</small></b>
                </div>
                <div className="ld-bar"><i style={{ width: `${ratio * 100}%` }} /></div>
                {!touch && (
                  <p className="ld-keyhint">
                    <kbd>WASD</kbd> FLY · <kbd>SHIFT</kbd> BOOST · <kbd>SPACE</kbd> BURST · MOVE CURSOR TO LOOK AROUND
                  </p>
                )}
              </div>

              <div className="ld-br">
                {touch && (
                  <button
                    className={`ld-boost ${hud.boost ? "is-on" : ""}`}
                    onPointerDown={() => { inputRef.current.boost = true; }}
                    onPointerUp={() => { inputRef.current.boost = false; }}
                    onPointerCancel={() => { inputRef.current.boost = false; }}
                  >
                    BOOST
                  </button>
                )}
                <button
                  className={`ld-burst ${ready ? "is-ready" : ""}`}
                  style={{ "--p": `${(1 - hud.cd / BURST_COOLDOWN) * 360}deg` }}
                  onPointerDown={(e) => { e.stopPropagation(); inputRef.current.burst = true; }}
                  aria-label="Fire burst"
                >
                  <span><Zap size={22} /><small>{ready ? "BURST" : `${hud.cd.toFixed(1)}s`}</small></span>
                </button>
              </div>
            </div>

            {hud.intro > 0 && (
              <div className="ld-intro">
                <motion.span key={hud.intro} className="ld-count" initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                  {hud.intro}
                </motion.span>
                <p>BURN LANKA · SPARE <em>VIBHISHANA'S HOME</em> &amp; THE <em>ASHOKA VATIKA</em></p>
              </div>
            )}
            {hud.go && (
              <motion.div className="ld-go" initial={{ opacity: 1, scale: 0.7 }} animate={{ opacity: 0, scale: 1.5 }} transition={{ duration: 0.9 }}>
                AGNI!
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ---------------- ENDING ---------------- */}
        {screen === "end" && result && (
          <motion.div key="end" className="ld-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>
            <span className="ld-eyebrow"><Sparkles size={14} /> THE MISSION CONTINUES</span>
            <p className="ld-roman">III</p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9 }}>
              {rank[1]}
            </motion.h1>
            {result.isBest && <div className="ld-newbest">NEW BEST</div>}
            <div className="ld-rule"><span />✦<span /></div>
            <p className="ld-copy">{rank[2]}</p>

            <div className="ld-stats">
              <div><b>{result.score.toLocaleString()}</b><span>SCORE</span></div>
              <div><b>{result.burned}<small>/{result.total}</small></b><span>BUILDINGS BURNED</span></div>
              <div><b>×{Math.min(5, 1 + Math.floor(result.bestCombo / 2))}</b><span>BEST COMBO ({result.bestCombo})</span></div>
              <div><b>{result.palace ? "YES" : "NO"}</b><span>RAVANA'S PALACE</span></div>
            </div>

            {result.bonus > 0 && <p className="ld-bonus">TIME BONUS +{result.bonus.toLocaleString()}</p>}
            <p className="ld-dharma">
              <Sparkles size={13} /> Vibhishana's home and the Ashoka Vatika were spared by dharma.
            </p>
            <p className="ld-story">
              Hanuman turns his thoughts to Sita — he must make certain she is safe before returning to Rama.
            </p>

            <div className="ld-actions">
              <button className="ld-primary" onClick={() => (onComplete ? onComplete() : goTitle())}>
                {onComplete ? "RETURN TO THE STORY" : "MAIN MENU"} <ArrowRight size={17} />
              </button>
              <button className="ld-retry" onClick={startGame}>
                <RotateCcw size={14} /> PLAY AGAIN
              </button>
            </div>
            {best > 0 && <small className="ld-best">BEST · {best.toLocaleString()}</small>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}