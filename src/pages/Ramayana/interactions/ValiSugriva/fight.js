import C from "./moves2.js";
import { BASE, IDLE_ARR, NCH, IDX, sampleClip, sampleTrack, clamp, lerp, smooth } from "./anim.js";
import { G, fighterTime } from "./gameState.js";

export const DURATION = 48;
export const SCALE = { V: 1.22, S: 1.0 };
export const RAMA_POS = [-6.6, 0, 8.6];
export const RAMA_SCALE = 1.08;
export const RELEASE_T = 39.0, ARROW_HIT_T = 39.9;

/* =====================================================================================
   CHOREOGRAPHY
   Every exchange is a "beat": attacker clip + defender reaction + event (sound, flash,
   camera shake, hit-stop, damage). The contact time is read from the clip's own `impact`
   marker, so reaction, VFX and camera are always on the exact contact frame.
   V = Vali (heavy, relentless)  ·  S = Sugriva (fast, evasive, fights back)
   ===================================================================================== */
const SCHED = { V: [], S: [] };
export const BEATS = {};          // id -> { t0, t (impact), end, atk, def }
export const FIGHT_EVENTS = [];   // { t, k, w, h, v, hs, dmg }
const put = (who, t0, name, d) => { if (!C[name]) throw new Error("missing clip " + name); SCHED[who].push([t0, name, d]); };
const ev = (e) => { const c = { h: 2.4, v: 1, hs: 0, dmg: 0 }; for (const k in e) if (e[k] !== undefined) c[k] = e[k]; FIGHT_EVENTS.push(c); };
function strike(id, atk, t0, clip, d, o = {}) {
  const c = C[clip]; if (!c) throw new Error("missing clip " + clip);
  const dd = d || c.dur, def = atk === "V" ? "S" : "V";
  const t = t0 + (c.impact !== undefined ? c.impact : c.dur * 0.5) * (dd / c.dur);
  put(atk, t0, clip, d);
  BEATS[id] = { id, atk, def, t0, t, end: t0 + dd };
  if (o.react) put(def, t - (o.lead !== undefined ? o.lead : 0.05), o.react, o.rd);
  ev({ t, k: o.k || "hit", w: o.miss ? atk : def, h: o.h, v: o.v, hs: o.hs, dmg: o.dmg, id });
  return t;
}

