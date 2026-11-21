import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  Hand,
  Mountain,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Waves,
  X,
} from "lucide-react";
import RamSetuScene from "./RamSetuScene";
import {
  DEVANAGARI_FONT,
  RAM,
  buildAssets,
  buildHeroMaterials,
  disposeAssets,
  disposeHero,
  loadFonts,
} from "./ramSetuAssets";
import { createRamSetuAudio } from "./ramSetuAudio";
import "./RamSetuGame.css";

/* The bridge is shown *being built*: the game ends mid-construction. */
const GOAL = 12; // stones the player places before the finale begins
const MAX_SLOTS = 22; // the Vanaras keep working during the finale
const CANVAS_W = 720;
const CANVAS_H = 420;
const INK = "#b1300f";

/* Sound played whenever a stone drops into the water (file lives in public/audio) */
const DROP_SOUND_SRC = "/audio/hanuman.mp3";

const SHOTS = [
  "Shoreline",
  "Along the Setu",
  "Waterline",
  "Follow the builder",
  "From above",
  "Facing the shore",
];
const AUTO_ORDER = [0, 1, 3, 2, 5, 4];

const MILESTONES = {
  1: "The first stone, bearing His name, floats upon the sea.",
  3: "Stone by stone, the Vanaras raise the Setu.",
  5: "Every stone carries the name of Rama, and none will sink.",
  7: "The bridge reaches farther across the waves.",
  9: "The golden shore of Lanka glimmers in the distance.",
  11: "One more stone, and the work will be well begun.",
};

const FIRST_CAPTIONS = [
  { k: "THE FIRST STONE", h: "A name is written.", p: "Rama’s name rests upon the stone." },
  { k: "THE OFFERING", h: "A stone rises.", p: "Carried by devotion, not by weight." },
  { k: "THE SEA RECEIVES IT", h: "And it does not sink.", p: "The work of many is about to begin." },
];

