import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { KK_MARKUP } from './kumbhakarnaMarkup.js';

/* Awaken Kumbhakarna: self-contained three.js game.
   createKumbhakarnaGame(rootElement, { onComplete, onExit, conchUrl }) -> dispose() */
export function createKumbhakarnaGame(root, opts = {}) {
  const onComplete = opts.onComplete || (() => {});
  const onExit = opts.onExit || (() => {});
  const CONCH_URL = opts.conchUrl || '/audio/shankh.mp3';
  const ROAR_URL = opts.roarUrl || '/audio/roar.mp3';
  root.innerHTML = KK_MARKUP;
  root.classList.add('cine');
  let alive = true, raf = 0;
  const timers = [], disposers = [];
  const T_ = (f, ms) => { const id = setTimeout(() => { if (alive) f(); }, ms); timers.push(id); return id; };
  const on = (t, e, f, o) => { t.addEventListener(e, f, o); disposers.push(() => t.removeEventListener(e, f, o)); };
  const VW = () => root.clientWidth || window.innerWidth;
  const VH = () => root.clientHeight || window.innerHeight;
  let RC = root.getBoundingClientRect();
  const prevCM = THREE.ColorManagement ? THREE.ColorManagement.enabled : undefined;
  if (THREE.ColorManagement) THREE.ColorManagement.enabled = false;   // keeps colours identical across three versions


const $=s=>root.querySelector(s);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const V3=THREE.Vector3;
/* lights behave the same on legacy (r128) and physically-based (r155+) three */
const MOD=parseInt(THREE.REVISION,10)>=155;
const LK=(dist,decay)=>MOD?4*Math.PI*Math.pow(Math.max(dist,1)*.4,2-decay):1;
const AMBK=MOD?Math.PI:1;
function PL(col,I,dist,decay){const l=new THREE.PointLight(col,I*LK(dist,decay),dist,MOD?2:decay);l.userData.k=LK(dist,decay);return l}
function SL(col,I,dist,ang,pen,decay){const l=new THREE.SpotLight(col,I*LK(dist,decay),dist,ang,pen,MOD?2:decay);l.userData.k=LK(dist,decay);return l}

/* ---------- Audio: everything synthesised, no files ---------- */
const SFX=(()=>{
  let ctx,master,nb,muted=false,conchBuf=null,roarBuf=null;
  function init(){
    if(ctx)return;
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain();master.gain.value=muted?0:.85;master.connect(ctx.destination);loadConch();loadRoar();
    nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
    const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const o1=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
    o1.type='sawtooth';o2.type='sine';o1.frequency.value=55;o2.frequency.value=82.4;
    f.type='lowpass';f.frequency.value=170;g.gain.value=.045;
    o1.connect(f);o2.connect(f);f.connect(g);g.connect(master);o1.start();o2.start();
  }
  async function loadConch(){try{const r=await fetch(CONCH_URL);if(!r.ok)return;conchBuf=await ctx.decodeAudioData(await r.arrayBuffer())}catch(e){}}
  async function loadRoar(){try{const r=await fetch(ROAR_URL);if(!r.ok)return;roarBuf=await ctx.decodeAudioData(await r.arrayBuffer())}catch(e){}}
  function playRoar(){const t=ctx.currentTime,s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=roarBuf;g.gain.value=1;s.connect(g);g.connect(master);s.start(t)}
  function playConch(){const t=ctx.currentTime,s=ctx.createBufferSource(),g=ctx.createGain(),dur=Math.min(conchBuf.duration,2.8);s.buffer=conchBuf;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(1,t+.04);g.gain.setValueAtTime(1,t+Math.max(.1,dur-.5));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(g);g.connect(master);s.start(t);s.stop(t+dur+.05)}
  const env=(g,t,a,d,v)=>{g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)};
  function osc(type,f0,f1,dur,vol,delay=0,att=.005){
    if(!ctx)return;const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(f1,1),t+dur);
    env(g,t,att,dur,vol);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+att+.05);
  }
  function noise(ft,f0,f1,q,dur,vol,delay=0,att=.005){
    if(!ctx)return;const t=ctx.currentTime+delay,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    s.buffer=nb;f.type=ft;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(f1,20),t+dur);
    env(g,t,att,dur,vol);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+dur+att+.05);
  }
  return{
    init,
    dispose(){try{if(ctx)ctx.close()}catch(e){}},
    toggle(){muted=!muted;if(master)master.gain.value=muted?0:.85;return muted},
    drum(p=1){osc('sine',170,42,.38,.9*p);noise('lowpass',900,120,.7,.16,.5*p);},
    conch(){if(!ctx)return;if(conchBuf){playConch();return}const t=ctx.currentTime,o=ctx.createOscillator(),l=ctx.createOscillator(),lg=ctx.createGain(),f=ctx.createBiquadFilter(),g=ctx.createGain();
      o.type='sawtooth';o.frequency.setValueAtTime(196,t);o.frequency.linearRampToValueAtTime(247,t+.5);o.frequency.linearRampToValueAtTime(233,t+1.4);
      l.frequency.value=5.5;lg.gain.value=5;l.connect(lg);lg.connect(o.frequency);f.type='lowpass';f.frequency.value=1100;
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.34,t+.16);g.gain.setValueAtTime(.34,t+.9);g.gain.exponentialRampToValueAtTime(.0001,t+1.5);
      o.connect(f);f.connect(g);g.connect(master);o.start(t);l.start(t);o.stop(t+1.6);l.stop(t+1.6);},
    thud(){osc('sine',90,28,.5,.9);noise('lowpass',500,80,.8,.3,.6)},
    whoosh(){noise('bandpass',350,2600,3,.42,.5,0,.12)},
    stab(){noise('lowpass',2400,200,.9,.2,.7);osc('triangle',240,60,.25,.5)},
    snore(v=1){noise('lowpass',260,140,1.2,1.5,.5*v,0,.7);osc('sawtooth',48,38,1.6,.12*v,0,.6)},
    groan(v=1){osc('sawtooth',95,52,1.3,.35*v,0,.25);noise('lowpass',320,120,1,1.2,.35*v,0,.2)},
    sniff(){noise('highpass',1800,3200,.8,.28,.35,0,.04)},
    chime(){osc('triangle',660,655,1.4,.25);osc('triangle',990,985,1.2,.15,.06);osc('sine',1320,1310,1,.08,.12)},
    miss(){osc('sine',110,70,.22,.35)},
    roar(){if(ctx&&roarBuf){playRoar();return}osc('sawtooth',70,120,1.2,.55,0,.15);osc('sawtooth',120,48,2.6,.5,1.1,.05);osc('square',55,40,3.2,.25,0,.2);
      noise('bandpass',700,350,.9,3,.7,0,.3);noise('lowpass',200,60,.8,3.6,.9,0,.1);}
  };
})();

/* ---------- Procedural textures ---------- */
function makeTex(w,h,fn,rep=[1,1]){
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');fn(x,w,h);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.anisotropy=4;return t;
}
const skinBump=makeTex(256,256,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);
  for(let i=0;i<5200;i++){const v=rnd(90,170)|0;x.fillStyle=`rgba(${v},${v},${v},.35)`;x.beginPath();x.arc(rnd(0,w),rnd(0,h),rnd(.6,3.4),0,7);x.fill();}
  x.strokeStyle='rgba(60,60,60,.25)';for(let i=0;i<90;i++){x.beginPath();let px=rnd(0,w),py=rnd(0,h);x.moveTo(px,py);for(let k=0;k<4;k++){px+=rnd(-14,14);py+=rnd(-14,14);x.lineTo(px,py);}x.stroke();}},[3,3]);
const skinCol=makeTex(256,256,(x,w,h)=>{x.fillStyle='#a2623f';x.fillRect(0,0,w,h);
  for(let i=0;i<700;i++){const g=x.createRadialGradient(0,0,0,0,0,rnd(8,28));const a=rnd(.05,.16);g.addColorStop(0,Math.random()<.5?`rgba(90,40,26,${a})`:`rgba(210,140,96,${a})`);g.addColorStop(1,'rgba(0,0,0,0)');x.save();x.translate(rnd(0,w),rnd(0,h));x.fillStyle=g;x.fillRect(-30,-30,60,60);x.restore()}
  x.strokeStyle='rgba(90,40,60,.22)';x.lineWidth=1.2;for(let i=0;i<26;i++){x.beginPath();let px=rnd(0,w),py=rnd(0,h);x.moveTo(px,py);for(let k=0;k<6;k++){px+=rnd(-18,18);py+=rnd(-10,18);x.lineTo(px,py)}x.stroke()}},[3,3]);
const floorTex=makeTex(512,512,(x,w,h)=>{x.fillStyle='#2a1a1c';x.fillRect(0,0,w,h);
  for(let i=0;i<4000;i++){const v=rnd(20,60)|0;x.fillStyle=`rgba(${v+14},${v},${v-4},.28)`;x.fillRect(rnd(0,w),rnd(0,h),rnd(1,5),rnd(1,5));}
  x.strokeStyle='rgba(233,180,76,.35)';x.lineWidth=3;x.strokeRect(0,0,w,h);x.strokeStyle='rgba(0,0,0,.5)';x.lineWidth=2;x.beginPath();x.moveTo(w/2,0);x.lineTo(w/2,h);x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();},[22,26]);
const silkTex=makeTex(256,256,(x,w,h)=>{x.fillStyle='#6d1022';x.fillRect(0,0,w,h);
  for(let i=0;i<h;i+=4){x.fillStyle=`rgba(255,120,120,${.05+.04*Math.sin(i*.4)})`;x.fillRect(0,i,w,2);}
  x.strokeStyle='rgba(233,180,76,.55)';x.lineWidth=2;for(let a=0;a<w;a+=64)for(let b=0;b<h;b+=64){x.beginPath();x.moveTo(a+32,b+8);x.lineTo(a+56,b+32);x.lineTo(a+32,b+56);x.lineTo(a+8,b+32);x.closePath();x.stroke();}},[6,10]);
const glowTex=makeTex(128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
const ringTex=makeTex(128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,34,64,64,62);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.55,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});

/* ---------- Renderer, scene, lights ---------- */
const renderer=new THREE.WebGLRenderer({canvas:$('#kk-gl'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
if('outputColorSpace' in renderer)renderer.outputColorSpace=THREE.SRGBColorSpace;else renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x0a050b);scene.fog=new THREE.FogExp2(0x1a0d16,.0092);
const camera=new THREE.PerspectiveCamera(50,1,.1,700);
scene.add(new THREE.HemisphereLight(0x8d7fc0,0x3a1a10,.5*AMBK));
const moon=SL(0xa9bcff,1.3,500,.55,.85,1);moon.position.set(-46,95,46);moon.target.position.set(0,6,-8);
moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);moon.shadow.bias=-.0004;moon.shadow.camera.near=40;moon.shadow.camera.far=240;scene.add(moon,moon.target);
const rim=PL(0xffa860,1.0,110,1.4);rim.position.set(0,28,-48);scene.add(rim);
const eyeLight=PL(0xff4a1a,0,40,1.6);scene.add(eyeLight);
const warmKey=PL(0xffb070,.6,70,1.5);warmKey.position.set(0,26,48);scene.add(warmKey);
/* three-point lighting on the sleeper: warm key with shadows, cool rim, violet fill */
const keyS=SL(0xffb878,1.7,220,.5,.8,1);keyS.position.set(26,52,34);keyS.target.position.set(0,8,-2);
keyS.castShadow=true;keyS.shadow.mapSize.set(1536,1536);keyS.shadow.bias=-.0005;keyS.shadow.camera.near=20;keyS.shadow.camera.far=160;scene.add(keyS,keyS.target);
const rimS=SL(0x9fb4ff,1.6,220,.55,.8,1);rimS.position.set(-38,42,-66);rimS.target.position.set(0,10,-8);scene.add(rimS,rimS.target);
const fillP=PL(0x6a5cc8,.4,140,1.4);fillP.position.set(-30,26,56);scene.add(fillP);
/* image-based light for the gold and silk (built from a tiny gradient room) */
{const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene();
  const c=document.createElement('canvas');c.width=16;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'#2c3470');g.addColorStop(.5,'#4a2a3a');g.addColorStop(1,'#ff9a4a');x.fillStyle=g;x.fillRect(0,0,16,256);
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.BackSide})));
  [[-30,30,20,0xffc880],[30,10,-30,0xff8a40],[0,45,0,0xaab8ff],[20,5,35,0xffa060]].forEach(([a,b,d,col])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(7,16,8),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(5)}));m.position.set(a,b,d);es.add(m)});
  scene.environment=pm.fromScene(es,.02).texture;pm.dispose();}
