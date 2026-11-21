import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Anchor, ArrowRight, Check, Compass, Hammer, Home, Leaf, Mountain, RotateCcw, Shield, Trees, Waves, X } from "lucide-react";
import "./AHomeInChitrakuta.css";

/* ANCESTRA — A HOME IN CHITRAKUTA
   Drag (or tap) a piece onto the site, then tap the hut to build it.
   stats = [shelter, stability, harmony], 1–3 each */

const TAPS = 5;
const range = (n) => Array.from({ length: n }, (_, i) => i);

const STAGES = [
  { title: "Choose the site", icon: Compass, items: [
    { id: "river", name: "Riverside", Icon: Waves, stats: [1, 2, 3] },
    { id: "woodland", name: "Woodland", Icon: Mountain, stats: [2, 3, 1] },
    { id: "grove", name: "Grove", Icon: Trees, stats: [3, 1, 2] } ] },
  { title: "Lay the foundation", icon: Mountain, items: [
    { id: "stone", name: "Stone", Icon: Mountain, stats: [2, 3, 1] },
    { id: "earth", name: "Earth", Icon: Leaf, stats: [1, 2, 3] },
    { id: "wood", name: "Timber", Icon: Trees, stats: [2, 2, 2] } ] },
  { title: "Raise the walls", icon: Trees, items: [
    { id: "bamboo", name: "Bamboo", Icon: Trees, stats: [1, 2, 3] },
    { id: "woodwall", name: "Logs", Icon: Home, stats: [3, 2, 1] },
    { id: "woven", name: "Reed", Icon: Leaf, stats: [2, 1, 3] } ] },
  { title: "Raise the roof", icon: Home, items: [
    { id: "thatch", name: "Thatch", Icon: Leaf, stats: [3, 1, 2] },
    { id: "leafroof", name: "Leaves", Icon: Trees, stats: [1, 2, 3] },
    { id: "timberroof", name: "Timber", Icon: Home, stats: [2, 3, 1] } ] },
  { title: "Make it home", icon: Leaf, items: [
    { id: "simple", name: "Simple", Icon: Home, stats: [1, 2, 3] },
    { id: "garden", name: "Garden", Icon: Leaf, stats: [2, 1, 3] },
    { id: "courtyard", name: "Courtyard", Icon: Compass, stats: [1, 3, 2] } ] },
];

const METERS = [Shield, Anchor, Leaf];
const METER_NAMES = ["Shelter", "Stability", "Harmony"];
const CHARACTERS = ["Sheltered Hearth", "Steadfast Hearth", "Harmonious Hearth"];
const CAM = ["wide", "base", "walls", "roof", "wide"];
const LIFT = { stone: 28, earth: 17, wood: 50 };

const TREES = {
  river: [[120, 470, 1.15, 0], [250, 455, 0.8, 1], [880, 470, 1.15, 2], [760, 455, 0.8, 1], [20, 440, 0.9, 2], [980, 440, 0.9, 0]],
  woodland: [[70, 440, 1.35, 0], [205, 430, 1, 1], [330, 405, 0.62, 2], [930, 440, 1.35, 2], [795, 430, 1, 1], [670, 405, 0.62, 0]],
  grove: [[30, 470, 1.6, 0], [160, 455, 1.25, 1], [285, 430, 0.95, 2], [385, 410, 0.62, 1], [970, 470, 1.6, 2], [840, 455, 1.25, 1], [715, 430, 0.95, 0], [615, 410, 0.62, 1]],
};
const LEAF_TONES = [["#4f7a45", "#5f8a4f", "#6f9a58"], ["#5c8148", "#4a7340", "#79a25c"], ["#3f6a42", "#4d7a48", "#5a8750"]];
const FAR = range(26).map((i) => ({ cx: -10 + i * 42, cy: 352 + (i % 3) * 7, r: 24 + (i % 4) * 5 }));
const FLIES = range(16).map((i) => ({ l: (i * 47 + 9) % 100, t: 30 + ((i * 29) % 60), d: (i % 8) * 0.8, s: 6 + (i % 5) * 1.5 }));
const LEAVES = range(7).flatMap((r) => range(17).map((k) => ({ r, k, x: -190 + k * 24 + (r % 2) * 12, y: -118 + r * 17, rot: ((k * 37 + r * 53) % 50) - 25, t: (k + r * 2) % 3 })));
const LEAF_FILL = ["#5f8a45", "#4d7a3c", "#74a052"];

