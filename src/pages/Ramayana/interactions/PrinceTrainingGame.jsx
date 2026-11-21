import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowRight,
  BookOpen,
  Check,
  CircleDot,
  Flame,
  Heart,
  MousePointer2,
  Scale,
  Sparkles,
  Star,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";

import "./PrinceTrainingGame.css";

/* =========================================================
   ANCESTRA — THE PRINCE'S TRAINING
   Drop-in replacement. Same props: <PrinceTrainingGame onComplete />
   Dependencies: react + lucide-react only.
   ========================================================= */

const VASHISHTA_IMAGE = "/images/characters/vashishtha.jpg";
const TOTAL_TARGETS = 5;

const TEACHINGS = [
  {
    id: "vidya",
    number: "01",
    title: "VIDYA",
    subtitle: "Knowledge",
    Icon: BookOpen,
    text: "Understand before you act.",
    meaning: "Learn before you act. Knowledge gives purpose to strength.",
  },
  {
    id: "dharma",
    number: "02",
    title: "DHARMA",
    subtitle: "Duty",
    Icon: Scale,
    text: "Strength must serve responsibility.",
    meaning: "A prince must understand his responsibility toward others.",
  },
  {
    id: "sanyama",
    number: "03",
    title: "SANYAMA",
    subtitle: "Self-Mastery",
    Icon: Flame,
    text: "Discipline gives strength its direction.",
    meaning: "True strength begins with discipline over one's own impulses.",
  },
  {
    id: "karuna",
    number: "04",
    title: "KARUNA",
    subtitle: "Compassion",
    Icon: Heart,
    text: "Power without compassion is incomplete.",
    meaning: "Power must be guided by compassion and concern for others.",
  },
];

const TARGET_LAYOUT = [
  { id: 1, x: 15, y: 57, s: 0.92 },
  { id: 2, x: 33, y: 44, s: 0.78 },
  { id: 3, x: 51, y: 58, s: 1 },
  { id: 4, x: 69, y: 43, s: 0.74 },
  { id: 5, x: 86, y: 56, s: 0.9 },
];

const cx = (...parts) => parts.filter(Boolean).join(" ");

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* Never hand the player an already-sorted board */
function shuffleDifferent(array) {
  let result;
  do {
    result = shuffle(array);
  } while (result.every((item, i) => item.id === array[i].id));
  return result;
}

/* =========================================================
   SOUND — tiny synthesized effects, no asset files
   ========================================================= */

function useSfx(muted) {
  const ctxRef = useRef(null);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  return useMemo(() => {
    const getCtx = () => {
      if (!ctxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctxRef.current = new AC();
      }
      if (ctxRef.current.state === "suspended") ctxRef.current.resume();
      return ctxRef.current;
    };

    const tone = (freq, dur = 0.2, type = "sine", vol = 0.05, delay = 0, slide = 0) => {
      if (mutedRef.current) return;
      const c = getCtx();
      if (!c) return;
      const t = c.currentTime + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slide) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
      }
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    };

    return {
      click: () => tone(520, 0.08, "triangle", 0.04),
      pick: () => tone(660, 0.1, "sine", 0.04),
      correct: () => {
        tone(523, 0.25, "sine", 0.06);
        tone(784, 0.4, "sine", 0.05, 0.09);
        tone(1046, 0.5, "sine", 0.03, 0.18);
      },
      wrong: () => tone(170, 0.25, "sawtooth", 0.035, 0, -70),
      shoot: () => tone(950, 0.2, "triangle", 0.03, 0, -750),
      hit: () => {
        tone(190, 0.22, "square", 0.045, 0, -110);
        tone(1200, 0.35, "sine", 0.03, 0.05);
      },
      miss: () => tone(250, 0.16, "sine", 0.03, 0, -130),
      win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.7, "sine", 0.05, i * 0.13)),
    };
  }, []);
}

/* =========================================================
   AMBIENT EMBERS — canvas fireflies behind everything
   ========================================================= */

