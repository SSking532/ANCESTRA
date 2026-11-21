import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ALTAR,
  FOG_COLOR,
  FOG_DENSITY,
  RIVER_N,
  SKY_GLSL,
  SUN_DIR,
  WAVE_GLSL,
  buildTerrainGeometry,
  clamp,
  clock,
  easeInOut,
  lerp,
  mulberry32,
  riverHalfWidth,
  riverPts,
  riverQuery,
  riverY,
  shoreX,
  slotPosition,
  terrainHeight,
  waveGrad,
  waveHeight,
} from "./ramSetuWorld";

/* ================================================================== */
/*  SHADERS                                                            */
/* ================================================================== */

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAG = /* glsl */ `
varying vec3 vDir;
uniform float uTime;
${SKY_GLSL}
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  float a = hash21(i), b = hash21(i+vec2(1.0,0.0)), c = hash21(i+vec2(0.0,1.0)), d = hash21(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<5;i++){ v += a*vnoise(p); p = p*2.03 + vec2(11.7,5.3); a *= 0.5; }
  return v;
}
void main(){
  vec3 d = normalize(vDir);
  vec3 col = skyColor(d);
  float s = dot(d, uSunDir);
  col += vec3(1.0, 0.92, 0.72) * smoothstep(0.9988, 0.9996, s) * 1.4;

  vec3 sp = d * 180.0;
  vec3 id = floor(sp);
  float hs = fract(sin(dot(id, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  float dd = length(fract(sp) - 0.5);
  float star = step(0.9975, hs) * smoothstep(0.35, 0.0, dd) * smoothstep(0.30, 0.85, d.y);
  star *= 0.6 + 0.4 * sin(uTime * 2.0 + hs * 50.0);
  col += vec3(1.0, 0.95, 0.9) * star * 0.9;

  if (d.y > 0.01) {
    vec2 uv = d.xz / (d.y + 0.22);
    uv = uv * 0.9 + vec2(uTime * 0.006, 0.0);
    float c1 = fbm(uv * 1.2);
    float c2 = fbm(uv * 3.1 + 7.0);
    float dens = smoothstep(0.48, 0.80, c1 * 0.75 + c2 * 0.35);
    dens *= smoothstep(0.01, 0.16, d.y);
    float sunSide = pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uSunDir.x, 0.0, uSunDir.z))), 0.0), 2.0);
    vec3 cc = mix(vec3(0.62, 0.40, 0.55), vec3(1.0, 0.62, 0.36), sunSide);
    cc = mix(cc, vec3(0.30, 0.26, 0.50), smoothstep(0.35, 0.9, d.y));
    cc += vec3(1.0, 0.75, 0.4) * pow(max(s, 0.0), 6.0) * 0.55;
    col = mix(col, cc, dens * 0.82);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

const OCEAN_VERT = /* glsl */ `
uniform float uTime;
varying vec3 vWorld;
${WAVE_GLSL}
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  wp.y += waveH(wp.xz, uTime);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const OCEAN_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFog;
varying vec3 vWorld;
${SKY_GLSL}
${WAVE_GLSL}
float shoreX(float z){ return -7.5 + sin(z*0.35)*0.9 + sin(z*0.9+1.0)*0.5; }
void main(){
  vec2 p = vWorld.xz;
  float t = uTime;
  vec2 g = waveG(p, t);
  float a1 = p.x*5.0 + p.y*3.0 + t*1.9;
  float a2 = p.x*9.0 - p.y*7.0 - t*2.6;
  float a3 = p.x*17.0 + p.y*11.0 + t*3.4;
  g += vec2(cos(a1)*0.05 + cos(a2)*0.03 + cos(a3)*0.015,
            cos(a1)*0.035 - cos(a2)*0.025 + cos(a3)*0.01);
  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 V = normalize(cameraPosition - vWorld);
  float ndv = clamp(dot(n, V), 0.0, 1.0);
  float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  fres = clamp(fres * 1.6 + 0.10, 0.0, 1.0);
  vec3 R = reflect(-V, n);
  R.y = abs(R.y);
  vec3 refl = skyColor(R);

  float dx = vWorld.x - shoreX(vWorld.z);
  float shallow = 1.0 - smoothstep(0.0, 16.0, dx);
  vec3 deep = vec3(0.03, 0.16, 0.23);
  vec3 shal = vec3(0.12, 0.52, 0.52);
  vec3 body = mix(deep, shal, shallow * 0.85);
  float sss = pow(clamp(dot(n, normalize(vec3(uSunDir.x, 0.4, uSunDir.z))), 0.0, 1.0), 3.0);
  body += vec3(0.10, 0.32, 0.28) * sss * 0.5;

  vec3 col = mix(body, refl, fres);
  vec3 H = normalize(uSunDir + V);
  float nh = clamp(dot(n, H), 0.0, 1.0);
  col += vec3(1.0, 0.80, 0.52) * pow(nh, 260.0) * 3.0;
  col += vec3(1.0, 0.60, 0.30) * pow(nh, 40.0) * 0.18;

  float h = waveH(p, t);
  col = mix(col, vec3(1.0, 0.95, 0.88), smoothstep(0.11, 0.19, h) * 0.30);

  float pulse = 0.5 + 0.5 * sin(dx * 3.2 - t * 1.3 + sin(p.y * 0.8) * 1.5);
  float band = smoothstep(3.0, 0.2, dx) * smoothstep(-0.6, 0.4, dx);
  float foam = band * smoothstep(0.55, 1.0, pulse);
  foam += smoothstep(0.9, 0.0, abs(dx)) * 0.4;
  col = mix(col, vec3(1.0, 0.97, 0.92), clamp(foam, 0.0, 0.85));

  float d = length(cameraPosition - vWorld);
  float f = 1.0 - exp(-pow(d * uFog, 2.0));
  vec3 fogCol = skyColor(normalize(vec3(-V.x, 0.015, -V.z)));
  col = mix(col, fogCol, f);
  gl_FragColor = vec4(col, 1.0);
}`;

const RIVER_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const RIVER_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFog;
varying vec2 vUv;
varying vec3 vWorld;
${SKY_GLSL}
void main(){
  float flow = vUv.y * 4.0 - uTime * 0.9;
  float s1 = sin(flow * 6.2831 + sin(vUv.x * 9.0 + uTime * 0.7) * 1.6);
  float s2 = sin((vUv.y * 7.0 - uTime * 1.7) * 6.2831 + vUv.x * 14.0);
  vec3 n = normalize(vec3(s1 * 0.12, 1.0, s2 * 0.10));
  vec3 V = normalize(cameraPosition - vWorld);
  float fr = 0.06 + 0.94 * pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 5.0);
  vec3 R = reflect(-V, n);
  R.y = abs(R.y);
  vec3 col = mix(vec3(0.07, 0.32, 0.36), skyColor(R), clamp(fr * 1.5 + 0.12, 0.0, 1.0));
  col += vec3(1.0, 0.78, 0.5) * pow(max(dot(n, normalize(uSunDir + V)), 0.0), 180.0) * 1.6;
  float edge = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
  float foam = (1.0 - smoothstep(0.0, 0.2, min(vUv.x, 1.0 - vUv.x))) * (0.5 + 0.5 * s2);
  col = mix(col, vec3(1.0), foam * 0.45);
  float d = length(cameraPosition - vWorld);
  float f = 1.0 - exp(-pow(d * uFog, 2.0));
  col = mix(col, skyColor(normalize(vec3(-V.x, 0.015, -V.z))), f);
  gl_FragColor = vec4(col, edge * 0.96);
}`;

