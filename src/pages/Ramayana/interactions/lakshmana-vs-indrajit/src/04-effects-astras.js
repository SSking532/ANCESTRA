/* ---------- effects ---------- */
const GFX={flash:0,fc:V3(1,.9,.7),dark:0,desat:0,ab:.004,light:0,lc:V3(1,.6,.3),lpos:V3(0,2,0),light2:0,lc2:V3(1,.85,.5),lpos2:V3(0,2,0)};
const TEMPS=[];
function flash(r,g,b,a){GFX.fc.set(r,g,b);GFX.flash=Math.max(GFX.flash,a)}
function lightAt(p,rgb,i){GFX.lpos.copy(p);GFX.lc.set(rgb[0],rgb[1],rgb[2]);GFX.light=Math.max(GFX.light,i)}
function lightAt2(p,rgb,i){GFX.lpos2.copy(p);GFX.lc2.set(rgb[0],rgb[1],rgb[2]);GFX.light2=Math.max(GFX.light2,i)}
function temp(m,life,fn){scene.add(m);TEMPS.push({m,t:0,life,fn})}
function tempUpdate(dt){for(let i=TEMPS.length-1;i>=0;i--){const o=TEMPS[i];o.t+=dt;const k=o.t/o.life;if(k>=1){scene.remove(o.m);o.m.traverse(c=>{if(c.geometry)c.geometry.dispose()});TEMPS.splice(i,1);continue}o.fn(k,o.m)}
 GFX.flash=Math.max(0,GFX.flash-dt*1.6);FXL.color.setRGB(GFX.lc.x,GFX.lc.y,GFX.lc.z);FXL.position.copy(GFX.lpos);FXL.intensity=GFX.light*16;GFX.light*=Math.pow(.02,dt);FXL2.color.setRGB(GFX.lc2.x,GFX.lc2.y,GFX.lc2.z);FXL2.position.copy(GFX.lpos2);FXL2.intensity=GFX.light2*13;GFX.light2*=Math.pow(.02,dt)}
const addMat=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false},o||{}));
function ring(p,col,maxR,life,thick){const m=new THREE.Mesh(new THREE.TorusGeometry(1,thick||.05,8,40),addMat(new THREE.Color(col[0],col[1],col[2])));m.position.copy(p);temp(m,life,(k,o)=>{o.lookAt(cam.position);o.scale.setScalar(.2+k*maxR);o.material.opacity=1-k})}
function sphereFlash(p,col,r,life){const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),addMat(new THREE.Color(col[0],col[1],col[2])));m.position.copy(p);temp(m,life,(k,o)=>{o.scale.setScalar(r*(.3+k*1.4));o.material.opacity=(1-k)*(1-k)})}
/* lightning: layered jittered lines that flicker */
function bolt(a,b,o){o=o||{};const n=o.n||14,col=o.c||[3,2.6,1.4],j=o.j||.6,g=new THREE.Group();for(let L=0;L<3;L++){const pts=[];for(let i=0;i<=n;i++){const t=i/n,p=a.clone().lerp(b,t);if(i>0&&i<n){const s=j*Math.sin(t*Math.PI);p.x+=rnd(-s,s);p.y+=rnd(-s,s);p.z+=rnd(-s,s)}pts.push(p)}
  const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:new THREE.Color(col[0],col[1],col[2]),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,opacity:L?.5:1}));ln.position.set(rnd(-.03,.03)*L,rnd(-.03,.03)*L,0);g.add(ln)}
 temp(g,o.life||.18,(k,m)=>{m.children.forEach(c=>c.material.opacity*=.93)})}
