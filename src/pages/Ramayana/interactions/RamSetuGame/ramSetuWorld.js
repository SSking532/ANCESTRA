import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Shared constants + math. Everything the shaders know about the     */
/*  world (waves, shoreline) is mirrored here in JS so stones, builders*/
/*  and the camera can sit exactly on the water.                       */
/* ------------------------------------------------------------------ */

/** Shared clock (seconds). Water shader and floating stones both read it. */
export const clock = { t: 0 };

export const SUN_DIR = new THREE.Vector3(0.84, 0.3, -0.44).normalize();
export const FOG_DENSITY = 0.0062;
export const FOG_COLOR = "#d79a78";

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------ waves ------------------------------ */

// [dirX, dirZ, frequency, speed, amplitude]
export const WAVES = [
  [0.92, 0.38, 0.55, 1.1, 0.1],
  [-0.3, 0.95, 0.9, 1.5, 0.06],
  [0.62, -0.78, 1.7, 2.1, 0.03],
  [0.98, 0.2, 3.1, 2.8, 0.012],
];

export function waveHeight(x, z, t) {
  let h = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const [dx, dz, f, s, a] = WAVES[i];
    h += Math.sin((x * dx + z * dz) * f + t * s) * a;
  }
  return h;
}

export function waveGrad(x, z, t) {
  let gx = 0;
  let gz = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const [dx, dz, f, s, a] = WAVES[i];
    const c = Math.cos((x * dx + z * dz) * f + t * s) * a * f;
    gx += c * dx;
    gz += c * dz;
  }
  return [gx, gz];
}

const f4 = (n) => n.toFixed(4);

export const WAVE_GLSL = `
float waveH(vec2 p, float t){
  float h = 0.0;
${WAVES.map(
  ([dx, dz, f, s, a]) =>
    `  h += sin(dot(p, vec2(${f4(dx)}, ${f4(dz)})) * ${f4(f)} + t * ${f4(s)}) * ${f4(a)};`
).join("\n")}
  return h;
}
vec2 waveG(vec2 p, float t){
  vec2 g = vec2(0.0);
${WAVES.map(
  ([dx, dz, f, s, a]) =>
    `  g += cos(dot(p, vec2(${f4(dx)}, ${f4(dz)})) * ${f4(f)} + t * ${f4(s)}) * ${(a * f).toFixed(5)} * vec2(${f4(dx)}, ${f4(dz)});`
).join("\n")}
  return g;
}
`;

/** Dawn sky gradient, shared by the sky dome, the sea and the river. */
export const SKY_GLSL = `
uniform vec3 uSunDir;
vec3 skyColor(vec3 d){
  float h = clamp(d.y, -0.3, 1.0);
  vec3 horizon = vec3(1.00, 0.64, 0.40);
  vec3 low     = vec3(0.93, 0.50, 0.46);
  vec3 mid     = vec3(0.46, 0.34, 0.58);
  vec3 zen     = vec3(0.06, 0.08, 0.25);
  vec3 c = mix(horizon, low, smoothstep(0.0, 0.14, h));
  c = mix(c, mid, smoothstep(0.08, 0.42, h));
  c = mix(c, zen, smoothstep(0.35, 1.0, h));
  float s = max(dot(d, uSunDir), 0.0);
  c += vec3(1.0, 0.58, 0.26) * pow(s, 5.0) * 0.50;
  c += vec3(1.0, 0.80, 0.50) * pow(s, 48.0) * 0.9;
  return c;
}
`;

/* ----------------------------- terrain ----------------------------- */

export const shoreX = (z) =>
  -7.5 + Math.sin(z * 0.35) * 0.9 + Math.sin(z * 0.9 + 1) * 0.5;

const n2 = (x, z) =>
  Math.sin(x * 0.21 + z * 0.17) * 0.5 +
  Math.sin(x * 0.47 - z * 0.39 + 2) * 0.3 +
  Math.sin(x * 0.9 + z * 1.1) * 0.12;

function baseHeight(x, z) {
  const dx = shoreX(z) - x; // > 0 on land
  let h;
  if (dx > 0) h = dx * 0.13 + n2(x, z) * 0.18 * Math.min(1, dx * 0.25);
  else h = dx * 0.32;

  const m = smoothstep(-20, -62, x);
  const edgeZ = 1 - smoothstep(75, 115, Math.abs(z));
  const edgeX = 1 - smoothstep(-125, -155, x);
  h +=
    m *
    edgeZ *
    edgeX *
    (9 + (n2(x * 0.5, z * 0.5 + 7) + 0.9) * 6 + Math.abs(Math.sin(z * 0.045)) * 9);
  return Math.max(h, -3.5);
}

