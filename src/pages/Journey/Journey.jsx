import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AmbientBackground from "../../components/cinematic/AmbientBackground";

function Journey() {
  return (
    <main className="journey-page">
      {/* =====================================================
          CINEMATIC ATMOSPHERE
      ===================================================== */}
      <AmbientBackground />

      {/* =====================================================
          JOURNEY CONTENT
      ===================================================== */}
      <section className="journey-intro">

        {/* ===================================================
            HEADER
        =================================================== */}
        <motion.div
          className="journey-intro__eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          THE SEEKER'S JOURNEY
        </motion.div>

        <motion.h1
          initial={{
            opacity: 0,
            y: 50,
            filter: "blur(10px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            filter: "blur(0)",
          }}
          transition={{
            duration: 1.4,
            delay: 0.3,
          }}
        >
          Before you enter
          <br />
          <span>the stories...</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1,
            delay: 1,
          }}
        >
          There is no path to rewrite what has already happened.
          <br />
          There is only a path to understand it.
        </motion.p>

        {/* ===================================================
            JOURNEY PROGRESS
        =================================================== */}
        <motion.div
          className="journey-stages"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            delay: 1.4,
          }}
        >
          <div className="journey-stage journey-stage--active">
            <span>01</span>
            <strong>DISCOVER</strong>
            <small>Enter the world</small>
          </div>

          <div className="journey-stage-line" />

          <div className="journey-stage">
            <span>02</span>
            <strong>UNDERSTAND</strong>
            <small>Meet its people</small>
          </div>

          <div className="journey-stage-line" />

          <div className="journey-stage">
            <span>03</span>
            <strong>QUESTION</strong>
            <small>Face its choices</small>
          </div>

          <div className="journey-stage-line" />

          <div className="journey-stage">
            <span>04</span>
            <strong>REFLECT</strong>
            <small>Carry its wisdom</small>
          </div>
        </motion.div>

        {/* ===================================================
            EPIC SELECTION

            IMPORTANT:
            Ramayana FIRST
            Mahabharata SECOND
        =================================================== */}
        <motion.div
          className="epic-selection"
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
            delay: 2,
          }}
        >

          {/* =================================================
              01 — RAMAYANA
          ================================================= */}
          <Link
            to="/journey/ramayana"
            className="epic-card epic-card--ramayana"
          >
            {/* Image */}
            <div
              className="epic-card__image"
              aria-hidden="true"
            />

            {/* Cinematic overlay */}
            <div className="epic-card__overlay" />

            {/* Card number */}
            <div className="epic-card__number">
              01
            </div>

            {/* Content */}
            <div className="epic-card__content">
              <span className="epic-card__eyebrow">
                THE EPIC OF
              </span>

              <h2>RAMAYANA</h2>

              <p>
                A journey of duty,
                <br />
                devotion and righteousness.
              </p>

              <div className="epic-card__enter">
                <span>ENTER THE EPIC</span>

                <span className="epic-card__arrow">
                  <ArrowRight
                    size={16}
                    strokeWidth={1.2}
                  />
                </span>
              </div>
            </div>
          </Link>

          {/* =================================================
              02 — MAHABHARATA
          ================================================= */}
          <Link
            to="/journey/mahabharata"
            className="epic-card epic-card--mahabharata"
          >
            {/* Image */}
            <div
              className="epic-card__image"
              aria-hidden="true"
            />

            {/* Cinematic overlay */}
            <div className="epic-card__overlay" />

            {/* Card number */}
            <div className="epic-card__number">
              02
            </div>

            {/* Content */}
            <div className="epic-card__content">
              <span className="epic-card__eyebrow">
                THE EPIC OF
              </span>

              <h2>MAHABHARATA</h2>

              <p>
                When duty collides
                <br />
                with destiny.
              </p>

              <div className="epic-card__enter">
                <span>ENTER THE EPIC</span>

                <span className="epic-card__arrow">
                  <ArrowRight
                    size={16}
                    strokeWidth={1.2}
                  />
                </span>
              </div>
            </div>
          </Link>

        </motion.div>
      </section>
    </main>
  );
}

export default Journey;