/* ---------- arrows ---------- */
const ARR=[];
function arrowMesh(col,glow){const g=new THREE.Group(),shaft=mesh(new THREE.CylinderGeometry(.016,.016,1.15,6),new THREE.MeshStandardMaterial({color:col,roughness:.5,emissive:glow,emissiveIntensity:.8}),false);shaft.rotation.z=Math.PI/2;g.add(shaft);const tip=mesh(new THREE.ConeGeometry(.04,.16,6),goldM(),false);tip.rotation.z=-Math.PI/2;tip.position.x=.64;g.add(tip);for(let k=0;k<3;k++){const f=mesh(new THREE.PlaneGeometry(.22,.08),mat(0x9b3a24,{side:THREE.DoubleSide}),false);f.position.x=-.48;f.rotation.x=k*2.09;g.add(f)}const h=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),addMat(new THREE.Color(glow)));h.position.x=.55;g.add(h);return g}
function spawnArrow(p,v,kind){const m=arrowMesh(kind==='mine'?0xfff0c8:0xe9cfa6,kind==='mine'?0xffd070:0xd03a1c);m.position.copy(p);m.quaternion.setFromUnitVectors(V3(1,0,0),v.clone().normalize());scene.add(m);const a={m,p:p.clone(),pp:p.clone(),v:v.clone(),kind,alive:true,t:0};ARR.push(a);return a}
function killArrow(a){a.alive=false;scene.remove(a.m)}
function stepArrows(dt){for(let i=ARR.length-1;i>=0;i--){const a=ARR[i];if(!a.alive){ARR.splice(i,1);continue}a.t+=dt;a.pp.copy(a.p);a.p.addScaledVector(a.v,dt);a.m.position.copy(a.p);if(a.kind==='mine')SPARK.emit(a.p.x,a.p.y,a.p.z,rnd(-.4,.4),rnd(-.4,.4),rnd(-.4,.4),.35,.16,1,.82,.45,0,-.5,.8);else if(a.kind==='enemy')SPARK.emit(a.p.x,a.p.y,a.p.z,rnd(-.3,.3),rnd(-.3,.3),rnd(-.3,.3),.4,.16,1,.28,.1,0,-.4,.7);if(a.p.x<-30||a.p.x>34||a.p.y<-2||a.p.y>30){killArrow(a)}}}
/* ---------- astra bodies ---------- */
function mkOrb(col,r){return new THREE.Mesh(new THREE.SphereGeometry(r,16,12),addMat(new THREE.Color(col[0],col[1],col[2])))}
const TAMASA_MAT=()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:{value:0}},vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uT;varying vec3 vN;varying vec3 vP;float h(vec3 p){return fract(sin(dot(p,vec3(12.9,78.2,37.7)))*43758.5);}float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){float f=pow(1.-abs(vN.z),2.);float c=n(vP*3.+uT*1.5)*.7+n(vP*7.-uT*2.)*.3;vec3 col=mix(vec3(.02,.0,.05),vec3(.45,.2,.9),f*c*1.4);gl_FragColor=vec4(col,.92-.1*f);}'});
class Incoming{
 constructor(type){this.type=type;this.g=new THREE.Group();scene.add(this.g);this.t=0;
  if(type==='agneya'){this.core=mkOrb([2.2,1.1,.35],.36);this.halo=mkOrb([.8,.3,.08],.62);this.halo.material.opacity=.32;this.g.add(this.core,this.halo)}
  else if(type==='naga'){this.s=[];for(let k=0;k<6;k++){const segs=[];for(let i=0;i<14;i++){const m=mesh(new THREE.SphereGeometry(.17-i*.008,8,6),mat(0x8aa84a,{roughness:.35,metalness:.5,emissive:0x44601a,emissiveIntensity:.7}),false);this.g.add(m);segs.push(m)}const hd=mesh(new THREE.ConeGeometry(.17,.4,6),mat(0xb8d062,{emissive:0x88a030,emissiveIntensity:.9}),false);this.g.add(hd);segs.hd=hd;this.s.push(segs)}}
  else{this.mat=TAMASA_MAT();this.core=new THREE.Mesh(new THREE.SphereGeometry(1.15,24,18),this.mat);this.g.add(this.core)}}
 update(p,dir,dt){this.t+=dt;const t=this.t,g=this.g;g.position.copy(p);
  if(this.type==='agneya'){const s=1+Math.sin(t*20)*.08;this.core.scale.setScalar(s);this.halo.scale.setScalar(1+Math.sin(t*14)*.12);for(let i=0;i<5;i++){SPARK.emit(p.x+rnd(-.3,.3),p.y+rnd(-.3,.3),p.z+rnd(-.3,.3),-dir.x*rnd(1,4)+rnd(-1,1),rnd(.2,2),rnd(-1,1),rnd(.5,1),rnd(.5,1.1),1,rnd(.3,.6),.1,-1,1.4,.7)}if(Math.random()<.5)SMOKE.emit(p.x,p.y,p.z,-dir.x*1.5,rnd(.5,1.5),0,rnd(1,2),rnd(.8,1.4),.08,.05,.04,-.1,2,.4);lightAt(p,[1,.5,.15],.5)}
  else if(this.type==='naga'){const up=V3(0,1,0),side=new THREE.Vector3().crossVectors(dir,up).normalize();for(let k=0;k<6;k++){const sg=this.s[k],ph=k*1.1,sp=(k-2.5)*.28;for(let i=0;i<14;i++){const f=i*.2,off=Math.sin(t*9-i*.6+ph)*(.22+i*.03);sg[i].position.set(-dir.x*f,-dir.y*f+sp*(1+i*.1)+off*.6*(k%2?1:-1),side.z*off+sp*.7).add(V3(0,0,0))}sg.hd.position.set(.05,sp,sp*.7);sg.hd.rotation.z=-Math.PI/2}if(Math.random()<.6)SPARK.emit(p.x,p.y,p.z,-dir.x*2,rnd(-.5,.5),rnd(-.5,.5),.6,.3,.5,.8,.2,0,1,.5);lightAt(p,[.5,.8,.25],.5)}
  else{this.mat.uniforms.uT.value=t;this.core.scale.setScalar(1+Math.sin(t*3)*.05);for(let i=0;i<3;i++)SMOKE.emit(p.x+rnd(-.9,.9),p.y+rnd(-.9,.9),p.z+rnd(-.9,.9),-dir.x*1.5,rnd(-.4,.4),rnd(-.4,.4),rnd(1,1.8),rnd(.9,1.6),.03,.0,.08,0,1.5,.6);if(Math.random()<.5)SPARK.emit(p.x+rnd(-1,1),p.y+rnd(-1,1),p.z+rnd(-1,1),0,0,0,.5,.18,.6,.3,1,0,0,.8);lightAt(p,[.4,.2,.8],.4)}}
 dispose(){scene.remove(this.g);this.g.traverse(c=>{if(c.geometry)c.geometry.dispose()})}}
