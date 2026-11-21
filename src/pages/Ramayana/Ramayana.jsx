import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import "./Ramayana.css";

function Ramayana() {

  // =========================================================
  // SCROLL TO RAMAYANA WORLD
  // =========================================================

  const scrollToWorld = () => {
    const worldSection = document.getElementById("ramayana-world");

    if (worldSection) {
      worldSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <main className="ramayana">

      {/* =====================================================
          HERO BACKGROUND
      ===================================================== */}

      <div className="ramayana__background" />

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="ramayana__nav">

        <Link
          to="/journey"
          className="ramayana__back"
        >
          ← THE JOURNEY
        </Link>

        <div className="ramayana__brand">
          ANCESTRA
        </div>

        <div className="ramayana__label">
          RAMAYANA
        </div>

      </nav>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="ramayana__hero">

        <div className="ramayana__content">

          {/* EYEBROW */}

          <motion.div
            className="ramayana__eyebrow"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.3,
            }}
          >
            THE EPIC OF
          </motion.div>


          {/* TITLE */}

          <motion.h1
            className="ramayana__title"
            initial={{
              opacity: 0,
              y: 80,
              filter: "blur(15px)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 1.5,
              delay: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            RAMAYANA
          </motion.h1>


          {/* DIVIDER */}

          <motion.div
            className="ramayana__divider"
            initial={{
              scaleX: 0,
              transformOrigin: "center",
            }}
            animate={{
              scaleX: 1,
            }}
            transition={{
              duration: 1.2,
              delay: 1.5,
            }}
          />


          {/* TAGLINE */}

          <motion.p
            className="ramayana__tagline"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1,
              delay: 1.7,
            }}
          >
            Where dharma walks through destiny.
          </motion.p>


          {/* DESCRIPTION */}

          <motion.p
            className="ramayana__description"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 1,
              delay: 2.1,
            }}
          >
            Enter an ancient world of kingdoms, forests,
            devotion, sacrifice and destiny.
            <br />
            Walk beside Rama, Sita and those whose choices
            shaped an eternal epic.
          </motion.p>


          {/* =================================================
              SCROLL DOWN BUTTON

              IMPORTANT:
              THIS DOES NOT OPEN THE STORY PAGE.

              IT SCROLLS TO:
              #ramayana-world
          ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1,
              delay: 2.5,
            }}
          >

            <button
              type="button"
              className="ramayana__button ramayana__button--scroll"
              onClick={scrollToWorld}
            >
              <span>
                SCROLL DOWN TO EXPLORE
              </span>

              <ArrowDown
                size={17}
                strokeWidth={1.2}
              />
            </button>

          </motion.div>

        </div>


        {/* =====================================================
            HERO DIVINE LIGHT
        ===================================================== */}

        <div className="ramayana__sun-glow" />

        <div className="ramayana__light-rays" />


        {/* =====================================================
            HERO BOTTOM
        ===================================================== */}

        <div className="ramayana__bottom">

          <span>
            SACRIFICE
          </span>

          <span>
            ✦
          </span>

          <span>
            THE PATH OF DHARMA
          </span>

        </div>


        {/* =====================================================
            SCROLL INDICATOR
        ===================================================== */}

        <motion.div
          className="ramayana__scroll"
          animate={{
            y: [0, 8, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >

          <ArrowDown
            size={15}
            strokeWidth={1}
          />

        </motion.div>

      </section>


      {/* =====================================================
          RAMAYANA WORLD
      ===================================================== */}

      <section
        id="ramayana-world"
        className="ramayana__world"
      >

        {/* =====================================================
            WORLD INTRO
        ===================================================== */}

        <motion.div
          className="ramayana-world__intro"
          initial={{
            opacity: 0,
            y: 50,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.3,
          }}
          transition={{
            duration: 1.2,
          }}
        >

          <span className="ramayana-world__eyebrow">
            ENTER THE WORLD
          </span>

          <h2>
            THE WORLD
            <br />
            <span>OF RAMAYANA</span>
          </h2>

          <div className="ramayana-world__line" />

          <p>
            Before the journey, there was Ayodhya.
            <br />
            Before the exile, there was a promise.
            <br />
            And before destiny unfolded, there was dharma.
          </p>

        </motion.div>


        {/* =====================================================
            CHARACTER PORTAL
        ===================================================== */}

        <motion.section
          className="ramayana-portal ramayana-portal--characters"
          initial={{
            opacity: 0,
            y: 70,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 1.2,
          }}
        >

          <div className="ramayana-portal__number">
            I
          </div>

          <div className="ramayana-portal__content">

            <span className="ramayana-portal__eyebrow">
              THE PEOPLE
            </span>

            <h3>
              MEET THE
              <br />
              <span>CHARACTERS</span>
            </h3>

            <p>
              Kings, queens, warriors, companions, devotees
              and those bound together by destiny.
              <br />
              Discover the people who gave the epic its soul.
            </p>

            <Link
              to="/journey/ramayana/characters"
              className="ramayana-portal__button"
            >
              ENTER THE CHARACTERS

              <ArrowRight
                size={17}
                strokeWidth={1.2}
              />
            </Link>

          </div>

          <div className="ramayana-portal__ornament">
            ✦
          </div>

        </motion.section>


        {/* =====================================================
            STORY PORTAL
        ===================================================== */}

        <motion.section
          className="ramayana-portal ramayana-portal--story"
          initial={{
            opacity: 0,
            y: 70,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 1.2,
            delay: 0.15,
          }}
        >

          <div className="ramayana-portal__content">

            <span className="ramayana-portal__eyebrow">
              THE STORY
            </span>

            <h3>
              FOLLOW THE
              <br />
              <span>JOURNEY</span>
            </h3>

            <p>
              From the royal halls of Ayodhya to the forests
              of exile and the shores of Lanka.
              <br />
              Walk through the events that shaped the epic.
            </p>

            {/* =================================================
                THIS IS WHERE THE CINEMATIC STORY OPENING STARTS
            ================================================= */}

            <Link
              to="/journey/ramayana/story"
              className="ramayana-portal__button"
            >
              EXPLORE THE STORY

              <ArrowRight
                size={17}
                strokeWidth={1.2}
              />
            </Link>

          </div>

          <div className="ramayana-portal__number">
            II
          </div>

        </motion.section>


        {/* =====================================================
            PHILOSOPHY
        ===================================================== */}

        <motion.div
          className="ramayana__philosophy"
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 1.5,
          }}
        >

          <span>
            DHARMA IS NOT ALWAYS THE EASIEST PATH.
          </span>

          <div />

          <strong>
            BUT IT IS THE PATH THAT DEFINES US.
          </strong>

        </motion.div>


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="ramayana__footer">

          <span>
            ANCESTRA
          </span>

          <span>
            RAMAYANA
          </span>

          <span>
            THE PATH OF DHARMA
          </span>

        </div>

      </section>

    </main>
  );
}

export default Ramayana;