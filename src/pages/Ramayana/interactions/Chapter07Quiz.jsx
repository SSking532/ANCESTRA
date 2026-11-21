
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";

import "./Chapter01Quiz.css";

const questions = [
  {
    question: "Why do Rama, Sita and Lakshmana travel deeper into the Dandaka forest?",
    options: [
      "To establish a new kingdom",
      "To continue their forest exile and visit the sages",
      "To search for a royal treasure",
      "To return immediately to Ayodhya",
    ],
    answer: 1,
    explanation:
      "Their journey through the forest is part of Rama's exile. They encounter hermitages and sages whose lives are troubled by the dangers of the wilderness.",
  },
  {
    question: "What concern do the sages of the forest bring before Rama?",
    options: [
      "The loss of their sacred texts",
      "The destruction of their hermitages and disturbance of their spiritual life",
      "A dispute over Ayodhya's throne",
      "The need to build a royal road",
    ],
    answer: 1,
    explanation:
      "The sages describe the threats faced by those living in the forest and look to Rama for protection.",
  },
  {
    question: "What responsibility does Rama accept after hearing the sages?",
    options: [
      "To abandon the forest",
      "To become ruler of every hermitage",
      "To protect the sages and uphold his duty",
      "To send Lakshmana back to Ayodhya",
    ],
    answer: 2,
    explanation:
      "Rama takes their appeal seriously. His strength is to be used in the service of protection and dharma, not for pride.",
  },
  {
    question: "Who is Viradha in the events of the Dandaka forest?",
    options: [
      "A sage who guides the travellers",
      "A hostile being who confronts the three in the forest",
      "A messenger from Ayodhya",
      "A king who welcomes Rama",
    ],
    answer: 1,
    explanation:
      "Viradha is a dangerous forest adversary. The encounter tests the resolve and cooperation of Rama and Lakshmana.",
  },
  {
    question: "Which sage receives Rama, Sita and Lakshmana and entrusts Rama with important gifts?",
    options: [
      "Sage Agastya",
      "Sage Valmiki",
      "Sage Vashishtha",
      "Sage Vishvamitra",
    ],
    answer: 0,
    explanation:
      "Agastya welcomes the travellers and gives Rama sacred weapons, including inexhaustible quivers and a sword.",
  },
  {
    question: "What is the significance of the inexhaustible quivers given to Rama?",
    options: [
      "They can never be opened",
      "Their arrows do not run out",
      "They belong to Lakshmana",
      "They are ceremonial ornaments",
    ],
    answer: 1,
    explanation:
      "The quivers are extraordinary gifts: their supply of arrows is inexhaustible. They represent both great power and the responsibility that comes with it.",
  },
  {
    question: "What lesson does Agastya emphasize when speaking about weapons?",
    options: [
      "Weapons should be displayed to earn respect",
      "Strength should be used without hesitation",
      "Power must be guided by judgment and responsibility",
      "A warrior should never listen to counsel",
    ],
    answer: 2,
    explanation:
      "The gifts are not for display or pride. Agastya's teaching connects strength with restraint, judgment and duty.",
  },
  {
    question: "Who is Jatayu?",
    options: [
      "A young prince of Lanka",
      "A mighty vulture king and friend of Dasharatha",
      "A forest-dwelling sage",
      "A servant of Ravana",
    ],
    answer: 1,
    explanation:
      "Jatayu is the mighty vulture king. He reveals that he shared a friendship with Dasharatha, Rama's father.",
  },
  {
    question: "What does Jatayu offer to do for Rama, Sita and Lakshmana?",
    options: [
      "Guide them back to Ayodhya",
      "Watch over Sita when the brothers are away",
      "Take Agastya's gifts to the sages",
      "Build a palace in the forest",
    ],
    answer: 1,
    explanation:
      "Remembering his bond with Dasharatha, Jatayu offers his friendship and protection, especially when Rama and Lakshmana must leave Sita behind.",
  },
  {
    question: "Which idea best connects the encounters and teachings in this chapter?",
    options: [
      "Power is valuable when it serves duty and protects others",
      "A journey is meaningful only when it brings wealth",
      "Friendship matters only between family members",
      "Courage means acting without thought",
    ],
    answer: 0,
    explanation:
      "The chapter brings together protection of the sages, disciplined strength, Agastya's counsel and Jatayu's loyal friendship. Each reflects responsibility toward others.",
  },
];

