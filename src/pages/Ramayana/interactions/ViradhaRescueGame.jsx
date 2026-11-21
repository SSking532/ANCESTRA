import {
  Suspense,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Swords,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  Heart,
  Crown,
  Flame,
  Pause,
  Play,
} from "lucide-react";
import "./ViradhaRescueGame.css";

/* ========================================================================
   CONSTANTS & HELPERS
   ===================================================================== */

const PLAYER_MAX = 100;
const BOSS_MAX = 520;
const X_MIN = -5;
const X_MAX = 1.3;
const BOSS_HOME = 3.7;
const MOVE_SPEED = 4.3;
const STRIKE_CD = 760;
const EVADE_COST = 35;
const EVADE_DUR = 720;
const EVADE_CD = 420;
const PERFECT_WINDOW = 380;
const ARROW_RELEASE = 300;
const ARROW_FLIGHT = 340;
const PHASE_SPEED = [1, 0.9, 0.8];
const DMG_MUL = [1, 1.15, 1.3];
const GAP = [1500, 1150, 850];
const BEST_KEY = "ancestra_viradha_best_time";
const SLOW_SCALE = 0.33;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const random = (min, max) => min + Math.random() * (max - min);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = THREE.MathUtils.damp;
const UP = new THREE.Vector3(0, 1, 0);

/* shared arrow flight path (used by the arrow mesh and by its light) */
function arrowPoint(g, who, out) {
  const lak = who === "lak";
  const p = (g.time - (lak ? g.lakArrowAt : g.arrowAt)) / ARROW_FLIGHT;
  if (p < 0 || p > 1) return -1;
  const [fx, fy] = lak ? [-4.25, 1.5] : g.arrowFrom;
  const z0 = lak ? -1.5 : 0.1;
  const tx = g.bossX - 0.5;
  const ty = 2.4;
  const arc = Math.sin(p * Math.PI) * 0.35;
  out.set(lerp(fx, tx, p), lerp(fy, ty, p) + arc, lerp(z0, 0.1, p));
  return p;
}

/* ========================================================================
   ATTACK DEFINITIONS
   kind: circle  -> stay out of the circle
         lane    -> whole lane is lethal, evade through it
         safe    -> everything is lethal except the golden ring
   ===================================================================== */

const ATTACKS = {
  smash: {
    name: "Earthsplitter",
    hint: "Step out of the red circle, or evade at the last moment",
    dmg: 16,
    anim: "slam",
    zones: (px) => [
      { kind: "circle", x: clamp(px, X_MIN, X_MAX), r: 1.3, appear: 0, land: 1200 },
    ],
  },
  charge: {
    name: "Rampage Charge",
    hint: "The whole lane is deadly. Evade through it!",
    dmg: 22,
    anim: "charge",
    zones: () => [{ kind: "lane", x: -1.4, r: 0, appear: 0, land: 1350 }],
  },
  quake: {
    name: "Shatterquake",
    hint: "Stand inside the golden ring",
    dmg: 20,
    anim: "quake",
    zones: () => [
      { kind: "safe", x: random(-4, 0.4), r: 1.2, appear: 0, land: 1500 },
    ],
  },
  rain: {
    name: "Rain of Stone",
    hint: "Keep moving. Stones fall where you stand",
    dmg: 13,
    anim: "slam",
    zones: (px) =>
      [0, 1, 2].map((i) => ({
        kind: "circle",
        rock: true,
        x: clamp(px + (i === 0 ? 0 : random(-2.2, 2.2)), X_MIN, X_MAX),
        r: 1.0,
        appear: i * 420,
        land: i * 420 + 950,
      })),
  },
};

/* ========================================================================
   AUDIO  (procedural, no assets required)
   ===================================================================== */

function createAudio() {
  let ctx = null;
  let master = null;
  let fx = null;
  let noiseBuf = null;
  let amb = null;
  let pluckTimer = null;
  let muted = false;

  const ensure = () => {
    try {
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ctx = new C();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.85;
        master.connect(ctx.destination);

        const delay = ctx.createDelay(1);
        delay.delayTime.value = 0.34;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.32;
        const wet = ctx.createGain();
        wet.gain.value = 0.5;
        fx = ctx.createGain();
        fx.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wet);
        wet.connect(master);

        const len = ctx.sampleRate;
        noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx;
    } catch {
      return null;
    }
  };

  const tone = (freq, o = {}) => {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    try {
      const { type = "sine", dur = 0.3, vol = 0.1, at = 0, slide, attack = 0.012, lp, send = 0 } = o;
      const s = c.currentTime + at;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, s);
      if (slide) osc.frequency.exponentialRampToValueAtTime(slide, s + dur);
      gain.gain.setValueAtTime(0.0001, s);
      gain.gain.exponentialRampToValueAtTime(vol, s + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      if (lp) {
        const f = c.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = lp;
        osc.connect(f);
        f.connect(gain);
      } else {
        osc.connect(gain);
      }
      gain.connect(master);
      if (send) {
        const sg = c.createGain();
        sg.gain.value = send;
        gain.connect(sg);
        sg.connect(fx);
      }
      osc.start(s);
      osc.stop(s + dur + 0.05);
    } catch {
      /* audio is optional */
    }
  };

  const noise = (o = {}) => {
    if (muted) return;
    const c = ensure();
    if (!c || !noiseBuf) return;
    try {
      const { dur = 0.3, vol = 0.1, at = 0, from = 800, to = 800, type = "bandpass", q = 1 } = o;
      const s = c.currentTime + at;
      const src = c.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = type;
      f.Q.value = q;
      f.frequency.setValueAtTime(from, s);
      f.frequency.exponentialRampToValueAtTime(Math.max(20, to), s + dur);
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0001, s);
      gain.gain.exponentialRampToValueAtTime(vol, s + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      src.connect(f);
      f.connect(gain);
      gain.connect(master);
      src.start(s, Math.random() * 0.5);
      src.stop(s + dur + 0.05);
    } catch {
      /* audio is optional */
    }
  };

  const play = (type) => {
    switch (type) {
      case "arrow":
        noise({ dur: 0.26, vol: 0.09, from: 1200, to: 4200, q: 1.5 });
        tone(520, { type: "triangle", dur: 0.18, vol: 0.05, slide: 180 });
        break;
      case "hit":
        tone(160, { dur: 0.28, vol: 0.24, slide: 45 });
        noise({ dur: 0.18, vol: 0.12, type: "lowpass", from: 900, to: 120 });
        break;
      case "bossHit":
        tone(240, { type: "sawtooth", dur: 0.22, vol: 0.07, slide: 70, lp: 900 });
        tone(980, { type: "triangle", dur: 0.14, vol: 0.04, send: 0.4 });
        noise({ dur: 0.14, vol: 0.08, from: 2000, to: 600 });
        break;
      case "dodge":
        noise({ dur: 0.24, vol: 0.08, from: 600, to: 2600, q: 0.8 });
        tone(300, { dur: 0.16, vol: 0.05, slide: 620 });
        break;
      case "perfect":
        [880, 1318.5, 1760].forEach((f, i) => tone(f, { at: i * 0.05, dur: 0.9, vol: 0.07, send: 0.6 }));
        break;
      case "divine":
        tone(220, { dur: 0.9, vol: 0.12, slide: 880, send: 0.5 });
        [330, 495, 660, 990].forEach((f, i) => tone(f, { at: 0.15 + i * 0.06, dur: 1.3, vol: 0.06, send: 0.7 }));
        noise({ dur: 0.9, vol: 0.06, type: "highpass", from: 2000, to: 6000 });
        break;
      case "roar":
        tone(88, { type: "sawtooth", dur: 0.8, vol: 0.14, slide: 48, lp: 420 });
        noise({ dur: 0.7, vol: 0.1, type: "lowpass", from: 700, to: 90 });
        break;
      case "slam":
        tone(120, { dur: 0.4, vol: 0.3, slide: 38 });
        noise({ dur: 0.34, vol: 0.2, type: "lowpass", from: 800, to: 90 });
        break;
      case "quake":
        tone(55, { dur: 0.95, vol: 0.3, slide: 32 });
        noise({ dur: 0.9, vol: 0.28, type: "lowpass", from: 500, to: 60 });
        break;
      case "charge":
        noise({ dur: 0.9, vol: 0.12, type: "lowpass", from: 300, to: 1400 });
        tone(70, { type: "sawtooth", dur: 0.9, vol: 0.1, slide: 140, lp: 300 });
        break;
      case "warn":
        tone(440, { type: "square", dur: 0.09, vol: 0.025, lp: 1800 });
        tone(330, { type: "square", at: 0.11, dur: 0.12, vol: 0.025, lp: 1800 });
        break;
      case "phase":
        [98, 147, 196, 261.6].forEach((f, i) => tone(f, { at: i * 0.04, dur: 2.4, vol: 0.1, send: 0.6 }));
        noise({ dur: 1.6, vol: 0.12, type: "lowpass", from: 900, to: 80 });
        break;
      case "victory":
        [392, 440, 523.25, 587.33, 659.25, 784].forEach((f, i) =>
          tone(f, { at: i * 0.13, dur: 1.5, vol: 0.08, send: 0.8 })
        );
        break;
      case "defeat":
        [294, 247, 196].forEach((f, i) => tone(f, { at: i * 0.28, dur: 1.4, vol: 0.09, send: 0.6, lp: 900 }));
        break;
      case "click":
        tone(700, { dur: 0.06, vol: 0.04 });
        break;
      default:
        break;
    }
  };

  const startAmbience = () => {
    const c = ensure();
    if (!c || amb) return;
    try {
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 3);
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 520;
      lp.connect(g);
      g.connect(master);

      const oscs = [
        [98, 0],
        [147, 4],
        [196, -5],
        [49, 0],
      ].map(([f, det], i) => {
        const o = c.createOscillator();
        o.type = i === 3 ? "sine" : "triangle";
        o.frequency.value = f;
        o.detune.value = det;
        const og = c.createGain();
        og.gain.value = i === 3 ? 0.18 : 0.07;
        o.connect(og);
        og.connect(lp);
        o.start();
        return o;
      });

      const lfo = c.createOscillator();
      lfo.frequency.value = 0.08;
      const lg = c.createGain();
      lg.gain.value = 180;
      lfo.connect(lg);
      lg.connect(lp.frequency);
      lfo.start();

      amb = { g, oscs: [...oscs, lfo] };

      const scale = [392, 440, 523.25, 587.33, 659.25, 784];
      const loop = () => {
        if (!amb) return;
        tone(scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.25 ? 0.5 : 1), {
          type: "triangle",
          dur: 2.4,
          vol: 0.035,
          send: 0.7,
        });
        pluckTimer = setTimeout(loop, 2600 + Math.random() * 3400);
      };
      pluckTimer = setTimeout(loop, 1800);
    } catch {
      /* audio is optional */
    }
  };

  const stopAmbience = () => {
    clearTimeout(pluckTimer);
    if (!amb || !ctx) {
      amb = null;
      return;
    }
    const a = amb;
    amb = null;
    try {
      a.g.gain.cancelScheduledValues(ctx.currentTime);
      a.g.gain.setValueAtTime(Math.max(0.0001, a.g.gain.value), ctx.currentTime);
      a.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      a.oscs.forEach((o) => o.stop(ctx.currentTime + 1.3));
    } catch {
      /* ignore */
    }
  };

  return {
    play,
    unlock: ensure,
    startAmbience,
    stopAmbience,
    setMuted(m) {
      muted = m;
      if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.85, ctx.currentTime, 0.05);
    },
    setSuspended(s) {
      if (!ctx) return;
      try {
        if (s) ctx.suspend();
        else ctx.resume();
      } catch {
        /* ignore */
      }
    },
  };
}

/* ========================================================================
   GAME ENGINE  (all mutable game state lives in one ref-held object `g`;
   the 3D scene reads it every frame, React only mirrors what the DOM needs)
   ===================================================================== */

function makeG() {
  return {
    time: 0,
    real: 0,
    slowUntil: 0,
    screen: "intro",
    paused: false,
    ended: false,
    victory: false,
    endTime: 0,
    fightStart: 0,

    x: -3.2,
    held: { l: false, r: false },
    dodgeDir: 1,

    playerHp: PLAYER_MAX,
    bossHp: BOSS_MAX,
    stamina: 100,
    divine: 0,
    combo: 0,
    maxCombo: 0,
    lastHitAt: -9999,

    phase: 1,
    inPhase: false,
    lastAttack: null,

    playerAction: "idle",
    playerActionAt: 0,
    bossAction: "idle",
    bossActionAt: 0,
    bossAnim: "slam",
    bossX: BOSS_HOME,
    bossTargetX: BOSS_HOME,

    evadeUntil: 0,
    evadeStart: -9999,
    evadeReadyAt: 0,
    strikeReadyAt: 0,
    stunUntil: 0,

    shake: 0,
    zoom: 0,
    fovKick: 0,
    divineAt: -9999,
    bossHitAt: -9999,
    playerHitAt: -9999,
    arrowAt: -9999,
    arrowFrom: [0, 1.5],
    lakAt: -9999,
    lakArrowAt: -9999,
    lakReadyAt: 3400,
    slamAt: -9999,
    scars: [],

    queue: [],
    zoneSeq: 0,
    zones: [],
    syncAcc: 0,
    flags: {},
    stats: { strikes: 0, dodges: 0, perfect: 0, divine: 0, damageTaken: 0 },
  };
}

