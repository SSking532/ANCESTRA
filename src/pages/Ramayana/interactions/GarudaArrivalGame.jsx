/**
 * ANCESTRA — Chapter XV, Game 2
 * THE ARRIVAL OF GARUDA
 *
 * Location: src/components/interactions/GarudaArrivalGame.jsx
 *
 * Stack used (all already in your other ANCESTRA games):
 *   react, framer-motion, lucide-react, @react-three/fiber, three
 *
 * Quick switches near the top of this file:
 *   ENABLE_3D            -> false removes the WebGL particle layer completely
 *   USE_SYNTH_FALLBACK   -> false = silence instead of generated sound when a file is missing
 */

import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ChevronRight, LogOut, ScrollText, Volume2, VolumeX } from "lucide-react";
import "./GarudaArrivalGame.css";

/* ════════════════════════════════════════════════════════════════════
   0. SWITCHES
   ════════════════════════════════════════════════════════════════════ */
const ENABLE_3D = true;
const USE_SYNTH_FALLBACK = true;
const TYPE_MS = 11; // typewriter speed (ms per character)

/* ════════════════════════════════════════════════════════════════════
   1. AUDIO CONFIG  ──  REPLACE THE PLACEHOLDER PATHS WITH YOUR REAL FILES
   ────────────────────────────────────────────────────────────────────
   These files do NOT exist yet. If a file is missing the game keeps working:
   a built-in generated soundscape (wind, eagle cry, chimes…) plays instead.
   ════════════════════════════════════════════════════════════════════ */
const AUDIO_DIR = "/audio/ramayana/garuda-arrival"; // ← PLACEHOLDER FOLDER

const BATTLEFIELD_AUDIO = { src: `${AUDIO_DIR}/battlefield-ambience.mp3`, volume: 0.5, loop: true }; // ← PLACEHOLDER
const WIND_AUDIO = { src: `${AUDIO_DIR}/strong-wind.mp3`, volume: 0.95, loop: true }; // ← PLACEHOLDER
const GARUDA_CRY_AUDIO = { src: `${AUDIO_DIR}/garuda-eagle-cry.mp3`, volume: 0.9, loop: false }; // ← PLACEHOLDER
const BOND_RELEASE_AUDIO = { src: `${AUDIO_DIR}/bond-release.mp3`, volume: 0.85, loop: false }; // ← PLACEHOLDER
const CELEBRATION_AUDIO = { src: `${AUDIO_DIR}/celebration-ambience.mp3`, volume: 0.42, loop: true }; // ← PLACEHOLDER

const AUDIO_CHANNELS = {
  battlefield: BATTLEFIELD_AUDIO,
  wind: WIND_AUDIO,
  cry: GARUDA_CRY_AUDIO,
  release: BOND_RELEASE_AUDIO,
  celebration: CELEBRATION_AUDIO,
};

/* ════════════════════════════════════════════════════════════════════
   2. STORY DATA
   ════════════════════════════════════════════════════════════════════ */
const IMG = "/images/ramayana/interactions";

const SPEAKERS = {
  narrator: { name: "Narrator", accent: "#e3d3a8", glyph: null },
  hanuman: { name: "Hanuman", accent: "#f0a04b", glyph: "ह" },
  jambavan: { name: "Jambavan", accent: "#c9b48a", glyph: "ज" },
  rama: { name: "Rama", accent: "#8fc0cf", glyph: "रा" },
  lakshmana: { name: "Lakshmana", accent: "#a9c47a", glyph: "ल" },
  garuda: { name: "Garuda", accent: "#f0c260", glyph: "ग" },
};

/**
 * mode:       "manual" = player clicks through, "auto" = lines advance on their own
 * endAction:  "continue" | "auto" | "timed" | "release" | "finale"
 * atmo:       key into ATMOS (3D particles)
 */
const STAGES = [
  {
    id: "bound",
    image: `${IMG}/ch15g21.jpg`,
    title: "The Brothers Bound",
    sanskrit: "नागपाश",
    mode: "manual",
    endAction: "continue",
    dialogueDelay: 2200,
    pauseAfter: 0,
    grade: "saturate(0.84) brightness(0.9) contrast(1.06)",
    tint: "rgba(16, 14, 30, 0.26)",
    camera: {
      from: { scale: 1.036, x: "0%", y: "0%" },
      to: { scale: 1.060, x: "-1.2%", y: "-0.8%" },
      dur: 30,
    },
    lines: [
      {
        who: "narrator",
        text: "The battlefield had fallen into an uneasy silence. The serpent bonds of Indrajit’s Nagapasha held Rama and Lakshmana fast. Around them stood the Vanara warriors, their hearts troubled by the sight.",
      },
      {
        who: "hanuman",
        text: "Lord Rama... Lakshmana... how can these bonds hold the very ones upon whom our hopes rest?",
      },
      {
        who: "jambavan",
        text: "Hanuman, do not surrender to despair. This moment has not yet revealed its end.",
      },
      {
        who: "narrator",
        text: "Then, from somewhere beyond the battlefield, the air began to change.",
      },
    ],
  },
  {
    id: "wind",
    image: `${IMG}/ch15g22.jpg`,
    title: "The Wind from the Heavens",
    sanskrit: "पवन",
    mode: "auto",
    endAction: "auto",
    dialogueDelay: 1700,
    pauseAfter: 2800,
    grade: "saturate(0.9) brightness(0.92) contrast(1.05)",
    tint: "rgba(70, 48, 22, 0.2)",
    camera: {
      from: { scale: 1.042, x: "1%", y: "2.2%" },
      to: { scale: 1.066, x: "0%", y: "4%" },
      dur: 22,
    },
    lines: [
      {
        who: "narrator",
        text: "A mighty wind swept across the battlefield. Leaves rose from the earth, branches trembled, and the Vanara warriors turned their eyes towards the heavens.",
      },
      { who: "hanuman", text: "This is no ordinary wind. Someone of immense power approaches." },
      {
        who: "jambavan",
        text: "Look towards the sky. The moment we have awaited may have arrived.",
      },
    ],
  },
  {
    id: "arrival",
    image: `${IMG}/ch15g23.jpg`,
    title: "The Arrival of Garuda",
    sanskrit: "गरुड़",
    mode: "auto",
    endAction: "auto",
    dialogueDelay: 2600,
    pauseAfter: 3200,
    grade: "saturate(1.02) brightness(0.98) contrast(1.06)",
    tint: "rgba(255, 190, 90, 0.05)",
    camera: {
      from: { scale: 1.009, x: "0%", y: "0%" },
      to: { scale: 1.051, x: "0%", y: "-1.2%" },
      dur: 15,
    },
    lines: [
      {
        who: "narrator",
        text: "From the heavens descended Garuda, the mighty king of birds. His presence filled the battlefield with awe. The serpents that held the brothers trembled before him.",
      },
      { who: "hanuman", text: "Garuda! The mighty one has come!" },
      { who: "jambavan", text: "The bonds of the Nagas cannot endure his presence." },
    ],
  },
  {
    id: "release",
    image: `${IMG}/ch15g24.jpg`,
    title: "The Serpent Bonds Are Broken",
    sanskrit: "मुक्ति",
    mode: "manual",
    endAction: "release",
    dialogueDelay: 2000,
    pauseAfter: 0,
    grade: "saturate(0.98) brightness(0.95) contrast(1.06)",
    tint: "rgba(30, 40, 28, 0.14)",
    camera: {
      from: { scale: 1.024, x: "0%", y: "0%" },
      to: { scale: 1.042, x: "0%", y: "-0.6%" },
      release: { scale: 1.078, x: "0%", y: "-2%" },
      dur: 22,
    },
    lines: [
      {
        who: "narrator",
        text: "Garuda drew near to the two brothers. At the sight of him, the serpents withdrew, unable to remain in his presence. The bonds that had held Rama and Lakshmana began to loosen.",
      },
    ],
  },
  {
    id: "rise",
    image: `${IMG}/ch15g25.jpg`,
    title: "The Brothers Rise",
    sanskrit: "हर्ष",
    mode: "manual",
    endAction: "timed",
    dialogueDelay: 3400,
    pauseAfter: 3800,
    grade: "saturate(1.06) brightness(1.02) contrast(1.04)",
    tint: "rgba(255, 196, 110, 0.1)",
    camera: {
      from: { scale: 1.021, x: "0%", y: "0.5%" },
      to: { scale: 1.051, x: "0%", y: "-0.8%" },
      dur: 24,
    },
    lines: [
      {
        who: "narrator",
        text: "The serpent bonds had vanished. Rama and Lakshmana rose once more, freed from the celestial snare. Relief spread through the Vanara army, and hope returned to the hearts of all who had witnessed their fall.",
      },
      {
        who: "hanuman",
        text: "My Lord! Your freedom has brought strength back to every heart in this army.",
      },
      { who: "rama", text: "Hanuman, your devotion and courage have never wavered." },
      {
        who: "lakshmana",
        text: "We must remember the one whose arrival has brought us this freedom.",
      },
    ],
  },
  {
    id: "farewell",
    image: `${IMG}/ch15g26.jpg`,
    title: "Garuda’s Farewell",
    sanskrit: "आशीर्वाद",
    mode: "manual",
    endAction: "finale",
    dialogueDelay: 2600,
    pauseAfter: 0,
    grade: "saturate(1.06) brightness(1.0) contrast(1.05)",
    tint: "rgba(255, 170, 70, 0.12)",
    camera: {
      from: { scale: 1.024, x: "0%", y: "0%" },
      to: { scale: 1.054, x: "0.8%", y: "-0.8%" },
      dur: 28,
    },
    lines: [
      {
        who: "rama",
        text: "O mighty Garuda, your arrival has freed us from the bonds of the Nagas. We shall remember this grace.",
      },
      {
        who: "garuda",
        text: "Rama, your purpose is greater than this moment. The path ahead remains yours to fulfil. May your strength and resolve never falter.",
      },
      { who: "rama", text: "May your path through the heavens remain blessed, O King of Birds." },
      {
        who: "narrator",
        text: "With his purpose fulfilled, Garuda prepared to depart. His arrival had broken the serpent bonds and restored hope to the army of Rama. Yet the battle for Lanka was far from over.",
      },
    ],
  },
];

