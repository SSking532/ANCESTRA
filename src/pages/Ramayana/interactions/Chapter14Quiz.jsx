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

const QUESTIONS = [
  {
    scene: "SCENE III",
    eyebrow: "THE EXILE",
    question:
      "Why was Vibhishana driven away from Ravana's court?",
    options: [
      "He refused to fight in the war",
      "He urged Ravana to return Sita and choose peace",
      "He wanted to become the king of Lanka",
      "He revealed the secrets of Lanka to the Vanaras",
    ],
    answer: 1,
    explanation:
      "Vibhishana repeatedly counselled Ravana to return Sita and avoid a disastrous war. Ravana rejected his advice and cast him out of Lanka.",
  },
  {
    scene: "SCENE VI",
    eyebrow: "THE PROMISE OF REFUGE",
    question:
      "What did Rama decide when Sugriva raised doubts about Vibhishana?",
    options: [
      "To send Vibhishana back to Lanka",
      "To imprison Vibhishana until the war ended",
      "To grant Vibhishana refuge",
      "To ask Ravana for permission to accept him",
    ],
    answer: 2,
    explanation:
      "Rama declared that anyone who sincerely sought refuge would be protected. He accepted Vibhishana despite the doubts raised by the Vanara commanders.",
  },
  {
    scene: "SCENE VI",
    eyebrow: "THE COUNSEL OF HANUMAN",
    question:
      "Which Vanara gave a favourable assessment of Vibhishana's arrival?",
    options: [
      "Angada",
      "Jambavan",
      "Nala",
      "Hanuman",
    ],
    answer: 3,
    explanation:
      "Hanuman considered Vibhishana's words and conduct and believed that his approach was sincere. His counsel supported giving Vibhishana a fair hearing.",
  },
  {
    scene: "SCENE VII",
    eyebrow: "THE SECRETS OF LANKA",
    question:
      "How did Vibhishana help Rama's forces after being accepted?",
    options: [
      "He revealed Lanka's defences and important strategic details",
      "He led the Vanara army back across the sea",
      "He asked the army to attack without a plan",
      "He challenged Ravana to a personal duel",
    ],
    answer: 0,
    explanation:
      "Having once served in Lanka's royal court, Vibhishana understood its arrangements. He shared valuable knowledge that helped Rama's forces prepare.",
  },
  {
    scene: "SCENE XI",
    eyebrow: "THE FINAL MESSAGE",
    question:
      "Why did Rama send Angada to Ravana's court?",
    options: [
      "To demand that Ravana surrender Lanka",
      "To challenge Ravana to a contest",
      "To deliver a final message and offer Ravana one last chance to make peace",
      "To ask Ravana to join Rama's army",
    ],
    answer: 2,
    explanation:
      "Before beginning the war, Rama sent Angada as an envoy. Angada carried the message that Ravana could still avoid conflict by returning Sita.",
  },
  {
    scene: "SCENE XV",
    eyebrow: "THE PLANTED FOOT",
    question:
      "What happened when Angada planted his foot in Ravana's court?",
    options: [
      "Ravana immediately accepted Rama's offer",
      "The warriors who tried could not move Angada's foot",
      "Angada was forced to leave the court",
      "The court floor collapsed beneath him",
    ],
    answer: 1,
    explanation:
      "Angada planted his foot firmly and challenged the court to move it. The assembled warriors failed, demonstrating his strength and resolve.",
  },
];

function Chapter14Quiz({ onComplete, onClose }) {
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
    setSelectedAnswer(null);
    setShowExplanation(false);
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

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onComplete?.();
    }
  };

  if (finished) {
    return (
      <QuizCompletion
        score={score}
        total={QUESTIONS.length}
        onRestart={restart}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="chapter-quiz">
      {handleClose && (
        <button type="button" className="chapter-quiz__exit" onClick={handleClose} aria-label="Exit quiz" title="Exit">
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
          <span>CHAPTER XIV</span>
        </div>

        <div className="chapter-quiz__header-main">
          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE GATES OF LANKA
          </div>

          <h1>
            REMEMBER
            <span>THE GATES OF LANKA</span>
          </h1>

          <p>
            Six questions drawn from the choices, counsel,
            and challenges that brought both armies to the
            edge of war.
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
            animate={{ opacity: 1, x: 0 }}
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
                    whileTap={
                      !answered ? { scale: 0.99 } : undefined
                    }
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
          ✦ THE GATES OF LANKA ✦
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
              transition={{ delay: 0.95, duration: 1 }}
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

export default Chapter14Quiz;