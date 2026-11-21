// Procedural cinematic audio (no assets). Safe if WebAudio is unavailable.
let ctx = null, master = null, noiseBuf = null, bed = null, muted = true;

export function initAudio() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume().catch(() => {}); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ctx = null; }
}
export function setMuted(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05); if (!m) initAudio(); }
const ok = () => ctx && !muted && ctx.state !== "closed";
const noise = (dur, type, f0, f1, g, q = 1, at = 0) => {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; const t = ctx.currentTime + at;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + Math.min(0.02, dur / 4)); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(gn); gn.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
};
const tone = (type, f0, f1, dur, g, at = 0) => {
  const o = ctx.createOscillator(), gn = ctx.createGain(); const t = ctx.currentTime + at; o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn); gn.connect(master); o.start(t); o.stop(t + dur + 0.05);
};
export function sfx(kind, v = 1) {
  if (!ok()) return;
  try {
    switch (kind) {
      case "hit": noise(0.12, "lowpass", 2200, 300, 0.7 * v); tone("sine", 140, 45, 0.22, 0.9 * v); noise(0.05, "bandpass", 3000, 1500, 0.25 * v, 2); break;
      case "heavy": noise(0.3, "lowpass", 2500, 120, 1.0, 1); tone("sine", 110, 30, 0.5, 1.2); tone("triangle", 220, 60, 0.18, 0.5); noise(0.5, "bandpass", 700, 150, 0.35, 1, 0.05); break;
      case "slam": tone("sine", 90, 26, 1.0, 1.5); noise(0.8, "lowpass", 1800, 70, 1.1); noise(1.2, "bandpass", 400, 80, 0.4, 1, 0.08); break;
      case "thud": tone("sine", 100, 35, 0.5, 0.9 * v); noise(0.3, "lowpass", 1200, 100, 0.6 * v); break;
      case "grapple": noise(0.4, "lowpass", 900, 200, 0.7); tone("sine", 80, 40, 0.3, 0.7); break;
      case "whoosh": noise(0.35, "bandpass", 400, 2400, 0.25 * v, 1.2); break;
      case "roar": {
        const t = ctx.currentTime;
        for (const [type, a, b] of [["sawtooth", 150, 90], ["sawtooth", 225, 130], ["square", 75, 55]]) {
          const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = type; f.type = "bandpass"; f.Q.value = 2.2;
          o.frequency.setValueAtTime(a, t); o.frequency.linearRampToValueAtTime(b, t + 1.8);
          f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(1100, t + 0.6); f.frequency.linearRampToValueAtTime(500, t + 1.8);
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25 * v, t + 0.25); g.gain.linearRampToValueAtTime(0.18 * v, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
          o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 2);
        }
        noise(1.8, "bandpass", 900, 500, 0.35, 1.5); break;
      }
      case "release": tone("triangle", 220, 140, 0.35, 0.5); tone("sine", 440, 300, 0.25, 0.35); noise(0.2, "highpass", 3000, 6000, 0.3); break;
      case "arrow": tone("sine", 70, 24, 1.6, 1.6); noise(0.5, "lowpass", 3000, 120, 1.0); tone("sawtooth", 900, 200, 0.6, 0.18); noise(1.8, "bandpass", 300, 80, 0.4, 1, 0.05); break;
      case "block": noise(0.09, "bandpass", 1800, 900, 0.5 * v, 3); tone("triangle", 330, 160, 0.12, 0.45 * v); tone("sine", 90, 50, 0.14, 0.4 * v); break;
      case "grunt": { const t = ctx.currentTime; const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = "sawtooth"; f.type = "bandpass"; f.Q.value = 3;
        o.frequency.setValueAtTime(130 * v, t); o.frequency.exponentialRampToValueAtTime(80 * v, t + 0.22); f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(420, t + 0.22);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 0.3); break; }
      case "whistle": noise(0.9, "bandpass", 1800, 4200, 0.28, 8); break;
      default: break;
    }
  } catch (e) { /* audio is best-effort */ }
}
export function startBed() {
  if (!ctx || bed) return;
  try {
    bed = []; const mk = (type, f, g) => { const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type; o.frequency.value = f; gn.gain.value = g; o.connect(gn); gn.connect(master); o.start(); bed.push(o); return gn; };
    mk("sine", 55, 0.09); mk("sine", 82.4, 0.05); mk("triangle", 110, 0.025); mk("sine", 165, 0.012);
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 500; f.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = 0.035; s.connect(f); f.connect(g); g.connect(master); s.start(); bed.push(s);
  } catch (e) { bed = null; }
}
export function stopBed() { if (bed) { for (const n of bed) { try { n.stop(); } catch (e) {} } bed = null; } }
export function drum(v = 1) { if (ok()) { tone("sine", 95, 42, 0.35, 0.5 * v); noise(0.12, "lowpass", 600, 150, 0.2 * v); } }
export function disposeAudio() { stopBed(); if (ctx) { try { ctx.close(); } catch (e) {} } ctx = null; master = null; }
