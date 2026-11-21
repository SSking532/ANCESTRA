import { duelFrame, bodyPoint, ramaState, arrowState, heartPoint, RAMA_POS, RELEASE_T, ARROW_HIT_T, DURATION, BEATS, FIGHT_EVENTS } from "./fight.js";
import { clamp, lerp, smooth } from "./anim.js";
import { G } from "./gameState.js";

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const mix = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const P = (x, y, z) => [x, y, z];

// ---- events: hits, blocks, slams, roars (drive FX, shake, audio, hit-stop). Built by fight.js ----
export const EVENTS = FIGHT_EVENTS;
export function eventPos(e) {
  const f = duelFrame(e.t);
  if (e.w === "H") return heartPoint(ARROW_HIT_T);
  if (e.w === "R") return [RAMA_POS[0], 3.2, RAMA_POS[2]];
  if (e.w === "M") return [f.M[0], 2.2, f.M[2]];
  const st = e.w === "V" ? f.V : f.S;
  if (e.k === "thud" || e.k === "slam") return [st.pos[0], 0.1, st.pos[2]];
  return bodyPoint(st, e.h || 2.4, 0.5);
}

const orbit = (c, r, a, y) => [c[0] + Math.cos(a) * r, y, c[2] + Math.sin(a) * r];
const hd = (st, h = 2.9) => bodyPoint(st, h);
const SH = []; // shots: [t0, t1, fn(u, t, F) -> {p, l, fov, roll?}]
const shot = (a, b, fn) => SH.push([a, b, fn]);
const ease = (u) => smooth(u);
const B = BEATS;

// 0 — establishing push-in
shot(0, 2.4, (u) => ({ p: mix(P(-13, 8.5, 14), P(-8, 3.4, 9.5), ease(u)), l: P(0, 2, 0), fov: lerp(40, 34, u) }));
// 1 — Vali roars, then Sugriva answers
shot(2.4, 3.45, (u, t, F) => { const h = hd(F.V, 3.0); const d = lerp(4.0, 2.8, ease(u)); const f = [-F.n[0], 0, -F.n[2]];
  return { p: add(add(h, f, d), F.perp, 1.0).map((v, i) => (i === 1 ? lerp(2.4, 3.1, u) : v)), l: h, fov: 30, roll: -0.02 }; });
shot(3.45, 4.4, (u, t, F) => { const h = hd(F.S, 2.8); const d = lerp(3.8, 2.6, ease(u)); const f = [F.n[0], 0, F.n[2]];
  return { p: add(add(h, f, d), F.perp, -1.0).map((v, i) => (i === 1 ? lerp(2.2, 2.8, u) : v)), l: h, fov: 30, roll: 0.025 }; });
