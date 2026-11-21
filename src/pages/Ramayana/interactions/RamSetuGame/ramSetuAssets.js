import * as THREE from "three";
import { mulberry32 } from "./ramSetuWorld";

/* ------------------------------------------------------------------ */
/*  Procedural textures, stone geometry and the Vanara character kit.  */
/*  No image files: every stone is painted at runtime, and every one   */
/*  of them carries राम in Devanagari.                                  */
/* ------------------------------------------------------------------ */

export const RAM = "राम";
export const DEVANAGARI_FONT =
  '"Tiro Devanagari Hindi", "Noto Serif Devanagari", "Noto Sans Devanagari", "Nirmala UI", "Kohinoor Devanagari", "Devanagari Sangam MN", serif';

export async function loadFonts() {
  try {
    if (document.fonts && document.fonts.load) {
      await Promise.race([
        Promise.all([
          document.fonts.load('400 120px "Tiro Devanagari Hindi"', RAM),
          document.fonts.load('700 120px "Noto Serif Devanagari"', RAM),
          document.fonts.load('500 40px "Cormorant Garamond"', "Ram"),
        ]),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    }
  } catch {
    /* fall back to system fonts */
  }
}

const mk = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

function toTexture(canvas, color) {
  const t = new THREE.CanvasTexture(canvas);
  t.anisotropy = 8;
  if (color) {
    if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
    else t.encoding = THREE.sRGBEncoding;
  }
  t.needsUpdate = true;
  return t;
}

/* ----------------------------- stone faces ------------------------- */

const TINTS = [
  ["#bba886", "#9d8c6e", "#b09d7c"],
  ["#ab9d88", "#8e826a", "#a59580"],
  ["#c1a88c", "#a28868", "#b8a282"],
  ["#a7a191", "#8d8776", "#a09886"],
];

function paintRock(ctx, w, h, rand, tint) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, tint[0]);
  g.addColorStop(0.5, tint[1]);
  g.addColorStop(1, tint[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 70; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 18 + rand() * 70;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rand() > 0.5 ? "rgba(40,30,22,0.20)" : "rgba(255,240,210,0.14)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const n = Math.floor((w * h) / 90);
  for (let i = 0; i < n; i++) {
    const a = rand() * 0.28;
    ctx.fillStyle = rand() > 0.5 ? `rgba(30,22,16,${a})` : `rgba(255,244,222,${a})`;
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
  ctx.strokeStyle = "rgba(35,25,18,0.32)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    let x = rand() * w;
    let y = rand() * h;
    ctx.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      x += (rand() - 0.5) * 60;
      y += (rand() - 0.2) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function paintBump(ctx, w, h, rand) {
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 15 + rand() * 60;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rand() > 0.5 ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)");
    rg.addColorStop(1, "rgba(128,128,128,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const n = Math.floor((w * h) / 70);
  for (let i = 0; i < n; i++) {
    const v = Math.floor(70 + rand() * 120);
    ctx.fillStyle = `rgba(${v},${v},${v},0.55)`;
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
}

function paintName(ctx, w, h, p, carve) {
  ctx.save();
  ctx.translate(w / 2 + p.ox, h / 2 + p.oy);
  ctx.rotate(p.rot);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.font = `400 ${p.size}px ${DEVANAGARI_FONT}`;
  if (carve) {
    ctx.lineWidth = p.size * 0.05;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.strokeText(RAM, 0, 0);
    ctx.fillText(RAM, 0, 0);
  } else {
    ctx.fillStyle = "rgba(255,238,205,0.4)";
    ctx.fillText(RAM, 2, 3);
    ctx.shadowColor = "rgba(190,50,15,0.6)";
    ctx.shadowBlur = p.size * 0.05;
    ctx.lineWidth = p.size * 0.045;
    ctx.strokeStyle = "#9d2a10";
    ctx.strokeText(RAM, 0, 0);
    ctx.fillStyle = "#c93b1a";
    ctx.fillText(RAM, 0, 0);
  }
  ctx.restore();
}

/** Crop a transparent drawing to its ink so it can be fitted to a stone. */
function cropToInk(src) {
  const ctx = src.getContext("2d");
  const { width: w, height: h } = src;
  const d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 20) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return src;
  const pad = 10;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad);
  y1 = Math.min(h - 1, y1 + pad);
  const out = mk(x1 - x0 + 1, y1 - y0 + 1);
  out.getContext("2d").drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

function makeFace({ w, h, seed, text = true, size = 220, ink = null, tint = 0 }) {
  const rand = mulberry32(seed);
  const c = mk(w, h);
  const ctx = c.getContext("2d");
  paintRock(ctx, w, h, rand, TINTS[tint % TINTS.length]);
  const b = mk(w, h);
  const bctx = b.getContext("2d");
  paintBump(bctx, w, h, rand);

  if (ink) {
    const cropped = cropToInk(ink);
    const s = Math.min((w * 0.74) / cropped.width, (h * 0.62) / cropped.height);
    const iw = cropped.width * s;
    const ih = cropped.height * s;
    const x = (w - iw) / 2;
    const y = (h - ih) / 2;
    ctx.save();
    ctx.shadowColor = "rgba(255,236,200,0.5)";
    ctx.shadowOffsetY = 3;
    ctx.drawImage(cropped, x, y, iw, ih);
    ctx.restore();

    const tmp = mk(cropped.width, cropped.height);
    const tc = tmp.getContext("2d");
    tc.drawImage(cropped, 0, 0);
    tc.globalCompositeOperation = "source-in";
    tc.fillStyle = "#000";
    tc.fillRect(0, 0, tmp.width, tmp.height);
    bctx.drawImage(tmp, x, y, iw, ih);
  } else if (text) {
    const p = {
      size,
      rot: (rand() - 0.5) * 0.24,
      ox: (rand() - 0.5) * w * 0.1,
      oy: (rand() - 0.5) * h * 0.1,
    };
    paintName(ctx, w, h, p, false);
    paintName(bctx, w, h, p, true);
  }

  return { map: toTexture(c, true), bump: toTexture(b, false) };
}

function stoneMat({ map, bump }) {
  return new THREE.MeshStandardMaterial({
    map,
    bumpMap: bump,
    bumpScale: 2.2,
    roughness: 0.92,
    metalness: 0.02,
  });
}

// BoxGeometry face order: +x, -x, +y, -y, +z, -z
function makeStoneMats(top, side, end) {
  const topM = stoneMat(top);
  const sideM = stoneMat(side);
  const endM = stoneMat(end);
  const mats = [endM, endM, topM, endM, sideM, sideM];
  mats._own = [top.map, top.bump, side.map, side.bump];
  return mats;
}

/** Rounded, slightly lumpy boulder slab. UVs are kept so राम stays crisp. */
function makeStoneGeometry(seed) {
  const W = 1.5;
  const H = 0.62;
  const D = 1.15;
  const r = 0.2;
  const g = new THREE.BoxGeometry(W, H, D, 16, 8, 12);
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const half = new THREE.Vector3(W / 2 - r, H / 2 - r, D / 2 - r);
  const v = new THREE.Vector3();
  const inner = new THREE.Vector3();
  const d = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    inner.set(
      THREE.MathUtils.clamp(v.x, -half.x, half.x),
      THREE.MathUtils.clamp(v.y, -half.y, half.y),
      THREE.MathUtils.clamp(v.z, -half.z, half.z)
    );
    d.subVectors(v, inner);
    if (d.lengthSq() > 1e-9) {
      d.normalize();
      v.copy(inner).addScaledVector(d, r);
      n.setXYZ(i, d.x, d.y, d.z);
    }
    const k =
      Math.sin(v.x * 6.1 + seed * 3.1) * Math.sin(v.z * 5.3 + seed) * 0.026 +
      Math.sin(v.y * 9 + v.x * 4 + seed) * 0.012;
    v.addScaledVector(d, k);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  p.needsUpdate = true;
  n.needsUpdate = true;
  g.computeBoundingSphere();
  return g;
}

/* ---------------------------- small textures ----------------------- */

function radialTexture(size, stops) {
  const c = mk(size, size);
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c, true);
}

function glyphTexture() {
  const c = mk(256, 256);
  const ctx = c.getContext("2d");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `400 150px ${DEVANAGARI_FONT}`;
  ctx.shadowColor = "rgba(255,170,60,0.95)";
  ctx.shadowBlur = 26;
  const g = ctx.createLinearGradient(0, 70, 0, 190);
  g.addColorStop(0, "#fff3c9");
  g.addColorStop(1, "#ffbf5a");
  ctx.fillStyle = g;
  ctx.fillText(RAM, 128, 134);
  ctx.fillText(RAM, 128, 134);
  return toTexture(c, true);
}

function flagTexture() {
  const c = mk(512, 320);
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, "#f09a26");
  g.addColorStop(1, "#d9650f");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(505, 8);
  ctx.lineTo(395, 160);
  ctx.lineTo(505, 312);
  ctx.lineTo(0, 312);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#7d2c0b";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `400 170px ${DEVANAGARI_FONT}`;
  ctx.fillStyle = "#fff4d6";
  ctx.shadowColor = "rgba(90,30,5,0.5)";
  ctx.shadowBlur = 8;
  ctx.fillText(RAM, 215, 170);
  return toTexture(c, true);
}

/* ---------------------------- vanara kit --------------------------- */

function makeVanaraKit() {
  const std = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });

  const tail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -0.1, -0.25),
    new THREE.Vector3(0, 0.15, -0.5),
    new THREE.Vector3(0, 0.5, -0.55),
    new THREE.Vector3(0, 0.78, -0.34),
  ]);

  return {
    fur: ["#8d5a2e", "#9a6a3a", "#7a4d28", "#a77845"].map((c) => std(c)),
    darkFur: std("#4a2d17"),
    skin: std("#d9ab80", { roughness: 0.75 }),
    cloth: std("#c4421d"),
    gold: std("#d9a441", { metalness: 0.55, roughness: 0.35 }),
    band: std("#e6891b"),
    eye: new THREE.MeshBasicMaterial({ color: "#150b05" }),
    torso: new THREE.CapsuleGeometry(0.21, 0.46, 4, 10),
    head: new THREE.SphereGeometry(0.2, 18, 14),
    face: new THREE.SphereGeometry(0.15, 14, 10),
    ear: new THREE.SphereGeometry(0.055, 8, 8),
    eyeG: new THREE.SphereGeometry(0.026, 8, 8),
    leg: new THREE.CapsuleGeometry(0.085, 0.38, 4, 8),
    arm: new THREE.CapsuleGeometry(0.07, 0.42, 4, 8),
    dhoti: new THREE.CylinderGeometry(0.23, 0.31, 0.34, 14),
    belt: new THREE.TorusGeometry(0.235, 0.025, 6, 18),
    bandG: new THREE.TorusGeometry(0.205, 0.028, 6, 18),
    hair: new THREE.SphereGeometry(0.21, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    tail: new THREE.TubeGeometry(tail, 16, 0.045, 6, false),
  };
}