const FINAL_LINES = ["THE BONDS HAVE BEEN BROKEN.", "HOPE HAS RETURNED."];
const IMAGES = STAGES.map((s) => s.image);

/* ════════════════════════════════════════════════════════════════════
   3. SMALL HELPERS
   ════════════════════════════════════════════════════════════════════ */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const noop = () => {};
const rng = (seed) => {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallScreen = () => typeof window !== "undefined" && window.innerWidth < 720;

/* ════════════════════════════════════════════════════════════════════
   4. AUDIO — generated fallback soundscape
   ════════════════════════════════════════════════════════════════════ */
function makeNoise(ctx, seconds, brown = false) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i += 1) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else {
      d[i] = w;
    }
  }
  return buf;
}

function stopNodes(nodes) {
  nodes.forEach((n) => {
    try {
      if (typeof n.stop === "function") n.stop();
    } catch (e) {
      /* already stopped */
    }
    try {
      n.disconnect();
    } catch (e) {
      /* already disconnected */
    }
  });
}

const SYNTHS = {
  /* low, tense battlefield: distant heartbeat drums, drone, thin air */
  battlefield(ctx, dest, noise) {
    const out = ctx.createGain();
    out.connect(dest);
    const nodes = [out];
    const timers = [];
    const add = (n) => {
      nodes.push(n);
      return n;
    };

    const rumble = add(ctx.createBufferSource());
    rumble.buffer = noise.brown;
    rumble.loop = true;
    const rl = add(ctx.createBiquadFilter());
    rl.type = "lowpass";
    rl.frequency.value = 360;
    const rg = add(ctx.createGain());
    rg.gain.value = 0.5;
    rumble.connect(rl);
    rl.connect(rg);
    rg.connect(out);

    const air = add(ctx.createBufferSource());
    air.buffer = noise.white;
    air.loop = true;
    const ab = add(ctx.createBiquadFilter());
    ab.type = "bandpass";
    ab.frequency.value = 1300;
    ab.Q.value = 0.4;
    const ag = add(ctx.createGain());
    ag.gain.value = 0.03;
    const alfo = add(ctx.createOscillator());
    alfo.frequency.value = 0.07;
    const alg = add(ctx.createGain());
    alg.gain.value = 0.02;
    alfo.connect(alg);
    alg.connect(ag.gain);
    air.connect(ab);
    ab.connect(ag);
    ag.connect(out);

    [
      ["sine", 55, 0.13],
      ["triangle", 82.41, 0.05],
    ].forEach(([type, f, g]) => {
      const o = add(ctx.createOscillator());
      o.type = type;
      o.frequency.value = f;
      const lp = add(ctx.createBiquadFilter());
      lp.type = "lowpass";
      lp.frequency.value = 260;
      const og = add(ctx.createGain());
      og.gain.value = g;
      o.connect(lp);
      lp.connect(og);
      og.connect(out);
      o.start();
    });

    const thump = (vol) => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(95, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.35);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 0.8);
    };
    const beat = () => {
      thump(0.42);
      timers.push(setTimeout(() => thump(0.24), 430));
    };
    timers.push(setInterval(beat, 4200));
    timers.push(setTimeout(beat, 900));

    rumble.start();
    air.start();
    alfo.start();
    return {
      out,
      stop() {
        timers.forEach((t) => {
          clearInterval(t);
          clearTimeout(t);
        });
        stopNodes(nodes);
      },
    };
  },

  /* strong wind: two moving noise bands, slow gust LFOs, sub rumble */
  wind(ctx, dest, noise) {
    const out = ctx.createGain();
    out.connect(dest);
    const nodes = [out];
    const add = (n) => {
      nodes.push(n);
      return n;
    };

    const src = add(ctx.createBufferSource());
    src.buffer = noise.white;
    src.loop = true;
    const bp = add(ctx.createBiquadFilter());
    bp.type = "bandpass";
    bp.frequency.value = 560;
    bp.Q.value = 0.55;
    const lp = add(ctx.createBiquadFilter());
    lp.type = "lowpass";
    lp.frequency.value = 2000;
    const gust = add(ctx.createGain());
    gust.gain.value = 0.75;
    const l1 = add(ctx.createOscillator());
    l1.frequency.value = 0.21;
    const l1g = add(ctx.createGain());
    l1g.gain.value = 0.25;
    l1.connect(l1g);
    l1g.connect(gust.gain);
    const l2 = add(ctx.createOscillator());
    l2.frequency.value = 0.12;
    const l2g = add(ctx.createGain());
    l2g.gain.value = 280;
    l2.connect(l2g);
    l2g.connect(bp.frequency);
    src.connect(bp);
    bp.connect(lp);
    lp.connect(gust);
    gust.connect(out);

    const hiss = add(ctx.createBufferSource());
    hiss.buffer = noise.white;
    hiss.loop = true;
    const hb = add(ctx.createBiquadFilter());
    hb.type = "highpass";
    hb.frequency.value = 3200;
    const hg = add(ctx.createGain());
    hg.gain.value = 0.07;
    const l3 = add(ctx.createOscillator());
    l3.frequency.value = 0.33;
    const l3g = add(ctx.createGain());
    l3g.gain.value = 0.04;
    l3.connect(l3g);
    l3g.connect(hg.gain);
    hiss.connect(hb);
    hb.connect(hg);
    hg.connect(out);

    const rum = add(ctx.createBufferSource());
    rum.buffer = noise.brown;
    rum.loop = true;
    const rl = add(ctx.createBiquadFilter());
    rl.type = "lowpass";
    rl.frequency.value = 200;
    const rg = add(ctx.createGain());
    rg.gain.value = 0.9;
    rum.connect(rl);
    rl.connect(rg);
    rg.connect(out);

    [src, hiss, rum, l1, l2, l3].forEach((n) => n.start());
    return { out, stop: () => stopNodes(nodes) };
  },

  /* eagle cry: three descending screeches, wingbeats, echo */
  cry(ctx, dest, noise) {
    const out = ctx.createGain();
    out.connect(dest);
    const nodes = [out];
    const add = (n) => {
      nodes.push(n);
      return n;
    };
    const bus = add(ctx.createGain());
    const echo = add(ctx.createDelay(1));
    echo.delayTime.value = 0.31;
    const fb = add(ctx.createGain());
    fb.gain.value = 0.36;
    const eflt = add(ctx.createBiquadFilter());
    eflt.type = "lowpass";
    eflt.frequency.value = 2400;
    const wet = add(ctx.createGain());
    wet.gain.value = 0.38;
    bus.connect(out);
    bus.connect(echo);
    echo.connect(eflt);
    eflt.connect(fb);
    fb.connect(echo);
    eflt.connect(wet);
    wet.connect(out);

    const t0 = ctx.currentTime + 0.03;
    const screech = (start, dur, f0, f1, vol) => {
      const t = t0 + start;
      const o = add(ctx.createOscillator());
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const vib = add(ctx.createOscillator());
      vib.frequency.value = 24;
      const vg = add(ctx.createGain());
      vg.gain.value = f0 * 0.03;
      vib.connect(vg);
      vg.connect(o.frequency);
      const bp = add(ctx.createBiquadFilter());
      bp.type = "bandpass";
      bp.Q.value = 2.4;
      bp.frequency.setValueAtTime(f0 * 1.1, t);
      bp.frequency.exponentialRampToValueAtTime(f1 * 1.1, t + dur);
      const hp = add(ctx.createBiquadFilter());
      hp.type = "highpass";
      hp.frequency.value = 700;
      const g = add(ctx.createGain());
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
      g.gain.setValueAtTime(vol, t + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(bp);
      bp.connect(hp);
      hp.connect(g);
      g.connect(bus);

      const n = add(ctx.createBufferSource());
      n.buffer = noise.white;
      n.loop = true;
      const nb = add(ctx.createBiquadFilter());
      nb.type = "bandpass";
      nb.frequency.value = 3000;
      nb.Q.value = 1.4;
      const ng = add(ctx.createGain());
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.06);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(nb);
      nb.connect(ng);
      ng.connect(bus);

      o.start(t);
      vib.start(t);
      n.start(t);
      o.stop(t + dur + 0.1);
      vib.stop(t + dur + 0.1);
      n.stop(t + dur + 0.1);
    };
    screech(0, 1.5, 2500, 1500, 0.34);
    screech(1.75, 0.85, 2700, 1800, 0.26);
    screech(2.8, 0.6, 2400, 1500, 0.18);

    for (let k = 0; k < 6; k += 1) {
      const t = t0 + 0.1 + k * 0.42;
      const o = add(ctx.createOscillator());
      const g = add(ctx.createGain());
      o.type = "sine";
      o.frequency.setValueAtTime(72, t);
      o.frequency.exponentialRampToValueAtTime(36, t + 0.3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5 * (1 - k * 0.13), t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      o.connect(g);
      g.connect(bus);
      o.start(t);
      o.stop(t + 0.45);
    }

    const sw = add(ctx.createBufferSource());
    sw.buffer = noise.white;
    sw.loop = true;
    const swf = add(ctx.createBiquadFilter());
    swf.type = "lowpass";
    swf.frequency.value = 520;
    const swg = add(ctx.createGain());
    swg.gain.setValueAtTime(0.0001, t0);
    swg.gain.exponentialRampToValueAtTime(0.5, t0 + 0.7);
    swg.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
    sw.connect(swf);
    swf.connect(swg);
    swg.connect(bus);
    sw.start(t0);
    sw.stop(t0 + 2.8);

    return { out, duration: 5.2, stop: () => stopNodes(nodes) };
  },

  /* release: rising chimes, receding hiss, warm swell */
  release(ctx, dest, noise) {
    const out = ctx.createGain();
    out.connect(dest);
    const nodes = [out];
    const add = (n) => {
      nodes.push(n);
      return n;
    };
    const t0 = ctx.currentTime + 0.03;

    [880, 1318.5, 1760, 2637, 3520].forEach((f, i) => {
      const t = t0 + i * 0.16;
      const o = add(ctx.createOscillator());
      const g = add(ctx.createGain());
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13 / (1 + i * 0.35), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 2.5);
    });

    const n = add(ctx.createBufferSource());
    n.buffer = noise.white;
    n.loop = true;
    const hp = add(ctx.createBiquadFilter());
    hp.type = "highpass";
    hp.frequency.setValueAtTime(6000, t0);
    hp.frequency.exponentialRampToValueAtTime(1500, t0 + 2.6);
    const ng = add(ctx.createGain());
    ng.gain.setValueAtTime(0.0001, t0);
    ng.gain.exponentialRampToValueAtTime(0.22, t0 + 0.5);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.8);
    n.connect(hp);
    hp.connect(ng);
    ng.connect(out);
    n.start(t0);
    n.stop(t0 + 3);

    [220, 329.63].forEach((f) => {
      const o = add(ctx.createOscillator());
      const g = add(ctx.createGain());
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + 1.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.6);
      o.connect(g);
      g.connect(out);
      o.start(t0);
      o.stop(t0 + 3.7);
    });

    return { out, duration: 4, stop: () => stopNodes(nodes) };
  },

  /* restrained celebration: soft D-major drone + sparse pentatonic bells */
  celebration(ctx, dest) {
    const out = ctx.createGain();
    out.connect(dest);
    const nodes = [out];
    const timers = [];
    const add = (n) => {
      nodes.push(n);
      return n;
    };
    const lp = add(ctx.createBiquadFilter());
    lp.type = "lowpass";
    lp.frequency.value = 950;
    const pad = add(ctx.createGain());
    pad.gain.value = 0.16;
    const trem = add(ctx.createOscillator());
    trem.frequency.value = 0.18;
    const tg = add(ctx.createGain());
    tg.gain.value = 0.04;
    trem.connect(tg);
    tg.connect(pad.gain);
    lp.connect(pad);
    pad.connect(out);
    [146.83, 220, 293.66, 369.99].forEach((f, i) => {
      const o = add(ctx.createOscillator());
      o.type = "triangle";
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      const g = add(ctx.createGain());
      g.gain.value = i === 0 ? 0.5 : 0.28;
      o.connect(g);
      g.connect(lp);
      o.start();
    });
    trem.start();

    const scale = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];
    const bell = () => {
      const t = ctx.currentTime;
      const f = scale[Math.floor(Math.random() * scale.length)];
      [1, 2.01].forEach((m, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f * m;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(i ? 0.012 : 0.05, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
        o.connect(g);
        g.connect(out);
        o.start(t);
        o.stop(t + 2.3);
      });
    };
    timers.push(setInterval(bell, 2300));
    timers.push(setTimeout(bell, 1200));

    return {
      out,
      stop() {
        timers.forEach((t) => {
          clearInterval(t);
          clearTimeout(t);
        });
        stopNodes(nodes);
      },
    };
  },
};