/* ---------- scene pieces ---------- */

const Tree = ({ x, y, s, t, i }) => {
  const [a, b, c] = LEAF_TONES[t];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="8" cy="3" rx="52" ry="9" fill="rgba(10,20,10,.3)" />
      <g className="ck-tree" style={{ animationDelay: `${-i * 0.7}s` }}>
        <path d="M-8 0Q-5 -50 -10 -96L10 -96Q5 -50 8 0Z" fill="#5a4330" />
        <ellipse cx="0" cy="-122" rx="64" ry="52" fill={a} />
        <ellipse cx="-40" cy="-98" rx="44" ry="35" fill={b} />
        <ellipse cx="42" cy="-102" rx="46" ry="37" fill={b} />
        <ellipse cx="-8" cy="-146" rx="36" ry="27" fill={c} />
      </g>
    </g>
  );
};

const Person = ({ x, y, robe, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cy="1" rx="14" ry="3" fill="rgba(0,0,0,.3)" />
    <g className="ck-fig">
      <path d="M-10 -4Q-12 -34 -6 -44H6Q12 -34 10 -4Z" fill={robe} />
      <circle cy="-53" r="8" fill="#b07c53" />
      <path d="M-8 -55Q0 -68 8 -55Q0 -60 -8 -55Z" fill="#2a1d14" />
    </g>
  </g>
);

const Clip = ({ id, x, y, w, h, p, axis = "y" }) => (
  <clipPath id={id}>
    <rect className={`ck-clip ${axis}`} x={x} y={y} width={w} height={h} style={{ transform: axis === "y" ? `scaleY(${p})` : `scaleX(${p})` }} />
  </clipPath>
);

function Scene({ site, base, walls, roof, home, p, stage, final, tapKey, over, building, onTap }) {
  const groundY = site === "woodland" ? 456 : site === "grove" ? 478 : 476;
  const lift = LIFT[base] ?? 24;
  const wallTop = lift + 110;
  const zy = [-30, -16, -lift - 55, -wallTop - 60, 36][stage];
  const cur = (i) => (!final && stage === i ? "is-cur" : "");
  const ghost = (i, shape) =>
    p[i] < 1 && !final && stage === i && <g className={`ck-ghostwrap ${cur(i)} ${over && stage === i ? "is-over" : ""}`}>{shape}</g>;

  return (
    <svg className="ck-svg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A forest hermitage being built at Chitrakuta">
      <defs>
        <linearGradient id="ck-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sky-1)" }} />
          <stop offset=".55" style={{ stopColor: "var(--sky-2)" }} />
          <stop offset="1" style={{ stopColor: "var(--sky-3)" }} />
        </linearGradient>
        <radialGradient id="ck-sunglow"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset=".25" stopColor="#ffe3a0" stopOpacity=".55" /><stop offset="1" stopColor="#ffe3a0" stopOpacity="0" /></radialGradient>
        <linearGradient id="ck-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#87995d" /><stop offset=".45" stopColor="#5d7648" /><stop offset="1" stopColor="#2f4832" /></linearGradient>
        <linearGradient id="ck-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9bbcad" /><stop offset=".5" stopColor="#528580" /><stop offset="1" stopColor="#2f605c" /></linearGradient>
        <linearGradient id="ck-log" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b88a5a" /><stop offset="1" stopColor="#5a3f2b" /></linearGradient>
        <linearGradient id="ck-bamboo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7c7340" /><stop offset=".45" stopColor="#c6b873" /><stop offset="1" stopColor="#7c7340" /></linearGradient>
        <radialGradient id="ck-shadow"><stop offset="0" stopColor="#0a1408" stopOpacity=".6" /><stop offset="1" stopColor="#0a1408" stopOpacity="0" /></radialGradient>
        <radialGradient id="ck-lamp"><stop offset="0" stopColor="#ffd88a" stopOpacity=".95" /><stop offset="1" stopColor="#ff9d3c" stopOpacity="0" /></radialGradient>
        <linearGradient id="ck-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff6d0" stopOpacity=".34" /><stop offset="1" stopColor="#fff6d0" stopOpacity="0" /></linearGradient>
        <pattern id="ck-weave" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#b79c68" /><path d="M0 2.5H10M0 7.5H10" stroke="#8a7248" strokeWidth="2" /><path d="M2.5 0V10M7.5 0V10" stroke="#d6bd88" strokeWidth="1.5" opacity=".7" />
        </pattern>
        <clipPath id="ck-roofshape"><polygon points="-172,6 0,-134 172,6" /></clipPath>
        <Clip id="ck-c1" x={-200} y={-70} w={400} h={80} p={p[1]} />
        <Clip id="ck-c2" x={-150} y={-130} w={300} h={140} p={p[2]} />
        <Clip id="ck-c3" x={-200} y={-170} w={400} h={190} p={p[3]} />
        <Clip id="ck-c4" x={-270} y={-90} w={540} h={190} p={p[4]} axis="x" />
      </defs>

      <rect y="-300" width="1000" height="1000" fill="url(#ck-sky)" />
      <g className="ck-sun"><circle r="130" fill="url(#ck-sunglow)" /><circle r="24" fill="#fff8e0" /></g>
      <g className="ck-cloud" style={{ animationDelay: "-30s" }}><ellipse cy="120" rx="76" ry="15" /><ellipse cx="44" cy="109" rx="52" ry="14" /></g>
      <g className="ck-cloud slow" style={{ animationDelay: "-90s" }}><ellipse cy="170" rx="94" ry="17" /><ellipse cx="-48" cy="160" rx="56" ry="14" /></g>
      <path className="ck-bird" d="M0 0q7-7 14 0q7-7 14 0" />

      <path className="ck-mtn m1" d="M-20 330L90 250L170 300L290 210L400 300L500 240L610 305L720 215L840 300L930 245L1020 320V390H-20Z" />
      <path className="ck-mtn m2" d="M-20 350L120 285L230 330L350 270L470 335L590 290L700 340L830 280L940 330L1020 300V400H-20Z" />
      <rect x="0" y="318" width="1000" height="90" fill="rgba(255,244,214,.2)" />
      {FAR.map((b, i) => <circle key={i} className="ck-farwood" cx={b.cx} cy={b.cy} r={b.r} />)}
      {site === "woodland" && <path className="ck-site" fill="url(#ck-water)" opacity=".78" d="M-10 358Q250 344 500 356T1010 350V382Q760 394 500 384T-10 388Z" />}

      <path fill="url(#ck-ground)" d="M-10 420Q250 396 500 410T1010 408V700H-10Z" />
      <path fill="#a6b570" opacity=".22" d="M-10 440Q260 420 500 432T1010 430V700H-10Z" />

      {site === "woodland" && (
        <g key="w" className="ck-site">
          <path fill="#6f8a52" d="M40 700Q250 500 400 458Q500 436 600 458Q750 500 960 700Z" />
          <ellipse cx="300" cy="530" rx="30" ry="16" fill="#8f9484" /><ellipse cx="700" cy="534" rx="32" ry="16" fill="#8f9484" />
        </g>
      )}
      {site === "river" && (
        <g key="r" className="ck-site">
          <path fill="#c9b684" d="M-10 546Q200 526 420 542T1010 534V568H-10Z" />
          <path fill="url(#ck-water)" d="M-10 560Q200 540 420 556T1010 548V700H-10Z" />
          {range(5).map((i) => (
            <path key={i} className="ck-wave" style={{ animationDelay: `${-i * 1.1}s` }} d={`M${20 + i * 34} ${578 + i * 8}q30-7 60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0`} />
          ))}
        </g>
      )}
      <g key={`t-${site}`} className={`ck-site ${site ? "" : "ck-dim"}`}>
        {TREES[site || "woodland"].map(([x, y, s, t], i) => <Tree key={i} x={x} y={y} s={s} t={t} i={i} />)}
      </g>

      {/* ============ THE HERMITAGE ============ */}
      <g transform={`translate(500 ${groundY})`}>
        <ellipse cy="6" rx="230" ry="26" fill="url(#ck-shadow)" />

        {!site && ghost(0, <><ellipse className="ck-ghost" cy="10" rx="230" ry="34" /><text className="ck-ghost-label" y="14" textAnchor="middle">SITE</text></>)}

        {ghost(1, <rect className="ck-ghost" x="-160" y="-30" width="320" height="30" rx="4" />)}
        {base && (
          <g clipPath="url(#ck-c1)">
            <g key={base} className="ck-part">
              {base === "stone" && <>
                {range(7).map((i) => <rect key={i} className={`ck-stone t${(i * 3) % 4}`} x={-150 + i * 43} y="-14" width="41" height="14" rx="3" />)}
                {range(6).map((i) => <rect key={i} className={`ck-stone t${(i * 5 + 1) % 4}`} x={-128 + i * 43} y="-28" width="41" height="14" rx="3" />)}
                <rect x="-34" y="-9" width="68" height="9" rx="2" fill="#b3ad97" stroke="#6a6756" />
              </>}
              {base === "earth" && <>
                <path d="M-168 0Q-152 -17 -120 -17H120Q152 -17 168 0Z" fill="#8b6d4b" stroke="#5d4630" strokeWidth="1.2" />
                <path d="M-36 0L-20 -17H20L36 0Z" fill="#a98a63" />
                {[-140, -96, 98, 142].map((g) => <path key={g} d={`M${g} -14l-3-9M${g} -14l1-10M${g} -14l4-8`} stroke="#6a8a45" strokeWidth="1.6" strokeLinecap="round" />)}
              </>}
              {base === "wood" && <>
                <rect x="-146" y="-48" width="292" height="48" fill="#1b140e" opacity=".7" />
                {[-132, -66, 0, 66, 132].map((px) => <rect key={px} x={px - 5} y="-48" width="10" height="48" rx="2" fill="#7a5636" />)}
                <rect x="-154" y="-56" width="308" height="9" rx="2" fill="#9a7249" stroke="#5a3f2b" />
              </>}
            </g>
          </g>
        )}

        <g className="ck-lift" style={{ transform: `translateY(${-lift}px)` }}>
          {ghost(2, <rect className="ck-ghost" x="-120" y="-110" width="240" height="110" rx="3" />)}
          {walls && (
            <g clipPath="url(#ck-c2)">
              <g key={walls} className="ck-part">
                <rect x="-120" y="-110" width="240" height="110" fill="#1f1812" />
                {walls === "bamboo" && <>
                  <rect x="-120" y="-110" width="240" height="110" fill="#8a6c42" />
                  {range(13).map((i) => <rect key={i} x={-123.5 + i * 20} y="-110" width="7" height="110" rx="3" fill="url(#ck-bamboo)" />)}
                  <rect x="-122" y="-80" width="244" height="5" fill="#5a4328" /><rect x="-122" y="-30" width="244" height="5" fill="#5a4328" />
                </>}
                {walls === "woodwall" && range(8).map((i) => (
                  <g key={i}>
                    <rect x="-122" y={-110 + i * 13.75} width="244" height="14" rx="6" fill="url(#ck-log)" stroke="#4a3322" />
                    <ellipse cx="-118" cy={-103 + i * 13.75} rx="4" ry="6" fill="#d6b183" /><ellipse cx="118" cy={-103 + i * 13.75} rx="4" ry="6" fill="#d6b183" />
                  </g>
                ))}
                {walls === "woven" && <>
                  <rect x="-118" y="-110" width="236" height="110" fill="url(#ck-weave)" />
                  <rect x="-118" y="-110" width="6" height="110" fill="#6b4c2e" /><rect x="112" y="-110" width="6" height="110" fill="#6b4c2e" />
                  <rect x="-120" y="-34" width="240" height="4" fill="#6b4c2e" />
                </>}
                <rect x="-128" y="-116" width="256" height="8" rx="2" fill="#6a4a2e" />
                <path d="M-25 0V-54Q-25 -86 0 -86Q25 -86 25 -54V0Z" fill="#2a2018" />
                <path className="ck-glow" d="M-25 0V-54Q-25 -86 0 -86Q25 -86 25 -54V0Z" fill="#ffc86a" />
                <path d="M-25 0V-54Q-25 -86 0 -86Q25 -86 25 -54V0" fill="none" stroke="#6a4a2e" strokeWidth="4" />
                {[-92, 62].map((wx) => (
                  <g key={wx}>
                    <rect x={wx} y="-84" width="30" height="28" rx="3" fill="#2a2018" stroke="#6a4a2e" strokeWidth="3" />
                    <rect className="ck-glow" x={wx} y="-84" width="30" height="28" rx="3" fill="#ffcf7a" />
                    <path d={`M${wx + 15} -84V-56M${wx} -70H${wx + 30}`} stroke="#6a4a2e" strokeWidth="2" />
                  </g>
                ))}
                <circle className="ck-glow" cx="44" cy="-70" r="24" fill="url(#ck-lamp)" />
                <rect x="40" y="-77" width="8" height="12" rx="2.5" fill="#ffd88a" />
              </g>
            </g>
          )}
        </g>

        <g className="ck-lift" style={{ transform: `translateY(${-wallTop}px)` }}>
          {ghost(3, <polygon className="ck-ghost" points="-172,6 0,-134 172,6" />)}
          {roof && (
            <g clipPath="url(#ck-c3)">
              <g key={roof} className="ck-part">
                <polygon points="-172,6 0,-134 172,6" fill={roof === "leafroof" ? "#4d6a3a" : roof === "thatch" ? "#b0894d" : "#8a6a40"} />
                <g clipPath="url(#ck-roofshape)">
                  {roof !== "leafroof" && range(8).map((i) => (
                    <rect key={i} x="-180" y={-136 + i * 19} width="360" height="22" rx="9" fill={roof === "thatch" ? (i % 2 ? "#b8914f" : "#c9a367") : (i % 2 ? "#98774a" : "#a98557")} stroke="rgba(70,48,24,.35)" />
                  ))}
                  {roof === "leafroof" && LEAVES.map((l) => (
                    <ellipse key={`${l.r}-${l.k}`} cx={l.x} cy={l.y} rx="17" ry="8.5" fill={LEAF_FILL[l.t]} transform={`rotate(${l.rot} ${l.x} ${l.y})`} />
                  ))}
                </g>
                <path d="M-172 6L0 -134L172 6" fill="none" stroke={roof === "timberroof" ? "#5b3d27" : "#8b6a3c"} strokeWidth={roof === "timberroof" ? 9 : 5} strokeLinejoin="round" />
                <line x1="-176" y1="5" x2="176" y2="5" stroke="#5b3d27" strokeWidth="6" strokeLinecap="round" />
                {roof === "timberroof" && <path d="M-92 -52H92M-46 -90H46" stroke="#4a3220" strokeWidth="5" opacity=".8" />}
                <path d="M0 -134V-150M-5 -146L0 -154L5 -146" fill="none" stroke="#4a3220" strokeWidth="3" strokeLinecap="round" />
              </g>
            </g>
          )}
        </g>

        {ghost(4, <><ellipse className="ck-ghost" cy="40" rx="230" ry="32" /><text className="ck-ghost-label" y="44" textAnchor="middle">SURROUNDINGS</text></>)}
        {home && (
          <g clipPath="url(#ck-c4)">
            <g key={home} className="ck-part">
              {home === "simple" && <>
                {[[0, 16], [-7, 34], [8, 52], [-4, 70]].map(([sx, sy], i) => <ellipse key={i} cx={sx} cy={sy} rx="15" ry="6.5" fill="#a3a08c" stroke="#6f6c5a" />)}
                <rect x="150" y="-24" width="84" height="12" rx="5" fill="url(#ck-log)" stroke="#4a3322" />
                <rect x="158" y="-12" width="7" height="14" fill="#5a3f2b" /><rect x="219" y="-12" width="7" height="14" fill="#5a3f2b" />
                <ellipse cx="-160" cy="30" rx="44" ry="11" fill="#b5683a" stroke="#7a3f20" strokeWidth="1.4" />
              </>}
              {home === "garden" && <>
                {[-1, 1].map((sd) => <ellipse key={sd} cx={sd * 172} cy="26" rx="62" ry="12" fill="#5a4129" />)}
                {[-1, 1].flatMap((sd) => range(8).map((k) => {
                  const x = sd * (132 + k * 11), h = 15 + ((k * 7) % 13), y = 26 - h;
                  return (
                    <g key={`${sd}${k}`}>
                      <line x1={x} y1="26" x2={x} y2={y} stroke="#4f7040" strokeWidth="2" />
                      <circle cx={x} cy={y} r="5.4" fill={["#f2d8a5", "#ee9fb0", "#f6c24a"][(k + (sd > 0 ? 1 : 0)) % 3]} />
                    </g>
                  );
                }))}
              </>}
              {home === "courtyard" && <>
                <ellipse cy="36" rx="226" ry="30" fill="rgba(204,180,128,.62)" stroke="rgba(106,82,48,.4)" strokeWidth="1.4" />
                {range(30).map((k) => <ellipse key={k} cx={Math.cos((k / 30) * 6.283) * 226} cy={36 + Math.sin((k / 30) * 6.283) * 30} rx="8" ry="4.4" fill="#9a9784" stroke="#6a6858" />)}
                <ellipse cy="40" rx="34" ry="10" fill="rgba(86,66,40,.5)" stroke="#8a8674" strokeWidth="3" strokeDasharray="8 5" />
              </>}
            </g>
          </g>
        )}

        <Person x={-250} y={6} robe="#6f8a4a" />
        {final && <><Person x={96} y={34} s={1.05} robe="#4f6f93" /><Person x={136} y={38} robe="#d9923a" /></>}

        {building && (
          <>
            <g transform={`translate(0 ${zy})`} className="ck-marker">
              <circle className="ck-ring" r="30" />
              <g transform="rotate(-35)"><line y1="-14" y2="16" stroke="#f6dfa4" strokeWidth="4" strokeLinecap="round" /><rect x="-11" y="-20" width="22" height="9" rx="2" fill="#f6dfa4" /></g>
            </g>
            <rect className="ck-hit" x="-290" y="-360" width="580" height="420" onClick={onTap} />
          </>
        )}
        {tapKey > 0 && (
          <g key={tapKey} transform={`translate(0 ${zy})`}>
            {range(10).map((i) => <circle key={i} className="ck-spark" r="4" style={{ "--a": `${i * 36}deg`, "--d": `${50 + (i % 3) * 28}px` }} />)}
          </g>
        )}
      </g>

      <ellipse cx="60" cy="598" rx="60" ry="30" fill="#3f6a3e" /><ellipse cx="944" cy="602" rx="70" ry="34" fill="#35603a" />
      {site === "grove" && (
        <g key="gx" className="ck-site">
          <rect width="1000" height="620" fill="rgba(8,24,12,.3)" />
          <polygon className="ck-ray" points="130,0 210,0 420,520 300,520" />
          <polygon className="ck-ray r2" points="470,0 540,0 640,520 540,520" />
          <polygon className="ck-ray r3" points="760,0 820,0 900,520 800,520" />
        </g>
      )}
    </svg>
  );
}

