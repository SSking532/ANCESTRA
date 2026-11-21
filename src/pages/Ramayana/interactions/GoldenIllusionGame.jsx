import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import "./GoldenIllusionGame.css";

const UP = new THREE.Vector3(0, 1, 0);
const AIM_U = 0.945;
const GLIMPSES = [[0.14, 0.23], [0.36, 0.45], [0.58, 0.67], [0.79, 0.88]];
const PATH = [
  [0, 0, 10], [0, 0, -20], [9, 0, -45], [24, 0, -62], [30, 0, -90], [16, 0, -115],
  [-4, 0, -128], [-18, 0, -150], [-14, 0, -178], [0, 0, -200], [0, 0, -232],
].map((p) => new THREE.Vector3(...p));

function seededRandom(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useGameSound(enabled) {
  const ctx = useRef(null);
  return useCallback((kind) => {
    if (!enabled) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const audio = ctx.current || (ctx.current = new AC());
    if (audio.state === "suspended") audio.resume();
    const presets = {
      bell: [660, 990, 0.5, "sine", 0.08], reveal: [180, 720, 1.2, "sine", 0.12],
      draw: [120, 220, 0.5, "sawtooth", 0.03], shoot: [900, 90, 0.35, "triangle", 0.12],
      thud: [140, 40, 0.3, "square", 0.1], chime: [520, 1040, 1, "sine", 0.08],
    };
    const [s, e, d, type, v] = presets[kind] || presets.bell;
    const now = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(s, now);
    o.frequency.exponentialRampToValueAtTime(e, now + d);
    g.gain.setValueAtTime(v, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    o.connect(g); g.connect(audio.destination);
    o.start(now); o.stop(now + d + 0.05);
  }, [enabled]);
}

/* ---------- WORLD ---------- */

function Road({ curve }) {
  const [road, verge] = useMemo(() => {
    const build = (w, y) => {
      const pos = [], idx = [], N = 220;
      for (let i = 0; i <= N; i++) {
        const u = i / N, p = curve.getPointAt(u), t = curve.getTangentAt(u);
        const r = new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(w);
        pos.push(p.x - r.x, y, p.z - r.z, p.x + r.x, y, p.z + r.z);
        if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
    return [build(3.6, 0), build(7.5, -0.03)];
  }, [curve]);
  return (
    <>
      <mesh geometry={verge}><meshStandardMaterial color="#2c4a2b" roughness={1} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={road}><meshStandardMaterial color="#8b6b3e" roughness={1} side={THREE.DoubleSide} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, -0.1, -110]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#1b2f1f" roughness={1} />
      </mesh>
    </>
  );
}

function Trees({ curve }) {
  const trunk = useRef(), crown = useRef(), crown2 = useRef();
  const COUNT = 340;
  useLayoutEffect(() => {
    const rnd = seededRandom(11), d = new THREE.Object3D(), col = new THREE.Color();
    const tones = ["#244b32", "#315a38", "#3b633d", "#4a6e3a"];
    for (let i = 0; i < COUNT; i++) {
      const u = rnd(), p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const off = (rnd() > 0.5 ? 1 : -1) * (6 + rnd() * 24), sc = 0.8 + rnd() * 1.3;
      const x = p.x - t.z * off, z = p.z + t.x * off;
      d.rotation.set(0, rnd() * 6, 0);
      d.position.set(x, 2.2 * sc, z); d.scale.setScalar(sc); d.updateMatrix();
      trunk.current.setMatrixAt(i, d.matrix);
      d.position.set(x, 4.7 * sc, z); d.scale.set(sc * 1.15, sc, sc * 1.15); d.updateMatrix();
      crown.current.setMatrixAt(i, d.matrix);
      crown.current.setColorAt(i, col.set(tones[i % 4]));
      d.position.set(x + 0.7 * sc, 5.5 * sc, z); d.scale.setScalar(sc * 0.75); d.updateMatrix();
      crown2.current.setMatrixAt(i, d.matrix);
      crown2.current.setColorAt(i, col.set(tones[(i + 1) % 4]));
    }
    [trunk, crown, crown2].forEach((r) => {
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
  }, [curve]);
  return (
    <>
      <instancedMesh ref={trunk} args={[null, null, COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[0.16, 0.34, 4.4, 7]} />
        <meshStandardMaterial color="#59402b" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crown} args={[null, null, COUNT]} frustumCulled={false}>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshStandardMaterial roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh ref={crown2} args={[null, null, COUNT]} frustumCulled={false}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial roughness={1} flatShading />
      </instancedMesh>
    </>
  );
}

function Prints({ curve }) {
  const prints = useMemo(() => Array.from({ length: 120 }, (_, i) => {
    const u = 0.015 + i * 0.0082, p = curve.getPointAt(Math.min(u, 1)), t = curve.getTangentAt(Math.min(u, 1));
    const s = i % 2 ? 1 : -1;
    return { x: p.x - t.z * 0.3 * s, z: p.z + t.x * 0.3 * s, r: Math.atan2(t.x, t.z) };
  }), [curve]);
  return prints.map((p, i) => (
    <mesh key={i} position={[p.x, 0.02, p.z]} rotation={[-Math.PI / 2, 0, -p.r]} scale={[0.14, 0.2, 1]}>
      <circleGeometry args={[1, 10]} />
      <meshBasicMaterial color="#f6c85e" transparent opacity={0.65} depthWrite={false} />
    </mesh>
  ));
}

function Deer({ deerRef, legs }) {
  const gold = "#c99432", light = "#f5d78b";
  const mat = (c, m = 0.55) => <meshStandardMaterial color={c} metalness={m} roughness={0.3} emissive="#9b661d" emissiveIntensity={0.45} />;
  const antler = useMemo(() => [-1, 1].map((s) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(s * 0.08, 0, 0), new THREE.Vector3(s * 0.32, 0.32, 0),
    new THREE.Vector3(s * 0.36, 0.62, 0), new THREE.Vector3(s * 0.6, 0.86, 0)]), 20, 0.035, 6)), []);
  return (
    <group ref={deerRef} scale={0.001}>
      <mesh position={[0, 1.35, 0]} scale={[0.48, 0.56, 0.92]}><sphereGeometry args={[1, 20, 16]} />{mat(gold, 0.62)}</mesh>
      <mesh position={[0, 1.65, 0.56]} rotation={[-0.38, 0, 0]} scale={[0.3, 0.62, 0.3]}><cylinderGeometry args={[0.42, 0.58, 1, 14]} />{mat(light)}</mesh>
      <mesh position={[0, 2.24, 0.82]} scale={[0.28, 0.32, 0.38]}><sphereGeometry args={[1, 16, 12]} />{mat("#e5b954")}</mesh>
      <mesh position={[0, 2.12, 1.12]} scale={[0.2, 0.13, 0.22]}><sphereGeometry args={[1, 12, 10]} />{mat("#f3d68d", 0.3)}</mesh>
      <group position={[0, 2.5, 0.78]}>{antler.map((g, i) => <mesh key={i} geometry={g}>{mat(light)}</mesh>)}</group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.28, 2.36, 0.75]} rotation={[0, 0, -s * 0.45]} scale={[0.1, 0.25, 0.07]}>
          <sphereGeometry args={[1, 10, 8]} />{mat(light)}
        </mesh>
      ))}
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, fz], i) => (
        <group key={i} ref={(el) => (legs.current[i] = el)} position={[sx * 0.27, 1.0, fz * 0.55]}>
          <mesh position={[0, -0.45, 0]}><cylinderGeometry args={[0.065, 0.04, 0.9, 8]} />{mat("#a87529", 0.3)}</mesh>
        </group>
      ))}
      <mesh position={[0, 1.5, -0.9]} rotation={[-2.2, 0, 0]}><coneGeometry args={[0.12, 0.35, 8]} />{mat(light)}</mesh>
      <pointLight color="#ffcf70" intensity={5} distance={14} position={[0, 1.8, 0]} />
      <Sparkles count={40} scale={[2.6, 3.4, 3]} position={[0, 1.5, 0]} size={3} speed={0.5} color="#ffe7a2" />
    </group>
  );
}

