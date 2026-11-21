/**
 * THE PRINCE WHO STEPPED FORWARD  —  ANCESTRA · Chapter XVII · Yuddha Kanda
 *
 * A cinematic dialogue between Ravana and Indrajit (Meghnad).
 * No questions, no choices, no scoring: the player simply experiences the scene.
 *
 * Props
 *   onComplete()  called when the player presses "RETURN TO THE CHAPTER"
 *                 (falls back to onExit if onComplete is not supplied)
 *   onExit()      optional; shows a small close button when supplied
 *
 * Zero extra dependencies. All depth/parallax is CSS 3D + a small canvas particle
 * field. Audio is fully optional: if the files in AUDIO_SRC are missing, a quiet
 * synthesized palace ambience, footsteps and cloth movement are generated with the
 * Web Audio API instead. If even that is unavailable, the game runs silently.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './IndrajitPromiseGame.css';

/* ────────────────────────────────────────────────────────────────────────── */
/*  DATA                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

const IMG_BASE = '/images/ramayana/interactions/';

/** Optional audio files. Missing files are fine – synthesized fallbacks play instead. */
const AUDIO_SRC = {
  ambience: '/audio/ramayana/palace-ambience.mp3',
  footsteps: '/audio/ramayana/footsteps.mp3',
  cloth: '/audio/ramayana/cloth.mp3',
};

const TITLE = {
  label: 'YUDDHA KANDA',
  main: 'THE PRINCE WHO STEPPED FORWARD',
  sub: "A SON'S PROMISE. A KING'S BLESSING.",
  narration:
    'Kumbhakarna has fallen. The golden city of Lanka stands beneath the shadow of grief. Its king has lost one of his greatest warriors. But from within the royal court, another warrior rises to take his place.',
};

const FINAL = {
  title: 'THE PRINCE HAS STEPPED FORWARD',
  sub: "Indrajit's promise has been made.",
  button: 'RETURN TO THE CHAPTER',
};

const SPEAKERS = {
  ravana: { name: 'Ravana', epithet: 'King of Lanka' },
  indrajit: { name: 'Indrajit', epithet: 'Meghnad, Prince of Lanka' },
};

/** Particle moods: density 0–1.2, rise (+ up / − drifting down like ash), warmth 0 (ash) – 1 (gold). */
const TITLE_MOOD = { density: 1, rise: 0.8, warmth: 0.8 };
const END_MOOD = { density: 0.9, rise: 0.7, warmth: 0.85 };

const N = (text, extra = {}) => ({ type: 'narration', text, ...extra });
const D = (speaker, text, extra = {}) => ({ type: 'dialogue', speaker, text, ...extra });

