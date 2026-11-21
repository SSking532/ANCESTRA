import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import "./JatayuLastTestimony.css";

const IMAGE_PATH = "/images/ramayana/interactions/";

/* =========================================================
   STORY DATA
   focus = object-position of the image inside its frame
========================================================= */
const scenes = [
  {
    id: 1,
    image: "ch9g11.jpg",
    focus: "50% 40%",
    location: "THE FOREST CLEARING",
    title: "A familiar presence",
    speaker: "NARRATION",
    paragraphs: [
      "As Rama and Lakshmana continued their search through the forest, they came upon a sight that brought them to an abrupt halt.",
      "Beneath the ancient trees lay a mighty figure. His great wings rested upon the earth, and his once-majestic form had grown still.",
      "Rama recognised him at once.",
      "It was Jatayu — the noble king of the vultures, his father's dear friend, and an elder whom Rama had known and respected since childhood.",
      "Forgetting everything else for a moment, Rama hurried towards him.",
    ],
  },
  {
    id: 2,
    image: "ch9g12.jpg",
    focus: "50% 40%",
    location: "BENEATH THE ANCIENT TREES",
    title: "Rama reaches his side",
    speaker: "NARRATION",
    paragraphs: [
      "Rama knelt beside Jatayu and gently placed a hand upon him.",
      "His expression changed as he saw the condition of the noble king. This was not a stranger lying before him. This was a friend of his father, someone who had once been welcomed as a member of their family.",
      "Rama's voice softened with worry.",
      "He called to Jatayu, hoping he would hear him, hoping there was still time.",
    ],
  },
  {
    id: 3,
    image: "ch9g13.jpg",
    focus: "50% 40%",
    location: "A FAINT WHISPER",
    title: "Sita...",
    speaker: "JATAYU",
    paragraphs: [
      "Jatayu slowly stirred.",
      "His eyes opened faintly. He recognised Rama beside him and tried to speak.",
      "His voice was weak, barely rising above the silence of the forest.",
      "Sita...",
      "The name escaped his lips like the last message he had been waiting to deliver.",
    ],
    speech: [3],
  },
  {
    id: 4,
    image: "ch9g12.jpg",
    focus: "50% 40%",
    location: "THE QUESTION",
    title: "What about Sita?",
    speaker: "RAMA",
    paragraphs: [
      "At the sound of her name, Rama leaned closer.",
      "He held Jatayu's hand, his attention fixed entirely upon him.",
      "What had happened to Sita? Had Jatayu seen her? Was she safe?",
      "Rama asked about her with an urgency that words could scarcely contain.",
      "Jatayu gathered what little strength remained. He knew Rama needed to hear the truth.",
    ],
    speech: [2],
  },
  {
    id: 5,
    image: "ch9g13.jpg",
    focus: "50% 40%",
    location: "JATAYU'S TESTIMONY",
    title: "The Pushpaka Vimana",
    speaker: "JATAYU",
    paragraphs: [
      "Rama... Ravana... the king of Lanka...",
      "He came in the Pushpaka Vimana and took Sita away.",
      "I saw him carrying her away. I could not remain still while she called for help.",
      "I tried to protect her, Rama. I tried with all my strength...",
      "But I failed to protect her.",
    ],
    speech: [0, 1, 2, 3, 4],
  },
  {
    id: 6,
    image: "ch9g12.jpg",
    focus: "50% 40%",
    location: "A SON'S GRIEF",
    title: "You did not fail",
    speaker: "NARRATION",
    paragraphs: [
      "Rama remained beside him, unable to look away.",
      "Jatayu had stood against Ravana when no one else was there to protect Sita. He had risked everything for her, not because he was commanded to, but because righteousness demanded it.",
      "Rama's sorrow was now the sorrow of a husband searching for his wife, and of a son watching a beloved elder fade before him.",
      "He held Jatayu close. There was no failure in what Jatayu had done. His courage had already spoken louder than words ever could.",
    ],
  },
  {
    id: 7,
    image: "ch9g14.jpg",
    focus: "50% 40%",
    location: "THE FINAL MOMENTS",
    title: "One last look",
    speaker: "NARRATION",
    paragraphs: [
      "The forest grew still.",
      "Jatayu looked once more towards Rama. He had delivered the truth he had carried through his final moments.",
      "Rama stayed beside him, holding the hand of the elder who had once been so dear to his father.",
      "There were no more questions. No more answers were needed.",
      "With the last strength of his voice, Jatayu called out once more...",
    ],
  },
  {
    id: 8,
    image: "ch9g14.jpg",
    focus: "50% 40%",
    location: "THE LAST WORDS",
    title: "Hey Rama!!",
    speaker: "JATAYU",
    final: true,
    paragraphs: ["Hey Rama!!"],
  },
];