function EmberField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const make = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      vy: -(Math.random() * 0.25 + 0.08),
      vx: (Math.random() - 0.5) * 0.15,
      p: Math.random() * 6.28,
      a: Math.random() * 0.5 + 0.25,
    });
    const particles = Array.from({ length: 70 }, make);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx + Math.sin(p.p) * 0.12;
        p.y += p.vy;
        p.p += 0.015;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        const twinkle = 0.6 + 0.4 * Math.sin(p.p * 2.3);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `rgba(244,214,140,${p.a * twinkle})`);
        g.addColorStop(1, "rgba(244,214,140,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, 6.283);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="ember-field" aria-hidden="true" />;
}

/* =========================================================
   TILT — 3D hover card with light glare
   ========================================================= */

function Tilt({ className = "", max = 12, children, ...rest }) {
  const ref = useRef(null);

  const move = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - py) * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * max).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
  };

  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={ref}
      className={cx("tilt", className)}
      onPointerMove={move}
      onPointerLeave={leave}
      {...rest}
    >
      {children}
      <span className="tilt__glare" aria-hidden="true" />
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function PrinceTrainingGame({ onComplete }) {
  const [stage, setStage] = useState("cover");
  const [muted, setMuted] = useState(false);
  const [stats, setStats] = useState(null);
  const sfx = useSfx(muted);

  const go = (next) => {
    sfx.click();
    setStage(next);
  };

  return (
    <div className="prince-training">
      <EmberField />

      <TrainingHeader
        stage={stage}
        muted={muted}
        onToggleSound={() => setMuted((m) => !m)}
      />

      <main className="prince-training__body">
        {stage === "cover" && <CoverStage onContinue={() => go("teachings")} />}

        {stage === "teachings" && (
          <TeachingsStage onContinue={() => go("matching")} />
        )}

        {stage === "matching" && (
          <MatchingStage sfx={sfx} onContinue={() => go("focus")} />
        )}

        {stage === "focus" && (
          <FocusStage
            sfx={sfx}
            onComplete={(result) => {
              setStats(result);
              setStage("complete");
            }}
          />
        )}

        {stage === "complete" && (
          <CompletionStage
            stats={stats}
            sfx={sfx}
            onComplete={() => onComplete?.()}
          />
        )}
      </main>
    </div>
  );
}

/* =========================================================
   HEADER
   ========================================================= */

