import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, Sparkles } from "@react-three/drei";
import {
  ArrowRight,
  Check,
  Crown,
  Map as MapIcon,
  Mountain,
  SkipForward,
  Trees,
  Users,
  Volume2,
  VolumeX,
  Waves,
  Wind,
} from "lucide-react";
import "./KingsLivingMap.css";

/* ════════════════════════════════════════════════════════════════════
   THE KING'S LIVING MAP
   A dormant night-map awakens at dawn: the land rises, rivers run,
   Kishkindha lights up and four search parties march out to find Sita.
   ════════════════════════════════════════════════════════════════════ */

/* ───────────────────────── world constants ───────────────────────── */
const R = 4.5; // radius of the floating diorama
const BASE = 1; // terrain is built with +BASE so the rock slab sits at y = 0
const WL = 0.1; // water level (world units)
const CAMP_U = 0.6; // how far along a route the camp stands

/* ───────────────────────── small helpers ─────────────────────────── */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(ix, iy) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function vnoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2;
    a *= 0.5;
  }
  return s;
}
function ridged(x, y) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    const n = 1 - Math.abs(vnoise(x * f, y * f) * 2 - 1);
    s += a * n * n;
    f *= 2.1;
    a *= 0.5;
  }
  return s;
}

/* ───────────────────────── story data ────────────────────────────── */
const REGIONS = [
  {
    id: "north",
    name: "The Northern Lands",
    short: "North",
    dir: [0, -1],
    reach: 3.85,
    bend: 0.38,
    color: "#8cc4ff",
    icon: Mountain,
    terrain: "Mountains and ancient settlements",
    description:
      "The northern search party must travel through distant lands, observing every road, settlement and mountain pass.",
    leaders: [
      { name: "Shatabali", role: "Commander of the northern party" },
      { name: "Vanara scouts", role: "Watchers of the high passes" },
    ],
    party: [
      { kind: "leader", color: "#4f86c9", scale: 1.12, lat: 0, back: 0 },
      { kind: "vanara", color: "#9a7447", scale: 1, lat: -0.09, back: 0.03 },
      { kind: "vanara", color: "#8a6a42", scale: 1, lat: 0.09, back: 0.03 },
    ],
  },
  {
    id: "east",
    name: "The Eastern Lands",
    short: "East",
    dir: [1, 0],
    reach: 3.8,
    bend: -0.3,
    color: "#8bdc86",
    icon: Trees,
    terrain: "Forests and river valleys",
    description:
      "The eastern expedition is sent across unfamiliar country. Every region must be examined with patience and care.",
    leaders: [
      { name: "Vinata", role: "Commander of the eastern party" },
      { name: "Vanara trackers", role: "Readers of forest and river" },
    ],
    party: [
      { kind: "leader", color: "#3f9a55", scale: 1.12, lat: 0, back: 0 },
      { kind: "vanara", color: "#9a7447", scale: 1, lat: -0.09, back: 0.03 },
      { kind: "vanara", color: "#8a6a42", scale: 1, lat: 0.09, back: 0.03 },
    ],
  },
  {
    id: "west",
    name: "The Western Lands",
    short: "West",
    dir: [-1, 0],
    reach: 3.85,
    bend: 0.35,
    color: "#f3d56e",
    icon: Wind,
    terrain: "Wide plains and distant forests",
    description:
      "The western search party must continue beyond familiar routes and look for any trace that may guide the search.",
    leaders: [
      { name: "Sushena", role: "Commander of the western party" },
      { name: "Vanara riders", role: "Swift scouts of the plains" },
    ],
    party: [
      { kind: "leader", color: "#c79a2c", scale: 1.12, lat: 0, back: 0 },
      { kind: "vanara", color: "#9a7447", scale: 1, lat: -0.09, back: 0.03 },
      { kind: "vanara", color: "#8a6a42", scale: 1, lat: 0.09, back: 0.03 },
    ],
  },
  {
    id: "south",
    name: "The Southern Lands",
    short: "South",
    dir: [0, 1],
    reach: 2.3,
    bend: 0.3,
    color: "#ffa347",
    icon: Waves,
    terrain: "Forests, mountains and the great ocean",
    description:
      "The southern expedition will travel under Angada's leadership, with Jambavan's wisdom and Hanuman's strength beside him.",
    leaders: [
      { name: "Angada", role: "Leader of the expedition" },
      { name: "Jambavan", role: "Wisdom and experience" },
      { name: "Hanuman", role: "Strength and devotion" },
    ],
    party: [
      { kind: "angada", color: "#3c6fcf", scale: 1.08, lat: 0, back: 0 },
      { kind: "jambavan", color: "#6b5848", scale: 1.05, lat: -0.1, back: 0.03 },
      { kind: "hanuman", color: "#ee7d2b", scale: 1.28, lat: 0.1, back: 0.03 },
    ],
  },
];
const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

const CAPTIONS = [
  "Sugriva’s command is given: return within one month.",
  "North, east and west, the search parties march into unknown lands.",
  "In the south, Angada, Jambavan and Hanuman turn toward the ocean.",
];

/* ───────────────────────── terrain maths ─────────────────────────── */
function regionW(x, z) {
  const r = Math.hypot(x, z) || 1;
  const nx = x / r;
  const nz = z / r;
  const p = (v) => Math.pow(Math.max(0, v), 2.2);
  const n = p(-nz);
  const e = p(nx);
  const s = p(nz);
  const w = p(-nx);
  const t = n + e + s + w || 1;
  return { n: n / t, e: e / t, s: s / t, w: w / t };
}

function heightAt(x, z) {
  const r = Math.hypot(x, z);
  const w = regionW(x, z);
  const n = fbm(x * 0.85 + 7.3, z * 0.85 - 3.1);
  const hill = n - 0.45;
  const edge = sstep(0.9, 2.7, r);
  const mtn = ridged(x * 0.52 + 2.0, z * 0.52 + 9.0);

  const hN = 0.38 + hill * 0.5 + mtn * 2.5 * edge;
  const hE = 0.38 + hill * 1.0 + edge * 0.12 * Math.sin(x * 1.3 + z);
  const hW = 0.3 + hill * 0.45 + 0.05 * Math.sin(x * 2.0) * Math.cos(z * 1.7);
  const coast = sstep(2.0, 4.0, z + (n - 0.45) * 1.4);
  const hS = 0.38 + hill * 0.9 - coast * 1.15;

  let h = hN * w.n + hE * w.e + hW * w.w + hS * w.s;

  // the eastern river, running from the northern peaks to the southern sea
  const xc = 3.0 + 0.45 * Math.sin(z * 0.95 + 0.6);
  const d = Math.abs(x - xc);
  const carve =
    (1 - sstep(0.0, 0.34, d)) * sstep(1.6, 2.2, r) * sstep(-3.9, -2.8, z);
  h = h * (1 - carve) + (WL - 0.2) * carve;

  // Kishkindha's plateau
  const pl = 1 - sstep(0.85, 1.45, r);
  h = h * (1 - pl) + 0.38 * pl;
  return h;
}

/* ───────────────────────── biome colours ─────────────────────────── */
const PAL = {
  meadow: new THREE.Color("#86a14c"),
  lush: new THREE.Color("#5d9440"),
  grassDark: new THREE.Color("#3c6a33"),
  plainsA: new THREE.Color("#c9b366"),
  plainsB: new THREE.Color("#a9994f"),
  rock: new THREE.Color("#8d7d6b"),
  rockDark: new THREE.Color("#5f5348"),
  snow: new THREE.Color("#f6f1e8"),
  sand: new THREE.Color("#dcc590"),
  seabed: new THREE.Color("#a79a76"),
  seabedDeep: new THREE.Color("#4b5a58"),
  plaza: new THREE.Color("#d8c296"),
  plazaDark: new THREE.Color("#a78d62"),
};
const _t = new THREE.Color();
function addC(out, c, k) {
  out.r += c.r * k;
  out.g += c.g * k;
  out.b += c.b * k;
}
function biomeColor(x, z, h, slope, out) {
  const r = Math.hypot(x, z);
  const w = regionW(x, z);
  const nv = vnoise(x * 5.2 + 11, z * 5.2 - 5);
  const nv2 = vnoise(x * 1.7 - 3, z * 1.7 + 8);
  out.setRGB(0, 0, 0);

  if (w.n > 0.001) {
    _t.copy(PAL.meadow).lerp(PAL.grassDark, nv * 0.7);
    const rockT = sstep(0.62, 1.15, h + (nv2 - 0.5) * 0.3);
    _t.lerp(PAL.rock, rockT).lerp(PAL.rockDark, rockT * nv * 0.6);
    _t.lerp(PAL.snow, sstep(1.45, 1.78, h + (nv - 0.5) * 0.35));
    addC(out, _t, w.n);
  }
  if (w.e > 0.001) {
    _t.copy(PAL.lush).lerp(PAL.grassDark, nv * 0.85);
    addC(out, _t, w.e);
  }
  if (w.w > 0.001) {
    _t.copy(PAL.plainsA).lerp(PAL.plainsB, nv).lerp(PAL.lush, sstep(0.55, 0.85, nv2) * 0.35);
    addC(out, _t, w.w);
  }
  if (w.s > 0.001) {
    _t.copy(PAL.lush).lerp(PAL.meadow, nv2 * 0.6).lerp(PAL.grassDark, nv * 0.4);
    addC(out, _t, w.s);
  }

  out.lerp(PAL.rock, sstep(0.75, 1.5, slope) * 0.85);
  out.lerp(PAL.sand, (1 - sstep(WL + 0.03, WL + 0.15, h)) * 0.95);
  out.lerp(PAL.seabed, sstep(WL + 0.01, WL - 0.15, h));
  out.lerp(PAL.seabedDeep, sstep(WL, WL - 0.7, h));

  const pz = 1 - sstep(0.8, 1.0, r);
  if (pz > 0) {
    const ringLine = Math.abs(Math.sin(r * 26)) > 0.93 ? 0.55 : 0;
    _t.copy(PAL.plaza).lerp(PAL.plazaDark, ringLine);
    out.lerp(_t, pz);
  }
}

