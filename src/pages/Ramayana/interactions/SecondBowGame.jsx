import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowRight,
  Play,
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./SecondBowGame.css";

/* =========================================================
   ANCESTRA — RAMAYANA
   CHAPTER IV — GAME IV
   THE SECOND BOW
========================================================= */

const IMAGE_BASE =
  "/images/ramayana/interactions/second-bow";

const THUNDER_AUDIO = "/audio/thunder.mp3";

/* =========================================================
   FINAL IMAGE STRUCTURE
========================================================= */

const IMAGES = {
  1: `${IMAGE_BASE}/01-road-silent.jpg`,
  2: `${IMAGE_BASE}/02-parashurama-approaches.jpg`,
  3: `${IMAGE_BASE}/03-axe-attack.jpg`,
  4: `${IMAGE_BASE}/04-rama-resists.jpg`,
  5: `${IMAGE_BASE}/05-rama-controls.jpg`,
  6: `${IMAGE_BASE}/06-rama-holds-axe.jpg`,
  7: `${IMAGE_BASE}/07-parashurama-eyes.jpg`,

  8: `${IMAGE_BASE}/08-rama-dialogue.jpg`,
  9: `${IMAGE_BASE}/09-parashurama-dialogue.jpg`,

  10: `${IMAGE_BASE}/10-bow-presented.jpg`,
  11: `${IMAGE_BASE}/11-rama-accepts-bow.jpg`,
  12: `${IMAGE_BASE}/12-rama-holds-bow.jpg`,
  13: `${IMAGE_BASE}/13-recognition-blessing.jpg`,
  14: `${IMAGE_BASE}/14-parashurama-departs.jpg`,
};

/* =========================================================
   FIGHT — IMAGES 01–07
========================================================= */

const FIGHT_FRAMES = [
  {
    id: 1,
    image: IMAGES[1],
    label: "THE ROAD FALLS SILENT",
    text:
      "The peaceful journey is interrupted by an immense presence.",
  },

  {
    id: 2,
    image: IMAGES[2],
    label: "THE WARRIOR SAGE",
    text:
      "Parashurama approaches with the presence of an ancient warrior ascetic.",
  },

  {
    id: 3,
    image: IMAGES[3],
    label: "THE AXE",
    text:
      "The silence breaks.",
  },

  {
    id: 4,
    image: IMAGES[4],
    label: "THE FORCE",
    text:
      "The great weapon crosses the open plain toward Rama.",
  },

  {
    id: 5,
    image: IMAGES[5],
    label: "THE RESISTANCE",
    text:
      "Rama catches the attack, but the force drives him backward.",
  },

  {
    id: 6,
    image: IMAGES[6],
    label: "THE CONTROL",
    text:
      "The movement stops. Rama brings the weapon completely under control.",
  },

  {
    id: 7,
    image: IMAGES[7],
    label: "THE WARRIOR'S EYES",
    text:
      "For the first time, Parashurama sees something he did not expect.",
  },
];

/* =========================================================
   CINEMATIC DIALOGUE
========================================================= */

