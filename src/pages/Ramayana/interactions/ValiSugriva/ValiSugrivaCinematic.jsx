import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, Gauge } from "lucide-react";
import "./ValiSugrivaCinematic.css";
import Fighter from "./Monkey.jsx";
import { Sky, Ground, Forest, Bushes, FX, RamaProps, LightShafts } from "./World.jsx";
import { DURATION, ramaState, RAMA_POS, RELEASE_T, heartPoint } from "./fight.js";
import { G, AIM_T, resetGame } from "./gameState.js";
import { enterAim, tickAim, startDraw, release, hitRadius } from "./aim.js";
import { cameraAt, EVENTS, CHAPTERS, SUBS, HP, timeScale, sinceHit } from "./camera.js";
import { initAudio, setMuted as setAudioMuted, sfx, startBed, stopBed, drum, disposeAudio } from "./audio.js";

const CFG_V = { fur: "#b8742c", furDark: "#6b3d14", furLight: "#e0a456", furTuft: "#c98a3c", skin: "#8a4e32", cloth: "#a8321c", mane: "#e2b062", crown: true, necklace: true, bulk: 1.1, stuckArrow: true, eye: "#c9801e" };
const CFG_S = { fur: "#c9a35c", furDark: "#8a6a30", furLight: "#ecd391", furTuft: "#d4b36e", skin: "#9a6244", cloth: "#c2902f", mane: "#9a7a3e", garland: true, circlet: true, bulk: 1.0, eye: "#6f8a2c" };
const CFG_R = { skin: "#4b7ba8", cloth: "#e8b13a", mane: "#16100c", crown: false, bulk: 0.8, armK: 1.25 };
const CALLOUTS = [
  [2.5, 1.9, "VALI", "KING OF KISHKINDHA"], [3.1, 1.2, "SUGRIVA", "THE EXILED BROTHER"], [8.45, 1.2, "SLIPPED!", "A COUNTER IN THE SHADOW OF THE FIST"],
  [10.1, 1.3, "GUARD BROKEN", "THE KING'S COMBINATION"], [12.1, 1.5, "ROUNDHOUSE", "A KICK THAT SHAKES THE EARTH"], [17.0, 1.4, "FLYING KICK", "SUGRIVA STRIKES BACK"],
  [19.5, 2.0, "MOUNTAIN LIFT", "HOISTED ABOVE THE KING'S HEAD"], [21.5, 1.6, "EARTH SLAM", "THE GROUND CRACKS"], [24.0, 2.4, "RAIN OF FISTS", "NO MERCY"],
  [26.3, 1.4, "KICK-UP!", "THE KING IS THROWN"],
  [33.1, 2.4, "THE HIDDEN ARCHER", "RAMA DRAWS HIS BOW"], [39.9, 2.4, "THE HEART IS PIERCED", "THE ARROW OF DHARMA"],
];
const AUDIO_SRC = "/audio/vali.mp3";
const fmt = (t) => `00:${String(Math.floor(t)).padStart(2, "0")}`;

