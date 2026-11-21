import React, {
  Component,
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
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Sparkles,
  X,
} from "lucide-react";
import "./SitaHanumanMeetingGame.css";

/* ------------------------------------------------------------------ */
/*  STORY DATA — only Hanuman and Sita speak. No narrator, no boxes.   */
/*                                                                    */
/*  Tweak where each speaker's words float with `layout`, e.g.        */
/*    layout: { SITA: { side: "right", v: "top" } }                    */
/*  side: "left" | "right"      v: "top" | "bottom"                    */
/*  `relic` spawns a 3D object over the scene ("ring" | "gem").        */
/* ------------------------------------------------------------------ */

const DEFAULT_LAYOUT = {
  HANUMAN: { side: "right", v: "top" },
  SITA: { side: "left", v: "bottom" },
};

const scenes = [
  {
    image: "/images/ramayana/interactions/ch12g21.jpg",
    eyebrow: "THE SILENT GARDEN",
    title: "Beneath the Ashoka Tree",
    tint: "#ffd48a",
    lines: [
      {
        speaker: "HANUMAN",
        text: "There she is... Sita Mata, beneath the Ashoka tree. Rama's beloved, alone in Ravana's garden.",
      },
      {
        speaker: "HANUMAN",
        text: "I crossed the ocean to find her. Now I must choose my words with care, or fear will take her.",
      },
      {
        speaker: "SITA",
        text: "Rama... where are you? Does the whole world forget me here?",
      },
    ],
  },
  {
    image: "/images/ramayana/interactions/ch12g22.jpg",
    eyebrow: "THE FIRST WORDS",
    title: "A Familiar Name",
    tint: "#ffe3a8",
    lines: [
      {
        speaker: "HANUMAN",
        text: "In Ayodhya there lived a noble prince named Rama, beloved by his people and devoted to dharma...",
      },
      {
        speaker: "HANUMAN",
        text: "He entered the forest with his wife Sita and his brother Lakshmana. Fate parted them, and Rama now searches every forest and mountain for her.",
      },
      {
        speaker: "SITA",
        text: "That name... I have longed to hear it. Is this a dream, or some trick of Lanka's magic?",
      },
    ],
  },
  {
    image: "/images/ramayana/interactions/ch12g23.jpg",
    eyebrow: "THE MESSENGER REVEALS HIMSELF",
    title: "Who Speaks of Rama?",
    tint: "#ffcf8e",
    lines: [
      {
        speaker: "SITA",
        text: "Who are you, hidden among these branches? How do you know the story of Rama? Tell me truthfully.",
      },
      {
        speaker: "HANUMAN",
        text: "Mother, I am Hanuman, servant of Sugriva and messenger of Lord Rama. I have crossed the great ocean to find you.",
      },
      {
        speaker: "HANUMAN",
        text: "Rama has not abandoned his search. He remembers you, and he is determined to bring you home.",
      },
      {
        speaker: "SITA",
        text: "Words are easy in this city of deceit. Show me proof that you truly carry Rama's message.",
      },
    ],
  },
  {
    image: "/images/ramayana/interactions/ch12g24.jpg",
    eyebrow: "THE TOKEN OF TRUST",
    title: "The Ring of Rama",
    tint: "#ffd36b",
    relic: { kind: "ring", pos: [0, -0.35, 1.9] },
    lines: [
      {
        speaker: "HANUMAN",
        text: "Mother, Rama entrusted this ring to me before I departed. Look upon it. It is his token.",
      },
      {
        speaker: "SITA",
        text: "This is Rama's ring... You have truly come from him.",
      },
      {
        speaker: "SITA",
        text: "Tell me, how is he? What has happened since we were separated?",
      },
    ],
  },
  {
    image: "/images/ramayana/interactions/ch12g25.jpg",
    eyebrow: "NEWS FROM THE OTHER SHORE",
    title: "A Message Across the Ocean",
    tint: "#ffc98a",
    lines: [
      {
        speaker: "HANUMAN",
        text: "When Rama and Lakshmana found you missing, they searched the forests and found noble Jatayu, who had fought Ravana to save you.",
      },
      {
        speaker: "HANUMAN",
        text: "Jatayu told Rama all that had happened before giving up his life. Rama honoured him and performed his final rites.",
      },
      {
        speaker: "HANUMAN",
        text: "Then Rama met Sugriva, and the Vanara armies were sent in every direction. In the south, Sampati, Jatayu's elder brother, told us you were in Lanka.",
      },
      {
        speaker: "SITA",
        text: "Jatayu... he gave his life trying to protect me. And Rama has travelled so far, searching for me...",
      },
    ],
  },
  {
    image: "/images/ramayana/interactions/ch12g26.jpg",
    eyebrow: "A TOKEN FOR RAMA",
    title: "The Chudamani",
    tint: "#ffb980",
    relic: { kind: "gem", pos: [0, -0.3, 1.9] },
    lines: [
      {
        speaker: "SITA",
        text: "Hanuman, take this Chudamani to Rama. When he sees it, he will know you have truly met me.",
      },
      {
        speaker: "SITA",
        text: "Remind him of the crow that troubled me while I rested near him. It is a memory only Rama will understand.",
      },
      {
        speaker: "SITA",
        text: "Tell him I remember him. Tell him I have remained faithful, and that I wait for the day we meet again.",
      },
      {
        speaker: "HANUMAN",
        text: "Mother, I shall carry your words and this jewel to him. I shall not forget a single thing you have entrusted to me.",
      },
    ],
  },
  {
    image: "/images/ramayana/interactions/ch12g27.jpg",
    eyebrow: "THE PROMISE",
    title: "Hope Across the Ocean",
    tint: "#ffe0a0",
    lines: [
      {
        speaker: "HANUMAN",
        text: "Have courage, Mother. Rama will hear your message. I shall return to him and tell him that I have found you.",
      },
      {
        speaker: "SITA",
        text: "Go, Hanuman. Give Rama my message. May your journey be safe.",
      },
      {
        speaker: "HANUMAN",
        text: "The ocean still separates you, but the path to reunion has begun. Rama is coming, Mother.",
      },
    ],
  },
];

