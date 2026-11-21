
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import "./MantharaCounselGame.css";

const framesPath = "/images/ramayana/interactions/manthara/";

const scenes = [
  {
    image: "frame1.jpg",
    label: "A CITY PREPARES",
    speaker: "NARRATOR",
    dialogue:
      "Ayodhya had never seemed more beautiful. Garlands adorned its doorways, lamps glimmered beneath palace arches, and joyful voices travelled through the streets. Rama, beloved by the people, was to be crowned Yuvaraja.",
  },
  {
    image: "frame2.jpg",
    label: "NEWS REACHES THE PALACE",
    speaker: "NARRATOR",
    dialogue:
      "The news reached every corner of the royal household. For Kaikeyi, the announcement seemed a reason to rejoice. Rama was dear to her, and she had watched him grow with affection.",
  },
  {
    image: "frame3.jpg",
    label: "A DIFFERENT VIEW",
    speaker: "MANTHARA",
    dialogue:
      "My queen, why does the palace celebrate while you sit so peacefully? Have you considered what this coronation may mean for Bharata?",
  },
  {
    image: "frame4.jpg",
    label: "THE QUEEN'S RESPONSE",
    speaker: "KAIKEYI",
    dialogue:
      "What should it mean? Rama is noble, dutiful, and beloved. If he becomes king, Ayodhya will be in good hands. I have no reason to grieve.",
  },
  {
    image: "frame5.jpg",
    label: "THE FIRST DOUBT",
    speaker: "MANTHARA",
    dialogue:
      "You speak of Rama's goodness, and I do not deny it. But tell me, when his sons inherit the throne, what place will remain for Bharata? Have you thought beyond today's celebrations?",
  },
  {
    image: "frame6.jpg",
    label: "A QUESTION TAKES ROOT",
    speaker: "NARRATOR",
    dialogue:
      "Manthara had not offered proof of a coming injustice. She had offered a possibility, framed as a warning. Yet a frightening possibility, repeated with conviction, can begin to feel like a certainty.",
  },
  {
    image: "frame7.jpg",
    label: "THE ARGUMENT DEEPENS",
    speaker: "MANTHARA",
    dialogue:
      "The palace is full of smiles today. But power changes the way people behave. Once Rama sits upon the throne, will anyone remember the promises made to you and your son?",
  },
  {
    image: "frame8.jpg",
    label: "KAIKEYI LISTENS",
    speaker: "KAIKEYI",
    dialogue:
      "Dasharatha has never treated Bharata as an enemy, and Rama has never shown me disrespect. Why should I assume that either of them would wish Bharata harm?",
  },
  {
    image: "frame9.jpg",
    label: "FEAR OR EVIDENCE?",
    speaker: "NARRATOR",
    dialogue:
      "Kaikeyi's words still held the memory of years of affection. Manthara's words demanded that she imagine a future in which that affection could no longer protect her son.",
  },
  {
    image: "frame10.jpg",
    label: "THE WARNING",
    speaker: "MANTHARA",
    dialogue:
      "I ask you to be cautious, my queen. A decision made today may shape Bharata's entire future. If you wait until the coronation is complete, what opportunity will remain to speak?",
  },
  {
    image: "frame11.jpg",
    label: "AN OLD PROMISE",
    speaker: "NARRATOR",
    dialogue:
      "Then Manthara turned to a memory Kaikeyi could not easily dismiss: the two boons Dasharatha had once promised her. A forgotten promise suddenly became the centre of the conversation.",
  },
  {
    image: "frame12.jpg",
    label: "THE TWO BOONS",
    speaker: "MANTHARA",
    dialogue:
      "You have two boons still owed to you by the king. If you choose to claim them, you can ask him to honour his own word. But first, you must decide what you truly want.",
  },
  {
    image: "frame13.jpg",
    label: "THE CHAMBER OF ANGER",
    speaker: "NARRATOR",
    dialogue:
      "Kaikeyi's thoughts no longer moved as freely as they had before. Affection, duty, uncertainty, and fear pressed against one another. The coronation that had begun as a celebration was becoming a crisis.",
  },
  {
    image: "frame14.jpg",
    label: "BEFORE THE CHOICE",
    speaker: "NARRATOR",
    dialogue:
      "The future was not yet decided. Manthara had influenced the way Kaikeyi interpreted the moment, but the choice that followed would belong to the queen herself.",
  },
];