// ---- 0:00  the challenge ----
put("V", 0.6, "beat", 1.8);
put("S", 0.9, "taunt", 1.5);
put("V", 2.5, "roar", 1.9); ev({ t: 2.9, k: "roar", w: "V", v: 1 });
put("S", 3.0, "roar", 1.5); ev({ t: 3.45, k: "roar", w: "S", v: 0.7 });
// ---- the clash ----
put("V", 4.4, "clinch", 1.9); put("S", 4.4, "clinch", 1.9); ev({ t: 4.5, k: "grapple", w: "M", v: 0.8 });
// ---- round one: Sugriva lands first, Vali answers, Sugriva slips and counters ----
strike("hookS1", "S", 6.25, "hookB", 0.9, { react: "hit", rd: 0.6, h: 2.6, v: 0.7, dmg: 0.04 });
strike("upperV1", "V", 7.0, "upperB", 0.9, { react: "hitBig", rd: 0.8, h: 2.6, v: 1.0, dmg: 0.09, hs: 0.05 });
strike("hookV2", "V", 8.05, "hookB", 0.9, { miss: true, k: "whiff", v: 0.6 });
put("S", 8.2, "duck", 0.8);
strike("frontS1", "S", 8.7, "frontB", 0.8, { react: "hitGut", rd: 0.9, h: 1.8, v: 0.9, dmg: 0.06, hs: 0.04 });
// ---- Vali's combination: jab is blocked, the cross breaks the guard, the roundhouse ends the round ----
strike("jabV1", "V", 9.9, "jabB", 0.5, { react: "block", rd: 0.6, k: "block", h: 2.6, v: 0.6, dmg: 0.01 });
strike("crossV1", "V", 10.35, "crossB", 0.85, { react: "hitBig", rd: 0.9, h: 2.6, v: 0.9, dmg: 0.1, hs: 0.06 });
strike("roundV1", "V", 11.6, "roundkick", 1.6, { react: "ko", k: "heavy", h: 2.7, v: 1.7, dmg: 0.22, hs: 0.12 });
ev({ t: 13.35, k: "thud", w: "S", v: 1.0 });
put("S", 13.7, "lie", 1.0);
put("V", 13.2, "beat", 1.4);
// ---- round two: Sugriva refuses to stay down — hook (blocked), knee, flying kick ----
put("S", 14.7, "getUp", 1.25);
strike("hookS2", "S", 15.85, "hookB", 0.8, { react: "block", rd: 0.6, k: "block", h: 2.6, v: 0.6, dmg: 0.01 });
strike("kneeS1", "S", 16.35, "kneeB", 0.85, { react: "hitGut", rd: 0.8, h: 1.8, v: 0.9, dmg: 0.05 });
strike("flyS1", "S", 17.1, "flykick", 1.45, { react: "hitBig", rd: 1.0, k: "heavy", h: 2.0, v: 1.2, dmg: 0.08, hs: 0.08 });
strike("headV1", "V", 18.65, "headbutt", 0.7, { react: "hit", rd: 0.5, h: 2.7, v: 1.0, dmg: 0.06 });
// ---- the mountain lift ----
put("V", 19.3, "liftSlam"); put("S", 19.3, "lifted");
ev({ t: 19.9, k: "roar", w: "V", v: 0.8 });
ev({ t: 21.6, k: "slam", w: "S", v: 2.2, hs: 0.15, dmg: 0.2 });
BEATS.slam = { id: "slam", atk: "V", def: "S", t0: 19.3, t: 21.6, end: 22.8 };
// ---- ground and pound ----
put("S", 22.1, "lie", 4.1);
put("V", 22.8, "toStraddle"); put("V", 23.6, "groundPunch");
put("S", 24.18, "lieJolt"); put("S", 24.93, "lieJolt"); put("S", 25.68, "lieJolt");
ev({ t: 24.2, k: "hit", w: "S", h: 0.9, v: 1.0, dmg: 0.08 });
ev({ t: 24.95, k: "hit", w: "S", h: 0.9, v: 1.0, dmg: 0.08 });
ev({ t: 25.7, k: "heavy", w: "S", h: 0.9, v: 1.4, dmg: 0.09, hs: 0.07 });
// ---- Sugriva's kick-up throws the king off ----
put("V", 26.2, "fromStraddle"); put("S", 26.2, "kickUp");
ev({ t: 26.58, k: "heavy", w: "V", h: 1.6, v: 1.2, dmg: 0.07, hs: 0.1 });
BEATS.kickUp = { id: "kickUp", atk: "S", def: "V", t0: 26.2, t: 26.58, end: 27.2 };
put("V", 26.6, "thrown"); ev({ t: 27.8, k: "thud", w: "V", v: 1.4 });
put("S", 27.15, "lie", 5.85);
put("V", 27.85, "lie", 0.65); put("V", 28.5, "getUp", 1.5);
// ---- triumph, the watcher, the shot ----
put("V", 30.0, "roar", 2.4); ev({ t: 30.5, k: "roar", w: "V", v: 1 });
put("V", 32.5, "beat", 1.8);
put("V", 34.4, "roar", 1.6); ev({ t: 34.8, k: "roar", w: "V", v: 0.9 });
put("V", 36.4, "beat", 1.6);
put("V", 38.0, "roar", 1.6); ev({ t: 38.3, k: "roar", w: "V", v: 0.9 });
put("S", 33.0, "getUp", 2.2);
put("V", ARROW_HIT_T, "arrowHit", 3.0); put("V", ARROW_HIT_T + 3.0, "lie", 20); put("S", ARROW_HIT_T, "hit");
ev({ t: RELEASE_T, k: "release", w: "R", v: 1 });
ev({ t: ARROW_HIT_T, k: "arrow", w: "H", v: 2.4, hs: 0.18 });
ev({ t: 42.4, k: "thud", w: "V", v: 1.0 });
FIGHT_EVENTS.sort((a, b) => a.t - b.t);

