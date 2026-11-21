// Pure game-world logic shared by all levels. No three.js / DOM here, so it can be simulated headlessly.
export const CELL = 2;
export const cw = (g) => (g + 0.5) * CELL;
export const gOf = (v) => Math.floor(v / CELL);
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const T = { VOID: 0, FLOOR: 1, WATER: 2, WALL: 3 };
export const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W (north = -z)
export const R = 0.42; // character radius
const FOOT = 0.3;

export class World {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.type = new Uint8Array(w * h).fill(T.WALL);
    this.hgt = new Float32Array(w * h);
    this.ramps = [];
    this.statics = new Set();
    this.filled = new Set();
    this.blocks = []; this.gates = []; this.plates = []; this.bridges = [];
    this.planks = []; this.platforms = []; this.inter = [];
    this.chars = {}; this.events = []; this.time = 0;
  }
  k(gx, gz) { return gz * this.w + gx; }
  inb(gx, gz) { return gx >= 0 && gz >= 0 && gx < this.w && gz < this.h; }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  drain() { const e = this.events; this.events = []; return e; }
  paint(t, x0, z0, x1, z1, h = 0) {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const i = this.k(x, z); this.type[i] = t; this.hgt[i] = h;
    }
  }
  setStatic(gx, gz) { this.statics.add(this.k(gx, gz)); }

  /* ---------- features ---------- */
  addBlock(gx, gz) {
    const b = { id: this.blocks.length, gx, gz, x: cw(gx), z: cw(gz), home: { gx, gz }, state: 'idle', p: 0, sink: 0, tgx: gx, tgz: gz, fx: cw(gx), fz: cw(gz) };
    this.blocks.push(b); return b;
  }
  addGate(id, cells) {
    const g = { id, cells, set: new Set(cells.map(([x, z]) => this.k(x, z))), open: false, openAmt: 0 };
    this.gates.push(g); return g;
  }
  addPlate(id, gx, gz) { const p = { id, gx, gz, pressed: false }; this.plates.push(p); return p; }
  addBridge(id, cells, dur = 3.2) {
    const b = { id, set: new Set(cells.map(([x, z]) => this.k(x, z))), cells, running: false, state: 0, dur };
    this.bridges.push(b); return b;
  }
  addPlank(id, gx, gz, dir) {
    const p = { id, gx, gz, dir, home: dir, rot: 0, from: dir, spin: false };
    this.planks.push(p); return p;
  }
  addInter(o) { this.inter.push({ r: 3, who: 'both', enabled: () => true, ...o }); return o; }
  makeChar(id, gx, gz) {
    const c = { id, x: cw(gx), z: cw(gz), y: 0, face: 0, moving: 0, walk: 0, pushing: false, pushT: 0, jy: 0, jv: 0, canPush: true, hold: null, tfollow: 0, path: null };
    this.chars[id] = c; c.y = this.heightAt(c.x, c.z); return c;
  }

  /* ---------- queries ---------- */
  plankCovers(gx, gz) {
    for (const p of this.planks) {
      if (p.spin) continue;
      const d = D4[p.dir];
      if (p.gx + d[0] === gx && p.gz + d[1] === gz) return true;
    }
    return false;
  }
  floorAt(gx, gz) {
    if (!this.inb(gx, gz)) return false;
    const i = this.k(gx, gz), t = this.type[i];
    if (t === T.FLOOR) return true;
    if (t !== T.WATER) return false;
    if (this.filled.has(i)) return true;
    if (this.plankCovers(gx, gz)) return true;
    for (const b of this.bridges) if (b.state >= 1 && b.set.has(i)) return true;
    return false;
  }
  hardBlocked(gx, gz, ignore) {
    if (!this.inb(gx, gz)) return true;
    const i = this.k(gx, gz), t = this.type[i];
    if (t === T.WALL || t === T.VOID) return true;
    if (this.statics.has(i)) return true;
    for (const g of this.gates) if (g.set.has(i) && g.openAmt < 0.85) return true;
    for (const b of this.blocks) {
      if (b === ignore || b.state === 'sunk') continue;
      if (b.gx === gx && b.gz === gz && (b.p === 0 || b.p < 0.55)) return true;
      if (b.p > 0 && b.tgx === gx && b.tgz === gz) return true;
    }
    return false;
  }
  onPlatform(x, z, pad = 0) {
    for (const p of this.platforms) {
      if (Math.abs(x - p.x) <= p.w / 2 + pad && Math.abs(z - p.z) <= p.d / 2 + pad) return p;
    }
    return null;
  }
  footOk(x, z) { return this.floorAt(gOf(x), gOf(z)) || !!this.onPlatform(x, z, 0.02); }
  blockedCircle(x, z) {
    const g0 = gOf(x - R), g1 = gOf(x + R), z0 = gOf(z - R), z1 = gOf(z + R);
    for (let gz = z0; gz <= z1; gz++) for (let gx = g0; gx <= g1; gx++) {
      if (!this.hardBlocked(gx, gz)) continue;
      const nx = clamp(x, gx * CELL, gx * CELL + CELL), nz = clamp(z, gz * CELL, gz * CELL + CELL);
      const dx = x - nx, dz = z - nz;
      if (dx * dx + dz * dz < R * R) return true;
    }
    return !(this.footOk(x - FOOT, z - FOOT) && this.footOk(x + FOOT, z - FOOT) && this.footOk(x - FOOT, z + FOOT) && this.footOk(x + FOOT, z + FOOT) && this.footOk(x, z));
  }
  heightAt(x, z) {
    const gx = gOf(x), gz = gOf(z);
    if (!this.inb(gx, gz)) return 0;
    for (const r of this.ramps) {
      if (gx >= r.gx0 && gx <= r.gx1 && gz >= r.gz0 && gz <= r.gz1) {
        const v = r.axis === 'x' ? x : z;
        return lerp(r.ha, r.hb, clamp((v - r.a) / (r.b - r.a), 0, 1));
      }
    }
    return this.hgt[this.k(gx, gz)];
  }

  /* ---------- character movement ---------- */
  unstick(ch) {
    if (!this.blockedCircle(ch.x, ch.z)) return;
    const g0x = gOf(ch.x), g0z = gOf(ch.z);
    for (let r = 1; r < 8; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const gx = g0x + dx, gz = g0z + dz;
      if (this.floorAt(gx, gz) && !this.hardBlocked(gx, gz) && !this.blockedCircle(cw(gx), cw(gz))) { ch.x = cw(gx); ch.z = cw(gz); return; }
    }
  }
  moveChar(ch, dx, dz) {
    if (dx && !this.blockedCircle(ch.x + dx, ch.z)) ch.x += dx;
    if (dz && !this.blockedCircle(ch.x, ch.z + dz)) ch.z += dz;
  }
  stepChar(ch, ix, iz, dt, jump = false, speed = 4.6) {
    const len = Math.hypot(ix, iz);
    if (len > 1) { ix /= len; iz /= len; }
    const px = ch.x, pz = ch.z;
    if (len > 0.05) {
      this.moveChar(ch, ix * speed * dt, iz * speed * dt);
      const tf = Math.atan2(ix, iz);
      let d = tf - ch.face; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      ch.face += d * Math.min(1, dt * 14);
    }
    const moved = Math.hypot(ch.x - px, ch.z - pz) / Math.max(dt, 1e-4);
    ch.moving += (clamp(moved / speed, 0, 1) - ch.moving) * Math.min(1, dt * 12);
    ch.walk += moved * dt * 1.15;
    if (jump && ch.jy <= 0.001) { ch.jv = 5.6; }
    if (ch.jv !== 0 || ch.jy > 0) { ch.jv -= 16 * dt; ch.jy += ch.jv * dt; if (ch.jy <= 0) { ch.jy = 0; ch.jv = 0; } }
    const hy = this.heightAt(ch.x, ch.z);
    ch.y += (hy - ch.y) * Math.min(1, dt * 14);
    if (Math.abs(hy - ch.y) < 0.002) ch.y = hy;
    if (!ch.onPlat) ch.platOffset = 0;
    return len > 0.05;
  }

  /* ---------- blocks ---------- */
  charNearCell(gx, gz, pad) {
    for (const id in this.chars) {
      const c = this.chars[id];
      if (Math.abs(c.x - cw(gx)) < CELL / 2 + pad && Math.abs(c.z - cw(gz)) < CELL / 2 + pad) return true;
    }
    return false;
  }
  canSlide(b, dx, dz) {
    if (b.state !== 'idle' || b.p > 0) return false;
    const tx = b.gx + dx, tz = b.gz + dz;
    if (!this.inb(tx, tz)) return false;
    const t = this.type[this.k(tx, tz)];
    if (t !== T.FLOOR && t !== T.WATER) return false;
    if (this.hardBlocked(tx, tz, b)) return false;
    if (this.charNearCell(tx, tz, R * 0.7)) return false;
    return true;
  }
  startSlide(b, dx, dz) {
    b.tgx = b.gx + dx; b.tgz = b.gz + dz; b.fx = b.x; b.fz = b.z; b.p = 0.0001; b.dirx = dx; b.dirz = dz;
    this.emit('push', { block: b.id });
  }
  tryPush(ch, ix, iz, dt) {
    ch.pushing = false;
    const ax = Math.abs(ix), az = Math.abs(iz);
    let dx = 0, dz = 0;
    if (ax > az * 1.25 && ax > 0.3) dx = Math.sign(ix); else if (az > ax * 1.25 && az > 0.3) dz = Math.sign(iz); else { ch.pushT = 0; return; }
    const gx = gOf(ch.x) + dx, gz = gOf(ch.z) + dz;
    let blk = null;
    for (const b of this.blocks) if (b.state === 'idle' && b.p === 0 && b.gx === gx && b.gz === gz) blk = b;
    if (!blk) { ch.pushT = 0; return; }
    const lat = dx ? Math.abs(ch.z - blk.z) : Math.abs(ch.x - blk.x);
    const gap = dx ? Math.abs(ch.x - blk.x) - CELL / 2 : Math.abs(ch.z - blk.z) - CELL / 2;
    if (lat > 0.85 || gap > 0.75) { ch.pushT = 0; return; }
    if (!ch.canPush) { if (ch.pushT === 0) this.emit('cantPush', { who: ch.id }); ch.pushT = 0.001; return; }
    ch.pushing = true;
    ch.pushT += dt;
    if (ch.pushT > 0.2 && this.canSlide(blk, dx, dz)) { this.startSlide(blk, dx, dz); ch.pushT = 0; }
  }
  resetBlocks() {
    for (const b of this.blocks) {
      b.state = 'idle'; b.p = 0; b.sink = 0; b.gx = b.home.gx; b.gz = b.home.gz; b.x = cw(b.gx); b.z = cw(b.gz); b.tgx = b.gx; b.tgz = b.gz;
    }
  }

  /* ---------- per-frame world update ---------- */
  update(dt) {
    this.time += dt;
    for (const b of this.blocks) {
      if (b.p > 0 && b.p < 1) {
        b.p = Math.min(1, b.p + dt / 0.42);
        const e = smooth(b.p);
        b.x = lerp(b.fx, cw(b.tgx), e); b.z = lerp(b.fz, cw(b.tgz), e);
        if (b.p >= 1) {
          b.gx = b.tgx; b.gz = b.tgz; b.x = cw(b.gx); b.z = cw(b.gz); b.p = 0;
          const i = this.k(b.gx, b.gz);
          if (this.type[i] === T.WATER && !this.floorAt(b.gx, b.gz)) { b.state = 'sinking'; this.emit('splash', { x: b.x, z: b.z }); }
          else this.emit('settle', { block: b.id, gx: b.gx, gz: b.gz });
        }
      } else if (b.state === 'sinking') {
        b.sink = Math.min(1, b.sink + dt / 0.55);
        if (b.sink >= 1) { b.state = 'sunk'; this.filled.add(this.k(b.gx, b.gz)); this.emit('fill', { gx: b.gx, gz: b.gz, block: b.id }); }
      }
    }
    for (const g of this.gates) {
      const tgt = g.open ? 1 : 0;
      const sp = dt / (g.dur || 2.6);
      g.openAmt = g.openAmt < tgt ? Math.min(tgt, g.openAmt + sp) : Math.max(tgt, g.openAmt - sp);
    }
    for (const br of this.bridges) if (br.running && br.state < 1) {
      br.state = Math.min(1, br.state + dt / br.dur);
      if (br.state >= 1) this.emit('bridgeDone', { id: br.id });
    }
    for (const p of this.planks) if (p.spin) {
      p.rot += dt / 0.7;
      if (p.rot >= 1) { p.spin = false; p.rot = 0; p.from = p.dir; this.emit('plankDone', { id: p.id }); }
    }
    for (const p of this.plates) {
      let on = false;
      if (!p.blockOnly) for (const id in this.chars) {
        if (p.only && p.only !== id) continue;
        const c = this.chars[id];
        if (Math.abs(c.x - cw(p.gx)) < 1.0 && Math.abs(c.z - cw(p.gz)) < 1.0) on = true;
      }
      if (!p.charOnly) for (const b of this.blocks) if (b.state === 'idle' && b.p === 0 && b.gx === p.gx && b.gz === p.gz) on = true;
      if (on !== p.pressed) { p.pressed = on; this.emit(on ? 'plateOn' : 'plateOff', { id: p.id }); }
    }
  }

  /* ---------- interaction + helpers ---------- */
  nearestInter(ch, who) {
    let best = null, bd = 1e9;
    for (const it of this.inter) {
      if (!it.enabled()) continue;
      const d = Math.hypot(it.x - ch.x, it.z - ch.z);
      if (d <= it.r && d < bd) { best = it; bd = d; }
    }
    return best;
  }
  findPath(sx, sz, tx, tz) {
    const W = this.w, H = this.h, start = this.k(sx, sz), goal = this.k(tx, tz);
    if (start === goal) return [];
    const prev = new Int32Array(W * H).fill(-1); prev[start] = start;
    const q = [start];
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi]; if (cur === goal) break;
      const cx = cur % W, cz = (cur / W) | 0;
      for (const [dx, dz] of D4) {
        const nx = cx + dx, nz = cz + dz;
        if (!this.inb(nx, nz)) continue;
        const ni = this.k(nx, nz);
        if (prev[ni] !== -1) continue;
        if (!this.floorAt(nx, nz) || this.hardBlocked(nx, nz)) continue;
        prev[ni] = cur; q.push(ni);
      }
    }
    if (prev[goal] === -1) return null;
    const path = []; let c = goal;
    while (c !== start) { path.push([c % W, (c / W) | 0]); c = prev[c]; }
    return path.reverse();
  }
  follow(ch, leader, dt, near = 2.3, far = 4.4) {
    const d = Math.hypot(leader.x - ch.x, leader.z - ch.z);
    ch.tfollow -= dt;
    if (d < near || (d < far && !ch.following)) { ch.following = false; ch.path = null; this.stepChar(ch, 0, 0, dt); return; }
    ch.following = true;
    if (ch.tfollow <= 0) {
      ch.tfollow = 0.35;
      ch.path = this.findPath(gOf(ch.x), gOf(ch.z), gOf(leader.x), gOf(leader.z));
    }
    if (ch.path && ch.path.length) {
      let [gx, gz] = ch.path[0];
      if (Math.hypot(cw(gx) - ch.x, cw(gz) - ch.z) < 0.5 && ch.path.length > 1) { ch.path.shift(); [gx, gz] = ch.path[0]; }
      const last = ch.path.length === 1;
      const tx = last ? lerpPt(cw(gx), leader.x, 0.0) : cw(gx), tz = last ? cw(gz) : cw(gz);
      this.stepChar(ch, tx - ch.x, tz - ch.z, dt, false, 4.1);
    } else this.stepChar(ch, 0, 0, dt);
  }
  separate(a, b, dt) {
    const dx = a.x - b.x, dz = a.z - b.z, d = Math.hypot(dx, dz);
    if (d < 0.95 && d > 0.001) { const p = (0.95 - d) * Math.min(1, dt * 6); this.moveChar(a, dx / d * p * 0.5, dz / d * p * 0.5); this.moveChar(b, -dx / d * p * 0.5, -dz / d * p * 0.5); }
  }
}
function lerpPt(a, b, t) { return a + (b - a) * t; }

export const camDir = (yaw, mx, mz) => {
  // mx: right(+), mz: forward(+). Camera sits at +(sin,cos)*d looking toward target.
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  return [fx * mz + rx * mx, fz * mz + rz * mx];
};
