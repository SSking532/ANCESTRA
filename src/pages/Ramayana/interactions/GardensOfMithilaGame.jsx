import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Eye,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import "./GardensOfMithilaGame.css";

/* =========================================================
   ANCESTRA — RAMAYANA
   CHAPTER IV
   GAME I — THE GARDENS OF MITHILA  (cinematic edition)

   • 3D camera tilt + parallax, drifting mist, light shafts
   • Canvas petals & golden motes
   • Lantern-lit observation phase
   • "The garden shifts" reveal transition
   • Forgiving hotspot detection + hint system
   • Synth sound design, timer, rating, stats
========================================================= */

const BASE = "/images/ramayana/interactions";
const GARDEN_AUDIO = "/audio/garden.mp3";

const ASSETS = {
  original: `${BASE}/mithila-garden.jpg`,
  changed: `${BASE}/mithila-garden-changed.jpg`,
  hotspots: `${BASE}/mithila-garden-hotspots.png`,
};

const STUDY_MS = 20000; // length of the memorising ring
const SHIFT_MS = 2400; // length of the reveal transition
const MAX_HINTS = 3;

/* =========================================================
   HOTSPOT COLORS (unchanged logic)
========================================================= */

const MASK_COLORS = {
  flowers: { r: 255, g: 0, b: 0, name: "The Flowers", label: "The flowers have changed." },
  chandelier: { r: 0, g: 0, b: 255, name: "The Hanging Lamp", label: "The hanging fixture has changed." },
  peacock: { r: 0, g: 255, b: 0, name: "The Stone Figure", label: "The stone object has changed." },
  lotus: { r: 255, g: 255, b: 0, name: "The Lotus Pond", label: "The lotus flowers have changed." },
  drape: { r: 128, g: 0, b: 128, name: "The Archway", label: "The palace archway has changed." },
};

const TOTAL = Object.keys(MASK_COLORS).length;

const getClosestMaskColor = (r, g, b, alpha) => {
  if (alpha < 40) return null;

  let closestId = null;
  let closestDistance = Infinity;

  Object.entries(MASK_COLORS).forEach(([id, color]) => {
    const distance = Math.sqrt(
      Math.pow(r - color.r, 2) +
        Math.pow(g - color.g, 2) +
        Math.pow(b - color.b, 2)
    );
    if (distance < closestDistance) {
      closestDistance = distance;
      closestId = id;
    }
  });

  if (closestDistance > 170) return null;
  return closestId;
};

/* =========================================================
   SOUND DESIGN — synthesised, no extra files
========================================================= */

function useSfx(mutedRef) {
  const ctxRef = useRef(null);

  const play = useCallback(
    (kind, step = 0) => {
      if (mutedRef.current) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = ctxRef.current || (ctxRef.current = new AC());
        if (ctx.state === "suspended") ctx.resume();
        const t = ctx.currentTime;

        const tone = (freq, start, dur, type, vol, glideTo) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = type;
          o.frequency.setValueAtTime(freq, t + start);
          if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + start + dur);
          g.gain.setValueAtTime(0.0001, t + start);
          g.gain.exponentialRampToValueAtTime(vol, t + start + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(t + start);
          o.stop(t + start + dur + 0.05);
        };

        const SCALE = [392, 440, 523.25, 659.25, 783.99, 880];

        if (kind === "found") {
          const f = SCALE[step % SCALE.length];
          tone(f, 0, 1.7, "sine", 0.1);
          tone(f * 2, 0.02, 1.2, "sine", 0.035);
          tone(f * 1.5, 0.12, 1.4, "triangle", 0.03);
        } else if (kind === "miss") {
          tone(170, 0, 0.35, "sine", 0.07, 85);
        } else if (kind === "shift") {
          tone(110, 0, 2.2, "triangle", 0.05, 220);
          tone(220, 0.1, 2.2, "sine", 0.05, 440);
          tone(330, 0.3, 2.2, "sine", 0.04, 660);
        } else if (kind === "hint") {
          tone(1046, 0, 0.9, "sine", 0.04);
          tone(1568, 0.08, 0.8, "sine", 0.02);
        } else if (kind === "start") {
          tone(523.25, 0, 1.4, "sine", 0.05);
          tone(783.99, 0.1, 1.4, "sine", 0.03);
        } else if (kind === "win") {
          [392, 523.25, 659.25, 783.99].forEach((f, i) =>
            tone(f, i * 0.18, 2.6, "sine", 0.08)
          );
        }
      } catch {
        /* audio is optional */
      }
    },
    [mutedRef]
  );

  useEffect(
    () => () => {
      ctxRef.current?.close?.().catch?.(() => {});
      ctxRef.current = null;
    },
    []
  );

  return play;
}

