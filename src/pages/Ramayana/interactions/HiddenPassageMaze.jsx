import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, Float, Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass,
  Footprints,
  Gem,
  Lightbulb,
  Lock,
  Unlock,
  Map as MapIcon,
  Crosshair,
  RotateCcw,
  Star,
  Sparkles as SparkleIcon,
  X,
} from "lucide-react";
import "./HiddenPassageMaze.css";

/* ============================================================
   ANCESTRA — CHAPTER XI · THE HIDDEN PASSAGE
   A crystal cave maze. Awaken three sigils to break the seal.
   ============================================================ */

const MAZE = [
  "#############",
  "#S....#.....#",
  "###.#.#.###.#",
  "#...#...#...#",
  "#.#####.#.###",
  "#.....#.#...#",
  "#####.#.###.#",
  "#.....#...#.#",
  "#.#######.#.#",
  "#.........#E#",
  "#############",
];

const ROWS = MAZE.length;
const COLS = MAZE[0].length;
const START = { row: 1, col: 1 };
const EXIT = { row: 9, col: 11 };
const DOOR = { row: 10, col: 11 };
const CELL = 1.25;
const WALL_H = 1.5;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const SIGILS = [
  { id: 0, row: 3, col: 1 },
  { id: 1, row: 7, col: 2 },
  { id: 2, row: 9, col: 6 },
];

/* Walls that carry a brazier stay tall. */
const TORCH_WALLS = new Set(["2,4", "6,2", "8,6", "4,10"]);

const isWalkable = (r, c) =>
  r >= 0 && r < ROWS && c >= 0 && c < COLS && MAZE[r][c] !== "#";

const worldPosition = (row, col) => ({
  x: (col - (COLS - 1) / 2) * CELL,
  z: (row - (ROWS - 1) / 2) * CELL,
});

const hash = (r, c) => {
  const s = Math.sin(r * 127.1 + c * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const n3 = (x, y, z, s) => {
  const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + s * 17.13) * 43758.5453;
  return v - Math.floor(v);
};

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const damp = THREE.MathUtils.damp;

/* ------------------------------------------------------------
   Pathfinding & scoring
   ------------------------------------------------------------ */

function bfsPath(from, to) {
  const key = (r, c) => r * COLS + c;
  const prev = new Map([[key(from.row, from.col), null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.row === to.row && cur.col === to.col) {
      const path = [];
      let k = key(cur.row, cur.col);
      while (prev.get(k) !== null) {
        path.unshift({ row: Math.floor(k / COLS), col: k % COLS });
        k = prev.get(k);
      }
      return path;
    }
    for (const [dr, dc] of DIRS) {
      const r = cur.row + dr;
      const c = cur.col + dc;
      const k = key(r, c);
      if (isWalkable(r, c) && !prev.has(k)) {
        prev.set(k, key(cur.row, cur.col));
        queue.push({ row: r, col: c });
      }
    }
  }
  return [];
}

const PAR = (() => {
  const orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  return Math.min(
    ...orders.map((order) => {
      let at = START;
      let total = 0;
      [...order.map((i) => SIGILS[i]), EXIT].forEach((t) => {
        total += bfsPath(at, t).length;
        at = t;
      });
      return total;
    })
  );
})();

const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ------------------------------------------------------------
   Procedural textures & rock geometry (no external assets)
   ------------------------------------------------------------ */

let glowTexture;
function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.28, "rgba(255,255,255,0.42)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(canvas);
  return glowTexture;
}

let rockTexture;
function getRockTexture() {
  if (rockTexture) return rockTexture;
  const rnd = mulberry32(7);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const g = canvas.getContext("2d");
  g.fillStyle = "#8d7a60";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2800; i++) {
    const v = Math.floor(55 + rnd() * 160);
    g.fillStyle = `rgba(${v},${Math.floor(v * 0.86)},${Math.floor(v * 0.68)},${0.08 + rnd() * 0.2})`;
    const s = 2 + rnd() * 11;
    g.fillRect(rnd() * 256, rnd() * 256, s, s * (0.35 + rnd()));
  }
  g.strokeStyle = "rgba(18,11,6,0.4)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 28; i++) {
    g.beginPath();
    let x = rnd() * 256;
    let y = rnd() * 256;
    g.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (rnd() - 0.5) * 44;
      y += (rnd() - 0.5) * 44;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  rockTexture = tex;
  return tex;
}

/* Jagged rock pillar: displaced box with moss-to-stone vertex colours. */
function makeRockBlock(seed) {
  const h = WALL_H;
  const geo = new THREE.BoxGeometry(1.2, h, 1.2, 3, 5, 3);
  const pos = geo.attributes.position;
  const colors = [];
  const moss = new THREE.Color("#26372c");
  const stone = new THREE.Color("#85715a");
  const light = new THREE.Color("#b29c7c");
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const ox = pos.getX(i);
    const oy = pos.getY(i);
    const oz = pos.getZ(i);
    const bottom = oy <= -h / 2 + 1e-4;
    const top = oy >= h / 2 - 1e-4;
    let x = ox;
    let y = oy;
    let z = oz;
    if (!bottom) {
      x += (n3(ox, oy, oz, seed) - 0.5) * 0.17;
      z += (n3(ox, oy, oz, seed + 3) - 0.5) * 0.17;
      if (top) y += (n3(ox, oy, oz, seed + 6) - 0.4) * 0.34;
    }
    pos.setXYZ(i, x, y, z);
    const t = (y + h / 2) / h;
    if (t < 0.4) c.copy(moss).lerp(stone, t / 0.4);
    else c.copy(stone).lerp(light, (t - 0.4) / 0.6);
    c.multiplyScalar(0.86 + n3(ox, oy, oz, seed + 9) * 0.28);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));
  geo.computeVertexNormals();
  return geo;
}

function makeBoulder(seed) {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const ox = pos.getX(i);
    const oy = pos.getY(i);
    const oz = pos.getZ(i);
    const k = 0.72 + n3(ox, oy, oz, seed) * 0.5;
    pos.setXYZ(i, ox * k, oy * k * 0.92, oz * k);
  }
  geo.computeVertexNormals();
  return geo;
}