/* post: bloom + filmic grade (falls back to plain rendering if the add-ons fail to load) */
let composer=null,gradePass=null;
if(EffectComposer&&UnrealBloomPass&&ShaderPass){try{
  renderer.toneMapping=THREE.NoToneMapping;
  const rt=new THREE.WebGLRenderTarget(VW(),VH(),{type:THREE.HalfFloatType,format:THREE.RGBAFormat,samples:4});
  composer=new EffectComposer(renderer,rt);composer.addPass(new RenderPass(scene,camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(VW(),VH()),.4,.8,.9));
  gradePass=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},exposure:{value:.85}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform sampler2D tDiffuse;uniform float time,exposure;varying vec2 vUv;vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec2 d=vUv-.5;float r=dot(d,d);vec3 c=vec3(texture2D(tDiffuse,vUv+d*r*.014).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-d*r*.014).b);c*=exposure;c=aces(c);c=pow(c,vec3(1./2.2));c*=1.-smoothstep(.12,.7,r)*.5;c+=(h(vUv*vec2(1920.,1080.)+time)-.5)*.03;gl_FragColor=vec4(c,1.);}'});
  composer.addPass(gradePass);}catch(e){composer=null;renderer.toneMapping=THREE.ACESFilmicToneMapping}}

/* ---------- Materials ---------- */
const M={
  skin:new THREE.MeshPhysicalMaterial({color:0xffffff,map:skinCol,roughness:.7,bumpMap:skinBump,bumpScale:2.6,emissive:0x2a0d06,emissiveIntensity:.3,clearcoat:.05,clearcoatRoughness:.6}),
  skinDark:new THREE.MeshStandardMaterial({color:0x2a0f0a,roughness:.8}),
  gold:new THREE.MeshStandardMaterial({color:0xe7b04a,metalness:.85,roughness:.3,emissive:0x5a3a08,emissiveIntensity:.9}),
  ruby:new THREE.MeshStandardMaterial({color:0xc0102a,roughness:.15,metalness:.3,emissive:0x7a0618,emissiveIntensity:1}),
  cloth:new THREE.MeshStandardMaterial({color:0xffffff,map:silkTex,roughness:.55,emissive:0x2a0610,emissiveIntensity:.6}),
  stone:new THREE.MeshStandardMaterial({color:0x6a4a44,roughness:.8,emissive:0x1a0c0c,emissiveIntensity:.6}),
  bone:new THREE.MeshStandardMaterial({color:0xf2e6cf,roughness:.5}),
  eye:new THREE.MeshBasicMaterial({color:0xff7a1f}),
  add:(c,o=1)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false})
};
function mesh(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,parent=scene){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
const SPH=new THREE.SphereGeometry(1,40,28),CYL=new THREE.CylinderGeometry(1,1,1,28),BOX=new THREE.BoxGeometry(1,1,1),CONE=new THREE.ConeGeometry(1,1,24),TOR=(r,t)=>new THREE.TorusGeometry(r,t,12,48);
function limb(parent,a,b,r1,r2,mat,off=new V3()){
  const p1=a.clone().sub(off),p2=b.clone().sub(off),d=p2.clone().sub(p1),len=d.length();
  const o=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,len,24),mat);
  o.position.copy(p1).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new V3(0,1,0),d.normalize());
  o.castShadow=o.receiveShadow=true;parent.add(o);return o;
}

/* ---------- The hall ---------- */
const hall=new THREE.Group();scene.add(hall);
mesh(new THREE.PlaneGeometry(240,300),new THREE.MeshStandardMaterial({map:floorTex,roughness:.6,metalness:.15,emissive:0x1a0c0c,emissiveIntensity:.5}),0,0,0,1,1,1,hall).rotation.x=-Math.PI/2;
const walls=[[0,35,-120,240,90,2],[-80,35,0,2,90,300],[80,35,0,2,90,300],[0,35,130,240,90,2]];
walls.forEach(w=>mesh(BOX,new THREE.MeshStandardMaterial({color:0x2a1a22,roughness:.9}),w[0],w[1],w[2],w[3],w[4],w[5],hall));
mesh(BOX,new THREE.MeshStandardMaterial({color:0x14090e}),0,82,0,240,2,300,hall);
// pillars with gold bands
for(const sx of[-1,1])for(let k=-2;k<=2;k++){
  const p=new THREE.Group();p.position.set(sx*46,0,k*42);hall.add(p);
  mesh(CYL,M.stone,0,28,0,3.6,56,3.6,p);mesh(BOX,M.stone,0,2,0,8,4,8,p);mesh(BOX,M.stone,0,57,0,8.4,3,8.4,p);
  [6,22,44].forEach(y=>mesh(TOR(3.7,.7),M.gold,0,y,0,1,1,1,p).rotation.x=Math.PI/2);
}
// dais and silk bed
mesh(BOX,M.stone,0,1.2,0,40,2.4,96,hall);
mesh(BOX,M.gold,0,2.45,0,41,.3,97,hall);
mesh(BOX,M.cloth,0,3.05,0,35,1.1,88,hall).material.map=silkTex;
// carpet
mesh(BOX,new THREE.MeshStandardMaterial({map:silkTex,color:0xcc6a6a,roughness:.7}),0,.06,70,13,.1,48,hall);

