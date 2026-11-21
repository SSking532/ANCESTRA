/* eslint-disable react/no-unknown-property */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Crown,
  Footprints,
  Hand,
  RotateCcw,
  ShieldAlert,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import "./AngadaChallengeGame.css";

/* =========================================================
   ANGADA'S CHALLENGE — THE UNMOVABLE FOOT
   Ancestra · Yuddha Kanda
   Flow: title → 3 cinematic stills → 3D court gameplay → ending still
========================================================= */

const ASSET = "/images/ramayana/interactions/";
const GAME_IMAGES = {
  foot: `${ASSET}ch14g21.jpg`, // close-up of Angada's foot, cracks
  challenge: `${ASSET}ch14g22.jpg`, // low angle, fists on waist
  ravana: `${ASSET}ch14g23.jpg`, // Ravana's rage
  warning: `${ASSET}ch14g24.jpg`, // Angada's warning pose
};

/* Gameplay timeline (seconds) */
const GAME_DURATION = 24;
const T_RISE = 1.8; // you stand up from your chair
const T_WALK = 3.0; // you walk towards Angada
const T_LIFT = 6.6; // you can now try to lift his foot (≈17s of play)

const INTRO = [
  {
    image: GAME_IMAGES.foot,
    eyebrow: "THE CHALLENGE BEGINS",
    title: "A Foot Planted in Lanka",
    dialogue:
      "Angada set his foot upon the floor of Ravana's golden court. The stone split beneath him, and his stance did not shift.",
    speaker: "THE ROYAL COURT",
    button: "LOOK UP",
  },
  {
    image: GAME_IMAGES.challenge,
    eyebrow: "THE VANARA PRINCE",
    title: "The Dare",
    dialogue:
      "“I dare you all! Whoever believes himself strong enough, come forward and lift my foot!”",
    speaker: "ANGADA",
    button: "RAVANA'S REACTION",
  },
  {
    image: GAME_IMAGES.ravana,
    eyebrow: "THE KING OF LANKA",
    title: "How Dare You?",
    dialogue:
      "Ravana's face darkened. A young envoy had challenged the might of his entire court, in his own hall.",
    speaker: "THE ROYAL COURT",
    button: "STEP FORWARD",
  },
];

/* ---------------------------------------------------------
   Small helpers
--------------------------------------------------------- */
const { clamp, lerp } = THREE.MathUtils;
const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function phaseOf(e) {
  if (e < T_RISE) return "seated";
  if (e < T_WALK) return "rise";
  if (e < T_LIFT) return "walk";
  return "lift";
}

function subtitleFor(phase, attempts, seconds) {
  if (phase === "seated") return "The court falls silent. No one dares to move.";
  if (phase === "rise") return "You rise from your seat.";
  if (phase === "walk") return "Every eye in the hall follows you.";
  if (attempts === 0) return "Take hold of his foot. Tap, click or press space.";
  if (seconds <= 6) return "Ravana's knuckles whiten on the arm of his throne.";
  if (attempts < 5) return "His foot has not moved.";
  if (attempts < 12) return "The court watches your effort fail.";
  if (attempts < 20) return "It is as if the stone itself holds him down.";
  return "You cannot move him. Try once more.";
}

const makeSim = () => ({
  startedAt: 0,
  elapsed: 0,
  strain: 0,
  pulse: 0,
  shake: 0,
  ringT: 5,
  taps: 0,
  burst: 0,
  crack: 0.2,
  courtier: new THREE.Vector3(),
});

/* Key positions in the hall (metres). Angada stands at the origin. */
const SEAT = new THREE.Vector3(-5.6, 0, 2.4);
const STAND = new THREE.Vector3(-0.9, 0, 0.29);
const FOOT = new THREE.Vector3(-0.36, 0, 0.29);

/* ---------------------------------------------------------
   Sound — tiny WebAudio synth, no files needed
--------------------------------------------------------- */
function useSound() {
  const ctxRef = useRef(null);
  const mutedRef = useRef(false);
  const [muted, setMuted] = useState(false);

  const play = useCallback((kind) => {
    if (mutedRef.current) return;
    try {
      if (!ctxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctxRef.current = new AC();
      }
      const ac = ctxRef.current;
      if (ac.state === "suspended") ac.resume();
      const t = ac.currentTime;

      const noise = (dur, type, f0, f1, vol) => {
        const len = Math.floor(ac.sampleRate * dur);
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        src.buffer = buf;
        const filt = ac.createBiquadFilter();
        filt.type = type;
        filt.frequency.setValueAtTime(f0, t);
        filt.frequency.exponentialRampToValueAtTime(f1, t + dur);
        const g = ac.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(filt).connect(g).connect(ac.destination);
        src.start(t);
      };
      const tone = (type, f0, f1, dur, vol) => {
        const o = ac.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f1, t + dur);
        const g = ac.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(ac.destination);
        o.start(t);
        o.stop(t + dur + 0.05);
      };

      if (kind === "thud") {
        tone("sine", 130, 32, 0.9, 0.9);
        noise(1.1, "lowpass", 260, 60, 0.9);
      } else if (kind === "rumble") {
        noise(2.2, "lowpass", 140, 50, 0.45);
      } else if (kind === "whoosh") {
        noise(0.7, "bandpass", 300, 2600, 0.35);
      } else if (kind === "tap") {
        tone("sine", 95, 45, 0.18, 0.55);
        noise(0.12, "lowpass", 400, 120, 0.35);
      } else if (kind === "gong") {
        tone("sine", 110, 104, 3.2, 0.5);
        tone("sine", 221, 215, 2.6, 0.28);
        tone("sine", 333, 320, 2.0, 0.16);
        noise(0.5, "lowpass", 900, 150, 0.2);
      }
    } catch (err) {
      /* audio is optional */
    }
  }, []);

  const toggle = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  }, []);

  useEffect(
    () => () => {
      if (ctxRef.current) ctxRef.current.close().catch(() => {});
    },
    []
  );

  return { play, muted, toggle };
}