// Impacts that physically shove the receiver (drives the procedural recoil layer)
const HITS = FIGHT_EVENTS.filter((e) => (e.k === "hit" || e.k === "heavy" || e.k === "block" || e.k === "slam") && (e.w === "V" || e.w === "S"));

/* ---- spacing along the duel axis n (Vali on +, Sugriva on -) ---- */
const PV = [[0, 3.6], [2.5, 2.7], [3.8, 1.8], [4.4, 1.2], [6.3, 1.25], [6.7, 1.35], [7.7, 1.2], [8.0, 1.3], [8.5, 1.5], [9.0, 1.3], [9.9, 1.25], [11.6, 1.25],
  [13.7, 1.1], [16.0, 1.1], [17.3, 1.25], [17.8, 2.0], [18.6, 1.6], [19.3, 1.55], [20.0, 1.0], [21.3, 1.0], [21.7, 0.7], [22.8, 0.7], [23.6, -1.1], [26.6, -1.1],
  [27.85, 3.0], [28.5, 3.0], [30.0, 2.4], [30.8, 1.4], [48, 1.4]];
const PS = [[0, -3.6], [2.5, -2.7], [3.8, -1.8], [4.4, -1.2], [6.3, -1.15], [6.7, -1.1], [10.8, -1.1], [12.4, -1.25], [13.7, -2.2], [14.7, -2.0], [15.6, -1.4],
  [17.0, -1.3], [17.7, -0.9], [18.0, -0.9], [19.3, -0.9], [20.4, 0.7], [21.0, 0.7], [21.7, -1.0], [48, -1.0]];
const THETA = [[0, 0], [6, 0.35], [12, -0.2], [19, 0.15], [26, 0], [48, 0]];
const CEN = [[0, 0, 0], [12, 0.3, -0.2], [20, 0, 0], [48, 0, 0]];
const YAWW = [[0, 0], [29.4, 0], [30.4, 1], [48, 1]];

// Per-strike distance correction (solved offline with the rig's forward kinematics so that every
// fist / foot / knee / head really arrives on its target at the contact frame). Negative = closer.
export const GAPFIX = [[0,0],[5.9,0],[6.661,-0.53],[7.429,-0.847],[8.461,0.023],[9.036,-0.53],[10.118,0.148],[10.708,-0.217],[12.45,-0.738],[13.1,0],[15.6,0],[16.216,-0.169],[16.704,-0.809],[17.714,-0.399],[18.968,-0.614],[19.7,0],[48,0]];
const dgAt = (t) => sampleTrack(GAPFIX, t)[0];
const pv = (t) => v1(PV, t) + dgAt(t) / 2;
const ps = (t) => v1(PS, t) - dgAt(t) / 2;

const compiled = {};
for (const w in SCHED) compiled[w] = SCHED[w].sort((a, b) => a[0] - b[0]).map(([t0, name, d]) => {
  const clip = C[name]; if (!clip) throw new Error("missing clip " + name);
  return { t0, clip, d: d || clip.dur, name };
});

const angDelta = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const v1 = (keys, t) => sampleTrack(keys, t)[0];

// Procedural recoil layered on top of the authored reaction: every impact shoves the receiver
// back, snaps the head and rattles the spine, decaying quickly (block = a small shove only).
function impactLayer(who, t, pose) {
  for (const h of HITS) {
    if (h.w !== who) continue;
    const a = t - h.t; if (a < 0 || a > 0.7) continue;
    const blocked = h.k === "block", big = h.k === "heavy" || h.k === "slam" ? 1.35 : 1;
    const k = h.v * Math.exp(-a * 8) * big * (blocked ? 0.55 : 1);
    pose[IDX.fwd] -= 0.2 * k;
    if (blocked) continue;
    pose[IDX.headX] -= 0.2 * k; pose[IDX.spineX] -= 0.1 * k;
    pose[IDX.headY] += Math.sin(a * 55) * 0.09 * k; pose[IDX.spineZ] += Math.sin(a * 42 + 1) * 0.05 * k;
  }
}

