import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import "./TwoBrothersOneSky.css";

/* ------------------------------------------------------------------ */
/*  Timeline                                                           */
/* ------------------------------------------------------------------ */

const GAME_DURATION = 60;
const SCREECH_TIME = 40;
const SHIELD_TIME = 47;
const FLASH_TIME = 55;

const phaseOf = (t) =>
  t < SCREECH_TIME
    ? "flight"
    : t < SHIELD_TIME
      ? "heat"
      : t < FLASH_TIME
        ? "shield"
        : "ending";

const CHAPTERS = {
  flight: "The ascent",
  heat: "The scorching",
  shield: "The shield",
  ending: "The fall",
};

const CAPTIONS = [
  [0, 6, "Two sons of Aruna. One endless sky."],
  [6, 16, "Fly higher, Jatayu. The Sun awaits."],
  [16, 28, "Sampati never strays far from his brother."],
  [28, 40, "The air thins. The Sun grows vast."],
  [40, 47, "The Sun’s fury descends."],
  [47, 55, "Sampati spreads his wings over Jatayu."],
];

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;
const lerp = THREE.MathUtils.lerp;

const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const makeAnim = (seed) => ({
  amp: 0.9,
  rate: 1,
  phase: seed * 3,
  extend: 0,
  fire: 0,
  shoulder: 0,
  wrist: 0,
  seed,
});

const makeSim = () => ({
  mode: "intro", // intro | play | done
  t: 0,
  progress: 0,
  speed: 14,
  jx: 0,
  jy: 0,
  vx: 0,
  vy: 0,
  avx: 0,
  avy: 0,
  prevJx: 0,
  prevJy: 0,
  heat: 0,
  input: { x: 0, y: 0 },
  keys: { left: false, right: false, up: false, down: false },
  btn: { x: 0, y: 0 },
  rel: new THREE.Vector3(5, 0.6, -3),
  prevSam: new THREE.Vector3(),
  samVx: 0,
  lookAt: new THREE.Vector3(0, 0, -10),
  camInit: false,
  tickAcc: 1,
  lastSec: -1,
  screeched: false,
  flashed: false,
  finished: false,
});

/* ------------------------------------------------------------------ */
/*  Procedural terrain: noise, height, colour                          */
/* ------------------------------------------------------------------ */

const WATER_Y = -46;

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function vnoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, oct) {
  let a = 0.5;
  let s = 0;
  for (let i = 0; i < oct; i++) {
    s += vnoise(x, y) * a;
    x *= 2.03;
    y *= 2.03;
    a *= 0.5;
  }
  return s;
}

function ridged(x, z) {
  let a = 1;
  let f = 0.0055;
  let s = 0;
  let n = 0;
  for (let i = 0; i < 5; i++) {
    const v = 1 - Math.abs(vnoise(x * f + 31.7, z * f + 9.2) * 2 - 1);
    s += v * v * a;
    n += a;
    a *= 0.5;
    f *= 2.05;
  }
  return s / n;
}

const riverCenter = (z) =>
  Math.sin(z * 0.011) * 30 + Math.sin(z * 0.027 + 1.7) * 11;

function heightAt(x, z) {
  const hills = fbm(x * 0.018, z * 0.018, 4);
  let h = -48 + hills * 16;
  const rc = riverCenter(z);
  const side = Math.abs(x - rc * 0.25);
  const m = smooth(55, 190, side);
  if (m > 0) h += m * ridged(x, z) * 120;
  const river = 1 - smooth(5, 15, Math.abs(x - rc));
  h = lerp(h, WATER_Y - 1.5, river * 0.9);
  return Math.max(h, WATER_Y);
}

const TC = {
  water: new THREE.Color("#3f7fa6"),
  waterDeep: new THREE.Color("#2c5f86"),
  sand: new THREE.Color("#c9a870"),
  jungleD: new THREE.Color("#1f4a26"),
  jungleL: new THREE.Color("#3d7335"),
  savanna: new THREE.Color("#8f8a44"),
  rock: new THREE.Color("#6f5646"),
  rockHi: new THREE.Color("#a08265"),
  snow: new THREE.Color("#f1ece4"),
};

function terrainColor(out, x, z, h, slope) {
  const patch2 = vnoise(x * 0.12, z * 0.12);
  if (h <= WATER_Y + 0.01) {
    out.copy(TC.water).lerp(TC.waterDeep, vnoise(x * 0.03, z * 0.03));
    out.multiplyScalar(0.92 + patch2 * 0.2);
    return;
  }
  const patch = vnoise(x * 0.035 + 5, z * 0.035 + 9);
  const alt = clamp((h + 46) / 80, 0, 1);
  out.copy(TC.jungleD).lerp(TC.jungleL, patch);
  out.lerp(TC.savanna, smooth(0.18, 0.4, alt) * (0.4 + 0.6 * patch2));
  out.lerp(TC.rock, smooth(0.35, 0.6, alt));
  out.lerp(TC.rockHi, smooth(0.55, 0.8, alt) * patch);
  out.lerp(TC.snow, smooth(0.82, 0.95, alt));
  out.lerp(TC.rock, smooth(0.35, 0.7, slope) * 0.7);
  if (h < WATER_Y + 0.9) out.lerp(TC.sand, 0.6);
  out.multiplyScalar(0.88 + 0.24 * patch2);
}

const CHUNK_L = 140;
const CHUNK_W = 560;
const SEG_X = 84;
const SEG_Z = 36;
const CHUNK_N = 7;
const TREES = 1100;