/* ------------------------------ public API ------------------------- */

export function buildAssets() {
  const variants = [];
  for (let i = 0; i < 4; i++) {
    variants.push({
      top: makeFace({ w: 512, h: 410, seed: 100 + i * 7, size: 240, tint: i }),
      side: makeFace({ w: 512, h: 230, seed: 200 + i * 5, size: 132, tint: i }),
    });
  }
  const end = makeFace({ w: 256, h: 230, seed: 901, text: false, tint: 2 });
  const plainTop = makeFace({ w: 512, h: 410, seed: 902, text: false, tint: 0 });
  const plainSide = makeFace({ w: 512, h: 230, seed: 903, text: false, tint: 0 });
  const heroSide = makeFace({ w: 512, h: 230, seed: 904, size: 132, tint: 1 });

  const mats = variants.map((v) => makeStoneMats(v.top, v.side, end));
  const blankMats = makeStoneMats(plainTop, plainSide, end);

  const foamTex = radialTexture(256, [
    [0, "rgba(255,255,255,0)"],
    [0.5, "rgba(255,255,255,0)"],
    [0.66, "rgba(255,255,255,0.8)"],
    [0.8, "rgba(255,255,255,0.18)"],
    [1, "rgba(255,255,255,0)"],
  ]);
  const glowTex = radialTexture(256, [
    [0, "rgba(255,214,140,0.95)"],
    [0.35, "rgba(255,170,70,0.35)"],
    [1, "rgba(255,140,40,0)"],
  ]);
  const sparkTex = radialTexture(64, [
    [0, "rgba(255,255,255,1)"],
    [0.4, "rgba(255,222,150,0.55)"],
    [1, "rgba(255,200,120,0)"],
  ]);

  const assets = {
    geos: [makeStoneGeometry(1.3), makeStoneGeometry(4.7), makeStoneGeometry(8.1)],
    mats,
    blankMats,
    endFace: end,
    heroSide,
    foamTex,
    glowTex,
    sparkTex,
    glyphTex: glyphTexture(),
    flagTex: flagTexture(),
    foamGeo: new THREE.PlaneGeometry(2.5, 2.1).rotateX(-Math.PI / 2),
    ringGeo: new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2),
    foamMat: new THREE.MeshBasicMaterial({
      map: foamTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
    glowRingMat: new THREE.MeshBasicMaterial({
      map: glowTex,
      color: "#ffb050",
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.32,
    }),
    kit: makeVanaraKit(),
    _faces: [
      ...variants.flatMap((v) => [v.top, v.side]),
      end,
      plainTop,
      plainSide,
      heroSide,
    ],
  };
  return assets;
}

/** Builds the first stone: the player's own handwriting on its top face. */
export function buildHeroMaterials(ink, assets) {
  const top = makeFace({ w: 512, h: 410, seed: 77, text: false, ink, tint: 1 });
  return makeStoneMats(top, assets.heroSide, assets.endFace);
}

export function disposeHero(mats) {
  if (!mats) return;
  (mats._own || []).slice(0, 2).forEach((t) => t.dispose()); // only the top face is hero-specific
  new Set(mats).forEach((m) => m.dispose());
}

export function disposeAssets(a) {
  if (!a) return;
  a.geos.forEach((g) => g.dispose());
  [...a.mats, a.blankMats].forEach((set) => new Set(set).forEach((m) => m.dispose()));
  a._faces.forEach((f) => {
    f.map.dispose();
    f.bump.dispose();
  });
  [a.foamTex, a.glowTex, a.sparkTex, a.glyphTex, a.flagTex].forEach((t) => t.dispose());
  [a.foamGeo, a.ringGeo].forEach((g) => g.dispose());
  [a.foamMat, a.glowRingMat].forEach((m) => m.dispose());
  Object.values(a.kit).forEach((v) => {
    if (Array.isArray(v)) v.forEach((m) => m.dispose());
    else if (v && v.dispose) v.dispose();
  });
}