// 2 — the clash
shot(4.4, 6.15, (u, t, F) => ({ p: orbit(F.M, lerp(8, 6, u), Math.atan2(F.perp[2], F.perp[0]) + lerp(-0.5, 0.7, u), 1.5), l: P(F.M[0], 2.3, F.M[2]), fov: 42 }));
// 3 — Sugriva's hook, Vali's uppercut
shot(6.15, 6.95, (u, t, F) => ({ p: add(F.M, F.perp, 7.0 - u * 1.2).map((v, i) => (i === 1 ? 2.4 : v)), l: P(F.M[0], 2.7, F.M[2]), fov: 36 }));
shot(6.95, 7.95, (u, t, F) => { const h = hd(F.S, 2.7); return { p: add(h, F.perp, -3.6 + u * 0.6).map((v, i) => (i === 1 ? 0.9 + u * 0.5 : v)), l: h, fov: lerp(34, 27, u), roll: -0.03 }; });
// 4 — the whiff and the counter
shot(7.95, 8.7, (u, t, F) => { const b = add(F.S.pos, F.n, -3.0); return { p: add(b, F.perp, 0.9).map((v, i) => (i === 1 ? 2.4 : v)), l: bodyPoint(F.V, 2.4), fov: 38 }; });
shot(8.7, 9.85, (u, t, F) => ({ p: add(F.M, F.perp, -5.4 + u * 0.4).map((v, i) => (i === 1 ? 1.5 : v)), l: P(F.M[0], 1.9, F.M[2]), fov: lerp(36, 31, u) }));
// 5 — Vali's combination
shot(9.85, 11.0, (u, t, F) => ({ p: add(F.M, F.perp, 6.2).map((v, i) => (i === 1 ? lerp(1.7, 2.7, u) : i === 0 ? v + lerp(-1.4, 1.4, u) * F.n[0] : v)), l: P(F.M[0], 2.5, F.M[2]), fov: 38 }));
shot(11.0, 11.95, (u, t, F) => ({ p: add(F.M, F.perp, -7.0 + u * 1.4).map((v, i) => (i === 1 ? lerp(1.3, 0.9, u) : v)), l: P(F.M[0], 2.2, F.M[2]), fov: lerp(38, 32, u) }));
shot(11.95, B.roundV1.t - 0.05, (u, t, F) => ({ p: add(F.V.pos, F.perp, 5.0).map((v, i) => (i === 1 ? 1.5 : v)), l: bodyPoint(F.V, 2.0), fov: 33, roll: 0.05 }));
shot(B.roundV1.t - 0.05, 13.1, (u, t, F) => { const h = hd(F.S, 2.7); return { p: add(h, F.perp, 3.4 - u * 0.5).map((v, i) => (i === 1 ? 2.3 : v)), l: h, fov: lerp(26, 20, u), roll: lerp(0.07, 0, u) }; });
shot(13.1, 13.7, (u, t, F) => ({ p: add(F.S.pos, F.perp, 2.0).map((v, i) => (i === 1 ? 7 : v)), l: P(F.S.pos[0], 0.4, F.S.pos[2]), fov: 40 }));
// 6 — Vali taunts, Sugriva rises
shot(13.7, 14.6, (u, t, F) => { const f = [-F.n[0], 0, -F.n[2]]; return { p: add(add(F.V.pos, f, 4.6 - u), F.perp, 0.8).map((v, i) => (i === 1 ? 0.8 : v)), l: hd(F.V, 3.1), fov: 38 }; });
shot(14.6, 15.9, (u, t, F) => ({ p: add(add(F.V.pos, F.n, 3.3), F.perp, 1.2 - u * 0.6).map((v, i) => (i === 1 ? 2.6 : v)), l: bodyPoint(F.S, 2.1), fov: 38 }));
// 7 — Sugriva's rally
shot(15.9, 17.0, (u, t, F) => ({ p: add(F.M, F.perp, 5.2 - u * 0.5).map((v, i) => (i === 1 ? 2.3 : v)), l: P(F.M[0], 2.4, F.M[2]), fov: lerp(34, 30, u) }));
shot(17.0, 17.95, (u, t, F) => ({ p: add(F.M, F.perp, -5.0 + u * 0.8).map((v, i) => (i === 1 ? 1.5 : v)), l: P(F.M[0], 2.2, F.M[2]), fov: lerp(36, 28, u), roll: -0.04 }));
shot(17.95, 19.3, (u, t, F) => ({ p: add(F.M, F.perp, 3.8).map((v, i) => (i === 1 ? 2.9 : v)), l: P(F.M[0], 2.8, F.M[2]), fov: lerp(30, 24, u) }));
// 8 — the mountain lift, slam and ground fight
shot(19.3, 21.0, (u, t, F) => ({ p: add(F.V.pos, F.perp, 5.8 - u).map((v, i) => (i === 1 ? lerp(0.5, 1.4, u) : v)), l: P(F.V.pos[0], lerp(2.2, 4.4, ease(u)), F.V.pos[2]), fov: lerp(46, 40, u) }));
shot(21.0, 21.5, (u, t, F) => ({ p: add(F.M, F.perp, 8).map((v, i) => (i === 1 ? 3.2 : v)), l: P(F.M[0], 3.0, F.M[2]), fov: 38 }));
shot(21.5, 22.8, (u, t, F) => ({ p: add(F.S.pos, F.perp, 3.4 - u * 0.5).map((v, i) => (i === 1 ? 0.6 + u * 0.4 : v)), l: P(F.S.pos[0], 0.6, F.S.pos[2]), fov: lerp(30, 36, u), roll: 0.05 }));
shot(22.8, 24.0, (u, t, F) => ({ p: orbit(F.S.pos, 5.0, Math.atan2(F.perp[2], F.perp[0]) + lerp(0, 0.9, u), lerp(7, 5, u)), l: P(F.S.pos[0], 0.6, F.S.pos[2]), fov: 36 }));
shot(24.0, 26.2, (u, t, F) => ({ p: orbit(F.S.pos, lerp(4.8, 4.0, u), Math.atan2(F.perp[2], F.perp[0]) + lerp(0.9, 3.0, u), lerp(2.0, 3.6, u)), l: P(F.S.pos[0] + F.n[0] * 0.2, 1.2, F.S.pos[2]), fov: 38 }));
shot(26.2, 27.0, (u, t, F) => ({ p: add(F.S.pos, F.perp, 4.2).map((v, i) => (i === 1 ? 1.2 : v)), l: bodyPoint(F.V, 1.5), fov: 34, roll: -0.04 }));
shot(27.0, 28.5, (u, t, F) => ({ p: add(F.V.pos, F.perp, 9.0).map((v, i) => (i === 1 ? 3.6 : v)), l: P(F.V.pos[0], 1.6, F.V.pos[2]), fov: 40 }));
shot(28.5, 30.0, (u, t, F) => { const f = [-F.n[0], 0, -F.n[2]]; return { p: add(add(F.V.pos, f, lerp(7.5, 4.5, ease(u))), F.perp, 1.2).map((v, i) => (i === 1 ? 0.8 : v)), l: hd(F.V, 2.9), fov: 36 }; });
// --- the turn to Rama ---
shot(30.0, 33.0, (u, t, F) => { const e = ease(u);
  const target = mix(hd(F.V, 2.9), [RAMA_POS[0], 2.4, RAMA_POS[2]], e);
  return { p: mix(P(5.5, 6.8, 6.5), P(-4.6, 3.6, 12.6), e), l: target, fov: lerp(42, 36, e) }; });
