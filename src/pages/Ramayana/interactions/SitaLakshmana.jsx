import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Volume2, VolumeX, X } from "lucide-react";
import "./SitaLakshmana.css";

/* ------------------------------------------------------------------ */
/*  Assets                                                             */
/* ------------------------------------------------------------------ */

const IMAGE_PATH = "/images/ramayana/interactions/";
const IMAGES = {
  1: `${IMAGE_PATH}ch23g1.jpg`,
  2: `${IMAGE_PATH}ch23g2.jpg`,
  3: `${IMAGE_PATH}ch23g3.jpg`,
  4: `${IMAGE_PATH}ch23g4.jpg`,
  5: `${IMAGE_PATH}ch23g5.jpg`,
};

/* ------------------------------------------------------------------ */
/*  Story — one beat = one line on screen. Wording is preserved.       */
/*  hold = quiet pause (ms) after the beat, before the next one.       */
/* ------------------------------------------------------------------ */

const sita = (scene, text, hold) => ({ scene, who: "SITA", text, hold });
const lak = (scene, text, hold) => ({ scene, who: "LAKSHMANA", text, hold });
const nar = (scene, text, hold) => ({ scene, who: null, text, hold });

const beats = [
  /* Scene 1 — The Silence */
  nar(1, "The Ganga lay behind them. The forest stretched ahead."),
  nar(
    1,
    "Sita looked towards the distant trees, expecting Lakshmana to lead her towards the hermitages."
  ),
  nar(1, "But he had stopped."),
  nar(
    1,
    "Throughout the journey, he had remained unusually silent. Now, as they stood beside the sacred river, Sita turned towards him."
  ),
  sita(
    1,
    "Lakshmana, why have we stopped? Are the hermitages still far away?",
    900
  ),
  lak(1, "Mother… there is something I must tell you."),
  sita(1, "What is it? You have hardly spoken throughout our journey.", 700),

  /* Scene 2 — The Truth Revealed */
  lak(
    2,
    "Mother, forgive me. I have brought you here under a command that I cannot bear to carry out."
  ),
  sita(2, "A command? What are you saying, Lakshmana?"),
  lak(2, "Some citizens have begun questioning your time in Lanka."),
  lak(
    2,
    "Though Rama knows your innocence, he believes the throne must remain beyond public doubt."
  ),
  lak(
    2,
    "He has commanded me to leave you here, near the hermitages of the sages."
  ),
  nar(
    2,
    "Lakshmana lowered his eyes. He could not bring himself to look upon her after speaking those words.",
    900
  ),

  /* Scene 3 — Sita's Disbelief */
  sita(3, "Rama… has asked this of you?"),
  lak(3, "Yes, Mother."),
  sita(3, "Did he not see me return from Lanka?"),
  sita(3, "Did he not hear the testimony of Agni?"),
  sita(3, "Did he not accept me before the assembled witnesses?"),
  sita(
    3,
    "I endured captivity without abandoning my heart. I waited for him, trusting that he would come."
  ),
  sita(3, "And now, after everything… he has sent me away?"),
  nar(
    3,
    "For a moment, Sita could find no more words. The truth had reached her, but her heart struggled to accept it.",
    1400
  ),

  /* Scene 4 — Sita's Sorrow */
  sita(4, "I had thought the hardships of the forest were behind me."),
  sita(
    4,
    "I believed I had finally returned to a home where I could live in peace."
  ),
  sita(
    4,
    "Yet once again, I find myself standing far from everything I called home."
  ),
  lak(
    4,
    "Mother, I do not know how to answer you. I have only been commanded to bring you here."
  ),
  sita(4, "Do not blame yourself, Lakshmana. I know this was not your wish."),
  nar(
    4,
    "Sita looked towards the river. The same world that had once welcomed her return now seemed distant and unfamiliar.",
    2600
  ),

  /* Scene 5 — The Farewell */
  nar(5, "Lakshmana bows deeply before Sita."),
  lak(5, "Mother, I have always regarded you with the reverence I would give my own mother."),
  lak(
    5,
    "I stood beside you in the forest. Today, I have been made to do something my heart cannot accept."
  ),
  sita(5, "Rise, Lakshmana. I know your heart."),
  sita(
    5,
    "Return to Ayodhya. Do not allow my suffering to turn you against your brother."
  ),
  sita(
    5,
    "But tell Rama that the woman he has sent away is the same woman who stood beside him through every hardship."
  ),
  lak(5, "Mother… forgive me."),
  nar(5, "Lakshmana bowed before her one final time."),
  nar(5, "He then turned towards the chariot, unable to remain any longer."),
  nar(
    5,
    "Sita stood beside the sacred river as he departed, leaving her alone in the forest.",
    1200
  ),
];

