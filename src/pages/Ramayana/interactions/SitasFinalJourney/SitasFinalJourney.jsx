import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './SitasFinalJourney.css';
import { createSitaAudio } from './sitaAudio';
import {
  DEFAULT_HOLD,
  FIRST_LINE_DELAY,
  SCENES,
  SPEAKERS,
  PARTICLES,
  PANEL_OUT,
  COOLDOWN,
  FINAL_HOLD,
  FADE_OUT,
  lineText,
  buildPlan,
} from './sitaScript';

/**
 * ANCESTRA · Chapter XXVI · Game 2 — Sita's Final Journey
 * A witnessed, non-interactive cinematic. The only controls are Continue, Skip and Replay.
 *
 * Props
 *  onComplete  called by the ending screen's CONTINUE (return to the chapter so Scene 18 can conclude)
 *  onClose     called by the small ✕ (optional; falls back for CONTINUE if onComplete is missing)
 *  sound       set false to start muted (default true)
 */

const TAU = Math.PI * 2;
const PETAL_COLORS = ['#f2c6a8', '#f6dcc5', '#e9a98b', '#fff0d6', '#d9b36a'];

const Icon = {
  replay: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4.5v4.8h4.8" />
    </svg>
  ),
  soundOn: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.6L12.5 19V5L7.6 9.5H4z" />
      <path d="M16 9a4.2 4.2 0 0 1 0 6M18.6 6.5a7.6 7.6 0 0 1 0 11" />
    </svg>
  ),
  soundOff: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.6L12.5 19V5L7.6 9.5H4z" />
      <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
};

function usePrefersReducedMotion() {
  const [r] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  return r;
}

/* ───────────────────────── one cinematic image layer with its own camera */
function CineLayer({ scene, focus, active, fade, instant, reduced }) {
  const [cam, setCam] = useState(scene.cam.from);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setCam(scene.cam.to));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [scene]);

  useEffect(() => {
    if (active && focus) setCam(focus);
  }, [focus, active]);

  const style = {
    transform: `translate3d(${cam.x || 0}%, ${cam.y || 0}%, 0) scale(${cam.s})`,
    transformOrigin: `${cam.ox ?? 50}% ${cam.oy ?? 50}%`,
    transitionDuration: reduced ? '0ms' : `${cam.dur || 40000}ms`,
    transitionTimingFunction: cam.ease || 'cubic-bezier(.3,.05,.2,1)',
  };

  return (
    <div className={`sfj-layer ${instant ? '' : 'in'}`} style={{ '--fade': `${fade}ms` }}>
      <div className="sfj-cine" style={style}>
        {failed ? (
          <div className="sfj-fallback">
            <span>{scene.title}</span>
          </div>
        ) : (
          <img
            src={scene.image}
            alt=""
            draggable="false"
            onError={() => {
              // eslint-disable-next-line no-console
              console.warn('[SitasFinalJourney] image failed to load:', scene.image);
              setFailed(true);
            }}
          />
        )}
      </div>
      <div className="sfj-tint" style={{ background: scene.tint }} />
      <div className="sfj-rays" style={{ '--ray': scene.rays }} />
    </div>
  );
}