function buildEngine(G, audio, ui) {
  const g = G.current;
  let uid = 0;
  let dlgId = 0;
  let lastHud = "";

  const schedule = (ms, fn) => {
    g.queue.push({ at: g.time + ms, fn });
  };

  const slowmo = (ms) => {
    g.slowUntil = Math.max(g.slowUntil, g.real + ms);
  };

  const say = (text) => ui.setMessage(text);

  const speak = (speaker, text, ms = 4400) => {
    const id = ++dlgId;
    ui.setDialogue({ id, speaker, text });
    schedule(ms, () => {
      if (dlgId === id) ui.setDialogue(null);
    });
  };

  const floater = (text, x, y, kind = "info") => {
    const id = ++uid;
    ui.setFloaters((old) => [...old.slice(-6), { id, text, x, y, kind }]);
    schedule(1100, () => ui.setFloaters((old) => old.filter((f) => f.id !== id)));
  };

  const burst = (x, kind, y = 0.1) => {
    const id = ++uid;
    ui.setEffects((old) => [...old.slice(-14), { id, x, y, kind }]);
    schedule(1100, () => ui.setEffects((old) => old.filter((e) => e.id !== id)));
  };

  const flash = (kind, ms) => {
    ui.setFlash(kind);
    schedule(ms, () => ui.setFlash(""));
  };

  const pushScar = (x, r) => {
    g.scars.push({ x, r, at: g.time });
    if (g.scars.length > 8) g.scars.shift();
  };

  const sync = (force) => {
    const h = {
      hp: Math.ceil(g.playerHp),
      boss: Math.ceil(g.bossHp),
      stam: Math.round(g.stamina),
      div: Math.round(g.divine),
      combo: g.combo,
      phase: g.phase,
      strikeCd: Math.round(clamp((g.strikeReadyAt - g.time) / STRIKE_CD, 0, 1) * 20) / 20,
      secs: Math.floor(Math.max(0, (g.ended ? g.endTime : g.time) - g.fightStart) / 1000),
    };
    const key = JSON.stringify(h);
    if (key === lastHud && !force) return;
    lastHud = key;
    ui.setHud(h);
  };

  const canAct = () => g.screen === "battle" && !g.paused && !g.ended;

  /* ---------------------------- damage & phases --------------------- */

  function damagePlayer(n) {
    if (g.ended) return;
    g.playerHp = Math.max(0, g.playerHp - n);
    g.stats.damageTaken += n;
    g.playerAction = "hit";
    g.playerActionAt = g.time;
    g.playerHitAt = g.time;
    g.combo = 0;
    g.shake = Math.max(g.shake, 1);
    g.fovKick = 4;
    audio.play("hit");
    flash("damage", 420);
    floater(`-${n}`, g.x, 2.9, "player");
    say("The blow lands. Find your balance!");
    schedule(380, () => {
      if (g.playerAction === "hit") g.playerAction = "idle";
    });

    if (g.playerHp <= 0) {
      finish(false);
      return;
    }
    if (g.playerHp <= 30 && !g.flags.lowHp) {
      g.flags.lowHp = true;
      speak("LAKSHMANA", "Hold fast, brother! Evade. Do not trade blows!");
    }
  }

  function perfectEvade() {
    g.stats.perfect++;
    g.divine = Math.min(100, g.divine + 18);
    g.stamina = Math.min(100, g.stamina + 30);
    g.playerHp = Math.min(PLAYER_MAX, g.playerHp + 4);
    g.fovKick = -5;
    slowmo(460);
    audio.play("perfect");
    flash("perfect", 380);
    floater("PERFECT EVADE", g.x, 3.1, "perfect");
    say("A perfect evasion! The divine force stirs.");
    if (g.divine >= 100 && !g.flags.divineReady) {
      g.flags.divineReady = true;
      speak("RAMA", "The divine force awakens. Release it!");
    }
  }

  function damageBoss(n, crit) {
    if (g.ended) return;
    g.bossHp = Math.max(0, g.bossHp - n);
    g.bossHitAt = g.time;
    floater(String(n), g.bossX, 4.1, crit ? "crit" : "boss");
    if (g.bossHp <= 0) {
      finish(true);
      return;
    }
    const p = g.bossHp <= BOSS_MAX * 0.33 ? 3 : g.bossHp <= BOSS_MAX * 0.66 ? 2 : 1;
    if (p > g.phase) phaseShift(p);
  }

  function phaseShift(p) {
    g.phase = p;
    g.inPhase = true;
    g.bossAction = "roar";
    g.bossActionAt = g.time;
    g.shake = Math.max(g.shake, 1.4);
    g.fovKick = 7;
    slowmo(520);
    audio.play("phase");
    audio.play("roar");
    ui.setBanner({
      id: ++uid,
      title: p === 2 ? "PHASE II" : "PHASE III",
      sub: p === 2 ? "THE FURY OF VIRADHA" : "THE UNBOUND RAGE",
    });
    say(p === 2 ? "Viradha's fury grows. Read the ground!" : "Viradha is unbound. Endure!");
    if (p === 2) {
      speak("LAKSHMANA", "No blade alone will end him. Gather the Divine Force, brother!");
    } else {
      speak("RAMA", "His rage is his weakness. One more push!");
    }
    schedule(2100, () => {
      g.inPhase = false;
      if (g.bossAction === "roar") g.bossAction = "idle";
    });
    schedule(2700, () => ui.setBanner(null));
  }

  /* ----------------------------- boss attacks ----------------------- */

  function pickAttack() {
    if (!g.lastAttack) return "smash";
    const pools = {
      1: ["smash", "charge"],
      2: ["smash", "charge", "quake"],
      3: ["smash", "charge", "quake", "rain", "rain"],
    };
    const list = pools[g.phase].filter((n) => n !== g.lastAttack);
    return list[Math.floor(Math.random() * list.length)];
  }

  function scheduleNext(ms) {
    schedule(ms, () => {
      if (g.ended || g.screen !== "battle") return;
      if (g.inPhase || g.time < g.stunUntil) {
        scheduleNext(350);
        return;
      }
      launch(pickAttack());
    });
  }

  function land(def, z, mul) {
    if (g.ended) return;
    ui.setZones((old) => old.filter((o) => o.id !== z.id));
    const px = g.x;
    const invuln = g.time < g.evadeUntil;
    let threat;
    if (z.kind === "circle") threat = Math.abs(px - z.x) < z.r + 0.15;
    else if (z.kind === "lane") threat = true;
    else threat = Math.abs(px - z.x) > z.r - 0.1;

    if (z.kind === "circle") {
      burst(z.x, "rock");
      pushScar(z.x, z.r);
      audio.play("slam");
      g.shake = Math.max(g.shake, 0.6);
      g.fovKick = Math.max(g.fovKick, 3);
      g.slamAt = g.time;
    } else if (z.kind === "safe") {
      for (let i = 0; i < 6; i++) burst(random(-5.4, 1.8), "rock");
      for (let i = 0; i < 4; i++) pushScar(random(-5, 1.8), random(0.7, 1.1));
      audio.play("quake");
      g.shake = Math.max(g.shake, 1.1);
      g.fovKick = Math.max(g.fovKick, 5);
      g.slamAt = g.time;
    } else {
      audio.play("slam");
      g.shake = Math.max(g.shake, 0.9);
      g.slamAt = g.time;
    }

    if (threat) {
      if (invuln) {
        if (g.time - g.evadeStart <= PERFECT_WINDOW) perfectEvade();
        else floater("EVADED", px, 2.9, "info");
      } else {
        damagePlayer(Math.round(def.dmg * mul));
      }
    }
  }

  function launch(name) {
    if (g.ended) return;
    const def = ATTACKS[name];
    const sp = PHASE_SPEED[g.phase - 1];
    const mul = DMG_MUL[g.phase - 1];
    g.lastAttack = name;

    const zones = def.zones(g.x).map((z) => ({
      ...z,
      id: ++g.zoneSeq,
      start: g.time + z.appear * sp,
      land: g.time + z.land * sp,
    }));
    g.zones = zones;
    ui.setZones(zones);

    g.bossAction = "prepare";
    g.bossActionAt = g.time;
    g.bossAnim = def.anim;

    const first = Math.min(...zones.map((z) => z.land));
    const last = Math.max(...zones.map((z) => z.land));

    ui.setWarning({
      id: ++uid,
      name: def.name,
      hint: def.hint,
      ms: Math.round(first - g.time),
    });
    say(
      g.phase === 1
        ? "Viradha gathers his strength..."
        : g.phase === 2
          ? "Viradha's fury grows. Prepare to evade!"
          : "Viradha rages. Stay sharp!"
    );
    audio.play("warn");

    schedule(Math.max(0, first - g.time - 300), () => {
      if (g.ended) return;
      g.bossAction = "attack";
      g.bossActionAt = g.time;
      if (def.anim === "charge") {
        g.bossTargetX = -5.8;
        audio.play("charge");
      } else {
        audio.play("roar");
      }
    });

    zones.forEach((z) => schedule(z.land - g.time, () => land(def, z, mul)));

    schedule(last - g.time + 420, () => {
      if (g.ended) return;
      ui.setWarning(null);
      g.bossTargetX = BOSS_HOME;
      if (g.bossAction === "attack" || g.bossAction === "prepare") g.bossAction = "idle";
      scheduleNext(GAP[g.phase - 1] + random(0, 300));
    });
  }

  /* ---------------------------- player actions ---------------------- */

  function strike() {
    if (!canAct() || g.time < g.strikeReadyAt) return;
    g.strikeReadyAt = g.time + STRIKE_CD;
    g.playerAction = "attack";
    g.playerActionAt = g.time;
    g.stats.strikes++;
    say("Release the arrow!");

    schedule(ARROW_RELEASE, () => {
      if (g.ended) return;
      g.arrowAt = g.time;
      g.arrowFrom = [g.x + 1.3, 1.55];
      audio.play("arrow");
    });
    schedule(ARROW_RELEASE + ARROW_FLIGHT, () => {
      if (g.ended) return;
      hitBoss();
    });
    schedule(560, () => {
      if (g.playerAction === "attack") g.playerAction = "idle";
    });
  }

  function hitBoss() {
    if (g.time - g.lastHitAt > 3200) g.combo = 0;
    g.combo++;
    g.lastHitAt = g.time;
    g.maxCombo = Math.max(g.maxCombo, g.combo);
    const mult = 1 + 0.1 * Math.min(g.combo - 1, 6);
    const crit = Math.random() < 0.14;
    const dmg = Math.round(13 * mult * (crit ? 1.7 : 1));
    g.divine = Math.min(100, g.divine + 7);
    g.shake = Math.max(g.shake, crit ? 0.5 : 0.3);
    if (crit) slowmo(110);
    audio.play("bossHit");
    burst(g.bossX - 0.5, "gold", 2.3);
    say(crit ? "A critical strike!" : "The arrow finds its mark.");
    damageBoss(dmg, crit);
    if (g.divine >= 100 && !g.flags.divineReady && !g.ended) {
      g.flags.divineReady = true;
      speak("RAMA", "The divine force awakens. Release it!");
    }
  }

  /* Lakshmana covers his brother with a steady volley */
  function lakFire() {
    g.lakReadyAt = g.time + 3300 + random(0, 900);
    g.lakAt = g.time;
    schedule(320, () => {
      if (g.ended) return;
      g.lakArrowAt = g.time;
      audio.play("arrow");
    });
    schedule(320 + ARROW_FLIGHT, () => {
      if (g.ended) return;
      audio.play("bossHit");
      burst(g.bossX - 0.3, "gold", 2.0);
      damageBoss(6, false);
    });
  }

  function dodge() {
    if (!canAct() || g.time < g.evadeReadyAt) return;
    if (g.stamina < EVADE_COST) {
      say("Not enough stamina to evade.");
      return;
    }
    g.stamina -= EVADE_COST;
    g.evadeStart = g.time;
    g.evadeUntil = g.time + EVADE_DUR;
    g.evadeReadyAt = g.time + EVADE_CD;
    g.playerAction = "dodge";
    g.playerActionAt = g.time;
    g.stats.dodges++;
    const dir = g.held.r ? 1 : g.held.l ? -1 : g.x < -2.2 ? 1 : -1;
    g.dodgeDir = dir;
    g.x = clamp(g.x + dir * 1.6, X_MIN, X_MAX);
    audio.play("dodge");
    burst(g.x, "dodge", 0.9);
    say("A swift evasion!");
    schedule(EVADE_DUR, () => {
      if (g.playerAction === "dodge") g.playerAction = "idle";
    });
  }

  function divine() {
    if (!canAct()) return;
    if (g.divine < 100) {
      say("The divine force has not yet awakened.");
      return;
    }
    g.divine = 0;
    g.flags.divineReady = false;
    g.stats.divine++;
    g.playerAction = "divine";
    g.playerActionAt = g.time;
    g.divineAt = g.time;
    g.evadeUntil = g.time + 1000;
    g.evadeStart = -9999;
    g.shake = Math.max(g.shake, 0.6);
    g.zoom = 1;
    audio.play("divine");
    flash("divine", 760);
    say("A sacred force answers your call.");

    schedule(520, () => {
      if (g.ended) return;
      g.shake = 1.8;
      g.fovKick = 9;
      slowmo(620);
      burst(g.bossX, "divine", 0.1);
      burst(g.bossX - 0.4, "gold", 2.4);
      burst(g.bossX + 0.4, "gold", 1.6);
      audio.play("bossHit");
      damageBoss(70, true);
      if (g.ended) return;
      g.stunUntil = g.time + 2400;
      g.bossAction = "stun";
      g.bossActionAt = g.time;
      schedule(2400, () => {
        if (g.bossAction === "stun") g.bossAction = "idle";
      });
    });
    schedule(1100, () => {
      if (g.playerAction === "divine") g.playerAction = "idle";
    });
  }

  /* ---------------------------- lifecycle --------------------------- */

  function finish(win) {
    if (g.ended) return;
    g.ended = true;
    g.endTime = g.time;
    g.victory = win;
    g.screen = "ending";
    g.held.l = false;
    g.held.r = false;
    g.zones = [];
    ui.setScreen("ending");
    ui.setZones([]);
    ui.setWarning(null);
    ui.setBanner(null);

    if (win) {
      g.bossAction = "collapse";
      g.bossActionAt = g.time;
      g.playerAction = "victory";
      g.playerActionAt = g.time;
      g.shake = 1.6;
      g.fovKick = -8;
      slowmo(1500);
      audio.play("victory");
      say("The threat has been overcome.");
      speak("SITA", "Rama... Lakshmana... you have found me.", 3600);
      flash("divine", 760);
    } else {
      g.playerAction = "defeat";
      g.playerActionAt = g.time;
      g.bossAction = "idle";
      audio.play("defeat");
      say("The forest falls silent.");
    }

    schedule(win ? 3200 : 1700, () => {
      const secs = Math.round((g.endTime - g.fightStart) / 1000);
      const score =
        g.playerHp * 1.2 +
        g.stats.perfect * 12 +
        g.maxCombo * 4 +
        Math.max(0, 90 - secs) * 0.8 -
        g.stats.damageTaken * 0.3;
      const rank = !win ? "-" : score >= 170 ? "S" : score >= 130 ? "A" : score >= 90 ? "B" : "C";
      let best = null;
      let newBest = false;
      if (win) {
        try {
          const prev = Number(window.localStorage.getItem(BEST_KEY));
          if (!prev || secs < prev) {
            window.localStorage.setItem(BEST_KEY, String(secs));
            newBest = Boolean(prev);
            best = secs;
          } else {
            best = prev;
          }
        } catch {
          best = null;
        }
      }
      ui.setResult({
        win,
        secs,
        rank,
        best,
        newBest,
        strikes: g.stats.strikes,
        dodges: g.stats.dodges,
        perfect: g.stats.perfect,
        divine: g.stats.divine,
        combo: g.maxCombo,
        hp: Math.ceil(g.playerHp),
      });
      g.screen = win ? "victory" : "defeat";
      ui.setScreen(g.screen);
      audio.stopAmbience();
      sync(true);
    });
  }

  function start() {
    audio.unlock();
    Object.assign(g, makeG(), { screen: "battle" });
    ui.setScreen("battle");
    ui.setResult(null);
    ui.setPaused(false);
    ui.setZones([]);
    ui.setEffects([]);
    ui.setFloaters([]);
    ui.setWarning(null);
    ui.setBanner(null);
    ui.setFlash("");
    ui.setDialogue(null);
    audio.stopAmbience();
    audio.startAmbience();
    audio.play("roar");

    g.bossAction = "roar";
    say("Viradha blocks the path. Stand your ground.");
    speak("LAKSHMANA", "Brother, the rakshasa holds Sita! Strike true, and stay clear of his blows.");
    schedule(1900, () => {
      if (g.ended) return;
      g.bossAction = "idle";
      scheduleNext(300);
    });
    schedule(6000, () => {
      if (!g.ended && g.stats.perfect === 0 && g.stats.dodges === 0) {
        say("Tip: evade at the very last moment for a PERFECT EVADE.");
      }
    });
    sync(true);
  }

  function togglePause(force) {
    if (g.screen !== "battle") return;
    g.paused = typeof force === "boolean" ? force : !g.paused;
    ui.setPaused(g.paused);
    audio.setSuspended(g.paused);
    if (!g.paused) g.held.l = g.held.r = false;
  }

  function hold(dir, on) {
    if (dir === "l") g.held.l = on;
    else g.held.r = on;
  }

  function tick(dt) {
    if (g.paused) return;
    g.real += dt * 1000;
    const sdt = g.real < g.slowUntil ? dt * SLOW_SCALE : dt;
    g.time += sdt * 1000;

    if (g.queue.length) {
      const due = [];
      const rest = [];
      for (const q of g.queue) (q.at <= g.time ? due : rest).push(q);
      g.queue = rest;
      due.sort((a, b) => a.at - b.at).forEach((q) => q.fn());
    }

    g.shake = Math.max(0, g.shake - sdt * 2.4);
    g.zoom = Math.max(0, g.zoom - sdt * 0.9);
    g.fovKick -= g.fovKick * Math.min(1, dt * 4.5);
    if (Math.abs(g.fovKick) < 0.01) g.fovKick = 0;

    if (g.screen === "battle") {
      const dir = (g.held.r ? 1 : 0) - (g.held.l ? 1 : 0);
      if (dir) g.x = clamp(g.x + dir * MOVE_SPEED * sdt, X_MIN, X_MAX);
      g.stamina = Math.min(100, g.stamina + 24 * sdt);
      g.divine = Math.min(100, g.divine + 1.1 * sdt);
      if (g.combo > 0 && g.time - g.lastHitAt > 3500) g.combo = 0;
      if (!g.ended && !g.inPhase && g.time >= g.lakReadyAt) lakFire();
    }

    g.syncAcc += dt;
    if (g.syncAcc > 0.066) {
      g.syncAcc = 0;
      if (g.screen === "battle" || g.screen === "ending") sync(false);
    }
  }

  return {
    start,
    strike,
    dodge,
    divine,
    hold,
    tick,
    togglePause,
    sync,
    destroy() {
      audio.stopAmbience();
    },
  };
}