const Terrain = memo(function Terrain() {
  const groupRef = useRef();
  const stateRef = useRef(null);

  useEffect(() => {
    const root = groupRef.current;
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0,
    });
    const treeGeo = new THREE.ConeGeometry(1, 2.8, 6);
    treeGeo.translate(0, 1.4, 0);
    const treeMat = new THREE.MeshStandardMaterial({
      roughness: 1,
      flatShading: true,
    });
    const dummy = new THREE.Object3D();
    const tmp = new THREE.Color();

    const GX = SEG_X + 3;
    const GZ = SEG_Z + 3;
    const heights = new Float32Array(GX * GZ);
    const dx = CHUNK_W / SEG_X;
    const dz = CHUNK_L / SEG_Z;

    const build = (chunk, centerZ) => {
      chunk.center = centerZ;

      for (let iz = 0; iz < GZ; iz++) {
        const wz = centerZ - CHUNK_L / 2 + (iz - 1) * dz;
        for (let ix = 0; ix < GX; ix++) {
          const x = -CHUNK_W / 2 + (ix - 1) * dx;
          heights[iz * GX + ix] = heightAt(x, wz);
        }
      }

      const pos = chunk.geo.attributes.position;
      const nor = chunk.geo.attributes.normal;
      const col = chunk.geo.attributes.color;

      for (let iy = 0; iy <= SEG_Z; iy++) {
        for (let ix = 0; ix <= SEG_X; ix++) {
          const vi = iy * (SEG_X + 1) + ix;
          const gi = (iy + 1) * GX + (ix + 1);
          const h = heights[gi];
          let nx = (heights[gi - 1] - heights[gi + 1]) / (2 * dx);
          let nz = (heights[gi - GX] - heights[gi + GX]) / (2 * dz);
          const inv = 1 / Math.sqrt(nx * nx + 1 + nz * nz);
          nx *= inv;
          nz *= inv;
          pos.setY(vi, h);
          nor.setXYZ(vi, nx, inv, nz);
          terrainColor(
            tmp,
            pos.getX(vi),
            centerZ + pos.getZ(vi),
            h,
            1 - inv
          );
          col.setXYZ(vi, tmp.r, tmp.g, tmp.b);
        }
      }
      pos.needsUpdate = true;
      nor.needsUpdate = true;
      col.needsUpdate = true;
      chunk.mesh.position.z = centerZ;

      const rng = mulberry32(Math.floor(centerZ * 7.31) + 9001);
      for (let i = 0; i < TREES; i++) {
        const x = (rng() + rng() - 1) * 230;
        const z = centerZ + (rng() - 0.5) * CHUNK_L;
        const h = heightAt(x, z);
        const s = 2.4 + rng() * 3.4;
        const keep = rng();
        const ok =
          h > WATER_Y + 0.8 && h < -12 && keep < (h < -30 ? 1 : 0.5);
        dummy.position.set(x, h - 0.3, z);
        dummy.rotation.set(0, rng() * 6.28, 0);
        dummy.scale.set(
          ok ? s : 0,
          ok ? s * (0.9 + rng() * 0.6) : 0,
          ok ? s : 0
        );
        dummy.updateMatrix();
        chunk.trees.setMatrixAt(i, dummy.matrix);
        const alt = clamp((h + 46) / 34, 0, 1);
        tmp.setHSL(
          0.23 + rng() * 0.1 - alt * 0.05,
          0.45,
          0.13 + rng() * 0.13 + alt * 0.04
        );
        chunk.trees.setColorAt(i, tmp);
      }
      chunk.trees.instanceMatrix.needsUpdate = true;
      if (chunk.trees.instanceColor) chunk.trees.instanceColor.needsUpdate = true;
    };

    const chunks = [];
    for (let i = 0; i < CHUNK_N; i++) {
      const geo = new THREE.PlaneGeometry(CHUNK_W, CHUNK_L, SEG_X, SEG_Z);
      geo.rotateX(-Math.PI / 2);
      geo.setAttribute(
        "color",
        new THREE.BufferAttribute(
          new Float32Array(geo.attributes.position.count * 3),
          3
        )
      );
      const mesh = new THREE.Mesh(geo, material);
      mesh.frustumCulled = false;
      const trees = new THREE.InstancedMesh(treeGeo, treeMat, TREES);
      trees.frustumCulled = false;
      trees.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      root.add(mesh);
      root.add(trees);
      const chunk = { geo, mesh, trees, center: 0 };
      build(chunk, 70 - i * CHUNK_L);
      chunks.push(chunk);
    }

    stateRef.current = { chunks, build };

    return () => {
      chunks.forEach((c) => {
        root.remove(c.mesh);
        root.remove(c.trees);
        c.geo.dispose();
        c.trees.dispose();
      });
      material.dispose();
      treeGeo.dispose();
      treeMat.dispose();
      stateRef.current = null;
    };
  }, []);

  useFrame(({ camera }) => {
    const st = stateRef.current;
    if (!st) return;
    for (const c of st.chunks) {
      if (c.center - CHUNK_L / 2 > camera.position.z + 80) {
        let minC = Infinity;
        st.chunks.forEach((o) => (minC = Math.min(minC, o.center)));
        st.build(c, minC - CHUNK_L);
        break;
      }
    }
  });

  return <group ref={groupRef} />;
});

/* ------------------------------------------------------------------ */
/*  Sky dome                                                           */
/* ------------------------------------------------------------------ */

const SKY = {
  zenithA: new THREE.Color("#2c5a9a"),
  zenithB: new THREE.Color("#c8762f"),
  midA: new THREE.Color("#e9a463"),
  midB: new THREE.Color("#ffc46d"),
  horA: new THREE.Color("#ffd9a3"),
  horB: new THREE.Color("#fff0c8"),
};

const SUN_DIR = new THREE.Vector3(0.04, 0.2, -1).normalize();

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFrag = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunR;
  uniform float uGlow;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h));
    col = mix(col, uZenith, smoothstep(0.15, 0.85, h));
    col = mix(col, uHorizon, 1.0 - smoothstep(-0.25, 0.0, h));
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    float disc = smoothstep(uSunR, uSunR + 0.0007, s);
    col += uSunColor * (pow(s, 8.0) * 0.22 * uGlow + pow(s, 64.0) * 0.45 * uGlow + pow(s, 700.0) * 0.9);
    col = mix(col, vec3(1.0, 0.98, 0.88), disc);
    col += uHorizon * 0.22 * exp(-abs(h) * 18.0);
    gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
  }