/* ---------- Braziers, light shafts, embers ---------- */
const flames=[];
[[-30,-64],[30,-64],[-30,-6],[30,-6],[-30,56],[30,56]].forEach(([x,z],i)=>{
  const g=new THREE.Group();g.position.set(x,0,z);hall.add(g);
  mesh(CYL,M.stone,0,3,0,1.4,6,1.4,g);mesh(CYL,M.gold,0,6.4,0,3.1,1.4,3.1,g);mesh(TOR(3,.35),M.gold,0,7.1,0,1,1,1,g).rotation.x=Math.PI/2;
  const fl=[];for(let k=0;k<3;k++){const c=new THREE.Mesh(CONE,M.add(k?0xff8a2a:0xffc35a,.85));c.scale.set(1.5-k*.35,4.2+k,1.5-k*.35);c.position.y=9.3+k*.2;g.add(c);fl.push(c)}
  const L=PL(0xff8a3a,1.1,72,1.5);L.position.set(x,10,z);scene.add(L);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff9a4a,blending:THREE.AdditiveBlending,transparent:true,opacity:.6,depthWrite:false,fog:false}));halo.scale.set(18,18,1);halo.position.set(0,10,0);g.add(halo);
  flames.push({fl,L,seed:i*1.7});
});
[[-34,60,-26,.5],[38,62,-30,-.5],[0,58,-70,0]].forEach(([x,y,z,r])=>{
  const b=new THREE.Mesh(new THREE.ConeGeometry(15,86,36,1,true),M.add(0x8fa6ff,.03));b.position.set(x,y-18,z);b.rotation.z=r;scene.add(b);
});
const EMB=500,embGeo=new THREE.BufferGeometry(),embPos=new Float32Array(EMB*3),embVel=[];
for(let i=0;i<EMB;i++){embPos.set([rnd(-70,70),rnd(0,70),rnd(-100,100)],i*3);embVel.push(rnd(.3,1.6))}
embGeo.setAttribute('position',new THREE.BufferAttribute(embPos,3));
const embers=new THREE.Points(embGeo,new THREE.PointsMaterial({map:glowTex,color:0xffa050,size:1.3,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(embers);

/* ---------- Soldiers of Lanka ---------- */
function soldier(x,z,role,rotY=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotY;scene.add(g);
  const armor=new THREE.MeshStandardMaterial({color:0x7a1a2b,roughness:.5,emissive:0x240810,emissiveIntensity:.8});
  mesh(CYL,armor,0,1.3,0,.52,1.5,.52,g);mesh(SPH,M.skin,0,2.35,0,.34,.36,.34,g);
  mesh(CONE,M.gold,0,2.85,0,.4,.6,.4,g);mesh(CYL,M.gold,0,1.55,0,.56,.22,.56,g);
  mesh(CYL,M.skinDark,-.2,.4,0,.17,.8,.17,g);mesh(CYL,M.skinDark,.2,.4,0,.17,.8,.17,g);
  const o={g,role,drum:null};
  if(role==='drum'){o.drum=mesh(CYL,M.cloth,0,1.2,.9,.9,.8,.9,g);o.drum.rotation.x=Math.PI/2;mesh(TOR(.9,.09),M.gold,0,1.2,1.3,1,1,1,g)}
  if(role==='conch'){const c=mesh(CONE,M.bone,.1,2.0,.6,.28,1.1,.28,g);c.rotation.x=-1.2;o.conch=c}
  if(role==='spear'){const s=mesh(CYL,M.skinDark,.7,2.2,0,.06,4.4,.06,g);mesh(CONE,M.gold,.7,4.6,0,.14,.55,.14,g)}
  if(role==='torch'){}
  return o;
}
const troops=[];
[[-6,44],[6,44],[-11,48],[11,48],[-3.5,50],[3.5,50]].forEach(([x,z],i)=>troops.push(soldier(x,z,'drum',Math.PI+(x>0?-.3:.3))));
[[-15,40],[15,40]].forEach(([x,z])=>troops.push(soldier(x,z,'conch',Math.PI+(x>0?-.5:.5))));
[[-19,52],[19,52],[-8,56],[8,56]].forEach(([x,z])=>troops.push(soldier(x,z,'spear',Math.PI)));


/* ---------- Hall dressing: moonlit arch, banners, hanging lamps, floor mist ---------- */
const mists=[],banners=[],lamps=[];
{
  const c=document.createElement('canvas');c.width=512;c.height=768;const x=c.getContext('2d');
  x.beginPath();x.moveTo(0,768);x.lineTo(0,256);x.arc(256,256,256,Math.PI,0);x.lineTo(512,768);x.closePath();x.clip();
  const sky=x.createLinearGradient(0,0,0,768);sky.addColorStop(0,'#0b0d2e');sky.addColorStop(.55,'#3a1d52');sky.addColorStop(.85,'#c2572e');sky.addColorStop(1,'#ffb35a');
  x.fillStyle=sky;x.fillRect(0,0,512,768);
  for(let i=0;i<220;i++){x.fillStyle='rgba(255,255,255,'+rnd(.2,.9)+')';x.fillRect(rnd(0,512),rnd(0,520),rnd(.6,1.8),rnd(.6,1.8))}
  const mg=x.createRadialGradient(380,170,2,380,170,70);mg.addColorStop(0,'rgba(255,248,220,1)');mg.addColorStop(.25,'rgba(255,240,200,.8)');mg.addColorStop(1,'rgba(255,240,200,0)');
  x.fillStyle=mg;x.fillRect(250,40,260,260);
  x.fillStyle='#1a0b16';x.beginPath();x.moveTo(0,768);
  for(let i=0;i<=512;i+=16){const h=rnd(40,130)*(i>120&&i<400?1.5:.8);x.lineTo(i,640-h);x.lineTo(i+10,640-h)}
  x.lineTo(512,768);x.fill();
  for(let i=0;i<60;i++){x.fillStyle='rgba(255,'+((180+Math.random()*50)|0)+',90,'+rnd(.4,.9)+')';x.fillRect(rnd(0,512),rnd(520,700),2,3)}
  const win=new THREE.Mesh(new THREE.PlaneGeometry(44,66),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,fog:false}));
  win.position.set(0,34,-118.6);scene.add(win);
  const arch=new THREE.Mesh(new THREE.TorusGeometry(22,1.1,10,64,Math.PI),M.gold);arch.position.set(0,45,-118.4);scene.add(arch);
  [-1,1].forEach(s=>mesh(BOX,M.gold,s*22,23,-118.4,2.2,44,2,scene));
  // silk banners between the pillars
  for(const sx of[-1,1])for(let k=-2;k<=2;k++){
    const g=new THREE.Group();g.position.set(sx*77.6,60,k*42+21);g.rotation.y=-sx*Math.PI/2;scene.add(g);
    const b=new THREE.Mesh(new THREE.PlaneGeometry(9,34,1,12),new THREE.MeshStandardMaterial({map:silkTex,roughness:.6,side:THREE.DoubleSide,emissive:0x240610,emissiveIntensity:.8}));
    b.position.y=-17;g.add(b);const rod=mesh(CYL,M.gold,0,0,0,.4,10.5,.4,g);rod.rotation.z=Math.PI/2;
    mesh(SPH,M.gold,0,-34.3,0,.9,.9,.9,g);mesh(CONE,M.gold,0,-35.6,0,.5,1.6,.5,g).rotation.x=Math.PI;
    banners.push({b,ph:Math.random()*6,base:b.geometry.attributes.position.array.slice()});
  }
  // hanging lamps
  for(const sx of[-1,1])for(const z of[-90,-45,0,45,90]){
    const g=new THREE.Group();g.position.set(sx*58,0,z);scene.add(g);
    mesh(CYL,M.gold,0,66,0,.12,32,.12,g);
    mesh(new THREE.SphereGeometry(1,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2),M.gold,0,50,0,3,2.2,3,g);
    const fl=new THREE.Mesh(CONE,M.add(0xffb050,.9));fl.scale.set(1.1,3.2,1.1);fl.position.y=52.4;g.add(fl);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffa050,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.4,fog:false}));
    sp.scale.set(14,14,1);sp.position.y=52.5;g.add(sp);lamps.push({fl,sp,ph:Math.random()*6});
  }
  // floor mist
  const mt=makeTex(256,256,(x2,w,h)=>{x2.clearRect(0,0,w,h);for(let i=0;i<46;i++){const px=rnd(0,w),py=rnd(0,h),r=rnd(30,80),gr=x2.createRadialGradient(px,py,0,px,py,r);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');x2.fillStyle=gr;x2.fillRect(px-r,py-r,r*2,r*2)}},[2,2]);
  [[1.0,.025],[2.8,.015],[4.8,.01]].forEach(([y,o],i)=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(200,260),new THREE.MeshBasicMaterial({map:mt,color:0xb09ad8,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
    m.rotation.x=-Math.PI/2;m.position.y=y;scene.add(m);mists.push({m,sp:(i%2?-1:1)*.006*(i+1)});
  });
}
function dressUpdate(t){
  banners.forEach(o=>{const pa=o.b.geometry.attributes.position,a=o.base;
    for(let i=0;i<pa.count;i++){const y=a[i*3+1],p=(17-y)/34;pa.setXYZ(i,a[i*3],y,a[i*3+2]+Math.sin(t*1.3+o.ph+y*.2)*.9*p)}
    pa.needsUpdate=true});
  lamps.forEach(o=>{const f=.85+Math.sin(t*8+o.ph)*.12+Math.sin(t*19+o.ph*2)*.06;o.fl.scale.y=3.2*f;o.sp.material.opacity=.35+.12*f});
  mists.forEach(o=>{o.m.rotation.z=t*o.sp});
}

/* ---------- Kumbhakarna: sculpted body ---------- */
const giant=new THREE.Group();giant.position.set(0,3.6,0);scene.add(giant);
const PIV=new V3(0,4,4);                                   // hip hinge for the sit-up
const up=new THREE.Group();up.position.copy(PIV);giant.add(up);
const torsoGrp=new THREE.Group();torsoGrp.position.set(-PIV.x,-PIV.y,-PIV.z);up.add(torsoGrp);
const hitMeshes=[];
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const gs=(dx,dy,s)=>Math.exp(-(dx*dx+dy*dy)/s);
const g1=(x,s)=>Math.exp(-x*x/s);
const SK=M.skin.clone();SK.vertexColors=true;
const CL=M.cloth.clone();CL.vertexColors=true;
const HAIR=new THREE.MeshStandardMaterial({color:0x140a08,roughness:.85});
const Yax=new V3(0,1,0),Zax=new V3(0,0,1);

/* parametric surface: P(t,a,out) fills a point; flip chooses winding */
function surf(nt,na,P,flip,col,uv){
  uv=uv||[3,1];const N=(nt+1)*(na+1);
  const pos=new Float32Array(N*3),cA=new Float32Array(N*3),uA=new Float32Array(N*2),o=[0,0,0];
  let k=0,c=0,q=0;
  for(let i=0;i<=nt;i++)for(let j=0;j<=na;j++){
    const t=i/nt,a=j/na*Math.PI*2;P(t,a,o);pos[k++]=o[0];pos[k++]=o[1];pos[k++]=o[2];
    const sh=col?col(t,a):1;cA[c++]=sh;cA[c++]=sh*.97;cA[c++]=sh*.94;uA[q++]=j/na*uv[0];uA[q++]=t*uv[1];
  }
  const idx=[];
  for(let i=0;i<nt;i++)for(let j=0;j<na;j++){const a=i*(na+1)+j,b=a+1,c2=a+na+1,d=c2+1;
    if(flip)idx.push(a,c2,b,b,c2,d);else idx.push(a,b,c2,b,d,c2)}
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(cA,3));geo.setAttribute('uv',new THREE.BufferAttribute(uA,2));
  geo.setIndex(idx);geo.computeVertexNormals();
  const n=geo.attributes.normal.array;
  for(let i=0;i<=nt;i++){const a0=i*(na+1)*3,a1=(i*(na+1)+na)*3;for(let m=0;m<3;m++){const v=(n[a0+m]+n[a1+m])*.5;n[a0+m]=n[a1+m]=v}}
  return geo;
}
function addMesh(geo,mat,parent,hit){const m=new THREE.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;parent.add(m);if(hit)hitMeshes.push(m);return m}
const crs=(p0,p1,p2,p3,u)=>.5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u);

/* ----- torso: one continuous loft from neck to waist ----- */
const TS=[[-22,3.5,3.3,5.6],[-20,4.8,3.9,5.9],[-17.5,10.4,5.0,5.8],[-14,11.2,6.4,6.3],[-9,10.4,6.6,6.4],[-4,9.7,6.4,6.2],[1,9.8,6.9,6.3],[5.5,8.8,5.8,5.6]];
function sec(z){
  let i=0;while(i<TS.length-2&&z>TS[i+1][0])i++;
  const a=TS[Math.max(i-1,0)],b=TS[i],c=TS[i+1],d=TS[Math.min(i+2,TS.length-1)];
  const u=clamp((z-b[0])/(c[0]-b[0]),0,1);
  return{rx:crs(a[1],b[1],c[1],d[1],u),ry:crs(a[2],b[2],c[2],d[2],u),cy:crs(a[3],b[3],c[3],d[3],u)};
}
function torsoD(x,z,top,sa){
  const ax=Math.abs(x);let d=0;
  for(const s of[-1,1]){
    d+=1.3*gs(x-s*4.8,(z+12.4)*.8,10)*top;            // pectorals
    d+=.45*gs(x-s*4.4,z+9.8,2.2)*top;                  // lower pec edge
    d+=.9*gs(x-s*9.2,z+16.4,7)*top;                    // trapezius / shoulder cap
    const side=Math.max(0,sa*s);
    d+=.22*side*(.5+.5*Math.sin(z*1.9))*sstep(-10,-6,z)*(1-sstep(-1,3,z)); // ribs
  }
  d-=.55*g1(x,.9)*top*sstep(-17,-14,z)*(1-sstep(-8,-5,z));                // sternum valley
  d+=.4*g1(z+17.7,.45)*top*sstep(1,3,ax)*(1-sstep(7,9,ax));                // collarbones
  for(const zr of[-5.6,-2.4,.8])d+=.45*gs(ax-2.0,z-zr,1.25)*top*(1-.5*sstep(-1,1,z)); // abdominal blocks
  d-=.25*g1(x,.05)*top*sstep(-7,-5.5,z)*(1-sstep(1.5,3,z));                // linea alba
  d-=1.1*gs(x,z+1.2,.5)*top;                                               // navel
  d+=.5*gs(x,z+3,22)*top;                                                  // belly mass
  return d;
}
let lastD=0;
function torsoP(t,a,o){const z=lerp(-22,5.5,t),s=sec(z),sa=Math.sin(a),ca=Math.cos(a),top=Math.max(0,ca),x0=s.rx*sa,d=torsoD(x0,z,top,sa);lastD=d;o[0]=x0+sa*d;o[1]=s.cy+s.ry*ca+ca*d;o[2]=z}
addMesh(surf(72,72,torsoP,true,(t,a)=>clamp(.84+.18*Math.max(0,Math.cos(a))+lastD*.22,.55,1.2),[3,2.5]),SK,torsoGrp,true);
const surfY=(x,z)=>{const s=sec(z),q=Math.sqrt(Math.max(0,1-(x/s.rx)*(x/s.rx)));return s.cy+s.ry*q+torsoD(x,z,q,x/s.rx)*q};
const NAVEL=new V3(0,surfY(0,-1.2)+.5,-1.2);

/* ----- regalia on the chest: necklace, sash, belt ----- */
{
  const pts=[];for(let i=0;i<=16;i++){const u=i/8-1,x=5.4*u,z=-19.2+5.8*(1-u*u);pts.push(new V3(x,surfY(x,z)+.32,z))}
  const cv=new THREE.CatmullRomCurve3(pts);
  addMesh(new THREE.TubeGeometry(cv,48,.17,8,false),M.gold,torsoGrp);
  for(let i=0;i<=14;i++){const p=cv.getPointAt(i/14);mesh(SPH,i%3===1?M.ruby:M.gold,p.x,p.y,p.z,.42,.42,.42,torsoGrp)}
  const pe=cv.getPointAt(.5);mesh(SPH,M.ruby,pe.x,pe.y-.1,pe.z+.9,.85,.85,.85,torsoGrp);mesh(TOR(.95,.14),M.gold,pe.x,pe.y,pe.z+.9,1,1,1,torsoGrp).rotation.x=Math.PI/2;
  const sp=[];for(let i=0;i<=14;i++){const u=i/14,x=lerp(-8.6,6.9,u),z=lerp(-18,2,u);sp.push(new V3(x,surfY(x,z)+.4,z))}
  addMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp),60,.5,10,false),M.cloth,torsoGrp);
}
{const b=mesh(TOR(8.9,.62),M.gold,0,5.6,5.2,1,.66,1,giant);mesh(SPH,M.ruby,0,11.55,5.3,1.05,.85,.6,giant);
 [-1,1].forEach(s=>mesh(SPH,M.gold,s*3.2,11.15,5.2,.5,.4,.4,giant))}

/* ----- dhoti and bed dressing ----- */
{
  const P=(t,a,o)=>{const z=lerp(4,16.8,t),rx=lerp(8.8,10.8,t)+Math.max(0,t-.88)*9,ry=lerp(5.3,4.9,t),cy=lerp(5.4,4.9,t),sa=Math.sin(a),ca=Math.cos(a);
    const f=.4*Math.sin(a*13+t*3)*(.25+.75*t)+.2*Math.sin(a*29+t*7)*t;lastD=f;o[0]=(rx+f)*sa;o[1]=cy+(ry+f)*ca;o[2]=z};
  addMesh(surf(40,96,P,true,()=>clamp(.9+lastD*.5,.55,1.2),[8,4]),CL,giant);
}
mesh(SPH,M.cloth,0,2.0,-25,8.8,2.7,6.8,giant).castShadow=false;                  // pillow
mesh(TOR(7.2,.35),M.gold,0,2.7,-25,1,.82,.28,giant).rotation.x=Math.PI/2;

