// Helpers shared by the level scenes: floor slabs, boundary rocks, avatar sync, camera, aiming.
import { T as CT, cw, gOf, clamp, smooth, lerp } from './core.js';
import { bevelBox, makeBlock } from './props.js';
import { poseBrother, makeBrother } from './chars.js';
import { rng } from './tex.js';

export const FLOOR_TOP = 0.12;

/** One InstancedMesh of bevelled paving slabs for every walkable FLOOR cell. */
export function buildSlabs(b, world, opts = {}) {
  const THREE = b.THREE, cells = [];
  for (let gz = 0; gz < world.h; gz++) for (let gx = 0; gx < world.w; gx++) if (world.type[world.k(gx, gz)] === CT.FLOOR) cells.push([gx, gz]);
  const mat = opts.mat || b.M.stone;
  const mesh = new THREE.InstancedMesh(bevelBox(THREE, 1.96, 0.5, 1.96, 0.05), mat, cells.length);
  const d = new THREE.Object3D(), r = rng(opts.seed || 8), col = new THREE.Color();
  cells.forEach(([gx, gz], i) => {
    d.position.set(cw(gx), (world.hgt[world.k(gx, gz)] || 0) + FLOOR_TOP - 0.25, cw(gz)); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
    const v = 0.88 + r() * 0.16; col.setRGB(v, v * (0.97 + r() * 0.05), v * (0.92 + r() * 0.08)); mesh.setColorAt(i, col);
  });
  mesh.receiveShadow = true; mesh.castShadow = true; mesh.frustumCulled = false; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  b.scene.add(mesh); return mesh;
}

/** Boulders + shrubs hugging every blocked cell next to playable space. */
export function buildRocks(b, world, skip = () => false, seed = 4, height = 1) {
  const THREE = b.THREE, r = rng(seed), spots = [];
  const play = (gx, gz) => world.inb(gx, gz) && world.type[world.k(gx, gz)] !== CT.WALL;
  for (let gz = 0; gz < world.h; gz++) for (let gx = 0; gx < world.w; gx++) {
    if (world.type[world.k(gx, gz)] !== CT.WALL || skip(gx, gz)) continue;
    let near = false; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (play(gx + dx, gz + dz)) near = true;
    if (near) spots.push([gx, gz]);
  }
  const rockGeo = new THREE.DodecahedronGeometry(1, 0), pos = rockGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) * (0.9 + r() * 0.2), pos.getY(i) * (0.9 + r() * 0.2), pos.getZ(i) * (0.9 + r() * 0.2));
  rockGeo.computeVertexNormals();
  const rocks = new THREE.InstancedMesh(rockGeo, b.M.stoneDark, spots.length * 2), bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), b.M.leafC, spots.length * 2);
  const d = new THREE.Object3D(); let n = 0, m = 0;
  for (const [gx, gz] of spots) {
    for (let k = 0; k < 2; k++) {
      const s = 0.8 + r() * 0.8; d.position.set(cw(gx) + (r() - 0.5) * 1.3, 0.2 + s * 0.4 * height - 0.4, cw(gz) + (r() - 0.5) * 1.3); d.rotation.set(r() * 3, r() * 3, r() * 3); d.scale.set(s * 1.1, s * 0.85 * height, s * 1.1); d.updateMatrix(); rocks.setMatrixAt(n++, d.matrix);
    }
    const s = 0.9 + r() * 0.7; d.position.set(cw(gx) + (r() - 0.5), 0.9 * height, cw(gz) + (r() - 0.5)); d.rotation.set(0, r() * 6, 0); d.scale.set(s, s * 0.8, s); d.updateMatrix(); bush.setMatrixAt(m++, d.matrix);
  }
  rocks.count = n; bush.count = m; [rocks, bush].forEach((o) => { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.instanceMatrix.needsUpdate = true; b.scene.add(o); });
  return spots;
}

