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
   CHAPTER XXVII — THE LAST DAYS OF RAMA
   A PROMISE TO TIME
========================================================= */

const QUESTIONS = [
  {
    scene: "SCENE I",
    eyebrow: "THE KING AFTER SITA",
    question:
      "Where did Lakshmana find Rama standing alone one evening, looking towards the trees that had once sheltered Sita?",
    options: [
      "In the royal assembly hall",
      "In the palace garden",
      "On the banks of the Sarayu",
      "In Sita's empty chamber",
    ],
    answer: 1,
    explanation:
      "Lakshmana found Rama in the palace garden, gazing at the trees that had once sheltered Sita from the afternoon sun. Rama carried his grief quietly, and the palace still remembered the queen who was no longer there.",
  },
  {
    scene: "SCENE III",
    eyebrow: "THE PASSAGE OF YEARS",
    question:
      "How did Rama say a story survives when those who hear it never saw the events themselves?",
    options: [
      "Because kings order it to be recorded in every court",
      "Because the same events return in every age",
      "Because the young are taught to recite it word for word",
      "Because those who come after may still understand what those moments meant",
    ],
    answer: 3,
    explanation:
      "Listening to the students recite the story of the bridge to Lanka, Rama told Lakshmana that those who come after may never see what they saw, but may still understand what those moments meant.",
  },
  {
    scene: "SCENE V",
    eyebrow: "THE MESSAGE OF TIME",
    question:
      "Who was the mysterious ascetic revealed to be in the private chamber?",
    options: [
      "Kala, Time itself, the messenger of Brahma",
      "Sage Durvasa in disguise",
      "A messenger sent by Bharata",
      "Sage Valmiki, returned to Ayodhya",
    ],
    answer: 0,
    explanation:
      "Once the doors were closed, the ascetic revealed himself as Kala, Time itself, who had come as the messenger of Brahma to speak of the conclusion of Rama's earthly journey.",
  },
  {
    scene: "SCENE V",
    eyebrow: "THE MESSAGE OF TIME",
    question:
      "What condition did Kala place upon the private conversation?",
    options: [
      "That Lakshmana must remain inside the chamber",
      "That the meeting must end before sunset",
      "That if anyone entered and interrupted, Rama would have to uphold the consequence he had accepted",
      "That the ministers must be told its purpose afterwards",
    ],
    answer: 2,
    explanation:
      "Kala made it clear that if anyone entered the chamber and interrupted their conversation, Rama would have to uphold the consequence he had accepted. Rama gave his word that no one would enter.",
  },
  {
    scene: "SCENE VI",
    eyebrow: "THE KING'S COMMAND",
    question:
      "What did Rama stress to Lakshmana before beginning the private conversation?",
    options: [
      "That visitors should be received with honour in his absence",
      "That there must be no interruption, because he had given his word that the meeting would remain private",
      "That the ministers should be called if the meeting ran long",
      "That Lakshmana should keep the guards close to the door",
    ],
    answer: 1,
    explanation:
      "Rama told Lakshmana there must be no interruption, since he had given his word that the meeting would remain private. Lakshmana replied that Rama's word would be protected.",
  },
  {
    scene: "SCENE VIII",
    eyebrow: "THE IMPOSSIBLE CHOICE",
    question:
      "What did Durvasa threaten to do if Rama refused to receive him?",
    options: [
      "Leave Ayodhya and never return",
      "Enter the chamber by force",
      "Demand that Lakshmana serve him",
      "Pronounce a curse upon the kingdom",
    ],
    answer: 3,
    explanation:
      "Durvasa declared that if Rama refused to receive him, he would pronounce a curse upon the kingdom and let the people of Ayodhya suffer the consequence. Lakshmana's offers of food, water and rest did not move him.",
  },
  {
    scene: "SCENE IX",
    eyebrow: "A BROTHER'S SACRIFICE",
    question:
      "Why did Lakshmana decide to enter the private chamber?",
    options: [
      "He could not allow the people of Ayodhya to suffer, and he accepted the consequence himself",
      "He had forgotten Rama's instruction",
      "Durvasa ordered the guards to open the door",
      "Kala called him inside",
    ],
    answer: 0,
    explanation:
      "Lakshmana thought of the people who had already endured so much and could not let them suffer because of a decision made at the entrance. He knew that entering would bring a consequence upon himself, and he accepted it.",
  },
  {
    scene: "SCENE X",
    eyebrow: "THE PROMISE",
    question:
      "Why could Rama not simply set the consequence aside after the interruption?",
    options: [
      "The ministers insisted that the law be enforced",
      "Lakshmana demanded to be held to the promise at once",
      "He had given his word to Kala, and a king could not treat such a promise as meaningless",
      "Durvasa refused to leave until it was done",
    ],
    answer: 2,
    explanation:
      "The royal preceptor explained that Lakshmana's intention had been noble, yet Rama had given his word to Kala, and a king could not treat such a promise as though it were meaningless. Rama bore the sorrow of it.",
  },
  {
    scene: "SCENE XI",
    eyebrow: "THE FINAL FAREWELL",
    question:
      "What did Lakshmana tell Rama about his decision in the palace courtyard?",
    options: [
      "That he had acted on the sage's orders",
      "That the choice was his own and he would make it again",
      "That Rama had asked him to make that choice",
      "That he regretted breaking the promise",
    ],
    answer: 1,
    explanation:
      "Lakshmana told Rama that he had made the choice himself and would do so again. He asked Rama not to remember the moment as a failure between them, but to remember the years they had shared.",
  },
  {
    scene: "SCENE XII",
    eyebrow: "THE SARAYU",
    question:
      "What did Lakshmana do at the banks of the Sarayu?",
    options: [
      "He waited there for Rama to call him back",
      "He crossed the river to return to the forest",
      "He asked Bharata to take his place beside Rama",
      "He sat in meditation and turned his thoughts towards the divine",
    ],
    answer: 3,
    explanation:
      "At the Sarayu, Lakshmana sat in meditation and turned his thoughts towards the divine. The traditional account describes him entering the river and departing from earthly existence, returning to his divine nature.",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function Chapter27Quiz({
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
          <span>CHAPTER XXVII</span>
        </div>

        <div className="chapter-quiz__header-main">

          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE TWENTY-SEVENTH CHRONICLE
          </div>

          <h1>
            THE LAST DAYS
            <span>OF RAMA</span>
          </h1>

          <p>
            Ten questions drawn from the message of Time,
            Lakshmana's choice, and the brothers' farewell.
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
          <span>THE FINAL DAYS DRAW NEAR</span>
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
          ✦ THE TWENTY-SEVENTH CHRONICLE ✦
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          THE LAST DAYS
          <span>REMEMBERED</span>
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