/* ---------- game ---------- */

export default function AHomeInChitrakuta({ onComplete, onExit }) {
  const [stage, setStage] = useState(0);
  const [sel, setSel] = useState({});
  const [prog, setProg] = useState({});
  const [hover, setHover] = useState(null);
  const [drag, setDrag] = useState(null);
  const [tapKey, setTapKey] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  const sceneRef = useRef(null);
  const dr = useRef(null);
  const timer = useRef(null);
  const stageRef = useRef(0);
  const chooseRef = useRef(null);
  stageRef.current = stage;

  const cur = STAGES[stage];
  const firstOpen = (() => { const i = range(5).findIndex((k) => (prog[k] || 0) < 1); return i === -1 ? 4 : i; })();
  const pv = !showFinal ? (drag?.over ? drag.id : hover) : null;
  const pick = (i) => ((i === stage && pv) || sel[i] || null);
  const p = range(5).map((i) => (showFinal ? 1 : i === stage && pv && pv !== sel[i] ? 1 : prog[i] || 0));
  const curP = prog[stage] || 0;
  const done = curP >= 1;
  const building = !showFinal && stage > 0 && !!sel[stage] && !done && !pv;

  const totals = useMemo(() => {
    const t = [0, 0, 0];
    STAGES.forEach((st, i) => { const f = st.items.find((c) => c.id === sel[i]); if (f) f.stats.forEach((v, k) => { t[k] += v; }); });
    return t;
  }, [sel]);
  const character = useMemo(() => {
    const m = Math.max(...totals);
    return totals.filter((v) => v === m).length > 1 ? "Balanced Hearth" : CHARACTERS[totals.indexOf(m)];
  }, [totals]);

  const later = (fn) => { clearTimeout(timer.current); timer.current = setTimeout(fn, 1000); };
  const advance = (from) => {
    if (stageRef.current !== from) return;
    if (from === 4) setShowFinal(true); else setStage(from + 1);
  };

  const choose = (id) => {
    if (showFinal || sel[stage] === id) return;
    const redo = (prog[stage] || 0) >= 1;
    const instant = stage === 0 || redo;
    const first = !sel[stage];
    setSel((s) => ({ ...s, [stage]: id }));
    setProg((q) => ({ ...q, [stage]: instant ? 1 : 0 }));
    setTapKey((k) => k + 1);
    if (instant && first && stage === firstOpen) { const from = stage; later(() => advance(from)); }
  };
  chooseRef.current = choose;

  const tap = () => {
    if (showFinal || !sel[stage] || done) return;
    const n = Math.min(1, curP + 1 / TAPS);
    setProg((q) => ({ ...q, [stage]: n }));
    setTapKey((k) => k + 1);
    if (n >= 1 && stage === firstOpen) { const from = stage; later(() => advance(from)); }
  };

  const restart = () => { clearTimeout(timer.current); setStage(0); setSel({}); setProg({}); setShowFinal(false); setHover(null); setTapKey(0); };
  const jump = (i) => { if (i > firstOpen) return; clearTimeout(timer.current); setShowFinal(false); setHover(null); setStage(i); };

  /* drag a piece onto the scene (a plain click also works) */
  useEffect(() => {
    const inScene = (x, y) => { const r = sceneRef.current?.getBoundingClientRect(); return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
    const move = (e) => {
      const d = dr.current; if (!d) return;
      if (!d.on && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.on = true;
      setDrag({ id: d.id, x: e.clientX, y: e.clientY, over: inScene(e.clientX, e.clientY) });
    };
    const up = (e) => {
      const d = dr.current; dr.current = null; setDrag(null); setHover(null);
      if (d && (!d.on || inScene(e.clientX, e.clientY))) chooseRef.current(d.id);
    };
    const cancel = () => { dr.current = null; setDrag(null); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { exit(); return; }
      if (showFinal) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 3) choose(cur.items[n - 1].id);
      else if ((e.key === " " || e.key === "Enter") && e.target.tagName !== "BUTTON") { e.preventDefault(); tap(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const exit = () => (onExit || onComplete)?.();

  /* true full screen: lock page scroll while the game is open */
  useEffect(() => {
    const html = document.documentElement, body = document.body;
    const prev = [html.style.overflow, body.style.overflow];
    html.style.overflow = "hidden"; body.style.overflow = "hidden";
    return () => { html.style.overflow = prev[0]; body.style.overflow = prev[1]; };
  }, []);

  const time = showFinal ? 5 : stage;
  const dragItem = drag && cur.items.find((c) => c.id === drag.id);

  const game = (
    <div className="chitrakuta-game">
      <section ref={sceneRef} className="ck-scene" data-time={time} data-cam={showFinal ? "wide" : CAM[stage]}>
        <div className="ck-camera">
          <Scene site={pick(0)} base={pick(1)} walls={pick(2)} roof={pick(3)} home={pick(4)} p={p} stage={stage} final={showFinal}
            tapKey={tapKey} over={!!drag?.over} building={building} onTap={tap} />
        </div>
        <div className="ck-tint" />
        <div className="ck-flies" aria-hidden="true">
          {FLIES.map((f, i) => <i key={i} style={{ left: `${f.l}%`, top: `${f.t}%`, animationDelay: `${f.d}s`, animationDuration: `${f.s}s` }} />)}
        </div>

        <div className="ck-hud">
          <div className="ck-chip"><Trees size={16} strokeWidth={1.5} /><b>Chitrakuta</b></div>

          <nav className="ck-track" aria-label="Build stages">
            {STAGES.map((st, i) => {
              const Icon = st.icon;
              const built = (prog[i] || 0) >= 1;
              const active = !showFinal && stage === i;
              return (
                <button key={st.title} type="button" disabled={i > firstOpen} onClick={() => jump(i)} title={st.title} aria-label={st.title}
                  className={`ck-node ${built ? "is-built" : ""} ${active ? "is-active" : ""}`}>
                  {built && !active ? <Check size={15} /> : <Icon size={15} strokeWidth={1.6} />}
                </button>
              );
            })}
          </nav>

          <div className="ck-right">
            <div className="ck-meters">
              {METERS.map((Icon, k) => (
                <div className="ck-meter" key={k} title={METER_NAMES[k]}>
                  <Icon size={13} strokeWidth={1.6} />
                  <span><i style={{ width: `${(totals[k] / 15) * 100}%` }} /></span>
                </div>
              ))}
            </div>
            <button type="button" className="ck-exit" onClick={exit} aria-label="Close game" title="Close (Esc)"><X size={18} /></button>
          </div>
        </div>
      </section>

      <footer className={`ck-dock ${showFinal ? "is-final" : ""}`}>
        {!showFinal ? (
          <>
            <div className="ck-dock__head" key={stage}>
              <h2>{cur.title}</h2>
              {stage > 0 ? (
                <div className="ck-pips" aria-label="Build progress">{range(TAPS).map((i) => <i key={i} className={i < Math.round(curP * TAPS) ? "on" : ""} />)}</div>
              ) : null}
              <p>{!sel[stage] ? "Drag a piece onto the scene" : done ? "Built" : "Tap the hut to build"}</p>
            </div>

            <div className="ck-cards" onPointerLeave={() => setHover(null)}>
              {cur.items.map((c, i) => (
                <button key={c.id} type="button" className={`ck-card ${sel[stage] === c.id ? "is-on" : ""}`}
                  onPointerDown={(e) => { if (e.button <= 0) dr.current = { id: c.id, x: e.clientX, y: e.clientY, on: false }; }}
                  onPointerEnter={(e) => e.pointerType === "mouse" && !dr.current && setHover(c.id)}
                  onClick={(e) => e.detail === 0 && choose(c.id)} aria-pressed={sel[stage] === c.id}>
                  <kbd>{i + 1}</kbd>
                  <span className="ck-card__icon"><c.Icon size={20} strokeWidth={1.5} /></span>
                  <strong>{c.name}</strong>
                  <span className="ck-stats">
                    {METERS.map((Ic, k) => (
                      <span key={k}><Ic size={10} />{range(3).map((d) => <i key={d} className={d < c.stats[k] ? "on" : ""} />)}</span>
                    ))}
                  </span>
                </button>
              ))}
            </div>

            <button type="button" className={`ck-act ${sel[stage] ? "is-ready" : ""} ${done ? "is-done" : ""}`}
              disabled={!sel[stage] || (stage === 0 && false)} onClick={() => (done ? advance(stage) : tap())}>
              {done ? <ArrowRight size={24} /> : <Hammer size={24} />}
              <span>{done ? (stage === 4 ? "Reveal" : "Next") : "Build"}</span>
            </button>
          </>
        ) : (
          <>
            <div className="ck-final__title">
              <small>Hermitage complete</small>
              <h2>A Home in Chitrakuta</h2>
              <p>“A home is made by the lives it shelters.”</p>
            </div>
            <div className="ck-final__char"><small>Your home</small><strong>{character}</strong></div>
            <div className="ck-final__btns">
              <button type="button" className="ck-ghostbtn" onClick={restart}><RotateCcw size={15} />Build again</button>
              <button type="button" className="ck-primary" onClick={onComplete}>Return to the chronicle<ArrowRight size={15} /></button>
            </div>
          </>
        )}
      </footer>

      {dragItem && (
        <div className={`ck-dragcard ${drag.over ? "is-over" : ""}`} style={{ transform: `translate(${drag.x}px, ${drag.y}px) translate(-50%, -60%)` }}>
          <dragItem.Icon size={18} strokeWidth={1.5} />{dragItem.name}
        </div>
      )}
    </div>
  );

  return typeof document === "undefined" ? game : createPortal(game, document.body);
}