/**
 * ANCESTRA — Chapter XIX, Game 3
 * THE LAST WORDS: RAMA AND RAVANA
 *
 * Place at:  src/.../interactions/TheLastWords/TheLastWords.jsx
 *            src/.../interactions/TheLastWords/TheLastWords.css
 *
 * Needs only: react, react-dom, framer-motion, three, @react-three/fiber
 * All sound is synthesised live with the Web Audio API — no audio files.
 *
 * Props: onComplete / onExit  (either one closes the experience and returns
 * the player to the Chapter XIX story page; Chapter XX is never started).
 */
import React, {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import "./TheLastWords.css";

/* ================================================================== */
/*  EMOTION PALETTE                                                    */
/*  speed  = ms per character (lower = angrier / faster)               */
/*  veil   = soft edge tint over the image (centre stays clear)        */
/*  push   = slow "breathing" scale of the image                       */
/* ================================================================== */

const EMOTIONS = {
  foreboding: { speed: 42, ink: "#efe4cc", veil: "rgba(8,4,3,.55)", push: 1.012, sting: "foreboding" },
  sorrow:     { speed: 46, ink: "#e4e2da", veil: "rgba(28,38,58,.42)", push: 1.004, sting: "sorrow" },
  resolve:    { speed: 36, ink: "#f6e7c4", veil: "rgba(168,112,44,.26)", push: 1.018, sting: "resolve" },
  suspense:   { speed: 44, ink: "#eee3cb", veil: "rgba(10,6,4,.5)", push: 1.016, sting: "foreboding" },
  pride:      { speed: 34, ink: "#fbe6b0", veil: "rgba(196,146,48,.30)", push: 1.02, sting: "pride" },
  defiance:   { speed: 27, ink: "#f7dcb4", veil: "rgba(150,62,22,.34)", push: 1.026, sting: "defiance" },
  wrath:      { speed: 21, ink: "#ffd9c4", veil: "rgba(122,18,10,.46)", push: 1.036, sting: "wrath" },
  menace:     { speed: 38, ink: "#f1d4c0", veil: "rgba(86,10,10,.44)", push: 1.03, sting: "menace" },
  calm:       { speed: 41, ink: "#f0ecd8", veil: "rgba(104,128,120,.22)", push: 1.0, sting: "calm" },
  solemn:     { speed: 39, ink: "#f3e9d2", veil: "rgba(20,14,8,.34)", push: 1.008, sting: "solemn" },
  finality:   { speed: 52, ink: "#f0e4cb", veil: "rgba(0,0,0,.52)", push: 1.01, sting: "finality" },
};

/* ================================================================== */
/*  STORY DATA — each paragraph is one beat with its own emotion       */
/* ================================================================== */

const N = "Narrator";
const RV = "Ravana";
const RM = "Rama";
const b = (who, emo, dir, text) => ({ who, emo, dir, text });

const STAGES = [
  {
    id: "final-encounter",
    image: "/images/ramayana/interactions/ch19g31.jpg",
    pos: { d: "50% 40%", m: "50% 40%" },
    hold: 3000,
    fade: 3.4,
    zoom: [1.02, 1.08],
    motes: 0.8,
    mood: { drone: 0.2, cutoff: 130, wind: 0.34, drumEvery: 3400, drumVel: 0.5, double: true },
    opening: "horn",
    beats: [
      b(N, "foreboding", "a hush before the storm", "The armies stood silent beneath the skies of Lanka. Before them stood two kings, each carrying the weight of everything that had brought them to this moment."),
      b(N, "sorrow", "weighed with loss", "The war had taken countless turns. Great warriors had fallen. Kingdoms had been shaken. Yet the final confrontation had always been approaching."),
      b(N, "resolve", "each word set down like a stone", "Now, at last, Rama and Ravana stood face to face."),
      b(N, "suspense", "the world holding its breath", "The battlefield waited for the words that would precede their final encounter."),
    ],
  },
  {
    id: "pride-of-lanka",
    image: "/images/ramayana/interactions/ch19g32.jpg",
    pos: { d: "50% 30%", m: "50% 28%" },
    hold: 1300,
    fade: 2.6,
    zoom: [1.03, 1.09],
    motes: 1,
    mood: { drone: 0.26, cutoff: 170, wind: 0.2, drumEvery: 4600, drumVel: 0.62, double: false },
    beats: [
      b(RV, "pride", "with regal, unhurried arrogance", "Rama, you stand before the king of Lanka. I have commanded mighty armies, conquered kingdoms, and stood against forces that others feared to challenge."),
      b(RV, "defiance", "wounded, yet unbowed", "Do not mistake this moment for the end of my strength. My kingdom may have suffered, and my warriors may have fallen, but I remain Ravana."),
      b(RV, "wrath", "his voice hardening like iron", "I have never bowed before another king. I will not abandon my pride now."),
      b(RV, "menace", "a king's final challenge", "Let the world witness what happens when Ravana stands against his final enemy."),
    ],
  },
  {
    id: "words-of-rama",
    image: "/images/ramayana/interactions/ch19g33.jpg",
    pos: { d: "50% 30%", m: "50% 28%" },
    hold: 1300,
    fade: 2.6,
    zoom: [1.03, 1.09],
    motes: 0.6,
    mood: { drone: 0.15, cutoff: 115, wind: 0.28, drumEvery: 0, drumVel: 0, double: false },
    beats: [
      b(RM, "calm", "calm, and without contempt", "Ravana, your knowledge and strength are beyond question. You have mastered many disciplines and achieved greatness through your abilities."),
      b(RM, "solemn", "gravely, choosing each word", "But strength without restraint can become destruction. Knowledge without wisdom can lead even the greatest of kings astray."),
      b(RM, "sorrow", "with quiet sorrow", "You were given opportunities to choose another path. Yet you allowed pride to stand above wisdom."),
      b(RM, "resolve", "unshaken, certain of his duty", "I have not come here for your kingdom or your riches. I stand here because a wrong must be answered, and Dharma cannot be abandoned."),
    ],
  },
  {
    id: "no-turning-back",
    image: "/images/ramayana/interactions/ch19g34.jpg",
    pos: { d: "50% 38%", m: "50% 38%" },
    hold: 1500,
    fade: 2.6,
    zoom: [1.0, 1.075],
    motes: 1.5,
    mood: { drone: 0.32, cutoff: 230, wind: 0.18, drumEvery: 1900, drumVel: 0.82, double: true },
    beats: [
      b(RV, "wrath", "scornful, anger rising", "Enough of your words, Rama. You speak of Dharma as though the world has only one path and one judgment."),
      b(RM, "calm", "steady as stone", "Dharma is not decided by the pride of a king. It is revealed through one's actions and the consequences they bring."),
      b(RV, "menace", "darkly, almost a whisper", "Then let our actions decide what words cannot."),
      b(RM, "finality", "with solemn finality", "So be it. Let this battle reach its end."),
    ],
  },
  {
    id: "last-silence",
    image: "/images/ramayana/interactions/ch19g35.jpg",
    pos: { d: "50% 42%", m: "50% 42%" },
    hold: 3000,
    fade: 3.8,
    zoom: [1.02, 1.06],
    motes: 0.5,
    mood: { drone: 0.1, cutoff: 90, wind: 0.3, drumEvery: 0, drumVel: 0, double: false },
    beats: [
      b(N, "finality", "in the stillness", "The words had ended."),
      b(N, "solemn", "two kings, two truths", "Rama stood with the calm resolve of one who had accepted the burden of his duty. Ravana stood with the pride of a king who had refused to surrender."),
      b(N, "foreboding", "the whole world waiting", "Behind them waited two great armies. Before them lay the final moment of their long and terrible conflict."),
      b(N, "sorrow", "quietly, almost a farewell", "No more words could change what had come to pass."),
      b(N, "finality", "and then, silence", "The final battle was about to begin."),
    ],
  },
];

const TOTAL = STAGES.length;
const LEAVE_MS = 1000;
const GAP_FADE = 560;
const FINAL_PAUSE = 3200;
const pad = (n) => String(n).padStart(2, "0");
const gapFor = (t) => Math.min(2800, 900 + t.length * 9);

/* ================================================================== */
/*  SOUND — procedural Web Audio (drone, wind, drums, gong, horn)      */
/* ================================================================== */

function makeImpulse(ctx, seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function makeNoise(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02; // brown noise
    d[i] = last * 3.5;
  }
  return buf;
}

function createAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  let ctx;
  try {
    ctx = new AC();
  } catch (e) {
    return null;
  }

  const LEVEL = 0.85;
  let muted = false;
  let dead = false;
  let drumTimer = null;
  let mood = { drumEvery: 0, drumVel: 0, double: false };
  const sources = [];
  const timers = new Set();

  const master = ctx.createGain();
  master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp);
  comp.connect(ctx.destination);

  const bus = ctx.createGain();
  const dry = ctx.createGain();
  dry.gain.value = 0.8;
  bus.connect(dry);
  dry.connect(master);
  const verb = ctx.createConvolver();
  verb.buffer = makeImpulse(ctx, 3.4, 2.6);
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  bus.connect(verb);
  verb.connect(wet);
  wet.connect(master);

  const noiseBuf = makeNoise(ctx, 6);

  /* ---- continuous beds ---- */
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0;
  const droneLP = ctx.createBiquadFilter();
  droneLP.type = "lowpass";
  droneLP.frequency.value = 140;
  droneLP.Q.value = 0.7;
  [[55, "sawtooth", 0.5], [55.45, "sawtooth", 0.5], [27.5, "sine", 0.9], [82.4, "triangle", 0.22]].forEach(
    ([f, type, g]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = g;
      o.connect(og);
      og.connect(droneLP);
      o.start();
      sources.push(o);
    }
  );
  droneLP.connect(droneGain);
  droneGain.connect(bus);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 45;
  lfo.connect(lfoG);
  lfoG.connect(droneLP.frequency);
  lfo.start();
  sources.push(lfo);

  const wind = ctx.createBufferSource();
  wind.buffer = noiseBuf;
  wind.loop = true;
  const windBP = ctx.createBiquadFilter();
  windBP.type = "bandpass";
  windBP.frequency.value = 380;
  windBP.Q.value = 0.5;
  const windGain = ctx.createGain();
  windGain.gain.value = 0;
  wind.connect(windBP);
  windBP.connect(windGain);
  windGain.connect(bus);
  wind.start();
  sources.push(wind);
  const wl = ctx.createOscillator();
  wl.frequency.value = 0.045;
  const wlg = ctx.createGain();
  wlg.gain.value = 180;
  wl.connect(wlg);
  wlg.connect(windBP.frequency);
  wl.start();
  sources.push(wl);

  /* ---- one-shot building blocks ---- */
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!dead) fn();
    }, ms);
    timers.add(id);
  };
  const live = () => !dead && !muted && ctx.state === "running";

  function tone({ type = "sine", freq, to, vel = 0.3, attack = 0.01, hold = 0, release = 1, filter, detune = 0, when = 0 }) {
    const t = ctx.currentTime + when;
    const end = t + attack + hold + release;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, end);
    o.detune.value = detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + attack);
    g.gain.setValueAtTime(vel, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(filter.from, t);
      f.frequency.linearRampToValueAtTime(filter.to, t + (attack + hold + release) * 0.55);
      o.connect(f);
      f.connect(g);
    } else {
      o.connect(g);
    }
    g.connect(bus);
    o.start(t);
    o.stop(end + 0.1);
  }

  function noiseHit({ vel = 0.2, dur = 0.15, freq = 300, attack = 0.005, type = "lowpass" }) {
    const t = ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    s.connect(f);
    f.connect(g);
    g.connect(bus);
    s.start(t, Math.random() * 4);
    s.stop(t + attack + dur + 0.1);
  }

  const drum = (vel = 0.8) => {
    tone({ freq: 120, to: 38, vel: vel * 0.9, attack: 0.004, release: 0.8 });
    tone({ freq: 62, to: 30, vel: vel * 0.7, attack: 0.006, release: 1.1 });
    noiseHit({ vel: vel * 0.35, dur: 0.12, freq: 260 });
  };

  const gong = (vel = 0.4, base = 98) => {
    [1, 2.01, 2.76, 4.17, 5.4].forEach((m, i) =>
      tone({ freq: base * m, vel: (vel / (i + 1.4)) * 0.9, attack: 0.012, release: 5.5 - i * 0.6 })
    );
  };

  const rumble = (vel = 0.3, dur = 2.5) => {
    noiseHit({ vel, dur, freq: 110, attack: dur * 0.5 });
  };

  const brass = (freqs, vel, dur) => {
    freqs.forEach((f) => {
      [-7, 7].forEach((d) =>
        tone({ type: "sawtooth", freq: f, detune: d, vel: vel / freqs.length, attack: dur * 0.45, release: dur * 0.55, filter: { from: 260, to: 1100 } })
      );
    });
  };

  const bell = (freq, vel = 0.12) => {
    [1, 2.76, 5.4].forEach((m, i) => tone({ freq: freq * m, vel: vel / (i * 1.6 + 1), attack: 0.008, release: 4 - i }));
  };

  const pad = (freqs, vel, dur) => {
    freqs.forEach((f) => tone({ freq: f, vel: vel / freqs.length, attack: dur * 0.5, release: dur * 0.5 }));
  };

  const horn = (vel = 0.11) => {
    [146.8, 147.6, 73.4].forEach((f) =>
      tone({ type: "sawtooth", freq: f, vel, attack: 2.4, hold: 0.6, release: 3.2, filter: { from: 180, to: 780 } })
    );
  };

  /* emotional stingers, fired once at the start of each line */
  const STING = {
    foreboding: () => rumble(0.18, 3),
    sorrow: () => pad([220, 261.63, 329.63], 0.07, 4.2),
    resolve: () => { drum(0.55); pad([98, 146.8], 0.08, 3); },
    pride: () => { brass([110, 165, 220], 0.22, 2.6); later(() => gong(0.18, 110), 900); },
    defiance: () => { drum(0.7); brass([110, 164.8], 0.16, 1.8); },
    wrath: () => { drum(0.95); later(() => drum(0.8), 260); rumble(0.3, 2.2); gong(0.22, 82); },
    menace: () => { gong(0.28, 73); rumble(0.26, 2.8); },
    calm: () => bell(523.25, 0.11),
    solemn: () => bell(261.63, 0.12),
    finality: () => { drum(0.7); later(() => gong(0.16, 87), 200); },
  };

  /* ---- drum loop that follows the mood ---- */
  function drumLoop() {
    clearTimeout(drumTimer);
    if (dead || !mood.drumEvery) return;
    if (live()) {
      drum(mood.drumVel);
      if (mood.double) later(() => live() && drum(mood.drumVel * 0.55), 250);
    }
    drumTimer = setTimeout(drumLoop, mood.drumEvery * (0.97 + Math.random() * 0.06));
  }

  const ramp = (param, value, tc = 1.4) => param.setTargetAtTime(value, ctx.currentTime, tc);

  return {
    start() {
      ctx.resume && ctx.resume();
      ramp(master.gain, muted ? 0 : LEVEL, 1.2);
    },
    resume() {
      if (ctx.state === "suspended") ctx.resume();
    },
    setMuted(m) {
      muted = m;
      ramp(master.gain, m ? 0 : LEVEL, 0.25);
    },
    setMood(m) {
      mood = m;
      ramp(droneGain.gain, m.drone, 1.6);
      ramp(droneLP.frequency, m.cutoff, 1.6);
      ramp(windGain.gain, m.wind, 1.6);
      clearTimeout(drumTimer);
      if (m.drumEvery) drumTimer = setTimeout(drumLoop, 900);
    },
    sting(kind) {
      if (live() && STING[kind]) STING[kind]();
    },
    transition() {
      if (live()) { gong(0.3, 92); drum(0.55); }
    },
    opening() {
      if (live()) horn(0.11);
    },
    finale() {
      if (!live()) return;
      drum(1);
      later(() => horn(0.13), 700);
      later(() => gong(0.3, 73), 500);
    },
    tick() {
      if (live()) noiseHit({ vel: 0.012, dur: 0.03, freq: 2400, type: "bandpass" });
    },
    stop() {
      dead = true;
      clearTimeout(drumTimer);
      timers.forEach(clearTimeout);
      timers.clear();
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      } catch (e) {}
      setTimeout(() => {
        sources.forEach((s) => { try { s.stop(); } catch (e) {} });
        try { ctx.close(); } catch (e) {}
      }, 900);
    },
  };
}