/* ------------------------------ river ------------------------------ */

const RIVER_CTRL = [
  [-70, -40],
  [-56, -31],
  [-44, -24],
  [-33, -20],
  [-25, -14],
  [-19, -12.5],
  [-14, -9],
  [-10.5, -6.8],
];
const MOUTH_Z = -5.9;
RIVER_CTRL.push([shoreX(MOUTH_Z) - 0.2, MOUTH_Z]);

export const RIVER_N = 96;
export const riverCurve = new THREE.CatmullRomCurve3(
  RIVER_CTRL.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  "centripetal"
);
export const riverPts = riverCurve.getPoints(RIVER_N - 1);
export const riverY = riverPts.map(
  (_, i) => 0.09 + 2.6 * Math.pow(1 - i / (RIVER_N - 1), 1.6)
);
export const riverHalfWidth = (i) => 1.5 + 0.9 * (i / (RIVER_N - 1));

export function riverQuery(x, z) {
  let best = 1e9;
  let bi = 0;
  let bu = 0;
  for (let i = 0; i < RIVER_N - 1; i++) {
    const a = riverPts[i];
    const b = riverPts[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const l2 = abx * abx + abz * abz;
    let u = ((x - a.x) * abx + (z - a.z) * abz) / l2;
    u = u < 0 ? 0 : u > 1 ? 1 : u;
    const px = a.x + abx * u - x;
    const pz = a.z + abz * u - z;
    const d2 = px * px + pz * pz;
    if (d2 < best) {
      best = d2;
      bi = i;
      bu = u;
    }
  }
  return { d: Math.sqrt(best), i: bi, u: bu };
}

export function terrainHeight(x, z) {
  let h = baseHeight(x, z);
  // Carve the river valley.
  if (x < -5) {
    const q = riverQuery(x, z);
    const ry = riverY[q.i] * (1 - q.u) + riverY[q.i + 1] * q.u;
    const hw = riverHalfWidth(q.i + q.u);
    const t = smoothstep(hw * 0.6, hw + 0.4, q.d);
    const bank = ry - 0.35 + t * 0.75;
    const w = 1 - smoothstep(hw + 0.4, hw + 8, q.d);
    h = h + (Math.min(h, bank) - h) * w;
  }
  return h;
}

const C = {
  wet: new THREE.Color("#7a6648"),
  sand: new THREE.Color("#d2b98f"),
  dry: new THREE.Color("#9a9250"),
  grass: new THREE.Color("#6d7c3c"),
  grassDark: new THREE.Color("#4e6232"),
  rock: new THREE.Color("#7d6d5e"),
  rockDark: new THREE.Color("#554a42"),
};

export function buildTerrainGeometry() {
  const g = new THREE.PlaneGeometry(170, 230, 200, 260);
  g.rotateX(-Math.PI / 2);
  g.translate(-70, 0, 0);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
  }
  g.computeVertexNormals();

  const nor = g.attributes.normal;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = pos.getY(i);
    const slope = 1 - nor.getY(i);
    const n = n2(x * 1.7, z * 1.7) * 0.5 + 0.5;

    if (h < 0.32) c.copy(C.wet).lerp(C.sand, smoothstep(-0.2, 0.32, h));
    else if (h < 1.6) c.copy(C.sand).lerp(C.dry, smoothstep(0.35, 1.4, h) * (0.5 + n * 0.5));
    else if (h < 6) c.copy(C.dry).lerp(n > 0.5 ? C.grass : C.grassDark, smoothstep(1.4, 3, h));
    else c.copy(C.grass).lerp(C.rock, smoothstep(5, 11, h));

    c.lerp(C.rock, smoothstep(0.16, 0.5, slope));
    if (h > 9) c.lerp(C.rockDark, smoothstep(9, 18, h) * 0.6);
    c.multiplyScalar(0.86 + n * 0.28);

    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

/* ----------------------------- the Setu ---------------------------- */

export const SLOT_STEP = 1.45;
export const BRIDGE_START_X = -6.2;

export function slotPosition(i) {
  const row = i % 2;
  const col = Math.floor(i / 2);
  return {
    x: BRIDGE_START_X + col * SLOT_STEP + row * 0.38,
    z: (row ? 0.62 : -0.62) + Math.sin(i * 1.7) * 0.07,
    rotY: Math.sin(i * 2.3) * 0.14,
  };
}

export const ALTAR = { x: -9.4, z: 0 };