`;

/* ------------------------------------------------------------------ */
/*  Clouds                                                             */
/* ------------------------------------------------------------------ */

function makeCloudTexture(seed) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  const rng = mulberry32(seed * 977);
  for (let i = 0; i < 16; i++) {
    const x = 50 + rng() * 156;
    const y = 95 + rng() * 70;
    const r = 30 + rng() * 42;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.6)");
    g.addColorStop(0.55, "rgba(255,255,255,0.26)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-atop";
  const shade = ctx.createLinearGradient(0, 70, 0, 190);
  shade.addColorStop(0, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(214,150,105,0.55)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

const CLOUD_COUNT = 44;
const CLOUD_COLORS = {
  mid: new THREE.Color("#fff0d8"),
  low: new THREE.Color("#f0cfa6"),
  hot: new THREE.Color("#fff6dc"),
};

const Clouds = memo(function Clouds({ sim }) {
  const groupRef = useRef();
  const store = useRef(null);

  useEffect(() => {
    const root = groupRef.current;
    const texs = [1, 2, 3].map(makeCloudTexture);
    const rng = mulberry32(4242);
    const clusters = [];

    const place = (c, camPos, initial) => {
      const z = initial
        ? camPos.z + 20 - rng() * 640
        : camPos.z - (600 + rng() * 120);
      let x;
      let y;
      if (c.layer === 1) {
        x = (rng() - 0.5) * 520;
        y = -35 + rng() * 8;
      } else if (c.layer === 2) {
        x = (rng() - 0.5) * 420;
        y = 40 + rng() * 30;
      } else {
        const sgn = rng() < 0.5 ? -1 : 1;
        x = sgn * (14 + rng() * 150);
        y = -16 + rng() * 34;
        if (Math.abs(x) < 24 && Math.abs(y - 1) < 12) y += y > 1 ? 14 : -14;
      }
      c.g.position.set(x, y, z);
    };

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const layer = i % 5 === 0 ? 1 : i % 7 === 0 ? 2 : 0;
      const size =
        layer === 1 ? 70 + rng() * 60 : layer === 2 ? 60 + rng() * 40 : 26 + rng() * 30;
      const g = new THREE.Group();
      const sprites = [];
      const n = layer === 1 ? 5 : 4;
      for (let k = 0; k < n; k++) {
        const mat = new THREE.SpriteMaterial({
          map: texs[(i + k) % 3],
          transparent: true,
          depthWrite: false,
          opacity: 0,
        });
        const sp = new THREE.Sprite(mat);
        const w = size * (0.8 + rng() * 0.6);
        const flat = layer === 0 ? 0.55 : 0.3;
        sp.scale.set(w, w * flat, 1);
        sp.position.set(
          (k - (n - 1) / 2) * size * 0.45 + (rng() - 0.5) * size * 0.2,
          (rng() - 0.5) * size * 0.14,
          (rng() - 0.5) * size * 0.3
        );
        sp.userData = {
          base: layer === 2 ? 0.35 + rng() * 0.2 : 0.6 + rng() * 0.3,
          r: w,
        };
        g.add(sp);
        sprites.push(sp);
      }
      root.add(g);
      const c = { g, sprites, layer, size };
      place(c, new THREE.Vector3(0, 0, 10), true);
      clusters.push(c);
    }

    store.current = { clusters, place, texs };

    return () => {
      clusters.forEach((c) => {
        root.remove(c.g);
        c.sprites.forEach((s) => s.material.dispose());
      });
      texs.forEach((t) => t.dispose());
      store.current = null;
    };
  }, []);

  useFrame(({ camera }) => {
    const st = store.current;
    if (!st) return;
    const cam = camera.position;
    const heat = sim.current.heat;
    for (const c of st.clusters) {
      if (c.g.position.z > cam.z + 40) st.place(c, cam, false);
      const gp = c.g.position;
      for (const sp of c.sprites) {
        const dx = gp.x + sp.position.x - cam.x;
        const dy = gp.y + sp.position.y - cam.y;
        const dz = gp.z + sp.position.z - cam.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const near = clamp((dist - sp.userData.r * 0.5 - 6) / 24, 0, 1);
        sp.material.opacity = sp.userData.base * near;
        sp.material.color
          .copy(c.layer === 1 ? CLOUD_COLORS.low : CLOUD_COLORS.mid)
          .lerp(CLOUD_COLORS.hot, heat);
      }
    }
  });

  return <group ref={groupRef} />;
});

/* ------------------------------------------------------------------ */
/*  Wind streaks (speed cue)                                           */
/* ------------------------------------------------------------------ */

const STREAKS = 52;

const WindStreaks = memo(function WindStreaks({ sim }) {
  const data = useMemo(
    () => Array.from({ length: STREAKS }, () => ({ x: 0, y: 0, z: 0 })),
    []
  );
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(STREAKS * 6), 3)
    );
    return g;
  }, []);
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#fff4dc",
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        fog: false,
      }),
    []
  );
  const inited = useRef(false);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame(({ camera }) => {
    const cam = camera.position;
    const sp = sim.current.speed;
    const len = clamp(sp * 0.12, 0.6, 3.2);
    const pos = geometry.attributes.position;
    for (let i = 0; i < STREAKS; i++) {
      const d = data[i];
      if (!inited.current || d.z > cam.z + 6) {
        const a = Math.random() * Math.PI * 2;
        const r = 4 + Math.random() * 16;
        d.x = cam.x + Math.cos(a) * r;
        d.y = cam.y - 2 + Math.sin(a) * r * 0.6;
        d.z = inited.current
          ? cam.z - 70 - Math.random() * 60
          : cam.z - Math.random() * 120;
      }
      pos.setXYZ(i * 2, d.x, d.y, d.z);
      pos.setXYZ(i * 2 + 1, d.x, d.y, d.z + len);
    }
    inited.current = true;
    pos.needsUpdate = true;
    material.opacity = clamp(sp / 18, 0.1, 1) * 0.28;
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
});

/* ------------------------------------------------------------------ */
/*  Vultures                                                           */
/* ------------------------------------------------------------------ */

const FEATHER_CACHE = new Map();

function featherGeo(len, wid) {
  const key = `${len.toFixed(2)}_${wid.toFixed(2)}`;
  if (FEATHER_CACHE.has(key)) return FEATHER_CACHE.get(key);

  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(wid * 0.55, len * 0.08, wid * 0.62, len * 0.55, wid * 0.28, len * 0.9);
  s.quadraticCurveTo(wid * 0.1, len * 0.99, 0, len);
  s.quadraticCurveTo(-wid * 0.1, len * 0.99, -wid * 0.28, len * 0.9);
  s.bezierCurveTo(-wid * 0.62, len * 0.55, -wid * 0.55, len * 0.08, 0, 0);

  const g = new THREE.ShapeGeometry(s, 10);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = y / len;
    pos.setZ(i, t * t * len * 0.09 - Math.abs(x) * 0.12);
    const shade = 1 - 0.38 * t - (Math.abs(x) / wid) * 0.1;
    col[i * 3] = shade;
    col[i * 3 + 1] = shade;
    col[i * 3 + 2] = shade;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  FEATHER_CACHE.set(key, g);
  return g;
}

const JATAYU = {
  feather: "#4a3022",
  covert: "#8a6240",
  covertLight: "#a7794d",
  body: "#6a4630",
  breast: "#8d6a48",
  ruff: "#e6d3b0",
  skin: "#b78f86",
  beak: "#c9a15a",
  beakDark: "#4a3a2a",
};

const SAMPATI = {
  feather: "#5a4a3e",
  covert: "#b08a5c",
  covertLight: "#d0aa78",
  body: "#8a6a4a",
  breast: "#c0a078",
  ruff: "#f2e6cf",
  skin: "#a99a94",
  beak: "#d0a65b",
  beakDark: "#4a3a2a",
};

const PRIM_LEN = [1.0, 1.12, 1.2, 1.2, 1.12, 1.0, 0.8];
const SEC_COUNT = 9;

function Wing({ side, idx, parts, mats }) {
  return (
    <group scale={[side, 1, 1]}>
      <group
        ref={(el) => {
          parts.current.sh[idx] = el;
        }}
        position={[0.3, 0.18, -0.2]}
      >
        {/* leading arm */}
        <mesh position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={mats.arm}>
          <cylinderGeometry args={[0.06, 0.1, 1.0, 8]} />
        </mesh>

        {/* secondaries */}
        {Array.from({ length: SEC_COUNT }).map((_, i) => (
          <group
            key={`s${i}`}
            position={[0.08 + i * 0.105, 0, 0.04]}
            rotation={[0, 0.04 + i * 0.02, 0, "YXZ"]}
            ref={(el) => {
              parts.current.secs[idx][i] = el;
            }}
          >
            <mesh
              geometry={featherGeo(0.85 + 0.1 * (1 - i / (SEC_COUNT - 1)), 0.2)}
              material={mats.feather}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </group>
        ))}

        {/* wing coverts: two overlapping rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh
            key={`c${i}`}
            geometry={featherGeo(0.56 - i * 0.02, 0.24)}
            material={mats.covert}
            position={[0.05 + i * 0.125, 0.018, -0.12]}
            rotation={[Math.PI / 2, 0.03 + i * 0.015, 0]}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh
            key={`l${i}`}
            geometry={featherGeo(0.38 - i * 0.012, 0.2)}
            material={mats.covertLight}
            position={[0.05 + i * 0.125, 0.034, -0.24]}
            rotation={[Math.PI / 2, 0.02 + i * 0.012, 0]}
          />
        ))}

        {/* wrist + hand */}
        <group
          ref={(el) => {
            parts.current.wr[idx] = el;
          }}
          position={[1.0, 0, 0]}
          rotation={[0, -0.2, 0]}
        >
          <mesh position={[0.35, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={mats.arm}>
            <cylinderGeometry args={[0.03, 0.07, 0.75, 8]} />
          </mesh>

          {PRIM_LEN.map((len, i) => (
            <group
              key={`p${i}`}
              position={[0.08 + i * 0.1, 0, 0]}
              rotation={[0, 0.1 + i * 0.15, 0, "YXZ"]}
              ref={(el) => {
                parts.current.fingers[idx][i] = el;
              }}
            >
              <mesh
                geometry={featherGeo(len, 0.17)}
                material={mats.feather}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          ))}

          {Array.from({ length: 5 }).map((_, i) => (
            <mesh
              key={`h${i}`}
              geometry={featherGeo(0.5 - i * 0.03, 0.2)}
              material={mats.covert}
              position={[0.1 + i * 0.13, 0.02, -0.1]}
              rotation={[Math.PI / 2, 0.1 + i * 0.12, 0]}
            />
          ))}
        </group>
      </group>
    </group>
  );
}

function Vulture({ groupRef, anim, palette, scale = 1, children }) {
  const rig = useRef();
  const tail = useRef();
  const head = useRef();
  const parts = useRef({
    sh: [null, null],
    wr: [null, null],
    fingers: [[], []],
    secs: [[], []],
  });

  const { mats, baseFeather, baseCovert } = useMemo(() => {
    const std = (color, extra = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
    const feather = std(palette.feather, {
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    const covert = std(palette.covert, {
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    const covertLight = std(palette.covertLight, {
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    return {
      baseFeather: new THREE.Color(palette.feather),
      baseCovert: new THREE.Color(palette.covert),
      mats: {
        feather,
        covert,
        covertLight,
        arm: std(palette.body),
        body: std(palette.body, { roughness: 0.92 }),
        breast: std(palette.breast, { roughness: 0.92 }),
        ruff: std(palette.ruff, { side: THREE.DoubleSide, vertexColors: true }),
        skin: std(palette.skin, { roughness: 0.7 }),
        beak: std(palette.beak, { roughness: 0.5 }),
        beakDark: std(palette.beakDark, { roughness: 0.6 }),
        eye: std("#ffbf3f", { emissive: "#6a3d08", emissiveIntensity: 0.6, roughness: 0.3 }),
        leg: std("#c9b9a5", { roughness: 0.8 }),
      },
    };
  }, [palette]);

  useEffect(
    () => () => Object.values(mats).forEach((m) => m.dispose()),
    [mats]
  );

  const charColor = useMemo(() => new THREE.Color("#1b120d"), []);

  useFrame(({ clock }, dtRaw) => {
    const a = anim.current;
    const dt = Math.min(dtRaw, 0.05);
    const el = clock.elapsedTime;
    a.phase += dt * 6.4 * a.rate;
    const p = a.phase;
    const amp = a.amp;
    const ext = a.extend;
    const sway = Math.sin(el * 1.3 + a.seed * 5) * 0.03;

    const shoulderZ =
      0.1 + amp * (0.52 * Math.sin(p) + 0.1 * Math.sin(2 * p + 0.6)) + sway + ext * 0.06;
    const wristZ = -0.02 + amp * 0.7 * Math.sin(p - 0.9) + sway * 1.5;
    const wristY = -0.2 * (1 - ext) - amp * 0.1 * (0.5 + 0.5 * Math.sin(p - 0.4));
    a.shoulder = shoulderZ;
    a.wrist = wristZ;

    const pr = parts.current;
    for (let s = 0; s < 2; s++) {
      if (pr.sh[s]) pr.sh[s].rotation.z = shoulderZ;
      if (pr.wr[s]) {
        pr.wr[s].rotation.z = wristZ;
        pr.wr[s].rotation.y = wristY;
      }
      pr.fingers[s].forEach((f, i) => {
        if (f)
          f.rotation.x =
            0.05 + amp * 0.3 * Math.sin(p - 1.5 - i * 0.14) * (0.35 + i * 0.1) + sway;
      });
      pr.secs[s].forEach((f, i) => {
        if (f) f.rotation.x = amp * 0.12 * Math.sin(p - 1.2 - i * 0.1);
      });
    }

    if (rig.current) {
      rig.current.position.y = -amp * 0.06 * Math.cos(p);
      rig.current.rotation.x = 0.04 * Math.sin(p) * amp;
    }
    if (tail.current) {
      tail.current.rotation.x = 0.12 + Math.sin(p - 0.6) * 0.07 * amp;
      tail.current.scale.x = 1 + 0.1 * Math.sin(el * 0.9 + a.seed);
    }
    if (head.current) head.current.rotation.y = Math.sin(el * 0.7 + a.seed * 4) * 0.14;

    const f = a.fire;
    const fl = 0.75 + 0.25 * Math.sin(el * 21) * Math.sin(el * 8.3 + 1);
    mats.feather.emissive.setRGB(f * 0.9 * fl, f * 0.26 * fl, f * 0.03);
    mats.feather.emissiveIntensity = 0.65;
    mats.covert.emissive.copy(mats.feather.emissive);
    mats.covertLight.emissive.copy(mats.feather.emissive);
    mats.covert.emissiveIntensity = 0.5;
    mats.covertLight.emissiveIntensity = 0.5;
    mats.feather.color.copy(baseFeather).lerp(charColor, f * 0.55);
    mats.covert.color.copy(baseCovert).lerp(charColor, f * 0.45);
  });

  return (
    <group ref={groupRef} scale={scale}>
      <group ref={rig}>
        {/* torso */}
        <mesh scale={[0.43, 0.4, 1.0]} position={[0, 0, 0.05]} material={mats.body}>
          <sphereGeometry args={[1, 28, 20]} />
        </mesh>
        <mesh scale={[0.4, 0.36, 0.45]} position={[0, -0.06, -0.55]} material={mats.breast}>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
        <mesh scale={[0.5, 0.18, 0.7]} position={[0, 0.22, -0.05]} material={mats.covert}>
          <sphereGeometry args={[1, 20, 12]} />
        </mesh>

        {/* ruff */}
        {Array.from({ length: 20 }).map((_, i) => {
          const phi = (i / 20) * Math.PI * 2;
          return (
            <group
              key={`r${i}`}
              position={[Math.sin(phi) * 0.07, 0.16, -0.72 + Math.cos(phi) * 0.07]}
              rotation={[0.65, phi, 0, "YXZ"]}
            >
              <mesh
                geometry={featherGeo(0.3 + (i % 3) * 0.05, 0.15)}
                material={mats.ruff}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          );
        })}

        {/* neck + head */}
        <group position={[0, 0.2, -0.72]} rotation={[-1.15, 0, 0]}>
          <mesh position={[0, 0.2, 0]} material={mats.skin}>
            <cylinderGeometry args={[0.08, 0.12, 0.42, 10]} />
          </mesh>
          <group ref={head} position={[0, 0.44, 0]} rotation={[0.95, 0, 0]}>
            <mesh scale={[0.9, 0.95, 1.3]} material={mats.skin}>
              <sphereGeometry args={[0.16, 18, 16]} />
            </mesh>
            <mesh position={[0, -0.04, -0.26]} rotation={[-Math.PI / 2, 0, 0]} material={mats.beak}>
              <coneGeometry args={[0.075, 0.3, 8]} />
            </mesh>
            <mesh position={[0, -0.075, -0.4]} scale={[0.8, 1, 1.2]} material={mats.beakDark}>
              <sphereGeometry args={[0.05, 10, 10]} />
            </mesh>
            <mesh position={[0, -0.1, -0.22]} rotation={[-Math.PI / 2, 0, 0]} material={mats.beakDark}>
              <coneGeometry args={[0.05, 0.2, 6]} />
            </mesh>
            {[-1, 1].map((s) => (
              <group key={s}>
                <mesh position={[s * 0.1, 0.03, -0.1]} material={mats.eye}>
                  <sphereGeometry args={[0.035, 10, 10]} />
                </mesh>
                <mesh position={[s * 0.1, 0.07, -0.1]} rotation={[0, 0, s * 0.3]} material={mats.beakDark}>
                  <boxGeometry args={[0.08, 0.016, 0.1]} />
                </mesh>
              </group>
            ))}
          </group>
        </group>

        {/* tail */}
        <group ref={tail} position={[0, 0, 0.95]}>
          {[-3, -2, -1, 0, 1, 2, 3].map((n) => (
            <group key={n} rotation={[0.05, n * 0.1, 0, "YXZ"]}>
              <mesh
                geometry={featherGeo(0.85 - Math.abs(n) * 0.04, 0.24)}
                material={mats.feather}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          ))}
        </group>

        {/* tucked legs */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.15, -0.32, 0.5]} rotation={[1.2, 0, 0]} material={mats.leg}>
              <capsuleGeometry args={[0.04, 0.28, 4, 8]} />
            </mesh>
            <mesh position={[s * 0.15, -0.42, 0.76]} rotation={[Math.PI / 2, 0, 0]} material={mats.beakDark}>
              <coneGeometry args={[0.05, 0.16, 6]} />
            </mesh>
          </group>
        ))}

        <Wing side={-1} idx={0} parts={parts} mats={mats} />
        <Wing side={1} idx={1} parts={parts} mats={mats} />
      </group>
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Flames on Sampati's wings (world-space particles)                  */
/* ------------------------------------------------------------------ */

const MAXP = 360;

const flameVert = /* glsl */ `
  attribute float aAge;
  attribute float aSize;
  uniform float uScale;
  varying float vAge;
  void main() {
    vAge = aAge;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float grow = 0.55 + aAge * 1.1;
    gl_PointSize = min(aSize * grow * uScale / max(-mv.z, 0.1), 150.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const flameFrag = /* glsl */ `
  varying float vAge;
  void main() {
    if (vAge >= 1.0) discard;
    float d = length(gl_PointCoord - 0.5);
    float soft = smoothstep(0.5, 0.0, d);
    float a = pow(1.0 - vAge, 1.4) * soft;
    vec3 c0 = vec3(1.0, 0.93, 0.55);
    vec3 c1 = vec3(1.0, 0.5, 0.1);
    vec3 c2 = vec3(0.55, 0.08, 0.02);
    vec3 col = mix(c0, c1, smoothstep(0.0, 0.4, vAge));
    col = mix(col, c2, smoothstep(0.4, 1.0, vAge));
    gl_FragColor = vec4(col * 1.4, a);
  }
`;

const Flames = memo(function Flames({ target, anim }) {
  const data = useMemo(
    () => ({
      pos: new Float32Array(MAXP * 3),
      age: new Float32Array(MAXP).fill(1),
      size: new Float32Array(MAXP),
      life: new Float32Array(MAXP).fill(1),
      vel: new Float32Array(MAXP * 3),
      head: 0,
      acc: 0,
      v: new THREE.Vector3(),
    }),
    []
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.pos, 3));
    g.setAttribute("aAge", new THREE.BufferAttribute(data.age, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(data.size, 1));
    return g;
  }, [data]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 600 } },
        vertexShader: flameVert,
        fragmentShader: flameFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame(({ camera, size, gl }, dtRaw) => {
    const g = target.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const a = anim.current;
    g.updateWorldMatrix(true, false);

    data.acc += a.fire * 150 * dt;
    while (data.acc >= 1) {
      data.acc -= 1;
      const i = data.head;
      data.head = (data.head + 1) % MAXP;

      const side = Math.random() < 0.5 ? -1 : 1;
      let lx;
      let ly;
      let lz;
      if (a.fire > 0.7 && Math.random() < 0.08) {
        lx = (Math.random() - 0.5) * 0.4;
        ly = 0.1;
        lz = 0.9 + Math.random() * 0.6;
      } else {
        const u = Math.pow(Math.random(), 0.7);
        const r = u * 2.55;
        const armLen = 1.0;
        const x0 = 0.3;
        const y0 = 0.18;
        let x;
        let y;
        if (r <= armLen) {
          x = x0 + r * Math.cos(a.shoulder);
          y = y0 + r * Math.sin(a.shoulder);
        } else {
          const r2 = r - armLen;
          x =
            x0 + armLen * Math.cos(a.shoulder) + r2 * Math.cos(a.shoulder + a.wrist);
          y =
            y0 + armLen * Math.sin(a.shoulder) + r2 * Math.sin(a.shoulder + a.wrist);
        }
        lx = side * x;
        ly = y + 0.03;
        lz = -0.2 + 0.15 + Math.random() * (u > 0.3 ? 0.9 : 0.45);
      }
      data.v.set(lx, ly, lz);
      g.localToWorld(data.v);
      data.pos[i * 3] = data.v.x;
      data.pos[i * 3 + 1] = data.v.y;
      data.pos[i * 3 + 2] = data.v.z;

      const ember = Math.random() < 0.18;
      data.size[i] = ember ? 0.1 + Math.random() * 0.06 : 0.5 + Math.random() * 0.55;
      data.life[i] = ember ? 1.3 + Math.random() : 0.55 + Math.random() * 0.5;
      data.age[i] = 0;
      data.vel[i * 3] = (Math.random() - 0.5) * (ember ? 1.6 : 0.5);
      data.vel[i * 3 + 1] = ember ? 2 + Math.random() * 1.8 : 1.2 + Math.random() * 1.6;
      data.vel[i * 3 + 2] = (Math.random() - 0.3) * 0.7;
    }

    for (let i = 0; i < MAXP; i++) {
      if (data.age[i] >= 1) {
        data.size[i] = 0;
        continue;
      }
      data.age[i] += dt / data.life[i];
      data.vel[i * 3 + 1] += 0.9 * dt;
      data.pos[i * 3] += data.vel[i * 3] * dt;
      data.pos[i * 3 + 1] += data.vel[i * 3 + 1] * dt;
      data.pos[i * 3 + 2] += data.vel[i * 3 + 2] * dt;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAge.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    material.uniforms.uScale.value =
      (size.height * gl.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
});

/* ------------------------------------------------------------------ */
/*  World: simulation, camera, sky, light                              */
/* ------------------------------------------------------------------ */

const World = memo(function World({
  sim,
  jatAnim,
  samAnim,
  onTick,
  onFinish,
  onFlash,
  onScreech,
}) {
  const jatRef = useRef();
  const samRef = useRef();
  const sunLight = useRef();
  const hemi = useRef();
  const fireLight = useRef();
  const skyRef = useRef();
  const { scene } = useThree();

  const fogColor = useMemo(() => new THREE.Color("#ffd9a3"), []);
  const fog = useMemo(() => new THREE.Fog(fogColor, 70, 560), [fogColor]);

  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uZenith: { value: new THREE.Color() },
          uMid: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uSunDir: { value: SUN_DIR.clone() },
          uSunColor: { value: new THREE.Color("#ffcf86") },
          uSunR: { value: 0.9975 },
          uGlow: { value: 1 },
        },
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
      }),
    []
  );

  useEffect(() => () => skyMat.dispose(), [skyMat]);

  const tmpV = useMemo(() => new THREE.Vector3(), []);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const samPos = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, clock }, dtRaw) => {
    const s = sim.current;
    const dt = Math.min(dtRaw, 0.05);
    const el = clock.elapsedTime;
    if (s.mode !== "intro") s.t += dt;
    const t = s.t;
    const tt = s.mode === "intro" ? el : t;
    const phase = s.mode === "intro" ? "intro" : phaseOf(t);

    /* ---- input ---- */
    const ctrl = phase === "flight" ? 1 : 0;
    const ix =
      clamp((s.keys.right ? 1 : 0) - (s.keys.left ? 1 : 0) + s.btn.x, -1, 1) * ctrl;
    const iy =
      clamp((s.keys.up ? 1 : 0) - (s.keys.down ? 1 : 0) + s.btn.y, -1, 1) * ctrl;
    s.input.x = ix;
    s.input.y = iy;

    /* ---- Jatayu motion ---- */
    s.prevJx = s.jx;
    s.prevJy = s.jy;
    if (phase === "intro") {
      s.jx = Math.sin(el * 0.3) * 1.8;
      s.jy = Math.sin(el * 0.45) * 0.7;
    } else if (phase === "flight") {
      s.vx = damp(s.vx, ix * 9, 2.6, dt);
      s.vy = damp(s.vy, iy * 5.5, 2.6, dt);
      s.jx = clamp(s.jx + s.vx * dt, -14, 14);
      s.jy = clamp(s.jy + s.vy * dt, -5, 9);
    } else {
      s.vx = damp(s.vx, 0, 2, dt);
      s.vy = damp(s.vy, 0, 2, dt);
      const cy = phase === "shield" ? -0.6 : phase === "heat" ? -0.3 : 0;
      s.jx = damp(s.jx, 0, 1.2, dt);
      s.jy = damp(s.jy, cy, 1.2, dt);
    }
    const vxAct = dt > 1e-4 ? (s.jx - s.prevJx) / dt : 0;
    const vyAct = dt > 1e-4 ? (s.jy - s.prevJy) / dt : 0;
    s.avx = damp(s.avx, vxAct, 6, dt);
    s.avy = damp(s.avy, vyAct, 6, dt);

    /* ---- speed & progress ---- */
    let tgtSpeed = 15 + iy * 3.5;
    if (phase === "intro") tgtSpeed = 14;
    else if (phase === "heat") tgtSpeed = lerp(15, 8, smooth(40, 47, t));
    else if (phase === "shield") tgtSpeed = lerp(8, 5.5, smooth(47, 55, t));
    else if (phase === "ending") tgtSpeed = 6;
    s.speed = damp(s.speed, tgtSpeed, 1.4, dt);
    s.progress += s.speed * dt;
    const jz = -s.progress;

    /* ---- Sampati relative position ---- */
    let tx;
    let ty;
    let tz;
    if (phase === "flight" || phase === "intro") {
      const w = 0.65 * Math.sin(tt * 0.42 + 0.4) + 0.35 * Math.sin(tt * 0.95 + 2.0);
      tx = 5.2 + 1.3 * Math.sin(tt * 0.5);
      ty = 0.6 + 0.9 * Math.sin(tt * 0.8 + 1);
      tz = clamp(-2.5 - 7.5 * w + Math.max(iy, 0) * 5 - Math.max(-iy, 0) * 3, -11, 6);
    } else if (phase === "heat") {
      const k = smooth(40, 47, t);
      tx = lerp(4.5, 1.4, k);
      ty = lerp(1.2, 2.1, k);
      tz = lerp(-4, -0.8, k);
    } else {
      tx = 0;
      ty = 2.2;
      tz = -0.5;
    }
    const relRate = phase === "shield" || phase === "ending" ? 2.4 : 1.6;
    s.rel.x = damp(s.rel.x, tx, relRate, dt);
    s.rel.y = damp(s.rel.y, ty, relRate, dt);
    s.rel.z = damp(s.rel.z, tz, relRate, dt);

    const te = Math.max(0, t - FLASH_TIME);
    const falling = s.mode !== "intro" ? te : 0;
    samPos.set(
      s.jx + s.rel.x - falling * 0.8,
      s.jy + s.rel.y - falling * falling * 1.8 - falling * 0.5,
      jz + s.rel.z + falling * 2.0
    );

    /* ---- apply to birds ---- */
    const jat = jatRef.current;
    const sam = samRef.current;
    if (jat) {
      jat.rotation.order = "YXZ";
      jat.position.set(s.jx, s.jy, jz);
      const shudder = Math.sin(el * 14) * 0.02 * s.heat;
      jat.rotation.z = clamp(-s.avx * 0.075, -0.55, 0.55) + shudder;
      jat.rotation.x = clamp(s.avy * 0.06, -0.4, 0.4);
      jat.rotation.y = -s.avx * 0.035;
    }
    if (sam) {
      sam.rotation.order = "YXZ";
      sam.position.copy(samPos);
      const svx = dt > 1e-4 ? (samPos.x - s.prevSam.x) / dt : 0;
      s.samVx = damp(s.samVx, clamp(svx, -12, 12), 6, dt);
      s.prevSam.copy(samPos);
      sam.rotation.z =
        clamp(-s.samVx * 0.06, -0.5, 0.5) + Math.sin(tt * 0.5) * 0.04 + falling * 1.1;
      sam.rotation.x = clamp(-falling * 0.5, -1.1, 0);
      sam.rotation.y = -s.samVx * 0.03;
    }

    /* ---- wing animation parameters ---- */
    const glide = 0.55 + 0.45 * smooth(-0.2, 0.6, Math.sin(tt * 0.55));
    const glide2 = 0.6 + 0.4 * smooth(-0.2, 0.6, Math.sin(tt * 0.47 + 2));
    let jAmp = 0.9 * glide;
    let jRate = 1;
    if (phase === "flight") {
      if (iy > 0.2) {
        jAmp = 1.2;
        jRate = 1.25;
      } else if (iy < -0.2) {
        jAmp = 0.3;
        jRate = 0.5;
      }
    } else if (phase === "heat") {
      jAmp = 1.2;
      jRate = 1.5;
    } else if (phase === "shield") {
      jAmp = 0.95;
      jRate = 1.25;
    } else if (phase === "ending") {
      jAmp = 0.8;
      jRate = 1;
    }
    jatAnim.current.amp = damp(jatAnim.current.amp, jAmp, 3, dt);
    jatAnim.current.rate = damp(jatAnim.current.rate, jRate, 3, dt);

    let sAmp = 0.95 * glide2;
    let sRate = 0.86;
    let sExt = 0;
    if (phase === "heat") {
      sAmp = 1.1;
      sRate = 1.2;
    } else if (phase === "shield") {
      sAmp = 0.28;
      sRate = 0.9;
      sExt = 1;
    } else if (phase === "ending") {
      sAmp = 1.3;
      sRate = 2;
    }
    samAnim.current.amp = damp(samAnim.current.amp, sAmp, 3, dt);
    samAnim.current.rate = damp(samAnim.current.rate, sRate, 3, dt);
    samAnim.current.extend = damp(samAnim.current.extend, sExt, 2.5, dt);

    let fire = 0;
    if (s.mode !== "intro") {
      if (t >= SCREECH_TIME && t < SHIELD_TIME) fire = smooth(40, 47, t) * 0.35;
      else if (t >= SHIELD_TIME && t < FLASH_TIME)
        fire = 0.35 + 0.65 * smooth(47, 55, t);
      else if (t >= FLASH_TIME) fire = 1;
    }
    samAnim.current.fire = damp(samAnim.current.fire, fire, 4, dt);

    if (fireLight.current) {
      const fl = 0.8 + 0.2 * Math.sin(el * 19) * Math.sin(el * 7 + 2);
      fireLight.current.intensity = samAnim.current.fire * 70 * fl;
    }

    /* ---- atmosphere ---- */
    const heat = s.mode === "intro" ? 0 : smooth(34, 47, t);
    s.heat = heat;
    const u = skyMat.uniforms;
    u.uZenith.value.copy(SKY.zenithA).lerp(SKY.zenithB, heat);
    u.uMid.value.copy(SKY.midA).lerp(SKY.midB, heat);
    u.uHorizon.value.copy(SKY.horA).lerp(SKY.horB, heat);
    const sunT = s.mode === "intro" ? 0 : smooth(0, 55, t);
    const theta = lerp(0.065, 0.2, sunT) * (1 + 0.15 * heat);
    u.uSunR.value = 1 - (theta * theta) / 2;
    u.uGlow.value = 1 + heat * 1.5;
    fogColor.copy(u.uHorizon.value);
    fog.far = lerp(560, 440, heat);

    if (skyRef.current) skyRef.current.position.copy(camera.position);
    if (sunLight.current) {
      sunLight.current.intensity = 2.8 + 1.2 * heat;
    }
    if (hemi.current) hemi.current.intensity = 1 + 0.25 * heat;

    /* ---- camera ---- */
    const J = tmpV.set(s.jx, s.jy, jz);
    let rate = 2.4;
    if (phase === "intro") {
      const phi = 1.5 + Math.sin(el * 0.18) * 0.9;
      const R = 9.5;
      camTarget.set(
        J.x - Math.sin(phi) * R,
        J.y + 1.5 + Math.sin(el * 0.3) * 0.6,
        J.z + Math.cos(phi) * R
      );
      lookTarget.set(
        J.x + s.rel.x * 0.5,
        J.y + 0.3 + s.rel.y * 0.5,
        J.z + s.rel.z * 0.5
      );
      rate = 1.6;
    } else if (phase === "flight") {
      camTarget.set(s.jx * 0.6, 3.0 + s.jy * 0.55, jz + 10.5);
      lookTarget.set(s.jx * 0.9, s.jy * 0.8 + 0.5, jz - 16);
    } else if (phase === "heat") {
      camTarget.set(s.jx + 3.6, s.jy + 1.4, jz + 8.2);
      lookTarget.set(s.jx + s.rel.x * 0.35, s.jy + 1.0, jz - 3);
    } else if (phase === "shield") {
      camTarget.set(s.jx - 4.6, s.jy - 0.8, jz + 7.6);
      lookTarget.set(s.jx, s.jy + 1.5, jz - 1.8);
    } else {
      const mix = smooth(0.5, 4, te);
      camTarget.set(s.jx - 5.5, s.jy + 2.2, jz + 10.5);
      lookTarget.set(
        lerp(samPos.x, s.jx, mix),
        lerp(samPos.y, s.jy, mix) + 0.5,
        lerp(samPos.z, jz, mix) - 2
      );
    }

    if (!s.camInit) {
      camera.position.copy(camTarget);
      s.lookAt.copy(lookTarget);
      s.camInit = true;
    } else {
      camera.position.x = damp(camera.position.x, camTarget.x, rate, dt);
      camera.position.y = damp(camera.position.y, camTarget.y, rate, dt);
      camera.position.z = damp(camera.position.z, camTarget.z, rate, dt);
      s.lookAt.x = damp(s.lookAt.x, lookTarget.x, 3, dt);
      s.lookAt.y = damp(s.lookAt.y, lookTarget.y, 3, dt);
      s.lookAt.z = damp(s.lookAt.z, lookTarget.z, 3, dt);
    }

    const shakeAmp =
      s.mode === "intro"
        ? 0
        : t < SCREECH_TIME
          ? 0.004
          : t < SHIELD_TIME
            ? 0.03 + smooth(40, 47, t) * 0.07
            : t < FLASH_TIME
              ? 0.06
              : 0.03;
    camera.position.x += (Math.sin(el * 37) + Math.sin(el * 23.7)) * 0.5 * shakeAmp;
    camera.position.y += (Math.sin(el * 31.3) + Math.sin(el * 19.1)) * 0.5 * shakeAmp;
    camera.lookAt(s.lookAt);
    camera.rotateZ(-s.avx * 0.012);

    const fov = 58 + clamp((s.speed - 12) * 0.5, -3, 4) + heat * 3;
    if (Math.abs(camera.fov - fov) > 0.02) {
      camera.fov = damp(camera.fov, fov, 2, dt);
      camera.updateProjectionMatrix();
    }

    /* ---- events ---- */
    if (s.mode === "play") {
      if (t >= SCREECH_TIME && !s.screeched) {
        s.screeched = true;
        onScreech();
      }
      if (t >= FLASH_TIME && !s.flashed) {
        s.flashed = true;
        onFlash();
      }
      if (t >= GAME_DURATION && !s.finished) {
        s.finished = true;
        s.mode = "done";
        onFinish();
      }
    }

    /* ---- HUD tick ---- */
    s.tickAcc += dt;
    const sec = Math.min(GAME_DURATION, Math.floor(t));
    if (s.tickAcc > 0.1 || sec !== s.lastSec) {
      s.tickAcc = 0;
      s.lastSec = sec;
      onTick({
        sec,
        alt: Math.round(3000 + t * 60 + s.jy * 55),
        kmh: Math.round(s.speed * 9),
        speed: s.speed,
        heat,
      });
    }
  }, -1);

  return (
    <>
      <mesh ref={skyRef} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[1000, 32, 18]} />
        <primitive object={skyMat} attach="material" />
      </mesh>

      <hemisphereLight ref={hemi} args={["#ffd9a8", "#4b3826", 1]} />
      <directionalLight
        ref={sunLight}
        position={[15, 55, -100]}
        intensity={2.8}
        color="#ffe0b0"
      />
      <directionalLight position={[-4, 7, 12]} intensity={1.5} color="#ffe9cf" />

      <Terrain />
      <Clouds sim={sim} />
      <WindStreaks sim={sim} />

      <Vulture groupRef={jatRef} anim={jatAnim} palette={JATAYU} scale={1} />
      <Vulture groupRef={samRef} anim={samAnim} palette={SAMPATI} scale={1.18}>
        <pointLight
          ref={fireLight}
          position={[0, 0.9, 0]}
          color="#ff7a2e"
          intensity={0}
          distance={18}
          decay={2}
        />
      </Vulture>
      <Flames target={samRef} anim={samAnim} />
    </>
  );
});

