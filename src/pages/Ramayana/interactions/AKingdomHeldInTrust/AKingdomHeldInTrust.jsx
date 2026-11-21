import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Crown,
  Droplets,
  Eye,
  Gift,
  Hammer,
  Heart,
  Landmark,
  Megaphone,
  Package,
  RotateCcw,
  Scale,
  ScrollText,
  Search,
  Shield,
  Ship,
  Sparkles,
  Users,
  Wheat,
} from "lucide-react";
import "./AKingdomHeldInTrust.css";

const PADUKA_SRC = "/images/ramayana/interactions/paduka.jpg";

/* =========================================================
   DATA
   ========================================================= */

const petitions = [
  {
    number: "01",
    category: "PUBLIC WELFARE",
    icon: Droplets,
    scene: "water",
    citizen: "A farmer from the eastern village",
    plea: "The river was diverted, my lord. Our fields are drying while our neighbours' flourish.",
    choices: [
      {
        id: "equal",
        title: "Divide equally",
        desc: "Both villages share the water.",
        icon: Scale,
        verdict: "Both channels flow. The dispute settles, though their needs still differ.",
        impact: { welfare: 1, justice: 2, stability: 1 },
      },
      {
        id: "need",
        title: "Greater need first",
        desc: "Water the driest fields first.",
        icon: Heart,
        verdict: "The parched fields drink first. The other village asks when its share returns.",
        impact: { welfare: 2, justice: 0, stability: 0 },
      },
      {
        id: "investigate",
        title: "Hear both villages",
        desc: "Find who diverted the river.",
        icon: Search,
        verdict: "The channel was shut without consent. Water is shared and both sides understand why.",
        impact: { welfare: 1, justice: 2, stability: 2 },
      },
    ],
  },
  {
    number: "02",
    category: "COMPASSION",
    icon: Wheat,
    scene: "granary",
    citizen: "A mother from a farming settlement",
    plea: "The harvest has failed. We ask only that our children and elders do not go hungry.",
    choices: [
      {
        id: "reserve",
        title: "Open the reserves",
        desc: "Release royal grain at once.",
        icon: Package,
        verdict: "Grain reaches every hearth. Ministers record each sack so none is wasted.",
        impact: { welfare: 2, justice: 1, stability: 1 },
      },
      {
        id: "loan",
        title: "Grain as a loan",
        desc: "Repay after the next harvest.",
        icon: ScrollText,
        verdict: "Families eat, but the debt weighs on those with uncertain harvests.",
        impact: { welfare: 1, justice: 0, stability: 1 },
      },
      {
        id: "inspect",
        title: "Assess each home",
        desc: "Send officials before giving.",
        icon: Eye,
        verdict: "Relief begins later, but it reaches the households in greatest need.",
        impact: { welfare: 1, justice: 2, stability: 1 },
      },
    ],
  },
  {
    number: "03",
    category: "JUSTICE",
    icon: Landmark,
    scene: "land",
    citizen: "A cultivator seeking justice",
    plea: "A powerful landholder has seized our field. We have witnesses who know the boundary.",
    choices: [
      {
        id: "witnesses",
        title: "Hear the witnesses",
        desc: "Examine every testimony.",
        icon: Users,
        verdict: "The boundary is proven by testimony, not by wealth or influence.",
        impact: { welfare: 1, justice: 2, stability: 1 },
      },
      {
        id: "restore",
        title: "Restore his access",
        desc: "Let him farm while it is examined.",
        icon: Shield,
        verdict: "He returns to his field. Hardship is prevented without settling the claim early.",
        impact: { welfare: 2, justice: 1, stability: 1 },
      },
      {
        id: "official",
        title: "Send a royal officer",
        desc: "An impartial inspection.",
        icon: Crown,
        verdict: "The officer inspects land and records. The ruling waits for his report.",
        impact: { welfare: 0, justice: 2, stability: 2 },
      },
    ],
  },
  {
    number: "04",
    category: "PUBLIC DUTY",
    icon: Hammer,
    scene: "bridge",
    citizen: "A merchant travelling between settlements",
    plea: "The rains broke the old crossing. Traders and villagers cannot reach the other bank.",
    choices: [
      {
        id: "repair",
        title: "Repair at once",
        desc: "Restore it as fast as possible.",
        icon: Hammer,
        verdict: "Planks go down and travel resumes. The people see they were heard.",
        impact: { welfare: 2, justice: 0, stability: 2 },
      },
      {
        id: "inspectbridge",
        title: "Inspect, then rebuild",
        desc: "Plan a durable crossing.",
        icon: Search,
        verdict: "A quick fix would not last. Stone piers rise for a stronger bridge.",
        impact: { welfare: 1, justice: 1, stability: 2 },
      },
      {
        id: "alternate",
        title: "A temporary ferry",
        desc: "Keep people moving meanwhile.",
        icon: Ship,
        verdict: "A raft carries travellers across while the long-term plan is prepared.",
        impact: { welfare: 2, justice: 1, stability: 1 },
      },
    ],
  },
  {
    number: "05",
    category: "ACCOUNTABILITY",
    icon: Scale,
    scene: "court",
    citizen: "An elderly widow",
    plea: "The local officer will not hear my complaint. I have no influence. Will the court listen?",
    choices: [
      {
        id: "hear",
        title: "Hear her publicly",
        desc: "Before the royal assembly.",
        icon: Megaphone,
        verdict: "The assembly hears her. The officer must answer, and every citizen learns they may be heard.",
        impact: { welfare: 2, justice: 2, stability: 1 },
      },
      {
        id: "investigateofficer",
        title: "Investigate the officer",
        desc: "Send an independent inspector.",
        icon: Eye,
        verdict: "An inspector examines the officer's conduct, free of personal influence.",
        impact: { welfare: 1, justice: 2, stability: 2 },
      },
      {
        id: "support",
        title: "Give immediate aid",
        desc: "Help now, review after.",
        icon: Gift,
        verdict: "She receives help today, and her complaint enters the court record.",
        impact: { welfare: 2, justice: 1, stability: 1 },
      },
    ],
  },
];

