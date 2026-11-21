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

import "./Chapter01Quiz.css";

/* =========================================================
   ANCESTRA — RAMAYANA
   CHAPTER III — THE THIRD CHRONICLE
   THE SAGE AND THE FOREST
========================================================= */

const QUESTIONS = [
  {
    scene: "SCENE II",
    eyebrow: "THE SAGE",
    question:
      "Why did Vishvamitra take Rama and Lakshmana with him beyond Ayodhya?",
    options: [
      "To train them to become kings immediately",
      "To seek their help in protecting the sacred rites from disruption",
      "To send them to study in Mithila",
      "To prepare them for Rama's coronation",
    ],
    answer: 1,
    explanation:
      "Vishvamitra asked Dasharatha to allow Rama to accompany him so that the young prince could help protect the sacred rites from those who were disturbing them.",
  },

  {
    scene: "SCENE III",
    eyebrow: "THE FIRST TEACHING",
    question:
      "What did Vishvamitra begin teaching Rama and Lakshmana as they journeyed through the wilderness?",
    options: [
      "Only techniques of royal warfare",
      "The customs of foreign kingdoms",
      "Discipline, awareness, endurance, and responsibility",
      "The political administration of Ayodhya",
    ],
    answer: 2,
    explanation:
      "The forest journey becomes a period of deeper education. Vishvamitra teaches the princes discipline, awareness, endurance, restraint, and responsibility beyond the protected world of the palace.",
  },

  {
    scene: "SCENE IV",
    eyebrow: "SACRED KNOWLEDGE",
    question:
      "What were Bala and Atibala in Chapter III?",
    options: [
      "Two physical weapons given to Rama",
      "Sacred teachings imparted by Vishvamitra",
      "Two forest kingdoms near Mithila",
      "Names of the demons attacking Siddhashrama",
    ],
    answer: 1,
    explanation:
      "Bala and Atibala were sacred teachings given by Vishvamitra as part of the princes' preparation for the demanding journey through the wilderness.",
  },

  {
    scene: "SCENE VIII",
    eyebrow: "THE FOREST CHANGES",
    question:
      "What major danger was Rama approaching as Vishvamitra led the princes toward Tataka's land?",
    options: [
      "A rival kingdom preparing for war",
      "A dangerous forest region associated with Tataka",
      "A city preparing to attack Ayodhya",
      "A battlefield controlled by Ravana",
    ],
    answer: 1,
    explanation:
      "The forest gradually changes as they approach Tataka's territory. Vishvamitra prepares Rama for the first major confrontation of the journey.",
  },

  {
    scene: "SCENE X",
    eyebrow: "RAMA'S DOUBT",
    question:
      "What did Rama struggle with immediately before facing Tataka?",
    options: [
      "Whether to return to Ayodhya",
      "Whether he should act against a terrifying and dangerous being in the forest",
      "Whether Vishvamitra should become king",
      "Whether Lakshmana should continue the journey",
    ],
    answer: 1,
    explanation:
      "Rama's hesitation comes from the weight of the action before him. The moment tests his ability to balance compassion, judgment, and duty.",
  },

  {
    scene: "SCENE XI",
    eyebrow: "THE DEMONESS",
    question:
      "What happened when Tataka finally appeared before Rama and Lakshmana?",
    options: [
      "The forest immediately became peaceful",
      "Tataka attacked, beginning Rama's first great trial",
      "Vishvamitra returned to Ayodhya",
      "Rama immediately continued toward Mithila",
    ],
    answer: 1,
    explanation:
      "Tataka's appearance transforms the journey into an immediate test. Her attack becomes the confrontation through which Rama must put Vishvamitra's teachings into action.",
  },

  {
    scene: "SCENE XVII",
    eyebrow: "THE SACRED RITE",
    question:
      "Why was the sacrifice at Siddhashrama important to Rama's journey?",
    options: [
      "It was the place where Rama would be crowned",
      "It became the next major responsibility Rama and Lakshmana had to protect",
      "It marked their return to Ayodhya",
      "It was the beginning of Rama's exile",
    ],
    answer: 1,
    explanation:
      "At Siddhashrama, protecting the sacred rite becomes another major responsibility for the princes and a further test of the discipline they have been learning.",
  },

  {
    scene: "SCENE XXII",
    eyebrow: "TOWARD MITHILA",
    question:
      "Where did Rama and Lakshmana continue with Vishvamitra at the end of Chapter III?",
    options: [
      "Back toward Ayodhya",
      "Toward Lanka",
      "Toward Mithila",
      "Toward Hastinapura",
    ],
    answer: 2,
    explanation:
      "After the events at Siddhashrama, the journey continues toward Mithila, carrying Rama and Lakshmana into the next stage of their story.",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

function Chapter03Quiz({
  onComplete,
  onClose,
}) {
  const [currentIndex, setCurrentIndex] =
    useState(0);

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

  /* =======================================================
     COMPLETION
  ======================================================= */

  useEffect(() => {
    if (!finished) {
      return;
    }

    onComplete?.();
  }, [
    finished,
    onComplete,
  ]);

  /* =======================================================
     ANSWER
  ======================================================= */

  const chooseAnswer = (index) => {
    if (
      answered ||
      finished
    ) {
      return;
    }

    setSelectedAnswer(index);

    setAnswered(true);

    if (
      index ===
      question.answer
    ) {
      setScore(
        (value) =>
          value + 1
      );
    }

    setTimeout(() => {
      setShowExplanation(true);
    }, 220);
  };

  /* =======================================================
     NEXT
  ======================================================= */

  const nextQuestion = () => {
    if (!answered) {
      return;
    }

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
      (value) =>
        value + 1
    );
  };

  /* =======================================================
     PREVIOUS
  ======================================================= */

  const previousQuestion = () => {
    if (
      currentIndex === 0 ||
      answered
    ) {
      return;
    }

    setDirection(-1);

    setCurrentIndex(
      (value) =>
        value - 1
    );
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
     COMPLETION SCREEN
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

      {/* ====================================================
          ATMOSPHERE
      ==================================================== */}

      <div className="chapter-quiz__ambient">

        <div className="chapter-quiz__grain" />

        <motion.div
          className="
            chapter-quiz__orb
            chapter-quiz__orb--one
          "
          animate={{
            scale: [
              1,
              1.08,
              1,
            ],

            opacity: [
              0.16,
              0.28,
              0.16,
            ],
          }}
          transition={{
            duration: 6,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
        />

        <motion.div
          className="
            chapter-quiz__orb
            chapter-quiz__orb--two
          "
          animate={{
            scale: [
              1.08,
              0.94,
              1.08,
            ],

            opacity: [
              0.1,
              0.2,
              0.1,
            ],
          }}
          transition={{
            duration: 8,
            repeat:
              Infinity,
            ease:
              "easeInOut",
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

          <span>
            ANCESTRA
          </span>

          <i />

          <span>
            CHAPTER III
          </span>

        </div>

        <div className="chapter-quiz__header-main">

          <div className="chapter-quiz__eyebrow">

            <Sparkles
              size={13}
              strokeWidth={1.2}
            />

            THE THIRD CHRONICLE

          </div>

          <h1>
            REMEMBER
            <span>THE FOREST</span>
          </h1>

          <p>
            Eight questions drawn from the
            journey you have just experienced.
          </p>

        </div>

        <div className="chapter-quiz__counter">

          <span>
            CHRONICLE
          </span>

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
              width:
                `${progress}%`,
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
            THE JOURNEY UNFOLDS
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

                      disabled={
                        answered
                      }

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
                            className="
                              chapter-quiz__option-glow
                            "
                            layoutId="
                              quiz-selection
                            "
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
          className="
            chapter-quiz__back
          "
          onClick={
            previousQuestion
          }
          disabled={
            currentIndex === 0 ||
            answered
          }
        >
          <ChevronLeft size={15} />

          PREVIOUS
        </button>

        <div className="
          chapter-quiz__footer-center
        ">

          <span>
            STORY-BOUND KNOWLEDGE
          </span>

          <i />

        </div>

        <button
          type="button"
          className="
            chapter-quiz__next
          "
          onClick={
            nextQuestion
          }
          disabled={
            !answered
          }
        >

          {currentIndex ===
          QUESTIONS.length - 1
            ? "COMPLETE CHRONICLE"
            : "CONTINUE"}

          <ArrowRight
            size={16}
          />

        </button>

      </footer>

    </div>
  );
}

/* =========================================================
   COMPLETION
========================================================= */

function QuizCompletion({
  score,
  total,
  onRestart,
  onClose,
  onComplete,
}) {
  const percentage =
    Math.round(
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
          className="
            chapter-quiz__completion-light
          "
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

        <div className="
          chapter-quiz__mandala
          chapter-quiz__mandala--completion
        ">
          <div />
          <div />
          <div />
        </div>

      </div>

      <div className="
        chapter-quiz__completion
      ">

        <motion.div
          className="
            chapter-quiz__completion-mark
          "
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
          className="
            chapter-quiz__completion-eyebrow
          "
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
          ✦ THE THIRD CHRONICLE ✦
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
          THE JOURNEY
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
          className="
            chapter-quiz__score
          "
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

          <div className="
            chapter-quiz__score-line
          ">
            <motion.span
              initial={{
                width: 0,
              }}
              animate={{
                width:
                  `${percentage}%`,
              }}
              transition={{
                delay: 0.95,
                duration: 1,
              }}
            />
          </div>

        </motion.div>

        <motion.div
          className="
            chapter-quiz__completion-actions
          "
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
            className="
              chapter-quiz__restart
            "
            onClick={
              onRestart
            }
          >
            <RotateCcw
              size={14}
            />

            WALK AGAIN
          </button>

          <button
            type="button"
            className="
              chapter-quiz__finish
            "
            onClick={
              finish
            }
          >
            RETURN TO CHAPTER

            <ArrowRight
              size={16}
            />
          </button>

        </motion.div>

      </div>

    </div>
  );
}

export default Chapter03Quiz;