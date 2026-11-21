
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Sparkles,
  X,
} from "lucide-react";

import "./VibhishanaRefugeGame.css";

/* =========================================================
   IMAGE PATHS
========================================================= */

const IMAGE = {
  arrival: "/images/ramayana/interactions/ch14g11.jpg",
  reaction: "/images/ramayana/interactions/ch14g12.jpg",
  council: "/images/ramayana/interactions/ch14g13.jpg",
  hanuman: "/images/ramayana/interactions/ch14g14.jpg",
  vibhishana: "/images/ramayana/interactions/ch14g15.jpg",
  rama: "/images/ramayana/interactions/ch14g16.jpg",
  acceptance: "/images/ramayana/interactions/ch14g17.jpg",
};

/* =========================================================
   DIALOGUE POSITIONING

   side: left | right
   v: top | bottom

   Each speaker can have a different position in each scene.
========================================================= */

const DEFAULT_LAYOUT = {
  RAMA: { side: "left", v: "bottom" },
  VIBHISHANA: { side: "right", v: "top" },
  SUGRIVA: { side: "left", v: "top" },
  HANUMAN: { side: "right", v: "bottom" },
  LAKSHMANA: { side: "right", v: "top" },
  ANGADA: { side: "left", v: "bottom" },
  JAMBAVAN: { side: "left", v: "top" },
};

/* =========================================================
   STORY SCENES

   One image can support multiple dialogue lines.
   This keeps the seven generated images sufficient.
========================================================= */

