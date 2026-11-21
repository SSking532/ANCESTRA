import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, X, Volume2, VolumeX, RotateCcw, Pause } from 'lucide-react';
import './LuvKushGame.css';

/* ────────────────────────────────────────────────────────────────
   LUV & KUSH — pure cinematic slideshow, zero text.
   • 91 images × 2s = 182s, locked to the audio clock (3:02)
   • 11 different 3D transitions (cube, flip, door, iris, shutter…)
   • Ken-Burns camera move on every image
   • Audio-reactive bass pulse, light leaks, gold embers, film grain
   Props: images[] (array of URLs), onComplete(), onExit(), audioSrc
   ──────────────────────────────────────────────────────────────── */

const SLIDE_SEC = 2;
const PRELOAD_AHEAD = 5;
const KB_VARIANTS = 6;
const TX = ['cubeL', 'zoom', 'iris', 'cubeU', 'door', 'shutter', 'flip', 'diag', 'cubeR', 'depth', 'spin'];
const txFor = (i) => (i === 0 ? 'intro' : TX[(i * 7) % TX.length]);

/* every image is shown in full (never cropped) over a blurred copy of itself */
const decideFit = () => 'contain';

/* ───────── single slide ───────── */
function Slide({ src, idx, role, tx, fit, onFit, onBad, onDone }) {
  return (
    <div
      className={`lk-slide is-${role} tx-${tx} fit-${fit}`}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && role === 'out') onDone();
      }}
    >
      <div className="lk-slide__bg" style={{ backgroundImage: `url("${src}")` }} />
      <div className={`lk-slide__kb kb-${idx % KB_VARIANTS}`}>
        <img
          className="lk-slide__img"
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          onLoad={(e) => onFit(idx, e.currentTarget)}
          onError={() => onBad(idx, src)}
        />
      </div>
      <div className="lk-slide__shade" />
    </div>
  );
}

/* ───────── gold ember particles (canvas) ───────── */
function Embers({ pulseRef }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    const resize = () => {
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext('2d');
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,244,210,1)');
    g.addColorStop(0.25, 'rgba(255,204,112,.85)');
    g.addColorStop(1, 'rgba(255,160,50,0)');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);

    const N = Math.round(Math.min(120, 40 + w / 16));
    const ps = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.25 + Math.random() * 0.75,
      s: 0.05 + Math.random() * 0.12,
      ph: Math.random() * 6.28,
    }));

    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = pulseRef.current || 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const q of ps) {
        q.y -= dt * q.s * (0.6 + q.z) * (1 + p * 2.2);
        q.x += Math.sin(now / 1600 + q.ph) * dt * 0.02;
        if (q.y < -0.05) {
          q.y = 1.05;
          q.x = Math.random();
        }
        const r = (6 + q.z * 26) * (1 + p * 0.6);
        ctx.globalAlpha = Math.min(1, (0.25 + q.z * 0.55) * (0.6 + Math.sin(now / 500 + q.ph) * 0.4) * (0.7 + p * 0.8));
        ctx.drawImage(sprite, q.x * w - r / 2, q.y * h - r / 2, r, r);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [pulseRef]);
  return <canvas ref={ref} className="lk-embers" />;
}

