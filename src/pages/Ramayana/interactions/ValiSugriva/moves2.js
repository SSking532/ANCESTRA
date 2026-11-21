import C, { def, defM } from "./moves.js";
import { rel, BASE } from "./anim.js";

// ---- absolute-ish rest poses (converted to offsets from guard) ----
export const LIE = { ...rel({
  pitch: -1.5708, rootY: -0.92, fwd: -0.6, headX: -0.15, aShX: 0.05, aElb: 0.2, aShZ: 0.4, bShX: 0.05, bElb: 0.2, bShZ: 0.4,
  aHipX: 0.05, bHipX: 0.0, aKnee: 0.1, bKnee: 0.1, aHipZ: 0.25, bHipZ: 0.25, spineX: 0,
}) };
export const KNEEL = { ...rel({
  rootY: -0.8, spineX: 0.38, headX: 0.45, aHipX: 0.0, bHipX: 0.0, aKnee: 2.45, bKnee: 2.45, aHipZ: 0.12, bHipZ: 0.12,
  aShX: 0.2, bShX: 0.2, aElb: 0.3, bElb: 0.3, aShZ: 0.18, bShZ: 0.18,
}) };
const lie = (extra = {}) => ({ ...LIE, ...extra });
export const lieWith = lie;

// ---- reactions ----
def("hit", [[0, {}], [0.1, { headX: -0.7, headY: 0.35, spineX: -0.3, fwd: -0.3, aShX: -0.2, bShX: -0.2 }], [0.45, { fwd: -0.2, headX: -0.2 }], [0.9, {}]]);
def("hitBig", [[0, {}], [0.12, { headX: -0.95, headY: 0.9, spineX: -0.5, spineZ: 0.35, fwd: -0.8, aShX: -0.4, bShX: -0.4, aShZ: 0.8, bShZ: 0.8, jaw: 0.6 }],
  [0.5, { headX: -0.4, headY: 0.5, spineZ: 0.2, fwd: -1.0, rootY: -0.15, spineX: -0.2 }], [1.2, {}]]);
def("hitGut", [[0, {}], [0.1, { spineX: 0.95, headX: 0.5, fwd: -0.35, rootY: -0.3, jaw: 0.5, aShX: -0.1, bShX: -0.1, aElb: 0.2, bElb: 0.2 }],
  [0.5, { spineX: 0.75, headX: 0.35, fwd: -0.45, rootY: -0.25, jaw: 0.3 }], [1.1, {}]]);
def("stagger", [[0, {}], [0.2, { fwd: -0.5, spineZ: 0.3, aShZ: 0.7, bShZ: 0.7, spineX: -0.1 }], [0.5, { fwd: -0.9, spineZ: -0.3, headY: 0.3, aShZ: 0.6 }],
  [0.85, { fwd: -1.1, spineZ: 0.2, rootY: -0.15 }], [1.3, { fwd: -0.9 }], [1.8, {}]]);
// ---- defence & evasion ----
const GUARDUP = { aShX: 0.3, bShX: 0.3, aElb: 0.25, bElb: 0.25, aShZ: -0.18, bShZ: -0.18, spineX: 0.18, headX: 0.2 };
def("block", [[0, {}], [0.07, { ...GUARDUP, fwd: -0.22, rootY: -0.06 }], [0.3, { ...GUARDUP, aShX: 0.25, bShX: 0.25, fwd: -0.12, spineX: 0.12 }], [0.7, {}]]);
def("blockBig", [[0, {}], [0.08, { ...GUARDUP, spineX: 0.32, fwd: -0.6, rootY: -0.16, aKnee: 0.3, bKnee: 0.3, headX: 0.3 }],
  [0.4, { ...GUARDUP, fwd: -0.5, rootY: -0.12, spineX: 0.25 }], [0.9, {}]]);
