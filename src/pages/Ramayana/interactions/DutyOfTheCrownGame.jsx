import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Crown,
  Droplets,
  Eye,
  Flame as FlameIcon,
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
  Users,
  Volume2,
  VolumeX,
  Wheat,
  X,
} from "lucide-react";
import "./DutyOfTheCrownGame.css";

const THRONE_SRC = "/images/ramayana/interactions/ch22.jpg";

/* =========================================================
   STORY DATA
   ========================================================= */

const INTRO_LINES = [
  "The kingdom had welcomed its rightful king. Rama, the heir of the Ikshvaku dynasty, now sat upon the throne of Ayodhya. Beside him sat Sita, his queen.",
  "But the throne was not merely a symbol of power. It carried the responsibility of every person who lived under its protection.",
];

const COURT_LINES = [
  {
    who: "Rama",
    id: "rama",
    shot: "speech",
    text: "A kingdom is not measured by the splendour of its palace, nor by the wealth of its treasury. It is measured by how its people live.",
  },
  {
    who: "Rama",
    id: "rama",
    shot: "speech2",
    text: "Let no person's voice go unheard. Let justice reach those who have no power to demand it.",
  },
  {
    who: "",
    id: null,
    shot: "wide",
    text: "The court falls silent. Six matters wait at the gates of Ayodhya.",
  },
];

const FINAL_LINES = [
  "A crown may give a king authority. But it is his actions that give him the right to be remembered.",
  "The farmer who receives justice. The merchant who finds fairness. The village that receives water. The citizen whose voice is finally heard.",
  "These are the true measures of a kingdom.",
  "And this was the duty of the crown.",
];

const SITUATIONS = [
  {
    key: "farmer",
    numeral: "I",
    title: "The Farmer's Plea",
    place: "A village beyond the walls of Ayodhya",
    time: "Morning",
    bridge: "Rama turns to the court: “Let the farmer be heard first.”",
    icon: Wheat,
    lines: [
      {
        who: "",
        id: null,
        shot: "wide",
        text: "A season of poor rain has left the fields of Devapur brittle and brown. A farmer stands among his failed crop, and a village official waits with the record of dues.",
      },
      {
        who: "The Farmer",
        id: "farmer",
        shot: "farmer",
        text: "I ploughed before dawn and prayed after dusk, and the rains did not come. I do not refuse what I owe. Today, I have nothing to give.",
      },
      {
        who: "The Village Official",
        id: "official",
        shot: "official",
        text: "The dues were set before the season, and every household pays alike. If one is excused, what shall I tell the rest?",
      },
      {
        who: "",
        id: null,
        shot: "family",
        text: "His wife and two children wait at the door of their hut. The royal envoy turns to the court for counsel.",
      },
    ],
    prompt: "How shall the court answer him?",
    options: [
      {
        id: "waive",
        icon: Heart,
        title: "Forgive the dues entirely",
        desc: "No family should be crushed by a failed harvest.",
        result: [
          "The farmer's family weeps with relief. But at the edge of the field other villagers stand quietly, their own harvests thin too, and their dues already paid.",
        ],
        reflect: "Mercy given without measure can feel like injustice to those who bore the same hardship.",
      },
      {
        id: "defer",
        icon: Package,
        title: "Defer the dues and lend seed grain",
        desc: "Repay after the next harvest.",
        result: [
          "Sacks of seed grain arrive by cart. Within days the field is sown again, and the farmer's debt becomes a promise he can keep.",
        ],
        reflect: "Compassion that asks for responsibility gives a man a future, though a second failure would test it.",
      },
      {
        id: "assess",
        icon: Eye,
        title: "Send an officer to assess every household",
        desc: "Measure each loss, then relieve in proportion.",
        result: [
          "An officer walks the village with a measuring cord. Each field's loss is recorded and relief is set in proportion. It takes days, and the farmer's family waits hungry meanwhile.",
        ],
        reflect: "Fairness measured carefully is slower, but no household is favoured or forgotten.",
      },
    ],
  },
  {
    key: "market",
    numeral: "II",
    title: "The Merchant's Complaint",
    place: "The great market of Ayodhya",
    time: "Midday",
    bridge: "Rama turns to the court: “Trade lives on trust. Let us see who has broken it.”",
    icon: Scale,
    lines: [
      {
        who: "",
        id: null,
        shot: "wide",
        text: "In the heart of Ayodhya's market, trade has stopped. Two cloth merchants stand before the royal officer, each calling the other a cheat.",
      },
      {
        who: "Merchant Sudatta",
        id: "m1",
        shot: "m1",
        text: "My lord, Harshit sold short measure to my customers and now swears the fault is mine! Ask anyone. My cloth is honest.",
      },
      {
        who: "Merchant Harshit",
        id: "m2",
        shot: "m2",
        text: "His scales favour himself. Here are my accounts, every sale recorded. Honest men keep records.",
      },
      {
        who: "",
        id: null,
        shot: "official",
        text: "Customers press close. The royal official lifts the scales and weighs more than cloth. A hasty judgment may break honest trade in this market.",
      },
    ],
    prompt: "How shall the truth be found?",
    options: [
      {
        id: "scales",
        icon: Scale,
        title: "Test every scale before the crowd",
        desc: "Let the royal standard weights decide.",
        result: [
          "A royal weight is set upon the beam. Sudatta's scale tilts false, a hollow stone hidden beneath its pan. The crowd murmurs, and Harshit lets out a long breath.",
        ],
        reflect: "Evidence shown openly protects the honest, and warns every shopkeeper who is watching.",
      },
      {
        id: "audit",
        icon: ScrollText,
        title: "Let the guild elders audit both ledgers",
        desc: "Compare the records over several days.",
        result: [
          "The guild elders sit with both ledgers for three days. They find careless errors in each, and one deliberate lie. Both merchants must correct their trade; neither is ruined.",
        ],
        reflect: "Patience finds truth that haste would miss, but customers wait uncertain in the meantime.",
      },
      {
        id: "fine",
        icon: Hammer,
        title: "Fine both and close the matter",
        desc: "End the quarrel quickly.",
        result: [
          "Two small fines end the quarrel by sunset. But Harshit, who cheated no one, walks away bitter, and the crowd learns that honesty and fraud are paid alike.",
        ],
        reflect: "A quick ending is not always a just one.",
      },
    ],
  },
  {
    key: "water",
    numeral: "III",
    title: "The Village's Water",
    place: "The river between Kesarpur and Madhuvan",
    time: "Afternoon",
    bridge: "Rama turns to the court: “A river belongs to all who drink from it.”",
    icon: Droplets,
    lines: [
      {
        who: "",
        id: null,
        shot: "wide",
        text: "Two villages drink from one river. Kesarpur's fields have cracked and gone pale, while across the water Madhuvan's channels run clear.",
      },
      {
        who: "Elder of Kesarpur",
        id: "eA",
        shot: "left",
        text: "Their channel is wider than ours! They take the best of the river, and our children watch the wheat die.",
      },
      {
        who: "Elder of Madhuvan",
        id: "eB",
        shot: "right",
        text: "We dug that channel with our own hands and we keep it in repair. Are we to lose it because the river was kind to us?",
      },
      {
        who: "",
        id: null,
        shot: "gate",
        text: "Both are right in part. The royal engineer studies the stone sluice. The river cannot carry both villages' wishes.",
      },
    ],
    prompt: "How shall the river be shared?",
    options: [
      {
        id: "equal",
        icon: Scale,
        title: "Divide the water in equal halves",
        desc: "The same share for both villages.",
        result: [
          "The sluice is set at the midpoint and both channels carry the same flow. Madhuvan's fields grow a little thin; Kesarpur's still thirst. Each village grumbles that its half is not enough.",
        ],
        reflect: "Equal shares are easy to defend, but equal is not always what a field needs.",
      },
      {
        id: "need",
        icon: Heart,
        title: "Water the driest fields first",
        desc: "Kesarpur drinks first; Madhuvan waits.",
        result: [
          "The gate is opened wide toward Kesarpur and green returns to its fields within days. In Madhuvan, farmers watch their own channel thin and ask when they will be remembered.",
        ],
        reflect: "Meeting the greater need heals one village and risks wounding the other.",
      },
      {
        id: "council",
        icon: Users,
        title: "Seat a joint council at a stone sluice",
        desc: "Elders of both villages share the gate, with a rotation.",
        result: [
          "Elders of both villages are seated at the sluice. A schedule is cut into stone: each channel flows in its turn. It takes effort and trust, but by the next moon both fields are green.",
        ],
        reflect: "Justice that includes those it governs lasts longer than any single order.",
      },
    ],
  },
  {
    key: "corridor",
    numeral: "IV",
    title: "The Unheard Citizen",
    place: "The entrance to the royal court",
    time: "Late afternoon",
    bridge: "Rama turns to the court: “Open the doors. No one shall wait outside them.”",
    icon: Landmark,
    lines: [
      {
        who: "",
        id: null,
        shot: "wide",
        text: "In the stone corridor before the royal court, a poor man has waited since dawn. A complaint filed five times has never reached the king's ears.",
      },
      {
        who: "The Herald",
        id: "herald",
        shot: "herald",
        text: "A petitioner! Mahadev the potter claims the revenue officer has set aside his plea five times!",
      },
      {
        who: "Mahadev the Potter",
        id: "citizen",
        shot: "citizen",
        text: "My lord, my kiln was seized for a debt I had already paid. I carry the receipt. No one will look at it.",
      },
      {
        who: "The Revenue Officer",
        id: "official",
        shot: "official",
        text: "A potter's grievances are many, and the court's hours are few. My office keeps proper order, my lord.",
      },
      {
        who: "",
        id: null,
        shot: "rama",
        text: "Rama steps down from the dais. He listens to the potter as he would listen to a prince.",
      },
    ],
    prompt: "How shall the court look into it?",
    options: [
      {
        id: "open",
        icon: Megaphone,
        title: "Summon the officer to answer before the court",
        desc: "Potter and officer stand face to face, in public.",
        result: [
          "The officer is made to stand before the court, and the receipt is read aloud. The kiln is returned; the potter is thanked for his patience, and the officer is reproved before all.",
        ],
        reflect: "A public hearing restores one man's voice, and tells every citizen the doors are open.",
      },
      {
        id: "inquiry",
        icon: Search,
        title: "Send an impartial inquirer",
        desc: "Examine the officer's records without warning.",
        result: [
          "A quiet inquirer opens the revenue ledgers. Seven other complaints are found buried beneath the potter's. It takes weeks, but the matter is cleaned from the root.",
        ],
        reflect: "Slower, quieter justice can reach what a single hearing would miss.",
      },
      {
        id: "quiet",
        icon: Gift,
        title: "Compensate the potter and close the matter",
        desc: "Spare the officer public embarrassment.",
        result: [
          "The potter receives coins and a bow. The officer smiles. The kiln is returned, but nothing changes in the revenue office, and the next poor man waits at the same door.",
        ],
        reflect: "Relief without accountability mends a case but leaves the cause.",
      },
    ],
  },
  {
    key: "home",
    numeral: "V",
    title: "The Family in Need",
    place: "A modest home in the weavers' lane",
    time: "Dusk",
    bridge: "Rama turns to the court: “Help must not cost a family its dignity.”",
    icon: Heart,
    lines: [
      {
        who: "",
        id: null,
        shot: "wide",
        text: "At dusk, a lamp is lit in a small courtyard. The weaver Keshav lost his workshop to a fire in spring, and since then his family has eaten what neighbours could spare.",
      },
      {
        who: "Keshav the Weaver",
        id: "parent",
        shot: "parent",
        text: "We do not ask for charity. I have two hands and thirty years of skill. I only need the chance to use them again.",
      },
      {
        who: "The Neighbour",
        id: "neighbor",
        shot: "neighbor",
        text: "I bring what I can, a little rice and a little oil. It is not enough, but I cannot watch them go hungry.",
      },
      {
        who: "",
        id: null,
        shot: "gate",
        text: "A royal representative enters the gate. His task is to understand what help will truly serve this family.",
      },
    ],
    prompt: "What help shall the kingdom give?",
    options: [
      {
        id: "gift",
        icon: Gift,
        title: "Send grain and coin at once",
        desc: "Immediate relief for the household.",
        result: [
          "Sacks are set at the door and the children eat well tonight. Keshav accepts with lowered eyes, grateful and quietly ashamed, knowing the grain will not last past the season.",
        ],
        reflect: "Relief answers hunger, but can leave a skilled man's pride unmended.",
      },
      {
        id: "work",
        icon: Hammer,
        title: "Offer work, tools and a small advance",
        desc: "Return him to his craft with the king's trust.",
        result: [
          "A loom is carried into the courtyard with a month's advance. Keshav's hands remember their skill. By the season's end he weaves cloth for the palace stores, and his family walks with their heads high.",
        ],
        reflect: "Help that restores a livelihood restores dignity with it, though it asks more of the king's officers.",
      },
      {
        id: "council",
        icon: Users,
        title: "Ask the lane to share the burden",
        desc: "Neighbours together, with a royal grant.",
        result: [
          "The lane's elders gather. Each household offers a little, and the king's grant fills the rest. The family is held by many hands, though it takes time and the grant must be watched.",
        ],
        reflect: "A community that carries its own is stronger than one that waits on the throne.",
      },
    ],
  },
  {
    key: "council",
    numeral: "VI",
    title: "The Minister's Advice",
    place: "Rama's private council chamber",
    time: "Night",
    bridge: "Rama turns to the court: “Now, let the council speak plainly.”",
    icon: Crown,
    lines: [
      {
        who: "",
        id: null,
        shot: "wide",
        text: "Night. In the private chamber, oil lamps burn low over the council table. The treasury has thinned after years of exile and war, and a minister has a plan.",
      },
      {
        who: "Minister Vijaya",
        id: "minister",
        shot: "minister",
        text: "Majesty, a levy of one part in ten more on every household's grain will fill the treasury within two seasons. The kingdom would be safe from any famine, and from any enemy.",
      },
      {
        who: "Minister Dharmapala",
        id: "min2",
        shot: "wide",
        text: "The reasoning is sound, Majesty. A full treasury protects everyone.",
      },
      {
        who: "",
        id: null,
        shot: "close",
        text: "The proposal is written in clean script: one part in ten, from every household alike. The farmer of Devapur is among them.",
      },
      {
        who: "Rama",
        id: "rama",
        shot: "rama",
        text: "Remember the farmer, the merchant, the village, the potter, the weaver. Whatever we decide here, they will carry it.",
      },
    ],
    prompt: "How shall the king answer his minister?",
    options: [
      {
        id: "reject",
        icon: Shield,
        title: "Refuse the levy; seek savings within the palace",
        desc: "The court tightens its own belt first.",
        result: [
          "The scroll is set aside. The palace trims its own feasts and works, and the treasury grows slowly. Ministers grumble: if famine comes, the kingdom will be thinner than it might have been.",
        ],
        reflect: "Protecting the people today carries its own risk tomorrow.",
      },
      {
        id: "tiered",
        icon: Scale,
        title: "Tax luxury trade and exempt the poor",
        desc: "Those who prosper more carry more.",
        result: [
          "The levy is rewritten: grain traders and silk merchants pay more, and households below a threshold pay nothing. The treasury fills at half the speed, but no hearth goes cold for it.",
        ],
        reflect: "A burden shared by capacity is harder to write, and easier to bear.",
      },
      {
        id: "trial",
        icon: Search,
        title: "Test the levy in one prosperous district first",
        desc: "Observe, listen, then decide.",
        result: [
          "A rich district bears the levy for one season. The reports return honestly: merchants complain, but trade holds. The minister's plan is neither adopted nor dismissed. It is only tested.",
        ],
        reflect: "Caution costs time, and time is the price of not being wrong.",
      },
    ],
  },
];

/* =========================================================
   SMALL HELPERS
   ========================================================= */

const ease = (t) => t * t * (3 - 2 * t);
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const seeded = (seed) => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};
const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];

// Text now appears all at once. The old per-character timer re-rendered the whole game (including the 3D scene) ~45 times a second.
function useTypewriter(text) {
  return { shown: text || "", done: true, skip: () => {} };
}

function useCanvasTexture(draw, w = 512, h = 512, repeat) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repeat) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* gentle ambience: tanpura-like drone + temple bell, only after a user gesture */
function useAmbience(enabled) {
  const ref = useRef(null);
  useEffect(() => {
    if (!enabled) return undefined;
    let ctx;
    let nodes = [];
    let bell;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return undefined;
      ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 700;
      lp.connect(master);
      master.connect(ctx.destination);
      [[98, 0.05], [147, 0.032], [196.6, 0.022], [49, 0.05]].forEach(([f, g], i) => {
        const o = ctx.createOscillator();
        const gn = ctx.createGain();
        o.type = i === 3 ? "sine" : "triangle";
        o.frequency.value = f;
        gn.gain.value = g;
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.frequency.value = 0.07 + i * 0.03;
        lg.gain.value = g * 0.5;
        lfo.connect(lg);
        lg.connect(gn.gain);
        o.connect(gn);
        gn.connect(lp);
        o.start();
        lfo.start();
        nodes.push(o, lfo);
      });
      const ring = () => {
        if (!ctx || ctx.state === "closed") return;
        const t = ctx.currentTime;
        const f = [392, 523.25, 587.33, 784][Math.floor(Math.random() * 4)];
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.035, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + 4.6);
      };
      bell = setInterval(ring, 7000);
      ref.current = { ctx, master, ring };
    } catch (e) {
      /* audio is optional */
    }
    return () => {
      clearInterval(bell);
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch (e) {
          /* noop */
        }
      });
      try {
        ctx && ctx.close();
      } catch (e) {
        /* noop */
      }
      ref.current = null;
    };
  }, [enabled]);
  return useCallback(() => {
    if (ref.current) ref.current.ring();
  }, []);
}

/* =========================================================
   3D TOOLKIT  (real Three.js via react-three-fiber)
   World units are metres. Characters face +z by default.
   ========================================================= */

const Box = ({ p = [0, 0, 0], s = [1, 1, 1], c = "#999", r = 0.85, rg, m = 0, e, ei = 1, rot, map, cast = true, recv = true, op, children, ...rest }) => (
  <mesh position={p} rotation={rot} castShadow={cast} receiveShadow={recv} {...rest}>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={rg != null ? rg : r} metalness={m} emissive={e || "#000000"} emissiveIntensity={e ? ei : 0} map={map} transparent={op != null} opacity={op == null ? 1 : op} />
    {children}
  </mesh>
);

const Cyl = ({ p = [0, 0, 0], r = [0.5, 0.5], h = 1, seg = 20, c = "#999", rg = 0.8, m = 0, e, ei = 1, rot, cast = true, recv = true, map, op, open, children, ...rest }) => (
  <mesh position={p} rotation={rot} castShadow={cast} receiveShadow={recv} {...rest}>
    <cylinderGeometry args={[r[0], r[1], h, seg, 1, !!open]} />
    <meshStandardMaterial color={c} roughness={rg} metalness={m} emissive={e || "#000000"} emissiveIntensity={e ? ei : 0} map={map} side={open ? THREE.DoubleSide : THREE.FrontSide} transparent={op != null} opacity={op == null ? 1 : op} />
    {children}
  </mesh>
);

const Sph = ({ p = [0, 0, 0], r = 0.5, sc = [1, 1, 1], c = "#999", rg = 0.8, m = 0, e, ei = 1, cast = true, recv = false, seg = 22, op, children, ...rest }) => (
  <mesh position={p} scale={sc} castShadow={cast} receiveShadow={recv} {...rest}>
    <sphereGeometry args={[r, seg, Math.max(10, seg - 6)]} />
    <meshStandardMaterial color={c} roughness={rg} metalness={m} emissive={e || "#000000"} emissiveIntensity={e ? ei : 0} transparent={op != null} opacity={op == null ? 1 : op} />
    {children}
  </mesh>
);

