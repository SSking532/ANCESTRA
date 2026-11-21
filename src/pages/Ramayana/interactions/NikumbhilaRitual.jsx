/**
 * ANCESTRA — GAME 1: THE RITUAL OF NIKUMBHILA
 * Chapter XVIII: The Fall of Indrajit | YUDDHA KANDA
 *
 * Files:  NikumbhilaRitual.jsx + NikumbhilaRitual.css  (keep side by side)
 * Usage:  <NikumbhilaRitual onContinue={() => returnToChapter18()} onExit={() => leaveGame()} />
 * Needs:  react, framer-motion, and /public/images/ramayana/interactions/ch18ritual.jpg
 *
 * Mantras are authentic Vedic verses (the Ramayana does not record Indrajit's
 * exact mantras, so none are invented). Edit MANTRAS freely: `units` is the
 * CORRECT order; shuffling happens separately at runtime.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./NikumbhilaRitual.css";

/* ───────────────────────── DATA ───────────────────────── */

const BG = "/images/ramayana/interactions/ch18ritual.jpg";
const IMG_FALLBACK = { w: 1672, h: 941 };
// Where the flames / kund base sit inside the image (fractions of image size).
// Tweak only `x` to nudge the offering left (smaller) or right (larger).
const FIRE_POS = { x: 0.535, y: 0.72, baseY: 0.81 };

const MANTRAS = [
  {
    title: "Invocation of Agni",
    source: "Ṛgveda 1.1.1",
    sanskrit: ["अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम् ।", "होतारं रत्नधातमम् ॥"],
    transliteration: ["agnim īḷe purohitaṃ yajñasya devam ṛtvijam |", "hotāraṃ ratnadhātamam ||"],
    meaning:
      "I praise Agni, the household priest of the sacrifice, the divine minister of the rite, the invoker who bestows the richest treasures.",
    units: [
      { sk: "अग्निमीळे", tr: "agnim īḷe" },
      { sk: "पुरोहितं", tr: "purohitaṃ" },
      { sk: "यज्ञस्य", tr: "yajñasya" },
      { sk: "देवमृत्विजम्", tr: "devam ṛtvijam" },
      { sk: "होतारं", tr: "hotāraṃ" },
      { sk: "रत्नधातमम्", tr: "ratnadhātamam" },
    ],
  },
  {
    title: "Gāyatrī Mantra",
    source: "Ṛgveda 3.62.10",
    sanskrit: ["ॐ भूर्भुवः स्वः ।", "तत्सवितुर्वरेण्यं ।", "भर्गो देवस्य धीमहि ।", "धियो यो नः प्रचोदयात् ॥"],
    transliteration: [
      "oṃ bhūr bhuvaḥ svaḥ |",
      "tat savitur vareṇyaṃ |",
      "bhargo devasya dhīmahi |",
      "dhiyo yo naḥ pracodayāt ||",
    ],
    meaning:
      "We meditate on the radiant glory of the divine Savitṛ, the sun-like source of light. May it inspire and guide our understanding.",
    units: [
      { sk: "ॐ", tr: "oṃ" },
      { sk: "भूर्भुवः स्वः", tr: "bhūr bhuvaḥ svaḥ" },
      { sk: "तत् सवितुर्वरेण्यं", tr: "tat savitur vareṇyaṃ" },
      { sk: "भर्गो देवस्य धीमहि", tr: "bhargo devasya dhīmahi" },
      { sk: "धियो यो नः प्रचोदयात्", tr: "dhiyo yo naḥ pracodayāt" },
    ],
  },
  {
    title: "Mahāmṛtyuñjaya Mantra",
    source: "Ṛgveda 7.59.12",
    sanskrit: ["त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।", "उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात् ॥"],
    transliteration: [
      "tryambakaṃ yajāmahe sugandhiṃ puṣṭivardhanam |",
      "urvārukam iva bandhanān mṛtyor mukṣīya māmṛtāt ||",
    ],
    meaning:
      "We worship the three-eyed Lord, fragrant and nourishing. Like a ripe cucumber freed from its stem, may we be freed from death, not from immortality.",
    units: [
      { sk: "त्र्यम्बकं यजामहे", tr: "tryambakaṃ yajāmahe" },
      { sk: "सुगन्धिं पुष्टिवर्धनम्", tr: "sugandhiṃ puṣṭivardhanam" },
      { sk: "उर्वारुकमिव बन्धनान्", tr: "urvārukam iva bandhanān" },
      { sk: "मृत्योर्मुक्षीय", tr: "mṛtyor mukṣīya" },
      { sk: "मामृतात्", tr: "māmṛtāt" },
    ],
  },
  {
    title: "Pūrṇam Śānti Mantra",
    source: "Īśā & Bṛhadāraṇyaka Upaniṣad",
    sanskrit: ["पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते ।", "पूर्णस्य पूर्णमादाय पूर्णमेवावशिष्यते ॥"],
    transliteration: [
      "pūrṇam adaḥ pūrṇam idaṃ pūrṇāt pūrṇam udacyate |",
      "pūrṇasya pūrṇam ādāya pūrṇam evāvaśiṣyate ||",
    ],
    meaning:
      "That is whole; this is whole. From wholeness arises wholeness. Taking wholeness from wholeness, wholeness alone remains.",
    units: [
      { sk: "पूर्णमदः", tr: "pūrṇam adaḥ" },
      { sk: "पूर्णमिदं", tr: "pūrṇam idaṃ" },
      { sk: "पूर्णात् पूर्णमुदच्यते", tr: "pūrṇāt pūrṇam udacyate" },
      { sk: "पूर्णस्य पूर्णमादाय", tr: "pūrṇasya pūrṇam ādāya" },
      { sk: "पूर्णमेवावशिष्यते", tr: "pūrṇam evāvaśiṣyate" },
    ],
  },
  {
    title: "Pavamāna Mantra",
    source: "Bṛhadāraṇyaka Upaniṣad 1.3.28",
    sanskrit: ["असतो मा सद्गमय ।", "तमसो मा ज्योतिर्गमय ।", "मृत्योर्मा अमृतं गमय ॥"],
    transliteration: ["asato mā sad gamaya |", "tamaso mā jyotir gamaya |", "mṛtyor mā amṛtaṃ gamaya ||"],
    meaning: "Lead me from untruth to truth, from darkness to light, from death to immortality.",
    units: [
      { sk: "असतो मा", tr: "asato mā" },
      { sk: "सद्गमय", tr: "sad gamaya" },
      { sk: "तमसो मा", tr: "tamaso mā" },
      { sk: "ज्योतिर्गमय", tr: "jyotir gamaya" },
      { sk: "मृत्योर्मा", tr: "mṛtyor mā" },
      { sk: "अमृतं गमय", tr: "amṛtaṃ gamaya" },
    ],
  },
];

