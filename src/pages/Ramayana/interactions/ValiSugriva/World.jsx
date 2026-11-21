import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { EVENTS, eventPos } from "./camera.js";
import { arrowState, ramaState, RAMA_POS, RELEASE_T, ARROW_HIT_T, DURATION } from "./fight.js";
import { clamp, lerp } from "./anim.js";
import { G } from "./gameState.js";

const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const canvasTex = (size, draw, repeat) => {
  const c = document.createElement("canvas"); c.width = c.height = size; draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); } return t;
};

export function Sky() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color("#6f9bc8") }, mid: { value: new THREE.Color("#f2d9a6") }, bot: { value: new THREE.Color("#c9b78a") } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
    fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(mid, top, smoothstep(0.0, 0.65, h)); c = mix(bot, c, smoothstep(-0.15, 0.08, h)); float sun = pow(max(dot(vP, normalize(vec3(-0.55,0.38,0.5))),0.0), 64.0); c += vec3(1.0,0.82,0.5)*sun*0.9; gl_FragColor = vec4(c,1.0);} ",
  }), []);
  const cloudTex = useMemo(() => canvasTex(256, (g, sz) => {
    const r = rng(12); g.clearRect(0, 0, sz, sz);
    for (let i = 0; i < 26; i++) { const x = sz * (0.2 + r() * 0.6), y = sz * (0.4 + r() * 0.2), rad = sz * (0.1 + r() * 0.16), gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(255,248,235,0.5)"); gr.addColorStop(1, "rgba(255,248,235,0)"); g.fillStyle = gr; g.fillRect(0, 0, sz, sz); }
  }), []);
  const clouds = useMemo(() => { const r = rng(31); return Array.from({ length: 16 }).map(() => { const a = r() * 6.283, d = 170; return { p: [Math.cos(a) * d, 40 + r() * 55, Math.sin(a) * d], s: 60 + r() * 70, o: 0.35 + r() * 0.4 }; }); }, []);
  const sunTex = useMemo(() => canvasTex(256, (g, sz) => { const gr = g.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2); gr.addColorStop(0, "rgba(255,250,225,1)"); gr.addColorStop(0.12, "rgba(255,235,170,0.95)"); gr.addColorStop(0.4, "rgba(255,205,120,0.25)"); gr.addColorStop(1, "rgba(255,190,100,0)"); g.fillStyle = gr; g.fillRect(0, 0, sz, sz); }), []);
  const sunDir = useMemo(() => new THREE.Vector3(-0.55, 0.38, 0.5).normalize().multiplyScalar(200), []);
  return (<group>
    <mesh material={mat} frustumCulled={false}><sphereGeometry args={[220, 32, 16]} /></mesh>
    <sprite position={sunDir.toArray()} scale={[90, 90, 1]}><spriteMaterial map={sunTex} transparent depthWrite={false} fog={false} blending={THREE.AdditiveBlending} /></sprite>
    {clouds.map((c, i) => (<sprite key={i} position={c.p} scale={[c.s * 1.8, c.s * 0.6, 1]}><spriteMaterial map={cloudTex} transparent opacity={c.o} depthWrite={false} fog={false} /></sprite>))}
  </group>);
}

// Soft god-rays slanting through the canopy (additive, no depth write)
export function LightShafts() {
  const tex = useMemo(() => canvasTex(128, (g, sz) => { const gr = g.createLinearGradient(0, 0, 0, sz); gr.addColorStop(0, "rgba(255,230,160,0.0)"); gr.addColorStop(0.25, "rgba(255,226,150,0.55)"); gr.addColorStop(1, "rgba(255,226,150,0)"); g.fillStyle = gr; g.fillRect(0, 0, sz, sz);
    const h = g.createLinearGradient(0, 0, sz, 0); h.addColorStop(0, "rgba(0,0,0,1)"); h.addColorStop(0.5, "rgba(0,0,0,0)"); h.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = h; g.fillRect(0, 0, sz, sz); }), []);
  const rays = useMemo(() => { const r = rng(44); return Array.from({ length: 9 }).map((_, i) => { const a = (i / 9) * 6.283 + r() * 0.4, d = 12 + r() * 12; return { p: [Math.cos(a) * d + 6, 9, Math.sin(a) * d - 4], w: 2.5 + r() * 3.5, o: 0.07 + r() * 0.09, ry: r() * 3 }; }); }, []);
  return (<group>{rays.map((s, i) => (
    <mesh key={i} position={s.p} rotation={[0, s.ry, 0.38]} renderOrder={3}><planeGeometry args={[s.w, 26]} /><meshBasicMaterial map={tex} transparent opacity={s.o} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog={false} /></mesh>))}</group>);
}

