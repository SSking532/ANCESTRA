import React, {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Box,
  Check,
  Eye,
  Flame,
  Hand,
  Info,
  Lightbulb,
  Move,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import "./AgastyaGiftsGame.css";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const BASE = "/images/ramayana/interactions/";

const IMAGES = {
  environment: `${BASE}ch7game21.jpg`,
  agastya: `${BASE}ch7game22.jpg`,
  fire: `${BASE}ch7game23.jpg`,
  offering: `${BASE}ch7game24.jpg`,
  quivers: `${BASE}ch7game25.jpg`,
};

const ROUNDS = [
  {
    id: 1,
    label: "THE FIRST INVOCATION",
    deity: "AGNI",
    title: "An offering to Agni",
    mantra: "ॐ अग्नये स्वाहा",
    transliteration: "Om Agnaye Svaha",
    meaning: "A traditional invocation accompanying an offering to Agni.",
    words: ["ॐ", "अग्नये", "स्वाहा"],
    shuffled: ["स्वाहा", "ॐ", "अग्नये"],
    glossary: ["The sacred syllable", "To Agni, the fire", "Said as the offering is made"],
    narration:
      "The sacred fire receives the first offering. Let the words be placed in their rightful order.",
  },
  {
    id: 2,
    label: "THE SECOND INVOCATION",
    deity: "SOMA",
    title: "The offering continues",
    mantra: "ॐ सोमाय स्वाहा",
    transliteration: "Om Somaya Svaha",
    meaning: "A traditional offering formula addressed to Soma.",
    words: ["ॐ", "सोमाय", "स्वाहा"],
    shuffled: ["सोमाय", "स्वाहा", "ॐ"],
    glossary: ["The sacred syllable", "To Soma", "Said as the offering is made"],
    narration:
      "The ritual continues. Once again, bring the words together before making the offering.",
  },
  {
    id: 3,
    label: "THE FINAL INVOCATION",
    deity: "PRAJAPATI",
    title: "The concluding offering",
    mantra: "ॐ प्रजापतये स्वाहा",
    transliteration: "Om Prajapataye Svaha",
    meaning: "A traditional offering formula addressed to Prajapati.",
    words: ["ॐ", "प्रजापतये", "स्वाहा"],
    shuffled: ["स्वाहा", "प्रजापतये", "ॐ"],
    glossary: ["The sacred syllable", "To Prajapati, lord of beings", "Said as the offering is made"],
    narration:
      "The final invocation awaits. Complete the sequence, and the sage's gifts shall be revealed.",
  },
];

const GIFTS = [
  {
    id: "quivers",
    kicker: "GIFT I",
    title: "The Inexhaustible Quivers",
    subtitle: "Two celestial quivers, entrusted to Rama by Sage Agastya.",
    description:
      "The quivers would never be exhausted, a gift of extraordinary significance for the journey ahead.",
    next: "REVEAL THE NEXT GIFT",
  },
  {
    id: "sword",
    kicker: "GIFT II",
    title: "The Sword of the Sage",
    subtitle: "A magnificent sword, presented with a richly decorated golden sheath.",
    description:
      "The sword and its golden sheath were among the sacred gifts entrusted to Rama.",
    next: "CONTINUE",
  },
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

// Shared pointer position (-1..1) read by 3D scenes without re-rendering React.
const POINTER = { x: 0, y: 0 };

const vibrate = (ms) => {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {
    /* ignore */
  }
};

function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function slotFromPoint(point) {
  if (typeof document === "undefined") return null;
  const els = document.elementsFromPoint(
    point.x - window.scrollX,
    point.y - window.scrollY
  );
  for (const el of els) {
    const slot = el.closest ? el.closest("[data-slot]") : null;
    if (slot) return Number(slot.dataset.slot);
  }
  return null;
}

let softTex = null;
function getSoftTexture() {
  if (softTex || typeof document === "undefined") return softTex;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  softTex = new THREE.CanvasTexture(c);
  return softTex;
}

/* ------------------------------------------------------------------ */
/*  SOUND (synthesised with WebAudio, no asset files needed)           */
/* ------------------------------------------------------------------ */

function useSfx(enabled) {
  const ctxRef = useRef(null);
  const enabledRef = useRef(enabled);
  const droneRef = useRef(null);
  enabledRef.current = enabled;

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const note = useCallback(
    (freq, { dur = 0.5, type = "sine", vol = 0.06, delay = 0, glide = 0 } = {}) => {
      if (!enabledRef.current) return;
      const c = getCtx();
      if (!c) return;
      const t = c.currentTime + delay;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (glide) o.frequency.exponentialRampToValueAtTime(freq * glide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    [getCtx]
  );

  const noise = useCallback(
    (dur, vol, freq) => {
      if (!enabledRef.current) return;
      const c = getCtx();
      if (!c) return;
      const len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      const filter = c.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      const g = c.createGain();
      const t = c.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(c.destination);
      src.start(t);
    },
    [getCtx]
  );

  const play = useCallback(
    (name) => {
      switch (name) {
        case "pick":
          note(660, { dur: 0.12, type: "triangle", vol: 0.035 });
          break;
        case "place":
          note(392, { dur: 0.35, type: "triangle", vol: 0.055 });
          note(588, { dur: 0.5, vol: 0.025, delay: 0.04 });
          break;
        case "error":
          note(190, { dur: 0.35, type: "sawtooth", vol: 0.03, glide: 0.8 });
          note(150, { dur: 0.4, type: "sawtooth", vol: 0.025, delay: 0.12, glide: 0.8 });
          break;
        case "success":
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            note(f, { dur: 1.5, vol: 0.045, delay: i * 0.13 });
            note(f * 2.01, { dur: 1.1, vol: 0.012, delay: i * 0.13 });
          });
          break;
        case "offer":
          noise(2, 0.07, 900);
          note(110, { dur: 2.2, vol: 0.07, glide: 1.7 });
          note(220, { dur: 2, vol: 0.03, delay: 0.2, glide: 1.5 });
          break;
        case "reveal":
          [392, 587.33, 783.99, 1174.66].forEach((f, i) => {
            note(f, { dur: 2, vol: 0.04, delay: i * 0.16 });
          });
          noise(1.2, 0.025, 4000);
          break;
        case "blast":
          noise(2.4, 0.16, 300);
          noise(1.6, 0.1, 2600);
          note(70, { dur: 2.2, type: "sawtooth", vol: 0.1, glide: 0.4 });
          [523.25, 783.99, 1046.5, 1568].forEach((f, i) => {
            note(f, { dur: 2.2, vol: 0.04, delay: 0.5 + i * 0.05 });
          });
          break;
        case "bell":
          note(880, { dur: 2.4, vol: 0.05 });
          note(1318.5, { dur: 2, vol: 0.02, delay: 0.02 });
          break;
        default:
          break;
      }
    },
    [note, noise]
  );

  // Soft tanpura-like drone while sound is on
  useEffect(() => {
    if (!enabled) return undefined;
    const c = getCtx();
    if (!c) return undefined;
    const master = c.createGain();
    master.gain.setValueAtTime(0.0001, c.currentTime);
    master.gain.exponentialRampToValueAtTime(0.028, c.currentTime + 2);
    master.connect(c.destination);
    const oscs = [98, 147, 196.5].map((f, i) => {
      const o = c.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.value = i === 0 ? 1 : 0.35;
      o.connect(g);
      g.connect(master);
      o.start();
      return o;
    });
    droneRef.current = { master, oscs };
    return () => {
      const now = c.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      oscs.forEach((o) => o.stop(now + 0.6));
    };
  }, [enabled, getCtx]);

  useEffect(
    () => () => {
      if (ctxRef.current) ctxRef.current.close().catch(() => {});
    },
    []
  );

  return play;
}

/* ------------------------------------------------------------------ */
/*  3D: SHARED PIECES                                                  */
/* ------------------------------------------------------------------ */

class GLBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {}

  render() {
    return this.state.failed ? this.props.fallback || null : this.props.children;
  }
}

function EnvMap() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Particles({
  count = 80,
  spreadX = 3.4,
  spreadY = 3.2,
  spreadZ = 2.2,
  originY = -0.1,
  rise = 0.55,
  drift = 0.25,
  size = 0.09,
  color = "#ffc66b",
  opacity = 0.9,
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * spreadX;
      arr[i * 3 + 1] = originY + Math.random() * spreadY;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count, spreadX, spreadY, spreadZ, originY]);

  const seeds = useMemo(
    () => Float32Array.from({ length: count }, () => 0.4 + Math.random() * 0.9),
    [count]
  );
  const tex = useMemo(() => getSoftTexture(), []);

  useFrame((state, delta) => {
    const p = geom.attributes.position.array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i += 1) {
      p[i * 3 + 1] += rise * seeds[i] * delta;
      p[i * 3] += Math.sin(t * 0.9 + i * 1.7) * drift * delta * seeds[i];
      p[i * 3 + 2] += Math.cos(t * 0.7 + i) * drift * 0.5 * delta;
      if (p[i * 3 + 1] > originY + spreadY) {
        p[i * 3 + 1] = originY;
        p[i * 3] = (Math.random() - 0.5) * spreadX;
      }
    }
    geom.attributes.position.needsUpdate = true;
  });

  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <points geometry={geom} frustumCulled={false}>
      <pointsMaterial
        map={tex}
        color={color}
        size={size}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function OrbitSparkles({ count = 40, radius = 1.9, color = "#ffd98f" }) {
  const group = useRef();
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = radius * (0.75 + Math.random() * 0.5);
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2.6;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count, radius]);
  const tex = useMemo(() => getSoftTexture(), []);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.35;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
    }
  });
  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <group ref={group}>
      <points geometry={geom} frustumCulled={false}>
        <pointsMaterial
          map={tex}
          color={color}
          size={0.12}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  3D: AMBIENT FIREFLIES                                              */
