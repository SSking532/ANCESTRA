import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  Heart,
  Moon,
  Sparkles,
  ScrollText,
  Shield,
} from "lucide-react";

import "./FathersDilemmaGame.css";

/* =========================================================
   ANCESTRA — THE FATHER'S DILEMMA
   CHAPTER II — THE MAKING OF THE PRINCES

   DILEMMA:
   DASHARATHA MUST DECIDE WHETHER TO SEND RAMA
   WITH VISHVAMITRA OR PROTECT HIS YOUNG SON.
========================================================= */

const CHAMBER_IMAGE = "/images/locations/fathers-dilemma-chamber.jpg";

const BACK_OF = {
  chamber: "opening",
  voices: "chamber",
  choice: "voices",
  reflection: "choice",
  truth: "reflection",
};

const STEPS = [
  { id: "chamber", label: "THE CHAMBER" },
  { id: "voices", label: "THE CONFLICT" },
  { id: "choice", label: "THE CHOICE" },
  { id: "reflection", label: "THE CONSEQUENCE" },
  { id: "truth", label: "THE PATH" },
];

/* =========================================================
   MEMORY CARDS
========================================================= */

const MEMORY_CARDS = [
  {
    id: "rama",
    number: "I",
    label: "THE SON",
    title: "Rama",
    text:
      "Rama is still young. Though disciplined, composed, and already distinguished among the princes, he remains the beloved son Dasharatha has watched grow within the safety of Ayodhya's palace.",
    icon: Heart,
  },
  {
    id: "vishvamitra",
    number: "II",
    label: "THE SAGE",
    title: "Vishvamitra's Request",
    text:
      "The great sage Vishvamitra comes before Dasharatha with a serious request: Rama is to accompany him and assist in protecting his sacred rites. Dasharatha must decide whether to trust the path being placed before his son.",
    icon: ScrollText,
  },
  {
    id: "father",
    number: "III",
    label: "THE FATHER",
    title: "Dasharatha's Fear",
    text:
      "Dasharatha's first response comes from a father's fear. He knows Rama is still young and cannot easily accept the thought of sending him away from the palace and into an uncertain world.",
    icon: Crown,
  },
];

/* =========================================================
   CHOICE CONSEQUENCES
========================================================= */

const CONSEQUENCES = {
  protect: {
    eyebrow: "THE PATH OF PROTECTION",
    title: "Dasharatha Keeps Rama",
    lead:
      "The king chooses the instinct of a father before the request of the sage.",
    paragraphs: [
      "Dasharatha refuses to send Rama away. In the immediate moment, Rama remains within the protection of Ayodhya, surrounded by his family, teachers, and the familiar walls of the royal household.",
      "For a father, the choice feels natural. Rama is still young, and Vishvamitra's request asks Dasharatha to place his son in circumstances whose full consequences he cannot yet see. By keeping Rama close, Dasharatha removes the immediate fear of losing control over his son's safety.",
      "But the decision carries a deeper cost. Vishvamitra did not approach the king casually. His request places Rama at the threshold of a larger purpose, and refusing it means keeping the prince inside the sheltered world of Ayodhya when his life is beginning to demand something beyond it.",
      "The kingdom also has a duty toward a revered sage whose sacred work requires protection. A king cannot treat every difficult responsibility as something that can simply be avoided because it frightens him personally.",
    ],
    outcome:
      "This path protects Rama in the immediate moment, but it also delays the first great step beyond the palace that will shape his destiny.",
    meters: [
      { label: "THE FATHER'S PEACE", value: 5 },
      { label: "RAMA'S JOURNEY", value: 1 },
    ],
  },

  honor: {
    eyebrow: "THE PATH OF DUTY",
    title: "Dasharatha Lets Rama Go",
    lead:
      "The king overcomes his fear and allows Vishvamitra to take Rama beyond the safety of Ayodhya.",
    paragraphs: [
      "Dasharatha's first instinct is to protect his son. He does not immediately welcome the request. The thought of Rama leaving the palace is difficult precisely because Dasharatha knows how precious the prince is to him.",
      "Yet the request comes from Vishvamitra, a sage of immense spiritual authority, and the matter is not presented as an ordinary journey. Rama is being called toward responsibility beyond the sheltered life of the royal household.",
      "With the counsel of his spiritual guide Vasishtha and the understanding that Rama's path cannot remain confined to the palace forever, Dasharatha finally gives his consent.",
      "Rama leaves with Vishvamitra. This becomes one of the first great turning points in his life: the prince begins to encounter the wider world, receives teachings from Vishvamitra, and steps into experiences that could never have come to him had Dasharatha continued to keep him within Ayodhya.",
      "The consequence is therefore not simply that Rama leaves home for a while. This is the moment when the protected prince begins becoming the Rama the larger story requires.",
    ],
    outcome:
      "This is the path followed by the Ramayana: Dasharatha's fear gives way to trust, and Rama's journey beyond Ayodhya begins.",
    meters: [
      { label: "THE FATHER'S PEACE", value: 2 },
      { label: "RAMA'S JOURNEY", value: 5 },
    ],
  },
};

