import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform
} from "framer-motion";
import { ArrowRight, X, Flame } from "lucide-react";
import "./PromiseOfFire.css";

/* ------------------------------------------------------------------ */
/*  Story data                                                         */
/* ------------------------------------------------------------------ */

const SCENES = {
  sugriva: {
    label: "The first vow",
    name: "Sugriva",
    role: "King of the Vanaras",
    text: "I, Sugriva, promise to help you in your search for Sita.",
    yaw: 0.34,
    side: 1 // vow light streams in from the right
  },
  rama: {
    label: "The answering vow",
    name: "Rama",
    role: "Prince of Ayodhya",
    text: "I, Rama, promise to help you regain your kingdom.",
    yaw: -0.34,
    side: -1 // ...and from the left
  }
};

// How strongly the sacred fire burns in each phase
const BURN = { sugriva: 1, rama: 1.35, awakening: 4.4, complete: 0.9 };
const HOLD_MS = 1500;

/* ------------------------------------------------------------------ */
/*  Little synthesized chime (no audio files needed)                   */
/* ------------------------------------------------------------------ */

function chime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      const t0 = ac.currentTime + i * 0.1;
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.1, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2);
      o.connect(g);
      g.connect(ac.destination);
      o.start(t0);
      o.stop(t0 + 2.1);
    });
    setTimeout(() => ac.close(), 3200);
  } catch (e) {
    /* audio is optional */
  }
}

/* ------------------------------------------------------------------ */
/*  Real-time 3D fire engine (canvas, perspective projected, no deps)  */
/*  Daytime edition: normal blending so the fire reads in sunlight.    */
/* ------------------------------------------------------------------ */

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const PALETTE = [
  "255,252,232", "255,232,150", "255,186,70",
  "255,128,34", "226,76,18", "150,40,12", "80,26,10"
];
const PETAL_COLORS = ["255,170,190", "255,196,90", "255,140,120", "255,226,150"];

function makeSprite(rgb) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, `rgba(${rgb},1)`);
  r.addColorStop(0.4, `rgba(${rgb},.45)`);
  r.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return c;
}