/* ----- limbs ----- */
function limbMesh(parent,p1,p2,rf,mat){
  const d=p2.clone().sub(p1),len=d.length();
  const geo=surf(28,28,(t,a,o)=>{const r=rf(t,a);o[0]=r*Math.sin(a);o[1]=t*len;o[2]=r*Math.cos(a)},false,null,[2,1.5]);
  const m=addMesh(geo,mat||SK,parent,true);m.position.copy(p1);m.quaternion.setFromUnitVectors(Yax,d.normalize());return m;
}
function ring(parent,pos,dir,R,tube,mat){const m=mesh(TOR(R,tube),mat||M.gold,pos.x,pos.y,pos.z,1,1,1,parent);m.quaternion.setFromUnitVectors(Zax,dir.clone().normalize());return m}

const feet=[],legs=[];
[-1,1].forEach(s=>{
  const H0=new V3(s*5.2,4.4,8.5),K=new V3(s*5.6,3.8,21),A=new V3(s*6,2.6,32);
  limbMesh(giant,H0,K,(t,a)=>lerp(4.7,3.3,t)*(1+.05*Math.sin(Math.PI*t))+.3*Math.max(0,Math.cos(a))*Math.sin(Math.PI*t));
  limbMesh(giant,K,A,(t,a)=>lerp(3.3,1.95,t)+.75*Math.exp(-Math.pow((t-.3)/.22,2)));
  hitMeshes.push(mesh(SPH,M.skin,K.x,K.y,K.z,3.3,3.2,3.3,giant),mesh(SPH,M.skin,K.x,K.y+2.2,K.z+.3,1.9,1.2,1.9,giant));
  ring(giant,new V3(A.x,A.y,A.z-.8),Zax,2.25,.3);
  const f=new THREE.Group();f.position.set(A.x,A.y-.4,A.z);f.userData.s=s;giant.add(f);
  hitMeshes.push(mesh(SPH,M.skin,0,3.0,1.0,2.6,4.1,1.6,f));
  hitMeshes.push(mesh(SPH,M.skin,0,-.3,.6,1.9,1.5,1.3,f));                       // heel
  [[-1.75,.95,6.4],[-.65,.62,6.7],[.35,.56,6.6],[1.2,.5,6.3],[1.9,.42,5.7]].forEach(([x,r,y])=>{
    hitMeshes.push(mesh(SPH,M.skin,-s*x,y,1.1,r,r*1.05,r*.9,f))});
  feet.push(f);legs.push({H0,K,A});
});

function arm(s){
  const S=new V3(s*11.2,6.3,-14.6),E=new V3(s*13.8,3.2,-4.4),W=new V3(s*12.9,1.8,5.2);
  const g=new THREE.Group();g.position.copy(S).sub(PIV);up.add(g);
  const lS=new V3(0,0,0),lE=E.clone().sub(S),lW=W.clone().sub(S);
  hitMeshes.push(mesh(SPH,M.skin,0,0,0,3.6,3.4,3.8,g));
  limbMesh(g,lS,lE,(t,a)=>lerp(2.95,2.25,t)+.4*Math.sin(Math.PI*t));
  hitMeshes.push(mesh(SPH,M.skin,lE.x,lE.y,lE.z,2.35,2.3,2.35,g));
  limbMesh(g,lE,lW,(t,a)=>lerp(2.3,1.5,t)+.45*Math.exp(-Math.pow((t-.22)/.2,2)));
  ring(g,lS.clone().lerp(lE,.45),lE.clone().sub(lS),2.85,.32);
  ring(g,lE.clone().lerp(lW,.9),lW.clone().sub(lE),1.75,.26);
  const h=new THREE.Group();h.position.copy(lW);g.add(h);
  hitMeshes.push(mesh(SPH,M.skin,0,-.2,1.3,1.75,.85,2.0,h));
  for(let i=0;i<4;i++){const x=(i-1.5)*.74,len=(i===1||i===2)?2.4:(i===0?1.9:2.0)+(i===3?-.2:0);
    limbMesh(h,new V3(x,-.4,2.5),new V3(x,-.55,2.5+len),t=>lerp(.37,.27,t));mesh(SPH,M.skin,x,-.55,2.5+len,.28,.26,.3,h)}
  limbMesh(h,new V3(-s*1.3,-.3,.8),new V3(-s*2.1,-.5,2.5),t=>lerp(.5,.34,t));
  return{g,palm:lW.clone().add(new V3(0,.9,1.5))};
}
const armL=arm(-1),armR=arm(1);