const Tor = ({ p = [0, 0, 0], a = [0.5, 0.05], c = "#d4a84a", rot, m = 0.7, rg = 0.35, arc = Math.PI * 2, e, ei = 1, cast = true, ...rest }) => (
  <mesh position={p} rotation={rot} castShadow={cast} {...rest}>
    <torusGeometry args={[a[0], a[1], 8, 28, arc]} />
    <meshStandardMaterial color={c} roughness={rg} metalness={m} emissive={e || "#000000"} emissiveIntensity={e ? ei : 0} />
  </mesh>
);

const GOLD = "#d8b04e";
const GOLD_DEEP = "#a8782c";

/* ----- procedural textures ----- */
const TX = {
  tile(ctx, w, h) {
    ctx.fillStyle = "#c9a874";
    ctx.fillRect(0, 0, w, h);
    const r = seeded(7);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(${90 + r() * 60},${60 + r() * 40},${30 + r() * 30},${0.05 + r() * 0.07})`;
      ctx.fillRect(r() * w, r() * h, 2 + r() * 9, 2 + r() * 9);
    }
    ctx.strokeStyle = "#8c6a3b";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.strokeStyle = "rgba(168,120,44,.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 40);
    ctx.lineTo(w - 40, h / 2);
    ctx.lineTo(w / 2, h - 40);
    ctx.lineTo(40, h / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 54, 0, 7);
    ctx.stroke();
  },
  carpet(ctx, w, h) {
    ctx.fillStyle = "#6e1620";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#d8b04e";
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 0, w - 28, h);
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 0, w - 72, h);
    ctx.fillStyle = "#d8b04e";
    for (let y = 40; y < h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(w / 2, y - 26);
      ctx.lineTo(w / 2 + 26, y);
      ctx.lineTo(w / 2, y + 26);
      ctx.lineTo(w / 2 - 26, y);
      ctx.closePath();
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#e8cf86";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, y, 11, 0, 7);
      ctx.stroke();
    }
  },
  dirt(ctx, w, h) {
    ctx.fillStyle = "#8a6a43";
    ctx.fillRect(0, 0, w, h);
    const r = seeded(11);
    for (let i = 0; i < 4500; i++) {
      const l = 40 + r() * 50;
      ctx.fillStyle = `hsla(${24 + r() * 14},${30 + r() * 20}%,${l * 0.7}%,${0.1 + r() * 0.15})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 7, 1 + r() * 5);
    }
  },
  grass(ctx, w, h) {
    ctx.fillStyle = "#6f8f3e";
    ctx.fillRect(0, 0, w, h);
    const r = seeded(21);
    for (let i = 0; i < 5200; i++) {
      ctx.fillStyle = `hsla(${70 + r() * 40},${35 + r() * 30}%,${28 + r() * 22}%,${0.12 + r() * 0.18})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 2 + r() * 9);
    }
  },
  cobble(ctx, w, h) {
    ctx.fillStyle = "#7d6a52";
    ctx.fillRect(0, 0, w, h);
    const r = seeded(5);
    for (let y = 0; y < h; y += 42) {
      for (let x = (y / 42) % 2 ? -30 : 0; x < w; x += 60) {
        ctx.fillStyle = `hsl(${30 + r() * 10},${14 + r() * 12}%,${40 + r() * 20}%)`;
        ctx.fillRect(x + 2, y + 2, 56, 38);
      }
    }
  },
  water(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#2d7e8c");
    g.addColorStop(1, "#4aa1ae");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = seeded(3);
    ctx.lineWidth = 3;
    for (let i = 0; i < 46; i++) {
      const x = r() * w;
      const y = r() * h;
      ctx.strokeStyle = `rgba(230,250,250,${0.18 + r() * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 24, y + 12, x + 50, y - 12, x + 80, y);
      ctx.stroke();
    }
  },
  wood(ctx, w, h) {
    ctx.fillStyle = "#6b4527";
    ctx.fillRect(0, 0, w, h);
    const r = seeded(9);
    for (let i = 0; i < 90; i++) {
      ctx.strokeStyle = `rgba(${30 + r() * 30},${16 + r() * 16},8,${0.12 + r() * 0.2})`;
      ctx.lineWidth = 1 + r() * 3;
      const y = r() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + r() * 14 - 7, w * 0.6, y + r() * 14 - 7, w, y);
      ctx.stroke();
    }
  },
  map(ctx, w, h) {
    ctx.fillStyle = "#dcc79a";
    ctx.fillRect(0, 0, w, h);
    const r = seeded(31);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(140,100,50,${r() * 0.07})`;
      ctx.fillRect(r() * w, r() * h, 6 + r() * 20, 6 + r() * 20);
    }
    ctx.strokeStyle = "#6e4a24";
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.strokeStyle = "#2f6b86";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.2);
    ctx.bezierCurveTo(w * 0.4, h * 0.1, w * 0.3, h * 0.6, w * 0.62, h * 0.55);
    ctx.bezierCurveTo(w * 0.8, h * 0.5, w * 0.8, h * 0.8, w * 0.92, h * 0.9);
    ctx.stroke();
    ctx.strokeStyle = "#7a5a30";
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const x = 40 + r() * (w - 80);
      const y = 40 + r() * (h - 80);
      ctx.beginPath();
      ctx.moveTo(x - 14, y + 8);
      ctx.lineTo(x, y - 12);
      ctx.lineTo(x + 14, y + 8);
      ctx.stroke();
    }
    ctx.fillStyle = "#8f2a1f";
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.55, 10, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#8f2a1f";
    ctx.setLineDash([8, 7]);
    ctx.beginPath();
    ctx.moveTo(w * 0.62, h * 0.55);
    ctx.lineTo(w * 0.2, h * 0.8);
    ctx.stroke();
  },
  doc(ctx, w, h) {
    ctx.fillStyle = "#ead9ac";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#a8782c";
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = "#3b2412";
    ctx.font = "bold 30px serif";
    ctx.textAlign = "center";
    ctx.fillText("राजकोष प्रस्ताव", w / 2, 62);
    ctx.fillStyle = "rgba(59,36,18,.8)";
    const r = seeded(2);
    for (let y = 100; y < h - 120; y += 22) {
      const len = 0.55 + r() * 0.38;
      ctx.fillRect(40, y, (w - 80) * len, 3.2);
    }
    ctx.fillStyle = "#7d1c1c";
    ctx.font = "bold 24px serif";
    ctx.fillText("दशमांश  ×  प्रत्येक गृह", w / 2, h - 80);
    ctx.fillStyle = "#8f2a1f";
    ctx.beginPath();
    ctx.arc(w - 74, h - 62, 24, 0, 7);
    ctx.fill();
  },
  sun(ctx, w, h) {
    ctx.fillStyle = "#6e1620";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#d8b04e";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.translate(w / 2, h * 0.42);
    ctx.fillStyle = "#f0c860";
    for (let i = 0; i < 16; i++) {
      ctx.rotate(Math.PI / 8);
      ctx.beginPath();
      ctx.moveTo(-9, -90);
      ctx.lineTo(0, -150);
      ctx.lineTo(9, -90);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 76, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#c27a1d";
    ctx.beginPath();
    ctx.arc(0, 0, 54, 0, 7);
    ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  },
  city(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0d1330");
    g.addColorStop(0.7, "#3a2a4a");
    g.addColorStop(1, "#7a4a3a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f6efd2";
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.2, 26, 0, 7);
    ctx.fill();
    const r = seeded(17);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${r() * 0.7})`;
      ctx.fillRect(r() * w, r() * h * 0.5, 2, 2);
    }
    for (let x = 0; x < w; x += 34) {
      const bh = 60 + r() * 140;
      ctx.fillStyle = "#1a1220";
      ctx.fillRect(x, h - bh, 32, bh);
      ctx.fillRect(x + 8, h - bh - 18, 16, 18);
      for (let k = 0; k < 14; k++) {
        if (r() > 0.45) {
          ctx.fillStyle = r() > 0.5 ? "#ffcf6a" : "#ff9f45";
          ctx.fillRect(x + 4 + (k % 3) * 9, h - bh + 8 + Math.floor(k / 3) * 22, 5, 8);
        }
      }
    }
  },
  sprite(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
};

const useTex = (name, w, h, rep) => useCanvasTexture(TX[name], w, h, rep);

const rgbV = (hex) => {
  const c = hex.replace("#", "");
  return new THREE.Vector3(parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255);
};

/* ----- sky, light and atmosphere ----- */
function SkyDome({ top, mid, bot }) {
  const ref = useRef();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: rgbV(top) }, mid: { value: rgbV(mid) }, bot: { value: rgbV(bot) } },
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader:
          "uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.55)) : mix(mid, bot, pow(-h, 0.45)); gl_FragColor = vec4(c, 1.0); }",
      }),
    [top, mid, bot]
  );
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position);
  });
  return (
    <mesh ref={ref} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[120, 24, 16]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function Env({ sky, fog, amb = ["#ffffff", 0.4], hemi = ["#ffffff", "#665544", 0.5], sun, shadowSize = 22, shadowOn = true }) {
  return (
    <>
      <color attach="background" args={[fog[0]]} />
      <fog attach="fog" args={fog} />
      {sky && <SkyDome top={sky[0]} mid={sky[1]} bot={sky[2]} />}
      <ambientLight color={amb[0]} intensity={amb[1]} />
      <hemisphereLight args={[hemi[0], hemi[1], hemi[2]]} />
      {sun && (
        <directionalLight
          position={sun.pos}
          color={sun.color}
          intensity={sun.int}
          castShadow={shadowOn}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-camera-near={1}
          shadow-camera-far={90}
          shadow-camera-left={-shadowSize}
          shadow-camera-right={shadowSize}
          shadow-camera-top={shadowSize}
          shadow-camera-bottom={-shadowSize}
        />
      )}
    </>
  );
}

function Flame({ p = [0, 0, 0], size = 0.06, color = "#ffb347", intensity = 1.2, dist = 9, light = true, ph = 0 }) {
  const L = useRef();
  const M = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 9 + ph;
    const f = 0.82 + Math.sin(t) * 0.1 + Math.sin(t * 2.3 + 1) * 0.07;
    if (L.current) L.current.intensity = intensity * f;
    if (M.current) M.current.scale.set(1 - (f - 0.8) * 0.3, f * 1.5, 1 - (f - 0.8) * 0.3);
  });
  return (
    <group position={p}>
      <mesh ref={M}>
        <sphereGeometry args={[size, 10, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {light && <pointLight ref={L} color={color} intensity={intensity} distance={dist} decay={1.6} />}
    </group>
  );
}

/* drifting petals / dust / fireflies */
function Floaters({ count = 60, area = [10, 6, 10], pos = [0, 3, 0], color = "#ffb0c8", size = 0.12, fall = 0.25, drift = 0.3, opacity = 0.85 }) {
  const sprite = useTex("sprite", 64, 64);
  const ref = useRef();
  const data = useMemo(() => {
    const r = seeded(count * 7 + Math.floor(area[0]));
    const pArr = new Float32Array(count * 3);
    const ph = [];
    for (let i = 0; i < count; i++) {
      pArr[i * 3] = (r() - 0.5) * area[0];
      pArr[i * 3 + 1] = (r() - 0.5) * area[1];
      pArr[i * 3 + 2] = (r() - 0.5) * area[2];
      ph.push(r() * 6.28);
    }
    return { pArr, ph, live: pArr.slice() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    const a = g.geometry.attributes.position;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = a.getY(i) - fall * dt;
      if (y < -area[1] / 2) y += area[1];
      if (y > area[1] / 2) y -= area[1];
      a.setY(i, y);
      a.setX(i, data.pArr[i * 3] + Math.sin(t * 0.6 + data.ph[i]) * drift);
      a.setZ(i, data.pArr[i * 3 + 2] + Math.cos(t * 0.5 + data.ph[i]) * drift);
    }
    a.needsUpdate = true;
  });
  return (
    <points ref={ref} position={pos} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.live, 3]} />
      </bufferGeometry>
      <pointsMaterial map={sprite} color={color} size={size} sizeAttenuation transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function LightShaft({ p, rot = [0, 0, 0], w = 1.6, h = 12, op = 0.1, color = "#ffe2a0" }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = op * (0.8 + Math.sin(clock.elapsedTime * 0.5 + p[0]) * 0.2);
  });
  return (
    <mesh ref={ref} position={p} rotation={rot}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={color} transparent opacity={op} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog={false} />
    </mesh>
  );
}

function Sway({ p = [0, 0, 0], amp = 0.05, speed = 1, ph = 0, axis = "z", children }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation[axis] = Math.sin(clock.elapsedTime * speed + ph) * amp;
  });
  return (
    <group ref={ref} position={p}>
      {children}
    </group>
  );
}

/* ----- camera director ----- */
function Rig({ shot, scene }) {
  const { camera, pointer } = useThree();
  const S = useRef({ id: null, t0: 0, look: new THREE.Vector3(0, 1.5, 0), scene: null });
  const tp = useMemo(() => new THREE.Vector3(), []);
  const tl = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }, dt) => {
    const s = S.current;
    const id = `${scene}:${shot.id}`;
    let snap = false;
    if (s.scene !== scene) {
      s.scene = scene;
      snap = true;
    }
    if (s.id !== id) {
      s.id = id;
      s.t0 = clock.elapsedTime;
    }
    const el = clock.elapsedTime - s.t0;
    const p = ease(Math.min(1, el / (shot.dur || 14)));
    const pos = lerp3(shot.from, shot.to || shot.from, p);
    const look = lerp3(shot.look, shot.lookTo || shot.look, p);
    tp.set(pos[0] + pointer.x * 0.45, pos[1] + pointer.y * 0.22 + Math.sin(el * 0.45) * 0.05, pos[2]);
    tl.set(look[0], look[1], look[2]);
    const k = snap ? 1 : 1 - Math.exp(-dt * 1.9);
    camera.position.lerp(tp, k);
    s.look.lerp(tl, k);
    camera.lookAt(s.look);
    const fov = shot.fov || 42;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 2.2);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/* =========================================================
   HUMAN FIGURES — jointed, animated, with facial expression
   ========================================================= */

const MOODS = {
  neutral: { b: 0, y: 0, m: 0.12, h: 0 },
  happy: { b: -0.1, y: 0.012, m: 1, h: -0.04 },
  sad: { b: -0.36, y: 0, m: -1, h: 0.22 },
  stern: { b: 0.4, y: -0.006, m: -0.3, h: 0.03 },
  worried: { b: -0.3, y: 0.006, m: -0.6, h: 0.1 },
  smug: { b: 0.15, y: 0, m: 0.6, h: -0.06 },
};
const SIT_DROP = 0.75;

function poseTargets(pose, tt, talking, hold) {
  const o = { fl: 0.05, al: 0.1, el: -0.15, fr: 0.05, ar: 0.1, er: -0.15, pitch: 0, hop: 0 };
  const both = (f, a, e) => {
    o.fl = o.fr = f;
    o.al = o.ar = a;
    o.el = o.er = e;
  };
  switch (pose) {
    case "namaste":
      both(-0.55, -0.5, -1.55);
      break;
    case "plead":
      both(-0.7 + Math.sin(tt * 1.4) * 0.05, 0.14, -1.3);
      break;
    case "hold":
      both(-0.55, -0.1, -1.15);
      break;
    case "carry":
      both(-0.8, -0.15, -1.0);
      break;
    case "fold":
      both(-0.5, -0.7, -2.0);
      break;
    case "point":
      o.fr = -1.35;
      o.ar = 0.22;
      o.er = -0.15;
      break;
    case "sit":
      both(-0.35, 0.35, -0.9);
      break;
    case "bow":
      both(-0.55, -0.5, -1.55);
      o.pitch = 0.55;
      break;
    case "bend":
      both(-0.4, 0.15, -0.3);
      o.pitch = 0.95;
      break;
    case "cheer":
      both(-2.6 + Math.sin(tt * 6) * 0.15, 0.45, -0.2);
      o.hop = Math.abs(Math.sin(tt * 5)) * 0.1;
      break;
    case "fan":
      o.fr = -0.9;
      o.er = -0.9 + Math.sin(tt * 3) * 0.35;
      break;
    case "guard":
      o.fr = -0.15;
      o.ar = 0.05;
      o.er = -0.25;
      break;
    default:
      break;
  }
  if (talking && !hold && !["namaste", "bow", "cheer", "bend", "fold"].includes(pose)) {
    o.fr = -0.62 + Math.sin(tt * 2.3) * 0.18;
    o.ar = 0.28;
    o.er = -1.05 + Math.sin(tt * 3.1) * 0.25;
    o.fl = -0.25;
    o.al = 0.14;
    o.el = -0.55 + Math.sin(tt * 2.6 + 1) * 0.1;
  }
  return o;
}