const DUCK = { rootY: -0.52, spineX: 0.45, headX: 0.15, aKnee: 0.75, bKnee: 0.75, aHipX: 0.35, bHipX: 0.2, aShX: 0.15, bShX: 0.15, aElb: 0.1, bElb: 0.1, fwd: 0.1 };
def("duck", [[0, {}], [0.18, DUCK], [0.5, { ...DUCK, spineY: 0.15 }], [0.85, {}]]);
const LEAN = { spineX: -0.55, headX: -0.35, fwd: -0.45, aShX: 0.1, bShX: 0.1, aKnee: 0.2, bKnee: 0.2 };
def("lean", [[0, {}], [0.14, LEAN], [0.4, LEAN], [0.8, {}]]);
def("pushed", [[0, {}], [0.15, { fwd: -0.7, spineX: -0.3, aShZ: 0.8, bShZ: 0.8, aShX: 0.1, bShX: 0.1, headX: -0.3, rootY: -0.05 }],
  [0.5, { fwd: -1.1, spineX: -0.15, aShZ: 0.7, bShZ: 0.7, rootY: -0.12 }], [1.0, {}]]);
def("ko", [[0, {}], [0.2, { headX: -0.85, spineX: -0.3, fwd: -0.5, aShX: -0.3, bShX: -0.3, jaw: 0.6 }],
  [0.55, { pitch: -0.85, rootY: -0.35, fwd: -0.9, aShZ: 0.9, bShZ: 0.9, aShX: 0.5, bShX: 0.5, aKnee: 0.2, bKnee: 0.2 }],
  [0.95, lie({ pitch: -1.82, rootY: -0.85, aShZ: 0.9, bShZ: 0.9 })], [1.3, lie()]]);
def("lie", [[0, lie()], [1, lie()]]);
def("lieJolt", [[0, lie()], [0.1, lie({ rootY: -0.78, headX: -0.7, aShX: 0.5, bShX: 0.5 })], [0.35, lie({ rootY: -0.92 })], [0.5, lie()]]);
def("lieStrain", [[0, lie()], [0.5, lie({ aShX: 0.9, bShX: 0.9, aElb: 1.2, bElb: 1.2, headX: 0.3, pitch: -1.45 })], [1.0, lie({ aShX: 0.7, bShX: 0.7, aElb: 1.5, bElb: 1.5, headX: 0.1, pitch: -1.5 })], [1.5, lie()]]);
def("getUp", [[0, lie()], [0.4, lie({ pitch: -0.9, rootY: -0.75, spineX: 0.6, aShX: 0.7, bShX: 0.7, aElb: 1.3, bElb: 1.3 })],
  [0.95, { pitch: -0.1, rootY: -0.8, spineX: 0.8, aKnee: 1.6, bKnee: 1.2, aHipX: 0.9, bHipX: 0.2, aShX: 0.5, bShX: 0.4, aElb: 0.8, bElb: 0.8, headX: 0.5, fwd: -0.2 }],
  [1.6, { rootY: -0.35, spineX: 0.55, headX: 0.3, fwd: -0.1 }], [2.2, {}]]);
def("thrown", [[0, {}], [0.15, { rootY: 0.3, pitch: -0.4, fwd: -0.5, aShZ: 0.9, bShZ: 0.9, aElb: -1.2, bElb: -1.2, jaw: 0.8 }],
  [0.5, { rootY: 1.1, pitch: -3.3, fwd: -2.2, aShZ: 1.1, bShZ: 1.1, aKnee: 1.2, bKnee: 0.6 }],
  [0.9, { rootY: 0.1, pitch: -5.8, fwd: -0.45, aShZ: 0.8, bShZ: 0.8 }],
  [1.25, lie({ pitch: -7.854, rootY: -0.9, fwd: -0.6 })]]);