const WALL_GEOS = [makeRockBlock(1), makeRockBlock(8), makeRockBlock(15)];
const BOULDER_GEOS = [makeBoulder(3), makeBoulder(11)];

/* ------------------------------------------------------------
   Static scene data
   ------------------------------------------------------------ */

const SPECIAL = new Set(
  [START, EXIT, ...SIGILS, DOOR].map((p) => `${p.row},${p.col}`)
);

const FLOORS = [];
const WALL_DATA = [[], [], []];
MAZE.forEach((line, row) =>
  [...line].forEach((cell, col) => {
    if (cell === "#") {
      if (row === DOOR.row && col === DOOR.col) return;
      const torch = TORCH_WALLS.has(`${row},${col}`);
      const v = Math.floor(hash(row, col) * 3);
      const base = torch ? 1.1 : 0.9 + hash(col, row) * 0.3;
      const tone = 0.85 + hash(row + 3, col + 7) * 0.3;
      WALL_DATA[v].push({
        row,
        col,
        torch,
        base,
        rot: Math.floor(hash(row + 1, col + 2) * 4) * (Math.PI / 2),
        color: new THREE.Color("#ffffff").multiplyScalar(tone),
      });
    } else {
      FLOORS.push({ row, col });
    }
  })
);

/* Small glowing things tucked into cell corners, plus a few puddles. */
const CORNER_DECOR = [];
const PUDDLES = [];
FLOORS.forEach(({ row, col }) => {
  if (SPECIAL.has(`${row},${col}`)) return;
  const h = hash(row * 3 + 1, col * 5 + 2);
  const { x, z } = worldPosition(row, col);
  if (h > 0.8) {
    const sx = hash(row, col + 11) > 0.5 ? 1 : -1;
    const sz = hash(row + 5, col) > 0.5 ? 1 : -1;
    CORNER_DECOR.push({
      x: x + sx * 0.44,
      z: z + sz * 0.44,
      kind: h > 0.9 ? "crystal" : "mushroom",
      s: 0.7 + hash(row + 2, col + 8) * 0.7,
      hue: Math.floor(hash(row + 4, col + 1) * 3),
    });
  }
  if (hash(row + 9, col + 4) > 0.93) PUDDLES.push({ x, z, r: 0.34 + hash(row, col + 6) * 0.1 });
});

const CRYSTAL_COLORS = ["#5eead0", "#6aa8ff", "#b58cff"];
const MUSH_COLORS = ["#5eead0", "#ff7ad9", "#9dff8a"];

/* The cavern around the maze. */
const CAVERN = (() => {
  const rnd = mulberry32(2024);
  const boulders = [[], []];
  const stalag = [];
  const tites = [];
  const crystals = [[], [], []];
  const glows = [];

  const outside = (x, z, pad = 0) => Math.abs(x) < 8.4 + pad && Math.abs(z) < 7.3 + pad;

  for (let i = 0; i < 70; i++) {
    const x = (rnd() * 2 - 1) * 16;
    const z = (rnd() * 2 - 1) * 13;
    if (outside(x, z) || (z > 6.8 && Math.abs(x - 0.0) < 3.4 && x > -2)) continue;
    const s = 1.1 + rnd() * 2.2 + (z < -7 ? 1 : 0);
    boulders[i % 2].push({ p: [x, s * 0.42, z], s, r: rnd() * 6 });
  }
  for (let i = 0; i < 26; i++) {
    const x = (rnd() * 2 - 1) * 15;
    const z = (rnd() * 2 - 1) * 12;
    if (outside(x, z, 0.6)) continue;
    const r = 0.25 + rnd() * 0.35;
    const h = 1.2 + rnd() * 2.4;
    stalag.push({ p: [x, h / 2, z], s: [r, h, r] });
  }
  for (let i = 0; i < 34; i++) {
    const x = (rnd() * 2 - 1) * 17;
    const z = (rnd() * 2 - 1) * 14;
    if (Math.abs(x) < 9 && Math.abs(z) < 8) continue;
    const r = 0.25 + rnd() * 0.4;
    const h = 1.6 + rnd() * 3.2;
    tites.push({ p: [x, 7.6 + rnd() * 1.6, z], s: [r, h, r] });
  }
  for (let i = 0; i < 30; i++) {
    const cx = (rnd() * 2 - 1) * 14;
    const cz = (rnd() * 2 - 1) * 11.5;
    if (outside(cx, cz, 0.5) || (cz > 6.2 && Math.abs(cx) < 3.5)) continue;
    const g = i % 3;
    for (let k = 0; k < 3; k++) {
      const r = 0.1 + rnd() * 0.16;
      const h = 0.7 + rnd() * 1.5;
      crystals[g].push({
        p: [cx + (rnd() - 0.5) * 0.8, h * 0.45, cz + (rnd() - 0.5) * 0.8],
        rot: [(rnd() - 0.5) * 0.7, rnd() * 3, (rnd() - 0.5) * 0.7],
        s: [r, h, r],
      });
    }
    glows.push({ p: [cx, 0.7, cz], color: CRYSTAL_COLORS[g] });
  }
  return { boulders, stalag, tites, crystals, glows };
})();

/* ============================================================
   SHARED BITS
   ============================================================ */

function Glow({ color, size, opacity = 1, position, matRef, depthTest = true }) {
  const map = useMemo(getGlowTexture, []);
  return (
    <sprite position={position} scale={[size, size, 1]} renderOrder={depthTest ? 0 : 11}>
      <spriteMaterial
        ref={matRef}
        map={map}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        depthTest={depthTest}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </sprite>
  );
}

function RockMaterial({ vertexColors = false, color = "#ffffff", bump = 1.3 }) {
  const tex = useMemo(getRockTexture, []);
  return (
    <meshStandardMaterial
      map={tex}
      bumpMap={tex}
      bumpScale={bump}
      color={color}
      roughness={0.96}
      metalness={0.02}
      flatShading
      vertexColors={vertexColors}
    />
  );
}

/* ============================================================
   CAVE ENVIRONMENT
   ============================================================ */

