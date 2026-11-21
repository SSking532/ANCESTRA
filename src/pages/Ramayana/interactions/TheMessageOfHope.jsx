/**
 * ANCESTRA — GAME 2 · CHAPTER XX · THE FALL OF RAVANA (Yuddha Kanda)
 * "THE MESSAGE OF HOPE"
 *
 * Self-contained cinematic interactive scene.
 *
 * Dependencies (all already used elsewhere in ANCESTRA):
 *   react, framer-motion, @react-three/fiber, three
 *
 * Usage:
 *   <TheMessageOfHope
 *      onReturn={() => navigate('/chapter/20')}   // RETURN TO CHAPTER XX button
 *      onExit={() => navigate('/chapter/20')}     // exit (X) button and Esc, available on every screen
 *      onComplete={() => markGameDone('ch20-g2')} // optional, fired when the final card's Continue is pressed
 *   />
 *
 * Styles live in ./TheMessageOfHope.css (keep the two files side by side).
 * Nothing here touches other chapter files. Ambient sound is public/audio/garden.mp3 (looped, crossfaded),
 * ON by default, and can be muted with the sound button.
 */
import React, {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import './TheMessageOfHope.css';

/* ───────────────────────────────────────────────────────────── DATA ── */

const IMAGES = [
  '/images/ramayana/interactions/ch20g21.jpg',
  '/images/ramayana/interactions/ch20g22.jpg',
  '/images/ramayana/interactions/ch20g23.jpg',
  '/images/ramayana/interactions/ch20g24.jpg',
  '/images/ramayana/interactions/ch20g25.jpg',
];

const TYPE_MS = 12; // milliseconds per character — fast typewriter
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

const WHO = {
  HANUMAN: { name: 'Hanuman', dot: '#c2562b' },
  SITA: { name: 'Sita', dot: '#e8b13a' },
  NOTE: { name: 'Reflection', dot: '#cdb27a' },
};

const L = (who, text, extra = {}) => ({ t: 'line', who, text, ...extra });

const SCENES = [
  {
    title: 'Hanuman Arrives',
    image: 0,
    fade: 1.5,
    kb: { s0: 1.04, s1: 1.09, x0: '-0.8%', x1: '0.8%', y0: '0%', y1: '-0.8%' },
    nodes: [
      L('HANUMAN', 'Mother, I have returned with news from Lord Rama.'),
      L('SITA', 'Hanuman… you have come from Rama?'),
      L('HANUMAN', 'Yes, Mother. I bring news from the battlefield.'),
      L('SITA', 'Tell me… is Rama safe?', { cue: 'hush' }),
    ],
  },
  {
    title: 'The First Question',
    image: 1,
    fade: 1.9,
    kb: { s0: 1.09, s1: 1.04, x0: '0.8%', x1: '-0.6%', y0: '-0.6%', y1: '0%' },
    nodes: [
      L('SITA', 'Tell me first, Hanuman… is my Lord well?'),
      L('HANUMAN', 'Mother, Lord Rama is safe. He has defeated Ravana. The war is over.', { cue: 'relief' }),
      L('SITA', 'Then tell me about Lakshmana. Did he return safely?'),
      L('HANUMAN', 'Lakshmana is safe, Mother. He stood beside Rama through the battle.'),
      L('SITA', 'And how did the battle finally come to an end?'),
      L('HANUMAN', 'Ravana was defeated by Rama. The suffering of the war has ended.'),
    ],
  },
  {
    title: 'Those Who Fought',
    image: 2,
    fade: 1.7,
    kb: { s0: 1.04, s1: 1.09, x0: '0.6%', x1: '-0.8%', y0: '0%', y1: '-0.6%' },
    nodes: [
      L('SITA', 'And the Vanara warriors? Those who stood beside Rama and fought for him… are they safe?'),
      L('HANUMAN', 'They fought with courage, Mother. Their sacrifices helped bring this victory.'),
      L('SITA', 'They came from so far, and fought for a cause that was not their own…'),
      L('HANUMAN', 'They stood with Rama because they believed in him. Their courage will be remembered.'),
      L('NOTE', 'Even after hearing that Rama has won, Sita’s thoughts turn toward those who stood beside him.'),
    ],
  },
  {
    title: 'Rama’s Message',
    image: 3,
    fade: 2.1,
    kb: { s0: 1.08, s1: 1.04, x0: '-0.6%', x1: '0.7%', y0: '-0.7%', y1: '0%' },
    nodes: [
      L('HANUMAN', 'Mother, Vibhishana has been crowned the king of Lanka. The war has ended, and peace may now return to this kingdom.'),
      L('SITA', 'And Rama… what does he say?'),
      L('HANUMAN', 'Lord Rama wishes to see you, Mother. He has asked that you be brought to him with dignity.'),
      L('SITA', 'After all this time…', { cue: 'hush' }),
      L('HANUMAN', 'He awaits you.', { cue: 'swell' }),
      L('NOTE', 'Ravana has fallen, Vibhishana is king of Lanka, and Rama waits to see Sita. The message has been delivered.'),
    ],
  },
  {
    title: 'Hope Returns',
    image: 4,
    fade: 3.4,
    kb: { s0: 1.03, s1: 1.1, x0: '0%', x1: '0%', y0: '0.4%', y1: '-0.6%' },
    nodes: [
      L('SITA', 'At last… the waiting is almost over.'),
      L('HANUMAN', 'Mother, the moment you have waited for is approaching.'),
      L('SITA', 'Tell Rama… I am ready to see him.'),
      L('HANUMAN', 'I shall convey your words, Mother.', { auto: 2800, cue: 'resolve' }),
    ],
  },
];

const OPENING = {
  paras: [
    'The war had ended. Ravana had fallen. Lanka had entered a new chapter under its new king.',
    'But in Ashoka Vatika, Sita still waited.',
    'Rama had not yet come before her. Instead, he sent someone she trusted.',
    'Hanuman had returned with a message.',
  ],
  title: 'THE MESSAGE OF HOPE',
  subtitle: 'Some victories are not understood until their message reaches those who waited.',
  button: 'CONTINUE',
};

const FINALE = {
  paras: [
    'The message had reached its destination.',
    'The war was over. Lanka had a new king. And after a long separation, the meeting of Rama and Sita was finally approaching.',
  ],
  title: 'HOPE RETURNS',
  subtitle: 'The message was delivered. The reunion awaits.',
  button: 'CONTINUE',
};

/* ──────────────────────────────────────────────────────────── AUDIO ── */
/* Simple ambient garden sound: public/audio/garden.mp3, looped with a soft crossfade
   so the loop point is never audible. Fades in and out; stays silent (no errors) if the file is missing. */
const GARDEN_AUDIO = '/audio/garden.mp3';
const GARDEN_LEVEL = 0.6;
const SIYARAM_AUDIO = '/audio/siyaram.mp3'; // plays once on the last image
const SIYARAM_LEVEL = 0.9;

function createAudioEngine() {
  if (typeof Audio === 'undefined') return null;
  const make = () => {
    const a = new Audio(GARDEN_AUDIO);
    a.preload = 'auto';
    a.volume = 0;
    return a;
  };
  const A = make();
  const B = make();
  let cur = A;
  let enabled = false;
  let hidden = false;
  let level = 0;
  let target = 0;
  let last = performance.now();

  const play = (a) => {
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  };

  const timer = setInterval(() => {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    level += (target - level) * Math.min(1, dt / (target ? 0.9 : 0.2));
    if (!target && level < 0.01) {
      level = 0;
      if (!A.paused) A.pause();
      if (!B.paused) B.pause();
    }
    [A, B].forEach((a) => {
      if (a.paused) return;
      const d = a.duration;
      const t = a.currentTime;
      const xf = isFinite(d) ? Math.min(2.5, d / 3) : 2.5;
      const env = isFinite(d) ? Math.min(1, t / xf, (d - t) / xf) : Math.min(1, t / xf);
      a.volume = Math.max(0, Math.min(1, level * env));
      if (isFinite(d) && d - t < xf) {
        const o = a === A ? B : A;
        if (o.paused) {
          o.currentTime = 0;
          cur = o;
          play(o);
        }
      }
    });
  }, 50);

  return {
    setEnabled(on) {
      enabled = on;
      target = on ? GARDEN_LEVEL : 0;
      if (on && !hidden && A.paused && B.paused) play(cur);
    },
    /* true while sound should be playing but the browser is still holding it */
    suspended() {
      return enabled && !hidden && A.paused && B.paused;
    },
    setPaused(p) {
      hidden = p;
      if (p) {
        A.pause();
        B.pause();
      } else if (enabled) play(cur);
    },
    mood() {},
    dispose() {
      clearInterval(timer);
      [A, B].forEach((a) => {
        a.pause();
        a.removeAttribute('src');
        a.load();
      });
    },
  };
}

/* ───────────────────────────────────────────────────────── 3D LAYER ── */
/* react-three-fiber: drifting golden motes, soft foreground bokeh, falling Ashoka blossoms,
   all with real depth + camera parallax that follows the pointer. */

function useGlowTexture() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function Motes({ count, size, zMin, zMax, speed, color, opacity, intensity, burst }) {
  const tex = useGlowTexture();
  const col = useMemo(() => new THREE.Color(color), [color]);
  const { geo, base, phase } = useMemo(() => {
    const b = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      b[i * 3] = (Math.random() - 0.5) * 16;
      b[i * 3 + 1] = (Math.random() - 0.5) * 9;
      b[i * 3 + 2] = zMin + Math.random() * (zMax - zMin);
      ph[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(b), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return { geo: g, base: b, phase: ph };
  }, [count, zMin, zMax]);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pos = geo.attributes.position.array;
    const cl = geo.attributes.color.array;
    const boost = 1 + burst.current * 1.3;
    for (let i = 0; i < count; i++) {
      const p = phase[i];
      const s = speed * (0.6 + (i % 5) * 0.15);
      pos[i * 3] = base[i * 3] + Math.sin(t * s + p) * 0.45;
      pos[i * 3 + 1] = base[i * 3 + 1] + Math.cos(t * s * 0.8 + p * 1.3) * 0.35 + Math.sin(t * 0.15 + p) * 0.3;
      pos[i * 3 + 2] = base[i * 3 + 2];
      const tw = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(t * (0.8 + (i % 7) * 0.25) + p * 3), 2);
      const k = tw * intensity * boost;
      cl[i * 3] = col.r * k;
      cl[i * 3 + 1] = col.g * k;
      cl[i * 3 + 2] = col.b * k;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        map={tex}
        size={size}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        opacity={opacity}
      />
    </points>
  );
}

const PETAL_COLORS = ['#e8924a', '#e6bd62', '#f4e6c4', '#d9784a', '#efb36a'];

function Petals({ density, burst, max = 34 }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.12, 0.08, 0.14, 0.3, 0, 0.42);
    s.bezierCurveTo(-0.14, 0.3, -0.12, 0.08, 0, 0);
    return new THREE.ShapeGeometry(s);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  const data = useMemo(
    () =>
      Array.from({ length: max }, () => ({
        x: (Math.random() - 0.5) * 14,
        y: (Math.random() - 0.5) * 10,
        z: -1 + Math.random() * 4.5,
        vy: 0.25 + Math.random() * 0.35,
        sw: 0.4 + Math.random() * 0.6,
        ph: Math.random() * Math.PI * 2,
        r: [0.4 + Math.random() * 0.8, 0.3 + Math.random() * 0.7, 0.2 + Math.random() * 0.6],
        s: 0.55 + Math.random() * 0.7,
      })),
    [max],
  );
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    for (let i = 0; i < max; i++) {
      c.set(PETAL_COLORS[i % PETAL_COLORS.length]);
      m.setColorAt(i, c);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [max]);

  useFrame((state, delta) => {
    const m = ref.current;
    if (!m) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const n = Math.max(0, Math.floor(max * density));
    m.count = n;
    const boost = 1 + burst.current * 2.2;
    for (let i = 0; i < n; i++) {
      const d = data[i];
      d.y -= d.vy * dt * boost;
      if (d.y < -5.2) {
        d.y = 5.2;
        d.x = (Math.random() - 0.5) * 14;
      }
      dummy.position.set(d.x + Math.sin(t * d.sw + d.ph) * 0.6, d.y, d.z);
      dummy.rotation.set(t * d.r[0] + d.ph, t * d.r[1], t * d.r[2] + d.ph);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, max]} frustumCulled={false}>
      <primitive object={geo} attach="geometry" />
      <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.88} depthWrite={false} />
    </instancedMesh>
  );
}