/* ------------------------------------------------------------------ */
/*  Audio (wind + synthesised screech fallback)                        */
/* ------------------------------------------------------------------ */

function createAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);

    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04;
      d[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    const wind = ctx.createGain();
    wind.gain.value = 0;
    src.connect(lp);
    lp.connect(wind);
    wind.connect(master);
    src.start();

    return {
      resume() {
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
      },
      setWind(speed, heat) {
        const now = ctx.currentTime;
        wind.gain.setTargetAtTime(0.05 + speed * 0.006, now, 0.2);
        lp.frequency.setTargetAtTime(400 + speed * 45 + heat * 500, now, 0.3);
      },
      setMuted(m) {
        master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
      },
      screech() {
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1500, t0);
        osc.frequency.exponentialRampToValueAtTime(2900, t0 + 0.25);
        osc.frequency.linearRampToValueAtTime(2300, t0 + 0.9);
        osc.frequency.exponentialRampToValueAtTime(1200, t0 + 1.5);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 38;
        const lg = ctx.createGain();
        lg.gain.value = 90;
        lfo.connect(lg);
        lg.connect(osc.frequency);
        const bpf = ctx.createBiquadFilter();
        bpf.type = "bandpass";
        bpf.frequency.value = 2200;
        bpf.Q.value = 1.2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.22, t0 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
        osc.connect(bpf);
        bpf.connect(g);
        g.connect(master);
        osc.start(t0);
        lfo.start(t0);
        osc.stop(t0 + 1.7);
        lfo.stop(t0 + 1.7);
      },
      close() {
        try {
          src.stop();
        } catch (e) {
          /* already stopped */
        }
        ctx.close().catch(() => {});
      },
    };
  } catch (e) {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  On-screen controls                                                 */
/* ------------------------------------------------------------------ */

function FlightControls({ sim }) {
  const bind = (axis, value) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      if (e.currentTarget.setPointerCapture) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) {
          /* ignore */
        }
      }
      sim.current.btn[axis] = value;
    },
    onPointerUp: () => {
      sim.current.btn[axis] = 0;
    },
    onPointerCancel: () => {
      sim.current.btn[axis] = 0;
    },
    onLostPointerCapture: () => {
      sim.current.btn[axis] = 0;
    },
    onContextMenu: (e) => e.preventDefault(),
  });

  return (
    <div className="tbo-controls">
      <div className="tbo-controls__group">
        <button type="button" className="tbo-control" aria-label="Climb" {...bind("y", 1)}>
          <ArrowUp size={24} />
        </button>
        <button type="button" className="tbo-control" aria-label="Dive" {...bind("y", -1)}>
          <ArrowDown size={24} />
        </button>
      </div>
      <div className="tbo-controls__group">
        <button type="button" className="tbo-control" aria-label="Bank left" {...bind("x", -1)}>
          <ArrowLeft size={24} />
        </button>
        <button type="button" className="tbo-control" aria-label="Bank right" {...bind("x", 1)}>
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Game shell                                                         */
/* ------------------------------------------------------------------ */

const KEY_MAP = {
  arrowleft: "left",
  a: "left",
  arrowright: "right",
  d: "right",
  arrowup: "up",
  w: "up",
  arrowdown: "down",
  s: "down",
};

const fmt = (n) => n.toLocaleString("en-US");

export default function TwoBrothersOneSky({ onComplete, onExit }) {
  const sim = useRef(null);
  if (!sim.current) sim.current = makeSim();
  const jatAnim = useRef(makeAnim(0.3));
  const samAnim = useRef(makeAnim(1.1));

  const [mode, setMode] = useState("intro");
  const [hud, setHud] = useState({ sec: 0, alt: 3000, kmh: 130 });
  const [flashKey, setFlashKey] = useState(0);
  const [muted, setMuted] = useState(false);

  const audioRef = useRef(null);
  const screechRef = useRef(null);
  const audioOkRef = useRef(true);
  const mutedRef = useRef(false);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = createAudio();
    if (audioRef.current) {
      audioRef.current.resume();
      audioRef.current.setMuted(mutedRef.current);
    }
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
    if (audioRef.current) audioRef.current.setMuted(muted);
    if (screechRef.current) screechRef.current.muted = muted;
  }, [muted]);

  useEffect(
    () => () => {
      if (audioRef.current) audioRef.current.close();
      audioRef.current = null;
    },
    []
  );

  const startGame = useCallback(() => {
    const s = sim.current;
    s.mode = "play";
    s.t = 0;
    s.finished = false;
    s.screeched = false;
    s.flashed = false;
    s.lastSec = -1;
    s.tickAcc = 1;
    s.btn.x = 0;
    s.btn.y = 0;
    s.keys = { left: false, right: false, up: false, down: false };
    jatAnim.current.fire = 0;
    samAnim.current.fire = 0;
    setHud({ sec: 0, alt: 3000, kmh: 130 });
    setFlashKey(0);
    setMode("play");
    ensureAudio();
  }, [ensureAudio]);

  const onTick = useCallback((d) => {
    setHud((prev) =>
      prev.sec === d.sec && prev.alt === d.alt && prev.kmh === d.kmh
        ? prev
        : { sec: d.sec, alt: d.alt, kmh: d.kmh }
    );
    if (audioRef.current) audioRef.current.setWind(d.speed, d.heat);
  }, []);

  const onFinish = useCallback(() => setMode("done"), []);
  const onFlash = useCallback(() => setFlashKey((k) => k + 1), []);
  const onScreech = useCallback(() => {
    if (mutedRef.current) return;
    const el = screechRef.current;
    const fallback = () => {
      if (audioRef.current) audioRef.current.screech();
    };
    if (el && audioOkRef.current) {
      el.currentTime = 0;
      el.play().catch(fallback);
    } else {
      fallback();
    }
  }, []);

  /* keyboard */
  useEffect(() => {
    const set = (e, value) => {
      const k = KEY_MAP[e.key.toLowerCase()];
      if (!k) return false;
      sim.current.keys[k] = value;
      return true;
    };
    const down = (e) => {
      if (e.key === "Enter" && mode === "intro") {
        e.preventDefault();
        startGame();
        return;
      }
      if (mode === "play" && set(e, true)) e.preventDefault();
    };
    const up = (e) => {
      set(e, false);
    };
    const blur = () => {
      sim.current.keys = { left: false, right: false, up: false, down: false };
      sim.current.btn.x = 0;
      sim.current.btn.y = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [mode, startGame]);

  const phase = mode === "play" ? phaseOf(hud.sec) : mode === "done" ? "ending" : "intro";

  useEffect(() => {
    if (phase !== "flight") {
      sim.current.btn.x = 0;
      sim.current.btn.y = 0;
    }
  }, [phase]);

  const caption = useMemo(() => {
    if (mode !== "play") return null;
    const i = CAPTIONS.findIndex(([a, b]) => hud.sec >= a && hud.sec < b);
    return i < 0 ? null : { i, text: CAPTIONS[i][2] };
  }, [mode, hud.sec]);

  const closeGame = () => {
    if (audioRef.current) audioRef.current.setWind(0, 0);
    onExit?.();
  };

  const remaining = Math.max(0, GAME_DURATION - hud.sec);
  const progressPct = clamp((hud.sec / FLASH_TIME) * 100, 0, 100);

  return (
    <motion.section
      className={`tbo-game is-${phase}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <audio
        ref={screechRef}
        src="/audio/vulture-screech.mp3"
        preload="auto"
        onError={() => {
          audioOkRef.current = false;
        }}
      />

      <div className="tbo-game__canvas">
        <Canvas
          camera={{ position: [0, 3, 11], fov: 58, near: 0.1, far: 2200 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.NoToneMapping;
          }}
        >
          <World
            sim={sim}
            jatAnim={jatAnim}
            samAnim={samAnim}
            onTick={onTick}
            onFinish={onFinish}
            onFlash={onFlash}
            onScreech={onScreech}
          />
        </Canvas>
      </div>

      <div className="tbo-vignette" />
      <div className="tbo-flare" />
      {phase === "heat" && <div className="tbo-heat" />}
      {phase === "shield" && <div className="tbo-shield-light" />}
      {flashKey > 0 && <div key={flashKey} className="tbo-whiteout" />}

      <button type="button" className="tbo-exit" onClick={closeGame} aria-label="Exit game">
        <X size={21} />
      </button>
      <button
        type="button"
        className="tbo-sound"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
      >
        {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
      </button>

      {mode === "intro" && (
        <div className="tbo-intro">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1 }}
            className="tbo-intro__content"
          >
            <span className="tbo-eyebrow">A Ramayana legend</span>
            <h1>
              Two Brothers,
              <br />
              One Sky
            </h1>
            <p className="tbo-lede">
              Two brothers. One horizon. A flight that would test the limits of courage and
              love.
            </p>
            <div className="tbo-keys">
              <span className="tbo-key">W A S D</span>
              <span className="tbo-keys__or">or</span>
              <span className="tbo-key">Arrow keys</span>
              <small>Climb, dive and bank to guide Jatayu through the sky.</small>
            </div>
            <button className="tbo-start" onClick={startGame}>
              <Play size={16} fill="currentColor" />
              Begin the flight
            </button>
          </motion.div>
        </div>
      )}

      {mode === "play" && (
        <>
          <div className="tbo-letterbox" />

          <div className="tbo-hud">
            <div className="tbo-hud__title">
              <span className="tbo-hud__label">{CHAPTERS[phase]}</span>
              <strong>Jatayu & Sampati</strong>
              <div className="tbo-telemetry">
                <span>
                  <b>{fmt(hud.alt)}</b> m
                </span>
                <span>
                  <b>{hud.kmh}</b> km/h
                </span>
              </div>
            </div>
            <div className="tbo-hud__timer" aria-label={`${remaining} seconds left`}>
              00:{String(remaining).padStart(2, "0")}
            </div>
          </div>

          <div className="tbo-journey" aria-hidden="true">
            <div className="tbo-journey__track">
              <div className="tbo-journey__fill" style={{ width: `${progressPct}%` }} />
              <div className="tbo-journey__bird" style={{ left: `${progressPct}%` }} />
            </div>
            <div className="tbo-journey__sun" />
          </div>

          <div className="tbo-caption" aria-live="polite">
            <AnimatePresence mode="wait">
              {caption && (
                <motion.p
                  key={caption.i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {caption.text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {phase === "flight" && <FlightControls sim={sim} />}

          {phase === "ending" && (
            <motion.div
              className="tbo-flashmsg"
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.5 }}
            >
              <span>Sampati’s wings burn.</span>
              <strong>Jatayu lives.</strong>
            </motion.div>
          )}
        </>
      )}

      {mode === "done" && (
        <div className="tbo-ending">
          <motion.div
            className="tbo-ending__content"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
          >
            <span className="tbo-eyebrow">The legend of two brothers</span>
            <h2>
              A brother’s
              <br />
              sacrifice
            </h2>
            <div className="tbo-ending__rule" />
            <p>One brother flew beyond his limits to protect the other.</p>
            <h3>The sacrifice of brotherly love</h3>
            <p className="tbo-ending__last">Their last flight together.</p>

            <div className="tbo-ending__actions">
              <button className="tbo-start" onClick={() => onComplete?.()}>
                Continue the journey
              </button>
              <button className="tbo-ghost" onClick={startGame}>
                <RotateCcw size={15} />
                Fly again
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.section>
  );
}