/* ================================================================== */
/*  3D ATMOSPHERE — drifting ash / embers with pointer parallax        */
/* ================================================================== */

function Motes({ intensity, pointer }) {
  const matRef = useRef();
  const COUNT = 300;

  const { geometry, speeds, phases } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const spd = new Float32Array(COUNT);
    const ph = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 7 - 1;
      spd[i] = 0.07 + Math.random() * 0.2;
      ph[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: g, speeds: spd, phases: ph };
  }, []);

  const k = useRef(intensity);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    k.current += (intensity - k.current) * Math.min(1, d * 1.5);
    const attr = geometry.attributes.position;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      let y = attr.getY(i) + speeds[i] * d * (0.5 + k.current * 0.6);
      const x = attr.getX(i) + Math.sin(t * 0.4 + phases[i]) * d * 0.05;
      if (y > 5.2) y = -5.2;
      attr.setXYZ(i, x, y, attr.getZ(i));
    }
    attr.needsUpdate = true;
    const cam = state.camera;
    cam.position.x += (pointer.current.x * 0.45 - cam.position.x) * Math.min(1, d * 2);
    cam.position.y += (-pointer.current.y * 0.25 - cam.position.y) * Math.min(1, d * 2);
    cam.lookAt(0, 0, 0);
    if (matRef.current) matRef.current.opacity = 0.26 + k.current * 0.14;
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial ref={matRef} size={0.05} color="#e6cd96" transparent opacity={0.4} depthWrite={false} sizeAttenuation />
    </points>
  );
}

class SafeBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {}
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function useShift(value, px) {
  const out = useMotionValue(0);
  useEffect(() => {
    const apply = (v) => out.set(v * px);
    apply(value.get());
    return value.on("change", apply);
  }, [value, px, out]);
  return out;
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function TheLastWords({ onComplete, onExit }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [beatIdx, setBeatIdx] = useState(0);
  const [chars, setChars] = useState(0);
  // hold | typing | between | gap | ready | final
  const [phase, setPhase] = useState("hold");
  const [leaving, setLeaving] = useState(false);
  const [muted, setMuted] = useState(false);

  const mutedRef = useRef(false);
  mutedRef.current = muted;
  const lock = useRef(false);
  const leaveTimer = useRef(null);
  const audio = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const mx = useSpring(useMotionValue(0), { stiffness: 40, damping: 18 });
  const my = useSpring(useMotionValue(0), { stiffness: 40, damping: 18 });
  const shiftX = useShift(mx, -14);
  const shiftY = useShift(my, -9);

  const stage = STAGES[stageIdx];
  const isLast = stageIdx === TOTAL - 1;
  const beat = stage.beats[beatIdx];
  const text = beat.text;
  const emo = EMOTIONS[beat.emo];
  const longest = useMemo(
    () => stage.beats.reduce((a, x) => (x.text.length > a.length ? x.text : a), ""),
    [stage]
  );

  const close = useCallback(() => {
    if (lock.current) return;
    lock.current = true;
    const fn = onExit || onComplete;
    if (typeof fn === "function") fn();
    else window.history.back();
  }, [onExit, onComplete]);

  /* ---- lock page scroll ---- */
  useEffect(() => {
    const html = document.documentElement;
    const prev = [html.style.overflow, html.style.overscrollBehavior, document.body.style.overflow];
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev[0];
      html.style.overscrollBehavior = prev[1];
      document.body.style.overflow = prev[2];
    };
  }, []);

  /* ---- preload stills ---- */
  useEffect(() => {
    STAGES.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  /* ---- sound: create once, wake on first gesture, tidy up ---- */
  useEffect(() => {
    const a = createAudio();
    audio.current = a;
    if (!a) return undefined;
    a.start();
    const wake = () => a.resume();
    const onVis = () => a.setMuted(document.hidden ? true : mutedRef.current);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      document.removeEventListener("visibilitychange", onVis);
      a.stop();
      audio.current = null;
    };
  }, []);

  /* mute toggle (also restores after tab-hide handling) */
  useEffect(() => {
    if (audio.current) audio.current.setMuted(muted);
  }, [muted]);

  /* stage mood + transition cues */
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    a.setMood(stage.mood);
    if (stageIdx > 0) a.transition();
    if (stage.opening === "horn") a.opening();
  }, [stageIdx, stage]);

  /* emotional sting at the first character of each line */
  useEffect(() => {
    if (phase === "typing" && chars === 1 && audio.current) audio.current.sting(emo.sting);
  }, [phase, chars, emo]);

  /* very soft typing tick */
  useEffect(() => {
    if (phase === "typing" && chars > 0 && chars % 3 === 0 && audio.current) audio.current.tick();
  }, [phase, chars]);

  /* closing cue */
  useEffect(() => {
    if (phase === "final" && audio.current) audio.current.finale();
  }, [phase]);

  /* ---- pointer parallax ---- */
  useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      pointer.current = { x, y };
      mx.set(x);
      my.set(y);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  /* ---- cinematic state machine (timers cleaned on every change) ---- */
  useEffect(() => {
    let t;
    if (phase === "hold") {
      t = setTimeout(() => setPhase("typing"), stage.hold);
    } else if (phase === "typing") {
      if (chars >= text.length) {
        setPhase(beatIdx < stage.beats.length - 1 ? "between" : "ready");
      } else {
        const prev = chars > 0 ? text[chars - 1] : "";
        const s = emo.speed;
        let delay = s;
        if (prev === ",") delay = s * 5;
        else if (prev === ";" || prev === ":") delay = s * 6;
        else if (prev === "." || prev === "?" || prev === "!") delay = s * 10;
        t = setTimeout(() => setChars((c) => c + 1), chars === 0 ? 380 : delay);
      }
    } else if (phase === "between") {
      t = setTimeout(() => setPhase("gap"), gapFor(text));
    } else if (phase === "gap") {
      t = setTimeout(() => {
        setBeatIdx((x) => x + 1);
        setChars(0);
        setPhase("typing");
      }, GAP_FADE);
    } else if (phase === "ready" && isLast) {
      t = setTimeout(() => setPhase("final"), FINAL_PAUSE);
    }
    return () => clearTimeout(t);
  }, [phase, chars, beatIdx, stageIdx, text, stage, isLast, emo]);

  /* ---- controls ---- */
  const skipText = useCallback(() => {
    if (lock.current) return;
    if (phase === "hold") setPhase("typing");
    else if (phase === "typing") setChars(text.length);
    else if (phase === "between") setPhase("gap");
  }, [phase, text]);

  const goNext = useCallback(() => {
    if (lock.current || phase !== "ready" || isLast) return;
    lock.current = true; // swallows rapid double-clicks
    setLeaving(true);
    leaveTimer.current = setTimeout(() => {
      setStageIdx((i) => i + 1);
      setBeatIdx(0);
      setChars(0);
      setPhase("hold");
      setLeaving(false);
      lock.current = false;
    }, LEAVE_MS);
  }, [phase, isLast]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.target && e.target.tagName === "BUTTON") return;
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        if (phase === "ready" && !isLast) goNext();
        else if (phase === "final") close();
        else skipText();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, isLast, goNext, close, skipText]);

  const showText = phase !== "hold" && phase !== "final" && !leaving;
  const showSkip = phase === "typing" || phase === "between";
  const showContinue = phase === "ready" && !isLast && !leaving;
  const textOpacity = phase === "gap" || leaving ? 0 : 1;
  const progress = (stageIdx + (isLast && phase === "final" ? 1 : 0.5)) / TOTAL;

  const node = (
    <div
      className="tlw-root"
      role="dialog"
      aria-label="The Last Words: Rama and Ravana"
      data-emotion={beat.emo}
      data-phase={phase}
      style={{ "--ink": emo.ink }}
    >
      {/* ---------- full-screen stills, crossfaded ---------- */}
      <div className="tlw-bg">
        <AnimatePresence initial>
          <motion.div
            key={stage.id}
            className="tlw-shot"
            style={{ "--pos-d": stage.pos.d, "--pos-m": stage.pos.m, zIndex: stageIdx + 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: stage.fade, ease: "easeInOut" } }}
            exit={{ opacity: 0, transition: { delay: stage.fade, duration: 0.01 } }}
          >
            <motion.div className="tlw-parallax" style={{ x: shiftX, y: shiftY }}>
              <motion.div
                className="tlw-breath"
                animate={{ scale: phase === "final" ? 1.0 : emo.push }}
                transition={{ duration: 5, ease: "easeInOut" }}
              >
                <motion.img
                  src={stage.image}
                  alt=""
                  draggable={false}
                  className="tlw-img"
                  initial={{ scale: stage.zoom[0] }}
                  animate={{ scale: stage.zoom[1] }}
                  transition={{ duration: 24, ease: "linear" }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---------- emotional veil (edges only, faces stay clear) ---------- */}
      <AnimatePresence>
        <motion.div
          key={beat.emo}
          className="tlw-veil"
          style={{ "--veil": emo.veil }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          aria-hidden="true"
        />
      </AnimatePresence>

      {/* ---------- 3D atmosphere ---------- */}
      <div className="tlw-3d" aria-hidden="true">
        <SafeBoundary>
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 6], fov: 55 }}
            gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
            style={{ background: "transparent" }}
          >
            <Motes intensity={stage.motes} pointer={pointer} />
          </Canvas>
        </SafeBoundary>
      </div>

      <div className="tlw-vignette" aria-hidden="true" />
      <div className="tlw-grain" aria-hidden="true" />
      <div className="tlw-shade-top" aria-hidden="true" />
      <div className="tlw-shade-bottom" aria-hidden="true" />

      {/* ---------- header ---------- */}
      <header className="tlw-header">
        <div className="tlw-title">
          <div className="tlw-brand">ANCESTRA</div>
          <div className="tlw-sub">THE LAST WORDS</div>
        </div>
        <div className="tlw-meta">
          <div className="tlw-count" aria-label={`Stage ${stageIdx + 1} of ${TOTAL}`}>
            <AnimatePresence mode="wait">
              <motion.span
                key={stageIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.4 }}
              >
                {pad(stageIdx + 1)}
              </motion.span>
            </AnimatePresence>
            <span className="tlw-count-total"> / {pad(TOTAL)}</span>
          </div>
          <div className="tlw-utility">
            <button type="button" className="tlw-mini" onClick={() => setMuted((m) => !m)} aria-pressed={muted}>
              SOUND {muted ? "OFF" : "ON"}
            </button>
            <span className="tlw-dot" aria-hidden="true">·</span>
            <button type="button" className="tlw-mini" onClick={close}>
              EXIT
            </button>
          </div>
        </div>
        <div className="tlw-progress">
          <motion.div
            className="tlw-progress-fill"
            animate={{ scaleX: progress }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
        </div>
      </header>

      {/* ---------- caption (no box: text sits directly on the film) ---------- */}
      <div className="tlw-caption">
        <AnimatePresence mode="wait">
          {phase !== "final" ? (
            <motion.div
              key="dialogue"
              className="tlw-dialogue"
              initial={{ opacity: 0 }}
              animate={{ opacity: showText ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{ pointerEvents: showText ? "auto" : "none" }}
            >
              <motion.div
                key={`${stageIdx}-${beat.who}`}
                className={`tlw-speaker tlw-speaker--${beat.who.toLowerCase()}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: textOpacity, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                {beat.who.toUpperCase()}
              </motion.div>

              <motion.div
                key={`dir-${stageIdx}-${beatIdx}`}
                className="tlw-direction"
                initial={{ opacity: 0 }}
                animate={{ opacity: textOpacity * 0.85 }}
                transition={{ duration: 0.8 }}
              >
                {beat.dir}
              </motion.div>

              <motion.div
                key={`${stageIdx}-${beatIdx}`}
                className="tlw-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: textOpacity }}
                transition={{ duration: GAP_FADE / 1000 }}
              >
                {/* ghost reserves the tallest line so nothing ever shifts */}
                <span className="tlw-ghost" aria-hidden="true">{longest}</span>
                {/* full line is laid out from the start; unspoken letters stay invisible,
                    so words never jump between lines while typing */}
                <span className="tlw-live" aria-hidden="true">
                  <span>{text.slice(0, chars)}</span>
                  <span className="tlw-unspoken">{text.slice(chars)}</span>
                </span>
                <span className="tlw-sr" aria-live="polite">{phase === "typing" ? "" : text}</span>
              </motion.div>

              <div className="tlw-actions">
                <AnimatePresence mode="wait">
                  {showContinue ? (
                    <motion.button
                      key="continue"
                      type="button"
                      className="tlw-link tlw-link--primary"
                      onClick={goNext}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      <span>CONTINUE</span>
                      <span className="tlw-arrow" aria-hidden="true">→</span>
                    </motion.button>
                  ) : showSkip ? (
                    <motion.button
                      key="skip"
                      type="button"
                      className="tlw-link"
                      onClick={skipText}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <span>SKIP TEXT</span>
                    </motion.button>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="final"
              className="tlw-final"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            >
              <div className="tlw-final-title">THE FINAL BATTLE AWAITS</div>
              <div className="tlw-final-rule" />
              <motion.button
                type="button"
                className="tlw-link tlw-link--primary tlw-link--big"
                onClick={close}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 1.1 }}
                autoFocus
              >
                <span>RETURN TO THE STORY</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* deepen the frame for the closing silence */}
      <div className={`tlw-final-veil${phase === "final" ? " is-on" : ""}`} aria-hidden="true" />

      {/* opening fade from black */}
      <motion.div
        className="tlw-curtain"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 2.8, ease: "easeOut" }}
        aria-hidden="true"
      />
    </div>
  );

  return createPortal(node, document.body);
}