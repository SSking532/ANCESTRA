// Shared mutable state for the interactive aim-and-shoot phase.
export const AIM_T = 35.6;      // cinematic time at which the player takes over
export const AIM_LOOP_T0 = 36.4; // Vali's chest-beating loop (36.4 -> 38.0) is replayed while aiming
export const AIM_LOOP_LEN = 1.6;
export const DRAW0 = 0.3;       // draw amount when aiming begins

export const G = {
  mode: "cine",        // "cine" | "aim" | "miss"
  drawn: DRAW0, holding: false, aimClock: 0, blend: 0,
  ptr: { x: 0, y: 0 }, aimPoint: [0, 0, 0], heart: [0, 0, 0], reticle: { x: 0, y: 0, on: false, d: 9 },
  sinceRelease: -1, shotTarget: null, flight: null, nock: [0, 3, 0],
  misses: 0, assist: false, msg: "", msgT: 0, done: false, sway: 0,
};
export function resetGame() {
  Object.assign(G, { mode: "cine", drawn: DRAW0, holding: false, aimClock: 0, blend: 0, ptr: { x: 0, y: 0 }, sinceRelease: -1, shotTarget: null, flight: null, misses: 0, assist: false, msg: "", msgT: 0, done: false, sway: 0 });
}
// time used to pose Vali/Sugriva: real clock normally, a seamless loop while aiming
export const fighterTime = (t) => (G.mode === "cine" ? t : AIM_LOOP_T0 + (G.aimClock % AIM_LOOP_LEN));
