import React, {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import './WeddingGame.css';

/* ────────────────────────────────────────────────────────────────────────────
   CONFIG — edit freely
   ──────────────────────────────────────────────────────────────────────────── */

const AUDIO_SRC = '/audio/sita.mp3';

const CHAPTER_DIR = '/images/chapters/';
const WEDDING_DIR = '/images/ramayana/interactions/';

// Add more chapter scenes here (the order below is the order they play).
const CHAPTER_SCENES = ['scene408', 'scene410', 'scene411', 'scene419', 'scene422'];
const WEDDING_COUNT = 13; // wedding1.jpg … wedding13.jpg

const ALL_SLIDES = [
  ...CHAPTER_SCENES.map((n) => `${CHAPTER_DIR}${n}.jpg`),
  ...Array.from({ length: WEDDING_COUNT }, (_, i) => `${WEDDING_DIR}wedding${i + 1}.jpg`),
];

const DEFAULT_SLIDE_MS = 5500; // how long each image stays (5–6 seconds)
const MIN_SLIDE_MS = 5000;
const MAX_SLIDE_MS = 6000;
const FIT_TO_MUSIC = false; // true = stretch timing to the song length (kept within MIN/MAX above)
const TRANS_S = 1.9; // transition length, seconds
const MUSIC_VOLUME = 0.9;

/* ────────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────────────── */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Incoming-slide transitions. Outgoing slides always linger underneath
// (see EXIT) so the new image *reveals* over the old one, never over black.
const TYPES = [
  {
    // soft golden bloom
    initial: { opacity: 0, scale: 1.12, filter: 'brightness(2.2) blur(16px)' },
    animate: { opacity: 1, scale: 1, filter: 'brightness(1) blur(0px)' },
  },
  {
    // lotus iris — light opens from the centre
    initial: { clipPath: 'circle(0% at 50% 52%)', filter: 'brightness(1.8)' },
    animate: { clipPath: 'circle(150% at 50% 52%)', filter: 'brightness(1)' },
  },
  {
    // temple doors opening
    initial: { clipPath: 'inset(0% 50% 0% 50%)', filter: 'brightness(1.5)' },
    animate: { clipPath: 'inset(0% 0% 0% 0%)', filter: 'brightness(1)' },
  },
  {
    // dreamy drift
    initial: { opacity: 0, x: 70, scale: 1.06, filter: 'brightness(1.4) blur(14px)' },
    animate: { opacity: 1, x: 0, scale: 1, filter: 'brightness(1) blur(0px)' },
  },
  {
    // sunrise — light rises from below
    initial: { clipPath: 'inset(100% 0% 0% 0%)', filter: 'brightness(1.9)' },
    animate: { clipPath: 'inset(0% 0% 0% 0%)', filter: 'brightness(1)' },
  },
];

const EXIT = {
  scale: 1.05,
  filter: 'brightness(0.8)',
  transition: { duration: TRANS_S, ease: [0.4, 0, 0.2, 1] },
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ────────────────────────────────────────────────────────────────────────────
   Decorative SVG
   ──────────────────────────────────────────────────────────────────────────── */

function Lotus({ size = 120 }) {
  const id = useMemo(() => `lg${Math.random().toString(36).slice(2, 8)}`, []);
  const outer = [-74, -37, 0, 37, 74];
  const inner = [-52, -18, 18, 52];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="55%" stopColor="#ffc857" />
          <stop offset="100%" stopColor="#ff8a3d" />
        </linearGradient>
        <radialGradient id={`${id}c`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="100%" stopColor="#ffb347" />
        </radialGradient>
      </defs>
      <g
        fill={`url(#${id})`}
        stroke="#fff6d6"
        strokeWidth="0.8"
        strokeOpacity="0.8"
        style={{ filter: 'drop-shadow(0 0 5px rgba(255,200,90,.9))' }}
      >
        {outer.map((a) => (
          <path
            key={`o${a}`}
            d="M50 90 C28 72 28 40 50 10 C72 40 72 72 50 90Z"
            transform={`rotate(${a} 50 90)`}
            opacity="0.85"
          />
        ))}
        {inner.map((a) => (
          <path
            key={`i${a}`}
            d="M50 90 C34 74 34 50 50 26 C66 50 66 74 50 90Z"
            transform={`rotate(${a} 50 90)`}
          />
        ))}
        <path d="M50 90 C38 76 38 56 50 34 C62 56 62 76 50 90Z" />
      </g>
      <circle cx="50" cy="82" r="5" fill={`url(#${id}c)`} />
    </svg>
  );
}

function Mandala({ className }) {
  return (
    <svg className={className} viewBox="-100 -100 200 200" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="0.45">
        <circle r="96" />
        <circle r="92" strokeDasharray="1.2 2.4" />
        <circle r="60" />
        <circle r="34" />
        <circle r="14" />
        {Array.from({ length: 24 }).map((_, i) => (
          <ellipse key={`a${i}`} cx="0" cy="-76" rx="6" ry="17" transform={`rotate(${i * 15})`} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse key={`b${i}`} cx="0" cy="-47" rx="8" ry="14" transform={`rotate(${i * 30 + 15})`} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <ellipse key={`c${i}`} cx="0" cy="-24" rx="5" ry="10" transform={`rotate(${i * 45})`} />
        ))}
      </g>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   3D layer — falling flower petals + golden sparkles (react-three-fiber)
   ──────────────────────────────────────────────────────────────────────────── */

const PETAL_COLORS = ['#ff9a1f', '#ffc93c', '#ff5d8f', '#ffb6c8', '#fff1cf', '#ff7a2f'];

function Petals({ count = 110, gust }) {
  const mesh = useRef();
  const boost = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geometry = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -1);
    s.bezierCurveTo(0.95, -0.55, 0.95, 0.55, 0, 1);
    s.bezierCurveTo(-0.95, 0.55, -0.95, -0.55, 0, -1);
    return new THREE.ShapeGeometry(s, 10);
  }, []);

  const data = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 18,
        y: Math.random() * 11 - 5.5,
        z: (Math.random() - 0.5) * 7 - 0.5,
        speed: 0.35 + Math.random() * 0.75,
        sway: Math.random() * Math.PI * 2,
        freq: 0.4 + Math.random() * 0.9,
        amp: 0.3 + Math.random() * 0.9,
        r: [Math.random() * 6, Math.random() * 6, Math.random() * 6],
        rs: [0.4 + Math.random() * 1.4, 0.4 + Math.random() * 1.4, 0.2 + Math.random() * 0.8],
        scale: 0.07 + Math.random() * 0.15,
      })),
    [count]
  );

  useEffect(() => {
    if (!mesh.current) return;
    const c = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      c.set(PETAL_COLORS[i % PETAL_COLORS.length]);
      mesh.current.setColorAt(i, c);
    }
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [count]);

  // every slide change = a gentle gust of petals
  useEffect(() => {
    boost.current = 3.2;
  }, [gust]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const dt = Math.min(delta, 0.05);
    boost.current = Math.max(0, boost.current - dt * 1.1);
    const mul = 1 + boost.current;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < data.length; i += 1) {
      const p = data[i];
      p.y -= p.speed * dt * mul;
      if (p.y < -5.6) {
        p.y = 5.6;
        p.x = (Math.random() - 0.5) * 18;
      }
      const sx = p.x + Math.sin(t * p.freq + p.sway) * p.amp + boost.current * 0.25;
      dummy.position.set(sx, p.y, p.z);
      dummy.rotation.set(
        p.r[0] + t * p.rs[0],
        p.r[1] + t * p.rs[1],
        p.r[2] + t * p.rs[2] * 0.4
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial
        color="#ffffff"
        side={THREE.DoubleSide}
        roughness={0.55}
        metalness={0.05}
        emissive="#552200"
        emissiveIntensity={0.35}
      />
    </instancedMesh>
  );
}

