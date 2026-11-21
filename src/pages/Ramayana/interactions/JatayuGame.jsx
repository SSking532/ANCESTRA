import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ArrowRight, ChevronLeft, Feather, RotateCcw, Volume2, VolumeX } from "lucide-react";
import "./JatayuGame.css";

const IMAGE = {
  forest: "/images/ramayana/interactions/ch7g31.jpg",
  presence: "/images/ramayana/interactions/ch7g32.jpg",
  reveal: "/images/ramayana/interactions/ch7g33.jpg",
  memory: "/images/ramayana/interactions/ch7g34.jpg",
  promise: "/images/ramayana/interactions/ch7g35.jpg",
  sita: "/images/ramayana/interactions/ch7g36.jpg",
  ending: "/images/ramayana/interactions/ch7g37.jpg",
};

/* mood: fog colour, sunlight colour, camera position, Jatayu's position/scale in the 3D world */
const MOODS = {
  forest:   { fog: "#243324", sun: "#ffe2a6", cam: [0, 2.2, 10],   bird: [-22, 9, -22, 1] },
  presence: { fog: "#121a16", sun: "#8fb0c8", cam: [0, 1.6, 9],    bird: [0, 8.5, -12, 0.7] },
  jatayu:   { fog: "#2c3a25", sun: "#ffd27a", cam: [0, 2.6, 10.5], bird: [0, 2.7, -1.6, 1.35] },
  memory:   { fog: "#3a3020", sun: "#ffc46b", cam: [-1.2, 2.2, 9], bird: [3.6, 2.4, -2.6, 1.1] },
  promise:  { fog: "#2f3a26", sun: "#ffe0a0", cam: [1.2, 2.3, 9],  bird: [3.8, 2.3, -2.4, 1.15] },
  sita:     { fog: "#35382a", sun: "#ffd9b0", cam: [0, 2.0, 8.6],  bird: [3.4, 2.6, -2.8, 1.1] },
  oath:     { fog: "#3b2f1d", sun: "#ffb85c", cam: [0, 2.8, 9.4],  bird: [0, 3.2, -2, 1.3] },
  ending:   { fog: "#31402f", sun: "#ffeab0", cam: [0, 1.4, 11],   bird: [0, 7.2, -6, 1.05] },
};

