/**
 * ANCESTRA · Game 2 — A FATHER'S GREATEST LOSS
 * Yuddha Kanda · Chapter XVIII · The Fall of Indrajit
 *
 * Stack: React + @react-three/fiber + three + framer-motion + lucide-react
 * Assets: ch18g21.jpg … ch18g210.jpg  (no other assets needed — the score is
 * synthesised live with the Web Audio API, so nothing else has to be shipped)
 *
 * Usage:  <FathersLossGame onClose={() => …} onComplete={() => …} />
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { ChevronRight, Volume2, VolumeX, X } from 'lucide-react'
import './FathersLossGame.css'

/* ──────────────────────────────────────────────────────────────
   ASSETS  — change IMG_BASE if your images live elsewhere
   ────────────────────────────────────────────────────────────── */
const IMG_BASE = '/images/ramayana/interactions/'
const img = (name) => `${IMG_BASE}${name}.jpg`

/* ──────────────────────────────────────────────────────────────
   MOODS — one per emotional register. Drives particles, light,
   colour grade, vignette and the live score.
   ────────────────────────────────────────────────────────────── */
const MOODS = {
  court: {
    v: { col: [1, 0.78, 0.36], rise: 0.22, wind: 0.04, op: 0.85, size: 1, rays: 0.2, mist: 0.1, mcol: [0.9, 0.6, 0.22] },
    grade: 'saturate(1.06) contrast(1.05) brightness(1)',
    vig: 0.55,
    audio: { drone: 0.45, cutoff: 420, pad: 0.5, scale: 'dark', beat: null },
  },
  tension: {
    v: { col: [1, 0.68, 0.3], rise: 0.14, wind: 0.02, op: 0.7, size: 0.9, rays: 0.1, mist: 0.14, mcol: [0.75, 0.5, 0.25] },
    grade: 'saturate(1) contrast(1.08) brightness(0.96)',
    vig: 0.66,
    audio: { drone: 0.4, cutoff: 340, pad: 0.35, scale: 'dark', beat: null },
  },
  disbelief: {
    v: { col: [0.92, 0.86, 0.8], rise: 0.06, wind: -0.08, op: 0.6, size: 0.9, rays: 0.04, mist: 0.2, mcol: [0.55, 0.58, 0.7] },
    grade: 'saturate(0.82) contrast(1.1) brightness(0.9)',
    vig: 0.78,
    heart: true,
    audio: { drone: 0.32, cutoff: 290, pad: 0.25, scale: 'dark', beat: 'heart', period: 1150 },
  },
  memory: {
    v: { col: [1, 0.88, 0.6], rise: 0.1, wind: 0.03, op: 1, size: 1.35, rays: 0.5, mist: 0.26, mcol: [1, 0.82, 0.5] },
    grade: 'sepia(0.26) saturate(1.1) brightness(1.08) contrast(0.96)',
    vig: 0.38,
    bloom: true,
    audio: { drone: 0.26, cutoff: 520, pad: 0.85, scale: 'warm', beat: null },
  },
  grief: {
    v: { col: [0.62, 0.74, 0.96], rise: -0.16, wind: 0.01, op: 0.7, size: 1, rays: 0.03, mist: 0.3, mcol: [0.46, 0.52, 0.66] },
    grade: 'saturate(0.6) brightness(0.86) contrast(1.06) hue-rotate(-6deg)',
    vig: 0.82,
    audio: { drone: 0.28, cutoff: 270, pad: 0.3, scale: 'dark', beat: null },
  },
  fury: {
    v: { col: [1, 0.34, 0.12], rise: 0.95, wind: 0.2, op: 1, size: 1.2, rays: 0.14, mist: 0.2, mcol: [0.5, 0.1, 0.06] },
    grade: 'saturate(1.2) contrast(1.15) brightness(0.9)',
    vig: 0.78,
    fury: true,
    audio: { drone: 0.55, cutoff: 700, pad: 0.2, scale: 'dark', beat: 'drum', period: 3000 },
  },
  temple: {
    v: { col: [1, 0.82, 0.4], rise: 0.32, wind: 0.02, op: 0.9, size: 1.1, rays: 0.42, mist: 0.36, mcol: [0.95, 0.75, 0.4] },
    grade: 'saturate(1.08) brightness(1.02) contrast(1.03)',
    vig: 0.56,
    flicker: true,
    audio: { drone: 0.3, cutoff: 360, pad: 0.7, scale: 'sacred', beat: null },
  },
  march: {
    v: { col: [1, 0.58, 0.2], rise: 0.5, wind: 0.65, op: 0.95, size: 1.15, rays: 0.28, mist: 0.22, mcol: [0.7, 0.35, 0.15] },
    grade: 'saturate(1.1) contrast(1.1) brightness(0.98)',
    vig: 0.62,
    audio: { drone: 0.5, cutoff: 620, pad: 0.3, scale: 'dark', beat: 'drum', period: 1950 },
  },
  end: {
    v: { col: [1, 0.8, 0.4], rise: 0.28, wind: 0.04, op: 0.9, size: 1.1, rays: 0.12, mist: 0.2, mcol: [0.6, 0.4, 0.2] },
    grade: 'saturate(0.9) brightness(0.8)',
    vig: 0.9,
    audio: { drone: 0.3, cutoff: 260, pad: 0.55, scale: 'sacred', beat: null },
  },
}

