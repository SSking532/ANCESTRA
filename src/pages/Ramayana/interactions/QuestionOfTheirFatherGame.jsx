/*
 * ANCESTRA · Chapter XXIV · Uttara Kanda
 * Game 2 — The Question of Their Father
 *
 * A fully scripted cinematic interlude: Sita and her twin sons, Lava and Kusha.
 * The player never answers anything — they only press Continue.
 *
 * Props (all optional)
 *   onComplete / onContinue : called from "Return to the chapter" on the end card
 *   onClose                 : if given, a small close button is shown top-right
 *   embedded                : true → fills its parent instead of the whole viewport
 *
 * Dependencies: React only (CSS-3D parallax, canvas particles, Web Audio ambience).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './QuestionOfTheirFatherGame.css';

/* ─────────────────────────────────────────────────────────────
   1. IMAGES + CAMERA FOCUS POINTS
   focus = where the subject sits INSIDE the image, in % (x, y).
   The camera uses these to push in / pan. If a close-up ever
   lands on the wrong spot, nudge the numbers here — nothing else.
   ───────────────────────────────────────────────────────────── */
const IMG = '/images/ramayana/interactions/';
const FRAMES = {
  hermitage: {
    src: `${IMG}ch241.jpg`,
    alt: 'Sita sitting outside Sage Valmiki’s forest hermitage',
    focus: { wide: { x: 50, y: 50 }, sita: { x: 50, y: 44 } },
  },
  conversation: {
    src: `${IMG}ch242.jpg`,
    alt: 'Sita sitting and speaking with Lava and Kusha',
    focus: {
      wide: { x: 50, y: 50 },
      all: { x: 50, y: 47 },
      sita: { x: 50, y: 42 },
      lava: { x: 30, y: 46 },
      kusha: { x: 70, y: 46 },
    },
  },
  embrace: {
    src: `${IMG}ch243.jpg`,
    alt: 'Sita lovingly embracing Lava and Kusha',
    focus: { wide: { x: 50, y: 50 }, sita: { x: 50, y: 42 } },
  },
};
const FRAME_KEYS = Object.keys(FRAMES);

/* Colour grades: how each mood looks and feels */
const GRADES = {
  warm: { filter: 'saturate(1.08) contrast(1.04) brightness(1.02)', tint: 'rgba(255,196,110,0.16)', vig: 0.55, rays: 0.8, dens: 0.9, rise: 0, bloom: 0.55 },
  amber: { filter: 'saturate(1.16) contrast(1.05) brightness(1) sepia(0.12)', tint: 'rgba(255,160,70,0.24)', vig: 0.6, rays: 1, dens: 1.05, rise: 0.15, bloom: 0.7 },
  hush: { filter: 'saturate(0.9) contrast(1.06) brightness(0.9) hue-rotate(-6deg)', tint: 'rgba(70,110,84,0.3)', vig: 0.8, rays: 0.35, dens: 0.55, rise: 0, bloom: 0.35 },
  glow: { filter: 'saturate(1.18) contrast(1.02) brightness(1.07) sepia(0.18)', tint: 'rgba(255,186,96,0.3)', vig: 0.5, rays: 1.15, dens: 1.6, rise: 1, bloom: 1 },
};

/* A camera shot: which image, what to look at, how close, which mood */
const sh = (frame, focus, zoom, grade = 'warm', dur = 5200, extra = {}) => ({ frame, focus, zoom, grade, dur, ...extra });

const SHOT_TITLE = sh('hermitage', 'wide', 1.0, 'warm', 3000);
const SHOT_INTRO = sh('hermitage', 'wide', 1.1, 'warm', 9000);
const SHOT_OUTRO = sh('embrace', 'sita', 1.34, 'glow', 15000, { fade: 3800 });

const INITIAL_CAMS = {
  hermitage: SHOT_TITLE,
  conversation: sh('conversation', 'wide', 1.04),
  embrace: sh('embrace', 'wide', 1.0, 'glow'),
};

/* ─────────────────────────────────────────────────────────────
   2. THE SCRIPT — exact dialogue, exact order
   ───────────────────────────────────────────────────────────── */
const L = (who, text, shot, pause = 520) => ({ who, text, shot, pause });
const H = 'hermitage';
const C = 'conversation';