function Rig({ ptr, burst }) {
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const c = state.camera;
    c.position.x += (ptr.current.x * 0.7 - c.position.x) * Math.min(1, dt * 2);
    c.position.y += (-ptr.current.y * 0.4 - c.position.y) * Math.min(1, dt * 2);
    c.lookAt(0, 0, 0);
    burst.current = Math.max(0, burst.current - dt * 0.7);
  });
  return null;
}

class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* WebGL unavailable → the game is fully playable without the 3D layer */
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const TINT = ['rgba(64,78,112,0.30)', 'rgba(84,78,96,0.22)', 'rgba(150,104,66,0.14)', 'rgba(255,186,96,0.16)', 'rgba(255,205,120,0.24)'];
const VIG = [1, 0.96, 0.82, 0.66, 0.5];
const DENSITY = [0.4, 0.45, 0.55, 0.7, 1];
const GLOW = [0.9, 0.95, 1, 1.1, 1.35];

function Particles({ ptr, burst, level }) {
  return (
    <SafeBoundary>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <Rig ptr={ptr} burst={burst} />
        <Motes count={120} size={0.09} zMin={-2} zMax={2} speed={0.35} color="#ffd98a" opacity={0.95} intensity={GLOW[level]} burst={burst} />
        <Motes count={20} size={0.6} zMin={3} zMax={5.5} speed={0.2} color="#ffe7b0" opacity={0.2} intensity={GLOW[level] * 0.85} burst={burst} />
        <Petals density={DENSITY[level]} burst={burst} />
      </Canvas>
    </SafeBoundary>
  );
}

