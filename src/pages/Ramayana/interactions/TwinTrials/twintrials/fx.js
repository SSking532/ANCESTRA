// Sky, water, particles, forest, grass and light-shaft effects.
import { rng } from './tex.js';

export function makeSky(THREE, opts = {}) {
  const u = {
    top: { value: new THREE.Color(opts.top || '#5e96c2') }, mid: { value: new THREE.Color(opts.mid || '#bcd6e2') },
    hor: { value: new THREE.Color(opts.hor || '#f6e3bd') }, sunDir: { value: new THREE.Vector3(-0.45, 0.42, -0.6).normalize() },
    time: { value: 0 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; uniform vec3 top, mid, hor, sunDir; uniform float time;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=0.5; } return s; }
      void main(){
        vec3 d = normalize(vD); float y = clamp(d.y, -0.2, 1.0);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.25, y)); c = mix(c, top, smoothstep(0.2, 0.85, y));
        float sd = max(dot(d, normalize(sunDir)), 0.0);
        c += vec3(1.0,0.82,0.55) * pow(sd, 6.0) * 0.35 + vec3(1.0,0.95,0.8) * pow(sd, 220.0) * 1.6;
        if (d.y > 0.02) { vec2 uv = d.xz / (d.y + 0.25) * 1.4 + vec2(time*0.004, 0.0);
          float cl = smoothstep(0.5, 0.82, fbm(uv*1.6)); cl *= smoothstep(0.0, 0.2, d.y);
          c = mix(c, mix(vec3(1.0,0.96,0.9), vec3(0.78,0.82,0.9), fbm(uv*3.0)*0.7), cl*0.8); }
        c = mix(c, hor*0.9, smoothstep(0.0, -0.2, d.y));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 20), m); s.renderOrder = -10; s.frustumCulled = false;
  s.userData.u = u; return s;
}

export function makeWater(THREE, w, d, opts = {}) {
  const u = { time: { value: 0 }, deep: { value: new THREE.Color(opts.deep || '#1c4a52') }, shallow: { value: new THREE.Color(opts.shallow || '#5fa39a') }, sky: { value: new THREE.Color('#cfe3e6') }, alpha: { value: opts.alpha ?? 0.9 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, fog: false,
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec2 vUv; varying vec3 vW; uniform float time, alpha; uniform vec3 deep, shallow, sky;
      void main(){
        vec2 p = vW.xz * 0.7;
        float r = sin(p.x*1.7 + time*1.3) + sin(p.y*2.1 - time*1.1) + sin((p.x+p.y)*1.3 + time*0.8) + sin(length(p - vec2(3.0,2.0))*3.0 - time*2.0);
        float f = r*0.25;
        vec3 c = mix(deep, shallow, 0.5 + f*0.5);
        float streak = smoothstep(0.78, 1.0, sin(p.x*3.0 + f*2.0 + time*0.6)*0.5+0.5) * 0.22;
        c += sky * (streak + max(f, 0.0)*0.18);
        float edge = smoothstep(0.0, 0.07, min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y)));
        c = mix(vec3(0.92,0.97,0.95), c, edge*0.85+0.15);
        gl_FragColor = vec4(c, alpha);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 1, 1), m); mesh.rotation.x = -Math.PI / 2; mesh.userData.u = u; mesh.renderOrder = 1; return mesh;
}

export function makeMist(THREE, T, w, d, color = '#f3e6c9', op = 0.35) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: T.glow, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.NormalBlending }));
  m.rotation.x = -Math.PI / 2; return m;
}

/** Instanced forest — 3 draw calls for all foliage. */
export function makeForest(THREE, M, positions, seed = 11) {
  const r = rng(seed), g = new THREE.Group();
  const foliageGeo = new THREE.IcosahedronGeometry(1, 1); const p = foliageGeo.attributes.position;
  for (let k = 0; k < p.count; k++) { const f = 0.85 + r() * 0.3; p.setXYZ(k, p.getX(k) * f, p.getY(k) * f * 0.82, p.getZ(k) * f); } foliageGeo.computeVertexNormals();
  const per = 11;
  const fm = [M.leafA, M.leafB, M.leafC].map((mm) => new THREE.InstancedMesh(foliageGeo, mm, positions.length * per));
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.6, 1, 1, 8), M.bark, positions.length);
  const dummy = new THREE.Object3D(), cnt = [0, 0, 0];
  positions.forEach(([x, z, s = 1, y0 = 0], i) => {
    const h = (6 + r() * 4) * s;
    dummy.position.set(x, y0 + h / 2, z); dummy.rotation.set(0, r() * 6, 0); dummy.scale.set(0.5 * s, h, 0.5 * s); dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix);
    for (let j = 0; j < per; j++) {
      const rad = (1.7 + r() * 1.8) * s, a = r() * 6.28, d = r() * 2.8 * s, k = (r() * 3) | 0;
      dummy.position.set(x + Math.cos(a) * d, y0 + h * 0.85 + (r() - 0.35) * 2.6 * s, z + Math.sin(a) * d);
      dummy.rotation.set(r(), r() * 6, r()); dummy.scale.set(rad, rad, rad); dummy.updateMatrix(); fm[k].setMatrixAt(cnt[k]++, dummy.matrix);
    }
  });
  fm.forEach((m, k) => { m.count = cnt[k]; m.instanceMatrix.needsUpdate = true; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; g.add(m); });
  trunk.castShadow = true; trunk.receiveShadow = true; trunk.frustumCulled = false; trunk.instanceMatrix.needsUpdate = true; g.add(trunk);
  return g;
}