function MazeFloor() {
  const tex = useMemo(getRockTexture, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]} receiveShadow>
        <planeGeometry args={[60, 50]} />
        <meshStandardMaterial map={tex} color="#2a241d" roughness={1} />
      </mesh>

      <Instances limit={FLOORS.length} receiveShadow>
        <boxGeometry args={[1.2, 0.14, 1.2]} />
        <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={1.1} roughness={0.9} />
        {FLOORS.map(({ row, col }) => {
          const { x, z } = worldPosition(row, col);
          const tone = 0.78 + hash(row, col) * 0.25;
          return (
            <Instance
              key={`${row}-${col}`}
              position={[x, -0.04 + (hash(col, row) - 0.5) * 0.015, z]}
              rotation={[0, Math.floor(hash(row, col + 3) * 4) * (Math.PI / 2), 0]}
              color={new THREE.Color("#8a7660").multiplyScalar(tone)}
            />
          );
        })}
      </Instances>

      {PUDDLES.map((p, i) => (
        <mesh key={i} position={[p.x, 0.045, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[p.r, 28]} />
          <meshPhysicalMaterial
            color="#071a26"
            roughness={0.04}
            metalness={0.7}
            emissive="#0a2a3c"
            emissiveIntensity={0.55}
            clearcoat={1}
          />
        </mesh>
      ))}
    </group>
  );
}

/* Wall that sinks when it would hide the corridor in front of the camera. */
function WallBlock({ wall, playerRef, cut }) {
  const ref = useRef();
  const { x, z } = worldPosition(wall.row, wall.col);
  const edge = wall.row === 0 || wall.row === ROWS - 1 || wall.col === 0 || wall.col === COLS - 1;

  useFrame((_, delta) => {
    const o = ref.current;
    if (!o) return;
    const p = playerRef.current;
    const low =
      cut &&
      !wall.torch &&
      !edge &&
      wall.row >= p.row - 1 &&
      wall.row <= p.row + 3 &&
      Math.abs(wall.col - p.col) <= 3;
    const sy = damp(o.scale.y, low ? 0.3 : wall.base, 7, delta);
    o.scale.y = sy;
    o.position.y = (WALL_H / 2) * sy;
  });

  return (
    <Instance
      ref={ref}
      position={[x, (WALL_H / 2) * wall.base, z]}
      rotation={[0, wall.rot, 0]}
      scale={[1, wall.base, 1]}
      color={wall.color}
    />
  );
}

function MazeWalls({ playerRef, cut }) {
  return (
    <group>
      {WALL_GEOS.map((geo, v) => (
        <Instances key={v} limit={WALL_DATA[v].length + 1} castShadow receiveShadow>
          <primitive object={geo} attach="geometry" />
          <RockMaterial vertexColors />
          {WALL_DATA[v].map((w) => (
            <WallBlock key={`${w.row}-${w.col}`} wall={w} playerRef={playerRef} cut={cut} />
          ))}
        </Instances>
      ))}
    </group>
  );
}

function Brazier({ wall }) {
  const light = useRef();
  const flame = useRef();
  const seed = useMemo(() => Math.random() * 10, []);
  const { x, z } = worldPosition(wall.row, wall.col);
  const top = WALL_H * wall.base;

  useFrame((state) => {
    const t = state.clock.elapsedTime + seed;
    const f = 1 + Math.sin(t * 9) * 0.12 + Math.sin(t * 17.3) * 0.09;
    if (light.current) light.current.intensity = 4.2 * f;
    if (flame.current) flame.current.scale.set(1 + Math.sin(t * 13) * 0.08, f * 1.15, 1);
  });

  return (
    <group position={[x, top, z]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.16, 0.24, 10]} />
        <meshStandardMaterial color="#3b2f25" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <torusGeometry args={[0.28, 0.025, 8, 24]} />
        <meshStandardMaterial color="#8c6a3a" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh ref={flame} position={[0, 0.5, 0]}>
        <coneGeometry args={[0.15, 0.48, 12]} />
        <meshStandardMaterial color="#ffd58a" emissive="#ff8a2c" emissiveIntensity={2.8} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <coneGeometry args={[0.09, 0.3, 10]} />
        <meshBasicMaterial color="#fff3c9" toneMapped={false} />
      </mesh>
      <Glow color="#ff9d45" size={2.2} opacity={0.6} position={[0, 0.55, 0]} />
      <pointLight ref={light} position={[0, 0.9, 0]} color="#ffa24f" distance={7.5} decay={1.5} castShadow={false} />
    </group>
  );
}