const SCENES = [
  {
    id: 'silence',
    numeral: 'I',
    title: 'The Silence of Lanka',
    image: 'ch17g11.jpg',
    focus: '50% 38%',
    cam: { s0: 1.03, s1: 1.12, x0: 0, y0: 0.8, x1: 0, y1: -0.8 },
    grade: 'rgba(52,64,98,.55)',
    mood: { density: 0.5, rise: -0.25, warmth: 0.15 },
    lines: [
      N(
        "The royal court of Lanka is silent. Ravana sits upon his golden throne, carrying the weight of Kumbhakarna's fall. The warriors assembled before him await their king's next command.",
        { startDelay: 2300, pauseAfter: 2400 }
      ),
    ],
  },
  {
    id: 'enters',
    numeral: 'II',
    title: 'The Prince Enters',
    image: 'ch17g12.jpg',
    focus: '50% 38%',
    cam: { s0: 1.1, s1: 1.04, x0: 1.5, y0: 0, x1: -1.2, y1: 0.4 },
    grade: 'rgba(140,92,40,.38)',
    mood: { density: 0.7, rise: 0.3, warmth: 0.5 },
    lines: [
      N(
        'Through the enormous doors of the royal court, Indrajit enters. The prince approaches his father with measured steps. He has already made his decision.',
        { sfx: 'footsteps', sfxDelay: 500 }
      ),
      D('indrajit', 'Father.', { pauseAfter: 1000 }),
      D('ravana', 'Meghnad...', { pauseAfter: 1900 }),
    ],
  },
  {
    id: 'before',
    numeral: 'III',
    title: 'A Son Before His Father',
    image: 'ch17g13.jpg',
    focus: '50% 36%',
    cam: { s0: 1.04, s1: 1.12, x0: -1, y0: 0, x1: 1, y1: 0 },
    grade: 'rgba(130,86,40,.38)',
    mood: { density: 0.7, rise: 0.5, warmth: 0.6 },
    lines: [
      D(
        'indrajit',
        'Do not let grief weaken your heart, Father. Kumbhakarna fought with all his strength. His courage shall never be forgotten.'
      ),
      D(
        'ravana',
        'He was more than a warrior to me, Meghnad. He was my brother. Lanka has lost one of its mightiest protectors.'
      ),
      D('indrajit', 'I know, Father. And I know what his fall means for Lanka.'),
    ],
  },
  {
    id: 'concern',
    numeral: 'IV',
    title: "A Father's Concern",
    image: 'ch17g14.jpg',
    focus: '50% 36%',
    cam: { s0: 1.12, s1: 1.05, x0: 0, y0: -0.8, x1: 0, y1: 0.8 },
    grade: 'rgba(86,56,46,.5)',
    mood: { density: 0.6, rise: 0.15, warmth: 0.35 },
    lines: [
      D(
        'ravana',
        'The battlefield has taken much from us. I have already watched my brother march into battle and never return.'
      ),
      D('ravana', 'I will not pretend that I do not fear what may come next.', { pauseAfter: 1100 }),
      D('indrajit', 'Father, I have not come before you to speak of fear.'),
      D('ravana', 'Then tell me, Meghnad. Why have you come?', { pauseAfter: 1100 }),
    ],
  },
  {
    id: 'assurance',
    numeral: 'V',
    title: "The Prince's Assurance",
    image: 'ch17g15.jpg',
    focus: '50% 36%',
    cam: { s0: 1.05, s1: 1.14, x0: 1, y0: 0, x1: -1, y1: 0 },
    grade: 'rgba(160,98,36,.4)',
    mood: { density: 0.9, rise: 0.7, warmth: 0.7 },
    lines: [
      D('indrajit', 'I have come to take my place upon the battlefield.', { pauseAfter: 1100 }),
      D(
        'ravana',
        "You understand the strength of Rama's army. You have seen what has happened to our greatest warriors."
      ),
      D(
        'indrajit',
        'I have seen it. But Lanka still stands, Father. Its warriors still stand. And I shall lead them.'
      ),
      D(
        'indrajit',
        "Let the burden of this battle rest upon me. I shall face Rama's forces and fight for Lanka."
      ),
      D('ravana', 'You are my son, Meghnad. You are also the greatest warrior I have left.', {
        pauseAfter: 1100,
      }),
      D('indrajit', 'Then allow me to prove worthy of that trust.'),
    ],
  },
  {
    id: 'blessing',
    numeral: 'VI',
    title: "A Father's Blessing",
    image: 'ch17g16.jpg',
    focus: '50% 36%',
    cam: { s0: 1.06, s1: 1.16, x0: 0, y0: 1, x1: 0, y1: -0.5 },
    grade: 'rgba(238,176,72,.5)',
    mood: { density: 1.15, rise: 1, warmth: 1 },
    lines: [
      N("Ravana rises from his throne and places his hand upon Indrajit's shoulder.", {
        sfx: 'cloth',
        sfxDelay: 400,
        pauseAfter: 1300,
      }),
      D('ravana', 'May your strength never abandon you, my son.', { pauseAfter: 1100 }),
      D(
        'ravana',
        'Go, Meghnad. Lanka shall remember the courage with which you stood before me today.'
      ),
      D('indrajit', 'I shall not forget your words, Father.'),
      D('indrajit', 'I will return with victory.', { pauseAfter: 1100 }),
      D('ravana', 'May victory be yours.', { pauseAfter: 2700 }),
    ],
  },
  {
    id: 'departs',
    numeral: 'VII',
    title: 'The Prince Departs',
    image: 'ch17g17.jpg',
    focus: '50% 38%',
    cam: { s0: 1.12, s1: 1.04, x0: -1.5, y0: 0, x1: 1.5, y1: 0 },
    grade: 'rgba(196,112,52,.42)',
    mood: { density: 0.9, rise: 0.6, warmth: 0.6 },
    lines: [
      N(
        'Indrajit bows before his father. With his promise given and his father\u2019s blessing received, he turns towards the palace doors.',
        { pauseAfter: 1300 }
      ),
      N(
        'Behind him remains a king who watches with pride and concern. Ahead lies a battlefield that awaits Lanka\u2019s prince.',
        { pauseAfter: 2000 }
      ),
    ],
  },
];