const SCENES = [
  {
    title: 'A Quiet Afternoon',
    lines: [
      L('Lava', 'Mother, may we sit with you?', sh(H, 'wide', 1.22, 'warm', 7000)),
      L('Sita', 'Of course, my children. Come, sit beside me.', sh(H, 'sita', 1.5, 'warm', 5600)),
    ],
  },
  {
    title: 'The Story of Rama',
    lines: [
      L('Kusha', 'We were learning about Rama today.', sh(C, 'wide', 1.1, 'warm', 7000)),
      L('Sita', 'Were you? Tell me, what did Gurudeva teach you?', sh(C, 'sita', 1.5)),
      L('Lava', 'He told us about Rama’s courage, his kindness and his devotion to dharma.', sh(C, 'lava', 1.55)),
      L('Kusha', 'Gurudeva says that Rama never abandoned his duties, even when life became difficult.', sh(C, 'kusha', 1.55)),
      L('Sita', 'Rama’s life is a remarkable story. There is much one can learn from it.', sh(C, 'sita', 1.38)),
      L('Lava', 'Gurudeva speaks of him with such affection. It feels as though he knew him very closely.', sh(C, 'all', 1.26, 'warm', 6200)),
      L('Sita', 'Perhaps some stories are remembered with more than ordinary affection, my son.', sh(C, 'sita', 1.7, 'amber', 6400)),
    ],
  },
  {
    title: 'A Curious Question',
    lines: [
      L('Kusha', 'Mother, was Rama always so courageous?', sh(C, 'kusha', 1.5, 'warm')),
      L('Sita', 'He faced many difficult moments, Kusha. But courage does not mean that one never feels sorrow or uncertainty. It means continuing to uphold what one believes is right.', sh(C, 'sita', 1.42, 'warm', 6400)),
      L('Lava', 'You speak of him as though you know him very well.', sh(C, 'lava', 1.55)),
      /* the pause, then the slow push toward Sita on the hermitage frame */
      L('Sita', 'Yes, my child. I knew him very well.', sh(H, 'sita', 1.78, 'hush', 7600), 1700),
    ],
  },
  {
    title: 'The Unfinished Story',
    lines: [
      L('Kusha', 'Did you meet him, Mother?', sh(H, 'sita', 1.36, 'hush', 6000)),
      L('Sita', 'Yes. I knew him through many seasons of life.', sh(H, 'sita', 1.62, 'hush', 6600)),
      L('Lava', 'Was he truly as noble as Gurudeva describes?', sh(C, 'lava', 1.5, 'warm')),
      L('Sita', 'He possessed many virtues. But his life, like every human life, was filled with difficult moments and choices.', sh(C, 'sita', 1.45, 'warm')),
      L('Kusha', 'Why do you remember his story so deeply?', sh(C, 'kusha', 1.55, 'warm')),
      L('Sita', 'Because some stories are not merely heard, my children. They are lived.', sh(H, 'sita', 1.9, 'hush', 8600), 1300),
      L('Lava', 'Then perhaps there is much more to his story than we have learned.', sh(H, 'wide', 1.16, 'hush', 7000)),
      L('Sita', 'Indeed, my son. There is always more to understand.', sh(H, 'sita', 1.5, 'amber', 6000)),
    ],
  },
  {
    title: 'A Promise',
    lines: [
      L('Kusha', 'Mother, will you tell us more about him someday?', sh(C, 'kusha', 1.5, 'amber')),
      L('Sita', 'Someday, my children. When the time is right, you will understand everything.', sh(C, 'sita', 1.5, 'amber')),
      L('Lava', 'We would like to hear it from you.', sh(C, 'lava', 1.5, 'amber')),
      L('Sita', 'And someday, I shall tell you.', sh(C, 'sita', 1.66, 'amber', 6400)),
      L('Kusha', 'Then we will wait, Mother.', sh(C, 'kusha', 1.58, 'amber')),
      L('Sita', 'You need not hurry to understand everything today. There is still so much of life waiting for you.', sh(C, 'all', 1.16, 'amber', 9000)),
    ],
  },
];

const LINES = SCENES.flatMap((s, si) => s.lines.map((l, li) => ({ ...l, scene: si, sceneTitle: li === 0 ? s.title : null })));
const FINAL_SCENE_TITLE = 'A Mother’s Embrace';

const SPEAKER_CLASS = { Sita: 'sita', Lava: 'lava', Kusha: 'kusha' };

/* ─────────────────────────────────────────────────────────────
   3. HELPERS
   ───────────────────────────────────────────────────────────── */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* Every shot keeps the WHOLE picture inside the frame (nothing is cropped).
   Cinematic movement is only a very gentle push-in/settle, centred on the
   picture so a face can never be cut off. Raise this slightly (max ~0.3)
   if you ever want a bolder push-in; 0 = completely still framing. */