/* ════════════════════════════════════════════════════════════════════
   5. AUDIO DIRECTOR
   One channel per sound → no overlapping copies, safe fades, safe cleanup.
   Uses your files if they load; otherwise the generated sound above.
   ════════════════════════════════════════════════════════════════════ */
class AudioDirector {
  constructor() {
    this.muted = false;
    this.disposed = false;
    this.ch = {};
    this.ctx = null;
    this.master = null;
    this.noise = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.noise = { white: makeNoise(this.ctx, 3), brown: makeNoise(this.ctx, 4, true) };
      }
    } catch (e) {
      this.ctx = null;
    }
    this._gesture = () => this.unlock();
    window.addEventListener("pointerdown", this._gesture);
    window.addEventListener("keydown", this._gesture);
    window.addEventListener("touchstart", this._gesture, { passive: true });
    this.unlock();
  }

  _get(name) {
    if (!this.ch[name]) {
      this.ch[name] = {
        name,
        cfg: AUDIO_CHANNELS[name],
        el: null,
        synth: null,
        active: false,
        wanted: false,
        level: 1,
        failedFile: false,
        fadeInt: null,
        stopTimer: null,
        endTimer: null,
      };
    }
    return this.ch[name];
  }

  unlock() {
    if (this.disposed) return;
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(noop);
    }
    Object.values(this.ch).forEach((c) => {
      if (c.el && c.wanted && c.el.paused) {
        const p = c.el.play();
        if (p && p.catch) p.catch(noop);
      }
    });
  }

  _rampEl(c, vol, ramp) {
    clearInterval(c.fadeInt);
    const el = c.el;
    if (!el) return;
    const target = clamp(vol, 0, 1);
    if (ramp <= 0.06) {
      el.volume = target;
      return;
    }
    const from = el.volume;
    const steps = Math.max(1, Math.round((ramp * 1000) / 50));
    let i = 0;
    c.fadeInt = setInterval(() => {
      i += 1;
      el.volume = clamp(from + (target - from) * (i / steps), 0, 1);
      if (i >= steps) clearInterval(c.fadeInt);
    }, 50);
  }

  _apply(c, level, ramp) {
    const vol = clamp(level, 0, 1) * c.cfg.volume;
    if (c.synth && this.ctx) {
      const g = c.synth.out.gain;
      const t = this.ctx.currentTime;
      try {
        g.cancelScheduledValues(t);
        g.setValueAtTime(g.value, t);
        g.linearRampToValueAtTime(vol, t + Math.max(0.03, ramp));
      } catch (e) {
        g.value = vol;
      }
    }
    if (c.el) this._rampEl(c, vol, ramp);
  }

  _beginSynth(c, level, fadeIn) {
    if (!USE_SYNTH_FALLBACK || !this.ctx || !this.noise || !SYNTHS[c.name]) {
      c.active = false;
      return;
    }
    try {
      const s = SYNTHS[c.name](this.ctx, this.master, this.noise);
      s.out.gain.value = 0;
      c.synth = s;
      this._apply(c, level, fadeIn);
      if (!c.cfg.loop && s.duration) {
        c.endTimer = setTimeout(() => this._teardown(c), s.duration * 1000 + 250);
      }
    } catch (e) {
      c.active = false;
    }
  }

  _fileFailed(c, el) {
    if (c.el !== el) return;
    c.failedFile = true;
    clearInterval(c.fadeInt);
    try {
      el.pause();
    } catch (e) {
      /* ignore */
    }
    c.el = null;
    if (c.active && c.wanted && !c.synth) this._beginSynth(c, c.level, 0.6);
  }

  _begin(c, level, fadeIn) {
    if (!c.failedFile && c.cfg.src) {
      try {
        const el = new Audio();
        el.preload = "auto";
        el.loop = !!c.cfg.loop;
        el.volume = 0;
        el.muted = this.muted;
        c.el = el;
        el.addEventListener("error", () => this._fileFailed(c, el));
        el.addEventListener("ended", () => {
          if (c.el === el && !c.cfg.loop) this._teardown(c);
        });
        el.src = c.cfg.src;
        const p = el.play();
        if (p && p.catch) {
          p.catch((err) => {
            if (!(err && err.name === "NotAllowedError")) this._fileFailed(c, el);
          });
        }
        this._apply(c, level, fadeIn);
        return;
      } catch (e) {
        c.failedFile = true;
        c.el = null;
      }
    }
    this._beginSynth(c, level, fadeIn);
  }

  start(name, { level = 1, fadeIn = 1.5 } = {}) {
    if (this.disposed || !AUDIO_CHANNELS[name]) return;
    const c = this._get(name);
    c.wanted = true;
    c.level = level;
    if (c.stopTimer) {
      clearTimeout(c.stopTimer);
      c.stopTimer = null;
    }
    if (c.active) {
      this._apply(c, level, fadeIn);
      return;
    }
    c.active = true;
    this._begin(c, level, fadeIn);
  }

  once(name, { level = 1 } = {}) {
    const c = this._get(name);
    if (c.active) return;
    this.start(name, { level, fadeIn: 0.05 });
  }

  level(name, level, ramp = 1.5) {
    const c = this._get(name);
    if (level <= 0.001) {
      if (c.active) this.stop(name, ramp);
      return;
    }
    if (!c.active) {
      this.start(name, { level, fadeIn: ramp });
      return;
    }
    c.level = level;
    c.wanted = true;
    if (c.stopTimer) {
      clearTimeout(c.stopTimer);
      c.stopTimer = null;
    }
    this._apply(c, level, ramp);
  }

  stop(name, fade = 1.2) {
    const c = this.ch[name];
    if (!c || !c.active) return;
    c.wanted = false;
    this._apply(c, 0, fade);
    clearTimeout(c.stopTimer);
    c.stopTimer = setTimeout(() => this._teardown(c), fade * 1000 + 150);
  }

  stopAll(fade = 0.8) {
    Object.keys(this.ch).forEach((n) => this.stop(n, fade));
  }

  _teardown(c) {
    clearInterval(c.fadeInt);
    clearTimeout(c.stopTimer);
    clearTimeout(c.endTimer);
    c.stopTimer = null;
    c.endTimer = null;
    if (c.el) {
      const el = c.el;
      c.el = null;
      try {
        el.pause();
      } catch (e) {
        /* ignore */
      }
    }
    if (c.synth) {
      try {
        c.synth.stop();
      } catch (e) {
        /* ignore */
      }
      c.synth = null;
    }
    c.active = false;
    c.wanted = false;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setValueAtTime(this.master.gain.value, t);
        this.master.gain.linearRampToValueAtTime(m ? 0 : 1, t + 0.15);
      } catch (e) {
        this.master.gain.value = m ? 0 : 1;
      }
    }
    Object.values(this.ch).forEach((c) => {
      if (c.el) c.el.muted = m;
    });
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("pointerdown", this._gesture);
    window.removeEventListener("keydown", this._gesture);
    window.removeEventListener("touchstart", this._gesture);
    Object.values(this.ch).forEach((c) => this._teardown(c));
    if (this.ctx) {
      this.ctx.close().catch(noop);
      this.ctx = null;
    }
  }
}