/* ========================================================================
   TEXTURE HELPERS  (everything is procedural, no assets required)
   ===================================================================== */

const texCache = {};
function cached(key, make) {
  if (!texCache[key]) texCache[key] = make();
  return texCache[key];
}
function finishTex(c) {
  const t = new THREE.CanvasTexture(c);
  if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function mkCanvas(w, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}

function radialTexture(key, stops) {
  return cached(key, () => {
    const [c, x] = mkCanvas(256);
    const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(([o, col]) => gr.addColorStop(o, col));
    x.fillStyle = gr;
    x.fillRect(0, 0, 256, 256);
    return finishTex(c);
  });
}

function rayTexture() {
  return cached("ray", () => {
    const [c, x] = mkCanvas(64, 256);
    const h = x.createLinearGradient(0, 0, 64, 0);
    h.addColorStop(0, "rgba(255,255,255,0)");
    h.addColorStop(0.5, "rgba(255,255,255,1)");
    h.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = h;
    x.fillRect(0, 0, 64, 256);
    x.globalCompositeOperation = "destination-in";
    const v = x.createLinearGradient(0, 0, 0, 256);
    v.addColorStop(0, "rgba(0,0,0,1)");
    v.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = v;
    x.fillRect(0, 0, 64, 256);
    return finishTex(c);
  });
}

/* grey-scale grain used as a bump map: gives skin, bark and stone real surface detail */
function bumpTexture() {
  return cached("bump", () => {
    const [c, x] = mkCanvas(256);
    x.fillStyle = "#808080";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1800; i++) {
      const v = Math.floor(70 + Math.random() * 120);
      x.fillStyle = `rgba(${v},${v},${v},0.28)`;
      x.beginPath();
      x.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 12, 0, Math.PI * 2);
      x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    return t;
  });
}

/* glowing lava veins, used as the emissive map on Viradha's skin */
function veinsTexture() {
  return cached("veins", () => {
    const [c, x] = mkCanvas(512);
    x.fillStyle = "#000";
    x.fillRect(0, 0, 512, 512);
    x.lineCap = "round";
    x.lineJoin = "round";
    x.shadowColor = "#ff5a1f";
    x.shadowBlur = 10;
    const walk = (sx, sy, ang, len, w, depth) => {
      x.beginPath();
      x.moveTo(sx, sy);
      let px = sx;
      let py = sy;
      let a = ang;
      for (let i = 0; i < len; i++) {
        a += (Math.random() - 0.5) * 0.9;
        px += Math.cos(a) * 14;
        py += Math.sin(a) * 14;
        x.lineTo(px, py);
        if (depth < 2 && Math.random() < 0.12) walk(px, py, a + (Math.random() < 0.5 ? 0.9 : -0.9), len - i, w * 0.6, depth + 1);
      }
      x.strokeStyle = `rgb(255,${Math.floor(120 + Math.random() * 90)},40)`;
      x.lineWidth = w;
      x.stroke();
    };
    for (let i = 0; i < 38; i++) walk(Math.random() * 512, Math.random() * 512, Math.random() * 6.28, 10 + Math.random() * 14, 1.5 + Math.random() * 2.2, 0);
    return finishTex(c);
  });
}

function barkTexture() {
  return cached("bark", () => {
    const [c, x] = mkCanvas(128, 256);
    x.fillStyle = "#4a3b2c";
    x.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 90; i++) {
      const px = Math.random() * 128;
      x.strokeStyle = Math.random() < 0.5 ? "rgba(20,14,8,0.55)" : "rgba(120,98,66,0.35)";
      x.lineWidth = 1 + Math.random() * 3;
      x.beginPath();
      x.moveTo(px, 0);
      x.bezierCurveTo(px + 6, 80, px - 6, 170, px + 2, 256);
      x.stroke();
    }
    const t = finishTex(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

function crackTexture() {
  return cached("crack", () => {
    const [c, x] = mkCanvas(256);
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,120,40,0.55)");
    g.addColorStop(0.25, "rgba(40,24,14,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    x.lineCap = "round";
    for (let i = 0; i < 16; i++) {
      let a = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
      let px = 128;
      let py = 128;
      x.beginPath();
      x.moveTo(px, py);
      const L = 4 + Math.floor(Math.random() * 5);
      for (let k = 0; k < L; k++) {
        a += (Math.random() - 0.5) * 0.7;
        px += Math.cos(a) * (12 + Math.random() * 10);
        py += Math.sin(a) * (12 + Math.random() * 10);
        x.lineTo(px, py);
      }
      x.strokeStyle = "rgba(14,9,5,0.9)";
      x.lineWidth = 2 + Math.random() * 2;
      x.stroke();
      x.strokeStyle = "rgba(255,130,50,0.45)";
      x.lineWidth = 0.8;
      x.stroke();
    }
    return finishTex(c);
  });
}

function arenaTexture() {
  return cached("arena", () => {
    const S = 1024;
    const [c, x] = mkCanvas(S);
    const m = S / 2;

    const base = x.createRadialGradient(m, m, 0, m, m, m);
    base.addColorStop(0, "#5d5036");
    base.addColorStop(0.6, "#4a4230");
    base.addColorStop(0.9, "#34382a");
    base.addColorStop(1, "rgba(37,50,38,0)");
    x.fillStyle = base;
    x.fillRect(0, 0, S, S);

    for (let i = 0; i < 3600; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * m * 0.95;
      x.fillStyle = `rgba(${Math.random() < 0.5 ? "20,16,8" : "140,118,70"},${Math.random() * 0.1})`;
      x.beginPath();
      x.arc(m + Math.cos(a) * r, m + Math.sin(a) * r, Math.random() * 4 + 1, 0, Math.PI * 2);
      x.fill();
    }

    /* flagstones */
    x.strokeStyle = "rgba(15,12,6,0.35)";
    x.lineWidth = 2;
    for (let ring = 1; ring <= 5; ring++) {
      const r = m * (0.12 + ring * 0.15);
      const n = 6 + ring * 5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.2;
        x.beginPath();
        x.moveTo(m + Math.cos(a) * (r - m * 0.075), m + Math.sin(a) * (r - m * 0.075));
        x.lineTo(m + Math.cos(a) * (r + m * 0.075), m + Math.sin(a) * (r + m * 0.075));
        x.stroke();
      }
    }

    x.strokeStyle = "rgba(226,190,120,0.45)";
    x.lineWidth = 3;
    [0.86, 0.8, 0.5, 0.26].forEach((r, i) => {
      x.globalAlpha = i === 1 ? 0.4 : 0.7;
      x.beginPath();
      x.arc(m, m, m * r, 0, Math.PI * 2);
      x.stroke();
    });
    x.globalAlpha = 0.55;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r1 = m * 0.8;
      const r2 = m * (i % 4 === 0 ? 0.73 : 0.77);
      x.beginPath();
      x.moveTo(m + Math.cos(a) * r1, m + Math.sin(a) * r1);
      x.lineTo(m + Math.cos(a) * r2, m + Math.sin(a) * r2);
      x.stroke();
    }
    x.globalAlpha = 0.5;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      x.save();
      x.translate(m, m);
      x.rotate(a);
      x.beginPath();
      x.moveTo(0, -m * 0.26);
      x.quadraticCurveTo(m * 0.12, -m * 0.38, 0, -m * 0.5);
      x.quadraticCurveTo(-m * 0.12, -m * 0.38, 0, -m * 0.26);
      x.stroke();
      x.restore();
    }
    return finishTex(c);
  });
}

/* ========================================================================
   WORLD
   ===================================================================== */

const FOLIAGE = ["#2c4630", "#37573a", "#456340", "#213a2b", "#4f6a3d"];

function Tree({ position, scale = 1, rotation = 0, tint = 0, bark }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.42, 3.4, 9]} />
        <meshStandardMaterial map={bark} color="#9a8a76" roughness={1} />
      </mesh>
      {/* buttress roots */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 0.32, 0.18, Math.sin(i * 2.1) * 0.32]} rotation={[0, 0, Math.cos(i * 2.1) * 0.5]} castShadow>
          <coneGeometry args={[0.16, 0.7, 5]} />
          <meshStandardMaterial map={bark} color="#8a7a66" roughness={1} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((layer) => (
        <mesh
          key={layer}
          position={[Math.sin(layer * 2.1) * 0.38, 2.7 + layer * 0.74, Math.cos(layer * 2.1) * 0.32]}
          scale={[1.8 - layer * 0.28, 1.15, 1.62 - layer * 0.25]}
          castShadow
        >
          <icosahedronGeometry args={[0.95, 1]} />
          <meshStandardMaterial color={FOLIAGE[(layer + tint) % FOLIAGE.length]} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Grass() {
  const ref = useRef();
  const COUNT = 900;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      const h = random(0.2, 0.7);
      d.position.set(random(-14, 14), h / 2 - 0.05, random(-9, 7));
      d.rotation.set(0, random(-3, 3), random(-0.2, 0.2));
      d.scale.set(1, h / 0.4, 1);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
      col.set(["#68704a", "#4d6340", "#7b8153", "#3d5636", "#8a9060"][i % 5]);
      m.setColorAt(i, col);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <coneGeometry args={[0.05, 0.4, 4]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  );
}

function Flowers() {
  const ref = useRef();
  const COUNT = 130;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      d.position.set(random(-13, 13), random(0.15, 0.4), random(-8, -1));
      d.scale.setScalar(random(0.6, 1.3));
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
      col.set(["#f2d27a", "#e9e3c8", "#e08a5a", "#c7a3e0"][i % 4]);
      m.setColorAt(i, col);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <sphereGeometry args={[0.05, 6, 6]} />
      <meshStandardMaterial roughness={0.8} emissive="#443311" emissiveIntensity={0.4} />
    </instancedMesh>
  );
}

function ridgeGeometry(seed, amp, base) {
  const s = new THREE.Shape();
  s.moveTo(-95, -6);
  for (let x = -95; x <= 95; x += 3) {
    const y =
      base +
      (Math.sin(x * 0.07 + seed) * 0.5 + Math.sin(x * 0.19 + seed * 2) * 0.3 + Math.sin(x * 0.43 + seed * 3) * 0.2 + 0.7) * amp;
    s.lineTo(x, y);
  }
  s.lineTo(95, -6);
  s.closePath();
  return new THREE.ShapeGeometry(s);
}

const Mountains = memo(function Mountains() {
  const layers = useMemo(
    () => [
      { z: -64, geo: ridgeGeometry(1.2, 6.5, 1.5), color: "#4e6e66" },
      { z: -52, geo: ridgeGeometry(3.7, 5.2, 0.6), color: "#3a5a4f" },
      { z: -43, geo: ridgeGeometry(6.1, 4, 0), color: "#2b463b" },
    ],
    []
  );
  return (
    <>
      {layers.map((l, i) => (
        <mesh key={i} geometry={l.geo} position={[0, 0, l.z]}>
          <meshBasicMaterial color={l.color} fog={false} />
        </mesh>
      ))}
    </>
  );
});

const runeMat = new THREE.MeshBasicMaterial({
  color: "#f0c872",
  transparent: true,
  opacity: 0.7,
  toneMapped: false,
  depthWrite: false,
});
const RUNE_GOLD = new THREE.Color("#f0c872");
const RUNE_EMBER = new THREE.Color("#ff6a30");

/* ancient broken pillars ring the arena, runes glow with the boss's fury */
function Ruins({ gRef }) {
  const bump = useMemo(bumpTexture, []);
  const items = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI * (1.08 + i * 0.105);
        const R = 9.6 + random(-0.4, 0.9);
        return {
          x: Math.cos(a) * R * 1.3,
          z: Math.sin(a) * R * 0.62 - 0.6,
          h: random(2.2, 4.6),
          r: random(0.38, 0.52),
          tilt: random(-0.06, 0.06),
          cap: Math.random() < 0.55,
        };
      }),
    []
  );
  const fallen = useMemo(
    () => [
      { p: [-7.4, 0.25, 2.6], r: [0, 0.7, Math.PI / 2], l: 2.2 },
      { p: [7.9, 0.25, -1.6], r: [0, -0.4, Math.PI / 2], l: 1.6 },
    ],
    []
  );
  useFrame((state) => {
    const g = gRef.current;
    const t = state.clock.elapsedTime;
    const ph = g.phase;
    runeMat.color.copy(RUNE_GOLD).lerp(RUNE_EMBER, (ph - 1) / 2);
    runeMat.opacity = 0.45 + 0.3 * Math.sin(t * (1.2 + ph * 0.6));
  });
  return (
    <>
      {items.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation={[p.tilt, 0, p.tilt]}>
          <mesh position={[0, p.h / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[p.r * 0.9, p.r, p.h, 10]} />
            <meshStandardMaterial color="#8a8068" roughness={1} bumpMap={bump} bumpScale={3} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[p.r * 1.25, p.r * 1.35, 0.4, 10]} />
            <meshStandardMaterial color="#6f664f" roughness={1} bumpMap={bump} bumpScale={3} />
          </mesh>
          {p.cap ? (
            <mesh position={[0, p.h + 0.18, 0]} castShadow>
              <boxGeometry args={[p.r * 2.5, 0.36, p.r * 2.5]} />
              <meshStandardMaterial color="#7b7159" roughness={1} bumpMap={bump} bumpScale={3} />
            </mesh>
          ) : (
            <mesh position={[0.1, p.h + 0.02, 0]} rotation={[0.3, 0, 0.4]} castShadow>
              <dodecahedronGeometry args={[p.r * 0.95, 0]} />
              <meshStandardMaterial color="#7b7159" roughness={1} flatShading />
            </mesh>
          )}
          {[0.35, 0.5, 0.65].map((f) => (
            <mesh key={f} position={[0, p.h * f, p.r * 0.93]} material={runeMat}>
              <planeGeometry args={[p.r * 0.7, 0.05]} />
            </mesh>
          ))}
          <mesh position={[0, p.h * 0.5, p.r * 0.94]} material={runeMat}>
            <planeGeometry args={[0.05, p.h * 0.34]} />
          </mesh>
        </group>
      ))}
      {fallen.map((f, i) => (
        <mesh key={i} position={f.p} rotation={f.r} castShadow receiveShadow>
          <cylinderGeometry args={[0.42, 0.45, f.l, 10]} />
          <meshStandardMaterial color="#7a7058" roughness={1} bumpMap={bump} bumpScale={3} />
        </mesh>
      ))}
    </>
  );
}

