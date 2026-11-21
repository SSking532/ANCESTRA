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
   CHAPTER IV — THE FOURTH CHRONICLE
   TOWARD THE LAND OF VIDEHA
========================================================= */

const QUESTIONS = [
  {
    scene: "SCENE I",
    eyebrow: "TOWARD VIDEHA",
    question:
      "Where were Rama, Lakshmana, Vishvamitra, and the sages travelling after Siddhashrama?",
    options: [
      "Toward Ayodhya",
      "Toward Mithila",
      "Toward Lanka",
      "Toward Kishkindha",
    ],
    answer: 1,
    explanation:
      "After the sacrifice at Siddhashrama, Vishvamitra led Rama and Lakshmana north toward Mithila, the kingdom of King Janaka.",
  },

  {
    scene: "SCENE II",
    eyebrow: "THE SONA RIVER",
    question:
      "Where did the travellers spend a peaceful night beneath the stars?",
    options: [
      "Beside the Sona River",
      "Inside Mithila's palace",
      "At Gautama's hermitage",
      "Within Ayodhya's gardens",
    ],
    answer: 0,
    explanation:
      "As evening approached, the travellers reached the banks of the Sona River and rested beneath the open sky before continuing toward Mithila.",
  },

  {
    scene: "SCENE IV",
    eyebrow: "THE CITY OF VIDEHA",
    question:
      "What was the name of the kingdom whose capital was Mithila?",
    options: [
      "Kosala",
      "Videha",
      "Magadha",
      "Kuru",
    ],
    answer: 1,
    explanation:
      "Mithila was the capital of Videha, the kingdom ruled by King Janaka.",
  },

  {
    scene: "SCENE VII",
    eyebrow: "THE CHILD OF THE EARTH",
    question:
      "How did Janaka come to accept Sita as his daughter?",
    options: [
      "She was born to Queen Sunaina",
      "She was found in a sacred furrow",
      "She was given by Vishvamitra",
      "She was brought from Ayodhya",
    ],
    answer: 1,
    explanation:
      "Janaka discovered Sita while preparing the earth for a sacred rite. He regarded her as a daughter given by the earth itself and named her Sita after the sacred furrow.",
  },

  {
    scene: "SCENE X",
    eyebrow: "THE FIRST SIGHT",
    question:
      "What characterized Rama and Sita's first meeting in the inner garden?",
    options: [
      "A long public conversation",
      "A formal royal introduction",
      "A quiet exchange of glances",
      "A debate before Janaka",
    ],
    answer: 2,
    explanation:
      "Their first meeting was quiet and almost wordless. Their eyes met, they exchanged respectful gestures, and both sensed a strange familiarity without knowing why.",
  },

  {
    scene: "SCENE XIV",
    eyebrow: "THE RETURN OF AHALYA",
    question:
      "What brought an end to Ahalya's long curse?",
    options: [
      "Janaka's decree",
      "Vishvamitra's ritual",
      "Rama's arrival at the hermitage",
      "Gautama's return from the forest",
    ],
    answer: 2,
    explanation:
      "Vishvamitra explained that Rama's arrival would bring an end to Ahalya's long curse. Rama's presence became part of her restoration without judgment or pride.",
  },

  {
    scene: "SCENE XVI",
    eyebrow: "THE MEMORY OF A SAGE",
    question:
      "What was Vishvamitra before his long transformation into a sage?",
    options: [
      "A palace priest",
      "A merchant",
      "A powerful king",
      "A wandering musician",
    ],
    answer: 2,
    explanation:
      "Vishvamitra had once been a powerful king. After encountering the spiritual strength of Vasishtha, he turned toward austerity and gradually transformed himself through severe discipline.",
  },

  {
    scene: "SCENE XVII",
    eyebrow: "JANAKA'S SACRED RESOLVE",
    question:
      "What was the condition connected to Sita's marriage?",
    options: [
      "The man had to defeat Janaka in battle",
      "The man had to belong to a royal family",
      "The man had to handle the ancient sacred bow",
      "The man had to complete Janaka's sacrifice",
    ],
    answer: 2,
    explanation:
      "Janaka had made a solemn vow connected to the ancient bow preserved in Mithila. The man capable of handling that extraordinary bow would be worthy of receiving Sita's hand.",
  },

  {
    scene: "SCENE XXIII",
    eyebrow: "THE BOW OF SHIVA",
    question:
      "What happened when Rama attempted to string the ancient bow in Mithila?",
    options: [
      "The bow disappeared",
      "The bow broke",
      "The bow became lighter",
      "The bow was handed to Lakshmana",
    ],
    answer: 1,
    explanation:
      "Rama lifted the ancient bow and attempted to string it. As he drew it with controlled strength, the bow suddenly broke with an immense sound that shook the assembly.",
  },

  {
    scene: "SCENE XXXIV",
    eyebrow: "RECOGNITION",
    question:
      "What did Parashurama ultimately recognize during the second-bow encounter?",
    options: [
      "Rama's desire for kingship",
      "Rama's fear of battle",
      "Rama's divine identity",
      "Rama's wish to leave Ayodhya",
    ],
    answer: 2,
    explanation:
      "As Rama calmly handled the sacred bow, Parashurama's anger gave way to recognition. He understood that Rama's power and composure revealed a deeper divine identity.",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

function Chapter04Quiz({
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
            CHAPTER IV
          </span>

        </div>

        <div className="chapter-quiz__header-main">

          <div className="chapter-quiz__eyebrow">

            <Sparkles
              size={13}
              strokeWidth={1.2}
            />

            THE FOURTH CHRONICLE

          </div>

          <h1>
            REMEMBER
            <span>THE LAND OF VIDEHA</span>
          </h1>

          <p>
            Ten questions drawn from the
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
          ✦ THE FOURTH CHRONICLE ✦
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

export default Chapter04Quiz;