const DIALOGUE = [
  {
    id: 1,
    speaker: "RAMA",
    image: IMAGES[8],
    text:
      "Revered Bhargava, I honour your austerity and your lineage. I have no desire to challenge you through pride.",
  },

  {
    id: 2,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "You speak of respect, yet you have just stopped the force of my weapon with a single hand.",
  },

  {
    id: 3,
    speaker: "RAMA",
    image: IMAGES[8],
    text:
      "The weapon came toward me, revered one. I merely stopped what would have harmed those who stood behind me.",
  },

  {
    id: 4,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "Merely stopped it? I have seen kings, warriors and mighty men struggle beneath lesser force.",
  },

  {
    id: 5,
    speaker: "RAMA",
    image: IMAGES[8],
    text:
      "Strength is not mine to display for pride. If it is required, it should serve dharma. If it is not required, there is no reason to display it.",
  },

  {
    id: 6,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "Your words are those of a prince. Your silence before my anger was not.",
  },

  {
    id: 7,
    speaker: "RAMA",
    image: IMAGES[8],
    text:
      "Anger does not become lighter because another person answers it with anger. I would rather understand the reason for your challenge.",
  },

  {
    id: 8,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "Understand? You stand before me after arresting my weapon, and still you speak as though nothing extraordinary has occurred.",
  },

  {
    id: 9,
    speaker: "RAMA",
    image: IMAGES[8],
    text:
      "Perhaps what appears extraordinary to one person is simply the responsibility placed before another.",
  },

  {
    id: 10,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "Responsibility. Discipline. Restraint. And yet there is something else in you.",
  },

  {
    id: 11,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "When Shiva's bow was broken in Mithila, I believed I had come to confront a remarkable prince. Now I begin to wonder whether I have come before someone whose nature is far older than this birth.",
  },

  {
    id: 12,
    speaker: "RAMA",
    image: IMAGES[8],
    text:
      "Revered Bhargava, I am only Rama. Whatever strength is within me, I accept as something entrusted to me, not something that belongs to pride.",
  },

  {
    id: 13,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "Only Rama? No ordinary prince carries such stillness. No ordinary hand arrests the force of my parashu without hatred.",
  },

  {
    id: 14,
    speaker: "RAMA",
    image: IMAGES[8],
    text:
      "Then perhaps the truth is not in what I claim to be. Perhaps it is in what the moment itself reveals.",
  },

  {
    id: 15,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "Then let there be one final test. Not of your pride. Not of your anger. Of who you truly are.",
  },

  {
    id: 16,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "There is a bow known as Sharanga, the legendary bow of Lord Vishnu. It is not merely a weapon. It answers only to a nature capable of bearing what it represents.",
  },

  {
    id: 17,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "I did not bring it here for another warrior. I brought it because I must know the truth of the one standing before me.",
  },

  {
    id: 18,
    speaker: "RAMA",
    image: IMAGES[8],
    text:
      "If it is sacred, revered Bhargava, I will receive it with the same respect with which I received your challenge.",
  },

  {
    id: 19,
    speaker: "PARASHURAMA",
    image: IMAGES[9],
    text:
      "Then take Sharanga, Rama. Let the bow itself reveal what my eyes have not yet dared to accept.",
  },
];

/* =========================================================
   CONCLUSION
========================================================= */

const CONCLUSION = {
  bowPresented: {
    id: 10,
    image: IMAGES[10],
    label: "SHARANGA",
    title: "The Bow of Vishnu",
    text:
      "Parashurama presents Sharanga, the legendary bow associated with Lord Vishnu.",
  },

  ramaAccepts: {
    id: 11,
    image: IMAGES[11],
    label: "RAMA",
    title: "He Accepts",
    text:
      "Rama receives Sharanga without pride, fear, or hesitation.",
  },

  ramaHolds: {
    id: 12,
    image: IMAGES[12],
    label: "THE REVELATION",
    title: "The Bow Knows Its Master",
    text:
      "Rama holds the legendary bow with the same quiet composure that has marked every moment of the encounter.",
  },

  recognition: {
    id: 13,
    image: IMAGES[13],
    label: "RECOGNITION",
    title: "Parashurama Understands",
    text:
      "What he could only suspect is now clear. Parashurama recognizes Rama's divine identity and blesses him.",
  },

  departure: {
    id: 14,
    image: IMAGES[14],
    label: "THE ROAD OPENS AGAIN",
    title: "Parashurama Departs",
    text:
      "Having recognized Rama, Parashurama blesses him and withdraws from the path.",
  },
};

/* =========================================================
   STAGES
========================================================= */

const STAGES = {
  INTRO: "intro",
  FIGHT: "fight",
  DIALOGUE: "dialogue",

  BOW_PRESENTED: "bow-presented",
  RAMA_ACCEPTS: "rama-accepts",
  RAMA_HOLDS: "rama-holds",
  RECOGNITION: "recognition",
  DEPARTURE: "departure",

  COMPLETE: "complete",
};

/* =========================================================
   IMAGE PRELOAD
========================================================= */

const preloadImages = () => {
  Object.values(IMAGES).forEach((src) => {
    const image = new Image();
    image.src = src;
  });
};

/* =========================================================
   COMPONENT
========================================================= */

