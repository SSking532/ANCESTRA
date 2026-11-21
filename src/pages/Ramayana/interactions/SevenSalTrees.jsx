import React, {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import {
  ArrowRight,
  RotateCcw,
  SkipForward,
  Sparkles as SparklesIcon,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import "./SevenSalTrees.css";

/* ════════════════════════════════════════════════════════════════════
   WORLD CONSTANTS
   The seven Sal trees stand in one straight line down the -Z axis.
   Rama stands at +Z. The arrow flies along x = 0, y = AIM_Y.
   ════════════════════════════════════════════════════════════════════ */

const TREE_COUNT = 7;
const TREE_Z = [-9, -14.5, -20, -25.5, -31, -36.5, -42];
const TREE_NAMES = [
  "The First Witness",
  "The Second Witness",
  "The Third Witness",
  "The Fourth Witness",
  "The Fifth Witness",
  "The Sixth Witness",
  "The Seventh Witness",
];

const AIM_Y = 1.72;
const TRUNK_H = 7.8;
const HOLE_OFFSET = 0.06;

const POV = new THREE.Vector3(0.1, 1.8, 2.9);
const T_READY = new THREE.Vector3(0, 1.76, -40);
const GRIP_Z = 1.1;
const REST_NOCK_Z = 1.55;
const MAX_DRAW = 0.72;
const ARROW_LEN = 1.0;
const FULL_DRAW = 0.97;
const BASE_SPEED = 21;

/* Flythrough timeline (seconds) */
const OUT = 9.4;
const HOLD = 0.9;
const RET = 3.5;
const FLY_TOTAL = OUT + HOLD + RET;

const RING_LEN = 2 * Math.PI * 52;

const GREENS = ["#2e6130", "#3f7a35", "#58913f", "#7aa84a", "#25512a", "#4c8a3c"];

/* ════════════════════════════════════════════════════════════════════
   MATH / HELPERS
   ════════════════════════════════════════════════════════════════════ */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const smoother = (t) => {
  t = clamp(t);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const trunkRadius = (y) => 0.62 - 0.22 * (y / TRUNK_H) + 0.38 * Math.exp(-y * 2.4);
const HIT_R = trunkRadius(AIM_Y);

const focusScale = (t) => 1 + 0.9 * (0.5 + 0.5 * Math.cos((2 * Math.PI * t) / 2.2));

const _up = new THREE.Vector3(0, 1, 0);
const _d = new THREE.Vector3();
function placeSegment(mesh, a, b) {
  if (!mesh) return;
  _d.subVectors(b, a);
  const len = Math.max(_d.length(), 0.0001);
  mesh.position.copy(a).addScaledVector(_d, 0.5);
  mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(_up, _d.normalize());
}

function setSRGB(t) {
  if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
  else if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
}

function canvasTexture(w, h, draw, repeat, wrap = true) {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (wrap) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 4;
  setSRGB(t);
  return t;
}

const texCache = {};
function cached(key, build) {
  if (!texCache[key]) texCache[key] = build();
  return texCache[key];
}

function getBark(rx, ry) {
  return cached(`bark-${rx}-${ry}`, () =>
    canvasTexture(
      512,
      512,
      (ctx, s) => {
        const r = rng(11);
        ctx.fillStyle = "#6a4d31";
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 560; i++) {
          const x = r() * s;
          const light = r() > 0.55;
          ctx.strokeStyle = light
            ? `rgba(168,134,92,${0.08 + r() * 0.18})`
            : `rgba(28,16,9,${0.14 + r() * 0.3})`;
          ctx.lineWidth = 1 + r() * 4;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          for (let y = 0; y <= s; y += 32) {
            ctx.lineTo(x + Math.sin(y * 0.03 + i) * 3, y);
          }
          ctx.stroke();
        }
        for (let i = 0; i < 90; i++) {
          ctx.fillStyle = `rgba(20,12,6,${0.1 + r() * 0.2})`;
          ctx.fillRect(r() * s, r() * s, 6 + r() * 22, 1 + r() * 2);
        }
      },
      [rx, ry]
    )
  );
}

function getGround() {
  return cached("ground", () =>
    canvasTexture(
      512,
      512,
      (ctx, s) => {
        const r = rng(5);
        ctx.fillStyle = "#5d7b38";
        ctx.fillRect(0, 0, s, s);
        const cols = ["#6f8f3f", "#4b6a2e", "#7c9a48", "#5a4a2c", "#3f5e2a"];
        for (let i = 0; i < 2600; i++) {
          ctx.fillStyle = cols[Math.floor(r() * cols.length)];
          ctx.globalAlpha = 0.1 + r() * 0.22;
          ctx.beginPath();
          ctx.arc(r() * s, r() * s, 2 + r() * 14, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      },
      [70, 70]
    )
  );
}

function getDirt() {
  return cached("dirt", () =>
    canvasTexture(
      256,
      256,
      (ctx, s) => {
        const r = rng(9);
        ctx.fillStyle = "#b39868";
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 900; i++) {
          ctx.fillStyle = r() > 0.5 ? "#c8ad7a" : "#8f7647";
          ctx.globalAlpha = 0.1 + r() * 0.25;
          ctx.beginPath();
          ctx.arc(r() * s, r() * s, 1 + r() * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      },
      [1.4, 30]
    )
  );
}

function getPathAlpha() {
  return cached("pathAlpha", () =>
    canvasTexture(
      128,
      4,
      (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, "#000");
        g.addColorStop(0.28, "#fff");
        g.addColorStop(0.72, "#fff");
        g.addColorStop(1, "#000");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      },
      null,
      false
    )
  );
}

function getBeamTex() {
  return cached("beam", () =>
    canvasTexture(
      64,
      256,
      (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, "rgba(255,240,190,0)");
        g.addColorStop(0.5, "rgba(255,240,190,1)");
        g.addColorStop(1, "rgba(255,240,190,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "destination-in";
        const v = ctx.createLinearGradient(0, 0, 0, h);
        v.addColorStop(0, "rgba(0,0,0,0)");
        v.addColorStop(0.25, "rgba(0,0,0,1)");
        v.addColorStop(0.75, "rgba(0,0,0,1)");
        v.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, w, h);
      },
      null,
      false
    )
  );
}

function getSkyTex() {
  return cached("sky", () =>
    canvasTexture(
      4,
      512,
      (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#3f8fd8");
        g.addColorStop(0.3, "#79b9e8");
        g.addColorStop(0.46, "#cfe6e0");
        g.addColorStop(0.5, "#e3ebc4");
        g.addColorStop(1, "#d8e5b9");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      },
      null,
      false
    )
  );
}

function fillInstances(mesh, items) {
  if (!mesh) return;
  const d = new THREE.Object3D();
  const col = new THREE.Color();
  items.forEach((it, i) => {
    d.position.set(it.p[0], it.p[1], it.p[2]);
    d.rotation.set(...(it.r || [0, 0, 0]));
    d.scale.set(...(it.s || [1, 1, 1]));
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    if (it.c) {
      col.set(it.c);
      mesh.setColorAt(i, col);
    }
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

/* ════════════════════════════════════════════════════════════════════
   AUDIO — fully synthesised, no assets
   ════════════════════════════════════════════════════════════════════ */

function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let birdTimer = null;
  let ambientStarted = false;

  const ensure = () => {
    if (ctx) return ctx;
    const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
    return ctx;
  };

  const safe = (fn) => (...args) => {
    try {
      if (!ensure()) return;
      fn(...args);
    } catch (e) {
      /* audio is optional */
    }
  };

  const noiseBuf = (dur) => {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  };

  const tone = (type, f0, f1, a, d, peak, delay = 0) => {
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + a + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + a + d + 0.05);
  };

  const burst = (filterType, f0, f1, a, d, peak, q = 1, delay = 0) => {
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf(a + d + 0.1);
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t0 + a + d);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
  };

  const chirp = () => {
    if (!ctx || muted) return;
    const base = 2300 + Math.random() * 1500;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      tone("sine", base, base * (1.2 + Math.random() * 0.4), 0.01, 0.07, 0.035, i * 0.11);
    }
  };

  const NOTES = [392, 440, 523.25, 587.33, 659.25, 783.99, 880];

  return {
    start: safe(() => {
      if (ctx.state === "suspended") ctx.resume();
      if (ambientStarted) return;
      ambientStarted = true;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf(4);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 650;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = 0.12;
      lfoG.gain.value = 0.02;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      src.connect(lp);
      lp.connect(g);
      g.connect(master);
      src.start();
      lfo.start();
      birdTimer = window.setInterval(() => {
        if (Math.random() < 0.65) chirp();
      }, 2100);
    }),
    setMuted: (m) => {
      muted = m;
      if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05);
    },
    creak: safe(() => {
      tone("sawtooth", 70, 150, 0.4, 1.0, 0.025);
      burst("bandpass", 300, 700, 0.5, 0.9, 0.025, 4);
    }),
    twang: safe(() => {
      tone("triangle", 260, 150, 0.004, 0.55, 0.22);
      tone("sine", 520, 300, 0.004, 0.35, 0.08);
      burst("highpass", 2200, 900, 0.004, 0.12, 0.12);
    }),
    whoosh: safe(() => {
      burst("bandpass", 500, 2600, 0.25, 1.8, 0.2, 0.9);
    }),
    thud: safe(() => {
      tone("sine", 120, 38, 0.003, 0.28, 0.5);
      burst("lowpass", 1800, 200, 0.003, 0.18, 0.4);
    }),
    chime: safe((n) => {
      const f = NOTES[clamp(n - 1, 0, 6)];
      tone("sine", f, f, 0.01, 1.6, 0.14);
      tone("sine", f * 2.01, f * 2.01, 0.01, 1.0, 0.05);
      tone("sine", f * 3.99, f * 3.99, 0.01, 0.6, 0.02);
    }),
    win: safe(() => {
      [261.63, 329.63, 392, 523.25].forEach((f, i) => {
        tone("sine", f, f, 0.05, 3.2, 0.1, i * 0.12);
        tone("triangle", f / 2, f / 2, 0.05, 3.2, 0.05, i * 0.12);
      });
    }),
    stop: () => {
      if (birdTimer) window.clearInterval(birdTimer);
      birdTimer = null;
      try {
        if (ctx) ctx.close();
      } catch (e) {
        /* noop */
      }
      ctx = null;
    },
  };
}

/* ════════════════════════════════════════════════════════════════════
   GAME STATE (mutable, read every frame — no React re-renders)
   ════════════════════════════════════════════════════════════════════ */

function makeGame() {
  return {
    phase: "intro",
    t: 0,
    time: 0,
    holding: false,
    draw: 0,
    focusT: 0,
    glide: 0,
    arrow: { x: 0, y: AIM_Y, z: 1.05, pitch: 0, roll: 0, visible: true },
    speed: 0,
    speedFx: 0,
    flightT: 0,
    hitFront: new Array(TREE_COUNT).fill(-1),
    hitBack: new Array(TREE_COUNT).fill(-1),
    pierced: 0,
    flash: 0,
    shake: 0,
    final: 0,
    stringVis: 0,
    releaseTime: -10,
    sway: new THREE.Vector3(),
    flashPos: new THREE.Vector3(0, AIM_Y, -9),
    mis: { vx: 0, vy: 0, vz: 0, landed: false, wait: 0 },
    camAfterZ: -48,
  };
}

/* ════════════════════════════════════════════════════════════════════
   ENVIRONMENT
   ════════════════════════════════════════════════════════════════════ */

function SkyDome() {
  const tex = useMemo(() => getSkyTex(), []);
  return (
    <mesh renderOrder={-10}>
      <sphereGeometry args={[400, 32, 16]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Mountains() {
  const items = useMemo(
    () => [
      [-100, -175, 70, 46, "#86a396"],
      [-45, -190, 90, 62, "#7f9c93"],
      [35, -180, 80, 50, "#8aa597"],
      [100, -172, 70, 42, "#86a396"],
      [0, -215, 130, 80, "#789590"],
    ],
    []
  );
  return (
    <group>
      {items.map(([x, z, r, h, c], i) => (
        <mesh key={i} position={[x, h / 2 - 2, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshStandardMaterial color={c} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Ground() {
  const ground = useMemo(() => getGround(), []);
  const dirt = useMemo(() => getDirt(), []);
  const alpha = useMemo(() => getPathAlpha(), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial map={ground} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -22]} receiveShadow>
        <planeGeometry args={[3.6, 90]} />
        <meshStandardMaterial map={dirt} alphaMap={alpha} transparent roughness={1} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Jungle() {
  const barkBg = useMemo(() => getBark(1, 3), []);
  const grassGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.04, 0.55, 3, 1);
    geo.translate(0, 0.275, 0);
    return geo;
  }, []);
  const refs = {
    trunks: useRef(),
    canopy: useRef(),
    bushes: useRef(),
    grass: useRef(),
    rocks: useRef(),
    flowers: useRef(),
  };

  const data = useMemo(() => {
    const r = rng(77);
    const trunks = [];
    const canopy = [];
    const barkCols = ["#d9c7a8", "#c2ad8c", "#e3d3b6", "#b59f80"];

    const addTree = (x, z) => {
      const h = 9 + r() * 8;
      const rad = 0.35 + r() * 0.45;
      trunks.push({
        p: [x, h / 2, z],
        r: [0, r() * 6, 0],
        s: [rad, h, rad],
        c: barkCols[Math.floor(r() * barkCols.length)],
      });
      const blobs = 4;
      for (let k = 0; k < blobs; k++) {
        const sz = 2.2 + r() * 2.4;
        canopy.push({
          p: [x + (r() - 0.5) * 3.4, h * (0.82 + r() * 0.3), z + (r() - 0.5) * 3.4],
          r: [r() * 3, r() * 3, r() * 3],
          s: [sz, sz * 0.75, sz],
          c: GREENS[Math.floor(r() * GREENS.length)],
        });
      }
    };

    for (let i = 0; i < 100; i++) {
      const side = r() < 0.5 ? -1 : 1;
      addTree(side * (5.8 + r() * 36), 14 - r() * 100);
    }
    for (let i = 0; i < 40; i++) addTree((r() - 0.5) * 90, -52 - r() * 40);

    const bushes = [];
    for (let i = 0; i < 240; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const s = 0.5 + r() * 0.9;
      bushes.push({
        p: [side * (2.3 + r() * 16), s * 0.3, 12 - r() * 70],
        r: [0, r() * 6, 0],
        s: [s * 1.3, s * 0.65, s * 1.3],
        c: GREENS[Math.floor(r() * GREENS.length)],
      });
    }

    const grassCols = ["#4f8a2f", "#6aa63a", "#3d7a2a", "#8cb84a", "#5c9a34"];
    const grass = [];
    for (let i = 0; i < 9000; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const x = side * (0.95 + Math.pow(r(), 1.7) * 17);
      const s = 0.7 + r() * 1.1;
      grass.push({
        p: [x, 0, 11 - r() * 74],
        r: [(r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5],
        s: [1, s, 1],
        c: grassCols[Math.floor(r() * grassCols.length)],
      });
    }

    const rocks = [];
    for (let i = 0; i < 38; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const s = 0.25 + r() * 0.7;
      rocks.push({
        p: [side * (1.9 + r() * 14), s * 0.25, 10 - r() * 66],
        r: [r() * 3, r() * 3, r() * 3],
        s: [s * 1.3, s * 0.7, s],
        c: r() > 0.6 ? "#6d7f55" : "#8d8574",
      });
    }

    const flowerCols = ["#ffd54a", "#fff4e0", "#ff9ab8", "#ffb347", "#c8a2ff"];
    const flowers = [];
    for (let i = 0; i < 280; i++) {
      const side = r() < 0.5 ? -1 : 1;
      flowers.push({
        p: [side * (1.2 + r() * 9), 0.32 + r() * 0.15, 9 - r() * 60],
        c: flowerCols[Math.floor(r() * flowerCols.length)],
      });
    }
    return { trunks, canopy, bushes, grass, rocks, flowers };
  }, []);

  useLayoutEffect(() => {
    fillInstances(refs.trunks.current, data.trunks);
    fillInstances(refs.canopy.current, data.canopy);
    fillInstances(refs.bushes.current, data.bushes);
    fillInstances(refs.grass.current, data.grass);
    fillInstances(refs.rocks.current, data.rocks);
    fillInstances(refs.flowers.current, data.flowers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <group>
      <instancedMesh ref={refs.trunks} args={[undefined, undefined, data.trunks.length]} castShadow receiveShadow frustumCulled={false}>
        <cylinderGeometry args={[0.8, 1, 1, 10, 1]} />
        <meshStandardMaterial map={barkBg} roughness={1} />
      </instancedMesh>

      <instancedMesh ref={refs.canopy} args={[undefined, undefined, data.canopy.length]} castShadow receiveShadow frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={1} flatShading />
      </instancedMesh>

      <instancedMesh ref={refs.bushes} args={[undefined, undefined, data.bushes.length]} receiveShadow frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={1} flatShading />
      </instancedMesh>

      <instancedMesh ref={refs.grass} args={[undefined, undefined, data.grass.length]} geometry={grassGeo} frustumCulled={false}>
        <meshStandardMaterial roughness={1} />
      </instancedMesh>

      <instancedMesh ref={refs.rocks} args={[undefined, undefined, data.rocks.length]} castShadow receiveShadow frustumCulled={false}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={1} flatShading />
      </instancedMesh>

      <instancedMesh ref={refs.flowers} args={[undefined, undefined, data.flowers.length]} frustumCulled={false}>
        <sphereGeometry args={[0.07, 6, 5]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

function SunShafts({ g }) {
  const tex = useMemo(() => getBeamTex(), []);
  const mats = useRef([]);
  const beams = useMemo(() => {
    const r = rng(33);
    return Array.from({ length: 11 }, (_, i) => ({
      x: -17 + i * 3.4 + (r() - 0.5) * 2,
      z: 5 - r() * 52,
      w: 2.2 + r() * 3.2,
      h: 30,
      tilt: 0.38 + r() * 0.12,
      yaw: (r() - 0.5) * 0.5,
      ph: r() * 6,
      base: 0.1 + r() * 0.1,
    }));
  }, []);

  useFrame(() => {
    beams.forEach((b, i) => {
      const m = mats.current[i];
      if (m) m.opacity = b.base * (0.75 + 0.25 * Math.sin(g.time * 0.4 + b.ph));
    });
  });

  return (
    <group>
      {beams.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2 - 1, b.z]} rotation={[0, b.yaw, b.tilt]}>
          <planeGeometry args={[b.w, b.h]} />
          <meshBasicMaterial
            ref={(m) => (mats.current[i] = m)}
            map={tex}
            color="#ffe9b0"
            transparent
            opacity={b.base}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ════════════════════════════════════════════════════════════════════
   THE SEVEN SAL TREES
   ════════════════════════════════════════════════════════════════════ */

function buildTrunkGeometry(seed) {
  const geo = new THREE.CylinderGeometry(1, 1, TRUNK_H, 28, 26, true);
  geo.translate(0, TRUNK_H / 2, 0);
  const pos = geo.attributes.position;
  const r = rng(seed);
  const p1 = r() * 6;
  const p2 = r() * 6;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ang = Math.atan2(z, x);
    const n = 1 + 0.022 * Math.sin(ang * 3 + y * 1.1 + p1) + 0.012 * Math.sin(ang * 7 - y * 2.3 + p2);
    const R = trunkRadius(y) * n;
    pos.setX(i, Math.cos(ang) * R);
    pos.setZ(i, Math.sin(ang) * R);
  }
  geo.computeVertexNormals();
  return geo;
}

const SPLINTERS = Array.from({ length: 9 }, (_, i) => {
  const a = (i / 9) * Math.PI * 2;
  return { a, len: 0.1 + ((i * 37) % 10) * 0.012 };
});

function HoleMark({ side, refs }) {
  const flip = side === "back";
  return (
    <group
      ref={refs.group}
      position={[0, 0, flip ? -(HIT_R + HOLE_OFFSET) : HIT_R + HOLE_OFFSET]}
      rotation={[0, flip ? Math.PI : 0, 0]}
      visible={false}
    >
      <mesh>
        <circleGeometry args={[0.105, 28]} />
        <meshBasicMaterial ref={refs.dark} color="#140b05" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <ringGeometry args={[0.105, 0.14, 28]} />
        <meshStandardMaterial color="#c9a36a" roughness={1} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[0.1, 24]} />
        <meshBasicMaterial
          ref={refs.core}
          color="#ffe2a0"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {SPLINTERS.map((s, i) => (
        <group key={i} rotation={[0, 0, s.a]}>
          <mesh position={[0.15, 0, 0.03]} rotation={[Math.PI / 2, 0.35, 0]}>
            <coneGeometry args={[0.016, s.len, 4]} />
            <meshStandardMaterial color="#b68a55" roughness={1} />
          </mesh>
        </group>
      ))}
      <mesh ref={refs.ring} position={[0, 0, 0.02]}>
        <ringGeometry args={[0.12, 0.17, 40]} />
        <meshBasicMaterial
          ref={refs.ringMat}
          color="#ffd98a"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function HeroTree({ index, g }) {
  const z = TREE_Z[index];
  const seed = 101 + index * 17;
  const trunkGeo = useMemo(() => buildTrunkGeometry(seed), [seed]);
  const bark = useMemo(() => getBark(3, 5), []);
  const leaves = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: 11 }, () => ({
      p: [(r() - 0.5) * 3.4, TRUNK_H - 0.7 + r() * 3.4, (r() - 0.5) * 3.4],
      s: [1.5 + r() * 1.3, 1.1 + r() * 0.9, 1.5 + r() * 1.3],
      c: GREENS[Math.floor(r() * GREENS.length)],
      rot: [r() * 3, r() * 3, r() * 3],
    }));
  }, [seed]);

  const sway = useRef();
  const frontRefs = { group: useRef(), dark: useRef(), core: useRef(), ring: useRef(), ringMat: useRef() };
  const backRefs = { group: useRef(), dark: useRef(), core: useRef(), ring: useRef(), ringMat: useRef() };
  const groundRing = useRef();
  const light = useRef();
  const dark = useMemo(() => new THREE.Color("#140b05"), []);
  const gold = useMemo(() => new THREE.Color("#ffe9a8"), []);

  useFrame(() => {
    const time = g.time;
    if (sway.current) sway.current.rotation.z = Math.sin(time * 0.5 + index) * 0.01;

    const hf = g.hitFront[index];
    const hb = g.hitBack[index];
    const pulse = (refs, h) => {
      if (refs.group.current) refs.group.current.visible = h >= 0;
      if (h < 0) return;
      const tt = time - h;
      if (refs.ring.current && refs.ringMat.current) {
        if (tt < 0.9) {
          const s = 1 + tt * 10;
          refs.ring.current.scale.set(s, s, 1);
          refs.ringMat.current.opacity = (1 - tt / 0.9) * 0.9;
        } else {
          refs.ringMat.current.opacity = 0;
        }
      }
      if (refs.core.current) refs.core.current.opacity = 0.2 + 0.8 * g.final;
      if (refs.dark.current) refs.dark.current.color.lerpColors(dark, gold, g.final);
    };
    pulse(frontRefs, hf);
    pulse(backRefs, hb);

    if (groundRing.current) {
      const on = hb >= 0 ? 1 : 0;
      groundRing.current.material.opacity = on * (0.35 + 0.35 * g.final + 0.1 * Math.sin(time * 2 + index));
    }
    if (light.current) {
      const flash = hf >= 0 ? Math.max(0, 1 - (time - hf) * 1.4) * 2.5 : 0;
      light.current.intensity = (hf >= 0 ? 0.5 + g.final * 2.4 : 0) + flash;
    }
  });

  return (
    <group position={[0, 0, z]}>
      <mesh geometry={trunkGeo} castShadow receiveShadow>
        <meshStandardMaterial map={bark} bumpMap={bark} bumpScale={0.8} color="#d6c4a6" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      {/* buttress roots */}
      {Array.from({ length: 7 }).map((_, k) => {
        const a = (k / 7) * Math.PI * 2 + index;
        return (
          <mesh
            key={k}
            position={[Math.cos(a) * 0.62, 0.22, Math.sin(a) * 0.62]}
            rotation={[Math.sin(a) * 0.95, 0, -Math.cos(a) * 0.95]}
            castShadow
          >
            <coneGeometry args={[0.2, 1.3, 7]} />
            <meshStandardMaterial map={bark} color="#cdb99a" roughness={1} />
          </mesh>
        );
      })}

      {/* moss */}
      <mesh position={[0.3, 0.12, 0.5]} scale={[0.9, 0.35, 0.8]}>
        <sphereGeometry args={[0.55, 10, 8]} />
        <meshStandardMaterial color="#4d7a35" roughness={1} />
      </mesh>
      <mesh position={[-0.45, 0.1, -0.3]} scale={[0.8, 0.3, 0.7]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshStandardMaterial color="#5a8a3c" roughness={1} />
      </mesh>

      {/* canopy */}
      <group ref={sway} position={[0, 0, 0]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.7, TRUNK_H - 1.2, 0]} rotation={[0, 0, side * -0.75]} castShadow>
            <cylinderGeometry args={[0.1, 0.18, 2.2, 8]} />
            <meshStandardMaterial map={bark} color="#cdb99a" roughness={1} />
          </mesh>
        ))}
        {leaves.map((l, i) => (
          <mesh key={i} position={l.p} scale={l.s} rotation={l.rot} castShadow receiveShadow>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={l.c} roughness={1} flatShading />
          </mesh>
        ))}
      </group>

      {/* arrow wounds */}
      <group position={[0, AIM_Y, 0]}>
        <HoleMark side="front" refs={frontRefs} />
        <HoleMark side="back" refs={backRefs} />
        <pointLight ref={light} position={[0, 0.05, HIT_R + 0.45]} color="#ffd27a" intensity={0} distance={5} decay={1.6} />
      </group>

      <mesh ref={groundRing} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.0, 1.12, 56]} />
        <meshBasicMaterial
          color="#f0cb79"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function LightBeam({ g }) {
  const core = useRef();
  const glow = useRef();
  useFrame(() => {
    const f = g.final;
    if (core.current) {
      core.current.visible = f > 0.001;
      core.current.material.opacity = 0.85 * f;
    }
    if (glow.current) {
      glow.current.visible = f > 0.001;
      glow.current.material.opacity = 0.2 * f * (0.85 + 0.15 * Math.sin(g.time * 3));
    }
  });
  const len = 56;
  const cz = 2 - len / 2;
  return (
    <group position={[0, AIM_Y, cz]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh ref={core} visible={false}>
        <cylinderGeometry args={[0.028, 0.028, len, 10, 1, true]} />
        <meshBasicMaterial color="#fff3cf" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={glow} visible={false}>
        <cylinderGeometry args={[0.16, 0.16, len, 16, 1, true]} />
        <meshBasicMaterial color="#ffd37a" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PARTICLES (wood chips, golden sparks, falling leaves)
   ════════════════════════════════════════════════════════════════════ */

function Particles({ rig, name, count, gravity = 9, drag = 0, spin = 8, children }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const st = useMemo(
    () => ({
      i: 0,
      active: 0,
      pos: new Float32Array(count * 3),
      vel: new Float32Array(count * 3),
      rot: new Float32Array(count * 3),
      sp: new Float32Array(count * 3),
      life: new Float32Array(count),
      max: new Float32Array(count),
      size: new Float32Array(count),
    }),
    [count]
  );

  useEffect(() => {
    rig.current[name] = (x, y, z, n, o = {}) => {
      const { dirZ = 1, speed = 4, up = 2, size = 1, life = 1.4, spread = 0.12 } = o;
      for (let k = 0; k < n; k++) {
        const i = st.i;
        st.i = (st.i + 1) % count;
        const j = i * 3;
        st.pos[j] = x + (Math.random() - 0.5) * spread;
        st.pos[j + 1] = y + (Math.random() - 0.5) * spread;
        st.pos[j + 2] = z + (Math.random() - 0.5) * spread;
        st.vel[j] = (Math.random() - 0.5) * speed * 1.1;
        st.vel[j + 1] = Math.random() * up + 0.3;
        st.vel[j + 2] = dirZ * (0.3 + Math.random()) * speed;
        st.rot[j] = Math.random() * 6;
        st.rot[j + 1] = Math.random() * 6;
        st.rot[j + 2] = Math.random() * 6;
        st.sp[j] = (Math.random() - 0.5) * spin;
        st.sp[j + 1] = (Math.random() - 0.5) * spin;
        st.sp[j + 2] = (Math.random() - 0.5) * spin;
        st.max[i] = life * (0.6 + Math.random() * 0.7);
        st.life[i] = st.max[i];
        st.size[i] = size * (0.6 + Math.random() * 0.8);
      }
      st.active = count;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig, name, count]);

  useFrame((_, delta) => {
    if (!st.active || !mesh.current) return;
    const dt = Math.min(delta, 0.05);
    let any = false;
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      if (st.life[i] > 0) {
        any = true;
        st.life[i] -= dt;
        st.vel[j + 1] -= gravity * dt;
        if (drag) {
          const f = Math.exp(-drag * dt);
          st.vel[j] *= f;
          st.vel[j + 2] *= f;
        }
        st.pos[j] += st.vel[j] * dt;
        st.pos[j + 1] += st.vel[j + 1] * dt;
        st.pos[j + 2] += st.vel[j + 2] * dt;
        if (st.pos[j + 1] < 0.02) {
          st.pos[j + 1] = 0.02;
          st.vel[j] *= 0.4;
          st.vel[j + 1] = 0;
          st.vel[j + 2] *= 0.4;
        }
        st.rot[j] += st.sp[j] * dt;
        st.rot[j + 1] += st.sp[j + 1] * dt;
        st.rot[j + 2] += st.sp[j + 2] * dt;
        const k = clamp(st.life[i] / st.max[i]);
        const s = st.size[i] * Math.min(1, k * 3);
        dummy.position.set(st.pos[j], st.pos[j + 1], st.pos[j + 2]);
        dummy.rotation.set(st.rot[j], st.rot[j + 1], st.rot[j + 2]);
        dummy.scale.setScalar(s);
      } else {
        dummy.position.set(0, -50, 0);
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (!any) st.active = 0;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false} castShadow={false}>
      {children}
    </instancedMesh>
  );
}

/* ════════════════════════════════════════════════════════════════════
   RAMA'S BOW, ARM AND THE ARROW
   ════════════════════════════════════════════════════════════════════ */

const bowH = (d) => 0.86 - 0.04 * d;
const bowTZ = (d) => 0.45 + 0.13 * d;

function buildBow(d) {
  const H = bowH(d);
  const TZ = bowTZ(d);
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const s = (i / 24) * 2 - 1;
    pts.push(new THREE.Vector3(0, s * H, TZ * Math.pow(Math.abs(s), 2.2)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.02, 8, false);
}

function Archery({ g }) {
  const root = useRef();
  const bow = useRef();
  const strA = useRef();
  const strB = useRef();
  const capA = useRef();
  const capB = useRef();
  const arrow = useRef();
  const spinG = useRef();
  const trail = useRef();
  const arrowLight = useRef();
  const armL = useRef();
  const armR = useRef();
  const handR = useRef();
  const builtD = useRef(0);
  const bowGeo = useMemo(() => buildBow(0), []);
  const skin = "#5f82a3";

  useEffect(() => {
    placeSegment(armL.current, new THREE.Vector3(-0.42, 1.46, 2.85), new THREE.Vector3(-0.05, 1.69, 1.24));
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = g.time;
    const ph = g.phase;
    const nocked = ph === "intro" || ph === "fly" || ph === "ready" || ph === "draw";
    const flying = ph === "flight" || ph === "after";

    if (root.current) root.current.position.copy(g.sway);

    g.stringVis = nocked ? g.draw : damp(g.stringVis, 0, 26, dt);
    const d = g.stringVis;

    if (bow.current && Math.abs(d - builtD.current) > 0.012) {
      bow.current.geometry.dispose();
      bow.current.geometry = buildBow(d);
      builtD.current = d;
    }
    const H = bowH(d);
    const TZ = bowTZ(d);
    const wob = nocked ? 0 : Math.sin(time * 85) * 0.05 * Math.exp(-(time - g.releaseTime) * 10);
    const nockLocalZ = REST_NOCK_Z - GRIP_Z + MAX_DRAW * d;
    const top = new THREE.Vector3(0, H, TZ);
    const bot = new THREE.Vector3(0, -H, TZ);
    const nock = new THREE.Vector3(wob, 0, nockLocalZ);
    placeSegment(strA.current, top, nock);
    placeSegment(strB.current, nock, bot);
    if (capA.current) capA.current.position.copy(top);
    if (capB.current) capB.current.position.copy(bot);

    // arrow pose
    const a = g.arrow;
    if (arrow.current) {
      if (nocked) {
        arrow.current.visible = true;
        arrow.current.position.set(0, AIM_Y, REST_NOCK_Z + MAX_DRAW * g.draw - ARROW_LEN / 2);
        arrow.current.rotation.set(0, 0, 0);
        if (spinG.current) spinG.current.rotation.z = 0;
      } else {
        arrow.current.visible = a.visible;
        arrow.current.position.set(a.x, a.y, a.z);
        arrow.current.rotation.set(a.pitch, 0, 0);
        if (spinG.current) spinG.current.rotation.z = a.roll;
      }
    }
    if (trail.current) {
      trail.current.visible = flying;
      trail.current.scale.set(1, 1, 0.25 + g.speedFx * 1.5);
    }
    if (arrowLight.current) arrowLight.current.intensity = flying ? 2.6 : 0;

    // right hand
    if (handR.current) {
      handR.current.visible = nocked;
      const nz = REST_NOCK_Z + MAX_DRAW * g.draw;
      handR.current.position.set(0.05, 1.665, nz + 0.07);
      placeSegment(armR.current, new THREE.Vector3(0.05, 1.64, nz + 0.12), new THREE.Vector3(0.55, 1.42, 3.5));
    }
  });

  return (
    <group ref={root}>
      {/* the bow */}
      <group position={[-0.03, AIM_Y, GRIP_Z]}>
        <mesh ref={bow} geometry={bowGeo} castShadow>
          <meshStandardMaterial color="#3b2314" roughness={0.5} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.032, 0.032, 0.24, 12]} />
          <meshStandardMaterial color="#8a2f1c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <torusGeometry args={[0.03, 0.007, 8, 16]} />
          <meshStandardMaterial color="#e2b85e" metalness={0.6} roughness={0.35} emissive="#6e4d12" />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <torusGeometry args={[0.03, 0.007, 8, 16]} />
          <meshStandardMaterial color="#e2b85e" metalness={0.6} roughness={0.35} emissive="#6e4d12" />
        </mesh>
        <mesh ref={capA}>
          <sphereGeometry args={[0.03, 12, 10]} />
          <meshStandardMaterial color="#e2b85e" metalness={0.6} roughness={0.35} emissive="#6e4d12" />
        </mesh>
        <mesh ref={capB}>
          <sphereGeometry args={[0.03, 12, 10]} />
          <meshStandardMaterial color="#e2b85e" metalness={0.6} roughness={0.35} emissive="#6e4d12" />
        </mesh>
        <mesh ref={strA}>
          <cylinderGeometry args={[0.005, 0.005, 1, 5]} />
          <meshBasicMaterial color="#f2e6c8" />
        </mesh>
        <mesh ref={strB}>
          <cylinderGeometry args={[0.005, 0.005, 1, 5]} />
          <meshBasicMaterial color="#f2e6c8" />
        </mesh>
      </group>

      {/* bow arm */}
      <mesh ref={armL} castShadow>
        <cylinderGeometry args={[0.04, 0.062, 1, 14]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh position={[-0.08, 1.665, 1.32]}>
        <cylinderGeometry args={[0.052, 0.052, 0.2, 14]} />
        <meshStandardMaterial color="#e2b85e" metalness={0.6} roughness={0.35} emissive="#6e4d12" />
      </mesh>
      <mesh position={[-0.045, 1.7, 1.12]} scale={[1, 1.1, 1.2]}>
        <sphereGeometry args={[0.058, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>

      {/* draw hand + forearm */}
      <mesh ref={armR}>
        <cylinderGeometry args={[0.062, 0.045, 1, 14]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <group ref={handR}>
        <mesh scale={[0.8, 0.7, 1.2]}>
          <sphereGeometry args={[0.05, 12, 10]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        <mesh position={[-0.03, 0.03, -0.06]} scale={[0.5, 0.5, 1.4]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        <mesh position={[0.01, 0.028, -0.05]} scale={[0.5, 0.5, 1.4]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
      </group>

      {/* the arrow — origin at its centre, nose toward -Z */}
      <group ref={arrow}>
        <group ref={spinG}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]} castShadow>
            <cylinderGeometry args={[0.011, 0.011, 0.92, 8]} />
            <meshStandardMaterial color="#e0bb82" roughness={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.42]} castShadow>
            <coneGeometry args={[0.034, 0.16, 12]} />
            <meshStandardMaterial color="#f0c860" metalness={0.7} roughness={0.28} emissive="#8a5e12" emissiveIntensity={0.7} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <group key={k} rotation={[0, 0, (k / 3) * Math.PI * 2]}>
              <mesh position={[0.03, 0, 0.4]}>
                <boxGeometry args={[0.055, 0.004, 0.2]} />
                <meshStandardMaterial color={k === 0 ? "#b32525" : "#f4ecd8"} roughness={0.8} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0, 0.51]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.04, 8]} />
            <meshStandardMaterial color="#e2b85e" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
        <group ref={trail} position={[0, 0, 0.5]} visible={false}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.4]}>
            <coneGeometry args={[0.06, 2.8, 16, 1, true]} />
            <meshBasicMaterial
              color="#ffd27a"
              transparent
              opacity={0.32}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.9]}>
            <coneGeometry args={[0.022, 1.8, 10, 1, true]} />
            <meshBasicMaterial
              color="#fff6d8"
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
        <pointLight ref={arrowLight} color="#ffd27a" intensity={0} distance={6} decay={1.5} />
      </group>
    </group>
  );
}

/* ════════════════════════════════════════════════════════════════════
   DIRECTOR — camera, timeline and gameplay
   ════════════════════════════════════════════════════════════════════ */

function buildCurves() {
  const outPts = [
    new THREE.Vector3(POV.x, POV.y, POV.z),
    new THREE.Vector3(0.22, 3.15, 1.1),
    new THREE.Vector3(0.45, 2.9, -3.6),
  ];
  TREE_Z.forEach((z, i) => {
    const s = i % 2 === 0 ? 1 : -1;
    outPts.push(new THREE.Vector3(s * 1.35, i === 0 ? 2.1 : 1.65 + (i % 3) * 0.1, z));
    if (i < TREE_COUNT - 1) outPts.push(new THREE.Vector3(0, 1.95, z - 2.75));
  });
  outPts.push(new THREE.Vector3(0, 2.3, TREE_Z[TREE_COUNT - 1] - 5.5));

  const retPts = [new THREE.Vector3(0, 2.3, TREE_Z[TREE_COUNT - 1] - 5.5)];
  for (let i = TREE_COUNT - 1; i >= 0; i--) {
    const s = i % 2 === 0 ? -1 : 1;
    retPts.push(new THREE.Vector3(s * 1.5, 1.9, TREE_Z[i]));
    if (i > 0) retPts.push(new THREE.Vector3(0, 2.0, TREE_Z[i] + 2.75));
  }
  retPts.push(new THREE.Vector3(0.45, 2.6, -3.0));
  retPts.push(new THREE.Vector3(0.25, 3.1, 1.2));
  retPts.push(new THREE.Vector3(POV.x, POV.y, POV.z));

  return {
    out: new THREE.CatmullRomCurve3(outPts, false, "centripetal"),
    ret: new THREE.CatmullRomCurve3(retPts, false, "centripetal"),
  };
}

function Director({ g, rig, cb, audio }) {
  const { camera } = useThree();
  const curves = useMemo(buildCurves, []);
  const flashRef = useRef();
  const S = useMemo(
    () => ({
      pos: POV.clone(),
      look: T_READY.clone(),
      dPos: new THREE.Vector3(),
      dLook: new THREE.Vector3(),
      fov: 52,
      roll: 0,
    }),
    []
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    g.time += dt;
    g.t += dt;
    const time = g.time;
    g.flash = damp(g.flash, 0, 5, dt);
    g.shake = damp(g.shake, 0, 5.5, dt);
    g.sway.set(0, 0, 0);

    const setPhase = (p) => {
      if (g.phase === p) return;
      g.phase = p;
      g.t = 0;
      if (cb.current.phase) cb.current.phase(p);
    };

    const impact = (i, side) => {
      const front = side === "front";
      const zz = TREE_Z[i] + (front ? HIT_R : -HIT_R);
      const chips = rig.current.chips;
      const sparks = rig.current.sparks;
      const leaves = rig.current.leaves;
      if (chips) chips(0, AIM_Y, zz, front ? 28 : 40, { dirZ: front ? 1 : -1, speed: front ? 4.5 : 7, up: 3, size: 1 });
      if (sparks) sparks(0, AIM_Y, zz, front ? 20 : 34, { dirZ: front ? 1 : -1, speed: front ? 5 : 8, up: 3.5, size: 1, life: 0.9 });
      if (front && leaves) leaves((Math.random() - 0.5) * 2, 8.5, TREE_Z[i], 16, { dirZ: 0.2, speed: 1.2, up: 0.5, size: 1, life: 3.6, spread: 3 });
      g.flash = front ? 0.85 : 0.5;
      g.shake = front ? 1 : 0.6;
      g.flashPos.set(0, AIM_Y + 0.3, zz + (front ? 1.2 : -1.2));
      audio.thud();
      if (front) g.hitFront[i] = time;
      else {
        g.hitBack[i] = time;
        g.pierced += 1;
        audio.chime(g.pierced);
        if (cb.current.pierce) cb.current.pierce(g.pierced);
      }
    };

    const phase = g.phase;
    const dPos = S.dPos;
    const dLook = S.dLook;
    let kPos = 8;
    let kLook = 8;
    let kFov = 4;
    let fovT = 52;
    let rollT = 0;
    g.speedFx = damp(g.speedFx, 0, 3, dt);

    /* ───────── INTRO ───────── */
    if (phase === "intro") {
      const a = time * 0.16;
      dPos.set(POV.x + Math.sin(a) * 0.08, POV.y + Math.sin(a * 1.3) * 0.04, POV.z - 0.1);
      dLook.set(T_READY.x + Math.sin(a) * 1.6, T_READY.y + 0.2 + Math.sin(a * 0.8) * 0.1, T_READY.z);
      kPos = 3;
      kLook = 2;
      fovT = 54;
    }

    /* ───────── FLYTHROUGH ───────── */
    else if (phase === "fly") {
      const t = g.t;
      kPos = 80;
      kLook = 4.5;
      kFov = 4;
      if (t < OUT) {
        const u = smoother(t / OUT);
        curves.out.getPointAt(u, dPos);
        let zt = dPos.z - 20;
        for (let i = 0; i < TREE_COUNT; i++) {
          if (TREE_Z[i] < dPos.z - 3.2) {
            zt = TREE_Z[i];
            break;
          }
        }
        dLook.set(0, 1.85, zt);
        fovT = 52 + 7 * Math.sin(Math.PI * u);
        rollT = -dPos.x * 0.014;
        g.speedFx = 0.25 + 0.2 * Math.sin(Math.PI * u);
      } else if (t < OUT + HOLD) {
        curves.out.getPointAt(1, dPos);
        dPos.z -= (t - OUT) * 0.25;
        dLook.set(0, 1.95, dPos.z - 20);
        fovT = 46;
      } else {
        const tt = clamp((t - OUT - HOLD) / RET);
        const u = smoother(tt);
        curves.ret.getPointAt(u, dPos);
        const w = smoothstep(0.72, 1, tt);
        dLook.set(0, 1.8, dPos.z - 14).lerp(T_READY, w);
        fovT = 50 + 34 * Math.sin(Math.PI * tt);
        kFov = 7;
        kLook = 7;
        g.speedFx = Math.sin(Math.PI * tt);
        if (t >= FLY_TOTAL) {
          g.draw = 0;
          g.holding = false;
          setPhase("ready");
        }
      }
    }

    /* ───────── READY / DRAW ───────── */
    else if (phase === "ready" || phase === "draw") {
      if (phase === "ready" && g.holding) {
        setPhase("draw");
        audio.creak();
      } else if (phase === "draw") {
        if (g.holding) {
          g.draw = Math.min(1, g.draw + dt / 1.45);
          if (g.draw >= 1) g.focusT += dt;
        } else if (g.draw < 0.08) {
          g.draw = 0;
          g.focusT = 0;
          setPhase("ready");
        } else if (g.draw >= FULL_DRAW) {
          const r = focusScale(g.focusT);
          const acc = 1 - clamp((r - 1) / 0.9);
          if (cb.current.rating) cb.current.rating(acc > 0.86 ? "FLAWLESS" : acc > 0.55 ? "TRUE" : "STEADY");
          g.arrow.x = 0;
          g.arrow.y = AIM_Y;
          g.arrow.z = REST_NOCK_Z + MAX_DRAW * g.draw - ARROW_LEN / 2;
          g.arrow.pitch = 0;
          g.arrow.roll = 0;
          g.arrow.visible = true;
          g.speed = 0;
          g.flightT = 0;
          g.hitFront.fill(-1);
          g.hitBack.fill(-1);
          g.pierced = 0;
          g.final = 0;
          g.releaseTime = time;
          g.shake = 0.35;
          audio.twang();
          audio.whoosh();
          g.draw = 0;
          g.focusT = 0;
          setPhase("flight");
        } else {
          const dd = g.draw;
          g.arrow.x = 0;
          g.arrow.y = AIM_Y;
          g.arrow.z = REST_NOCK_Z + MAX_DRAW * dd - ARROW_LEN / 2;
          g.arrow.roll = 0;
          g.arrow.visible = true;
          g.mis.vx = 0;
          g.mis.vy = 1.6 + 2.2 * dd;
          g.mis.vz = -(4 + 12 * dd);
          g.mis.landed = false;
          g.mis.wait = 0;
          g.releaseTime = time;
          audio.twang();
          g.draw = 0;
          g.focusT = 0;
          if (cb.current.miss) cb.current.miss();
          setPhase("misfire");
        }
      }
      if (g.phase === "ready" || g.phase === "draw") {
        const calm = 1 - 0.7 * g.draw;
        const trem = g.draw >= 1 ? Math.sin(time * 37) * 0.0025 : 0;
        const sx = Math.sin(time * 0.6) * 0.012 * calm + Math.sin(time * 1.7) * 0.004 + trem;
        const sy = Math.sin(time * 0.8 + 1) * 0.01 * calm + trem * 0.7;
        const sz = -0.25 * smoothstep(0, 1, g.draw);
        g.sway.set(sx, sy, sz);
        dPos.set(POV.x + sx, POV.y + sy, POV.z + sz);
        dLook.set(T_READY.x + sx, T_READY.y + sy, T_READY.z);
        fovT = 50 - 11 * smoothstep(0, 1, g.draw);
        g.speedFx = g.draw * 0.35;
        if (g.glide > 0) {
          g.glide -= dt;
          kPos = 2.2;
          kLook = 2.2;
        } else {
          kPos = 8;
          kLook = 8;
        }
      }
    }

    /* ───────── MISFIRE ───────── */
    else if (phase === "misfire") {
      const a = g.arrow;
      const m = g.mis;
      if (!m.landed) {
        m.vy -= 9.8 * dt;
        a.x += m.vx * dt;
        a.y += m.vy * dt;
        a.z += m.vz * dt;
        a.pitch = Math.atan2(m.vy, -m.vz);
        if (a.y <= 0.06) {
          a.y = 0.06;
          m.landed = true;
          audio.thud();
        }
      } else {
        m.wait += dt;
        if (m.wait > 1.3) {
          a.visible = true;
          g.draw = 0;
          setPhase("ready");
        }
      }
      dPos.set(POV.x, POV.y, POV.z);
      dLook.set(T_READY.x, T_READY.y - 0.15, T_READY.z);
      fovT = 52;
      kPos = 5;
      kLook = 5;
    }

    /* ───────── FLIGHT (chase cam) ───────── */
    else if (phase === "flight" || phase === "after") {
      const a = g.arrow;
      if (phase === "flight") {
        g.flightT += dt;
        const tip0 = a.z - ARROW_LEN / 2;
        let near = 99;
        for (let i = 0; i < TREE_COUNT; i++) near = Math.min(near, Math.abs(tip0 - TREE_Z[i]));
        const slow = 0.15 + 0.85 * smoothstep(0, 1.3, near);
        const ramp = smoothstep(0, 0.45, g.flightT);
        g.speed = BASE_SPEED * (0.1 + 0.9 * ramp) * slow;
        a.z -= g.speed * dt;
        a.roll += dt * (6 + g.speed * 0.5);
        g.speedFx = clamp(g.speed / BASE_SPEED);

        const tip = a.z - ARROW_LEN / 2;
        for (let i = 0; i < TREE_COUNT; i++) {
          if (g.hitFront[i] < 0 && tip <= TREE_Z[i] + HIT_R) impact(i, "front");
          if (g.hitFront[i] >= 0 && g.hitBack[i] < 0 && tip <= TREE_Z[i] - HIT_R) impact(i, "back");
        }

        // chase camera
        let dMin = 99;
        let idx = 0;
        for (let i = 0; i < TREE_COUNT; i++) {
          const dd = Math.abs(tip - TREE_Z[i]);
          if (dd < dMin) {
            dMin = dd;
            idx = i;
          }
        }
        const prox = 1 - smoothstep(0.6, 5.0, dMin);
        const side = idx % 2 === 0 ? 1 : -1;
        const lat = smoothstep(0.1, 0.7, prox);
        dPos.set(
          side * 1.7 * lat + Math.sin(time * 2.3) * 0.12 * (1 - prox),
          AIM_Y + 0.12 + 0.4 * (1 - prox),
          tip + (3.0 - 1.7 * prox)
        );
        dLook.set(0, AIM_Y, tip - 0.2 - (1 - prox) * 7);
        fovT = 40 + 26 * clamp(g.speed / BASE_SPEED);
        rollT = side * 0.035 * prox;
        kPos = 7;
        kLook = 9;
        kFov = 5;

        if (g.hitBack[TREE_COUNT - 1] >= 0 && tip < TREE_Z[TREE_COUNT - 1] - 9) {
          g.camAfterZ = S.pos.z;
          setPhase("after");
        }
      } else {
        // phase === "after": arrow flies on into the mist, camera sweeps to the hero shot
        a.z -= BASE_SPEED * 0.9 * dt;
        a.roll += dt * 14;
        if (a.z < -70) a.visible = false;
        g.speedFx = damp(g.speedFx, 0, 1.5, dt);
        g.final = smoothstep(0.4, 3.0, g.t);
        if (g.t < 1.3) {
          const tip = a.z - ARROW_LEN / 2;
          dPos.set(-3.2, 2.4, g.camAfterZ);
          dLook.set(0, AIM_Y, tip);
          kPos = 3;
          kLook = 6;
          fovT = 50;
        } else {
          const h = 1 - Math.exp(-(g.t - 1.3) * 0.3);
          dPos.set(-2.4 - 1.6 * h, 1.9 + 1.4 * h, 8.0 - 1.0 * h);
          dLook.set(0.3, 2.2, -24);
          kPos = 1.4;
          kLook = 2.4;
          fovT = 46;
        }
        kFov = 2.5;
        if (g.t > 4.0) setPhase("complete");
      }
    }

    /* ───────── COMPLETE (hero drift) ───────── */
    else if (phase === "complete") {
      g.final = 1;
      const h = 1 - Math.exp(-(g.t + 2.7) * 0.3);
      dPos.set(-2.4 - 1.6 * h + Math.sin(time * 0.13) * 0.25, 1.9 + 1.4 * h, 8.0 - 1.0 * h);
      dLook.set(0.3, 2.2, -24);
      fovT = 46;
      kPos = 1.2;
      kLook = 2;
      kFov = 2;
      a_hide(g);
    }

    /* ───────── apply camera ───────── */
    const kp = 1 - Math.exp(-kPos * dt);
    const kl = 1 - Math.exp(-kLook * dt);
    S.pos.lerp(dPos, kp);
    S.look.lerp(dLook, kl);
    S.fov = damp(S.fov, fovT, kFov, dt);
    S.roll = damp(S.roll, rollT, 4, dt);

    const sk = g.shake;
    camera.position.set(
      S.pos.x + Math.sin(time * 53) * 0.05 * sk,
      S.pos.y + Math.sin(time * 61 + 1) * 0.05 * sk,
      S.pos.z + Math.sin(time * 47 + 2) * 0.03 * sk
    );
    camera.lookAt(S.look);
    camera.rotateZ(S.roll + Math.sin(time * 43) * 0.02 * sk);
    if (Math.abs(camera.fov - S.fov) > 0.01) {
      camera.fov = S.fov;
      camera.updateProjectionMatrix();
    }

    if (flashRef.current) {
      flashRef.current.position.copy(g.flashPos);
      flashRef.current.intensity = g.flash * 40;
    }
  });

  return <pointLight ref={flashRef} color="#ffd890" intensity={0} distance={14} decay={1.5} />;
}

function a_hide(g) {
  g.arrow.visible = false;
}

/* ════════════════════════════════════════════════════════════════════
   SCENE
   ════════════════════════════════════════════════════════════════════ */

function Scene({ g, rig, cb, audio }) {
  const sunTarget = useMemo(() => new THREE.Object3D(), []);
  const sun = useRef();
  useLayoutEffect(() => {
    if (sun.current) sun.current.shadow.camera.updateProjectionMatrix();
  }, []);
  return (
    <>
      <color attach="background" args={["#d8e5b9"]} />
      <fog attach="fog" args={["#d8e5b9", 14, 260]} />

      <hemisphereLight args={["#fff4d0", "#5e7a3c", 1.15]} />
      <ambientLight intensity={0.35} color="#fff0d0" />
      <directionalLight
        ref={sun}
        position={[-14, 26, 16]}
        intensity={3.4}
        color="#ffe6b0"
        castShadow
        target={sunTarget}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-bias={-0.0004}
      />
      <primitive object={sunTarget} position={[0, 0, -20]} />
      <directionalLight position={[12, 8, -10]} intensity={0.6} color="#a9c4d8" />

      <SkyDome />
      <Mountains />
      <Ground />
      <Jungle />
      <SunShafts g={g} />

      {TREE_Z.map((_, i) => (
        <HeroTree key={i} index={i} g={g} />
      ))}

      <LightBeam g={g} />
      <Archery g={g} />

      <Particles rig={rig} name="chips" count={260} gravity={9} spin={14}>
        <boxGeometry args={[0.06, 0.035, 0.12]} />
        <meshStandardMaterial color="#a67c48" roughness={1} />
      </Particles>
      <Particles rig={rig} name="sparks" count={220} gravity={3} spin={2}>
        <sphereGeometry args={[0.028, 6, 6]} />
        <meshBasicMaterial color="#ffd98a" toneMapped={false} />
      </Particles>
      <Particles rig={rig} name="leaves" count={160} gravity={0.9} drag={1.2} spin={5}>
        <planeGeometry args={[0.16, 0.09]} />
        <meshStandardMaterial color="#6fa042" roughness={1} side={THREE.DoubleSide} />
      </Particles>

      <Sparkles count={240} scale={[14, 7, 58]} position={[0, 3.5, -22]} size={3.4} speed={0.3} opacity={0.55} color="#fff3c4" />
      <Sparkles count={90} scale={[16, 2.5, 50]} position={[0, 1.2, -20]} size={2.2} speed={0.45} opacity={0.5} color="#ffe9a0" />

      <Director g={g} rig={rig} cb={cb} audio={audio} />
    </>
  );
}

const CAMERA_OPTS = { position: [POV.x, POV.y, POV.z], fov: 52, near: 0.05, far: 500 };
const GL_OPTS = { antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping };

/* memoised so React state changes in the HUD never touch the 3D scene */
const SacredForest = React.memo(function SacredForest({ g, rig, cb, audio }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={CAMERA_OPTS}
      gl={GL_OPTS}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.0;
      }}
    >
      <Scene g={g} rig={rig} cb={cb} audio={audio} />
    </Canvas>
  );
});

/* ════════════════════════════════════════════════════════════════════
   UI
   ════════════════════════════════════════════════════════════════════ */

const PHASE_TO_UI = {
  intro: "intro",
  fly: "fly",
  ready: "ready",
  draw: "ready",
  misfire: "ready",
  flight: "flight",
  after: "flight",
  complete: "complete",
};

const CAPTIONS = [
  [500, "Seven Sal trees. One straight line."],
  [3600, "Each one older than the doubt in Sugriva's heart."],
  [6700, "To prove his strength, Rama must pierce them all\u2009—\u2009with a single arrow."],
  [10500, "Now\u2009—\u2009the bow is yours."],
];

export default function SevenSalTrees({ onComplete, onExit }) {
  const gRef = useRef(null);
  if (!gRef.current) gRef.current = makeGame();
  const g = gRef.current;

  const rig = useRef({});
  const cb = useRef({});
  const audio = useMemo(() => createAudio(), []);

  const rootRef = useRef(null);
  const ringRef = useRef(null);
  const focusRef = useRef(null);

  const [ui, setUi] = useState("intro");
  const [pierced, setPierced] = useState(0);
  const [toast, setToast] = useState(null);
  const [notice, setNotice] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [rating, setRating] = useState("");
  const [caption, setCaption] = useState(null);
  const [muted, setMuted] = useState(false);

  cb.current = {
    phase: (p) => {
      setUi(PHASE_TO_UI[p]);
      if (p === "draw") setNotice("");
      if (p === "complete") audio.win();
    },
    pierce: (n) => {
      setPierced(n);
      setToast({ n, key: `${n}-${Date.now()}` });
    },
    miss: () => {
      setAttempts((a) => a + 1);
      setNotice("The arrow falls short. Draw the bow fully.");
    },
    rating: (r) => setRating(r),
  };

  const goPhase = useCallback(
    (p) => {
      g.phase = p;
      g.t = 0;
      cb.current.phase(p);
    },
    [g]
  );

  /* live CSS variables + HUD — driven from the game state, not React state */
  useEffect(() => {
    let raf;
    const loop = () => {
      const el = rootRef.current;
      if (el) {
        el.style.setProperty("--flash", g.flash.toFixed(3));
        el.style.setProperty("--speed", g.speedFx.toFixed(3));
        el.style.setProperty("--draw", g.draw.toFixed(3));
        const state = g.phase === "draw" ? (g.draw >= 1 ? "full" : "drawing") : "idle";
        if (el.dataset.hold !== state) el.dataset.hold = state;
        if (ringRef.current) ringRef.current.style.strokeDashoffset = String(RING_LEN * (1 - g.draw));
        if (focusRef.current) {
          const full = g.phase === "draw" && g.draw >= 1;
          focusRef.current.style.opacity = full ? "1" : "0";
          focusRef.current.style.transform = `translate(-50%, -50%) scale(${focusScale(g.focusT).toFixed(3)})`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [g]);

  /* keyboard */
  useEffect(() => {
    const down = (e) => {
      if ((e.code === "Space" || e.code === "Enter") && !e.repeat && g.phase === "ready") {
        e.preventDefault();
        g.holding = true;
      }
    };
    const up = (e) => {
      if (e.code === "Space" || e.code === "Enter") g.holding = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [g]);

  useEffect(() => () => audio.stop(), [audio]);

  /* narration during the flythrough */
  useEffect(() => {
    if (ui !== "fly") {
      setCaption(null);
      return undefined;
    }
    const timers = CAPTIONS.map(([ms, text], i) => window.setTimeout(() => setCaption({ text, key: i }), ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [ui]);

  const begin = () => {
    audio.start();
    g.draw = 0;
    g.holding = false;
    goPhase("fly");
  };

  const skip = () => {
    if (g.phase !== "fly") return;
    g.t = g.t < OUT + HOLD ? OUT + HOLD : FLY_TOTAL;
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    audio.setMuted(m);
  };

  const replay = () => {
    g.hitFront.fill(-1);
    g.hitBack.fill(-1);
    g.pierced = 0;
    g.final = 0;
    g.draw = 0;
    g.focusT = 0;
    g.holding = false;
    g.glide = 2.8;
    g.arrow.visible = true;
    setPierced(0);
    setRating("");
    setAttempts(0);
    setNotice("");
    goPhase("ready");
  };

  const pressStart = (e) => {
    if (g.phase !== "ready") return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      /* noop */
    }
    g.holding = true;
  };
  const pressEnd = () => {
    g.holding = false;
  };

  const showTrack = ui === "ready" || ui === "flight" || ui === "complete";

  return (
    <main ref={rootRef} className="sal-game" data-ui={ui} data-hold="idle">
      <div className="sal-game__canvas">
        <Suspense fallback={null}>
          <SacredForest g={g} rig={rig} cb={cb} audio={audio} />
        </Suspense>
      </div>

      <div className="sal-game__vignette" />
      <div className="sal-game__speed" />
      <div className="sal-game__flash" />
      <div className="sal-game__grain" />
      <div className="sal-bar sal-bar--top" />
      <div className="sal-bar sal-bar--bottom" />

      <header className="sal-game__topbar">
        <div className="sal-game__brand">
          <span className="sal-game__brand-symbol">✦</span>
          <span>ANCESTRA</span>
          <i />
          
        </div>

        <div className="sal-game__tools">
          <button type="button" className="sal-game__icon" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button type="button" className="sal-game__icon sal-game__icon--exit" onClick={onExit} aria-label="Exit game">
            <X size={18} />
          </button>
        </div>
      </header>

      {ui !== "intro" && (
        <div className="sal-game__scene-label">
          <span>THE SACRED FOREST</span>
          <i />
          <span>SEVEN WITNESSES</span>
        </div>
      )}

      {showTrack && (
        <div className="sal-track" aria-label="Witnesses pierced">
          {TREE_NAMES.map((name, i) => (
            <span key={name} className={`sal-track__node ${i < pierced ? "is-done" : ""}`} title={name}>
              <b>{i < pierced ? "✦" : "·"}</b>
            </span>
          ))}
          <em>
            {pierced} / {TREE_COUNT}
          </em>
        </div>
      )}

      {toast && ui === "flight" && (
        <div className="sal-toast" key={toast.key}>
          <SparklesIcon size={14} />
          <span>{TREE_NAMES[toast.n - 1]}</span>
          <small>PIERCED</small>
        </div>
      )}

      {ui === "intro" && (
        <section className="sal-panel sal-panel--intro">
          <div className="sal-panel__ornament">✦</div>
          <p className="sal-panel__eyebrow">A TEST OF STRENGTH</p>

          <h1>
            The Seven
            <em>Sal Trees</em>
          </h1>

          <div className="sal-panel__divider">
            <span />✦<span />
          </div>

          <p className="sal-panel__story">
            Sugriva had witnessed Vali's extraordinary strength. Even now, uncertainty remained in his heart.
          </p>
          <p className="sal-panel__story">
            Before they could journey towards Kishkindha, he wished to know whether Rama truly possessed the strength to
            stand against his brother.
          </p>

          <p className="sal-panel__quote">
            "These seven Sal trees stand before us. Let their witness answer what words cannot."
          </p>

          <button type="button" className="sal-button" onClick={begin}>
            <span>ENTER THE FOREST</span>
            <ArrowRight size={17} />
          </button>

          <small className="sal-panel__footnote">A CINEMATIC TRIAL · HOLD · RELEASE · WITNESS · SOUND ON</small>
        </section>
      )}

      {ui === "fly" && (
        <>
          {caption && (
            <div className="sal-caption" key={caption.key}>
              {caption.text}
            </div>
          )}
          <button type="button" className="sal-skip" onClick={skip}>
            SKIP <SkipForward size={13} />
          </button>
        </>
      )}

      {ui === "ready" && (
        <>
          <div
            className="sal-hold-zone"
            onPointerDown={pressStart}
            onPointerUp={pressEnd}
            onPointerCancel={pressEnd}
            onLostPointerCapture={pressEnd}
            onContextMenu={(e) => e.preventDefault()}
          />

          <div className="sal-reticle" aria-hidden="true">
            <i />
            <span ref={focusRef} className="sal-reticle__focus" />
          </div>

          <div className="sal-hud">
            <div className="sal-hold">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle className="sal-hold__track" cx="60" cy="60" r="52" />
                <circle
                  ref={ringRef}
                  className="sal-hold__fill"
                  cx="60"
                  cy="60"
                  r="52"
                  strokeDasharray={RING_LEN}
                  strokeDashoffset={RING_LEN}
                />
              </svg>
              <span className="sal-hold__label">HOLD</span>
            </div>
            <div className="sal-hud__text">
              <p className="sal-hud__eyebrow">YOUR ARROW</p>
              <p className="sal-hud__line sal-hud__line--idle">Press and hold anywhere to draw the bow.</p>
              <p className="sal-hud__line sal-hud__line--drawing">Draw… keep holding.</p>
              <p className="sal-hud__line sal-hud__line--full">Full draw. Release as the ring closes.</p>
            </div>
          </div>

          {notice && <div className="sal-notice">{notice}</div>}
        </>
      )}

      {ui === "flight" && rating && <div className="sal-release">RELEASED · {rating}</div>}

      {ui === "complete" && (
        <section className="sal-panel sal-panel--complete">
          <div className="sal-panel__ornament">✦</div>
          <p className="sal-panel__eyebrow">THE SEVEN HAVE BORNE WITNESS</p>

          <h1>
            The Test
            <em>Is Passed.</em>
          </h1>

          <div className="sal-panel__divider">
            <span />✦<span />
          </div>

          <p className="sal-panel__story">
            One arrow. Seven trunks. Not one of them was spared. Sugriva's doubt gave way to understanding.
          </p>

          <p className="sal-panel__quote">The promise has been proven. Kishkindha awaits.</p>

          <div className="sal-game__result">
            <div>
              <strong>07</strong>
              <span>TREES PIERCED</span>
            </div>
            <i />
            <div>
              <strong className="is-word">{rating || "TRUE"}</strong>
              <span>YOUR RELEASE</span>
            </div>
            <i />
            <div>
              <strong>{String(attempts).padStart(2, "0")}</strong>
              <span>SHORT DRAWS</span>
            </div>
          </div>

          <button type="button" className="sal-button" onClick={onComplete}>
            <span>RETURN TO THE CHRONICLE</span>
            <ArrowRight size={17} />
          </button>

          <button type="button" className="sal-text-button sal-text-button--restart" onClick={replay}>
            <RotateCcw size={14} />
            LOOSE THE ARROW AGAIN
          </button>
        </section>
      )}

      <footer className="sal-game__footer">
        <span>✦</span>
        <p>THE PAST CANNOT BE CHANGED</p>
        <span>✦</span>
      </footer>
    </main>
  );
}