/* ================================================================== */
/*  ENVIRONMENT                                                        */
/* ================================================================== */

function ClockTick() {
  useFrame((_, dt) => {
    clock.t += Math.min(dt, 0.05);
  });
  return null;
}

function Sky() {
  const group = useRef();
  const { camera } = useThree();
  const uniforms = useMemo(
    () => ({ uSunDir: { value: SUN_DIR.clone() }, uTime: { value: 0 } }),
    []
  );
  useFrame(() => {
    uniforms.uTime.value = clock.t;
    if (group.current) group.current.position.copy(camera.position);
  });
  return (
    <group ref={group}>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[450, 48, 32]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
          uniforms={uniforms}
          vertexShader={SKY_VERT}
          fragmentShader={SKY_FRAG}
        />
      </mesh>
    </group>
  );
}

function Ocean() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(420, 420, 300, 300);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: SUN_DIR.clone() },
      uFog: { value: FOG_DENSITY },
    }),
    []
  );
  useFrame(() => {
    uniforms.uTime.value = clock.t;
  });
  return (
    <mesh geometry={geo} position={[70, 0, 0]} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={OCEAN_VERT}
        fragmentShader={OCEAN_FRAG}
        fog={false}
      />
    </mesh>
  );
}

function Terrain() {
  const geo = useMemo(() => buildTerrainGeometry(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
    </mesh>
  );
}

function River() {
  const geo = useMemo(() => {
    const pos = [];
    const uv = [];
    const idx = [];
    let len = 0;
    for (let i = 0; i < RIVER_N; i++) {
      const p = riverPts[i];
      const a = riverPts[Math.max(0, i - 1)];
      const b = riverPts[Math.min(RIVER_N - 1, i + 1)];
      const tx = b.x - a.x;
      const tz = b.z - a.z;
      const l = Math.hypot(tx, tz) || 1;
      const nx = -tz / l;
      const nz = tx / l;
      const hw = riverHalfWidth(i) + 0.2;
      const y = riverY[i];
      if (i > 0) len += Math.hypot(p.x - riverPts[i - 1].x, p.z - riverPts[i - 1].z);
      pos.push(p.x + nx * hw, y, p.z + nz * hw, p.x - nx * hw, y, p.z - nz * hw);
      uv.push(0, len / 6, 1, len / 6);
      if (i < RIVER_N - 1) {
        const k = i * 2;
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }, []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: SUN_DIR.clone() },
      uFog: { value: FOG_DENSITY },
    }),
    []
  );
  useFrame(() => {
    uniforms.uTime.value = clock.t;
  });
  return (
    <mesh geometry={geo} renderOrder={1}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={RIVER_VERT}
        fragmentShader={RIVER_FRAG}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        fog={false}
      />
    </mesh>
  );
}

/** Stones drifting down the river toward the sea. */
function RiverStones({ assets }) {
  const refs = useRef([]);
  const items = useMemo(
    () => [0, 1, 2, 3].map((i) => ({ off: i * 0.25 + 0.05, speed: 0.011 + i * 0.002, v: i })),
    []
  );
  useFrame(() => {
    const t = clock.t;
    items.forEach((it, k) => {
      const m = refs.current[k];
      if (!m) return;
      const u = (t * it.speed + it.off) % 1;
      const f = u * (RIVER_N - 1);
      const i = Math.min(RIVER_N - 2, Math.floor(f));
      const w = f - i;
      const a = riverPts[i];
      const b = riverPts[i + 1];
      m.position.set(
        lerp(a.x, b.x, w),
        lerp(riverY[i], riverY[i + 1], w) + 0.16 + Math.sin(t * 1.6 + k) * 0.03,
        lerp(a.z, b.z, w)
      );
      m.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x) + 0.4 * k;
      m.rotation.z = Math.sin(t * 1.3 + k) * 0.06;
    });
  });
  return (
    <>
      {items.map((it, k) => (
        <mesh
          key={k}
          ref={(el) => (refs.current[k] = el)}
          geometry={assets.geos[k % 3]}
          material={assets.mats[it.v]}
          scale={0.42}
          castShadow
        />
      ))}
    </>
  );
}

function Lanka({ assets }) {
  const inst = useRef();
  const COUNT = 190;
  useEffect(() => {
    const r = mulberry32(11);
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      const th = Math.PI * (0.55 + r() * 0.9);
      const rho = 7 + r() * 17;
      const x = 124 + Math.cos(th) * rho;
      const z = Math.sin(th) * rho * 0.9;
      const y = 36 * (1 - rho / 30) - 2 + 0.1;
      const w = 1.4 + r() * 2.6;
      const h = 2.5 + r() * 7;
      d.position.set(x, y + h / 2, z);
      d.scale.set(w, h, w);
      d.updateMatrix();
      inst.current.setMatrixAt(i, d.matrix);
      c.setHSL(0.09 + r() * 0.035, 0.85, 0.55 + r() * 0.2);
      inst.current.setColorAt(i, c);
    }
    inst.current.instanceMatrix.needsUpdate = true;
    if (inst.current.instanceColor) inst.current.instanceColor.needsUpdate = true;
  }, []);

  const cones = [
    [124, 0, 30, 36],
    [112, -26, 22, 22],
    [112, 28, 24, 24],
    [138, -42, 26, 26],
    [138, 42, 28, 30],
    [100, 54, 16, 10],
    [102, -52, 16, 12],
    [150, 0, 34, 28],
  ];
  return (
    <group>
      {cones.map(([x, z, r, h], i) => (
        <mesh key={i} position={[x, h / 2 - 2, z]}>
          <coneGeometry args={[r, h, 9, 1]} />
          <meshStandardMaterial color="#3b2f57" flatShading roughness={1} />
        </mesh>
      ))}
      <instancedMesh ref={inst} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} fog={false} />
      </instancedMesh>
      <mesh position={[124, 37, 0]}>
        <coneGeometry args={[0.9, 9, 6]} />
        <meshBasicMaterial color="#ffd37a" toneMapped={false} fog={false} />
      </mesh>
      <sprite position={[106, 14, 0]} scale={[96, 62, 1]}>
        <spriteMaterial
          map={assets.glowTex}
          color="#ffb347"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.7}
          fog={false}
        />
      </sprite>
    </group>
  );
}