function Director({ clock }) {
  const { camera } = useThree();
  const o = useMemo(() => ({ fwd: new THREE.Vector3(), ray: new THREE.Vector3(), tmp: new THREE.Vector3(), P: new THREE.Vector3(), right: new THREE.Vector3(), up2: new THREE.Vector3() }), []);
  useFrame(() => {
    const c = cameraAt(clock.t);
    camera.position.set(c.p[0], c.p[1], c.p[2]); camera.lookAt(c.l[0], c.l[1], c.l[2]); if (c.roll) camera.rotateZ(c.roll);
    if (Math.abs(camera.fov - c.fov) > 0.01) { camera.fov = c.fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
    if (G.mode !== "cine" && G.blend > 0.01) {
      camera.getWorldDirection(o.fwd);
      o.ray.set(G.ptr.x, G.ptr.y, 0.5).unproject(camera).sub(camera.position).normalize();
      o.tmp.set(G.heart[0], G.heart[1], G.heart[2]).sub(camera.position);
      const s = o.tmp.dot(o.fwd) / (o.ray.dot(o.fwd) || 1);
      o.P.copy(camera.position).addScaledVector(o.ray, s);
      o.right.crossVectors(o.fwd, camera.up).normalize(); o.up2.crossVectors(o.right, o.fwd).normalize();
      const k = G.sway, ca = G.aimClock;
      const sx = (Math.sin(ca * 1.7) + 0.45 * Math.sin(ca * 3.9 + 1.3)) * k * 0.6, sy = (Math.cos(ca * 1.3) + 0.4 * Math.sin(ca * 3.1 + 0.7)) * k * 0.5;
      o.P.addScaledVector(o.right, sx).addScaledVector(o.up2, sy);
      G.aimPoint = [o.P.x, o.P.y, o.P.z];
      const d = Math.hypot(o.P.x - G.heart[0], o.P.y - G.heart[1], o.P.z - G.heart[2]);
      o.tmp.copy(o.P).project(camera);
      G.reticle.x = o.tmp.x; G.reticle.y = o.tmp.y; G.reticle.on = d <= hitRadius(); G.reticle.d = d;
    }
  });
  return null;
}

const World = React.memo(function World({ clock }) {
  const rigR = useMemo(() => ({}), []);
  const aim = useMemo(() => ramaState(38).aimYaw, []);
  return (<>
    <Director clock={clock} />
    <color attach="background" args={["#d9c59b"]} />
    <fog attach="fog" args={["#d9c59b", 38, 150]} />
    <Sky />
    <ambientLight intensity={0.5} color="#fff0d6" />
    <hemisphereLight args={["#bcd4ee", "#7a6a45", 0.75]} />
    <directionalLight position={[-12, 17, 10]} intensity={3.1} color="#ffe2b0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-near={1} shadow-camera-far={60} shadow-bias={-0.0004} shadow-normalBias={0.05} />
    <directionalLight position={[10, 6, -12]} intensity={1.1} color="#9fb7d8" />
    <pointLight position={[0, 6, -9]} color="#e8b96e" intensity={30} distance={30} />
    <directionalLight position={[6, 7, -14]} intensity={1.6} color="#ffcf8a" />
    <Ground /><Forest /><Bushes aim={aim} /><LightShafts />
    <Sparkles count={70} scale={[30, 8, 30]} position={[0, 4, 0]} size={3} speed={0.25} opacity={0.5} color="#fff0c8" />
    <Fighter who="S" clock={clock} cfg={CFG_S} />
    <Fighter who="V" clock={clock} cfg={CFG_V} />
    <Fighter who="R" clock={clock} cfg={CFG_R} rigOut={rigR} />
    <RamaProps clock={clock} rig={rigR} />
    <FX clock={clock} />
  </>);
});

const Stage = React.memo(function Stage({ clock }) {
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [-13, 8.5, 14], fov: 40, near: 0.1, far: 600 }} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
      <Suspense fallback={null}><World clock={clock} /></Suspense>
    </Canvas>
  );
});