const SCENES = [
  { eyebrow: "The forest watches", title: "Where an old friendship waits", image: IMAGE.forest, visual: "forest", lines: [
    ["Narrator", "The forest of Dandaka stretched beneath the late light of day. Rama, Sita and Lakshmana travelled beneath its ancient trees, leaving the familiar world behind."],
    ["Lakshmana", "Brother, the forest grows deeper with every step. I feel as though we are being watched."],
    ["Rama", "Stay calm, Lakshmana. The forest has many eyes, and not all of them are unfriendly."],
    ["Sita", "The birdsong has stopped. How strange the silence feels."],
  ] },
  { eyebrow: "A presence above", title: "A shadow crosses the canopy", image: IMAGE.presence, visual: "presence", lines: [
    ["Narrator", "A vast shadow moved across the forest floor. Leaves stirred though the air had been still, and the distant branches trembled beneath a colossal presence."],
    ["Lakshmana", "Brother, look up! Something enormous moves above the trees."],
    ["Rama", "Steady. Keep your bow lowered until we know its purpose."],
  ] },
  { eyebrow: "The king of the skies", title: "Jatayu reveals himself", image: IMAGE.reveal, visual: "jatayu", lines: [
    ["Jatayu", "Travellers, do not be alarmed. I am Jatayu, king among the great birds of these forests. Tell me who you are, and what brings you to Dandaka."],
    ["Rama", "I am Rama, son of Dasharatha. This is my wife Sita, and my brother Lakshmana. Exile has brought us to your forest."],
    ["Lakshmana", "Forgive our alarm, great one. We did not know these woods had so noble a king."],
  ] },
  { eyebrow: "A name from Ayodhya", title: "A friendship remembered", image: IMAGE.memory, visual: "memory", lines: [
    ["Jatayu", "Dasharatha's son? Then the years have brought a dear friend's child before me. I knew your father, Rama. Affection and respect joined us, and his memory has not faded."],
    ["Rama", "You knew my father? Tell me, how did you and Dasharatha become friends?"],
    ["Jatayu", "In younger days, when he rode out beyond the cities. He treated me as an equal, and I never forgot it."],
  ] },
  { eyebrow: "A promise freely given", title: "The offer of protection", image: IMAGE.promise, visual: "promise", lines: [
    ["Rama", "Noble Jatayu, to meet one who remembers my father with such affection is a blessing. We shall remember the friendship you have offered us."],
    ["Jatayu", "Then let me offer more than memory. Whenever you must leave Sita alone, I will keep watch over her."],
    ["Lakshmana", "Your offer eases my heart. Sita is dear to us all."],
  ] },
  { eyebrow: "Sita's words", title: "A bond welcomed with grace", image: IMAGE.sita, visual: "sita", lines: [
    ["Sita", "Your words bring us comfort, noble Jatayu. It is reassuring to know that a friend of my father-in-law watches over these forests."],
    ["Jatayu", "Daughter, you carry the grace of your father's house. Fear nothing while I am near."],
    ["Sita", "Then these woods already feel a little more like home."],
  ] },
  { eyebrow: "The oath of friendship", title: "A promise beyond the moment", image: IMAGE.promise, visual: "oath", lines: [
    ["Jatayu", "While you dwell in this forest, regard me as a friend of your family. When you must leave Sita in this woodland, I shall remain watchful. The trust of Dasharatha's house shall not be forgotten."],
    ["Rama", "We accept your oath, and we will carry it as a gift."],
    ["Jatayu", "Then it is settled. Go in peace, and call upon me when you have need."],
  ] },
  { eyebrow: "The king above the forest", title: "The watchful guardian", image: IMAGE.ending, visual: "ending", lines: [
    ["Narrator", "The great bird returned to his lofty perch, his vast wings opening above the trees. Rama, Sita and Lakshmana continued towards their dwelling, carrying the comfort of an unexpected friendship."],
    ["Lakshmana", "A friend in the sky. I did not expect such fortune in exile."],
    ["Rama", "Remember it, brother. A friendship like this is rarer than any kingdom."],
    ["Narrator", "Far above the forest floor, Jatayu kept watch."],
  ] },
];

/* ---------- Ambient sound (generated, no audio files needed) ---------- */
function useAmbience() {
  const ctx = useRef(null);
  const master = useRef(null);
  const [on, setOn] = useState(true);
  const start = useCallback(() => {
    if (ctx.current) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = new AC();
    const m = c.createGain();
    m.gain.value = 0.9;
    m.connect(c.destination);
    [110, 164.81, 220, 277.18].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      o.type = "sine"; o.frequency.value = f; g.gain.value = 0.018 / (1 + i * 0.4);
      l.frequency.value = 0.05 + i * 0.03; lg.gain.value = 0.008;
      l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(m); o.start(); l.start();
    });
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = c.createBufferSource(); n.buffer = buf; n.loop = true;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 420; f.Q.value = 0.6;
    const ng = c.createGain(); ng.gain.value = 0.035;
    const wl = c.createOscillator(), wg = c.createGain(); wl.frequency.value = 0.12; wg.gain.value = 0.025;
    wl.connect(wg); wg.connect(ng.gain); n.connect(f); f.connect(ng); ng.connect(m); n.start(); wl.start();
    ctx.current = c; master.current = m;
  }, []);
  const chime = useCallback((freq = 660) => {
    const c = ctx.current;
    if (!c || !on) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = "triangle"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.4);
    o.connect(g); g.connect(master.current); o.start(); o.stop(c.currentTime + 1.5);
  }, [on]);
  const screech = useCallback(() => {
    const c = ctx.current;
    if (!c || !on) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(), v = c.createOscillator(), vg = c.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(2300, t + 0.18); o.frequency.exponentialRampToValueAtTime(800, t + 1.1);
    v.frequency.value = 38; vg.gain.value = 90; v.connect(vg); vg.connect(o.frequency);
    f.type = "bandpass"; f.frequency.value = 1700; f.Q.value = 2.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(f); f.connect(g); g.connect(master.current); o.start(t); v.start(t); o.stop(t + 1.3); v.stop(t + 1.3);
  }, [on]);
  const toggle = useCallback(() => {
    setOn((v) => {
      if (master.current) master.current.gain.setTargetAtTime(v ? 0 : 0.9, ctx.current.currentTime, 0.2);
      return !v;
    });
  }, []);
  useEffect(() => () => ctx.current?.close?.(), []);
  return { start, chime, screech, toggle, on };
}

