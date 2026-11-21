import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { X, ChevronRight, RotateCcw } from 'lucide-react';
import './ImpossibleChoiceGame.css';

/* ────────────────────────────────────────────────────────────
   ANCESTRA · GAME I · THE IMPOSSIBLE CHOICE
   Chapter XXVII — The Last Days of Rama (after Scene 8)

   Props:
     onComplete()  → "Return to the chapter" (continue to Scene 9)
     onExit()      → close button
   ──────────────────────────────────────────────────────────── */

const IMG = {
  1: '/images/ramayana/interactions/ch271.jpg',
  2: '/images/ramayana/interactions/ch272.jpg',
  3: '/images/ramayana/interactions/ch273.jpg',
  4: '/images/ramayana/interactions/ch274.jpg',
  5: '/images/ramayana/interactions/ch275.jpg',
  6: '/images/ramayana/interactions/ch276.jpg',
};

const ORIGINS = {
  1: '50% 60%',
  2: '42% 50%',
  3: '50% 42%',
  4: '50% 50%',
  5: '58% 55%',
  6: '50% 50%',
};

const SPEAKERS = {
  Rama: { accent: '#c8641b', glyph: 'R', tag: 'King of Ayodhya' },
  Lakshmana: { accent: '#2f6b4a', glyph: 'L', tag: 'Guardian of the Gate' },
  Durvasa: { accent: '#b07a1a', glyph: 'D', tag: 'The Sage' },
  Kala: { accent: '#6e1f2b', glyph: 'K', tag: 'The Visitor' },
};

const MOODS = {
  calm: { color: '#ffd98a', speed: 1, opacity: 0.8 },
  tense: { color: '#ff8e55', speed: 2.8, opacity: 0.95 },
  deep: { color: '#ffe9b8', speed: 0.55, opacity: 0.65 },
  solemn: { color: '#ecd29a', speed: 0.45, opacity: 0.55 },
};

const SCREEN_TITLES = [
  "The Guardian's Promise",
  'The Arrival of Durvasa',
  'The Threat',
  'The Impossible Choice',
  'The Interruption',
  'The Consequence',
];

/* ── Script ─────────────────────────────────────────────── */
const say = (who, text, img, mood, pip) => ({ t: 'say', who, text, img, mood, pip });
const narr = (text, img, mood, pip) => ({ t: 'narr', text, img, mood, pip });
const think = (text, img, mood, pip) => ({ t: 'think', who: 'Lakshmana', text, img, mood, pip });

