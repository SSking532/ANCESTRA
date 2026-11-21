
// ============================================================
// ANCESTRA — RAMAYANA
// CHAPTER XI — THE SEARCH FOR SITA
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

// Reuse the exact Chapter I quiz styling.
import "./Chapter01Quiz.css";

/* ============================================================
   CHAPTER XI QUESTIONS
   ============================================================ */

const QUESTIONS = [
  {
    scene: "SCENE VI",
    eyebrow: "A PROMISE REMEMBERED",

    question:
      "What reminded Sugriva of his promise to help Rama find Sita?",

    options: [
      "A message from Angada",
      "Hanuman's reminder of Rama and their agreement",
      "A warning from Tara",
      "A visit from the sages",
    ],

    answer: 1,

    explanation:
      "Hanuman reminded Sugriva of the promise he had made to Rama. Sugriva remembered his responsibility and began preparing the search for Sita.",
  },

  {
    scene: "SCENES VII–IX",
    eyebrow: "LAKSHMANA'S ARRIVAL",

    question:
      "Why did Lakshmana travel to Kishkindha?",

    options: [
      "To ask Sugriva to send an army to Ayodhya",
      "To bring Angada to Rama",
      "To remind Sugriva of his promise to search for Sita",
      "To meet the sages living there",
    ],

    answer: 2,

    explanation:
      "When the search had not begun as expected, Lakshmana travelled to Kishkindha. Hanuman helped mediate the meeting, and Sugriva recognised the importance of fulfilling his promise.",
  },

  {
    scene: "SCENES XI–XII",
    eyebrow: "JAMBAVAN'S COUNSEL",

    question:
      "What was the purpose of Jambavan's counsel before the search parties departed?",

    options: [
      "To divide Kishkindha into smaller kingdoms",
      "To guide the search parties and prepare them for their responsibilities",
      "To ask Rama to return to Ayodhya",
      "To appoint a new king",
    ],

    answer: 1,

    explanation:
      "Jambavan's counsel helped prepare the Vanaras for the search. The expedition required organisation, cooperation and an understanding of the responsibility entrusted to each group.",
  },

  {
    scene: "SCENES XIII–XIV",
    eyebrow: "THE FOUR DIRECTIONS",

    question:
      "Who led the southern search party?",

    options: [
      "Hanuman",
      "Jambavan",
      "Angada",
      "Sugriva",
    ],

    answer: 2,

    explanation:
      "Angada led the southern expedition. Jambavan and Hanuman travelled with him, along with the other Vanaras assigned to the southern direction.",
  },

  {
    scene: "SCENES XXII–XXIII",
    eyebrow: "THE DARK OPENING",

    question:
      "What led the Vanaras to explore the mysterious cave?",

    options: [
      "They received a message from Sugriva",
      "They noticed signs of water near its entrance",
      "They saw an army entering it",
      "They recognised it as Ravana's palace",
    ],

    answer: 1,

    explanation:
      "The Vanaras noticed signs of water near the dark opening. Hoping to discover where it led, they cautiously entered the cave together.",
  },

  {
    scene: "SCENES XXIV–XXVIII",
    eyebrow: "THE HIDDEN GARDEN",

    question:
      "Who appeared in the extraordinary hidden garden and guided the Vanaras?",

    options: [
      "Tara",
      "Swayamprabha",
      "Anjana",
      "Mandodari",
    ],

    answer: 1,

    explanation:
      "Swayamprabha appeared in the hidden garden. She helped the Vanaras understand the mysterious place and guided them beyond the mountain.",
  },

  {
    scene: "SCENE XXXII",
    eyebrow: "ANGADA'S BURDEN",

    question:
      "What made Angada's responsibility as leader especially difficult?",

    options: [
      "He had to choose the next king of Ayodhya",
      "The search had not found Sita, and the exhausted party faced uncertainty",
      "He had lost the royal map",
      "He had been ordered to abandon the expedition",
    ],

    answer: 1,

    explanation:
      "The southern party had travelled far without finding Sita. Angada faced the difficult responsibility of leading a tired and discouraged group while the outcome of their mission remained uncertain.",
  },

  {
    scene: "SCENES XXXIII–XXXIV",
    eyebrow: "THE SHADOW ABOVE",

    question:
      "What connection did Sampati reveal when he heard the name Jatayu?",

    options: [
      "Jatayu had been his teacher",
      "Jatayu was his younger brother",
      "Jatayu had ruled Kishkindha",
      "Jatayu had travelled with Angada",
    ],

    answer: 1,

    explanation:
      "Sampati revealed that Jatayu was his younger brother. Hearing Jatayu's name connected the Vanaras' search with Sampati's own past.",
  },

  {
    scene: "SCENES XXXVII–XXXVIII",
    eyebrow: "LANKA ACROSS THE WATERS",

    question:
      "What important information did Sampati give the southern search party?",

    options: [
      "Sita had returned to Ayodhya",
      "Sita was being held in Kishkindha",
      "He had seen a woman carried towards Lanka",
      "Ravana had abandoned Lanka",
    ],

    answer: 2,

    explanation:
      "Sampati revealed that he had seen a woman being carried towards Lanka. From the description shared by the Vanaras, they understood that the woman was Sita.",
  },

  {
    scene: "SCENE XL",
    eyebrow: "THE OCEAN BEFORE THEM",

    question:
      "What great challenge faced the Vanaras at the end of the chapter?",

    options: [
      "Finding a new kingdom",
      "Crossing the ocean to reach Lanka",
      "Returning to Kishkindha immediately",
      "Finding another hidden cave",
    ],

    answer: 1,

    explanation:
      "The Vanaras now knew that Sita was in Lanka, but the vast ocean stood between them and their destination. The chapter ends with Hanuman looking towards the waters.",
  },
];

/* ============================================================
   COMPONENT
   ============================================================ */

function Chapter11Quiz({ onComplete, onClose }) {
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
     COMPLETE
  ========================================================== */

  useEffect(() => {
    if (!finished) return;
    onComplete?.();
  }, [finished, onComplete]);

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
     COMPLETION
  ========================================================== */

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

  /* ==========================================================
     QUIZ
  ========================================================== */

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
          <span>CHAPTER XI</span>
        </div>

        <div className="chapter-quiz__header-main">

          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE ELEVENTH CHRONICLE
          </div>

          <h1>
            REMEMBER
            <span>THE SEARCH FOR SITA</span>
          </h1>

          <p>
            Ten questions drawn from the journey
            of the southern Vanaras.
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
          ✦ THE ELEVENTH CHRONICLE ✦
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
  onClick={() => {
    onComplete?.();
    onClose?.();
  }}
>
  RETURN TO CHAPTER
  <ArrowRight size={16} />
</button>

        </motion.div>

      </div>

    </div>
  );
}

export default Chapter11Quiz;