function HeldItem({ kind }) {
  switch (kind) {
    case "scroll":
      return (
        <group position={[0, -0.3, 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <Cyl r={[0.03, 0.03]} h={0.3} c="#efe0b6" rg={0.9} />
          <Cyl p={[0, 0.15, 0]} r={[0.034, 0.034]} h={0.025} c="#8f2a1f" />
          <Cyl p={[0, -0.15, 0]} r={[0.034, 0.034]} h={0.025} c="#8f2a1f" />
        </group>
      );
    case "ledger":
      return <Box p={[0, -0.3, 0.07]} s={[0.22, 0.3, 0.04]} c="#5a3a20" r={0.8} rot={[0.2, 0, 0]} />;
    case "staff":
      return (
        <group position={[0, -0.28, 0.02]}>
          <Cyl p={[0, -0.1, 0]} r={[0.017, 0.017]} h={1.5} c={GOLD_DEEP} m={0.6} rg={0.4} />
          <Sph p={[0, 0.66, 0]} r={0.05} c={GOLD} m={0.8} rg={0.3} />
        </group>
      );
    case "spear":
      return (
        <group position={[0, -0.28, 0.02]}>
          <Cyl p={[0, 0.2, 0]} r={[0.016, 0.016]} h={1.9} c="#5b3a1f" />
          <Cyl p={[0, 1.2, 0]} r={[0, 0.045]} h={0.25} c="#c9ced1" m={0.9} rg={0.25} />
        </group>
      );
    case "bowl":
      return (
        <group position={[0, -0.3, 0.09]}>
          <Cyl r={[0.1, 0.06]} h={0.07} c="#9b5a32" rg={0.7} />
          <Cyl p={[0, 0.03, 0]} r={[0.09, 0.09]} h={0.02} c="#f1e6c8" />
        </group>
      );
    case "fan":
      return (
        <group position={[0, -0.28, 0.02]} rotation={[0.5, 0, 0]}>
          <Cyl p={[0, 0.2, 0]} r={[0.012, 0.012]} h={0.6} c={GOLD_DEEP} m={0.6} />
          <Sph p={[0, 0.62, 0]} r={0.12} sc={[0.8, 1.3, 0.8]} c="#f4f0e4" rg={1} />
        </group>
      );
    case "purse":
      return <Sph p={[0, -0.32, 0.04]} r={0.07} sc={[1, 1.1, 0.9]} c="#7d1c1c" rg={0.9} />;
    case "paper":
      return <Box p={[0, -0.3, 0.05]} s={[0.17, 0.22, 0.01]} c="#efe0b6" rg={1} rot={[0.3, 0, 0.05]} />;
    default:
      return null;
  }
}

function Person({
  p = [0, 0, 0],
  ry = 0,
  s = 1,
  skin = "#b88a62",
  cloth = "#e9dfc6",
  top,
  hair = "#1b120b",
  turban,
  crown,
  female,
  jewel,
  beard,
  sash,
  veil,
  halo,
  pose = "idle",
  mood = "neutral",
  talking = false,
  hold,
  hy = 0,
  sit = false,
  goTo,
  patrol,
  speed = 1.1,
  phase = 0,
  hip = 0.095,
  lite = false,
}) {
  const root = useRef();
  const R = useRef({});
  const st = useRef({ x: p[0], z: p[2], i: 0, yaw: ry, tyaw: ry, hy: 0, m: 0, b: 0, y: 0, h: 0, lax: 0.05, laz: 0.1, lel: -0.15, rax: 0.05, raz: 0.1, rel: -0.15, pitch: 0, hop: 0, open: 0 });
  const ref = (k) => (n) => {
    R.current[k] = n;
  };

  useEffect(() => {
    if (lite && root.current) root.current.traverse((o) => { o.castShadow = false; });
  }, [lite]);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const S = st.current;
    const r = R.current;
    const tt = state.clock.elapsedTime + phase;
    const kk = (v) => 1 - Math.exp(-dt * v);

    let walking = false;
    const tgt = goTo || (patrol ? patrol[S.i % patrol.length] : null);
    if (tgt) {
      const dx = tgt[0] - S.x;
      const dz = tgt[1] - S.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.07) {
        const step = Math.min(d, speed * dt);
        S.x += (dx / d) * step;
        S.z += (dz / d) * step;
        S.tyaw = Math.atan2(dx, dz);
        walking = true;
      } else if (patrol && !goTo) {
        S.i = (S.i + 1) % patrol.length;
      }
    }
    const targetYaw = walking ? S.tyaw : ry;
    const dy = Math.atan2(Math.sin(targetYaw - S.yaw), Math.cos(targetYaw - S.yaw));
    S.yaw += dy * kk(7);
    g.position.set(S.x, p[1], S.z);
    g.rotation.y = S.yaw;

    const o = poseTargets(walking ? "idle" : pose, tt, talking && !walking, hold);
    const swing = walking ? Math.sin(tt * speed * 5.2) : 0;
    const k = kk(7);
    S.lax += (o.fl + (walking ? -swing * 0.5 : 0) - S.lax) * k;
    S.rax += (o.fr + (walking ? swing * 0.5 : 0) - S.rax) * k;
    S.laz += (o.al - S.laz) * k;
    S.raz += (o.ar - S.raz) * k;
    S.lel += (o.el - S.lel) * k;
    S.rel += (o.er - S.rel) * k;
    S.pitch += (o.pitch - S.pitch) * kk(5);
    S.hop += (o.hop - S.hop) * kk(14);
    if (r.sL) r.sL.rotation.set(S.lax, 0, S.laz);
    if (r.sR) r.sR.rotation.set(S.rax, 0, -S.raz);
    if (r.eL) r.eL.rotation.x = S.lel;
    if (r.eR) r.eR.rotation.x = S.rel;

    const breathe = Math.sin(tt * 1.6) * 0.006;
    if (r.body) {
      r.body.position.y = (sit ? 0.95 - SIT_DROP : 0.95) + breathe + S.hop + (walking ? Math.abs(Math.sin(tt * speed * 5.2)) * 0.025 : 0);
      r.body.rotation.x = S.pitch;
    }
    if (r.hipL && !sit) {
      r.hipL.rotation.x = swing * 0.55;
      r.hipR.rotation.x = -swing * 0.55;
      r.kneeL.rotation.x = Math.max(0, -swing) * 0.6;
      r.kneeR.rotation.x = Math.max(0, swing) * 0.6;
    }

    const md = MOODS[mood] || MOODS.neutral;
    S.m += (md.m - S.m) * kk(6);
    S.b += (md.b - S.b) * kk(6);
    S.y += (md.y - S.y) * kk(6);
    S.h += (md.h - S.h) * kk(5);
    S.hy += (hy - S.hy) * kk(4);
    S.open += ((talking ? 0.25 + Math.abs(Math.sin(tt * 11)) * 0.75 : 0) - S.open) * kk(18);
    if (r.head) {
      r.head.rotation.x = S.h + (talking ? Math.sin(tt * 3.6) * 0.035 : 0);
      r.head.rotation.y = S.hy + Math.sin(tt * 0.5) * 0.04;
      r.head.rotation.z = mood === "sad" ? 0.05 : 0;
    }
    if (r.browL) {
      r.browL.rotation.z = S.b;
      r.browR.rotation.z = -S.b;
      r.browL.position.y = 0.056 + S.y;
      r.browR.position.y = 0.056 + S.y;
    }
    if (r.mouth) {
      r.mouth.rotation.z = S.m < 0 ? 0 : Math.PI;
      r.mouth.scale.y = Math.max(0.14, Math.abs(S.m));
      r.mouth.position.y = -0.052 + (S.m < 0 ? -0.012 * Math.abs(S.m) : 0.012 * Math.abs(S.m));
    }
    if (r.jaw) {
      r.jaw.scale.set(1, 0.1 + S.open, 1);
      r.jaw.visible = S.open > 0.05;
    }
    const blink = Math.sin(tt * 0.9 + phase * 3) > 0.985 ? 0.1 : 1;
    if (r.eyeL) {
      r.eyeL.scale.y = blink;
      r.eyeR.scale.y = blink;
    }
  });

  const bare = !top;
  const torsoC = top || skin;
  return (
    <group ref={root} position={p} rotation={[0, ry, 0]} scale={s}>
      {/* lower body */}
      {!sit && (
        <>
          <group ref={ref("hipL")} position={[hip, 0.93, 0]}>
            <Cyl p={[0, -0.23, 0]} r={[0.075, 0.06]} h={0.46} c={skin} rg={0.75} />
            <group ref={ref("kneeL")} position={[0, -0.46, 0]}>
              <Cyl p={[0, -0.22, 0]} r={[0.055, 0.042]} h={0.44} c={skin} rg={0.75} />
              <Box p={[0, -0.46, 0.04]} s={[0.075, 0.045, 0.16]} c={skin} rg={0.8} />
            </group>
          </group>
          <group ref={ref("hipR")} position={[-hip, 0.93, 0]}>
            <Cyl p={[0, -0.23, 0]} r={[0.075, 0.06]} h={0.46} c={skin} rg={0.75} />
            <group ref={ref("kneeR")} position={[0, -0.46, 0]}>
              <Cyl p={[0, -0.22, 0]} r={[0.055, 0.042]} h={0.44} c={skin} rg={0.75} />
              <Box p={[0, -0.46, 0.04]} s={[0.075, 0.045, 0.16]} c={skin} rg={0.8} />
            </group>
          </group>
          {female ? (
            <Cyl p={[0, 0.5, 0]} r={[0.18, 0.31]} h={0.95} c={cloth} rg={0.9} />
          ) : (
            <>
              <Cyl p={[0, 0.62, 0]} r={[0.19, 0.29]} h={0.7} c={cloth} rg={0.92} />
              <Cyl p={[0, 0.97, 0]} r={[0.2, 0.2]} h={0.06} c={top ? "#b8532c" : GOLD_DEEP} rg={0.7} />
            </>
          )}
        </>
      )}
      {sit && (
        <>
          <Sph p={[0, 0.085, 0.02]} r={0.3} sc={[1.25, 0.42, 1.05]} c={cloth} rg={0.92} />
          <Sph p={[0.2, 0.09, 0.26]} r={0.08} c={skin} />
          <Sph p={[-0.2, 0.09, 0.26]} r={0.08} c={skin} />
        </>
      )}

      {/* upper body (pivots at pelvis) */}
      <group ref={ref("body")} position={[0, sit ? 0.95 - SIT_DROP : 0.95, 0]}>
        <Cyl p={[0, 0.3, 0]} r={[female ? 0.165 : 0.2, female ? 0.14 : 0.165]} h={0.58} c={torsoC} rg={0.8} />
        {female && <Cyl p={[0, 0.07, 0]} r={[0.145, 0.16]} h={0.14} c={skin} rg={0.8} />}
        {sash && <Tor p={[0, 0.3, 0]} a={[0.19, 0.02]} rot={[Math.PI / 2 + 0.35, 0.1, 0.4]} c={sash} m={0} rg={0.9} />}
        {jewel && (
          <>
            <Tor p={[0, 0.5, 0.02]} a={[0.13, 0.014]} rot={[Math.PI / 2 - 0.25, 0, 0]} c={GOLD} />
            <Sph p={[0, 0.42, 0.14]} r={0.025} c={female ? "#2f8f6a" : "#c0392b"} e={female ? "#2f8f6a" : "#c0392b"} ei={0.6} />
          </>
        )}
        <Cyl p={[0, 0.6, 0]} r={[0.045, 0.05]} h={0.1} c={skin} rg={0.8} />

        {/* arms */}
        <group ref={ref("sL")} position={[0.255, 0.54, 0]}>
          <Sph r={0.062} c={torsoC} rg={0.8} />
          <Cyl p={[0, -0.15, 0]} r={[0.05, 0.042]} h={0.3} c={skin} />
          {jewel && <Tor p={[0, -0.08, 0]} a={[0.05, 0.012]} rot={[Math.PI / 2, 0, 0]} c={GOLD} />}
          <group ref={ref("eL")} position={[0, -0.3, 0]}>
            <Cyl p={[0, -0.135, 0]} r={[0.04, 0.032]} h={0.27} c={skin} />
            {jewel && <Tor p={[0, -0.23, 0]} a={[0.036, 0.008]} rot={[Math.PI / 2, 0, 0]} c={GOLD} />}
            <Sph p={[0, -0.29, 0.01]} r={0.04} sc={[1, 1.2, 0.8]} c={skin} />
          </group>
        </group>
        <group ref={ref("sR")} position={[-0.255, 0.54, 0]}>
          <Sph r={0.062} c={torsoC} rg={0.8} />
          <Cyl p={[0, -0.15, 0]} r={[0.05, 0.042]} h={0.3} c={skin} />
          {jewel && <Tor p={[0, -0.08, 0]} a={[0.05, 0.012]} rot={[Math.PI / 2, 0, 0]} c={GOLD} />}
          <group ref={ref("eR")} position={[0, -0.3, 0]}>
            <Cyl p={[0, -0.135, 0]} r={[0.04, 0.032]} h={0.27} c={skin} />
            {jewel && <Tor p={[0, -0.23, 0]} a={[0.036, 0.008]} rot={[Math.PI / 2, 0, 0]} c={GOLD} />}
            <Sph p={[0, -0.29, 0.01]} r={0.04} sc={[1, 1.2, 0.8]} c={skin} />
            {hold && <HeldItem kind={hold} />}
          </group>
        </group>

        {/* head */}
        <group ref={ref("head")} position={[0, 0.77, 0]}>
          <Sph r={0.125} sc={[0.9, 1.08, 0.96]} c={skin} rg={0.7} seg={28} />
          <Sph p={[0, 0.03, -0.018]} r={0.13} sc={[0.93, 0.92, 0.96]} c={hair} rg={0.55} seg={24} />
          <Sph p={[0.047, 0.02, 0.108]} r={0.017} sc={[1, 1, 0.6]} c="#f5f0e6" cast={false} />
          <Sph p={[-0.047, 0.02, 0.108]} r={0.017} sc={[1, 1, 0.6]} c="#f5f0e6" cast={false} />
          <group ref={ref("eyeL")} position={[0.047, 0.02, 0.118]}>
            <Sph r={0.0095} c="#120a06" cast={false} />
          </group>
          <group ref={ref("eyeR")} position={[-0.047, 0.02, 0.118]}>
            <Sph r={0.0095} c="#120a06" cast={false} />
          </group>
          <group ref={ref("browL")} position={[0.047, 0.056, 0.113]}>
            <Box s={[0.058, 0.009, 0.01]} c={hair} cast={false} />
          </group>
          <group ref={ref("browR")} position={[-0.047, 0.056, 0.113]}>
            <Box s={[0.058, 0.009, 0.01]} c={hair} cast={false} />
          </group>
          <mesh position={[0, -0.012, 0.124]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[0.014, 0.04, 8]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
          <group ref={ref("mouth")} position={[0, -0.052, 0.108]}>
            <mesh>
              <torusGeometry args={[0.028, 0.0055, 6, 14, Math.PI]} />
              <meshStandardMaterial color="#6b2a22" roughness={0.6} />
            </mesh>
          </group>
          <group ref={ref("jaw")} position={[0, -0.062, 0.106]}>
            <Sph r={0.018} sc={[1.3, 1, 0.5]} c="#3a0f0c" cast={false} />
          </group>
          {tilakMark(skin)}
          {beard && <Sph p={[0, -0.09, 0.05]} r={0.07} sc={[1, 1.2, 0.8]} c={beard} rg={1} />}
          <Sph p={[0.118, -0.02, 0]} r={0.017} sc={[0.6, 1.2, 0.6]} c={skin} />
          <Sph p={[-0.118, -0.02, 0]} r={0.017} sc={[0.6, 1.2, 0.6]} c={skin} />
          {jewel && (
            <>
              <Sph p={[0.122, -0.055, 0]} r={0.016} c={GOLD} m={0.8} rg={0.3} />
              <Sph p={[-0.122, -0.055, 0]} r={0.016} c={GOLD} m={0.8} rg={0.3} />
            </>
          )}
          {female && (
            <>
              <Sph p={[0, 0.0, -0.13]} r={0.07} c={hair} rg={0.6} />
              <Cyl p={[0, -0.2, -0.13]} r={[0.03, 0.02]} h={0.4} c={hair} rg={0.6} />
            </>
          )}
          {veil && <Sph p={[0, 0.025, -0.02]} r={0.142} sc={[0.97, 1, 1.02]} c={veil} rg={0.9} op={0.97} />}
          {turban && (
            <>
              <Tor p={[0, 0.06, 0]} a={[0.11, 0.05]} rot={[Math.PI / 2 - 0.15, 0, 0]} c={turban} m={0} rg={0.85} />
              <Sph p={[0, 0.09, 0]} r={0.11} sc={[1, 0.7, 1.05]} c={turban} rg={0.85} />
              <Sph p={[0.05, 0.12, 0.09]} r={0.02} c={GOLD} m={0.8} rg={0.3} />
            </>
          )}
          {crown && (
            <group position={[0, 0.1, 0]}>
              <Cyl p={[0, 0.02, 0]} r={[0.105, 0.115]} h={0.06} c={GOLD} m={0.85} rg={0.28} seg={24} />
              <Cyl p={[0, 0.12, 0]} r={[0.03, 0.098]} h={0.17} c={GOLD} m={0.85} rg={0.28} seg={24} />
              <Sph p={[0, 0.22, 0]} r={0.025} c={GOLD} m={0.9} rg={0.25} />
              <Sph p={[0, 0.035, 0.115]} r={0.02} c="#c0392b" e="#c0392b" ei={0.8} />
              <Sph p={[0.06, 0.035, 0.095]} r={0.014} c="#2f8f6a" e="#2f8f6a" ei={0.6} />
              <Sph p={[-0.06, 0.035, 0.095]} r={0.014} c="#2f8f6a" e="#2f8f6a" ei={0.6} />
            </group>
          )}
        </group>
      </group>
      {halo && <Halo y={sit ? 1.0 : 1.7} />}
    </group>
  );
}

function tilakMark() {
  return <Box p={[0, 0.088, 0.116]} s={[0.012, 0.032, 0.006]} c="#c0392b" cast={false} />;
}

function Halo({ y = 1.0 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.emissiveIntensity = 0.7 + Math.sin(clock.elapsedTime * 1.2) * 0.2;
  });
  return (
    <group position={[0, y + 0.05, -0.22]}>
      <mesh ref={ref}>
        <torusGeometry args={[0.36, 0.022, 10, 48]} />
        <meshStandardMaterial color="#ffd982" emissive="#ffb43a" emissiveIntensity={0.8} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.34, 36]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* =========================================================
   SHARED SET PIECES
   ========================================================= */

const RAMA_SKIN = "#6f8fae";
const SITA_SKIN = "#d6a074";

function Ground({ size = [90, 90], tex, rep = [12, 12], c = "#ffffff", p = [0, 0, 0] }) {
  const t = useTex(tex, 512, 512, rep);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={p} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={t} color={c} roughness={1} />
    </mesh>
  );
}

function Pillar({ p, h = 6.5, c = "#b98a5c", trim = GOLD_DEEP, w = 0.46 }) {
  return (
    <group position={p}>
      <Box p={[0, 0.2, 0]} s={[w * 2.3, 0.4, w * 2.3]} c={trim} m={0.3} rg={0.5} />
      <Cyl p={[0, h / 2, 0]} r={[w * 0.82, w]} h={h} seg={16} c={c} rg={0.7} />
      {[0.9, 1.3, h - 1.3, h - 0.9].map((y) => (
        <Tor key={y} p={[0, y, 0]} a={[w * 0.98, 0.05]} rot={[Math.PI / 2, 0, 0]} c={trim} />
      ))}
      <Box p={[0, h + 0.12, 0]} s={[w * 2.7, 0.28, w * 2.7]} c={trim} m={0.3} rg={0.5} />
      <Box p={[0, h + 0.42, 0]} s={[w * 3.6, 0.3, w * 3.6]} c={c} rg={0.7} />
    </group>
  );
}

function Garland({ a, b, sag = 0.6, n = 18 }) {
  const dots = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    dots.push(
      <Sph
        key={i}
        p={[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t]}
        r={0.085}
        c={i % 3 === 0 ? "#f08a1c" : "#f6c230"}
        rg={0.9}
        cast={false}
        seg={8}
      />
    );
  }
  return <>{dots}</>;
}

function HangLamp({ p, len = 1.2, light = false, ph = 0 }) {
  return (
    <group position={p}>
      <Cyl p={[0, len / 2, 0]} r={[0.012, 0.012]} h={len} c="#4a3a22" cast={false} />
      <Sph r={0.16} sc={[1, 1.15, 1]} c="#e8a23a" e="#ffb347" ei={0.9} m={0.5} rg={0.4} cast={false} />
      <Flame p={[0, 0, 0]} size={0.07} light={light} intensity={1.6} dist={11} ph={ph} />
    </group>
  );
}

function Hut({ p, ry = 0, s = 1, wall = "#b08a5e", thatch = "#a8843c" }) {
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      <Box p={[0, 0.95, 0]} s={[3.2, 1.9, 2.7]} c={wall} rg={1} />
      <Cyl p={[0, 2.55, 0]} r={[0.06, 2.55]} h={1.7} seg={8} c={thatch} rg={1} rot={[0, Math.PI / 8, 0]} />
      <Box p={[0, 0.6, 1.36]} s={[0.75, 1.2, 0.06]} c="#3a2614" />
      <Box p={[1.0, 1.1, 1.36]} s={[0.4, 0.4, 0.05]} c="#3a2614" />
      <Box p={[-1.9, 0.5, 0.2]} s={[0.12, 1, 0.12]} c="#6b4a2a" />
    </group>
  );
}

function Tree({ p, s = 1, ph = 0 }) {
  return (
    <Sway p={p} amp={0.012} speed={0.7} ph={ph}>
      <Cyl p={[0, 1.2 * s, 0]} r={[0.14 * s, 0.24 * s]} h={2.4 * s} c="#5b3d22" rg={1} />
      <Sph p={[0, 3.1 * s, 0]} r={1.5 * s} sc={[1, 0.85, 1]} c="#4f8a35" rg={1} recv />
      <Sph p={[0.95 * s, 2.55 * s, 0.3 * s]} r={1 * s} c="#5d9a3d" rg={1} />
      <Sph p={[-0.85 * s, 2.65 * s, -0.2 * s]} r={1.05 * s} c="#467f30" rg={1} />
    </Sway>
  );
}

function Hills({ list }) {
  return (
    <>
      {list.map(([x, z, r, h, c], i) => (
        <Sph key={i} p={[x, 0, z]} r={r} sc={[1.6, h / r, 1]} c={c} rg={1} cast={false} seg={18} />
      ))}
    </>
  );
}

function Sack({ p, c = "#c9b27c", s = 1, ry = 0 }) {
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      <Sph p={[0, 0.3, 0]} r={0.32} sc={[1, 1.05, 0.8]} c={c} rg={1} />
      <Cyl p={[0, 0.62, 0]} r={[0.1, 0.17]} h={0.16} c={c} rg={1} />
    </group>
  );
}