export function Ground() {
  const grass = useMemo(() => canvasTex(512, (g, s) => {
    g.fillStyle = "#7f8a4a"; g.fillRect(0, 0, s, s); const r = rng(3);
    for (let i = 0; i < 5000; i++) { g.fillStyle = ["#6d7a3c", "#8f9a52", "#5f6e35", "#a39a5a"][(r() * 4) | 0]; g.globalAlpha = 0.35; g.fillRect(r() * s, r() * s, 2 + r() * 3, 4 + r() * 8); }
  }, 40), []);
  const dirt = useMemo(() => canvasTex(512, (g, s) => {
    const grd = g.createRadialGradient(s / 2, s / 2, s * 0.1, s / 2, s / 2, s / 2); grd.addColorStop(0, "#9b7d54"); grd.addColorStop(0.75, "#a88a5c"); grd.addColorStop(1, "rgba(150,125,85,0)");
    g.fillStyle = grd; g.fillRect(0, 0, s, s); const r = rng(9);
    for (let i = 0; i < 2500; i++) { g.fillStyle = r() > 0.5 ? "#7e6240" : "#b99c6c"; g.globalAlpha = 0.25; g.beginPath(); g.arc(r() * s, r() * s, 1 + r() * 3, 0, 7); g.fill(); }
  }), []);
  return (<group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow><planeGeometry args={[300, 300]} /><meshStandardMaterial map={grass} roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow><circleGeometry args={[9, 48]} /><meshStandardMaterial map={dirt} transparent roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow><circleGeometry args={[5.6, 48]} /><meshStandardMaterial map={dirt} transparent opacity={0.8} color="#8a6c44" roughness={1} /></mesh>
  </group>);
}

function Tree({ p, s, seed }) {
  const r = useMemo(() => rng(seed), [seed]);
  const clumps = useMemo(() => Array.from({ length: 12 }).map(() => { const u = r(); return [(r() - 0.5) * 4.2, 4.8 + r() * 3.2, (r() - 0.5) * 4.2, 1.2 + r() * 1.3, u, r() > 0.86]; }), [r]);
  const greens = ["#4d6b3a", "#3d5a30", "#57783f", "#35502b"];
  return (<group position={p} scale={s}>
    <mesh position={[0, 2.6, 0]} castShadow><cylinderGeometry args={[0.32, 0.62, 5.2, 12]} /><meshStandardMaterial color="#5b4129" roughness={1} /></mesh>
    <mesh position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.6, 1.05, 0.7, 12]} /><meshStandardMaterial color="#51391f" roughness={1} /></mesh>
    <mesh position={[0.9, 4.6, 0]} rotation={[0, 0, -0.9]} castShadow><cylinderGeometry args={[0.12, 0.2, 2.2, 8]} /><meshStandardMaterial color="#5b4129" roughness={1} /></mesh>
    <mesh position={[-0.8, 4.3, 0.2]} rotation={[0, 0, 0.8]} castShadow><cylinderGeometry args={[0.1, 0.18, 2.0, 8]} /><meshStandardMaterial color="#5b4129" roughness={1} /></mesh>
    {clumps.map((c, i) => (<mesh key={i} position={[c[0], c[1], c[2]]} scale={[1, 0.8, 1]} castShadow receiveShadow><icosahedronGeometry args={[c[3], 2]} /><meshStandardMaterial color={c[5] ? "#d98aa0" : greens[(c[4] * 4) | 0]} roughness={1} /></mesh>))}
  </group>);
}

