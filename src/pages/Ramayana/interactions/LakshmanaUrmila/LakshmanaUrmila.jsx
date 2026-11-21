
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import "./LakshmanaUrmila.css";

const IMAGE_PATH = "/images/ramayana/interactions/lakshmana-urmila/";

const scenes = [
  {
    image: "opening.jpg",
    location: "THE ROYAL PALACE · NIGHT",
    character: "LAKSHMANA",
    text: "Urmila… it is time to bid you farewell. I am leaving with Rama.",
  },
  {
    image: "urmila.jpg",
    location: "A MOMENT OF SILENCE",
    character: "URMILA",
    text: "And what about me, Lakshmana?",
  },
  {
    image: "two-shot.jpg",
    location: "THE WORDS LEFT UNSAID",
    character: "LAKSHMANA",
    text: "I would want to stay. More than I can tell you. But wanting to stay and knowing that I must go… are two different things.",
  },
  {
    image: "urmila.jpg",
    location: "URMILA'S QUESTION",
    character: "URMILA",
    text: "Then tell me, Lakshmana. Is there no place for me in the duty you speak of?",
  },
  {
    image: "two-shot.jpg",
    location: "THE DUTY OF A BROTHER",
    character: "LAKSHMANA",
    text: "There is a place for you in every thought I carry. But Rama will leave Ayodhya with very little. He has never asked me to follow him, yet how can I remain here knowing what lies ahead for him?",
  },
  {
    image: "urmila.jpg",
    location: "A QUESTION ABOUT HER SISTER",
    character: "URMILA",
    text: "And what about Sita?",
  },
  {
    image: "lakshmana.jpg",
    location: "WHAT HE KNOWS",
    character: "LAKSHMANA",
    text: "She does not know anything yet. I do not know what she will decide.",
  },
  {
    image: "urmila.jpg",
    location: "A SISTER'S CERTAINTY",
    character: "URMILA",
    text: "You may not know, but I know my sister. She will go with Rama. She will never stay behind while he walks into the forest.",
  },
  {
    image: "two-shot.jpg",
    location: "TWO DIFFERENT JOURNEYS",
    character: "URMILA",
    text: "She has always stood beside him. Do you truly believe she would let him face those years alone?",
  },
  {
    image: "lakshmana.jpg",
    location: "LAKSHMANA'S ANSWER",
    character: "LAKSHMANA",
    text: "I cannot speak for her. But whatever she chooses, I know I must stand beside my brother.",
  },
  {
    image: "urmila.jpg",
    location: "THE QUESTION THAT REMAINS",
    character: "URMILA",
    text: "Then perhaps you understand why I wish to go with you.",
  },
  {
    image: "two-shot.jpg",
    location: "THE CHOICE",
    character: "URMILA",
    text: "If Sita chooses to walk beside Rama, why must I remain here?",
    choices: [
      {
        label: "Because our family needs you here.",
        reply:
          "I believe our mothers will need someone beside them. Bharata is away, the kingdom is uncertain, and someone must care for those who remain.",
      },
      {
        label: "I do not want you to face the forest's hardships.",
        reply:
          "I know your courage. I do not doubt it. But I cannot ask you to leave everything behind when so many depend on you here.",
      },
      {
        label: "I wish there were a way for us to go together.",
        reply:
          "I wish that too. But I cannot turn away from Rama, and I cannot forget those who will remain in Ayodhya.",
      },
    ],
  },
  {
    image: "urmila.jpg",
    location: "WHAT SHE NEEDS HIM TO UNDERSTAND",
    character: "URMILA",
    text: "I do not want to be praised for being strong, Lakshmana. I want to be with my husband.",
  },
  {
    image: "lakshmana.jpg",
    location: "A HUSBAND'S HONESTY",
    character: "LAKSHMANA",
    text: "And I want to stay with you. But there are moments when love asks us to think beyond what we wish for ourselves.",
  },
  {
    image: "two-shot.jpg",
    location: "WHAT THEY CANNOT PROMISE",
    character: "URMILA",
    text: "I had imagined our life together very differently. We have barely begun, and already you speak of leaving.",
  },
  {
    image: "lakshmana.jpg",
    location: "A SHARED WISH",
    character: "LAKSHMANA",
    text: "I had imagined it differently too. I wanted time with you. Time that would not be interrupted by a kingdom's sorrow or a brother's hardship.",
  },
  {
    image: "urmila.jpg",
    location: "THE PROMISE",
    character: "URMILA",
    text: "Then do not mistake my silence for an easy acceptance.",
  },
  {
    image: "lakshmana.jpg",
    location: "THE PROMISE",
    character: "LAKSHMANA",
    text: "I never will.",
  },
  {
    image: "two-shot.jpg",
    location: "TWO RESPONSIBILITIES",
    character: "URMILA",
    text: "Go with Rama, Lakshmana. Stand beside him as you always have.",
  },
  {
    image: "urmila.jpg",
    location: "HER OWN DUTY",
    character: "URMILA",
    text: "I will stand beside our mothers. I will look after the family that remains. And I will carry my share of this responsibility.",
  },
  {
    image: "farewell.jpg",
    location: "THE LAST WORDS",
    character: "LAKSHMANA",
    text: "I will carry your words with me. I could never forget you.",
  },
];