/** Flat list of every dialogue step, so progression is one reliable integer. */
const STEPS = SCENES.flatMap((scene, sceneIndex) =>
  scene.lines.map((line, lineIndex) => ({
    ...line,
    sceneIndex,
    lineIndex,
    isFirst: lineIndex === 0,
    pauseAfter: line.pauseAfter ?? (line.type === 'narration' ? 1100 : 800),
    startDelay: line.startDelay ?? (lineIndex === 0 ? 1000 : 180),
  }))
);

/* ────────────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Natural, slightly irregular typing rhythm with weight on punctuation. */
function charDelay(ch, next, type) {
  if (ch === '.') return next === '.' ? 170 : next === undefined || next === ' ' ? 420 : 40;
  if (ch === '!' || ch === '?') return 400;
  if (ch === ',' || ch === ';' || ch === ':') return 190;
  if (ch === '\u2014' || ch === '\u2013') return 220;
  const base = type === 'narration' ? 22 : 30;
  return base + Math.random() * 20;
}

function Words({ text, start = 0, step = 0.1 }) {
  const words = text.split(' ');
  return words.map((w, i) => (
    <React.Fragment key={i}>
      <span className="ipg-w" style={{ animationDelay: `${(start + i * step).toFixed(2)}s` }}>
        {w}
      </span>
      {i < words.length - 1 ? ' ' : null}
    </React.Fragment>
  ));
}

const IconVolume = ({ muted }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    {muted ? (
      <>
        <path d="m16 9 5 6" />
        <path d="m21 9-5 6" />
      </>
    ) : (
      <>
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    )}
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const IconChevron = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 5 7 7-7 7" />
  </svg>
);

/* ────────────────────────────────────────────────────────────────────────── */
/*  AUDIO (optional – never a hard dependency)                                */
/* ────────────────────────────────────────────────────────────────────────── */