const BEATS = [
  // SCREEN 1
  say('Rama', 'Lakshmana, I must speak privately with this visitor. Our conversation must not be interrupted.', 1, 'calm', 0),
  say('Lakshmana', 'As you command, brother. I shall guard this entrance. No one shall disturb you.', 1, 'calm', 0),
  say('Rama', 'Remain here until our conversation is complete. Let no one enter.', 1, 'calm', 0),
  say('Lakshmana', 'You have my word, Rama.', 1, 'calm', 0),
  narr('Lakshmana takes his place outside the chamber. His duty appears simple: guard the entrance and allow no interruption. Yet he does not know what awaits him.', 1, 'calm', 0),
  // SCREEN 2
  say('Durvasa', 'I have come to meet King Rama. Take me to him at once.', 2, 'calm', 1),
  say('Lakshmana', 'Revered Sage, please forgive me. My brother is engaged in a private meeting and has instructed that he must not be disturbed.', 2, 'calm', 1),
  say('Durvasa', 'I have travelled here with a purpose. I shall not wait. Inform Rama that Sage Durvasa has arrived.', 2, 'calm', 1),
  say('Lakshmana', 'I understand your urgency, revered one. But I have been entrusted with guarding this entrance. I cannot disobey my brother\u2019s instruction.', 2, 'calm', 1),
  narr('Lakshmana speaks with respect, hoping the sage will understand. But Durvasa\u2019s patience begins to fade.', 2, 'calm', 1),
  // SCREEN 3
  say('Durvasa', 'Do you understand whom you are keeping waiting? I am Sage Durvasa. I demand an audience with Rama!', 3, 'tense', 2),
  say('Lakshmana', 'Revered Sage, I have no intention of disrespecting you. I only seek to honour the command entrusted to me.', 3, 'tense', 2),
  say('Durvasa', 'If Rama refuses to receive me, I shall curse this kingdom! Let Ayodhya and its people bear the consequence of this insult!', 3, 'tense', 2),
  say('Lakshmana', 'Please, revered Sage. The people of Ayodhya have done you no wrong.', 3, 'tense', 2),
  say('Durvasa', 'Then decide quickly. Will you carry my message to your king, or shall I pronounce my curse?', 3, 'tense', 2),
  narr('Lakshmana falls silent. This is no longer merely a question of keeping a promise. The fate of Ayodhya\u2019s people now hangs upon his response.', 3, 'tense', 2),
  // SCREEN 4
  think('I gave my word to Rama. He trusted me to guard this entrance.', 4, 'deep', 3),
  think('But if I refuse the sage, his anger may fall upon Ayodhya.', 4, 'deep', 3),
  think('How can I allow an entire kingdom to suffer because I chose to preserve my promise?', 4, 'deep', 3),
  think('Yet if I enter the chamber, I shall break the very instruction I promised to uphold.', 4, 'deep', 3),
  think('Whatever I choose, something precious may be lost.', 4, 'deep', 3),
  narr('Lakshmana stands between two duties. One is a promise made to his beloved brother. The other is the protection of the people of Ayodhya.', 4, 'deep', 3),
  narr('Neither choice is without consequence.', 4, 'deep', 3),
  { t: 'choice', img: 4, mood: 'deep', pip: 3 },
  // CANONICAL REVEAL
  narr('Lakshmana finally makes his decision.', 4, 'deep', 3),
  narr('He cannot allow the people of Ayodhya to suffer for the sake of his promise.', 4, 'deep', 3),
  narr('He chooses to protect the kingdom, even though he understands what breaking Rama\u2019s instruction may mean for him.', 4, 'deep', 3),
  say('Lakshmana', 'Forgive me, brother. I must place the welfare of Ayodhya before my promise.', 4, 'deep', 3),
  narr('Lakshmana turns towards the private chamber and walks towards its entrance.', 4, 'deep', 3),
  // SCREEN 5
  say('Lakshmana', 'Brother, forgive this interruption. Sage Durvasa has arrived and demands an audience with you immediately.', 5, 'solemn', 4),
  say('Rama', 'Lakshmana? You have entered the chamber\u2026', 5, 'solemn', 4),
  say('Lakshmana', 'Forgive me, Rama. I know the instruction you gave me. But the sage has threatened to curse Ayodhya if he is not received.', 5, 'solemn', 4),
  say('Rama', 'You chose to protect the people of our kingdom.', 5, 'solemn', 4),
  say('Lakshmana', 'I could not allow Ayodhya to suffer, brother. I knew the promise I had made to you, but I could not turn away from the danger facing our people.', 5, 'solemn', 4),
  narr('Lakshmana has fulfilled one duty by placing himself in the path of another. But his entry has interrupted a meeting that was bound by a grave condition.', 5, 'solemn', 4),
  // SCREEN 6
  say('Rama', 'Lakshmana, the meeting with Kala was bound by a solemn condition. Whoever interrupted it would have to be abandoned.', 6, 'solemn', 5),
  say('Lakshmana', 'I understand, brother.', 6, 'solemn', 5),
  say('Rama', 'You knew the consequence, and yet you entered.', 6, 'solemn', 5),
  say('Lakshmana', 'The people of Ayodhya were in danger. I could not allow them to suffer.', 6, 'solemn', 5),
  say('Rama', 'You have always stood beside me, Lakshmana. How shall I face this consequence?', 6, 'solemn', 5),
  narr('Lakshmana\u2019s choice has protected Ayodhya from Durvasa\u2019s threatened curse. Yet the condition laid down during Kala\u2019s meeting cannot simply be ignored.', 6, 'solemn', 5),
  narr('The king now faces a painful conflict between the promise made during the private meeting and the brother who has stood beside him throughout his life.', 6, 'solemn', 5),
  narr('Sometimes the greatest choices are not between right and wrong, but between two duties that cannot both be fulfilled.', 6, 'solemn', 5),
];