const _fsCache = { V: { t: NaN, r: null }, S: { t: NaN, r: null } };
export function fighterState(who, t) {
  const c = _fsCache[who]; if (c.t === t && c.r) return c.r;
  const r = fighterStateRaw(who, t); c.t = t; c.r = r; return r;
}
function fighterStateRaw(who, t) {
  const th = v1(THETA, t); const cen = sampleTrack(CEN, t);
  const n = [Math.cos(th), Math.sin(th)];
  const dist = who === "V" ? pv(t) : ps(t);
  const sgn = who === "V" ? -1 : 1;
  let yawBase = Math.atan2(sgn * n[0], sgn * n[1]);
  const pose = Float32Array.from(BASE);
  for (const e of compiled[who]) {
    const l = t - e.t0;
    if (l < 0 || l > e.d) continue;
    sampleClip(e.clip, l * (e.clip.dur / e.d), pose, 1);
  }
  impactLayer(who, t, pose);
  // procedural life: breathing (heavier as the fight wears on), guard bob, footwork
  const ph = who === "V" ? 0 : 1.7;
  const tired = 1 + clamp(t / 30) * 0.9;
  const down = Math.abs(pose[IDX.pitch]) > 0.6;
  if (!down) {
    pose[IDX.rootY] += Math.sin(t * 4.4 + ph) * 0.03;
    pose[IDX.spineX] += Math.sin(t * 2.2 + ph) * 0.02 * tired;
    pose[IDX.aShX] += Math.sin(t * 4.4 + ph + 1) * 0.04; pose[IDX.bShX] += Math.sin(t * 4.4 + ph + 2) * 0.04;
    const dt = 0.05;
    const dd = (who === "V" ? pv(t + dt) - pv(t - dt) : ps(t + dt) - ps(t - dt)) / (2 * dt);
    const sp = clamp(Math.abs(dd) / 1.4);
    const sw = Math.sin(t * 9 + ph) * 0.55 * sp;
    pose[IDX.aHipX] += sw; pose[IDX.bHipX] -= sw; pose[IDX.aKnee] += Math.max(0, -sw) * 0.8; pose[IDX.bKnee] += Math.max(0, sw) * 0.8;
    pose[IDX.rootY] += Math.abs(Math.sin(t * 9 + ph)) * 0.06 * sp;
    // between exchanges the fighters keep their weight moving (side-to-side rock)
    const rock = Math.sin(t * 2.6 + ph) * 0.05 * (t > 3.5 && t < 30 ? 1 : 0.4);
    pose[IDX.side] += rock; pose[IDX.roll] += rock * 0.35;
  } else {
    pose[IDX.spineX] += Math.sin(t * 2.2 + ph) * 0.02;
  }
  const x0 = cen[0] + n[0] * dist, z0 = cen[1] + n[1] * dist;
  const fx = Math.sin(yawBase), fz = Math.cos(yawBase);
  const rx = Math.cos(yawBase), rz = -Math.sin(yawBase);
  const fwd = pose[IDX.fwd], side = pose[IDX.side];
  const pos = [x0 + fx * fwd + rx * side, 0, z0 + fz * fwd + rz * side];
  if (who === "V") { // turn to face Rama late in the sequence
    const w = smooth(v1(YAWW, t));
    const ya = Math.atan2(RAMA_POS[0] - pos[0], RAMA_POS[2] - pos[2]);
    yawBase += angDelta(yawBase, ya) * w;
  }
  const yaw = yawBase + pose[IDX.yaw];
  return { pos, yaw, yawBase, pose, scale: SCALE[who] };
}
// approximate world point on a fighter (height h in body units)
export function bodyPoint(st, h, fwdOff = 0) {
  const s = st.scale;
  return [st.pos[0] + Math.sin(st.yawBase) * fwdOff * s, h * s, st.pos[2] + Math.cos(st.yawBase) * fwdOff * s];
}
export function duelFrame(t) {
  const V = fighterState("V", t), S = fighterState("S", t);
  const th = v1(THETA, t);
  const n = [Math.cos(th), 0, Math.sin(th)], perp = [-n[2], 0, n[0]];
  const M = [(V.pos[0] + S.pos[0]) / 2, 0, (V.pos[2] + S.pos[2]) / 2];
  return { V, S, n, perp, M };
}


