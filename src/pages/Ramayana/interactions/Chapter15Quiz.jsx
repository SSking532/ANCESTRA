// ============================================================
// ANCESTRA — RAMAYANA
// CHAPTER XV — THE BATTLE OF LANKA
// PREMIUM INTERACTIVE QUIZ
// ============================================================

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

// Shared styling with every other chapter quiz.
import "./Chapter01Quiz.css";

/* ============================================================
   CHAPTER XV QUESTIONS
   ============================================================ */

const QUESTIONS = [
  {
    scene: "SCENE IV",
    eyebrow: "THE BATTLE BEGINS",
    question: "What began after Rama's army reached the gates of Lanka?",
    options: [
      "A peaceful agreement between the two armies",
      "The battle between the Vanara and Rakshasa armies",
      "Ravana surrendered to Rama",
      "The Vanara army returned to the forest",
    ],
    answer: 1,
    explanation:
      "With peace rejected and the armies assembled, the battle between Rama's Vanara forces and Ravana's Rakshasa army began.",
  },
  {
    scene: "SCENE XX",
    eyebrow: "THE SON OF RAVANA",
    question: "Which warrior used the Nagapasha against Rama and Lakshmana?",
    options: ["Kumbhakarna", "Atikaya", "Indrajit", "Prahasta"],
    answer: 2,
    explanation:
      "Indrajit, Ravana's son, used the celestial Nagapasha weapon to bind Rama and Lakshmana with serpent bonds.",
  },
  {
    scene: "SCENE XXIV",
    eyebrow: "THE SERPENT BONDS",
    question:
      "What happened to Rama and Lakshmana after the Nagapasha struck them?",
    options: [
      "They escaped into the forest",
      "They became bound by celestial serpent bonds",
      "They were taken prisoner to Ravana's palace",
      "They immediately defeated Indrajit",
    ],
    answer: 1,
    explanation:
      "The powerful serpent bonds held both brothers, leaving the Vanara army distressed and uncertain.",
  },
  {
    scene: "SCENE XXV",
    eyebrow: "A DIVINE ARRIVAL",
    question:
      "Who arrived to release Rama and Lakshmana from the serpent bonds?",
    options: ["Jambavan", "Sugriva", "Hanuman", "Garuda"],
    answer: 3,
    explanation:
      "Garuda, the mighty divine bird and natural enemy of serpents, arrived on the battlefield and freed the two brothers.",
  },
  {
    scene: "SCENE XXV",
    eyebrow: "THE POWER OF GARUDA",
    question: "What happened to the celestial serpents when Garuda arrived?",
    options: [
      "They surrounded Garuda",
      "They fled at the sight of Garuda",
      "They attacked the Vanara army",
      "They disappeared into the ground",
    ],
    answer: 1,
    explanation:
      "Garuda's presence drove the serpents away, releasing Rama and Lakshmana from their bonds.",
  },
];

/* ============================================================
   COMPONENT
   ============================================================ */

