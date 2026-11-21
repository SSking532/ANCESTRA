// Procedural cinematic sound for Sita's Final Journey.
// No audio files are used: soft wind, assembly murmur, earth rumble, a tanpura-like drone,
// a warm pad and a sparse bansuri-style phrase (raga Bhoopali in D), all through a shared reverb.
// Everything is quiet by design. If WebAudio is unavailable, every call is a safe no-op.

const LEVEL = 0.85;

// Background music file (put it at public/audio/oath.mp3). When it plays, the procedural
// drone / pad / flute are silenced so they don't clash with it; wind, hall and earth rumble stay.
const TRACK_URL = '/audio/oath.mp3';
const TRACK_VOL = 0.6;

// per-layer target gain for each mood
const MOODS = {
  off: { wind: 0, hall: 0, rumble: 0, drone: 0, pad: 0 },
  hall: { wind: 0.035, hall: 0.16, rumble: 0, drone: 0.05, pad: 0 },
  hush: { wind: 0.03, hall: 0.03, rumble: 0, drone: 0.06, pad: 0 },
  tremor: { wind: 0.05, hall: 0, rumble: 0.3, drone: 0.08, pad: 0.03 },
  grief: { wind: 0.035, hall: 0, rumble: 0.12, drone: 0.09, pad: 0.1 },
  earth: { wind: 0.09, hall: 0, rumble: 0.14, drone: 0.09, pad: 0.06 },
  farewell: { wind: 0.05, hall: 0, rumble: 0, drone: 0.1, pad: 0.15 },
  peak: { wind: 0.04, hall: 0, rumble: 0, drone: 0.11, pad: 0.24 },
};

// loudness compensation per layer (noise layers are naturally quieter after filtering)
const K = { wind: 2.4, hall: 3, rumble: 2, drone: 1, pad: 1 };

const D4 = 293.66;
const E4 = 329.63;
const FS4 = 369.99;
const A4 = 440;
const B4 = 493.88;
const D5 = 587.33;

const PHRASES = [
  {
    len: 17000,
    notes: [[B4, 0, 2.6, 0.5], [A4, 2.4, 2, 0.45], [FS4, 4.2, 2.4, 0.45], [E4, 6.2, 1.8, 0.4], [D4, 7.8, 5.2, 0.5]],
  },
  {
    len: 19000,
    notes: [[A4, 0, 2.2, 0.45], [B4, 2, 1.8, 0.45], [D5, 3.6, 3.6, 0.5], [B4, 7, 2, 0.42], [A4, 8.8, 2.4, 0.42], [FS4, 10.8, 5, 0.45]],
  },
];

function makeNoise(ctx, kind) {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'brown') {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.start();
  return src;
}

function makeIR(ctx, seconds = 3.4, decay = 2.6) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

