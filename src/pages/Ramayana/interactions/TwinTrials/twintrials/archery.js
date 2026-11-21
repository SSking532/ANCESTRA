// Ballistics, bow-draw model and arrow flight/hit detection. Pure logic.
import { clamp, lerp, smooth } from './core.js';
export const GRAVITY = 9.0;

/** Launch velocity (speed S) so the arrow passes through point p when fired from o. */
export function solveShot(o, p, S, g = GRAVITY) {
  const dx = p.x - o.x, dz = p.z - o.z, dy = p.y - o.y;
  const L = Math.hypot(dx, dz) || 0.001;
  const S2 = S * S, disc = S2 * S2 - g * (g * L * L + 2 * dy * S2);
  let tan;
  if (disc < 0) tan = dy / L + 0.2;
  else tan = (S2 - Math.sqrt(disc)) / (g * L);
  const ang = Math.atan(tan), hx = dx / L, hz = dz / L;
  return { x: hx * Math.cos(ang) * S, y: Math.sin(ang) * S, z: hz * Math.cos(ang) * S };
}

export class Bow {
  constructor() { this.reset(); }
  reset() { this.drawing = false; this.hold = 0; this.draw = 0; this.sway = 0; this.fatigue = 0; this.t = 0; }
  begin() { this.drawing = true; this.hold = 0; }
  update(dt) {
    this.t += dt;
    if (this.drawing) {
      this.hold += dt;
      this.draw = clamp(this.hold / 0.75, 0, 1);
      this.fatigue = clamp((this.hold - 2.6) / 2.2, 0, 1);
    } else { this.draw = Math.max(0, this.draw - dt * 5); this.fatigue = 0; }
    // sway amplitude in pixels: large when raw, tight when fully drawn, loosening if held too long
    this.sway = this.drawing ? lerp(26, 3.2, smooth(this.draw)) + this.fatigue * 15 : 0;
  }
  swayOffset() {
    const a = this.sway, t = this.t;
    return { x: (Math.sin(t * 1.9) + 0.55 * Math.sin(t * 3.7 + 1.3)) * a * 0.62, y: (Math.cos(t * 1.5 + 0.4) + 0.5 * Math.sin(t * 2.9)) * a * 0.62 };
  }
  /** release → {ok, speed, quality} ; releasing before a real draw cancels without spending an arrow */
  release() {
    const ok = this.drawing && this.draw > 0.3;
    const speed = lerp(32, 64, Math.pow(this.draw, 0.7));
    const q = this.draw;
    this.drawing = false; this.hold = 0;
    return { ok, speed, quality: q };
  }
}

export class ArrowSim {
  constructor() { this.arrows = []; this.nid = 1; }
  fire(o, v, who = 'x') {
    const a = { id: this.nid++, x: o.x, y: o.y, z: o.z, vx: v.x, vy: v.y, vz: v.z, t: 0, alive: true, stuck: false, who, to: null, fade: 0, px: o.x, py: o.y, pz: o.z };
    this.arrows.push(a); return a;
  }
  /** targets: [{id,x,y,z,r,live}] ; groundFn(x,z) -> y ; hooks onHit(a,t,d,pt) onMiss(a) */
  update(dt, targets, groundFn, onHit, onMiss) {
    for (const a of this.arrows) {
      if (a.stuck) {
        a.fade += dt;
        if (a.to) { const t = targets.find((q) => q.id === a.to.id); if (t) { a.x = t.x + a.to.ox; a.y = t.y + a.to.oy; a.z = t.z + a.to.oz; } }
        continue;
      }
      if (!a.alive) continue;
      const n = Math.max(1, Math.ceil(dt / 0.006)), h = dt / n;
      for (let i = 0; i < n && !a.stuck && a.alive; i++) {
        a.px = a.x; a.py = a.y; a.pz = a.z;
        a.vy -= GRAVITY * h; a.x += a.vx * h; a.y += a.vy * h; a.z += a.vz * h; a.t += h;
        for (const t of targets) {
          if (!t.live) continue;
          const dx = a.x - a.px, dy = a.y - a.py, dz = a.z - a.pz, l2 = dx * dx + dy * dy + dz * dz || 1e-6;
          const u = clamp(((t.x - a.px) * dx + (t.y - a.py) * dy + (t.z - a.pz) * dz) / l2, 0, 1);
          const cx = a.px + dx * u, cy = a.py + dy * u, cz = a.pz + dz * u;
          const d0 = Math.hypot(cx - t.x, cy - t.y, cz - t.z);
          if (d0 < t.r) {
            // lateral miss distance from the arrow's line to the target centre (scoring) and embed point on that line
            const vl = Math.hypot(a.vx, a.vy, a.vz) || 1, ux = a.vx / vl, uy = a.vy / vl, uz = a.vz / vl;
            const wx = t.x - a.x, wy = t.y - a.y, wz = t.z - a.z, s = wx * ux + wy * uy + wz * uz;
            const ex = wx - ux * s, ey = wy - uy * s, ez = wz - uz * s, d = Math.hypot(ex, ey, ez);
            const sb = clamp(s, 0, t.r);
            const px2 = a.x + ux * sb, py2 = a.y + uy * sb, pz2 = a.z + uz * sb;
            a.stuck = true; a.fade = 0; a.x = px2; a.y = py2; a.z = pz2; a.dir = { x: ux, y: uy, z: uz };
            a.to = { id: t.id, ox: px2 - t.x, oy: py2 - t.y, oz: pz2 - t.z };
            onHit && onHit(a, t, d, { x: px2, y: py2, z: pz2 });
            break;
          }
        }
        if (!a.stuck && a.y < groundFn(a.x, a.z)) {
          a.stuck = true; a.alive = false; a.ground = true; a.fade = 0; a.y = groundFn(a.x, a.z);
          onMiss && onMiss(a);
        }
      }
      if (a.t > 7 || Math.abs(a.x) > 260 || a.z < -260 || a.z > 260) { a.alive = false; a.stuck = true; onMiss && !a.ground && onMiss(a); a.ground = true; }
    }
    this.arrows = this.arrows.filter((a) => !(a.stuck && a.fade > (a.to ? 9 : 5)));
  }
  inFlight() { return this.arrows.some((a) => !a.stuck); }
  clear() { this.arrows = []; }
}

/** Ring score from lateral miss distance d against target radius r. */
export function ringScore(d, r) {
  const f = d / r;
  if (f <= 0.2) return { pts: 10, ring: 'BULLSEYE', prec: 1 };
  if (f <= 0.45) return { pts: 7, ring: 'EXCELLENT', prec: 0.8 };
  if (f <= 0.72) return { pts: 5, ring: 'GOOD', prec: 0.55 };
  return { pts: 3, ring: 'HIT', prec: 0.3 };
}

/** Pick the ray depth: the active target (by plane z / distance) whose screen position is closest to the cursor. */
export function aimPointOnRay(ray, depths) {
  // ray: {ox,oy,oz,dx,dy,dz}; depths: [{x,y,z}] candidate target centres (already filtered by screenDist)
  let best = depths[0];
  const t = ((best.x - ray.ox) * ray.dx + (best.y - ray.oy) * ray.dy + (best.z - ray.oz) * ray.dz);
  const s = Math.max(6, t);
  return { x: ray.ox + ray.dx * s, y: ray.oy + ray.dy * s, z: ray.oz + ray.dz * s };
}
