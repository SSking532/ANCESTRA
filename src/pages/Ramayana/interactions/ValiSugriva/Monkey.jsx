import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fighterState, ramaState, ARROW_HIT_T } from "./fight.js";
import { fighterTime } from "./gameState.js";
import { IDX, clamp } from "./anim.js";

const PIVOT = 1.4;
const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

// Soft, layered fur: colour patches + thousands of fine directional strands (also used as the bump map).
function furTexture(base, dark, light, seed = 7) {
  const S = 512, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, S, S); const r = rng(seed);
  for (let i = 0; i < 70; i++) { // large soft colour patches (tonal variation)
    const x = r() * S, y = r() * S, rad = 30 + r() * 80, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const col = r() > 0.5 ? dark : light; gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = 0.1 + r() * 0.1; g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.lineCap = "round";
  for (let i = 0; i < 9000; i++) {
    const x = r() * S, y = r() * S, l = 7 + r() * 17; g.strokeStyle = r() > 0.5 ? dark : light;
    g.globalAlpha = 0.12 + r() * 0.26; g.lineWidth = 0.5 + r() * 0.9;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 4, y + l * 0.5, x + (r() - 0.5) * 5, y + l); g.stroke();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
let _shadowTex = null;
function shadowTexture() {
  if (_shadowTex) return _shadowTex;
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(0,0,0,0.85)"); gr.addColorStop(0.55, "rgba(0,0,0,0.4)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); _shadowTex = new THREE.CanvasTexture(c); return _shadowTex;
}
// warm fresnel rim so the silhouettes glow against the sun-lit forest
const rim = (m, k = 0.22) => {
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace("#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n float rimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 2.6);\n totalEmissiveRadiance += vec3(1.0, 0.78, 0.45) * rimF * " + k.toFixed(2) + ";");
  };
  m.customProgramCacheKey = () => "vanara-rim-" + k;
  return m;
};

// A smooth tapered limb segment: rounded joint on top, optional muscle swell (no spikes anywhere).
function Limb({ len, r0, r1, mat, bulge = 0, bulgeAt = 0.35, bulgeZ = 0.25 }) {
  return (
    <group>
      <mesh position={[0, -len / 2, 0]} castShadow receiveShadow material={mat}><cylinderGeometry args={[r0, r1, len, 18, 1]} /></mesh>
      <mesh material={mat} castShadow><sphereGeometry args={[r0, 18, 14]} /></mesh>
      {bulge > 0 && <mesh position={[0, -len * bulgeAt, r0 * bulgeZ]} scale={[1, 1.35, 1.05]} material={mat} castShadow><sphereGeometry args={[r0 * (1 + bulge), 18, 14]} /></mesh>}
    </group>
  );
}

// Flowing mane: flattened rounded locks (capsules) that lag behind head / body motion.
function useLocks(count, rows, len, spread, seed) {
  return useMemo(() => {
    const r = rng(seed), out = [];
    for (let i = 0; i < count; i++) {
      const row = i % rows, a = THREE.MathUtils.lerp(-spread, spread, ((i / rows) | 0) / Math.max(1, Math.ceil(count / rows) - 1)) + (r() - 0.5) * 0.18;
      out.push({ a, row, rad: 0.27 + row * 0.055 + r() * 0.03, y: 0.12 - row * 0.1 + r() * 0.06, phi: 0.3 + row * 0.2 + r() * 0.15, len: len * (0.8 - row * 0.05 + r() * 0.4), w: 0.065 + r() * 0.02, ph: r() * 6.28 });
    }
    return out;
  }, [count, rows, len, spread, seed]);
}