const flat = (v) => ({
  r: v.col[0], g: v.col[1], b: v.col[2],
  rise: v.rise, wind: v.wind, op: v.op, size: v.size, rays: v.rays, mist: v.mist,
  mr: v.mcol[0], mg: v.mcol[1], mb: v.mcol[2],
})

/* ──────────────────────────────────────────────────────────────
   STORY — exact script, ten scenes, ten images
   t: 'n' narration · 'd' dialogue · 'a' stage direction
   hold: pause (ms) after the line finishes
   ────────────────────────────────────────────────────────────── */
const SCENES = [
  {
    img: 'ch18g21', title: 'The King Who Waited', mood: 'court', kb: 'in', trans: 'dip',
    beats: [
      { t: 'n', text: 'Within the golden walls of Lanka, its mighty king awaited the return of his greatest warrior. Indrajit had gone to face Lakshmana. Ravana expected victory. He had never imagined receiving anything else.', hold: 1700 },
      { t: 'd', who: 'Ravana', text: 'Has there been any message from the battlefield?', hold: 1100 },
      { t: 'd', who: 'Attendant', text: 'Not yet, Maharaja. The battle continues.', hold: 1500 },
      { t: 'd', who: 'Ravana', text: 'My son does not return without victory.', hold: 900 },
    ],
  },
  {
    img: 'ch18g22', title: 'The Messenger', mood: 'tension', kb: 'in', trans: 'dip',
    beats: [
      { t: 'd', who: 'Messenger', text: 'Lord of Lanka… I bring news from the battlefield.', hold: 1200 },
      { t: 'd', who: 'Ravana', text: 'Speak. Where is my son?', hold: 1300 },
      { t: 'd', who: 'Messenger', text: 'Maharaja… Prince Indrajit…', hold: 900 },
      { t: 'a', text: 'The messenger hesitates.', hold: 1700 },
      { t: 'd', who: 'Ravana', text: 'Why have you stopped? Speak!', hold: 1500 },
      { t: 'd', who: 'Messenger', text: 'He has fallen, Maharaja. Lakshmana has slain the prince.', sfxEnd: 'fall', hold: 4200 },
    ],
  },
  {
    img: 'ch18g23', title: 'The King Refuses to Believe', mood: 'disbelief', kb: 'in', trans: 'dip',
    beats: [
      { t: 'd', who: 'Ravana', text: 'No.', speed: 120, hold: 2600 },
      { t: 'd', who: 'Ravana', text: 'You speak of Indrajit? My Meghanada?', hold: 1500 },
      { t: 'd', who: 'Messenger', text: 'Forgive me, Maharaja. I witnessed it myself.', hold: 1700 },
      { t: 'd', who: 'Ravana', text: 'Impossible. My son has defeated the greatest warriors of the heavens. No ordinary warrior could have brought him down.', hold: 2000 },
      { t: 'n', text: 'For a moment, the king who had challenged the heavens could not accept the words spoken before him.', hold: 1300 },
    ],
  },
  {
    img: 'ch18g24', title: 'The Father Remembers', mood: 'memory', kb: 'in', trans: 'warm', slow: true,
    beats: [
      { t: 'n', text: 'Before he became Lanka’s greatest warrior, before the world knew him as Indrajit, he had been Meghanada — a son in his father’s palace.', hold: 2000 },
      { t: 'd', who: 'Ravana', tag: 'In memory', text: 'I remember the day you first stood before me…', hold: 3200 },
    ],
  },
  {
    img: 'ch18g25', title: 'The Prince of Lanka', mood: 'memory', kb: 'out', trans: 'warm', slow: true, memoryFade: true,
    beats: [
      { t: 'n', text: 'He had brought glory to Lanka. He had defeated mighty opponents and earned a name that echoed through the three worlds. To his people, he was their greatest protector. To Ravana, he was his son.', hold: 2200 },
      { t: 'd', who: 'Ravana', tag: 'Remembered voice', text: 'You were born to carry the strength of our house, Meghanada. And you did more than I ever asked of you.', hold: 3000 },
    ],
  },
  {
    img: 'ch18g26', title: 'A King Alone', mood: 'grief', kb: 'in', trans: 'dark', slow: true,
    beats: [
      { t: 'n', text: 'The court had emptied. The voices had faded. Yet the news remained. The mighty Ravana, before whom kings had bowed, now stood alone with a loss no throne could undo.', hold: 2400 },
      { t: 'd', who: 'Ravana', text: 'My son…', speed: 70, hold: 2800 },
      { t: 'd', who: 'Ravana', text: 'You were meant to return.', speed: 60, hold: 1800 },
    ],
  },
  {
    img: 'ch18g27', title: 'What Remains', mood: 'grief', kb: 'out', trans: 'dip', slow: true,
    beats: [
      { t: 'n', text: 'His weapons remained. His place remained. The memories of his victories remained. But the warrior who had given them meaning would never return.', hold: 2300 },
      { t: 'd', who: 'Ravana', text: 'I gave you every honour a father could give a son. Yet I could not protect you from this day.', hold: 4400 },
    ],
  },
  {
    img: 'ch18g28', title: 'Grief Becomes Fury', mood: 'fury', kb: 'in', trans: 'ember',
    beats: [
      { t: 'n', text: 'Grief slowly gave way to fury. But beneath the fury remained a father’s sorrow — a wound that no victory could heal.', hold: 2000 },
      { t: 'd', who: 'Ravana', text: 'Lakshmana has taken my son from me.', hold: 2400 },
      { t: 'd', who: 'Ravana', text: 'This war has taken everything from my house.', hold: 2000 },
      { t: 'd', who: 'Ravana', text: 'Prepare my armour.', speed: 55, sfx: 'drum', hold: 1500 },
    ],
  },
  {
    img: 'ch18g29', title: 'Before Lord Shiva', mood: 'temple', kb: 'in', trans: 'gold', slow: true,
    beats: [
      { t: 'n', text: 'Before entering the battlefield, Ravana went to seek the blessings of the Lord he had worshipped with unwavering devotion.', sfx: 'bell', hold: 2000 },
      { t: 'd', who: 'Ravana', text: 'Mahadeva… you have witnessed my victories. You have witnessed my pride. Today, I stand before you as a father who has lost his son.', hold: 2800 },
      { t: 'd', who: 'Ravana', text: 'Grant me the strength to face what remains.', hold: 1500 },
    ],
  },
  {
    img: 'ch18g210', title: 'The King Marches to War', mood: 'march', kb: 'in', trans: 'dip', auto: true,
    beats: [
      { t: 'n', text: 'The father had mourned. The devotee had prayed. Now the king of Lanka would return to the battlefield.', hold: 1800 },
      { t: 'd', who: 'Ravana', text: 'Indrajit… your father will face the war that took you from him.', sfx: 'drum', hold: 2200 },
      { t: 'n', text: 'And so Ravana marched towards the final confrontation with Rama. Not merely as the king of Lanka, but as a father carrying the greatest loss of his life.', hold: 4200 },
    ],
  },
]

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const pad2 = (n) => String(n).padStart(2, '0')
const fullText = (b) => (b.t === 'd' ? `“${b.text}”` : b.text)