/* ───────────────────────── main component */
export default function SitasFinalJourney({ onComplete, onClose, sound = true }) {
  const reduced = usePrefersReducedMotion();

  const [phase, setPhase] = useState('overture'); // overture | play | ending
  const [layers, setLayers] = useState([]);
  const [cursor, setCursorState] = useState({ s: 0, l: 0 });
  const [panelOn, setPanelOn] = useState(false);
  const [typed, setTyped] = useState('');
  const [status, setStatusState] = useState('idle'); // idle | typing | ready
  const [shake, setShake] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const [titleKey, setTitleKey] = useState(0);
  const [titleScene, setTitleScene] = useState(0);
  const [finalGlow, setFinalGlow] = useState(false);
  const [fade, setFade] = useState({ mode: 'none', key: 0 }); // none | intro | outro
  const [muted, setMutedState] = useState(!sound);

  const rootRef = useRef(null);
  const rigRef = useRef(null);
  const canvasRef = useRef(null);
  const ptrRef = useRef({ x: 0, y: 0 });
  const modeRef = useRef(PARTICLES.none);

  const aliveRef = useRef(true);
  const runRef = useRef(0);
  const timers = useRef(new Set());
  const autoRef = useRef(0);
  const lockRef = useRef(true);
  const cursorRef = useRef({ s: 0, l: 0 });
  const statusRef = useRef('idle');
  const phaseRef = useRef('overture');
  const finishRef = useRef(null);
  const readyAtRef = useRef(0);
  const finaleRef = useRef(false);
  const endingRef = useRef(false);
  const layerSeq = useRef(0);
  const audioRef = useRef(null);
  const mutedRef = useRef(!sound);
  const apiRef = useRef({});

  const getAudio = () => {
    if (!audioRef.current) audioRef.current = createSitaAudio();
    return audioRef.current;
  };

  const setStatus = (v) => {
    statusRef.current = v;
    setStatusState(v);
  };
  const setCursor = (c) => {
    cursorRef.current = c;
    setCursorState(c);
  };
  const setPhaseBoth = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const later = useCallback((ms, fn) => {
    const run = runRef.current;
    const id = setTimeout(() => {
      timers.current.delete(id);
      if (!aliveRef.current || run !== runRef.current) return;
      fn();
    }, ms);
    timers.current.add(id);
    return id;
  }, []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    clearTimeout(autoRef.current);
  };

  /* lifecycle: mount / unmount safety, scroll lock, image preload */
  useEffect(() => {
    aliveRef.current = true;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    SCENES.forEach((sc) => {
      const im = new Image();
      im.src = sc.image;
    });
    return () => {
      aliveRef.current = false;
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      clearTimeout(autoRef.current);
      audioRef.current?.dispose();
      audioRef.current = null;
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  /* ─────────── effects: audio / visual cues attached to scenes and lines */
  const runFx = (fx) => {
    if (!fx) return;
    const a = audioRef.current;
    if (fx.mood && a) a.mood(fx.mood, fx.moodSec || 2);
    if (fx.swell && a) a.swell();
    if (fx.pulse) setPulseKey((k) => k + 1);
    if (fx.shakeSeq) fx.shakeSeq.forEach(([d, lvl]) => later(d, () => setShake(lvl)));
  };

  const enterScene = (s, instant = false) => {
    const sc = SCENES[s];
    const a = audioRef.current;
    const layer = { id: ++layerSeq.current, scene: s, fade: instant ? 0 : sc.enter.dur, instant };
    setLayers((prev) => [...(instant ? [] : prev.slice(-1)), layer]);
    setTitleScene(s);
    setTitleKey((k) => k + 1);
    modeRef.current = PARTICLES[sc.particles] || PARTICLES.none;
    setShake(sc.shake || 0);
    if (a) {
      a.mood(sc.mood, sc.moodSec || 3);
      a.melody(!!sc.melody);
    }
    if (!instant) later(sc.enter.dur + 300, () => setLayers((prev) => prev.slice(-1)));
    runFx(sc.enterFx);
  };

  /* ─────────── flow control */
  const swapLine = (s, l) => {
    lockRef.current = true;
    setPanelOn(false);
    const gap = SCENES[s].lines[l].gapBefore || 0;
    later(PANEL_OUT + gap, () => {
      setCursor({ s, l });
      setPanelOn(true);
      lockRef.current = false;
    });
  };

  const changeScene = (s) => {
    lockRef.current = true;
    setPanelOn(false);
    const sc = SCENES[s];
    later(PANEL_OUT, () => enterScene(s));
    later(PANEL_OUT + sc.enter.firstLineDelay, () => {
      setCursor({ s, l: 0 });
      setPanelOn(true);
      lockRef.current = false;
    });
  };

  const goEnding = () => {
    if (endingRef.current) return;
    endingRef.current = true;
    finaleRef.current = true;
    lockRef.current = true;
    clearTimeout(autoRef.current);
    setPanelOn(false);
    setFade((f) => ({ mode: 'outro', key: f.key + 1 }));
    audioRef.current?.fadeOut(4.5);
    later(FADE_OUT + 200, () => {
      setPhaseBoth('ending');
      setFade((f) => ({ mode: 'none', key: f.key + 1 }));
      setLayers([]);
      setFinalGlow(false);
      setShake(0);
      modeRef.current = PARTICLES.none;
    });
  };

  const finale = () => {
    lockRef.current = true;
    finaleRef.current = true;
    clearTimeout(autoRef.current);
    setPanelOn(false);
    setFinalGlow(true);
    audioRef.current?.mood('peak', 4);
    later(PANEL_OUT + FINAL_HOLD, goEnding);
  };

  const next = () => {
    clearTimeout(autoRef.current);
    if (lockRef.current || phaseRef.current !== 'play' || finaleRef.current) return;
    const { s, l } = cursorRef.current;
    if (l + 1 < SCENES[s].lines.length) swapLine(s, l + 1);
    else if (s + 1 < SCENES.length) changeScene(s + 1);
    else finale();
  };

  const advance = () => {
    if (lockRef.current || phaseRef.current !== 'play' || finaleRef.current) return;
    if (statusRef.current === 'typing') {
      finishRef.current?.();
      return;
    }
    if (statusRef.current !== 'ready') return;
    if (performance.now() - readyAtRef.current < COOLDOWN) return;
    next();
  };

  const skip = () => {
    if (phaseRef.current !== 'play') return;
    if (finaleRef.current) {
      goEnding();
      return;
    }
    if (lockRef.current) return;
    if (statusRef.current === 'typing') {
      finishRef.current?.();
      return;
    }
    clearTimeout(autoRef.current);
    const { s } = cursorRef.current;
    if (s + 1 < SCENES.length) changeScene(s + 1);
    else finale();
  };

  const startSequence = () => {
    clearTimers();
    runRef.current += 1;
    lockRef.current = true;
    finaleRef.current = false;
    endingRef.current = false;
    finishRef.current = null;
    setStatus('idle');
    setPhaseBoth('play');
    setPanelOn(false);
    setTyped('');
    setFinalGlow(false);
    setShake(0);
    setPulseKey(0);
    setCursor({ s: 0, l: 0 });
    setFade((f) => ({ mode: 'intro', key: f.key + 1 })); // CSS animation fades black away on its own
    const a = getAudio();
    a.setMuted(mutedRef.current);
    a.start();
    enterScene(0, true);
    later(FIRST_LINE_DELAY, () => {
      setPanelOn(true);
      lockRef.current = false;
    });
  };

  const toggleMute = () => {
    const v = !mutedRef.current;
    mutedRef.current = v;
    setMutedState(v);
    audioRef.current?.setMuted(v);
  };

  const finishAndContinue = () => (onComplete || onClose)?.();

  apiRef.current = { advance, skip, next };

  /* ─────────── typewriter (per line) */
  useEffect(() => {
    if (phase !== 'play' || !panelOn) return undefined;
    const line = SCENES[cursor.s].lines[cursor.l];
    const full = lineText(line);
    const plan = buildPlan(line, reduced);
    let k = 0;
    let id = 0;
    let acc = '';

    setTyped('');
    setStatus('typing');
    runFx(line.fx);

    const finish = () => {
      clearTimeout(id);
      finishRef.current = null;
      setTyped(full);
      setStatus('ready');
      readyAtRef.current = performance.now();
      clearTimeout(autoRef.current);
      autoRef.current = later(line.autoNext ?? DEFAULT_HOLD, () => apiRef.current.next());
    };
    finishRef.current = finish;

    const tick = () => {
      if (!aliveRef.current) return;
      acc += plan[k].ch;
      setTyped(acc);
      k += 1;
      if (k >= plan.length) {
        finish();
        return;
      }
      id = setTimeout(tick, plan[k].delay);
    };
    id = setTimeout(tick, plan[0].delay);

    return () => {
      clearTimeout(id);
      finishRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, panelOn, cursor, reduced]);

  /* ─────────── keyboard: Space / Enter / → advance (Escape intentionally unused) */
  useEffect(() => {
    const onKey = (e) => {
      if (phaseRef.current !== 'play') return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        if (e.target instanceof HTMLElement && e.target.closest('button')) return;
        e.preventDefault();
        if (e.repeat) return;
        apiRef.current.advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ─────────── 3D rig + depth particles (single rAF loop) */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const c = canvas.getContext('2d');
    if (!c) return undefined;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const sm = { x: 0, y: 0 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    };
    resize();
    const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    window.addEventListener('resize', resize);

    const rnd = (a, b) => a + Math.random() * (b - a);
    const pool = [];
    for (let i = 0; i < 64; i++) {
      pool.push({
        kind: 'mote',
        x: rnd(0, w || 800),
        y: rnd(0, h || 600),
        z: rnd(0.3, 1),
        vx: rnd(-6, 6),
        vy: rnd(-14, -4),
        size: rnd(3, 9),
        ph: rnd(0, TAU),
        a: 0,
        al: rnd(0.35, 0.85),
      });
    }
    for (let i = 0; i < 30; i++) {
      pool.push({
        kind: 'petal',
        x: rnd(0, w || 800),
        y: rnd(0, h || 600),
        z: rnd(0.35, 1),
        vx: rnd(-8, 8),
        vy: rnd(12, 30),
        size: rnd(4, 9),
        ph: rnd(0, TAU),
        rot: rnd(0, TAU),
        vr: rnd(-0.9, 0.9),
        flip: rnd(0, TAU),
        fs: rnd(0.8, 2),
        a: 0,
        col: PETAL_COLORS[i % PETAL_COLORS.length],
      });
    }

    const sprites = {};
    const getSprite = (tone) => {
      if (sprites[tone]) return sprites[tone];
      const s = document.createElement('canvas');
      s.width = 64;
      s.height = 64;
      const sc = s.getContext('2d');
      const gr = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, `rgba(${tone},1)`);
      gr.addColorStop(0.25, `rgba(${tone},.55)`);
      gr.addColorStop(1, `rgba(${tone},0)`);
      sc.fillStyle = gr;
      sc.fillRect(0, 0, 64, 64);
      sprites[tone] = s;
      return s;
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      // depth rig: pointer parallax + slow idle sway
      const p = ptrRef.current;
      sm.x += (p.x - sm.x) * Math.min(1, dt * 3);
      sm.y += (p.y - sm.y) * Math.min(1, dt * 3);
      if (rigRef.current && !reduced) {
        const ix = Math.sin(t * 0.23) * 0.4;
        const iy = Math.cos(t * 0.17) * 0.28;
        rigRef.current.style.transform =
          `perspective(1400px) rotateX(${(-sm.y * 0.9 + iy).toFixed(3)}deg) ` +
          `rotateY(${(sm.x * 1.2 + ix).toFixed(3)}deg) ` +
          `translate3d(${(-sm.x * 7).toFixed(2)}px, ${(-sm.y * 5).toFixed(2)}px, 0)`;
      }

      if (document.hidden || !w) return;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      const cfg = modeRef.current;
      const sprite = getSprite(cfg.tone);
      let mi = 0;
      let pi = 0;

      for (let n = 0; n < pool.length; n++) {
        const q = pool[n];
        const isMote = q.kind === 'mote';
        const idx = isMote ? mi++ : pi++;
        const want = idx < (isMote ? cfg.motes : cfg.petals) ? 1 : 0;
        q.a += (want - q.a) * Math.min(1, dt * 0.9);
        if (q.a < 0.01 && !want) continue;

        q.ph += dt * (0.5 + q.z * 0.5);
        const px = q.x - sm.x * 22 * q.z;
        const py = q.y - sm.y * 14 * q.z;

        if (isMote) {
          q.x += (q.vx + Math.sin(q.ph) * 6) * dt * q.z;
          q.y += q.vy * dt * q.z;
          if (q.y < -20) {
            q.y = h + 20;
            q.x = rnd(0, w);
          }
          const tw = 0.6 + 0.4 * Math.sin(q.ph * 3);
          const s = q.size * (0.6 + q.z) * 2.4;
          c.globalAlpha = q.a * q.al * tw * (0.35 + 0.65 * q.z);
          c.drawImage(sprite, px - s / 2, py - s / 2, s, s);
        } else {
          q.x += (q.vx + Math.sin(q.ph * 1.3) * 18) * dt * q.z;
          q.y += q.vy * dt * q.z;
          q.rot += q.vr * dt;
          q.flip += q.fs * dt;
          if (q.y > h + 30) {
            q.y = -30;
            q.x = rnd(0, w);
          }
          c.save();
          c.translate(px, py);
          c.rotate(q.rot);
          c.scale(1, Math.abs(Math.cos(q.flip)) * 0.85 + 0.15);
          c.globalAlpha = q.a * 0.8 * (0.4 + 0.6 * q.z);
          c.fillStyle = q.col;
          c.beginPath();
          c.ellipse(0, 0, q.size * (0.6 + q.z * 0.6), q.size * 0.5 * (0.6 + q.z * 0.6), 0, 0, TAU);
          c.fill();
          c.restore();
        }
      }
      c.globalAlpha = 1;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  const onPointerMove = (e) => {
    if (e.pointerType === 'touch' || !rootRef.current) return;
    const r = rootRef.current.getBoundingClientRect();
    ptrRef.current = {
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    };
  };
  const onPointerLeave = () => {
    ptrRef.current = { x: 0, y: 0 };
  };

  /* ─────────── render */
  const line = SCENES[cursor.s].lines[cursor.l];
  const speaker = SPEAKERS[line.who];
  const full = lineText(line);
  const topId = layers.length ? layers[layers.length - 1].id : -1;
  const playing = phase === 'play';
  const dlgOn = playing && panelOn;
  const rootClass = [
    'sfj',
    playing ? 'play' : '',
    finalGlow ? 'final' : '',
    phase === 'ending' ? 'is-ending' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const ui = (
    <div
      ref={rootRef}
      className={rootClass}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      role="dialog"
      aria-modal="true"
      aria-label="Sita’s Final Journey"
    >
      {/* the world */}
      <div className={`sfj-shaker ${!reduced && shake ? `shake-${shake}` : ''}`}>
        <div className="sfj-stage">
          <div className="sfj-rig" ref={rigRef}>
            {layers.map((ly) => (
              <CineLayer
                key={ly.id}
                scene={SCENES[ly.scene]}
                fade={ly.fade}
                instant={ly.instant}
                active={ly.id === topId}
                focus={cursor.s === ly.scene ? SCENES[cursor.s].lines[cursor.l].cam || null : null}
                reduced={reduced}
              />
            ))}
          </div>
        </div>
      </div>

      <canvas className="sfj-fx" ref={canvasRef} aria-hidden="true" />
      <div className="sfj-glow" aria-hidden="true" />
      <div className="sfj-vignette" aria-hidden="true" />
      <div className="sfj-grain" aria-hidden="true" />
      {pulseKey > 0 && !reduced && (
        <>
          <div key={`f${pulseKey}`} className="sfj-flash" aria-hidden="true" />
          <div key={`p${pulseKey}`} className="sfj-pulse" aria-hidden="true" />
        </>
      )}
      <div className="sfj-bar top" aria-hidden="true" />
      <div className="sfj-bar bottom" aria-hidden="true" />

      {/* scene title card */}
      {playing && titleKey > 0 && !finalGlow && (
        <div key={`chapter-${titleKey}`} className="sfj-chapter" aria-hidden="true">
          <span>{SCENES[titleScene].numeral}</span>
          <b>{SCENES[titleScene].title}</b>
        </div>
      )}

      {/* dialogue */}
      {playing && (
        <>
          <p className="sfj-sr" aria-live="polite">
            {panelOn ? `${speaker.name}: ${full}` : ''}
          </p>
          <div
            className={`sfj-dlg ${dlgOn ? 'on' : ''} side-${speaker.side || 'center'} style-${line.style || 'normal'}`}
          >
            <div className="sfj-accent" />
            <div className="sfj-dlg-body">
              <div className="sfj-name">
                <i style={{ background: speaker.color }} />
                {speaker.name}
              </div>
              <p className="sfj-text" aria-hidden="true">
                <span>{typed}</span>
                {status === 'typing' && <i className="sfj-caret" />}
                <span className="sfj-ghost">{full.slice(typed.length)}</span>
              </p>
            </div>
            <div className="sfj-actions">
              <button type="button" className="sfj-skip" onClick={skip}>
                Skip
              </button>
              <button
                type="button"
                className={`sfj-continue ${status === 'ready' ? 'ready' : ''}`}
                onClick={advance}
                disabled={status !== 'ready'}
              >
                Continue
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* HUD */}
      <div className="sfj-hud">
        {finalGlow && playing && (
          <button type="button" className="sfj-hud-skip" onClick={skip}>
            Skip
          </button>
        )}
        {playing && (
          <button type="button" className="sfj-icon" onClick={startSequence} aria-label="Replay from the beginning" title="Replay">
            {Icon.replay}
          </button>
        )}
        <button
          type="button"
          className="sfj-icon"
          onClick={toggleMute}
          aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          title={muted ? 'Sound off' : 'Sound on'}
        >
          {muted ? Icon.soundOff : Icon.soundOn}
        </button>
        {onClose && (
          <button type="button" className="sfj-icon" onClick={onClose} aria-label="Close" title="Close">
            {Icon.close}
          </button>
        )}
      </div>

      {/* fade-from / to black */}
      {fade.mode !== 'none' && <div key={`black-${fade.key}`} className={`sfj-black ${fade.mode}`} />}

      {/* overture */}
      {phase === 'overture' && (
        <div className="sfj-overture">
          <div className="sfj-overture-in">
            <small>ANCESTRA — Ramayana</small>
            <em>Chapter XXVI · The Song of Rama</em>
            <h1>Sita’s Final Journey</h1>
            <span className="sfj-rule" />
            <p>You will witness what happened. Nothing here can be changed.</p>
            <button type="button" className="sfj-begin" onClick={startSequence} autoFocus>
              Begin
            </button>
            <small className="sfj-hint">Headphones recommended</small>
          </div>
        </div>
      )}

      {/* ending */}
      {phase === 'ending' && (
        <div className="sfj-ending">
          <div className="sfj-ending-in">
            <h2>SOME TRUTHS WAIT FOR THEIR TIME.</h2>
            <span className="sfj-rule dark" />
            <h3>SITA’S FINAL JOURNEY</h3>
            <div className="sfj-end-actions">
              <button type="button" className="sfj-end-btn" onClick={startSequence}>
                Replay
              </button>
              <button type="button" className="sfj-end-btn primary" onClick={finishAndContinue} autoFocus>
                Continue
              </button>
            </div>
          </div>
          <footer>ANCESTRA — CHAPTER XXVI</footer>
        </div>
      )}
    </div>
  );

  // Render on <body> so no modal frame, transform or overflow can sit over or clip the cinematic.
  return typeof document !== 'undefined' ? createPortal(ui, document.body) : ui;
}