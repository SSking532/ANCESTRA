import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { ArrowRight, Crown, Feather, Pause, Play, RotateCcw, Volume2, VolumeX, Zap } from "lucide-react";
import "./JatayuLastFlightGame.css";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));

const TOTAL = 100; // seconds before Ravana ends it
const CLAW_T = 0.45;
const BEAK_T = 0.55;
const WIND = 1.1; // ranged wind-up
const SWING_T = 0.5; // sword swing length
const DIVINE = 20; // chariot % at which Ravana draws Chandrahasa
const FIN_END = 10.6; // finale length (in finale seconds)
const SUMMON_T = 0.7; // blade begins to form
const DASH_T = 3.4; // Jatayu charges in
const STRIKE_T = 4.45; // sword swing begins
const NEAR_D = 12.5; // sword reach
const CH_K = 0.6; // scales every hit on Ravana's chariot (lower = longer fight)
const OP_END = 7.6; // opening aerial shot length (seconds)
const sm = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };

/* world layout */
const TP = 300; // terrain tile length (periodic in z)
const TW = 520; // terrain tile width
const GY = -13; // base ground height
const WL = -15.7; // river water level
const FOG = "#eb9a5c";
const SUN_DIR = new THREE.Vector3(-34, 12, -170).normalize();

const LABEL = {
  arrow: "ARROWS INCOMING · DODGE OR SWAT WITH J",
  volley: "ARROW STORM · SWAT WITH J",
  fire: "FIREBALL · SWAT IT WITH J",
  waveH: "SWORD WAVE · SLIP ABOVE OR BELOW IT",
  waveV: "SWORD WAVE · SIDESTEP IT",
  slash: "CHANDRAHASA STRIKE · PARRY WITH J OR SIDESTEP",
};
const COACH = [
  ["FLY", "Use W A S D or the arrow keys to glide through the sky"],
  ["BOOST", "Hold SHIFT to close in on Ravana's chariot"],
  ["CLAWS", "When the ring turns gold, press J or click to rake the Pushpaka"],
  ["BEAK", "Now press SPACE for a heavy beak strike"],
];
const HOW = [
  [["W", "A", "S", "D"], "FLY", "Move up, left, down and right. The arrow keys work too."],
  [["SHIFT"], "BOOST", "Hold to close in on Ravana's chariot. Let go and he drifts away."],
  [["J", "CLICK"], "CLAWS", "Swat arrows and fireballs. Rake the chariot when the ring turns gold. Press it just as his sword lands to PARRY."],
  [["SPACE"], "BEAK", "A heavy lunge. Fill COURAGE, then your next beak is a Garuda Strike."],
  [["ESC"], "PAUSE", "Pause the flight at any time."],
];
const OPENING = {
  chariot: "The Pushpaka shudders, and Ravana's rage breaks loose.",
  fall: "Jatayu falters, and Ravana senses the end.",
  time: "Jatayu has held the sky for an age. Ravana's patience is gone.",
};

function seeded(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeState() {
  return {
    state: "idle", paused: false, t: 0, t0: 0, op: 0, camInit: false, dist: 0, x: 0, y: 0, vx: 0, vy: 0, D: 17, boost: 0,
    hp: 100, courage: 0, ch: 100, keys: {}, clawT: 0, clawCd: 0, beakT: 0, beakCd: 0, beakDone: true,
    hurt: 0, shake: 0, flash: 0, fade: 0,
    windup: 0, windDur: WIND, windType: "arrow", nextAtk: 7, swing: 0, swingHit: true, stagger: 0,
    coach: 0, boosted: false, screechAt: 5, phase: 1, px: 0, py: 0,
    orbitAt: 12, orbitStart: -99, orbitDir: 1, hudT: 0,
    fin: 0, finReason: "", fb: {}, wingCut: false, cutF: 0, cutPos: new THREE.Vector3(), fvy: 0, spin: 0, endAt: 0,
    stats: { deflects: 0, claws: 0, beaks: 0, hits: 0, parries: 0 },
    proj: Array.from({ length: 18 }, () => ({ on: false, type: "arrow", orient: "h", hit: false, pos: new THREE.Vector3(), vel: new THREE.Vector3() })),
    bursts: Array.from({ length: 14 }, () => ({ life: 0, pos: new THREE.Vector3(), color: "#ffd98a" })), bi: 0,
  };
}

function useSound(muted) {
  const ctx = useRef(null);
  return useCallback((kind) => {
    if (muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const a = ctx.current || (ctx.current = new AC());
      if (a.state === "suspended") a.resume();
      if (kind === "screech" || kind === "cry") {
        const big = kind === "screech", n0 = a.currentTime, d = big ? 1.5 : 0.7, f0 = big ? 1500 : 1900;
        const o1 = a.createOscillator(), o2 = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain();
        const fl = a.createBiquadFilter(), gn = a.createGain();
        o1.type = "sawtooth"; o2.type = "square";
        [o1, o2].forEach((o, i) => {
          const f = f0 * (i ? 1.5 : 1);
          o.frequency.setValueAtTime(f, n0);
          o.frequency.exponentialRampToValueAtTime(f * (big ? 1.7 : 0.6), n0 + d * 0.35);
          o.frequency.exponentialRampToValueAtTime(f * 0.55, n0 + d);
        });
        lfo.frequency.value = 38; lg.gain.value = 120; lfo.connect(lg); lg.connect(o1.frequency);
        fl.type = "bandpass"; fl.frequency.value = 2400; fl.Q.value = 2.2;
        gn.gain.setValueAtTime(0.0001, n0);
        gn.gain.exponentialRampToValueAtTime(big ? 0.07 : 0.05, n0 + 0.08);
        gn.gain.exponentialRampToValueAtTime(0.0001, n0 + d);
        o1.connect(fl); o2.connect(fl); fl.connect(gn); gn.connect(a.destination);
        [o1, o2, lfo].forEach((o) => { o.start(n0); o.stop(n0 + d + 0.05); });
        return;
      }
      const P = {
        bell: [440, 880, 0.4, "triangle", 0.05], claw: [900, 200, 0.2, "sawtooth", 0.05],
        beak: [300, 80, 0.3, "square", 0.06], hit: [140, 45, 0.35, "sawtooth", 0.07],
        swat: [700, 1200, 0.15, "triangle", 0.06], shoot: [500, 160, 0.35, "triangle", 0.03],
        fire: [120, 60, 0.6, "sawtooth", 0.04], end: [200, 90, 1.2, "sine", 0.08],
        slash: [1400, 160, 0.32, "sawtooth", 0.06], wave: [900, 260, 0.45, "triangle", 0.05],
        clang: [2400, 500, 0.5, "square", 0.05], divine: [110, 880, 1.6, "sawtooth", 0.05],
      }[kind] || [440, 440, 0.1, "sine", 0.03];
      const o = a.createOscillator(), g = a.createGain(), n = a.currentTime;
      o.type = P[3];
      o.frequency.setValueAtTime(P[0], n);
      o.frequency.exponentialRampToValueAtTime(P[1], n + P[2]);
      g.gain.setValueAtTime(P[4], n);
      g.gain.exponentialRampToValueAtTime(0.0001, n + P[2]);
      o.connect(g); g.connect(a.destination);
      o.start(n); o.stop(n + P[2] + 0.05);
    } catch { /* audio optional */ }
  }, [muted]);
}

/* ---------------- GAME LOGIC ---------------- */

function addBurst(g, pos, color = "#ffd98a") {
  const b = g.bursts[g.bi++ % g.bursts.length];
  b.life = 0.6; b.pos.copy(pos); b.color = color;
}

function spawn(g, type, from, to, T, orient = "h") {
  const p = g.proj.find((q) => !q.on);
  if (!p) return;
  p.on = true; p.hit = false; p.type = type; p.orient = orient;
  p.pos.copy(from);
  p.vel.copy(to).sub(from).divideScalar(T);
}

function fireShots(g, cb) {
  const type = g.windType;
  cb.alert(null);
  if (type === "waveH" || type === "waveV") {
    const from = new THREE.Vector3(g.px + 1.2, g.py + 3.2, -g.D + 5);
    const to = new THREE.Vector3(g.x + g.vx * 0.35, g.y + g.vy * 0.35, 0);
    spawn(g, "wave", from, to, clamp((g.D - 5) / 7, 1.0, 1.8), type === "waveV" ? "v" : "h");
    cb.sfx("wave");
    return;
  }
  const from = new THREE.Vector3(g.px - 0.4, g.py + 3.0, -g.D + 5.3);
  const aim = new THREE.Vector3(g.x + g.vx * 0.4, g.y, 0);
  const T = clamp((g.D - 5) / 6.5, 0.9, 2.2);
  const shots = type === "arrow" ? 3 : type === "volley" ? 5 : 1;
  for (let i = 0; i < shots; i++) {
    const s = i - (shots - 1) / 2;
    const to = aim.clone().add(new THREE.Vector3(s * 1.9, (i % 2 ? 1 : -1) * 0.7 * (shots > 1), 0));
    spawn(g, type === "fire" ? "fire" : "arrow", from, to, type === "fire" ? T * 1.25 : T);
  }
  cb.sfx(type === "fire" ? "fire" : "shoot");
}

function assist(g, k) {
  g.x = clamp(g.x + (g.px - g.x) * k, -8, 8);
  g.y = clamp(g.y + (g.py - g.y) * k, -4.2, 4.6);
}

export function doClaw(g, cb) {
  if (g.state !== "play" || g.paused || g.clawCd > 0) return;
  g.clawT = CLAW_T; g.clawCd = 0.62; g.stats.claws++;
  cb.sfx("claw"); if (Math.random() < 0.4) cb.sfx("cry");
  if (g.D < 17) assist(g, 0.55);
  if (g.D < 17 && Math.hypot(g.px - g.x, g.py - g.y) < 8) {
    g.ch -= (g.stagger > 0 ? 12 : 8) * CH_K; g.courage = clamp(g.courage + 10, 0, 100);
    addBurst(g, new THREE.Vector3(g.px, g.py + 1, -g.D + 2), "#fff0b8");
    cb.msg("Claws rake the Pushpaka!");
  }
}

export function doBeak(g, cb) {
  if (g.state !== "play" || g.paused || g.beakCd > 0) return;
  g.beakT = BEAK_T; g.beakCd = 1.3; g.beakDone = false; g.stats.beaks++;
  if (g.D < 18) assist(g, 0.6);
  cb.sfx("beak"); cb.sfx("cry");
}

function pickAttack(g, cb) {
  const near = g.D < NEAR_D && Math.hypot(g.px - g.x, g.py - g.y) < 9;
  let type;
  if (near && Math.random() < 0.7) type = "slash";
  else {
    const pool = g.phase === 1 ? ["arrow", "fire", "waveH"]
      : g.phase === 2 ? ["arrow", "fire", "volley", "waveH", "waveV"]
      : ["fire", "volley", "waveH", "waveV", "arrow", "waveV"];
    type = pool[Math.floor(Math.random() * pool.length)];
  }
  g.windType = type;
  g.windDur = type === "slash" ? 0.95 : WIND;
  g.windup = g.windDur;
  g.nextAtk = g.t + [3.4, 2.8, 2.3][g.phase - 1] + g.windDur;
  cb.alert(LABEL[type]);
  if (type === "slash") cb.sfx("bell");
}

function execAttack(g, cb) {
  const type = g.windType;
  cb.alert(null);
  if (type === "slash") { g.swing = SWING_T; g.swingHit = false; cb.sfx("slash"); }
  else if (type.startsWith("wave")) { g.swing = SWING_T; g.swingHit = true; fireShots(g, cb); }
  else fireShots(g, cb);
}

function startFinale(g, cb, reason) {
  g.state = "finale"; g.finReason = reason; g.fin = 0; g.fb = {};
  g.windup = 0; g.swing = 0; g.stagger = 0; g.keys = {}; g.paused = false;
  g.proj.forEach((p) => (p.on = false));
  cb.alert(null); cb.msg(""); cb.finale(reason);
}

function step(g, dt, cb) {
  g.t += dt;
  const k = g.keys;
  const ix = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
  const iy = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
  g.vx = damp(g.vx, ix * 8, 6, dt); g.vy = damp(g.vy, iy * 6, 6, dt);
  g.x = clamp(g.x + g.vx * dt, -8, 8); g.y = clamp(g.y + g.vy * dt, -4.2, 4.6);
  const boosting = k.ShiftLeft || k.ShiftRight;
  g.boost = damp(g.boost, boosting ? 1 : 0, 5, dt);
  const drift = [0.9, 1.2, 1.5][g.phase - 1];
  if (boosting) g.boosted = true;
  g.D = clamp(g.D + (boosting ? -13 : drift) * dt - (g.beakT > 0 ? 12 * dt : 0), 8.5, 18);
  g.clawT = Math.max(0, g.clawT - dt); g.clawCd = Math.max(0, g.clawCd - dt);
  g.beakT = Math.max(0, g.beakT - dt); g.beakCd = Math.max(0, g.beakCd - dt);
  g.hurt = Math.max(0, g.hurt - dt * 2.2); g.shake = Math.max(0, g.shake - dt * 2.4);
  g.flash = Math.max(0, g.flash - dt * 2);
  g.phase = g.ch > 62 ? 1 : g.ch > 40 ? 2 : 3;

  // beak strike resolves near the end of the lunge
  if (!g.beakDone && g.beakT < 0.3) {
    g.beakDone = true;
    if (g.D < 15 && Math.hypot(g.px - g.x, g.py - g.y) < 7) {
      const big = g.courage >= 100, mult = g.stagger > 0 ? 1.4 : 1;
      g.ch -= (big ? 40 : 20) * mult * CH_K; if (big) g.courage = 0; else g.courage = clamp(g.courage + 18, 0, 100);
      g.shake = 0.7;
      addBurst(g, new THREE.Vector3(g.px, g.py + 1, -g.D + 2.5), big ? "#ffb04a" : "#fff0b8");
      cb.msg(big ? "GARUDA STRIKE!" : "The beak strikes true!");
      cb.sfx("hit");
      if (big && g.windup > 0) { g.windup = 0; g.stagger = 2.2; g.nextAtk = g.t + 3.2; cb.alert(null); }
      else if (g.windup > 0 && g.windType === "slash") { g.windup = 0; g.stagger = 1.4; g.nextAtk = g.t + 2.4; cb.alert(null); cb.msg("His strike is broken!"); }
    } else cb.msg("Too far, close the distance (Shift)");
  }

  if (g.t >= g.screechAt) { g.screechAt = g.t + 7 + Math.random() * 6; cb.sfx("screech"); }
  if (g.coach < 4) {
    const c = g.coach;
    const done = c === 0 ? Math.abs(g.x) > 2.5 || Math.abs(g.y) > 1.8 : c === 1 ? g.boosted && g.D < 13 : c === 2 ? g.stats.claws > 0 : g.stats.beaks > 0;
    if (done || g.t - g.t0 > 70) {
      g.coach = c + 1; cb.coach(g.coach);
      if (g.coach === 4) cb.msg("Ravana fights back! Dodge, swat, parry");
    }
  }

  // Ravana's offence
  if (g.stagger > 0) {
    g.stagger -= dt;
  } else if (g.windup > 0) {
    g.windup -= dt;
    if (g.windup <= 0) execAttack(g, cb);
  } else if (g.t >= g.nextAtk) {
    pickAttack(g, cb);
  }

  // sword resolution: parry, hit or whiff
  if (g.swing > 0) {
    g.swing -= dt;
    if (!g.swingHit && g.swing < SWING_T * 0.45) {
      g.swingHit = true;
      const near = g.D < NEAR_D + 2 && Math.hypot(g.px - g.x, g.py - g.y) < 7;
      if (!near) {
        g.courage = clamp(g.courage + 6, 0, 100); cb.msg("You slipped the blade!");
      } else if (g.clawT > 0) {
        g.stagger = 2.4; g.nextAtk = g.t + 3.6; g.ch -= 6 * CH_K; g.courage = clamp(g.courage + 25, 0, 100);
        g.stats.parries++; g.shake = 0.8; g.flash = 0.35;
        addBurst(g, new THREE.Vector3(g.x, g.y + 0.6, -3), "#ffffff");
        cb.sfx("clang"); cb.msg("PARRIED! Ravana reels");
      } else {
        g.hp -= 14; g.hurt = 1; g.shake = 1.3; g.stats.hits++;
        g.D = 18; g.vx = (g.x >= g.px ? 1 : -1) * 10;
        addBurst(g, new THREE.Vector3(g.x, g.y, -1), "#ffcf7a");
        cb.sfx("hit"); cb.msg("Chandrahasa cuts deep!");
      }
    }
  }

  for (const p of g.proj) {
    if (!p.on) continue;
    p.pos.addScaledVector(p.vel, dt);
    const dx = Math.abs(p.pos.x - g.x), dy = Math.abs(p.pos.y - g.y), d = Math.hypot(dx, dy);
    const wave = p.type === "wave";
    if (!wave && g.clawT > 0.1 && p.pos.z > -12 && p.pos.z < 2 && d < 5.6) {
      p.on = false; g.stats.deflects++;
      g.courage = clamp(g.courage + (p.type === "fire" ? 14 : 8), 0, 100);
      addBurst(g, p.pos, "#fff0b8"); cb.sfx("swat"); cb.msg(p.type === "fire" ? "Fireball swatted away!" : "Arrow struck down!");
      continue;
    }
    if (p.pos.z > -1 && !p.hit) {
      p.hit = true;
      const hitIt = wave ? (p.orient === "h" ? dx < 2.9 && dy < 1.5 : dx < 1.5 && dy < 2.9) : d < 1.6;
      if (hitIt) {
        p.on = false; g.hp -= wave ? 10 : p.type === "fire" ? 9 : 5; g.hurt = 1; g.shake = wave ? 1.2 : 1; g.stats.hits++;
        addBurst(g, p.pos, wave ? "#fff0b8" : p.type === "fire" ? "#ff6a2a" : "#ffcf7a"); cb.sfx("hit");
      } else if (wave) { g.courage = clamp(g.courage + 5, 0, 100); cb.msg("Sword wave dodged!"); }
    }
    if (p.pos.z > 7) p.on = false;
  }

  g.hudT -= dt;
  if (g.hudT <= 0) {
    g.hudT = 0.1;
    cb.hud({ hp: Math.max(0, g.hp), ch: Math.max(0, g.ch), courage: g.courage, time: g.t - g.t0, phase: g.phase, D: g.D, spd: Math.round((14 + g.boost * 12) * 9) });
  }
  const reason = g.ch <= DIVINE ? "chariot" : g.hp <= 0 ? "fall" : g.t - g.t0 >= TOTAL ? "time" : "";
  if (reason) startFinale(g, cb, reason);
}

/* The opening: an aerial shot from the front. Jatayu bursts up out of the forest canopy to chase the Pushpaka. */
function openingStep(g, dt, cb) {
  g.t += dt; g.op += dt;
  const o = g.op, fb = g.fb, yPrev = g.y;
  g.shake = Math.max(0, g.shake - dt * 1.5); g.flash = Math.max(0, g.flash - dt * 2); g.hurt = 0;
  g.x = 0; g.vx = 0;
  g.y = -10.2 + 10.2 * sm(0.6, 3.8, o);
  g.vy = clamp((g.y - yPrev) / Math.max(dt, 0.001), 0, 6);
  g.boost = damp(g.boost, 0.4 * sm(0.8, 2.6, o) * (1 - sm(5.6, OP_END, o)), 4, dt);
  g.D = 18 + 52 * (1 - sm(2.6, 6.8, o));
  g.fade = 1 - sm(0, 1.3, o);
  if (!fb.a && o > 0.15 && o < 1.4) { fb.a = 1; cb.sub("Over the Dandaka forest, Sita's cries tear the evening sky."); }
  if (!fb.b && o > 1.5 && o < 2.9) { fb.b = 1; cb.sub("Jatayu hears her, and rises from the trees."); cb.sfx("screech"); g.shake = 0.8; }
  if (!fb.c && o > 4.4 && o < 5.8) { fb.c = 1; cb.sub("The Pushpaka races on with Sita. Jatayu gives chase."); cb.sfx("cry"); }
  if (o >= OP_END) {
    g.state = "play"; g.t0 = g.t; g.nextAtk = g.t + 7; g.screechAt = g.t + 5; g.orbitAt = g.t + 12; g.orbitStart = -99;
    g.fb = {}; g.fade = 0; g.D = 18; g.y = 0; g.vy = 0; g.boost = 0;
    cb.sub(""); cb.opened();
  }
}

/* The finale: Ravana summons Chandrahasa, Jatayu charges, the wing is cut, Jatayu drops from the sky */
function finaleStep(g, dt, cb) {
  const slow = g.fin < 0.5 ? 0.4 : g.fin > STRIKE_T - 0.15 && g.fin < STRIKE_T + 0.6 ? 0.3 : g.wingCut && g.fin - g.cutF < 1.0 ? 0.4 : 1;
  const d = dt * slow;
  g.t += d; g.fin += d;
  const f = g.fin, fb = g.fb;
  g.hurt = Math.max(0, g.hurt - dt * 2); g.shake = Math.max(0, g.shake - dt * 1.6); g.flash = Math.max(0, g.flash - dt * 1.8);
  g.vx = 0; g.vy = 0;

  if (!g.wingCut) {
    const dash = f >= DASH_T;
    g.boost = damp(g.boost, dash ? 1 : 0.15, 4, dt);
    if (!dash) { // hold back and watch Ravana
      g.D = damp(g.D, 13, 1.5, dt);
      g.x = damp(g.x, g.px - 1.0, 1.4, dt); g.y = damp(g.y, g.py + 1.2, 1.4, dt);
    } else { // charge
      g.D = damp(g.D, 9, 3.2, dt);
      g.x = damp(g.x, g.px + 0.2, 3.4, dt); g.y = damp(g.y, g.py + 2.2, 3.4, dt);
    }
  } else {
    g.boost = damp(g.boost, 0.2, 3, dt);
    g.D = damp(g.D, 34, 0.9, dt);
    g.fvy = Math.max(-12, g.fvy - 8 * d);
    g.y = Math.max(-14, g.y + g.fvy * d); g.x += 0.9 * d;
    g.spin += d * (2 + (f - g.cutF) * 1.6);
  }

  if (!fb.a && f > 0.1) { fb.a = 1; cb.sub(OPENING[g.finReason]); cb.sfx("bell"); }
  if (!fb.b && f > 1.5) { fb.b = 1; cb.sub("Ravana draws Chandrahasa, the blade Shiva gave him."); cb.sfx("divine"); }
  if (!fb.c && f > 2.5) { fb.c = 1; cb.banner(true); cb.sfx("screech"); }
  if (!fb.g && f > DASH_T + 0.05) { fb.g = 1; cb.sub("Jatayu will not yield. He surges at the king of Lanka."); cb.sfx("cry"); }
  if (!fb.f && f > STRIKE_T - 0.2) { fb.f = 1; cb.banner(false); }
  if (!fb.s && f > STRIKE_T) { fb.s = 1; cb.sfx("slash"); }
  if (!fb.d && f >= STRIKE_T + 0.22) {
    fb.d = 1; g.wingCut = true; g.cutF = f; g.cutPos.set(g.x + 0.95, g.y + 0.38, 0);
    g.fvy = 3; g.flash = 1; g.shake = 2.4;
    for (let i = 0; i < 6; i++) addBurst(g, new THREE.Vector3(g.x + 1 + i * 0.6, g.y + 0.4 + (i % 2) * 0.7, -0.4), i % 2 ? "#fff0b8" : "#ff9a3a");
    cb.sfx("clang"); cb.sfx("hit"); cb.sfx("cry");
    cb.sub("One stroke. Jatayu's wing is severed.");
  }
  if (!fb.e && g.wingCut && f > g.cutF + 1.4) { fb.e = 1; cb.sub("The king of vultures falls, but he will live to tell Rama."); }
  g.fade = clamp((f - (FIN_END - 1.1)) / 1.0, 0, 1);
  if (f >= FIN_END) { g.state = "end"; g.endAt = g.t; g.fade = 1; cb.sub(""); cb.end(g.finReason); }
}

/* ---------------- SHARED ASSETS ---------------- */

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const SPH = new THREE.SphereGeometry(1, 20, 14);
const CONE = new THREE.ConeGeometry(1, 1, 10);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 14);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const TOR = new THREE.TorusGeometry(1, 0.12, 8, 28);
const ICO = new THREE.IcosahedronGeometry(1, 1);
// square pyramid with axis-aligned base of side 1 (pagoda roof)
const ROOF = (() => { const g = new THREE.ConeGeometry(0.7071, 1, 4); g.rotateY(Math.PI / 4); return g; })();