function Crops({ at = [0, 0, 0], cols = 8, rows = 5, gap = 0.55, state = "dry", speed = 0.5 }) {
  const ref = useRef();
  const n = cols * rows;
  const cur = useRef(new Float32Array(n));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const dry = useMemo(() => new THREE.Color("#8a6a30"), []);
  const wet = useMemo(() => new THREE.Color("#5fa236"), []);
  const jit = useMemo(() => {
    const r = seeded(n + 41);
    return Array.from({ length: n }, () => [r() - 0.5, r() - 0.5, r()]);
  }, [n]);
  useFrame(({ clock }, dt) => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < n; i++) {
      const target = state === "green" ? 1 : state === "dry" ? 0 : state === "sprout" ? 0.7 : state === "thin" ? 0.5 : i % 3 === 0 ? 0.9 : 0.25;
      cur.current[i] += (target - cur.current[i]) * Math.min(1, dt * speed * (0.6 + jit[i][2]));
      const g = cur.current[i];
      const x = (i % cols) * gap - (cols * gap) / 2 + jit[i][0] * 0.18;
      const z = Math.floor(i / cols) * gap * 1.5 - (rows * gap * 1.5) / 2 + jit[i][1] * 0.18;
      const sw = Math.sin(clock.elapsedTime * 1.4 + i) * 0.05 * (0.4 + g);
      dummy.position.set(at[0] + x, at[1] + (0.12 + g * 0.3), at[2] + z);
      dummy.rotation.set(sw + (1 - g) * jit[i][0] * 0.9, 0, (1 - g) * jit[i][1] * 0.9);
      dummy.scale.set(1 + g * 0.4, 0.45 + g * 1.0, 1 + g * 0.4);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      col.copy(dry).lerp(wet, g);
      m.setColorAt(i, col);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, n]} castShadow frustumCulled={false}>
      <coneGeometry args={[0.1, 0.65, 5]} />
      <meshStandardMaterial color="#ffffff" roughness={0.9} />
    </instancedMesh>
  );
}

function Bullock({ p, ry = 0, c = "#e4dccb" }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 1.0, 0]} s={[1.3, 0.72, 0.55]} c={c} rg={0.9} />
      <Sph p={[0.3, 1.4, 0]} r={0.2} sc={[1, 0.8, 0.8]} c={c} rg={0.9} />
      <Sway p={[0.82, 1.15, 0]} amp={0.08} speed={0.8}>
        <Box p={[0.15, 0, 0]} s={[0.5, 0.4, 0.38]} c={c} rg={0.9} />
        <Cyl p={[0.12, 0.28, 0.17]} r={[0.01, 0.04]} h={0.3} c="#d8c9a3" rot={[0, 0, -0.5]} />
        <Cyl p={[0.12, 0.28, -0.17]} r={[0.01, 0.04]} h={0.3} c="#d8c9a3" rot={[0, 0, -0.5]} />
      </Sway>
      {[
        [0.48, 0.2],
        [0.48, -0.2],
        [-0.48, 0.2],
        [-0.48, -0.2],
      ].map(([x, z], i) => (
        <Cyl key={i} p={[x, 0.34, z]} r={[0.07, 0.055]} h={0.68} c={c} rg={0.9} />
      ))}
      <Sway p={[-0.66, 1.1, 0]} amp={0.3} speed={1.5} axis="x">
        <Cyl p={[0, -0.3, 0]} r={[0.02, 0.02]} h={0.6} c="#8a7a62" />
      </Sway>
    </group>
  );
}

function Cart({ p, ry = 0 }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 0.8, 0]} s={[2.4, 0.12, 1.3]} c="#7a5330" />
      {[-1.15, 1.15].map((x) => (
        <Box key={x} p={[x, 1.05, 0]} s={[0.08, 0.5, 1.3]} c="#6b4526" />
      ))}
      {[-0.7, 0.7].map((z) => (
        <group key={z} position={[0, 0.5, z]}>
          <Cyl r={[0.5, 0.5]} h={0.1} seg={18} c="#5a3a1c" rot={[Math.PI / 2, 0, 0]} />
          <Cyl r={[0.52, 0.52]} h={0.04} seg={18} c="#2e2218" rot={[Math.PI / 2, 0, 0]} p={[0, 0, 0.05]} />
          <Cyl r={[0.06, 0.06]} h={0.2} c="#3a2614" rot={[Math.PI / 2, 0, 0]} />
        </group>
      ))}
      <Box p={[2.1, 0.78, 0.35]} s={[2.4, 0.06, 0.08]} c="#6b4526" />
      <Box p={[2.1, 0.78, -0.35]} s={[2.4, 0.06, 0.08]} c="#6b4526" />
      <Sack p={[-0.4, 0.86, 0.1]} s={1.1} />
      <Sack p={[0.2, 0.86, -0.2]} s={1.1} c="#bda06a" />
    </group>
  );
}

function Stall({ p, ry = 0, awn = "#c4552b", awn2 = "#f1e0b0", goods = "cloth" }) {
  const stripes = [-1.4, -0.7, 0, 0.7, 1.4];
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {[
        [-1.6, -1.0],
        [1.6, -1.0],
        [-1.6, 1.0],
        [1.6, 1.0],
      ].map(([x, z], i) => (
        <Cyl key={i} p={[x, 1.3, z]} r={[0.06, 0.07]} h={2.6} c="#5b3d22" seg={8} />
      ))}
      <group position={[0, 2.7, 0]} rotation={[0.16, 0, 0]}>
        {stripes.map((x, i) => (
          <Box key={x} p={[x, 0, 0]} s={[0.7, 0.07, 2.5]} c={i % 2 ? awn2 : awn} rg={1} />
        ))}
        {stripes.map((x, i) => (
          <Sway key={`v${x}`} p={[x, -0.05, 1.25]} amp={0.08} speed={1.2} ph={i} axis="x">
            <Box p={[0, -0.12, 0]} s={[0.7, 0.26, 0.04]} c={i % 2 ? awn2 : awn} rg={1} />
          </Sway>
        ))}
      </group>
      <Box p={[0, 0.5, 0.7]} s={[3.2, 1.0, 0.9]} c="#7a5330" map={undefined} />
      <Box p={[0, 1.02, 0.7]} s={[3.3, 0.06, 1.0]} c="#946a3c" />
      {goods === "cloth" &&
        ["#c0392b", "#2f6b8a", "#e0a82e", "#7a3b8c", "#2f8f6a", "#d8691e"].map((c, i) => (
          <Cyl key={i} p={[-1.2 + i * 0.48, 1.2, 0.7]} r={[0.17, 0.17]} h={0.8} c={c} rg={1} rot={[0, 0, Math.PI / 2]} />
        ))}
      {goods === "pots" &&
        [0, 1, 2, 3, 4].map((i) => (
          <group key={i} position={[-1.2 + i * 0.6, 1.05, 0.7]}>
            <Sph p={[0, 0.2, 0]} r={0.24} sc={[1, 0.95, 1]} c={i % 2 ? "#b4562c" : "#9c4524"} rg={0.8} />
            <Cyl p={[0, 0.46, 0]} r={[0.1, 0.07]} h={0.12} c="#a24a28" />
          </group>
        ))}
      {goods === "baskets" &&
        [0, 1, 2, 3].map((i) => (
          <group key={i} position={[-1.0 + i * 0.7, 1.05, 0.7]}>
            <Cyl p={[0, 0.15, 0]} r={[0.3, 0.22]} h={0.3} c="#a8803c" rg={1} />
            {[0, 1, 2, 3, 4].map((k) => (
              <Sph key={k} p={[Math.cos(k * 1.3) * 0.12, 0.34 + (k % 2) * 0.05, Math.sin(k * 1.3) * 0.12]} r={0.09} c={["#d9532c", "#e0b02e", "#8fae3a", "#c0392b"][(i + k) % 4]} rg={0.7} />
            ))}
          </group>
        ))}
    </group>
  );
}

/* =========================================================
   SCENE 0 — THE ROYAL COURT (opening speech and finale)
   ========================================================= */

const CLOTHS = ["#efe4c6", "#e3d3a8", "#cfa66a", "#b9d2c4", "#e7c9a0", "#d8b6a6"];
const TOPS = [undefined, "#b8532c", "#2f6b6b", "#7a3b8c", undefined, "#c9a23c"];
const SARIS = ["#a1432b", "#2f6b8a", "#7a3b8c", "#2f8f6a", "#c28a22", "#b03a5a"];
const SKINS = ["#b8845a", "#a8744a", "#c99a6a", "#8f6240", "#d2a478"];

function CourtScene({ speaker, final }) {
  const tile = useTex("tile", 512, 512, [9, 12]);
  const carpet = useTex("carpet", 256, 512, [1, 5]);
  const sunTex = useTex("sun", 512, 640);
  const crowd = useMemo(() => {
    const r = seeded(final ? 77 : 33);
    const out = [];
    const total = final ? 26 : 16;
    for (let i = 0; i < total; i++) {
      const side = i % 2 ? 1 : -1;
      const row = Math.floor(i / 2);
      out.push({
        p: [side * (1.9 + r() * 2.8), 0, 0.2 + row * (final ? 0.85 : 1.1) + r() * 0.3],
        ry: Math.PI + side * (0.25 + r() * 0.2),
        skin: pick(SKINS, r),
        cloth: pick(CLOTHS, r),
        top: pick(TOPS, r),
        female: r() > 0.6,
        sari: pick(SARIS, r),
        turban: r() > 0.55 ? pick(["#c0392b", "#e0a82e", "#f1e8d0", "#2f6b8a"], r) : undefined,
        phase: r() * 6,
      });
    }
    return out;
  }, [final]);
  const rows = [-12, -8.5, -5, -1.5, 2, 5.5, 9, 12.5];
  return (
    <>
      <Env
        fog={["#2a1608", 16, 52]}
        amb={["#ffcf9a", 0.55]}
        hemi={["#ffe0b0", "#4a2a14", 0.55]}
        sun={{ pos: [5, 14, 8], color: "#ffdca0", int: 1.2 }}
      />
      {/* hall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 34]} />
        <meshStandardMaterial map={tile} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4]} receiveShadow>
        <planeGeometry args={[2.1, 24]} />
        <meshStandardMaterial map={carpet} roughness={0.9} />
      </mesh>
      <Box p={[0, 8.4, 0]} s={[26, 0.4, 36]} c="#3a1d0e" rg={1} cast={false} />
      {rows.map((z) => (
        <Box key={z} p={[0, 7.85, z]} s={[26, 0.35, 0.5]} c="#6b3a1c" rg={0.8} cast={false} />
      ))}
      <Box p={[-12.5, 4.2, 1]} s={[0.5, 8.4, 36]} c="#7c4e2a" rg={0.9} />
      <Box p={[12.5, 4.2, 1]} s={[0.5, 8.4, 36]} c="#7c4e2a" rg={0.9} />
      <Box p={[0, 4.2, 16.5]} s={[26, 8.4, 0.5]} c="#6e4426" rg={0.9} />
      <Box p={[0, 4.2, -14.5]} s={[26, 8.4, 0.5]} c="#6e4426" rg={0.9} />
      <mesh position={[0, 4.6, -14.2]}>
        <planeGeometry args={[6.4, 8]} />
        <meshStandardMaterial map={sunTex} roughness={0.9} emissive="#5a2010" emissiveIntensity={0.35} />
      </mesh>
      {[-7, -3.5, 0, 3.5, 7].map((x) => (
        <group key={x}>
          <Box p={[x, 5.2, 16.2]} s={[1.8, 3.2, 0.1]} c="#ffd98a" e="#ffc261" ei={0.9} rg={1} cast={false} />
        </group>
      ))}

      {/* pillars, garlands, lamps */}
      {[-6, -2.5, 1, 4.5, 8, 11.5].map((z, i) => (
        <group key={z}>
          <Pillar p={[-5.6, 0, z]} />
          <Pillar p={[5.6, 0, z]} />
          <Garland a={[-5.6, 5.8, z]} b={[5.6, 5.8, z]} sag={0.9} n={26} />
          <HangLamp p={[-3.2, 6.2, z + 1.7]} len={1.4} ph={i} />
          <HangLamp p={[3.2, 6.2, z + 1.7]} len={1.4} ph={i + 2} />
        </group>
      ))}
      <pointLight position={[-4, 5, -6]} color="#ffb766" intensity={1.8} distance={16} decay={1.5} />
      <pointLight position={[4, 5, -6]} color="#ffb766" intensity={1.8} distance={16} decay={1.5} />
      <pointLight position={[0, 5.5, 2]} color="#ffc680" intensity={1.4} distance={16} decay={1.5} />
      <pointLight position={[0, 5.5, 9]} color="#ffc680" intensity={1.1} distance={16} decay={1.5} />
      {[-11.5, 11.5].map((x) => (
        <group key={x}>
          {[-4, 2, 8].map((z) => (
            <Box key={z} p={[x, 4.6, z]} s={[0.1, 3.4, 1.6]} c="#ffe3a8" e="#ffd079" ei={1.2} cast={false} />
          ))}
        </group>
      ))}
      {[-4, 2, 8].map((z) => (
        <LightShaft key={z} p={[-8, 4, z]} rot={[0, Math.PI / 2, 0.9]} w={2.2} h={16} op={0.09} />
      ))}
      {[-4, 2, 8].map((z) => (
        <LightShaft key={`r${z}`} p={[8, 4, z]} rot={[0, Math.PI / 2, -0.9]} w={2.2} h={16} op={0.09} />
      ))}

      {/* dais and throne */}
      {[
        [5.2, 0.25],
        [4.4, 0.5],
        [3.6, 0.75],
      ].map(([r, y], i) => (
        <Cyl key={i} p={[0, y - 0.125, -10]} r={[r, r + 0.12]} h={0.26} seg={14} c={i === 2 ? "#a8782c" : "#c49a62"} m={i === 2 ? 0.3 : 0} rg={0.5} />
      ))}
      <Box p={[0, 0.95, -9.8]} s={[3.6, 0.4, 1.4]} c="#7d1c1c" rg={0.7} />
      <Box p={[0, 0.78, -9.8]} s={[3.8, 0.1, 1.6]} c={GOLD} m={0.8} rg={0.3} />
      <Box p={[0, 2.35, -10.5]} s={[3.6, 2.8, 0.3]} c="#7d1c1c" rg={0.7} />
      <Box p={[0, 3.8, -10.5]} s={[3.9, 0.18, 0.4]} c={GOLD} m={0.8} rg={0.3} />
      <Tor p={[0, 3.8, -10.3]} a={[1.9, 0.09]} arc={Math.PI} c={GOLD} m={0.85} rg={0.25} />
      {[-1.9, 1.9].map((x) => (
        <group key={x}>
          <Cyl p={[x, 2.4, -10.4]} r={[0.11, 0.14]} h={3.2} c={GOLD} m={0.85} rg={0.25} />
          <Sph p={[x, 4.1, -10.4]} r={0.2} c={GOLD} m={0.9} rg={0.22} />
        </group>
      ))}
      <Sph p={[0, 4.1, -10.4]} r={0.26} c="#ffd27a" e="#ffb43a" ei={1.3} />
      <Flame p={[-1.2, 4.9, -9.6]} light={false} size={0.09} />
      <Flame p={[1.2, 4.9, -9.6]} light={false} size={0.09} />
      <Cyl p={[0, 5.25, -10.2]} r={[0.2, 2.6]} h={1.1} seg={14} c="#8f2a1f" rg={0.9} cast={false} open />

      <Person p={[-0.62, 1.15, -9.6]} sit pose={final ? "sit" : "sit"} skin={RAMA_SKIN} cloth="#e6b43a" sash="#b8332a" jewel crown halo hair="#1a110a" mood={final ? "happy" : "neutral"} talking={speaker === "rama"} hy={0.12} />
      <Person p={[0.78, 1.15, -9.6]} sit pose="sit" female skin={SITA_SKIN} cloth="#e0861e" top="#2f8f6a" jewel halo veil="#e0861e" hair="#1a110a" mood={final ? "happy" : "neutral"} hy={-0.15} phase={1.5} />
      <Person p={[-2.2, 0.75, -9.5]} pose="fan" hold="fan" cloth="#efe4c6" skin="#b8845a" turban="#c0392b" />
      <Person p={[2.2, 0.75, -9.5]} pose="fan" hold="fan" cloth="#efe4c6" skin="#a8744a" turban="#c0392b" phase={2} />

      {/* ministers, guards, citizens */}
      <Person p={[-3.7, 0, -6.4]} ry={0.55} cloth="#f1e8d0" top="#2f6b6b" turban="#e0a82e" beard="#d8d2c4" skin="#a8744a" jewel hold="scroll" />
      <Person p={[3.7, 0, -6.4]} ry={-0.55} cloth="#f1e8d0" top="#7a3b8c" turban="#c0392b" beard="#c8c2b4" skin="#8f6240" jewel phase={1} />
      <Person p={[-5.0, 0, -7.6]} ry={0.7} cloth="#f1e8d0" top="#b8532c" skin="#c99a6a" turban="#2f6b8a" phase={2} />
      <Person p={[5.0, 0, -7.6]} ry={-0.7} cloth="#f1e8d0" skin="#b8845a" turban="#e0a82e" beard="#e6e0d2" phase={3} />
      {[-2.5, 2.5].map((x, i) => (
        <Person key={x} p={[x, 0, -3.8]} ry={Math.PI} pose="guard" hold="spear" cloth="#7a1f1f" top="#8a6a2c" turban="#7a1f1f" skin="#b8845a" phase={i} />
      ))}
      {crowd.map((c, i) => (
        <Person
          key={i}
          lite
          p={c.p}
          ry={c.ry}
          skin={c.skin}
          cloth={c.female ? c.sari : c.cloth}
          top={c.female ? undefined : c.top}
          female={c.female}
          veil={c.female ? c.sari : undefined}
          turban={c.female ? undefined : c.turban}
          pose={final ? "namaste" : i % 5 === 0 ? "fold" : "idle"}
          mood={final ? "happy" : "neutral"}
          phase={c.phase}
        />
      ))}
      <Floaters count={90} area={[18, 9, 22]} pos={[0, 4.5, 0]} color="#ff9ab8" size={0.16} fall={0.28} drift={0.5} />
      <Floaters count={70} area={[18, 9, 22]} pos={[0, 4.5, 0]} color="#ffc35a" size={0.14} fall={0.2} drift={0.4} />
      <Floaters count={60} area={[14, 6, 20]} pos={[0, 3, 2]} color="#fff0c0" size={0.07} fall={-0.05} drift={0.6} opacity={0.6} />
    </>
  );
}

/* =========================================================
   SITUATION I — THE FARMER'S PLEA
   ========================================================= */

