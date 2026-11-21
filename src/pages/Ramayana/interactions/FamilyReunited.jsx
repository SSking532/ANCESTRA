import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Volume2, VolumeX, X } from "lucide-react";
import "./FamilyReunited.css";

/* ------------------------------------------------------------------
   ASSETS  (keep in line with the project's image-loading convention)
------------------------------------------------------------------ */
const IMAGE_PATH = "/images/ramayana/interactions/";
const img = (n) => `${IMAGE_PATH}ch${n}.jpg`;

const PARTS = ["The Brothers", "A Mother’s Embrace", "One Family Again"];

const N = (text) => ({ kind: "narration", text });
const D = (who, text) => ({ kind: "dialogue", who, text });

/* Auto-play timing */
const HOLD_AFTER_LINE_MS = 1000; // pause after a line is fully shown, then move on
const FINAL_HOLD_MS = 7500; // final image stays on screen before the closing card

/* Background music: plays once from "Enter the palace" to the end of the game */
const RETURN_AUDIO = "/audio/return.mp3";
const RETURN_VOLUME = 0.9;

/* ------------------------------------------------------------------
   THE STORY
------------------------------------------------------------------ */
const beats = [
  {
    part: 0,
    image: img(211),
    cam: { from: 1.1, to: 1.2, ox: 50, oy: 45 },
    lines: [
      N("Fourteen years had passed."),
      N("Fourteen years of waiting, separation and promises kept."),
      N("And now, within the palace of Ayodhya, the four brothers stood before one another again."),
      N("For a moment, words were unnecessary."),
    ],
  },
  {
    part: 0,
    image: img(212),
    cam: { from: 1.08, to: 1.22, ox: 50, oy: 40 },
    lines: [
      D("Bharata", "Brother... I have waited so long to see you standing here again."),
      D("Rama", "And I have returned to find that you guarded more than a kingdom, Bharata. You guarded my trust."),
      D("Bharata", "I never considered myself its king. I only waited for the day I could place everything back in your hands."),
      D("Rama", "You have done more than anyone could have asked of you."),
    ],
  },
  {
    part: 0,
    image: img(213),
    cam: { from: 1.2, to: 1.08, ox: 50, oy: 42 },
    lines: [
      D("Shatrughna", "Brother! I cannot believe you are standing before me again."),
      D("Lakshmana", "Look at you, Shatrughna. You have grown into a man of great responsibility."),
      D("Shatrughna", "And I still have so much to tell you. Fourteen years cannot be explained in a single evening."),
      D("Lakshmana", "Then we shall have many evenings to speak."),
    ],
  },
  {
    part: 0,
    image: img(214),
    cam: { from: 1.08, to: 1.3, ox: 50, oy: 50 },
    lines: [
      N("The embraces slowly gave way to smiles."),
      N("The years had changed their lives, their responsibilities and the paths they had walked."),
      N("But standing together, they were brothers once more."),
      D("Rama", "Let us enter together."),
      D("Bharata", "Together, brother."),
    ],
    transition: "walk",
  },
  {
    part: 1,
    image: img(215),
    cam: { from: 1.1, to: 1.22, ox: 40, oy: 45 },
    lines: [
      D("Kausalya", "My son... let me look at you."),
      D("Rama", "Mother."),
      D("Kausalya", "I had imagined this moment so many times. Yet I never knew how it would feel to hold you again."),
      D("Rama", "I am home now, Mother. Your son has returned."),
      D("Kausalya", "That is all I ever wished to hear."),
    ],
  },
  {
    part: 1,
    image: img(216),
    cam: { from: 1.1, to: 1.22, ox: 45, oy: 45 },
    lines: [
      D("Sumitra", "Lakshmana... my son."),
      D("Lakshmana", "Mother, I have returned."),
      D("Sumitra", "You left as your brother’s companion. You return having stood beside him through every hardship."),
      D("Lakshmana", "I could never have chosen another path."),
      D("Sumitra", "And I could never have been prouder of you."),
      D("Lakshmana", "Your blessings were with me every step of the way."),
    ],
  },
  {
    part: 1,
    image: img(217),
    mood: "quiet",
    cam: { from: 1.06, to: 1.16, ox: 45, oy: 45 },
    lines: [
      D("Kaikeyi", "Rama... can you still call me Mother?"),
      D("Rama", "You have always been one of my mothers."),
      D("Kaikeyi", "I cannot undo what has happened. Fourteen years have passed, and the weight of those years remains with me."),
      D("Rama", "Let the years ahead be filled with peace, Mother. We are together again."),
      D("Kaikeyi", "You have returned with the same heart I remember."),
      D("Rama", "And I have returned to my family."),
    ],
  },
  {
    part: 1,
    image: img(218),
    cam: { from: 1.26, to: 1.06, ox: 50, oy: 50 },
    lines: [
      D("Kausalya", "Come, my daughter. This home has waited for you too."),
      D("Sita", "Mother, your affection has always made me feel that I belong here."),
      D("Sumitra", "You have walked a difficult path, child. Today, you need only rest among your family."),
      D("Sita", "To be welcomed by you both again is a blessing."),
      N("And the mothers welcomed not only their sons, but the daughter who had shared their journey of sorrow and hope."),
    ],
  },
  {
    part: 2,
    image: img(219),
    mood: "swell",
    cam: { from: 1.18, to: 1.06, ox: 50, oy: 50 },
    lines: [],
    pool: [
      {
        id: "rs", label: "Rama & Sita",
        lines: [
          D("Rama", "After all these years, we stand here together."),
          D("Sita", "And this time, there is no journey ahead that we must walk apart."),
        ],
      },
      {
        id: "lu", label: "Lakshmana & Urmila",
        lines: [
          D("Lakshmana", "Urmila... so much time has passed."),
          D("Urmila", "But the bond between us never disappeared."),
        ],
      },
      {
        id: "bm", label: "Bharata & Mandavi",
        lines: [
          D("Bharata", "You stood beside me through the longest years of waiting."),
          D("Mandavi", "We waited together. That made the burden easier to carry."),
        ],
      },
      {
        id: "ss", label: "Shatrughna & Shrutakirti",
        lines: [
          D("Shatrughna", "Today, Ayodhya feels complete again."),
          D("Shrutakirti", "Because everyone we love has finally returned."),
        ],
      },
    ],
    finale: [
      N("Fourteen years had carried them across forests, kingdoms and distant shores."),
      N("They had endured separation, fulfilled promises and carried responsibilities that tested their hearts."),
      N("But the bonds of family had endured."),
      N("The four brothers stood together once more. Their wives stood beside them. Their mothers welcomed them home."),
      N("And Sita, who had shared Rama’s journey through every hardship, stood once again among her family."),
      N("In the palace of Ayodhya, the long wait had ended."),
      { kind: "emph", text: "The family was whole again." },
      {
        kind: "quote",
        text: "Some victories are not won on a battlefield. Some are found in the arms of those who waited.",
      },
    ],
  },
];