const Forest = memo(function Forest() {
  const bump = useMemo(bumpTexture, []);
  const bark = useMemo(barkTexture, []);
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color("#102838") },
          mid: { value: new THREE.Color("#4f7a6a") },
          hor: { value: new THREE.Color("#f2c27a") },
        },
        vertexShader:
          "varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
        fragmentShader:
          "varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 hor; void main(){ float h=clamp(vP.y,0.0,1.0); vec3 c=mix(hor,mid,smoothstep(0.0,0.22,h)); c=mix(c,top,smoothstep(0.18,0.8,h)); float sun=pow(max(dot(normalize(vP),normalize(vec3(-0.17,0.2,-0.96))),0.0),24.0); c+=vec3(1.0,0.78,0.45)*sun*0.55; gl_FragColor=vec4(c,1.0); }",
      }),
    []
  );

  const arenaTex = useMemo(arenaTexture, []);
  const sunGlow = useMemo(
    () =>
      radialTexture("sun", [
        [0, "rgba(255,236,170,1)"],
        [0.22, "rgba(255,205,115,0.6)"],
        [1, "rgba(255,170,80,0)"],
      ]),
    []
  );

  const back = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        x: random(-19, 19),
        z: random(-19, -4.8),
        scale: random(1.1, 2.1),
        rotation: random(0, Math.PI * 2),
        tint: i % 5,
      })),
    []
  );
  const front = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: (i % 2 ? 1 : -1) * random(8.6, 13),
        z: random(1, 7),
        scale: random(1.5, 2.3),
        rotation: random(0, Math.PI * 2),
        tint: i % 5,
      })),
    []
  );
  const rocks = useMemo(
    () =>
      Array.from({ length: 22 }, () => ({
        p: [random(-10, 10), 0.04, random(-6.5, 6)],
        r: [random(0, 1), random(0, 3), random(0, 1)],
        s: [random(0.2, 0.62), random(0.1, 0.24), random(0.2, 0.52)],
      })),
    []
  );

  return (
    <>
      <fog attach="fog" args={["#2c4235", 16, 58]} />

      <mesh material={skyMat} scale={90}>
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      <mesh position={[-14, 16, -80]}>
        <circleGeometry args={[4.4, 48]} />
        <meshBasicMaterial color="#fff0c4" fog={false} toneMapped={false} />
      </mesh>
      <mesh position={[-14, 16, -80.2]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial
          map={sunGlow}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <Mountains />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#27392a" roughness={1} bumpMap={bump} bumpScale={2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[8.2, 64]} />
        <meshStandardMaterial map={arenaTex} transparent roughness={1} depthWrite={false} bumpMap={bump} bumpScale={1.5} />
      </mesh>

      <Grass />
      <Flowers />
      {rocks.map((r, i) => (
        <mesh key={i} position={r.p} rotation={r.r} scale={r.s} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#675f48" roughness={1} flatShading />
        </mesh>
      ))}

      {back.map((t, i) => (
        <Tree key={`b${i}`} position={[t.x, 0, t.z]} scale={t.scale} rotation={t.rotation} tint={t.tint} bark={bark} />
      ))}
      {front.map((t, i) => (
        <Tree key={`f${i}`} position={[t.x, 0, t.z]} scale={t.scale} rotation={t.rotation} tint={t.tint} bark={bark} />
      ))}

      <Sparkles count={80} scale={[22, 7, 16]} size={2.4} speed={0.22} opacity={0.55} color="#f0cf80" />
      <Sparkles count={50} scale={[24, 8, 18]} size={1.1} speed={0.1} opacity={0.22} color="#dfe8c8" />
    </>
  );
});

function Rays() {
  const tex = useMemo(rayTexture, []);
  const refs = useRef([]);
  const rays = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        x: -13 + i * 2.6 + random(-0.8, 0.8),
        w: random(1.2, 2.8),
        o: random(0.07, 0.15),
        ph: random(0, 6),
      })),
    []
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (m) m.material.opacity = rays[i].o * (0.65 + 0.35 * Math.sin(t * 0.5 + rays[i].ph));
    });
  });
  return (
    <group position={[0, 6.5, -6]} rotation={[0, 0, -0.42]}>
      {rays.map((r, i) => (
        <mesh key={i} position={[r.x, 0, 0]} ref={(el) => (refs.current[i] = el)}>
          <planeGeometry args={[r.w, 17]} />
          <meshBasicMaterial
            map={tex}
            color="#ffdc9a"
            transparent
            opacity={r.o}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Mist() {
  const tex = useMemo(
    () =>
      radialTexture("mist", [
        [0, "rgba(220,230,205,0.9)"],
        [1, "rgba(220,230,205,0)"],
      ]),
    []
  );
  const refs = useRef([]);
  const items = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        x: -11 + i * 3.2,
        z: random(-6, 3),
        s: random(8, 12),
        ph: random(0, 6),
      })),
    []
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (m) m.position.x = items[i].x + Math.sin(t * 0.12 + items[i].ph) * 1.6;
    });
  });
  return (
    <>
      {items.map((m, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={[m.x, 0.7, m.z]}>
          <planeGeometry args={[m.s, m.s * 0.28]} />
          <meshBasicMaterial map={tex} transparent opacity={0.16} depthWrite={false} fog={false} />
        </mesh>
      ))}
    </>
  );
}

function Leaves() {
  const ref = useRef();
  const COUNT = 46;
  const data = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: random(-12, 12),
        y: random(0.5, 8),
        z: random(-5, 6),
        vx: random(0.1, 0.4),
        vy: random(0.25, 0.6),
        sp: random(1, 3),
        ph: random(0, 6),
      })),
    []
  );
  const d = useMemo(() => new THREE.Object3D(), []);
  useFrame((s, delta) => {
    const m = ref.current;
    if (!m) return;
    const t = s.clock.elapsedTime;
    data.forEach((l, i) => {
      l.x += l.vx * delta;
      l.y -= l.vy * delta;
      if (l.y < 0.05) l.y = 8;
      if (l.x > 12) l.x = -12;
      d.position.set(l.x + Math.sin(t * l.sp + l.ph) * 0.4, l.y, l.z);
      d.rotation.set(t * l.sp, t * 0.7 + l.ph, t * 0.5);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <planeGeometry args={[0.13, 0.08]} />
      <meshStandardMaterial color="#c0903c" side={THREE.DoubleSide} roughness={1} />
    </instancedMesh>
  );
}

/* the ritual circle glows brighter and angrier as the fight escalates */
function ArenaGlow({ gRef }) {
  const ring = useRef();
  const ring2 = useRef();
  const c = useMemo(() => new THREE.Color(), []);
  useFrame((state) => {
    const g = gRef.current;
    const t = state.clock.elapsedTime;
    const k = (g.phase - 1) / 2;
    c.copy(RUNE_GOLD).lerp(RUNE_EMBER, k);
    const slam = Math.max(0, 1 - (g.time - g.slamAt) / 500);
    if (ring.current) {
      ring.current.material.color.copy(c);
      ring.current.material.opacity = 0.16 + 0.1 * Math.sin(t * 1.4) + slam * 0.5 + k * 0.1;
    }
    if (ring2.current) {
      ring2.current.material.color.copy(c);
      ring2.current.material.opacity = 0.1 + 0.07 * Math.sin(t * 2 + 1) + slam * 0.3;
      ring2.current.rotation.z = t * 0.05;
    }
  });
  const addMat = () => (
    <meshBasicMaterial
      color="#f0c872"
      transparent
      opacity={0.2}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
      toneMapped={false}
    />
  );
  return (
    <>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[7.0, 7.12, 96]} />
        {addMat()}
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]}>
        <ringGeometry args={[4.0, 4.07, 96]} />
        {addMat()}
      </mesh>
    </>
  );
}

/* cracks left in the ground by every impact, fading after a few seconds */
function Scars({ gRef }) {
  const refs = useRef([]);
  const tex = useMemo(crackTexture, []);
  useFrame(() => {
    const g = gRef.current;
    for (let i = 0; i < 8; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const s = g.scars[i];
      if (!s) {
        m.visible = false;
        continue;
      }
      const age = g.time - s.at;
      const o = clamp(age / 80, 0, 1) * clamp(1 - (age - 6000) / 3000, 0, 1);
      m.visible = o > 0.01;
      m.position.set(s.x, 0.022 + i * 0.0004, 0);
      m.scale.setScalar(s.r * 2.6);
      m.material.opacity = o;
    }
  });
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} rotation={[-Math.PI / 2, 0, i * 0.8]} visible={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}
    </>
  );
}

const _lp = new THREE.Vector3();

function Lights({ gRef }) {
  const arrowA = useRef();
  const arrowB = useRef();
  const hit = useRef();
  const red = useRef();
  const gold = useRef();
  const fill = useRef();
  useFrame(() => {
    const g = gRef.current;
    const f = Math.max(0, 1 - (g.time - g.bossHitAt) / 240);
    if (hit.current) {
      hit.current.intensity = f * 6;
      hit.current.position.x = g.bossX - 0.6;
    }
    if (red.current) {
      const slam = Math.max(0, 1 - (g.time - g.slamAt) / 260);
      red.current.intensity = [0.3, 1.1, 2.3][g.phase - 1] * (0.85 + 0.15 * Math.sin(g.time / 180)) + slam * 2.4;
      red.current.position.x = g.bossX;
    }
    if (gold.current) {
      const d = (g.time - g.divineAt) / 1000;
      gold.current.intensity = d >= 0 && d < 1.6 ? 9 * (1 - d / 1.6) : 0;
      gold.current.position.x = g.x;
    }
    [
      [arrowA, "rama"],
      [arrowB, "lak"],
    ].forEach(([r, who]) => {
      if (!r.current) return;
      if (arrowPoint(g, who, _lp) < 0) {
        r.current.intensity = 0;
      } else {
        r.current.intensity = 2.4;
        r.current.position.copy(_lp);
      }
    });
    if (fill.current) {
      fill.current.position.x = g.x;
      fill.current.intensity = 0.9 + (g.time < g.evadeUntil ? 1.4 : 0);
    }
  });
  return (
    <>
      <ambientLight intensity={0.55} color="#d7d0a8" />
      <hemisphereLight args={["#bfd3b2", "#2a2418", 0.7]} />
      <directionalLight
        position={[-8, 12, 7]}
        intensity={2.6}
        color="#ffdfa0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={9}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[9, 5, -7]} intensity={1.1} color="#78c4b4" />
      <pointLight ref={hit} position={[3, 2.5, 1]} color="#ffd98f" distance={9} intensity={0} />
      <pointLight ref={red} position={[3.7, 2.4, 1.5]} color="#ff4a22" distance={10} intensity={0.3} />
      <pointLight ref={gold} position={[0, 2.5, 1.5]} color="#ffe6a0" distance={14} intensity={0} />
      <pointLight ref={fill} position={[-3.2, 2.2, 2.4]} color="#ffd9a0" distance={6} intensity={0.9} />
      <pointLight ref={arrowA} color="#ffd27a" distance={4} intensity={0} />
      <pointLight ref={arrowB} color="#ffd27a" distance={4} intensity={0} />
    </>
  );
}