const CHOICES = [
  {
    id: 1,
    label: 'Honour the promise',
    quote: 'I will not interrupt Rama\u2019s meeting. I must keep the promise I made.',
    response: 'Lakshmana preserves his promise, but Durvasa\u2019s threat remains. The people of Ayodhya could face the consequences of the sage\u2019s anger.',
    reflection: 'Keeping one\u2019s word is an important duty. But can a promise be upheld when doing so may place an entire kingdom in danger?',
    button: 'Consider another possibility',
  },
  {
    id: 2,
    label: 'Seek another moment',
    quote: 'I will ask the sage to wait a little longer and try to calm his anger.',
    response: 'Lakshmana attempts to find another way. Yet Durvasa has already made his demand clear, and his patience is running out. There is no assurance that he will agree to wait.',
    reflection: 'Seeking peace before making a difficult decision is wise. But sometimes circumstances leave very little room for compromise.',
    button: 'Consider another possibility',
  },
  {
    id: 3,
    label: 'Protect Ayodhya',
    quote: 'I will enter the chamber and inform Rama. I cannot allow the kingdom to suffer.',
    response: 'Lakshmana understands the consequence of breaking his promise. Yet he cannot remain silent while Ayodhya is threatened.',
    reflection: 'Sometimes duty requires a person to accept a personal consequence to protect others.',
    button: 'Reveal Lakshmana\u2019s decision',
  },
];

const ROMAN = ['I', 'II', 'III'];

/* ── Typewriter ─────────────────────────────────────────── */
function useTypewriter(text, { speed = 26, delay = 250, active = true } = {}) {
  const [n, setN] = useState(0);
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );
  useEffect(() => {
    setN(0);
    if (!active) return undefined;
    if (reduced) {
      setN(text.length);
      return undefined;
    }
    let i = 0;
    let timer;
    const tick = () => {
      i += 1;
      setN(i);
      if (i < text.length) {
        const ch = text[i - 1];
        const extra = ',;:'.includes(ch) ? 110 : '.?!\u2026'.includes(ch) ? 230 : 0;
        timer = setTimeout(tick, speed + extra);
      }
    };
    timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, [text, active, speed, delay, reduced]);
  const done = n >= text.length;
  const finish = useCallback(() => setN(text.length), [text]);
  return { shown: text.slice(0, n), rest: text.slice(n), done, finish };
}

function Typed({ tw, italic }) {
  return (
    <p className={`ic-text ${italic ? 'is-italic' : ''}`}>
      <span>{tw.shown}</span>
      {!tw.done && <span className="ic-caret" />}
      {/* invisible remainder reserves space so the panel never jumps */}
      <span className="ic-ghost">{tw.rest}</span>
    </p>
  );
}

