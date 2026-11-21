import { compileClip, mirror } from "./anim.js";

// Every clip is a set of OFFSETS from the fighting guard (see anim.js GUARD).
// `impact` = second (inside the clip, at its nominal duration) where the strike makes contact.
// fight.js uses it to place the opponent's reaction, the hit-flash, the sound and the camera cut
// exactly on the contact frame, no matter how much a clip is sped up.
const C = {};
const def = (name, keys, impact) => {
  const c = compileClip(keys);
  if (impact !== undefined) c.impact = impact;
  C[name] = c;
};
const defM = (name, keys, impact) => { // define a mirrored (A-side) twin as name+"A"
  def(name + "B", keys, impact);
  def(name + "A", keys.map(([t, p]) => [t, mirror(p)]), impact);
};

// ---------- strikes ----------
defM("jab", [
  [0, {}],
  [0.12, { bElb: 0.55, bShX: 0.1, spineY: 0.2, fwd: -0.07, rootY: -0.05, headX: 0.06, aHipX: -0.1 }],
  [0.27, { bShX: 0.85, bElb: -1.75, spineY: -0.4, pelvisY: -0.22, fwd: 0.42, headX: -0.05, aHipX: 0.3, aKnee: 0.12 }],
  [0.4, { bShX: 0.78, bElb: -1.65, spineY: -0.34, pelvisY: -0.18, fwd: 0.38, aHipX: 0.26 }],
  [0.62, {}],
], 0.27);
defM("cross", [
  [0, {}],
  [0.25, { bShX: 0.25, bElb: 0.6, spineY: 0.45, pelvisY: 0.25, fwd: -0.14, rootY: -0.12, aShX: 0.15, headX: 0.08 }],
  [0.4, { bShX: 1.1, bElb: -1.74, spineY: -0.4, pelvisY: -0.28, fwd: 0.58, aHipX: 0.3, bHipX: -0.2, headX: -0.1, rootY: -0.12, aShX: 0.0 }],
  [0.55, { bShX: 0.96, bElb: -1.49, spineY: -0.34, pelvisY: -0.22, fwd: 0.46, aHipX: 0.25 }],
  [0.95, {}],
], 0.4);
defM("hook", [
  [0, {}],
  [0.3, { bShZ: 0.85, bShX: -0.05, bElb: -0.3, spineY: 0.9, pelvisY: 0.45, fwd: -0.12, rootY: -0.14, spineZ: -0.12, headX: 0.1 }],
  [0.48, { bShX: 1.2, bShZ: 0.55, bElb: -1.1, spineY: -0.75, pelvisY: -0.6, fwd: 0.52, spineZ: 0.15, headX: -0.05, aHipX: 0.25 }],
  [0.62, { bShX: 1.04, bShZ: 0.5, bElb: -0.92, spineY: -0.6, pelvisY: -0.5, fwd: 0.42 }],
  [1.05, {}],
], 0.48);
defM("upper", [
  [0, {}],
  [0.3, { bShX: -0.55, bElb: -0.6, rootY: -0.5, spineX: 0.28, fwd: -0.05, spineY: 0.32, aKnee: 0.4, bKnee: 0.4, headX: 0.1 }],
  [0.5, { bShX: 0.55, bElb: -1.25, rootY: -0.19, spineX: -0.32, fwd: 0.46, spineY: -0.42, headX: -0.28, aKnee: 0.1, bKnee: 0.1 }],
  [0.65, { bShX: 0.4, bElb: -1.0, rootY: -0.3, fwd: 0.35 }],
  [1.05, {}],
], 0.5);
defM("elbow", [
  [0, {}],
  [0.16, { bShX: 0.1, bElb: 0.7, bShZ: 0.5, spineY: 0.55, pelvisY: 0.3, fwd: -0.1, rootY: -0.1 }],
  [0.3, { bShX: 0.6, bElb: -0.15, bShZ: -0.1, spineY: -0.85, pelvisY: -0.5, fwd: 0.5, headX: -0.04, aHipX: 0.3 }],
  [0.45, { bShX: 0.5, bElb: -0.1, spineY: -0.7, fwd: 0.4 }],
  [0.8, {}],
], 0.3);
def("hammer", [
  [0, {}],
  [0.5, { aShX: 2.4, bShX: 2.4, aElb: -1.3, bElb: -1.3, aShZ: 0.2, bShZ: 0.2, spineX: -0.45, rootY: 0.05, headX: -0.3, fwd: -0.1 }],
  [0.72, { aShX: 2.7, bShX: 2.7, aElb: -1.5, bElb: -1.5, spineX: -0.55, rootY: -0.1, jaw: 0.5 }],
  [0.95, { aShX: 0.5, bShX: 0.5, aElb: -1.7, bElb: -1.7, aShZ: -0.1, bShZ: -0.1, spineX: 0.75, rootY: -0.5, fwd: 0.55, headX: 0.35, jaw: 0.4 }],
  [1.2, { aShX: 0.45, bShX: 0.45, aElb: -1.6, bElb: -1.6, spineX: 0.7, rootY: -0.5, fwd: 0.5 }], [1.8, {}],
], 0.95);
def("headbutt", [
  [0, {}],
  [0.3, { spineX: -0.45, headX: -0.55, fwd: -0.18, rootY: -0.1, aShX: 0.2, bShX: 0.2 }],
  [0.5, { spineX: 0.6, headX: 0.55, fwd: 0.6, rootY: -0.22, aShX: -0.1, bShX: -0.1 }],
  [0.7, { spineX: 0.45, headX: 0.4, fwd: 0.45 }],
  [1.1, {}],
], 0.5);
def("shove", [ // two-palm push
  [0, {}],
  [0.2, { aShX: 0.15, bShX: 0.15, aElb: 0.5, bElb: 0.5, spineX: 0.1, fwd: -0.15, rootY: -0.12 }],
  [0.38, { aShX: 0.9, bShX: 0.9, aElb: -1.7, bElb: -1.7, aShZ: -0.1, bShZ: -0.1, spineX: 0.25, fwd: 0.55, rootY: -0.1, aHipX: 0.3 }],
  [0.56, { aShX: 0.85, bShX: 0.85, aElb: -1.5, bElb: -1.5, spineX: 0.22, fwd: 0.5 }],
  [1.0, {}],
], 0.38);
// ---------- kicks ----------
defM("front", [
  [0, {}],
  [0.25, { bHipX: 0.9, bKnee: 1.2, spineX: -0.12, aKnee: 0.15, rootY: 0.05 }],
  [0.42, { bHipX: 1.75, bKnee: -0.45, spineX: -0.35, aKnee: 0.1, fwd: 0.35, rootY: 0.1 }],
  [0.58, { bHipX: 1.55, bKnee: -0.35, spineX: -0.3, fwd: 0.3 }],
  [1.0, {}],
], 0.42);
def("roundkick", [
  [0, {}],
  [0.3, { yaw: -1.0, aHipX: 0.8, aKnee: 1.2, rootY: -0.1, spineZ: 0.1 }],
  [0.62, { yaw: -3.3, aHipX: 1.2, aHipZ: 0.9, aKnee: 0.8, rootY: 0.2, spineZ: 0.25 }],
  [0.85, { yaw: -5.9, aHipX: 1.46, aHipZ: 0.0, aKnee: -0.37, spineZ: 0.4, rootY: 0.8, fwd: 0.15, aShZ: 0.9, bShZ: 0.9, aShX: 0.2, bShX: 0.2, aElb: -1.5, bElb: -1.5 }],
  [1.05, { yaw: -6.283, aHipX: 0.9, aKnee: 0.8, rootY: -0.1 }], [1.45, { yaw: -6.283 }], [1.6, { yaw: -6.283 }],
], 0.85);
def("flykick", [
  [0, {}],
  [0.3, { rootY: -0.55, spineX: 0.3, fwd: -0.15, aShX: 0.2, bShX: 0.2 }],
  [0.62, { rootY: 0.95, fwd: 1.0, pitch: -0.35, aHipX: 1.1, bHipX: 1.6, aKnee: 0.9, bKnee: -0.35, aShX: 0.0, bShX: 0.2, aShZ: 0.7, bShZ: 0.7, aElb: -1.0, bElb: -1.0, headX: -0.2 }],
  [0.82, { rootY: 0.75, fwd: 1.25, pitch: -0.3, aHipX: 1.0, bHipX: 1.55, aKnee: 0.8, bKnee: -0.3, aShZ: 0.7, bShZ: 0.7 }],
  [1.2, { rootY: -0.35, fwd: 1.0, pitch: 0.1, aHipX: 0.9, bHipX: 0.4, aKnee: 1.1, bKnee: 0.9 }], [1.7, {}],
], 0.72);
defM("knee", [
  [0, {}],
  [0.3, { aShX: 0.6, bShX: 0.6, aElb: -0.5, bElb: -0.5, spineX: 0.2, fwd: 0.3 }],
  [0.5, { bHipX: 1.9, bKnee: 1.7, spineX: 0.55, aShX: 0.7, bShX: 0.7, aElb: -0.6, bElb: -0.6, fwd: 0.45, headX: 0.1 }],
  [0.8, { bHipX: 1.3, bKnee: 1.3, spineX: 0.45, fwd: 0.4 }], [1.2, {}],
], 0.5);
// ---------- display ----------
def("roar", [
  [0, {}], [0.45, { spineX: -0.35, headX: -0.65, jaw: 1.0, aShX: 0.0, bShX: 0.0, aShZ: 0.95, bShZ: 0.95, aElb: -1.0, bElb: -1.0, rootY: 0.05, aHipZ: 0.35, bHipZ: 0.35 }],
  [1.3, { spineX: -0.3, headX: -0.6, jaw: 0.85, aShX: 0.1, bShX: 0.1, aShZ: 0.9, bShZ: 0.9, aElb: -0.9, bElb: -0.9, headY: 0.06 }],
  [1.9, { spineX: -0.35, headX: -0.65, jaw: 1.0, aShZ: 0.95, bShZ: 0.95, aElb: -1.0, bElb: -1.0 }], [2.4, {}],
]);
def("beat", [
  [0, {}], [0.3, { aShX: 0.2, aElb: 0.6, aShZ: -0.1, bShX: 0.0, bShZ: 0.9, bElb: -1.0, spineX: -0.2, headX: -0.3, rootY: 0.05 }],
  [0.5, { aShX: 0.6, aElb: 0.5, aShZ: -0.3, bShX: 0.0, bShZ: 0.9, bElb: -1.0, spineX: -0.15, headX: -0.28, jaw: 0.4 }],
  [0.7, { aShX: 0.2, aElb: 0.6, aShZ: 0.9, bShX: 0.6, bElb: 0.5, bShZ: -0.3, spineX: -0.2, headX: -0.3 }],
  [0.9, { aShX: 0.0, aShZ: 0.9, aElb: -1.0, bShX: 0.6, bElb: 0.5, bShZ: -0.3, spineX: -0.15, jaw: 0.5 }],
  [1.1, { aShX: 0.6, aElb: 0.5, aShZ: -0.3, bShX: 0.0, bShZ: 0.9, bElb: -1.0, jaw: 0.5, spineX: -0.15 }],
  [1.5, { spineX: -0.1 }], [1.8, {}],
]);
def("taunt", [ // Sugriva: bouncing on his toes, one arm pointing the challenge at his brother
  [0, {}],
  [0.3, { aShX: 0.9, aElb: -1.8, aShZ: -0.15, bShX: -0.25, bElb: 0.35, spineX: -0.12, headX: -0.12, spineY: -0.2, jaw: 0.5, rootY: 0.04 }],
  [0.6, { aShX: 0.92, aElb: -1.8, aShZ: -0.15, bShX: -0.25, bElb: 0.35, spineX: -0.14, headX: -0.14, spineY: -0.2, jaw: 0.35, rootY: -0.06 }],
  [0.9, { aShX: 0.9, aElb: -1.8, aShZ: -0.15, bShX: -0.25, bElb: 0.35, spineX: -0.12, headX: -0.12, spineY: -0.2, jaw: 0.5, rootY: 0.04 }],
  [1.5, {}],
]);
def("clinch", [ // collar tie, strain
  [0, {}], [0.4, { aShX: 0.45, bShX: 0.45, aElb: -0.55, bElb: -0.55, aShZ: -0.1, bShZ: -0.1, spineX: 0.5, headX: 0.25, fwd: 0.25, rootY: -0.15, aHipX: 0.6, bHipX: -0.5, aKnee: 0.7 }],
  [0.9, { aShX: 0.5, bShX: 0.5, aElb: -0.6, bElb: -0.6, spineX: 0.58, headX: 0.3, fwd: 0.3, rootY: -0.2, spineY: 0.12, aHipX: 0.7, bHipX: -0.55, aKnee: 0.8, jaw: 0.3 }],
  [1.4, { aShX: 0.45, bShX: 0.45, aElb: -0.55, bElb: -0.55, spineX: 0.55, headX: 0.25, fwd: 0.28, rootY: -0.17, spineY: -0.12, aHipX: 0.55, bHipX: -0.5, aKnee: 0.7, jaw: 0.3 }],
  [1.9, { aShX: 0.45, bShX: 0.45, aElb: -0.55, bElb: -0.55, spineX: 0.5, fwd: 0.25, rootY: -0.15, spineY: 0.1, jaw: 0.3 }],
  [2.3, {}],
]);
export default C;
export { def, defM };
