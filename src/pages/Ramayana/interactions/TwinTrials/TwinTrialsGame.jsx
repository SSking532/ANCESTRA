// THE TWIN TRIALS: WISDOM & ARCHERY — Chapter XXIV · Luv and Kush · Uttara Kanda
// Drop-in ANCESTRA game. Needs: react, three, framer-motion, lucide-react.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX, Pause, Play, X, RotateCcw, Crosshair, Hand, ArrowUp } from 'lucide-react';
import { Engine } from './twintrials/engine.js';
import { Sfx } from './twintrials/audio.js';
import { HubScene } from './twintrials/hub.js';
import { Scene1 } from './twintrials/scene1.js';
import { Scene2 } from './twintrials/scene2.js';
import './TwinTrialsGame.css';

const INTRO = [
  { who: 'VALMIKI', text: 'You have spent years learning the scriptures and mastering the disciplines of warriors.' },
  { who: 'VALMIKI', text: 'But knowledge must guide your actions, and strength must be guided by wisdom.' },
  { who: 'VALMIKI', text: 'Today, I have prepared two trials for you. Complete them together, for the greatest strength of two brothers lies not merely in their individual abilities, but in their unity.' },
  { who: 'LUV', text: 'We are ready, Gurudeva.' },
  { who: 'KUSH', text: 'We shall give our best.' },
];
const OUTRO = [
  { who: 'VALMIKI', text: 'Today, you have demonstrated more than skill.' },
  { who: 'VALMIKI', text: 'You have learned that knowledge must guide strength, and patience must guide action.' },
  { who: 'LUV', text: 'We have completed the trials, Gurudeva.' },
  { who: 'KUSH', text: 'Because we faced them together.' },
  { who: 'VALMIKI', text: 'Remember this lesson throughout your lives.' },
];
const INTERLUDE = {
  2: { n: 'LEVEL TWO', t: 'THE TEST OF PRECISION', s: 'Patience draws the bow; attention guides the arrow.' },
};
const WHO = { VALMIKI: 'Sage Valmiki', LUV: 'Luv', KUSH: 'Kush' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(Math.round(n)).padStart(5, '0');

function Emblem({ size = 34 }) {
  return (
    <svg className="tt-emblem" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="24.5" fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="1.2 3" />
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} d="M32 31 C26 25 26 14 32 8 C38 14 38 25 32 31Z" fill="currentColor" opacity={i % 2 ? 0.5 : 0.9} transform={`rotate(${i * 45} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="4" fill="#0000" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
const Divider = ({ className = '' }) => (
  <svg className={`tt-divider ${className}`} viewBox="0 0 320 24" aria-hidden="true">
    <path d="M0 12 H128" stroke="currentColor" strokeWidth="1" /><path d="M192 12 H320" stroke="currentColor" strokeWidth="1" />
    <g transform="translate(160 12)" fill="currentColor">
      <path d="M0 -9 C-5 -4 -5 4 0 9 C5 4 5 -4 0 -9Z" /><path d="M-4 -2 C-11 -7 -17 -2 -17 0 C-17 2 -11 7 -4 2Z" opacity=".75" /><path d="M4 -2 C11 -7 17 -2 17 0 C17 2 11 7 4 2Z" opacity=".75" />
      <circle cx="-26" cy="0" r="1.8" /><circle cx="26" cy="0" r="1.8" />
    </g>
  </svg>
);
const Key = ({ k }) => (k ? <kbd className="tt-key">{k}</kbd> : null);

/* What the player is told BEFORE each challenge starts. */
const BRIEFS = {
  1: {
    eyebrow: 'LEVEL ONE', title: 'THE PATH OF WISDOM',
    lede: 'Three ancient puzzles stand between Luv and the far gateway. Look carefully, think, then act. There is no timer.',
    steps: [
      ['I', 'The Broken Path', 'Walk into the stones to push them into the river; each stone that sinks becomes solid footing. Stand by the plank and press E to rotate it, then cross. If you get stuck, reset the stones.'],
      ['II', 'The Ancient Mechanism', 'In the courtyard, press E beside a pillar to turn it. Turn each pillar until its symbol matches the one on the floor mosaic in its direction. Its gem glows when it is right. The East and South pillars are chained and turn together.'],
      ['III', 'The Final Passage', 'Step on the three pressure plates in order, marked with one, two and three dots, to light the lamps. A wrong order puts the flames out. Ride the moving platforms across the water to the gateway.'],
    ],
    keys: [['WASD', 'Move'], ['E', 'Interact'], ['R', 'Reset stones'], ['Space', 'Jump'], ['Right-drag', 'Look']],
    touchKeys: [['Joystick', 'Move'], ['Use', 'Interact'], ['Reset', 'Reset stones']],
  },
  A: { eyebrow: 'LEVEL TWO · CHALLENGE A', title: 'THE STATIONARY TARGETS', who: 'Luv takes the first shots.', lede: 'Three targets stand at different distances. Take a breath and aim true.' },
  B: { eyebrow: 'LEVEL TWO · CHALLENGE B', title: 'THE MOVING TARGETS', who: 'Kush takes the bow.', lede: 'The targets glide along rails. An arrow takes time to fly, so aim a little ahead of where each target is heading.' },
  C: { eyebrow: 'LEVEL TWO · CHALLENGE C', title: 'THE SEQUENCE', who: 'Luv and Kush take turns.', lede: 'One target at a time glows gold. Strike it before the glow fades (about five seconds). A target you let expire is lost, and a quicker strike earns a bigger bonus.' },
};
const ARCHERY_STEPS = [
  ['Aim', 'Move the mouse to place the reticle on a target.', 'Drag on the screen to place the reticle on a target.'],
  ['Draw', 'Hold the left button to draw the bow. A fuller, steadier draw flies truer; hold too long and the arms tire and shake.', 'Hold SHOOT to draw the bow. A fuller, steadier draw flies truer; hold too long and the arms tire and shake.'],
  ['Loose', 'Release the button to shoot. The inner rings score the most.', 'Release SHOOT to loose the arrow. The inner rings score the most.'],
];

function CrashCard({ onRetry, onExit, msg }) {
  return (
    <div className="tt-crash">
      <div className="tt-crash-in">
        <Emblem size={46} />
        <h2>THE TRIAL COULD NOT CONTINUE</h2>
        <Divider />
        <p>Something went wrong while preparing the hermitage. Your device may have run short of graphics memory. You can try again.</p>
        {msg ? <small>{msg}</small> : null}
        <button className="tt-begin" onClick={onRetry}><span><RotateCcw size={15} /> Try again</span></button>
        <button className="tt-ghost" onClick={onExit}>Return to chapter</button>
      </div>
    </div>
  );
}

/** Catches any React render error so the player gets a recovery card instead of a blank page. */
class TrialsBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null, n: 0 }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('[TwinTrials] render crash', err, info); }
  render() {
    const exit = () => { (this.props.onExit || this.props.onClose || (() => {}))(); };
    if (this.state.err) {
      return <div className="tt-root"><CrashCard msg={String(this.state.err && this.state.err.message || this.state.err)} onExit={exit} onRetry={() => this.setState((s) => ({ err: null, n: s.n + 1 }))} /></div>;
    }
    return <TwinTrialsInner key={this.state.n} {...this.props} />;
  }
}

export default function TwinTrialsGame(props) { return <TrialsBoundary {...props} />; }

function TwinTrialsInner({ onExit, onClose, onComplete }) {
  const exit = useCallback(() => { (onExit || onClose || (() => {}))(); }, [onExit, onClose]);
  const canvasRef = useRef(null), rootRef = useRef(null), engineRef = useRef(null), sfxRef = useRef(null), game = useRef({}), aimEl = useRef(null), tipTimer = useRef(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState('loading'); // loading | title | intro | l1 | l2 | outro | results
  const [hud, setHud] = useState({ level: 0, title: '', progress: { done: 0, total: 3 }, score: 0 });
  const [dlg, setDlg] = useState(null);
  const [floats, setFloats] = useState([]);
  const [banner, setBanner] = useState(null);
  const [cue, setCue] = useState(null);
  const [fade, setFade] = useState(true);
  const [interlude, setInterlude] = useState(null);
  const [titleCard, setTitleCard] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [tip, setTip] = useState(null);
  const [clear, setClear] = useState(null);
  const [fail, setFail] = useState(null);
  const [results, setResults] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [bars, setBars] = useState(false);
  const [brief, setBrief] = useState(null);
  const [crash, setCrash] = useState(null);
  const [building, setBuilding] = useState(false);
  const touch = useMemo(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0), []);
  const onCompleteRef = useRef(onComplete); onCompleteRef.current = onComplete;
  const phaseRef = useRef('loading'); phaseRef.current = phase;
  const pausedRef = useRef(false); pausedRef.current = paused;
  const briefRef = useRef(null); briefRef.current = brief;

  const addFloat = useCallback((f) => {
    const id = Math.random().toString(36).slice(2);
    setFloats((a) => [...a.slice(-5), { ...f, id }]); setTimeout(() => setFloats((a) => a.filter((x) => x.id !== id)), 1900);
  }, []);
  const showCue = useCallback((text) => { setCue({ text, id: Math.random() }); clearTimeout(game.current.cueT); game.current.cueT = setTimeout(() => setCue(null), 2800); }, []);

  /* ---------------------------------------------------------------- engine + game flow */
  useEffect(() => {
    let dead = false, token = 0;
    const canvas = document.createElement('canvas'); canvas.className = 'tt-canvas'; canvas.tabIndex = 0; canvasRef.current && canvasRef.current.appendChild(canvas);
    const engine = new Engine(THREE, canvas, { onFatal: (e) => { if (!dead) { setFade(false); setCrash({ msg: String(e && e.message || e || 'graphics error') }); } } }); engineRef.current = engine;
    const sfx = new Sfx(); sfxRef.current = sfx;
    const totals = { l1: null, l2: null };
    const G = game.current; G.level = 0;

    const say = (lines, opts = {}) => new Promise((res) => setDlg({ lines, i: 0, res, opts }));
    const cb = {
      sfx: (n, o) => sfx.play(n, o),
      onHud: (h) => setHud(h),
      onFloat: addFloat,
      onBanner: (b) => { setBanner({ ...b, id: Math.random() }); clearTimeout(G.bT); G.bT = setTimeout(() => setBanner(null), 3000); },
      onCue: showCue,
      onAim: (a) => {
        const el = aimEl.current; if (!el) return;
        if (a.x === undefined) { el.style.opacity = 0; return; }
        el.style.transform = `translate3d(${a.x}px,${a.y}px,0)`;
        el.style.setProperty('--draw', (a.draw || 0).toFixed(3)); el.style.setProperty('--sway', ((a.sway || 0)).toFixed(1));
        el.dataset.state = a.drawing ? (a.fatigue > 0.2 ? 'tired' : a.draw >= 0.98 ? 'ready' : 'draw') : 'idle'; el.style.opacity = a.active ? 1 : 0.0;
      },
      onChallengeClear: (c) => { if (!c) { setClear(null); return; } setClear(c); clearTimeout(G.cT); G.cT = setTimeout(() => setClear(null), 2900); },
      onChallengeFail: (f) => setFail(f),
      onBrief: (b) => { setBrief(b); setClear(null); setFail(null); },
      onEscape: () => { if (['l1', 'l2'].includes(phaseRef.current)) togglePause(); },
      say,
      onDone: (r) => levelDone(G.level, r),
    };
    const togglePause = () => setPaused((p) => { const n = !p; engine.paused = n; if (n) engine.lmb = false; return n; });
    G.togglePause = togglePause;

    const fadeTo = async (fn) => { setFade(true); await sleep(750); if (dead) return; await fn(); await sleep(120); if (!dead) setFade(false); };

    const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const startLevel = async (n) => {
      G.level = n; setPhase('l' + n); setBars(false); setClear(null); setFail(null); setBanner(null); setDlg(null); setBrief(null); setCrash(null); setPaused(false); engine.paused = false; engine.setLmb(false);
      setFade(true); setBuilding(true); await nextFrame(); if (dead) return false; // let the loading card paint before the heavy build blocks the thread
      try {
        engine.clearScene(); // release the previous scene's GPU memory BEFORE building the next one
        const S = n === 1 ? Scene1 : Scene2; const sc = new S(engine, cb); G.scene = sc; engine.setScene(sc);
        if (!sc.cb) sc.cb = cb;
      } catch (e) {
        console.error('[TwinTrials] could not start level', n, e);
        setBuilding(false); setFade(false); setCrash({ level: n, msg: String(e && e.message || e) }); return false;
      }
      setBuilding(false); setTip(null);
      return true;
    };
    G.startLevel = startLevel;

    const levelDone = async (n, r) => {
      totals['l' + n] = r; setDlg(null);
      if (n < 2) {
        await sleep(300); setInterlude(INTERLUDE[n + 1]); setFade(true); await sleep(900); if (dead) return;
        setBars(false); await sleep(1900); if (dead) return;
        await startLevel(n + 1); if (dead) return; setFade(false); await sleep(1400); setInterlude(null);
      } else await startOutro();
    };

    const startOutro = async () => {
      const my = ++token; setFade(true); await sleep(800); if (dead || my !== token) return;
      setPhase('outro'); setBars(true); setTip(null);
      const sc = new HubScene(engine, 'outro', cb); G.scene = sc; engine.setScene(sc); sc.setShot('valmiki'); setFade(false);
      await sleep(1600);
      const shots = { 0: 'valmiki', 1: 'valmiki', 2: 'luv', 3: 'kush', 4: 'wide' };
      await say(OUTRO, { onLine: (i, l) => { sc.setSpeaker(l.who); sc.setShot(shots[i]); } });
      if (dead || my !== token) return;
      sc.setSpeaker(null); sc.setShot('orbit'); sc.celebrate(); sfx.play('win'); setCompleted(true); await sleep(5200);
      if (dead || my !== token) return;
      const t = totals;
      const res = {
        total: (t.l1 ? t.l1.score : 0) + (t.l2 ? t.l2.score : 0),
        puzzles: 3, accuracy: t.l2 ? t.l2.accuracy : 0, bulls: t.l2 ? t.l2.bulls : 0,
        l1: t.l1 ? t.l1.score : 0, l2: t.l2 ? t.l2.score : 0,
      };
      setResults(res); setPhase('results'); onCompleteRef.current && onCompleteRef.current(res);
    };
    G.startOutro = startOutro;

    const runIntro = async () => {
      const my = ++token; setPhase('intro'); setBars(true); const sc = G.scene;
      sc.setShot('aerial'); await sleep(5200); if (dead || my !== token) return;
      const shots = { 0: 'valmiki', 3: 'luv', 4: 'kush' };
      await say(INTRO, { onLine: (i, l) => { sc.setSpeaker(l.who); if (shots[i]) sc.setShot(shots[i]); } });
      if (dead || my !== token) return;
      sc.setSpeaker(null); sc.setShot('walk'); await sleep(3800); if (dead || my !== token) return;
      setTitleCard(true); sfx.play('conch'); await sleep(4300); if (dead || my !== token) return;
      setFade(true); await sleep(900); setTitleCard(false); setBars(false); await startLevel(1); if (dead || my !== token) return; setFade(false);
    };
    G.begin = () => { sfx.start(); sfx.play('ui'); runIntro(); };
    G.skipIntro = () => { token++; setDlg(null); setTitleCard(false); setFade(true); setTimeout(async () => { if (!dead) { await startLevel(1); if (!dead) setFade(false); } }, 700); };
    G.replay = () => { Object.keys(totals).forEach((k) => { totals[k] = null; }); setResults(null); setCompleted(false); token++; setFade(true); setTimeout(async () => { if (!dead) { await startLevel(1); if (!dead) setFade(false); } }, 800); };
    G.restart = () => { setFade(true); setTimeout(async () => { if (!dead) { await startLevel(G.level); if (!dead) setFade(false); } }, 600); };
    G.retry = () => { setFail(null); G.scene && G.scene.retry && G.scene.retry(); };
    G.beginChallenge = () => { setBrief(null); sfx.play('ui'); G.scene && G.scene.begin && G.scene.begin(); };
    G.recover = () => { setCrash(null); setFade(true); setTimeout(async () => { if (!dead) { await startLevel(G.level || 1); if (!dead) setFade(false); } }, 500); };

    (async () => {
      try { await engine.init(); } catch (e) { console.error('[TwinTrials] WebGL init failed', e); return; }
      if (dead) { engine.dispose(); return; }
      const sc = new HubScene(engine, 'intro', cb); sc.setShot('orbit'); G.scene = sc; engine.setScene(sc);
      setPhase('title'); setReady(true); setFade(false);
    })();
    const ro = new ResizeObserver(() => engine.resize && engine.renderer && engine.resize()); rootRef.current && ro.observe(rootRef.current);
    return () => { dead = true; token++; ro.disconnect(); clearTimeout(G.cueT); clearTimeout(G.bT); clearTimeout(G.cT); clearTimeout(tipTimer.current); try { engine.dispose(); } catch (e) { /* noop */ } try { canvas.remove(); engine.canvas && engine.canvas.remove(); } catch (e) { /* noop */ } sfx.dispose(); };
  }, [addFloat, showCue, touch]);

  useEffect(() => { sfxRef.current && sfxRef.current.setMuted(muted); }, [muted]);
  // safety net: the ivory transition overlay can never stay up for more than ~15s
  useEffect(() => {
    if (!fade || phase === 'loading') return undefined;
    const t = setTimeout(() => { setFade(false); setBuilding(false); }, 15000);
    return () => clearTimeout(t);
  }, [fade, phase]);

  /* ---------------------------------------------------------------- dialogue (typewriter + auto advance) */
  useEffect(() => {
    if (!dlg) return undefined;
    const l = dlg.lines[dlg.i]; if (!l) return undefined;
    dlg.opts.onLine && dlg.opts.onLine(dlg.i, l);
    const ms = Math.max(2800, l.text.length * 62 + 1500), t = setTimeout(() => advance(), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dlg && dlg.i, dlg && dlg.lines]);
  const advance = useCallback(() => {
    setDlg((d) => {
      if (!d) return d;
      if (d.i + 1 < d.lines.length) return { ...d, i: d.i + 1 };
      setTimeout(() => d.res(), 0); return null;
    });
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (briefRef.current && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); game.current.beginChallenge && game.current.beginChallenge(); return; } if (dlg && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); advance(); sfxRef.current && sfxRef.current.play('ui'); } if (e.code === 'Escape' && !['l1', 'l2'].includes(phase)) { /* title / cinematics ignore */ } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [dlg, advance, phase]);

  /* ---------------------------------------------------------------- touch controls */
  const stickRef = useRef(null), knobRef = useRef(null), stickId = useRef(null);
  const onStick = (e, end) => {
    const eng = engineRef.current; if (!eng) return;
    const r = stickRef.current.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (end) { stickId.current = null; eng.setStick(0, 0); knobRef.current.style.transform = 'translate(0,0)'; return; }
    let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    eng.setStick(dx, dy); knobRef.current.style.transform = `translate(${dx * 34}px,${dy * 34}px)`;
  };
  const press = (n) => { engineRef.current && engineRef.current.press(n); };
  const inLevel = ['l1', 'l2'].includes(phase);
  const archeryActive = phase === 'l2';

  /* ---------------------------------------------------------------- render */
  const line = dlg && dlg.lines[dlg.i];
  const prog = hud.progress || { done: 0, total: 3 };
  const progLabel = hud.kind === 'puzzle' ? 'Puzzle' : hud.kind === 'archery' ? 'Challenge' : 'Stage';

  return (
    <div className={`tt-root ${touch ? 'tt-touch' : ''}`} ref={rootRef}>
      <div ref={canvasRef} className="tt-canvas-host" />
      <div className="tt-vignette" />

      {/* cinematic bars */}
      <motion.div className="tt-bar top" animate={{ height: bars ? '9vh' : 0 }} transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }} />
      <motion.div className="tt-bar bottom" animate={{ height: bars ? '9vh' : 0 }} transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }} />

      {/* aim reticle (updated imperatively every frame) */}
      <div className="tt-reticle" ref={aimEl} data-state="idle" style={{ opacity: 0 }}>
        <span className="ring" /><span className="draw" /><span className="dot" /><span className="tk t1" /><span className="tk t2" /><span className="tk t3" /><span className="tk t4" />
      </div>

      {/* HUD */}
      {inLevel && (
        <>
          <div className="tt-hud tl">
            <Emblem />
            <div className="tt-hud-title"><span className="brand">ANCESTRA</span><span className="lvl">{hud.title}</span>{hud.objective ? <span className="obj">{hud.objective}</span> : null}</div>
          </div>
          <div className="tt-hud tr">
            <div className="tt-stat"><span className="lab">{progLabel}</span>
              <span className="pips">{Array.from({ length: prog.total }).map((_, i) => <i key={i} className={i < prog.done ? 'on' : ''} />)}</span></div>
            <div className="tt-stat"><span className="lab">Score</span><span className="val">{pad(hud.score || 0)}</span></div>
            {hud.arrows && hud.arrows.max > 0 && (
              <div className="tt-stat arrows"><span className="lab">Arrows</span>
                <span className="quiver">{Array.from({ length: hud.arrows.max }).map((_, i) => <svg key={i} viewBox="0 0 8 28" className={i < hud.arrows.left ? 'on' : ''}><path d="M4 0 L7 7 H5 V24 L7 28 H1 L3 24 V7 H1Z" fill="currentColor" /></svg>)}</span>
                {hud.hits && hud.hits.of ? <span className="hits">{hud.hits.n} / {hud.hits.need}</span> : null}</div>
            )}
            <div className="tt-tools">
              <button aria-label="Sound" onClick={() => setMuted((m) => !m)}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
              <button aria-label="Pause" onClick={() => game.current.togglePause()}><Pause size={16} /></button>
              <button aria-label="Exit" onClick={exit}><X size={16} /></button>
            </div>
          </div>

          {/* contextual hint (bottom) */}
          <AnimatePresence>
            {hud.hint && !dlg && !brief && (
              <motion.div key={hud.hint.text} className="tt-hint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.25 }}>
                {!touch && <Key k={hud.hint.key} />}<span>{hud.hint.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>{tip && !dlg && !hud.hint && !brief && (<motion.div className="tt-tip" initial={{ opacity: 0 }} animate={{ opacity: 0.95 }} exit={{ opacity: 0 }}>{tip}</motion.div>)}</AnimatePresence>
          <AnimatePresence>{cue && (<motion.div key={cue.id} className="tt-cue" initial={{ opacity: 0, y: -8, letterSpacing: '0.4em' }} animate={{ opacity: 1, y: 0, letterSpacing: '0.18em' }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>{cue.text}</motion.div>)}</AnimatePresence>
          <AnimatePresence>
            {banner && (
              <motion.div key={banner.id} className="tt-banner" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6 }}>
                <span className="k">CHALLENGE {banner.key}</span><h3>{banner.title}</h3><Divider /><span className="s">{banner.arrows} arrows · {banner.need === banner.of ? `strike all ${banner.of}` : `strike ${banner.need} of ${banner.of}`}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {clear && (
              <motion.div className="tt-clear" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <span className="k">Challenge {clear.key} complete</span><span className="v">+{clear.score}</span>{clear.arrowsLeft > 0 && <span className="s">{clear.arrowsLeft} arrows to spare · +{clear.bonus}</span>}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {fail && (
              <motion.div className="tt-fail" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <span className="k">{fail.hits} of {fail.need} targets struck</span>
                <p>Steady your breath, and let the arrow leave on its own.</p>
                <button onClick={() => game.current.retry()}><RotateCcw size={14} /> Retry challenge {!touch && <Key k="R" />}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* floating score / message text */}
      <div className="tt-floats">{floats.map((f) => <span key={f.id} className={`tt-float ${f.kind}`} style={{ left: f.x, top: f.y }}>{f.text}</span>)}</div>

      {/* subtitles (dialogue) */}
      <AnimatePresence>
        {line && (
          <motion.div className="tt-sub" key={dlg.i + line.text} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} onClick={advance}>
            <span className={`who ${line.who.toLowerCase()}`}>{WHO[line.who] || line.who}</span>
            <p>{line.text.split('').map((c, i) => <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.022, duration: 0.2 }}>{c}</motion.span>)}</p>
            <em>{touch ? 'tap' : 'space'} ›</em>
          </motion.div>
        )}
      </AnimatePresence>
      {phase === 'intro' && !titleCard && <button className="tt-skip" onClick={() => game.current.skipIntro()}>Skip ›</button>}

      {/* title screen */}
      <AnimatePresence>
        {phase === 'title' && ready && (
          <motion.div className="tt-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }}>
            <div className="tt-start-in">
              <span className="chap">CHAPTER XXIV · UTTARA KANDA</span>
              <h1><span>THE TWIN TRIALS</span></h1>
              <Divider className="big" />
              <h2>WISDOM &amp; ARCHERY</h2>
              <p className="lede">In Valmiki's hermitage, Luv and Kush face two trials — of mind and of hand.</p>
              <button className="tt-begin" onClick={() => game.current.begin()}><span>Begin the Trials</span></button>
              <small>{touch ? 'Best in landscape · headphones recommended' : 'Mouse + keyboard · sound recommended'}</small>
              <button className="tt-ghost" onClick={exit}>Return to chapter</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* title card at the end of the intro */}
      <AnimatePresence>
        {titleCard && (
          <motion.div className="tt-titlecard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            <motion.h1 initial={{ letterSpacing: '0.7em', filter: 'blur(14px)', opacity: 0 }} animate={{ letterSpacing: '0.22em', filter: 'blur(0px)', opacity: 1 }} transition={{ duration: 2.4, ease: 'easeOut' }}>THE TWIN TRIALS</motion.h1>
            <motion.div initial={{ opacity: 0, scaleX: 0.3 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 1, duration: 1.4 }}><Divider className="big" /></motion.div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 1.2 }}>WISDOM &amp; ARCHERY</motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* interlude between levels */}
      <AnimatePresence>
        {interlude && (
          <motion.div className="tt-interlude" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.9 } }}>
            <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>{interlude.n}</motion.span>
            <motion.h2 initial={{ opacity: 0, letterSpacing: '0.5em' }} animate={{ opacity: 1, letterSpacing: '0.18em' }} transition={{ delay: 0.6, duration: 1.4 }}>{interlude.t}</motion.h2>
            <Divider /><motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>{interlude.s}</motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* completion banner + results */}
      <AnimatePresence>
        {completed && phase === 'outro' && (
          <motion.div className="tt-complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }}>
            <h1>THE TWIN TRIALS COMPLETED</h1><Divider className="big" /><h2>WISDOM. PRECISION.</h2>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {phase === 'results' && results && (
          <motion.div className="tt-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            <div className="tt-results-in">
              <span className="chap">CHAPTER XXIV · COMPLETE</span>
              <h1>THE TWIN TRIALS COMPLETED</h1><Divider className="big" /><h2>WISDOM. PRECISION.</h2>
              <div className="stats">
                <div><span>Total score</span><b>{results.total.toLocaleString()}</b></div>
                <div><span>Puzzle completion</span><b>{results.puzzles} / 3</b></div>
                <div><span>Archery accuracy</span><b>{Math.round(results.accuracy * 100)}%</b><small>{results.bulls} bullseyes</small></div>
              </div>
              <div className="split"><span>I · Wisdom <b>{results.l1}</b></span><span>II · Precision <b>{results.l2}</b></span></div>
              <div className="acts"><button className="tt-begin" onClick={() => game.current.replay()}><span><RotateCcw size={15} /> Replay</span></button><button className="tt-ghost" onClick={exit}>Return to chapter</button></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* pause menu */}
      <AnimatePresence>
        {paused && (
          <motion.div className="tt-pause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div><span className="chap">PAUSED</span>
              <button className="tt-begin" onClick={() => game.current.togglePause()}><span><Play size={15} /> Resume</span></button>
              <button className="tt-ghost" onClick={() => { game.current.restart(); }}>Restart this trial</button>
              <button className="tt-ghost" onClick={() => setMuted((m) => !m)}>{muted ? 'Sound off' : 'Sound on'}</button>
              <button className="tt-ghost" onClick={exit}>Return to chapter</button></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* briefing shown before each challenge */}
      <AnimatePresence>
        {brief && inLevel && !crash && (() => {
          const B = BRIEFS[brief.level === 1 ? 1 : brief.key] || BRIEFS.A;
          return (
            <motion.div key={'brief' + (brief.key || brief.level)} className="tt-brief" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
              <div className="tt-brief-in">
                <span className="chap">{B.eyebrow}</span>
                <h2>{B.title}</h2><Divider />
                {B.who ? <span className="who-line">{B.who}</span> : null}
                <p className="lede">{B.lede}</p>
                {brief.level === 1 ? (
                  <ol className="tt-steps-list">
                    {B.steps.map(([n, t, d]) => <li key={n}><b>{n}</b><div><strong>{t}</strong><span>{d}</span></div></li>)}
                  </ol>
                ) : (
                  <>
                    <ol className="tt-steps-list">
                      {ARCHERY_STEPS.map(([t, d, dt], i) => <li key={t}><b>{i + 1}</b><div><strong>{t}</strong><span>{touch ? dt : d}</span></div></li>)}
                    </ol>
                    <div className="tt-goal"><span>YOUR GOAL</span>{brief.need === brief.of ? `Strike all ${brief.of} targets` : `Strike ${brief.need} of ${brief.of} targets`} using {brief.arrows} arrows</div>
                  </>
                )}
                {brief.level === 1 ? (
                  <div className="tt-keys">{(touch ? B.touchKeys : B.keys).map(([k, a]) => <span key={k}><kbd className="tt-key">{k}</kbd>{a}</span>)}</div>
                ) : null}
                <button className="tt-begin" onClick={() => game.current.beginChallenge()}><span>{brief.level === 1 ? 'I understand · Begin' : 'Ready · Begin'}</span></button>
                {!touch && <small>or press Enter / Space</small>}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* recovery card: replaces the old blank screen if a level fails to load or the GPU gives up */}
      {crash && <CrashCard msg={crash.msg} onRetry={() => game.current.recover()} onExit={exit} />}

      {/* fade-to-ivory transition */}
      <motion.div className="tt-fade" initial={false} animate={{ opacity: fade ? 1 : 0 }} transition={{ duration: 0.75 }} style={{ pointerEvents: fade ? 'auto' : 'none' }}>
        {(phase === 'loading' || building) && <div className="tt-loading"><Emblem size={54} /><span>{building ? 'Preparing the trial…' : 'Preparing the hermitage…'}</span></div>}
      </motion.div>

      {/* mobile controls */}
      {touch && inLevel && !dlg && !paused && !brief && (
        <div className="tt-pad">
          <div className="tt-stick" ref={stickRef}
            onPointerDown={(e) => { stickId.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); onStick(e); }}
            onPointerMove={(e) => { if (stickId.current === e.pointerId) onStick(e); }}
            onPointerUp={(e) => onStick(e, true)} onPointerCancel={(e) => onStick(e, true)}>
            <span ref={knobRef} className="knob" />
          </div>
          <div className="tt-btns">
            {phase !== 'l2' && <button onClick={() => press('interact')}><Hand size={20} /><span>Use</span></button>}
            {phase !== 'l2' && <button onClick={() => press('jump')}><ArrowUp size={20} /><span>Jump</span></button>}
            {phase === 'l1' && <button onClick={() => press('reset')}><RotateCcw size={18} /><span>Reset</span></button>}
            {archeryActive && (
              <button className="shoot" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); engineRef.current.setLmb(true); }} onPointerUp={() => engineRef.current.setLmb(false)} onPointerCancel={() => engineRef.current.setLmb(false)}>
                <Crosshair size={24} /><span>Shoot</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}