/* Feather: a gently cambered, drooping blade. Length runs along +Z, width along X.
   The silhouette, barbs, shaft and split vanes all come from a procedural alpha texture. */
const FEATHER = (() => {
  const g = new THREE.PlaneGeometry(1, 1, 4, 14);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), v = p.getY(i) + 0.5;
    p.setXYZ(i, x, -Math.abs(x) * 0.2 - v * v * 0.14, v);
  }
  g.computeVertexNormals();
  return g;
})();

let _featherMap = null;
function featherMap() {
  if (_featherMap) return _featherMap;
  const W = 256, H = 512, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d"), cx = W / 2, half = 118, rnd = seeded(77);
  const prof = (v) => (v < 0.32 ? 0.16 + 0.84 * Math.sin((v / 0.32) * Math.PI / 2) : Math.pow(Math.max(0, Math.cos(((v - 0.32) / 0.68) * Math.PI / 2)), 0.62));
  x.fillStyle = "#fff";
  for (let y = 0; y < H; y++) { const w = prof(1 - y / H) * half; x.fillRect(cx - w, y, w * 2, 1.4); }
  x.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 130; i++) {
    const y0 = 36 + (i / 129) * (H - 66);
    for (const sd of [-1, 1]) {
      const y1 = Math.max(2, y0 - (40 + rnd() * 55)), w1 = prof(1 - y1 / H) * half;
      x.strokeStyle = rnd() > 0.5 ? `rgba(0,0,0,${0.1 + rnd() * 0.24})` : `rgba(255,255,255,${0.1 + rnd() * 0.22})`;
      x.lineWidth = 1 + rnd() * 1.5;
      x.beginPath(); x.moveTo(cx, y0); x.lineTo(cx + sd * w1 * (0.88 + rnd() * 0.12), y1); x.stroke();
    }
  }
  const gr = x.createLinearGradient(0, H, 0, 0);
  gr.addColorStop(0, "rgba(0,0,0,0.62)"); gr.addColorStop(0.4, "rgba(0,0,0,0.12)");
  gr.addColorStop(0.85, "rgba(255,240,215,0)"); gr.addColorStop(1, "rgba(255,240,215,0.38)");
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  x.strokeStyle = "#fff"; x.lineWidth = 3.6; x.beginPath(); x.moveTo(cx, H); x.lineTo(cx, 24); x.stroke();
  x.strokeStyle = "rgba(0,0,0,0.28)"; x.lineWidth = 1; x.beginPath(); x.moveTo(cx + 2.6, H); x.lineTo(cx + 2.6, 30); x.stroke();
  x.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 30; i++) {
    const y = 90 + rnd() * (H - 130), sd = rnd() > 0.5 ? 1 : -1, w = prof(1 - y / H) * half;
    x.strokeStyle = "rgba(0,0,0,1)"; x.lineWidth = 1.3;
    x.beginPath(); x.moveTo(cx + sd * w, y); x.lineTo(cx + sd * (w - 14 - rnd() * 22), y - 10 - rnd() * 16); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4; if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return (_featherMap = t);
}
let _fm = null;
function featherMats() {
  if (_fm) return _fm;
  const base = { map: featherMap(), side: THREE.DoubleSide, alphaTest: 0.5, alphaToCoverage: true };
  return (_fm = {
    plain: new THREE.MeshStandardMaterial({ ...base, roughness: 0.78 }),
    gold: new THREE.MeshStandardMaterial({ ...base, roughness: 0.32, metalness: 0.75 }),
  });
}

// Chandrahasa, the crescent-moon blade of Shiva. A broad curved scimitar, length along +Y
const BLADE = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.09, 0); s.lineTo(0.09, 0);
  s.bezierCurveTo(0.17, 0.5, 0.34, 1.05, 0.62, 1.62);
  s.bezierCurveTo(0.34, 1.52, 0.0, 1.05, -0.09, 0.0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.014, bevelSegments: 3, curveSegments: 22 });
  g.translate(0, 0, -0.015); return g;
})();
const BLADE_SPINE = new THREE.TubeGeometry(new THREE.CubicBezierCurve3(
  new THREE.Vector3(0.09, 0, 0), new THREE.Vector3(0.17, 0.5, 0), new THREE.Vector3(0.34, 1.05, 0), new THREE.Vector3(0.62, 1.62, 0)), 30, 0.026, 8);
const BLADE_RUNE = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.0, 0.12, 0), new THREE.Vector3(0.05, 0.43, 0), new THREE.Vector3(0.2, 0.9, 0), new THREE.Vector3(0.38, 1.25, 0), new THREE.Vector3(0.46, 1.4, 0)]), 36, 0.045, 6);
// sword trail: an arc behind the blade tip, in the swing plane
const TRAIL = (() => {
  const g = new THREE.TorusGeometry(2.45, 0.07, 6, 40, 1.5);
  g.rotateZ(Math.PI / 2 - 1.5); g.rotateY(Math.PI / 2); return g;
})();
// sword wave: a thick crescent moon that tapers to two sharp points
const CRESCENT = (() => {
  const R = 3.6, a = 0.78, n = 40, c = Math.PI / 2, sh = new THREE.Shape();
  for (let i = 0; i <= n; i++) { const th = c - a + (2 * a * i) / n; const x = Math.cos(th) * R, y = Math.sin(th) * R; if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
  for (let i = n; i >= 0; i--) { const u = i / n, th = c - a + 2 * a * u, rr = R - 0.7 * Math.pow(Math.sin(u * Math.PI), 0.8); sh.lineTo(Math.cos(th) * rr, Math.sin(th) * rr); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2, curveSegments: 1 });
  g.translate(0, -2.9, -0.05); return g;
})();
// recurved Indian bow: limbs along Y, belly toward +Z, grip at the origin
const BOW_Z = (u) => 0.42 * Math.pow(1 - u * u, 0.9) - 0.42 - 0.18 * sm(0.72, 1, Math.abs(u));
const BOW_CURVE = new THREE.CatmullRomCurve3(Array.from({ length: 25 }, (_, i) => { const u = i / 12 - 1; return new THREE.Vector3(0, 0.98 * u, BOW_Z(u)); }));
const BOW_CORE = new THREE.TubeGeometry(BOW_CURVE, 72, 0.04, 8);
const SLEEVE = new THREE.CylinderGeometry(1, 1, 1, 10).rotateX(Math.PI / 2);
const BOW_RINGS = [0.1, 0.2, 0.32, 0.42, 0.58, 0.68, 0.8, 0.9].map((u) => {
  const p = BOW_CURVE.getPointAt(u), t = BOW_CURVE.getTangentAt(u);
  return { p: [p.x, p.y, p.z], l: [p.x + t.x, p.y + t.y, p.z + t.z], u: [1, 0, 0], s: [0.062, 0.062, u % 0.2 < 0.05 ? 0.1 : 0.05] };
});
// parashu (axe) head
const AXE = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(0.02, 0.3); sh.bezierCurveTo(0.35, 0.44, 0.58, 0.18, 0.52, 0.0); sh.bezierCurveTo(0.58, -0.18, 0.35, -0.44, 0.02, -0.3); sh.lineTo(0.02, 0.3);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2, curveSegments: 16 });
  g.translate(0, 0, -0.02); return g;
})();