/* pacing — lower TYPE_SPEED = faster text; HOLD_SCALE shortens the pauses between lines */
const TYPE_SPEED = 0.42
const HOLD_SCALE = 0.7

/* ──────────────────────────────────────────────────────────────
   LIVE SCORE — procedural, solemn, muted. No audio files needed.
   drone · slow pads · temple bell · heartbeat · war-drum
   ────────────────────────────────────────────────────────────── */
const SCALES = {
  dark: [146.83, 155.56, 196, 220, 233.08, 293.66],
  warm: [146.83, 185, 220, 246.94, 293.66, 329.63],
  sacred: [146.83, 196, 220, 293.66, 392],
}

class Score {
  constructor() {
    this.ctx = null
    this.muted = false
    this.duckLevel = 1
    this.base = 0.7
    this.scale = 'dark'
    this.padDensity = 0.4
    this.padTimer = null
    this.beatTimer = null
  }

  start() {
    if (this.ctx) {
      this.ctx.resume && this.ctx.resume()
      return
    }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    try {
      const ctx = new AC()
      this.ctx = ctx
      const master = ctx.createGain()
      master.gain.value = 0
      master.connect(ctx.destination)
      this.master = master

      const len = Math.floor(ctx.sampleRate * 3.4)
      const buf = ctx.createBuffer(2, len, ctx.sampleRate)
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c)
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8)
      }
      const verb = ctx.createConvolver()
      verb.buffer = buf
      const vg = ctx.createGain()
      vg.gain.value = 0.6
      verb.connect(vg)
      vg.connect(master)
      const dry = ctx.createGain()
      dry.gain.value = 0.85
      dry.connect(master)
      this.verb = verb
      this.dry = dry

      const filt = ctx.createBiquadFilter()
      filt.type = 'lowpass'
      filt.frequency.value = 380
      filt.Q.value = 0.8
      const dg = ctx.createGain()
      dg.gain.value = 0
      filt.connect(dg)
      dg.connect(dry)
      dg.connect(verb)
      ;[
        [73.42, 'sawtooth', -7, 0.16],
        [73.42, 'sawtooth', 6, 0.16],
        [110, 'triangle', 0, 0.22],
        [36.71, 'sine', 0, 0.55],
      ].forEach(([f, type, det, gain]) => {
        const o = ctx.createOscillator()
        o.type = type
        o.frequency.value = f
        o.detune.value = det
        const g = ctx.createGain()
        g.gain.value = gain
        o.connect(g)
        g.connect(filt)
        o.start()
      })
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.07
      const lg = ctx.createGain()
      lg.gain.value = 110
      lfo.connect(lg)
      lg.connect(filt.frequency)
      lfo.start()
      this.filt = filt
      this.dg = dg

      this.applyMaster(3.5)
      this.padLoop()
    } catch (e) {
      this.ctx = null
    }
  }

  applyMaster(secs = 1.2) {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.base * this.duckLevel, now, Math.max(0.05, secs / 3))
  }

  setMuted(m) {
    this.muted = m
    this.applyMaster(0.5)
  }

  duck(level, secs = 1) {
    this.duckLevel = level
    this.applyMaster(secs)
  }

  setMood(a) {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    this.dg.gain.setTargetAtTime(a.drone, now, 1.4)
    this.filt.frequency.setTargetAtTime(a.cutoff, now, 1.6)
    this.scale = a.scale
    this.padDensity = a.pad
    this.setBeat(a.beat, a.period)
  }

  padLoop() {
    const tick = () => {
      if (!this.ctx) return
      if (Math.random() < this.padDensity) this.pad()
      this.padTimer = setTimeout(tick, 3200 + Math.random() * 2600)
    }
    tick()
  }

  pad() {
    const ctx = this.ctx
    if (!ctx) return
    const s = SCALES[this.scale] || SCALES.dark
    const f = s[(Math.random() * s.length) | 0]
    const t = ctx.currentTime
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.06, t + 2.6)
    g.gain.linearRampToValueAtTime(0, t + 8.5)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1400
    ;[0, 5].forEach((det) => {
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = f
      o.detune.value = det
      o.connect(lp)
      o.start(t)
      o.stop(t + 9)
    })
    lp.connect(g)
    g.connect(this.verb)
    g.connect(this.dry)
  }

  bell(delay = 0) {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime + delay
    ;[
      [1, 0.5, 7],
      [2.76, 0.28, 5],
      [5.4, 0.14, 3.5],
      [8.93, 0.07, 2.2],
    ].forEach(([m, v, d]) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = 392 * m
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(v * 0.16, t + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 1)
      o.connect(g)
      g.connect(this.verb)
      g.connect(this.dry)
      o.start(t)
      o.stop(t + d + 1.2)
    })
  }

  thump(at, vol, f0) {
    const ctx = this.ctx
    if (!ctx) return
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(f0, at)
    o.frequency.exponentialRampToValueAtTime(34, at + 0.22)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(vol, at + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.32)
    o.connect(g)
    g.connect(this.dry)
    g.connect(this.verb)
    o.start(at)
    o.stop(at + 0.36)
  }

  heart() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.thump(t, 0.5, 78)
    this.thump(t + 0.27, 0.34, 66)
  }

  drum(v = 1, delay = 0) {
    if (!this.ctx) return
    const t = this.ctx.currentTime + delay
    this.thump(t, 0.75 * v, 98)
    this.thump(t, 0.45 * v, 54)
  }

  setBeat(kind, period) {
    clearTimeout(this.beatTimer)
    if (!kind || !this.ctx) return
    const tick = () => {
      if (!this.ctx) return
      kind === 'heart' ? this.heart() : this.drum(1)
      this.beatTimer = setTimeout(tick, period)
    }
    this.beatTimer = setTimeout(tick, 900)
  }

  stop() {
    clearTimeout(this.padTimer)
    clearTimeout(this.beatTimer)
    try {
      this.ctx && this.ctx.close()
    } catch (e) {
      /* noop */
    }
    this.ctx = null
  }
}

