// ============================================================
// ANCESTRA — RAMAYANA
// CHAPTER II — THE MAKING OF THE PRINCES
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

// IMPORTANT:
// We intentionally reuse the exact Chapter I quiz styling.
// No new CSS is required.
import "./Chapter01Quiz.css";

/* ============================================================
   CHAPTER II QUESTIONS
   ============================================================ */

const QUESTIONS = [
  {
    scene: "SCENE I",
    eyebrow: "THE FOUR PRINCES",

    question:
      "How were the four sons of Dasharatha connected to the three queens of Ayodhya?",

    options: [
      "Rama and Bharata were Kausalya's sons, while the twins belonged to Kaikeyi",
      "Rama was Kausalya's son, Bharata was Kaikeyi's son, and Lakshmana and Shatrughna were Sumitra's sons",
      "Rama and Lakshmana were Kaikeyi's sons, while Bharata and Shatrughna belonged to Sumitra",
      "All four princes were born to Kausalya",
    ],

    answer: 1,

    explanation:
      "Rama was born to Kausalya, Bharata to Kaikeyi, and Sumitra became the mother of Lakshmana and Shatrughna. The four brothers therefore grew together as members of the same royal household while retaining distinct bonds with their mothers.",
  },

  {
    scene: "SCENE II",
    eyebrow: "THE CHARACTER OF RAMA",

    question:
      "What quality increasingly distinguished Rama as he grew within the royal household?",

    options: [
      "He sought authority over his brothers",
      "He preferred comfort and avoided responsibility",
      "He combined ability with discipline, humility, compassion, and self-control",
      "He refused to listen to the teachers of the royal house",
    ],

    answer: 2,

    explanation:
      "Rama's character was not defined by ability alone. He listened to instruction, practiced discipline, showed compassion, and did not allow his royal position to become arrogance. His strength was increasingly matched by restraint and responsibility.",
  },

  {
    scene: "SCENE IV",
    eyebrow: "THE ROYAL EDUCATION",

    question:
      "What was the deeper purpose of the princes' education beyond developing physical strength?",

    options: [
      "To prepare them only for royal ceremonies",
      "To teach them discipline, righteous conduct, responsibility, judgment, and leadership",
      "To ensure that they could avoid all contact with the world outside the palace",
      "To prepare them to compete against one another for the throne",
    ],

    answer: 1,

    explanation:
      "The education of the princes was much broader than physical training. They learned sacred knowledge, the duties of rulers, righteous conduct, responsibility toward others, concentration, restraint, and the judgment required to use power responsibly.",
  },

  {
    scene: "SCENE V",
    eyebrow: "THE CALL OF DESTINY",

    question:
      "Why did Vishvamitra come to the court of King Dasharatha?",

    options: [
      "To ask Dasharatha to send an army to conquer another kingdom",
      "To invite the four princes to a royal celebration",
      "To request Rama's assistance in protecting a sacred undertaking from repeated disturbance",
      "To ask Dasharatha to abandon the royal court",
    ],

    answer: 2,

    explanation:
      "Vishvamitra came to seek Rama's assistance. The sage was preparing a sacred undertaking that was repeatedly being disturbed, and he believed Rama was capable of helping protect it. His request marked the moment when Rama's education began to meet a responsibility beyond the palace.",
  },

  {
    scene: "SCENE VI",
    eyebrow: "THE KING'S HESITATION",

    question:
      "Why did Dasharatha struggle when Vishvamitra asked for Rama?",

    options: [
      "He believed Rama was unwilling to leave Ayodhya",
      "He feared sending his young son away from the safety of the palace and into uncertainty",
      "He wanted Bharata to take Rama's place",
      "He did not recognize Vishvamitra as a respected sage",
    ],

    answer: 1,

    explanation:
      "Dasharatha's hesitation came from his love and concern for Rama. The prince had grown up under the protection of the royal household, and the thought of sending him beyond Ayodhya into uncertain circumstances was deeply painful to the king.",
  },

  {
    scene: "SCENE XI",
    eyebrow: "THE DECISION",

    question:
      "Who reminded Dasharatha that a king must honor the word he had given?",

    options: [
      "Rishyasringa",
      "Kaikeyi",
      "Vasishtha",
      "Sumitra",
    ],

    answer: 2,

    explanation:
      "Vasishtha reminded Dasharatha that the word of a king could not simply be discarded because fulfilling it had become difficult. The reminder helped Dasharatha understand that his responsibility as ruler was connected to the promise he had made.",
  },

  {
    scene: "SCENE XIII",
    eyebrow: "THE FIRST TEACHINGS",

    question:
      "What sacred teachings did Vishvamitra impart to Rama and Lakshmana during their journey?",

    options: [
      "Bala and Atibala",
      "Rajasuya and Ashvamedha",
      "Veda and Vedanta",
      "Yoga and Ayurveda",
    ],

    answer: 0,

    explanation:
      "During the journey, Vishvamitra taught Rama and Lakshmana the sacred disciplines known as Bala and Atibala. These teachings belonged to the larger process through which the princes were being prepared to endure the hardships of the journey and enter a world beyond palace life.",
  },

  {
    scene: "SCENE XX",
    eyebrow: "THE DEPARTURE",

    question:
      "What did Rama and Lakshmana's departure from Ayodhya represent at the end of Chapter II?",

    options: [
      "Their permanent exile from the kingdom",
      "Their rejection of the royal household",
      "Their first step from protected childhood into real responsibility beyond the palace",
      "Their separation from Vishvamitra",
    ],

    answer: 2,

    explanation:
      "Rama and Lakshmana were not being sent away as exiles. Under Vishvamitra's guidance, they were beginning an important journey beyond the familiar protection of Ayodhya. Rama was moving from the protected world of childhood toward the responsibilities for which his education had prepared him.",
  },
];

