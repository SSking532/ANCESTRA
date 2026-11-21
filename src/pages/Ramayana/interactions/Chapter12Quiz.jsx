
// ============================================================
// ANCESTRA — RAMAYANA
// CHAPTER XII — HANUMAN IN LANKA
// PREMIUM INTERACTIVE QUIZ
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

// Reuse the exact Chapter I quiz styling.
import "./Chapter01Quiz.css";

/* ============================================================
   CHAPTER XII QUESTIONS
   ============================================================ */

const QUESTIONS = [
  {
    scene: "SCENES V–VII",
    eyebrow: "THE AWAKENING OF STRENGTH",

    question:
      "Who reminded Hanuman of the extraordinary powers he had forgotten?",

    options: [
      "Angada, the young Vanara prince",
      "Sugriva, the Vanara king",
      "Nala, the skilled engineer",
      "Jambavan, the wise bear king",
    ],

    answer: 3,

    explanation:
      "Jambavan was the wise bear king. Seeing Hanuman hesitate before the vast ocean, he reminded him of the extraordinary strength and abilities he possessed. His words awakened Hanuman's confidence and courage.",
  },

  {
    scene: "SCENES XI–XII",
    eyebrow: "THE TEST OF SURASA",

    question:
      "How did Hanuman pass Surasa's challenge when she repeatedly enlarged her mouth?",

    options: [
      "He fought her until she moved aside",
      "He reduced himself to a tiny size and passed through her mouth",
      "He flew above the clouds to escape her",
      "He asked the Vanaras to come to his rescue",
    ],

    answer: 1,

    explanation:
      "Surasa continually enlarged her mouth, expecting Hanuman to enter it. Hanuman responded with intelligence rather than force. He suddenly became extremely small, entered and emerged from her mouth, fulfilling her challenge.",
  },

  {
    scene: "SCENES XIII–XIV",
    eyebrow: "THE SHADOW SNATCHER",

    question:
      "Which being stopped Hanuman's flight by seizing his shadow over the ocean?",

    options: [
      "Lankini",
      "Surasa",
      "Simhika",
      "Trijata",
    ],

    answer: 2,

    explanation:
      "Simhika possessed the ability to seize the shadows of flying beings and draw them towards herself. When she caught Hanuman's shadow, he recognised the danger and overcame her.",
  },

  {
    scene: "SCENES XVII–XVIII",
    eyebrow: "THE GATEKEEPER OF LANKA",

    question:
      "Who guarded the entrance to Lanka and confronted Hanuman when he approached the city?",

    options: [
      "Mandodari",
      "Trijata",
      "Surasa",
      "Lankini",
    ],

    answer: 3,

    explanation:
      "Lankini was the guardian of Lanka's entrance. She confronted Hanuman when he attempted to enter the city. Their encounter was connected to an ancient prophecy concerning Lanka's future.",
  },

  {
    scene: "SCENES XXVIII–XXX",
    eyebrow: "THE TOKEN OF TRUST",

    question:
      "What did Hanuman present to Sita as proof that he had truly come from Rama?",

    options: [
      "Rama's royal crown",
      "Rama's ring",
      "Lakshmana's bow",
      "A message from Sugriva",
    ],

    answer: 1,

    explanation:
      "Hanuman showed Sita Rama's ring. Recognising the familiar token, Sita understood that the tiny messenger hidden among the branches was truly sent by Rama.",
  },

  {
    scene: "SCENES XXXII–XXXIII",
    eyebrow: "A MESSAGE FOR RAMA",

    question:
      "Why did Sita decline Hanuman's offer to carry her away from Lanka?",

    options: [
      "She wanted Rama himself to come and rescue her",
      "She wished to remain in the Ashoka Vatika",
      "She wanted Hanuman to return without telling Rama",
      "She had decided to travel to Ayodhya alone",
    ],

    answer: 0,

    explanation:
      "Although Hanuman offered to carry her away, Sita declined. She wished Rama himself to come to Lanka and rescue her. She entrusted Hanuman with her Chudamani as a token to take back to Rama.",
  },
];

/* ============================================================
   COMPONENT
   ============================================================ */

