// LEVEL TWO — THE TEST OF PRECISION (interactive archery). Pure logic.
import { ArrowSim, Bow, ringScore } from './archery.js';
import { clamp, smooth } from './core.js';

export const CHALLENGES = {
  A: {
    key: 'A', title: 'The Stationary Targets', arrows: 6, need: 3, shooter: ['luv'],
    targets: [
      { x: -5.5, y: 2.2, z: -17, r: 1.15 }, { x: 6.5, y: 2.7, z: -29, r: 1.15 }, { x: -1.5, y: 3.1, z: -43, r: 1.2 },
    ],
  },
  B: {
    key: 'B', title: 'The Moving Targets', arrows: 9, need: 3, shooter: ['kush'],
    targets: [
      { z: -23, y: 2.3, a: -9, b: 9, speed: 2.5, x: -3, r: 1.2 },
      { z: -33, y: 2.8, a: -12, b: 12, speed: 3.6, x: 7, r: 1.25 },
      { z: -45, y: 3.2, a: -15, b: 15, speed: 4.6, x: -10, r: 1.3 },
    ],
  },
  C: {
    key: 'C', title: 'The Sequence', arrows: 9, need: 5, shooter: ['luv', 'kush'],
    windows: [5.2, 5.0, 4.8, 4.6, 4.4, 4.2],
    targets: [
      { x: -9, y: 2.3, z: -21, r: 1.2 }, { x: 8, y: 3.0, z: -27, r: 1.2 }, { x: -3.5, y: 2.6, z: -35, r: 1.25 },
      { x: 12, y: 2.4, z: -39, r: 1.25 }, { x: -12, y: 3.2, z: -44, r: 1.3 }, { x: 2.5, y: 3.4, z: -49, r: 1.3 },
    ],
  },
};
export const ORDER = ['A', 'B', 'C'];

