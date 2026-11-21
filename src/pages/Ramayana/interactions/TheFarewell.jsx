import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import './TheFarewell.css';

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const IMG = '/images/ramayana/interactions/';
const AUDIO_SRC = '/audio/end.mp3';

// mood -> background music volume
const VOLUME = { silent: 0.5, hush: 0.5, soft: 0.5 }; // constant, normal volume the whole time

const b = (speaker, text, extra = {}) => ({ speaker, text, ...extra });

const SCENES = [
  {
    id: 'gathering',
    title: 'The Final Gathering',
    image: `${IMG}last1.jpg`,
    focus: '50% 50%',
    lines: [
      b('RAMA', [
        'You have all walked beside me through years that tested our strength, our patience, and our faith.',
        'We have faced forests, oceans, kingdoms, and battles.',
        'Yet none of those journeys could have been completed alone.',
      ], { mood: 'hush' }),
    ],
  },
  {
    id: 'vibhishana',
    title: "Rama's Farewell to Vibhishana",
    image: `${IMG}last2.jpg`,
    focus: '50% 40%',
    lines: [
      b('RAMA', [
        'Vibhishana, you chose righteousness when it demanded the greatest courage.',
        'Never abandon that path.',
        'Remember that a throne is not a possession. It is a responsibility.',
      ]),
      b('VIBHISHANA', [
        'I shall remember your words for as long as I live.',
        'Your presence may leave this world, but your teachings shall remain within my kingdom.',
      ]),
      b('RAMA', ['Then our bond will never be broken.']),
    ],
  },
  {
    id: 'sugriva',
    title: 'The Farewell to Sugriva',
    image: `${IMG}last3.jpg`,
    focus: '50% 40%',
    lines: [
      b('RAMA', [
        'Sugriva, when we first met, neither of us knew how much our paths would change.',
        'Together, we found the strength to face what neither could overcome alone.',
      ]),
      b('SUGRIVA', ['You gave me back my kingdom, but more than that, you gave me back my courage.']),
      b('RAMA', ['Live well. Lead wisely. And remember what we accomplished together.']),
      b('SUGRIVA', ['Your friendship shall remain with me, my friend.']),
    ],
  },
  {
    id: 'blessings',
    title: 'Blessings for Jambavan and Angada',
    image: `${IMG}last4.jpg`,
    focus: '50% 40%',
    lines: [
      b('RAMA', ['Jambavan, your wisdom guided us when the path ahead seemed uncertain.']),
      b('JAMBAVAN', [
        'But the greatness I witnessed in you was not merely the strength to defeat an enemy. It was the strength to remain true to righteousness.',
      ]),
      b('RAMA', [
        'Angada, you stood before danger without allowing fear to decide your actions.',
        'True strength is not only the ability to stand firm. It is also knowing what is worth standing for.',
      ]),
      b('ANGADA', ['I shall carry your words with me, my Lord.']),
      b('RAMA', ['Then walk forward with honour.'], { mood: 'hush' }),
    ],
  },
  {
    id: 'request',
    title: "Hanuman's Final Request",
    image: `${IMG}last5.jpg`,
    focus: '50% 40%',
    slow: true,
    lines: [
      b('RAMA', [
        'Hanuman.',
        'You have given me more than words can ever express.',
        'Tell me, is there anything you still wish to ask of me?',
      ], { mood: 'hush' }),
      b('HANUMAN', [
        'My Lord...',
        'I have never asked for a kingdom.',
        'I have only wished to remain where your name is remembered and where your story is told.',
      ], { mood: 'silent' }),
      b('RAMA', ['What is it that your heart desires, Hanuman?'], { mood: 'silent' }),
      b('HANUMAN', [
        'Grant me this one blessing, my Lord.',
        'Let me remain in this world for as long as your story is spoken.',
        'Wherever someone remembers you with devotion, wherever your name is recited with love, let me be present.',
        'Let me hear your name.',
        'Let me serve your memory.',
        'Let me never be separated from you.',
      ], { mood: 'silent', holdMs: 1000 }),
    ],
  },
  {
    id: 'blessing',
    title: "Rama's Eternal Blessing",
    image: `${IMG}last6.jpg`,
    focus: '50% 40%',
    slow: true,
    lines: [
      b('RAMA', [
        'Hanuman, your devotion has no equal.',
        'You have never sought anything for yourself.',
        'How could I deny you this wish?',
      ], { mood: 'silent' }),
      b('HANUMAN', ['My Lord...'], { mood: 'silent' }),
      b('RAMA', [
        'So long as my story is remembered upon this earth, you shall remain.',
        'Wherever my name is spoken with devotion, you shall be there.',
        'You shall never be forgotten.',
        'And you shall never be separated from me.',
      ], { mood: 'silent' }),
      b('HANUMAN', [
        'Then let my life have only one purpose.',
        'Wherever your name is spoken, let me be there.',
        'Wherever your story is told, let me listen.',
        'And wherever devotion calls, let me serve.',
      ], { mood: 'soft' }),
      b('RAMA', ['You shall, Hanuman.', 'You shall.'], { mood: 'soft', holdMs: 2200 }),
    ],
  },
  {
    id: 'promise',
    title: 'The Promise That Will Never End',
    image: `${IMG}last7.jpg`,
    focus: '50% 45%',
    wide: true,
    lines: [
      b('HANUMAN', [
        'My Lord, wherever your name lives, I shall live.',
        'Wherever your story is remembered, I shall listen.',
        'My service shall have no end.',
      ], { mood: 'soft' }),
    ],
  },
];

