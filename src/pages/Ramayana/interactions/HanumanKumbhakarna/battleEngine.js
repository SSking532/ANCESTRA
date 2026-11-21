/* eslint-disable */
// Hanuman vs Kumbhakarna: cinematic battle engine (three.js, no React inside).
// createBattle(rootElement, options) -> { start, destroy }
import * as THREE from "three";

export function createBattle(root, opts = {}) {
const T = THREE;
const $ = (id) => root.querySelector("#" + id);
const AUDIO_HANUMAN = opts.hanumanSrc || "/audio/hanuman.mp3";
const AUDIO_ROAR = opts.roarSrc || "/audio/roar.mp3";
const AUDIO_CHALISA = opts.chalisaSrc || "/audio/hanuman_chalisa.mp3";
const DURATION = 90;
/* Look tuning. Modern three.js (r155+) uses physical light units and colour management,
   so lights are scaled up to keep the intended brightness. Tweak these three numbers if
   the scene looks too dark or too bright in your three.js version. */
const REV = parseInt(T.REVISION, 10) || 0;
const LK = REV >= 155 ? { dir: Math.PI * 1.7, point: 170, exposure: 1.25 } : { dir: 1, point: 1, exposure: 1.05 };
let alive = true;
const timers = [];
const later = (f, ms) => { timers.push(setTimeout(f, ms)); };

/* ---------- utils ---------- */
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const EASE={io:t=>t*t*(3-2*t),out:t=>1-Math.pow(1-t,3),in:t=>t*t*t,lin:t=>t,snap:t=>1-Math.pow(1-t,6),back:t=>{const c=1.4;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);}};
let _s=1337; const rnd=()=>{_s=(_s*16807)%2147483647;return (_s-1)/2147483646;};
const rr=(a,b)=>a+(b-a)*rnd();
const gauss=()=>(rnd()+rnd()+rnd()+rnd()-2)/2;

/* ---------- renderer / scene ---------- */
const canvas=document.createElement('canvas');canvas.id='gl';canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';root.insertBefore(canvas,root.firstChild);
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
if('outputColorSpace' in renderer)renderer.outputColorSpace=T.SRGBColorSpace;else renderer.outputEncoding=T.sRGBEncoding;
renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=LK.exposure;
const scene=new T.Scene();
const FOGC=0x7a4430;
scene.fog=new T.Fog(FOGC,260,1500);
const camera=new T.PerspectiveCamera(45,1,0.5,4000);
function resize(){const w=root.clientWidth||window.innerWidth,h=root.clientHeight||window.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize); resize();

/* ---------- lights ---------- */
const SUN=new T.Vector3(-0.32,0.17,-0.93).normalize();
scene.add(new T.HemisphereLight(0xffb98a,0x2a1a14,0.75*LK.dir));
const sun=new T.DirectionalLight(0xff9650,2.3*LK.dir);
sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
const sc=sun.shadow.camera; sc.left=-170;sc.right=170;sc.top=170;sc.bottom=-170;sc.near=10;sc.far=900;
sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.6;
scene.add(sun); scene.add(sun.target);
const fill=new T.DirectionalLight(0xffd2a8,0.55*LK.dir); fill.position.set(60,80,300); scene.add(fill);
const rim=new T.DirectionalLight(0x6a8cff,0.35*LK.dir); rim.position.set(200,120,-100); scene.add(rim);
const auraLight=new T.PointLight(0xffb030,0,160,1.6); scene.add(auraLight);
const flashLight=new T.PointLight(0xffd9a0,0,260,1.5); scene.add(flashLight);

/* ---------- sky ---------- */
const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{sunDir:{value:SUN},time:{value:0}},
vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
fragmentShader:`uniform vec3 sunDir;uniform float time;varying vec3 vD;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
void main(){
 vec3 d=normalize(vD);float y=max(d.y,0.0);
 vec3 hor=vec3(1.0,.45,.16),mid=vec3(.36,.12,.16),top=vec3(.03,.035,.1);
 vec3 c=mix(hor,mid,smoothstep(0.0,.3,y));c=mix(c,top,smoothstep(.2,.95,y));
 float sd=max(dot(d,normalize(sunDir)),0.0);
 c+=vec3(1.,.55,.2)*pow(sd,7.)*.7+vec3(1.,.85,.55)*pow(sd,220.)*3.0;
 vec2 uv=d.xz/(d.y+.28)*1.1+vec2(time*.004,0.);
 float cl=smoothstep(.42,.85,fbm(uv*1.7));
 vec3 cc=mix(vec3(.1,.04,.05),vec3(1.,.42,.16),pow(sd,2.)*.9+.12*(1.-y));
 c=mix(c,cc,cl*smoothstep(0.,.12,d.y)*.78);
 if(d.y<0.)c=hor*.55;
 gl_FragColor=vec4(c,1.);}`});
const sky=new T.Mesh(new T.SphereGeometry(2500,32,20),skyMat); scene.add(sky);

