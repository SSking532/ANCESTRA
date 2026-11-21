import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import "./RamayanaStory.css";

export default function RamayanaStory() {
  const thunderRef = useRef(null);
  const navigate = useNavigate();

  const [phase, setPhase] = useState("clouds");

  useEffect(() => {
    /*
    =========================================================
    CINEMATIC TIMELINE

    0.0s  → Golden clouds
    1.5s  → Clouds begin clearing
    2.1s  → Divine arrow begins
    4.0s  → Title begins appearing
    5.8s  → Opening completes
    7.2s  → Navigate to chapters
    =========================================================
    */

    const cloudTimer = setTimeout(() => {
      setPhase("arrow");
    }, 1500);

    const titleTimer = setTimeout(() => {
      setPhase("title");
    }, 4000);

    const completeTimer = setTimeout(() => {
      setPhase("complete");
    }, 5800);

    const navigateTimer = setTimeout(() => {
      navigate("/journey/ramayana/chapters");
    }, 7200);

    return () => {
      clearTimeout(cloudTimer);
      clearTimeout(titleTimer);
      clearTimeout(completeTimer);
      clearTimeout(navigateTimer);
    };
  }, [navigate]);

  /* =========================================================
     THUNDER
  ========================================================= */

  useEffect(() => {
    if (phase !== "arrow") {
      return;
    }

    const audio = thunderRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = 0;

    const playThunder = async () => {
      try {
        await audio.play();
      } catch {
        // Animation continues if autoplay is blocked.
      }
    };

    playThunder();
  }, [phase]);

  return (
    <main className="ramayana-story">

      {/* =====================================================
          AUDIO
      ===================================================== */}

      <audio
        ref={thunderRef}
        src="/audio/thunder.mp3"
        preload="auto"
      />

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="ramayana-story__background" />

      {/* =====================================================
          SACRED GEOMETRY
      ===================================================== */}

      <div className="ramayana-story__geometry">
        <span className="geometry-ring geometry-ring--one" />
        <span className="geometry-ring geometry-ring--two" />
        <span className="geometry-ring geometry-ring--three" />

        <span className="geometry-diamond" />
        <span className="geometry-cross" />
      </div>

      {/* =====================================================
          PARTICLES
      ===================================================== */}

      <div className="ramayana-story__particles">

        {Array.from({ length: 42 }).map((_, index) => (
          <span
            key={index}
            className="story-particle"
            style={{
              "--x": `${(index * 37) % 100}%`,
              "--y": `${(index * 61) % 100}%`,
              "--delay": `${(index % 9) * 0.18}s`,
              "--size": `${2 + (index % 3)}px`,
            }}
          />
        ))}

      </div>

      {/* =====================================================
          GOLDEN CLOUD FIELD
      ===================================================== */}

      <AnimatePresence>

        {phase !== "complete" && (
          <motion.div
            className="ramayana-clouds"

            initial={{
              opacity: 1,
            }}

            animate={{
              opacity:
                phase === "clouds"
                  ? 1
                  : 0,
            }}

            transition={{
              duration: 1.5,
              ease: [0.76, 0, 0.24, 1],
            }}
          >

            <div className="cloud-layer cloud-layer--base" />
            <div className="cloud-layer cloud-layer--left" />
            <div className="cloud-layer cloud-layer--right" />
            <div className="cloud-layer cloud-layer--top" />
            <div className="cloud-layer cloud-layer--bottom" />
            <div className="cloud-layer cloud-layer--front" />

            {/* LEFT RIBBON */}

            <motion.div
              className="cloud-ribbon cloud-ribbon--one"

              animate={{
                x:
                  phase === "clouds"
                    ? 0
                    : "-115vw",

                opacity:
                  phase === "clouds"
                    ? 1
                    : 0,
              }}

              transition={{
                duration: 1.5,
                ease: [0.76, 0, 0.24, 1],
              }}
            />

            {/* RIGHT RIBBON */}

            <motion.div
              className="cloud-ribbon cloud-ribbon--two"

              animate={{
                x:
                  phase === "clouds"
                    ? 0
                    : "115vw",

                opacity:
                  phase === "clouds"
                    ? 1
                    : 0,
              }}

              transition={{
                duration: 1.5,
                delay: 0.05,
                ease: [0.76, 0, 0.24, 1],
              }}
            />

            {/* TOP RIBBON */}

            <motion.div
              className="cloud-ribbon cloud-ribbon--three"

              animate={{
                y:
                  phase === "clouds"
                    ? 0
                    : "-110vh",

                opacity:
                  phase === "clouds"
                    ? 1
                    : 0,
              }}

              transition={{
                duration: 1.5,
                delay: 0.08,
                ease: [0.76, 0, 0.24, 1],
              }}
            />

            {/* BOTTOM RIBBON */}

            <motion.div
              className="cloud-ribbon cloud-ribbon--four"

              animate={{
                y:
                  phase === "clouds"
                    ? 0
                    : "110vh",

                opacity:
                  phase === "clouds"
                    ? 1
                    : 0,
              }}

              transition={{
                duration: 1.5,
                delay: 0.08,
                ease: [0.76, 0, 0.24, 1],
              }}
            />

            {/* CORE */}

            <motion.div
              className="cloud-core"

              animate={{
                scale:
                  phase === "clouds"
                    ? 1
                    : 1.8,

                opacity:
                  phase === "clouds"
                    ? 0.95
                    : 0,
              }}

              transition={{
                duration: 1.25,
                ease: "easeOut",
              }}
            />

          </motion.div>
        )}

      </AnimatePresence>

      {/* =====================================================
          DIVINE FLASH
      ===================================================== */}

      <AnimatePresence>

        {phase === "arrow" && (
          <motion.div
            className="ramayana-flash"

            initial={{
              opacity: 0,
            }}

            animate={{
              opacity: [0, 0.8, 0],
            }}

            transition={{
              duration: 0.7,
              times: [0, 0.2, 1],
              ease: "easeOut",
            }}
          />
        )}

      </AnimatePresence>

      {/* =====================================================
          TOP LABEL
      ===================================================== */}

      <motion.div
        className="story-top-label"

        initial={{
          opacity: 0,
          y: -20,
          x: "-50%",
        }}

        animate={{
          opacity:
            phase === "title" ||
            phase === "complete"
              ? 1
              : 0,

          y:
            phase === "title" ||
            phase === "complete"
              ? 0
              : -20,

          x: "-50%",
        }}

        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        THE EPIC OF DHARMA
      </motion.div>

      {/* =====================================================
          DIVINE ARROW

          THIS IS NOW ONE SINGLE SVG.

          No separate shaft.
          No separate fletching.
          No separate trail.
          No CSS rotation.
          No diagonal pieces.

          The SVG itself is rigid and moves only vertically.
      ===================================================== */}

      <AnimatePresence>

        {phase === "arrow" && (
          <motion.div
            className="ramayana-divine-arrow"

            initial={{
              top: "118vh",
              opacity: 0,
            }}

            animate={{
              top: "-84vh",
              opacity: [0, 1, 1, 1, 0],
            }}

            exit={{
              opacity: 0,
            }}

            transition={{
              top: {
                duration: 3.6,
                ease: [0.65, 0, 0.35, 1],
              },

              opacity: {
                duration: 3.6,

                times: [
                  0,
                  0.1,
                  0.24,
                  0.82,
                  1,
                ],

                ease: "easeInOut",
              },
            }}
          >

            <svg
              className="ramayana-divine-arrow__svg"
              viewBox="0 0 100 700"
              preserveAspectRatio="xMidYMin meet"
              aria-hidden="true"
            >

              <defs>

                <linearGradient
                  id="ramayanaArrowGold"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#fff5cc"
                  />

                  <stop
                    offset="24%"
                    stopColor="#e9c76d"
                  />

                  <stop
                    offset="50%"
                    stopColor="#fff0b8"
                  />

                  <stop
                    offset="78%"
                    stopColor="#d9aa4e"
                  />

                  <stop
                    offset="100%"
                    stopColor="#fff1bd"
                  />
                </linearGradient>

                <filter
                  id="ramayanaArrowGlow"
                  x="-100%"
                  y="-20%"
                  width="300%"
                  height="140%"
                >
                  <feGaussianBlur
                    stdDeviation="5"
                    result="blur"
                  />

                  <feMerge>
                    <feMergeNode
                      in="blur"
                    />

                    <feMergeNode
                      in="SourceGraphic"
                    />
                  </feMerge>
                </filter>

                <filter
                  id="ramayanaArrowSoftGlow"
                  x="-200%"
                  y="-20%"
                  width="400%"
                  height="140%"
                >
                  <feGaussianBlur
                    stdDeviation="13"
                  />
                </filter>

              </defs>

              {/* =================================================
                  SOFT OUTER GLOW
              ================================================= */}

              <line
                x1="50"
                y1="36"
                x2="50"
                y2="650"

                stroke="#efc96e"

                strokeWidth="18"

                strokeLinecap="round"

                opacity="0.18"

                filter="
                  url(#ramayanaArrowSoftGlow)
                "
              />

              {/* =================================================
                  CONTINUOUS ARROW SHAFT
              ================================================= */}

              <line
                x1="50"
                y1="42"
                x2="50"
                y2="650"

                stroke="
                  url(#ramayanaArrowGold)
                "

                strokeWidth="4"

                strokeLinecap="round"

                filter="
                  url(#ramayanaArrowGlow)
                "
              />

              {/* =================================================
                  BRIGHT CORE LINE
              ================================================= */}

              <line
                x1="50"
                y1="44"
                x2="50"
                y2="646"

                stroke="#fff5cf"

                strokeWidth="1.4"

                strokeLinecap="round"

                opacity="0.95"
              />

              {/* =================================================
                  SINGLE ARROWHEAD
                  POINTS UPWARD
              ================================================= */}

              <polygon
                points="
                  50,0
                  28,42
                  43,36
                  43,58
                  57,58
                  57,36
                  72,42
                "

                fill="
                  url(#ramayanaArrowGold)
                "

                filter="
                  url(#ramayanaArrowGlow)
                "
              />

              {/* =================================================
                  ARROWHEAD INNER HIGHLIGHT
              ================================================= */}

              <polygon
                points="
                  50,7
                  38,36
                  50,31
                  62,36
                "

                fill="#fff5ce"

                opacity="0.92"
              />

              {/* =================================================
                  TAIL / FLETCHING
                  ALSO SYMMETRIC — NO SLOPE IN SHAFT
              ================================================= */}

              <path
                d="
                  M42 650
                  L25 668
                  L42 663
                  L50 676
                  L58 663
                  L75 668
                  L58 650
                  Z
                "

                fill="
                  url(#ramayanaArrowGold)
                "

                filter="
                  url(#ramayanaArrowGlow)
                "
              />

              {/* =================================================
                  TAIL HIGHLIGHT
              ================================================= */}

              <path
                d="
                  M43 651
                  L32 663
                  L46 658
                  L50 668
                  L54 658
                  L68 663
                  L57 651
                "

                fill="#fff0bd"

                opacity="0.76"
              />

            </svg>

          </motion.div>
        )}

      </AnimatePresence>

      {/* =====================================================
          CENTRAL TITLE
      ===================================================== */}

      <AnimatePresence>

        {(phase === "title" ||
          phase === "complete") && (

          <motion.section
            className="ramayana-title-block"

            initial={{
              opacity: 0,
              scale: 0.94,
              y: 20,
            }}

            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}

            transition={{
              duration: 1.25,
              ease: [0.16, 1, 0.3, 1],
            }}
          >

            <div className="title-eyebrow">
              THE CHRONICLE OF
            </div>

            <h1>
              RAMAYANA
            </h1>

            <div className="title-ornament">

              <span />

              <i>
                ✦
              </i>

              <span />

            </div>

            <div className="title-subtitle">
              THE EPIC OF DHARMA
            </div>

          </motion.section>

        )}

      </AnimatePresence>

      {/* =====================================================
          FINAL VIGNETTE
      ===================================================== */}

      <motion.div
        className="ramayana-vignette"

        animate={{
          opacity:
            phase === "complete"
              ? 1
              : 0,
        }}

        transition={{
          duration: 1.2,
        }}
      />

    </main>
  );
}