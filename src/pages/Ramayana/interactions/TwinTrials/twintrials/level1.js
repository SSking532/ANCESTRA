// LEVEL ONE — THE PATH OF WISDOM (environmental puzzles). Pure logic.
import { World, T, cw, gOf, camDir, clamp, D4 } from './core.js';

export const L1 = {
  W: 42, H: 9,
  pillars: [
    { id: 'N', gx: 15, gz: 1, base: 0, target: 1 },
    { id: 'E', gx: 18, gz: 4, base: 1, target: 0 },
    { id: 'S', gx: 15, gz: 7, base: 2, target: 3 },
    { id: 'W', gx: 12, gz: 4, base: 3, target: 2 },
  ],
  startP: { N: 3, E: 1, S: 0, W: 0 },
  mosaic: { N: 1, E: 0, S: 3, W: 2 }, // symbol ids shown on the floor: 0 lotus, 1 sun, 2 wave, 3 mountain
  couple: { E: 'S' },
  plates: { 1: [23, 2], 2: [31, 2], 3: [31, 6] },
  seq: [1, 2, 3],
  plat: [
    { id: 'm1', a: 52, b: 56, z: cw(4), w: 4, d: 6, speed: 2.3, wait: 1.1 },
    { id: 'm2', a: 66, b: 70, z: cw(4), w: 4, d: 6, speed: 2.7, wait: 1.1 },
  ],
};