function VillageScene({ outcome, speaker }) {
  const T = (id) => speaker === id;
  const field = outcome === "defer" ? "sprout" : outcome === "assess" ? "partial" : "dry";
  return (
    <>
      <Env
        sky={["#6fa8d8", "#f4dcae", "#b8a070"]}
        fog={["#ecd6a4", 28, 95]}
        amb={["#fff1d0", 0.55]}
        hemi={["#bfe0ff", "#7a5a30", 0.6]}
        sun={{ pos: [-10, 16, 12], color: "#ffe0a8", int: 1.9 }}
      />
      <Ground tex="grass" rep={[14, 14]} c="#e8e0b0" />
      <Ground tex="dirt" size={[7, 40]} rep={[2, 8]} p={[0.5, 0.02, 4]} c="#e8cfa0" />
      <Ground tex="dirt" size={[14, 8]} rep={[3, 2]} p={[-6.2, 0.02, -2.8]} c="#a8825a" />
      <Hills list={[[-40, -55, 18, 14, "#7f9a64"], [10, -70, 24, 20, "#8aa370"], [50, -60, 20, 15, "#7a9460"], [-8, -50, 12, 8, "#93ab78"]]} />
      <mesh position={[-22, 18, -80]}>
        <sphereGeometry args={[4.5, 20, 16]} />
        <meshBasicMaterial color="#fff4cc" fog={false} />
      </mesh>

      <Crops at={[-6.2, 0, -2.8]} cols={11} rows={4} gap={0.6} state={field} speed={outcome === "defer" ? 0.35 : 0.5} />
      <Crops at={[-6.2, 0, -7.6]} cols={11} rows={3} gap={0.6} state={outcome === "defer" ? "sprout" : outcome === "assess" ? "thin" : "dry"} speed={0.3} />
      {[-10.4, -2.0].map((x) => (
        <Box key={x} p={[x, 0.3, -5]} s={[0.1, 0.6, 7]} c="#6b4a2a" />
      ))}
      <Box p={[-6.2, 0.3, -9.1]} s={[8.4, 0.12, 0.1]} c="#6b4a2a" />

      <Hut p={[5.6, 0, -3.8]} ry={-0.25} />
      <Hut p={[10.8, 0, -7]} ry={-0.5} s={0.9} wall="#a98058" />
      <Hut p={[-13, 0, -2]} ry={0.5} s={0.95} wall="#b8946a" />
      <Tree p={[8.6, 0, 1]} s={1.2} />
      <Tree p={[-12, 0, 5]} s={1} ph={1} />
      <Tree p={[13, 0, -1]} s={1.3} ph={2} />
      <Tree p={[-4, 0, -12]} s={1.1} ph={3} />
      <Tree p={[3, 0, -13]} s={1.4} ph={4} />
      <Cart p={[9.5, 0, 2.5]} ry={0.4} />
      <Bullock p={[11.8, 0, 3.4]} ry={0.45} />
      <Bullock p={[11.4, 0, 4.4]} ry={0.45} c="#c9b89a" />
      <Cyl p={[-2.4, 0.06, 1.8]} r={[0.02, 0.02]} h={1.3} rot={[0, 0, 1.5]} c="#6b4a2a" />
      <Box p={[-1.8, 0.07, 1.8]} s={[0.3, 0.05, 0.05]} c="#8a8f94" m={0.8} />
      <Cyl p={[-7.4, 0.5, 0.6]} r={[0.03, 0.03]} h={1.5} rot={[0.2, 0.4, 1.0]} c="#6b4a2a" />

      {outcome === "defer" && (
        <>
          {[0, 1, 2].map((i) => (
            <Sack key={i} p={[-2.6 + i * 0.5, 0, -0.4]} s={1.1} c={["#cdb97e", "#c4ae6e", "#d2bf88"][i]} ry={i} />
          ))}
          <Person p={[0.4, 0, -0.3]} ry={-1.4} pose="carry" cloth="#d8cdb0" top="#6b8a5c" turban="#e0a82e" skin="#a8744a" mood="happy" />
        </>
      )}
      {outcome === "assess" && (
        <>
          <Person p={[3, 0, 3.4]} goTo={[-3.6, -3.6]} speed={1.2} ry={2.2} pose="point" hold="scroll" cloth="#f1e8d0" top="#2f6b6b" turban="#c0392b" skin="#a8744a" beard="#d8d2c4" mood="neutral" />
          <Cyl p={[-6.3, 0.1, -3.2]} r={[0.012, 0.012]} h={8} rot={[0, 0, Math.PI / 2]} c="#d8c89a" cast={false} />
        </>
      )}
      {outcome === "waive" &&
        [
          [7.2, 3.8, 2.7],
          [6.2, 4.6, 3.1],
          [8.2, 3.5, -2.2],
        ].map(([x, z, ry], i) => (
          <Person key={i} p={[x, 0, z]} ry={ry + 2.2} cloth="#d8cdb0" top={i === 1 ? "#8a5a3a" : undefined} turban="#b0a082" skin="#a8744a" mood="stern" pose="fold" phase={i} />
        ))}

      {/* the people */}
      <Person p={[-0.9, 0, 0.6]} ry={0.9} skin="#9c6a44" cloth="#d8cdb0" turban="#cdbf9a" mood={outcome === "waive" || outcome === "defer" ? "happy" : outcome === "assess" ? "worried" : "sad"} pose={outcome ? "namaste" : "plead"} talking={T("farmer") && !outcome} phase={1} />
      <Person p={[1.9, 0, 0.5]} ry={-0.9} cloth="#f1e8d0" top="#6b3a2a" turban="#8a3a2a" skin="#b8845a" beard="#c8c2b4" hold={outcome === "waive" ? undefined : "ledger"} mood={outcome === "waive" ? "worried" : outcome === "defer" ? "neutral" : "stern"} pose={outcome === "waive" ? "idle" : "hold"} talking={T("official")} hy={-0.2} />
      <Person p={[3.2, 0, -1.4]} ry={0.35} female cloth="#b8532c" veil="#b8532c" skin="#9c6a44" pose={outcome === "waive" ? "cheer" : outcome ? "namaste" : "idle"} mood={outcome ? "happy" : "sad"} phase={2} />
      <Person p={[4.2, 0, -1.2]} ry={0.2} s={0.55} skin="#9c6a44" cloth="#d8cdb0" pose={outcome === "waive" ? "cheer" : "idle"} mood={outcome ? "happy" : "sad"} phase={3} />
      <Person p={[4.9, 0, -1.4]} ry={0.1} s={0.5} female skin="#9c6a44" cloth="#b03a5a" pose={outcome === "waive" ? "cheer" : "idle"} mood={outcome ? "happy" : "sad"} phase={4} />
      <Person p={[3.6, 0, 3.6]} ry={-2.3} cloth="#f1e8d0" top="#7a1f1f" turban="#e0a82e" jewel skin="#b8845a" beard="#d8d2c4" hold="staff" mood="neutral" phase={5} />
      <Person p={[4.8, 0, 4.5]} ry={-2.4} cloth="#7a1f1f" top="#8a6a2c" turban="#7a1f1f" hold="spear" pose="guard" skin="#a8744a" phase={6} />
      <Floaters count={60} area={[24, 6, 24]} pos={[0, 3, 0]} color="#fff0c0" size={0.07} fall={0.04} drift={0.8} opacity={0.5} />
    </>
  );
}

/* =========================================================
   SITUATION II — THE MERCHANT'S COMPLAINT
   ========================================================= */

function Balance({ tilt }) {
  const beam = useRef();
  const pl = useRef();
  const pr = useRef();
  const cur = useRef(0.22);
  useFrame((_, dt) => {
    cur.current += (tilt - cur.current) * Math.min(1, dt * 1.1);
    const a = cur.current;
    if (beam.current) beam.current.rotation.z = a;
    if (pl.current) pl.current.rotation.z = -a;
    if (pr.current) pr.current.rotation.z = -a;
  });
  const Pan = () => (
    <>
      <Cyl p={[0, -0.25, 0]} r={[0.008, 0.008]} h={0.5} c="#5a4a30" cast={false} />
      <Cyl p={[0, -0.5, 0]} r={[0.26, 0.2]} h={0.05} c={GOLD} m={0.8} rg={0.3} />
      <Box p={[0, -0.44, 0]} s={[0.12, 0.08, 0.12]} c="#8a8f94" m={0.7} />
    </>
  );
  return (
    <group position={[0, 0.9, 0]}>
      <Cyl p={[0, 0.4, 0]} r={[0.05, 0.1]} h={0.8} c={GOLD_DEEP} m={0.7} rg={0.35} />
      <group position={[0, 0.85, 0]}>
        <group ref={beam}>
          <Box s={[1.8, 0.05, 0.05]} c={GOLD} m={0.85} rg={0.3} />
          <Sph r={0.06} c={GOLD} m={0.85} rg={0.3} />
          <group ref={pl} position={[-0.88, 0, 0]}>
            <Pan />
          </group>
          <group ref={pr} position={[0.88, 0, 0]}>
            <Pan />
          </group>
        </group>
      </group>
    </group>
  );
}

function MarketScene({ outcome, speaker }) {
  const T = (id) => speaker === id;
  const goodStalls = ["cloth", "pots", "baskets", "cloth", "pots", "baskets", "cloth"];
  const awns = [["#c4552b", "#f1e0b0"], ["#2f6b8a", "#f1e0b0"], ["#7a3b8c", "#efd78a"], ["#2f8f6a", "#f1e0b0"], ["#d8a21e", "#c0392b"], ["#c0392b", "#f1e0b0"], ["#3a6aa8", "#f1e0b0"]];
  const ring = useMemo(() => {
    const r = seeded(19);
    return Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 1.55 + 0.8;
      const rad = 5.2 + r() * 1.4;
      const x = Math.cos(a) * rad;
      const z = 1.2 + Math.sin(a) * rad * 0.7;
      return { p: [x, 0, z], ry: Math.atan2(-x, -(z - 1.2)), cloth: pick(CLOTHS, r), top: pick(TOPS, r), female: r() > 0.5, sari: pick(SARIS, r), skin: pick(SKINS, r), phase: r() * 5 };
    });
  }, []);
  const tilt = outcome === "scales" || outcome === "audit" ? 0 : 0.22;
  const crowdMood = outcome === "scales" ? "happy" : outcome === "fine" ? "sad" : outcome === "audit" ? "neutral" : "worried";
  return (
    <>
      <Env
        sky={["#5f9ad8", "#f6e2b6", "#c9b690"]}
        fog={["#f0dcb0", 30, 100]}
        amb={["#fff2d6", 0.6]}
        hemi={["#c8e4ff", "#8a6a40", 0.55]}
        sun={{ pos: [6, 18, 9], color: "#ffe6b4", int: 1.9 }}
      />
      <Ground tex="cobble" rep={[10, 10]} c="#f1e0c0" />
      {goodStalls.map((g, i) => (
        <Stall key={i} p={[-9 + i * 3.1, 0, -7]} goods={g} awn={awns[i][0]} awn2={awns[i][1]} />
      ))}
      {[0, 1, 2].map((i) => (
        <Stall key={`l${i}`} p={[-10.5, 0, -2.5 + i * 4]} ry={Math.PI / 2} goods={goodStalls[i + 2]} awn={awns[i + 3][0]} awn2={awns[i + 3][1]} />
      ))}
      {[0, 1, 2].map((i) => (
        <Stall key={`r${i}`} p={[10.5, 0, -2.5 + i * 4]} ry={-Math.PI / 2} goods={goodStalls[i]} awn={awns[i + 1][0]} awn2={awns[i + 1][1]} />
      ))}
      {[-9, -3, 3, 9].map((x, i) => (
        <Garland key={x} a={[x - 3, 4.6, -8]} b={[x + 3, 4.6, -8]} sag={0.7} />
      ))}
      <Box p={[-18, 4, -10]} s={[4, 8, 4]} c="#c9a070" />
      <Box p={[18, 5, -12]} s={[5, 10, 5]} c="#b8946a" />
      <Cyl p={[-18, 8.7, -10]} r={[0.1, 1.6]} h={2.4} seg={8} c="#d8a21e" m={0.5} rg={0.4} />
      <Cyl p={[18, 10.9, -12]} r={[0.1, 1.9]} h={2.8} seg={8} c="#d8a21e" m={0.5} rg={0.4} />

      {/* the table, the scales, the evidence */}
      <Box p={[0, 0.45, 1.4]} s={[3.2, 0.9, 1.3]} c="#7a5330" />
      <Box p={[0, 0.92, 1.4]} s={[3.3, 0.06, 1.4]} c="#946a3c" />
      <group position={[0, 0.02, 1.4]}>
        <Balance tilt={tilt} />
      </group>
      {outcome === "scales" && (
        <Sph p={[-1.1, 1.08, 1.4]} r={0.14} sc={[1, 0.8, 1]} c="#8a2a20" e="#ff3a1f" ei={1.1} />
      )}
      {outcome === "fine" &&
        [0, 1, 2, 3].map((i) => <Cyl key={i} p={[1.1 + i * 0.01, 0.97 + i * 0.03, 1.5]} r={[0.07, 0.07]} h={0.02} c={GOLD} m={0.9} rg={0.25} />)}
      {(outcome === "audit" || !outcome) &&
        [0, 1].map((i) => <Cyl key={i} p={[-1.1 + i * 0.3, 1.0, 1.1]} r={[0.05, 0.05]} h={0.5} rot={[0, 0, Math.PI / 2]} c="#efe0b6" />)}
      <Box p={[-4.4, 0.4, 2.6]} s={[1.1, 0.8, 0.8]} c="#946a3c" />
      {["#c0392b", "#2f6b8a", "#e0a82e"].map((c, i) => (
        <Cyl key={i} p={[-4.4, 0.92 + i * 0.28, 2.6]} r={[0.26, 0.26]} h={0.7} rot={[0, 0, Math.PI / 2]} c={c} rg={1} />
      ))}

      {outcome === "audit" &&
        [-1.9, 1.9].map((x, i) => (
          <Person key={i} p={[x < 0 ? -6 : 6, 0, 5]} goTo={[x, 2.9]} speed={1.3} ry={Math.PI} cloth="#f1e8d0" top={i ? "#7a3b8c" : "#2f6b6b"} turban="#f1e8d0" beard="#e6e0d2" hold="scroll" skin="#a8744a" phase={i} />
        ))}

      <Person p={[-2.4, 0, 1.9]} ry={1.15} skin="#a8744a" cloth="#d8cdb0" top="#c4552b" turban="#e0a82e" jewel mood={outcome === "scales" ? "sad" : outcome === "fine" ? "sad" : outcome === "audit" ? "worried" : "stern"} pose={outcome === "scales" || outcome === "fine" ? "bow" : "talk"} talking={T("m1") && !outcome} hy={0.2} phase={0.5} />
      <Person p={[2.4, 0, 1.9]} ry={-1.15} skin="#8f6240" cloth="#d8cdb0" top="#2f6b6b" turban="#2f6b8a" hold="ledger" mood={outcome === "scales" ? "happy" : outcome === "fine" ? "sad" : outcome === "audit" ? "worried" : "stern"} pose={outcome === "fine" ? "idle" : "hold"} talking={T("m2") && !outcome} hy={-0.2} phase={1.4} />
      <Person p={[0, 0, -0.8]} ry={0} skin="#b8845a" cloth="#f1e8d0" top="#7a1f1f" turban="#e0a82e" jewel beard="#d8d2c4" pose={outcome === "scales" ? "point" : outcome ? "idle" : "hold"} hold={outcome === "scales" ? undefined : "scroll"} mood="neutral" hy={0.1} />
      <Person p={[1.6, 0, -2.2]} ry={0} pose="guard" hold="spear" cloth="#7a1f1f" top="#8a6a2c" turban="#7a1f1f" skin="#a8744a" />
      <Person p={[-1.6, 0, -2.2]} ry={0} pose="guard" hold="spear" cloth="#7a1f1f" top="#8a6a2c" turban="#7a1f1f" skin="#b8845a" phase={1} />
      {ring.map((c, i) => (
        <Person
          key={i}
          lite
          p={c.p}
          ry={c.ry}
          skin={c.skin}
          cloth={c.female ? c.sari : c.cloth}
          top={c.female ? undefined : c.top}
          female={c.female}
          veil={c.female ? c.sari : undefined}
          mood={crowdMood}
          pose={outcome === "scales" && i % 3 === 0 ? "cheer" : "idle"}
          phase={c.phase}
        />
      ))}
      <Person p={[-12, 0, 8]} patrol={[[-12, 8], [12, 8]]} lite speed={0.8} cloth="#d8cdb0" top="#2f6b8a" skin="#b8845a" turban="#c0392b" hold="paper" />
      <Person p={[10, 0, 6]} patrol={[[10, 6], [-10, 6]]} lite speed={0.7} female cloth="#a1432b" veil="#a1432b" skin="#a8744a" />
      <Person p={[-8, 0, 4]} patrol={[[-8, 4], [-8, -3], [-6, -3]]} lite speed={0.6} cloth="#e3d3a8" skin="#8f6240" turban="#e0a82e" />
      <Floaters count={50} area={[26, 6, 22]} pos={[0, 3, 0]} color="#fff0c0" size={0.07} fall={0.03} drift={0.8} opacity={0.5} />
    </>
  );
}

/* =========================================================
   SITUATION III — THE VILLAGE'S WATER
   ========================================================= */

function FlowPlane({ p, size, rep = [1, 6], axis = "y", speed = 0.2, width = 1, wide = "y" }) {
  const t = useTex("water", 256, 256, rep);
  const m = useRef();
  const cur = useRef(width);
  useFrame((_, dt) => {
    if (axis === "y") t.offset.y -= dt * speed;
    else t.offset.x += dt * speed;
    cur.current += (width - cur.current) * Math.min(1, dt * 1.2);
    if (m.current) {
      if (wide === "y") m.current.scale.y = Math.max(0.05, cur.current);
      else m.current.scale.x = Math.max(0.05, cur.current);
    }
  });
  return (
    <mesh ref={m} position={p} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={t} roughness={0.18} metalness={0.25} color="#cfeff0" transparent opacity={0.92} />
    </mesh>
  );
}

function Gate({ x, open }) {
  const slab = useRef();
  const cur = useRef(open);
  useFrame((_, dt) => {
    cur.current += (open - cur.current) * Math.min(1, dt * 1.1);
    if (slab.current) slab.current.position.y = 0.45 + cur.current * 1.1;
  });
  return (
    <group position={[x, 0, -5]}>
      {[-1.0, 1.0].map((z) => (
        <Box key={z} p={[0, 0.9, z]} s={[0.34, 1.8, 0.3]} c="#9c8a6a" rg={1} />
      ))}
      <Box p={[0, 1.85, 0]} s={[0.34, 0.2, 2.3]} c="#8a7858" rg={1} />
      <group ref={slab}>
        <Box s={[0.14, 1.1, 1.74]} c="#5a3a1c" rg={0.9} />
      </group>
      <Cyl p={[0, 2.15, 0]} r={[0.2, 0.2]} h={0.08} rot={[Math.PI / 2, 0, 0]} c="#3a2614" />
    </group>
  );
}

function Channel({ side, g }) {
  return (
    <group position={[side * 6.8, 0, -5]}>
      <Box p={[0, 0.05, 0]} s={[8.4, 0.1, 2]} c="#8a7858" rg={1} />
      {[-1, 1].map((z) => (
        <Box key={z} p={[0, 0.36, z * 0.98]} s={[8.4, 0.7, 0.22]} c="#a39070" rg={1} />
      ))}
      <FlowPlane p={[0, 0.3, 0]} size={[8.3, 1.7]} rep={[3, 1]} axis="x" speed={-side * 0.45 * (0.3 + g)} width={g} wide="y" />
    </group>
  );
}

function StoneSluice({ show }) {
  const ref = useRef();
  const wheel = useRef();
  useFrame(({ clock }, dt) => {
    const target = show ? 1 : 0.001;
    if (ref.current) {
      const s = ref.current.scale.x + (target - ref.current.scale.x) * Math.min(1, dt * 1.4);
      ref.current.scale.set(s, s, s);
    }
    if (wheel.current) wheel.current.rotation.z = clock.elapsedTime * 0.3;
  });
  return (
    <group ref={ref} position={[0, 0, -9]} scale={0.001}>
      {[-2.9, 2.9].map((x) => (
        <Box key={x} p={[x, 1.4, 0]} s={[1.1, 2.8, 1.4]} c="#b3a07c" rg={1} />
      ))}
      <Box p={[0, 3.0, 0]} s={[7.4, 0.4, 1.5]} c="#a39070" rg={1} />
      <Box p={[0, 3.35, 0]} s={[7.8, 0.14, 1.7]} c={GOLD_DEEP} m={0.4} rg={0.5} />
      <Box p={[0, 2.0, 0]} s={[4.6, 0.6, 0.5]} c="#6b4a2a" />
      <group ref={wheel} position={[0, 3.9, 0.9]}>
        <Tor a={[0.5, 0.06]} c="#5a3a1c" m={0.1} rg={0.8} />
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} s={[1, 0.06, 0.06]} c="#5a3a1c" rot={[0, 0, (i * Math.PI) / 4]} />
        ))}
      </group>
      <Box p={[-3.9, 0.9, 1.8]} s={[0.4, 1.8, 0.8]} c="#c3b08c" rg={1} />
      <Box p={[-3.9, 1.5, 2.22]} s={[0.3, 0.9, 0.02]} c="#6b5a3a" />
    </group>
  );
}

