// Fully procedural audio (Web Audio): ambience, bird calls, tanpura drone and gameplay sounds.
export class Sfx {
  constructor() { this.ctx = null; this.muted = false; this.amb = null; this.birdT = null; }
  start() {
    if (this.ctx) { this.ctx.resume && this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC(); this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.8; this.master.connect(c.destination);
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let b0 = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.97 * b0 + 0.03 * w; d[i] = b0 * 6; }
    this.noise = buf;
    this.ambience();
  }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05); }
  ambience() {
    const c = this.ctx;
    const n = c.createBufferSource(); n.buffer = this.noise; n.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; const g = c.createGain(); g.gain.value = 0.1;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 0.05; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    n.connect(f); f.connect(g); g.connect(this.master); n.start();
    const drone = c.createGain(); drone.gain.value = 0.0; drone.gain.setTargetAtTime(0.035, c.currentTime, 3); drone.connect(this.master);
    [110, 110.6, 165, 220.4, 329.6].forEach((fr, i) => { const o = c.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = fr; const og = c.createGain(); og.gain.value = [0.5, 0.35, 0.3, 0.18, 0.08][i]; o.connect(og); og.connect(drone); o.start(); });
    const trem = c.createOscillator(), tg = c.createGain(); trem.frequency.value = 0.35; tg.gain.value = 0.012; trem.connect(tg); tg.connect(drone.gain); trem.start();
    const bird = () => { if (!this.ctx) return; this.chirp(); this.birdT = setTimeout(bird, 1500 + Math.random() * 4200); }; this.birdT = setTimeout(bird, 1200);
    this.amb = { n, drone };
  }
  chirp() {
    const c = this.ctx, t = c.currentTime, base = 2200 + Math.random() * 1800, k = 2 + ((Math.random() * 4) | 0), pan = c.createStereoPanner ? c.createStereoPanner() : null;
    const g = c.createGain(); g.gain.value = 0; (pan ? (pan.pan.value = Math.random() * 1.6 - 0.8, g.connect(pan), pan.connect(this.master)) : g.connect(this.master));
    for (let i = 0; i < k; i++) { const o = c.createOscillator(); o.type = 'sine'; const s = t + i * 0.11; o.frequency.setValueAtTime(base * (1 + Math.random() * 0.15), s); o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.4), s + 0.08); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.03, s + 0.015); g.gain.linearRampToValueAtTime(0, s + 0.09); o.connect(g); o.start(s); o.stop(s + 0.1); }
  }
  tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slide = 0) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  burst(dur, f0, f1, vol = 0.2, q = 1, type = 'bandpass', when = 0) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + when, s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = 1 + Math.random() * 0.3;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  bell(f, when = 0, vol = 0.1) { [1, 2.01, 2.76, 4.1].forEach((m, i) => this.tone(f * m, 1.6 / (i + 1) + 0.3, 'sine', vol / (i + 1.3), when)); }
  play(name, o = {}) {
    if (!this.ctx) return;
    switch (name) {
      case 'push': this.burst(0.5, 220, 120, 0.3, 0.8, 'lowpass'); this.burst(0.4, 900, 300, 0.07, 2); break;
      case 'settle': this.tone(70, 0.3, 'sine', 0.3, 0, 0.5); this.burst(0.18, 600, 200, 0.14, 1, 'lowpass'); break;
      case 'splash': this.burst(0.7, 2200, 500, 0.22, 0.7); this.tone(90, 0.4, 'sine', 0.25, 0, 0.4); break;
      case 'turn': this.burst(0.55, 320, 150, 0.32, 1, 'lowpass'); this.tone(180, 0.12, 'square', 0.04, 0.45); break;
      case 'ok': this.bell(784, 0, 0.09); this.bell(1175, 0.12, 0.06); break;
      case 'wrong': this.tone(130, 0.5, 'sawtooth', 0.07, 0, 0.6); this.tone(98, 0.6, 'sine', 0.12, 0.05); break;
      case 'plate': this.tone(80, 0.25, 'sine', 0.3, 0, 0.5); this.burst(0.12, 1200, 400, 0.1); break;
      case 'lamp': this.bell(659 * Math.pow(1.122, o.n || 0), 0, 0.1); this.burst(0.5, 900, 3000, 0.04, 0.6); break;
      case 'gate': this.burst(2.8, 160, 80, 0.4, 0.7, 'lowpass'); this.burst(2.6, 700, 260, 0.1, 3); this.tone(55, 2.6, 'sine', 0.15, 0, 0.8); break;
      case 'mech': this.burst(2.2, 240, 110, 0.35, 1, 'lowpass'); for (let i = 0; i < 6; i++) this.bell(523 * (1 + i * 0.25), i * 0.22, 0.06); break;
      case 'draw': this.burst(0.9, 500, 1400, 0.07, 6); break;
      case 'release': this.tone(260, 0.35, 'sawtooth', 0.09, 0, 0.5); this.burst(0.12, 3000, 900, 0.18, 0.8); this.burst(0.5, 4000, 1500, 0.05, 2, 'highpass', 0.05); break;
      case 'hit': this.tone(110, 0.25, 'sine', 0.35, 0, 0.45); this.burst(0.18, 2500, 600, 0.22, 0.8); break;
      case 'bull': this.tone(110, 0.25, 'sine', 0.35, 0, 0.45); this.burst(0.18, 2500, 600, 0.2, 0.8); this.bell(880, 0.08, 0.1); this.bell(1318, 0.22, 0.07); break;
      case 'thud': this.tone(75, 0.2, 'sine', 0.2, 0, 0.5); break;
      case 'switch': this.tone(520, 0.18, 'sine', 0.09); this.tone(780, 0.22, 'sine', 0.08, 0.09); break;
      case 'ui': this.tone(640, 0.12, 'triangle', 0.07); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => this.bell(f, i * 0.16, 0.09)); break;
      case 'conch': this.tone(233, 2.2, 'sawtooth', 0.05, 0, 1.03); this.tone(233 * 1.5, 2.0, 'triangle', 0.04, 0.05); break;
      default: break;
    }
  }
  dispose() { clearTimeout(this.birdT); try { this.ctx && this.ctx.close(); } catch (e) { /* noop */ } this.ctx = null; }
}