/* ════════════════════════════════════════════════════════════════════
   6. TYPEWRITER HOOK
   ════════════════════════════════════════════════════════════════════ */
function useTypewriter(text, key, enabled) {
  const [st, setSt] = useState({ key: null, n: 0 });
  const stopRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let n = 0;
    let timer = null;
    let cancelled = false;
    stopRef.current = () => {
      cancelled = true;
      clearTimeout(timer);
      setSt({ key, n: text.length });
    };
    const tick = () => {
      if (cancelled) return;
      n += 1;
      setSt({ key, n });
      if (n < text.length) {
        const ch = text[n - 1];
        const next = text[n];
        let extra = 0;
        if (/[.!?…]/.test(ch) && (!next || next === " ")) extra = 110;
        else if (/[,;:—]/.test(ch)) extra = 55;
        timer = setTimeout(tick, TYPE_MS + extra);
      }
    };
    setSt({ key, n: 0 });
    timer = setTimeout(tick, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopRef.current = null;
    };
  }, [text, key, enabled]);

  const n = st.key === key ? st.n : 0;
  const done = enabled && st.key === key && n >= text.length;
  const complete = useCallback(() => {
    if (stopRef.current) stopRef.current();
  }, []);
  return { shown: text.slice(0, n), rest: text.slice(n), done, complete };
}

/* ════════════════════════════════════════════════════════════════════
   7. 3D ATMOSPHERE (react-three-fiber)
   Depth-aware dust, leaves, feathers and petals that react to the wind.
   ════════════════════════════════════════════════════════════════════ */
const ATMOS = {
  s0: {
    motes: { count: 70, color: "#cdb98f", size: 0.07, opacity: 0.5, additive: false, vx: 0.05, vy: -0.015, windPush: 0.2 },
    drift: null,
  },
  s1: {
    motes: { count: 280, color: "#d9c295", size: 0.06, opacity: 0.7, additive: false, vx: 0.35, vy: -0.02, windPush: 5.5 },
    drift: {
      kind: "leaf",
      count: 26,
      colors: ["#6d7a3a", "#8a8f3f", "#a1792f", "#7a5a2b", "#5a6b34", "#b08b3a"],
      size: [0.14, 0.34],
      vx: 0.5,
      vy: -0.1,
      windPush: 7,
      spin: 2.2,
      opacity: 0.95,
    },
  },
  s2: {
    motes: { count: 120, color: "#ffd48a", size: 0.08, opacity: 0.55, additive: true, vx: 0.06, vy: 0.05, windPush: 2.5 },
    drift: {
      kind: "feather",
      count: 9,
      colors: ["#b98a4a", "#d9ac62", "#8c6234"],
      size: [0.26, 0.46],
      vx: 0.12,
      vy: -0.2,
      windPush: 2.5,
      spin: 0.9,
      opacity: 0.9,
    },
  },
  s3: {
    motes: { count: 80, color: "#d8c49a", size: 0.06, opacity: 0.45, additive: false, vx: 0.03, vy: 0.01, windPush: 0.2 },
    drift: null,
  },
  s3r: {
    motes: { count: 190, color: "#ffe0a0", size: 0.085, opacity: 0.75, additive: true, vx: 0.0, vy: 0.34, windPush: 0.2 },
    drift: null,
  },
  s4: {
    motes: { count: 90, color: "#ffd78f", size: 0.07, opacity: 0.5, additive: true, vx: 0.02, vy: 0.1, windPush: 0.2 },
    drift: {
      kind: "petal",
      count: 36,
      colors: ["#f2a22b", "#e8841a", "#fff1d0", "#d96b1c"],
      size: [0.09, 0.19],
      vx: 0.08,
      vy: -0.3,
      windPush: 0.8,
      spin: 1.4,
      opacity: 0.95,
    },
  },
  s5: {
    motes: { count: 100, color: "#ffcf86", size: 0.07, opacity: 0.55, additive: true, vx: 0.02, vy: 0.12, windPush: 0.2 },
    drift: {
      kind: "feather",
      count: 5,
      colors: ["#c99a58", "#e6c27c"],
      size: [0.24, 0.38],
      vx: 0.03,
      vy: -0.14,
      windPush: 0.5,
      spin: 0.6,
      opacity: 0.85,
    },
  },
};