function Lights() {
  const p = SUN_DIR.clone().multiplyScalar(70);
  return (
    <>
      <hemisphereLight args={["#8b8fd0", "#a8744b", 0.85]} />
      <ambientLight intensity={0.18} color="#ffd7b0" />
      <directionalLight
        position={[p.x, p.y, p.z]}
        intensity={3.1}
        color="#ffb77d"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-30, 18, 20]} intensity={0.55} color="#8f9bff" />
    </>
  );
}

/* ---------------------------- shore props -------------------------- */

function Palms() {
  const { leaf, trunk, palms } = useMemo(() => {
    const leafG = new THREE.PlaneGeometry(1, 1, 4, 10);
    const lp = leafG.attributes.position;
    for (let i = 0; i < lp.count; i++) {
      const x = lp.getX(i);
      const v = lp.getY(i) + 0.5;
      const taper = Math.sin(Math.PI * (v * 0.9 + 0.05)) + 0.15;
      lp.setXYZ(i, x * 0.8 * taper, -(v * v) * 1.5 - Math.abs(x) * 0.35, v * 3.2);
    }
    leafG.computeVertexNormals();

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, 2, 0.1),
      new THREE.Vector3(0.7, 4, 0),
      new THREE.Vector3(1.2, 5.7, 0),
    ]);
    const trunkG = new THREE.TubeGeometry(curve, 12, 0.16, 8, false);

    const r = mulberry32(21);
    const out = [];
    let tries = 0;
    while (out.length < 16 && tries < 500) {
      tries++;
      const x = -27 + r() * 14.5;
      const z = -24 + r() * 48;
      if (x > -15.5 && Math.abs(z) < 8) continue;
      if (riverQuery(x, z).d < 4.5) continue;
      const y = terrainHeight(x, z);
      if (y < 0.7 || y > 6) continue;
      out.push({ x, y, z, s: 0.8 + r() * 0.6, rot: r() * 6.28, leaves: 8 + Math.floor(r() * 3) });
    }
    return { leaf: leafG, trunk: trunkG, palms: out };
  }, []);

  return (
    <>
      {palms.map((p, i) => (
        <group key={i} position={[p.x, p.y - 0.1, p.z]} rotation={[0, p.rot, 0]} scale={p.s}>
          <mesh geometry={trunk} castShadow>
            <meshStandardMaterial color="#7a5a3a" roughness={0.95} />
          </mesh>
          <group position={[1.2, 5.7, 0]}>
            {Array.from({ length: p.leaves }, (_, k) => (
              <mesh
                key={k}
                geometry={leaf}
                rotation={[-0.25, (k / p.leaves) * Math.PI * 2, 0]}
                castShadow
              >
                <meshStandardMaterial color={k % 2 ? "#4b6b2a" : "#587a30"} roughness={0.9} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
    </>
  );
}

function Rocks() {
  const inst = useRef();
  const COUNT = 46;
  useEffect(() => {
    const r = mulberry32(33);
    const d = new THREE.Object3D();
    let placed = 0;
    let tries = 0;
    while (placed < COUNT && tries < 600) {
      tries++;
      const shallow = placed >= 34;
      let x;
      let z = -20 + r() * 40;
      if (shallow) x = shoreX(z) + 0.4 + r() * 3.2;
      else x = -22 + r() * 14;
      if (Math.abs(z) < 3.2 && x > -14) continue;
      if (Math.hypot(x - ALTAR.x, z - ALTAR.z) < 3.4) continue;
      if (x < -5 && riverQuery(x, z).d < 2.4) continue;
      const y = shallow ? -0.15 : terrainHeight(x, z) - 0.05;
      const s = 0.3 + r() * (shallow ? 0.7 : 1.0);
      d.position.set(x, y + s * 0.3, z);
      d.rotation.set(r() * 3, r() * 6, r() * 3);
      d.scale.set(s * (0.9 + r() * 0.6), s * (0.6 + r() * 0.5), s * (0.9 + r() * 0.6));
      d.updateMatrix();
      inst.current.setMatrixAt(placed, d.matrix);
      placed++;
    }
    inst.current.count = placed;
    inst.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={inst} args={[undefined, undefined, COUNT]} castShadow receiveShadow frustumCulled={false}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8a7a69" roughness={0.95} flatShading />
    </instancedMesh>
  );
}

const ALTAR_Y = terrainHeight(ALTAR.x, ALTAR.z);
export const HERO_REST = new THREE.Vector3(ALTAR.x, ALTAR_Y + 0.74, ALTAR.z);

function Altar() {
  const light = useRef();
  const flames = useRef([]);
  const diyas = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        return { x: Math.cos(a) * 1.55, z: Math.sin(a) * 1.35, k: i };
      }),
    []
  );
  useFrame(() => {
    const t = clock.t;
    flames.current.forEach((f, i) => {
      if (!f) return;
      const s = 1 + Math.sin(t * 9 + i * 2.1) * 0.18 + Math.sin(t * 17 + i) * 0.08;
      f.scale.set(0.55 * s, 1.1 * s, 0.55 * s);
    });
    if (light.current) light.current.intensity = 7 + Math.sin(t * 8) * 1.1 + Math.sin(t * 13) * 0.6;
  });
  return (
    <group position={[ALTAR.x, ALTAR_Y, ALTAR.z]}>
      <mesh position={[0, 0.18, 0]} scale={[1, 1, 0.86]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.4, 0.5, 9]} />
        <meshStandardMaterial color="#8b7b68" roughness={0.95} flatShading />
      </mesh>
      {diyas.map((d, i) => (
        <group key={i} position={[d.x, 0.05, d.z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.07, 0.07, 10]} />
            <meshStandardMaterial color="#9b5a2c" roughness={0.8} />
          </mesh>
          <mesh ref={(el) => (flames.current[i] = el)} position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color="#ffb347" toneMapped={false} />
          </mesh>
        </group>
      ))}
      <pointLight ref={light} position={[0, 1.4, 0.8]} color="#ff9a40" distance={9} decay={2} intensity={7} />
    </group>
  );
}

function Flag({ x, z, assets }) {
  const y = useMemo(() => terrainHeight(x, z), [x, z]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2.0, 1.25, 18, 8);
    g.translate(1.0, 0, 0);
    return g;
  }, []);
  const base = useMemo(() => geo.attributes.position.array.slice(), [geo]);
  useFrame(() => {
    const t = clock.t;
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const bx = base[i * 3];
      const by = base[i * 3 + 1];
      const k = bx / 2.0;
      p.setZ(i, Math.sin(bx * 3.0 - t * 4.2 + by) * 0.14 * k + Math.sin(bx * 5.5 - t * 6.0) * 0.04 * k);
    }
    p.needsUpdate = true;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 3.1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 6.2, 8]} />
        <meshStandardMaterial color="#5a3b22" roughness={0.9} />
      </mesh>
      <mesh position={[0, 6.28, 0]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color="#d9a441" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh geometry={geo} position={[0.05, 5.55, 0]} rotation={[0, -0.7, 0]}>
        <meshBasicMaterial map={assets.flagTex} transparent alphaTest={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function StonePile({ assets }) {
  const stones = useMemo(() => {
    const r = mulberry32(5);
    return Array.from({ length: 10 }, (_, i) => {
      const layer = i < 6 ? 0 : i < 9 ? 1 : 2;
      const x = -13.6 + (i % 3) * 0.95 + layer * 0.4 + (r() - 0.5) * 0.3;
      const z = 2.4 + Math.floor((i % 6) / 3) * 0.95 + (r() - 0.5) * 0.3;
      return {
        x,
        z,
        y: terrainHeight(x, z) + 0.22 + layer * 0.42,
        rot: r() * 3,
        v: i % 4,
        g: i % 3,
      };
    });
  }, []);
  return (
    <>
      {stones.map((s, i) => (
        <mesh
          key={i}
          geometry={assets.geos[s.g]}
          material={assets.mats[s.v]}
          position={[s.x, s.y, s.z]}
          rotation={[0, s.rot, 0]}
          scale={0.85}
          castShadow
          receiveShadow
        />
      ))}
    </>
  );
}

/* ================================================================== */
/*  VANARA                                                             */
/* ================================================================== */

const Vanara = forwardRef(function Vanara({ kit, anim, fur = 0, stoneGeo, stoneMats }, ref) {
  const body = useRef();
  const legL = useRef();
  const legR = useRef();
  const armL = useRef();
  const armR = useRef();
  const load = useRef();

  useFrame(() => {
    const a = anim.current;
    const sw = Math.sin(a.phase);
    if (legL.current && legR.current) {
      legL.current.rotation.x = sw * 0.95 * a.move;
      legR.current.rotation.x = -sw * 0.95 * a.move;
    }
    if (armL.current && armR.current) {
      if (a.carrying || a.cheer) {
        const w = a.cheer ? Math.sin(clock.t * 7 + (a.seed || 0)) * 0.25 : 0;
        const zz = a.cheer ? -0.3 : 0.12;
        armL.current.rotation.set(-2.85 + w, 0, zz);
        armR.current.rotation.set(-2.85 - w, 0, -zz);
      } else {
        armL.current.rotation.set(-sw * 0.7 * a.move, 0, 0.08);
        armR.current.rotation.set(sw * 0.7 * a.move, 0, -0.08);
      }
    }
    if (body.current) {
      body.current.position.y = Math.abs(sw) * 0.05 * a.move - 0.07 * a.squat;
      body.current.scale.y = 1 - 0.08 * a.squat;
    }
    if (load.current) load.current.visible = !!(a.carrying && stoneMats);
  });

  const furM = kit.fur[fur % kit.fur.length];
  return (
    <group ref={ref} scale={1.22}>
      <group ref={body}>
        <group ref={legL} position={[0.11, 0.62, 0]}>
          <mesh geometry={kit.leg} material={furM} position={[0, -0.3, 0]} castShadow />
        </group>
        <group ref={legR} position={[-0.11, 0.62, 0]}>
          <mesh geometry={kit.leg} material={furM} position={[0, -0.3, 0]} castShadow />
        </group>
        <mesh geometry={kit.dhoti} material={kit.cloth} position={[0, 0.66, 0]} castShadow />
        <mesh geometry={kit.belt} material={kit.gold} position={[0, 0.82, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={kit.torso} material={furM} position={[0, 1.08, 0]} castShadow />
        <mesh geometry={kit.tail} material={kit.darkFur} position={[0, 0.7, -0.16]} castShadow />
        <group position={[0, 1.66, 0.02]}>
          <mesh geometry={kit.head} material={furM} castShadow />
          <mesh geometry={kit.face} material={kit.skin} position={[0, -0.02, 0.1]} scale={[1, 0.95, 0.7]} />
          <mesh geometry={kit.ear} material={kit.skin} position={[0.2, 0, 0]} />
          <mesh geometry={kit.ear} material={kit.skin} position={[-0.2, 0, 0]} />
          <mesh geometry={kit.eyeG} material={kit.eye} position={[0.07, 0.03, 0.17]} />
          <mesh geometry={kit.eyeG} material={kit.eye} position={[-0.07, 0.03, 0.17]} />
          <mesh geometry={kit.hair} material={kit.darkFur} position={[0, 0.02, -0.01]} />
          <mesh geometry={kit.bandG} material={kit.band} position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
        <group ref={armL} position={[0.27, 1.36, 0]}>
          <mesh geometry={kit.arm} material={furM} position={[0, -0.25, 0]} castShadow />
        </group>
        <group ref={armR} position={[-0.27, 1.36, 0]}>
          <mesh geometry={kit.arm} material={furM} position={[0, -0.25, 0]} castShadow />
        </group>
        {stoneMats && (
          <group ref={load} position={[0, 2.0, 0.05]} visible={false}>
            <mesh geometry={stoneGeo} material={stoneMats} scale={0.62} castShadow />
          </group>
        )}
      </group>
    </group>
  );
});

const WALKERS = [
  { z: 3.6, ph: 0, fur: 0, speed: 1.25 },
  { z: 5.0, ph: 1.7, fur: 1, speed: 1.1 },
  { z: 6.6, ph: 3.1, fur: 2, speed: 1.35 },
  { z: -4.8, ph: 0.8, fur: 3, speed: 1.2 },
  { z: -6.2, ph: 2.4, fur: 0, speed: 1.05 },
  { z: -3.6, ph: 4.0, fur: 1, speed: 1.3 },
];
const CHEERERS = [
  { x: -11.0, z: -2.3, fur: 2, ph: 0.4 },
  { x: -9.9, z: -3.5, fur: 0, ph: 1.9 },
  { x: -12.1, z: -1.1, fur: 3, ph: 3.2 },
];

function Walker({ cfg, assets, stoneMats }) {
  const root = useRef();
  const anim = useRef({ phase: 0, move: 1, carrying: true, cheer: false, squat: 0, seed: cfg.ph });
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const r = root.current;
    if (!r) return;
    const phase = (clock.t * cfg.speed) / 7 + cfg.ph;
    const u = 0.5 - 0.5 * Math.cos(Math.PI * phase);
    const dir = Math.sin(Math.PI * phase);
    const x = lerp(-14.2, -8.8, u);
    const a = anim.current;
    a.carrying = dir > 0;
    a.move = clamp(Math.abs(dir) * 1.7, 0, 1);
    a.phase += dt * 8 * cfg.speed * a.move;
    r.position.set(x, terrainHeight(x, cfg.z), cfg.z);
    r.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  });
  return (
    <Vanara
      ref={root}
      kit={assets.kit}
      anim={anim}
      fur={cfg.fur}
      stoneGeo={assets.geos[0]}
      stoneMats={stoneMats}
    />
  );
}

function Cheerer({ cfg, assets }) {
  const root = useRef();
  const anim = useRef({ phase: 0, move: 0, carrying: false, cheer: true, squat: 0, seed: cfg.ph });
  const y = useMemo(() => terrainHeight(cfg.x, cfg.z), [cfg]);
  useFrame(() => {
    const r = root.current;
    if (!r) return;
    r.position.set(cfg.x, y + Math.abs(Math.sin(clock.t * 3.6 + cfg.ph)) * 0.2, cfg.z);
    r.rotation.y = Math.PI / 2 - 0.25;
  });
  return <Vanara ref={root} kit={assets.kit} anim={anim} fur={cfg.fur} />;
}

/* ================================================================== */
/*  STONES                                                             */
/* ================================================================== */

function FloatingStone({
  assets,
  geo,
  mats,
  x,
  z,
  rotY = 0,
  scale = 0.94,
  seed = 0,
  ambient = false,
}) {
  const g = useRef();
  const m = useRef();
  const born = useRef(ambient ? -99 : clock.t);
  useFrame(() => {
    if (!g.current || !m.current) return;
    const t = clock.t;
    let px = x;
    let pz = z;
    if (ambient) {
      px += Math.sin(t * 0.13 + seed) * 0.9;
      pz += Math.cos(t * 0.11 + seed * 1.7) * 0.7;
    } else {
      px += Math.sin(t * 0.5 + seed) * 0.015;
      pz += Math.cos(t * 0.43 + seed) * 0.015;
    }
    const wy = waveHeight(px, pz, t);
    const [gx, gz] = waveGrad(px, pz, t);
    const age = t - born.current;
    const dip = age < 2.5 ? -0.26 * Math.exp(-age * 3.0) * Math.sin(age * 7.5) : 0;
    g.current.position.set(px, wy, pz);
    m.current.position.y = 0.1 + dip + Math.sin(t * 1.3 + seed) * 0.012;
    m.current.rotation.set(-gz * 0.9, rotY + (ambient ? t * 0.05 + seed : 0), gx * 0.9);
  });
  return (
    <group ref={g} position={[x, 0, z]}>
      <mesh ref={m} geometry={geo} material={mats} scale={scale} castShadow receiveShadow />
      <mesh geometry={assets.foamGeo} material={assets.foamMat} position={[0, 0.04, 0]} scale={[scale / 0.94, 1, scale / 0.94]} renderOrder={2} />
      <mesh geometry={assets.foamGeo} material={assets.glowRingMat} position={[0, 0.05, 0]} scale={[1.15, 1, 1.15]} renderOrder={2} />
    </group>
  );
}

const AMBIENT = [
  [-3, 4.2],
  [2.4, -4.4],
  [6.5, 3.6],
  [10, -3.8],
  [13.5, 5.2],
  [-1.2, -4.6],
  [8.2, 6.4],
  [16, -5.6],
];

/** The stone carried by a Vanara, thrown and splashed into place. */
function Builder({ job, assets, fxRef, trackRef, isPlaced, onLand, onDone }) {
  const root = useRef();
  const fly = useRef();
  const anim = useRef({ phase: 0, move: 1, carrying: true, cheer: false, squat: 0, seed: 0 });
  const clk = useRef(-job.delay);
  const st = useRef({ landed: false, done: false, released: false });
  const placedRef = useRef(false);
  placedRef.current = isPlaced;

  const slot = useMemo(() => slotPosition(job.slot), [job.slot]);
  const geo = assets.geos[job.slot % assets.geos.length];
  const mats = assets.mats[job.variant];
  const startX = -12.2;
  const standX = slot.x - 1.6;
  const z = slot.z;
  const runT = Math.max(1, standX - startX) / 8.0;
  const returnT = Math.max(1, standX - startX) / 9.0;
  const WINDUP = 0.28;
  const FLIGHT = 0.72;
  const ground = (x) => Math.max(terrainHeight(x, z), 0.4);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const r = root.current;
    const f = fly.current;
    if (!r || !f) return;
    clk.current += dt;
    const t = clk.current;
    const a = anim.current;
    const s = st.current;
    if (t < 0) {
      r.visible = false;
      f.visible = false;
      return;
    }
    r.visible = true;

    let x = startX;
    if (t < runT) {
      const u = t / runT;
      x = lerp(startX, standX, u);
      a.move = 1;
      a.carrying = true;
      a.squat = 0;
      a.phase += dt * 15;
      r.rotation.y = Math.PI / 2;
      r.position.set(x, ground(x) + Math.abs(Math.sin(t * 14)) * 0.07, z);
      f.visible = false;
    } else if (t < runT + WINDUP) {
      x = standX;
      a.move = 0;
      a.carrying = true;
      a.squat = (t - runT) / WINDUP;
      r.position.set(x, ground(x), z);
      f.visible = false;
    } else {
      const tt = t - runT - WINDUP;
      a.carrying = false;
      const hy = ground(standX) + 2.45;
      const wy = waveHeight(slot.x, slot.z, clock.t) + 0.1;
      if (tt < FLIGHT) {
        const u = easeInOut(tt / FLIGHT);
        const lin = tt / FLIGHT;
        f.visible = true;
        f.position.set(
          lerp(standX + 0.15, slot.x, lin),
          lerp(hy, wy, u) + Math.sin(Math.PI * lin) * 0.9,
          z
        );
        f.rotation.set(0, lerp(0.9, slot.rotY, lin), Math.sin(lin * Math.PI) * 0.25);
        f.scale.setScalar(lerp(0.7, 0.94, lin));
      } else {
        f.position.set(slot.x, wy, slot.z);
        f.rotation.set(0, slot.rotY, 0);
        f.scale.setScalar(0.94);
        if (!s.landed) {
          s.landed = true;
          fxRef.current?.splash(slot.x, slot.z, 1);
          fxRef.current?.glyph(slot.x, slot.z);
          onLand(job);
        }
        f.visible = !placedRef.current;
      }
      const back = tt - 0.45;
      if (back < 0) {
        a.move = 0;
        a.squat = Math.max(0, 1 - tt / 0.45);
        r.position.set(standX, ground(standX), z);
      } else {
        const u = clamp(back / returnT, 0, 1);
        x = lerp(standX, startX, u);
        a.squat = 0;
        a.move = 1;
        a.phase += dt * 16;
        r.rotation.y = -Math.PI / 2;
        r.position.set(x, ground(x) + Math.abs(Math.sin(t * 14)) * 0.07, z);
        if (u >= 1 && !s.done) {
          s.done = true;
          onDone(job.id);
        }
      }
    }
    trackRef.current.pos.copy(r.position);
    trackRef.current.t = clock.t;
  });

  return (
    <>
      <Vanara
        ref={root}
        kit={assets.kit}
        anim={anim}
        fur={job.slot}
        stoneGeo={geo}
        stoneMats={mats}
      />
      <mesh ref={fly} geometry={geo} material={mats} visible={false} castShadow />
    </>
  );
}