const ZOOM_STRENGTH = 0.1;
const MAX_PUSH = 1.06;

/* Fit the whole image inside the screen area above the dialogue panel.
   A blurred copy of the same picture fills any leftover space.
   Uniform scale only, so the image is never stretched. */
function cameraFor(shot, dim, size, reserve) {
  if (!shot || !dim || !size.w || !size.h) return null;
  const { w: W, h: H } = size;
  const { w: iw, h: ih } = dim;
  const R = Math.max(140, H - reserve); // height of the picture area
  const base = Math.min((W * 0.95) / iw, (R * 0.95) / ih);
  const z = Math.min(MAX_PUSH, 1 + (shot.zoom - 1) * ZOOM_STRENGTH);
  const S = base * z;
  const f = FRAMES[shot.frame].focus[shot.focus] || { x: 50, y: 50 };
  const sw = iw * S;
  const sh2 = ih * S;
  const tx = (W - sw) / 2;
  const ty = (R - sh2) / 2;
  return { tx, ty, S, lx: ((tx + (f.x / 100) * sw) / W) * 100, ly: ((ty + (f.y / 100) * sh2) / H) * 100 };
}

/* ─────────────────────────────────────────────────────────────
   4. WEB-AUDIO AMBIENCE — no files needed
   forest wind · leaf rustle · soft birdsong · airy transitions
   · a barely-there warm pad for the embrace
   ───────────────────────────────────────────────────────────── */
function createAmbience() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  let alive = true;
  let muted = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      if (alive) fn();
    }, ms);
    timers.add(id);
  };

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const birdBus = ctx.createGain();
  birdBus.gain.value = 0.05;
  birdBus.connect(master);

  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, sr * 3, sr);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.4;
  }
  const noise = () => {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    return s;
  };

  /* wind through the trees */
  const wind = noise();
  const windLp = ctx.createBiquadFilter();
  windLp.type = 'lowpass';
  windLp.frequency.value = 900;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.16;
  const windLfo = ctx.createOscillator();
  windLfo.frequency.value = 0.06;
  const windLfoGain = ctx.createGain();
  windLfoGain.gain.value = 0.07;
  windLfo.connect(windLfoGain);
  windLfoGain.connect(windGain.gain);
  wind.connect(windLp);
  windLp.connect(windGain);
  windGain.connect(master);

  /* leaf rustle */
  const rustle = noise();
  const rustleHp = ctx.createBiquadFilter();
  rustleHp.type = 'highpass';
  rustleHp.frequency.value = 3800;
  const rustleGain = ctx.createGain();
  rustleGain.gain.value = 0.006;
  const rustleLfo = ctx.createOscillator();
  rustleLfo.frequency.value = 0.11;
  const rustleLfoGain = ctx.createGain();
  rustleLfoGain.gain.value = 0.005;
  rustleLfo.connect(rustleLfoGain);
  rustleLfoGain.connect(rustleGain.gain);
  rustle.connect(rustleHp);
  rustleHp.connect(rustleGain);
  rustleGain.connect(master);

  /* warm pad (silent until the embrace) */
  const padGain = ctx.createGain();
  padGain.gain.value = 0;
  const padLp = ctx.createBiquadFilter();
  padLp.type = 'lowpass';
  padLp.frequency.value = 760;
  padLp.connect(padGain);
  padGain.connect(master);
  const padOscs = [146.83, 220, 329.63, 440].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    o.detune.value = (i % 2 ? 1 : -1) * 4;
    const g = ctx.createGain();
    g.gain.value = 0.25;
    o.connect(g);
    g.connect(padLp);
    return o;
  });

  /* birdsong */
  const chirp = (base, pan) => {
    const t0 = ctx.currentTime + 0.02;
    const n = 2 + Math.floor(Math.random() * 4);
    const gap = 0.09 + Math.random() * 0.07;
    let out = birdBus;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      p.connect(birdBus);
      out = p;
    }
    for (let i = 0; i < n; i += 1) {
      const t = t0 + i * gap;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      const f0 = base * (1 + (Math.random() - 0.5) * 0.12);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * (Math.random() > 0.5 ? 1.35 : 0.78), t + gap * 0.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.6, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + gap * 0.85);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + gap);
    }
  };
  const sing = () => {
    chirp(2400 + Math.random() * 1800, Math.random() * 1.6 - 0.8);
    if (Math.random() < 0.35) later(() => chirp(1500 + Math.random() * 700, Math.random() * 1.6 - 0.8), 400 + Math.random() * 900);
    later(sing, 3200 + Math.random() * 6500);
  };

  return {
    start() {
      try {
        ctx.resume();
        wind.start();
        rustle.start();
        windLfo.start();
        rustleLfo.start();
        padOscs.forEach((o) => o.start());
        master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 1.8);
        later(sing, 1800);
      } catch (e) {
        /* audio is optional */
      }
    },
    setMuted(m) {
      muted = m;
      try {
        master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.15);
      } catch (e) {
        /* noop */
      }
    },
    whoosh() {
      try {
        const t = ctx.currentTime;
        const s = noise();
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 0.7;
        bp.frequency.setValueAtTime(380, t);
        bp.frequency.exponentialRampToValueAtTime(1500, t + 1.4);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.16, t + 0.6);
        g.gain.linearRampToValueAtTime(0.0001, t + 1.7);
        s.connect(bp);
        bp.connect(g);
        g.connect(master);
        s.start(t);
        s.stop(t + 1.8);
      } catch (e) {
        /* noop */
      }
    },
    tender(on) {
      try {
        const t = ctx.currentTime;
        padGain.gain.cancelScheduledValues(t);
        padGain.gain.setValueAtTime(padGain.gain.value, t);
        padGain.gain.linearRampToValueAtTime(on ? 0.035 : 0, t + (on ? 6 : 2));
        birdBus.gain.setTargetAtTime(on ? 0.028 : 0.05, t, 1.5);
      } catch (e) {
        /* noop */
      }
    },
    suspend() {
      try {
        ctx.suspend();
      } catch (e) {
        /* noop */
      }
    },
    resume() {
      try {
        ctx.resume();
      } catch (e) {
        /* noop */
      }
    },
    dispose() {
      alive = false;
      timers.forEach(clearTimeout);
      timers.clear();
      try {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
        setTimeout(() => ctx.close(), 600);
      } catch (e) {
        /* noop */
      }
    },
  };
}