/* ── 3D layer: drifting sacred motes with pointer parallax ─ */
function makeGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.3, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function Motes({ mood }) {
  const COUNT = 240;
  const pts = useRef();
  const mat = useRef();
  const tex = useMemo(makeGlow, []);
  const target = useMemo(() => new THREE.Color(), []);
  const { positions, seeds } = useMemo(() => {
    const p = new Float32Array(COUNT * 3);
    const s = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      p[i * 3] = (Math.random() - 0.5) * 18;
      p[i * 3 + 1] = (Math.random() - 0.5) * 11;
      p[i * 3 + 2] = Math.random() * 7 - 4;
      s[i] = Math.random();
    }
    return { positions: p, seeds: s };
  }, []);

  useFrame((state, dt) => {
    const m = MOODS[mood] || MOODS.calm;
    const t = state.clock.elapsedTime;
    const attr = pts.current.geometry.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      attr.array[i * 3 + 1] += dt * m.speed * (0.12 + s * 0.38);
      attr.array[i * 3] += Math.sin(t * 0.5 + s * 12) * dt * 0.1;
      if (attr.array[i * 3 + 1] > 5.5) {
        attr.array[i * 3 + 1] = -5.5;
        attr.array[i * 3] = (Math.random() - 0.5) * 18;
      }
    }
    attr.needsUpdate = true;
    mat.current.color.lerp(target.set(m.color), 0.04);
    mat.current.opacity += (m.opacity - mat.current.opacity) * 0.04;
    state.camera.position.x += (state.pointer.x * 0.7 - state.camera.position.x) * 0.04;
    state.camera.position.y += (state.pointer.y * 0.4 - state.camera.position.y) * 0.04;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        map={tex}
        size={0.24}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#ffd98a"
        opacity={0.8}
      />
    </points>
  );
}

function MoteLayer({ mood }) {
  return (
    <div className="ic-canvas" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <Motes mood={mood} />
      </Canvas>
    </div>
  );
}