function CameraRig({ gRef }) {
  const { camera } = useThree();
  const look = useMemo(() => new THREE.Vector3(0.2, 1.9, 0), []);
  const cur = useMemo(() => new THREE.Vector3(0, 4.4, 12.5), []);
  useFrame((state, delta) => {
    const g = gRef.current;
    const t = state.clock.elapsedTime;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const dist = clamp(7.6 / (0.384 * aspect), 12.5, 34);
    let tx = g.x * 0.12 + Math.sin(t * 0.7) * 0.06;
    let ty = 4.2 + (dist - 12.5) * 0.12 + Math.sin(t * 0.9) * 0.03;
    let tz = dist;
    let lx = 0.2 + g.x * 0.06;
    let ly = 1.9;
    if (g.screen === "intro") {
      tx = Math.sin(t * 0.18) * 3.2;
      ty = 3.3 + Math.sin(t * 0.23) * 0.4;
      tz = dist - 1.5;
      lx = 0.5;
      ly = 2.1;
    } else if (g.victory && (g.screen === "ending" || g.screen === "victory")) {
      const k = clamp((g.time - g.endTime) / 3000, 0, 1);
      tx = lerp(g.x * 0.3, 1.2, k);
      ty = lerp(3.4, 3.6, k);
      tz = dist - 3 - k * 1.2;
      lx = 1.4;
      ly = 2.2 + k * 1.6;
    } else if (g.screen === "battle") {
      if (g.bossAction === "prepare") tz -= 0.5;
      if (g.bossAction === "roar") {
        tz -= 0.9;
        ty -= 0.3;
      }
    }
    tz -= g.zoom * 1.8;
    cur.set(damp(cur.x, tx, 2.6, delta), damp(cur.y, ty, 2.6, delta), damp(cur.z, tz, 2.6, delta));
    const k = g.shake * 0.28;
    camera.position.set(cur.x + (Math.random() - 0.5) * k, cur.y + (Math.random() - 0.5) * k, cur.z);
    look.set(damp(look.x, lx, 3, delta), damp(look.y, ly, 3, delta), 0);
    camera.lookAt(look);

    const fov = 42 + g.fovKick;
    if (Math.abs(camera.fov - fov) > 0.02) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/* ========================================================================
   CHARACTERS
   ===================================================================== */

const SH = 1.85; // shoulder height of archers

const PALETTES = {
  rama: {
    skin: "#5b86ad",
    cloth: "#e2ab3c",
    sash: "#b9442b",
    hair: "#17120f",
    gold: "#f2c864",
  },
  lakshmana: {
    skin: "#b8825a",
    cloth: "#ece0bd",
    sash: "#3e7b57",
    hair: "#1a1410",
    gold: "#e3b85c",
  },
};

function setSegment(mesh, a, b, tmp) {
  tmp.subVectors(b, a);
  const len = tmp.length() || 0.001;
  mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(UP, tmp.divideScalar(len));
}

function Archer({ gRef, role }) {
  const isRama = role === "rama";
  const p = PALETTES[role];
  const root = useRef();
  const body = useRef();
  const head = useRef();
  const hipL = useRef();
  const hipR = useRef();
  const shL = useRef();
  const elL = useRef();
  const shR = useRef();
  const elR = useRef();
  const bow = useRef();
  const sTop = useRef();
  const sBot = useRef();
  const nock = useRef();
  const nockTip = useRef();
  const halo = useRef();
  const haloGlow = useRef();
  const trail = useRef();
  const sash = useRef([]);
  const ang = useRef({ b1: 0.5, b2: 0.35, a1: -0.12, a2: -0.22 });
  const v = useMemo(
    () => ({
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      t: new THREE.Vector3(),
    }),
    []
  );
  const glowTex = useMemo(
    () =>
      radialTexture("halo", [
        [0, "rgba(255,226,150,0.95)"],
        [0.5, "rgba(255,200,110,0.35)"],
        [1, "rgba(255,190,90,0)"],
      ]),
    []
  );

  useFrame((state, delta) => {
    const g = gRef.current;
    const R = root.current;
    if (!R) return;
    const t = state.clock.elapsedTime;

    let mode = "idle";
    let since = 0;
    if (isRama) {
      mode = g.playerAction;
      since = (g.time - g.playerActionAt) / 1000;
    } else {
      const ls = (g.time - g.lakAt) / 1000;
      if (ls >= 0 && ls < 0.6) {
        mode = "attack";
        since = ls;
      } else if (g.bossAction === "prepare" || g.bossAction === "attack") {
        mode = "ready";
      }
    }
    const evading = isRama && mode === "dodge";

    if (isRama) R.position.x = damp(R.position.x, g.x, evading ? 20 : 9, delta);

    let draw = 0;
    if (mode === "attack") draw = since < 0.3 ? since / 0.3 : Math.max(0, 1 - (since - 0.3) / 0.16);
    if (mode === "ready") draw = 0.8;

    let tb1;
    let tb2;
    let ta1;
    let ta2;
    if (mode === "victory") {
      tb1 = 2.5; tb2 = 2.8; ta1 = -2.4; ta2 = -2.7;
    } else if (mode === "divine") {
      tb1 = 1.9; tb2 = 2.2; ta1 = -1.9; ta2 = -2.2;
    } else if (mode === "defeat") {
      tb1 = 0.15; tb2 = 0.1; ta1 = -0.1; ta2 = -0.1;
    } else {
      tb1 = lerp(0.5, 1.45, draw);
      tb2 = lerp(0.35, 1.55, draw);
      ta1 = lerp(-0.12, -1.4, draw);
      ta2 = lerp(-0.22, 1.6, draw);
    }
    const breathe = Math.sin(t * 2) * 0.03;
    const A = ang.current;
    A.b1 = damp(A.b1, tb1 + breathe, 16, delta);
    A.b2 = damp(A.b2, tb2 + breathe, 16, delta);
    A.a1 = damp(A.a1, ta1 - breathe, 16, delta);
    A.a2 = damp(A.a2, ta2 - breathe, 16, delta);

    if (shL.current) {
      shL.current.rotation.z = A.b1;
      elL.current.rotation.z = A.b2 - A.b1;
      shR.current.rotation.z = A.a1;
      elR.current.rotation.z = A.a2 - A.a1;
    }

    const hLx = 0.34 + 0.42 * (Math.sin(A.b1) + Math.sin(A.b2));
    const hLy = SH - 0.42 * (Math.cos(A.b1) + Math.cos(A.b2));
    const hRx = -0.34 + 0.42 * (Math.sin(A.a1) + Math.sin(A.a2));
    const hRy = SH - 0.42 * (Math.cos(A.a1) + Math.cos(A.a2));
    const bx = hLx - 0.5;
    const by = hLy;
    const pull = mode === "attack" || mode === "ready" ? draw : 0;
    const nx = lerp(bx, hRx, pull);
    const ny = lerp(by, hRy, pull);

    if (bow.current) {
      bow.current.position.set(bx, by, 0.1);
      v.a.set(bx, by + 0.5, 0.1);
      v.b.set(nx, ny, 0.1);
      setSegment(sTop.current, v.a, v.b, v.t);
      v.a.set(bx, by - 0.5, 0.1);
      setSegment(sBot.current, v.a, v.b, v.t);

      const showArrow = pull > 0.05 && (mode === "ready" || since < 0.3);
      nock.current.visible = showArrow;
      nockTip.current.visible = showArrow;
      if (showArrow) {
        v.a.set(nx, ny, 0.1);
        v.b.set(bx + 0.62, by, 0.1);
        setSegment(nock.current, v.a, v.b, v.t);
        nockTip.current.position.copy(v.b);
      }
    }

    const hitF = isRama ? Math.max(0, 1 - (g.time - g.playerHitAt) / 350) : 0;
    const lean = evading ? -0.32 * g.dodgeDir : 0;
    if (body.current) {
      body.current.rotation.z = damp(body.current.rotation.z, lean + hitF * 0.28, 12, delta);
      body.current.position.y = Math.sin(t * 2.2) * 0.02;
    }

    const moving = isRama && g.screen === "battle" && (g.held.l || g.held.r);
    const sw = moving ? Math.sin(t * 12) * 0.45 : Math.sin(t * 1.5) * 0.02;
    if (hipL.current) {
      hipL.current.rotation.z = sw;
      hipR.current.rotation.z = -sw;
    }

    /* the sash flutters; it streams back harder when running or evading */
    const flow = moving || evading ? 0.55 : 0.18;
    sash.current.forEach((s, i) => {
      if (!s) return;
      s.rotation.x = damp(s.rotation.x, flow + Math.sin(t * 2.6 - i * 0.9) * 0.14, 8, delta);
      s.rotation.z = Math.sin(t * 1.7 - i) * 0.08;
    });

    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.6) * 0.08 + 0.1;
      head.current.rotation.z = mode === "victory" ? 0.1 : 0;
    }

    if (isRama) {
      if (mode === "defeat") {
        R.rotation.z = damp(R.rotation.z, 1.4, 4, delta);
        R.position.y = damp(R.position.y, 0.18, 4, delta);
      } else {
        R.rotation.z = damp(R.rotation.z, 0, 8, delta);
        R.position.y = mode === "victory" ? Math.abs(Math.sin(t * 3)) * 0.08 : damp(R.position.y, 0, 8, delta);
      }
      const ready = g.divine >= 100 && g.screen === "battle";
      const strong = mode === "divine" || mode === "victory";
      if (halo.current) {
        halo.current.material.opacity = damp(halo.current.material.opacity, strong ? 0.95 : ready ? 0.7 : 0.35, 6, delta);
        halo.current.rotation.z += delta * (strong ? 2.2 : ready ? 1.1 : 0.4);
        const s = strong ? 1.7 + Math.sin(t * 6) * 0.1 : ready ? 1.2 : 1;
        halo.current.scale.setScalar(damp(halo.current.scale.x, s, 6, delta));
      }
      if (haloGlow.current) {
        haloGlow.current.material.opacity = damp(haloGlow.current.material.opacity, strong ? 0.9 : ready ? 0.55 : 0.25, 6, delta);
        haloGlow.current.scale.setScalar(damp(haloGlow.current.scale.x, strong ? 3.8 : ready ? 2.2 : 1.5, 5, delta));
      }
      if (trail.current) trail.current.visible = evading;
    }
  });

  const limb = <meshStandardMaterial color={p.skin} roughness={0.7} />;
  const goldMat = <meshStandardMaterial color={p.gold} metalness={0.8} roughness={0.25} />;

  const sashChain = (i) =>
    i >= 3 ? null : (
      <group ref={(el) => (sash.current[i] = el)} position={[0, i === 0 ? 0 : -0.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.15 - i * 0.025, 0.3, 0.015]} />
          <meshStandardMaterial color={p.sash} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {sashChain(i + 1)}
      </group>
    );

  return (
    <group
      ref={root}
      position={isRama ? [-3.2, 0, 0] : [-5.5, 0, -1.6]}
      scale={isRama ? 1 : 0.92}
      rotation={[0, isRama ? 0.2 : 0.15, 0]}
    >
      <group ref={body}>
        {/* legs */}
        {[
          [hipL, -0.17],
          [hipR, 0.17],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref} position={[x, 0.98, 0]}>
            <mesh position={[0, -0.45, 0]} castShadow>
              <capsuleGeometry args={[0.1, 0.62, 5, 10]} />
              {limb}
            </mesh>
            <mesh position={[0, -0.78, 0]}>
              <torusGeometry args={[0.105, 0.018, 6, 14]} />
              {goldMat}
            </mesh>
            <mesh position={[0, -0.92, 0.07]} castShadow>
              <boxGeometry args={[0.17, 0.09, 0.3]} />
              <meshStandardMaterial color={p.hair} roughness={0.9} />
            </mesh>
          </group>
        ))}

        {/* dhoti */}
        <mesh position={[0, 0.92, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.42, 0.78, 16, 1, true]} />
          <meshStandardMaterial color={p.cloth} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.05, 8, 28]} />
          <meshStandardMaterial color={p.sash} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.3, 0.3]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          {goldMat}
        </mesh>

        {/* trailing sash */}
        <group position={[0.1, 1.32, -0.3]}>{sashChain(0)}</group>

        {/* torso */}
        <mesh position={[0, 1.58, 0]} castShadow>
          <capsuleGeometry args={[0.27, 0.36, 6, 14]} />
          {limb}
        </mesh>
        <mesh position={[0.02, 1.62, 0.26]} rotation={[0, 0, 0.72]}>
          <boxGeometry args={[0.09, 0.8, 0.03]} />
          <meshStandardMaterial color={p.sash} roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.88, 0.05]} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[0.2, 0.022, 8, 24]} />
          <meshStandardMaterial color={p.gold} metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0, 1.7, 0.27]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#e3405a" emissive="#7a1630" emissiveIntensity={0.7} />
        </mesh>

        {/* quiver */}
        <group position={[-0.2, 1.62, -0.3]} rotation={[0, 0, 0.35]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.09, 0.85, 10]} />
            <meshStandardMaterial color="#6a4528" roughness={0.9} />
          </mesh>
          {[-0.04, 0, 0.04].map((o, i) => (
            <mesh key={i} position={[o, 0.5, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.3, 5]} />
              <meshStandardMaterial color="#cdb98a" />
            </mesh>
          ))}
          {[-0.04, 0, 0.04].map((o, i) => (
            <mesh key={`f${i}`} position={[o, 0.66, 0]}>
              <coneGeometry args={[0.03, 0.1, 5]} />
              <meshStandardMaterial color={i === 1 ? p.sash : "#e8dcc0"} />
            </mesh>
          ))}
        </group>

        {/* head */}
        <group ref={head} position={[0, 2.3, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.22, 22, 22]} />
            {limb}
          </mesh>
          <mesh position={[0, 0.12, -0.03]}>
            <sphereGeometry args={[0.225, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color={p.hair} roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.3, -0.04]}>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color={p.hair} roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2 - 0.15, 0, 0]}>
            <torusGeometry args={[0.2, 0.025, 8, 24]} />
            {goldMat}
          </mesh>
          <mesh position={[0, 0.04, 0.215]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color="#b5301f" />
          </mesh>
          <mesh position={[-0.075, -0.01, 0.2]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color="#1a100c" />
          </mesh>
          <mesh position={[0.075, -0.01, 0.2]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color="#1a100c" />
          </mesh>
          {[-0.22, 0.22].map((x) => (
            <mesh key={x} position={[x, -0.07, 0]}>
              <sphereGeometry args={[0.035, 8, 8]} />
              {goldMat}
            </mesh>
          ))}
        </group>

        {/* arms: left = bow arm, right = string arm */}
        {[
          [shL, elL, 0.34],
          [shR, elR, -0.34],
        ].map(([sh, el, x], i) => (
          <group key={i} ref={sh} position={[x, SH, 0]}>
            <mesh position={[0, -0.21, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.28, 5, 8]} />
              {limb}
            </mesh>
            <mesh position={[0, -0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.08, 0.016, 6, 14]} />
              {goldMat}
            </mesh>
            <group ref={el} position={[0, -0.42, 0]}>
              <mesh position={[0, -0.2, 0]} castShadow>
                <capsuleGeometry args={[0.065, 0.26, 5, 8]} />
                {limb}
              </mesh>
              <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.07, 0.02, 6, 14]} />
                {goldMat}
              </mesh>
              <mesh position={[0, -0.43, 0]}>
                <sphereGeometry args={[0.07, 10, 10]} />
                {limb}
              </mesh>
            </group>
          </group>
        ))}

        {/* bow */}
        <group ref={bow}>
          <group rotation={[0, 0, -Math.PI / 2]}>
            <mesh castShadow>
              <torusGeometry args={[0.5, 0.032, 8, 28, Math.PI]} />
              <meshStandardMaterial color="#7d4a24" roughness={0.5} />
            </mesh>
          </group>
          <mesh position={[0.5, 0, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            {goldMat}
          </mesh>
        </group>
        <mesh ref={sTop}>
          <cylinderGeometry args={[0.006, 0.006, 1, 4]} />
          <meshBasicMaterial color="#efe3bb" />
        </mesh>
        <mesh ref={sBot}>
          <cylinderGeometry args={[0.006, 0.006, 1, 4]} />
          <meshBasicMaterial color="#efe3bb" />
        </mesh>
        <mesh ref={nock} visible={false}>
          <cylinderGeometry args={[0.014, 0.014, 1, 6]} />
          <meshStandardMaterial color="#f5dc96" emissive="#a86a20" emissiveIntensity={0.8} />
        </mesh>
        <mesh ref={nockTip} visible={false} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.04, 0.12, 6]} />
          <meshStandardMaterial color="#f5dc96" emissive="#a86a20" emissiveIntensity={0.9} />
        </mesh>

        {isRama && (
          <>
            <mesh ref={halo} position={[0, 2.38, -0.3]}>
              <ringGeometry args={[0.48, 0.52, 48]} />
              <meshBasicMaterial color="#ffd885" transparent opacity={0.35} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
            </mesh>
            <mesh ref={haloGlow} position={[0, 2.38, -0.32]}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                map={glowTex}
                transparent
                opacity={0.25}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            <group ref={trail} visible={false} position={[0, 1.2, 0]}>
              <Sparkles count={26} scale={[1.6, 2.4, 1]} size={5} speed={2} opacity={0.9} color="#bfe9ff" />
            </group>
          </>
        )}
      </group>
    </group>
  );
}