/* ============================================================
   COMPONENT
   ============================================================ */

function Chapter02Quiz({ onComplete, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [answered, setAnswered] =
    useState(false);

  const [score, setScore] =
    useState(0);

  const [finished, setFinished] =
    useState(false);

  const [direction, setDirection] =
    useState(1);

  const [showExplanation, setShowExplanation] =
    useState(false);

  const question =
    QUESTIONS[currentIndex];

  const progress =
    ((currentIndex + 1) /
      QUESTIONS.length) *
    100;

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

    if (
      currentIndex ===
      QUESTIONS.length - 1
    ) {
      setFinished(true);
      return;
    }

    setDirection(1);

    setSelectedAnswer(null);
    setAnswered(false);
    setShowExplanation(false);

    setCurrentIndex(
      (value) => value + 1
    );
  };

  /* ==========================================================
     PREVIOUS
  ========================================================== */

  const previousQuestion = () => {
    if (
      currentIndex === 0 ||
      answered
    ) {
      return;
    }

    setDirection(-1);

    setCurrentIndex(
      (value) => value - 1
    );
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

      {/* ====================================================
          ATMOSPHERE
      ==================================================== */}

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

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="chapter-quiz__header">

        <div className="chapter-quiz__identity">
          <span>ANCESTRA</span>
          <i />
          <span>CHAPTER II</span>
        </div>

        <div className="chapter-quiz__header-main">

          <div className="chapter-quiz__eyebrow">

            <Sparkles
              size={13}
              strokeWidth={1.2}
            />

            THE SECOND CHRONICLE

          </div>

          <h1>
            REMEMBER
            <span>THE PRINCES</span>
          </h1>

          <p>
            Eight questions drawn from the
            story you have just experienced.
          </p>

        </div>

        <div className="chapter-quiz__counter">

          <span>CHRONICLE</span>

          <strong>
            {String(
              currentIndex + 1
            ).padStart(2, "0")}

            <em>
              /
              {String(
                QUESTIONS.length
              ).padStart(2, "0")}
            </em>
          </strong>

        </div>

      </header>

      {/* ====================================================
          PROGRESS
      ==================================================== */}

      <div className="chapter-quiz__progress">

        <div className="chapter-quiz__progress-track">

          <motion.div
            animate={{
              width: `${progress}%`,
            }}
            transition={{
              duration: 0.65,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
          />

        </div>

        <div className="chapter-quiz__progress-labels">

          <span>
            THE CHRONICLE UNFOLDS
          </span>

          <span>
            {Math.round(progress)}%
          </span>

        </div>

      </div>

      {/* ====================================================
          QUESTION
      ==================================================== */}

      <main className="chapter-quiz__main">

        <AnimatePresence
          mode="wait"
          custom={direction}
        >

          <motion.div
            key={currentIndex}
            className="chapter-quiz__question"
            custom={direction}

            initial={{
              opacity: 0,
              x:
                direction > 0
                  ? 45
                  : -45,
            }}

            animate={{
              opacity: 1,
              x: 0,
            }}

            exit={{
              opacity: 0,
              x:
                direction > 0
                  ? -45
                  : 45,
            }}

            transition={{
              duration: 0.48,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
          >

            <div className="chapter-quiz__question-meta">

              <span>
                {question.scene}
              </span>

              <i />

              <span>
                {question.eyebrow}
              </span>

            </div>

            <div className="chapter-quiz__question-number">

              {String(
                currentIndex + 1
              ).padStart(2, "0")}

            </div>

            <h2>
              {question.question}
            </h2>

            <div className="chapter-quiz__ornament">

              <span />

              <Sparkles
                size={13}
                strokeWidth={1}
              />

              <span />

            </div>

            {/* ==================================================
                OPTIONS
            ================================================== */}

            <div className="chapter-quiz__options">

              {question.options.map(
                (option, index) => {

                  const isSelected =
                    selectedAnswer ===
                    index;

                  const isCorrect =
                    index ===
                    question.answer;

                  const showCorrect =
                    answered &&
                    isCorrect;

                  const showWrong =
                    answered &&
                    isSelected &&
                    !isCorrect;

                  return (
                    <motion.button
                      key={option}
                      type="button"

                      className={[
                        "chapter-quiz__option",

                        isSelected
                          ? "is-selected"
                          : "",

                        showCorrect
                          ? "is-correct"
                          : "",

                        showWrong
                          ? "is-wrong"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}

                      onClick={() =>
                        chooseAnswer(
                          index
                        )
                      }

                      disabled={answered}

                      whileHover={
                        !answered
                          ? {
                              x: 5,
                            }
                          : undefined
                      }

                      whileTap={
                        !answered
                          ? {
                              scale: 0.99,
                            }
                          : undefined
                      }
                    >

                      <span className="chapter-quiz__option-letter">
                        {String.fromCharCode(
                          65 + index
                        )}
                      </span>

                      <span className="chapter-quiz__option-text">
                        {option}
                      </span>

                      <span className="chapter-quiz__option-state">

                        {showCorrect ? (
                          <Check
                            size={16}
                          />
                        ) : showWrong ? (
                          <X
                            size={16}
                          />
                        ) : (
                          <ArrowRight
                            size={15}
                          />
                        )}

                      </span>

                      {isSelected &&
                        !answered && (
                          <motion.span
                            className="chapter-quiz__option-glow"
                            layoutId="quiz-selection"
                          />
                        )}

                    </motion.button>
                  );
                }
              )}

            </div>

            {/* ==================================================
                EXPLANATION
            ================================================== */}

            <AnimatePresence>

              {showExplanation && (

                <motion.div
                  className={[
                    "chapter-quiz__explanation",

                    answeredCorrectly
                      ? "is-correct"
                      : "is-wrong",
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

                    <p>
                      {question.explanation}
                    </p>

                  </div>

                </motion.div>

              )}

            </AnimatePresence>

          </motion.div>

        </AnimatePresence>

      </main>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer className="chapter-quiz__footer">

        <button
          type="button"
          className="chapter-quiz__back"
          onClick={previousQuestion}
          disabled={
            currentIndex === 0 ||
            answered
          }
        >
          <ChevronLeft size={15} />
          PREVIOUS
        </button>

        <div className="chapter-quiz__footer-center">

          <span>
            STORY-BOUND KNOWLEDGE
          </span>

          <i />

        </div>

        <button
          type="button"
          className="chapter-quiz__next"
          onClick={nextQuestion}
          disabled={!answered}
        >
          {currentIndex ===
          QUESTIONS.length - 1
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
  const percentage = Math.round(
    (score / total) * 100
  );

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
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
        >
          <Sparkles
            size={30}
            strokeWidth={1}
          />
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
          ✦ THE SECOND CHRONICLE ✦
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
          <span>
            REMAINS
          </span>
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

            <strong>
              {score}
            </strong>

            <span>
              / {total}
            </span>

          </div>

          <small>
            CHRONICLE SCORE
          </small>

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

export default Chapter02Quiz;