/* ---------- textures ---------- */
function setSRGB(t){if(T.SRGBColorSpace&&'colorSpace' in t)t.colorSpace=T.SRGBColorSpace;else if(T.sRGBEncoding)t.encoding=T.sRGBEncoding;}
function ctex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);setSRGB(t);t.wrapS=t.wrapT=T.RepeatWrapping;if(rep)t.repeat.set(rep,rep);t.anisotropy=4;return t;}
function noiseFill(g,w,h,base,spots,count,rmin,rmax,alpha){g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<count;i++){g.fillStyle=spots[(rnd()*spots.length)|0];g.globalAlpha=alpha*rr(.3,1);g.beginPath();g.arc(rnd()*w,rnd()*h,rr(rmin,rmax),0,6.283);g.fill();}g.globalAlpha=1;}
const groundTex=ctex(1024,1024,(g,w,h)=>{
  noiseFill(g,w,h,'#4a3426',['#2c1d14','#6b4a33','#3a261a','#7a5a40','#1a110c'],1800,3,46,.16);
  g.strokeStyle='rgba(15,8,5,.55)';g.lineWidth=2;for(let i=0;i<70;i++){let x=rnd()*w,y=rnd()*h;g.beginPath();g.moveTo(x,y);for(let k=0;k<7;k++){x+=rr(-40,40);y+=rr(-40,40);g.lineTo(x,y);}g.stroke();}
  for(let i=0;i<40;i++){g.fillStyle='rgba(90,10,8,.25)';g.beginPath();g.ellipse(rnd()*w,rnd()*h,rr(6,30),rr(4,18),rnd()*3,0,6.283);g.fill();}
},70);
const furTex=(base,lite,dark,sd)=>ctex(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<2600;i++){g.strokeStyle=rnd()<.5?lite:dark;g.globalAlpha=rr(.15,.5);g.lineWidth=rr(.6,1.6);const x=rnd()*w,y=rnd()*h,l=rr(4,14);g.beginPath();g.moveTo(x,y);g.lineTo(x+rr(-2,2),y+l);g.stroke();}g.globalAlpha=1;},sd||3);
const skinTex=ctex(256,256,(g,w,h)=>{noiseFill(g,w,h,'#5a6270',['#434a58','#6c7686','#3a3036','#7d6a62'],900,2,16,.2);g.strokeStyle='rgba(30,20,30,.4)';for(let i=0;i<30;i++){g.beginPath();let x=rnd()*w,y=rnd()*h;g.moveTo(x,y);for(let k=0;k<5;k++){x+=rr(-12,12);y+=rr(-12,12);g.lineTo(x,y);}g.stroke();}},3);
const glowTex=ctex(128,128,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
const crackTex=ctex(512,512,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(8,4,2,.95)';g.lineCap='round';for(let i=0;i<22;i++){let a=rnd()*6.283,x=w/2,y=h/2,wd=rr(3,8);for(let k=0;k<9;k++){const nx=x+Math.cos(a)*rr(14,32),ny=y+Math.sin(a)*rr(14,32);g.lineWidth=wd*(1-k/10);g.beginPath();g.moveTo(x,y);g.lineTo(nx,ny);g.stroke();x=nx;y=ny;a+=rr(-.5,.5);}}const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(0,0,0,.55)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});

/* ---------- terrain ---------- */
function hgt(x,z){const f=sstep(120,280,Math.abs(z));const n=Math.sin(x*.011+1.3)*Math.cos(z*.013)*7+Math.sin(x*.037+z*.029)*2.4+Math.sin(x*.09)*Math.sin(z*.083);return n*f;}
{
  const g=new T.PlaneGeometry(3600,3000,180,150); g.rotateX(-Math.PI/2);
  const p=g.attributes.position,col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const y=hgt(x,z);p.setY(i,y);const v=.72+.28*Math.sin(x*.05)*Math.cos(z*.04)+rr(-.06,.06);const burn=sstep(-.3,.3,Math.sin(x*.021+z*.017));col[i*3]=v*(.95+.1*burn);col[i*3+1]=v*(.85+.1*burn);col[i*3+2]=v*.78;}
  g.setAttribute('color',new T.BufferAttribute(col,3)); g.computeVertexNormals();
  const m=new T.Mesh(g,new T.MeshStandardMaterial({map:groundTex,vertexColors:true,roughness:1,metalness:0}));
  m.receiveShadow=true; scene.add(m);
}

/* ---------- distant Lanka, mountains, fires ---------- */
const flames=[];
function addCity(){
  const gold=new T.MeshStandardMaterial({color:0x6a4a1a,roughness:.55,metalness:.7,emissive:0x40200a,emissiveIntensity:.8});
  const dark=new T.MeshStandardMaterial({color:0x2a1c18,roughness:1,emissive:0x1a0c08,emissiveIntensity:.6});
  const N=150,tw=new T.InstancedMesh(new T.BoxGeometry(1,1,1),dark,N),sp=new T.InstancedMesh(new T.ConeGeometry(1,1,6),gold,N),dm=new T.InstancedMesh(new T.SphereGeometry(1,12,8,0,6.283,0,1.57),gold,50);
  const d=new T.Object3D();
  for(let i=0;i<N;i++){const x=rr(-900,900),z=rr(-760,-520),w=rr(14,40),h=rr(40,170);d.position.set(x,h/2-2,z);d.rotation.set(0,rnd()*3,0);d.scale.set(w,h,w);d.updateMatrix();tw.setMatrixAt(i,d.matrix);d.position.set(x,h+w*.9,z);d.scale.set(w*.6,w*1.8,w*.6);d.updateMatrix();sp.setMatrixAt(i,d.matrix);}
  for(let i=0;i<50;i++){const x=rr(-900,900),z=rr(-760,-520),r=rr(10,26);d.position.set(x,rr(30,70),z);d.rotation.set(0,0,0);d.scale.set(r,r,r);d.updateMatrix();dm.setMatrixAt(i,d.matrix);}
  scene.add(tw,sp,dm);
  const mt=new T.InstancedMesh(new T.ConeGeometry(1,1,7),new T.MeshStandardMaterial({color:0x2d1f24,roughness:1,flatShading:true}),26);
  for(let i=0;i<26;i++){const x=-1500+i*115+rr(-30,30),w=rr(160,320),h=rr(140,360);d.position.set(x,h/2-10,-1100);d.rotation.set(0,rnd()*3,0);d.scale.set(w,h,w*.7);d.updateMatrix();mt.setMatrixAt(i,d.matrix);}
  scene.add(mt);
}
addCity();

/* ---------- two armies: standing, skirmishing and fallen ---------- */
const ms=o=>new T.MeshStandardMaterial(o);
const furV=furTex('#a35a26','#d99a55','#5a2a10',2);
const ARMY=[
  {name:'vanara',skin:ms({color:0xffffff,map:furV,bumpMap:furV,bumpScale:.6,roughness:.95}),armor:ms({color:0x6a4426,roughness:.8,metalness:.2}),cloth:ms({color:0xff8a1a,roughness:.9,emissive:0x401400}),sc:1},
  {name:'rakshasa',skin:ms({color:0x3c4256,roughness:.85}),armor:ms({color:0x1c1c24,roughness:.45,metalness:.75}),cloth:ms({color:0x8a0c14,roughness:.9,emissive:0x2a0004}),sc:1.3}
];
const matSteel=ms({color:0xc8c4bc,roughness:.3,metalness:.9});
const part=(g,y)=>{g.translate(0,y,0);return g;};
const G_TORSO=part(new T.CylinderGeometry(.27,.33,.72,8),.36),G_HEAD=part(new T.SphereGeometry(.2,8,6),0),G_ARM=part(new T.CylinderGeometry(.07,.06,.62,6),-.31),G_LEG=part(new T.CylinderGeometry(.11,.08,.85,6),-.42),G_HORN=part(new T.ConeGeometry(.05,.3,5),.15);
const G_SWORD=part(new T.BoxGeometry(.06,1.3,.02),.65),G_SPEAR=part(new T.CylinderGeometry(.025,.025,3.2,4),1.3),G_SHIELD=new T.CylinderGeometry(.5,.5,.06,10);
const boneM=ms({color:0xe8dcc0,roughness:.6});
function mkSet(a,n,withHorn){const A=ARMY[a],mk=(g,m,k)=>{const im=new T.InstancedMesh(g,m,n*(k||1));im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;im.count=0;scene.add(im);return im;};
  return{torso:mk(G_TORSO,A.skin),head:mk(G_HEAD,A.skin),arm:mk(G_ARM,A.skin,2),leg:mk(G_LEG,A.skin,2),armor:mk(part(new T.CylinderGeometry(.3,.35,.5,8),.5),A.armor),helm:mk(part(new T.SphereGeometry(.22,8,5,0,6.283,0,1.6),0),A.armor),weap:mk(a?G_SWORD:G_SPEAR,matSteel),shield:mk(G_SHIELD,A.cloth),horn:withHorn?mk(G_HORN,boneM,2):null,cloth:mk(part(new T.CylinderGeometry(.26,.4,.35,8,1,true),.0),A.cloth)};}
const SETS=[mkSet(0,3200,false),mkSet(1,3200,true)];
const _gm=new T.Matrix4(),_lm=new T.Matrix4(),_q=new T.Quaternion(),_e=new T.Euler(),_p=new T.Vector3(),_sv=new T.Vector3(),_o=new T.Matrix4();
/* places one soldier; keeps instance bookkeeping in the caller via idx object */
function soldier(a,x,y,z,yaw,fall,seed,out){
  const A=ARMY[a],S=SETS[a],sc=A.sc*(.9+(seed%7)*.03);
  _e.set(fall*1.5*((seed&1)?1:-1),yaw,fall*(((seed>>1)&1)?.25:-.25),'YXZ');_q.setFromEuler(_e);_p.set(x,y+fall*.28*sc,z);_sv.set(sc,sc,sc);_gm.compose(_p,_q,_sv);
  const r=k=>((Math.sin(seed*12.9898+k*78.233)*43758.5453)%1+1)%1;
  const idx=out;
  const set=(im,lx,ly,lz,rx,ry,rz,k)=>{if(idx.i<0||!idx.arr)return;_e.set(rx,ry,rz,'XYZ');_q.setFromEuler(_e);_p.set(lx,ly,lz);_sv.set(k||1,k||1,k||1);_lm.compose(_p,_q,_sv);_o.multiplyMatrices(_gm,_lm);im.setMatrixAt(idx.n[im.uuid],_o);idx.n[im.uuid]++;};
  // limbs: standing = relaxed; fallen = flung
  const sp=fall>.5?1:0.12;
  set(S.torso,0,0,0,0,0,0);set(S.head,0,.9,0,0,0,0);
  set(S.leg,-.14,.02,0,(r(1)-.5)*1.6*(fall>.5?1:.3),0,(r(2)-.2)*.5*sp*2);set(S.leg,.14,.02,0,(r(3)-.5)*1.6*(fall>.5?1:.3),0,-(r(4)-.2)*.5*sp*2);
  set(S.arm,-.34,.66,0,(r(5)-.5)*(fall>.5?3:.4),0,(.2+r(6)*(fall>.5?1.6:.3)));
  const wa=fall>.5?(r(7)*3-1.5):(-1.2-r(7)*.4);
  set(S.arm,.34,.66,0,wa,0,-(.2+r(8)*(fall>.5?1.6:.3)));
  set(S.armor,0,.05,0,0,0,0);
  if(r(9)>.35)set(S.helm,0,.92,0,0,0,0);
  set(S.cloth,0,.02,0,0,0,0);
  if(a&&r(10)>.3){set(S.horn,-.12,1.05,0,0,0,.5);set(S.horn,.12,1.05,0,0,0,-.5);}
  if(r(11)>.25)set(S.weap,.45,.55,.05,fall>.5?(r(12)*3):-0.35,0,-.1,1.1);
  if(r(13)>.6)set(S.shield,-.5,.6,.15,1.3,0,.2,1);
}
function newOut(a){const n={};for(const k in SETS[a])if(SETS[a][k])n[SETS[a][k].uuid]=0;return{arr:true,n,a};}
const OUT=[newOut(0),newOut(1)];
const standing=[],banners=[];
function buildArmy(){
  // fallen: heaps and scatter, thickest near the fighting corridor
  const heaps=[];for(let c=0;c<170;c++)heaps.push([rr(-560,560),rr(-190,200),rr(9,30),(rnd()<.5)]);
  let seed=1;
  for(const h of heaps){const n=(h[2]*1.4)|0;for(let i=0;i<n;i++){
    const x=h[0]+gauss()*h[2],z=h[1]+gauss()*h[2];if(Math.abs(z)<4&&rnd()<.5)continue;
    const mixed=rnd()<.3;const a=mixed?(rnd()<.5?0:1):(x>0?(rnd()<.8?1:0):(rnd()<.8?0:1));
    if(OUT[a].n[SETS[a].torso.uuid]>=2300)continue;
    soldier(a,x,hgt(x,z)+rr(0,.5)*(rnd()<.3?1:0),z,rnd()*6.28,1,seed++,OUT[a]);}}
  // standing lines: vanaras left, rakshasas right, skirmish where they meet
  const NS=[420,420];
  for(let a=0;a<2;a++){for(let i=0;i<NS[a];i++){
    let x,z,yaw;const sk=i<120;
    if(sk){x=rr(-250,250);z=(rnd()<.5?-1:1)*rr(18,130);yaw=a?(-Math.PI/2+rr(-.3,.3)):(Math.PI/2+rr(-.3,.3));x+=a?10:-10;}
    else{const row=((i-120)/20)|0,k=(i-120)%20;x=a?(120+row*10):(-120-row*10);x+=rr(-2,2);z=(k-10)*9+rr(-2,2);if(Math.abs(z)<10)z+=z<0?-12:12;yaw=a?-Math.PI/2:Math.PI/2;}
    const sd=seed++,idx0=Object.assign({},OUT[a].n);soldier(a,x,hgt(x,z),z,yaw,0,sd,OUT[a]);
    standing.push({a,x,z,px:x,pz:z,fall:0,vx:0,vz:0,yaw,y:hgt(x,z),seed:sd,idx:idx0,dirty:false});}}
  for(let a=0;a<2;a++){for(const k in SETS[a])if(SETS[a][k]){SETS[a][k].count=OUT[a].n[SETS[a][k].uuid];SETS[a][k].instanceMatrix.needsUpdate=true;}}
  FALLEN_COUNT=[SETS[0].torso.count,SETS[1].torso.count];
  // scattered weapons, arrows, shields, rubble, blood and scorch
  const dm=new T.Object3D();
  const sw=new T.InstancedMesh(G_SWORD,matSteel,500),ar=new T.InstancedMesh(part(new T.CylinderGeometry(.015,.015,1.6,3),.8),ms({color:0x5a4030}),900),sh=new T.InstancedMesh(G_SHIELD,ms({color:0x7a4a22,metalness:.4,roughness:.6}),240);
  for(let i=0;i<500;i++){const x=rr(-540,540),z=rr(-190,200);dm.position.set(x,hgt(x,z)+.1,z);dm.rotation.set(Math.PI/2+rr(-.2,.2),rnd()*6,0);dm.scale.setScalar(rr(.8,1.6));dm.updateMatrix();sw.setMatrixAt(i,dm.matrix);}
  for(let i=0;i<900;i++){const x=rr(-540,540),z=rr(-190,200);dm.position.set(x,hgt(x,z),z);dm.rotation.set(rr(-.9,.9),rnd()*6,rr(-.9,.9));dm.scale.setScalar(rr(.9,1.8));dm.updateMatrix();ar.setMatrixAt(i,dm.matrix);}
  for(let i=0;i<240;i++){const x=rr(-540,540),z=rr(-190,200);dm.position.set(x,hgt(x,z)+.15,z);dm.rotation.set(rr(-.3,.3),rnd()*6,rr(-.3,.3));dm.scale.setScalar(rr(.8,1.8));dm.updateMatrix();sh.setMatrixAt(i,dm.matrix);}
  for(const m of [sw,ar,sh]){m.castShadow=true;m.frustumCulled=false;scene.add(m);}
  const blood=new T.InstancedMesh(new T.CircleGeometry(1,14),ms({color:0x3c0707,roughness:.2,metalness:.1,polygonOffset:true,polygonOffsetFactor:-1}),380);
  for(let i=0;i<380;i++){const x=rr(-540,540),z=rr(-190,200),s=rr(1,6);dm.position.set(x,hgt(x,z)+.06,z);dm.rotation.set(-Math.PI/2,0,rnd()*6);dm.scale.set(s,s*rr(.5,1),1);dm.updateMatrix();blood.setMatrixAt(i,dm.matrix);}
  blood.receiveShadow=true;blood.frustumCulled=false;scene.add(blood);
  const scorch=new T.InstancedMesh(new T.CircleGeometry(1,16),new T.MeshBasicMaterial({color:0x0c0705,transparent:true,opacity:.6,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),60);
  for(let i=0;i<60;i++){const x=rr(-540,540),z=rr(-190,200),s=rr(6,26);dm.position.set(x,hgt(x,z)+.05,z);dm.rotation.set(-Math.PI/2,0,0);dm.scale.set(s,s*rr(.6,1),1);dm.updateMatrix();scorch.setMatrixAt(i,dm.matrix);}
  scorch.frustumCulled=false;scene.add(scorch);
  const rb=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),ms({color:0x4a3c36,roughness:1,flatShading:true}),300);
  for(let i=0;i<300;i++){const x=rr(-560,560),z=rr(-200,210);if(Math.abs(z)<9)continue;const s=rr(.8,5);dm.position.set(x,hgt(x,z)+s*.3,z);dm.rotation.set(rnd()*3,rnd()*3,rnd()*3);dm.scale.set(s,s*rr(.6,1),s);dm.updateMatrix();rb.setMatrixAt(i,dm.matrix);}
  rb.castShadow=true;rb.receiveShadow=true;rb.frustumCulled=false;scene.add(rb);
  // banners: saffron vanara, crimson rakshasa
  const poleM=ms({color:0x2a1a10});
  for(let i=0;i<60;i++){const x=rr(-480,480),z=(rnd()<.5?-1:1)*rr(14,170),h=rr(8,15),g=new T.Group(),rak=x>0;const p=new T.Mesh(new T.CylinderGeometry(.18,.22,h,6),poleM);p.position.y=h/2;p.castShadow=true;const c=new T.Mesh(new T.PlaneGeometry(4.5,2.8,5,2),ARMY[rak?1:0].cloth);c.material.side=T.DoubleSide;c.position.set(2.3,h-1.6,0);c.castShadow=true;g.add(p,c);g.position.set(x,hgt(x,z),z);g.rotation.set(rr(-.2,.2),rnd()*6,rr(-.3,.3));scene.add(g);banners.push(c);}
  // wrecked chariots, fallen elephants, siege towers
  const wood=ms({color:0x4a2e1a,roughness:1}),ele=ms({color:0x5b5650,roughness:.95}),ember=ms({color:0x1a0f0a,emissive:0xff4a00,emissiveIntensity:.5,roughness:1});
  for(let i=0;i<20;i++){const x=rr(-440,440),z=(rnd()<.5?-1:1)*rr(16,150),g=new T.Group();const b=new T.Mesh(new T.BoxGeometry(4,.5,2.6),rnd()<.3?ember:wood);b.position.y=1.2;const w1=new T.Mesh(new T.CylinderGeometry(1.3,1.3,.3,12),wood);w1.rotation.x=Math.PI/2;w1.position.set(0,1.3,1.5);const w2=w1.clone();w2.position.z=-1.5;w2.rotation.z=rr(.2,1);const pl=new T.Mesh(new T.CylinderGeometry(.12,.12,5,5),wood);pl.rotation.z=1.2;pl.position.set(-4,1,0);[b,w1,w2,pl].forEach(m=>{m.castShadow=m.receiveShadow=true;g.add(m);});g.position.set(x,hgt(x,z),z);g.rotation.set(rr(-.3,.3),rnd()*6,rr(-.3,.3));scene.add(g);}
  for(let i=0;i<14;i++){const x=rr(-400,400),z=(rnd()<.5?-1:1)*rr(22,150),g=new T.Group();const b=new T.Mesh(new T.SphereGeometry(1,12,10),ele);b.scale.set(4.2,3,2.8);b.position.y=2.6;const h=new T.Mesh(new T.SphereGeometry(1,10,8),ele);h.scale.set(1.6,1.5,1.4);h.position.set(4.6,2.2,0);const tr=new T.Mesh(new T.CylinderGeometry(.5,.25,3.5,8),ele);tr.rotation.z=1.9;tr.position.set(6.3,.9,0);[b,h,tr].forEach(m=>{m.castShadow=m.receiveShadow=true;g.add(m);});for(let k=0;k<4;k++){const l=new T.Mesh(new T.CylinderGeometry(.55,.45,3.2,7),ele);l.position.set(k<2?2.2:-2.2,2.6,k%2?1.9:-1.9);l.rotation.set(rr(-.5,.5),0,rr(-.6,.6));l.castShadow=true;g.add(l);}g.position.set(x,hgt(x,z),z);g.rotation.set(0,rnd()*6,rr(-.25,.25));scene.add(g);}
  for(let i=0;i<7;i++){const x=rr(-400,400),z=(rnd()<.5?-1:1)*rr(40,150),g=new T.Group();for(const sx of [-3,3])for(const sz of [-3,3]){const p=new T.Mesh(new T.BoxGeometry(.7,16,.7),wood);p.position.set(sx,8,sz);p.castShadow=true;g.add(p);}for(let k=0;k<4;k++){const b=new T.Mesh(new T.BoxGeometry(7,.5,.5),wood);b.position.set(0,3+k*4,3);b.rotation.z=rr(-.3,.3);g.add(b);}g.position.set(x,hgt(x,z),z);g.rotation.set(rr(-.12,.12),rnd()*6,rr(-.25,.25));scene.add(g);fireSpots.push([x,hgt(x,z)+14,z]);}
}
let FALLEN_COUNT=[0,0];
const fireSpots=[];
buildArmy();

/* fires & smoke */
const flameMat=()=>new T.SpriteMaterial({map:glowTex,color:0xff7a1a,blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:true});
const fireSites=[];
for(let i=0;i<34;i++){const x=rr(-520,520),z=(rnd()<.7?-1:1)*rr(22,200);fireSpots.push([x,hgt(x,z)+1,z]);}
for(const fs of fireSpots){const s=new T.Group();s.position.set(fs[0],fs[1],fs[2]);const fl=[];for(let k=0;k<3;k++){const sp=new T.Sprite(flameMat());sp.userData={s:rr(8,18),o:rnd()*9};s.add(sp);fl.push(sp);flames.push(sp);}scene.add(s);fireSites.push({g:s,fl,t:rnd()*3});}
const fireLights=[];for(let i=0;i<4;i++){const l=new T.PointLight(0xff7a2a,1.6,130,1.5);scene.add(l);fireLights.push(l);}
for(let i=0;i<16;i++){const x=-950+i*125,z=rr(-720,-540);const s=new T.Group();s.position.set(x,rr(10,60),z);const sp=new T.Sprite(flameMat());sp.userData={s:rr(60,140),o:rnd()*9};s.add(sp);scene.add(s);flames.push(sp);
  const sm=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0x1a1110,transparent:true,opacity:.55,depthWrite:false,fog:false}));sm.position.set(x,rr(120,260),z-30);sm.scale.set(rr(180,320),rr(220,420),1);scene.add(sm);}
/* ground haze, sun glare, vultures, footprints */
const haze=[];for(let i=0;i<46;i++){const sp=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0x8a5438,transparent:true,opacity:.16,depthWrite:false,fog:true}));const s=rr(90,200);sp.scale.set(s,s*.28,1);sp.position.set(rr(-500,500),rr(6,16),rr(-180,200));sp.userData={vx:rr(1,3)};scene.add(sp);haze.push(sp);}
const glare=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0xffb060,blending:T.AdditiveBlending,transparent:true,opacity:.75,depthWrite:false,fog:false}));glare.position.copy(SUN).multiplyScalar(2100);glare.scale.setScalar(1100);scene.add(glare);
const birds=[];{const bm=ms({color:0x0d0a0a,side:T.DoubleSide,roughness:1});for(let i=0;i<34;i++){const g=new T.Group(),w1=new T.Mesh(new T.PlaneGeometry(5,1.6),bm),w2=new T.Mesh(new T.PlaneGeometry(5,1.6),bm);w1.position.x=-2.5;w2.position.x=2.5;const j1=new T.Group(),j2=new T.Group();j1.add(w1);j2.add(w2);g.add(j1,j2);g.userData={j1,j2,r:rr(60,260),h:rr(70,170),a:rnd()*6.28,sp:rr(.08,.2)*(rnd()<.5?-1:1),cx:rr(-200,200),ph:rnd()*6};scene.add(g);birds.push(g);}}
const printTex=glowTex,prints=[];for(let i=0;i<44;i++){const m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:printTex,color:0x000000,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);prints.push(m);}
let pri=0;function printFX(x,z,size){const m=prints[pri=(pri+1)%44];m.position.set(x,.4,z);m.scale.set(size*1.2,size*2,1);m.rotation.z=rnd()*6;m.material.opacity=.7;m.visible=true;}