function SitaModel({ scale = 1 }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.34, 0.85, 14, 1, true]} />
        <meshStandardMaterial color="#e5b72e" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.2, 5, 10]} />
        <meshStandardMaterial color="#d6472f" roughness={0.75} />
      </mesh>
      <mesh position={[0.02, 1.0, 0.16]} rotation={[0, 0, 0.7]}>
        <boxGeometry args={[0.08, 0.5, 0.03]} />
        <meshStandardMaterial color="#f0c24a" />
      </mesh>
      <mesh position={[0, 1.38, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#c58c62" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.44, -0.03]}>
        <sphereGeometry args={[0.155, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color="#17120f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.05, -0.17]} rotation={[0.1, 0, 0]}>
        <capsuleGeometry args={[0.035, 0.7, 4, 8]} />
        <meshStandardMaterial color="#17120f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.34, 0.145]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshBasicMaterial color="#b5301f" />
      </mesh>
      <mesh position={[0, 1.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.012, 6, 16]} />
        <meshStandardMaterial color="#f2c864" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

const SKIN_BASE = new THREE.Color("#6b4636");
const SKIN_HOT = new THREE.Color("#ffb08a");

function Viradha({ gRef }) {
  const bump = useMemo(bumpTexture, []);
  const veins = useMemo(veinsTexture, []);
  const blob = useMemo(
    () =>
      radialTexture("blob", [
        [0, "rgba(0,0,0,0.6)"],
        [1, "rgba(0,0,0,0)"],
      ]),
    []
  );
  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({
        color: "#6b4636",
        roughness: 0.82,
        bumpMap: bump,
        bumpScale: 2.4,
        emissive: new THREE.Color("#ff5a1f"),
        emissiveMap: veins,
        emissiveIntensity: 0.1,
      }),
      deep: new THREE.MeshStandardMaterial({ color: "#4a3027", roughness: 0.92, bumpMap: bump, bumpScale: 2 }),
      dark: new THREE.MeshStandardMaterial({ color: "#241915", roughness: 0.95 }),
      metal: new THREE.MeshStandardMaterial({ color: "#5a5855", roughness: 0.42, metalness: 0.85, bumpMap: bump, bumpScale: 1.2 }),
      bone: new THREE.MeshStandardMaterial({ color: "#dccfb0", roughness: 0.6 }),
      cloth: new THREE.MeshStandardMaterial({ color: "#7a2a22", roughness: 0.9, bumpMap: bump, bumpScale: 1.5 }),
      eye: new THREE.MeshBasicMaterial({ color: "#ffb347", toneMapped: false }),
      rune: new THREE.MeshStandardMaterial({ color: "#2a1c15", emissive: new THREE.Color("#ff7a2a"), emissiveIntensity: 0.6 }),
    }),
    [bump, veins]
  );

  const root = useRef();
  const chest = useRef();
  const head = useRef();
  const jaw = useRef();
  const armL = useRef();
  const armR = useRef();
  const sita = useRef();
  const embers = useRef();
  const flames = useRef();
  const eyeLight = useRef();
  const ang = useRef({ l: -2.15, r: 0.35, hx: 0, lean: 0, mouth: 0.08, crouch: 1 });

  useFrame((state, delta) => {
    const g = gRef.current;
    const R = root.current;
    if (!R) return;
    const t = state.clock.elapsedTime;
    const act = g.bossAction;
    const anim = g.bossAnim;

    let lA = -2.15;
    let rA = 0.35 + Math.sin(t * 1.6) * 0.05;
    let hx = Math.sin(t * 1.6) * 0.03;
    let lean = 0;
    let mouth = 0.08;
    let crouch = 1;
    let rate = 8;

    switch (act) {
      case "prepare":
        if (anim === "charge") { rA = 1.1; hx = 0.25; lean = 0.1; crouch = 0.9; }
        else if (anim === "quake") { rA = 2.9; lA = -2.5; hx = -0.2; lean = -0.12; mouth = 0.2; }
        else { rA = 2.8; hx = -0.15; lean = -0.1; mouth = 0.14; }
        break;
      case "attack":
        if (anim === "charge") { rA = -1.4; hx = 0.35; lean = 0.2; crouch = 0.95; rate = 14; }
        else if (anim === "quake") { rA = -0.45; lA = -1.7; hx = 0.35; lean = 0.18; rate = 22; }
        else { rA = -0.5; hx = 0.3; lean = 0.18; rate = 22; }
        mouth = 0.3;
        break;
      case "roar":
        rA = 2.2; lA = -2.6; hx = -0.5; mouth = 0.4; lean = -0.1;
        break;
      case "stun":
        rA = 0.05; lA = -1.7; hx = 0.55; lean = 0.12;
        break;
      case "collapse":
        rA = 0.9; lA = -0.8; hx = 0.6; lean = -1.4; rate = 3;
        break;
      default:
        break;
    }

    const A = ang.current;
    A.l = damp(A.l, lA, rate, delta);
    A.r = damp(A.r, rA, rate, delta);
    A.hx = damp(A.hx, hx, 8, delta);
    A.lean = damp(A.lean, lean, act === "collapse" ? 3 : 8, delta);
    A.mouth = damp(A.mouth, mouth, 10, delta);
    A.crouch = damp(A.crouch, crouch, 8, delta);

    if (armL.current) armL.current.rotation.z = A.l;
    if (armR.current) armR.current.rotation.z = A.r;
    if (head.current) head.current.rotation.x = A.hx;
    if (jaw.current) jaw.current.scale.y = 0.5 + A.mouth * 5;

    const rateX = act === "attack" && anim === "charge" ? 7 : 4;
    g.bossX = damp(g.bossX, g.bossTargetX, rateX, delta);
    const hitF = Math.max(0, 1 - (g.time - g.bossHitAt) / 280);
    R.position.x = g.bossX + hitF * 0.14;

    /* death: he collapses, then his body dissolves into light as the spirit rises */
    const dis = g.victory ? clamp((g.time - g.endTime - 1700) / 1500, 0, 1) : 0;

    if (act === "collapse") {
      R.position.y = damp(R.position.y, -0.35, 3, delta);
      R.rotation.z = damp(R.rotation.z, -1.15, 3, delta);
    } else {
      R.position.y = Math.sin(t * 2.2) * 0.03 + (act === "roar" ? Math.sin(t * 40) * 0.02 : 0);
      R.rotation.z = A.lean * 0.5;
    }
    const s = [1.08, 1.14, 1.2][g.phase - 1] * (1 - dis * 0.999);
    R.scale.set(damp(R.scale.x, s, 4, delta), damp(R.scale.y, s * A.crouch, 6, delta), damp(R.scale.z, s, 4, delta));

    if (chest.current) chest.current.scale.y = 1 + Math.sin(t * 2.5) * 0.02;

    /* lava veins brighten with each phase and flare on every hit */
    const base = [0.12, 0.65, 1.3][g.phase - 1];
    const winGlow = g.victory ? 0.25 + dis * 2.5 : 0;
    mats.skin.emissiveIntensity = (g.victory ? winGlow : base) + hitF * 1.2;
    mats.skin.color.copy(SKIN_BASE).lerp(SKIN_HOT, hitF * 0.5);
    mats.eye.color.set(g.phase === 1 ? "#ffb347" : g.phase === 2 ? "#ff7a2e" : "#ff3b2e");
    const hot = act === "prepare" || act === "attack" || act === "roar" ? 1.6 : 0;
    mats.rune.emissiveIntensity = 0.5 + g.phase * 0.45 + hot;
    if (eyeLight.current) eyeLight.current.intensity = g.victory ? 0 : 0.5 + g.phase * 0.5 + hot * 0.4;

    if (sita.current) {
      sita.current.visible = !g.victory;
      sita.current.position.set(-0.62 + 1.15 * Math.sin(A.l), 2.55 - 1.15 * Math.cos(A.l) + 0.12, 0.2);
      sita.current.rotation.z = Math.sin(t * (act === "prepare" ? 9 : 3)) * (act === "prepare" ? 0.18 : 0.06);
    }
    if (embers.current) embers.current.visible = g.phase >= 2 && !g.ended;
    if (flames.current) flames.current.visible = g.phase === 3 && !g.ended;
  });

  const spikes = [
    [-0.55, 2.86, 0.05, 0.4],
    [-0.8, 2.75, 0.05, 0.9],
    [0.55, 2.86, 0.05, -0.4],
    [0.8, 2.75, 0.05, -0.9],
  ];

  return (
    <group ref={root} position={[BOSS_HOME, 0, 0]} rotation={[0, -0.22, 0]}>
      {/* contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[3.6, 3.6]} />
        <meshBasicMaterial map={blob} transparent depthWrite={false} />
      </mesh>

      {/* legs */}
      {[-0.32, 0.32].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.62, 0]} castShadow material={mats.deep}>
            <capsuleGeometry args={[0.24, 0.78, 6, 10]} />
          </mesh>
          <mesh position={[x, 0.45, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
            <torusGeometry args={[0.25, 0.04, 6, 16]} />
          </mesh>
          <mesh position={[x, 0.07, 0.12]} castShadow material={mats.dark}>
            <boxGeometry args={[0.46, 0.16, 0.6]} />
          </mesh>
          {[-0.14, 0, 0.14].map((o) => (
            <mesh key={o} position={[x + o, 0.08, 0.46]} rotation={[Math.PI / 2, 0, 0]} material={mats.bone}>
              <coneGeometry args={[0.04, 0.12, 5]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* loincloth + belt */}
      <mesh position={[0, 1.2, 0]} castShadow material={mats.cloth}>
        <cylinderGeometry args={[0.42, 0.55, 0.6, 14]} />
      </mesh>
      <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.metal}>
        <torusGeometry args={[0.52, 0.07, 8, 24]} />
      </mesh>
      <mesh position={[0, 1.5, 0.55]} material={mats.bone}>
        <sphereGeometry args={[0.1, 10, 10]} />
      </mesh>
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 1.5, 0.45]} material={mats.bone}>
          <sphereGeometry args={[0.055, 8, 8]} />
        </mesh>
      ))}

      {/* belly + chest */}
      <mesh position={[0, 1.78, 0.04]} scale={[1.05, 0.95, 0.95]} castShadow material={mats.skin}>
        <sphereGeometry args={[0.66, 24, 20]} />
      </mesh>
      <mesh ref={chest} position={[0, 2.35, 0]} castShadow material={mats.skin}>
        <capsuleGeometry args={[0.52, 0.5, 6, 14]} />
      </mesh>
      {[-0.27, 0.27].map((x) => (
        <mesh key={x} position={[x, 2.48, 0.38]} scale={[1, 0.78, 0.7]} castShadow material={mats.skin}>
          <sphereGeometry args={[0.3, 16, 14]} />
        </mesh>
      ))}
      <mesh position={[0, 2.62, 0.1]} rotation={[Math.PI / 2.2, 0, 0]} material={mats.bone}>
        <torusGeometry args={[0.44, 0.05, 8, 24]} />
      </mesh>
      {/* skull necklace */}
      {[-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map((a, i) => (
        <mesh
          key={a}
          position={[Math.sin(a) * 0.46, 2.58 - Math.abs(a) * 0.08, 0.34 + Math.cos(a) * 0.12]}
          scale={i === 3 ? 1.5 : 1}
          material={mats.bone}
        >
          <sphereGeometry args={[0.065, 8, 8]} />
        </mesh>
      ))}
      {/* dorsal spines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[(i - 2) * 0.16, 2.1 + i * 0.01 + (i % 2) * 0.35, -0.5]} rotation={[-0.7, 0, 0]} castShadow material={mats.bone}>
          <coneGeometry args={[0.07, 0.34, 5]} />
        </mesh>
      ))}

      {/* shoulders + spikes */}
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 2.72, 0]} castShadow material={mats.deep}>
          <sphereGeometry args={[0.36, 18, 14]} />
        </mesh>
      ))}
      {[-0.66, 0.66].map((x) => (
        <mesh key={x} position={[x, 2.84, 0]} rotation={[0, 0, 0]} castShadow material={mats.metal}>
          <sphereGeometry args={[0.4, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
        </mesh>
      ))}
      {spikes.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y + 0.2, z]} rotation={[0, 0, r]} castShadow material={mats.bone}>
          <coneGeometry args={[0.09, 0.42, 6]} />
        </mesh>
      ))}

      {/* left arm: holds Sita */}
      <group ref={armL} position={[-0.62, 2.55, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow material={mats.skin}>
          <capsuleGeometry args={[0.19, 0.5, 6, 10]} />
        </mesh>
        <mesh position={[0, -0.25, 0.04]} scale={[1.1, 1, 1]} castShadow material={mats.skin}>
          <sphereGeometry args={[0.22, 14, 12]} />
        </mesh>
        <mesh position={[0, -0.9, 0]} castShadow material={mats.deep}>
          <capsuleGeometry args={[0.16, 0.42, 6, 10]} />
        </mesh>
        <mesh position={[0, -0.82, 0]} material={mats.metal}>
          <cylinderGeometry args={[0.19, 0.19, 0.22, 12]} />
        </mesh>
        <mesh position={[0, -1.18, 0]} castShadow material={mats.deep}>
          <sphereGeometry args={[0.2, 12, 12]} />
        </mesh>
      </group>
      <group ref={sita}>
        <SitaModel scale={0.55} />
      </group>

      {/* right arm: war club */}
      <group ref={armR} position={[0.62, 2.55, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow material={mats.skin}>
          <capsuleGeometry args={[0.2, 0.5, 6, 10]} />
        </mesh>
        <mesh position={[0, -0.25, 0.04]} scale={[1.1, 1, 1]} castShadow material={mats.skin}>
          <sphereGeometry args={[0.23, 14, 12]} />
        </mesh>
        <mesh position={[0, -0.9, 0]} castShadow material={mats.deep}>
          <capsuleGeometry args={[0.17, 0.42, 6, 10]} />
        </mesh>
        <mesh position={[0, -0.82, 0]} material={mats.metal}>
          <cylinderGeometry args={[0.2, 0.2, 0.22, 12]} />
        </mesh>
        <mesh position={[0, -1.18, 0]} castShadow material={mats.deep}>
          <sphereGeometry args={[0.22, 12, 12]} />
        </mesh>
        <mesh position={[0, -1.95, 0]} castShadow material={mats.dark}>
          <cylinderGeometry args={[0.09, 0.28, 1.6, 10]} />
        </mesh>
        {[-1.55, -1.95, -2.3].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.rune}>
            <torusGeometry args={[0.15 + (-y - 1.5) * 0.08, 0.03, 6, 18]} />
          </mesh>
        ))}
        <mesh position={[0, -2.55, 0]} castShadow material={mats.metal}>
          <sphereGeometry args={[0.32, 14, 14]} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.3, -2.5 + (i % 2 ? 0.1 : -0.1), Math.sin(a) * 0.3]}
              rotation={[Math.sin(a) * 1.4, 0, -Math.cos(a) * 1.4]}
              castShadow
              material={mats.metal}
            >
              <coneGeometry args={[0.06, 0.28, 5]} />
            </mesh>
          );
        })}
      </group>

      {/* head */}
      <group ref={head} position={[0, 3.18, 0]}>
        <mesh castShadow material={mats.skin}>
          <sphereGeometry args={[0.38, 22, 20]} />
        </mesh>
        <mesh position={[0, 0.2, -0.04]} material={mats.dark}>
          <sphereGeometry args={[0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
        <mesh position={[0, 0.06, 0.3]} material={mats.dark}>
          <boxGeometry args={[0.62, 0.1, 0.16]} />
        </mesh>
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} position={[x, 0.02, 0.33]} material={mats.eye}>
            <sphereGeometry args={[0.055, 10, 10]} />
          </mesh>
        ))}
        <pointLight ref={eyeLight} position={[0, 0.05, 0.7]} color="#ff8a3a" distance={4.5} intensity={1} />
        <mesh ref={jaw} position={[0, -0.18, 0.28]} material={mats.dark}>
          <boxGeometry args={[0.38, 0.12, 0.14]} />
        </mesh>
        {[-0.13, 0.13].map((x) => (
          <mesh key={x} position={[x, -0.1, 0.34]} rotation={[0, 0, Math.PI]} material={mats.bone}>
            <coneGeometry args={[0.04, 0.2, 6]} />
          </mesh>
        ))}
        {[-0.17, 0.17].map((x, i) => (
          <mesh key={x} position={[x, -0.2, 0.34]} rotation={[-0.25, 0, i ? -0.2 : 0.2]} material={mats.bone}>
            <coneGeometry args={[0.05, 0.3, 6]} />
          </mesh>
        ))}
        {[-0.28, 0.28].map((x, i) => (
          <group key={x} position={[x, 0.38, 0]} rotation={[0, 0, i ? -0.5 : 0.5]}>
            <mesh castShadow material={mats.bone}>
              <coneGeometry args={[0.08, 0.42, 6]} />
            </mesh>
            <mesh position={[i ? 0.06 : -0.06, 0.3, 0]} rotation={[0, 0, i ? -0.5 : 0.5]} castShadow material={mats.bone}>
              <coneGeometry args={[0.05, 0.3, 6]} />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={embers} visible={false} position={[0, 1.8, 0]}>
        <Sparkles count={28} scale={[2.2, 4, 1.6]} size={5} speed={0.9} opacity={0.8} color="#ffa24a" />
      </group>
      <group ref={flames} visible={false} position={[0, 1.8, 0]}>
        <Sparkles count={40} scale={[2.4, 4, 1.8]} size={7} speed={1.6} opacity={0.85} color="#ff5a2a" />
      </group>
    </group>
  );
}

function FreeSita({ gRef }) {
  const ref = useRef();
  const sp = useRef();
  useFrame((state, delta) => {
    const g = gRef.current;
    if (!ref.current) return;
    const on = g.victory && g.time - g.endTime > 900;
    ref.current.visible = on;
    if (sp.current) sp.current.visible = on;
    const s = on ? 1 : 0.01;
    ref.current.scale.setScalar(damp(ref.current.scale.x, s, 4, delta));
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.03;
  });
  return (
    <group ref={ref} position={[0.8, 0, 1.2]} scale={0.01} visible={false}>
      <SitaModel scale={1.15} />
      <group ref={sp} visible={false}>
        <Sparkles count={36} scale={[2.4, 3.2, 2.4]} size={5} speed={0.6} opacity={0.9} color="#ffe2a0" />
      </group>
    </group>
  );
}

/* Viradha was cursed into this form: when he falls, a radiant spirit ascends */
function Spirit({ gRef }) {
  const grp = useRef();
  const core = useRef();
  const ringA = useRef();
  const ringB = useRef();
  const beam = useRef();
  const tex = useMemo(
    () =>
      radialTexture("halo", [
        [0, "rgba(255,226,150,0.95)"],
        [0.5, "rgba(255,200,110,0.35)"],
        [1, "rgba(255,190,90,0)"],
      ]),
    []
  );
  useFrame((state) => {
    const g = gRef.current;
    if (!grp.current) return;
    const t = (g.time - g.endTime - 1500) / 1000;
    const on = g.victory && t >= 0 && t < 6;
    grp.current.visible = on;
    if (!on) return;
    const k = clamp(t / 4.5, 0, 1);
    const a = Math.sin(clamp(t / 1.2, 0, 1) * Math.PI * 0.5) * (1 - clamp((t - 3.6) / 2.2, 0, 1));
    grp.current.position.set(g.bossX, 1.3 + k * 6, 0.4);
    const et = state.clock.elapsedTime;
    core.current.material.opacity = 0.95 * a;
    core.current.scale.setScalar(2.2 + Math.sin(et * 5) * 0.15);
    ringA.current.material.opacity = 0.7 * a;
    ringA.current.rotation.z = et * 0.9;
    ringB.current.material.opacity = 0.5 * a;
    ringB.current.rotation.z = -et * 0.6;
    beam.current.material.opacity = 0.22 * a;
  });
  const addMat = (o) => (
    <meshBasicMaterial
      color="#ffe6a8"
      transparent
      opacity={o}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
      toneMapped={false}
      side={THREE.DoubleSide}
    />
  );
  return (
    <group ref={grp} visible={false}>
      <mesh ref={core}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ringA}>
        <ringGeometry args={[0.8, 0.84, 56]} />
        {addMat(0)}
      </mesh>
      <mesh ref={ringB}>
        <ringGeometry args={[1.15, 1.17, 56]} />
        {addMat(0)}
      </mesh>
      <mesh ref={beam} position={[0, -4, 0]}>
        <cylinderGeometry args={[0.5, 0.9, 12, 20, 1, true]} />
        {addMat(0)}
      </mesh>
      <Sparkles count={50} scale={[2.4, 6, 2.4]} size={6} speed={0.9} opacity={0.95} color="#ffe2a0" />
    </group>
  );
}