function startFire(cv, live) {
  const ctx = cv.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const flames = PALETTE.map(makeSprite);
  const gold = makeSprite("255,214,120");
  const amber = makeSprite("255,170,60");
  const sky = makeSprite("130,200,255");
  const smoke = makeSprite("88,78,72");
  const pollen = makeSprite("255,246,206");

  const cam = { yaw: 0, pitch: 0.38 };
  const mouse = { x: 0, y: 0 };
  const P = [];   // flame volume
  const S = [];   // embers
  const K = [];   // smoke
  const V = [];   // vow streams

  const motes = Array.from({ length: 64 }, () => ({
    x: rand(-850, 850), y: rand(-480, 260), z: rand(-500, 600),
    s: rand(0.6, 1.7), p: rand(0, 6.3)
  }));

  const petals = Array.from({ length: 34 }, (_, i) => ({
    x: rand(-900, 900), y: rand(-520, 20), z: rand(-420, 520),
    s: rand(5, 9), p: rand(0, 6.3), r: rand(0, 6.3),
    v: rand(14, 30), c: PETAL_COLORS[i % PETAL_COLORS.length]
  }));

  const stones = Array.from({ length: 16 }, (_, i) => ({
    q: (i / 16) * TAU + rand(-0.1, 0.1),
    r: 66 + rand(-4, 6),
    s: rand(0.85, 1.2)
  }));

  const logs = Array.from({ length: 5 }, (_, i) => ({ q: (i / 5) * TAU + 0.3 }));

  let w = 0, h = 0, u = 1, cx = 0, cy = 0, t = 0, raf = 0;
  let vAcc = 0, kAcc = 0, lastWave = live.wave || 0, waveT = -99;
  let last = performance.now();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    u = Math.max(0.55, Math.min(1.05, Math.min(w, h * 1.2) / 900));
    cx = w / 2;
    cy = w < 700 ? h * 0.43 : h * 0.5;
  };

  // y is "down" in world space; the floor sits at y = 20
  const proj = (x, y, z) => {
    const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
    const X = x * c - z * s;
    let Z = x * s + z * c;
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const Y = y * cp - Z * sp;
    Z = y * sp + Z * cp;
    const f = 900 / (900 + Z);
    return [cx + X * f * u, cy + Y * f * u, f * u, Z];
  };

  const ring = (r, n, alpha, rot, dash, lw = 1.3, col = "255,214,130") => {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const q = rot + (i / n) * TAU;
      const [x, y] = proj(Math.cos(q) * r, 20, Math.sin(q) * r);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.setLineDash(dash || []);
    ctx.strokeStyle = `rgba(${col},${alpha})`;
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const sprite = (spr, x, y, sz, a) => {
    ctx.globalAlpha = a;
    ctx.drawImage(spr, x - sz, y - sz, sz * 2, sz * 2);
  };

  const drawStone = (st, zc, wantFar) => {
    const [x, y, f, Z] = proj(Math.cos(st.q) * st.r, 14, Math.sin(st.q) * st.r);
    if ((Z > zc) !== wantFar) return;
    const rx = 21 * st.s * f, ry = 13 * st.s * f;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#3b322c";
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#6a5d52";
    ctx.beginPath(); ctx.ellipse(x - rx * 0.1, y - ry * 0.3, rx * 0.78, ry * 0.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,170,80,.35)";
    ctx.beginPath(); ctx.ellipse(x, y - ry * 0.1, rx * 0.5, ry * 0.3, 0, 0, TAU); ctx.fill();
  };

  const frame = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now; t += dt;
    live.i += (live.t - live.i) * Math.min(1, dt * 3);
    const I = live.i;

    cam.yaw += (live.yaw + (reduced ? 0 : mouse.x * 0.3) - cam.yaw) * Math.min(1, dt * 2.2);
    cam.pitch += (0.38 + (reduced ? 0 : mouse.y * 0.06) - cam.pitch) * Math.min(1, dt * 2.2);

    // awakening shockwave + ember burst
    if (live.wave !== lastWave) {
      lastWave = live.wave; waveT = t;
      for (let i = 0; i < 220; i++) {
        S.push({
          x: rand(-30, 30), y: -10, z: rand(-30, 30),
          vx: rand(-180, 180), vy: -rand(200, 560), vz: rand(-180, 180),
          life: 1, d: rand(0.2, 0.5), ph: rand(0, 6.3)
        });
      }
    }

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";

    const zc = proj(0, 20, 0)[3];

    // sunlit pollen with real depth parallax
    for (const m of motes) {
      m.y -= 6 * dt; if (m.y < -500) m.y = 280;
      const [x, y, f] = proj(m.x + Math.sin(t * 0.4 + m.p) * 22, m.y, m.z);
      sprite(pollen, x, y, 7 * m.s * f, (0.3 + 0.25 * Math.sin(t + m.p)) * Math.min(1, f));
    }

    // drifting blossom petals
    for (const p of petals) {
      p.y += p.v * dt; p.x += Math.sin(t * 0.7 + p.p) * 22 * dt; p.r += dt * 1.6;
      if (p.y > 30) { p.y = -540; p.x = rand(-900, 900); }
      const [x, y, f] = proj(p.x, p.y, p.z);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.r);
      ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(t * 1.4 + p.p)));
      ctx.globalAlpha = 0.85 * Math.min(1, f);
      ctx.fillStyle = `rgba(${p.c},1)`;
      ctx.beginPath(); ctx.ellipse(0, 0, p.s * f, p.s * 0.55 * f, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // floor light pool
    const [gx, gy] = proj(0, 20, 0);
    ctx.save();
    ctx.translate(gx, gy); ctx.scale(1, 0.4);
    const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, 440 * u);
    pool.addColorStop(0, `rgba(255,160,60,${Math.min(0.75, 0.34 * I)})`);
    pool.addColorStop(1, "rgba(255,110,30,0)");
    ctx.globalAlpha = 1; ctx.fillStyle = pool;
    ctx.beginPath(); ctx.arc(0, 0, 440 * u, 0, TAU); ctx.fill();
    ctx.restore();

    // glowing yantra etched into the ground
    const grow = 1 + Math.min(I, 4.4) * 0.07;
    ring(150 * grow, 90, 0.7, t * 0.1, null, 1.6);
    ring(235 * grow, 120, 0.5, -t * 0.07, [2, 9], 1.6);
    ring(325 * grow, 150, 0.38, t * 0.05);
    for (let i = 0; i < 12; i++) {
      const q = t * 0.1 + (i / 12) * TAU;
      const [x1, y1] = proj(Math.cos(q) * 150 * grow, 20, Math.sin(q) * 150 * grow);
      const [x2, y2] = proj(Math.cos(q) * 325 * grow, 20, Math.sin(q) * 325 * grow);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(255,214,130,.2)"; ctx.lineWidth = 1; ctx.stroke();
    }

    // shockwave across the ground
    const wq = t - waveT;
    if (wq >= 0 && wq < 1.8) {
      ring(wq * 700 + 20, 140, Math.max(0, 1 - wq / 1.8), 0, null, 4, "255,236,160");
      ring(wq * 520 + 10, 140, Math.max(0, 0.7 - wq / 2.2), 0, null, 2, "255,190,90");
    }

    // far stones and the logs under the flame
    for (const st of stones) drawStone(st, zc, true);
    for (const lg of logs) {
      const [x1, y1, f1] = proj(Math.cos(lg.q) * 74, 10, Math.sin(lg.q) * 74);
      const [x2, y2] = proj(Math.cos(lg.q) * 8, 2, Math.sin(lg.q) * 8);
      ctx.globalAlpha = 1; ctx.lineCap = "round";
      ctx.strokeStyle = "#2c1a0e"; ctx.lineWidth = 13 * f1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,${110 + Math.min(I, 3) * 20},40,${Math.min(0.85, 0.35 + I * 0.15)})`;
      ctx.lineWidth = 4 * f1;
      ctx.beginPath(); ctx.moveTo(x1 + (x2 - x1) * 0.45, y1 + (y2 - y1) * 0.45); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.lineCap = "butt";
    }

    // warm bloom around the flame
    const [bx, by] = proj(0, -120, 0);
    const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, 380 * u * (0.6 + 0.25 * I));
    bloom.addColorStop(0, `rgba(255,170,70,${Math.min(0.42, 0.14 * I)})`);
    bloom.addColorStop(1, "rgba(255,120,30,0)");
    ctx.globalAlpha = 1; ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);

    // flame volume
    let n = Math.round((9 + I * 5) * dt * 60 * (reduced ? 0.5 : 1));
    while (n-- > 0 && P.length < 900) {
      const a = rand(0, TAU), r = Math.sqrt(Math.random()) * 34;
      P.push({
        x: Math.cos(a) * r, y: 12, z: Math.sin(a) * r,
        vy: -rand(150, 250) * (0.8 + I * 0.35),
        life: 1, d: rand(0.7, 1.1), s: rand(28, 54), ph: rand(0, 6.3)
      });
    }
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life -= dt * p.d;
      if (p.life <= 0) { P[i] = P[P.length - 1]; P.pop(); continue; }
      p.x += (Math.sin(t * 4 + p.ph) * 26 - p.x * 1.4) * dt;
      p.z += (Math.cos(t * 3.2 + p.ph) * 26 - p.z * 1.4) * dt;
      p.y += p.vy * dt; p.vy *= 0.996;
      const [x, y, f] = proj(p.x, p.y, p.z);
      const sz = p.s * f * (0.5 + 0.9 * p.life);
      const spr = flames[Math.min(PALETTE.length - 1, Math.floor((1 - p.life) * PALETTE.length))];
      sprite(spr, x, y, sz, Math.min(1, p.life * 0.62 + 0.05));
    }

    // near stones sit in front of the fire
    for (const st of stones) drawStone(st, zc, false);

    // rising smoke
    kAcc += dt * (5 + I * 2);
    while (kAcc >= 1 && K.length < 70) {
      kAcc -= 1;
      K.push({ x: rand(-14, 14), y: -190 - rand(0, 40), z: rand(-14, 14), vy: -rand(40, 80), life: 1, d: rand(0.22, 0.4), s: rand(26, 46), ph: rand(0, 6.3) });
    }
    kAcc = Math.min(kAcc, 1);
    for (let i = K.length - 1; i >= 0; i--) {
      const k = K[i];
      k.life -= dt * k.d;
      if (k.life <= 0) { K[i] = K[K.length - 1]; K.pop(); continue; }
      k.x += Math.sin(t * 1.3 + k.ph) * 18 * dt;
      k.y += k.vy * dt;
      const [x, y, f] = proj(k.x, k.y, k.z);
      sprite(smoke, x, y, k.s * f * (1.4 - 0.6 * k.life), k.life * 0.16);
    }

    // flying embers
    if (Math.random() < dt * (14 + I * 40) && S.length < 160) {
      S.push({
        x: rand(-20, 20), y: -10, z: rand(-20, 20),
        vx: rand(-60, 60), vy: -rand(140, 320) * (0.8 + I * 0.2), vz: rand(-60, 60),
        life: 1, d: rand(0.22, 0.55), ph: rand(0, 6.3)
      });
    }
    for (let i = S.length - 1; i >= 0; i--) {
      const s = S[i];
      s.life -= dt * s.d;
      if (s.life <= 0) { S[i] = S[S.length - 1]; S.pop(); continue; }
      s.x += (s.vx + Math.sin(t * 5 + s.ph) * 40) * dt;
      s.z += (s.vz + Math.cos(t * 4 + s.ph) * 40) * dt;
      s.y += s.vy * dt;
      const [x, y, f] = proj(s.x, s.y, s.z);
      const sz = (6 + 6 * s.life) * f;
      sprite(amber, x, y, sz, s.life * (0.7 + 0.3 * Math.sin(t * 30 + s.ph)));
    }

    // vow streams: the speaker's promise spirals into the fire
    vAcc += dt * (live.spk ? 55 : 0);
    while (vAcc >= 1 && V.length < 140) {
      vAcc -= 1;
      V.push({
        sgn: live.spk, a: live.spk > 0 ? rand(-0.4, 0.4) : Math.PI + rand(-0.4, 0.4),
        s: 0, sp: rand(0.32, 0.55), hgt: rand(-170, -10), ph: rand(0, 6.3)
      });
    }
    vAcc = Math.min(vAcc, 2);
    for (let i = V.length - 1; i >= 0; i--) {
      const v = V[i];
      v.s += dt * v.sp;
      if (v.s >= 1) { V[i] = V[V.length - 1]; V.pop(); continue; }
      v.a += dt * (1.2 + v.s * 4.2) * v.sgn;
      const rr = 440 * Math.pow(1 - v.s, 1.15) + 12;
      const [x, y, f] = proj(Math.cos(v.a) * rr, v.hgt * (1 - v.s) - 70 * v.s + Math.sin(t * 3 + v.ph) * 6, Math.sin(v.a) * rr);
      const al = Math.sin(v.s * Math.PI);
      sprite(v.sgn > 0 ? gold : sky, x, y, 17 * f * (1 - 0.45 * v.s), al * 0.95);
      sprite(v.sgn > 0 ? amber : gold, x, y, 7 * f, al);
    }

    // orbiting sacred sparks
    for (let i = 0; i < 14; i++) {
      const q = -t * (0.25 + I * 0.18) + (i / 14) * TAU;
      const [x, y, f] = proj(Math.cos(q) * 235 * grow, 8 - Math.sin(t * 2 + i) * 10, Math.sin(q) * 235 * grow);
      sprite(gold, x, y, 16 * f, 0.95);
      sprite(pollen, x, y, 6 * f, 1);
    }

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  };

  const onMove = (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onMove);
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
  };
}

/* ------------------------------------------------------------------ */
/*  Procedural jungle silhouettes                                      */
/* ------------------------------------------------------------------ */

function ridge(seed, n, lo, hi) {
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pts = ["0% 100%"];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * 100;
    pts.push(`${x.toFixed(1)}% ${(lo + r() * (hi - lo)).toFixed(1)}%`);
    if (i < n) pts.push(`${(x + 50 / n).toFixed(1)}% ${(hi + (100 - hi) * 0.25 + r() * 6).toFixed(1)}%`);
  }
  pts.push("100% 100%");
  return `polygon(${pts.join(",")})`;
}

/* ------------------------------------------------------------------ */
/*  Sky details                                                        */
/* ------------------------------------------------------------------ */

const CLOUDS = [
  { top: "9%", w: "26vw", o: 0.92, t: "150s", d: "-40s" },
  { top: "20%", w: "18vw", o: 0.8, t: "110s", d: "-90s" },
  { top: "31%", w: "30vw", o: 0.7, t: "190s", d: "-10s" },
  { top: "14%", w: "14vw", o: 0.85, t: "130s", d: "-120s" }
];

const BIRDS = [
  { y: "19%", t: "34s", d: "-6s" },
  { y: "23%", t: "34s", d: "-4.6s" },
  { y: "17%", t: "34s", d: "-5.2s" },
  { y: "28%", t: "48s", d: "-30s" }
];

function Bird({ y, t, d }) {
  return (
    <span className="pf-bird" style={{ "--y": y, "--t": t, "--d": d }} aria-hidden="true">
      <svg viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M1 9 Q7 1 13 8 Q19 1 25 9" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  3D tilt card for the final reveal                                  */
/* ------------------------------------------------------------------ */

function TiltCard({ src, alt }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 120, damping: 16 });
  const sy = useSpring(y, { stiffness: 120, damping: 16 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [14, -14]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-10, 10]);
  const sheen = useTransform(sx, (v) => `${50 + v * 160}% 50%`);

  const move = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - b.left) / b.width - 0.5);
    y.set((e.clientY - b.top) / b.height - 0.5);
  };

  return (
    <div
      className="pf-tilt"
      onPointerMove={move}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      <motion.div
        className="pf-card"
        style={{ rotateX, rotateY }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <img className="pf-card__img" src={src} alt={alt} />
        <motion.div className="pf-card__sheen" style={{ backgroundPosition: sheen }} />
        <div className="pf-card__frame" />
        <i className="pf-card__corner pf-card__corner--tl" />
        <i className="pf-card__corner pf-card__corner--tr" />
        <i className="pf-card__corner pf-card__corner--bl" />
        <i className="pf-card__corner pf-card__corner--br" />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main experience                                                    */
/* ------------------------------------------------------------------ */

export default function PromiseOfFire({ onComplete, onExit }) {
  const [phase, setPhase] = useState("sugriva");
  const [typed, setTyped] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const [hold, setHold] = useState(0);

  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const posRef = useRef(0);
  const holdRaf = useRef(0);
  const live = useRef({ i: 1, t: 1, yaw: 0.34, spk: 1, wave: 0 });

  const scene = SCENES[phase];
  const isTalking = phase === "sugriva" || phase === "rama";
  const isAwakening = phase === "awakening";
  const isComplete = phase === "complete";

  const layers = useMemo(
    () => ({
      far: ridge(7, 9, 34, 54),
      mid: ridge(21, 22, 46, 68),
      near: ridge(88, 34, 68, 88)
    }),
    []
  );

  // 3D fire engine lifecycle
  useEffect(() => startFire(canvasRef.current, live.current), []);

  // Scene drives fire intensity, camera swing and the vow stream
  useEffect(() => {
    live.current.t = BURN[phase];
    live.current.yaw = scene ? scene.yaw : 0;
    live.current.spk = scene ? scene.side : 0;
    if (isAwakening) live.current.wave += 1;
  }, [phase, scene, isAwakening]);

  // Mouse parallax for the sky and jungle layers (CSS variables, no re-render)
  useEffect(() => {
    const el = rootRef.current;
    const move = (e) => {
      el.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5).toFixed(3));
      el.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5).toFixed(3));
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  // Typewriter
  useEffect(() => {
    if (!isTalking) return;
    const full = SCENES[phase].text;
    posRef.current = 0;
    setTyped("");
    setTypingDone(false);
    let interval;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        posRef.current += 1;
        setTyped(full.slice(0, posRef.current));
        if (posRef.current >= full.length) {
          window.clearInterval(interval);
          setTypingDone(true);
        }
      }, 38);
    }, 900);
    return () => { window.clearTimeout(start); window.clearInterval(interval); };
  }, [phase, isTalking]);

  // Awakening -> reveal (with a soft chime and a buzz on phones)
  useEffect(() => {
    if (!isAwakening) return;
    chime();
    if (navigator.vibrate) navigator.vibrate([30, 40, 90]);
    const timer = window.setTimeout(() => setPhase("complete"), 2100);
    return () => window.clearTimeout(timer);
  }, [isAwakening]);

  // Escape exits
  useEffect(() => {
    const key = (e) => { if (e.key === "Escape" && onExit) onExit(); };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); cancelAnimationFrame(holdRaf.current); };
  }, [onExit]);

  const skipTyping = () => {
    if (!isTalking || typingDone) return;
    posRef.current = SCENES[phase].text.length;
    setTyped(SCENES[phase].text);
    setTypingDone(true);
  };

  const hearResponse = () => typingDone && setPhase("rama");

  // Press and hold to feed the fire and seal the promise
  const startHold = useCallback(() => {
    if (phase !== "rama" || !typingDone) return;
    const t0 = performance.now();
    cancelAnimationFrame(holdRaf.current);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / HOLD_MS);
      setHold(p);
      live.current.t = BURN.rama + p * 2.2;
      if (p >= 1) { setPhase("awakening"); return; }
      holdRaf.current = requestAnimationFrame(tick);
    };
    holdRaf.current = requestAnimationFrame(tick);
  }, [phase, typingDone]);

  const endHold = useCallback(() => {
    cancelAnimationFrame(holdRaf.current);
    if (phase === "rama") { setHold(0); live.current.t = BURN.rama; }
  }, [phase]);

  const finish = () => (onComplete ? onComplete() : onExit && onExit());

  const step = phase === "sugriva" ? 1 : phase === "rama" ? 2 : 3;

  return (
    <main
      ref={rootRef}
      className={`pf pf--${phase}`}
      style={{ "--mx": 0, "--my": 0 }}
      aria-label="The Promise of Fire"
    >
      {/* Daytime sky: sun, rays, clouds, birds */}
      <div className="pf-sky" />
      <div className="pf-sunwrap" aria-hidden="true">
        <div className="pf-rays" />
        <div className="pf-sun" />
      </div>
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="pf-cloud"
          aria-hidden="true"
          style={{ top: c.top, "--w": c.w, "--o": c.o, "--t": c.t, "--d": c.d }}
        />
      ))}
      {BIRDS.map((b, i) => <Bird key={i} {...b} />)}

      {/* Parallax jungle */}
      <div className="pf-ridge pf-ridge--far" style={{ clipPath: layers.far }} />
      <div className="pf-ridge pf-ridge--mid" style={{ clipPath: layers.mid }} />
      <div className="pf-ground" />
      <div className="pf-mist" />

      {/* Real-time 3D fire */}
      <canvas ref={canvasRef} className="pf-canvas" aria-hidden="true" />

      <div className="pf-ridge pf-ridge--near" style={{ clipPath: layers.near }} />
      <div className="pf-vignette" />
      <div className="pf-grain" />

      {/* Top bar */}
      <header className="pf-top">
        <div className="pf-brand">
          <span className="pf-brand__mark">✦</span>
          <span className="pf-brand__name">Ancestra</span>
          <i />
          <small>Kishkindha Kanda</small>
        </div>
        {!isComplete && (
          <button className="pf-close" type="button" onClick={onExit} aria-label="Exit experience">
            <X size={19} strokeWidth={1.6} />
          </button>
        )}
      </header>

      {/* Title (centered) */}
      {!isComplete && (
        <motion.div
          className="pf-title"
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: isAwakening ? 0 : 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="pf-title__eyebrow"><Flame size={13} /> A sacred friendship</span>
          <h1>The Promise of Fire</h1>
          <p>Two lives, two promises, one sacred bond.</p>
        </motion.div>
      )}

      {/* Dialogue docked bottom-center */}
      <section className="pf-stage">
        <div className="pf-dock">
          <AnimatePresence mode="wait">
            {isTalking && (
              <motion.div
                key={phase}
                className="pf-dialogue"
                initial={{ opacity: 0, y: 50, scale: 0.96, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 24, scale: 0.98, filter: "blur(6px)" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                onClick={skipTyping}
              >
                <span className="pf-dialogue__label">{scene.label}</span>
                <h2>{scene.name}</h2>
                <span className="pf-dialogue__role">{scene.role}</span>
                <div className="pf-rule"><i /><span>✦</span><i /></div>

                <p className="pf-spoken" aria-live="polite">
                  “{typed}”
                  {!typingDone && <span className="pf-cursor">|</span>}
                </p>

                {typingDone && phase === "sugriva" && (
                  <motion.button
                    className="pf-btn"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); hearResponse(); }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span>Hear the reply</span>
                    <ArrowRight size={15} />
                  </motion.button>
                )}

                {typingDone && phase === "rama" && (
                  <motion.button
                    className="pf-btn pf-btn--seal"
                    type="button"
                    onPointerDown={startHold}
                    onPointerUp={endHold}
                    onPointerLeave={endHold}
                    onPointerCancel={endHold}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                        e.preventDefault();
                        startHold();
                      }
                    }}
                    onKeyUp={(e) => {
                      if (e.key === "Enter" || e.key === " ") endHold();
                    }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <i className="pf-btn__fill" style={{ transform: `scaleX(${hold})` }} />
                    <span>{hold > 0 ? "Keep holding…" : "Hold to seal the promise"}</span>
                    <Flame size={15} />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Awakening flash */}
        {isAwakening && (
          <>
            <motion.div
              className="pf-flash"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 1, 0] }}
              transition={{ duration: 2, times: [0, 0.3, 0.7, 1] }}
            />
            <motion.div
              className="pf-shock"
              initial={{ scale: 0.1, opacity: 0.9 }}
              animate={{ scale: 9, opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            />
          </>
        )}

        {/* Final reveal */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              className="pf-reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
            >
              <div className="pf-halo" aria-hidden="true" />

              <motion.div
                initial={{ opacity: 0, scale: 0.86, y: 40, filter: "blur(14px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard
                  src="/images/ramayana/interactions/ch10g1-pledge.jpg"
                  alt="Rama and Sugriva clasping hands in their sacred pledge"
                />
              </motion.div>

              <motion.div
                className="pf-reveal__copy"
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.1 }}
              >
                <h2>The promise is made</h2>
                <div className="pf-rule pf-rule--center"><i /><span>✦</span><i /></div>
                <p>
                  Before the sacred fire, their words became a bond.
                  Their paths were now joined by trust and duty.
                </p>
                <button className="pf-btn pf-btn--finish" type="button" onClick={finish}>
                  <span>Return to the chronicle</span>
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Progress */}
      {!isComplete && (
        <footer className="pf-foot">
          <span>The Promise of Fire</span>
          <div className="pf-progress" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <i key={n} className={n < step ? "is-done" : n === step ? "is-active" : ""} />
            ))}
          </div>
          <span>{step} of 3</span>
        </footer>
      )}
    </main>
  );
}