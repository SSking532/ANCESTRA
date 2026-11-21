import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import AmbientBackground from "../../components/cinematic/AmbientBackground";
import Navbar from "../../components/layout/Navbar";

function Home() {
  return (
    <main className="home">
      {/* =====================================================
          NAVIGATION
      ===================================================== */}
      <Navbar />

      {/* =====================================================
          CINEMATIC BACKGROUND
      ===================================================== */}
      <AmbientBackground />

      {/* =====================================================
          DIVINE ATMOSPHERE
      ===================================================== */}

      {/* Central divine light */}
      <motion.div
        style={{
          position: "absolute",
          width: "520px",
          height: "520px",
          borderRadius: "50%",
          left: "50%",
          top: "45%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(201,164,92,0.14) 0%, rgba(201,164,92,0.05) 35%, transparent 70%)",
          filter: "blur(25px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.55, 0.8, 0.55],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Divine light rays */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "0",
          width: "2px",
          height: "100%",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(to bottom, transparent, rgba(201,164,92,0.08), transparent)",
          filter: "blur(18px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
        animate={{
          opacity: [0.2, 0.55, 0.2],
          scaleY: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* =====================================================
          DIVINE CLOUDS / MIST
      ===================================================== */}

      <motion.div
        style={{
          position: "absolute",
          left: "-15%",
          bottom: "-5%",
          width: "65%",
          height: "28%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(190,170,130,0.11), transparent 70%)",
          filter: "blur(45px)",
          pointerEvents: "none",
          zIndex: 2,
        }}
        animate={{
          x: [0, 80, 0],
          opacity: [0.35, 0.65, 0.35],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        style={{
          position: "absolute",
          right: "-18%",
          top: "8%",
          width: "65%",
          height: "25%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(180,150,105,0.08), transparent 70%)",
          filter: "blur(55px)",
          pointerEvents: "none",
          zIndex: 2,
        }}
        animate={{
          x: [0, -90, 0],
          opacity: [0.25, 0.5, 0.25],
          scale: [1.05, 1, 1.05],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* =====================================================
          FLOATING DIVINE PARTICLES
      ===================================================== */}

      {Array.from({ length: 18 }).map((_, index) => (
        <motion.span
          key={index}
          style={{
            position: "absolute",
            left: `${8 + ((index * 17) % 84)}%`,
            top: `${12 + ((index * 23) % 72)}%`,
            width: index % 3 === 0 ? "3px" : "2px",
            height: index % 3 === 0 ? "3px" : "2px",
            borderRadius: "50%",
            background: "#c9a45c",
            boxShadow: "0 0 12px rgba(201,164,92,0.7)",
            pointerEvents: "none",
            zIndex: 3,
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, index % 2 === 0 ? 12 : -12, 0],
            opacity: [0.05, 0.7, 0.05],
            scale: [0.7, 1.2, 0.7],
          }}
          transition={{
            duration: 4 + (index % 5),
            delay: index * 0.25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* =====================================================
          SACRED GEOMETRY
      ===================================================== */}

      <div className="sacred-geometry">
        <motion.div
          className="geometry geometry--outer"
          animate={{ rotate: 360 }}
          transition={{
            duration: 100,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <motion.div
          className="geometry geometry--middle"
          animate={{ rotate: -360 }}
          transition={{
            duration: 75,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <motion.div
          className="geometry geometry--inner"
          animate={{ rotate: 360 }}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Divine center */}
        <motion.div
          className="geometry-center"
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* =====================================================
          DECORATIVE FRAME
      ===================================================== */}

      <div className="page-frame">
        <span className="frame-corner frame-corner--tl" />
        <span className="frame-corner frame-corner--tr" />
        <span className="frame-corner frame-corner--bl" />
        <span className="frame-corner frame-corner--br" />
      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero">
        {/* Eyebrow */}
        <motion.div
          className="hero__eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.2,
            delay: 0.5,
          }}
        >
          AN INTERACTIVE JOURNEY THROUGH INDIA'S EPIC HERITAGE
        </motion.div>

        {/* Title */}
        <div className="hero__title-wrapper">
          <motion.div
            className="hero__pre-title"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              opacity: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              },
              scale: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              },
              delay: 0.9,
            }}
          >
            ✦
          </motion.div>

          <motion.h1
            className="hero__title"
            initial={{
              opacity: 0,
              y: 80,
              scale: 0.96,
              filter: "blur(18px)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 1.8,
              delay: 1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            ANCESTRA
          </motion.h1>

          <motion.div
            className="hero__title-line"
            initial={{
              scaleX: 0,
              opacity: 0,
            }}
            animate={{
              scaleX: 1,
              opacity: 1,
            }}
            transition={{
              duration: 1.4,
              delay: 2.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </div>

        {/* Tagline */}
        <motion.div
          className="hero__tagline"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.3,
            delay: 2.3,
          }}
        >
          <span>Stories we inherited.</span>
          <span>Questions we still carry.</span>
        </motion.div>

        {/* Philosophy */}
        <motion.div
          className="hero__philosophy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.2,
            delay: 3,
          }}
        >
          <span className="philosophy-line">
            THE PAST CANNOT BE CHANGED.
          </span>

          <span className="philosophy-divider" />

          <span className="philosophy-line philosophy-line--gold">
            BUT THE WAY WE UNDERSTAND IT CAN.
          </span>
        </motion.div>

        {/* Begin Journey */}
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1.1,
            delay: 3.6,
          }}
        >
          <Link to="/journey" className="journey-button">
            <span>BEGIN THE JOURNEY</span>

            <span className="journey-button__icon">
              <ArrowRight size={17} strokeWidth={1.3} />
            </span>
          </Link>
        </motion.div>
      </section>

      {/* =====================================================
          BOTTOM INFORMATION
      ===================================================== */}

      <motion.div
        className="hero-bottom"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.2,
          delay: 4.2,
        }}
      >
        {/* Left */}
        <div className="hero-bottom__side">
          <span>BHARATA</span>
          <span>∞</span>
          <span>TIMELESS</span>
        </div>

        
        
        {/* Right */}
        <div className="hero-bottom__side hero-bottom__side--right">
          <span>RAMAYANA</span>
          <span>✦</span>
          <span>MAHABHARATA</span>
        </div>
      </motion.div>

      {/* =====================================================
          FINAL CINEMATIC REVEAL
      ===================================================== */}

      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{
          duration: 2.5,
          delay: 0.15,
          ease: "easeOut",
        }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, #161008 0%, #050403 75%)",
          pointerEvents: "none",
          zIndex: 50,
        }}
      />
    </main>
  );
}

export default Home;