function Bow({ bowRef, stringRef, arrowRef }) {
  return (
    <group ref={bowRef} visible={false}>
      <group rotation={[0, Math.PI / 2, 0]}>
        <group rotation={[0, 0, -Math.PI / 2]}>
          <mesh><torusGeometry args={[0.45, 0.016, 8, 32, Math.PI]} /><meshStandardMaterial color="#6b4423" roughness={0.6} /></mesh>
        </group>
        <line ref={stringRef}><bufferGeometry /><lineBasicMaterial color="#f5e6b8" /></line>
      </group>
      <group ref={arrowRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.008, 0.008, 0.9, 6]} /><meshStandardMaterial color="#d9c08a" /></mesh>
        <mesh position={[0, 0, -0.47]} rotation={[-Math.PI / 2, 0, 0]}><coneGeometry args={[0.02, 0.07, 6]} /><meshStandardMaterial color="#fff0b5" emissive="#ffcf70" emissiveIntensity={1} /></mesh>
      </group>
    </group>
  );
}

/* ---------- GAME LOGIC ---------- */

function Scene({ go, paused, sfx, hud, onPhase, onMsg }) {
  const { camera, pointer } = useThree();
  const curve = useMemo(() => new THREE.CatmullRomCurve3(PATH, false, "catmullrom", 0.5), []);
  const L = useMemo(() => curve.getLength(), [curve]);
  const deerRef = useRef(), legs = useRef([]), bowRef = useRef(), stringRef = useRef(), arrowRef = useRef(), flight = useRef();
  const S = useRef({
    phase: go ? "run" : "idle", u: 0.004, lat: 0, v: 0, yaw: 0, look: new THREE.Vector3(0, 0, -1),
    keys: {}, mouse: false, draw: 0, drawing: false, aim: new THREE.Vector3(), arrow: null, hitT: 0, ds: 0, t: 0,
  });
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const s = S.current;
    const kd = (e) => {
      s.keys[e.code] = true;
      if (e.code === "Space" && s.phase === "aim" && !s.drawing && !pausedRef.current) { s.drawing = true; sfx("draw"); }
    };
    const ku = (e) => {
      s.keys[e.code] = false;
      if (e.code === "Space") release();
    };
    const pd = (e) => {
      if (e.target.closest("button")) return;
      s.mouse = true;
      if (s.phase === "aim" && !s.drawing && !pausedRef.current) { s.drawing = true; sfx("draw"); }
    };
    const pu = () => { s.mouse = false; release(); };
    const release = () => {
      if (s.phase !== "aim" || !s.drawing) return;
      s.drawing = false;
      const draw = s.draw, p = camera.position.clone(), dir = s.aim.clone();
      const c = deerRef.current.position.clone().add(new THREE.Vector3(0, 1.6, 0));
      const v = c.clone().sub(p), t = v.dot(dir), d = v.sub(dir.clone().multiplyScalar(t)).length();
      const hit = draw > 0.55 && t > 0 && d < 1.1;
      if (draw < 0.55) onMsg("Draw the bow fully");
      const to = hit ? c : p.clone().add(dir.multiplyScalar(t > 0 ? t : 30)).add(new THREE.Vector3(0, -(1 - Math.min(draw / 0.55, 1)) * 4, 0));
      const from = new THREE.Vector3(); bowRef.current.getWorldPosition(from);
      s.arrow = { from, to, t: 0, hit };
      s.phase = "fly"; s.draw = 0; sfx("shoot");
    };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    window.addEventListener("pointerdown", pd); window.addEventListener("pointerup", pu);
    return () => {
      window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku);
      window.removeEventListener("pointerdown", pd); window.removeEventListener("pointerup", pu);
    };
  }, [camera, sfx, onMsg]);

  useFrame((_, rawDt) => {
    const s = S.current, dt = Math.min(rawDt, 0.05);
    if (pausedRef.current) return;
    s.t += dt;
    const K = s.keys, steer = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0);
    const fwd = K.KeyW || K.ArrowUp || s.mouse;
    const deer = deerRef.current;
    let deerScale = 0;

    if (s.phase === "run") {
      s.v = THREE.MathUtils.damp(s.v, fwd ? 7.5 : 0, 4, dt);
      s.u = Math.min(s.u + (s.v * dt) / L, AIM_U);
      s.lat = THREE.MathUtils.clamp(s.lat + steer * 3.2 * dt, -3.1, 3.1);
      s.yaw = THREE.MathUtils.damp(s.yaw, -steer * 0.3, 4, dt);
      if (s.u >= AIM_U) { s.phase = "aim"; onPhase("aim"); sfx("reveal"); s.aim.set(0, 0, -1); }
      GLIMPSES.forEach(([a, b], gi) => {
        if (s.u > a && s.u < b) {
          const w = (s.u - a) / (b - a);
          deerScale = Math.sin(Math.min(w * 1.3, 1) * Math.PI * 0.5) * (1 - Math.max(0, w - 0.75) * 4);
          s.glimpse = { gi, w };
        }
      });
    }
    if (s.phase !== "idle") hud.current?.style.setProperty("--prog", Math.min(s.u / AIM_U, 1));

    const t = curve.getTangentAt(s.u), right = new THREE.Vector3(-t.z, 0, t.x);
    const base = curve.getPointAt(s.u).addScaledVector(right, s.lat);
    const idleTarget = s.phase === "idle";

    if (s.phase === "run" || idleTarget) {
      const bob = Math.sin(s.t * 9) * 0.035 * Math.min(s.v / 7, 1);
      camera.position.set(base.x, 1.7 + bob + (idleTarget ? Math.sin(s.t * 0.6) * 0.05 : 0), base.z);
      const want = t.clone().applyAxisAngle(UP, s.yaw);
      s.look.lerp(want, 1 - Math.exp(-3 * dt)).normalize();
      camera.lookAt(camera.position.clone().addScaledVector(s.look, 10).setY(1.6));
      camera.fov = THREE.MathUtils.damp(camera.fov, 61 + s.v * 0.4, 3, dt); camera.updateProjectionMatrix();
    }

    // deer
    if (s.phase === "run" && deerScale > 0.01 && s.glimpse) {
      const lead = (20 + s.glimpse.w * 26) / L, du = Math.min(s.u + lead, 1);
      const dp = curve.getPointAt(du), dt2 = curve.getTangentAt(du);
      deer.position.set(dp.x, 0.05 + Math.abs(Math.sin(s.t * 8)) * 0.35, dp.z);
      deer.rotation.y = Math.atan2(dt2.x, dt2.z);
      legs.current.forEach((l, i) => l && (l.rotation.x = Math.sin(s.t * 12 + (i % 2) * Math.PI + (i > 1 ? 0.8 : 0)) * 0.7));
    }
    if (s.phase === "aim" || s.phase === "fly") {
      const dp = curve.getPointAt(1), dt2 = curve.getTangentAt(1);
      deer.position.set(dp.x, 0.05 + Math.sin(s.t * 2) * 0.03, dp.z);
      deer.rotation.y = Math.atan2(-dt2.x, -dt2.z) + Math.sin(s.t * 0.7) * 0.15;
      legs.current.forEach((l) => l && (l.rotation.x = 0));
      deerScale = 1.15;
    }
    if (s.phase === "hit") {
      s.hitT += dt;
      deerScale = 1.15 * Math.max(0, 1 - Math.max(0, s.hitT - 0.5) / 1.8);
      deer.rotation.z = Math.sin(s.hitT * 30) * 0.05 * Math.max(0, 1 - s.hitT);
      if (s.hitT > 2.6 && !s.done) { s.done = true; onPhase("ending"); }
    }
    s.ds = THREE.MathUtils.damp(s.ds, deerScale, 6, dt);
    deer.scale.setScalar(Math.max(0.001, s.ds));

    // aiming
    const aiming = s.phase === "aim" || s.phase === "fly" || s.phase === "hit";
    if (aiming) {
      const pos = curve.getPointAt(AIM_U); pos.y = 1.65;
      camera.position.lerp(pos, 1 - Math.exp(-4 * dt));
      const c = deer.position.clone().add(new THREE.Vector3(0, 1.6, 0));
      if (s.phase === "aim") {
        s.draw = THREE.MathUtils.clamp(s.draw + (s.drawing ? dt / 1.1 : -dt * 3), 0, 1);
        const sway = (1 - s.draw * 0.75) * 0.012;
        const dir = c.clone().sub(camera.position).normalize();
        dir.applyAxisAngle(UP, -pointer.x * 0.5 + Math.sin(s.t * 1.3) * sway);
        const r = new THREE.Vector3().crossVectors(dir, UP).normalize();
        dir.applyAxisAngle(r, pointer.y * 0.3 + Math.cos(s.t * 1.7) * sway);
        s.aim.lerp(dir, 1 - Math.exp(-14 * dt)).normalize();
      }
      camera.lookAt(camera.position.clone().add(s.aim));
      camera.fov = THREE.MathUtils.damp(camera.fov, 60 - s.draw * 16, 6, dt); camera.updateProjectionMatrix();
      hud.current?.style.setProperty("--draw", s.draw);
    }

    // bow
    const bow = bowRef.current;
    bow.visible = s.phase === "aim";
    if (bow.visible) {
      bow.position.copy(camera.position).add(new THREE.Vector3(0.1, -0.2, -0.7).applyQuaternion(camera.quaternion));
      bow.quaternion.copy(camera.quaternion);
      arrowRef.current.position.z = 0.35 * s.draw - 0.05;
      const g = stringRef.current.geometry;
      g.setFromPoints([new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 0, 0.35 * s.draw), new THREE.Vector3(0, -0.45, 0)]);
    }

    // arrow in flight
    const fl = flight.current;
    fl.visible = s.phase === "fly";
    if (s.phase === "fly" && s.arrow) {
      const a = s.arrow; a.t = Math.min(a.t + dt / 0.35, 1);
      fl.position.lerpVectors(a.from, a.to, a.t);
      fl.quaternion.setFromUnitVectors(UP, a.to.clone().sub(a.from).normalize());
      if (a.t >= 1) {
        if (a.hit) { s.phase = "hit"; s.hitT = 0; onPhase("hit"); sfx("thud"); setTimeout(() => sfx("chime"), 400); }
        else { s.phase = "aim"; onMsg("It slipped past — aim true"); }
      }
    }
  });

  return (
    <>
      <color attach="background" args={["#1a2a2b"]} />
      <fog attach="fog" args={["#2a3c36", 12, 80]} />
      <hemisphereLight args={["#e8d9a8", "#17251b", 1.25]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[-14, 24, -30]} color="#ffd9a0" intensity={2.2} />
      <Road curve={curve} />
      <Trees curve={curve} />
      <Prints curve={curve} />
      <Deer deerRef={deerRef} legs={legs} />
      <Bow bowRef={bowRef} stringRef={stringRef} arrowRef={arrowRef} />
      <group ref={flight} visible={false}>
        <mesh><cylinderGeometry args={[0.025, 0.025, 1.1, 6]} /><meshBasicMaterial color="#fff0b5" toneMapped={false} /></mesh>
        <pointLight color="#ffd27a" intensity={3} distance={6} />
      </group>
      <Sparkles count={160} scale={[90, 6, 240]} position={[8, 3, -110]} size={2} speed={0.15} opacity={0.5} color="#e4c98a" />
    </>
  );
}