/* ── Cinematic background ───────────────────────────────── */
function Backdrop({ img }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });
  const src = IMG[img];

  useEffect(() => {
    const onMove = (e) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * -16);
      my.set((e.clientY / window.innerHeight - 0.5) * -10);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [mx, my]);

  return (
    <motion.div className="ic-bg" style={{ x: sx, y: sy, scale: 1.07 }}>
      <AnimatePresence>
        <motion.img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className="ic-bg-img"
          style={{ transformOrigin: ORIGINS[img] }}
          initial={{ opacity: 0, scale: 1.0 }}
          animate={{
            opacity: 1,
            scale: 1.13,
            transition: { opacity: { duration: 1.3 }, scale: { duration: 26, ease: 'linear' } },
          }}
          exit={{ opacity: 0, transition: { duration: 1.3 } }}
        />
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Speaker plate ──────────────────────────────────────── */
function Plate({ who, thought }) {
  const sp = SPEAKERS[who];
  return (
    <motion.div
      className="ic-plate"
      style={{ '--accent': sp.accent }}
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <span className="ic-seal">
        <span className="ic-ripple" />
        <span className="ic-glyph">{sp.glyph}</span>
      </span>
      <span className="ic-name">{who}</span>
      <span className="ic-tag">{thought ? 'inner thought' : sp.tag}</span>
      <motion.span
        className="ic-underline"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      />
    </motion.div>
  );
}

/* ── Story panel (say / narr / think) ───────────────────── */
function StoryPanel({ beat, onAdvance, isLast }) {
  const tw = useTypewriter(beat.text, { speed: beat.t === 'narr' ? 22 : 27 });
  const click = () => {
    if (!tw.done) tw.finish();
    else onAdvance();
  };
  // allow keyboard from parent through ref
  const twRef = useRef(tw);
  twRef.current = tw;
  useEffect(() => {
    const onKey = (e) => {
      if (['Enter', ' ', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!twRef.current.done) twRef.current.finish();
        else onAdvance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAdvance]);

  const isNarr = beat.t === 'narr';
  const isThought = beat.t === 'think';
  return (
    <div className="ic-panel ic-story" onClick={click} role="button" tabIndex={0}>
      <div className="ic-panel-head">
        {isNarr ? (
          <span className="ic-narr-label">
            <i />
            Narration
            <i />
          </span>
        ) : (
          <Plate who={beat.who} thought={isThought} />
        )}
      </div>
      <div className={`ic-body ${isNarr ? 'is-narr' : ''}`}>
        <Typed tw={tw} italic={isNarr || isThought} />
      </div>
      <div className="ic-foot">
        <AnimatePresence>
          {tw.done && (
            <motion.span
              className="ic-continue"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              {isLast ? 'Continue' : 'Tap to continue'} <ChevronRight size={16} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Choice panel ───────────────────────────────────────── */
function ChoicePanel({ onReveal }) {
  const [sel, setSel] = useState(null);
  const [seen, setSeen] = useState([]);
  const choice = sel ? CHOICES.find((c) => c.id === sel) : null;
  const tw = useTypewriter(choice ? choice.response : '', { speed: 20, active: !!choice });

  const pick = (id) => {
    setSel(id);
    setSeen((s) => (s.includes(id) ? s : [...s, id]));
  };

  return (
    <div className="ic-panel ic-choice">
      <AnimatePresence mode="wait">
        {!choice ? (
          <motion.div
            key="menu"
            className="ic-choice-menu"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="ic-q">What should Lakshmana do?</h2>
            <p className="ic-q-sub">Consider the consequences before making your decision.</p>
            <div className="ic-options">
              {CHOICES.map((c, i) => (
                <motion.button
                  key={c.id}
                  className={`ic-option ${seen.includes(c.id) ? 'is-seen' : ''}`}
                  onClick={() => pick(c.id)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.45 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="ic-roman">{ROMAN[i]}</span>
                  <span className="ic-opt-label">{c.label}</span>
                  <span className="ic-opt-quote">{c.quote}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`c${choice.id}`}
            className="ic-choice-detail"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <div className="ic-detail-head">
              <span className="ic-roman big">{ROMAN[choice.id - 1]}</span>
              <span className="ic-opt-label big">{choice.label}</span>
            </div>
            <p className="ic-detail-quote">&ldquo;{choice.quote}&rdquo;</p>
            <Typed tw={tw} />
            <AnimatePresence>
              {tw.done && (
                <motion.p
                  className="ic-reflection"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {choice.reflection}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="ic-actions">
              <AnimatePresence>
                {tw.done && (
                  <motion.div
                    className="ic-actions-row"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    {choice.id === 3 ? (
                      <>
                        <button className="ic-btn ghost" onClick={() => setSel(null)}>
                          <RotateCcw size={15} /> Reconsider
                        </button>
                        <button className="ic-btn primary" onClick={onReveal}>
                          {choice.button} <ChevronRight size={18} />
                        </button>
                      </>
                    ) : (
                      <button className="ic-btn primary" onClick={() => setSel(null)}>
                        {choice.button} <ChevronRight size={18} />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Intro ──────────────────────────────────────────────── */
function Intro({ onStart }) {
  return (
    <motion.div className="ic-overlay ic-intro" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <motion.div
        className="ic-intro-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <span className="ic-eyebrow">Ancestra &middot; Game I</span>
        <h1 className="ic-title">The Impossible Choice</h1>
        <div className="ic-divider">
          <i />
          <b />
          <i />
        </div>
        <p className="ic-subtitle">When a promise stands against the welfare of an entire kingdom.</p>
        <span className="ic-chapter">Chapter XXVII &middot; The Last Days of Rama</span>
        <button className="ic-btn primary large" onClick={onStart}>
          Begin <ChevronRight size={18} />
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── Final reflection ───────────────────────────────────── */
function Reflection({ onDone }) {
  const paras = [
    'Lakshmana did not enter the chamber because he forgot his promise. He entered because he understood what might happen if he kept it.',
    'He protected Ayodhya, knowing that his decision would carry a personal consequence.',
    'His choice reminds us that duty is not always simple. Sometimes two responsibilities stand against one another, and a person must decide which burden to carry.',
  ];
  return (
    <motion.div
      className="ic-overlay ic-final"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="ic-final-card">
        <motion.span
          className="ic-eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Reflection
        </motion.span>
        <motion.h2
          className="ic-title sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          The Weight of Duty
        </motion.h2>
        <div className="ic-divider">
          <i />
          <b />
          <i />
        </div>
        {paras.map((p, i) => (
          <motion.p
            key={i}
            className="ic-final-p"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 + i * 1.5, duration: 0.9 }}
          >
            {p}
          </motion.p>
        ))}
        <motion.p
          className="ic-final-q"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3 + paras.length * 1.5 + 0.4, duration: 1 }}
        >
          Was Lakshmana&rsquo;s decision an act of disobedience, or the highest expression of his duty towards Ayodhya?
        </motion.p>
        <motion.span
          className="ic-closing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 + paras.length * 1.5 + 2.2, duration: 1.2 }}
        >
          The past cannot be changed. But the way we understand it can.
        </motion.span>
        <motion.button
          className="ic-btn primary large"
          onClick={onDone}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 + paras.length * 1.5 + 3.4, duration: 0.8 }}
        >
          Return to the chapter <ChevronRight size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Root ───────────────────────────────────────────────── */
export default function ImpossibleChoiceGame({ onComplete, onExit }) {
  const [phase, setPhase] = useState('intro'); // intro | play | final
  const [i, setI] = useState(0);
  const beat = BEATS[i];
  const prevScreen = useRef(null);

  // preload all stills
  useEffect(() => {
    Object.values(IMG).forEach((src) => {
      const im = new Image();
      im.src = src;
    });
  }, []);

  const advance = useCallback(() => {
    setI((n) => {
      if (n >= BEATS.length - 1) {
        setPhase('final');
        return n;
      }
      return n + 1;
    });
  }, []);

  const reveal = useCallback(() => setI((n) => n + 1), []);

  const screenIdx = beat.pip;
  const showChip = phase === 'play';
  const speakerKey = beat.t === 'say' || beat.t === 'think' ? `${i}-${beat.who}` : null;
  const accent = beat.who ? SPEAKERS[beat.who].accent : null;
  const isLast = i === BEATS.length - 1;

  useEffect(() => {
    prevScreen.current = screenIdx;
  }, [screenIdx]);

  const bgImg = phase === 'intro' ? 1 : phase === 'final' ? 6 : beat.img;
  const mood = phase === 'intro' ? 'calm' : phase === 'final' ? 'deep' : beat.mood;

  return (
    <div className="ic-root" data-mood={mood}>
      <div className="ic-frame">
        <Backdrop img={bgImg} />
        <MoteLayer mood={mood} />
        <div className="ic-rays" aria-hidden="true" />
        <div className="ic-vignette" aria-hidden="true" />
        <div className="ic-grain" aria-hidden="true" />

        {speakerKey && accent && (
          <div key={speakerKey} className="ic-flash" style={{ '--accent': accent }} aria-hidden="true" />
        )}

        {showChip && (
          <div className="ic-hud">
            <div className="ic-pips" aria-hidden="true">
              {SCREEN_TITLES.map((_, k) => (
                <span key={k} className={k < screenIdx ? 'on' : k === screenIdx ? 'cur' : ''} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={screenIdx}
                className="ic-chip"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {SCREEN_TITLES[screenIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        {onExit && (
          <button className="ic-exit" onClick={onExit} aria-label="Close">
            <X size={18} />
          </button>
        )}

        <AnimatePresence>{phase === 'intro' && <Intro key="intro" onStart={() => setPhase('play')} />}</AnimatePresence>
        {phase === 'final' && <Reflection onDone={() => onComplete?.()} />}
      </div>

      {phase === 'play' && (
        <AnimatePresence mode="wait">
          <motion.div
            key={beat.t === 'choice' ? 'choice' : 'story'}
            className="ic-panel-wrap"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
          >
            {beat.t === 'choice' ? (
              <ChoicePanel onReveal={reveal} />
            ) : (
              <StoryPanel key={i} beat={beat} onAdvance={advance} isLast={isLast} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}