function Chapter12Quiz({ onComplete, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [direction, setDirection] = useState(1);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = QUESTIONS[currentIndex];

  const progress =
    ((currentIndex + 1) / QUESTIONS.length) * 100;

  const answeredCorrectly =
    selectedAnswer === question?.answer;

  /* ==========================================================
     ANSWER
  ========================================================== */

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

  /* ==========================================================
     NEXT
  ========================================================== */

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

  /* ==========================================================
     PREVIOUS
  ========================================================== */

  const previousQuestion = () => {
    if (currentIndex === 0 || answered) return;

    setDirection(-1);
    setCurrentIndex((value) => value - 1);
  };

  /* ==========================================================
     RESTART
  ========================================================== */

  const restart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setShowExplanation(false);
    setDirection(1);
  };

  /* ==========================================================
     CLOSE
  ========================================================== */

  const closeQuiz = () => {
    if (onComplete) {
      onComplete();
    } else {
      onClose?.();
    }
  };

  /* ==========================================================
     COMPLETION
  ========================================================== */

  if (finished) {
    return (
      <QuizCompletion
        score={score}
        total={QUESTIONS.length}
        onRestart={restart}
        onClose={closeQuiz}
      />
    );
  }

  /* ==========================================================
     QUIZ
  ========================================================== */

  return (
    <div className="chapter-quiz">
      {closeQuiz && (
        <button type="button" className="chapter-quiz__exit" onClick={closeQuiz} aria-label="Exit quiz" title="Exit">
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
          <span>CHAPTER XII</span>
        </div>

        <div className="chapter-quiz__header-main">

          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE TWELFTH CHRONICLE
          </div>

          <h1>
            REMEMBER
            <span>HANUMAN IN LANKA</span>
          </h1>

          <p>
            Six questions drawn from the journey
            across the great ocean.
          </p>

        </div>

        <div className="chapter-quiz__counter">
          <span>CHRONICLE</span>

          <strong>
            {String(currentIndex + 1).padStart(2, "0")}
            <em>
              /{String(QUESTIONS.length).padStart(2, "0")}
            </em>
          </strong>
        </div>

      </header>

      {/* PROGRESS */}

      <div className="chapter-quiz__progress">

        <div className="chapter-quiz__progress-track">
          <motion.div
            animate={{ width: `${progress}%` }}
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
                const showWrong =
                  answered && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={option}
                    type="button"

                    className={[
                      "chapter-quiz__option",
                      isSelected ? "is-selected" : "",
                      showCorrect ? "is-correct" : "",
                      showWrong ? "is-wrong" : "",
                    ].filter(Boolean).join(" ")}

                    onClick={() => chooseAnswer(index)}
                    disabled={answered}

                    whileHover={!answered ? { x: 5 } : undefined}
                    whileTap={!answered ? { scale: 0.99 } : undefined}
                  >

                    <span className="chapter-quiz__option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="chapter-quiz__option-text">
                      {option}
                    </span>

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

                  transition={{ duration: 0.45 }}
                >

                  <div className="chapter-quiz__explanation-icon">
                    {answeredCorrectly ? (
                      <Check size={16} />
                    ) : (
                      <X size={16} />
                    )}
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

function QuizCompletion({
  score,
  total,
  onRestart,
  onClose,
}) {
  const percentage = Math.round((score / total) * 100);

  const message =
    percentage === 100
      ? "The entire chapter remains with you."
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
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.3 }}
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
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Sparkles size={30} strokeWidth={1} />
        </motion.div>

        <motion.div
          className="chapter-quiz__completion-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          ✦ THE TWELFTH CHRONICLE ✦
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          THE STORY
          <span>REMAINS</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {message}
        </motion.p>

        <motion.div
          className="chapter-quiz__score"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.7 }}
        >

          <div>
            <strong>{score}</strong>
            <span>/ {total}</span>
          </div>

          <small>CHRONICLE SCORE</small>

          <div className="chapter-quiz__score-line">
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{
                delay: 0.95,
                duration: 1,
              }}
            />
          </div>

        </motion.div>

        <motion.div
          className="chapter-quiz__completion-actions"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15 }}
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

export default Chapter12Quiz;