const endingText = [
  "Jatayu's voice fell silent.",
  "Rama remained beside him, grieving the loss of a beloved elder. Jatayu had not been able to save Sita, but he had stood against Ravana when no one else was there to protect her.",
  "Rama honoured him with the final rites of a son for his father.",
  "The noble king of the vultures would never be forgotten.",
];

const TOTAL = scenes.length;

/* =========================================================
   SOUNDSCAPE — synthesised with WebAudio, no asset files.
   A low drone pad, a soft tick per word, and a deep bell.
========================================================= */
function useSoundscape(enabled) {
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return undefined;

    if (!enabled) {
      const ctx = ctxRef.current;
      if (ctx && masterRef.current) {
        masterRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      }
      return undefined;
    }

    if (!ctxRef.current) {
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 380;
      filter.Q.value = 0.7;

      const pad = ctx.createGain();
      pad.gain.value = 0.16;
      filter.connect(pad);
      pad.connect(master);

      [55, 82.41, 110.3, 164.8].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = i % 2 ? "sine" : "triangle";
        osc.frequency.value = freq;
        osc.detune.value = (i - 1.5) * 6;
        const g = ctx.createGain();
        g.gain.value = i === 3 ? 0.25 : 0.6;
        osc.connect(g);
        g.connect(filter);
        osc.start();
      });

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 140;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      ctxRef.current = ctx;
      masterRef.current = master;
    }

    const ctx = ctxRef.current;
    ctx.resume?.();
    masterRef.current.gain.setTargetAtTime(0.55, ctx.currentTime, 0.9);
    return undefined;
  }, [enabled]);

  useEffect(
    () => () => {
      ctxRef.current?.close?.();
      ctxRef.current = null;
    },
    []
  );

  const tick = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !enabledRef.current) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 480 + Math.random() * 160;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.014, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(g);
    g.connect(masterRef.current);
    osc.start(now);
    osc.stop(now + 0.13);
  }, []);

  const bell = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !enabledRef.current) return;
    const now = ctx.currentTime;
    [98, 147, 196.5, 294].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.32 / (i + 1), now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 6);
      osc.connect(g);
      g.connect(masterRef.current);
      osc.start(now);
      osc.stop(now + 6.2);
    });
  }, []);

  return { tick, bell };
}

