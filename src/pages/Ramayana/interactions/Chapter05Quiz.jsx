
// ============================================================
// ANCESTRA — RAMAYANA
// CHAPTER V — THE CROWN THAT NEVER CAME
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

// Reuse the existing Chapter I stylesheet.
// No CSS changes are required.
import "./Chapter01Quiz.css";

const QUESTIONS = [
  {
    scene: "THE KING'S DECISION",
    eyebrow: "THE SUCCESSION",
    question:
      "Why did Dasharatha decide that Rama should be crowned as the next king of Ayodhya?",
    options: [
      "Rama had demanded the throne from his father",
      "Rama was loved by the people and regarded as worthy of kingship",
      "The royal council had rejected all the other princes",
      "The kingdom had been promised to Rama at his birth",
    ],
    answer: 1,
    explanation:
      "Dasharatha saw Rama as a worthy successor. His qualities, conduct and the affection people held for him made the decision to prepare for his coronation natural.",
  },

  {
    scene: "SCENE VII",
    eyebrow: "THE CORONATION",
    question:
      "What was Ayodhya preparing to celebrate before the events changed the kingdom's future?",
    options: [
      "The return of Bharata from Kekaya",
      "The marriage of another royal prince",
      "The coronation of Rama as crown prince",
      "A great victory over a neighbouring kingdom",
    ],
    answer: 2,
    explanation:
      "Ayodhya was preparing for Rama's coronation. The city was filled with celebration and anticipation, making the later announcement of exile especially painful.",
  },

  {
    scene: "SCENE XII",
    eyebrow: "MANTHARA'S COUNSEL",
    question:
      "What fear did Manthara use to influence Kaikeyi against Rama's coronation?",
    options: [
      "That Rama would leave Ayodhya immediately after becoming king",
      "That Bharata would lose his place in the royal succession and Kaikeyi's influence would diminish",
      "That Dasharatha would transfer the kingdom to the sages",
      "That the people would refuse to accept Kaikeyi as queen",
    ],
    answer: 1,
    explanation:
      "Manthara encouraged Kaikeyi to see Rama's coronation as a threat to Bharata's future and to her own position. She turned the coming celebration into a source of fear and suspicion.",
  },

  {
    scene: "THE TWO BOONS",
    eyebrow: "THE PROMISE",
    question:
      "What were the two boons Kaikeyi demanded from Dasharatha?",
    options: [
      "Bharata's coronation and Rama's fourteen-year exile",
      "Bharata's coronation and Lakshmana's exile",
      "A new palace for Bharata and Rama's immediate departure",
      "Dasharatha's retirement and Bharata's coronation",
    ],
    answer: 0,
    explanation:
      "Kaikeyi demanded that Bharata be crowned king and that Rama spend fourteen years in the forest. Dasharatha was bound by the promises he had once made to her.",
  },

  {
    scene: "THE EXILE",
    eyebrow: "RAMA'S RESPONSE",
    question:
      "How did Rama respond when he learned that he must give up the coronation and leave for the forest?",
    options: [
      "He challenged Kaikeyi's demand before the royal court",
      "He asked Bharata to refuse the throne",
      "He accepted the exile and chose to uphold his father's promise",
      "He decided to leave Ayodhya without informing his family",
    ],
    answer: 2,
    explanation:
      "Rama accepted the decision without allowing anger or the loss of the crown to overcome his commitment to his father's word. He placed duty above personal ambition.",
  },

  {
    scene: "SCENE XXXI",
    eyebrow: "SITA'S DECISION",
    question:
      "Why did Sita decide to accompany Rama into the forest?",
    options: [
      "She wanted to return to her father's kingdom",
      "She believed that her place was beside Rama, sharing his life and hardships",
      "She wished to persuade Bharata to surrender the throne",
      "She had been ordered by Dasharatha to leave Ayodhya",
    ],
    answer: 1,
    explanation:
      "Sita refused to separate her life from Rama's. She understood the hardships of forest life but chose to accompany her husband rather than remain in the comfort of the palace.",
  },

  {
    scene: "THE BROTHER'S VOW",
    eyebrow: "LAKSHMANA",
    question:
      "What was the central reason Lakshmana insisted on accompanying Rama?",
    options: [
      "He wanted to become the ruler of the forest settlements",
      "He feared that Bharata would take away his position",
      "He wished to serve and remain beside Rama throughout the exile",
      "He wanted to avoid remaining in the palace with the royal family",
    ],
    answer: 2,
    explanation:
      "Lakshmana's decision came from his deep devotion to Rama. He wished to serve his brother and stand beside him during the years of exile.",
  },

  {
    scene: "SCENE XXIX",
    eyebrow: "URMILA'S FAREWELL",
    question:
      "What emotional conflict lies at the heart of Lakshmana and Urmila's farewell?",
    options: [
      "Lakshmana wants the throne while Urmila supports Bharata",
      "Lakshmana's duty toward Rama meets his love and responsibilities toward Urmila",
      "Urmila wants to return to Mithila while Lakshmana wants to remain in Ayodhya",
      "Both wish to leave the royal family and rule a forest kingdom",
    ],
    answer: 1,
    explanation:
      "Their farewell carries the weight of two responsibilities. Lakshmana is devoted to Rama, but he is also leaving behind a wife who loves him and wishes to share his life. Their bond makes the departure deeply personal.",
  },

  {
    scene: "BHARATA'S RESPONSE",
    eyebrow: "THE RETURN",
    question:
      "When Bharata learned what had happened in Ayodhya, how did he respond to the throne that had been given to him?",
    options: [
      "He accepted the crown and began his reign",
      "He demanded that Lakshmana return first",
      "He refused to regard the throne as his rightful happiness and sought to bring Rama back",
      "He left Ayodhya permanently without meeting Rama",
    ],
    answer: 2,
    explanation:
      "Bharata did not celebrate the result of Kaikeyi's demand. He rejected the idea of enjoying a kingdom obtained through Rama's exile and sought Rama's return.",
  },

  {
    scene: "SCENE XXXVIII",
    eyebrow: "THE DEPARTURE",
    question:
      "Why does the title 'The Crown That Never Came' capture the meaning of this chapter?",
    options: [
      "Ayodhya had decided that it no longer needed a king",
      "Bharata had destroyed the royal crown before Rama's return",
      "The coronation preparations ended with Rama leaving Ayodhya for exile instead of becoming king",
      "Dasharatha had given the crown to a neighbouring kingdom",
    ],
    answer: 2,
    explanation:
      "The chapter begins with the promise of Rama's coronation but ends with his departure. The crown that was prepared for him never reached his head; duty and exile replaced the celebration Ayodhya had expected.",
  },
];

function Chapter05Quiz({ onComplete, onClose }) {
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

  useEffect(() => {
    if (!finished) return;

    onComplete?.();
  }, [finished, onComplete]);

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

  const previousQuestion = () => {
    if (currentIndex === 0 || answered) return;

    setDirection(-1);

    setCurrentIndex((value) => value - 1);
  };

  const restart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setShowExplanation(false);
    setDirection(1);
  };

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
          <span>CHAPTER V</span>
        </div>

        <div className="chapter-quiz__header-main">
          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE CROWN THAT NEVER CAME
          </div>

          <h1>
            REMEMBER
            <span>THE DEPARTURE</span>
          </h1>

          <p>
            Ten questions drawn from the story you have just
            experienced.
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

// ============================================================
// COMPLETION
// ============================================================

function QuizCompletion({ score, total, onRestart, onClose }) {
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
          initial={{
            scale: 0.4,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          ✦ THE FIFTH CHRONICLE ✦
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
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
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

export default Chapter05Quiz;