export default function MantharaCounselGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [typing, setTyping] = useState(true);

  const scene = scenes[sceneIndex];

  const progress = Math.round(
    ((sceneIndex + 1) / scenes.length) * 100
  );

  useEffect(() => {
    if (phase !== "story") return;

    setTypedText("");
    setTyping(true);

    let index = 0;

    const interval = window.setInterval(() => {
      index += 1;
      setTypedText(scene.dialogue.slice(0, index));

      if (index >= scene.dialogue.length) {
        window.clearInterval(interval);
        setTyping(false);
      }
    }, 25);

    return () => window.clearInterval(interval);
  }, [phase, sceneIndex, scene.dialogue]);

  const startStory = () => {
    setSceneIndex(0);
    setPhase("story");
  };

  const skipTyping = () => {
    if (!typing) return;

    setTypedText(scene.dialogue);
    setTyping(false);
  };

  const advance = () => {
    if (typing) {
      skipTyping();
      return;
    }

    if (sceneIndex === scenes.length - 1) {
      setPhase("complete");
      return;
    }

    setSceneIndex((previous) => previous + 1);
  };

  const playAgain = () => {
    setSceneIndex(0);
    setPhase("intro");
    setTypedText("");
    setTyping(true);
  };

  return (
    <main className="manthara-game">

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.section
            key="intro"
            className="mc-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="mc-background"
              style={{
                backgroundImage: `url("${framesPath}frame1.jpg")`,
              }}
            />
            <div className="mc-shade" />

            <div className="mc-intro__content">
              <div className="mc-ornament">
                <span />
                <i>✦</i>
                <span />
              </div>

              <p className="mc-kicker">
                ANCESTRA · AYODHYA KANDA
              </p>

              <h1>
                Manthara's
                <br />
                <em>Counsel</em>
              </h1>

              <p className="mc-intro__subtitle">
                When a celebration becomes a question of trust.
              </p>

              <div className="mc-rule">
                <span>✦</span>
              </div>

              <p className="mc-intro__description">
                Enter Queen Kaikeyi's chamber as Manthara
                challenges her understanding of Rama's coronation.
                Witness how a conversation, shaped by uncertainty
                and fear, begins to change the course of Ayodhya.
              </p>

              <div className="mc-intro__meta">
                <span>14 CINEMATIC FRAMES</span>
                <i />
                <span>ONE TURNING POINT</span>
              </div>

              <button
                type="button"
                className="mc-button"
                onClick={startStory}
              >
                <BookOpen size={17} strokeWidth={1.5} />
                <span>ENTER THE QUEEN'S CHAMBER</span>
                <ArrowRight size={17} strokeWidth={1.5} />
              </button>
            </div>
          </motion.section>
        )}

        {phase === "story" && (
          <motion.section
            key={`story-${sceneIndex}`}
            className="mc-story"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div
              className="mc-background"
              style={{
                backgroundImage: `url("${framesPath}${scene.image}")`,
              }}
            />

            <div className="mc-shade" />

            <header className="mc-header">
              <div className="mc-brand">
                ANCESTRA
                <span>AYODHYA KANDA</span>
              </div>

              <div className="mc-frame-counter">
                <span>FRAME</span>
                <strong>
                  {String(sceneIndex + 1).padStart(2, "0")}
                  <i> / </i>
                  {String(scenes.length).padStart(2, "0")}
                </strong>
              </div>
            </header>

            <div className="mc-scene-label">
              <span />
              {scene.label}
              <span />
            </div>

            <div className="mc-dialogue">
              <p className="mc-speaker">{scene.speaker}</p>

              <h2 onClick={skipTyping}>
                {typedText}
                {typing && (
                  <span className="mc-cursor">|</span>
                )}
              </h2>
            </div>

            <footer className="mc-footer">
              <div className="mc-progress">
                <span style={{ width: `${progress}%` }} />
              </div>

              <div className="mc-footer__row">
                <span>THE CROWN THAT NEVER CAME</span>

                <button
                  type="button"
                  onClick={advance}
                >
                  {typing
                    ? "READING"
                    : sceneIndex === scenes.length - 1
                      ? "COMPLETE"
                      : "CONTINUE"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </footer>
          </motion.section>
        )}

        {phase === "complete" && (
          <motion.section
            key="complete"
            className="mc-complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="mc-background"
              style={{
                backgroundImage: `url("${framesPath}frame14.jpg")`,
              }}
            />
            <div className="mc-complete__shade" />

            <div className="mc-complete__content">
              <div className="mc-ornament">
                <span />
                <i>✦</i>
                <span />
              </div>

              <p className="mc-kicker">
                THE CONVERSATION HAS ENDED
              </p>

              <h2>
                Words can shape
                <br />
                <em>what we believe.</em>
              </h2>

              <p className="mc-complete__copy">
                You have witnessed the moment when a joyful
                announcement became a source of uncertainty.
                Manthara's words have changed how Kaikeyi sees
                the future, but the choice that follows is still
                hers to make.
              </p>

              <div className="mc-rule">
                <span>✦</span>
              </div>

              <p className="mc-complete__motto">
                The past cannot be changed.
                <br />
                But the way we understand it can.
              </p>

              <div className="mc-complete__actions">
                <button
                  type="button"
                  className="mc-button mc-button--secondary"
                  onClick={playAgain}
                >
                  <RotateCcw size={16} />
                  <span>PLAY AGAIN</span>
                </button>

                <button
                  type="button"
                  className="mc-button"
                  onClick={onComplete}
                >
                  <span>RETURN TO THE STORY</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

    </main>
  );
}