function WaterScene({ outcome, speaker }) {
  const T = (id) => speaker === id;
  const g = { l: 0.3, r: 1 };
  if (outcome === "equal") Object.assign(g, { l: 0.6, r: 0.6 });
  if (outcome === "need") Object.assign(g, { l: 1, r: 0.28 });
  if (outcome === "council") Object.assign(g, { l: 0.85, r: 0.85 });
  const left = !outcome ? "dry" : outcome === "equal" ? "thin" : "green";
  const right = !outcome ? "green" : outcome === "equal" ? "thin" : outcome === "need" ? "partial" : "green";
  return (
    <>
      <Env
        sky={["#4f8fd4", "#f6dfa6", "#c9b888"]}
        fog={["#ecd9a8", 40, 120]}
        amb={["#fff0cf", 0.55]}
        hemi={["#bfe0ff", "#7a6a3a", 0.6]}
        sun={{ pos: [14, 18, 10], color: "#ffe2aa", int: 1.9 }}
        shadowSize={30}
      />
      <Ground tex="grass" rep={[16, 16]} c="#e6dcaa" />
      <Hills list={[[-50, -60, 22, 16, "#7f9a64"], [0, -75, 26, 20, "#8aa370"], [52, -62, 22, 16, "#7a9460"], [-24, -45, 12, 8, "#93ab78"], [26, -48, 13, 9, "#8aa370"]]} />
      {/* river */}
      <Box p={[-2.75, 0.17, -8]} s={[0.4, 0.4, 46]} c="#9c8a6a" rg={1} />
      <Box p={[2.75, 0.17, -8]} s={[0.4, 0.4, 46]} c="#9c8a6a" rg={1} />
      <Box p={[0, -0.05, -8]} s={[5.2, 0.2, 46]} c="#4a3a28" rg={1} />
      <FlowPlane p={[0, 0.1, -8]} size={[5, 46]} rep={[1, 8]} axis="y" speed={0.25} />
      <Channel side={-1} g={g.l} />
      <Channel side={1} g={g.r} />
      <Gate x={-2.9} open={g.l} />
      <Gate x={2.9} open={g.r} />
      <StoneSluice show={outcome === "council"} />
      {/* bridge */}
      <Box p={[0, 0.5, 3]} s={[7.4, 0.22, 1.9]} c="#a39070" rg={1} />
      {[-3.2, 3.2].map((x) => (
        <Box key={x} p={[x, 0.25, 3]} s={[0.8, 0.5, 1.9]} c="#8a7858" rg={1} />
      ))}
      {[-0.9, 0.9].map((z) => (
        <group key={z}>
          <Box p={[0, 1.15, 3 + z]} s={[7, 0.09, 0.09]} c="#6b4a2a" />
          {[-3, -1.5, 0, 1.5, 3].map((x) => (
            <Box key={x} p={[x, 0.85, 3 + z]} s={[0.09, 0.7, 0.09]} c="#6b4a2a" />
          ))}
        </group>
      ))}
      {/* fields */}
      <Crops at={[-15, 0, -9]} cols={12} rows={5} gap={0.62} state={left} speed={0.3} />
      <Crops at={[-15, 0, -1]} cols={12} rows={4} gap={0.62} state={left} speed={0.3} />
      <Crops at={[15, 0, -9]} cols={12} rows={5} gap={0.62} state={right} speed={0.3} />
      <Crops at={[15, 0, -1]} cols={12} rows={4} gap={0.62} state={right} speed={0.3} />
      {/* settlements */}
      {[[-25, -4, 0.4], [-22, 3, -0.3], [-28, -9, 0.2], [-20, -12, 0.8]].map(([x, z, ry], i) => (
        <Hut key={`a${i}`} p={[x, 0, z]} ry={ry} s={0.9} wall="#b09068" />
      ))}
      {[[25, -4, -0.4], [22, 3, 0.3], [28, -9, -0.2], [20, -12, -0.8]].map(([x, z, ry], i) => (
        <Hut key={`b${i}`} p={[x, 0, z]} ry={ry} s={0.9} wall="#bd9a70" thatch="#9a7c3a" />
      ))}
      <Tree p={[-9, 0, 6]} s={1.1} ph={1} />
      <Tree p={[9, 0, 7]} s={1.2} ph={2} />
      <Tree p={[-18, 0, 7]} s={1.3} ph={3} />
      <Tree p={[19, 0, 6]} s={1.2} ph={4} />
      <Tree p={[-5, 0, -14]} s={1.5} ph={5} />
      <Tree p={[6, 0, -15]} s={1.4} ph={6} />

      {/* people */}
      <Person p={[-3.9, 0, 1.3]} ry={Math.PI / 2 - 0.3} cloth="#d8cdb0" top="#8a5a3a" turban="#cdbf9a" beard="#e6e0d2" skin="#9c6a44" pose={outcome === "need" ? "namaste" : outcome === "council" ? "namaste" : "point"} mood={outcome === "need" || outcome === "council" ? "happy" : outcome === "equal" ? "neutral" : "stern"} talking={T("eA") && !outcome} hy={0} />
      <Person p={[-4.9, 0, 3.0]} ry={1.1} cloth="#d8cdb0" turban="#cdbf9a" skin="#a8744a" pose={outcome ? "idle" : "plead"} mood={outcome === "need" || outcome === "council" ? "happy" : outcome === "equal" ? "neutral" : "sad"} phase={1} />
      <Person p={[-5.5, 0, 0.1]} ry={1.0} cloth="#cfc0a0" top="#6b8a5c" skin="#8f6240" pose={outcome === "need" || outcome === "council" ? "cheer" : "fold"} mood={outcome === "need" || outcome === "council" ? "happy" : "stern"} phase={2} />
      <Person p={[-6.1, 0, 2.0]} ry={1.1} female cloth="#a1432b" veil="#a1432b" skin="#9c6a44" mood={outcome === "need" || outcome === "council" ? "happy" : "sad"} phase={3} />
      <Person p={[3.9, 0, 1.3]} ry={-Math.PI / 2 + 0.3} cloth="#e3d3a8" top="#2f6b6b" turban="#e0a82e" beard="#d8d2c4" skin="#a8744a" pose={outcome === "need" ? "fold" : outcome === "council" ? "namaste" : "fold"} mood={outcome === "need" ? "sad" : outcome === "council" ? "happy" : outcome === "equal" ? "neutral" : "stern"} talking={T("eB") && !outcome} hy={0} phase={1} />
      <Person p={[4.9, 0, 3.0]} ry={-1.1} cloth="#e3d3a8" turban="#e0a82e" skin="#b8845a" pose={outcome === "need" ? "idle" : "plead"} mood={outcome === "need" ? "sad" : outcome === "council" ? "happy" : outcome === "equal" ? "neutral" : "stern"} phase={4} />
      <Person p={[5.5, 0, 0.1]} ry={-1.0} cloth="#e3d3a8" top="#7a3b8c" skin="#8f6240" pose="fold" mood={outcome === "need" ? "sad" : outcome === "council" ? "happy" : "stern"} phase={5} />
      <Person p={[6.1, 0, 2.0]} ry={-1.1} female cloth="#2f6b8a" veil="#2f6b8a" skin="#a8744a" mood={outcome === "need" ? "sad" : outcome === "council" ? "happy" : "worried"} phase={6} />
      <Person p={[-7.2, 0, -3.6]} ry={Math.PI} pose="bend" cloth="#d8cdb0" turban="#cdbf9a" skin="#9c6a44" phase={2} />
      <Person p={[7.2, 0, -3.6]} ry={Math.PI} pose="bend" cloth="#e3d3a8" turban="#e0a82e" skin="#b8845a" phase={3} />
      <Person p={[0, 0.62, 3.1]} ry={0.1} cloth="#f1e8d0" top="#2f6b6b" turban="#c0392b" jewel beard="#d8d2c4" skin="#a8744a" hold="scroll" pose="hold" mood="neutral" talking={speaker === "gate"} phase={4} />
      <Person p={[-0.9, 0, 5.1]} ry={0.2} lite cloth="#7a1f1f" top="#8a6a2c" turban="#7a1f1f" hold="spear" pose="guard" skin="#a8744a" />
      <Person p={[0.9, 0, 5.1]} ry={-0.2} lite cloth="#7a1f1f" top="#8a6a2c" turban="#7a1f1f" hold="spear" pose="guard" skin="#b8845a" phase={1} />
      {outcome === "council" && (
        <>
          <Person p={[-2.2, 0, 7.5]} goTo={[-3.1, 3.5]} ry={Math.PI / 2} cloth="#d8cdb0" top="#8a5a3a" turban="#cdbf9a" skin="#9c6a44" pose="namaste" mood="happy" />
        </>
      )}
      <Floaters count={50} area={[30, 6, 26]} pos={[0, 3, -2]} color="#fff0c0" size={0.07} fall={0.03} drift={0.8} opacity={0.5} />
    </>
  );
}

/* =========================================================
   SITUATION IV — THE UNHEARD CITIZEN
   ========================================================= */

function CorridorScene({ outcome, speaker, shot }) {
  const T = (id) => speaker === id;
  const tile = useTex("tile", 512, 512, [4, 14]);
  const carpet = useTex("carpet", 256, 512, [1, 6]);
  const sunTex = useTex("sun", 512, 640);
  const ramaGo = outcome === "open" ? [0.5, -1.4] : shot === "rama" ? [0.2, -2.8] : undefined;
  const moodAll = outcome === "open" ? "happy" : outcome ? "sad" : "worried";
  const offMood = outcome === "open" ? "worried" : outcome === "inquiry" ? "worried" : outcome === "quiet" ? "smug" : "smug";
  return (
    <>
      <Env fog={["#2a1608", 12, 46]} amb={["#ffcf9a", 0.6]} hemi={["#ffe0b0", "#4a2a14", 0.6]} sun={{ pos: [3, 12, 8], color: "#ffd9a0", int: 1.0 }} shadowSize={20} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[11, 34]} />
        <meshStandardMaterial map={tile} roughness={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]} receiveShadow>
        <planeGeometry args={[2.1, 32]} />
        <meshStandardMaterial map={carpet} roughness={0.9} />
      </mesh>
      <Box p={[0, 7.2, -1]} s={[11, 0.4, 34]} c="#3a1d0e" rg={1} cast={false} />
      {[-14, -10, -6, -2, 2, 6, 10, 14].map((z) => (
        <Box key={z} p={[0, 6.8, z]} s={[11, 0.35, 0.45]} c="#6b3a1c" cast={false} />
      ))}
      <Box p={[-5.5, 3.6, -1]} s={[0.4, 7.2, 34]} c="#8a5a34" rg={0.9} />
      <Box p={[5.5, 3.6, -1]} s={[0.4, 7.2, 34]} c="#8a5a34" rg={0.9} />
      {[-12, -8, -4, 0, 4, 8, 12].map((z) => (
        <group key={z}>
          <Box p={[-5.25, 2.4, z]} s={[0.12, 3.2, 2.2]} c="#4a2a14" cast={false} />
          <Box p={[5.25, 2.4, z]} s={[0.12, 3.2, 2.2]} c="#4a2a14" cast={false} />
          <Box p={[-5.2, 2.4, z]} s={[0.05, 3.0, 2.0]} c="#c28a4a" e="#ffb45a" ei={0.15} cast={false} />
          <Box p={[5.2, 2.4, z]} s={[0.05, 3.0, 2.0]} c="#c28a4a" e="#ffb45a" ei={0.15} cast={false} />
        </group>
      ))}
      {[-12, -9, -6, -3, 0, 3, 6, 9, 12].map((z, i) => (
        <group key={z}>
          <Pillar p={[-3.7, 0, z]} h={6.2} w={0.38} />
          <Pillar p={[3.7, 0, z]} h={6.2} w={0.38} />
          {i % 2 === 0 && <HangLamp p={[0, 6.0, z]} len={0.9} ph={i} />}
        </group>
      ))}
      {[-8, -1, 6].map((z, i) => (
        <pointLight key={z} position={[0, 5, z]} color="#ffb766" intensity={1.7} distance={13} decay={1.5} />
      ))}
      {/* the entrance, bright with day */}
      <Box p={[0, 3.6, 15.8]} s={[11, 7.2, 0.5]} c="#6e4426" rg={0.9} />
      <mesh position={[0, 3, 15.5]}>
        <planeGeometry args={[4.4, 6]} />
        <meshBasicMaterial color="#fff0c8" />
      </mesh>
      <pointLight position={[0, 3.5, 13]} color="#ffe9c0" intensity={2.2} distance={20} decay={1.3} />
      <LightShaft p={[0, 3, 10]} rot={[Math.PI / 2 - 0.1, 0, 0]} w={3.6} h={10} op={0.1} />
      {/* the royal end */}
      <Box p={[0, 3.6, -16.2]} s={[11, 7.2, 0.5]} c="#6e4426" rg={0.9} />
      <mesh position={[0, 4.4, -15.9]}>
        <planeGeometry args={[4.4, 5.6]} />
        <meshStandardMaterial map={sunTex} emissive="#5a2010" emissiveIntensity={0.4} />
      </mesh>
      {[0.25, 0.5].map((y, i) => (
        <Cyl key={i} p={[0, y - 0.125, -13.5]} r={[3.6 - i * 0.7, 3.7 - i * 0.7]} h={0.26} seg={12} c={i ? "#a8782c" : "#c49a62"} m={i ? 0.3 : 0} rg={0.5} />
      ))}
      <Box p={[0, 1.0, -14]} s={[2.4, 0.5, 1.1]} c="#7d1c1c" />
      <Box p={[0, 2.5, -14.8]} s={[2.4, 2.6, 0.25]} c="#7d1c1c" />
      <Tor p={[0, 3.7, -14.65]} a={[1.3, 0.08]} arc={Math.PI} c={GOLD} m={0.85} rg={0.25} />
      <pointLight position={[0, 3, -11]} color="#ffbe72" intensity={2.2} distance={18} decay={1.4} />
      {/* the wall of the revenue office */}
      <Box p={[-5.1, 1.5, -3]} s={[0.3, 3, 1.8]} c="#2c1a0e" />
      <Box p={[-5.0, 3.4, -3]} s={[0.4, 0.5, 2.2]} c={GOLD_DEEP} m={0.4} />

      {/* Rama listens */}
      <Person p={[0, 0, -8.6]} goTo={ramaGo} speed={0.85} ry={0} skin={RAMA_SKIN} cloth="#e6b43a" sash="#b8332a" jewel crown halo hair="#1a110a" mood={outcome === "quiet" ? "worried" : "neutral"} hy={0} />
      {/* the potter */}
      <Person p={[0.3, 0, 1.6]} ry={Math.PI - 0.15} skin="#8f6240" cloth="#c9b690" top="#8a7a5a" hair="#2a2018" mood={outcome === "open" ? "happy" : outcome === "quiet" ? "sad" : outcome === "inquiry" ? "neutral" : "sad"} pose={outcome === "quiet" ? "bow" : outcome ? "namaste" : "plead"} hold={outcome ? undefined : "paper"} talking={T("citizen") && !outcome} hy={0.15} phase={1} />
      {/* the herald */}
      <Person p={[1.9, 0, 3.3]} ry={Math.PI} cloth="#f1e8d0" top="#7a1f1f" turban="#e0a82e" jewel hold="staff" pose="idle" mood="neutral" talking={T("herald")} phase={2} skin="#b8845a" />
      {/* the influential official and attendants */}
      <Person p={outcome === "open" ? [-2.8, 0, -1.4] : [-2.8, 0, -1.4]} goTo={outcome === "open" ? [-0.9, 0.5] : undefined} ry={0.85} cloth="#7a3b8c" top="#5b1f3a" turban="#c0392b" jewel sash="#d8b04e" beard="#c8c2b4" skin="#b8845a" pose={outcome === "open" ? "bow" : outcome === "quiet" ? "fold" : "fold"} mood={offMood} talking={T("official") && !outcome} hy={-0.1} phase={1.2} />
      <Person p={[-3.7, 0, -0.1]} goTo={outcome === "inquiry" ? [-3, 6] : outcome === "open" ? [-4, -2.6] : undefined} ry={0.9} cloth="#efe4c6" top="#2f6b6b" turban="#e0a82e" skin="#a8744a" pose="fan" hold="fan" mood="neutral" phase={2.5} />
      <Person p={[-1.9, 0, -0.4]} goTo={outcome === "inquiry" ? [-3.2, 7.4] : outcome === "open" ? [-3.4, -3.8] : undefined} ry={0.7} cloth="#efe4c6" top="#b8532c" turban="#7a3b8c" skin="#8f6240" hold="scroll" pose="hold" mood="neutral" phase={3} />
      {outcome === "quiet" && <Person p={[-1.9, 0, -1.0]} goTo={[0.95, 1.2]} ry={0.9} cloth="#efe4c6" top="#2f6b6b" turban="#e0a82e" skin="#a8744a" hold="purse" pose="hold" mood="neutral" />}
      {outcome === "inquiry" && <Person p={[0.4, 0, 13]} goTo={[-4.1, -3]} speed={1.5} ry={Math.PI} cloth="#f1e8d0" top="#2f6b6b" turban="#f1e8d0" beard="#e6e0d2" skin="#a8744a" hold="scroll" pose="hold" mood="neutral" />}
      {/* waiting citizens */}
      {[4, 5.6, 7.2, 8.8].map((z, i) => (
        <Person key={z} lite p={[2.8, 0, z]} ry={-Math.PI / 2 - 0.2} sit pose="sit" skin={SKINS[i]} cloth={["#d8cdb0", "#c9b690", "#e3d3a8", "#cdbf9a"][i]} female={i === 2} veil={i === 2 ? "#a1432b" : undefined} turban={i === 0 ? "#cdbf9a" : undefined} mood={moodAll} phase={i} />
      ))}
      {/* guards */}
      {[-1.8, 1.8].map((x, i) => (
        <Person key={x} p={[x, 0, 12.2]} ry={Math.PI} pose="guard" hold="spear" cloth="#7a1f1f" top="#8a6a2c" turban="#7a1f1f" skin="#b8845a" phase={i} />
      ))}
      {[-1.8, 1.8].map((x, i) => (
        <Person key={`d${x}`} p={[x, 0, -6.2]} ry={0} pose="guard" hold="spear" cloth="#7a1f1f" top="#8a6a2c" turban="#7a1f1f" skin="#a8744a" phase={i + 2} />
      ))}
      <Floaters count={60} area={[8, 6, 28]} pos={[0, 3, -1]} color="#fff0c0" size={0.07} fall={0.03} drift={0.5} opacity={0.55} />
    </>
  );
}

/* =========================================================
   SITUATION V — THE FAMILY IN NEED
   ========================================================= */

function Diya({ p, light = false, size = 0.06, ph = 0 }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.03, 0]} r={[0.09, 0.05]} h={0.06} c="#b4562c" rg={0.9} />
      <Flame p={[0, 0.1, 0]} size={size} light={light} intensity={1.1} dist={8} ph={ph} />
    </group>
  );
}

function Loom({ p, ry = 0 }) {
  const cloth = useRef();
  useFrame(({ clock }) => {
    if (cloth.current) cloth.current.scale.y = 0.6 + (Math.sin(clock.elapsedTime * 0.4) * 0.5 + 0.5) * 0.15;
  });
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {[-0.9, 0.9].map((x) => (
        <Box key={x} p={[x, 0.95, 0]} s={[0.12, 1.9, 0.12]} c="#6b4526" />
      ))}
      <Box p={[0, 1.88, 0]} s={[2, 0.12, 0.16]} c="#6b4526" />
      <Box p={[0, 0.3, 0.1]} s={[2, 0.1, 0.16]} c="#6b4526" />
      {Array.from({ length: 16 }, (_, i) => (
        <Box key={i} p={[-0.8 + i * 0.107, 1.2, 0.02]} s={[0.012, 1.4, 0.012]} c={["#d8b04e", "#c0392b", "#2f6b8a", "#efe0b6"][i % 4]} cast={false} />
      ))}
      <group ref={cloth} position={[0, 0.4, 0.04]}>
        <Box p={[0, 0.4, 0]} s={[1.72, 0.8, 0.03]} c="#c0392b" rg={1} />
        <Box p={[0, 0.72, 0.02]} s={[1.72, 0.12, 0.03]} c="#d8b04e" rg={0.8} />
      </group>
      <Box p={[0, 0.25, 0.7]} s={[1.2, 0.3, 0.5]} c="#7a5330" />
    </group>
  );
}