/** The first stone: lifts from the altar and is offered to the sea. */
function Hero({ stage, assets, heroMats, fxRef, heroPos, onLand, onDone }) {
  const mesh = useRef();
  const glow = useRef();
  const tRef = useRef(0);
  const st = useRef({ landed: false, done: false });
  const slot0 = useMemo(() => slotPosition(0), []);
  const mats = heroMats || assets.blankMats;

  useEffect(() => {
    if (stage === "intro" || stage === "writing") {
      tRef.current = 0;
      st.current = { landed: false, done: false };
      if (mesh.current) mesh.current.visible = true;
    }
  }, [stage]);

  useFrame((_, raw) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(raw, 0.05);
    const running = stage === "firstStone";
    if (running) tRef.current += dt;
    const t = tRef.current;
    const A = HERO_REST;
    let x = A.x;
    let y = A.y + Math.sin(clock.t * 1.4) * 0.015;
    let z = A.z;
    let rx = 0.95;
    let ry = 0.1;
    let glowAmt = stage === "writing" ? 0.35 + Math.sin(clock.t * 2.2) * 0.15 : 0.18;

    if (running) {
      if (t >= 2.6 && t < 3.5) {
        const u = easeInOut((t - 2.6) / 0.9);
        y = A.y + u * 1.5;
        rx = lerp(0.95, 0, u);
        ry = 0.1 + u * 1.2;
        glowAmt = 0.4 + u * 0.6;
      } else if (t >= 3.5) {
        const u = clamp((t - 3.5) / 1.6, 0, 1);
        const e = easeInOut(u);
        const wy = waveHeight(slot0.x, slot0.z, clock.t) + 0.1;
        x = lerp(A.x, slot0.x, e);
        z = lerp(A.z, slot0.z, e);
        y = lerp(A.y + 1.5, wy, e) + Math.sin(Math.PI * u) * 1.1;
        rx = 0;
        ry = lerp(1.3, slot0.rotY, e);
        glowAmt = 1;
      }
      if (t >= 5.1 && !st.current.landed) {
        st.current.landed = true;
        m.visible = false;
        fxRef.current?.splash(slot0.x, slot0.z, 1.5);
        fxRef.current?.glyph(slot0.x, slot0.z);
        onLand();
      }
      if (t >= 8.6 && !st.current.done) {
        st.current.done = true;
        onDone();
      }
    }
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    heroPos.current.set(x, y, z);
    if (glow.current) {
      glow.current.visible = m.visible && glowAmt > 0.01;
      glow.current.position.set(x, y + 0.1, z);
      const s = 2.6 + Math.sin(clock.t * 4) * 0.25 + glowAmt * 1.4;
      glow.current.scale.set(s, s, 1);
      glow.current.material.opacity = glowAmt * 0.8;
    }
  });

  return (
    <>
      <mesh ref={mesh} geometry={assets.geos[0]} material={mats} scale={0.98} castShadow receiveShadow />
      <sprite ref={glow}>
        <spriteMaterial
          map={assets.glowTex}
          color="#ffc766"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </>
  );
}