/* ================= CHARACTERS ================= */
const SPH=new T.SphereGeometry(1,28,20),CONE=new T.ConeGeometry(1,1,10),TOR=new T.TorusGeometry(1,.2,10,32);
const cyl=(rt,rb,l,s)=>new T.CylinderGeometry(rt,rb,l,s||16,1);
function M(g,m,x,y,z,sx,sy,sz){const o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);o.scale.set(sx==null?1:sx,sy==null?(sx==null?1:sx):sy,sz==null?(sx==null?1:sx):sz);o.castShadow=true;o.receiveShadow=true;return o;}
const std=(o)=>new T.MeshStandardMaterial(o);
const furH=furTex('#e0852c','#ffc070','#7a300a',3);
const matFurH=std({color:0xffffff,map:furH,bumpMap:furH,bumpScale:1.6,roughness:.9,emissive:0xff6a00,emissiveIntensity:0});
const furTuftH=std({color:0xf09a3a,roughness:.9,emissive:0xff6a00,emissiveIntensity:0});
const matFaceH=std({color:0xd98a58,roughness:.75});
const matFaceHd=std({color:0x8a4a30,roughness:.8});
const matGold=std({color:0xf6c04a,metalness:.95,roughness:.22,emissive:0x5a3500,emissiveIntensity:.5});
const matGoldK=std({color:0xc89030,metalness:.92,roughness:.3,emissive:0x2a1400,emissiveIntensity:.4});
const matRed=std({color:0xb3121b,roughness:.85,side:T.DoubleSide});
const matRedK=std({color:0x7a0c12,roughness:.9,side:T.DoubleSide});
const matBlackK=std({color:0x15100f,roughness:.8,side:T.DoubleSide});
const skinTexK=ctex(256,256,(g,w,h)=>{noiseFill(g,w,h,'#5b6372',['#454c5c','#6e7889','#3c3238','#826c62'],1100,2,18,.2);g.strokeStyle='rgba(120,30,40,.35)';g.lineWidth=1.2;for(let i=0;i<46;i++){g.beginPath();let x=rnd()*w,y=rnd()*h;g.moveTo(x,y);for(let k=0;k<6;k++){x+=rr(-14,14);y+=rr(-14,14);g.lineTo(x,y);}g.stroke();}g.strokeStyle='rgba(20,12,18,.5)';for(let i=0;i<10;i++){g.beginPath();g.moveTo(rnd()*w,rnd()*h);g.lineTo(rnd()*w,rnd()*h);g.stroke();}},3);
const matSkinK=std({color:0xffffff,map:skinTexK,bumpMap:skinTexK,bumpScale:1.4,roughness:.82});
const matIron=std({color:0x2c2c33,metalness:.88,roughness:.34,emissive:0x200000,emissiveIntensity:.3});
const matBone=std({color:0xe8dcc0,roughness:.55});
const matWhite=std({color:0xfff4dc,roughness:.35});
const matHairK=std({color:0x120c0c,roughness:.9});
const matMouth=std({color:0x2a0608,roughness:.6});
const matGem=std({color:0xff2a2a,emissive:0xaa0000,emissiveIntensity:.9,roughness:.2,metalness:.3});

const JN=['hips','spine','chest','head','shA','elA','shB','elB','lgL','knL','lgR','knR'];
function P(o){const p={};for(const k of JN)p[k]=[0,0,0];p.bob=[0];p.tilt=[0];p.wp=[0];for(const k in o){const v=o[k].slice();while(JN.indexOf(k)>=0&&v.length<3)v.push(0);p[k]=v;}return p;}
const withT=(p,t)=>Object.assign({},p,{tilt:[t]});

/* instanced fur / hair tufts grown on an ellipsoid: c=centre, r=radii (joint-local) */
const G_FUR=(()=>{const g=new T.ConeGeometry(1,1,4);g.translate(0,.5,0);return g;})(),_up=new T.Vector3(0,1,0),_dd=new T.Vector3(),_dmm=new T.Object3D();
function furOn(parent,mat,c,r,n,len,w,grav,front){
  const im=new T.InstancedMesh(G_FUR,mat,n);
  for(let i=0;i<n;i++){const a=rnd()*6.283,b=Math.acos(rnd()*2-1);let ux=Math.sin(b)*Math.cos(a),uy=Math.cos(b),uz=Math.sin(b)*Math.sin(a);
    if(front===1&&uz<-.3)uz=-uz;if(front===-1&&uz>.3)uz=-uz;
    _dmm.position.set(c[0]+ux*r[0],c[1]+uy*r[1],c[2]+uz*r[2]);_dd.set(ux,uy+grav,uz).normalize();_dmm.quaternion.setFromUnitVectors(_up,_dd);
    const l=len*rr(.6,1.4);_dmm.scale.set(w*rr(.7,1.2),l,w*rr(.7,1.2));_dmm.updateMatrix();im.setMatrixAt(i,_dmm.matrix);}
  im.frustumCulled=false;im.castShadow=true;parent.add(im);return im;
}
function ring(g,mat,y,r,t,rx){const m=M(TOR,mat,0,y,0,r,r,r*(t||1));m.rotation.x=rx==null?Math.PI/2:rx;g.add(m);return m;}
function handMesh(wr,mat,hs,grip,nail){
  wr.add(M(SPH,mat,0,-.06,0,.085*hs,.1*hs,.06*hs));
  if(grip){for(let i=0;i<4;i++){const t=M(TOR,mat,0,-.045,(i-1.5)*.05*hs,.078*hs,.078*hs,.9);wr.add(t);}wr.add(M(SPH,mat,-.0,-.02,.1*hs,.04*hs,.05*hs,.04*hs));}
  else{for(let i=0;i<4;i++){const x=(i-1.5)*.035*hs;const f1=M(cyl(.017*hs,.015*hs,.09*hs,6),mat,x,-.14*hs,.035*hs);f1.rotation.x=-.5;wr.add(f1);const f2=M(cyl(.015*hs,.012*hs,.07*hs,6),mat,x,-.19*hs,.08*hs);f2.rotation.x=-1.4;wr.add(f2);}
    const th=M(cyl(.02*hs,.016*hs,.08*hs,6),mat,.06*hs,-.07*hs,.05*hs);th.rotation.z=.6;th.rotation.x=-.5;wr.add(th);}
}
function footMesh(an,mat,lw,toes){
  an.add(M(SPH,mat,0,-.035,.06,.08*lw,.055,.14*lw));an.add(M(SPH,mat,0,-.02,-.04,.06*lw,.05,.06*lw));
  for(let i=0;i<4;i++)an.add(M(SPH,mat,(i-1.5)*.032*lw,-.045,.2*lw,.024*lw,.024,.04*lw));
}

function buildFigure(c){
  const rig={joints:{},tail:[]};
  const root=new T.Group(),pivot=new T.Group(),inner=new T.Group();
  pivot.position.y=1;inner.position.y=-1;root.add(pivot);pivot.add(inner);rig.root=root;rig.tilt=pivot;
  const J=(n,par,x,y,z,s)=>{const g=new T.Group();g.position.set(x,y,z);g.userData.sgn=s||1;par.add(g);rig.joints[n]=g;return g;};
  const sk=c.skin;
  const hips=J('hips',inner,0,1,0);
  hips.add(M(SPH,sk,0,.02,0,.27*c.pw,.21,.21*c.bd));
  hips.add(M(SPH,sk,0,-.04,-.1*c.bd,.25*c.pw,.17,.14));
  const spine=J('spine',hips,0,.1,0);
  spine.add(M(SPH,sk,0,.16,0,.26*c.bw,.23,.2*c.bd));
  for(let r=0;r<3;r++)for(const s of [-1,1])if(c.abs)spine.add(M(SPH,sk,s*.07*c.bw,.04+r*.1,.17*c.bd,.07,.05,.045));
  const chest=J('chest',spine,0,.3,0);
  chest.add(M(SPH,sk,0,.2,0,.37*c.cw,.33,.25*c.bd));
  for(const s of [-1,1]){chest.add(M(SPH,sk,s*.14*c.cw,.27,.15*c.bd,.17*c.cw,.13,.11));chest.add(M(SPH,sk,s*.3*c.cw,.1,-.04,.1*c.cw,.2,.16*c.bd));chest.add(M(SPH,sk,s*.14,.5,-.02,.15*c.cw,.1,.13));chest.add(M(SPH,sk,s*.2*c.cw,.2,-.12*c.bd,.16*c.cw,.18,.12));}
  chest.add(M(SPH,sk,0,.08,.17*c.bd,.2*c.cw,.14,.1));
  chest.add(M(cyl(.1*c.aw,.14*c.aw,.2),sk,0,.55,0));
  rig.chestM=new T.Object3D();rig.chestM.position.set(0,.25,0);chest.add(rig.chestM);
  const head=J('head',chest,0,.62,0);
  rig.headM=new T.Object3D();rig.headM.position.set(0,.2,0);head.add(rig.headM);
  const jaw=new T.Group();jaw.position.set(0,.07,.03);head.add(jaw);rig.jaw=jaw;
  c.face(head,rig,jaw);
  for(const [nm,s] of [['A',c.aSign],['B',-c.aSign]]){
    const sh=J('sh'+nm,chest,s*.38*c.cw,.48,0,s);
    sh.add(M(SPH,sk,0,-.01,0,.15*c.aw,.15*c.aw,.15*c.aw));
    sh.add(M(cyl(.1*c.aw,.08*c.aw,.4),sk,0,-.2,0));
    sh.add(M(SPH,sk,0,-.14,.04,.095*c.aw,.15,.085*c.aw));
    sh.add(M(SPH,sk,0,-.13,-.04,.085*c.aw,.14,.075*c.aw));
    const el=J('el'+nm,sh,0,-.4,0,s);
    el.add(M(SPH,sk,0,0,0,.085*c.aw));
    el.add(M(cyl(.088*c.aw,.06*c.aw,.38),sk,0,-.19,0));
    el.add(M(SPH,sk,0,-.1,.015,.1*c.aw,.15,.1*c.aw));
    const wr=J('wr'+nm,el,0,-.39,0,s);
    handMesh(wr,c.hand||sk,c.hs,nm==='A');
    c.arm&&c.arm(sh,el,wr,nm,s);
  }
  for(const [nm,s] of [['L',-1],['R',1]]){
    const lg=J('lg'+nm,hips,s*.15*c.pw,-.02,0,s);
    lg.add(M(SPH,sk,0,-.04,0,.15*c.lw,.16,.15*c.lw));
    lg.add(M(cyl(.125*c.lw,.092*c.lw,.5),sk,0,-.25,0));
    lg.add(M(SPH,sk,0,-.2,.04,.12*c.lw,.2,.115*c.lw));lg.add(M(SPH,sk,0,-.2,-.05,.1*c.lw,.19,.09*c.lw));
    const kn=J('kn'+nm,lg,0,-.5,0,s);
    kn.add(M(SPH,sk,0,0,.01,.09*c.lw));
    kn.add(M(cyl(.088*c.lw,.06*c.lw,.5),sk,0,-.25,0));
    kn.add(M(SPH,sk,0,-.14,-.045,.09*c.lw,.17,.1*c.lw));kn.add(M(SPH,sk,s*.03,-.12,.03,.05*c.lw,.15,.05*c.lw));
    const an=J('an'+nm,kn,0,-.5,0,s);
    footMesh(an,c.foot||sk,c.lw);
    c.leg&&c.leg(lg,kn,an,nm,s);
  }
  c.body&&c.body(hips,spine,chest,rig);
  return rig;
}
function makeWeapon(kind){
  const w=new T.Group();
  if(kind==='gada'){
    w.add(M(cyl(.036,.046,1.9,12),matGold,0,.7,0));
    for(let i=0;i<6;i++){const b=M(TOR,matRed,0,.1+i*.09,0,.05,.05,1.6);b.rotation.x=Math.PI/2;w.add(b);}
    w.add(M(SPH,matGold,0,1.5,0,.27,.33,.27));
    for(const y of [1.26,1.5,1.74]){const t=M(TOR,matGold,0,y,0,.3,.3,.3);t.rotation.x=Math.PI/2;w.add(t);}
    for(let i=0;i<10;i++){const a=i/10*6.283;w.add(M(SPH,matGem,Math.cos(a)*.285,1.5,Math.sin(a)*.285,.035));}
    w.add(M(CONE,matGold,0,1.95,0,.1,.22,.1));
    for(let r=0;r<2;r++)for(let i=0;i<14;i++){const a=i/14*6.283+r*.2,y=1.38+r*.24;const s=M(CONE,matGold,Math.cos(a)*.3,y,Math.sin(a)*.3,.05,.15,.05);s.rotation.z=-Math.cos(a)*1.5;s.rotation.x=Math.sin(a)*1.5;w.add(s);}
    w.add(M(SPH,matGold,0,-.25,0,.07));w.add(M(CONE,matRed,0,-.45,0,.05,.22,.05));
    const hd=new T.Object3D();hd.position.set(0,1.5,0);w.add(hd);w.userData.head=hd;
  }else{
    w.add(M(cyl(.045,.06,2.5,12),matIron,0,.95,0));
    for(const y of [.1,.3,.6,.9]){const t=M(TOR,matGoldK,0,y,0,.075,.075,.5);t.rotation.x=Math.PI/2;w.add(t);}
    w.add(M(SPH,matIron,0,2.1,0,.4,.44,.4));
    for(const y of [1.86,2.1,2.34]){const t=M(TOR,matGoldK,0,y,0,.41,.41,.35);t.rotation.x=Math.PI/2;w.add(t);}
    for(let i=0;i<26;i++){const y=1-2*(i+.5)/26,r=Math.sqrt(1-y*y),a=i*2.399;const d=new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);const s=M(CONE,matIron,d.x*.44,2.1+d.y*.46,d.z*.44,.07,.28,.07);s.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d);w.add(s);}
    for(let i=0;i<8;i++){const a=i/8*6.283;w.add(M(SPH,matGem,Math.cos(a)*.41,2.1,Math.sin(a)*.41,.03));}
    w.add(M(CONE,matIron,0,2.6,0,.08,.3,.08));
    const hd=new T.Object3D();hd.position.set(0,2.1,0);w.add(hd);w.userData.head=hd;
  }
  return w;
}