/* ─────────────────────────────────────────────────────────────
   5. SMALL PRESENTATION PIECES
   ───────────────────────────────────────────────────────────── */
const LEAVES = [
  [60, 22, -24, 1.0], [118, 40, -8, 1.1], [176, 58, 8, 1.15], [236, 78, 22, 1.2], [300, 104, 34, 1.1],
  [84, 52, -70, 0.9], [150, 78, -52, 1.0], [214, 104, -36, 1.05], [280, 134, -18, 0.95],
  [100, 10, -40, 0.8], [330, 92, 48, 0.9], [40, 40, -80, 0.8],
];

function Branch({ id }) {
  return (
    <svg viewBox="0 0 400 200" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`qtf-leaf-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a7a40" />
          <stop offset="1" stopColor="#1b351f" />
        </linearGradient>
      </defs>
      <path d="M-10 4 C90 14 190 40 330 118" fill="none" stroke="#1d3320" strokeWidth="3.4" strokeLinecap="round" />
      {LEAVES.map(([x, y, a, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
          <path d="M0 0 C8 -16 40 -18 58 0 C40 18 8 16 0 0Z" fill={`url(#qtf-leaf-${id})`} stroke="rgba(236,206,120,.35)" strokeWidth="0.8" />
          <path d="M4 0 L52 0" stroke="rgba(236,214,140,.28)" strokeWidth="0.8" />
        </g>
      ))}
    </svg>
  );
}

const Ornament = () => (
  <svg className="qtf-ornament" viewBox="0 0 220 14" aria-hidden="true" focusable="false">
    <path d="M0 7 H92 M128 7 H220" stroke="currentColor" strokeWidth="1" fill="none" />
    <path d="M110 1 L117 7 L110 13 L103 7Z" fill="currentColor" />
  </svg>
);

