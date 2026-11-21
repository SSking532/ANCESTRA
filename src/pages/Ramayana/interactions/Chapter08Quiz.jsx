
// ============================================================
// ANCESTRA — RAMAYANA
// CHAPTER VIII — THE ABDUCTION OF SITA
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

// Reuse the exact Chapter I quiz styling.
import "./Chapter01Quiz.css";

/* ============================================================
   CHAPTER VIII QUESTIONS
   ============================================================ */

const QUESTIONS = [
  {
    scene: "SCENE I",
    eyebrow: "THE FOURTEEN THOUSAND",

    question:
      "What was Rama's primary reason for confronting the fourteen thousand rakshasas?",

    options: [
      "To claim the forest as his own kingdom",
      "To challenge Ravana for control of Lanka",
      "To protect the sages and defend the forest from the rakshasas",
      "To prove his strength before the people of Ayodhya",
    ],

    answer: 2,

    explanation:
      "Rama's confrontation was rooted in his responsibility to protect the sages and those living in the forest. He did not seek power or territory. He stood against those who disturbed the peace of the hermitages and threatened the innocent.",
  },

  {
    scene: "SCENE II",
    eyebrow: "THE FALL OF THE RAKSHASA ARMY",

    question:
      "What does Rama's victory against the fourteen thousand rakshasas reveal about his character?",

    options: [
      "He uses his strength with purpose and responsibility",
      "He seeks conflict whenever an opportunity appears",
      "He fights only to earn recognition and praise",
      "He has forgotten the duties of his forest exile",
    ],

    answer: 0,

    explanation:
      "Rama's strength is guided by purpose. His actions are not driven by pride or a desire for recognition. He uses his abilities to defend those who cannot protect themselves and to uphold righteousness.",
  },

  {
    scene: "SCENE III",
    eyebrow: "THE GOLDEN ILLUSION",

    question:
      "Who assumes the extraordinary form of the golden deer?",

    options: [
      "Khara",
      "Maricha",
      "Dushana",
      "Jatayu",
    ],

    answer: 1,

    explanation:
      "Maricha assumes the form of a beautiful golden deer as part of Ravana's plan. Its unusual appearance attracts Sita's attention and draws Rama away from their forest dwelling.",
  },

  {
    scene: "SCENE IV",
    eyebrow: "THE DEER IN THE FOREST",

    question:
      "Why does Sita ask Rama to pursue the golden deer?",

    options: [
      "She recognizes it as a messenger from Ayodhya",
      "She wishes to send it to the sages",
      "She believes it is connected to Ravana",
      "She is captivated by its extraordinary beauty and wishes to have it",
    ],

    answer: 3,

    explanation:
      "The golden deer's extraordinary beauty captures Sita's attention. She asks Rama to pursue it, unaware that its appearance is part of a carefully arranged deception.",
  },

  {
    scene: "SCENE V",
    eyebrow: "THE DISTANT CRY",

    question:
      "What creates the urgency that eventually draws Lakshmana away from the hermitage?",

    options: [
      "A messenger arrives from Ayodhya",
      "A forest sage warns him about Ravana",
      "Maricha imitates Rama's voice and cries out for help",
      "Jatayu calls Lakshmana from the sky",
    ],

    answer: 2,

    explanation:
      "After Rama strikes him, Maricha uses his remaining strength to imitate Rama's voice and cry out. Hearing what sounds like Rama calling for help, Sita becomes deeply anxious and urges Lakshmana to go to him.",
  },

  {
    scene: "SCENE VI",
    eyebrow: "THE EMPTY HERMITAGE",

    question:
      "Why does Ravana wait for Rama and Lakshmana to leave before approaching Sita?",

    options: [
      "He wants to speak with Rama first",
      "He needs the hermitage to be unprotected so he can carry out his plan",
      "He is waiting for Jatayu to arrive",
      "He wishes to ask Lakshmana for directions to Lanka",
    ],

    answer: 1,

    explanation:
      "Ravana's plan depends on separating Sita from her protectors. With Rama pursuing the deer and Lakshmana leaving the hermitage, Ravana finds the opportunity he has been waiting for.",
  },

  {
    scene: "SCENE VII",
    eyebrow: "THE ABDUCTION OF SITA",

    question:
      "What does Ravana do after revealing his true identity to Sita?",

    options: [
      "He carries Sita away in his flying chariot",
      "He returns to Lanka without her",
      "He challenges Lakshmana to a duel",
      "He asks Sita to travel to Ayodhya",
    ],

    answer: 0,

    explanation:
      "Ravana reveals himself and carries Sita away in his flying chariot towards Lanka. The peaceful life at Panchavati is shattered, and Rama's search for Sita is about to begin.",
  },

  {
    scene: "SCENE VIII",
    eyebrow: "JATAYU — THE LAST FLIGHT",

    question:
      "Why does Jatayu decide to confront Ravana?",

    options: [
      "He wishes to claim Ravana's flying chariot",
      "He wants to challenge Ravana for the throne of Lanka",
      "He has been ordered by Rama to follow Ravana",
      "He witnesses Sita being abducted and rises to protect her",
    ],

    answer: 3,

    explanation:
      "Jatayu, the noble vulture king and a friend of Dasharatha, witnesses Ravana carrying Sita away. Despite knowing the danger, he chooses to intervene rather than remain a silent spectator.",
  },

  {
    scene: "SCENE IX",
    eyebrow: "THE FALL OF THE VULTURE KING",

    question:
      "What is the outcome of Jatayu's confrontation with Ravana?",

    options: [
      "Jatayu successfully brings Sita back to Panchavati",
      "Ravana escapes with Sita, but Jatayu delays him through his resistance",
      "Ravana abandons his journey to Lanka",
      "Jatayu joins Ravana's forces",
    ],

    answer: 1,

    explanation:
      "Jatayu fights with extraordinary courage and obstructs Ravana's journey. Although he cannot ultimately prevent the abduction, his resistance delays Ravana and demonstrates the strength of his commitment to protecting Sita.",
  },

  {
    scene: "SCENE X",
    eyebrow: "THE MESSAGE TO RAMA",

    question:
      "Why is Jatayu's final encounter with Rama important to the unfolding story?",

    options: [
      "He tells Rama that Sita has already returned to Ayodhya",
      "He reveals the location of every kingdom in the forest",
      "He tells Rama what happened during the abduction and provides a vital lead in the search for Sita",
      "He asks Rama to abandon the search and return home",
    ],

    answer: 2,

    explanation:
      "Jatayu shares what he witnessed and tells Rama that Ravana carried Sita away. His account gives Rama crucial information about the abduction. Even in his final moments, Jatayu's courage becomes an important part of Rama's journey.",
  },
];

/* ============================================================
   COMPONENT
   ============================================================ */

function Chapter08Quiz({ onComplete, onClose }) {
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

  /* ==========================================================
     PREVIOUS
  ========================================================== */

  const previousQuestion = () => {
    if (currentIndex === 0 || answered) return;

    setDirection(-1);
    setCurrentIndex((value) => value - 1);
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
          <span>CHAPTER VIII</span>
        </div>

        <div className="chapter-quiz__header-main">

          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE EIGHTH CHRONICLE
          </div>

          <h1>
            REMEMBER
            <span>THE ABDUCTION</span>
          </h1>

          <p>
            Ten questions drawn from the events
            that changed the course of the journey.
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
                    ].filter(Boolean).join(" ")}

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

/* ============================================================
   COMPLETION
   ============================================================ */

function QuizCompletion({
  score,
  total,
  onRestart,
  onClose,
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
          ✦ THE EIGHTH CHRONICLE ✦
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
              transition={{
                delay: 0.95,
                duration: 1,
              }}
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

export default Chapter08Quiz;
