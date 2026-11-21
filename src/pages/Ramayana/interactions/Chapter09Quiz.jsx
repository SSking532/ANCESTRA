
import React, { useState } from "react";
import { ArrowRight, ArrowLeft, Check, X, Sparkles } from "lucide-react";
import "./Chapter01Quiz.css";

const questions = [
  {
    question: "What was Hanuman's position in Sugriva's kingdom?",
    options: [
      "Sugriva's chief minister",
      "The commander of Vali's army",
      "The ruler of Kishkindha",
      "The guardian of Lanka",
    ],
    answer: 0,
    explanation:
      "Hanuman served Sugriva as a trusted minister and adviser.",
  },
  {
    question:
      "Why did Sugriva send Hanuman to approach Rama and Lakshmana?",
    options: [
      "To challenge them to a battle",
      "To discover who they were and why they had come",
      "To invite them immediately to Lanka",
      "To ask them to leave the forest",
    ],
    answer: 1,
    explanation:
      "Sugriva wanted Hanuman to discover the identity and intentions of the two unfamiliar princes.",
  },
  {
    question:
      "Which qualities did Rama recognize in Hanuman's speech?",
    options: [
      "Grammatical correctness, clarity and thoughtful expression",
      "Loudness, speed and forcefulness",
      "Flattery, exaggeration and dramatic language",
      "Silence, hesitation and uncertainty",
    ],
    answer: 0,
    explanation:
      "Rama admired Hanuman's refined language, clear expression, grammatical mastery and measured delivery.",
  },
  {
    question:
      "Rama and Lakshmana first meet Hanuman inside the golden city of Lanka.",
    options: ["True", "False"],
    answer: 1,
    explanation:
      "Their first encounter takes place in the forest near Rishyamuka, where Sugriva was staying.",
  },
  {
    question:
      "Hanuman approaches Rama and Lakshmana in the guise of an ascetic during their first meeting.",
    options: ["True", "False"],
    answer: 0,
    explanation:
      "Hanuman adopts the appearance of an ascetic when he approaches the two princes on Sugriva's behalf.",
  },
];