/* ------------------------------------------------------------------ */

function AmbientCanvas() {
  return (
    <div className="ag-ambient" aria-hidden="true">
      <GLBoundary>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: false }}
        >
          <Suspense fallback={null}>
            <Particles
              count={70}
              spreadX={13}
              spreadY={9}
              spreadZ={5}
              originY={-4.5}
              rise={0.14}
              drift={0.35}
              size={0.09}
              opacity={0.55}
              color="#ffd98f"
            />
            <Particles
              count={26}
              spreadX={11}
              spreadY={9}
              spreadZ={4}
              originY={-4.5}
              rise={0.55}
              drift={0.2}
              size={0.07}
              opacity={0.7}
              color="#ff9a3c"
            />
          </Suspense>
        </Canvas>
      </GLBoundary>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3D: SACRED FIRE (shader flames)                                    */
/* ------------------------------------------------------------------ */

const FLAME_VERT = `
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float h = uv.y;
  p.x += sin(uTime * 3.1 + h * 4.0) * 0.07 * h * h + sin(uTime * 6.3 + h * 7.0) * 0.03 * h;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const FLAME_FRAG = `
precision highp float;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  float h = vUv.y;
  float x = (vUv.x - 0.5) * 2.0;
  float n = noise(vec2(x * 1.6, h * 2.4 - uTime * 1.7)) * 0.62
          + noise(vec2(x * 3.4 + 4.0, h * 5.0 - uTime * 2.8)) * 0.38;
  float width = (1.0 - pow(h, 0.8)) * 0.9;
  float d = abs(x + (n - 0.5) * 0.7 * h);
  float shape = smoothstep(width, width * 0.2, d);
  shape *= smoothstep(1.0, 0.45, h + (n - 0.5) * 0.4);
  shape *= smoothstep(0.0, 0.06, h);
  float core = smoothstep(width * 0.55, 0.0, d) * (1.0 - h);
  vec3 col = mix(uColorB, uColorA, smoothstep(0.0, 0.6, 1.0 - h));
  col += vec3(1.0, 0.85, 0.55) * core * 0.5;
  gl_FragColor = vec4(col * uIntensity, shape * clamp(uIntensity, 0.0, 1.0));
}
`;

function FlamePlane({ w, h, rotY = 0, phase = 0, colorA, colorB, levelRef }) {
  const mat = useRef();
  const uniforms = useMemo(
    () => ({
      uTime: { value: phase },
      uIntensity: { value: 1 },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    }),
    [phase, colorA, colorB]
  );

  useFrame((state) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = state.clock.elapsedTime + phase;
    mat.current.uniforms.uIntensity.value = 0.95 * (levelRef ? levelRef.current : 1);
  });

  return (
    <mesh position={[0, h / 2, 0]} rotation={[0, rotY, 0]}>
      <planeGeometry args={[w, h, 1, 12]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={FLAME_VERT}
        fragmentShader={FLAME_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

const FLAME_SET = [
  { x: 0, z: 0, w: 1.25, h: 2.0, phase: 0, a: "#fff2b0", b: "#ff8a22" },
  { x: -0.58, z: 0.1, w: 0.9, h: 1.45, phase: 1.7, a: "#ffd070", b: "#ff6a1c" },
  { x: 0.6, z: -0.05, w: 0.85, h: 1.35, phase: 3.1, a: "#ffd070", b: "#ff5a18" },
  { x: -0.2, z: -0.38, w: 0.7, h: 1.1, phase: 4.4, a: "#ffe9a0", b: "#ff7a28" },
  { x: 0.3, z: 0.4, w: 0.6, h: 0.95, phase: 5.2, a: "#ffe9a0", b: "#ff7a28" },
];

function Havan3D({ intense = false }) {
  const { clock } = useThree();
  const flames = useRef();
  const ring = useRef();
  const ringMat = useRef();
  const ladle = useRef();
  const lightRef = useRef();
  const coalMat = useRef();
  const level = useRef(1);
  const burstAt = useRef(-100);

  useEffect(() => {
    if (intense) burstAt.current = clock.elapsedTime;
  }, [intense, clock]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    level.current = THREE.MathUtils.damp(level.current, intense ? 1.5 : 1, 3, delta);

    if (flames.current) {
      const l = level.current;
      flames.current.scale.set(1 + (l - 1) * 0.35, l, 1 + (l - 1) * 0.35);
    }
    if (lightRef.current) {
      lightRef.current.intensity =
        (3.2 + Math.sin(t * 9) * 0.45 + Math.sin(t * 13.7) * 0.3) * level.current;
    }
    if (coalMat.current) {
      coalMat.current.emissiveIntensity = 1.4 + Math.sin(t * 4) * 0.35 + (level.current - 1);
    }
    if (ladle.current) {
      const target = intense ? -1.05 : -0.25;
      ladle.current.rotation.z = THREE.MathUtils.damp(ladle.current.rotation.z, target, 3, delta);
      ladle.current.position.y = THREE.MathUtils.damp(
        ladle.current.position.y,
        intense ? 1.0 : 0.3,
        3,
        delta
      );
    }
    if (ring.current && ringMat.current) {
      const age = t - burstAt.current;
      if (age >= 0 && age < 1.7) {
        ring.current.visible = true;
        const s = 1 + age * 3.6;
        ring.current.scale.set(s, s, s);
        ringMat.current.opacity = (1 - age / 1.7) * 0.7;
      } else {
        ring.current.visible = false;
      }
    }

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, POINTER.x * 0.7, 2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 2.2 - POINTER.y * 0.3, 2, delta);
    state.camera.lookAt(0, 0.9, 0);
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight ref={lightRef} position={[0, 1.4, 1.6]} color="#ff9a37" intensity={3.4} distance={9} />
      <pointLight position={[-2.6, 2.6, -2]} color="#e4b56f" intensity={1} />

      {/* Kund: stepped stone platform */}
      <mesh position={[0, -0.62, 0]}>
        <boxGeometry args={[3.1, 0.3, 2.4]} />
        <meshStandardMaterial color="#3d2a1d" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[2.7, 0.16, 2.0]} />
        <meshStandardMaterial color="#7d5736" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.26, 0]}>
        <boxGeometry args={[2.4, 0.12, 1.75]} />
        <meshStandardMaterial color="#b97a3c" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[2.05, 0.14, 1.45]} />
        <meshStandardMaterial
          ref={coalMat}
          color="#2a1a10"
          emissive="#ff4f12"
          emissiveIntensity={1.4}
          roughness={0.9}
        />
      </mesh>

      {/* Logs */}
      {[-0.55, 0, 0.55].map((z, i) => (
        <mesh key={`lx${i}`} position={[0, 0.0, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.085, 0.1, 1.7, 10]} />
          <meshStandardMaterial color="#5e3820" roughness={0.9} />
        </mesh>
      ))}
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={`lz${i}`} position={[x, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 1.3, 10]} />
          <meshStandardMaterial color="#6e4326" roughness={0.9} />
        </mesh>
      ))}

      {/* Flames */}
      <group ref={flames} position={[0, 0.15, 0]}>
        {FLAME_SET.map((f, i) => (
          <group key={i} position={[f.x, 0, f.z]}>
            <FlamePlane w={f.w} h={f.h} phase={f.phase} colorA={f.a} colorB={f.b} levelRef={level} />
            <FlamePlane
              w={f.w}
              h={f.h}
              rotY={1.05}
              phase={f.phase + 0.9}
              colorA={f.a}
              colorB={f.b}
              levelRef={level}
            />
          </group>
        ))}
      </group>

      {/* Ladle (sruva) pouring ghee */}
      <group ref={ladle} position={[1.45, 0.3, 0.6]} rotation={[0, 0, -0.25]}>
        <mesh position={[0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.04, 1.5, 10]} />
          <meshStandardMaterial color="#c8923f" metalness={0.9} roughness={0.28} />
        </mesh>
        <mesh position={[-0.12, 0, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e2b25a" metalness={0.9} roughness={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Shockwave ring when the offering is made */}
      <mesh ref={ring} position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.9, 1.0, 64]} />
        <meshBasicMaterial
          ref={ringMat}
          color="#ffcf7a"
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Particles
        count={intense ? 120 : 70}
        spreadX={2.4}
        spreadY={3.4}
        spreadZ={1.6}
        originY={0}
        rise={intense ? 1.3 : 0.75}
        drift={0.3}
        size={0.075}
        color="#ffc66b"
      />
    </>
  );
}

function HavanCanvas({ intense = false, className = "ag-3d-fire" }) {
  return (
    <div className={className} aria-hidden="true">
      <GLBoundary>
        <Canvas
          camera={{ position: [0, 2.2, 5.6], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
        >
          <Suspense fallback={null}>
            <Havan3D intense={intense} />
          </Suspense>
        </Canvas>
      </GLBoundary>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3D: THE GIFTS                                                      */
/* ------------------------------------------------------------------ */

function Spinner({ rot, children }) {
  const g = useRef();
  useFrame((state, delta) => {
    if (!g.current) return;
    const r = rot.current;
    if (!r.down) {
      r.angle += r.vel;
      r.vel *= 0.94;
      r.angle += delta * 0.28;
    }
    g.current.rotation.y = r.angle;
    g.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.07;
  });
  return <group ref={g}>{children}</group>;
}

function Pedestal() {
  const ring = useRef();
  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.4;
  });
  return (
    <group position={[0, -1.45, 0]}>
      <mesh>
        <cylinderGeometry args={[1.35, 1.55, 0.14, 56]} />
        <meshStandardMaterial color="#2c1c11" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[1.2, 1.25, 0.04, 56]} />
        <meshStandardMaterial color="#d7b16b" metalness={0.9} roughness={0.25} emissive="#7a4a15" emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={ring} position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.012, 8, 96]} />
        <meshBasicMaterial color="#ffe0a0" />
      </mesh>
      <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 1.1, 64]} />
        <meshBasicMaterial
          color="#ffb85a"
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Quiver({ position, rotation, gem = "#b3122a" }) {
  const radiusAt = (y) => 0.215 + y * 0.0263;
  const arrows = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        const r = i === 0 ? 0 : 0.1;
        const dx = Math.cos(a) * r;
        const dz = Math.sin(a) * r;
        return { dx, dz, lean: [dz * 0.9, 0, -dx * 0.9], i };
      }),
    []
  );

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[0.24, 0.19, 1.9, 32]} />
        <meshStandardMaterial color="#5a2f17" roughness={0.5} metalness={0.15} envMapIntensity={0.9} />
      </mesh>
      {[-0.78, -0.1, 0.62].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radiusAt(y) + 0.006, 0.026, 10, 40]} />
          <meshStandardMaterial color="#e1b85f" metalness={1} roughness={0.22} envMapIntensity={1.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.245, 0.04, 12, 40]} />
        <meshStandardMaterial color="#f0cd7a" metalness={1} roughness={0.2} envMapIntensity={1.3} />
      </mesh>
      <mesh position={[0, -1.03, 0]}>
        <cylinderGeometry args={[0.19, 0.1, 0.2, 24]} />
        <meshStandardMaterial color="#d3a64f" metalness={1} roughness={0.25} envMapIntensity={1.3} />
      </mesh>
      <mesh position={[0, 0.26, 0.215]}>
        <octahedronGeometry args={[0.065, 0]} />
        <meshStandardMaterial color={gem} emissive={gem} emissiveIntensity={0.55} roughness={0.15} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.26, 0.208]}>
        <torusGeometry args={[0.085, 0.014, 8, 24]} />
        <meshStandardMaterial color="#f4d58f" metalness={1} roughness={0.2} />
      </mesh>

      {arrows.map(({ dx, dz, lean, i }) => (
        <group key={i} position={[dx, 0.95, dz]} rotation={lean}>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.95, 8]} />
            <meshStandardMaterial color="#c9a063" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.92, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#e1b85f" metalness={1} roughness={0.25} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0, 0.72, 0]} rotation={[0, (k * Math.PI) / 3, 0]}>
              <boxGeometry args={[0.11, 0.26, 0.004]} />
              <meshStandardMaterial color={i % 2 ? "#a3182c" : "#f1e4c6"} roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Quivers3D() {
  return (
    <group>
      <Quiver position={[-0.52, 0.1, 0]} rotation={[0, 0, 0.13]} gem="#b3122a" />
      <Quiver position={[0.52, 0.1, -0.1]} rotation={[0, 0, -0.13]} gem="#0f8a5f" />
    </group>
  );
}

function Sword3D() {
  const bladeGeo = useMemo(() => {
    const s = new THREE.Shape();
    const L = 1.15;
    const w = 0.085;
    s.moveTo(0, -w);
    s.lineTo(L - 0.28, -w);
    s.lineTo(L, 0);
    s.lineTo(L - 0.28, w);
    s.lineTo(0, w);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.022,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.008,
      bevelSegments: 2,
    });
  }, []);
  useEffect(() => () => bladeGeo.dispose(), [bladeGeo]);

  const gold = { color: "#e1b85f", metalness: 1, roughness: 0.22, envMapIntensity: 1.35 };

  return (
    <group position={[-0.35, 0.1, 0]} rotation={[0.05, 0, -0.2]}>
      {/* Pommel + grip */}
      <mesh position={[-1.32, 0, 0]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      <mesh position={[-1.32, 0, 0.14]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#b3122a" emissive="#b3122a" emissiveIntensity={0.7} roughness={0.12} />
      </mesh>
      <mesh position={[-1.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.52, 16]} />
        <meshStandardMaterial color="#4b3020" roughness={0.7} />
      </mesh>
      {[-1.16, -1.0, -0.84].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.078, 0.014, 8, 20]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      ))}
      {/* Cross guard */}
      <mesh position={[-0.7, 0, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.12]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      {[-0.3, 0.3].map((y) => (
        <mesh key={y} position={[-0.7, y, 0]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      ))}
      {/* Drawn blade */}
      <mesh geometry={bladeGeo} position={[-0.64, 0, -0.011]}>
        <meshStandardMaterial color="#e9edf2" metalness={1} roughness={0.12} envMapIntensity={1.6} />
      </mesh>
      <mesh position={[-0.2, 0, 0.018]}>
        <boxGeometry args={[0.8, 0.014, 0.006]} />
        <meshStandardMaterial color="#8c96a3" metalness={1} roughness={0.3} />
      </mesh>
      {/* Sheath */}
      <mesh position={[0.98, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.6]}>
        <capsuleGeometry args={[0.125, 1.75, 6, 20]} />
        <meshStandardMaterial color="#c79a43" metalness={0.85} roughness={0.28} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0.06, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.125, 0.03, 10, 28]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      {[0.45, 0.98, 1.5].map((x, i) => (
        <group key={x}>
          <mesh position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.13, 0.022, 8, 28]} />
            <meshStandardMaterial {...gold} />
          </mesh>
          <mesh position={[x + 0.24, 0, 0.078]} rotation={[0, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.05, 0]} />
            <meshStandardMaterial
              color={i % 2 ? "#0f8a5f" : "#b3122a"}
              emissive={i % 2 ? "#0f8a5f" : "#b3122a"}
              emissiveIntensity={0.5}
              roughness={0.15}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[1.98, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.2, 20]} />
        <meshStandardMaterial {...gold} />
      </mesh>
    </group>
  );
}

function GiftCanvas({ type, rot }) {
  return (
    <GLBoundary>
      <Canvas
        camera={{ position: [0, 1.1, 5.3], fov: 38 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <EnvMap />
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 4, 3]} intensity={2.2} color="#ffe2aa" />
          <directionalLight position={[-3, 1.5, -2]} intensity={1.1} color="#ff9a4a" />
          <pointLight position={[0, -1, 2]} intensity={2.5} color="#ffb45a" distance={6} />
          <Pedestal />
          <Spinner rot={rot}>{type === "quivers" ? <Quivers3D /> : <Sword3D />}</Spinner>
          <OrbitSparkles count={46} radius={1.9} />
        </Suspense>
      </Canvas>
    </GLBoundary>
  );
}

/* ------------------------------------------------------------------ */
/*  UI PIECES                                                          */
/* ------------------------------------------------------------------ */

function Mandala({ className = "" }) {
  const petals = Array.from({ length: 24 }, (_, i) => i);
  return (
    <svg className={`ag-mandala ${className}`} viewBox="-100 -100 200 200" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="0.35">
        {[96, 86, 70, 52, 34, 18].map((r, i) => (
          <circle key={r} r={r} strokeDasharray={i % 2 ? "1 2.4" : undefined} opacity={0.9 - i * 0.08} />
        ))}
        {petals.map((i) => (
          <path
            key={`p${i}`}
            transform={`rotate(${i * 15})`}
            d="M0 -52 C 9 -66 9 -80 0 -92 C -9 -80 -9 -66 0 -52Z"
          />
        ))}
        {petals.map((i) => (
          <path
            key={`s${i}`}
            transform={`rotate(${i * 15 + 7.5})`}
            d="M0 -34 L 5 -48 L 0 -58 L -5 -48Z"
            opacity="0.7"
          />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`l${i}`} x1="0" y1="-18" x2="0" y2="-96" transform={`rotate(${i * 30})`} opacity="0.35" />
        ))}
      </g>
    </svg>
  );
}

function SplitText({ text, delay = 0, className = "" }) {
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          aria-hidden="true"
          className="ag-char"
          initial={{ opacity: 0, y: 28, rotateX: -70 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: delay + i * 0.045, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

function SceneBG({ image, px, py }) {
  const x = useTransform(px, (v) => v * -28);
  const y = useTransform(py, (v) => v * -18);
  return (
    <div className="ag-bg-wrap">
      <motion.div className="ag-bg" style={{ backgroundImage: `url(${image})`, x, y }} />
    </div>
  );
}

function SparkBurst({ k }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
        const d = 60 + Math.random() * 90;
        return {
          x: Math.cos(a) * d,
          y: Math.sin(a) * d * 0.55 - 18,
          s: 0.5 + Math.random() * 0.9,
          delay: Math.random() * 0.1,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [k]
  );
  return (
    <div className="ag-sparks" aria-hidden="true">
      {sparks.map((s, i) => (
        <motion.i
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: s.s }}
          animate={{ x: s.x, y: s.y, opacity: 0, scale: 0 }}
          transition={{ duration: 1.2, delay: s.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function DragWord({ word, variant, index, disabled, onTap, onDragMove, onDrop }) {
  return (
    <motion.button
      type="button"
      className={`ag-word-card ag-word--${variant}`}
      drag={!disabled}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.18}
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={!disabled ? { y: -4, scale: 1.04 } : undefined}
      whileDrag={{ scale: 1.1, zIndex: 80, cursor: "grabbing" }}
      onTap={() => {
        if (!disabled) onTap(word);
      }}
      onClick={(e) => {
        // keyboard activation (Enter / Space) has detail === 0
        if (e.detail === 0 && !disabled) onTap(word);
      }}
      onDrag={(e, info) => onDragMove(info.point)}
      onDragEnd={(e, info) => onDrop(word, info.point)}
      disabled={disabled}
      aria-label={`Word ${word}`}
    >
      {index !== undefined && (
        <span className="ag-word-index">{String(index + 1).padStart(2, "0")}</span>
      )}
      <span className="ag-word-text">{word}</span>
      {variant === "tray" && <Move size={13} className="ag-word-move" />}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  SCENES                                                             */
/* ------------------------------------------------------------------ */

function GiftReveal({ giftIndex, onNext, px, py, play }) {
  const gift = GIFTS[giftIndex];
  const isQuivers = gift.id === "quivers";
  const [view, setView] = useState("3d");
  const rot = useRef({ angle: 0, vel: 0, down: false, lastX: 0 });

  useEffect(() => {
    play("reveal");
    vibrate(30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const down = (e) => {
    rot.current.down = true;
    rot.current.lastX = e.clientX;
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    const r = rot.current;
    if (!r.down) return;
    const dx = e.clientX - r.lastX;
    r.lastX = e.clientX;
    r.angle += dx * 0.012;
    r.vel = dx * 0.012;
  };
  const up = () => {
    rot.current.down = false;
  };

  return (
    <motion.section
      className="ag-reveal ag-scene"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.8 }}
    >
      <SceneBG image={IMAGES.environment} px={px} py={py} />
      <div className="ag-scene-vignette ag-reveal-vignette" />
      <div className="ag-rays" aria-hidden="true" />

      <div className="ag-reveal-content">
        <motion.div
          className="ag-reveal-kicker"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Sparkles size={14} />
          THE SAGE'S CELESTIAL GIFTS
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {gift.title}
        </motion.h2>

        <motion.p
          className="ag-reveal-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {gift.subtitle}
        </motion.p>

        <motion.div
          className={`ag-gift-art ${isQuivers ? "is-quivers" : "is-sword"}`}
          initial={{ opacity: 0, y: 45, scale: 0.78 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.35, duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <Mandala className="ag-gift-mandala" />
          <div className="ag-gift-aura" />
          {view === "3d" || !isQuivers ? (
            <div
              className="ag-gift-3d"
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
            >
              <GiftCanvas type={gift.id} rot={rot} />
              <div className="ag-drag-hint">
                <Hand size={12} /> DRAG TO TURN
              </div>
            </div>
          ) : (
            <div className="ag-gift-frame">
              <img src={IMAGES.quivers} alt="The two divine quivers" />
            </div>
          )}
        </motion.div>

        {isQuivers && (
          <motion.div
            className="ag-view-tabs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <button
              type="button"
              className={view === "3d" ? "is-active" : ""}
              onClick={() => {
                setView("3d");
                play("pick");
              }}
            >
              <Box size={12} /> 3D VIEW
            </button>
            <button
              type="button"
              className={view === "art" ? "is-active" : ""}
              onClick={() => {
                setView("art");
                play("pick");
              }}
            >
              <Eye size={12} /> ARTWORK
            </button>
          </motion.div>
        )}

        <motion.div
          className="ag-gift-description"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <span className="ag-gift-number">{gift.kicker}</span>
          <p>{gift.description}</p>
        </motion.div>

        <motion.button
          type="button"
          className="ag-primary-button"
          onClick={onNext}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <span>{gift.next}</span>
          <ArrowRight size={17} />
        </motion.button>
      </div>
    </motion.section>
  );
}

function FlashFinale({ onDone, play }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const blast = window.setTimeout(() => {
      play("blast");
      vibrate([60, 40, 120]);
    }, 450);
    const end = window.setTimeout(() => {
      if (doneRef.current) doneRef.current();
    }, 2300);
    return () => {
      window.clearTimeout(blast);
      window.clearTimeout(end);
    };
  }, [play]);

  return (
    <motion.section className="ag-finale" initial={{ opacity: 1 }} animate={{ opacity: 1 }} aria-hidden="true">
      <motion.div
        className="ag-finale-charge"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 1, 1], scale: [0.4, 1, 1.2] }}
        transition={{ duration: 0.5, ease: "easeIn" }}
      />
      {[0, 0.12, 0.26].map((d, i) => (
        <motion.div
          key={i}
          className="ag-finale-ring"
          initial={{ opacity: 0, scale: 0.1 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.1, 14 + i * 4] }}
          transition={{ delay: 0.45 + d, duration: 1.3, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="ag-finale-blast"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 1], scale: [0, 18, 40] }}
        transition={{ delay: 0.45, duration: 1.2, ease: [0.2, 0.8, 0.3, 1] }}
      />
      <motion.div
        className="ag-finale-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 1] }}
        transition={{ delay: 0.45, duration: 1.5, times: [0, 0.25, 0.7, 1] }}
      />
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN GAME                                                          */
/* ------------------------------------------------------------------ */

export default function AgastyaGiftsGame({ onClose }) {
  const [stage, setStage] = useState("intro");
  const [roundIndex, setRoundIndex] = useState(0);
  const [order, setOrder] = useState(() => shuffle(ROUNDS[0].shuffled));
  const [slots, setSlots] = useState([null, null, null]);
  const [feedback, setFeedback] = useState({ tone: "info", text: "" });
  const [wrongSlots, setWrongSlots] = useState([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [hoverSlot, setHoverSlot] = useState(null);
  const [solved, setSolved] = useState(false);
  const [offering, setOffering] = useState(false);
  const [roundMistakes, setRoundMistakes] = useState(0);
  const [, setStats] = useState({ mistakes: 0, hints: 0 });
  const [giftIndex, setGiftIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  const timerRef = useRef(null);
  const wrongTimer = useRef(null);
  const play = useSfx(soundOn);

  // Parallax pointer
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 60, damping: 20 });
  const spy = useSpring(py, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const onMove = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      POINTER.x = nx * 2;
      POINTER.y = ny * 2;
      px.set(nx);
      py.set(ny);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Preload artwork so scenes never pop in
  useEffect(() => {
    Object.values(IMAGES).forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      window.clearTimeout(wrongTimer.current);
    },
    []
  );

  const round = ROUNDS[roundIndex];
  const pool = order.filter((w) => !slots.includes(w));
  const filledCount = slots.filter(Boolean).length;

  const totalProgress =
    stage === "intro"
      ? 0
      : stage === "ritual"
        ? (roundIndex / 3) * 68 + (filledCount / 3) * 8 + (solved ? 6 : 0)
        : stage === "reveal"
          ? 82 + giftIndex * 6
          : 100;

  // Reset the board whenever a round starts
  useEffect(() => {
    if (stage !== "ritual") return;
    setOrder(shuffle(ROUNDS[roundIndex].shuffled));
    setSlots([null, null, null]);
    setFeedback({ tone: "info", text: "" });
    setWrongSlots([]);
    setHoverSlot(null);
    setSolved(false);
    setOffering(false);
    setRoundMistakes(0);
  }, [roundIndex, stage]);

  const placeWord = useCallback(
    (word, target) => {
      if (!word || offering || solved) return;
      setSlots((current) => {
        const next = [...current];
        const from = next.indexOf(word);
        const displaced = next[target];
        if (from === target) return current;
        if (from !== -1) next[from] = displaced || null;
        next[target] = word;
        return next;
      });
      setWrongSlots([]);
      setFeedback({ tone: "info", text: "" });
      play("place");
      vibrate(10);
    },
    [offering, solved, play]
  );

  const returnWord = useCallback(
    (word) => {
      if (offering || solved) return;
      setSlots((current) => current.map((w) => (w === word ? null : w)));
      setWrongSlots([]);
      setFeedback({ tone: "info", text: "" });
      play("pick");
    },
    [offering, solved, play]
  );

  const tapTrayWord = useCallback(
    (word) => {
      const empty = slots.findIndex((w) => w === null);
      if (empty !== -1) placeWord(word, empty);
    },
    [slots, placeWord]
  );

  const handleDragMove = useCallback((point) => {
    setHoverSlot(slotFromPoint(point));
  }, []);

  const handleDrop = useCallback(
    (word, point) => {
      const idx = slotFromPoint(point);
      setHoverSlot(null);
      if (idx !== null) placeWord(word, idx);
    },
    [placeWord]
  );

  const checkMantra = () => {
    if (filledCount !== 3) {
      setFeedback({ tone: "warn", text: "Place all three words before checking the invocation." });
      play("error");
      return;
    }
    const wrong = slots
      .map((w, i) => (w === round.words[i] ? -1 : i))
      .filter((i) => i >= 0);

    if (wrong.length === 0) {
      setSolved(true);
      setFeedback({ tone: "ok", text: "The invocation is complete. The offering may now be made." });
      play("success");
      vibrate([20, 40, 20]);
    } else {
      setWrongSlots(wrong);
      setShakeKey((k) => k + 1);
      setRoundMistakes((m) => m + 1);
      setStats((s) => ({ ...s, mistakes: s.mistakes + 1 }));
      setFeedback({ tone: "error", text: "The words have not yet found their rightful order. Try again." });
      play("error");
      vibrate(60);
      window.clearTimeout(wrongTimer.current);
      wrongTimer.current = window.setTimeout(() => setWrongSlots([]), 1100);
    }
  };

  const giveHint = () => {
    const idx = slots.findIndex((w, i) => w !== round.words[i]);
    if (idx === -1) return;
    setStats((s) => ({ ...s, hints: s.hints + 1 }));
    placeWord(round.words[idx], idx);
    setFeedback({ tone: "info", text: `A word has been guided to position ${idx + 1}.` });
  };

  const makeOffering = () => {
    if (offering || !solved) return;
    setOffering(true);
    setFeedback({ tone: "info", text: "The offering is presented to the sacred fire…" });
    play("offer");
    vibrate(50);

    timerRef.current = window.setTimeout(() => {
      if (roundIndex < ROUNDS.length - 1) {
        setRoundIndex((c) => c + 1);
      } else {
        setStage("reveal");
        setGiftIndex(0);
      }
    }, 2400);
  };

  const startRitual = () => {
    play("bell");
    setStats({ mistakes: 0, hints: 0 });
    setRoundIndex(0);
    setStage("ritual");
  };

  const continueGift = () => {
    if (giftIndex === 0) {
      setGiftIndex(1);
    } else {
      setStage("finale");
    }
  };

  const toggleSound = () => setSoundOn((v) => !v);

  return (
    <div className="ag-game">
      <div className="ag-backdrop" />

      <header className="ag-topbar">
        <div className="ag-brand">
          <span className="ag-brand-mark">
            <Flame size={17} />
          </span>
          <span>
            <strong>ANCESTRA</strong>
            <small>THE GIFTS OF AGASTYA</small>
          </span>
        </div>

        <div className="ag-top-progress">
          <div className="ag-progress-label">
            <span>THE SACRED RITUAL</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="ag-progress-track">
            <motion.div
              className="ag-progress-fill"
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="ag-top-actions">
          <button
            type="button"
            className={`ag-icon-button ${stage === "intro" && !soundOn ? "is-nudge" : ""}`}
            onClick={toggleSound}
            aria-label={soundOn ? "Mute sound" : "Enable sound"}
            title={soundOn ? "Mute sound" : "Enable sound"}
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      <main className="ag-main">
        <AmbientCanvas />

        <AnimatePresence mode="wait">
          {stage === "intro" && (
            <motion.section
              key="intro"
              className="ag-intro ag-scene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.025 }}
              transition={{ duration: 0.8 }}
            >
              <SceneBG image={IMAGES.environment} px={spx} py={spy} />
              <div className="ag-scene-vignette" />
              <div className="ag-om" aria-hidden="true">ॐ</div>
              <Mandala className="ag-intro-mandala" />
              <HavanCanvas className="ag-3d-fire ag-intro-fire" />

              <div className="ag-intro-content">
                <motion.div
                  className="ag-eyebrow"
                  initial={{ y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <span />
                  A SACRED ENCOUNTER
                  <span />
                </motion.div>

                <motion.div
                  className="ag-intro-symbol"
                  initial={{ scale: 0.6, opacity: 0, rotate: -18 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                >
                  <Flame size={34} strokeWidth={1.2} />
                </motion.div>

                <h1>
                  <SplitText text="The Gifts" delay={0.5} />
                  <em>
                    <SplitText text="of Sage Agastya" delay={1.0} />
                  </em>
                </h1>

                <motion.p
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.6 }}
                >
                  Before the gifts are revealed, the sacred offering must be completed. Enter the
                  hermitage and take part in the ritual.
                </motion.p>

                <motion.button
                  type="button"
                  className="ag-primary-button ag-enter-button"
                  onClick={startRitual}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.85 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span>ENTER THE RITUAL</span>
                  <ArrowRight size={17} />
                </motion.button>

                <motion.button
                  type="button"
                  className="ag-sound-hint"
                  onClick={toggleSound}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.1 }}
                >
                  {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  {soundOn ? "SOUND ON" : "BEST WITH SOUND · TAP TO ENABLE"}
                </motion.button>

                <motion.div
                  className="ag-intro-foot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.3 }}
                >
                  <span>
                    <Sparkles size={13} /> THREE INVOCATIONS
                  </span>
                  <i />
                  <span>THE FOREST OF DANDAKA</span>
                </motion.div>
              </div>
              <div className="ag-intro-bottom">
                <span>CHAPTER VII</span>
                <span>ARANYA KANDA</span>
              </div>
            </motion.section>
          )}

          {stage === "ritual" && (
            <motion.section
              key={`ritual-${roundIndex}`}
              className="ag-ritual ag-scene"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65 }}
            >
              <SceneBG image={IMAGES.environment} px={spx} py={spy} />
              <div className="ag-scene-vignette ag-ritual-vignette" />

              <div className="ag-ritual-heading">
                <div className="ag-eyebrow">
                  <span /> THE SACRED OFFERING <span />
                </div>
                <h2>{round.title}</h2>
                <p>{round.narration}</p>
              </div>

              <div className="ag-ritual-stage">
                <div className="ag-ritual-sage">
                  <img src={IMAGES.agastya} alt="Sage Agastya performing the sacred Havan" />
                  <div className="ag-sage-caption">
                    <span className="ag-caption-dot" />
                    SAGE AGASTYA
                  </div>
                </div>

                <div className={`ag-fire-stage ${offering ? "is-offering" : ""}`}>
                  <div className="ag-fire-halo" />
                  <img src={IMAGES.fire} alt="" className="ag-fire-photo" />
                  <HavanCanvas intense={offering} />
                  <div className="ag-fire-label">THE SACRED FIRE</div>
                  <AnimatePresence>
                    {offering && (
                      <motion.div
                        className="ag-orb"
                        initial={{ opacity: 0, y: 170, scale: 0.3 }}
                        animate={{ opacity: [0, 1, 1, 0], y: [170, 70, 0, -20], scale: [0.3, 1, 0.85, 0.2] }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      >
                        <span>ॐ</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="ag-offering-visual">
                  <img src={IMAGES.offering} alt="Traditional Havan offering plate" />
                  <span>THE OFFERING</span>
                </div>
              </div>

              <div className="ag-mantra-panel">
                <div className="ag-mantra-meta">
                  <span>{round.label}</span>
                  <span>INVOCATION {roundIndex + 1} / 3</span>
                </div>

                <div className="ag-mantra-display">
                  {round.words.map((word, index) => (
                    <motion.span
                      key={`${round.id}-${word}`}
                      animate={{
                        opacity: 1,
                        y: 0,
                        textShadow: solved
                          ? "0 0 26px rgba(255,205,115,.85)"
                          : "0 0 0px rgba(255,205,115,0)",
                      }}
                      initial={{ opacity: 0, y: 8 }}
                      transition={{ delay: index * 0.12 }}
                    >
                      {word}
                    </motion.span>
                  ))}
                  {solved && <SparkBurst k={round.id} />}
                </div>

                <div className="ag-mantra-transliteration">{round.transliteration}</div>

                <div className="ag-slots" aria-label="Mantra word order">
                  {slots.map((word, index) => (
                    <motion.div
                      key={`${round.id}-slot-${index}-${wrongSlots.includes(index) ? shakeKey : 0}`}
                      data-slot={index}
                      className={`ag-slot ${word ? "has-word" : ""} ${hoverSlot === index ? "is-hover" : ""} ${
                        wrongSlots.includes(index) ? "is-wrong" : ""
                      } ${solved ? "is-solved" : ""}`}
                      aria-label={`Mantra position ${index + 1}${word ? `, ${word}` : ", empty"}`}
                    >
                      <span className="ag-slot-number">{String(index + 1).padStart(2, "0")}</span>
                      {word ? (
                        <DragWord
                          word={word}
                          variant="placed"
                          disabled={offering || solved}
                          onTap={returnWord}
                          onDragMove={handleDragMove}
                          onDrop={handleDrop}
                        />
                      ) : (
                        <span className="ag-slot-empty">PLACE WORD</span>
                      )}
                      {solved && <Check size={14} className="ag-slot-check" />}
                    </motion.div>
                  ))}
                </div>

                {!solved && (
                  <div className="ag-card-instruction">
                    <Move size={13} />
                    Drag a word into a space, or tap a word to place it. Tap a placed word to take it back.
                  </div>
                )}

                <div className="ag-word-tray">
                  <AnimatePresence>
                    {pool.map((word, index) => (
                      <DragWord
                        key={`${round.id}-${word}`}
                        word={word}
                        index={index}
                        variant="tray"
                        disabled={offering || solved}
                        onTap={tapTrayWord}
                        onDragMove={handleDragMove}
                        onDrop={handleDrop}
                      />
                    ))}
                  </AnimatePresence>
                  {pool.length === 0 && !solved && (
                    <span className="ag-tray-empty">All words have been placed</span>
                  )}
                  {solved && (
                    <motion.div
                      className="ag-glossary"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {round.words.map((w, i) => (
                        <span key={w}>
                          <b>{w}</b>
                          <small>{round.glossary[i]}</small>
                        </span>
                      ))}
                    </motion.div>
                  )}
                </div>

                <div className="ag-ritual-footer">
                  <div className={`ag-feedback is-${feedback.tone}`} role="status" aria-live="polite">
                    {feedback.text || "Arrange the words to complete the invocation."}
                  </div>

                  <div className="ag-footer-actions">
                    {!solved && roundMistakes >= 1 && (
                      <button type="button" className="ag-ghost-button" onClick={giveHint} disabled={offering}>
                        <Lightbulb size={13} /> HINT
                      </button>
                    )}
                    {!solved ? (
                      <button
                        type="button"
                        className="ag-primary-button ag-check-button"
                        onClick={checkMantra}
                        disabled={offering}
                      >
                        <span>CHECK INVOCATION</span>
                        <Check size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ag-primary-button ag-check-button is-glowing"
                        onClick={makeOffering}
                        disabled={offering}
                      >
                        <span>{offering ? "OFFERING..." : "MAKE THE OFFERING"}</span>
                        <Flame size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {solved && (
                  <motion.div
                    className="ag-meaning"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Info size={14} />
                    {round.meaning}
                  </motion.div>
                )}
              </div>

              <div className="ag-ritual-progress">
                {ROUNDS.map((item, index) => (
                  <div
                    key={item.id}
                    className={`ag-round-step ${index < roundIndex ? "is-done" : ""} ${
                      index === roundIndex ? "is-active" : ""
                    }`}
                  >
                    <span>{index < roundIndex ? <Check size={11} /> : `0${index + 1}`}</span>
                    <small>{item.deity}</small>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {stage === "reveal" && (
            <GiftReveal
              key={`reveal-${giftIndex}`}
              giftIndex={giftIndex}
              onNext={continueGift}
              px={spx}
              py={spy}
              play={play}
            />
          )}

          {stage === "finale" && <FlashFinale key="finale" onDone={onClose} play={play} />}
        </AnimatePresence>
      </main>

      <footer className="ag-footer">
        <span>THE PAST CANNOT BE CHANGED.</span>
        <span>THE WAY WE UNDERSTAND IT CAN.</span>
      </footer>
    </div>
  );
}