const flat = scenes.flatMap((scene, si) =>
  scene.lines.map((line, li) => ({ ...line, si, li, count: scene.lines.length }))
);

const TITLE_IMAGE = scenes[0].image;
const ENDING_IMAGE = scenes[scenes.length - 1].image;

/* ------------------------------------------------------------------ */
/*  3D ATMOSPHERE (React Three Fiber)                                  */
/* ------------------------------------------------------------------ */

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,244,214,1)");
  grad.addColorStop(0.25, "rgba(255,208,128,0.75)");
  grad.addColorStop(1, "rgba(255,176,80,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function Fireflies({ count = 110, tint }) {
  const ref = useRef();
  const tex = useMemo(makeGlowTexture, []);
  const data = useMemo(() => {
    const base = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      base[i * 3] = (Math.random() - 0.5) * 10.5;
      base[i * 3 + 1] = (Math.random() - 0.5) * 6.4;
      base[i * 3 + 2] = Math.random() * 4.5 - 2;
      seeds[i * 3] = 0.25 + Math.random() * 0.6; // rise speed
      seeds[i * 3 + 1] = Math.random() * 6.28; // phase
      seeds[i * 3 + 2] = 0.2 + Math.random() * 0.5; // sway
    }
    return { base, seeds, pos: new Float32Array(count * 3) };
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { base, seeds, pos } = data;
    for (let i = 0; i < count; i++) {
      const speed = seeds[i * 3] * 0.14;
      const phase = seeds[i * 3 + 1];
      const sway = seeds[i * 3 + 2];
      pos[i * 3] = base[i * 3] + Math.sin(t * 0.5 * sway + phase) * 0.55;
      pos[i * 3 + 1] = ((base[i * 3 + 1] + t * speed + 3.2) % 6.4) - 3.2;
      pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.4 * sway + phase) * 0.3;
    }
    const attr = ref.current.geometry.attributes.position;
    attr.array.set(pos);
    attr.needsUpdate = true;
    ref.current.material.opacity = 0.75 + Math.sin(t * 1.7) * 0.2;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={data.pos}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        size={0.34}
        color={tint}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function Petals({ count = 26 }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 10,
        y: Math.random() * 6.4,
        z: Math.random() * 3.5 - 1.5,
        speed: 0.18 + Math.random() * 0.25,
        spin: 0.6 + Math.random() * 1.4,
        phase: Math.random() * 6.28,
      })),
    [count]
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seeds.forEach((s, i) => {
      const y = 3.2 - ((s.y + t * s.speed) % 6.4);
      dummy.position.set(
        s.x + Math.sin(t * 0.6 + s.phase) * 0.7,
        y,
        s.z
      );
      dummy.rotation.set(t * s.spin, t * s.spin * 0.7 + s.phase, t * 0.5);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <planeGeometry args={[0.11, 0.17]} />
      <meshBasicMaterial
        color="#ffb089"
        side={THREE.DoubleSide}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}

function Relic({ kind, pos }) {
  const group = useRef();
  const tex = useMemo(makeGlowTexture, []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    g.rotation.y += dt * (kind === "ring" ? 1.1 : 0.8);
    if (kind === "ring") g.rotation.x = Math.sin(t * 0.8) * 0.35 + 0.5;
    g.position.y = pos[1] + Math.sin(t * 1.4) * 0.1;
    const target = 1 + Math.sin(t * 2.2) * 0.04;
    const s = THREE.MathUtils.lerp(g.scale.x, target, 0.05);
    g.scale.setScalar(s);
  });

  return (
    <group ref={group} position={pos} scale={0.001}>
      <sprite scale={[2.6, 2.6, 1]}>
        <spriteMaterial
          map={tex}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {kind === "ring" ? (
        <>
          <mesh>
            <torusGeometry args={[0.38, 0.065, 28, 80]} />
            <meshStandardMaterial
              color="#e8b95a"
              metalness={1}
              roughness={0.22}
              emissive="#8a5a14"
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial
              color="#ff8a5c"
              emissive="#ff5a2a"
              emissiveIntensity={1.2}
              metalness={0.3}
              roughness={0.15}
            />
          </mesh>
        </>
      ) : (
        <mesh scale={[0.8, 1.15, 0.8]}>
          <octahedronGeometry args={[0.42, 0]} />
          <meshStandardMaterial
            color="#ff9a5a"
            emissive="#ff6a2a"
            emissiveIntensity={1.1}
            metalness={0.4}
            roughness={0.1}
            flatShading
          />
        </mesh>
      )}
    </group>
  );
}