/* ========================================================================
   COMBAT FX
   ===================================================================== */

const RED = new THREE.Color("#ff4a2a");
const AMBER = new THREE.Color("#f2b04a");

function ZoneView({ zone, gRef }) {
  const grp = useRef();
  const fill = useRef();
  const ring = useRef();
  const base = useRef();
  const sweep = useRef();
  const inner = useRef();
  const shaft = useRef();
  const boulder = useRef();
  const ticks = useRef();
  const col = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const g = gRef.current;
    if (!grp.current) return;
    const dur = Math.max(1, zone.land - zone.start);
    const pr = clamp((g.time - zone.start) / dur, 0, 1);
    grp.current.visible = g.time >= zone.start;
    const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * (8 + pr * 16));
    col.copy(AMBER).lerp(RED, pr);

    if (zone.kind === "circle") {
      fill.current.scale.setScalar(Math.max(0.001, pr));
      fill.current.material.color.copy(col);
      fill.current.material.opacity = 0.22 + 0.4 * pr;
      ring.current.material.color.copy(col);
      ring.current.material.opacity = 0.65 + 0.35 * pulse;
      base.current.material.opacity = 0.1 + 0.12 * pr;
      if (ticks.current) ticks.current.rotation.z = pr * 3.2;
      if (shaft.current) {
        shaft.current.material.color.copy(col);
        shaft.current.material.opacity = 0.05 + 0.2 * pr * (0.6 + 0.4 * pulse);
      }
      if (boulder.current) {
        boulder.current.visible = pr < 1;
        boulder.current.position.y = lerp(9, 0.55, pr * pr);
        boulder.current.rotation.x = pr * 5;
        boulder.current.rotation.z = pr * 3;
      }
    } else if (zone.kind === "lane") {
      base.current.material.color.copy(col);
      base.current.material.opacity = 0.1 + 0.3 * pr;
      sweep.current.position.x = lerp(6, -6, pr * pr);
      sweep.current.material.opacity = 0.35 + 0.4 * pulse;
      ring.current.material.color.copy(col);
      ring.current.material.opacity = 0.5 + 0.4 * pulse;
    } else {
      base.current.material.opacity = 0.1 + 0.28 * pr;
      ring.current.material.opacity = 0.7 + 0.3 * pulse;
      inner.current.scale.setScalar(lerp(1.7, 1, pr));
      inner.current.material.opacity = 0.35 * (1 - pr) + 0.2;
      fill.current.material.opacity = 0.2 + 0.18 * pulse;
      if (shaft.current) shaft.current.material.opacity = 0.12 + 0.16 * pulse;
    }
  });

  const mat = (c, o) => (
    <meshBasicMaterial color={c} transparent opacity={o} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
  );
  const addMat = (c, o) => (
    <meshBasicMaterial
      color={c}
      transparent
      opacity={o}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
      toneMapped={false}
      side={THREE.DoubleSide}
    />
  );

  if (zone.kind === "circle") {
    return (
      <group ref={grp} position={[zone.x, 0, 0]}>
        <group position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh ref={base}>
            <circleGeometry args={[zone.r, 56]} />
            {mat("#ff4a2a", 0.12)}
          </mesh>
          <mesh ref={fill} position={[0, 0, 0.002]}>
            <circleGeometry args={[zone.r, 56]} />
            {mat("#f2b04a", 0.25)}
          </mesh>
          <mesh ref={ring} position={[0, 0, 0.004]}>
            <ringGeometry args={[zone.r - 0.07, zone.r, 64]} />
            {mat("#f2b04a", 0.8)}
          </mesh>
          <group ref={ticks}>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * zone.r * 1.14, Math.sin(a) * zone.r * 1.14, 0.005]} rotation={[0, 0, a]}>
                  <planeGeometry args={[0.28, 0.06]} />
                  {mat("#ffd9a0", 0.7)}
                </mesh>
              );
            })}
          </group>
        </group>
        <mesh ref={shaft} position={[0, 3, 0]}>
          <cylinderGeometry args={[zone.r * 0.85, zone.r * 0.85, 6, 24, 1, true]} />
          {addMat("#f2b04a", 0.05)}
        </mesh>
        {zone.rock && (
          <group ref={boulder} position={[0, 9, 0]}>
            <mesh castShadow>
              <dodecahedronGeometry args={[0.72, 0]} />
              <meshStandardMaterial color="#6a5a45" roughness={1} flatShading emissive="#ff4a1c" emissiveIntensity={0.5} />
            </mesh>
            <mesh>
              <sphereGeometry args={[1.0, 12, 12]} />
              {addMat("#ff7a3a", 0.22)}
            </mesh>
          </group>
        )}
      </group>
    );
  }

  if (zone.kind === "lane") {
    return (
      <group ref={grp} position={[zone.x, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={base}>
          <planeGeometry args={[13, 2.2]} />
          {mat("#f2b04a", 0.12)}
        </mesh>
        <mesh ref={sweep} position={[6, 0, 0.003]}>
          <planeGeometry args={[0.6, 2.2]} />
          {mat("#ffd9a0", 0.4)}
        </mesh>
        <mesh ref={ring} position={[0, 1.1, 0.004]}>
          <planeGeometry args={[13, 0.07]} />
          {mat("#f2b04a", 0.6)}
        </mesh>
        <mesh position={[0, -1.1, 0.004]}>
          <planeGeometry args={[13, 0.07]} />
          {mat("#f2b04a", 0.6)}
        </mesh>
      </group>
    );
  }

  return (
    <group ref={grp} position={[0, 0.04, 0]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={base}>
          <planeGeometry args={[14, 5.6]} />
          {mat("#ff3a22", 0.1)}
        </mesh>
        <group position={[zone.x, 0, 0.004]}>
          <mesh ref={fill}>
            <circleGeometry args={[zone.r, 48]} />
            {mat("#ffe39a", 0.25)}
          </mesh>
          <mesh ref={ring}>
            <ringGeometry args={[zone.r - 0.08, zone.r, 64]} />
            {mat("#ffe9b0", 0.9)}
          </mesh>
          <mesh ref={inner}>
            <ringGeometry args={[zone.r - 0.03, zone.r, 64]} />
            {mat("#ffe9b0", 0.4)}
          </mesh>
        </group>
      </group>
      <mesh ref={shaft} position={[zone.x, 2.5, 0]}>
        <cylinderGeometry args={[zone.r * 0.9, zone.r * 0.9, 5, 24, 1, true]} />
        {addMat("#ffe39a", 0.15)}
      </mesh>
    </group>
  );
}

function BurstFX({ fx }) {
  const age = useRef(0);
  const ring = useRef();
  const debris = useRef([]);
  const big = fx.kind === "divine";
  const color = fx.kind === "rock" ? "#e0a25a" : fx.kind === "dodge" ? "#bfe9ff" : "#ffe6a8";
  const parts = useMemo(
    () =>
      Array.from({ length: fx.kind === "rock" ? 10 : 6 }, () => ({
        vx: random(-1.8, 1.8),
        vy: random(2.2, 4.6),
        vz: random(-0.9, 0.9),
        s: random(0.07, 0.2),
        r: random(0, 3),
      })),
    [fx.kind]
  );

  useFrame((_, delta) => {
    age.current += delta;
    const a = age.current;
    if (ring.current) {
      const k = (big ? 7 : 2.4) * (1 - Math.exp(-a * 5));
      ring.current.scale.setScalar(0.3 + k);
      ring.current.material.opacity = Math.max(0, 0.85 - a * 1.1);
    }
    debris.current.forEach((m, i) => {
      if (!m) return;
      const p = parts[i];
      m.position.set(p.vx * a, Math.max(0, p.vy * a - 6 * a * a), p.vz * a);
      m.rotation.set(p.r * a * 3, p.r * a * 2, 0);
      m.visible = a < 0.9;
    });
  });

  return (
    <group position={[fx.x, fx.y, 0.1]}>
      {fx.kind !== "dodge" && fx.y < 0.5 && (
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.95, 40]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )}
      {fx.kind === "rock" &&
        parts.map((p, i) => (
          <mesh key={i} ref={(el) => (debris.current[i] = el)} scale={p.s} castShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#7a6b4c" roughness={1} flatShading />
          </mesh>
        ))}
      <Sparkles
        count={fx.kind === "rock" ? 14 : big ? 40 : 18}
        scale={big ? 4 : 1.8}
        size={big ? 6 : 4}
        speed={1.2}
        color={color}
        opacity={0.95}
      />
    </group>
  );
}

function DivineEffect({ gRef }) {
  const beam = useRef();
  const r1 = useRef();
  const r2 = useRef();
  const r3 = useRef();
  const glow = useRef();
  const tex = useMemo(
    () =>
      radialTexture("halo", [
        [0, "rgba(255,226,150,0.95)"],
        [0.5, "rgba(255,200,110,0.35)"],
        [1, "rgba(255,190,90,0)"],
      ]),
    []
  );
  useFrame(() => {
    const g = gRef.current;
    const t = (g.time - g.divineAt) / 1000;
    const on = t >= 0 && t < 1.9;
    [beam, r1, r2, r3, glow].forEach((r) => {
      if (r.current) r.current.visible = on;
    });
    if (!on) return;
    const bt = clamp((t - 0.5) / 0.9, 0, 1);
    beam.current.position.set(g.bossX, 6, 0.2);
    const w = 1.2 - bt * 0.9;
    beam.current.scale.set(w, 1, w);
    beam.current.material.opacity = t < 0.5 ? 0 : (1 - bt) * 0.75;
    const rt = Math.max(0, t - 0.5);
    r1.current.position.set(g.bossX, 0.08, 0.1);
    r1.current.scale.setScalar(0.3 + rt * 9);
    r1.current.material.opacity = Math.max(0, 0.8 - rt * 0.8);
    r2.current.position.set(g.bossX, 0.1, 0.1);
    r2.current.scale.setScalar(0.2 + rt * 5.5);
    r2.current.material.opacity = Math.max(0, 0.9 - rt * 1.1);
    r3.current.position.set(g.bossX, 2.2, 0.6);
    r3.current.scale.setScalar(0.4 + rt * 6);
    r3.current.rotation.z = rt * 2;
    r3.current.material.opacity = t < 0.5 ? 0 : Math.max(0, 0.85 - rt * 0.95);
    glow.current.position.set(g.x, 2, 0.4);
    const gs = t < 0.5 ? 1 + t * 8 : 5 - (t - 0.5) * 3.5;
    glow.current.scale.setScalar(Math.max(0.01, gs));
    glow.current.material.opacity = Math.max(0, 0.85 - t * 0.45);
  });
  const addMat = (o) => (
    <meshBasicMaterial
      color="#ffe6a8"
      transparent
      opacity={o}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
      toneMapped={false}
      side={THREE.DoubleSide}
    />
  );
  return (
    <>
      <mesh ref={beam} visible={false}>
        <cylinderGeometry args={[1, 1, 12, 28, 1, true]} />
        {addMat(0)}
      </mesh>
      <mesh ref={r1} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.9, 1, 56]} />
        {addMat(0.8)}
      </mesh>
      <mesh ref={r2} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.75, 1, 56]} />
        {addMat(0.9)}
      </mesh>
      <mesh ref={r3} visible={false}>
        <ringGeometry args={[0.92, 1, 6]} />
        {addMat(0)}
      </mesh>
      <mesh ref={glow} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}

function ArrowProjectile({ gRef, who = "rama" }) {
  const grp = useRef();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const g = gRef.current;
    if (!grp.current) return;
    const p = arrowPoint(g, who, tmp);
    const on = p >= 0;
    grp.current.visible = on;
    if (!on) return;
    const lak = who === "lak";
    const [fx, fy] = lak ? [-4.25, 1.5] : g.arrowFrom;
    const tx = g.bossX - 0.5;
    const ty = 2.4;
    grp.current.position.copy(tmp);
    const dy = ty - fy + Math.cos(p * Math.PI) * 0.35 * Math.PI;
    grp.current.rotation.z = Math.atan2(dy, tx - fx);
  });
  return (
    <group ref={grp} visible={false}>
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 0.9, 6]} />
        <meshStandardMaterial color="#f7dd98" emissive="#c4801f" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.055, 0.16, 8]} />
        <meshStandardMaterial color="#fff0b8" emissive="#e8a63a" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[-0.5 - i * 0.3, 0, 0]}>
          <sphereGeometry args={[0.09 - i * 0.013, 8, 8]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={0.6 - i * 0.09} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function PlayerMarker({ gRef }) {
  const ring = useRef();
  const dot = useRef();
  useFrame((state, delta) => {
    const g = gRef.current;
    if (!ring.current) return;
    const show = g.screen === "battle" || g.screen === "ending";
    ring.current.visible = show;
    dot.current.visible = show;
    ring.current.position.x = damp(ring.current.position.x, g.x, 14, delta);
    dot.current.position.x = ring.current.position.x;
    const inv = g.time < g.evadeUntil;
    ring.current.material.color.set(inv ? "#bfe9ff" : "#ffe39a");
    ring.current.material.opacity = 0.55 + 0.25 * Math.sin(state.clock.elapsedTime * 4);
    const s = inv ? 1.25 : 1;
    ring.current.scale.setScalar(damp(ring.current.scale.x, s, 10, delta));
  });
  return (
    <>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.05, 0]}>
        <ringGeometry args={[0.42, 0.5, 40]} />
        <meshBasicMaterial color="#ffe39a" transparent opacity={0.6} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={dot} rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.05, 0]}>
        <circleGeometry args={[0.12, 20]} />
        <meshBasicMaterial color="#ffe39a" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}

function BattleScene({ gRef, zones, effects, floaters, intro }) {
  return (
    <>
      <CameraRig gRef={gRef} />
      <Lights gRef={gRef} />
      <Forest />
      <Ruins gRef={gRef} />
      <ArenaGlow gRef={gRef} />
      <Scars gRef={gRef} />
      <Rays />
      <Mist />
      <Leaves />

      <Archer gRef={gRef} role="rama" />
      <Archer gRef={gRef} role="lakshmana" />
      <Viradha gRef={gRef} />
      <FreeSita gRef={gRef} />
      <Spirit gRef={gRef} />
      <PlayerMarker gRef={gRef} />

      {zones.map((z) => (
        <ZoneView key={z.id} zone={z} gRef={gRef} />
      ))}

      <ArrowProjectile gRef={gRef} who="rama" />
      <ArrowProjectile gRef={gRef} who="lak" />
      {effects.map((fx) => (
        <BurstFX key={fx.id} fx={fx} />
      ))}
      <DivineEffect gRef={gRef} />

      {floaters.map((f) => (
        <Html key={f.id} position={[f.x, f.y, 0.6]} center zIndexRange={[3, 0]} style={{ pointerEvents: "none" }}>
          <div className={`vr-floater vr-floater--${f.kind}`}>{f.text}</div>
        </Html>
      ))}

      {intro && (
        <Html center position={[0, 4.6, 0]} distanceFactor={12} zIndexRange={[3, 0]}>
          <div className="vr-scene-caption">THE FOREST OF DANDAKA</div>
        </Html>
      )}
    </>
  );
}

/* ========================================================================
   HUD COMPONENTS
   ===================================================================== */

function HealthBar({ label, value, max, type, icon: Icon, marks }) {
  const percent = clamp((value / max) * 100, 0, 100);
  return (
    <div className={`vr-health vr-health--${type}`}>
      <div className="vr-health__heading">
        <span className="vr-health__label">
          {Icon && <Icon size={13} />}
          {label}
        </span>
        <span className="vr-health__number">
          {Math.ceil(value)} <small>/ {max}</small>
        </span>
      </div>
      <div className="vr-health__track">
        <motion.div
          className="vr-health__trail"
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <motion.div className="vr-health__fill" animate={{ width: `${percent}%` }} transition={{ duration: 0.25 }} />
        {marks && marks.map((m) => <span key={m} className="vr-health__mark" style={{ left: `${m}%` }} />)}
      </div>
    </div>
  );
}

