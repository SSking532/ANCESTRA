// ============================================================
// ANCESTRA — RAMAYANA
// CHAPTER I — PUTRAKAMESHTI INTERACTIVE
// CINEMATIC RITUAL RECONSTRUCTION  (v2)
// ============================================================

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Flame,
  Sparkles,
  ScrollText,
  Check,
  RotateCcw,
  ArrowRight,
  Eye,
  EyeOff,
  Lightbulb,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import "./PutrakameshtiGame.css";

// ============================================================
// CONFIG
// ============================================================

/* Change ONLY this path if you choose a different audio file. */
const AUDIO_SRC = "/audio/putrakameshti-fire.mp3";

/* 0.22 = quiet background · 0.30 = noticeable · 0.40+ = strong */
const AUDIO_VOLUME = 0.22;
const AUDIO_FADE_MS = 700;
const MUTE_KEY = "ancestra:putrakameshti:muted";

/* Pause between the last correct placement and the completion scene */
const COMPLETE_DELAY_MS = 1200;

const EASE = [0.22, 1, 0.36, 1];

// ============================================================
// STORY DATA
// ============================================================

const RITE_STEPS = [
  {
    id: "preparation",
    number: "I",
    scene: "SCENE VII",
    title: "The Sacred Ground",
    text: "The sacrificial ground is carefully prepared. Sacred fires, vessels, offerings, ritual implements, and the necessary arrangements are put in place.",
    clue: "Before any flame is lit or any vow spoken, the ground itself must be made ready.",
  },
  {
    id: "ashvamedha",
    number: "II",
    scene: "SCENE VIII",
    title: "The Ashvamedha",
    text: "The great royal sacrifice is conducted under the guidance of the assembled sages and reaches completion.",
    clue: "The great royal sacrifice must reach its completion before the rite for sons can begin.",
  },
  {
    id: "putrakameshti",
    number: "III",
    scene: "SCENE IX",
    title: "The Putrakameshti",
    text: "Rishyasringa directs the sacred rite specifically undertaken for the blessing of sons.",
    clue: "Only after the royal sacrifice does Rishyasringa turn to the rite meant for the blessing of sons.",
  },
  {
    id: "offerings",
    number: "IV",
    scene: "SCENE IX",
    title: "The Offerings",
    text: "Offerings are placed into the sacred fire while the priests continue their recitations and Dasharatha waits in prayer.",
    clue: "The rite is under way. Now the offerings are given to the fire while the king waits in prayer.",
  },
  {
    id: "revelation",
    number: "V",
    scene: "SCENE IX",
    title: "The Fire Changes",
    text: "The nature of the ceremony changes as the fire begins to reveal something beyond ordinary flame.",
    clue: "The last moment before the revelation: the fire itself becomes more than ordinary flame.",
  },
];

const TOTAL = RITE_STEPS.length;

const STAGE_LINES = [
  "The fire waits, unlit. Restore the rite in the order it unfolded.",
  "A first ember stirs. The rite begins to take shape.",
  "The sages gather. The flame grows steady.",
  "The fire burns bright. The chamber falls silent.",
  "One moment remains before the fire changes…",
];

const RATINGS = {
  3: {
    title: "FLAWLESS RITE",
    line: "Every moment found its place without a misstep.",
  },
  2: {
    title: "STEADY RITE",
    line: "The sequence was restored with only a little guidance.",
  },
  1: {
    title: "RITE RESTORED",
    line: "Patience and persistence brought the sequence back.",
  },
};

// ============================================================
// HELPERS
// ============================================================

const cx = (...classes) => classes.filter(Boolean).join(" ");

const emptySlots = () => Array(TOTAL).fill(null);