/* ───────────────────────────────────────────────────────── HOOKS ── */

function useTypewriter(text, speedMs) {
  const [count, setCount] = useState(0);
  const skip = useRef(false);
  useEffect(() => {
    skip.current = false;
    let raf;
    let start = null;
    const tick = (t) => {
      if (skip.current) return;
      if (start == null) start = t;
      const n = Math.min(text.length, Math.floor((t - start) / speedMs) + 1);
      setCount(n);
      if (n < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, speedMs]);
  const finish = useCallback(() => {
    skip.current = true;
    setCount(text.length);
  }, [text]);
  return { count, done: count >= text.length, finish };
}

/* ─────────────────────────────────────────────────── SCENE PIECES ── */

function SceneImage({ src, kb, reduce }) {
  const [failed, setFailed] = useState(false);
  return (
    <motion.div
      className="moh-kb"
      initial={{ scale: kb.s0, x: kb.x0, y: kb.y0 }}
      animate={reduce ? undefined : { scale: kb.s1, x: kb.x1, y: kb.y1 }}
      transition={{ duration: 28, ease: 'linear' }}
    >
      {failed ? (
        <div className="moh-fallback" />
      ) : (
        <img className="moh-img" src={src} alt="" draggable={false} onError={() => setFailed(true)} />
      )}
    </motion.div>
  );
}

function DialogueLine({ node, onAdvance, onCue, pressRef }) {
  const { count, done, finish } = useTypewriter(node.text, TYPE_MS);
  const born = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const doneAt = useRef(0);
  const advRef = useRef(onAdvance);
  advRef.current = onAdvance;
  const cueRef = useRef(onCue);
  cueRef.current = onCue;

  useEffect(() => {
    if (node.cue && cueRef.current) cueRef.current(node.cue);
  }, [node.cue]);

  useEffect(() => {
    if (done && !doneAt.current) doneAt.current = performance.now();
  }, [done]);

  const press = useCallback(() => {
    const now = performance.now();
    if (now - born.current < 160) return; // swallow the click that created this line
    if (!done) {
      finish();
      return;
    }
    if (now - doneAt.current < 140) return; // prevent accidental double-skip
    advRef.current();
  }, [done, finish]);

  useEffect(() => {
    pressRef.current = press;
    return () => {
      if (pressRef.current === press) pressRef.current = null;
    };
  }, [press, pressRef]);

  useEffect(() => {
    if (done && node.auto) {
      const id = setTimeout(() => advRef.current(), node.auto);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [done, node.auto]);

  const who = WHO[node.who];
  const isNote = node.who === 'NOTE';
  return (
    <>
      <div className="moh-name" key={node.who}>
        <i style={{ background: who.dot }} />
        {who.name}
      </div>
      <p className={'moh-text' + (isNote ? ' note' : '')}>
        <span>{node.text.slice(0, count)}</span>
        {!done && <span className="moh-caret" />}
        <span style={{ opacity: 0 }}>{node.text.slice(count)}</span>
      </p>
      <button
        type="button"
        className={'moh-next' + (done ? ' on' : '')}
        onClick={(e) => {
          e.stopPropagation();
          press();
        }}
        aria-label="Continue"
      >
        Continue <b>›</b>
      </button>
    </>
  );
}

/** Opening and closing title cards. */
function TitleCard({ cfg, onDone, fadeAway }) {
  const [n, setN] = useState(0);
  const [stage, setStage] = useState('text');
  const [btn, setBtn] = useState(false);
  const born = useRef(performance.now());
  const { paras } = cfg;

  useEffect(() => {
    if (stage !== 'text') return undefined;
    let id;
    if (n === 0) id = setTimeout(() => setN(1), 700);
    else if (n < paras.length) id = setTimeout(() => setN(n + 1), paras[n - 1].length > 60 ? 1700 : 1150);
    else id = setTimeout(() => setStage('title'), 1500);
    return () => clearTimeout(id);
  }, [n, stage, paras]);

  useEffect(() => {
    if (stage !== 'title') return undefined;
    const id = setTimeout(() => setBtn(true), 1500);
    return () => clearTimeout(id);
  }, [stage]);

  const skip = () => {
    if (performance.now() - born.current < 400) return;
    if (stage !== 'text') return;
    if (n < paras.length) setN(paras.length);
    else setStage('title');
  };

  return (
    <motion.div
      className="moh-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: fadeAway ? 1.2 : 0.9 }}
      onClick={skip}
    >
      <AnimatePresence mode="wait">
        {stage === 'text' ? (
          <motion.div key="text" className="moh-paras" exit={{ opacity: 0, transition: { duration: 0.8 } }}>
            {paras.slice(0, n).map((p, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {p}
              </motion.p>
            ))}
          </motion.div>
        ) : (
          <motion.div key="title" className="moh-titlewrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <div className="moh-titleglow">
              <motion.h1
                className="moh-title"
                initial={{ opacity: 0, letterSpacing: '0.5em', filter: 'blur(14px)' }}
                animate={{ opacity: 1, letterSpacing: '0.14em', filter: 'blur(0px)' }}
                transition={{ duration: 1.8, ease: [0.16, 0.8, 0.2, 1] }}
              >
                {cfg.title}
              </motion.h1>
            </div>
            <motion.div className="moh-orn" initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 0.9, duration: 1 }}>
              <span />
              <i />
              <span />
            </motion.div>
            <motion.p className="moh-sub" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 1 }}>
              {cfg.subtitle}
            </motion.p>
            <div className="moh-btnslot">
              {btn && (
                <motion.button
                  type="button"
                  className="moh-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDone();
                  }}
                >
                  {cfg.button}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SoundIcon({ on }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
      {on ? (
        <>
          <path d="M15.5 9a4 4 0 0 1 0 6" />
          <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      ) : (
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      )}
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────── MAIN ── */

export default function TheMessageOfHope({ onReturn, onComplete, onExit, fullscreen = true, className = '' }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState('opening'); // opening | scene | narration | complete
  const [sceneIdx, setSceneIdx] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [panelReady, setPanelReady] = useState(false);
  const [soundOn, setSoundOn] = useState(true); // sound is on by default
  const [calm, setCalm] = useState(false); // heartbeat released after "Rama is safe"

  const pressRef = useRef(null);
  const advanceRef = useRef(() => {});
  const ptr = useRef({ x: 0, y: 0 });
  const burst = useRef(0);
  const engineRef = useRef(null);
  const soundRef = useRef(false);
  const siyaramRef = useRef(null);
  const siyaramDone = useRef(false);
  soundRef.current = soundOn;

  const scene = SCENES[sceneIdx];
  const nodes = scene.nodes;
  const node = nodes[cursor];

  /* parallax / 3D tilt */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18, mass: 0.8 });
  const sy = useSpring(my, { stiffness: 40, damping: 18, mass: 0.8 });
  const imgX = useTransform(sx, (v) => v * -16);
  const imgY = useTransform(sy, (v) => v * -10);
  const rotY = useTransform(sx, (v) => v * 1.3);
  const rotX = useTransform(sy, (v) => v * -0.9);

  useEffect(() => {
    if (reduce) return undefined;
    let raf;
    const t0 = performance.now();
    const loop = (t) => {
      const s = (t - t0) / 1000;
      mx.set(ptr.current.x * 0.9 + Math.sin(s * 0.23) * 0.25);
      my.set(ptr.current.y * 0.9 + Math.cos(s * 0.19) * 0.2);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce, mx, my]);

  const onPointerMove = useCallback((e) => {
    ptr.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.current.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, []);

  /* preload all five images so cross-fades are seamless */
  useEffect(() => {
    IMAGES.forEach((src) => {
      const im = new Image();
      im.src = src;
    });
  }, []);

  /* audio */
  const play = useCallback((name) => {
    if (name === 'choose' || name === 'correct' || name === 'swell' || name === 'resolve') burst.current = 1;
    if (name === 'relief') burst.current = 0.8;
    if (name === 'wrong') burst.current = Math.max(burst.current, 0.25);
    if (soundRef.current && engineRef.current && engineRef.current[name]) engineRef.current[name]();
  }, []);

  /* audio engine: created on mount, sound on by default */
  useEffect(() => {
    const e = createAudioEngine();
    engineRef.current = e;
    if (e) e.setEnabled(soundRef.current);
    /* browsers may hold audio until the first tap / key press: release it then */
    const unlock = () => {
      const eng = engineRef.current;
      if (eng && eng.suspended()) eng.setEnabled(soundRef.current);
    };
    const onVis = () => {
      if (engineRef.current) engineRef.current.setPaused(document.hidden);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', onVis);
      if (engineRef.current) engineRef.current.dispose();
      engineRef.current = null;
    };
  }, []);

  /* siyaram.mp3: plays once when the last image appears (and stays with it through the finale) */
  useEffect(() => {
    if (typeof Audio === 'undefined') return undefined;
    const a = new Audio(SIYARAM_AUDIO);
    a.preload = 'auto';
    a.volume = SIYARAM_LEVEL;
    const onEnded = () => {
      siyaramDone.current = true;
    };
    a.addEventListener('ended', onEnded);
    siyaramRef.current = a;
    return () => {
      a.removeEventListener('ended', onEnded);
      a.pause();
      siyaramRef.current = null;
    };
  }, []);

  const onLastImage = (phase === 'scene' && sceneIdx === SCENES.length - 1) || phase === 'narration' || phase === 'complete';
  useEffect(() => {
    const a = siyaramRef.current;
    if (!a) return;
    if (onLastImage && soundOn) {
      if (!siyaramDone.current) {
        const p = a.play();
        if (p && p.catch) p.catch(() => {});
      }
    } else {
      a.pause();
    }
  }, [onLastImage, soundOn]);

  const toggleSound = () => {
    const on = !soundOn;
    if (engineRef.current) engineRef.current.setEnabled(on);
    setSoundOn(on);
  };

  useEffect(() => {
    if (phase === 'narration') play('final');
  }, [phase, play]);

  const moodName = phase === 'opening' ? 'opening' : phase === 'scene' ? `s${sceneIdx}` : phase === 'narration' ? 'finale' : 'done';
  useEffect(() => {
    if (engineRef.current) engineRef.current.mood(moodName);
  }, [moodName]);

  useEffect(() => {
    setCalm(false);
  }, [sceneIdx]);

  const onCue = useCallback(
    (cue) => {
      play(cue);
      if (cue === 'relief') setCalm(true);
    },
    [play],
  );

  /* panel appears once the new image has mostly faded in */
  useEffect(() => {
    if (phase !== 'scene') {
      setPanelReady(false);
      return undefined;
    }
    setPanelReady(false);
    const id = setTimeout(() => setPanelReady(true), SCENES[sceneIdx].fade * 550 + (sceneIdx === 0 ? 250 : 0));
    return () => clearTimeout(id);
  }, [phase, sceneIdx]);

  const advance = () => {
    if (cursor + 1 < nodes.length) {
      setCursor(cursor + 1);
      play('advance');
    } else if (sceneIdx < SCENES.length - 1) {
      setPanelReady(false);
      setSceneIdx(sceneIdx + 1);
      setCursor(0);
      play('scene');
    } else {
      setPanelReady(false);
      setPhase('narration');
    }
  };
  advanceRef.current = advance;

  /* keyboard: Space / Enter / → advance text only (never skips an interaction) */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'ArrowRight') return;
      if (e.target && e.target.tagName === 'BUTTON') return;
      if (pressRef.current) {
        e.preventDefault();
        pressRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleReturn = () => {
    if (onReturn) onReturn();
    else if (typeof window !== 'undefined') window.history.back();
  };

  const handleExit = () => {
    if (onExit) onExit();
    else handleReturn();
  };
  /* after the closing card's Continue: straight back to the chapter */
  const finish = () => {
    if (onComplete) onComplete();
    handleReturn();
  };
  const exitRef = useRef(handleExit);
  exitRef.current = handleExit;
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape') exitRef.current();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const imgIdx = phase === 'scene' ? sceneIdx : phase === 'opening' ? 0 : 4;
  const level = phase === 'opening' ? 0 : phase === 'scene' ? sceneIdx : 4;
  const dim = phase === 'opening' ? 0.58 : phase === 'narration' ? 0.5 : 0;
  const blur = phase === 'opening' || phase === 'narration' ? 3 : 0;
  const imgScene = SCENES[imgIdx];

  const renderNode = () => {
    if (!node) return null;
    const key = `${sceneIdx}-${cursor}`;
    if (node.t === 'line') return <DialogueLine key={key} node={node} onAdvance={() => advanceRef.current()} onCue={onCue} pressRef={pressRef} />;
    return null;
  };

  return (
    <div
      className={`moh-root${fullscreen ? ' fs' : ''} ${className}`}
      onPointerMove={onPointerMove}
      role="application"
      aria-label="The Message of Hope — an interactive scene"
    >
      {/* ── 3D stage: images, grade, light, particles ── */}
      <motion.div className="moh-stage" style={reduce ? undefined : { rotateX: rotX, rotateY: rotY }}>
        <motion.div className="moh-parallax" style={reduce ? undefined : { x: imgX, y: imgY }}>
          <AnimatePresence initial={false}>
            <motion.div
              key={imgIdx}
              className="moh-layer"
              style={{ zIndex: imgIdx + 1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1, transition: { duration: imgScene.fade } }}
              transition={{ duration: imgScene.fade, ease: 'easeInOut' }}
            >
              <SceneImage src={IMAGES[imgScene.image]} kb={imgScene.kb} reduce={reduce} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="moh-grade"
          animate={{ opacity: [0.35, 0.5, 0.65, 0.8, 1][level] }}
          transition={{ duration: 2.5 }}
        />
        <motion.div className="moh-tint" animate={{ backgroundColor: TINT[level] }} transition={{ duration: 2.4 }} />
        <div className="moh-rays" />
        <motion.div
          className="moh-dim"
          animate={{ opacity: dim, backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />
        {!reduce && <Particles ptr={ptr} burst={burst} level={level} />}
        <AnimatePresence>
          {phase === 'scene' && (
            <motion.div
              key={`sweep-${sceneIdx}`}
              className="moh-sweep"
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.9, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div className="moh-vignette" animate={{ opacity: VIG[level] }} transition={{ duration: 2.4 }} />
      {phase === 'scene' && sceneIdx <= 1 && !calm && (
        <div key={`beat-${sceneIdx}`} className="moh-beat" style={{ animationDuration: sceneIdx === 0 ? '1.15s' : '0.94s' }} />
      )}
      <div className="moh-grain" />

      {/* ── HUD ── */}
      <AnimatePresence>
        {phase === 'scene' && (
          <motion.div className="moh-hud" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={sceneIdx}
                className="moh-scene"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <b>{ROMAN[sceneIdx]}</b>
                <span>{scene.title}</span>
              </motion.div>
            </AnimatePresence>
            <div className="moh-progress" aria-label={`Stage ${sceneIdx + 1} of ${SCENES.length}`}>
              {SCENES.map((s, i) => (
                <i key={s.title} className={i < sceneIdx ? 'done' : i === sceneIdx ? 'cur' : ''} />
              ))}
            </div>
            <div className="moh-hudr">
              <button type="button" className="moh-icon" onClick={toggleSound} aria-label={soundOn ? 'Mute sound' : 'Turn sound on'} title={soundOn ? 'Sound on' : 'Sound off'}>
                <SoundIcon on={soundOn} />
              </button>
              <button type="button" className="moh-icon moh-exit" onClick={handleExit} aria-label="Exit" title="Exit">
                &#10005;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* sound toggle on title / finale / completion screens too */}
      {phase !== 'scene' && (
        <div className="moh-hud solo">
          <div />
          <div />
          <div className="moh-hudr">
            {phase === 'opening' && !soundOn && <span className="moh-soundhint">Best felt with sound</span>}
            <button
              type="button"
              className={'moh-icon' + (phase === 'opening' && !soundOn ? ' pulse' : '')}
              onClick={toggleSound}
              aria-label={soundOn ? 'Mute sound' : 'Turn sound on'}
              title={soundOn ? 'Sound on' : 'Sound off'}
            >
              <SoundIcon on={soundOn} />
            </button>
              <button type="button" className="moh-icon moh-exit" onClick={handleExit} aria-label="Exit" title="Exit">
                &#10005;
              </button>
          </div>
        </div>
      )}

      {/* ── dialogue / interaction panel ── */}
      <AnimatePresence>
        {phase === 'scene' && panelReady && (
          <motion.div
            key={`panel-${sceneIdx}`}
            className="moh-panel-wrap"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className={'moh-panel' + (node && node.t === 'line' ? ' is-line' : '')} onClick={() => pressRef.current && pressRef.current()}>
              {renderNode()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── cards ── */}
      <AnimatePresence>
        {phase === 'opening' && <TitleCard key="open" cfg={OPENING} onDone={() => setPhase('scene')} />}
        {phase === 'narration' && <TitleCard key="final" cfg={FINALE} fadeAway onDone={finish} />}
      </AnimatePresence>
    </div>
  );
}