/** Low stone curb along water edges. */
export function buildCurbs(b, world, y = FLOOR_TOP) {
  const THREE = b.THREE, list = [];
  const water = (gx, gz) => world.inb(gx, gz) && world.type[world.k(gx, gz)] === CT.WATER;
  for (let gz = 0; gz < world.h; gz++) for (let gx = 0; gx < world.w; gx++) {
    if (world.type[world.k(gx, gz)] !== CT.FLOOR) continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (water(gx + dx, gz + dz)) list.push([gx, gz, dx, dz]);
  }
  const mesh = new THREE.InstancedMesh(bevelBox(THREE, 2, 0.5, 0.42, 0.06), b.M.stoneDark, list.length), d = new THREE.Object3D();
  list.forEach(([gx, gz, dx, dz], i) => { d.position.set(cw(gx) + dx * 0.9, y + 0.12, cw(gz) + dz * 0.9); d.rotation.set(0, dx ? Math.PI / 2 : 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix); });
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.instanceMatrix.needsUpdate = true; b.scene.add(mesh);
  // retaining walls plunging into the water
  const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 3.2, 0.5), b.M.stoneDark, list.length);
  list.forEach(([gx, gz, dx, dz], i) => { d.position.set(cw(gx) + dx * 0.98, y - 1.65, cw(gz) + dz * 0.98); d.rotation.set(0, dx ? Math.PI / 2 : 0, 0); d.updateMatrix(); wall.setMatrixAt(i, d.matrix); });
  wall.receiveShadow = true; wall.frustumCulled = false; wall.instanceMatrix.needsUpdate = true; b.scene.add(wall); return mesh;
}

export class Avatar {
  constructor(b, who) { this.b = b; this.who = who; this.m = makeBrother(b.THREE, who, b.T); b.scene.add(this.m); this.aim = null; this.t = Math.random() * 10; }
  sync(ch, dt, o = {}) {
    this.t += dt;
    this.m.position.set(ch.x, ch.y + (o.dy || 0), ch.z); this.m.rotation.y = o.face ?? ch.face;
    poseBrother(this.m, { t: this.t, moving: ch.moving, walk: ch.walk, pushing: ch.pushing && ch.moving < 0.5 || ch.pushing, jy: ch.jy, idleAnim: this.who === 'luv' ? 'calm' : 'eager', ...o });
  }
}

export function syncBlock(m, b, world) {
  m.position.set(b.x, FLOOR_TOP + (world.hgt[world.k(b.gx, b.gz)] || 0) - (b.state === 'sunk' ? 1.5 : b.state === 'sinking' ? 1.5 * smooth(b.sink) : 0), b.z);
  m.rotation.y = 0;
}
export function makeBlocks(b, world) { return world.blocks.map(() => { const m = makeBlock(b.THREE, b.M, b.T); b.scene.add(m); return m; }); }

/** Convert a pointer position to a world ray using the engine camera. */
export function pointerRay(THREE, engine, ptr, jitter = { x: 0, y: 0 }) {
  const nx = ((ptr.x + jitter.x) / engine.w) * 2 - 1, ny = -(((ptr.y + jitter.y) / engine.h) * 2 - 1);
  const v = new THREE.Vector3(nx, ny, 0.5).unproject(engine.camera); const o = engine.camera.position;
  const d = v.sub(o).normalize(); return { o: o.clone(), d };
}
/** Choose aim depth from the live target whose screen projection is nearest the pointer. */
export function aimPoint(THREE, engine, ray, targets, ptr) {
  let best = null, bd = 1e9;
  for (const t of targets) {
    const s = engine.project(new THREE.Vector3(t.x, t.y, t.z)); if (!s.vis) continue;
    const d = Math.hypot(s.x - ptr.x, s.y - ptr.y); if (d < bd) { bd = d; best = t; }
  }
  const c = best || { x: ray.o.x + ray.d.x * 40, y: ray.o.y + ray.d.y * 40, z: ray.o.z + ray.d.z * 40 };
  const s = Math.max(8, (c.x - ray.o.x) * ray.d.x + (c.y - ray.o.y) * ray.d.y + (c.z - ray.o.z) * ray.d.z);
  return { x: ray.o.x + ray.d.x * s, y: ray.o.y + ray.d.y * s, z: ray.o.z + ray.d.z * s, locked: best };
}

/** Rotation that points a mesh whose +Z is "forward" along velocity (vx,vy,vz). */
export function orient(THREE, obj, vx, vy, vz) { const d = new THREE.Vector3(vx, vy, vz).normalize(); obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d); }

export const diffHud = (() => { let last = ''; return (cb, hud) => { const s = JSON.stringify(hud); if (s !== last) { last = s; cb.onHud && cb.onHud(hud); } }; })();