export default function Chapter09Quiz({ onComplete, onExit }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const question = questions[currentQuestion];

  const isCorrect = selectedAnswer === question.answer;

  const finalScore = answers.filter(
    (answer, index) => answer === questions[index].answer
  ).length;

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const updatedAnswers = [...answers, selectedAnswer];
    setAnswers(updatedAnswers);

    if (currentQuestion === questions.length - 1) {
      setShowResult(true);
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
  };

  return (
    <div className={`chapter-quiz ${showResult ? "chapter-quiz--complete" : ""}`}>
      {onExit && (
        <button type="button" className="chapter-quiz__exit" onClick={onExit} aria-label="Exit quiz" title="Exit">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>
      )}
      <div className="chapter-quiz__ambient">
        <div className="chapter-quiz__grain" />
        <div className="chapter-quiz__orb chapter-quiz__orb--one" />
        <div className="chapter-quiz__orb chapter-quiz__orb--two" />
        <div className="chapter-quiz__mandala">
          <div />
          <div />
          <div />
        </div>
      </div>

      {showResult ? (
        <>
          <div className="chapter-quiz__completion-light" />
          <div className="chapter-quiz__mandala chapter-quiz__mandala--completion">
            <div />
            <div />
            <div />
          </div>

          <div className="chapter-quiz__completion">
            <div className="chapter-quiz__completion-mark">
              <Sparkles size={27} />
            </div>

            <span className="chapter-quiz__completion-eyebrow">
              THE MEETING WITH HANUMAN
            </span>

            <h2>
              Wisdom
              <span>Revealed</span>
            </h2>

            <div className="chapter-quiz__score">
              <div>
                <strong>{finalScore}</strong>
                <span> / {questions.length}</span>
              </div>
              <small>QUESTIONS ANSWERED CORRECTLY</small>

              <div className="chapter-quiz__score-line">
                <span
                  style={{
                    width: `${(finalScore / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <p>
              {finalScore === 5
                ? "Excellent. You have understood the wisdom and qualities that made Hanuman extraordinary."
                : finalScore >= 3
                ? "Well done. You have discovered much about Hanuman's intelligence, humility and wisdom."
                : "Every encounter offers a lesson. Revisit the chapter and discover more about Hanuman's remarkable character."}
            </p>

            <div className="chapter-quiz__completion-actions">
              <button
                className="chapter-quiz__restart"
                onClick={handleRestart}
              >
                TRY AGAIN
              </button>

              {onComplete && (
                <button
                  className="chapter-quiz__finish"
                  onClick={onComplete}
                >
                  CONTINUE <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <header className="chapter-quiz__header">
            <div className="chapter-quiz__identity">
              <i />
              <span>ANCESTRA · RAMAYANA</span>
            </div>

            <div className="chapter-quiz__header-main">
              <span className="chapter-quiz__eyebrow">
                CHAPTER IX · KNOWLEDGE OF THE EPIC
              </span>

              <h1>
                The Meeting
                <span>with Hanuman</span>
              </h1>

              <p>
                Discover the wisdom behind the first meeting.
              </p>
            </div>

            <div className="chapter-quiz__counter">
              <span>QUESTION</span>
              <strong>
                {String(currentQuestion + 1).padStart(2, "0")}
                <em> / 05</em>
              </strong>
            </div>
          </header>

          <div className="chapter-quiz__progress">
            <div className="chapter-quiz__progress-track">
              <div
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            <div className="chapter-quiz__progress-labels">
              <span>THE NINTH CHRONICLE</span>
              <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% COMPLETE</span>
            </div>
          </div>

          <main className="chapter-quiz__main">
            <div className="chapter-quiz__question">
              <div className="chapter-quiz__question-meta">
                <i />
                QUESTION {String(currentQuestion + 1).padStart(2, "0")}
                <i />
              </div>

              <span className="chapter-quiz__question-number">
                0{currentQuestion + 1}
              </span>

              <h2>{question.question}</h2>

              <div className="chapter-quiz__ornament">
                <span />
                <Sparkles size={15} />
                <span />
              </div>
            </div>

            <div className="chapter-quiz__options">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const hasAnswered = selectedAnswer !== null;

                let optionClass = "chapter-quiz__option";

                if (isSelected) optionClass += " is-selected";

                if (hasAnswered && index === question.answer) {
                  optionClass += " is-correct";
                } else if (hasAnswered && isSelected) {
                  optionClass += " is-wrong";
                }

                return (
                  <button
                    type="button"
                    key={index}
                    className={optionClass}
                    disabled={hasAnswered}
                    onClick={() => setSelectedAnswer(index)}
                  >
                    <span className="chapter-quiz__option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="chapter-quiz__option-text">
                      {option}
                    </span>

                    <span className="chapter-quiz__option-state">
                      {hasAnswered && index === question.answer && (
                        <Check size={18} />
                      )}
                      {hasAnswered && isSelected && !isCorrect && (
                        <X size={18} />
                      )}
                    </span>

                    {isSelected && (
                      <span className="chapter-quiz__option-glow" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && (
              <div
                className={`chapter-quiz__explanation ${
                  isCorrect ? "is-correct" : "is-wrong"
                }`}
              >
                <div className="chapter-quiz__explanation-icon">
                  {isCorrect ? <Check size={18} /> : <Sparkles size={18} />}
                </div>

                <div>
                  <span>
                    {isCorrect ? "WELL UNDERSTOOD" : "A LESSON TO REMEMBER"}
                  </span>
                  <p>{question.explanation}</p>
                </div>
              </div>
            )}
          </main>

          <footer className="chapter-quiz__footer">
            <button
              type="button"
              className="chapter-quiz__back"
              onClick={onExit}
            >
              <ArrowLeft size={15} />
              EXIT QUIZ
            </button>

            <div className="chapter-quiz__footer-center">
              <i />
              <span>ANCESTRA</span>
              <i />
            </div>

            <button
              type="button"
              className="chapter-quiz__next"
              onClick={handleNext}
              disabled={selectedAnswer === null}
            >
              {currentQuestion === questions.length - 1
                ? "VIEW RESULTS"
                : "NEXT QUESTION"}
              <ArrowRight size={15} />
            </button>
          </footer>
        </>
      )}
    </div>
  );
}