function TrainingHeader({ stage, muted, onToggleSound }) {
  const stages = [
    { id: "cover", label: "Begin" },
    { id: "teachings", label: "Wisdom" },
    { id: "matching", label: "Lessons" },
    { id: "focus", label: "Focus" },
  ];

  const currentIndex =
    stage === "complete"
      ? stages.length
      : stages.findIndex((item) => item.id === stage);

  return (
    <header className="training-header">
      <div className="training-header__brand">
        <span className="training-header__eyebrow">Ancestra · Bala Kanda</span>
        <span className="training-header__title">The Prince's Training</span>
      </div>

      <div className="training-progress" role="list">
        {stages.map((item, index) => {
          const completed = index < currentIndex;
          const active = index === currentIndex;

          return (
            <React.Fragment key={item.id}>
              <div
                role="listitem"
                className={cx(
                  "training-progress__step",
                  completed && "training-progress__step--complete",
                  active && "training-progress__step--active"
                )}
              >
                <span className="training-progress__dot">
                  {completed ? <Check size={12} /> : index + 1}
                </span>
                <span className="training-progress__label">{item.label}</span>
              </div>

              {index < stages.length - 1 && (
                <div
                  className={cx("training-progress__line", completed && "is-filled")}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <button
        type="button"
        className="sound-toggle"
        onClick={onToggleSound}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </header>
  );
}

/* =========================================================
   COVER — tilting 3D mandala
   ========================================================= */

function CoverStage({ onContinue }) {
  const ref = useRef(null);

  const move = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  return (
    <section ref={ref} className="training-cover stage" onPointerMove={move}>
      <div className="mandala-wrap" aria-hidden="true">
        <div className="mandala">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`mandala__ring mandala__ring--${n}`} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="mandala__petal" style={{ "--i": i }} />
          ))}
        </div>
        <div className="mandala-glow" />
      </div>

      <div className="training-cover__content">
        <div className="training-kicker">
          <Sparkles size={14} />
          The Gurukula
          <Sparkles size={14} />
        </div>

        <div className="training-cover__symbol">
          <BookOpen size={40} strokeWidth={1.2} />
        </div>

        <p className="training-cover__chapter">
          Chapter II · The Making of the Princes
        </p>

        <h1>
          The Prince's
          <span>Training</span>
        </h1>

        <p className="training-cover__description">
          Before a prince learns to command the world, he must first learn to
          command himself.
        </p>

        <button type="button" className="training-primary-button" onClick={onContinue}>
          Begin the lesson
          <ArrowRight size={17} />
        </button>

        <p className="training-cover__meta">
          Four teachings · One matching trial · One archery trial
        </p>
      </div>
    </section>
  );
}

/* =========================================================
   TEACHINGS
   ========================================================= */

function TeachingsStage({ onContinue }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section className="teachings-stage stage">
      <div className="section-heading">
        <span className="section-heading__eyebrow">The sage's teachings</span>

        <h2>
          Wisdom before
          <span>power.</span>
        </h2>

        <p>
          The princes are taught that mastery is not measured only by strength,
          but by how that strength is guided.
        </p>
      </div>

      <div className="sage-layout">
        <Tilt className="sage-portrait" max={7}>
          {!imageFailed ? (
            <img
              src={VASHISHTA_IMAGE}
              alt="Rishi Vashishta"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="sage-portrait__fallback">
              <i className="sage-portrait__orbit" />
              <span>ऋ</span>
              <small>RISHI</small>
            </div>
          )}

          <i className="corner corner--tl" />
          <i className="corner corner--tr" />
          <i className="corner corner--bl" />
          <i className="corner corner--br" />

          <div className="sage-portrait__caption">
            <span>The sage</span>
            <strong>Vashishta</strong>
          </div>
        </Tilt>

        <div className="teachings-list">
          {TEACHINGS.map(({ id, number, title, subtitle, text, Icon }, i) => (
            <Tilt
              className="teaching-card"
              key={id}
              max={9}
              style={{ "--d": `${i * 110}ms` }}
            >
              <div className="teaching-card__icon">
                <Icon size={20} strokeWidth={1.4} />
              </div>

              <div className="teaching-card__body">
                <span className="teaching-card__number">{number}</span>
                <h3>{title}</h3>
                <span className="teaching-card__subtitle">{subtitle}</span>
                <p>{text}</p>
              </div>
            </Tilt>
          ))}
        </div>
      </div>

      <div className="stage-footer">
        <span>Four principles · One discipline</span>

        <button type="button" className="training-primary-button" onClick={onContinue}>
          Test your understanding
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   MATCHING — drag a line, or tap a principle then its meaning
   ========================================================= */

function MatchingStage({ onContinue, sfx }) {
  const boardRef = useRef(null);
  const leftNodes = useRef({});
  const rightNodes = useRef({});
  const wrongTimer = useRef(0);

  const [rightItems] = useState(() => shuffleDifferent(TEACHINGS));
  const [matched, setMatched] = useState([]);
  const [drag, setDrag] = useState(null);
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [wrong, setWrong] = useState(null);
  const [anchors, setAnchors] = useState({ left: {}, right: {}, w: 1, h: 1 });

  /* Measure node centres in board pixels */
  const measure = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const br = board.getBoundingClientRect();

    const point = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - br.left, y: r.top + r.height / 2 - br.top };
    };

    const left = {};
    const right = {};
    TEACHINGS.forEach((t) => {
      left[t.id] = point(leftNodes.current[t.id]);
      right[t.id] = point(rightNodes.current[t.id]);
    });

    setAnchors({ left, right, w: br.width, h: br.height });
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(boardRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => () => clearTimeout(wrongTimer.current), []);

  const toBoard = (e) => {
    const r = boardRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const optionAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const opt = el?.closest?.("[data-match-option]");
    return opt ? opt.getAttribute("data-match-option") : null;
  };

  const attempt = (leftId, rightId) => {
    if (matched.includes(rightId)) return;
    setSelected(null);

    if (leftId === rightId) {
      setMatched((prev) => (prev.includes(leftId) ? prev : [...prev, leftId]));
      sfx.correct();
    } else {
      setWrong({ left: leftId, right: rightId });
      sfx.wrong();
      clearTimeout(wrongTimer.current);
      wrongTimer.current = window.setTimeout(() => setWrong(null), 650);
    }
  };

  const onDown = (id, e) => {
    if (matched.includes(id)) return;
    e.preventDefault();
    const start = anchors.left[id];
    if (!start) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* older browsers */
    }

    setDrag({
      id,
      start,
      pos: toBoard(e),
      moved: false,
      origin: { x: e.clientX, y: e.clientY },
      wasSelected: selected === id,
    });
    setSelected(null);
    setWrong(null);
    sfx.pick();
  };

  const onMove = (e) => {
    if (!drag) return;
    const moved =
      drag.moved || Math.hypot(e.clientX - drag.origin.x, e.clientY - drag.origin.y) > 6;
    setDrag((d) => (d ? { ...d, pos: toBoard(e), moved } : d));
    setHover(optionAt(e.clientX, e.clientY));
  };

  const onUp = (e) => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    setHover(null);

    const target = optionAt(e.clientX, e.clientY);
    if (target) attempt(d.id, target);
    else if (!d.moved) setSelected(d.wasSelected ? null : d.id);
  };

  const onCancel = () => {
    setDrag(null);
    setHover(null);
  };

  const onRightClick = (id) => {
    if (selected && !matched.includes(id)) attempt(selected, id);
  };

  const curve = (a, b) => {
    const dx = Math.max(60, Math.abs(b.x - a.x) * 0.4);
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  };

  const allMatched = matched.length === TEACHINGS.length;

  return (
    <section className="matching-stage stage">
      <div className="section-heading section-heading--matching">
        <span className="section-heading__eyebrow">The sage's test</span>

        <h2>
          Connect the
          <span>teachings.</span>
        </h2>

        <p>Draw a line from each principle to the meaning that belongs to it.</p>
      </div>

      <div className="matching-instructions">
        <MousePointer2 size={16} />
        <span>
          {selected
            ? "Now choose the meaning it belongs to"
            : "Drag from the gold dot to its meaning, or tap one then the other"}
        </span>
        <span className="matching-counter">
          {matched.length} / {TEACHINGS.length}
        </span>
      </div>

      <div
        ref={boardRef}
        className={cx("matching-board", drag && "matching-board--drawing")}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <svg
          className="matching-lines"
          viewBox={`0 0 ${anchors.w} ${anchors.h}`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="matchGoldGradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={anchors.w}
              y2="0"
            >
              <stop offset="0%" stopColor="#a77b35" />
              <stop offset="50%" stopColor="#f0d68f" />
              <stop offset="100%" stopColor="#a77b35" />
            </linearGradient>
          </defs>

          {matched.map((id) => {
            const a = anchors.left[id];
            const b = anchors.right[id];
            if (!a || !b) return null;
            return (
              <path
                key={id}
                pathLength="1"
                className="matching-line matching-line--locked"
                d={curve(a, b)}
              />
            );
          })}

          {drag && (
            <path
              className="matching-line matching-line--active"
              d={curve(drag.start, drag.pos)}
            />
          )}
        </svg>

        <div className="matching-column">
          <div className="matching-column__label">Principle</div>

          {TEACHINGS.map((item, index) => {
            const isMatched = matched.includes(item.id);
            return (
              <div
                key={item.id}
                className={cx(
                  "match-card",
                  "match-card--left",
                  isMatched && "match-card--matched",
                  selected === item.id && "match-card--selected",
                  drag?.id === item.id && "match-card--dragging",
                  wrong?.left === item.id && "match-card--wrong"
                )}
                onPointerDown={(e) => onDown(item.id, e)}
              >
                <div className="match-card__content">
                  <span className="match-card__number">0{index + 1}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </div>
                </div>

                <span
                  ref={(el) => {
                    leftNodes.current[item.id] = el;
                  }}
                  className={cx("match-node", isMatched && "match-node--matched")}
                >
                  {isMatched && <Check size={14} />}
                </span>
              </div>
            );
          })}
        </div>

        <div className="matching-column">
          <div className="matching-column__label">Meaning</div>

          {rightItems.map((item) => {
            const isMatched = matched.includes(item.id);
            return (
              <div
                key={item.id}
                data-match-option={item.id}
                onClick={() => onRightClick(item.id)}
                className={cx(
                  "match-card",
                  "match-card--right",
                  isMatched && "match-card--matched",
                  hover === item.id && !isMatched && "match-card--hover",
                  selected && !isMatched && "match-card--available",
                  wrong?.right === item.id && "match-card--wrong"
                )}
              >
                <span
                  ref={(el) => {
                    rightNodes.current[item.id] = el;
                  }}
                  className={cx("match-node", isMatched && "match-node--matched")}
                >
                  {isMatched && <Check size={14} />}
                </span>

                <div className="match-card__meaning">{item.meaning}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="matching-feedback" aria-live="polite">
        {wrong && (
          <span className="matching-feedback__wrong">
            Not quite. Follow the teaching more carefully.
          </span>
        )}

        {matched.length > 0 && !wrong && !allMatched && (
          <span className="matching-feedback__correct">
            Correct. The teaching is understood.
          </span>
        )}

        {allMatched && (
          <span className="matching-feedback__complete">
            All four teachings understood.
          </span>
        )}
      </div>

      <div className="stage-footer">
        <span>
          {allMatched
            ? "The lesson is complete"
            : "Take your time · Think before you connect"}
        </span>

        <button
          type="button"
          className="training-primary-button"
          disabled={!allMatched}
          onClick={onContinue}
        >
          Continue to focus
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   FOCUS TRIAL — layered 3D archery ground
   ========================================================= */

const BIRDS = [
  { top: "13%", dur: "19s", dl: "0s", sc: 1 },
  { top: "22%", dur: "24s", dl: "-6s", sc: 0.7 },
  { top: "9%", dur: "28s", dl: "-12s", sc: 0.55 },
  { top: "27%", dur: "21s", dl: "-15s", sc: 0.8 },
];

function Vessel() {
  return (
    <svg className="vessel" viewBox="0 0 80 92" aria-hidden="true">
      <path
        d="M22 18 Q18 10 26 8 H54 Q62 10 58 18 Q74 34 70 58 Q66 84 40 86 Q14 84 10 58 Q6 34 22 18Z"
        fill="url(#potClay)"
        stroke="#4a2a18"
        strokeWidth="1.5"
      />
      <ellipse cx="40" cy="9" rx="17" ry="5" fill="#3b2012" />
      <ellipse cx="40" cy="8" rx="13" ry="3" fill="#1d0f08" />
      <circle cx="40" cy="54" r="21" fill="#f1e2b8" stroke="#6b3a22" strokeWidth="1.5" />
      <circle cx="40" cy="54" r="14.5" fill="#9a3a28" />
      <circle cx="40" cy="54" r="8" fill="#f1e2b8" />
      <circle cx="40" cy="54" r="3.4" fill="#9a3a28" />
      <path
        d="M20 36 Q14 52 20 68"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FocusStage({ onComplete, sfx }) {
  const arenaRef = useRef(null);
  const reticleRef = useRef(null);
  const timers = useRef([]);
  const startRef = useRef(0);
  const hitsRef = useRef(0);
  const shotsRef = useRef(0);
  const streakRef = useRef(0);

  const [targets, setTargets] = useState(() =>
    TARGET_LAYOUT.map((t) => ({ ...t, status: "alive" }))
  );
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [hits, setHits] = useState(0);
  const [shots, setShots] = useState(0);
  const [streak, setStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState("DRAW YOUR BOW");
  const [arrows, setArrows] = useState([]);
  const [bursts, setBursts] = useState([]);
  const [shake, setShake] = useState(false);

  const later = (fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!started || done) return undefined;
    const id = window.setInterval(
      () => setElapsed((Date.now() - startRef.current) / 1000),
      100
    );
    return () => window.clearInterval(id);
  }, [started, done]);

  const begin = () => {
    startRef.current = Date.now();
    setStarted(true);
    setFeedback("FOCUS");
    sfx.click();
  };

  const onMove = (e) => {
    const arena = arenaRef.current;
    if (!arena) return;
    const r = arena.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    if (reticleRef.current) {
      reticleRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }
    arena.style.setProperty("--mx", (x / r.width - 0.5).toFixed(3));
    arena.style.setProperty("--my", (y / r.height - 0.5).toFixed(3));
  };

  const shoot = (e) => {
    if (!started || done) return;
    const arena = arenaRef.current;
    if (!arena) return;

    const r = arena.getBoundingClientRect();
    const clickX = e.clientX - r.left;
    const clickY = e.clientY - r.top;

    const el = e.target.closest?.("[data-target]");
    const tid = el ? Number(el.getAttribute("data-target")) : null;
    const target = tid ? targets.find((t) => t.id === tid && t.status === "alive") : null;

    let dest = { x: clickX, y: clickY };
    if (target) {
      const er = el.getBoundingClientRect();
      dest = { x: er.left + er.width / 2 - r.left, y: er.top + er.height / 2 - r.top };
    }

    const sx = r.width / 2;
    const sy = r.height + 24;
    const id = `${Date.now()}-${Math.random()}`;

    setArrows((prev) => [
      ...prev,
      {
        id,
        x: dest.x,
        y: dest.y,
        dx: sx - dest.x,
        dy: sy - dest.y,
        rot: (Math.atan2(dest.y - sy, dest.x - sx) * 180) / Math.PI,
      },
    ]);
    later(() => setArrows((prev) => prev.filter((a) => a.id !== id)), 950);

    shotsRef.current += 1;
    setShots(shotsRef.current);
    sfx.shoot();

    if (target) {
      setTargets((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, status: "struck" } : t))
      );

      later(() => {
        hitsRef.current += 1;
        streakRef.current += 1;
        const nh = hitsRef.current;

        setHits(nh);
        setStreak(streakRef.current);
        setFeedback(streakRef.current >= 3 ? "PERFECT RHYTHM" : "ASTRA ALIGNED");
        setTargets((prev) =>
          prev.map((t) => (t.id === target.id ? { ...t, status: "gone" } : t))
        );
        setBursts((prev) => [...prev, { id, x: dest.x, y: dest.y, type: "hit" }]);
        setShake(true);
        later(() => setShake(false), 260);
        later(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 1100);
        sfx.hit();

        if (nh >= TOTAL_TARGETS) {
          const time = (Date.now() - startRef.current) / 1000;
          setDone(true);
          setElapsed(time);
          setFeedback("TRAINING COMPLETE");
          later(() => sfx.win(), 250);
          later(
            () =>
              onComplete({
                accuracy: Math.round((nh / shotsRef.current) * 100),
                time,
                shots: shotsRef.current,
              }),
            1700
          );
        }
      }, 260);
    } else {
      later(() => {
        streakRef.current = 0;
        setStreak(0);
        setFeedback("FOCUS LOST");
        setBursts((prev) => [...prev, { id, x: dest.x, y: dest.y, type: "miss" }]);
        later(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 800);
        sfx.miss();
      }, 260);
    }
  };

  const lockOn = () => reticleRef.current?.classList.add("is-locked");
  const lockOff = () => reticleRef.current?.classList.remove("is-locked");

  const accuracy = shots ? Math.round((hits / shots) * 100) : 100;

  return (
    <section className="focus-stage stage">
      <div className="section-heading section-heading--focus">
        <span className="section-heading__eyebrow">The final lesson</span>

        <h2>
          Stillness creates
          <span>precision.</span>
        </h2>

        <p>
          Find the marked vessels across the training ground. Trust your focus,
          not haste.
        </p>
      </div>

      <div className="focus-hud">
        <div>
          <span>Marks</span>
          <strong>
            {String(hits).padStart(2, "0")} / {String(TOTAL_TARGETS).padStart(2, "0")}
            {streak >= 2 && <em className="focus-hud__streak">×{streak}</em>}
          </strong>
        </div>

        <div className="focus-hud__center">
          <Target size={16} />
          {feedback}
        </div>

        <div>
          <span>{started ? `${accuracy}% accuracy` : "Time"}</span>
          <strong>{elapsed.toFixed(1)}s</strong>
        </div>
      </div>

      <div className="focus-arena-wrap">
        <div
          ref={arenaRef}
          className={cx(
            "focus-arena",
            !started && "is-idle",
            shake && "focus-arena--shake"
          )}
          onPointerMove={onMove}
          onPointerDown={shoot}
          onPointerEnter={(e) => {
            onMove(e);
            arenaRef.current?.classList.add("is-active");
          }}
          onPointerLeave={() => arenaRef.current?.classList.remove("is-active")}
        >
          {/* shared SVG gradients for the vessels */}
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
            <defs>
              <radialGradient id="potClay" cx="35%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#e0a56a" />
                <stop offset="55%" stopColor="#b9703c" />
                <stop offset="100%" stopColor="#7a4021" />
              </radialGradient>
            </defs>
          </svg>

          <div className="fx-layer fx-sky" />
          <div className="fx-rays" />
          <div className="fx-layer fx-sun" style={{ "--depth": 0.4 }}>
            <i />
          </div>
          <div className="fx-layer fx-clouds" style={{ "--depth": 0.9 }}>
            <span />
            <span />
            <span />
          </div>

          <div className="focus-birds">
            {BIRDS.map((b, i) => (
              <span
                key={i}
                className="focus-bird"
                style={{ "--top": b.top, "--dur": b.dur, "--dl": b.dl, "--sc": b.sc }}
              />
            ))}
          </div>

          <div className="fx-layer fx-mtn fx-mtn--far" style={{ "--depth": 1 }} />
          <div className="fx-layer fx-mtn fx-mtn--mid" style={{ "--depth": 1.9 }} />
          <div className="fx-layer fx-mtn fx-mtn--near" style={{ "--depth": 2.8 }} />
          <div className="fx-layer fx-trees" style={{ "--depth": 4 }}>
            <i />
            <i />
            <i />
            <i />
          </div>

          <div className="fx-ground" />

          <div className="focus-platform">
            <div className="focus-platform__top" />
            <div className="focus-platform__front" />
          </div>

          {targets.map((t) =>
            t.status === "gone" ? null : (
              <div
                key={t.id}
                data-target={t.id}
                className={cx("focus-target", t.status === "struck" && "is-struck")}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  "--s": t.s,
                  "--dur": `${3.4 + t.id * 0.55}s`,
                  "--dl": `${-t.id * 0.9}s`,
                }}
                onPointerEnter={lockOn}
                onPointerLeave={lockOff}
              >
                <div className="focus-target__body">
                  <i className="focus-target__aura" />
                  <Vessel />
                  <span>{t.id}</span>
                </div>
              </div>
            )
          )}

          {arrows.map((a) => (
            <div
              key={a.id}
              className="arrow"
              style={{
                left: a.x,
                top: a.y,
                "--dx": `${a.dx}px`,
                "--dy": `${a.dy}px`,
                "--rot": `${a.rot}deg`,
              }}
            />
          ))}

          {bursts.map((b) => (
            <div key={b.id} className={cx("burst", `burst--${b.type}`)} style={{ left: b.x, top: b.y }}>
              <i className="burst__ring" />
              {Array.from({ length: b.type === "hit" ? 14 : 5 }, (_, i) => (
                <i
                  key={i}
                  className={cx("burst__shard", i % 3 === 0 && "burst__shard--gold")}
                  style={{
                    "--a": `${(360 / (b.type === "hit" ? 14 : 5)) * i + (i % 2) * 11}deg`,
                    "--d": `${(b.type === "hit" ? 46 : 22) + (i % 4) * 14}px`,
                  }}
                />
              ))}
              {b.type === "hit" && <b className="burst__plus">+1</b>}
            </div>
          ))}

          <div className="fx-vignette" />

          <div ref={reticleRef} className="focus-reticle" aria-hidden="true">
            <i className="focus-reticle__outer" />
            <i className="focus-reticle__tick focus-reticle__tick--h" />
            <i className="focus-reticle__tick focus-reticle__tick--v" />
            <i className="focus-reticle__inner" />
          </div>

          {!started && (
            <div className="focus-overlay">
              <div className="focus-overlay__panel">
                <Target size={30} strokeWidth={1.3} />
                <h3>The first trial</h3>
                <p>
                  Five enchanted vessels hang above the training ground. Strike
                  each one. Every missed arrow costs you accuracy.
                </p>
                <button type="button" className="training-primary-button" onClick={begin}>
                  Draw the bow
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          )}

          {started && !done && shots === 0 && (
            <div className="focus-arena__hint">Click a vessel to loose an arrow</div>
          )}
        </div>
      </div>

      <div className="stage-footer">
        <span>Five marks · One breath · Complete focus</span>

        <div className="focus-footer-note">
          <CircleDot size={13} />
          {done ? "The training is complete." : `${TOTAL_TARGETS - hits} marks remain.`}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   COMPLETION
   ========================================================= */

function CompletionStage({ stats, sfx, onComplete }) {
  const accuracy = stats?.accuracy ?? 100;
  const stars = accuracy >= 80 ? 3 : accuracy >= 55 ? 2 : 1;
  const ranks = ["Apprentice of the Gurukula", "Disciple of Vashishta", "Master of Focus"];

  return (
    <section className="training-complete stage">
      <div className="training-complete__symbol">
        <Sparkles size={36} strokeWidth={1.2} />
        {Array.from({ length: 18 }, (_, i) => (
          <i
            key={i}
            className="complete-spark"
            style={{ "--a": `${i * 20}deg`, "--d": `${70 + (i % 3) * 26}px`, "--dl": `${(i % 6) * 70}ms` }}
          />
        ))}
      </div>

      <span className="training-kicker">Lesson complete</span>

      <h2>
        The prince has
        <span>learned.</span>
      </h2>

      <div className="complete-stars" aria-label={`${stars} of 3 stars`}>
        {[1, 2, 3].map((n) => (
          <Star
            key={n}
            size={30}
            strokeWidth={1.3}
            className={cx("complete-star", n <= stars && "is-lit")}
            style={{ "--d": `${400 + n * 260}ms` }}
          />
        ))}
      </div>

      <p className="complete-rank">{ranks[stars - 1]}</p>

      {stats && (
        <div className="complete-stats">
          <div>
            <strong>{stats.accuracy}%</strong>
            <span>Accuracy</span>
          </div>
          <div>
            <strong>{stats.time.toFixed(1)}s</strong>
            <span>Time</span>
          </div>
          <div>
            <strong>{stats.shots}</strong>
            <span>Arrows</span>
          </div>
        </div>
      )}

      <p>Knowledge has been received. Discipline has been tested. The next lesson now awaits.</p>

      <button
        type="button"
        className="training-primary-button"
        onClick={() => {
          sfx.click();
          onComplete();
        }}
      >
        Return to the story
        <ArrowRight size={17} />
      </button>
    </section>
  );
}