const Chevron = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M6 3 L11 8 L6 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SoundIcon = ({ on }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path d="M4 9.5 H8 L13 5.5 V18.5 L8 14.5 H4Z" fill="currentColor" />
    {on ? (
      <path d="M16 9 C17.6 10.6 17.6 13.4 16 15 M18.6 6.6 C21.4 9.4 21.4 14.6 18.6 17.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    ) : (
      <path d="M16.5 9.5 L21 14.5 M21 9.5 L16.5 14.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    )}
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

const RAYS = [
  { l: '58%', w: '9vw', r: '17deg', d: '0s' },
  { l: '67%', w: '5vw', r: '21deg', d: '-3s' },
  { l: '76%', w: '12vw', r: '15deg', d: '-6s' },
  { l: '87%', w: '6vw', r: '24deg', d: '-2s' },
  { l: '48%', w: '4vw', r: '19deg', d: '-5s' },
];

/* ─────────────────────────────────────────────────────────────
   6. THE GAME
   ───────────────────────────────────────────────────────────── */
export default function QuestionOfTheirFatherGame({ onComplete, onContinue, onClose, embedded = false }) {
  const rootRef = useRef(null);
  const worldRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const typeTimer = useRef(null);
  const parallaxRef = useRef({ x: 0, y: 0 });
  const moodRef = useRef(GRADES.warm);
  const prevFrameRef = useRef(null);

  const reduced = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [resizing, setResizing] = useState(false);
  const [dims, setDims] = useState({});
  const [failed, setFailed] = useState({});
  const [phase, setPhase] = useState('title'); // title → intro → play → outro → end
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [cams, setCams] = useState(INITIAL_CAMS);
  const [muted, setMuted] = useState(false);
  const [caption, setCaption] = useState(null);

  const line = LINES[idx];
  const shot = useMemo(() => {
    if (phase === 'title') return SHOT_TITLE;
    if (phase === 'intro') return SHOT_INTRO;
    if (phase === 'play') return LINES[idx].shot;
    return SHOT_OUTRO;
  }, [phase, idx]);
  const grade = GRADES[shot.grade] || GRADES.warm;
  moodRef.current = grade;

  /* remember the last camera each image was given, so a fading-out image
     keeps its framing while the next one fades in */
  useEffect(() => {
    setCams((c) => (c[shot.frame] === shot ? c : { ...c, [shot.frame]: shot }));
  }, [shot]);

  /* ── measure the stage ── */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    let to;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (Math.abs(s.w - r.width) < 1 && Math.abs(s.h - r.height) < 1 ? s : { w: r.width, h: r.height }));
      setResizing(true);
      clearTimeout(to);
      to = setTimeout(() => setResizing(false), 260);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(to);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  /* ── preload the three images (and fail gracefully, silently) ── */
  useEffect(() => {
    let dead = false;
    FRAME_KEYS.forEach((k) => {
      const im = new Image();
      im.onload = () => {
        if (!dead) setDims((d) => ({ ...d, [k]: { w: im.naturalWidth, h: im.naturalHeight } }));
      };
      im.onerror = () => {
        if (!dead) setFailed((f) => ({ ...f, [k]: true }));
      };
      im.src = FRAMES[k].src;
    });
    return () => {
      dead = true;
    };
  }, []);
  const ready = !!dims.hermitage || !!failed.hermitage;

  /* ── 3D parallax: pointer on desktop, a slow idle sway everywhere ── */
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return undefined;
    let raf = 0;
    let lastMove = -1e9;
    const target = { x: 0, y: 0 };
    const onMove = (e) => {
      lastMove = performance.now();
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (reduced) return;
      const t = now / 1000;
      const idle = now - lastMove > 4000;
      const tx = idle ? Math.sin(t * 0.25) * 0.5 : target.x;
      const ty = idle ? Math.sin(t * 0.19 + 1) * 0.28 : target.y;
      const p = parallaxRef.current;
      p.x += (tx - p.x) * 0.05;
      p.y += (ty - p.y) * 0.05;
      world.style.setProperty('--qtf-px', p.x.toFixed(4));
      world.style.setProperty('--qtf-py', p.y.toFixed(4));
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  /* ── particles: golden dust, drifting leaves, rising warm lights ── */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    if (!ctx) return undefined;
    let raf = 0;
    let W = 1;
    let H = 1;
    let dpr = 1;
    let t = 0;
    let dens = 0.8;
    let rise = 0;
    let last = performance.now();
    const N = reduced ? 22 : 110;
    const NL = reduced ? 0 : 16;

    const sprite = document.createElement('canvas');
    sprite.width = 64;
    sprite.height = 64;
    const sg = sprite.getContext('2d');
    const grad = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,238,186,1)');
    grad.addColorStop(0.35, 'rgba(255,214,134,0.55)');
    grad.addColorStop(1, 'rgba(255,190,90,0)');
    sg.fillStyle = grad;
    sg.fillRect(0, 0, 64, 64);

    const motes = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(), z: 0.15 + Math.random() * 0.85, ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.9,
    }));
    const hues = ['rgba(98,134,70,', 'rgba(146,156,74,', 'rgba(200,152,62,'];
    const leaves = Array.from({ length: NL }, () => ({
      x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 1.2,
      ph: Math.random() * 6.28, c: hues[Math.floor(Math.random() * hues.length)],
    }));

    const resize = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, Math.floor(r.width * dpr));
      H = Math.max(1, Math.floor(r.height * dpr));
      cv.width = W;
      cv.height = H;
    };
    resize();
    window.addEventListener('resize', resize);

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const m = moodRef.current;
      dens += (m.dens - dens) * Math.min(1, dt * 0.8);
      rise += (m.rise - rise) * Math.min(1, dt * 0.6);
      const px = parallaxRef.current.x;
      const py = parallaxRef.current.y;
      ctx.clearRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'lighter';
      const active = dens * N * 0.8;
      for (let i = 0; i < N; i += 1) {
        const a = clamp(active - i, 0, 1);
        if (a <= 0) continue;
        const p = motes[i];
        p.x += (0.006 * p.z + Math.sin(t * 0.5 * p.sp + p.ph) * 0.004) * dt;
        p.y -= (0.004 + 0.016 * rise) * (0.4 + p.z) * dt;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        if (p.x > 1.05) p.x = -0.05;
        if (p.x < -0.06) p.x = 1.05;
        const sx = p.x * W + px * p.z * 38 * dpr;
        const sy = p.y * H + py * p.z * 22 * dpr;
        const tw = 0.6 + 0.4 * Math.sin(t * p.sp * 2 + p.ph);
        const s = (6 + p.z * 24) * dpr * (0.8 + 0.2 * tw);
        ctx.globalAlpha = a * (0.22 + 0.5 * p.z) * tw;
        ctx.drawImage(sprite, sx - s / 2, sy - s / 2, s, s);
      }

      ctx.globalCompositeOperation = 'source-over';
      const leafOn = dens > 0.6 ? 1 : 0.35;
      for (let i = 0; i < NL; i += 1) {
        const l = leaves[i];
        l.y += (0.02 + 0.03 * l.z) * dt * leafOn;
        l.x += (Math.sin(t * 0.7 + l.ph) * 0.03 + 0.012) * dt;
        l.rot += l.vr * dt;
        if (l.y > 1.06) { l.y = -0.06; l.x = Math.random(); }
        if (l.x > 1.06) l.x = -0.06;
        const sx = l.x * W + px * l.z * 46 * dpr;
        const sy = l.y * H + py * l.z * 26 * dpr;
        const s = (10 + l.z * 22) * dpr;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(l.rot);
        ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(t * 0.8 + l.ph)));
        ctx.globalAlpha = 0.18 + 0.42 * l.z;
        ctx.fillStyle = `${l.c}1)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.5, s * 0.2, 0, 0, 6.2832);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  /* ── audio lifecycle ── */
  useEffect(() => {
    const onVis = () => {
      const a = audioRef.current;
      if (!a) return;
      if (document.hidden) a.suspend();
      else a.resume();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (audioRef.current) audioRef.current.dispose();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.setMuted(muted);
  }, [muted]);

  /* soft airy sound whenever the picture changes */
  useEffect(() => {
    if (prevFrameRef.current && prevFrameRef.current !== shot.frame && (phase === 'play' || phase === 'outro')) {
      if (audioRef.current) audioRef.current.whoosh();
    }
    prevFrameRef.current = shot.frame;
  }, [shot.frame, phase]);

  /* ── typewriter ── */
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const text = LINES[idx].text;
    const len = text.length;
    let n = 0;
    let dead = false;
    setShown(0);
    setTyping(true);
    const step = () => {
      if (dead) return;
      n += 1;
      setShown(n);
      if (n >= len) {
        setTyping(false);
        return;
      }
      const ch = text[n - 1];
      let d = 24 + Math.random() * 14;
      if ('.?!'.includes(ch)) d += 260;
      else if (',;:—'.includes(ch)) d += 140;
      typeTimer.current = setTimeout(step, d);
    };
    typeTimer.current = setTimeout(step, LINES[idx].pause);
    return () => {
      dead = true;
      clearTimeout(typeTimer.current);
    };
  }, [phase, idx]);

  /* ── scene captions ── */
  useEffect(() => {
    if (phase === 'play' && idx > 0 && LINES[idx].sceneTitle) {
      setCaption({ text: LINES[idx].sceneTitle, id: `${idx}-${Date.now()}` });
    }
  }, [phase, idx]);

  /* ── intro: a quiet pause before the first words ── */
  useEffect(() => {
    if (phase !== 'intro') return undefined;
    setCaption({ text: SCENES[0].title, id: `intro-${Date.now()}` });
    const t = setTimeout(() => {
      setIdx(0);
      setShown(0);
      setTyping(true);
      setPhase('play');
    }, reduced ? 1200 : 3000);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  /* ── outro: the embrace, a few seconds of silence, then the end title ── */
  useEffect(() => {
    if (phase !== 'outro') return undefined;
    setCaption({ text: FINAL_SCENE_TITLE, id: `outro-${Date.now()}` });
    if (audioRef.current) audioRef.current.tender(true);
    const t = setTimeout(() => setPhase('end'), reduced ? 4500 : 9500);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  /* ── controls ── */
  const begin = useCallback(() => {
    if (!audioRef.current) {
      try {
        audioRef.current = createAmbience();
        if (audioRef.current) {
          audioRef.current.setMuted(muted);
          audioRef.current.start();
        }
      } catch (e) {
        audioRef.current = null;
      }
    }
    setPhase('intro');
  }, [muted]);

  const skip = useCallback(() => {
    if (phase !== 'play' || !typing) return;
    clearTimeout(typeTimer.current);
    setShown(LINES[idx].text.length);
    setTyping(false);
  }, [phase, typing, idx]);

  const next = useCallback(() => {
    if (phase !== 'play' || typing) return;
    if (idx < LINES.length - 1) {
      setShown(0);
      setTyping(true);
      setIdx(idx + 1);
    } else {
      setPhase('outro');
    }
  }, [phase, typing, idx]);

  const replay = useCallback(() => {
    clearTimeout(typeTimer.current);
    if (audioRef.current) audioRef.current.tender(false);
    setCams(INITIAL_CAMS);
    setIdx(0);
    setShown(0);
    setTyping(false);
    setCaption(null);
    setPhase('intro');
  }, []);

  const finish = onComplete || onContinue;

  /* keyboard: Space / Enter / → skip the typing, or continue */
  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'play') return;
      if (e.target && e.target.tagName === 'BUTTON') return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (typing) skip();
        else next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, typing, skip, next]);

  /* ── render ── */
  const fade = shot.fade || (reduced ? 400 : 1800);
  const portraitView = size.w < 720 || size.h > size.w * 1.15;
  const reserve = phase === 'outro' || phase === 'end' ? 0 : Math.min(size.h * 0.45, (portraitView ? 270 : 240) + 36);
  const activeCam = cameraFor(shot, dims[shot.frame], size, reserve);
  const progress = phase === 'play' ? (idx + 1) / LINES.length : phase === 'outro' || phase === 'end' ? 1 : 0;
  const panelOpen = phase === 'play';
  const speaker = SPEAKER_CLASS[line.who];

  return (
    <div
      ref={rootRef}
      className={`qtf-root${embedded ? ' is-embedded' : ''}`}
      data-phase={phase}
      role="dialog"
      aria-label="The Question of Their Father — Ancestra, Chapter XXIV"
    >
      <div ref={worldRef} className="qtf-world">
        {/* ——— 3D stage ——— */}
        <div className="qtf-stage">
          <div className="qtf-frames">
            {FRAME_KEYS.map((k, i) => {
              const cam = cameraFor(k === shot.frame ? shot : cams[k], dims[k], size, reserve);
              const g = GRADES[(k === shot.frame ? shot : cams[k]).grade] || GRADES.warm;
              const d = k === shot.frame ? shot.dur : cams[k].dur;
              return (
                <div
                  key={k}
                  className="qtf-frame"
                  style={{
                    opacity: k === shot.frame ? 1 : 0,
                    transition: `opacity ${fade}ms ease, filter 2000ms ease`,
                    filter: g.filter,
                  }}
                >
                  <div className="qtf-drift" style={{ animationDelay: `${-i * 7}s` }}>
                    {!failed[k] && <img className="qtf-backdrop" src={FRAMES[k].src} alt="" aria-hidden="true" draggable="false" />}
                    {dims[k] && cam && !failed[k] && (
                      <img
                        src={FRAMES[k].src}
                        alt={k === shot.frame ? FRAMES[k].alt : ''}
                        draggable="false"
                        style={{
                          width: dims[k].w,
                          height: dims[k].h,
                          transform: `translate3d(${cam.tx}px, ${cam.ty}px, 0) scale(${cam.S})`,
                          transition: resizing || reduced ? 'none' : `transform ${d}ms cubic-bezier(0.42, 0, 0.2, 1)`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="qtf-rays" style={{ opacity: grade.rays }} aria-hidden="true">
            {RAYS.map((r, i) => (
              <span key={i} className="qtf-ray" style={{ '--l': r.l, '--w': r.w, '--r': r.r, '--d': r.d }} />
            ))}
          </div>

          <canvas ref={canvasRef} className="qtf-particles" aria-hidden="true" />

          <div className="qtf-fg qtf-fg--l" aria-hidden="true"><Branch id="l" /></div>
          <div className="qtf-fg qtf-fg--r" aria-hidden="true"><Branch id="r" /></div>
        </div>

        {/* ——— flat cinematic grading ——— */}
        <div
          className="qtf-bloom"
          aria-hidden="true"
          style={{ left: `${activeCam ? activeCam.lx : 50}%`, top: `${activeCam ? activeCam.ly : 40}%`, opacity: grade.bloom }}
        />
        <div className="qtf-tint" aria-hidden="true" style={{ backgroundColor: grade.tint }} />
        <div className="qtf-vignette" aria-hidden="true" style={{ opacity: grade.vig }} />
        <div className="qtf-grain" aria-hidden="true" />
        <div className="qtf-bar qtf-bar--top" aria-hidden="true" />
        <div className="qtf-bar qtf-bar--bottom" aria-hidden="true" />
      </div>

      {/* ——— HUD ——— */}
      <div className="qtf-thread" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></div>

      {caption && phase !== 'title' && phase !== 'end' && (
        <div key={caption.id} className="qtf-caption" aria-hidden="true">{caption.text}</div>
      )}

      <div className="qtf-hud">
        <button
          type="button"
          className="qtf-icon"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          aria-pressed={muted}
        >
          <SoundIcon on={!muted} />
        </button>
        {onClose && (
          <button type="button" className="qtf-icon" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        )}
      </div>

      {/* ——— dialogue ——— */}
      <section className={`qtf-panel${panelOpen ? ' is-open' : ''}`} data-who={speaker} aria-hidden={!panelOpen}>
        <header className="qtf-speaker">
          <span className="qtf-sigil" aria-hidden="true" />
          <span className="qtf-name">{line.who}</span>
          <span className="qtf-voice" data-on={typing && panelOpen} aria-hidden="true"><i /><i /><i /></span>
        </header>
        <p key={idx} className="qtf-line">
          <span className="qtf-sr" aria-live="polite">{panelOpen ? `${line.who}: ${line.text}` : ''}</span>
          <span aria-hidden="true">{line.text.slice(0, shown)}</span>
          <i className="qtf-caret" data-on={typing} aria-hidden="true" />
          <span className="qtf-ghost" aria-hidden="true">{line.text.slice(shown)}</span>
        </p>
        <div className="qtf-actions">
          <button type="button" className="qtf-link" onClick={skip} disabled={!typing} tabIndex={typing ? 0 : -1}>
            Skip
          </button>
          <button
            type="button"
            className={`qtf-btn qtf-btn--primary${!typing ? ' qtf-btn--ready' : ''}`}
            onClick={next}
            disabled={typing}
          >
            Continue <Chevron />
          </button>
        </div>
      </section>

      {/* ——— opening card ——— */}
      <div className={`qtf-title${phase === 'title' ? ' is-open' : ''}`}>
        <p className="qtf-kicker qtf-r1">Uttara Kanda, Chapter XXIV</p>
        <h1 className="qtf-h1 qtf-r2">The Question of Their Father</h1>
        <Ornament />
        <p className="qtf-sub qtf-r3">An afternoon at Sage Valmiki’s hermitage, where two boys ask their mother about a king.</p>
        <button type="button" className="qtf-btn qtf-btn--light qtf-r4" onClick={begin} disabled={!ready}>
          {ready ? 'Begin' : 'Preparing the grove'} {ready && <Chevron />}
        </button>
        <p className="qtf-note qtf-r5">Best with sound on. You only need to press Continue.</p>
      </div>

      {/* ——— ending ——— */}
      <div className={`qtf-end${phase === 'end' ? ' is-open' : ''}`}>
        <p className="qtf-end1">Some truths wait for their time.</p>
        <Ornament />
        <p className="qtf-end2">The Question of Their Father</p>
        <p className="qtf-end3">Ancestra — Chapter XXIV</p>
        <div className="qtf-end-actions">
          <button type="button" className="qtf-btn qtf-btn--light" onClick={replay} disabled={phase !== 'end'}>
            Replay
          </button>
          {finish && (
            <button type="button" className="qtf-btn qtf-btn--gold" onClick={finish} disabled={phase !== 'end'}>
              Return to the chapter <Chevron />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}