import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  Crown,
  Flame,
  Gem,
  Leaf,
  RotateCcw,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  Swords,
  X,
} from "lucide-react";
import "./MemoryOfASageGame.css";

const STAGES = { INTRO: "intro", DESIRE: "desire", TURN: "turn", COMPLETE: "complete" };

const FLOW = [
  { id: STAGES.DESIRE, label: "The King's Desire" },
  { id: STAGES.TURN, label: "The Turning Point" },
];

const TURN_ORDER = ["desire", "refused", "austerity"];

const TURN_FRAGMENTS = [
  {
    id: "desire",
    title: "The King Desires Shabala",
    text: "Vishvamitra wished to possess the sacred cow, believing such a treasure belonged in a king's hands.",
    icon: Crown,
  },
  {
    id: "refused",
    title: "Vasishtha Refuses",
    text: "His royal power proved insufficient against the sage's spiritual strength, and the humiliation awakened something fierce.",
    icon: Shield,
  },
  {
    id: "austerity",
    title: "The Path of Austerity",
    text: "Years of severe discipline and repeated tests turned a king who desired supremacy into a sage.",
    icon: Flame,
  },
];

const CHOICES = [
  { id: "bow", label: "A sacred bow", icon: Swords },
  { id: "shabala", label: "Shabala, the sacred cow", icon: Leaf },
  { id: "jewels", label: "A treasury of jewels", icon: Gem },
  { id: "horse", label: "A royal horse", icon: Star },
];

const ROMAN = ["I", "II", "III"];

