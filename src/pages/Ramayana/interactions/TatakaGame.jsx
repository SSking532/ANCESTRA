import {
  ArrowRight as ArrowRightIcon,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./TatakaGame.css";

/* =========================================================
   ANCESTRA — RAMAYANA
   CHAPTER III
   GAME II — TATAKA
   THE FIRST GREAT TRIAL
========================================================= */

const BASE =
  "/images/ramayana/interactions";

const ASSETS = {
  forest:
    `${BASE}/tataka-forest.jpg`,

  battle:
    `${BASE}/tataka-battle-bg.jpg`,

  tataka:
    `${BASE}/tataka-battle.png`,

  rama:
    `${BASE}/rama-battle.png`,
};

/* =========================================================
   GAME SETTINGS
========================================================= */

const TATAKA_MAX_HP = 6;
const RAMA_MAX_HP = 3;

/*
  One attack circle is now deliberately small.
  The visible circle and collision radius use the
  same conceptual size.
*/
const IMPACT_RADIUS = 3.25;

const FIREBALL_TRAVEL_TIME = 1400;
const ATTACK_GAP = 750;

const RAMA_MIN_X = 68;
const RAMA_MAX_X = 83;

/* =========================================================
   COMPONENT
========================================================= */

export default function TatakaGame({
  onComplete = () => {},
}) {
  const [screen, setScreen] =
    useState("intro");

  /* =======================================================
     TATAKA AUDIO
  ======================================================= */

  const tatakaAudioRef =
    useRef(null);

  /* =======================================================
     PHASE
  ======================================================= */

  const [phase, setPhase] =
    useState("tataka");

  const phaseRef =
    useRef("tataka");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  /* =======================================================
     RAMA POSITION
  ======================================================= */

  const [ramaX, setRamaX] =
    useState(78);

  const ramaXRef =
    useRef(78);

  useEffect(() => {
    ramaXRef.current = ramaX;
  }, [ramaX]);

  /* =======================================================
     RAMA HEALTH
  ======================================================= */

  const [ramaHp, setRamaHp] =
    useState(RAMA_MAX_HP);

  const ramaHpRef =
    useRef(RAMA_MAX_HP);

  useEffect(() => {
    ramaHpRef.current = ramaHp;
  }, [ramaHp]);

  /* =======================================================
     TATAKA HEALTH
  ======================================================= */

  const [tatakaHp, setTatakaHp] =
    useState(TATAKA_MAX_HP);

  const tatakaHpRef =
    useRef(TATAKA_MAX_HP);

  useEffect(() => {
    tatakaHpRef.current = tatakaHp;
  }, [tatakaHp]);

  /* =======================================================
     ATTACK COUNT
  ======================================================= */

  const [attackNumber, setAttackNumber] =
    useState(0);

  const attackNumberRef =
    useRef(0);

  useEffect(() => {
    attackNumberRef.current =
      attackNumber;
  }, [attackNumber]);

  /* =======================================================
     ROUND
  ======================================================= */

  const [round, setRound] =
    useState(1);

  /* =======================================================
     FIREBALL
  ======================================================= */

  const [fireball, setFireball] =
    useState(null);

  /*
    fireball:
    {
      id,
      targetX
    }
  */

  /* =======================================================
     IMPACT ZONE
  ======================================================= */

  const [impactZone, setImpactZone] =
    useState(null);

  /*
    impactZone:
    {
      x,
      radius
    }
  */

  /* =======================================================
     RAMA ATTACK
  ======================================================= */

  const [shootReady, setShootReady] =
    useState(false);

  const shootReadyRef =
    useRef(false);

  useEffect(() => {
    shootReadyRef.current =
      shootReady;
  }, [shootReady]);

  const [arrowFlying, setArrowFlying] =
    useState(false);

  const arrowFlyingRef =
    useRef(false);

  useEffect(() => {
    arrowFlyingRef.current =
      arrowFlying;
  }, [arrowFlying]);

  /* =======================================================
     TATAKA VISUAL STATE
  ======================================================= */

  const [tatakaState, setTatakaState] =
    useState("normal");

  /*
    normal
    attacking
    hit
    defeated
  */

  /* =======================================================
     TIMERS
  ======================================================= */

  const attackTimer =
    useRef(null);

  const impactTimer =
    useRef(null);

  const messageTimer =
    useRef(null);

  /* =======================================================
     MESSAGE
  ======================================================= */

  const [message, setMessage] =
    useState("");

  const [subMessage, setSubMessage] =
    useState("");

  const showMessage = useCallback(
    (
      title,
      subtitle = "",
      duration = 1200
    ) => {
      setMessage(title);
      setSubMessage(subtitle);

      if (messageTimer.current) {
        window.clearTimeout(
          messageTimer.current
        );
      }

      messageTimer.current =
        window.setTimeout(() => {
          setMessage("");
          setSubMessage("");
        }, duration);
    },
    []
  );

  /* =======================================================
     RESET
  ======================================================= */

  const resetBattle =
    useCallback(() => {
      setPhase("tataka");
      phaseRef.current =
        "tataka";

      setAttackNumber(0);
      attackNumberRef.current =
        0;

      setRound(1);

      setRamaX(78);
      ramaXRef.current =
        78;

      setRamaHp(
        RAMA_MAX_HP
      );
      ramaHpRef.current =
        RAMA_MAX_HP;

      setTatakaHp(
        TATAKA_MAX_HP
      );
      tatakaHpRef.current =
        TATAKA_MAX_HP;

      setFireball(null);
      setImpactZone(null);

      setShootReady(false);
      shootReadyRef.current =
        false;

      setArrowFlying(false);
      arrowFlyingRef.current =
        false;

      setTatakaState(
        "normal"
      );

      setMessage("");
      setSubMessage("");

      if (attackTimer.current) {
        window.clearTimeout(
          attackTimer.current
        );
      }

      if (impactTimer.current) {
        window.clearTimeout(
          impactTimer.current
        );
      }
    }, []);

  /* =======================================================
     START
  ======================================================= */

  const beginEncounter = () => {
    setScreen("tutorial");
  };

  const startBattle = () => {
    resetBattle();

    /* =====================================================
       TATAKA AUDIO
    ===================================================== */

    const audio =
      tatakaAudioRef.current;

    if (audio) {
      audio.currentTime = 0;
      audio.loop = true;
      audio.volume = 0.4;

      audio.play().catch(() => {
        // Playback may still be blocked by the browser.
      });
    }

    setScreen("battle");

    showMessage(
      "TATAKA ATTACKS",
      "Move Rama outside the circle.",
      1400
    );
  };

  /* =======================================================
     MOVE RAMA
  ======================================================= */

  const moveRama =
    useCallback(
      (direction) => {
        if (
          screen !== "battle"
        ) {
          return;
        }

        setRamaX((current) => {
          const next =
            Math.min(
              Math.max(
                current + direction,
                RAMA_MIN_X
              ),
              RAMA_MAX_X
            );

          ramaXRef.current =
            next;

          return next;
        });
      },
      [screen]
    );

  /* =======================================================
     RAMA DAMAGE
  ======================================================= */

  const registerRamaHit =
    useCallback(() => {
      const nextHp =
        Math.max(
          ramaHpRef.current - 1,
          0
        );

      ramaHpRef.current =
        nextHp;

      setRamaHp(nextHp);

      if (nextHp <= 0) {
        showMessage(
          "IMPACT",
          "Rama has been overwhelmed.",
          1000
        );

        if (
          tatakaAudioRef.current
        ) {
          tatakaAudioRef.current.pause();
          tatakaAudioRef.current.currentTime = 0;
        }

        window.setTimeout(() => {
          setScreen("failed");
        }, 650);

        return false;
      }

      showMessage(
        "IMPACT",
        "Move farther outside the next circle.",
        1000
      );

      return true;
    }, [showMessage]);

  /* =======================================================
     TATAKA ATTACK
  ======================================================= */

  const launchFireball =
    useCallback(() => {
      if (
        screen !== "battle" ||
        phaseRef.current !== "tataka"
      ) {
        return;
      }

      /*
        Target exactly where Rama is standing
        at the moment Tataka launches the attack.
      */
      const targetX =
        ramaXRef.current;

      const currentAttack =
        attackNumberRef.current;

      const projectileId =
        `fireball-${Date.now()}-${currentAttack}`;

      setFireball({
        id: projectileId,
        targetX,
      });

      /*
        The visible circle uses the exact
        same target and collision radius.
      */
      setImpactZone({
        x: targetX,
        radius: IMPACT_RADIUS,
      });

      setTatakaState(
        "attacking"
      );

      showMessage(
        "TATAKA FIRES",
        "Move outside the impact circle.",
        900
      );

      /*
        When the fireball arrives, compare
        Rama's CURRENT position against the
        ORIGINAL target position.
      */
      impactTimer.current =
        window.setTimeout(() => {
          setFireball(null);
          setImpactZone(null);

          const currentRamaX =
            ramaXRef.current;

          const distanceFromImpact =
            Math.abs(
              currentRamaX -
                targetX
            );

          /*
            IMPORTANT:
            Only positions INSIDE the actual
            radius count as a hit.
          */
          const wasHit =
            distanceFromImpact <=
            IMPACT_RADIUS;

          if (wasHit) {
            const survived =
              registerRamaHit();

            if (!survived) {
              return;
            }
          } else {
            showMessage(
              "DODGED",
              "Rama escaped the impact.",
              700
            );
          }

          /*
            FIRST ATTACK
            → SECOND ATTACK
          */
          if (
            currentAttack === 0
          ) {
            setAttackNumber(1);

            attackNumberRef.current =
              1;

            attackTimer.current =
              window.setTimeout(() => {
                launchFireball();
              }, ATTACK_GAP);

            return;
          }

          /*
            SECOND ATTACK
            → RAMA'S TURN
          */
          setAttackNumber(0);

          attackNumberRef.current =
            0;

          setPhase("rama");

          phaseRef.current =
            "rama";

          setShootReady(true);

          shootReadyRef.current =
            true;

          setTatakaState(
            "normal"
          );

          showMessage(
            "RĀMA'S TURN",
            "Click SHOOT ARROW.",
            1500
          );
        }, FIREBALL_TRAVEL_TIME);
    }, [
      screen,
      registerRamaHit,
      showMessage,
    ]);

  /* =======================================================
     START ATTACK CYCLE
  ======================================================= */

  useEffect(() => {
    if (
      screen !== "battle" ||
      phase !== "tataka"
    ) {
      return undefined;
    }

    attackTimer.current =
      window.setTimeout(() => {
        launchFireball();
      }, 650);

    return () => {
      if (attackTimer.current) {
        window.clearTimeout(
          attackTimer.current
        );
      }
    };
  }, [
    screen,
    phase,
  ]);

  /* =======================================================
     TATAKA DAMAGE
  ======================================================= */

  const registerTatakaHit =
    useCallback(() => {
      const nextHp =
        Math.max(
          tatakaHpRef.current - 1,
          0
        );

      tatakaHpRef.current =
        nextHp;

      setTatakaHp(nextHp);

      setTatakaState(
        "hit"
      );

      if (nextHp <= 0) {
        setTatakaState(
          "defeated"
        );

        if (
          tatakaAudioRef.current
        ) {
          tatakaAudioRef.current.pause();
          tatakaAudioRef.current.currentTime = 0;
        }

        showMessage(
          "TATAKA FALLS",
          "The first great trial is complete.",
          1800
        );

        window.setTimeout(() => {
          setScreen("victory");
        }, 1900);

        return;
      }

      showMessage(
        `HIT — ${nextHp} HP REMAINING`,
        "Tataka attacks again.",
        850
      );

      setRound(
        (current) =>
          current + 1
      );

      setPhase("tataka");

      phaseRef.current =
        "tataka";

      setTatakaState(
        "normal"
      );
    }, [showMessage]);

  /* =======================================================
     SHOOT ARROW
  ======================================================= */

  const shootArrow =
    useCallback(() => {
      if (
        screen !== "battle" ||
        phaseRef.current !== "rama" ||
        !shootReadyRef.current ||
        arrowFlyingRef.current
      ) {
        return;
      }

      setShootReady(false);

      shootReadyRef.current =
        false;

      setArrowFlying(true);

      arrowFlyingRef.current =
        true;

      showMessage(
        "RĀMA RELEASES",
        "The arrow crosses the clearing.",
        900
      );

      /*
        Arrow travel duration is unchanged.
        Only the visual trajectory is changed.
      */
      window.setTimeout(() => {
        setArrowFlying(false);

        arrowFlyingRef.current =
          false;

        registerTatakaHit();
      }, 760);
    }, [
      screen,
      registerTatakaHit,
      showMessage,
    ]);

  /* =======================================================
     STABLE SPACE HANDLER
  ======================================================= */

  const shootArrowRef =
    useRef(shootArrow);

  useEffect(() => {
    shootArrowRef.current =
      shootArrow;
  }, [shootArrow]);

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        if (
          screen !== "battle"
        ) {
          return;
        }

        const key =
          event.key.toLowerCase();

        if (
          key === "a" ||
          key === "arrowleft"
        ) {
          event.preventDefault();

          moveRama(-2.4);
        }

        if (
          key === "d" ||
          key === "arrowright"
        ) {
          event.preventDefault();

          moveRama(2.4);
        }

        if (
          event.code === "Space"
        ) {
          event.preventDefault();

          shootArrowRef.current();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    screen,
    moveRama,
  ]);

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      if (attackTimer.current) {
        window.clearTimeout(
          attackTimer.current
        );
      }

      if (impactTimer.current) {
        window.clearTimeout(
          impactTimer.current
        );
      }

      if (messageTimer.current) {
        window.clearTimeout(
          messageTimer.current
        );
      }

      if (
        tatakaAudioRef.current
      ) {
        tatakaAudioRef.current.pause();
        tatakaAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      className={[
        "tataka-game",
        `tataka-game--${screen}`,
        shootReady
          ? "tataka-game--shoot-ready"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >

      {/* ===================================================
          AUDIO
      =================================================== */}

      <audio
        ref={tatakaAudioRef}
        src="/audio/tataka.mp3"
        preload="auto"
        loop
      />

      {/* ===================================================
          WORLD
      =================================================== */}

      <img
        src={
          screen === "intro" ||
          screen === "tutorial"
            ? ASSETS.forest
            : ASSETS.battle
        }
        alt=""
        className="tataka-world"
        draggable="false"
      />

      <div className="tataka-game__world-shade" />
      <div className="tataka-game__world-mist" />
      <div className="tataka-game__vignette" />
      <div className="tataka-game__grain" />

      {/* ===================================================
          TATAKA
      =================================================== */}

      {(screen === "battle" ||
        screen === "victory") && (
        <motion.img
          src={ASSETS.tataka}
          alt="Tataka"
          className={[
            "tataka-character",
            tatakaState === "hit"
              ? "tataka-character--hit"
              : "",
            tatakaState === "defeated"
              ? "tataka-character--defeated"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          animate={{
            y:
              tatakaState === "hit"
                ? [0, -6, 2, 0]
                : [0, -2, 0],
          }}
          transition={{
            duration:
              tatakaState === "hit"
                ? 0.4
                : 2.4,

            repeat:
              tatakaState === "hit"
                ? 0
                : Infinity,

            ease:
              "easeInOut",
          }}
          draggable="false"
        />
      )}

      {/* ===================================================
          RAMA
      =================================================== */}

      {screen === "battle" && (
        <motion.img
          src={ASSETS.rama}
          alt="Rama"
          className={[
            "rama-character",
            shootReady
              ? "rama-character--ready"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            left:
              `${ramaX}%`,
          }}
          animate={{
            y:
              shootReady
                ? [0, -3, 0]
                : [0, -2, 0],
          }}
          transition={{
            duration:
              shootReady
                ? 0.5
                : 2.3,

            repeat:
              Infinity,

            ease:
              "easeInOut",
          }}
          draggable="false"
        />
      )}

      {/* ===================================================
          HUD
      =================================================== */}

      {screen === "battle" && (
        <header className="tataka-hud">

          <div className="tataka-hud__left">

            <Sparkles
              size={13}
              strokeWidth={1.1}
            />

            <span>
              TATAKA · FIRST GREAT TRIAL
            </span>

          </div>

          <div className="tataka-hud__center">

            <small>
              THE FIRST GREAT TRIAL
            </small>

            <strong>
              TATAKA
            </strong>

          </div>

          <div className="tataka-hud__right">

            <span>
              RĀMA
            </span>

            <div className="rama-health">

              {[0, 1, 2].map(
                (index) => (
                  <i
                    key={index}
                    className={
                      index < ramaHp
                        ? "is-active"
                        : ""
                    }
                  />
                )
              )}

            </div>

          </div>

        </header>
      )}

      <AnimatePresence mode="wait">

        {/* =================================================
            INTRO
        ================================================= */}

        {screen === "intro" && (
          <motion.div
            key="intro"
            className="
              tataka-overlay
              tataka-overlay--intro
            "
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >

            <div className="tataka-intro">

              <span>
                THE FIRST GREAT TRIAL
              </span>

              <div className="tataka-intro__ornament">
                <i />
                <b>✦</b>
                <i />
              </div>

              <h1>
                Tataka
              </h1>

              <p>
                The forest has become a
                place of fear.
              </p>

              <small>
                Rama's first great trial
                begins here.
              </small>

              <button
                type="button"
                className="tataka-button"
                onClick={
                  beginEncounter
                }
              >
                <span>
                  BEGIN
                </span>

                <ArrowRightIcon
                  size={16}
                />
              </button>

            </div>

          </motion.div>
        )}

        {/* =================================================
            TUTORIAL
        ================================================= */}

        {screen === "tutorial" && (
          <motion.div
            key="tutorial"
            className="
              tataka-overlay
              tataka-overlay--tutorial
            "
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >

            <div className="tataka-tutorial">

              <Sparkles
                size={15}
              />

              <h2>
                The Trial
              </h2>

              <p>
                Move Rama outside the glowing
                circle when Tataka attacks.
                After two attacks, shoot.
              </p>

              <div className="tutorial-controls">

                <div>
                  <b>
                    A / D
                  </b>

                  <span>
                    MOVE
                  </span>
                </div>

                <div>
                  <b>
                    SPACE
                  </b>

                  <span>
                    SHOOT
                  </span>
                </div>

                <div>
                  <b>
                    CLICK
                  </b>

                  <span>
                    SHOOT
                  </span>
                </div>

              </div>

              <p className="tutorial-note">
                Six successful hits defeat Tataka.
              </p>

              <button
                type="button"
                className="tataka-button"
                onClick={
                  startBattle
                }
              >
                <span>
                  START
                </span>

                <ArrowRightIcon
                  size={16}
                />
              </button>

            </div>

          </motion.div>
        )}

        {/* =================================================
            BATTLE
        ================================================= */}

        {screen === "battle" && (
          <motion.div
            key="battle"
            className="tataka-battle"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
          >

            {/* TATAKA HP */}

            <div className="tataka-hp">

              <span>
                TATAKA
              </span>

              <div>
                {Array.from(
                  {
                    length:
                      TATAKA_MAX_HP,
                  },
                  (_, index) => (
                    <i
                      key={index}
                      className={
                        index < tatakaHp
                          ? "alive"
                          : "empty"
                      }
                    />
                  )
                )}
              </div>

              <small>
                HP {tatakaHp} / {TATAKA_MAX_HP}
              </small>

            </div>

            {/* IMPACT CIRCLE */}

            {impactZone && (
              <motion.div
                className="impact-zone"
                style={{
                  left:
                    `${impactZone.x}%`,
                }}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: [
                    0.42,
                    0.95,
                    0.42,
                  ],
                  scale: [
                    0.94,
                    1.05,
                    0.94,
                  ],
                }}
                transition={{
                  duration: 0.65,
                  repeat:
                    Infinity,
                }}
              >
                <div />

                <span>
                  MOVE
                </span>

              </motion.div>
            )}

            {/* FIREBALL */}

            {fireball && (
              <motion.div
                className="fireball"
                key={fireball.id}
                initial={{
                  left: "25%",
                  top: "57%",
                  opacity: 0,
                  scale: 0.55,
                }}
                animate={{
                  left:
                    `${fireball.targetX}%`,
                  top: "71%",
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration:
                    FIREBALL_TRAVEL_TIME /
                    1000,
                  ease: "linear",
                }}
              >
                <span className="fireball-glow" />
                <span className="fireball-flame" />
                <span className="fireball-core" />
              </motion.div>
            )}

            {/* =================================================
                RAMA ARROW — MIRROR OF TATAKA FIREBALL
                LOWER-RIGHT → UPPER-LEFT
            ================================================= */}

            {arrowFlying && (
              <motion.div
                className="rama-arrow"
                initial={{
                  left:
                    `${ramaX}%`,
                  top: "71%",
                  opacity: 0,
                }}
                animate={{
                  left: "39%",
                  top: "48%",
                  opacity: 1,
                }}
                transition={{
                  duration: 0.76,
                  ease: "linear",
                }}
                transformTemplate={() =>
                  "translate(-50%, -50%) rotate(30deg)"
                }
              >
                <span className="arrow-trail" />
                <span className="arrow-shaft" />
                <span className="arrow-head" />
              </motion.div>
            )}

            {/* OBJECTIVE */}

            <div className="battle-objective">

              <small>
                ROUND {round}
              </small>

              <strong>
                {phase === "tataka"
                  ? "DODGE THE ATTACK"
                  : "RĀMA'S TURN — SHOOT"}
              </strong>

            </div>

            {/* SHOOT */}

            <button
              type="button"
              className={[
                "shoot-button",
                shootReady
                  ? "is-ready"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={
                !shootReady ||
                arrowFlying
              }
              onClick={
                shootArrow
              }
            >

              <Target
                size={17}
                strokeWidth={1.05}
              />

              <span>
                {shootReady
                  ? "SHOOT ARROW"
                  : "WAIT"}
              </span>

              <small>
                SPACE / CLICK
              </small>

            </button>

            {/* MOVEMENT */}

            <div className="movement-hint">

              <span>
                A / D
              </span>

              <small>
                MOVE RĀMA
              </small>

            </div>

            {/* MESSAGE */}

            <AnimatePresence>
              {message && (
                <motion.div
                  className="battle-message"
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                >

                  <strong>
                    {message}
                  </strong>

                  <span>
                    {subMessage}
                  </span>

                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}

        {/* =================================================
            FAILED
        ================================================= */}

        {screen === "failed" && (
          <motion.div
            key="failed"
            className="end-screen"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
          >

            <Shield
              size={38}
              strokeWidth={1}
            />

            <span>
              THE TRIAL CONTINUES
            </span>

            <h2>
              Rama was overcome.
            </h2>

            <p>
              Move Rama outside the impact
              circle before the fireball lands.
            </p>

            <button
              type="button"
              className="tataka-button"
              onClick={
                startBattle
              }
            >
              <span>
                TRY AGAIN
              </span>

              <ArrowRightIcon
                size={16}
              />
            </button>

          </motion.div>
        )}

        {/* =================================================
            VICTORY
        ================================================= */}

        {screen === "victory" && (
          <motion.div
            key="victory"
            className="
              end-screen
              end-screen--victory
            "
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
          >

            <Sparkles
              size={40}
              strokeWidth={1}
            />

            <span>
              FIRST GREAT TRIAL
            </span>

            <h2>
              The forest is quiet again.
            </h2>

            <p>
              Six successful arrows brought
              the confrontation to its end.
              Rama waited for each opening
              and acted with discipline.
            </p>

            <blockquote>
              ACT FROM DUTY.
              <br />
              NEVER FROM ANGER.
            </blockquote>

            <button
              type="button"
              className="tataka-button"
              onClick={
                onComplete
              }
            >
              <span>
                RETURN TO THE JOURNEY
              </span>

              <ArrowRightIcon
                size={16}
              />
            </button>

          </motion.div>
        )}

      </AnimatePresence>

    </section>
  );
}