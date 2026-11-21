// Procedural characters: Luv, Kush (young princes of the hermitage) and Sage Valmiki.
import { PAL } from './tex.js';

const mat = (THREE, color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra });

function limb(THREE, len, r0, r1, m, cap = true) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 12, 1), m); mesh.position.y = -len / 2; mesh.castShadow = true; g.add(mesh);
  if (cap) { const j = new THREE.Mesh(new THREE.SphereGeometry(r0, 12, 10), m); j.castShadow = true; g.add(j); }
  return g;
}

export function makeBrother(THREE, who, T) {
  const luv = who === 'luv';
  const skin = mat(THREE, luv ? '#b97b50' : '#b4744a', 0.62);
  const cloth = mat(THREE, '#f1e8d2', 0.95, { side: THREE.DoubleSide });
  const border = mat(THREE, luv ? PAL.saffron : PAL.forest, 0.8);
  const sash = mat(THREE, luv ? '#c4601d' : '#2a6a3a', 0.85, { side: THREE.DoubleSide });
  const gold = mat(THREE, '#cfa244', 0.35, { metalness: 0.75 });
  const hair = mat(THREE, '#1d130c', 0.55);
  const wood = mat(THREE, '#5b3d22', 0.8, { map: T.wood });
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const S = 1.0;
  // pelvis & legs
  const hips = new THREE.Group(); hips.position.y = 0.92; body.add(hips);
  const legs = [];
  for (const sx of [-1, 1]) {
    const thigh = limb(THREE, 0.46, 0.105, 0.085, skin); thigh.position.set(sx * 0.13, 0, 0); hips.add(thigh);
    const shin = limb(THREE, 0.46, 0.08, 0.06, skin); shin.position.y = -0.46; thigh.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.22), mat(THREE, '#3a2a1c', 0.9)); foot.position.set(0, -0.48, 0.05); foot.castShadow = true; shin.add(foot);
    legs.push({ thigh, shin });
  }
  // dhoti (wrap skirt with gold-edged border)
  const dh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.62, 18, 1, true), cloth); dh.position.y = -0.18; dh.castShadow = true; hips.add(dh);
  const dhb = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.345, 0.07, 18, 1, true), border); dhb.position.y = -0.46; hips.add(dhb);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.022, 8, 20), gold); belt.rotation.x = Math.PI / 2; belt.position.y = 0.12; hips.add(belt);
  const fold = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.5, 8, 1, true), cloth); fold.position.set(0.02, -0.14, 0.2); fold.rotation.x = 0.12; hips.add(fold);
  // torso
  const torso = new THREE.Group(); torso.position.y = 0.12; hips.add(torso);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.2, 0.56, 16), skin); chest.position.y = 0.3; chest.scale.z = 0.72; chest.castShadow = true; torso.add(chest);
  const pec = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), skin); pec.position.set(0, 0.46, 0.02); pec.scale.set(1.05, 0.5, 0.6); torso.add(pec);
  // sacred thread / sash across the chest
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, 0.62, 0.05), new THREE.Vector3(-0.05, 0.4, 0.16), new THREE.Vector3(0.1, 0.2, 0.17), new THREE.Vector3(0.2, 0.02, 0.1)]);
  const sashM = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.045, 6, false), sash); sashM.castShadow = true; torso.add(sashM);
  const curve2 = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, 0.62, -0.05), new THREE.Vector3(-0.08, 0.4, -0.17), new THREE.Vector3(0.1, 0.2, -0.16), new THREE.Vector3(0.2, 0.02, -0.1)]);
  torso.add(new THREE.Mesh(new THREE.TubeGeometry(curve2, 16, 0.04, 6, false), sash));
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), mat(THREE, '#5a3a1e', 0.6)); b.position.set(Math.cos(a) * 0.09, 0.56 - Math.abs(Math.sin(a)) * 0.0 - 0.12 * Math.max(0, Math.sin(a)), 0.2 + Math.sin(a) * 0.04); torso.add(b); }
  // neck + head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 10), skin); neck.position.y = 0.66; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.78; torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.135, 20, 16), skin); skull.scale.set(0.95, 1.1, 1); skull.castShadow = true; head.add(skull);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), skin); jaw.position.set(0, -0.07, 0.025); jaw.scale.set(0.95, 0.85, 0.95); head.add(jaw);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), mat(THREE, '#120a06', 0.3)); eye.position.set(sx * 0.047, 0.015, 0.125); head.add(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.009, 0.01), hair); brow.position.set(sx * 0.047, 0.05, 0.13); brow.rotation.z = -sx * 0.1; head.add(brow);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), skin); ear.position.set(sx * 0.13, 0, 0); ear.scale.set(0.5, 1, 0.8); head.add(ear);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 10), gold); ring.position.set(sx * 0.135, -0.04, 0); head.add(ring);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.045, 6), skin); nose.position.set(0, -0.015, 0.14); nose.rotation.x = Math.PI / 2 - 0.15; head.add(nose);
  const tilak = new THREE.Mesh(new THREE.CircleGeometry(0.01, 10), mat(THREE, PAL.vermilion, 0.5)); tilak.position.set(0, 0.07, 0.133); head.add(tilak);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.006, 0.005), mat(THREE, '#5a2a1c')); mouth.position.set(0, -0.07, 0.126); head.add(mouth);
  // hair: cap + topknot (jata), distinct per brother
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.142, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hair); cap.position.y = 0.01; cap.rotation.x = -0.25; cap.scale.set(1, 1.1, 1.04); head.add(cap);
  const back = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), hair); back.position.set(0, -0.01, -0.04); back.scale.set(1, 1.1, 0.9); head.add(back);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), hair); knot.position.set(luv ? 0.03 : -0.03, 0.17, -0.02); knot.scale.set(1, 1.15, 1); head.add(knot);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 20), luv ? mat(THREE, PAL.saffron) : mat(THREE, PAL.forest)); band.rotation.x = Math.PI / 2 - 0.2; band.position.set(0, 0.08, 0.0); head.add(band);
  // arms
  const arms = [];
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.3, 0.57, 0); torso.add(sh);
    const upper = limb(THREE, 0.3, 0.07, 0.058, skin); sh.add(upper);
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.016, 8, 14), gold); arm.position.y = -0.1; arm.rotation.x = Math.PI / 2; upper.add(arm);
    const fore = limb(THREE, 0.28, 0.056, 0.042, skin); fore.position.y = -0.3; upper.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), skin); hand.position.y = -0.3; hand.scale.set(0.85, 1.1, 0.7); fore.add(hand);
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.05, 10), gold); brace.position.y = -0.22; fore.add(brace);
    arms.push({ sh, upper, fore, hand });
  }
  // quiver on the back with feathered arrows
  const quiver = new THREE.Group(); quiver.position.set(-0.04, 0.38, -0.2); quiver.rotation.z = 0.25; torso.add(quiver);
  const qb = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.55, 12), mat(THREE, '#6b4426', 0.75, { map: T.wood })); qb.castShadow = true; quiver.add(qb);
  const qr = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.01, 6, 14), gold); qr.rotation.x = Math.PI / 2; qr.position.y = 0.2; quiver.add(qr);
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 5), wood); f.position.set(Math.cos(i) * 0.03, 0.36, Math.sin(i) * 0.03); quiver.add(f);
    const fe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.004), mat(THREE, i % 2 ? '#e9e1cc' : '#a3282a', 0.9)); fe.position.set(Math.cos(i) * 0.03, 0.47, Math.sin(i) * 0.03); quiver.add(fe);
  }
  const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.18, 0.62, 0.1), new THREE.Vector3(0.0, 0.42, 0.19), new THREE.Vector3(-0.2, 0.16, 0.12)]), 10, 0.016, 5), mat(THREE, '#3a2514', 0.9));
  torso.add(strap);
  // BOW: limbs along +Y, belly toward +Z (target), string behind. Grip sits at the local origin.
  const bow = new THREE.Group();
  const bowPts = []; for (let i = -10; i <= 10; i++) { const u = i / 10; bowPts.push(new THREE.Vector3(0, u * 0.78, -0.22 * (1 - u * u))); }
  const bowArc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bowPts), 32, 0.017, 6, false), mat(THREE, '#4a2c14', 0.55, { map: T.wood })); bowArc.position.z = 0.22; bowArc.castShadow = true; bow.add(bowArc);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 8), mat(THREE, '#7a1f22', 0.7)); bow.add(grip);
  const gt = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.007, 6, 10), gold); gt.rotation.x = Math.PI / 2; bow.add(gt);
  for (const sy of [-1, 1]) { const tip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), gold); tip.position.set(0, sy * 0.78, 0); bow.add(tip); }
  const stringMat = new THREE.LineBasicMaterial({ color: 0xf2ead2 });
  const sg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.78, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.78, 0)]);
  const string = new THREE.Line(sg, stringMat); bow.add(string);
  bow.visible = false;
  const nock = new THREE.Group(); nock.visible = false; bow.add(nock);
  const arrow = makeArrow(THREE, T); arrow.position.z = 0.43; nock.add(arrow);

  root.userData = {
    who, body, hips, torso, head, legs, arms, bow, string, stringGeo: sg, nock, quiver, S,
    handL: arms[0].hand, skin,
  };
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return root;
}