class Counter{
 constructor(type){this.type=type;this.g=new THREE.Group();scene.add(this.g);this.t=0;
  if(type==='varuna'){this.core=mkOrb([.7,1.6,2.6],.34);this.g.add(this.core);this.rg=new THREE.Mesh(new THREE.TorusGeometry(.7,.045,8,30),addMat(new THREE.Color(.5,1.2,2)));this.g.add(this.rg)}
  else if(type==='garuda'){const gm=mat(0xe6b650,{metalness:1,roughness:.25,emissive:0xb87a18,emissiveIntensity:.9}),bd=mesh(new THREE.CapsuleGeometry(.2,.7,4,10),gm,false);bd.rotation.z=Math.PI/2;this.g.add(bd);const hd=mesh(new THREE.ConeGeometry(.16,.4,6),mat(0xfff0c0,{emissive:0xffd890,emissiveIntensity:.8}),false);hd.rotation.z=-Math.PI/2;hd.position.x=.6;this.g.add(hd);this.w=[];for(const s of[1,-1]){const wg=new THREE.Group();for(let i=0;i<7;i++){const f=mesh(new THREE.PlaneGeometry(.26,1.7-i*.12),mat(0xf0c860,{emissive:0xc08a20,emissiveIntensity:.8,side:THREE.DoubleSide,metalness:.6,roughness:.3}),false);f.geometry.translate(0,(1.7-i*.12)/2,0);f.rotation.z=-.05*i*s;f.rotation.x=0;f.position.set(-i*.12,0,0);wg.add(f)}wg.scale.z=s;wg.rotation.x=s*.2;this.g.add(wg);this.w.push(wg)}this.g.scale.setScalar(1.3)}
  else if(type==='surya'){this.core=mkOrb([5,4,2.2],.5);this.g.add(this.core);this.rays=[];for(let i=0;i<10;i++){const r=new THREE.Mesh(new THREE.PlaneGeometry(.16,2.6),addMat(new THREE.Color(2.2,1.7,.8),{side:THREE.DoubleSide,opacity:.55}));r.rotation.z=i/10*6.283;this.g.add(r);this.rays.push(r)}}
  else{this.rings=[];for(let i=0;i<4;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(.5,.035,6,28),addMat(new THREE.Color(1.6,1.9,2)));r.rotation.y=Math.PI/2;this.g.add(r);this.rings.push(r)}}}
 update(p,dir,dt){this.t+=dt;const t=this.t,g=this.g;g.position.copy(p);
  if(this.type==='varuna'){this.core.scale.setScalar(1+Math.sin(t*16)*.1);this.rg.lookAt(cam.position);this.rg.rotation.z+=dt*3;for(let i=0;i<4;i++){const a=t*14+i*1.57,r=.55;SPARK.emit(p.x+Math.cos(a)*.01,p.y+Math.cos(a)*r,p.z+Math.sin(a)*r,-dir.x*3,0,0,.45,.2,.5,.9,1.6,2,0,.8)}lightAt2(p,[.4,.8,1.3],.9)}
  else if(this.type==='garuda'){g.rotation.set(0,0,Math.atan2(dir.y,dir.x));const f=Math.sin(t*14)*.7;this.w[0].rotation.x=.2+f;this.w[1].rotation.x=-.2-f;for(let i=0;i<3;i++)SPARK.emit(p.x,p.y+rnd(-.6,.6),p.z+rnd(-1,1),-dir.x*2,rnd(-.5,.5),rnd(-1,1),.6,.3,1,.8,.3,0,.8,.8);lightAt2(p,[1,.75,.3],1)}
  else if(this.type==='surya'){this.core.scale.setScalar(1+Math.sin(t*12)*.08);this.rays.forEach((r,i)=>{r.lookAt(cam.position);r.rotateZ(i/10*6.283+t*2)});for(let i=0;i<4;i++)SPARK.emit(p.x,p.y,p.z,rnd(-2,2)-dir.x*2,rnd(-2,2),rnd(-2,2),.5,.2,1,.9,.5,0,0,.8);lightAt2(p,[1.2,1,.6],1.5)}
  else{this.rings.forEach((r,i)=>{r.position.x=-i*.5;r.scale.setScalar(1+i*.35+Math.sin(t*10)*.05);r.rotation.x+=dt*6});for(let i=0;i<8;i++){const a=t*16+i*.8,r=rnd(.4,1.3);SPARK.emit(p.x-rnd(0,2),p.y+Math.cos(a)*r,p.z+Math.sin(a)*r,-dir.x*2,0,0,.5,.12,.8,.95,1,0,.5,.6)}lightAt2(p,[.7,.9,1],.5)}}
 dispose(){scene.remove(this.g);this.g.traverse(c=>{if(c.geometry)c.geometry.dispose()})}}