/* ──────────────────────────────────────────────────────────────
   3D ATMOSPHERE (react-three-fiber)
   embers / ash / dust · volumetric light shafts · drifting mist
   camera parallaxes with the pointer
   ────────────────────────────────────────────────────────────── */
const glowTexture = () => {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.38)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

const EMBER_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPR;
  uniform float uSize;
  varying float vTw;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uSize * uPR * (7.0 / -mv.z);
    vTw = 0.5 + 0.5 * sin(uTime * (0.8 + aSeed * 2.2) + aSeed * 40.0);
  }
`
const EMBER_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vTw;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor, a * (0.35 + 0.65 * vTw) * uOpacity);
  }
`

function Embers({ cur, count }) {
  const { geo, mat, pos, vel, ph } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const seed = new Float32Array(count)
    const vel = new Float32Array(count)
    const ph = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9
      pos[i * 3 + 2] = -3 + Math.random() * 6
      size[i] = 3 + Math.random() * Math.random() * 16
      seed[i] = Math.random()
      vel[i] = 0.25 + Math.random() * 0.75
      ph[i] = Math.random() * 6.28
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPR: { value: 1 },
        uSize: { value: 1 },
        uOpacity: { value: 0.8 },
        uColor: { value: new THREE.Color(1, 0.8, 0.4) },
      },
      vertexShader: EMBER_VERT,
      fragmentShader: EMBER_FRAG,
    })
    return { geo, mat, pos, vel, ph }
  }, [count])

  useFrame((state, delta) => {
    const c = cur.current
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const j = i * 3
      pos[j + 1] += vel[i] * c.rise * dt * 1.4
      pos[j] += (Math.sin(t * 0.6 + ph[i]) * 0.12 + c.wind) * dt * (0.4 + vel[i])
      if (pos[j + 1] > 4.6) {
        pos[j + 1] = -4.6
        pos[j] = (Math.random() - 0.5) * 16
      } else if (pos[j + 1] < -4.6) {
        pos[j + 1] = 4.6
        pos[j] = (Math.random() - 0.5) * 16
      }
      if (pos[j] > 8) pos[j] = -8
      else if (pos[j] < -8) pos[j] = 8
    }
    geo.attributes.position.needsUpdate = true
    const u = mat.uniforms
    u.uTime.value = t
    u.uPR.value = state.gl.getPixelRatio()
    u.uSize.value = c.size
    u.uOpacity.value = c.op
    u.uColor.value.setRGB(c.r, c.g, c.b)
  })

  return <points geometry={geo} material={mat} frustumCulled={false} />
}