function HomeScene({ outcome, speaker }) {
  const T = (id) => speaker === id;
  const joy = outcome ? "happy" : "sad";
  return (
    <>
      <Env
        sky={["#26264f", "#e08a5a", "#f4b878"]}
        fog={["#6b4a4a", 20, 70]}
        amb={["#ffb98a", 0.45]}
        hemi={["#8a7aa8", "#5a3a2a", 0.5]}
        sun={{ pos: [-12, 8, 10], color: "#ff9a5a", int: 1.2 }}
        shadowSize={16}
      />
      <Ground tex="dirt" rep={[10, 10]} c="#bfa07a" />
      <Hills list={[[-40, -55, 18, 12, "#4a5a50"], [20, -60, 24, 16, "#42554a"], [58, -50, 20, 12, "#4a5a50"]]} />
      {/* courtyard walls */}
      <Box p={[0, 0.8, -6]} s={[12, 1.6, 0.4]} c="#a07a52" rg={1} />
      <Box p={[-6, 0.8, 0]} s={[0.4, 1.6, 12.4]} c="#a07a52" rg={1} />
      <Box p={[6, 0.8, 0]} s={[0.4, 1.6, 12.4]} c="#a07a52" rg={1} />
      <Box p={[-3.9, 0.7, 6]} s={[4.2, 1.4, 0.4]} c="#a07a52" rg={1} />
      <Box p={[3.9, 0.7, 6]} s={[4.2, 1.4, 0.4]} c="#a07a52" rg={1} />
      {[-1.9, 1.9].map((x) => (
        <Box key={x} p={[x, 1.1, 6]} s={[0.4, 2.2, 0.5]} c="#8a6a44" />
      ))}
      <Box p={[0, 2.3, 6]} s={[4.2, 0.25, 0.6]} c="#6b4526" />
      <Hut p={[0, 0, -4.2]} s={1.25} wall="#a98058" />
      {[-2.2, 2.2].map((x) => (
        <Cyl key={x} p={[x, 1.1, -2.1]} r={[0.07, 0.08]} h={2.2} c="#5b3d22" seg={8} />
      ))}
      <Box p={[0, 2.3, -2.9]} s={[5.4, 0.12, 2.2]} c="#a8843c" rot={[0.2, 0, 0]} rg={1} />
      <HangLamp p={[0, 2.1, -2.2]} len={0.2} light ph={1} />
      {/* household */}
      <Box p={[4.2, 0.25, -1.6]} s={[0.8, 0.5, 0.8]} c="#a8906a" />
      <Sph p={[4.2, 0.78, -1.6]} r={0.3} sc={[1, 1.1, 1]} c="#3f7f3a" rg={1} />
      <Box p={[-4.2, 0.35, -2.6]} s={[2.0, 0.08, 0.95]} c="#7a5330" />
      {[-0.9, 0.9].map((x) => [-0.4, 0.4].map((z) => <Cyl key={`${x}${z}`} p={[-4.2 + x, 0.17, -2.6 + z]} r={[0.05, 0.05]} h={0.35} c="#5b3d22" seg={6} />))}
      <Sph p={[-5.1, 0.35, -4.6]} r={0.36} sc={[1, 1.1, 1]} c="#a24a28" rg={0.8} />
      <Sph p={[-4.4, 0.3, -4.8]} r={0.3} sc={[1, 1.1, 1]} c="#9c4524" rg={0.8} />
      <Cyl p={[3.4, 0.2, -4.5]} r={[0.45, 0.45]} h={0.4} c="#8a8a82" rg={1} />
      {[[-3.0, 0.4, -1.4], [3.0, 0.4, -0.7], [-1.0, 0.4, -1.8], [1.0, 0.4, 4.8]].map((p, i) => (
        <Diya key={i} p={p} light={i < 2} ph={i} />
      ))}
      {[[-5.7, 1.45, -3], [5.7, 1.45, 2], [5.7, 1.45, -3.5], [-5.7, 1.45, 3]].map((p, i) => (
        <Diya key={`w${i}`} p={p} ph={i + 3} size={0.07} />
      ))}
      {(outcome === "work" || outcome === "council") &&
        [[-1.6, 0.04, 3.4], [2.4, 0.04, 3.2], [0.4, 0.04, 4.4], [-3.2, 0.04, 4.0]].map((p, i) => <Diya key={`n${i}`} p={p} light={i === 0} ph={i + 6} />)}

      {outcome === "gift" &&
        [0, 1, 2, 3].map((i) => <Sack key={i} p={[-1.0 + (i % 2) * 0.62, i > 1 ? 0.52 : 0, -1.3 - Math.floor(i / 2) * 0.1]} s={1.15} c={["#cdb97e", "#c4ae6e", "#d2bf88", "#bda06a"][i]} ry={i} />)}
      {outcome === "work" && <Loom p={[3.2, 0, 1.1]} ry={-0.5} />}

      {/* the family */}
      <Person p={[-0.4, 0, 0.3]} ry={0.45} skin="#8a5a3a" cloth="#cdbf9a" hair="#2a2018" beard="#4a4038" mood={outcome === "work" ? "happy" : outcome === "gift" ? "sad" : outcome ? "neutral" : "sad"} pose={outcome === "work" ? "namaste" : outcome === "council" ? "namaste" : outcome === "gift" ? "bow" : "plead"} goTo={outcome === "work" ? [2.2, 0.9] : undefined} talking={T("parent") && !outcome} hy={0.1} phase={1} />
      <Person p={[-2.4, 0, -0.9]} ry={0.5} sit pose="sit" female skin="#9c6a44" cloth="#a1432b" veil="#a1432b" mood={outcome === "gift" ? "worried" : joy} phase={2} />
      <Person p={[1.2, 0, -0.9]} ry={-0.2} s={0.55} sit pose="sit" skin="#9c6a44" cloth="#d8cdb0" mood={joy} phase={3} />
      <Person p={[2.0, 0, -0.4]} ry={-0.4} s={0.5} sit pose="sit" female skin="#9c6a44" cloth="#b03a5a" mood={joy} phase={4} />
      <Person p={[-3.3, 0, 1.4]} ry={1.0} female skin="#a8744a" cloth="#2f6b8a" veil="#2f6b8a" hold="bowl" pose="carry" mood="neutral" talking={T("neighbor")} phase={5} />
      <Person p={[0, 0, 8]} goTo={[0.9, 2.6]} speed={0.9} ry={Math.PI} cloth="#f1e8d0" top="#2f6b6b" turban="#c0392b" jewel beard="#d8d2c4" skin="#a8744a" hold={outcome ? undefined : "paper"} pose={outcome === "work" ? "point" : "hold"} mood="neutral" />
      {outcome === "council" &&
        [[-1.6, 3.6, 0.3], [0.2, 4.2, 0], [1.9, 3.7, -0.3], [3.2, 4.2, -0.6]].map(([x, z, ry], i) => (
          <Person key={i} p={[i % 2 ? 8 : -8, 0, 7]} goTo={[x, z]} ry={Math.PI + ry} speed={1.1} cloth={["#d8cdb0", "#e3d3a8", "#cfc0a0", "#d8cdb0"][i]} female={i % 2 === 0} veil={i % 2 === 0 ? SARIS[i] : undefined} top={i % 2 ? "#6b8a5c" : undefined} skin={SKINS[i]} hold={i === 0 || i === 1 ? "bowl" : undefined} pose={i < 2 ? "carry" : "namaste"} mood="happy" phase={i} />
        ))}
      <Floaters count={34} area={[12, 4, 12]} pos={[0, 2, 0]} color="#ffd27a" size={0.08} fall={-0.06} drift={0.6} opacity={0.9} />
    </>
  );
}

/* =========================================================
   SITUATION VI — THE MINISTER'S ADVICE
   ========================================================= */

function Doc({ outcome }) {
  const tex = useTex("doc", 512, 640);
  const g = useRef();
  const cur = useRef({ x: 0, y: 0.99, z: 3.5, ry: 0, s: 1 });
  useFrame((_, dt) => {
    const c = cur.current;
    const k = Math.min(1, dt * 1.5);
    const tx = outcome === "reject" ? 3.2 : 0;
    const tz = outcome === "reject" ? 6 : 3.5;
    c.x += (tx - c.x) * k;
    c.z += (tz - c.z) * k;
    c.ry += ((outcome === "reject" ? 1.2 : 0) - c.ry) * k;
    c.s += ((outcome === "reject" ? 0.6 : 1) - c.s) * k;
    if (g.current) {
      g.current.position.set(c.x, c.y, c.z);
      g.current.rotation.y = c.ry;
      g.current.scale.setScalar(c.s);
    }
  });
  if (outcome === "trial") return null;
  return (
    <group ref={g}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.0, 1.25]} />
        <meshStandardMaterial map={tex} roughness={0.95} />
      </mesh>
      {outcome === "tiered" && (
        <Tor p={[0.3, 0.02, 0.4]} a={[0.1, 0.02]} rot={[Math.PI / 2, 0, 0]} c={GOLD} e="#ffb43a" ei={0.9} />
      )}
    </group>
  );
}

function CouncilScene({ outcome, speaker }) {
  const T = (id) => speaker === id;
  const wood = useTex("wood", 256, 256, [2, 4]);
  const mapT = useTex("map", 512, 512);
  const city = useTex("city", 1024, 512);
  const sunTex = useTex("sun", 512, 640);
  const tile = useTex("tile", 512, 512, [6, 6]);
  const cityRef = useRef();
  const pile = useRef();
  const bright = outcome === "reject" ? 1.3 : outcome === "tiered" ? 1.15 : outcome ? 1.0 : 0.8;
  const pileS = outcome === "tiered" ? 1.0 : 0.6;
  useFrame((_, dt) => {
    if (cityRef.current) {
      const c = cityRef.current.material.color;
      c.r += (bright - c.r) * Math.min(1, dt * 1.2);
      c.g = c.r;
      c.b = c.r;
    }
    if (pile.current) {
      const s = pile.current.scale.y + (pileS - pile.current.scale.y) * Math.min(1, dt * 1.0);
      pile.current.scale.set(1, s, 1);
    }
  });
  const nod = outcome ? "neutral" : "neutral";
  return (
    <>
      <Env fog={["#1a0f0a", 12, 40]} amb={["#ffbb80", 0.3]} hemi={["#d9a070", "#2a1608", 0.4]} sun={{ pos: [3, 10, 6], color: "#ffc88a", int: 0.5 }} shadowSize={14} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 24]} />
        <meshStandardMaterial map={tile} roughness={0.6} color="#a88660" />
      </mesh>
      <Box p={[0, 7, 0]} s={[18, 0.4, 24]} c="#2a140a" cast={false} />
      {[-8, -4, 0, 4, 8].map((z) => (
        <Box key={z} p={[0, 6.6, z]} s={[18, 0.35, 0.5]} c="#5a2f16" cast={false} />
      ))}
      <Box p={[-9, 3.5, 0]} s={[0.4, 7, 24]} c="#6b3a1c" />
      <Box p={[9, 3.5, 0]} s={[0.4, 7, 24]} c="#6b3a1c" />
      <Box p={[0, 3.5, 11.5]} s={[18, 7, 0.4]} c="#6b3a1c" />
      {/* the night beyond the great window */}
      <mesh position={[0, 3.6, -9.8]} ref={cityRef}>
        <planeGeometry args={[11, 5.4]} />
        <meshBasicMaterial map={city} color="#cccccc" />
      </mesh>
      <Box p={[-6.3, 3.6, -9.9]} s={[2.4, 7.2, 0.6]} c="#6b3a1c" />
      <Box p={[6.3, 3.6, -9.9]} s={[2.4, 7.2, 0.6]} c="#6b3a1c" />
      <Box p={[0, 6.55, -9.9]} s={[11, 1.0, 0.6]} c="#6b3a1c" />
      <Box p={[0, 0.5, -9.9]} s={[11, 1.0, 0.6]} c="#6b3a1c" />
      <Tor p={[0, 5.6, -9.6]} a={[0.2, 0.05]} c={GOLD} />
      {[-5.8, -2.0, 2.0, 5.8].map((x) => (
        <Box key={x} p={[x, 3.6, -9.6]} s={[0.22, 5.4, 0.25]} c="#3a1d0e" cast={false} />
      ))}
      {/* pillars */}
      {[-6, -2, 2, 6].map((z) => (
        <group key={z}>
          <Pillar p={[-7.3, 0, z]} h={6.2} w={0.4} />
          <Pillar p={[7.3, 0, z]} h={6.2} w={0.4} />
        </group>
      ))}
      <mesh position={[0, 3.6, 11.2]}>
        <planeGeometry args={[4.2, 5.4]} />
        <meshStandardMaterial map={sunTex} emissive="#5a2010" emissiveIntensity={0.3} />
      </mesh>
      {/* the council table */}
      <Box p={[0, 0.9, 0.5]} s={[2.6, 0.18, 9.4]} c="#ffffff" map={wood} rg={0.55} />
      {[-4.0, 0, 4.0].map((z) => (
        <Box key={z} p={[0, 0.42, 0.5 + z]} s={[2.2, 0.84, 0.35]} c="#5a3a1c" />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.001, -0.9]} receiveShadow>
        <planeGeometry args={[1.9, 2.6]} />
        <meshStandardMaterial map={mapT} roughness={0.95} />
      </mesh>
      {[[-0.8, 1.06, 0.6], [0.8, 1.06, -0.3], [-0.7, 1.06, 2.2]].map((p, i) => (
        <Cyl key={i} p={p} r={[0.045, 0.045]} h={0.55} rot={[0, 0.4 + i, Math.PI / 2]} c="#efe0b6" />
      ))}
      <Doc outcome={outcome} />
      {outcome === "reject" && <Cyl p={[3.2, 1.1, 6.0]} r={[0.05, 0.05]} h={0.6} rot={[0, 0.4, Math.PI / 2]} c="#efe0b6" />}
      {[[-0.9, 3.8], [0.9, 1.6], [-0.9, -1.6]].map(([x, z], i) => (
        <group key={i} position={[x, 0.99, z]}>
          <Cyl p={[0, 0.05, 0]} r={[0.1, 0.12]} h={0.1} c="#b4562c" />
          <Flame p={[0, 0.16, 0]} size={0.06} intensity={1.7} dist={10} ph={i} />
        </group>
      ))}
      {[-5.2, 5.2].map((x, i) => (
        <group key={x} position={[x, 0, -6]}>
          <Cyl p={[0, 1.2, 0]} r={[0.05, 0.09]} h={2.4} c={GOLD_DEEP} m={0.7} rg={0.35} />
          <Cyl p={[0, 2.5, 0]} r={[0.22, 0.1]} h={0.18} c={GOLD} m={0.8} rg={0.3} />
          <Flame p={[0, 2.7, 0]} size={0.09} intensity={2.2} dist={14} ph={i * 2} />
        </group>
      ))}
      {/* treasury chest */}
      <group position={[-6.2, 0, 4.2]}>
        <Box p={[0, 0.4, 0]} s={[1.6, 0.8, 1]} c="#6b3a1c" />
        <Box p={[0, 0.82, 0]} s={[1.7, 0.1, 1.1]} c={GOLD_DEEP} m={0.6} rg={0.4} />
        <group ref={pile} position={[0, 0.88, 0]} scale={[1, 0.6, 1]}>
          {Array.from({ length: 14 }, (_, i) => (
            <Sph key={i} p={[Math.cos(i * 2.1) * (0.12 + (i % 4) * 0.12), 0.1 + (i % 3) * 0.1, Math.sin(i * 2.1) * (0.08 + (i % 3) * 0.1)]} r={0.16} sc={[1, 0.6, 1]} c={GOLD} m={0.9} rg={0.25} />
          ))}
        </group>
      </group>

      {/* Rama and Sita */}
      <Box p={[0, 0.25, -5.4]} s={[1.3, 0.5, 1.0]} c="#7d1c1c" />
      <Box p={[0, 1.4, -5.95]} s={[1.3, 2.2, 0.18]} c="#7d1c1c" />
      <Box p={[0, 2.55, -5.95]} s={[1.5, 0.12, 0.25]} c={GOLD} m={0.8} rg={0.3} />
      <Box p={[1.7, 0.2, -5.1]} s={[1.0, 0.4, 0.9]} c="#8a2a20" />
      <Box p={[1.7, 1.1, -5.55]} s={[1.0, 1.6, 0.16]} c="#8a2a20" />
      <Person p={[0, 0.5, -5.4]} sit pose="sit" skin={RAMA_SKIN} cloth="#e6b43a" sash="#b8332a" jewel crown halo hair="#1a110a" mood="neutral" talking={T("rama")} hy={0.05} />
      <Person p={[1.7, 0.4, -5.1]} sit pose="sit" female skin={SITA_SKIN} cloth="#e0861e" top="#2f8f6a" jewel halo veil="#e0861e" hair="#1a110a" mood={outcome === "reject" || outcome === "tiered" ? "happy" : "worried"} hy={-0.35} phase={2} />
      {/* ministers */}
      <Person p={[2.3, 0, 3.6]} ry={-1.2} cloth="#f1e8d0" top="#7a3b8c" turban="#e0a82e" beard="#d8d2c4" jewel skin="#a8744a" hold={outcome ? undefined : "scroll"} pose={outcome ? "idle" : "hold"} talking={T("minister") && !outcome} mood={outcome === "reject" ? "sad" : outcome === "tiered" ? "neutral" : outcome === "trial" ? "neutral" : "smug"} phase={1} />
      <Person p={[-2.2, 0, 2.2]} ry={1.0} cloth="#f1e8d0" top="#2f6b6b" turban="#c0392b" beard="#c8c2b4" skin="#8f6240" mood={nod} talking={T("min2")} pose={T("min2") ? "idle" : "fold"} phase={2} />
      <Person p={[-2.2, 0, 0.2]} ry={0.9} cloth="#f1e8d0" top="#b8532c" turban="#2f6b8a" skin="#b8845a" pose="fold" mood={outcome === "reject" ? "worried" : "neutral"} phase={3} />
      <Person p={[2.2, 0, 1.4]} ry={-1.0} cloth="#f1e8d0" turban="#f1e8d0" beard="#e6e0d2" skin="#a8744a" pose="fold" mood={outcome === "tiered" ? "happy" : "neutral"} phase={4} />
      <Person p={[2.2, 0, -1.0]} ry={-0.9} cloth="#f1e8d0" top="#c9a23c" turban="#7a3b8c" skin="#8f6240" pose="idle" mood="neutral" phase={5} />
      <Person p={[-2.2, 0, -2.0]} ry={0.8} cloth="#f1e8d0" top="#6b8a5c" turban="#e0a82e" beard="#d8d2c4" skin="#a8744a" pose="fold" mood="neutral" phase={6} />
      {outcome === "trial" && <Person p={[-0.5, 0, 5.2]} goTo={[0, 10]} speed={1.2} ry={0} cloth="#f1e8d0" top="#2f6b6b" turban="#c0392b" skin="#a8744a" hold="scroll" pose="hold" />}
      <Person p={[-1.2, 0, 9.4]} ry={Math.PI} lite pose="guard" hold="spear" cloth="#7a1f1f" top="#8a6a2c" turban="#7a1f1f" skin="#a8744a" />
      <Person p={[1.2, 0, 9.4]} ry={Math.PI} lite pose="guard" hold="spear" cloth="#7a1f1f" top="#8a6a2c" turban="#7a1f1f" skin="#b8845a" phase={1} />
      <Floaters count={40} area={[12, 5, 18]} pos={[0, 3, 0]} color="#ffd9a0" size={0.07} fall={-0.03} drift={0.5} opacity={0.6} />
    </>
  );
}

/* =========================================================
   CAMERA SHOTS PER ENVIRONMENT
   ========================================================= */