/* ------------------------------------------------------------------ */
/*  Typewriter — fast, click-to-complete                               */
/* ------------------------------------------------------------------ */

const TYPE_MS = 15;

function useTypewriter(text, active, resetKey) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    setCount(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(id);
    }, TYPE_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, active]);

  const done = count >= text.length;
  const finish = useCallback(() => setCount(text.length), [text]);
  return { count, done, finish };
}

/* ------------------------------------------------------------------ */
/*  Audio — generated with Web Audio (no files). Fully optional.       */
/* ------------------------------------------------------------------ */

const SCENE_MIX = {
  // river, pad (soft score)
  1: { river: 0.55, pad: 0.0 },
  2: { river: 0.45, pad: 0.05 },
  3: { river: 0.38, pad: 0.016 },
  4: { river: 0.34, pad: 0.0 },
  5: { river: 0.4, pad: 0.055 },
};

const THEME = [293.66, 349.23, 392.0, 349.23, 440.0, 392.0, 349.23, 293.66];

function createAudioEngine(startMuted) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  let level = startMuted ? 0 : 0.6;
  master.gain.linearRampToValueAtTime(level, ctx.currentTime + 3);

  /* river: slowly breathing brown noise */
  const length = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 720;
  band.Q.value = 0.6;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 240;
  lfo.connect(lfoGain);
  lfoGain.connect(band.frequency);

  const river = ctx.createGain();
  river.gain.value = 0.5;
  noise.connect(band);
  band.connect(river);
  river.connect(master);
  noise.start();
  lfo.start();

  /* soft pad: D minor, gentle detune */
  const pad = ctx.createGain();
  pad.gain.value = 0;
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 850;
  pad.connect(padFilter);
  padFilter.connect(master);

  const oscs = [146.83, 220.0, 293.66, 349.23].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = i % 2 ? "triangle" : "sine";
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 4;
    o.connect(pad);
    o.start();
    return o;
  });

  /* sparse melody for the farewell */
  let melodyTimer = null;
  let melodyIndex = 0;
  const playNote = (freq) => {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 4.2);
    o.connect(g);
    g.connect(padFilter);
    o.start(t);
    o.stop(t + 4.4);
  };

  const setScene = (scene) => {
    const mix = SCENE_MIX[scene] || SCENE_MIX[1];
    const t = ctx.currentTime;
    river.gain.cancelScheduledValues(t);
    river.gain.linearRampToValueAtTime(mix.river, t + 2.5);
    pad.gain.cancelScheduledValues(t);
    pad.gain.linearRampToValueAtTime(mix.pad, t + 3);

    window.clearInterval(melodyTimer);
    melodyTimer = null;
    if (scene === 5) {
      melodyTimer = window.setInterval(() => {
        playNote(THEME[melodyIndex % THEME.length]);
        melodyIndex += 1;
      }, 3000);
    }
  };

  const setMuted = (muted) => {
    level = muted ? 0 : 0.6;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.linearRampToValueAtTime(level, t + 0.6);
    if (!muted && ctx.state === "suspended") ctx.resume();
  };

  const destroy = () => {
    window.clearInterval(melodyTimer);
    try {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.linearRampToValueAtTime(0, t + 0.8);
      window.setTimeout(() => {
        try {
          noise.stop();
          lfo.stop();
          oscs.forEach((o) => o.stop());
          ctx.close();
        } catch (e) {
          /* already closed */
        }
      }, 900);
    } catch (e) {
      /* ignore */
    }
  };

  return { setScene, setMuted, destroy };
}