/* ---------- The head: sculpted face, hinged jaw, eyes with lids ---------- */
const head=new THREE.Group();head.position.set(0,5.2,-24.5).sub(PIV);up.add(head);   // animated (tilt / sway)
const hm=new THREE.Group();hm.rotation.x=-Math.PI/2;head.add(hm);                    // face looks up (+z of hm = world up)
const HX=4.3,HY=5.0,HZ=4.7;
const rig={lids:[],iris:[],nostrils:[],jaw:null,glow:[]};
function headD(x,y,z){
  const f=sstep(0,.5,z),ax=Math.abs(x);let d=0;
  d+=.09*g1(y-.30,.006)*f*(.75+.5*sstep(0,.5,ax));                                   // brow ridge
  d-=.02*g1(x,.003)*g1(y-.28,.01)*f;                                                 // frown line
  d+=.03*g1(x,.05)*g1(y-.5,.01)*f;                                                   // forehead
  d-=.09*Math.exp(-(Math.pow(ax-.36,2)/.016+Math.pow(y-.12,2)/.010))*f;               // eye sockets
  d+=.065*Math.exp(-(Math.pow(ax-.46,2)/.02+Math.pow(y+.12,2)/.016))*f;               // cheekbones
  d-=.04*Math.exp(-(Math.pow(ax-.42,2)/.02+Math.pow(y+.30,2)/.012))*f;               // cheek hollows
  d+=.055*g1(x,.006)*sstep(-.2,-.1,y)*sstep(.25,.15,y)*f;                            // nose bridge
  d+=.18*Math.exp(-(x*x/.012+Math.pow(y+.17,2)/.012))*f;                             // nose tip
  d+=.07*Math.exp(-(Math.pow(ax-.14,2)/.007+Math.pow(y+.21,2)/.006))*f;               // nostril wings
  d+=.04*g1(y+.35,.0016)*g1(x,.12)*f;                                                // upper lip
  d-=.03*g1(y+.395,.0003)*g1(x,.2)*f;                                                // lip line
  return d;
}
{
  const geo=new THREE.SphereGeometry(1,96,72),pa=geo.attributes.position,N=pa.count,col=new Float32Array(N*3);
  for(let i=0;i<N;i++){
    const x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i),d=headD(x,y,z),r=1+d;
    const yy=y<-.40?-.40+(y+.40)*.1:y,k=y<-.40?.93:1;
    pa.setXYZ(i,x*r*HX*k,yy*r*HY,z*r*HZ*k);
    const sh=clamp(.9+d*1.7,.55,1.15);col[i*3]=sh;col[i*3+1]=sh*.97;col[i*3+2]=sh*.94;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
  hitMeshes.push(addMesh(geo,SK,hm));
}
/* lower jaw on a hinge */
const jawPivot=new THREE.Group();jawPivot.position.set(0,-1.1,-1.6);hm.add(jawPivot);rig.jaw=jawPivot;
{
  const JX=3.7,JY=1.9,JZ=3.9,geo=new THREE.SphereGeometry(1,64,48),pa=geo.attributes.position,N=pa.count,col=new Float32Array(N*3);
  for(let i=0;i<N;i++){
    const x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i),f=sstep(0,.4,z);
    let d=.13*Math.exp(-(x*x/.04+Math.pow(y+.72,2)/.05))*f;                           // chin
    d+=.05*g1(y-.5,.01)*g1(x,.25)*f;                                                  // lower lip
    d-=.04*g1(y-.38,.0006)*g1(x,.3)*f;                                                // lip line
    const r=1+d;pa.setXYZ(i,x*r*JX,y*r*JY+(-3.1+1.1),z*r*JZ+(.7+1.6));
    const sh=clamp(.9+d*1.5,.6,1.1);col[i*3]=sh;col[i*3+1]=sh*.97;col[i*3+2]=sh*.94;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();hitMeshes.push(addMesh(geo,SK,jawPivot));
}
{
  const dark=new THREE.MeshStandardMaterial({color:0x240608,roughness:.9,emissive:0x120203});
  mesh(SPH,dark,0,-2.05,.9,3.1,1.2,3.3,hm);                                            // mouth interior
  const tg=mesh(SPH,new THREE.MeshStandardMaterial({color:0x9a3a40,roughness:.5}),0,-.6,2.0,1.8,.45,2.4,jawPivot);tg.castShadow=false;
  for(let i=0;i<9;i++){const a=-1.0+i*.25,x=2.9*Math.sin(a),z=.6+3.3*Math.cos(a);
    const t=mesh(CONE,M.bone,x,-2.0,z,.22,.6,.22,hm);t.rotation.x=Math.PI;t.castShadow=false;
    const b=mesh(CONE,M.bone,x,-2.0+1.1+.05,z+1.6,.2,.5,.2,jawPivot);b.castShadow=false}
  [-1,1].forEach(s=>{const t=mesh(CONE,M.bone,s*1.65,-2.5+1.1,5.6,.34,1.9,.34,jawPivot);t.rotation.x=.18;t.rotation.z=-s*.12;           // tusks
    const e=mesh(SPH,M.bone,s*1.65,-2.5+1.1-.9,5.55,.36,.3,.36,jawPivot)});
  // nostrils
  [-1,1].forEach(s=>rig.nostrils.push(mesh(SPH,new THREE.MeshStandardMaterial({color:0x1a0806,roughness:1}),s*.55,-1.15,4.45,.34,.2,.4,hm)));
}
/* eyes */
[-1,1].forEach(s=>{
  const eg=new THREE.Group();eg.position.set(s*1.6,.7,3.55);hm.add(eg);
  mesh(SPH,new THREE.MeshStandardMaterial({color:0xe6d2b4,roughness:.25}),0,0,0,.8,.8,.8,eg).castShadow=false;
  const irisM=new THREE.MeshStandardMaterial({color:0xcc3a10,emissive:0xff5010,emissiveIntensity:0,roughness:.3});
  const iris=new THREE.Mesh(new THREE.SphereGeometry(.805,24,12,0,Math.PI*2,0,.62),irisM);iris.rotation.x=Math.PI/2;eg.add(iris);
  const pup=new THREE.Mesh(new THREE.SphereGeometry(.812,16,8,0,Math.PI*2,0,.24),new THREE.MeshBasicMaterial({color:0x000000}));pup.rotation.x=Math.PI/2;eg.add(pup);
  const lid=new THREE.Group();eg.add(lid);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.98,24,12,0,Math.PI*2,0,Math.PI/2),M.skin);dome.rotation.x=Math.PI/2;dome.castShadow=false;lid.add(dome);
  const line=mesh(SPH,M.skinDark,0,-.04,.99,.66,.035,.05,lid);line.castShadow=false;
  rig.lids.push(lid);rig.iris.push(irisM);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff6a20,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0,fog:false}));
  gl.position.set(0,0,.9);gl.scale.set(3,3,1);eg.add(gl);rig.glow.push(gl);
  // brow and ear
  const br=mesh(SPH,HAIR,s*1.95,1.95,4.0,1.6,.36,.62,hm);br.rotation.z=s*.38;br.castShadow=false;
  const ear=mesh(SPH,M.skin,s*4.2,-.2,-.4,.6,1.7,1.25,hm);ear.rotation.y=s*.35;
  mesh(TOR(1.0,.18),M.gold,s*4.55,-2.1,-.4,1,1,1,hm).rotation.y=Math.PI/2;
  mesh(SPH,M.ruby,s*4.55,-3.4,-.4,.5,.6,.5,hm);
});
/* crown, hair, moustache, tilak */
try{
  const prof=[[0,0],[3.4,0],[3.55,.35],[3.2,.8],[3.3,1.2],[2.7,2.2],[2.8,2.7],[1.9,4.2],[2.0,4.6],[1.0,6.2],[.5,6.9],[0,7.2]].map(p=>new THREE.Vector2(p[0],p[1]));
  const crown=mesh(new THREE.LatheGeometry(prof,40),M.gold,0,2.9,-.4,1,1,1,hm);crown.rotation.x=-.18;
  mesh(SPH,M.ruby,0,3.35,3.55,.55,.55,.35,hm);[-1,1].forEach(s=>mesh(SPH,M.ruby,s*2.2,3.2,2.8,.38,.38,.3,hm));
  const cap=mesh(new THREE.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI*.38),HAIR,0,.25,-.3,4.5,5.2,4.9,hm);cap.rotation.x=-.3;cap.castShadow=false;
  const knot=mesh(SPH,HAIR,0,6.9,-1.2,1.8,1.5,1.8,hm);mesh(TOR(1.7,.3),M.gold,0,6.0,-1.2,1,1,1,hm).rotation.x=Math.PI/2;
  const strand=(pts,r0)=>{const cv=new THREE.CatmullRomCurve3(pts.map(p=>new V3(p[0],p[1],p[2]))),tg=new THREE.TubeGeometry(cv,40,r0,8,false),pa=tg.attributes.position;
    for(let i=0;i<pa.count;i++){const u=Math.floor(i/9)/40,c=cv.getPointAt(u),k=1-.85*u;pa.setXYZ(i,c.x+(pa.getX(i)-c.x)*k,c.y+(pa.getY(i)-c.y)*k,c.z+(pa.getZ(i)-c.z)*k)}
    tg.computeVertexNormals();const m=addMesh(tg,HAIR,hm);m.castShadow=false;return m};
  for(let i=0;i<11;i++){const x=(i-5)*.7;strand([[x*.6,3.4,-3],[x*1.2,6.5,-4.4],[x*1.7,9.6,-4.9],[x*2.2+Math.sin(i)*.8,13,-4.9]],.42)}
  [-1,1].forEach(s=>{
    strand([[s*.2,-1.45,4.6],[s*1.5,-1.4,4.35],[s*2.7,-1.8,3.8],[s*3.5,-1.2,3.1]],.3);
    strand([[s*3.7,2.6,2],[s*4.3,5,-.2],[s*4.4,8,-1.8]],.28);
  });
  mesh(SPH,new THREE.MeshStandardMaterial({color:0xc01a22,emissive:0x601008,roughness:.5}),0,2.2,4.05,.22,.8,.12,hm);
}catch(e){}
/* ---- the crowd: soldiers on every side, all trying to wake him ---- */
const crowd=[];
const cMats=[0x7a1a2b,0x23306a,0x8a5a14,0x1d5a4a,0x5a1f6a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.55,emissive:new THREE.Color(c).multiplyScalar(.25)}));
const torchSpr=new THREE.SpriteMaterial({map:glowTex,color:0xffa040,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false});
function crowdMan(x,y,z,role,ph){
  const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);g.scale.setScalar(rnd(1.5,1.8));
  const am=cMats[(Math.random()*cMats.length)|0];
  mesh(CYL,am,0,1.3,0,.5,1.5,.5,g);mesh(CYL,M.gold,0,1.55,0,.54,.2,.54,g);mesh(SPH,M.skin,0,2.35,0,.33,.36,.33,g);
  mesh(CONE,M.gold,0,2.8,0,.36,.55,.36,g);
  mesh(CYL,M.skinDark,-.2,.4,0,.16,.8,.16,g);mesh(CYL,M.skinDark,.2,.4,0,.16,.8,.16,g);
  const arms=[-1,1].map(s=>{const a=new THREE.Group();a.position.set(s*.62,1.95,0);g.add(a);mesh(CYL,M.skin,0,-.5,0,.14,1.1,.14,a);return a});
  const hand=arms[1],o={g,role,ph,arms,x0:x,z0:z,y0:y,sp:rnd(.85,1.25)};
  if(role==='spear'){const s=mesh(CYL,M.skinDark,0,-.4,.0,.05,4.2,.05,hand);s.rotation.x=0;mesh(CONE,M.gold,0,1.8,0,.12,.5,.12,hand)}
  if(role==='torch'){mesh(CYL,M.skinDark,0,-.9,0,.06,1.2,.06,hand);const sp=new THREE.Sprite(torchSpr);sp.scale.set(1.8,1.8,1);sp.position.set(0,-.2,0);hand.add(sp);mesh(CONE,M.add(0xffb050,.9),0,-.45,0,.2,.6,.2,hand)}
  if(role==='horn'){const c=mesh(CONE,M.bone,0,-1.0,.4,.22,1.0,.22,hand);c.rotation.x=1.2}
  if(role==='drum'){const d=mesh(CYL,M.cloth,0,1.2,.75,.8,.7,.8,g);d.rotation.x=Math.PI/2;o.drum=d;mesh(CYL,M.skinDark,0,-.9,0,.06,.9,.06,hand)}
  if(role==='fan'){const f=mesh(CYL,M.cloth,0,-1.0,.1,.55,.04,.55,hand);f.rotation.z=.4}
  g.traverse(c=>{c.castShadow=false;c.receiveShadow=false});
  crowd.push(o);return o;
}
{const roles=['drum','spear','torch','horn','spear','fan','shout','spear'],avoid=[[-30,-64],[30,-64],[-30,-6],[30,-6],[-30,56],[30,56]];
 let n=0,tries=0;
 while(n<84&&tries++<900){
  let x,y=0,z;const r=Math.random();
  if(r<.5){x=(Math.random()<.5?-1:1)*rnd(23,40);z=rnd(-62,52)}
  else if(r<.75){x=rnd(-24,24);z=rnd(-72,-54)}
  else{x=(Math.random()<.5?-1:1)*rnd(13.5,17);z=rnd(12,36);y=3.5}
  if(avoid.some(([a,b])=>Math.hypot(a-x,b-z)<5))continue;
  if(crowd.some(c=>Math.hypot(c.x0-x,c.z0-z)<2.6))continue;
  crowdMan(x,y,z,roles[(Math.random()*roles.length)|0],rnd(0,6.28));n++;
 }
 crowd.forEach(c=>{c.g.lookAt(0,c.g.position.y,clamp(c.z0,-18,28));c.dirx=-Math.sign(c.x0)*0;
   const dx=c.x0,dz=c.z0-clamp(c.z0,-18,28),L=Math.hypot(dx,dz)||1;c.ax=dx/L;c.az=dz/L});
}
function crowdUpdate(t,dt){
  const stg=G.stage,k=.75+(stg>=1?stg*.12:0)+G.react*1.1,aw=ease(F.awake);
  for(const c of crowd){
    const s=Math.sin(t*5.2*c.sp+c.ph),s2=Math.sin(t*3.3*c.sp+c.ph*1.7),a=c.arms;
    let L=0,R=0;
    switch(c.role){
      case'drum':R=-.9+Math.max(0,s)*1.0*k+G.beat*.7;L=-.9+Math.max(0,-s)*1.0*k;if(c.drum){const q=1-G.beat*.2;c.drum.scale.set(.8*q,.7,.8*q)}break;
      case'spear':R=-2.6+s2*.5*k;L=-.4+s*.4*k;c.g.position.y=c.y0+Math.max(0,s)*.2*k;break;
      case'torch':R=-2.9+s*.4;L=-.3+s2*.3;break;
      case'horn':R=-2.3-.15*Math.sin(t*1.6+c.ph)+G.beat*.3;L=-2.0;break;
      case'fan':R=-1.6+s*.7*k;L=-.5+s2*.5;break;
      default:R=-2.8+s*.5*k;L=-2.8-s*.5*k;c.g.position.y=c.y0+Math.abs(s)*.45*k;
    }
    if(aw>0){const f=aw;R=lerp(R,-3.0,f*.6);L=lerp(L,-3.0,f*.6);c.g.position.x=c.x0+c.ax*f*7;c.g.position.z=c.z0+c.az*f*7;c.g.position.y=c.y0+Math.abs(Math.sin(t*6+c.ph))*.5*f}
    a[1].rotation.x=R;a[0].rotation.x=L;a[0].rotation.z=.1;a[1].rotation.z=-.1;
  }
  G.beat*=Math.exp(-8*dt);
}

/* ---------- Spots, dishes, FX pools ---------- */
const nowS=()=>performance.now()/1000;
function spotSprite(parent,x,y,z){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ringTex,color:0xffd98a,blending:THREE.AdditiveBlending,transparent:true,opacity:0,depthWrite:false,depthTest:false,fog:false}));s.position.set(x,y,z);s.scale.set(7,7,1);s.renderOrder=9;parent.add(s);return{s,cd:0}}
const spots=[spotSprite(giant,-6.2,5.4,35.2),spotSprite(giant,6.2,5.4,35.2),spotSprite(up,NAVEL.x-PIV.x,NAVEL.y-PIV.y+.4,NAVEL.z-PIV.z),spotSprite(armR.g,armR.palm.x,armR.palm.y+.6,armR.palm.z)];
const shocks=[];
function shock(x,y,z,col,s0,s1,dur,dz=0){
  const m=new THREE.Mesh(new THREE.RingGeometry(1,1.16,64),M.add(col,.9));m.position.set(x,y,z);scene.add(m);shocks.push({m,t:0,dur,s0,s1,z0:z,dz});
}
const sparks=[];
function burst(p,n,col,spd=9,life=.8){
  for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));
    s.position.copy(p);s.scale.setScalar(rnd(.6,1.6));scene.add(s);sparks.push({s,v:new V3(rnd(-1,1),rnd(-.2,1.2),rnd(-1,1)).normalize().multiplyScalar(rnd(spd*.3,spd)),t:0,life:rnd(life*.5,life)})}
}

/* ---------- Camera director: keyframed rails, eased cuts and slow drifts ---------- */
const cam={pos:new V3(70,45,100),look:new V3(0,8,-10),fov:50,shake:0,kick:0,roll:0,lam:1.5};
const tgt={pos:cam.pos.clone(),look:cam.look.clone(),fov:50};
const drift={v:new V3(),t0:0},_tp=new V3();
const clk=()=>performance.now()/1000;
let chase=null;
const rail={on:false,keys:[],t0:0,done:null};
function shot(p,l,f=50,lam=2,snap=false){rail.on=false;tgt.pos.set(p[0],p[1],p[2]);tgt.look.set(l[0],l[1],l[2]);tgt.fov=f;cam.lam=lam;drift.v.set(0,0,0);
  if(snap){cam.pos.copy(tgt.pos);cam.look.copy(tgt.look);cam.fov=f}}