export default function Chapter07Quiz({ onClose }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const question = questions[current];
  const selected = answers[current];
  const answered = selected !== undefined;

  const score = questions.reduce(
    (total, item, index) =>
      total + (answers[index] === item.answer ? 1 : 0),
    0
  );

  const progress = ((current + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  const selectAnswer = (index) => {
    if (answered) return;

    setAnswers((previous) => ({
      ...previous,
      [current]: index,
    }));
  };

  const nextQuestion = () => {
    if (!answered) return;

    if (current === questions.length - 1) {
      setFinished(true);
    } else {
      setCurrent((value) => value + 1);
    }
  };

  const previousQuestion = () => {
    if (current > 0) {
      setCurrent((value) => value - 1);
    }
  };

  const restart = () => {
    setCurrent(0);
    setAnswers({});
    setFinished(false);
  };

  return (
    <div className="chapter-quiz">
      {onClose && (
        <button type="button" className="chapter-quiz__exit" onClick={onClose} aria-label="Exit quiz" title="Exit">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>
      )}

      {/* AMBIENT BACKGROUND */}
      <div className="chapter-quiz__ambient">
        <div className="chapter-quiz__orb chapter-quiz__orb--one" />
        <div className="chapter-quiz__orb chapter-quiz__orb--two" />
      </div>

      <div className="chapter-quiz__grain" />

      <div className={`chapter-quiz__mandala ${finished ? "chapter-quiz__mandala--completion" : ""}`}>
        <div />
        <div />
        <div />
      </div>

      {/* HEADER */}
      <header className="chapter-quiz__header">

        <div className="chapter-quiz__identity">
          <i />
          <span>ANCESTRA · THE RAMAYANA</span>
        </div>

        <div className="chapter-quiz__header-main">

          <div className="chapter-quiz__eyebrow">
            <Sparkles size={13} strokeWidth={1.2} />
            THE SEVENTH CHRONICLE
          </div>

          <h1>
            THE FOREST
            <span>OF DANDAKA</span>
          </h1>

          <p>
            A journey of protection, wisdom, friendship and duty.
          </p>

        </div>

        <div className="chapter-quiz__counter">
          <span>QUESTION</span>
          <strong>
            {finished
              ? "10"
              : String(current + 1).padStart(2, "0")}
            <em> / 10</em>
          </strong>
        </div>

      </header>

      {/* PROGRESS */}
      {!finished && (
        <div className="chapter-quiz__progress">

          <div className="chapter-quiz__progress-track">
            <div style={{ width: `${progress}%` }} />
          </div>

          <div className="chapter-quiz__progress-labels">
            <span>THE JOURNEY THROUGH DANDAKA</span>
            <span>{Math.round(progress)}% COMPLETE</span>
          </div>

        </div>
      )}

      {/* QUESTIONS */}
      {!finished ? (

        <main className="chapter-quiz__main">

          <section className="chapter-quiz__question" key={current}>

            <div className="chapter-quiz__question-number">
              {String(current + 1).padStart(2, "0")}
            </div>

            <div className="chapter-quiz__question-meta">
              <i />
              REFLECTION &amp; UNDERSTANDING
              <i />
            </div>

            <h2>{question.question}</h2>

            <div className="chapter-quiz__ornament">
              <span />
              <Sparkles size={15} />
              <span />
            </div>

            {/* ANSWER OPTIONS */}
            <div className="chapter-quiz__options">

              {question.options.map((option, index) => {
                const correct = index === question.answer;
                const isSelected = selected === index;

                const classes = [
                  "chapter-quiz__option",
                  isSelected ? "is-selected" : "",
                  answered && correct ? "is-correct" : "",
                  answered && isSelected && !correct ? "is-wrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    type="button"
                    key={option}
                    className={classes}
                    onClick={() => selectAnswer(index)}
                    disabled={answered}
                  >

                    <span className="chapter-quiz__option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="chapter-quiz__option-text">
                      {option}
                    </span>

                    <span className="chapter-quiz__option-state">
                      {answered && correct && (
                        <CheckCircle2 size={19} />
                      )}

                      {answered && isSelected && !correct && (
                        <XCircle size={19} />
                      )}
                    </span>

                    {answered && isSelected && (
                      <span className="chapter-quiz__option-glow" />
                    )}

                  </button>
                );
              })}

            </div>

            {/* EXPLANATION */}
            {answered && (
              <div
                className={`chapter-quiz__explanation ${
                  selected === question.answer
                    ? "is-correct"
                    : "is-wrong"
                }`}
              >

                <div className="chapter-quiz__explanation-icon">
                  {selected === question.answer ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <XCircle size={20} />
                  )}
                </div>

                <div>
                  <span>
                    {selected === question.answer
                      ? "WELL UNDERSTOOD"
                      : "A MOMENT TO REFLECT"}
                  </span>

                  <p>{question.explanation}</p>
                </div>

              </div>
            )}

          </section>

        </main>

      ) : (

        /* COMPLETION */
        <main className="chapter-quiz--complete">

          <div className="chapter-quiz__completion-light" />

          <section className="chapter-quiz__completion">

            <div className="chapter-quiz__completion-mark">
              <Award size={32} />
            </div>

            <div className="chapter-quiz__completion-eyebrow">
              YOUR JOURNEY THROUGH DANDAKA
            </div>

            <h2>
              {score >= 8
                ? "Wisdom"
                : score >= 5
                  ? "A Thoughtful"
                  : "Every Journey"}
              <span>
                {score >= 8
                  ? "remembered."
                  : score >= 5
                    ? "Journey."
                    : "Teaches."}
              </span>
            </h2>

            <p>
              You answered {score} out of 10 questions correctly.
              Every encounter is an opportunity to understand
              the deeper meaning of the journey.
            </p>

            <div className="chapter-quiz__score">

              <div>YOUR SCORE</div>

              <strong>{score}</strong>

              <span>/ 10</span>

              <small>QUESTIONS ANSWERED CORRECTLY</small>

              <div className="chapter-quiz__score-line">
                <span style={{ width: `${score * 10}%` }} />
              </div>

            </div>

            <p>
              {score >= 8
                ? "You have understood the chapter's central encounters and the responsibility behind strength, friendship and protection."
                : "Return to the chapter's encounters and teachings. Understanding grows when we revisit a story with new attention."}
            </p>

            <div className="chapter-quiz__completion-actions">

              <button
                type="button"
                className="chapter-quiz__restart"
                onClick={restart}
              >
                <RotateCcw size={15} />
                TRY AGAIN
              </button>

              {onClose && (
                <button
                  type="button"
                  className="chapter-quiz__finish"
                  onClick={onClose}
                >
                  RETURN TO CHAPTER
                  <ArrowRight size={16} />
                </button>
              )}

            </div>

          </section>

        </main>
      )}

      {/* FOOTER */}
      {!finished && (
        <footer className="chapter-quiz__footer">

          <button
            type="button"
            className="chapter-quiz__back"
            onClick={previousQuestion}
            disabled={current === 0}
          >
            <ArrowLeft size={15} />
            PREVIOUS
          </button>

          <div className="chapter-quiz__footer-center">
            <i />
            {answeredCount} OF 10 ANSWERED
            <i />
          </div>

          <button
            type="button"
            className="chapter-quiz__next"
            onClick={nextQuestion}
            disabled={!answered}
          >
            {current === 9 ? "VIEW RESULT" : "CONTINUE"}
            <ArrowRight size={16} />
          </button>

        </footer>
      )}

      <div className="chapter-quiz__footer-center">
        THE PAST CANNOT BE CHANGED
        <i />
        THE WAY WE UNDERSTAND IT CAN
      </div>

    </div>
  );
}
