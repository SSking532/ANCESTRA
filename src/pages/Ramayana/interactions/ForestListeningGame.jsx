import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Check,
  Eye,
  Footprints,
  Leaf,
  Volume2,
  VolumeX,
  Waves,
  X,
} from "lucide-react";

import "./ForestListeningGame.css";

/* =========================================================
   ANCESTRA — RAMAYANA · CHAPTER III — THE FOREST LISTENS
   v2: true CSS-3D depth, firefly canvas, proximity "listening",
   sound ripples, synthesized chimes, cinematic camera.
========================================================= */

const BASE = "/images/ramayana/interactions";
const EXTS = ["jpg", "jpeg", "png", "webp"];

// every layer tries several file extensions before giving up
const sourcesFor = (names) =>
  names.flatMap((n) => EXTS.map((ext) => `${BASE}/${n}.${ext}`));

const FOREST = {
  background: sourcesFor(["forest-bg", "forest-background", "background"]),
  mid: sourcesFor(["forest-mid", "forest-midground"]),
  foreground: sourcesFor(["forest-foreground", "forest-fg"]),
  light: sourcesFor(["forest-light", "forest-rays"]),
  animals: sourcesFor(["forest-animals", "forest-animal", "animals"]),
};

const FOREST_AUDIO = "/audio/forest.mp3";
const NOTES = [392, 440, 523.25, 659.25]; // G A C E — a calm pentatonic phrase