const initialStats = { welfare: 0, justice: 0, stability: 0 };

const statDetails = [
  { id: "welfare", label: "WELFARE", icon: Heart },
  { id: "justice", label: "JUSTICE", icon: Scale },
  { id: "stability", label: "STABILITY", icon: Shield },
];

const MAX_STAT = 10;

const SKIES = {
  water: "linear-gradient(180deg,#7cc4e0 0%,#bfe8dc 52%,#f3e8be 100%)",
  granary: "linear-gradient(180deg,#e9a05a 0%,#f2c383 50%,#f7e0ae 100%)",
  land: "linear-gradient(180deg,#86bfe6 0%,#cfe6d2 55%,#f1e9be 100%)",
  bridge: "linear-gradient(180deg,#58708a 0%,#8ea3b4 55%,#c3cdc9 100%)",
  court: "linear-gradient(180deg,#3a2433 0%,#7a4a3a 50%,#d79a5a 100%)",
};

/* =========================================================
   3D TOOLKIT  (pure CSS 3D — no extra libraries)
   World axes: x → right, y → toward viewer, z → up
   ========================================================= */

function useFit(baseW, baseH) {
  const [node, setNode] = useState(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!node) return undefined;
    const update = () => {
      const r = node.getBoundingClientRect();
      if (!r.width || !r.height) return;
      setScale(Math.max(0.4, Math.min(r.width / baseW, r.height / baseH, 1.25)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, [node, baseW, baseH]);

  return [setNode, scale];
}

function Cuboid({
  w = 40,
  d = 40,
  h = 40,
  x = 0,
  y = 0,
  z = 0,
  color = "#c9a36a",
  top,
  side,
  topBg,
  initial,
  animate,
  transition,
  children,
}) {
  return (
    <motion.div
      className="k3"
      style={{ width: w, height: d }}
      initial={initial || { x, y, z }}
      animate={animate || { x, y, z }}
      transition={transition}
    >
      <i
        className="k3-top"
        style={{ background: topBg || top || color, transform: `translateZ(${h}px)` }}
      />
      <i
        className="k3-front"
        style={{ width: w, height: h, top: d, background: side || color }}
      />
      <i
        className="k3-right"
        style={{ width: d, height: h, left: w, background: side || color }}
      />
      {children}
    </motion.div>
  );
}

function Plane({
  x = 0,
  y = 0,
  w = 100,
  d = 100,
  z = 1,
  color = "rgba(0,0,0,0)",
  image,
  initial,
  animate,
  transition,
  children,
}) {
  return (
    <motion.div
      className="k3-plane"
      style={{
        left: x,
        top: y,
        width: w,
        height: d,
        z,
        backgroundColor: color,
        backgroundImage: image,
      }}
      initial={{ backgroundColor: color, ...initial }}
      animate={{ backgroundColor: color, ...animate }}
      transition={transition || { duration: 1.4 }}
    >
      {children}
    </motion.div>
  );
}

function Water({ x = 0, y = 0, w = 100, d = 100, flow = "y", z = 2, initial, animate, transition }) {
  return (
    <motion.div
      className={`k3-water k3-water--${flow}`}
      style={{ left: x, top: y, width: w, height: d, z }}
      initial={initial}
      animate={animate}
      transition={transition}
    />
  );
}

function Person({
  x = 0,
  y = 0,
  z = 0,
  s = 1,
  body = "#8a5a3a",
  skin = "#c98d5e",
  hat,
  initial,
  animate,
  transition,
  children,
}) {
  const bob = 1.5 + (Math.abs(Math.round(x)) % 7) * 0.12;
  return (
    <motion.div
      className="k3"
      style={{ width: 22 * s, height: 14 * s }}
      initial={initial || { x, y, z }}
      animate={animate || { x, y, z }}
      transition={transition}
    >
      <motion.div
        className="k3"
        style={{ width: 22 * s, height: 14 * s }}
        animate={{ z: [0, 3 * s, 0] }}
        transition={{ duration: bob, repeat: Infinity, ease: "easeInOut" }}
      >
        <Cuboid w={22 * s} d={14 * s} h={32 * s} color={body} />
        <Cuboid w={16 * s} d={14 * s} h={15 * s} x={3 * s} z={32 * s} color={skin} />
        {hat && <Cuboid w={18 * s} d={16 * s} h={5 * s} x={2 * s} y={-1 * s} z={46 * s} color={hat} />}
        {children}
      </motion.div>
    </motion.div>
  );
}

function Tree({ x, y, s = 1 }) {
  return (
    <Cuboid w={10 * s} d={10 * s} h={32 * s} x={x} y={y} color="#6b4a2a" top="#86613a">
      <Cuboid w={38 * s} d={38 * s} h={26 * s} x={-14 * s} y={-14 * s} z={30 * s} color="#3d8a3a" top="#5db04e" />
      <Cuboid w={24 * s} d={24 * s} h={20 * s} x={-7 * s} y={-7 * s} z={54 * s} color="#46963f" top="#72c25a" />
    </Cuboid>
  );
}

function Plant({ x, y, grown, delay = 0, color = "#58a23a", topColor = "#8ccf56" }) {
  return grown ? (
    <Cuboid
      key="grown"
      w={7}
      d={7}
      h={22}
      color={color}
      top={topColor}
      initial={{ x, y, z: -26 }}
      animate={{ x, y, z: 0 }}
      transition={{ type: "spring", stiffness: 110, damping: 13, delay }}
    />
  ) : (
    <Cuboid key="dry" w={5} d={5} h={6} x={x} y={y} color="#6e4a28" top="#8a6034" />
  );
}

const CRACKS =
  "repeating-linear-gradient(35deg, rgba(70,40,15,.38) 0 2px, transparent 2px 26px), repeating-linear-gradient(-52deg, rgba(70,40,15,.3) 0 2px, transparent 2px 34px)";
const FURROWS =
  "repeating-linear-gradient(90deg, rgba(0,0,0,.2) 0 4px, transparent 4px 18px)";

function Field({ x, y, w = 190, d = 190, wet, rows = 4, cols = 5, crop = "green" }) {
  const gold = crop === "gold";
  const plants = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      plants.push(
        <Plant
          key={`${r}-${c}`}
          x={16 + c * ((w - 38) / (cols - 1))}
          y={16 + r * ((d - 38) / (rows - 1))}
          grown={wet}
          delay={0.5 + (r + c) * 0.09}
          color={gold ? "#c9a22f" : "#58a23a"}
          topColor={gold ? "#efd36a" : "#8ccf56"}
        />
      );
    }
  }
  return (
    <Plane
      x={x}
      y={y}
      w={w}
      d={d}
      z={2}
      color={wet ? "#5b3d22" : "#c49660"}
      image={wet ? FURROWS : CRACKS}
    >
      {plants}
    </Plane>
  );
}