/* ---------------------------------------------------------
   Procedural textures
--------------------------------------------------------- */
function makeFloorTexture() {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d");
  const r = seeded(7);
  const n = 8;
  const s = S / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const px = x * s;
      const py = y * s;
      const alt = (x + y) % 2 === 0;
      const grad = g.createLinearGradient(px, py, px + s, py + s);
      grad.addColorStop(0, alt ? "#bd8e41" : "#9a6c2b");
      grad.addColorStop(1, alt ? "#8c6124" : "#b78536");
      g.fillStyle = grad;
      g.fillRect(px, py, s, s);

      g.strokeStyle = "rgba(255,228,165,0.13)";
      g.lineWidth = 1.2;
      for (let k = 0; k < 5; k++) {
        g.beginPath();
        let vx = px + r() * s;
        let vy = py + r() * s;
        g.moveTo(vx, vy);
        for (let j = 0; j < 4; j++) {
          vx += (r() - 0.5) * 60;
          vy += (r() - 0.5) * 60;
          g.lineTo(vx, vy);
        }
        g.stroke();
      }

      const cx = px + s / 2;
      const cy = py + s / 2;
      const d = s * 0.32;
      g.strokeStyle = "rgba(255,238,195,0.55)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx, cy - d);
      g.lineTo(cx + d, cy);
      g.lineTo(cx, cy + d);
      g.lineTo(cx - d, cy);
      g.closePath();
      g.stroke();
      g.fillStyle = "rgba(255,228,165,0.5)";
      g.beginPath();
      g.arc(cx, cy, s * 0.07, 0, Math.PI * 2);
      g.fill();

      g.strokeStyle = "rgba(38,20,7,0.8)";
      g.lineWidth = 3;
      g.strokeRect(px, py, s, s);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(7.5, 7.5);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeCarpetTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#7a1519";
  g.fillRect(0, 0, 256, 256);
  const grad = g.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, "rgba(0,0,0,0.25)");
  grad.addColorStop(0.5, "rgba(255,80,60,0.08)");
  grad.addColorStop(1, "rgba(0,0,0,0.25)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#d7a95a";
  g.fillRect(8, 0, 9, 256);
  g.fillRect(239, 0, 9, 256);
  g.fillStyle = "#b98a3e";
  g.fillRect(24, 0, 3, 256);
  g.fillRect(229, 0, 3, 256);
  g.strokeStyle = "#e6c07a";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(128, 40);
  g.lineTo(196, 128);
  g.lineTo(128, 216);
  g.lineTo(60, 128);
  g.closePath();
  g.stroke();
  g.beginPath();
  g.arc(128, 128, 22, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#e6c07a";
  g.beginPath();
  g.arc(128, 128, 7, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 10.5);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeCrackTexture() {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d");
  const r = seeded(11);
  g.lineCap = "round";
  g.lineJoin = "round";

  const stroke = (pts, color, w) => {
    g.strokeStyle = color;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  };
  const draw = (x, y, a, len, w, depth) => {
    let px = x;
    let py = y;
    const pts = [[px, py]];
    const steps = Math.max(3, Math.floor(len / 26));
    for (let i = 0; i < steps; i++) {
      a += (r() - 0.5) * 0.7;
      px += Math.cos(a) * 26;
      py += Math.sin(a) * 26;
      pts.push([px, py]);
      if (depth < 2 && r() < 0.28) {
        draw(px, py, a + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.5), len * 0.45, w * 0.6, depth + 1);
      }
    }
    stroke(pts, "rgba(255,165,60,0.45)", w * 3.4);
    stroke(pts, "#0a0502", w);
  };

  const crater = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, 90);
  crater.addColorStop(0, "rgba(10,5,2,0.85)");
  crater.addColorStop(1, "rgba(10,5,2,0)");
  g.fillStyle = crater;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 13; i++) {
    draw(S / 2, S / 2, (i / 13) * Math.PI * 2 + r() * 0.4, 200 + r() * 270, 5 + r() * 3, 0);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------------------------------------------------
   Shared materials
--------------------------------------------------------- */
const std = (color, o = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.1, ...o });

const M = {
  gold: std("#d4a24c", { roughness: 0.32, metalness: 0.5, emissive: "#5a3a10", emissiveIntensity: 0.55 }),
  stone: std("#8d6b42", { roughness: 0.7, emissive: "#2c1b0b", emissiveIntensity: 0.45 }),
  wall: std("#3a1410", { roughness: 0.9, emissive: "#1e0906", emissiveIntensity: 0.6 }),
  crimson: std("#8c1c1c", { roughness: 0.8, emissive: "#2a0606", emissiveIntensity: 0.5 }),
  skin: std("#9b6a45", { roughness: 0.7, emissive: "#2a1608", emissiveIntensity: 0.25 }),
  fur: std("#a8743f", { roughness: 0.85, emissive: "#2a1608", emissiveIntensity: 0.3 }),
  furLight: std("#cfa273", { roughness: 0.85, emissive: "#2a1608", emissiveIntensity: 0.25 }),
  dhoti: std("#c4571a", { roughness: 0.8, emissive: "#3a1405", emissiveIntensity: 0.4, side: THREE.DoubleSide }),
  cloth: std("#e8dcc0", { roughness: 0.85, emissive: "#2a2418", emissiveIntensity: 0.25 }),
  maroon: std("#7c1d22", { roughness: 0.8, emissive: "#2a0808", emissiveIntensity: 0.4 }),
  dark: std("#1b1210", { roughness: 0.8 }),
  ravSkin: std("#3c3248", { roughness: 0.6, emissive: "#140c1c", emissiveIntensity: 0.5 }),
  ravRobe: std("#5a1218", { roughness: 0.75, emissive: "#240508", emissiveIntensity: 0.5 }),
  white: new THREE.MeshBasicMaterial({ color: "#fff3dd" }),
  flame: new THREE.MeshBasicMaterial({ color: "#ffa640", toneMapped: false }),
  gem: new THREE.MeshBasicMaterial({ color: "#ff3a2a", toneMapped: false }),
  eye: new THREE.MeshBasicMaterial({ color: "#ff5a1f", toneMapped: false }),
};
const ROBES = [
  std("#7a1f2b", { emissive: "#240808", emissiveIntensity: 0.4 }),
  std("#1f4a5a", { emissive: "#06161c", emissiveIntensity: 0.4 }),
  std("#c28a2d", { emissive: "#3a2506", emissiveIntensity: 0.4 }),
  std("#4a2a5e", { emissive: "#140a1c", emissiveIntensity: 0.4 }),
  std("#2f5a3a", { emissive: "#08180e", emissiveIntensity: 0.4 }),
];

function Seg({ len, r0, r1, m }) {
  return (
    <mesh position={[0, -len / 2, 0]} material={m}>
      <cylinderGeometry args={[r0, r1, len, 14]} />
    </mesh>
  );
}

function useShadowFlags(ref) {
  useEffect(() => {
    if (!ref.current) return;
    ref.current.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [ref]);
}

/* ---------------------------------------------------------
   The golden hall
--------------------------------------------------------- */
function Chair({ position, rotY }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.42, 0.1]} material={M.crimson}>
        <boxGeometry args={[0.85, 0.12, 0.85]} />
      </mesh>
      <mesh position={[0, 1.05, -0.3]} material={M.gold}>
        <boxGeometry args={[0.85, 1.2, 0.1]} />
      </mesh>
      {[
        [-0.38, -0.3],
        [0.38, -0.3],
        [-0.38, 0.5],
        [0.38, 0.5],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} material={M.gold}>
          <cylinderGeometry args={[0.045, 0.05, 0.4, 8]} />
        </mesh>
      ))}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 1.7, -0.3]} material={M.gold}>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
      ))}
    </group>
  );
}

function SeatedNPC({ position, rotY, seed }) {
  const head = useRef();
  const body = useRef();
  useShadowFlags(body);
  useFrame((st) => {
    if (head.current) head.current.rotation.y = Math.sin(st.clock.elapsedTime * 0.5 + seed * 1.7) * 0.35;
  });
  const robe = ROBES[seed % ROBES.length];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Chair position={[0, 0, 0]} rotY={0} />
      <group ref={body} position={[0, 0.5, 0]}>
        {[-0.12, 0.12].map((x) => (
          <group key={x}>
            <mesh position={[x, 0, 0.25]} material={M.cloth}>
              <boxGeometry args={[0.2, 0.16, 0.5]} />
            </mesh>
            <mesh position={[x, -0.22, 0.5]} material={M.skin}>
              <cylinderGeometry args={[0.06, 0.05, 0.46, 8]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.3, 0]} material={robe}>
          <cylinderGeometry args={[0.2, 0.16, 0.56, 14]} />
        </mesh>
        <group ref={head} position={[0, 0.7, 0]}>
          <mesh material={M.skin}>
            <sphereGeometry args={[0.12, 14, 12]} />
          </mesh>
          <mesh position={[0, 0.08, 0]} scale={[1.1, 0.8, 1.1]} material={seed % 2 ? M.cloth : M.gold}>
            <sphereGeometry args={[0.13, 14, 10]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Pillar({ position }) {
  const ref = useRef();
  useShadowFlags(ref);
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.35, 0]} material={M.gold}>
        <boxGeometry args={[1.6, 0.7, 1.6]} />
      </mesh>
      <mesh position={[0, 4.7, 0]} material={M.stone}>
        <cylinderGeometry args={[0.52, 0.62, 8.2, 24]} />
      </mesh>
      {[1.3, 7.6].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
          <torusGeometry args={[0.6, 0.07, 10, 28]} />
        </mesh>
      ))}
      <mesh position={[0, 9.1, 0]} material={M.gold}>
        <cylinderGeometry args={[1.0, 0.55, 0.9, 20]} />
      </mesh>
    </group>
  );
}