const M = {
  skin: std("#a8603f", { roughness: 0.65 }), skinD: std("#7d442c"),
  gold: std("#d1a24a", { metalness: 0.9, roughness: 0.26 }), goldD: std("#a87a2c", { metalness: 0.85, roughness: 0.38 }),
  red: std("#8c2e23", { roughness: 0.55 }), crimson: std("#7c271e", { metalness: 0.4, roughness: 0.5 }), dark: std("#1c1210"),
  silk: std("#c23a22", { roughness: 0.5 }), white: std("#f2ead8", { roughness: 0.4 }),
  ruby: new THREE.MeshStandardMaterial({ color: "#d4202a", emissive: "#ff2a20", emissiveIntensity: 0.8 }),
  eye: new THREE.MeshBasicMaterial({ color: "#ff4a2a", toneMapped: false }),
  bone: std("#8a4a2a"), fur: std("#6a3826", { roughness: 0.85 }), chest: std("#b77a43", { roughness: 0.85 }),
  ruff: std("#f0e3c4", { roughness: 1 }), beak: std("#d9a13a", { roughness: 0.45 }), beakD: std("#8c5a1c", { roughness: 0.5 }),
  claw: std("#f5e6b8", { metalness: 0.4, roughness: 0.35 }),
  jeye: new THREE.MeshStandardMaterial({ color: "#ffcf6a", emissive: "#ff9a2a", emissiveIntensity: 1.4 }),
  petal: new THREE.MeshStandardMaterial({ color: "#eaa4a0", emissive: "#a64a52", emissiveIntensity: 0.45, roughness: 0.5 }),
  lamp: new THREE.MeshStandardMaterial({ color: "#ffd27a", emissive: "#ff9a2a", emissiveIntensity: 2 }),
  cloth: std("#b8321f", { side: THREE.DoubleSide }), sari: std("#d9467a", { roughness: 0.6, side: THREE.DoubleSide }),
  sun: new THREE.MeshBasicMaterial({ color: "#ffb04a", toneMapped: false }),
};
Object.assign(M, {
  steel: std("#d7deee", { metalness: 1, roughness: 0.18 }), goldL: std("#f2cf74", { metalness: 0.9, roughness: 0.2 }),
  flower: std("#ffffff", { roughness: 0.7, emissive: "#5a2a00", emissiveIntensity: 0.3 }),
  gem: std("#ffffff", { roughness: 0.12, metalness: 0.3, emissive: "#ffffff", emissiveIntensity: 0.14 }),
  pearl: std("#fff6e2", { roughness: 0.18, metalness: 0.2 }), lacq: std("#5a1812", { roughness: 0.32, metalness: 0.35 }),
});
const WAVE_M = new THREE.MeshBasicMaterial({ color: "#fff6d0", toneMapped: false, side: THREE.DoubleSide });
const WAVE_A = [0.3, 0.18, 0.09].map((o) => new THREE.MeshBasicMaterial({ color: "#ffc060", transparent: true, opacity: o, toneMapped: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
const WAVE_G = new THREE.MeshBasicMaterial({ color: "#ffb040", transparent: true, opacity: 0.45, toneMapped: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });

/* ---- generic instancing helper (matrices + optional per-instance colour) ---- */
function Inst({ geo, mat, items, ...rest }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const m = ref.current, d = new THREE.Object3D(), c = new THREE.Color();
    items.forEach((it, i) => {
      d.position.set(it.p[0], it.p[1], it.p[2]);
      d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1);
      if (it.u) d.up.set(it.u[0], it.u[1], it.u[2]); else d.up.set(0, 1, 0);
      if (it.l) d.lookAt(it.l[0], it.l[1], it.l[2]);
      else if (it.r) d.rotation.set(it.r[0], it.r[1], it.r[2]);
      if (it.roll) d.rotateZ(it.roll);
      const s = it.s;
      if (typeof s === "number") d.scale.set(s, s, s); else if (s) d.scale.set(s[0], s[1], s[2]);
      d.updateMatrix(); m.setMatrixAt(i, d.matrix);
      if (it.c) m.setColorAt(i, c.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} {...rest} />;
}

/* ---- cloth that ripples in the wind (flags, capes, curtains) ---- */
function Cloth({ w, h, color, axis = "y", amp = 0.12, speed = 5, ...props }) {
  const g = useMemo(() => new THREE.PlaneGeometry(w, h, 10, 6), [w, h]);
  const orig = useMemo(() => g.attributes.position.array.slice(), [g]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.65, emissive: color, emissiveIntensity: 0.08 }), [color]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, a = g.attributes.position, arr = a.array;
    for (let i = 0; i < a.count; i++) {
      const x = orig[i * 3], y = orig[i * 3 + 1];
      const wg = axis === "y" ? (h / 2 - y) / h : (x + w / 2) / w;
      arr[i * 3 + 2] = Math.sin(t * speed + (axis === "y" ? y * 3 + x * 2 : x * 4 + y * 2)) * amp * wg;
    }
    a.needsUpdate = true; g.computeVertexNormals();
  });
  return <mesh geometry={g} material={mat} {...props} />;
}

/* ---- feather layouts ---- */
const BR = ["#33190f", "#3f2113", "#4d2a18", "#5a3320"], MD = ["#6e4126", "#7e4d2c", "#8d5a33"], TN = ["#b4854f", "#c4955d", "#a9794a"], CR = ["#e3cfa0", "#eddcb4"];
const pk = (r, a) => a[Math.floor(r() * a.length)];

function innerWing(s) {
  const r = seeded(s > 0 ? 11 : 12), o = [];
  for (let i = 0; i < 10; i++) {
    const u = i / 9;
    o.push({ p: [s * (0.18 + u * 1.38), 0, 0.1 + u * 0.04], r: [0.03, s * (0.02 + u * 0.12), 0], s: [0.56, 1, 1.75 - u * 0.15], c: pk(r, i % 3 === 2 ? MD : BR) });
  }
  [[0.0, 0.02, 0.66, 12, TN], [-0.12, 0.04, 0.5, 12, MD], [-0.22, 0.06, 0.4, 11, TN]].forEach(([z0, y0, len, n, pal]) => {
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      o.push({ p: [s * (0.1 + u * 1.5), y0, z0 + u * 0.05], r: [0.04, s * (0.03 + u * 0.1), 0], s: [0.4, 1, len * (1 - u * 0.15)], c: pk(r, pal) });
    }
  });
  return o;
}
function outerWing(s) {
  const r = seeded(s > 0 ? 21 : 22), o = [];
  for (let i = 0; i < 10; i++) {
    const u = i / 9;
    o.push({ p: [s * (0.08 + i * 0.175), 0, 0.06 + u * 0.08], r: [0.02, s * (0.02 + u * 0.17), 0], roll: s * u * 0.25, s: [0.46, 1, 1.9 + Math.sin(u * 2.6) * 0.5 - u * 0.3], c: pk(r, BR) });
  }
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    o.push({ p: [s * (0.06 + u * 1.5), 0.03, -0.04 + u * 0.05], r: [0.04, s * (0.03 + u * 0.15), 0], s: [0.38, 1, 0.72 - u * 0.2], c: pk(r, i % 2 ? MD : TN) });
  }
  return o;
}
function bodyFeathers() {
  const r = seeded(5), o = [], R = [0.62, 0.55, 1.15];
  for (let i = 0; i < 260; i++) {
    const ph = Math.acos(1 - 2 * r()), th = r() * Math.PI * 2;
    const n = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
    if (n[2] < -0.5) continue;
    const p = [n[0] * R[0] * 1.02, n[1] * R[1] * 1.02, n[2] * R[2] * 1.02];
    const nl = Math.hypot(n[0] / R[0], n[1] / R[1], n[2] / R[2]);
    const nn = [n[0] / R[0] / nl, n[1] / R[1] / nl, n[2] / R[2] / nl];
    const d = nn[2], tg = [-d * nn[0], -d * nn[1], 1 - d * nn[2]];
    const dir = [tg[0] + 0.5 * nn[0], tg[1] + 0.5 * nn[1], tg[2] + 0.5 * nn[2]];
    const dl = Math.hypot(dir[0], dir[1], dir[2]);
    const len = 0.38 + r() * 0.3;
    o.push({
      p, l: [p[0] + dir[0] / dl, p[1] + dir[1] / dl, p[2] + dir[2] / dl], s: [0.2 + r() * 0.12, 1, len],
      c: n[1] < -0.25 ? pk(r, TN) : n[1] < 0.2 ? pk(r, MD) : pk(r, BR),
    });
  }
  return o;
}
function ruffFeathers() {
  const r = seeded(8), o = [];
  [[-0.95, 0.3, 0.55], [-0.82, 0.38, 0.65]].forEach(([z, rad, len], row) => {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + row * 0.13;
      const p = [Math.cos(a) * rad, 0.12 + Math.sin(a) * rad * 0.95, z];
      const dir = [Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.7];
      o.push({ p, l: [p[0] + dir[0], p[1] + dir[1], p[2] + dir[2]], s: [0.2, 1, len * (0.85 + r() * 0.3)], c: pk(r, CR) });
    }
  });
  return o;
}
function tailFeathers() {
  const r = seeded(3), o = [];
  for (let n = -4; n <= 4; n++) o.push({ p: [n * 0.1, -0.02, 1.0], r: [0.06, n * 0.085, 0], s: [0.55, 1, 1.55 - Math.abs(n) * 0.08], c: Math.abs(n) % 2 ? pk(r, BR) : pk(r, MD) });
  return o;
}
const BODY_F = bodyFeathers(), RUFF_F = ruffFeathers(), TAIL_F = tailFeathers();

const SWAN_W = (() => {
  const r = seeded(41), o = [];
  [-1, 1].forEach((s) => {
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 12; i++) {
        const u = i / 11, z = -2.8 + u * 3.9, x = s * (1.5 + row * 0.06), y = 0.5 + row * 0.16;
        const dir = [s * 0.3, 0.95 - u * 0.1, 0.3 + u * 0.45];
        o.push({
          p: [x, y, z], l: [x + dir[0], y + dir[1], z + dir[2]], u: [s, 0, 0],
          s: [0.36 - row * 0.05, 1, (0.9 + 1.0 * Math.sin(u * Math.PI)) * (1 - row * 0.22)],
          c: row === 2 ? "#f4d98a" : r() > 0.5 ? "#e2b459" : "#cf9b3e",
        });
      }
    }
  });
  return o;
})();
const JEWELS = (() => {
  const o = [];
  [-1, 1].forEach((s) => {
    for (let z = -3.0; z <= 3.01; z += 0.6) {
      const k = Math.sqrt(Math.max(0, 1 - (0.15 / 0.55) ** 2 - (z / 3.8) ** 2));
      o.push({ p: [s * 1.7 * k * 1.01, 0.15, z], s: 0.075 });
    }
  });
  return o;
})();
const KANGURA = (() => {
  const o = [];
  [-1, 1].forEach((s) => { for (let z = -2.8; z <= 2.81; z += 0.35) o.push({ p: [s * 1.45, 0.6, z], s: [0.06, 0.2, 0.06] }); });
  for (let x = -1.2; x <= 1.21; x += 0.3) o.push({ p: [x, 0.6, 3.0], s: [0.06, 0.2, 0.06] });
  return o;
})();

const swagPts = (o, a, b, n, sag, mk) => {
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    o.push(mk([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * sag, a[2] + (b[2] - a[2]) * u], i));
  }
};
const GARLAND = (() => {
  const o = [], r = seeded(33), cols = ["#f59a1c", "#ffbf2a", "#f27a1a", "#ffd24a"], zs = [-2.8, -1.4, 0, 1.4, 2.8];
  const mk = (p) => ({ p, s: 0.065 + r() * 0.025, c: pk(r, cols) });
  [-1, 1].forEach((sd) => { for (let i = 0; i < 4; i++) swagPts(o, [sd * 1.4, 0.82, zs[i]], [sd * 1.4, 0.82, zs[i + 1]], 11, 0.24, mk); });
  swagPts(o, [-1.4, 0.82, 2.8], [1.4, 0.82, 2.8], 17, 0.3, mk);
  return o;
})();
const PEARLS = (() => {
  const o = [], X = 1.4, Z = 1.8, Y = 2.46, mk = (p) => ({ p, s: 0.04 });
  for (let i = 0; i < 3; i++) {
    const x0 = -X + (i * 2 * X) / 3, x1 = x0 + (2 * X) / 3, z0 = -Z + (i * 2 * Z) / 3, z1 = z0 + (2 * Z) / 3;
    swagPts(o, [x0, Y, -Z], [x1, Y, -Z], 8, 0.3, mk); swagPts(o, [x0, Y, Z], [x1, Y, Z], 8, 0.3, mk);
    swagPts(o, [-X, Y, z0], [-X, Y, z1], 8, 0.3, mk); swagPts(o, [X, Y, z0], [X, Y, z1], 8, 0.3, mk);
  }
  return o;
})();
const hullK = (y, z) => Math.sqrt(Math.max(0, 1 - (y / 0.55) ** 2 - (z / 3.8) ** 2));
const HULL_GEMS = (() => {
  const o = [], cols = ["#1fbf86", "#2a6fd6", "#1fbf86", "#d4202a"];
  [-1, 1].forEach((sd) => { for (let z = -3.1, i = 0; z <= 3.11; z += 0.52, i++) o.push({ p: [sd * 1.7 * hullK(-0.2, z) * 1.015, -0.2, z], s: 0.1, c: cols[i % 4] }); });
  return o;
})();
const HULL_PETALS = (() => {
  const o = [];
  [-1, 1].forEach((sd) => { for (let z = -3.2; z <= 3.21; z += 0.4) o.push({ p: [sd * (1.7 * hullK(0.3, z) + 0.01), 0.3, z], s: [0.07, 0.2, 0.19], r: [0, 0, -sd * 0.35] }); });
  return o;
})();
const TAIL_FAN = (() => {
  const o = [];
  [[9, 1.9, 0.8, 2.0, "#d9a441"], [11, 2.3, 1, 1.6, "#f3d37a"]].forEach(([n, sp, wd, len, c], row) => {
    for (let i = 0; i < n; i++) { const u = i / (n - 1) - 0.5; o.push({ p: [u * 0.5 * wd, 0.3 + row * 0.07, 3.5], r: [-0.1 - row * 0.08, u * sp, 0], s: [0.5 - row * 0.06, 1, len - Math.abs(u) * 0.55], c }); }
  });
  return o;
})();
const MANDALA = Array.from({ length: 16 }, (_, i) => {
  const a = ((i + 0.5) / 16) * Math.PI * 2;
  return { p: [Math.sin(a) * 1.32, -0.86, Math.cos(a) * 2.05], s: 0.085, c: ["#d4202a", "#1fbf86", "#2a6fd6", "#ffd24a"][i % 4] };
});

const BOLTS = [1, 2, 3, 4, 5].map((sd) => {
  const r = seeded(500 + sd), pts = [];
  for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector3(i ? (r() - 0.5) * 0.34 : 0, 0.2 + i * 0.2, i && i < 10 ? (r() - 0.5) * 0.34 : 0));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.1), 24, 0.014, 4);
});

/* ---------------- TERRAIN ---------------- */

const KZ = (n) => (2 * Math.PI * n) / TP; // integer harmonics keep every tile periodic in z
const riverX = (z) => 16 * Math.sin(KZ(2) * z + 0.7) + 7 * Math.sin(KZ(5) * z + 2.1);
function terrainY(x, z) {
  const ax = Math.abs(x);
  const h = 1.9 * Math.sin(x * 0.045 + 1.3) * Math.sin(KZ(3) * z + 0.4)
    + 1.2 * Math.sin(x * 0.11 + KZ(7) * z) * Math.cos(KZ(6) * z + x * 0.07)
    + 0.6 * Math.sin(x * 0.23 + KZ(13) * z + 1.1) * Math.sin(KZ(11) * z + 0.3);
  const side = sm(45, 200, ax);
  const r1 = 1 - Math.abs(Math.sin(x * 0.027 + KZ(2) * z + 1.2));
  const r2 = 1 - Math.abs(Math.sin(x * 0.069 - KZ(5) * z + 2.0));
  const r3 = 1 - Math.abs(Math.sin(x * 0.13 + KZ(9) * z + 4.0));
  const m = side * (10 + 26 * r1 * r1 + 12 * r2 * r2 + 5 * r3);
  const y0 = GY + Math.max(h, -1.7) + m;
  const carve = 1 - sm(4, 13, Math.abs(x - riverX(z)));
  return y0 * (1 - carve) + -16.4 * carve;
}

const forestNoise = (x, z) => Math.sin(x * 0.031 + KZ(4) * z + 0.5) * Math.sin(x * 0.052 - KZ(3) * z + 1.0);

function buildTerrain() {
  const g = new THREE.PlaneGeometry(TW, TP, 208, 120);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, n = pos.count;
  const nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const C = (h) => new THREE.Color(h);
  const grass = [C("#5a7a32"), C("#7a9340")], forest = C("#2d4a24"), rock = C("#7a665a"), snow = C("#f6f1e8"), sand = C("#b49a6a");
  const c = new THREE.Color(), e = 1.5;
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = terrainY(x, z);
    pos.setY(i, y);
    const nx = terrainY(x - e, z) - terrainY(x + e, z), nz = terrainY(x, z - e) - terrainY(x, z + e);
    const l = Math.hypot(nx, 2 * e, nz);
    nor[i * 3] = nx / l; nor[i * 3 + 1] = (2 * e) / l; nor[i * 3 + 2] = nz / l;
    const slope = 1 - nor[i * 3 + 1], hy = y - GY, dr = Math.abs(x - riverX(z));
    const v = 0.5 + 0.5 * Math.sin(x * 0.19 + KZ(8) * z) * Math.sin(x * 0.13 - KZ(6) * z + 2);
    c.copy(grass[0]).lerp(grass[1], v).lerp(forest, sm(-0.1, 0.35, forestNoise(x, z)) * 0.85);
    c.lerp(sand, sm(13, 8, dr) * 0.8);
    c.lerp(rock, Math.max(sm(8, 18, hy), sm(0.18, 0.4, slope)));
    c.lerp(snow, sm(24, 32, hy) * (1 - sm(0.45, 0.7, slope) * 0.6));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

function buildWater() {
  const N = 120, pos = [], nor = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const z = -TP / 2 + (i / N) * TP, cx = riverX(z);
    pos.push(cx - 10, WL, z, cx + 10, WL, z); nor.push(0, 1, 0, 0, 1, 0);
  }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

function buildTrees() {
  const r = seeded(123), per = [], cans = [], con = [], trk = [], col = new THREE.Color();
  for (let a = 0; a < 9000 && per.length < 2300; a++) {
    const x = (r() + r() - 1) * 180, z = (r() - 0.5) * TP, y = terrainY(x, z);
    if (Math.abs(x - riverX(z)) < 10 || y < -15 || y > GY + 11) continue;
    if (forestNoise(x, z) < -0.25 && r() < 0.8) continue;
    per.push({ x, y, z, s: 1.5 + r() * 2.2, t: r(), hy: y - GY });
  }
  for (let k = -1; k < 3; k++) {
    per.forEach((p) => {
      const z = p.z - k * TP;
      if (p.hy > 5) {
        col.setHSL(0.33 + p.t * 0.05, 0.4, 0.12 + p.t * 0.08);
        con.push({ p: [p.x, p.y + p.s * 1.5, z], s: [p.s * 0.9, p.s * 3, p.s * 0.9], c: col.clone() });
      } else {
        col.setHSL(0.24 + p.t * 0.1, 0.45, 0.14 + p.t * 0.12);
        cans.push({ p: [p.x, p.y + p.s * 1.9, z], s: [p.s * 1.2, p.s * 0.95, p.s * 1.2], r: [0, p.t * 6, 0], c: col.clone() });
        trk.push({ p: [p.x, p.y + p.s * 0.8, z], s: [p.s * 0.14, p.s * 1.7, p.s * 0.14] });
      }
    });
  }
  return { cans, con, trk };
}

/* Dense forest the opening shot rises out of. It scrolls with the ground, then slides away behind us. */
function buildOpeningForest() {
  const r = seeded(404), cans = [], tops = [], trk = [], col = new THREE.Color();
  const add = (x, z) => {
    const y = terrainY(x, z);
    if (Math.abs(x - riverX(z)) < 11 || y < -15 || y > GY + 6) return;
    const s = 2.2 + r() * 1.4, t = r();
    col.setHSL(0.25 + t * 0.07, 0.5, 0.17 + t * 0.14);
    cans.push({ p: [x, y + s * 1.5, z], s: [s * 1.35, s * 0.95, s * 1.35], r: [0, t * 6, 0], c: col.clone() });
    col.offsetHSL(0.01, 0.02, 0.05);
    tops.push({ p: [x + (r() - 0.5) * s * 0.5, y + s * 2.35, z + (r() - 0.5) * s * 0.5], s: [s * 0.85, s * 0.6, s * 0.85], r: [0, t * 9, 0], c: col.clone() });
    trk.push({ p: [x, y + s * 0.8, z], s: [s * 0.18, s * 1.7, s * 0.18] });
  };
  for (let a = 0; a < 4000 && cans.length < 430; a++) add((r() + r() + r() - 1.5) * 60, -330 + r() * 360);
  for (let a = 0; a < 2000 && cans.length < 640; a++) add((r() + r() - 1) * 42, -55 + r() * 85);
  return { cans, tops, trk };
}

function OpeningForest({ G }) {
  const ref = useRef();
  const f = useMemo(buildOpeningForest, []);
  const mats = useMemo(() => ({
    leaf: new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: "#4a3224", roughness: 1 }),
  }), []);
  useFrame(() => {
    const g = G.current, z = g.dist * 1.5;
    ref.current.position.z = z;
    ref.current.visible = g.state !== "idle" && z - 330 < 40;
  });
  return (
    <group ref={ref}>
      <Inst geo={ICO} mat={mats.leaf} items={f.cans} />
      <Inst geo={ICO} mat={mats.leaf} items={f.tops} />
      <Inst geo={CYL} mat={mats.trunk} items={f.trk} />
    </group>
  );
}