const joy = (x, y, on) => (on ? { x, y, z: [0, 14, 0, 9, 0] } : { x, y, z: 0 });

/* =========================================================
   SCENES
   ========================================================= */

/* 1 — THE WATER DISPUTE */
function WaterScene({ outcome }) {
  const done = !!outcome;
  const lw = outcome === "need" ? 56 : 36;
  const rw = outcome === "need" ? 22 : 36;

  return (
    <>
      <Cuboid w={520} d={520} h={20} z={-20} color="#6a4a2d" topBg="linear-gradient(135deg,#a9d276,#82b158)" />
      <Cuboid w={520} d={8} h={6} y={8} color="#9b8c75" />
      <Cuboid w={520} d={8} h={6} y={98} color="#9b8c75" />
      <Water x={0} y={16} w={520} d={82} flow="x" />

      <Plane x={100} y={106} w={36} d={146} z={1.5} color="#7a5530" />
      <Plane x={354} y={106} w={36} d={146} z={1.5} color="#7a5530" />

      <Water
        x={354}
        y={106}
        w={36}
        d={146}
        flow="y"
        z={2.5}
        initial={{ left: 354, width: 36 }}
        animate={{ left: 372 - rw / 2, width: rw }}
        transition={{ duration: 1.2 }}
      />
      <Water
        x={100}
        y={106}
        w={36}
        d={0}
        flow="y"
        z={2.5}
        initial={{ height: 0, left: 100, width: 36 }}
        animate={{ height: done ? 146 : 0, left: 118 - lw / 2, width: lw }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />

      <Cuboid
        w={46}
        d={8}
        h={24}
        color="#7b5a34"
        top="#a07a48"
        initial={{ x: 95, y: 100, z: 0 }}
        animate={{ x: 95, y: 100, z: done ? 46 : 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      />

      <Field x={30} y={256} wet={done} />
      <Field x={300} y={256} wet />

      <Tree x={470} y={122} />
      <Tree x={24} y={124} s={0.9} />
      <Tree x={250} y={470} s={0.8} />

      {outcome === "investigate" && (
        <Person
          body="#2f5d8c"
          hat="#e3bd6f"
          initial={{ x: 200, y: 150, z: -70 }}
          animate={{ x: 200, y: 126, z: 0 }}
          transition={{ duration: 0.9 }}
        />
      )}

      <Person x={70} y={470} body="#8a5a3a" hat="#efe6cc" animate={joy(70, 470, done)} transition={{ duration: 1.1, delay: 0.8 }} />
      <Person x={440} y={470} body="#4a7a4a" hat="#efe6cc" animate={joy(440, 470, done)} transition={{ duration: 1.1, delay: 1 }} />
    </>
  );
}

/* 2 — THE EMPTY GRANARIES */
const HUTS = [
  [24, 250],
  [140, 296],
  [266, 250],
  [382, 296],
];

function Hut({ x, y }) {
  return (
    <Cuboid w={72} d={62} h={36} x={x} y={y} color="#d8b98a" top="#e2c99d">
      <Cuboid w={86} d={76} h={14} x={-7} y={-7} z={36} color="#a8742f" />
      <Cuboid w={58} d={48} h={12} x={7} y={-1} z={50} color="#b9863a" top="#c98f3f" />
      <Cuboid w={28} d={3} h={22} x={22} y={62} color="#3b2615" />
    </Cuboid>
  );
}

function Sack({ x, y, delay, scroll }) {
  return (
    <Cuboid
      w={18}
      d={14}
      h={14}
      color="#d6ad52"
      top="#eccb78"
      initial={{ x, y, z: 170 }}
      animate={{ x, y, z: 0 }}
      transition={{ type: "spring", stiffness: 90, damping: 11, delay }}
    >
      {scroll && <Cuboid w={12} d={7} h={3} x={3} y={3} z={14} color="#f4ecd4" />}
    </Cuboid>
  );
}

function GranaryScene({ outcome }) {
  const sacks = outcome === "reserve" ? 3 : outcome === "inspect" ? 2 : outcome === "loan" ? 1 : 0;
  const delay0 = outcome === "inspect" ? 2.3 : 0.5;
  const done = !!outcome;

  return (
    <>
      <Cuboid w={520} d={520} h={20} z={-20} color="#7a5832" topBg="linear-gradient(135deg,#dbb97b,#c39a5c)" />
      <Plane x={0} y={0} w={520} d={520} z={1} image={CRACKS} />

      <Cuboid w={130} d={90} h={64} x={195} y={30} color="#c9a064" top="#d8b27a">
        <Cuboid w={146} d={104} h={20} x={-8} y={-7} z={64} color="#8d3b2c" />
        <Cuboid w={104} d={74} h={18} x={13} y={8} z={84} color="#a64a36" />
        <Cuboid w={64} d={44} h={16} x={33} y={23} z={102} color="#bd5c42" />
        <Cuboid w={38} d={3} h={40} x={46} y={90} color="#3a2414" />
      </Cuboid>

      {outcome === "reserve" && (
        <Plane
          x={238}
          y={132}
          w={44}
          d={0}
          z={2.5}
          color="rgba(255,214,120,.6)"
          initial={{ height: 0 }}
          animate={{ height: 150 }}
          transition={{ duration: 1.2 }}
        />
      )}

      {HUTS.map(([hx, hy], i) => (
        <Hut key={`h${i}`} x={hx} y={hy} />
      ))}

      {HUTS.map(([hx, hy], i) =>
        Array.from({ length: sacks }, (_, j) => (
          <Sack
            key={`${i}-${j}-${outcome}`}
            x={hx + 4 + j * 22}
            y={hy + 76 + (j % 2) * 10}
            delay={delay0 + i * 0.22 + j * 0.12}
            scroll={outcome === "loan"}
          />
        ))
      )}

      {outcome === "inspect" &&
        HUTS.map(([hx, hy], i) => (
          <Person
            key={`o${i}`}
            body="#2f5d8c"
            hat="#e3bd6f"
            initial={{ x: 250, y: 136, z: 0 }}
            animate={{ x: hx + 36, y: hy + 70, z: 0 }}
            transition={{ duration: 1.8, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}

      <Person x={226} y={410} body="#b04a4a" hat="#ead9b0" animate={joy(226, 410, done)} transition={{ duration: 1.1, delay: 1.4 }} />
      <Person x={262} y={420} s={0.6} body="#d9b36a" animate={joy(262, 420, done)} transition={{ duration: 1.1, delay: 1.6 }} />

      <Tree x={470} y={410} s={0.8} />
      <Tree x={22} y={430} s={0.8} />
    </>
  );
}

/* 3 — THE DISPUTED LAND */
function LandScene({ outcome }) {
  const sprout = outcome === "restore" || outcome === "witnesses";
  const line = outcome === "witnesses" || outcome === "official";

  return (
    <>
      <Cuboid w={520} d={520} h={20} z={-20} color="#6a4a2d" topBg="linear-gradient(135deg,#9fcb6e,#7dac55)" />

      <Field x={36} y={196} w={216} d={250} wet={sprout} rows={5} cols={5} />
      <Field x={270} y={196} w={216} d={250} wet rows={5} cols={5} crop="gold" />

      {Array.from({ length: 5 }, (_, i) => (
        <Cuboid key={`s${i}`} w={12} d={12} h={20} x={254} y={196 + i * 52} color="#a9a59a" top="#d2cdbf" />
      ))}
      <Plane
        x={257}
        y={196}
        w={6}
        d={0}
        z={3}
        color="#f2c75a"
        initial={{ height: 0 }}
        animate={{ height: line ? 250 : 0 }}
        transition={{ duration: 1.4 }}
      />

      {Array.from({ length: 6 }, (_, i) => (
        <Cuboid
          key={`b${i}`}
          w={28}
          d={8}
          h={26}
          color="#6b4226"
          top="#92613a"
          initial={{ x: 40 + i * 36, y: 452, z: 0 }}
          animate={{ x: 40 + i * 36, y: 452, z: outcome === "restore" ? -40 : 0 }}
          transition={{ duration: 0.9, delay: i * 0.1 }}
        />
      ))}

      <Person
        x={340}
        y={120}
        s={1.15}
        body="#9b2f2f"
        hat="#e3bd6f"
        animate={{ x: outcome ? 420 : 340, y: 120, z: 0 }}
        transition={{ duration: 1.2 }}
      />
      <Person x={300} y={140} body="#5a3a2a" hat="#444">
        <Cuboid w={3} d={3} h={64} x={-5} y={4} color="#cfcfcf" />
      </Person>
      <Person x={390} y={150} body="#5a3a2a" hat="#444">
        <Cuboid w={3} d={3} h={64} x={-5} y={4} color="#cfcfcf" />
      </Person>

      <Person
        x={110}
        y={486}
        body="#7a5a3a"
        hat="#efe6cc"
        animate={outcome === "restore" ? { x: 120, y: 340, z: 0 } : { x: 110, y: 486, z: 0 }}
        transition={{ duration: 1.8, delay: 0.4 }}
      />

      {outcome === "witnesses" &&
        [0, 1, 2].map((i) => (
          <Person
            key={`w${i}`}
            body={["#4a7a4a", "#5a5aa0", "#a07a3a"][i]}
            hat="#efe6cc"
            initial={{ x: 170 + i * 36, y: 488, z: -70 }}
            animate={{ x: 170 + i * 36, y: 488, z: 0 }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.25 }}
          />
        ))}

      {outcome === "official" && (
        <Person
          s={1.1}
          body="#2f5d8c"
          hat="#e3bd6f"
          initial={{ x: 236, y: -30, z: 0 }}
          animate={{ x: 236, y: 140, z: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          <Cuboid w={10} d={6} h={14} x={26} y={4} z={14} color="#f4ecd4" />
        </Person>
      )}

      <Tree x={24} y={90} />
      <Tree x={480} y={60} s={1.1} />
    </>
  );
}

/* 4 — THE BROKEN CROSSING */
const PLANK_GAP = [3, 4, 5];

function BridgeScene({ outcome }) {
  const fixed = outcome === "repair";

  return (
    <>
      <Cuboid w={520} d={520} h={20} z={-20} color="#5a4a35" topBg="linear-gradient(135deg,#86ad66,#6c9650)" />
      <Water x={180} y={0} w={160} d={520} flow="y" />
      <Cuboid w={10} d={520} h={5} x={172} color="#8f8c84" />
      <Cuboid w={10} d={520} h={5} x={338} color="#8f8c84" />
      <Cuboid w={26} d={54} h={9} x={150} y={228} color="#8f8c84" top="#aaa79d" />
      <Cuboid w={26} d={54} h={9} x={344} y={228} color="#8f8c84" top="#aaa79d" />

      {Array.from({ length: 9 }, (_, i) => {
        const gone = PLANK_GAP.includes(i);
        if (gone && !fixed) return null;
        return (
          <Cuboid
            key={`${i}-${fixed}`}
            w={22}
            d={50}
            h={5}
            color="#9a6a3a"
            top="#bd8a52"
            initial={{ x: 156 + i * 24, y: 230, z: gone ? 150 : 9 }}
            animate={{ x: 156 + i * 24, y: 230, z: 9 }}
            transition={{ type: "spring", stiffness: 110, damping: 12, delay: gone ? 0.4 + (i - 3) * 0.3 : 0 }}
          />
        );
      })}

      {outcome === "inspectbridge" && (
        <>
          {[244, 284].map((px, i) => (
            <Cuboid
              key={`p${i}`}
              w={20}
              d={20}
              h={30}
              color="#9b978c"
              top="#bdb9ac"
              initial={{ x: px, y: 246, z: -60 }}
              animate={{ x: px, y: 246, z: 0 }}
              transition={{ duration: 1.2, delay: 0.3 + i * 0.3 }}
            />
          ))}
          <Plane
            x={40}
            y={330}
            w={110}
            d={0}
            z={2.5}
            color="#2d5f8a"
            image="repeating-linear-gradient(0deg, rgba(255,255,255,.4) 0 1px, transparent 1px 14px), repeating-linear-gradient(90deg, rgba(255,255,255,.4) 0 1px, transparent 1px 14px)"
            initial={{ height: 0 }}
            animate={{ height: 90 }}
            transition={{ duration: 1.2, delay: 0.8 }}
          />
          <Person
            body="#2f5d8c"
            hat="#e3bd6f"
            initial={{ x: 90, y: 160, z: -70 }}
            animate={{ x: 90, y: 270, z: 0 }}
            transition={{ duration: 1.2 }}
          />
        </>
      )}

      {outcome === "alternate" && (
        <Cuboid
          w={64}
          d={46}
          h={5}
          color="#a07a44"
          top="#c39a5c"
          initial={{ x: 186, y: 330, z: 2 }}
          animate={{ x: [186, 270, 186], y: 330, z: 2 }}
          transition={{ x: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
        >
          <Person x={8} y={14} z={5} s={0.8} body="#c56b2a" hat="#efe6cc" />
          <Person x={36} y={16} z={5} s={0.8} body="#4a7a4a" hat="#efe6cc" />
        </Cuboid>
      )}

      <Person
        x={60}
        y={246}
        body="#c56b2a"
        hat="#efe6cc"
        animate={
          fixed
            ? { x: [60, 150, 176, 350, 372, 440], y: 246, z: [0, 0, 14, 14, 0, 0] }
            : { x: 60, y: 246, z: 0 }
        }
        transition={{ duration: 6, delay: 2.4, ease: "linear" }}
      >
        <Cuboid w={14} d={10} h={14} x={4} y={14} z={14} color="#d6ad52" />
      </Person>
      <Person
        x={34}
        y={268}
        body="#7a4a8a"
        hat="#efe6cc"
        animate={
          fixed
            ? { x: [34, 150, 176, 350, 372, 420], y: 268, z: [0, 0, 14, 14, 0, 0] }
            : { x: 34, y: 268, z: 0 }
        }
        transition={{ duration: 6.4, delay: 3, ease: "linear" }}
      />
      <Person x={440} y={250} body="#4a7a4a" hat="#efe6cc" />

      <Tree x={40} y={100} />
      <Tree x={460} y={110} s={1.1} />
      <Tree x={460} y={420} s={0.9} />
    </>
  );
}

/* 5 — A PETITION FOR JUSTICE */
function Pillar({ x, y }) {
  return (
    <Cuboid w={26} d={26} h={130} x={x} y={y} color="#c79a55" top="#e0b872">
      <Cuboid w={34} d={34} h={8} x={-4} y={-4} color="#8d5f2c" />
      <Cuboid w={36} d={36} h={10} x={-5} y={-5} z={130} color="#8d5f2c" top="#a97836" />
    </Cuboid>
  );
}

function CourtScene({ outcome }) {
  return (
    <>
      <Cuboid
        w={520}
        d={520}
        h={20}
        z={-20}
        color="#6a4a2d"
        topBg="conic-gradient(#ead8ae 25%, #d6bf8a 0 50%, #ead8ae 0 75%, #d6bf8a 0) 0 0 / 130px 130px"
      />

      <Pillar x={30} y={30} />
      <Pillar x={464} y={30} />
      <Pillar x={30} y={220} />
      <Pillar x={464} y={220} />

      <Cuboid w={250} d={100} h={8} x={135} y={24} color="#8d6a3a" top="#b08650" />
      <Cuboid w={220} d={80} h={16} x={150} y={34} z={8} color="#a77b43" top="#c99a56">
        <Cuboid w={70} d={12} h={74} x={75} y={6} z={16} color="#d9aa52" top="#f0cb78" />
        <Cuboid w={70} d={34} h={16} x={75} y={18} z={16} color="#d9aa52" top="#f0cb78" />
        <Cuboid w={12} d={26} h={6} x={88} y={24} z={32} color="#f6d982" top="#ffe9a3" />
        <Cuboid w={12} d={26} h={6} x={110} y={24} z={32} color="#f6d982" top="#ffe9a3" />
      </Cuboid>

      <Cuboid w={50} d={24} h={18} x={356} y={244} color="#6b4a2a" top="#8d6a40" />
      <Person
        x={372}
        y={216}
        s={1.2}
        body="#8e2a2a"
        hat="#2a2a2a"
        animate={{ x: outcome === "hear" ? 440 : 372, y: 216, z: 0 }}
        transition={{ duration: 1.4 }}
      />

      {outcome === "hear" && (
        <>
          <Plane
            x={222}
            y={112}
            w={76}
            d={0}
            z={2.5}
            color="#a3302c"
            image="linear-gradient(90deg,#e3bd6f 0 6px,transparent 6px calc(100% - 6px),#e3bd6f 0)"
            initial={{ height: 0 }}
            animate={{ height: 330 }}
            transition={{ duration: 1.6 }}
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Person
              key={`c${i}`}
              body={["#4a7a4a", "#5a5aa0", "#a07a3a", "#7a4a8a", "#2f7a7a", "#a05a3a"][i]}
              hat="#efe6cc"
              initial={{ x: i % 2 ? 330 : 150, y: 200 + Math.floor(i / 2) * 60, z: -70 }}
              animate={{ x: i % 2 ? 330 : 150, y: 200 + Math.floor(i / 2) * 60, z: 0 }}
              transition={{ duration: 0.8, delay: 0.4 + i * 0.18 }}
            />
          ))}
        </>
      )}

      {outcome === "investigateofficer" && (
        <Person
          s={1.1}
          body="#2f5d8c"
          hat="#e3bd6f"
          initial={{ x: 200, y: 20, z: 0 }}
          animate={{ x: 330, y: 214, z: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          <Cuboid w={10} d={6} h={14} x={-12} y={4} z={14} color="#f4ecd4" />
        </Person>
      )}

      {outcome === "support" && (
        <>
          <Person
            body="#2f5d8c"
            hat="#e3bd6f"
            initial={{ x: 200, y: 40, z: 0 }}
            animate={{ x: 150, y: 420, z: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <Cuboid
            w={22}
            d={18}
            h={12}
            color="#b07a3a"
            top="#d29a52"
            initial={{ x: 128, y: 436, z: 170 }}
            animate={{ x: 128, y: 436, z: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 11, delay: 1.2 }}
          />
          <Cuboid
            w={20}
            d={16}
            h={8}
            color="#e8e4d6"
            top="#fffaf0"
            initial={{ x: 160, y: 446, z: 170 }}
            animate={{ x: 160, y: 446, z: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 11, delay: 1.5 }}
          />
        </>
      )}

      <Person
        s={0.9}
        body="#e9e4d6"
        hat="#d8d3c2"
        initial={{ x: 90, y: 420, z: 0 }}
        animate={
          outcome === "hear"
            ? { x: 232, y: 250, z: 0 }
            : outcome === "investigateofficer"
            ? { x: 200, y: 330, z: 0 }
            : { x: 90, y: 420, z: 0 }
        }
        transition={{ duration: 2.2, ease: "easeInOut" }}
      />
    </>
  );
}

const SCENES = {
  water: WaterScene,
  granary: GranaryScene,
  land: LandScene,
  bridge: BridgeScene,
  court: CourtScene,
};

/* =========================================================
   STAGE, WORLD, FX
   ========================================================= */

function World({ children }) {
  return (
    <motion.div
      className="kingdom-world"
      style={{ rotateX: 58 }}
      initial={{ rotateZ: 34, scale: 0.7 }}
      animate={{ rotateZ: [34, 40, 34], scale: 1 }}
      exit={{ scale: 0.8 }}
      transition={{
        scale: { duration: 0.9, ease: "easeOut" },
        rotateZ: { duration: 14, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {children}
    </motion.div>
  );
}

function Motes({ count = 16 }) {
  return (
    <div className="kingdom-motes" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 53) % 100}%`,
            animationDelay: `${(i * 0.9) % 7}s`,
            animationDuration: `${7 + (i % 5) * 1.6}s`,
            "--s": `${3 + (i % 4)}px`,
          }}
        />
      ))}
    </div>
  );
}

function Stage({ scene, outcome, children }) {
  const [ref, scale] = useFit(760, 500);
  const Scene = SCENES[scene];

  return (
    <div className="kingdom-stage" ref={ref}>
      <AnimatePresence>
        <motion.div
          key={scene}
          className="kingdom-sky"
          style={{ background: SKIES[scene] }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>
      <div className="kingdom-sun" />
      <Motes count={12} />
      <div className="kingdom-camera" style={{ transform: `scale(${scale})` }}>
        <AnimatePresence mode="wait">
          <World key={scene}>
            <Scene outcome={outcome} />
          </World>
        </AnimatePresence>
      </div>
      {scene === "bridge" && <div className="kingdom-rain" />}
      <div className="kingdom-stage__vignette" />
      {children}
    </div>
  );
}

/* =========================================================
   MAIN GAME
   ========================================================= */

export default function AKingdomHeldInTrust({ onComplete }) {
  const [started, setStarted] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [petitionIndex, setPetitionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [history, setHistory] = useState([]);

  const isComplete = petitionIndex >= petitions.length;
  const petition = petitions[Math.min(petitionIndex, petitions.length - 1)];
  const chosen = petition.choices.find((c) => c.id === selectedChoice);
  const outcome = showResult ? selectedChoice : null;

  useEffect(() => {
    if (!showResult) return undefined;
    setCanNext(false);
    const t = setTimeout(() => setCanNext(true), 1400);
    return () => clearTimeout(t);
  }, [showResult, petitionIndex]);

  const chooseDecision = () => {
    if (!chosen || showResult) return;
    setStats((prev) => ({
      welfare: prev.welfare + chosen.impact.welfare,
      justice: prev.justice + chosen.impact.justice,
      stability: prev.stability + chosen.impact.stability,
    }));
    setHistory((prev) => [
      ...prev,
      { petition: petition.title || petition.category, choice: chosen.title, icon: chosen.icon },
    ]);
    setShowResult(true);
  };

  const nextPetition = () => {
    setPetitionIndex((p) => p + 1);
    setSelectedChoice(null);
    setShowResult(false);
  };

  const restart = () => {
    setPetitionIndex(0);
    setSelectedChoice(null);
    setShowResult(false);
    setStats(initialStats);
    setHistory([]);
  };

  const total = stats.welfare + stats.justice + stats.stability;
  const rating =
    total >= 19
      ? "A thoughtful stewardship"
      : total >= 15
      ? "A compassionate stewardship"
      : total >= 11
      ? "A developing stewardship"
      : "A difficult beginning";

  const paduka = !imgFailed && (
    <img
      className="kingdom-bgimg"
      src={PADUKA_SRC}
      alt="Rama's padukas upon the throne"
      onError={() => setImgFailed(true)}
      draggable={false}
    />
  );

  return (
    <div className="kingdom-game">
      <AnimatePresence mode="wait">
        {/* ---------- INTRO ---------- */}
        {!started && (
          <motion.section
            key="intro"
            className="kingdom-intro"
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className="kingdom-intro__bg"
              initial={{ scale: 1.14 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "easeOut" }}
            >
              {paduka}
              {imgFailed && <div className="kingdom-intro__fallback" />}
            </motion.div>
            <div className="kingdom-veil" />
            <Motes count={22} />

            <div className="kingdom-intro__top">
              <Sparkles size={14} />
              <span>ANCESTRA</span>
              <i />
              <small>CHAPTER VI · GAME III</small>
            </div>

            <div className="kingdom-intro__center">
              <motion.span
                className="kingdom-kicker"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                THE FOURTEEN-YEAR STEWARDSHIP
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.9 }}
              >
                The Kingdom Under
                <br />
                Rama's Sandals
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.9 }}
              >
                The throne is empty. Bharata rules only in his brother's name.
              </motion.p>
              <motion.button
                type="button"
                className="kingdom-enter"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7, duration: 0.8 }}
                onClick={() => setStarted(true)}
              >
                ENTER THE ASSEMBLY <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* ---------- PLAY ---------- */}
        {started && !isComplete && (
          <motion.div
            key="play"
            className="kingdom-play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <header className="kingdom-hud">
              <div className="kingdom-hud__brand">
                <Crown size={15} />
                <span>RAMA'S PADUKAS</span>
              </div>

              <div className="kingdom-hud__steps">
                {petitions.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <span
                      key={p.number}
                      className={`${i < petitionIndex ? "is-done" : ""} ${i === petitionIndex ? "is-now" : ""}`}
                    >
                      {i < petitionIndex ? <Check size={12} /> : <Icon size={12} />}
                    </span>
                  );
                })}
              </div>

              <div className="kingdom-hud__stats">
                {statDetails.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div className="kingdom-meter" key={s.id} title={s.label}>
                      <Icon size={13} />
                      <div className="kingdom-meter__track">
                        <motion.i
                          animate={{ width: `${Math.min(100, (stats[s.id] / MAX_STAT) * 100)}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <b>{stats[s.id]}</b>
                    </div>
                  );
                })}
              </div>
            </header>

            <Stage scene={petition.scene} outcome={outcome}>
              <AnimatePresence mode="wait">
                {!showResult && (
                  <motion.div
                    key={`bubble-${petitionIndex}`}
                    className="kingdom-bubble"
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    <div className="kingdom-bubble__avatar">
                      <Users size={18} />
                    </div>
                    <div>
                      <small>
                        {petition.number} · {petition.category}
                      </small>
                      <p>{petition.plea}</p>
                      <em>{petition.citizen}</em>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {showResult && chosen && (
                <div className="kingdom-gain">
                  {statDetails.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.span
                        key={s.id}
                        initial={{ opacity: 0, y: 30, scale: 0.6 }}
                        animate={{ opacity: [0, 1, 1, 0], y: -40, scale: 1 }}
                        transition={{ duration: 2.2, delay: 0.5 + i * 0.25 }}
                      >
                        <Icon size={14} /> +{chosen.impact[s.id]}
                      </motion.span>
                    );
                  })}
                </div>
              )}
            </Stage>

            <footer className="kingdom-dock">
              <AnimatePresence mode="wait" initial={false}>
                {!showResult ? (
                  <motion.div
                    key={`choose-${petitionIndex}`}
                    className="kingdom-dock__inner"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="kingdom-choices">
                      {petition.choices.map((choice) => {
                        const Icon = choice.icon;
                        const active = selectedChoice === choice.id;
                        return (
                          <button
                            type="button"
                            key={choice.id}
                            className={`kingdom-choice ${active ? "is-selected" : ""}`}
                            onClick={() => setSelectedChoice(choice.id)}
                          >
                            <span className="kingdom-choice__icon">
                              <Icon size={20} />
                            </span>
                            <span className="kingdom-choice__copy">
                              <strong>{choice.title}</strong>
                              <small>{choice.desc}</small>
                            </span>
                            <span className="kingdom-choice__tick">{active && <Check size={12} />}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="kingdom-seal"
                      disabled={!selectedChoice}
                      onClick={chooseDecision}
                    >
                      <Crown size={16} /> SEAL THE DECREE
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`result-${petitionIndex}`}
                    className="kingdom-dock__inner"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="kingdom-verdict">
                      <div className="kingdom-verdict__icon">
                        <Check size={20} />
                      </div>
                      <div>
                        <strong>{chosen?.title}</strong>
                        <p>{chosen?.verdict}</p>
                      </div>
                    </div>
                    <button type="button" className="kingdom-seal" disabled={!canNext} onClick={nextPetition}>
                      {petitionIndex === petitions.length - 1 ? "VIEW STEWARDSHIP" : "NEXT PETITION"}
                      <ArrowRight size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </footer>
          </motion.div>
        )}

        {/* ---------- END ---------- */}
        {started && isComplete && (
          <motion.section
            key="end"
            className="kingdom-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}
          >
            <div className="kingdom-intro__bg">
              {paduka}
              {imgFailed && <div className="kingdom-intro__fallback" />}
            </div>
            <div className="kingdom-veil kingdom-veil--deep" />
            <Motes count={20} />

            <motion.div
              className="kingdom-end__card"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className="kingdom-kicker">THE ASSEMBLY HAS CONCLUDED</span>
              <h2>Your Stewardship</h2>
              <p className="kingdom-end__rating">{rating}</p>

              <div className="kingdom-end__rings">
                {statDetails.map((s) => {
                  const Icon = s.icon;
                  const pct = Math.min(100, (stats[s.id] / MAX_STAT) * 100);
                  return (
                    <div key={s.id} className="kingdom-ring" style={{ "--p": pct }}>
                      <div className="kingdom-ring__dial">
                        <Icon size={15} />
                        <b>{stats[s.id]}</b>
                      </div>
                      <small>{s.label}</small>
                    </div>
                  );
                })}
              </div>

              <div className="kingdom-end__log">
                {history.map((h, i) => {
                  const Icon = h.icon;
                  return (
                    <span key={i}>
                      <Icon size={13} /> {h.choice}
                    </span>
                  );
                })}
              </div>

              <blockquote>"The kingdom is Rama's. Its people are our responsibility."</blockquote>

              <div className="kingdom-end__actions">
                <button type="button" className="kingdom-secondary" onClick={restart}>
                  <RotateCcw size={14} /> PLAY AGAIN
                </button>
                <button type="button" className="kingdom-seal" onClick={onComplete}>
                  RETURN TO THE CHRONICLE <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}