function Brazier({ position, seed, color = "#ff9a3c", base = 12 }) {
  const flame = useRef();
  const light = useRef();
  useFrame((st) => {
    const t = st.clock.elapsedTime * 7 + seed * 3.1;
    const f = 0.85 + Math.sin(t) * 0.1 + Math.sin(t * 2.3) * 0.07;
    if (flame.current) flame.current.scale.set(1, 0.9 + f * 0.35, 1);
    if (light.current) light.current.intensity = base * f;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} material={M.gold}>
        <cylinderGeometry args={[0.07, 0.14, 1.4, 10]} />
      </mesh>
      <mesh position={[0, 1.5, 0]} material={M.gold}>
        <cylinderGeometry args={[0.42, 0.18, 0.34, 18]} />
      </mesh>
      <mesh ref={flame} position={[0, 1.95, 0]} material={M.flame}>
        <coneGeometry args={[0.26, 0.8, 12]} />
      </mesh>
      <pointLight ref={light} position={[0, 2.3, 0]} color={color} intensity={base} distance={15} decay={2} />
    </group>
  );
}

function Throne() {
  const ref = useRef();
  useShadowFlags(ref);
  return (
    <group ref={ref}>
      <mesh position={[0, 0.2, -7.4]} material={M.gold}>
        <boxGeometry args={[10, 0.4, 7]} />
      </mesh>
      <mesh position={[0, 0.6, -8.0]} material={M.crimson}>
        <boxGeometry args={[8, 0.4, 5.6]} />
      </mesh>
      <mesh position={[0, 1.0, -8.7]} material={M.gold}>
        <boxGeometry args={[6, 0.4, 4.2]} />
      </mesh>
      <mesh position={[0, 1.45, -9.2]} material={M.maroon}>
        <boxGeometry args={[2.6, 0.5, 1.9]} />
      </mesh>
      <mesh position={[0, 4.0, -10.5]} material={M.gold}>
        <boxGeometry args={[3.2, 5.6, 0.4]} />
      </mesh>
      <mesh position={[0, 4.0, -10.28]} material={M.maroon}>
        <boxGeometry args={[2.6, 4.9, 0.1]} />
      </mesh>
      {/* halo */}
      <group position={[0, 4.4, -10.8]}>
        <mesh material={M.flame}>
          <torusGeometry args={[3.0, 0.1, 10, 64]} />
        </mesh>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 3.35, Math.sin(a) * 3.35, 0]}
              rotation={[0, 0, a - Math.PI / 2]}
              material={M.gold}
            >
              <coneGeometry args={[0.1, 0.55, 6]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Ravana({ sim }) {
  const root = useRef();
  const torso = useRef();
  useShadowFlags(root);

  const heads = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 10; i++) {
      const row = i < 5 ? 0 : 1;
      const k = (i % 5) - 2;
      arr.push({
        x: k * (row ? 0.4 : 0.47),
        y: (row ? 3.05 : 2.5) - Math.abs(k) * 0.08,
        z: (row ? -0.2 : 0) - Math.abs(k) * 0.13,
        ry: -k * 0.28,
        s: row ? 0.88 : 1,
      });
    }
    return arr;
  }, []);

  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const s = sim.current;
    const rage = clamp(0.35 + s.elapsed / GAME_DURATION * 0.4 + s.strain * 0.5, 0, 1);
    M.eye.color.setRGB(1, lerp(0.42, 0.06, rage) + Math.sin(t * 6) * 0.04, 0.08);
    if (torso.current) torso.current.scale.y = 1 + Math.sin(t * 1.4) * 0.012;
  });

  return (
    <group ref={root} position={[0, 1.7, -9.7]} scale={1.25}>
      <mesh position={[0, 0.38, 0.15]} material={M.ravRobe}>
        <boxGeometry args={[1.7, 0.75, 1.5]} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, -0.1, 0.85]} material={M.ravSkin}>
          <cylinderGeometry args={[0.16, 0.13, 0.8, 10]} />
        </mesh>
      ))}
      <group ref={torso}>
        <mesh position={[0, 1.38, 0]} material={M.ravSkin}>
          <cylinderGeometry args={[0.78, 0.62, 1.3, 18]} />
        </mesh>
        <mesh position={[0, 1.65, 0.45]} rotation={[0.2, 0, 0]} material={M.gold}>
          <torusGeometry args={[0.45, 0.07, 8, 24]} />
        </mesh>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 1.95, 0]} material={M.gold}>
            <sphereGeometry args={[0.3, 16, 12]} />
          </mesh>
        ))}
        {/* many arms */}
        {[-1, 1].flatMap((side) =>
          [0.35, 0.9, 1.5, 2.1].map((phi, k) => (
            <group
              key={`${side}-${k}`}
              position={[side * 0.78, 1.9, 0.05 + k * 0.03]}
              rotation={[0, 0, side * phi]}
            >
              <Seg len={1.05} r0={0.11} r1={0.08} m={M.ravSkin} />
              <mesh position={[0, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
                <torusGeometry args={[0.11, 0.025, 8, 16]} />
              </mesh>
              <mesh position={[0, -1.08, 0]} material={M.ravSkin}>
                <sphereGeometry args={[0.1, 10, 8]} />
              </mesh>
            </group>
          ))
        )}
      </group>
      {/* ten heads */}
      {heads.map((h, i) => (
        <group key={i} position={[h.x, h.y, h.z]} rotation={[0, h.ry, 0]} scale={h.s}>
          <mesh material={M.ravSkin}>
            <sphereGeometry args={[0.19, 14, 12]} />
          </mesh>
          <mesh position={[0, -0.12, 0.05]} scale={[0.9, 0.7, 0.85]} material={M.ravSkin}>
            <sphereGeometry args={[0.15, 12, 10]} />
          </mesh>
          <mesh position={[0, 0.3, 0]} material={M.gold}>
            <cylinderGeometry args={[0.1, 0.2, 0.3, 12]} />
          </mesh>
          <mesh position={[0, 0.52, 0]} material={M.gold}>
            <coneGeometry args={[0.08, 0.22, 8]} />
          </mesh>
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <mesh position={[sx * 0.075, 0.02, 0.165]} material={M.eye}>
                <sphereGeometry args={[0.032, 8, 8]} />
              </mesh>
              <mesh
                position={[sx * 0.08, 0.075, 0.175]}
                rotation={[0, 0, -sx * 0.45]}
                material={M.dark}
              >
                <boxGeometry args={[0.1, 0.022, 0.03]} />
              </mesh>
              <mesh position={[sx * 0.05, -0.15, 0.17]} rotation={[Math.PI, 0, 0]} material={M.white}>
                <coneGeometry args={[0.018, 0.07, 6]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.075, 0.18]} material={M.dark}>
            <boxGeometry args={[0.2, 0.022, 0.03]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Hall({ sim }) {
  const floor = useMemo(makeFloorTexture, []);
  const carpet = useMemo(makeCarpetTexture, []);
  const rays = useMemo(() => Array.from({ length: 20 }, (_, i) => (i / 20) * Math.PI), []);
  const pillarZ = [6, 2, -2, -6, -10];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          map={floor}
          emissiveMap={floor}
          emissive="#ffffff"
          emissiveIntensity={0.2}
          roughness={0.38}
          metalness={0.25}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -6]} receiveShadow>
        <planeGeometry args={[3.4, 34]} />
        <meshStandardMaterial map={carpet} emissiveMap={carpet} emissive="#ffffff" emissiveIntensity={0.15} roughness={0.9} />
      </mesh>

      {pillarZ.flatMap((z) => [-7.4, 7.4].map((x) => <Pillar key={`${x}-${z}`} position={[x, 0, z]} />))}

      {/* walls + ceiling */}
      <mesh position={[0, 7, -14.4]} material={M.wall}>
        <boxGeometry args={[40, 14, 0.6]} />
      </mesh>
      {[-13, 13].map((x) => (
        <mesh key={x} position={[x, 7, -2]} material={M.wall}>
          <boxGeometry args={[0.6, 14, 40]} />
        </mesh>
      ))}
      <mesh position={[0, 10.5, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color="#100804" />
      </mesh>
      <group position={[0, 5.4, -14.0]}>
        {rays.map((a, i) => (
          <mesh key={i} rotation={[0, 0, a]} material={M.gold}>
            <boxGeometry args={[0.1, 8, 0.05]} />
          </mesh>
        ))}
      </group>

      <Throne />
      <Ravana sim={sim} />

      {/* braziers & light */}
      <Brazier position={[-3.7, 0, -2.5]} seed={1} />
      <Brazier position={[3.7, 0, -2.5]} seed={2} />
      <Brazier position={[-3.7, 0, 5]} seed={3} base={9} />
      <Brazier position={[3.7, 0, 5]} seed={4} base={9} />
      <pointLight position={[-3.4, 3.4, -7]} color="#ff4a1f" intensity={14} distance={14} decay={2} />
      <pointLight position={[3.4, 3.4, -7]} color="#ff4a1f" intensity={14} distance={14} decay={2} />

      {/* the court */}
      {[2.4, -0.8, -4.0].map((z, i) => (
        <React.Fragment key={z}>
          {i === 0 ? (
            <Chair position={[SEAT.x, 0, SEAT.z]} rotY={Math.PI / 2} />
          ) : (
            <SeatedNPC position={[-5.6, 0, z]} rotY={Math.PI / 2} seed={i + 1} />
          )}
          <SeatedNPC position={[5.6, 0, z]} rotY={-Math.PI / 2} seed={i + 4} />
        </React.Fragment>
      ))}

      <Sparkles count={150} scale={[16, 8, 22]} position={[0, 4, -3]} size={3} speed={0.25} color="#ffd9a0" opacity={0.6} />
    </group>
  );
}

/* ---------------------------------------------------------
   Angada — towering, fists on his waist, foot planted
--------------------------------------------------------- */
function Angada({ sim }) {
  const root = useRef();
  const chest = useRef();
  const glow = useRef();
  const ring = useRef();
  const light = useRef();
  useShadowFlags(root);

  const tail = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.15, -0.3),
      new THREE.Vector3(0, 0.85, -0.75),
      new THREE.Vector3(0.25, 0.9, -1.25),
      new THREE.Vector3(0.55, 1.35, -1.35),
      new THREE.Vector3(0.55, 1.9, -1.05),
      new THREE.Vector3(0.3, 2.1, -0.8),
    ]);
    return new THREE.TubeGeometry(curve, 40, 0.075, 10, false);
  }, []);

  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const s = sim.current;
    if (chest.current) {
      chest.current.position.y = Math.sin(t * 1.7) * 0.008;
      chest.current.rotation.z = Math.sin(t * 0.6) * 0.008;
    }
    if (glow.current) glow.current.material.opacity = 0.1 + s.strain * 0.28 + Math.sin(t * 2) * 0.02;
    if (ring.current) {
      const k = s.ringT / 0.9;
      ring.current.visible = k < 1;
      ring.current.scale.setScalar(0.5 + s.ringT * 2.8);
      ring.current.material.opacity = Math.max(0, 1 - k) * 0.6;
    }
    if (light.current) light.current.intensity = 8 + s.strain * 16;
  });

  const arm = (side) => (
    <group position={[side * 0.52, 2.02, 0]} rotation={[0, 0, side * 0.85]}>
      <Seg len={0.4} r0={0.11} r1={0.09} m={M.fur} />
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
        <torusGeometry args={[0.11, 0.03, 8, 18]} />
      </mesh>
      <group position={[0, -0.4, 0]} rotation={[0, 0, -side * 1.95]}>
        <Seg len={0.38} r0={0.09} r1={0.07} m={M.fur} />
        <mesh position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
          <torusGeometry args={[0.075, 0.02, 8, 16]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={M.fur}>
          <sphereGeometry args={[0.1, 12, 10]} />
        </mesh>
      </group>
    </group>
  );

  const leg = (x, thighRot, shinRot) => (
    <group position={[x, 1.22, 0]} rotation={[thighRot, 0, 0]}>
      <Seg len={0.6} r0={0.17} r1={0.12} m={M.fur} />
      <group position={[0, -0.6, 0]} rotation={[shinRot, 0, 0]}>
        <Seg len={0.58} r0={0.12} r1={0.085} m={M.fur} />
        <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
          <torusGeometry args={[0.1, 0.028, 8, 20]} />
        </mesh>
        <group position={[0, -0.58, 0]}>
          <mesh position={[0, 0.02, 0.1]} scale={[1, 0.55, 1.7]} material={M.fur}>
            <sphereGeometry args={[0.13, 16, 12]} />
          </mesh>
          {[-0.07, 0, 0.07].map((tx) => (
            <mesh key={tx} position={[tx, 0.0, 0.3]} scale={[1, 0.7, 1]} material={M.furLight}>
              <sphereGeometry args={[0.035, 8, 8]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );

  return (
    <group ref={root}>
      <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0.1]}>
        <circleGeometry args={[1.7, 48]} />
        <meshBasicMaterial color="#ffb54d" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[FOOT.x, 0.03, FOOT.z]}>
        <ringGeometry args={[0.85, 1.0, 64]} />
        <meshBasicMaterial color="#ffc766" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 3.2, 2]} color="#ffcf8a" intensity={8} distance={9} decay={2} />

      {leg(-0.36, -0.32, 0.32)}
      {leg(0.36, 0.26, -0.26)}

      <group ref={chest}>
        <mesh position={[0, 0.95, 0]} material={M.dhoti}>
          <cylinderGeometry args={[0.4, 0.5, 0.8, 28]} />
        </mesh>
        <mesh position={[0, 1.34, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
          <torusGeometry args={[0.41, 0.05, 10, 32]} />
        </mesh>
        <mesh position={[0, 1.74, 0]} material={M.fur}>
          <cylinderGeometry args={[0.46, 0.34, 0.8, 24]} />
        </mesh>
        <mesh position={[0, 1.8, 0.2]} scale={[1, 1.1, 0.5]} material={M.furLight}>
          <sphereGeometry args={[0.3, 16, 12]} />
        </mesh>
        <mesh position={[0, 2.03, 0.02]} rotation={[Math.PI / 2.3, 0, 0]} material={M.gold}>
          <torusGeometry args={[0.31, 0.035, 8, 28]} />
        </mesh>
        <mesh position={[0, 1.78, 0.3]} material={M.gem}>
          <sphereGeometry args={[0.05, 10, 8]} />
        </mesh>
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <mesh position={[sx * 0.5, 2.02, 0]} material={M.fur}>
              <sphereGeometry args={[0.17, 14, 12]} />
            </mesh>
            <mesh position={[sx * 0.5, 2.06, 0]} material={M.gold}>
              <sphereGeometry args={[0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>
        ))}
        {arm(1)}
        {arm(-1)}

        {/* head, chin raised in pride */}
        <group position={[0, 2.38, 0.02]} rotation={[-0.18, 0, 0]}>
          <mesh material={M.fur}>
            <sphereGeometry args={[0.21, 18, 14]} />
          </mesh>
          <mesh position={[0, -0.06, 0.15]} scale={[0.85, 0.72, 0.85]} material={M.furLight}>
            <sphereGeometry args={[0.15, 16, 12]} />
          </mesh>
          <mesh position={[0, -0.02, 0.29]} material={M.dark}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
          <mesh position={[0, -0.13, 0.27]} material={M.dark}>
            <boxGeometry args={[0.1, 0.014, 0.02]} />
          </mesh>
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <mesh position={[sx * 0.085, 0.05, 0.17]} material={M.white}>
                <sphereGeometry args={[0.036, 10, 8]} />
              </mesh>
              <mesh position={[sx * 0.085, 0.05, 0.2]} material={M.dark}>
                <sphereGeometry args={[0.018, 8, 8]} />
              </mesh>
              <mesh position={[sx * 0.09, 0.11, 0.17]} rotation={[0, 0, sx * 0.3]} material={M.dark}>
                <boxGeometry args={[0.12, 0.028, 0.05]} />
              </mesh>
              <mesh position={[sx * 0.21, 0, -0.02]} scale={[0.5, 1, 0.8]} material={M.furLight}>
                <sphereGeometry args={[0.07, 10, 8]} />
              </mesh>
              <mesh position={[sx * 0.22, -0.1, 0]} material={M.gold}>
                <sphereGeometry args={[0.03, 8, 8]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.27, 0]} material={M.gold}>
            <cylinderGeometry args={[0.13, 0.21, 0.3, 18]} />
          </mesh>
          <mesh position={[0, 0.44, 0]} material={M.gold}>
            <coneGeometry args={[0.1, 0.2, 12]} />
          </mesh>
          <mesh position={[0, 0.2, 0.21]} material={M.gem}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        </group>
      </group>
      <mesh geometry={tail} material={M.fur} />
    </group>
  );
}