function setDrift(x,y,z){drift.v.set(x,y,z);drift.t0=clk()}
function cut(c){shot(c.p,c.l,c.f,1.5);setDrift(c.d[0],c.d[1],c.d[2])}
function playRail(keys,done){rail.keys=keys;rail.t0=clk();rail.on=true;rail.done=done||null;drift.v.set(0,0,0)}
function railSample(tt){
  const K=rail.keys;let i=0;while(i<K.length-2&&tt>K[i+1].t)i++;
  const a=K[Math.max(i-1,0)],b=K[i],c=K[i+1],d=K[Math.min(i+2,K.length-1)];
  const u=clamp((tt-b.t)/(c.t-b.t),0,1),n=(g)=>crs(g(a),g(b),g(c),g(d),u);
  return{p:[n(k=>k.p[0]),n(k=>k.p[1]),n(k=>k.p[2])],l:[n(k=>k.l[0]),n(k=>k.l[1]),n(k=>k.l[2])],f:n(k=>k.f),r:n(k=>k.r||0)};
}
function updateCam(dt,t){
  if(rail.on){
    const K=rail.keys,end=K[K.length-1].t,tt=clk()-rail.t0,r=railSample(Math.min(tt,end));
    cam.pos.set(r.p[0],r.p[1],r.p[2]);cam.look.set(r.l[0],r.l[1],r.l[2]);cam.fov=r.f;cam.roll=r.r;
    if(tt>=end){rail.on=false;tgt.pos.copy(cam.pos);tgt.look.copy(cam.look);tgt.fov=cam.fov;cam.lam=1.5;const cb=rail.done;rail.done=null;if(cb)cb()}
  }else{
    if(chase){tgt.pos.copy(chase.pos);tgt.look.copy(chase.look);tgt.fov=chase.fov;cam.lam=chase.lam}
    const k=1-Math.exp(-cam.lam*dt),age=chase?0:Math.min(clk()-drift.t0,7);
    _tp.copy(tgt.pos).addScaledVector(drift.v,age);
    cam.pos.lerp(_tp,k);cam.look.lerp(tgt.look,k);cam.fov+=(tgt.fov-cam.fov)*k;cam.roll+=(0-cam.roll)*k*.5;
  }
  const s=cam.shake,sw=clamp(cam.fov/50,.25,1.2);
  camera.position.set(cam.pos.x+Math.sin(t*.35)*.7*sw+rnd(-s,s),cam.pos.y+Math.cos(t*.27)*.45*sw+rnd(-s,s),cam.pos.z+rnd(-s,s));
  camera.lookAt(cam.look);camera.rotateZ(cam.roll);
  camera.fov=(cam.fov-cam.kick)*(camera.aspect<1?1.45:1);camera.updateProjectionMatrix();
  cam.shake*=Math.exp(-5*dt);cam.kick*=Math.exp(-6*dt);
}
function resize(){RC=root.getBoundingClientRect();renderer.setSize(VW(),VH(),false);if(composer)composer.setSize(VW(),VH());camera.aspect=VW()/VH();camera.updateProjectionMatrix()}
on(window,'resize',resize);resize();

/* ---------- Game state and HUD helpers ---------- */
const G={beat:0,stage:0,pct:0,input:false,react:0,awake:0,flare:0,snoreOn:false,phase:0,drumPunch:0};
const el={fill:$('#kk-fill'),pct:$('#kk-pct'),hint:$('#kk-hint'),toast:$('#kk-toast'),bn:$('#kk-banner'),rhythm:$('#kk-rhythm')};
function overall(){return G.stage>=4?100:clamp(((Math.max(G.stage,1)-1)+G.pct/100)/3*100,0,100)}
function hud(){const o=overall();el.fill.style.width=o+'%';el.pct.textContent=Math.round(o)+'%';
  [1,2,3].forEach(i=>{const p=$('#kk-p'+i);p.className=G.stage===i?'on':(G.stage>i?'done':'')})}
function hint(h){el.hint.innerHTML=h;el.hint.style.display=h?'':'none'}
function toast(t,col){el.toast.textContent=t;el.toast.style.textShadow=`0 0 22px ${col||'#ff6b2c'},0 2px 0 #000`;el.toast.classList.remove('pop');void el.toast.offsetWidth;el.toast.classList.add('pop')}
let bTimer;function banner(k,t,s,ms=3200){$('#kk-bk').textContent=k;$('#kk-bt').textContent=t;$('#kk-bs').textContent=s;el.bn.classList.add('show');clearTimeout(bTimer);bTimer=T_(()=>el.bn.classList.remove('show'),ms)}
function gain(v){G.pct=clamp(G.pct+v,0,100);hud();if(G.pct>=100&&G.input)completeStage()}

/* ---------- Stage 1: drums and conches ---------- */
const S1={on:false,k:0,next:0,rings:[],lead:2.4,combo:0,cuts:0};
const cuts1=[{p:[-24,9,62],l:[0,10,-4],f:56,d:[.5,.1,-.4]},{p:[-20,16,-12],l:[0,8.6,-24],f:44,d:[.3,0,-.2]},{p:[30,8,18],l:[0,9,0],f:52,d:[-.4,.2,.2]},{p:[8,48,30],l:[0,6,-6],f:48,d:[0,-.8,-.3]},{p:[0,6,58],l:[0,8,30],f:50,d:[.2,.3,-.8]}];
function startStage1(){
  G.stage=1;G.pct=0;hud();G.input=true;S1.on=true;S1.k=0;S1.cuts=0;S1.next=nowS()+2.4;
  cut(cuts1[0]);$('#kk-rhythm').hidden=false;
  banner('Stage I','Drums & Conches','Strike on the beat. Let the chamber shake.',3400);
  hint('Press <b>Space</b> (or click anywhere) when the white ring reaches the gold circle. There is plenty of time, and misses hardly matter.');
}
function spawnRing(){
  const T=S1.next,k=S1.k++,conch=k%4===3;
  const d=document.createElement('div');d.className='ring'+(conch?' conch':'');$('#kk-rhythm').appendChild(d);
  S1.rings.push({T,k,conch,d,done:false,tick:false});S1.next+=60/(44+G.pct*.08);
}
function strike(){
  if(!S1.on||!G.input)return;const n=nowS();
  const r=S1.rings.find(r=>!r.done&&Math.abs(n-r.T)<.5);
  const b=$('#kk-strike');b.animate([{transform:'scale(.9)'},{transform:'scale(1)'}],{duration:140});
  if(!r){SFX.drum(.35);return}
  const dt=Math.abs(n-r.T),perfect=dt<.22;r.done=true;r.d.style.transition='transform .25s,opacity .25s';r.d.style.transform='scale(1.9)';r.d.style.opacity=0;
  r.conch?SFX.conch():SFX.drum(perfect?1:.75);
  S1.combo++;G.drumPunch=1;G.react=Math.max(G.react,.5+(perfect?.4:0));
  cam.shake+=perfect?.34:.18;cam.kick+=perfect?2.4:1.2;
  toast(perfect?(r.conch?'CONCH! PERFECT':'PERFECT'):'GOOD',perfect?'#ffd98a':'#ff6b2c');
  for(const x of[-6,0,6])shock(x,9,44,r.conch?0xff7a2a:0xffd98a,1.5,r.conch?12:8,1.3,-52);
  if(r.conch){S1.cuts=(S1.cuts+1)%cuts1.length;cut(cuts1[S1.cuts])}
  const before=G.pct;gain((perfect?9:7)*(r.conch?1.5:1));
  if(before<50&&G.pct>=50){T_(()=>SFX.groan(.8),500);toast('HE STIRS...','#ff9a4a')}
}
function updateStage1(dt){
  if(!S1.on)return;const n=nowS();
  while(S1.next-S1.lead<=n&&G.input)spawnRing();
  for(let i=S1.rings.length-1;i>=0;i--){
    const r=S1.rings[i],p=(n-(r.T-S1.lead))/S1.lead;
    if(!r.tick&&n>=r.T){r.tick=true;G.beat=1;if(!r.done)SFX.drum(.22)}
    if(!r.done){
      r.d.style.opacity=clamp(p*4,0,1);r.d.style.transform=`scale(${lerp(3.3,1,clamp(p,0,1.1))})`;
      if(n>r.T+.55){r.done=true;r.d.remove();S1.rings.splice(i,1);if(G.input){S1.combo=0;G.pct=Math.max(0,G.pct-.4);hud()}}
    }else if(n>r.T+.9){r.d.remove();S1.rings.splice(i,1)}
  }
}

/* ---------- Stage 2: spears ---------- */
const S2={on:false,cool:0,fly:null,thrown:0,aim:{x:VW()/2,y:VH()*.45},ray:new THREE.Raycaster(),hold:0};
const BASE2=[[-26,10,50],[0,9,4],56,1.2];function base2(){shot(...BASE2);setDrift(.35,.05,-.25)}
const floorPlane=new THREE.Plane(new V3(0,1,0),0);
function startStage2(){
  G.stage=2;G.pct=0;hud();G.input=true;S2.on=true;$('#kk-rhythm').hidden=true;$('#kk-reticle').hidden=false;
  base2();spots.forEach(s=>s.s.material.opacity=.0);
  banner('Stage II','Spears of Lanka','Wound the sleeper where he is softest.',3400);
  hint('Move to aim, <b>click or tap</b> to hurl a spear. Glowing rings mark <b>tender spots</b> (soles, belly button, hand) that hurt most.');
}
function aimPoint(){return{x:S2.aim.x+Math.sin(nowS()*1.9)*7,y:S2.aim.y+Math.cos(nowS()*2.3)*6}}
function throwSpear(){
  if(!S2.on||!G.input||S2.cool>0||S2.fly)return;
  const a=aimPoint();S2.ray.setFromCamera(new THREE.Vector2(a.x/VW()*2-1,-(a.y/VH())*2+1),camera);
  const hits=S2.ray.intersectObjects(hitMeshes,false);let end=new V3(),obj=null,onBody=false;
  if(hits.length){end.copy(hits[0].point);obj=hits[0].object;onBody=true}
  else if(!S2.ray.ray.intersectPlane(floorPlane,end))end.copy(S2.ray.ray.at(110,end));
  const right=new V3().setFromMatrixColumn(camera.matrixWorld,0),fwd=new V3();camera.getWorldDirection(fwd);
  const start=camera.position.clone().addScaledVector(right,3.2).addScaledVector(fwd,5).add(new V3(0,-2.2,0));
  const g=new THREE.Group();mesh(CYL,M.skinDark,0,0,0,.14,8,.14,g);mesh(CONE,M.gold,0,4.3,0,.34,1.3,.34,g);mesh(SPH,M.ruby,0,-3.9,0,.3,.3,.3,g);g.userData.spear=true;scene.add(g);
  const dist=start.distanceTo(end);S2.fly={g,start,end,obj,onBody,u:0,dur:clamp(dist/62,.4,1.0),arc:dist*.1,last:start.clone(),dir:new V3()};
  S2.cool=.9;S2.thrown++;SFX.whoosh();
}
function landSpear(f){
  chase=null;const{g,end,obj,onBody}=f;g.position.copy(end).addScaledVector(f.dir,-3.3);g.quaternion.setFromUnitVectors(new V3(0,1,0),f.dir);
  if(onBody){let p=obj,par=giant;while(p){if(p===armL.g||p===armR.g||p===up){par=p;break}p=p.parent}par.attach(g);}
  else T_(()=>scene.remove(g),9000);
  S2.fly=null;S2.hold=.9;
  burst(end,onBody?26:12,onBody?0xff5a2a:0xcaa070,onBody?11:7);
  if(!onBody){SFX.miss();toast('MISSED','#b7a58c');base2();return}
  SFX.stab();cam.shake+=.75;cam.kick+=3;G.react=1;
  let spot=null;for(const s of spots){const w=s.s.getWorldPosition(new V3());if(w.distanceTo(end)<4.2&&nowS()>s.cd){spot=s;break}}
  if(spot){spot.cd=nowS()+4.5;toast('TENDER SPOT!','#ff2a4a');SFX.groan(.7);gain(15)}else{toast('HIT','#ff9a4a');gain(6)}
  chase={pos:end.clone().add(new V3(-9,4,12)),look:end.clone(),fov:46,lam:3.2};T_(()=>{chase=null;if(S2.on)base2()},650);
  if(G.pct>=50&&G.pct<62)T_(()=>SFX.groan(.9),400);
}
function updateStage2(dt,t){
  if(!S2.on)return;
  S2.cool=Math.max(0,S2.cool-dt);S2.hold=Math.max(0,S2.hold-dt);
  const a=aimPoint(),r=$('#kk-reticle');r.style.transform=`translate(${a.x}px,${a.y}px) rotate(${t*24%360}deg)`;r.style.opacity=S2.cool>0?.35:1;
  spots.forEach(s=>{const live=nowS()>s.cd;s.s.material.opacity=live&&G.input?.55+.4*Math.sin(t*5):.08;s.s.scale.setScalar(6.5+Math.sin(t*5)*.8)});
  const f=S2.fly;if(!f)return;
  f.u+=dt/f.dur;const u=Math.min(f.u,1);
  const p=f.start.clone().lerp(f.end,u);p.y+=f.arc*4*u*(1-u);f.g.position.copy(p);
  f.dir.copy(p).sub(f.last);if(f.dir.lengthSq()>1e-6){f.dir.normalize();f.g.quaternion.setFromUnitVectors(new V3(0,1,0),f.dir)}
  f.last.copy(p);
  chase={pos:p.clone().addScaledVector(f.dir,-9).add(new V3(0,2.5,0)),look:f.end.clone(),fov:44,lam:9};
  if(f.u>=1){f.dir.copy(f.end).sub(f.start).normalize();const tail=f.start.clone().lerp(f.end,.985);f.dir.copy(f.end).sub(tail).normalize();landSpear(f)}
}