/* Leaves thrown up as Jatayu breaks through the canopy */
function Leaves({ G }) {
  const ref = useRef();
  const d = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => {
    const r = seeded(91), pal = ["#7fae3a", "#a6c447", "#d9a53a", "#5c8a2e", "#c9d36a"];
    return Array.from({ length: 110 }, () => ({
      t0: 2.0 + r() * 1.6, p: [(r() - 0.5) * 11, -6.4 + r() * 2.8, (r() - 0.5) * 8],
      v: [(r() - 0.5) * 5, 4 + r() * 6.5, (r() - 0.5) * 4], sp: 2 + r() * 5, ph: r() * 6.28, s: 0.28 + r() * 0.3, c: pal[Math.floor(r() * pal.length)],
    }));
  }, []);
  useLayoutEffect(() => {
    const c = new THREE.Color();
    data.forEach((l, i) => ref.current.setColorAt(i, c.set(l.c)));
    ref.current.instanceColor.needsUpdate = true;
  }, [data]);
  useFrame(() => {
    const g = G.current, m = ref.current;
    m.visible = g.state === "opening";
    if (!m.visible) return;
    data.forEach((l, i) => {
      const tau = g.op - l.t0;
      if (tau < 0 || tau > 4.4) { d.scale.set(0, 0, 0); } else {
        const k = (1 - Math.exp(-0.8 * tau)) / 0.8;
        d.position.set(l.p[0] + l.v[0] * k + Math.sin(tau * l.sp + l.ph) * 0.6, l.p[1] + l.v[1] * tau - 2.3 * tau * tau + Math.cos(tau * l.sp) * 0.3, l.p[2] + l.v[2] * k + 21 * tau);
        d.rotation.set(tau * l.sp, tau * l.sp * 0.7 + l.ph, tau * 2);
        d.scale.setScalar(l.s * sm(0, 0.15, tau) * (1 - sm(3.2, 4.4, tau)));
      }
      d.updateMatrix(); m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, 110]} frustumCulled={false}>
      <planeGeometry args={[1, 0.55]} />
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} />
    </instancedMesh>
  );
}

function Land() {
  const geo = useMemo(buildTerrain, []);
  const water = useMemo(buildWater, []);
  const trees = useMemo(buildTrees, []);
  const mats = useMemo(() => ({
    land: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
    water: new THREE.MeshStandardMaterial({ color: "#3d6f8c", roughness: 0.06, metalness: 0.55, transparent: true, opacity: 0.88, side: THREE.DoubleSide }),
    leaf: new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: "#4a3224", roughness: 1 }),
  }), []);
  return (
    <>
      {[-1, 0, 1, 2].map((k) => (
        <group key={k} position={[0, 0, -k * TP]}>
          <mesh geometry={geo} material={mats.land} frustumCulled={false} />
          <mesh geometry={water} material={mats.water} frustumCulled={false} />
        </group>
      ))}
      <Inst geo={ICO} mat={mats.leaf} items={trees.cans} />
      <Inst geo={CONE} mat={mats.leaf} items={trees.con} />
      <Inst geo={CYL} mat={mats.trunk} items={trees.trk} />
    </>
  );
}

/* ---------------- SKY, ENVIRONMENT, CLOUDS ---------------- */