export function createSitaAudio() {
  let ctx = null;
  let master = null;
  let dry = null;
  let reverb = null;
  let muted = false;
  let melodyOn = false;
  let melodyTimer = 0;
  let phraseIdx = 0;
  let cur = MOODS.off;
  let curName = 'off';
  const g = {};

  // ── background music file
  let track = null;
  let trackOn = false;
  let trackFade = 0;

  const fadeTrack = (to, sec, done) => {
    if (!track) return;
    clearInterval(trackFade);
    const from = track.volume;
    const t0 = performance.now();
    const ms = Math.max(1, sec * 1000);
    trackFade = setInterval(() => {
      if (!track) {
        clearInterval(trackFade);
        return;
      }
      const k = Math.min(1, (performance.now() - t0) / ms);
      track.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k >= 1) {
        clearInterval(trackFade);
        done?.();
      }
    }, 50);
  };

  const startTrack = () => {
    try {
      if (!track) {
        track = new Audio(TRACK_URL);
        track.loop = true;
        track.preload = 'auto';
        track.addEventListener('error', () => {
          trackOn = false;
          if (ctx) api.mood(curName, 1);
        });
      }
      track.muted = muted;
      if (track.paused) {
        track.volume = 0;
        const p = track.play();
        const ok = () => {
          trackOn = true;
          fadeTrack(TRACK_VOL, 3);
          if (ctx) api.mood(curName, 2);
        };
        if (p && p.then) p.then(ok).catch(() => {});
        else ok();
      } else {
        fadeTrack(TRACK_VOL, 1);
      }
    } catch (e) {
      trackOn = false;
    }
  };

  const route = (node, amt = 0.3) => {
    node.connect(dry);
    const s = ctx.createGain();
    s.gain.value = amt;
    node.connect(s);
    s.connect(reverb);
  };

  const osc = (type, freq, dest, gain = 1, detune = 0) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const og = ctx.createGain();
    og.gain.value = gain;
    o.connect(og);
    og.connect(dest);
    o.start();
    return o;
  };

  const lfo = (rate, depth, target) => {
    const o = ctx.createOscillator();
    o.frequency.value = rate;
    const og = ctx.createGain();
    og.gain.value = depth;
    o.connect(og);
    og.connect(target);
    o.start();
  };

  function build() {
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);

    dry = ctx.createGain();
    dry.connect(master);
    reverb = ctx.createConvolver();
    reverb.buffer = makeIR(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.7;
    reverb.connect(wet);
    wet.connect(master);

    ['wind', 'hall', 'rumble', 'drone', 'pad'].forEach((k) => {
      g[k] = ctx.createGain();
      g[k].gain.value = 0;
    });

    // wind
    const wind = makeNoise(ctx, 'pink');
    const wbp = ctx.createBiquadFilter();
    wbp.type = 'bandpass';
    wbp.frequency.value = 520;
    wbp.Q.value = 0.7;
    wind.connect(wbp);
    wbp.connect(g.wind);
    lfo(0.07, 180, wbp.frequency);
    route(g.wind, 0.25);

    // assembly murmur
    const hall = makeNoise(ctx, 'pink');
    const hlp = ctx.createBiquadFilter();
    hlp.type = 'lowpass';
    hlp.frequency.value = 900;
    const hbp = ctx.createBiquadFilter();
    hbp.type = 'bandpass';
    hbp.frequency.value = 300;
    hbp.Q.value = 0.5;
    const ham = ctx.createGain();
    ham.gain.value = 0.6;
    hall.connect(hlp);
    hlp.connect(hbp);
    hbp.connect(ham);
    ham.connect(g.hall);
    lfo(0.3, 0.22, ham.gain);
    route(g.hall, 0.6);

    // earth rumble
    const rum = makeNoise(ctx, 'brown');
    const rlp = ctx.createBiquadFilter();
    rlp.type = 'lowpass';
    rlp.frequency.value = 85;
    const rtr = ctx.createGain();
    rtr.gain.value = 0.75;
    rum.connect(rlp);
    rlp.connect(rtr);
    rtr.connect(g.rumble);
    lfo(6.5, 0.22, rtr.gain);
    route(g.rumble, 0.08);

    // drone (D2 · A2 · D3)
    const dlp = ctx.createBiquadFilter();
    dlp.type = 'lowpass';
    dlp.frequency.value = 700;
    dlp.connect(g.drone);
    osc('triangle', 73.42, dlp, 0.35);
    osc('sine', 110, dlp, 0.22, 3);
    osc('sine', 146.83, dlp, 0.14, -4);
    route(g.drone, 0.6);

    // pad
    const plp = ctx.createBiquadFilter();
    plp.type = 'lowpass';
    plp.frequency.value = 1800;
    plp.connect(g.pad);
    const p1 = osc('sine', D4, plp, 0.3, -3);
    const p2 = osc('sine', A4, plp, 0.18, 4);
    const p3 = osc('sine', D5, plp, 0.1, -2);
    const p4 = osc('sine', FS4, plp, 0.1, 5);
    [p1, p2, p3, p4].forEach((o, i) => lfo(0.11 + i * 0.03, 2.2, o.frequency));
    route(g.pad, 0.8);
  }

  function flute(f, at, dur, vel = 0.5) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const h = ctx.createOscillator();
    h.type = 'sine';
    h.frequency.value = f * 2;
    const hg = ctx.createGain();
    hg.gain.value = 0.12;
    const vib = ctx.createOscillator();
    vib.frequency.value = 5;
    const vg = ctx.createGain();
    vg.gain.value = f * 0.006;
    vib.connect(vg);
    vg.connect(o.frequency);
    vg.connect(h.frequency);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(vel * 0.11, at + 0.55);
    env.gain.setValueAtTime(vel * 0.11, at + dur - 0.2);
    env.gain.linearRampToValueAtTime(0, at + dur + 0.9);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    o.connect(env);
    h.connect(hg);
    hg.connect(env);
    env.connect(lp);
    route(lp, 0.55);
    [o, h, vib].forEach((n) => {
      n.start(at);
      n.stop(at + dur + 1);
    });
  }

  function playPhrase() {
    if (!melodyOn || !ctx) return;
    if (trackOn) {
      melodyTimer = setTimeout(playPhrase, 4000);
      return;
    }
    const ph = PHRASES[phraseIdx++ % PHRASES.length];
    const t0 = ctx.currentTime + 0.4;
    ph.notes.forEach(([f, o, d, v]) => flute(f, t0 + o, d, v));
    melodyTimer = setTimeout(playPhrase, ph.len);
  }

  const api = {
    start() {
      startTrack();
      if (ctx) {
        ctx.resume?.();
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(muted ? 0 : LEVEL, ctx.currentTime, 0.3);
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        ctx = new AC();
        build();
        ctx.resume?.();
        master.gain.setTargetAtTime(muted ? 0 : LEVEL, ctx.currentTime, 1.2);
      } catch (e) {
        ctx = null;
      }
    },
    mood(name, sec = 3) {
      if (!ctx) return;
      const m = MOODS[name] || MOODS.off;
      cur = m;
      curName = name;
      const t = ctx.currentTime;
      Object.keys(g).forEach((k) => {
        const musical = k === 'drone' || k === 'pad';
        const v = trackOn && musical ? 0 : m[k] * K[k];
        g[k].gain.cancelScheduledValues(t);
        g[k].gain.setTargetAtTime(v, t, Math.max(0.05, sec / 3));
      });
    },
    swell() {
      if (!ctx || trackOn) return;
      const t = ctx.currentTime;
      g.pad.gain.cancelScheduledValues(t);
      g.pad.gain.setTargetAtTime(0.34 * K.pad, t, 0.12);
      g.pad.gain.setTargetAtTime(cur.pad * K.pad, t + 1.4, 1.1);
    },
    melody(on) {
      if (on === melodyOn) return;
      melodyOn = on;
      clearTimeout(melodyTimer);
      if (on && ctx) melodyTimer = setTimeout(playPhrase, 2500);
    },
    setMuted(b) {
      muted = b;
      if (track) track.muted = b;
      if (ctx) master.gain.setTargetAtTime(b ? 0 : LEVEL, ctx.currentTime, 0.15);
    },
    fadeOut(sec = 4) {
      melodyOn = false;
      clearTimeout(melodyTimer);
      if (track) fadeTrack(0, sec, () => track && track.pause());
      if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, sec / 3);
    },
    dispose() {
      melodyOn = false;
      clearTimeout(melodyTimer);
      clearInterval(trackFade);
      if (track) {
        try {
          track.pause();
          track.removeAttribute('src');
          track.load();
        } catch (e) {
          /* ignore */
        }
        track = null;
        trackOn = false;
      }
      if (ctx) {
        try {
          ctx.close();
        } catch (e) {
          /* ignore */
        }
      }
      ctx = null;
    },
  };
  return api;
}