function CornerDecor() {
  const crystals = CORNER_DECOR.filter((d) => d.kind === "crystal");
  const shrooms = CORNER_DECOR.filter((d) => d.kind === "mushroom");
  return (
    <group>
      {CRYSTAL_COLORS.map((col, g) => (
        <Instances key={col} limit={crystals.length * 2 + 2}>
          <coneGeometry args={[1, 1, 5]} />
          <meshStandardMaterial color="#0b1a1e" emissive={col} emissiveIntensity={1.4} flatShading toneMapped={false} />
          {crystals
            .filter((d) => d.hue === g)
            .flatMap((d, i) => [
              <Instance
                key={`a${i}`}
                position={[d.x, 0.2 * d.s, d.z]}
                scale={[0.07 * d.s, 0.42 * d.s, 0.07 * d.s]}
                rotation={[0.18, i, -0.12]}
              />,
              <Instance
                key={`b${i}`}
                position={[d.x + 0.07, 0.13 * d.s, d.z - 0.04]}
                scale={[0.05 * d.s, 0.28 * d.s, 0.05 * d.s]}
                rotation={[-0.25, i * 2, 0.3]}
              />,
            ])}
        </Instances>
      ))}

      <Instances limit={shrooms.length + 1}>
        <cylinderGeometry args={[0.018, 0.026, 0.1, 6]} />
        <meshStandardMaterial color="#d8c6a6" roughness={0.9} />
        {shrooms.map((d, i) => (
          <Instance key={i} position={[d.x, 0.07 * d.s, d.z]} scale={d.s} />
        ))}
      </Instances>
      <Instances limit={shrooms.length + 1}>
        <sphereGeometry args={[0.075, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial toneMapped={false} />
        {shrooms.map((d, i) => (
          <Instance
            key={i}
            position={[d.x, 0.12 * d.s, d.z]}
            scale={d.s}
            color={MUSH_COLORS[d.hue]}
          />
        ))}
      </Instances>
      {shrooms.map((d, i) => (
        <Glow key={i} color={MUSH_COLORS[d.hue]} size={0.8 * d.s} opacity={0.5} position={[d.x, 0.14, d.z]} />
      ))}
    </group>
  );
}

function Cavern() {
  const tex = useMemo(getRockTexture, []);
  return (
    <group>
      {BOULDER_GEOS.map((geo, v) => (
        <Instances key={v} limit={CAVERN.boulders[v].length + 1} castShadow receiveShadow>
          <primitive object={geo} attach="geometry" />
          <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={1.2} color="#8c7a63" roughness={1} flatShading />
          {CAVERN.boulders[v].map((b, i) => (
            <Instance key={i} position={b.p} scale={b.s} rotation={[0, b.r, 0]} color={new THREE.Color("#fff").multiplyScalar(0.7 + (i % 5) * 0.08)} />
          ))}
        </Instances>
      ))}

      <Instances limit={CAVERN.stalag.length + 1} castShadow>
        <coneGeometry args={[1, 1, 6]} />
        <meshStandardMaterial map={tex} color="#6d5c49" roughness={1} flatShading />
        {CAVERN.stalag.map((s, i) => (
          <Instance key={i} position={s.p} scale={s.s} />
        ))}
      </Instances>

      <Instances limit={CAVERN.tites.length + 1}>
        <coneGeometry args={[1, 1, 6]} />
        <meshStandardMaterial map={tex} color="#4a3f33" roughness={1} flatShading />
        {CAVERN.tites.map((s, i) => (
          <Instance key={i} position={s.p} scale={s.s} rotation={[Math.PI, 0, 0]} />
        ))}
      </Instances>

      {CRYSTAL_COLORS.map((col, g) => (
        <Instances key={col} limit={CAVERN.crystals[g].length + 1}>
          <coneGeometry args={[1, 1, 5]} />
          <meshStandardMaterial color="#0b1a1e" emissive={col} emissiveIntensity={1.5} flatShading toneMapped={false} />
          {CAVERN.crystals[g].map((c, i) => (
            <Instance key={i} position={c.p} scale={c.s} rotation={c.rot} />
          ))}
        </Instances>
      ))}
      {CAVERN.glows.map((g, i) => (
        <Glow key={i} color={g.color} size={3.2} opacity={0.38} position={g.p} />
      ))}

      {/* Moonlight falling through the cavern roof */}
      {[[-4.5, 1.5], [3.8, -2.8], [0.5, 4.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 5, z]}>
          <cylinderGeometry args={[1.5 + i * 0.3, 0.9, 10, 20, 1, true]} />
          <meshBasicMaterial
            color="#8fc8ff"
            transparent
            opacity={0.045}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   PUZZLE PIECES
   ============================================================ */

function SigilStone({ sigil, collected }) {
  const group = useRef();
  const ringMat = useRef();
  const { x, z } = worldPosition(sigil.row, sigil.col);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.scale.setScalar(damp(g.scale.x, collected ? 0 : 1, 6, delta));
    g.position.y = 0.78 + Math.sin(t * 2 + sigil.id) * 0.08;
    g.rotation.y = t * 1.3;
    if (ringMat.current) ringMat.current.emissiveIntensity = collected ? 0.15 : 1.4 + Math.sin(t * 3 + sigil.id) * 0.5;
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.3, 0.36, 0.14, 8]} />
        <meshStandardMaterial color="#5d4d3c" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.014, 8, 40]} />
        <meshStandardMaterial ref={ringMat} color="#7ef3dc" emissive="#3fd3b8" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <group ref={group} position={[0, 0.78, 0]}>
        <mesh>
          <octahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color="#c8fff2" emissive="#52e8cc" emissiveIntensity={2.6} roughness={0.12} flatShading toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.014, 8, 40]} />
          <meshStandardMaterial color="#7ef3dc" emissive="#3fd3b8" emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
        <Glow color="#5eead0" size={1.5} opacity={0.75} />
      </group>
    </group>
  );
}

function ExitSeal({ found }) {
  const { x, z } = worldPosition(EXIT.row, EXIT.col);
  const ring = useRef();
  const unlocked = found >= SIGILS.length;
  const color = unlocked ? "#ffd68a" : "#c4562f";

  useFrame((state) => {
    if (ring.current) ring.current.rotation.z = state.clock.elapsedTime * 0.5;
  });

  return (
    <group position={[x, 0.05, z]}>
      <group ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.44, 0.018, 8, 64]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          const lit = i < found;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.44, Math.sin(a) * 0.44, 0]}>
              <sphereGeometry args={[0.065, 16, 16]} />
              <meshStandardMaterial
                color={lit ? "#c8fff2" : "#2a1b12"}
                emissive={lit ? "#52e8cc" : "#000000"}
                emissiveIntensity={lit ? 3 : 0}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.3, 0.38, 4.4, 20, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={unlocked ? 0.16 : 0.07}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <Glow color={color} size={2} opacity={unlocked ? 0.55 : 0.28} position={[0, 0.2, 0]} />
    </group>
  );
}