/* --- Hanuman --- */
const hanCfg={skin:matFurH,hand:matFurH,foot:matFurH,aSign:-1,cw:.98,bw:.8,bd:.86,pw:.9,aw:1,lw:.97,hs:1,abs:true,
 face(h,rig,jaw){
  const eyeMat=std({color:0xfff2b0,emissive:0xffa000,emissiveIntensity:.8});rig.eyeMat=eyeMat;
  h.add(M(SPH,matFurH,0,.19,-.01,.2,.2,.19));
  h.add(M(SPH,matFaceH,0,.13,.14,.13,.11,.1));
  h.add(M(SPH,matFaceH,0,.21,.1,.15,.13,.1));
  h.add(M(SPH,matFaceH,0,.075,.2,.07,.05,.05));
  h.add(M(SPH,matFaceHd,0,.12,.255,.05,.035,.03));
  for(const s of [-1,1]){
    h.add(M(SPH,matFaceHd,s*.075,.225,.155,.05,.04,.03));
    h.add(M(SPH,matWhite,s*.073,.225,.17,.035,.03,.02));h.add(M(SPH,eyeMat,s*.073,.225,.19,.021,.021,.012));h.add(M(SPH,matIron,s*.073,.225,.2,.01,.012,.006));
    const lid=M(SPH,matFurH,s*.073,.248,.178,.046,.018,.03);lid.rotation.z=-s*.2;h.add(lid);
    const br=M(SPH,matFurH,s*.08,.272,.165,.06,.022,.04);br.rotation.z=s*.3;h.add(br);
    const ear=M(CONE,matFaceH,s*.2,.24,-.02,.07,.16,.04);ear.rotation.z=-s*.6;h.add(ear);h.add(M(CONE,matFaceHd,s*.195,.235,-.005,.04,.1,.02));
    const er=M(TOR,matGold,s*.215,.14,-.01,.04,.04,.04);er.rotation.y=Math.PI/2;h.add(er);h.add(M(SPH,matGem,s*.22,.095,-.01,.02));
    jaw.add(M(SPH,matFaceH,s*.04,-.025,.1,.05,.035,.07));
    const fg=M(CONE,matWhite,s*.04,.115,.23,.012,.045,.012);fg.rotation.x=Math.PI;h.add(fg);
    const lf=M(CONE,matWhite,s*.035,-.02,.17,.01,.035,.01);jaw.add(lf);
  }
  jaw.add(M(SPH,matFaceH,0,-.03,.12,.085,.04,.08));jaw.add(M(SPH,matMouth,0,-.005,.1,.07,.012,.07));
  h.add(M(SPH,matMouth,0,.082,.17,.09,.012,.07));
  furOn(h,furTuftH,[0,.17,-.02],[.21,.2,.2],70,.1,.025,-.25,-1);
  furOn(h,furTuftH,[0,.1,.02],[.2,.1,.15],40,.09,.025,-.6,0);
  const cr=M(cyl(.2,.18,.07,20),matGold,0,.34,0);h.add(cr);
  for(let t=0;t<3;t++)h.add(M(cyl(.17-t*.04,.19-t*.04,.07,16),matGold,0,.4+t*.06,0));
  h.add(M(CONE,matGold,0,.64,0,.045,.14,.045));
  for(let i=0;i<9;i++){const a=i/9*6.283;h.add(M(CONE,matGold,Math.cos(a)*.19,.41,Math.sin(a)*.19,.03,.1,.03));h.add(M(SPH,matGem,Math.cos(a)*.18,.345,Math.sin(a)*.18,.016));}
  h.add(M(SPH,matGem,0,.36,.19,.035));
  for(const s of [-1,0,1]){h.add(M(cyl(.007,.007,.07,5),matRed,s*.025,.3,.172));}
 },
 arm(sh,el,wr,nm){ring(sh,matGold,-.22,.115,1);ring(sh,matGold,-.27,.108,1);ring(el,matGold,-.1,.1,1);ring(el,matGold,-.3,.075,1);ring(wr,matGold,-.01,.07,1);
   furOn(sh,furTuftH,[0,-.12,0],[.1,.2,.1],34,.09,.025,-.7);furOn(el,furTuftH,[0,-.15,0],[.09,.18,.09],34,.09,.022,-.7);if(nm==='A'||1)furOn(sh,furTuftH,[0,0,0],[.15,.15,.15],36,.12,.032,-.2);},
 leg(lg,kn,an,nm){ring(kn,matGold,-.4,.07,1);ring(an,matGold,.0,.065,1);furOn(kn,furTuftH,[0,-.22,-.04],[.09,.24,.09],34,.08,.022,-.8);furOn(lg,furTuftH,[0,-.22,0],[.12,.25,.12],26,.08,.025,-.8);},
 body(hips,spine,chest,rig){
  const sk=new T.Mesh(cyl(.3,.42,.38,24,1),matRed);sk.position.set(0,-.19,0);sk.castShadow=true;hips.add(sk);
  for(let i=0;i<5;i++){const a=(i-2)*.5;const f=M(new T.BoxGeometry(.16,.36,.01),matRed,Math.sin(a)*.4,-.3,Math.cos(a)*.4+.02);f.rotation.y=a;f.rotation.x=-.1;hips.add(f);}
  const fl=M(new T.BoxGeometry(.2,.42,.015),matRed,0,-.3,.4);fl.rotation.x=-.12;hips.add(fl);
  ring(hips,matGold,.05,.28,.7);ring(hips,matGold,.0,.29,.5);
  for(let i=0;i<9;i++){const a=i/9*6.283;hips.add(M(cyl(.035,.035,.01,10),matGold,Math.cos(a)*.3,.04,Math.sin(a)*.3));}
  hips.add(M(SPH,matGold,0,.04,.3,.06,.06,.02));
  ring(chest,matGold,.56,.14,.6);
  for(let i=0;i<14;i++){const a=-Math.PI*.55+i/13*Math.PI*1.1;chest.add(M(SPH,matGold,Math.sin(a)*.17,.52-Math.cos(a)*.1*.6-.02+Math.abs(Math.sin(a))*0,Math.cos(a)*.15,.018));}
  chest.add(M(SPH,matGem,0,.43,.19,.035));
  const jan=M(cyl(.017,.017,.82,6),matRed,0,.22,.0);jan.rotation.z=.7;jan.position.z=.215;chest.add(jan);
  const jan2=jan.clone();jan2.position.z=-.2;chest.add(jan2);
  furOn(chest,furTuftH,[0,.25,-.05],[.34,.32,.22],90,.12,.03,-.2);
  furOn(chest,furTuftH,[0,.55,0],[.25,.1,.2],40,.14,.035,.4);
  furOn(hips,furTuftH,[0,0,0],[.25,.2,.2],40,.09,.03,-.5);
  for(let i=0;i<9;i++){const tj=new T.Group();tj.userData.base=i?.4:-2.2;tj.rotation.x=tj.userData.base;(i?rig.tail[i-1]:hips).add(tj);if(!i)tj.position.set(0,-.02,-.2);else tj.position.y=.26;const r=.08-i*.0065;tj.add(M(cyl(r*.8,r,.28,10),matFurH,0,.14,0));tj.add(M(SPH,matFurH,0,.27,0,r));furOn(tj,furTuftH,[0,.14,0],[r,.14,r],8,.08,.026,.2);rig.tail.push(tj);}
  rig.tail[8].add(M(CONE,matFurH,0,.42,0,.07,.28,.07));furOn(rig.tail[8],furTuftH,[0,.4,0],[.05,.2,.05],24,.16,.04,.3);
  const gada=makeWeapon('gada');gada.rotation.x=Math.PI/2;rig.joints.wrA.add(gada);rig.weapon=gada;rig.weaponHead=gada.userData.head;
  const aura=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0xffa820,blending:T.AdditiveBlending,transparent:true,depthWrite:false,opacity:0,fog:false}));
  aura.position.set(0,.3,-.15);aura.scale.setScalar(6);chest.add(aura);rig.aura=aura;
 }};
/* --- Kumbhakarna --- */
const kumCfg={skin:matSkinK,hand:matSkinK,foot:matSkinK,aSign:1,cw:1.28,bw:1.55,bd:1.32,pw:1.22,aw:1.42,lw:1.32,hs:1.45,abs:true,
 face(h,rig,jaw){
  const eyeMat=std({color:0xff3010,emissive:0xff1800,emissiveIntensity:1.4});rig.eyeMat=eyeMat;
  h.add(M(SPH,matSkinK,0,.2,0,.24,.23,.22));
  h.add(M(SPH,matSkinK,0,.07,.1,.19,.13,.17));
  h.add(M(SPH,matSkinK,0,.3,.14,.21,.06,.12));
  h.add(M(SPH,matSkinK,0,.13,.215,.06,.05,.05));
  h.add(M(SPH,matIron,0,.09,.255,.012,.012,.01));
  for(const s of [-1,1]){
    const brw=M(SPH,matSkinK,s*.085,.285,.17,.1,.045,.06);brw.rotation.z=s*.35;h.add(brw);
    h.add(M(SPH,matBlackK,s*.085,.235,.165,.055,.04,.03));
    h.add(M(SPH,matWhite,s*.085,.235,.185,.037,.028,.02));h.add(M(SPH,eyeMat,s*.085,.235,.2,.024,.024,.012));
    const tk=M(CONE,matBone,s*.1,.03,.2,.03,.16,.03);tk.rotation.x=-.3;h.add(tk);
    jaw.add(M(CONE,matBone,s*.095,.06,.2,.03,.19,.03));
    const hr=M(CONE,matBone,s*.17,.34,-.02,.06,.28,.06);hr.rotation.z=-s*.5;h.add(hr);const hr2=M(CONE,matBone,s*.31,.52,-.02,.04,.2,.04);hr2.rotation.z=-s*.1;h.add(hr2);
    h.add(M(SPH,matSkinK,s*.245,.2,-.01,.045,.12,.07));
    const er=M(TOR,matGoldK,s*.26,.1,-.01,.075,.075,.075);er.rotation.y=Math.PI/2;h.add(er);h.add(M(SPH,matGem,s*.27,.03,-.01,.03));
    const mu=M(CONE,matHairK,s*.07,.07,.23,.035,.2,.035);mu.rotation.z=s*1.35;h.add(mu);
    jaw.add(M(SPH,matSkinK,s*.07,-.02,.1,.07,.05,.09));
    const sc=M(SPH,matRedK,s*.1,.15,.2,.01,.09,.01);sc.rotation.z=s*.3;h.add(sc);
  }
  const nr=M(TOR,matGoldK,0,.075,.245,.035,.035,.035);h.add(nr);
  jaw.add(M(SPH,matSkinK,0,-.04,.1,.12,.06,.11));jaw.add(M(SPH,matMouth,0,-.005,.1,.1,.014,.09));jaw.add(M(SPH,matSkinK,0,-.06,.18,.06,.05,.05));
  h.add(M(SPH,matMouth,0,.04,.17,.1,.012,.08));
  furOn(jaw,matHairK,[0,-.08,.12],[.1,.1,.1],34,.2,.02,-.9,1);furOn(h,matHairK,[0,.04,.2],[.12,.04,.04],22,.12,.022,-.5,1);
  furOn(h,matHairK,[0,.2,-.04],[.24,.22,.22],140,.55,.03,-1.1,-1);
  h.add(M(cyl(.22,.2,.1,18),matGoldK,0,.38,0));
  for(let i=0;i<7;i++){const a=(i-3)*.42;const sp=M(CONE,matGoldK,Math.sin(a)*.21,.52,Math.cos(a)*.21-.02,.04,.2,.04);sp.rotation.z=-Math.sin(a)*.3;h.add(sp);h.add(M(SPH,matGem,Math.sin(a)*.2,.4,Math.cos(a)*.2,.02));}
  h.add(M(CONE,matGoldK,0,.7,0,.06,.26,.06));h.add(M(SPH,matGem,0,.42,.21,.04));
 },
 arm(sh,el,wr,nm,s){
  sh.add(M(SPH,matGoldK,s*.04,.06,0,.22,.14,.2));for(let k=0;k<3;k++){const sp=M(CONE,matIron,s*.04+(k-1)*.1,.18,(k-1)*.06,.04,.17,.04);sp.rotation.z=-(k-1)*.35;sh.add(sp);}
  ring(sh,matGoldK,-.22,.15,1);
  const br=M(cyl(.1,.085,.3,14),matIron,0,-.22,0);el.add(br);for(let k=0;k<4;k++){const sp=M(CONE,matGoldK,0,-.12-k*.07,.0,.025,.07,.025);sp.position.x=s*.1;sp.rotation.z=-s*1.4;el.add(sp);}
  ring(el,matGoldK,-.34,.1,1);
  furOn(el,matHairK,[0,-.15,0],[.1,.18,.1],20,.07,.018,-.8);
 },
 leg(lg,kn,an,nm,s){
  const g=M(cyl(.1*1.32,.085*1.32,.4,14),matGoldK,0,-.26,0);kn.add(g);ring(kn,matGoldK,-.08,.13,1);ring(kn,matGoldK,-.4,.115,1);
  const kp=M(SPH,matIron,0,0,.09,.09,.09,.04);kn.add(kp);for(let k=0;k<3;k++){const sp=M(CONE,matIron,(k-1)*.05,0,.12,.02,.09,.02);sp.rotation.x=1.5;kn.add(sp);}
  for(let k=0;k<5;k++){const t=M(new T.BoxGeometry(.14,.12,.02),matGoldK,(k-2)*.07,-.26,.14-Math.abs(k-2)*.015);t.rotation.y=(k-2)*.3;lg.add(t);}
  for(let k=0;k<3;k++){const sp=M(CONE,matIron,(k-1)*.07,-.08,.25,.03,.12,.03);sp.rotation.x=1.5;an.add(sp);}
 },
 body(hips,spine,chest,rig){
  const sk=new T.Mesh(cyl(.36,.5,.48,24,1),matRedK);sk.position.set(0,-.24,0);sk.castShadow=true;hips.add(sk);
  for(let i=0;i<9;i++){const a=i/9*6.283;const t=M(new T.BoxGeometry(.2,.36,.02),i%2?matGoldK:matBlackK,Math.sin(a)*.46,-.36,Math.cos(a)*.44);t.rotation.y=a;hips.add(t);}
  ring(hips,matGoldK,.07,.36,.9);hips.add(M(SPH,matBone,0,.07,.37,.07,.08,.03));hips.add(M(SPH,matGem,0,.07,.4,.025));
  const pl=M(SPH,matGoldK,0,.24,.13,.4,.3,.19);chest.add(pl);
  for(let k=0;k<2;k++){const t=M(TOR,matGoldK,0,.24+k*.02,.13,.39,.29,.4);chest.add(t);}
  chest.add(M(SPH,matGem,0,.3,.31,.05));
  for(const s of [-1,1]){chest.add(M(SPH,matGoldK,s*.52,.5,0,.24,.15,.2));chest.add(M(SPH,matIron,s*.2,.1,.27,.05,.05,.03));}
  ring(chest,matGoldK,.57,.17,.7);
  for(let i=0;i<9;i++){const a=-Math.PI*.6+i/8*Math.PI*1.2;chest.add(M(SPH,matBone,Math.sin(a)*.2,.5-Math.cos(a)*.08,Math.cos(a)*.18,.035));}
  const mace=makeWeapon('mace');mace.rotation.x=Math.PI/2;rig.joints.wrA.add(mace);rig.weapon=mace;rig.weaponHead=mace.userData.head;
  furOn(chest,matHairK,[0,.25,.12],[.3,.25,.16],40,.07,.02,-.3,1);
 }};