export function createRange() {
  const sim = new ArrowSim(), bow = new Bow();
  const R = {
    sim, bow, ch: null, targets: [], arrowsLeft: 0, banked: 0, cur: 0, ev: [], phase: 'idle', t: 0,
    stats: { shots: 0, hits: 0, prec: 0, bulls: 0 }, run: { shots: 0, hits: 0, prec: 0, bulls: 0 },
    active: -1, activeT: 0, shooter: 'luv', done: {}, hits: 0, resolved: 0,
  };
  const emit = (e) => R.ev.push(e);

  R.start = (key) => {
    const c = CHALLENGES[key]; R.ch = c; R.key = key;
    sim.clear(); bow.reset();
    R.arrowsLeft = c.arrows; R.cur = 0; R.hits = 0; R.resolved = 0;
    R.run = { shots: 0, hits: 0, prec: 0, bulls: 0 };
    R.targets = c.targets.map((t, i) => ({
      id: i, x: t.x, y: t.y, z: t.z, r: t.r, live: key !== 'C', hit: false, a: t.a, b: t.b, speed: t.speed, dir: t.a !== undefined ? 1 : 0,
      pop: key === 'C' ? 0 : 1, vis: true, expired: false,
    }));
    R.active = -1; R.activeT = 0; R.shooter = c.shooter[0];
    R.phase = 'banner'; R.t = 0;
    emit({ type: 'challenge', key, title: c.title });
  };
  R.retry = () => R.start(R.key);

  R.origin = () => ({ x: R.shooter === 'luv' ? -1.25 : 1.25, y: 1.6, z: -0.8 });
  R.liveTargets = () => R.targets.filter((t) => t.live && !t.hit);
  const activate = (i) => {
    R.active = i; R.activeT = 0;
    const t = R.targets[i]; t.live = true; t.pop = 0;
    if (R.ch.shooter.length > 1) R.shooter = R.ch.shooter[i % R.ch.shooter.length];
    emit({ type: 'activate', id: i });
  };
  const finishCheck = () => {
    if (R.phase !== 'live' || sim.inFlight()) return;
    const c = R.ch;
    const complete = R.key === 'C' ? R.resolved >= c.targets.length : R.hits >= c.need;
    if (complete && R.hits >= c.need) {
      const bonus = R.arrowsLeft * 5;
      R.cur += bonus; R.banked += R.cur;
      for (const k in R.run) R.stats[k] += R.run[k];
      R.done[R.key] = true; R.phase = 'clear'; R.t = 0;
      emit({ type: 'clear', key: R.key, bonus, score: R.cur, arrowsLeft: R.arrowsLeft });
      R.cur = 0;
    } else if (R.hits < c.need && (R.arrowsLeft <= 0 || (R.key === 'C' && R.resolved >= c.targets.length))) {
      R.phase = 'fail'; R.t = 0; emit({ type: 'fail', key: R.key, hits: R.hits });
    }
  };

  R.canShoot = () => R.phase === 'live' && R.arrowsLeft > 0;
  R.fire = (origin, vel) => {
    if (!R.canShoot()) return null;
    R.arrowsLeft--; R.run.shots++;
    const a = sim.fire(origin, vel, R.shooter);
    emit({ type: 'shot', arrowsLeft: R.arrowsLeft, who: R.shooter });
    return a;
  };

  const onHit = (a, t, d) => {
    const sc = ringScore(d, t.r);
    t.hit = true; t.live = false; R.hits++; R.resolved++;
    R.run.hits++; R.run.prec += sc.prec; if (sc.pts === 10) R.run.bulls++;
    const mult = R.key === 'A' ? 1 : R.key === 'B' ? 1.5 : 2;
    const pts = Math.round(sc.pts * mult * 10);
    let bonus = 0;
    if (R.key === 'C') { bonus = Math.round(Math.max(0, 1 - R.activeT / R.ch.windows[t.id]) * 40); }
    R.cur += pts + bonus;
    emit({ type: 'hit', id: t.id, ring: sc.ring, pts: pts + bonus, point: { x: a.x, y: a.y, z: a.z }, bull: sc.pts === 10, key: R.key });
    if (R.key === 'C' && t.id === R.active) { R.active = -1; R.gap = 0.9; }
  };
  const onMiss = (a) => emit({ type: 'miss', x: a.x, y: a.y, z: a.z });

  R.update = (dt) => {
    dt = Math.min(dt, 1 / 30);
    R.t += dt; bow.update(dt);
    if (R.phase === 'banner' && R.t > 2.3) { R.phase = 'live'; R.t = 0; if (R.key === 'C') { R.gap = 0.4; } }
    for (const t of R.targets) {
      if (t.pop < 1) t.pop = Math.min(1, t.pop + dt * 2.4);
      if (t.dir && !t.hit && R.phase !== 'banner') {
        t.x += t.dir * t.speed * dt;
        if (t.x >= t.b) { t.x = t.b; t.dir = -1; } else if (t.x <= t.a) { t.x = t.a; t.dir = 1; }
      }
    }
    if (R.phase === 'live' && R.key === 'C') {
      if (R.active >= 0) {
        R.activeT += dt;
        const t = R.targets[R.active];
        if (R.activeT >= R.ch.windows[R.active] && !t.hit) { t.live = false; t.expired = true; R.resolved++; emit({ type: 'expire', id: R.active }); R.active = -1; R.gap = 0.9; }
      } else if (R.resolved < R.ch.targets.length) {
        R.gap -= dt;
        if (R.gap <= 0) activate(R.resolved);
      }
    }
    sim.update(dt, R.targets, () => 0, onHit, onMiss);
    finishCheck();
  };
  R.accuracy = () => (R.stats.shots ? R.stats.hits / R.stats.shots : 0);
  R.precision = () => (R.stats.hits ? R.stats.prec / R.stats.hits : 0);
  R.drain = () => R.ev.splice(0);
  return R;
}
