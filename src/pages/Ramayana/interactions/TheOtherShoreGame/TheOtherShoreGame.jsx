import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Waves,
  Heart,
  Sparkles,
  Ship,
  Flame,
  Pause,
  Play,
} from "lucide-react";
import "./TheOtherShoreGame.css";

const GAME_DURATION = 25000; // ms
const LANE_OFFSETS = [-30, 0, 30]; // % from centre at full depth
const BOAT_SPREAD = 0.78;
const BASE_SPEED = 0.05; // % of river height per ms
const HIT_ZONE = [60, 80];
const OBSTACLE_TYPES = ["rock", "log", "rock", "branch", "log", "rock"];

const spread = (y) => 0.26 + 0.74 * Math.min(Math.max(y, 0) / 100, 1);
const laneX = (lane, y) => 50 + LANE_OFFSETS[lane] * spread(y);

const MOTES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  top: 8 + ((i * 53) % 60),
  delay: (i % 7) * 0.9,
  duration: 6 + (i % 5) * 1.6,
  size: 2 + (i % 3),
}));

export default function TheOtherShoreGame({ onComplete }) {
  const [phase, setPhase] = useState("intro"); // intro | countdown | playing | paused | failed | complete
  const [count, setCount] = useState(3);
  const [lane, setLane] = useState(1);
  const [obstacles, setObstacles] = useState([]);
  const [lives, setLives] = useState(3);
  const [diyas, setDiyas] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [distance, setDistance] = useState(0);
  const [hitFlash, setHitFlash] = useState(false);
  const [invulnerable, setInvulnerable] = useState(false);

  const gameRef = useRef({});
  const touchStartX = useRef(null);
  const flashTimer = useRef(null);

  const resetGame = () => {
    gameRef.current = {
      lane: 1,
      obstacles: [],
      lives: 3,
      diyas: 0,
      elapsed: 0,
      spawnClock: 0,
      hitCooldown: 0,
      nextId: 0,
      finished: false,
    };
    setLane(1);
    setObstacles([]);
    setLives(3);
    setDiyas(0);
    setTimeLeft(GAME_DURATION / 1000);
    setDistance(0);
    setHitFlash(false);
    setInvulnerable(false);
  };

  const startGame = () => {
    resetGame();
    setCount(3);
    setPhase("countdown");
  };

  const moveBoat = useCallback(
    (direction) => {
      if (phase !== "playing" && phase !== "countdown") return;
      const next = Math.max(0, Math.min(2, gameRef.current.lane + direction));
      gameRef.current.lane = next;
      setLane(next);
    },
    [phase]
  );

  const togglePause = useCallback(() => {
    setPhase((p) => (p === "playing" ? "paused" : p === "paused" ? "playing" : p));
  }, []);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return undefined;
    const t = window.setTimeout(() => {
      if (count <= 1) setPhase("playing");
      else setCount((c) => c - 1);
    }, 800);
    return () => window.clearTimeout(t);
  }, [phase, count]);

  // Keyboard
  useEffect(() => {
    if (!["playing", "countdown", "paused"].includes(phase)) return undefined;

    const onKey = (event) => {
      const key = event.key.toLowerCase();
      if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        moveBoat(-1);
      } else if (key === "arrowright" || key === "d") {
        event.preventDefault();
        moveBoat(1);
      } else if (key === "escape" || key === "p") {
        event.preventDefault();
        togglePause();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, moveBoat, togglePause]);

  // Auto-pause when tab is hidden
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setPhase((p) => (p === "playing" ? "paused" : p));
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  // Touch swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 30) moveBoat(diff < 0 ? -1 : 1);
    touchStartX.current = null;
  };

  // Main loop
  useEffect(() => {
    if (phase !== "playing") return undefined;

    let raf;
    let last = performance.now();

    const frame = (now) => {
      const dt = Math.min(now - last, 50);
      last = now;
      const game = gameRef.current;

      if (!game.finished) {
        game.elapsed += dt;
        game.spawnClock += dt;
        if (game.hitCooldown > 0) game.hitCooldown -= dt;

        const progress = Math.min(1, game.elapsed / GAME_DURATION);
        const speed = BASE_SPEED * (1 + progress * 0.45);
        const spawnEvery = 950 - progress * 270;

        if (game.spawnClock >= spawnEvery) {
          game.spawnClock = 0;
          const isDiya = Math.random() < 0.22;
          game.obstacles.push({
            id: game.nextId++,
            lane: Math.floor(Math.random() * 3),
            y: -8,
            type: isDiya
              ? "diya"
              : OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)],
          });
        }

        let hit = false;
        let collected = 0;
        const next = [];

        for (const o of game.obstacles) {
          const y = o.y + speed * dt;
          const inZone = y >= HIT_ZONE[0] && y <= HIT_ZONE[1] && o.lane === game.lane;

          if (inZone && o.type === "diya") {
            collected += 1;
            continue;
          }
          if (inZone && o.type !== "diya" && game.hitCooldown <= 0) {
            hit = true;
            game.hitCooldown = 1200;
            continue;
          }
          if (y <= 112) next.push({ ...o, y });
        }

        game.obstacles = next;

        if (collected) {
          game.diyas += collected;
          setDiyas(game.diyas);
        }

        if (hit) {
          game.lives -= 1;
          setLives(game.lives);
          setHitFlash(true);
          setInvulnerable(true);
          if (navigator.vibrate) navigator.vibrate(70);
          window.clearTimeout(flashTimer.current);
          flashTimer.current = window.setTimeout(() => setHitFlash(false), 700);
        }

        if (game.hitCooldown <= 0) setInvulnerable(false);

        setObstacles([...game.obstacles]);
        setTimeLeft(Math.max(0, Math.ceil((GAME_DURATION - game.elapsed) / 1000)));
        setDistance(Math.min(100, Math.floor(progress * 100)));

        if (game.lives <= 0) {
          game.finished = true;
          setPhase("failed");
          return;
        }
        if (game.elapsed >= GAME_DURATION) {
          game.finished = true;
          setTimeLeft(0);
          setDistance(100);
          setPhase("complete");
          return;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const showWorld = phase === "playing" || phase === "countdown" || phase === "paused";

  return (
    <div
      className={`other-shore ${showWorld ? "other-shore--playing" : ""} ${
        hitFlash ? "other-shore--hit" : ""
      }`}
    >
      {/* ATMOSPHERE */}
      <div className="other-shore__sky" />
      <div className="other-shore__distant-land" />
      <div className="other-shore__trees other-shore__trees--left" />
      <div className="other-shore__trees other-shore__trees--right" />
      <div className="other-shore__mist" />
      <div className="other-shore__motes" aria-hidden="true">
        {MOTES.map((m, i) => (
          <i
            key={i}
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              animationDelay: `${m.delay}s`,
              animationDuration: `${m.duration}s`,
            }}
          />
        ))}
      </div>

      {/* HEADER */}
      <header className="other-shore__header">
        <div className="other-shore__brand">
          <Sparkles size={15} />
          <span>ANCESTRA</span>
          <i />
          <small>AYODHYA KANDA</small>
        </div>
        <div className="other-shore__chapter">
          CHAPTER VI <span>·</span> GAME I
        </div>
      </header>

      {/* INTRO */}
      {phase === "intro" && (
        <motion.section
          className="other-shore__intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="other-shore__intro-symbol">
            <Waves size={32} strokeWidth={1} />
          </div>

          <p className="other-shore__eyebrow">THE CROSSING</p>
          <h1>The Other Shore</h1>

          <div className="other-shore__divider">
            <i />✦<i />
          </div>

          <p className="other-shore__description">
            The Ganga stretches ahead. Rama, Sita and Lakshmana must reach the
            southern bank. Steer through the river, avoid the obstacles and
            guide their boat safely across.
          </p>

          <div className="other-shore__instructions">
            <div>
              <span className="other-shore__instruction-icon">
                <ArrowLeft size={16} />
                <ArrowRight size={16} />
              </span>
              <p>
                <strong>STEER</strong>
                <small>Arrow keys, A / D or swipe</small>
              </p>
            </div>

            <div>
              <span className="other-shore__instruction-icon">
                <Ship size={19} />
              </span>
              <p>
                <strong>AVOID</strong>
                <small>Rocks, logs and drifting branches</small>
              </p>
            </div>

            <div>
              <span className="other-shore__instruction-icon">
                <Flame size={19} />
              </span>
              <p>
                <strong>GATHER</strong>
                <small>Float through diyas set on the water</small>
              </p>
            </div>
          </div>

          <button className="other-shore__start-button" onClick={startGame}>
            BEGIN THE CROSSING
            <ArrowRight size={17} />
          </button>

          <small className="other-shore__intro-note">
            25 SECONDS · THREE LIVES · ONE CROSSING
          </small>
        </motion.section>
      )}

      {/* GAME */}
      {showWorld && (
        <motion.section
          className="other-shore__game"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* HUD */}
          <div className="other-shore__hud">
            <div className="other-shore__hud-item">
              <span>TIME</span>
              <strong>00:{String(timeLeft).padStart(2, "0")}</strong>
            </div>

            <div className="other-shore__hud-center">
              <span>THE GANGA</span>
              <div className="other-shore__distance-track">
                <i style={{ width: `${distance}%` }} />
              </div>
              <small>{distance}% CROSSED</small>
            </div>

            <div className="other-shore__hud-item other-shore__diyas">
              <span>DIYAS</span>
              <strong>
                <Flame size={16} color="#f4c36a" fill="#f4c36a33" />
                {diyas}
              </strong>
            </div>

            <div className="other-shore__hud-item other-shore__lives">
              <span>BOAT</span>
              <strong>
                {[0, 1, 2].map((h) => (
                  <Heart
                    key={h}
                    size={17}
                    fill={h < lives ? "currentColor" : "transparent"}
                    color={h < lives ? "#e8c58d" : "rgba(255,255,255,.3)"}
                  />
                ))}
              </strong>
            </div>
          </div>

          {/* WORLD */}
          <div
            className="other-shore__river-world"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="other-shore__horizon" />
            <div className="other-shore__far-shore" />
            <div className="other-shore__bank other-shore__bank--left" />
            <div className="other-shore__bank other-shore__bank--right" />

            <div className="other-shore__river">
              <div className="other-shore__water-light" />
              <div className="other-shore__water-ripples" />
              <div className="other-shore__water-current" />
              <div className="other-shore__water-glints" />

              <div className="other-shore__lane-lines">
                <i />
                <i />
              </div>

              {obstacles.map((o) => {
                const scale = 0.25 + o.y / 80;
                return (
                  <div
                    key={o.id}
                    className={`other-shore__obstacle other-shore__obstacle--${o.type}`}
                    style={{
                      left: `${laneX(o.lane, o.y)}%`,
                      top: `${o.y}%`,
                      opacity: Math.min(1, Math.max(0, o.y / 14)),
                      transform: `translate(-50%, -50%) scale(${scale})`,
                    }}
                  >
                    {o.type === "rock" && <div className="other-shore__rock-shape" />}
                    {o.type === "log" && <div className="other-shore__log-shape" />}
                    {o.type === "branch" && <div className="other-shore__branch-shape" />}
                    {o.type === "diya" && (
                      <div className="other-shore__diya-shape">
                        <i className="other-shore__diya-flame" />
                        <i className="other-shore__diya-bowl" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* BOAT */}
            <motion.div
              className={`other-shore__player ${
                invulnerable ? "other-shore__player--hurt" : ""
              }`}
              animate={{
                left: `${50 + LANE_OFFSETS[lane] * BOAT_SPREAD}%`,
                rotate: lane === 0 ? -7 : lane === 2 ? 7 : 0,
              }}
              transition={{ type: "spring", stiffness: 190, damping: 20 }}
            >
              <div className="other-shore__boat-wake" />
              <div className="other-shore__boat-bob">
                <div className="other-shore__crew" aria-hidden="true">
                  <span className="other-shore__figure other-shore__figure--lakshmana" />
                  <span className="other-shore__figure other-shore__figure--sita" />
                  <span className="other-shore__figure other-shore__figure--rama" />
                </div>
                <div className="other-shore__lantern" />

                <div className="other-shore__boat-body">
                  <div className="other-shore__boat-inner" />
                  <div className="other-shore__boat-rim" />
                  <div className="other-shore__boat-bow" />
                  <div className="other-shore__boat-detail" />
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {hitFlash && (
                <motion.div
                  className="other-shore__hit-effect"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span>THE BOAT IS STRUCK</span>
                  <small>Steady the boat and continue.</small>
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "countdown" && (
              <div className="other-shore__overlay">
                <b key={count}>{count}</b>
                <small>PREPARE TO CROSS</small>
              </div>
            )}

            {phase === "paused" && (
              <div className="other-shore__overlay other-shore__overlay--paused">
                <h2>The river waits</h2>
                <button className="other-shore__start-button" onClick={togglePause}>
                  <Play size={15} />
                  RESUME THE CROSSING
                </button>
              </div>
            )}
          </div>

          {/* CONTROLS */}
          <div className="other-shore__controls">
            <button
              aria-label="Move boat left"
              onClick={() => moveBoat(-1)}
              disabled={lane === 0 || phase === "paused"}
            >
              <ArrowLeft size={25} />
            </button>

            <button
              className="other-shore__pause"
              aria-label="Pause"
              onClick={togglePause}
              disabled={phase === "countdown"}
            >
              {phase === "paused" ? <Play size={17} /> : <Pause size={17} />}
            </button>

            <button
              aria-label="Move boat right"
              onClick={() => moveBoat(1)}
              disabled={lane === 2 || phase === "paused"}
            >
              <ArrowRight size={25} />
            </button>
          </div>
        </motion.section>
      )}

      {/* FAILED */}
      {phase === "failed" && (
        <motion.section
          className="other-shore__result"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="other-shore__intro-symbol">
            <Waves size={32} strokeWidth={1} />
          </div>

          <p className="other-shore__eyebrow">THE CROSSING IS NOT YET COMPLETE</p>
          <h1>Try Again</h1>

          <div className="other-shore__divider">
            <i />✦<i />
          </div>

          <p className="other-shore__description">
            The river still lies ahead. Watch the approaching obstacles
            carefully and guide the boat through a safer passage.
          </p>

          <div className="other-shore__stats">
            <div>
              <strong>{distance}%</strong>
              <span>CROSSED</span>
            </div>
            <div>
              <strong>{diyas}</strong>
              <span>DIYAS GATHERED</span>
            </div>
          </div>

          <button className="other-shore__start-button" onClick={startGame}>
            <RotateCcw size={16} />
            TRY THE CROSSING AGAIN
          </button>
        </motion.section>
      )}

      {/* COMPLETE */}
      {phase === "complete" && (
        <motion.section
          className="other-shore__result"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="other-shore__intro-symbol">
            <Sparkles size={32} strokeWidth={1} />
          </div>

          <p className="other-shore__eyebrow">THE CROSSING IS COMPLETE</p>
          <h1>The Other Shore</h1>

          <div className="other-shore__divider">
            <i />✦<i />
          </div>

          <p className="other-shore__description">
            The boat reaches the southern bank. Rama, Sita and Lakshmana step
            onto the shore. Behind them lies the Ganga; ahead, the forest
            journey continues.
          </p>

          <div className="other-shore__stats">
            <div>
              <strong className="other-shore__stars">
                {[0, 1, 2].map((h) => (
                  <Heart
                    key={h}
                    size={19}
                    fill={h < lives ? "currentColor" : "transparent"}
                    color={h < lives ? "#e8c58d" : "rgba(255,255,255,.3)"}
                  />
                ))}
              </strong>
              <span>BOAT CONDITION</span>
            </div>
            <div>
              <strong>{diyas}</strong>
              <span>DIYAS GATHERED</span>
            </div>
          </div>

          <blockquote>The river is behind them. The journey continues.</blockquote>

          <button className="other-shore__start-button" onClick={onComplete}>
            RETURN TO THE CHRONICLE
            <ArrowRight size={17} />
          </button>
        </motion.section>
      )}

      {/* FOOTER */}
      <footer className="other-shore__footer">
        <span>
          <Waves size={13} />
          THE CROSSING OF THE GANGA
        </span>
        <span>THE PAST CANNOT BE CHANGED</span>
      </footer>
    </div>
  );
}