export function Forest() {
  const trees = useMemo(() => { const r = rng(21); return Array.from({ length: 34 }).map((_, i) => { const a = (i / 34) * Math.PI * 2 + r() * 0.3, d = 20 + r() * 16; return { p: [Math.cos(a) * d, 0, Math.sin(a) * d], s: 1.0 + r() * 0.9, seed: 100 + i }; }); }, []);
  const rocks = useRef(), grass = useRef(), pebbles = useRef(), flowers = useRef(), peaks = useMemo(() => Array.from({ length: 11 }).map((_, i) => [Math.cos(i * 0.58 + 0.3) * 125, Math.sin(i * 0.58 + 0.3) * 125, 22 + (i % 3) * 9, i]), []);
  const mountainGeo = useMemo(() => { // noise-displaced, vertex-coloured hills (no cones)
    const mk = (seed) => { const g = new THREE.IcosahedronGeometry(1, 4), pos = g.attributes.position, col = new Float32Array(pos.count * 3), r = rng(seed), ph = [r() * 9, r() * 9, r() * 9];
      for (let i = 0; i < pos.count; i++) { let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const n = Math.sin(x * 3.1 + ph[0]) * Math.cos(z * 2.7 + ph[1]) * 0.12 + Math.sin(y * 5 + x * 2 + ph[2]) * 0.06 + Math.sin(x * 9 + z * 8) * 0.025;
        const k = 1 + n; x *= k; y = y < 0 ? y * 0.2 : y * k * 0.95; z *= k; pos.setXYZ(i, x, y, z);
        const h = Math.max(0, y), c = new THREE.Color().lerpColors(new THREE.Color("#5f7f4a"), new THREE.Color("#9a9684"), Math.min(1, h * 1.3)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g; };
    return [mk(3), mk(8), mk(15)];
  }, []);
  useLayoutEffect(() => {
    const r = rng(5), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
    for (let i = 0; i < 70; i++) { const a = i < 24 ? (i / 24) * 6.283 + r() * 0.1 : r() * 6.28, d = i < 24 ? 9.6 + r() * 1.2 : 8 + r() * 14; e.set(r() * 3, r() * 3, r() * 3); q.setFromEuler(e); const k = 0.3 + r() * 0.9; s.set(k * 1.2, k * 0.7, k); p.set(Math.cos(a) * d, k * 0.2, Math.sin(a) * d); m.compose(p, q, s); rocks.current.setMatrixAt(i, m); }
    rocks.current.instanceMatrix.needsUpdate = true;
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < 2600; i++) { const a = r() * 6.28, d = 8.5 + Math.sqrt(r()) * 26; const h = 0.5 + r() * 0.9; e.set((r() - 0.5) * 0.35, r() * 6, (r() - 0.5) * 0.35); q.setFromEuler(e); s.set(1, h, 1); p.set(Math.cos(a) * d, h * 0.25, Math.sin(a) * d); m.compose(p, q, s); grass.current.setMatrixAt(i, m); }
    grass.current.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 260; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 9; const k = 0.04 + r() * 0.1; e.set(r() * 3, r() * 3, r() * 3); q.setFromEuler(e); s.set(k * 1.4, k * 0.6, k); p.set(Math.cos(a) * d, k * 0.2, Math.sin(a) * d); m.compose(p, q, s); pebbles.current.setMatrixAt(i, m); }
    pebbles.current.instanceMatrix.needsUpdate = true;
    const cols = ["#fff2c4", "#f2a6c0", "#ffd24a", "#ffffff"];
    for (let i = 0; i < 320; i++) { const a = r() * 6.28, d = 9.2 + Math.sqrt(r()) * 24; q.identity(); s.setScalar(0.07 + r() * 0.05); p.set(Math.cos(a) * d, 0.32 + r() * 0.5, Math.sin(a) * d); m.compose(p, q, s); flowers.current.setMatrixAt(i, m); flowers.current.setColorAt(i, new THREE.Color(cols[(r() * 4) | 0])); }
    flowers.current.instanceMatrix.needsUpdate = true; if (flowers.current.instanceColor) flowers.current.instanceColor.needsUpdate = true;
  }, []);
  return (<group>
    {trees.map((t, i) => <Tree key={i} {...t} />)}
    {peaks.map((p, i) => (<mesh key={i} geometry={mountainGeo[i % 3]} position={[p[0], 0, p[1]]} scale={[p[2] * 2.1, p[2] * 1.5, p[2] * 2.1]} rotation={[0, p[3], 0]}><meshStandardMaterial vertexColors roughness={1} fog /></mesh>))}
    <instancedMesh ref={pebbles} args={[undefined, undefined, 260]} receiveShadow><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#9c9078" roughness={1} flatShading /></instancedMesh>
    <instancedMesh ref={flowers} args={[undefined, undefined, 320]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial roughness={0.7} /></instancedMesh>
    <instancedMesh ref={rocks} args={[undefined, undefined, 70]} castShadow receiveShadow><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#8a8070" roughness={1} flatShading /></instancedMesh>
    <instancedMesh ref={grass} args={[undefined, undefined, 2600]} frustumCulled={false}><coneGeometry args={[0.06, 1.1, 3]} /><meshStandardMaterial color="#6f8a3a" roughness={1} /></instancedMesh>
  </group>);
}

export function Bushes({ aim }) {
  const items = useMemo(() => { const r = rng(77), xl = [Math.cos(aim), -Math.sin(aim)], zl = [Math.sin(aim), Math.cos(aim)];
    return Array.from({ length: 22 }).map(() => { const a = 1.7 + r() * 1.2, b = (r() - 0.5) * 5.4; return { p: [RAMA_POS[0] + xl[0] * a + zl[0] * b, 0.7 + r() * 0.5, RAMA_POS[2] + xl[1] * a + zl[1] * b], s: 0.8 + r() * 0.7, c: r() > 0.5 ? "#3f6a34" : "#2f5a2a" }; }); }, [aim]);
  return <group>{items.map((b, i) => (<mesh key={i} position={b.p} scale={[b.s * 1.2, b.s, b.s * 1.2]} castShadow><icosahedronGeometry args={[1, 2]} /><meshStandardMaterial color={b.c} roughness={1} /></mesh>))}</group>;
}

// ---- deterministic FX driven by EVENTS ----
const N_DUST = 480, N_SPARK = 360;
const RING_EVENTS = EVENTS.map((e, i) => ({ ...e, i, pos: null })).filter((e) => ["heavy", "slam", "thud", "arrow"].includes(e.k));
export function FX({ clock }) {
  const dust = useRef(), spark = useRef(), light = useRef(), flash = useRef(), flare = useRef(), crack = useRef(), rings = useRef([]);
  const evs = useMemo(() => EVENTS.filter((e) => e.k !== "whiff").map((e, i) => ({ ...e, i, pos: eventPos(e) })), []);
  const ringEvs = useMemo(() => evs.filter((e) => ["heavy", "slam", "thud", "arrow"].includes(e.k)), [evs]);
  const crackTex = useMemo(() => canvasTex(256, (g, s) => { g.strokeStyle = "#2a1c10"; g.lineWidth = 4; const r = rng(4); for (let i = 0; i < 14; i++) { let x = s / 2, y = s / 2, a = (i / 14) * 6.28 + r() * 0.4; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { a += (r() - 0.5) * 0.7; x += Math.cos(a) * 16; y += Math.sin(a) * 16; g.lineTo(x, y); } g.stroke(); } const gr = g.createRadialGradient(s / 2, s / 2, 5, s / 2, s / 2, s / 2); gr.addColorStop(0, "rgba(30,20,10,0.55)"); gr.addColorStop(1, "rgba(30,20,10,0)"); g.fillStyle = gr; g.fillRect(0, 0, s, s); }), []);
  const glowTex = useMemo(() => canvasTex(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, "rgba(255,245,210,1)"); gr.addColorStop(0.3, "rgba(255,200,110,0.6)"); gr.addColorStop(1, "rgba(255,160,60,0)"); g.fillStyle = gr; g.fillRect(0, 0, s, s); }), []);
  const m4 = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []), sc = useMemo(() => new THREE.Vector3(), []), ps = useMemo(() => new THREE.Vector3(), []), e3 = useMemo(() => new THREE.Euler(), []);
  useFrame(() => {
    const t = clock.t; let nd = 0, ns = 0, lt = 0, lp = null, fl = 0, flp = null, hf = 0, hfp = null;
    for (const e of evs) {
      const age = t - e.t; if (age < 0 || age > 2.4) continue;
      const big = e.k === "slam" || e.k === "arrow" ? 1 : e.k === "heavy" ? 0.7 : e.k === "block" ? 0.2 : 0.4;
      const ground = e.k === "slam" || e.k === "thud" || e.k === "heavy" || e.k === "arrow";
      const nD = e.k === "roar" || e.k === "release" ? 0 : Math.round(10 + big * 50), r = rng(e.i * 977 + 13);
      for (let j = 0; j < nD && nd < N_DUST; j++) {
        const a = r() * 6.283, sp = (0.8 + r() * 3.2) * (0.5 + big), life = 1.0 + r() * 1.3; if (age > life) { r(); r(); continue; }
        const rad = sp * (1 - Math.exp(-age * 2.2)) / 2.2; const y0 = ground ? 0.15 : e.pos[1];
        ps.set(e.pos[0] + Math.cos(a) * rad, y0 + (ground ? 0.2 + age * 0.45 * r() : age * 0.3), e.pos[2] + Math.sin(a) * rad);
        const k = (0.25 + r() * 0.5) * (0.6 + big) * (0.5 + Math.min(age * 1.6, 1.4)) * (1 - (age / life) ** 2); sc.set(k, k * 0.8, k);
        m4.compose(ps, q.identity(), sc); dust.current.setMatrixAt(nd++, m4);
      }
      if (e.k !== "roar" && e.k !== "release") for (let j = 0; j < 12 + big * 16 && ns < N_SPARK; j++) {
        const a = r() * 6.283, el = r() * 2.4 - 0.3, sp = 3 + r() * 6 * (0.5 + big), life = 0.35 + r() * 0.4; if (age > life) continue;
        const vx = Math.cos(a) * Math.cos(el) * sp, vy = Math.sin(el) * sp + 2, vz = Math.sin(a) * Math.cos(el) * sp;
        ps.set(e.pos[0] + vx * age, Math.max(0.05, e.pos[1] + vy * age - 9 * age * age), e.pos[2] + vz * age);
        e3.set(0, a, el); q.setFromEuler(e3); const k = (1 - age / life) * 0.12 * (0.7 + big); sc.set(k * 4, k, k); m4.compose(ps, q, sc); spark.current.setMatrixAt(ns++, m4);
      }
      if (e.k === "hit" || e.k === "heavy" || e.k === "block" || e.k === "slam") { const f = Math.max(0, 1 - age / 0.16) * Math.min(1.4, e.v); if (f > hf) { hf = f; hfp = e.pos; } }
      const la = e.k === "roar" || e.k === "release" ? 99 : age; const I = e.v * Math.max(0, 1 - la / 0.18);
      if (I > lt) { lt = I; lp = e.pos; }
      if (e.k === "arrow" || e.k === "slam") { const f = Math.max(0, 1 - age / (e.k === "arrow" ? 0.9 : 0.5)); if (f > fl) { fl = f; flp = e.pos; } }
    }
    if (nd === 0) { sc.set(0, 0, 0); m4.compose(ps.set(0, -50, 0), q.identity(), sc); dust.current.setMatrixAt(nd++, m4); } if (ns === 0) { sc.set(0, 0, 0); m4.compose(ps.set(0, -50, 0), q.identity(), sc); spark.current.setMatrixAt(ns++, m4); }
    dust.current.count = nd; dust.current.instanceMatrix.needsUpdate = true; spark.current.count = ns; spark.current.instanceMatrix.needsUpdate = true;
    light.current.intensity = lt * 14; if (lp) light.current.position.set(lp[0], lp[1] + 0.3, lp[2]);
    if (flp) { flash.current.position.set(flp[0], flp[1] + 0.2, flp[2]); flash.current.scale.setScalar(2 + fl * (flp[1] > 1 ? 7 : 5)); flash.current.material.opacity = fl; } else { flash.current.scale.setScalar(0.001); }
    if (hfp) { flare.current.position.set(hfp[0], hfp[1], hfp[2]); flare.current.scale.setScalar(0.5 + hf * 1.7); flare.current.material.opacity = Math.min(1, hf * 1.2); } else flare.current.scale.setScalar(0.001);
    ringEvs.forEach((e, i) => { const m = rings.current[i]; if (!m) return; const age = t - e.t; const on = age >= 0 && age < 1.1; if (!on) { m.scale.setScalar(0.001); m.position.set(0, -50, 0); } if (on) { const u = age / 1.1, big = e.k === "slam" || e.k === "arrow" ? 11 : e.k === "heavy" ? 6 : 4; m.scale.setScalar(0.4 + (1 - (1 - u) ** 3) * big); m.material.opacity = (1 - u) * 0.55; m.position.set(e.pos[0], 0.06, e.pos[2]); } });
    const sl = evs.find((e) => e.k === "slam"); crack.current.material.opacity = clamp((t - sl.t) / 0.2) * 0.9; 
  });
  const slam = EVENTS.find((e) => e.k === "slam");
  const sp = useMemo(() => eventPos(slam), [slam]);
  return (<group>
    <instancedMesh ref={dust} args={[undefined, undefined, N_DUST]} frustumCulled={false}><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#b9a07a" transparent opacity={0.45} roughness={1} depthWrite={false} /></instancedMesh>
    <instancedMesh ref={spark} args={[undefined, undefined, N_SPARK]} frustumCulled={false}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#ffd78a" blending={THREE.AdditiveBlending} transparent depthWrite={false} /></instancedMesh>
    <sprite ref={flare} scale={[0.001, 0.001, 0.001]}><spriteMaterial map={glowTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0} /></sprite>
    <pointLight ref={light} color="#ffd9a0" intensity={0} distance={14} decay={2} />
    <sprite ref={flash} scale={[0.001, 0.001, 0.001]}><spriteMaterial map={glowTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0} /></sprite>
    <mesh ref={crack} rotation={[-Math.PI / 2, 0, 0]} position={[sp[0], 0.03, sp[2]]}><planeGeometry args={[7, 7]} /><meshBasicMaterial map={crackTex} transparent opacity={0} depthWrite={false} /></mesh>
    {ringEvs.map((e, i) => (<mesh key={i} ref={(el) => (rings.current[i] = el)} scale={[0.001, 0.001, 0.001]} position={[0, -50, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.85, 1, 48]} /><meshBasicMaterial color="#ffe3b0" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>))}
  </group>);
}