function createAudioEngine() {
  const AC = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
  let ctx = null;
  let master = null;
  let muted = false;
  let destroyed = false;
  let started = false;
  let stopDrone = null;
  const timers = new Set();
  const files = new Set();

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!destroyed) fn();
    }, ms);
    timers.add(id);
    return id;
  };

  const ensure = () => {
    if (ctx || !AC || destroyed) return ctx;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  };

  const noiseBuffer = (seconds, brown) => {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i += 1) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = w;
    }
    return buf;
  };

  /** Soft palace air + a barely-there tanpura-style drone. */
  const startSynthAmbience = () => {
    if (!ensure() || stopDrone) return;
    const t0 = ctx.currentTime;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, t0);
    bus.gain.linearRampToValueAtTime(1, t0 + 5);
    bus.connect(master);

    const air = ctx.createBufferSource();
    air.buffer = noiseBuffer(4, true);
    air.loop = true;
    const airLp = ctx.createBiquadFilter();
    airLp.type = 'lowpass';
    airLp.frequency.value = 380;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.05;
    air.connect(airLp);
    airLp.connect(airGain);
    airGain.connect(bus);
    air.start();

    const pads = [146.83, 220].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i ? 0.012 : 0.02;
      o.connect(g);
      g.connect(bus);
      o.start();
      return o;
    });

    const seq = [220, 293.66, 293.66, 73.42];
    let n = 0;
    let live = true;
    const pluck = () => {
      if (!live || !ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = seq[n % seq.length];
      n += 1;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1700, t);
      lp.frequency.exponentialRampToValueAtTime(360, t + 2.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
      o.connect(lp);
      lp.connect(g);
      g.connect(bus);
      o.start(t);
      o.stop(t + 3.5);
      later(pluck, 1250);
    };
    pluck();

    stopDrone = () => {
      live = false;
      if (!ctx) return;
      const t = ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + 0.6);
      [air, ...pads].forEach((node) => {
        try {
          node.stop(t + 0.7);
        } catch (e) {
          /* already stopped */
        }
      });
    };
  };

  const synthStep = (vol) => {
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.25, false);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5 * vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + 0.25);

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(86, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.15);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.linearRampToValueAtTime(0.35 * vol, t + 0.008);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(og);
    og.connect(master);
    o.start(t);
    o.stop(t + 0.2);
  };

  const synthFootsteps = () => {
    if (!ensure()) return;
    let at = 0;
    for (let i = 0; i < 7; i += 1) {
      const vol = 0.35 + i * 0.07;
      later(() => synthStep(vol), at);
      at += 560 - i * 20 + Math.random() * 40;
    }
  };

  const synthCloth = () => {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(1.4, false);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.linearRampToValueAtTime(2400, t + 0.7);
    bp.frequency.linearRampToValueAtTime(1300, t + 1.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + 1.3);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + 1.4);
  };

  const playFile = (src, volume, fallback, loop = false) => {
    let fell = false;
    const fb = () => {
      if (!fell) {
        fell = true;
        if (fallback) fallback();
      }
    };
    try {
      const a = new Audio(src);
      a.volume = volume;
      a.muted = muted;
      a.loop = loop;
      files.add(a);
      a.addEventListener('error', fb);
      a.addEventListener('ended', () => files.delete(a));
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(fb);
    } catch (e) {
      fb();
    }
  };

  return {
    start() {
      if (started || destroyed) return;
      started = true;
      ensure();
      if (ctx && ctx.state === 'suspended' && ctx.resume) ctx.resume();
      playFile(AUDIO_SRC.ambience, 0.3, startSynthAmbience, true);
    },
    sfx(name) {
      if (destroyed || !started) return;
      if (name === 'footsteps') playFile(AUDIO_SRC.footsteps, 0.5, synthFootsteps);
      if (name === 'cloth') playFile(AUDIO_SRC.cloth, 0.5, synthCloth);
    },
    setMuted(m) {
      muted = m;
      files.forEach((a) => {
        a.muted = m;
      });
      if (master && ctx) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.08);
      }
    },
    destroy() {
      destroyed = true;
      timers.forEach(clearTimeout);
      timers.clear();
      if (stopDrone) stopDrone();
      files.forEach((a) => {
        try {
          a.pause();
        } catch (e) {
          /* ignore */
        }
      });
      files.clear();
      try {
        if (ctx) ctx.close();
      } catch (e) {
        /* ignore */
      }
      ctx = null;
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  EMBER FIELD – depth-sorted particles that react to the camera parallax    */
/* ────────────────────────────────────────────────────────────────────────── */

function EmberField({ mood, pointer, className = '' }) {
  const canvasRef = useRef(null);
  const moodRef = useRef(mood);
  moodRef.current = mood;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    const count = window.innerWidth < 700 ? 34 : 66;
    const cur = { ...moodRef.current };

    const make = (initial) => ({
      x: Math.random(),
      y: initial ? Math.random() : 1.05,
      z: Math.random(),
      r: 0.6 + Math.random() * 1.7,
      vx: (Math.random() - 0.5) * 0.01,
      vy: 0.035 + Math.random() * 0.085,
      ph: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 0.9,
    });
    const parts = Array.from({ length: count }, () => make(true));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden || !w || !h) return;

      const m = moodRef.current;
      const k = Math.min(1, dt * 1.4);
      cur.density += (m.density - cur.density) * k;
      cur.rise += (m.rise - cur.rise) * k;
      cur.warmth += (m.warmth - cur.warmth) * k;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const active = Math.min(parts.length, Math.round(parts.length * cur.density));
      const t = now / 1000;
      const px = pointer ? pointer.x : 0;
      const py = pointer ? pointer.y : 0;

      for (let i = 0; i < active; i += 1) {
        const p = parts[i];
        p.y -= p.vy * cur.rise * dt * (0.4 + p.z);
        p.x += (p.vx + Math.sin(t * p.sp + p.ph) * 0.01) * dt * (0.5 + p.z);
        if (p.y < -0.06 || p.y > 1.08) {
          const fresh = make(false);
          Object.assign(p, fresh, { y: cur.rise >= 0 ? 1.05 : -0.05 });
        }
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        const sx = p.x * w + px * (p.z - 0.3) * 46;
        const sy = p.y * h + py * (p.z - 0.3) * 24;
        const size = p.r * (0.55 + p.z * 1.25);
        const twinkle = 0.65 + 0.35 * Math.sin(t * 2.2 * p.sp + p.ph);
        const edge = Math.min(1, p.y * 4, (1.05 - p.y) * 4);
        const a = Math.max(0, (0.22 + p.z * 0.6) * twinkle * edge);

        const r = Math.round(205 + 50 * cur.warmth);
        const g = Math.round(188 - 28 * cur.warmth + 8 * p.z);
        const b = Math.round(160 - 90 * cur.warmth);

        ctx.fillStyle = `rgba(${r},${g},${b},${(a * 0.13).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size * 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', resize);
    };
  }, [pointer]);

  return <canvas ref={canvasRef} className={`ipg-fx ${className}`} aria-hidden="true" />;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

export default function IndrajitPromiseGame({ onComplete, onExit }) {
  const [phase, setPhase] = useState('title'); // title → opening → play → end
  const [introReady, setIntroReady] = useState(false);
  const [introSkipped, setIntroSkipped] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [prevScene, setPrevScene] = useState(-1);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const audioRef = useRef(null);
  const timersRef = useRef(new Set());
  const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, last: 0 });
  const finishRef = useRef(null);
  const typingRef = useRef(false);
  const readyRef = useRef(false);
  const exitingRef = useRef(false);
  const stepRef = useRef(0);
  const phaseRef = useRef('title');
  const lastClickRef = useRef(0);
  const lastSceneRef = useRef(0);
  const completedRef = useRef(false);
  const advanceRef = useRef(null);

  phaseRef.current = phase;
  stepRef.current = stepIdx;

  const step = STEPS[Math.min(stepIdx, STEPS.length - 1)];
  const sceneIdx = step.sceneIndex;
  const scene = SCENES[sceneIdx];
  const speaker = step.type === 'dialogue' ? SPEAKERS[step.speaker] : null;
  const active = phase === 'opening' || phase === 'play';
  const live = active || phase === 'end';
  const mood = phase === 'end' ? END_MOOD : scene.mood;

  const later = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  /* audio lifecycle (created on mount so React StrictMode remounts stay healthy) */
  useEffect(() => {
    audioRef.current = createAudioEngine();
    const timers = timersRef.current;
    return () => {
      if (audioRef.current) audioRef.current.destroy();
      audioRef.current = null;
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.setMuted(muted);
  }, [muted]);

  /* intro: BEGIN appears after the narration has played out */
  useEffect(() => {
    if (phase !== 'title') return undefined;
    const id = setTimeout(() => setIntroReady(true), 8800);
    return () => clearTimeout(id);
  }, [phase]);

  /* camera parallax – one rAF loop writes two CSS variables; everything else is pure CSS */
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const p = pointerRef.current;
    let raf = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const idle = now - p.last > 2600;
      const tx = idle ? Math.sin(now / 5200) * 0.55 : p.tx;
      const ty = idle ? Math.cos(now / 6800) * 0.3 : p.ty;
      p.x += (tx - p.x) * 0.045;
      p.y += (ty - p.y) * 0.045;
      const el = stageRef.current;
      if (el) {
        el.style.setProperty('--px', p.x.toFixed(4));
        el.style.setProperty('--py', p.y.toFixed(4));
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = pointerRef.current;
    p.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    p.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    p.last = performance.now();
  }, []);

  /* keep the outgoing image animating while it fades, so the crossfade never jumps */
  useEffect(() => {
    if (sceneIdx === lastSceneRef.current) return undefined;
    setPrevScene(lastSceneRef.current);
    lastSceneRef.current = sceneIdx;
    const id = setTimeout(() => setPrevScene(-1), 2000);
    return () => clearTimeout(id);
  }, [sceneIdx]);

  /* typewriter + pacing for the current step */
  useEffect(() => {
    if (!active) return undefined;
    const s = STEPS[stepIdx];
    if (!s) return undefined;
    const text = s.text;
    const reduce = prefersReducedMotion();
    let dead = false;
    let i = 0;
    let t0 = 0;
    let t1 = 0;
    let t2 = 0;

    setShown(0);
    setTyping(false);
    setReady(false);
    typingRef.current = false;
    readyRef.current = false;

    const finish = () => {
      if (dead) return;
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      i = text.length;
      setShown(text.length);
      setTyping(false);
      typingRef.current = false;
      t2 = setTimeout(() => {
        if (dead) return;
        readyRef.current = true;
        setReady(true);
      }, s.pauseAfter);
    };
    finishRef.current = finish;

    const tick = () => {
      if (dead) return;
      i += 1;
      setShown(i);
      if (i >= text.length) {
        finish();
        return;
      }
      t1 = setTimeout(tick, charDelay(text[i - 1], text[i], s.type));
    };

    t0 = setTimeout(() => {
      if (dead) return;
      typingRef.current = true;
      setTyping(true);
      if (reduce) finish();
      else tick();
    }, s.startDelay);

    return () => {
      dead = true;
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, stepIdx]);

  /* ambient sound cues tied to a step */
  useEffect(() => {
    if (!active) return undefined;
    const s = STEPS[stepIdx];
    if (!s || !s.sfx) return undefined;
    const id = setTimeout(() => {
      if (audioRef.current) audioRef.current.sfx(s.sfx);
    }, s.sfxDelay ?? 600);
    return () => clearTimeout(id);
  }, [active, stepIdx]);

  /* advance: first click finishes the line, next click moves on. Rapid clicks are ignored. */
  const advance = useCallback(() => {
    if (phaseRef.current !== 'play') return;
    const now = performance.now();
    if (now - lastClickRef.current < 320) return;
    lastClickRef.current = now;
    if (exitingRef.current) return;

    if (typingRef.current) {
      if (finishRef.current) finishRef.current();
      return;
    }
    if (!readyRef.current) return;

    exitingRef.current = true;
    setExiting(true);
    later(() => {
      const next = stepRef.current + 1;
      if (next >= STEPS.length) setPhase('end');
      else setStepIdx(next);
      exitingRef.current = false;
      setExiting(false);
    }, 260);
  }, [later]);
  advanceRef.current = advance;

  useEffect(() => {
    const onKey = (e) => {
      if (e.target && e.target.closest && e.target.closest('button')) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (advanceRef.current) advanceRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleBegin = (e) => {
    e.stopPropagation();
    if (phaseRef.current !== 'title') return;
    if (audioRef.current) audioRef.current.start();
    setPhase('opening');
    later(() => setPhase('play'), 2400);
  };

  const skipIntro = () => {
    if (phaseRef.current !== 'title') return;
    setIntroSkipped(true);
    setIntroReady(true);
  };

  const handleReturn = (e) => {
    e.stopPropagation();
    if (completedRef.current) return;
    completedRef.current = true;
    if (onComplete) onComplete();
    else if (onExit) onExit();
  };

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn(e);
  };

  const showGate = phase === 'title' || phase === 'opening';
  const text = step.text;

  return (
    <div
      ref={rootRef}
      className={`ipg-root ipg-phase--${phase}`}
      onPointerMove={onPointerMove}
      role="group"
      aria-label="The Prince Who Stepped Forward"
    >
      {/* ───────── STAGE: the film frame ───────── */}
      <div
        ref={stageRef}
        className={`ipg-stage ${live ? 'ipg-stage--live' : ''}`}
        onClick={advance}
      >
        <div className="ipg-plane">
          {SCENES.map((s, i) => (
            <img
              key={s.id}
              className={`ipg-img ${i === sceneIdx ? 'is-on' : i === prevScene ? 'is-prev' : ''}`}
              src={`${IMG_BASE}${s.image}`}
              alt=""
              draggable="false"
              decoding="async"
              style={{
                objectPosition: s.focus,
                '--s0': s.cam.s0,
                '--s1': s.cam.s1,
                '--x0': s.cam.x0,
                '--y0': s.cam.y0,
                '--x1': s.cam.x1,
                '--y1': s.cam.y1,
              }}
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
              }}
            />
          ))}
          <div className="ipg-rays" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className="ipg-grade" style={{ '--grade': scene.grade }} aria-hidden="true" />
        <div className="ipg-pillar ipg-pillar--l" aria-hidden="true" />
        <div className="ipg-pillar ipg-pillar--r" aria-hidden="true" />
        <EmberField mood={mood} pointer={pointerRef.current} />
        <div className="ipg-vignette" aria-hidden="true" />
        <div className="ipg-grain" aria-hidden="true" />

        {/* HUD-free chrome: tiny chapter label, scene progress, controls */}
        <div className="ipg-chapter" aria-hidden="true">
          Chapter XVII <b>·</b> The Mountain of Life
        </div>

        <div className="ipg-progress" aria-hidden="true">
          {SCENES.map((s, i) => (
            <span
              key={s.id}
              className={i < sceneIdx ? 'is-done' : i === sceneIdx ? 'is-now' : ''}
            />
          ))}
        </div>

        <div className="ipg-controls">
          <button
            type="button"
            className="ipg-iconbtn"
            onClick={stop(() => setMuted((m) => !m))}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            aria-pressed={muted}
          >
            <IconVolume muted={muted} />
          </button>
          {onExit && (
            <button type="button" className="ipg-iconbtn" onClick={stop(onExit)} aria-label="Close">
              <IconClose />
            </button>
          )}
        </div>

        {live && (
          <div
            className="ipg-scene-card"
            key={sceneIdx}
            style={sceneIdx === 0 ? { animationDelay: '2.3s' } : undefined}
            aria-hidden="true"
          >
            <span>Scene {scene.numeral}</span>
            <strong>{scene.title}</strong>
          </div>
        )}
      </div>

      {/* ───────── DIALOGUE PANEL ───────── */}
      <div
        className={`ipg-panel ipg-panel--${step.type} ${
          speaker ? `ipg-panel--${step.speaker}` : ''
        }`}
        onClick={advance}
      >
        <div className="ipg-panel__paper" aria-hidden="true" />
        <div className="ipg-panel__inner">
          <div className={`ipg-line ${exiting ? 'is-exit' : ''}`} key={stepIdx}>
            {speaker ? (
              <div className={`ipg-name ipg-name--${step.speaker}`}>
                <i />
                <span>{speaker.name}</span>
                <em>{speaker.epithet}</em>
              </div>
            ) : (
              <div className="ipg-orn" aria-hidden="true" />
            )}
            <p className="ipg-text">
              <span className="ipg-sr" aria-live="polite">
                {active && ready ? text : ''}
              </span>
              <span aria-hidden="true">{text.slice(0, shown)}</span>
              {typing && <span className="ipg-caret" aria-hidden="true" />}
              <span className="ipg-ghost" aria-hidden="true">
                {text.slice(shown)}
              </span>
            </p>
          </div>

          <button
            type="button"
            className={`ipg-continue ${ready && !exiting ? 'is-ready' : ''}`}
            onClick={stop(advance)}
            tabIndex={ready ? 0 : -1}
          >
            Continue <IconChevron />
          </button>
        </div>
      </div>

      {/* ───────── TITLE: the palace gates ───────── */}
      {showGate && (
        <div
          className={`ipg-gate ${phase === 'opening' ? 'is-open' : ''}`}
          onClick={skipIntro}
        >
          <div className="ipg-gate__half ipg-gate__half--l" />
          <div className="ipg-gate__half ipg-gate__half--r" />
          <div className="ipg-gate__seam" />
          <EmberField mood={TITLE_MOOD} pointer={pointerRef.current} className="ipg-fx--gate" />

          <div className={`ipg-title ${introSkipped ? 'ipg-title--skip' : ''}`}>
            <div className="ipg-halo" aria-hidden="true">
              <i style={{ '--d': '46s', '--tilt': '68deg' }} />
              <i style={{ '--d': '70s', '--tilt': '68deg', animationDirection: 'reverse' }} />
              <i style={{ '--d': '38s', '--tilt': '72deg' }} />
              <b />
            </div>

            <div className="ipg-title__stack">
              <div className="ipg-title__label ipg-rise" style={{ animationDelay: '0.3s' }}>
                {TITLE.label}
              </div>
              <div className="ipg-title__rule ipg-rise" style={{ animationDelay: '0.7s' }} aria-hidden="true">
                <i />
              </div>
              <h1 className="ipg-title__main">
                <Words text={TITLE.main} start={1.1} step={0.24} />
              </h1>
              <div className="ipg-title__sub ipg-rise" style={{ animationDelay: '3.2s' }}>
                {TITLE.sub}
              </div>
              <p className="ipg-title__narr">
                <Words text={TITLE.narration} start={4.2} step={0.1} />
              </p>
              <button
                type="button"
                className={`ipg-begin ipg-rise ${introReady ? 'is-ready' : ''}`}
                style={{ animationDelay: '8.8s' }}
                onClick={handleBegin}
                disabled={!introReady}
              >
                Begin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────── FINAL SCREEN ───────── */}
      {phase === 'end' && (
        <div className="ipg-end">
          <div className="ipg-halo ipg-halo--end" aria-hidden="true">
            <i style={{ '--d': '50s', '--tilt': '68deg' }} />
            <i style={{ '--d': '72s', '--tilt': '70deg', animationDirection: 'reverse' }} />
            <b />
          </div>
          <div className="ipg-end__stack">
            <div className="ipg-end__rule ipg-rise" style={{ animationDelay: '0.8s' }} aria-hidden="true">
              <i />
            </div>
            <h2 className="ipg-end__title">{FINAL.title}</h2>
            <p className="ipg-end__sub ipg-rise" style={{ animationDelay: '2.6s' }}>
              {FINAL.sub}
            </p>
            <button
              type="button"
              className="ipg-begin ipg-rise is-ready"
              style={{ animationDelay: '4.2s' }}
              onClick={handleReturn}
            >
              {FINAL.button}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}