function impactFx(type,p){
 if(type==='varuna'){burst(p,60,{c:[.5,.9,1.6],v0:3,v1:14,life:1.2,size:.28,g:8});for(let i=0;i<14;i++)SMOKE.emit(p.x,p.y,p.z,rnd(-3,3),rnd(0,3),rnd(-3,3),rnd(1,2),rnd(1,2),.7,.85,.95,-.1,2,.4);ring(p,[.5,1.1,1.8],7,.9,.08);ring(p,[.8,1.4,2],4.5,.7,.05);flash(.6,.8,1,.35);lightAt2(p,[.4,.8,1.4],3)}
 else if(type==='garuda'){burst(p,70,{c:[1,.8,.3],v0:3,v1:16,life:1.3,size:.3,g:3});sphereFlash(p,[1.6,1.1,.4],3.2,.5);ring(p,[1.6,1.2,.5],8,.9,.09);flash(1,.85,.4,.35);lightAt2(p,[1,.75,.3],3)}
 else if(type==='surya'){burst(p,80,{c:[1.2,1,.6],v0:4,v1:20,life:1.2,size:.26,g:0});sphereFlash(p,[3,2.6,1.6],4,.55);ring(p,[2,1.6,.9],10,1,.1);flash(1,.95,.8,.7);lightAt2(p,[1.3,1.1,.7],4)}
 else if(type==='vayavya'){ring(p,[1.4,1.6,1.8],12,.8,.08);ring(p,[1,1.3,1.6],7,.6,.05);burst(p,40,{c:[.8,.95,1],v0:5,v1:20,life:.9,size:.14,g:0});puff(p,10,{c:[.4,.35,.3],v:4,up:.4,size:1.6,life:1.6,a:.3})}
 else if(type==='agneya'){burst(p,70,{c:[1,.5,.15],v0:3,v1:16,life:1.2,size:.4,g:2});sphereFlash(p,[2,.9,.3],3,.5);flash(1,.5,.2,.3);lightAt(p,[1,.5,.15],3);puff(p,8,{c:[.1,.06,.05],size:2})}
 else if(type==='naga'){burst(p,50,{c:[.5,.9,.2],v0:3,v1:12,life:1,size:.3,g:2});ring(p,[.6,1.2,.3],6,.7,.06);flash(.5,.9,.3,.2);lightAt(p,[.5,.9,.25],2)}
 else if(type==='tamasa'){burst(p,60,{c:[.5,.25,1],v0:3,v1:14,life:1.2,size:.4,g:0});puff(p,14,{c:[.03,0,.08],size:2.4,life:2.4,a:.8});ring(p,[.5,.2,1],8,1,.1);flash(.2,.05,.4,.4);lightAt(p,[.4,.2,.9],2)}
 else{burst(p,50,{c:[1,.85,.45],v0:2,v1:12,life:.9,size:.22,g:4});ring(p,[2,1.6,.9],5,.6,.06);lightAt(p,[1,.8,.4],2.5)}}
/* ---------- helpers: projection and aim ---------- */
const _v=V3(),RAY=new THREE.Raycaster(),PL=new THREE.Plane(V3(0,0,1),0);
function toScreen(p){_v.copy(p).project(cam);return{x:(_v.x*.5+.5)*innerWidth,y:(-_v.y*.5+.5)*innerHeight,z:_v.z}}
function pxPerM(p){const d=cam.position.distanceTo(p);return innerHeight/(2*Math.tan(cam.fov*Math.PI/360))/d}
function aimPoint(sx,sy,z){PL.constant=-(z||0);const n=V3(sx/innerWidth*2-1,-(sy/innerHeight)*2+1,.5);RAY.setFromCamera({x:n.x,y:n.y},cam);const o=V3();return RAY.ray.intersectPlane(PL,o)?o:null}

/* swept test: closest approach of two moving points over one frame */
function sweptHit(a,b,rad){const r0=a.pp.clone().sub(b.pp),rv=a.p.clone().sub(a.pp).sub(b.p.clone().sub(b.pp)),l=rv.lengthSq();let t=l>1e-9?clamp(-r0.dot(rv)/l,0,1):0;return r0.addScaledVector(rv,t).length()<rad}
