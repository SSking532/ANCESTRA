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
   CHAPTER XXV — THE HORSE OF THE ASHVAMEDHA
   TWO PRINCES CHALLENGE AYODHYA
========================================================= */

const QUESTIONS = [
  {
    scene: "SCENE I",
    eyebrow: "THE GREAT ROYAL RITE",
    question:
      "What was placed beside Rama during the Ashvamedha to represent the queen's presence in the sacred rites?",
    options: [
      "A royal banner of Ayodhya",
      "A golden image of Sita",
      "An empty throne",
      "A garland of sacred flowers",
    ],
    answer: 1,
    explanation:
      "Sita was no longer beside Rama, so according to the tradition followed for the sacrifice, a golden image of Sita was placed beside him. The ceremony proclaimed the strength of his kingdom, but it could not restore the happiness he had lost.",
  },
  {
    scene: "SCENE III",
    eyebrow: "THE PRINCE TAKES COMMAND",
    question:
      "Whom did Rama entrust with leading the army that would accompany the sacred horse?",
    options: [
      "Bharata",
      "Lakshmana",
      "Shatrughna",
      "Hanuman",
    ],
    answer: 2,
    explanation:
      "Rama entrusted the expedition to his younger brother Shatrughna, an experienced warrior and trusted member of the royal family. He was to protect the horse's journey and uphold the honour of Ayodhya.",
  },
  {
    scene: "SCENE IV",
    eyebrow: "THE KINGDOMS BEYOND AYODHYA",
    question:
      "What did Shatrughna remind his commanders about the strength of a king as the horse travelled across the lands?",
    options: [
      "It is shown by how many lands he can frighten",
      "It is shown by the number of kings who bow to him",
      "It is shown by the order and security his rule can bring",
      "It is shown by the size of his army",
    ],
    answer: 2,
    explanation:
      "Shatrughna told his commanders that the ceremony was not an excuse to bring hardship upon ordinary people. A king's strength, he said, lies in the order and security his rule can bring, not in how many lands he can frighten.",
  },
  {
    scene: "SCENE V",
    eyebrow: "WHERE TWO JOURNEYS MEET",
    question:
      "With whom were Lava and Kusha travelling when the royal expedition entered the forest?",
    options: [
      "Hanuman",
      "Sage Vasishtha",
      "Valmiki",
      "Jambavan",
    ],
    answer: 2,
    explanation:
      "Lava and Kusha were travelling with Sage Valmiki, carrying the Ramayana towards the kingdom whose history they had learned to sing. Their journey and the horse's journey were drawing closer.",
  },
  {
    scene: "SCENE VI",
    eyebrow: "THE DECLARATION OF A KING",
    question:
      "According to the inscription, what would it mean if a ruler let the horse pass without challenge?",
    options: [
      "He had agreed to attend the sacrifice in Ayodhya",
      "He had accepted a treaty of peace with Rama",
      "He was acknowledging the sovereignty of Ayodhya",
      "He was offering the horse a safe place to rest",
    ],
    answer: 2,
    explanation:
      "The declaration announced that any ruler who allowed the horse to pass without challenge would be understood to acknowledge the sovereignty of Ayodhya. Those who disagreed were expected to challenge it.",
  },
  {
    scene: "SCENE VII",
    eyebrow: "THE DECISION",
    question:
      "What lesson did Valmiki remind the twins of before they turned towards the horse?",
    options: [
      "That a sage should never interfere in the affairs of kings",
      "That courage must be guided by wisdom",
      "That strength is the only measure of a warrior",
      "That a royal declaration can never be questioned",
    ],
    answer: 1,
    explanation:
      "Valmiki told the boys that they had been taught that courage must be guided by wisdom, and asked them not to forget it. The twins bowed and said they understood, but they would not let the declaration pass unquestioned.",
  },
  {
    scene: "SCENE IX",
    eyebrow: "THE KING'S SOLDIERS",
    question:
      "How did Lava and Kusha answer the royal commander who demanded that they return the horse?",
    options: [
      "They said they would return it once the army had rested",
      "They said they had stopped it precisely because they understood the declaration",
      "They said they had found the horse abandoned in the forest",
      "They asked Valmiki to hand it back on their behalf",
    ],
    answer: 1,
    explanation:
      "Lava replied that they understood the declaration, and that was precisely why they had stopped the horse. Kusha added that they would not accept a claim merely because it was made by a powerful king.",
  },
  {
    scene: "SCENE XI",
    eyebrow: "THE FIRST CLASH",
    question:
      "How did the first confrontation between the royal soldiers and the twins end?",
    options: [
      "The soldiers recovered the horse and took the twins prisoner",
      "The twins fled into the forest and left the horse behind",
      "The royal force failed to recover the horse and withdrew to reconsider",
      "Valmiki stepped in and ended the fight at once",
    ],
    answer: 2,
    explanation:
      "The soldiers soon realised the two young princes were far more capable than their age suggested. The first confrontation ended without the royal force achieving its objective, and the news reached Shatrughna.",
  },
  {
    scene: "SCENE XV",
    eyebrow: "THE UNCONQUERED HORSE",
    question:
      "When Shatrughna asked who had taught them to fight with such discipline, whose name did the twins give?",
    options: [
      "Vishvamitra",
      "Agastya",
      "Bharadvaja",
      "Valmiki",
    ],
    answer: 3,
    explanation:
      "Lava and Kusha said they had learned from the sages of the forest, and named Valmiki. The name gave Shatrughna pause, for he knew the reputation of the great poet and sage.",
  },
  {
    scene: "SCENE XVIII",
    eyebrow: "THE KING'S DECISION",
    question:
      "What did Rama decide to do after hearing that two students of Valmiki had stopped the Ashvamedha horse?",
    options: [
      "Send a larger army to recover the horse",
      "Cancel the Ashvamedha sacrifice",
      "Go to the forest himself to understand their reasons",
      "Summon Valmiki to the palace",
    ],
    answer: 2,
    explanation:
      "The mention of Valmiki's hermitage changed the matter for Rama. He wished to understand the boys' reasons before it went any further, and ordered preparations for his journey to the forest, unaware that the two young princes were his own sons.",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function Chapter25Quiz({
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
          <span>CHAPTER XXV</span>
        </div>

        <div className="chapter-quiz__header-main">

          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE TWENTY-FIFTH CHRONICLE
          </div>

          <h1>
            THE HORSE OF
            <span>THE ASHVAMEDHA</span>
          </h1>

          <p>
            Ten questions drawn from the sacred horse,
            the two young princes, and the challenge you have just witnessed.
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
          <span>THE HORSE ADVANCES</span>
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
          ✦ THE TWENTY-FIFTH CHRONICLE ✦
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          THE CHALLENGE
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