/* ---------- Typewriter ---------- */
function useTypewriter(text, active) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!active) return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(text.length); return undefined; }
    const id = setInterval(() => setN((c) => (c >= text.length ? (clearInterval(id), c) : c + 1)), 17);
    return () => clearInterval(id);
  }, [text, active]);
  return [text.slice(0, n), n >= text.length, () => setN(text.length)];
}

/* ---------- 3D world ---------- */
function CameraRig({ mood, pointer }) {
  const fog = useMemo(() => new THREE.Color(mood.fog), [mood]);
  useFrame(({ camera, scene }, dt) => {
    const k = Math.min(dt * 1.6, 1);
    camera.position.x += (mood.cam[0] + pointer.current.x * 1.1 - camera.position.x) * k;
    camera.position.y += (mood.cam[1] - pointer.current.y * 0.5 - camera.position.y) * k;
    camera.position.z += (mood.cam[2] - camera.position.z) * k;
    camera.lookAt(0, 1.7, -4);
    scene.fog?.color.lerp(fog, k);
  });
  return null;
}

function Trees() {
  const group = useRef(null);
  const trees = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    x: Math.sin(i * 12.989) * (5.5 + (i % 5)), z: -2 - (i % 8) * 1.3,
    h: 3.5 + ((i * 7) % 5), r: 0.22 + (i % 3) * 0.08,
  })), []);
  useFrame(({ clock }) => {
    group.current?.children.forEach((t, i) => { t.rotation.z = Math.sin(clock.elapsedTime * 0.5 + i) * 0.014; });
  });
  return (
    <group ref={group}>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, -1.1, t.z]}>
          <mesh position={[0, t.h / 2, 0]}>
            <cylinderGeometry args={[t.r * 0.72, t.r, t.h, 7]} />
            <meshStandardMaterial color="#493a28" roughness={1} />
          </mesh>
          {[0, 1, 2].map((n) => (
            <mesh key={n} position={[0, t.h * (0.66 + n * 0.13), 0]} scale={[1.4 - n * 0.18, 1.2, 1.2]}>
              <coneGeometry args={[1.25, 2.2, 7]} />
              <meshStandardMaterial color={i % 2 ? "#354a32" : "#40543a"} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Fireflies({ count = 90 }) {
  const ref = useRef(null);
  const base = useMemo(() => Float32Array.from({ length: count * 3 }, (_, i) =>
    i % 3 === 0 ? (Math.random() - 0.5) * 18 : i % 3 === 1 ? Math.random() * 6 - 0.6 : -Math.random() * 12 + 3), [count]);
  const pos = useMemo(() => new Float32Array(base), [base]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = base[i * 3] + Math.sin(t * 0.3 + i) * 0.7;
      pos[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.5 + i * 1.7) * 0.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.09} color="#ffe9a0" transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function LightShafts({ color }) {
  const group = useRef(null);
  useFrame(({ clock }) => {
    group.current?.children.forEach((m, i) => { m.material.opacity = 0.05 + Math.sin(clock.elapsedTime * 0.4 + i * 1.3) * 0.025; m.material.color.lerp(new THREE.Color(color), 0.05); });
  });
  return (
    <group ref={group}>
      {[-6, -3, 0.5, 4, 7].map((x, i) => (
        <mesh key={i} position={[x, 4, -7 - i * 0.6]} rotation={[0, 0, 0.32]}>
          <planeGeometry args={[1.1 + (i % 2), 14]} />
          <meshBasicMaterial color="#ffe2a6" transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function PassingShadow({ active }) {
  const ref = useRef(null);
  useFrame(({ clock }, dt) => {
    const m = ref.current; if (!m) return;
    const target = active ? 0.55 : 0;
    m.material.opacity += (target - m.material.opacity) * Math.min(dt * 2, 1);
    m.position.x = active ? -14 + ((clock.elapsedTime * 2.2) % 28) : -14;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[-14, -1.08, -3]} scale={[7, 3, 1]}>
      <circleGeometry args={[1, 32]} />
      <meshBasicMaterial color="#000" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function Wing({ side, refEl }) {
  return (
    <group ref={refEl} position={[0.58 * side, 0.42, -0.1]} scale={[side, 1, 1]}>
      <mesh position={[-1.55, 0, 0]} scale={[1.95, 0.22, 0.62]}>
        <sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#554638" roughness={1} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} position={[-0.55 - i * 0.28, -0.2 - i * 0.025, 0.02]} rotation={[0, 0, -0.22 - i * 0.018]} scale={[1.2, 0.095, 0.16]}>
          <sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color={i % 2 ? "#302b25" : "#685541"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Jatayu({ mood }) {
  const root = useRef(null), left = useRef(null), right = useRef(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime, [x, y, z, s] = mood.bird, k = Math.min(dt * 1.3, 1), r = root.current;
    const flap = Math.sin(t * 1.6) * 0.22;
    r.position.x += (x - r.position.x) * k;
    r.position.y += (y + Math.sin(t * 0.7) * 0.18 - r.position.y) * k;
    r.position.z += (z - r.position.z) * k;
    r.scale.setScalar(r.scale.x + (s - r.scale.x) * k);
    r.rotation.z += ((x - r.position.x) * -0.04 - r.rotation.z) * k;
    r.rotation.y = Math.sin(t * 0.25) * 0.14 + (x > 1 ? 0.35 : 0);
    left.current.rotation.z = 0.1 + flap;
    right.current.rotation.z = -0.1 - flap;
  });
  return (
    <group ref={root} position={[-22, 9, -22]} scale={1}>
      <mesh scale={[0.85, 1.2, 1.45]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color="#40362c" roughness={0.92} /></mesh>
      <mesh position={[0, 1.18, 0.48]} rotation={[-0.28, 0, 0]} scale={[0.42, 1.05, 0.42]}>
        <cylinderGeometry args={[0.25, 0.42, 1.8, 16]} /><meshStandardMaterial color="#695744" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.08, 0.72]} scale={[0.48, 0.48, 0.55]}><sphereGeometry args={[1, 24, 18]} /><meshStandardMaterial color="#8c7960" roughness={0.85} /></mesh>
      <mesh position={[0, 1.96, 1.15]} rotation={[Math.PI / 2.4, 0, 0]} scale={[0.19, 0.3, 0.24]}><coneGeometry args={[1, 1.4, 8]} /><meshStandardMaterial color="#c18b42" roughness={0.6} /></mesh>
      {[-0.19, 0.19].map((x) => (
        <group key={x} position={[x, 2.18, 1.08]}>
          <mesh><sphereGeometry args={[0.065, 12, 12]} /><meshStandardMaterial color="#d6b66f" emissive="#8a5a1c" emissiveIntensity={0.8} /></mesh>
          <mesh position={[0, 0, 0.045]}><sphereGeometry args={[0.027, 10, 10]} /><meshStandardMaterial color="#17140f" /></mesh>
        </group>
      ))}
      <Wing side={-1} refEl={left} />
      <Wing side={1} refEl={right} />
      {[-0.38, 0.38].map((x) => (
        <group key={x} position={[x, -1.05, 0.2]}>
          <mesh position={[0, -0.42, 0]}><cylinderGeometry args={[0.12, 0.16, 0.9, 10]} /><meshStandardMaterial color="#9b713d" roughness={0.8} /></mesh>
          {[-1, 0, 1].map((n) => (
            <mesh key={n} position={[n * 0.16, -0.9, 0.13]} rotation={[0.15, 0, n * -0.15]} scale={[0.09, 0.34, 0.1]}>
              <coneGeometry args={[1, 1, 8]} /><meshStandardMaterial color="#26221c" roughness={0.65} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function World({ scene, pointer }) {
  const mood = MOODS[scene.visual];
  const sun = useRef(null);
  useFrame((_, dt) => sun.current?.color.lerp(new THREE.Color(mood.sun), Math.min(dt * 2, 1)));
  return (
    <>
      <fog attach="fog" args={["#243324", 8, 26]} />
      <CameraRig mood={mood} pointer={pointer} />
      <ambientLight intensity={0.75} />
      <directionalLight ref={sun} position={[4, 8, 5]} intensity={2.2} />
      <directionalLight position={[-5, 4, -4]} intensity={0.8} color="#8eaa78" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, -5]}>
        <planeGeometry args={[60, 60]} /><meshStandardMaterial color="#34412d" roughness={1} />
      </mesh>
      <Trees />
      <LightShafts color={mood.sun} />
      <Fireflies />
      <PassingShadow active={scene.visual === "presence"} />
      <Jatayu mood={mood} />
    </>
  );
}

/* ---------- Game ---------- */
const TONE = { Narrator: "#cdbb96", Jatayu: "#f0c15e", Rama: "#8fd0c4", Sita: "#f0a7b4", Lakshmana: "#9fb8f0" };

export default function JatayuGame({ onClose }) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [line, setLine] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const root = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const audio = useAmbience();
  const { screech } = audio;
  const scene = SCENES[index];
  const [speaker, text] = scene.lines[line];
  const lastScene = index === SCENES.length - 1;
  const lastLine = line === scene.lines.length - 1;
  const [shown, done, skip] = useTypewriter(text, started);

  useEffect(() => { window.scrollTo?.(0, 0); }, []);

  /* vulture calls: every few seconds, plus one as Jatayu appears */
  useEffect(() => {
    if (!started) return undefined;
    let id;
    const loop = () => { id = setTimeout(() => { screech(); loop(); }, 6500 + Math.random() * 6000); };
    loop();
    return () => clearTimeout(id);
  }, [started, screech]);
  useEffect(() => {
    if (!started || scene.visual !== "jatayu" || line !== 0) return undefined;
    const id = setTimeout(screech, 1300);
    return () => clearTimeout(id);
  }, [started, scene.visual, line, screech]);

  const goScene = useCallback((to, toLine = 0) => {
    if (transitioning) return;
    setTransitioning(true);
    audio.chime(to > index ? 660 : 495);
    window.setTimeout(() => { setIndex(to); setLine(toLine); setTransitioning(false); }, 420);
  }, [transitioning, index, audio]);

  const advance = useCallback(() => {
    if (!started || transitioning) return;
    if (!done) return skip();
    if (!lastLine) { audio.chime(560); return setLine(line + 1); }
    if (lastScene) return onClose?.();
    goScene(index + 1);
  }, [started, transitioning, done, skip, lastLine, lastScene, line, index, onClose, goScene, audio]);

  const back = useCallback(() => {
    if (line > 0) return setLine(line - 1);
    if (index > 0) goScene(index - 1, SCENES[index - 1].lines.length - 1);
  }, [line, index, goScene]);

  const restart = () => { setIndex(0); setLine(0); };
  const begin = () => { audio.start(); audio.chime(523); setStarted(true); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || (e.key === "Enter" && e.target.tagName !== "BUTTON")) { e.preventDefault(); started ? advance() : begin(); }
      if (e.key === "ArrowLeft" && started) back();
      if (e.key.toLowerCase() === "m") audio.toggle();
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onMove = (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2, ny = (e.clientY / window.innerHeight - 0.5) * 2;
    pointer.current = { x: nx, y: ny };
    root.current?.style.setProperty("--px", nx.toFixed(3));
    root.current?.style.setProperty("--py", ny.toFixed(3));
  };

  return (
    <main ref={root} onPointerMove={onMove} className="jt-game jt-cinematic" data-mood={scene.visual} role="dialog" aria-modal="true" aria-label="Jatayu: The Oath of Friendship">
      <div className="jt-backdrop" style={{ backgroundImage: `url("${scene.image}")` }} />
      <div className="jt-backdrop-shade" />
      <div className="jt-3d-world" aria-hidden="true">
        <Canvas camera={{ position: [0, 2.2, 10], fov: 43 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.75]}>
          <World scene={scene} pointer={pointer} />
        </Canvas>
      </div>
      <div className="jt-grain" aria-hidden="true" />

      <header className="jt-cinema-top">
        <div className="jt-cinema-brand">
          <span className="jt-brand-symbol">✧</span>
          <span><strong>ANCESTRA</strong><small>THE RAMAYANA EXPERIENCE</small></span>
        </div>
        <div className="jt-cinema-chapter">Aranya Kanda <i /> Chapter VII</div>
        <div className="jt-top-right">
          <button className="jt-sound-control" type="button" onClick={audio.toggle} aria-label={audio.on ? "Mute sound" : "Unmute sound"}>
            {audio.on ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </header>

      <div className="jt-cinema-progress">
        <div className="jt-progress-meta"><span>{scene.title}</span><span>{String(index + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}</span></div>
        <div className="jt-progress-segs">
          {SCENES.map((_, i) => <i key={i} className={i < index ? "done" : i === index ? "now" : ""} />)}
        </div>
      </div>

      <section className="jt-cinema-stage">
        <AnimatePresence mode="wait">
          <motion.div className="jt-scene-art" key={`art-${index}`}
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}>
            <div className="jt-frame">
              <img src={scene.image} alt="" className="jt-scene-image" draggable="false" />
              <div className="jt-art-vignette" />
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.div className="jt-dialogue" style={{ "--tone": TONE[speaker] }}
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: started ? 1 : 0, y: started ? 0 : 50 }} transition={{ duration: 0.7, delay: 0.3 }}>
          <div className="jt-speaker">
            <AnimatePresence mode="wait">
              <motion.div key={speaker} className="jt-speaker-in" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }}>
                <span className="jt-avatar">{speaker[0]}</span>
                <span className="jt-speaker-name">{speaker}</span>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="jt-line" onClick={skip} aria-live="polite">
            {shown}<b className={done ? "jt-caret off" : "jt-caret"} />
          </p>
          <div className="jt-dialogue-side">
            <span className="jt-dots" aria-hidden="true">{scene.lines.map((_, i) => <i key={i} className={i <= line ? "on" : ""} />)}</span>
            <button className="jt-continue" type="button" onClick={advance}>
              <span>{!done ? "Skip" : lastLine && lastScene ? "Return" : "Next"}</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </motion.div>
      </section>

      <footer className="jt-cinema-footer">
        <span>
          {index > 0 || line > 0 ? <button className="jt-back" type="button" onClick={back}><ChevronLeft size={14} /> Back</button> : <><Feather size={14} /> A story of loyalty and trust</>}
        </span>
        <span className="jt-footer-center">Enter to continue · M for sound</span>
        {lastScene && lastLine && done ? <button className="jt-restart" type="button" onClick={restart}><RotateCcw size={14} /> Revisit</button> : <span className="jt-footer-mark">✧</span>}
      </footer>

      <AnimatePresence>
        {!started && (
          <motion.div className="jt-intro" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.06 }} transition={{ duration: 1 }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2 }}>
              <span className="jt-intro-kicker">Aranya Kanda, Chapter VII</span>
              <h2>Jatayu</h2>
              <p>The Oath of Friendship</p>
              <div className="jt-story-rule"><i>✦</i></div>
              <button className="jt-continue jt-begin" type="button" onClick={begin} autoFocus>
                <span>Begin the story</span><ArrowRight size={17} />
              </button>
              <small>Best with sound on.</small>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transitioning && <motion.div className="jt-transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      </AnimatePresence>
    </main>
  );
}