function makeSprite() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function shapeGeometry(kind) {
  const s = new THREE.Shape();
  if (kind === "petal") {
    s.moveTo(0, -1);
    s.bezierCurveTo(0.95, -0.6, 0.95, 0.55, 0, 1);
    s.bezierCurveTo(-0.95, 0.55, -0.95, -0.6, 0, -1);
  } else if (kind === "feather") {
    s.moveTo(0, -1.6);
    s.bezierCurveTo(0.45, -0.9, 0.5, 0.4, 0.12, 1.5);
    s.lineTo(0, 1.7);
    s.lineTo(-0.1, 1.5);
    s.bezierCurveTo(-0.5, 0.4, -0.45, -0.9, 0, -1.6);
  } else {
    s.moveTo(0, -1);
    s.bezierCurveTo(0.8, -0.5, 0.85, 0.45, 0, 1.1);
    s.bezierCurveTo(-0.85, 0.45, -0.8, -0.5, 0, -1);
  }
  return new THREE.ShapeGeometry(s, 8);
}

function WindDriver({ target, out }) {
  useFrame((_, dt) => {
    out.current += (target.current - out.current) * Math.min(1, Math.min(dt, 0.05) * 1.6);
  });
  return null;
}

function CameraRig({ pointer }) {
  useFrame((state) => {
    const cam = state.camera;
    cam.position.x += (pointer.current.x * 0.35 - cam.position.x) * 0.05;
    cam.position.y += (pointer.current.y * 0.2 - cam.position.y) * 0.05;
    cam.lookAt(0, 0, 0);
  });
  return null;
}

function MoteField({ cfg, wind, leaving, scale }) {
  const { viewport } = useThree();
  const fade = useRef(0);
  const count = Math.max(10, Math.round(cfg.count * scale));

  const data = useMemo(() => {
    const x = new Float32Array(count);
    const y = new Float32Array(count);
    const z = new Float32Array(count);
    const sp = new Float32Array(count);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      x[i] = (Math.random() - 0.5) * 16;
      y[i] = (Math.random() - 0.5) * 9;
      z[i] = Math.random() * 6 - 3;
      sp[i] = 0.5 + Math.random();
      ph[i] = Math.random() * 6.28;
    }
    return { x, y, z, sp, ph };
  }, [count]);

  const { geometry, material, texture } = useMemo(() => {
    const tex = makeSprite();
    const pos = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      map: tex,
      color: new THREE.Color(cfg.color),
      size: cfg.size,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: cfg.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    return { geometry: geo, material: mat, texture: tex };
  }, [count, cfg]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
    [geometry, material, texture],
  );

  useFrame((st, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = st.clock.elapsedTime;
    fade.current += ((leaving ? 0 : 1) - fade.current) * Math.min(1, dt * 1.6);
    const w = wind.current;
    const hw = viewport.width * 0.75;
    const hh = viewport.height * 0.7;
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < count; i += 1) {
      const zf = 0.55 + ((data.z[i] + 3) / 6) * 0.9;
      data.x[i] += (cfg.vx * data.sp[i] + w * cfg.windPush * zf + Math.sin(t * 0.4 + data.ph[i]) * 0.03) * dt;
      data.y[i] += (cfg.vy * data.sp[i] + Math.cos(t * 0.5 + data.ph[i]) * 0.02) * dt;
      if (data.x[i] > hw) data.x[i] = -hw;
      else if (data.x[i] < -hw) data.x[i] = hw;
      if (data.y[i] > hh) data.y[i] = -hh;
      else if (data.y[i] < -hh) data.y[i] = hh;
      pos[i * 3] = data.x[i];
      pos[i * 3 + 1] = data.y[i];
      pos[i * 3 + 2] = data.z[i];
    }
    geometry.attributes.position.needsUpdate = true;
    material.opacity = cfg.opacity * fade.current;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

function DriftField({ cfg, wind, leaving, scale }) {
  const { viewport } = useThree();
  const meshRef = useRef(null);
  const fade = useRef(0);
  const count = Math.max(3, Math.round(cfg.count * scale));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const geometry = useMemo(() => shapeGeometry(cfg.kind), [cfg.kind]);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  );

  const d = useMemo(() => {
    const arr = (fn) => Float32Array.from({ length: count }, fn);
    const colors = Array.from({ length: count }, (_, i) => new THREE.Color(cfg.colors[i % cfg.colors.length]));
    return {
      x: arr(() => (Math.random() - 0.5) * 14),
      y: arr(() => (Math.random() - 0.5) * 8),
      z: arr(() => Math.random() * 5 - 2.5),
      rx: arr(() => Math.random() * 6.28),
      ry: arr(() => Math.random() * 6.28),
      rz: arr(() => Math.random() * 6.28),
      srx: arr(() => (Math.random() - 0.5) * cfg.spin * 2),
      sry: arr(() => (Math.random() - 0.5) * cfg.spin * 2),
      srz: arr(() => (Math.random() - 0.5) * cfg.spin),
      sp: arr(() => 0.6 + Math.random() * 0.9),
      ph: arr(() => Math.random() * 6.28),
      fq: arr(() => 0.6 + Math.random() * 1.2),
      s: arr(() => cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0])),
      colors,
    };
  }, [count, cfg]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((st, dtRaw) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(dtRaw, 0.05);
    const t = st.clock.elapsedTime;
    fade.current += ((leaving ? 0 : 1) - fade.current) * Math.min(1, dt * 1.6);
    const w = wind.current;
    const hw = viewport.width * 0.7;
    const hh = viewport.height * 0.65;
    const f = fade.current;
    for (let i = 0; i < count; i += 1) {
      const zf = 0.55 + ((d.z[i] + 2.5) / 5) * 0.9;
      d.x[i] += (cfg.vx * d.sp[i] + w * cfg.windPush * zf) * dt;
      d.y[i] += (cfg.vy * d.sp[i] + Math.sin(t * d.fq[i] + d.ph[i]) * 0.18 * (0.3 + w)) * dt;
      const spinBoost = 0.6 + w * 2.2;
      d.rx[i] += d.srx[i] * dt * spinBoost;
      d.ry[i] += d.sry[i] * dt * spinBoost;
      d.rz[i] += d.srz[i] * dt * spinBoost;
      if (d.x[i] > hw) d.x[i] = -hw;
      else if (d.x[i] < -hw) d.x[i] = hw;
      if (d.y[i] > hh) d.y[i] = -hh;
      else if (d.y[i] < -hh) d.y[i] = hh;

      dummy.position.set(d.x[i], d.y[i], d.z[i]);
      dummy.rotation.set(d.rx[i], d.ry[i], d.rz[i]);
      const sc = d.s[i] * (0.25 + 0.75 * f);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const shade = 0.5 + 0.5 * Math.abs(Math.cos(d.rx[i]) * Math.cos(d.ry[i]));
      tmpColor.copy(d.colors[i]).multiplyScalar(shade);
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    material.opacity = cfg.opacity * f;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false} />;
}

function AtmosphereScene({ atmoKey, wind, pointer, scale }) {
  const smooth = useRef(0);
  const idRef = useRef(0);
  const [layers, setLayers] = useState([{ key: 0, atmo: atmoKey, leaving: false }]);

  useEffect(() => {
    setLayers((prev) => {
      if (prev.length && prev[prev.length - 1].atmo === atmoKey && !prev[prev.length - 1].leaving) {
        return prev;
      }
      idRef.current += 1;
      return [
        ...prev.map((l) => ({ ...l, leaving: true })),
        { key: idRef.current, atmo: atmoKey, leaving: false },
      ];
    });
    const t = setTimeout(() => setLayers((prev) => prev.filter((l) => !l.leaving)), 2600);
    return () => clearTimeout(t);
  }, [atmoKey]);

  return (
    <>
      <WindDriver target={wind} out={smooth} />
      <CameraRig pointer={pointer} />
      {layers.map((l) => {
        const cfg = ATMOS[l.atmo];
        if (!cfg) return null;
        return (
          <group key={l.key}>
            <MoteField cfg={cfg.motes} wind={smooth} leaving={l.leaving} scale={scale} />
            {cfg.drift && <DriftField cfg={cfg.drift} wind={smooth} leaving={l.leaving} scale={scale} />}
          </group>
        );
      })}
    </>
  );
}