export default function RamSetuGame({ onComplete, onClose }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const hasWrittenRef = useRef(false);
  const advanceTimerRef = useRef(null);
  const stageRef = useRef("intro");
  const strokeLengthRef = useRef(0);

  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = createRamSetuAudio();

  const assetsRef = useRef(null);
  const heroMatsRef = useRef(null);
  const nextSlotRef = useRef(1); // slot 0 belongs to the first stone
  const pendingRef = useRef(0);
  const uidRef = useRef(1);
  const lastPlaceRef = useRef(0);
  const camTimerRef = useRef(null);

  const mutedRef = useRef(false);
  const dropSoundsRef = useRef(new Set());

  const [assets, setAssets] = useState(null);
  const [heroMats, setHeroMats] = useState(null);
  const [stage, setStage] = useState("intro");
  stageRef.current = stage;
  const [hasWritten, setHasWritten] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [placed, setPlaced] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("The work of many hands begins.");
  const [shot, setShot] = useState(0);
  const [autoCam, setAutoCam] = useState(true);
  const [muted, setMuted] = useState(false);
  mutedRef.current = muted;
  const [caption, setCaption] = useState(0);
  const [placeBusy, setPlaceBusy] = useState(false);
  const [volleyBusy, setVolleyBusy] = useState(false);
  const [showCta, setShowCta] = useState(false);

  /* ------------------- stone-drop sound (hanuman.mp3) ---------------- */
  const playHanuman = useCallback(() => {
    if (mutedRef.current) return;
    const a = new Audio(DROP_SOUND_SRC);
    a.volume = 0.9;
    dropSoundsRef.current.add(a);
    const cleanup = () => dropSoundsRef.current.delete(a);
    a.addEventListener("ended", cleanup);
    a.addEventListener("error", cleanup);
    a.play().catch(cleanup);
  }, []);

  const stopDropSounds = useCallback(() => {
    dropSoundsRef.current.forEach((a) => a.pause());
    dropSoundsRef.current.clear();
  }, []);

  /* ------------------------- load fonts + textures ------------------ */
  useEffect(() => {
    let alive = true;
    (async () => {
      await loadFonts();
      if (!alive) return;
      const built = buildAssets();
      assetsRef.current = built;
      setAssets(built);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(
    () => () => {
      audioRef.current?.stop();
      stopDropSounds();
      clearTimeout(camTimerRef.current);
      disposeHero(heroMatsRef.current);
      disposeAssets(assetsRef.current);
    },
    [stopDropSounds]
  );

  /* ---------------------------- writing surface --------------------- */
  const MIN_INK = 150; // total stroke length (canvas px) that counts as "written"

  const paintStyle = (ctx) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineWidth = 16;
    ctx.shadowColor = "rgba(255,120,60,0.55)";
    ctx.shadowBlur = 6;
  };

  useEffect(() => {
    if (stage !== "writing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    paintStyle(ctx);
    strokeLengthRef.current = 0;
    setHasWritten(false);
    return () => clearTimeout(advanceTimerRef.current);
  }, [stage]);

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || stage !== "writing") return;
    event.preventDefault();
    clearTimeout(advanceTimerRef.current); // still writing: do not advance yet
    setAdvancing(false);
    canvas.setPointerCapture?.(event.pointerId);
    drawingRef.current = true;
    const p = getCanvasPoint(event);
    lastPointRef.current = p;
    // a tap leaves a dot
    const ctx = canvas.getContext("2d");
    paintStyle(ctx);
    ctx.beginPath();
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const point = getCanvasPoint(event);
    const previous = lastPointRef.current;
    if (!previous) return;
    strokeLengthRef.current += Math.hypot(point.x - previous.x, point.y - previous.y);
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    if (strokeLengthRef.current > MIN_INK && !hasWrittenRef.current) {
      hasWrittenRef.current = true;
      setHasWritten(true);
    }
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (strokeLengthRef.current > MIN_INK) setAdvancing(true);
  };

  const clearWriting = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    clearTimeout(advanceTimerRef.current);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeLengthRef.current = 0;
    hasWrittenRef.current = false;
    setAdvancing(false);
    setHasWritten(false);
  };

  /* Write RAM for the player. Centred from real glyph metrics, so it can
     never land off-stone; then the story moves on by itself. */
  const autoInscribe = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    clearTimeout(advanceTimerRef.current);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.shadowColor = "rgba(255,120,60,0.55)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    let size = 250;
    ctx.font = `400 ${size}px ${DEVANAGARI_FONT}`;
    let m = ctx.measureText(RAM);
    const boxW = () => (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width);
    const boxH = () => (m.actualBoundingBoxAscent || size * 0.8) + (m.actualBoundingBoxDescent || size * 0.2);
    const fit = Math.min((CANVAS_W * 0.62) / boxW(), (CANVAS_H * 0.62) / boxH());
    size = Math.max(60, Math.round(size * fit));
    ctx.font = `400 ${size}px ${DEVANAGARI_FONT}`;
    m = ctx.measureText(RAM);
    const left = m.actualBoundingBoxLeft || 0;
    const asc = m.actualBoundingBoxAscent || size * 0.8;
    const desc = m.actualBoundingBoxDescent || size * 0.2;
    const x = (CANVAS_W - boxW()) / 2 + left;
    const y = (CANVAS_H - (asc + desc)) / 2 + asc;
    ctx.fillText(RAM, x, y);
    ctx.restore();
    paintStyle(ctx);
    strokeLengthRef.current = 999;
    hasWrittenRef.current = true;
    setHasWritten(true);
    setAdvancing(true);
  };

  /* ------------------------------ flow ------------------------------ */
  const begin = () => {
    audioRef.current.start();
    audioRef.current.setMuted(muted);
    setStage("writing");
  };

  const beginFirstStone = () => {
    if (strokeLengthRef.current <= MIN_INK || !assetsRef.current || !canvasRef.current) return;
    if (stageRef.current !== "writing") return;
    clearTimeout(advanceTimerRef.current);
    setAdvancing(false);
    const assets = assetsRef.current;
    const src = canvasRef.current;
    const ink = document.createElement("canvas");
    ink.width = src.width;
    ink.height = src.height;
    ink.getContext("2d").drawImage(src, 0, 0);
    disposeHero(heroMatsRef.current);
    const mats = buildHeroMaterials(ink, assets);
    heroMatsRef.current = mats;
    setHeroMats(mats);
    setStage("firstStone");
  };

  useEffect(() => {
    if (stage !== "firstStone") return;
    setCaption(0);
    const ids = [
      setTimeout(() => setCaption(1), 2900),
      setTimeout(() => setCaption(2), 5400),
    ];
    return () => ids.forEach(clearTimeout);
  }, [stage]);

  const handleHeroLand = useCallback(() => {
    setPlaced([{ id: "hero", slot: 0, variant: "hero" }]);
    playHanuman();
    audioRef.current.bell();
  }, [playHanuman]);

  const handleHeroDone = useCallback(() => {
    setShot(0);
    setAutoCam(true);
    setMessage(MILESTONES[1]);
    setStage("building");
  }, []);

  const handleLand = useCallback(
    (job) => {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      setPlaced((p) => (p.some((s) => s.id === job.id) ? p : [...p, { id: job.id, slot: job.slot, variant: job.variant }]));
      playHanuman();
      audioRef.current.bell();
    },
    [playHanuman]
  );

  const handleJobDone = useCallback((id) => {
    setJobs((j) => j.filter((x) => x.id !== id));
  }, []);

  const spawnBuilder = useCallback((delay = 0) => {
    const slot = nextSlotRef.current++;
    pendingRef.current += 1;
    const id = `b${uidRef.current++}`;
    setJobs((j) => [...j, { id, slot, variant: slot % 4, delay }]);
  }, []);

  const placeStone = useCallback(() => {
    if (stage !== "building") return;
    const now = performance.now();
    if (now - lastPlaceRef.current < 650) return;
    if (pendingRef.current >= 2 || nextSlotRef.current >= GOAL) return;
    lastPlaceRef.current = now;
    spawnBuilder(0);
    setPlaceBusy(true);
    setTimeout(() => setPlaceBusy(false), 650);
  }, [stage, spawnBuilder]);

  const callBuilders = useCallback(() => {
    if (stage !== "building" || volleyBusy) return;
    const n = Math.min(3, GOAL - nextSlotRef.current);
    if (n <= 0) return;
    for (let i = 0; i < n; i++) spawnBuilder(i * 0.4);
    setMessage("More builders move forward with stones.");
    setVolleyBusy(true);
    setTimeout(() => setVolleyBusy(false), 6000);
  }, [stage, volleyBusy, spawnBuilder]);

  const cycleCamera = useCallback(() => {
    setAutoCam(false);
    setShot((s) => (s + 1) % SHOTS.length);
    clearTimeout(camTimerRef.current);
    camTimerRef.current = setTimeout(() => setAutoCam(true), 14000);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      audioRef.current.setMuted(!m);
      if (!m) stopDropSounds(); // muting: silence any clip still playing
      return !m;
    });
  }, [stopDropSounds]);

  /* the Vanaras keep working by themselves, gently */
  useEffect(() => {
    if (stage !== "building") return;
    const id = setInterval(() => {
      if (pendingRef.current < 1 && nextSlotRef.current < GOAL) spawnBuilder(0);
    }, 3400);
    return () => clearInterval(id);
  }, [stage, spawnBuilder]);

  useEffect(() => {
    if (stage !== "building" || !autoCam) return;
    const id = setInterval(() => {
      setShot((s) => AUTO_ORDER[(AUTO_ORDER.indexOf(s) + 1) % AUTO_ORDER.length]);
    }, 6200);
    return () => clearInterval(id);
  }, [stage, autoCam]);

  useEffect(() => {
    const line = MILESTONES[placed.length];
    if (line && stage === "building") setMessage(line);
  }, [placed.length, stage]);

  useEffect(() => {
    if (stage !== "building" || placed.length < GOAL) return;
    const id = setTimeout(() => setStage("finale"), 1500);
    return () => clearTimeout(id);
  }, [stage, placed.length]);

  useEffect(() => {
    if (stage !== "finale") return;
    setShowCta(false);
    const cta = setTimeout(() => setShowCta(true), 4200);
    const id = setInterval(() => {
      if (nextSlotRef.current < MAX_SLOTS && pendingRef.current < 2) spawnBuilder(0);
    }, 1700);
    return () => {
      clearTimeout(cta);
      clearInterval(id);
    };
  }, [stage, spawnBuilder]);

  useEffect(() => {
    if (stage !== "building") return;
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        placeStone();
      } else if (e.key === "c" || e.key === "C") cycleCamera();
      else if (e.key === "m" || e.key === "M") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, placeStone, cycleCamera, toggleMute]);

  const restartGame = () => {
    disposeHero(heroMatsRef.current);
    heroMatsRef.current = null;
    nextSlotRef.current = 1;
    pendingRef.current = 0;
    stopDropSounds();
    setHeroMats(null);
    setPlaced([]);
    setJobs([]);
    setHasWritten(false);
    setShot(0);
    setAutoCam(true);
    setShowCta(false);
    setMessage("The work of many hands begins.");
    setStage("intro");
  };

  const finishGame = () => {
    onComplete?.();
    onClose?.();
  };

  const progress = Math.min(100, Math.round((placed.length / GOAL) * 100));
  const letterbox = stage === "firstStone" || stage === "finale";
  const fc = FIRST_CAPTIONS[caption];

  const exitGame = () => {
    audioRef.current?.stop();
    stopDropSounds();
    onClose?.();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") exitGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const game = (
    <div className={`ram-setu-game ram-setu-game--${stage}`}>
      <div className="ram-setu-game__scene">
        {assets && (
          <RamSetuScene
            assets={assets}
            heroMats={heroMats}
            stage={stage}
            placed={placed}
            jobs={jobs}
            shot={shot}
            onHeroLand={handleHeroLand}
            onHeroDone={handleHeroDone}
            onLand={handleLand}
            onJobDone={handleJobDone}
          />
        )}
      </div>
      <div className="ram-setu-game__vignette" />
      <div className="ram-setu-game__grain" />
      <div className={`ram-setu-letterbox ${letterbox ? "is-on" : ""}`}>
        <i />
        <i />
      </div>

      <div className="ram-setu-game__topline">
        <span>ANCESTRA</span>
        <i />
        <span>YUDDHA KANDA</span>
      </div>

      <div className="ram-setu-tools">
        {stage === "building" && (
          <button className="ram-setu-chip" onClick={cycleCamera} aria-label="Change camera angle">
            <Camera size={14} />
            <span>{SHOTS[shot].toUpperCase()}</span>
            <em>{autoCam ? "AUTO" : "MANUAL"}</em>
          </button>
        )}
        <button className="ram-setu-chip ram-setu-chip--icon" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <button className="ram-setu-chip ram-setu-chip--icon ram-setu-chip--exit" onClick={exitGame} aria-label="Exit game" title="Exit (Esc)">
          <X size={16} />
        </button>
      </div>

      {!assets && (
        <div className="ram-setu-loading">
          <Waves size={26} strokeWidth={1.2} />
          <span>PREPARING THE SHORE</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {assets && stage === "intro" && (
          <motion.section
            key="intro"
            className="ram-setu-intro"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.9 }}
          >
            <div className="ram-setu-intro__symbol">
              <Waves size={27} strokeWidth={1.2} />
            </div>
            <span className="ram-setu-kicker">AN ACT OF FAITH • AN ACT OF UNITY</span>
            <h1>
              The Making
              <span>of Ram Setu</span>
            </h1>
            <p className="ram-setu-intro__description">
              Before an army could cross the ocean, the first stone had to be placed.
            </p>
            <div className="ram-setu-intro__divider">
              <span />
              <Sparkles size={13} />
              <span />
            </div>
            <p className="ram-setu-intro__instruction">
              Inscribe the sacred name of Rama upon a stone. Then witness how countless hands turn a
              single act of devotion into a bridge across the sea.
            </p>
            <button className="ram-setu-primary" onClick={begin}>
              BEGIN THE WORK <ArrowRight size={17} />
            </button>
            <span className="ram-setu-intro__footnote">THE BRIDGE ACROSS THE OCEAN</span>
          </motion.section>
        )}

        {assets && stage === "writing" && (
          <motion.section
            key="writing"
            className="ram-setu-writing"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7 }}
          >
            <div className="ram-setu-section-heading">
              <span className="ram-setu-kicker">THE FIRST OFFERING</span>
              <h2>Write the name of Rama</h2>
              <p>
                Trace <strong className="ram-setu-dev">राम</strong> upon the stone with your finger or mouse.
                It need not be perfect.
              </p>
            </div>

            <div className={`ram-setu-slab${hasWritten ? " is-written" : ""}`}>
              <i className="ram-setu-slab__lichen" aria-hidden="true" />
              <div className="ram-setu-slab__label">
                <span>THE FIRST STONE</span>
                <span className="ram-setu-dev">श्री राम</span>
              </div>

              <div className="ram-setu-slab__carve">
                <span className="ram-setu-slab__guide ram-setu-dev" aria-hidden="true">
                  राम
                </span>
                <canvas
                  ref={canvasRef}
                  className="ram-setu-slab__canvas"
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerCancel={stopDrawing}
                  aria-label="Write the name Ram on the stone"
                />
                <span className="ram-setu-slab__chisel ram-setu-slab__chisel--tl" aria-hidden="true" />
                <span className="ram-setu-slab__chisel ram-setu-slab__chisel--br" aria-hidden="true" />
              </div>

              <div className="ram-setu-slab__footer">
                <button type="button" onClick={autoInscribe}>
                  <Sparkles size={13} /> WRITE IT FOR ME
                </button>
                <button type="button" onClick={clearWriting}>
                  <RotateCcw size={13} /> CLEAR STONE
                </button>
              </div>
            </div>

            <div className="ram-setu-writing__bottom">
              <p>
                {advancing
                  ? "The name is inscribed. Shall the first stone be placed in the sea?"
                  : hasWritten
                  ? "Keep writing, or lift your hand when you are done."
                  : "Draw the letters राम across the stone."}
              </p>
              {advancing && (
                <div className="ram-setu-writing__choices">
                  <button type="button" className="ram-setu-writing__notnow" onClick={clearWriting}>
                    NOT NOW
                  </button>
                  <button type="button" className="ram-setu-primary" onClick={beginFirstStone}>
                    PLACE THE STONE <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {stage === "firstStone" && (
          <motion.section
            key="firstStone"
            className="ram-setu-first"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={caption}
                className="ram-setu-first__caption"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.7 }}
              >
                <span className="ram-setu-kicker">{fc.k}</span>
                <h2>{fc.h}</h2>
                <p>{fc.p}</p>
              </motion.div>
            </AnimatePresence>
          </motion.section>
        )}

        {stage === "building" && (
          <motion.section
            key="building"
            className="ram-setu-building"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="ram-setu-building__header">
              <div>
                <span className="ram-setu-kicker">THE GREAT CONSTRUCTION</span>
                <h2>Build the Setu</h2>
              </div>
              <div className="ram-setu-counter">
                <span>STONES LAID</span>
                <strong>
                  {String(placed.length).padStart(2, "0")}
                  <small> / {GOAL}</small>
                </strong>
              </div>
            </div>

            <div className="ram-setu-building__bottom">
              <div className="ram-setu-building__message" aria-live="polite">
                <Sparkles size={15} />
                <span>{message}</span>
              </div>

              <div className="ram-setu-building__controls">
                <button className="ram-setu-control" onClick={placeStone} disabled={placeBusy}>
                  <Mountain size={18} />
                  <span>
                    <strong>PLACE A STONE</strong>
                    <small>Send a builder · Space</small>
                  </span>
                </button>
                <button className="ram-setu-control" onClick={callBuilders} disabled={volleyBusy}>
                  <Hand size={18} />
                  <span>
                    <strong>CALL THE BUILDERS</strong>
                    <small>Dispatch three at once</small>
                  </span>
                  {volleyBusy && <i className="ram-setu-control__cool" />}
                </button>
              </div>

              <div className="ram-setu-building__progress">
                <div>
                  <span>THE SETU TAKES SHAPE</span>
                  <strong>{progress}%</strong>
                </div>
                <div className="ram-setu-building__progress-track">
                  <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
                </div>
              </div>
              <p className="ram-setu-hint">C — change camera · M — sound</p>
            </div>
          </motion.section>
        )}

        {stage === "finale" && (
          <motion.section
            key="finale"
            className="ram-setu-finale"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <motion.div
              className="ram-setu-finale__content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 1.1 }}
            >
              <span className="ram-setu-kicker">THE WORK OF COUNTLESS HANDS</span>
              <h2>
                The bridge is being made
                <span>Stone by stone, name by name</span>
              </h2>
              <div className="ram-setu-finale__ornament">
                <i />
                <Sparkles size={15} />
                <i />
              </div>
              <p>
                What no single hand could accomplish, countless hands build together. The sea is
                still wide, and the work has only begun.
              </p>
              <p className="ram-setu-finale__lesson">Every contribution has its place. Every effort carries meaning.</p>

              <AnimatePresence>
                {showCta && (
                  <motion.div
                    className="ram-setu-finale__actions"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <button className="ram-setu-primary ram-setu-primary--light" onClick={finishGame}>
                      RETURN TO THE CHRONICLE <Check size={17} />
                    </button>
                    <button className="ram-setu-restart" onClick={restartGame}>
                      <RotateCcw size={14} /> EXPERIENCE AGAIN
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );

  return createPortal(game, document.body);
}