/* ───────── main component ───────── */
export default function LuvKushGame({ onComplete, onExit, images = [], audioSrc = '/audio/luvkush.mp3' }) {
  const n = images.length;

  const [phase, setPhase] = useState('loading'); // loading | ready | playing | ended
  const [s, setS] = useState({ cur: 0, prev: null });
  const [fits, setFits] = useState({});
  const [run, setRun] = useState(0);
  const [paused, setPaused] = useState(false);
  const [outro, setOutro] = useState(false);
  const [muted, setMuted] = useState(false);
  const [uiOn, setUiOn] = useState(true);

  const rootRef = useRef(null);
  const audioRef = useRef(null);
  const progRef = useRef(null);
  const pulseRef = useRef(0);
  const ctxRef = useRef(null);
  const anRef = useRef(null);
  const gainRef = useRef(null);
  const dataRef = useRef(null);
  const loadedRef = useRef(new Map());
  const goodRef = useRef(null); // last image that loaded OK (fallback for broken files)
  const idxRef = useRef(0);
  const clockRef = useRef(0);
  const pausedRef = useRef(false);
  const outroRef = useRef(false);
  const failedRef = useRef(false);
  const startingRef = useRef(false);
  const uiTimer = useRef(0);
  const doneTimer = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const onExitRef = useRef(onExit);
  onCompleteRef.current = onComplete;
  onExitRef.current = onExit;

  /* preload window — keeps memory low even with 91 big images */
  const ensureAhead = useCallback(
    (idx) => {
      const map = loadedRef.current;
      for (let k = idx; k <= Math.min(n - 1, idx + PRELOAD_AHEAD); k++) {
        if (!map.has(k)) {
          const im = new Image();
          im.decoding = 'async';
          im.src = images[k];
          map.set(k, im);
        }
      }
      for (const key of map.keys()) if (key < idx - 1) map.delete(key);
    },
    [images, n]
  );

  const [broken, setBroken] = useState({});
  const onBad = useCallback((i, src) => {
    // a missing file must never show a broken-image icon: reuse the last good image
    if (goodRef.current && src !== goodRef.current) setBroken((b) => (b[i] ? b : { ...b, [i]: true }));
  }, []);
  const srcOf = (i) => (broken[i] && goodRef.current ? goodRef.current : images[i]);

  const onFit = useCallback((i, img) => {
    if (!img.naturalWidth) return;
    goodRef.current = img.currentSrc || img.src;
    const mode = decideFit(img);
    setFits((f) => (f[i] === mode ? f : { ...f, [i]: mode }));
  }, []);

  const clearPrev = useCallback(() => setS((st) => (st.prev === null ? st : { ...st, prev: null })), []);

  /* WebAudio analyser (bass pulse) — only after a user gesture is available */
  const setupAnalyser = useCallback(() => {
    if (ctxRef.current) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const src = ctx.createMediaElementSource(audioRef.current);
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      an.smoothingTimeConstant = 0.78;
      const gain = ctx.createGain();
      gain.gain.value = 1;
      src.connect(an);
      src.connect(gain);
      gain.connect(ctx.destination);
      ctxRef.current = ctx;
      anRef.current = an;
      gainRef.current = gain;
      dataRef.current = new Uint8Array(an.frequencyBinCount);
    } catch (e) {
      /* analyser is optional */
    }
  }, []);

  const startPlayback = useCallback(
    async (fromGesture = false) => {
      const a = audioRef.current;
      if (!a || startingRef.current) return;
      startingRef.current = true;
      const begin = () => {
        idxRef.current = 0;
        clockRef.current = 0;
        outroRef.current = false;
        setOutro(false);
        setPaused(false);
        pausedRef.current = false;
        setS({ cur: 0, prev: null });
        setRun((r) => r + 1);
        setPhase('playing');
      };
      try {
        if (fromGesture || navigator.userActivation?.hasBeenActive) setupAnalyser();
        const ctx = ctxRef.current;
        if (ctx) {
          await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
          if (ctx.state !== 'running' && !fromGesture) {
            setPhase('ready');
            startingRef.current = false;
            return;
          }
        }
        a.currentTime = 0;
        await a.play();
        begin();
      } catch (e) {
        if (fromGesture) {
          failedRef.current = true; // audio unavailable → run silently on an internal clock
          begin();
        } else {
          setPhase('ready');
        }
      }
      startingRef.current = false;
    },
    [setupAnalyser]
  );

  /* boot: preload first frames, then try autoplay */
  useEffect(() => {
    let alive = true;
    ensureAhead(0);
    const first = [0, 1, 2].map((i) => loadedRef.current.get(i)).filter(Boolean);
    const waits = first.map(
      (im) =>
        new Promise((res) => {
          if (im.complete) res();
          else im.onload = im.onerror = res;
        })
    );
    Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 6000))]).then(() => {
      if (alive) startPlayback(false);
    });
    if (n === 0) console.warn('[LuvKushGame] No images were passed in via the `images` prop.');
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* master loop — slide index is driven by the audio clock */
  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const a = audioRef.current;
    const root = rootRef.current;
    let raf = 0;
    let last = performance.now();
    let pulse = 0;
    let finished = false;

    const finish = () => {
      setPhase('ended');
      doneTimer.current = setTimeout(() => onCompleteRef.current?.(), 1900);
    };

    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const failed = failedRef.current;
      let t;
      if (!failed) t = a.currentTime;
      else {
        if (!pausedRef.current) clockRef.current += dt;
        t = clockRef.current;
      }
      const dur = !failed && Number.isFinite(a.duration) && a.duration > 0 ? a.duration : Math.max(n, 1) * SLIDE_SEC;

      const idx = n ? Math.min(n - 1, Math.floor(t / SLIDE_SEC)) : 0;
      if (idx !== idxRef.current) {
        idxRef.current = idx;
        setS((st) => (st.cur === idx ? st : { cur: idx, prev: st.cur }));
        ensureAhead(idx);
      }

      let raw;
      const an = anRef.current;
      if (an && dataRef.current && !pausedRef.current) {
        an.getByteFrequencyData(dataRef.current);
        let sum = 0;
        for (let i = 1; i < 8; i++) sum += dataRef.current[i];
        raw = Math.pow(sum / 7 / 255, 1.6);
      } else {
        raw = pausedRef.current ? 0 : 0.18 + 0.12 * Math.sin(t * 2.4);
      }
      pulse = Math.max(raw, pulse * 0.9);
      pulseRef.current = pulse;
      root.style.setProperty('--pulse', pulse.toFixed(3));
      if (progRef.current) progRef.current.style.transform = `scaleX(${Math.min(1, t / dur)})`;

      if (!outroRef.current && t > dur - 1.6) {
        outroRef.current = true;
        setOutro(true);
      }
      if (!finished && (a.ended || t >= dur - 0.03)) {
        finished = true;
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, n, ensureAhead]);

  /* controls */
  const togglePause = useCallback(() => {
    const a = audioRef.current;
    if (phase !== 'playing') return;
    if (pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
      if (!failedRef.current) a.play().catch(() => {});
    } else {
      pausedRef.current = true;
      setPaused(true);
      if (!failedRef.current) a.pause();
    }
  }, [phase]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (gainRef.current) gainRef.current.gain.value = next ? 0 : 1;
      else if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  const replay = useCallback(() => {
    clearTimeout(doneTimer.current);
    startPlayback(true);
  }, [startPlayback]);

  const poke = useCallback(() => {
    setUiOn(true);
    clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => setUiOn(false), 2600);
  }, []);

  const onPointerMove = (e) => {
    poke();
    if (e.pointerType !== 'mouse') return;
    const r = rootRef.current;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    r.style.setProperty('--rx', `${(x * 1.4).toFixed(2)}deg`);
    r.style.setProperty('--ry', `${(-y * 1).toFixed(2)}deg`);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onExitRef.current?.();
      else if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'm' || e.key === 'M') toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause, toggleMute]);

  /* cleanup */
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      clearTimeout(uiTimer.current);
      clearTimeout(doneTimer.current);
      try {
        audio?.pause();
        ctxRef.current?.close();
      } catch (e) {
        /* noop */
      }
    };
  }, []);

  const { cur, prev } = s;
  const txCur = txFor(cur);
  const playing = phase === 'playing';
  const rootClass = [
    'lk-root',
    playing || phase === 'ended' ? 'is-playing' : '',
    phase === 'ended' ? 'is-ended' : '',
    paused ? 'is-paused' : '',
    outro ? 'is-outro' : '',
    uiOn || !playing ? 'ui-on' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div ref={rootRef} className={rootClass} onPointerMove={onPointerMove} onClick={playing ? togglePause : undefined}>
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        playsInline
        onError={() => {
          failedRef.current = true;
        }}
      />

      {/* 3D stage */}
      <div className="lk-persp">
        <div className="lk-tilt">
          <div className="lk-pulse">
            {n > 0 && prev !== null && (
              <Slide
                key={`${run}-${prev}`}
                src={srcOf(prev)}
                idx={prev}
                role="out"
                tx={txCur}
                fit={fits[prev] || 'contain'}
                onFit={onFit}
                onBad={onBad}
                onDone={clearPrev}
              />
            )}
            {n > 0 && (
              <Slide
                key={`${run}-${cur}`}
                src={srcOf(cur)}
                idx={cur}
                role="in"
                tx={txCur}
                fit={fits[cur] || 'contain'}
                onFit={onFit}
                onBad={onBad}
                onDone={clearPrev}
              />
            )}
          </div>
        </div>
      </div>

      {/* atmosphere */}
      <div className="lk-leaks" />
      <Embers pulseRef={pulseRef} />
      {playing && cur > 0 && <div key={`f${run}-${cur}`} className="lk-flash" />}
      <div className="lk-vignette" />
      <div className="lk-grain" />
      <div className="lk-bar lk-bar--top" />
      <div className="lk-bar lk-bar--bottom" />
      <div className="lk-fade" />

      <div className="lk-progress">
        <div ref={progRef} className="lk-progress__bar" />
      </div>

      {/* gate: loader / play / replay (icons only) */}
      {phase === 'loading' && (
        <div className="lk-gate">
          <div className="lk-loader" />
        </div>
      )}
      {phase === 'ready' && (
        <div className="lk-gate">
          <button className="lk-play" aria-label="Play" onClick={stop(() => startPlayback(true))}>
            <span className="lk-play__ring" />
            <span className="lk-play__ring lk-play__ring--2" />
            <Play size={44} fill="currentColor" strokeWidth={0} />
          </button>
        </div>
      )}
      {phase === 'ended' && !onComplete && (
        <div className="lk-gate lk-gate--end">
          <button className="lk-play" aria-label="Replay" onClick={stop(replay)}>
            <span className="lk-play__ring" />
            <RotateCcw size={40} strokeWidth={1.6} />
          </button>
        </div>
      )}
      {paused && (
        <div className="lk-pausemark">
          <Play size={72} fill="currentColor" strokeWidth={0} />
        </div>
      )}

      {/* quiet controls — appear on movement */}
      <div className="lk-ui">
        {playing && (
          <>
            <button className="lk-btn" aria-label={paused ? 'Resume' : 'Pause'} onClick={stop(togglePause)}>
              {paused ? <Play size={18} fill="currentColor" strokeWidth={0} /> : <Pause size={18} fill="currentColor" strokeWidth={0} />}
            </button>
            <button className="lk-btn" aria-label={muted ? 'Unmute' : 'Mute'} onClick={stop(toggleMute)}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </>
        )}
        {onExit && (
          <button className="lk-btn" aria-label="Close" onClick={stop(() => onExit())}>
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}