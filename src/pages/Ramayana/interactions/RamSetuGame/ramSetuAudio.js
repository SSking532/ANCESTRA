/* Tiny procedural soundscape: sea, a soft tanpura-like drone, splashes and a
   temple bell. Everything is synthesized, no audio files needed. Starts only
   after a user gesture (the BEGIN button). */

export function createRamSetuAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let started = false;
  const nodes = [];

  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  const brownNoise = (seconds) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  };

  return {
    start() {
      try {
        const c = ensure();
        if (!c || started) return;
        started = true;

        const sea = c.createBufferSource();
        sea.buffer = brownNoise(4);
        sea.loop = true;
        const lp = c.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 700;
        const sg = c.createGain();
        sg.gain.value = 0.18;
        const lfo = c.createOscillator();
        lfo.frequency.value = 0.11;
        const lg = c.createGain();
        lg.gain.value = 0.09;
        lfo.connect(lg);
        lg.connect(sg.gain);
        sea.connect(lp);
        lp.connect(sg);
        sg.connect(master);
        sea.start();
        lfo.start();
        nodes.push(sea, lfo);

        [
          [55, 0.05],
          [110, 0.05],
          [165, 0.028],
          [220, 0.032],
        ].forEach(([f, v], i) => {
          const o = c.createOscillator();
          o.type = "sine";
          o.frequency.value = f;
          const og = c.createGain();
          og.gain.value = 0;
          og.gain.linearRampToValueAtTime(v, c.currentTime + 5);
          const l = c.createOscillator();
          l.frequency.value = 0.17 + i * 0.05;
          const lgn = c.createGain();
          lgn.gain.value = v * 0.4;
          l.connect(lgn);
          lgn.connect(og.gain);
          o.connect(og);
          og.connect(master);
          o.start();
          l.start();
          nodes.push(o, l);
        });
      } catch {
        /* audio is optional */
      }
    },

    splash() {
      try {
        const c = ensure();
        if (!c || !started) return;
        const src = c.createBufferSource();
        const buf = c.createBuffer(1, c.sampleRate * 0.7, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        src.buffer = buf;
        const bp = c.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1100;
        bp.Q.value = 0.7;
        const g = c.createGain();
        g.gain.setValueAtTime(0.5, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.65);
        src.connect(bp);
        bp.connect(g);
        g.connect(master);
        src.start();
      } catch {
        /* ignore */
      }
    },

    bell() {
      try {
        const c = ensure();
        if (!c || !started) return;
        [
          [880, 0.07],
          [1318, 0.035],
          [2217, 0.016],
        ].forEach(([f, v]) => {
          const o = c.createOscillator();
          o.type = "sine";
          o.frequency.value = f;
          const g = c.createGain();
          g.gain.setValueAtTime(v, c.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0005, c.currentTime + 2.6);
          o.connect(g);
          g.connect(master);
          o.start();
          o.stop(c.currentTime + 2.7);
        });
      } catch {
        /* ignore */
      }
    },

    setMuted(m) {
      muted = m;
      if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
    },

    stop() {
      try {
        nodes.forEach((n) => {
          try {
            n.stop();
          } catch {
            /* already stopped */
          }
        });
        nodes.length = 0;
        if (ctx) ctx.close();
      } catch {
        /* ignore */
      }
      ctx = null;
      master = null;
      started = false;
    },
  };
}