/* ================================================================== */
/*  EFFECTS                                                            */
/* ================================================================== */

const Effects = forwardRef(function Effects({ assets, shakeRef }, ref) {
  const RINGS = 12;
  const PARTS = 140;
  const GLYPHS = 5;

  const ringMats = useMemo(
    () =>
      Array.from(
        { length: RINGS },
        () =>
          new THREE.MeshBasicMaterial({
            map: assets.foamTex,
            transparent: true,
            depthWrite: false,
            opacity: 0,
            polygonOffset: true,
            polygonOffsetFactor: -2,
          })
      ),
    [assets]
  );
  const glyphMats = useMemo(
    () =>
      Array.from(
        { length: GLYPHS },
        () =>
          new THREE.SpriteMaterial({
            map: assets.glyphTex,
            transparent: true,
            depthWrite: false,
            opacity: 0,
            toneMapped: false,
          })
      ),
    [assets]
  );
  useEffect(
    () => () => {
      ringMats.forEach((m) => m.dispose());
      glyphMats.forEach((m) => m.dispose());
    },
    [ringMats, glyphMats]
  );

  const rings = useRef(
    Array.from({ length: RINGS }, () => ({ t0: -99, x: 0, z: 0, mx: 1, mesh: null }))
  );
  const parts = useRef(
    Array.from({ length: PARTS }, () => ({
      life: 1, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 1,
    }))
  );
  const glyphs = useRef(
    Array.from({ length: GLYPHS }, () => ({ t0: -99, x: 0, z: 0, sprite: null }))
  );
  const idx = useRef({ ring: 0, part: 0, glyph: 0 });
  const inst = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useImperativeHandle(
    ref,
    () => ({
      splash(x, z, power = 1) {
        const t = clock.t;
        for (let k = 0; k < 2; k++) {
          const r = rings.current[idx.current.ring++ % RINGS];
          r.t0 = t + k * 0.18;
          r.x = x;
          r.z = z;
          r.mx = 1 + power * 0.5 - k * 0.25;
        }
        const n = Math.floor(18 * power);
        for (let i = 0; i < n; i++) {
          const p = parts.current[idx.current.part++ % PARTS];
          const a = Math.random() * Math.PI * 2;
          const sp = 0.8 + Math.random() * 1.9;
          p.x = x + Math.cos(a) * 0.3;
          p.z = z + Math.sin(a) * 0.3;
          p.y = waveHeight(x, z, t) + 0.1;
          p.vx = Math.cos(a) * sp;
          p.vz = Math.sin(a) * sp;
          p.vy = 3 + Math.random() * 3.4 * power;
          p.life = 0;
          p.max = 0.8 + Math.random() * 0.7;
          p.s = 0.6 + Math.random() * 0.8;
        }
        shakeRef.current = Math.max(shakeRef.current, 0.1 * power);
      },
      glyph(x, z) {
        const g = glyphs.current[idx.current.glyph++ % GLYPHS];
        g.t0 = clock.t;
        g.x = x;
        g.z = z;
      },
    }),
    [shakeRef]
  );

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const t = clock.t;

    rings.current.forEach((r, i) => {
      const m = r.mesh;
      if (!m) return;
      const age = t - r.t0;
      if (age < 0 || age > 2.2) {
        m.visible = false;
        return;
      }
      m.visible = true;
      const s = 0.7 + age * 3.0 * r.mx;
      m.scale.set(s, 1, s);
      m.position.set(r.x, waveHeight(r.x, r.z, t) + 0.05, r.z);
      ringMats[i].opacity = (1 - age / 2.2) * 0.7;
    });

    const im = inst.current;
    if (im) {
      parts.current.forEach((p, i) => {
        if (p.life >= p.max) {
          dummy.scale.setScalar(0);
        } else {
          p.life += dt;
          p.vy -= 11 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          if (p.y < waveHeight(p.x, p.z, t) && p.vy < 0) p.life = p.max;
          dummy.position.set(p.x, p.y, p.z);
          dummy.scale.setScalar(p.s * Math.max(0, 1 - p.life / p.max));
        }
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
    }

    glyphs.current.forEach((g, i) => {
      const s = g.sprite;
      if (!s) return;
      const age = t - g.t0;
      if (age < 0 || age > 2.4) {
        s.visible = false;
        return;
      }
      s.visible = true;
      s.position.set(g.x, 1.0 + age * 0.7, g.z);
      const sc = 1.3 + age * 0.2;
      s.scale.set(sc, sc, 1);
      glyphMats[i].opacity = Math.pow(Math.sin((Math.PI * age) / 2.4), 0.8) * 0.95;
    });
  });

  return (
    <>
      {ringMats.map((mat, i) => (
        <mesh
          key={`r${i}`}
          ref={(el) => (rings.current[i].mesh = el)}
          geometry={assets.ringGeo}
          material={mat}
          visible={false}
          renderOrder={3}
        />
      ))}
      <instancedMesh ref={inst} args={[undefined, undefined, PARTS]} frustumCulled={false}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshBasicMaterial color="#f2fcff" transparent opacity={0.85} />
      </instancedMesh>
      {glyphMats.map((mat, i) => (
        <sprite
          key={`g${i}`}
          ref={(el) => (glyphs.current[i].sprite = el)}
          material={mat}
          visible={false}
        />
      ))}
    </>
  );
});