const SHOTS = {
  court: {
    wide: { from: [0, 4.4, 9.5], to: [0, 3.5, 5.5], look: [0, 2.2, -8], dur: 18 },
    speech: { from: [-2.6, 2.6, -3.2], to: [-1.3, 2.5, -5.4], look: [-0.5, 2.3, -9.6], dur: 16, fov: 36 },
    speech2: { from: [2.3, 2.8, -3.2], to: [1.2, 2.7, -5.4], look: [0.3, 2.3, -9.6], dur: 16, fov: 36 },
    final: { from: [0, 2.9, -4.2], to: [0, 8.4, 15], look: [0, 2.4, -9], lookTo: [0, 2.8, -4], dur: 30, fov: 46 },
  },
  farmer: {
    wide: { from: [2, 3.6, 11.5], to: [0.5, 3, 9.4], look: [-0.5, 1, -0.5], dur: 16 },
    farmer: { from: [-3.8, 1.9, 4.8], to: [-2.9, 1.8, 3.9], look: [-0.9, 1.5, 0.6], dur: 12, fov: 38 },
    official: { from: [5.2, 1.9, 3.9], to: [4.2, 1.8, 3.2], look: [1.9, 1.5, 0.5], dur: 12, fov: 38 },
    family: { from: [6.2, 1.7, 3.8], to: [5.4, 1.6, 3.1], look: [3.6, 1.0, -1.2], dur: 12, fov: 38 },
    decide: { from: [1, 4.2, 9.8], to: [1, 3.8, 8.8], look: [-0.5, 1, -0.5], dur: 14 },
    result: { from: [-3, 2.8, 7.6], to: [-1.2, 2.5, 6], look: [-3.5, 0.8, -2.5], dur: 14 },
  },
  market: {
    wide: { from: [0, 4.2, 12.5], to: [1, 3.6, 10.6], look: [0, 1.2, 0], dur: 16 },
    m1: { from: [-5, 1.9, 5.6], to: [-4.2, 1.85, 4.7], look: [-2.4, 1.5, 1.9], dur: 12, fov: 38 },
    m2: { from: [5, 1.9, 5.6], to: [4.2, 1.85, 4.7], look: [2.4, 1.5, 1.9], dur: 12, fov: 38 },
    official: { from: [0, 1.9, 4.8], to: [0, 1.8, 4], look: [0, 1.6, -0.8], dur: 12, fov: 38 },
    decide: { from: [0, 3.2, 9], to: [0, 3, 8.2], look: [0, 1.1, 1], dur: 14 },
    result: { from: [0, 2.6, 6.4], to: [0, 2.3, 5.4], look: [0, 1.1, 1.2], dur: 14 },
  },
  water: {
    wide: { from: [0, 6, 17], to: [1, 5, 14.5], look: [0, 1, -3], dur: 16 },
    left: { from: [-1.2, 2.4, 8], to: [-2, 2.2, 7], look: [-4.6, 1.4, 2], dur: 12, fov: 40 },
    right: { from: [1.2, 2.4, 8], to: [2, 2.2, 7], look: [4.6, 1.4, 2], dur: 12, fov: 40 },
    gate: { from: [0, 3.4, 7], to: [0, 3.0, 5.4], look: [0, 0.9, -5], dur: 12 },
    decide: { from: [0, 5.2, 15], to: [0, 4.6, 13.5], look: [0, 0.8, -3], dur: 14 },
    result: { from: [0, 4.2, 12.5], to: [0, 3.6, 10.2], look: [0, 0.8, -4], dur: 14 },
  },
  corridor: {
    wide: { from: [0, 3.2, 12.8], to: [0, 2.8, 9.6], look: [0, 1.8, -4], dur: 18 },
    herald: { from: [0.9, 1.8, -0.2], to: [1.2, 1.75, 0.6], look: [1.9, 1.6, 3.3], dur: 12, fov: 38 },
    citizen: { from: [-1.5, 1.7, -1.7], to: [-1.0, 1.65, -0.7], look: [0.3, 1.5, 1.6], dur: 12, fov: 36 },
    official: { from: [1.4, 1.8, 2.6], to: [0.9, 1.75, 1.9], look: [-2.8, 1.5, -1.4], dur: 12, fov: 38 },
    rama: { from: [1.3, 1.9, 4.2], to: [0.6, 1.8, 2.4], look: [0, 1.6, -6], lookTo: [0, 1.6, -3.4], dur: 14, fov: 38 },
    decide: { from: [0, 3.2, 10.4], to: [0, 3, 9.4], look: [0, 1.5, -3], dur: 14 },
    result: { from: [2.6, 2.5, 5.6], to: [1.8, 2.2, 3.8], look: [-0.5, 1.2, -1], dur: 14 },
  },
  home: {
    wide: { from: [0, 3.8, 11.8], to: [0, 3.2, 10.2], look: [0, 1, -1], dur: 16 },
    parent: { from: [1.9, 1.8, 3.7], to: [1.3, 1.75, 3.1], look: [-0.5, 1.5, 0.3], dur: 12, fov: 38 },
    neighbor: { from: [-1, 1.8, 4.8], to: [-1.6, 1.75, 4.1], look: [-3.3, 1.4, 1.4], dur: 12, fov: 38 },
    gate: { from: [-2, 1.9, 6.8], to: [-0.8, 1.8, 5.6], look: [0.2, 1.2, 3.8], dur: 12, fov: 40 },
    decide: { from: [0, 3.6, 10], to: [0, 3.3, 9], look: [0, 1, 0], dur: 14 },
    result: { from: [3.4, 2.6, 7.2], to: [1.8, 2.2, 5.8], look: [0, 0.9, 0.5], dur: 14 },
  },
  council: {
    wide: { from: [5.6, 3.6, 10.4], to: [4.4, 3.2, 8.8], look: [0, 1.2, -1.5], dur: 16 },
    minister: { from: [-1.7, 1.95, 6], to: [-1.3, 1.9, 5.3], look: [2.3, 1.6, 3.6], dur: 12, fov: 38 },
    close: { from: [0.2, 2.4, 5.8], to: [0.1, 1.75, 4.7], look: [0, 0.95, 3.5], dur: 10, fov: 40 },
    rama: { from: [-2.3, 1.9, -1.6], to: [-1.3, 1.85, -2.2], look: [0, 1.4, -5.4], dur: 12, fov: 38 },
    decide: { from: [0, 3.3, 9], to: [0, 3.1, 8.2], look: [0, 1.0, 0], dur: 14 },
    result: { from: [-4.2, 2.5, 7], to: [-3, 2.2, 5.6], look: [0, 1.2, 2.2], dur: 14 },
  },
};

const SCENES = {
  court: CourtScene,
  farmer: VillageScene,
  market: MarketScene,
  water: WaterScene,
  corridor: CorridorScene,
  home: HomeScene,
  council: CouncilScene,
};

const Stage = memo(function Stage({ scene, shotName, outcome, speaker, final }) {
  const Scene = SCENES[scene];
  const table = SHOTS[scene];
  const base = table[shotName] || table.wide;
  const shot = useMemo(() => ({ ...base, id: shotName }), [base, shotName]);
  return (
    <Canvas
      shadows
      dpr={[1, 1.35]}
      camera={{ fov: 42, near: 0.1, far: 300, position: [0, 3, 10] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
    >
      <Scene key={scene} outcome={outcome} speaker={speaker} final={final} shot={shotName} />
      <Rig shot={shot} scene={scene} />
    </Canvas>
  );
});

/* =========================================================
   UI PIECES
   ========================================================= */

function Petals({ n = 26 }) {
  const items = useMemo(() => {
    const r = seeded(91);
    return Array.from({ length: n }, (_, i) => ({
      left: r() * 100,
      delay: -r() * 18,
      dur: 11 + r() * 10,
      size: 8 + r() * 12,
      sway: 30 + r() * 80,
      hue: r() > 0.5 ? "#ff9db8" : "#ffc45a",
    }));
  }, [n]);
  return (
    <div className="duty-petals" aria-hidden="true">
      {items.map((p, i) => (
        <span key={i} style={{ left: `${p.left}%`, width: p.size, height: p.size * 0.7, background: p.hue, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, "--sway": `${p.sway}px` }} />
      ))}
    </div>
  );
}

function Intro({ onEnter, onAudio }) {
  const [step, setStep] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const text = step < 2 ? INTRO_LINES[step] : "";
  const tw = useTypewriter(text, 30, step < 2);
  const advance = () => {
    onAudio();
    if (step < 2) {
      if (!tw.done) tw.skip();
      else setStep((s) => s + 1);
    }
  };
  useEffect(() => {
    const k = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  return (
    <motion.section className="duty-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} onClick={step < 2 ? advance : undefined}>
      <div className="duty-intro__stage">
        {!imgFailed ? (
          <img className="duty-intro__img" src={THRONE_SRC} alt="Rama and Sita seated on the throne of Ayodhya" onError={() => setImgFailed(true)} draggable={false} />
        ) : (
          <div className="duty-intro__fallback" />
        )}
        <div className="duty-intro__glow duty-intro__glow--l" />
        <div className="duty-intro__glow duty-intro__glow--r" />
        <div className="duty-intro__rays" />
        <Petals />
        <div className="duty-intro__veil" />
      </div>

      <AnimatePresence mode="wait">
        {step < 2 ? (
          <motion.div key={`n${step}`} className="duty-intro__narr" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.7 }}>
            <p>
              {tw.shown}
              {!tw.done && <i className="duty-caret" />}
            </p>
            <button type="button" className="duty-hint" onClick={(e) => { e.stopPropagation(); advance(); }}>
              {tw.done ? "Continue" : "Skip"} <ArrowRight size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.div key="title" className="duty-intro__title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }}>
            <span className="duty-deva">राजधर्म</span>
            <motion.h1 initial={{ letterSpacing: "0.5em", opacity: 0 }} animate={{ letterSpacing: "0.12em", opacity: 1 }} transition={{ duration: 2.4, ease: "easeOut" }}>
              THE DUTY OF THE CROWN
            </motion.h1>
            <motion.em initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1.2 }}>
              Six moments that define a king.
            </motion.em>
            <motion.button type="button" className="duty-seal" onClick={onEnter} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.8, duration: 0.9 }}>
              Enter the Royal Court <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function Hud({ idx, phase, history, sound, onSound, onExit, situation }) {
  const inSituation = ["dialogue", "decide", "result"].includes(phase);
  return (
    <div className="duty-hud">
      <div className="duty-hud__left">
        <Crown size={16} />
        <span className="duty-hud__brand">Ancestra</span>
        {inSituation && situation && (
          <>
            <i />
            <span className="duty-hud__where">
              {situation.place}
              <small>{situation.time}</small>
            </span>
          </>
        )}
      </div>
      <div className="duty-hud__flames" aria-label="Six moments">
        {SITUATIONS.map((s, i) => {
          const done = history.length > i || phase === "final" || phase === "end";
          const live = inSituation && idx === i;
          return (
            <span key={s.key} className={`duty-flame ${done ? "is-done" : ""} ${live ? "is-live" : ""}`}>
              <FlameIcon size={15} />
            </span>
          );
        })}
      </div>
      <div className="duty-hud__btns">
        <button type="button" className="duty-hud__sound" onClick={onSound} aria-label={sound ? "Mute ambience" : "Play ambience"}>
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button type="button" className="duty-hud__sound" onClick={onExit} aria-label="Exit game" title="Exit (Esc)">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function Curtain({ card }) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div className="duty-curtain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
          <div className="duty-curtain__lotus" aria-hidden="true" />
          {card.kind === "situation" && (
            <motion.div className="duty-curtain__card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1 }}>
              <span className="duty-deva">राजधर्म</span>
              <small>{`Moment ${card.numeral} of VI`}</small>
              <h2>{card.title}</h2>
              <p className="duty-curtain__place">
                {card.place}, {card.time.toLowerCase()}
              </p>
              <em>{card.bridge}</em>
            </motion.div>
          )}
          {card.kind === "final" && (
            <motion.div className="duty-curtain__card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1 }}>
              <span className="duty-deva">धर्म</span>
              <h2>The Court Gathers Once More</h2>
              <em>Six petitions heard. The throne waits.</em>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   THE GAME
   ========================================================= */

export default function DutyOfTheCrownGame({ onComplete, onExit }) {
  const exit = onExit || onComplete;
  const [phase, setPhase] = useState("intro");
  const [idx, setIdx] = useState(0);
  const [line, setLine] = useState(0);
  const [sel, setSel] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [history, setHistory] = useState([]);
  const [curtain, setCurtain] = useState(null);
  const [sound, setSound] = useState(false);
  const busy = useRef(false);
  const timers = useRef([]);
  const muted = useRef(false);
  const ring = useAmbience(sound);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  const situation = SITUATIONS[idx];
  const chosen = situation.options.find((o) => o.id === outcome);

  const lines = useMemo(() => {
    if (phase === "court") return COURT_LINES;
    if (phase === "dialogue") return situation.lines;
    if (phase === "result" && chosen) {
      return [
        { who: "", id: null, shot: "result", text: chosen.result[0] },
        { who: "", id: null, shot: "result", text: chosen.reflect, reflect: true },
      ];
    }
    if (phase === "final" || phase === "end") return FINAL_LINES.map((t) => ({ who: "", id: null, shot: "final", text: t }));
    return [];
  }, [phase, situation, chosen]);

  const cur = lines[Math.min(line, lines.length - 1)];
  const textRun = ["court", "dialogue", "result", "final"].includes(phase) && !curtain;
  const tw = useTypewriter(cur ? cur.text : "", cur && cur.reflect ? 20 : 22, textRun);
  const speaker = cur && cur.id && textRun ? cur.id : null;

  const sceneKey = phase === "intro" ? null : ["court", "final", "end"].includes(phase) ? "court" : situation.key;
  const shotName = phase === "decide" ? "decide" : phase === "result" ? "result" : phase === "end" ? "final" : phase === "final" ? "final" : cur ? cur.shot : "wide";

  const go = (card, fn, hold = 3200) => {
    if (busy.current) return;
    busy.current = true;
    setCurtain(card || { kind: "plain" });
    timers.current.push(setTimeout(fn, 900));
    timers.current.push(
      setTimeout(() => {
        setCurtain(null);
        busy.current = false;
      }, hold)
    );
  };

  const startSituation = (i) => {
    const s = SITUATIONS[i];
    go({ kind: "situation", numeral: s.numeral, title: s.title, place: s.place, time: s.time, bridge: s.bridge }, () => {
      setIdx(i);
      setLine(0);
      setSel(null);
      setOutcome(null);
      setPhase("dialogue");
    }, 4600);
  };

  // after the intro image, go straight to the first petition (the opening court dialogue is skipped)
  const enterCourt = () => startSituation(0);

  const audio = () => {
    if (!muted.current && !sound) setSound(true);
  };

  const toggleSound = () => {
    muted.current = sound;
    setSound((s) => !s);
  };

  const advance = useCallback(() => {
    if (busy.current || !cur) return;
    if (!tw.done) {
      tw.skip();
      return;
    }
    if (line + 1 < lines.length) {
      setLine((l) => l + 1);
      return;
    }
    if (phase === "court") startSituation(0);
    else if (phase === "dialogue") setPhase("decide");
    else if (phase === "result") {
      if (idx < SITUATIONS.length - 1) startSituation(idx + 1);
      else
        go({ kind: "final" }, () => {
          setLine(0);
          setPhase("final");
        }, 3400);
    } else if (phase === "final") setPhase("end");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, tw, line, lines, phase, idx]);

  useEffect(() => {
    const k = (e) => {
      if (!["court", "dialogue", "result", "final"].includes(phase)) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [phase, advance]);

  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") exit && exit(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [exit]);

  const decree = () => {
    if (!sel) return;
    setOutcome(sel);
    setHistory((h) => [...h, { title: situation.title, choice: situation.options.find((o) => o.id === sel).title, icon: situation.icon }]);
    setLine(0);
    setPhase("result");
    ring();
  };

  const restart = () => {
    setIdx(0);
    setLine(0);
    setSel(null);
    setOutcome(null);
    setHistory([]);
    busy.current = false;
    startSituation(0);
  };

  const showPanel = ["court", "dialogue", "result", "final"].includes(phase) && !curtain && cur;

  return (
    <div className={`duty-game duty-phase--${phase}`}>
      {sceneKey && (
        <div className="duty-stage">
          <Stage scene={sceneKey} shotName={shotName} outcome={outcome} speaker={speaker} final={phase === "final" || phase === "end"} />
          <div className="duty-grain" aria-hidden="true" />
          <div className="duty-vignette" aria-hidden="true" />
          <div className="duty-bar duty-bar--t" aria-hidden="true" />
          <div className="duty-bar duty-bar--b" aria-hidden="true" />
        </div>
      )}

      <AnimatePresence>{phase === "intro" && <Intro key="intro" onEnter={enterCourt} onAudio={audio} />}</AnimatePresence>

      {phase !== "intro" && <Hud idx={idx} phase={phase} history={history} sound={sound} onSound={toggleSound} onExit={exit} situation={situation} />}
      {phase === "intro" && (
        <button type="button" className="duty-hud__sound duty-exit--float" onClick={exit} aria-label="Exit game" title="Exit (Esc)">
          <X size={16} />
        </button>
      )}

      <AnimatePresence mode="wait">
        {showPanel && (
          <motion.div key={`${phase}-${idx}-${line}`} className={`duty-panel ${cur.reflect ? "is-reflect" : ""}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.45 }} onClick={advance} role="button" tabIndex={0}>
            {cur.who && <span className="duty-panel__who">{cur.who}</span>}
            <p>
              {tw.shown}
              {!tw.done && <i className="duty-caret" />}
            </p>
            <span className={`duty-panel__next ${tw.done ? "is-on" : ""}`}>
              {phase === "result" && line + 1 >= lines.length ? (idx < SITUATIONS.length - 1 ? "Next petition" : "Return to the court") : phase === "court" && line + 1 >= lines.length ? "Begin" : phase === "dialogue" && line + 1 >= lines.length ? "Counsel the court" : "Continue"} <ArrowRight size={14} />
            </span>
          </motion.div>
        )}

        {phase === "decide" && !curtain && (
          <motion.div key={`decide-${idx}`} className="duty-decide" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.55 }}>
            <p className="duty-decide__q">{situation.prompt}</p>
            <div className="duty-decide__row">
              {situation.options.map((o) => {
                const Icon = o.icon;
                return (
                  <button key={o.id} type="button" className={`duty-opt ${sel === o.id ? "is-sel" : ""}`} onClick={() => setSel(o.id)} aria-pressed={sel === o.id}>
                    <span className="duty-opt__icon">
                      <Icon size={17} />
                    </span>
                    <b>{o.title}</b>
                    <small>{o.desc}</small>
                  </button>
                );
              })}
            </div>
            <button type="button" className={`duty-seal duty-seal--sm ${sel ? "is-ready" : ""}`} disabled={!sel} onClick={decree}>
              Pronounce the decree <ArrowRight size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "end" && (
          <motion.section key="end" className="duty-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 2 }}>
            <span className="duty-deva">राजधर्म</span>
            <motion.h2 initial={{ letterSpacing: "0.4em", opacity: 0 }} animate={{ letterSpacing: "0.12em", opacity: 1 }} transition={{ delay: 1.6, duration: 2.4 }}>
              THE DUTY OF THE CROWN
            </motion.h2>
            <em>The greatness of a king is reflected in the lives of his people.</em>
            <div className="duty-end__log">
              {history.map((h, i) => {
                const Icon = h.icon;
                return (
                  <span key={i} title={h.title}>
                    <Icon size={13} />
                    <b>{h.choice}</b>
                  </span>
                );
              })}
            </div>
            <div className="duty-end__actions">
              <button type="button" className="duty-ghost" onClick={restart}>
                <RotateCcw size={14} /> Rule again
              </button>
              <button type="button" className="duty-seal duty-seal--sm is-ready" onClick={onComplete}>
                Return to the Chronicle <ArrowRight size={15} />
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <Curtain card={curtain} />
    </div>
  );
}