export default function LakshmanaUrmila({ onComplete, onExit }) {
  const [step, setStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [typing, setTyping] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [branchReply, setBranchReply] = useState("");
  const [showEnding, setShowEnding] = useState(false);

  const current = scenes[step];
  const completeText = branchReply || current.text;

  useEffect(() => {
    setTypedText("");
    setTyping(true);

    let index = 0;

    const interval = window.setInterval(() => {
      index += 1;
      setTypedText(completeText.slice(0, index));

      if (index >= completeText.length) {
        window.clearInterval(interval);
        setTyping(false);
      }
    }, 28);

    return () => window.clearInterval(interval);
  }, [step, completeText]);

  const skipTyping = () => {
    if (!typing) return;

    setTypedText(completeText);
    setTyping(false);
  };

  const chooseResponse = (choice) => {
    if (typing || branchReply) return;

    setSelectedChoice(choice);
    setBranchReply(choice.reply);
  };

  const continueStory = () => {
    if (typing) {
      skipTyping();
      return;
    }

    if (current.choices && !selectedChoice && !branchReply) {
      return;
    }

    if (branchReply) {
      setBranchReply("");
      setSelectedChoice(null);
      setStep((previous) => previous + 1);
      return;
    }

    if (step === scenes.length - 1) {
      setShowEnding(true);
      return;
    }

    setStep((previous) => previous + 1);
  };

  const progress = ((step + 1) / scenes.length) * 100;

  return (
    <main className="lu-cinema">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${current.image}-${step}`}
          className="lu-cinema__background"
          style={{
            backgroundImage: `url("${IMAGE_PATH + current.image}")`,
          }}
          initial={{ opacity: 0, scale: 1.045 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1 }}
        />
      </AnimatePresence>

      <div className="lu-cinema__shade" />

      <header className="lu-cinema__header">
        <div className="lu-cinema__brand">
          ANCESTRA
          <span>AYODHYA KANDA</span>
        </div>

        {/* Only exit button for this game */}
        <button
          type="button"
          className="lu-cinema__exit"
          onClick={onExit}
          aria-label="Exit experience"
          title="Exit experience"
        >
          <X size={20} />
        </button>
      </header>

      <section className="lu-cinema__scene">
        <div className="lu-cinema__location">
          <span />
          {current.location}
          <span />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${step}-${branchReply}`}
            className="lu-cinema__dialogue"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.55 }}
          >
            <p className="lu-cinema__speaker">
              {branchReply ? "LAKSHMANA" : current.character}
            </p>

            <h1 onClick={skipTyping}>
              {typedText}
              {typing && <span className="lu-cinema__cursor">|</span>}
            </h1>

            {current.choices && !branchReply && !typing && (
              <div className="lu-cinema__choices">
                <p>HOW WILL YOU ANSWER?</p>

                {current.choices.map((choice, index) => (
                  <button
                    type="button"
                    key={index}
                    className={
                      selectedChoice === choice
                        ? "lu-cinema__choice selected"
                        : "lu-cinema__choice"
                    }
                    onClick={() => chooseResponse(choice)}
                  >
                    <span>0{index + 1}</span>
                    <span className="lu-cinema__choice-label">
                      {choice.label}
                    </span>
                    <ArrowRight size={15} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="lu-cinema__footer">
        <div className="lu-cinema__progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="lu-cinema__footer-row">
          <span>THE PROMISE LEFT UNSPOKEN</span>

          {!showEnding && (
            <button
              type="button"
              onClick={continueStory}
              disabled={
                typing ||
                (current.choices && !selectedChoice && !branchReply)
              }
            >
              {typing
                ? "READING"
                : step === scenes.length - 1
                  ? "COMPLETE"
                  : "CONTINUE"}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </footer>

      <AnimatePresence>
        {showEnding && (
          <motion.div
            className="lu-cinema__ending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span>THE PROMISE LEFT UNSPOKEN</span>

              <h2>
                Two responsibilities.
                <br />
                One bond.
              </h2>

              <p>
                Their paths would separate, but neither mistook
                distance for the absence of love.
              </p>

              <button type="button" onClick={onComplete}>
                RETURN TO THE CHRONICLE
                <ArrowRight size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
