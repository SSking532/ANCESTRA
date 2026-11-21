import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import "./Mahabharata.css";

function Mahabharata() {
  return (
    <main className="mahabharata">

      {/* =====================================================
          HERO BACKGROUND
      ===================================================== */}

      <div className="mahabharata__background" />

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="mahabharata__nav">

        <Link
          to="/journey"
          className="mahabharata__back"
        >
          ← THE JOURNEY
        </Link>

        <div className="mahabharata__brand">
          ANCESTRA
        </div>

        <div className="mahabharata__label">
          MAHABHARATA
        </div>

      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="mahabharata__hero">

        <div className="mahabharata__content">

          <motion.div
            className="mahabharata__eyebrow"
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

          <motion.h1
            className="mahabharata__title"
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
            MAHABHARATA
          </motion.h1>

          <motion.div
            className="mahabharata__divider"
            initial={{
              scaleX: 0,
              transformOrigin: "left",
            }}
            animate={{
              scaleX: 1,
            }}
            transition={{
              duration: 1.2,
              delay: 1.5,
            }}
          />

          <motion.p
            className="mahabharata__tagline"
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
            When duty collides with destiny.
          </motion.p>

          <motion.p
            className="mahabharata__description"
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
            Enter a world of kingdoms, families, difficult choices
            and consequences.
            <br />
            Meet the people behind the epic. Trace their choices.
            Understand what led to Kurukshetra.
          </motion.p>

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
            <a
              href="#world"
              className="mahabharata__button"
            >
              ENTER THE WORLD

              <ArrowDown
                size={16}
                strokeWidth={1.2}
              />
            </a>
          </motion.div>

        </div>

        <div className="mahabharata__glow" />

        <div className="mahabharata__bottom">
          <span>BHARATA</span>
          <span>✦</span>
          <span>THE KURU DYNASTY</span>
        </div>

        <motion.div
          className="mahabharata__scroll"
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
          WORLD
      ===================================================== */}

      <section
        id="world"
        className="mahabharata__world"
      >

        {/* ===================================================
            WORLD INTRO
        =================================================== */}

        <motion.div
          className="world__intro"
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

          <span className="world__eyebrow">
            ENTER THE WORLD
          </span>

          <h2>
            THE WORLD
            <br />
            <span>OF MAHABHARATA</span>
          </h2>

          <div className="world__line" />

          <p>
            Before the war, there was a dynasty.
            <br />
            Before the dynasty, there were people.
            <br />
            And before every choice, there was a question.
          </p>

        </motion.div>

        {/* ===================================================
            CHARACTER PORTAL
        =================================================== */}

        <motion.section
          className="character-portal"
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

          <div className="character-portal__number">
            I
          </div>

          <div className="character-portal__content">

            <span className="character-portal__eyebrow">
              THE PEOPLE
            </span>

            <h3>
              MEET THE
              <br />
              <span>CHARACTERS</span>
            </h3>

            <p>
              Kings, warriors, queens, teachers, brothers,
              friends and rivals.
              <br />
              Every choice in the epic begins with a person.
            </p>

            <Link
              to="/journey/mahabharata/characters"
              className="character-portal__button"
            >
              ENTER THE CHARACTERS

              <ArrowRight
                size={17}
                strokeWidth={1.2}
              />
            </Link>

          </div>

          <div className="character-portal__ornament">
            ✦
          </div>

        </motion.section>

        {/* ===================================================
            STORY PORTAL
        =================================================== */}

        <motion.section
          className="story-portal"
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

          <div className="story-portal__content">

            <span className="story-portal__eyebrow">
              THE STORY
            </span>

            <h3>
              FOLLOW THE
              <br />
              <span>JOURNEY</span>
            </h3>

            <p>
              From the roots of the Kuru dynasty
              to the battlefield of Kurukshetra.
              <br />
              Discover the events that shaped the epic.
            </p>

            <Link
              to="/journey/mahabharata/chapters"
              state={{ playOpening: true }}
              className="story-portal__button"
            >
              <span>ENTER THE STORY</span>

              <ArrowRight
                size={15}
                strokeWidth={1.5}
              />
            </Link>

          </div>

          <div className="story-portal__number">
            II
          </div>

        </motion.section>

        {/* ===================================================
            PHILOSOPHY
        =================================================== */}

        <motion.div
          className="world__philosophy"
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
            THE PAST CANNOT BE CHANGED.
          </span>

          <div />

          <strong>
            BUT IT CAN BE UNDERSTOOD.
          </strong>

        </motion.div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="world__footer">

          <span>
            ANCESTRA
          </span>

          <span>
            MAHABHARATA
          </span>

          <span>
            THE PAST CANNOT BE CHANGED
          </span>

        </div>

      </section>

    </main>
  );
}

export default Mahabharata;