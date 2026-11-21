import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./PrepareCoronationGame.css";

const ASSET_ROOT = "/images/ramayana/interactions/coronation";

const ASSET_FILES = {
  city: ["ayodhya-palace.jpg"],
  finishedCity: ["ayodhya-coronation-complete.jpg", "ayodhya-palace.jpg"],
  garland: ["garland.jpg"],
  banner: ["banner.jpg"],
  flowers: ["flowers.jpg"],
  toran: ["leaf-toran.jpg"],
  lamp: ["lamp.jpg"],
  arch: ["arch.jpg"],
  ornament: ["decoration.jpg"],
};

const DECORATIONS = [
  { id: "garland", name: "Flower garland", icon: "✿", image: ASSET_FILES.garland, stock: 2 },
  { id: "banner", name: "Royal banner", icon: "⚑", image: ASSET_FILES.banner, stock: 2 },
  { id: "flowers", name: "Flower cluster", icon: "✾", image: ASSET_FILES.flowers, stock: 1 },
  { id: "toran", name: "Mango-leaf toran", icon: "❧", image: ASSET_FILES.toran, stock: 1 },
  { id: "lamp", name: "Brass oil lamp", icon: "🪔", image: ASSET_FILES.lamp, stock: 1 },
  { id: "arch", name: "Carved arch", icon: "⌂", image: ASSET_FILES.arch, stock: 1 },
  { id: "ornament", name: "Royal ornament", icon: "✧", image: ASSET_FILES.ornament, stock: 1 },
];

const DECORATION_SLOTS = [
  { id: "banner-left", expected: "banner", label: "WEST WING", x: 23, y: 34, width: 8 },
  { id: "banner-right", expected: "banner", label: "EAST WING", x: 77, y: 34, width: 8 },
  { id: "garland-left", expected: "garland", label: "LEFT PILLAR", x: 39, y: 39, width: 10 },
  { id: "garland-right", expected: "garland", label: "RIGHT PILLAR", x: 61, y: 39, width: 10 },
  { id: "toran-main", expected: "toran", label: "MAIN ENTRANCE", x: 50, y: 33, width: 18 },
  { id: "arch-main", expected: "arch", label: "ROYAL ARCH", x: 50, y: 53, width: 12 },
  { id: "flowers-left", expected: "flowers", label: "FLOWER LEDGE", x: 34, y: 57, width: 9 },
  { id: "lamp-steps", expected: "lamp", label: "PALACE STEPS", x: 58, y: 70, width: 7 },
  { id: "ornament-right", expected: "ornament", label: "ROYAL DETAIL", x: 69, y: 53, width: 8 },
];

const RANGOLI_COLORS = [
  { name: "Saffron", value: "#e0912f" },
  { name: "Lotus pink", value: "#e0708f" },
  { name: "Jade green", value: "#5f9560" },
  { name: "Royal blue", value: "#5b86c0" },
  { name: "Ivory", value: "#f6e8cb" },
  { name: "Marigold", value: "#f2bd3c" },
];

const GATES = [
  { id: "outer", name: "Outer gate", description: "Welcome the people of Ayodhya." },
  { id: "royal", name: "Royal gate", description: "Open the path to the palace." },
  { id: "inner", name: "Inner court", description: "Prepare the way for the ceremony." },
];

const STAGES = [
  { title: "Palace Decor", subtitle: "Adorn the royal palace" },
  { title: "Sacred Rangoli", subtitle: "Bring colour to the entrance" },
  { title: "Royal Gates", subtitle: "Open the way to Ayodhya" },
];

const PETAL_COUNT = 8;
const TOTAL_SLOTS = DECORATION_SLOTS.length;
const TOTAL_TASKS = TOTAL_SLOTS + PETAL_COUNT + GATES.length;

const AMBIENT_PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 29 + 7) % 100,
  delay: (i % 7) * 1.7,
  duration: 16 + (i % 5) * 3,
  size: 7 + (i % 3) * 3,
}));

const CONFETTI = Array.from({ length: 34 }, (_, i) => ({
  left: (i * 37 + 5) % 100,
  delay: (i % 11) * 0.16,
  duration: 3.4 + (i % 5) * 0.5,
  size: 6 + (i % 4) * 2,
  tone: i % 3,
}));

const computeStock = (placements) => {
  const stock = Object.fromEntries(DECORATIONS.map((item) => [item.id, item.stock]));
  Object.values(placements).forEach((id) => {
    if (stock[id] !== undefined) stock[id] -= 1;
  });
  return stock;
};