const RAY_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const RAY_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uPhase;
  uniform vec3 uColor;
  void main() {
    float across = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
    float along = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
    float shimmer = 0.62 + 0.38 * sin(uTime * 0.4 + uPhase);
    gl_FragColor = vec4(uColor, across * across * along * uOpacity * shimmer * 0.5);
  }
`

function Rays({ cur }) {
  const items = useMemo(
    () => [...Array(6)].map((_, i) => ({ x: -6 + i * 2.4, w: 0.8 + Math.random() * 1.5, rot: -0.55 + Math.random() * 0.2, ph: Math.random() * 6 })),
    []
  )
  const mats = useMemo(
    () =>
      items.map(
        (it) =>
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uPhase: { value: it.ph }, uColor: { value: new THREE.Color() } },
            vertexShader: RAY_VERT,
            fragmentShader: RAY_FRAG,
          })
      ),
    [items]
  )
  useFrame((state) => {
    const c = cur.current
    mats.forEach((m) => {
      m.uniforms.uTime.value = state.clock.elapsedTime
      m.uniforms.uOpacity.value = c.rays
      m.uniforms.uColor.value.setRGB(c.r, c.g, c.b)
    })
  })
  return (
    <>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, 2, -1.2]} rotation={[0, 0, it.rot]}>
          <planeGeometry args={[it.w, 14]} />
          <primitive object={mats[i]} attach="material" />
        </mesh>
      ))}
    </>
  )
}

function Mist({ cur }) {
  const tex = useMemo(glowTexture, [])
  const refs = useRef([])
  const items = useMemo(
    () => [...Array(5)].map((_, i) => ({ x: (i - 2) * 4.2, y: -2.7 + Math.random() * 1.2, z: -1.5 + i * 0.35, s: 7 + Math.random() * 4, sp: 0.05 + Math.random() * 0.05, ph: Math.random() * 6 })),
    []
  )
  useFrame((state) => {
    const c = cur.current
    const t = state.clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (!m) return
      const it = items[i]
      m.position.x = it.x + Math.sin(t * it.sp + it.ph) * 1.8
      m.material.opacity = c.mist * (0.7 + 0.3 * Math.sin(t * 0.3 + it.ph))
      m.material.color.setRGB(c.mr, c.mg, c.mb)
    })
  })
  return (
    <>
      {items.map((it, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={[it.x, it.y, it.z]}>
          <planeGeometry args={[it.s * 1.6, it.s * 0.7]} />
          <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}

function Atmosphere({ moodRef, pointer, count }) {
  const cur = useRef(flat(MOODS.court.v))
  const { camera } = useThree()
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = moodRef.current
    const c = cur.current
    const k = Math.min(1, dt * 0.9)
    for (const key in c) c[key] += (target[key] - c[key]) * k
    camera.position.x += (pointer.current.x * 0.55 - camera.position.x) * Math.min(1, dt * 2)
    camera.position.y += (-pointer.current.y * 0.3 - camera.position.y) * Math.min(1, dt * 2)
    camera.lookAt(0, 0, 0)
  })
  return (
    <>
      <Mist cur={cur} />
      <Rays cur={cur} />
      <Embers cur={cur} count={count} />
    </>
  )
}

class FxBoundary extends React.Component {
  constructor(p) {
    super(p)
    this.state = { bad: false }
  }
  static getDerivedStateFromError() {
    return { bad: true }
  }
  componentDidCatch() {}
  render() {
    return this.state.bad ? null : this.props.children
  }
}

/* ──────────────────────────────────────────────────────────────
   GAME
   ────────────────────────────────────────────────────────────── */
export default function FathersLossGame({ onClose, onComplete }) {
  const [phase, setPhase] = useState('intro') // intro | play | end
  const [si, setSi] = useState(0)
  const [bi, setBi] = useState(0)
  const [typed, setTyped] = useState(0)
  const [status, setStatus] = useState('typing') // typing | typed | done
  const [ratios, setRatios] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [muted, setMuted] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [flashKey, setFlashKey] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const scoreRef = useRef(null)
  const timerRef = useRef(null)
  const holdRef = useRef(null)
  const leaveRef = useRef(null)
  const cbRef = useRef({})
  cbRef.current = { onComplete, onClose }
  const sfxGuard = useRef('')
  const pointer = useRef({ x: 0, y: 0 })
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotY = useSpring(mx, { stiffness: 60, damping: 18 })
  const rotX = useSpring(my, { stiffness: 60, damping: 18 })

  const reduced = useMemo(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const particleCount = useMemo(() => (reduced ? 70 : typeof window !== 'undefined' && window.innerWidth < 700 ? 130 : 240), [reduced])

  const scene = SCENES[si]
  const beat = scene.beats[bi]
  const lastBeat = bi === scene.beats.length - 1
  const text = fullText(beat)
  const shown = text.slice(0, Math.min(typed, text.length))
  const rest = text.slice(shown.length)

  const moodKey = phase === 'intro' ? 'court' : phase === 'end' ? 'end' : scene.mood
  const mood = MOODS[moodKey]
  const moodRef = useRef(flat(mood.v))
  moodRef.current = flat(mood.v)

  /* preload the ten images + read their true proportions */
  useEffect(() => {
    let alive = true
    let count = 0
    const r = {}
    const finish = () => {
      count += 1
      if (alive && count === SCENES.length) {
        setRatios(r)
        setLoaded(true)
      }
    }
    SCENES.forEach((s) => {
      const im = new Image()
      im.onload = () => {
        r[s.img] = im.naturalWidth / im.naturalHeight
        finish()
      }
      im.onerror = finish
      im.src = img(s.img)
    })
    const t = setTimeout(() => alive && setLoaded(true), 6000)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [])

  useEffect(
    () => () => {
      clearTimeout(timerRef.current)
      clearTimeout(holdRef.current)
      clearTimeout(leaveRef.current)
      scoreRef.current && scoreRef.current.stop()
    },
    []
  )

  /* score follows the emotional register */
  useEffect(() => {
    const sc = scoreRef.current
    if (!sc || phase === 'intro') return
    sc.setMood(MOODS[moodKey].audio)
    sc.duck(1, 2.4)
  }, [phase, si, moodKey])

  const fireSfx = useCallback((k) => {
    const sc = scoreRef.current
    if (k === 'fall') {
      sc && sc.duck(0.1, 0.7)
      setShaking(true)
      setTimeout(() => setShaking(false), 900)
      setFlashKey((n) => n + 1)
    } else if (k === 'bell') {
      sc && sc.bell(1.2)
    } else if (k === 'drum') {
      sc && sc.drum(1, 0.2)
    }
  }, [])

  /* typewriter */
  useEffect(() => {
    if (phase !== 'play') return undefined
    const b = SCENES[si].beats[bi]
    const t = fullText(b)
    const guard = `${si}-${bi}`
    if (b.sfx && sfxGuard.current !== guard) {
      sfxGuard.current = guard
      fireSfx(b.sfx)
    }
    setTyped(0)
    setStatus('typing')
    let i = 0
    const base = (b.speed || (b.t === 'n' ? 30 : b.t === 'a' ? 22 : 38)) * TYPE_SPEED
    const step = () => {
      i += 1
      setTyped(i)
      if (i >= t.length) {
        setStatus('typed')
        return
      }
      const ch = t[i - 1]
      let d = base
      if (ch === '…') d += 600 * TYPE_SPEED
      else if (ch === '—') d += 260 * TYPE_SPEED
      else if (ch === ',' || ch === ';') d += 200 * TYPE_SPEED
      else if ('.!?”'.includes(ch) && t[i] === ' ') d += 440 * TYPE_SPEED
      timerRef.current = setTimeout(step, d)
    }
    timerRef.current = setTimeout(step, bi === 0 ? 1100 : 280)
    return () => clearTimeout(timerRef.current)
  }, [phase, si, bi, fireSfx])

  const goNext = useCallback(() => {
    clearTimeout(holdRef.current)
    if (si >= SCENES.length - 1) {
      /* the story ends on its last line: fade out gently, then hand control back */
      if (leaveRef.current) return
      setLeaving(true)
      scoreRef.current && scoreRef.current.duck(0, 1.6)
      leaveRef.current = setTimeout(() => {
        const cb = cbRef.current
        if (cb.onComplete) cb.onComplete()
        else if (cb.onClose) cb.onClose()
      }, 1700)
      return
    }
    setTyped(0)
    setStatus('typing')
    setBi(0)
    setSi((s) => s + 1)
  }, [si])

  /* hold after each line, then next beat / continue / auto-end */
  useEffect(() => {
    if (phase !== 'play' || status !== 'typed') return undefined
    const b = SCENES[si].beats[bi]
    if (b.sfxEnd) fireSfx(b.sfxEnd)
    holdRef.current = setTimeout(
      () => {
        if (bi < SCENES[si].beats.length - 1) {
          setTyped(0)
          setStatus('typing')
          setBi((x) => x + 1)
        } else if (SCENES[si].auto) {
          goNext()
        } else {
          setStatus('done')
        }
      },
      (b.hold || 1200) * HOLD_SCALE
    )
    return () => clearTimeout(holdRef.current)
  }, [phase, si, bi, status, fireSfx, goNext])

  const completeTyping = () => {
    clearTimeout(timerRef.current)
    setTyped(text.length)
    setStatus('typed')
  }

  const onTap = useCallback(() => {
    if (phase !== 'play') return
    if (status === 'typing' && typed > 0) {
      completeTyping()
    } else if (status === 'typed' && !lastBeat) {
      clearTimeout(holdRef.current)
      setTyped(0)
      setStatus('typing')
      setBi((x) => x + 1)
    } else if (status === 'done') {
      goNext()
    } else if (status === 'typed' && lastBeat && SCENES[si].auto) {
      goNext() /* tap on the final line to finish sooner */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, status, typed, lastBeat, goNext, text, si])

  useEffect(() => {
    const h = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        onTap()
      } else if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onTap, onClose])

  const begin = () => {
    if (!scoreRef.current) scoreRef.current = new Score()
    scoreRef.current.start()
    scoreRef.current.setMuted(muted)
    setSi(0)
    setBi(0)
    setTyped(0)
    setStatus('typing')
    setPhase('play')
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    const m = !muted
    setMuted(m)
    scoreRef.current && scoreRef.current.setMuted(m)
  }

  const onMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2
    const y = (e.clientY / window.innerHeight - 0.5) * 2
    pointer.current = { x, y }
    mx.set(x * 1.1)
    my.set(-y * 0.8)
  }

  const bgScene = phase === 'intro' ? SCENES[0] : scene
  const ratio = ratios[scene.img] || 16 / 9
  const memoryFading = scene.memoryFade && status === 'done'

  const label = beat.t === 'n' ? 'Narration' : beat.who
  const showFoot = phase === 'play'

  return (
    <div className={`fl-root phase-${phase}`} onPointerMove={onMove} onClick={onTap}>
      {/* ── blurred cinematic backdrop ── */}
      <div className="fl-bg" aria-hidden="true">
        <AnimatePresence>
          <motion.div
            key={bgScene.img}
            className="fl-bgimg"
            style={{ backgroundImage: `url(${img(bgScene.img)})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: 'easeInOut' }}
          />
        </AnimatePresence>
        <div className="fl-bgshade" />
      </div>

      {/* ── header ── */}
      <header className="fl-head">
        <div className="fl-head-l">
          {onClose && (
            <button className="fl-icon" onClick={(e) => { e.stopPropagation(); onClose() }} aria-label="Close">
              <X size={16} />
            </button>
          )}
          <div className="fl-brand">
            <b>ANCESTRA</b>
            <span>Yuddha Kanda · Chapter XVIII</span>
          </div>
        </div>
        <div className="fl-head-r">
          <div className="fl-counter" aria-label={`Scene ${si + 1} of 10`}>
            <b>{pad2(phase === 'end' ? 10 : si + 1)}</b>
            <span> / 10</span>
            <div className="fl-pips">
              {SCENES.map((_, i) => (
                <i key={i} className={i < (phase === 'end' ? 10 : si) ? 'on' : i === si && phase === 'play' ? 'cur' : ''} />
              ))}
            </div>
          </div>
          <button className="fl-icon" onClick={toggleMute} aria-label={muted ? 'Unmute score' : 'Mute score'}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* ── stage: the scene image, preserved at its true proportions ── */}
      <div className={`fl-stage${shaking ? ' shaking' : ''}`}>
        <AnimatePresence mode="sync">
          {phase !== 'intro' && (
            <motion.div
              key={scene.img}
              className="fl-wrap"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: scene.slow ? 2.6 : 1.6, ease: 'easeInOut' }}
            >
              <div className="fl-arbox" style={{ '--ar': ratio }}>
                <motion.div className="fl-tilt" style={reduced ? undefined : { rotateX: rotX, rotateY: rotY }}>
                  <motion.div
                    className="fl-frame"
                    initial={{ scale: reduced ? 1 : scene.kb === 'out' ? 1 : 0.975 }}
                    animate={{ scale: reduced ? 1 : scene.kb === 'out' ? 0.975 : 1 }}
                    transition={{ duration: 34, ease: 'linear' }}
                  >
                    <div className="fl-clip">
                      <img
                        className={`fl-img${memoryFading ? ' fading' : ''}`}
                        src={img(scene.img)}
                        alt={scene.title}
                        draggable={false}
                        style={{ '--grade': mood.grade }}
                      />
                      {mood.bloom && <div className="fl-ov fl-bloom" />}
                      {mood.fury && <div className="fl-ov fl-furypulse" />}
                      {mood.flicker && <div className="fl-ov fl-flicker" />}
                      <div className="fl-ov fl-inner-shade" />
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* scene title lower-third */}
        <AnimatePresence>
          {phase === 'play' && (
            <motion.div
              key={`lt-${si}`}
              className="fl-lower"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: [0, 1, 1, 0], x: [-18, 0, 0, 10] }}
              transition={{ duration: 4.4, times: [0, 0.18, 0.8, 1], delay: 0.8 }}
            >
              <span>Scene {ROMAN[si]}</span>
              <strong>{scene.title}</strong>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── cinematic caption (no text box) ── */}
      <div className={`fl-scrim${phase === 'play' && typed > 0 ? ' on' : ''}`} />
      <div className="fl-caption" style={{ opacity: phase === 'play' ? 1 : 0 }} aria-label={text}>
        <div className="fl-who">
          <AnimatePresence mode="wait">
            {typed > 0 && beat.t !== 'a' && (
              <motion.div
                key={`${si}-${bi}`}
                className={`fl-name ${beat.t === 'n' ? 'narr' : 'char'}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {label}
                {beat.tag && <em>{beat.tag}</em>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className={`fl-line ${beat.t}`}>
          {shown}
          {status === 'typing' && typed > 0 && <span className="fl-caret" />}
          <span className="fl-ghost">{rest}</span>
        </p>
        <div className="fl-foot">
          <AnimatePresence>
            {showFoot && status === 'done' && !scene.auto && (
              <motion.button
                className="fl-continue"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
              >
                Continue <ChevronRight size={15} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── 3D atmosphere ── */}
      <div className="fl-canvas" aria-hidden="true">
        <FxBoundary>
          <Canvas
            dpr={[1, 1.6]}
            camera={{ position: [0, 0, 6], fov: 50 }}
            gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          >
            <Atmosphere moodRef={moodRef} pointer={pointer} count={particleCount} />
          </Canvas>
        </FxBoundary>
      </div>

      <div className="fl-vig" style={{ opacity: mood.vig * 0.55 }} />
      {mood.heart && <div className="fl-heart" />}

      {/* scene-to-scene dips: warm for memory, black for grief, ember for fury */}
      <AnimatePresence>
        {phase === 'play' && (
          <motion.div
            key={`tr-${si}`}
            className={`fl-trans ${scene.trans}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, scene.trans === 'dip' ? 0.6 : 0.9, 0] }}
            transition={{ duration: scene.slow ? 3 : 2.1, times: [0, 0.4, 1], ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* impact flash for “He has fallen” */}
      {flashKey > 0 && <motion.div key={`fx-${flashKey}`} className="fl-flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.55, 0] }} transition={{ duration: 1.8, times: [0, 0.08, 1] }} />}

      {/* ── intro ── */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div className="fl-intro" exit={{ opacity: 0 }} transition={{ duration: 1.4 }}>
            <motion.div className="fl-intro-in" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}>
              <p className="fl-eyebrow">Ancestra · Game 2</p>
              <p className="fl-chapter">Yuddha Kanda · Chapter XVIII</p>
              <h1 className="fl-h1">The Fall of Indrajit</h1>
              <div className="fl-rule"><span /></div>
              <p className="fl-tagline">The father behind the king.</p>
              <button className="fl-begin" onClick={begin} disabled={!loaded}>
                {loaded ? 'Begin' : 'Preparing the court…'}
              </button>
              <p className="fl-note">Experienced best with sound</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── gentle fade to black when the last line is done ── */}
      {leaving && (
        <motion.div
          className="fl-leave"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      )}

      <div className="fl-grain" aria-hidden="true" />
    </div>
  )
}