const rFrame = (t) => { const rs = ramaState(Math.max(t, 33)); const y = rs.yaw; return { rs, xl: [Math.cos(y), 0, -Math.sin(y)], zl: [Math.sin(y), 0, Math.cos(y)] }; };
shot(33.0, 35.7, (u, t) => { const { xl, zl } = rFrame(t); const o = RAMA_POS;
  return { p: add(add([o[0], 3.0, o[2]], zl, lerp(4.2, 3.2, u)), xl, -0.5), l: add([o[0], 2.75, o[2]], xl, 0.9), fov: lerp(36, 28, u) }; });
shot(RELEASE_T, ARROW_HIT_T, (u, t) => { const a = arrowState(t + 0.0001) || arrowState(RELEASE_T + 0.001); const d = a.dir; const side = [-d[2], 0, d[0]];
  const p = add(add(a.pos, d, -2.6 + u * 0.4), side, lerp(0.7, 0.2, u)); p[1] += lerp(0.7, 0.2, u);
  return { p, l: add(a.pos, d, 4.0), fov: lerp(46, 38, u) }; });
shot(ARROW_HIT_T, 41.6, (u, t, F) => { const h = heartPoint(ARROW_HIT_T); const rs = ramaState(RELEASE_T); const dir = [Math.cos(-rs.aimYaw), 0, Math.sin(-rs.aimYaw)];
  const p = add(add(h, dir, -(2.8 - u * 0.5)), F.perp, 0.9 - u * 0.5); p[1] = h[1] + 0.1;
  return { p, l: add(h, dir, 0), fov: lerp(24, 30, u) }; });
shot(41.6, 44.0, (u, t, F) => ({ p: orbit(F.V.pos, 6.2, lerp(2.3, 4.2, u), lerp(1.8, 3.4, u)), l: P(F.V.pos[0], 1.4, F.V.pos[2]), fov: 38 }));
shot(44.0, DURATION + 1, (u, t) => { const e = ease(clamp((t - 44) / 4)); return { p: mix(P(-3.5, 3.5, 11), P(-5, 12, 19), e), l: mix(P(0, 1.5, 2), P(0, 1.2, 2.5), e), fov: lerp(38, 42, e) }; });

// Over-the-shoulder scope camera used while the player aims.
export function aimCamera(t) {
  const rs = ramaState(t); const y = rs.yaw; const xl = [Math.cos(y), 0, -Math.sin(y)], zl = [Math.sin(y), 0, Math.cos(y)];
  const o = RAMA_POS, h = G.heart;
  const p = add(add([o[0], 3.3, o[2]], xl, -1.15), zl, 0.55);
  const l = [lerp(h[0], G.aimPoint[0], 0.3), lerp(h[1], G.aimPoint[1], 0.3), lerp(h[2], G.aimPoint[2], 0.3)];
  return { p, l, fov: lerp(26, 15, clamp(G.drawn)) };
}

// ---- cinematic time-scale: slow-motion bells around the biggest impacts ----
const SLOW = [
  { c: B.roundV1.t, w: 0.3, min: 0.22 }, { c: B.flyS1.t, w: 0.16, min: 0.5 }, { c: B.slam.t, w: 0.34, min: 0.28 },
  { c: B.kickUp.t, w: 0.22, min: 0.35 }, { c: B.crossV1.t, w: 0.1, min: 0.55 }, { c: ARROW_HIT_T, w: 0.36, min: 0.35 },
];
export function timeScale(t) {
  let s = 1;
  for (const b of SLOW) { const x = (t - b.c) / b.w; if (Math.abs(x) < 3.5) s = Math.min(s, 1 - (1 - b.min) * Math.exp(-x * x)); }
  return s;
}