function HintDot({ cell, index }) {
  const mat = useRef();
  const { x, z } = worldPosition(cell.row, cell.col);
  useFrame((state) => {
    if (mat.current) {
      mat.current.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(state.clock.elapsedTime * 6 - index * 0.6));
    }
  });
  return (
    <mesh position={[x, 0.1, z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
      <circleGeometry args={[0.13, 20]} />
      <meshBasicMaterial ref={mat} color="#8ff5e2" transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/* ============================================================
   THE CAVE MOUTH
   ============================================================ */

function CaveExit({ opened }) {
  const { x, z } = worldPosition(DOOR.row, DOOR.col);
  const left = useRef();
  const right = useRef();
  const portal = useRef();
  const light = useRef();
  const shaft = useRef();
  const shaftTwo = useRef();
  const glow = useRef();
  const pool = useRef();
  const target = useMemo(() => new THREE.Color(), []);
  const map = useMemo(getGlowTexture, []);
  const rockTex = useMemo(getRockTexture, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const slide = opened ? 0.78 : 0.23;
    if (left.current) left.current.position.x = damp(left.current.position.x, -slide, 1.4, delta);
    if (right.current) right.current.position.x = damp(right.current.position.x, slide, 1.4, delta);
    if (portal.current) {
      target.set(opened ? "#fff0c4" : "#090604");
      portal.current.material.color.lerp(target, 1 - Math.exp(-delta * 1.6));
    }
    if (light.current) light.current.intensity = damp(light.current.intensity, opened ? 30 : 0.5, 1.6, delta);
    if (glow.current) glow.current.opacity = damp(glow.current.opacity, opened ? 0.95 : 0, 1.4, delta);
    if (pool.current) pool.current.material.opacity = damp(pool.current.material.opacity, opened ? 0.85 : 0, 1.2, delta);
    if (shaft.current) shaft.current.material.opacity = damp(shaft.current.material.opacity, opened ? 0.18 + Math.sin(t * 1.4) * 0.03 : 0, 1.3, delta);
    if (shaftTwo.current) shaftTwo.current.material.opacity = damp(shaftTwo.current.material.opacity, opened ? 0.11 + Math.sin(t * 1.9 + 1) * 0.03 : 0, 1.1, delta);
  });

  const archPieces = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = (Math.PI * i) / 8;
        const s = 0.3 + hash(i, 4) * 0.12;
        return { p: [Math.cos(a) * 1.02, 1.45 + Math.sin(a) * 0.95, -0.5], s, a };
      }),
    []
  );

  return (
    <group position={[x, 0, z]}>
      {/* Doorway body */}
      {[-0.53, 0.53].map((px) => (
        <mesh key={px} position={[px, 0.85, 0]}>
          <boxGeometry args={[0.16, 1.7, 1.2]} />
          <meshStandardMaterial color="#4d3b2b" roughness={0.94} />
        </mesh>
      ))}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[1.22, 0.26, 1.2]} />
        <meshStandardMaterial color="#4d3b2b" roughness={0.94} />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.92, 0.14, 1.2]} />
        <meshStandardMaterial color="#72593f" roughness={0.92} />
      </mesh>
      <mesh ref={portal} position={[0, 0.72, 0.28]}>
        <planeGeometry args={[0.95, 1.5]} />
        <meshBasicMaterial color="#090604" toneMapped={false} />
      </mesh>

      {/* Great rock arch with stalactite teeth */}
      {archPieces.map((a, i) => (
        <mesh key={i} geometry={BOULDER_GEOS[i % 2]} position={a.p} scale={[a.s * 1.15, a.s * 1.15, a.s * 0.9]} rotation={[0, i, 0]} castShadow>
          <RockMaterial color="#9a8668" />
        </mesh>
      ))}
      {[-1.05, 1.05].map((px, i) => (
        <mesh key={px} geometry={BOULDER_GEOS[i]} position={[px, 0.75, -0.5]} scale={[0.42, 0.95, 0.42]} castShadow>
          <RockMaterial color="#9a8668" />
        </mesh>
      ))}
      {archPieces.slice(1, 8).map((a, i) => (
        <mesh key={i} position={[a.p[0] * 0.8, a.p[1] - 0.3 - (i % 2) * 0.08, -0.55]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.05, 0.26 + (i % 3) * 0.06, 6]} />
          <meshStandardMaterial color="#7a6850" roughness={1} flatShading />
        </mesh>
      ))}
      {/* Carved runes */}
      {[-0.57, 0.57].map((px) => (
        <mesh key={px} position={[px, 0.75, -0.62]}>
          <boxGeometry args={[0.04, 1.3, 0.04]} />
          <meshStandardMaterial
            color="#ffd68a"
            emissive="#e8a043"
            emissiveIntensity={opened ? 3 : 0.5}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Sliding stone doors */}
      <mesh ref={left} position={[-0.23, 0.7, -0.4]} castShadow>
        <boxGeometry args={[0.47, 1.4, 0.14]} />
        <meshStandardMaterial map={rockTex} color="#6e5439" roughness={0.95} />
      </mesh>
      <mesh ref={right} position={[0.23, 0.7, -0.4]} castShadow>
        <boxGeometry args={[0.47, 1.4, 0.14]} />
        <meshStandardMaterial map={rockTex} color="#6e5439" roughness={0.95} />
      </mesh>

      {/* Mountain behind */}
      {[[-0.2, 1.1, 2.4, 2.2], [1.9, 0.7, 2, 1.5], [-2.1, 0.6, 2.1, 1.6], [0.8, 1.7, 3.6, 2.6]].map(([rx, ry, rz, s], i) => (
        <mesh key={i} geometry={BOULDER_GEOS[i % 2]} position={[rx, ry, rz]} scale={s} castShadow>
          <RockMaterial color="#6f5d48" />
        </mesh>
      ))}

      {/* Light flooding out */}
      <pointLight ref={light} position={[0, 0.9, -0.9]} color="#ffd592" intensity={0.5} distance={14} decay={1.4} />
      <Glow color="#ffe2a8" size={6.5} opacity={0} position={[0, 0.8, -0.6]} matRef={glow} />
      <mesh ref={pool} position={[0, 0.07, -1.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.6, 4.2]} />
        <meshBasicMaterial map={map} color="#ffe1a0" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={shaft} position={[0, 0.8, -3.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.2, 0.5, 5.4, 28, 1, true]} />
        <meshBasicMaterial color="#ffe3ae" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={shaftTwo} position={[0, 0.8, -2.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.2, 0.45, 3.8, 24, 1, true]} />
        <meshBasicMaterial color="#fff3d0" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {opened && (
        <>
          <Sparkles count={110} scale={[2, 2.2, 4.5]} size={4.5} speed={0.8} color="#ffe6b0" position={[0, 0.9, -2.2]} />
          <Sparkles count={40} scale={[1, 1.5, 1.5]} size={7} speed={0.3} opacity={0.8} color="#ffffff" position={[0, 0.9, -0.8]} />
        </>
      )}
    </group>
  );
}

/* ============================================================
   PLAYER & CAMERA
   ============================================================ */

const TRAIL = 9;