const DISCOVERIES = [
  {
    id: "peacock",
    number: "01",
    label: "The bird",
    title: "The Peacock Watches",
    description:
      "A peacock stands quietly among the trees. It has not fled. It has simply become still, watching the forest before it.",
    icon: Eye,
    position: { left: "30%", top: "34%" },
  },
  {
    id: "tracks",
    number: "02",
    label: "The forest floor",
    title: "Something Passed Here",
    description:
      "The leaves are disturbed along a narrow path. Something living passed through recently, leaving only the smallest trace.",
    icon: Footprints,
    position: { left: "47%", top: "68%" },
  },
  {
    id: "deer",
    number: "03",
    label: "The wilderness",
    title: "A Deer in the Distance",
    description:
      "Beyond the clearing, a deer remains among the deeper trees. It watches from a safe distance and waits.",
    icon: Leaf,
    position: { left: "68%", top: "48%" },
  },
  {
    id: "water",
    number: "04",
    label: "The water",
    title: "The Distant Current",
    description:
      "Somewhere beyond the trees, water continues its quiet rhythm. Even when the forest grows still, the current does not stop.",
    icon: Waves,
    position: { left: "78%", top: "67%" },
  },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* =========================================================
   MAIN
========================================================= */

export default function ForestListeningGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [found, setFound] = useState([]);
  const [active, setActive] = useState(null);
  const [muted, setMuted] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [hintOn, setHintOn] = useState(false);

  const frameRef = useRef(null);
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const pointRefs = useRef({});
  const pointer = useRef({ x: 0.5, y: 0.5, px: -999, py: -999 });
  const smooth = useRef({ x: 0.5, y: 0.5 });

  /* ---------- ambient audio ---------- */
  useEffect(() => {
    const audio = new Audio(FOREST_AUDIO);
    audio.loop = true;
    audio.volume = 0.28;
    audio.preload = "auto";
    audioRef.current = audio;

    const start = () => audio.play().catch(() => {});
    start();
    const unlock = () => {
      start();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      ctxRef.current?.close?.().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const chime = useCallback(
    (i) => {
      if (muted) return;
      try {
        if (!ctxRef.current) {
          ctxRef.current = new (window.AudioContext ||
            window.webkitAudioContext)();
        }
        const ctx = ctxRef.current;
        const t = ctx.currentTime;
        [1, 2].forEach((mult, k) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = NOTES[i % 4] * mult;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(k ? 0.03 : 0.11, t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
          o.connect(g).connect(ctx.destination);
          o.start(t);
          o.stop(t + 2.3);
        });
      } catch {
        /* audio is optional */
      }
    },
    [muted]
  );

  /* ---------- camera + proximity loop ---------- */
  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = clamp(e.clientX / window.innerWidth, 0, 1);
      pointer.current.y = clamp(e.clientY / window.innerHeight, 0, 1);
      pointer.current.px = e.clientX;
      pointer.current.py = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf;
    const tick = () => {
      const s = smooth.current;
      const p = pointer.current;
      s.x += (p.x - s.x) * 0.06;
      s.y += (p.y - s.y) * 0.06;

      const frame = frameRef.current;
      if (frame) {
        const r = frame.getBoundingClientRect();
        frame.style.setProperty("--mx", (s.x - 0.5).toFixed(4));
        frame.style.setProperty("--my", (s.y - 0.5).toFixed(4));
        frame.style.setProperty("--lx", `${p.px - r.left}px`);
        frame.style.setProperty("--ly", `${p.py - r.top}px`);

        // "listening": hotspots swell as the cursor draws near
        Object.values(pointRefs.current).forEach((el) => {
          if (!el) return;
          const b = el.getBoundingClientRect();
          const d = Math.hypot(
            p.px - (b.left + b.width / 2),
            p.py - (b.top + b.height / 2)
          );
          el.style.setProperty("--near", clamp(1 - d / 300, 0, 1).toFixed(3));
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------- escape: close dialog first, then leave ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (active) setActive(null);
      else onComplete?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onComplete]);

  /* ---------- gentle hint if the player lingers ---------- */
  useEffect(() => {
    if (phase !== "observe" || found.length === DISCOVERIES.length) return;
    setHintOn(false);
    const t = setTimeout(() => setHintOn(true), 14000);
    return () => clearTimeout(t);
  }, [phase, found.length]);

  /* ---------- actions ---------- */
  const openDiscovery = (item) => {
    if (!found.includes(item.id)) {
      chime(found.length);
      setFound((f) => [...f, item.id]);
    }
    setActive(item);
  };

  const sendRipple = (e) => {
    if (phase !== "observe" || e.target.closest("button")) return;
    const r = frameRef.current.getBoundingClientRect();
    const id = `${Date.now()}-${Math.random()}`;
    setRipples((rs) => [
      ...rs,
      { id, x: e.clientX - r.left, y: e.clientY - r.top },
    ]);
    setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== id)), 1900);
  };

  const allFound = found.length === DISCOVERIES.length;

  return createPortal(
    <div className="forestlisten-game">
      <div
        ref={frameRef}
        className="forestlisten-frame"
        data-phase={phase}
        onPointerDown={sendRipple}
      >
        {/* ---------------- 3D WORLD ---------------- */}
        <div className="forestlisten-world" aria-hidden={phase !== "observe"}>
          <ForestFallback />
          <div className="forestlisten-camera">
            <div className="forestlisten-stage">
              <Layer cls="bg" sources={FOREST.background} />
              <Layer cls="mid" sources={FOREST.mid} />
              <Layer cls="fg" sources={FOREST.foreground} />
              <Layer cls="animals" sources={FOREST.animals} />
              <Layer cls="light" sources={FOREST.light} />

              {phase === "observe" &&
                DISCOVERIES.map((item, i) => {
                  const Icon = item.icon;
                  const isFound = found.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      ref={(el) => (pointRefs.current[item.id] = el)}
                      type="button"
                      aria-label={isFound ? item.title : "Something stirs here"}
                      className={`forestlisten-point${isFound ? " is-found" : ""}${
                        hintOn && !isFound ? " is-hint" : ""
                      }`}
                      style={{
                        left: item.position.left,
                        top: item.position.top,
                        "--i": i,
                      }}
                      onClick={() => openDiscovery(item)}
                    >
                      <span className="forestlisten-point__pulse" />
                      <span className="forestlisten-point__ring" />
                      <span className="forestlisten-point__icon">
                        <Icon size={17} strokeWidth={1.2} />
                      </span>
                      {isFound && (
                        <span className="forestlisten-point__check">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                      <span className="forestlisten-point__tag">
                        {isFound ? item.title : "Listen"}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        <Fireflies />
        <div className="forestlisten-rays" />
        <div className="forestlisten-mist forestlisten-mist--a" />
        <div className="forestlisten-mist forestlisten-mist--b" />
        <div className="forestlisten-lantern" />
        <div className="forestlisten-vignette" />
        <div className="forestlisten-grain" />

        {ripples.map((r) => (
          <span
            key={r.id}
            className="forestlisten-ripple"
            style={{ left: r.x, top: r.y }}
          />
        ))}

        {/* ---------------- TOP BAR ---------------- */}
        <header className="forestlisten-top">
          <div className="forestlisten-chapter">
            <span>Chapter III</span>
            <i />
            <strong>Bala Kanda</strong>
          </div>

          {phase === "observe" && (
            <div
              className="forestlisten-progress"
              role="status"
              aria-label={`${found.length} of 4 found`}
            >
              {DISCOVERIES.map((d) => (
                <b
                  key={d.id}
                  className={found.includes(d.id) ? "on" : ""}
                />
              ))}
              <span>{found.length}/4</span>
            </div>
          )}

          <div className="forestlisten-actions">
          <button
            type="button"
            className="forestlisten-sound"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute forest ambience" : "Mute forest ambience"}
          >
            {muted ? (
              <VolumeX size={15} strokeWidth={1.3} />
            ) : (
              <Volume2 size={15} strokeWidth={1.3} />
            )}
            <span>Forest sound</span>
          </button>
          <button
            type="button"
            className="forestlisten-close"
            onClick={() => onComplete?.()}
            aria-label="Exit game"
            title="Exit (Esc)"
          >
            <X size={18} strokeWidth={1.4} />
          </button>
          </div>
        </header>

        {/* ---------------- INTRO ---------------- */}
        {phase === "intro" && (
          <main className="forestlisten-panel forestlisten-panel--intro" key="intro">
            <div className="forestlisten-card">
              <div className="forestlisten-glyph">
                <Leaf size={26} strokeWidth={1.1} />
              </div>
              <span className="forestlisten-eyebrow">The first teaching</span>
              <h1 className="forestlisten-title">
                <span style={{ "--d": "0.25s" }}>The forest</span>
                <em style={{ "--d": "0.6s" }}>listens.</em>
              </h1>
              <div className="forestlisten-rule">
                <span />
                <b>✦</b>
                <span />
              </div>
              <p>
                Before one can act within the forest, one must first learn to
                perceive it.
              </p>
              <button
                type="button"
                className="forestlisten-btn"
                onClick={() => setPhase("observe")}
              >
                <span>Enter the forest</span>
                <ArrowRight size={17} strokeWidth={1.3} />
              </button>
            </div>
          </main>
        )}

        {/* ---------------- OBSERVE ---------------- */}
        {phase === "observe" && (
          <>
            <div className="forestlisten-observe-title" key="obs">
              <span className="forestlisten-eyebrow">The first sense</span>
              <h1 className="forestlisten-title forestlisten-title--sm">
                <span>Find the</span>
                <em>living.</em>
              </h1>
              <div className="forestlisten-line" />
              <p className="forestlisten-subtle">
                Move slowly. What is alive will glow as you near it.
              </p>
            </div>

            <div className="forestlisten-footer">
              <span>The teaching</span>
              <p>See what others overlook.</p>
            </div>

            {allFound && !active && (
              <div className="forestlisten-finish">
                <span>The forest has been heard</span>
                <button type="button" onClick={() => setPhase("complete")}>
                  Continue <ArrowRight size={15} strokeWidth={1.3} />
                </button>
              </div>
            )}
          </>
        )}

        {/* ---------------- COMPLETE ---------------- */}
        {phase === "complete" && (
          <main className="forestlisten-panel forestlisten-panel--complete" key="done">
            <div className="forestlisten-card forestlisten-card--center">
              <div className="forestlisten-halo">
                <div className="forestlisten-glyph forestlisten-glyph--lit">
                  <Leaf size={27} strokeWidth={1.1} />
                </div>
              </div>
              <span className="forestlisten-eyebrow">The first teaching</span>
              <h1 className="forestlisten-title">
                <span style={{ "--d": "0.2s" }}>The forest</span>
                <em style={{ "--d": "0.55s" }}>answered.</em>
              </h1>
              <div className="forestlisten-rule">
                <span />
                <b>✦</b>
                <span />
              </div>

              <ul className="forestlisten-seen">
                {DISCOVERIES.map((d, i) => {
                  const Icon = d.icon;
                  return (
                    <li key={d.id} style={{ "--i": i }}>
                      <Icon size={16} strokeWidth={1.2} />
                      <span>{d.title}</span>
                    </li>
                  );
                })}
              </ul>

              <p>
                Vishvamitra's first lesson was not about controlling the
                forest. It was about learning to perceive it.
              </p>
              <button type="button" className="forestlisten-btn" onClick={onComplete}>
                <span>Return to the journey</span>
                <ArrowRight size={17} strokeWidth={1.3} />
              </button>
            </div>
          </main>
        )}

        {active && (
          <DiscoveryDialog item={active} onClose={() => setActive(null)} />
        )}
      </div>
    </div>,
    document.body
  );
}

/* =========================================================
   LAYER (hides itself if an image is missing)
========================================================= */

function Layer({ cls, sources }) {
  const [idx, setIdx] = useState(0);
  const key = sources.join("|");
  useEffect(() => setIdx(0), [key]);
  if (idx >= sources.length) return null; // all candidates failed
  return (
    <div className={`forestlisten-layer forestlisten-layer--${cls}`}>
      <img
        key={sources[idx]}
        src={sources[idx]}
        alt=""
        draggable={false}
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  );
}

/* =========================================================
   FALLBACK FOREST — painted in SVG so the scene is never black,
   even if the image files are missing or the path is wrong.
========================================================= */

function ForestFallback() {
  const trunks = [
    [60, 38], [150, 22], [250, 46], [360, 26], [470, 52],
    [590, 30], [700, 44], [820, 24], [930, 50], [1040, 28], [1140, 42],
  ];
  return (
    <div className="forestlisten-fallback" aria-hidden="true">
      <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="forestlistenSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d2a1a" />
            <stop offset="0.55" stopColor="#3b4a2a" />
            <stop offset="1" stopColor="#141a0f" />
          </linearGradient>
          <radialGradient id="forestlistenGlow" cx="0.72" cy="0.1" r="0.7">
            <stop offset="0" stopColor="#ffe4a0" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffe4a0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="700" fill="url(#forestlistenSky)" />
        <rect width="1200" height="700" fill="url(#forestlistenGlow)" />
        <g fill="#18200f" opacity="0.65">
          {trunks.map(([x, w], i) => (
            <rect key={`b${i}`} x={x + 20} y="0" width={w * 0.6} height="520" />
          ))}
        </g>
        <g fill="#0d130a">
          {trunks.map(([x, w], i) => (
            <rect key={`f${i}`} x={x - 30 + (i % 3) * 18} y="0" width={w} height="700" opacity={i % 2 ? 0.9 : 0.7} />
          ))}
        </g>
        <ellipse cx="600" cy="700" rx="760" ry="110" fill="#0a0f07" />
      </svg>
    </div>
  );
}

/* =========================================================
   FIREFLIES — canvas particles, golden pollen & drifting embers
========================================================= */

function Fireflies() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    let w = 0;
    let h = 0;
    let raf;

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

    const flies = Array.from({ length: reduce ? 10 : 46 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.3 + Math.random() * 0.7,
      a: Math.random() * Math.PI * 2,
      s: 0.00005 + Math.random() * 0.00011,
      ph: Math.random() * 6.28,
    }));

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      flies.forEach((f) => {
        f.a += (Math.sin(t * 0.0004 + f.ph) * 0.03);
        f.x += Math.cos(f.a) * f.s * f.z * 16;
        f.y += Math.sin(f.a) * f.s * f.z * 10 - 0.00004 * f.z;
        if (f.x < -0.05) f.x = 1.05;
        if (f.x > 1.05) f.x = -0.05;
        if (f.y < -0.05) f.y = 1.05;
        if (f.y > 1.05) f.y = -0.05;

        const blink = 0.35 + 0.65 * Math.max(0, Math.sin(t * 0.0012 * f.z + f.ph));
        const r = (2 + f.z * 4.5) * (0.7 + blink * 0.5);
        const x = f.x * w;
        const y = f.y * h;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4.5);
        g.addColorStop(0, `rgba(255,224,140,${0.85 * blink})`);
        g.addColorStop(0.3, `rgba(226,176,80,${0.28 * blink})`);
        g.addColorStop(1, "rgba(226,176,80,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 4.5, 0, 6.283);
        ctx.fill();
      });
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="forestlisten-fireflies" aria-hidden="true" />;
}

/* =========================================================
   DISCOVERY DIALOG — 3D tilt, ornamental entrance
========================================================= */

function DiscoveryDialog({ item, onClose }) {
  const Icon = item.icon;
  const ref = useRef(null);

  const tilt = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--tx", `${(-y * 6).toFixed(2)}deg`);
    ref.current.style.setProperty("--ty", `${(x * 8).toFixed(2)}deg`);
  };

  useEffect(() => {
    ref.current?.querySelector("button")?.focus();
  }, []);

  return (
    <div className="forestlisten-dialog-bg" onClick={onClose}>
      <div
        ref={ref}
        className="forestlisten-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        onClick={(e) => e.stopPropagation()}
        onPointerMove={tilt}
        onPointerLeave={() => {
          ref.current.style.setProperty("--tx", "0deg");
          ref.current.style.setProperty("--ty", "0deg");
        }}
      >
        <span className="forestlisten-dialog-num">{item.number} / 04</span>
        <div className="forestlisten-dialog-icon">
          <Icon size={23} strokeWidth={1.1} />
        </div>
        <span className="forestlisten-eyebrow">{item.label}</span>
        <h2>{item.title}</h2>
        <div className="forestlisten-rule forestlisten-rule--center">
          <span />
          <b>✦</b>
          <span />
        </div>
        <p>{item.description}</p>
        <button type="button" className="forestlisten-btn forestlisten-btn--sm" onClick={onClose}>
          <span>Continue observing</span>
          <ArrowRight size={16} strokeWidth={1.3} />
        </button>
      </div>
    </div>
  );
}