const SHAKE_DECAY = 3.2;
export function cameraAt(t) {
  const F = duelFrame(Math.min(t, DURATION));
  let s = SH[SH.length - 1];
  for (const sh of SH) if (t >= sh[0] && t < sh[1]) { s = sh; break; }
  const u = clamp((t - s[0]) / (s[1] - s[0]));
  let r = s[2](u, t, F);
  if (G.blend > 0) { const A = aimCamera(Math.min(t, 35.6)); const k = smooth(G.blend); r = { p: mix(r.p, A.p, k), l: mix(r.l, A.l, k), fov: lerp(r.fov, A.fov, k), roll: 0 }; }
  // handheld drift + impact trauma
  let trauma = 0;
  for (const e of EVENTS) { const dt = t - e.t; if (dt >= 0 && dt < 1.6 && e.k !== "whiff") trauma += e.v * Math.exp(-dt * SHAKE_DECAY) * (e.k === "roar" ? 0.35 : e.k === "block" ? 0.4 : 1); }
  trauma = Math.min(trauma, 2.5);
  const k = 0.012 + trauma * 0.075, n = (a, b) => Math.sin(t * a) * Math.cos(t * b);
  const jit = [n(17.3, 9.1) * k, n(21.7, 13.3) * k, n(19.1, 7.7) * k];
  const p = [r.p[0] + jit[0] * 3, Math.max(0.25, r.p[1] + jit[1] * 3), r.p[2] + jit[2] * 3];
  const l = [r.l[0] + jit[2] * 0.8, r.l[1] + jit[0] * 0.8, r.l[2] + jit[1] * 0.8];
  const kick = Math.max(0, ...EVENTS.map((e) => (e.k === "hit" || e.k === "heavy" || e.k === "slam" || e.k === "arrow") && t >= e.t && t - e.t < 0.25 ? e.v * (1 - (t - e.t) / 0.25) : 0));
  return { p, l, fov: r.fov - Math.min(kick * 2.2, 5) + trauma * 0.4, roll: (r.roll || 0) + jit[1] * 0.25, trauma };
}
export const CHAPTERS = [
  [0, "THE CHALLENGE"], [4.4, "THE CLASH"], [8.0, "THE SLIP AND THE COUNTER"], [9.85, "THE KING'S COMBINATION"], [12.2, "THE KICK OF THUNDER"], [15.0, "SUGRIVA RALLIES"],
  [19.3, "THE MOUNTAIN LIFTED"], [23.0, "BLOOD ON THE EARTH"], [28.5, "THE KING RISES"], [30.0, "THE WATCHER IN THE BUSHES"], [36.0, "THE ARROW OF DHARMA"], [RELEASE_T, "RELEASE"], [ARROW_HIT_T, "THE FALL OF VALI"], [44, "DHARMA"],
];
export const SUBS = [
  [0.6, 3.6, "Two brothers. One kingdom. A grudge older than the mountain."],
  [4.4, 8.0, "Vali — the golden king, blessed with half the strength of any foe he faces."],
  [8.6, 12.0, "Sugriva fights for his life, his wife, his throne."],
  [12.4, 15.4, "A single kick — and the earth shudders."],
  [15.6, 19.0, "But Sugriva will not yield."],
  [19.4, 22.0, "Lifted like a mountain… and hurled to the ground."],
  [23.6, 26.4, "Vali pounds his brother into the dust."],
  [28.6, 32.0, "Sugriva is beaten. And Vali roars his triumph."],
  [32.2, 36.0, "From the thicket, Rama watches — the garland marks his friend."],
  [36.2, 38.8, "Dharma demands a hard choice."],
  [40.2, 44.0, "The arrow of Rama pierces the heart of Vali."],
];

// health bars follow the damage carried by the fight events
const DMG = { V: [], S: [] };
for (const e of EVENTS) if (e.dmg > 0 && (e.w === "V" || e.w === "S")) DMG[e.w].push([e.t, e.dmg]);
const lost = (w, t) => DMG[w].reduce((s, [te, d]) => (t >= te ? s + d : s), 0);
export const HP = (t) => {
  const v = 1 - lost("V", t);
  return { V: t < ARROW_HIT_T ? v : Math.max(0, v - (t - ARROW_HIT_T) * 0.5), S: Math.max(0.05, 1 - lost("S", t)) };
};
// seconds since the given fighter last took damage (drives the HUD hurt-flash)
export const sinceHit = (t, w) => { let s = 99; for (const [te] of DMG[w]) if (t >= te) s = Math.min(s, t - te); return s; };