export default function SecondBowGame({
  onComplete,
}) {
  const [stage, setStage] = useState(
    STAGES.INTRO
  );

  const [fightIndex, setFightIndex] =
    useState(0);

  const [dialogueIndex, setDialogueIndex] =
    useState(0);

  const [cameraDirection, setCameraDirection] =
    useState(1);

  const [
    visibleWordCount,
    setVisibleWordCount,
  ] = useState(0);

  const [isTyping, setIsTyping] =
    useState(false);

  /*
    ========================================================
    PERSISTENT THUNDER AUDIO
    ========================================================

    The audio element is rendered ONCE at the bottom of
    the component, outside every stage branch.

    Therefore:

    INTRO
      ↓
    FIGHT 01
      ↓
    FIGHT 02
      ↓
    ...
      ↓
    FIGHT 07
      ↓
    DIALOGUE

    The <audio> element itself never gets destroyed.
  */

  const thunderAudioRef =
    useRef(null);

  const thunderStartedRef =
    useRef(false);

  /* =======================================================
     PRELOAD IMAGES
  ======================================================= */

  useEffect(() => {
    preloadImages();
  }, []);

  /* =======================================================
     AUDIO SETUP + AUTO START
  ======================================================= */

  useEffect(() => {
    const audio =
      thunderAudioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = 0.28;
    audio.loop = true;
    audio.preload = "auto";

    /*
      Ask the browser to load the local MP3.
    */
    audio.load();

    /*
      Start automatically when the game component opens.
    */
    const tryStartThunder = async () => {
      if (!audio) {
        return;
      }

      if (!audio.paused) {
        thunderStartedRef.current = true;
        return;
      }

      try {
        audio.volume = 0.28;
        audio.loop = true;

        await audio.play();

        thunderStartedRef.current = true;
      } catch (error) {
        /*
          Some browsers can still block autoplay.

          The fallback listeners below will retry
          on the next real user interaction.
        */
        console.warn(
          "Thunder autoplay was blocked:",
          error
        );
      }
    };

    /*
      Try immediately when the game opens.
    */
    tryStartThunder();

    /*
      Fallback for browsers that block autoplay.

      The moment the user interacts with the game,
      thunder will start.
    */
    const unlockThunder = () => {
      if (
        thunderStartedRef.current ||
        !audio.paused
      ) {
        return;
      }

      tryStartThunder();
    };

    window.addEventListener(
      "pointerdown",
      unlockThunder,
      { once: true }
    );

    window.addEventListener(
      "keydown",
      unlockThunder,
      { once: true }
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        unlockThunder
      );

      window.removeEventListener(
        "keydown",
        unlockThunder
      );

      audio.pause();
      audio.currentTime = 0;

      thunderStartedRef.current =
        false;
    };
  }, []);

  /* =======================================================
     AUDIO START
  ======================================================= */

  const startThunder = async () => {
    const audio =
      thunderAudioRef.current;

    if (!audio) {
      return;
    }

    /*
      Do not restart the sound if it is
      already playing.
    */
    if (!audio.paused) {
      thunderStartedRef.current =
        true;

      return;
    }

    try {
      audio.volume = 0.28;
      audio.loop = true;

      audio.currentTime = 0;

      await audio.play();

      thunderStartedRef.current =
        true;
    } catch (error) {
      console.warn(
        "Thunder audio could not start:",
        error
      );
    }
  };

  /* =======================================================
     AUDIO STOP
  ======================================================= */

  const stopThunder = () => {
    const audio =
      thunderAudioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;

    thunderStartedRef.current =
      false;
  };

  /* =======================================================
     BEGIN GAME
  ======================================================= */

  const beginGame = () => {
    /*
      If autoplay was blocked when the game opened,
      this click starts the audio.

      If audio is already playing, this does nothing.
    */
    startThunder();

    setFightIndex(0);
    setCameraDirection(1);
    setStage(STAGES.FIGHT);
  };

  /* =======================================================
     FIGHT
  ======================================================= */

  const advanceFight = () => {
    if (
      fightIndex <
      FIGHT_FRAMES.length - 1
    ) {
      setCameraDirection(1);

      setFightIndex(
        (previous) =>
          previous + 1
      );

      return;
    }

    /*
      =====================================================
      IMAGE 07 → DIALOGUE
      =====================================================

      This is the exact moment the thunder ends.

      01
      02
      03
      04
      05
      06
      07
      ↓
      STOP THUNDER
      ↓
      DIALOGUE IMAGE 08
    */

    stopThunder();

    setDialogueIndex(0);
    setCameraDirection(-1);
    setStage(STAGES.DIALOGUE);
  };

  /* =======================================================
     CURRENT DIALOGUE
  ======================================================= */

  const currentDialogue =
    useMemo(
      () =>
        DIALOGUE[
          dialogueIndex
        ],
      [dialogueIndex]
    );

  /* =======================================================
     DIALOGUE WORD ANIMATION
  ======================================================= */

  useEffect(() => {
    if (
      stage !== STAGES.DIALOGUE
    ) {
      return;
    }

    const words =
      currentDialogue.text.split(
        " "
      );

    let currentCount = 0;

    setVisibleWordCount(0);
    setIsTyping(true);

    const interval = setInterval(
      () => {
        currentCount += 1;

        setVisibleWordCount(
          currentCount
        );

        if (
          currentCount >=
          words.length
        ) {
          clearInterval(interval);
          setIsTyping(false);
        }
      },
      52
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    stage,
    dialogueIndex,
    currentDialogue.text,
  ]);

  /* =======================================================
     DIALOGUE ADVANCE
  ======================================================= */

  const advanceDialogue = () => {
    /*
      If the sentence is still being typed,
      reveal it completely first.
    */
    if (isTyping) {
      const words =
        currentDialogue.text.split(
          " "
        );

      setVisibleWordCount(
        words.length
      );

      setIsTyping(false);

      return;
    }

    /*
      More dialogue remains.
    */
    if (
      dialogueIndex <
      DIALOGUE.length - 1
    ) {
      const next =
        DIALOGUE[
          dialogueIndex + 1
        ];

      setCameraDirection(
        next.speaker === "RAMA"
          ? -1
          : 1
      );

      setDialogueIndex(
        (previous) =>
          previous + 1
      );

      return;
    }

    /*
      Dialogue ends.

      Thunder has already stopped.

      Now reveal Sharanga.
    */
    setCameraDirection(1);

    setStage(
      STAGES.BOW_PRESENTED
    );
  };

  /* =======================================================
     CONCLUSION ADVANCE
  ======================================================= */

  const advanceConclusion = () => {
    if (
      stage ===
      STAGES.BOW_PRESENTED
    ) {
      setStage(
        STAGES.RAMA_ACCEPTS
      );
      return;
    }

    if (
      stage ===
      STAGES.RAMA_ACCEPTS
    ) {
      setStage(
        STAGES.RAMA_HOLDS
      );
      return;
    }

    if (
      stage ===
      STAGES.RAMA_HOLDS
    ) {
      setStage(
        STAGES.RECOGNITION
      );
      return;
    }

    if (
      stage ===
      STAGES.RECOGNITION
    ) {
      setStage(
        STAGES.DEPARTURE
      );
      return;
    }

    if (
      stage ===
      STAGES.DEPARTURE
    ) {
      setStage(
        STAGES.COMPLETE
      );
    }
  };

  /* =======================================================
     CAMERA ANIMATION
  ======================================================= */

  const cameraVariants = {
    initial: {
      opacity: 0,

      x:
        cameraDirection > 0
          ? 100
          : -100,

      scale: 1.075,
    },

    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },

    exit: {
      opacity: 0,

      x:
        cameraDirection > 0
          ? -85
          : 85,

      scale: 1.025,
    },
  };

  /* =======================================================
     CONCLUSION RENDERER
  ======================================================= */

  const renderConclusion =
    (data) => (
      <section className="second-bow__stage">

        <AnimatePresence mode="wait">

          <motion.div
            key={data.id}
            className="second-bow__shot"
            variants={
              cameraVariants
            }
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.82,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
          >

            <img
              src={data.image}
              alt={data.title}
            />

            <div className="second-bow__vignette" />

            <div className="second-bow__grain" />

            <div className="second-bow__conclusion-copy">

              <span>
                {data.label}
              </span>

              <h2>
                {data.title}
              </h2>

              <p>
                {data.text}
              </p>

            </div>

          </motion.div>

        </AnimatePresence>

        <button
          type="button"
          className="second-bow__next"
          onClick={
            advanceConclusion
          }
        >
          <span>
            {stage ===
            STAGES.DEPARTURE
              ? "COMPLETE"
              : "CONTINUE"}
          </span>

          <ArrowRight
            size={16}
            strokeWidth={1.2}
          />
        </button>

      </section>
    );

  /* =======================================================
     STAGE CONTENT
  ======================================================= */

  let stageContent = null;

  /* =======================================================
     INTRO
  ======================================================= */

  if (
    stage === STAGES.INTRO
  ) {
    stageContent = (
      <section className="second-bow__intro">

        <div className="second-bow__ornament">
          <i />
          <span>✦</span>
          <i />
        </div>

        <span className="second-bow__eyebrow">
          CHAPTER IV · THE FINAL ENCOUNTER
        </span>

        <h1>
          The Second Bow
        </h1>

        <p className="second-bow__lead">
          The road falls silent.
          <br />
          A warrior sage stands before Rama.
        </p>

        <p className="second-bow__sub">
          Witness the confrontation.
          <br />
          Hear the questions.
          <br />
          Discover what Parashurama ultimately recognizes.
        </p>

        <button
          type="button"
          className="second-bow__primary"
          onClick={beginGame}
        >
          <Play
            size={15}
            strokeWidth={1.2}
          />

          <span>
            BEGIN THE ENCOUNTER
          </span>

          <ArrowRight
            size={16}
            strokeWidth={1.2}
          />
        </button>

        <div className="second-bow__identity">
          <span>RAMA</span>
          <i />
          <span>PARASHURAMA</span>
        </div>

      </section>
    );
  }

  /* =======================================================
     FIGHT — 01 TO 07
  ======================================================= */

  if (
    stage === STAGES.FIGHT
  ) {
    const frame =
      FIGHT_FRAMES[
        fightIndex
      ];

    stageContent = (
      <section className="second-bow__stage">

        <AnimatePresence mode="wait">

          <motion.div
            key={frame.id}
            className="second-bow__shot"
            variants={
              cameraVariants
            }
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.78,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
          >

            <img
              src={frame.image}
              alt={frame.label}
            />

            <div className="second-bow__vignette" />

            <div className="second-bow__grain" />

          </motion.div>

        </AnimatePresence>

        <div className="second-bow__frame-caption">

          <span>
            {frame.label}
          </span>

          <p>
            {frame.text}
          </p>

        </div>

        <div className="second-bow__progress">

          <span>
            {String(
              frame.id
            ).padStart(2, "0")}
          </span>

          <i />

          <span>
            07
          </span>

        </div>

        <button
          type="button"
          className="second-bow__next"
          onClick={
            advanceFight
          }
        >
          <span>
            {frame.id === 7
              ? "LISTEN"
              : "CONTINUE"}
          </span>

          <ArrowRight
            size={16}
            strokeWidth={1.2}
          />
        </button>

      </section>
    );
  }

  /* =======================================================
     DIALOGUE — 08 ↔ 09
  ======================================================= */

  if (
    stage === STAGES.DIALOGUE
  ) {
    const isRama =
      currentDialogue.speaker ===
      "RAMA";

    const dialogueWords =
      currentDialogue.text.split(
        " "
      );

    stageContent = (
      <section className="second-bow__dialogue-stage">

        <AnimatePresence mode="wait">

          <motion.div
            key={dialogueIndex}
            className={
              "second-bow__dialogue-shot " +
              (
                isRama
                  ? "second-bow__dialogue-shot--rama"
                  : "second-bow__dialogue-shot--parashurama"
              )
            }
            variants={
              cameraVariants
            }
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.72,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
          >

            <img
              src={
                currentDialogue.image
              }
              alt={`${currentDialogue.speaker} dialogue`}
            />

            <div className="second-bow__vignette" />

            <div className="second-bow__dialogue-box">

              <div className="second-bow__speaker">

                <span />

                {currentDialogue.speaker}

                <span />

              </div>

              <p
                aria-live="polite"
              >
                {dialogueWords.map(
                  (
                    word,
                    wordIndex
                  ) => (
                    <motion.span
                      key={`${dialogueIndex}-${wordIndex}`}
                      className="second-bow__dialogue-word"
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity:
                          wordIndex <
                          visibleWordCount
                            ? 1
                            : 0,
                        y:
                          wordIndex <
                          visibleWordCount
                            ? 0
                            : 5,
                      }}
                      transition={{
                        duration: 0.16,
                      }}
                    >
                      {word}

                      {wordIndex <
                        dialogueWords.length -
                          1
                        ? " "
                        : ""}
                    </motion.span>
                  )
                )}
              </p>

            </div>

          </motion.div>

        </AnimatePresence>

        <div className="second-bow__dialogue-count">

          <span>
            {String(
              dialogueIndex + 1
            ).padStart(2, "0")}
          </span>

          <i />

          <span>
            {String(
              DIALOGUE.length
            ).padStart(2, "0")}
          </span>

        </div>

        <button
          type="button"
          className="second-bow__dialogue-next"
          onClick={
            advanceDialogue
          }
        >
          <span>
            {isTyping
              ? "REVEAL"
              : dialogueIndex ===
                  DIALOGUE.length - 1
                ? "THE BOW"
                : "CONTINUE"}
          </span>

          <ArrowRight
            size={16}
            strokeWidth={1.2}
          />

        </button>

      </section>
    );
  }

  /* =======================================================
     CONCLUSION STAGES
  ======================================================= */

  if (
    stage ===
    STAGES.BOW_PRESENTED
  ) {
    stageContent =
      renderConclusion(
        CONCLUSION.bowPresented
      );
  }

  if (
    stage ===
    STAGES.RAMA_ACCEPTS
  ) {
    stageContent =
      renderConclusion(
        CONCLUSION.ramaAccepts
      );
  }

  if (
    stage ===
    STAGES.RAMA_HOLDS
  ) {
    stageContent =
      renderConclusion(
        CONCLUSION.ramaHolds
      );
  }

  if (
    stage ===
    STAGES.RECOGNITION
  ) {
    stageContent =
      renderConclusion(
        CONCLUSION.recognition
      );
  }

  if (
    stage ===
    STAGES.DEPARTURE
  ) {
    stageContent =
      renderConclusion(
        CONCLUSION.departure
      );
  }

  /* =======================================================
     COMPLETE
  ======================================================= */

  if (
    stage ===
    STAGES.COMPLETE
  ) {
    stageContent = (
      <section className="second-bow__complete">

        <div className="second-bow__ornament">
          <i />
          <span>✦</span>
          <i />
        </div>

        <span className="second-bow__eyebrow">
          THE SECOND BOW
        </span>

        <h1>
          Recognition
        </h1>

        <p>
          Parashurama came as a warrior sage.
          He departed after recognizing the
          divinity before him.
        </p>

        <div className="second-bow__complete-line">

          <span>
            RECOGNITION
          </span>

          <i />

          <span>
            BLESSING
          </span>

          <i />

          <span>
            DEPARTURE
          </span>

        </div>

        <button
          type="button"
          className="second-bow__primary"
          onClick={onComplete}
        >
          <span>
            CONTINUE THE JOURNEY
          </span>

          <ArrowRight
            size={16}
            strokeWidth={1.2}
          />
        </button>

      </section>
    );
  }

  /* =======================================================
     ROOT CLASS
  ======================================================= */

  const rootClassName =
    stage === STAGES.INTRO
      ? "second-bow"
      : stage === STAGES.DIALOGUE
        ? "second-bow second-bow--dialogue"
        : stage === STAGES.COMPLETE
          ? "second-bow second-bow--complete"
          : "second-bow second-bow--cinema";

  /* =======================================================
     SINGLE PERSISTENT GAME ROOT
  ======================================================= */

  return (
    <main className={rootClassName}>

      {/* =================================================
          PERSISTENT THUNDER AUDIO

          THIS ELEMENT NEVER UNMOUNTS UNTIL THE GAME
          ITSELF IS CLOSED.
      ================================================= */}

      <audio
        ref={thunderAudioRef}
        src={THUNDER_AUDIO}
        preload="auto"
        autoPlay
        loop
        playsInline
        aria-hidden="true"
      />

      {stageContent}

    </main>
  );
}