/* ───────────────────── procedural geometry (cached) ───────────────── */
function polarIndex(rings, segs) {
  const idx = [];
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * segs + j;
      const b = i * segs + ((j + 1) % segs);
      const c = (i + 1) * segs + j;
      const d = (i + 1) * segs + ((j + 1) % segs);
      idx.push(a, b, c, b, d, c);
    }
  }
  return idx;
}

let _terrainGeo;
function getTerrainGeo() {
  if (_terrainGeo) return _terrainGeo;
  const rings = 120;
  const segs = 240;
  const pos = new Float32Array((rings + 1) * segs * 3);
  const col = new Float32Array(pos.length);
  const c = new THREE.Color();
  let p = 0;
  for (let i = 0; i <= rings; i++) {
    const rr = (R * i) / rings;
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      const h = heightAt(x, z);
      const e = 0.05;
      const slope =
        Math.hypot(heightAt(x + e, z) - h, heightAt(x, z + e) - h) / e;
      biomeColor(x, z, h, slope, c);
      pos[p] = x;
      pos[p + 1] = h + BASE;
      pos[p + 2] = z;
      col[p] = c.r;
      col[p + 1] = c.g;
      col[p + 2] = c.b;
      p += 3;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setIndex(polarIndex(rings, segs));
  g.computeVertexNormals();
  _terrainGeo = g;
  return g;
}

let _skirtGeo;
function getSkirtGeo() {
  if (_skirtGeo) return _skirtGeo;
  const segs = 240;
  const rows = 9;
  const strata = [
    "#5f4630",
    "#8c6b46",
    "#a68256",
    "#7d5d3c",
    "#614833",
    "#9a7a52",
    "#4d3a28",
    "#6f553a",
    "#3f2f22",
  ].map((h) => new THREE.Color(h));
  const pos = [];
  const col = [];
  const nor = [];
  const c = new THREE.Color();
  const push = (x, y, z, nx, nz, color) => {
    pos.push(x, y, z);
    nor.push(nx, 0, nz);
    col.push(color.r, color.g, color.b);
  };
  for (let j = 0; j < segs; j++) {
    const a0 = (j / segs) * Math.PI * 2;
    const a1 = ((j + 1) / segs) * Math.PI * 2;
    const x0 = Math.cos(a0) * R;
    const z0 = Math.sin(a0) * R;
    const x1 = Math.cos(a1) * R;
    const z1 = Math.sin(a1) * R;
    const t0 = heightAt(x0, z0) + BASE;
    const t1 = heightAt(x1, z1) + BASE;
    for (let k = 0; k < rows; k++) {
      const f0 = k / rows;
      const f1 = (k + 1) / rows;
      const ya0 = t0 * (1 - f0);
      const yb0 = t0 * (1 - f1);
      const ya1 = t1 * (1 - f0);
      const yb1 = t1 * (1 - f1);
      c.copy(strata[k]).multiplyScalar(0.88 + 0.24 * hash2(j >> 1, k));
      const nx0 = Math.cos(a0);
      const nz0 = Math.sin(a0);
      const nx1 = Math.cos(a1);
      const nz1 = Math.sin(a1);
      push(x0, ya0, z0, nx0, nz0, c);
      push(x1, ya1, z1, nx1, nz1, c);
      push(x0, yb0, z0, nx0, nz0, c);
      push(x1, ya1, z1, nx1, nz1, c);
      push(x1, yb1, z1, nx1, nz1, c);
      push(x0, yb0, z0, nx0, nz0, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  _skirtGeo = g;
  return g;
}

let _waterGeo;
function getWaterGeo() {
  if (_waterGeo) return _waterGeo;
  const rings = 90;
  const segs = 180;
  const pos = new Float32Array((rings + 1) * segs * 3);
  const depth = new Float32Array((rings + 1) * segs);
  let p = 0;
  let q = 0;
  for (let i = 0; i <= rings; i++) {
    const rr = (R * i) / rings;
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      pos[p++] = x;
      pos[p++] = 0;
      pos[p++] = z;
      depth[q++] = Math.max(0, WL - heightAt(x, z));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aDepth", new THREE.BufferAttribute(depth, 1));
  g.setIndex(polarIndex(rings, segs));
  _waterGeo = g;
  return g;
}

let _baseGeo;
function getBaseGeo() {
  if (_baseGeo) return _baseGeo;
  const g = new THREE.CylinderGeometry(R, 1.0, 3.4, 56, 10, false);
  const p = g.attributes.position;
  const cols = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const top = new THREE.Color("#5b4636");
  const mid = new THREE.Color("#3f3230");
  const bot = new THREE.Color("#241c2e");
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const t = (1.7 - v.y) / 3.4;
    const n = vnoise(v.x * 1.1 + v.y * 0.9, v.z * 1.1 - v.y * 0.9) - 0.5;
    if (t > 0.02) {
      v.x *= 1 + n * 0.3 * t;
      v.z *= 1 + n * 0.3 * t;
      v.y += n * 0.4 * t * (1 - t * 0.2);
    }
    p.setXYZ(i, v.x, v.y, v.z);
    c.copy(top).lerp(mid, sstep(0, 0.5, t)).lerp(bot, sstep(0.4, 1, t));
    c.multiplyScalar(0.8 + 0.4 * vnoise(v.x * 3, v.z * 3 + v.y * 3));
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  _baseGeo = g;
  return g;
}

/* ─────────────────────── routes, camps, bridges ───────────────────── */
function buildRoute(region) {
  const [dx, dz] = region.dir;
  const px = -dz;
  const pz = dx;
  const N = 90;
  const raw = [];
  const wet = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const rr = 0.64 + (region.reach - 0.64) * u;
    const off =
      Math.sin(u * Math.PI * 1.3) * region.bend * Math.min(1, u * 2.2);
    const x = dx * rr + px * off;
    const z = dz * rr + pz * off;
    const h = heightAt(x, z);
    wet.push(h < WL + 0.01);
    raw.push({ x, z, y: Math.max(h, WL + 0.02) + BASE + 0.06 });
  }
  // light smoothing of the climb so the path never jitters
  const pts = raw.map((p, i) => {
    let s = 0;
    let n = 0;
    for (let k = -3; k <= 3; k++) {
      const q = raw[clamp(i + k, 0, N)];
      s += q.y;
      n++;
    }
    const floor = Math.max(heightAt(p.x, p.z), WL + 0.02) + BASE + 0.05;
    return new THREE.Vector3(p.x, Math.max(s / n, floor), p.z);
  });
  const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
  const points = curve.getPoints(110);

  const bridges = [];
  let s = -1;
  for (let i = 0; i <= N; i++) {
    const isWet = wet[i] && i < N * 0.93;
    if (isWet) {
      if (s < 0) s = i;
    } else if (s >= 0) {
      const a = pts[s];
      const b = pts[i - 1];
      const len = a.distanceTo(b);
      if (len > 0.08 && len < 0.9) {
        bridges.push({
          pos: a.clone().add(b).multiplyScalar(0.5),
          len: len + 0.24,
          ang: Math.atan2(-(b.z - a.z), b.x - a.x),
        });
      }
      s = -1;
    }
  }

  const p = curve.getPointAt(CAMP_U);
  const tangent = curve.getTangentAt(CAMP_U);
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  const camp = p.clone().add(side.multiplyScalar(0.36));
  camp.y = Math.max(heightAt(camp.x, camp.z), WL + 0.03) + BASE;
  return { curve, points, samples: pts, bridges, camp, tangent };
}
const ROUTES = Object.fromEntries(REGIONS.map((r) => [r.id, buildRoute(r)]));

/* ───────────────────── scattered props (trees, rocks) ─────────────── */
let _scatter;
function getScatter() {
  if (_scatter) return _scatter;
  const rng = mulberry32(7);
  const routeList = Object.values(ROUTES);
  const blocked = (x, z) => {
    for (const rt of routeList) {
      for (let i = 0; i < rt.samples.length; i += 2) {
        const q = rt.samples[i];
        const dx = q.x - x;
        const dz = q.z - z;
        if (dx * dx + dz * dz < 0.07) return true;
      }
      const dx = rt.camp.x - x;
      const dz = rt.camp.z - z;
      if (dx * dx + dz * dz < 0.3) return true;
    }
    return false;
  };
  const gen = (count, accept) => {
    const out = [];
    let tries = 0;
    while (out.length < count && tries < count * 50) {
      tries++;
      const a = rng() * Math.PI * 2;
      const rr = Math.sqrt(rng()) * 4.3;
      if (rr < 1.25) continue;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      const h = heightAt(x, z);
      if (h < WL + 0.1) continue;
      if (blocked(x, z)) continue;
      const e = 0.06;
      const sl = Math.hypot(heightAt(x + e, z) - h, heightAt(x, z + e) - h) / e;
      const w = regionW(x, z);
      const s = accept({ x, z, h, w, sl }, rng);
      if (!s) continue;
      out.push({ x, z, h, s, rot: rng() * Math.PI * 2, j: rng() });
    }
    return out;
  };
  _scatter = {
    pines: gen(190, ({ w, h, sl }, r) =>
      w.n > 0.4 && h < 1.25 && sl < 1.4 ? 0.75 + r() * 0.8 : 0
    ),
    broad: gen(300, ({ w, sl }, r) =>
      (w.e > 0.5 || w.s > 0.6) && sl < 1.0 ? 0.8 + r() * 0.6 : 0
    ),
    plains: gen(46, ({ w, sl }, r) =>
      w.w > 0.55 && r() < 0.22 && sl < 0.6 ? 0.8 + r() * 0.5 : 0
    ),
    rocks: gen(80, ({ w }, r) =>
      (w.n > 0.3 && r() < 0.35) || r() < 0.05 ? 0.6 + r() * 1.0 : 0
    ),
  };
  return _scatter;
}

let _houses;
const ROOFS = ["#b4472b", "#c2603a", "#9c3f2a", "#d08a3c"];
function getHouses() {
  if (_houses) return _houses;
  const rng = mulberry32(21);
  const out = [];
  let tries = 0;
  while (out.length < 14 && tries < 500) {
    tries++;
    const a = rng() * Math.PI * 2;
    const rr = 1.0 + rng() * 0.55;
    const q = ((a % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
    if (Math.min(q, Math.PI / 2 - q) < 0.3) continue;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const h = heightAt(x, z);
    if (h < WL + 0.1) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 0.24)) continue;
    out.push({
      x,
      z,
      h,
      rot: -a + Math.PI / 2 + (rng() - 0.5) * 0.6,
      s: 0.8 + rng() * 0.5,
      roof: ROOFS[Math.floor(rng() * ROOFS.length)],
    });
  }
  _houses = out;
  return out;
}

/* ───────────────────────── shaders ───────────────────────────────── */
const SKY_V = `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SKY_F = `
varying vec3 vDir;
uniform float uAwake;
uniform float uTime;
float hash(vec3 p){
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
void main(){
  vec3 d = normalize(vDir);
  float h = d.y * 2.4;

  vec3 nTop = vec3(0.025, 0.03, 0.11);
  vec3 nHor = vec3(0.20, 0.15, 0.36);
  vec3 night = mix(nHor, nTop, smoothstep(-0.05, 0.8, h));

  vec3 dTop = vec3(0.24, 0.27, 0.56);
  vec3 dMid = vec3(0.90, 0.48, 0.44);
  vec3 dHor = vec3(1.00, 0.80, 0.50);
  vec3 dawn = mix(dHor, dMid, smoothstep(0.0, 0.25, h));
  dawn = mix(dawn, dTop, smoothstep(0.2, 0.9, h));

  vec3 col = mix(night, dawn, uAwake);

  // below the horizon: a soft sea of haze
  vec3 belowN = vec3(0.05, 0.05, 0.16);
  vec3 belowD = vec3(0.62, 0.40, 0.52);
  col = mix(col, mix(belowN, belowD, uAwake), smoothstep(0.0, -0.45, h));

  // stars
  vec3 g = d * 380.0;
  vec3 id = floor(g);
  vec3 f = fract(g) - 0.5;
  float st = step(0.9965, hash(id)) * smoothstep(0.24, 0.0, length(f));
  float tw = 0.6 + 0.4 * sin(uTime * 2.0 + hash(id + 3.0) * 30.0);
  col += vec3(st * tw) * (1.0 - uAwake) * smoothstep(-0.02, 0.2, h);

  // moon
  vec3 md = normalize(vec3(-0.55, 0.11, -0.83));
  float mdot = dot(d, md);
  col += vec3(0.92, 0.94, 1.0) * smoothstep(0.9984, 0.9991, mdot) * (1.0 - uAwake);
  col += vec3(0.45, 0.5, 0.9) * pow(max(mdot, 0.0), 60.0) * 0.35 * (1.0 - uAwake);

  // sun
  vec3 sd = normalize(vec3(0.55, 0.12, -0.82));
  float sdot = max(dot(d, sd), 0.0);
  col += vec3(1.0, 0.72, 0.38) * pow(sdot, 22.0) * 0.8 * uAwake;
  col += vec3(1.0, 0.92, 0.65) * smoothstep(0.9982, 0.9992, sdot) * uAwake;

  gl_FragColor = vec4(col, 1.0);
}`;

const WATER_V = `
attribute float aDepth;
varying float vDepth;
varying vec3 vPos;
uniform float uTime;
void main(){
  vDepth = aDepth;
  vec3 p = position;
  p.y += sin(p.x * 3.0 + uTime * 1.3) * 0.012 + cos(p.z * 2.6 + uTime * 1.1) * 0.012;
  vPos = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const WATER_F = `
varying float vDepth;
varying vec3 vPos;
uniform float uTime;
uniform float uAwake;
void main(){
  float d = clamp(vDepth / 0.9, 0.0, 1.0);
  vec3 shallow = vec3(0.36, 0.80, 0.76);
  vec3 deep = vec3(0.05, 0.21, 0.38);
  vec3 col = mix(shallow, deep, smoothstep(0.0, 1.0, d));
  float w = sin(vPos.x * 9.0 + uTime * 1.4) * sin(vPos.z * 9.0 - uTime * 1.1);
  float w2 = sin((vPos.x + vPos.z) * 14.0 + uTime * 2.0);
  col += 0.07 * smoothstep(0.6, 1.0, w) + 0.05 * smoothstep(0.7, 1.0, w2);
  float foam = smoothstep(0.07, 0.0, vDepth) * (0.6 + 0.4 * sin(vPos.x * 20.0 + vPos.z * 18.0 + uTime * 2.5));
  col = mix(col, vec3(0.96, 0.97, 0.92), foam * 0.85);
  col *= mix(0.42, 1.0, uAwake);
  col += vec3(1.0, 0.74, 0.44) * smoothstep(0.78, 1.0, w) * 0.14 * uAwake;
  float alpha = max(mix(0.74, 0.97, d), foam);
  gl_FragColor = vec4(col, alpha);
}`;
const WSKIRT_V = `
varying float vY;
void main(){
  vY = uv.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const WSKIRT_F = `
varying float vY;
uniform float uAwake;
void main(){
  vec3 top = vec3(0.30, 0.72, 0.72);
  vec3 bottom = vec3(0.03, 0.12, 0.26);
  vec3 col = mix(bottom, top, smoothstep(0.0, 1.0, vY));
  col *= mix(0.45, 1.0, uAwake);
  gl_FragColor = vec4(col, mix(0.96, 0.62, vY));
}`;
const BEAM_V = `
varying float vY;
void main(){
  vY = uv.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const BEAM_F = `
varying float vY;
uniform float uTime;
uniform vec3 uColor;
void main(){
  float a = pow(1.0 - vY, 1.5) * 0.7 * (0.82 + 0.18 * sin(uTime * 3.0 + vY * 9.0));
  gl_FragColor = vec4(uColor, a);
}`;

/* ───────────────────────── audio (no assets) ──────────────────────── */
function useAudio(muted) {
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(
    () => () => {
      try {
        ctxRef.current && ctxRef.current.close();
      } catch (e) {
        /* ignore */
      }
    },
    []
  );

  return useMemo(() => {
    const ensure = () => {
      if (mutedRef.current) return null;
      try {
        if (!ctxRef.current) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          ctxRef.current = new AC();
          masterRef.current = ctxRef.current.createGain();
          masterRef.current.gain.value = 0.55;
          masterRef.current.connect(ctxRef.current.destination);
        }
        if (ctxRef.current.state === "suspended") ctxRef.current.resume();
        return ctxRef.current;
      } catch (e) {
        return null;
      }
    };
    const tone = (c, freq, start, dur, o = {}) => {
      const { type = "sine", vol = 0.1, to = null, attack = 0.012, dest } = o;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (to) osc.frequency.exponentialRampToValueAtTime(to, start + dur);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(vol, start + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(g);
      g.connect(dest || masterRef.current);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    };
    return {
      tick() {
        const c = ensure();
        if (!c) return;
        tone(c, 740, c.currentTime, 0.18, { vol: 0.05 });
      },
      awaken() {
        const c = ensure();
        if (!c) return;
        const t = c.currentTime;
        tone(c, 98, t, 5, { type: "triangle", vol: 0.1, attack: 1.6 });
        tone(c, 147, t, 5, { type: "triangle", vol: 0.06, attack: 2 });
        [392, 494, 587, 784].forEach((f, i) =>
          tone(c, f, t + 0.9 + i * 0.28, 2.2, { vol: 0.045 })
        );
      },
      organise(n) {
        const c = ensure();
        if (!c) return;
        const t = c.currentTime;
        const base = [392, 440, 494, 587][clamp(n - 1, 0, 3)];
        [1, 1.25, 1.5, 2].forEach((m, i) =>
          tone(c, base * m, t + i * 0.09, 1.6, { vol: 0.07 })
        );
        tone(c, base / 2, t, 1.2, { type: "triangle", vol: 0.08 });
      },
      horn() {
        const c = ensure();
        if (!c) return;
        const t = c.currentTime;
        const lp = c.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 900;
        lp.connect(masterRef.current);
        tone(c, 110, t, 2.6, { type: "sawtooth", vol: 0.08, to: 165, attack: 0.5, dest: lp });
        tone(c, 165, t + 0.1, 2.5, { type: "sawtooth", vol: 0.05, to: 220, attack: 0.6, dest: lp });
      },
    };
  }, []);
}

/* ───────────────────── instanced scenery helper ───────────────────── */
function Instances({
  items,
  offY = 0,
  sx = 1,
  sy = 1,
  base = "#ffffff",
  jitter = 0.18,
  castShadow = true,
  children,
}) {
  const ref = useRef();
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(it.x, it.h + BASE + offY * it.s, it.z);
      o.rotation.set(0, it.rot, 0);
      o.scale.set(it.s * sx, it.s * sy, it.s * sx);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      c.set(base).multiplyScalar(1 - jitter + it.j * jitter * 2);
      m.setColorAt(i, c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items, offY, sx, sy, base, jitter]);
  return (
    <instancedMesh
      ref={ref}
      args={[null, null, items.length]}
      castShadow={castShadow}
      receiveShadow
      frustumCulled={false}
    >
      {children}
    </instancedMesh>
  );
}

function Pines({ items }) {
  return (
    <>
      <Instances items={items} offY={0.12} base="#6a4a2c">
        <cylinderGeometry args={[0.025, 0.036, 0.24, 6]} />
        <meshStandardMaterial roughness={1} />
      </Instances>
      <Instances items={items} offY={0.38} base="#3f6e47">
        <coneGeometry args={[0.2, 0.46, 7]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </Instances>
      <Instances items={items} offY={0.62} base="#4a7d4f">
        <coneGeometry args={[0.15, 0.38, 7]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </Instances>
    </>
  );
}
function Broadleaf({ items, crown = "#5b9140", crown2 = "#6aa84a" }) {
  return (
    <>
      <Instances items={items} offY={0.11} base="#6b4a2d">
        <cylinderGeometry args={[0.03, 0.042, 0.22, 6]} />
        <meshStandardMaterial roughness={1} />
      </Instances>
      <Instances items={items} offY={0.34} sy={0.85} base={crown}>
        <icosahedronGeometry args={[0.17, 1]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </Instances>
      <Instances items={items} offY={0.5} base={crown2}>
        <icosahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </Instances>
    </>
  );
}
function Forests() {
  const data = useMemo(getScatter, []);
  return (
    <group>
      <Pines items={data.pines} />
      <Broadleaf items={data.broad} />
      <Broadleaf items={data.plains} crown="#a3a652" crown2="#b8b45c" />
      <Instances items={data.rocks} offY={0.03} sy={0.7} base="#8b7d6c" jitter={0.25}>
        <dodecahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial roughness={1} flatShading />
      </Instances>
    </group>
  );
}

/* ───────────────────────── scene controllers ──────────────────────── */
const FOG_NIGHT = new THREE.Color("#171238");
const FOG_DAWN = new THREE.Color("#d9a07f");
function Awakener({ target, awake }) {
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    awake.current += (target - awake.current) * (1 - Math.exp(-d * 1.1));
    if (Math.abs(target - awake.current) < 0.0006) awake.current = target;
    const f = state.scene.fog;
    if (f) f.color.lerpColors(FOG_NIGHT, FOG_DAWN, awake.current);
  });
  return null;
}

function SkyDome({ awake }) {
  const uniforms = useMemo(
    () => ({ uAwake: { value: 0 }, uTime: { value: 0 } }),
    []
  );
  useFrame((s) => {
    uniforms.uAwake.value = awake.current;
    uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh renderOrder={-10}>
      <sphereGeometry args={[80, 48, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={SKY_V}
        fragmentShader={SKY_F}
      />
    </mesh>
  );
}

const C_SKY_N = new THREE.Color("#6c7bd8");
const C_SKY_D = new THREE.Color("#ffe0b0");
const C_GRD_N = new THREE.Color("#1a1530");
const C_GRD_D = new THREE.Color("#7a5238");
const C_MOON = new THREE.Color("#a9bdff");
const C_SUN = new THREE.Color("#ffd29a");
function Lights({ awake }) {
  const hemi = useRef();
  const key = useRef();
  const rim = useRef();
  const under = useRef();
  useFrame((s) => {
    const a = awake.current;
    const t = s.clock.elapsedTime;
    if (hemi.current) {
      hemi.current.intensity = 0.55 + 0.6 * a;
      hemi.current.color.lerpColors(C_SKY_N, C_SKY_D, a);
      hemi.current.groundColor.lerpColors(C_GRD_N, C_GRD_D, a);
    }
    if (key.current) {
      key.current.intensity = 0.9 + 2.5 * a;
      key.current.color.lerpColors(C_MOON, C_SUN, a);
    }
    if (rim.current) rim.current.intensity = 0.5 + 0.9 * a;
    if (under.current)
      under.current.intensity = (0.8 + 1.8 * a) * (0.9 + 0.1 * Math.sin(t * 1.7));
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#6c7bd8", "#1a1530", 0.6]} />
      <directionalLight
        ref={key}
        position={[-5.5, 7.5, 4.5]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      />
      <directionalLight ref={rim} position={[5, 4, -7]} color="#ffb98a" />
      <pointLight
        ref={under}
        position={[0, -3.4, 0]}
        color="#ffae4a"
        distance={7}
        decay={1.6}
      />
    </>
  );
}

/* Cinematic camera: orbit the dormant map → swoop to the planning view →
   pull back for the departure. Hands over to OrbitControls once arrived. */
function CameraRig({ mode, wide, planPos, planLook, depPos, depLook, onArrive }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls);
  const look = useRef(new THREE.Vector3(0, 0.4, 0));
  const tw = useRef(null);
  const drift = useRef(0);
  const clock = useRef(0);

  useEffect(() => {
    if (mode === "intro") {
      tw.current = null;
      return;
    }
    const pos = mode === "planning" ? planPos : depPos;
    const lk = mode === "planning" ? planLook : depLook;
    tw.current = {
      t: 0,
      dur: mode === "planning" ? 3.4 : 4.8,
      from: camera.position.clone(),
      fromLook: look.current.clone(),
      to: new THREE.Vector3(...pos),
      toLook: new THREE.Vector3(...lk),
      arrived: false,
    };
    drift.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    clock.current += dt;
    const T = tw.current;

    if (mode === "intro") {
      const a = 0.6 + clock.current * 0.075;
      const rad = wide ? 17.5 : 22;
      camera.position.set(
        Math.sin(a) * rad,
        (wide ? 3.8 : 5) + Math.sin(clock.current * 0.25) * 0.35,
        Math.cos(a) * rad
      );
      look.current.set(0, 0.5, 0);
      camera.lookAt(look.current);
      return;
    }
    if (!T) return;
    if (!T.arrived) {
      T.t = Math.min(1, T.t + dt / T.dur);
      const e = easeInOutCubic(T.t);
      camera.position.lerpVectors(T.from, T.to, e);
      // a small swing above the straight line makes the swoop feel airborne
      camera.position.y += Math.sin(e * Math.PI) * 1.6;
      look.current.lerpVectors(T.fromLook, T.toLook, e);
      camera.lookAt(look.current);
      if (T.t >= 1) {
        T.arrived = true;
        onArrive && onArrive(mode);
      }
      return;
    }
    if (mode === "planning") {
      if (controls && controls.target) look.current.copy(controls.target);
      return;
    }
    drift.current += dt;
    const a = Math.sin(drift.current * 0.16) * 0.5;
    const c = Math.cos(a);
    const s = Math.sin(a);
    camera.position.set(
      T.to.x * c + T.to.z * s,
      T.to.y + Math.sin(drift.current * 0.3) * 0.3,
      -T.to.x * s + T.to.z * c
    );
    camera.lookAt(look.current);
  });
  return null;
}

function FocusRig({ selected, planLook }) {
  const controls = useThree((s) => s.controls);
  const goal = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    if (!controls) return;
    const r = REGION_BY_ID[selected];
    goal.set(
      planLook[0] + r.dir[0] * 0.55,
      planLook[1],
      planLook[2] + r.dir[1] * 0.55
    );
    controls.target.lerp(goal, 1 - Math.exp(-Math.min(dt, 0.05) * 3));
  });
  return null;
}

/* ───────────────────────── atmosphere ─────────────────────────────── */
function Cloud({ position, scale = 1, speed = 0.15, seed = 1 }) {
  const g = useRef();
  const puffs = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({ length: 6 }, (_, i) => ({
      x: (i - 2.5) * 0.5 * (0.8 + r() * 0.4),
      y: (r() - 0.5) * 0.25,
      z: (r() - 0.5) * 0.6,
      s: 0.45 + r() * 0.45,
    }));
  }, [seed]);
  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.position.x += Math.min(dt, 0.05) * speed;
    if (g.current.position.x > 16) g.current.position.x = -16;
  });
  return (
    <group ref={g} position={position} scale={scale}>
      {puffs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} scale={[p.s * 1.4, p.s * 0.7, p.s]}>
          <icosahedronGeometry args={[0.6, 1]} />
          <meshStandardMaterial
            color="#fff1e0"
            emissive="#ffb48a"
            emissiveIntensity={0.2}
            roughness={1}
            flatShading
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
function Clouds() {
  return (
    <group>
      <Cloud position={[-10, 4.2, -8]} scale={1.6} speed={0.12} seed={2} />
      <Cloud position={[4, 5.4, -10]} scale={2.1} speed={0.09} seed={5} />
      <Cloud position={[11, 3.2, -6]} scale={1.3} speed={0.14} seed={9} />
      <Cloud position={[-4, -2.4, -9]} scale={2.4} speed={0.1} seed={12} />
      <Cloud position={[8, -3.2, -6]} scale={2.0} speed={0.13} seed={17} />
      <Cloud position={[-12, -2.8, 2]} scale={2.2} speed={0.08} seed={23} />
      <Cloud position={[2, -4.0, 8]} scale={2.6} speed={0.11} seed={31} />
    </group>
  );
}

/* drifting festival lanterns that rise around the diorama */
function Lanterns({ awake }) {
  const ref = useRef();
  const o = useMemo(() => new THREE.Object3D(), []);
  const items = useMemo(() => {
    const r = mulberry32(77);
    return Array.from({ length: 26 }, () => ({
      a: r() * Math.PI * 2,
      rad: 5.2 + r() * 2.2,
      y0: r() * 6,
      sp: 0.18 + r() * 0.22,
      ph: r() * 6.28,
      s: 0.05 + r() * 0.05,
    }));
  }, []);
  useFrame((st) => {
    const m = ref.current;
    if (!m) return;
    const t = st.clock.elapsedTime;
    items.forEach((it, i) => {
      const ang = it.a + t * 0.04;
      o.position.set(
        Math.cos(ang) * it.rad + Math.sin(t * 0.5 + it.ph) * 0.15,
        ((it.y0 + t * it.sp) % 7) - 1.5,
        Math.sin(ang) * it.rad
      );
      o.scale.setScalar(it.s * (0.4 + 0.6 * awake.current));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, items.length]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#ffc46b" toneMapped={false} />
    </instancedMesh>
  );
}

function Bird({ radius, speed, height, phase, awake }) {
  const g = useRef();
  const l = useRef();
  const r = useRef();
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime * speed + phase;
    g.current.visible = awake.current > 0.6;
    g.current.position.set(
      Math.cos(t) * radius,
      height + Math.sin(t * 2) * 0.15,
      Math.sin(t) * radius
    );
    g.current.rotation.y = -t;
    const f = Math.sin(s.clock.elapsedTime * 11 + phase * 3) * 0.6;
    if (l.current) l.current.rotation.z = f;
    if (r.current) r.current.rotation.z = -f;
  });
  return (
    <group ref={g} scale={1.3}>
      <group ref={l}>
        <mesh position={[-0.1, 0, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.2, 0.07]} />
          <meshBasicMaterial color="#2a2230" side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group ref={r}>
        <mesh position={[0.1, 0, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.2, 0.07]} />
          <meshBasicMaterial color="#2a2230" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────────────────── diorama pieces ─────────────────────────── */
function Base({ awake }) {
  const geo = useMemo(getBaseGeo, []);
  const trim = useRef();
  const runes = useRef();
  const runeMat = useRef();
  const shards = useRef();
  const runeItems = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2;
        return { x: Math.cos(a) * (R + 0.4), z: Math.sin(a) * (R + 0.4), a };
      }),
    []
  );
  const shardItems = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        return {
          x: Math.cos(a) * (2.4 + (i % 3) * 0.5),
          z: Math.sin(a) * (2.4 + (i % 3) * 0.5),
          y: -3.2 - (i % 4) * 0.45,
          s: 0.08 + (i % 3) * 0.04,
        };
      }),
    []
  );
  useFrame((s) => {
    const a = awake.current;
    const t = s.clock.elapsedTime;
    if (trim.current) trim.current.emissiveIntensity = 0.2 + 0.7 * a;
    if (runes.current) runes.current.rotation.y = t * 0.12;
    if (runeMat.current) runeMat.current.opacity = 0.35 + 0.6 * a;
    if (shards.current) {
      shards.current.rotation.y = -t * 0.18;
      shards.current.position.y = Math.sin(t * 0.8) * 0.08;
    }
  });
  return (
    <group>
      <mesh geometry={geo} position={[0, -BASE - 1.7, 0]} castShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} />
      </mesh>
      <mesh position={[0, -BASE + 0.02, 0]}>
        <cylinderGeometry args={[R + 0.07, R + 0.07, 0.16, 96]} />
        <meshStandardMaterial
          ref={trim}
          color="#e0ab4f"
          metalness={0.85}
          roughness={0.28}
          emissive="#a86a1a"
          emissiveIntensity={0.3}
        />
      </mesh>
      <group ref={runes} position={[0, -BASE - 0.75, 0]}>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[R + 0.4, 0.014, 8, 160]} />
          <meshBasicMaterial color="#ffcf7a" transparent opacity={0.8} />
        </mesh>
        {runeItems.map((r, i) => (
          <mesh key={i} position={[r.x, 0, r.z]} rotation-y={-r.a} scale={[1, 1, 1]}>
            <boxGeometry args={[0.04, i % 2 ? 0.26 : 0.16, 0.03]} />
            <meshBasicMaterial
              ref={i === 0 ? runeMat : undefined}
              color="#ffcf7a"
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>
      <group ref={shards}>
        {shardItems.map((r, i) => (
          <mesh key={i} position={[r.x, r.y, r.z]} rotation={[i, i * 1.7, 0]} scale={r.s * 3}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#ffd48a"
              emissive="#ff9d3a"
              emissiveIntensity={0.9}
              flatShading
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function TerrainMesh() {
  const geo = useMemo(getTerrainGeo, []);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0.02} />
    </mesh>
  );
}
function Skirt() {
  const geo = useMemo(getSkirtGeo, []);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  );
}
function Water({ awake }) {
  const geo = useMemo(getWaterGeo, []);
  const uTop = useMemo(() => ({ uTime: { value: 0 }, uAwake: { value: 0 } }), []);
  const uSkirt = useMemo(() => ({ uAwake: { value: 0 } }), []);
  useFrame((s) => {
    uTop.uTime.value = s.clock.elapsedTime;
    uTop.uAwake.value = awake.current;
    uSkirt.uAwake.value = awake.current;
  });
  return (
    <group>
      <mesh geometry={geo} position={[0, WL + BASE, 0]}>
        <shaderMaterial
          transparent
          uniforms={uTop}
          vertexShader={WATER_V}
          fragmentShader={WATER_F}
        />
      </mesh>
      <mesh position={[0, (WL + BASE) / 2, 0]}>
        <cylinderGeometry args={[R - 0.012, R - 0.012, WL + BASE, 160, 1, true]} />
        <shaderMaterial
          transparent
          uniforms={uSkirt}
          vertexShader={WSKIRT_V}
          fragmentShader={WSKIRT_F}
        />
      </mesh>
    </group>
  );
}

/* Kishkindha — the vanara capital at the heart of the map */
function Kishkindha({ completed, awake, showLabel }) {
  const houses = useMemo(getHouses, []);
  const lamp = useRef();
  const domeMat = useRef();
  useFrame((s) => {
    const a = awake.current;
    const t = s.clock.elapsedTime;
    if (lamp.current)
      lamp.current.intensity = (0.4 + 2.2 * a) * (0.92 + 0.08 * Math.sin(t * 6));
    if (domeMat.current) domeMat.current.emissiveIntensity = 0.15 + 0.5 * a;
  });
  const y0 = 0.38 + BASE;
  return (
    <group position={[0, y0, 0]}>
      <pointLight ref={lamp} position={[0, 0.8, 0]} color="#ffb45c" distance={5} decay={1.6} />

      {/* plaza */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.86, 0.9, 0.08, 56]} />
        <meshStandardMaterial color="#dcc89f" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.075, 0]}>
        <ringGeometry args={[0.72, 0.78, 72]} />
        <meshStandardMaterial color="#c99a47" metalness={0.7} roughness={0.35} />
      </mesh>
      {REGIONS.map((r) => {
        const done = completed.includes(r.id);
        return (
          <mesh
            key={r.id}
            position={[r.dir[0] * 0.75, 0.09, r.dir[1] * 0.75]}
            rotation-y={Math.PI / 4}
          >
            <boxGeometry args={[0.12, 0.03, 0.12]} />
            <meshStandardMaterial
              color={done ? "#ffd37a" : "#5d4a30"}
              emissive={done ? "#ffb347" : "#000000"}
              emissiveIntensity={done ? 1.4 : 0}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        );
      })}

      {/* low wall */}
      <mesh position={[0, 0.11, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.07, 64, 1, true]} />
        <meshStandardMaterial color="#cdb68b" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* palace */}
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.34, 0.2, 24]} />
        <meshStandardMaterial color="#eadbb8" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.265, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.31, 0.012, 6, 40]} />
        <meshStandardMaterial color="#d6a64f" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.37, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.25, 0.18, 24]} />
        <meshStandardMaterial color="#e3d0a6" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.53, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.15, 20]} />
        <meshStandardMaterial color="#eadbb8" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.605, 0]} scale={[1, 1.15, 1]} castShadow>
        <sphereGeometry args={[0.12, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          ref={domeMat}
          color="#e0ab4f"
          metalness={0.9}
          roughness={0.25}
          emissive="#b8731d"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[0.016, 0.16, 8]} />
        <meshStandardMaterial color="#e0ab4f" metalness={0.9} roughness={0.25} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42]}>
            <mesh position={[0, 0.22, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.055, 0.3, 12]} />
              <meshStandardMaterial color="#eadbb8" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.43, 0]} castShadow>
              <coneGeometry args={[0.07, 0.13, 12]} />
              <meshStandardMaterial color="#b4472b" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.51, 0]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshBasicMaterial color="#ffd27a" />
            </mesh>
          </group>
        );
      })}

      {/* the city around the plaza */}
      {houses.map((h, i) => (
        <group
          key={i}
          position={[h.x, h.h - 0.38, h.z]}
          rotation-y={h.rot}
          scale={h.s}
        >
          <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.11, 0.08, 0.09]} />
            <meshStandardMaterial color="#e6d3ab" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.105, 0]} rotation-y={Math.PI / 4} castShadow>
            <coneGeometry args={[0.095, 0.075, 4]} />
            <meshStandardMaterial color={h.roof} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.04, 0.0455]}>
            <planeGeometry args={[0.028, 0.03]} />
            <meshBasicMaterial color="#ffd48a" />
          </mesh>
        </group>
      ))}

      {showLabel && (
        <Html position={[0, 1.05, 0]} center distanceFactor={12} zIndexRange={[20, 0]}>
          <div className="klm-city">
            <Crown size={11} />
            <span>Kishkindha</span>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ─────────────── routes, bridges, camps, beacons, parties ─────────── */
function RouteLine({ route, completed }) {
  const ref = useRef();
  useFrame((_, dt) => {
    const m = ref.current && ref.current.material;
    if (m && completed) m.dashOffset -= Math.min(dt, 0.05) * 0.9;
  });
  return (
    <Line
      ref={ref}
      points={route.points}
      color={completed ? "#ffcc66" : "#fff0c8"}
      lineWidth={completed ? 2.6 : 1.1}
      dashed
      dashSize={completed ? 0.12 : 0.06}
      gapSize={completed ? 0.07 : 0.1}
      transparent
      opacity={completed ? 0.95 : 0.32}
    />
  );
}

function Bridges({ route }) {
  return (
    <>
      {route.bridges.map((b, i) => (
        <group key={i} position={b.pos} rotation-y={b.ang}>
          <mesh position={[0, -0.03, 0]} castShadow>
            <boxGeometry args={[b.len, 0.035, 0.14]} />
            <meshStandardMaterial color="#8a6238" roughness={0.9} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, 0.03, s * 0.07]}>
              <boxGeometry args={[b.len, 0.016, 0.014]} />
              <meshStandardMaterial color="#5e4226" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function Beacon({ region, route, selected, completed, awake, onSelect, showPins }) {
  const Icon = region.icon;
  const raise = useRef(0);
  const flagGroup = useRef();
  const flagMat = useRef();
  const lightRef = useRef();
  const ring = useRef();
  const doneRing = useRef();
  const beamRef = useRef();
  const fire = useRef();
  const shock = useRef();
  const shockMat = useRef();
  const pulse = useRef(-1);
  const prevDone = useRef(false);

  const colorOn = useMemo(() => new THREE.Color(region.color), [region.color]);
  const colorOff = useMemo(() => new THREE.Color("#6d6659"), []);
  const beamU = useMemo(
    () => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color(region.color) } }),
    [region.color]
  );
  const flagGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.36, 0.22, 10, 4);
    g.translate(0.18, 0, 0);
    return g;
  }, []);
  const flagBase = useMemo(() => flagGeo.attributes.position.array.slice(), [flagGeo]);

  useFrame((s, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = s.clock.elapsedTime;
    if (completed && !prevDone.current) {
      prevDone.current = true;
      pulse.current = 0;
    }
    raise.current += ((completed ? 1 : 0) - raise.current) * (1 - Math.exp(-dt * 2.2));
    const e = raise.current;

    if (flagGroup.current) flagGroup.current.position.y = 0.22 + 0.62 * e;
    if (flagMat.current) {
      flagMat.current.color.copy(colorOff).lerp(colorOn, e);
      flagMat.current.emissive.copy(colorOn);
      flagMat.current.emissiveIntensity = 0.55 * e;
    }
    const pos = flagGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = flagBase[i * 3];
      const k = x / 0.36;
      pos.setZ(i, Math.sin(x * 16 - t * 5.5) * 0.03 * k + Math.sin(x * 7 - t * 3) * 0.012 * k);
    }
    pos.needsUpdate = true;

    beamU.uTime.value = t;
    if (beamRef.current) {
      beamRef.current.visible = e > 0.04;
      beamRef.current.scale.y = Math.max(0.001, e);
      beamRef.current.position.y = 1.3 * e;
    }
    if (lightRef.current)
      lightRef.current.intensity =
        (0.1 + 1.7 * e * (0.4 + 0.6 * awake.current)) * (0.92 + 0.08 * Math.sin(t * 5 + region.dir[0]));
    if (ring.current) {
      ring.current.visible = selected && !completed;
      const k = 1 + 0.07 * Math.sin(t * 3);
      ring.current.scale.set(k, k, k);
    }
    if (doneRing.current) doneRing.current.visible = completed;
    if (fire.current) {
      fire.current.scale.y = 0.8 + 0.35 * Math.sin(t * 13 + region.dir[1]) + 0.2 * Math.sin(t * 7);
      fire.current.visible = awake.current > 0.3;
    }
    if (shock.current) {
      if (pulse.current >= 0) {
        pulse.current += dt / 1.7;
        const k = pulse.current;
        if (k >= 1) {
          pulse.current = -1;
          shock.current.visible = false;
        } else {
          shock.current.visible = true;
          const sc = 0.3 + 3.4 * easeOutCubic(k);
          shock.current.scale.set(sc, sc, sc);
          if (shockMat.current) shockMat.current.opacity = 0.85 * (1 - k);
        }
      } else shock.current.visible = false;
    }
  });

  const rotY = Math.atan2(route.tangent.x, route.tangent.z);
  const choose = (e) => {
    e.stopPropagation();
    onSelect(region.id);
  };

  return (
    <group position={route.camp} rotation-y={rotY}>
      <pointLight ref={lightRef} position={[0, 0.7, 0]} color={region.color} distance={3.2} decay={1.6} />

      {/* camp */}
      <mesh position={[0.18, 0.1, -0.08]} rotation-y={0.5} castShadow>
        <coneGeometry args={[0.15, 0.2, 4]} />
        <meshStandardMaterial color="#efe0bd" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.2, 0.085, 0.14]} rotation-y={-0.3} castShadow>
        <coneGeometry args={[0.12, 0.17, 4]} />
        <meshStandardMaterial color="#b6482f" roughness={0.9} flatShading />
      </mesh>
      <mesh ref={fire} position={[-0.17, 0.05, 0.04]}>
        <coneGeometry args={[0.035, 0.1, 6]} />
        <meshBasicMaterial color="#ffb347" />
      </mesh>
      <mesh position={[-0.17, 0.012, 0.04]}>
        <cylinderGeometry args={[0.06, 0.07, 0.025, 8]} />
        <meshStandardMaterial color="#4a3a30" roughness={1} />
      </mesh>

      {/* banner pole + waving flag */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.016, 1.04, 8]} />
        <meshStandardMaterial color="#3b2a1c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.07, 0]}>
        <sphereGeometry args={[0.032, 12, 12]} />
        <meshStandardMaterial color="#e0ab4f" metalness={0.9} roughness={0.25} emissive="#b8731d" emissiveIntensity={0.4} />
      </mesh>
      <group ref={flagGroup} position={[0.012, 0.22, 0]} rotation-y={Math.PI / 2}>
        <mesh geometry={flagGeo} castShadow>
          <meshStandardMaterial ref={flagMat} side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
      </group>

      {/* rings & beam */}
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.035, 0]}>
        <ringGeometry args={[0.46, 0.51, 48]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh ref={doneRing} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} visible={false}>
        <ringGeometry args={[0.5, 0.535, 48]} />
        <meshBasicMaterial color={region.color} transparent opacity={0.7} depthWrite={false} />
      </mesh>
      <mesh ref={shock} rotation-x={-Math.PI / 2} position={[0, 0.05, 0]} visible={false}>
        <ringGeometry args={[0.9, 1, 64]} />
        <meshBasicMaterial
          ref={shockMat}
          color={region.color}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={beamRef} position={[0, 0, 0]} visible={false}>
        <cylinderGeometry args={[0.06, 0.17, 2.6, 24, 1, true]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          uniforms={beamU}
          vertexShader={BEAM_V}
          fragmentShader={BEAM_F}
        />
      </mesh>

      {/* generous invisible hit area */}
      <mesh
        position={[0, 0.55, 0]}
        onClick={choose}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <cylinderGeometry args={[0.6, 0.6, 1.3, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {showPins && (
        <Html position={[0, 1.36, 0]} center distanceFactor={12} zIndexRange={[20, 0]}>
          <button
            type="button"
            className={`klm-pin${selected ? " is-selected" : ""}${completed ? " is-done" : ""}`}
            style={{ "--pin": region.color }}
            onClick={() => onSelect(region.id)}
            aria-label={`${region.name}${completed ? " (organised)" : ""}`}
          >
            <span className="klm-pin__icon">
              {completed ? <Check size={13} /> : <Icon size={13} />}
            </span>
            <span className="klm-pin__text">
              <b>{region.short}</b>
              <i>{completed ? "Organised" : "Explore"}</i>
            </span>
          </button>
        </Html>
      )}
    </group>
  );
}

/* low-poly travellers */
function Traveler({ kind, color, scale = 1 }) {
  const head =
    kind === "hanuman"
      ? "#e8a24c"
      : kind === "jambavan"
        ? "#4b3b33"
        : kind === "angada"
          ? "#c98b4a"
          : "#b88555";
  const wide = kind === "jambavan" ? 1.25 : 1;
  return (
    <group scale={[scale * wide, scale, scale * wide]}>
      <mesh position={[0, 0.13, 0]} castShadow>
        <coneGeometry args={[0.075, 0.26, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.052, 12, 10]} />
        <meshStandardMaterial color={head} roughness={0.8} />
      </mesh>
      <mesh position={[0.1, 0.12, 0.02]}>
        <cylinderGeometry args={[0.007, 0.007, 0.26, 5]} />
        <meshStandardMaterial color="#4b3522" />
      </mesh>
      <mesh position={[0.1, 0.27, 0.02]}>
        <sphereGeometry args={[0.024, 8, 8]} />
        <meshBasicMaterial color="#ffd27a" />
      </mesh>
      {kind === "hanuman" && (
        <>
          <mesh position={[-0.09, 0.2, 0]} rotation-z={0.5}>
            <cylinderGeometry args={[0.012, 0.012, 0.28, 6]} />
            <meshStandardMaterial color="#c99a47" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[-0.145, 0.32, 0]}>
            <sphereGeometry args={[0.038, 10, 10]} />
            <meshStandardMaterial color="#e0ab4f" metalness={0.85} roughness={0.3} emissive="#b8731d" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0.16, -0.07]} rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.07, 0.011, 6, 14, Math.PI * 1.3]} />
            <meshStandardMaterial color="#e8a24c" />
          </mesh>
        </>
      )}
      {kind === "angada" && (
        <>
          <mesh position={[-0.1, 0.22, 0]}>
            <cylinderGeometry args={[0.007, 0.007, 0.4, 5]} />
            <meshStandardMaterial color="#3b2a1c" />
          </mesh>
          <mesh position={[-0.1, 0.36, 0.05]}>
            <planeGeometry args={[0.1, 0.07]} />
            <meshBasicMaterial color="#6fa3ff" side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
}

function Party({ region, route, marching }) {
  const refs = useRef([]);
  const p = useRef(0);
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      side: new THREE.Vector3(),
    }),
    []
  );
  useFrame((s, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const target = marching ? 1 : CAMP_U;
    const speed = marching ? 0.075 : 0.2;
    const moving = p.current < target - 0.0005;
    if (moving) p.current = Math.min(target, p.current + dt * speed);
    region.party.forEach((m, i) => {
      const g = refs.current[i];
      if (!g) return;
      const u = clamp(p.current - m.back, 0, 1);
      route.curve.getPointAt(u, tmp.pos);
      route.curve.getTangentAt(u, tmp.tan);
      tmp.side.set(-tmp.tan.z, 0, tmp.tan.x).normalize().multiplyScalar(m.lat);
      g.position.copy(tmp.pos).add(tmp.side);
      if (moving) g.position.y += Math.abs(Math.sin(s.clock.elapsedTime * 10 + i * 1.7)) * 0.018;
      g.rotation.y = Math.atan2(tmp.tan.x, tmp.tan.z);
    });
  });
  return (
    <group>
      {region.party.map((m, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <Traveler kind={m.kind} color={m.color} scale={m.scale} />
        </group>
      ))}
    </group>
  );
}

