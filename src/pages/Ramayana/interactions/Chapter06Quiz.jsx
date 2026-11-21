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

import "./Chapter01Quiz.css";

/* =========================================================
   ANCESTRA — RAMAYANA
   CHAPTER VI — THE FOURTEENTH YEAR BEGINS
   FOURTEEN YEARS INTO THE FOREST
========================================================= */

const QUESTIONS = [
  {
    scene: "SCENE VIII",
    eyebrow: "THE SACRED RIVER",
    question:
      "Who helped Rama, Sita and Lakshmana cross the Ganga as they left the region of Ayodhya behind?",
    options: [
      "Vishvamitra",
      "Guha and the boatman",
      "Bharata",
      "The sage Bharadvaja",
    ],
    answer: 1,
    explanation:
      "Guha, the Nishada chief and a devoted friend of Rama, helped arrange their passage across the Ganga. The crossing marked another step away from the life they had known in Ayodhya.",
  },
  {
    scene: "SCENE XV",
    eyebrow: "A FOREST HOME",
    question:
      "Where did Rama, Sita and Lakshmana establish their forest dwelling during this part of their journey?",
    options: [
      "Panchavati",
      "Dandaka forest",
      "Chitrakuta",
      "Kishkindha",
    ],
    answer: 2,
    explanation:
      "Chitrakuta became their place of residence during this stage of exile. Its forests and peaceful surroundings offered a temporary home far from the royal life of Ayodhya.",
  },
  {
    scene: "SCENE XVIII",
    eyebrow: "THE MEMORY OF A KING",
    question:
      "Which past incident returned to Dasharatha's memory as he suffered from the separation from Rama?",
    options: [
      "His encounter with Vishvamitra",
      "His promise to Kaikeyi during the battle",
      "The accidental killing of Shravan Kumar",
      "His first meeting with Janaka",
    ],
    answer: 2,
    explanation:
      "Dasharatha remembered the tragic incident involving Shravan Kumar, whom he had accidentally struck with an arrow. Shravan's grieving parents had pronounced a curse that Dasharatha would one day suffer the pain of separation from his own son.",
  },
  {
    scene: "SCENE XX",
    eyebrow: "THE LAST BREATH",
    question:
      "What was the deepest cause of Dasharatha's final suffering?",
    options: [
      "The loss of his kingdom to a rival ruler",
      "His unbearable grief at being separated from Rama",
      "His inability to travel to Chitrakuta",
      "His fear of an approaching war",
    ],
    answer: 1,
    explanation:
      "Dasharatha's grief over Rama's exile consumed him. Unable to bear the separation from his beloved son, the king passed away in sorrow.",
  },
  {
    scene: "SCENE XXIV",
    eyebrow: "BHARATA RETURNS",
    question:
      "What did Bharata discover when he returned to Ayodhya?",
    options: [
      "Rama had already returned and been crowned",
      "Dasharatha had passed away and Rama had been sent into exile",
      "Lakshmana had become the new king",
      "The kingdom had been taken over by an enemy",
    ],
    answer: 1,
    explanation:
      "Bharata returned to a kingdom in mourning. He learned of his father's death and the circumstances of Rama's exile, including the boons Kaikeyi had demanded.",
  },
  {
    scene: "SCENE XXVIII",
    eyebrow: "THE REFUSAL",
    question:
      "Why did Bharata refuse to accept the throne that had been secured for him?",
    options: [
      "He wished to establish a different capital",
      "He believed the throne rightfully belonged to Rama",
      "He wanted Lakshmana to become king",
      "He intended to abandon the kingdom",
    ],
    answer: 1,
    explanation:
      "Bharata did not regard the throne as a prize. He believed Rama was the rightful heir and refused to benefit from the injustice that had sent his elder brother into exile.",
  },
  {
    scene: "SCENE XXXIV",
    eyebrow: "THE MEETING AT CHITRAKUTA",
    question:
      "What was Bharata's purpose in travelling to Chitrakuta?",
    options: [
      "To ask Rama to return and take his rightful place as king",
      "To persuade Rama to move to Mithila",
      "To announce a new war against Lanka",
      "To ask Lakshmana to return alone",
    ],
    answer: 0,
    explanation:
      "Bharata travelled to Chitrakuta with the hope of bringing Rama back to Ayodhya. He wished his elder brother to accept the throne rather than allow the kingdom to remain under an arrangement born from Kaikeyi's demand.",
  },
  {
    scene: "SCENE XXXIX",
    eyebrow: "THE SANDALS",
    question:
      "What did Rama give Bharata as a symbol of his authority during the remaining years of exile?",
    options: [
      "His royal crown",
      "His bow",
      "His sandals",
      "His royal signet ring",
    ],
    answer: 2,
    explanation:
      "Rama gave Bharata his sandals. Bharata accepted them as a symbol of Rama's rightful authority and carried them back to Ayodhya.",
  },
  {
    scene: "SCENE XLII",
    eyebrow: "A KINGDOM IN TRUST",
    question:
      "Where did Bharata choose to live while administering the kingdom in Rama's name?",
    options: [
      "In the royal palace at Ayodhya",
      "At Nandigrama",
      "In the forests of Chitrakuta",
      "In the kingdom of Mithila",
    ],
    answer: 1,
    explanation:
      "Bharata established himself at Nandigrama rather than occupying the royal throne in Ayodhya. He governed as a caretaker, keeping Rama's return at the centre of his responsibility.",
  },
  {
    scene: "SCENE XLV",
    eyebrow: "THE PROMISE",
    question:
      "What did the placement of Rama's sandals on the throne represent?",
    options: [
      "Bharata's decision to become king in his own right",
      "The end of Rama's claim to the kingdom",
      "Rama's continuing rightful authority over Ayodhya",
      "The transfer of the kingdom to the sages",
    ],
    answer: 2,
    explanation:
      "The sandals represented Rama's continuing authority. Bharata did not claim the throne for himself; he governed in trust until Rama's return.",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function Chapter06Quiz({
  onComplete,
  onClose,
}) {
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

  /* =======================================================
     ANSWER
  ======================================================= */

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

  /* =======================================================
     NEXT
  ======================================================= */

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

  /* =======================================================
     PREVIOUS
  ======================================================= */

  const previousQuestion = () => {
    if (currentIndex === 0 || answered) return;

    setDirection(-1);
    setCurrentIndex((value) => value - 1);
  };

  /* =======================================================
     RESTART
  ======================================================= */

  const restart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setShowExplanation(false);
    setDirection(1);
  };

  /* =======================================================
     COMPLETION
  ======================================================= */

  if (finished) {
    return (
      <QuizCompletion
        score={score}
        total={QUESTIONS.length}
        onRestart={restart}
        onClose={onClose}
        onComplete={onComplete}
      />
    );
  }

  /* =======================================================
     MAIN QUIZ
  ======================================================= */

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
          className="
            chapter-quiz__orb
            chapter-quiz__orb--one
          "
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
          className="
            chapter-quiz__orb
            chapter-quiz__orb--two
          "
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
          <span>CHAPTER VI</span>
        </div>

        <div className="chapter-quiz__header-main">

          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE SIXTH CHRONICLE
          </div>

          <h1>
            FOURTEEN YEARS
            <span>INTO THE FOREST</span>
          </h1>

          <p>
            Ten questions drawn from the journey,
            the grief, and the promise you have just witnessed.
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
          <span>THE JOURNEY UNFOLDS</span>
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

                  <div className="
                    chapter-quiz__explanation-icon
                  ">
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

/* =========================================================
   COMPLETION SCREEN
========================================================= */

function QuizCompletion({
  score,
  total,
  onRestart,
  onClose,
  onComplete,
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

  const finish = () => {
    if (onClose) {
      onClose();
      return;
    }

    onComplete?.();
  };

  return (
    <div className="
      chapter-quiz
      chapter-quiz--complete
    ">
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

        <div className="
          chapter-quiz__mandala
          chapter-quiz__mandala--completion
        ">
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
          ✦ THE SIXTH CHRONICLE ✦
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          THE JOURNEY
          <span>REMAINS</span>
        </motion.h2>

        <motion.div
          className="chapter-quiz__score"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <strong>{score}</strong>
          <span> / {total}</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          {message}
        </motion.p>

        <div className="chapter-quiz__completion-actions">

          <button
            type="button"
            className="chapter-quiz__restart"
            onClick={onRestart}
          >
            <RotateCcw size={15} />
            WALK AGAIN
          </button>

          <button
            type="button"
            className="chapter-quiz__finish"
            onClick={finish}
          >
            RETURN TO CHRONICLE
            <ArrowRight size={16} />
          </button>

        </div>

      </div>

    </div>
  );
}