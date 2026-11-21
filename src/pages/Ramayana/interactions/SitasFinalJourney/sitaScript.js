// ANCESTRA · Chapter XXVI · Sita's Final Journey
// All story, camera and timing data lives here so the component stays clean.
// Camera focal points (ox/oy = transform-origin in %, s = zoom) are tunable per image.

const IMG = '/images/ramayana/interactions/';

export const PANEL_OUT = 480; // ms the dialogue panel takes to leave
export const COOLDOWN = 260; // ms after a line finishes before Continue is accepted (prevents double advance)
export const BEAT_PAUSE = 600; // default pause between beats inside one line
export const FINAL_HOLD = 4200; // ms the final image rests on screen before the fade to black
export const FADE_OUT = 2800; // ms of the fade to black before the ending screen
export const DEFAULT_HOLD = 900; // ms a finished line stays before auto-advancing (Continue skips the wait)
export const FIRST_LINE_DELAY = 1500; // ms of silence after the fade from black before the first line

export const SPEAKERS = {
  valmiki: { name: 'Valmiki', color: '#9a7a35' },
  sita: { name: 'Sita', color: '#a4552b' },
  rama: { name: 'Rama', color: '#4c6478' },
  earth: { name: 'Mother Earth', color: '#566d3a' },
  lava: { name: 'Luv', color: '#8a5b2e', side: 'left' },
  kusha: { name: 'Kush', color: '#6f5478', side: 'right' },
};

// Particle atmospheres (subtle, depth-layered). tone = RGB of the glowing motes.
export const PARTICLES = {
  none: { motes: 0, petals: 0, tone: '255,232,186' },
  dust: { motes: 26, petals: 0, tone: '255,232,186' },
  hush: { motes: 14, petals: 0, tone: '255,226,176' },
  pollen: { motes: 42, petals: 7, tone: '255,214,130' },
  farewell: { motes: 46, petals: 28, tone: '255,220,150' },
};

const SLOW = 'cubic-bezier(.3,.05,.2,1)';