const han=buildFigure(hanCfg),kum=buildFigure(kumCfg);
scene.add(han.root,kum.root);
/* ---------- poses ---------- */
const H={
 CROUCH:P({bob:[-.34],hips:[.3],spine:[.2],chest:[.25],head:[.35],lgL:[-.9,0,.12],knL:[1.7],lgR:[-.9,0,.12],knR:[1.7],shA:[-.9,0,.25],elA:[-.9],wp:[-1.5],shB:[-.7,0,.3],elB:[-.9]}),
 RISE:P({bob:[-.2],hips:[.15],spine:[.1],chest:[.1],head:[.05],lgL:[-.5,0,.2],knL:[1],lgR:[-.5,0,.2],knR:[1],shA:[-.6,0,.4],elA:[-1],wp:[-1.5],shB:[-.4,0,.6],elB:[-.8]}),
 ROAR:P({hips:[-.05],spine:[-.1],chest:[-.3],head:[-.5],lgL:[-.05,0,.22],knL:[.1],lgR:[-.05,0,.22],knR:[.1],shA:[-.4,0,.7],elA:[-.9],wp:[-1.45],shB:[-.2,0,1],elB:[-.5]}),
 MARCH:P({hips:[.12],chest:[.15],head:[-.1],lgL:[0,0,.08],lgR:[0,0,.08],shA:[-.5,0,.2],elA:[-1.1],wp:[-1.5],shB:[0,0,.2],elB:[-.6]}),
 GUARD:P({bob:[-.12],hips:[.1,.1,0],chest:[.2,.1,0],head:[.1],lgL:[-.4,0,.3],knL:[.4],lgR:[.3,0,.3],knR:[.35],shA:[-.9,0,.3],elA:[-1.2],wp:[-1.3],shB:[-.7,0,.3],elB:[-1.3]}),
 WIND:P({bob:[-.2],hips:[-.05,-.12,0],spine:[0,-.08,0],chest:[-.2,-.25,0],head:[-.2],lgL:[-.6,0,.3],knL:[.7],lgR:[.5,0,.3],knR:[.5],shA:[-2.9,0,.2],elA:[-.9],wp:[-2.4],shB:[-.5,0,.6],elB:[-.8]}),
 STRIKE:P({bob:[-.14],hips:[.15,.12,0],spine:[.1,.08,0],chest:[.15,.25,0],head:[.1],lgL:[-.7,0,.3],knL:[.6],lgR:[.5,0,.3],knR:[.3],shA:[-1.5,0,.1],elA:[-.15],wp:[-.35],shB:[.4,0,.7],elB:[-.3]}),
 FOLLOW:P({bob:[-.3],hips:[.4,.15,0],spine:[.2,.1,0],chest:[.4,.3,0],head:[.2],lgL:[-.95,0,.3],knL:[1],lgR:[.8,0,.3],knR:[.3],shA:[-1,0,.2],elA:[-.3],wp:[.7],shB:[.6,0,.8],elB:[-.2]}),
 TRIUMPH:P({hips:[-.1],spine:[-.1],chest:[-.35],head:[-.55],lgL:[-.1,0,.3],knL:[.12],lgR:[-.1,0,.3],knR:[.12],shA:[-2.9,0,.15],elA:[-.15],wp:[-1.57],shB:[-.1,0,1.1],elB:[-.5]}),
 STAGGER:P({bob:[-.14],hips:[.5],spine:[.2],chest:[.5,.2,0],head:[.6],lgL:[-.5,0,.25],knL:[.7],lgR:[.3,0,.25],knR:[.5],shA:[-.2,0,.4],elA:[-.3],wp:[.9],shB:[-.6,0,.2],elB:[-2]}),
 KNEEL:P({bob:[-.55],hips:[.2],spine:[.15],chest:[.4],head:[.5],lgL:[-1.4,0,.1],knL:[1.5],lgR:[-.2,0,.15],knR:[2.25],shA:[-.35,0,.1],elA:[-.3],wp:[-1.45],shB:[-.9,0,.05],elB:[-.6]}),
 LEAPUP:P({bob:[.1],hips:[.1],chest:[-.1],head:[-.2],lgL:[-1,0,.3],knL:[1.2],lgR:[-.4,0,.3],knR:[1],shA:[-2.9,0,.2],elA:[-.2],wp:[-2.1],shB:[-.6,0,.7],elB:[-.5]}),
 LEAPHIT:P({bob:[.05],hips:[.15,.1,0],spine:[.1],chest:[.2,.2,0],head:[.1],lgL:[-.8,0,.3],knL:[1],lgR:[-.2,0,.3],knR:[.8],shA:[-1.9,0,.1],elA:[-.1],wp:[-.3],shB:[.2,0,.8],elB:[-.3]}),
 REST:P({bob:[-.08],hips:[.2],chest:[.3],head:[.15],lgL:[-.3,0,.25],knL:[.35],lgR:[.2,0,.25],knR:[.3],shA:[-.3,0,.2],elA:[-.3],wp:[.2],shB:[0,0,.3],elB:[-.4]})
};
const K={
 WALK:P({hips:[.1],chest:[.1],head:[.1],lgL:[0,0,.12],lgR:[0,0,.12],shA:[-.4,0,.3],elA:[-.9],wp:[-1.35],shB:[0,0,.35],elB:[-.4]}),
 ROAR:P({hips:[-.1],spine:[-.1],chest:[-.5],head:[-.65],lgL:[-.1,0,.3],knL:[.15],lgR:[-.1,0,.3],knR:[.15],shA:[-.3,0,.9],elA:[-.7],wp:[-1.57],shB:[-.2,0,1.2],elB:[-.5]}),
 READY:P({bob:[-.05],hips:[.1,.08,0],chest:[.2,.1,0],head:[.1],lgL:[-.3,0,.3],knL:[.3],lgR:[.2,0,.3],knR:[.2],shA:[-.9,0,.3],elA:[-1],wp:[-1],shB:[-.6,0,.4],elB:[-1]}),
 AIR:P({hips:[-.3],spine:[-.3],chest:[-.6],head:[-.9],lgL:[-.7,0,.3],knL:[1],lgR:[.1,0,.3],knR:[.9],shA:[-.2,0,1.5],elA:[-.2],wp:[.9],shB:[.5,0,1.4],elB:[-.2]}),
 LIE:P({tilt:[-1.55],chest:[-.1],head:[-.2],lgL:[0,0,.35],lgR:[0,0,.35],shA:[.2,0,.8],elA:[-.2],wp:[.5],shB:[.2,0,.8],elB:[-.2]}),
 SITUP:P({tilt:[-.7],hips:[.3],chest:[.5],head:[.3],lgL:[-.6,0,.3],knL:[.5],lgR:[-.4,0,.3],knR:[.3],shA:[-1,0,.3],elA:[-.3],wp:[.2],shB:[-1,0,.3],elB:[-.4]}),
 RISE:P({bob:[-.35],hips:[.4],chest:[.5],head:[.3],lgL:[-.9,0,.3],knL:[1.6],lgR:[-.9,0,.3],knR:[1.6],shA:[-.6,0,.4],elA:[-.5],wp:[.2],shB:[-.6,0,.4],elB:[-.5]}),
 CHARGE:P({hips:[.2],chest:[.25],head:[.1],lgL:[0,0,.1],lgR:[0,0,.1],shA:[-2.6,0,.2],elA:[-.6],wp:[-2.3],shB:[-.4,0,.5],elB:[-.8]}),
 WIND:P({bob:[-.1],hips:[0,.15,0],spine:[0,.08,0],chest:[-.2,.25,0],head:[-.2],lgL:[-.5,0,.3],knL:[.5],lgR:[.4,0,.3],knR:[.4],shA:[-2.9,0,.2],elA:[-.8],wp:[-2.4],shB:[-.6,0,.6],elB:[-.8]}),
 STRIKE:P({bob:[-.1],hips:[.15,-.12,0],spine:[.1,-.08,0],chest:[.15,-.25,0],head:[.1],lgL:[-.6,0,.3],knL:[.5],lgR:[.5,0,.3],knR:[.3],shA:[-1.45,0,.1],elA:[-.2],wp:[-.25],shB:[.4,0,.7],elB:[-.3]}),
 FOLLOW:P({bob:[-.25],hips:[.4,-.15,0],spine:[.2,-.1,0],chest:[.5,-.3,0],head:[.2],lgL:[-.8,0,.3],knL:[.8],lgR:[.7,0,.3],knR:[.3],shA:[-1,0,.2],elA:[-.3],wp:[.7],shB:[.6,0,.8],elB:[-.2]}),
 HEADHIT:P({bob:[-.12],hips:[-.25],spine:[-.2],chest:[-.5],head:[-.9],lgL:[-.4,0,.3],knL:[.5],lgR:[.2,0,.3],knR:[.5],shA:[-.4,0,1],elA:[-.5],wp:[.8],shB:[-.2,0,1],elB:[-.4]}),
 DAZED:P({bob:[-.2],hips:[.2],chest:[.3],head:[.5],lgL:[-.5,0,.3],knL:[.7],lgR:[-.3,0,.3],knR:[.6],shA:[.1,0,.4],elA:[-.2],wp:[1],shB:[.1,0,.4],elB:[-.3]}),
 KNEEL:P({bob:[-.55],hips:[.15],spine:[.1],chest:[.3],head:[.4],lgL:[-1.4,0,.15],knL:[1.5],lgR:[-.2,0,.2],knR:[2.25],shA:[0,0,.4],elA:[-.2],wp:[.7],shB:[0,0,.4],elB:[-.2]})
};

/* ---------- timelines (seconds) ---------- */
const HP=[[0,H.CROUCH],[2.6,H.CROUCH],[3.3,H.RISE],[8.6,H.ROAR],[9.4,H.ROAR],[10.4,H.MARCH],[21,H.MARCH],[22.6,H.GUARD],[24.6,H.GUARD],[26.2,H.WIND],[26.7,H.STRIKE,'in'],[28,H.FOLLOW,'out'],[29.2,H.FOLLOW],[30.2,H.TRIUMPH],[31.4,H.TRIUMPH],[32.2,H.MARCH],[36.4,H.MARCH],[37.4,H.GUARD],[38.4,H.GUARD],[38.85,H.STAGGER,'out'],[39.8,H.STAGGER],[40.4,H.KNEEL],[43.2,H.KNEEL],[44.2,H.ROAR],[44.9,H.ROAR],[45.4,H.GUARD],[46.3,H.WIND],[47,H.STRIKE,'in'],[48.8,H.STRIKE],[49.4,H.STAGGER,'out'],[50.3,H.CROUCH,'io'],[51.4,H.LEAPUP,'out'],[52.95,H.LEAPHIT,'io'],[54.1,H.FOLLOW,'out'],[55.6,H.GUARD,'io'],[61.7,H.GUARD],[62.5,H.STAGGER,'out'],[64.2,H.STAGGER],[65.4,H.RISE,'io'],[66.4,H.ROAR,'out'],[68.8,H.ROAR],[70.0,H.GUARD,'io'],[71.2,H.WIND,'io'],[72,H.STRIKE,'in'],[73.4,H.STRIKE],[74.2,H.WIND,'io'],[75.5,H.STRIKE,'in'],[77,H.STRIKE],[77.8,H.STAGGER,'out'],[79.4,H.STAGGER],[80.4,H.GUARD,'io'],[81.3,H.WIND,'io'],[82,H.STRIKE,'in'],[82.45,H.STRIKE],[83.4,H.STAGGER,'out'],[84.4,H.KNEEL,'io'],[87,H.KNEEL],[88.6,H.REST,'io'],[90,H.REST]];
const KP=[[0,K.WALK],[21,K.WALK],[22.6,K.ROAR],[24.4,K.ROAR],[25.4,K.READY],[26.7,K.READY],[26.95,withT(K.AIR,-.3),'out'],[28,withT(K.AIR,-.9)],[29.4,K.LIE],[31.2,K.LIE],[32.4,K.SITUP],[33.8,K.RISE],[34.4,K.ROAR],[35.2,K.CHARGE],[36.8,K.CHARGE],[37.4,K.WIND],[37.9,K.WIND],[38.4,K.STRIKE,'in'],[39.2,K.FOLLOW,'out'],[40.2,K.ROAR],[42.6,K.ROAR],[43.6,K.READY],[45,K.READY],[46.2,K.WIND],[47,K.STRIKE,'in'],[48.8,K.STRIKE],[49.4,K.FOLLOW,'out'],[50.6,K.READY,'io'],[52.8,K.READY],[53.4,K.HEADHIT,'out'],[55.2,K.HEADHIT],[56,K.DAZED,'io'],[57.4,K.DAZED],[58,K.ROAR,'out'],[60,K.ROAR],[60.4,K.CHARGE,'io'],[60.9,K.CHARGE],[61.3,K.WIND,'io'],[61.65,K.WIND],[62,K.STRIKE,'in'],[62.9,K.FOLLOW,'out'],[64.4,K.FOLLOW],[65.2,K.READY,'io'],[66.2,K.READY],[67,K.ROAR,'out'],[69,K.ROAR],[69.8,K.READY,'io'],[71.2,K.WIND,'io'],[72,K.STRIKE,'in'],[73.4,K.STRIKE],[74.2,K.WIND,'io'],[75.5,K.STRIKE,'in'],[77,K.STRIKE],[77.8,K.FOLLOW,'out'],[79.4,K.FOLLOW],[80.4,K.READY,'io'],[81.3,K.WIND,'io'],[82.55,K.STRIKE,'in'],[83,K.STRIKE],[83.6,K.HEADHIT,'out'],[84.6,K.KNEEL,'io'],[87,K.KNEEL],[88.6,K.DAZED,'io'],[90,K.DAZED]];
/* root keys: t,x,y,s, ex/ey easing for the segment ending at this key */
const HR=[[0,-150,0,.95],[3,-150,0,.95],[8.8,-150,0,16,'io'],[9.5,-150,0,16],[19.5,-38,0,16,'lin'],[22.5,-22,0,16,'out'],[25,-22,0,16,'io'],[26.7,-6,0,16,'io'],[28.2,-4,0,16,'out'],[30,-4,0,16],[36.8,36,0,16,'lin'],[38.4,36,0,16],[39.8,18,0,16,'out'],[46.3,18,0,16],[49,18,0,16],[50.3,12,0,16,'out'],[51.4,20,12,16,'out','out'],[52.2,31,20,16,'out','out'],[52.95,42,13,16,'lin','io'],[54.3,46,0,16,'out','in'],[55.6,46,0,16,'io'],[62,46,0,16],[63.6,28,0,16,'out'],[70,28,0,16],[72,22,0,16,'io'],[75.5,22,0,16],[77.8,12,0,16,'out'],[79.4,16,0,16],[79.6,14,0,16,'out'],[81.9,32,0,16,'io'],[82.6,32,0,16],[83.6,22,0,16,'out'],[90,22,0,16]];
const KR=[[0,210,0,16],[21,34,0,16,'lin'],[22.5,28,0,16,'out'],[26.7,28,0,16],[28,76,34,16,'lin','out'],[29.4,125,-10.4,16,'lin','in'],[29.7,125,-9,16,'out','out'],[30.1,125,-10.4,16,'io','in'],[31.2,125,-10.4,16],[32.8,125,-5,16,'io'],[34,125,0,16,'io'],[35.2,125,0,16],[37,88,0,16,'io'],[49,90,0,16,'io'],[50.6,96,0,16,'out'],[52.9,98,0,16],[54.6,112,0,16,'out'],[59.9,112,0,16],[61.6,80,0,16,'io'],[64.4,80,0,16],[66.2,90,0,16,'io'],[77.8,92,0,16],[79.4,90,0,16],[79.6,94,0,16,'out'],[81.9,80,0,16,'io'],[82.7,90,0,16,'out'],[90,90,0,16]];
function sampleKeys(keys,t,isPose){
  let i=0;while(i<keys.length-1&&keys[i+1][0]<=t)i++;
  const a=keys[i],b=keys[Math.min(i+1,keys.length-1)];
  if(a===b||t<=a[0])return a;
  return {a,b,u:clamp((t-a[0])/(b[0]-a[0]),0,1)};
}
function poseAt(keys,t){
  const r=sampleKeys(keys,t);if(!r.a)return r[1];
  const e=EASE[r.b[2]||'io'](r.u),out={};
  for(const k in r.a[1]){const x=r.a[1][k],y=r.b[1][k];out[k]=x.map((v,j)=>v+(y[j]-v)*e);}
  return out;
}
function rootAt(keys,t){
  const r=sampleKeys(keys,t);if(!r.a)return{x:r[1],y:r[2],s:r[3]};
  const ex=EASE[r.b[4]||'io'](r.u),ey=EASE[r.b[5]||r.b[4]||'io'](r.u);
  return{x:lerp(r.a[1],r.b[1],ex),y:lerp(r.a[2],r.b[2],ey),s:lerp(r.a[3],r.b[3],ex)};
}

/* ================= AUDIO ================= */
const AU={ctx:null,master:null,noise:null,on:true,amb:null};
function auInit(){
  if(AU.ctx)return;
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const ctx=AU.ctx=new C();
    const comp=ctx.createDynamicsCompressor();comp.connect(ctx.destination);
    AU.master=ctx.createGain();AU.master.gain.value=.8;AU.master.connect(comp);
    const nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.noise=nb;
    // ambient: wind + distant crackle + deep drone
    const n=ctx.createBufferSource();n.buffer=nb;n.loop=true;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=380;bp.Q.value=.6;const g=ctx.createGain();g.gain.value=.12;n.connect(bp);bp.connect(g);g.connect(AU.master);n.start();
    const o1=ctx.createOscillator(),o2=ctx.createOscillator(),og=ctx.createGain();o1.frequency.value=36;o2.frequency.value=54;o1.type='sawtooth';o2.type='triangle';og.gain.value=.05;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=140;o1.connect(lp);o2.connect(lp);lp.connect(og);og.connect(AU.master);o1.start();o2.start();
    AU.amb=g;AU.drone=og;
  }catch(e){AU.ctx=null;}
}
function auNoise(dur,freq,type,gain,delay){
  const c=AU.ctx;if(!c||!AU.on)return;const t=c.currentTime+(delay||0);
  const s=c.createBufferSource();s.buffer=AU.noise;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;const g=c.createGain();
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.015);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  s.connect(f);f.connect(g);g.connect(AU.master);s.start(t,Math.random());s.stop(t+dur+.05);
}
function auTone(type,f0,f1,dur,gain,delay){
  const c=AU.ctx;if(!c||!AU.on)return;const t=c.currentTime+(delay||0);
  const o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  const g=c.createGain();g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g);g.connect(AU.master);o.start(t);o.stop(t+dur+.05);
}
const sfx={
  boom(p){p=clamp(p,.2,2);auTone('sine',110,24,1.6,.9*p);auNoise(1.8,380,'lowpass',.9*p);auNoise(.5,2200,'highpass',.25*p);},
  thud(p){p=clamp(p,.1,1.5);auTone('sine',80,26,.55,.7*p);auNoise(.5,260,'lowpass',.5*p);},
  clang(p){p=p||1;[820,1330,2210,3100].forEach((f,i)=>auTone(i%2?'triangle':'square',f,f*.97,.9-i*.1,.09*p));auNoise(.4,4000,'highpass',.35*p);auTone('sine',140,50,.6,.5*p);},
  whoosh(p){auNoise(.55,900,'bandpass',.5*(p||1));},
  roar(pitch,dur,p){const c=AU.ctx;if(!c||!AU.on)return;const t=c.currentTime;const o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(pitch*1.4,t);o.frequency.exponentialRampToValueAtTime(pitch,t+.3);o.frequency.exponentialRampToValueAtTime(pitch*.6,t+dur);
    const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=3;f.frequency.setValueAtTime(400,t);f.frequency.linearRampToValueAtTime(1100,t+dur*.4);f.frequency.linearRampToValueAtTime(500,t+dur);
    const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.55*(p||1),t+.15);g.gain.linearRampToValueAtTime(.0008,t+dur);o.connect(f);f.connect(g);g.connect(AU.master);o.start(t);o.stop(t+dur+.1);auNoise(dur,700,'bandpass',.22*(p||1));},
  rumble(dur,p){auNoise(dur,90,'lowpass',.9*(p||1));},
  drum(a){auTone('sine',90,40,.35,.35*a);auNoise(.1,300,'lowpass',.15*a);},
  swell(){const c=AU.ctx;if(!c||!AU.on)return;const t=c.currentTime,o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(420,t+5.5);const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(200,t);f.frequency.exponentialRampToValueAtTime(2400,t+5.5);const g=c.createGain();g.gain.setValueAtTime(.0008,t);g.gain.exponentialRampToValueAtTime(.3,t+5.2);g.gain.exponentialRampToValueAtTime(.0008,t+6);o.connect(f);f.connect(g);g.connect(AU.master);o.start(t);o.stop(t+6.2);}
};