class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {}

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function PetalLayer({ gust, paused }) {
  return (
    <SafeBoundary>
      <Canvas
        className="ws-canvas"
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        frameloop={paused ? 'never' : 'always'}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.7} color="#fff0d0" />
        <pointLight position={[-4, -2, 3]} intensity={1.1} color="#ff9a4a" />
        <Suspense fallback={null}>
          <Petals gust={gust} />
          <Sparkles
            count={140}
            scale={[16, 9, 5]}
            size={3.2}
            speed={0.35}
            opacity={0.9}
            color="#ffd98a"
          />
          <Sparkles
            count={50}
            scale={[14, 8, 3]}
            size={7}
            speed={0.2}
            opacity={0.5}
            color="#ffb3c7"
          />
        </Suspense>
      </Canvas>
    </SafeBoundary>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Slide
   ──────────────────────────────────────────────────────────────────────────── */

function Slide({ src, index, tiltX, tiltY, paused, lifeMs }) {
  const t = TYPES[index % TYPES.length];
  return (
    <motion.div
      className="ws-slide"
      initial={index === 0 ? TYPES[0].initial : t.initial}
      animate={index === 0 ? TYPES[0].animate : t.animate}
      exit={EXIT}
      transition={{ duration: TRANS_S, ease: [0.65, 0, 0.35, 1] }}
    >
      <div className="ws-backdrop" style={{ backgroundImage: `url("${src}")` }} />
      <div className="ws-stage">
        <motion.div className="ws-tilt" style={{ rotateX: tiltX, rotateY: tiltY }}>
          <div
            className={`ws-kb ws-kb-${index % 4}`}
            style={{
              animationDuration: `${lifeMs}ms`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          >
            <div className="ws-frame">
              <img src={src} alt="" draggable={false} />
              <span className="ws-shine" />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Progress (driven by rAF so the main component doesn't re-render 60×/s)
   ──────────────────────────────────────────────────────────────────────────── */

function Progress({ elapsedRef, getMs, index, total }) {
  const fill = useRef(null);
  useEffect(() => {
    let raf;
    const loop = () => {
      if (fill.current) {
        fill.current.style.transform = `scaleX(${clamp(elapsedRef.current / getMs(), 0, 1)})`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [elapsedRef, getMs]);

  return (
    <div className="ws-progress" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`ws-seg ${i < index ? 'done' : ''}`}>
          {i === index && <b ref={fill} />}
        </span>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Static decoration data
   ──────────────────────────────────────────────────────────────────────────── */

const EMBERS = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  size: 4 + ((i * 5) % 9),
  dur: 11 + ((i * 3) % 10),
  delay: -((i * 1.7) % 16),
  drift: ((i % 7) - 3) * 14,
}));

/* ────────────────────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────────────────────── */

export default function WeddingGame({ onClose, onComplete }) {
  const reduce = useMemo(prefersReducedMotion, []);

  const [slides, setSlides] = useState([]);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [finale, setFinale] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [muted, setMuted] = useState(false);
  const [uiOn, setUiOn] = useState(true);

  const rootRef = useRef(null);
  const [isFs, setIsFs] = useState(false);
  const audioRef = useRef(null);
  const fadeRef = useRef(null);
  const durationRef = useRef(0);
  const elapsed = useRef(0);
  const indexRef = useRef(0);
  const lenRef = useRef(0);
  const uiTimer = useRef(null);

  indexRef.current = index;
  lenRef.current = slides.length;

  const audioOn = started && !userPaused && !hidden;
  const timerOn = audioOn && !finale;

  const getMs = useCallback(() => {
    if (FIT_TO_MUSIC && durationRef.current > 0 && lenRef.current > 0) {
      return clamp((durationRef.current * 1000) / lenRef.current, MIN_SLIDE_MS, MAX_SLIDE_MS);
    }
    return DEFAULT_SLIDE_MS;
  }, []);

  /* preload — images that fail to load are quietly skipped */
  useEffect(() => {
    let alive = true;
    Promise.all(
      ALL_SLIDES.map(
        (src) =>
          new Promise((resolve) => {
            const im = new Image();
            im.onload = () => resolve(src);
            im.onerror = () => resolve(null);
            im.src = src;
          })
      )
    ).then((list) => {
      if (!alive) return;
      setSlides(list.filter(Boolean));
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* audio */
  const fadeTo = useCallback((target, ms) => {
    const a = audioRef.current;
    if (!a) return;
    clearInterval(fadeRef.current);
    const from = a.volume;
    const t0 = performance.now();
    fadeRef.current = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = clamp(from + (target - from) * k, 0, 1);
      if (k >= 1) clearInterval(fadeRef.current);
    }, 50);
  }, []);

  useEffect(() => {
    const a = new Audio(AUDIO_SRC);
    a.loop = true;
    a.preload = 'auto';
    a.volume = 0;
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) durationRef.current = a.duration;
    };
    a.addEventListener('loadedmetadata', onMeta);
    audioRef.current = a;
    return () => {
      clearInterval(fadeRef.current);
      a.removeEventListener('loadedmetadata', onMeta);
      a.pause();
      a.removeAttribute('src');
      a.load();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !started) return;
    if (audioOn) {
      a.play().catch(() => {});
      fadeTo(MUSIC_VOLUME, 1200);
    } else {
      a.pause();
    }
  }, [audioOn, started, fadeTo]);

  /* tab hidden → pause everything */
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  /* navigation */
  const goTo = useCallback((i) => {
    elapsed.current = 0;
    setFinale(false);
    setIndex(clamp(i, 0, Math.max(0, lenRef.current - 1)));
  }, []);

  const finish = useCallback(() => {
    elapsed.current = 0;
    setFinale(true);
    if (onComplete) onComplete();
  }, [onComplete]);

  const next = useCallback(() => {
    if (indexRef.current >= lenRef.current - 1) finish();
    else goTo(indexRef.current + 1);
  }, [finish, goTo]);

  const prev = useCallback(() => goTo(indexRef.current - 1), [goTo]);

  const replay = useCallback(() => {
    setUserPaused(false);
    goTo(0);
  }, [goTo]);

  /* master clock */
  useEffect(() => {
    if (!timerOn) return undefined;
    let raf;
    let last = performance.now();
    const loop = (now) => {
      elapsed.current += Math.min(now - last, 100);
      last = now;
      if (elapsed.current >= getMs()) next();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [timerOn, getMs, next]);

  /* real browser fullscreen (must be triggered by a click / key press) */
  const enterFs = useCallback(() => {
    const el = rootRef.current;
    if (!el || document.fullscreenElement) return;
    try {
      const p = el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {
      /* fullscreen not available — the game still fills the window */
    }
  }, []);

  const exitFs = useCallback(() => {
    try {
      if (document.fullscreenElement) {
        const p = document.exitFullscreen?.();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) exitFs();
    else enterFs();
  }, [enterFs, exitFs]);

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      try {
        if (document.fullscreenElement) document.exitFullscreen?.();
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  const begin = useCallback(() => {
    if (!ready) return;
    enterFs();
    const a = audioRef.current;
    if (a) {
      a.play()
        .then(() => fadeTo(MUSIC_VOLUME, 3500))
        .catch(() => {});
    }
    elapsed.current = 0;
    if (slides.length === 0) setFinale(true);
    setStarted(true);
  }, [ready, slides.length, fadeTo, enterFs]);

  const handleClose = useCallback(() => {
    exitFs();
    fadeTo(0, 700);
    setTimeout(() => {
      if (onClose) onClose();
    }, 720);
  }, [fadeTo, onClose, exitFs]);

  /* keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (!started) {
        if ((e.key === 'Enter' || e.key === ' ') && ready) {
          e.preventDefault();
          begin();
        }
        if (e.key === 'Escape' && onClose) handleClose();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        setUserPaused((p) => !p);
      } else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'm' || e.key === 'M') setMuted((m) => !m);
      else if (e.key === 'f' || e.key === 'F') toggleFs();
      else if (e.key === 'Escape' && onClose) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, ready, begin, next, prev, onClose, handleClose, toggleFs]);

  /* 3D tilt + idle-hiding controls */
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const tiltX = useSpring(rx, { stiffness: 60, damping: 16, mass: 0.8 });
  const tiltY = useSpring(ry, { stiffness: 60, damping: 16, mass: 0.8 });

  const poke = useCallback(() => {
    setUiOn(true);
    clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => setUiOn(false), 3200);
  }, []);

  useEffect(() => () => clearTimeout(uiTimer.current), []);

  const onPointerMove = (e) => {
    poke();
    if (reduce) return;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    ry.set(x * 7);
    rx.set(-y * 5);
  };

  const current = slides[index];
  const lifeMs = getMs() + TRANS_S * 1000;
  const showUi = uiOn || userPaused || finale;

  return (
    <div className="ws-root" ref={rootRef} onPointerMove={onPointerMove} onPointerDown={poke}>
      <div className="ws-bg" />

      {/* slideshow */}
      <div className="ws-slides">
        <AnimatePresence initial={false}>
          {started && current && (
            <Slide
              key={`${index}-${current}`}
              src={current}
              index={index}
              tiltX={tiltX}
              tiltY={tiltY}
              paused={!timerOn}
              lifeMs={lifeMs}
            />
          )}
        </AnimatePresence>
      </div>

      {/* atmosphere */}
      <div className="ws-mandala-bg">
        <Mandala className="ws-mandala-spin" />
      </div>
      <div className="ws-rays" />
      <div className="ws-grade" />
      <div className="ws-embers" aria-hidden="true">
        {EMBERS.map((e, i) => (
          <i
            key={i}
            style={{
              left: e.left,
              width: e.size,
              height: e.size,
              animationDuration: `${e.dur}s`,
              animationDelay: `${e.delay}s`,
              '--drift': `${e.drift}px`,
            }}
          />
        ))}
      </div>

      {/* transition flourishes */}
      {started && (
        <>
          <motion.div
            key={`flash-${index}`}
            className="ws-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: TRANS_S * 1.1, times: [0, 0.4, 1], ease: 'easeInOut' }}
          />
          <motion.div
            key={`ring-${index}`}
            className="ws-ring"
            initial={{ scale: 0.15, opacity: 0.75 }}
            animate={{ scale: 3.4, opacity: 0 }}
            transition={{ duration: TRANS_S * 1.4, ease: 'easeOut' }}
          />
        </>
      )}

      {/* 3D petals + sparkles */}
      {started && !reduce && <PetalLayer gust={index} paused={!audioOn} />}

      <div className="ws-vignette" />

      {/* progress + controls */}
      {started && slides.length > 0 && (
        <Progress
          elapsedRef={elapsed}
          getMs={getMs}
          index={finale ? slides.length : index}
          total={slides.length}
        />
      )}

      {started && (
        <div className={`ws-controls ${showUi ? 'is-on' : ''}`}>
          <button type="button" aria-label="Previous" onClick={prev}>
            <SkipBack size={20} />
          </button>
          <button
            type="button"
            className="ws-main"
            aria-label={userPaused ? 'Play' : 'Pause'}
            onClick={() => setUserPaused((p) => !p)}
          >
            {userPaused ? <Play size={22} /> : <Pause size={22} />}
          </button>
          <button type="button" aria-label="Next" onClick={next}>
            <SkipForward size={20} />
          </button>
          <span className="ws-sep" />
          <button
            type="button"
            aria-label={muted ? 'Unmute' : 'Mute'}
            onClick={() => setMuted((m) => !m)}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            type="button"
            aria-label={isFs ? 'Exit full screen' : 'Full screen'}
            title={isFs ? 'Exit full screen (F)' : 'Full screen (F)'}
            onClick={toggleFs}
          >
            {isFs ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      )}

      {onClose && started && (
        <button
          type="button"
          className={`ws-close ${showUi ? 'is-on' : ''}`}
          aria-label="Close"
          onClick={handleClose}
        >
          <X size={20} />
        </button>
      )}

      {/* finale */}
      <AnimatePresence>
        {finale && (
          <motion.div
            className="ws-finale"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2 }}
          >
            <Mandala className="ws-finale-mandala" />
            <motion.div
              className="ws-finale-lotus"
              initial={{ scale: 0.3, opacity: 0, rotate: -24 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.9, duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Lotus size={190} />
            </motion.div>
            <motion.div
              className="ws-finale-actions"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.6, duration: 1 }}
            >
              <button type="button" aria-label="Watch again" onClick={replay}>
                <RotateCcw size={22} />
              </button>
              {onClose && (
                <button type="button" aria-label="Close" onClick={handleClose}>
                  <X size={22} />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* gate — one tap so the browser lets the music play */}
      <AnimatePresence>
        {!started && (
          <motion.div
            className="ws-gate"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.18, filter: 'brightness(2.6)' }}
            transition={{ duration: 1.7, ease: [0.4, 0, 0.2, 1] }}
          >
            <Mandala className="ws-gate-mandala" />
            <div className="ws-gate-glow" />
            <motion.button
              type="button"
              className={`ws-gate-btn ${ready ? 'is-ready' : ''}`}
              aria-label="Begin"
              disabled={!ready}
              onClick={begin}
              whileHover={ready ? { scale: 1.08 } : undefined}
              whileTap={ready ? { scale: 0.94 } : undefined}
            >
              <span className="ws-gate-ring" />
              <span className="ws-gate-ring r2" />
              <Lotus size={118} />
            </motion.button>
            {onClose && (
              <button
                type="button"
                className="ws-close is-on"
                aria-label="Close"
                onClick={handleClose}
              >
                <X size={20} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}