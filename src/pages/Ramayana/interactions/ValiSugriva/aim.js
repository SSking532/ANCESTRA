// Interactive aim-and-shoot logic (runs from the main rAF loop).
import { G, AIM_T, DRAW0, fighterTime } from "./gameState.js";
import { heartPoint, RELEASE_T } from "./fight.js";

export const hitRadius = () => (G.assist ? 1.05 : 0.62);

export function enterAim(clock) {
  clock.t = AIM_T; G.mode = "aim"; G.drawn = DRAW0; G.aimClock = 0; G.sinceRelease = -1; G.holding = false; G.flight = null;
  G.msg = "AIM AT VALI'S HEART"; G.msgT = 4;
}
export function tickAim(dt, clock, sfx) {
  G.aimClock += dt; G.msgT = Math.max(0, G.msgT - dt);
  if (G.sinceRelease >= 0) G.sinceRelease += dt;
  G.blend = Math.min(1, G.blend + dt / 0.9);
  G.heart = heartPoint(fighterTime(clock.t));
  if (G.mode === "aim") {
    if (G.holding) G.drawn = Math.min(1, G.drawn + dt / 1.5); else G.drawn += (DRAW0 - G.drawn) * Math.min(1, dt * 5);
    const full = G.holding && G.drawn >= 0.98;
    G.fullT = full ? (G.fullT || 0) + dt : 0;
    G.sway = (G.assist ? 0.12 : 0.22) + Math.min(G.fullT, 3) * (G.assist ? 0.03 : 0.1);   // arm tires while holding
  } else if (G.mode === "miss") {
    G.drawn += (DRAW0 - G.drawn) * Math.min(1, dt * 8);
    if (G.flight) { G.flight.t += dt; if (G.flight.t > 1.5) { G.flight = null; G.mode = "aim"; G.sinceRelease = -1; G.drawn = DRAW0; G.fullT = 0;
      if (G.misses >= 3 && !G.assist) { G.assist = true; G.msg = "AIM ASSIST ENABLED — STEADY NOW"; } else G.msg = "AIM AT VALI'S HEART"; G.msgT = 3.5; } }
  }
}
export function startDraw() { if (G.mode === "aim") G.holding = true; }
export function release(clock, sfx) {
  if (G.mode !== "aim" || !G.holding) return;
  G.holding = false;
  if (G.drawn < 0.9) { G.msg = "DRAW FULLY BEFORE YOU RELEASE"; G.msgT = 2.5; return; }
  const d = Math.hypot(G.aimPoint[0] - G.heart[0], G.aimPoint[1] - G.heart[1], G.aimPoint[2] - G.heart[2]);
  if (d <= hitRadius()) {
    G.shotTarget = [0, 1, 2].map((i) => G.aimPoint[i] * 0.5 + G.heart[i] * 0.5);
    G.drawn = 1; G.done = true; G.mode = "cine"; G.blend = 0; G.sinceRelease = 0; G.msg = "";
    clock.t = RELEASE_T - 0.01;
  } else {
    G.misses += 1; G.mode = "miss"; G.sinceRelease = 0;
    const a = G.nock.slice(), b = G.aimPoint.slice(); const dir = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const l = Math.hypot(...dir) || 1; dir.forEach((_, i) => (dir[i] /= l));
    G.flight = { t: 0, from: a, to: [b[0] + dir[0] * 22, Math.max(0.2, b[1] + dir[1] * 22), b[2] + dir[2] * 22], dir };
    G.msg = d < 1.6 ? "SO CLOSE — ADJUST YOUR AIM" : "MISSED — STEADY YOUR BREATH"; G.msgT = 3;
    sfx("release"); sfx("whistle");
  }
}