/* =========================================================
   PARTICLES — drifting petals + golden motes (canvas)
========================================================= */

function GardenParticles({ level }) {
  const ref = useRef(null);
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const petals = Array.from({ length: reduce ? 8 : 34 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 5 + Math.random() * 9,
      vy: 0.00012 + Math.random() * 0.00022,
      vx: 0.00004 + Math.random() * 0.00014,
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.03,
      ph: Math.random() * 6.28,
      hue: Math.random() < 0.6 ? 340 : 38,
    }));

    const motes = Array.from({ length: reduce ? 14 : 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 2,
      ph: Math.random() * 6.28,
      sp: 0.00003 + Math.random() * 0.00007,
    }));

    const draw = (t) => {
      const L = levelRef.current;
      ctx.clearRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      motes.forEach((m) => {
        m.x += Math.cos(t * 0.0002 + m.ph) * 0.00008;
        m.y -= m.sp;
        if (m.y < -0.02) {
          m.y = 1.02;
          m.x = Math.random();
        }
        const a = (0.25 + 0.35 * Math.sin(t * 0.0014 + m.ph)) * L;
        const x = m.x * w;
        const y = m.y * h;
        const g = ctx.createRadialGradient(x, y, 0, x, y, m.r * 6);
        g.addColorStop(0, `rgba(255,226,150,${a})`);
        g.addColorStop(1, "rgba(255,226,150,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, m.r * 6, 0, 6.283);
        ctx.fill();
      });

      ctx.globalCompositeOperation = "source-over";
      petals.forEach((p) => {
        p.y += p.vy * 16;
        p.x += p.vx * 16 + Math.sin(t * 0.0008 + p.ph) * 0.0004;
        p.rot += p.vr;
        if (p.y > 1.05) {
          p.y = -0.05;
          p.x = Math.random();
        }
        if (p.x > 1.05) p.x = -0.05;

        ctx.save();
        ctx.translate(p.x * w, p.y * h);
        ctx.rotate(p.rot);
        ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(t * 0.001 + p.ph)));
        ctx.globalAlpha = 0.55 * L;
        ctx.fillStyle = `hsl(${p.hue},70%,${p.hue > 300 ? 78 : 68}%)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s, p.s * 0.5, 0, 0, 6.283);
        ctx.fill();
        ctx.restore();
      });

      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="gardens-particles" aria-hidden="true" />;
}

/* =========================================================
   FOREGROUND LEAVES — gives the 2D painting real depth
========================================================= */

const LEAF = "M0 0C30-26 82-30 118 0C82 30 30 26 0 0Z";
const LEAVES = [
  [0, 60, 35, 1.9],
  [60, 20, 20, 1.5],
  [130, 6, 10, 1.2],
  [18, 150, 60, 1.6],
  [30, 240, 80, 1.3],
  [190, 0, 6, 0.9],
  [90, 110, 45, 1.1],
  [10, 330, 95, 0.9],
];
const BLOOMS = [
  [150, 120, 10],
  [70, 215, 8],
  [255, 36, 7],
];

function Foreground() {
  const corners = [
    "",
    "translate(1600 0) scale(-1 1)",
    "translate(0 900) scale(1 -1)",
    "translate(1600 900) scale(-1 -1)",
  ];

  return (
    <svg
      className="gardens-foreground"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gm-leaf" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#16301c" />
          <stop offset="1" stopColor="#4f7a3a" />
        </linearGradient>
      </defs>
      {corners.map((tf, c) => (
        <g key={c} transform={tf} opacity={c > 1 ? 0.8 : 1}>
          {LEAVES.map(([x, y, r, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
              <path
                className="gardens-leaf"
                d={LEAF}
                fill="url(#gm-leaf)"
                style={{ animationDelay: `${-(i * 0.7 + c * 1.3)}s` }}
              />
            </g>
          ))}
          {BLOOMS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#f3b6c6" opacity="0.9" />
          ))}
        </g>
      ))}
    </svg>
  );
}

/* =========================================================
   SMALL VISUAL PIECES
========================================================= */

function Mandala({ className = "" }) {
  return (
    <svg className={`gardens-mandala ${className}`} viewBox="-100 -100 200 200" aria-hidden="true">
      <g className="gardens-mandala__outer">
        {Array.from({ length: 16 }, (_, i) => (
          <ellipse key={i} cx="0" cy="-74" rx="7" ry="22" transform={`rotate(${i * 22.5})`} />
        ))}
      </g>
      <g className="gardens-mandala__inner">
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="0" cy="-46" rx="9" ry="24" transform={`rotate(${i * 45})`} />
        ))}
      </g>
      <circle r="92" />
      <circle r="30" />
      <circle r="4" className="core" />
    </svg>
  );
}

function Letters({ text, delay = 0 }) {
  return (
    <span className="gardens-letters" aria-label={text}>
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          initial={{ opacity: 0, y: 34, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.045, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* =========================================================
   COMPONENT
========================================================= */

export default function GardensOfMithilaGame({ onComplete = () => {} }) {
  const [screen, setScreen] = useState("intro"); // intro | observe | shifting | changed | complete
  const [foundChanges, setFoundChanges] = useState([]);
  const [foundPositions, setFoundPositions] = useState([]);
  const [wrongClick, setWrongClick] = useState(false);
  const [lastFound, setLastFound] = useState(null);
  const [maskReady, setMaskReady] = useState(false);
  const [maskError, setMaskError] = useState(false);
  const [pings, setPings] = useState([]);
  const [bursts, setBursts] = useState([]);
  const [hint, setHint] = useState(null);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [studyReady, setStudyReady] = useState(false);
  const [muted, setMuted] = useState(false);

  /* ---------- refs ---------- */
  const rootRef = useRef(null);
  const worldRef = useRef(null);
  const changedImageRef = useRef(null);
  const maskImageRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const maskCtxRef = useRef(null);
  const targetsRef = useRef({});
  const gardenAudioRef = useRef(null);
  const timers = useRef([]);
  const mutedRef = useRef(false);
  const statsRef = useRef({ misses: 0, hints: 0 });
  const elapsedRef = useRef(0);
  const finishingRef = useRef(false);

  mutedRef.current = muted;
  elapsedRef.current = elapsed;

  const sfx = useSfx(mutedRef);

  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* =======================================================
     GARDEN AUDIO
  ======================================================= */

  useEffect(() => {
    const audio = new Audio(GARDEN_AUDIO);
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = "auto";
    gardenAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      gardenAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (gardenAudioRef.current) gardenAudioRef.current.muted = muted;
  }, [muted]);

  const startGardenAudio = () => {
    const audio = gardenAudioRef.current;
    if (!audio) return;
    audio.volume = 0.3;
    if (audio.paused) {
      const promise = audio.play();
      if (promise && typeof promise.catch === "function") promise.catch(() => {});
    }
  };

  const stopGardenAudio = () => {
    const audio = gardenAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  /* =======================================================
     CAMERA — smoothed pointer parallax + lantern position
  ======================================================= */

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width - 0.5;
      target.y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--lx", `${e.clientX - r.left}px`);
      el.style.setProperty("--ly", `${e.clientY - r.top}px`);
    };
    el.addEventListener("pointermove", onMove, { passive: true });

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      el.style.setProperty("--mx", cur.x.toFixed(4));
      el.style.setProperty("--my", cur.y.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* =======================================================
     TIMER (only while hunting differences)
  ======================================================= */

  useEffect(() => {
    if (screen !== "changed") return undefined;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [screen]);

  /* =======================================================
     HOTSPOT MASK
  ======================================================= */

  const computeTargets = (ctx, w, h) => {
    const step = Math.max(3, Math.round(w / 320));
    const data = ctx.getImageData(0, 0, w, h).data;
    const pts = {};

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const id = getClosestMaskColor(data[i], data[i + 1], data[i + 2], data[i + 3]);
        if (id) {
          if (!pts[id]) pts[id] = [];
          pts[id].push([x, y]);
        }
      }
    }

    const out = {};
    Object.entries(pts).forEach(([id, list]) => {
      let sx = 0;
      let sy = 0;
      list.forEach((p) => {
        sx += p[0];
        sy += p[1];
      });
      const cx = sx / list.length;
      const cy = sy / list.length;
      let best = list[0];
      let bd = Infinity;
      list.forEach((p) => {
        const d = (p[0] - cx) ** 2 + (p[1] - cy) ** 2;
        if (d < bd) {
          bd = d;
          best = p;
        }
      });
      out[id] = { x: best[0] / w, y: best[1] / h };
    });
    return out;
  };

  const prepareMask = useCallback(() => {
    const mask = maskImageRef.current;
    if (!mask || !mask.naturalWidth || !mask.naturalHeight) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = mask.naturalWidth;
      canvas.height = mask.naturalHeight;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        setMaskError(true);
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(mask, 0, 0);

      maskCanvasRef.current = canvas;
      maskCtxRef.current = context;

      try {
        targetsRef.current = computeTargets(context, canvas.width, canvas.height);
      } catch {
        targetsRef.current = {};
      }

      setMaskReady(true);
      setMaskError(false);
    } catch {
      setMaskError(true);
    }
  }, []);

  const handleMaskError = useCallback(() => {
    setMaskReady(false);
    setMaskError(true);
  }, []);

  /* =======================================================
     FLOW
  ======================================================= */

  const resetRound = () => {
    setFoundChanges([]);
    setFoundPositions([]);
    setWrongClick(false);
    setLastFound(null);
    setPings([]);
    setBursts([]);
    setHint(null);
    setHintsLeft(MAX_HINTS);
    setElapsed(0);
    setResult(null);
    statsRef.current = { misses: 0, hints: 0 };
    finishingRef.current = false;
  };

  const beginObservation = () => {
    startGardenAudio();
    sfx("start");
    resetRound();
    setStudyReady(false);
    later(() => setStudyReady(true), STUDY_MS);
    setScreen("observe");
  };

  const revealChanges = () => {
    startGardenAudio();
    resetRound();
    sfx("shift");
    setScreen("shifting");
    later(() => setScreen("changed"), SHIFT_MS);
  };

  const restart = () => {
    stopGardenAudio();
    startGardenAudio();
    beginObservation();
  };

  /* =======================================================
     KEYBOARD — Enter to begin, Esc to leave
  ======================================================= */

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        onComplete?.();
      } else if (e.key === "Enter" && screen === "intro" && e.target.tagName !== "BUTTON") {
        beginObservation();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  /* =======================================================
     GEOMETRY HELPERS
  ======================================================= */

  const getGeometry = () => {
    const world = worldRef.current;
    const img = changedImageRef.current;
    if (!world || !img || !img.naturalWidth || !img.naturalHeight) return null;

    const wr = world.getBoundingClientRect();
    const ir = img.getBoundingClientRect();
    const scale = Math.min(ir.width / img.naturalWidth, ir.height / img.naturalHeight);
    const rw = img.naturalWidth * scale;
    const rh = img.naturalHeight * scale;

    return {
      wr,
      scale,
      rw,
      rh,
      nw: img.naturalWidth,
      nh: img.naturalHeight,
      ox: ir.left + (ir.width - rw) / 2,
      oy: ir.top + (ir.height - rh) / 2,
    };
  };

  const toPct = (g, cx, cy) => ({
    x: ((cx - g.wr.left) / g.wr.width) * 100,
    y: ((cy - g.wr.top) / g.wr.height) * 100,
  });

  /* forgiving probe: checks the click pixel, then two rings around it */
  const probe = (mx, my) => {
    const ctx = maskCtxRef.current;
    const c = maskCanvasRef.current;
    if (!ctx || !c) return null;

    const rad = Math.max(6, Math.round(c.width * 0.006));
    const offs = [[0, 0]];
    [1, 2].forEach((k) => {
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4;
        offs.push([Math.round(Math.cos(ang) * rad * k), Math.round(Math.sin(ang) * rad * k)]);
      }
    });

    for (const [dx, dy] of offs) {
      const x = mx + dx;
      const y = my + dy;
      if (x < 0 || y < 0 || x >= c.width || y >= c.height) continue;
      const d = ctx.getImageData(x, y, 1, 1).data;
      const id = getClosestMaskColor(d[0], d[1], d[2], d[3]);
      if (id) return id;
    }
    return null;
  };

  /* =======================================================
     MISS
  ======================================================= */

  const registerMiss = (event, geo, penalize = true) => {
    setWrongClick(true);
    later(() => setWrongClick(false), 900);

    if (penalize) {
      statsRef.current.misses += 1;
      sfx("miss");
    }

    if (event) {
      const g = geo || getGeometry();
      if (g) {
        const p = toPct(g, event.clientX, event.clientY);
        const id = `${Date.now()}-${Math.random()}`;
        setPings((cur) => [...cur, { id, ...p }]);
        later(() => setPings((cur) => cur.filter((x) => x.id !== id)), 800);
      }
    }
  };

  /* =======================================================
     CLICK → FIND CHANGE
  ======================================================= */

  const inspectGarden = useCallback(
    (event) => {
      if (screen !== "changed" || finishingRef.current) return;

      if (!maskReady) {
        registerMiss(event, null, false);
        return;
      }

      const g = getGeometry();
      if (!g) {
        registerMiss(event, null, false);
        return;
      }

      const cx = event.clientX;
      const cy = event.clientY;

      if (cx < g.ox || cx > g.ox + g.rw || cy < g.oy || cy > g.oy + g.rh) {
        registerMiss(event, g);
        return;
      }

      const fx = (cx - g.ox) / g.rw;
      const fy = (cy - g.oy) / g.rh;
      const canvas = maskCanvasRef.current;
      const mx = Math.floor(fx * canvas.width);
      const my = Math.floor(fy * canvas.height);

      const changeId = probe(mx, my);

      if (!changeId) {
        registerMiss(event, g);
        return;
      }

      if (foundChanges.includes(changeId)) return;

      const change = MASK_COLORS[changeId];
      const target = targetsRef.current[changeId];
      const pos = target
        ? toPct(g, g.ox + target.x * g.rw, g.oy + target.y * g.rh)
        : toPct(g, cx, cy);

      setFoundPositions((cur) => [...cur, { id: changeId, ...pos }]);
      setFoundChanges((cur) => [...cur, changeId]);
      setHint(null);
      setWrongClick(false);

      const burstId = `${changeId}-${Date.now()}`;
      setBursts((cur) => [...cur, { id: burstId, ...pos }]);
      later(() => setBursts((cur) => cur.filter((b) => b.id !== burstId)), 1600);

      sfx("found", foundChanges.length);

      setLastFound({ id: changeId, text: change.label });
      later(() => setLastFound(null), 1400);

      if (foundChanges.length + 1 === TOTAL) {
        finishingRef.current = true;
        later(() => {
          setResult({
            time: elapsedRef.current,
            misses: statsRef.current.misses,
            hints: statsRef.current.hints,
          });
          sfx("win");
          setScreen("complete");
        }, 1800);
      }
    },
    [screen, maskReady, foundChanges, sfx] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /* =======================================================
     HINT
  ======================================================= */

  const useHint = () => {
    if (hintsLeft <= 0 || screen !== "changed" || finishingRef.current) return;
    const g = getGeometry();
    if (!g) return;

    const remaining = Object.keys(MASK_COLORS).filter(
      (id) => !foundChanges.includes(id) && targetsRef.current[id]
    );
    if (!remaining.length) return;

    const id = remaining[Math.floor(Math.random() * remaining.length)];
    const t = targetsRef.current[id];
    const pos = toPct(g, g.ox + t.x * g.rw, g.oy + t.y * g.rh);

    statsRef.current.hints += 1;
    setHintsLeft((n) => n - 1);
    sfx("hint");

    const key = `${id}-${Date.now()}`;
    setHint({ key, ...pos });
    later(() => setHint((h) => (h && h.key === key ? null : h)), 2800);
  };

  /* =======================================================
     DERIVED
  ======================================================= */

  const rating = useMemo(() => {
    if (!result) return null;
    const pen = result.misses + result.hints * 2;
    const stars = pen <= 2 ? 3 : pen <= 6 ? 2 : 1;
    return { stars, title: ["Patient Wanderer", "Keen Observer", "Eye of the Garden"][stars - 1] };
  }, [result]);

  const particleLevel =
    screen === "changed" ? 0.35 : screen === "shifting" ? 1.2 : screen === "complete" ? 1 : 0.9;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      ref={rootRef}
      className={["gardens-game", `gardens-game--${screen}`, wrongClick ? "is-wrong" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ===================================================
          3D CAMERA + WORLD
      =================================================== */}
      <div className="gardens-camera">
        <div ref={worldRef} className="gardens-world">
          <img
            className="gardens-world__backdrop"
            src={ASSETS.original}
            alt=""
            aria-hidden="true"
            draggable="false"
          />

          <img
            src={ASSETS.original}
            alt=""
            className="gardens-world__image gardens-world__image--original"
            draggable="false"
          />

          <img
            ref={changedImageRef}
            src={ASSETS.changed}
            alt=""
            className="gardens-world__image gardens-world__image--changed"
            draggable="false"
          />

          <div className="gardens-world__shade" />
          <div className="gardens-world__mist gardens-world__mist--one" />
          <div className="gardens-world__mist gardens-world__mist--two" />
          <div className="gardens-rays" />
          <div className="gardens-world__shimmer" />
        </div>

        <Foreground />
      </div>

      <GardenParticles level={particleLevel} />

      <div className="gardens-lantern" />
      <div className="gardens-world__vignette" />
      <div className="gardens-world__grain" />
      <div className="gardens-wrongflash" />

      <div className="gardens-frame" aria-hidden="true">
        <i /> <i /> <i /> <i />
      </div>

      {/* hidden hotspot mask */}
      <img
        ref={maskImageRef}
        src={ASSETS.hotspots}
        alt=""
        className="gardens-mask-image"
        aria-hidden="true"
        draggable="false"
        onLoad={prepareMask}
        onError={handleMaskError}
      />

      {/* ===================================================
          CONTROLS (always visible)
      =================================================== */}
      <div className="gardens-controls">
        <button
          type="button"
          className="gardens-icon-button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute garden sound" : "Mute garden sound"}
        >
          {muted ? <VolumeX size={15} strokeWidth={1.4} /> : <Volume2 size={15} strokeWidth={1.4} />}
        </button>

        <button
          type="button"
          className="gardens-icon-button gardens-icon-button--esc"
          onClick={() => onComplete?.()}
          aria-label="Exit (Esc)"
        >
          <X size={14} strokeWidth={1.6} />
          <span>ESC</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* =================================================
            INTRO
        ================================================= */}
        {screen === "intro" && (
          <motion.div
            key="intro"
            className="gardens-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
            transition={{ duration: 0.9 }}
          >
            <Mandala className="gardens-mandala--bg" />

            <div className="gardens-intro">
              <motion.span
                className="gardens-eyebrow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                CHAPTER IV · THE FIRST GARDEN
              </motion.span>

              <motion.div
                className="gardens-ornament"
                initial={{ opacity: 0, scaleX: 0.2 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.9 }}
              >
                <i />
                <b>✦</b>
                <i />
              </motion.div>

              <h1 className="gardens-title">
                <span className="gardens-title__line">
                  <Letters text="The Gardens of" delay={0.7} />
                </span>
                <em className="gardens-title__line gardens-title__gold">
                  <Letters text="Mithila" delay={1.35} />
                </em>
              </h1>

              <motion.p
                className="gardens-lede"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.0, duration: 0.9 }}
              >
                Some moments are remembered because they were quiet.
              </motion.p>

              <motion.small
                className="gardens-small"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.3, duration: 0.9 }}
              >
                Observe the garden carefully
              </motion.small>

              <motion.button
                type="button"
                className="gardens-button gardens-button--primary"
                onClick={beginObservation}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.6, duration: 0.8 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>OBSERVE THE GARDEN</span>
                <Sparkles size={15} strokeWidth={1.2} />
              </motion.button>

              <motion.span
                className="gardens-note"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3, duration: 1 }}
              >
                MEMORY · PATIENCE · ATTENTION
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* =================================================
            OBSERVE
        ================================================= */}
        {screen === "observe" && (
          <motion.div
            key="observe"
            className="gardens-observation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="gardens-top-label">
              <span>THE GARDENS OF MITHILA</span>
              <strong>Observe carefully</strong>
            </div>

            <div className="gardens-observation__message">
              <p>Study the entire garden.</p>
              <small>
                Remember the flowers, objects, architecture and small details. Move your light
                across the scene.
              </small>
            </div>

            <button
              type="button"
              className={`gardens-observe-button ${studyReady ? "is-ready" : ""}`}
              onClick={revealChanges}
              style={{ "--study": `${STUDY_MS}ms` }}
            >
              <Eye size={16} strokeWidth={1.3} />
              <span className="gardens-observe-button__text">
                <span>I HAVE OBSERVED THE GARDEN</span>
                <span>{studyReady ? "THE GARDEN IS READY TO CHANGE" : "KEEP LOOKING…"}</span>
              </span>
              <i className="gardens-observe-button__bar" />
            </button>
          </motion.div>
        )}

        {/* =================================================
            SHIFTING
        ================================================= */}
        {screen === "shifting" && (
          <motion.div
            key="shifting"
            className="gardens-shift"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="gardens-ripples" aria-hidden="true">
              <i /> <i /> <i />
            </div>
            <motion.span
              className="gardens-eyebrow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              A MOMENT PASSES
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, filter: "blur(12px)", scale: 0.96 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              transition={{ delay: 0.6, duration: 1.1 }}
            >
              Look again.
            </motion.h2>
          </motion.div>
        )}

        {/* =================================================
            CHANGED — find the differences
        ================================================= */}
        {screen === "changed" && (
          <motion.div
            key="changed"
            className="gardens-changed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="gardens-click-layer" onClick={inspectGarden} role="presentation">
              {foundPositions.map((p) => (
                <span
                  key={p.id}
                  className="gardens-found-ring"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <Check size={16} strokeWidth={1.6} />
                  <em>{MASK_COLORS[p.id].name}</em>
                </span>
              ))}

              {pings.map((p) => (
                <span key={p.id} className="gardens-ping" style={{ left: `${p.x}%`, top: `${p.y}%` }} />
              ))}

              {bursts.map((b) => (
                <span key={b.id} className="gardens-burst" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
                  {Array.from({ length: 16 }, (_, i) => (
                    <i
                      key={i}
                      style={{
                        "--a": `${i * 22.5}deg`,
                        "--r": `${46 + (i % 4) * 22}px`,
                        "--dl": `${(i % 5) * 0.03}s`,
                      }}
                    />
                  ))}
                </span>
              ))}

              {hint && (
                <span key={hint.key} className="gardens-hint-ring" style={{ left: `${hint.x}%`, top: `${hint.y}%` }}>
                  <i />
                  <i />
                </span>
              )}
            </div>

            <div className="gardens-timer">
              <span>TIME</span>
              <strong>{fmt(elapsed)}</strong>
            </div>

            <header className="gardens-changed__header">
              <span>THE GARDEN HAS CHANGED</span>
              <strong>Find the five differences</strong>
              <div className="gardens-pips" aria-label={`${foundChanges.length} of ${TOTAL} found`}>
                {Object.keys(MASK_COLORS).map((id, i) => (
                  <b key={id} className={i < foundChanges.length ? "on" : ""} />
                ))}
                <small>
                  {foundChanges.length} / {TOTAL} FOUND
                </small>
              </div>
            </header>

            <div className="gardens-tray">
              {Object.entries(MASK_COLORS).map(([id, c], i) => {
                const on = foundChanges.includes(id);
                return (
                  <div key={id} className={`gardens-chip ${on ? "is-found" : ""}`}>
                    <span>{on ? <Check size={12} strokeWidth={2} /> : i + 1}</span>
                    <em>{on ? c.name : "???"}</em>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="gardens-hint-button"
              onClick={useHint}
              disabled={hintsLeft <= 0}
            >
              <Lightbulb size={14} strokeWidth={1.4} />
              <span>HINT</span>
              <b>{hintsLeft}</b>
            </button>

            <AnimatePresence>
              {wrongClick && (
                <motion.div
                  key="wrong"
                  className="gardens-feedback gardens-feedback--wrong"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <span>
                    {maskReady ? "Nothing appears different here." : "The garden is still waking…"}
                  </span>
                </motion.div>
              )}

              {lastFound && (
                <motion.div
                  key="found"
                  className="gardens-feedback gardens-feedback--correct"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <Check size={15} strokeWidth={1.4} />
                  <span>{lastFound.text}</span>
                </motion.div>
              )}

              {maskError && (
                <motion.div
                  key="maskerr"
                  className="gardens-feedback gardens-feedback--wrong"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>The garden memory map could not be loaded.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* =================================================
            COMPLETE
        ================================================= */}
        {screen === "complete" && (
          <motion.div
            key="complete"
            className="gardens-overlay gardens-overlay--complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <Mandala className="gardens-mandala--bg" />

            <div className="gardens-complete">
              <motion.span
                className="gardens-eyebrow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                FIVE CHANGES DISCOVERED
              </motion.span>

              <div className="gardens-ornament">
                <i />
                <b>✦</b>
                <i />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                The garden revealed itself.
              </motion.h2>

              {rating && (
                <>
                  <div className="gardens-stars" aria-label={`${rating.stars} of 3 stars`}>
                    {[1, 2, 3].map((n) => (
                      <motion.span
                        key={n}
                        className={n <= rating.stars ? "on" : ""}
                        initial={{ opacity: 0, scale: 0.2, rotate: -90 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: 1 + n * 0.28, type: "spring", stiffness: 160, damping: 12 }}
                      >
                        <Star size={26} strokeWidth={1.2} />
                      </motion.span>
                    ))}
                  </div>

                  <motion.p
                    className="gardens-rank"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 0.8 }}
                  >
                    {rating.title}
                  </motion.p>

                  <motion.div
                    className="gardens-stats"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2, duration: 0.8 }}
                  >
                    <div>
                      <strong>{fmt(result.time)}</strong>
                      <span>TIME</span>
                    </div>
                    <div>
                      <strong>{result.misses}</strong>
                      <span>MISSED</span>
                    </div>
                    <div>
                      <strong>{result.hints}</strong>
                      <span>HINTS</span>
                    </div>
                  </motion.div>
                </>
              )}

              <motion.blockquote
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.6, duration: 1 }}
              >
                Not every important moment announces itself.
              </motion.blockquote>

              <motion.div
                className="gardens-complete__actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3, duration: 0.8 }}
              >
                <button type="button" className="gardens-button gardens-button--primary" onClick={onComplete}>
                  <span>RETURN TO THE JOURNEY</span>
                </button>

                <button type="button" className="gardens-restart" onClick={restart}>
                  <RotateCcw size={13} strokeWidth={1.2} />
                  PLAY AGAIN
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}