export const SCENES = [
  // ───────────────────────── SCENE 1 — THE FINAL OATH
  {
    id: 'oath',
    numeral: 'I',
    title: 'The Final Oath',
    image: IMG + 'ch26g21.jpg',
    enter: { dur: 2200, firstLineDelay: 1400 },
    cam: {
      from: { s: 1.06, x: 0, y: 1, ox: 50, oy: 52 },
      to: { s: 1.22, x: 0, y: 0, ox: 50, oy: 46, dur: 52000, ease: SLOW },
    },
    mood: 'hall',
    particles: 'dust',
    rays: 0.55,
    tint: 'linear-gradient(180deg, rgba(255,176,90,.10), rgba(50,22,4,.26))',
    lines: [
      {
        who: 'valmiki',
        beats: [
          'Before this assembly, I speak of Sita’s truth and dignity.',
          'I have known her through the years she has lived in my hermitage.',
          'I stand as a witness to her character.',
        ],
        pauses: [0, 500, 500],
      },
      {
        who: 'sita',
        beats: [
          'I have lived according to dharma.',
          'I have remained faithful in thought and action.',
          'I have carried the pain of separation without abandoning the truth.',
        ],
        pauses: [0, 500, 500],
        speed: 27,
      },
      {
        who: 'sita',
        beats: [
          'I have nothing more to prove before those who continue to doubt me.',
          'I shall now call upon the one witness who has known me since the beginning.',
        ],
        pauses: [0, 700],
        speed: 29,
        gapBefore: 300,
        // subtle close-up of Sita's face
        cam: { s: 1.5, x: 0, y: 0, ox: 50, oy: 38, dur: 9000, ease: SLOW },
      },
    ],
  },

  // ───────────────────────── SCENE 2 — SITA CALLS MOTHER EARTH
  {
    id: 'invoke',
    numeral: 'II',
    title: 'The Invocation',
    image: IMG + 'ch26g22.jpg',
    enter: { dur: 2000, firstLineDelay: 1300 },
    cam: {
      from: { s: 1.06, x: 0, y: 0, ox: 50, oy: 50 },
      to: { s: 1.3, x: 0, y: 0, ox: 50, oy: 44, dur: 34000, ease: SLOW },
    },
    mood: 'hush',
    moodSec: 4,
    particles: 'hush',
    rays: 0.22,
    tint: 'linear-gradient(180deg, rgba(200,170,120,.06), rgba(30,16,4,.32))',
    lines: [
      {
        who: 'sita',
        // exact chapter line: "Mother Earth, if I have remained faithful to Rama in thought and action, then receive me into your embrace."
        beats: [
          'Mother Earth,',
          'if I have remained faithful to Rama in thought and action, then receive me into your embrace.',
        ],
        pauses: [0, 800],
        speed: 33,
        style: 'soft',
        autoNext: 1300,
      },
      {
        who: 'sita',
        beats: ['If I have never turned away from the truth, then let the Earth herself bear witness.'],
        speed: 37,
        style: 'soft',
        fx: { shakeSeq: [[3600, 1]], mood: 'tremor', moodSec: 7 },
        cam: { s: 1.5, x: 0, y: 0, ox: 50, oy: 46, dur: 14000, ease: SLOW },
        autoNext: 1700,
      },
    ],
  },

  // ───────────────────────── SCENE 3 — RAMA RISES AND CALLS SITA
  {
    id: 'rama',
    numeral: 'III',
    title: 'Rama Rises',
    image: IMG + 'ch26g23.jpg',
    enter: { dur: 420, firstLineDelay: 500 }, // sudden but smooth cut
    cam: {
      from: { s: 1.14, x: 0, y: 0, ox: 50, oy: 40 },
      to: { s: 1.4, x: 0, y: 0, ox: 50, oy: 34, dur: 3600, ease: 'cubic-bezier(.12,.75,.25,1)' },
    },
    mood: 'grief',
    moodSec: 1.5,
    shake: 1,
    particles: 'dust',
    rays: 0.08,
    tint: 'radial-gradient(ellipse at 50% 40%, rgba(255,150,60,.10), rgba(40,12,0,.34))',
    lines: [
      {
        who: 'rama',
        beats: ['SITA!'],
        speed: 50,
        style: 'cry',
        fx: { pulse: true, swell: true, shakeSeq: [[0, 2], [1100, 1]] },
        autoNext: 1800, // the silence after his cry
      },
      {
        who: 'rama',
        beats: ['Sita...'],
        speed: 120,
        style: 'soft',
        gapBefore: 400,
      },
    ],
  },

  // ───────────────────────── SCENE 4 — MOTHER EARTH APPEARS
  {
    id: 'earth',
    numeral: 'IV',
    title: 'The Earth Opens',
    image: IMG + 'ch26g24.jpg',
    enter: { dur: 2000, firstLineDelay: 1500 },
    cam: {
      from: { s: 1.05, x: 0, y: 0, ox: 50, oy: 50 },
      to: { s: 1.28, x: 0, y: 0, ox: 52, oy: 36, dur: 48000, ease: SLOW },
    },
    mood: 'earth',
    moodSec: 3,
    particles: 'pollen',
    rays: 0.8,
    tint: 'linear-gradient(180deg, rgba(120,170,80,.10), rgba(255,200,110,.10))',
    enterFx: { shakeSeq: [[0, 1], [5200, 0]] },
    lines: [
      {
        who: 'earth',
        beats: ['Come, my daughter.', 'Your mother is here.', 'Come into my embrace.'],
        pauses: [0, 500, 500],
        speed: 32,
        style: 'soft',
      },
      {
        who: 'sita',
        beats: ['Mother...'],
        speed: 65,
        style: 'soft',
        autoNext: 900,
      },
      {
        who: 'sita',
        beats: ['I have fulfilled the path I was given to walk.', 'Now I return to you.'],
        pauses: [0, 700],
        speed: 30,
      },
      {
        who: 'earth',
        beats: ['Come, my child.'],
        speed: 39,
        style: 'soft',
        cam: { s: 1.36, x: 0, y: 0, ox: 52, oy: 34, dur: 10000, ease: SLOW },
      },
    ],
  },

  // ───────────────────────── SCENE 5 — THE SONS CALL THEIR MOTHER
  {
    id: 'sons',
    numeral: 'V',
    title: 'The Sons Call Their Mother',
    image: IMG + 'ch26g25.jpg',
    enter: { dur: 2000, firstLineDelay: 1400 },
    cam: {
      from: { s: 1.02, x: 0, y: 0, ox: 50, oy: 56 },
      to: { s: 1.2, x: 0, y: 0, ox: 50, oy: 48, dur: 62000, ease: SLOW },
    },
    mood: 'farewell',
    moodSec: 4,
    melody: true,
    particles: 'farewell',
    rays: 0.7,
    tint: 'linear-gradient(180deg, rgba(255,210,140,.12), rgba(70,40,10,.18))',
    lines: [
      { who: 'lava', beats: ['Mother!'], speed: 43, style: 'call', autoNext: 900 },
      { who: 'kusha', beats: ['Mother!'], speed: 43, style: 'call', autoNext: 800 },
      { who: 'lava', beats: ['Mother, wait!'], speed: 40, style: 'call', autoNext: 900 },
      { who: 'kusha', beats: ['Mother!'], speed: 48, style: 'call', autoNext: 900 },
      { who: 'rama', beats: ['Sita!'], speed: 58, style: 'call', autoNext: 1200 },
      { who: 'earth', beats: ['Come, my daughter.'], speed: 40, style: 'soft', autoNext: 1400 },
      { who: 'sita', beats: ['My children...'], speed: 65, style: 'soft', autoNext: 1500 },
    ],
  },
];

export const lineText = (line) => line.beats.join(' ');

// Builds the per-character typing schedule (delay is the wait *before* each character).
export function buildPlan(line, reduced = false) {
  const base = reduced ? 6 : line.speed ?? 26;
  const pauses = line.pauses || [];
  const plan = [];
  line.beats.forEach((beat, bi) => {
    const text = (bi > 0 ? ' ' : '') + beat;
    [...text].forEach((ch, ci) => {
      let delay = base;
      if (plan.length === 0) {
        delay = reduced ? 40 : 160;
      } else if (ci === 0 && bi > 0) {
        delay = reduced ? 60 : pauses[bi] ?? BEAT_PAUSE; // the pause between beats
      } else if (!reduced) {
        const prev = plan[plan.length - 1].ch;
        if (ch === ' ' && (prev === ',' || prev === ';')) delay += 110;
        if (ch === ' ' && '.!?'.includes(prev)) delay += 220;
      }
      plan.push({ ch, delay });
    });
  });
  return plan;
}