const shuffle = (array) => {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

/* Never start with the fragments already in the correct order. */
const getInitialFragments = () => {
  let next = shuffle(RITE_STEPS);
  let guard = 0;

  while (
    guard < 25 &&
    next.every((step, index) => step.id === RITE_STEPS[index].id)
  ) {
    next = shuffle(RITE_STEPS);
    guard += 1;
  }

  return next;
};

const readMuted = () => {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
};

const writeMuted = (value) => {
  try {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* storage unavailable — ignore */
  }
};

// ============================================================
// MAIN COMPONENT
// ============================================================

function PutrakameshtiGame({ onComplete, onClose }) {
  const reduceMotion = useReducedMotion();

  const rootRef = useRef(null);

  const [fragments, setFragments] = useState(getInitialFragments);
  const [slots, setSlots] = useState(emptySlots);
  const [selectedId, setSelectedId] = useState(null);
  const [lastPlacedId, setLastPlacedId] = useState(null);

  const [notice, setNotice] = useState(null);
  const [shakeSlot, setShakeSlot] = useState(null);
  const [pulse, setPulse] = useState(null);

  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);

  const [complete, setComplete] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // ==========================================================
  // AUDIO
  // ==========================================================

  const audioRef = useRef(null);
  const fadeRef = useRef(0);
  const completeTimerRef = useRef(null);

  const [muted, setMuted] = useState(readMuted);
  const mutedRef = useRef(muted);
  const [audioAvailable, setAudioAvailable] = useState(true);

  useEffect(() => {
    const audio = new Audio(AUDIO_SRC);

    audio.loop = true;
    audio.volume = AUDIO_VOLUME;
    audio.preload = "auto";
    audio.muted = mutedRef.current;

    audioRef.current = audio;

    const handleError = () => setAudioAvailable(false);
    audio.addEventListener("error", handleError);

    const tryPlay = () => {
      if (mutedRef.current) return;

      const promise = audio.play();

      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {
          /* Autoplay blocked — the first interaction will start it. */
        });
      }
    };

    tryPlay();

    window.addEventListener("pointerdown", tryPlay, { once: true });
    window.addEventListener("keydown", tryPlay, { once: true });

    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);

      audio.removeEventListener("error", handleError);

      cancelAnimationFrame(fadeRef.current);
      clearTimeout(completeTimerRef.current);

      audio.pause();
      audio.currentTime = 0;

      audioRef.current = null;
    };
  }, []);

  const fadeAudioOut = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) return;

    cancelAnimationFrame(fadeRef.current);

    const startVolume = audio.volume;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / AUDIO_FADE_MS, 1);

      audio.volume = startVolume * (1 - progress);

      if (progress < 1) {
        fadeRef.current = requestAnimationFrame(step);
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    };

    fadeRef.current = requestAnimationFrame(step);
  }, []);

  const stopAudio = () => {
    const audio = audioRef.current;

    cancelAnimationFrame(fadeRef.current);

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const toggleMute = () => {
    const next = !muted;
    const audio = audioRef.current;

    setMuted(next);
    mutedRef.current = next;
    writeMuted(next);

    if (!audio) return;

    audio.muted = next;

    if (!next && !complete) {
      const promise = audio.play();

      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    }
  };

  // ==========================================================
  // DERIVED STATE
  // ==========================================================

  const filledCount = slots.filter(Boolean).length;
  const intensity = filledCount / TOTAL;
  const firstEmpty = slots.indexOf(null);

  const availableFragments = useMemo(
    () => fragments.filter((fragment) => !slots.includes(fragment.id)),
    [fragments, slots]
  );

  const selectedStep = useMemo(
    () => RITE_STEPS.find((step) => step.id === selectedId) ?? null,
    [selectedId]
  );

  const lastPlacedStep = useMemo(
    () => RITE_STEPS.find((step) => step.id === lastPlacedId) ?? null,
    [lastPlacedId]
  );

  const flames = mistakes + hints === 0 ? 3 : mistakes + hints <= 2 ? 2 : 1;

  // ==========================================================
  // EFFECTS
  // ==========================================================

  /* Wrong-answer notices fade on their own; clues stay until dismissed. */
  useEffect(() => {
    if (!notice || notice.kind !== "wrong") return undefined;

    const timeout = setTimeout(() => setNotice(null), 7000);

    return () => clearTimeout(timeout);
  }, [notice]);

  /* Shake animation reset. */
  useEffect(() => {
    if (shakeSlot === null) return undefined;

    const timeout = setTimeout(() => setShakeSlot(null), 560);

    return () => clearTimeout(timeout);
  }, [shakeSlot]);

  /* Escape clears the current selection. */
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setSelectedId(null);
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ==========================================================
  // ACTIONS
  // ==========================================================

  const firePulse = (tone) =>
    setPulse((current) => ({ id: (current?.id ?? 0) + 1, tone }));

  const selectFragment = (fragment) => {
    if (complete) return;

    const isSame = selectedId === fragment.id;

    setSelectedId(isSame ? null : fragment.id);
    setNotice(null);

    setAnnouncement(
      isSame
        ? `${fragment.title} deselected.`
        : `${fragment.title} selected. Choose a position in the Chronicle.`
    );
  };

  const placeFragment = (slotIndex) => {
    if (complete || !selectedId || slots[slotIndex]) return;

    const target = RITE_STEPS[slotIndex];
    const chosen = RITE_STEPS.find((step) => step.id === selectedId);

    if (!chosen || !target) return;

    // ---------------- CORRECT ----------------

    if (chosen.id === target.id) {
      const next = slots.map((id, index) =>
        index === slotIndex ? chosen.id : id
      );

      const filled = next.filter(Boolean).length;
      const isLast = filled === TOTAL;

      setSlots(next);
      setSelectedId(null);
      setNotice(null);
      setLastPlacedId(chosen.id);

      firePulse(isLast ? "final" : "good");

      setAnnouncement(
        `Correct. ${chosen.title} placed in position ${target.number}. ${filled} of ${TOTAL} restored.`
      );

      if (isLast) {
        clearTimeout(completeTimerRef.current);

        completeTimerRef.current = setTimeout(() => {
          setComplete(true);
          fadeAudioOut();
        }, COMPLETE_DELAY_MS);
      }

      return;
    }

    // ---------------- WRONG ----------------

    setMistakes((value) => value + 1);
    setNotice({ kind: "wrong", slotIndex, revealed: false });
    setShakeSlot(slotIndex);
    firePulse("bad");

    setAnnouncement(
      `Not yet. ${chosen.title} does not belong in position ${target.number}.`
    );
  };

  const seekClue = () => {
    if (complete || firstEmpty === -1) return;

    const alreadyShown =
      notice?.kind === "clue" && notice.slotIndex === firstEmpty;

    if (!alreadyShown) setHints((value) => value + 1);

    setNotice({ kind: "clue", slotIndex: firstEmpty, revealed: true });

    setAnnouncement(
      `Clue for position ${RITE_STEPS[firstEmpty].number}: ${RITE_STEPS[firstEmpty].clue}`
    );
  };

  const resetGame = () => {
    clearTimeout(completeTimerRef.current);
    cancelAnimationFrame(fadeRef.current);

    setFragments(getInitialFragments());
    setSlots(emptySlots());
    setSelectedId(null);
    setLastPlacedId(null);
    setNotice(null);
    setShakeSlot(null);
    setPulse(null);
    setMistakes(0);
    setHints(0);
    setComplete(false);
    setAnnouncement("The Chronicle has been reset.");

    const audio = audioRef.current;

    if (audio) {
      audio.volume = AUDIO_VOLUME;
      audio.currentTime = 0;

      if (!mutedRef.current) {
        const promise = audio.play();

        if (promise && typeof promise.catch === "function") {
          promise.catch(() => {});
        }
      }
    }

    rootRef.current?.scrollIntoView?.({
      block: "start",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const finishGame = () => {
    stopAudio();

    onComplete?.();
    onClose?.();
  };

  const closeGame = () => {
    stopAudio();

    onClose?.();
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  const noticeStep = notice ? RITE_STEPS[notice.slotIndex] : null;

  const helperText = complete
    ? "The Chronicle is whole."
    : selectedStep
    ? `“${selectedStep.title}” is selected. Choose its position above, or use the dock below.`
    : "Choose a fragment below, then place it in the Chronicle.";

  return (
    <div
      ref={rootRef}
      className={cx("putra-game", complete && "putra-game--complete")}
      style={{ "--intensity": intensity }}
    >
      {/* Screen-reader announcements */}
      <div className="putra-game__sr" role="status" aria-live="polite">
        {announcement}
      </div>

      {/* ====================================================
          ATMOSPHERE
          ==================================================== */}

      <div className="putra-game__atmosphere" aria-hidden="true">
        <div className="putra-game__grain" />

        <div className="putra-game__aura putra-game__aura--one" />
        <div className="putra-game__aura putra-game__aura--two" />

        <SacredParticles />

        <motion.div
          className="putra-game__mandala"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          <div className="putra-game__mandala-ring putra-game__mandala-ring--one" />
          <div className="putra-game__mandala-ring putra-game__mandala-ring--two" />
          <div className="putra-game__mandala-ring putra-game__mandala-ring--three" />
          <div className="putra-game__mandala-cross" />
        </motion.div>

        <div className="putra-game__vignette" />
      </div>

      {/* ====================================================
          HEADER
          ==================================================== */}

      <header className="putra-game__header">
        <div className="putra-game__chapter-mark">
          <span>ANCESTRA</span>
          <i />
          <span>CHAPTER I</span>
        </div>

        <div className="putra-game__header-center">
          <div className="putra-game__eyebrow">
            <Sparkles size={14} strokeWidth={1.4} />
            INTERACTIVE CHRONICLE
          </div>

          <h1>THE SACRED RITE</h1>

          <p>
            Reconstruct the sequence that led to the moment before the divine
            revelation.
          </p>
        </div>

        <div className="putra-game__header-tools">
          {audioAvailable && (
            <button
              type="button"
              className="putra-game__icon-btn"
              onClick={toggleMute}
              aria-pressed={muted}
              aria-label={muted ? "Unmute ambience" : "Mute ambience"}
              title={muted ? "Unmute ambience" : "Mute ambience"}
            >
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              className="putra-game__icon-btn putra-game__icon-btn--close"
              onClick={closeGame}
              aria-label="Close"
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* ====================================================
          MAIN
          ==================================================== */}

      <main className="putra-game__content">
        {/* ==================================================
            RITUAL STAGE
            ================================================== */}

        <section
          className="putra-game__ritual-stage"
          aria-label="The sacred chamber"
        >
          <div className="putra-game__stage-label">
            <span>THE SACRED CHAMBER</span>
            <small>SCENES VII — IX</small>
          </div>

          <div className="putra-game__fire-zone">
            <div className="putra-game__ring putra-game__ring--outer" />
            <div className="putra-game__ring putra-game__ring--inner" />

            <div className="putra-game__fire-halo" />

            {pulse && (
              <motion.div
                key={pulse.id}
                className={`putra-game__flare putra-game__flare--${pulse.tone}`}
                initial={{ opacity: 0.95, scale: 0.35 }}
                animate={{ opacity: 0, scale: pulse.tone === "final" ? 3 : 1.8 }}
                transition={{
                  duration: pulse.tone === "final" ? 1.4 : 0.9,
                  ease: "easeOut",
                }}
              />
            )}

            <Fire />

            <div className="putra-game__coals" />

            <div className="putra-game__altar">
              <div />
              <div />
              <div />
            </div>
          </div>

          <div
            className="putra-game__lamps"
            role="img"
            aria-label={`${filledCount} of ${TOTAL} sacred lamps lit`}
          >
            {RITE_STEPS.map((step, index) => (
              <span
                key={step.id}
                className={index < filledCount ? "is-lit" : ""}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={complete ? "complete" : `stage-${filledCount}`}
              className={cx(
                "putra-game__narration",
                complete && "putra-game__narration--complete"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              {complete ? (
                <>
                  <span>
                    <Sparkles size={13} /> THE CHRONICLE REMEMBERS
                  </span>
                  <strong>THE RITE IS COMPLETE</strong>
                  <p>The sacred sequence has been restored.</p>
                </>
              ) : (
                <>
                  <span>
                    {filledCount === 0
                      ? "THE RITE AWAITS"
                      : `${filledCount} OF ${TOTAL} RESTORED`}
                  </span>
                  <strong>{STAGE_LINES[filledCount]}</strong>
                  {lastPlacedStep && (
                    <p>
                      <em>{lastPlacedStep.title}</em> — {lastPlacedStep.text}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ==================================================
            CHRONICLE
            ================================================== */}

        <section
          className="putra-game__chronicle"
          aria-label="The Chronicle"
        >
          <div className="putra-game__section-heading">
            <div>
              <span>01 / THE CHRONICLE</span>
              <h2>Reconstruct the Rite</h2>
            </div>

            <div
              className="putra-game__progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={TOTAL}
              aria-valuenow={filledCount}
              aria-label="Rite restored"
            >
              <div className="putra-game__progress-number">
                <strong>{filledCount}</strong>
                <span>/ {TOTAL}</span>
              </div>

              <div className="putra-game__progress-track">
                <motion.div
                  initial={false}
                  animate={{ width: `${intensity * 100}%` }}
                  transition={{ duration: 0.7, ease: EASE }}
                />
              </div>
            </div>
          </div>

          {/* TIMELINE */}

          <ol className="putra-game__timeline">
            {RITE_STEPS.map((step, index) => {
              const isFilled = Boolean(slots[index]);
              const isTarget = Boolean(selectedId) && !isFilled && !complete;

              return (
                <li key={step.id}>
                  <motion.button
                    type="button"
                    className={cx(
                      "putra-game__slot",
                      isFilled && "is-placed",
                      isTarget && "is-target",
                      shakeSlot === index && "is-shaking",
                      notice?.slotIndex === index &&
                        notice.kind === "wrong" &&
                        "is-noticed"
                    )}
                    onClick={() => placeFragment(index)}
                    disabled={isFilled || complete || !selectedId}
                    aria-label={
                      isFilled
                        ? `Position ${step.number}: ${step.title}`
                        : `Place selected fragment in position ${step.number}`
                    }
                    whileHover={isTarget ? { y: -3 } : undefined}
                    whileTap={isTarget ? { scale: 0.985 } : undefined}
                  >
                    <div className="putra-game__slot-number">
                      {isFilled ? <Check size={15} strokeWidth={2.4} /> : step.number}
                    </div>

                    {isFilled ? (
                      <motion.div
                        className="putra-game__slot-body"
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                      >
                        <span>{step.scene}</span>
                        <strong>{step.title}</strong>
                        <p>{step.text}</p>
                      </motion.div>
                    ) : (
                      <div className="putra-game__slot-body">
                        <span>MOMENT {step.number}</span>
                        <em>{isTarget ? "PLACE HERE" : "AWAITING"}</em>
                      </div>
                    )}
                  </motion.button>
                </li>
              );
            })}
          </ol>

          {/* NOTICE: wrong answer / clue */}

          <AnimatePresence>
            {notice && noticeStep && (
              <motion.div
                key={`${notice.kind}-${notice.slotIndex}`}
                className={`putra-game__notice putra-game__notice--${notice.kind}`}
                role={notice.kind === "wrong" ? "alert" : "status"}
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <div className="putra-game__notice-inner">
                  <div className="putra-game__notice-icon">
                    {notice.kind === "wrong" ? "!" : <Lightbulb size={15} />}
                  </div>

                  <div className="putra-game__notice-text">
                    <strong>
                      {notice.kind === "wrong"
                        ? "NOT YET — THAT MOMENT BELONGS ELSEWHERE"
                        : `A WHISPER FOR MOMENT ${noticeStep.number}`}
                    </strong>

                    <p>
                      {notice.kind === "wrong"
                        ? `That fragment does not belong in position ${noticeStep.number}. Think about what must already have happened before it, and what follows.`
                        : noticeStep.clue}
                    </p>

                    {notice.kind === "wrong" && notice.revealed && (
                      <p className="putra-game__notice-clue">
                        <Lightbulb size={13} /> Position {noticeStep.number}:{" "}
                        {noticeStep.clue}
                      </p>
                    )}
                  </div>

                  <div className="putra-game__notice-actions">
                    {notice.kind === "wrong" && (
                      <button
                        type="button"
                        onClick={() =>
                          setNotice((current) =>
                            current
                              ? { ...current, revealed: !current.revealed }
                              : current
                          )
                        }
                      >
                        {notice.revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                        {notice.revealed ? "HIDE CLUE" : "SHOW CLUE"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="putra-game__notice-dismiss"
                      onClick={() => setNotice(null)}
                      aria-label="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STORY FRAGMENTS */}

          <div className="putra-game__fragments-heading">
            <div>
              <span>02 / STORY FRAGMENTS</span>
              <h3>Moments from the Chronicle</h3>
            </div>

            <div className="putra-game__fragments-side">
              <p>
                Every fragment comes directly from the story you have just
                read.
              </p>

              <button
                type="button"
                className="putra-game__clue-btn"
                onClick={seekClue}
                disabled={complete || firstEmpty === -1}
              >
                <Lightbulb size={14} />
                SEEK A CLUE
              </button>
            </div>
          </div>

          <p className="putra-game__helper">
            <Sparkles size={13} />
            <span>{helperText}</span>
          </p>

          <div className="putra-game__fragments">
            <AnimatePresence mode="popLayout">
              {availableFragments.map((fragment) => {
                const selected = selectedId === fragment.id;

                return (
                  <motion.button
                    layout={!reduceMotion}
                    key={fragment.id}
                    type="button"
                    className={cx(
                      "putra-game__fragment",
                      selected && "is-selected"
                    )}
                    onClick={() => selectFragment(fragment)}
                    aria-pressed={selected}
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: selected ? 1.02 : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: -12 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="putra-game__fragment-top">
                      <span>{fragment.scene}</span>

                      <ScrollText size={18} strokeWidth={1.3} />
                    </div>

                    <h4>{fragment.title}</h4>

                    <p>{fragment.text}</p>

                    <div className="putra-game__fragment-bottom">
                      <span>{selected ? "SELECTED" : "SELECT TO PLACE"}</span>

                      {selected ? (
                        <Check size={15} strokeWidth={2} />
                      ) : (
                        <ArrowRight size={15} strokeWidth={1.4} />
                      )}
                    </div>

                    {selected && (
                      <motion.div
                        className="putra-game__fragment-glow"
                        layoutId="fragmentGlow"
                      />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>

            {availableFragments.length === 0 && (
              <p className="putra-game__fragments-empty">
                Every fragment has found its place.
              </p>
            )}
          </div>

          {/* PLACEMENT DOCK */}

          <AnimatePresence>
            {selectedStep && !complete && (
              <motion.div
                className="putra-game__dock"
                role="group"
                aria-label="Place the selected fragment"
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 26 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <div className="putra-game__dock-text">
                  <span>PLACE</span>
                  <strong>{selectedStep.title}</strong>
                </div>

                <div className="putra-game__dock-slots">
                  {RITE_STEPS.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      disabled={Boolean(slots[index])}
                      onClick={() => placeFragment(index)}
                      aria-label={`Place in position ${step.number}`}
                    >
                      {slots[index] ? <Check size={13} /> : step.number}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="putra-game__dock-cancel"
                  onClick={() => setSelectedId(null)}
                  aria-label="Cancel selection"
                >
                  <X size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* ====================================================
          FOOTER
          ==================================================== */}

      <footer className="putra-game__footer">
        <div className="putra-game__footer-note">
          <span>STORY-BOUND CHALLENGE</span>

          <p>
            Nothing here is arbitrary. The sequence is reconstructed from the
            events described in Scenes VII–IX.
          </p>
        </div>

        <div className="putra-game__footer-actions">
          {!complete && (
            <button
              type="button"
              className="putra-game__reset"
              onClick={resetGame}
            >
              <RotateCcw size={14} />
              RESET
            </button>
          )}
        </div>
      </footer>

      {/* ====================================================
          COMPLETION
          ==================================================== */}

      <AnimatePresence>
        {complete && (
          <CompletionExperience
            flames={flames}
            mistakes={mistakes}
            hints={hints}
            onContinue={finishGame}
            onReplay={resetGame}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SACRED FIRE (SVG)
   ============================================================ */

const FLAME_PATH =
  "M60 8 C66 38 98 58 98 96 C98 126 80 144 60 144 C40 144 22 126 22 96 C22 70 42 58 48 36 C52 24 56 16 60 8 Z";

const Fire = memo(function Fire() {
  return (
    <div className="putra-game__fire" aria-hidden="true">
      <svg
        className="putra-game__fire-svg"
        viewBox="0 0 120 150"
        focusable="false"
      >
        <defs>
          <linearGradient id="putraFlameOuter" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#a63d17" />
            <stop offset="45%" stopColor="#e0792f" />
            <stop offset="100%" stopColor="#f4c36a" />
          </linearGradient>

          <linearGradient id="putraFlameMid" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#e88a34" />
            <stop offset="60%" stopColor="#f6b858" />
            <stop offset="100%" stopColor="#ffe3a0" />
          </linearGradient>

          <linearGradient id="putraFlameCore" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f7c566" />
            <stop offset="100%" stopColor="#fff6d8" />
          </linearGradient>

          <filter id="putraFlameBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        <g className="putra-game__flame putra-game__flame--outer">
          <path
            d={FLAME_PATH}
            fill="url(#putraFlameOuter)"
            filter="url(#putraFlameBlur)"
          />
        </g>

        <g className="putra-game__flame putra-game__flame--mid">
          <path
            d={FLAME_PATH}
            fill="url(#putraFlameMid)"
            transform="translate(60 144) scale(0.7) translate(-60 -144)"
          />
        </g>

        <g className="putra-game__flame putra-game__flame--core">
          <path
            d={FLAME_PATH}
            fill="url(#putraFlameCore)"
            transform="translate(60 144) scale(0.42) translate(-60 -144)"
          />
        </g>
      </svg>
    </div>
  );
});

/* ============================================================
   COMPLETION EXPERIENCE
   ============================================================ */

function CompletionExperience({
  flames,
  mistakes,
  hints,
  onContinue,
  onReplay,
}) {
  const rating = RATINGS[flames];

  return (
    <motion.div
      className="putra-game__completion"
      role="dialog"
      aria-modal="true"
      aria-label="The rite is complete"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      <div className="putra-game__completion-backdrop" />

      <CompletionPetals />

      <motion.div
        className="putra-game__completion-aura"
        initial={{ scale: 0.65, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: EASE }}
      />

      <motion.div
        className="putra-game__completion-card"
        initial={{ opacity: 0, y: 35, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.85, ease: EASE }}
      >
        <motion.div
          className="putra-game__completion-symbol"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
        >
          <Flame size={30} strokeWidth={1.1} />
        </motion.div>

        <motion.div
          className="putra-game__completion-line"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.85, duration: 0.7 }}
        />

        <div className="putra-game__completion-eyebrow">
          ✦ THE SACRED CHRONICLE ✦
        </div>

        <h2>
          THE RITE
          <br />
          <span>IS COMPLETE</span>
        </h2>

        <p className="putra-game__completion-lead">
          The events of Scenes VII–IX have been reconstructed in their proper
          order.
        </p>

        <div className="putra-game__rating">
          <div
            className="putra-game__rating-flames"
            role="img"
            aria-label={`${flames} of 3 flames`}
          >
            {[1, 2, 3].map((n) => (
              <Flame
                key={n}
                size={22}
                strokeWidth={1.3}
                className={n <= flames ? "is-lit" : ""}
              />
            ))}
          </div>

          <strong>{rating.title}</strong>
          <span>{rating.line}</span>

          <div className="putra-game__rating-stats">
            <div>
              <b>{mistakes}</b>
              <small>MISSTEPS</small>
            </div>

            <div>
              <b>{hints}</b>
              <small>CLUES</small>
            </div>
          </div>
        </div>

        <ol className="putra-game__recap">
          {RITE_STEPS.map((step) => (
            <li key={step.id}>
              <i>{step.number}</i>
              {step.title}
            </li>
          ))}
        </ol>

        <div className="putra-game__completion-divider">
          <span />
          <Sparkles size={13} />
          <span />
        </div>

        <div className="putra-game__completion-next">
          <small>THE CHRONICLE AWAITS</small>
          <strong>THE DIVINE REVELATION</strong>
        </div>

        <div className="putra-game__completion-actions">
          <motion.button
            type="button"
            className="putra-game__completion-button"
            onClick={onContinue}
            autoFocus
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            RETURN TO THE CHRONICLE
            <ArrowRight size={16} />
          </motion.button>

          <motion.button
            type="button"
            className="putra-game__completion-replay"
            onClick={onReplay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.55 }}
          >
            <RotateCcw size={13} />
            PLAY AGAIN
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   PETALS
   ============================================================ */

const CompletionPetals = memo(function CompletionPetals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        id: index,
        left: `${2 + Math.random() * 96}%`,
        delay: `${Math.random() * 2.5}s`,
        duration: `${4.5 + Math.random() * 4}s`,
        width: `${7 + Math.random() * 7}px`,
        height: `${9 + Math.random() * 8}px`,
        rotation: `${Math.floor(Math.random() * 360)}deg`,
        drift: `${Math.floor(-40 + Math.random() * 80)}px`,
      })),
    []
  );

  return (
    <div className="putra-game__petals" aria-hidden="true">
      {petals.map((petal) => (
        <span
          key={petal.id}
          style={{
            left: petal.left,
            width: petal.width,
            height: petal.height,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
            "--rot": petal.rotation,
            "--drift": petal.drift,
          }}
        />
      ))}
    </div>
  );
});

/* ============================================================
   PARTICLES (generated once — no re-randomising on re-render)
   ============================================================ */

const SacredParticles = memo(function SacredParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        delay: `${-Math.random() * 10}s`,
        duration: `${7 + Math.random() * 9}s`,
        size: `${1.2 + Math.random() * 2.4}px`,
        drift: `${Math.floor(-40 + Math.random() * 80)}px`,
      })),
    []
  );

  return (
    <div className="putra-game__particles">
      {particles.map((particle) => (
        <span
          key={particle.id}
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            "--drift": particle.drift,
          }}
        />
      ))}
    </div>
  );
});

export default PutrakameshtiGame;