/* =========================================================
   EMBER PARTICLES — drifting golden sparks on a canvas
========================================================= */
function Embers({ intensity = 1, disabled }) {
  const canvasRef = useRef(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    if (disabled) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const make = (initial) => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 10,
      r: 0.6 + Math.random() * 2.1,
      vy: 0.15 + Math.random() * 0.55,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.004 + Math.random() * 0.01,
      swayAmp: 0.2 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      hue: 32 + Math.random() * 18,
    });

    const particles = Array.from({ length: 70 }, () => make(true));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const k = intensityRef.current;
      particles.forEach((p) => {
        p.y -= p.vy * k;
        p.sway += p.swaySpeed;
        p.x += Math.sin(p.sway) * p.swayAmp;
        p.phase += 0.03;
        if (p.y < -10) Object.assign(p, make(false));
        const fade = Math.min(1, Math.max(0, (p.y / h) * 1.6));
        const flicker = 0.55 + Math.sin(p.phase) * 0.35;
        const alpha = flicker * fade * 0.85;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `hsla(${p.hue}, 95%, 68%, ${alpha})`);
        g.addColorStop(1, `hsla(${p.hue}, 95%, 55%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [disabled]);

  if (disabled) return null;
  return <canvas ref={canvasRef} className="jlt-embers" aria-hidden="true" />;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function JatayuLastTestimony({ onComplete = () => {}, onExit = () => {} }) {
  const reducedMotion = useReducedMotion();

  const [screen, setScreen] = useState("intro"); // intro | story | ending | complete
  const [sceneIndex, setSceneIndex] = useState(0);
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [muted, setMuted] = useState(true);
  const [impact, setImpact] = useState(false);

  const timerRef = useRef(null);
  const startRef = useRef(null);
  const { tick, bell } = useSoundscape(!muted);

  const scene = scenes[sceneIndex];
  const fullText = scene.paragraphs[paragraphIndex] ?? "";
  const words = useMemo(() => fullText.split(" "), [fullText]);
  const isTyping = screen === "story" && shown < words.length;
  const isLastScene = sceneIndex === TOTAL - 1;
  const isLastParagraph = paragraphIndex === scene.paragraphs.length - 1;
  const isSpeech = scene.speaker !== "NARRATION" && (scene.speech ? scene.speech.includes(paragraphIndex) : false);

  /* ---------- 3D tilt (mouse parallax) ---------- */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 16, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 16, mass: 0.6 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-9, 9]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [7, -7]);
  const imgX = useTransform(sx, [-0.5, 0.5], [18, -18]);
  const imgY = useTransform(sy, [-0.5, 0.5], [12, -12]);
  const glareX = useTransform(sx, [-0.5, 0.5], ["15%", "85%"]);
  const glareY = useTransform(sy, [-0.5, 0.5], ["10%", "90%"]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,226,160,0.26), transparent 55%)`;

  const handleMouseMove = (e) => {
    if (reducedMotion) return;
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  };

  /* ---------- word-by-word reveal ---------- */
  const clearTimers = () => {
    clearInterval(timerRef.current);
    clearTimeout(startRef.current);
    timerRef.current = null;
    startRef.current = null;
  };

  useEffect(() => {
    if (screen !== "story") return undefined;
    clearTimers();
    setShown(0);

    if (reducedMotion) {
      setShown(words.length);
      return undefined;
    }

    const delay = scene.final ? 720 : words.length > 18 ? 58 : 74;
    let n = 0;

    startRef.current = setTimeout(() => {
      timerRef.current = setInterval(() => {
        n += 1;
        setShown(n);
        tick();
        if (n >= words.length) clearTimers();
      }, delay);
    }, scene.final ? 900 : 260);

    return clearTimers;
  }, [screen, sceneIndex, paragraphIndex, words, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- cinematic impact on the last words ---------- */
  useEffect(() => {
    if (screen === "story" && scene.final && shown >= words.length && words.length > 0) {
      bell();
      setImpact(true);
      const t = setTimeout(() => setImpact(false), 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [shown, screen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- navigation ---------- */
  const closeGame = () => {
    clearTimers();
    onExit();
  };

  const continueStory = () => {
    if (screen !== "story") return;

    if (isTyping) {
      clearTimers();
      setShown(words.length);
      return;
    }
    if (!isLastParagraph) {
      setParagraphIndex((c) => c + 1);
      return;
    }
    if (isLastScene) {
      setScreen("ending");
      return;
    }
    setSceneIndex((c) => c + 1);
    setParagraphIndex(0);
  };

  const startStory = () => {
    setSceneIndex(0);
    setParagraphIndex(0);
    setShown(0);
    setScreen("story");
  };

  const finishStory = () => {
    setScreen("complete");
    onComplete();
  };

  const latest = useRef({});
  latest.current = { continueStory, closeGame, startStory, finishStory, screen };

  useEffect(() => {
    const onKey = (e) => {
      const { screen: s } = latest.current;
      if (e.key === "Escape") {
        latest.current.closeGame();
        return;
      }
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        if (s === "intro") latest.current.startStory();
        else if (s === "story") latest.current.continueStory();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- progress ---------- */
  const segmentFill = (i) => {
    if (screen === "ending" || screen === "complete") return 100;
    if (screen === "intro") return 0;
    if (i < sceneIndex) return 100;
    if (i === sceneIndex) return ((paragraphIndex + (isTyping ? 0.5 : 1)) / scene.paragraphs.length) * 100;
    return 0;
  };

  const buttonLabel = isTyping ? "REVEAL" : isLastScene && isLastParagraph ? "END" : "CONTINUE";

  const embersLevel = screen === "story" ? (scene.final ? 1.9 : 1) : 0.8;
  const imageForBackdrop = screen === "story" ? scene.image : "ch9g11.jpg";

  /* ======================================================= */
  return (
    <main
      className={`jlt-game ${scene.final && screen === "story" ? "is-final" : ""} ${impact ? "is-impact" : ""}`}
      onMouseMove={handleMouseMove}
    >
      {/* ---------- ATMOSPHERE ---------- */}
      <div className="jlt-backdrop" aria-hidden="true">
        <AnimatePresence>
          <motion.img
            key={imageForBackdrop}
            src={`${IMAGE_PATH}${imageForBackdrop}`}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
            draggable="false"
          />
        </AnimatePresence>
      </div>
      <div className="jlt-light-rays" aria-hidden="true" />
      <Embers intensity={embersLevel} disabled={reducedMotion} />
      <div className="jlt-vignette" aria-hidden="true" />
      <div className="jlt-grain" aria-hidden="true" />
      <div className="jlt-flash" aria-hidden="true" />

      {/* ---------- HEADER ---------- */}
      <header className="jlt-header">
        <div className="jlt-brand">
          <span className="jlt-brand-mark">✦</span>
          <span className="jlt-brand-name">ANCESTRA</span>
        </div>

        <div className="jlt-header-center">
          <span>RAMAYANA</span>
          <i>·</i>
          <span>JATAYU&apos;S LAST TESTIMONY</span>
        </div>

        <div className="jlt-actions">
          <button
            className={`jlt-icon-button ${muted ? "" : "is-on"}`}
            onClick={() => setMuted((v) => !v)}
            aria-label={muted ? "Enable sound" : "Mute sound"}
            title={muted ? "Enable sound" : "Mute sound"}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button className="jlt-esc-button" onClick={closeGame} aria-label="Close game" title="Close (Esc)">
            ESC
          </button>
        </div>
      </header>

      {/* chapter progress */}
      <div className="jlt-progress" aria-hidden="true">
        {scenes.map((s, i) => (
          <div key={s.id} className="jlt-progress-seg">
            <motion.div
              className="jlt-progress-fill"
              initial={false}
              animate={{ width: `${segmentFill(i)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        ))}
      </div>

      {/* ---------- SCREENS ---------- */}
      <div className="jlt-stage">
        <AnimatePresence mode="wait">
          {/* ============ INTRO ============ */}
          {screen === "intro" && (
            <motion.section
              key="intro"
              className="jlt-intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
              transition={{ duration: 0.9 }}
            >
              <motion.div className="jlt-intro-frame" style={{ rotateX, rotateY, transformPerspective: 1400 }}>
                <motion.div className="jlt-parallax" style={{ x: imgX, y: imgY }}>
                  <img
                    className="jlt-kenburns"
                    src={`${IMAGE_PATH}ch9g11.jpg`}
                    alt="Rama and Lakshmana discover Jatayu in the forest"
                    draggable="false"
                  />
                </motion.div>
                <motion.div className="jlt-glare" style={{ backgroundImage: glare }} />
                <div className="jlt-frame-border" />
              </motion.div>

              <div className="jlt-intro-content">
                <motion.span
                  className="jlt-eyebrow"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  AN ANCESTRA INTERACTIVE CHRONICLE
                </motion.span>

                <motion.div
                  className="jlt-ornament"
                  initial={{ opacity: 0, scaleX: 0.2 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.7, duration: 0.9 }}
                >
                  <span /> ✦ <span />
                </motion.div>

                <h1 className="jlt-intro-title">
                  {["Jatayu's"].map((w) => (
                    <motion.span
                      key={w}
                      className="jlt-title-line"
                      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ delay: 0.9, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {w}
                    </motion.span>
                  ))}
                  <motion.em
                    className="jlt-title-line jlt-title-gold"
                    initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ delay: 1.25, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Last Testimony
                  </motion.em>
                </h1>

                <motion.p
                  className="jlt-intro-lede"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.7, duration: 0.9 }}
                >
                  A final encounter. A truth carried through fading strength. A sacrifice that would never be
                  forgotten.
                </motion.p>

                <motion.button
                  className="jlt-primary-button"
                  onClick={startStory}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.0, duration: 0.8 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span>ENTER THE STORY</span>
                  <ArrowRight size={17} />
                </motion.button>

                <motion.span
                  className="jlt-intro-note"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.4, duration: 1 }}
                >
                  COURAGE · LOYALTY · DHARMA
                </motion.span>
              </div>
            </motion.section>
          )}

          {/* ============ STORY ============ */}
          {screen === "story" && (
            <motion.section
              key={`story-${scene.id}`}
              className={`jlt-story ${scene.final ? "jlt-story--final" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
            >
              {/* ---- 3D image frame ---- */}
              <motion.div
                className="jlt-frame-wrap"
                initial={{ opacity: 0, x: -40, rotateY: 14 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div className="jlt-frame" style={{ rotateX, rotateY, transformPerspective: 1400 }}>
                  <div className="jlt-frame-inner">
                    <motion.div className="jlt-parallax" style={{ x: imgX, y: imgY }}>
                      <img
                        className={`jlt-kenburns ${sceneIndex % 2 ? "kb-b" : "kb-a"}`}
                        src={`${IMAGE_PATH}${scene.image}`}
                        alt={scene.title}
                        draggable="false"
                        style={{ objectPosition: scene.focus }}
                      />
                    </motion.div>
                    <div className="jlt-image-gradient" />
                    <motion.div className="jlt-glare" style={{ backgroundImage: glare }} />

                    <div className="jlt-scene-location">
                      <span className="jlt-dot">✦</span>
                      {scene.location}
                    </div>

                    <div className="jlt-image-title">
                      <span className="jlt-scene-number">
                        CHAPTER {String(scene.id).padStart(2, "0")}
                        <em> / {String(TOTAL).padStart(2, "0")}</em>
                      </span>
                      <h2>{scene.title}</h2>
                    </div>
                  </div>

                  <div className="jlt-frame-border" />
                  <i className="jlt-corner tl" />
                  <i className="jlt-corner tr" />
                  <i className="jlt-corner bl" />
                  <i className="jlt-corner br" />
                </motion.div>
                <div className="jlt-frame-shadow" aria-hidden="true" />
              </motion.div>

              {/* ---- dialogue panel ---- */}
              <motion.div
                className="jlt-panel"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="jlt-speaker">
                  <span className="jlt-speaker-line" />
                  <b>{scene.speaker}</b>
                  <span className="jlt-speaker-line" />
                </div>

                <div
                  className={`jlt-dialogue ${isSpeech ? "is-speech" : ""} ${scene.final ? "is-final" : ""}`}
                  onClick={continueStory}
                  role="button"
                  tabIndex={-1}
                >
                  <span className="jlt-sr" aria-live="polite">
                    {fullText}
                  </span>

                  <p aria-hidden="true" key={`${scene.id}-${paragraphIndex}`}>
                    {words.map((word, i) => (
                      <span key={i} className={`jlt-word ${i < shown ? "is-on" : ""} ${i === shown - 1 && isTyping ? "is-new" : ""}`}>
                        {word}
                      </span>
                    ))}
                  </p>
                </div>

                <div className="jlt-story-footer">
                  <div className="jlt-pips" aria-hidden="true">
                    {scene.paragraphs.map((_, i) => (
                      <span key={i} className={i < paragraphIndex ? "done" : i === paragraphIndex ? "now" : ""} />
                    ))}
                  </div>

                  <button className="jlt-continue-button" onClick={continueStory} aria-label={isTyping ? "Reveal text" : "Continue story"}>
                    <span>{buttonLabel}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            </motion.section>
          )}

          {/* ============ ENDING ============ */}
          {screen === "ending" && (
            <motion.section
              key="ending"
              className="jlt-ending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="jlt-ending-content">
                <motion.span
                  className="jlt-eyebrow"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  THE NOBLE KING OF VULTURES
                </motion.span>
                <div className="jlt-ornament">
                  <span /> ✦ <span />
                </div>
                <motion.h2
                  initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.5, duration: 1 }}
                >
                  His courage
                  <em>lived beyond him.</em>
                </motion.h2>

                <div className="jlt-ending-copy">
                  {endingText.map((paragraph, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ delay: 1.2 + index * 0.9, duration: 0.9 }}
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </div>

                <motion.button
                  className="jlt-primary-button"
                  onClick={finishStory}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 + endingText.length * 0.9, duration: 0.9 }}
                  whileHover={{ y: -3 }}
                >
                  <span>COMPLETE CHRONICLE</span>
                  <ArrowRight size={17} />
                </motion.button>
              </div>
            </motion.section>
          )}

          {/* ============ COMPLETE ============ */}
          {screen === "complete" && (
            <motion.section
              key="complete"
              className="jlt-complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <motion.div
                className="jlt-complete-ornament"
                initial={{ scale: 0.4, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              >
                ✦
              </motion.div>
              <span className="jlt-eyebrow">THE TESTIMONY IS COMPLETE</span>
              <h2>
                Jatayu&apos;s sacrifice
                <em>will be remembered.</em>
              </h2>
              <p>Some acts of courage do not end in victory. They live on in the truth they leave behind.</p>
              <button className="jlt-primary-button" onClick={closeGame}>
                <span>RETURN TO THE CHRONICLE</span>
                <ArrowRight size={17} />
              </button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {screen === "story" && (
        <footer className="jlt-bottom-hint">
          <span>ENTER</span>
          <i>TO CONTINUE</i>
        </footer>
      )}
    </main>
  );
}