const scenes = [
  {
    image: IMAGE.arrival,
    eyebrow: "THE ARRIVAL",
    title: "A Stranger at the Shore",
    tint: "#e9bd7b",

    layout: {
      VIBHISHANA: { side: "right", v: "top" },
      RAMA: { side: "left", v: "bottom" },
    },

    lines: [
      {
        speaker: "VIBHISHANA",
        text: "I am Vibhishana, brother of Ravana, king of Lanka. I have come seeking refuge at your feet, Rama.",
      },
      {
        speaker: "VIBHISHANA",
        text: "I spoke against the path my brother has chosen. I urged him to return Sita and avoid a war that will bring suffering upon Lanka.",
      },
      {
        speaker: "VIBHISHANA",
        text: "But he would not listen. He rejected my counsel and cast me out of his kingdom.",
      },
      {
        speaker: "VIBHISHANA",
        text: "I have left my home and my kingdom behind. I ask only for the protection of one who follows dharma.",
      },
    ],
  },

  {
    image: IMAGE.reaction,
    eyebrow: "SUSPICION IN THE CAMP",
    title: "Can He Be Trusted?",
    tint: "#e8b879",

    layout: {
      SUGRIVA: { side: "left", v: "top" },
      ANGADA: { side: "right", v: "bottom" },
    },

    lines: [
      {
        speaker: "SUGRIVA",
        text: "Rama, we must be careful. This is Ravana's own brother. How can we know that he has not come here with a hidden purpose?",
      },
      {
        speaker: "ANGADA",
        text: "He knows the strength of Lanka and the plans of its king. What if this is a way to learn our weaknesses?",
      },
      {
        speaker: "SUGRIVA",
        text: "He may be pretending to abandon Ravana only to enter our camp and betray us when the time is right.",
      },
    ],
  },

  {
    image: IMAGE.council,
    eyebrow: "THE COUNCIL OF REFUGE",
    title: "The Question Before Rama",
    tint: "#f0c98d",

    layout: {
      LAKSHMANA: { side: "right", v: "top" },
      JAMBAVAN: { side: "left", v: "top" },
      SUGRIVA: { side: "right", v: "bottom" },
      RAMA: { side: "left", v: "bottom" },
    },

    lines: [
      {
        speaker: "LAKSHMANA",
        text: "Brother, the concern is not without reason. We know little of what truly lies in his heart.",
      },
      {
        speaker: "JAMBAVAN",
        text: "We should weigh his words carefully. Yet a person's birth and family alone cannot reveal the truth of their character.",
      },
      {
        speaker: "SUGRIVA",
        text: "I still advise caution, Rama. We should not place the safety of the entire army at risk without thought.",
      },
      {
        speaker: "RAMA",
        text: "You have each spoken what you believe to be right. I have heard your counsel, and I will consider this matter carefully.",
      },
    ],
  },

  {
    image: IMAGE.hanuman,
    eyebrow: "THE WISDOM OF HANUMAN",
    title: "Look at His Actions",
    tint: "#f0c27f",

    layout: {
      HANUMAN: { side: "right", v: "top" },
      RAMA: { side: "left", v: "bottom" },
    },

    lines: [
      {
        speaker: "HANUMAN",
        text: "My Lord, when I look at Vibhishana, I do not see a man who has come to deceive us.",
      },
      {
        speaker: "HANUMAN",
        text: "He could have remained in Lanka and enjoyed the safety of his position. Instead, he chose to speak against wrongdoing, knowing what it might cost him.",
      },
      {
        speaker: "HANUMAN",
        text: "His words and his actions appear to agree. I believe his request deserves to be heard with compassion.",
      },
    ],
  },

  {
    image: IMAGE.vibhishana,
    eyebrow: "THE FINAL TEST",
    title: "A Man Who Chose Dharma",
    tint: "#e9bd82",

    layout: {
      VIBHISHANA: { side: "right", v: "top" },
      RAMA: { side: "left", v: "bottom" },
    },

    lines: [
      {
        speaker: "RAMA",
        text: "Vibhishana, you have left your brother and your kingdom. Tell me: why have you chosen this path?",
      },
      {
        speaker: "VIBHISHANA",
        text: "Because I could not remain beside injustice and call it loyalty. Ravana is my brother, but I cannot support what he has done.",
      },
      {
        speaker: "VIBHISHANA",
        text: "I warned him that Sita must be returned. I asked him to choose peace. But he chose pride over counsel.",
      },
      {
        speaker: "RAMA",
        text: "And if your brother had listened to you, would you still have come here?",
      },
      {
        speaker: "VIBHISHANA",
        text: "No, Rama. I would have remained in Lanka and prayed that peace might return. I have not come seeking another kingdom. I have come because I could no longer stand with adharma.",
      },
    ],
  },

  {
    image: IMAGE.rama,
    eyebrow: "RAMA'S DECISION",
    title: "The Promise of Protection",
    tint: "#f1c98c",

    layout: {
      RAMA: { side: "left", v: "top" },
      VIBHISHANA: { side: "right", v: "bottom" },
    },

    lines: [
      {
        speaker: "RAMA",
        text: "A person who comes seeking refuge must not be turned away out of fear alone.",
      },
      {
        speaker: "RAMA",
        text: "Even if someone approaches me only once and asks for protection, I shall not abandon that person.",
      },
      {
        speaker: "RAMA",
        text: "Let Vibhishana come. I accept him, and I shall protect him.",
      },
      {
        speaker: "VIBHISHANA",
        text: "Rama... you have given shelter to one who has lost everything. I shall remember this kindness for as long as I live.",
      },
    ],
  },

  {
    image: IMAGE.acceptance,
    eyebrow: "A NEW ALLY",
    title: "Under Rama's Protection",
    tint: "#ffe0a1",

    layout: {
      RAMA: { side: "left", v: "top" },
      VIBHISHANA: { side: "right", v: "bottom" },
    },

    lines: [
      {
        speaker: "RAMA",
        text: "Rise, Vibhishana. You are no longer standing outside this camp as a stranger. You are under my protection.",
      },
      {
        speaker: "VIBHISHANA",
        text: "I offer you my knowledge of Lanka and my service in the cause of dharma. I shall stand with you in the days ahead.",
      },
      {
        speaker: "RAMA",
        text: "Then stand with us, not out of fear or reward, but because you have chosen what you believe to be right.",
      },
    ],
  },
];