// ------- Rama (archer) -------
// Arm angles were solved with forward kinematics of the exact rig so the drawing hand really
// reaches the string / cheek and the bow hand really holds the bow. [shX, shY, shZ, elbow]
const ARM_A = [[0, [0.862, 2.637, 1.564, 0.51]], [0.25, [0.884, 2.322, 1.548, 1.074]], [0.5, [0.862, 2.078, 1.541, 1.477]], [0.75, [0.8, 1.855, 1.552, 1.806]], [1, [0.728, 1.633, 1.586, 2.088]]];
const ARM_B = [1.558, -0.038, 1.375, 0.431];
const armA = (d) => {
  d = clamp(d); let i = 0; while (i < ARM_A.length - 2 && d > ARM_A[i + 1][0]) i++;
  const [d0, a] = ARM_A[i], [d1, b] = ARM_A[i + 1]; const u = (d - d0) / (d1 - d0);
  return a.map((v, k) => lerp(v, b[k], u));
};
const STAND = { rootY: -0.12, spineX: 0.03, spineY: 0.05, aKnee: 0.4, bKnee: 0.35, aHipZ: 0.3, bHipZ: 0.3, aHipX: 0.05, bHipX: 0.0, headY: 1.5, headX: -0.02 };
const P = (o) => { const a = Float32Array.from(IDLE_ARR); for (const k in o) a[IDX[k]] = o[k]; return a; };
const withArms = (o, d, bowArm = ARM_B) => { const A = armA(d); return P({ ...o, aShX: A[0], aShY: A[1], aShZ: A[2], aElb: A[3], bShX: bowArm[0], bShY: bowArm[1], bShZ: bowArm[2], bElb: bowArm[3] }); };
const drawPose = (d) => withArms({ ...STAND, headX: -0.02 - 0.03 * d }, d);

const HIDE = P({ rootY: -0.95, spineX: 0.35, headX: 0.1, headY: 1.2, aKnee: 2.3, bKnee: 2.3, aHipZ: 0.15, bHipZ: 0.15, aShX: 0.5, aElb: 0.8, bShX: 0.35, bElb: 0.9, bShZ: 0.25, aShZ: 0.2 });
const PEEK = P({ rootY: -0.92, spineX: 0.3, headX: 0.02, headY: 1.5, aKnee: 2.25, bKnee: 2.25, aHipZ: 0.15, bHipZ: 0.15, aShX: 0.5, aElb: 0.8, bShX: 0.4, bElb: 0.9, bShZ: 0.3, aShZ: 0.2 });
const PEEK2 = P({ rootY: -0.78, spineX: 0.25, headX: 0.0, headY: 1.35, aKnee: 1.9, bKnee: 1.9, aHipZ: 0.2, bHipZ: 0.2, aShX: 0.5, aElb: 0.8, bShX: 0.5, bElb: 0.9, bShZ: 0.4, aShZ: 0.2 });
const REACH = P({ rootY: -0.4, spineX: 0.12, spineY: 0.1, headX: 0.0, headY: 1.5, aKnee: 0.95, bKnee: 0.9, aHipZ: 0.28, bHipZ: 0.28, aShX: -0.9, aShZ: 0.55, aElb: 1.3, aShY: 0.4, bShX: 0.8, bShZ: 0.9, bElb: 0.7, bShY: 0 });
const NOCK = withArms({ ...STAND, rootY: -0.2, aKnee: 0.55, bKnee: 0.5, spineX: 0.06 }, 0.0);
const PRE = [[0, HIDE], [30, HIDE], [31.2, PEEK], [32.4, PEEK2], [33.0, REACH], [33.7, NOCK], [34.0, drawPose(0)]];
const RELAX = P({ rootY: -0.05, spineX: 0.05, aKnee: 0.2, bKnee: 0.2, aShX: 0.3, aShZ: 0.3, aElb: 0.3, bShZ: 1.1, bElb: 0.2, headY: 1.35, headX: 0.1 });
const END = P({ rootY: 0, spineX: 0.1, bShZ: 0.2, bShX: 0.6, bElb: 0.4, aShZ: 0.2, aElb: 0.3, headY: 0.8, headX: 0.15 });
const POST = [[RELEASE_T, drawPose(1)], [RELEASE_T + 0.14, drawPose(0.5)], [42.0, RELAX], [44.0, END], [60, END]];
const blend = (keys, t) => {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [t0, a] = keys[i], [t1, b] = keys[i + 1]; const u = smooth((t - t0) / (t1 - t0)); const o = new Float32Array(NCH);
  for (let c = 0; c < NCH; c++) o[c] = lerp(a[c], b[c], clamp(u)); return o;
};