function Chapter15Quiz({ onComplete, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [direction, setDirection] = useState(1);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = QUESTIONS[currentIndex];

  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const answeredCorrectly = selectedAnswer === question?.answer;

  /* COMPLETE */

  useEffect(() => {
    if (!finished) return;

    onComplete?.();
  }, [finished, onComplete]);

  /* ANSWER */

  const chooseAnswer = (index) => {
    if (answered || finished) return;

    setSelectedAnswer(index);
    setAnswered(true);

    if (index === question.answer) {
      setScore((value) => value + 1);
    }

    setTimeout(() => {
      setShowExplanation(true);
    }, 220);
  };

  /* NEXT */

  const nextQuestion = () => {
    if (!answered) return;

    if (currentIndex === QUESTIONS.length - 1) {
      setFinished(true);
      return;
    }

    setDirection(1);

    setSelectedAnswer(null);
    setAnswered(false);
    setShowExplanation(false);

    setCurrentIndex((value) => value + 1);
  };

  /* PREVIOUS */

  const previousQuestion = () => {
    if (currentIndex === 0 || answered) {
      return;
    }

    setDirection(-1);

    setCurrentIndex((value) => value - 1);
  };

  /* RESTART */

  const restart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setShowExplanation(false);
    setDirection(1);
  };

  /* COMPLETION */

  if (finished) {
    return (
      <QuizCompletion
        score={score}
        total={QUESTIONS.length}
        onRestart={restart}
        onClose={onClose}
      />
    );
  }

  /* QUIZ */

  return (
    <div className="chapter-quiz">
      {onClose && (
        <button type="button" className="chapter-quiz__exit" onClick={onClose} aria-label="Exit quiz" title="Exit">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>
      )}
      {/* ATMOSPHERE */}

      <div className="chapter-quiz__ambient">
        <div className="chapter-quiz__grain" />

        <motion.div
          className="chapter-quiz__orb chapter-quiz__orb--one"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.16, 0.28, 0.16],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="chapter-quiz__orb chapter-quiz__orb--two"
          animate={{
            scale: [1.08, 0.94, 1.08],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="chapter-quiz__mandala">
          <div />
          <div />
          <div />
        </div>
      </div>

      {/* HEADER */}

      <header className="chapter-quiz__header">
        <div className="chapter-quiz__identity">
          <span>ANCESTRA</span>
          <i />
          <span>CHAPTER XV</span>
        </div>

        <div className="chapter-quiz__header-main">
          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE FIFTEENTH CHRONICLE
          </div>

          <h1>
            REMEMBER
            <span>THE BATTLE OF LANKA</span>
          </h1>

          <p>
            Five questions drawn from the story you have just experienced.
          </p>
        </div>

        <div className="chapter-quiz__counter">
          <span>CHRONICLE</span>

          <strong>
            {String(currentIndex + 1).padStart(2, "0")}

            <em>/{String(QUESTIONS.length).padStart(2, "0")}</em>
          </strong>
        </div>
      </header>

      {/* PROGRESS */}

      <div className="chapter-quiz__progress">
        <div className="chapter-quiz__progress-track">
          <motion.div
            animate={{
              width: `${progress}%`,
            }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </div>

        <div className="chapter-quiz__progress-labels">
          <span>THE CHRONICLE UNFOLDS</span>

          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* QUESTION */}

      <main className="chapter-quiz__main">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            className="chapter-quiz__question"
            custom={direction}
            initial={{
              opacity: 0,
              x: direction > 0 ? 45 : -45,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: direction > 0 ? -45 : 45,
            }}
            transition={{
              duration: 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="chapter-quiz__question-meta">
              <span>{question.scene}</span>

              <i />

              <span>{question.eyebrow}</span>
            </div>

            <div className="chapter-quiz__question-number">
              {String(currentIndex + 1).padStart(2, "0")}
            </div>

            <h2>{question.question}</h2>

            <div className="chapter-quiz__ornament">
              <span />

              <Sparkles size={13} strokeWidth={1} />

              <span />
            </div>

            {/* OPTIONS */}

            <div className="chapter-quiz__options">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;

                const isCorrect = index === question.answer;

                const showCorrect = answered && isCorrect;

                const showWrong = answered && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={option}
                    type="button"
                    className={[
                      "chapter-quiz__option",

                      isSelected ? "is-selected" : "",

                      showCorrect ? "is-correct" : "",

                      showWrong ? "is-wrong" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => chooseAnswer(index)}
                    disabled={answered}
                    whileHover={!answered ? { x: 5 } : undefined}
                    whileTap={!answered ? { scale: 0.99 } : undefined}
                  >
                    <span className="chapter-quiz__option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="chapter-quiz__option-text">{option}</span>

                    <span className="chapter-quiz__option-state">
                      {showCorrect ? (
                        <Check size={16} />
                      ) : showWrong ? (
                        <X size={16} />
                      ) : (
                        <ArrowRight size={15} />
                      )}
                    </span>

                    {isSelected && !answered && (
                      <motion.span
                        className="chapter-quiz__option-glow"
                        layoutId="quiz-selection"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* EXPLANATION */}

            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  className={[
                    "chapter-quiz__explanation",

                    answeredCorrectly ? "is-correct" : "is-wrong",
                  ].join(" ")}
                  initial={{
                    opacity: 0,
                    y: 12,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    height: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                    height: 0,
                  }}
                  transition={{
                    duration: 0.45,
                  }}
                >
                  <div className="chapter-quiz__explanation-icon">
                    {answeredCorrectly ? <Check size={16} /> : <X size={16} />}
                  </div>

                  <div>
                    <span>
                      {answeredCorrectly
                        ? "THE CHRONICLE REMEMBERS"
                        : "RETURN TO THE STORY"}
                    </span>

                    <p>{question.explanation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}

      <footer className="chapter-quiz__footer">
        <button
          type="button"
          className="chapter-quiz__back"
          onClick={previousQuestion}
          disabled={currentIndex === 0 || answered}
        >
          <ChevronLeft size={15} />
          PREVIOUS
        </button>

        <div className="chapter-quiz__footer-center">
          <span>STORY-BOUND KNOWLEDGE</span>

          <i />
        </div>

        <button
          type="button"
          className="chapter-quiz__next"
          onClick={nextQuestion}
          disabled={!answered}
        >
          {currentIndex === QUESTIONS.length - 1
            ? "COMPLETE CHRONICLE"
            : "CONTINUE"}

          <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  );
}

/* ============================================================
   COMPLETION
   ============================================================ */

function QuizCompletion({ score, total, onRestart, onClose }) {
  const percentage = Math.round((score / total) * 100);

  const message =
    percentage === 100
      ? "Every detail of the battle remains with you."
      : percentage >= 75
      ? "The Chronicle has taken root."
      : percentage >= 50
      ? "The story is beginning to settle into memory."
      : "The Chronicle invites you to walk through the story once more.";

  return (
    <div className="chapter-quiz chapter-quiz--complete">
      {onClose && (
        <button type="button" className="chapter-quiz__exit" onClick={onClose} aria-label="Exit quiz" title="Exit">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>
      )}
      <div className="chapter-quiz__ambient">
        <div className="chapter-quiz__grain" />

        <motion.div
          className="chapter-quiz__completion-light"
          initial={{
            scale: 0.4,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{
            duration: 1.3,
          }}
        />

        <div className="chapter-quiz__mandala chapter-quiz__mandala--completion">
          <div />
          <div />
          <div />
        </div>
      </div>

      <div className="chapter-quiz__completion">
        <motion.div
          className="chapter-quiz__completion-mark"
          initial={{
            scale: 0,
            rotate: -30,
          }}
          animate={{
            scale: 1,
            rotate: 0,
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Sparkles size={30} strokeWidth={1} />
        </motion.div>

        <motion.div
          className="chapter-quiz__completion-eyebrow"
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.35,
          }}
        >
          ✦ THE FIFTEENTH CHRONICLE ✦
        </motion.div>

        <motion.h2
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.45,
          }}
        >
          THE STORY
          <span>REMAINS</span>
        </motion.h2>

        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.6,
          }}
        >
          {message}
        </motion.p>

        <motion.div
          className="chapter-quiz__score"
          initial={{
            opacity: 0,
            scale: 0.85,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 0.7,
            duration: 0.7,
          }}
        >
          <div>
            <strong>{score}</strong>

            <span>/ {total}</span>
          </div>

          <small>CHRONICLE SCORE</small>

          <div className="chapter-quiz__score-line">
            <motion.span
              initial={{
                width: 0,
              }}
              animate={{
                width: `${percentage}%`,
              }}
              transition={{
                delay: 0.95,
                duration: 1,
              }}
            />
          </div>
        </motion.div>

        <motion.div
          className="chapter-quiz__completion-actions"
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 1.15,
          }}
        >
          <button
            type="button"
            className="chapter-quiz__restart"
            onClick={onRestart}
          >
            <RotateCcw size={14} />
            WALK AGAIN
          </button>

          <button
            type="button"
            className="chapter-quiz__finish"
            onClick={onClose}
          >
            RETURN TO CHAPTER
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default Chapter15Quiz;