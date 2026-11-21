import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import * as THREE from "three";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import "./SacredBowGame.css";

const IMAGE_BASE = "/images/ramayana/interactions/sacred-bow";

const FRAMES = [
  ["01-prayer", "THE PRAYER", "Watch carefully. Rama approaches the sacred bow."],
  ["02-lift", "THE LIFT", "Click to continue."],
  ["03-position", "THE POSITION", "Rama has lifted the bow. Prepare for the moment."],
  ["04-ready", "THE MOMENT", "Click 4 times to begin drawing the bow."],
  ["05-bend-01", "THE FIRST BEND", "Keep clicking. The bow begins to yield."],
  ["06-bend-02", "THE SECOND BEND", "Again. Do not stop."],
  ["07-bend-03", "THE THIRD BEND", "The sacred bow bends further."],
  ["08-bend-04", "THE FOURTH BEND", "Keep your rhythm."],
  ["09-bend-05", "THE FIFTH BEND", "The bow is nearing its limit."],
  ["10-limit", "THE LIMIT", "The bow has reached its limit."],
  ["11-break", "THE BREAK", "The sacred bow has broken."],
].map(([file, label, instruction], i) => ({
  id: i + 1,
  src: `${IMAGE_BASE}/${file}.jpg`,
  label,
  instruction,
}));

const CROWD_AUDIO = "/audio/crowd.mp3";
const BOW_SNAP_AUDIO = "/audio/bowsnap.mp3";
const RANG_AUDIO = "/audio/rang.mp3";

const CLICKS_PER_STAGE = 4;
const FIRST_BEND_FRAME = 5;
const LAST_BEND_FRAME = 10;
const TOTAL_BEND_CLICKS = (LAST_BEND_FRAME - FIRST_BEND_FRAME + 1) * CLICKS_PER_STAGE;
const CRACK_ZOOM_DURATION = 1400;
const IMPACT_DURATION = 3300;
const COMPLETE_DELAY = 7200;
const CRACK_X = 50;
const CRACK_Y = 46;

/* ===== 3D FX LAYER (three.js) ===== */
const AMBIENT = 420;
const BURST = 900;
const N = AMBIENT + BURST;