function PalaceFallback() {
  return (
    <svg
      className="coronation-palace-fallback"
      viewBox="0 0 800 360"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0c487" />
          <stop offset="0.5" stopColor="#8c6150" />
          <stop offset="1" stopColor="#1a1d24" />
        </linearGradient>
        <linearGradient id="pf-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b98a" />
          <stop offset="1" stopColor="#8b6a45" />
        </linearGradient>
      </defs>
      <rect width="800" height="360" fill="url(#pf-sky)" />
      <circle cx="400" cy="118" r="78" fill="#ffe2a6" opacity="0.32" />
      <g fill="url(#pf-wall)" stroke="#5a4129" strokeWidth="2">
        <rect x="150" y="170" width="110" height="140" />
        <rect x="540" y="170" width="110" height="140" />
        <rect x="270" y="140" width="260" height="170" />
        <path d="M300 140 Q400 20 500 140Z" />
        <rect x="392" y="22" width="16" height="28" />
        <path d="M150 170 L205 120 L260 170Z" />
        <path d="M540 170 L595 120 L650 170Z" />
      </g>
      <g fill="#3a2a1c">
        <path d="M368 310 V220 Q400 180 432 220 V310Z" />
        <rect x="190" y="205" width="30" height="45" rx="14" />
        <rect x="580" y="205" width="30" height="45" rx="14" />
        <rect x="300" y="190" width="24" height="40" rx="12" />
        <rect x="476" y="190" width="24" height="40" rx="12" />
      </g>
      <g fill="#b48a55" stroke="#5a4129">
        <rect x="330" y="310" width="140" height="10" />
        <rect x="310" y="320" width="180" height="10" />
        <rect x="290" y="330" width="220" height="30" />
      </g>
    </svg>
  );
}

function AssetImage({ candidates = [], alt = "", className = "", fallback = "✦", fallbackNode = null }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const source = candidates[index];

  if (!source) {
    if (fallbackNode) return fallbackNode;
    return (
      <div className={`coronation-image-fallback ${className}`} role="img" aria-label={alt}>
        {fallback}
      </div>
    );
  }

  return (
    <img
      className={`${className} ${loaded ? "is-loaded" : ""}`}
      src={`${ASSET_ROOT}/${source}`}
      alt={alt}
      draggable="false"
      onLoad={() => setLoaded(true)}
      onError={() => setIndex((current) => current + 1)}
    />
  );
}