const TOTAL = MANTRAS.length; // exactly five
const INTRO_TEXT =
  "At the sacred grounds of Nikumbhila, Meghnath begins an important ritual. Five mantras must be completed in their proper sequence, each offered into the sacred fire.";
const FINAL_TEXT =
  "One by one, the five mantras were completed and offered into the sacred fire. The ritual at Nikumbhila had reached its final stage.";

/* ───────────────────────── HELPERS ───────────────────────── */

const pad = (n) => String(n).padStart(2, "0");

function makeCards(mantra) {
  const cards = mantra.units.map((u, i) => ({ id: `u${i}`, idx: i, sk: u.sk, tr: u.tr }));
  let shuffled = cards;
  for (let attempt = 0; attempt < 12; attempt++) {
    shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (shuffled.some((c, i) => c.idx !== i)) break; // never start solved
  }
  return shuffled;
}

function useTypewriter(text, speed = 24, start = true) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!start) return undefined;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, start]);
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

function buildPath(a, b, viewH, steps = 60) {
  const c = { x: a.x + (b.x - a.x) * 0.2, y: Math.max(24, Math.min(a.y, b.y) - viewH * 0.3) };
  const xs = [];
  const ys = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const e = -(Math.cos(Math.PI * t) - 1) / 2;
    const u = 1 - e;
    xs.push(u * u * a.x + 2 * u * e * c.x + e * e * b.x);
    ys.push(u * u * a.y + 2 * u * e * c.y + e * e * b.y);
  }
  return { xs, ys };
}

/* Synthesised sound (no audio files). Starts on first click, mutable.
   Includes a quiet ambient bed (drone + fire crackle) and a soft recitation. */