/* ================= FX ================= */
const PN=900,pool=[];
for(let i=0;i<PN;i++){const sp=new T.Sprite(new T.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,opacity:0,fog:true}));sp.visible=false;scene.add(sp);pool.push({sp,life:0,max:0,vx:0,vy:0,vz:0,s0:1,s1:1,a0:1,grav:0,drag:0});}
let pidx=0;
function spawn(x,y,z,vx,vy,vz,o){
  const p=pool[pidx=(pidx+1)%PN];p.sp.position.set(x,y,z);p.life=0;p.max=o.life;p.vx=vx;p.vy=vy;p.vz=vz;p.s0=o.s0;p.s1=o.s1;p.a0=o.a0==null?1:o.a0;p.grav=o.grav||0;p.drag=o.drag||0;
  p.sp.material.color.setHex(o.color);p.sp.material.blending=o.add?T.AdditiveBlending:T.NormalBlending;p.sp.visible=true;p.sp.scale.setScalar(o.s0);
}
function updateParticles(dt){
  for(const p of pool){if(p.max<=0)continue;p.life+=dt;const u=p.life/p.max;if(u>=1){p.sp.visible=false;p.max=0;continue;}
    p.vy-=p.grav*dt;const k=Math.exp(-p.drag*dt);p.vx*=k;p.vy*=k;p.vz*=k;
    p.sp.position.x+=p.vx*dt;p.sp.position.y+=p.vy*dt;p.sp.position.z+=p.vz*dt;
    p.sp.scale.setScalar(lerp(p.s0,p.s1,Math.sqrt(u)));
    p.sp.material.opacity=p.a0*(u<.12?u/.12:1-(u-.12)/.88);}
}
const DUST=0x8a6a4c,DUSTD=0x4a3828,SPARK=0xffc660,EMBER=0xff7a22,SMOKE=0x241a16,GOLD=0xffc040;
function dustBurst(x,z,n,speed,size,up){for(let i=0;i<n;i++){const a=rnd()*6.283,s=speed*rr(.3,1);spawn(x+Math.cos(a)*size*.3,hgt(x,z)+rr(.5,3),z+Math.sin(a)*size*.3,Math.cos(a)*s,rr(.1,1)*speed*up,Math.sin(a)*s,{life:rr(2.2,4.2),s0:size*rr(.5,1),s1:size*rr(2,3.4),a0:.55,drag:1.1,grav:-1.2,color:rnd()<.5?DUST:DUSTD});}}
function sparkBurst(x,y,z,n,speed){for(let i=0;i<n;i++){const a=rnd()*6.283,e=rr(-.3,1.2),s=speed*rr(.3,1);spawn(x,y,z,Math.cos(a)*Math.cos(e)*s,Math.sin(e)*s,Math.sin(a)*Math.cos(e)*s,{life:rr(.5,1.6),s0:rr(.8,2.4),s1:.2,a0:1,grav:30,drag:.4,color:rnd()<.5?SPARK:0xfff0c0,add:true});}}
/* debris rocks */
const DN=160,debris=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:0x4b3d34,roughness:1,flatShading:true}),DN);
debris.castShadow=true;debris.frustumCulled=false;scene.add(debris);
const db=[];for(let i=0;i<DN;i++)db.push({on:false,x:0,y:0,z:0,vx:0,vy:0,vz:0,rx:0,ry:0,sx:0,sy:0,s:1,life:0});
let dbi=0;const dm=new T.Object3D();
function debrisBurst(x,z,n,speed,size){for(let i=0;i<n;i++){const d=db[dbi=(dbi+1)%DN],a=rnd()*6.283,s=speed*rr(.3,1);Object.assign(d,{on:true,x:x+Math.cos(a)*rr(2,12),y:rr(1,4),z:z+Math.sin(a)*rr(2,12),vx:Math.cos(a)*s,vy:rr(.5,1.2)*speed*.9,vz:Math.sin(a)*s,rx:rnd()*3,ry:rnd()*3,sx:rr(-6,6),sy:rr(-6,6),s:rr(.4,1)*size,life:0});}}
function updateDebris(dt){
  for(let i=0;i<DN;i++){const d=db[i];
    if(d.on){d.life+=dt;d.vy-=55*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;d.rx+=d.sx*dt;d.ry+=d.sy*dt;const g=hgt(d.x,d.z)+d.s*.5;
      if(d.y<g){d.y=g;d.vy*=-.3;d.vx*=.6;d.vz*=.6;d.sx*=.5;d.sy*=.5;if(Math.abs(d.vy)<2)d.vy=0;}
      if(d.life>7)d.on=false;}
    const sc=d.on?d.s*(d.life>5.5?(7-d.life)/1.5:1):0;
    dm.position.set(d.x,d.y,d.z);dm.rotation.set(d.rx,d.ry,0);dm.scale.setScalar(Math.max(sc,.0001));dm.updateMatrix();debris.setMatrixAt(i,dm.matrix);}
  debris.instanceMatrix.needsUpdate=true;
}
/* shock rings + cracks */
const rings=[],RN=10;
for(let i=0;i<RN;i++){const m=new T.Mesh(new T.RingGeometry(.9,1,72),new T.MeshBasicMaterial({color:0xffd9a0,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:true}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);rings.push({m,life:0,max:0,R:1});}
let ri=0;
function ringFX(x,z,R,life,color,y){const r=rings[ri=(ri+1)%RN];r.m.position.set(x,(y||.8),z);r.life=0;r.max=life;r.R=R;r.m.material.color.setHex(color||0xffd9a0);r.m.visible=true;}
function updateRings(dt){for(const r of rings){if(r.max<=0)continue;r.life+=dt;const u=r.life/r.max;if(u>=1){r.m.visible=false;r.max=0;continue;}const k=1-Math.pow(1-u,3);r.m.scale.setScalar(Math.max(.01,r.R*k));r.m.material.opacity=.85*(1-u)*(1-u);}}
const cracks=[];for(let i=0;i<6;i++){const m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:crackTex,transparent:true,depthWrite:false,opacity:0,polygonOffset:true,polygonOffsetFactor:-2}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);cracks.push(m);}
let ci=0;function crackFX(x,z,size){const m=cracks[ci=(ci+1)%6];m.position.set(x,.35,z);m.scale.set(size,size,1);m.rotation.z=rnd()*6;m.material.opacity=.95;m.visible=true;}
function resetFX(){for(const p of pool){p.max=0;p.sp.visible=false;}for(const d of db)d.on=false;for(const r of rings){r.max=0;r.m.visible=false;}for(const c of cracks)c.visible=false;}

/* camera shake + screen flash state */
let trauma=0,flashAmt=0,flashPos=new T.Vector3();
function addTrauma(v){trauma=Math.min(1.6,trauma+v);}
function flash(v,pos){flashAmt=Math.max(flashAmt,v);if(pos)flashPos.copy(pos);}
function impactFX(pos,power){
  sparkBurst(pos.x,pos.y,pos.z,Math.round(70*power),70*power);
  dustBurst(pos.x,pos.z,Math.round(26*power),30*power,9*power,.7);
  ringFX(pos.x,pos.z,30*power,.9,0xffe2a0,Math.max(.8,pos.y*.0+.9));
  for(let i=0;i<8;i++)spawn(pos.x,pos.y,pos.z,rr(-6,6),rr(-6,6),rr(-6,6),{life:.5,s0:12*power,s1:30*power,a0:.9,color:0xfff2c8,add:true});
  addTrauma(.55*power);flash(.65*Math.min(power,1.3),pos);sfx.boom(power*.9);sfx.clang(power*.8);
}
function groundSlam(x,z,power){
  ringFX(x,z,150*power,1.8,0xe8c090,1.2);ringFX(x,z,95*power,1.3,0xffd9a0,1.2);
  dustBurst(x,z,90,55*power,16,.5);dustBurst(x,z,40,26*power,26,1.2);
  debrisBurst(x,z,60,58*power,2.8);crackFX(x,z,90*power);
  for(let i=0;i<30;i++){const a=rnd()*6.283;spawn(x+Math.cos(a)*10,2,z+Math.sin(a)*10,Math.cos(a)*70*power,rr(10,30),Math.sin(a)*70*power,{life:rr(2,3.5),s0:14,s1:42,a0:.5,drag:1.8,color:DUST});}
  addTrauma(1.1*power);flash(.35,new T.Vector3(x,8,z));sfx.boom(1.5*power);sfx.rumble(2.4,.8);
}
function footFX(pos,power,color){
  dustBurst(pos.x,pos.z,Math.round(10*power),12*power,4*power,.6);printFX(pos.x,pos.z,7*power);ringFX(pos.x,pos.z,18*power,.7,0xc89a70,.5);
  debrisBurst(pos.x,pos.z,Math.round(4*power),22*power,1.1);
  addTrauma(.1+.1*power);sfx.thud(.5*power);
}

/* ================= CAMERA SHOTS ================= */
const cc={HC:new T.Vector3(),KC:new T.Vector3(),HH:new T.Vector3(),KH:new T.Vector3(),M:new T.Vector3(),W:new T.Vector3(),sH:1};
const CK=[];
const S=(t,p,l,f,cut,z)=>CK.push({t,p,l,f,cut:!!cut,z:z||1});
S(0,c=>[c.HC.x+8.5*c.sH,c.HC.y+.2,c.HC.z+7.5*c.sH],c=>[c.HC.x,c.HC.y+.1*c.sH,c.HC.z],38,false,1.3);
S(2.8,c=>[c.HC.x+5.2*c.sH,c.HC.y+.3*c.sH,c.HC.z+6.5*c.sH],c=>[c.HC.x,c.HC.y+.55*c.sH,c.HC.z],32,false,1.3);
S(5.8,c=>[c.HC.x+20,2.5,c.HC.z+17],c=>[c.HC.x,c.HC.y*1.1,0],56,false,1.3);
S(8.6,c=>[c.HC.x+88,14,72],c=>[c.HC.x+2,17,0],42,false,1.3);
S(10.5,c=>[c.KC.x-112,7,56],c=>[c.KC.x,22,0],40,true);
S(14,c=>[c.KC.x-86,5,48],c=>[c.KC.x,25,0],36);
S(14.2,c=>[c.HC.x+34,10,72],c=>[c.HC.x+18,15,0],45,true,1.3);
S(17,c=>[c.HC.x+62,3,40],c=>[c.HC.x,20,0],52,false,1.3);
S(19,c=>[c.HC.x+16,3,26],c=>[c.HC.x+6,2.5,0],56,true,1.3);
S(20.9,c=>[c.HC.x+32,6,32],c=>[c.HC.x+8,5,0],50,false,1.3);
S(21,c=>[c.M.x,22,150],c=>[c.M.x,20,0],36,true);
S(22.5,c=>[c.M.x+4,12,120],c=>[c.M.x,24,0],33);
S(22.6,c=>[c.KC.x-30,4,36],c=>[c.KH.x,c.KH.y-4,0],46,true);
S(24.4,c=>[c.KC.x-27,7,28],c=>[c.KH.x,c.KH.y,0],36);
S(24.6,c=>[c.HC.x+22,16,26],c=>[c.HH.x,c.HH.y,0],34,true,1.3);
S(26.1,c=>[c.HC.x+30,20,38],c=>[c.HH.x+6,c.HH.y-2,0],40,false,1.3);
S(26.2,c=>[c.HC.x+36,22,98],c=>[(c.HC.x+c.KC.x)/2,22,0],38,true);
S(26.75,c=>[c.KC.x-26,22,48],c=>[c.KC.x,c.KC.y,0],32,true);
S(27.3,c=>[c.KC.x-58,14,82],c=>[c.KC.x,c.KC.y,0],40);
S(29,c=>[c.KC.x-72,30,112],c=>[c.KC.x+26,5,0],42);
S(29.2,c=>[112,3.5,78],c=>[125,7,0],50,true);
S(30.3,c=>[106,6,70],c=>[125,9,0],46);
S(30.4,c=>[c.HC.x+38,3,40],c=>[c.HH.x,c.HH.y-8,0],52,true,1.3);
S(32.1,c=>[c.HC.x+44,5,46],c=>[c.HH.x,c.HH.y-6,0],48,false,1.3);
S(32.2,c=>[c.KC.x-34,2,52],c=>[c.KC.x,c.KC.y*.9+6,0],52,true);
S(34.3,c=>[c.KC.x-40,5,58],c=>[c.KC.x,c.KC.y,0],46);
S(34.4,c=>[c.KC.x-22,28,30],c=>[c.KH.x,c.KH.y,0],40,true);
S(35.1,c=>[c.KC.x-24,26,34],c=>[c.KH.x,c.KH.y-2,0],34);
S(35.2,c=>[c.M.x,19,128],c=>[c.M.x,18,0],46,true);
S(37.3,c=>[c.M.x,20,112],c=>[c.M.x,20,0],42);
S(37.4,c=>[c.KC.x-56,26,62],c=>[c.KC.x-6,30,0],42,true);
S(38.0,c=>[c.KC.x-52,26,56],c=>[c.KC.x-8,30,0],38);
S(38.1,c=>[c.HC.x+16,24,62],c=>[c.HC.x+12,22,0],36,true,1.3);
S(38.5,c=>[c.HC.x+12,22,52],c=>[c.HC.x+8,21,0],32,false,1.3);
S(39.4,c=>[c.HC.x+12,20,38],c=>[c.HC.x+2,c.HC.y+12,0],30,false,1.3);
S(40.3,c=>[c.HC.x-30,12,48],c=>[c.HC.x+10,c.HC.y+9,0],38,true,1.3);
S(42,c=>[c.HC.x-22,16,26],c=>[c.HH.x,c.HH.y,0],28,false,1.3);
S(43.5,c=>[c.HC.x-18,17,22],c=>[c.HH.x,c.HH.y+1,0],24,false,1.3);
S(43.6,c=>[c.HC.x+46,2,40],c=>[c.HC.x,26,0],56,true,1.3);
S(45.1,c=>[c.HC.x+54,4,46],c=>[c.HC.x,27,0],50,false,1.3);
S(45.2,c=>[c.M.x,26,162],c=>[c.M.x,24,0],36,true);
S(46.85,c=>[c.M.x,20,124],c=>[c.M.x,22,0],34);
S(46.9,c=>[c.W.x,c.W.y+3,48],c=>[c.W.x,c.W.y,0],36,true);
S(48.8,c=>[c.W.x+10,c.W.y+9,38],c=>[c.W.x,c.W.y,0],32);
S(48.9,c=>[c.M.x,24,150],c=>[c.M.x,22,0],40,true);
S(50.2,c=>[c.HC.x+30,3,46],c=>[c.HH.x,c.HH.y-6,0],54,true,1.3);
S(51.2,c=>[c.HC.x+44,10,60],c=>[c.HH.x,c.HH.y,0],46,false,1.3);
S(52.3,c=>[c.KC.x-52,24,76],c=>[c.KH.x,c.KH.y,0],36,true);
S(53.9,c=>[c.M.x,20,140],c=>[c.M.x,22,0],40,true);
S(56,c=>[c.KC.x-40,3,50],c=>[c.KH.x,c.KH.y-4,0],50,true);
S(57.9,c=>[c.KC.x-26,24,30],c=>[c.KH.x,c.KH.y,0],30,true);
S(59.8,c=>[c.M.x,12,118],c=>[c.M.x,20,0],40,true);
S(61.3,c=>[c.HC.x+10,22,50],c=>[c.HC.x,c.HC.y,0],34,true,1.3);
S(62.8,c=>[c.HC.x+40,6,60],c=>[c.HH.x,c.HH.y-3,0],44,false,1.3);
S(64.6,c=>[c.M.x,28,160],c=>[c.M.x,20,0],38,true);
S(66.3,c=>[c.HC.x+28,10,44],c=>[c.HH.x,c.HH.y+1,0],30,true,1.3);
S(67.9,c=>[c.KC.x-28,10,44],c=>[c.KH.x,c.KH.y+1,0],30,true);
S(69.5,c=>[c.M.x,30,150],c=>[c.M.x,20,0],42,true);
S(71,c=>[c.M.x,5,100],c=>[c.M.x,22,0],46,true);
S(71.9,c=>[c.W.x,c.W.y+3,48],c=>[c.W.x,c.W.y,0],36,true);
S(73.6,c=>[c.W.x+10,c.W.y+9,38],c=>[c.W.x,c.W.y,0],32);
S(74.8,c=>[c.M.x,24,140],c=>[c.M.x,22,0],40,true);
S(75.4,c=>[c.W.x-8,c.W.y+2,46],c=>[c.W.x,c.W.y,0],34,true);
S(77.4,c=>[c.M.x,26,166],c=>[c.M.x,22,0],40,true);
S(80.3,c=>[c.M.x,7,100],c=>[c.M.x,20,0],46,true);
S(81.9,c=>[c.M.x,12,84],c=>[c.M.x,22,0],40);
S(82,c=>[c.M.x,26,66],c=>[c.M.x,22,0],34,true);
S(82.7,c=>[c.M.x+4,22,118],c=>[c.M.x,21,0],38,true);
S(84.3,c=>[c.HC.x+34,3,44],c=>[c.HH.x,c.HH.y-2,0],50,true,1.3);
S(86,c=>[c.KC.x-42,3,52],c=>[c.KH.x,c.KH.y-3,0],50,true);
S(87.5,c=>[c.M.x,12,120],c=>[c.M.x,20,0],42,true);
S(90,c=>[c.M.x+6,78,240],c=>[c.M.x,14,0],40);
function camAt(t){
  let i=0;while(i<CK.length-1&&CK[i+1].t<=t)i++;
  const a=CK[i],b=CK[Math.min(i+1,CK.length-1)];
  let p=a.p(cc),l=a.l(cc),f=a.f;
  if(b!==a&&!b.cut){const u=EASE.io(clamp((t-a.t)/(b.t-a.t),0,1)),pb=b.p(cc),lb=b.l(cc);p=p.map((v,j)=>lerp(v,pb[j],u));l=l.map((v,j)=>lerp(v,lb[j],u));f=lerp(f,b.f,u);}
  const z=a.z+(b!==a&&!b.cut?(b.z-a.z)*EASE.io(clamp((t-a.t)/(b.t-a.t),0,1)):0);
  if(z!==1)p=p.map((v,j)=>l[j]+(v-l[j])*z);
  return{p,l,f};
}