const VERT = `
attribute float aSize; attribute float aLife; attribute float aHeat;
varying float vLife; varying float vHeat;
void main(){
  vLife = aLife; vHeat = aHeat;
  gl_PointSize = aSize * (0.35 + aLife);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

const FRAG = `
varying float vLife; varying float vHeat;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if(d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  vec3 gold = vec3(1.0, 0.72, 0.32);
  vec3 white = vec3(1.0, 0.95, 0.82);
  gl_FragColor = vec4(mix(gold, white, vHeat * core), core * core * vLife);
}`;

/**
 * Transparent WebGL layer: rising embers that intensify with
 * bow tension, click sparks and a full-screen break explosion.
 * ref.spark(xPct, yPct, count) / ref.explode(xPct, yPct)
 */
const BowFX = forwardRef(function BowFX({ tension = 0 }, ref) {
  const host = useRef(null);
  const live = useRef({ tension: 0, emit: null });
  live.current.tension = tension;

  useImperativeHandle(ref, () => ({
    spark: (x, y, n = 16) => live.current.emit?.(x, y, n, 1),
    explode: (x = 50, y = 46) => live.current.emit?.(x, y, 520, 3.2),
  }));

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return undefined; // no WebGL: the game still works
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
    let w = 1;
    let h = 1;

    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 2);
    const life = new Float32Array(N);
    const decay = new Float32Array(N);
    const size = new Float32Array(N);
    const heat = new Float32Array(N);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aHeat", new THREE.BufferAttribute(heat, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(geo, mat));

    const resize = () => {
      w = el.clientWidth || 1;
      h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.right = w;
      camera.top = h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let cursor = AMBIENT;
    live.current.emit = (xp, yp, n, power) => {
      for (let k = 0; k < n; k += 1) {
        const i = cursor;
        cursor = cursor + 1 >= N ? AMBIENT : cursor + 1;
        const a = Math.random() * Math.PI * 2;
        const s = (40 + Math.random() * 260) * power;
        pos[i * 3] = (xp / 100) * w;
        pos[i * 3 + 1] = h - (yp / 100) * h;
        vel[i * 2] = Math.cos(a) * s;
        vel[i * 2 + 1] = Math.sin(a) * s;
        life[i] = 1;
        decay[i] = 0.45 + Math.random() * 0.9;
        size[i] = (3 + Math.random() * 7) * (power > 2 ? 1.5 : 1);
        heat[i] = Math.random();
      }
    };

    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let raf;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = live.current.tension;

      for (let i = 0; i < N; i += 1) {
        if (life[i] <= 0) {
          if (i < AMBIENT && !reduce && Math.random() < 0.02 + t * 0.06) {
            pos[i * 3] = Math.random() * w;
            pos[i * 3 + 1] = -10;
            vel[i * 2] = (Math.random() - 0.5) * 24;
            vel[i * 2 + 1] = 30 + Math.random() * (50 + t * 130);
            life[i] = 1;
            decay[i] = 0.12 + Math.random() * 0.2;
            size[i] = 2 + Math.random() * (3 + t * 5);
            heat[i] = t;
          }
          continue;
        }
        life[i] -= decay[i] * dt;
        if (i >= AMBIENT) {
          vel[i * 2] *= 1 - 1.6 * dt;
          vel[i * 2 + 1] = vel[i * 2 + 1] * (1 - 1.6 * dt) - 90 * dt;
        } else {
          vel[i * 2] += Math.sin(now * 0.001 + i) * 14 * dt;
        }
        pos[i * 3] += vel[i * 2] * dt;
        pos[i * 3 + 1] += vel[i * 2 + 1] * dt;
        if (life[i] < 0) life[i] = 0;
      }

      geo.attributes.position.needsUpdate = true;
      geo.attributes.aLife.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
      geo.attributes.aHeat.needsUpdate = true;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      live.current.emit = null;
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="sacred-bow-game__fx" aria-hidden="true" />;
});



const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

export default function SacredBowGame({ onComplete }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [impact, setImpact] = useState(false);
  const [crackZoom, setCrackZoom] = useState(false);
  const [crackZoomFinished, setCrackZoomFinished] = useState(false);
  const [pulse, setPulse] = useState(0);

  const clickLock = useRef(false);
  const crowdRef = useRef(null);
  const snapRef = useRef(null);
  const rangRef = useRef(null);
  const fxRef = useRef(null);
  const sceneRef = useRef(null);
  const timers = useRef({});

  const frame = FRAMES[frameIndex];
  const isSetup = frame.id <= 4;
  const isBending = frame.id >= FIRST_BEND_FRAME && frame.id <= LAST_BEND_FRAME;
  const isLimit = frame.id === LAST_BEND_FRAME;
  const bendStage = isBending ? frame.id - FIRST_BEND_FRAME + 1 : 0;
  const remaining = CLICKS_PER_STAGE - clickCount;

  /* 0 → 1 across the whole drawing sequence */
  const tension = useMemo(() => {
    if (impact || complete) return 1;
    if (!isBending) return 0;
    return Math.min(
      ((frame.id - FIRST_BEND_FRAME) * CLICKS_PER_STAGE + clickCount) / TOTAL_BEND_CLICKS,
      1
    );
  }, [isBending, frame.id, clickCount, impact, complete]);

  const petals = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: 2 + ((i * 37) % 96),
        delay: (i % 11) * 0.38,
        duration: 5.2 + (i % 6) * 0.5,
        size: 7 + (i % 5) * 2,
        rotation: (i % 2 === 0 ? 1 : -1) * (20 + (i % 7) * 11),
        type: i % 3,
      })),
    []
  );

  const setTimer = (key, fn, ms) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = window.setTimeout(fn, ms);
  };

  /* preload */
  useEffect(() => {
    FRAMES.forEach((f) => {
      const img = new Image();
      img.src = f.src;
    });
  }, []);

  /* audio setup */
  useEffect(() => {
    const crowd = crowdRef.current;
    const snap = snapRef.current;
    if (!crowd || !snap) return undefined;
    crowd.loop = true;
    crowd.volume = 0.34;
    snap.volume = 0.9;
    const rang = rangRef.current;
    if (rang) {
      rang.volume = 1;
      rang.load();
    }
    crowd.load();
    snap.load();
    return () => {
      crowd.pause();
      snap.pause();
      rang?.pause();
    };
  }, []);

  /* crack zoom on frame 10 */
  useEffect(() => {
    if (frame.id !== 10 || !started) return undefined;
    setCrackZoom(true);
    setCrackZoomFinished(false);
    setTimer(
      "crack",
      () => {
        setCrackZoom(false);
        setCrackZoomFinished(true);
      },
      CRACK_ZOOM_DURATION
    );
    return () => clearTimeout(timers.current.crack);
  }, [frame.id, started]);

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  const rewind = (audio) => {
    if (!audio) return;
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }
  };

  const triggerBreak = () => {
    if (impact) return;
    rewind(crowdRef.current);
    setFrameIndex(10);
    setImpact(true);

    const snap = snapRef.current;
    if (snap) {
      rewind(snap);
      snap.volume = 0.9;
      snap.play()?.catch(() => {});
    }

    const rang = rangRef.current;
    if (rang) {
      rewind(rang);
      rang.volume = 1;
      rang.play()?.catch(() => {});
    }

    fxRef.current?.explode(CRACK_X, CRACK_Y);
    window.setTimeout(() => fxRef.current?.explode(CRACK_X, CRACK_Y), 260);
    navigator.vibrate?.([60, 40, 120]);

    setTimer("impact", () => setImpact(false), IMPACT_DURATION);
    setTimer("complete", () => setComplete(true), COMPLETE_DELAY);
  };

  const handleClick = useCallback(
    (event) => {
      if (clickLock.current || complete || impact) return;
      clickLock.current = true;
      window.setTimeout(() => {
        clickLock.current = false;
      }, 100);

      /* sparks where the person clicked */
      const rect = sceneRef.current?.getBoundingClientRect();
      if (started && rect && event?.clientX != null) {
        fxRef.current?.spark(
          ((event.clientX - rect.left) / rect.width) * 100,
          ((event.clientY - rect.top) / rect.height) * 100,
          10 + Math.round(tension * 22)
        );
      } else if (started) {
        fxRef.current?.spark(CRACK_X, CRACK_Y, 14);
      }
      setPulse((p) => p + 1);
      if (started) navigator.vibrate?.(8 + Math.round(tension * 20));

      if (!started) {
        setStarted(true);
        setFrameIndex(1);
        return;
      }

      if (isSetup) {
        if (frame.id === 2) {
          const crowd = crowdRef.current;
          if (crowd?.paused) crowd.play()?.catch(() => {});
        }
        if (frame.id === 4) setClickCount(1);
        setFrameIndex((i) => i + 1);
        return;
      }

      if (isBending) {
        const next = clickCount + 1;
        if (next < CLICKS_PER_STAGE) {
          setClickCount(next);
          return;
        }
        setClickCount(0);
        if (frame.id < LAST_BEND_FRAME) {
          setFrameIndex((i) => i + 1);
          fxRef.current?.spark(CRACK_X, CRACK_Y, 46);
          return;
        }
        if (isLimit && crackZoomFinished) triggerBreak();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [started, complete, impact, isSetup, isBending, isLimit, frame.id, clickCount, crackZoomFinished, tension]
  );

  /* keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key !== " " && e.key !== "Enter") || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      handleClick();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClick]);

  /* pointer parallax */
  const onPointerMove = (e) => {
    const el = sceneRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  const resetGame = () => {
    rewind(crowdRef.current);
    rewind(snapRef.current);
    rewind(rangRef.current);
    Object.values(timers.current).forEach(clearTimeout);
    setFrameIndex(0);
    setClickCount(0);
    setStarted(false);
    setComplete(false);
    setImpact(false);
    setCrackZoom(false);
    setCrackZoomFinished(false);
    clickLock.current = false;
  };

  const showHud = started && !complete && !impact;
  const overall = Math.round(tension * 100);

  return (
    <div
      className={`sacred-bow-game ${impact ? "sacred-bow-game--impact" : ""}`}
      style={{ "--tension": tension }}
    >
      <audio ref={crowdRef} src={CROWD_AUDIO} preload="auto" loop playsInline />
      <audio ref={snapRef} src={BOW_SNAP_AUDIO} preload="auto" playsInline />
      <audio ref={rangRef} src={RANG_AUDIO} preload="auto" playsInline />

      <div
        ref={sceneRef}
        className="sacred-bow-game__scene"
        role="button"
        tabIndex={0}
        aria-label={started ? "Continue the sacred bow sequence" : "Begin the sacred bow sequence"}
        onClick={handleClick}
        onPointerMove={onPointerMove}
      >
        {/* parallax stage */}
        <div className="sacred-bow-game__stage">
          <motion.img
            key={frame.id}
            src={frame.src}
            alt=""
            className={`sacred-bow-game__image ${crackZoom ? "sacred-bow-game__image--crack" : ""}`}
            style={{ "--crack-x": `${CRACK_X}%`, "--crack-y": `${CRACK_Y}%` }}
            initial={{ opacity: 0, scale: 1.035 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            draggable="false"
          />
          {/* breathing push-in while the bow is drawn */}
          <div key={pulse} className="sacred-bow-game__punch" />
        </div>

        <div className="sacred-bow-game__grade" />
        <div className="sacred-bow-game__top-vignette" />
        <div className="sacred-bow-game__bottom-vignette" />
        <div className="sacred-bow-game__strain" />
        <div className="sacred-bow-game__rays" />

        <div className="sacred-bow-game__flowers" aria-hidden="true">
          {petals.map((p) => (
            <span
              key={p.id}
              className={`sacred-bow-petal sacred-bow-petal--${p.type}`}
              style={{
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                "--petal-size": `${p.size}px`,
                "--petal-rotation": `${p.rotation}deg`,
              }}
            />
          ))}
        </div>

        {/* WebGL embers, sparks, explosion */}
        <BowFX ref={fxRef} tension={tension} />

        <div className="sacred-bow-game__letterbox sacred-bow-game__letterbox--top" />
        <div className="sacred-bow-game__letterbox sacred-bow-game__letterbox--bottom" />

        {/* START */}
        {!started && (
          <motion.div
            className="sacred-bow-game__start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="sacred-bow-game__royal-mark"
              animate={{ rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={26} strokeWidth={0.8} />
            </motion.div>
            <span className="sacred-bow-game__eyebrow">MITHILA · THE SACRED BOW</span>
            <h1>
              A Moment
              <strong>Remembered.</strong>
            </h1>
            <p>
              Watch Rama carefully.
              <br />
              Click to continue each movement.
              <br />
              When the drawing begins, keep clicking.
            </p>
            <button
              type="button"
              className="sacred-bow-game__primary"
              onClick={(e) => {
                e.stopPropagation();
                handleClick(e);
              }}
            >
              <span>BEGIN THE MOMENT</span>
              <ArrowRight size={17} strokeWidth={1.2} />
            </button>
          </motion.div>
        )}

        {/* CHAPTER TITLE */}
        {showHud && (
          <motion.div
            key={`t-${frame.id}`}
            className="sacred-bow-game__chapter"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <small>MOVEMENT {ROMAN[frame.id - 1]} OF XI</small>
            <b>{frame.label}</b>
          </motion.div>
        )}

        {/* STRAIN GAUGE */}
        {showHud && isBending && (
          <div className="sacred-bow-game__gauge" aria-hidden="true">
            <span>STRAIN</span>
            <div>
              <i style={{ transform: `scaleY(${tension})` }} />
            </div>
            <em>{overall}%</em>
          </div>
        )}

        {/* INSTRUCTION */}
        {showHud && (
          <motion.div
            key={`${frame.id}-${clickCount}`}
            className="sacred-bow-game__instruction"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <span>{frame.instruction}</span>
          </motion.div>
        )}

        {/* DRAW HUD */}
        {showHud && isBending && (
          <div className="sacred-bow-game__hud">
            <div className="sacred-bow-game__hud-left">
              <span>THE SACRED BOW</span>
              <strong>DRAW {bendStage} / 6</strong>
            </div>
            <div className="sacred-bow-game__hud-right">
              <span>CLICK</span>
              <div className="sacred-bow-game__segments">
                {Array.from({ length: CLICKS_PER_STAGE }, (_, i) => (
                  <i key={i} className={i < clickCount ? "is-filled" : ""} />
                ))}
              </div>
              <small>{remaining === 1 ? "ONE MORE" : `${remaining} MORE`}</small>
            </div>
          </div>
        )}

        {/* CRACK FOCUS */}
        <AnimatePresence>
          {isLimit && crackZoom && (
            <motion.div
              className="sacred-bow-game__crack-focus"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div />
              <span>THE LIMIT</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FINAL IMPACT */}
        <AnimatePresence>
          {impact && (
            <>
              {[
                ["one", 0.95, 3.8, 2.25, 0],
                ["two", 0.8, 3, 2.4, 0.12],
                ["three", 0.58, 2.35, 2.55, 0.24],
                ["four", 0.48, 1.95, 2.7, 0.34],
              ].map(([name, o, s, d, delay]) => (
                <motion.div
                  key={name}
                  className={`sacred-bow-game__shockwave sacred-bow-game__shockwave--${name}`}
                  style={{ left: `${CRACK_X}%`, top: `${CRACK_Y}%` }}
                  initial={{ opacity: o, scale: 0.02 }}
                  animate={{ opacity: 0, scale: s }}
                  transition={{ duration: d, delay, ease: "easeOut" }}
                />
              ))}
              <motion.div
                className="sacred-bow-game__flash"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.1 }}
              />
              <motion.div
                className="sacred-bow-game__break-title"
                initial={{ opacity: 0, scale: 0.9, y: 18, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.45, duration: 0.8 }}
              >
                <span>THE SILENCE BREAKS</span>
                <h2>
                  THE BOW
                  <strong>BREAKS.</strong>
                </h2>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* COMPLETE */}
      <AnimatePresence>
        {complete && (
          <motion.div
            className="sacred-bow-game__complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="sacred-bow-game__complete-panel"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="sacred-bow-game__complete-icon">
                <Check size={31} strokeWidth={1} />
              </div>
              <span>THE CHALLENGE IS ANSWERED</span>
              <h2>
                The Bow
                <strong>Has Broken.</strong>
              </h2>
              <p>The sound of the bow travels through Mithila.</p>
              <div className="sacred-bow-game__complete-actions">
                <button type="button" className="sacred-bow-game__secondary" onClick={resetGame}>
                  <RotateCcw size={15} strokeWidth={1.1} />
                  PLAY AGAIN
                </button>
                <button type="button" className="sacred-bow-game__primary" onClick={onComplete}>
                  <span>RETURN TO THE CHAPTER</span>
                  <ArrowRight size={17} strokeWidth={1.2} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}