/* a ring of golden light that spreads from Kishkindha when the map wakes */
function AwakenPulse({ stage }) {
  const ringA = useRef();
  const ringB = useRef();
  const matA = useRef();
  const matB = useRef();
  const t0 = useRef(-1);
  const clock = useRef(0);
  useEffect(() => {
    if (stage === "planning") t0.current = clock.current;
  }, [stage]);
  useFrame((_, dt) => {
    clock.current += Math.min(dt, 0.05);
    const run = (ref, mat, delay) => {
      if (!ref.current) return;
      if (t0.current < 0) {
        ref.current.visible = false;
        return;
      }
      const k = (clock.current - t0.current - delay) / 2.6;
      if (k <= 0 || k >= 1) {
        ref.current.visible = false;
        return;
      }
      ref.current.visible = true;
      const sc = 0.2 + 5.6 * easeOutCubic(k);
      ref.current.scale.set(sc, sc, sc);
      mat.current.opacity = 0.75 * (1 - k);
    };
    run(ringA, matA, 0.25);
    run(ringB, matB, 0.7);
  });
  return (
    <group position={[0, 0.6, 0]}>
      {[
        [ringA, matA],
        [ringB, matB],
      ].map(([r, m], i) => (
        <mesh key={i} ref={r} rotation-x={-Math.PI / 2} visible={false}>
          <ringGeometry args={[0.92, 1, 96]} />
          <meshBasicMaterial
            ref={m}
            color="#ffd27a"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function Diorama({ awake, selected, completed, onSelect, marching, showPins }) {
  const rise = useRef();
  useFrame(() => {
    if (!rise.current) return;
    const e = sstep(0.04, 0.95, awake.current);
    rise.current.scale.y = 0.05 + 0.95 * (e + Math.sin(e * Math.PI) * 0.03);
  });
  return (
    <group>
      <Base awake={awake} />
      <group ref={rise} position={[0, -BASE, 0]}>
        <TerrainMesh />
        <Skirt />
        <Water awake={awake} />
        <Kishkindha completed={completed} awake={awake} showLabel={showPins} />
        <Forests />
        {REGIONS.map((r) => (
          <React.Fragment key={r.id}>
            <RouteLine route={ROUTES[r.id]} completed={completed.includes(r.id)} />
            <Bridges route={ROUTES[r.id]} />
            <Beacon
              region={r}
              route={ROUTES[r.id]}
              selected={selected === r.id}
              completed={completed.includes(r.id)}
              awake={awake}
              onSelect={onSelect}
              showPins={showPins}
            />
          </React.Fragment>
        ))}
        {REGIONS.filter((r) => completed.includes(r.id)).map((r) => (
          <Party key={r.id} region={r} route={ROUTES[r.id]} marching={marching} />
        ))}
      </group>
    </group>
  );
}

/* ───────────────────────── the 3D scene ───────────────────────────── */
function Scene({
  stage,
  selected,
  completed,
  onSelect,
  awake,
  wide,
  controlsReady,
  onArrive,
  showPins,
}) {
  const mode = stage === "intro" ? "intro" : stage === "planning" ? "planning" : "departure";
  const planPos = useMemo(() => (wide ? [2.4, 10.4, 13.8] : [0, 11, 14.4]), [wide]);
  const planLook = useMemo(() => (wide ? [2.4, 0.2, 0] : [0, -1.1, 0.3]), [wide]);
  const depPos = useMemo(() => (wide ? [0, 12.5, 13.5] : [0, 15, 18]), [wide]);
  const depLook = useMemo(() => (wide ? [0, 0.2, 0.4] : [0, -0.8, 0.4]), [wide]);

  return (
    <>
      <color attach="background" args={["#0b0d25"]} />
      <fog attach="fog" args={["#171238", 18, 52]} />

      <Awakener target={stage === "intro" ? 0 : 1} awake={awake} />
      <SkyDome awake={awake} />
      <Lights awake={awake} />
      <CameraRig
        mode={mode}
        wide={wide}
        planPos={planPos}
        planLook={planLook}
        depPos={depPos}
        depLook={depLook}
        onArrive={onArrive}
      />

      {controlsReady && (
        <>
          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.07}
            rotateSpeed={0.55}
            zoomSpeed={0.6}
            minDistance={7.5}
            maxDistance={20}
            minPolarAngle={0.45}
            maxPolarAngle={1.3}
            minAzimuthAngle={-0.95}
            maxAzimuthAngle={0.95}
            target={planLook}
          />
          <FocusRig selected={selected} planLook={planLook} />
        </>
      )}

      <Diorama
        awake={awake}
        selected={selected}
        completed={completed}
        onSelect={onSelect}
        marching={stage === "departure" || stage === "complete"}
        showPins={showPins}
      />
      <AwakenPulse stage={stage} />
      <Clouds />
      <Lanterns awake={awake} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Bird
          key={i}
          radius={3.4 + i * 0.7}
          speed={0.22 + i * 0.03}
          height={3.4 + (i % 3) * 0.55}
          phase={i * 1.9}
          awake={awake}
        />
      ))}
      <Sparkles
        count={110}
        scale={[9.5, 4, 9.5]}
        position={[0, 1.2, 0]}
        size={3}
        speed={0.25}
        opacity={0.6}
        color="#ffd98a"
      />
    </>
  );
}

/* ═══════════════════════════ the game ═══════════════════════════════ */
export default function KingsLivingMap({ onComplete, onExit }) {
  const [stage, setStage] = useState("intro"); // intro | planning | departure | complete
  const [controlsReady, setControlsReady] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [selected, setSelected] = useState("south");
  const [completed, setCompleted] = useState([]);
  const [showDeparture, setShowDeparture] = useState(false);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState(null);
  const [caption, setCaption] = useState(0);
  const [wide, setWide] = useState(
    () => (typeof window === "undefined" ? true : window.innerWidth > 900)
  );

  const awake = useRef(0);
  const timers = useRef([]);
  const audio = useAudio(muted);

  const activeRegion = REGION_BY_ID[selected];
  const allOrganised = completed.length === REGIONS.length;
  const hudVisible = stage === "planning" && arrived;

  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      document.body.style.cursor = "auto";
    },
    []
  );

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth > 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const select = useCallback(
    (id) => {
      if (id !== selectedRef.current) audio.tick();
      setSelected(id);
      setShowDeparture(false);
    },
    [audio]
  );

  const beginGame = () => {
    audio.awaken();
    setStage("planning");
  };

  const onArrive = useCallback((mode) => {
    if (mode === "planning") {
      setControlsReady(true);
      setArrived(true);
    }
  }, []);

  const organise = useCallback(() => {
    if (stage !== "planning" || completed.includes(selected)) return;
    const next = [...completed, selected];
    setCompleted(next);
    audio.organise(next.length);
    setToast({ id: Date.now(), text: `${activeRegion.short} expedition organised` });
    if (next.length === REGIONS.length) {
      later(() => setShowDeparture(true), 2800);
    }
  }, [stage, completed, selected, audio, activeRegion, later]);

  const startDeparture = useCallback(() => {
    setShowDeparture(false);
    setControlsReady(false);
    setArrived(false);
    setStage("departure");
    setCaption(0);
    audio.horn();
    later(() => setCaption(1), 3300);
    later(() => setCaption(2), 6600);
    later(() => setStage("complete"), 10200);
  }, [audio, later]);

  const skipDeparture = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStage("complete");
  };

  /* keyboard: Esc leaves · 1-4 pick a region · Enter organises */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        onExit && onExit();
        return;
      }
      if (!hudVisible) return;
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx >= 0) select(REGIONS[idx].id);
      if (e.key === "Enter" && !(e.target && e.target.tagName === "BUTTON")) {
        if (allOrganised) startDeparture();
        else organise();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit, hudVisible, select, organise, allOrganised, startDeparture]);

  const ActiveIcon = activeRegion.icon;
  const isDone = completed.includes(selected);

  return (
    <div className="klm-game" data-stage={stage}>
      <div className="klm-world">
        <Canvas
          shadows
          camera={{ position: [10, 4, 15], fov: 40, near: 0.1, far: 300 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.1;
          }}
        >
          <Scene
            stage={stage}
            selected={selected}
            completed={completed}
            onSelect={select}
            awake={awake}
            wide={wide}
            controlsReady={controlsReady}
            onArrive={onArrive}
            showPins={hudVisible}
          />
        </Canvas>
      </div>

      <div className="klm-vignette" />
      <div className={`klm-letterbox${stage === "departure" ? " is-on" : ""}`} aria-hidden="true" />

      {/* ── top bar ───────────────────────────────────────────────── */}
      <header className={`klm-topbar${stage === "departure" ? " is-hidden" : ""}`}>
        <button type="button" className="klm-esc" onClick={onExit} aria-label="Leave the map (Esc)">
          <kbd>ESC</kbd>
          <span>Leave the map</span>
        </button>

        {hudVisible && (
          <div className="klm-brand">
            <Crown size={14} />
            <span>The King’s Council</span>
          </div>
        )}

        <div className="klm-topbar__right">
          {hudVisible && (
            <div className="klm-progress" aria-label={`${completed.length} of 4 expeditions organised`}>
              <div className="klm-pips">
                {REGIONS.map((r) => (
                  <i key={r.id} className={completed.includes(r.id) ? "is-on" : ""} style={{ "--pin": r.color }} />
                ))}
              </div>
              <span>
                <b>{completed.length}</b> of 4 organised
              </span>
            </div>
          )}
          <button
            type="button"
            className="klm-sound"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* ── intro ─────────────────────────────────────────────────── */}
      {stage === "intro" && (
        <div className="klm-intro">
          <div className="klm-intro__head">
            <span className="klm-kicker">Kishkindha · The search for Sita</span>
            <h1>The King’s Living Map</h1>
            <p>
              Four directions. Four expeditions. One purpose. Organise the
              search parties and prepare the journey that may lead to Sita.
            </p>
          </div>
          <div className="klm-intro__foot">
            <button type="button" className="klm-primary klm-primary--lg" onClick={beginGame}>
              Awaken the map <ArrowRight size={17} />
            </button>
            <small>An expedition begins with a decision</small>
          </div>
        </div>
      )}

      {/* ── planning HUD ──────────────────────────────────────────── */}
      {hudVisible && (
        <>
          <div className="klm-heading">
            <h1>Where shall they search?</h1>
            <p>Select a region on the map to review its expedition.</p>
          </div>

          <aside className="klm-panel" aria-live="polite">
            <div className="klm-panel__body" key={selected}>
              <div className="klm-panel__crest" style={{ "--pin": activeRegion.color }}>
                <span className="klm-panel__sigil">
                  <ActiveIcon size={20} />
                </span>
                <div>
                  <small>Direction {REGIONS.indexOf(activeRegion) + 1} of 4</small>
                  <strong>{activeRegion.short}</strong>
                </div>
                {isDone && (
                  <span className="klm-panel__done">
                    <Check size={13} /> Organised
                  </span>
                )}
              </div>

              <h2>{activeRegion.name}</h2>
              <p className="klm-panel__text">{activeRegion.description}</p>

              <div className="klm-terrain">
                <span>Terrain</span>
                <strong>{activeRegion.terrain}</strong>
              </div>

              <div className="klm-orn">✦</div>

              <div className="klm-leaders">
                <span className="klm-section-label">
                  <Users size={12} /> Who goes
                </span>
                {activeRegion.leaders.map((l, i) => (
                  <div className="klm-leader" key={l.name} style={{ "--i": i }}>
                    <div className="klm-leader__seal">{l.name.charAt(0)}</div>
                    <div>
                      <strong>{l.name}</strong>
                      <small>{l.role}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {allOrganised ? (
              <button type="button" className="klm-primary klm-organise is-final" onClick={startDeparture}>
                Witness their departure <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="klm-primary klm-organise"
                onClick={organise}
                disabled={isDone}
              >
                {isDone ? "Expedition organised" : "Organise this expedition"}
                {isDone ? <Check size={16} /> : <ArrowRight size={16} />}
              </button>
            )}
          </aside>

          <nav className="klm-dock" aria-label="Directions">
            {REGIONS.map((r, i) => {
              const Icon = r.icon;
              const done = completed.includes(r.id);
              return (
                <button
                  type="button"
                  key={r.id}
                  className={`klm-dock__btn${selected === r.id ? " is-active" : ""}${done ? " is-done" : ""}`}
                  style={{ "--pin": r.color }}
                  onClick={() => select(r.id)}
                >
                  <span className="klm-dock__icon">{done ? <Check size={14} /> : <Icon size={14} />}</span>
                  <span className="klm-dock__name">{r.short}</span>
                  <kbd>{i + 1}</kbd>
                </button>
              );
            })}
          </nav>

          <div className="klm-hint">
            <MapIcon size={13} />
            Drag to turn the map · scroll to zoom
          </div>

          {toast && (
            <div className="klm-toast" key={toast.id} role="status">
              <Check size={14} />
              <span>{toast.text}</span>
            </div>
          )}

          {showDeparture && (
            <div className="klm-departure">
              <div className="klm-departure__card">
                <div className="klm-departure__seal">✦</div>
                <span className="klm-kicker">The search is set in motion</span>
                <h2>Four paths. One promise.</h2>
                <p>
                  The expeditions are organised. The southern party now turns
                  toward the distant ocean.
                </p>
                <button type="button" className="klm-primary" onClick={startDeparture}>
                  Witness their departure <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── departure cinematic ───────────────────────────────────── */}
      {stage === "departure" && (
        <>
          <div className="klm-caption" key={caption}>
            <p>{CAPTIONS[caption]}</p>
          </div>
          <button type="button" className="klm-skip" onClick={skipDeparture}>
            Skip <SkipForward size={14} />
          </button>
        </>
      )}

      {/* ── finale ────────────────────────────────────────────────── */}
      {stage === "complete" && (
        <div className="klm-complete">
          <div className="klm-complete__card">
            <div className="klm-departure__seal">✧</div>
            <span className="klm-kicker">The expeditions depart</span>
            <h1>The Search Begins</h1>
            <p>
              Across the four directions, the Vanara parties begin their
              search. In the south, Angada, Jambavan and Hanuman journey
              together toward the unknown.
            </p>
            <div className="klm-complete__seal">
              <Check size={16} />
              <span>Four expeditions organised</span>
            </div>
            <button type="button" className="klm-primary" onClick={() => onComplete && onComplete()}>
              Return to the story <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}