const BLOCKS = SCENES.flatMap((scene, stage) =>
  scene.lines.map((line, i) => ({
    ...line,
    text: line.text.join('\n'),
    mood: line.mood || 'soft',
    stage,
    first: i === 0,
  })),
);

const ENDING = [
  { text: 'SOME FAREWELLS END A JOURNEY.', delay: 2000, tone: 'quiet' },
  { text: 'SOME BONDS ARE ETERNAL.', delay: 2200, tone: 'quiet' },
  { text: 'THE END OF AN AGE.', delay: 2000, tone: 'strong' },
  { text: 'THE BEGINNING OF AN ETERNAL STORY.', delay: 2200, tone: 'strong' },
];

/* ---- time budget: the whole experience ends within 3 minutes ---- */
const FORCE_ENDING_AT = 164000; // ms after opening: jump to the ending if still reading
const CLICK_ALLOWANCE = 1500; // ms a reader needs per block to press Continue
const BREATH_ALLOWANCE = 1400; // ms pause at the start of each stage

const CHARS_FROM = BLOCKS.map((_, i) => BLOCKS.slice(i).reduce((n, x) => n + x.text.length, 0));
const BREATHS_FROM = BLOCKS.map((_, i) => BLOCKS.slice(i).filter((x) => x.first).length);

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const clamp = (n) => Math.min(1, Math.max(0, n));

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TheFarewell({ onComplete, onExit }) {
  const reduce = useReducedMotion();

  const [phase, setPhase] = useState('intro'); // intro | play | ending
  const [introStep, setIntroStep] = useState(0); // 0 image, 1 title, 2 begin
  const [bi, setBi] = useState(0); // block index
  const [ready, setReady] = useState(false); // stage "breath" finished
  const [count, setCount] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [endStep, setEndStep] = useState(0);
  const [muted, setMuted] = useState(false);

  const block = BLOCKS[bi];
  const scene = SCENES[block.stage];
  const total = block.text.length;
  const done = count >= total;

  const rootRef = useRef(null);
  const [isFs, setIsFs] = useState(false);
  const lockRef = useRef(false);
  const startRef = useRef(Date.now());
  const audioRef = useRef(null);
  const fadeRef = useRef(null);

  /* ---------- full screen ---------- */
  useEffect(() => {
    const el = rootRef.current;
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    if (el && el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {}); // falls back to the fixed full-viewport layout
    }
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (rootRef.current && rootRef.current.requestFullscreen) {
      rootRef.current.requestFullscreen().catch(() => {});
    }
  }, []);

  /* ---------- hard cap: jump to the ending so everything finishes within 3 minutes ---------- */
  useEffect(() => {
    const t = setTimeout(() => setPhase('ending'), FORCE_ENDING_AT);
    return () => clearTimeout(t);
  }, []);

  /* ---------- preload every image ---------- */
  useEffect(() => {
    SCENES.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  /* ---------- intro choreography ---------- */
  useEffect(() => {
    if (phase !== 'intro') return undefined;
    const t1 = setTimeout(() => setIntroStep(1), 1200);
    const t2 = setTimeout(() => setIntroStep(2), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  /* ---------- audio ---------- */
  const fadeTo = useCallback((target, ms = 2400) => {
    const a = audioRef.current;
    if (!a) return;
    clearInterval(fadeRef.current);
    const from = a.volume;
    const steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    fadeRef.current = setInterval(() => {
      i += 1;
      a.volume = clamp(from + (target - from) * (i / steps));
      if (i >= steps) clearInterval(fadeRef.current);
    }, 50);
  }, []);

  const startAudio = useCallback(() => {
    if (audioRef.current) return;
    const a = new Audio(AUDIO_SRC);
    a.loop = true;
    a.volume = 0;
    audioRef.current = a;
    const p = a.play();
    if (p && p.catch) {
      p.catch(() => {
        // Autoplay blocked: start on the player's first interaction instead
        const retry = () => {
          a.play().catch(() => {});
          window.removeEventListener('pointerdown', retry);
          window.removeEventListener('keydown', retry);
        };
        window.addEventListener('pointerdown', retry);
        window.addEventListener('keydown', retry);
      });
    }
  }, []);

  /* music begins the moment the game opens */
  useEffect(() => {
    startAudio();
  }, [startAudio]);

  const mood = useMemo(() => {
    if (phase === 'intro') return 'soft';
    if (phase === 'ending') return endStep === 0 ? 'silent' : endStep >= 3 ? 'soft' : 'hush';
    if (!ready) return bi === 0 ? 'hush' : 'silent';
    return block.mood;
  }, [phase, endStep, ready, block.mood, bi]);

  useEffect(() => {
    fadeTo(muted ? 0 : VOLUME[mood], mood === 'silent' ? 1800 : 3200);
  }, [mood, muted, fadeTo]);

  useEffect(
    () => () => {
      // graceful fade-out even after unmount
      clearInterval(fadeRef.current);
      const a = audioRef.current;
      audioRef.current = null;
      if (!a) return;
      const id = setInterval(() => {
        a.volume = clamp(a.volume - 0.02);
        if (a.volume <= 0.01) {
          clearInterval(id);
          a.pause();
        }
      }, 60);
    },
    [],
  );

  /* ---------- begin ---------- */
  const begin = useCallback(() => {
    if (phase !== 'intro') return;
    startAudio();
    if (audioRef.current && audioRef.current.paused) audioRef.current.play().catch(() => {});
    setBi(0);
    setCount(0);
    setReady(false);
    setCanContinue(false);
    setPhase('play');
  }, [phase, startAudio]);

  /* ---------- new block: reset typing state (before paint) ---------- */
  useLayoutEffect(() => {
    if (phase !== 'play') return undefined;
    setCount(0);
    setCanContinue(false);
    if (!block.first) {
      setReady(true);
      return undefined;
    }
    setReady(false);
    const t = setTimeout(() => setReady(true), bi === 0 ? 1200 : 1400);
    return () => clearTimeout(t);
  }, [bi, phase, block.first]);

  /* ---------- typewriter (self-pacing to fit the time budget) ---------- */
  useEffect(() => {
    if (phase !== 'play' || !ready || count >= total) return undefined;
    const ch = block.text[count];
    const prev = block.text[count - 1];

    const elapsed = Date.now() - startRef.current;
    const remainingChars = total - count + (CHARS_FROM[bi + 1] || 0);
    const timeLeft =
      FORCE_ENDING_AT - elapsed - (BLOCKS.length - bi) * CLICK_ALLOWANCE - (BREATHS_FROM[bi] || 0) * BREATH_ALLOWANCE;
    const perChar = timeLeft / Math.max(1, remainingChars);
    const scale = Math.min(1, Math.max(0.1, perChar / 26)); // 1 = relaxed, 0.1 = brisk

    let delay = 20;
    if (ch === '\n') delay = 300;
    else if (prev === '\n') delay = 30;
    else if (ch === ',') delay = 90;
    else if ('.?!'.includes(prev || '') && ch === ' ') delay = 170;
    else if (ch === '.' && block.text[count + 1] === '.') delay = 160;
    if (block.stage === 4 || block.stage === 5) delay *= 1.2; // the quietest scenes breathe a little more
    delay = reduce ? 4 : Math.max(3, delay * scale);

    const t = setTimeout(() => setCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [count, ready, phase, block, total, reduce, bi]);

  /* ---------- reveal Continue (delay prevents double advance) ---------- */
  useEffect(() => {
    if (phase !== 'play' || !ready || !done) return undefined;
    const t = setTimeout(() => setCanContinue(true), block.holdMs || 380);
    return () => clearTimeout(t);
  }, [phase, ready, done, block.holdMs]);

  /* ---------- ending choreography ---------- */
  useEffect(() => {
    if (phase !== 'ending') return undefined;
    setEndStep(0);
    let step = 0;
    let t;
    const run = (wait) => {
      t = setTimeout(() => {
        step += 1;
        setEndStep((prev) => Math.max(prev, step));
        if (step <= ENDING.length) run(ENDING[step - 1].delay);
      }, wait);
    };
    run(1800);
    return () => clearTimeout(t);
  }, [phase]);

  /* ---------- advance ---------- */
  const advance = useCallback(() => {
    if (phase === 'ending') {
      return;
    }
    if (phase !== 'play' || !ready || lockRef.current) return;
    if (!done) {
      setCount(total); // skip typewriter
      return;
    }
    if (!canContinue) return;
    lockRef.current = true;
    setTimeout(() => {
      lockRef.current = false;
    }, 600);
    if (bi < BLOCKS.length - 1) setBi(bi + 1);
    else setPhase('ending');
  }, [phase, ready, done, canContinue, total, bi]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        if (phase === 'play') {
          e.preventDefault();
          advance();
        }
      } else if (e.key === 'Escape' && onExit) {
        onExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, phase, onExit]);

  const replay = () => {
    setEndStep(0);
    setBi(0);
    setCount(0);
    setReady(false);
    setCanContinue(false);
    setPhase('play');
  };

  /* ---------- 3D camera (pointer parallax) ---------- */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20, mass: 1.2 });
  const sy = useSpring(my, { stiffness: 40, damping: 20, mass: 1.2 });
  const rotY = useTransform(sx, [-0.5, 0.5], [-3.2, 3.2]);
  const rotX = useTransform(sy, [-0.5, 0.5], [2.2, -2.2]);
  const shiftX = useTransform(sx, [-0.5, 0.5], [16, -16]);
  const shiftY = useTransform(sy, [-0.5, 0.5], [10, -10]);
  const textX = useTransform(sx, [-0.5, 0.5], [-4, 4]);

  const onPointerMove = (e) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  /* ---------- derived view state ---------- */
  const activeScene = phase === 'ending' ? SCENES[SCENES.length - 1] : scene;
  const activeStage = phase === 'intro' ? 0 : phase === 'ending' ? 6 : block.stage;
  const paragraphs = block.text.slice(0, count).split('\n');
  const showBreathCaption = phase === 'play' && block.first && !ready;
  const kenDir = activeStage % 2 === 0 ? 1 : -1;

  const bars = phase === 'intro' ? '0vh' : phase === 'ending' ? '13vh' : '6.5vh';

  return (
    <div
      ref={rootRef}
      className="tf-root"
      data-phase={phase}
      onPointerMove={onPointerMove}
      onClick={phase === 'play' ? advance : undefined}
    >
      {/* ===== 3D cinematic background ===== */}
      <div className="tf-camera">
        <motion.div
          className="tf-rig"
          style={reduce ? undefined : { rotateX: rotX, rotateY: rotY, x: shiftX, y: shiftY }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={activeScene.id}
              className="tf-plate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0.4 : 2.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div
                className="tf-plate-img"
                style={{
                  backgroundImage: `url(${activeScene.image})`,
                  backgroundPosition: activeScene.focus,
                }}
                initial={reduce ? false : { scale: 1.06, x: `${-1.2 * kenDir}%` }}
                animate={reduce ? {} : { scale: activeScene.wide ? 1.02 : 1.14, x: `${1.2 * kenDir}%` }}
                transition={{ duration: activeScene.slow ? 60 : 38, ease: 'linear' }}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <div className="tf-light" aria-hidden="true" />
      </div>

      <div className="tf-vignette" aria-hidden="true" />
      <div className="tf-shade" data-dim={phase === 'ending' ? 'deep' : phase === 'intro' ? 'intro' : 'dialogue'} aria-hidden="true" />
      <div className="tf-grain" aria-hidden="true" />

      {/* ===== letterbox ===== */}
      <motion.div className="tf-bar tf-bar-top" animate={{ height: bars }} transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }} />
      <motion.div className="tf-bar tf-bar-bottom" animate={{ height: bars }} transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }} />

      {/* ===== chrome ===== */}
      <div className="tf-chrome">
        <div className="tf-spacer" />
        {phase !== 'intro' && (
          <button
            type="button"
            className="tf-icon-btn"
            onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
            aria-label={muted ? 'Unmute music' : 'Mute music'}
            aria-pressed={muted}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M4 10v4h4l5 4V6L8 10H4z" fill="currentColor" />
              {muted ? (
                <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              ) : (
                <path d="M16 9c1.6 1.6 1.6 4.4 0 6M18.5 6.5c3 3 3 8 0 11" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              )}
            </svg>
          </button>
        )}
        <button
          type="button"
          className="tf-icon-btn"
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          aria-label={isFs ? 'Exit full screen' : 'Enter full screen'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d={isFs ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'}
              stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="tf-icon-btn tf-exit"
          onClick={(e) => { e.stopPropagation(); if (onExit) onExit(); }}
          aria-label="Exit the game"
          title="Exit"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* ===== progress: seven stages ===== */}
      {phase !== 'intro' && (
        <div className="tf-progress" role="progressbar" aria-valuemin={1} aria-valuemax={7} aria-valuenow={activeStage + 1} aria-label="Stage">
          {SCENES.map((s, i) => (
            <span key={s.id} className={`tf-seg ${i < activeStage ? 'is-done' : ''} ${i === activeStage ? 'is-now' : ''}`} />
          ))}
        </div>
      )}

      {/* ===== intro title ===== */}
      <AnimatePresence>
        {phase === 'intro' && introStep >= 1 && (
          <motion.div className="tf-title-wrap" key="title" exit={{ opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 1.6 }}>
            <motion.h1
              className="tf-title"
              initial={{ opacity: 0, letterSpacing: '0.7em', filter: 'blur(14px)' }}
              animate={{ opacity: 1, letterSpacing: '0.34em', filter: 'blur(0px)' }}
              transition={{ duration: reduce ? 0.6 : 2.6, ease: [0.2, 0.7, 0.2, 1] }}
            >
              THE FAREWELL
            </motion.h1>
            <motion.span className="tf-title-rule" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 1.6, ease: 'easeOut' }} />
            <motion.p className="tf-tagline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 1.6 }}>
              When an age comes to its end, even the greatest journeys must find their final moment.
            </motion.p>
            {introStep >= 2 && (
              <motion.button
                type="button"
                className="tf-begin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.6 }}
                onClick={(e) => { e.stopPropagation(); begin(); }}
              >
                <span>Begin</span>
                <i className="tf-begin-line" />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== stage caption during the breath ===== */}
      <AnimatePresence>
        {showBreathCaption && (
          <motion.div
            key={`cap-${block.stage}`}
            className="tf-caption"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
          >
            <span className="tf-caption-num">{ROMAN[block.stage]}</span>
            <span className="tf-caption-title">{scene.title}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== dialogue ===== */}
      {phase === 'play' && ready && (
        <div className="tf-dialogue-zone">
          <AnimatePresence mode="wait">
            <motion.div
              key={bi}
              className="tf-dialogue"
              data-speaker={block.speaker.toLowerCase()}
              style={reduce ? undefined : { x: textX }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.7, ease: [0.3, 0.7, 0.2, 1] }}
            >
              <div className="tf-speaker">{block.speaker}</div>
              <div className="tf-text" aria-hidden="true">
                {paragraphs.map((p, i) => (
                  <p key={i}>
                    {p}
                    {i === paragraphs.length - 1 && !done && <span className="tf-caret" />}
                  </p>
                ))}
              </div>
              <span className="tf-sr">{`${block.speaker}. ${block.text.replace(/\n/g, ' ')}`}</span>
              <div className="tf-controls">
                <AnimatePresence>
                  {canContinue && (
                    <motion.button
                      type="button"
                      className="tf-continue"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      onClick={(e) => { e.stopPropagation(); advance(); }}
                    >
                      <span>Continue</span>
                      <i className="tf-continue-line" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ===== ending ===== */}
      {phase === 'ending' && (
        <div className="tf-ending" onClick={() => setEndStep(ENDING.length + 1)}>
          {ENDING.map((l, i) => (
            <motion.p
              key={l.text}
              className={`tf-ending-line tf-${l.tone}`}
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={endStep > i ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 2.2, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {l.text}
            </motion.p>
          ))}
          <AnimatePresence>
            {endStep > ENDING.length && (
              <motion.div className="tf-end-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }}>
                <button type="button" className="tf-begin" onClick={(e) => { e.stopPropagation(); onComplete && onComplete(); }}>
                  <span>Return to the chapter</span>
                  <i className="tf-begin-line" />
                </button>
                <button type="button" className="tf-quiet" onClick={(e) => { e.stopPropagation(); replay(); }}>
                  Witness it again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}