import { motion } from "framer-motion";

import {
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import {
  Link,
  useParams,
  useLocation,
} from "react-router-dom";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./Chapters.css";

import chapter01 from "./data/chapter01.js";

/* =========================================================
   MAHABHARATA — STORY ARCHITECTURE
   ========================================================= */

const storySections = [
  {
    id: "curse-of-the-kuru",
    number: "I",
    chapter: "01",
    eyebrow: "THE DYNASTY",
    title: "THE CURSE OF THE KURU",
    subtitle:
      "A dynasty is created through sacrifice — and cursed by it.",
    text:
      "Before the Pandavas and Kauravas were born, the Kuru dynasty was already being shaped by love, sacrifice, vows and the struggle for succession.",
    image: "/images/backgrounds/chapter-01.jpg",
    location: "HASTINAPURA",
  },

  {
    id: "five-sons-of-destiny",
    number: "II",
    chapter: "02",
    eyebrow: "THE DIVINE BIRTHS",
    title: "THE FIVE SONS OF DESTINY",
    subtitle:
      "Five sons are born from the gods. One secret son is born before them all.",
    text:
      "Pandu's curse drives him into the forest, where Kunti's divine mantra and Madri's invocation of the Ashwini twins lead to the births of the five Pandavas. Before them all, Kunti's secret invocation of Surya brings Karna into the world.",
    image: "/images/backgrounds/chapter-02.jpg",
    location: "HASTINAPURA",
  },

  {
    id: "princes-of-hastinapura",
    number: "III",
    chapter: "03",
    eyebrow: "THE PRINCES",
    title: "THE PRINCES OF HASTINAPURA",
    subtitle:
      "Cousins become rivals. Princes become warriors.",
    text:
      "The Pandavas and Kauravas grow together within the royal house of Hastinapura. Their rivalry deepens as they are trained in warfare, while Drona, Ekalavya and Drupada become part of the conflicts surrounding their education.",
    image: "/images/backgrounds/chapter-03.jpg",
    location: "HASTINAPURA",
  },

  {
    id: "karna-the-unclaimed-son",
    number: "IV",
    chapter: "04",
    eyebrow: "THE OUTSIDER",
    title: "KARNA: THE UNCLAIMED SON",
    subtitle:
      "A warrior searching for recognition finds loyalty in an unexpected place.",
    text:
      "At the great tournament, Karna challenges Arjuna and is denied recognition because of his unknown lineage. Duryodhana raises him to the throne of Anga, beginning a friendship that will shape the course of the epic.",
    image: "/images/backgrounds/chapter-04.jpg",
    location: "HASTINAPURA",
  },

  {
    id: "house-of-lac",
    number: "V",
    chapter: "05",
    eyebrow: "THE PLOT",
    title: "THE HOUSE OF LAC",
    subtitle:
      "The first great attempt to erase the Pandavas.",
    text:
      "Duryodhana's fear of the Pandavas leads to a deadly conspiracy. Warned by Vidura, the Pandavas survive the destruction of the House of Lac and disappear from Hastinapura.",
    image: "/images/backgrounds/chapter-05.jpg",
    location: "VARNAVATA",
  },

  {
    id: "fire-born-queen",
    number: "VI",
    chapter: "06",
    eyebrow: "THE QUEEN",
    title: "THE FIRE-BORN QUEEN",
    subtitle:
      "Born from fire. Queen of destiny.",
    text:
      "Draupadi emerges from the sacrificial fire of Drupada. At her swayamvara, Arjuna succeeds, and a misunderstanding by Kunti transforms the destiny of the five Pandavas and their new alliance with Panchala.",
    image: "/images/backgrounds/chapter-06.jpg",
    location: "PANCHALA",
  },

  {
    id: "indraprastha",
    number: "VII",
    chapter: "07",
    eyebrow: "THE RISE",
    title: "INDRAPRASTHA",
    subtitle:
      "A kingdom rises before the fall.",
    text:
      "The Pandavas transform Khandavaprastha into the magnificent city of Indraprastha. Yudhishthira's Rajasuya establishes his imperial ambition, while Duryodhana's humiliation deepens the desire for revenge.",
    image: "/images/backgrounds/chapter-07.jpg",
    location: "INDRAPRASTHA",
  },

  {
    id: "game-of-dice",
    number: "VIII",
    chapter: "08",
    eyebrow: "THE FALL",
    title: "THE GAME OF DICE",
    subtitle:
      "When everything is placed upon a throw of the dice.",
    text:
      "Shakuni's dice game draws Yudhishthira into a devastating loss. The Pandavas lose their kingdom and freedom, and Draupadi's challenge before the Kuru assembly exposes the moral crisis within Hastinapura.",
    image: "/images/backgrounds/chapter-08.jpg",
    location: "HASTINAPURA",
  },

  {
    id: "thirteen-years",
    number: "IX",
    chapter: "09",
    eyebrow: "THE EXILE",
    title: "THE THIRTEEN YEARS",
    subtitle:
      "Beyond the walls of the kingdom.",
    text:
      "The Pandavas enter exile with Draupadi. The years become a period of hardship, learning and preparation, while encounters with sages, warriors and divine beings reshape their understanding of the coming conflict.",
    image: "/images/backgrounds/chapter-09.jpg",
    location: "THE FORESTS",
  },

  {
    id: "year-in-shadow",
    number: "X",
    chapter: "10",
    eyebrow: "VIRATA",
    title: "THE YEAR IN SHADOW",
    subtitle:
      "Thirteen years end. One final year must remain hidden.",
    text:
      "The Pandavas spend their final year of exile in disguise in the kingdom of Virata. Their identities remain hidden until the Kuru attack forces Arjuna to reveal himself once again.",
    image: "/images/backgrounds/chapter-10.jpg",
    location: "VIRATA",
  },

  {
    id: "last-offer-of-peace",
    number: "XI",
    chapter: "11",
    eyebrow: "THE FINAL NEGOTIATION",
    title: "THE LAST OFFER OF PEACE",
    subtitle:
      "Peace has failed. Kurukshetra awaits.",
    text:
      "The Pandavas seek the return of their kingdom, but Duryodhana refuses. Krishna travels to Hastinapura as the final messenger of peace, while the truth of Karna's birth is finally revealed to him.",
    image: "/images/backgrounds/chapter-11.jpg",
    location: "HASTINAPURA",
  },

  {
    id: "the-gita",
    number: "XII",
    chapter: "12",
    eyebrow: "KURUKSHETRA",
    title: "THE GITA",
    subtitle:
      "Before the war begins, a warrior must understand why he fights.",
    text:
      "The armies assemble at Kurukshetra. Arjuna sees his teachers, relatives and friends among the opposing forces. Krishna answers his crisis through teachings on Dharma, Karma, the Self, devotion and detachment, finally revealing the Vishvarupa.",
    image: "/images/backgrounds/chapter-12.jpg",
    location: "KURUKSHETRA",
  },

  {
    id: "fall-of-bhishma",
    number: "XIII",
    chapter: "13",
    eyebrow: "DAYS 1–10",
    title: "THE FALL OF BHISHMA",
    subtitle:
      "The guardian of the Kuru throne finally falls.",
    text:
      "Bhishma dominates the opening days of the war. On the tenth day, Shikhandi stands before him while Arjuna releases his arrows, and Bhishma falls upon a bed of arrows.",
    image: "/images/backgrounds/fall-of-bhishma.jpg",
    location: "KURUKSHETRA",
  },

  {
    id: "boy-in-the-chakravyuha",
    number: "XIV",
    chapter: "14",
    eyebrow: "THE THIRTEENTH DAY",
    title: "THE BOY IN THE CHAKRAVYUHA",
    subtitle:
      "A young warrior enters a formation he cannot escape.",
    text:
      "Abhimanyu enters the Chakravyuha while Arjuna is kept away from the battlefield. He fights with extraordinary courage but is ultimately overwhelmed. His death changes the emotional course of the war.",
    image:
      "/images/backgrounds/boy-in-the-chakravyuha.jpg",
    location: "KURUKSHETRA",
  },

  {
    id: "night-of-ghatotkacha",
    number: "XV",
    chapter: "15",
    eyebrow: "THE FOURTEENTH NIGHT",
    title: "THE NIGHT OF GHATOTKACHA",
    subtitle:
      "A night warrior changes the fate of Arjuna.",
    text:
      "Ghatotkacha unleashes the terrifying power of Rakshasa warfare during the night battle. Karna is forced to use the divine weapon he had reserved for Arjuna, changing the balance of the coming conflict.",
    image:
      "/images/backgrounds/night-of-ghatotkacha.jpg",
    location: "KURUKSHETRA",
  },

  {
    id: "teachers-fall",
    number: "XVI",
    chapter: "16",
    eyebrow: "THE FIFTEENTH DAY",
    title: "THE TEACHER'S FALL",
    subtitle:
      "When the teacher lays down his weapons.",
    text:
      "Drona's advance becomes increasingly devastating. A terrible deception surrounding the name Ashwatthama causes him to lay down his weapons, after which Dhrishtadyumna kills him.",
    image: "/images/backgrounds/teachers-fall.jpg",
    location: "KURUKSHETRA",
  },

  {
    id: "karna-final-battle",
    number: "XVII",
    chapter: "17",
    eyebrow: "THE SEVENTEENTH DAY",
    title: "KARNA",
    subtitle:
      "The greatest secret of the war approaches its tragic end.",
    text:
      "Karna becomes commander and finally faces Arjuna. When his chariot wheel becomes trapped, Krishna reminds Arjuna of the choices that brought the war to this moment. Karna falls, and the truth of his birth will soon transform the Pandavas' understanding of their victory.",
    image:
      "/images/backgrounds/karna-final-battle.jpg",
    location: "KURUKSHETRA",
  },

  {
    id: "the-last-day",
    number: "XVIII",
    chapter: "18",
    eyebrow: "THE EIGHTEENTH DAY",
    title: "THE LAST DAY",
    subtitle:
      "The armies collapse. The final duel remains.",
    text:
      "The Kaurava army collapses. Shalya falls, Sahadeva confronts Shakuni, and Duryodhana is finally brought to his last duel with Bhima.",
    image: "/images/backgrounds/the-last-day.jpg",
    location: "KURUKSHETRA",
  },

  {
    id: "war-after-the-war",
    number: "XIX",
    chapter: "19",
    eyebrow: "THE AFTERMATH",
    title: "THE WAR AFTER THE WAR",
    subtitle:
      "Victory does not mean that anyone truly won.",
    text:
      "The destruction of the war continues after the battlefield falls silent. Ashwatthama's actions, the death of the young generation and the grief of Gandhari reveal that the consequences of Kurukshetra cannot end with victory.",
    image:
      "/images/backgrounds/war-after-the-war.jpg",
    location: "HASTINAPURA",
  },

  {
    id: "the-last-journey",
    number: "XX",
    chapter: "20",
    eyebrow: "THE FINAL AGE",
    title: "THE LAST JOURNEY",
    subtitle:
      "The age ends. The story continues.",
    text:
      "Yudhishthira rules Hastinapura before the Pandavas eventually renounce the kingdom. Parikshit is established as heir, and the Pandavas and Draupadi begin their final journey toward the Himalayas.",
    image:
      "/images/backgrounds/the-last-journey.jpg",
    location: "HASTINAPURA",
  },
];

/* =========================================================
   OPENING DURATION
   ========================================================= */

const OPENING_DURATION = 7000;

/* =========================================================
   OPENING GRANTH
   KEEP THIS ANIMATION
   ========================================================= */

function OpeningGranth({ onComplete }) {
  const shankhAudioRef = useRef(null);

  useEffect(() => {
    const audio = shankhAudioRef.current;

    if (!audio) {
      return undefined;
    }

    let hasStarted = false;

    const startShankh = async () => {
      if (!audio || hasStarted) return;

      try {
        audio.currentTime = 0;
        audio.volume = 0.72;

        await audio.play();

        hasStarted = true;

        document.removeEventListener(
          "pointerdown",
          startShankh
        );

        document.removeEventListener(
          "keydown",
          startShankh
        );

        document.removeEventListener(
          "touchstart",
          startShankh
        );
      } catch {
        // Browser autoplay protection.
      }
    };

    startShankh();

    document.addEventListener(
      "pointerdown",
      startShankh,
      { passive: true }
    );

    document.addEventListener(
      "keydown",
      startShankh
    );

    document.addEventListener(
      "touchstart",
      startShankh,
      { passive: true }
    );

    const timer = window.setTimeout(() => {
      onComplete();
    }, OPENING_DURATION);

    return () => {
      window.clearTimeout(timer);

      document.removeEventListener(
        "pointerdown",
        startShankh
      );

      document.removeEventListener(
        "keydown",
        startShankh
      );

      document.removeEventListener(
        "touchstart",
        startShankh
      );

      audio.pause();
      audio.currentTime = 0;
    };
  }, [onComplete]);

  return (
    <div
      className="granth-opening"
      aria-hidden="true"
    >
      <audio
        ref={shankhAudioRef}
        src="/audio/shankh.mp3"
        preload="auto"
        playsInline
      />

      <div className="granth-opening__void" />

      <div className="granth-opening__aura" />

      <div
        className="
          granth-opening__aura
          granth-opening__aura--two
        "
      />

      <div className="granth-opening__mandala">

        <div className="mandala-ring mandala-ring--1" />
        <div className="mandala-ring mandala-ring--2" />
        <div className="mandala-ring mandala-ring--3" />
        <div className="mandala-ring mandala-ring--4" />

        <div className="mandala-diamond" />

        <div
          className="
            mandala-diamond
            mandala-diamond--two
          "
        />

        <div className="mandala-center">
          <Sparkles
            size={26}
            strokeWidth={1}
          />
        </div>

      </div>

      <div className="granth-opening__rays">

        {Array.from(
          { length: 12 },
          (_, index) => (
            <span key={index} />
          )
        )}

      </div>

      <div className="granth">

        <div
          className="
            granth__cover
            granth__cover--back
          "
        >
          <div className="granth__back-texture" />
        </div>

        <div className="granth__pages">

          <div
            className="
              granth__page
              granth__page--left
            "
          >
            <div className="granth__page-inner">

              <div
                className="
                  page-ornament
                  page-ornament--top
                "
              >
                ✦
              </div>

              <div className="page-script">
                <span>SHRI</span>
                <span>GANESHAYA</span>
                <span>NAMAH</span>
              </div>

              <div className="page-manuscript-lines">

                {Array.from(
                  { length: 7 },
                  (_, index) => (
                    <span key={index} />
                  )
                )}

              </div>

              <div className="page-border" />

            </div>
          </div>

          <div
            className="
              granth__page
              granth__page--right
            "
          >
            <div className="granth__page-inner">

              <div
                className="
                  page-ornament
                  page-ornament--top
                "
              >
                ✦
              </div>

              <div className="page-script">
                <span>श्री</span>
                <span>गणेशाय</span>
                <span>नमः</span>
              </div>

              <div className="page-manuscript-lines">

                {Array.from(
                  { length: 7 },
                  (_, index) => (
                    <span key={index} />
                  )
                )}

              </div>

              <div className="page-border" />

            </div>
          </div>

        </div>

        <div
          className="
            granth__cover
            granth__cover--front
          "
        >
          <div className="granth__cover-border" />

          <div className="granth__cover-ornament">

            <div className="cover-corner cover-corner--tl" />
            <div className="cover-corner cover-corner--tr" />
            <div className="cover-corner cover-corner--bl" />
            <div className="cover-corner cover-corner--br" />

            <div className="cover-symbol">
              ॐ
            </div>

            <div className="cover-line" />

            <span>ANCESTRA</span>

            <strong>MAHABHARATA</strong>

            <small>
              THE GREAT CHRONICLE
            </small>

          </div>
        </div>

      </div>

      <div className="granth-opening__divine" />

      <div className="granth-opening__final-light" />

      <div className="granth-opening__hint">
        THE CHRONICLE OPENS
      </div>

    </div>
  );
}

/* =========================================================
   CHAPTERS LANDING
   ========================================================= */

function Chapters() {
  const location = useLocation();

  const shouldPlayOpening =
    location.state?.playOpening === true;

  const [opening, setOpening] =
    useState(shouldPlayOpening);

  useEffect(() => {
    if (!shouldPlayOpening) return;

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }, [shouldPlayOpening]);

  return (
    <main className="story-page">

      {opening && (
        <OpeningGranth
          onComplete={() => setOpening(false)}
        />
      )}

      <div
        className="story-atmosphere"
        aria-hidden="true"
      >
        <div className="story-atmosphere__glow" />
        <div className="story-atmosphere__sun" />

        <div
          className="
            story-atmosphere__ring
            story-atmosphere__ring--one
          "
        />

        <div
          className="
            story-atmosphere__ring
            story-atmosphere__ring--two
          "
        />

        <div className="story-atmosphere__grid" />
      </div>

      <nav className="story-nav">

        <Link
          to="/journey/mahabharata"
          className="story-nav__back"
        >
          <ArrowLeft size={16} />
          <span>BACK TO MAHABHARATA</span>
        </Link>

        <div className="story-nav__brand">
          ANCESTRA
        </div>

        <div className="story-nav__label">
          THE STORY
        </div>

      </nav>

      <section className={`story-soon${opening ? " story-soon--hidden" : ""}`}>

        <div className="story-soon__orbit" aria-hidden="true">
          <span className="story-soon__ring story-soon__ring--one" />
          <span className="story-soon__ring story-soon__ring--two" />
          <span className="story-soon__ring story-soon__ring--three" />
          <span className="story-soon__core" />
        </div>

        <div className="story-soon__content">

          <motion.div
            className="story-soon__badge"
            initial={{ opacity: 0, y: 20 }}
            animate={opening ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <Sparkles size={14} strokeWidth={1.4} />
            <span>ANCESTRA · PHASE II</span>
          </motion.div>

          <motion.h1
            className="story-soon__title"
            initial={{ opacity: 0, y: 70, filter: "blur(14px)" }}
            animate={
              opening
                ? { opacity: 0, y: 70, filter: "blur(14px)" }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            LAUNCHING
            <br />
            <span>SOON</span>
          </motion.h1>

          <motion.div
            className="story-soon__divider"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: opening ? 0 : 1 }}
            transition={{ duration: 1.2, delay: 1.2 }}
          >
            <i />
          </motion.div>

          <motion.p
            className="story-soon__with"
            initial={{ opacity: 0, y: 20 }}
            animate={opening ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            WITH <strong>ANCESTRA PHASE-II</strong>
          </motion.p>

          <motion.p
            className="story-soon__note"
            initial={{ opacity: 0 }}
            animate={{ opacity: opening ? 0 : 1 }}
            transition={{ duration: 1.2, delay: 2 }}
          >
            The story of the Mahabharata is being written.
            <br />
            Return when the doors open.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={opening ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.4 }}
          >
            <Link to="/journey/mahabharata/characters" className="story-soon__button">
              <span>MEET THE CHARACTERS</span>
              <ArrowRight size={15} strokeWidth={1.5} />
            </Link>
          </motion.div>

        </div>

        <div className="story-soon__dots" aria-hidden="true">
          <span /><span /><span />
        </div>

      </section>

      <footer className="story-footer">
        <span>ANCESTRA</span>
        <span>MAHABHARATA</span>
        <span>THE PAST CANNOT BE CHANGED</span>
      </footer>

    </main>
  );
}


/* =========================================================
   INDIVIDUAL CHAPTER DETAIL
   ========================================================= */

function ChapterDetail() {

  const { chapterId } = useParams();

  const chapterIndex =
    storySections.findIndex(
      (section) => section.id === chapterId
    );

  const chapterSummary =
    storySections[chapterIndex];

  /* =======================================================
     CHAPTER DATA
     ======================================================= */

  let chapter = chapterSummary;

  if (
    chapterId === chapter01.id &&
    chapterSummary
  ) {
    chapter = {
      ...chapterSummary,
      ...chapter01,
    };
  }

  /* =======================================================
     INVALID CHAPTER
     ======================================================= */

  if (!chapterSummary) {

    return (
      <main className="chapter-detail">

        <div className="chapter-detail__invalid">

          <span className="story-eyebrow">
            CHAPTER NOT FOUND
          </span>

          <h1>
            THE CHRONICLE
          </h1>

          <Link
            to="/journey/mahabharata/chapters"
            className="chapter-detail__back"
          >
            <ArrowLeft size={15} />
            RETURN TO CHAPTERS
          </Link>

        </div>

      </main>
    );
  }

  const previousChapter =
    storySections[chapterIndex - 1];

  const nextChapter =
    storySections[chapterIndex + 1];

  return (
    <main className="chapter-detail">

      {/* ===================================================
          ATMOSPHERE
          =================================================== */}

      <div
        className="chapter-detail__atmosphere"
        aria-hidden="true"
      >

        <div className="chapter-detail__glow" />

        <div
          className="
            chapter-detail__glow
            chapter-detail__glow--two
          "
        />

        <div className="chapter-detail__grid" />

        <div
          className="
            chapter-detail__ring
            chapter-detail__ring--one
          "
        />

        <div
          className="
            chapter-detail__ring
            chapter-detail__ring--two
          "
        />

      </div>

      {/* ===================================================
          NAVIGATION
          =================================================== */}

      <nav className="chapter-detail__nav">

        <Link
          to="/journey/mahabharata/chapters"
          className="chapter-detail__back"
        >
          <ArrowLeft size={15} />

          <span>
            ALL CHAPTERS
          </span>
        </Link>

        <div className="chapter-detail__brand">
          ANCESTRA
        </div>

        <div className="chapter-detail__counter">

          <span>CHAPTER</span>

          {String(
            chapter.chapter
          ).padStart(2, "0")}

          <i>/</i>

          20

        </div>

      </nav>


      {/* ===================================================
          CHAPTER OPENING
          =================================================== */}

      <section className="chapter-detail__opening">

        <motion.div
          className="chapter-detail__opening-label"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
          }}
        >

          <span>
            {chapter.eyebrow}
          </span>

          <div />

          <span>
            {chapter.location}
          </span>

        </motion.div>


        <motion.div
          className="chapter-detail__opening-title"
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
            delay: 0.15,
            ease: [0.16, 1, 0.3, 1],
          }}
        >

          <div className="chapter-detail__roman">
            {chapter.number}
          </div>

          <h1>
            {chapter.title}
          </h1>

          <div className="chapter-detail__title-line" />

          <h2>
            {chapter.subtitle}
          </h2>

        </motion.div>


        {/* =================================================
            HERO IMAGE
            ================================================= */}

        <motion.div
          className="chapter-detail__image-shell"
          initial={{
            opacity: 0,
            y: 55,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 1.25,
            delay: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
        >

          <div className="chapter-detail__image-frame">

            <div
              className="
                chapter-detail__image-corner
                chapter-detail__image-corner--tl
              "
            />

            <div
              className="
                chapter-detail__image-corner
                chapter-detail__image-corner--tr
              "
            />

            <div
              className="
                chapter-detail__image-corner
                chapter-detail__image-corner--bl
              "
            />

            <div
              className="
                chapter-detail__image-corner
                chapter-detail__image-corner--br
              "
            />

            <div className="chapter-detail__image-inner">

              <img
                src={
                  chapter.coverImage ||
                  chapter.image
                }
                alt={chapter.title}
              />

              <div className="chapter-detail__image-dark" />

              <div className="chapter-detail__image-vignette" />

              <div className="chapter-detail__image-caption">

                <div>
                  <span>
                    {chapter.location}
                  </span>

                  <small>
                    THE BEGINNING
                  </small>
                </div>

                <div>
                  <span>
                    {String(
                      chapter.chapter
                    ).padStart(2, "0")}
                  </span>

                  <small>
                    OF 20
                  </small>
                </div>

              </div>

            </div>

          </div>

        </motion.div>


        {/* =================================================
            OPENING DESCRIPTION
            ================================================= */}

        <motion.div
          className="chapter-detail__opening-description"
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.9,
            delay: 0.55,
          }}
        >

          <p>
            {chapter.opening ||
              chapter.text}
          </p>

        </motion.div>


        <div className="chapter-detail__scroll">

          <span>
            ENTER THE CHRONICLE
          </span>

          <ArrowDown size={14} />

        </div>

      </section>


      {/* ===================================================
          DIVIDER
          =================================================== */}

      <div className="chapter-detail__divider">

        <span />

        <div>
          ✦
        </div>

        <span />

      </div>


      {/* ===================================================
          MAIN STORY
          IMPORTANT:
          NO whileInView on the main container.
          This prevents invisible story content.
          =================================================== */}

      <section className="chapter-detail__story">

        <aside className="chapter-detail__story-index">

          <span>
            {String(
              chapter.chapter
            ).padStart(2, "0")}
          </span>

          <div />

          <small>
            THE
            <br />
            CHRONICLE
          </small>

        </aside>


        <div className="chapter-detail__story-content">

          <span className="story-eyebrow">
            {chapter.theme ||
              "THE BEGINNING"}
          </span>

        


          <div className="chapter-detail__story-lead">

            <p>
              {chapter.opening ||
                chapter.text}
            </p>

          </div>


          <div className="chapter-detail__story-rule" />


          {/* =================================================
              SCENE STORY
              ================================================= */}

          <div className="chapter-detail__scenes">

            {Array.isArray(chapter.scenes) &&
              chapter.scenes.length > 0 ? (

              chapter.scenes.map(
                (scene, index) => (

                  <motion.article
                    key={scene.id}
                    className="
                      chapter-detail__scene
                    "
                    initial={{
                      opacity: 0,
                      y: 35,
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                    }}
                    viewport={{
                      once: true,
                      amount: 0.05,
                    }}
                    transition={{
                      duration: 0.7,
                      delay: 0.05,
                    }}
                  >

                    {/* SCENE HEADER */}

                    <div
                      className="
                        chapter-detail__scene-header
                      "
                    >

                      <div
                        className="
                          chapter-detail__scene-number
                        "
                      >
                        <span>
                          {scene.number}
                        </span>
                      </div>


                      <div>

                        <span className="story-eyebrow">
                          {scene.eyebrow}
                        </span>

                        <h3>
                          {scene.title}
                        </h3>

                        <small>
                          {scene.location}
                        </small>

                      </div>

                    </div>


                    {/* =================================================
                        IMAGE IS OPTIONAL

                        We are NOT depending on the image for the story.
                        ================================================= */}

                    {scene.image && (
                      <div
                        className="
                          chapter-detail__scene-image
                        "
                      >

                        <img
                          src={scene.image}
                          alt={scene.title}
                          loading={
                            index === 0
                              ? "eager"
                              : "lazy"
                          }
                        />

                        <div
                          className="
                            chapter-detail__scene-image-overlay
                          "
                        />

                        <div
                          className="
                            chapter-detail__scene-image-label
                          "
                        >
                          {String(
                            scene.number
                          ).padStart(2, "0")}
                        </div>

                      </div>
                    )}


                    {/* =================================================
                        STORY TEXT
                        ================================================= */}

                    <div
                      className="
                        chapter-detail__scene-text
                      "
                    >

                      {Array.isArray(scene.text) &&
                        scene.text.map(
                          (
                            paragraph,
                            paragraphIndex
                          ) => (

                            <p
                              key={`${scene.id}-${paragraphIndex}`}
                            >
                              {paragraph}
                            </p>

                          )
                        )}

                    </div>


                    {/* EMOTIONAL LINE */}

                    {scene.emotion && (

                      <div
                        className="
                          chapter-detail__scene-emotion
                        "
                      >

                        <span>
                          ✦
                        </span>

                        <p>
                          {scene.emotion}
                        </p>

                      </div>

                    )}

                  </motion.article>

                )

              )

            ) : (

              /* =================================================
                 SAFETY FALLBACK
                 ================================================= */

              <div
                className="
                  chapter-detail__story-empty
                "
              >
                <p>
                  The chronicle of this chapter
                  is still being written.
                </p>
              </div>

            )}

          </div>


          {/* =================================================
              CLOSING
              ================================================= */}

          {Array.isArray(chapter.scenes) &&
            chapter.scenes.length > 0 && (

              <div
                className="
                  chapter-detail__story-ending
                "
              >

                <span className="story-eyebrow">
                  THE CHRONICLE
                </span>

                <div
                  className="
                    chapter-detail__story-rule
                  "
                />

                <p>
                  The story has begun.
                  <br />
                  The consequences will travel
                  far beyond this generation.
                </p>

              </div>

            )}

        </div>

      </section>


      {/* ===================================================
          CHAPTER NAVIGATION
          =================================================== */}

      <section
        className="
          chapter-detail__navigation
        "
      >

        {previousChapter ? (

          <Link
            to={`/journey/mahabharata/chapters/${previousChapter.id}`}
            className="
              chapter-detail__next-card
            "
          >

            <span>
              ← PREVIOUS CHAPTER
            </span>

            <strong>
              {previousChapter.title}
            </strong>

          </Link>

        ) : (

          <Link
            to="/journey/mahabharata/chapters"
            className="
              chapter-detail__next-card
            "
          >

            <span>
              ← RETURN
            </span>

            <strong>
              THE CHRONICLE
            </strong>

          </Link>

        )}


        {nextChapter ? (

          <Link
            to={`/journey/mahabharata/chapters/${nextChapter.id}`}
            className="
              chapter-detail__next-card
              chapter-detail__next-card--right
            "
          >

            <span>
              NEXT CHAPTER →
            </span>

            <strong>
              {nextChapter.title}
            </strong>

          </Link>

        ) : (

          <Link
            to="/journey/mahabharata/chapters"
            className="
              chapter-detail__next-card
              chapter-detail__next-card--right
            "
          >

            <span>
              THE CHRONICLE
            </span>

            <strong>
              RETURN TO CHAPTERS
            </strong>

          </Link>

        )}

      </section>


      {/* ===================================================
          FOOTER
          =================================================== */}

      <footer className="chapter-detail__footer">

        <span>
          ANCESTRA
        </span>

        <span>
          MAHABHARATA
        </span>

        <span>
          THE PAST CANNOT BE CHANGED
        </span>

      </footer>

    </main>
  );
}


/* =========================================================
   EXPORTS
   ========================================================= */

export default Chapters;

export {
  ChapterDetail,
  storySections,
};