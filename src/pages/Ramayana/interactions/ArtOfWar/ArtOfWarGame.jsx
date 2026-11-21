import React,{useState,useEffect,useRef} from "react";
import * as THREE from "three";
import { createPortal } from "react-dom";
import "./ArtOfWarGame.css";

/* Chapter XIX · The Art of War — five formations, five decisions.
   Props: onComplete / onExit (both simply close the modal and return to the story). */

const h=React.createElement;
const LP=parseInt(THREE.REVISION)>=155?Math.PI:1; // keep lighting identical on old and new three.js
const d=(c,p,...k)=>h('div',{className:c,...p},...k);
const N=240,S=1.1,D=9;
/* ---------- formation geometry (y<0 = toward the enemy) ---------- */
const blk=(w,dp,ox=0,oy=0)=>{const a=[];for(let j=0;j<dp;j++)for(let i=0;i<w;i++)a.push([(i-(w-1)/2)*S+ox,j*S+oy]);return a};
const ring=(r,oy)=>{const n=Math.max(1,Math.round(6.283*r/S));return Array.from({length:n},(_,i)=>[Math.cos(i/n*6.283)*r,Math.sin(i/n*6.283)*r+oy])};
const rings=(rs,oy)=>[[0,oy],...rs.flatMap(r=>ring(r,oy))];
const wedge=(rows,ox,oy)=>{const a=[];for(let j=0;j<rows;j++)for(let i=0;i<=j;i++)a.push([(i-j/2)*S+ox,j*S+oy]);return a};
const wing=(sg,n,th,x0,x1,y0,dy)=>Array.from({length:n}).flatMap((_,k)=>Array.from({length:th},(_,m)=>[sg*(x0+k/n*(x1-x0)),y0-k/n*dy+m*S]));
const fit=a=>{if(a.length>N)return Array.from({length:N},(_,i)=>a[Math.floor(i*a.length/N)]);const o=a.slice();for(let k=0;o.length<N;k++){const p=a[(k*7)%a.length];o.push([p[0]+(Math.random()-.5)*.9,p[1]+(Math.random()-.5)*.9])}return o};
const disc=oy=>[[0,oy],...Array.from({length:8},(_,k)=>ring((k+1)*S,oy)).flat()];
const RESERVE=fit(blk(30,8,0,16));
const ENEMY=[
{name:'Vajra Vyuha',sub:'The Thunderbolt',cap:'A strong, concentrated defensive arrangement.',look:'A dense block of shields, twenty ranks wide, with a heavy prow at its centre. Its mass is immense — look at its edges.',pts:fit([...blk(20,10),...blk(6,3,0,-3.3)])},
{name:'Garuda Vyuha',sub:'The Great Eagle',cap:'A wide formation with extended wings.',look:'A compact body with two long wings sweeping forward, ready to close around anything that engages the centre.',pts:fit([...blk(6,14,0,2),...wing(-1,40,2,3.5,25.5,3,9),...wing(1,40,2,3.5,25.5,3,9)])},
{name:'Chakra Vyuha',sub:'The Turning Wheel',cap:'A layered, circular formation.',look:'Concentric rings around a hidden core. Each layer guards the one within it, and the gaps between them are deep.',pts:fit(rings([3,6.5,10,13.5,17],10))},
{name:'Suchi Vyuha',sub:'The Needle',cap:'A narrow, concentrated advancing formation.',look:'Six abreast and forty deep: a single narrow column aimed at the heart of your line.',pts:fit(blk(6,40))},
{name:'The Final Formation',sub:'The Storm of Lanka',cap:'A complex battlefield arrangement.',look:'A ringed core, spread wings and a spear-point at its head. Study how each part supports the others — and where they do not.',pts:fit([...rings([2.2,4.4,6.6,8.8],14),...wing(-1,16,2,10,26,14,10),...wing(1,16,2,10,26,14,10),...blk(3,10,0,-6)])}];
const C=[
{name:'Mandala',sub:'The Circle',desc:'Faces every direction at once. Hard to surround, slow to press forward.',pts:fit(disc(8))},
{name:'Ardhachandra',sub:'The Crescent',desc:'Curved horns reach forward to hug and bend an enemy’s front.',pinch:1,pts:fit([0,1,2,3,4].flatMap(k=>{const R=22+k*S,n=Math.round(2.4*R/S);return Array.from({length:n},(_,i)=>{const t=(i/(n-1)-.5)*2.4;return[R*Math.sin(t),-22+R*Math.cos(t)]})}))},
{name:'Shringataka',sub:'The Twin Horns',desc:'Two wedges flank a thin centre and strike the sides together.',pinch:1,pts:fit([...wedge(13,-9,-2),...wedge(13,9,-2),...blk(6,6,0,4)])},
{name:'Danda',sub:'The Staff',desc:'A broad, deep line with reserves. Matches width and absorbs thrusts.',pts:fit(blk(40,6))},
{name:'Shakata',sub:'The Wagon',desc:'A dense, deep block with a shielded prow. Immovable at the centre.',pts:fit([...blk(14,14),...[0,1,2,3,4].flatMap(k=>blk(2+2*k,1,0,-(5-k)*S))])}];
/* score: 0 disadvantage, 1 partial, 2 advantage — index = counter */
const SC=[[0,1,2,0,0],[2,1,0,1,0],[1,2,1,1,0],[1,1,0,1,2],[1,1,1,2,0]];
const STORY=[
['Meeting the Vajra on its own terms, you ran into its densest ranks. The thunderbolt’s full weight fell on you undivided.','You pressed the Vajra’s edges, but your line was not built to split its mass. The block ground forward and held.','Your formation struck the Vajra’s thin flanks and divided its concentrated weight in two. Its strongest point never met your line.'],
['The Garuda’s wings swept round your formation and closed behind it. Your army fought on every side and was surrounded.','You held the centre, but the wings swept past your outer ranks and pressed in from behind.','Your formation faced every direction at once. The Garuda’s wings swept round and found no open flank to close upon.'],
['You drove into the Chakra and its rings closed behind you, grinding your army down from every side.','You made contact without being trapped, but the layered rings absorbed your pressure and re-formed.','You hugged the outer ring and engaged it piece by piece, never entering the maze of layers.'],
['The Suchi’s spearhead pierced your centre and the column poured through the gap, splitting your army in two.','You slowed the Suchi’s head, but the column kept enough force to bend your line.','Your formation plugged the centre. The Suchi’s narrow head spent its force against a wall that would not part.'],
['The Final Formation used its wings and core against your weak points. Each part of it covered another, and you could not reach its heart.','You answered some of its elements, but the wings or the spear still found a flank to exploit.','You matched the wings with breadth, met the spear with depth, and wore the layered core down without overextending.']];
const NOTE=['Your Mandala guarded every side, though it struggled to press forward.','The Ardhachandra’s horns reached forward, but thinned its middle.','The Shringataka’s wedges struck the sides, yet left its centre light.','The Danda gave breadth and depth, but little speed.','The Shakata held firm at its centre but could not turn quickly to its flanks.'];
const VN=['STRATEGIC DISADVANTAGE','PARTIAL ADVANTAGE','STRATEGIC ADVANTAGE'];
const RL=['First Contact','The Wide Wings','The Layered Wheel','The Needle’s Thrust','The Final Test'];
const TIER=[[9,'Senapati — Grand Strategist','You read each formation by its structure, not its name. Lord Rama’s council would seat you at the table.'],[6,'Rana-Nayaka — Battle Tactician','Your instincts are sound. A few formations still slipped past your reading of their weak points.'],[3,'Sainika — Field Commander','You can hold a line, but the enemy’s structure often decided the fight. Study how shape meets shape.'],[0,'Shishya — Apprentice of War','Every defeat teaches a formation. Return to the field and look at where each army is thin.']];
/* ---------- procedural battle audio (WebAudio, no files) ---------- */
const SFX=(()=>{let ac,mg,nb,T=[],wd=null,muted=false;
const init=()=>{if(ac){ac.resume();return}ac=new(window.AudioContext||window.webkitAudioContext)();mg=ac.createGain();mg.gain.value=muted?0:.7;mg.connect(ac.destination);nb=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const a=nb.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1};
const env=(g,t,a,d,v)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.001,t+a+d)};
const nz=(f,q,type,v,a,d,dl=0)=>{if(!ac)return;const t=ac.currentTime+dl,s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;s.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q;env(g,t,a,d,v);s.connect(fl);fl.connect(g);g.connect(mg);s.start(t,Math.random());s.stop(t+a+d+.05)};
const tn=(f,f2,type,v,a,d,dl=0)=>{if(!ac)return;const t=ac.currentTime+dl,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f2,t+a+d);env(g,t,a,d,v);o.connect(g);g.connect(mg);o.start(t);o.stop(t+a+d+.05)};
const drum=()=>{tn(120,42,'sine',.9,.005,.4);nz(180,1,'lowpass',.5,.005,.18)};
const clash=()=>{nz(2500+Math.random()*3500,6,'bandpass',.35,.002,.14);tn(900+Math.random()*500,500,'square',.05,.002,.1);nz(300,.8,'lowpass',.3,.002,.2)};
const roar=(d=0)=>{nz(500,.9,'bandpass',.5,.5,.9,d);nz(900,1.4,'bandpass',.25,.6,.9,d)};
const horn=(f,d,len)=>{[1,1.006].forEach(m=>tn(f*m,f*m*1.02,'sawtooth',.06,.4,len,d));tn(f/2,f/2,'triangle',.12,.4,len,d)};
const halt=()=>{T.forEach(clearTimeout);T=[]};
const ambient=on=>{if(!ac)return;if(!on){wd&&wd.stop();wd=null;return}if(wd)return;const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain(),l=ac.createOscillator(),lg=ac.createGain();s.buffer=nb;s.loop=true;f.type='lowpass';f.frequency.value=380;g.gain.value=.07;l.frequency.value=.13;lg.gain.value=.04;l.connect(lg);lg.connect(g.gain);s.connect(f);f.connect(g);g.connect(mg);s.start();l.start();wd={stop(){s.stop();l.stop()}}};
const battle=s=>{if(!ac)return;halt();horn(130,0,1.8);horn(195,.05,1.6);roar(.6);
for(let t=.4;t<10.4;t+=.55)T.push(setTimeout(drum,t*1000));
for(let t=2;t<9.6;t+=.2)if(Math.random()<.3+.6*Math.sin(Math.PI*(t-2)/7.6))T.push(setTimeout(()=>{clash();Math.random()<.2&&roar()},t*1000));
T.push(setTimeout(()=>{if(s===2)[262,330,392].forEach((f,i)=>horn(f,i*.18,1.6));else if(s===0)[196,165,131].forEach((f,i)=>horn(f,i*.25,1.5));else horn(220,0,1.4)},9600))};
return{init,halt,amb:ambient,battle,tick:()=>tn(660,880,'triangle',.08,.005,.12),mute:m=>{muted=m;if(mg)mg.gain.value=m?0:.7},stop:()=>{halt();ambient(false)},destroy:()=>{halt();ambient(false);try{ac&&ac.close()}catch(e){}ac=null}}})();
/* ---------- diagram ---------- */
function Dia({pts,flip,c}){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),s=Math.min(90/(x1-x0+1),58/(y1-y0+1));
return h('svg',{viewBox:'0 0 100 66','aria-hidden':true},pts.map((p,i)=>h('circle',{key:i,cx:50+(p[0]-(x0+x1)/2)*s,cy:33+(flip?-1:1)*(p[1]-(y0+y1)/2)*s,r:Math.max(.8,s*.44),fill:c})))}
function mk(parts){const P=[],Nn=[],Cl=[];parts.forEach(([g,c,x,y,z,sx=1,sy=1,sz=1,rx=0,rz=0])=>{const q=g.clone().toNonIndexed();q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,rz)),new THREE.Vector3(sx,sy,sz)));const pa=q.attributes.position.array,na=q.attributes.normal.array,cc=new THREE.Color(c);for(let i=0;i<pa.length;i+=3){P.push(pa[i],pa[i+1],pa[i+2]);Nn.push(na[i],na[i+1],na[i+2]);Cl.push(cc.r,cc.g,cc.b)}});const B=new THREE.BufferGeometry();B.setAttribute('position',new THREE.Float32BufferAttribute(P,3));B.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));B.setAttribute('color',new THREE.Float32BufferAttribute(Cl,3));return B}
/* ---------- 3D battlefield ---------- */
function Field({api}){const ref=useRef();useEffect(()=>{
const el=ref.current,R=new THREE.WebGLRenderer({antialias:true});const cm=THREE.ColorManagement,cmOn=cm&&cm.enabled;if(cm)cm.enabled=false;if('outputColorSpace' in R)R.outputColorSpace=THREE.LinearSRGBColorSpace;R.setPixelRatio(Math.min(devicePixelRatio,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.15;el.appendChild(R.domElement);
const sc=new THREE.Scene();sc.fog=new THREE.Fog(0xd9cfae,110,560);
const cam=new THREE.PerspectiveCamera(48,1,.5,1400);
const rs=()=>{const w=el.clientWidth||innerWidth,hh=el.clientHeight||innerHeight;R.setSize(w,hh,false);cam.aspect=w/hh;cam.updateProjectionMatrix()};rs();addEventListener('resize',rs);const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(rs):null;if(ro)ro.observe(el);
sc.add(new THREE.Mesh(new THREE.SphereGeometry(1000,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;float hs(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5);}float nz(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}void main(){vec3 n=normalize(p);float t=clamp(n.y*1.7,0.,1.);vec3 c=mix(vec3(1.,.8,.55),vec3(.2,.44,.84),pow(t,.5));vec2 u=n.xz/(n.y+.3)*2.4;float cl=nz(u)*.55+nz(u*2.1)*.3+nz(u*4.3)*.15;cl=smoothstep(.48,.85,cl)*smoothstep(0.,.2,n.y);c=mix(c,vec3(1.,.93,.84),cl*.9);float s=max(dot(n,normalize(vec3(-.5,.3,-.81))),0.);c+=vec3(1.,.75,.4)*(pow(s,500.)*4.+pow(s,14.)*.4);gl_FragColor=vec4(c,1.);}'})));
sc.add(new THREE.HemisphereLight(0xd6e6ff,0x8a7440,.95*LP));
const sun=new THREE.DirectionalLight(0xffe2a8,1.5*LP);sun.position.set(-90,55,-140);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const sh=sun.shadow.camera;sh.left=sh.bottom=-90;sh.right=sh.top=90;sh.near=10;sh.far=400;sun.shadow.bias=-.0006;sc.add(sun);const fill=new THREE.DirectionalLight(0xa8c4ff,.45*LP);fill.position.set(60,40,80);sc.add(fill);
/* terrain */
const tg=new THREE.PlaneGeometry(760,760,120,120);tg.rotateX(-Math.PI/2);const P=tg.attributes.position,col=[];
for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i),n=Math.sin(x*.07)*Math.cos(z*.05)+Math.sin(x*.19+z*.13)*.4,far=Math.max(0,Math.abs(x)-75)*.14,m=.5+.5*Math.sin(x*.3)*Math.cos(z*.23),mud=Math.max(0,1-Math.hypot(x/64,z/58));
P.setY(i,z<-235?-4:(far>0?far*(1+n*.5):0)+n*.1);const nn=Math.sin(x*.45+z*.2)*Math.sin(z*.37-x*.11),dd=Math.min(1,mud*1.6+Math.max(0,nn)*.25),gg=.5+.5*m;col.push(.26+.2*gg+dd*(.42-.26-.2*gg)+nn*.02,.36+.08*gg+dd*(.3-.36-.08*gg),.13+.07*gg+dd*(.18-.13-.07*gg))}
tg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));tg.computeVertexNormals();const ground=new THREE.Mesh(tg,new THREE.MeshLambertMaterial({vertexColors:true}));ground.receiveShadow=true;sc.add(ground);
const cy=(a,b,l)=>new THREE.CylinderGeometry(a,b,l,6),sp=r=>new THREE.SphereGeometry(r,6,4),bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c),cn=(r,l)=>new THREE.ConeGeometry(r,l,5);
const tmp=new THREE.Object3D(),rnd=Math.random,hY=x=>Math.max(0,Math.abs(x)-75)*.14;
const TM=new THREE.InstancedMesh(mk([[cy(.3,.4,3),0x5a3d22,0,1.5,0],[sp(1.9),0x2f5a22,0,4.2,0,1,1.1,1],[sp(1.4),0x3d6e2b,.9,5.1,.3],[sp(1.3),0x2a4f20,-.9,3.6,-.2]]),new THREE.MeshLambertMaterial({vertexColors:true}),170);
for(let k=0;k<170;){const x=(55+rnd()*200)*(rnd()<.5?-1:1),z=-215+rnd()*290;if(z<-130&&Math.abs(x)<95)continue;const s=1+rnd()*1.4;tmp.position.set(x,hY(x),z);tmp.rotation.set(0,rnd()*6,0);tmp.scale.set(s,s*(.9+rnd()*.5),s);tmp.updateMatrix();TM.setMatrixAt(k++,tmp.matrix)}sc.add(TM);
const RM=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:0x8a8070,flatShading:true}),70);
for(let k=0;k<70;k++){const x=(26+rnd()*100)*(rnd()<.5?-1:1),z=-120+rnd()*180,s=.5+rnd()*1.6;tmp.position.set(x,s*.3,z);tmp.rotation.set(rnd()*3,rnd()*3,0);tmp.scale.set(s,s*.6,s);tmp.updateMatrix();RM.setMatrixAt(k,tmp.matrix)}sc.add(RM);
const GM=new THREE.InstancedMesh(new THREE.ConeGeometry(.1,.8,4),new THREE.MeshLambertMaterial({color:0x7a9230}),2600);
for(let k=0;k<2600;k++){const x=(rnd()-.5)*150,z=-150+rnd()*230;tmp.position.set(x,.35,z);tmp.rotation.set((rnd()-.5)*.4,0,(rnd()-.5)*.4);tmp.scale.setScalar(Math.hypot(x/60,z/55)<1?0:.6+rnd());tmp.updateMatrix();GM.setMatrixAt(k,tmp.matrix)}sc.add(GM);
const sea=new THREE.Mesh(new THREE.PlaneGeometry(1400,500),new THREE.MeshLambertMaterial({color:0x3b86ad,emissive:0x0a2a40}));sea.rotation.x=-Math.PI/2;sea.position.set(0,-1.6,-480);sc.add(sea);
for(let i=0;i<18;i++){const s=i%2?-1:1,m=new THREE.Mesh(new THREE.ConeGeometry(40+Math.random()*40,45+Math.random()*60,7),new THREE.MeshLambertMaterial({color:0x56684a,flatShading:true}));m.position.set(s*(110+Math.random()*170),15,-30-Math.random()*190);sc.add(m)}
/* Golden Lanka */
const gold=new THREE.MeshStandardMaterial({color:0xe6b34a,metalness:.7,roughness:.35,emissive:0x7a4408,emissiveIntensity:.6}),wl=new THREE.MeshLambertMaterial({color:0xefe0b8});
const L=new THREE.Group(),add=(m,x,y,z)=>{m.position.set(x,y,z);L.add(m);return m};
add(new THREE.Mesh(new THREE.CylinderGeometry(48,72,14,36),new THREE.MeshLambertMaterial({color:0x6f7d45})),0,5,0);
add(new THREE.Mesh(new THREE.CylinderGeometry(44,46,7,44,1,true),new THREE.MeshLambertMaterial({color:0xefe0b8,side:THREE.DoubleSide})),0,14,0);
for(let i=0;i<54;i++){const a=i/54*6.283,r=14+Math.random()*30,hh=8+Math.random()*18,x=Math.cos(a)*r,z=Math.sin(a)*r*.75;add(new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.9,hh,8),wl),x,12+hh/2,z);add(new THREE.Mesh(new THREE.ConeGeometry(2.5,5.5,8),gold),x,12+hh+2.7,z)}
[[20,8],[14,8],[9,8]].forEach(([w,hh],k)=>add(new THREE.Mesh(new THREE.BoxGeometry(w,hh,w),k%2?gold:wl),0,16+k*8,0));
add(new THREE.Mesh(new THREE.SphereGeometry(6,16,10,0,6.283,0,1.6),gold),0,40,0);add(new THREE.Mesh(new THREE.ConeGeometry(1.2,12,8),gold),0,52,0);
L.scale.setScalar(1.7);L.position.set(0,0,-205);sc.add(L);const gl=new THREE.PointLight(0xffc15a,1.2*LP,300,1);gl.position.set(0,90,-170);sc.add(gl);
/* armies */
const hg=bx(.01,.01,.01),F=0xe3b565,F2=0xc98a3c,GD=0xf2c14e,SK=0x3d4a73,IR=0x2a2428,BN=0xeadfc8,CR=0x7a1420;
const VG=mk([[cy(.11,.09,.6),F2,-.12,.3,0],[cy(.11,.09,.6),F2,.12,.3,0],[cy(.26,.31,.28),0xb3202a,0,.66,0],[cy(.24,.2,.55),F,0,.98,0],[bx(.62,.09,.34),GD,0,1,0,1,1,1,0,.75],[cy(.07,.06,.5),F,-.32,.95,0,1,1,1,0,.3],[cy(.07,.06,.5),F,.32,.95,0,1,1,1,0,-.3],[sp(.21),F,0,1.42,-.02],[sp(.15),0x20150f,0,1.4,.11],[sp(.07),F,-.21,1.44,0],[sp(.07),F,.21,1.44,0],[cy(.22,.22,.06),GD,0,1.55,0],[cy(.045,.04,.45),F,0,.72,-.3,1,1,1,-1,0],[cy(.045,.04,.45),F,0,1.08,-.5,1,1,1,-.1,0],[cy(.045,.04,.4),F,0,1.42,-.46,1,1,1,.7,0],[sp(.07),0x7a4a1c,0,1.62,-.38],[cy(.03,.03,.95),0x5a3a1c,.4,1.15,.12],[sp(.14),GD,.4,1.68,.12]]);
const EG=mk([[cy(.14,.11,.7),SK,-.16,.35,0],[cy(.14,.11,.7),SK,.16,.35,0],[cy(.34,.4,.32),CR,0,.78,0],[cy(.34,.3,.72),SK,0,1.25,0],[bx(.66,.52,.42),IR,0,1.3,.02],[cy(.33,.33,.07),GD,0,.95,0],[sp(.19),IR,-.44,1.55,0],[sp(.19),IR,.44,1.55,0],[cn(.06,.22),BN,-.44,1.75,0],[cn(.06,.22),BN,.44,1.75,0],[cy(.1,.08,.62),SK,-.47,1.15,0,1,1,1,0,.15],[cy(.1,.08,.62),SK,.47,1.15,0,1,1,1,0,-.15],[sp(.25),SK,0,1.83,0],[sp(.04),0xff2a1a,-.1,1.87,.21],[sp(.04),0xff2a1a,.1,1.87,.21],[cn(.04,.17),BN,-.09,1.7,.2,1,1,1,3.14],[cn(.04,.17),BN,.09,1.7,.2,1,1,1,3.14],[cn(.06,.38),0x241a14,-.16,2.1,0,1,1,1,0,.45],[cn(.06,.38),0x241a14,.16,2.1,0,1,1,1,0,-.45],[cy(.03,.03,1.9),0x4a4a4a,.58,1.1,.15],[cn(.08,.3),0xcfd3d8,.58,2.18,.15]]);
function army(geo,ch,scale,flag){const m1=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({vertexColors:true}),N),m2=new THREE.InstancedMesh(hg,new THREE.MeshBasicMaterial(),N),Cc=new THREE.Color();m1.castShadow=true;m2.visible=false;
for(let i=0;i<N;i++){m1.setColorAt(i,Cc.setScalar(.82+Math.random()*.36));m2.setColorAt(i,Cc)}
const g=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,10,6),new THREE.MeshLambertMaterial({color:0x4a3418})),fl=new THREE.Mesh(new THREE.PlaneGeometry(3.6,2.3),new THREE.MeshLambertMaterial({color:flag,side:THREE.DoubleSide,emissive:flag,emissiveIntensity:.25}));
pole.position.y=5;fl.position.set(1.8,8.8,0);g.add(pole,fl);sc.add(m1,m2,g);return{m1,m2,g,fl,x:new Float32Array(N),z:new Float32Array(N),T:new Float32Array(N).fill(9),base:RESERVE,scale,win:0,sq:0,pz:0}}
const V=army(VG,0,1.15,0xf08a1c),E=army(EG,0,1.05,0x8f1220);
const tgt=(a,s,i,p)=>{const b=a.base[i],x=b[0]*(a.sq?1-.3*p:1),y=b[1];return s>0?[x,D+y-p*a.win]:[x,-D-y+p*a.win]};
const setBase=(a,s,pts)=>{a.base=pts;a.sq=0;a.win=0;a.T.fill(9);G.ph='idle';a.pz=s*(D+Math.max(...pts.map(p=>p[1]))+1.5)};
for(let i=0;i<N;i++){const t=tgt(V,1,i,0);V.x[i]=t[0];V.z[i]=t[1]}V.g.position.z=V.pz=D+Math.max(...RESERVE.map(p=>p[1]))+1.5;
/* dust */
const dg=new THREE.BufferGeometry(),dp=new Float32Array(900);for(let i=0;i<300;i++){dp[i*3]=(Math.random()-.5)*55;dp[i*3+1]=Math.random()*4;dp[i*3+2]=(Math.random()-.5)*16}
dg.setAttribute('position',new THREE.BufferAttribute(dp,3));const dust=new THREE.Points(dg,new THREE.PointsMaterial({color:0xd8c39a,size:1.6,transparent:true,opacity:0,depthWrite:false}));sc.add(dust);
/* state */
const G={ph:'idle',t:0,p:0,cb:null};let mode='intro',time=0,last=performance.now(),raf,fc=0;
const D9=new THREE.Object3D(),TP=new THREE.Vector3(),TL=new THREE.Vector3(),LK=new THREE.Vector3(0,10,-150);cam.position.set(0,10,62);
function upd(a,s,dt,bt,pe){const k=1-Math.exp(-dt*2.2);
for(let i=0;i<N;i++){const[tx,tz]=tgt(a,s,i,bt?pe:0);let mv=0;const dead=bt&&pe>a.T[i];
if(!dead){if(bt){a.x[i]=tx;a.z[i]=tz;mv=pe<1?1:0}else{const dx=tx-a.x[i],dz=tz-a.z[i];a.x[i]+=dx*k;a.z[i]+=dz*k;mv=Math.abs(dx)+Math.abs(dz)>.3?1:0}}
const f=Math.min(1,Math.max(0,(pe-a.T[i])*8)),sg=i%2?1:-1,sx=a.scale,bob=mv?Math.abs(Math.sin(time*9+i))*.13:0;
D9.position.set(a.x[i],bob,a.z[i]);D9.rotation.order='YXZ';D9.rotation.set(f*-1.55,(s>0?Math.PI:0)+(i%7-3)*.05+f*sg*.6,0);D9.scale.setScalar(sx);D9.updateMatrix();a.m1.setMatrixAt(i,D9.matrix)}

a.m1.instanceMatrix.needsUpdate=a.m2.instanceMatrix.needsUpdate=true;
a.g.position.z+=(a.pz-a.g.position.z)*k;a.fl.rotation.y=Math.sin(time*3+s)*.35}
const pa=(a,s)=>Array.from({length:N},(_,i)=>tgt(a,s,i,.75));
function rank(a,s,b,sb,loss){const A=pa(a,s),B=pa(b,sb);A.map(([x,z],i)=>[Math.min(...B.map(([u,v])=>(x-u)**2+(z-v)**2)),i]).sort((p,q)=>p[0]-q[0]).forEach(([,i],r)=>{const q=r/N;a.T[i]=q<loss?.2+.7*q/loss:9})}
function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000||.016);last=now;time+=dt;let pe=0;
if(G.ph==='battle'){G.t+=dt;G.p=Math.min(1,G.t/9);pe=G.p*G.p*(3-2*G.p);if(G.t>10.6){G.ph='done';G.cb&&G.cb()}}else if(G.ph==='done')pe=1;
const bt=G.ph==='battle'||G.ph==='done';upd(V,1,dt,bt,pe);upd(E,-1,dt,bt,pe);
if(bt&&++fc%6===0&&api.current.tick){let v=0,e=0;for(let i=0;i<N;i++){if(pe>V.T[i])v++;if(pe>E.T[i])e++}api.current.tick((N-v)/N,(N-e)/N)}
const bo=G.ph==='battle'?Math.sin(Math.PI*G.p):0;dust.material.opacity=.6*bo;const dpp=dg.attributes.position;for(let i=0;i<300;i++){dpp.array[i*3+1]=(dpp.array[i*3+1]+dt*(.6+bo))%4}dpp.needsUpdate=true;
if(mode==='intro'){const a=time*.06;TP.set(Math.sin(a)*16,9+Math.sin(time*.2)*1.5,64);TL.set(0,12,-150)}
else if(mode==='top'){TP.set(0,74,36);TL.set(0,0,-2)}
else if(mode==='side'){TP.set(-34,15,14);TL.set(0,2,-20)}
else{const a=bt&&G.ph==='battle'?-.95+1.5*G.p:.55+Math.sin(time*.15)*.18;TP.set(Math.sin(a)*30,7+3*(bt?pe:0),Math.cos(a)*26);TL.set(0,2,-1)}
const ck=1-Math.exp(-dt*(mode==='battle'?1.4:2.2));cam.position.lerp(TP,ck);LK.lerp(TL,ck);
if(G.ph==='battle'&&pe>.3&&pe<.6)cam.position.x+=(Math.random()-.5)*.3;cam.lookAt(LK);R.render(sc,cam)}
raf=requestAnimationFrame(frame);
api.current={
enemy(i){setBase(E,-1,ENEMY[i].pts);for(let k=0;k<N;k++){E.x[k]=(Math.random()-.5)*70;E.z[k]=-85-Math.random()*50}},
counter(c){setBase(V,1,c==null?RESERVE:C[c].pts);V.sq=c!=null&&C[c].pinch?1:0},
mode(m){mode=m},
battle(sc2,cb){const w=[[6,12],[9,9],[12,6]][sc2],loss=[[.88,.1],[.4,.38],[.1,.88]][sc2];
V.win=w[0];E.win=w[1];if(sc2===0)V.sq=1;if(sc2===2)E.sq=1;
rank(V,1,E,-1,loss[0]);rank(E,-1,V,1,loss[1]);
for(let i=0;i<N;i++){let t=tgt(V,1,i,0);V.x[i]=t[0];V.z[i]=t[1];t=tgt(E,-1,i,0);E.x[i]=t[0];E.z[i]=t[1]}
G.ph='battle';G.t=0;G.p=0;G.cb=cb;fc=0},
tick:null};api.current.enemy(2);
return()=>{if(cm)cm.enabled=cmOn;cancelAnimationFrame(raf);removeEventListener('resize',rs);if(ro)ro.disconnect();R.dispose();el.innerHTML=''}},[]);return h('div',{className:'cv',ref})}
/* ---------- app ---------- */
function App({api,onExit,onComplete}){const[ph,setPh]=useState('intro'),[r,setR]=useState(0),[sel,setSel]=useState(null),[res,setRes]=useState([]),[view,setView]=useState('top'),[snd,setSnd]=useState(true),[ex,setEx]=useState(false);
useEffect(()=>{api.current.tick=(v,e)=>{const a=document.getElementById('vb'),b=document.getElementById('eb');if(a)a.style.width=v*100+'%';if(b)b.style.width=e*100+'%'}});
const A=()=>api.current;const leave=()=>{SFX.stop();(onExit||onComplete||(()=>{}))()};
const prep=n=>{setR(n);setSel(null);setPh('study');setView('top');A().enemy(n);A().counter(null);A().mode('top')};
const begin=()=>{SFX.init();SFX.halt();SFX.amb(true);setRes([]);prep(0)};
const pick=i=>{SFX.tick();setSel(i);A().counter(i)};
const setV=v=>{setView(v);A().mode(v)};
const deploy=()=>{const s=SC[r][sel];SFX.battle(s);setPh('battle');A().mode('battle');A().battle(s,()=>{setRes(x=>[...x,{r,c:sel,s}]);setPh('result')})};
const replay=()=>{SFX.battle(SC[r][sel]);setPh('battle');A().battle(SC[r][sel],()=>setPh('result'))};
const next=()=>{if(r<4)prep(r+1);else{setPh('final');A().mode('battle')}};
const restart=()=>{SFX.stop();setEx(false);setPh('intro');setRes([]);A().mode('intro');A().enemy(2);A().counter(null)};
const last=res[res.length-1],tot=res.reduce((a,x)=>a+x.s,0),en=ENEMY[r];
return d('ui',{},
d('lb on',{style:{top:0,opacity:ph==='battle'?1:0}}),
ph==='battle'?d('lb on',{style:{bottom:0}}):null,
ph!=='intro'?d('top',{},h('div',{className:'logo'},'ANCESTRA ',h('small',null,'Chapter XIX · The Art of War')),
 d('pips',{},[0,1,2,3,4].map(i=>{const x=res[i];return d('p '+(x?'v'+x.s:i===r&&ph!=='final'?'now':''),{key:i,title:RL[i]},i+1)})),
 d('tb',{},h('button',{className:'btn gh',onClick:()=>{const o=!snd;setSnd(o);SFX.mute(!o)}},snd?'SOUND ON':'SOUND OFF'),h('button',{className:'btn gh',onClick:begin},'RESTART'),h('button',{className:'btn gh',onClick:()=>setEx(true)},'EXIT'))):d('top',{}),
ph==='intro'?d('mid',{},d('div',{style:{textAlign:'center'}},
 h('div',{className:'logo',style:{marginBottom:14}},'CHAPTER XIX · GAME 2'),d('title',{},'THE ART OF WAR'),
 d('sub',{},'FIVE FORMATIONS. ONE STRATEGIST.'),
 d('lead',{},'Beneath the golden walls of Lanka, five enemy formations await. Study each one, choose the formation that answers it, and watch the armies decide.'),
 h('button',{className:'btn',onClick:begin},'BEGIN THE CAMPAIGN'),h('div',{style:{marginTop:16}},h('button',{className:'btn gh',onClick:leave},'BACK TO STORY')))):null,
ph==='study'?d('intel gl',{},d('rd',{},'ROUND '+(r+1)+' OF 5 · '+RL[r]),h('h2',null,en.name),d('sb',{},en.sub),d('',{style:{width:'100%'}},h(Dia,{pts:en.pts,flip:1,c:'#e0584a'})),
 d('tg',{},h('button',{className:'btn'+(view==='top'?'':' gh'),onClick:()=>setV('top')},'OVERVIEW'),h('button',{className:'btn'+(view==='side'?'':' gh'),onClick:()=>setV('side')},'CLOSE-UP'))):null,
ph==='study'?d('bot gl',{},d('row',{},d('hint',{},sel==null?'Choose your counter-formation':C[sel].name+' selected'),
 h('button',{className:'btn',disabled:sel==null,onClick:deploy},'DEPLOY COUNTER-FORMATION')),
 d('cards',{},C.map((c,i)=>h('div',{key:i,className:'cd'+(sel===i?' on':''),role:'button',title:c.desc,tabIndex:0,onClick:()=>pick(i),onKeyDown:e=>e.key==='Enter'&&pick(i)},h(Dia,{pts:c.pts,c:'#f0b04a'}),h('h4',null,c.name))))):null,
ph==='battle'?d('hud',{},h('h3',null,en.name+'  versus  '+C[sel].name),d('bars',{},'VANARA',d('bar',{},h('i',{id:'vb',style:{background:'#f08a1c'}})),d('bar',{},h('i',{id:'eb',style:{background:'#c0283a'}})),'RAKSHASA')):null,
ph==='result'&&last?d('res gl',{},h('span',{className:'vd v'+last.s},VN[last.s]),
 h('p',null,STORY[r][last.s]),h('em',null,NOTE[last.c]),
 d('acts',{},h('button',{className:'btn gh',onClick:replay},'REPLAY BATTLE'),h('button',{className:'btn',onClick:next},r<4?'NEXT ROUND':'FINAL ASSESSMENT'))):null,
ph==='final'?d('mid',{},d('card gl',{},h('h2',{className:'cont'},'And the battle continues…'),
 h('p',{style:{margin:'12px 0 14px',lineHeight:1.4,fontSize:19}},'Five formations met, five decisions made. Beyond the walls of golden Lanka, the war is far from over.'),
 d('chips',{},ENEMY.map((e,i)=>h('span',{key:i},e.name))),
 d('acts',{},h('button',{className:'btn',onClick:begin},'PLAY AGAIN'),h('button',{className:'btn gh',onClick:leave},'RETURN TO STORY')))):null,ex?d('mid',{style:{background:'#000a',zIndex:9}},d('card gl',{style:{width:'min(420px,92vw)',textAlign:'center'}},h('h2',null,'Leave the battlefield?'),h('p',{style:{margin:'10px 0 14px'}},'Your campaign progress will be lost.'),d('acts',{style:{justifyContent:'center'}},h('button',{className:'btn gh',onClick:()=>setEx(false)},'STAY'),h('button',{className:'btn',onClick:leave},'EXIT TO STORY')))):null)}
export default function ArtOfWarGame({onComplete,onExit}){
  const api=useRef({});
  useEffect(()=>()=>SFX.destroy(),[]);
  const game=h('div',{className:'aow'},h(Field,{api}),h(App,{api,onExit,onComplete}));
  /* Portal to <body> so no transformed/clipped parent (page animations, modal) can resize or offset the full-screen frame */
  return typeof document!=='undefined'?createPortal(game,document.body):game;
}