export function makeArrow(THREE, T) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1.05, 6), new THREE.MeshStandardMaterial({ color: '#8a6238', roughness: 0.6 }));
  shaft.rotation.x = Math.PI / 2; g.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 6), new THREE.MeshStandardMaterial({ color: '#c8cdd2', metalness: 0.85, roughness: 0.3 }));
  head.rotation.x = Math.PI / 2; head.position.z = 0.58; g.add(head);
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.2), new THREE.MeshStandardMaterial({ color: i === 0 ? '#a3282a' : '#efe7d0', side: THREE.DoubleSide, roughness: 0.9 }));
    f.position.z = -0.43; f.rotation.z = i * Math.PI * 2 / 3; f.position.x = 0; f.rotation.y = Math.PI / 2; f.position.y = 0; g.add(f);
    f.rotation.set(0, Math.PI / 2, i * Math.PI * 2 / 3); f.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), 0);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

/** Animate a brother. st: {moving, walk, pushing, aiming, draw, jy, face, t, idleAnim:'calm'|'eager'} */
export function poseBrother(root, st) {
  const u = root.userData, t = st.t, m = st.moving || 0, w = st.walk || 0;
  const sw = Math.sin(w * 3.1) * m;
  u.legs[0].thigh.rotation.x = sw * 0.75; u.legs[1].thigh.rotation.x = -sw * 0.75;
  u.legs[0].shin.rotation.x = Math.max(0, -sw) * 0.9; u.legs[1].shin.rotation.x = Math.max(0, sw) * 0.9;
  const bob = Math.abs(Math.cos(w * 3.1)) * 0.045 * m;
  const breathe = Math.sin(t * 1.7) * 0.008;
  u.body.position.y = bob + (st.jy || 0) + breathe;
  u.hips.rotation.y = sw * 0.12; u.torso.rotation.y = -sw * 0.16;
  u.torso.rotation.x = st.pushing ? 0.34 : 0.04 * m;
  let l = u.arms[0], r = u.arms[1];
  l.upper.rotation.set(-sw * 0.6, 0, 0.06); r.upper.rotation.set(sw * 0.6, 0, -0.06);
  l.fore.rotation.set(-0.12 - Math.max(0, sw) * 0.4, 0, 0); r.fore.rotation.set(-0.12 - Math.max(0, -sw) * 0.4, 0, 0);
  if (st.idleAnim === 'eager' && m < 0.1 && !st.aiming) { // Kush bounces on his toes, impatient
    u.body.position.y += Math.abs(Math.sin(t * 5)) * 0.03; r.upper.rotation.set(-0.3 + Math.sin(t * 5) * 0.1, 0, -0.2);
  }
  if (st.idleAnim === 'calm' && m < 0.1 && !st.aiming) { // Luv stands composed, hands together
    l.upper.rotation.set(-0.5, 0, -0.18); r.upper.rotation.set(-0.5, 0, 0.18); l.fore.rotation.set(-1.0, 0.5, 0); r.fore.rotation.set(-1.0, -0.5, 0);
  }
  if (st.pushing) { l.upper.rotation.set(-1.25, 0, 0.2); r.upper.rotation.set(-1.25, 0, -0.2); l.fore.rotation.set(-0.2, 0, 0); r.fore.rotation.set(-0.2, 0, 0); }
  // archery stance: bow arm (arms[0]) points down-range, drawing arm folds the string back
  u.bow.visible = !!st.aiming || !!st.bowOut;
  u.nock.visible = !!st.aiming;
  if (st.aiming) {
    const d = st.draw || 0, ap = st.aimPitch || 0, hand = u.arms[0].hand;
    u.torso.rotation.set(0, 0.22, 0); u.hips.rotation.y = 0;
    l.upper.rotation.set(-1.5 + ap, 0, 0.05); l.fore.rotation.set(-0.04, 0, 0);
    r.upper.rotation.set(-1.4 + ap * 0.5, 0, -0.95); r.fore.rotation.set(-0.35 - d * 1.5, 0, 0);
    u.legs[0].thigh.rotation.set(0, 0, 0.1); u.legs[1].thigh.rotation.set(0, 0, -0.1); u.legs[0].shin.rotation.set(0, 0, 0); u.legs[1].shin.rotation.set(0, 0, 0);
    u.head.rotation.set(-ap * 0.5, -0.2, 0);
    if (u.bow.parent !== hand) { hand.add(u.bow); u.bow.position.set(0, 0, 0); u.bow.rotation.set(Math.PI / 2, 0, 0); }
    const pull = d * 0.48, p = u.stringGeo.attributes.position; p.setXYZ(1, 0, 0, -0.22 - pull); p.needsUpdate = true;
    u.nock.position.set(0, 0, -0.22 - pull); u.nock.visible = st.hasArrow !== false;
  } else {
    u.head.rotation.set(st.look || 0, 0, 0);
    if (u.bow.parent !== u.torso) { u.torso.add(u.bow); u.bow.position.set(-0.05, 0.4, -0.22); u.bow.rotation.set(0.1, 0.2, 0.9); }
    const p = u.stringGeo.attributes.position; p.setXYZ(1, 0, 0, 0); p.needsUpdate = true;
  }
}