/* ---------- Stage 3: the feast and its aroma ---------- */
const S3={macro:false,on:false,dishes:[],wind:0,ray:new THREE.Raycaster(),sniff:0,opened:0};
const NOSE=new V3();
const domeGeo=new THREE.SphereGeometry(3.2,32,16,0,Math.PI*2,0,Math.PI/2);
[[-9,-33,0xff9a4a,'boar'],[0,-39,0xfff0c0,'rice'],[9,-33,0xff4a6a,'wine']].forEach(([x,z,col,kind],i)=>{
  const g=new THREE.Group();g.position.set(x,3.6,z);g.visible=false;scene.add(g);
  mesh(CYL,M.stone,0,1,0,3.3,2,3.3,g);mesh(TOR(3.3,.22),M.gold,0,2,0,1,1,1,g).rotation.x=Math.PI/2;mesh(CYL,M.gold,0,2.2,0,2.9,.25,2.9,g);
  if(kind==='boar'){mesh(SPH,new THREE.MeshStandardMaterial({color:0x8a4a1c,roughness:.45,emissive:0x2a1004}),0,3.5,0,1.5,1.1,2.4,g);mesh(SPH,M.ruby,0,4.6,-1.6,.5,.5,.5,g)}
  if(kind==='rice'){mesh(CONE,M.bone,0,3.7,0,1.9,2.8,1.9,g);mesh(SPH,new THREE.MeshStandardMaterial({color:0xe8a020}),0,5.1,0,.7,.5,.7,g)}
  if(kind==='wine')[-1.2,0,1.2].forEach((dx,j)=>{mesh(CYL,new THREE.MeshStandardMaterial({color:0x5a0c1c,roughness:.3}),dx,3.2,j%2?.6:-.6,.62,1.9,.62,g);mesh(CYL,M.gold,dx,4.25,j%2?.6:-.6,.7,.2,.7,g)});
  const cover=mesh(domeGeo,M.gold,0,2.3,0,1,1,1,g);cover.userData.dish=i;
  const N=70,geo=new THREE.BufferGeometry(),pos=new Float32Array(N*3);geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({map:glowTex,color:col,size:2.6,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false}));pts.frustumCulled=false;pts.visible=false;scene.add(pts);
  const vel=[],life=[];for(let k=0;k<N;k++){vel.push(new V3());life.push(Math.random())}
  S3.dishes.push({g,cover,pts,pos,vel,life,N,open:false,lift:0,top:new V3(x,3.6+5.2,z),pop:0});
});
function startStage3(){
  G.stage=3;G.pct=0;hud();G.input=true;S3.on=true;S3.macro=false;S3.opened=0;
  S3.dishes.forEach(d=>{d.g.visible=true;d.g.scale.setScalar(.01);d.pop=0});
  $('#kk-fan').hidden=false;shot([21,19,-8],[-1,10,-31],52,1.1);
  banner('Stage III','The Royal Feast','Nothing wakes Kumbhakarna like the smell of food.',3400);
  hint('<b>Click the golden covers</b> to uncover each dish, then <b>drag quickly back and forth</b> to fan the aroma toward his nose.');
}
function respawn(d,i){d.pos[i*3]=d.top.x+rnd(-1.4,1.4);d.pos[i*3+1]=d.top.y+rnd(-.4,.4);d.pos[i*3+2]=d.top.z+rnd(-1.4,1.4);d.vel[i].set(rnd(-.4,.4),rnd(1.4,2.4),rnd(-.4,.4));d.life[i]=0}
function openDish(d){
  if(d.open)return;d.open=true;d.pts.visible=true;S3.opened++;SFX.chime();
  for(let i=0;i<d.N;i++){respawn(d,i);d.life[i]=Math.random()*.8}
  burst(d.top,14,0xffd98a,6);toast('UNCOVERED','#ffd98a');
  if(S3.opened===1)hint('Now <b>fan it</b>: drag quickly back and forth across the screen. Uncover more dishes for a stronger scent.');
}
function updateStage3(dt,t){
  if(!S3.on)return;
  hm.localToWorld(NOSE.set(0,-.8,5.4));
  S3.wind=Math.max(0,S3.wind-dt*1.1);S3.sniff-=dt;
  if(G.input){const want=G.flare>.45;if(want!==S3.macro){S3.macro=want;want?shot([7,20,-11],[0,14,-23.5],30,2.4):shot([21,19,-8],[-1,10,-31],52,1.2)}}
  for(const d of S3.dishes){
    d.pop=Math.min(1,d.pop+dt*1.6);d.g.scale.setScalar(Math.max(.01,ease(d.pop)));
    if(d.open){d.lift=Math.min(1,d.lift+dt*1.4);d.cover.position.y=2.3+d.lift*5;d.cover.rotation.z=d.lift*.9;d.cover.material=M.gold;if(d.lift>=1)d.cover.visible=false}
    if(!d.open)continue;
    for(let i=0;i<d.N;i++){
      const px=d.pos[i*3],py=d.pos[i*3+1],pz=d.pos[i*3+2],v=d.vel[i];
      const dx=NOSE.x-px,dy=NOSE.y-py,dz=NOSE.z-pz,dist=Math.hypot(dx,dy,dz)||1,pull=(1.4+S3.wind*16)/dist*dist*.35;
      v.x+=dx/dist*pull*dt;v.y+=dy/dist*pull*dt+.6*dt;v.z+=dz/dist*pull*dt;v.multiplyScalar(Math.exp(-.7*dt));
      d.pos[i*3]=px+v.x*dt+Math.sin(t*2+i)*.01;d.pos[i*3+1]=py+v.y*dt;d.pos[i*3+2]=pz+v.z*dt;
      d.life[i]+=dt*.12;
      if(dist<3.4&&G.input){gain(.75);G.flare=Math.min(1,G.flare+.12);if(S3.sniff<=0){S3.sniff=.8;SFX.sniff()}respawn(d,i)}
      else if(d.life[i]>1||py>40)respawn(d,i);
    }
    d.pts.geometry.attributes.position.needsUpdate=true;
  }
}

/* ---------- Stage transitions ---------- */
const tweens=[];
function tween(o,k,to,dur,delay=0,fn=ease){tweens.push({o,k,from:o[k],to,t:-delay,dur,fn})}
function tweensUpdate(dt){for(let i=tweens.length-1;i>=0;i--){const w=tweens[i];w.t+=dt;if(w.t<0)continue;const u=Math.min(1,w.t/w.dur);w.o[w.k]=lerp(w.from,w.to,w.fn(u));if(u>=1)tweens.splice(i,1)}}
function completeStage(){
  if(!G.input)return;G.input=false;const s=G.stage;SFX.chime();toast('STAGE CLEARED','#ffd98a');cam.kick+=3;hint('');
  if(s===1){S1.on=false;S1.rings.forEach(r=>r.d.remove());S1.rings=[];$('#kk-rhythm').hidden=true}
  if(s===2){S2.on=false;$('#kk-reticle').hidden=true;chase=null;spots.forEach(x=>x.s.material.opacity=0)}
  if(s===3){S3.on=false;$('#kk-fan').hidden=true}
  hud();
  T_(()=>{SFX.groan(1);shot([11,18,-8],[0,10,-24],38,1.4);G.react=1;cam.shake+=.5},500);
  T_(()=>{if(s===1)brief(2);else if(s===2)brief(3);else finale()},3400);
}

/* ---------- Stage briefings ---------- */
const ICON={
  1:'<ellipse cx="32" cy="22" rx="20" ry="8"/><path d="M12 22v20c0 4.5 9 8 20 8s20-3.5 20-8V22"/><path d="M20 30l4 14M32 32v16M44 30l-4 14"/>',
  2:'<path d="M10 54L50 14"/><path d="M50 14l-9 1 8 8z" fill="#ffd98a"/><path d="M14 44l6 6M20 38l6 6"/>',
  3:'<path d="M10 38h44c0 10-9 16-22 16S10 48 10 38z"/><path d="M16 30c0-8 7-12 16-12s16 4 16 12z"/><path d="M26 12c-3-3 3-5 0-9M36 12c-3-3 3-5 0-9"/>'
};
const BRIEFS={
  1:{n:'Stage I of III',h:'Drums & Conches',l:'Wake him with thunderous sound.',go:()=>startStage1(),cam:()=>cut(cuts1[0]),
     steps:['A <b>white ring</b> shrinks toward the <b>gold circle</b> at the bottom of the screen.','When it reaches the gold circle, <b>strike</b>. Press Space, click anywhere, or tap STRIKE. The timing is forgiving.','<b>Orange rings</b> are conch blasts and count extra.','Fill the <b>Slumber</b> bar at the top. Missing a beat costs almost nothing.'],
     keys:[['Space','strike'],['Click / Tap','strike']]},
  2:{n:'Stage II of III',h:'Spears of Lanka',l:'Wound the sleeper where he is softest.',go:()=>startStage2(),cam:()=>base2(),
     steps:['<b>Move</b> the mouse (or drag a finger) to aim the reticle. It drifts slightly, like a real throw.','<b>Click or tap</b> to hurl a spear. The camera rides along with it.','Hit the <b>glowing rings</b> on his soles, belly button and hand for big damage. Any hit helps.','Spears reload quickly. Keep throwing until he groans awake.'],
     keys:[['Move','aim'],['Click / Tap','throw']]},
  3:{n:'Stage III of III',h:'The Royal Feast',l:'Nothing wakes him like the smell of food.',go:()=>startStage3(),cam:()=>shot([21,19,-8],[-1,10,-31],52,1.1),
     steps:['<b>Click each golden cover</b> to uncover a dish.','<b>Drag quickly back and forth</b> to fan the aroma. The faster you fan, the stronger the wind.','Steer the scent into his <b>nose</b>. Each sniff stirs him. More open dishes means more scent.'],
     keys:[['Click','uncover'],['Drag','fan']]}
};
let briefOn=false;
function brief(n){
  const b=BRIEFS[n];briefOn=true;G.input=false;hint('');el.bn.classList.remove('show');b.cam();
  $('#kk-bsvg').innerHTML=ICON[n];$('#kk-bn').textContent=b.n;$('#kk-bh').textContent=b.h;$('#kk-bl').textContent=b.l;
  $('#kk-bsteps').innerHTML=b.steps.map(s=>'<li><span>'+s+'</span></li>').join('');
  $('#kk-bkeys').innerHTML=b.keys.map(k=>'<span><kbd>'+k[0]+'</kbd> '+k[1]+'</span>').join('');
  const box=$('#kk-brief');box.hidden=false;requestAnimationFrame(()=>box.classList.add('show'));
  $('#kk-bgo').onclick=()=>{if(!briefOn)return;briefOn=false;box.classList.remove('show');T_(()=>{box.hidden=true},700);SFX.chime();b.go()};
  T_(()=>$('#kk-bgo').focus({preventScroll:true}),50);
}