function Rig({ pointer, children }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      pointer.current.x * 0.12,
      0.05
    );
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      -pointer.current.y * 0.08,
      0.05
    );
  });
  return <group ref={ref}>{children}</group>;
}

class SafeBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {}
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Atmosphere({ pointer, tint = "#ffd48a", relic, petals = true, boost = 1 }) {
  return (
    <SafeBoundary>
      <Canvas
        className="shm-3d"
        camera={{ position: [0, 0, 5], fov: 55 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[2, 2.5, 3]} intensity={38} color="#ffd9a0" />
        <pointLight position={[-3, -1, 2]} intensity={14} color="#ff9a6a" />
        <Rig pointer={pointer}>
          <Fireflies count={Math.round(110 * boost)} tint={tint} />
          {petals && <Petals />}
          {relic && <Relic key={relic.kind} kind={relic.kind} pos={relic.pos} />}
        </Rig>
      </Canvas>
    </SafeBoundary>
  );
}

/* ------------------------------------------------------------------ */
/*  GAME                                                              */
/* ------------------------------------------------------------------ */

export default function SitaHanumanMeetingGame({ onComplete, onExit }) {
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

  /* pointer parallax for the artwork */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });
  const bgX = useTransform(sx, [-1, 1], ["1.4%", "-1.4%"]);
  const bgY = useTransform(sy, [-1, 1], ["1%", "-1%"]);

  const onPointerMove = useCallback(
    (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      pointer.current = { x, y };
      mx.set(x);
      my.set(y);
    },
    [mx, my]
  );

  /* typewriter — words appear as if spoken */
  useEffect(() => {
    if (!started || finished) return undefined;
    setShown(0);
    const full = line.text.length;
    let n = 0;
    timerRef.current = window.setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= full) window.clearInterval(timerRef.current);
    }, 26);
    return () => window.clearInterval(timerRef.current);
  }, [i, started, finished, line.text]);

  /* scene title card appears briefly at the start of each scene */
  useEffect(() => {
    if (!started || finished) return undefined;
    setTitleCard(true);
    const t = window.setTimeout(() => setTitleCard(false), 3200);
    return () => window.clearTimeout(t);
  }, [line.si, started, finished]);

  /* exit: leave the game via onExit / onComplete, or back to the title screen */
  const handleExit = useCallback(() => {
    window.clearInterval(timerRef.current);
    if (onExit) {
      onExit();
    } else if (onComplete) {
      onComplete();
    } else {
      setStarted(false);
      setFinished(false);
      setI(0);
      setShown(0);
    }
  }, [onExit, onComplete]);

  const advance = useCallback(() => {
    if (!started || finished) return;
    if (typing) {
      window.clearInterval(timerRef.current);
      setShown(line.text.length);
      return;
    }
    if (i < flat.length - 1) setI((p) => p + 1);
    else setFinished(true);
  }, [started, finished, typing, i, line.text]);

  const goBack = useCallback(() => {
    if (!started || finished) return;
    window.clearInterval(timerRef.current);
    if (i > 0) setI((p) => p - 1);
  }, [started, finished, i]);

  const restart = () => {
    setI(0);
    setShown(0);
    setFinished(false);
    setStarted(true);
  };

  /* keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, goBack]);

  const progress = finished ? 100 : ((i + 1) / flat.length) * 100;

  /* where this line floats */
  const place = {
    ...DEFAULT_LAYOUT[line.speaker],
    ...(scene.layout && scene.layout[line.speaker]),
  };

  /* ---------------- TITLE SCREEN ---------------- */
  if (!started) {
    return (
      <div className="shm-game" onPointerMove={onPointerMove}>
        <div className="shm-title-screen">
          <motion.div className="shm-bg" style={{ x: bgX, y: bgY }}>
            <motion.img
              src={TITLE_IMAGE}
              alt="Sita beneath the Ashoka tree"
              className="shm-bg-img"
              initial={{ scale: 1.18 }}
              animate={{ scale: 1.06 }}
              transition={{ duration: 18, ease: "linear" }}
              draggable="false"
            />
          </motion.div>
          <div className="shm-vignette" />
          <div className="shm-rays" />
          <Atmosphere pointer={pointer} tint="#ffd48a" boost={1.2} />
          <div className="shm-grain" />
          <div className="shm-title-fade" />

          {(onExit || onComplete) && (
            <button
              className="shm-icon-button shm-exit-title"
              onClick={handleExit}
              aria-label="Exit"
              title="Exit"
            >
              <X size={16} />
            </button>
          )}

          <div className="shm-title-content">
            <motion.span
              className="shm-overline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              <Sparkles size={13} />
              SUNDARA KANDA · CHAPTER XII
            </motion.span>

            <motion.div
              className="shm-title-rule"
              initial={{ opacity: 0, scaleX: 0.3 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.7, duration: 1.1 }}
            >
              <span />✦<span />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.9, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
              The Messenger
              <br />
              of Rama
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 1.2 }}
            >
              Across the endless ocean, a messenger has found the one whom Rama
              seeks. Witness the meeting beneath the Ashoka tree.
            </motion.p>

            <motion.button
              className="shm-primary-button"
              onClick={() => setStarted(true)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.9 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>ENTER ASHOKA VATIKA</span>
              <ArrowRight size={17} />
            </motion.button>

            <motion.small
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 1 }}
            >
              A STORY OF FAITH, DEVOTION AND HOPE
            </motion.small>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- GAME ---------------- */
  return (
    <div className="shm-game" onPointerMove={onPointerMove}>
      <div className="shm-stage" onClick={advance}>
        {/* Full-bleed artwork, crossfading between scenes */}
        <AnimatePresence>
          {!finished ? (
            <motion.div
              key={`bg-${line.si}`}
              className="shm-bg-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            >
              <motion.div className="shm-bg" style={{ x: bgX, y: bgY }}>
                <motion.img
                  src={scene.image}
                  alt={scene.title}
                  className="shm-bg-img"
                  initial={{ scale: 1.14 }}
                  animate={{ scale: 1.04 }}
                  transition={{ duration: 22, ease: "linear" }}
                  draggable="false"
                />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="bg-end"
              className="shm-bg-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4 }}
            >
              <motion.div className="shm-bg" style={{ x: bgX, y: bgY }}>
                <motion.img
                  src={ENDING_IMAGE}
                  alt="The final meeting of Sita and Hanuman"
                  className="shm-bg-img shm-bg-img--dim"
                  initial={{ scale: 1.04 }}
                  animate={{ scale: 1.12 }}
                  transition={{ duration: 20, ease: "linear" }}
                  draggable="false"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="shm-vignette" />
        <div className="shm-rays" />

        <Atmosphere
          pointer={pointer}
          tint={finished ? "#ffe3a8" : scene.tint}
          relic={!finished ? scene.relic : undefined}
          boost={finished ? 1.5 : 1}
        />

        <div className="shm-grain" />

        {/* Film-style top/bottom fades */}
        <div className="shm-top-fade" />
        <div className="shm-bottom-fade" />

        {/* HUD */}
        <div className="shm-hud" onClick={(e) => e.stopPropagation()}>
          <div className="shm-brand">
            <Sparkles size={13} />
            <span>ANCESTRA</span>
          </div>
          <div className="shm-hud-right">
            <span className="shm-scene-count">
              {finished
                ? "COMPLETE"
                : `SCENE ${String(line.si + 1).padStart(2, "0")} / ${String(
                    scenes.length
                  ).padStart(2, "0")}`}
            </span>
            {!finished && (
              <button
                className="shm-icon-button"
                onClick={goBack}
                disabled={i === 0}
                aria-label="Previous line"
                title="Previous line"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <button
              className="shm-icon-button shm-exit-button"
              onClick={handleExit}
              aria-label="Exit"
              title="Exit"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="shm-progress">
          <motion.div
            className="shm-progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Scene title card — fades away so the art stays clean */}
        <AnimatePresence>
          {!finished && titleCard && (
            <motion.div
              key={`title-${line.si}`}
              className="shm-titlecard"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>{scene.eyebrow}</span>
              <h2>{scene.title}</h2>
              <i />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spoken dialogue — floats beside the speaker, no box */}
        {!finished && (
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              className={`shm-speech shm-speech--${place.side} shm-speech--${place.v}`}
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="shm-speaker-row">
                <span
                  className={`shm-speaker-dot shm-speaker-dot--${line.speaker.toLowerCase()}`}
                />
                <span
                  className={`shm-speaker shm-speaker--${line.speaker.toLowerCase()}`}
                >
                  {line.speaker}
                </span>
              </div>
              <p className="shm-text">
                {line.text.slice(0, shown)}
                {typing && <span className="shm-caret" />}
              </p>
            </motion.div>
          </AnimatePresence>
        )}

        {!finished && (
          <div className="shm-hint">
            <span>{typing ? "TAP TO SKIP" : "TAP TO CONTINUE"}</span>
            <ChevronDown size={14} />
          </div>
        )}

        {/* Ending */}
        <AnimatePresence>
          {finished && (
            <motion.div
              className="shm-ending-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Sparkles size={25} />
              <span>THE MESSAGE HAS BEEN ENTRUSTED</span>
              <h2>
                Two Hearts.
                <br />
                One Promise.
              </h2>
              <p>
                Hanuman carries Sita's message across the ocean. Rama will know
                that he has found her.
              </p>
              <button
                className="shm-primary-button"
                onClick={onComplete || restart}
              >
                <span>{onComplete ? "RETURN TO THE STORY" : "WATCH AGAIN"}</span>
                <ArrowRight size={17} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}