/** Golden motes drifting up from the work. */
function Sparks({ assets }) {
  const N = 420;
  const data = useMemo(() => {
    const r = mulberry32(77);
    return {
      pos: new Float32Array(N * 3).map((_, i) => {
        const k = i % 3;
        return k === 0 ? -16 + r() * 44 : k === 1 ? 0.2 + r() * 8 : -11 + r() * 22;
      }),
      speed: Float32Array.from({ length: N }, () => 0.15 + r() * 0.5),
      phase: Float32Array.from({ length: N }, () => r() * 6.28),
    };
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.pos, 3));
    return g;
  }, [data]);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const p = data.pos;
    for (let i = 0; i < N; i++) {
      p[i * 3 + 1] += data.speed[i] * dt;
      p[i * 3] += Math.sin(clock.t * 0.6 + data.phase[i]) * 0.12 * dt;
      if (p[i * 3 + 1] > 9) p[i * 3 + 1] = 0.2;
    }
    geo.attributes.position.needsUpdate = true;
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        map={assets.sparkTex}
        size={0.16}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#ffd48a"
        opacity={0.85}
        fog={false}
      />
    </points>
  );
}

/* ================================================================== */
/*  CAMERA                                                             */
/* ================================================================== */

function CameraRig({ stage, shotRef, endXRef, trackRef, heroPos, shakeRef }) {
  const { camera } = useThree();
  const stageT = useRef(0);
  const pos = useRef(camera.position.clone());
  const look = useRef(new THREE.Vector3(8, 3.2, -1.5));
  const P = useRef(new THREE.Vector3());
  const L = useRef(new THREE.Vector3());
  const off = useRef(new THREE.Vector3());
  const slot0 = useMemo(() => slotPosition(0), []);

  useEffect(() => {
    stageT.current = 0;
  }, [stage]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    stageT.current += dt;
    const t = stageT.current;
    const p = P.current;
    const l = L.current;
    let kp = 1.4;
    let kl = 1.8;
    let fov = 48;
    const A = HERO_REST;

    if (stage === "intro") {
      p.set(-23 + Math.sin(t * 0.11) * 3.2, 3.8 + Math.sin(t * 0.17) * 0.6, 8.5 + Math.cos(t * 0.09) * 2.5);
      l.set(8, 3.2 + Math.sin(t * 0.13) * 0.3, -1.5);
      kp = 1.0;
    } else if (stage === "writing") {
      p.set(-12.5 + Math.sin(t * 0.2) * 0.4, 2.7, 9.5);
      l.set(-7.5, 0.9, -0.5);
      fov = 46;
    } else if (stage === "firstStone") {
      if (t < 2.6) {
        p.set(-10.4 + t * 0.08, 1.55, 2.9 - t * 0.1);
        l.set(A.x, A.y + 0.1, A.z);
        kp = 1.6;
        fov = 42;
      } else if (t < 5.1) {
        const h = heroPos.current;
        p.set(h.x - 3.4, h.y + 1.3, h.z + 3.1);
        l.copy(h);
        kp = 2.4;
        kl = 4;
        fov = 46;
      } else {
        const a = (t - 5.1) * 0.12;
        p.set(-4.4 + Math.sin(a) * 0.6, 0.65, 2.7 + Math.cos(a) * 0.3);
        l.set(slot0.x, 0.5, slot0.z);
        kp = 2.2;
        fov = 54;
      }
    } else if (stage === "building") {
      const endX = endXRef.current;
      const tr = trackRef.current;
      let shot = shotRef.current;
      if (shot === 3 && clock.t - tr.t > 0.4) shot = 0;
      switch (shot) {
        case 1:
          p.set(-12.8, 2.4, 1.2 + Math.sin(t * 0.3) * 0.4);
          l.set(endX + 16, 1.4, -0.6);
          fov = 50;
          break;
        case 2:
          p.set(endX - 3.6, 0.65, 3.8);
          l.set(endX + 0.8, 0.5, -0.1);
          fov = 54;
          break;
        case 3:
          p.set(tr.pos.x - 3.4, tr.pos.y + 1.9, tr.pos.z + 4.6);
          l.set(tr.pos.x + 1.8, tr.pos.y + 0.9, tr.pos.z);
          kp = 3;
          kl = 4;
          fov = 50;
          break;
        case 4:
          p.set(endX - 1.5, 15, 6.5);
          l.set(endX + 1.5, 0, -0.2);
          fov = 46;
          break;
        case 5:
          p.set(endX + 8.5, 1.7, 5.2);
          l.set(endX - 3.5, 1.0, -0.4);
          fov = 50;
          break;
        default:
          p.set(endX - 7.5, 3.6 + Math.sin(t * 0.3) * 0.2, 10.5);
          l.set(endX + 2.0, 0.5, -0.3);
          fov = 46;
      }
    } else {
      const endX = endXRef.current;
      p.set(endX - 10 + t * 0.7, 4 + Math.min(t * 1.0, 14), 13 + t * 0.4);
      l.set(endX + 14, 0.8, -1);
      kp = 0.8;
      kl = 1.2;
      fov = 46;
    }

    pos.current.lerp(p, 1 - Math.exp(-kp * dt));
    look.current.lerp(l, 1 - Math.exp(-kl * dt));

    const s = shakeRef.current;
    off.current.set(0, 0, 0);
    if (s > 0.002) off.current.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    shakeRef.current *= Math.exp(-dt * 6);
    const sway = 0.04;
    camera.position
      .copy(pos.current)
      .add(off.current)
      .add(new THREE.Vector3(Math.sin(clock.t * 0.6) * sway, Math.sin(clock.t * 0.8) * sway, 0));
    camera.lookAt(look.current);
    const nf = camera.fov + (fov - camera.fov) * (1 - Math.exp(-2 * dt));
    if (Math.abs(nf - camera.fov) > 0.001) {
      camera.fov = nf;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/* ================================================================== */
/*  SCENE                                                              */
/* ================================================================== */

export default function RamSetuScene({
  assets,
  heroMats,
  stage,
  placed,
  jobs,
  shot,
  onHeroLand,
  onHeroDone,
  onLand,
  onJobDone,
}) {
  const fxRef = useRef();
  const shakeRef = useRef(0);
  const trackRef = useRef({ pos: new THREE.Vector3(), t: -99 });
  const heroPos = useRef(new THREE.Vector3());
  const shotRef = useRef(0);
  const endXRef = useRef(0);

  shotRef.current = shot;
  const endSlot = placed.reduce((m, p) => Math.max(m, p.slot), 0);
  endXRef.current = slotPosition(endSlot).x;
  const placedIds = useMemo(() => new Set(placed.map((p) => p.id)), [placed]);

  const showHero = stage === "intro" || stage === "writing" || stage === "firstStone";

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 48, near: 0.1, far: 900, position: [-23, 3.8, 8.5] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#d79a78");
        gl.toneMappingExposure = 1.05;
      }}
    >
      <ClockTick />
      <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />

      <Sky />
      <Ocean />
      <Terrain />
      <River />
      <Lanka assets={assets} />
      <Lights />

      <Palms />
      <Rocks />
      <Altar />
      <Flag x={-15.5} z={-6.5} assets={assets} />
      <Flag x={-15.2} z={7.8} assets={assets} />
      <StonePile assets={assets} />
      <RiverStones assets={assets} />

      {WALKERS.map((w, i) => (
        <Walker key={`w${i}`} cfg={w} assets={assets} stoneMats={assets.mats[i % 4]} />
      ))}
      {CHEERERS.map((c, i) => (
        <Cheerer key={`c${i}`} cfg={c} assets={assets} />
      ))}

      {showHero && (
        <Hero
          stage={stage}
          assets={assets}
          heroMats={heroMats}
          fxRef={fxRef}
          heroPos={heroPos}
          onLand={onHeroLand}
          onDone={onHeroDone}
        />
      )}

      {jobs.map((job) => (
        <Builder
          key={job.id}
          job={job}
          assets={assets}
          fxRef={fxRef}
          trackRef={trackRef}
          isPlaced={placedIds.has(job.id)}
          onLand={onLand}
          onDone={onJobDone}
        />
      ))}

      {placed.map((p) => {
        const s = slotPosition(p.slot);
        return (
          <FloatingStone
            key={p.id}
            assets={assets}
            geo={assets.geos[p.slot % assets.geos.length]}
            mats={p.variant === "hero" ? heroMats || assets.blankMats : assets.mats[p.variant]}
            x={s.x}
            z={s.z}
            rotY={s.rotY}
            seed={p.slot * 1.3}
          />
        );
      })}

      {AMBIENT.map(([x, z], i) => (
        <FloatingStone
          key={`a${i}`}
          assets={assets}
          geo={assets.geos[i % 3]}
          mats={assets.mats[(i + 1) % 4]}
          x={x}
          z={z}
          scale={0.7 + (i % 3) * 0.12}
          seed={i * 2.1}
          ambient
        />
      ))}

      <Effects ref={fxRef} assets={assets} shakeRef={shakeRef} />
      <Sparks assets={assets} />
      <CameraRig
        stage={stage}
        shotRef={shotRef}
        endXRef={endXRef}
        trackRef={trackRef}
        heroPos={heroPos}
        shakeRef={shakeRef}
      />
    </Canvas>
  );
}