/* ---------- UI ---------- */

export default function GoldenIllusionGame({ onClose }) {
  const [screen, setScreen] = useState("intro");
  const [runId, setRunId] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(true);
  const [msg, setMsg] = useState("");
  const hud = useRef(null);
  const sfx = useGameSound(sound);

  const flash = useCallback((m) => setMsg(m), []);
  useEffect(() => {
    if (!msg) return undefined;
    const id = setTimeout(() => setMsg(""), 2200);
    return () => clearTimeout(id);
  }, [msg]);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && ["run", "aim"].includes(screen) && setPaused((v) => !v);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [screen]);

  const start = () => {
    setRunId((n) => n + 1); setPaused(false); setScreen("run"); setMsg("");
    sfx("bell");
  };
  const onPhase = useCallback((p) => {
    setScreen(p);
    if (p === "aim") setMsg("Hold to draw · release to loose");
  }, []);

  const playing = ["run", "aim", "fly", "hit"].includes(screen);

  return (
    <div className="golden-game" ref={hud}>
      <div className="golden-game__world">
        <Canvas camera={{ position: [0, 1.7, 10], fov: 61, near: 0.1, far: 200 }} dpr={[1, 1.6]} gl={{ antialias: true }}>
          <Scene key={runId} go={runId > 0} paused={paused || screen === "ending"} sfx={sfx} hud={hud} onPhase={onPhase} onMsg={flash} />
        </Canvas>
      </div>
      <div className="golden-game__vignette" />
      <div className="golden-game__grain" />

      <header className="golden-game__top">
        <span className="golden-game__brand">ANCESTRA</span>
        <div className="golden-game__actions">
          <button type="button" onClick={() => setSound((v) => !v)} aria-label="Toggle sound">{sound ? <Volume2 /> : <VolumeX />}</button>
          {playing && <button type="button" onClick={() => setPaused((v) => !v)} aria-label="Pause">{paused ? <Play /> : <Pause />}</button>}
        </div>
      </header>

      {screen === "run" && (
        <div className="golden-game__progress"><i /></div>
      )}

      {(screen === "aim" || screen === "fly") && (
        <div className="golden-game__reticle"><b /><span /></div>
      )}

      <AnimatePresence mode="wait">
        {msg && playing && (
          <motion.div key={msg} className="golden-game__message" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{msg}</motion.div>
        )}
      </AnimatePresence>

      {screen === "run" && !paused && (
        <div className="golden-game__hint"><kbd>W</kbd> run <kbd>A</kbd><kbd>D</kbd> steer</div>
      )}
      {screen === "aim" && !paused && (
        <div className="golden-game__hint">Move to aim · hold <kbd>click</kbd> to draw</div>
      )}

      {paused && (
        <div className="golden-game__pause">
          <button type="button" className="golden-game__primary" onClick={() => setPaused(false)}><Play size={15} /> Continue</button>
          <button type="button" className="golden-game__replay" onClick={() => onClose?.()}>Leave</button>
        </div>
      )}

      <main className="golden-game__stage">
        <AnimatePresence mode="wait">
          {screen === "intro" && (
            <motion.section key="intro" className="golden-game__card" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.8 }}>
              <div className="golden-game__eyebrow">THE DECEPTION OF MARICHA</div>
              <h1>The Golden <em>Illusion</em></h1>
              <div className="golden-game__rule"><i />✦<i /></div>
              <p>A golden deer glimmers between the trees. Sita longs for it, and Rama follows its trail.</p>
              <button type="button" className="golden-game__primary" onClick={start}>Follow the trail <ArrowRight size={16} /></button>
            </motion.section>
          )}
          {screen === "ending" && (
            <motion.section key="ending" className="golden-game__card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
              <div className="golden-game__eyebrow">THE ILLUSION IS BROKEN</div>
              <h1>Maricha's <em>Deception</em></h1>
              <div className="golden-game__rule"><i />✦<i /></div>
              <p>The golden form fades and Maricha is revealed. A cry echoes through the trees, meant to draw Lakshmana away.</p>
              <button type="button" className="golden-game__primary" onClick={() => onClose?.()}>Return to the story <ArrowRight size={16} /></button>
              <button type="button" className="golden-game__replay" onClick={() => { setScreen("intro"); setRunId(0); }}><RotateCcw size={13} /> Play again</button>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}