function Meter({ label, value, kind, icon: Icon, ready }) {
  return (
    <div className={`vr-meter vr-meter--${kind} ${ready ? "is-ready" : ""}`}>
      <div className="vr-meter__head">
        <span>
          {Icon && <Icon size={11} />}
          {label}
        </span>
        <b>{ready ? "READY" : Math.round(value)}</b>
      </div>
      <div className="vr-meter__track">
        <i style={{ width: `${clamp(value, 0, 100)}%` }} />
      </div>
    </div>
  );
}

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ========================================================================
   MAIN COMPONENT
   ===================================================================== */

export default function ViradhaRescueGame({ onClose }) {
  const G = useRef(null);
  if (!G.current) G.current = makeG();
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = createAudio();

  const [screen, setScreen] = useState("intro");
  const [hud, setHud] = useState({
    hp: PLAYER_MAX,
    boss: BOSS_MAX,
    stam: 100,
    div: 0,
    combo: 0,
    phase: 1,
    strikeCd: 0,
    secs: 0,
  });
  const [zones, setZones] = useState([]);
  const [effects, setEffects] = useState([]);
  const [floaters, setFloaters] = useState([]);
  const [message, setMessage] = useState("A threat emerges from the forest.");
  const [warning, setWarning] = useState(null);
  const [dialogue, setDialogue] = useState(null);
  const [banner, setBanner] = useState(null);
  const [flash, setFlash] = useState("");
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState(null);
  const [muted, setMuted] = useState(false);

  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = buildEngine(G, audioRef.current, {
      setScreen,
      setHud,
      setZones,
      setEffects,
      setFloaters,
      setMessage,
      setWarning,
      setDialogue,
      setBanner,
      setFlash,
      setPaused,
      setResult,
    });
  }
  const E = engineRef.current;

  /* game loop */
  useEffect(() => {
    let raf;
    let last = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      E.tick(dt);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [E]);

  useEffect(() => () => E.destroy(), [E]);

  useEffect(() => {
    audioRef.current.setMuted(muted);
  }, [muted]);

  /* keyboard */
  useEffect(() => {
    const down = (event) => {
      const key = event.key.toLowerCase();
      const gs = G.current.screen;

      if (gs === "battle") {
        if (["arrowleft", "arrowright", " ", "shift"].includes(key)) event.preventDefault();
        if (key === "a" || key === "arrowleft") E.hold("l", true);
        if (key === "d" || key === "arrowright") E.hold("r", true);
        if (event.repeat) return;
        if (key === " " || key === "j") E.strike();
        if (key === "shift" || key === "k") E.dodge();
        if (key === "e" || key === "u") E.divine();
        if (key === "p" || key === "escape") E.togglePause();
      } else if (key === "enter" && (gs === "intro" || gs === "victory" || gs === "defeat")) {
        if (!event.target || event.target.tagName !== "BUTTON") E.start();
      }
    };
    const up = (event) => {
      const key = event.key.toLowerCase();
      if (key === "a" || key === "arrowleft") E.hold("l", false);
      if (key === "d" || key === "arrowright") E.hold("r", false);
    };
    const blur = () => {
      E.hold("l", false);
      E.hold("r", false);
      E.togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [E]);

  const closeGame = useCallback(() => {
    E.destroy();
    onClose?.();
  }, [E, onClose]);

  const live = screen === "battle" && !paused;
  const lowHp = hud.hp <= 30 && (screen === "battle" || screen === "ending");
  const cinema = screen === "intro" || screen === "ending" || Boolean(banner);
  const evadeLow = hud.stam < EVADE_COST;
  const divineReady = hud.div >= 100;
  const perfectPct = warning ? clamp((PERFECT_WINDOW / Math.max(1, warning.ms)) * 100, 8, 60) : 0;

  const moveProps = (dir) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      E.hold(dir, true);
    },
    onPointerUp: () => E.hold(dir, false),
    onPointerLeave: () => E.hold(dir, false),
    onPointerCancel: () => E.hold(dir, false),
  });

  return (
    <motion.div
      className={`vr-game ${flash ? `vr-game--${flash}` : ""} ${paused ? "vr-game--paused" : ""} ${
        cinema ? "vr-game--cinema" : ""
      } vr-game--${screen} vr-game--p${hud.phase}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* ------------------------------ TOP BAR ------------------------------ */}
      <div className="vr-topbar">
        <div className="vr-brand">
          <div className="vr-brand__mark">
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="vr-brand__name">ANCESTRA</div>
            <div className="vr-brand__sub">A RAMAYANA INTERACTION</div>
          </div>
        </div>

        <div className="vr-topbar__chapter">
          <span>ARANYA KANDA</span>
          <i />
          <span>THE RESCUE OF SITA</span>
        </div>

        <div className="vr-topbar__actions">
          {screen === "battle" && (
            <button className="vr-icon-button" onClick={() => E.togglePause()} aria-label={paused ? "Resume" : "Pause"}>
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
          <button
            className="vr-icon-button"
            onClick={() => setMuted((v) => !v)}
            aria-label={muted ? "Turn sound on" : "Mute sound"}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        </div>
      </div>

      {/* ------------------------------- ARENA ------------------------------- */}
      <div className="vr-arena">
        <Canvas
          shadows="soft"
          camera={{ position: [0, 4.4, 12.5], fov: 42, near: 0.1, far: 220 }}
          dpr={[1, 1.7]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
          }}
        >
          <Suspense fallback={null}>
            <BattleScene gRef={G} zones={zones} effects={effects} floaters={floaters} intro={screen === "intro"} />
          </Suspense>
        </Canvas>

        <div className="vr-arena__vignette" />
        <div className="vr-grade" />
        <div className="vr-arena__topline" />
        <div className={`vr-lowhp ${lowHp ? "is-on" : ""}`} />
        <div className="vr-speed" />
        <div className="vr-grain" />
        <div className="vr-letterbox vr-letterbox--top" />
        <div className="vr-letterbox vr-letterbox--bottom" />

        {/* HUD */}
        <div className="vr-hud">
          <div className="vr-hud__player">
            <div className="vr-portrait vr-portrait--rama">
              <Crown size={20} />
            </div>
            <div className="vr-hud__info">
              <div className="vr-hud__eyebrow">THE PRINCE OF AYODHYA</div>
              <div className="vr-hud__name">RAMA</div>
              <HealthBar label="VITALITY" value={hud.hp} max={PLAYER_MAX} type="player" icon={Heart} />
              <div className="vr-hud__meters">
                <Meter label="STAMINA" value={hud.stam} kind="stamina" icon={Shield} />
                <Meter label="DIVINE FORCE" value={hud.div} kind="divine" icon={Zap} ready={divineReady} />
              </div>
              <AnimatePresence>
                {hud.combo >= 2 && (
                  <motion.div
                    key={hud.combo}
                    className="vr-combo"
                    initial={{ opacity: 0, x: -10, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Flame size={13} />
                    <strong>{hud.combo}</strong>
                    <span>HIT COMBO</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="vr-hud__center">
            <div className="vr-hud__versus">VS</div>
            <div className="vr-hud__phase">
              {hud.phase === 1 ? "THE ENCOUNTER" : hud.phase === 2 ? "PHASE II · FURY" : "PHASE III · UNBOUND"}
            </div>
            <div className="vr-hud__timer">{fmtTime(hud.secs)}</div>
          </div>

          <div className="vr-hud__boss">
            <div className="vr-hud__info vr-hud__info--right">
              <div className="vr-hud__eyebrow">THE DEMON OF DANDAKA</div>
              <div className="vr-hud__name">VIRADHA</div>
              <HealthBar label="ENDURANCE" value={hud.boss} max={BOSS_MAX} type="boss" icon={Shield} marks={[33, 66]} />
              <div className="vr-pips">
                {[1, 2, 3].map((n) => (
                  <i key={n} className={hud.phase >= n ? "is-on" : ""} />
                ))}
              </div>
            </div>
            <div className="vr-portrait vr-portrait--boss">
              <Swords size={20} />
            </div>
          </div>
        </div>

        {/* Attack warning */}
        <AnimatePresence>
          {warning && screen === "battle" && (
            <motion.div
              key={warning.id}
              className="vr-warning"
              initial={{ opacity: 0, y: -12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="vr-warning__row">
                <span className="vr-warning__line" />
                <span>INCOMING ATTACK</span>
                <strong>{warning.name}</strong>
                <span className="vr-warning__line" />
              </div>
              <div className="vr-warning__hint">{warning.hint}</div>
              <div className="vr-warning__track">
                <i style={{ animationDuration: `${warning.ms}ms` }} />
                <span className="vr-warning__perfect" style={{ width: `${perfectPct}%` }} />
              </div>
              <div className="vr-warning__legend">
                <span>EVADE IN THE GOLD ZONE FOR A PERFECT EVADE</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase banner */}
        <AnimatePresence>
          {banner && (
            <motion.div
              key={banner.id}
              className="vr-banner"
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="vr-banner__kicker">{banner.title}</div>
              <div className="vr-banner__title">{banner.sub}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialogue */}
        <AnimatePresence mode="wait">
          {dialogue && screen !== "intro" && (
            <motion.div
              key={dialogue.id}
              className="vr-dialogue"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              <span className="vr-dialogue__who">{dialogue.speaker}</span>
              <p>{dialogue.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message */}
        <div className="vr-message" aria-live="polite">
          <span className="vr-message__ornament">✦</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={message}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
            >
              {message}
            </motion.span>
          </AnimatePresence>
          <span className="vr-message__ornament">✦</span>
        </div>

        {/* Intro */}
        <AnimatePresence>
          {screen === "intro" && (
            <motion.div
              className="vr-overlay vr-overlay--intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="vr-intro-card"
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <div className="vr-kicker">
                  <span />
                  ARANYA KANDA · CHAPTER VII
                  <span />
                </div>
                <div className="vr-intro-card__symbol">✦</div>
                <h1>VIRADHA</h1>
                <p className="vr-intro-card__subtitle">THE RESCUE OF SITA</p>
                <div className="vr-intro-card__divider" />
                <p className="vr-intro-card__story">
                  Deep within the forest of Dandaka, the rakshasa Viradha has seized Sita. Rama and Lakshmana must
                  stand against him. Read the ground, evade at the last moment, and call upon the divine force.
                </p>

                <div className="vr-keys">
                  <div><span className="vr-keys__caps"><kbd>A</kbd><kbd>D</kbd></span><span>MOVE</span></div>
                  <div><span className="vr-keys__caps"><kbd>SPACE</kbd></span><span>STRIKE</span></div>
                  <div><span className="vr-keys__caps"><kbd>SHIFT</kbd></span><span>EVADE</span></div>
                  <div><span className="vr-keys__caps"><kbd>E</kbd></span><span>DIVINE</span></div>
                </div>

                <button
                  className="vr-primary-button"
                  onClick={() => {
                    audioRef.current.play("click");
                    E.start();
                  }}
                >
                  <span>ENTER THE ENCOUNTER</span>
                  <ArrowRight size={17} />
                </button>
                <div className="vr-intro-card__foot">THE FOREST IS WATCHING</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause */}
        <AnimatePresence>
          {paused && screen === "battle" && (
            <motion.div className="vr-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="vr-result-card vr-pause-card">
                <div className="vr-kicker">
                  <span />
                  THE FOREST HOLDS ITS BREATH
                  <span />
                </div>
                <h2>PAUSED</h2>
                <div className="vr-result-card__actions">
                  <button className="vr-primary-button" onClick={() => E.togglePause(false)}>
                    <Play size={16} />
                    <span>RESUME</span>
                  </button>
                  <button className="vr-secondary-button" onClick={closeGame}>
                    RETURN TO THE STORY
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {(screen === "victory" || screen === "defeat") && result && (
            <motion.div className="vr-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className={`vr-result-card ${screen === "victory" ? "vr-result-card--victory" : "vr-result-card--defeat"}`}
                initial={{ y: 22, scale: 0.96, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
              >
                <div className="vr-kicker">
                  <span />
                  {screen === "victory" ? "THE ENCOUNTER ENDS" : "THE FOREST FALLS SILENT"}
                  <span />
                </div>

                {screen === "victory" ? (
                  <div className={`vr-rank vr-rank--${result.rank}`}>
                    <small>RANK</small>
                    <b>{result.rank}</b>
                  </div>
                ) : (
                  <div className="vr-result-card__symbol">◇</div>
                )}

                <h2>{screen === "victory" ? "SITA IS FREE" : "TRY AGAIN"}</h2>
                <p>
                  {screen === "victory"
                    ? "Viradha has been overcome. Freed from an ancient curse, his spirit ascends, and Rama and Lakshmana may continue through Dandaka."
                    : "The encounter was not won this time. Regather your strength and face Viradha again."}
                </p>

                <div className="vr-stats">
                  <div><strong>{fmtTime(result.secs)}</strong><span>TIME</span></div>
                  <div><strong>{result.combo}</strong><span>BEST COMBO</span></div>
                  <div><strong>{result.perfect}</strong><span>PERFECT EVADES</span></div>
                  <div><strong>{result.strikes}</strong><span>ARROWS RELEASED</span></div>
                  <div><strong>{result.dodges}</strong><span>EVASIONS</span></div>
                  <div><strong>{result.divine}</strong><span>DIVINE FORCES</span></div>
                </div>

                {screen === "victory" && result.best != null && (
                  <div className="vr-best">
                    {result.newBest ? "NEW PERSONAL BEST · " : "PERSONAL BEST · "}
                    {fmtTime(result.best)}
                  </div>
                )}

                <div className="vr-result-card__actions">
                  <button
                    className="vr-primary-button"
                    onClick={() => {
                      audioRef.current.play("click");
                      E.start();
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>PLAY AGAIN</span>
                  </button>
                  <button className="vr-secondary-button" onClick={closeGame}>
                    RETURN TO THE STORY
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------------------- BOTTOM BAR ---------------------------- */}
      <div className="vr-bottom">
        <div className="vr-controls-hint">
          <span className="vr-controls-hint__label">CONTROLS</span>
          <span><kbd>A</kbd><kbd>D</kbd> MOVE</span>
          <span><kbd>SPACE</kbd> STRIKE</span>
          <span><kbd>SHIFT</kbd> EVADE</span>
          <span><kbd>E</kbd> DIVINE FORCE</span>
          <span><kbd>P</kbd> PAUSE</span>
        </div>

        <div className="vr-actions">
          <button className="vr-action vr-action--move" disabled={!live} aria-label="Move left" {...moveProps("l")}>
            <ArrowLeft size={19} />
          </button>
          <button className="vr-action vr-action--move" disabled={!live} aria-label="Move right" {...moveProps("r")}>
            <ArrowRight size={19} />
          </button>

          <button
            className={`vr-action vr-action--dodge ${evadeLow ? "is-low" : ""}`}
            onClick={() => E.dodge()}
            disabled={!live}
          >
            <i className="vr-action__fill" style={{ "--fill": `${clamp(hud.stam / EVADE_COST, 0, 1) * 100}%` }} />
            <Shield size={17} />
            <span>{evadeLow ? "RECOVERING" : "EVADE"}</span>
            <small>SHIFT</small>
          </button>

          <button className="vr-action vr-action--strike" onClick={() => E.strike()} disabled={!live}>
            <i className="vr-action__fill vr-action__fill--cd" style={{ "--fill": `${hud.strikeCd * 100}%` }} />
            <Swords size={17} />
            <span>{hud.strikeCd > 0 ? "DRAWING" : "STRIKE"}</span>
            <small>SPACE</small>
          </button>

          <button
            className={`vr-action vr-action--divine ${divineReady ? "is-ready" : ""}`}
            onClick={() => E.divine()}
            disabled={!live}
          >
            <i className="vr-action__fill vr-action__fill--divine" style={{ "--fill": `${hud.div}%` }} />
            <Zap size={17} />
            <span>{divineReady ? "DIVINE FORCE" : `${hud.div}%`}</span>
            <small>E</small>
          </button>
        </div>

        <div className="vr-bottom__right">
          <span>ANCESTRA</span>
          <i />
          <span>THE PAST CANNOT BE CHANGED</span>
        </div>
      </div>
    </motion.div>
  );
}