function RangoliArtwork({ petalColors, selectedColor, onColourPetal, complete }) {
  const selectedName = RANGOLI_COLORS.find((c) => c.value === selectedColor)?.name || "selected colour";

  return (
    <svg
      className={`coronation-rangoli-svg ${complete ? "is-complete" : ""}`}
      viewBox="0 0 400 400"
      role="group"
      aria-label="Rangoli with eight petals. Select each petal to colour it."
    >
      <defs>
        <radialGradient id="rangoli-center-glow">
          <stop offset="0%" stopColor="#fbecc0" />
          <stop offset="100%" stopColor="#bd8d49" />
        </radialGradient>
        <linearGradient id="rangoli-petal-highlight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff3d5" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#4a2a16" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      <circle cx="200" cy="200" r="190" fill="none" stroke="#c7a56a" strokeWidth="1" strokeOpacity="0.55" />
      <circle cx="200" cy="200" r="178" fill="none" stroke="#c7a56a" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="164" fill="none" stroke="#c7a56a" strokeWidth="1" strokeDasharray="3 7" />
      <circle cx="200" cy="200" r="127" fill="none" stroke="#c7a56a" strokeWidth="1.5" strokeOpacity="0.7" />

      {/* ring dots take on the colour of the petal beside them */}
      {Array.from({ length: PETAL_COUNT }, (_, index) => {
        const angle = ((index * 45 + 22.5) * Math.PI) / 180;
        const cx = 200 + Math.sin(angle) * 171;
        const cy = 200 - Math.cos(angle) * 171;
        return (
          <circle
            key={`dot-${index}`}
            className="coronation-rangoli-dot"
            cx={cx}
            cy={cy}
            r="5.5"
            fill={petalColors[index] || "#2f261d"}
            stroke="#e9d2a0"
            strokeWidth="1"
          />
        );
      })}

      {/* small inner leaves between the petals */}
      {Array.from({ length: PETAL_COUNT }, (_, index) => (
        <ellipse
          key={`leaf-${index}`}
          className="coronation-rangoli-leaf"
          cx="200"
          cy="62"
          rx="8"
          ry="20"
          transform={`rotate(${index * 45 + 22.5} 200 200)`}
          fill={petalColors[index] || "#2f261d"}
          stroke="#e9d2a0"
          strokeWidth="1"
          strokeOpacity="0.6"
        />
      ))}

      {Array.from({ length: PETAL_COUNT }, (_, index) => {
        const angle = index * 45;
        const fill = petalColors[index] || "#45382c";

        return (
          <g
            key={index}
            className={`coronation-rangoli-petal ${petalColors[index] ? "is-coloured" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={`Petal ${index + 1}, ${petalColors[index] ? "coloured" : "not coloured"}. Fill with ${selectedName}.`}
            onClick={() => onColourPetal(index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onColourPetal(index);
              }
            }}
          >
            <ellipse
              cx="200"
              cy="117"
              rx="31"
              ry="69"
              transform={`rotate(${angle} 200 200)`}
              fill={fill}
              stroke="#e9d2a0"
              strokeWidth="2"
            />
            <ellipse
              cx="200"
              cy="117"
              rx="13"
              ry="47"
              transform={`rotate(${angle} 200 200)`}
              fill="url(#rangoli-petal-highlight)"
              stroke="#f2ddb3"
              strokeOpacity="0.45"
              strokeWidth="1"
              pointerEvents="none"
            />
          </g>
        );
      })}

      <circle className="coronation-rangoli-core" cx="200" cy="200" r="49" fill="#3c2b1e" stroke="#dfbd7d" strokeWidth="3" />
      <circle cx="200" cy="200" r="39" fill="url(#rangoli-center-glow)" stroke="#f5e2b8" strokeWidth="1.5" />
      <path d="M200 174 C216 188 216 207 200 224 C184 207 184 188 200 174Z" fill="#8d4e32" />
      <path d="M200 183 C188 193 188 204 200 216 C212 204 212 193 200 183Z" fill="#f8e9c7" />
      <circle cx="200" cy="200" r="8" fill="#a96d35" stroke="#fff0c7" strokeWidth="1.5" />
    </svg>
  );
}

function GateIllustration({ isOpen }) {
  return (
    <div className={`coronation-gate-illustration ${isOpen ? "is-open" : ""}`} aria-hidden="true">
      <div className="coronation-gate-halo" />
      <div className="coronation-gate-arch">
        <div className="coronation-gate-arch-inner" />
        <div className="coronation-gate-top-ornament">✧</div>
        <div className="coronation-gate-columns">
          <span />
          <span />
        </div>
        <div className="coronation-gate-opening">
          <div className="coronation-gate-light" />
          <div className="coronation-gate-door-left">
            <div className="coronation-gate-door-lines" />
            <span className="coronation-gate-door-emblem">✥</span>
          </div>
          <div className="coronation-gate-door-right">
            <div className="coronation-gate-door-lines" />
            <span className="coronation-gate-door-emblem">✥</span>
          </div>
        </div>
        <div className="coronation-gate-threshold" />
      </div>
    </div>
  );
}

export default function PrepareCoronationGame({ onComplete, onExit }) {
  const [stage, setStage] = useState(0);
  const [placements, setPlacements] = useState({});
  const [selectedDecoration, setSelectedDecoration] = useState("garland");
  const [petalColors, setPetalColors] = useState(Array(PETAL_COUNT).fill(null));
  const [selectedColor, setSelectedColor] = useState(RANGOLI_COLORS[0].value);
  const [openGates, setOpenGates] = useState({});
  const [notice, setNotice] = useState("Choose a decoration below, then place it on its matching palace marker.");
  const [showFinale, setShowFinale] = useState(false);
  const [wrongSlot, setWrongSlot] = useState(null);

  const completionSent = useRef(false);
  const wrongTimer = useRef(null);
  const topRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onExit?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  useEffect(() => () => window.clearTimeout(wrongTimer.current), []);

  const placedCount = Object.keys(placements).length;
  const colouredCount = petalColors.filter(Boolean).length;
  const openGateCount = GATES.filter((gate) => openGates[gate.id]).length;
  const totalProgress = placedCount + colouredCount + openGateCount;
  const allDecorationsPlaced = placedCount === TOTAL_SLOTS;
  const rangoliComplete = colouredCount === PETAL_COUNT;
  const gatesComplete = openGateCount === GATES.length;

  const stageDone = [allDecorationsPlaced, rangoliComplete, gatesComplete];
  const stageComplete = stageDone[stage];
  const furthestStage = !allDecorationsPlaced ? 0 : !rangoliComplete ? 1 : 2;

  const stockLeft = useMemo(() => computeStock(placements), [placements]);

  // Bring the player back to the top whenever the stage or finale changes.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stage, showFinale]);

  const flagWrongSlot = useCallback((slotId) => {
    setWrongSlot(slotId);
    window.clearTimeout(wrongTimer.current);
    wrongTimer.current = window.setTimeout(() => setWrongSlot(null), 480);
  }, []);

  const handlePlaceDecoration = (slot) => {
    const currentDecoration = placements[slot.id];

    // Tapping a decorated marker takes the decoration back.
    if (currentDecoration) {
      const removed = DECORATIONS.find((item) => item.id === currentDecoration);
      setPlacements((current) => {
        const next = { ...current };
        delete next[slot.id];
        return next;
      });
      setSelectedDecoration(currentDecoration);
      setNotice(`${removed?.name || "Decoration"} taken back from ${slot.label.toLowerCase()}. Place it anywhere it fits.`);
      return;
    }

    const item = DECORATIONS.find((decoration) => decoration.id === selectedDecoration);
    if (!item) return;

    if (slot.expected !== selectedDecoration) {
      const expected = DECORATIONS.find((decoration) => decoration.id === slot.expected);
      flagWrongSlot(slot.id);
      setNotice(`${slot.label} needs the ${expected?.name.toLowerCase() || "matching decoration"}. Select it below.`);
      return;
    }

    if (stockLeft[selectedDecoration] <= 0) {
      setNotice(`You have used every ${item.name.toLowerCase()}. Choose another item.`);
      return;
    }

    const nextPlacements = { ...placements, [slot.id]: selectedDecoration };
    const nextStock = computeStock(nextPlacements);
    const nextCount = Object.keys(nextPlacements).length;

    setPlacements(nextPlacements);

    if (nextStock[selectedDecoration] <= 0) {
      const upcoming = DECORATIONS.find((decoration) => nextStock[decoration.id] > 0);
      if (upcoming) setSelectedDecoration(upcoming.id);
    }

    setNotice(
      nextCount === TOTAL_SLOTS
        ? "Every marker is adorned. The palace shines. Continue to the rangoli."
        : `${item.name} placed at ${slot.label.toLowerCase()}. ${TOTAL_SLOTS - nextCount} to go.`
    );
  };

  const resetDecorations = () => {
    setPlacements({});
    setSelectedDecoration("garland");
    setNotice("Palace decorations reset. Begin again with any decoration below.");
  };

  const colourPetal = (index) => {
    setPetalColors((current) => {
      const next = [...current];
      next[index] = selectedColor;
      return next;
    });

    const colourName = RANGOLI_COLORS.find((colour) => colour.value === selectedColor)?.name;
    const willBeComplete = petalColors.filter((c, i) => (i === index ? true : Boolean(c))).length === PETAL_COUNT;

    setNotice(
      willBeComplete
        ? "The rangoli is complete and glowing. Continue to the royal gates."
        : `Petal ${index + 1} coloured ${colourName?.toLowerCase() || "beautifully"}.`
    );
  };

  const resetRangoli = () => {
    setPetalColors(Array(PETAL_COUNT).fill(null));
    setSelectedColor(RANGOLI_COLORS[0].value);
    setNotice("Rangoli reset. Choose a colour and fill all eight petals.");
  };

  const toggleGate = (gateId, index) => {
    const isOpen = Boolean(openGates[gateId]);
    const previous = GATES[index - 1];
    const following = GATES[index + 1];

    if (!isOpen && previous && !openGates[previous.id]) {
      setNotice(`Open the ${previous.name.toLowerCase()} first. The gates open in order.`);
      return;
    }

    if (isOpen && following && openGates[following.id]) {
      setNotice(`Close the ${following.name.toLowerCase()} first.`);
      return;
    }

    const next = { ...openGates, [gateId]: !isOpen };
    const nextCount = GATES.filter((gate) => next[gate.id]).length;
    const gate = GATES[index];

    setOpenGates(next);
    setNotice(
      nextCount === GATES.length
        ? "Every gate is open. Ayodhya is ready. Reveal the city when you are."
        : `${gate.name} ${next[gateId] ? "opened" : "closed"}. ${GATES.length - nextCount} more to open.`
    );
  };

  const goToStage = (nextStage) => {
    if (nextStage > furthestStage) return;
    setStage(nextStage);
    setNotice(
      nextStage === 0
        ? "Finish decorating the palace."
        : nextStage === 1
          ? "Bring colour to all eight rangoli petals."
          : "Open the three royal gates."
    );
  };

  const revealAyodhya = () => {
    setShowFinale(true);
    if (!completionSent.current) {
      completionSent.current = true;
      onComplete?.({ decorations: placements, rangoli: petalColors, gates: openGates });
    }
  };

  const continueStage = () => {
    if (!stageComplete) return;

    if (stage < 2) {
      setStage((current) => current + 1);
      setNotice(
        stage === 0
          ? "The palace is adorned. Now bring colour to the sacred rangoli."
          : "The rangoli is complete. Now open the royal gates."
      );
    } else {
      revealAyodhya();
    }
  };

  const goBack = () => {
    if (stage === 0) return;
    goToStage(stage - 1);
  };

  const replayGame = () => {
    setStage(0);
    setPlacements({});
    setSelectedDecoration("garland");
    setPetalColors(Array(PETAL_COUNT).fill(null));
    setSelectedColor(RANGOLI_COLORS[0].value);
    setOpenGates({});
    setShowFinale(false);
    completionSent.current = false;
    setNotice("Choose a decoration below, then place it on its matching palace marker.");
  };

  const currentStageTitle = STAGES[stage];
  const stageCount = stage === 0 ? placedCount : stage === 1 ? colouredCount : openGateCount;
  const stageTotal = stage === 0 ? TOTAL_SLOTS : stage === 1 ? PETAL_COUNT : GATES.length;
  const selectedItem = DECORATIONS.find((item) => item.id === selectedDecoration);

  return (
    <main className="coronation-game">
      <div className="coronation-ambient-glow" aria-hidden="true" />

      <div className="coronation-petals" aria-hidden="true">
        {AMBIENT_PETALS.map((petal, i) => (
          <i
            key={i}
            style={{
              left: `${petal.left}%`,
              width: petal.size,
              height: petal.size * 1.5,
              animationDelay: `${petal.delay}s`,
              animationDuration: `${petal.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="coronation-shell" ref={topRef}>
        <header className="coronation-header">
          <div className="coronation-brand">
            <div className="coronation-brand-mark" aria-hidden="true">✧</div>
            <div>
              <div className="coronation-eyebrow">ANCESTRA <span>•</span> RAMAYANA</div>
              <div className="coronation-brand-caption">An auspicious beginning</div>
            </div>
          </div>

          <div className="coronation-header-title">
            <span className="coronation-overline">THE ROYAL PREPARATIONS</span>
            <h1>Prepare the Coronation</h1>
          </div>

          <div className="coronation-header-actions">
            <div
              className="coronation-progress-summary"
              aria-label={`${totalProgress} of ${TOTAL_TASKS} tasks complete`}
            >
              <span>PREPARATIONS<br />COMPLETE</span>
              <strong>
                {String(totalProgress).padStart(2, "0")}
                <small>/{TOTAL_TASKS}</small>
              </strong>
            </div>
          </div>

          <div className="coronation-master-progress" aria-hidden="true">
            <span style={{ width: `${(totalProgress / TOTAL_TASKS) * 100}%` }} />
          </div>
        </header>

        {!showFinale ? (
          <>
            <nav className="coronation-stepper" aria-label="Coronation preparation stages">
              {STAGES.map((item, index) => {
                const complete = stageDone[index];

                return (
                  <button
                    key={item.title}
                    type="button"
                    className={`coronation-step ${stage === index ? "is-active" : ""} ${complete ? "is-complete" : ""}`}
                    onClick={() => goToStage(index)}
                    disabled={index > furthestStage}
                    aria-current={stage === index ? "step" : undefined}
                  >
                    <span className="coronation-step-number">{complete ? "✓" : `0${index + 1}`}</span>
                    <span className="coronation-step-copy">
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </span>
                    <span className="coronation-step-line" />
                  </button>
                );
              })}
            </nav>

            <section className="coronation-stage-heading">
              <div>
                <div className="coronation-stage-kicker">
                  <i /> PREPARATION {`0${stage + 1}`} <span>—</span>{" "}
                  {stage === 0 ? "THE PALACE" : stage === 1 ? "THE SACRED FLOOR" : "THE ROYAL ENTRANCE"}
                </div>
                <h2>{currentStageTitle.title}</h2>
                <p>
                  {stage === 0
                    ? "Adorn the palace of Ayodhya with flowers, banners and royal details. Select an item, then place it on its glowing marker in the scene. Tap a placed item to take it back."
                    : stage === 1
                      ? "Choose a colour from the palette below and select each petal to complete the ceremonial rangoli."
                      : "Open each gate in order to welcome the people and prepare the path for the royal celebration."}
                </p>
              </div>
              <div className="coronation-stage-counter">
                <strong>
                  {String(stageCount).padStart(2, "0")}
                  <span>/</span>
                  {String(stageTotal).padStart(2, "0")}
                </strong>
                <span>
                  {stage === 0 ? "DECORATIONS PLACED" : stage === 1 ? "PETALS COLOURED" : "GATES OPEN"}
                </span>
              </div>
            </section>

            <div className="coronation-stage-content" key={stage}>
              {stage === 0 && (
                <section className="coronation-palace-layout">
                  <div className="coronation-palace-scene">
                    <AssetImage
                      candidates={ASSET_FILES.city}
                      alt="The royal palace of Ayodhya awaiting its coronation decorations"
                      className="coronation-palace-image"
                      fallbackNode={<PalaceFallback />}
                    />
                    <div className="coronation-palace-vignette" />
                    <div className="coronation-scene-topline">
                      <span>AYODHYA · THE ROYAL PALACE</span>
                      <span>{allDecorationsPlaced ? "PREPARATIONS COMPLETE" : "PLACE EACH DECORATION"}</span>
                    </div>

                    {DECORATION_SLOTS.map((slot) => {
                      const placedId = placements[slot.id];
                      const placedItem = DECORATIONS.find((item) => item.id === placedId);
                      const expectedItem = DECORATIONS.find((item) => item.id === slot.expected);
                      const isMatch = !placedId && selectedDecoration === slot.expected;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          className={[
                            "coronation-palace-target",
                            placedId ? "is-placed" : "",
                            isMatch ? "is-match" : "",
                            wrongSlot === slot.id ? "is-wrong" : "",
                          ].join(" ")}
                          style={{
                            "--target-x": `${slot.x}%`,
                            "--target-y": `${slot.y}%`,
                            "--target-width": `${slot.width}%`,
                          }}
                          onClick={() => handlePlaceDecoration(slot)}
                          aria-label={`${slot.label}: ${
                            placedItem ? `${placedItem.name} placed. Select to take it back` : `empty, needs ${expectedItem?.name}. Select to place`
                          }.`}
                          title={`${slot.label} — ${expectedItem?.name}`}
                        >
                          {placedItem ? (
                            <AssetImage
                              key={`${slot.id}-${placedItem.id}`}
                              candidates={placedItem.image}
                              alt={placedItem.name}
                              className="coronation-placed-decoration"
                              fallback={placedItem.icon}
                            />
                          ) : (
                            <span className="coronation-target-marker">{isMatch ? "+" : "✦"}</span>
                          )}
                          <span className="coronation-target-label">{slot.label}</span>
                        </button>
                      );
                    })}

                    <div className="coronation-scene-caption">
                      <span className="coronation-caption-line" />
                      THE CITY OF RAMA
                      <span className="coronation-caption-line" />
                    </div>
                  </div>

                  <div className="coronation-decoration-workspace">
                    <div className="coronation-decoration-workspace-heading">
                      <div>
                        <span className="coronation-overline">THE ROYAL COLLECTION</span>
                        <h3>Choose your adornments</h3>
                        <p>
                          {selectedItem
                            ? `Holding: ${selectedItem.name}. Tap a glowing marker in the palace above to place it.`
                            : "Select a decoration here, then tap its matching marker in the palace image above."}
                        </p>
                      </div>
                      <span className="coronation-tray-symbol" aria-hidden="true">✧</span>
                    </div>

                    <div className="coronation-decoration-grid">
                      {DECORATIONS.map((item) => {
                        const remaining = stockLeft[item.id] ?? item.stock;
                        const depleted = remaining <= 0;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`coronation-decoration-option ${selectedDecoration === item.id ? "is-selected" : ""} ${depleted ? "is-depleted" : ""}`}
                            onClick={() => {
                              if (depleted) return;
                              setSelectedDecoration(item.id);
                              setNotice(`Selected ${item.name.toLowerCase()}. Now choose a glowing marker in the palace image.`);
                            }}
                            disabled={depleted}
                            aria-pressed={selectedDecoration === item.id}
                          >
                            <span className="coronation-decoration-thumbnail">
                              <AssetImage candidates={item.image} alt="" fallback={item.icon} />
                              <span className="coronation-decoration-icon">{item.icon}</span>
                            </span>
                            <span className="coronation-decoration-name">{item.name}</span>
                            <span className="coronation-decoration-stock">
                              {depleted ? "✓ All placed" : `${remaining} available`}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="coronation-tray-footer">
                      <div className="coronation-mini-progress">
                        <span style={{ width: `${(placedCount / TOTAL_SLOTS) * 100}%` }} />
                      </div>
                      <div className="coronation-tray-footer-row">
                        <span>{placedCount} of {TOTAL_SLOTS} palace details placed</span>
                        <button type="button" onClick={resetDecorations} disabled={placedCount === 0}>
                          Reset decorations
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {stage === 1 && (
                <section className="coronation-rangoli-layout">
                  <div className="coronation-rangoli-artboard">
                    <div className="coronation-rangoli-topline"><span>✧</span> AUSPICIOUS DESIGNS <span>✧</span></div>
                    <div className="coronation-rangoli-art">
                      <div className={`coronation-rangoli-backglow ${rangoliComplete ? "is-complete" : ""}`} />
                      <RangoliArtwork
                        petalColors={petalColors}
                        selectedColor={selectedColor}
                        onColourPetal={colourPetal}
                        complete={rangoliComplete}
                      />
                    </div>
                    <div className="coronation-rangoli-bottomline">
                      MADE WITH DEVOTION <span>·</span> COLOURED WITH CARE
                    </div>
                  </div>

                  <div className="coronation-rangoli-panel">
                    <span className="coronation-overline">THE SACRED ART</span>
                    <h3>Give every petal its colour.</h3>
                    <p>Choose a shade below, then select a petal in the rangoli. You can use the same colour more than once, and paint over a petal to change it.</p>

                    <div className="coronation-selected-colour">
                      <span className="coronation-colour-preview" style={{ background: selectedColor }} />
                      <span>
                        <small>SELECTED COLOUR</small>
                        <strong>{RANGOLI_COLORS.find((colour) => colour.value === selectedColor)?.name}</strong>
                      </span>
                    </div>

                    <div className="coronation-colour-palette" aria-label="Rangoli colour palette">
                      {RANGOLI_COLORS.map((colour) => (
                        <button
                          key={colour.name}
                          type="button"
                          className={`coronation-colour-swatch ${selectedColor === colour.value ? "is-selected" : ""}`}
                          onClick={() => setSelectedColor(colour.value)}
                          aria-label={`Select ${colour.name}`}
                          aria-pressed={selectedColor === colour.value}
                        >
                          <span style={{ "--swatch": colour.value }}>{selectedColor === colour.value ? "✓" : ""}</span>
                          <small>{colour.name}</small>
                        </button>
                      ))}
                    </div>

                    <div className="coronation-rangoli-tip">
                      <span aria-hidden="true">✧</span>
                      <p>In the tradition of welcoming auspicious beginnings, each petal adds another touch of colour to the entrance.</p>
                    </div>

                    <div className="coronation-rangoli-panel-footer">
                      <div>
                        <div className="coronation-mini-progress">
                          <span style={{ width: `${(colouredCount / PETAL_COUNT) * 100}%` }} />
                        </div>
                        <strong>{colouredCount} of {PETAL_COUNT} petals complete</strong>
                      </div>
                      <button type="button" onClick={resetRangoli} disabled={colouredCount === 0}>
                        Reset rangoli
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {stage === 2 && (
                <section className="coronation-gates-stage">
                  <div className="coronation-gates-intro">
                    <span className="coronation-overline">THE FINAL PREPARATION</span>
                    <h3>Let the celebration begin.</h3>
                    <p>Open each gate in order to welcome the city into the royal celebration.</p>
                  </div>

                  <div className="coronation-gates-grid">
                    {GATES.map((gate, index) => {
                      const isOpen = Boolean(openGates[gate.id]);
                      const locked = !isOpen && index > 0 && !openGates[GATES[index - 1].id];

                      return (
                        <button
                          key={gate.id}
                          type="button"
                          className={`coronation-gate-card ${isOpen ? "is-open" : ""} ${locked ? "is-locked" : ""}`}
                          onClick={() => toggleGate(gate.id, index)}
                          aria-pressed={isOpen}
                          aria-disabled={locked}
                          aria-label={`${gate.name}, currently ${isOpen ? "open" : locked ? "locked" : "closed"}. ${
                            locked ? "Open the previous gate first." : `Click to ${isOpen ? "close" : "open"} gate.`
                          }`}
                        >
                          <span className="coronation-gate-card-top">
                            <span className="coronation-gate-index">0{index + 1}</span>
                            <span className={`coronation-gate-status ${isOpen ? "is-open" : ""}`}>
                              <i /> {isOpen ? "OPEN" : locked ? "LOCKED" : "CLOSED"}
                            </span>
                          </span>
                          <GateIllustration isOpen={isOpen} />
                          <span className="coronation-gate-card-copy">
                            <h4>{gate.name}</h4>
                            <p>{gate.description}</p>
                          </span>
                          <span className="coronation-gate-action">
                            {locked ? "Open previous gate first" : isOpen ? "Close gate" : "Open gate"}{" "}
                            <span>{locked ? "🔒" : isOpen ? "↺" : "→"}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="coronation-gates-footnote">
                    <span>✧</span>
                    {gatesComplete ? "ALL GATES OPEN — AYODHYA AWAITS" : `${openGateCount} OF ${GATES.length} GATES OPEN`}
                    <span>✧</span>
                  </div>
                </section>
              )}
            </div>

            <footer className="coronation-footer">
              <div className="coronation-notice" role="status" aria-live="polite">
                <span className="coronation-notice-icon" aria-hidden="true">✧</span>
                <span>{notice}</span>
              </div>
              <div className="coronation-footer-actions">
                <button
                  type="button"
                  className="coronation-back-button"
                  onClick={goBack}
                  disabled={stage === 0}
                >
                  <span>←</span> Back
                </button>
                <button
                  type="button"
                  className={`coronation-primary-button ${stageComplete ? "is-ready" : ""}`}
                  onClick={continueStage}
                  disabled={!stageComplete}
                >
                  {stage === 2 ? "Reveal Ayodhya" : "Continue"} <span>→</span>
                </button>
              </div>
            </footer>
          </>
        ) : (
          <section className="coronation-finale">
            <div className="coronation-confetti" aria-hidden="true">
              {CONFETTI.map((piece, i) => (
                <i
                  key={i}
                  className={`tone-${piece.tone}`}
                  style={{
                    left: `${piece.left}%`,
                    width: piece.size,
                    height: piece.size * 1.6,
                    animationDelay: `${piece.delay}s`,
                    animationDuration: `${piece.duration}s`,
                  }}
                />
              ))}
            </div>

            <div className="coronation-finale-image-wrap">
              <AssetImage
                candidates={ASSET_FILES.finishedCity}
                alt="Ayodhya beautifully prepared for the royal celebration"
                className="coronation-finale-image"
                fallbackNode={<PalaceFallback />}
              />
              <div className="coronation-finale-image-shade" />
              <span className="coronation-finale-image-label">AYODHYA · READY FOR THE CELEBRATION</span>
            </div>

            <div className="coronation-finale-copy">
              <span className="coronation-overline">THE PREPARATIONS ARE COMPLETE</span>
              <div className="coronation-finale-emblem" aria-hidden="true">✧</div>
              <h2>Ayodhya<br />Awaits.</h2>
              <p>The palace is adorned, the rangoli is complete, and every royal gate stands open. The city is ready to welcome its long-awaited celebration.</p>

              <div className="coronation-finale-stats">
                <span><strong>{String(TOTAL_SLOTS).padStart(2, "0")}</strong> Palace details</span>
                <span><strong>{String(PETAL_COUNT).padStart(2, "0")}</strong> Coloured petals</span>
                <span><strong>{String(GATES.length).padStart(2, "0")}</strong> Open gates</span>
              </div>

              <div className="coronation-finale-actions">
                {onExit && (
                  <button type="button" className="coronation-primary-button" onClick={onExit}>
                    Return to the chronicle <span>→</span>
                  </button>
                )}
                <button
                  type="button"
                  className={onExit ? "coronation-secondary-button" : "coronation-primary-button"}
                  onClick={replayGame}
                >
                  Play again <span>↻</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}