/* ================= SIMULATION ================= */
function applyPose(rig,p){
  const j=rig.joints;
  for(const k of JN){const v=p[k],o=j[k];o.rotation.set(v[0],v[1],v[2]*o.userData.sgn);}
  j.hips.position.y=1+p.bob[0];rig.tilt.rotation.x=p.tilt[0];
  j.wrA.rotation.set(p.wp[0]-(p.shA.rotation?0:p.shA[0]+p.elA[0]),0,0);j.wrB.rotation.set(0,0,0);
  j.anL.rotation.x=-(p.hips[0]+p.lgL[0]+p.knL[0])*.9;j.anR.rotation.x=-(p.hips[0]+p.lgR[0]+p.knR[0])*.9;
}
function walkOverlay(rig,ph,amp){
  const j=rig.joints,s=Math.sin(ph);
  j.lgL.rotation.x+=s*.75*amp;j.lgR.rotation.x-=s*.75*amp;
  j.knL.rotation.x+=Math.max(0,Math.sin(ph+1.3))*amp;j.knR.rotation.x+=Math.max(0,Math.sin(ph+1.3+Math.PI))*amp;
  j.shB.rotation.x+=-s*.55*amp;j.hips.rotation.y+=s*.14*amp;j.chest.rotation.y-=s*.2*amp;
  j.hips.position.y-=(1-Math.cos(.75*Math.abs(s)))*amp;
  j.anL.rotation.x-=s*.75*amp*.9;j.anR.rotation.x+=s*.75*amp*.9;
}
const ch={
  H:{rig:han,rk:HR,pk:HP,yaw:Math.PI/2,corr:[],phase:0,step:0,s:1,amp:t=>sstep(9.6,10.6,t)*(1-sstep(21.4,22.4,t))+sstep(31.6,32.4,t)*(1-sstep(36.4,37.2,t)),freq:t=>t<25?.4:.5},
  K:{rig:kum,rk:KR,pk:KP,yaw:-Math.PI/2,corr:[],phase:0,step:0,s:16,amp:t=>sstep(.2,1.2,t)*(1-sstep(21.4,22.4,t))+sstep(35,35.6,t)*(1-sstep(36.6,37.1,t))+sstep(60.4,60.9,t)*(1-sstep(61.5,61.9,t)),freq:t=>t<30?.27:.5}
};
function corrX(c,t){let s=0;for(const k of c.corr)s+=k.dx*sstep(k.TM-1,k.TM,t)*(1-sstep(k.TM+.3,k.TM+1.6,t));return s;}
function poseChar(c,t){
  const r=rootAt(c.rk,t),p=poseAt(c.pk,t),rt=c.rig.root;
  rt.position.set(r.x+corrX(c,t),r.y,0);rt.rotation.y=c.yaw;rt.scale.setScalar(r.s);c.s=r.s;
  applyPose(c.rig,p);return r;
}
const v1=new T.Vector3(),v2=new T.Vector3(),v3=new T.Vector3();
function footfall(c){
  c.rig.root.updateMatrixWorld(true);const j=c.rig.joints;j.anL.getWorldPosition(v1);j.anR.getWorldPosition(v2);
  const p=v1.y<v2.y?v1:v2,t0=trauma;footFX(p,c.s/12,0);
  trauma=t0+(trauma-t0)*clamp(1.15-camera.position.distanceTo(p)/420,.12,1);
}
const ROARS={H:[[8.3,2.4],[25.3,.7],[26.4,.5],[30.5,2],[44.2,2.4],[46.7,.5],[66.3,2.4],[71.5,.5],[75,.5],[81.7,.5]],K:[[22.9,2.7],[34.4,2],[37.7,.5],[40,2.3],[46.7,.5],[58,2.2],[66.9,2.4],[71.5,.5],[75,.5],[81.7,.5]]};
function jawAmt(c,t){let m=0;for(const r of ROARS[c===ch.H?'H':'K']){const u=(t-r[0])/r[1];if(u>0&&u<1)m=Math.max(m,Math.pow(Math.sin(Math.PI*u),.5)*(.75+.25*Math.sin(t*16)));}return m;}
function liveChar(c,t,dt,clock){
  poseChar(c,t);const rig=c.rig,j=rig.joints,amp=c.amp(t);
  if(amp>.001){c.phase+=dt*c.freq(t)*6.2832;walkOverlay(rig,c.phase,amp);const st=Math.floor((c.phase+1.5708)/3.1416);if(st!==c.step){c.step=st;if(amp>.5)footfall(c);}}
  const b=Math.sin(clock*2.1+(c===ch.K?1:0));
  j.chest.rotation.x+=b*.018;j.hips.position.y+=b*.004;
  let tr=0;
  if(c===ch.H)tr=sstep(38.5,38.8,t)*(1-sstep(43,44,t))*.9+sstep(47,47.2,t)*(1-sstep(48.8,49.2,t))*.5+sstep(62,62.2,t)*(1-sstep(65,66,t))*.8+sstep(72,72.2,t)*(1-sstep(73.6,74,t))*.4+sstep(75.5,75.7,t)*(1-sstep(77,77.6,t))*.5+sstep(82,82.2,t)*(1-sstep(85.5,86.5,t))*.6;
  else tr=sstep(47,47.2,t)*(1-sstep(48.8,49.2,t))*.4+sstep(53,53.2,t)*(1-sstep(56,57,t))*.7+sstep(72,72.2,t)*(1-sstep(73.6,74,t))*.4+sstep(75.5,75.7,t)*(1-sstep(77,77.6,t))*.5+sstep(82,82.2,t)*(1-sstep(85.5,86.5,t))*.6;
  if(tr>.001){for(const n of ['chest','hips','head','shA','shB','lgL','lgR']){const o=j[n];o.rotation.x+=(Math.random()-.5)*.07*tr;o.rotation.z+=(Math.random()-.5)*.05*tr;}
    rig.root.position.x+=(Math.random()-.5)*.9*tr;rig.root.position.z+=(Math.random()-.5)*.9*tr;trauma=Math.max(trauma,.22*tr);}
  rig.jaw.rotation.x=.03+jawAmt(c,t)*.55;
  rig.tail.forEach((tj,i)=>{tj.rotation.x=tj.userData.base+Math.sin(clock*1.8-i*.55)*(.04+.012*i)*(1+amp*1.4);tj.rotation.z=Math.sin(clock*1.3-i*.4)*.02*i;});
  rig.root.updateMatrixWorld(true);
}
/* align weapon heads with their targets at the moment of impact */
function calibrate(){
  const defs=[{c:ch.H,o:ch.K,TM:26.7,w:'chestM',off:5},{c:ch.K,o:ch.H,TM:38.4,w:'chestM',off:5},{c:ch.H,o:ch.K,TM:47,w:'weaponHead',off:0},{c:ch.H,o:ch.K,TM:53,w:'headM',off:4},{c:ch.K,o:ch.H,TM:62,w:'chestM',off:5},{c:ch.H,o:ch.K,TM:72,w:'weaponHead',off:0},{c:ch.H,o:ch.K,TM:75.5,w:'weaponHead',off:0},{c:ch.H,o:ch.K,TM:82,w:'chestM',off:5},{c:ch.K,o:ch.H,TM:82.55,w:'chestM',off:5}];
  ch.H.corr=[];ch.K.corr=[];
  for(const d of defs){
    poseChar(ch.H,d.TM);poseChar(ch.K,d.TM);ch.H.rig.root.updateMatrixWorld(true);ch.K.rig.root.updateMatrixWorld(true);
    d.c.rig.weaponHead.getWorldPosition(v1);d.o.rig[d.w].getWorldPosition(v2);
    const sg=Math.sign(d.c.rig.root.position.x-d.o.rig.root.position.x)||1;
    d.c.corr.push({TM:d.TM,dx:clamp(v2.x+sg*d.off-v1.x,-30,30)});
  }
}
const AUR=[[0,0],[1.5,0],[3,.5],[8.5,1],[11,.25],[37,.25],[38.4,.05],[43.2,.05],[43.8,1.3],[45.5,.55],[66,.5],[67,1.3],[69.5,.6],[90,.45]];
function auraAt(t){let i=0;while(i<AUR.length-1&&AUR[i+1][0]<=t)i++;const a=AUR[i],b=AUR[Math.min(i+1,AUR.length-1)];if(a===b)return a[1];return lerp(a[1],b[1],clamp((t-a[0])/(b[0]-a[0]),0,1));}

/* ---- armies & ambience ---- */
function knock(x,z,R,power){for(const s of standing){const dx=s.px-x,dz=s.pz-z,d=Math.hypot(dx,dz);if(d<R){const k=(1-d/R)*power;s.vx+=dx/(d||1)*k;s.vz+=dz/(d||1)*k;s.fall=Math.max(s.fall,.02);}}}
function refreshSoldier(s){const o={arr:true,n:Object.assign({},s.idx),a:s.a};soldier(s.a,s.px,s.y,s.pz,s.yaw,s.fall,s.seed,o);}
function markSets(){for(const a of SETS)for(const k in a)if(a[k])a[k].instanceMatrix.needsUpdate=true;}
function updateArmy(dt){
  const gs=[[han.root.position.x,han.root.position.z,ch.H.s*1.6],[kum.root.position.x,0,ch.K.s*1.8]];
  let budget=240,dirty=false;
  for(const s of standing){
    let moved=false;
    for(const g of gs){const dx=s.px-g[0];if(Math.abs(dx)>g[2])continue;const dz=s.pz-g[1],d=Math.hypot(dx,dz);if(d<g[2]){const k=1-d/g[2];s.vx+=dx/(d||1)*k*60*dt;s.vz+=dz/(d||1)*k*60*dt;s.fall=Math.max(s.fall,.02);moved=true;}}
    if(Math.abs(s.vx)+Math.abs(s.vz)>.03){s.px+=s.vx*dt;s.pz+=s.vz*dt;const k=Math.exp(-1.6*dt);s.vx*=k;s.vz*=k;moved=true;}
    if(s.fall>0&&s.fall<1){s.fall=Math.min(1,s.fall+dt*1.6);moved=true;}
    if(moved&&budget>0){budget--;refreshSoldier(s);dirty=true;}
  }
  if(dirty)markSets();
}
function resetArmy(){for(const s of standing){s.px=s.x;s.pz=s.z;s.fall=0;s.vx=s.vz=0;refreshSoldier(s);}markSets();}
function updateAmbience(dt,t,clock){
  skyMat.uniforms.time.value=clock;sky.position.copy(camera.position);glare.position.copy(camera.position).addScaledVector(SUN,2100);
  fireSites.forEach(f=>{f.t-=dt;if(f.t<0){f.t=rr(.5,1);const p=f.g.position;spawn(p.x,p.y+4,p.z,rr(3,8),rr(7,12),rr(-2,2),{life:rr(5,8),s0:6,s1:26,a0:.45,drag:.15,color:SMOKE});}});
  for(const sp of flames){const u=sp.userData,k=1+.22*Math.sin(clock*9+u.o)+.12*Math.sin(clock*17+u.o*2);sp.scale.setScalar(u.s*k);sp.material.opacity=.65+.25*Math.sin(clock*11+u.o);}
  fireSites.forEach(f=>f.fl.forEach((sp,k)=>sp.position.y=k*1.8+Math.sin(clock*6+sp.userData.o)*.4));
  const best=[];fireSites.forEach(f=>best.push([f.g.position.distanceToSquared(cc.M),f]));best.sort((a,b)=>a[0]-b[0]);
  fireLights.forEach((l,i)=>{const f=best[i][1];l.position.set(f.g.position.x,f.g.position.y+7,f.g.position.z);l.intensity=(1.5+.5*Math.sin(clock*12+i*2))*LK.point;});
  banners.forEach((b,i)=>{b.rotation.y=Math.sin(clock*2.2+i)*.22;});
  haze.forEach(h=>{h.position.x+=h.userData.vx*dt;if(h.position.x>520)h.position.x=-520;});
  birds.forEach(g=>{const u=g.userData;u.a+=u.sp*dt;g.position.set(u.cx+Math.cos(u.a)*u.r,u.h+Math.sin(clock*.7+u.ph)*4,Math.sin(u.a)*u.r*.6-40);g.rotation.y=-u.a+(u.sp>0?0:Math.PI);const f=Math.sin(clock*4.5+u.ph)*.55;u.j1.rotation.z=f;u.j2.rotation.z=-f;});
  for(const m of prints)if(m.visible){m.material.opacity-=dt*.003;if(m.material.opacity<=0)m.visible=false;}
  if(rnd()<.8)spawn(cc.M.x+rr(-130,130),rr(2,45),cc.M.z+rr(-90,90),rr(5,12),rr(2,9),rr(-3,3),{life:rr(3,5),s0:1.1,s1:.3,a0:1,color:EMBER,add:true,grav:-1});
  if(rnd()<.5)spawn(cc.M.x+rr(-160,160),rr(30,70),cc.M.z+rr(-100,100),rr(4,9),rr(-3,-1),rr(-2,2),{life:rr(5,8),s0:1.4,s1:1,a0:.5,color:0x2a2420,drag:.05});
}