let _sky = null;
function skyTexture() {
  if (_sky) return _sky;
  const W = 2048, H = 1024, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d"), r = seeded(17);
  const g = x.createLinearGradient(0, 0, 0, H);
  [[0, "#161a4a"], [0.16, "#2b2c66"], [0.28, "#6a4676"], [0.36, "#c2606a"], [0.42, "#ec8a5c"], [0.47, "#f5a362"], [0.5, FOG], [0.56, "#d98a54"], [1, "#b87448"]]
    .forEach(([s, col]) => g.addColorStop(s, col));
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,244,216,${0.25 + r() * 0.5})`; x.fillRect(r() * W, r() * H * 0.2, 1 + r() * 1.2, 1 + r() * 1.2); }
  for (let i = 0; i < 70; i++) {
    const cy = H * (0.3 + r() * 0.19), cx = r() * W, w = 120 + r() * 320, h = 4 + r() * 12;
    const gr = x.createRadialGradient(cx, cy, 0, cx, cy, w);
    gr.addColorStop(0, r() > 0.45 ? "rgba(255,196,140,0.30)" : "rgba(110,52,92,0.28)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    x.save(); x.translate(cx, cy); x.scale(1, h / w); x.translate(-cx, -cy);
    x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, w, 0, 6.283); x.fill(); x.restore();
  }
  // sun glow at the sun's direction (equirect: u = atan2(z, -x) / 2pi, v = acos(y) / pi)
  const th = Math.acos(SUN_DIR.y), ph = (Math.atan2(SUN_DIR.z, -SUN_DIR.x) + Math.PI * 2) % (Math.PI * 2);
  const sx = (ph / (Math.PI * 2)) * W, sy = (th / Math.PI) * H;
  x.globalCompositeOperation = "lighter";
  const sg = x.createRadialGradient(sx, sy, 0, sx, sy, 190);
  sg.addColorStop(0, "rgba(255,238,196,0.95)"); sg.addColorStop(0.06, "rgba(255,205,128,0.7)");
  sg.addColorStop(0.25, "rgba(255,150,80,0.28)"); sg.addColorStop(1, "rgba(255,120,60,0)");
  x.fillStyle = sg; x.fillRect(sx - 200, sy - 200, 400, 400);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4; if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
  return (_sky = t);
}

let _cloud = null;
function cloudTexture() {
  if (_cloud) return _cloud;
  const S = 256, c = document.createElement("canvas");
  c.width = S; c.height = S;
  const x = c.getContext("2d"), r = seeded(9);
  for (let i = 0; i < 24; i++) {
    const a = r() * Math.PI * 2, d = r() * 70 * r(), cx = 128 + Math.cos(a) * d * 1.3, cy = 138 + Math.sin(a) * d * 0.6, rad = 34 + r() * 42;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(0.6, "rgba(255,255,255,0.25)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, 6.283); x.fill();
  }
  x.globalCompositeOperation = "source-atop";
  const sh = x.createLinearGradient(0, 40, 60, 230);
  sh.addColorStop(0, "rgba(255,244,222,1)"); sh.addColorStop(0.55, "rgba(255,208,170,1)"); sh.addColorStop(1, "rgba(150,100,128,1)");
  x.fillStyle = sh; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
  return (_cloud = t);
}

const CP = 240; // cloud tile length
function buildClouds() {
  const r = seeded(5), puffs = [];
  for (let k = -1; k < 3; k++) {
    for (let i = 0; i < 46; i++) {
      const kind = r();
      let x, y, s;
      if (kind < 0.45) { x = (r() < 0.5 ? -1 : 1) * (25 + r() * 130); y = -8 + r() * 14; s = 7 + r() * 9; } // banks beside the flight path
      else if (kind < 0.7) { x = (r() - 0.5) * 260; y = -11 + r() * 3; s = 9 + r() * 10; } // deck below us
      else { x = (r() - 0.5) * 300; y = 18 + r() * 30; s = 9 + r() * 14; } // high cumulus
      const z = -r() * CP - k * CP, n = 5 + Math.floor(r() * 4);
      for (let j = 0; j < n; j++) puffs.push({ x: x + (r() - 0.5) * s * 1.6, y: y + (r() - 0.3) * s * 0.5, z: z + (r() - 0.5) * s * 1.2, cls: r() < 0.3 ? 0 : r() < 0.7 ? 1 : 2, y0: y });
    }
  }
  puffs.sort((a, b) => a.z - b.z);
  return [9, 16, 26].map((size, ci) => {
    const list = puffs.filter((p) => p.cls === ci), arr = new Float32Array(list.length * 3), col = new Float32Array(list.length * 3), c = new THREE.Color();
    list.forEach((p, i) => {
      arr.set([p.x, p.y, p.z], i * 3);
      c.setHSL(0.07, 0.45 * (p.y0 < -5 ? 1 : 0.55), p.y0 < -5 ? 0.72 : 0.9);
      col.set([c.r, c.g, c.b], i * 3);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { size, geo };
  });
}

function Clouds() {
  const sets = useMemo(buildClouds, []);
  const map = useMemo(cloudTexture, []);
  return (
    <>
      {sets.map((s, i) => (
        <points key={i} geometry={s.geo} frustumCulled={false} renderOrder={i}>
          <pointsMaterial map={map} size={s.size} sizeAttenuation transparent depthWrite={false} vertexColors opacity={0.92} />
        </points>
      ))}
    </>
  );
}

/* Image-based lighting built from our own sky, so gold and steel catch the sunset */
function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    let rt, pm;
    try {
      pm = new THREE.PMREMGenerator(gl);
      const es = new THREE.Scene();
      const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide }));
      const sun = new THREE.Mesh(new THREE.SphereGeometry(16, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 9, 4) }));
      sun.position.copy(SUN_DIR).multiplyScalar(200);
      es.add(dome, sun);
      rt = pm.fromScene(es, 0, 1, 1000);
      scene.environment = rt.texture;
      if ("environmentIntensity" in scene) scene.environmentIntensity = 0.9;
      es.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    } catch { /* environment lighting is optional */ }
    return () => { scene.environment = null; if (rt) rt.dispose(); if (pm) pm.dispose(); };
  }, [gl, scene]);
  return null;
}

function SkyDome() {
  const tex = useMemo(skyTexture, []);
  const rays = useRef();
  useFrame((_, dt) => { if (rays.current) rays.current.rotation.z += dt * 0.03; });
  return (
    <>
      <mesh renderOrder={-2}><sphereGeometry args={[220, 32, 20]} /><meshBasicMaterial map={tex} side={THREE.BackSide} depthWrite={false} fog={false} /></mesh>
      <mesh position={[-34, 12, -170]} renderOrder={-1}>
        <sphereGeometry args={[11, 24, 16]} /><meshBasicMaterial color="#fff2c8" fog={false} toneMapped={false} />
      </mesh>
      <mesh position={[-34, 12, -172]}>
        <sphereGeometry args={[26, 24, 16]} />
        <meshBasicMaterial color="#ffc46b" transparent opacity={0.28} fog={false} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <group ref={rays} position={[-34, 12, -168]}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 8) * Math.PI]}>
            <planeGeometry args={[5, 190]} />
            <meshBasicMaterial color="#ffd89a" transparent opacity={0.05} fog={false} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </>
  );
}

function Scroller({ G, period, factor, children }) {
  const ref = useRef();
  useFrame(() => { ref.current.position.z = (G.current.dist * factor) % period; });
  return <group ref={ref}>{children}</group>;
}

function Streaks({ G }) {
  const ref = useRef(), mat = useRef();
  useLayoutEffect(() => {
    const r = seeded(21), d = new THREE.Object3D(), base = [];
    for (let i = 0; i < 46; i++) { const an = r() * 6.28, rad = 7 + r() * 22; base.push({ x: Math.cos(an) * rad, y: Math.sin(an) * rad * 0.5 + 1, z: r() * 80 }); }
    let n = 0;
    for (let k = 0; k < 3; k++) base.forEach((c) => { d.position.set(c.x, c.y, c.z - k * 80 - 20); d.updateMatrix(); ref.current.setMatrixAt(n++, d.matrix); });
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame(() => { if (mat.current) mat.current.opacity = 0.14 + G.current.boost * 0.5; });
  return (
    <instancedMesh ref={ref} args={[null, null, 138]} frustumCulled={false}>
      <boxGeometry args={[0.03, 0.03, 9]} /><meshBasicMaterial ref={mat} color="#fff0d0" transparent opacity={0.2} depthWrite={false} />
    </instancedMesh>
  );
}

/* ---------------- JATAYU ---------------- */

function Wing({ side, wref, oref }) {
  const inner = useMemo(() => innerWing(side), [side]);
  const outer = useMemo(() => outerWing(side), [side]);
  const fm = featherMats();
  return (
    <group ref={wref} position={[side * 0.5, 0.2, -0.2]}>
      <mesh position={[side * 0.8, 0.03, 0]} rotation={[0, 0, Math.PI / 2]} material={M.bone}><capsuleGeometry args={[0.14, 1.5, 6, 10]} /></mesh>
      <mesh geometry={SPH} material={M.fur} position={[side * 0.3, 0.02, 0.05]} scale={[0.7, 0.28, 0.55]} />
      <Inst geo={FEATHER} mat={fm.plain} items={inner} />
      <group ref={oref} position={[side * 1.6, 0, 0]}>
        <mesh position={[side * 0.85, 0.03, 0]} rotation={[0, 0, Math.PI / 2]} material={M.bone}><capsuleGeometry args={[0.09, 1.6, 6, 10]} /></mesh>
        <Inst geo={FEATHER} mat={fm.plain} items={outer} />
      </group>
    </group>
  );
}

function Arm({ side, aref }) {
  return (
    <group ref={aref} position={[side * 0.42, -0.25, -0.75]}>
      <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]} material={M.bone}><capsuleGeometry args={[0.13, 0.55, 6, 10]} /></mesh>
      <mesh geometry={SPH} material={M.chest} position={[0, -0.02, -0.7]} scale={0.17} />
      {[-0.09, 0, 0.09].map((c, i) => (
        <mesh key={i} geometry={CONE} material={M.claw} position={[c, -0.1, -0.9]} rotation={[-Math.PI / 2 + 0.7, 0, 0]} scale={[0.04, 0.36, 0.04]} />
      ))}
    </group>
  );
}

function Jatayu({ G }) {
  const root = useRef(), wl = useRef(), wr = useRef(), wlo = useRef(), wro = useRef(), al = useRef(), ar = useRef();
  const head = useRef(), slash = useRef(), beak = useRef(), stump = useRef();
  const fm = featherMats();
  useFrame(() => {
    const g = G.current, t = g.t, r = root.current;
    r.visible = g.state !== "end";
    const bp = g.beakT > 0 ? Math.sin((1 - g.beakT / BEAK_T) * Math.PI) : 0;
    const cp = g.clawT > 0 ? 1 - g.clawT / CLAW_T : 0, cs = Math.sin(cp * Math.PI);
    const cut = g.wingCut, fall = cut ? Math.max(0, g.fin - g.cutF) : 0;
    r.position.set(g.x, g.y + (cut ? 0 : Math.sin(t * 3) * 0.06), -(bp * 2.4 + cs * 1.2));
    if (cut) r.rotation.set(Math.min(fall * 0.7, 1.2), Math.sin(fall * 2) * 0.3, -g.spin);
    else r.rotation.set(g.vy * 0.04 - bp * 0.35, 0, -g.vx * 0.05);
    const w = t * (7 + g.boost * 4), amp = 0.5 - g.boost * 0.28;
    const f = cut ? (Math.sin(t * 12) * 0.9) / (1 + fall) : Math.sin(w) * amp;
    const f2 = cut ? f * 1.2 : Math.sin(w - 0.9) * (amp + 0.14);
    const sw = cut ? 0.2 : g.boost * 0.5 + bp * 0.3;
    wr.current.visible = !cut; stump.current.visible = cut;
    wr.current.rotation.set(0, -sw, f); wl.current.rotation.set(0, sw, -f);
    wro.current.rotation.set(0, -sw * 0.5, f2); wlo.current.rotation.set(0, sw * 0.5, -f2);
    ar.current.rotation.set(-0.15 - cs * 0.3, cs * 0.9, 0); al.current.rotation.set(-0.15 - cs * 0.3, -cs * 0.9, 0);
    ar.current.position.z = -0.75 - cs * 0.5; al.current.position.z = -0.75 - cs * 0.5;
    head.current.rotation.y = clamp((g.px - g.x) * -0.03, -0.3, 0.3);
    head.current.rotation.x = cut ? 0.5 : 0;
    beak.current.rotation.x = -bp * 0.45 + (cut ? 0.25 : 0);
    slash.current.visible = cs > 0.05;
    slash.current.material.opacity = cs * 0.9;
    slash.current.rotation.z = -1 + cp * 2.4;
  });
  return (
    <group ref={root} scale={1.9}>
      <mesh geometry={SPH} material={M.fur} scale={[0.62, 0.55, 1.15]} />
      <mesh geometry={SPH} material={M.chest} position={[0, -0.12, -0.45]} scale={[0.45, 0.4, 0.7]} />
      <Inst geo={FEATHER} mat={fm.plain} items={BODY_F} />
      <Inst geo={FEATHER} mat={fm.plain} items={RUFF_F} />
      <mesh position={[0, 0.2, -1.1]} rotation={[0.7, 0, 0]} material={M.skinD}><capsuleGeometry args={[0.11, 0.3, 5, 8]} /></mesh>
      {/* head */}
      <group ref={head} position={[0, 0.28, -1.25]}>
        <mesh geometry={SPH} material={M.chest} scale={[0.3, 0.28, 0.36]} />
        <mesh geometry={CONE} material={M.gold} position={[0, 0.3, 0.02]} scale={[0.1, 0.18, 0.14]} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh geometry={SPH} material={M.jeye} position={[s * 0.19, 0.06, -0.24]} scale={0.055} />
            <mesh geometry={BOX} material={M.dark} position={[s * 0.17, 0.14, -0.25]} rotation={[0, 0, s * 0.5]} scale={[0.14, 0.025, 0.06]} />
          </group>
        ))}
        {[-0.12, 0, 0.12].map((x, i) => <mesh key={i} geometry={CONE} material={M.ruff} position={[x, 0.2, 0.1]} rotation={[-0.6, 0, 0]} scale={[0.035, 0.16, 0.035]} />)}
        <group ref={beak} position={[0, -0.02, -0.34]}>
          <mesh geometry={CONE} material={M.beak} position={[0, 0, -0.2]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.13, 0.5, 0.13]} />
          <mesh geometry={CONE} material={M.beakD} position={[0, -0.1, -0.42]} rotation={[-Math.PI / 2 + 0.9, 0, 0]} scale={[0.05, 0.2, 0.05]} />
        </group>
      </group>
      <Wing side={-1} wref={wl} oref={wlo} /><Wing side={1} wref={wr} oref={wro} />
      <group ref={stump} position={[0.5, 0.2, -0.2]} visible={false}>
        <mesh geometry={SPH} material={M.fur} scale={[0.3, 0.2, 0.34]} />
        <mesh geometry={SPH} material={M.sun} position={[0.1, 0, 0]} scale={0.14} />
        <Sparkles count={14} scale={[1.2, 1.2, 1.2]} size={5} speed={1.4} color="#ffd27a" />
      </group>
      <Arm side={-1} aref={al} /><Arm side={1} aref={ar} />
      <Inst geo={FEATHER} mat={fm.plain} items={TAIL_F} />
      <mesh ref={slash} position={[0, 0.1, -2.6]} visible={false}>
        <torusGeometry args={[1.5, 0.045, 6, 28, 1.9]} />
        <meshBasicMaterial color="#fff0b8" transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Sparkles count={20} scale={[6, 2, 5]} size={3} speed={0.6} opacity={0.6} color="#f6d18c" />
    </group>
  );
}

/* Everything that happens in the world when the blade lands: slash arc, shockwaves, feathers, sparks, falling embers */
function FinaleFX({ G }) {
  const { camera } = useThree();
  const R1 = useRef(), R2 = useRef(), streak = useRef(), cres = useRef(), sparks = useRef(), trail = useRef(), feathers = useRef();
  const d = useMemo(() => new THREE.Object3D(), []);
  const fm = featherMats();
  const mats = useMemo(() => {
    const add = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    return { r1: add("#fff3c4"), r2: add("#ffb040"), streak: add("#ffffff"), cres: add("#fff6d0") };
  }, []);
  const FD = useMemo(() => {
    const r = seeded(313);
    return Array.from({ length: 46 }, () => ({ v: [(r() - 0.35) * 9, (r() - 0.2) * 8, (r() - 0.5) * 6], ph: r() * 6.28, sp: 2 + r() * 5, s: 0.6 + r() * 0.6, c: pk(r, [...BR, ...MD, ...TN]) }));
  }, []);
  useLayoutEffect(() => {
    const c = new THREE.Color();
    FD.forEach((f, i) => feathers.current.setColorAt(i, c.set(f.c)));
    feathers.current.instanceColor.needsUpdate = true;
  }, [FD]);
  useFrame(() => {
    const g = G.current, e = g.wingCut && g.state === "finale" ? g.fin - g.cutF : -1, on = e >= 0;
    [streak, cres, sparks, trail, feathers, R1, R2].forEach((r) => { r.current.visible = on; });
    if (!on) return;
    const c = g.cutPos;
    const ring = (ref, mat, delay, dur, size, op) => {
      const k = clamp((e - delay) / dur, 0, 1), o = ref.current;
      o.visible = k > 0 && k < 1; o.position.copy(c); o.lookAt(camera.position);
      o.scale.setScalar(0.3 + size * (1 - (1 - k) * (1 - k))); mat.opacity = (1 - k) * op;
    };
    ring(R1, mats.r1, 0, 0.8, 9, 0.9); ring(R2, mats.r2, 0.12, 1.1, 15, 0.55);
    // the cut itself: a long white streak and a crescent of light
    const k = clamp(e / 0.14, 0, 1), fade = 1 - clamp((e - 0.1) / 0.55, 0, 1);
    streak.current.position.copy(c); streak.current.rotation.z = -0.55;
    streak.current.scale.set(Math.max(0.001, 16 * k), 0.012 + 0.1 * fade, 0.1); mats.streak.opacity = fade;
    cres.current.position.copy(c); cres.current.lookAt(camera.position);
    cres.current.scale.setScalar(0.5 + 1.2 * clamp(e / 0.5, 0, 1)); mats.cres.opacity = 1 - clamp((e - 0.05) / 0.7, 0, 1);
    sparks.current.position.copy(c); sparks.current.visible = e < 3;
    trail.current.position.set(g.x, g.y, 0); trail.current.visible = e > 0.2;
    FD.forEach((f, i) => {
      const kk = (1 - Math.exp(-1.2 * e)) / 1.2;
      d.position.set(c.x + f.v[0] * kk + Math.sin(e * f.sp + f.ph) * 0.4, c.y + f.v[1] * kk - 1.2 * e * e + Math.cos(e * f.sp) * 0.3, c.z + f.v[2] * kk);
      d.rotation.set(e * f.sp * 0.6, f.ph + e * 1.2, e * f.sp);
      d.scale.setScalar(f.s * sm(0, 0.05, e) * (1 - sm(3.5, 5.2, e)));
      d.updateMatrix(); feathers.current.setMatrixAt(i, d.matrix);
    });
    feathers.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <mesh ref={R1} geometry={TOR} material={mats.r1} visible={false} />
      <mesh ref={R2} geometry={TOR} material={mats.r2} visible={false} />
      <mesh ref={streak} geometry={BOX} material={mats.streak} visible={false} />
      <group ref={cres} visible={false}><mesh geometry={CRESCENT} material={mats.cres} rotation={[0, 0, -0.7]} /></group>
      <group ref={sparks} visible={false}><Sparkles count={90} scale={[7, 7, 7]} size={9} speed={1.5} color="#ffd27a" /></group>
      <group ref={trail} visible={false}>
        <Sparkles count={50} scale={[3, 6, 3]} size={7} speed={1.2} color="#ff9a3a" />
        <Sparkles count={24} scale={[3, 7, 3]} size={16} speed={0.7} opacity={0.45} color="#3a2a26" />
      </group>
      <instancedMesh ref={feathers} args={[FEATHER, fm.plain, 46]} frustumCulled={false} visible={false} />
    </>
  );
}

function SeveredWing({ G }) {
  const ref = useRef();
  useFrame(() => {
    const g = G.current, o = ref.current;
    o.visible = g.wingCut && g.state !== "idle";
    if (!o.visible) return;
    const e = Math.max(0, g.fin - g.cutF);
    o.position.set(g.cutPos.x + 3.2 * e, g.cutPos.y + 3.5 * e - 4.2 * e * e, g.cutPos.z + 1.2 * e);
    o.rotation.set(e * 1.6, e * 0.8, -e * 2.4);
  });
  return <group ref={ref} scale={1.9} visible={false}><Wing side={1} /></group>;
}

/* ---------------- PUSHPAKA VIMANA + RAVANA ---------------- */

function Head({ p, ry, s = 1 }) {
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      <mesh geometry={SPH} material={M.dark} position={[0, 0.06, -0.06]} scale={[0.165, 0.16, 0.13]} />
      <mesh geometry={SPH} material={M.skin} scale={[0.15, 0.17, 0.15]} />
      <mesh geometry={SPH} material={M.skinD} position={[0, -0.09, 0.09]} scale={[0.09, 0.06, 0.07]} />
      <mesh geometry={CONE} material={M.skinD} position={[0, -0.01, 0.15]} rotation={[Math.PI / 2, 0, 0]} scale={[0.03, 0.07, 0.03]} />
      <mesh geometry={BOX} material={M.red} position={[0, -0.105, 0.135]} scale={[0.07, 0.012, 0.02]} />
      {/* tilak */}
      <mesh geometry={BOX} material={M.silk} position={[0, 0.075, 0.148]} scale={[0.014, 0.075, 0.01]} />
      {/* crown: band, jewels, spikes, spire */}
      <mesh geometry={CYL} material={M.gold} position={[0, 0.125, 0]} scale={[0.158, 0.05, 0.158]} />
      <mesh geometry={TOR} material={M.goldD} position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.158} />
      <mesh geometry={CONE} material={M.gold} position={[0, 0.25, 0]} scale={[0.14, 0.24, 0.14]} />
      <mesh geometry={CONE} material={M.goldD} position={[0, 0.42, 0]} scale={[0.065, 0.14, 0.065]} />
      <mesh geometry={SPH} material={M.ruby} position={[0, 0.5, 0]} scale={0.022} />
      {[-0.1, 0, 0.1].map((x) => <mesh key={x} geometry={SPH} material={x ? M.pearl : M.ruby} position={[x, 0.125, 0.155 - Math.abs(x) * 0.25]} scale={0.02} />)}
      {[-0.11, 0.11].map((x) => <mesh key={x} geometry={CONE} material={M.gold} position={[x, 0.2, 0.06]} rotation={[0.2, 0, -x * 2.2]} scale={[0.03, 0.13, 0.03]} />)}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh geometry={SPH} material={M.white} position={[sd * 0.06, 0.03, 0.125]} scale={[0.03, 0.02, 0.02]} />
          <mesh geometry={SPH} material={M.eye} position={[sd * 0.06, 0.03, 0.138]} scale={[0.018, 0.016, 0.012]} />
          <mesh geometry={BOX} material={M.dark} position={[sd * 0.06, 0.07, 0.14]} rotation={[0, 0, sd * -0.4]} scale={[0.075, 0.014, 0.02]} />
          <mesh position={[sd * 0.052, -0.07, 0.13]} rotation={[0, 0, sd * 1.15]} material={M.dark}><capsuleGeometry args={[0.013, 0.09, 3, 6]} /></mesh>
          <mesh geometry={CONE} material={M.white} position={[sd * 0.034, -0.12, 0.128]} rotation={[Math.PI, 0, 0]} scale={[0.012, 0.04, 0.012]} />
          <mesh geometry={SPH} material={M.skin} position={[sd * 0.15, -0.02, -0.01]} scale={[0.03, 0.06, 0.03]} />
          <mesh geometry={TOR} material={M.gold} position={[sd * 0.17, -0.07, -0.01]} rotation={[0, Math.PI / 2, 0]} scale={0.035} />
          <mesh geometry={SPH} material={M.ruby} position={[sd * 0.175, -0.115, -0.01]} scale={0.016} />
        </group>
      ))}
    </group>
  );
}

function ArmM({ len = 0.5, r = 0.09, children, ...props }) {
  return (
    <group {...props}>
      <mesh position={[0, len / 2, 0]} material={M.skin}><capsuleGeometry args={[r, len, 5, 8]} /></mesh>
      <mesh geometry={TOR} material={M.gold} position={[0, len * 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} scale={r * 1.25} />
      <mesh geometry={TOR} material={M.gold} position={[0, len * 0.9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={r * 1.1} />
      <mesh geometry={SPH} material={M.skin} position={[0, len + r * 0.8, 0]} scale={r * 1.2} />
      {children && <group position={[0, len + r * 1.0, 0]}>{children}</group>}
    </group>
  );
}

/* weapons carried in Ravana's spare hands, all built along +Y from the grip */
function Trishul() {
  return (
    <group>
      <mesh geometry={CYL} material={M.goldD} position={[0, 0.5, 0]} scale={[0.026, 1.5, 0.026]} />
      <mesh geometry={TOR} material={M.gold} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.045} />
      <mesh geometry={CONE} material={M.silk} position={[0, -0.3, 0]} rotation={[Math.PI, 0, 0]} scale={[0.04, 0.14, 0.04]} />
      <mesh position={[0, 1.27, 0]} rotation={[0, 0, Math.PI]} material={M.gold}><torusGeometry args={[0.16, 0.028, 6, 18, Math.PI]} /></mesh>
      <mesh geometry={CONE} material={M.steel} position={[0, 1.5, 0]} scale={[0.05, 0.5, 0.05]} />
      {[-1, 1].map((sd) => <mesh key={sd} geometry={CONE} material={M.steel} position={[sd * 0.16, 1.45, 0]} rotation={[0, 0, -sd * 0.1]} scale={[0.036, 0.36, 0.036]} />)}
      <mesh geometry={SPH} material={M.ruby} position={[0, 1.2, 0]} scale={0.045} />
    </group>
  );
}
function Gada() {
  return (
    <group>
      <mesh geometry={CYL} material={M.goldD} position={[0, 0.35, 0]} scale={[0.032, 1.15, 0.032]} />
      <mesh geometry={TOR} material={M.gold} position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.06} />
      <mesh geometry={ICO} material={M.gold} position={[0, 1.1, 0]} scale={[0.21, 0.26, 0.21]} />
      <mesh geometry={TOR} material={M.ruby} position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.21} />
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} rotation={[0, -(i / 8) * Math.PI * 2, 0]}>
          <mesh geometry={CONE} material={M.steel} position={[0.22, 1.1, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.05, 0.15, 0.05]} />
        </group>
      ))}
      <mesh geometry={CONE} material={M.steel} position={[0, 1.4, 0]} scale={[0.06, 0.2, 0.06]} />
    </group>
  );
}
function Chakra() {
  const ref = useRef();
  useFrame(({ clock }) => { ref.current.rotation.z = clock.elapsedTime * 7; });
  return (
    <group position={[0, 0.5, 0]}>
      <group ref={ref}>
        <mesh geometry={TOR} material={M.steel} scale={0.46} />
        <mesh geometry={TOR} material={M.gold} scale={0.3} />
        {Array.from({ length: 12 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i / 12) * Math.PI * 2]}>
            <mesh geometry={CONE} material={M.steel} position={[0, 0.52, 0]} scale={[0.05, 0.15, 0.05]} />
          </group>
        ))}
        <mesh geometry={SPH} material={M.ruby} scale={0.07} />
      </group>
      <mesh><ringGeometry args={[0.3, 0.58, 32]} /><meshBasicMaterial color="#ffb040" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}
function Parashu() {
  return (
    <group>
      <mesh geometry={CYL} material={M.goldD} position={[0, 0.4, 0]} scale={[0.03, 1.3, 0.03]} />
      <mesh geometry={AXE} material={M.steel} position={[0, 0.95, 0]} />
      <mesh geometry={AXE} material={M.steel} position={[0, 0.95, 0]} scale={[-0.8, 0.8, 1]} />
      <mesh geometry={TOR} material={M.gold} position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.055} />
      <mesh geometry={CONE} material={M.steel} position={[0, 1.18, 0]} scale={[0.04, 0.22, 0.04]} />
      <mesh geometry={SPH} material={M.ruby} position={[0, 0.95, 0.04]} scale={0.035} />
    </group>
  );
}

function Ravana({ r, mats }) {
  // ten heads, one level row, shoulder to shoulder
  const heads = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const x = (i - 4.5) * 0.335;
    return { p: [x, 1.74, 0.02], ry: x * 0.26, s: 0.92 };
  }), []);
  const fan = useMemo(() => ({
    "-1": [<Trishul key="a" />, <Chakra key="b" />, <Parashu key="c" />],
    1: [<Gada key="a" />, <Chakra key="b" />, <Parashu key="c" />],
  }), []);
  return (
    <group position={[0, 0.5, 2.2]} scale={1.35}>
      <group ref={r.body}>
        {/* dhoti, belt and sash */}
        <mesh position={[0, 0.3, 0]} material={M.silk}><cylinderGeometry args={[0.4, 0.6, 0.66, 20]} /></mesh>
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}><torusGeometry args={[0.6, 0.03, 6, 28]} /></mesh>
        <mesh position={[0, 0.58, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}><torusGeometry args={[0.4, 0.05, 8, 22]} /></mesh>
        <mesh geometry={SPH} material={M.ruby} position={[0, 0.58, 0.4]} scale={0.07} />
        <mesh position={[0.05, 0.95, 0.2]} rotation={[0.15, 0, 0.75]} material={M.silk}><capsuleGeometry args={[0.04, 0.95, 4, 8]} /></mesh>
        {/* torso */}
        <mesh position={[0, 0.8, 0]} scale={[1.05, 1, 0.8]} material={M.skin}><capsuleGeometry args={[0.38, 0.45, 6, 14]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} geometry={SPH} material={M.skin} position={[s * 0.17, 1.0, 0.27]} scale={[0.19, 0.15, 0.1]} />)}
        {[0.32, 0.37, 0.42].map((rad, i) => (
          <mesh key={i} geometry={TOR} material={i === 1 ? M.ruby : M.gold} position={[0, 1.16 - i * 0.07, 0.04 + i * 0.02]} rotation={[Math.PI / 2 + 0.45, 0, 0]} scale={rad} />
        ))}
        <mesh geometry={SPH} material={M.ruby} position={[0, 0.98, 0.4]} scale={0.05} />
        <mesh position={[0, 1.27, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}><torusGeometry args={[0.3, 0.045, 8, 22]} /></mesh>
        <mesh geometry={CYL} material={M.skin} position={[0, 1.4, 0]} scale={[0.34, 0.3, 0.28]} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh geometry={SPH} material={M.gold} position={[s * 0.52, 1.12, 0]} scale={[0.2, 0.16, 0.2]} />
            <mesh geometry={CONE} material={M.gold} position={[s * 0.56, 1.3, 0]} rotation={[0, 0, -s * 0.4]} scale={[0.05, 0.16, 0.05]} />
          </group>
        ))}
        <Cloth w={0.95} h={1.45} axis="y" color="#7a1f1a" position={[0, 0.8, -0.38]} amp={0.14} speed={3} />

        {/* ten heads in a plain horizontal row */}
        {heads.map((h, i) => <Head key={i} {...h} />)}

        {/* many arms, fanned behind the shoulders, each with a divine weapon */}
        {[-1, 1].flatMap((s) => [0, 1, 2].map((i) => (
          <ArmM key={`${s}${i}`} position={[s * 0.5, 1.0 - i * 0.12, -0.12]} rotation={[0.35, 0, -s * (1.1 + i * 0.4)]} len={0.6} r={0.075}>
            {fan[s][i]}
          </ArmM>
        )))}

        {/* left hand holds the bow */}
        <ArmM position={[-0.55, 1.0, 0.1]} rotation={[1.35, 0, -0.5]} len={0.6} r={0.09} />
        <group ref={r.bow} position={[-0.22, 1.12, 0.8]} scale={0.86}>
          <mesh geometry={BOW_CORE} material={M.lacq} />
          <Inst geo={SLEEVE} mat={M.gold} items={BOW_RINGS} />
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0, sd * 0.98, -0.6]}>
              <mesh geometry={SPH} material={M.gold} scale={0.075} />
              <mesh geometry={CONE} material={M.goldL} position={[0, sd * 0.07, 0.01]} rotation={[0, 0, sd < 0 ? Math.PI : 0]} scale={[0.05, 0.16, 0.05]} />
              <mesh geometry={SPH} material={M.ruby} position={[0, 0, 0.06]} scale={0.03} />
            </group>
          ))}
          {/* grip */}
          <mesh material={M.red}><capsuleGeometry args={[0.062, 0.34, 4, 10]} /></mesh>
          {[-0.22, 0.22].map((y) => <mesh key={y} geometry={TOR} material={M.gold} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.07} />)}
          <mesh geometry={SPH} material={M.ruby} position={[0, 0, 0.07]} scale={0.04} />
          {/* string, drawn back as the shot charges */}
          <mesh ref={r.strU} geometry={CYL} material={M.ruff} position={[0, 0.49, -0.6]} scale={[0.009, 0.98, 0.009]} />
          <mesh ref={r.strL} geometry={CYL} material={M.ruff} position={[0, -0.49, -0.6]} scale={[0.009, 0.98, 0.009]} />
          {/* nocked arrow */}
          <group ref={r.arrowG} position={[0, 0, -0.6]} visible={false}>
            <mesh geometry={CYL} material={M.goldL} position={[0, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]} scale={[0.022, 1.8, 0.022]} />
            <mesh geometry={CONE} material={M.steel} position={[0, 0, 1.95]} rotation={[Math.PI / 2, 0, 0]} scale={[0.07, 0.3, 0.07]} />
            {[0, 1, 2].map((k) => <mesh key={k} geometry={BOX} material={k === 1 ? M.white : M.silk} position={[0, 0, 0.2]} rotation={[0, 0, (k * Math.PI) / 3]} scale={[0.17, 0.008, 0.3]} />)}
          </group>
          <mesh ref={r.orb} material={mats.orb} position={[0, 0, 1.2]} scale={0.001}><sphereGeometry args={[0.5, 16, 12]} /></mesh>
        </group>

        {/* right arm and Chandrahasa swing as one rigid piece */}
        <group ref={r.arm} position={[0.55, 1.08, 0.1]} rotation={[0.5, 0, 0]}>
          <ArmM len={0.45} r={0.1} />
          <group position={[0, 0.62, 0]}>
            {/* wrapped grip, pommel and tassel */}
            <mesh geometry={CYL} material={M.red} scale={[0.04, 0.34, 0.04]} />
            {[-0.12, -0.04, 0.04, 0.12].map((y) => <mesh key={y} geometry={TOR} material={M.gold} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.05} />)}
            <mesh geometry={SPH} material={M.gold} position={[0, -0.2, 0]} scale={[0.075, 0.06, 0.075]} />
            <mesh geometry={SPH} material={M.ruby} position={[0, -0.26, 0]} scale={0.05} />
            <mesh geometry={CONE} material={M.silk} position={[0, -0.38, 0]} rotation={[Math.PI, 0, 0]} scale={[0.035, 0.16, 0.035]} />
            {/* crescent guard with quillons */}
            <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI]} material={M.gold}><torusGeometry args={[0.17, 0.03, 8, 22, Math.PI]} /></mesh>
            <mesh geometry={CYL} material={M.gold} position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.028, 0.34, 0.028]} />
            {[-1, 1].map((sd) => <mesh key={sd} geometry={SPH} material={M.goldL} position={[sd * 0.18, 0.2, 0]} scale={0.045} />)}
            <mesh geometry={SPH} material={M.ruby} position={[0, 0.21, 0.04]} scale={0.045} />
            <mesh geometry={CYL} material={M.goldL} position={[0, 0.25, 0]} scale={[0.07, 0.06, 0.05]} />
            {/* the blade: dissolves and re-forms during the finale */}
            <group ref={r.bladeG} position={[0, 0.27, 0]} scale={1.2}>
              <mesh geometry={BLADE} material={mats.blade} />
              <mesh geometry={BLADE_SPINE} material={M.goldL} />
              <mesh geometry={BLADE_RUNE} material={mats.rune} />
              <mesh geometry={BLADE} material={mats.glow} scale={[1.5, 1.03, 5]} />
            </group>
            {/* summoning flare, ring and sparks */}
            <group ref={r.summon} position={[0.12, 1.0, 0]} visible={false}>
              <mesh ref={r.flare} material={mats.flare}><sphereGeometry args={[0.5, 16, 12]} /></mesh>
              <mesh ref={r.ring} geometry={TOR} material={mats.flare} scale={0.001} />
              <group ref={r.rays}>
                {Array.from({ length: 10 }, (_, i) => <mesh key={i} rotation={[0, 0, (i / 10) * Math.PI]} material={mats.rays}><planeGeometry args={[0.1, 6]} /></mesh>)}
              </group>
              <mesh ref={r.shock} geometry={TOR} material={mats.shock} scale={0.001} />
              <group ref={r.bolts} scale={1.3}>
                {BOLTS.map((b, i) => <mesh key={i} geometry={b} material={mats.bolt} visible={false} />)}
              </group>
              <Sparkles count={46} scale={[2.2, 3.4, 2.2]} size={7} speed={1.6} color="#ffd27a" />
            </group>
            <mesh ref={r.pillar} geometry={CYL} material={mats.pillar} position={[0.15, 1.3, 0]} scale={[0.5, 3.6, 0.5]} visible={false} />
          </group>
          <mesh ref={r.trail} geometry={TRAIL} material={mats.trail} position={[0, 0.2, 0]} visible={false} />
        </group>
      </group>
    </group>
  );
}

function RoofTier({ y, sx, sz, h, mat = M.crimson }) {
  return (
    <group position={[0, y, 0]}>
      <mesh geometry={ROOF} material={mat} position={[0, h / 2, 0]} scale={[sx, h, sz]} />
      {[-1, 1].map((k) => <mesh key={`z${k}`} geometry={BOX} material={M.gold} position={[0, 0, (k * sz) / 2]} scale={[sx + 0.1, 0.06, 0.06]} />)}
      {[-1, 1].map((k) => <mesh key={`x${k}`} geometry={BOX} material={M.gold} position={[(k * sx) / 2, 0, 0]} scale={[0.06, 0.06, sz + 0.1]} />)}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => (
        <group key={`${a}${b}`} position={[(a * sx) / 2, 0, (b * sz) / 2]}>
          <mesh geometry={CONE} material={M.gold} position={[a * 0.1, 0.12, b * 0.1]} rotation={[b * 0.5, 0, -a * 0.5]} scale={[0.07, 0.4, 0.07]} />
          <mesh geometry={CONE} material={M.lamp} position={[0, -0.14, 0]} rotation={[Math.PI, 0, 0]} scale={[0.07, 0.14, 0.07]} />
        </group>
      ))}
    </group>
  );
}

function Pushpak({ G }) {
  const root = useRef(), bow = useRef(), orb = useRef(), arm = useRef(), body = useRef(), trail = useRef(), pillar = useRef();
  const bladeG = useRef(), summon = useRef(), flare = useRef(), ring = useRef(), strU = useRef(), strL = useRef(), arrowG = useRef(), rays = useRef(), shock = useRef(), bolts = useRef();
  const petals = useRef(), halo = useRef(), dmg1 = useRef(), dmg2 = useRef(), light = useRef(), jet = useRef();
  const prevCh = useRef(100), hit = useRef(0);
  const R = { body, arm, bow, orb, pillar, trail, bladeG, summon, flare, ring, strU, strL, arrowG, rays, shock, bolts };
  const fm = featherMats();
  const neck = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.3, -3.3), new THREE.Vector3(0, 0.55, -4.0), new THREE.Vector3(0, 1.2, -4.5),
    new THREE.Vector3(0, 1.9, -4.35), new THREE.Vector3(0, 2.15, -4.85),
  ]), 40, 0.2, 12), []);
  const mats = useMemo(() => ({
    hull: new THREE.MeshStandardMaterial({ color: "#dfae4c", metalness: 1, roughness: 0.2, envMapIntensity: 1.3, emissive: new THREE.Color(0, 0, 0) }),
    rays: new THREE.MeshBasicMaterial({ color: "#ffe2a0", transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    shock: new THREE.MeshBasicMaterial({ color: "#fff0c0", transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    bolt: new THREE.MeshBasicMaterial({ color: "#fff2c8", toneMapped: false }),
    rune: new THREE.MeshBasicMaterial({ color: "#ffc860", transparent: true, opacity: 0.5, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
    orb: new THREE.MeshBasicMaterial({ color: "#ffd27a", transparent: true, opacity: 0.9, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
    blade: new THREE.MeshStandardMaterial({ color: "#eef2ff", metalness: 1, roughness: 0.18, emissive: "#ffb050", emissiveIntensity: 0.1, side: THREE.DoubleSide }),
    glow: new THREE.MeshBasicMaterial({ color: "#ffcf70", transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    pillar: new THREE.MeshBasicMaterial({ color: "#ffe9a0", transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
    trail: new THREE.MeshBasicMaterial({ color: "#fff0c0", transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    flare: new THREE.MeshBasicMaterial({ color: "#ffdf90", transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    flame: new THREE.MeshBasicMaterial({ color: "#ff9a3a", transparent: true, opacity: 0.5, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
    flameC: new THREE.MeshBasicMaterial({ color: "#fff0b0", transparent: true, opacity: 0.8, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
  }), []);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05), g = G.current, t = g.t;
    const rt = root.current;
    if (g.paused) return;
    const fin = g.state === "finale";
    rt.position.set(g.px, g.py + (g.wingCut ? Math.max(0, g.fin - g.cutF) * 0.8 : 0), -g.D);
    rt.rotation.set(Math.sin(t * 0.6) * 0.03, 0, Math.sin(t * 0.9) * 0.05 + (g.stagger > 0 ? Math.sin(t * 20) * 0.05 : 0));

    // damage flash on hull
    if (g.ch < prevCh.current - 0.01) hit.current = 1;
    prevCh.current = g.ch;
    hit.current = Math.max(0, hit.current - dt * 3);
    const dmg = 1 - g.ch / 100;
    mats.hull.emissive.setRGB(hit.current * 0.9 + dmg * 0.18, hit.current * 0.7 + dmg * 0.03, hit.current * 0.4);

    // ranged windup lives on the bow
    const typ = g.windType, ranged = g.windup > 0 && (typ === "arrow" || typ === "fire" || typ === "volley");
    const w = ranged ? 1 - g.windup / g.windDur : 0;
    orb.current.scale.setScalar(Math.max(0.001, w * (typ === "fire" ? 1.5 : 0.55)));
    mats.orb.color.set(typ === "fire" ? "#ff6a2a" : "#ffd27a");
    bow.current.rotation.x = damp(bow.current.rotation.x, -w * 0.4, 8, dt);
    {
      const pull = w * 0.3, L = Math.hypot(0.98, pull), phi = Math.atan2(pull, 0.98), zn = -0.6 - pull;
      strU.current.position.set(0, 0.49, -0.6 - pull / 2); strU.current.scale.y = L; strU.current.rotation.x = phi;
      strL.current.position.set(0, -0.49, -0.6 - pull / 2); strL.current.scale.y = L; strL.current.rotation.x = -phi;
      arrowG.current.position.z = zn; arrowG.current.visible = w > 0.03;
      orb.current.position.z = zn + 2.0;
    }

    // sword pose
    let raise = 0, sp = 0, ar = 0;
    const isWave = typ.startsWith("wave");
    if (fin) {
      raise = sm(SUMMON_T, 3.0, g.fin); // blade lifted as it forms
      const wind = sm(STRIKE_T - 0.55, STRIKE_T, g.fin); // wind-back before the cut
      ar = raise * 0.63 + wind * 0.47;
      sp = clamp((g.fin - STRIKE_T) / 0.45, 0, 1);
    } else if (g.state === "play") {
      if (g.windup > 0 && typ === "slash") raise = 1 - g.windup / g.windDur;
      else if (g.windup > 0 && isWave) raise = 0.65 * (1 - g.windup / g.windDur);
      if (g.swing > 0) { raise = typ === "slash" ? 1 : 0.65; sp = 1 - g.swing / SWING_T; }
      ar = raise;
    }
    const e = 1 - (1 - sp) * (1 - sp);
    const target = 0.5 - 1.5 * ar + (fin || typ === "slash" ? 3.3 : 2.4) * e;
    arm.current.rotation.x = damp(arm.current.rotation.x, target, sp > 0 ? 34 : fin ? 6 : 9, dt);

    // blade dissolves, then re-forms larger and glowing
    let bs = 1, bk = 1.2;
    if (fin) {
      bs = g.fin < 0.9 ? 1 - sm(0.25, 0.8, g.fin) : sm(1.0, 2.7, g.fin);
      bk = 1.2 + 0.25 * sm(1.0, 2.7, g.fin);
    }
    bladeG.current.scale.set(bk * (0.4 + 0.6 * bs), bk * Math.max(0.001, bs), bk * (0.4 + 0.6 * bs));

    const pulse = 1 + Math.sin(t * 14) * 0.08;
    const gl = fin ? (0.15 + 0.85 * raise) * pulse : g.windup > 0 && (typ === "slash" || isWave) ? raise * 0.7 : g.swing > 0 ? 0.6 : 0;
    mats.glow.opacity = damp(mats.glow.opacity, gl * 0.8, 10, dt);
    mats.blade.emissiveIntensity = 0.1 + gl * 1.8;
    mats.rune.opacity = clamp(0.45 + gl * 0.55, 0, 1);

    // summoning flare, ring and sparkles
    const sumOn = fin && g.fin > 0.8 && (!g.wingCut || g.fin < g.cutF + 0.7);
    summon.current.visible = sumOn;
    if (sumOn) {
      const s = sm(0.9, 2.8, g.fin) * (g.wingCut ? Math.max(0, 1 - (g.fin - g.cutF) * 1.5) : 1);
      flare.current.scale.setScalar(Math.max(0.001, s * 2.2 * pulse));
      ring.current.scale.setScalar(Math.max(0.001, s * 1.8));
      ring.current.rotation.set(Math.PI / 2 + Math.sin(t * 3) * 0.4, 0, t * 3);
      mats.flare.opacity = s * 0.28;
      rays.current.rotation.z = t * 0.8; mats.rays.opacity = s * 0.32;
      const sk = clamp((g.fin - 1.15) / 0.9, 0, 1);
      shock.current.visible = sk > 0 && sk < 1; shock.current.scale.setScalar(0.4 + sk * 7); mats.shock.opacity = (1 - sk) * 0.8;
      if (Math.random() < 0.5) bolts.current.children.forEach((m) => { m.visible = Math.random() < 0.4 * s; m.rotation.z = Math.random() * 6.28; });
    }

    pillar.current.visible = fin && (!g.wingCut ? raise > 0.05 : g.fin < g.cutF + 0.8);
    mats.pillar.opacity = fin ? raise * 0.5 * (g.wingCut ? Math.max(0, 1 - (g.fin - g.cutF) * 1.25) : 1 - sp * 0.5) : 0;
    const showT = sp > 0.04 && (!fin || !g.wingCut || g.fin < g.cutF + 0.9);
    trail.current.visible = showT;
    mats.trail.opacity = showT ? (fin ? clamp(1 - (g.fin - STRIKE_T - 0.3) / 0.9, 0, 1) : 1 - sp) * 0.9 : 0;

    body.current.rotation.x = damp(body.current.rotation.x, g.stagger > 0 ? -0.35 : 0, 8, dt);
    petals.current.rotation.y = t * 0.5;
    halo.current.rotation.z = t * 0.4;
    jet.current.scale.set(1 + Math.sin(t * 22) * 0.06, 1 + Math.cos(t * 17) * 0.06, 1 + Math.sin(t * 13) * 0.12 + g.boost * 0.2);
    dmg1.current.visible = g.ch < 70; dmg2.current.visible = g.ch < 42;
    light.current.intensity = 6 + (g.windup > 0 ? 10 * (1 - g.windup / g.windDur) : 0) + (fin ? 40 * raise * pulse : 0);
  });

  return (
    <group ref={root} scale={1.9}>
      {/* hull */}
      <mesh geometry={SPH} material={mats.hull} scale={[1.7, 0.55, 3.8]} />
      <mesh geometry={SPH} material={M.goldD} position={[0, -0.35, 0]} scale={[1.2, 0.4, 3.0]} />
      <Inst geo={SPH} mat={M.ruby} items={JEWELS} />
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 2.1, 1]} material={M.gold}><torusGeometry args={[1.62, 0.06, 8, 32]} /></mesh>
      <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.67, 3.74, 1]} material={M.gold}><torusGeometry args={[1, 0.03, 8, 56]} /></mesh>
      <mesh geometry={BOX} material={M.red} position={[0, 0.4, 0]} scale={[2.9, 0.12, 6]} />
      <mesh geometry={BOX} material={M.gold} position={[0, 0.34, 0]} scale={[3.05, 0.06, 6.15]} />
      <Inst geo={CONE} mat={M.gold} items={KANGURA} />
      {/* swan prow: a sculpted neck and head */}
      <mesh geometry={neck} material={M.gold} />
      {[0.12, 0.3, 0.5, 0.7, 0.88].map((u, i) => {
        const v = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.3, -3.3), new THREE.Vector3(0, 0.55, -4.0), new THREE.Vector3(0, 1.2, -4.5),
          new THREE.Vector3(0, 1.9, -4.35), new THREE.Vector3(0, 2.15, -4.85),
        ]).getPoint(u);
        return <mesh key={i} geometry={TOR} material={M.goldD} position={[v.x, v.y, v.z]} rotation={[Math.PI / 2 - u * 0.9, 0, 0]} scale={0.25} />;
      })}
      <mesh geometry={SPH} material={M.gold} position={[0, 2.17, -4.97]} scale={[0.26, 0.24, 0.32]} />
      <mesh geometry={CONE} material={M.petal} position={[0, 2.08, -5.4]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.1, 0.4, 0.1]} />
      {[-1, 1].map((s) => <mesh key={s} geometry={SPH} material={M.dark} position={[s * 0.15, 2.25, -4.95]} scale={0.04} />)}
      {[0, 1, 2].map((i) => <mesh key={i} geometry={CONE} material={M.gold} position={[0, 2.42 + i * 0.02, -4.85 + i * 0.13]} rotation={[0.6, 0, 0]} scale={[0.04, 0.22, 0.04]} />)}
      {/* swan wings sweeping up both sides */}
      <Inst geo={FEATHER} mat={fm.gold} items={SWAN_W} />
      {/* lotus petals */}
      <group ref={petals}>
        <Inst geo={SPH} mat={M.gem} items={MANDALA} />
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <group key={i} position={[Math.sin(a) * 1.2, -0.8, Math.cos(a) * 1.9]} rotation={[0, a, 0]}>
              <mesh geometry={SPH} material={M.petal} rotation={[-0.35, 0, 0]} scale={[0.2, 0.75, 0.07]} />
            </group>
          );
        })}
      </group>
      {/* rails */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={BOX} material={M.gold} position={[s * 1.4, 0.85, 0]} scale={[0.05, 0.05, 5.8]} />
          {[-2.8, -1.4, 0, 1.4, 2.8].map((z) => <mesh key={z} geometry={CYL} material={M.gold} position={[s * 1.4, 0.62, z]} scale={[0.04, 0.45, 0.04]} />)}
        </group>
      ))}
      <Inst geo={SPH} mat={M.flower} items={GARLAND} />
      <Inst geo={SPH} mat={M.gem} items={HULL_GEMS} />
      <Inst geo={ICO} mat={M.goldL} items={HULL_PETALS} />
      {/* peacock-style tail fan at the stern, and streaming silk ribbons */}
      <Inst geo={FEATHER} mat={fm.gold} items={TAIL_FAN} />
      {[-1, 1].map((sd) => <Cloth key={sd} w={1.8} h={0.3} axis="x" color={sd < 0 ? "#e0a020" : "#b8321f"} position={[sd * 1.25, 1.1, 5.0]} rotation={[0, Math.PI / 2, 0]} amp={0.3} speed={7} />)}
      {/* pavilion */}
      <group position={[0, 0, -1]}>
        <mesh geometry={BOX} material={M.goldD} position={[0, 0.52, 0]} scale={[2.4, 0.14, 3.2]} />
        <mesh geometry={BOX} material={M.silk} position={[0, 0.6, 0]} scale={[2.0, 0.02, 2.8]} />
        {[-1, 1].flatMap((s) => [-1.4, 0, 1.4].map((z) => (
          <group key={`${s}${z}`} position={[s * 1.0, 0, z]}>
            <mesh geometry={CYL} material={M.gold} position={[0, 1.55, 0]} scale={[0.07, 1.9, 0.07]} />
            <mesh geometry={CYL} material={M.goldD} position={[0, 0.68, 0]} scale={[0.12, 0.1, 0.12]} />
            <mesh geometry={SPH} material={M.gold} position={[0, 2.5, 0]} scale={0.1} />
          </group>
        )))}
        {[-1, 1].flatMap((s) => [-0.7, 0.7].map((z) => (
          <mesh key={`a${s}${z}`} position={[s * 1.0, 1.95, z]} rotation={[0, Math.PI / 2, 0]} material={M.gold}><torusGeometry args={[0.6, 0.035, 6, 20, Math.PI]} /></mesh>
        )))}
        {[-1, 1].map((s) => <Cloth key={s} w={1.1} h={1.4} axis="y" color="#9c2a22" position={[s * 1.0, 1.4, -0.7]} rotation={[0, Math.PI / 2, 0]} amp={0.1} speed={2.4} />)}
        <Inst geo={SPH} mat={M.pearl} items={PEARLS} />
        <RoofTier y={2.5} sx={2.8} sz={3.6} h={0.6} />
        <mesh geometry={BOX} material={M.red} position={[0, 3.05, 0]} scale={[1.7, 0.7, 2.4]} />
        <mesh geometry={BOX} material={M.gold} position={[0, 2.72, 0]} scale={[1.78, 0.06, 2.48]} />
        {[-1, 1].map((s) => <mesh key={`w${s}`} geometry={BOX} material={M.lamp} position={[s * 0.86, 3.05, 0]} scale={[0.02, 0.4, 0.9]} />)}
        {[-1, 1].map((s) => <mesh key={`v${s}`} geometry={BOX} material={M.lamp} position={[0, 3.05, s * 1.21]} scale={[0.6, 0.4, 0.02]} />)}
        <RoofTier y={3.4} sx={2.2} sz={3.0} h={0.55} mat={M.red} />
        <mesh geometry={BOX} material={M.crimson} position={[0, 4.15, 0]} scale={[0.9, 0.5, 1.3]} />
        <RoofTier y={4.35} sx={1.3} sz={1.9} h={0.55} />
        <mesh geometry={SPH} material={M.gold} position={[0, 4.98, 0]} scale={0.26} />
        <mesh geometry={CONE} material={M.gold} position={[0, 5.3, 0]} scale={[0.05, 0.4, 0.05]} />
        <mesh geometry={SPH} material={M.ruby} position={[0, 5.55, 0]} scale={0.07} />
        <mesh geometry={CYL} material={M.gold} position={[0, 5.95, 0]} scale={[0.02, 0.8, 0.02]} />
        <Cloth w={0.95} h={0.42} axis="x" color="#e0a020" position={[0.5, 6.2, 0]} amp={0.12} speed={7} />
      </group>
      {/* banners */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.4, 0.6, 2.6]}>
          <mesh geometry={CYL} material={M.gold} position={[0, 0.8, 0]} scale={[0.025, 0.8, 0.025]} />
          <mesh geometry={SPH} material={M.gold} position={[0, 1.62, 0]} scale={0.05} />
          <Cloth w={0.9} h={0.5} axis="x" color="#b8321f" position={[0, 1.3, 0.45]} rotation={[0, -Math.PI / 2, 0]} amp={0.14} speed={6} />
        </group>
      ))}
      {/* Sita */}
      <group position={[0, 0.55, -1.2]} scale={0.9}>
        <mesh geometry={CONE} material={M.sari} position={[0, 0.4, 0]} scale={[0.38, 0.9, 0.38]} />
        <mesh geometry={SPH} material={M.skin} position={[0, 1.0, 0]} scale={0.17} />
        <mesh geometry={SPH} material={M.dark} position={[0, 1.07, 0.04]} scale={[0.18, 0.15, 0.17]} />
        <mesh geometry={SPH} material={M.gold} position={[0, 1.18, -0.12]} scale={0.05} />
        <mesh position={[0, 0.78, 0.2]} rotation={[1.2, 0, 0.3]} material={M.skin}><capsuleGeometry args={[0.04, 0.4, 4, 6]} /></mesh>
      </group>
      {/* halo behind Ravana */}
      <group position={[0, 3.3, 1.7]} scale={[1.45, 1, 1]}>
        <mesh ref={halo}><torusGeometry args={[2.1, 0.035, 8, 48]} /><meshBasicMaterial color="#ffd27a" toneMapped={false} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
        <mesh><circleGeometry args={[2.1, 32]} /><meshBasicMaterial color="#ff9a4a" toneMapped={false} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      </group>
      <mesh position={[0, -0.95, 0]} rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.4, 1.7, 32]} /><meshBasicMaterial color="#ffb860" transparent opacity={0.55} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      {[-1, 1].flatMap((s) => [-3, -1.2, 0.8, 2.6].map((z) => (
        <group key={`l${s}${z}`} position={[s * 1.5, 0.3, z]}>
          <mesh geometry={CYL} material={M.gold} position={[0, -0.25, 0]} scale={[0.012, 0.25, 0.012]} />
          <mesh geometry={SPH} material={M.lamp} position={[0, -0.6, 0]} scale={0.15} />
        </group>
      )))}
      <Ravana r={R} mats={mats} />
      {/* magical propulsion */}
      <group ref={jet} position={[0, 0.1, 3.9]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.4]} material={mats.flame}><coneGeometry args={[0.6, 2.8, 14, 1, true]} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.9]} material={mats.flameC}><coneGeometry args={[0.3, 1.8, 12, 1, true]} /></mesh>
      </group>
      <pointLight ref={light} position={[0, 1, 4]} color="#ffa040" intensity={6} distance={22} />
      <Sparkles count={50} position={[0, 0, 7]} scale={[2, 2, 7]} size={4} speed={1} color="#ffd27a" />
      {/* damage: embers then smoke */}
      <group ref={dmg1} visible={false}><Sparkles count={36} position={[0, 1, 0]} scale={[3, 1.5, 6]} size={5} speed={2.2} color="#ff6a2a" /></group>
      <group ref={dmg2} visible={false}><Sparkles count={26} position={[0, 1.4, 1]} scale={[3, 2, 6]} size={14} speed={0.8} opacity={0.5} color="#3a2a26" /></group>
    </group>
  );
}

/* ---------------- PROJECTILES + BURSTS ---------------- */

const PJ = (() => {
  const b = (color, o = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });
  const add = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  return {
    shaft: b("#fff0c0"), gold: b("#ffc84a"), head: b("#ffffff"), red: b("#ff5a2a", { side: THREE.DoubleSide }), cream: b("#fff6dc", { side: THREE.DoubleSide }),
    aura: add("#ffb040", 0.38), tail: add("#ff8a30", 0.42), core: b("#fff4cc"), f1: add("#ffb02a", 0.85), f2: add("#ff4a14", 0.38),
    tailF: add("#ff7a1e", 0.45), ember: b("#ffc060"), ring: add("#ffd070", 0.7),
  };
})();
const AR_SHAFT = new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8).rotateX(Math.PI / 2);
const AR_HEAD = new THREE.ConeGeometry(0.17, 0.6, 8).rotateX(Math.PI / 2);
const AR_BAND = new THREE.TorusGeometry(0.065, 0.02, 6, 12);
const AR_FLETCH = new THREE.BoxGeometry(0.34, 0.02, 0.6);
const AR_TAIL = new THREE.ConeGeometry(0.24, 2.6, 10, 1, true).rotateX(-Math.PI / 2);
const FL_TAIL = new THREE.ConeGeometry(0.8, 1, 8, 1, true).rotateX(-Math.PI / 2);

function Projectiles({ G }) {
  const refs = useRef([]);
  useFrame(() => {
    const g = G.current;
    g.proj.forEach((p, i) => {
      const o = refs.current[i];
      if (!o) return;
      o.visible = p.on;
      if (!p.on) return;
      o.position.copy(p.pos);
      o.lookAt(p.pos.x + p.vel.x, p.pos.y + p.vel.y, p.pos.z + p.vel.z);
      const fire = p.type === "fire", wave = p.type === "wave";
      o.children[0].visible = !fire && !wave; o.children[1].visible = fire; o.children[2].visible = wave;
      if (fire) {
        const fg = o.children[1];
        fg.scale.setScalar(1 + Math.sin(g.t * 20 + i) * 0.1);
        fg.children[3].scale.z = 1 + Math.sin(g.t * 17 + i) * 0.18;
        fg.children[4].rotation.z = g.t * 8 + i;
        fg.children[5].rotation.z = -g.t * 5;
      }
      if (wave) o.children[2].rotation.z = p.orient === "v" ? Math.PI / 2 : 0;
    });
  });
  return Array.from({ length: 18 }, (_, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
      {/* arrow: gold-banded shaft, steel head, fletching, glowing aura and streaming tail */}
      <group>
        <mesh geometry={AR_SHAFT} material={PJ.shaft} />
        {[-0.9, -0.55, 0.9].map((z) => <mesh key={z} geometry={AR_BAND} material={PJ.gold} position={[0, 0, z]} />)}
        <mesh geometry={AR_HEAD} material={PJ.head} position={[0, 0, 1.6]} />
        <mesh geometry={AR_HEAD} material={PJ.gold} position={[0, 0, 1.25]} scale={[0.55, 0.55, 0.45]} />
        {[0, 1, 2].map((k) => <mesh key={k} geometry={AR_FLETCH} material={k === 1 ? PJ.cream : PJ.red} position={[0, 0, -1.1]} rotation={[0, 0, (k * Math.PI) / 3]} />)}
        <mesh geometry={SPH} material={PJ.aura} position={[0, 0, 1.3]} scale={[0.3, 0.3, 0.9]} />
        <mesh geometry={AR_TAIL} material={PJ.tail} position={[0, 0, -1.9]} />
      </group>
      {/* fireball: white-hot core, layered flame, four streaming tongues, orbiting embers */}
      <group>
        <mesh geometry={SPH} material={PJ.core} scale={0.55} />
        <mesh geometry={SPH} material={PJ.f1} scale={0.85} />
        <mesh geometry={SPH} material={PJ.f2} scale={1.35} />
        <group>
          {[3.2, 2.6, 3.6, 2.9].map((L, k) => (
            <mesh key={k} geometry={FL_TAIL} material={PJ.tailF} position={[Math.cos(k * 1.571) * 0.35, Math.sin(k * 1.571) * 0.35, -0.7 - L * 0.5]} scale={[0.55, 0.55, L]} />
          ))}
        </group>
        <group>
          {Array.from({ length: 7 }, (_, k) => (
            <mesh key={k} geometry={SPH} material={PJ.ember} position={[Math.cos((k / 7) * 6.283) * 1.5, Math.sin((k / 7) * 6.283) * 1.5, (k % 3 - 1) * 0.5]} scale={0.11} />
          ))}
        </group>
        <mesh geometry={TOR} material={PJ.ring} scale={1.25} />
      </group>
      {/* sword wave: a crescent moon of white-hot steel with a golden bloom and afterimages */}
      <group>
        <mesh geometry={CRESCENT} material={WAVE_M} />
        <mesh geometry={CRESCENT} material={WAVE_G} scale={[1.05, 1.12, 3.2]} />
        {[1, 2, 3].map((k) => <mesh key={k} geometry={CRESCENT} material={WAVE_A[k - 1]} position={[0, 0, -k * 1.1]} scale={[1 - k * 0.04, 1 - k * 0.05, 1]} />)}
      </group>
    </group>
  ));
}

function Bursts({ G }) {
  const refs = useRef([]);
  useFrame((_, dt) => {
    G.current.bursts.forEach((b, i) => {
      const m = refs.current[i];
      if (!m) return;
      b.life = Math.max(0, b.life - Math.min(dt, 0.05));
      m.visible = b.life > 0;
      if (!m.visible) return;
      m.position.copy(b.pos);
      m.scale.setScalar(0.6 + (1 - b.life / 0.6) * 3.6);
      m.material.opacity = b.life / 0.6; m.material.color.set(b.color);
    });
  });
  return Array.from({ length: 14 }, (_, i) => (
    <mesh key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
      <sphereGeometry args={[0.7, 12, 10]} />
      <meshBasicMaterial transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  ));
}

/* ---------------- DIRECTOR: LOGIC + CAMERA ---------------- */

function Director({ G, cb, ret, root }) {
  const { camera, size } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const cA = useMemo(() => new THREE.Vector3(), []);
  const cB = useMemo(() => new THREE.Vector3(), []);
  const lA = useMemo(() => new THREE.Vector3(), []);
  const lB = useMemo(() => new THREE.Vector3(), []);
  const lc = useMemo(() => new THREE.Vector3(), []); // smoothed look target
  useFrame((_, raw) => {
    const g = G.current, dt = Math.min(raw, 0.05);
    if (g.paused) return;
    if (g.state === "play") step(g, dt, cb.current);
    else if (g.state === "finale") finaleStep(g, dt, cb.current);
    else if (g.state === "opening") openingStep(g, dt, cb.current);
    else {
      g.t += dt; g.hurt = Math.max(0, g.hurt - dt * 2); g.shake = Math.max(0, g.shake - dt * 2); g.flash = Math.max(0, g.flash - dt * 2);
      g.x = damp(g.x, Math.sin(g.t * 0.4) * 2.5, 2, dt); g.y = damp(g.y, Math.sin(g.t * 0.6), 2, dt);
      g.boost = damp(g.boost, g.state === "idle" ? 0.3 : 0, 3, dt); g.D = damp(g.D, g.state === "end" ? 26 : 18, 2, dt);
      if (g.state === "idle") g.fade = damp(g.fade, 0, 2, dt);
      g.vx = 0; g.vy = 0;
    }
    g.px = Math.sin(g.t * 0.4) * 3.8; g.py = Math.sin(g.t * 0.55) * 1.6 + 0.6;
    g.dist += (14 + g.boost * 12) * dt;

    let fovT;
    if (g.state === "finale") {
      const f = g.fin;
      if (!g.wingCut) {
        const rz = -g.D + 4.2, rx = g.px + 0.4, ry = g.py + 3.4; // Ravana's world position
        const k = sm(0.4, 3.0, f), raise = sm(SUMMON_T, 3.0, f), s = sm(DASH_T - 0.2, DASH_T + 0.7, f);
        // A: slow push-in over Jatayu's shoulder onto Ravana and the forming blade
        cA.set(rx + 1.2 - k * 0.8, ry + 0.4 + k * 0.3, rz + 12.5 - k * 2.0);
        lA.set(rx + 0.2, ry + 1.3 + raise * 1.2, rz);
        // B: 3/4 front view of the charge and the strike
        cB.set(g.px + 9, g.py + 3.2, 7.5);
        lB.set(g.px + 0.6, g.y + 1.6, rz * 0.5);
        tmp.lerpVectors(cA, cB, s); look.lerpVectors(lA, lB, s);
        tmp.x += Math.sin(g.t * 0.8) * 0.25 * (1 - s);
        fovT = (44 - k * 6) * (1 - s) + 48 * s - sm(STRIKE_T - 0.3, STRIKE_T + 0.2, f) * 8;
      } else {
        const ee = Math.max(0, f - g.cutF), a = 0.7 + ee * 0.3, dd = 10 + ee * 2.0;
        tmp.set(g.x + Math.sin(a) * dd, g.y + 2.2 + ee * 0.9, Math.cos(a) * dd);
        look.set(g.x, g.y - 0.2, -0.5);
        fovT = 40 + clamp(ee, 0, 1.2) * 14;
      }
      const sh = g.shake * 0.35;
      tmp.x += (Math.random() - 0.5) * sh; tmp.y += (Math.random() - 0.5) * sh;
      camera.position.lerp(tmp, 1 - Math.exp(-3.2 * dt));
      lc.lerp(look, 1 - Math.exp(-5 * dt));
      camera.lookAt(lc);
      if (!g.wingCut) camera.rotateZ(sm(DASH_T, STRIKE_T, f) * 0.09);
      camera.fov = damp(camera.fov, fovT, 4, dt);
    } else if (g.state === "opening") {
      // front aerial shot, then a long orbit over Jatayu's shoulder into the normal chase rig
      const o = g.op, s = sm(4.0, OP_END, o);
      const ang = (Math.PI - 0.16) * (1 - s);
      const R = (12 + 4.5 * sm(0, 4, o)) * (1 - s) + 8.8 * s;
      const cy = (6.4 - 2.6 * sm(0.8, 4, o)) * (1 - s) + (g.y * 0.65 + 2.8) * s;
      cA.set(g.x * 0.75 + Math.sin(ang) * R, cy, Math.cos(ang) * R);
      const sh = g.shake * 0.4;
      cA.x += (Math.random() - 0.5) * sh; cA.y += (Math.random() - 0.5) * sh;
      lA.set(g.x, g.y + 0.5, 0);
      lB.set(g.x * 0.7 + g.px * 0.3, g.y * 0.56 + g.py * 0.3 + 0.4, -g.D * 0.27 - 6);
      look.lerpVectors(lA, lB, s);
      if (!g.camInit) { g.camInit = true; camera.position.copy(cA); camera.fov = 46; }
      camera.position.copy(cA);
      camera.lookAt(look); lc.copy(look);
      camera.fov = 46 + 12 * s;
    } else {
      // chase rig with scheduled orbits and attack-driven angles
      let oa;
      if (g.state === "play") {
        if (g.t >= g.orbitAt) { g.orbitStart = g.t; g.orbitAt += 16; g.orbitDir *= -1; }
        const e = g.t - g.orbitStart;
        oa = e < 4.2 ? Math.sin((e / 4.2) * Math.PI) * 1.0 * g.orbitDir : 0;
      } else oa = Math.sin(g.t * 0.35) * 0.9;
      const cs = g.clawT > 0 ? Math.sin((1 - g.clawT / CLAW_T) * Math.PI) : 0;
      const bp = g.beakT > 0 ? Math.sin((1 - g.beakT / BEAK_T) * Math.PI) : 0;
      const ang = oa + cs * 0.4;
      const dist = 8.8 - g.boost * 1.8 - bp * 2.4;
      const h = 2.8 - g.boost * 0.6 + (g.state === "idle" ? 1 : 0);
      tmp.set(g.x * 0.75 + Math.sin(ang) * dist, g.y * 0.65 + h, Math.cos(ang) * dist);
      const sh = g.shake * 0.35;
      tmp.x += (Math.random() - 0.5) * sh; tmp.y += (Math.random() - 0.5) * sh;
      tmp.y += Math.sin(g.t * 3) * 0.05 + g.boost * Math.sin(g.t * 31) * 0.03; // wing-beat bob and boost buffet
      camera.position.lerp(tmp, 1 - Math.exp(-6 * dt));
      const mix = 0.3 + Math.abs(oa) * 0.4 + (g.state === "end" ? 0.4 : 0);
      look.set(g.x * (1 - mix) + g.px * mix, g.y * 0.8 * (1 - mix) + g.py * mix + 0.4, -g.D * mix * 0.9 - 6);
      camera.lookAt(look);
      lc.copy(look);
      camera.rotateZ(-g.vx * 0.012);
      camera.fov = damp(camera.fov, 58 + g.boost * 16 + bp * 8, 6, dt);
    }
    camera.updateProjectionMatrix();

    if (ret.current) {
      tmp.set(g.px, g.py + 2.2, -g.D).project(camera);
      const vis = tmp.z < 1 && g.state === "play";
      ret.current.style.opacity = vis ? 1 : 0;
      ret.current.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * size.width}px, ${(-tmp.y * 0.5 + 0.5) * size.height}px) translate(-50%, -50%)`;
      const inR = g.state === "play" && g.D < 17 && Math.hypot(g.px - g.x, g.py - g.y) < 12;
      ret.current.classList.toggle("is-range", inR && g.stagger <= 0);
      ret.current.classList.toggle("is-stagger", g.stagger > 0);
      ret.current.dataset.d = g.stagger > 0 ? "STAGGERED, STRIKE NOW" : inR ? "IN RANGE" : `${Math.round(g.D * 3)} m`;
    }
    if (root.current) {
      root.current.style.setProperty("--hurt", g.hurt.toFixed(2));
      root.current.style.setProperty("--flash", g.flash.toFixed(2));
      root.current.style.setProperty("--fade", g.fade.toFixed(2));
      root.current.style.setProperty("--boost", g.boost.toFixed(2));
      const fin2 = g.state === "finale", dusk = fin2 ? 0.6 * sm(0.3, 2.4, g.fin) * (g.wingCut ? 1 - 0.65 * sm(g.cutF, g.cutF + 2.2, g.fin) : 1) : 0;
      root.current.style.setProperty("--dusk", dusk.toFixed(2));
      root.current.style.setProperty("--impact", (fin2 && g.wingCut ? clamp(1 - (g.fin - g.cutF) * 2.6, 0, 1) : 0).toFixed(2));
    }
  });
  return null;
}