const CREAM_DS = new THREE.MeshStandardMaterial({ color: "#f3e6c8", roughness: 0.8, side: THREE.DoubleSide });
const CREAM = new THREE.MeshStandardMaterial({ color: "#f3e6c8", roughness: 0.8 });
function FighterImpl({ who, clock, cfg, rigOut }) {
  const isRama = who === "R";
  const g = useRef(), tumble = useRef(), pelvis = useRef(), spine = useRef(), head = useRef(), jaw = useRef(), tailRefs = useRef([]);
  const aArm = useRef(), bArm = useRef(), aFore = useRef(), bFore = useRef(), aLeg = useRef(), bLeg = useRef(), aShin = useRef(), bShin = useRef();
  const aHand = useRef(), bHand = useRef(), stuck = useRef(), shadow = useRef(), maneG = useRef(), maneRefs = useRef([]);
  const lastRoot = useRef(0), inertia = useRef(0);
  const bulk = cfg.bulk || 1;
  const aK = cfg.armK || 1;
  const locks = useLocks(isRama ? 0 : (cfg.crown ? 36 : 24), 3, cfg.crown ? 0.78 : 0.6, 2.55, who === "V" ? 5 : 9);
  const mats = useMemo(() => {
    const tex = isRama ? null : furTexture(cfg.fur, cfg.furDark, cfg.furLight, 7);
    const bellyCol = new THREE.Color(cfg.fur).lerp(new THREE.Color("#fff0cf"), 0.5).getStyle();
    const btex = isRama ? null : furTexture(bellyCol, cfg.furLight, "#fff6e2", 13);
    const furM = isRama
      ? new THREE.MeshStandardMaterial({ color: cfg.skin, roughness: 0.42, emissive: "#0a1c30", emissiveIntensity: 0.35 })
      : rim(new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: tex, bumpMap: tex, bumpScale: 1.1, roughness: 0.88, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(cfg.furLight) }));
    const belly = isRama ? furM : rim(new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: btex, bumpMap: btex, bumpScale: 0.9, roughness: 0.85, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color("#fff1d0") }), 0.16);
    const skin = isRama
      ? new THREE.MeshStandardMaterial({ color: cfg.skin, roughness: 0.45, emissive: "#0a1c30", emissiveIntensity: 0.35 })
      : rim(new THREE.MeshPhysicalMaterial({ color: cfg.skin, roughness: 0.55, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffd2a8") }), 0.12);
    const gold = new THREE.MeshStandardMaterial({ color: "#e0b04a", metalness: 0.9, roughness: 0.24, emissive: "#3a2400", emissiveIntensity: 0.4, side: THREE.DoubleSide });
    const cloth = new THREE.MeshStandardMaterial({ color: cfg.cloth, roughness: 0.82, side: THREE.DoubleSide });
    const dark = new THREE.MeshStandardMaterial({ color: "#1c120c", roughness: 0.5 });
    const hair = new THREE.MeshStandardMaterial({ color: "#17110d", roughness: 0.55 });
    const white = new THREE.MeshStandardMaterial({ color: "#f4ece0", roughness: 0.3 });
    const mane = new THREE.MeshPhysicalMaterial({ color: cfg.mane, roughness: 0.72, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color(cfg.furLight) });
    const furDark = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.furDark).multiplyScalar(0.8), roughness: 0.9 });
    const iris = new THREE.MeshStandardMaterial({ color: cfg.eye || "#b0651a", roughness: 0.15, emissive: cfg.eye || "#b0651a", emissiveIntensity: 0.25 });
    const gem = new THREE.MeshStandardMaterial({ color: "#c01830", emissive: "#6a0012", emissiveIntensity: 0.7, roughness: 0.12, metalness: 0.2 });
    const glint = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    const mouth = new THREE.MeshStandardMaterial({ color: "#5a1414", roughness: 0.4 });
    const nose = new THREE.MeshStandardMaterial({ color: "#3a2018", roughness: 0.35 });
    const earIn = new THREE.MeshStandardMaterial({ color: "#c98676", roughness: 0.6 });
    const shadowM = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.7, polygonOffset: true, polygonOffsetFactor: -2 });
    const cleanFur = new THREE.Color("#ffffff");
    return { furM, belly, skin, gold, cloth, dark, hair, white, mane, furDark, iris, gem, glint, mouth, nose, earIn, shadowM, cleanFur };
  }, [cfg, isRama]);
  const crownGeo = useMemo(() => {
    const pts = [[0.3, 0], [0.345, 0.03], [0.355, 0.13], [0.33, 0.22], [0.27, 0.32], [0.18, 0.42], [0.09, 0.5], [0.0, 0.54]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 32);
  }, []);
  const tailN = 11;

  useFrame((state, dt) => {
    if (!g.current) return;
    const t = clock.t;
    const st = isRama ? ramaState(t) : fighterState(who, fighterTime(t));
    const p = st.pose;
    g.current.position.set(st.pos[0], 0, st.pos[2]); g.current.rotation.y = st.yaw; g.current.scale.setScalar(st.scale);
    tumble.current.position.y = PIVOT + p[IDX.rootY]; tumble.current.rotation.set(p[IDX.pitch], 0, p[IDX.roll]);
    pelvis.current.rotation.y = p[IDX.pelvisY];
    spine.current.rotation.set(p[IDX.spineX], p[IDX.spineY], p[IDX.spineZ]);
    head.current.rotation.set(p[IDX.headX], p[IDX.headY], 0); if (jaw.current) jaw.current.rotation.x = p[IDX.jaw] * 0.6;
    aArm.current.rotation.set(-p[IDX.aShX], p[IDX.aShY], -p[IDX.aShZ]); bArm.current.rotation.set(-p[IDX.bShX], -p[IDX.bShY], p[IDX.bShZ]);
    aFore.current.rotation.x = -p[IDX.aElb]; bFore.current.rotation.x = -p[IDX.bElb];
    aLeg.current.rotation.set(-p[IDX.aHipX], 0, -p[IDX.aHipZ]); bLeg.current.rotation.set(-p[IDX.bHipX], 0, p[IDX.bHipZ]);
    aShin.current.rotation.x = p[IDX.aKnee]; bShin.current.rotation.x = p[IDX.bKnee];
    if (shadow.current) { // contact shadow stays on the ground, fades and widens as the body leaves it
      const lift = Math.max(0, p[IDX.rootY] + 0.25), lying = Math.abs(p[IDX.pitch]) > 0.6;
      const k = lying ? 1.5 : 1; shadow.current.scale.set(k * (1 + lift * 0.12), k * (lying ? 1.9 : 1), 1);
      shadow.current.material.opacity = 0.7 / (1 + lift * 1.1);
    }
    if (!isRama) {
      const fighting = t > 3.6 && t < 30 ? 1 : 0.45;
      for (let i = 0; i < tailN; i++) {
        const j = tailRefs.current[i]; if (!j) continue;
        const base = [-0.1, 0.1, 0.2, 0.26, 0.3, 0.3, 0.3, 0.26, 0.22, 0.2, 0.18][i];
        const f = (i / tailN + 0.25);
        j.rotation.x = base + Math.sin(t * 3.4 - i * 0.55) * 0.13 * f * fighting + (p[IDX.rootY] < -0.5 ? -0.1 : 0);
        j.rotation.y = Math.sin(t * 2.3 - i * 0.5 + (who === "V" ? 0 : 1)) * 0.17 * f * fighting + p[IDX.spineY] * 0.25 * (i / tailN);
      }
      // mane secondary motion: bounce / sway lagging the body
      const d = Math.min(dt || 0.016, 0.05);
      const vy = (p[IDX.rootY] - lastRoot.current) / Math.max(d, 0.001); lastRoot.current = p[IDX.rootY];
      inertia.current += (clamp(-vy * 0.12, -0.7, 0.7) - inertia.current) * Math.min(1, d * 9);
      for (let i = 0; i < locks.length; i++) {
        const m = maneRefs.current[i]; if (!m) continue; const L = locks[i];
        m.rotation.x = -L.phi + Math.sin(t * 2.2 + L.ph) * 0.05 + inertia.current * (0.45 + L.row * 0.2) - p[IDX.headX] * 0.25 + Math.abs(p[IDX.jaw]) * -0.15;
        m.rotation.z = Math.sin(t * 1.7 + L.ph) * 0.04 + p[IDX.spineY] * 0.1 * Math.sin(L.a);
      }
      // grime and sweat build up as the brothers wear each other down
      const dirt = clamp((t - 4) / 26) * 0.4;
      mats.furM.color.setRGB(1 - 0.26 * dirt, 1 - 0.33 * dirt, 1 - 0.42 * dirt);
      mats.belly.color.setRGB(1 - 0.22 * dirt, 1 - 0.29 * dirt, 1 - 0.38 * dirt);
    }
    if (stuck.current) stuck.current.scale.setScalar(t >= ARROW_HIT_T ? 1 : 0.0001);
    if (rigOut) { rigOut.root = g.current; rigOut.aHand = aHand.current; rigOut.bHand = bHand.current; rigOut.spine = spine.current; rigOut.head = head.current; rigOut.state = st; }
  });

  const { furM, belly, skin, gold, cloth, dark, hair, white, mane, furDark, iris, gem, glint, mouth, nose, earIn, shadowM } = mats;
  const shW = 0.62 * bulk;
  const arm = (side, ref, foreRef, handRef) => {
    const sg = side === "a" ? -1 : 1;
    return (
      <group key={side} ref={ref} position={[sg * shW, 1.0, 0]}>
        <mesh position={[0, 0.02, 0]} scale={[1, 0.92, 1]} material={furM} castShadow><sphereGeometry args={[0.27 * bulk, 20, 16]} /></mesh>
        <Limb len={0.66 * aK} r0={0.2 * bulk} r1={0.16 * bulk} mat={furM} bulge={0.28} bulgeAt={0.3} />
        {!isRama && <mesh position={[0, -0.2 * aK, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}><torusGeometry args={[0.215 * bulk, 0.04, 10, 28]} /></mesh>}
        {!isRama && <mesh position={[sg * 0.03, -0.2 * aK, 0.2 * bulk]} material={gem}><sphereGeometry args={[0.048, 12, 10]} /></mesh>}
        {isRama && <mesh position={[0, -0.22 * aK, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}><torusGeometry args={[0.2 * bulk, 0.035, 8, 20]} /></mesh>}
        <group ref={foreRef} position={[0, -0.66 * aK, 0]}>
          <Limb len={0.64 * aK} r0={0.16 * bulk} r1={0.105 * bulk} mat={furM} bulge={isRama ? 0 : 0.22} bulgeAt={0.22} />
          <mesh position={[0, -0.5 * aK, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}><torusGeometry args={[0.125 * bulk, 0.028, 10, 22]} /></mesh>
          {!isRama && <mesh position={[0, -0.57 * aK, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}><torusGeometry args={[0.118 * bulk, 0.018, 8, 20]} /></mesh>}
          <group ref={handRef} position={[0, -0.7 * aK, 0]}>
            {isRama ? (<>
              <mesh scale={[1, 1.05, 0.9]} material={skin} castShadow><sphereGeometry args={[0.15 * bulk, 14, 12]} /></mesh>
              {[-0.07, 0, 0.07].map((x, i) => (<mesh key={i} position={[x * bulk, -0.13, 0.04]} rotation={[0.5, 0, 0]} material={skin}><capsuleGeometry args={[0.032, 0.09, 3, 6]} /></mesh>))}
              <mesh position={[sg * -0.12 * bulk, -0.03, 0.06]} rotation={[0.3, 0, sg * 0.7]} material={skin}><capsuleGeometry args={[0.035, 0.08, 3, 6]} /></mesh>
            </>) : (<>
              {/* clenched fist: palm, four knuckle rows, wrapped thumb */}
              <mesh scale={[1.08, 1.0, 0.98]} material={skin} castShadow><sphereGeometry args={[0.15 * bulk, 18, 14]} /></mesh>
              {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (<group key={i}>
                <mesh position={[x * 0.062 * bulk, -0.125 * bulk, 0.03]} material={skin} castShadow><sphereGeometry args={[0.056 * bulk, 12, 10]} /></mesh>
                <mesh position={[x * 0.062 * bulk, -0.075 * bulk, 0.1 * bulk]} material={skin}><sphereGeometry args={[0.046 * bulk, 10, 8]} /></mesh>
              </group>))}
              <mesh position={[sg * -0.1 * bulk, -0.07 * bulk, 0.09 * bulk]} rotation={[0.25, 0, sg * 1.05]} material={skin}><capsuleGeometry args={[0.04 * bulk, 0.09, 4, 8]} /></mesh>
            </>)}
          </group>
        </group>
      </group>
    );
  };
  const leg = (side, ref, shinRef) => {
    const sg = side === "a" ? -1 : 1;
    return (
      <group key={side} ref={ref} position={[sg * 0.3 * bulk, 0, 0]}>
        <Limb len={0.72} r0={0.24 * bulk} r1={0.17 * bulk} mat={furM} bulge={0.2} bulgeAt={0.3} />
        <group ref={shinRef} position={[0, -0.72, 0]}>
          <Limb len={0.66} r0={0.17 * bulk} r1={0.105 * bulk} mat={furM} bulge={0.24} bulgeAt={0.22} bulgeZ={-0.1} />
          {!isRama && <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}><torusGeometry args={[0.115 * bulk, 0.022, 8, 20]} /></mesh>}
          <mesh position={[0, -0.7, 0.1]} scale={[1, 0.6, 1.5]} material={skin} castShadow><sphereGeometry args={[0.14 * bulk, 16, 12]} /></mesh>
          {!isRama && <mesh position={[0, -0.7, -0.02]} scale={[1, 0.9, 1]} material={skin}><sphereGeometry args={[0.1 * bulk, 12, 10]} /></mesh>}
          {[-0.065, 0, 0.065].map((x, i) => (<mesh key={i} position={[x * bulk, -0.73, 0.29]} scale={[1, 0.85, 1.2]} material={skin}><sphereGeometry args={[0.045 * bulk, 10, 8]} /></mesh>))}
        </group>
      </group>
    );
  };

  return (
    <group ref={g}>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={shadowM} renderOrder={2}><planeGeometry args={[3.4, 3.4]} /></mesh>
      <group ref={tumble} position={[0, PIVOT, 0]}>
        <group position={[0, -PIVOT, 0]}>
          <group ref={pelvis} position={[0, PIVOT, 0]}>
            {/* hips + cloth */}
            <mesh scale={[1.1 * bulk, 0.8, 0.9]} material={furM} castShadow><sphereGeometry args={[0.45, 22, 16]} /></mesh>
            <mesh position={[0, -0.18, 0]} material={cloth} castShadow><cylinderGeometry args={[0.5 * bulk, 0.64 * bulk, 0.55, 28, 1, true]} /></mesh>
            <mesh position={[0, -0.38, 0.4 * bulk]} rotation={[0.08, 0, 0]} material={cloth} castShadow><boxGeometry args={[0.36, 0.55, 0.03]} /></mesh>
            {!isRama && <mesh position={[0, -0.4, -0.38 * bulk]} rotation={[-0.08, 0, 0]} material={cloth}><boxGeometry args={[0.42, 0.6, 0.03]} /></mesh>}
            {!isRama && <mesh position={[0, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}><torusGeometry args={[0.635 * bulk, 0.02, 8, 36]} /></mesh>}
            <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}><torusGeometry args={[0.47 * bulk, 0.05, 10, 32]} /></mesh>
            {!isRama && <mesh position={[0, 0.08, 0.47 * bulk]} scale={[1, 1, 0.5]} material={gold}><sphereGeometry args={[0.09, 14, 10]} /></mesh>}
            {!isRama && <mesh position={[0, 0.08, 0.5 * bulk]} material={gem}><sphereGeometry args={[0.04, 10, 8]} /></mesh>}
            {isRama && (<group>
              <mesh position={[0, -0.62, 0]} material={cloth}><cylinderGeometry args={[0.46 * bulk, 0.74 * bulk, 1.15, 28, 4, true]} /></mesh>
              {[-0.3, 0, 0.3].map((x, i) => (<mesh key={"pl" + i} position={[x * bulk, -0.62, 0.52 * bulk + 0.05 - Math.abs(x) * 0.15]} rotation={[0.06, x * 0.4, 0]} material={cloth}><boxGeometry args={[0.22, 1.1, 0.025]} /></mesh>))}
              <mesh position={[0.28, -0.35, 0.52]} rotation={[0.1, 0, -0.18]} material={CREAM_DS}><boxGeometry args={[0.2, 0.7, 0.02]} /></mesh>
              <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={CREAM}><torusGeometry args={[0.48 * bulk, 0.05, 8, 28]} /></mesh>
            </group>)}
            {leg("a", aLeg, aShin)}{leg("b", bLeg, bShin)}
            {/* tail: smooth tapering segments, rounded tuft at the tip */}
            {!isRama && (
              <group position={[0, -0.02, -0.38]} rotation={[0.2, 0, 0]}>
                {(() => {
                  const build = (i) => i >= tailN ? null : (
                    <group key={i} ref={(el) => (tailRefs.current[i] = el)}>
                      <group rotation={[Math.PI / 2, 0, 0]}>
                        <Limb len={0.4} r0={0.14 - i * 0.0085} r1={0.133 - i * 0.0085} mat={furM} />
                      </group>
                      {i === tailN - 1 && <mesh position={[0, 0, -0.5]} scale={[1, 1, 1.9]} material={mane} castShadow><sphereGeometry args={[0.12, 16, 12]} /></mesh>}
                      <group position={[0, 0, -0.4]}>{build(i + 1)}</group>
                    </group>);
                  return build(0);
                })()}
              </group>
            )}
            {/* spine / upper body */}
            <group ref={spine} position={[0, 0.05, 0]}>
              <mesh position={[0, 0.28, 0]} scale={[1, 1, 0.85]} material={furM} castShadow receiveShadow><capsuleGeometry args={[0.38 * bulk, 0.34, 8, 20]} /></mesh>
              <mesh position={[0, 0.8, 0]} scale={[0.72 * bulk, 0.56, 0.5]} material={furM} castShadow receiveShadow><sphereGeometry args={[1, 28, 20]} /></mesh>
              {!isRama && (<group>
                {/* lighter chest + belly fur, pecs, abdominal ridge, lats and traps: a sculpted torso */}
                <mesh position={[0, 0.78, 0.2 * bulk]} scale={[0.6 * bulk, 0.44, 0.34]} material={belly} receiveShadow><sphereGeometry args={[1, 24, 18]} /></mesh>
                {[-1, 1].map((s) => (<mesh key={"pc" + s} position={[s * 0.25 * bulk, 0.9, 0.3 * bulk]} scale={[0.3 * bulk, 0.22, 0.2]} material={belly} castShadow><sphereGeometry args={[1, 18, 14]} /></mesh>))}
                <mesh position={[0, 0.3, 0.27 * bulk]} scale={[0.34 * bulk, 0.44, 0.17]} material={belly}><sphereGeometry args={[1, 20, 16]} /></mesh>
                {[0.14, 0.34, 0.54].map((y, i) => [-1, 1].map((s) => (<mesh key={"ab" + i + s} position={[s * 0.09 * bulk, y, 0.4 * bulk - i * 0.01]} scale={[0.1 * bulk, 0.08, 0.05]} material={belly}><sphereGeometry args={[1, 10, 8]} /></mesh>)))}
                {[-1, 1].map((s) => (<mesh key={"lt" + s} position={[s * 0.46 * bulk, 0.62, -0.14]} scale={[0.2 * bulk, 0.34, 0.2]} material={furM} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>))}
                <mesh position={[0, 1.1, -0.08]} scale={[0.6 * bulk, 0.22, 0.36]} material={furM} castShadow><sphereGeometry args={[1, 20, 14]} /></mesh>
              </group>)}
              {[-1, 1].map((s) => (<mesh key={s} position={[s * 0.3 * bulk, 0.92, 0.3]} scale={[0.34 * bulk, 0.22, 0.2]} material={furM}><sphereGeometry args={[1, 18, 14]} /></mesh>))}
              {/* neck */}
              <mesh position={[0, 1.18, 0]} material={furM} castShadow><cylinderGeometry args={[isRama ? 0.2 : 0.24 * bulk, isRama ? 0.27 : 0.32 * bulk, 0.3, 18]} /></mesh>
              {isRama && (<group>
                <mesh position={[0, 1.02, 0.12]} rotation={[1.05, 0, 0]} material={gold}><torusGeometry args={[0.36, 0.03, 8, 26]} /></mesh>
                <mesh position={[0, 0.9, 0.2]} rotation={[0.85, 0, 0]} material={gold}><torusGeometry args={[0.34, 0.022, 8, 26]} /></mesh>
                <mesh position={[0, 0.55, 0.36]}><sphereGeometry args={[0.07, 12, 10]} /><meshStandardMaterial color="#2fb4a8" emissive="#0b5f58" emissiveIntensity={0.7} roughness={0.15} /></mesh>
                <mesh position={[0, 0.8, 0.0]} rotation={[0.1, 0, 0.72]} scale={[0.76 * bulk, 0.6, 0.54]} material={CREAM}><torusGeometry args={[0.98, 0.045, 8, 36]} /></mesh>
              </group>)}
              {!isRama && cfg.necklace && (<group>
                <mesh position={[0, 1.0, 0.1]} rotation={[1.15, 0, 0]} material={gold}><torusGeometry args={[0.46 * bulk, 0.045, 10, 36]} /></mesh>
                <mesh position={[0, 0.9, 0.5 * bulk]} material={gold}><sphereGeometry args={[0.075, 14, 12]} /></mesh>
                <mesh position={[0, 0.9, 0.56 * bulk]} material={gem}><sphereGeometry args={[0.05, 12, 10]} /></mesh>
              </group>)}
              {cfg.garland && (
                <group position={[0, 0, 0.0]}>
                  {Array.from({ length: 26 }).map((_, i) => {
                    const s = i / 25, x = THREE.MathUtils.lerp(-0.52, 0.52, s), y = 1.12 - 0.5 * Math.sin(Math.PI * s) - 0.04 * Math.abs(x);
                    const z = 0.3 + (0.47 - x * x * 0.75) * 0.9;
                    const col = ["#fff6e6", "#ffcf5a", "#ff8a3d", "#fff6e6", "#f6a8c0"][i % 5];
                    return (<group key={i} position={[x, y, z]}>
                      <mesh castShadow><sphereGeometry args={[0.1, 14, 12]} /><meshStandardMaterial color={col} roughness={0.6} emissive={col} emissiveIntensity={0.1} /></mesh>
                      <mesh position={[0, -0.05, 0.02]} rotation={[0.8, 0, i * 0.8]} scale={[1.3, 0.35, 1]}><sphereGeometry args={[0.07, 10, 8]} /><meshStandardMaterial color="#3f7a3a" roughness={0.9} /></mesh>
                    </group>);
                  })}
                </group>
              )}
              {arm("a", aArm, aFore, aHand)}{arm("b", bArm, bFore, bHand)}
              {isRama && ( // quiver on back
                <group position={[0.1, 0.8, -0.5]} rotation={[0.15, 0, -0.25]}>
                  <mesh material={dark}><cylinderGeometry args={[0.14, 0.12, 1.2, 12]} /></mesh>
                  {[0, 1, 2, 3, 4].map((i) => (<mesh key={i} position={[Math.cos(i * 1.3) * 0.06, 0.75, Math.sin(i * 1.3) * 0.06]} rotation={[Math.cos(i) * 0.1, 0, Math.sin(i) * 0.1]}><cylinderGeometry args={[0.012, 0.012, 0.5, 5]} /><meshStandardMaterial color="#e9d9a8" /></mesh>))}
                </group>
              )}
              {/* mane: layered, rounded locks falling over the neck and shoulders */}
              {!isRama && (
                <group ref={maneG} position={[0, 1.2, -0.02]}>
                  {locks.map((L, i) => (
                    <group key={i} position={[Math.sin(L.a) * L.rad * bulk, L.y, -Math.cos(L.a) * L.rad * bulk]} rotation={[-L.phi, Math.PI - L.a, 0, "YXZ"]} ref={(el) => (maneRefs.current[i] = el)}>
                      <mesh position={[0, -L.len / 2, 0]} scale={[1.7, 1, 0.7]} material={mane} castShadow><capsuleGeometry args={[L.w, L.len, 6, 12]} /></mesh>
                    </group>
                  ))}
                </group>
              )}
              {/* head */}
              <group ref={head} position={[0, 1.44, 0]}>
                <mesh castShadow receiveShadow material={furM}><sphereGeometry args={[0.4, 32, 24]} /></mesh>
                {!isRama && (<group>
                  {/* face mask, muzzle, nose, brow ridge, cheek ruffs, ears: all smooth forms */}
                  <mesh position={[0, -0.02, 0.2]} scale={[0.82, 0.92, 0.55]} material={skin}><sphereGeometry args={[0.34, 24, 18]} /></mesh>
                  <mesh position={[0, -0.13, 0.36]} scale={[0.9, 0.7, 0.8]} material={skin} castShadow><sphereGeometry args={[0.2, 20, 16]} /></mesh>
                  <mesh position={[0, -0.07, 0.5]} scale={[1.2, 0.8, 0.8]} material={nose}><sphereGeometry args={[0.06, 14, 10]} /></mesh>
                  {[-1, 1].map((s) => (<mesh key={"ns" + s} position={[s * 0.035, -0.09, 0.545]} material={dark}><sphereGeometry args={[0.014, 8, 6]} /></mesh>))}
                  <mesh position={[0, 0.0, 0.43]} scale={[0.5, 1.2, 0.6]} material={skin}><sphereGeometry args={[0.07, 12, 10]} /></mesh>
                  {[-1, 1].map((s) => (<group key={"br" + s}>
                    <mesh position={[s * 0.125, 0.135, 0.33]} rotation={[0.2, 0, Math.PI / 2 + s * 0.34]} material={furDark}><capsuleGeometry args={[0.05, 0.17, 6, 10]} /></mesh>
                    <mesh position={[s * 0.31, -0.1, 0.12]} scale={[0.7, 1, 0.9]} material={furM} castShadow><sphereGeometry args={[0.17, 16, 12]} /></mesh>
                    <mesh position={[s * 0.385, 0.0, -0.02]} scale={[0.4, 1, 0.8]} material={skin}><sphereGeometry args={[0.115, 14, 10]} /></mesh>
                    <mesh position={[s * 0.39, 0.005, 0.0]} scale={[0.25, 0.7, 0.55]} material={earIn}><sphereGeometry args={[0.1, 12, 10]} /></mesh>
                    {/* eyes */}
                    <mesh position={[s * 0.13, 0.05, 0.31]} material={white}><sphereGeometry args={[0.068, 18, 14]} /></mesh>
                    <mesh position={[s * 0.13, 0.05, 0.368]} material={iris}><sphereGeometry args={[0.04, 14, 12]} /></mesh>
                    <mesh position={[s * 0.13, 0.05, 0.398]} material={dark}><sphereGeometry args={[0.02, 10, 8]} /></mesh>
                    <mesh position={[s * 0.14, 0.065, 0.405]} material={glint}><sphereGeometry args={[0.008, 6, 6]} /></mesh>
                    <mesh position={[s * 0.13, 0.095, 0.325]} rotation={[0.55, 0, 0]} material={skin}><sphereGeometry args={[0.072, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.4]} /></mesh>
                  </group>))}
                  <mesh position={[0, 0.3, 0.12]} scale={[0.9, 0.5, 0.9]} material={furM}><sphereGeometry args={[0.2, 16, 12]} /></mesh>
                </group>)}
                {isRama && [-1, 1].map((q) => (<mesh key={"br" + q} position={[q * 0.14, 0.15, 0.345]} rotation={[0.25, q * 0.3, Math.PI / 2 - q * 0.22]} material={dark}><capsuleGeometry args={[0.014, 0.15, 3, 6]} /></mesh>))}
                {isRama && [-1, 1].map((s) => (<group key={s}>
                  <mesh position={[s * 0.13, 0.05, 0.31]} scale={[1.25, 0.8, 1]} material={white}><sphereGeometry args={[0.065, 12, 10]} /></mesh>
                  <mesh position={[s * 0.13, 0.05, 0.365]} material={dark}><sphereGeometry args={[0.036, 10, 8]} /></mesh>
                  <mesh position={[s * 0.13, 0.05, 0.395]} material={dark}><sphereGeometry args={[0.018, 8, 6]} /></mesh>
                  <mesh position={[s * 0.385, 0.0, -0.02]} scale={[0.4, 1, 0.8]} material={skin}><sphereGeometry args={[0.11, 10, 8]} /></mesh>
                  <mesh position={[s * 0.035, -0.115, 0.4]} material={dark}><sphereGeometry args={[0.022, 6, 6]} /></mesh>
                </group>))}
                {isRama && <mesh position={[0, -0.04, 0.4]} scale={[0.7, 1, 1]} material={furM}><coneGeometry args={[0.06, 0.16, 8]} /></mesh>}
                <group ref={jaw} position={[0, -0.16, 0.14]}>
                  <mesh position={[0, -0.07, 0.17]} scale={[1, 0.55, 1]} material={skin} castShadow><sphereGeometry args={[isRama ? 0.15 : 0.2, 18, 12]} /></mesh>
                  {!isRama && <mesh position={[0, -0.02, 0.2]} scale={[0.8, 0.3, 0.9]} material={mouth}><sphereGeometry args={[0.17, 14, 10]} /></mesh>}
                  {!isRama && <mesh position={[0, -0.035, 0.22]} scale={[0.55, 0.22, 0.8]} material={earIn}><sphereGeometry args={[0.12, 12, 8]} /></mesh>}
                  {!isRama && [-1, 1].map((s) => (<mesh key={s} position={[s * 0.09, 0.005, 0.33]} material={white}><capsuleGeometry args={[0.014, 0.05, 3, 6]} /></mesh>))}
                </group>
                {!isRama && [-1, 1].map((s) => (<mesh key={s} position={[s * 0.09, -0.125, 0.45]} material={white}><capsuleGeometry args={[0.013, 0.04, 3, 6]} /></mesh>))}
                {!isRama && cfg.crown && (
                  <group position={[0, 0.3, -0.01]}>
                    <mesh geometry={crownGeo} material={gold} castShadow />
                    {[0.08, 0.2, 0.32].map((y, i) => (<mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}><torusGeometry args={[0.35 - i * 0.045, 0.014, 8, 36]} /></mesh>))}
                    <mesh position={[0, 0.54, 0]} material={gold}><sphereGeometry args={[0.035, 12, 10]} /></mesh>
                    <mesh position={[0, 0.11, 0.35]} material={gem}><sphereGeometry args={[0.052, 14, 12]} /></mesh>
                    {[-1, 1].map((s) => (<mesh key={s} position={[s * 0.2, 0.15, 0.27]} material={gem}><sphereGeometry args={[0.03, 10, 8]} /></mesh>))}
                  </group>)}
                {!isRama && cfg.circlet && (
                  <group position={[0, 0.27, 0.0]}>
                    <mesh rotation={[Math.PI / 2 - 0.12, 0, 0]} material={gold}><torusGeometry args={[0.36, 0.03, 10, 40]} /></mesh>
                    <mesh position={[0, 0.03, 0.36]} material={gem}><sphereGeometry args={[0.05, 14, 12]} /></mesh>
                  </group>)}
                {!isRama && [-1, 1].map((s) => (<group key={"er" + s} position={[s * 0.41, -0.09, 0.0]}>
                  <mesh material={gold}><sphereGeometry args={[0.035, 12, 10]} /></mesh>
                  <mesh position={[0, -0.08, 0]} material={gold}><sphereGeometry args={[0.04, 12, 10]} /></mesh>
                </group>))}
                {isRama && (<group>
                  {/* hair: dark cap, tall jata bun, long locks */}
                  <mesh position={[0, 0.07, -0.05]} scale={[1.02, 1.0, 1.04]} material={hair}><sphereGeometry args={[0.41, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} /></mesh>
                  <mesh position={[0, 0.52, -0.02]} scale={[1, 1.25, 1]} material={hair}><sphereGeometry args={[0.2, 16, 12]} /></mesh>
                  <mesh position={[0, 0.7, -0.02]} scale={[1, 1.1, 1]} material={hair}><sphereGeometry args={[0.14, 14, 10]} /></mesh>
                  <mesh position={[0, 0.82, -0.02]} material={gold}><coneGeometry args={[0.07, 0.16, 10]} /></mesh>
                  {[-0.22, -0.11, 0, 0.11, 0.22].map((x, i) => (<mesh key={"lk" + i} position={[x, -0.2, -0.36 + Math.abs(x) * 0.5]} rotation={[0.12, 0, x * 0.5]} material={hair}><capsuleGeometry args={[0.055, 0.55 - Math.abs(x), 4, 8]} /></mesh>))}
                  {/* mukuta (crown) */}
                  <mesh position={[0, 0.36, 0.0]} material={gold}><cylinderGeometry args={[0.31, 0.35, 0.14, 24, 1, true]} /></mesh>
                  <mesh position={[0, 0.36, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={gold}><torusGeometry args={[0.35, 0.02, 8, 28]} /></mesh>
                  {Array.from({ length: 7 }).map((_, i) => { const a2 = ((i - 3) / 6) * Math.PI * 0.95; return (<mesh key={"cp" + i} position={[Math.sin(a2) * 0.33, 0.5, Math.cos(a2) * 0.33]} rotation={[0, a2, 0]} material={gold}><coneGeometry args={[0.045, 0.16 + (3 - Math.abs(i - 3)) * 0.035, 6]} /></mesh>); })}
                  <mesh position={[0, 0.37, 0.355]}><sphereGeometry args={[0.05, 12, 10]} /><meshStandardMaterial color="#d8232c" emissive="#7a0a10" emissiveIntensity={0.6} roughness={0.15} /></mesh>
                  {/* tilak, lips, earrings */}
                  <mesh position={[0, 0.2, 0.385]} rotation={[0.25, 0, 0]}><capsuleGeometry args={[0.012, 0.07, 3, 6]} /><meshStandardMaterial color="#d63a1e" roughness={0.5} /></mesh>
                  {[-1, 1].map((q) => (<group key={"er" + q} position={[q * 0.4, -0.11, 0.0]}>
                    <mesh material={gold}><sphereGeometry args={[0.04, 10, 8]} /></mesh>
                    <mesh position={[0, -0.09, 0]} material={gold}><coneGeometry args={[0.035, 0.12, 8]} /></mesh>
                  </group>))}
                  <mesh position={[0, -0.19, 0.4]} scale={[1.5, 0.45, 0.7]}><sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color="#8b3a3a" roughness={0.5} /></mesh>
                </group>)}
              </group>
              {/* arrow stuck in chest (Vali) */}
              {cfg.stuckArrow && (
                <group ref={stuck} scale={[0.0001, 0.0001, 0.0001]} position={[0.02, 0.82, 0.38]} rotation={[0.04, 0, 0]}>
                  <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.022, 0.022, 1.7, 8]} /><meshStandardMaterial color="#e8d6a0" roughness={0.6} /></mesh>
                  {[0, 1, 2].map((i) => (<mesh key={i} position={[0, 0, 1.6]} rotation={[0, 0, (i * Math.PI * 2) / 3]}><boxGeometry args={[0.012, 0.18, 0.4]} /><meshStandardMaterial color={i ? "#f4ece0" : "#b02020"} side={THREE.DoubleSide} /></mesh>))}
                  <mesh position={[0, 0, 0.1]}><sphereGeometry args={[0.1, 10, 8]} /><meshBasicMaterial color="#ffd27a" transparent opacity={0.8} /></mesh>
                </group>)}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export default React.memo(FighterImpl);