export function ramaDraw(t) {
  if (G.mode !== "cine" || G.shotTarget) return G.drawn;
  return lerp(0, 0.3, smooth((t - 34) / 1.6));
}
export function ramaState(t) {
  let pose;
  if (t < 34 && G.mode === "cine") pose = blend(PRE, t);
  else if (t < RELEASE_T || G.mode !== "cine") pose = drawPose(ramaDraw(t));
  else pose = blend(POST, t);
  pose = Float32Array.from(pose);
  pose[IDX.rootY] += Math.sin(t * 2.0) * 0.01; pose[IDX.spineX] += Math.sin(t * 1.6) * 0.008;
  if (G.mode !== "cine" || (t > 35 && t < RELEASE_T)) { const br = Math.sin(G.aimClock * 2.2) * 0.012 * (1 + G.sway); pose[IDX.rootY] += br; pose[IDX.bShZ] += br * 2; }
  const ft = fighterTime(Math.min(t, ARROW_HIT_T));
  const V = fighterState("V", ft);
  let tp = bodyPoint(V, 2.3, 0.42);
  if (G.shotTarget) tp = G.shotTarget; else if (G.mode !== "cine") tp = [lerp(tp[0], G.aimPoint[0], 0.4), tp[1], lerp(tp[2], G.aimPoint[2], 0.4)];
  const dx = tp[0] - RAMA_POS[0], dz = tp[2] - RAMA_POS[2];
  const aimYaw = Math.atan2(-dz, dx);
  const yaw = t < 33 ? lerp(aimYaw + 0.5, aimYaw, smooth((t - 31) / 2)) : aimYaw;
  const dr = t < 34 && G.mode === "cine" ? 0 : ramaDraw(t);
  return { pos: RAMA_POS, yaw, pose, scale: RAMA_SCALE, draw: dr, aimYaw, nocked: t >= 33.6 && t < RELEASE_T + 0.01 && G.sinceRelease < 0, pulling: t >= 32.8 && t < 33.6 };
}
export function heartPoint(t) {
  const V = fighterState("V", Math.min(t, ARROW_HIT_T));
  return bodyPoint(V, 2.3, 0.42);
}
export function arrowState(t) {
  if (t < RELEASE_T) return null;
  const rs = ramaState(RELEASE_T);
  const a = G.nock && G.nock[1] > 0.5 ? G.nock.slice() : [RAMA_POS[0] + Math.cos(-rs.aimYaw) * 0.7, 3.3, RAMA_POS[2] + Math.sin(-rs.aimYaw) * 0.7];
  const b = G.shotTarget ? G.shotTarget.slice() : heartPoint(ARROW_HIT_T);
  const u = clamp((t - RELEASE_T) / (ARROW_HIT_T - RELEASE_T));
  const p = [lerp(a[0], b[0], u), lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * 0.18, lerp(a[2], b[2], u)];
  const dir = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const l = Math.hypot(...dir); dir[0] /= l; dir[1] /= l; dir[2] /= l;
  return { pos: p, dir, hit: t >= ARROW_HIT_T, a, b, u };
}