function useSfx() {
  const ctxRef = useRef(null);
  const mutedRef = useRef(false);
  const ambRef = useRef(null);
  const [muted, setMuted] = useState(false);

  const stopAmbient = useCallback(() => {
    const a = ambRef.current;
    if (a) {
      a.alive = false;
      clearTimeout(a.timer);
      a.nodes.forEach((n) => {
        try {
          n.stop();
        } catch (e) {
          /* ignore */
        }
      });
      ambRef.current = null;
    }
    try {
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(
    () => () => {
      stopAmbient();
      try {
        ctxRef.current && ctxRef.current.close();
      } catch (e) {
        /* ignore */
      }
      ctxRef.current = null;
    },
    [stopAmbient]
  );

  const ensure = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const tone = (ctx, { f, d = 0.4, type = "sine", g = 0.07, at = 0, to }) => {
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    const v = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(g, t + 0.02);
    v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(v);
    v.connect(ctx.destination);
    o.start(t);
    o.stop(t + d + 0.05);
  };

  const play = useCallback(
    (name, i = 0) => {
      if (mutedRef.current) return;
      const ctx = ensure();
      if (!ctx) return;
      if (name === "chime") {
        const f = 523.25 * Math.pow(2, [0, 2, 4, 7, 9, 12][i % 6] / 12);
        tone(ctx, { f, d: 0.9 });
        tone(ctx, { f: f * 2, d: 0.6, g: 0.025 });
      } else if (name === "wrong") {
        tone(ctx, { f: 150, to: 90, d: 0.3, type: "triangle", g: 0.09 });
      } else if (name === "complete") {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => tone(ctx, { f, d: 1.1, g: 0.06, at: k * 0.16 }));
      } else if (name === "whoosh") {
        tone(ctx, { f: 260, to: 1300, d: 1.8, g: 0.035, type: "sine" });
      } else if (name === "enter") {
        tone(ctx, { f: 98, d: 1.6, type: "triangle", g: 0.1 });
        for (let k = 0; k < 9; k++)
          tone(ctx, { f: 1800 + Math.random() * 2400, d: 0.05, type: "square", g: 0.012, at: Math.random() * 0.8 });
      }
    },
    [ensure]
  );

  /* quiet looping bed: sacred drone + fire crackle (call after a user click) */
  const startAmbient = useCallback(() => {
    if (ambRef.current) return;
    const ctx = ensure();
    if (!ctx) return;
    const nodes = [];
    const master = ctx.createGain();
    master.gain.value = mutedRef.current ? 0.0001 : 1;
    master.connect(ctx.destination);

    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 900;
    const drone = ctx.createGain();
    drone.gain.value = 0.0001;
    drone.gain.setTargetAtTime(1, ctx.currentTime, 2.5); // slow fade-in
    low.connect(drone);
    drone.connect(master);

    [
      [98, 0.05],
      [146.83, 0.032],
      [196, 0.02],
      [293.66, 0.009],
    ].forEach(([f, g], i) => {
      const o = ctx.createOscillator();
      const v = ctx.createGain();
      o.type = i === 0 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 8;
      v.gain.value = g;
      o.connect(v);
      v.connect(low);
      o.start();
      nodes.push(o);
    });

    // slow breathing on the drone
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.11;
    lfoG.gain.value = 0.25;
    lfo.connect(lfoG);
    lfoG.connect(drone.gain);
    lfo.start();
    nodes.push(lfo);

    // fire crackle: tiny filtered-noise ticks at random intervals
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = nb.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const amb = { alive: true, nodes, timer: 0, master };
    const crackle = () => {
      if (!amb.alive) return;
      const src = ctx.createBufferSource();
      src.buffer = nb;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1400 + Math.random() * 2500;
      const v = ctx.createGain();
      const t = ctx.currentTime;
      v.gain.setValueAtTime(0.0001, t);
      v.gain.exponentialRampToValueAtTime(0.012 + Math.random() * 0.02, t + 0.004);
      v.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.05);
      src.connect(hp);
      hp.connect(v);
      v.connect(master);
      src.start(t, Math.random() * 0.8);
      src.stop(t + 0.12);
      amb.timer = setTimeout(crackle, 90 + Math.random() * 380);
    };
    crackle();

    ambRef.current = amb;
  }, [ensure]);

  /* soft, slow, low-pitched recitation of the mantra (browser voice; skipped if unavailable) */
  const speak = useCallback((text) => {
    if (mutedRef.current || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const s = window.speechSynthesis;
      s.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "hi-IN";
      const v = s.getVoices().find((x) => /^(hi|sa|mr)/i.test(x.lang));
      if (v) u.voice = v;
      u.rate = 0.55;
      u.pitch = 0.55;
      u.volume = 0.4;
      s.speak(u);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    const a = ambRef.current;
    const ctx = ctxRef.current;
    if (a && ctx) a.master.gain.setTargetAtTime(mutedRef.current ? 0.0001 : 1, ctx.currentTime, 0.25);
    if (mutedRef.current) {
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch (e) {
        /* ignore */
      }
    }
  }, []);

  return { play, startAmbient, speak, muted, toggle, stop: stopAmbient };
}

/* ───────────────────────── VISUAL PIECES ───────────────────────── */

/** Subtle rising embers above the kund (additive overlay; background image is untouched). */
function Embers({ fire, size, intense }) {
  const ref = useRef(null);
  const fireRef = useRef(fire);
  const sizeRef = useRef(size);
  const intenseRef = useRef(intense);
  fireRef.current = fire;
  sizeRef.current = size;
  intenseRef.current = intense;

  useEffect(() => {
    const c = ref.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = size.w * dpr;
    c.height = size.h * dpr;
  }, [size]);

  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext("2d");
    const ps = [];
    let raf;
    const tick = () => {
      const f = fireRef.current;
      const s = sizeRef.current;
      const k = c.width / Math.max(s.w, 1);
      const max = intenseRef.current ? 90 : 44;
      if (ps.length < max && Math.random() < (intenseRef.current ? 0.7 : 0.32)) {
        ps.push({
          x: f.x + (Math.random() - 0.5) * f.r * 1.1,
          y: f.by - Math.random() * f.r * 0.25,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -(0.35 + Math.random() * 0.9),
          r: 0.8 + Math.random() * 1.9,
          life: 0,
          ttl: 140 + Math.random() * 160,
          ph: Math.random() * 6.28,
        });
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life += 1;
        p.x += p.vx + Math.sin(p.life * 0.04 + p.ph) * 0.3;
        p.y += p.vy;
        const t = p.life / p.ttl;
        if (t >= 1) {
          ps.splice(i, 1);
          continue;
        }
        const a = Math.sin(Math.PI * t) * 0.85;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,${(170 + 60 * (1 - t)) | 0},${(70 + 40 * (1 - t)) | 0},${a})`;
        ctx.shadowColor = "rgba(255,180,70,.9)";
        ctx.shadowBlur = 8 * k;
        ctx.arc(p.x * k, p.y * k, p.r * k, 0, 6.283);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="nik-embers" aria-hidden="true" />;
}

function Mandala() {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg className="nik-mandala" viewBox="-100 -100 200 200" fill="none" stroke="#f4d58a" strokeWidth="0.6" aria-hidden="true">
      <circle r="96" />
      <circle r="88" strokeDasharray="1.5 3" />
      <circle r="52" />
      <circle r="30" />
      {petals.map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0 -52 C 14 -66 14 -82 0 -94 C -14 -82 -14 -66 0 -52 Z" />
          <line x1="0" y1="-30" x2="0" y2="-52" />
        </g>
      ))}
      <path d="M0 -30 L26 15 L-26 15 Z" />
      <path d="M0 30 L-26 -15 L26 -15 Z" />
    </svg>
  );
}

function Typed({ text, speed, className }) {
  const { shown } = useTypewriter(text, speed);
  return (
    <p className={className}>
      <span aria-hidden="true">{shown}</span>
      <span className="nik-sr">{text}</span>
    </p>
  );
}

function Progress({ stage, offered, show }) {
  if (!show) return null;
  return (
    <div className="nik-progress" aria-label={`Offering ${Math.min(offered, TOTAL)} of ${TOTAL} complete`}>
      <span className="nik-prog-num">
        {pad(Math.min(stage + 1, TOTAL))} / {pad(TOTAL)}
      </span>
      <span className="nik-dots">
        {MANTRAS.map((_, i) => (
          <span key={i} className={`nik-pdot ${i < offered ? "done" : i === stage ? "current" : ""}`} />
        ))}
      </span>
    </div>
  );
}

/** Parchment tablet with 3D pointer-tilt, glare and thickness. */
const Card = React.memo(function Card({ card, stageKey, state, onPick, hidden }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const pool = state === "pool";

  const move = (e) => {
    if (e.pointerType === "touch" || !inner.current || !outer.current) return;
    const r = outer.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const s = inner.current.style;
    s.setProperty("--ry", `${(px - 0.5) * 24}deg`);
    s.setProperty("--rx", `${-(py - 0.5) * 20}deg`);
    s.setProperty("--gx", `${px * 100}%`);
    s.setProperty("--gy", `${py * 100}%`);
    s.setProperty("--go", "1");
  };
  const leave = () => {
    const s = inner.current && inner.current.style;
    if (!s) return;
    s.setProperty("--rx", "0deg");
    s.setProperty("--ry", "0deg");
    s.setProperty("--go", "0");
  };

  return (
    <motion.button
      ref={outer}
      type="button"
      layout
      layoutId={`${stageKey}-${card.id}`}
      className={`nik-card ${state}${hidden ? " nik-hide" : ""}`}
      onClick={pool ? () => onPick(card.id) : undefined}
      onPointerMove={pool ? move : undefined}
      onPointerLeave={pool ? leave : undefined}
      tabIndex={pool ? 0 : -1}
      aria-disabled={!pool}
      aria-label={`${card.sk} — ${card.tr}`}
      initial={false}
      animate={state === "wrong" ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
      whileHover={pool ? { y: -5 } : undefined}
      whileTap={pool ? { scale: 0.96 } : undefined}
      transition={
        state === "wrong"
          ? { duration: 0.5 }
          : { layout: { duration: 0.5, ease: [0.22, 0.8, 0.3, 1] }, duration: 0.3 }
      }
    >
      <span ref={inner} className="nik-tilt">
        <span className="nik-card-sk">{card.sk}</span>
        <span className="nik-card-tr">{card.tr}</span>
        <span className="nik-glare" />
      </span>
    </motion.button>
  );
});

/* ───────────────────────── MAIN COMPONENT ───────────────────────── */

export default function NikumbhilaRitual({ onContinue, onExit }) {
  const [screen, setScreen] = useState("intro"); // intro | game | final
  const [stage, setStage] = useState(0);
  const [cards, setCards] = useState(() => makeCards(MANTRAS[0]));
  const [placed, setPlaced] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [phase, setPhase] = useState("play"); // play | complete | merge | journey | enter
  const [offered, setOffered] = useState(0);

  const [ghosts, setGhosts] = useState([]);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [path, setPath] = useState(null);
  const [burst, setBurst] = useState({ n: 0, big: false });
  const [sparks, setSparks] = useState([]);

  const [size, setSize] = useState({ w: 1280, h: 720 });
  const [img, setImg] = useState(IMG_FALLBACK);

  const rootRef = useRef(null);
  const seqRef = useRef(null);
  const placedRef = useRef([]);
  const lockRef = useRef(false);
  const offeringRef = useRef(false);
  const aliveRef = useRef(true);
  const timersRef = useRef(new Set());
  const sfx = useSfx();
  const { play, startAmbient, speak } = sfx;

  const handleExit = useCallback(() => {
    aliveRef.current = false;
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
    sfx.stop();
    if (onExit) onExit();
  }, [sfx, onExit]);

  useEffect(() => {
    aliveRef.current = true;
    const timers = timersRef.current;
    return () => {
      aliveRef.current = false;
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  // soft recitation of each mantra as it appears
  useEffect(() => {
    if (screen !== "game") return undefined;
    const id = setTimeout(() => speak(MANTRAS[stage].sanskrit.join(" ")), 1200);
    return () => clearTimeout(id);
  }, [screen, stage, speak]);

  const later = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
  }, []);
  const sleep = useCallback((ms) => new Promise((res) => later(res, ms)), [later]);

  useEffect(() => {
    const measure = () => {
      const r = rootRef.current?.getBoundingClientRect();
      if (r) setSize({ w: r.width, h: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const im = new Image();
    im.onload = () => im.naturalWidth && setImg({ w: im.naturalWidth, h: im.naturalHeight });
    im.src = BG;
  }, []);

  // 3D parallax of the docks toward the pointer
  const onPointerMove = useCallback((e) => {
    const el = rootRef.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  }, []);

  const fire = useMemo(() => {
    const s = Math.max(size.w / img.w, size.h / img.h);
    const ox = (size.w - img.w * s) / 2;
    const oy = (size.h - img.h * s) / 2;
    return {
      x: ox + FIRE_POS.x * img.w * s,
      y: oy + FIRE_POS.y * img.h * s,
      by: oy + FIRE_POS.baseY * img.h * s,
      r: 0.19 * img.w * s,
    };
  }, [size, img]);

  const mantra = MANTRAS[stage];
  const wrongCard = wrong ? cards.find((c) => c.id === wrong) : null;
  const byId = useCallback((id) => cards.find((c) => c.id === id), [cards]);

  /* ───── offering sequence (runs once per mantra) ───── */
  const runOffering = useCallback(
    async (stg, finalCards) => {
      if (offeringRef.current) return;
      offeringRef.current = true;
      lockRef.current = true;

      await sleep(500);
      if (!aliveRef.current) return;

      // PHASE 1 — completion
      setPhase("complete");
      play("complete");
      await sleep(2000);
      if (!aliveRef.current) return;

      // PHASE 2 — transformation into one golden dot
      const rootR = rootRef.current.getBoundingClientRect();
      const slots = Array.from(seqRef.current?.querySelectorAll('[data-filled="1"]') || []);
      const rects = slots.map((el, i) => {
        const r = el.getBoundingClientRect();
        return { id: finalCards[i], x: r.left - rootR.left, y: r.top - rootR.top, w: r.width, h: r.height };
      });
      const cx = rects.reduce((s, r) => s + r.x + r.w / 2, 0) / Math.max(rects.length, 1);
      const cy = rects.reduce((s, r) => s + r.y + r.h / 2, 0) / Math.max(rects.length, 1);
      setCenter({ x: cx, y: cy });
      setGhosts(
        rects.map((r) => ({
          ...r,
          dx: cx - (r.x + r.w / 2),
          dy: cy - (r.y + r.h / 2),
          ps: Array.from({ length: 8 }, () => ({
            sx: r.x + Math.random() * r.w,
            sy: r.y + Math.random() * r.h,
            d: 0.15 + Math.random() * 0.55,
            s: 2 + Math.random() * 3,
          })),
        }))
      );
      setPhase("merge");
      await sleep(1900);
      if (!aliveRef.current) return;

      // PHASE 3 — journey to the kund
      setGhosts([]);
      setPath(buildPath({ x: cx, y: cy }, { x: fire.x, y: fire.y }, size.h));
      setPhase("journey");
      play("whoosh");
      await sleep(2100);
      if (!aliveRef.current) return;

      // PHASE 4 — entering the fire
      const last = stg === TOTAL - 1;
      setPhase("enter");
      setOffered(stg + 1);
      setBurst((b) => ({ n: b.n + 1, big: last }));
      play("enter");
      setSparks(
        Array.from({ length: 14 }, () => ({
          dx: (Math.random() - 0.5) * 120,
          dy: -(35 + Math.random() * 120),
          s: 3 + Math.random() * 3,
          d: Math.random() * 0.4,
        }))
      );
      await sleep(2000);
      if (!aliveRef.current) return;

      // PHASE 5 — next mantra or the close of the ritual
      setSparks([]);
      setPath(null);
      if (last) {
        setPhase("play");
        setScreen("final");
      } else {
        const ns = stg + 1;
        placedRef.current = [];
        setStage(ns);
        setCards(makeCards(MANTRAS[ns]));
        setPlaced([]);
        setWrong(null);
        setPhase("play");
        lockRef.current = false;
      }
      offeringRef.current = false;
    },
    [fire, size.h, sleep, play]
  );

  /* ───── card selection ───── */
  const pick = useCallback(
    (id) => {
      if (lockRef.current || offeringRef.current) return;
      const cur = placedRef.current;
      if (cur.includes(id)) return;
      const card = cards.find((c) => c.id === id);
      if (!card) return;

      if (card.idx === cur.length) {
        const next = [...cur, id];
        placedRef.current = next;
        setPlaced(next);
        play("chime", cur.length);
        if (next.length === MANTRAS[stage].units.length) {
          lockRef.current = true;
          runOffering(stage, next);
        }
      } else {
        lockRef.current = true;
        setWrong(id);
        play("wrong");
        later(() => {
          setWrong(null);
          lockRef.current = false;
        }, 650);
      }
    },
    [cards, stage, runOffering, later, play]
  );

  const banner = phase === "complete" ? "MANTRA COMPLETED" : phase === "enter" ? "MANTRA OFFERED" : null;
  const hideSeq = phase === "merge" || phase === "journey" || phase === "enter";
  const dotLive = hideSeq;

  const dot = (() => {
    if (phase === "merge")
      return {
        animate: { x: center.x, y: center.y, scale: [0, 0, 1.25, 1], opacity: [0, 0, 1, 1] },
        transition: { duration: 1.7, times: [0, 0.55, 0.85, 1], ease: "easeOut" },
      };
    if (phase === "journey" && path)
      return {
        animate: { x: path.xs, y: path.ys, scale: [1, 1.25, 1, 0.9], opacity: 1 },
        transition: {
          x: { duration: 2, ease: "linear" },
          y: { duration: 2, ease: "linear" },
          scale: { duration: 2, times: [0, 0.3, 0.7, 1] },
        },
      };
    return { animate: { x: fire.x, y: fire.y, scale: 0, opacity: 0 }, transition: { duration: 0.55, ease: "easeIn" } };
  })();

  /* ───────────────────────── RENDER ───────────────────────── */
  return (
    <div ref={rootRef} className="nik-root" onPointerMove={onPointerMove}>
      {/* the ONE background; never swapped or animated */}
      <div className="nik-bg" style={{ backgroundImage: `url(${BG})` }} />

      <Embers fire={fire} size={size} intense={screen === "final"} />

      {/* fire response (additive glow; the image itself is untouched) */}
      {burst.n > 0 && (
        <motion.div
          key={burst.n}
          className="nik-fireglow"
          style={{ left: fire.x, top: fire.y, width: fire.r * 2, height: fire.r * 1.7, x: "-50%", y: "-50%" }}
          initial={{ opacity: 0, scale: 0.55 }}
          animate={{
            opacity: [0, burst.big ? 0.95 : 0.78, burst.big ? 0.5 : 0],
            scale: [0.55, 1.1, burst.big ? 1.25 : 1],
          }}
          transition={{ duration: 1.7, times: [0, 0.35, 1], ease: "easeOut" }}
        />
      )}

      {/* 3D ground rings expanding around the kund */}
      {burst.n > 0 &&
        [0, 1, 2].map((k) => (
          <motion.div
            key={`${burst.n}-${k}`}
            className="nik-ring"
            style={{
              left: fire.x,
              top: fire.by,
              width: fire.r * 1.5,
              height: fire.r * 1.5,
              x: "-50%",
              y: "-50%",
              rotateX: 72,
              transformPerspective: 700,
              zIndex: 2,
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1.5] }}
            transition={{ duration: 1.9, delay: k * 0.24, ease: "easeOut" }}
          />
        ))}

      <button
        type="button"
        className="nik-mute"
        onClick={sfx.toggle}
        aria-label={sfx.muted ? "Unmute sound" : "Mute sound"}
        title={sfx.muted ? "Sound off" : "Sound on"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          {sfx.muted ? (
            <path d="M17 9l4 6M21 9l-4 6" />
          ) : (
            <>
              <path d="M16.5 8.5a5 5 0 0 1 0 7" />
              <path d="M19 6a8.5 8.5 0 0 1 0 12" />
            </>
          )}
        </svg>
      </button>

      <button type="button" className="nik-exit" onClick={handleExit} aria-label="Exit game" title="Exit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <Progress stage={stage} offered={offered} show={screen !== "intro"} />

      <AnimatePresence mode="wait">
        {screen === "intro" && (
          <Intro
            key="intro"
            onBegin={() => {
              startAmbient(); // browsers allow audio only after a click
              setScreen("game");
            }}
          />
        )}

        {screen === "game" && (
          <motion.div
            key="game"
            className="nik-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="nik-stack">
              <div className="nik-wrap left">
                <AnimatePresence mode="wait">
                  <motion.section
                    key={`info-${stage}`}
                    className="nik-dock nik-info"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.55 }}
                  >
                    <div className="nik-stagelabel">
                      MANTRA {pad(stage + 1)} / {pad(TOTAL)}
                    </div>
                    <h2 className="nik-title">{mantra.title}</h2>
                    <div className="nik-source">{mantra.source}</div>
                    <div className="nik-sanskrit" lang="sa">
                      {mantra.sanskrit.map((l, i) => (
                        <span key={i} className="nik-pada">
                          {l}{" "}
                        </span>
                      ))}
                    </div>
                    <div className="nik-translit">
                      {mantra.transliteration.map((l, i) => (
                        <span key={i} className="nik-pada">
                          {l}{" "}
                        </span>
                      ))}
                    </div>
                    <Typed text={mantra.meaning} speed={14} className="nik-meaning" />
                  </motion.section>
                </AnimatePresence>
              </div>

              <div className="nik-wrap right">
                <AnimatePresence mode="wait">
                  <motion.section
                    key={`board-${stage}`}
                    className={`nik-dock nik-board${phase === "complete" ? " is-complete" : ""}${wrong ? " is-wrong" : ""}`}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.55 }}
                  >
                    <Mandala />
                    <div className="nik-labelrow">
                      <span className="nik-label">THE SEQUENCE</span>
                      <span className="nik-count">
                        {placed.length} / {mantra.units.length}
                      </span>
                    </div>
                    <div ref={seqRef} className="nik-grid nik-seq" style={{ "--rows": Math.ceil(mantra.units.length / 2) }}>
                      {mantra.units.map((_, i) => {
                        const id = placed[i];
                        const trial = !id && i === placed.length && wrongCard ? wrongCard : null;
                        const card = id ? byId(id) : trial;
                        return (
                          <div key={i} className="nik-slot" data-filled={id ? 1 : 0}>
                            {card ? (
                              <Card card={card} stageKey={stage} state={id ? "placed" : "wrong"} hidden={hideSeq} />
                            ) : (
                              <div className={`nik-empty${i === placed.length ? " next" : ""}`}>
                                <span>{pad(i + 1)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="nik-rule" />
                    <div className="nik-labelrow">
                      <span className="nik-label">AVAILABLE WORDS</span>
                    </div>
                    <div className="nik-grid nik-pool" style={{ "--rows": Math.ceil(mantra.units.length / 2) }}>
                      {cards.map((c) => {
                        const inPool = !placed.includes(c.id) && c.id !== wrong;
                        return (
                          <div key={c.id} className="nik-slot">
                            {inPool ? (
                              <Card card={c} stageKey={stage} state="pool" onPick={pick} />
                            ) : (
                              <div className="nik-ghostslot" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.section>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {screen === "final" && <Final key="final" onContinue={onContinue} />}
      </AnimatePresence>

      {/* ───── cinematic effects (non-interactive) ───── */}
      <div className="nik-fx">
        {ghosts.map((g) => {
          const card = byId(g.id);
          return (
            <React.Fragment key={g.id}>
              <motion.div
                className="nik-ghost"
                style={{ left: g.x, top: g.y, width: g.w, height: g.h }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: [0, g.dx * 0.25, g.dx],
                  y: [0, g.dy * 0.25, g.dy],
                  scale: [1, 0.92, 0.12],
                  opacity: [1, 1, 0],
                  rotate: [0, 6, 0],
                }}
                transition={{ duration: 1.45, times: [0, 0.45, 1], ease: "easeInOut" }}
              >
                <motion.div
                  className="nik-ghost-bg"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: [1, 0.3, 0] }}
                  transition={{ duration: 1.1, times: [0, 0.5, 1] }}
                />
                <motion.span
                  className="nik-ghost-text"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: [1, 0, 0] }}
                  transition={{ duration: 1.45, times: [0, 0.4, 1] }}
                >
                  {card?.sk}
                </motion.span>
              </motion.div>
              {g.ps.map((p, i) => (
                <motion.span
                  key={i}
                  className="nik-particle"
                  style={{ width: p.s, height: p.s }}
                  initial={{ x: p.sx, y: p.sy, opacity: 0, scale: 1 }}
                  animate={{ x: center.x, y: center.y, opacity: [0, 1, 0], scale: [1, 1, 0.3] }}
                  transition={{ duration: 1.0, delay: 0.2 + p.d, times: [0, 0.3, 1], ease: "easeIn" }}
                />
              ))}
            </React.Fragment>
          );
        })}

        {phase === "journey" &&
          path &&
          [1, 2, 3, 4, 5, 6].map((k) => (
            <motion.span
              key={`${stage}-tr-${k}`}
              className="nik-dot nik-trail"
              initial={{ x: center.x, y: center.y, opacity: 0, scale: 0.75 - k * 0.08 }}
              animate={{ x: path.xs, y: path.ys, opacity: [0, 0.55 / k, 0.55 / k, 0] }}
              transition={{
                x: { duration: 2, ease: "linear", delay: k * 0.055 },
                y: { duration: 2, ease: "linear", delay: k * 0.055 },
                opacity: { duration: 2, delay: k * 0.055 },
              }}
            />
          ))}

        {dotLive && (
          <motion.span
            key={`dot-${stage}`}
            className="nik-dot"
            initial={{ x: center.x, y: center.y, scale: 0, opacity: 0 }}
            animate={dot.animate}
            transition={dot.transition}
          />
        )}

        {phase === "enter" &&
          sparks.map((s, i) => (
            <motion.span
              key={`${burst.n}-${i}`}
              className="nik-particle"
              style={{ width: s.s, height: s.s }}
              initial={{ x: fire.x, y: fire.y, opacity: 0, scale: 1 }}
              animate={{ x: fire.x + s.dx, y: fire.y + s.dy, opacity: [0, 1, 0], scale: [1, 1, 0.2] }}
              transition={{ duration: 1.3, delay: 0.15 + s.d, ease: "easeOut" }}
            />
          ))}

        <AnimatePresence>
          {banner && screen === "game" && (
            <motion.div
              key={banner}
              className="nik-banner"
              style={{ x: "-50%" }}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.6 }}
            >
              {banner}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ───────────────────────── SCREENS ───────────────────────── */

function Intro({ onBegin }) {
  const { shown, done, skip } = useTypewriter(INTRO_TEXT, 24);
  return (
    <motion.div
      className="nik-layer nik-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      <motion.div className="nik-bar top" initial={{ y: -60 }} animate={{ y: 0 }} transition={{ duration: 1.2 }} />
      <motion.div className="nik-bar bottom" initial={{ y: 60 }} animate={{ y: 0 }} transition={{ duration: 1.2 }} />
      <motion.div
        className="nik-intro"
        initial={{ opacity: 0, y: 20, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 0.8, 0.3, 1] }}
        style={{ transformPerspective: 1000 }}
      >
        <div className="nik-chapter">CHAPTER XVIII · THE FALL OF INDRAJIT</div>
        <h1 className="nik-h1">THE RITUAL OF NIKUMBHILA</h1>
        <div className="nik-divider" aria-hidden="true">
          ❖
        </div>
        <p className="nik-narration" onClick={skip}>
          <span aria-hidden="true">
            “{shown}
            {done ? "”" : ""}
          </span>
          <span className="nik-sr">{INTRO_TEXT}</span>
        </p>
        <motion.button
          type="button"
          className="nik-btn"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: done ? 1 : 0, y: done ? 0 : 8 }}
          transition={{ duration: 0.7 }}
          style={{ pointerEvents: done ? "auto" : "none" }}
          onClick={onBegin}
          tabIndex={done ? 0 : -1}
        >
          BEGIN THE RITUAL
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function Final({ onContinue }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setGo(true), 700);
    return () => clearTimeout(id);
  }, []);
  const { shown, done } = useTypewriter(FINAL_TEXT, 24, go);
  return (
    <motion.div
      className="nik-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="nik-stack">
        <div className="nik-wrap left">
          <section className="nik-dock nik-finalbox">
            <h2 className="nik-title nik-final-title">THE FIVE OFFERINGS ARE COMPLETE</h2>
            <div className="nik-divider" aria-hidden="true">
              ❖
            </div>
            <p className="nik-meaning">
              <span aria-hidden="true">{shown}</span>
              <span className="nik-sr">{FINAL_TEXT}</span>
            </p>
            <motion.div className="nik-completed" initial={{ opacity: 0 }} animate={{ opacity: done ? 1 : 0 }} transition={{ duration: 0.9 }}>
              RITUAL COMPLETED
            </motion.div>
            <motion.button
              type="button"
              className="nik-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: done ? 1 : 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
              style={{ pointerEvents: done ? "auto" : "none" }}
              onClick={() => onContinue && onContinue()}
              tabIndex={done ? 0 : -1}
            >
              CONTINUE
            </motion.button>
          </section>
        </div>
      </div>
    </motion.div>
  );
}