/* ------------------------------------------------------------------ */
/*  Golden motes — drifting light dust over the scene                  */
/* ------------------------------------------------------------------ */

function Motes({ disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled) return undefined;
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const dots = Array.from({ length: 46 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 2.2,
      vy: 0.08 + Math.random() * 0.26,
      vx: (Math.random() - 0.5) * 0.12,
      ph: Math.random() * 6.28,
      z: Math.random(),
    }));

    const tick = (t) => {
      ctx.clearRect(0, 0, w, h);
      dots.forEach((d) => {
        d.y -= d.vy * (0.5 + d.z);
        d.x += d.vx + Math.sin(t / 2200 + d.ph) * 0.12;
        if (d.y < -8) {
          d.y = h + 8;
          d.x = Math.random() * w;
        }
        const a =
          (0.25 + 0.45 * (Math.sin(t / 900 + d.ph) * 0.5 + 0.5)) *
          (0.4 + 0.6 * d.z);
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 4);
        g.addColorStop(0, `rgba(255,226,150,${a})`);
        g.addColorStop(1, "rgba(255,226,150,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 4, 0, 6.283);
        ctx.fill();
      });
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [disabled]);

  if (disabled) return null;
  return <canvas ref={ref} className="sl__motes" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function SitaLakshmana({ onComplete, onExit }) {
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState("title"); // title | story | end
  const [step, setStep] = useState(0);
  const [holding, setHolding] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const audioRef = useRef(null);
  const holdTimer = useRef(null);

  const beat = beats[step];
  const scene = phase === "title" ? 1 : beat.scene;
  const typing = phase === "story" && !holding;
  const { count, done, finish } = useTypewriter(beat.text, typing, step);

  /* ---------- 3D tilt ---------- */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 18 });
  const sy = useSpring(my, { stiffness: 55, damping: 18 });
  const rotateY = useTransform(sx, [-1, 1], [-4.5, 4.5]);
  const rotateX = useTransform(sy, [-1, 1], [3.5, -3.5]);
  const imgX = useTransform(sx, [-1, 1], [16, -16]);
  const imgY = useTransform(sy, [-1, 1], [10, -10]);
  const moteX = useTransform(sx, [-1, 1], [-26, 26]);
  const moteY = useTransform(sy, [-1, 1], [-16, 16]);

  const onPointerMove = (e) => {
    if (reduced || e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };
  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  /* ---------- audio ---------- */
  useEffect(() => {
    if (audioRef.current) audioRef.current.setScene(scene);
  }, [scene, phase]);

  useEffect(
    () => () => {
      window.clearTimeout(holdTimer.current);
      if (audioRef.current) audioRef.current.destroy();
    },
    []
  );

  const toggleSound = (e) => {
    e.stopPropagation();
    const next = !soundOn;
    setSoundOn(next);
    if (audioRef.current) audioRef.current.setMuted(!next);
  };

  /* ---------- flow ---------- */
  const begin = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = createAudioEngine(!soundOn);
        if (audioRef.current) audioRef.current.setScene(1);
      }
    } catch (err) {
      audioRef.current = null; // audio is optional
    }
    setStep(0);
    setPhase("story");
  };

  const advance = useCallback(() => {
    if (phase === "title") {
      begin();
      return;
    }
    if (phase !== "story" || holding) return;

    if (!done) {
      finish();
      return;
    }

    const go = () => {
      if (step >= beats.length - 1) setPhase("end");
      else setStep((s) => s + 1);
    };

    if (beat.hold) {
      setHolding(true);
      holdTimer.current = window.setTimeout(() => {
        setHolding(false);
        go();
      }, beat.hold);
    } else {
      go();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, holding, done, finish, step, beat]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        onExit && onExit();
      } else if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        if (phase === "end") return;
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, onExit, phase]);

  const handleComplete = () => {
    if (audioRef.current) {
      audioRef.current.destroy();
      audioRef.current = null;
    }
    onComplete && onComplete();
  };

  const handleExit = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.destroy();
      audioRef.current = null;
    }
    onExit && onExit();
  };

  const progress =
    phase === "title" ? 0 : phase === "end" ? 100 : ((step + 1) / beats.length) * 100;

  const title = "SITA AND LAKSHMANA";

  return (
    <main
      className="sl"
      data-scene={scene}
      data-phase={phase}
      onClick={phase === "end" ? undefined : advance}
    >
      {/* ---------------- Cinematic stage ---------------- */}
      <section
        className="sl__stage"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div className="sl__perspective">
          <motion.div
            className="sl__scene3d"
            style={reduced ? undefined : { rotateX, rotateY }}
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={scene}
                className="sl__plate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                <motion.div
                  className="sl__parallax"
                  style={reduced ? undefined : { x: imgX, y: imgY }}
                >
                  <img
                    className={`sl__img sl__img--${scene}`}
                    src={IMAGES[scene]}
                    alt=""
                    draggable="false"
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <div className="sl__rays" />
            <div className="sl__water" />
            <div className="sl__vignette" />
          </motion.div>
        </div>

        <motion.div
          className="sl__motes-wrap"
          style={reduced ? undefined : { x: moteX, y: moteY }}
        >
          <Motes disabled={reduced} />
        </motion.div>

        <header className="sl__header">
          <div className="sl__brand">
            ANCESTRA
            <span>Chapter XXIII</span>
          </div>
          <div className="sl__tools">
            <button
              type="button"
              className="sl__icon"
              onClick={toggleSound}
              aria-label={soundOn ? "Mute sound" : "Turn sound on"}
              title={soundOn ? "Mute sound" : "Turn sound on"}
            >
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              type="button"
              className="sl__icon"
              onClick={handleExit}
              aria-label="Exit experience"
              title="Exit experience"
            >
              <X size={19} />
            </button>
          </div>
        </header>
      </section>

      {/* ---------------- Dialogue (fixed area, no box) ---------------- */}
      <section className="sl__voice" aria-live="polite">
        {phase === "title" && (
          <div className="sl__title">
            <h1 aria-label={title}>
              {title.split("").map((ch, i) => (
                <span
                  key={i}
                  className="sl__letter"
                  style={{ "--i": i }}
                  aria-hidden="true"
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </h1>
            <p className="sl__subtitle">A FAREWELL BESIDE THE GANGA</p>
            <button
              type="button"
              className="sl__begin"
              onClick={(e) => {
                e.stopPropagation();
                begin();
              }}
            >
              BEGIN
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "story" && !holding && (
            <motion.div
              key={step}
              className={`sl__line ${beat.who ? "is-speech" : "is-narration"}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              {beat.who ? (
                <p className="sl__speaker">{beat.who}</p>
              ) : (
                <p className="sl__ornament" aria-hidden="true">
                  <i />
                </p>
              )}
              <p className="sl__text">
                <span>{beat.text.slice(0, count)}</span>
                <span className="sl__ghost">{beat.text.slice(count)}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ---------------- Footer ---------------- */}
      {phase === "story" && (
        <footer className="sl__footer">
          <button
            type="button"
            className="sl__continue"
            onClick={(e) => {
              e.stopPropagation();
              advance();
            }}
          >
            CONTINUE
            <ArrowRight size={14} />
          </button>
        </footer>
      )}
      <div className="sl__progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      {/* ---------------- Closing screen ---------------- */}
      <AnimatePresence>
        {phase === "end" && (
          <motion.div
            className="sl__end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <motion.div
              className="sl__end-inner"
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
            >
              <h2>SITA AND LAKSHMANA</h2>
              <span className="sl__rule" aria-hidden="true" />
              <p className="sl__quote">
                Some farewells are remembered not for the words spoken, but for
                the words left unspoken.
              </p>
              <p className="sl__label">
                THE SHADOW OVER AYODHYA — CHAPTER XXIII
              </p>
              <button
                type="button"
                className="sl__begin"
                onClick={handleComplete}
              >
                CONTINUE THE STORY
                <ArrowRight size={15} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}