const shuffle = (items) =>
  [...items].map((i) => [Math.random(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

/* ---------- atmosphere & 3D building blocks ---------- */

function Embers({ count = 30 }) {
  const embers = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        dur: 9 + Math.random() * 12,
        delay: -Math.random() * 20,
        drift: (Math.random() - 0.5) * 120,
      })),
    [count]
  );
  return (
    <div className="sage-embers" aria-hidden="true">
      {embers.map((e) => (
        <i
          key={e.id}
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            animationDuration: `${e.dur}s`,
            animationDelay: `${e.delay}s`,
            "--drift": `${e.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

function Orb3D({ icon: Icon, size = 260, tone = "gold", iconSize = 84 }) {
  return (
    <div className={`sage-orb sage-orb--${tone}`} style={{ width: size, height: size }}>
      <div className="sage-orb__glow" />
      <span className="sage-orb__ring sage-orb__ring--a" />
      <span className="sage-orb__ring sage-orb__ring--b" />
      <span className="sage-orb__ring sage-orb__ring--c" />
      <div className="sage-orb__core">
        <Icon size={iconSize} strokeWidth={0.9} />
      </div>
    </div>
  );
}

function Tilt({ className = "", intensity = 10, children, ...rest }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 18 });
  const sry = useSpring(ry, { stiffness: 220, damping: 18 });

  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * intensity * 2);
    rx.set(-(py - 0.5) * intensity * 2);
    e.currentTarget.style.setProperty("--gx", `${px * 100}%`);
    e.currentTarget.style.setProperty("--gy", `${py * 100}%`);
  };
  const leave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.button
      type="button"
      className={`sage-tilt ${className}`}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onMouseMove={move}
      onMouseLeave={leave}
      whileTap={{ scale: 0.97 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

const Reveal = ({ i = 0, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 36, scale: 0.94 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const SectionIntro = ({ kicker, line1, line2, text }) => (
  <motion.div
    className="sage-section-intro"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <span className="sage-screen__kicker">{kicker}</span>
    <h2>
      {line1}
      {line2 && <span>{line2}</span>}
    </h2>
    {text && <p>{text}</p>}
  </motion.div>
);

const Feedback = ({ ok, children }) => (
  <motion.div
    className={`sage-feedback ${ok ? "sage-feedback--correct" : "sage-feedback--wrong"}`}
    initial={{ opacity: 0, y: 14, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0 }}
  >
    {ok ? <Check size={18} strokeWidth={1.6} /> : <X size={18} strokeWidth={1.6} />}
    <span>{children}</span>
  </motion.div>
);

const GoButton = ({ children, onClick, disabled }) => (
  <motion.button
    type="button"
    className="sage-primary-button"
    disabled={disabled}
    onClick={onClick}
    whileHover={disabled ? {} : { scale: 1.04 }}
    whileTap={disabled ? {} : { scale: 0.96 }}
  >
    <span>{children}</span>
    <ArrowRight size={18} strokeWidth={1.5} />
  </motion.button>
);

/* ---------- main game ---------- */

function MemoryOfASageGame({ onComplete }) {
  const [stage, setStage] = useState(STAGES.INTRO);
  const [deck, setDeck] = useState(() => shuffle(TURN_FRAGMENTS));
  const [progress, setProgress] = useState(0);
  const [wrongId, setWrongId] = useState(null);

  const [choiceWrong, setChoiceWrong] = useState([]);
  const [choiceCorrect, setChoiceCorrect] = useState(false);

  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [popup, setPopup] = useState(null);

  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* parallax */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 20 });
  const sy = useSpring(my, { stiffness: 50, damping: 20 });
  const farX = useTransform(sx, (v) => v * -26);
  const farY = useTransform(sy, (v) => v * -26);
  const nearX = useTransform(sx, (v) => v * 40);
  const nearY = useTransform(sy, (v) => v * 40);
  const onMove = (e) => {
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  };

  const pop = (text, good) => {
    setPopup({ id: Date.now() + Math.random(), text, good });
    later(() => setPopup(null), 1000);
  };
  const good = (pts = 100) => {
    setScore((s) => s + pts);
    pop(`+${pts}`, true);
  };
  const bad = () => {
    setScore((s) => Math.max(0, s - 25));
    setMistakes((m) => m + 1);
    setWrongFlash(true);
    later(() => setWrongFlash(false), 450);
    pop("−25", false);
  };

  const stageIndex = FLOW.findIndex((s) => s.id === stage);

  const pickChoice = (id) => {
    if (choiceCorrect || choiceWrong.includes(id)) return;
    if (id === "shabala") {
      setChoiceCorrect(true);
      good(150);
    } else {
      setChoiceWrong((w) => [...w, id]);
      bad();
    }
  };

  const pickTurn = (id) => {
    if (id === TURN_ORDER[progress]) {
      const n = progress + 1;
      setProgress(n);
      good(100);
      if (n >= TURN_ORDER.length) later(() => setStage(STAGES.COMPLETE), 1000);
    } else {
      setWrongId(id);
      later(() => setWrongId(null), 520);
      bad();
    }
  };

  const reset = () => {
    setStage(STAGES.INTRO);
    setDeck(shuffle(TURN_FRAGMENTS));
    setProgress(0);
    setWrongId(null);
    setChoiceWrong([]);
    setChoiceCorrect(false);
    setScore(0);
    setMistakes(0);
    setWrongFlash(false);
  };

  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;

  return (
    <div
      className={`sage-game ${wrongFlash ? "sage-game--wrong" : ""}`}
      aria-label="The Memory of a Sage"
      onMouseMove={onMove}
    >
      <div className="sage-bg" aria-hidden="true">
        <motion.div className="sage-bg__mandala" style={{ x: farX, y: farY }}>
          <span /><span /><span /><span />
        </motion.div>
        <motion.div className="sage-bg__mountains" style={{ x: nearX, y: nearY }} />
        <div className="sage-bg__vignette" />
      </div>
      <Embers />

      {stageIndex >= 0 && (
        <header className="sage-hud">
          <div className="sage-hud__title">
            <span className="sage-game__eyebrow">THE MEMORY OF A SAGE</span>
            <h2>{FLOW[stageIndex].label}</h2>
          </div>
          <div className="sage-hud__stats">
            <div className="sage-stat">
              <Sparkles size={14} />
              <b>{score}</b>
              <small>Wisdom</small>
            </div>
          </div>
          <div className="sage-hud__steps" role="progressbar" aria-valuemax={FLOW.length} aria-valuenow={stageIndex + 1}>
            {FLOW.map((s, i) => (
              <span key={s.id} className={i < stageIndex ? "is-done" : i === stageIndex ? "is-now" : ""} />
            ))}
          </div>
        </header>
      )}

      <AnimatePresence>
        {popup && (
          <motion.div
            key={popup.id}
            className={`sage-popup ${popup.good ? "is-good" : "is-bad"}`}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -34, scale: 1.1 }}
            exit={{ opacity: 0, y: -70 }}
          >
            {popup.text}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* 1 · INTRO */}
        {stage === STAGES.INTRO && (
          <motion.section
            key="intro"
            className="sage-screen sage-screen--intro"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.06, filter: "blur(8px)" }}
            transition={{ duration: 0.7 }}
          >
            <Orb3D icon={Crown} size={230} iconSize={66} />
            <span className="sage-screen__kicker">SHATANANDA'S STORY</span>
            <h1>
              Vishvamitra was once
              <span>a king.</span>
            </h1>
            <p>
              He had commanded armies and travelled with the confidence of royalty. Two quick
              memories will show how a king became a sage.
            </p>
            <GoButton onClick={() => setStage(STAGES.DESIRE)}>BEGIN</GoButton>
          </motion.section>
        )}

        {/* 2 · THE DESIRE */}
        {stage === STAGES.DESIRE && (
          <motion.section
            key="desire"
            className="sage-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SectionIntro
              kicker="AT VASISHTHA'S HERMITAGE"
              line1="One sight stirred"
              line2="the king's desire."
              text="Vishvamitra met something whose powers could provide everything the sage's guests required. What did he want to possess?"
            />
            <div className="sage-choice-grid">
              {CHOICES.map((c, i) => {
                const Icon = c.icon;
                const ok = choiceCorrect && c.id === "shabala";
                const no = choiceWrong.includes(c.id);
                return (
                  <Reveal key={c.id} i={i}>
                    <Tilt
                      className={`sage-choice ${ok ? "sage-choice--correct" : ""} ${no ? "sage-choice--wrong" : ""}`}
                      disabled={no || choiceCorrect}
                      onClick={() => pickChoice(c.id)}
                    >
                      <span className="sage-choice__icon">
                        {ok ? <Check size={23} /> : no ? <X size={23} /> : <Icon size={23} strokeWidth={1.3} />}
                      </span>
                      <span>{c.label}</span>
                    </Tilt>
                  </Reveal>
                );
              })}
            </div>
            <AnimatePresence mode="wait">
              {choiceCorrect ? (
                <Feedback key="y" ok>
                  Shabala — and he believed such a treasure belonged naturally in the hands of a king.
                </Feedback>
              ) : choiceWrong.length > 0 ? (
                <Feedback key="n" ok={false}>
                  Not quite. Think of what could provide for every guest of the hermitage.
                </Feedback>
              ) : null}
            </AnimatePresence>
            <GoButton disabled={!choiceCorrect} onClick={() => setStage(STAGES.TURN)}>
              WHAT HAPPENED NEXT
            </GoButton>
          </motion.section>
        )}

        {/* 3 · THE TURNING POINT */}
        {stage === STAGES.TURN && (
          <motion.section
            key="turn"
            className="sage-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SectionIntro
              kicker="THE TURNING POINT"
              line1="Put the memory"
              line2="in its true order."
              text="Vasishtha refused, and Vishvamitra's life changed. Tap the three moments in the order they happened."
            />

            <div className="sage-slots">
              {TURN_ORDER.map((id, i) => {
                const f = TURN_FRAGMENTS.find((x) => x.id === id);
                const filled = i < progress;
                return (
                  <div key={id} className={`sage-slot ${filled ? "is-filled" : ""} ${i === progress ? "is-next" : ""}`}>
                    <b>{ROMAN[i]}</b>
                    <span>{filled ? f.title : "· · ·"}</span>
                  </div>
                );
              })}
            </div>

            <div className="sage-fragment-grid" style={{ marginTop: 22 }}>
              {deck.map((f, i) => {
                const used = TURN_ORDER.indexOf(f.id) < progress;
                const Icon = f.icon;
                return (
                  <Reveal key={f.id} i={i}>
                    <Tilt
                      className={`sage-fragment ${used ? "sage-fragment--used" : ""} ${wrongId === f.id ? "is-shake" : ""}`}
                      disabled={used}
                      onClick={() => pickTurn(f.id)}
                    >
                      <span className="sage-fragment__icon">
                        {used ? <Check size={18} strokeWidth={1.6} /> : <Icon size={18} strokeWidth={1.4} />}
                      </span>
                      <span className="sage-fragment__title">{f.title}</span>
                      <span className="sage-fragment__text">{f.text}</span>
                    </Tilt>
                  </Reveal>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* 4 · COMPLETE */}
        {stage === STAGES.COMPLETE && (
          <motion.section
            key="complete"
            className="sage-screen sage-screen--complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="sage-transformation">
              <motion.div
                className="sage-transformation__flash"
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 1, 0], scale: [0.2, 2.4, 3] }}
                transition={{ duration: 1.6, delay: 0.5, times: [0, 0.4, 1] }}
              />
              <motion.div
                className="sage-transformation__stage"
                initial={{ opacity: 1, scale: 1, rotateY: 0 }}
                animate={{ opacity: 0, scale: 0.6, rotateY: 160, filter: "blur(10px)" }}
                transition={{ duration: 1.1, delay: 0.3, ease: "easeIn" }}
              >
                <Orb3D icon={Crown} size={230} iconSize={72} />
              </motion.div>
              <motion.div
                className="sage-transformation__stage"
                initial={{ opacity: 0, scale: 0.5, rotateY: -160 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1.3, delay: 1.1, ease: "easeOut" }}
              >
                <Orb3D icon={ScrollText} size={230} iconSize={72} tone="sage" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9, duration: 0.8 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <span className="sage-screen__kicker">MEMORY RESTORED</span>
              <h1>
                The king
                <span>became the sage.</span>
              </h1>

              <div className="sage-stars">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className={i < stars ? "is-lit" : ""}
                    initial={{ opacity: 0, scale: 0, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 2.2 + i * 0.25, type: "spring", stiffness: 220 }}
                  >
                    <Star size={30} strokeWidth={1.2} />
                  </motion.span>
                ))}
              </div>

              <p>
                His royal power failed against spiritual strength, and that humiliation turned him
                toward years of austerity. The journey was powerful precisely because it had not
                been easy.
              </p>

              <div className="sage-complete__actions">
                <button type="button" className="sage-secondary-button" onClick={reset}>
                  <RotateCcw size={14} /> PLAY AGAIN
                </button>
                <GoButton onClick={onComplete}>CONTINUE THE STORY</GoButton>
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MemoryOfASageGame;