/* =========================================================
   AMBIENT DATA (deterministic, so renders stay stable)
========================================================= */

const STARS = Array.from({ length: 48 }, (_, i) => ({
  left: (i * 53 + 7) % 100,
  top: (i * 29 + 3) % 58,
  size: 1 + (i % 3) * 0.7,
  delay: (i % 9) * 0.7,
  duration: 3 + (i % 5),
}));

const EMBERS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 41 + 13) % 100,
  delay: (i % 8) * 1.6,
  duration: 11 + (i % 5) * 2.4,
  size: 2 + (i % 3),
}));

/* =========================================================
   COMPONENT
========================================================= */

export default function FathersDilemmaGame({ onComplete }) {
  const [stage, setStage] = useState("opening");
  const [activeMemory, setActiveMemory] = useState("rama");
  const [seenMemories, setSeenMemories] = useState(["rama"]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [hoverPath, setHoverPath] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const mainRef = useRef(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [stage]);

  const goTo = (next) => setStage(next);

  const openMemory = (id) => {
    setActiveMemory(id);
    setSeenMemories((current) =>
      current.includes(id) ? current : [...current, id]
    );
  };

  const consequence = CONSEQUENCES[selectedPath] || CONSEQUENCES.honor;
  const focusPath = hoverPath || selectedPath;
  const tilt = focusPath === "protect" ? -9 : focusPath === "honor" ? 9 : 0;
  const stepIndex = STEPS.findIndex((step) => step.id === stage);
  const activeMemoryCard =
    MEMORY_CARDS.find((card) => card.id === activeMemory) || MEMORY_CARDS[0];

  /* ---- bottom bar configuration ---- */

  const footer = {
    chamber: {
      hint: `${seenMemories.length} OF 3 REMEMBERED`,
      label: "CONTINUE",
      onClick: () => goTo("voices"),
    },
    voices: {
      hint: "THE FATHER OR THE SAGE",
      label: "FACE THE CHOICE",
      onClick: () => goTo("choice"),
    },
    choice: {
      hint: selectedPath
        ? "YOUR PATH IS CHOSEN"
        : "SELECT ONE PATH TO DISCOVER ITS CONSEQUENCES",
      label: "REVEAL THE CONSEQUENCE",
      onClick: () => goTo("reflection"),
      disabled: !selectedPath,
    },
    reflection: {
      hint: "EVERY PATH HAS ITS COST",
      label: "UNDERSTAND THE CANONICAL PATH",
      onClick: () => goTo("truth"),
    },
    truth: {
      hint: "THE JOURNEY CONTINUES",
      label: "RETURN TO THE CHRONICLE",
      onClick: () => onComplete?.(),
      icon: Check,
    },
  }[stage];

  const FooterIcon = footer?.icon || ArrowRight;

  /* ---- stage content ---- */

  const renderStage = () => {
    /* OPENING */
    if (stage === "opening") {
      return (
        <section className="dilemma-stage dilemma-opening">
          <div className="dilemma-eyebrow reveal" style={{ "--d": 0 }}>
            <span />
            INTERACTIVE CHRONICLE
            <span />
          </div>

          <div className="dilemma-opening__symbol reveal" style={{ "--d": 1 }}>
            <Crown size={28} strokeWidth={1.1} />
          </div>

          <p className="dilemma-kicker reveal" style={{ "--d": 2 }}>
            CHAPTER II · THE MAKING OF THE PRINCES
          </p>

          <h1 className="reveal" style={{ "--d": 3 }}>
            THE FATHER'S
            <br />
            <em>DILEMMA</em>
          </h1>

          <div className="dilemma-opening__line reveal" style={{ "--d": 4 }} />

          <p className="dilemma-opening__description reveal" style={{ "--d": 5 }}>
            A sage has come with a request.
            <br />
            A father does not want to let his son go.
            <br />
            But Rama's life is beginning to reach beyond Ayodhya.
          </p>

          <button
            type="button"
            className="dilemma-button dilemma-button--primary reveal"
            style={{ "--d": 6 }}
            onClick={() => goTo("chamber")}
          >
            <span>ENTER THE CHAMBER</span>
            <ArrowRight size={16} strokeWidth={1.4} />
          </button>

          <div className="dilemma-opening__bottom reveal" style={{ "--d": 8 }}>
            <span>AYODHYA</span>
            <span>ANCESTRA</span>
            <span>FATHER · DUTY · DESTINY</span>
          </div>
        </section>
      );
    }

    /* CHAMBER */
    if (stage === "chamber") {
      const ActiveIcon = activeMemoryCard.icon;

      return (
        <section className="dilemma-stage dilemma-chamber">
          <div className="chamber-layout">
            <div className="chamber-scene dilemma-frame reveal" style={{ "--d": 0 }}>
              {!imageFailed ? (
                <img
                  className={`chamber-scene__image ${imageLoaded ? "is-loaded" : ""}`}
                  src={CHAMBER_IMAGE}
                  alt="Moonlit royal chamber in ancient Ayodhya"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="chamber-scene__fallback">
                  <Moon size={44} strokeWidth={1} />
                  <span>THE ROYAL CHAMBER</span>
                  <small>MOONLIT AYODHYA</small>
                </div>
              )}

              <div className="chamber-scene__shade" />

              <div className="chamber-scene__caption">
                <div>
                  <span>AYODHYA</span>
                  <small>THE KING'S PRIVATE CHAMBER</small>
                </div>
                <div>
                  <span>THE NIGHT</span>
                  <small>BEFORE RAMA'S FIRST JOURNEY</small>
                </div>
              </div>
            </div>

            <div className="chamber-copy">
              <span className="dilemma-section-label reveal" style={{ "--d": 1 }}>
                THE ROYAL CHAMBER
              </span>

              <h2 className="reveal" style={{ "--d": 2 }}>
                Before the <em>decision</em>
              </h2>

              <p className="chamber-copy__intro reveal" style={{ "--d": 3 }}>
                Before making the decision, understand the three forces meeting
                within Dasharatha's heart.
              </p>

              <div className="memory-tabs reveal" style={{ "--d": 4 }} role="tablist">
                {MEMORY_CARDS.map((card) => {
                  const Icon = card.icon;
                  const isActive = activeMemory === card.id;
                  const isSeen = seenMemories.includes(card.id);

                  return (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      key={card.id}
                      className={`memory-tab ${isActive ? "is-active" : ""} ${isSeen ? "is-seen" : ""}`}
                      onClick={() => openMemory(card.id)}
                    >
                      <span className="memory-tab__number">{card.number}</span>
                      <span className="memory-tab__icon">
                        <Icon size={17} strokeWidth={1.2} />
                      </span>
                      <span className="memory-tab__copy">
                        <small>{card.label}</small>
                        <strong>{card.title}</strong>
                      </span>
                      <span className="memory-tab__check">
                        {isSeen && !isActive ? <Check size={14} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className="memory-detail dilemma-frame"
                key={activeMemoryCard.id}
                role="tabpanel"
              >
                <div className="memory-detail__top">
                  <ActiveIcon size={18} strokeWidth={1.2} />
                  <span>{activeMemoryCard.label}</span>
                </div>
                <p>{activeMemoryCard.text}</p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    /* TWO VOICES */
    if (stage === "voices") {
      return (
        <section className="dilemma-stage dilemma-voices">
          <header className="dilemma-heading">
            <div className="dilemma-eyebrow reveal" style={{ "--d": 0 }}>
              <span />
              THE CONFLICT
              <span />
            </div>

            <h2 className="reveal" style={{ "--d": 1 }}>
              A father's fear.
              <br />
              A sage's <em>request.</em>
            </h2>

            <p className="reveal" style={{ "--d": 2 }}>
              Dasharatha must decide whether Rama should remain within the
              safety of Ayodhya or step beyond it.
            </p>
          </header>

          <div className="voice-columns">
            <article
              className="voice-card dilemma-frame reveal"
              style={{ "--d": 3 }}
            >
              <div className="voice-card__glow" />
              <Heart className="voice-card__watermark" strokeWidth={0.6} />

              <div className="voice-card__icon">
                <Heart size={21} strokeWidth={1.2} />
              </div>

              <span className="voice-card__label">THE FATHER</span>
              <h3>Protect His Son</h3>
              <div className="voice-card__line" />

              <p>
                Rama is still young. Dasharatha has spent years watching his son
                grow under the protection of Ayodhya. Sending him away with
                Vishvamitra means accepting that he can no longer keep every
                danger outside his child's life.
              </p>

              <small>LOVE · FEAR · PROTECTION</small>
            </article>

            <div className="voice-divider reveal" style={{ "--d": 4 }}>
              <div />
              <span>OR</span>
              <div />
            </div>

            <article
              className="voice-card voice-card--sage dilemma-frame reveal"
              style={{ "--d": 5 }}
            >
              <div className="voice-card__glow" />
              <ScrollText className="voice-card__watermark" strokeWidth={0.6} />

              <div className="voice-card__icon">
                <ScrollText size={21} strokeWidth={1.2} />
              </div>

              <span className="voice-card__label">THE SAGE</span>
              <h3>Honor the Request</h3>
              <div className="voice-card__line" />

              <p>
                Vishvamitra has not come merely to ask for a royal favor. His
                request places Rama before a new stage of responsibility, where
                the prince must begin learning what lies beyond the sheltered
                world of the palace.
              </p>

              <small>DUTY · TRUST · GROWTH</small>
            </article>
          </div>
        </section>
      );
    }

    /* CHOICE */
    if (stage === "choice") {
      return (
        <section className="dilemma-stage dilemma-choice">
          <header className="dilemma-heading">
            <span className="dilemma-section-label reveal" style={{ "--d": 0 }}>
              THE MOMENT
            </span>

            <h2 className="reveal" style={{ "--d": 1 }}>
              What should
              <br />
              Dasharatha <em>do?</em>
            </h2>

            <p className="reveal" style={{ "--d": 2 }}>
              You stand where the king once stood.
              <br />
              Rama is still young. Vishvamitra is waiting.
            </p>
          </header>

          <div
            className="fd-scale reveal"
            style={{ "--d": 3, "--tilt": `${tilt}deg` }}
            aria-hidden="true"
          >
            <div className="fd-scale__post" />
            <div className="fd-scale__base" />
            <div className="fd-scale__jewel" />

            <div className="fd-scale__beam">
              <div
                className={`fd-scale__pan fd-scale__pan--left ${focusPath === "protect" ? "is-heavy" : ""}`}
              >
                <i className="fd-scale__strings" />
                <span className="fd-scale__dish">
                  <Heart size={15} strokeWidth={1.4} />
                </span>
              </div>

              <div
                className={`fd-scale__pan fd-scale__pan--right ${focusPath === "honor" ? "is-heavy" : ""}`}
              >
                <i className="fd-scale__strings" />
                <span className="fd-scale__dish">
                  <ScrollText size={15} strokeWidth={1.4} />
                </span>
              </div>
            </div>
          </div>

          <div className="choice-grid" role="group" aria-label="Choose a path">
            <ChoiceCard
              delay={4}
              number="I"
              icon={Heart}
              title="Protect Rama"
              subtitle="KEEP HIM IN AYODHYA"
              text="Refuse Vishvamitra's request and keep Rama within the safety of the royal household."
              selected={selectedPath === "protect"}
              onSelect={() => setSelectedPath("protect")}
              onFocusPath={() => setHoverPath("protect")}
              onBlurPath={() => setHoverPath(null)}
            />

            <ChoiceCard
              delay={5}
              number="II"
              icon={ScrollText}
              title="Honor the Sage"
              subtitle="LET RAMA GO WITH VISHVAMITRA"
              text="Overcome the fear of a father and allow Rama to step beyond Ayodhya under Vishvamitra's guidance."
              selected={selectedPath === "honor"}
              onSelect={() => setSelectedPath("honor")}
              onFocusPath={() => setHoverPath("honor")}
              onBlurPath={() => setHoverPath(null)}
            />
          </div>
        </section>
      );
    }

    /* CONSEQUENCE */
    if (stage === "reflection") {
      return (
        <section className="dilemma-stage dilemma-reflection">
          <aside className="reflection-panel dilemma-frame reveal" style={{ "--d": 0 }}>
            <div className="reflection-symbol">
              {selectedPath === "protect" ? (
                <Shield size={26} strokeWidth={1.1} />
              ) : (
                <ScrollText size={26} strokeWidth={1.1} />
              )}
            </div>

            <span className="dilemma-section-label">{consequence.eyebrow}</span>

            <h2>{consequence.title}</h2>

            <div className="reflection-line" />

            <p className="reflection-main">{consequence.lead}</p>

            <div className="reflection-meters">
              <span className="reflection-meters__title">WHAT THIS PATH CHANGES</span>

              {consequence.meters.map((meter) => (
                <div className="reflection-meter" key={meter.label}>
                  <small>{meter.label}</small>
                  <div className="reflection-meter__pips">
                    {[0, 1, 2, 3, 4].map((pip) => (
                      <i
                        key={pip}
                        className={pip < meter.value ? "is-active" : ""}
                        style={{ "--p": pip }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="reflection-outcome">{consequence.outcome}</p>
          </aside>

          <div className="consequence-copy">
            {consequence.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="reveal"
                style={{ "--d": index + 2 }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      );
    }

    /* TRUTH */
    return (
      <section className="dilemma-stage dilemma-truth">
        <div className="truth-moon reveal" style={{ "--d": 0 }}>
          <Moon size={25} strokeWidth={1.1} />
        </div>

        <span className="dilemma-section-label reveal" style={{ "--d": 1 }}>
          THE PATH OF THE RAMAYANA
        </span>

        <h2 className="reveal" style={{ "--d": 2 }}>
          Rama
          <br />
          <em>goes.</em>
        </h2>

        <div className="truth-journey reveal" style={{ "--d": 3 }} aria-hidden="true">
          <span>AYODHYA</span>
          <div className="truth-journey__track">
            <i />
          </div>
          <span>THE WIDER WORLD</span>
        </div>

        <p className="truth-lead reveal" style={{ "--d": 4 }}>
          Dasharatha's fear does not disappear. He simply learns that protecting
          Rama cannot mean keeping him forever within the walls of Ayodhya.
        </p>

        <p className="truth-final reveal" style={{ "--d": 5 }}>
          Vishvamitra's request becomes the doorway through which Rama enters a
          larger world.
        </p>

        <div className="truth-divider reveal" style={{ "--d": 6 }}>
          <span />
          <b>✦</b>
          <span />
        </div>

        <p className="truth-caption reveal" style={{ "--d": 7 }}>
          The prince leaves with Vishvamitra. What begins as a father's difficult
          decision becomes one of the first major steps in Rama's journey.
        </p>
      </section>
    );
  };

  return (
    <div
      className="fathers-dilemma"
      data-stage={stage}
      data-path={selectedPath || "none"}
    >
      <DilemmaAtmosphere />

      <header className="dilemma-topbar">
        <div className="dilemma-brand">
          <Sparkles size={15} strokeWidth={1.3} />
          <span>ANCESTRA</span>
          <i />
          <small>CHAPTER II · THE MAKING OF THE PRINCES</small>
        </div>

        {stepIndex >= 0 && (
          <div className="dilemma-steps" aria-label="Progress">
            <span className="dilemma-steps__label">
              {String(stepIndex + 1).padStart(2, "0")} / 05 · {STEPS[stepIndex].label}
            </span>
            <div className="dilemma-steps__pips">
              {STEPS.map((step, index) => (
                <i
                  key={step.id}
                  className={
                    index < stepIndex ? "is-done" : index === stepIndex ? "is-active" : ""
                  }
                />
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="dilemma-main" ref={mainRef} key={stage}>
        {renderStage()}
      </main>

      {footer && (
        <footer className="dilemma-footer">
          <button
            type="button"
            className="dilemma-button dilemma-button--ghost"
            onClick={() => goTo(BACK_OF[stage])}
          >
            <ArrowLeft size={15} strokeWidth={1.4} />
            <span>{stage === "reflection" ? "RECONSIDER" : "BACK"}</span>
          </button>

          <span className="dilemma-footer__hint">{footer.hint}</span>

          <button
            type="button"
            className={`dilemma-button dilemma-button--primary ${footer.disabled ? "" : "is-ready"}`}
            onClick={footer.onClick}
            disabled={footer.disabled}
          >
            <span>{footer.label}</span>
            <FooterIcon size={16} strokeWidth={1.4} />
          </button>
        </footer>
      )}
    </div>
  );
}

/* =========================================================
   CHOICE CARD
========================================================= */

function ChoiceCard({
  number,
  icon: Icon,
  title,
  subtitle,
  text,
  selected,
  delay,
  onSelect,
  onFocusPath,
  onBlurPath,
}) {
  return (
    <button
      type="button"
      className={`dilemma-choice-card dilemma-frame reveal ${selected ? "is-selected" : ""}`}
      style={{ "--d": delay }}
      aria-pressed={selected}
      onClick={onSelect}
      onMouseEnter={onFocusPath}
      onMouseLeave={onBlurPath}
      onFocus={onFocusPath}
      onBlur={onBlurPath}
    >
      <div className="choice-card__top">
        <span>{number}</span>
        <i className="choice-card__icon">
          <Icon size={19} strokeWidth={1.2} />
        </i>
      </div>

      <div className="choice-card__body">
        <small>{subtitle}</small>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      <div className="choice-card__bottom">
        <span>{selected ? "SELECTED" : "EXPLORE"}</span>
        {selected ? (
          <Check size={15} strokeWidth={1.4} />
        ) : (
          <ArrowRight size={15} strokeWidth={1.4} />
        )}
      </div>
    </button>
  );
}

/* =========================================================
   ATMOSPHERE — sky, moon, skyline, mist, embers, grain
========================================================= */

function DilemmaAtmosphere() {
  return (
    <div className="dilemma-atmosphere" aria-hidden="true">
      <div className="dilemma-atmosphere__sky" />
      <div className="dilemma-atmosphere__dawn" />

      <div className="dilemma-atmosphere__stars">
        {STARS.map((star, i) => (
          <i
            key={i}
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="dilemma-atmosphere__rays" />

      <div className="dilemma-atmosphere__moon">
        <span />
      </div>

      <svg
        className="dilemma-skyline dilemma-skyline--far"
        viewBox="0 0 1600 300"
        preserveAspectRatio="xMidYMax slice"
      >
        <g>
          <rect x="0" y="210" width="1600" height="90" />
          <rect x="40" y="170" width="70" height="50" />
          <path d="M40 170 Q75 120 110 170Z" />
          <rect x="230" y="150" width="46" height="80" />
          <path d="M226 150 L253 108 L280 150Z" />
          <rect x="420" y="185" width="120" height="40" />
          <path d="M440 185 Q480 135 520 185Z" />
          <rect x="1060" y="180" width="120" height="45" />
          <path d="M1080 180 Q1120 130 1160 180Z" />
          <rect x="1320" y="150" width="46" height="80" />
          <path d="M1316 150 L1343 108 L1370 150Z" />
          <rect x="1490" y="170" width="70" height="50" />
          <path d="M1490 170 Q1525 120 1560 170Z" />
        </g>
      </svg>

      <svg
        className="dilemma-skyline dilemma-skyline--near"
        viewBox="0 0 1600 300"
        preserveAspectRatio="xMidYMax slice"
      >
        <g>
          <rect x="0" y="262" width="1600" height="38" />

          <rect x="300" y="215" width="260" height="85" />
          <rect x="1040" y="215" width="260" height="85" />
          <rect x="360" y="190" width="56" height="30" />
          <path d="M356 190 Q388 150 420 190Z" />
          <rect x="1180" y="190" width="56" height="30" />
          <path d="M1176 190 Q1208 150 1240 190Z" />
          <rect x="470" y="196" width="50" height="24" />
          <path d="M466 196 Q495 164 524 196Z" />
          <rect x="1076" y="196" width="50" height="24" />
          <path d="M1072 196 Q1101 164 1130 196Z" />

          <rect x="560" y="118" width="62" height="182" />
          <path d="M550 118 L591 66 L632 118Z" />
          <rect x="978" y="118" width="62" height="182" />
          <path d="M968 118 L1009 66 L1050 118Z" />
          <rect x="587" y="46" width="8" height="22" />
          <rect x="1005" y="46" width="8" height="22" />

          <rect x="640" y="168" width="320" height="132" />
          <path d="M680 168 Q800 30 920 168Z" />
          <rect x="796" y="22" width="8" height="40" />
          <path d="M804 24 L832 32 L804 40Z" />
          <path d="M770 168 Q800 120 830 168Z" />

          <rect x="150" y="226" width="90" height="74" />
          <path d="M150 226 Q195 176 240 226Z" />
          <rect x="1360" y="226" width="90" height="74" />
          <path d="M1360 226 Q1405 176 1450 226Z" />
        </g>

        <g className="dilemma-windows">
          <rect x="780" y="206" width="14" height="30" rx="7" />
          <rect x="806" y="206" width="14" height="30" rx="7" />
          <rect x="700" y="214" width="12" height="26" rx="6" />
          <rect x="888" y="214" width="12" height="26" rx="6" />
          <rect x="581" y="150" width="10" height="24" rx="5" />
          <rect x="1004" y="150" width="10" height="24" rx="5" />
          <rect x="341" y="244" width="12" height="22" rx="6" />
          <rect x="446" y="244" width="12" height="22" rx="6" />
          <rect x="1142" y="244" width="12" height="22" rx="6" />
          <rect x="1246" y="244" width="12" height="22" rx="6" />
          <rect x="190" y="254" width="10" height="20" rx="5" />
          <rect x="1400" y="254" width="10" height="20" rx="5" />
        </g>
      </svg>

      <div className="dilemma-atmosphere__mist dilemma-atmosphere__mist--one" />
      <div className="dilemma-atmosphere__mist dilemma-atmosphere__mist--two" />

      <div className="dilemma-atmosphere__embers">
        {EMBERS.map((ember, i) => (
          <i
            key={i}
            style={{
              left: `${ember.left}%`,
              width: ember.size,
              height: ember.size,
              animationDelay: `${ember.delay}s`,
              animationDuration: `${ember.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="dilemma-atmosphere__vignette" />
      <div className="dilemma-atmosphere__grain" />
    </div>
  );
}