export default function ValiSugrivaCinematic({ onComplete, onExit }) {
  const clock = useRef({ t: 0 }).current;
  const [ui, setUi] = useState({ t: 0 });
  const [playing, setPlaying] = useState(true);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const trackRef = useRef(null);
  const playTrack = useCallback(() => { const a = trackRef.current; if (a && !mutedRef.current) a.play().catch(() => {}); }, []);
  const [slow, setSlow] = useState(false);
  const st = useRef({ playing: true, finished: false, slow: false, last: 0, lastUi: -1, prev: 0, pulse: -1, hold: 0 });
  const fillRef = useRef(), flashRef = useRef(), worldRef = useRef(), reticleRef = useRef(), meterRef = useRef(), stageRef = useRef();
  st.current.playing = playing; st.current.slow = slow;

  useEffect(() => {
    const a = new Audio(AUDIO_SRC); a.preload = "auto"; a.loop = false; a.volume = 0.9; trackRef.current = a;
    a.play().catch(() => {});
    const unlock = () => { initAudio(); setAudioMuted(mutedRef.current); if (st.current.playing && !st.current.finished) playTrack(); };
    window.addEventListener("pointerdown", unlock, { once: true }); window.addEventListener("keydown", unlock, { once: true });
    return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); a.pause(); a.src = ""; trackRef.current = null; };
  }, [playTrack]);
  useEffect(() => { // pause/resume with the cinematic; keep playing through the interactive aim
    const a = trackRef.current; if (!a) return;
    if (playing && !muted) a.play().catch(() => {}); else a.pause();
  }, [playing, muted]);
  useEffect(() => { if (finished && trackRef.current) trackRef.current.pause(); }, [finished]);

  useEffect(() => {
    let raf, now0 = performance.now();
    const tick = (now) => {
      const s = st.current; let dt = Math.min((now - now0) / 1000, 0.1); now0 = now;
      if (s.playing && !s.finished && G.mode !== "cine") {
        tickAim(dt, clock, sfx);
      } else if (s.playing && !s.finished) {
        if (G.sinceRelease >= 0) G.sinceRelease += dt;
        G.blend = Math.max(0, G.blend - dt * 4);
        const prev = clock.t; let step = dt * (s.slow ? 0.35 : 1) * timeScale(prev);
        if (s.hold > 0) { s.hold -= dt; step = 0; }   // hit-stop: freeze a few frames on heavy contact
        clock.t = Math.min(DURATION, prev + step);
        if (!G.done && clock.t >= AIM_T) { clock.t = AIM_T; enterAim(clock); }
        const t = clock.t;
        for (const e of EVENTS) {
          const pre = e.k === "hit" || e.k === "heavy" || e.k === "whiff" || e.k === "block";
          const when = pre ? e.t - 0.12 : e.t;
          if (prev < when && t >= when && t - prev < 0.3) {
            if (pre) sfx("whoosh", e.v);
            else sfx(e.k === "release" ? "release" : e.k === "arrow" ? "arrow" : e.k, e.v);
          }
          if ((e.k === "hit" || e.k === "heavy" || e.k === "block") && prev < e.t && t >= e.t && t - prev < 0.3) {
            sfx(e.k, e.v);
            if (e.k !== "block" && e.v >= 0.8 && (e.w === "V" || e.w === "S")) sfx("grunt", e.w === "V" ? 0.8 : 1.1);
          }
          if (e.hs && prev < e.t && t >= e.t && t - prev < 0.3) s.hold = e.hs;
          if (e.k === "release" && prev < e.t + 0.05 && t >= e.t + 0.05 && t - prev < 0.3) sfx("whistle");
        }
        if (t > 33 && t < 39.9) { const k = Math.floor(t / 0.9); if (k !== s.pulse) { s.pulse = k; drum(0.8); } }
        if (t >= DURATION) { s.finished = true; setFinished(true); setPlaying(false); }
      }
      const t = clock.t;
      if (fillRef.current) fillRef.current.style.width = `${(t / DURATION) * 100}%`;
      if (flashRef.current) { let f = 0; for (const e of EVENTS) { const a = t - e.t; if (e.k === "arrow" && a >= 0 && a < 0.6) f = Math.max(f, 1 - a / 0.6); if (e.k === "slam" && a >= 0 && a < 0.25) f = Math.max(f, 0.5 * (1 - a / 0.25)); if ((e.k === "heavy") && a >= 0 && a < 0.12) f = Math.max(f, 0.22 * (1 - a / 0.12)); } flashRef.current.style.opacity = f.toFixed(3); }
      if (worldRef.current) { const sh = Math.max(0, ...EVENTS.map((e) => (e.k === "slam" || e.k === "arrow" || e.k === "heavy") && t >= e.t && t - e.t < 0.5 ? e.v * (1 - (t - e.t) / 0.5) : 0)); worldRef.current.style.transform = sh > 0 ? `scale(${1 + sh * 0.012})` : "none"; }
      if (reticleRef.current) {
        const aiming = G.mode !== "cine";
        reticleRef.current.style.opacity = aiming ? "1" : "0";
        if (aiming) { reticleRef.current.style.left = `${(G.reticle.x * 0.5 + 0.5) * 100}%`; reticleRef.current.style.top = `${(-G.reticle.y * 0.5 + 0.5) * 100}%`; reticleRef.current.classList.toggle("is-on", G.reticle.on); reticleRef.current.style.setProperty("--gap", `${6 + (1 - G.drawn) * 22 + G.sway * 18}px`); }
      }
      if (meterRef.current) meterRef.current.style.width = `${G.drawn * 100}%`;
      if (Math.abs(t - s.lastUi) > 0.08 || s.lastMode !== G.mode || s.lastMsg !== G.msg) { s.lastUi = t; s.lastMode = G.mode; s.lastMsg = G.msg; setUi({ t, mode: G.mode, msg: G.msgT > 0 ? G.msg : "", misses: G.misses, full: G.drawn >= 0.9 }); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clock]);

  const togglePlay = useCallback(() => { if (st.current.finished) return; setPlaying((p) => !p); }, []);
  const replay = useCallback(() => { const a = trackRef.current; if (a) { a.currentTime = 0; playTrack(); } resetGame(); clock.t = 0; st.current.hold = 0; st.current.finished = false; st.current.pulse = -1; setFinished(false); setPlaying(true); setUi({ t: 0 }); }, [clock, playTrack]);
  const toggleSound = useCallback(() => { setMuted((m) => { const nm = !m; mutedRef.current = nm; if (!nm) { initAudio(); setAudioMuted(false); } else { setAudioMuted(true); } return nm; }); }, []);
  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect(); const u = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const target = u * (DURATION - 0.01); const a = trackRef.current; if (a) { try { a.currentTime = target; } catch (e) {} } resetGame(); st.current.hold = 0;
    if (target > RELEASE_T) { G.done = true; G.shotTarget = heartPoint(40); G.drawn = 1; G.sinceRelease = target - RELEASE_T; }
    else if (target > AIM_T) { clock.t = AIM_T - 0.01; st.current.finished = false; setFinished(false); setUi({ t: clock.t }); return; }
    clock.t = target; st.current.finished = false; setFinished(false); setUi({ t: clock.t });
  };

  useEffect(() => {
    resetGame();
    document.body.style.overflow = "hidden";
    const keyUp = (e) => { if (e.code === "Space" && G.mode === "aim") { e.preventDefault(); release(clock, sfx); } };
    const key = (e) => { if (e.code === "Space") { e.preventDefault(); if (G.mode === "aim") { if (!e.repeat) startDraw(); } else togglePlay(); } else if (e.key === "r" || e.key === "R") replay(); else if (e.key === "m" || e.key === "M") toggleSound(); else if (e.key === "Escape" && onExit) onExit(); };
    window.addEventListener("keydown", key); window.addEventListener("keyup", keyUp);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", key); window.removeEventListener("keyup", keyUp); stopBed(); disposeAudio(); };
  }, [togglePlay, replay, toggleSound, onExit, clock]);

  const t = ui.t;
  const aiming = ui.mode === "aim" || ui.mode === "miss";
  const onPtr = (e) => { const r = stageRef.current.getBoundingClientRect(); G.ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; G.ptr.y = -(((e.clientY - r.top) / r.height) * 2 - 1); };
  const onDown = (e) => { onPtr(e); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } startDraw(); };
  const onUp = (e) => { onPtr(e); release(clock, sfx); };
  let chapter = CHAPTERS[0][1]; for (const c of CHAPTERS) if (t >= c[0]) chapter = c[1];
  if (aiming) chapter = "TAKE THE SHOT";
  const sub = aiming ? null : SUBS.find((s) => t >= s[0] && t < s[1]);
  const call = aiming ? null : CALLOUTS.find((c) => t >= c[0] && t < c[0] + c[1]);
  const hp = HP(t);
  const title = t < 3.4;
  const dmg = { V: sinceHit(t, "V") < 0.5, S: sinceHit(t, "S") < 0.5 };

  return (
    <main className="vs-cinema" ref={stageRef}>
      <div className="vs-cinema__world" ref={worldRef}>
        <Stage clock={clock} />
      </div>
      <div className="vs-cinema__grade" /><div className="vs-cinema__grain" /><div className="vs-cinema__vignette" />
      <div className="vs-cinema__flash" ref={flashRef} />
      <div className="vs-cinema__bar vs-cinema__bar--top" /><div className="vs-cinema__bar vs-cinema__bar--bottom" />

      
      <div className={`vs-cinema__scope ${aiming ? "is-on" : ""}`} />
      <div className="vs-cinema__reticle" ref={reticleRef} style={{ opacity: 0 }}><i /><i /><i /><i /><b /></div>
      {aiming && (
        <div className="vs-cinema__aim" onPointerMove={onPtr} onPointerDown={onDown} onPointerUp={onUp}>
          <div className="vs-cinema__aim-top"><span>THE ARROW OF DHARMA</span><small>{ui.misses ? `MISSES · ${ui.misses}` : "ONE SHOT"}</small></div>
          {ui.msg && <div className="vs-cinema__aim-msg" key={ui.msg}>{ui.msg}</div>}
          <div className="vs-cinema__aim-bottom">
            <div className={`vs-cinema__draw ${ui.full ? "is-full" : ""}`}><div ref={meterRef} /></div>
            <p><b>MOVE</b> to aim <i>·</i> <b>HOLD</b> to draw <i>·</i> <b>RELEASE</b> to shoot <i>·</i> <span>the heart, not the head — Vali's chest rises and falls</span></p>
          </div>
        </div>
      )}

      <header className="vs-cinema__header">
        <div className="vs-cinema__logo"><span>✦</span>ANCESTRA<i /><small>THE RAMAYANA</small></div>
        <button className="vs-cinema__exit" onClick={onExit} type="button" aria-label="Exit cinematic"><X size={19} /></button>
      </header>

      <div className="vs-cinema__hud">
        <div className={`vs-cinema__fighter vs-cinema__fighter--l ${dmg.V ? "is-hurt" : ""}`}>
          <b>VALI</b><small>KING OF KISHKINDHA</small>
          <div className="vs-cinema__hp"><div style={{ width: `${hp.V * 100}%` }} /></div>
        </div>
        <div className="vs-cinema__vs">VS</div>
        <div className={`vs-cinema__fighter vs-cinema__fighter--r ${dmg.S ? "is-hurt" : ""}`}>
          <b>SUGRIVA</b><small>THE EXILED BROTHER</small>
          <div className="vs-cinema__hp vs-cinema__hp--r"><div style={{ width: `${hp.S * 100}%` }} /></div>
        </div>
      </div>

      <div className="vs-cinema__scene-name"><span>{chapter}</span></div>
      {title && (<div className="vs-cinema__title" style={{ opacity: Math.min(1, (3.4 - t) * 1.5) }}><p>THE BROTHERS OF KISHKINDHA</p><h1>Vali <em>vs</em> Sugriva</h1></div>)}
      {call && (<div className="vs-cinema__callout" key={call[2]}><strong>{call[2]}</strong><span>{call[3]}</span></div>)}
      {sub && !title && <div className="vs-cinema__sub" key={sub[0]}>{sub[2]}</div>}

      <div className="vs-cinema__bottom">
        <div className="vs-cinema__progress" onClick={seek} role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={DURATION} aria-valuenow={Math.round(t)}>
          <div className="vs-cinema__progress-fill" ref={fillRef} />
        </div>
        <div className="vs-cinema__controls">
          <span className="vs-cinema__time">{fmt(t)}<i>/</i>{fmt(DURATION)}</span>
          <div className="vs-cinema__buttons">
            <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
            <button type="button" onClick={replay} aria-label="Replay"><RotateCcw size={16} /></button>
            <button type="button" onClick={toggleSound} aria-label="Toggle sound">{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
            <button type="button" className={slow ? "is-on" : ""} onClick={() => setSlow((s) => !s)} aria-label="Slow motion"><Gauge size={16} /></button>
          </div>
          <span className="vs-cinema__duration">A CINEMATIC CHRONICLE</span>
        </div>
      </div>

      {finished && (
        <div className="vs-cinema__ending"><div className="vs-cinema__ending-card">
          <span>✦ THE CHRONICLE CONTINUES ✦</span><h2>The Fall of Vali</h2>
          <p>One arrow from the thicket ended the reign of the golden king. What remains is not merely the end of a duel, but a question of dharma that will echo through every chapter to come.</p>
          <div className="vs-cinema__ending-actions">
            <button type="button" onClick={replay}><RotateCcw size={15} /> REPLAY</button>
            <button type="button" onClick={onComplete}>RETURN TO CHAPTER <span>→</span></button>
          </div>
        </div></div>
      )}
    </main>
  );
}