/* ---------------------------------------------------------
   The player — a member of Ravana's court
--------------------------------------------------------- */
function Courtier({ sim }) {
  const body = useRef();
  const root = useRef();
  const hips = useRef();
  const torso = useRef();
  const head = useRef();
  const hL = useRef();
  const hR = useRef();
  const kL = useRef();
  const kR = useRef();
  const sL = useRef();
  const sR = useRef();
  const eL = useRef();
  const eR = useRef();
  const mark = useRef();
  const P = useRef({
    tl: -Math.PI / 2,
    tr: -Math.PI / 2,
    sl: Math.PI / 2,
    sr: Math.PI / 2,
    lean: 0.05,
    al: -0.25,
    ar: -0.25,
    fl: -1.1,
    fr: -1.1,
    yaw: Math.PI / 2,
    ph: 0,
    px: SEAT.x,
    pz: SEAT.z,
  });
  useShadowFlags(body);

  useFrame((st, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05) || 0.016;
    const s = sim.current;
    const e = s.elapsed;
    const p = P.current;
    const t = st.clock.elapsedTime;
    const L = 0.46;

    /* position along the walk */
    let x = SEAT.x + 0.6 * easeIO(clamp((e - T_RISE) / 0.7, 0, 1));
    let z = SEAT.z;
    const w0 = T_RISE + 0.7;
    if (e >= w0) {
      const k = easeIO(clamp((e - w0) / (T_LIFT - w0), 0, 1));
      x = lerp(SEAT.x + 0.6, STAND.x, k);
      z = lerp(SEAT.z, STAND.z, k) + Math.sin(Math.PI * k) * 0.45;
    }
    const speed = Math.hypot(x - p.px, z - p.pz) / dt;
    let yawT = Math.PI / 2;
    if (e >= T_LIFT) yawT = Math.atan2(FOOT.x - x, FOOT.z - z);
    else if (e >= w0 && speed > 0.25) yawT = Math.atan2(x - p.px, z - p.pz);
    p.px = x;
    p.pz = z;
    p.yaw = damp(p.yaw, yawT, 6, dt);

    /* pose targets */
    let tl;
    let tr;
    let sl;
    let sr;
    let lean;
    let al;
    let ar;
    let fl;
    let fr;
    let rate = 7;
    const amp = clamp(speed / 1.3, 0, 1);
    if (e < T_RISE) {
      tl = tr = -Math.PI / 2;
      sl = sr = Math.PI / 2;
      lean = 0.05;
      al = ar = -0.25;
      fl = fr = -1.1;
    } else if (e < w0) {
      tl = tr = -1.0;
      sl = sr = 1.15;
      lean = 0.6;
      al = ar = -0.5;
      fl = fr = -0.4;
    } else if (e < T_LIFT) {
      p.ph += speed * dt * 3.4;
      const sw = Math.sin(p.ph);
      const cw = Math.cos(p.ph);
      tl = -sw * 0.62 * amp;
      tr = sw * 0.62 * amp;
      sl = Math.max(0, cw) * 0.8 * amp;
      sr = Math.max(0, -cw) * 0.8 * amp;
      lean = 0.1 + 0.08 * amp;
      al = sw * 0.5 * amp;
      ar = -sw * 0.5 * amp;
      fl = fr = -0.25;
    } else {
      const pl = s.pulse;
      const trem = Math.sin(t * 48) * 0.02 * s.strain;
      tl = tr = -1.35 + 0.55 * pl + trem;
      sl = sr = 1.5 - 0.6 * pl;
      lean = 1.22 - 0.28 * pl;
      al = ar = 0.02 + 0.4 * pl;
      fl = fr = -0.18;
      rate = 14;
    }
    p.tl = damp(p.tl, tl, rate, dt);
    p.tr = damp(p.tr, tr, rate, dt);
    p.sl = damp(p.sl, sl, rate, dt);
    p.sr = damp(p.sr, sr, rate, dt);
    p.lean = damp(p.lean, lean, rate, dt);
    p.al = damp(p.al, al, rate, dt);
    p.ar = damp(p.ar, ar, rate, dt);
    p.fl = damp(p.fl, fl, rate, dt);
    p.fr = damp(p.fr, fr, rate, dt);

    const hy =
      Math.max(
        L * (Math.cos(p.tl) + Math.cos(p.tl + p.sl)),
        L * (Math.cos(p.tr) + Math.cos(p.tr + p.sr))
      ) + 0.04;

    const shake = e >= T_LIFT ? Math.sin(t * 60) * 0.006 * s.strain : 0;
    root.current.position.set(x + shake, 0, z);
    root.current.rotation.y = p.yaw;
    hips.current.position.y = hy;
    torso.current.rotation.x = p.lean;
    hL.current.rotation.x = p.tl;
    hR.current.rotation.x = p.tr;
    kL.current.rotation.x = p.sl;
    kR.current.rotation.x = p.sr;
    sL.current.rotation.x = p.al - p.lean;
    sR.current.rotation.x = p.ar - p.lean;
    eL.current.rotation.x = p.fl;
    eR.current.rotation.x = p.fr;
    head.current.rotation.x = -p.lean * 0.75;
    head.current.rotation.y = e < w0 ? 0.4 : 0;
    mark.current.position.y = 2.35 + Math.sin(t * 3) * 0.06;
    mark.current.rotation.y = t * 1.6;
    mark.current.visible = e < T_LIFT + 2;
    s.courtier.set(x, 0, z);
  });

  const arm = (ref, elbow, side) => (
    <group ref={ref} position={[side * 0.22, 0.5, 0]}>
      <mesh material={M.maroon}>
        <sphereGeometry args={[0.07, 10, 8]} />
      </mesh>
      <Seg len={0.34} r0={0.06} r1={0.05} m={M.skin} />
      <group ref={elbow} position={[0, -0.34, 0]}>
        <Seg len={0.34} r0={0.05} r1={0.04} m={M.skin} />
        <mesh position={[0, -0.36, 0]} material={M.skin}>
          <sphereGeometry args={[0.055, 10, 8]} />
        </mesh>
      </group>
    </group>
  );

  const leg = (hip, knee, side) => (
    <group ref={hip} position={[side * 0.1, 0, 0]}>
      <Seg len={0.46} r0={0.085} r1={0.065} m={M.cloth} />
      <group ref={knee} position={[0, -0.46, 0]}>
        <Seg len={0.46} r0={0.065} r1={0.045} m={M.skin} />
        <mesh position={[0, -0.47, 0.06]} material={M.dark}>
          <boxGeometry args={[0.1, 0.06, 0.22]} />
        </mesh>
      </group>
    </group>
  );

  return (
    <group ref={root}>
      <group ref={body}>
        <group ref={hips}>
          <mesh scale={[1, 0.7, 0.85]} material={M.cloth}>
            <sphereGeometry args={[0.19, 14, 10]} />
          </mesh>
          <group ref={torso}>
            <mesh position={[0, 0.28, 0]} material={M.maroon}>
              <cylinderGeometry args={[0.21, 0.16, 0.56, 16]} />
            </mesh>
            <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2.2, 0, 0.45]} material={M.gold}>
              <torusGeometry args={[0.2, 0.028, 8, 24]} />
            </mesh>
            <group ref={head} position={[0, 0.64, 0]}>
              <mesh material={M.skin}>
                <sphereGeometry args={[0.12, 14, 12]} />
              </mesh>
              <mesh position={[0, 0.075, 0]} scale={[1.12, 0.82, 1.12]} material={M.cloth}>
                <sphereGeometry args={[0.13, 14, 10]} />
              </mesh>
              <mesh position={[0, 0.06, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
                <torusGeometry args={[0.13, 0.015, 6, 20]} />
              </mesh>
              <mesh position={[0, -0.01, 0.12]} material={M.skin}>
                <sphereGeometry args={[0.025, 8, 8]} />
              </mesh>
            </group>
            {arm(sL, eL, 1)}
            {arm(sR, eR, -1)}
          </group>
          {leg(hL, kL, 1)}
          {leg(hR, kR, -1)}
        </group>
      </group>
      <mesh ref={mark} position={[0, 2.35, 0]}>
        <octahedronGeometry args={[0.1]} />
        <meshBasicMaterial color="#ffd37a" toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------
   Effects: cracks spreading, dust bursts
--------------------------------------------------------- */
function CrackDecal({ sim }) {
  const tex = useMemo(makeCrackTexture, []);
  const mesh = useRef();
  useFrame(() => {
    const c = sim.current.crack;
    if (!mesh.current) return;
    mesh.current.scale.setScalar(0.6 + c * 0.55);
    mesh.current.material.opacity = 0.55 + c * 0.45;
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[FOOT.x, 0.012, FOOT.z]}>
      <planeGeometry args={[4.6, 4.6]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} toneMapped={false} />
    </mesh>
  );
}

function DustBurst({ sim }) {
  const N = 90;
  const last = useRef(0);
  const { geo, vel, life } = useMemo(() => {
    const pos = new Float32Array(N * 3).fill(-50);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g, vel: new Float32Array(N * 3), life: new Float32Array(N) };
  }, []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const pos = geo.attributes.position.array;
    if (sim.current.burst !== last.current) {
      last.current = sim.current.burst;
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.6 + Math.random() * 1.8;
        pos[i * 3] = FOOT.x + Math.cos(a) * 0.25;
        pos[i * 3 + 1] = 0.05;
        pos[i * 3 + 2] = FOOT.z + Math.sin(a) * 0.25;
        vel[i * 3] = Math.cos(a) * sp;
        vel[i * 3 + 1] = 0.8 + Math.random() * 1.6;
        vel[i * 3 + 2] = Math.sin(a) * sp;
        life[i] = 1;
      }
    }
    for (let i = 0; i < N; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt * 0.9;
      if (life[i] <= 0) {
        pos[i * 3 + 1] = -50;
        continue;
      }
      vel[i * 3 + 1] -= 2.6 * dt;
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (pos[i * 3 + 1] < 0.03) {
        pos[i * 3 + 1] = 0.03;
        vel[i * 3 + 1] *= -0.2;
        vel[i * 3] *= 0.7;
        vel[i * 3 + 2] *= 0.7;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.08} color="#e8c98b" transparent opacity={0.85} depthWrite={false} sizeAttenuation />
    </points>
  );
}

/* ---------------------------------------------------------
   Simulation clock + cinematic camera
--------------------------------------------------------- */
function SimDriver({ sim }) {
  useFrame((_, dtRaw) => {
    const s = sim.current;
    if (!s.startedAt) return;
    const d = Math.min(dtRaw, 0.05);
    s.elapsed = (performance.now() - s.startedAt) / 1000;
    s.pulse = Math.max(0, s.pulse - d * 3.2);
    s.shake = Math.max(0, s.shake - d * 3.5);
    s.strain = Math.max(0, s.strain - d * (s.elapsed >= T_LIFT ? 0.22 : 1));
    s.ringT += d;
    s.crack = damp(s.crack, clamp(0.22 + s.taps * 0.035, 0, 1), 3, d);
  });
  return null;
}

function CameraRig({ sim }) {
  const { camera } = useThree();
  const base = useRef(new THREE.Vector3(-10, 4.2, 8.5));
  const look = useRef(new THREE.Vector3(-1, 1.4, 0));
  const tp = useMemo(() => new THREE.Vector3(), []);
  const tl = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05) || 0.016;
    const s = sim.current;
    const e = s.elapsed;
    const c = s.courtier;
    let rate = 2.6;
    let fov = 44;

    if (e < T_RISE) {
      tp.set(-7.5, 1.5, 3.7);
      tl.set(-0.6, 1.25, 0.2);
      rate = 1.1;
      fov = 40;
    } else if (e < T_WALK) {
      tp.set(c.x - 2.4, 1.35, c.z + 3.1);
      tl.set(c.x + 1.4, 1.3, c.z - 0.4);
      rate = 2.2;
      fov = 42;
    } else if (e < T_LIFT) {
      tp.set(c.x + 0.4, 1.05, c.z + 3.0);
      tl.set(c.x + 1.6, 1.2, c.z - 0.6);
      rate = 3;
      fov = 42;
    } else if (e < GAME_DURATION - 1.5) {
      const k = e - T_LIFT;
      const ang = -0.3 + k * 0.07;
      const r = 3.5 - Math.min(1, k / 5) * 0.5 - s.strain * 0.2;
      tp.set(-0.45 + Math.sin(ang) * r, 1.05 + 0.25 * Math.sin(k * 0.4), 0.3 + Math.cos(ang) * r);
      tl.set(-0.3, 0.95, 0.2);
      rate = 2.4;
      fov = 46 - s.strain * 5;
    } else {
      tp.set(FOOT.x + 0.6, 0.32, FOOT.z + 1.5);
      tl.set(FOOT.x, 0.15, FOOT.z);
      rate = 2.2;
      fov = 36;
    }

    base.current.x = damp(base.current.x, tp.x, rate, dt);
    base.current.y = damp(base.current.y, tp.y, rate, dt);
    base.current.z = damp(base.current.z, tp.z, rate, dt);
    look.current.x = damp(look.current.x, tl.x, rate + 0.8, dt);
    look.current.y = damp(look.current.y, tl.y, rate + 0.8, dt);
    look.current.z = damp(look.current.z, tl.z, rate + 0.8, dt);

    const sh = s.shake * 0.05;
    camera.position.set(
      base.current.x + (Math.random() - 0.5) * sh,
      base.current.y + (Math.random() - 0.5) * sh,
      base.current.z + (Math.random() - 0.5) * sh
    );
    camera.lookAt(look.current);
    camera.rotation.z += (Math.random() - 0.5) * s.shake * 0.012;
    const nf = damp(camera.fov, fov, 2.2, dt);
    if (Math.abs(nf - camera.fov) > 0.001) {
      camera.fov = nf;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function GameScene({ sim }) {
  return (
    <Canvas
      className="angada-canvas"
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [-10, 4.2, 8.5], fov: 42, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#120a06"]} />
      <fog attach="fog" args={["#1d0e07", 14, 46]} />
      <SimDriver sim={sim} />
      <ambientLight intensity={0.9} color="#ffd9a8" />
      <hemisphereLight args={["#ffe2b0", "#3a1a0a", 0.55]} />
      <directionalLight
        position={[-4, 12, 8]}
        intensity={2.2}
        color="#ffe0b0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0005}
      />
      <Hall sim={sim} />
      <CrackDecal sim={sim} />
      <Angada sim={sim} />
      <Courtier sim={sim} />
      <DustBurst sim={sim} />
      <CameraRig sim={sim} />
    </Canvas>
  );
}

/* ---------------------------------------------------------
   Cinematic overlay pieces
--------------------------------------------------------- */
function Typewriter({ text, delay = 0, speed = 24 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let id;
    const to = setTimeout(() => {
      id = setInterval(() => {
        setN((v) => {
          if (v >= text.length) {
            clearInterval(id);
            return v;
          }
          return v + 1;
        });
      }, speed);
    }, delay);
    return () => {
      clearTimeout(to);
      clearInterval(id);
    };
  }, [text, delay, speed]);
  return <>{text.slice(0, n)}</>;
}

const slideVariants = {
  enter: (i) => (i === 2 ? { x: "100%", opacity: 1, filter: "blur(20px)" } : { opacity: 0, scale: 1.04 }),
  center: { x: "0%", opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: (i) => (i === 2 ? { x: "-100%", opacity: 1, filter: "blur(20px)" } : { opacity: 0 }),
};

function IntroSlide({ data, index, onNext }) {
  const imageMotion =
    index === 0
      ? { initial: { scale: 1.22, y: "3%" }, animate: { scale: 1.08, y: "0%" }, transition: { duration: 7, ease: "easeOut" } }
      : index === 1
      ? { initial: { scale: 1.2, y: "8%" }, animate: { scale: 1.06, y: "-4%" }, transition: { duration: 10, ease: "linear" } }
      : { initial: { scale: 1.0 }, animate: { scale: 1.2 }, transition: { duration: 9, ease: "linear" } };

  const shake =
    index === 0
      ? {
          animate: {
            x: [0, -16, 14, -10, 8, -5, 3, 0, -4, 3, 0],
            y: [0, 9, -12, 7, -5, 3, -2, 0, 2, -2, 0],
          },
          transition: { duration: 1.9, delay: 0.35, times: [0, 0.08, 0.17, 0.26, 0.35, 0.44, 0.52, 0.6, 0.75, 0.88, 1] },
        }
      : index === 2
      ? { animate: { x: [0, -2, 2, -1, 1, 0], y: [0, 1, -1, 1, 0, 0] }, transition: { duration: 0.6, repeat: Infinity } }
      : {};

  return (
    <motion.div
      className="angada-slide"
      custom={index}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div className="angada-shake" {...shake}>
        <motion.img className="angada-scene-image" src={data.image} alt={data.title} {...imageMotion} />
      </motion.div>

      <div className="angada-image-shade" />
      {index === 2 && <div className="angada-rage" />}
      {index === 0 && (
        <>
          <div className="angada-flash" />
          <div className="angada-dust">
            {Array.from({ length: 22 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${8 + ((i * 37) % 84)}%`,
                  animationDelay: `${0.45 + (i % 7) * 0.12}s`,
                  animationDuration: `${2.6 + (i % 5) * 0.5}s`,
                }}
              />
            ))}
          </div>
        </>
      )}

      <div className="angada-cinematic-top">
        <span>ANCESTRA</span>
        <span>{String(index + 1).padStart(2, "0")} / 03</span>
      </div>

      <div className="angada-dialogue-content">
        <motion.p className="angada-eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index === 0 ? 1.3 : 0.6 }}>
          {data.eyebrow}
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index === 0 ? 1.4 : 0.7, duration: 0.7 }}>
          {data.title}
        </motion.h2>
        <motion.div className="angada-dialogue-rule" initial={{ width: 0 }} animate={{ width: 65 }} transition={{ delay: index === 0 ? 1.6 : 0.9, duration: 0.8 }} />
        <p className="angada-dialogue-text">
          {index === 1 ? <Typewriter text={data.dialogue} delay={900} speed={26} /> : data.dialogue}
        </p>
        <motion.span className="angada-speaker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index === 0 ? 1.9 : 1.1 }}>
          {data.speaker}
        </motion.span>
        <motion.button
          className="angada-primary-button"
          onClick={onNext}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index === 0 ? 2.3 : index === 1 ? 3.2 : 1.6 }}
        >
          {data.button}
          <ArrowRight size={17} />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------
   Main component
--------------------------------------------------------- */
export default function AngadaChallengeGame({ onComplete, onExit }) {
  const [stage, setStage] = useState("title");
  const [introIndex, setIntroIndex] = useState(0);
  const [seconds, setSeconds] = useState(GAME_DURATION);
  const [phase, setPhase] = useState("seated");
  const [attempts, setAttempts] = useState(0);
  const [effort, setEffort] = useState(0);
  const sim = useRef(makeSim());
  const { play, muted, toggle } = useSound();

  /* warm the image cache so cuts are instant */
  useEffect(() => {
    Object.values(GAME_IMAGES).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  /* sounds for the cinematic stills */
  useEffect(() => {
    if (stage !== "intro") return undefined;
    if (introIndex === 0) {
      const a = setTimeout(() => play("thud"), 350);
      const b = setTimeout(() => play("rumble"), 400);
      return () => {
        clearTimeout(a);
        clearTimeout(b);
      };
    }
    play("whoosh");
    return undefined;
  }, [stage, introIndex, play]);

  /* gameplay clock → React HUD (the 3D side reads the same sim ref) */
  useEffect(() => {
    if (stage !== "gameplay") return undefined;
    const s = sim.current;
    s.startedAt = performance.now();
    const id = setInterval(() => {
      const e = (performance.now() - s.startedAt) / 1000;
      setSeconds(Math.max(0, Math.ceil(GAME_DURATION - e)));
      setPhase(phaseOf(e));
      setEffort(Math.round(s.strain * 100));
      if (e >= GAME_DURATION) {
        clearInterval(id);
        play("gong");
        setStage("ending");
      }
    }, 100);
    return () => clearInterval(id);
  }, [stage, play]);

  const beginGame = () => {
    setIntroIndex(0);
    setStage("intro");
  };

  const advanceIntro = () => {
    if (introIndex < INTRO.length - 1) {
      setIntroIndex((i) => i + 1);
    } else {
      sim.current = makeSim();
      setAttempts(0);
      setEffort(0);
      setSeconds(GAME_DURATION);
      setPhase("seated");
      play("whoosh");
      setStage("gameplay");
    }
  };

  const attemptToLift = useCallback(() => {
    const s = sim.current;
    if (!s.startedAt || s.elapsed < T_LIFT || s.elapsed >= GAME_DURATION) return;
    s.strain = Math.min(1, s.strain + 0.14);
    s.pulse = 1;
    s.shake = 1;
    s.ringT = 0;
    s.burst += 1;
    s.taps += 1;
    setAttempts((a) => a + 1);
    play("tap");
  }, [play]);

  /* space / enter also works */
  useEffect(() => {
    if (stage !== "gameplay") return undefined;
    const onKey = (ev) => {
      if ((ev.code === "Space" || ev.code === "Enter") && !ev.repeat) {
        ev.preventDefault();
        attemptToLift();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, attemptToLift]);

  const finishGame = () => {
    if (onComplete) onComplete();
    else if (onExit) onExit();
    else setStage("title");
  };

  const restartGame = () => {
    sim.current = makeSim();
    setStage("title");
    setIntroIndex(0);
    setAttempts(0);
    setEffort(0);
    setSeconds(GAME_DURATION);
    setPhase("seated");
  };

  const lifting = phase === "lift";

  return (
    <div className="angada-game">
      <button className="angada-sound" onClick={toggle} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
        {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>

      <AnimatePresence mode="wait">
        {stage === "title" && (
          <motion.section
            key="title"
            className="angada-title-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.025 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="angada-title-bg"
              style={{ backgroundImage: `url(${GAME_IMAGES.foot})` }}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1.05 }}
              transition={{ duration: 12, ease: "easeOut" }}
            />
            <div className="angada-title-vignette" />
            <div className="angada-embers">
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    left: `${(i * 61) % 100}%`,
                    animationDelay: `${(i % 6) * 0.9}s`,
                    animationDuration: `${6 + (i % 5)}s`,
                  }}
                />
              ))}
            </div>
            <div className="angada-title-content">
              <div className="angada-title-kicker">
                <Crown size={15} />
                <span>YUDDHA KANDA · THE GATES OF LANKA</span>
              </div>
              <motion.div className="angada-title-rule" initial={{ width: 0 }} animate={{ width: 90 }} transition={{ duration: 1 }} />
              <p className="angada-title-overline">A TEST OF STRENGTH</p>
              <h1>
                THE
                <br />
                UNMOVABLE
                <br />
                <em>FOOT</em>
              </h1>
              <p className="angada-title-description">One prince. One challenge. An entire royal court unable to move him.</p>
              <button className="angada-primary-button" onClick={beginGame}>
                ENTER RAVANA'S COURT
                <ArrowRight size={17} />
              </button>
              <p className="angada-title-footnote">ANCESTRA INTERACTIVE EXPERIENCE</p>
            </div>
          </motion.section>
        )}

        {stage === "intro" && (
          <motion.section
            key="intro"
            className="angada-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <AnimatePresence initial={false} custom={introIndex} mode="sync">
              <IntroSlide key={introIndex} data={INTRO[introIndex]} index={introIndex} onNext={advanceIntro} />
            </AnimatePresence>
          </motion.section>
        )}

        {stage === "gameplay" && (
          <motion.section
            key="gameplay"
            className="angada-gameplay-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            onPointerDown={attemptToLift}
          >
            <GameScene sim={sim} />
            <div className="angada-gameplay-shade" />
            <div className={`angada-letterbox ${lifting ? "is-open" : ""}`} />
            {lifting && attempts > 0 && <div key={attempts} className="angada-tap-flash" />}

            <header className="angada-game-hud">
              <div className="angada-hud-brand">
                <Crown size={16} />
                <span>RAVANA'S COURT</span>
              </div>
              <div className="angada-timer">
                <Timer size={17} />
                <span>{`00:${String(seconds).padStart(2, "0")}`}</span>
              </div>
            </header>

            <AnimatePresence>
              {lifting && (
                <motion.div
                  className="angada-gameplay-heading"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <p>THE COURT HAS ACCEPTED THE CHALLENGE</p>
                  <h2>MOVE HIS FOOT.</h2>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="angada-gameplay-instruction" key={`${phase}-${attempts < 1 ? 0 : attempts < 5 ? 1 : attempts < 12 ? 2 : attempts < 20 ? 3 : 4}-${seconds <= 6}`}>
              <Footprints size={18} />
              <span>{subtitleFor(phase, attempts, seconds)}</span>
            </div>

            <AnimatePresence>
              {lifting && (
                <motion.div
                  className={`angada-effort-panel ${effort > 70 ? "is-strained" : ""}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="angada-effort-topline">
                    <span>YOUR EFFORT</span>
                    <span>{attempts} ATTEMPTS</span>
                  </div>
                  <div className="angada-effort-track">
                    <div className="angada-effort-fill" style={{ width: `${effort}%` }} />
                  </div>
                  <div className="angada-lift-button" aria-hidden="true">
                    <Hand size={20} />
                    TRY TO LIFT HIS FOOT
                  </div>
                  <p className="angada-gameplay-note">TAP ANYWHERE · OR PRESS SPACE</p>
                </motion.div>
              )}
            </AnimatePresence>

            {lifting && (
              <div className="angada-immovable-stamp">
                <ShieldAlert size={15} />
                <span>ANGADA REMAINS UNMOVED</span>
              </div>
            )}
          </motion.section>
        )}

        {stage === "ending" && (
          <motion.section
            key="ending"
            className="angada-ending-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.img
              className="angada-ending-image"
              src={GAME_IMAGES.warning}
              alt="Angada delivers his final warning in Ravana's court"
              initial={{ scale: 1.3, filter: "brightness(1.8)" }}
              animate={{ scale: 1.02, filter: "brightness(1)" }}
              transition={{ duration: 6, ease: "easeOut" }}
            />
            <div className="angada-ending-shade" />
            <div className="angada-flash angada-flash--ending" />

            <div className="angada-ending-top">
              <span>THE CHALLENGE IS OVER</span>
              <span>ANCESTRA</span>
            </div>

            <div className="angada-ending-content">
              <motion.p className="angada-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                THE COURT HAS FAILED
              </motion.p>
              <motion.h2 initial={{ opacity: 0, scale: 1.25 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.0, duration: 0.7, ease: "easeOut" }}>
                NOT AN INCH.
              </motion.h2>
              <motion.p className="angada-ending-dialogue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7, duration: 0.8 }}>
                “Remember this, Ravana. You were given a final chance to choose peace. Do not mistake this warning for fear.”
              </motion.p>
              <span className="angada-speaker">ANGADA</span>

              <motion.div className="angada-ending-stats" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4 }}>
                <div>
                  <strong>{attempts}</strong>
                  <span>YOUR ATTEMPTS</span>
                </div>
                <div>
                  <strong>0</strong>
                  <span>INCHES MOVED</span>
                </div>
                <div>
                  <strong>{GAME_DURATION}s</strong>
                  <span>THE CHALLENGE</span>
                </div>
              </motion.div>

              <motion.div className="angada-ending-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>
                <button className="angada-primary-button" onClick={finishGame}>
                  RETURN TO THE STORY
                  <ArrowRight size={17} />
                </button>
                <button className="angada-replay-button" onClick={restartGame}>
                  <RotateCcw size={15} />
                  PLAY AGAIN
                </button>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}