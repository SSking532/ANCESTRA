// Pure animation math + pose system (no three.js dependency).
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
export const easeOut = (v) => { const t = clamp(v); return 1 - (1 - t) * (1 - t) * (1 - t); };
export const easeIn = (v) => { const t = clamp(v); return t * t * t; };

// Pose channels. Arm A sits at -x, arm B at +x. +z is forward.
export const CH = [
  "rootY", "fwd", "side", "yaw", "pitch", "roll", "pelvisY",
  "spineX", "spineY", "spineZ", "headX", "headY", "jaw",
  "aShX", "aShY", "aShZ", "aElb", "bShX", "bShY", "bShZ", "bElb",
  "aHipX", "aHipZ", "aKnee", "bHipX", "bHipZ", "bKnee",
];
export const IDX = Object.fromEntries(CH.map((c, i) => [c, i]));
export const NCH = CH.length;

// Fighting guard (base pose for the two vanaras).
export const GUARD = {
  rootY: -0.2, spineX: 0.2, headX: 0.12, aShX: 0.75, aElb: 1.9, aShZ: 0.25,
  bShX: 0.75, bElb: 1.9, bShZ: 0.25, aHipX: 0.3, bHipX: -0.25, aKnee: 0.5, bKnee: 0.45,
  aHipZ: 0.18, bHipZ: 0.18, spineY: 0.0,
};
// Relaxed standing pose (used by Rama / neutral).
export const IDLE = { aShZ: 0.1, bShZ: 0.1, aElb: 0.25, bElb: 0.25, aKnee: 0.04, bKnee: 0.04 };

export const toArr = (obj) => {
  const a = new Float32Array(NCH);
  for (const k in obj) { if (!(k in IDX)) throw new Error("bad channel " + k); a[IDX[k]] = obj[k]; }
  return a;
};
export const BASE = toArr(GUARD);
export const IDLE_ARR = toArr(IDLE);

// Mirror a partial pose (swap arm A/B, flip lateral channels).
const SWAP = { a: "b", b: "a" };
export function mirror(p) {
  const o = {};
  for (const k in p) {
    let n = k; let v = p[k];
    if (/^[ab](Sh|Elb|Hip|Knee)/.test(k)) n = SWAP[k[0]] + k.slice(1);
    if (/(ShY|ShZ|HipZ)$/.test(n) ) v = v; // abduction is symmetric because arms are mirrored in the rig
    if (["spineY", "spineZ", "headY", "side", "yaw", "roll", "pelvisY"].includes(k)) v = -v;
    o[n] = v;
  }
  return o;
}
// Absolute pose -> offsets from the guard base.
export const rel = (abs) => {
  const o = {};
  for (const k in GUARD) o[k] = -GUARD[k];
  for (const k in abs) o[k] = abs[k] - (GUARD[k] || 0);
  return o;
};

// ----- clips: keys in seconds [t, partialPose]. offsets added to guard -----
function hermite(keys, t) {
  // keys: [[time, value], ...] sorted
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const [t0, p0] = keys[i], [t1, p1] = keys[i + 1];
  const h = t1 - t0, u = (t - t0) / h;
  const pm = i > 0 ? keys[i - 1] : null, pn = i + 2 < n ? keys[i + 2] : null;
  const m0 = pm ? (p1 - pm[1]) / (t1 - pm[0]) : (p1 - p0) / h;
  const m1 = pn ? (pn[1] - p0) / (pn[0] - t0) : (p1 - p0) / h;
  // clamp tangents so we never over/undershoot wildly (monotone-ish)
  const lim = 2.2 * Math.abs((p1 - p0) / h);
  const a = Math.max(-lim, Math.min(lim, m0)) * 0.9, b = Math.max(-lim, Math.min(lim, m1)) * 0.9;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * a + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * h * b;
}

export function compileClip(keys) {
  const chans = {};
  const dur = keys[keys.length - 1][0];
  for (const [t, pose] of keys) for (const c in pose) {
    if (!(c in IDX)) throw new Error("bad channel " + c);
    (chans[c] ||= []).push([t, pose[c]]);
  }
  const list = [];
  for (const c in chans) {
    const k = chans[c];
    if (k[0][0] > 0) k.unshift([0, 0]);
    if (k[k.length - 1][0] < dur) k.push([dur, 0]);
    list.push([IDX[c], k]);
  }
  return { dur, list };
}
export function sampleClip(clip, t, out, w = 1) {
  for (const [ci, k] of clip.list) out[ci] += hermite(k, t) * w;
}
export function sampleTrack(keys, t) { // keys: [[t, v...]] -> array
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0].slice(1);
  if (t >= keys[n - 1][0]) return keys[n - 1].slice(1);
  let i = 0; while (i < n - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1];
  const u = smooth((t - a[0]) / (b[0] - a[0]));
  return a.slice(1).map((v, j) => lerp(v, b[j + 1], u));
}
export { hermite };