def("toKneel", [[0, {}], [0.25, { headX: -0.8, spineX: -0.4, fwd: -0.4, jaw: 0.6 }], [0.7, { rootY: -0.4, spineX: 0.4, headX: 0.2, aKnee: 1.2, bKnee: 1.2, aHipX: 0.4, bHipX: 0.1, aShX: 0.1, bShX: 0.1, aElb: 0.6, bElb: 0.6 }], [1.4, KNEEL]]);
def("kneel", [[0, KNEEL], [1, KNEEL]]);
def("kneelLook", [[0, KNEEL], [0.8, { ...KNEEL, headX: -0.15, headY: 0.55, spineX: 0.2 }], [1.6, { ...KNEEL, headX: -0.15, headY: 0.55, spineX: 0.2 }], [2.4, KNEEL]]);
// ---- lift & slam (Vali = attacker, Sugriva = victim) ----
def("liftSlam", [[0, {}], [0.5, { aShX: 1.15, bShX: 1.15, aElb: -0.5, bElb: -0.5, aShZ: -0.05, bShZ: -0.05, spineX: 0.7, rootY: -0.45, fwd: 0.35, aKnee: 0.9, bKnee: 0.9, aHipX: 0.5, bHipX: -0.1 }],
  [1.1, { aShX: 2.5, bShX: 2.5, aElb: -1.3, bElb: -1.3, aShZ: 0.1, bShZ: 0.1, spineX: -0.35, rootY: 0.05, fwd: 0.3, headX: -0.5, jaw: 0.9 }],
  [1.7, { aShX: 2.9, bShX: 2.9, aElb: -1.5, bElb: -1.5, aShZ: 0.12, bShZ: 0.12, spineX: -0.5, rootY: 0.1, fwd: 0.25, headX: -0.55, jaw: 1.0, aKnee: 0.3, bKnee: 0.3 }],
  [2.0, { aShX: 2.9, bShX: 2.9, aElb: -1.5, bElb: -1.5, spineX: -0.55, rootY: 0.08, fwd: 0.25, headX: -0.55, jaw: 1.0, aKnee: 0.3, bKnee: 0.3 }],
  [2.3, { aShX: 0.9, bShX: 0.9, aElb: -1.5, bElb: -1.5, spineX: 0.95, rootY: -0.55, fwd: 0.7, headX: 0.4, jaw: 0.6, aKnee: 0.9, bKnee: 0.9 }],
  [2.8, { aShX: 0.6, bShX: 0.6, aElb: -1.3, bElb: -1.3, spineX: 0.8, rootY: -0.5, fwd: 0.7 }], [3.5, {}]], 2.3);
def("lifted", [[0, {}], [0.45, { rootY: 0.0, spineX: 0.45, aShX: 1.2, bShX: 1.2, aElb: -0.8, bElb: -0.8, pitch: -0.25, jaw: 0.6 }],
  [1.1, lie({ pitch: -1.2, rootY: 2.2, aShZ: 1.0, bShZ: 1.0, aShX: 0.9, bShX: 0.9, aKnee: 0.5, bKnee: 0.5 , fwd: 0})],
  [1.7, lie({ pitch: -1.5708, rootY: 3.65, fwd: 0, aShZ: 0.9, bShZ: 0.9, aShX: 0.2, bShX: 0.2, aKnee: 0.3, bKnee: 0.3, headX: -0.4, jaw: 0.5 })],
  [2.0, lie({ pitch: -1.5708, rootY: 3.7, fwd: 0, aShZ: 0.8, bShZ: 0.8, headX: -0.5, jaw: 0.6, aKnee: 0.3, bKnee: 0.3 })],
  [2.3, lie({ pitch: -1.62, rootY: -0.85, fwd: -0.45, aShZ: 0.9, bShZ: 0.9 })], [2.5, lie({ pitch: -1.5708, rootY: -0.92 })], [2.8, lie()]]);
// ---- ground fight ----
const STR = { rootY: -0.62, spineX: 0.8, aHipZ: 0.95, bHipZ: 0.95, aHipX: 0.35, bHipX: 0.25, aKnee: 1.1, bKnee: 1.1, headX: 0.45 };
const up = (s) => ({ ...rel({ ...STR, [s + "ShX"]: 2.6, [s + "Elb"]: -0.5 }) });
const dn = (s) => ({ ...rel({ ...STR, rootY: -0.72, spineX: 1.0, [s + "ShX"]: 0.55, [s + "Elb"]: -1.6 }) });
def("groundPunch", [[0, rel({ ...STR, aShX: 0.9, bShX: 0.9, aElb: 1.0, bElb: 1.0 })], [0.35, up("a")], [0.6, dn("a")], [0.78, dn("a")], [1.1, up("b")], [1.35, dn("b")],
  [1.5, dn("b")], [1.85, up("a")], [2.1, dn("a")], [2.25, dn("a")], [2.6, rel({ ...STR, aShX: 0.9, bShX: 0.9, aElb: 1.0, bElb: 1.0 })]]);