/* ---------- Finale: Kumbhakarna awakens ---------- */
const F={eye:0,jaw:0,awake:0,follow:false,ang:0,lookAt:new V3()};
function finale(){
  G.stage=4;hud();root.classList.add('cine');hint('');G.snoreOn=false;
  SFX.groan(1);
  playRail([
    {t:0,p:[26,26,40],l:[0,10,-6],f:46},
    {t:2.4,p:[2,24,-2],l:[0,12.4,-23],f:34},
    {t:4.0,p:[.4,17.4,-13.5],l:[0,12.6,-25.2],f:22},
    {t:5.0,p:[.2,17,-14.5],l:[0,12.5,-25.3],f:19}
  ]);
  tween(F,'eye',1,1.8,2.2);tween(eyeLight,'intensity',3.2*eyeLight.userData.k,1.8,2.2);
  T_(()=>{
    SFX.roar();$('#kk-flash').animate([{opacity:.9},{opacity:0}],{duration:900});cam.shake=2.6;
    tween(F,'jaw',1,.5);tween(F,'awake',1,3.8,.7);
    for(let i=0;i<4;i++)shock(0,12,-22,i%2?0xff7a2a:0xffd98a,2,36,2.4+i*.3,0);
    burst(hm.getWorldPosition(new V3()),60,0xffb060,28,2);flames.forEach(f=>f.boost=1);
    playRail([
      {t:0,p:[.2,17,-14.5],l:[0,12.5,-25.3],f:19},
      {t:.55,p:[2,20,12],l:[0,14,-14],f:40,r:.05},
      {t:1.6,p:[-22,10,36],l:[0,18,-8],f:50,r:.09},
      {t:3.4,p:[-30,7,50],l:[0,26,-4],f:56,r:.05},
      {t:5.4,p:[0,5,58],l:[0,31,-3],f:60,r:0},
      {t:7.0,p:[0,11,46],l:[0,35,-3],f:46,r:0}
    ]);
  },5200);
  T_(()=>{SFX.chime();$('#kk-end').hidden=false;requestAnimationFrame(()=>$('#kk-end').classList.add('show'))},12400);
}
function resetGame(){
  $('#kk-end').classList.remove('show');S1.on=S2.on=S3.on=false;T_(()=>{$('#kk-end').hidden=true},900);
  [up,giant].forEach(p=>{for(let i=p.children.length-1;i>=0;i--)if(p.children[i].userData.spear)p.remove(p.children[i])});
  tween(F,'awake',0,1.6);tween(F,'eye',0,.8);tween(F,'jaw',0,.4);tween(eyeLight,'intensity',0,.8);F.follow=false;
  S3.dishes.forEach(d=>{d.open=false;d.lift=0;d.cover.visible=true;d.cover.position.y=2.3;d.cover.rotation.z=0;d.g.visible=false;d.pts.visible=false});
  S3.macro=false;Object.assign(G,{stage:0,pct:0,input:false,flare:0,react:0});flames.forEach(f=>f.boost=0);hud();T_(startIntro,900);
}
let introOn=false;
function startIntro(){
  root.classList.add('cine');G.snoreOn=true;introOn=true;
  shot([62,50,96],[0,8,-6],44,1,true);
  playRail([
    {t:0,p:[62,50,96],l:[0,8,-6],f:44},
    {t:2.6,p:[40,26,74],l:[0,8,10],f:46},
    {t:5.2,p:[-20,9,56],l:[2,8,26],f:52},
    {t:7.8,p:[-27,13,14],l:[0,11,-8],f:50},
    {t:10.4,p:[-14,18,-6],l:[0,10,-24],f:42}
  ],()=>{if(!introOn)return;introOn=false;root.classList.remove('cine');brief(1)});
  banner('The Golden City','Lanka\'s Royal Chamber','War stands at the gates. The king calls for his brother.',3800);
  T_(()=>{if(introOn)banner('Kumbhakarna','The Sleeping Giant','Ravana\'s mighty younger brother. Nothing in Lanka has woken him.',3800)},6200);
}
function skipIntro(){introOn=false;rail.on=false;el.bn.classList.remove('show');root.classList.remove('cine');brief(1)}

/* ---------- Per-frame animation ---------- */
function animGiant(dt,t){
  const stir=Math.max(G.stage>=1?overall()/100:0,F.awake),f=lerp(.2,.42,stir)*(G.stage===4?1.6:1);
  const prev=G.phase;G.phase+=dt*f;
  if(G.snoreOn&&Math.floor(G.phase)>Math.floor(prev))SFX.snore(1-stir*.55);
  const br=Math.sin(G.phase*Math.PI*2);
  torsoGrp.scale.set(1+.012*br,1+.04*br,1);
  G.react*=Math.exp(-3.5*dt);G.flare*=Math.exp(-1.2*dt);G.drumPunch*=Math.exp(-9*dt);
  const r=G.react,aw=ease(F.awake);
  up.rotation.x=aw*1.3+Math.sin(t*38)*r*.006;up.position.y=PIV.y+Math.sin(t*30)*r*.12;
  head.rotation.x=aw*.25;head.rotation.z=(G.stage===3?Math.sin(t*1.6)*.1*stir:Math.sin(t*.9)*.03*stir)*(1-aw);head.rotation.y=Math.sin(t*1.2)*.08*stir*(1-aw);
  feet.forEach(ft=>{const s=ft.userData.s;ft.rotation.x=-r*.4*(s>0?1:.8)+Math.sin(t*2+s)*.04*stir;ft.rotation.z=-s*.2+Math.sin(t*3.3+s*2)*.06*stir});
  [armL,armR].forEach((a,i)=>{const s=i?1:-1;a.g.rotation.x=-aw*1.5+Math.sin(t*2.2+i)*.04*stir+r*.1;a.g.rotation.z=s*aw*.4+Math.sin(t*1.7)*.02*stir});
  rig.lids.forEach((l,i)=>{const flutter=Math.max(0,Math.sin(t*6.5+i*1.7))*.1*stir*stir*(1-F.eye);l.rotation.x=-(F.eye*1.25+flutter)});
  rig.iris.forEach(m=>{m.emissiveIntensity=F.eye*2.4});
  rig.glow.forEach(g=>{g.material.opacity=F.eye*.85;g.scale.setScalar(2.6+F.eye*3+Math.sin(t*9)*.15*F.eye)});
  rig.jaw.rotation.x=F.jaw*.62+(.05+.04*br)*(1-aw)*(1-stir*.5);
  rig.nostrils.forEach(n=>n.scale.set(.34*(1+G.flare*1.1),.2*(1+G.flare*1.4),.4*(1+G.flare*.8)));
  if(F.eye>0){hm.localToWorld(eyeLight.position.set(0,1,6))}
}
function fx(dt,t){dressUpdate(t);
  flames.forEach(o=>{const b=1+(o.boost||0)*1.2;const fl=.8+Math.sin(t*9+o.seed)*.14+Math.sin(t*23+o.seed*3)*.08;
    o.fl.forEach((c,k)=>{c.scale.y=(4.2+k)*fl*b;c.rotation.y+=dt*2});o.L.intensity=(1.4+Math.sin(t*11+o.seed)*.25)*b*o.L.userData.k});
  const p=embGeo.attributes.position.array;for(let i=0;i<EMB;i++){p[i*3+1]+=embVel[i]*dt;p[i*3]+=Math.sin(t+i)*.012;if(p[i*3+1]>70)p[i*3+1]=0}embGeo.attributes.position.needsUpdate=true;
  for(let i=shocks.length-1;i>=0;i--){const s=shocks[i];s.t+=dt;const u=s.t/s.dur;s.m.scale.setScalar(lerp(s.s0,s.s1,u));s.m.position.z=s.z0+s.dz*u;s.m.material.opacity=.9*(1-u);if(u>=1){scene.remove(s.m);shocks.splice(i,1)}}
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.t+=dt;s.s.position.addScaledVector(s.v,dt);s.v.y-=9*dt;s.s.material.opacity=1-s.t/s.life;if(s.t>=s.life){scene.remove(s.s);sparks.splice(i,1)}}
  troops.forEach((o,i)=>{if(o.drum){const q=1-G.drumPunch*.22;o.drum.scale.set(.9*q,.8,.9*q);o.g.position.y=G.drumPunch*.18*(i%2?1:.6)}});
}
let lastT=nowS(),T=0;
function frame(){
  if(!alive)return;raf=requestAnimationFrame(frame);const n=nowS(),dt=Math.min(n-lastT,.05);lastT=n;T+=dt;
  updateStage1(dt);updateStage2(dt,T);updateStage3(dt,T);animGiant(dt,T);fx(dt,T);crowdUpdate(T,dt);tweensUpdate(dt);
  if(F.follow){const a=-.6-F.ang*2.2,c=head.getWorldPosition(new V3());F.lookAt.lerp(c.add(new V3(0,-2,10)),.03);
    shot([Math.sin(a)*46,8+Math.sin(T*.3)*1.5,-10+Math.cos(a)*46],[F.lookAt.x,F.lookAt.y,F.lookAt.z],54,.8)}
  updateCam(dt,T);
  if(composer){gradePass.uniforms.time.value=T%10;composer.render()}else renderer.render(scene,camera);
}

/* ---------- Input and wiring ---------- */
on(window,'keydown',e=>{if(introOn&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();skipIntro();return}
  if(briefOn&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();$('#kk-bgo').click();return}
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)strike()}});
$('#kk-strike').addEventListener('pointerdown',e=>{e.stopPropagation();strike()});
let lp=null;
on(window,'pointermove',e=>{RC=root.getBoundingClientRect();
  S2.aim.x=(e.clientX-RC.left);S2.aim.y=(e.clientY-RC.top);
  if(S3.on){const f=$('#kk-fan');f.style.transform=`translate(${(e.clientX-RC.left)}px,${(e.clientY-RC.top)}px)`;
    if(lp&&G.input){const sp=Math.hypot((e.clientX-RC.left)-lp.x,(e.clientY-RC.top)-lp.y);S3.wind=Math.min(1.3,S3.wind+sp*.0045);$('#kk-blades').setAttribute('transform',`rotate(${(T*900)%360})`)}}
  lp={x:(e.clientX-RC.left),y:(e.clientY-RC.top)};
});
$('#kk-gl').addEventListener('pointerdown',e=>{RC=root.getBoundingClientRect();
  S2.aim.x=(e.clientX-RC.left);S2.aim.y=(e.clientY-RC.top);lp={x:(e.clientX-RC.left),y:(e.clientY-RC.top)};
  if(S1.on)strike();
  if(S2.on)throwSpear();
  if(S3.on&&G.input){S3.ray.setFromCamera(new THREE.Vector2((e.clientX-RC.left)/VW()*2-1,-((e.clientY-RC.top)/VH())*2+1),camera);
    const h=S3.ray.intersectObjects(S3.dishes.filter(d=>!d.open).map(d=>d.cover),false);if(h.length)openDish(S3.dishes[h[0].object.userData.dish])}
});
$('#kk-mute').addEventListener('click',()=>{$('#kk-mute').textContent=SFX.toggle()?'Sound off':'Sound on'});
$('#kk-begin').addEventListener('click',()=>{SFX.init();$('#kk-intro').classList.add('out');T_(()=>{$('#kk-intro').hidden=true},1200);startIntro()});
$('#kk-again').addEventListener('click',resetGame);
hud();hint('');root.classList.add('cine');
shot([70,48,95],[0,8,-10],46,1,true);G.snoreOn=false;
$('#kk-continue').addEventListener('click',()=>onComplete());
$('#kk-exit').addEventListener('click',()=>onExit());
frame();

  return function dispose() {
    alive = false;
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    disposers.forEach(f => { try { f(); } catch (e) {} });
    try { SFX.dispose(); } catch (e) {}
    try {
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        const m = o.material;
        if (m) (Array.isArray(m) ? m : [m]).forEach(mm => { ['map', 'bumpMap'].forEach(k => mm[k] && mm[k].dispose && mm[k].dispose()); mm.dispose(); });
      });
      if (composer && composer.dispose) composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    } catch (e) {}
    if (THREE.ColorManagement && prevCM !== undefined) THREE.ColorManagement.enabled = prevCM;
    root.innerHTML = '';
  };
}