// ---- Rama's bow, string and the divine arrow ----
export function RamaProps({ clock, rig }) {
  const bow = useMemo(() => {
    const grp = new THREE.Group(); const R = 2.2, arc = 1.25;
    const wood = new THREE.MeshStandardMaterial({ color: "#6a3b1c", roughness: 0.5, metalness: 0.1 }), gold = new THREE.MeshStandardMaterial({ color: "#d9a93e", metalness: 0.9, roughness: 0.25 });
    const b = new THREE.Mesh(new THREE.TorusGeometry(R, 0.045, 8, 40, arc), wood); b.rotation.z = -Math.PI / 2 - arc / 2; b.position.y = R; b.castShadow = true; grp.add(b);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8), gold); grip.rotation.z = Math.PI / 2; grp.add(grip);
    const tip = (s) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), gold); m.position.set(s * R * Math.sin(arc / 2), R - R * Math.cos(arc / 2), 0); grp.add(m); return m.position.clone(); };
    const tt = tip(1), tb = tip(-1);
    const strMat = new THREE.MeshBasicMaterial({ color: "#efe3c4" });
    const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 4), strMat), s2 = s1.clone(); grp.add(s1, s2);
    return { grp, tt, tb, s1, s2 };
  }, []);
  const arrow = useMemo(() => {
    const grp = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 8), new THREE.MeshStandardMaterial({ color: "#e8d6a0", roughness: 0.5 }));
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 8), new THREE.MeshStandardMaterial({ color: "#ffe9a8", emissive: "#ffb43a", emissiveIntensity: 1.2, metalness: 0.7, roughness: 0.2 }));
        const fl = new THREE.Group(); for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.22, 0.5), new THREE.MeshStandardMaterial({ color: i ? "#f4ece0" : "#b02020", side: THREE.DoubleSide })); f.rotation.y = (i * Math.PI * 2) / 3; fl.add(f); }
    const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.1, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: "#ffd27a", transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    grp.add(shaft, head, fl, trail); grp.traverse((o) => { o.frustumCulled = false; }); return { grp, shaft, head, fl, trail };
  }, []);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), d: new THREE.Vector3(), q: new THREE.Quaternion(), up: new THREE.Vector3(0, 1, 0), m: new THREE.Vector3() }), []);
  const place = (mesh, A, B) => { tmp.d.subVectors(B, A); const l = tmp.d.length() || 1e-4; mesh.position.copy(A).addScaledVector(tmp.d, 0.5); mesh.scale.set(1, l, 1); mesh.quaternion.setFromUnitVectors(tmp.up, tmp.d.normalize()); };
  const setArrow = (tail, tip, vis, trail) => {
    arrow.grp.visible = true; if (!vis) { arrow.grp.position.set(0, -80, 0); arrow.trail.visible = true; arrow.shaft.position.set(0, 0, 0); arrow.shaft.scale.set(1, 1, 1); arrow.head.position.set(0, 1, 0); arrow.fl.position.set(0, 0, 0); arrow.trail.position.set(0, 0, 0); arrow.trail.scale.set(1, 1, 1); return; } arrow.grp.position.set(0, 0, 0);
    const L = tmp.d.subVectors(tip, tail).length(); tmp.q.setFromUnitVectors(tmp.up, tmp.d.clone().normalize());
    arrow.shaft.position.copy(tail).addScaledVector(tmp.d, 0.5); arrow.shaft.scale.set(1, L, 1); arrow.shaft.quaternion.copy(tmp.q);
    arrow.head.position.copy(tip); arrow.head.quaternion.copy(tmp.q);
    arrow.fl.position.copy(tail).addScaledVector(tmp.d.clone().normalize(), 0.18); arrow.fl.quaternion.copy(tmp.q);
    arrow.trail.visible = trail > 0; if (trail > 0) { const dir = tmp.d.clone().normalize(); arrow.trail.position.copy(tail).addScaledVector(dir, -trail * 0.5 + 0.2); arrow.trail.scale.set(1, trail, 1); arrow.trail.quaternion.copy(tmp.q); }
  };
  const attached = useRef(false);
  useFrame(() => {
    const t = clock.t; if (!rig.bHand) return;
    if (!attached.current) { rig.bHand.add(bow.grp); attached.current = true; }
    rig.root.updateMatrixWorld(true);
    const rs = ramaState(t), A = tmp.a, B = tmp.b;
    rig.aHand.getWorldPosition(A); rig.bHand.getWorldPosition(B);
    G.nock = [A.x, A.y, A.z];
    // bowstring: pulled to the drawing hand while nocked, otherwise vibrates after release
    const rest = new THREE.Vector3(0, bow.tt.y, 0), since = G.sinceRelease;
    let pull;
    if (rs.nocked) pull = bow.grp.worldToLocal(A.clone());
    else { const vib = since >= 0 ? Math.sin(since * 70) * Math.exp(-since * 9) * 0.22 : 0; pull = rest.clone().add(new THREE.Vector3(0, vib, 0)); }
    place(bow.s1, bow.tt, pull); place(bow.s2, pull, bow.tb);
    // arrow
    const a = arrowState(t), y = rs.yaw, xl = new THREE.Vector3(Math.cos(y), 0, -Math.sin(y));
    if (G.flight) {
      const f = G.flight, u = clamp(f.t / 1.3), dir = new THREE.Vector3(...f.dir);
      const p = new THREE.Vector3(...f.from).lerp(new THREE.Vector3(...f.to), u);
      if (u >= 1) setArrow(A, B, false, 0); else setArrow(p.clone().addScaledVector(dir, -1.3), p.clone().addScaledVector(dir, 1.3), true, 3.2 * clamp(u * 4));
    } else if (a && !a.hit) { const dir = new THREE.Vector3(...a.dir), p = new THREE.Vector3(...a.pos); setArrow(p.clone().addScaledVector(dir, -1.3), p.clone().addScaledVector(dir, 1.3), true, 3.5 * clamp(a.u * 4)); }
    else if (rs.pulling) { setArrow(A.clone(), A.clone().addScaledVector(xl, 2.3), true, 0); }
    else if (rs.nocked) { const d = tmp.d.subVectors(B, A).normalize(); setArrow(A.clone(), B.clone().addScaledVector(d, 0.35), true, 0); }
    else setArrow(A, B, false, 0);
  });
  return <primitive object={arrow.grp} />;
}