const GRIP = { ...STR, aShX: 1.1, bShX: 1.1, aElb: 0.5, bElb: 0.5, aShZ: 0.1, bShZ: 0.1 };
def("headBang", [[0, rel(GRIP)], [0.5, rel({ ...GRIP, aShX: 2.0, bShX: 2.0, rootY: -0.3, spineX: 0.35, headX: -0.2, jaw: 0.8 })],
  [0.75, rel({ ...GRIP, aShX: 0.55, bShX: 0.55, aElb: -0.9, bElb: -0.9, rootY: -0.75, spineX: 1.05 })], [0.95, rel({ ...GRIP, aShX: 0.55, bShX: 0.55, rootY: -0.75, spineX: 1.05 })],
  [1.4, rel({ ...GRIP, aShX: 2.2, bShX: 2.2, rootY: -0.25, spineX: 0.3, headX: -0.3, jaw: 1.0 })],
  [1.62, rel({ ...GRIP, aShX: 0.5, bShX: 0.5, aElb: -1.0, bElb: -1.0, rootY: -0.8, spineX: 1.1, jaw: 0.5 })], [1.85, rel({ ...GRIP, aShX: 0.5, bShX: 0.5, rootY: -0.8, spineX: 1.1 })],
  [2.3, rel({ ...STR, aShX: 0.9, bShX: 0.9, aElb: 1.0, bElb: 1.0 })]]);
def("straddle", [[0, rel({ ...STR, aShX: 0.9, bShX: 0.9, aElb: 1.0, bElb: 1.0 })], [1, rel({ ...STR, aShX: 0.9, bShX: 0.9, aElb: 1.0, bElb: 1.0 })]]);
def("toStraddle", [[0, {}], [0.4, { rootY: -0.4, spineX: 0.55, aShX: 0.6, bShX: 0.6, aElb: -0.3, bElb: -0.3, aHipZ: 0.6, bHipZ: 0.6, aKnee: 0.8, bKnee: 0.8 }],
  [0.8, rel({ ...STR, aShX: 0.9, bShX: 0.9, aElb: 1.0, bElb: 1.0 })]]);
def("fromStraddle", [[0, rel({ ...STR, aShX: 0.9, bShX: 0.9, aElb: 1.0, bElb: 1.0 })], [0.3, rel({ ...STR, aShX: 0.9, bShX: 0.9, aElb: 1.0, bElb: 1.0, spineX: 0.8 })], [0.4, {}]]);
def("kickUp", [[0, lie()], [0.2, lie({ pitch: -1.2, aShX: 0.8, bShX: 0.8, aElb: 1.2, bElb: 1.2, aHipX: 1.2, bHipX: 1.2, aKnee: 1.5, bKnee: 1.5, headX: 0.4 })],
  [0.38, lie({ pitch: -1.15, aHipX: 2.2, bHipX: 2.2, aKnee: -0.2, bKnee: -0.2, aShX: 0.9, bShX: 0.9, headX: 0.5, rootY: -0.8 })], [0.7, lie({ pitch: -1.3, aHipX: 1.0, bHipX: 1.0, aKnee: 0.5, bKnee: 0.5 })], [0.95, lie()]]);
// ---- reactions to the divine arrow ----
const CLUTCH = { aShX: 0.9, aElb: 2.1, aShZ: -0.2, bShX: 0.8, bElb: 2.0, bShZ: -0.2 };
def("arrowHit", [[0, {}], [0.08, { spineX: -0.6, headX: -0.95, jaw: 1.0, fwd: -0.6, aShZ: 1.0, bShZ: 1.0, aShX: 0.3, bShX: 0.3, aElb: -1.0, bElb: -1.0, rootY: 0.05 }],
  [0.5, { spineX: -0.25, headX: -0.5, jaw: 0.8, fwd: -0.5, ...rel({ ...CLUTCH }), rootY: -0.1 }],
  [1.3, { spineX: 0.35, headX: 0.35, jaw: 0.5, fwd: -0.6, ...rel({ ...CLUTCH }), rootY: -0.35, aKnee: 1.3, bKnee: 1.0, aHipX: 0.6, bHipX: 0.1 }],
  [2.1, { ...KNEEL, aShX: 0.7, aElb: 1.9, bShX: 0.7, bElb: 1.9, fwd: -0.6 }],
  [2.8, { ...KNEEL, spineX: -0.1, headX: -0.6, jaw: 0.6, aShX: 0.5, aElb: 1.2, bShX: 0.5, bElb: 1.2, fwd: -0.6 }],
  [3.7, lie({ fwd: -0.9, headX: -0.4, jaw: 0.4 })]]);
export default C;