function World({ G, cb, ret, root }) {
  return (
    <>
      <fog attach="fog" args={[FOG, 40, 220]} />
      <Env />
      <ambientLight intensity={0.35} color="#ffd9b0" />
      <hemisphereLight args={["#ffd9a8", "#3a2a2a", 0.8]} />
      <directionalLight position={[-30, 28, -60]} intensity={3.2} color="#ffd08a" />
      <directionalLight position={[6, 8, 25]} intensity={1.6} color="#ffb890" />
      <SkyDome />
      <Scroller G={G} period={TP} factor={1.5}><Land /></Scroller>
      <OpeningForest G={G} /><Leaves G={G} />
      <Scroller G={G} period={CP} factor={0.7}><Clouds /></Scroller>
      <Scroller G={G} period={80} factor={2.4}><Streaks G={G} /></Scroller>
      <Sparkles count={140} scale={[40, 16, 70]} position={[0, 0, -20]} size={2.5} speed={0.3} opacity={0.5} color="#ffe2a8" />
      <Jatayu G={G} /><SeveredWing G={G} /><FinaleFX G={G} /><Pushpak G={G} /><Projectiles G={G} /><Bursts G={G} />
      <Director G={G} cb={cb} ret={ret} root={root} />
    </>
  );
}

/* ---------------- UI ---------------- */