/* ================= TIMELINE ================= */
let state='idle',TM=0,clock=0,hitStop=0,lastDrum=0,endShown=false;
const E_=[];const E=(t,f)=>E_.push([t,f]);let fired=[];
let hanAudio=null,hanAudioOK=false,roarAudio=null,roarOK=false,chalisaAudio=null;
function mkAudio(src,ok){try{const a=new Audio(src);a.preload='auto';a.addEventListener('canplaythrough',()=>ok(true));a.addEventListener('error',()=>ok(false));return a;}catch(e){return null;}}
function prime(a){if(!a)return;try{a.muted=true;const p=a.play();if(p&&p.then)p.then(()=>{a.pause();a.currentTime=0;a.muted=false;}).catch(()=>{a.muted=false;});else{a.pause();a.muted=false;}}catch(e){}}
function prepAudio(){
  if(!hanAudio){hanAudio=mkAudio(AUDIO_HANUMAN,v=>{hanAudioOK=v;});prime(hanAudio);}
  if(!roarAudio){roarAudio=mkAudio(AUDIO_ROAR,v=>{roarOK=v;});prime(roarAudio);}
}
function playChalisa(){
  /* Hanuman Chalisa: plays once from the very start to the very end of the track. */
  try{
    if(!chalisaAudio){chalisaAudio=new Audio(AUDIO_CHALISA);chalisaAudio.preload='auto';chalisaAudio.addEventListener('error',()=>console.warn('Chalisa audio failed to load:',AUDIO_CHALISA));}
    chalisaAudio.loop=false;chalisaAudio.volume=1;chalisaAudio.currentTime=0;
    const p=chalisaAudio.play();if(p&&p.catch)p.catch(e=>console.warn('Chalisa audio blocked:',e));
  }catch(e){}
}
function playTrack(a,ok){if(a&&ok){try{a.currentTime=0;a.volume=1;const p=a.play();if(p&&p.catch)p.catch(()=>{});return true;}catch(e){}}return false;}
function playHanuman(){return playTrack(hanAudio,hanAudioOK);}
function kumRoar(p){if(!playTrack(roarAudio,roarOK))sfx.roar(66,2.2,p||1.3);}
function stopTracks(){for(const a of [hanAudio,roarAudio,chalisaAudio]){try{if(a){a.pause();a.currentTime=0;}}catch(e){}}}
E(.05,()=>sfx.rumble(10,.35));
E(3,()=>{if(!playHanuman())sfx.swell();});
E(8.5,()=>{if(!hanAudioOK)sfx.roar(150,2.4,1.1);groundSlam(han.root.position.x,0,.6);ringFX(han.root.position.x,0,190,1.8,GOLD,1.5);flash(.5,cc.HC);knock(han.root.position.x,0,160,60);});
E(23,()=>{kumRoar(1.3);addTrauma(.7);ringFX(kum.root.position.x,0,120,1.4,0xff8a60,1.2);dustBurst(kum.root.position.x,0,40,30,12,.4);});
E(26.15,()=>sfx.whoosh(1.3));
E(26.7,()=>{impactFX(cc.KC,1.3);hitStop=.14;knock(cc.KC.x,0,90,45);flash(.9,cc.KC);});
E(29.4,()=>{groundSlam(kum.root.position.x,0,1.15);knock(kum.root.position.x,0,150,50);});
E(30.6,()=>{sfx.roar(160,2,1.2);addTrauma(.5);});
E(34.5,()=>{kumRoar(1.3);addTrauma(.6);});
E(37.9,()=>sfx.whoosh(1.5));
E(38.4,()=>{impactFX(cc.HC,1.5);hitStop=.18;addTrauma(.8);knock(cc.HC.x,0,80,35);});
E(40,()=>{kumRoar(1.2);addTrauma(.5);});
E(43.7,()=>{sfx.roar(170,2.4,1.3);ringFX(han.root.position.x,0,230,1.8,GOLD,1.5);ringFX(han.root.position.x,0,140,1.2,0xffffff,1.5);dustBurst(han.root.position.x,0,60,45,14,.6);flash(.85,cc.HC);addTrauma(1);knock(han.root.position.x,0,150,70);});
E(46.55,()=>sfx.whoosh(1.5));
E(47,()=>{impactFX(cc.W,1.6);hitStop=.16;ringFX(cc.W.x,cc.W.z,80,1.3,0xfff0c0,1.5);});
E(49.4,()=>{addTrauma(.7);dustBurst(han.root.position.x,0,30,26,10,.5);dustBurst(kum.root.position.x,0,30,26,10,.5);sfx.thud(1);});
E(50.3,()=>sfx.whoosh(.8));
E(51.4,()=>sfx.whoosh(1.3));
E(53,()=>{impactFX(cc.KH,1.6);hitStop=.2;flash(1,cc.KH);addTrauma(1);knock(cc.KH.x,0,130,55);});
E(54.3,()=>{groundSlam(han.root.position.x,0,.75);});
E(58,()=>{kumRoar(1.4);addTrauma(.7);ringFX(kum.root.position.x,0,130,1.4,0xff8a60,1.2);dustBurst(kum.root.position.x,0,40,30,12,.4);});
E(61.3,()=>sfx.whoosh(1.5));
E(62,()=>{impactFX(cc.HC,1.7);hitStop=.2;addTrauma(1);knock(cc.HC.x,0,110,50);});
E(63.3,()=>{groundSlam(han.root.position.x,0,.6);});
E(66.4,()=>{sfx.roar(165,2.4,1.3);ringFX(han.root.position.x,0,210,1.8,GOLD,1.5);ringFX(han.root.position.x,0,130,1.2,0xffffff,1.5);dustBurst(han.root.position.x,0,50,40,13,.6);flash(.7,cc.HC);addTrauma(.9);knock(han.root.position.x,0,140,60);});
E(67,()=>{kumRoar(1.4);ringFX(kum.root.position.x,0,160,1.6,0xff8a60,1.2);dustBurst(kum.root.position.x,0,50,36,13,.5);addTrauma(1);knock(kum.root.position.x,0,140,60);});
E(71.5,()=>sfx.whoosh(1.5));
E(72,()=>{impactFX(cc.W,1.6);hitStop=.16;ringFX(cc.W.x,cc.W.z,80,1.3,0xfff0c0,1.5);});
E(74.8,()=>sfx.whoosh(1.6));
E(75.5,()=>{impactFX(cc.W,1.8);hitStop=.18;ringFX(cc.W.x,cc.W.z,100,1.4,0xfff0c0,1.5);addTrauma(1.1);knock(cc.W.x,0,150,60);});
E(79.4,()=>{addTrauma(.7);dustBurst(han.root.position.x,0,30,26,10,.5);dustBurst(kum.root.position.x,0,30,26,10,.5);sfx.thud(1);});
E(81.3,()=>sfx.whoosh(1.6));
E(82,()=>{impactFX(cc.KC,1.7);hitStop=.2;flash(1,cc.KC);addTrauma(1);knock(cc.KC.x,0,120,50);});
E(82.55,()=>{impactFX(cc.HC,1.7);hitStop=.22;flash(1,cc.HC);addTrauma(1.2);ringFX(cc.M.x,0,140,1.6,0xfff0c0,1.5);knock(cc.HC.x,0,140,60);});
E(84.3,()=>{groundSlam(han.root.position.x,0,.8);groundSlam(kum.root.position.x,0,1);});
E(87.4,()=>{sfx.rumble(5,1.1);addTrauma(.9);});
function drumBeat(t){const iv=t<20?.9:t<36?.65:.5;if(clock-lastDrum>iv){lastDrum=clock;sfx.drum(t<10?.4:.8);}}

function stepSim(dtr,dt){
  const simT=TM;
  liveChar(ch.H,simT,dt,clock);liveChar(ch.K,simT,dt,clock);
  han.chestM.getWorldPosition(cc.HC);kum.chestM.getWorldPosition(cc.KC);han.headM.getWorldPosition(cc.HH);kum.headM.getWorldPosition(cc.KH);
  han.weaponHead.getWorldPosition(v1);kum.weaponHead.getWorldPosition(v2);cc.W.copy(v1).add(v2).multiplyScalar(.5);
  cc.M.copy(cc.HC).add(cc.KC).multiplyScalar(.5);cc.M.y=0;cc.sH=ch.H.s;
  if(state==='play'){
    for(let i=0;i<E_.length;i++)if(!fired[i]&&E_[i][0]<=TM){fired[i]=true;try{E_[i][1]();}catch(e){}}
    const env=sstep(3,4.2,TM)*(1-sstep(8.4,9,TM));if(env>0)trauma=Math.max(trauma,.34*env);
    if(TM>86)trauma=Math.max(trauma,.2*sstep(86,87,TM));
    if(TM>84.5&&rnd()<.5)spawn(cc.M.x+rr(-90,90),rr(40,80),rr(-40,40),rr(-2,2),rr(-12,-4),rr(-2,2),{life:rr(2,4),s0:6,s1:16,a0:.35,color:DUST});
    if(TM>=87.6&&!endShown){endShown=true;$('capT').textContent='THE BATTLEFIELD TREMBLES';$('cap').classList.add('on');}
    drumBeat(TM);
  }
  const a=auraAt(simT);
  han.aura.material.opacity=Math.min(1,a*.75);han.aura.scale.setScalar(5+a*3.5);matFurH.emissiveIntensity=Math.min(.5,a*.32);furTuftH.emissiveIntensity=Math.min(.6,a*.4);
  han.eyeMat.emissiveIntensity=.7+a*2.2;kum.eyeMat.emissiveIntensity=1.2+.5*Math.sin(clock*3)+(simT>22&&simT<25?1:0);
  matGold.emissiveIntensity=.5+a*.9;
  auraLight.position.copy(cc.HC);auraLight.intensity=a*(1.2+ch.H.s*.4)*LK.point;auraLight.distance=40+ch.H.s*14;
  const f=simT<10.5?cc.HC:simT<14.2?cc.KC:simT<21?cc.HC:cc.M;
  sun.position.set(f.x+SUN.x*500,SUN.y*500+30,f.z+SUN.z*500);sun.target.position.set(f.x,0,f.z);sun.target.updateMatrixWorld();
  fill.position.set(f.x+60,90,f.z+300);fill.target.position.set(f.x,10,f.z);fill.target.updateMatrixWorld();
  const cm=camAt(simT),p=cm.p,l=cm.l;
  const dist=Math.hypot(p[0]-l[0],p[1]-l[1],p[2]-l[2]),ampS=clamp(dist*.03,.15,5),am=trauma*trauma;
  const sh=fq=>Math.sin(clock*fq)+Math.sin(clock*fq*1.7+1.3),hand=dist*.003*(state==='idle'?2.2:1);
  camera.position.set(p[0]+sh(41)*am*ampS+sh(1.3)*hand,Math.max(1.4,Math.max(1.2,p[1])+sh(37)*am*ampS*.8+sh(1.7)*hand*.6),p[2]+sh(43)*am*ampS+sh(1.1)*hand);
  camera.up.set(0,1,0);camera.lookAt(l[0],l[1],l[2]);camera.rotateZ(sh(29)*am*.03);
  const fv=cm.f+trauma*3;if(Math.abs(camera.fov-fv)>.01){camera.fov=fv;camera.updateProjectionMatrix();}
  trauma=Math.max(0,trauma-dtr*.85);
  flashLight.position.set(flashPos.x,flashPos.y+12,flashPos.z);flashLight.intensity=flashAmt*7*LK.point;
  $('flash').style.opacity=Math.min(.6,flashAmt*.55);flashAmt*=Math.exp(-dtr*5.5);if(flashAmt<.004)flashAmt=0;
  updateParticles(dt);updateRings(dt);updateDebris(dt);updateArmy(dt);updateAmbience(dt,simT,clock);
  for(const c of cracks){if(c.visible){c.material.opacity-=dtr*.02;if(c.material.opacity<=0)c.visible=false;}}
}
function resetSim(){
  TM=0;hitStop=0;fired=[];lastDrum=clock;trauma=0;flashAmt=0;endShown=false;
  ch.H.phase=ch.K.phase=0;ch.H.step=ch.K.step=0;
  resetFX();resetArmy();for(const m of prints)m.visible=false;
  $('cap').classList.remove('on');$('end').classList.remove('on');stopTracks();
}
function start(){
  auInit();if(AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume();prepAudio();
  resetSim();state='play';
  playChalisa();
  $('boot').classList.add('off');$('bars').classList.add('on');
}
function finish(){state='done';later(()=>{if(state==='done')$('end').classList.add('on');},2500);}

calibrate();
resetSim();state='idle';
let last=performance.now(),raf=0;
function frame(now){
  if(!alive)return;
  raf=requestAnimationFrame(frame);
  const dtr=Math.min(.05,(now-last)/1000);last=now;clock+=dtr;
  let ts=1;if(hitStop>0){hitStop-=dtr;ts=.06;}
  const dt=dtr*ts;
  if(state==='play'){TM+=dt;if(TM>=DURATION){TM=DURATION;finish();}}
  try{stepSim(dtr,dt);renderer.render(scene,camera);}catch(e){const b=$('err');if(b){b.style.display='block';b.textContent='Runtime error: '+(e&&e.stack||e);}alive=false;throw e;}
}
raf=requestAnimationFrame(frame);

function destroy(){
  alive=false;cancelAnimationFrame(raf);timers.forEach(clearTimeout);
  window.removeEventListener('resize',resize);stopTracks();
  try{if(AU.ctx)AU.ctx.close();}catch(e){}
  scene.traverse(o=>{if(o.geometry)o.geometry.dispose();const m=o.material;if(m){(Array.isArray(m)?m:[m]).forEach(mm=>{for(const k in mm){const v=mm[k];if(v&&v.isTexture)v.dispose();}mm.dispose();});}});
  renderer.dispose();try{renderer.forceContextLoss();}catch(e){}try{canvas.remove();}catch(e){}
}
const api={start,destroy};
if(opts.debug)api.__debug={cc,ch,camera,han,kum,poseChar,calibrate,get TM(){return TM;},set TM(v){TM=v;},get state(){return state;},frame,CK,AU};
return api;
}