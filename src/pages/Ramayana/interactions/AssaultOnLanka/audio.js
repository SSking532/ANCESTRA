/* Synthesised battle audio (WebAudio, no sound files needed). */
export function makeSound() {
  let ctx, master, nb, bed = [], muted = false;
  const init = () => {
    if (ctx) { ctx.resume && ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8;
      const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
      nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
  };
  const tone = (f, dur, type = "sine", v = 0.3, to = 0, delay = 0) => {
    if (!ctx) return; const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  };
  const noise = (dur, v, f0, f1, type = "bandpass", delay = 0) => {
    if (!ctx) return; const t = ctx.currentTime + delay, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = nb; f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  };
  const sfx = {
    swing: () => noise(0.28, 0.35, 400, 2400),
    hit: () => { tone(110, 0.2, "sine", 0.6, 40); noise(0.14, 0.4, 1200, 200, "lowpass"); },
    heavy: () => { tone(80, 0.35, "sine", 0.8, 30); noise(0.3, 0.5, 900, 120, "lowpass"); },
    throw: () => noise(0.18, 0.25, 900, 300),
    stoneHit: () => { tone(220, 0.12, "triangle", 0.4, 80); noise(0.08, 0.3, 2000, 500); },
    jump: () => tone(280, 0.16, "triangle", 0.18, 520),
    leap: () => { tone(300, 0.3, "triangle", 0.25, 1000); noise(0.3, 0.15, 500, 3000); },
    land: () => tone(90, 0.15, "sine", 0.4, 45),
    slam: () => { tone(70, 0.9, "sine", 0.9, 25); noise(0.7, 0.6, 700, 80, "lowpass"); },
    hurt: () => { tone(170, 0.28, "sawtooth", 0.28, 70); noise(0.15, 0.25, 800, 200); },
    die: () => { tone(240, 0.45, "sawtooth", 0.22, 55); noise(0.35, 0.25, 1200, 150, "lowpass"); },
    roar: () => { tone(70, 0.7, "sawtooth", 0.3, 38); tone(104, 0.7, "sawtooth", 0.15, 55); },
    drum: (v = 0.5) => { tone(95, 0.3, "sine", v, 42); noise(0.05, v * 0.2, 300, 150, "lowpass"); },
    horn: () => { tone(98, 1.8, "sawtooth", 0.18, 92); tone(147, 1.8, "sawtooth", 0.1, 140, 0.05); tone(196, 1.6, "triangle", 0.1, 190, 0.1); },
    conch: () => { tone(330, 1.4, "sine", 0.3, 300); tone(495, 1.2, "sine", 0.12, 470, 0.05); },
    win: () => [262, 330, 392, 523, 659].forEach((f, i) => tone(f, 0.9, "triangle", 0.22, 0, i * 0.17)),
    lose: () => [330, 262, 196, 130].forEach((f, i) => tone(f, 1, "sawtooth", 0.14, 0, i * 0.3)),
  };
  const startBed = () => {
    if (!ctx || bed.length) return;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 220;
    const g = ctx.createGain(); g.gain.value = 0.05; lp.connect(g); g.connect(master);
    [55, 82.4, 110.3].forEach((f) => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.connect(lp); o.start(); bed.push(o); });
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), wg = ctx.createGain();
    s.buffer = nb; s.loop = true; bp.type = "bandpass"; bp.frequency.value = 500; wg.gain.value = 0.05; s.connect(bp); bp.connect(wg); wg.connect(master); s.start(); bed.push(s);
  };
  return {
    init, sfx, startBed,
    play: (k, ...a) => { try { sfx[k] && sfx[k](...a); } catch (e) { /* ignore */ } },
    setMuted: (m) => { muted = m; if (master) master.gain.value = m ? 0 : 0.8; },
    dispose: () => { bed.forEach((o) => { try { o.stop(); } catch (e) { /* */ } }); bed = []; try { ctx && ctx.close(); } catch (e) { /* */ } ctx = null; },
  };
}