export function createLevel1() {
  const w = new World(L1.W, L1.H);
  const P = (t, a, b, c, d, h = 0) => w.paint(t, a, b, c, d, h);
  // Puzzle A: a river with a rotating plank and pushable stones
  P(T.FLOOR, 0, 2, 1, 6); P(T.WATER, 2, 2, 6, 6); P(T.FLOOR, 7, 2, 9, 6); P(T.FLOOR, 4, 4, 4, 4);
  // Puzzle B: pillar courtyard
  P(T.FLOOR, 10, 1, 20, 7);
  // Puzzle C: moving platforms and pressure plates
  P(T.FLOOR, 21, 3, 21, 5);
  P(T.FLOOR, 22, 2, 24, 6); P(T.WATER, 25, 2, 28, 6); P(T.FLOOR, 29, 2, 31, 6); P(T.WATER, 32, 2, 35, 6); P(T.FLOOR, 36, 2, 37, 6);
  P(T.FLOOR, 38, 3, 38, 5); P(T.FLOOR, 39, 2, 41, 6);

  const plank = w.addPlank('plank', 4, 4, 0);
  w.addBlock(1, 4); w.addBlock(1, 3); w.addBlock(1, 5);
  const gateB = w.addGate('gateB', [[21, 3], [21, 4], [21, 5]]); gateB.dur = 3.2;
  const gateW = w.addGate('gateW', [[38, 3], [38, 4], [38, 5]]); gateW.dur = 4.2;
  for (const k in L1.plates) w.addPlate(+k, ...L1.plates[k]);
  const platforms = L1.plat.map((p) => {
    const o = { ...p, x: p.a, dir: 1, powered: false, wt: 0.6, y: 0, moved: 0 };
    w.platforms.push(o); return o;
  });

  const pillars = L1.pillars.map((p) => {
    w.setStatic(p.gx, p.gz);
    return { ...p, p: L1.startP[p.id], turns: L1.startP[p.id], busy: 0, ok: false, solvedP: (((p.target - p.base) % 4) + 4) % 4 };
  });
  const luv = w.makeChar('luv', 0, 3); luv.face = Math.PI / 2;

  const s = {
    A: false, B: false, C: false, done: false, rot: 0, resets: 0, seq: 0, m1: false, m2: false, wrong: 0,
    mech: 0, mechT: 0, solved: false, planks: 0, pushed: 0, gateWT: 0, time: 0, score: 0, locked: false, fin: 0,
  };
  const ev = [];
  const score = (pts, label) => { s.score += pts; ev.push({ type: 'score', pts, label }); };

  const plankBusy = (p, nd) => {
    const cells = [D4[p.dir], D4[nd]].map((d) => [p.gx + d[0], p.gz + d[1]]);
    for (const [gx, gz] of cells) {
      if (w.charNearCell(gx, gz, 0.1)) return true;
      for (const b of w.blocks) if ((b.gx === gx && b.gz === gz && b.state !== 'sunk') || (b.p > 0 && b.tgx === gx && b.tgz === gz)) return true;
    }
    return false;
  };
  w.addInter({
    id: 'plank', x: cw(4), z: cw(4), r: 3.4, label: 'Rotate the stone plank', enabled: () => !s.A,
    run: () => {
      if (plank.spin) return;
      const nd = (plank.dir + 1) % 4;
      if (plankBusy(plank, nd)) { w.emit('denied', { why: 'The plank is blocked.' }); return; }
      plank.from = plank.dir; plank.dir = nd; plank.spin = true; plank.rot = 0; s.planks++; w.emit('plankTurn');
    },
  });
  const byId = Object.fromEntries(pillars.map((p) => [p.id, p]));
  const turn = (p) => { p.p = (p.p + 1) % 4; p.turns++; p.busy = 0.55; };
  for (const pl of pillars) {
    w.addInter({
      id: 'pillar' + pl.id, x: cw(pl.gx), z: cw(pl.gz), r: 3.1, label: 'Turn the pillar', enabled: () => !s.solved,
      run: () => {
        if (pl.busy > 0) return;
        turn(pl); s.rot++;
        const link = L1.couple[pl.id]; if (link) turn(byId[link]);
        w.emit('pillarTurn', { id: pl.id, link });
      },
    });
  }

  const stepPlatforms = (dt) => {
    for (const p of platforms) {
      p.moved = 0;
      p.powered = p.id === 'm1' ? s.m1 : s.m2;
      if (!p.powered) { p.vx = 0; continue; }
      if (p.wt > 0) { p.wt -= dt; p.vx = 0; continue; }
      const nx = clamp(p.x + p.dir * p.speed * dt, p.a, p.b);
      p.vx = (nx - p.x) / dt;
      p.moved = nx - p.x;
      for (const id in w.chars) {
        const c = w.chars[id];
        if (Math.abs(c.x - p.x) <= p.w / 2 + 0.02 && Math.abs(c.z - p.z) <= p.d / 2 + 0.02) { c.x += p.moved; }
      }
      p.x = nx;
      if (nx >= p.b - 1e-6 && p.dir > 0) { p.dir = -1; p.wt = p.wait; w.emit('platEnd', { id: p.id }); }
      else if (nx <= p.a + 1e-6 && p.dir < 0) { p.dir = 1; p.wt = p.wait; w.emit('platEnd', { id: p.id }); }
    }
  };

  const onPlate = (id) => {
    const seq = L1.seq;
    if (id === 1) { if (!s.m1) { s.m1 = true; w.emit('platePower', { id: 'm1' }); } }
    if (id === 2) { if (!s.m2) { s.m2 = true; w.emit('platePower', { id: 'm2' }); } }
    if (s.seq >= 3) return;
    if (id === seq[s.seq]) { s.seq++; w.emit('lamp', { n: s.seq }); if (s.seq === 3) { gateW.open = true; s.gateWT = 0; w.emit('finalGate'); s.C = true; score(300, 'Final Passage'); } }
    else if (s.seq === 0 || id !== seq[s.seq - 1]) { s.seq = Math.min(s.seq, 1); s.wrong++; w.emit('wrongOrder'); }
  };

  const L = {
    name: 'l1', world: w, s, luv, pillars, plank, platforms, gateB, gateW,
    chars: { luv },
    active: 'luv',
    update(dt, input) {
      dt = Math.min(dt, 1 / 30);
      s.time += dt;
      stepPlatforms(dt);
      if (!s.locked) {
        const [ix, iz] = camDir(input.yaw, input.mx, input.mz);
        w.stepChar(luv, ix, iz, dt, input.jump);
        w.tryPush(luv, ix, iz, dt);
      } else w.stepChar(luv, 0, 0, dt);
      w.unstick(luv);
      w.update(dt);
      for (const pl of pillars) { if (pl.busy > 0) pl.busy = Math.max(0, pl.busy - dt); }
      for (const e of w.drain()) {
        if (e.type === 'plateOn') onPlate(e.id);
        if (e.type === 'push') s.pushed++;
        ev.push(e);
      }
      // Puzzle A: reaching the far bank
      if (!s.A && gOf(luv.x) >= 7 && w.floorAt(gOf(luv.x), gOf(luv.z))) {
        s.A = true; score(Math.max(150, 300 - 30 * s.resets), 'The Broken Path'); ev.push({ type: 'puzzleA' });
      }
      // Puzzle B: all four pillars aligned
      if (!s.solved && pillars.every((p) => p.busy === 0 && p.p === p.solvedP)) {
        s.solved = true; s.mechT = 0; ev.push({ type: 'mechanism' });
      }
      for (const pl of pillars) { const ok = pl.p === pl.solvedP && pl.busy === 0; if (ok !== pl.ok) { pl.ok = ok; ev.push({ type: ok ? 'pillarOk' : 'pillarBad', id: pl.id }); } }
      if (s.solved) {
        s.mechT += dt; s.mech = clamp(s.mechT / 2.4, 0, 1);
        if (!s.B && s.mechT > 1.8) { s.B = true; gateB.open = true; score(Math.max(200, 400 - 12 * Math.max(0, s.rot - 8)), 'The Ancient Mechanism'); ev.push({ type: 'puzzleB' }); }
      }
      if (s.C && !s.done && gOf(luv.x) >= 39) { s.done = true; s.locked = true; ev.push({ type: 'levelDone' }); }
      return ev.splice(0);
    },
    interact() {
      const it = w.nearestInter(luv);
      if (it && !s.locked) { it.run(luv); return true; }
      return false;
    },
    hint() {
      const it = w.nearestInter(luv);
      if (it) return { key: 'E', text: it.label };
      if (!s.A && s.pushed === 0) {
        for (const b of w.blocks) if (b.state === 'idle' && Math.hypot(b.x - luv.x, b.z - luv.z) < 3.4) return { key: '', text: 'Walk into a stone to push it' };
      }
      return null;
    },
    reset() {
      if (s.A || s.locked) { w.emit('denied', { why: 'This path is already complete.' }); return false; }
      w.resetBlocks(); w.filled.clear(); plank.dir = 0; plank.from = 0; plank.spin = false; plank.rot = 0;
      luv.x = cw(0); luv.z = cw(3); s.resets++; ev.push({ type: 'reset' }); return true;
    },
    camParams() {
      const gx = luv.x / 2;
      if (gx < 10) return { dist: 15.5, pitch: 0.82, fov: 46 };
      if (gx < 22) return { dist: 15.5, pitch: 0.95, fov: 46 };
      return { dist: 15, pitch: 0.78, fov: 46 };
    },
    zone() { const gx = gOf(luv.x); return gx < 10 ? 'A' : gx < 22 ? 'B' : 'C'; },
    progress() { return { done: [s.A, s.B, s.C].filter(Boolean).length, total: 3 }; },
    objective() {
      if (!s.A) return 'Cross the river';
      if (!s.B) return 'Wake the mechanism';
      if (!s.C) return 'Light the three lamps in order';
      return 'Pass the gateway';
    },
  };
  return L;
}