export function makeGrass(THREE, T, areas, count, seed = 3) {
  const r = rng(seed);
  const geo = new THREE.PlaneGeometry(0.9, 0.7); geo.translate(0, 0.35, 0);
  const mat = new THREE.MeshStandardMaterial({ map: T.leaf, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1, color: '#9cc26a' });
  const im = new THREE.InstancedMesh(geo, mat, count * 2), d = new THREE.Object3D(); let n = 0;
  for (let i = 0; i < count; i++) {
    const a = areas[(r() * areas.length) | 0]; const x = a[0] + r() * (a[2] - a[0]), z = a[1] + r() * (a[3] - a[1]), s = 0.7 + r() * 1.0;
    for (let k = 0; k < 2; k++) { d.position.set(x, a[4] || 0, z); d.rotation.set(0, r() * 3.14 + k * 1.57, 0); d.scale.set(s, s * (0.8 + r() * 0.8), s); d.updateMatrix(); im.setMatrixAt(n++, d.matrix); }
  }
  im.count = n; im.receiveShadow = true; im.frustumCulled = false; return im;
}

/** Ambient floating motes (pollen, fireflies, leaves). */
export class Motes {
  constructor(THREE, T, count, box, o = {}) {
    this.n = count; this.box = box; this.o = o; const r = rng(o.seed || 9);
    this.pos = new Float32Array(count * 3); this.ph = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) { this.pos[i * 3] = box[0] + r() * (box[3] - box[0]); this.pos[i * 3 + 1] = box[1] + r() * (box[4] - box[1]); this.pos[i * 3 + 2] = box[2] + r() * (box[5] - box[2]); this.ph[i * 2] = r() * 6.28; this.ph[i * 2 + 1] = 0.4 + r(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(), 3));
    this.mesh = new THREE.Points(g, new THREE.PointsMaterial({ map: T.glow, color: o.color || '#fff0c0', size: o.size || 0.28, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: o.opacity ?? 0.75, sizeAttenuation: true }));
    this.mesh.frustumCulled = false; this.base = this.pos;
  }
  update(t, wind = 0.25) {
    const p = this.mesh.geometry.attributes.position, b = this.base;
    for (let i = 0; i < this.n; i++) {
      const ph = this.ph[i * 2], sp = this.ph[i * 2 + 1];
      let x = b[i * 3] + Math.sin(t * 0.3 * sp + ph) * 1.4 + t * wind * sp; const bx = this.box;
      const w = bx[3] - bx[0]; x = bx[0] + (((x - bx[0]) % w) + w) % w;
      p.setXYZ(i, x, b[i * 3 + 1] + Math.sin(t * 0.7 * sp + ph * 2) * 0.5, b[i * 3 + 2] + Math.cos(t * 0.25 * sp + ph) * 1.2);
    }
    p.needsUpdate = true;
  }
}

/** One-shot particle bursts (straw, dust, gold sparks, splashes). */
export class Bursts {
  constructor(THREE, T, max = 700) {
    this.max = max; this.i = 0;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.col = new Float32Array(max * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mesh = new THREE.Points(g, new THREE.PointsMaterial({ map: T.glow, size: 0.34, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 1 }));
    this.mesh.frustumCulled = false; this.C = THREE.Color;
    for (let k = 0; k < max; k++) this.pos[k * 3 + 1] = -999;
  }
  emit(x, y, z, n, hex, spread = 3, up = 2.5, grav = 8) {
    const c = new this.C(hex); this.grav = grav;
    for (let k = 0; k < n; k++) {
      const i = this.i++ % this.max, a = Math.random() * 6.28, s = Math.random() * spread, e = Math.random();
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
      this.vel[i * 3] = Math.cos(a) * s; this.vel[i * 3 + 1] = up * (0.3 + e); this.vel[i * 3 + 2] = Math.sin(a) * s;
      this.life[i] = 0.6 + Math.random() * 0.9; this.col[i * 3] = c.r * (0.7 + e * 0.5); this.col[i * 3 + 1] = c.g * (0.7 + e * 0.5); this.col[i * 3 + 2] = c.b * (0.7 + e * 0.5);
    }
  }
  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -999; continue; }
      this.life[i] -= dt; this.vel[i * 3 + 1] -= (this.grav || 8) * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const f = Math.min(1, this.life[i] * 2); this.col[i * 3] *= 0.985 + 0.015 * f;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.color.needsUpdate = true;
  }
}

export function makeShafts(THREE, T, n, area, seed = 5) {
  const r = rng(seed), g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2 + r() * 3.5, 26 + r() * 10), new THREE.MeshBasicMaterial({ map: T.rays, transparent: true, opacity: 0.2 + r() * 0.15, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.position.set(area[0] + r() * (area[2] - area[0]), 13, area[1] + r() * (area[3] - area[1])); m.rotation.set(0, r() * 3, 0.5); m.userData.base = m.material.opacity; m.userData.ph = r() * 6; g.add(m);
  }
  g.userData.tick = (t) => g.children.forEach((m) => { m.material.opacity = m.userData.base * (0.7 + 0.3 * Math.sin(t * 0.5 + m.userData.ph)); });
  return g;
}

/** Big rolling ground with soft hills away from the play area. */
export function makeGround(THREE, M, size, flatR, seed = 2) {
  const geo = new THREE.PlaneGeometry(size, size, 80, 80); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, r = rng(seed), ph = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x - (flatR.cx || 0), z - (flatR.cz || 0));
    const k = Math.max(0, Math.min(1, (d - flatR.r) / 40));
    p.setY(i, (Math.sin(x * 0.05 + ph[0]) * Math.cos(z * 0.045 + ph[1]) * 3 + Math.sin((x + z) * 0.02 + ph[2]) * 4) * k * k - 0.02);
  }
  geo.computeVertexNormals();
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * size / 8, uv.getY(i) * size / 8);
  const m = new THREE.Mesh(geo, M.grass); m.receiveShadow = true; return m;
}