/* ------------------------------------------------------------------
   TYPEWRITER
------------------------------------------------------------------ */
function useTypewriter(text) {
  const [n, setN] = useState(0);
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setN(0);
    if (!text) return undefined;
    let timer;
    const tick = () => {
      if (idx.current >= text.length) return;
      const ch = text[idx.current];
      idx.current += 1;
      setN(idx.current);
      const pause = /[.!?…]/.test(ch) ? 320 : /[,;—]/.test(ch) ? 150 : 0;
      timer = window.setTimeout(tick, 27 + pause);
    };
    timer = window.setTimeout(tick, 350);
    return () => window.clearTimeout(timer);
  }, [text]);

  const skip = useCallback(() => {
    idx.current = text ? text.length : 0;
    setN(idx.current);
  }, [text]);

  return { shown: text ? text.slice(0, n) : "", done: !text || n >= text.length, skip };
}

/* ------------------------------------------------------------------
   COMPONENT
------------------------------------------------------------------ */
export default function FamilyReunited({ onComplete, onExit }) {
  const [bi, setBi] = useState(0);
  const [phase, setPhase] = useState("title"); // title | lines | done
  const [qi, setQi] = useState(0);
  const [muted, setMuted] = useState(false);
  const music = useRef(null);

  const beat = beats[bi];
  /* everything said in a beat, in order: lines, each couple's exchange, then the finale */
  const queue = useMemo(
    () => [
      ...beat.lines,
      ...(beat.pool ? beat.pool.flatMap((p) => p.lines) : []),
      ...(beat.finale || []),
    ],
    [beat]
  );
  const line = phase === "lines" ? queue[qi] : null;
  const { shown, done: typed } = useTypewriter(line ? line.text : "");

  const reduced = useMemo(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  /* parallax tilt */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });
  const rotY = useTransform(sx, [-0.5, 0.5], [-2.2, 2.2]);
  const rotX = useTransform(sy, [-0.5, 0.5], [1.6, -1.6]);
  const dustX = useTransform(sx, [-0.5, 0.5], [18, -18]);
  const dustY = useTransform(sy, [-0.5, 0.5], [12, -12]);

  const onPointerMove = (e) => {
    if (reduced) return;
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  };

  const motes = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        dur: 12 + Math.random() * 16,
        delay: -Math.random() * 20,
        drift: (Math.random() - 0.5) * 120,
        op: 0.25 + Math.random() * 0.55,
      })),
    []
  );

  /* background music: one track, created once, stopped on exit */
  useEffect(() => {
    const a = new Audio(RETURN_AUDIO);
    a.preload = "auto";
    a.volume = RETURN_VOLUME;
    music.current = a;
    return () => {
      a.pause();
      music.current = null;
    };
  }, []);

  /* ---------------- flow ---------------- */
  const isLastBeat = bi === beats.length - 1;
  const isFinalLine = phase === "lines" && isLastBeat && qi === queue.length - 1;

  const begin = () => {
    const a = music.current;
    if (a) {
      a.muted = muted;
      a.currentTime = 0;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    }
    setBi(0);
    setQi(0);
    setPhase("lines");
  };

  /* auto-advance: once a line is fully shown, wait, then go to the next line / scene */
  useEffect(() => {
    if (phase !== "lines" || !typed || isFinalLine) return undefined;
    const t = window.setTimeout(() => {
      if (qi < queue.length - 1) {
        setQi(qi + 1);
      } else {
        const next = bi + 1;
        setBi(next);
        setQi(0);
      }
    }, HOLD_AFTER_LINE_MS);
    return () => window.clearTimeout(t);
  }, [phase, typed, qi, bi, queue.length, isFinalLine, beat]);

  /* finale hold: keep the family on screen after the last line */
  useEffect(() => {
    if (!isFinalLine || !typed) return undefined;
    const t = window.setTimeout(() => setPhase("done"), FINAL_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [isFinalLine, typed]);

  const toggleSound = () => {
    setMuted((m) => {
      if (music.current) music.current.muted = !m;
      return !m;
    });
  };

  /* ---------------- derived ---------------- */
  const holding = isFinalLine && typed;
  const part = beat.part;
  const showPanel = phase === "lines";

  return (
    <main className={`fr-cinema ${holding ? "is-holding" : ""}`} onPointerMove={onPointerMove}>
      {/* ---------- 3D STAGE ---------- */}
      <div className="fr-stage">
        <motion.div className="fr-tilt" style={{ rotateX: rotX, rotateY: rotY }}>
          <AnimatePresence initial={false}>
            <motion.div
              key={bi}
              className="fr-layer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            >
              <motion.div
                className="fr-image"
                style={{
                  backgroundImage: `url("${beat.image}")`,
                  transformOrigin: `${beat.cam.ox}% ${beat.cam.oy}%`,
                }}
                initial={{ scale: beat.cam.from }}
                animate={{ scale: reduced ? beat.cam.from : beat.cam.to }}
                transition={{ duration: 46, ease: "linear" }}
              />
            </motion.div>
          </AnimatePresence>

          <div className="fr-shaft fr-shaft--a" />
          <div className="fr-shaft fr-shaft--b" />
          <div className="fr-shaft fr-shaft--c" />
        </motion.div>

        <motion.div className="fr-dust" style={{ x: dustX, y: dustY }} aria-hidden="true">
          {motes.map((m) => (
            <span
              key={m.id}
              style={{
                left: `${m.left}%`,
                width: m.size,
                height: m.size,
                opacity: m.op,
                animationDuration: `${m.dur}s`,
                animationDelay: `${m.delay}s`,
                "--drift": `${m.drift}px`,
              }}
            />
          ))}
        </motion.div>

        <div className="fr-diya fr-diya--l" />
        <div className="fr-diya fr-diya--r" />
        <div className="fr-vignette" />
      </div>

      {/* ---------- HEADER ---------- */}
      <header className="fr-header">
        <div className="fr-brand">
          ANCESTRA
          <span>Ayodhya Kanda · Chapter XXI</span>
        </div>

        <nav className="fr-parts" aria-label="Progress">
          {PARTS.map((p, i) => (
            <div key={p} className={`fr-parts__item ${i === part && phase !== "title" ? "is-on" : ""} ${i < part ? "is-past" : ""}`}>
              <b />
              <em>{p}</em>
            </div>
          ))}
        </nav>

        <div className="fr-tools">
          <button type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Turn sound off"} title={muted ? "Sound on" : "Sound off"}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button type="button" onClick={onExit} aria-label="Exit experience" title="Exit experience">
            <X size={19} />
          </button>
        </div>
      </header>

      {/* ---------- DIALOGUE ---------- */}
      <section className="fr-dock">
        <AnimatePresence mode="wait">
          {showPanel && (
            <motion.div
              key="panel"
              className={`fr-panel ${line ? `fr-panel--${line.kind}` : ""}`}
              initial={{ opacity: 0, y: 40, rotateX: 18 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="fr-panel__gem" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${bi}-${qi}`}
                  className="fr-panel__body"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4 }}
                  aria-live="polite"
                >
                  {line && (
                    <>
                      {line.kind === "dialogue" && <p className="fr-speaker">{line.who}</p>}
                      <p className="fr-text">
                        {line.kind === "dialogue" ? "“" : ""}
                        {shown}
                        {line.kind === "dialogue" && typed ? "”" : ""}
                        {!typed && <span className="fr-caret" />}
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ---------- TITLE ---------- */}
      <AnimatePresence>
        {phase === "title" && (
          <motion.div
            className="fr-title"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
          >
            <motion.div
              className="fr-title__inner"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="fr-title__chapter">Chapter XXI</p>
              <h1>The Family Reunited</h1>
              <svg className="fr-orn" viewBox="0 0 240 24" aria-hidden="true">
                <path d="M0 12h98M142 12h98" />
                <path d="M120 2l10 10-10 10-10-10z" />
                <circle cx="104" cy="12" r="2" />
                <circle cx="136" cy="12" r="2" />
              </svg>
              <p className="fr-title__sub">
                Fourteen years have passed. You are about to step into the palace of Ayodhya as a silent witness.
              </p>
              <button type="button" className="fr-title__btn" onClick={begin}>
                Enter the palace
                <ArrowRight size={16} />
              </button>
              <p className="fr-title__note">Best with sound. Nothing to answer, nothing to win.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- COMPLETE ---------- */}
      <AnimatePresence>
        {phase === "done" && (
          <motion.div
            className="fr-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            <motion.div
              className="fr-end__inner"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2>The Family Reunited</h2>
              <svg className="fr-orn" viewBox="0 0 240 24" aria-hidden="true">
                <path d="M0 12h98M142 12h98" />
                <path d="M120 2l10 10-10 10-10-10z" />
              </svg>
              <p>The family was whole again.</p>
              <button type="button" className="fr-title__btn" onClick={onComplete}>
                Return to the chronicle
                <ArrowRight size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}