function PlayerToken({ player, phase }) {
  const group = useRef();
  const trail = useRef([]);
  const history = useRef([]);
  const walk = useRef(0);
  const start = worldPosition(START.row, START.col);
  const tile = worldPosition(player.row, player.col);
  const door = worldPosition(DOOR.row, DOOR.col);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const entering = phase === "opening" || phase === "reveal";
    walk.current = entering ? walk.current + delta : 0;

    const goal = walk.current > 1.1 ? door : tile;
    g.position.x = damp(g.position.x, goal.x, entering ? 2.6 : 9, delta);
    g.position.z = damp(g.position.z, goal.z, entering ? 2.6 : 9, delta);
    g.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 2.8) * 0.07;
    g.scale.setScalar(damp(g.scale.x, walk.current > 2.3 ? 0 : 1, 3, delta));

    const h = history.current;
    h.unshift([g.position.x, g.position.y, g.position.z]);
    if (h.length > 60) h.pop();
    trail.current.forEach((m, i) => {
      const p = h[Math.min(h.length - 1, (i + 1) * 4)];
      if (m && p) {
        m.position.set(p[0], p[1] - 0.02, p[2]);
        m.scale.setScalar(Math.max(0.0001, g.scale.x * (1 - i / TRAIL)));
      }
    });
  });

  return (
    <>
      <group ref={group} position={[start.x, 0.6, start.z]}>
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.18}>
          <mesh renderOrder={10}>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshStandardMaterial color="#fff0bf" emissive="#f0b94f" emissiveIntensity={2.8} roughness={0.2} depthTest={false} toneMapped={false} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={10}>
            <torusGeometry args={[0.34, 0.025, 8, 48]} />
            <meshStandardMaterial color="#e8bd6e" emissive="#d89a3d" emissiveIntensity={1.6} depthTest={false} toneMapped={false} />
          </mesh>
          <Glow color="#ffd38a" size={1.6} opacity={0.85} depthTest={false} />
          <pointLight color="#ffd38a" intensity={3.4} distance={5} />
        </Float>
      </group>
      {Array.from({ length: TRAIL }, (_, i) => (
        <mesh key={i} ref={(el) => (trail.current[i] = el)} renderOrder={9}>
          <sphereGeometry args={[0.11, 10, 10]} />
          <meshBasicMaterial
            color="#ffcf7a"
            transparent
            opacity={0.6 - i * 0.06}
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

function CameraRig({ player, phase, overview }) {
  const look = useRef(new THREE.Vector3(0, 0, -2));
  const shakeT = useRef(0);
  const exit = worldPosition(EXIT.row, EXIT.col);
  const door = worldPosition(DOOR.row, DOOR.col);

  useFrame((state, delta) => {
    const { camera, clock, viewport } = state;
    const t = clock.elapsedTime;
    const aspect = viewport.aspect;
    let pos;
    let tgt;
    let speed = 2.6;

    if (phase === "intro") {
      const fit = Math.max(1, Math.min(2.3, 1.45 / aspect));
      pos = [Math.sin(t * 0.2) * 6, 11 * fit, 14.5 * fit + Math.cos(t * 0.2) * 1.5];
      tgt = [0, 0, -1.5];
      speed = 1.2;
    } else if (phase === "playing" && overview) {
      const fit = Math.max(1, Math.min(2.3, 1.45 / aspect));
      pos = [0, 15 * fit, 17 * fit];
      tgt = [0, 0, -2];
    } else if (phase === "playing") {
      const fit = Math.max(1, Math.min(2.4, 1.15 / aspect));
      const p = worldPosition(player.row, player.col);
      const cx = THREE.MathUtils.clamp(p.x, -5.2, 5.2);
      const cz = THREE.MathUtils.clamp(p.z, -4.2, 4.2);
      pos = [cx * 0.9, 8.4 * fit, cz + 6.6 * fit];
      tgt = [cx, 0, cz - 1.3];
      speed = 3.2;
    } else {
      shakeT.current += delta;
      pos = [exit.x, 3.3, exit.z - 4.4];
      tgt = [door.x, 1, door.z];
      speed = 1.5;
    }

    if (phase === "playing" || phase === "intro") shakeT.current = 0;
    const shake = phase === "opening" ? 0.05 * Math.exp(-shakeT.current * 0.9) : 0;

    camera.position.x = damp(camera.position.x, pos[0], speed, delta);
    camera.position.y = damp(camera.position.y, pos[1], speed, delta);
    camera.position.z = damp(camera.position.z, pos[2], speed, delta);
    look.current.x = damp(look.current.x, tgt[0], speed, delta);
    look.current.y = damp(look.current.y, tgt[1], speed, delta);
    look.current.z = damp(look.current.z, tgt[2], speed, delta);
    camera.lookAt(look.current);
    if (shake) {
      camera.position.x += Math.sin(t * 47) * shake;
      camera.position.y += Math.cos(t * 53) * shake;
    }
  });

  return null;
}

function MazeWorld({ player, phase, collected, hintPath, overview }) {
  const opened = phase === "opening" || phase === "reveal";
  const playerRef = useRef(player);
  playerRef.current = player;

  return (
    <>
      <color attach="background" args={["#07090d"]} />
      <fog attach="fog" args={["#07090d", 15, 38]} />

      <ambientLight intensity={0.5} color="#8fa3c4" />
      <hemisphereLight args={["#6aa8c8", "#2a1a10", 0.55]} />
      <directionalLight
        position={[-6, 13, 8]}
        intensity={1.35}
        color="#ffdcae"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />

      <MazeFloor />
      <MazeWalls playerRef={playerRef} cut={phase === "playing" && !overview} />
      {WALL_DATA.flat()
        .filter((w) => w.torch)
        .map((w) => (
          <Brazier key={`${w.row}-${w.col}`} wall={w} />
        ))}
      <CornerDecor />
      <Cavern />
      <CaveExit opened={opened} />
      <ExitSeal found={collected.length} />

      {SIGILS.map((s) => (
        <SigilStone key={s.id} sigil={s} collected={collected.includes(s.id)} />
      ))}
      {hintPath.map((cell, i) => (
        <HintDot key={`${cell.row}-${cell.col}`} cell={cell} index={i} />
      ))}

      <PlayerToken player={player} phase={phase} />
      <CameraRig player={player} phase={phase} overview={overview} />

      <Sparkles count={120} scale={[18, 5, 15]} size={1.6} speed={0.22} opacity={0.5} color="#dcae6a" />
      <Sparkles count={70} scale={[20, 6, 17]} size={2.4} speed={0.15} opacity={0.45} color="#5eead0" position={[0, 2, 0]} />
    </>
  );
}

/* ============================================================
   GAME
   ============================================================ */

export default function HiddenPassageMaze({ onComplete, onExit }) {
  const [phase, setPhase] = useState("intro");
  const [player, setPlayer] = useState(START);
  const [moves, setMoves] = useState(0);
  const [collected, setCollected] = useState([]);
  const [visited, setVisited] = useState([`${START.row},${START.col}`]);
  const [notice, setNotice] = useState(null);
  const [hintPath, setHintPath] = useState([]);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [overview, setOverview] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const phaseRef = useRef(phase);
  const posRef = useRef(START);
  const collectedRef = useRef([]);
  const lastMove = useRef(0);
  const startTime = useRef(0);
  const swipe = useRef(null);
  phaseRef.current = phase;

  const notify = useCallback((text, tone = "info") => {
    setNotice({ text, tone, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    if (!hintPath.length) return undefined;
    const id = setTimeout(() => setHintPath([]), 3800);
    return () => clearTimeout(id);
  }, [hintPath]);

  useEffect(() => {
    if (phase !== "opening") return undefined;
    setElapsed(Math.round((Date.now() - startTime.current) / 1000));
    const id = setTimeout(() => setPhase("reveal"), 4200);
    return () => clearTimeout(id);
  }, [phase]);

  const movePlayer = useCallback(
    (dr, dc) => {
      if (phaseRef.current !== "playing") return;
      const now = performance.now();
      if (now - lastMove.current < 135) return;
      lastMove.current = now;

      const { row, col } = posRef.current;
      const nr = row + dr;
      const nc = col + dc;

      if (!isWalkable(nr, nc)) {
        notify("Solid stone. Try another way.");
        return;
      }

      const found = collectedRef.current.length;
      if (nr === EXIT.row && nc === EXIT.col && found < SIGILS.length) {
        const left = SIGILS.length - found;
        notify(`The seal holds. ${left} sigil${left > 1 ? "s" : ""} still sleep in the cave.`);
        return;
      }

      posRef.current = { row: nr, col: nc };
      setPlayer({ row: nr, col: nc });
      setMoves((v) => v + 1);
      setVisited((v) => (v.includes(`${nr},${nc}`) ? v : [...v, `${nr},${nc}`]));

      const sigil = SIGILS.find(
        (s) => s.row === nr && s.col === nc && !collectedRef.current.includes(s.id)
      );
      if (sigil) {
        collectedRef.current = [...collectedRef.current, sigil.id];
        setCollected(collectedRef.current);
        const n = collectedRef.current.length;
        notify(
          n === SIGILS.length
            ? "All sigils awake. The cave seal is breaking."
            : `Sigil awakened (${n} of ${SIGILS.length}).`,
          "good"
        );
      }

      if (nr === EXIT.row && nc === EXIT.col) {
        setHintPath([]);
        setPhase("opening");
      }
    },
    [notify]
  );

  useEffect(() => {
    const keys = {
      arrowup: [-1, 0], w: [-1, 0],
      arrowdown: [1, 0], s: [1, 0],
      arrowleft: [0, -1], a: [0, -1],
      arrowright: [0, 1], d: [0, 1],
    };
    const onKeyDown = (e) => {
      const dir = keys[e.key.toLowerCase()];
      if (dir) {
        e.preventDefault();
        movePlayer(dir[0], dir[1]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [movePlayer]);

  const showHint = () => {
    if (phase !== "playing" || hintsLeft <= 0) return;
    const pending = SIGILS.filter((s) => !collected.includes(s.id));
    const goals = pending.length ? pending : [EXIT];
    const best = goals
      .map((g) => bfsPath(posRef.current, g))
      .sort((a, b) => a.length - b.length)[0];
    setHintPath(best);
    setHintsLeft((h) => h - 1);
  };

  const begin = () => {
    startTime.current = Date.now();
    setPhase("playing");
  };

  const restart = () => {
    posRef.current = START;
    collectedRef.current = [];
    setPlayer(START);
    setMoves(0);
    setCollected([]);
    setVisited([`${START.row},${START.col}`]);
    setHintPath([]);
    setHintsLeft(3);
    setNotice(null);
    setOverview(false);
    setRunKey((k) => k + 1);
    startTime.current = Date.now();
    setPhase("playing");
  };

  const closeGame = () => {
    onExit?.();
    onComplete?.();
  };

  const onTouchStart = (e) => {
    const t = e.touches[0];
    swipe.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!swipe.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipe.current.x;
    const dy = t.clientY - swipe.current.y;
    swipe.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
    if (Math.abs(dx) > Math.abs(dy)) movePlayer(0, dx > 0 ? 1 : -1);
    else movePlayer(dy > 0 ? 1 : -1, 0);
  };

  const opened = phase === "opening" || phase === "reveal";
  const unlocked = collected.length === SIGILS.length;
  const ratio = moves / PAR;
  const stars = ratio <= 1.15 ? 3 : ratio <= 1.6 ? 2 : 1;

  const seenSet = useMemo(() => new Set(visited), [visited]);
  const nearSeen = (r, c) => {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) if (seenSet.has(`${r + dr},${c + dc}`)) return true;
    return false;
  };

  const dpad = [
    ["up", -1, 0, ArrowUp, "Move up"],
    ["left", 0, -1, ArrowLeft, "Move left"],
    ["down", 1, 0, ArrowDown, "Move down"],
    ["right", 0, 1, ArrowRight, "Move right"],
  ];

  return (
    <div className="hidden-maze">
      <div className="hidden-maze__world" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 11, 14.5], fov: 43, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        >
          <MazeWorld
            key={runKey}
            player={player}
            phase={phase}
            collected={collected}
            hintPath={hintPath}
            overview={overview}
          />
        </Canvas>
      </div>

      <div className="hidden-maze__vignette" />
      <div className="hidden-maze__grain" />
      {opened && <div className="hidden-maze__flash" />}

      <header className="hidden-maze__topbar">
        <div className="hidden-maze__brand">
          <span>Ancestra</span>
          <i />
          <span>Chapter XI</span>
        </div>
        <button className="hidden-maze__exit" type="button" onClick={closeGame} aria-label="Exit game">
          <X size={18} />
        </button>
      </header>

      <div className={`hidden-maze__hud ${opened ? "hidden-maze__hud--hidden" : ""}`}>
        <div className={`hidden-maze__heading ${phase === "playing" ? "hidden-maze__heading--compact" : ""}`}>
          <span className="hidden-maze__eyebrow">
            <SparkleIcon size={13} />
            The Hidden Passage
          </span>
          <h1>Find the Way Beyond</h1>
          <p>Three sigils are sleeping in the crystal cave. Awaken them all to break the seal on the cave mouth.</p>
        </div>

        {phase === "playing" && (
          <>
            <div className="hidden-maze__status">
              <div className="hidden-maze__sigils" aria-label={`${collected.length} of ${SIGILS.length} sigils found`}>
                {SIGILS.map((s) => (
                  <Gem key={s.id} size={19} className={collected.includes(s.id) ? "is-lit" : ""} />
                ))}
                <span>{collected.length}/{SIGILS.length}</span>
              </div>
              <i />
              <div className="hidden-maze__status-item">
                <Footprints size={16} />
                <strong>{moves}</strong>
                <span>steps</span>
              </div>
              <i />
              <div className="hidden-maze__status-item">
                {unlocked ? <Unlock size={16} /> : <Lock size={16} />}
                <span>{unlocked ? "Seal broken" : "Cave sealed"}</span>
              </div>
            </div>

            {notice && (
              <div key={notice.key} className={`hidden-maze__notice hidden-maze__notice--${notice.tone}`}>
                {notice.text}
              </div>
            )}
          </>
        )}
      </div>

      {phase === "intro" && (
        <div className="hidden-maze__overlay">
          <div className="hidden-maze__panel">
            <div className="hidden-maze__panel-symbol">
              <Compass size={27} strokeWidth={1.2} />
            </div>
            <span className="hidden-maze__panel-kicker">A crystal cave awaits</span>
            <h2>The way forward is not yet revealed.</h2>
            <p>
              Wander the glowing tunnels and awaken three sigils. Only then will the seal on the
              great cave mouth break and let the light through.
            </p>

            <div className="hidden-maze__instructions">
              <span>Move with</span>
              <div>
                <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
                <em>or the arrow keys. On touch, swipe or use the pad.</em>
              </div>
            </div>

            <button type="button" className="hidden-maze__primary" onClick={begin}>
              Enter the cave
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}

      {phase === "playing" && (
        <>
          <div className="hidden-maze__controls">
            {dpad.map(([name, dr, dc, Icon, label]) => (
              <button
                key={name}
                type="button"
                className={`hidden-maze__direction hidden-maze__direction--${name}`}
                onClick={() => movePlayer(dr, dc)}
                aria-label={label}
              >
                <Icon />
              </button>
            ))}
          </div>

          <div className="hidden-maze__tools">
            <div className="hidden-maze__minimap" aria-hidden="true" style={{ "--cols": COLS }}>
              {MAZE.map((line, r) =>
                [...line].map((cell, c) => {
                  const here = player.row === r && player.col === c;
                  const sigil = SIGILS.find((s) => s.row === r && s.col === c && !collected.includes(s.id));
                  let cls = "";
                  if (here) cls = "is-player";
                  else if (r === EXIT.row && c === EXIT.col) cls = unlocked ? "is-exit-open" : "is-exit";
                  else if (sigil && nearSeen(r, c)) cls = "is-sigil";
                  else if (cell === "#" && nearSeen(r, c)) cls = "is-wall";
                  else if (cell !== "#" && seenSet.has(`${r},${c}`)) cls = "is-floor";
                  return <span key={`${r}-${c}`} className={cls} />;
                })
              )}
            </div>
            <div className="hidden-maze__toolrow">
              <button type="button" className="hidden-maze__hintbtn" onClick={() => setOverview((v) => !v)}>
                {overview ? <Crosshair size={16} /> : <MapIcon size={16} />}
                <span>{overview ? "Follow" : "Map view"}</span>
              </button>
              <button
                type="button"
                className="hidden-maze__hintbtn"
                onClick={showHint}
                disabled={hintsLeft <= 0 || hintPath.length > 0}
              >
                <Lightbulb size={16} />
                <span>Show the way</span>
                <b>{hintsLeft}</b>
              </button>
            </div>
          </div>
        </>
      )}

      {phase === "reveal" && (
        <div className="hidden-maze__overlay hidden-maze__overlay--reveal">
          <div className="hidden-maze__reveal-panel">
            <div className="hidden-maze__reveal-light">
              <SparkleIcon size={30} />
            </div>
            <span className="hidden-maze__panel-kicker">The seal is broken</span>
            <h2>Passage Open</h2>
            <p>Light pours through the mountain. Beyond the ancient cave, a new journey awaits.</p>

            <div className="hidden-maze__stars" aria-label={`${stars} of 3 stars`}>
              {[1, 2, 3].map((n) => (
                <Star key={n} size={24} className={n <= stars ? "is-lit" : ""} />
              ))}
            </div>

            <div className="hidden-maze__reveal-stats">
              <div><strong>{moves}</strong><span>steps</span></div>
              <div><strong>{SIGILS.length}/{SIGILS.length}</strong><span>sigils</span></div>
              <div><strong>{formatTime(elapsed)}</strong><span>time</span></div>
            </div>

            <button type="button" className="hidden-maze__primary" onClick={closeGame}>
              Continue the chronicle
              <ArrowRight size={17} />
            </button>
            <button type="button" className="hidden-maze__restart" onClick={restart}>
              <RotateCcw size={14} />
              Explore again
            </button>
          </div>
        </div>
      )}

      <div className="hidden-maze__bottom-note">
        <span>The search for Sita</span>
        <i />
        <span>The way beyond the mountain</span>
      </div>
    </div>
  );
}