/* =========================================================
   FLATTEN DIALOGUE

   Every spoken line gets its own index, while the
   background image changes only when the scene changes.
========================================================= */

const flat = scenes.flatMap((scene, si) =>
  scene.lines.map((line, li) => ({
    ...line,
    si,
    li,
  }))
);

const TITLE_IMAGE = scenes[0].image;
const ENDING_IMAGE = scenes[scenes.length - 1].image;

/* =========================================================
   IMAGE PRELOADING
========================================================= */

const preloadImages = () => {
  Object.values(IMAGE).forEach((src) => {
    const image = new Image();
    image.src = src;
  });
};

/* =========================================================
   COMPONENT
========================================================= */

export default function VibhishanaRefugeGame({
  onComplete,
  onExit,
}) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const [titleCard, setTitleCard] = useState(true);

  const timerRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  const line = flat[i];
  const scene = scenes[line.si];
  const typing = shown < line.text.length;

  /* -------------------------------------------------------
     BACKGROUND PARALLAX
  ------------------------------------------------------- */

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, {
    stiffness: 50,
    damping: 18,
  });

  const sy = useSpring(my, {
    stiffness: 50,
    damping: 18,
  });

  const bgX = useTransform(
    sx,
    [-1, 1],
    ["1.4%", "-1.4%"]
  );

  const bgY = useTransform(
    sy,
    [-1, 1],
    ["1%", "-1%"]
  );

  const onPointerMove = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();

      const x =
        ((e.clientX - rect.left) / rect.width) * 2 - 1;

      const y =
        ((e.clientY - rect.top) / rect.height) * 2 - 1;

      pointer.current = { x, y };

      mx.set(x);
      my.set(y);
    },
    [mx, my]
  );

  /* -------------------------------------------------------
     PRELOAD IMAGES
  ------------------------------------------------------- */

  useEffect(() => {
    preloadImages();
  }, []);

  /* -------------------------------------------------------
     TYPEWRITER
  ------------------------------------------------------- */

  useEffect(() => {
    if (!started || finished) return undefined;

    setShown(0);

    let count = 0;

    timerRef.current = window.setInterval(() => {
      count += 1;
      setShown(count);

      if (count >= line.text.length) {
        window.clearInterval(timerRef.current);
      }
    }, 26);

    return () => {
      window.clearInterval(timerRef.current);
    };
  }, [i, started, finished, line.text]);

  /* -------------------------------------------------------
     SCENE TITLE CARD
  ------------------------------------------------------- */

  useEffect(() => {
    if (!started || finished) return undefined;

    setTitleCard(true);

    const timeout = window.setTimeout(() => {
      setTitleCard(false);
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [line.si, started, finished]);

  /* -------------------------------------------------------
     EXIT
  ------------------------------------------------------- */

  const handleExit = useCallback(() => {
    window.clearInterval(timerRef.current);

    if (onExit) {
      onExit();
      return;
    }

    if (onComplete) {
      onComplete();
      return;
    }

    setStarted(false);
    setFinished(false);
    setI(0);
    setShown(0);
  }, [onExit, onComplete]);

  /* -------------------------------------------------------
     ADVANCE DIALOGUE
  ------------------------------------------------------- */

  const advance = useCallback(() => {
    if (!started || finished) return;

    // First tap completes the typewriter.
    if (typing) {
      window.clearInterval(timerRef.current);
      setShown(line.text.length);
      return;
    }

    // Next tap moves to the next line.
    if (i < flat.length - 1) {
      setI((previous) => previous + 1);
    } else {
      setFinished(true);
    }
  }, [started, finished, typing, i, line.text]);

  /* -------------------------------------------------------
     PREVIOUS LINE
  ------------------------------------------------------- */

  const goBack = useCallback(() => {
    if (!started || finished || i === 0) return;

    window.clearInterval(timerRef.current);
    setI((previous) => previous - 1);
  }, [started, finished, i]);

  /* -------------------------------------------------------
     RESTART
  ------------------------------------------------------- */

  const restart = useCallback(() => {
    window.clearInterval(timerRef.current);

    setI(0);
    setShown(0);
    setFinished(false);
    setStarted(true);
  }, []);

  /* -------------------------------------------------------
     KEYBOARD CONTROLS
  ------------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "ArrowRight" ||
        e.key === " " ||
        e.key === "Enter"
      ) {
        e.preventDefault();
        advance();
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        handleExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [advance, goBack, handleExit]);

  /* -------------------------------------------------------
     PROGRESS
  ------------------------------------------------------- */

  const progress = finished
    ? 100
    : ((i + 1) / flat.length) * 100;

  /* -------------------------------------------------------
     DIALOGUE POSITION
  ------------------------------------------------------- */

  const place = {
    ...DEFAULT_LAYOUT[line.speaker],
    ...(scene.layout?.[line.speaker] || {}),
  };

  /* =======================================================
     TITLE SCREEN
  ======================================================= */

  if (!started) {
    return (
      <div
        className="vrg-game"
        onPointerMove={onPointerMove}
      >
        <div className="vrg-title-screen">

          <motion.div
            className="vrg-bg"
            style={{ x: bgX, y: bgY }}
          >
            <motion.img
              src={TITLE_IMAGE}
              alt="Vibhishana arrives at Rama's camp"
              className="vrg-bg-img"
              initial={{ scale: 1.18 }}
              animate={{ scale: 1.06 }}
              transition={{
                duration: 18,
                ease: "linear",
              }}
              draggable="false"
            />
          </motion.div>

          <div className="vrg-vignette" />
          <div className="vrg-rays" />
          <div className="vrg-title-fade" />
          <div className="vrg-grain" />
          <div className="vrg-atmosphere" />

          {(onExit || onComplete) && (
            <button
              type="button"
              className="vrg-icon-button vrg-exit-title"
              onClick={handleExit}
              aria-label="Exit game"
            >
              <X size={16} />
            </button>
          )}

          <div className="vrg-title-content">

            <motion.span
              className="vrg-overline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              <Sparkles size={13} />
              YUDDHA KANDA · CHAPTER XIV
            </motion.span>

            <motion.div
              className="vrg-title-rule"
              initial={{ opacity: 0, scaleX: 0.3 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.7, duration: 1.1 }}
            >
              <span />
              ✦
              <span />
            </motion.div>

            <motion.h1
              initial={{
                opacity: 0,
                y: 24,
                filter: "blur(12px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{
                delay: 0.9,
                duration: 1.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              The Refuge
              <br />
              of Vibhishana
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 1.2 }}
            >
              When a man leaves the side of his own brother
              to stand with what is right, will he be given
              refuge or turned away?
            </motion.p>

            <motion.button
              type="button"
              className="vrg-primary-button"
              onClick={() => setStarted(true)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.9 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>ENTER THE COUNCIL</span>
              <ArrowRight size={17} />
            </motion.button>

            <motion.small
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 1 }}
            >
              A STORY OF REFUGE, LOYALTY AND DHARMA
            </motion.small>

          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     GAME SCREEN
  ======================================================= */

  return (
    <div
      className="vrg-game"
      onPointerMove={onPointerMove}
    >
      <div
        className="vrg-stage"
        onClick={advance}
      >

        {/* FULL-SCREEN BACKGROUND */}

        <AnimatePresence mode="sync">
          {!finished ? (
            <motion.div
              key={`background-${line.si}`}
              className="vrg-bg-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.1,
                ease: "easeInOut",
              }}
            >
              <motion.div
                className="vrg-bg"
                style={{ x: bgX, y: bgY }}
              >
                <motion.img
                  src={scene.image}
                  alt={scene.title}
                  className="vrg-bg-img"
                  initial={{ scale: 1.14 }}
                  animate={{ scale: 1.04 }}
                  transition={{
                    duration: 22,
                    ease: "linear",
                  }}
                  draggable="false"
                />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="background-ending"
              className="vrg-bg-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4 }}
            >
              <motion.div
                className="vrg-bg"
                style={{ x: bgX, y: bgY }}
              >
                <motion.img
                  src={ENDING_IMAGE}
                  alt="Rama accepts Vibhishana"
                  className="vrg-bg-img vrg-bg-img--dim"
                  initial={{ scale: 1.04 }}
                  animate={{ scale: 1.12 }}
                  transition={{
                    duration: 20,
                    ease: "linear",
                  }}
                  draggable="false"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CINEMATIC LAYERS */}

        <div className="vrg-vignette" />
        <div className="vrg-rays" />
        <div className="vrg-grain" />
        <div className="vrg-atmosphere" />
        <div className="vrg-top-fade" />
        <div className="vrg-bottom-fade" />

        {/* HUD */}

        <div
          className="vrg-hud"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="vrg-brand">
            <Sparkles size={13} />
            <span>ANCESTRA</span>
          </div>

          <div className="vrg-hud-right">

            <span className="vrg-scene-count">
              {finished
                ? "COMPLETE"
                : `SCENE ${String(line.si + 1).padStart(2, "0")} / ${String(
                    scenes.length
                  ).padStart(2, "0")}`}
            </span>

            {!finished && (
              <button
                type="button"
                className="vrg-icon-button"
                onClick={goBack}
                disabled={i === 0}
                aria-label="Previous line"
                title="Previous line"
              >
                <ArrowLeft size={15} />
              </button>
            )}

            <button
              type="button"
              className="vrg-icon-button vrg-exit-button"
              onClick={handleExit}
              aria-label="Exit"
              title="Exit"
            >
              <X size={16} />
            </button>

          </div>
        </div>

        {/* PROGRESS */}

        <div className="vrg-progress">
          <motion.div
            className="vrg-progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* SCENE TITLE */}

        <AnimatePresence>
          {!finished && titleCard && (
            <motion.div
              key={`title-${line.si}`}
              className="vrg-titlecard"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span>{scene.eyebrow}</span>
              <h2>{scene.title}</h2>
              <i />
            </motion.div>
          )}
        </AnimatePresence>

        {/* SPOKEN DIALOGUE — NO BOX */}

        {!finished && (
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              className={[
                "vrg-speech",
                `vrg-speech--${place.side}`,
                `vrg-speech--${place.v}`,
              ].join(" ")}
              initial={{
                opacity: 0,
                y: 16,
                filter: "blur(6px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                y: -8,
                filter: "blur(4px)",
              }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="vrg-speaker-row">
                <span
                  className={`vrg-speaker-dot vrg-speaker-dot--${line.speaker.toLowerCase()}`}
                />

                <span
                  className={`vrg-speaker vrg-speaker--${line.speaker.toLowerCase()}`}
                >
                  {line.speaker}
                </span>
              </div>

              <p className="vrg-text">
                {line.text.slice(0, shown)}
                {typing && <span className="vrg-caret" />}
              </p>
            </motion.div>
          </AnimatePresence>
        )}

        {/* TAP HINT */}

        {!finished && (
          <div className="vrg-hint">
            <span>
              {typing ? "TAP TO SKIP" : "TAP TO CONTINUE"}
            </span>
            <ChevronDown size={14} />
          </div>
        )}

        {/* ENDING */}

        <AnimatePresence>
          {finished && (
            <motion.div
              className="vrg-ending-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.8,
                duration: 1.2,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Sparkles size={25} />

              <span>THE REFUGE HAS BEEN GRANTED</span>

              <h2>
                Dharma
                <br />
                Knows No Fear.
              </h2>

              <p>
                Vibhishana has found refuge with Rama.
                The man who chose dharma now stands beside
                the one who will lead the march toward Lanka.
              </p>

              <button
                type="button"
                className="vrg-primary-button"
                onClick={onComplete || restart}
              >
                <span>
                  {onComplete ? "RETURN TO THE STORY" : "WATCH AGAIN"}
                </span>
                <ArrowRight size={17} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
