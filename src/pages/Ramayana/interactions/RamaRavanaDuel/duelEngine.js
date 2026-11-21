import * as THREE from "three";
/* eslint-disable */
export function startDuel(rootEl, OPTS = {}) {
  var Ia = Object.create;
  var {
    getPrototypeOf: Ca,
    defineProperty: Ve,
    getOwnPropertyNames: Ba,
  } = Object;
  var Fe = Object.prototype.hasOwnProperty;
  function Va(a) {
    return this[a];
  }
  var Fa,
    Wa,
    Bt = (a, t, o) => {
      var e = a != null && typeof a === "object";
      if (e) {
        var s = t ? (Fa ??= new WeakMap()) : (Wa ??= new WeakMap()),
          i = s.get(a);
        if (i) return i;
      }
      o = a != null ? Ia(Ca(a)) : {};
      let n =
        t || !a || !a.__esModule || !Fe.call(a, "default")
          ? Ve(o, "default", { value: a, enumerable: !0 })
          : o;
      if ((a && typeof a === "object") || typeof a === "function") {
        for (let r of Ba(a))
          if (!Fe.call(n, r)) Ve(n, r, { get: Va.bind(a, r), enumerable: !0 });
      }
      if (e) s.set(a, n);
      return n;
    };
  var Ua = (a, t) => () => (
    t || a((t = { exports: {} }).exports, t),
    t.exports
  );
  var Ct = Ua(function (bo, We) {
    We.exports = THREE;
  });
  var lt = Bt(Ct());
  var Y = Bt(Ct()),
    ot = (a, t, o) => Math.min(o, Math.max(t, a)),
    L = (a, t, o) => a + (t - a) * o,
    pt = (a) => ((a = ot(a, 0, 1)), a * a * (3 - 2 * a)),
    f0 = (a, t, o) => pt((o - a) / (t - a)),
    Et = (a, t, o, e) => a + (t - a) * (1 - Math.exp(-o * e)),
    A0 = (a) => {
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      return a;
    },
    G = (a = 0, t = 0, o = 0) => new Y.Vector3(a, t, o);
  function Lt(a = 1) {
    let t = a >>> 0;
    return () => {
      t = (t + 1831565813) >>> 0;
      let o = t;
      return (
        (o = Math.imul(o ^ (o >>> 15), o | 1)),
        (o ^= o + Math.imul(o ^ (o >>> 7), o | 61)),
        ((o ^ (o >>> 14)) >>> 0) / 4294967296
      );
    };
  }
  var E = (a = 1) => (Math.random() - 0.5) * 2 * a,
    x0 = new Y.Vector3(),
    z0 = new Y.Vector3(),
    S0 = new Y.Vector3(),
    Ue = new Y.Vector3(0, 1, 0),
    _a = new Y.Vector3(0, 0, 1);
  function xt(a, t = {}) {
    let o = t.radial || 18,
      e = t.pow || 2,
      s = a.length,
      i = t.cap !== !1,
      n = a.map((M) => new Y.Vector3(M.p[0], M.p[1], M.p[2])),
      r = [],
      l = [],
      c = [];
    for (let M = 0; M < s; M++) {
      S0.copy(n[Math.min(M + 1, s - 1)])
        .sub(n[Math.max(M - 1, 0)])
        .normalize();
      let z = Math.abs(S0.dot(Ue)) > 0.9 ? _a : Ue;
      (x0.crossVectors(z, S0).normalize(), z0.crossVectors(S0, x0).normalize());
      let w = a[M].rx,
        S = a[M].ry === void 0 ? a[M].rx : a[M].ry,
        P = a[M].ox || 0,
        W = a[M].oy || 0;
      for (let H = 0; H <= o; H++) {
        let K = (H / o) * Math.PI * 2,
          I = Math.cos(K),
          at = Math.sin(K),
          dt = Math.sign(I) * Math.pow(Math.abs(I), 2 / e),
          R = Math.sign(at) * Math.pow(Math.abs(at), 2 / e);
        (r.push(
          n[M].x + x0.x * (w * dt + P) + z0.x * (S * R + W),
          n[M].y + x0.y * (w * dt + P) + z0.y * (S * R + W),
          n[M].z + x0.z * (w * dt + P) + z0.z * (S * R + W),
        ),
          l.push(H / o, M / (s - 1)));
      }
    }
    let g = o + 1;
    for (let M = 0; M < s - 1; M++)
      for (let z = 0; z < o; z++) {
        let w = M * g + z,
          S = w + 1,
          P = w + g,
          W = P + 1;
        c.push(w, S, P, S, W, P);
      }
    if (i) {
      let M = r.length / 3;
      (r.push(n[0].x, n[0].y, n[0].z), l.push(0.5, 0));
      for (let z = 0; z < o; z++) c.push(M, z + 1, z);
      ((M = r.length / 3),
        r.push(n[s - 1].x, n[s - 1].y, n[s - 1].z),
        l.push(0.5, 1));
      for (let z = 0; z < o; z++)
        c.push(M, (s - 1) * g + z, (s - 1) * g + z + 1);
    }
    let v = new Y.BufferGeometry();
    (v.setAttribute("position", new Y.Float32BufferAttribute(r, 3)),
      v.setAttribute("uv", new Y.Float32BufferAttribute(l, 2)),
      v.setIndex(c),
      v.computeVertexNormals());
    let y = v.attributes.normal;
    for (let M = 0; M < s; M++) {
      let z = M * g,
        w = M * g + o,
        S = y.getX(z) + y.getX(w),
        P = y.getY(z) + y.getY(w),
        W = y.getZ(z) + y.getZ(w),
        H = Math.hypot(S, P, W) || 1;
      (y.setXYZ(z, S / H, P / H, W / H), y.setXYZ(w, S / H, P / H, W / H));
    }
    return v;
  }
  function Nt(a, t, o = 14, e = 14) {
    let s = [];
    for (let i = 0; i <= e; i++) {
      let n = i / e,
        r = 0;
      while (r < t.length - 2 && t[r + 1][0] < n) r++;
      let l = t[r],
        c = t[r + 1],
        g = pt((n - l[0]) / (c[0] - l[0] || 1));
      s.push({
        p: [0, -n * a, 0],
        rx: L(l[1], c[1], g),
        ry: L(l[2] === void 0 ? l[1] : l[2], c[2] === void 0 ? c[1] : c[2], g),
      });
    }
    return xt(s, { radial: o });
  }
  function Dt(a, t, o = t, e = 24, s = 8) {
    let i = new Y.CatmullRomCurve3(
        a.map((r) => new Y.Vector3(r[0], r[1], r[2])),
      ),
      n = [];
    for (let r = 0; r <= e; r++) {
      let l = r / e,
        c = i.getPoint(l);
      n.push({ p: [c.x, c.y, c.z], rx: L(t, o, l), ry: L(t, o, l) });
    }
    return xt(n, { radial: s });
  }
  function qa(a) {
    let t = 0,
      o = 0;
    for (let y of a)
      ((t += y.g.attributes.position.count),
        (o += y.g.index ? y.g.index.count : y.g.attributes.position.count));
    let e = new Float32Array(t * 3),
      s = new Float32Array(t * 3),
      i = new Float32Array(t * 2),
      n = t > 65535 ? new Uint32Array(o) : new Uint16Array(o),
      r = new Y.Vector3(),
      l = new Y.Matrix3(),
      c = 0,
      g = 0;
    for (let y of a) {
      let M = y.g,
        z = M.attributes.position,
        w = M.attributes.normal,
        S = M.attributes.uv;
      l.getNormalMatrix(y.m);
      for (let P = 0; P < z.count; P++) {
        if (
          (r.fromBufferAttribute(z, P).applyMatrix4(y.m),
          (e[(c + P) * 3] = r.x),
          (e[(c + P) * 3 + 1] = r.y),
          (e[(c + P) * 3 + 2] = r.z),
          w)
        )
          (r.fromBufferAttribute(w, P).applyMatrix3(l).normalize(),
            (s[(c + P) * 3] = r.x),
            (s[(c + P) * 3 + 1] = r.y),
            (s[(c + P) * 3 + 2] = r.z));
        if (S) ((i[(c + P) * 2] = S.getX(P)), (i[(c + P) * 2 + 1] = S.getY(P)));
      }
      if (M.index)
        for (let P = 0; P < M.index.count; P++) n[g++] = M.index.getX(P) + c;
      else for (let P = 0; P < z.count; P++) n[g++] = c + P;
      c += z.count;
    }
    let v = new Y.BufferGeometry();
    return (
      v.setAttribute("position", new Y.BufferAttribute(e, 3)),
      v.setAttribute("normal", new Y.BufferAttribute(s, 3)),
      v.setAttribute("uv", new Y.BufferAttribute(i, 2)),
      v.setIndex(new Y.BufferAttribute(n, 1)),
      v
    );
  }
  class tt {
    constructor() {
      this.map = new Map();
    }
    add(a, t) {
      a.updateMatrix();
      let o = t
        ? new Y.Matrix4().multiplyMatrices(t, a.matrix)
        : a.matrix.clone();
      if (a.isMesh) {
        let e = a.material;
        if (!this.map.has(e)) this.map.set(e, []);
        this.map.get(e).push({ g: a.geometry, m: o });
      }
      for (let e of a.children) this.add(e, o);
      return this;
    }
    flush(a, { cast: t = !0, receive: o = !1 } = {}) {
      for (let [e, s] of this.map) {
        let i = new Y.Mesh(qa(s), e);
        ((i.castShadow = t), (i.receiveShadow = o), a.add(i));
      }
      return (this.map.clear(), a);
    }
  }
  var _e = {},
    h0 = (a, t) => _e[a] || (_e[a] = t()),
    C = {
      sph: () => h0("sph", () => new Y.SphereGeometry(1, 28, 20)),
      cyl: () => h0("cyl", () => new Y.CylinderGeometry(1, 1, 1, 20, 1)),
      cylO: () => h0("cylO", () => new Y.CylinderGeometry(1, 1, 1, 24, 1, !0)),
      box: () => h0("box", () => new Y.BoxGeometry(1, 1, 1)),
      cone: () => h0("cone", () => new Y.ConeGeometry(1, 1, 18)),
      tor: (a, t, o = 32, e = Math.PI * 2) =>
        h0(`tor${a}_${t}_${o}_${e}`, () => new Y.TorusGeometry(a, t, 10, o, e)),
    };
  function b(a, t, o = {}) {
    let e = new Y.Mesh(a, t);
    if (o.p) e.position.set(o.p[0], o.p[1], o.p[2]);
    if (o.s) e.scale.set(o.s[0], o.s[1], o.s[2]);
    if (o.r) e.rotation.set(o.r[0], o.r[1], o.r[2]);
    return ((e.castShadow = !0), e);
  }
  var B = (a, t, o, e = [1, 1, 1]) =>
      b(C.sph(), a, { p: o, s: [t * e[0], t * e[1], t * e[2]] }),
    wt = (a, t, o, e, s = [0, 0, 0]) =>
      b(C.cyl(), a, { p: e, s: [t, o, t], r: s }),
    Z = (a, t, o, e, s = [0, 0, 0]) =>
      b(C.cone(), a, { p: e, s: [t, o, t], r: s }),
    gt = (a, t, o, e, s, i = [0, 0, 0]) =>
      b(C.box(), a, { p: s, s: [t, o, e], r: i }),
    ht = (a, t, o, e, s = [0, 0, 0], i = Math.PI * 2) =>
      b(C.tor(t, o, 32, i), a, { p: e, r: s }),
    H0 = new Y.Vector3(),
    Eo = new Y.Quaternion();
  function P0(a, t, o, e, s = e) {
    H0.set(o[0] - t[0], o[1] - t[1], o[2] - t[2]);
    let i = H0.length() || 0.0001;
    H0.divideScalar(i);
    let n = new Y.CylinderGeometry(s, e, i, 10, 1),
      r = new Y.Mesh(n, a);
    return (
      r.position.set((t[0] + o[0]) / 2, (t[1] + o[1]) / 2, (t[2] + o[2]) / 2),
      r.quaternion.setFromUnitVectors(new Y.Vector3(0, 1, 0), H0),
      (r.castShadow = !0),
      r
    );
  }
  var X = Bt(Ct()),
    La =
      "varying vec2 vUv; void main(){ vUv = position.xy*0.5+0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    Na = () => {
      let a = new X.BufferGeometry();
      return (
        a.setAttribute(
          "position",
          new X.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
        ),
        a
      );
    };
  class ne {
    constructor(a, t = {}) {
      ((this.r = a),
        (this.on = !0),
        (this.bloom = t.bloom ?? 1),
        (this.size = new X.Vector2(1, 1)),
        (this.cam = new X.OrthographicCamera(-1, 1, 1, -1, 0, 1)),
        (this.geo = Na()));
      let o =
        a.capabilities.isWebGL2 &&
        (a.extensions.has("EXT_color_buffer_float") ||
          a.extensions.has("EXT_color_buffer_half_float"));
      ((this.type = o ? X.HalfFloatType : X.UnsignedByteType), (this.hdr = o));
      let e = (i = {}) => ({
        type: this.type,
        format: X.RGBAFormat,
        minFilter: X.LinearFilter,
        magFilter: X.LinearFilter,
        depthBuffer: !1,
        ...i,
      });
      ((this.rt = new X.WebGLRenderTarget(
        4,
        4,
        e({ depthBuffer: !0, samples: a.capabilities.isWebGL2 ? 2 : 0 }),
      )),
        (this.lv = []));
      for (let i = 0; i < 4; i++)
        this.lv.push({
          a: new X.WebGLRenderTarget(4, 4, e()),
          b: new X.WebGLRenderTarget(4, 4, e()),
        });
      let s = (i, n) => {
        let r = new X.ShaderMaterial({
            vertexShader: La,
            fragmentShader: i,
            uniforms: n,
            depthTest: !1,
            depthWrite: !1,
          }),
          l = new X.Mesh(this.geo, r);
        l.frustumCulled = !1;
        let c = new X.Scene();
        return (c.add(l), { m: r, s: c });
      };
      ((this.bright = s(
        `uniform sampler2D tIn; uniform float uTh; varying vec2 vUv;
      void main(){ vec3 c = min(texture2D(tIn, vUv).rgb, vec3(14.0)); if (!(c.r == c.r) || !(c.g == c.g) || !(c.b == c.b)) c = vec3(0.0); float l = max(c.r, max(c.g, c.b)); float k = smoothstep(uTh, uTh + 1.2, l); gl_FragColor = vec4(c * k, 1.0); }`,
        { tIn: { value: null }, uTh: { value: 1 } },
      )),
        (this.copy = s(
          "uniform sampler2D tIn; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tIn, vUv).rgb, 1.0); }",
          { tIn: { value: null } },
        )),
        (this.blur = s(
          `uniform sampler2D tIn; uniform vec2 uDir; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tIn, vUv).rgb * 0.2270270270;
        c += texture2D(tIn, vUv + uDir*1.3846153846).rgb*0.3162162162; c += texture2D(tIn, vUv - uDir*1.3846153846).rgb*0.3162162162;
        c += texture2D(tIn, vUv + uDir*3.2307692308).rgb*0.0702702703; c += texture2D(tIn, vUv - uDir*3.2307692308).rgb*0.0702702703;
        gl_FragColor = vec4(c, 1.0); }`,
          { tIn: { value: null }, uDir: { value: new X.Vector2() } },
        )),
        (this.comp = s(
          `uniform sampler2D tScene, tB0, tB1, tB2, tB3; uniform float uBloom, uExp, uTime, uFlash, uDark, uVig, uAb; uniform vec3 uFlashCol; uniform vec2 uRes; varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 d = vUv - 0.5; float r2 = dot(d,d);
        vec2 off = d * r2 * uAb;
        vec3 c;
        c.r = texture2D(tScene, vUv + off).r; c.g = texture2D(tScene, vUv).g; c.b = texture2D(tScene, vUv - off).b;
        vec3 bl = texture2D(tB0, vUv).rgb*0.55 + texture2D(tB1, vUv).rgb*0.7 + texture2D(tB2, vUv).rgb*0.85 + texture2D(tB3, vUv).rgb*1.0;
        c += bl * uBloom * 0.28;
        c *= uExp;
        c = aces(c);
        float lum = dot(c, vec3(0.299,0.587,0.114));
        c = mix(vec3(lum), c, 1.12);
        c = mix(c * vec3(0.92,0.98,1.08), c * vec3(1.08,1.0,0.9), smoothstep(0.15, 0.75, lum));   // teal shadows, warm highlights
        c *= 1.0 - uVig * smoothstep(0.25, 0.85, r2 * 2.2);
        c = mix(c, vec3(0.0), uDark);
        c += uFlashCol * uFlash * 0.45;
        c += (hash(vUv * uRes + uTime) - 0.5) * 0.028;
        c = pow(max(c, vec3(0.0)), vec3(1.0/2.2));
        gl_FragColor = vec4(c, 1.0);
      }`,
          {
            tScene: { value: null },
            tB0: { value: null },
            tB1: { value: null },
            tB2: { value: null },
            tB3: { value: null },
            uBloom: { value: 1 },
            uExp: { value: 1 },
            uTime: { value: 0 },
            uFlash: { value: 0 },
            uFlashCol: { value: new X.Color(1, 1, 1) },
            uDark: { value: 0 },
            uVig: { value: 0.5 },
            uAb: { value: 0.012 },
            uRes: { value: new X.Vector2(1, 1) },
          },
        )),
        (this.params = {
          exposure: 1,
          flash: 0,
          flashCol: new X.Color(1, 1, 1),
          dark: 0,
        }));
    }
    resize(a, t, o) {
      this.size.set(a, t);
      let e = Math.max(2, Math.floor(a * o)),
        s = Math.max(2, Math.floor(t * o));
      (this.rt.setSize(e, s),
        this.lv.forEach((i, n) => {
          let r = Math.pow(2, n + 1),
            l = Math.max(2, Math.floor(e / r)),
            c = Math.max(2, Math.floor(s / r));
          (i.a.setSize(l, c), i.b.setSize(l, c));
        }),
        this.comp.m.uniforms.uRes.value.set(e, s));
    }
    pass(a, t) {
      (this.r.setRenderTarget(t), this.r.render(a.s, this.cam));
    }
    render(a, t, o) {
      let e = this.r;
      (e.setRenderTarget(this.rt), e.clear(), e.render(a, t));
      let s = this.params,
        i = this.comp.m.uniforms,
        n = this.rt.texture;
      ((this.bright.m.uniforms.tIn.value = n),
        this.pass(this.bright, this.lv[0].a));
      for (let r = 0; r < 4; r++) {
        let l = this.lv[r];
        if (r > 0)
          ((this.copy.m.uniforms.tIn.value = this.lv[r - 1].a.texture),
            this.pass(this.copy, l.a));
        ((this.blur.m.uniforms.tIn.value = l.a.texture),
          this.blur.m.uniforms.uDir.value.set(1 / l.a.width, 0),
          this.pass(this.blur, l.b),
          (this.blur.m.uniforms.tIn.value = l.b.texture),
          this.blur.m.uniforms.uDir.value.set(0, 1 / l.a.height),
          this.pass(this.blur, l.a));
      }
      ((i.tScene.value = n),
        (i.tB0.value = this.lv[0].a.texture),
        (i.tB1.value = this.lv[1].a.texture),
        (i.tB2.value = this.lv[2].a.texture),
        (i.tB3.value = this.lv[3].a.texture),
        (i.uBloom.value = this.bloom * (this.hdr ? 1 : 0.6)),
        (i.uExp.value = s.exposure),
        (i.uTime.value = o % 100),
        (i.uFlash.value = s.flash),
        i.uFlashCol.value.copy(s.flashCol),
        (i.uDark.value = s.dark),
        this.pass(this.comp, null));
    }
  }
  function qe(a) {
    let t = new X.Scene(),
      o = new X.ShaderMaterial({
        side: X.BackSide,
        depthWrite: !1,
        vertexShader:
          "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: `varying vec3 vD; void main(){ vec3 d = normalize(vD); float y = d.y;
      vec3 hor = vec3(2.4,1.1,0.5), mid = vec3(1.1,0.55,0.55), top = vec3(0.55,0.62,1.0), gr = vec3(0.4,0.25,0.16);
      vec3 c = y > 0.0 ? mix(hor, mix(mid, top, smoothstep(0.15,0.9,y)), smoothstep(0.0,0.35,y)) : mix(hor*0.5, gr, smoothstep(0.0,-0.4,y));
      vec3 sun = normalize(vec3(0.5,0.46,0.72)); float s = max(dot(d,sun),0.0); c += vec3(9.0,5.2,2.4) * pow(s, 90.0) + vec3(2.2,1.0,0.4)*pow(s, 8.0);
      gl_FragColor = vec4(c,1.0); }`,
      });
    t.add(new X.Mesh(new X.SphereGeometry(50, 32, 16), o));
    let e = new X.PMREMGenerator(a),
      s = e.fromScene(t, 0.02);
    return (e.dispose(), s.texture);
  }
  var D = Bt(Ct());
  var vt = Bt(Ct());
  var Jt = Bt(Ct());
  var et = {},
    St = (a, t) => {
      let o = document.createElement("canvas");
      return ((o.width = a), (o.height = t), o);
    };
  function Ht(
    a,
    { rep: t = [1, 1], srgb: o = !0, aniso: e = 8, wrap: s = !0 } = {},
  ) {
    let i = new Jt.CanvasTexture(a);
    if (s) i.wrapS = i.wrapT = Jt.RepeatWrapping;
    if ((i.repeat.set(t[0], t[1]), (i.anisotropy = e), o))
      i.colorSpace = Jt.SRGBColorSpace;
    return ((i.needsUpdate = !0), i);
  }
  function $t(a, t, o) {
    let e =
      (Math.imul(a, 374761393) +
        Math.imul(t, 668265263) +
        Math.imul(o, 1442695041)) |
      0;
    return (
      (e = Math.imul(e ^ (e >>> 13), 1274126177)),
      ((e ^ (e >>> 16)) >>> 0) / 4294967295
    );
  }
  function Oa(a, t, o, e) {
    let s = Math.floor(a),
      i = Math.floor(t),
      n = a - s,
      r = t - i,
      l = n * n * (3 - 2 * n),
      c = r * r * (3 - 2 * r),
      g = ((s % e) + e) % e,
      v = (g + 1) % e,
      y = ((i % e) + e) % e,
      M = (y + 1) % e,
      z = $t(g, y, o),
      w = $t(v, y, o),
      S = $t(g, M, o),
      P = $t(v, M, o);
    return z + (w - z) * l + (S - z) * c + (z - w - S + P) * l * c;
  }
  function zt(a, t, o, e = 1, s = 5) {
    let i = 0,
      n = 0.5,
      r = 1,
      l = o;
    for (let c = 0; c < s; c++)
      ((i += n * Oa(a * l, t * l, e + c * 13, l)), (l *= 2), (n *= 0.5));
    return i;
  }
  function p0(a, t) {
    let o = a.getContext("2d"),
      { width: e, height: s } = a,
      i = o.createImageData(e, s),
      n = i.data;
    for (let r = 0; r < s; r++)
      for (let l = 0; l < e; l++) {
        let c = (r * e + l) * 4,
          g = t(l / e, r / s, l, r);
        ((n[c] = g[0]),
          (n[c + 1] = g[1]),
          (n[c + 2] = g[2]),
          (n[c + 3] = g[3] === void 0 ? 255 : g[3]));
      }
    o.putImageData(i, 0, 0);
  }
  function Le() {
    if (et.ground) return et.ground;
    let a = St(512, 512),
      t = St(512, 512),
      o = (e, s) => zt(e, s, 4, 3, 6);
    return (
      p0(a, (e, s) => {
        let i = o(e, s),
          n = zt(e, s, 8, 9, 4),
          r = Math.abs(zt(e, s, 5, 21, 4) - 0.5),
          l = r < 0.012 ? 0.45 : r < 0.03 ? 0.75 : 1,
          c = ot((zt(e, s, 3, 5, 3) - 0.55) * 4, 0, 1),
          g = 92 + i * 75 + n * 30,
          v = 66 + i * 52 + n * 20,
          y = 46 + i * 36 + n * 14;
        ((g = g * (1 - c * 0.55) + 40 * c),
          (v = v * (1 - c * 0.55) + 34 * c),
          (y = y * (1 - c * 0.55) + 32 * c));
        let M = $t((e * 512) | 0, (s * 512) | 0, 77) > 0.992 ? 1.35 : 1;
        return [g * l * M, v * l * M, y * l * M];
      }),
      p0(t, (e, s) => {
        let i = o(e, s),
          n = Math.abs(zt(e, s, 5, 21, 4) - 0.5),
          r =
            i * 200 +
            (n < 0.02 ? -70 : 0) +
            $t((e * 512) | 0, (s * 512) | 0, 5) * 30;
        return [r, r, r];
      }),
      (et.ground = {
        map: Ht(a, { rep: [260, 260] }),
        bump: Ht(t, { rep: [260, 260], srgb: !1 }),
      })
    );
  }
  function Ne() {
    if (et.skin) return et.skin;
    let a = St(256, 256);
    return (
      p0(a, (t, o) => {
        let e =
          zt(t, o, 16, 2, 4) * 180 + $t((t * 256) | 0, (o * 256) | 0, 3) * 70;
        return [e, e, e];
      }),
      (et.skin = Ht(a, { rep: [3, 3], srgb: !1 }))
    );
  }
  function Oe(a = "#e0a020", t = [4, 4]) {
    let o = "cl" + a + t;
    if (et[o]) return et[o];
    let e = new Jt.Color(a),
      s = St(256, 256);
    return (
      p0(s, (i, n, r, l) => {
        let c = ((r >> 1) + (l >> 1)) & 1 ? 0.9 : 1.02,
          g = 0.82 + 0.3 * zt(i, n, 4, 8, 4),
          v = 0.94 + 0.12 * $t(r, l, 9),
          y = c * g * v;
        return [e.r * 255 * y, e.g * 255 * y, e.b * 255 * y];
      }),
      (et[o] = Ht(s, { rep: t }))
    );
  }
  function Ke() {
    if (et.gb) return et.gb;
    let a = St(256, 256),
      t = a.getContext("2d");
    ((t.fillStyle = "#808080"),
      t.fillRect(0, 0, 256, 256),
      (t.strokeStyle = "#fff"),
      (t.fillStyle = "#fff"),
      (t.lineWidth = 3));
    for (let o = 0; o < 4; o++)
      for (let e = 0; e < 4; e++) {
        let s = o * 64 + 32,
          i = e * 64 + 32;
        for (let n = 0; n < 8; n++) {
          let r = (n * Math.PI) / 4;
          (t.beginPath(),
            t.ellipse(
              s + Math.cos(r) * 14,
              i + Math.sin(r) * 14,
              12,
              5,
              r,
              0,
              7,
            ),
            t.stroke());
        }
        (t.beginPath(), t.arc(s, i, 6, 0, 7), t.fill());
      }
    ((t.strokeStyle = "#222"), (t.lineWidth = 2));
    for (let o = 0; o < 4; o++)
      (t.beginPath(),
        t.moveTo(0, o * 64),
        t.lineTo(256, o * 64),
        t.stroke(),
        t.beginPath(),
        t.moveTo(o * 64, 0),
        t.lineTo(o * 64, 256),
        t.stroke());
    return (et.gb = Ht(a, { rep: [2, 2], srgb: !1 }));
  }
  function v0(a = "#2a170c", t = !1) {
    let o = "eye" + a + t;
    if (et[o]) return et[o];
    let e = St(512, 256),
      s = e.getContext("2d");
    ((s.fillStyle = t ? "#ffe2c0" : "#f3eee4"), s.fillRect(0, 0, 512, 256));
    for (let l = 0; l < 18; l++) {
      ((s.strokeStyle = "rgba(190,60,50,.22)"),
        (s.lineWidth = 1),
        s.beginPath());
      let c = Math.random() * 6.28;
      (s.moveTo(128 + Math.cos(c) * 90, 128 + Math.sin(c) * 60),
        s.lineTo(128 + Math.cos(c) * 36, 128 + Math.sin(c) * 24),
        s.stroke());
    }
    let i = 128,
      n = 128,
      r = s.createRadialGradient(i, n, 4, i, n, 34);
    return (
      r.addColorStop(0, "#000"),
      r.addColorStop(0.28, "#050303"),
      r.addColorStop(0.32, a),
      r.addColorStop(0.8, t ? "#ff8a20" : "#5a3a1a"),
      r.addColorStop(1, "#0b0705"),
      (s.fillStyle = r),
      s.beginPath(),
      s.arc(i, n, 34, 0, 7),
      s.fill(),
      (s.fillStyle = "rgba(255,255,255,.9)"),
      s.beginPath(),
      s.arc(i - 10, n - 11, 6, 0, 7),
      s.fill(),
      (et[o] = Ht(e, { wrap: !1, aniso: 4 }))
    );
  }
  var Ka = (a, t) => {
    let o = St(a, a),
      e = o.getContext("2d"),
      s = e.createRadialGradient(a / 2, a / 2, 0, a / 2, a / 2, a / 2);
    return (
      t.forEach(([i, n]) => s.addColorStop(i, n)),
      (e.fillStyle = s),
      e.fillRect(0, 0, a, a),
      o
    );
  };
  function Ot() {
    return (
      et.glow ||
      (et.glow = Ht(
        Ka(128, [
          [0, "rgba(255,255,255,1)"],
          [0.2, "rgba(255,255,255,.6)"],
          [0.55, "rgba(255,255,255,.12)"],
          [1, "rgba(255,255,255,0)"],
        ]),
        { wrap: !1 },
      ))
    );
  }
  function Ye() {
    if (et.soft) return et.soft;
    let a = St(128, 128);
    return (
      p0(a, (t, o) => {
        let e = Math.hypot(t - 0.5, o - 0.5) * 2,
          s = Math.max(0, 1 - e),
          i = zt(t, o, 4, 11, 4);
        return [255, 255, 255, ot(s * s * (0.35 + i * 1.5), 0, 1) * 255];
      }),
      (et.soft = Ht(a, { wrap: !1 }))
    );
  }
  function je() {
    if (et.spark) return et.spark;
    let a = St(128, 128),
      t = a.getContext("2d");
    ((t.fillStyle = "#000"), t.fillRect(0, 0, 128, 128));
    let o = t.createRadialGradient(64, 64, 0, 64, 64, 64);
    (o.addColorStop(0, "#fff"),
      o.addColorStop(0.1, "rgba(255,255,255,.7)"),
      o.addColorStop(0.4, "rgba(255,255,255,.08)"),
      o.addColorStop(1, "rgba(0,0,0,0)"),
      (t.fillStyle = o),
      t.fillRect(0, 0, 128, 128),
      (t.globalCompositeOperation = "lighter"));
    for (let [e, s] of [
      [128, 3],
      [3, 128],
    ]) {
      let i = t.createLinearGradient(0, 0, e > s ? 128 : 0, e > s ? 0 : 128);
      (i.addColorStop(0, "rgba(255,255,255,0)"),
        i.addColorStop(0.5, "rgba(255,255,255,.9)"),
        i.addColorStop(1, "rgba(255,255,255,0)"),
        (t.fillStyle = i),
        t.fillRect(64 - e / 2, 64 - s / 2, e, s));
    }
    return (et.spark = Ht(a, { wrap: !1 }));
  }
  function Xe() {
    if (et.cloud) return et.cloud;
    let a = St(256, 256);
    return (
      p0(a, (t, o) => {
        let e = Math.hypot((t - 0.5) * 1.1, (o - 0.5) * 2) * 2,
          s = Math.max(0, 1 - e),
          i = zt(t, o, 3, 17, 5);
        return [
          255,
          255,
          255,
          ot(s * (0.2 + i * 1.4) - 0.08, 0, 1) * 255 * 0.8,
        ];
      }),
      (et.cloud = Ht(a, { wrap: !1 }))
    );
  }
  function Ze() {
    if (et.hex) return et.hex;
    let a = St(256, 256),
      t = a.getContext("2d");
    (t.clearRect(0, 0, 256, 256),
      (t.strokeStyle = "#fff"),
      (t.lineWidth = 2.5));
    let o = 18,
      e = o * Math.sqrt(3);
    for (let s = -1; s < 10; s++)
      for (let i = -1; i < 10; i++) {
        let n = i * o * 3 + (s % 2 ? o * 1.5 : 0),
          r = (s * e) / 2;
        t.beginPath();
        for (let l = 0; l < 6; l++) {
          let c = (l * Math.PI) / 3;
          l
            ? t.lineTo(n + Math.cos(c) * o, r + Math.sin(c) * o)
            : t.moveTo(n + Math.cos(c) * o, r + Math.sin(c) * o);
        }
        (t.closePath(), t.stroke());
      }
    return (et.hex = Ht(a, { rep: [10, 5] }));
  }
  function Qe() {
    if (et.win) return et.win;
    let a = St(128, 256),
      t = a.getContext("2d");
    ((t.fillStyle = "#d9c7a0"), t.fillRect(0, 0, 128, 256));
    let o = Lt(4);
    for (let n = 0; n < 10; n++)
      for (let r = 0; r < 5; r++)
        ((t.fillStyle = o() > 0.3 ? "#ffb040" : "#3a2a1a"),
          t.fillRect(8 + r * 24, 10 + n * 24, 12, 16));
    let e = St(128, 256),
      s = e.getContext("2d");
    ((s.fillStyle = "#000"), s.fillRect(0, 0, 128, 256));
    let i = Lt(4);
    for (let n = 0; n < 10; n++)
      for (let r = 0; r < 5; r++)
        ((s.fillStyle = i() > 0.3 ? "#ff9a30" : "#000"),
          s.fillRect(8 + r * 24, 10 + n * 24, 12, 16),
          i());
    return (et.win = { map: Ht(a), emit: Ht(e) });
  }
  function y0(a) {
    let t = "flag" + a;
    if (et[t]) return et[t];
    let o = St(512, 320),
      e = o.getContext("2d");
    if (a === "rama") {
      let s = e.createLinearGradient(0, 0, 512, 0);
      (s.addColorStop(0, "#f6b02a"),
        s.addColorStop(1, "#ff7d14"),
        (e.fillStyle = s),
        e.fillRect(0, 0, 512, 320),
        (e.strokeStyle = "#ffe9a0"),
        (e.lineWidth = 10),
        e.strokeRect(10, 10, 492, 300),
        e.translate(256, 160),
        (e.fillStyle = "#fff0b0"));
      for (let i = 0; i < 24; i++)
        (e.rotate(Math.PI / 12),
          e.beginPath(),
          e.moveTo(52, -8),
          e.lineTo(138, 0),
          e.lineTo(52, 8),
          e.fill());
      ((e.fillStyle = "#ffd23a"),
        e.beginPath(),
        e.arc(0, 0, 46, 0, 7),
        e.fill(),
        (e.fillStyle = "#d9640a"),
        e.beginPath(),
        e.arc(0, 0, 30, 0, 7),
        e.fill(),
        (e.fillStyle = "#ffe9a0"),
        e.beginPath(),
        e.arc(0, 0, 14, 0, 7),
        e.fill());
    } else {
      ((e.fillStyle = "#16090c"),
        e.fillRect(0, 0, 512, 320),
        (e.strokeStyle = "#c4161c"),
        (e.lineWidth = 10),
        e.strokeRect(10, 10, 492, 300),
        e.translate(256, 160),
        (e.strokeStyle = "#ff5a2a"),
        (e.fillStyle = "#ff5a2a"),
        (e.lineWidth = 9),
        (e.lineCap = "round"),
        e.beginPath(),
        e.moveTo(-130, 80),
        e.lineTo(120, -90),
        e.stroke(),
        e.beginPath(),
        e.ellipse(-92, 56, 52, 42, -0.6, 0, 7),
        e.stroke(),
        e.beginPath(),
        e.ellipse(98, -72, 30, 24, -0.6, 0, 7),
        e.stroke(),
        (e.lineWidth = 2.5));
      for (let s = -2; s <= 2; s++)
        (e.beginPath(),
          e.moveTo(-110 + s * 6, 68 + s * 3),
          e.lineTo(112 + s * 6, -80 + s * 3),
          e.stroke());
    }
    return (et[t] = Ht(o, { wrap: !1 }));
  }
  var w0 = null;
  function mt() {
    if (w0) return w0;
    let a = Ne(),
      t = Ke(),
      o = (n) => new vt.MeshStandardMaterial(n),
      e = (n, r) =>
        new vt.MeshPhysicalMaterial({
          color: n,
          roughness: 0.5,
          bumpMap: a,
          bumpScale: 0.6,
          sheen: 0.6,
          sheenRoughness: 0.5,
          sheenColor: new vt.Color(r),
        }),
      s = (n, r = {}) =>
        o({
          color: 16777215,
          map: Oe(n),
          roughness: 0.82,
          side: vt.DoubleSide,
          ...r,
        }),
      i = (n, r) =>
        o({
          color: n,
          metalness: 1,
          roughness: r,
          envMapIntensity: 1.7,
          bumpMap: t,
          bumpScale: 0.4,
        });
    return (
      (w0 = {
        skinRama: e(4556224, 8042736),
        skinRav: e(10245682, 14188624),
        skinMatali: e(12158296, 14721136),
        skinDemon: e(5910332, 10111578),
        dhotiYellow: s("#f0b020"),
        dhotiRed: s("#8c1218"),
        dhotiBlack: s("#1d1822"),
        dhotiWhite: s("#efe6d0"),
        dhotiBlue: s("#2a4a9a"),
        maroon: s("#5a0e18"),
        saffron: s("#e8861a"),
        purple: s("#4a1f66"),
        gold: i(16762194, 0.2),
        goldDark: i(12026410, 0.34),
        goldBlack: i(8216362, 0.3),
        silver: o({
          color: 14673392,
          metalness: 1,
          roughness: 0.18,
          envMapIntensity: 1.6,
        }),
        steel: o({
          color: 10133938,
          metalness: 1,
          roughness: 0.28,
          envMapIntensity: 1.5,
        }),
        iron: o({
          color: 2828339,
          metalness: 0.9,
          roughness: 0.36,
          envMapIntensity: 1.3,
        }),
        blackMetal: o({
          color: 1183766,
          metalness: 0.95,
          roughness: 0.3,
          envMapIntensity: 1.5,
        }),
        bronze: o({
          color: 9067052,
          metalness: 0.9,
          roughness: 0.4,
          envMapIntensity: 1.2,
        }),
        wood: o({ color: 6043936, roughness: 0.7 }),
        woodDark: o({ color: 2759186, roughness: 0.6 }),
        leather: o({ color: 4860957, roughness: 0.6 }),
        leatherBlack: o({ color: 1840402, roughness: 0.55 }),
        pearl: o({
          color: 16446436,
          roughness: 0.18,
          metalness: 0.1,
          envMapIntensity: 1.5,
        }),
        flower: o({
          color: 15224954,
          roughness: 0.6,
          emissive: 3804188,
          emissiveIntensity: 0.5,
        }),
        flowerW: o({ color: 16773336, roughness: 0.6 }),
        leaf: o({ color: 3115578, roughness: 0.7 }),
        gemRed: o({
          color: 13373464,
          emissive: 16722464,
          emissiveIntensity: 1.4,
          roughness: 0.1,
          metalness: 0.2,
        }),
        gemBlue: o({
          color: 1339592,
          emissive: 2793727,
          emissiveIntensity: 1.3,
          roughness: 0.1,
        }),
        gemGreen: o({
          color: 1095784,
          emissive: 2162576,
          emissiveIntensity: 1,
          roughness: 0.1,
        }),
        gemOrange: o({
          color: 16747024,
          emissive: 16740352,
          emissiveIntensity: 1.6,
          roughness: 0.15,
        }),
        teeth: o({ color: 15788242, roughness: 0.3 }),
        mouth: o({ color: 2753800, roughness: 0.6 }),
        lip: o({ color: 8008248, roughness: 0.4 }),
        lipRav: o({ color: 5904924, roughness: 0.45 }),
        hair: o({ color: 788489, roughness: 0.4, metalness: 0.2 }),
        brow: o({ color: 656903, roughness: 0.7 }),
        tilak: o({
          color: 16183522,
          emissive: 16769168,
          emissiveIntensity: 0.5,
          roughness: 0.5,
        }),
        tilakRed: o({
          color: 12589080,
          emissive: 16719888,
          emissiveIntensity: 0.6,
        }),
        eyeRama: o({ color: 16777215, map: v0("#2c1a0e"), roughness: 0.15 }),
        eyeRav: o({
          color: 16777215,
          map: v0("#ff3a10", !0),
          roughness: 0.15,
          emissive: 16728080,
          emissiveMap: v0("#ff3a10", !0),
          emissiveIntensity: 0.5,
        }),
        eyeMat: o({ color: 16777215, map: v0("#3a2412"), roughness: 0.15 }),
        kajal: o({ color: 328452, roughness: 0.8 }),
        horseWhite: new vt.MeshPhysicalMaterial({
          color: 16184042,
          roughness: 0.4,
          bumpMap: a,
          bumpScale: 0.15,
          sheen: 1,
          sheenColor: new vt.Color(16773336),
          sheenRoughness: 0.4,
          emissive: 2763322,
          emissiveIntensity: 0.25,
        }),
        horseBlack: new vt.MeshPhysicalMaterial({
          color: 1907234,
          roughness: 0.35,
          bumpMap: a,
          bumpScale: 0.2,
          sheen: 1,
          sheenColor: new vt.Color(9062970),
          sheenRoughness: 0.35,
          clearcoat: 0.3,
        }),
        maneWhite: o({
          color: 15919871,
          roughness: 0.55,
          emissive: 10522848,
          emissiveIntensity: 0.45,
        }),
        maneFire: o({
          color: 16742944,
          emissive: 16730624,
          emissiveIntensity: 2,
          roughness: 0.5,
        }),
        hoof: o({ color: 2366488, roughness: 0.4 }),
        hoofGold: i(14065712, 0.3),
        plumeRama: o({
          color: 16751296,
          emissive: 16732296,
          emissiveIntensity: 0.5,
          roughness: 0.7,
        }),
        plumeRav: o({
          color: 16724000,
          emissive: 16715776,
          emissiveIntensity: 0.8,
          roughness: 0.7,
        }),
        chariotWhite: o({
          color: 16052195,
          roughness: 0.28,
          metalness: 0.3,
          envMapIntensity: 1.4,
        }),
        chariotBlack: o({
          color: 1380890,
          roughness: 0.3,
          metalness: 0.9,
          envMapIntensity: 1.5,
        }),
        redGlow: o({
          color: 4196360,
          emissive: 16722448,
          emissiveIntensity: 1.8,
          roughness: 0.4,
        }),
        goldGlow: o({
          color: 16765024,
          emissive: 16752656,
          emissiveIntensity: 1.1,
          metalness: 0.6,
          roughness: 0.3,
        }),
        bone: o({ color: 14274228, roughness: 0.55 }),
        flameBasic: new vt.MeshBasicMaterial({
          color: 16747056,
          transparent: !0,
          opacity: 0.85,
          blending: vt.AdditiveBlending,
          depthWrite: !1,
        }),
        flagRama: o({
          map: y0("rama"),
          side: vt.DoubleSide,
          roughness: 0.8,
          emissive: 4202496,
          emissiveIntensity: 0.4,
          emissiveMap: y0("rama"),
        }),
        flagRav: o({
          map: y0("rav"),
          side: vt.DoubleSide,
          roughness: 0.8,
          emissive: 2098180,
          emissiveIntensity: 0.4,
          emissiveMap: y0("rav"),
        }),
      }),
      (w0.glowSprite = (n) =>
        new vt.SpriteMaterial({
          map: Ot(),
          color: n,
          transparent: !0,
          blending: vt.AdditiveBlending,
          depthWrite: !1,
        })),
      w0
    );
  }
  var j = Bt(Ct());
  var At = Bt(Ct());
  var t0 = (a, t, o) => {
      let e = ot((o - a) / (t - a), 0, 1);
      return e * e * (3 - 2 * e);
    },
    G0 = (a, t) => Math.exp(-(a / t) * (a / t));
  function $e(a, t, o, e) {
    let s = t0(0, -1, t),
      i = a * (1 - (0.44 - (e.jaw || 0) * 0.08) * Math.pow(s, 1.3)),
      n = t * (1 + 0.16 * s),
      r = o,
      l = Math.abs(a);
    return (
      (r +=
        (e.chin === void 0 ? 0.1 : e.chin) *
        t0(-0.45, -0.98, t) *
        Math.max(0, o)),
      (r -= 0.09 * t0(0.38, 1, t) * Math.max(0, o)),
      (r +=
        (e.brow === void 0 ? 0.06 : e.brow) *
        G0(t - 0.22, 0.09) *
        t0(0.25, 0.9, o)),
      (r -=
        0.085 *
        Math.exp(
          -(Math.pow((l - 0.4) / 0.2, 2) + Math.pow((t - 0.14) / 0.14, 2)),
        ) *
        t0(0.4, 0.9, o)),
      (r += 0.075 * G0(a, 0.1) * G0(t + 0.1, 0.24) * t0(0.45, 0.95, o)),
      (r +=
        0.05 *
        Math.exp(
          -(Math.pow((l - 0.55) / 0.2, 2) + Math.pow((t + 0.1) / 0.16, 2)),
        ) *
        t0(0.15, 0.8, o)),
      (i -=
        Math.sign(a) *
        (e.hollow === void 0 ? 0.05 : e.hollow) *
        Math.exp(
          -(Math.pow((l - 0.55) / 0.25, 2) + Math.pow((t + 0.4) / 0.15, 2)),
        )),
      (r -= 0.04 * G0(t + 0.5, 0.04) * t0(0.5, 0.95, o)),
      [i, n, r]
    );
  }
  function D0(a = {}) {
    let t = mt(),
      o = a.skin,
      e = a.w || 0.092,
      s = a.h || 0.122,
      i = a.d || 0.108,
      n = a.angry || 0,
      r = new At.Group(),
      l = new tt(),
      c = new At.SphereGeometry(1, 60, 46),
      g = c.attributes.position;
    for (let w = 0; w < g.count; w++) {
      let S = $e(g.getX(w), g.getY(w), g.getZ(w), a);
      g.setXYZ(w, S[0] * e, S[1] * s, S[2] * i);
    }
    (c.computeVertexNormals(), l.add(b(c, o)));
    let v = (w, S) => {
        let P = w / e,
          W = S / (s * (S < 0 ? 1.1 : 1)),
          H = Math.sqrt(Math.max(0.02, 1 - P * P - W * W));
        return $e(P, W, H, a)[2] * i;
      },
      y = a.eye || t.eyeMat;
    for (let w of [-1, 1]) {
      let S = w * 0.04 * (e / 0.092);
      (l.add(B(y, 0.0135, [S, 0.019, v(S, 0.019) - 0.012])),
        l.add(
          b(C.tor(0.0142, 0.0031 + n * 0.0012, 20), t.kajal, {
            p: [S, 0.019, v(S, 0.019) - 0.003],
            s: [1, 0.6, 1],
          }),
        ));
      let W = 0.041,
        H = 0.011,
        K = 0.07 * (e / 0.092),
        I = [
          [w * H, W - n * 0.011, v(H, W) + 0.002],
          [w * (H + K) * 0.45, W + 0.006, v((H + K) * 0.45, W) + 0.003],
          [w * K, W - 0.001 + n * 0.004, v(K, W - 0.004) + 0.002],
        ];
      if (
        (l.add(b(Dt(I, 0.0044 + n * 0.0012, 0.0022, 10, 6), t.brow)),
        l.add(
          b(C.sph(), o, {
            p: [w * e * 0.99, -0.004, -0.006],
            s: [0.0065, 0.028, 0.019],
            r: [0, 0, w * 0.12],
          }),
        ),
        a.earring !== !1)
      )
        (l.add(
          b(C.tor(0.017, 0.0032, 20), a.ringMat || t.gold, {
            p: [w * (e + 0.003), -0.036, -0.006],
            r: [0, Math.PI / 2, 0],
          }),
        ),
          l.add(
            B(a.earGem || t.gemRed, 0.0075, [w * (e + 0.003), -0.056, -0.006]),
          ),
          l.add(
            b(C.cone(), a.ringMat || t.gold, {
              p: [w * (e + 0.003), -0.067, -0.006],
              s: [0.006, 0.016, 0.006],
              r: [Math.PI, 0, 0],
            }),
          ));
      if (a.tusks)
        l.add(
          Z(
            t.teeth,
            0.0055,
            0.036,
            [w * 0.026, -0.071, v(0.026, -0.071) + 0.002],
            [0.15, 0, -w * 0.12],
          ),
        );
      if (a.moustache) {
        let at = v(0.01, -0.058) + 0.006;
        l.add(
          b(
            Dt(
              [
                [w * 0.004, -0.056, at + 0.004],
                [w * 0.03, -0.054, at - 0.002],
                [w * 0.058, -0.066, at - 0.016],
                [w * 0.074, -0.094, at - 0.034],
              ],
              0.0072,
              0.0016,
              14,
              7,
            ),
            t.hair,
          ),
        );
      }
    }
    let M = v(0, -0.016);
    (l.add(B(o, 1, [0, -0.026, M + 0.003], [0.0105, 0.0185, 0.017])),
      l.add(B(o, 0.0125, [0, -0.034, M + 0.012])));
    for (let w of [-1, 1])
      l.add(B(o, 0.0105, [w * 0.0135, -0.033, M + 0.003], [1, 0.9, 0.9]));
    let z = v(0, -0.062);
    if (
      (l.add(
        B(a.lip || t.lip, 1, [0, -0.0605, z + 0.001], [0.027, 0.0065, 0.0125]),
      ),
      l.add(
        B(a.lip || t.lip, 1, [0, -0.0715, z - 0.001], [0.024, 0.0078, 0.0125]),
      ),
      l.add(
        b(C.tor(0.026, 0.0016, 16, Math.PI), t.mouth, {
          p: [0, -0.066, z - 0.001],
          s: [1, 0.2, 1],
          r: [0, 0, Math.PI],
        }),
      ),
      a.beard)
    )
      l.add(
        b(
          xt(
            [
              { p: [0, -0.11, v(0, -0.11) - 0.003], rx: 0.02, ry: 0.012 },
              { p: [0, -0.15, v(0, -0.11) + 0.002], rx: 0.016, ry: 0.012 },
              { p: [0, -0.2, v(0, -0.11) + 0.012], rx: 0.003, ry: 0.004 },
            ],
            { radial: 10 },
          ),
          t.hair,
        ),
      );
    if (a.tilak === "rama")
      (l.add(
        gt(t.tilak, 0.0075, 0.045, 0.004, [0, 0.083, v(0, 0.083) + 0.002]),
      ),
        l.add(
          gt(
            t.tilak,
            0.0075,
            0.04,
            0.004,
            [0.013, 0.08, v(0.013, 0.08) + 0.001],
            [0, 0, 0.12],
          ),
        ),
        l.add(
          gt(
            t.tilak,
            0.0075,
            0.04,
            0.004,
            [-0.013, 0.08, v(0.013, 0.08) + 0.001],
            [0, 0, -0.12],
          ),
        ),
        l.add(B(t.tilakRed, 0.006, [0, 0.062, v(0, 0.062) + 0.002])));
    if (a.tilak === "rav")
      for (let w = -1; w <= 1; w++)
        l.add(
          gt(t.tilakRed, 0.012, 0.004, 0.004, [
            0,
            0.074 + w * 0.011,
            v(0, 0.074 + w * 0.011) + 0.001,
          ]),
        );
    if ((l.flush(r), a.hair)) {
      let w = new At.Mesh(
        new At.SphereGeometry(1, 36, 22, 0, Math.PI * 2, 0, 1.56),
        t.hair,
      );
      (w.scale.set(e * 1.045, s * 1.05, i * 1.06),
        w.position.set(0, 0.002, -0.012),
        (w.rotation.x = -0.5),
        (w.castShadow = !0),
        r.add(w));
      let S = new At.Group();
      (S.position.set(0, -0.01, -0.07), r.add(S), (r.userData.hair = S));
      for (let P = -2; P <= 2; P++)
        S.add(
          new At.Mesh(
            xt(
              [
                { p: [P * 0.03, 0.04, -0.01], rx: 0.026, ry: 0.012 },
                {
                  p: [P * 0.034, -0.16, -0.05 - Math.abs(P) * 0.004],
                  rx: 0.03,
                  ry: 0.014,
                },
                { p: [P * 0.04, -0.42, -0.09], rx: 0.026, ry: 0.012 },
                { p: [P * 0.042, -0.62, -0.1], rx: 0.004, ry: 0.004 },
              ],
              { radial: 8 },
            ),
            t.hair,
          ),
        );
      S.traverse((P) => {
        if (P.isMesh) P.castShadow = !0;
      });
    }
    if (a.crown) r.add(Ya(a.crown, e, s, i));
    return ((r.userData.fz = v), (r.userData.dims = { W: e, H: s, D: i }), r);
  }
  function Ya(a, t = 0.092, o = 0.122) {
    let e = mt(),
      s = new tt(),
      i = new At.Group(),
      n = (r, l, c = 40) =>
        b(
          new At.LatheGeometry(
            r.map(([g, v]) => new At.Vector2(g, v)),
            c,
          ),
          l,
        );
    if (a === "rama") {
      (s.add(
        n(
          [
            [0.1, 0.055],
            [0.106, 0.085],
            [0.1, 0.135],
            [0.088, 0.185],
            [0.073, 0.235],
            [0.057, 0.285],
            [0.041, 0.325],
            [0.024, 0.355],
            [0.009, 0.377],
            [0, 0.385],
          ],
          e.gold,
        ),
      ),
        s.add(
          n(
            [
              [0.102, 0.05],
              [0.109, 0.062],
              [0.109, 0.078],
              [0.103, 0.088],
            ],
            e.goldDark,
          ),
        ));
      for (let [r, l] of [
        [0.136, 0.1],
        [0.186, 0.089],
        [0.236, 0.074],
        [0.286, 0.058],
      ])
        s.add(ht(e.goldDark, l, 0.006, [0, r, 0], [Math.PI / 2, 0, 0]));
      for (let r = 0; r < 28; r++) {
        let l = (r / 28) * Math.PI * 2;
        s.add(
          B(e.pearl, 0.0055, [Math.cos(l) * 0.108, 0.064, Math.sin(l) * 0.108]),
        );
      }
      for (let r = 0; r < 16; r++) {
        let l = (r / 16) * Math.PI * 2;
        s.add(
          Z(
            e.gold,
            0.016,
            0.052,
            [Math.cos(l) * 0.104, 0.112, Math.sin(l) * 0.104],
            [Math.sin(l) * 0.4, 0, -Math.cos(l) * 0.4],
          ),
        );
      }
      for (let r = 0; r < 10; r++) {
        let l = (r / 10) * Math.PI * 2 + 0.3;
        s.add(
          B(r % 2 ? e.gemBlue : e.gemRed, 0.0085, [
            Math.cos(l) * 0.094,
            0.162,
            Math.sin(l) * 0.094,
          ]),
        );
      }
      (s.add(B(e.gemRed, 0.017, [0, 0.1, 0.108])),
        s.add(B(e.gemBlue, 0.011, [0.036, 0.094, 0.103])),
        s.add(B(e.gemBlue, 0.011, [-0.036, 0.094, 0.103])),
        s.add(B(e.gold, 0.021, [0, 0.395, 0])),
        s.add(Z(e.gold, 0.011, 0.06, [0, 0.438, 0])),
        s.add(ht(e.gold, 0.018, 0.004, [0, 0.378, 0], [Math.PI / 2, 0, 0])));
      for (let r of [-1, 1])
        (s.add(
          Z(e.gold, 0.02, 0.1, [r * 0.112, 0.15, -0.01], [0, 0, -r * 0.9]),
        ),
          s.add(B(e.gemGreen, 0.008, [r * 0.116, 0.108, 0.02])));
    } else if (a === "rav") {
      (s.add(
        n(
          [
            [0.1, 0.06],
            [0.108, 0.1],
            [0.098, 0.15],
            [0.082, 0.2],
            [0.06, 0.24],
            [0.03, 0.26],
            [0, 0.265],
          ],
          e.goldDark,
          28,
        ),
      ),
        s.add(ht(e.gold, 0.106, 0.009, [0, 0.07, 0], [Math.PI / 2, 0, 0])),
        s.add(ht(e.gold, 0.098, 0.006, [0, 0.15, 0], [Math.PI / 2, 0, 0])));
      for (let r = 0; r < 9; r++) {
        let l = (r / 9) * Math.PI * 2;
        s.add(
          Z(
            e.gold,
            0.016,
            0.09 + (r % 2) * 0.03,
            [Math.cos(l) * 0.098, 0.2, Math.sin(l) * 0.098],
            [Math.sin(l) * 0.25, 0, -Math.cos(l) * 0.25],
          ),
        );
      }
      (s.add(Z(e.gold, 0.02, 0.15, [0, 0.31, 0])),
        s.add(B(e.gemRed, 0.016, [0, 0.105, 0.108])),
        s.add(B(e.gemGreen, 0.009, [0.04, 0.1, 0.1])),
        s.add(B(e.gemGreen, 0.009, [-0.04, 0.1, 0.1])));
    } else if (a === "helm")
      (s.add(
        n(
          [
            [0.1, 0.045],
            [0.106, 0.09],
            [0.094, 0.15],
            [0.06, 0.2],
            [0.02, 0.23],
            [0, 0.235],
          ],
          e.steel,
          28,
        ),
      ),
        s.add(ht(e.gold, 0.103, 0.008, [0, 0.07, 0], [Math.PI / 2, 0, 0])),
        s.add(Z(e.gold, 0.012, 0.09, [0, 0.27, 0])),
        s.add(B(e.gemBlue, 0.011, [0, 0.1, 0.105])));
    else if (a === "horns") {
      s.add(
        n(
          [
            [0.1, 0.05],
            [0.105, 0.09],
            [0.09, 0.14],
            [0.05, 0.17],
            [0, 0.18],
          ],
          e.iron,
          24,
        ),
      );
      for (let r of [-1, 1])
        s.add(
          b(
            Dt(
              [
                [r * 0.09, 0.12, 0],
                [r * 0.15, 0.2, 0],
                [r * 0.17, 0.32, 0.01],
                [r * 0.13, 0.42, 0.03],
              ],
              0.02,
              0.003,
              12,
              8,
            ),
            e.bone,
          ),
        );
      (s.add(ht(e.gold, 0.104, 0.008, [0, 0.07, 0], [Math.PI / 2, 0, 0])),
        s.add(B(e.gemRed, 0.011, [0, 0.1, 0.105])));
    }
    return (s.flush(i), i);
  }
  var ja = (a, t, o) => {
      let e = ot((o - a) / (t - a), 0, 1);
      return e * e * (3 - 2 * e);
    },
    U0 = 0.3,
    _0 = 0.28,
    W0 = 0.47,
    ce = 0.46,
    he = G(0, 1, 0),
    Je = G(0, -1, 0);
  function i0(a, t, o, e = 10, s = 6) {
    let i = new j.PlaneGeometry(a, t, e, s);
    i.translate(a / 2, 0, 0);
    let n = new j.Mesh(i, o);
    n.castShadow = !0;
    let r = i.attributes.position.array.slice();
    return (
      (n.userData.update = (l, c = 1) => {
        let g = i.attributes.position.array;
        for (let v = 0; v < g.length; v += 3) {
          let y = r[v],
            M = y / a;
          ((g[v + 2] =
            (Math.sin(y * 4.2 - l * 7) * 0.12 +
              Math.sin(r[v + 1] * 3 + l * 5 + y * 2) * 0.05) *
            M *
            c),
            (g[v + 1] = r[v + 1] - M * M * 0.1 * c));
        }
        ((i.attributes.position.needsUpdate = !0), i.computeVertexNormals());
      }),
      n
    );
  }
  var ta = (() => {
    let a = G();
    return (t, o, e, s) => {
      a.copy(e).sub(o);
      let i = a.length() || 0.0001;
      (a.divideScalar(i),
        t.position.copy(o).addScaledVector(a, i / 2),
        t.scale.set(s, i, s),
        t.quaternion.setFromUnitVectors(he, a));
    };
  })();
  function Xa(a) {
    let t = mt(),
      o = a === "rav",
      e = o ? 0.98 : 0.84,
      s = new tt(),
      i = (w) => {
        let S = w / e;
        return 0.26 * (1 - S * S) - 0.26 + 0.1 * ja(0.62, 1, Math.abs(S));
      },
      n = o ? t.blackMetal : t.gold,
      r = [];
    for (let w = 0; w <= 28; w++) {
      let S = -e + (2 * e * w) / 28,
        P = Math.abs(S / e),
        W = 0.008 + 0.019 * (1 - Math.pow(P, 1.5));
      r.push({ p: [0, S, i(S)], rx: W, ry: W * 1.15 });
    }
    (s.add(b(xt(r, { radial: 10 }), n)),
      s.add(
        b(
          xt(
            [
              { p: [0, -0.15, 0], rx: 0.03, ry: 0.032 },
              { p: [0, 0, 0], rx: 0.036, ry: 0.036 },
              { p: [0, 0.15, 0], rx: 0.03, ry: 0.032 },
            ],
            { radial: 12 },
          ),
          t.leatherBlack,
        ),
      ));
    for (let w of [-1, 1]) {
      s.add(
        ht(
          o ? t.gold : t.goldDark,
          0.032,
          0.006,
          [0, w * 0.17, 0],
          [Math.PI / 2, 0, 0],
        ),
      );
      for (let P of [0.3, 0.5, 0.7])
        s.add(
          ht(
            o ? t.redGlow : t.goldDark,
            0.017,
            0.004,
            [0, w * e * P, i(w * e * P)],
            [Math.PI / 2, 0, 0],
          ),
        );
      let S = [0, w * e, i(w * e)];
      if (
        (s.add(B(o ? t.gemRed : t.gold, 0.024, S)),
        s.add(
          Z(
            o ? t.iron : t.gold,
            0.016,
            0.1,
            [0, w * (e + 0.05), S[2] + 0.015],
            [w > 0 ? 0.25 : Math.PI - 0.25, 0, 0],
          ),
        ),
        o)
      )
        s.add(
          Z(
            t.iron,
            0.012,
            0.09,
            [0, w * (e - 0.05), S[2] + 0.06],
            [Math.PI / 2, 0, 0],
          ),
        );
    }
    if (o)
      for (let w = 0; w < 5; w++)
        s.add(
          Z(
            t.iron,
            0.012,
            0.07,
            [0.03, -0.35 + w * 0.17, 0.02],
            [0, 0, -Math.PI / 2],
          ),
        );
    let l = new j.Group();
    s.flush(l);
    let c = new j.MeshBasicMaterial({ color: o ? 16752784 : 16773583 }),
      g = new j.Mesh(C.cyl(), c),
      v = new j.Mesh(C.cyl(), c);
    l.add(g, v);
    let y = new j.Group(),
      M = new tt();
    (M.add(wt(t.wood, 0.0085, 1, [0, 0, 0.5], [Math.PI / 2, 0, 0])),
      M.add(Z(t.steel, 0.02, 0.14, [0, 0, 1.06], [Math.PI / 2, 0, 0])),
      M.add(ht(t.gold, 0.011, 0.004, [0, 0, 0.98], [0, 0, 0])));
    for (let w = 0; w < 3; w++) {
      let S = (w / 3) * Math.PI * 2;
      M.add(
        gt(
          o ? t.plumeRav : t.plumeRama,
          0.003,
          0.038,
          0.16,
          [Math.cos(S) * 0.019, Math.sin(S) * 0.019, 0.1],
          [0, 0, S],
        ),
      );
    }
    M.flush(y);
    let z = new j.Sprite(t.glowSprite(o ? 16728096 : 16760928));
    return (
      (z.position.z = 1.08),
      z.scale.setScalar(0.35),
      y.add(z),
      l.add(y),
      (l.userData = {
        s1: g,
        s2: v,
        arrow: y,
        glow: z,
        half: e,
        zf: i,
        tip: G(0, 0, 1.1),
      }),
      (l.userData.update = (w) => {
        let S = G(0, e, i(e)),
          P = G(0, 0, w),
          W = G(0, -e, i(-e));
        (ta(g, S, P, 0.0042), ta(v, P, W, 0.0042), (y.position.z = w));
      }),
      l.userData.update(-0.2),
      l
    );
  }
  function Za(a) {
    let t = mt(),
      o = new tt(),
      e = new j.Group();
    switch (a) {
      case "sword":
        (o.add(gt(t.silver, 0.06, 0.95, 0.012, [0, 0.55, 0])),
          o.add(Z(t.silver, 0.04, 0.12, [0, 1.07, 0])),
          o.add(gt(t.gold, 0.22, 0.035, 0.05, [0, 0.07, 0])),
          o.add(wt(t.leather, 0.02, 0.22, [0, -0.05, 0])),
          o.add(B(t.gold, 0.035, [0, -0.17, 0])),
          o.add(gt(t.redGlow, 0.01, 0.8, 0.014, [0, 0.55, 0])));
        break;
      case "mace":
        (o.add(wt(t.goldDark, 0.025, 0.8, [0, 0.3, 0])),
          o.add(B(t.gold, 0.13, [0, 0.78, 0])));
        for (let s = 0; s < 10; s++) {
          let i = s * 0.63,
            n = ((s % 3) - 1) * 0.6;
          o.add(
            Z(
              t.gold,
              0.028,
              0.08,
              [
                Math.cos(i) * 0.13 * Math.cos(n),
                0.78 + Math.sin(n) * 0.13,
                Math.sin(i) * 0.13 * Math.cos(n),
              ],
              [Math.sin(i) * 1.4, 0, -Math.cos(i) * 1.4],
            ),
          );
        }
        break;
      case "trident":
        o.add(wt(t.goldDark, 0.022, 1.3, [0, 0.45, 0]));
        for (let s of [-1, 0, 1])
          (o.add(wt(t.silver, 0.014, 0.3, [s * 0.09, 1.2, 0])),
            o.add(Z(t.silver, 0.03, 0.14, [s * 0.09, 1.42, 0])));
        o.add(ht(t.silver, 0.09, 0.014, [0, 1.07, 0], [0, 0, 0], Math.PI));
        break;
      case "axe":
        (o.add(wt(t.wood, 0.025, 1, [0, 0.35, 0])),
          o.add(gt(t.steel, 0.3, 0.34, 0.025, [0.15, 0.78, 0])),
          o.add(Z(t.gold, 0.04, 0.12, [0, 0.92, 0])));
        break;
      case "spear":
        (o.add(wt(t.woodDark, 0.02, 1.7, [0, 0.55, 0])),
          o.add(Z(t.steel, 0.06, 0.38, [0, 1.58, 0])),
          o.add(ht(t.redGlow, 0.03, 0.01, [0, 1.38, 0], [Math.PI / 2, 0, 0])));
        break;
      case "shield":
        (o.add(
          b(new j.CylinderGeometry(0.34, 0.34, 0.03, 28), t.iron, {
            p: [0, 0.2, 0],
            r: [Math.PI / 2, 0, 0],
          }),
        ),
          o.add(B(t.gold, 0.08, [0, 0.2, 0.03], [1, 1, 0.6])),
          o.add(b(C.tor(0.3, 0.02, 32), t.gold, { p: [0, 0.2, 0.02] })));
        break;
      case "chakra":
        o.add(
          b(C.tor(0.26, 0.026, 36), t.steel, { p: [0, 0.3, 0], r: [0, 0, 0] }),
        );
        for (let s = 0; s < 14; s++) {
          let i = (s / 14) * 6.28;
          o.add(
            Z(
              t.steel,
              0.03,
              0.12,
              [Math.cos(i) * 0.3, 0.3 + Math.sin(i) * 0.3, 0],
              [0, 0, i - Math.PI / 2],
            ),
          );
        }
        o.add(b(C.tor(0.12, 0.014, 20), t.gold, { p: [0, 0.3, 0] }));
        break;
      case "bow":
        o.add(
          b(C.tor(0.45, 0.018, 24, Math.PI), t.goldDark, {
            p: [0, 0.2, 0],
            r: [0, 0, -Math.PI / 2],
          }),
        );
        break;
      default:
        (o.add(wt(t.leatherBlack, 0.02, 0.7, [0, 0.25, 0])),
          o.add(ht(t.bone, 0.1, 0.02, [0, 0.62, 0], [Math.PI / 2, 0, 0])));
        break;
    }
    return (o.flush(e), e);
  }
  var ea = [
    "sword",
    "mace",
    "trident",
    "axe",
    "spear",
    "shield",
    "chakra",
    "sword",
    "mace",
  ];
  function q0(a) {
    let t = mt(),
      o = a.S || 1,
      e = a.skin,
      s = a.cw || 1,
      i = a.sh || 1,
      n = new j.Group(),
      r = new j.Group();
    (r.scale.setScalar(o), n.add(r));
    let l = {
        root: n,
        body: r,
        S: o,
        spec: a,
        hipH: 0.96,
        shx: 0.285 * i * s,
        ph: Math.random() * 6,
        s: { lean: 0 },
        init: !1,
        sway: [],
        heads: [],
      },
      c = new j.Group();
    (c.position.set(0, l.hipH, 0), r.add(c));
    let g = new j.Group();
    (g.position.set(0, 0.1, 0), c.add(g));
    let v = new j.Group();
    (v.position.set(0, 0.2, 0), g.add(v));
    let y = new tt();
    y.add(
      b(
        xt(
          [
            { p: [0, -0.16, 0], rx: 0.15 * s, ry: 0.11 },
            { p: [0, -0.06, 0], rx: 0.2 * s, ry: 0.125 },
            { p: [0, 0.05, 0], rx: 0.185 * s, ry: 0.12 },
            { p: [0, 0.13, 0], rx: 0.175 * s, ry: 0.115 },
          ],
          { radial: 20 },
        ),
        e,
      ),
    );
    let M = a.dhoti,
      z = new j.CylinderGeometry(0.215 * s, 0.36 * s, 0.68, 56, 6, !0),
      w = z.attributes.position;
    for (let f = 0; f < w.count; f++) {
      let x = w.getX(f),
        k = w.getY(f),
        h = w.getZ(f),
        _ = Math.atan2(h, x),
        F =
          1 +
          0.055 * Math.sin(_ * 14) * (0.4 + (0.34 - k) * 0.9) +
          0.02 * Math.sin(_ * 5 + k * 4);
      w.setXYZ(f, x * F, k, h * F);
    }
    (z.computeVertexNormals(),
      y.add(b(z, M, { p: [0, -0.28, 0.01], s: [1, 1, 1.08] })),
      y.add(
        b(C.tor(0.34 * s, 0.014, 40), a.trim || t.gold, {
          p: [0, -0.62, 0.01],
          r: [Math.PI / 2, 0, 0],
          s: [1, 1.08, 1],
        }),
      ),
      y.add(
        b(C.tor(0.215 * s, 0.034, 30), a.belt || t.gold, {
          p: [0, 0.07, 0.005],
          r: [Math.PI / 2, 0, 0],
          s: [1, 1, 1],
        }),
      ));
    for (let f = 0; f < 10; f++) {
      let x = (f / 10) * Math.PI * 2;
      y.add(
        B(t.gemRed, 0.014, [
          Math.cos(x) * 0.222 * s,
          0.07,
          Math.sin(x) * 0.226,
        ]),
      );
    }
    (y.add(B(a.belt || t.gold, 0.06, [0, 0.07, 0.235], [1, 1, 0.5])),
      y.add(B(t.gemRed, 0.026, [0, 0.07, 0.255])),
      y.add(
        gt(
          a.sash || t.dhotiRed,
          0.16,
          0.6,
          0.012,
          [0.07, -0.38, 0.27499999999999997],
          [0.05, 0, 0.08],
        ),
      ),
      y.add(
        gt(
          a.trim || t.gold,
          0.16,
          0.02,
          0.016,
          [0.07, -0.66, 0.275],
          [0.05, 0, 0.08],
        ),
      ),
      y.flush(c),
      (l.legs = {}));
    let S = Nt(
        W0,
        [
          [0, 0.098, 0.1],
          [0.3, 0.093, 0.094],
          [1, 0.058, 0.06],
        ],
        14,
        12,
      ),
      P = Nt(
        ce,
        [
          [0, 0.058],
          [0.22, 0.062, 0.066],
          [0.7, 0.042],
          [1, 0.034],
        ],
        12,
        12,
      ),
      W = xt(
        [
          { p: [0, 0, -0.05], rx: 0.036, ry: 0.035 },
          { p: [0, -0.045, -0.02], rx: 0.044, ry: 0.032 },
          { p: [0, -0.06, 0.08], rx: 0.048, ry: 0.024 },
          { p: [0, -0.058, 0.16], rx: 0.04, ry: 0.02 },
          { p: [0, -0.052, 0.2], rx: 0.02, ry: 0.014 },
        ],
        { radial: 10 },
      );
    for (let f of [1, -1]) {
      let x = new j.Group();
      (x.position.set(f * 0.115 * s, -0.05, 0), c.add(x));
      let k = new j.Group();
      (k.position.set(0, -W0, 0), x.add(k));
      let h = new j.Group();
      (h.position.set(0, -ce, 0), k.add(h));
      let _ = new tt();
      (_.add(b(S, e)), _.add(B(e, 0.074, [0, -W0 * 0.02, 0])), _.flush(x));
      let F = new tt();
      (F.add(b(P, e)),
        F.add(B(e, 0.062, [0, 0, 0])),
        F.add(ht(t.gold, 0.05, 0.012, [0, -0.38, 0], [Math.PI / 2, 0, 0])),
        F.add(ht(t.gold, 0.046, 0.007, [0, -0.34, 0], [Math.PI / 2, 0, 0])),
        F.flush(k));
      let N = new tt();
      N.add(b(W, e));
      for (let q = -1; q <= 1; q++)
        N.add(B(e, 0.012, [q * 0.016, -0.052, 0.2]));
      (N.add(
        b(C.box(), t.gold, { p: [0, -0.066, 0.06], s: [0.07, 0.01, 0.2] }),
      ),
        N.flush(h),
        (l.legs[f] = { up: x, lo: k, ft: h }));
    }
    let H = s,
      K = xt(
        [
          [-0.3, 0.178, 0.116],
          [-0.16, 0.19, 0.126],
          [0, 0.222, 0.142],
          [0.12, 0.262, 0.158],
          [0.24, 0.31, 0.168],
          [0.32, 0.318, 0.152],
          [0.385, 0.25, 0.122],
          [0.43, 0.13, 0.09],
        ].map(([f, x, k]) => ({ p: [0, f, 0], rx: x * H, ry: k })),
        { radial: 24 },
      );
    y.add(b(K, e));
    for (let f of [-1, 1]) {
      (y.add(B(e, 1, [f * 0.118 * H, 0.215, 0.118], [0.128 * H, 0.092, 0.07])),
        y.add(B(e, 1, [f * 0.14 * H, 0.385, -0.02], [0.13, 0.055, 0.09])));
      for (let x = 0; x < 3; x++)
        y.add(
          B(
            e,
            1,
            [f * 0.05, 0 - x * 0.085, 0.127 - x * 0.004],
            [0.046 * H, 0.036, 0.03],
          ),
        );
      y.add(B(e, 1, [f * 0.19 * H, -0.11, 0.07], [0.04, 0.09, 0.05]));
    }
    if ((y.add(wt(e, 0.062, 0.14, [0, 0.45, 0.01])), a.thread))
      y.add(
        b(
          Dt(
            [
              [0.2 * H, 0.37, 0.05],
              [0.12 * H, 0.24, 0.16],
              [-0.02, 0.07, 0.172],
              [-0.13 * H, -0.1, 0.15],
              [-0.19 * H, -0.26, 0.1],
            ],
            0.0065,
            0.0065,
            16,
            6,
          ),
          t.pearl,
        ),
      );
    if (a.garland) {
      let f = [];
      for (let x = 0; x <= 14; x++) {
        let k = x / 14,
          h = Math.PI * (0.1 + 0.8 * k);
        f.push([
          Math.cos(h) * 0.23 * H,
          0.36 - Math.sin(h) * 0.3 + 0.02,
          0.07 + Math.sin(h) * 0.1,
        ]);
      }
      y.add(b(Dt(f, 0.018, 0.018, 24, 8), t.leaf));
      for (let x = 0; x < 26; x++) {
        let k = x / 25,
          h = f[Math.min(14, Math.floor(k * 14))];
        y.add(
          B(x % 3 ? t.flower : t.flowerW, 0.019, [
            h[0] + Math.sin(x * 2) * 0.01,
            h[1] - 0.005,
            h[2] + 0.014,
          ]),
        );
      }
    }
    for (let [f, x, k, h] of [
      [0.17, 0.4, 0.05, t.gold],
      [0.19, 0.33, 0.08, t.pearl],
      [0.21, 0.27, 0.1, t.goldDark],
    ])
      y.add(
        b(C.tor(f * H, 0.012, 28), h, {
          p: [0, x, k],
          r: [Math.PI / 2.35, 0, 0],
          s: [1, 1.05, 1],
        }),
      );
    if (
      (y.add(B(t.gemRed, 0.028, [0, 0.17, 0.2])),
      y.add(B(t.gold, 0.04, [0, 0.17, 0.177], [1, 1, 0.5])),
      a.armor)
    ) {
      y.add(
        b(C.tor(0.255 * H, 0.03, 30, Math.PI * 1.3), t.gold, {
          p: [0, 0.35, 0.02],
          r: [Math.PI / 2.1, 0, Math.PI * 0.85],
        }),
      );
      for (let f of [-1, 1])
        y.add(B(t.gold, 1, [f * 0.26 * H, 0.33, 0.035], [0.075, 0.075, 0.075]));
    }
    y.flush(v);
    let I = new j.Group();
    (I.position.set(0, 0.38, 0), v.add(I));
    let at = new j.Group();
    if ((at.position.set(0, 0.2, 0), I.add(at), !a.extra)) {
      let f = D0({ ...a.head, skin: e });
      (at.add(f), (l.headObj = f), (l.hair = f.userData.hair || null));
    } else l.hair = null;
    ((l.neck = I), (l.head = at), (l.arms = {}));
    let dt = Nt(
        U0,
        [
          [0, 0.064 * i, 0.066 * i],
          [0.3, 0.07 * i, 0.07 * i],
          [0.65, 0.056 * i],
          [1, 0.045],
        ],
        14,
        10,
      ),
      R = Nt(
        _0,
        [
          [0, 0.047],
          [0.25, 0.054, 0.052],
          [0.7, 0.04],
          [1, 0.032],
        ],
        12,
        10,
      );
    for (let f of [1, -1]) {
      let x = new j.Group();
      (x.position.set(f * l.shx, 0.3, 0), v.add(x));
      let k = new j.Group();
      (k.position.set(0, -U0, 0), x.add(k));
      let h = new j.Group();
      (h.position.set(0, -_0, 0), k.add(h));
      let _ = new tt();
      if (
        (_.add(b(dt, e)),
        _.add(
          B(
            a.pauldron || e,
            a.pauldron ? 0.11 : 0.085,
            [0, 0, 0],
            [1.1, 1, 1.05],
          ),
        ),
        _.add(ht(t.gold, 0.072 * i, 0.017, [0, -0.1, 0], [Math.PI / 2, 0, 0])),
        _.add(B(t.gemRed, 0.014, [f * 0.07, -0.1, 0.02])),
        a.pauldron)
      )
        for (let q = 0; q < 4; q++)
          _.add(
            Z(
              t.gold,
              0.022,
              0.1,
              [f * (0.04 + q * 0.03), 0.1 - q * 0.015, 0],
              [0, 0, -f * (0.5 + q * 0.28)],
            ),
          );
      _.flush(x);
      let F = new tt();
      (F.add(b(R, e)),
        F.add(B(e, 0.05, [0, 0, 0])),
        F.add(
          b(C.cyl(), a.bracer || t.gold, {
            p: [0, -0.15, 0],
            s: [0.05, 0.13, 0.05],
          }),
        ),
        F.add(ht(t.gold, 0.05, 0.007, [0, -0.085, 0], [Math.PI / 2, 0, 0])),
        F.add(ht(t.gold, 0.048, 0.007, [0, -0.215, 0], [Math.PI / 2, 0, 0])),
        F.flush(k));
      let N = new tt();
      (N.add(B(e, 0.052, [0, -0.02, 0], [0.9, 1.1, 0.9])),
        N.add(B(e, 0.026, [f * 0.03, -0.045, 0.03])));
      for (let q = 0; q < 4; q++)
        N.add(B(e, 0.014, [-0.03 + q * 0.02, -0.07, 0.02]));
      (N.add(ht(t.gold, 0.02, 0.005, [0, -0.045, 0], [Math.PI / 2, 0, 0])),
        N.flush(h),
        (l.arms[f] = { up: x, fo: k, hand: h }));
    }
    if (a.bow) {
      let f = Xa(a.bow);
      (f.scale.setScalar(a.bowScale || 1), v.add(f), (l.bow = f));
    }
    if (a.quiver) {
      let f = new j.Group(),
        x = new tt();
      (f.position.set(-0.07, 0.28, -0.2),
        f.rotation.set(0.1, 0, 0.42),
        v.add(f));
      let k = a.quiver === "rav";
      (x.add(
        b(
          Nt(
            0.7,
            [
              [0, 0.075],
              [1, 0.062],
            ],
            14,
            4,
          ),
          k ? t.leatherBlack : t.gold,
          { p: [0, 0.3, 0] },
        ),
      ),
        x.add(ht(t.gold, 0.075, 0.015, [0, 0.27, 0], [Math.PI / 2, 0, 0])),
        x.add(ht(t.gold, 0.07, 0.015, [0, -0.2, 0], [Math.PI / 2, 0, 0])),
        x.add(B(t.gemRed, 0.02, [0, 0, 0.075])));
      for (let h = 0; h < 9; h++) {
        let _ = h * 0.9;
        (x.add(
          wt(t.wood, 0.007, 0.34, [
            Math.cos(_) * 0.035,
            0.5,
            Math.sin(_) * 0.035,
          ]),
        ),
          x.add(
            gt(
              k ? t.plumeRav : t.plumeRama,
              0.07,
              0.1,
              0.006,
              [Math.cos(_) * 0.035, 0.62, Math.sin(_) * 0.035],
              [0, _, 0],
            ),
          ));
      }
      x.flush(f);
    }
    if (a.cape) {
      let f = i0(1.35, 0.7, a.cape, 12, 5);
      ((f.rotation.z = -Math.PI / 2),
        f.position.set(0, 0.42, -0.2),
        v.add(f),
        (l.cape = f));
    }
    if (a.scarf) {
      let f = i0(1.2, 0.2, a.scarf, 14, 2);
      (f.position.set(0.16, 0.38, -0.12),
        f.rotation.set(0, Math.PI, 0.35),
        v.add(f),
        (l.scarf = f));
    }
    if (a.extra) {
      let f = new j.Group();
      (at.add(f), (l.headsG = f), (l.tf = { v: 1 }));
      let x = 0.205;
      for (let N = 0; N < 10; N++) {
        let q = new j.Group();
        f.add(q);
        let ft = D0({
          ...a.head,
          skin: e,
          angry: 0.55 + (N % 3) * 0.2,
          brow: 0.1 + (N % 2) * 0.05,
          chin: 0.12 + (N % 4) * 0.02,
          moustache: !0,
          beard: N % 3 === 0,
          tusks: N % 2 === 0,
          hair: !1,
          crown: "rav",
          tilak: "rav",
        });
        q.add(ft);
        let It = b(C.cyl(), e, { p: [0, -0.2, 0], s: [0.085, 0.13, 0.085] });
        (q.add(It),
          l.heads.push({ g: q, i: N, x: (N - 4.5) * x, d: Math.abs(N - 4.5) }));
      }
      l.headObj = l.heads[5].g;
      let k = new tt();
      (k.add(
        b(C.cyl(), e, {
          p: [0, 0, 0],
          r: [0, 0, Math.PI / 2],
          s: [0.1, 2, 0.1],
        }),
      ),
        k.add(
          b(C.cyl(), t.gold, {
            p: [0, 0, 0],
            r: [0, 0, Math.PI / 2],
            s: [0.112, 0.9, 0.112],
          }),
        ));
      let h = new j.Group();
      (h.position.set(0, -0.27, -0.01), f.add(h), k.flush(h), (l.yoke = h));
      let _ = new j.Group();
      (v.add(_), (l.extraArms = _));
      let F = new tt();
      for (let N of [1, -1])
        for (let q = 0; q < 9; q++) {
          let ft = ((18 + q * 15) * Math.PI) / 180,
            It = [N * Math.sin(ft), Math.cos(ft)],
            Gt = -0.1 - q * 0.012,
            bt = [N * 0.25 * H, 0.3, Gt],
            Vt = [bt[0] + It[0] * 0.3, bt[1] + It[1] * 0.3, Gt - 0.02],
            e0 = [
              Vt[0] + It[0] * 0.26 + N * 0.02,
              Vt[1] + It[1] * 0.26,
              Gt + 0.1,
            ];
          (F.add(P0(e, bt, Vt, 0.055, 0.045)),
            F.add(B(e, 0.047, Vt)),
            F.add(P0(e, Vt, e0, 0.043, 0.032)),
            F.add(B(e, 0.042, e0, [1, 1.1, 1])),
            F.add(
              ht(
                t.gold,
                0.05,
                0.013,
                [(bt[0] + Vt[0]) / 2, (bt[1] + Vt[1]) / 2, Gt - 0.01],
                [Math.PI / 2 - Math.atan2(It[1], 1) * 0, 0, 0],
              ),
            ));
          let l0 = Za(ea[q]),
            Z0 = new j.Quaternion().setFromUnitVectors(
              he,
              new j.Vector3(It[0] * 0.8, It[1] * 0.8, 0.45).normalize(),
            );
          (l0.quaternion.copy(Z0),
            l0.position.set(e0[0], e0[1], e0[2]),
            l0.scale.setScalar(ea[q] === "shield" ? 0.9 : 0.85),
            F.add(l0));
        }
      F.flush(_);
    }
    return (
      (l.pelvis = c),
      (l.spine = g),
      (l.chest = v),
      r.traverse((f) => {
        if (f.isMesh) f.castShadow = !0;
      }),
      l
    );
  }
  var Qa = G(),
    $a = G(),
    Ja = G(),
    to = G(),
    eo = G(),
    ao = G(),
    oo = new j.Quaternion();
  function le(a, t, o, e, s, i) {
    let n = a.position,
      r = Qa.copy(s).sub(n),
      l = r.length() || 0.0001;
    (r.divideScalar(l), (l = ot(l, Math.abs(o - e) + 0.02, o + e - 0.004)));
    let c = Math.acos(ot((o * o + l * l - e * e) / (2 * o * l), -1, 1)),
      g = $a.copy(i);
    if ((g.addScaledVector(r, -g.dot(r)), g.lengthSq() < 0.000001))
      g.set(0, 0, 1).addScaledVector(r, -r.z);
    g.normalize();
    let v = Ja.copy(n)
        .addScaledVector(r, o * Math.cos(c))
        .addScaledVector(g, o * Math.sin(c)),
      y = to.copy(n).addScaledVector(r, l);
    (a.quaternion.setFromUnitVectors(Je, eo.copy(v).sub(n).normalize()),
      t.quaternion.setFromUnitVectors(
        Je,
        ao
          .copy(y)
          .sub(v)
          .normalize()
          .applyQuaternion(oo.copy(a.quaternion).invert()),
      ));
  }
  var I0 = (a) => ((a = a < 0 ? 0 : a > 1 ? 1 : a), a * a * (3 - 2 * a)),
    so = {
      draw: 14,
      aim: 7,
      crouch: 14,
      lean: 8,
      cast: 9,
      kick: 40,
      glow: 8,
      nock: 12,
      aimUp: 7,
      roar: 6,
    },
    s0 = G(),
    Wt = G(),
    aa = G(),
    C0 = G(),
    B0 = G(),
    de = G(),
    V0 = G(),
    F0 = G(),
    u0 = G(),
    oa = G(),
    sa = new j.Matrix4(),
    Vo = new j.Quaternion(),
    r0 = G(),
    Fo = G(),
    ro = [null, G(0.12, 0.05, 1), G(-0.12, 0.05, 1)];
  function L0(a, t, o, e, s, i = {}) {
    let n = a.s;
    if (!a.init) {
      for (let R in e) if (typeof e[R] === "number") n[R] = e[R];
      a.init = !0;
    }
    for (let R in e)
      if (typeof e[R] === "number") n[R] = Et(n[R] ?? 0, e[R], so[R] || 10, t);
    let {
        body: r,
        pelvis: l,
        spine: c,
        chest: g,
        neck: v,
        head: y,
        root: M,
      } = a,
      z = !!i.drive;
    M.updateWorldMatrix(!0, !1);
    let w = 0,
      S = 0;
    if (s && !z)
      (s0.copy(s), M.worldToLocal(s0), (w = Math.atan2(-s0.z, s0.x) + 0.5));
    r.rotation.y += A0(w - r.rotation.y) * (1 - Math.exp(-6 * t));
    let P =
      Math.sin(o * 1.7 + a.ph) * 0.006 +
      (i.speed
        ? Math.sin(o * 15 + a.ph) * 0.01 * Math.min(1, i.speed / 12)
        : 0);
    ((l.position.y =
      a.hipH -
      n.crouch * 0.12 +
      P +
      ((i.walk || 0) > 0.01 ? Math.abs(Math.sin(a.wph || 0)) * 0.03 : 0)),
      (l.rotation.y = 0),
      (c.rotation.y = -0.18 * n.aim * (z ? 0 : 1) + n.cast * 0.1),
      (c.rotation.x = n.crouch * 0.18 - n.kick * 0.1 - n.cast * 0.12),
      (c.rotation.z = (n.lean || 0) * 0.12),
      (g.scale.y = 1 + Math.sin(o * 1.9 + a.ph) * 0.008),
      r.updateWorldMatrix(!0, !0));
    let W = i.walk || 0,
      H = i.air || 0;
    a.wph = (a.wph || 0) + t * W;
    for (let R of [1, -1]) {
      let f = a.legs[R];
      if (W > 0.01 || H > 0.01) {
        let x = a.wph + (R > 0 ? 0 : Math.PI),
          k = Math.sin(x),
          h = Math.max(0, Math.cos(x)) * 0.2 * Math.min(1, W);
        r0.set(
          R * 0.16 + k * 0.34 * Math.min(1, W) * (1 - H) + H * R * 0.25,
          h + H * 0.5 + (R < 0 ? H * 0.12 : 0),
          H * 0.05,
        );
      } else r0.set(R * 0.3, 0, z ? (R > 0 ? 0.1 : -0.12) : R > 0 ? 0 : -0.04);
      (r.localToWorld(r0),
        l.worldToLocal(r0),
        le(f.up, f.lo, W0, ce, r0, ro[R > 0 ? 1 : 2]),
        f.ft.quaternion
          .copy(f.up.quaternion)
          .multiply(f.lo.quaternion)
          .invert());
    }
    if ((c.updateWorldMatrix(!0, !0), Wt.set(0, 0, 1), s && !z))
      (s0.copy(s),
        g.worldToLocal(s0),
        Wt.copy(s0).sub(aa.set(0, 0.3, 0)),
        (Wt.y += n.aimUp * Wt.length() * 0.9),
        Wt.normalize(),
        (S = Math.atan2(Wt.x, Wt.z)));
    let K = ot(S, -1.5, 1.5);
    if (
      ((v.rotation.y = K * 0.38),
      (y.rotation.y = ot(K * 0.55, -0.85, 0.85)),
      (y.rotation.x = -0.05 - n.roar * 0.15 + n.cast * -0.1),
      (y.rotation.z = K > 0 ? -0.04 : 0),
      a.hair)
    )
      a.hair.rotation.x =
        0.1 + Math.sin(o * 2.1 + a.ph) * 0.07 + (i.speed || 0) * 0.014;
    if (a.cape)
      a.cape.userData.update(o, 0.6 + Math.min(1.4, (i.speed || 0) / 8));
    if (a.scarf)
      a.scarf.userData.update(o, 0.8 + Math.min(1.4, (i.speed || 0) / 8));
    if (a.heads.length) {
      let R = a.tf.v;
      for (let f of a.heads) {
        let x =
            f.d < 1 ? I0((R - 0) / 0.55) : I0((R - 0.1 * (f.d - 0.5)) / 0.55),
          k = f.i === 5;
        f.g.position.set(k ? f.x * x : f.x * x, 0, k ? 0 : -0.1 * (1 - x));
        let h = k ? 1 : 0.35 + 0.65 * x;
        (f.g.scale.setScalar(h * (1 - 0.012 * f.d)),
          (f.g.visible = k || R > 0.001),
          (f.g.rotation.y =
            f.x * 0.22 * x +
            ot(K * 0.4, -0.6, 0.6) +
            Math.sin(o * 0.9 + f.i * 1.7) * 0.1 * x),
          (f.g.rotation.x =
            -n.roar * 0.15 + Math.sin(o * 1.3 + f.i) * 0.035 * x),
          (f.g.rotation.z = -f.x * 0.04 * x));
      }
      ((a.yoke.scale.x = 0.04 + 0.96 * I0(R / 0.5)),
        (a.yoke.visible = !1),
        a.extraArms.scale.setScalar(0.001 + 0.999 * I0((R - 0.25) / 0.6)),
        (a.extraArms.visible = !1),
        (a.extraArms.rotation.z = Math.sin(o * 1.1) * 0.015),
        (a.extraArms.rotation.x = Math.sin(o * 0.8) * 0.02 - n.roar * 0.04));
    }
    let I = a.arms[1].up.position,
      at = a.arms[-1].up.position,
      dt = a.shx;
    if (z)
      (C0.set(dt * 0.75, 0.02 + Math.sin(o * 3) * 0.01, 0.52),
        B0.set(-dt * 0.75, 0.02 + Math.sin(o * 3 + 1) * 0.01, 0.52),
        de.set(0.5, -1, -0.1),
        V0.set(-0.5, -1, -0.1));
    else {
      let R = n.aim;
      if (
        (C0.set(dt + 0.05, -0.15, 0.3).lerp(
          aa.copy(I).addScaledVector(Wt, 0.575),
          R,
        ),
        B0.set(-dt - 0.05, -0.15, 0.2),
        a.bow)
      ) {
        let f = a.bow,
          x = f.userData,
          k = -(0.22 + 0.62 * n.draw);
        if ((F0.copy(Wt), u0.crossVectors(he, F0), u0.lengthSq() < 0.000001))
          u0.set(1, 0, 0);
        (u0.normalize(),
          oa.crossVectors(F0, u0),
          sa.makeBasis(u0, oa, F0),
          f.quaternion.setFromRotationMatrix(sa),
          f.position.copy(C0),
          f.updateMatrix(),
          r0.set(0, 0, k).applyMatrix4(f.matrix),
          B0.lerp(r0, R),
          x.update(k),
          (x.arrow.visible = n.nock > 0.5 && R > 0.3 && n.kick < 0.5),
          (x.glow.material.opacity = 0.35 + n.glow * 0.65),
          x.glow.scale.setScalar(0.3 + n.glow * 1.4));
      }
      (de.set(0.1, -1, -0.35),
        V0.copy(Wt).multiplyScalar(-1),
        (V0.y += 0.45 + n.cast * 0.3));
    }
    (le(a.arms[1].up, a.arms[1].fo, U0, _0, C0, de),
      le(a.arms[-1].up, a.arms[-1].fo, U0, _0, B0, V0));
  }
  function ra(a, t) {
    return a.bow.userData.arrow.localToWorld(t.copy(a.bow.userData.tip));
  }
  function fe() {
    let a = mt();
    return q0({
      S: 1,
      skin: a.skinRama,
      cw: 1,
      sh: 1,
      dhoti: a.dhotiYellow,
      trim: a.gold,
      belt: a.gold,
      sash: a.dhotiRed,
      thread: !0,
      garland: !0,
      bow: "rama",
      quiver: "rama",
      scarf: a.saffron,
      head: {
        w: 0.09,
        h: 0.124,
        d: 0.106,
        brow: 0.045,
        chin: 0.08,
        hollow: 0.03,
        angry: 0.05,
        eye: a.eyeRama,
        lip: a.lip,
        hair: !0,
        crown: "rama",
        tilak: "rama",
      },
    });
  }
  function pe() {
    let a = mt();
    return q0({
      S: 1.22,
      skin: a.skinRav,
      cw: 1.22,
      sh: 1.2,
      dhoti: a.dhotiRed,
      trim: a.gold,
      belt: a.gold,
      sash: a.dhotiBlack,
      armor: !0,
      pauldron: a.gold,
      bracer: a.goldDark,
      bow: "rav",
      bowScale: 1.1,
      quiver: "rav",
      cape: a.dhotiBlack,
      extra: !0,
      head: {
        w: 0.1,
        h: 0.126,
        d: 0.112,
        brow: 0.12,
        chin: 0.14,
        hollow: 0.1,
        angry: 0.85,
        jaw: 0.5,
        eye: a.eyeRav,
        lip: a.lipRav,
        hair: !1,
        crown: "rav",
        tilak: "rav",
        moustache: !0,
        tusks: !0,
        beard: !0,
        ringMat: a.gold,
      },
    });
  }
  function N0(a) {
    let t = mt();
    if (a === "matali")
      return q0({
        S: 0.9,
        skin: t.skinMatali,
        cw: 0.92,
        dhoti: t.dhotiWhite,
        trim: t.gold,
        belt: t.goldDark,
        sash: t.dhotiBlue,
        head: {
          w: 0.088,
          h: 0.12,
          d: 0.104,
          brow: 0.05,
          chin: 0.08,
          eye: t.eyeMat,
          lip: t.lip,
          crown: "helm",
          hair: !1,
          moustache: !0,
        },
      });
    return q0({
      S: 0.98,
      skin: t.skinDemon,
      cw: 1.05,
      sh: 1.05,
      dhoti: t.dhotiBlack,
      trim: t.goldDark,
      belt: t.iron,
      sash: t.dhotiRed,
      head: {
        w: 0.096,
        h: 0.122,
        d: 0.108,
        brow: 0.12,
        chin: 0.12,
        hollow: 0.08,
        angry: 0.7,
        eye: t.eyeRav,
        lip: t.lipRav,
        crown: "horns",
        hair: !1,
        tusks: !0,
      },
    });
  }
  var M0 = new D.Vector3(0.5, 0.3, 0.72).normalize();
  function ia() {
    let a = new D.ShaderMaterial({
        side: D.BackSide,
        depthWrite: !1,
        fog: !1,
        uniforms: {
          uSun: { value: M0.clone() },
          uTime: { value: 0 },
          uDark: { value: 0 },
          uGold: { value: 0 },
          uFlash: { value: 0 },
        },
        vertexShader:
          "varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }",
        fragmentShader: `uniform vec3 uSun; uniform float uTime, uDark, uGold, uFlash; varying vec3 vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0.0, b = 0.5; for(int i=0;i<5;i++){ a += b*n(p); p = p*2.03 + 7.3; b *= 0.5; } return a; }
      void main(){
        vec3 d = normalize(vD); float y = d.y;
        vec3 hor = vec3(2.3,0.82,0.30), low = vec3(1.1,0.30,0.22), mid = vec3(0.42,0.13,0.30), top = vec3(0.05,0.06,0.2);
        vec3 c = mix(hor, low, smoothstep(0.0,0.12,y)); c = mix(c, mid, smoothstep(0.1,0.42,y)); c = mix(c, top, smoothstep(0.35,1.0,y));
        float sd = max(dot(d, uSun), 0.0);
        c += vec3(1.9,0.85,0.34) * pow(sd, 6.0) * 0.8 + vec3(9.0,6.0,3.0) * pow(sd, 400.0) * 3.0 + vec3(4.0,2.2,1.0) * pow(sd, 60.0);
        // clouds
        if (y > -0.02) {
          vec2 q = d.xz / (y + 0.22) * 1.3 + vec2(uTime * 0.004, 0.0);
          float cl = smoothstep(0.42, 0.78, fbm(q * 1.6)), cl2 = smoothstep(0.5, 0.85, fbm(q * 3.1 + 4.0));
          float lit = pow(sd, 3.0);
          vec3 under = mix(vec3(0.22,0.07,0.16), vec3(0.8,0.28,0.2), smoothstep(0.0,0.3,y)); vec3 rim = vec3(2.6,1.15,0.45) * (0.25 + lit * 1.6);
          vec3 cc = mix(under, rim, clamp(fbm(q * 4.0 + 1.0) * 0.9 + lit * 0.6, 0.0, 1.0));
          float a = clamp(cl * 0.85 + cl2 * 0.25, 0.0, 1.0) * smoothstep(-0.02, 0.1, y);
          c = mix(c, cc, a);
        }
        // smoke bank on horizon (Lanka burning)
        float sm = fbm(vec2(atan(d.x, d.z) * 3.0, y * 6.0) + uTime * 0.01) ; c = mix(c, vec3(0.16,0.07,0.05), smoothstep(0.18, 0.0, y) * smoothstep(0.35, 0.8, sm) * 0.7);
        if (y < 0.0) c = mix(c, vec3(0.5,0.2,0.1), smoothstep(0.0,-0.3,y));
        c = mix(c, vec3(0.012,0.0,0.03) + vec3(0.9,0.05,0.04) * pow(max(0.0, fbm(d.xz * 9.0 + uTime * 2.0) - 0.62), 2.0) * 6.0 * step(0.95, fract(uTime * 3.1)), uDark);
        c += vec3(2.0,1.4,0.6) * uGold * (0.5 + 0.5 * smoothstep(0.0, 1.0, y)) + vec3(1.0) * uFlash;
        gl_FragColor = vec4(c, 1.0);
      }`,
      }),
      t = new D.Mesh(new D.SphereGeometry(1, 32, 20), a);
    return (
      t.scale.setScalar(2000),
      (t.frustumCulled = !1),
      (t.renderOrder = -10),
      (t.material = a),
      t
    );
  }
  var kt = (a, t) => {
    let o = Math.hypot(a, t),
      e = ot((o - 140) / 420, 0, 1),
      s =
        (zt(a * 0.0021 + 0.3, t * 0.0021 + 0.7, 4, 11, 5) - 0.4) * 150 * e * e,
      i =
        (zt(a * 0.03, t * 0.03, 16, 3, 3) - 0.5) *
        1.4 *
        (0.4 + ot(o / 150, 0, 1)),
      n = -Math.max(0, 1 - Math.hypot(a - 20, t + 40) / 9) * 1.2;
    return s + i + n;
  };
  function na() {
    let o = new D.PlaneGeometry(2600, 2600, 220, 220);
    o.rotateX(-Math.PI / 2);
    let e = o.attributes.position,
      s = new Float32Array(e.count * 3),
      i = Lt(5),
      n = new D.Color();
    for (let g = 0; g < e.count; g++) {
      let v = e.getX(g),
        y = e.getZ(g),
        M = kt(v, y);
      e.setY(g, M);
      let z = Math.hypot(v, y),
        w = zt(v * 0.006, y * 0.006, 8, 2, 4),
        S = ot(1 - z / 120, 0, 1);
      if (
        (n
          .setRGB(0.55 + w * 0.75, 0.42 + w * 0.55, 0.34 + w * 0.4)
          .multiplyScalar(1 - S * 0.35 + (i() - 0.5) * 0.06),
        M > 22)
      )
        n.lerp(new D.Color(0.35, 0.25, 0.28), ot((M - 22) / 60, 0, 0.7));
      ((s[g * 3] = n.r), (s[g * 3 + 1] = n.g), (s[g * 3 + 2] = n.b));
    }
    (o.setAttribute("color", new D.BufferAttribute(s, 3)),
      o.computeVertexNormals());
    let r = Le(),
      l = new D.MeshStandardMaterial({
        map: r.map,
        bumpMap: r.bump,
        bumpScale: 3.5,
        vertexColors: !0,
        roughness: 0.95,
        metalness: 0,
      }),
      c = new D.Mesh(o, l);
    return ((c.receiveShadow = !0), c);
  }
  function la() {
    let a = new D.Group(),
      t = Lt(11),
      o = new D.MeshStandardMaterial({
        vertexColors: !0,
        roughness: 1,
        flatShading: !0,
      });
    for (let e = 0; e < 30; e++) {
      let s = (e / 30) * Math.PI * 2 + t() * 0.2,
        i = 800 + t() * 400,
        n = 220 + t() * 260,
        r = 120 + t() * 200,
        l = new D.IcosahedronGeometry(1, 3),
        c = l.attributes.position,
        g = new Float32Array(c.count * 3);
      for (let y = 0; y < c.count; y++) {
        let M = c.getX(y),
          z = c.getY(y),
          w = c.getZ(y),
          S = zt(M * 0.8 + e, w * 0.8 + z * 0.5, 4, 3, 4);
        z = Math.max(z, -0.15);
        let P = (z + 0.15) * (0.7 + S * 0.9);
        c.setXYZ(
          y,
          M * n * (1 - Math.max(0, z) * 0.55),
          P * r,
          w * n * (1 - Math.max(0, z) * 0.55),
        );
        let W = ot(P, 0, 1);
        ((g[y * 3] = 0.16 + W * 0.22),
          (g[y * 3 + 1] = 0.09 + W * 0.12),
          (g[y * 3 + 2] = 0.14 + W * 0.1));
      }
      (l.setAttribute("color", new D.BufferAttribute(g, 3)),
        l.computeVertexNormals());
      let v = new D.Mesh(l, o);
      (v.position.set(Math.sin(s) * i, -8, Math.cos(s) * i),
        (v.rotation.y = t() * 6),
        a.add(v));
    }
    return a;
  }
  function da() {
    let a = mt(),
      t = new D.Group(),
      o = Lt(21),
      e = Qe(),
      s = new D.MeshStandardMaterial({
        color: 15259312,
        map: e.map,
        emissive: 16777215,
        emissiveMap: e.emit,
        emissiveIntensity: 0.9,
        roughness: 0.6,
      }),
      i = a.gold,
      n = new tt(),
      r = (g, v, y, M) => {
        let z = new D.Group(),
          w = 0,
          S = y,
          P = 3 + Math.floor(o() * 3);
        for (let W = 0; W < P; W++) {
          let H = M / P;
          (n.add(b(C.box(), s, { p: [g, w + H / 2, v], s: [S, H, S] })),
            n.add(
              b(C.box(), i, {
                p: [g, w + H, v],
                s: [S * 1.08, H * 0.06, S * 1.08],
              }),
            ),
            (w += H),
            (S *= 0.8));
        }
        (n.add(
          b(
            new D.LatheGeometry(
              [
                [0, 0],
                [0.55, 0.05],
                [0.62, 0.3],
                [0.5, 0.65],
                [0.25, 0.9],
                [0.06, 1],
                [0, 1.05],
              ].map(([W, H]) => new D.Vector2(W * S * 0.9, H * S * 0.9)),
              20,
            ),
            i,
            { p: [g, w, v] },
          ),
        ),
          n.add(
            b(C.cone(), i, {
              p: [g, w + S * 1.2, v],
              s: [S * 0.06, S * 0.6, S * 0.06],
            }),
          ));
      };
    for (let g = 0; g < 4; g++)
      for (let v = 0; v < 12 + g * 8; v++) {
        let y = (v / (12 + g * 8)) * Math.PI * 2 + o() * 0.3,
          M = 30 + g * 45 + o() * 20,
          z = Math.cos(y) * M,
          w = Math.sin(y) * M,
          S = 28 + o() * 55 - g * 6;
        r(z, w, 9 + o() * 8, Math.max(14, S));
      }
    (r(0, 0, 40, 100), r(-30, 8, 18, 70), r(30, 8, 18, 70));
    for (let g = 0; g < 28; g++) {
      let v = (g / 28) * Math.PI * 2;
      n.add(
        b(C.box(), s, {
          p: [Math.cos(v) * 190, 9, Math.sin(v) * 190],
          s: [34, 18, 6],
          r: [0, -v + Math.PI / 2, 0],
        }),
      );
      for (let M = -2; M <= 2; M++)
        n.add(
          b(C.box(), s, {
            p: [
              Math.cos(v) * 190 + Math.cos(v + Math.PI / 2) * M * 7,
              19.5,
              Math.sin(v) * 190 + Math.sin(v + Math.PI / 2) * M * 7,
            ],
            s: [3, 3, 6.4],
            r: [0, -v + Math.PI / 2, 0],
          }),
        );
    }
    (n.flush(t, { cast: !1 }),
      (t.userData.torches = []),
      t.position.set(0, 18, 760),
      (t.rotation.y = 0.2),
      t.scale.setScalar(1.1));
    let l = new D.Mesh(
      new D.CylinderGeometry(280, 380, 40, 40),
      new D.MeshStandardMaterial({ color: 3811878, roughness: 1 }),
    );
    l.position.set(0, -2, 760);
    let c = new D.Group();
    return (c.add(l, t), c);
  }
  function ca() {
    let a = new D.Group(),
      t = Lt(33),
      o = (i, n) => {
        let r = new tt(),
          l = new D.MeshStandardMaterial({ color: 16777215, roughness: 0.8 }),
          c = new D.MeshStandardMaterial({
            color: 7829384,
            metalness: 0.9,
            roughness: 0.35,
          });
        for (let y of [-1, 1])
          r.add(
            b(C.cyl(), l, { p: [y * 0.12, 0.45, 0], s: [0.09, 0.9, 0.09] }),
          );
        if (
          (r.add(b(C.box(), l, { p: [0, 1.15, 0], s: [0.5, 0.65, 0.3] })),
          r.add(b(C.sph(), l, { p: [0, 1.62, 0], s: [0.17, 0.2, 0.17] })),
          r.add(b(C.cyl(), c, { p: [0.4, 1.4, 0.1], s: [0.025, 2.2, 0.025] })),
          r.add(b(C.cone(), c, { p: [0.4, 2.6, 0.1], s: [0.06, 0.25, 0.06] })),
          r.add(
            b(C.cyl(), c, {
              p: [-0.38, 1.2, 0.18],
              s: [0.34, 0.03, 0.34],
              r: [Math.PI / 2, 0, 0],
            }),
          ),
          n)
        )
          r.add(b(C.cone(), c, { p: [0, 1.85, 0], s: [0.12, 0.3, 0.12] }));
        let g = new D.Group();
        r.flush(g);
        let v = g.children.length > 1 ? null : g.children[0].geometry;
        return { g, mt: l, mm: c };
      },
      e = (i, n, r, l, c, g, v, y, M) => {
        let z = o(0, y),
          w = new tt();
        w.add(z.g);
        let S = new D.Group();
        (w.flush(S),
          S.children.forEach((P) => {
            let W = new D.InstancedMesh(P.geometry, P.material.clone(), i);
            W.castShadow = !1;
            let H = new D.Object3D(),
              K = new D.Color();
            for (let I = 0; I < i; I++) {
              let at = Math.floor(I / 30),
                dt = I % 30,
                R = L(n, r, at / Math.ceil(i / 30)) + (t() - 0.5) * 2.2,
                f = L(l, c, dt / 30) + (t() - 0.5) * 2.2;
              if (
                (H.position.set(R, kt(R, f), f),
                H.rotation.set(0, M + (t() - 0.5) * 0.5, 0),
                H.scale.setScalar(0.9 + t() * 0.3),
                H.updateMatrix(),
                W.setMatrixAt(I, H.matrix),
                K.copy(t() > 0.5 ? g : v).multiplyScalar(0.7 + t() * 0.5),
                P.material.color.getHex() === 16777215)
              )
                W.setColorAt(I, K);
            }
            if (W.instanceColor) W.instanceColor.needsUpdate = !0;
            a.add(W);
          }));
      };
    (e(
      780,
      -190,
      -105,
      -90,
      90,
      new D.Color(0.75, 0.4, 0.15),
      new D.Color(0.55, 0.3, 0.12),
      !1,
      Math.PI / 2,
    ),
      e(
        780,
        105,
        190,
        -90,
        90,
        new D.Color(0.18, 0.1, 0.14),
        new D.Color(0.35, 0.08, 0.08),
        !0,
        -Math.PI / 2,
      ));
    let s = [];
    for (let [i, n] of [
      [-100, "rama"],
      [-120, "rama"],
      [-145, "rama"],
      [100, "rav"],
      [120, "rav"],
      [145, "rav"],
    ])
      for (let r = -1; r <= 1; r++) {
        let l = r * 60 + (t() - 0.5) * 10,
          c = b(C.cyl(), mt().wood, {
            p: [i, kt(i, l) + 7, l],
            s: [0.14, 14, 0.14],
          });
        a.add(c);
        let g = i0(5, 3, n === "rama" ? mt().flagRama : mt().flagRav, 10, 6);
        (g.position.set(i, kt(i, l) + 12, l),
          (g.rotation.y = n === "rama" ? Math.PI / 2 : -Math.PI / 2),
          a.add(g),
          s.push(g));
      }
    return (
      (a.userData.update = (i) =>
        s.forEach((n, r) => n.userData.update(i + r, 1))),
      a
    );
  }
  function ha() {
    let a = new D.Group(),
      t = Lt(7),
      o = new D.InstancedMesh(
        new D.DodecahedronGeometry(1, 1),
        new D.MeshStandardMaterial({
          color: 5917252,
          roughness: 0.95,
          flatShading: !0,
        }),
        260,
      ),
      e = new D.Object3D();
    for (let l = 0; l < 260; l++) {
      let c = t() * 6.28,
        g = 55 + t() * 220,
        v = Math.cos(c) * g,
        y = Math.sin(c) * g,
        M = 0.4 + Math.pow(t(), 3) * 5;
      (e.position.set(v, kt(v, y) + M * 0.3, y),
        e.scale.set(M, M * (0.5 + t() * 0.5), M),
        e.rotation.set(t(), t() * 6, t()),
        e.updateMatrix(),
        o.setMatrixAt(l, e.matrix));
    }
    ((o.castShadow = !0), (o.receiveShadow = !0), a.add(o));
    let s = mt(),
      i = new D.InstancedMesh(
        new D.CylinderGeometry(0.03, 0.04, 3.2, 5),
        s.woodDark,
        220,
      ),
      n = new D.InstancedMesh(
        new D.CylinderGeometry(0.5, 0.5, 0.06, 14),
        s.bronze,
        120,
      );
    for (let l = 0; l < 220; l++) {
      let c = t() * 6.28,
        g = 52 + t() * 150,
        v = Math.cos(c) * g,
        y = Math.sin(c) * g;
      (e.position.set(v, kt(v, y) + 1.2, y),
        e.scale.setScalar(1),
        e.rotation.set((t() - 0.5) * 0.7, 0, (t() - 0.5) * 0.7),
        e.updateMatrix(),
        i.setMatrixAt(l, e.matrix));
    }
    for (let l = 0; l < 120; l++) {
      let c = t() * 6.28,
        g = 50 + t() * 150,
        v = Math.cos(c) * g,
        y = Math.sin(c) * g;
      (e.position.set(v, kt(v, y) + 0.05, y),
        e.rotation.set((t() - 0.5) * 0.3, t() * 6, (t() - 0.5) * 0.3),
        e.updateMatrix(),
        n.setMatrixAt(l, e.matrix));
    }
    a.add(i, n);
    let r = new D.MeshBasicMaterial({
      color: 1182216,
      transparent: !0,
      opacity: 0.55,
      depthWrite: !1,
      polygonOffset: !0,
      polygonOffsetFactor: -2,
      map: Xe(),
    });
    for (let l = 0; l < 40; l++) {
      let c = t() * 6.28,
        g = 20 + t() * 120,
        v = Math.cos(c) * g,
        y = Math.sin(c) * g,
        M = 6 + t() * 18,
        z = new D.Mesh(new D.PlaneGeometry(M, M), r);
      ((z.rotation.x = -Math.PI / 2),
        (z.rotation.z = t() * 6),
        z.position.set(v, kt(v, y) + 0.12, y),
        a.add(z));
    }
    return a;
  }
  function fa(a) {
    let t = new D.HemisphereLight(12891368, 9067064, 2.6);
    a.add(t);
    let o = new D.DirectionalLight(16763024, 7.5);
    ((o.castShadow = !0), o.shadow.mapSize.set(2048, 2048));
    let e = o.shadow.camera;
    ((e.left = -70),
      (e.right = 70),
      (e.top = 70),
      (e.bottom = -70),
      (e.near = 10),
      (e.far = 500),
      (o.shadow.bias = -0.0004),
      (o.shadow.normalBias = 0.05),
      a.add(o, o.target));
    let s = new D.DirectionalLight(8824063, 2.2);
    a.add(s, s.target);
    let i = new D.DirectionalLight(16773340, 3.4);
    a.add(i, i.target);
    let n = new D.DirectionalLight(16754784, 5);
    a.add(n, n.target);
    let r = new D.PointLight(16777215, 0, 120, 2);
    return (a.add(r), { hemi: t, sun: o, fill: s, key: i, rim: n, flash: r });
  }
  var st = Bt(Ct());
  function io(a = {}) {
    let t = mt(),
      o = !!a.dark,
      e = o ? t.horseBlack : t.horseWhite,
      s = o ? t.maneFire : t.maneWhite,
      i = o ? t.plumeRav : t.plumeRama,
      n = new st.Group(),
      r = new st.Group();
    n.add(r);
    let l = (I, at, dt, R) => ({ p: [0, at, I], rx: dt, ry: R }),
      c = new tt();
    c.add(
      b(
        xt(
          [
            l(-1.02, 1.3, 0.1, 0.12),
            l(-0.9, 1.34, 0.24, 0.3),
            l(-0.62, 1.4, 0.33, 0.4),
            l(-0.2, 1.36, 0.34, 0.41),
            l(0.25, 1.34, 0.335, 0.42),
            l(0.6, 1.34, 0.3, 0.43),
            l(0.88, 1.38, 0.22, 0.34),
            l(1, 1.44, 0.16, 0.24),
          ],
          { radial: 24 },
        ),
        e,
      ),
    );
    for (let I of [-1, 1])
      (c.add(B(e, 1, [I * 0.22, 1.22, -0.68], [0.2, 0.3, 0.3])),
        c.add(B(e, 1, [I * 0.26, 1.24, 0.52], [0.15, 0.3, 0.26])));
    (c.add(
      b(
        xt(
          [
            { p: [0, 1.45, 0.72], rx: 0.2, ry: 0.27 },
            { p: [0, 1.7, 0.9], rx: 0.16, ry: 0.22 },
            { p: [0, 1.96, 1.06], rx: 0.125, ry: 0.17 },
            { p: [0, 2.12, 1.2], rx: 0.1, ry: 0.13 },
          ],
          { radial: 16 },
        ),
        e,
      ),
    ),
      c.add(
        b(C.tor(0.34, 0.025, 36), o ? t.iron : t.gold, {
          p: [0, 1.28, 0.74],
          s: [1, 1.18, 1],
        }),
      ),
      c.add(
        b(C.tor(0.345, 0.02, 36), t.goldDark, {
          p: [0, 1.3, -0.05],
          s: [1, 1.2, 1],
        }),
      ),
      c.add(gt(o ? t.dhotiRed : t.dhotiBlue, 0.7, 0.04, 0.5, [0, 1.76, 0.18])),
      c.add(gt(t.gold, 0.74, 0.012, 0.06, [0, 1.775, 0.18])),
      c.add(B(o ? t.gemRed : t.gemBlue, 0.045, [0, 1.62, 0.88])),
      c.add(B(t.gold, 0.055, [0, 1.28, 1.08], [1, 1, 0.6])));
    for (let I = 0; I < 5; I++)
      c.add(Z(i, 0.03, 0.16, [-0.16 + I * 0.08, 0.98, 1], [Math.PI, 0, 0]));
    c.flush(r);
    let g = new st.Group();
    r.add(g);
    let v = new tt(),
      y = [
        [0, 1.66, 0.62],
        [0, 1.9, 0.82],
        [0, 2.14, 0.98],
        [0, 2.3, 1.14],
      ];
    for (let I = 0; I < 12; I++) {
      let at = I / 11,
        dt = Math.min(2, Math.floor(at * 3)),
        R = at * 3 - dt,
        f = y[dt],
        x = y[dt + 1];
      v.add(
        Z(
          s,
          0.045,
          0.34 - at * 0.1,
          [0, L(f[1], x[1], R) + 0.02, L(f[2], x[2], R) - 0.1],
          [-2.3 + at * 0.3, 0, (I % 2 ? 1 : -1) * 0.2],
        ),
      );
    }
    v.flush(g);
    let M = new st.Group();
    (M.position.set(0, 2.12, 1.2), r.add(M));
    let z = new tt();
    z.add(
      b(
        xt(
          [
            { p: [0, 0, -0.02], rx: 0.1, ry: 0.13 },
            { p: [0, -0.1, 0.1], rx: 0.115, ry: 0.15 },
            { p: [0, -0.24, 0.27], rx: 0.085, ry: 0.11 },
            { p: [0, -0.34, 0.42], rx: 0.065, ry: 0.085 },
            { p: [0, -0.37, 0.5], rx: 0.062, ry: 0.07 },
          ],
          { radial: 16 },
        ),
        e,
      ),
    );
    for (let I of [-1, 1])
      (z.add(
        B(
          o ? t.horseEyeRed : t.horseEye,
          0.032,
          [I * 0.1, -0.06, 0.12],
          [0.8, 1, 1],
        ),
      ),
        z.add(Z(e, 0.04, 0.2, [I * 0.065, 0.12, -0.02], [-0.2, 0, I * 0.15])),
        z.add(B(t.hoof, 0.017, [I * 0.036, -0.34, 0.5])),
        z.add(
          ht(
            t.gold,
            0.1,
            0.007,
            [I * 0.004, -0.16, 0.2],
            [Math.PI / 2 + 0.7, 0, 0],
          ),
        ));
    if (
      (z.add(
        b(C.tor(0.12, 0.012, 20), t.gold, {
          p: [0, -0.35, 0.44],
          r: [0.4, 0, 0],
        }),
      ),
      z.add(
        gt(
          o ? t.iron : t.gold,
          0.05,
          0.4,
          0.016,
          [0, -0.15, 0.17],
          [0.7, 0, 0],
        ),
      ),
      o)
    )
      z.add(Z(t.iron, 0.02, 0.14, [0, 0, 0.06], [-0.9, 0, 0]));
    (z.add(Z(i, 0.04, 0.3, [0, 0.2, -0.04], [-0.6, 0, 0])), z.flush(M));
    let w = new st.Group();
    (w.position.set(0, 1.46, -1), r.add(w));
    let S = new tt();
    for (let I = -1; I <= 1; I++)
      S.add(
        b(
          xt(
            [
              { p: [I * 0.03, 0, 0], rx: 0.05, ry: 0.035 },
              { p: [I * 0.06, -0.3, -0.12], rx: 0.06, ry: 0.04 },
              { p: [I * 0.08, -0.7, -0.2], rx: 0.045, ry: 0.03 },
              { p: [I * 0.07, -1.05, -0.2], rx: 0.004, ry: 0.004 },
            ],
            { radial: 8 },
          ),
          s,
        ),
      );
    S.flush(w);
    let P = [],
      W = Nt(
        0.57,
        [
          [0, 0.12, 0.15],
          [0.3, 0.115, 0.12],
          [1, 0.07],
        ],
        12,
        8,
      ),
      H = Nt(
        0.56,
        [
          [0, 0.06],
          [0.5, 0.048],
          [0.85, 0.045],
          [1, 0.058],
        ],
        10,
        8,
      ),
      K = (I, at, dt) => {
        let R = new st.Group();
        (R.position.set(I, 1.17, at), r.add(R));
        let f = new st.Group();
        (f.position.set(0, -0.57, 0), R.add(f));
        let x = new tt();
        (x.add(b(W, e)), x.add(B(e, 0.075, [0, -0.57, 0])), x.flush(R));
        let k = new tt();
        if (
          (k.add(b(H, e)),
          k.add(B(e, 0.062, [0, -0.5, 0])),
          k.add(
            b(C.cyl(), a.dark ? t.hoof : t.hoofGold, {
              p: [0, -0.6, 0.012],
              s: [0.075, 0.1, 0.085],
            }),
          ),
          k.add(
            b(C.tor(0.05, 0.011, 16), t.gold, {
              p: [0, -0.4, 0],
              r: [Math.PI / 2, 0, 0],
            }),
          ),
          o)
        )
          k.add(
            Z(t.maneFire, 0.03, 0.12, [0, -0.52, -0.05], [Math.PI - 0.6, 0, 0]),
          );
        (k.flush(f), P.push({ up: R, lo: f, front: dt }));
      };
    return (
      K(0.25, 0.64, !0),
      K(-0.25, 0.64, !0),
      K(0.26, -0.66, !1),
      K(-0.26, -0.66, !1),
      n.traverse((I) => {
        if (I.isMesh) I.castShadow = !0;
      }),
      (n.userData = {
        body: r,
        head: M,
        tail: w,
        legs: P,
        mane: g,
        ph: Math.random() * 6,
      }),
      n
    );
  }
  var no = [0, 0.55, Math.PI + 0.3, Math.PI + 0.85];
  function lo(a, t, o, e) {
    let s = a.userData;
    s.ph += t * (3.2 + e * 0.12);
    let i = s.ph;
    ((s.body.position.y = 0 + Math.sin(i * 2) * 0.05),
      (s.body.rotation.x = Math.sin(i * 2 + 0.6) * 0.025),
      s.legs.forEach((n, r) => {
        let l = i + no[r];
        ((n.up.rotation.x = (n.front ? -0.62 : -0.5) * Math.sin(l)),
          (n.lo.rotation.x =
            0.18 +
            1.05 * Math.max(0, Math.sin(l + 1.1)) * (n.front ? 1 : 0.85)));
      }),
      (s.head.rotation.x = 0.04 + Math.sin(i * 2 + 1) * 0.07),
      (s.tail.rotation.x = 0.35 + Math.sin(i * 2) * 0.12 + e * 0.01),
      (s.tail.rotation.z = Math.sin(o * 1.7 + i) * 0.12),
      (s.mane.rotation.z = Math.sin(o * 3 + i) * 0.05));
  }
  var ue = [-1.2, -0.4, 0.4, 1.2];
  function me(a) {
    let t = mt(),
      o = a === "rav",
      e = o ? t.chariotBlack : t.chariotWhite,
      s = o ? t.goldDark : t.gold,
      i = o ? t.redGlow : t.goldGlow,
      n = new st.Group(),
      r = new st.Group();
    n.add(r);
    let l = new tt(),
      c = new st.Shape();
    (c.moveTo(-1.05, 1.5),
      c.lineTo(-1.1, 0.4),
      c.quadraticCurveTo(-1, -0.8, 0, -1.25),
      c.quadraticCurveTo(1, -0.8, 1.1, 0.4),
      c.lineTo(1.05, 1.5),
      c.lineTo(-1.05, 1.5));
    let g = new st.ExtrudeGeometry(c, {
      depth: 0.16,
      bevelEnabled: !0,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 14,
    });
    (g.rotateX(-Math.PI / 2),
      l.add(b(g, o ? t.iron : t.goldDark, { p: [0, 1, 0] })),
      l.add(gt(o ? t.dhotiBlack : t.dhotiRed, 1.7, 0.012, 2.1, [0, 1.2, 0.3])));
    let v = new st.CatmullRomCurve3(
        [
          [-1.06, 1.5],
          [-1.1, 0.4],
          [-1, -0.6],
          [-0.55, -1.08],
          [0, -1.22],
          [0.55, -1.08],
          [1, -0.6],
          [1.1, 0.4],
          [1.06, 1.5],
        ].map(([f, x]) => new st.Vector3(f, 0, -x)),
      ),
      y = [],
      M = [];
    for (let f = 0; f <= 46; f++) {
      let x = f / 46,
        k = v.getPoint(x),
        h = ot((k.z + 1.5) / 2.7, 0, 1),
        _ = 0.2 + 0.28 * Math.pow(h, 1.5);
      (y.push({ p: [k.x, 1.18 + _, -k.z * 1 + 0], rx: 0.055, ry: _ }),
        M.push({ p: [k.x, 1.2 + _ * 2, -k.z], rx: 0.05, ry: 0.05 }));
    }
    for (let f of y) f.p[2] = -f.p[2];
    for (let f of M) f.p[2] = -f.p[2];
    (l.add(b(xt(y, { radial: 12, cap: !0 }), e)),
      l.add(b(xt(M, { radial: 12 }), s)));
    for (let f = 3; f < 44; f += 3) {
      let x = y[f],
        k = y[f + 1],
        h = k.p[0] - x.p[0],
        _ = k.p[2] - x.p[2],
        F = Math.hypot(h, _) || 1,
        N = -_ / F,
        q = h / F;
      (l.add(
        B(o ? t.gemRed : t.gemBlue, 0.034, [
          x.p[0] + N * 0.057,
          x.p[1],
          x.p[2] + q * 0.057,
        ]),
      ),
        l.add(
          b(C.tor(0.05, 0.008, 16), s, {
            p: [x.p[0] + N * 0.056, x.p[1], x.p[2] + q * 0.056],
            r: [0, Math.atan2(N, q), 0],
          }),
        ));
    }
    for (let f = 1; f < 46; f++) {
      let x = y[f],
        k = y[Math.min(45, f + 1)],
        h = k.p[0] - x.p[0],
        _ = k.p[2] - x.p[2],
        F = Math.atan2(h, _);
      l.add(
        Z(
          o ? t.iron : t.gold,
          0.07,
          o ? 0.36 : 0.26,
          [x.p[0] + Math.cos(F) * 0.1, 1, x.p[2] - Math.sin(F) * 0.1],
          [Math.PI, F, 0],
        ),
      );
    }
    if (!o) {
      (l.add(
        b(C.tor(0.55, 0.05, 40), t.gold, { p: [0, 2.05, 1.18], r: [0, 0, 0] }),
      ),
        l.add(b(C.tor(0.4, 0.025, 32), t.goldDark, { p: [0, 2.05, 1.18] })),
        l.add(B(t.gemRed, 0.12, [0, 2.05, 1.2], [1, 1, 0.7])),
        l.add(B(t.gold, 0.2, [0, 2.05, 1.2], [1, 1, 0.5])));
      for (let f = 0; f < 24; f++) {
        let x = (f / 24) * Math.PI * 2;
        l.add(
          Z(
            t.gold,
            0.035,
            f % 2 ? 0.2 : 0.34,
            [Math.cos(x) * 0.68, 2.05 + Math.sin(x) * 0.68, 1.18],
            [0, 0, x - Math.PI / 2],
          ),
        );
      }
      l.add(wt(t.gold, 0.05, 0.9, [0, 1.62, 1.18]));
      for (let f of [-1, 1])
        (l.add(
          b(
            Dt(
              [
                [f * 0.15, 1.5, 1.1],
                [f * 0.55, 1.7, 1.3],
                [f * 0.9, 1.45, 1.1],
              ],
              0.04,
              0.012,
              18,
              8,
            ),
            t.gold,
          ),
        ),
          l.add(B(t.pearl, 0.05, [f * 0.9, 1.45, 1.1])));
    } else {
      (l.add(
        b(
          Dt(
            [
              [-1, 1.3, 1],
              [-0.7, 1.9, 1.3],
              [-0.3, 2.45, 1.4],
            ],
            0.09,
            0.02,
            14,
            8,
          ),
          t.iron,
        ),
      ),
        l.add(
          b(
            Dt(
              [
                [1, 1.3, 1],
                [0.7, 1.9, 1.3],
                [0.3, 2.45, 1.4],
              ],
              0.09,
              0.02,
              14,
              8,
            ),
            t.iron,
          ),
        ));
      for (let f of [-1, 1])
        for (let x = 0; x < 5; x++)
          l.add(
            Z(
              t.iron,
              0.04,
              0.28,
              [f * (1.02 - x * 0.18), 1.7 + x * 0.1, 1.32],
              [0.4, 0, -f * 0.6],
            ),
          );
      (l.add(
        b(C.tor(0.9, 0.06, 40, Math.PI), t.goldDark, {
          p: [0, 1.55, 1.14],
          r: [0, 0, 0],
        }),
      ),
        l.add(b(C.tor(0.5, 0.025, 30), t.redGlow, { p: [0, 2.15, 1.25] })));
    }
    (l.add(wt(s, 0.07, 2.7, [0, 1, -0.2], [0, 0, Math.PI / 2])),
      l.add(
        b(
          Dt(
            [
              [0, 1.15, 1],
              [0, 1.2, 2.3],
              [0, 1.45, 3.4],
              [0, 1.9, 4.2],
            ],
            0.09,
            0.05,
            20,
            10,
          ),
          o ? t.iron : t.goldDark,
        ),
      ),
      l.add(wt(s, 0.05, 3.2, [0, 1.92, 4], [0, 0, Math.PI / 2])));
    for (let f of ue)
      l.add(
        b(C.tor(0.2, 0.03, 18), s, { p: [f, 1.92, 4], r: [0, Math.PI / 2, 0] }),
      );
    if (
      (l.add(wt(s, 0.04, 4.3, [0, 3.35, -1.3])),
      l.add(B(o ? t.gemRed : t.gold, 0.1, [0, 5.55, -1.3])),
      o)
    ) {
      for (let f = 0; f < 3; f++)
        l.add(Z(t.bone, 0.06, 0.3, [0, 5.5 + f * 0, -1.3], [0, 0, 0]));
      l.add(B(t.bone, 0.14, [0, 5.75, -1.3], [1, 1.1, 1]));
    } else l.add(Z(t.gold, 0.06, 0.4, [0, 5.85, -1.3]));
    for (let f of [-1, 1])
      if (o)
        for (let x = 0; x < 3; x++) {
          let k = new st.Shape();
          (k.moveTo(0, 0),
            k.lineTo(0.2, 1.4 + x * 0),
            k.lineTo(0.6, 0.6),
            k.lineTo(0.9, 1.2 - x * 0.1),
            k.lineTo(1.2, 0.2),
            k.lineTo(0, -0.2));
          let h = new st.ExtrudeGeometry(k, { depth: 0.04, bevelEnabled: !1 }),
            _ = b(h, t.blackMetal, {
              p: [f * 1.12, 1.5 + x * 0.12, -0.2 - x * 0.28],
              r: [0, (f * Math.PI) / 2, 0 - f * 0.35],
              s: [0.8 - x * 0.12, 0.8 - x * 0.1, 1],
            });
          l.add(_);
        }
      else
        for (let x = 0; x < 5; x++)
          l.add(
            Z(
              t.gold,
              0.12,
              1 - x * 0.1,
              [f * 1.2, 1.7 + x * 0.05, -0.8 + x * 0.35],
              [0, 0, -f * (0.8 - x * 0.06)],
            ),
          );
    l.flush(r);
    let z = new st.Mesh(
      new st.TorusGeometry(0.62, 0.035, 8, 40),
      t.flameBasic.clone(),
    );
    (z.material.color.set(o ? 16722448 : 16763984),
      z.position.set(0, 2.05, o ? 1.25 : 1.12),
      r.add(z));
    let w = [],
      S = (() => {
        let f = new st.Group(),
          x = new tt();
        (x.add(
          b(C.tor(0.92, 0.1, 48), s, { p: [0, 0, 0], r: [0, Math.PI / 2, 0] }),
        ),
          x.add(
            b(C.tor(0.99, 0.045, 48), o ? t.iron : t.goldDark, {
              r: [0, Math.PI / 2, 0],
            }),
          ),
          x.add(b(C.tor(0.82, 0.02, 40), i, { r: [0, Math.PI / 2, 0] })));
        for (let k = 0; k < 12; k++) {
          let h = (k / 12) * Math.PI * 2;
          (x.add(
            b(C.cyl(), e, {
              p: [0, Math.cos(h) * 0.47, Math.sin(h) * 0.47],
              s: [0.04, 0.9, 0.04],
              r: [h, 0, 0],
            }),
          ),
            x.add(
              B(o ? t.gemRed : t.gemBlue, 0.04, [
                0,
                Math.cos(h) * 0.7,
                Math.sin(h) * 0.7,
              ]),
            ),
            x.add(
              Z(
                o ? t.iron : t.gold,
                0.06,
                o ? 0.34 : 0.2,
                [0, Math.cos(h) * 1.08, Math.sin(h) * 1.08],
                [h, 0, 0],
              ),
            ));
        }
        return (
          x.add(b(C.cyl(), s, { s: [0.2, 0.25, 0.2], r: [0, 0, Math.PI / 2] })),
          x.add(B(o ? t.gemRed : t.gold, 0.14, [0.12, 0, 0])),
          x.add(
            b(C.tor(0.18, 0.025, 20), t.goldDark, {
              p: [0.08, 0, 0],
              r: [0, Math.PI / 2, 0],
            }),
          ),
          x.flush(f),
          f
        );
      })();
    for (let f of [-1, 1]) {
      let x = S.clone(),
        k = new st.Group();
      if ((k.position.set(f * 1.28, 1, -0.2), k.add(x), f < 0)) x.scale.x = -1;
      (r.add(k), w.push(k));
    }
    let P = [];
    ue.forEach((f) => {
      let x = io({ dark: o });
      (x.position.set(f, 0, 3.1), n.add(x), P.push(x));
    });
    let W = new st.MeshStandardMaterial({
      color: o ? 7344144 : 12595248,
      roughness: 0.6,
    });
    ue.forEach((f) => {
      let x = Dt(
          [
            [f > 0 ? 0.22 : -0.22, 2, 1],
            [f * 0.7, 2.05, 2.6],
            [f, 2.05, 3.5],
          ],
          0.008,
          0.008,
          12,
          5,
        ),
        k = new st.Mesh(x, W);
      ((k.castShadow = !1), r.add(k));
    });
    let H = new st.Group();
    (H.position.set(0, 1.2, -0.35), r.add(H));
    let K = new st.Group();
    (K.position.set(0, 1.2, 0.65), r.add(K));
    let I = i0(1.7, 1.05, o ? t.flagRav : t.flagRama, 14, 8);
    (I.position.set(0, 4.9, -1.3), (I.rotation.y = Math.PI / 2), r.add(I));
    let at = [];
    for (let f of [-1, 1]) {
      let x = i0(1.4, 0.3, o ? t.dhotiRed : t.saffron, 10, 2);
      (x.position.set(f * 1, 2.6, -1),
        (x.rotation.y = Math.PI / 2),
        r.add(x),
        at.push(x));
    }
    let dt = new st.PointLight(o ? 16726552 : 16760928, 40, 14, 2);
    (dt.position.set(0, 2.6, 0.2), r.add(dt));
    let R = {
      group: n,
      car: r,
      rider: H,
      driver: K,
      wheels: w,
      horses: P,
      flag: I,
      pen: at,
      light: dt,
      kind: a,
      spin: 0,
    };
    return (
      (R.update = (f, x, k) => {
        R.spin += (k / 0.95) * f;
        for (let h of w) h.rotation.x = R.spin;
        (P.forEach((h) => lo(h, f, x, k)),
          I.userData.update(x, 0.7 + k / 14),
          at.forEach((h) => h.userData.update(x + 1, 0.8 + k / 14)),
          (dt.intensity =
            (o ? 30 : 38) *
            (0.85 +
              Math.sin(x * 11 + (o ? 2 : 0)) * 0.1 +
              Math.sin(x * 23) * 0.05)));
      }),
      R
    );
  }
  var U = Bt(Ct());
  class O0 {
    constructor(a, t, o) {
      ((this.n = a),
        (this.i = 0),
        (this.pos = new Float32Array(a * 3)),
        (this.col = new Float32Array(a * 4)),
        (this.size = new Float32Array(a)),
        (this.vel = new Float32Array(a * 3)),
        (this.life = new Float32Array(a)),
        (this.age = new Float32Array(a).fill(1e9)),
        (this.s0 = new Float32Array(a)),
        (this.s1 = new Float32Array(a)),
        (this.c = new Float32Array(a * 4)),
        (this.grav = new Float32Array(a)),
        (this.drag = new Float32Array(a)));
      let e = new U.BufferGeometry();
      (e.setAttribute(
        "position",
        new U.BufferAttribute(this.pos, 3).setUsage(U.DynamicDrawUsage),
      ),
        e.setAttribute(
          "aColor",
          new U.BufferAttribute(this.col, 4).setUsage(U.DynamicDrawUsage),
        ),
        e.setAttribute(
          "aSize",
          new U.BufferAttribute(this.size, 1).setUsage(U.DynamicDrawUsage),
        ),
        (this.geo = e),
        (this.mat = new U.ShaderMaterial({
          transparent: !0,
          depthWrite: !1,
          blending: t ? U.AdditiveBlending : U.NormalBlending,
          uniforms: { uMap: { value: o }, uScale: { value: 500 } },
          vertexShader:
            "attribute vec4 aColor; attribute float aSize; uniform float uScale; varying vec4 vC; void main(){ vC = aColor; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(700.0, aSize * uScale / max(0.2, -mv.z)); }",
          fragmentShader:
            "uniform sampler2D uMap; varying vec4 vC; void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }",
        })),
        (this.points = new U.Points(e, this.mat)),
        (this.points.frustumCulled = !1),
        (this.points.renderOrder = t ? 5 : 4));
    }
    emit(a, t, o, e, s, i, n, r, l, c, g, v, y, M = 0, z = 0) {
      let w = this.i;
      ((this.i = (this.i + 1) % this.n),
        (this.pos[w * 3] = a),
        (this.pos[w * 3 + 1] = t),
        (this.pos[w * 3 + 2] = o),
        (this.vel[w * 3] = e),
        (this.vel[w * 3 + 1] = s),
        (this.vel[w * 3 + 2] = i),
        (this.life[w] = n),
        (this.age[w] = 0),
        (this.s0[w] = r),
        (this.s1[w] = l),
        (this.c[w * 4] = c),
        (this.c[w * 4 + 1] = g),
        (this.c[w * 4 + 2] = v),
        (this.c[w * 4 + 3] = y),
        (this.grav[w] = M),
        (this.drag[w] = z));
    }
    update(a, t, o, e) {
      this.mat.uniforms.uScale.value =
        (o * e * 0.5) / Math.tan((t.fov * Math.PI) / 360);
      for (let s = 0; s < this.n; s++) {
        if (this.age[s] > this.life[s]) {
          this.size[s] = 0;
          continue;
        }
        this.age[s] += a;
        let i = this.age[s] / this.life[s];
        if (i >= 1) {
          ((this.size[s] = 0), (this.col[s * 4 + 3] = 0));
          continue;
        }
        let n = Math.exp(-this.drag[s] * a);
        ((this.vel[s * 3] *= n),
          (this.vel[s * 3 + 1] = this.vel[s * 3 + 1] * n - this.grav[s] * a),
          (this.vel[s * 3 + 2] *= n),
          (this.pos[s * 3] += this.vel[s * 3] * a),
          (this.pos[s * 3 + 1] += this.vel[s * 3 + 1] * a),
          (this.pos[s * 3 + 2] += this.vel[s * 3 + 2] * a));
        let r = Math.min(1, i * 10) * Math.pow(1 - i, 1.3);
        ((this.size[s] = L(this.s0[s], this.s1[s], i)),
          (this.col[s * 4] = this.c[s * 4]),
          (this.col[s * 4 + 1] = this.c[s * 4 + 1]),
          (this.col[s * 4 + 2] = this.c[s * 4 + 2]),
          (this.col[s * 4 + 3] = this.c[s * 4 + 3] * r));
      }
      ((this.geo.attributes.position.needsUpdate = !0),
        (this.geo.attributes.aColor.needsUpdate = !0),
        (this.geo.attributes.aSize.needsUpdate = !0));
    }
  }
  var rt = {
    gold: [1, 0.72, 0.22],
    fire: [1, 0.35, 0.08],
    red: [1, 0.12, 0.06],
    cyan: [0.4, 0.8, 1],
    white: [1, 0.95, 0.85],
    green: [0.2, 1, 0.4],
    violet: [0.6, 0.2, 1],
    dark: [0.05, 0.02, 0.06],
  };
  class ge {
    constructor(a) {
      ((this.scene = a),
        (this.add = new O0(9000, !0, Ot())),
        (this.spark = new O0(2500, !0, je())),
        (this.smoke = new O0(2500, !1, Ye())),
        a.add(this.smoke.points, this.add.points, this.spark.points),
        (this.rings = []),
        (this.flashes = []),
        (this.bolts = []));
      let t = new U.RingGeometry(0.88, 1, 56);
      for (let o = 0; o < 16; o++) {
        let e = new U.Mesh(
          t,
          new U.MeshBasicMaterial({
            color: 16777215,
            transparent: !0,
            blending: U.AdditiveBlending,
            depthWrite: !1,
            side: U.DoubleSide,
            opacity: 0,
          }),
        );
        ((e.visible = !1),
          (e.userData = { t: 1, life: 1, size: 1, flat: !1 }),
          a.add(e),
          this.rings.push(e));
      }
      for (let o = 0; o < 12; o++) {
        let e = new U.Sprite(
          new U.SpriteMaterial({
            map: Ot(),
            color: 16777215,
            transparent: !0,
            blending: U.AdditiveBlending,
            depthWrite: !1,
            opacity: 0,
          }),
        );
        ((e.visible = !1),
          (e.userData = { t: 1, life: 1, size: 1 }),
          a.add(e),
          this.flashes.push(e));
      }
      for (let o = 0; o < 8; o++) {
        let e = new U.BufferGeometry();
        e.setAttribute(
          "position",
          new U.BufferAttribute(new Float32Array(120), 3),
        );
        let s = new U.Line(
          e,
          new U.LineBasicMaterial({
            color: 16777215,
            transparent: !0,
            blending: U.AdditiveBlending,
            depthWrite: !1,
          }),
        );
        ((s.frustumCulled = !1),
          (s.visible = !1),
          (s.userData = { t: 1, life: 0.2 }),
          a.add(s),
          this.bolts.push(s));
      }
      ((this.lp = G(0, 5, 0)),
        (this.ri = 0),
        (this.fi = 0),
        (this.bi = 0),
        (this.shake = 0),
        (this.lightFlash = 0));
    }
    ring(a, t, o, e, s, i, n = !1) {
      let r = this.rings[this.ri++ % this.rings.length];
      if (
        (r.position.set(a, t, o),
        r.material.color.setRGB(e[0], e[1], e[2]),
        (r.visible = !0),
        Object.assign(r.userData, { t: 0, life: i, size: s, flat: n }),
        n)
      )
        r.rotation.set(-Math.PI / 2, 0, 0);
    }
    flash(a, t, o, e, s, i = 0.35, n = 1) {
      let r = this.flashes[this.fi++ % this.flashes.length];
      (r.position.set(a, t, o),
        r.material.color.setRGB(e[0] * 2, e[1] * 2, e[2] * 2),
        (r.visible = !0),
        Object.assign(r.userData, { t: 0, life: i, size: s, a: n }));
    }
    bolt(a, t, o = [1, 0.3, 0.2], e = 0.18, s = 1.2) {
      let i = this.bolts[this.bi++ % this.bolts.length],
        n = i.geometry.attributes.position,
        l = G(t.x - a.x, t.y - a.y, t.z - a.z),
        c = l.length();
      for (let g = 0; g < 40; g++) {
        let v = g / 39,
          y = g === 0 || g === 39 ? 0 : s * (1 - Math.abs(v - 0.5) * 0.6);
        n.setXYZ(
          g,
          a.x + l.x * v + E(y),
          a.y + l.y * v + E(y),
          a.z + l.z * v + E(y),
        );
      }
      ((n.needsUpdate = !0),
        i.material.color.setRGB(o[0] * 2, o[1] * 2, o[2] * 2),
        (i.visible = !0),
        (i.userData.t = 0),
        (i.userData.life = e));
    }
    sparks(a, t, o, e, s = 30, i = 10, n = 0.7) {
      for (let r = 0; r < s; r++) {
        let l = Math.random() * 6.283,
          c = Math.random() * 3.14 - 1.57,
          g = i * (0.3 + Math.random());
        this.spark.emit(
          a,
          t,
          o,
          Math.cos(l) * Math.cos(c) * g,
          Math.sin(c) * g,
          Math.sin(l) * Math.cos(c) * g,
          n * (0.5 + Math.random()),
          0.5 + Math.random() * 0.6,
          0.05,
          e[0] * 2,
          e[1] * 2,
          e[2] * 2,
          1,
          6,
          1.5,
        );
      }
    }
    glowBurst(a, t, o, e, s = 40, i = 8, n = 1.2, r = 0.9) {
      for (let l = 0; l < s; l++) {
        let c = Math.random() * 6.283,
          g = Math.random() * 3.14 - 1.57,
          v = i * (0.2 + Math.random());
        this.add.emit(
          a,
          t,
          o,
          Math.cos(c) * Math.cos(g) * v,
          Math.sin(g) * v,
          Math.sin(c) * Math.cos(g) * v,
          r * (0.6 + Math.random() * 0.8),
          n * (0.6 + Math.random()),
          n * 0.2,
          e[0],
          e[1],
          e[2],
          0.9,
          0,
          1.2,
        );
      }
    }
    dust(a, t, o, e = 20, s = 1) {
      for (let i = 0; i < Math.ceil(e * 0.45); i++)
        this.smoke.emit(
          a + E(1.2 * s),
          t + 0.2,
          o + E(1.2 * s),
          E(5 * s),
          1 + Math.random() * 3 * s,
          E(5 * s),
          1.6 + Math.random(),
          1.2 * s,
          3.2 * s,
          0.3,
          0.23,
          0.17,
          0.26,
          -0.5,
          1.4,
        );
    }
    smokePuff(a, t, o, e = [0.15, 0.1, 0.1], s = 10, i = 1, n = 3) {
      for (let r = 0; r < s; r++)
        this.smoke.emit(
          a + E(i),
          t + E(i),
          o + E(i),
          E(2),
          n * (0.5 + Math.random()),
          E(2),
          2.5 + Math.random() * 2,
          2 * i,
          9 * i,
          e[0],
          e[1],
          e[2],
          0.6,
          -0.3,
          0.8,
        );
    }
    explosion(a, t, o, e = rt.fire, s = 1) {
      (this.lp.set(a, t, o),
        this.flash(a, t, o, e, 14 * s, 0.5),
        this.ring(a, t, o, e, 9 * s, 0.6),
        this.sparks(a, t, o, e, Math.floor(40 * s), 22 * s, 1.1),
        this.glowBurst(a, t, o, e, Math.floor(26 * s), 12 * s, 2.2 * s, 0.9),
        this.smokePuff(
          a,
          t + 1,
          o,
          [0.12, 0.08, 0.07],
          Math.floor(8 * s),
          1.6 * s,
          4,
        ),
        (this.lightFlash = Math.max(this.lightFlash, 1.4 * s)),
        (this.shake = Math.max(this.shake, 0.25 * s)));
    }
    update(a, t, o, e) {
      for (let s of this.rings) {
        if (!s.visible) continue;
        let i = s.userData;
        if (((i.t += a / i.life), i.t >= 1)) {
          s.visible = !1;
          continue;
        }
        let n = 1 - Math.pow(1 - i.t, 3);
        if (
          (s.scale.setScalar(Math.max(0.01, i.size * n)),
          (s.material.opacity = (1 - i.t) * 0.9),
          !i.flat)
        )
          s.quaternion.copy(t.quaternion);
      }
      for (let s of this.flashes) {
        if (!s.visible) continue;
        let i = s.userData;
        if (((i.t += a / i.life), i.t >= 1)) {
          s.visible = !1;
          continue;
        }
        (s.scale.setScalar(i.size * (0.4 + i.t * 0.8)),
          (s.material.opacity = (1 - i.t) * i.a));
      }
      for (let s of this.bolts) {
        if (!s.visible) continue;
        let i = s.userData;
        if (((i.t += a / i.life), i.t >= 1)) {
          s.visible = !1;
          continue;
        }
        s.material.opacity = 1 - i.t;
      }
      (this.add.update(a, t, o, e),
        this.spark.update(a, t, o, e),
        this.smoke.update(a, t, o, e),
        (this.shake = Math.max(0, this.shake - a * 0.9)),
        (this.lightFlash = Math.max(0, this.lightFlash - a * 5)));
    }
  }
  class xe {
    constructor(a, t) {
      ((this.fx = t), (this.list = []), (this.pool = []));
      let o = mt();
      for (let e = 0; e < 80; e++) {
        let s = new U.Group(),
          i = new tt();
        (i.add(wt(o.wood, 0.012, 1.4, [0, 0, 0.7], [Math.PI / 2, 0, 0])),
          i.add(Z(o.steel, 0.028, 0.2, [0, 0, 1.5], [Math.PI / 2, 0, 0])));
        for (let r = 0; r < 3; r++) {
          let l = (r / 3) * 6.283;
          i.add(
            gt(
              o.plumeRama,
              0.004,
              0.05,
              0.2,
              [Math.cos(l) * 0.026, Math.sin(l) * 0.026, 0.14],
              [0, 0, l],
            ),
          );
        }
        i.flush(s);
        let n = new U.Sprite(
          new U.SpriteMaterial({
            map: Ot(),
            color: 16760928,
            transparent: !0,
            blending: U.AdditiveBlending,
            depthWrite: !1,
          }),
        );
        ((n.position.z = 1.55),
          n.scale.setScalar(0.9),
          s.add(n),
          (s.userData.glow = n),
          (s.visible = !1),
          a.add(s),
          this.pool.push(s));
      }
    }
    spawn(a, t, o, e, s = {}) {
      let i = this.pool.find((l) => !l.visible);
      if (!i) return null;
      let n = e === "rama" ? [1, 0.75, 0.3] : [1, 0.25, 0.12];
      ((i.visible = !0),
        i.position.copy(a),
        i.userData.glow.material.color.setRGB(n[0], n[1], n[2]),
        i.scale.setScalar(s.scale || 1));
      let r = {
        g: i,
        pos: i.position,
        vel: t.clone().normalize().multiplyScalar(o),
        owner: e,
        age: 0,
        col: n,
        mode: s.mode || "free",
        target: s.target || null,
        life: s.life || 4,
        dead: !1,
        big: s.big || 0,
      };
      return (
        this.list.push(r),
        i.lookAt(a.x + r.vel.x, a.y + r.vel.y, a.z + r.vel.z),
        r
      );
    }
    kill(a) {
      ((a.dead = !0), (a.g.visible = !1));
    }
    update(a, t) {
      let o = this.fx;
      for (let e of this.list) {
        if (e.dead) continue;
        e.age += a;
        let s = e.vel.length() * a,
          i = Math.max(1, Math.ceil(s / 0.9));
        for (let n = 0; n < i; n++) {
          let r = n / i;
          o.add.emit(
            e.pos.x - e.vel.x * a * (1 - r) + E(0.04),
            e.pos.y - e.vel.y * a * (1 - r),
            e.pos.z - e.vel.z * a * (1 - r) + E(0.04),
            0,
            0,
            0,
            0.45,
            0.65 + e.big * 0.6,
            0.05,
            e.col[0] * 1.6,
            e.col[1] * 1.6,
            e.col[2] * 1.6,
            0.9,
            0,
            3,
          );
        }
        if (
          (e.pos.addScaledVector(e.vel, a),
          e.g.lookAt(e.pos.x + e.vel.x, e.pos.y + e.vel.y, e.pos.z + e.vel.z),
          t.hit(e))
        )
          continue;
        if (e.pos.y < t.groundY(e.pos.x, e.pos.z) + 0.1) {
          (t.ground(e), this.kill(e));
          continue;
        }
        if (e.age > e.life) this.kill(e);
      }
      this.list = this.list.filter((e) => !e.dead);
    }
  }
  function pa(a) {
    let t = new U.ShaderMaterial({
        transparent: !0,
        depthWrite: !1,
        blending: U.AdditiveBlending,
        side: U.DoubleSide,
        uniforms: {
          uHex: { value: Ze() },
          uCol: { value: new U.Color(a) },
          uHit: { value: new U.Vector3() },
          uFade: { value: 0 },
          uTime: { value: 0 },
          uBase: { value: 0 },
        },
        vertexShader:
          "varying vec2 vUv; varying vec3 vW; varying vec3 vN; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }",
        fragmentShader: `uniform sampler2D uHex; uniform vec3 uCol, uHit; uniform float uFade, uTime, uBase; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
      void main(){ vec3 v = normalize(cameraPosition - vW); float fr = pow(1.0 - abs(dot(normalize(vN), v)), 2.2); float hx = texture2D(uHex, vUv * vec2(2.0,1.0)).a; float d = distance(vW, uHit);
        float hit = exp(-d*d/ 9.0) * uFade; float a = (fr * 0.35 + hx * (0.2 + hit * 2.2)) * (uBase + uFade) + hit * 0.6; gl_FragColor = vec4(uCol * a * 1.6, a); }`,
      }),
      o = new U.Mesh(new U.SphereGeometry(1, 32, 20), t);
    return (
      o.scale.set(2.6, 2.2, 4),
      (o.frustumCulled = !1),
      (o.renderOrder = 6),
      o
    );
  }
  var Q = Bt(Ct());
  var Y0 = (a, t, o, e) =>
      e.set(L(a.x, t.x, o), L(a.y, t.y, o), L(a.z, t.z, o)),
    m0 = (a, t = 1) =>
      new Q.SpriteMaterial({
        map: Ot(),
        color: a,
        transparent: !0,
        blending: Q.AdditiveBlending,
        depthWrite: !1,
        opacity: t,
      }),
    K0 = 30;
  class ve {
    constructor(a) {
      ((this.api = a),
        (this.t = 0),
        (this.done = !1),
        (this.N = 9),
        (this.dead = !1));
      let t = new Q.MeshStandardMaterial({
        color: 1059350,
        emissive: 694842,
        emissiveIntensity: 0.9,
        metalness: 0.5,
        roughness: 0.3,
      });
      ((this.mesh = new Q.InstancedMesh(
        new Q.SphereGeometry(1, 10, 8),
        t,
        this.N * K0,
      )),
        (this.mesh.frustumCulled = !1),
        (this.mesh.castShadow = !1),
        a.scene.add(this.mesh),
        (this.eyes = []),
        (this.sn = []));
      for (let o = 0; o < this.N; o++) {
        let e = new Q.Sprite(m0(16723984));
        (e.scale.setScalar(0.5), a.scene.add(e), this.eyes.push(e));
        let s = new Q.Sprite(m0(3211120, 0.5));
        (s.scale.setScalar(1.4),
          a.scene.add(s),
          this.eyes.push(s),
          this.sn.push({
            hist: [],
            ph: Math.random() * 6,
            off: G(E(3), E(1.5), E(3)),
            r: 4.2 + (o % 3) * 0.9,
            w: (o % 2 ? 1 : -1) * (1.6 + Math.random() * 0.6),
            h: 1 + (o % 4) * 0.9,
          }));
      }
      ((this.o = new Q.Object3D()),
        (this.start = a.bow("rav")),
        a.audio("astra0", 1),
        a.audio("roar", 0.7));
    }
    headPos(a, t, o) {
      let e = this.api,
        s = e.pos("rama"),
        i = this.start,
        n = pt(t / 2.2),
        r = s.clone().add(a.off),
        l = Y0(i, r, n, G()),
        c = r.clone().sub(i).normalize(),
        g = G(-c.z, 0, c.x);
      (l.addScaledVector(g, Math.sin(t * 7 + a.ph) * 1.6 * (1 - n * 0.6)),
        (l.y += Math.sin(t * 5 + a.ph) * 0.9 + Math.sin(n * Math.PI) * 5));
      let v = a.ph + t * a.w,
        y = G(
          s.x + Math.cos(v) * a.r,
          s.y + a.h + Math.sin(v * 2 + a.ph) * 1,
          s.z + Math.sin(v) * a.r,
        );
      return o.copy(l).lerp(y, f0(1.8, 2.8, t));
    }
    update(a) {
      this.t += a;
      let t = this.api,
        o = this.t;
      if (this.t > 0.25 && !this.rayed) this.rayed = !0;
      (this.sn.forEach((e, s) => {
        let i = Math.max(0, o - s * 0.08),
          n = this.headPos(e, i, G());
        e.hist.unshift({ p: n, t: o });
        while (e.hist.length > 90) e.hist.pop();
        for (let r = 0; r < K0; r++) {
          let l = o - r * 0.02,
            c = e.hist[e.hist.length - 1].p;
          for (let v = 0; v < e.hist.length; v++)
            if (e.hist[v].t <= l) {
              c = e.hist[v].p;
              break;
            }
          let g = r === 0 ? 0.3 : 0.2 * (1 - (r / K0) * 0.8) + 0.03;
          (this.o.position.copy(c),
            this.o.scale.setScalar(g),
            this.o.updateMatrix(),
            this.mesh.setMatrixAt(s * K0 + r, this.o.matrix));
        }
        if (
          (this.eyes[s * 2].position.copy(n).add(G(0, 0.18, 0)),
          this.eyes[s * 2 + 1].position.copy(n),
          Math.random() < 0.5)
        )
          t.fx.add.emit(
            n.x,
            n.y,
            n.z,
            E(1),
            E(1),
            E(1),
            0.5,
            0.9,
            0.1,
            0.2,
            1,
            0.4,
            0.7,
            0,
            2,
          );
        if (o > 2.6 && Math.random() < 0.012)
          t.domeFlash("rama", n, [0.3, 1, 0.5]);
      }),
        (this.mesh.instanceMatrix.needsUpdate = !0));
    }
    burst() {
      if (this.dead) return;
      this.dead = !0;
      let a = this.api;
      this.sn.forEach((o) =>
        o.hist.forEach((e, s) => {
          if (s % 4 === 0)
            (a.fx.sparks(e.p.x, e.p.y, e.p.z, rt.green, 4, 8, 0.8),
              a.fx.glowBurst(e.p.x, e.p.y, e.p.z, rt.gold, 3, 6, 1.2, 0.8));
        }),
      );
      let t = a.pos("rama");
      (a.fx.explosion(t.x, t.y + 2, t.z, rt.green, 1.6),
        a.fx.explosion(t.x, t.y + 3, t.z, rt.gold, 1.2),
        a.audio("boom", 1),
        this.dispose());
    }
    dispose() {
      (this.api.scene.remove(this.mesh),
        this.eyes.forEach((a) => this.api.scene.remove(a)),
        (this.done = !0));
    }
  }
  function co() {
    let a = mt(),
      t = new Q.Group(),
      o = new tt(),
      e = new Q.MeshStandardMaterial({
        color: 16760896,
        emissive: 16748544,
        emissiveIntensity: 1.3,
        metalness: 0.8,
        roughness: 0.3,
      }),
      s = new Q.MeshStandardMaterial({
        color: 12591120,
        emissive: 16719872,
        emissiveIntensity: 1,
      });
    (o.add(
      b(
        xt(
          [
            { p: [0, 0, -1.6], rx: 0.05, ry: 0.05 },
            { p: [0, 0, -0.9], rx: 0.4, ry: 0.42 },
            { p: [0, 0.05, 0.2], rx: 0.55, ry: 0.55 },
            { p: [0, 0.2, 1], rx: 0.36, ry: 0.4 },
            { p: [0, 0.45, 1.4], rx: 0.22, ry: 0.24 },
          ],
          { radial: 14 },
        ),
        e,
      ),
    ),
      o.add(b(C.sph(), e, { p: [0, 0.62, 1.55], s: [0.3, 0.32, 0.36] })),
      o.add(Z(s, 0.12, 0.5, [0, 0.5, 1.95], [Math.PI / 2 + 0.5, 0, 0])),
      o.add(
        b(C.sph(), a.pearl, { p: [0.15, 0.7, 1.7], s: [0.07, 0.07, 0.07] }),
      ),
      o.add(
        b(C.sph(), a.pearl, { p: [-0.15, 0.7, 1.7], s: [0.07, 0.07, 0.07] }),
      ));
    for (let r = 0; r < 5; r++)
      o.add(
        Z(s, 0.08, 0.5, [(r - 2) * 0.09, 0.95, 1.4], [-0.6, 0, (r - 2) * 0.35]),
      );
    for (let r = 0; r < 7; r++)
      o.add(
        b(C.box(), e, {
          p: [(r - 3) * 0.14, 0, -2.3 - Math.abs(r - 3) * 0.1],
          s: [0.1, 0.03, 1.4],
          r: [0, (r - 3) * 0.1, 0],
        }),
      );
    o.flush(t);
    let i = [];
    for (let r of [-1, 1]) {
      let l = new Q.Group(),
        c = new tt();
      l.position.set(r * 0.4, 0.3, 0.2);
      for (let g = 0; g < 3; g++)
        for (let v = 0; v < 9; v++) {
          let y = v / 8,
            M = 2.8 + Math.sin(y * 2) * 1.6 - g * 0.7,
            z = -0.5 + y * 1.7;
          c.add(
            b(C.cone(), g === 0 ? e : g === 1 ? s : e, {
              p: [
                r * Math.cos(z) * M * 0.5,
                Math.sin(z) * M * 0.5 - 0.1 * g,
                -y * 0.9 - g * 0.15,
              ],
              s: [0.13, M, 0.03],
              r: [0, 0, -r * (Math.PI / 2 - z) * 1 - (r > 0 ? 0 : 0)],
            }),
          );
        }
      (c.flush(l), t.add(l), i.push([l, r]));
    }
    let n = new Q.Sprite(m0(16756784, 0.8));
    return (
      n.scale.setScalar(9),
      t.add(n),
      (t.userData = { wings: i, core: n }),
      t
    );
  }
  class j0 {
    constructor(a, t) {
      ((this.api = a),
        (this.nag = t),
        (this.t = 0),
        (this.done = !1),
        (this.g = co()),
        a.scene.add(this.g),
        this.g.scale.setScalar(0.1),
        (this.burstDone = !1),
        (this.start = a.bow("rama")),
        this.g.position.copy(this.start),
        a.audio("astra1", 1),
        a.audio("roar", 0.6),
        (this.prev = this.start.clone()),
        (this.phase = 0));
    }
    update(a) {
      let t = this.api;
      this.t += a;
      let o = this.t,
        e = this.g,
        s = e.userData;
      e.scale.setScalar(0.2 + 1.2 * pt(o / 0.9));
      let i = t.pos("rama"),
        n;
      if (o < 3.2) {
        let l = 1 + o * 2.4,
          c = pt(o / 0.8);
        if (
          ((n = G(
            i.x + Math.cos(l) * 6.5 * c + (1 - c) * (this.start.x - i.x),
            i.y +
              1.8 +
              Math.sin(o * 3) * 0.6 +
              (1 - c) * (this.start.y - i.y - 1.8),
            i.z + Math.sin(l) * 6.5 * c + (1 - c) * (this.start.z - i.z),
          )),
          o > 1.5 && !this.burstDone)
        ) {
          if (((this.burstDone = !0), this.nag)) this.nag.burst();
          t.shake(0.5);
        }
      } else {
        let l = t.pos("rav"),
          c = ot((o - 3.2) / 2.6, 0, 1);
        if (c === 0) this.from = this.prev.clone();
        if (
          ((n = Y0(this.from || this.prev, l, pt(c), G())),
          (n.y += Math.sin(c * Math.PI) * 4),
          c >= 1)
        ) {
          (t.domeFlash("rav", l, [1, 0.8, 0.3]),
            t.fx.explosion(l.x, l.y + 1.5, l.z, rt.gold, 2),
            t.fx.glowBurst(l.x, l.y + 2, l.z, rt.gold, 120, 20, 1.6, 1.6),
            t.audio("boom", 1),
            this.dispose());
          return;
        }
      }
      e.position.copy(n);
      let r = n.clone().sub(this.prev);
      if (r.lengthSq() > 0.000001) e.lookAt(n.x + r.x, n.y + r.y, n.z + r.z);
      this.prev.copy(n);
      for (let [l, c] of s.wings) l.rotation.z = c * Math.sin(o * 10) * 0.7;
      for (let l = 0; l < 6; l++)
        t.fx.add.emit(
          n.x + E(1.5),
          n.y + E(1),
          n.z + E(1.5),
          E(2),
          E(2),
          E(2),
          0.8,
          1.2,
          0.1,
          1,
          0.7,
          0.2,
          0.9,
          0,
          1.5,
        );
      if (Math.random() < 0.5) t.fx.sparks(n.x, n.y, n.z, rt.gold, 2, 5, 0.6);
    }
    dispose() {
      (this.api.scene.remove(this.g), (this.done = !0));
    }
  }
  class ye {
    constructor(a) {
      ((this.api = a),
        (this.t = 0),
        (this.done = !1),
        (this.start = a.bow("rama")),
        (this.spawned = 0),
        (this.g = new Q.Group()));
      let t = new Q.Sprite(m0(16738832));
      (t.scale.setScalar(7), this.g.add(t));
      let o = new Q.Sprite(m0(16769184));
      (o.scale.setScalar(2.6),
        this.g.add(o),
        a.scene.add(this.g),
        (this.apex = null),
        a.audio("astra0", 1.2),
        (this.splitDone = !1),
        (this.fires = []));
    }
    update(a) {
      let t = this.api;
      this.t += a;
      let o = this.t;
      if (o < 2) {
        let e = t.pos("rav");
        if (!this.apex) this.apex = e.clone().add(G(0, 44, 0));
        ((this.apex.x = L(this.apex.x, e.x, 0.02)),
          (this.apex.z = L(this.apex.z, e.z, 0.02)));
        let s = pt(o / 2),
          i = Y0(this.start, this.apex, s, G());
        ((i.y += Math.sin(s * Math.PI) * 10),
          this.g.position.copy(i),
          (this.cur = i));
        for (let n = 0; n < 8; n++)
          t.fx.add.emit(
            i.x + E(0.8),
            i.y + E(0.8),
            i.z + E(0.8),
            E(2),
            2 + Math.random() * 3,
            E(2),
            0.9,
            2.4,
            0.2,
            1,
            0.45,
            0.1,
            0.9,
            -1,
            1,
          );
        t.fx.smoke.emit(
          i.x,
          i.y,
          i.z,
          E(1),
          1,
          E(1),
          2,
          1.6,
          6,
          0.2,
          0.12,
          0.1,
          0.4,
          0,
          0.5,
        );
      } else {
        if (!this.splitDone) {
          this.splitDone = !0;
          let s = this.cur;
          (t.fx.explosion(s.x, s.y, s.z, rt.fire, 2.4),
            t.fx.flash(s.x, s.y, s.z, rt.gold, 60, 0.8),
            t.fx.ring(s.x, s.y, s.z, rt.fire, 40, 1),
            t.audio("astra2", 1),
            t.audio("boom", 1),
            (this.g.visible = !1),
            t.flashScreen(0.5, [1, 0.6, 0.3]));
        }
        let e = Math.floor((o - 2) * 22);
        while (this.spawned < Math.min(e, 60)) {
          this.spawned++;
          let s = t.pos("rav"),
            i = t.vel("rav"),
            n = G(
              s.x + E(13) + i.x * 1.2,
              t.groundY(s.x, s.z),
              s.z + E(13) + i.z * 1.2,
            ),
            r = this.cur.clone().add(G(E(7), E(3), E(7))),
            l = n.clone().sub(r);
          t.arrows.spawn(r, l, 62, "rama", {
            big: 1,
            scale: 1.3,
            mode: "rain",
            life: 4,
          });
        }
        if (o > 5.5) this.dispose();
      }
    }
    dispose() {
      (this.api.scene.remove(this.g), (this.done = !0));
    }
  }
  class we {
    constructor(a) {
      ((this.api = a),
        (this.t = 0),
        (this.done = !1),
        (this.life = 11),
        a.audio("thunder", 1),
        a.audio("astra3", 1),
        a.audio("roar", 1));
    }
    update(a) {
      let t = this.api;
      this.t += a;
      let o = this.t;
      if (!this.cleared) t.setDark(f0(0, 3.2, o) * 0.4);
      let e = t.pos("rama"),
        s = t.pos("rav"),
        i = t.cam.position;
      for (let n = 0; n < 4; n++) {
        let r = Math.random() * 6.28,
          l = 6 + Math.random() * 30;
        t.fx.smoke.emit(
          e.x + Math.cos(r) * l,
          e.y + Math.random() * 8,
          e.z + Math.sin(r) * l,
          E(3),
          E(1),
          E(3),
          3,
          3,
          14,
          0.02,
          0.01,
          0.03,
          0.85 * f0(0, 2, o),
          0,
          0.5,
        );
      }
      for (let n = 0; n < 3; n++)
        t.fx.smoke.emit(
          i.x + E(14),
          i.y + E(5),
          i.z + E(14),
          E(2),
          0,
          E(2),
          2.5,
          2,
          9,
          0.02,
          0.01,
          0.03,
          0.5 * f0(0, 2, o),
          0,
          0.3,
        );
      if (o > 1 && Math.random() < 0.18) {
        let n = t.bow("rav"),
          r = G(e.x + E(14), e.y + E(6) + 3, e.z + E(14));
        if (
          (t.fx.bolt(n, r, [1, 0.15, 0.1], 0.2, 1.8),
          t.fx.flash(r.x, r.y, r.z, [1, 0.2, 0.1], 10, 0.3),
          t.shake(0.18),
          Math.random() < 0.4)
        )
          t.audio("thunder", 0.6);
      }
      for (let n = 0; n < 2; n++)
        t.fx.add.emit(
          s.x + E(2),
          s.y + 2 + Math.random() * 3,
          s.z + E(2),
          E(2),
          3,
          E(2),
          1.1,
          1.4,
          0.2,
          0.9,
          0.05,
          0.1,
          0.8,
          0,
          1,
        );
      if (o > this.life) {
        if (!this.cleared) t.setDark(0);
        this.done = !0;
      }
    }
    clear() {
      ((this.cleared = !0), this.api.setDark(0, !0));
    }
    dispose() {
      this.done = !0;
    }
  }
  class Me {
    constructor(a, t) {
      ((this.api = a),
        (this.tamas = t),
        (this.t = 0),
        (this.done = !1),
        (this.start = a.bow("rama")),
        (this.fired = !1),
        (this.g = new Q.Group()));
      let o = new Q.MeshBasicMaterial({
        color: 16765024,
        transparent: !0,
        blending: Q.AdditiveBlending,
        depthWrite: !1,
        side: Q.DoubleSide,
      });
      this.g.add(b(new Q.TorusGeometry(1.6, 0.14, 8, 40), o));
      for (let s = 0; s < 16; s++) {
        let i = (s / 16) * 6.283;
        this.g.add(
          b(C.cone(), o, {
            p: [Math.cos(i) * 2.3, Math.sin(i) * 2.3, 0],
            s: [0.18, 1.1, 0.18],
            r: [0, 0, i - Math.PI / 2],
          }),
        );
      }
      let e = new Q.Sprite(m0(16765040));
      (e.scale.setScalar(12),
        this.g.add(e),
        a.scene.add(this.g),
        this.g.position.copy(this.start),
        a.audio("astra1", 1.2),
        a.audio("choir", 1),
        (this.apex = G(this.start.x * 0.3, 70, this.start.z * 0.3)));
    }
    update(a) {
      let t = this.api;
      this.t += a;
      let o = this.t;
      if (o < 1.8) {
        let e = pt(o / 1.8),
          s = Y0(this.start, this.apex, e, G());
        (this.g.position.copy(s),
          (this.g.rotation.z += a * 8),
          this.g.lookAt(t.cam.position),
          this.g.rotateZ(o * 8));
        for (let i = 0; i < 6; i++)
          t.fx.add.emit(
            s.x + E(1),
            s.y + E(1),
            s.z + E(1),
            E(3),
            E(3),
            E(3),
            0.8,
            2,
            0.2,
            1,
            0.8,
            0.3,
            0.9,
            0,
            1,
          );
      } else if (!this.fired) {
        this.fired = !0;
        let e = this.apex;
        if (((this.g.visible = !1), this.tamas)) this.tamas.clear();
        (t.flashScreen(1, [1, 0.9, 0.6]),
          t.setGold(1),
          t.fx.flash(e.x, e.y, e.z, rt.gold, 140, 1.4));
        for (let s = 0; s < 4; s++)
          t.fx.ring(e.x, e.y, e.z, rt.gold, 60 + s * 30, 1 + s * 0.3);
        (t.audio("boom", 1.4), t.audio("choir", 1));
        for (let s = 0; s < 260; s++) {
          let i = Math.random() * 6.28,
            n = -Math.random() * 1.3,
            r = 30 + Math.random() * 60;
          t.fx.spark.emit(
            e.x,
            e.y,
            e.z,
            Math.cos(i) * Math.cos(n) * r,
            Math.sin(n) * r,
            Math.sin(i) * Math.cos(n) * r,
            2.5,
            1.4,
            0.2,
            2,
            1.5,
            0.6,
            1,
            6,
            0.8,
          );
        }
      } else {
        t.setGold(Math.max(0, 1 - (o - 1.8) / 4));
        let e = t.cam.position;
        if (Math.random() < 0.8)
          t.fx.add.emit(
            e.x + E(60),
            e.y + 20 + Math.random() * 30,
            e.z + E(60),
            0,
            -8,
            0,
            3,
            1.2,
            0.2,
            1,
            0.8,
            0.4,
            0.8,
            0,
            0,
          );
        if (o > 6) (t.setGold(0), (this.done = !0));
      }
    }
    dispose() {
      (this.api.scene.remove(this.g), (this.done = !0));
    }
  }
  var ss = G(),
    rs = G(0, 1, 0);
  class be {
    constructor() {
      ((this.ctx = null),
        (this.muted = !1),
        (this.intensity = 0.3),
        (this.celestial = !1),
        (this.beat = 0),
        (this.timer = null));
    }
    start() {
      if (this.ctx) {
        if (this.ctx.state === "suspended") this.ctx.resume();
        return;
      }
      let a = window.AudioContext || window.webkitAudioContext;
      if (!a) return;
      this.ctx = new a();
      let t = this.ctx;
      ((this.master = t.createGain()),
        (this.master.gain.value = this.muted ? 0 : 0.55),
        this.master.connect(t.destination));
      let o = t.createDynamicsCompressor();
      (o.connect(this.master),
        (this.out = o),
        (this.noise = t.createBuffer(1, t.sampleRate * 2, t.sampleRate)));
      let e = this.noise.getChannelData(0);
      for (let i = 0; i < e.length; i++) e[i] = Math.random() * 2 - 1;
      ((this.pad = t.createGain()), (this.pad.gain.value = 0));
      let s = t.createBiquadFilter();
      ((s.type = "lowpass"),
        (s.frequency.value = 500),
        (this.padLp = s),
        this.pad.connect(s),
        s.connect(this.out),
        [55, 82.4, 110.2, 164.8].forEach((i, n) => {
          let r = t.createOscillator();
          ((r.type = n % 2 ? "sawtooth" : "triangle"),
            (r.frequency.value = i),
            (r.detune.value = (n - 1.5) * 6));
          let l = t.createGain();
          ((l.gain.value = 0.12), r.connect(l), l.connect(this.pad), r.start());
        }),
        this.pad.gain.linearRampToValueAtTime(0.5, t.currentTime + 4),
        (this.timer = setInterval(() => this.tick(), 250)));
    }
    setMuted(a) {
      if (((this.muted = a), this.master))
        this.master.gain.value = a ? 0 : 0.55;
    }
    setMood(a, t) {
      if (((this.intensity = a), this.padLp))
        this.padLp.frequency.value = t ? 900 : 500;
      this.celestial = t;
    }
    tick() {
      if (!this.ctx || this.muted) return;
      this.beat++;
      let a = this.beat % 8;
      if (
        this.intensity > 0.05 &&
        (a === 0 || a === 3 || (this.intensity > 0.6 && a === 5))
      )
        this.drum(0.3 + this.intensity * 0.6);
      if (this.intensity > 0.5 && a % 2 === 1) this.drum(0.15, 0.6);
    }
    env(a, t, o, e, s) {
      (a.gain.setValueAtTime(0.0001, t),
        a.gain.exponentialRampToValueAtTime(s, t + o),
        a.gain.exponentialRampToValueAtTime(0.0001, t + o + e));
    }
    tone(a, t, o, e, s, i = 0) {
      let n = this.ctx,
        r = n.currentTime + i,
        l = n.createOscillator(),
        c = n.createGain();
      ((l.type = a),
        l.frequency.setValueAtTime(t, r),
        l.frequency.exponentialRampToValueAtTime(Math.max(20, o), r + e),
        this.env(c, r, 0.005, e, s),
        l.connect(c),
        c.connect(this.out),
        l.start(r),
        l.stop(r + e + 0.05));
    }
    hiss(a, t, o, e = 1, s = "bandpass", i = 0, n) {
      let r = this.ctx,
        l = r.currentTime + i,
        c = r.createBufferSource();
      c.buffer = this.noise;
      let g = r.createBiquadFilter();
      if (((g.type = s), g.frequency.setValueAtTime(o, l), n))
        g.frequency.exponentialRampToValueAtTime(n, l + a);
      g.Q.value = e;
      let v = r.createGain();
      (this.env(v, l, 0.01, a, t),
        c.connect(g),
        g.connect(v),
        v.connect(this.out),
        c.start(l, Math.random()),
        c.stop(l + a + 0.05));
    }
    drum(a = 0.5, t = 1) {
      (this.tone("sine", 140 * t, 42, 0.45, a),
        this.hiss(0.12, a * 0.25, 300, 0.7, "lowpass"));
    }
    play(a, t = 1) {
      if (!this.ctx || this.muted) return;
      switch (a) {
        case "bow":
          (this.tone("triangle", 520, 180, 0.12, 0.12 * t),
            this.hiss(0.22, 0.12 * t, 2200, 1.2, "bandpass", 0.02, 700));
          break;
        case "whoosh":
          this.hiss(0.35, 0.16 * t, 600, 0.8, "bandpass", 0, 2400);
          break;
        case "hit":
          (this.tone("sine", 160, 50, 0.22, 0.4 * t),
            this.hiss(0.15, 0.3 * t, 900, 0.7, "lowpass"));
          break;
        case "block":
          (this.tone("square", 900, 700, 0.12, 0.1 * t),
            this.tone("square", 1400, 1100, 0.18, 0.07 * t),
            this.hiss(0.1, 0.15 * t, 4000, 2, "highpass"));
          break;
        case "shield":
          this.tone("sine", 400, 900, 0.25, 0.12);
          break;
        case "parry":
          ([1760, 2640, 3520].forEach((o, e) =>
            this.tone("sine", o, o * 0.99, 0.9, 0.12 / (e + 1)),
          ),
            this.hiss(0.2, 0.2, 5000, 2, "highpass"));
          break;
        case "boom":
          (this.tone("sine", 90, 24, 1.4, 0.7 * Math.min(t, 1.5)),
            this.hiss(1, 0.35 * t, 400, 0.6, "lowpass", 0, 80));
          break;
        case "ram":
          (this.hiss(0.6, 0.3, 200, 0.6, "lowpass"),
            this.tone("sine", 70, 30, 0.5, 0.5));
          break;
        case "conch": {
          let o = this.ctx,
            e = o.currentTime,
            s = o.createOscillator(),
            i = o.createGain(),
            n = o.createBiquadFilter();
          ((s.type = "sawtooth"),
            s.frequency.setValueAtTime(196, e),
            s.frequency.linearRampToValueAtTime(233, e + 1.6),
            (n.type = "bandpass"),
            (n.frequency.value = 700),
            (n.Q.value = 2));
          let r = o.createOscillator(),
            l = o.createGain();
          ((r.frequency.value = 6),
            (l.gain.value = 5),
            r.connect(l),
            l.connect(s.frequency),
            r.start(e),
            r.stop(e + 2.6),
            i.gain.setValueAtTime(0.0001, e),
            i.gain.linearRampToValueAtTime(0.28, e + 0.3),
            i.gain.linearRampToValueAtTime(0.0001, e + 2.4),
            s.connect(n),
            n.connect(i),
            i.connect(this.out),
            s.start(e),
            s.stop(e + 2.5));
          break;
        }
        case "thunder":
          (this.hiss(1.8, 0.5 * t, 300, 0.5, "lowpass", 0, 60),
            this.hiss(0.2, 0.4, 3000, 1, "highpass"));
          break;
        case "roar":
          (this.hiss(1.8, 0.3, 300, 1.5, "bandpass", 0, 120),
            this.tone("sawtooth", 110, 55, 1.6, 0.25));
          break;
        case "choir": {
          let o = this.ctx,
            e = o.currentTime;
          [220, 277.2, 329.6, 440, 554.4].forEach((s, i) => {
            let n = o.createOscillator(),
              r = o.createGain();
            ((n.type = "sine"),
              (n.frequency.value = s * (1 + (i - 2) * 0.002)),
              r.gain.setValueAtTime(0.0001, e),
              r.gain.linearRampToValueAtTime(0.09, e + 1.4),
              r.gain.linearRampToValueAtTime(0.0001, e + 4.5),
              n.connect(r),
              r.connect(this.out),
              n.start(e),
              n.stop(e + 4.6));
          });
          break;
        }
        case "jump":
          this.hiss(0.15, 0.08, 800, 1, "bandpass", 0, 1600);
          break;
        case "astra0":
          (this.hiss(1.4, 0.4, 500, 0.7, "bandpass", 0, 3000),
            this.tone("sawtooth", 90, 400, 1.2, 0.15));
          break;
        case "astra1":
          (this.hiss(1.6, 0.4, 1500, 0.5, "bandpass", 0, 300),
            this.tone("sine", 300, 1200, 1, 0.12));
          break;
        case "astra2":
          (this.hiss(0.5, 0.45, 3000, 1, "highpass"),
            this.tone("sawtooth", 800, 60, 0.9, 0.2));
          break;
        case "astra3":
          (this.tone("sine", 55, 440, 2.2, 0.35),
            this.hiss(2.2, 0.4, 400, 0.6, "bandpass", 0, 4000));
          break;
        case "spear":
          this.hiss(0.5, 0.25, 400, 1, "bandpass", 0, 1200);
          break;
        case "drums":
          for (let o = 0; o < 6; o++) setTimeout(() => this.drum(0.7), o * 280);
          break;
        default:
          break;
      }
    }
    dispose() {
      if (this.timer) clearInterval(this.timer);
      if (this.ctx) this.ctx.close();
      this.ctx = null;
    }
  }
  class Ee {
    constructor(a, t) {
      ((this.c = a),
        (this.opts = t),
        (this.muted = !1),
        (this.q = t.quality || "cinematic"),
        (this.shown = {}),
        this.root);
    }
    build() {
      let a = this.c;
      ((this.style = document.createElement("style")),
        (this.style.textContent = `
.rrd{position:absolute;inset:0;overflow:hidden;background:#000;color:#fff2d8;font-family:'Cormorant Garamond',Georgia,serif;user-select:none;-webkit-user-select:none}
.rrd *{box-sizing:border-box}
.rrd-canvas{position:absolute;inset:0}
.rrd-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,rgba(6,0,8,.5) 100%)}
.rrd-bar{position:absolute;left:0;right:0;height:7vh;background:#000;pointer-events:none;z-index:3}.rrd-bar.t{top:0}.rrd-bar.b{bottom:0}
.rrd-card{position:absolute;left:0;right:0;top:30%;text-align:center;pointer-events:none;z-index:4;opacity:0;transition:opacity 1.2s ease}
.rrd-card.on{opacity:1}
.rrd-card small{display:block;font-family:'Cinzel',serif;letter-spacing:.5em;font-size:clamp(10px,1.5vw,16px);color:#ffcf6a;margin-bottom:1.2vh;text-shadow:0 2px 12px #000}
.rrd-card h1{margin:0;font-family:'Tiro Devanagari Hindi','Noto Sans Devanagari',serif;font-weight:400;font-size:clamp(44px,9vw,128px);line-height:1;color:#ffe6a8;text-shadow:0 0 40px rgba(255,150,40,.7),0 4px 20px #000}
.rrd-card h1 em{font-style:normal;color:#ff5a30;margin:0 .25em;font-size:.6em}
.rrd-card h2{margin:1.4vh 0 0;font-family:'Cinzel',serif;font-weight:500;letter-spacing:.6em;font-size:clamp(12px,2vw,24px);color:#fff2d8;text-shadow:0 2px 14px #000}
.rrd-tag{position:absolute;left:5vw;bottom:12vh;z-index:4;pointer-events:none;opacity:0;transform:translateY(10px);transition:opacity .8s,transform .8s}
.rrd-tag.on{opacity:1;transform:none}
.rrd-tag b{display:block;font-family:'Tiro Devanagari Hindi',serif;font-weight:400;font-size:clamp(26px,4vw,56px);color:#ffe6a8;text-shadow:0 2px 16px #000}
.rrd-tag span{font-family:'Cinzel',serif;letter-spacing:.3em;font-size:clamp(10px,1.3vw,15px);color:#ffcf6a;text-shadow:0 2px 10px #000}
.rrd-astra{position:absolute;left:0;right:0;bottom:11vh;text-align:center;pointer-events:none;z-index:4;opacity:0;transform:translateY(14px);transition:opacity .6s,transform .6s}
.rrd-astra.on{opacity:1;transform:none}
.rrd-astra b{display:block;font-family:'Tiro Devanagari Hindi','Noto Sans Devanagari',serif;font-weight:400;font-size:clamp(34px,6vw,84px);color:#ffe6a8;text-shadow:0 0 30px rgba(255,140,40,.8),0 3px 14px #000;line-height:1.1}
.rrd-astra i{display:block;font-style:normal;font-family:'Cinzel',serif;letter-spacing:.5em;font-size:clamp(12px,1.9vw,22px);color:#ffcf6a;margin-top:.6vh;text-shadow:0 2px 10px #000}
.rrd-astra p{margin:.8vh 0 0;font-size:clamp(14px,1.9vw,24px);font-style:italic;color:#fff2d8;text-shadow:0 2px 10px #000}
.rrd-prog{position:absolute;left:5vw;right:5vw;bottom:3vh;height:2px;background:rgba(255,230,170,.18);z-index:4;pointer-events:none}.rrd-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffcf6a,#ff7a30)}
.rrd-corner{position:absolute;right:max(14px,2vw);top:calc(7vh + 10px);z-index:6;display:flex;gap:8px}
.rrd-corner button{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,207,106,.55);background:rgba(14,8,18,.55);color:#ffe6a8;font-size:15px;cursor:pointer;backdrop-filter:blur(6px)}
.rrd-corner button:hover{background:rgba(60,30,10,.7)}
.rrd-start,.rrd-end,.rrd-pause{position:absolute;inset:0;z-index:7;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 16px}
.rrd-start{background:radial-gradient(ellipse at 50% 60%,rgba(40,14,4,.25),rgba(4,0,6,.78));transition:opacity 1s}
.rrd-start.off{opacity:0;pointer-events:none}
.rrd-start .in{max-width:760px}
.rrd-start small,.rrd-end small{font-family:'Cinzel',serif;letter-spacing:.5em;font-size:clamp(10px,1.4vw,15px);color:#ffcf6a}
.rrd-start h1{margin:1.2vh 0;font-family:'Tiro Devanagari Hindi',serif;font-weight:400;font-size:clamp(52px,11vw,150px);line-height:1;color:#ffe6a8;text-shadow:0 0 50px rgba(255,140,30,.8),0 4px 24px #000}
.rrd-start h1 em{font-style:normal;color:#ff5a30;font-size:.55em;margin:0 .2em}
.rrd-start h2{margin:0 0 2.4vh;font-family:'Cinzel',serif;font-weight:500;letter-spacing:.6em;font-size:clamp(12px,2vw,24px)}
.rrd-start p{margin:0 auto 3vh;max-width:560px;font-size:clamp(15px,1.8vw,21px);line-height:1.45;color:#f3e2c2}
.rrd-btn{font-family:'Cinzel',serif;font-weight:700;letter-spacing:.3em;font-size:clamp(12px,1.5vw,16px);padding:15px 34px;color:#1a0a00;background:linear-gradient(#ffe08a,#ff9a30);border:0;border-radius:2px;cursor:pointer;box-shadow:0 0 30px rgba(255,150,40,.5)}
.rrd-btn:hover{filter:brightness(1.1)}
.rrd-ghost{font-family:'Cinzel',serif;letter-spacing:.2em;font-size:12px;padding:12px 18px;margin-left:12px;color:#ffe6a8;background:transparent;border:1px solid rgba(255,207,106,.5);border-radius:2px;cursor:pointer}
.rrd-end{background:#000;opacity:0;pointer-events:none;transition:opacity 2.4s ease}
.rrd-end.on{opacity:1;pointer-events:auto}
.rrd-end h3{margin:2vh 0 1vh;font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;font-size:clamp(30px,5.6vw,74px);color:#ffe6a8;text-shadow:0 0 30px rgba(255,140,40,.5)}
.rrd-end h4{margin:0 0 4vh;font-family:'Tiro Devanagari Hindi',serif;font-weight:400;font-size:clamp(20px,3vw,40px);color:#ffcf6a}
.rrd-pause{background:rgba(4,0,6,.6);display:none}.rrd-pause.on{display:flex}
@media (max-width:600px){.rrd-bar{height:5vh}.rrd-corner{top:calc(5vh + 8px)}}
`),
        document.head.appendChild(this.style));
      let t = this.root;
      t.insertAdjacentHTML(
        "beforeend",
        `
      <div class="rrd-vig"></div><div class="rrd-bar t"></div><div class="rrd-bar b"></div>
      <div class="rrd-card" id="rrdCard"><small>YUDDHA KANDA</small><h1>राम<em>×</em>रावण</h1><h2>THE GREAT DUEL</h2></div>
      <div class="rrd-tag" id="rrdTag"><b></b><span></span></div>
      <div class="rrd-astra" id="rrdAstra"><b></b><i></i><p></p></div>
      <div class="rrd-prog"><i id="rrdProg"></i></div>
      <div class="rrd-corner"><button id="rrdMute" title="Sound (M)">\uD83D\uDD0A</button><button id="rrdPause" title="Pause (Esc)">❚❚</button></div>
      <div class="rrd-start" id="rrdStart"><div class="in"><small>YUDDHA KANDA</small><h1>राम<em>×</em>रावण</h1><h2>THE GREAT DUEL</h2>
        <p>Rama stands on the battlefield, Ravana charges on his chariot. Two archers, two divine arsenals — the greatest archery duel ever told.</p>
        <div><button class="rrd-btn" id="rrdBegin">BEGIN</button><button class="rrd-ghost" id="rrdQ">Graphics: Cinematic</button></div></div></div>
      <div class="rrd-pause" id="rrdPauseP"><div><h3 style="font-family:Cinzel,serif;letter-spacing:.4em">PAUSED</h3><button class="rrd-btn" id="rrdResume">RESUME</button></div></div>
      <div class="rrd-end" id="rrdEnd"><div><small>YUDDHA KANDA · PART I</small><h3>…and the battle continues</h3><h4>और युद्ध जारी है…</h4><button class="rrd-btn" id="rrdReplay">WATCH AGAIN</button></div></div>`,
      );
      let o = (e) => t.querySelector("#" + e);
      ((this.el = {
        card: o("rrdCard"),
        tag: o("rrdTag"),
        astra: o("rrdAstra"),
        prog: o("rrdProg"),
        start: o("rrdStart"),
        end: o("rrdEnd"),
        pause: o("rrdPauseP"),
        mute: o("rrdMute"),
        q: o("rrdQ"),
      }),
        (o("rrdBegin").onclick = () => this.onBegin && this.onBegin()),
        (this.el.q.onclick = () => {
          ((this.q = this.q === "cinematic" ? "balanced" : "cinematic"),
            (this.el.q.textContent =
              "Graphics: " +
              (this.q === "cinematic" ? "Cinematic" : "Balanced")),
            this.onQuality && this.onQuality(this.q));
        }),
        (this.el.mute.onclick = () => this.toggleMute()),
        (o("rrdPause").onclick = () => this.onPause && this.onPause()),
        (o("rrdResume").onclick = () => this.onPause && this.onPause()),
        (o("rrdReplay").onclick = () => this.onReplay && this.onReplay()));
    }
    get root() {
      if (!this._root)
        ((this._root = document.createElement("div")),
          (this._root.className = "rrd"),
          (this.canvasHost = document.createElement("div")),
          (this.canvasHost.className = "rrd-canvas"),
          this._root.appendChild(this.canvasHost),
          this.c.appendChild(this._root));
      return this._root;
    }
    height() {
      return this.c.clientHeight || window.innerHeight;
    }
    hideTitle() {
      this.el.start.classList.add("off");
    }
    toggleMute() {
      ((this.muted = !this.muted),
        (this.el.mute.textContent = this.muted
          ? "\uD83D\uDD07"
          : "\uD83D\uDD0A"),
        this.onMute && this.onMute(this.muted));
    }
    pause(a) {
      this.el.pause.classList.toggle("on", a);
    }
    progress(a) {
      this.el.prog.style.width = (a * 100).toFixed(2) + "%";
    }
    astra(a) {
      let t = this.el.astra;
      ((t.querySelector("b").textContent = a.name),
        (t.querySelector("i").textContent = a.en),
        (t.querySelector("p").textContent = a.line),
        t.classList.add("on"),
        clearTimeout(this._at),
        (this._at = setTimeout(() => t.classList.remove("on"), 5200)));
    }
    tag(a, t, o = 3000) {
      let e = this.el.tag;
      ((e.querySelector("b").textContent = a),
        (e.querySelector("span").textContent = t),
        e.classList.add("on"),
        clearTimeout(this._tt),
        (this._tt = setTimeout(() => e.classList.remove("on"), o)));
    }
    tick(a) {
      let t = (o, e) => {
        if (!this.shown[o]) ((this.shown[o] = 1), e());
      };
      if (a > 0.8)
        t("title", () => {
          (this.el.card.classList.add("on"),
            setTimeout(() => this.el.card.classList.remove("on"), 4600));
        });
      if (a > 6.9)
        t("rama", () =>
          this.tag("श्री राम", "PRINCE OF AYODHYA · THE KODANDA BOW", 3200),
        );
      if (a > 10.3)
        t("rav", () =>
          this.tag("रावण", "KING OF LANKA · MASTER OF MAYA", 3200),
        );
    }
    end() {
      this.el.end.classList.add("on");
    }
    destroy() {
      if ((clearTimeout(this._at), clearTimeout(this._tt), this._root))
        this._root.remove();
      if (this.style) this.style.remove();
    }
  }
  var Te = 120,
    Xt = 27.5,
    ua = 29.3,
    Kt = 30.6,
    Yt = 37.2,
    X0 = 37.4,
    Re = 41.4,
    Ut = 43.5,
    jt = 51,
    b0 = 51.2,
    g0 = 52.6,
    ho = 7.2,
    n0 = G(0, 0, 0),
    fo = G(),
    xa = (a, t) => {
      let o = 0.55 * a + 0.6,
        e = a < Xt ? 34 : 34 + (a - Xt) * 7;
      return t.set(e * Math.sin(o), 0, e * Math.cos(o));
    },
    Pt = (() => {
      let a = xa(Xt, fo),
        t = Math.hypot(a.x, a.z) || 1;
      return G((a.x / t) * 26, 0, (a.z / t) * 26);
    })(),
    Mt = (() => {
      let a = Math.hypot(Pt.x, Pt.z);
      return G(Pt.x - (Pt.x / a) * 5, 0, Pt.z - (Pt.z / a) * 5);
    })(),
    nt = (() => {
      let a = Math.hypot(Mt.x, Mt.z),
        t = Mt.x / a,
        o = Mt.z / a;
      return G(-o * 9 + t * -2, 0, t * 9 + o * -2);
    })(),
    ke = Math.atan2(nt.x - Mt.x, nt.z - Mt.z),
    po = Math.hypot(nt.x - Mt.x, nt.z - Mt.z),
    uo = 0.36,
    mo = 31,
    go = Math.atan2(Math.cos(ke), -Math.sin(ke)),
    xo = (a) => {
      if (a <= 0) return 0;
      let t = a / 4;
      return t < 1 ? 4 * (t * t * t - (t * t * t * t) / 2) : a - 2;
    },
    ma = (a, t, o) => {
      if (a === "rav") return xa(t, o);
      if (t < g0) return o.copy(nt);
      let e = t - g0,
        s = ke + uo * xo(e),
        i = L(po, mo, pt(e / 6));
      return o.set(Mt.x + i * Math.sin(s), 0, Mt.z + i * Math.cos(s));
    },
    vo = [
      {
        t: 62,
        kind: "naga",
        by: "rav",
        name: "नागास्त्र",
        en: "NAGASTRA",
        line: "Ravana looses a swarm of serpent arrows",
      },
      {
        t: 72,
        kind: "garuda",
        by: "rama",
        name: "गरुडास्त्र",
        en: "GARUDASTRA",
        line: "Rama answers with the divine eagle",
      },
      {
        t: 83,
        kind: "agni",
        by: "rama",
        name: "आग्नेयास्त्र",
        en: "AGNEYASTRA",
        line: "Rama calls down a rain of fire",
      },
      {
        t: 94,
        kind: "tamas",
        by: "rav",
        name: "तमस्त्र",
        en: "TAMASASTRA",
        line: "Ravana veils the sky in darkness",
      },
      {
        t: 102.5,
        kind: "surya",
        by: "rama",
        name: "सूर्यास्त्र",
        en: "SURYASTRA",
        line: "Rama unleashes the radiance of the sun",
      },
    ],
    yo = 1.7,
    ga = {
      aim: 0,
      draw: 0,
      nock: 0,
      kick: 0,
      glow: 0,
      cast: 0,
      crouch: 0,
      aimUp: 0,
      roar: 0,
    };
  function va(a, t = {}) {
    let o = new Ee(a, t),
      e = new be(),
      s = t.quality || "cinematic",
      i = new lt.WebGLRenderer({
        antialias: !1,
        powerPreference: "high-performance",
        alpha: !1,
      });
    ((i.toneMapping = lt.NoToneMapping),
      (i.shadowMap.enabled = !0),
      (i.shadowMap.type = lt.PCFShadowMap),
      i.setClearColor(0),
      o.canvasHost.appendChild(i.domElement),
      (i.domElement.style.cssText = "display:block;width:100%;height:100%"));
    let n = new lt.Scene(),
      r = new lt.PerspectiveCamera(45, 1, 0.3, 4000),
      l = new ne(i),
      c = document.createElement("div");
    ((c.style.cssText =
      "position:absolute;left:8px;top:8px;max-width:70%;z-index:99;font:11px monospace;color:#ff8a70;white-space:pre-wrap;pointer-events:none"),
      a.appendChild(c));
    let g = (d, u) => {
        (console.error(d, u),
          (c.textContent = d + ": " + (u && u.message ? u.message : u)));
      },
      v = (d, u) => {
        try {
          u();
        } catch (p) {
          g(d, p);
        }
      };
    i.domElement.addEventListener("webglcontextlost", (d) => {
      (d.preventDefault(),
        g("webgl", "graphics context lost - reload the page"));
    });
    let y = null;
    try {
      ((y = new Audio(t.shankhUrl || "/audio/shankh.mp3")),
        (y.preload = "auto"),
        (y.volume = 0.95));
    } catch (d) {
      y = null;
    }
    let bg = null,
      bgTimers = [];
    try {
      ((bg = new Audio(t.battleUrl || "/audio/ram_vs_ravan.mp3")),
        (bg.preload = "auto"),
        (bg.loop = !0),
        (bg.volume = 0));
    } catch (d) {
      bg = null;
    }
    let bgRamp = (to, ms) => {
      if (!bg) return;
      let from = bg.volume,
        t0 = performance.now(),
        step = () => {
          if (!bg) return;
          let k = Math.min(1, (performance.now() - t0) / ms);
          try {
            bg.volume = from + (to - from) * k;
          } catch (d) {}
          if (k < 1) bgTimers.push(setTimeout(step, 50));
        };
      step();
    };
    let M = () => {
      /* shankh for ~3.5 s, then the battle theme takes over */
      if (!y) e.play("conch");
      else {
        y.onerror = () => e.play("conch");
        try {
          y.currentTime = 0;
          let d = y.play();
          if (d && d.catch) d.catch(() => e.play("conch"));
        } catch (d) {
          e.play("conch");
        }
      }
      bgTimers.push(
        setTimeout(() => {
          if (y) {
            let t0 = performance.now(),
              fade = () => {
                let k = Math.min(1, (performance.now() - t0) / 700);
                try {
                  y.volume = 0.95 * (1 - k);
                  if (k >= 1) y.pause();
                } catch (d) {}
                if (k < 1) bgTimers.push(setTimeout(fade, 50));
              };
            fade();
          }
        }, 3500),
      );
      if (bg)
        bgTimers.push(
          setTimeout(() => {
            if (h.paused) return;
            try {
              bg.currentTime = 0;
              bg.volume = 0;
              let d = bg.play();
              if (d && d.catch) d.catch(() => {});
              bgRamp(0.75, 1200);
            } catch (d) {}
          }, 3200),
        );
    };
    let bgPause = (z) => {
      for (let a of [y, bg]) if (a && a !== y) {
        try {
          if (z) a.pause();
          else if (h.started && !h.ended && h.gt > 3.2) a.play().catch(() => {});
        } catch (d) {}
      }
    };
    ((n.environment = qe(i)), (n.fog = new lt.FogExp2(10838076, 0.0016)));
    let z = ia();
    n.add(z);
    let w = na();
    n.add(w);
    let S = la();
    n.add(S);
    let P = da();
    n.add(P);
    let W = ca();
    (n.add(W), n.add(ha()));
    let H = fa(n);
    H.fill.visible = !1;
    let K = { rama: me("rama"), rav: me("rav") },
      I = { rama: fe(), rav: pe() },
      at = { rama: N0("matali"), rav: N0("demon") };
    (K.rav.rider.add(I.rav.root),
      K.rav.driver.add(at.rav.root),
      K.rama.driver.add(at.rama.root),
      n.add(K.rama.group, K.rav.group, I.rama.root),
      (K.rama.group.visible = !1));
    let dt = {};
    for (let d of ["rama", "rav"]) {
      let u = pa(d === "rama" ? 16760912 : 16726562);
      (n.add(u), (dt[d] = u));
    }
    let R = new ge(n),
      f = new xe(n, R),
      x = new lt.PointLight(16777215, 0, 160, 2);
    n.add(x);
    let k = new lt.Mesh(
      new lt.CylinderGeometry(4, 10, 170, 40, 1, !0),
      new lt.ShaderMaterial({
        transparent: !0,
        depthWrite: !1,
        blending: lt.AdditiveBlending,
        side: lt.DoubleSide,
        fog: !1,
        uniforms: {
          uA: { value: 0 },
          uCol: { value: new lt.Color(1, 0.82, 0.45) },
          uTime: { value: 0 },
        },
        vertexShader:
          "varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
        fragmentShader:
          "uniform float uA, uTime; uniform vec3 uCol; varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vec3 v = normalize(cameraPosition - vW); float f = pow(abs(dot(normalize(vN), v)), 1.4); float st = 0.72 + 0.28 * sin(vUv.x * 62.0 + uTime * 1.6) * sin(vUv.x * 23.0 - uTime); float h = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.6, vUv.y); float a = f * st * (0.2 + 0.8 * vUv.y) * uA * h; gl_FragColor = vec4(uCol * a * 2.4, a); }",
      }),
    );
    ((k.visible = !1), (k.frustumCulled = !1), (k.renderOrder = 5), n.add(k));
    let h = {
        gt: 0,
        started: !1,
        ended: !1,
        paused: !1,
        scale: 1,
        scaleTarget: 1,
        dark: 0,
        darkT: 0,
        gold: 0,
        shakeA: 0,
        flash: 0,
        flashCol: new lt.Color(1, 1, 1),
        time: 0,
        lastArrow: null,
        shotKey: "",
      },
      _ = {
        rama: { x: 0, z: 0, h: go, hp: 0, speed: 0, roll: 0, v: G() },
        rav: { x: 0, z: 0, h: 0, hp: 0, speed: 15, roll: 0, v: G() },
      },
      F = {
        rama: { mode: "ground", sc: 1, airK: 0, walkK: 0 },
        rav: { mode: "chariot", sc: 1, airK: 0, walkK: 0, tf: 0 },
      },
      N = {},
      q = G(),
      ft = G(),
      It = G(),
      Gt = (d, u, p) => pt(ot((p - d) / (u - d), 0, 1)),
      bt = (d, u) => kt(d, u);
    function Vt(d, u) {
      let p = _[d],
        m = K[d].group;
      if (d === "rama" && h.gt < Ut) return;
      if (d === "rav" && h.gt > Xt + 8) {
        m.visible = !1;
        return;
      }
      let T = ma(d, h.gt, q),
        O = ma(d, h.gt + 0.08, ft),
        J = (O.x - T.x) / 0.08,
        A = (O.z - T.z) / 0.08;
      if (
        ((p.speed = Math.hypot(J, A)),
        p.v.set(
          F[d].mode === "chariot" ? J : 0,
          0,
          F[d].mode === "chariot" ? A : 0,
        ),
        p.speed > 0.6)
      ) {
        let it = Math.atan2(J, A),
          ut = A0(it - p.h);
        ((p.roll = Et(
          p.roll,
          ot((-ut / Math.max(u, 0.001)) * 0.06, -0.12, 0.12) - 0.04,
          6,
          u,
        )),
          (p.h = it));
      } else p.roll = Et(p.roll, 0, 4, u);
      ((p.x = T.x), (p.z = T.z));
      let V = 0;
      if (d === "rama" && h.gt < jt) {
        let it = ot((h.gt - Ut) / (jt - Ut), 0, 1);
        V = 90 * (1 - it) * (1 - it);
      }
      if (
        (m.position.set(
          p.x,
          bt(p.x, p.z) +
            1.5 +
            V +
            Math.sin(h.time * 1.4 + (d === "rav" ? 2 : 0)) * 0.12,
          p.z,
        ),
        m.rotation.set(0, p.h, p.roll, "YXZ"),
        (m.visible = !0),
        d === "rama" && V > 0.5)
      )
        p.speed = 7;
    }
    function e0(d) {
      let u = h.gt,
        p = I.rama.root,
        m = I.rav.root;
      if (u < b0) p.position.set(n0.x, bt(n0.x, n0.z), n0.z);
      else if (u < g0) {
        let O = (u - b0) / (g0 - b0);
        (K.rama.rider.getWorldPosition(q),
          p.position.set(
            L(n0.x, q.x, pt(O)),
            L(bt(0, 0), q.y, pt(O)) + Math.sin(O * Math.PI) * 2.6,
            L(n0.z, q.z, pt(O)),
          ),
          (F.rama.mode = "air"));
      } else if (F.rama.mode !== "chariot") {
        if (
          ((F.rama.mode = "chariot"),
          K.rama.rider.add(p),
          p.position.set(0, 0, 0),
          p.rotation.set(0, 0, 0),
          (I.rama.body.rotation.y -= _.rama.h),
          !N.board)
        )
          ((N.board = 1), e.play("conch", 0.9));
      }
      let T = F.rav;
      if (u >= Xt && T.mode === "chariot")
        ((T.mode = "air"),
          K.rav.group.updateMatrixWorld(!0),
          n.attach(m),
          m.rotation.set(0, 0, 0),
          (I.rav.body.rotation.y += _.rav.h),
          m.scale.setScalar(1),
          (N.start = m.position.clone()),
          (yt.rav.st = "wait"),
          o.tag("रावण", "LEAPS FROM HIS CHARIOT", 2600));
      if (T.mode === "air" || T.mode === "ground") {
        if (u < ua) {
          let O = (u - Xt) / (ua - Xt),
            J = bt(Pt.x, Pt.z);
          m.position.set(
            L(N.start.x, Pt.x, O),
            L(N.start.y, J, O) + Math.sin(O * Math.PI) * 11,
            L(N.start.z, Pt.z, O),
          );
        } else {
          if (T.mode === "air") ((T.mode = "ground"), l0());
          let O = pt(ot((u - X0) / (Re - X0), 0, 1)),
            J = L(Pt.x, Mt.x, O),
            A = L(Pt.z, Mt.z, O);
          m.position.set(J, bt(J, A), A);
        }
        ((T.sc = 1 + (ho - 1) * Gt(Kt, Yt, u)), m.scale.setScalar(T.sc));
      }
      ((T.tf = Gt(Kt + 0.8, Yt - 0.4, u)), (I.rav.tf.v = T.tf));
      for (let O of ["rama", "rav"]) {
        let J = I[O].root;
        if (J.parent === n) J.updateMatrixWorld(!0);
      }
    }
    function l0() {
      (e.play("boom", 1), (h.shakeA = Math.max(h.shakeA, 0.8)));
      let d = Pt,
        u = bt(d.x, d.z);
      (R.explosion(d.x, u + 1, d.z, rt.fire, 1.2),
        R.dust(d.x, u, d.z, 40),
        R.ring(d.x, u + 0.5, d.z, rt.red, 14, 0.7));
    }
    function Z0(d) {
      let u = h.gt;
      if (u >= Kt && !N.x0) {
        ((N.x0 = 1),
          e.play("roar", 1),
          e.play("thunder", 0.8),
          o.astra({
            name: "विश्वरूप",
            en: "VISHWAROOPA",
            line: "Ravana takes his enormous form — ten heads, twenty arms",
          }));
        let T = Pt;
        R.ring(T.x, bt(T.x, T.z) + 0.6, T.z, rt.red, 30, 1.1);
      }
      if (u >= Kt && u < Yt + 0.6) {
        h.shakeA = Math.max(
          h.shakeA,
          0.3 + 0.35 * Math.sin((u - Kt) * 3.5) ** 2,
        );
        let T = Q0();
        if (Math.random() < 0.7)
          R.glowBurst(
            T.x + E(F.rav.sc * 1.2),
            T.y + Math.random() * F.rav.sc * 2,
            T.z + E(F.rav.sc * 1.2),
            [1, 0.35, 0.12],
            3,
            3 * F.rav.sc * 0.3,
            1.2,
            0.8,
          );
        if (Math.random() < 0.5)
          R.dust(T.x + E(F.rav.sc * 1.5), T.y, T.z + E(F.rav.sc * 1.5), 4);
      }
      if (u >= Yt && !N.x1) {
        ((N.x1 = 1),
          e.play("boom", 1),
          (h.flash = Math.max(h.flash, 0.22)),
          h.flashCol.setRGB(1, 0.5, 0.25));
        let T = Q0();
        (R.ring(T.x, T.y + 0.5, T.z, rt.red, 60, 1.2),
          R.dust(T.x, T.y, T.z, 80));
      }
      if (F.rav.mode === "ground" && u > X0 && u < Re + 0.5) {
        let T = Math.sin(I.rav.wph || 0);
        if (Math.sign(T) !== (N.stepSign || 0)) {
          N.stepSign = Math.sign(T);
          let O = Q0();
          (e.play("hit", 0.9),
            (h.shakeA = Math.max(h.shakeA, 0.45)),
            R.dust(O.x + E(6), O.y, O.z + E(6), 18));
        }
      }
      let p = Gt(Ut, Ut + 2.2, u) * (1 - Gt(jt + 0.5, jt + 3.4, u));
      if (u >= Ut && !N.d0)
        ((N.d0 = 1),
          e.play("choir", 1),
          e.play("thunder", 0.7),
          (h.flash = Math.max(h.flash, 0.3)),
          h.flashCol.setRGB(1, 0.9, 0.6),
          o.astra({
            name: "दिव्य रथ",
            en: "THE DIVINE CHARIOT",
            line: "Indra sends his celestial chariot from the heavens",
          }));
      if (u >= jt && !N.d1)
        ((N.d1 = 1),
          e.play("boom", 0.8),
          (h.shakeA = Math.max(h.shakeA, 0.5)),
          R.ring(nt.x, bt(nt.x, nt.z) + 0.5, nt.z, rt.gold, 18, 0.9),
          R.glowBurst(
            nt.x,
            bt(nt.x, nt.z) + 2,
            nt.z,
            [1, 0.75, 0.35],
            16,
            10,
            1.2,
            0.4,
          ),
          R.dust(nt.x, bt(nt.x, nt.z), nt.z, 30));
      if (
        ((k.visible = p > 0.01),
        (k.material.uniforms.uA.value = p * 0.3),
        (k.material.uniforms.uTime.value = h.time),
        k.position.set(nt.x, bt(nt.x, nt.z) + 85, nt.z),
        p > 0.02)
      )
        h.gold = 0.1 * p;
      else if (N.d0 && !N.gz && u > jt) ((N.gz = 1), (h.gold = 0));
      let m = K.rama.group.position;
      if (p > 0.05)
        (x.position.set(m.x, m.y + 3, m.z),
          (x.intensity = Math.max(x.intensity, 350 * p)));
      if (u >= Ut && u < g0 + 1.5)
        for (let T = 0; T < 2; T++)
          R.add.emit(
            m.x + E(7),
            m.y + 1 + Math.random() * 6,
            m.z + E(7),
            E(1.2),
            -2.2 - Math.random() * 2,
            E(1.2),
            4.5,
            0.3,
            0.1,
            0.8,
            0.55 + Math.random() * 0.2,
            0.4,
            0.3,
            0,
            0.3,
          );
      if (u >= Ut && u < jt)
        for (let T = 0; T < 1; T++)
          R.add.emit(
            m.x + E(1.5),
            m.y + E(1),
            m.z + E(1.5),
            E(2),
            2 + Math.random() * 3,
            E(2),
            0.9,
            1.6,
            0.2,
            1,
            0.8,
            0.4,
            0.9,
            0,
            1.5,
          );
    }
    let Q0 = () => I.rav.root.getWorldPosition(It),
      a0 = (d, u) => I[d].head.getWorldPosition(u),
      Tt = (d, u = G()) => (
        I[d].root.getWorldPosition(u),
        (u.y += (d === "rav" ? 1.5 : 1.3) * F[d].sc),
        u
      ),
      $0 = (d, u = G()) => ra(I[d], u),
      yt = {};
    for (let d of ["rama", "rav"])
      yt[d] = {
        k: d,
        st: "wait",
        t: 0,
        next: 4 + (d === "rav" ? 0.8 : 0),
        draw: 0,
        nock: 1,
        kick: 0,
        glow: 0,
        glowX: 0,
        cast: 0,
        castK: 0,
        mode: "deflect",
        roar: 0,
        casting: !1,
      };
    let Rt = null,
      J0 = 9,
      T0 = (d) => (d === "rama" ? "rav" : "rama");
    function wa(d) {
      let u = T0(d.k),
        p = $0(d.k, G()),
        m = p.clone(),
        T = Tt(u, G()),
        O = T.clone().sub(m),
        J = O.length(),
        V = T.clone().addScaledVector(_[u].v, (J / 78) * 0.9);
      if (d.mode === "collide") V = m.clone().lerp($0(u, G()), 0.5);
      else if (d.mode === "miss") {
        let ut = G(-O.z, 0, O.x)
          .normalize()
          .multiplyScalar(
            (Math.random() < 0.5 ? -1 : 1) * (7 + Math.random() * 6),
          );
        V.add(ut).y += E(3);
      } else if (d.mode === "ground")
        V.set(T.x + E(14), kt(T.x, T.z) + 0.2, T.z + E(14));
      let it = f.spawn(p, V.sub(p), 78, d.k, {
        mode: d.mode,
        life: 3.5,
        scale: d.k === "rav" ? Math.max(1, F.rav.sc * 0.55) : 1,
        big: d.k === "rav" ? F.rav.sc * 0.2 : 0,
      });
      if (it) h.lastArrow = it;
      ((d.kick = 1),
        e.play("bow", 0.8),
        R.sparks(p.x, p.y, p.z, d.k === "rama" ? rt.gold : rt.red, 8, 6, 0.4));
    }
    function Ma(d, u) {
      let p = h.gt;
      if (d.casting) return;
      if (d.busy) {
        ((d.st = "wait"),
          (d.next = Math.max(d.next, p + 0.5)),
          (d.draw = Et(d.draw, 0.08, 6, u)),
          (d.nock = 1));
        return;
      }
      if (((d.t += u), d.st === "wait")) {
        if (
          ((d.draw = Et(d.draw, 0.08, 6, u)),
          (d.nock = 1),
          Rt && Rt.k === "collide" && p >= Rt.start && !Rt.joined[d.k])
        )
          ((Rt.joined[d.k] = !0),
            (d.mode = "collide"),
            (d.st = "draw"),
            (d.t = 0),
            (d.dur = Rt.rel - p));
        else if (!Rt && p >= d.next && p < 118) {
          ((d.st = "draw"), (d.t = 0), (d.dur = 0.75 + Math.random() * 0.3));
          let m = Math.random();
          d.mode = m < 0.5 ? "deflect" : m < 0.78 ? "miss" : "ground";
        }
      } else if (d.st === "draw") {
        if (
          ((d.draw = ot(d.t / Math.max(0.3, d.dur), 0, 1)),
          (d.draw = pt(d.draw)),
          d.t >= d.dur)
        )
          ((d.st = "hold"),
            (d.t = 0),
            (d.hold = d.mode === "collide" ? 0 : 0.18));
      } else if (d.st === "hold") {
        if (((d.draw = 1), d.t >= (d.hold || 0))) {
          if (
            (wa(d),
            (d.st = "rec"),
            (d.t = 0),
            (d.nock = 0),
            d.mode === "collide")
          )
            Rt.fired[d.k] = !0;
        }
      } else if (d.st === "rec") {
        if (((d.draw = Et(d.draw, 0, 14, u)), d.t > 0.2)) d.nock = 1;
        if (d.t > 0.35)
          ((d.st = "wait"), (d.next = p + 0.7 + Math.random() * 1.4));
      }
      if (Rt && Rt.fired.rama && Rt.fired.rav)
        ((Rt = null), (J0 = p + 5 + Math.random() * 3));
    }
    function ba() {
      if (Rt && ze()) {
        ((Rt = null), (J0 = h.gt + 6));
        for (let d of ["rama", "rav"])
          if (yt[d].st === "draw" || yt[d].st === "hold")
            ((yt[d].st = "wait"), (yt[d].next = h.gt + 1));
      }
      if (
        !Rt &&
        h.gt >= J0 &&
        h.gt < 112 &&
        !ze() &&
        h.gt > 6 &&
        !(h.gt > Xt - 3 && h.gt < Ut)
      ) {
        let d = h.gt,
          u = d + 1.15;
        Rt = { k: "collide", start: d, rel: u, joined: {}, fired: {} };
      }
    }
    let ze = () =>
        yt.rama.casting || yt.rav.casting || yt.rama.busy || yt.rav.busy,
      Ft = [],
      te = null,
      ee = null,
      Se = 0,
      d0 = {
        scene: n,
        fx: R,
        arrows: f,
        cam: r,
        pos: (d) => Tt(d, G()),
        vel: (d) => _[d].v,
        bow: (d) => $0(d, G()),
        audio: (d, u) => e.play(d, u),
        shake: (d) => {
          h.shakeA = Math.max(h.shakeA, d);
        },
        flashScreen: (d, u) => {
          ((h.flash = Math.max(h.flash, Math.min(d, 0.3))),
            h.flashCol.setRGB(u[0], u[1], u[2]));
        },
        setDark: (d, u) => {
          if (((h.darkT = d), u)) h.dark = Math.min(h.dark, d + 0);
        },
        setGold: (d) => {
          h.gold = d;
        },
        setGlow: (d, u) => {
          yt[d].glowX = u;
        },
        setLightFlash: (d, u) => {
          (x.position.copy(d), (x.intensity = Math.max(x.intensity, u * 900)));
        },
        groundY: (d, u) => kt(d, u) + 0.1,
        domeFlash: (d, u, p) => {
          let m = dt[d].material.uniforms;
          if ((m.uHit.value.copy(u), (m.uFade.value = 1), p))
            m.uCol.value.setRGB(p[0], p[1], p[2]);
        },
      };
    function Ea(d) {
      let u = d.by;
      if ((o.astra(d), d.kind === "naga")) ((te = new ve(d0)), Ft.push(te));
      else if (d.kind === "garuda") Ft.push(new j0(d0, te));
      else if (d.kind === "agni") Ft.push(new ye(d0));
      else if (d.kind === "tamas") ((ee = new we(d0)), Ft.push(ee));
      else if (d.kind === "surya") Ft.push(new Me(d0, ee));
      if (u !== "both") ((yt[u].kick = 1), e.play("bow", 1));
      ((h.scaleTarget = 0.32),
        setTimeout(() => {
          h.scaleTarget = 1;
        }, 900));
    }
    function Ta() {
      let d = vo[Se];
      if (!d) return;
      let u = yo,
        p = [d.by];
      if (h.gt >= d.t - u)
        for (let m of p) ((yt[m].casting = !0), (yt[m].castMode = d.kind));
      if (h.gt >= d.t) {
        (Se++, Ea(d));
        for (let m of p)
          ((yt[m].releaseAt = h.gt), (yt[m].castEnd = h.gt + 0.6));
      }
      for (let m of ["rama", "rav"]) {
        let T = yt[m];
        if (T.casting && T.castEnd && h.gt > T.castEnd)
          ((T.casting = !1),
            (T.castEnd = 0),
            (T.releaseAt = void 0),
            (T.st = "wait"),
            (T.next = h.gt + 1.4),
            (T.draw = 0.1));
      }
    }
    function Ra(d, u) {
      if (!d.casting) {
        d.castK = Et(d.castK, 0, 6, u);
        return;
      }
      if (!(d.releaseAt !== void 0 && h.gt >= d.releaseAt))
        ((d.castK = Et(d.castK, 1, 3, u)), (d.draw = Et(d.draw, 1, 3, u)));
      else ((d.castK = Et(d.castK, 0, 5, u)), (d.draw = Et(d.draw, 0, 10, u)));
    }
    let ka = {
        groundY: (d, u) => kt(d, u) + 0.05,
        hit(d) {
          if (d.dead) return !0;
          for (let u of f.list) {
            if (
              u === d ||
              u.dead ||
              u.owner === d.owner ||
              d.mode === "rain" ||
              u.mode === "rain" ||
              u.mode === "bounce" ||
              d.mode === "bounce"
            )
              continue;
            if (d.pos.distanceToSquared(u.pos) < 5) {
              let p = d.pos.clone().lerp(u.pos, 0.5);
              return (
                R.sparks(p.x, p.y, p.z, rt.white, 40, 16, 0.8),
                R.flash(p.x, p.y, p.z, rt.gold, 8, 0.35),
                R.ring(p.x, p.y, p.z, rt.gold, 7, 0.45),
                R.glowBurst(p.x, p.y, p.z, [1, 0.6, 0.3], 14, 6, 1.2, 0.6),
                e.play("block", 0.9),
                (h.shakeA = Math.max(h.shakeA, 0.12)),
                f.kill(d),
                f.kill(u),
                !0
              );
            }
          }
          if (d.mode !== "bounce") {
            let u = T0(d.owner),
              p = Tt(u, It);
            if (
              ((p.y += 0.4),
              ft.copy(d.pos).sub(p),
              (ft.y *= 1.3),
              ft.length() < za(u))
            ) {
              if (
                (d0.domeFlash(
                  u,
                  d.pos,
                  u === "rama" ? [1, 0.75, 0.3] : [1, 0.25, 0.15],
                ),
                d.mode === "rain")
              )
                return (
                  R.explosion(d.pos.x, d.pos.y, d.pos.z, rt.fire, 1),
                  e.play("hit", 0.6),
                  f.kill(d),
                  !0
                );
              let m = ft.normalize();
              (d.vel
                .reflect(m)
                .multiplyScalar(0.55)
                .add(G(E(10), E(8), E(10))),
                (d.mode = "bounce"),
                (d.life = d.age + 0.7),
                R.sparks(
                  d.pos.x,
                  d.pos.y,
                  d.pos.z,
                  d.owner === "rama" ? rt.gold : rt.red,
                  26,
                  14,
                  0.7,
                ),
                R.ring(
                  d.pos.x,
                  d.pos.y,
                  d.pos.z,
                  u === "rama" ? rt.gold : rt.red,
                  5,
                  0.4,
                ),
                e.play("block", 1));
            }
          }
          return !1;
        },
        ground(d) {
          let u = kt(d.pos.x, d.pos.z);
          if (d.mode === "rain")
            (R.explosion(d.pos.x, u + 0.5, d.pos.z, rt.fire, 1.1),
              R0.push({
                x: d.pos.x,
                y: u,
                z: d.pos.z,
                t: 3 + Math.random() * 3,
              }),
              e.play("hit", 0.5));
          else
            (R.dust(d.pos.x, u, d.pos.z, 12),
              R.sparks(
                d.pos.x,
                u + 0.3,
                d.pos.z,
                d.owner === "rama" ? rt.gold : rt.red,
                12,
                8,
                0.5,
              ),
              e.play("hit", 0.25));
        },
      },
      R0 = [],
      ae = (d) => F[d].mode === "chariot",
      He = (d) => (ae(d) ? 1 : d === "rav" ? 0.62 * F.rav.sc : 0.72),
      za = (d) => 3.4 * He(d),
      Ae = (d, u, p) => p.set(u.x - d.x, 0, u.z - d.z).normalize(),
      oe = [
        [0, 6.6, "aerial"],
        [6.6, 10, "close", "rama"],
        [10, 13.5, "close", "rav"],
        [13.5, 18.5, "over", "rama"],
        [18.5, 23.5, "side", "rav"],
        [23.5, 27.4, "close", "rav"],
        [27.4, 30.2, "leap"],
        [30.2, 37.2, "rise"],
        [37.2, 40.4, "heads"],
        [40.4, 43.6, "over", "rama"],
        [43.6, 47, "sky"],
        [47, 51.2, "descend"],
        [51.2, 55, "board"],
        [55, 59, "wideOrbit"],
        [59, 62, "close", "rav"],
        [62, 66, "over", "rama"],
        [66, 70, "wideOrbit"],
        [70, 72, "close", "rama"],
        [72, 77, "follow", "garuda"],
        [77, 81, "side", "rama"],
        [81, 84, "close", "rama"],
        [84, 88, "skyApex"],
        [88, 92, "chase", "rama"],
        [92, 95, "close", "rav"],
        [95, 97.5, "close", "rama"],
        [97.5, 102, "dark"],
        [102, 105, "close", "rama"],
        [105, 109, "over", "rav"],
        [109, 114, "front", "rama"],
        [114, 120, "finale"],
      ],
      _t = { pos: G(0, 60, -100), look: G(0, 5, 0), fov: 45 },
      ct = G(),
      qt = G();
    function Sa(d, u, p) {
      let m = _t,
        T = u,
        O = F[T] ? T0(T) : null,
        J = F[T] ? F[T].sc : 1;
      switch (d) {
        case "aerial": {
          let A = L(2.2, 2.9, p),
            V = L(90, 30, pt(p));
          (m.pos.set(Math.sin(A) * V, L(55, 6, pt(p)), Math.cos(A) * V),
            a0("rama", ct),
            m.look.set(
              L(0, ct.x, pt(p)),
              L(6, ct.y, pt(p)),
              L(10, ct.z, pt(p)),
            ),
            (m.fov = L(55, 40, p)));
          break;
        }
        case "close": {
          (a0(T, ct), a0(O, qt), Ae(ct, qt, q));
          let A = T === "rama" ? 1 : -1,
            V = (T === "rama" ? 2.5 : 4) * J,
            it = L(0.35, -0.1, p) * A,
            ut = ft.set(-q.z, 0, q.x);
          (m.pos
            .copy(ct)
            .addScaledVector(q, (V * Math.cos(it) + 0.6) * (J > 2 ? 1 : 1))
            .addScaledVector(ut, V * Math.sin(it) * 1.5 + A * 1 * J),
            (m.pos.y += (T === "rama" ? 0.25 : 0.6) * J),
            m.look.copy(ct),
            (m.look.y += (T === "rama" ? 0 : -0.3) * J),
            (m.fov = T === "rama" ? 34 : 46));
          break;
        }
        case "over": {
          (a0(T, ct), a0(O, qt), Ae(ct, qt, q));
          let A = ft.set(-q.z, 0, q.x);
          (m.pos
            .copy(ct)
            .addScaledVector(q, -3.2 * J)
            .addScaledVector(A, L(1.6, 2.4, p) * J),
            (m.pos.y += 0.9 * J),
            m.look.copy(qt),
            (m.look.y -= 0.3 * F[O].sc),
            m.look.lerp(ct, 0.12),
            (m.fov = F[O].sc > 2 ? 52 : 38));
          break;
        }
        case "side": {
          let A = Tt(T, ct),
            V = q.set(A.x, 0, A.z).normalize(),
            it = L(0, 0.5, p),
            ut = 15 * Math.max(1, J * 0.8);
          (m.pos.set(
            A.x + V.x * ut * Math.cos(it) + V.z * ut * Math.sin(it),
            A.y + 3.2 + p * 3,
            A.z + V.z * ut * Math.cos(it) - V.x * ut * Math.sin(it),
          ),
            m.look.copy(A).addScaledVector(_[T].v, 0.35),
            (m.look.y += 0.5),
            (m.fov = 44));
          break;
        }
        case "chase": {
          let A = Tt(T, ct),
            V = q.set(Math.sin(_[T].h), 0, Math.cos(_[T].h));
          (m.pos
            .copy(A)
            .addScaledVector(V, 22)
            .addScaledVector(ft.set(-V.z, 0, V.x), L(6, 2, p)),
            (m.pos.y = A.y - 0.4 - 0.2),
            m.look.copy(A),
            (m.look.y += 0.4),
            (m.fov = 52));
          break;
        }
        case "front": {
          let A = Tt(T, ct),
            V = q.set(Math.sin(_[T].h), 0, Math.cos(_[T].h));
          (m.pos
            .copy(A)
            .addScaledVector(V, L(14, 8, p))
            .addScaledVector(ft.set(-V.z, 0, V.x), 3.5),
            (m.pos.y = A.y + 0.5),
            m.look.copy(A).addScaledVector(V, 1.5),
            (m.look.y += 0.4),
            (m.fov = 46));
          break;
        }
        case "wideOrbit": {
          let A = h.gt * 0.07 + 1,
            V = Tt("rama", ct).lerp(Tt("rav", qt), 0.5);
          (m.pos.set(
            V.x + Math.sin(A) * 85,
            24 + Math.sin(h.gt * 0.3) * 5,
            V.z + Math.cos(A) * 85,
          ),
            m.look.copy(V),
            (m.look.y += 3),
            (m.fov = 46));
          break;
        }
        case "skyApex": {
          let A = Tt("rav", ct);
          (m.pos.set(A.x * 0.6, Math.max(3, A.y - 6), A.z * 0.6 - 35),
            m.look.set(A.x, A.y + 30 + p * 6, A.z),
            (m.fov = 55));
          break;
        }
        case "follow": {
          let A = Ft.find((ut) => ut.g && ut.g.position && ut instanceof j0),
            V = A ? A.g.position : Tt("rama", ct),
            it = p * 1.6;
          (m.pos.set(V.x + Math.sin(it) * 17, V.y + 4, V.z + Math.cos(it) * 17),
            m.look.copy(V),
            (m.fov = 50));
          break;
        }
        case "dark": {
          let A = h.gt * 0.1,
            V = Tt("rama", ct);
          (m.pos.set(V.x + Math.sin(A) * 16, V.y + 4, V.z + Math.cos(A) * 16),
            Tt("rav", qt),
            m.look.copy(V).lerp(qt, 0.4),
            (m.fov = 46));
          break;
        }
        case "finale": {
          let A = Tt("rama", ct),
            V = Tt("rav", qt),
            it = A.clone().lerp(V, 0.5),
            ut = L(60, 130, pt(p)),
            Qt = 0.9 + p * 0.3;
          (m.pos.set(
            it.x + Math.sin(Qt) * ut,
            it.y + L(8, 50, pt(p)),
            it.z + Math.cos(Qt) * ut,
          ),
            m.look.copy(it),
            (m.fov = L(40, 46, p)));
          break;
        }
        case "leap": {
          let A = I.rav.root.getWorldPosition(ct),
            V = q.set(-A.z, 0, A.x).normalize();
          (m.pos.set(
            A.x + V.x * 16 - A.x * 0.1,
            A.y + 2 + p * 2,
            A.z + V.z * 16 - A.z * 0.1,
          ),
            m.look.copy(A),
            (m.look.y += 1),
            (m.fov = 48));
          break;
        }
        case "rise": {
          let A = G(Mt.x, bt(Mt.x, Mt.z), Mt.z),
            V = F.rav.sc,
            it = q.set(Mt.x, 0, Mt.z).normalize(),
            ut = ft.set(-it.z, 0, it.x),
            Qt = 16 + 20 * Gt(Kt, Yt, h.gt);
          (m.pos
            .copy(A)
            .addScaledVector(it, -Qt * 0.9)
            .addScaledVector(ut, Qt * 0.7),
            (m.pos.y = A.y + 2 + 7 * Gt(Kt, Yt, h.gt)),
            a0("rav", ct),
            m.look.copy(ct),
            (m.look.y -= V * 0.7),
            (m.fov = 54));
          break;
        }
        case "heads": {
          a0("rav", ct);
          let A = G(Mt.x, 0, Mt.z),
            V = q.copy(n0).sub(A).setY(0).normalize(),
            it = ft.set(-V.z, 0, V.x);
          (m.pos
            .copy(ct)
            .addScaledVector(V, L(36, 28, p))
            .addScaledVector(it, L(6, -6, p)),
            (m.pos.y = ct.y - 2.5),
            m.look.copy(ct),
            (m.look.y -= 1.2),
            (m.fov = 44));
          break;
        }
        case "sky": {
          let A = bt(0, 0);
          (m.pos.set(-30 + p * 6, A + 9, -75),
            m.look.set(nt.x * 0.4, A + 38 + p * 22, nt.z * 0.4),
            (m.fov = 52));
          break;
        }
        case "descend": {
          let A = K.rama.group.position;
          (m.pos.set(A.x + 20 - p * 6, Math.max(A.y - 2, 3) + 3, A.z + 17),
            m.look.copy(A),
            (m.look.y += 1),
            (m.fov = 48));
          break;
        }
        case "board": {
          let A = I.rama.root.getWorldPosition(ct),
            V = q.set(nt.x, 0, nt.z).normalize();
          (m.pos.set(
            A.x - V.x * 9 + nt.x * 0.4 + 2,
            A.y + 2.4,
            A.z - V.z * 9 + nt.z * 0.4 + 3,
          ),
            m.look.set(
              A.x * 0.7 + nt.x * 0.3,
              A.y + 1.7,
              A.z * 0.7 + nt.z * 0.3,
            ),
            (m.fov = 46));
          break;
        }
        default:
          break;
      }
    }
    let _cp = G();
    function clampCam() {
      try {
        for (let nm of ["rama", "rav"]) {
          let gp = K[nm].group;
          if (!gp.visible) continue;
          let ex = _t.pos.x - gp.position.x, ez = _t.pos.z - gp.position.z,
            ey = _t.pos.y - gp.position.y;
          let hl = Math.hypot(ex, ez);
          if (hl < 15 && ey < 12) {
            if (hl < 0.01) { ex = 1; ez = 0.5; hl = Math.hypot(ex, ez); }
            _t.pos.x = gp.position.x + (ex / hl) * 15;
            _t.pos.z = gp.position.z + (ez / hl) * 15;
          }
        }
        for (let nm of ["rama", "rav"]) {
          Tt(nm, _cp);
          let sc = F[nm] ? F[nm].sc : 1,
            mn = (nm === "rav" ? 8 : 6.5) * Math.max(1, sc * 0.9);
          if (nm === "rav" && sc > 1.5) mn = 8 * sc;
          let dx = _t.pos.x - _cp.x, dz = _t.pos.z - _cp.z;
          let hl = Math.hypot(dx, dz);
          if (hl < mn) {
            if (hl < 0.01) { dx = 1; dz = 0.5; hl = Math.hypot(dx, dz); }
            _t.pos.x = _cp.x + (dx / hl) * mn;
            _t.pos.z = _cp.z + (dz / hl) * mn;
          }
        }
        let gy = kt(_t.pos.x, _t.pos.z) + 5.5;
        if (!(_t.pos.y >= gy)) _t.pos.y = gy;
        let hd = Math.hypot(_t.look.x - _t.pos.x, _t.look.z - _t.pos.z),
          up = hd * 0.28 + 2;
        if (_t.look.y - _t.pos.y > up) _t.look.y = _t.pos.y + up;
      } catch (e) {}
    }
    function Ha(d) {
      let u = oe[oe.length - 1];
      for (let T of oe)
        if (h.gt >= T[0] && h.gt < T[1]) {
          u = T;
          break;
        }
      if (
        (Sa(u[2], u[3], ot((h.gt - u[0]) / (u[1] - u[0]), 0, 1)),
        h.shotKey !== u[0])
      )
        ((h.shotKey = u[0]), (r.userData.cut = !0));
      if (
        (clampCam(),
        Number.isFinite(_t.look.x + _t.look.y + _t.look.z) || _t.look.set(0, 5, 0),
        Number.isFinite(_t.pos.x + _t.pos.y + _t.pos.z) || _t.pos.set(0, 20, -50),
        Number.isFinite(_t.fov) || (_t.fov = 45),
        r.position.copy(_t.pos),
        r.lookAt(_t.look),
        Math.abs(r.fov - _t.fov) > 0.01)
      )
        ((r.fov = Et(r.fov, _t.fov, r.userData.cut ? 80 : 8, d)),
          r.updateProjectionMatrix());
      r.userData.cut = !1;
      let p = (h.shakeA + R.shake) * 0.5,
        m = h.time * 31;
      if (
        ((r.position.x +=
          Math.sin(m * 1.3) * p * 0.5 + Math.sin(h.time * 0.9) * 0.015),
        (r.position.y +=
          Math.sin(m * 1.7 + 1) * p * 0.5 + Math.sin(h.time * 0.7) * 0.015),
        (r.position.z += Math.sin(m * 1.1 + 2) * p * 0.5),
        (r.rotation.z += Math.sin(m) * p * 0.01),
        !Number.isFinite(r.position.x + r.position.y + r.position.z))
      )
        (r.position.set(0, 6, -20), r.lookAt(0, 4, 0));
    }
    let se = G(),
      wo = G(),
      Zt = G();
    let _lp = G();
    function Aa(d) {
      for (let nm of ["rama", "rav"]) {
        let ch = K[nm];
        if (ch.light.parent !== n) n.add(ch.light);
        ch.group.getWorldPosition(_lp);
        ch.light.position.set(_lp.x, _lp.y + 2.6, _lp.z);
        if (!ch.group.visible) ch.light.intensity = 0;
      }
      h.dark = Et(h.dark, h.darkT, h.darkT === 0 ? 5 : 1.2, d);
      let { dark: u, gold: p } = h,
        m = Tt("rama", q).lerp(Tt("rav", ft), 0.5);
      if (
        ((m.y = Math.max(0, m.y * 0.5)),
        H.sun.target.position.copy(m),
        H.sun.position.set(
          m.x + M0.x * 200,
          m.y + M0.y * 200 + 20,
          m.z + M0.z * 200,
        ),
        H.sun.target.updateMatrixWorld(),
        (H.sun.intensity = 3.6 * (1 - 0.94 * u) + p * 1.5),
        (H.hemi.intensity = 1.5 * (1 - 0.8 * u) + p * 0.4),
        Zt.copy(_t.look).sub(r.position).setY(0),
        Zt.lengthSq() < 0.0001)
      )
        Zt.set(0, 0, 1);
      (Zt.normalize(),
        se.set(-Zt.z, 0, Zt.x),
        H.key.position
          .copy(r.position)
          .addScaledVector(se, -6)
          .addScaledVector(Zt, -2),
        (H.key.position.y += 8),
        H.key.target.position.copy(_t.look),
        H.key.target.updateMatrixWorld(),
        (H.key.intensity = 2.0 * (1 - 0.8 * u) + p * 0.5),
        H.rim.position
          .copy(_t.look)
          .addScaledVector(Zt, 40)
          .addScaledVector(se, 14),
        (H.rim.position.y += 22),
        H.rim.target.position.copy(_t.look),
        H.rim.target.updateMatrixWorld(),
        (H.rim.intensity = 3.6 * (1 - 0.4 * u) + p * 1),
        H.rim.color.setRGB(1, L(0.66, 0.4, u), L(0.38, 0.25, u)),
        n.fog.color.setRGB(
          L(0.36, 0.07, u) + p * 0.1,
          L(0.21, 0.03, u) + p * 0.06,
          L(0.18, 0.07, u) + p * 0.02,
        ),
        (n.fog.density = L(0.0009, 0.0022, u)));
      let T = z.material.uniforms;
      if (
        ((T.uTime.value = h.time),
        (T.uDark.value = u),
        (T.uGold.value = p),
        z.position.copy(r.position),
        (l.params.exposure = 0.98 * (1 - 0.3 * u) * (1 + 0.05 * p)),
        (l.params.dark = 0),
        (l.params.flash = h.flash),
        l.params.flashCol.copy(h.flashCol),
        R.lightFlash > 0.01)
      )
        (x.position.copy(R.lp),
          (x.intensity = Math.max(x.intensity, R.lightFlash * 120)));
      x.intensity = Math.max(0, x.intensity - d * 1500);
      for (let O of ["rama", "rav"]) {
        let J = dt[O],
          A = J.material.uniforms,
          V = He(O);
        if (
          (Tt(O, J.position),
          (J.position.y += 0.4),
          J.scale.set(2.6 * V, 2.2 * V, 4 * V),
          O === "rama" && h.gt < jt + 1 && !ae("rama"))
        )
          J.rotation.y = 0;
        ((A.uFade.value = Math.max(0, A.uFade.value - d * 2.6)),
          (A.uTime.value = h.time),
          (A.uBase.value = u > 0.3 && O === "rama" ? 0.12 : 0));
      }
    }
    function Pa(d) {
      let u = r.position;
      for (let p = 0; p < 3; p++)
        R.add.emit(
          u.x + E(40),
          1 + Math.random() * 14,
          u.z + E(40),
          -2,
          1,
          E(1),
          6,
          0.14,
          0.05,
          1,
          0.55,
          0.2,
          0.7,
          0,
          0.1,
        );
      for (let p = 0; p < 3; p++) {
        let m = E(220),
          T = 700 + E(80);
        if (
          (R.add.emit(
            m,
            20 + Math.random() * 40,
            T,
            E(2),
            8 + Math.random() * 8,
            E(2),
            2.5,
            22,
            8,
            1,
            0.35,
            0.08,
            0.8,
            0,
            0.2,
          ),
          Math.random() < 0.4)
        )
          R.smoke.emit(
            m,
            40 + Math.random() * 30,
            T,
            E(3),
            6,
            E(3),
            8,
            40,
            90,
            0.07,
            0.045,
            0.04,
            0.55,
            0,
            0.1,
          );
      }
      for (let p of ["rama", "rav"]) {
        let m = K[p].group;
        if (!m.visible || _[p].speed < 1) continue;
        let T = q.set(Math.sin(_[p].h), 0, Math.cos(_[p].h)),
          O = m.position;
        if (p === "rama" && h.gt < jt) continue;
        for (let J of K[p].wheels) {
          if ((J.getWorldPosition(ft), Math.random() < 0.6))
            R.dust(ft.x - T.x, kt(ft.x, ft.z) + 0.3, ft.z - T.z, 1, 0.7);
          R.add.emit(
            ft.x,
            ft.y - 0.5,
            ft.z,
            -T.x * 3,
            E(1),
            -T.z * 3,
            0.7,
            0.7,
            0.1,
            p === "rama" ? 1 : 1,
            p === "rama" ? 0.75 : 0.22,
            p === "rama" ? 0.3 : 0.08,
            0.8,
            0,
            2,
          );
        }
      }
      for (let p = R0.length - 1; p >= 0; p--) {
        let m = R0[p];
        if (
          ((m.t -= d),
          R.add.emit(
            m.x + E(1.2),
            m.y + 0.5,
            m.z + E(1.2),
            E(1),
            3 + Math.random() * 3,
            E(1),
            1,
            2.2,
            0.3,
            1,
            0.4,
            0.08,
            0.8,
            -1,
            1,
          ),
          Math.random() < 0.4)
        )
          R.smoke.emit(
            m.x,
            m.y + 2,
            m.z,
            E(1),
            4,
            E(1),
            3,
            1.5,
            6,
            0.08,
            0.06,
            0.05,
            0.5,
            0,
            0.5,
          );
        if (m.t < 0) R0.splice(p, 1);
      }
    }
    function Ga(d) {
      let u = h.gt;
      ((yt.rav.busy = u >= Xt - 0.4 && u < Yt + 0.5),
        (yt.rama.busy = u >= b0 - 0.5 && u < g0 + 0.3));
      for (let p of ["rama", "rav"]) {
        let m = yt[p],
          T = T0(p),
          O = F[p];
        (Ma(m, d), Ra(m, d), (m.kick = Et(m.kick, 0, 7, d)));
        let J = m.castK,
          A = ot(
            Math.max(J, m.glowX, m.st === "draw" || m.st === "hold" ? 0.25 : 0),
            0,
            1,
          ),
          V = Tt(T, q).addScaledVector(_[T].v, 0.3);
        if (
          ((V.y += 0.2 * F[T].sc),
          p === "rama" &&
            u >= Ut - 0.5 &&
            u < b0 &&
            !m.casting &&
            m.st === "wait")
        )
          V.set(nt.x, 30, nt.z);
        let it = (p === "rama" ? O.mode === "air" : O.mode === "air") ? 1 : 0,
          ut = p === "rav" && O.mode === "ground" && u > X0 - 0.2 && u < Re;
        ((O.airK = Et(O.airK, it, 14, d)),
          (O.walkK = Et(O.walkK, ut ? 1 : 0, 5, d)));
        let Qt =
          p === "rav"
            ? Math.max(J, Gt(Kt, Kt + 1.2, u) * (1 - Gt(Yt + 0.6, Yt + 2.6, u)))
            : 0;
        L0(
          I[p],
          d,
          h.time,
          {
            aim: 1,
            draw: m.draw,
            nock: m.nock,
            kick: m.kick,
            glow: A,
            cast: J,
            crouch:
              m.kick * 0.5 +
              (p === "rav" && O.mode === "ground" ? Qt * 0.2 : 0),
            aimUp: J * 0.65,
            roar: Qt,
          },
          V,
          {
            speed: ae(p) ? _[p].speed : ut ? 6 : 0,
            walk: O.walkK * 2.6,
            air: O.airK,
          },
        );
      }
      (L0(at.rama, d, h.time, ga, null, { drive: !0, speed: _.rama.speed }),
        L0(at.rav, d, h.time, ga, null, { drive: !0, speed: _.rav.speed }));
    }
    function Da(d) {
      if (h.paused) return;
      let u = Math.min(d, 0.05);
      h.scale = Et(h.scale, h.scaleTarget, 6, u);
      let p = u * h.scale;
      if (((h.time += p), !h.started)) h.gt = (h.gt + p * 0.1) % 5;
      if (h.started && !h.ended) {
        if (((h.gt += p), h.gt >= Te)) ((h.gt = Te), (h.ended = !0), o.end());
        (o.progress(h.gt / Te), o.tick(h.gt));
      }
      v("place", () => {
        (Vt("rama", p), Vt("rav", p), e0(p));
      });
      for (let m of ["rama", "rav"]) K[m].update(p, h.time, _[m].speed);
      if (
        (K.rama.group.updateMatrixWorld(!0),
        K.rav.group.updateMatrixWorld(!0),
        I.rama.root.updateMatrixWorld(!0),
        I.rav.root.updateMatrixWorld(!0),
        v("poses", () => Ga(p)),
        K.rama.group.updateMatrixWorld(!0),
        K.rav.group.updateMatrixWorld(!0),
        I.rama.root.updateMatrixWorld(!0),
        I.rav.root.updateMatrixWorld(!0),
        h.started && !h.ended)
      )
        (v("story", () => Z0(p)),
          v("script", () => {
            (ba(), Ta());
          }));
      for (let m of Ft) m.update(p);
      for (let m = Ft.length - 1; m >= 0; m--) if (Ft[m].done) Ft.splice(m, 1);
      if (
        (f.update(p, ka),
        W.userData.update(h.time),
        v("ambient", () => Pa(p)),
        v("lights", () => Aa(p)),
        v("camera", () => Ha(p)),
        R.update(p, r, o.height(), i.getPixelRatio()),
        (h.shakeA = Math.max(0, h.shakeA - p * 1.2)),
        (h.flash = Math.max(0, h.flash - p * 1.4)),
        e.setMood(
          h.started ? 0.3 + Math.min(0.6, h.gt / 140 + h.dark * 0.2) : 0.1,
          !1,
        ),
        s === "cinematic")
      )
        l.render(n, r, h.time);
      else (i.setRenderTarget(null), i.render(n, r));
    }
    let o0 = 1,
      re = 0,
      k0 = 0,
      Pe = performance.now();
    function c0() {
      let d = a.clientWidth || window.innerWidth,
        u = a.clientHeight || window.innerHeight,
        p = Math.max(
          0.5,
          Math.min(window.devicePixelRatio || 1, s === "cinematic" ? 1 : 1) *
            o0,
        );
      (i.setPixelRatio(p),
        i.setSize(d, u, !1),
        (r.aspect = d / u),
        r.updateProjectionMatrix(),
        l.resize(d, u, p));
      let m = 1024;
      if (H.sun.shadow.mapSize.x !== m) {
        if ((H.sun.shadow.mapSize.set(m, m), H.sun.shadow.map))
          (H.sun.shadow.map.dispose(), (H.sun.shadow.map = null));
      }
      ((i.toneMapping =
        s === "cinematic" ? lt.NoToneMapping : lt.ACESFilmicToneMapping),
        (i.toneMappingExposure = 1.2));
    }
    let Ge = new ResizeObserver(c0);
    (Ge.observe(a), c0());
    let ie = 0,
      De = performance.now(),
      Ie = !1,
      Ce = (d) => {
        if (Ie) return;
        ie = requestAnimationFrame(Ce);
        let u = (d - De) / 1000;
        if (((De = d), u < 0.25 && h.started && !h.paused)) {
          if (((re += u), k0++, d - Pe > 1500 && k0 > 10)) {
            let p = re / k0;
            if (p > 0.024 && o0 > 0.5)
              ((o0 = Math.max(0.5, o0 * 0.85)), c0());
            else if (p < 0.014 && o0 < 1) ((o0 = Math.min(1, o0 * 1.06)), c0());
            ((re = 0), (k0 = 0), (Pe = d));
          }
        }
        try {
          Da(u);
        } catch (p) {
          g("frame", p);
          try {
            (i.setRenderTarget(null), i.render(n, r));
          } catch (m) {}
        }
      };
    ie = requestAnimationFrame(Ce);
    let Be = (d) => {
      if (d.code === "KeyM") o.toggleMute();
      if (d.code === "Escape" || d.code === "KeyP") {
        if (h.started && !h.ended) ((h.paused = !h.paused), o.pause(h.paused), bgPause(h.paused));
      }
    };
    return (
      window.addEventListener("keydown", Be),
      (o.onBegin = () => {
        (e.start(),
          (h.started = !0),
          (h.gt = 0),
          o.hideTitle(),
          M(),
          0);
      }),
      (o.onMute = (d) => {
        if ((e.setMuted(d), y)) ((y.muted = d), bg && (bg.muted = d));
      }),
      (o.onQuality = (d) => {
        ((s = d), c0());
      }),
      (o.onPause = () => {
        ((h.paused = !h.paused), o.pause(h.paused), bgPause(h.paused));
      }),
      (o.onReplay = () => {
        t.onReplay && t.onReplay();
      }),
      v("precompile", () => {
        let vis = [];
        n.traverse((o) => {
          vis.push([o, o.visible]);
          o.visible = !0;
        });
        try {
          i.compile(n, r);
        } catch (e) {}
        for (let [o, v] of vis) o.visible = v;
      }),
      i.domElement.addEventListener("webglcontextrestored", () => {
        c0();
      }),
      o.build(),
      {
        dispose() {
          if (
            ((Ie = !0),
            cancelAnimationFrame(ie),
            Ge.disconnect(),
            window.removeEventListener("keydown", Be),
            e.dispose(),
            y)
          )
            (y.pause(), bgTimers.forEach(clearTimeout), bg && bg.pause());
          (c.remove(), i.dispose(), o.destroy());
        },
        state: h,
        camera: r,
        scene: n,
        begin: o.onBegin,
      }
    );
  }
  let E0 = null;
  function ya(a) {
    if (E0) E0.dispose();
    E0 = null;
    E0 = va(rootEl, {
      shankhUrl: OPTS.shankhUrl,
      onReplay: () => ya(!0),
    });
    if (a) E0.begin();
  }
  ya(!1);
  return {
    dispose() {
      if (E0) E0.dispose();
      E0 = null;
    },
  };
}