
// ============================================================
// ANCESTRA — RAMAYANA
// CHAPTER XXIII — THE SHADOW OVER AYODHYA
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
   CHAPTER XXIII QUESTIONS
   ============================================================ */

const QUESTIONS = [
  {
    scene: "SCENE II",
    eyebrow: "THE WHISPERS OF AYODHYA",
    question:
      "Who informed Rama about the rumours circulating among the citizens regarding Sita?",
    options: [
      "Vasishtha",
      "Bhadra",
      "Bharata",
      "Shatrughna",
    ],
    answer: 1,
    explanation:
      "Bhadra was the informant whom Rama questioned about the conversations taking place among the citizens of Ayodhya. He reported the growing doubts surrounding Sita's time in Lanka.",
  },
  {
    scene: "SCENE III",
    eyebrow: "THE KING'S CONFLICT",
    question:
      "What was the central conflict troubling Rama when he considered the rumours about Sita?",
    options: [
      "He doubted the testimony of Agni",
      "He feared that Sita would refuse to return to Ayodhya",
      "He struggled between knowing Sita's innocence and maintaining public confidence in the throne",
      "He believed the sages would reject Sita",
    ],
    answer: 2,
    explanation:
      "Rama knew Sita was innocent and remembered the testimony of Agni. However, he believed that a king's decisions had to remain beyond public doubt, creating a painful conflict between his personal knowledge and royal responsibility.",
  },
  {
    scene: "SCENE V",
    eyebrow: "THE COMMAND",
    question:
      "What did Rama command Lakshmana to do?",
    options: [
      "Take Sita to Janaka's kingdom",
      "Escort Sita to the hermitages beyond the Ganga and leave her there",
      "Take Sita to the royal palace of Bharata",
      "Bring Sage Valmiki to Ayodhya",
    ],
    answer: 1,
    explanation:
      "Rama commanded Lakshmana to take Sita beyond the Ganga, towards the hermitages of the sages, and leave her there without revealing the real purpose of the journey beforehand.",
  },
  {
    scene: "SCENE XIII",
    eyebrow: "THE SAGE'S INSIGHT",
    question:
      "How did Sage Valmiki reveal to Sita that she was carrying Rama's child?",
    options: [
      "Lakshmana had informed him before departing",
      "Sita had already discovered it during the journey",
      "Rama had sent a message to the hermitage",
      "Valmiki perceived it through his spiritual insight",
    ],
    answer: 3,
    explanation:
      "Sita did not know about the pregnancy when she left Ayodhya, and Lakshmana was also unaware. Valmiki recognised her condition through his spiritual insight and gently revealed the new life she carried.",
  },
  {
    scene: "SCENE XVI",
    eyebrow: "THE SONS OF RAMA",
    question:
      "What was the final revelation of Chapter XXIII?",
    options: [
      "Sita returned to Ayodhya with Valmiki",
      "Rama discovered the truth about Sita's exile",
      "Sita gave birth to twin sons, Lava and Kusha, while Rama remained unaware",
      "Lakshmana brought the children to the royal palace",
    ],
    answer: 2,
    explanation:
      "Sita gave birth to Rama's twin sons, Lava and Kusha, at Valmiki's hermitage. Their birth marked the beginning of a new chapter, while Rama remained unaware that he had become a father.",
  },
];

/* ============================================================
   COMPONENT
   ============================================================ */

function Chapter23Quiz({ onComplete, onClose }) {
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
          <span>CHAPTER XXIII</span>
        </div>

        <div className="chapter-quiz__header-main">
          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE TWENTY-THIRD CHRONICLE
          </div>

          <h1>
            REMEMBER
            <span>THE SHADOW OVER AYODHYA</span>
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
                  transition={{
                    duration: 0.45,
                  }}
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

function QuizCompletion({ score, total, onRestart, onClose }) {
  const percentage = Math.round((score / total) * 100);

  const message =
    percentage === 100
      ? "The entire chapter remains with you."
      : percentage >= 70
      ? "The Chronicle has taken root."
      : percentage >= 40
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
          ✦ THE TWENTY-THIRD CHRONICLE ✦
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

export default Chapter23Quiz;