const ENDINGS = {
  chariot: ["THE KING OF VULTURES FALLS", "Jatayu's talons broke the golden rails of the Pushpaka and shook Ravana's pride. Then the ten-headed king drew Chandrahasa, and one stroke took the great bird's wing. Jatayu fell, broken but breathing, to carry the truth to Rama."],
  fall: ["THE KING OF VULTURES FALLS", "Wounded and weary, Jatayu could hold the sky no longer. Ravana drew Chandrahasa and cut away his wing. The old bird fell through the clouds, clinging to life to carry word of Sita to Rama."],
  time: ["THE SKY GROWS STILL", "Jatayu delayed Ravana for as long as his strength allowed. At last the blade Chandrahasa severed his wing and he fell, his last breath waiting for Rama."],
};

export default function JatayuLastFlightGame({ onClose }) {
  const G = useRef(makeState());
  const root = useRef(), ret = useRef();
  const [screen, setScreen] = useState("intro");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState({ hp: 100, ch: 100, courage: 0, time: 0, phase: 1, D: 20, spd: 126 });
  const [msg, setMsg] = useState("");
  const [coach, setCoach] = useState(0);
  const [alertText, setAlert] = useState(null);
  const [sub, setSub] = useState("");
  const [banner, setBanner] = useState(false);
  const [result, setResult] = useState(null);
  const sfx = useSound(muted);
  const cb = useRef({});

  cb.current = {
    sfx, msg: setMsg, alert: setAlert, hud: setHud, coach: setCoach, sub: setSub, banner: setBanner,
    finale: () => { setScreen("finale"); setPaused(false); },
    opened: () => { setScreen("battle"); sfx("bell"); },
    end: (reason) => {
      const g = G.current, s = g.stats;
      const score = (100 - Math.max(0, g.ch)) + g.hp * 0.5 + s.deflects * 3 + s.parries * 6;
      setResult({ reason, ...s, courage: Math.round(g.courage), rank: score >= 170 ? "S" : score >= 125 ? "A" : score >= 85 ? "B" : "C" });
      setBanner(false); sfx("end");
      setTimeout(() => G.current.state === "end" && setScreen("ending"), 500);
    },
  };

  useEffect(() => {
    if (!msg) return undefined;
    const id = setTimeout(() => setMsg(""), 1800);
    return () => clearTimeout(id);
  }, [msg]);

  const togglePause = useCallback(() => {
    setPaused((v) => { G.current.paused = !v; return !v; });
  }, []);

  const start = () => {
    G.current = Object.assign(makeState(), { state: "opening", t: 0, y: -10.2, boost: 0 });
    setHud({ hp: 100, ch: 100, courage: 0, time: 0, phase: 1, D: 20, spd: 126 });
    setMsg(""); setCoach(0); setAlert(null); setResult(null); setPaused(false); setSub(""); setBanner(false);
    setScreen("opening"); sfx("bell");
  };
  const skipOpening = () => { const g = G.current; if (g.state === "opening" && g.op < 5.6) g.op = 5.6; };

  useEffect(() => {
    if (screen !== "battle" && screen !== "finale" && screen !== "opening") return undefined;
    const kd = (e) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (e.code === "Escape") e.stopPropagation();
      if (screen === "finale") return;
      if (screen === "opening") { if (["Space", "Enter", "Escape"].includes(e.code)) { e.preventDefault(); skipOpening(); } return; }
      G.current.keys[e.code] = true;
      if (e.repeat) return;
      if (e.code === "Space") doBeak(G.current, cb.current);
      if (e.code === "KeyJ" || e.code === "KeyK") doClaw(G.current, cb.current);
      if (e.code === "Escape" || e.code === "KeyP") { e.preventDefault(); togglePause(); }
    };
    const ku = (e) => { G.current.keys[e.code] = false; };
    const pd = (e) => { if (screen === "battle" && !e.target.closest("button")) doClaw(G.current, cb.current); };
    const blur = () => { G.current.keys = {}; };
    window.addEventListener("keydown", kd, true); window.addEventListener("keyup", ku);
    window.addEventListener("pointerdown", pd); window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", kd, true); window.removeEventListener("keyup", ku);
      window.removeEventListener("pointerdown", pd); window.removeEventListener("blur", blur);
    };
  }, [screen, togglePause]);

  // rushing wind: a looping noise bed whose pitch and volume follow the boost
  useEffect(() => {
    if (muted || (screen !== "battle" && screen !== "finale" && screen !== "opening")) return undefined;
    let a, src, iv;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      a = new AC();
      const len = a.sampleRate * 2, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04; d[i] = last * 3.2; }
      src = a.createBufferSource(); src.buffer = buf; src.loop = true;
      const fl = a.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = 600; fl.Q.value = 0.5;
      const gn = a.createGain(); gn.gain.value = 0;
      src.connect(fl); fl.connect(gn); gn.connect(a.destination); src.start();
      iv = setInterval(() => {
        const g = G.current;
        if (a.state === "suspended") a.resume();
        gn.gain.setTargetAtTime(g.paused ? 0 : 0.05 + g.boost * 0.09, a.currentTime, 0.15);
        fl.frequency.setTargetAtTime(500 + g.boost * 900, a.currentTime, 0.2);
      }, 120);
    } catch { return undefined; }
    return () => { clearInterval(iv); try { src.stop(); a.close(); } catch { /* already closed */ } };
  }, [screen, muted]);

  const playing = screen === "battle";
  const cine = screen === "finale" || screen === "opening";
  const mm = Math.floor(hud.time / 60).toString().padStart(2, "0"), ss = Math.floor(hud.time % 60).toString().padStart(2, "0");
  const end = result ? ENDINGS[result.reason] : ENDINGS.time;

  const ui = (
    <div className={`jlf-game${cine ? " is-cine" : ""}`} ref={root}>
      <div className="jlf-stage">
        <Canvas dpr={[1, 1.7]} camera={{ position: [0, 3, 9], fov: 58, near: 0.1, far: 320 }} gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1; }}>
          <Suspense fallback={null}><World G={G} cb={cb} ret={ret} root={root} /></Suspense>
        </Canvas>
        <div className="jlf-speedfx" />
        <div className="jlf-vignette" /><div className="jlf-grain" /><div className="jlf-hurt" /><div className="jlf-dusk" /><div className="jlf-impact" />
        <div className="jlf-reticle" ref={ret}><i /></div>
      </div>
      <div className="jlf-flash" /><div className="jlf-fade" />
      <div className="jlf-lb jlf-lb--t" /><div className="jlf-lb jlf-lb--b" />

      <header className="jlf-top">
        <span className="jlf-brand"><Feather size={17} /> ANCESTRA</span>
        <div className="jlf-top__btns">
          {playing && <button className="jlf-esc" onClick={togglePause} aria-label="Pause"><Pause size={14} /><kbd>ESC</kbd></button>}
          <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
        </div>
      </header>

      <AnimatePresence>
        {cine && sub && <motion.div key={sub} className="jlf-cine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>{sub}</motion.div>}
      </AnimatePresence>
      <AnimatePresence>
        {cine && banner && (
          <motion.div className="jlf-banner" initial={{ opacity: 0, scale: 1.25 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.7 }}>
            <small>THE BLADE OF SHIVA</small>
            <strong>CHANDRAHASA</strong>
          </motion.div>
        )}
      </AnimatePresence>

      {screen === "opening" && <button className="jlf-skip" onClick={skipOpening}>SKIP <kbd>SPACE</kbd></button>}

      {playing && (
        <>
          <div className="jlf-hud">
            <div className="jlf-panel">
              <b><Feather size={15} /> JATAYU</b>
              <div className="jlf-bar"><i style={{ width: `${hud.hp}%` }} /></div>
              <div className={`jlf-bar jlf-bar--c${hud.courage >= 100 ? " is-full" : ""}`}><i style={{ width: `${hud.courage}%` }} /></div>
              <small className={hud.courage >= 100 ? "is-ready" : ""}>{hud.courage >= 100 ? "GARUDA STRIKE READY · SPACE" : "VITALITY · COURAGE"}</small>
            </div>
            <div className="jlf-center">
              <span>PHASE {hud.phase} / III</span><strong>{mm}:{ss}</strong>
              <em>{hud.spd} KM/H</em>
            </div>
            <div className="jlf-panel jlf-panel--r">
              <b>RAVANA <Crown size={15} /></b>
              <div className="jlf-bar jlf-bar--e"><i style={{ width: `${hud.ch}%` }} /><u style={{ left: `${DIVINE}%` }} /></div>
              <small>{hud.ch <= 30 ? "HE REACHES FOR CHANDRAHASA" : "PUSHPAKA VIMANA"}</small>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {alertText && <motion.div key={alertText} className={`jlf-alert${alertText === LABEL.slash ? " is-sword" : ""}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{alertText}</motion.div>}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {msg && !alertText && <motion.div key={msg} className="jlf-msg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{msg}</motion.div>}
          </AnimatePresence>

          {coach < 4 && (
            <motion.div key={coach} className="jlf-coach" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <small>TRAINING {coach + 1} / 4</small>
              <strong>{COACH[coach][0]}</strong>
              <span>{COACH[coach][1]}</span>
            </motion.div>
          )}
          <div className="jlf-actions">
            <button className={coach === 2 ? "is-hint" : ""} onPointerDown={(e) => { e.stopPropagation(); doClaw(G.current, cb.current); }}><span>CLAWS</span><kbd>J / CLICK</kbd></button>
            <button className={`${coach === 3 ? "is-hint" : ""}${hud.courage >= 100 ? " is-garuda" : ""}`} onPointerDown={(e) => { e.stopPropagation(); doBeak(G.current, cb.current); }}><span>BEAK</span><kbd>SPACE</kbd></button>
            <button className={`is-boost ${coach === 1 ? "is-hint" : ""}`}><Zap size={14} /><span>BOOST</span><kbd>SHIFT</kbd></button>
            <div className="jlf-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>FLY</span></div>
          </div>
        </>
      )}

      <AnimatePresence>
        {screen === "intro" && (
          <motion.div className="jlf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="jlf-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
              <div className="jlf-kicker">ARANYA KANDA · THE ABDUCTION OF SITA</div>
              <h1>JATAYU</h1>
              <div className="jlf-sub">THE LAST FLIGHT</div>
              <div className="jlf-rule" />
              <p>A golden chariot cuts across the sky, carrying Sita. Before it rises Jatayu, aged, mighty, and unafraid.</p>
              <button className="jlf-primary" onClick={() => setScreen("howto")}>CONTINUE <ArrowRight size={16} /></button>
            </motion.div>
          </motion.div>
        )}
        {screen === "howto" && (
          <motion.div className="jlf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="jlf-card jlf-card--how" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
              <div className="jlf-kicker">HOW TO FLY</div>
              <h2>WINGS, CLAWS AND BEAK</h2>
              <ul className="jlf-how">
                {HOW.map(([keys, name, desc]) => (
                  <li key={name}>
                    <span className="jlf-how__k">{keys.map((x) => <kbd key={x}>{x}</kbd>)}</span>
                    <div><b>{name}</b><em>{desc}</em></div>
                  </li>
                ))}
              </ul>
              <p className="jlf-how__tip">Ravana fights back with arrows, fireballs, sword waves and, up close, his blade. Break his chariot before your vitality runs out.</p>
              <button className="jlf-primary" onClick={start}>BEGIN FLIGHT <ArrowRight size={16} /></button>
            </motion.div>
          </motion.div>
        )}
        {paused && playing && (
          <motion.div className="jlf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="jlf-card">
              <h2>PAUSED</h2>
              <button className="jlf-primary" onClick={togglePause}><Play size={15} /> RESUME</button>
              <button className="jlf-text" onClick={() => onClose?.()}>RETURN TO THE STORY</button>
            </div>
          </motion.div>
        )}
        {screen === "ending" && result && (
          <motion.div className="jlf-overlay jlf-overlay--end" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="jlf-card jlf-card--end" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="jlf-kicker">THE LAST FLIGHT</div>
              <h2>{end[0]}</h2>
              <p>{end[1]}</p>
              <p className="jlf-epi">Though his wing was cut, his dharma stood unbroken.</p>
              <div className="jlf-stats">
                <div><strong>{result.deflects}</strong><span>DEFLECTED</span></div>
                <div><strong>{result.parries}</strong><span>PARRIED</span></div>
                <div><strong>{result.hits}</strong><span>HITS TAKEN</span></div>
                <div><strong className="jlf-rank">{result.rank}</strong><span>RANK</span></div>
              </div>
              <button className="jlf-primary" onClick={start}><RotateCcw size={15} /> FLY AGAIN</button>
              <button className="jlf-text" onClick={() => onClose?.()}>RETURN TO THE STORY</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  return createPortal(ui, document.body);
}