export function makeValmiki(THREE, T) {
  const root = new THREE.Group();
  const skin = mat(THREE, '#a8693f', 0.65), robe = mat(THREE, '#e9dcc0', 0.95, { side: THREE.DoubleSide }), saf = mat(THREE, '#cc7a24', 0.9, { side: THREE.DoubleSide });
  const white = mat(THREE, '#f4f1ea', 0.9), gold = mat(THREE, '#cfa244', 0.35, { metalness: 0.7 });
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.46, 1.25, 20, 1, true), robe); lower.position.y = 0.64; root.add(lower);
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.455, 0.465, 0.06, 20, 1, true), saf); hem.position.y = 0.04; root.add(hem);
  const torso = new THREE.Group(); torso.position.y = 1.25; root.add(torso);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.55, 16), skin); chest.position.y = 0.26; chest.scale.z = 0.75; torso.add(chest);
  const shawl = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.25, 0.4, 16, 1, true, 0, Math.PI * 1.35), saf); shawl.position.y = 0.34; shawl.rotation.y = 2.2; shawl.scale.z = 0.85; torso.add(shawl);
  const head = new THREE.Group(); head.position.y = 0.72; torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 16), skin); skull.scale.set(0.95, 1.12, 1); head.add(skull);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), mat(THREE, '#120a06')); e.position.set(sx * 0.048, 0.02, 0.128); head.add(e); const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.012), white); b.position.set(sx * 0.05, 0.058, 0.13); b.rotation.z = -sx * 0.12; head.add(b); }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 6), skin); nose.position.set(0, -0.015, 0.14); nose.rotation.x = Math.PI / 2 - 0.2; head.add(nose);
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.52, 14), white); beard.position.set(0, -0.3, 0.07); beard.rotation.x = 0.1; beard.scale.z = 0.7; head.add(beard);
  const must = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), white); must.position.set(0, -0.06, 0.12); must.scale.set(1.5, 0.45, 0.6); head.add(must);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.75), white); hairBack.position.set(0, 0.0, -0.025); hairBack.scale.set(1, 1.1, 1.05); head.add(hairBack);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), white); knot.position.set(0, 0.2, -0.02); head.add(knot);
  const rud = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 20), mat(THREE, '#5a3a1e')); rud.rotation.x = Math.PI / 2 - 0.2; rud.position.y = 0.075; head.add(rud);
  const tilak = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.008, 0.006), mat(THREE, '#d8cdb0')); tilak.position.set(0, 0.095, 0.132); head.add(tilak);
  const arms = [];
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.31, 0.5, 0); torso.add(sh);
    const up = limb(THREE, 0.3, 0.07, 0.06, skin); sh.add(up); const fo = limb(THREE, 0.28, 0.058, 0.044, skin); fo.position.y = -0.3; up.add(fo);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), skin); hand.position.y = -0.3; fo.add(hand); arms.push({ sh, up, fo, hand });
  }
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), mat(THREE, '#4a2c16')); b.position.set(Math.cos(a) * 0.12, 0.6 - Math.max(0, Math.sin(a)) * 0.2, 0.19 + Math.sin(a) * 0.04); torso.add(b); }
  // staff held in the right hand
  const staff = new THREE.Group(); const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 2.1, 8), mat(THREE, '#6b4426', 0.8, { map: T.wood })); sm.position.y = 1.05; staff.add(sm);
  const sk = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 14), gold); sk.position.y = 2.1; staff.add(sk);
  staff.position.set(0.0, -0.58, 0.0); arms[1].fo.add(staff); staff.rotation.set(0.15, 0, 0);
  arms[0].up.rotation.set(-0.2, 0, 0.1); arms[1].up.rotation.set(-0.7, 0, -0.15); arms[1].fo.rotation.set(-0.7, 0, 0);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  root.userData = { torso, head, arms };
  return root;
}
export function poseValmiki(root, t, speaking) {
  const u = root.userData;
  u.torso.rotation.z = Math.sin(t * 0.7) * 0.01; u.head.rotation.y = Math.sin(t * 0.5) * 0.06; u.head.rotation.x = speaking ? Math.sin(t * 3.4) * 0.025 : 0;
  u.arms[0].up.rotation.x = -0.2 + (speaking ? Math.sin(t * 2.2) * 0.35 - 0.3 : 0); u.arms[0].fo.rotation.x = speaking ? -0.9 : -0.1;
}