class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    /* the 3D layer is optional; the game continues without it */
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Atmosphere3D({ atmoKey, wind, pointer }) {
  const scale = isSmallScreen() ? 0.55 : 1;
  return (
    <SafeBoundary>
      <Canvas
        className="ga-canvas"
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <AtmosphereScene atmoKey={atmoKey} wind={wind} pointer={pointer} scale={scale} />
      </Canvas>
    </SafeBoundary>
  );
}

/* ════════════════════════════════════════════════════════════════════
   8. CSS-DRIVEN EFFECTS (leaves, wind streaks, serpent bonds)
   ════════════════════════════════════════════════════════════════════ */
const LEAF_COLORS = ["#6d7a3a", "#8a8f3f", "#a1792f", "#7a5a2b", "#5a6b34", "#b08b3a", "#93703a"];
const LEAVES = Array.from({ length: 26 }, (_, i) => {
  const r = rng(i + 7);
  const late = i >= 15;
  const dur = 4.2 + r() * 5.5;
  return {
    id: i,
    late,
    color: LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)],
    style: {
      "--top": `${Math.round(r() * 92)}%`,
      "--size": `${(1.1 + r() * 2.2).toFixed(2)}vmin`,
      "--dur": `${dur.toFixed(2)}s`,
      "--delay": `${(-r() * dur).toFixed(2)}s`,
      "--dy": `${Math.round((r() - 0.35) * 40)}vh`,
      "--r0": `${Math.round(r() * 360)}deg`,
      "--tumble": `${(1.1 + r() * 1.8).toFixed(2)}s`,
    },
  };
});
const STREAKS = Array.from({ length: 9 }, (_, i) => {
  const r = rng(i + 41);
  const dur = 1.1 + r() * 1.5;
  return {
    id: i,
    style: {
      "--top": `${Math.round(8 + r() * 80)}%`,
      "--len": `${Math.round(18 + r() * 30)}vw`,
      "--dur": `${dur.toFixed(2)}s`,
      "--delay": `${(-r() * dur).toFixed(2)}s`,
    },
  };
});

