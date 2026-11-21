// ============================================================
// ANCESTRA — RAMAYANA
// CHAPTER XVII — THE MOUNTAIN OF LIFE
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
   CHAPTER XVII QUESTIONS
   ============================================================ */

const QUESTIONS = [
  {
    scene: "SCENE I",
    eyebrow: "THE PROMISE",
    question: "After Kumbhakarna's fall, what did Indrajit promise Ravana?",
    options: [
      "He would negotiate peace with Rama",
      "He would lead the next assault and use his weapons against Rama's army",
      "He would defend Lanka without entering the battlefield",
      "He would ask the other commanders to take charge",
    ],
    answer: 1,
    explanation:
      "Indrajit assured Ravana that he would lead the next assault and use his knowledge of celestial weapons to challenge Rama's army.",
  },
  {
    scene: "SCENE II",
    eyebrow: "THE HIDDEN ASSAULT",
    question:
      "What made Indrajit's first assault especially difficult for Rama's army?",
    options: [
      "He attacked from a concealed position",
      "He challenged Rama to fight alone",
      "He destroyed the army's supply camp",
      "He refused to use his bow",
    ],
    answer: 0,
    explanation:
      "Indrajit used concealment to attack without revealing his position, making it difficult for the Vanara warriors to locate him.",
  },
  {
    scene: "SCENE III",
    eyebrow: "THE VOLUNTEER",
    question:
      "Who volunteered to confront Indrajit after the concealed attacks began?",
    options: ["Sugriva", "Hanuman", "Lakshmana", "Angada"],
    answer: 2,
    explanation:
      "Lakshmana stepped forward because he knew Indrajit's continued attacks could endanger the entire army.",
  },
  {
    scene: "SCENE IV",
    eyebrow: "THE DUEL",
    question:
      "Which weapon did Indrajit use against Lakshmana during their duel?",
    options: [
      "The Brahmastra",
      "The Nagapasha",
      "The Shakti",
      "The Sudarshana Chakra",
    ],
    answer: 2,
    explanation:
      "Indrajit invoked and released the Shakti weapon, whose force overwhelmed Lakshmana and left him unconscious.",
  },
  {
    scene: "SCENE V",
    eyebrow: "THE PHYSICIAN",
    question: "Who examined Lakshmana and explained how he might be saved?",
    options: ["Vibhishana", "Sushena", "Jambavan", "Sugriva"],
    answer: 1,
    explanation:
      "Sushena, the physician of Lanka, examined Lakshmana and explained that rare medicinal herbs could help restore him.",
  },
  {
    scene: "SCENE VI",
    eyebrow: "THE DISTANT HERBS",
    question:
      "Where did Sushena say the required medicinal herbs could be found?",
    options: [
      "The forests surrounding Lanka",
      "The banks of the Sarayu",
      "The Himalayan mountains",
      "The gardens of Ayodhya",
    ],
    answer: 2,
    explanation:
      "Sushena directed Hanuman towards the distant Himalayan mountains, where the rare medicinal herbs could be found.",
  },
  {
    scene: "SCENE VII",
    eyebrow: "THE UNCERTAIN SEARCH",
    question:
      "Why did Hanuman decide not to return with only the plants he had selected?",
    options: [
      "The plants were too heavy to carry",
      "He could not confidently identify the exact herbs",
      "The mountain paths were blocked",
      "Sushena had changed his instructions",
    ],
    answer: 1,
    explanation:
      "Hanuman found countless medicinal plants but could not be certain which ones Sushena required. He did not want to risk bringing the wrong medicine.",
  },
  {
    scene: "SCENE VIII",
    eyebrow: "THE MOUNTAIN LIFTED",
    question:
      "What extraordinary decision did Hanuman make when he could not identify Sanjeevani?",
    options: [
      "He asked another warrior to search",
      "He waited until sunrise",
      "He carried the entire medicinal mountain",
      "He returned to Lanka without the herbs",
    ],
    answer: 2,
    explanation:
      "Rather than risk choosing incorrectly, Hanuman lifted the mountain itself so Sushena could identify the required herbs.",
  },
  {
    scene: "SCENE IX",
    eyebrow: "THE RECOVERY",
    question:
      "What happened after Sushena administered the medicinal herbs to Lakshmana?",
    options: [
      "Lakshmana gradually recovered and regained consciousness",
      "Lakshmana immediately returned to the battlefield",
      "Rama was asked to search for another medicine",
      "Hanuman had to carry him to the Himalayas",
    ],
    answer: 0,
    explanation:
      "The medicine worked. Lakshmana gradually recovered, opened his eyes and spoke to Rama.",
  },
  {
    scene: "SCENE X",
    eyebrow: "THE NIKUMBHILA RITUAL",
    question: "What did Vibhishana reveal about Indrajit's ritual at Nikumbhila?",
    options: [
      "It would force Ravana to surrender",
      "It would restore Kumbhakarna",
      "Completing it would give Indrajit an extraordinary advantage in battle",
      "It would protect the entire Vanara army",
    ],
    answer: 2,
    explanation:
      "Vibhishana explained that completing the Nikumbhila ritual would give Indrajit a formidable advantage, so it had to be stopped before completion.",
  },
];

/* ============================================================
   COMPONENT
   ============================================================ */

function Chapter17Quiz({ onComplete, onClose }) {
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
          <span>CHAPTER XVII</span>
        </div>

        <div className="chapter-quiz__header-main">
          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE SEVENTEENTH CHRONICLE
          </div>

          <h1>
            REMEMBER
            <span>THE MOUNTAIN OF LIFE</span>
          </h1>

          <p>
            Ten questions drawn from the story you have just experienced.
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
          ✦ THE SEVENTEENTH CHRONICLE ✦
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

export default Chapter17Quiz;