function WindLeaves({ active }) {
  return (
    <div className={`ga-leaves${active ? " is-on" : ""}`} aria-hidden="true">
      <div className="ga-haze" />
      {STREAKS.map((s) => (
        <span key={s.id} className="ga-streak" style={s.style} />
      ))}
      {LEAVES.map((l) => (
        <span key={l.id} className={`ga-leaf${l.late ? " ga-leaf--late" : ""}`} style={l.style}>
          <span className="ga-leaf-inner">
            <svg viewBox="0 0 40 60" focusable="false">
              <path d="M20 2 C34 14 36 40 20 58 C4 40 6 14 20 2 Z" fill={l.color} />
              <path d="M20 8 L20 54" stroke="rgba(0,0,0,0.28)" strokeWidth="1.2" fill="none" />
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
}

const BOND_PATHS = [
  "M520 640 C640 560 760 720 880 640 S1060 580 1120 650",
  "M560 700 C680 640 780 770 900 700 S1040 660 1090 720",
  "M600 590 C700 540 800 640 900 590 S1020 560 1060 610",
  "M480 690 C600 760 720 640 840 720 S1000 770 1130 700",
  "M640 760 C720 700 820 790 920 740 S1010 720 1050 760",
  "M540 620 C640 690 740 560 860 620 S1000 690 1100 600",
];

function BondOverlay({ released }) {
  return (
    <motion.div
      className="ga-bonds"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.2 } }}
      transition={{ duration: 1.4 }}
    >
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ga-bond-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5f8f74" />
            <stop offset="55%" stopColor="#a3b57a" />
            <stop offset="100%" stopColor="#d6b560" />
          </linearGradient>
          <filter id="ga-bond-glow" x="-20%" y="-30%" width="140%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#ga-bond-glow)" fill="none" stroke="url(#ga-bond-grad)" strokeLinecap="round">
          {BOND_PATHS.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              strokeWidth={i % 2 ? 3.5 : 5}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                released
                  ? { pathLength: 0, opacity: 0 }
                  : { pathLength: 1, opacity: [0.22, 0.52, 0.22] }
              }
              transition={
                released
                  ? { duration: 2.4, delay: i * 0.14, ease: [0.5, 0, 0.2, 1] }
                  : {
                      pathLength: { duration: 1.8, delay: i * 0.2 },
                      opacity: { duration: 3.2 + i * 0.35, repeat: Infinity, ease: "easeInOut" },
                    }
              }
            />
          ))}
        </g>
      </svg>
      {released && (
        <>
          <div className="ga-mist" />
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="ga-ripple"
              initial={{ scale: 0.1, opacity: 0.7 }}
              animate={{ scale: 3.4, opacity: 0 }}
              transition={{ duration: 2.6, delay: 0.15 + i * 0.5, ease: "easeOut" }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   9. BACKDROP (cinematic camera + cross-fade)
   ════════════════════════════════════════════════════════════════════ */
const XFADE = 1.6;

function Backdrop({ stageIdx, released, reduced, shake }) {
  const s = STAGES[stageIdx];
  const cam = s.camera;
  const target = released && cam.release ? cam.release : cam.to;
  const duration = reduced ? 0 : released ? 3.4 : cam.dur;
  return (
    <motion.div
      className="ga-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1, transition: { duration: XFADE } }}
      transition={{ duration: XFADE, ease: "easeInOut" }}
    >
      <div className={`ga-shake ga-shake-${shake}`}>
        <img className="ga-bg-fill" src={s.image} alt="" draggable={false} aria-hidden="true" />
        <motion.img
          className="ga-bg-img"
          src={s.image}
          alt=""
          draggable={false}
          initial={cam.from}
          animate={target}
          transition={{ duration, ease: released ? [0.45, 0, 0.2, 1] : "linear" }}
          style={{ filter: s.grade }}
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   10. DIALOGUE PANEL
   ════════════════════════════════════════════════════════════════════ */
function Medallion({ speaker }) {
  return (
    <span className="ga-medal" style={{ "--accent": speaker.accent }}>
      {speaker.glyph ? <span className="ga-medal-glyph">{speaker.glyph}</span> : <ScrollText size={18} strokeWidth={1.6} />}
    </span>
  );
}

function DialoguePanel({ speakerId, lineKey, tw, onAdvance, action, actionLabel, isNarrator }) {
  const sp = SPEAKERS[speakerId];
  return (
    <motion.div
      className={`ga-panel ${isNarrator ? "is-narrator" : "is-speaker"}`}
      style={{ "--accent": sp.accent }}
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 14, transition: { duration: 1.3, ease: "easeInOut" } }}
      transition={{ duration: 0.95, ease: [0.22, 0.8, 0.24, 1] }}
      onClick={onAdvance}
      role="group"
      aria-label="Dialogue"
    >
      <span className="ga-corner ga-corner--tl" />
      <span className="ga-corner ga-corner--tr" />
      <span className="ga-corner ga-corner--bl" />
      <span className="ga-corner ga-corner--br" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={speakerId}
          className="ga-nameplate"
          initial={{ opacity: 0, y: 8, x: -6 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Medallion speaker={sp} />
          <span className="ga-name">{sp.name}</span>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={lineKey}
          className="ga-line"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.3 }}
          aria-live="polite"
        >
          <span className="ga-shown">{tw.shown}</span>
          <span className="ga-rest" aria-hidden="true">
            {tw.rest}
          </span>
        </motion.p>
      </AnimatePresence>

      <div className="ga-actions">
        <AnimatePresence>
          {tw.done && action === "none" && (
            <motion.span
              key="pip"
              className="ga-pip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 3, 0] }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.4 }, y: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }}
              aria-hidden="true"
            />
          )}
          {tw.done && action === "chevron" && (
            <motion.button
              key="next"
              type="button"
              className="ga-next"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={(e) => {
                e.stopPropagation();
                onAdvance();
              }}
            >
              <span>Continue</span>
              <ChevronRight size={16} strokeWidth={1.8} />
            </motion.button>
          )}
          {tw.done && action === "primary" && (
            <motion.button
              key="primary"
              type="button"
              className="ga-primary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={(e) => {
                e.stopPropagation();
                onAdvance();
              }}
            >
              {actionLabel}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   11. MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════ */
export default function GarudaArrivalGame({ onComplete, onExit }) {
  const [stage, setStage] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading | play | ending
  const [dialogueOn, setDialogueOn] = useState(false);
  const [titleOn, setTitleOn] = useState(false);
  const [released, setReleased] = useState(false);
  const [muted, setMuted] = useState(false);
  const [windLevel, setWindLevel] = useState(0);
  const [finaleStep, setFinaleStep] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const [reduced] = useState(prefersReducedMotion);

  const dirRef = useRef(null);
  const windRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const preloadRef = useRef([]);
  const lockUntilRef = useRef(0);
  const lineDoneAtRef = useRef(0);
  const releasedRef = useRef(false);
  const completedRef = useRef(false);
  const exitedRef = useRef(false);
  const miscTimers = useRef([]);
  const advanceRef = useRef(noop);
  const exitRef = useRef(noop);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 46, damping: 18, mass: 0.9 });
  const spy = useSpring(py, { stiffness: 46, damping: 18, mass: 0.9 });
  const bgX = useTransform(spx, [-1, 1], [14, -14]);
  const bgY = useTransform(spy, [-1, 1], [9, -9]);
  const rotY = useTransform(spx, [-1, 1], [-1.1, 1.1]);
  const rotX = useTransform(spy, [-1, 1], [0.8, -0.8]);
  const fgX = useTransform(spx, [-1, 1], [-26, 26]);
  const fgY = useTransform(spy, [-1, 1], [-14, 14]);

  const cfg = STAGES[stage];
  const line = cfg.lines[Math.min(lineIdx, cfg.lines.length - 1)];
  const isNarrator = line.who === "narrator";
  const lineKey = `${stage}-${lineIdx}`;
  const fullText = isNarrator ? line.text : `“${line.text}”`;
  const tw = useTypewriter(fullText, lineKey, dialogueOn && phase === "play");
  const lineDone = dialogueOn && tw.done;
  const isLast = lineIdx >= cfg.lines.length - 1;

  /* ── audio director lifecycle ───────────────────────────── */
  useEffect(() => {
    const d = new AudioDirector();
    dirRef.current = d;
    return () => {
      d.dispose();
      dirRef.current = null;
      miscTimers.current.forEach(clearTimeout);
      miscTimers.current = [];
    };
  }, []);

  useEffect(() => {
    if (dirRef.current) dirRef.current.setMuted(muted);
  }, [muted]);

  /* ── preload all six images ─────────────────────────────── */
  useEffect(() => {
    let alive = true;
    const failSafe = setTimeout(() => {
      if (alive) setImagesReady(true);
    }, 7000);
    const imgs = IMAGES.map((src, i) => {
      const im = new Image();
      im.decoding = "async";
      const done = () => {
        if (alive && i === 0) setImagesReady(true);
      };
      im.onload = done;
      im.onerror = done;
      im.src = src;
      return im;
    });
    preloadRef.current = imgs;
    return () => {
      alive = false;
      clearTimeout(failSafe);
      imgs.forEach((im) => {
        im.onload = null;
        im.onerror = null;
      });
    };
  }, []);

  useEffect(() => {
    if (!imagesReady || phase !== "loading") return undefined;
    const t = setTimeout(() => setPhase("play"), 900);
    return () => clearTimeout(t);
  }, [imagesReady, phase]);

  /* ── pointer parallax ───────────────────────────────────── */
  useEffect(() => {
    if (reduced) return undefined;
    const move = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      px.set(x);
      py.set(y);
      pointerRef.current = { x, y: -y };
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduced, px, py]);

  /* ── stage start: title card, then dialogue ─────────────── */
  useEffect(() => {
    if (phase !== "play") return undefined;
    const c = STAGES[stage];
    const t1 = setTimeout(() => setTitleOn(true), 600);
    const t2 = setTimeout(() => setTitleOn(false), 600 + 3400);
    const t3 = setTimeout(() => setDialogueOn(true), c.dialogueDelay);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [stage, phase]);

  /* ── audio cues per stage ───────────────────────────────── */
  useEffect(() => {
    const d = dirRef.current;
    if (!d || phase === "loading") return undefined;
    const timers = [];
    const at = (fn, ms) => timers.push(setTimeout(fn, ms));

    if (phase === "ending") {
      d.level("celebration", 0.45, 4);
      return () => timers.forEach(clearTimeout);
    }
    if (stage === 0) {
      d.start("battlefield", { level: 1, fadeIn: 3 });
      setWindLevel(0);
    } else if (stage === 1) {
      d.stop("battlefield", 2.8);
      setWindLevel(0.28);
    } else if (stage === 2) {
      d.once("cry", { level: 1 });
      setFlashKey((k) => k + 1);
      setWindLevel(0.75);
      at(() => setWindLevel(0.5), 1400);
      at(() => setWindLevel(0.3), 3400);
      at(() => setWindLevel(0.12), 5800);
      at(() => setWindLevel(0), 8200);
    } else if (stage === 3) {
      setWindLevel(0);
    } else if (stage === 4) {
      d.start("celebration", { level: 0.9, fadeIn: 5 });
    } else if (stage === 5) {
      d.level("celebration", 0.6, 3);
    }
    return () => timers.forEach(clearTimeout);
  }, [stage, phase]);

  /* ── wind: visuals + audio follow one level ─────────────── */
  useEffect(() => {
    windRef.current = windLevel;
    const d = dirRef.current;
    if (d && phase !== "loading") d.level("wind", windLevel, 1.8);
  }, [windLevel, phase]);

  useEffect(() => {
    if (stage !== 1 || phase !== "play") return;
    setWindLevel([0.34, 0.62, 0.86][lineIdx] ?? 0.86);
  }, [stage, lineIdx, phase]);

  useEffect(() => {
    if (stage === 1 && phase === "play" && lineDone && isLast) setWindLevel(1);
  }, [stage, phase, lineDone, isLast]);

  useEffect(() => {
    if (lineDone) lineDoneAtRef.current = performance.now();
  }, [lineDone, lineKey]);

  /* ── navigation helpers ─────────────────────────────────── */
  const goToStage = useCallback((n) => {
    if (n >= STAGES.length) return;
    lockUntilRef.current = performance.now() + (n === 2 ? 3200 : 900);
    setDialogueOn(false);
    setTitleOn(false);
    setLineIdx(0);
    setStage(n);
  }, []);

  const startEnding = useCallback(() => {
    setDialogueOn(false);
    setFinaleStep(0);
    setPhase("ending");
  }, []);

  /* ── auto-advance for atmospheric stages ────────────────── */
  useEffect(() => {
    if (phase !== "play" || !dialogueOn || !lineDone) return undefined;
    const autoMode = cfg.mode === "auto";
    const timedEnd = cfg.endAction === "timed" && isLast;
    if (!autoMode && !timedEnd) return undefined;
    const hold = isLast
      ? cfg.pauseAfter
      : clamp(1200 + fullText.length * 14, 1600, 3800);
    const t = setTimeout(() => {
      if (isLast) goToStage(stage + 1);
      else setLineIdx((i) => i + 1);
    }, hold);
    return () => clearTimeout(t);
  }, [phase, dialogueOn, lineDone, lineKey, cfg, isLast, stage, fullText.length, goToStage]);

  /* ── finale sequencing ──────────────────────────────────── */
  useEffect(() => {
    if (phase !== "ending") return undefined;
    const t1 = setTimeout(() => setFinaleStep(1), 2000);
    const t2 = setTimeout(() => setFinaleStep(2), 4200);
    const t3 = setTimeout(() => setFinaleStep(3), 6600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase]);

  /* ── user actions ───────────────────────────────────────── */
  const handleAdvance = () => {
    if (phase !== "play" || !dialogueOn) return;
    const now = performance.now();
    if (now < lockUntilRef.current) return;
    if (!tw.done) {
      tw.complete();
      return;
    }
    if (now - lineDoneAtRef.current < 320) return;
    if (!isLast) {
      setLineIdx((i) => i + 1);
      return;
    }
    switch (cfg.endAction) {
      case "continue":
      case "auto":
      case "timed":
        goToStage(stage + 1);
        break;
      case "finale":
        startEnding();
        break;
      default:
        break; // "release": only the RELEASE THE BONDS button may continue
    }
  };
  advanceRef.current = handleAdvance;

  const handleRelease = () => {
    if (releasedRef.current || stage !== 3 || phase !== "play") return;
    releasedRef.current = true;
    setReleased(true);
    lockUntilRef.current = performance.now() + 8000;
    if (dirRef.current) dirRef.current.once("release", { level: 1 });
    miscTimers.current.push(setTimeout(() => goToStage(4), 3800));
  };

  const handleReturn = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (dirRef.current) dirRef.current.stopAll(0.6);
    if (onComplete) onComplete();
  };

  const handleExit = () => {
    if (exitedRef.current || completedRef.current) return;
    exitedRef.current = true;
    if (dirRef.current) dirRef.current.stopAll(0.4);
    if (onExit) onExit();
  };
  exitRef.current = handleExit;

  /* ── keyboard ───────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        exitRef.current();
        return;
      }
      if (e.key === "m" || e.key === "M") {
        setMuted((m) => !m);
        return;
      }
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        const t = e.target;
        if (t && t.closest && t.closest("button")) return; // focused buttons act natively
        e.preventDefault();
        if (!e.repeat) advanceRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── derived presentation values ────────────────────────── */
  const atmoKey = stage === 3 && released ? "s3r" : `s${stage}`;
  const shake = stage === 1 ? (windLevel > 0.85 ? 3 : windLevel > 0.6 ? 2 : 1) : stage === 2 && windLevel > 0.25 ? 1 : 0;
  const showPanel = phase === "play" && dialogueOn && !(stage === 3 && released);
  const showRelease = phase === "play" && stage === 3 && (lineDone || released);
  const showRays = stage === 2 || stage === 4 || stage === 5;

  let panelAction = "none";
  let actionLabel = "CONTINUE";
  if (cfg.mode === "auto") panelAction = "none";
  else if (!isLast) panelAction = "chevron";
  else if (cfg.endAction === "continue" || cfg.endAction === "finale") panelAction = "primary";
  else if (cfg.endAction === "timed") panelAction = "chevron";

  return (
    <div
      className={[
        "ga-root",
        `ga-stage-${stage}`,
        phase !== "loading" ? "is-playing" : "",
        stage === 2 ? "is-wide" : "",
        phase === "ending" ? "is-ending" : "",
      ].join(" ")}
      style={{ "--wind": windLevel }}
      role="dialog"
      aria-label="The Arrival of Garuda"
    >
      {/* ── world ── */}
      <div className="ga-world">
        <motion.div className="ga-parallax" style={reduced ? undefined : { x: bgX, y: bgY, rotateX: rotX, rotateY: rotY }}>
          <AnimatePresence>
            <Backdrop key={stage} stageIdx={stage} released={released && stage === 3} reduced={reduced} shake={shake} />
          </AnimatePresence>
        </motion.div>

        <motion.div className="ga-tint" animate={{ backgroundColor: cfg.tint }} transition={{ duration: 2.2 }} />
        <div className={`ga-rays${showRays ? " is-on" : ""}`} />

        {ENABLE_3D && !reduced && (
          <motion.div className="ga-layer" style={{ x: fgX, y: fgY }}>
            <Atmosphere3D atmoKey={atmoKey} wind={windRef} pointer={pointerRef} />
          </motion.div>
        )}

        <WindLeaves active={(stage === 1 || stage === 2) && !reduced} />

        <AnimatePresence>{stage === 3 && <BondOverlay key="bonds" released={released} />}</AnimatePresence>

        {flashKey > 0 && (
          <motion.div
            key={flashKey}
            className="ga-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.42, 0] }}
            transition={{ duration: 2.4, times: [0, 0.1, 1], ease: "easeOut" }}
          />
        )}

        <div className="ga-vignette" />
        <div className="ga-grain" />
      </div>

      <div className="ga-bar ga-bar--top" />
      <div className="ga-bar ga-bar--bottom" />

      {/* ── top controls ── */}
      <div className="ga-topbar">
        <button type="button" className="ga-chip ga-chip--exit" onClick={handleExit} aria-label="Leave the scene (Esc)">
          <LogOut size={15} strokeWidth={1.8} />
          <span>Esc</span>
        </button>

        <div className="ga-progress" aria-label={`Scene ${stage + 1} of ${STAGES.length}`}>
          {STAGES.map((s, i) => (
            <span key={s.id} className={`ga-dot${i < stage ? " is-done" : ""}${i === stage ? " is-now" : ""}`} />
          ))}
        </div>

        <button
          type="button"
          className="ga-chip ga-chip--sound"
          onClick={() => setMuted((m) => !m)}
          aria-pressed={!muted}
          aria-label={muted ? "Turn sound on (M)" : "Turn sound off (M)"}
        >
          {muted ? <VolumeX size={17} strokeWidth={1.8} /> : <Volume2 size={17} strokeWidth={1.8} />}
        </button>
      </div>

      {/* ── stage title card ── */}
      <AnimatePresence>
        {titleOn && phase === "play" && (
          <motion.div
            key={`title-${stage}`}
            className="ga-title"
            initial={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 1 } }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          >
            <span className="ga-title-dev" lang="hi">
              {cfg.sanskrit}
            </span>
            <span className="ga-title-rule">
              <i />
              <b />
              <i />
            </span>
            <span className="ga-title-en">{cfg.title}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── dialogue ── */}
      <div className="ga-dock">
        <AnimatePresence>
          {showPanel && (
            <DialoguePanel
              key="panel"
              speakerId={line.who}
              lineKey={lineKey}
              tw={tw}
              onAdvance={handleAdvance}
              action={panelAction}
              actionLabel={actionLabel}
              isNarrator={isNarrator}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── the main interaction ── */}
      <AnimatePresence>
        {showRelease && stage === 3 && (
          <motion.div
            key="release"
            className="ga-release-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={released ? { opacity: 0, y: -10, scale: 1.018 } : { opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            transition={{ duration: released ? 1.1 : 0.9, ease: "easeOut" }}
          >
            <button type="button" className="ga-release" onClick={handleRelease} disabled={released}>
              <span className="ga-release-ring" aria-hidden="true" />
              <span className="ga-release-text">RELEASE THE BONDS</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── finale ── */}
      <AnimatePresence>
        {phase === "ending" && (
          <motion.div
            key="finale"
            className="ga-finale"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
          >
            <div className="ga-finale-inner">
              <AnimatePresence>
                {finaleStep >= 1 && (
                  <motion.h2
                    key="f1"
                    className="ga-final-1"
                    initial={{ opacity: 0, letterSpacing: "0.5em", filter: "blur(8px)" }}
                    animate={{ opacity: 1, letterSpacing: "0.16em", filter: "blur(0px)" }}
                    transition={{ duration: 2.4, ease: [0.22, 0.8, 0.24, 1] }}
                  >
                    {FINAL_LINES[0]}
                  </motion.h2>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {finaleStep >= 2 && (
                  <motion.div
                    key="f2"
                    className="ga-final-rule"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 1.4 }}
                  >
                    <i />
                    <b />
                    <i />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {finaleStep >= 2 && (
                  <motion.h2
                    key="f3"
                    className="ga-final-2"
                    initial={{ opacity: 0, letterSpacing: "0.5em", filter: "blur(8px)" }}
                    animate={{ opacity: 1, letterSpacing: "0.2em", filter: "blur(0px)" }}
                    transition={{ duration: 2.6, delay: 0.3, ease: [0.22, 0.8, 0.24, 1] }}
                  >
                    {FINAL_LINES[1]}
                  </motion.h2>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {finaleStep >= 3 && (
                  <motion.button
                    key="f4"
                    type="button"
                    className="ga-return"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    onClick={handleReturn}
                  >
                    RETURN TO CHAPTER
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── opening veil ── */}
      <AnimatePresence>
        {phase === "loading" && (
          <motion.div
            key="veil"
            className="ga-veil"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 2, ease: "easeInOut" } }}
          >
            <span className="ga-veil-dev" lang="hi">
              गरुड़ का आगमन
            </span>
            <span className="ga-title-rule">
              <i />
              <b />
              <i />
            </span>
            <span className="ga-veil-en">The Arrival of Garuda</span>
            <span className="ga-spinner" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}