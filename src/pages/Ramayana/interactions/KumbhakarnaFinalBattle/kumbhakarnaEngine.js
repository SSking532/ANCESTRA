/* =========================================================
   KUMBHAKARNA — THE FINAL BATTLE  ·  game engine
   Plain three.js. Works with the `three` package already in
   the project (tested against r128 and written to also run
   on r152+). initKumbhakarnaGame returns a cleanup function.
========================================================= */

export function initKumbhakarnaGame(root, THREE, opts) {
  opts = opts || {};
  var alive = true, rafId = 0, listeners = [], timers = [];
  function on(t, e, f, o) { t.addEventListener(e, f, o); listeners.push([t, e, f, o]); }
  var setTimeout = function (f, ms) { var id = window.setTimeout(function () { if (alive) f(); }, ms); timers.push(id); return id; };

function $(i){return root.querySelector('#'+i)}
var V3=THREE.Vector3,PI=Math.PI,TAU=PI*2;var REV=parseInt(THREE.REVISION,10)||128,LK=REV>=155?PI:1;function setEnc(t){if(THREE.SRGBColorSpace&&'colorSpace' in t)t.colorSpace=THREE.SRGBColorSpace;else if(THREE.sRGBEncoding)t.encoding=THREE.sRGBEncoding}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function rand(a,b){return a+Math.random()*(b-a)}
function sm(t){t=clamp(t,0,1);return t*t*(3-2*t)}
function angDiff(a,b){var d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d}
function turnTo(a,b,max){var d=angDiff(a,b);return a+clamp(d,-max,max)}

/* ---------- renderer / scene ---------- */
var renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=REV>=152?1.7:1.3;
if('outputColorSpace' in renderer)renderer.outputColorSpace=THREE.SRGBColorSpace;else renderer.outputEncoding=THREE.sRGBEncoding;
$('stage').appendChild(renderer.domElement);
var scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x7a3416,0.0030);
var camera=new THREE.PerspectiveCamera(50,1,0.4,1600);
function resize(){var w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
on(window,'resize',resize);resize();

function cv(w,h,fn){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);setEnc(t);t.anisotropy=8;return t}
var glowTex=cv(128,128,function(c,w,h){var g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h)});
var smokeTex=cv(256,256,function(c,w,h){for(var i=0;i<70;i++){var x=rand(50,206),y=rand(60,196),r=rand(26,70);var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h)}});

/* ---------- sky ---------- */
var SUN=new V3(-0.62,0.2,-0.75).normalize();
var sky=new THREE.Mesh(new THREE.SphereGeometry(1000,32,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{sun:{value:SUN}},
 vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec3 vP;uniform vec3 sun;void main(){vec3 n=normalize(vP);float h=n.y;vec3 hor=vec3(.62,.27,.1);vec3 mid=vec3(.36,.09,.07);vec3 top=vec3(.035,.02,.09);'+
 'vec3 c=mix(hor,mid,smoothstep(0.,.22,h));c=mix(c,top,smoothstep(.15,.75,h));float s=max(dot(n,sun),0.);c+=vec3(1.,.5,.15)*pow(s,6.)*.55+vec3(1.,.75,.4)*pow(s,90.)*1.6;'+
 'c+=vec3(.9,.35,.1)*exp(-abs(h)*9.)*.35;c=mix(c,hor*.9,smoothstep(0.,-.12,h));gl_FragColor=vec4(c,1.);}'}));
scene.add(sky);
var sunSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffa24a,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,transparent:true}));
sunSpr.position.copy(SUN).multiplyScalar(900);sunSpr.scale.set(520,520,1);scene.add(sunSpr);
var clouds=[];
for(var ci=0;ci<20;ci++){var cm=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,color:ci%3?0x4a1c12:0x8a3a1c,transparent:true,opacity:rand(.35,.6),depthWrite:false,fog:false}));
 var ca=rand(0,TAU),cr=rand(380,800);cm.position.set(Math.cos(ca)*cr,rand(70,260),Math.sin(ca)*cr);var cs=rand(260,520);cm.scale.set(cs*1.8,cs*.6,1);cm.userData.sp=rand(.4,1.2);scene.add(cm);clouds.push(cm)}

/* ---------- lights ---------- */
var hemi=new THREE.HemisphereLight(0xffc8a0,0x5a2a14,1.1*LK);scene.add(hemi);
var sunL=new THREE.DirectionalLight(0xffd9ae,2.8*LK);sunL.position.set(55,85,95);sunL.castShadow=true;
sunL.shadow.mapSize.set(2048,2048);var sc=sunL.shadow.camera;sc.left=-75;sc.right=75;sc.top=75;sc.bottom=-75;sc.near=10;sc.far=400;sunL.shadow.bias=-0.0006;sunL.shadow.normalBias=.4;
sc.updateProjectionMatrix();scene.add(sunL);scene.add(new THREE.AmbientLight(0xffb890,.55*LK));
var backL=new THREE.DirectionalLight(0xff7a30,2.2*LK);backL.position.copy(SUN).multiplyScalar(160);scene.add(backL);
var fillL=new THREE.DirectionalLight(0x7a98ff,.85*LK);fillL.position.set(-90,35,50);scene.add(fillL);
var rimL=new THREE.DirectionalLight(0xffa060,.9*LK);rimL.position.set(70,30,-40);scene.add(rimL);
var fireL=new THREE.PointLight(0xff6a1a,1.4*LK,90,1.6);fireL.position.set(0,6,8);scene.add(fireL);
var ramaL=new THREE.PointLight(0x7aa8ff,0.0,40,1.8);scene.add(ramaL);

/* ---------- ground ---------- */
var groundTex=cv(1024,1024,function(c,w,h){var i,x,y,r,g;c.fillStyle='#5f4029';c.fillRect(0,0,w,h);
 for(i=0;i<2600;i++){x=rand(0,w);y=rand(0,h);r=rand(4,40);g=c.createRadialGradient(x,y,0,x,y,r);var d=Math.random()<.5;g.addColorStop(0,d?'rgba(30,16,8,.3)':'rgba(160,112,64,.24)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
 for(i=0;i<70;i++){x=rand(0,w);y=rand(0,h);r=rand(10,50);g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(105,14,10,.34)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
 c.strokeStyle='rgba(18,9,4,.55)';c.lineWidth=1.3;for(i=0;i<90;i++){x=rand(0,w);y=rand(0,h);c.beginPath();c.moveTo(x,y);for(var k=0;k<7;k++){x+=rand(-30,30);y+=rand(-30,30);c.lineTo(x,y)}c.stroke()}
 for(i=0;i<2000;i++){var v=Math.floor(rand(60,170));c.fillStyle='rgba('+v+','+Math.floor(v*.7)+','+Math.floor(v*.45)+',.7)';c.fillRect(rand(0,w),rand(0,h),rand(1,3),rand(1,3))}});
groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping;groundTex.repeat.set(16,16);
var ground=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshStandardMaterial({map:groundTex,bumpMap:groundTex,bumpScale:2.2,roughness:1,metalness:0}));
ground.rotation.x=-PI/2;ground.receiveShadow=true;scene.add(ground);
var arenaTex=cv(512,512,function(c,w,h){var g=c.createRadialGradient(256,256,20,256,256,256);g.addColorStop(0,'rgba(150,105,60,.62)');g.addColorStop(.78,'rgba(110,70,38,.38)');g.addColorStop(1,'rgba(60,30,16,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
 c.strokeStyle='rgba(242,193,78,.28)';c.lineWidth=2;for(var r=60;r<250;r+=48){c.beginPath();c.arc(256,256,r,0,TAU);c.stroke()}});
var arena=new THREE.Mesh(new THREE.CircleGeometry(44,64),new THREE.MeshBasicMaterial({map:arenaTex,transparent:true,depthWrite:false,opacity:.9,fog:true}));
arena.rotation.x=-PI/2;arena.position.y=.04;scene.add(arena);
var ring=new THREE.Mesh(new THREE.RingGeometry(40.3,41.1,128),new THREE.MeshBasicMaterial({color:0xf2a93a,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
ring.rotation.x=-PI/2;ring.position.y=.08;scene.add(ring);

/* rocks, spears, debris */
var rockM=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0x5a4636,roughness:.95,flatShading:true}),220);
var dm=new THREE.Object3D();
for(var ri=0;ri<220;ri++){var a=rand(0,TAU),rr=rand(52,330),s=rand(.5,3.4);dm.position.set(Math.cos(a)*rr,s*.4,Math.sin(a)*rr);dm.rotation.set(rand(0,TAU),rand(0,TAU),rand(0,TAU));dm.scale.set(s*rand(.8,1.5),s*rand(.5,1),s*rand(.8,1.5));dm.updateMatrix();rockM.setMatrixAt(ri,dm.matrix)}
scene.add(rockM);

/* fallen warriors, broken chariot wheels */
(function(){var N=170,bodyM=new THREE.InstancedMesh(new THREE.CylinderGeometry(.42,.38,2.3,6),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9}),N),hd=new THREE.InstancedMesh(new THREE.SphereGeometry(.42,8,6),new THREE.MeshStandardMaterial({color:0x6a4a38,roughness:.9}),N),o=new THREE.Object3D(),c=new THREE.Color();
 var pal=[0x3a0d0d,0x241416,0x6e3a1c,0x8a4a22,0x1b1a24];
 for(var i=0;i<N;i++){var a=rand(0,TAU),r=rand(12,95),yw=rand(0,TAU);o.position.set(Math.cos(a)*r,.4,Math.sin(a)*r);o.rotation.set(PI/2+rand(-.2,.2),0,yw);o.scale.set(1,1,1);o.updateMatrix();bodyM.setMatrixAt(i,o.matrix);c.setHex(pal[i%5]);bodyM.setColorAt(i,c);
  var hp=new V3(0,1.35,0).applyMatrix4(o.matrix);o.position.copy(hp);o.rotation.set(0,0,0);o.updateMatrix();hd.setMatrixAt(i,o.matrix)}
 bodyM.castShadow=true;scene.add(bodyM);scene.add(hd);
 var W=14,wh=new THREE.InstancedMesh(new THREE.TorusGeometry(2.2,.25,6,18),new THREE.MeshStandardMaterial({color:0x5a3a20,roughness:.8}),W);
 for(i=0;i<W;i++){var a2=rand(0,TAU),r2=rand(20,90);o.position.set(Math.cos(a2)*r2,1.3,Math.sin(a2)*r2);o.rotation.set(rand(-.5,.5),rand(0,TAU),rand(-.4,.4));o.updateMatrix();wh.setMatrixAt(i,o.matrix)}
 wh.castShadow=true;scene.add(wh)})();

/* ---------- particles ---------- */
var tmpC=new THREE.Color();
function Particles(n,additive){
 this.n=n;this.i=0;var g=new THREE.BufferGeometry();
 this.pos=new Float32Array(n*3);this.col=new Float32Array(n*3);this.size=new Float32Array(n);this.alpha=new Float32Array(n);
 this.vel=new Float32Array(n*3);this.life=new Float32Array(n);this.max=new Float32Array(n);this.s0=new Float32Array(n);this.s1=new Float32Array(n);
 this.c0=new Float32Array(n*3);this.c1=new Float32Array(n*3);this.grav=new Float32Array(n);this.drag=new Float32Array(n);
 g.setAttribute('position',new THREE.BufferAttribute(this.pos,3));g.setAttribute('aColor',new THREE.BufferAttribute(this.col,3));
 g.setAttribute('size',new THREE.BufferAttribute(this.size,1));g.setAttribute('alpha',new THREE.BufferAttribute(this.alpha,1));
 this.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,uniforms:{uScale:{value:600}},
  vertexShader:'attribute float size;attribute float alpha;attribute vec3 aColor;varying float vA;varying vec3 vC;uniform float uScale;void main(){vA=alpha;vC=aColor;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(size*uScale/(-mv.z),0.,180.);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying float vA;varying vec3 vC;void main(){float d=length(gl_PointCoord-.5)*2.;float a=smoothstep(1.,0.,d);a*=a;gl_FragColor=vec4(vC,a*vA);}'});
 this.points=new THREE.Points(g,this.mat);this.points.frustumCulled=false;scene.add(this.points);
}
Particles.prototype.spawn=function(x,y,z,vx,vy,vz,h0,h1,s0,s1,life,grav,drag){
 var i=this.i;this.i=(i+1)%this.n;var k=i*3;
 this.pos[k]=x;this.pos[k+1]=y;this.pos[k+2]=z;this.vel[k]=vx;this.vel[k+1]=vy;this.vel[k+2]=vz;
 tmpC.setHex(h0);this.c0[k]=tmpC.r;this.c0[k+1]=tmpC.g;this.c0[k+2]=tmpC.b;tmpC.setHex(h1);this.c1[k]=tmpC.r;this.c1[k+1]=tmpC.g;this.c1[k+2]=tmpC.b;
 this.s0[i]=s0;this.s1[i]=s1;this.life[i]=life;this.max[i]=life;this.grav[i]=grav||0;this.drag[i]=drag||0;this.size[i]=s0;this.alpha[i]=0;
};
Particles.prototype.update=function(dt){
 for(var i=0;i<this.n;i++){var l=this.life[i];if(l<=0){this.alpha[i]=0;continue}
  l-=dt;this.life[i]=l;var k=i*3;if(l<=0){this.alpha[i]=0;continue}
  var dr=1-Math.min(.98,this.drag[i]*dt);this.vel[k]*=dr;this.vel[k+1]=(this.vel[k+1]-this.grav[i]*dt)*dr;this.vel[k+2]*=dr;
  this.pos[k]+=this.vel[k]*dt;this.pos[k+1]+=this.vel[k+1]*dt;this.pos[k+2]+=this.vel[k+2]*dt;
  var t=1-l/this.max[i];this.size[i]=this.s0[i]+(this.s1[i]-this.s0[i])*t;
  this.col[k]=this.c0[k]+(this.c1[k]-this.c0[k])*t;this.col[k+1]=this.c0[k+1]+(this.c1[k+1]-this.c0[k+1])*t;this.col[k+2]=this.c0[k+2]+(this.c1[k+2]-this.c0[k+2])*t;
  this.alpha[i]=Math.min(1,t*12)*(1-t)*(1-t*.3)}
 var a=this.points.geometry.attributes;a.position.needsUpdate=a.aColor.needsUpdate=a.size.needsUpdate=a.alpha.needsUpdate=true;
};
var fx=new Particles(3600,true);   /* fire, sparks, embers, glows */
var dust=new Particles(1400,false); /* dust, smoke */

/* ---------- braziers ---------- */
var brazierPos=[];
var brM=new THREE.MeshStandardMaterial({color:0x2b1c14,roughness:.6,metalness:.4});
for(var bi=0;bi<12;bi++){var ba=bi/12*TAU+.2,bx=Math.cos(ba)*46,bz=Math.sin(ba)*46;
 var pole=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,5,8),brM);pole.position.set(bx,2.5,bz);pole.castShadow=true;scene.add(pole);
 var bowl=new THREE.Mesh(new THREE.CylinderGeometry(1.5,.8,1,12),brM);bowl.position.set(bx,5.3,bz);scene.add(bowl);brazierPos.push(new V3(bx,5.8,bz))}

/* ---------- Lanka skyline & mountains ---------- */
var winTex=cv(128,128,function(c,w,h){c.fillStyle='#000';c.fillRect(0,0,w,h);for(var y=8;y<h;y+=16)for(var x=8;x<w;x+=16){if(Math.random()<.55){c.fillStyle='rgba(255,'+Math.floor(rand(150,210))+',70,1)';c.fillRect(x,y,6,8)}}});
var bMat=new THREE.MeshStandardMaterial({color:0x8e6a2c,roughness:.55,metalness:.4,emissive:0xffffff,emissiveMap:winTex,emissiveIntensity:.9});
var gMat=new THREE.MeshStandardMaterial({color:0xd4a23a,roughness:.3,metalness:.4,emissive:0x5a3205});
var lanka=new THREE.Group();
for(var li=0;li<62;li++){var lx=rand(-330,330),lz=rand(-470,-360),lh=rand(26,95),lw=rand(14,34);
 var b=new THREE.Mesh(new THREE.BoxGeometry(lw,lh,lw*rand(.8,1.3)),bMat);b.position.set(lx,lh/2,lz);lanka.add(b);
 var kind=li%3;
 if(kind===0){var cn=new THREE.Mesh(new THREE.ConeGeometry(lw*.62,lw*1.4,8),gMat);cn.position.set(lx,lh+lw*.7,lz);lanka.add(cn)}
 else if(kind===1){var dme=new THREE.Mesh(new THREE.SphereGeometry(lw*.5,12,8,0,TAU,0,PI/2),gMat);dme.position.set(lx,lh,lz);lanka.add(dme);var sp=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,lw*.7,5),gMat);sp.position.set(lx,lh+lw*.6,lz);lanka.add(sp)}
 else{var tw=new THREE.Mesh(new THREE.CylinderGeometry(lw*.22,lw*.3,lh*.8,8),bMat);tw.position.set(lx+lw*.7,lh+lh*.4,lz);lanka.add(tw);var tc=new THREE.Mesh(new THREE.ConeGeometry(lw*.34,lw*.9,8),gMat);tc.position.set(lx+lw*.7,lh*1.8+lw*.45,lz);lanka.add(tc)}}
var wall=new THREE.Mesh(new THREE.BoxGeometry(760,26,10),new THREE.MeshStandardMaterial({color:0x6e5226,roughness:.8,emissive:0x1a0c04}));wall.position.set(0,13,-350);lanka.add(wall);
scene.add(lanka);
var lankaFires=[];for(var lf=0;lf<26;lf++)lankaFires.push(new V3(rand(-300,300),rand(30,100),rand(-440,-360)));
var groundFires=[];for(var gf=0;gf<18;gf++){var gfa=rand(0,TAU),gfr=rand(60,150);groundFires.push(new V3(Math.cos(gfa)*gfr,0,Math.sin(gfa)*gfr))}
var mtnM=new THREE.MeshStandardMaterial({color:0x2c1612,roughness:1,flatShading:true});
for(var mi=0;mi<26;mi++){var ma=rand(0,TAU),mr=rand(640,880),mh=rand(70,190);var mt=new THREE.Mesh(new THREE.ConeGeometry(rand(90,170),mh,7),mtnM);mt.position.set(Math.cos(ma)*mr,mh/2-4,Math.sin(ma)*mr);scene.add(mt)}

/* ---------- humanoid builder ---------- */
function M(c,o){var p={color:c,roughness:.75,metalness:.05};if(o)for(var k in o)p[k]=o[k];return new THREE.MeshStandardMaterial(p)}
function mesh(g,m,par,x,y,z){var o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);o.castShadow=true;o.receiveShadow=true;if(par)par.add(o);return o}
function sph(r,a,b,c,d,e,f){return new THREE.SphereGeometry(r,a||16,b||12,c,d,e,f)}
function cyl(a,b,h,s){return new THREE.CylinderGeometry(a,b,h,s||14)}
function cone(r,h,s){return new THREE.ConeGeometry(r,h,s||8)}
function seg(m,a,b){var d=new V3().subVectors(b,a),L=d.length();m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(1,L,1);m.quaternion.setFromUnitVectors(new V3(0,1,0),d.normalize())}
var GOLD=M(0xe6b23f,{metalness:.4,roughness:.28,emissive:0x442a00});

function buildMace(col){
 var g=new THREE.Group(),iron=M(0x2e2e36,{metalness:.4,roughness:.4}),gm=col?M(col,{metalness:.4,roughness:.3,emissive:0x3a2400}):iron;
 mesh(cyl(.42,.5,10.5,10),M(0x4a3020,{roughness:.8}),g,0,-5.2,0);
 for(var i=0;i<3;i++){var t=mesh(new THREE.TorusGeometry(.55,.12,6,14),GOLD,g,0,-1.5-i*3.2,0);t.rotation.x=PI/2}
 mesh(sph(.7),GOLD,g,0,1,0);
 mesh(sph(2.3,20,14),gm,g,0,-11.8,0);
 var n=22;for(i=0;i<n;i++){var y=1-(i+.5)*2/n,r=Math.sqrt(1-y*y),a=i*2.399963;var d=new V3(Math.cos(a)*r,y,Math.sin(a)*r);
  var s=mesh(cone(.38,1.3,6),iron,g,d.x*2.5,-11.8+d.y*2.5,d.z*2.5);s.quaternion.setFromUnitVectors(new V3(0,1,0),d)}
 var head=new THREE.Object3D();head.position.set(0,-11.8,0);g.add(head);g.userData.head=head;return g}

function skinTex(hex,kind){var c0=new THREE.Color(hex),R_=Math.floor(c0.r*255),G_=Math.floor(c0.g*255),B_=Math.floor(c0.b*255);
 var t=cv(512,512,function(c,w,h){c.fillStyle='rgb('+R_+','+G_+','+B_+')';c.fillRect(0,0,w,h);var i,x,y,r,g;
  for(i=0;i<380;i++){x=rand(0,w);y=rand(0,h);r=rand(14,70);g=c.createRadialGradient(x,y,0,x,y,r);var d=Math.random()<.55;g.addColorStop(0,d?'rgba(20,6,2,'+(kind==='soft'?.08:.2)+')':'rgba(255,225,190,'+(kind==='soft'?.08:.13)+')');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
  if(kind==='fur'){for(i=0;i<4200;i++){x=rand(0,w);y=rand(0,h);var l=rand(6,18),an=rand(-.4,.4)+PI/2;c.strokeStyle=Math.random()<.5?'rgba(60,20,4,.35)':'rgba(255,200,110,.28)';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(an)*l,y+Math.sin(an)*l);c.stroke()}}
  else if(kind==='skin'){for(i=0;i<26;i++){x=rand(0,w);y=rand(0,h);c.strokeStyle='rgba(255,215,180,.35)';c.lineWidth=rand(1,2.2);c.beginPath();c.moveTo(x,y);c.lineTo(x+rand(-40,40),y+rand(-40,40));c.stroke()}
   for(i=0;i<40;i++){x=rand(0,w);y=rand(0,h);c.strokeStyle='rgba(60,10,6,.28)';c.lineWidth=1.4;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+rand(-30,30),y+rand(-30,30),x+rand(-30,30),y+rand(-30,30),x+rand(-50,50),y+rand(-50,50));c.stroke()}
   for(i=0;i<1800;i++){c.fillStyle='rgba(0,0,0,'+rand(.03,.1)+')';c.fillRect(rand(0,w),rand(0,h),rand(1,2.5),rand(1,2.5))}}
  else{for(i=0;i<900;i++){c.fillStyle='rgba(255,255,255,'+rand(.02,.05)+')';c.fillRect(rand(0,w),rand(0,h),rand(1,2),rand(1,2))}}});
 t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function lathe(p,seg){var a=[];for(var i=0;i<p.length;i++)a.push(new THREE.Vector2(p[i][0],p[i][1]));return new THREE.LatheGeometry(a,seg||20)}
function glowSpr(par,x,y,z,sz,hex,op){var g=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:hex,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:op}));g.scale.set(sz,sz,1);g.position.set(x,y,z);par.add(g);return g}
function buildHumanoid(o){
 var H={legs:[],arm:{}},root=new THREE.Group();H.root=root;
 var rak=o.type==='rak',ram=o.type==='rama',van=o.type==='van';
 var lw=rak?1.05:ram?.64:.9,th=ram?.72:rak?1.1:.88;
 var st=skinTex(o.skin,van?'fur':ram?'soft':'skin');
 var skin=M(0xffffff,{roughness:ram?.5:.62,map:st,bumpMap:st,bumpScale:rak?1.6:.5,emissive:rak?0x2a110a:ram?0x0a1430:0x000000});
 var dark=M(0x1a0c0a,{roughness:.9}),cloth=M(o.cloth,{roughness:.85,side:THREE.DoubleSide}),iron=M(0x2a2a32,{metalness:.4,roughness:.38}),gem=M(0xff2010,{emissive:0xc01008,emissiveIntensity:1.6});
 var eyeM=M(0xffd080,{emissive:0xff5a10,emissiveIntensity:2.2});H.eyeMats=[];
 /* legs */
 [-1,1].forEach(function(s){var hip=new THREE.Group();hip.position.set(s*2.1*(ram?.82:1),8.4,0);root.add(hip);
  mesh(lathe([[.001,-4.5],[.95,-4.3],[1.25,-3.2],[1.6,-1.8],[1.82,-.6],[1.7,.2],[.001,.3]],22),skin,hip).scale.set(th,1,th);
  var knee=new THREE.Group();knee.position.set(0,-4.3,0);hip.add(knee);
  mesh(sph(1.12,14,10),skin,knee).scale.set(th,1,th);
  mesh(lathe([[.001,-4.1],[.7,-3.9],[.95,-3.3],[1.3,-2.1],[1.42,-.9],[1.15,-.1],[.001,0]],22),skin,knee).scale.set(th,1,th);
  mesh(sph(1,14,10),skin,knee,0,-3.7,.9).scale.set(.95*th+.1,.5,1.9);
  if(rak){mesh(new THREE.CylinderGeometry(1.55*th,1.15*th,2.4,16,1,true),GOLD,knee,0,-1.9,0);var an=mesh(new THREE.TorusGeometry(1.0*th,.16,6,14),GOLD,knee,0,-3.35,0);an.rotation.x=PI/2}
  else{var an2=mesh(new THREE.TorusGeometry(.95*th,.1,6,14),GOLD,knee,0,-3.4,0);an2.rotation.x=PI/2}
  H.legs.push({hip:hip,knee:knee})});
 /* lower garment */
 if(ram){mesh(cyl(3.0,3.65,6.4,30),cloth,root,0,7.6,0);var bd=mesh(new THREE.TorusGeometry(3.62,.17,6,30),GOLD,root,0,4.5,0);bd.rotation.x=PI/2;
  for(var pl=0;pl<7;pl++){var pa=(pl-3)*.2,pm_=mesh(new THREE.BoxGeometry(.55,5.2,.14),M(0xffd870,{roughness:.55}),root,Math.sin(pa)*3.35,7.4,Math.cos(pa)*3.35);pm_.rotation.y=pa}}
 else mesh(cyl(3.3,4.1,5.2,26),cloth,root,0,8.3,0);
 var belt=mesh(new THREE.TorusGeometry(ram?3.1:3.4,.35,8,30),GOLD,root,0,10.9,0);belt.rotation.x=PI/2;
 /* torso */
 var upper=new THREE.Group();upper.position.set(0,9,0);root.add(upper);H.upper=upper;function U(y){return y-9}
 var tor=mesh(lathe([[.001,U(9.4)],[3.0*lw,U(9.6)],[3.5*lw,U(11)],[4.1*lw+.2,U(13)],[4.7*lw+.3,U(14.6)],[4.5*lw+.3,U(16)],[2.3,U(16.9)],[1.3,U(17.3)],[.001,U(17.4)]],30),skin,upper);tor.scale.set(1,1,.74);H.chest=tor;
 if(rak)mesh(sph(1,20,14),skin,upper,0,U(11),.6).scale.set(3.8,3.3,3.4);
 [-1,1].forEach(function(s){var pec=mesh(sph(1,16,12),skin,upper,s*1.95*lw,U(14.3),2.85*lw);pec.scale.set(2.1*lw,1.55,1.25);
  var tz=mesh(sph(1,12,10),skin,upper,s*1.9,U(16.4),-.2);tz.scale.set(1.6,.9,1.1)});
 mesh(cyl(1.15*lw+.2,1.5*lw+.3,1.9,16),skin,upper,0,U(17),0);
 var nk=mesh(new THREE.TorusGeometry(2.4*lw+.5,.3,8,26),GOLD,upper,0,U(16.2),.3);nk.rotation.x=PI/2.2;
 var sx=4.55*lw+.5;
 [-1,1].forEach(function(s){var p=new THREE.Group();p.position.set(s*sx,U(15.6),0);upper.add(p);
  mesh(sph(2.0*th+.15,16,12),skin,p).scale.set(1,.95,1);
  mesh(lathe([[.001,-3.8],[.95,-3.7],[1.15,-3.0],[1.5,-1.8],[1.58,-.8],[1.3,.1],[.001,.2]],20),skin,p).scale.set(th,1,th);
  var al=mesh(new THREE.TorusGeometry(1.52*th,.17,6,16),GOLD,p,0,-1.1,0);al.rotation.x=PI/2;
  var el=new THREE.Group();el.position.set(0,-3.7,0);p.add(el);mesh(sph(1.0),skin,el).scale.set(th,1,th);
  mesh(lathe([[.001,-3.7],[.78,-3.6],[1.0,-3.0],[1.25,-1.6],[1.27,-.4],[.95,0],[.001,.05]],20),skin,el).scale.set(th,1,th);
  mesh(cyl(1.14*th+.05,1.0*th+.05,rak?2.3:1.2,14),GOLD,el,0,rak?-2.3:-2.7,0);
  var hand=new THREE.Group();hand.position.set(0,-3.6,0);el.add(hand);mesh(sph(1.0),skin,hand).scale.set(th*.95,1.1,th*.8);
  H.arm[s<0?'L':'R']={pivot:p,elbow:el,hand:hand}});
 if(rak){
  [-1,1].forEach(function(s){var pa=H.arm[s<0?'L':'R'].pivot,el2=H.arm[s<0?'L':'R'].elbow;
   var pc=mesh(sph(1,20,14),GOLD,upper,s*2.4,U(14.9),2.45);pc.scale.set(2.3,1.85,1.15);
   var pd=mesh(sph(2.7,20,14),iron,pa,0,.5,0);pd.scale.set(1.08,.72,1.08);
   var rim=mesh(new THREE.TorusGeometry(2.5,.22,8,24),GOLD,pa,0,-.05,0);rim.rotation.x=PI/2;
   for(var q=0;q<3;q++){var sp=mesh(cone(.45,1.7,6),iron,pa,(q-1)*1.3,1.75,0);sp.rotation.z=(q-1)*-.28}
   for(q=0;q<2;q++)mesh(new THREE.TorusGeometry(1.3,.13,6,14),iron,el2,0,-1.5-q*1.6,0).rotation.x=PI/2});
  for(var ab=0;ab<3;ab++)[-1,1].forEach(function(s){var a=mesh(sph(.95,12,10),skin,upper,s*1.15,U(12.9-ab*1.25),3.1);a.scale.set(1,.72,.62)});
  var bk=mesh(sph(1.5,14,10),GOLD,root,0,10.9,3.9);bk.scale.set(1.1,1,.4);mesh(sph(.5,10,8),gem,root,0,10.9,4.25);mesh(sph(.42,10,8),gem,upper,0,U(15.2),3.65);
  for(var kp=0;kp<12;kp++){var ka=kp/12*TAU,pl2=mesh(new THREE.BoxGeometry(1.55,3.1,.22),kp%2?GOLD:iron,root,Math.sin(ka)*4.15,6.6,Math.cos(ka)*4.15);pl2.rotation.y=ka;pl2.rotation.x=-.12}
 }
 if(ram){
  for(var pr=0;pr<13;pr++){var a=(pr/12-.5)*2.5;mesh(sph(.2,8,6),pearl(),upper,Math.sin(a)*2.55,U(15.6)-(1-Math.cos(a))*1.6-.2,Math.cos(a)*1.9+.5)}
  var yc=new THREE.CatmullRomCurve3([new V3(2.6,U(16.4),1.6),new V3(.9,U(13.6),2.65),new V3(-1.2,U(11.7),2.6),new V3(-2.5,U(10.1),2.0)]);mesh(new THREE.TubeGeometry(yc,16,.14,6),M(0xfff0d0,{roughness:.6}),upper);
 }
 /* head */
 var head=new THREE.Group();head.position.set(0,U(18.4),0);upper.add(head);H.head=head;
 if(rak){
  mesh(sph(2.1,30,22),skin,head).scale.set(1,1.08,1.06);
  var br=mesh(new THREE.BoxGeometry(3.9,.55,1.1),skin,head,0,.82,1.62);br.rotation.x=.25;
  [-1,1].forEach(function(s){mesh(sph(.78,12,10),skin,head,s*1.15,-.25,1.55).scale.set(1,.8,.8);
   mesh(sph(.52,12,10),dark,head,s*.88,.42,1.76).scale.set(1,.7,.5);
   mesh(sph(.37,12,10),eyeM,head,s*.88,.4,1.86);H.eyeMats.push(eyeM);glowSpr(head,s*.88,.4,2.1,2.0,0xff6a20,.75);
   var hn=mesh(cone(.46,2.9,8),M(0xe8dcc0,{roughness:.5}),head,s*1.55,2.0,-.1);hn.rotation.z=-s*.5;
   var ear=mesh(sph(.6),skin,head,s*2.1,0,0);ear.scale.set(.35,1.1,.75);var er=mesh(new THREE.TorusGeometry(.42,.1,6,12),GOLD,head,s*2.25,-.95,0);er.rotation.y=PI/2;
   mesh(sph(.14,8,6),dark,head,s*.27,-.68,2.2)});
  mesh(cone(.55,1.5,8),skin,head,0,-.1,2.0).rotation.x=PI/2*.8;
  H.mouthMat=M(0x5a0806,{emissive:0xaa1808,emissiveIntensity:.8});mesh(sph(1,12,8),H.mouthMat,head,0,-1.15,1.5).scale.set(1.2,.42,.75);
  var jaw=new THREE.Group();jaw.position.set(0,-.85,.35);head.add(jaw);H.jaw=jaw;
  mesh(sph(1,14,10),skin,jaw,0,-.4,.8).scale.set(1.5,.62,1.45);
  [-1,1].forEach(function(s){mesh(cone(.32,2.1,6),M(0xf0e6cc,{roughness:.4}),jaw,s*1.1,.6,1.5).rotation.z=-s*.12;
   mesh(cone(.12,.5,5),M(0xf0e6cc),head,s*.55,-1.25,1.9).rotation.x=PI;
   for(var tq=0;tq<3;tq++)mesh(cone(.1,.4,5),M(0xf0e6cc),jaw,s*(.3+tq*.28),.2,1.95)});
  [-1,1].forEach(function(s){var mc=new THREE.CatmullRomCurve3([new V3(0,-.55,2.12),new V3(s*.8,-.8,2.0),new V3(s*1.6,-1.2,1.65),new V3(s*2.0,-1.9,1.2)]);mesh(new THREE.TubeGeometry(mc,12,.15,6),dark,head);
   for(var w=0;w<3;w++){var ws=mesh(new THREE.BoxGeometry(.95,.11,.11),M(0xc01810,{emissive:0x600800}),head,s*1.22,-.1-w*.3,1.78);ws.rotation.set(0,s*.8,s*.25)}});
  mesh(sph(2.25,18,10,0,TAU,0,PI*.52),M(0x0c0605,{roughness:.9}),head,0,.2,-.2);
  mesh(cyl(1.8,2.1,1.05,18),GOLD,head,0,1.75,0);mesh(cone(.75,3.0,8),GOLD,head,0,3.9,0);mesh(sph(.3,8,6),gem,head,0,2.9,.8);
  for(var i=0;i<7;i++){var a2=i/7*TAU,sp2=mesh(cone(.3,1.3,6),GOLD,head,Math.cos(a2)*1.95,2.55,Math.sin(a2)*1.95);sp2.rotation.z=-Math.cos(a2)*.15}
  mesh(sph(.34,8,6),gem,head,0,1.85,2.05);
 }else if(van){
  var fc=M(0xc7452a,{roughness:.7}),fur=skin;
  mesh(sph(1.9,18,14),fc,head).scale.set(1,1.05,1);
  mesh(sph(2.0,18,10,0,TAU,0,PI*.56),fur,head,0,.3,-.15);
  mesh(sph(.95,12,10),fc,head,0,-.55,1.55).scale.set(1.15,.8,1);
  [-1,1].forEach(function(s){mesh(sph(.38,10,8),M(0xffffff),head,s*.75,.45,1.55);mesh(sph(.2,8,6),dark,head,s*.75,.45,1.88);
   var ear=mesh(sph(.65),fur,head,s*1.95,.2,-.1);ear.scale.set(.4,1,.8);
   mesh(cone(.12,.5,5),M(0xf0e6cc),head,s*.5,-1.1,2.1).rotation.x=PI;mesh(sph(.12),dark,head,s*.3,-.35,2.45)});
  mesh(cyl(1.5,1.8,.9,16),GOLD,head,0,1.7,0);mesh(sph(.3,8,6),M(0xd01818,{emissive:0x880a0a}),head,0,1.8,1.7);
  var jaw2=new THREE.Group();jaw2.position.set(0,-.8,.4);head.add(jaw2);H.jaw=jaw2;mesh(sph(.8),fc,jaw2,0,-.25,1).scale.set(1.2,.5,1);
  H.eyeMats.push(eyeM);
  var tc=new THREE.CatmullRomCurve3([new V3(0,9,-2.8),new V3(0,6,-7),new V3(1,3.5,-12),new V3(3.5,6,-16),new V3(3.5,12,-14.5),new V3(1.5,18,-10.5),new V3(-.5,22,-8)]);
  H.tail=new THREE.Group();root.add(H.tail);mesh(new THREE.TubeGeometry(tc,40,.75,8),fur,H.tail);mesh(sph(1.4),fur,H.tail,-.5,22.4,-8);
 }else{ /* Rama */
  mesh(sph(1.75,30,22),skin,head).scale.set(.92,1.08,1);
  mesh(sph(1,16,12),skin,head,0,-.75,.35).scale.set(1.1,1.0,1.1);
  [-1,1].forEach(function(s){var ew=mesh(sph(.25,12,10),M(0xffffff,{roughness:.3}),head,s*.62,.28,1.5);ew.scale.set(1,.65,.5);
   mesh(sph(.13,10,8),dark,head,s*.62,.28,1.62);
   var eb=mesh(new THREE.BoxGeometry(.85,.1,.14),dark,head,s*.64,.66,1.5);eb.rotation.z=s*.16;
   var ear=mesh(sph(.5),skin,head,s*1.62,0,0);ear.scale.set(.3,1.1,.7);mesh(sph(.2,8,6),GOLD,head,s*1.7,-.75,0);mesh(new THREE.TorusGeometry(.3,.07,6,12),GOLD,head,s*1.72,-1.1,0).rotation.y=PI/2});
  var nz=mesh(cone(.17,.62,6),skin,head,0,-.1,1.72);nz.rotation.x=PI/2*.85;
  mesh(sph(1,10,8),M(0xa8504a,{roughness:.45}),head,0,-.64,1.56).scale.set(.38,.1,.16);mesh(sph(1,10,8),M(0xa8504a,{roughness:.45}),head,0,-.8,1.52).scale.set(.32,.11,.16);
  var hr=mesh(sph(1.15,14,10),dark,head,0,.1,-1.05);hr.scale.set(1.1,1.35,.75);
  mesh(sph(.9,14,10),dark,head,0,2.15,-.3);
  mesh(new THREE.TorusGeometry(1.35,.09,6,22),GOLD,head,0,.95,0).rotation.x=PI/2;
  mesh(new THREE.BoxGeometry(.12,.38,.1),M(0xe02010,{emissive:0xaa1000}),head,0,.92,1.66);
  mesh(cyl(.55,1.55,2.5,18),GOLD,head,0,2.0,0);for(var j=0;j<8;j++){var b=j/8*TAU;mesh(cone(.2,.9,6),GOLD,head,Math.cos(b)*1.45,1.0,Math.sin(b)*1.45)}
  mesh(sph(.34,8,6),M(0x2e8bff,{emissive:0x1a60ff,emissiveIntensity:1.4}),head,0,1.6,1.45);
  var halo=new THREE.Mesh(new THREE.TorusGeometry(3.4,.1,8,40),new THREE.MeshBasicMaterial({color:0xffd47a,transparent:true,opacity:.85,depthWrite:false}));halo.position.set(0,.7,-1.6);head.add(halo);H.halo=halo;
  var disc=new THREE.Mesh(new THREE.CircleGeometry(3.4,32),new THREE.MeshBasicMaterial({color:0xffc060,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));disc.position.set(0,.7,-1.65);head.add(disc);
  var qv=mesh(cyl(.9,.75,6.5,10),M(0x6a3a1a,{roughness:.8}),upper,2,U(14.5),-2.6);qv.rotation.z=.35;
  for(j=0;j<5;j++){mesh(cone(.22,.8,5),M(0xffffff),upper,2+Math.sin(.35)*(-3.2)+Math.cos(j)*.4,U(14.5)+3.3,-2.6+Math.sin(j*2)*.4)}
 }
 return H}
function pearl(){return M(0xfff4e0,{roughness:.25,metalness:.2})}

/* mace for giants */
function giveMace(H,col){var m=buildMace(col);H.arm.R.hand.add(m);H.mace=m;H.maceHead=m.userData.head}
/* bow for Rama */
function giveBow(H){
 var bow=new THREE.Group();H.arm.L.hand.add(bow);bow.rotation.x=PI/2;bow.scale.setScalar(1.4);H.bow=bow;
 var pts=[];for(var i=0;i<=12;i++){var y=-6+i;pts.push(new V3(0,y,2.2*(1-(y/6)*(y/6))))}
 mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.2,6),M(0x5a2f12,{roughness:.6}),bow);
 mesh(cyl(.35,.35,1.6,8),GOLD,bow,0,0,2.2);
 var sm=new THREE.MeshBasicMaterial({color:0xfff0c0});H.s1=new THREE.Mesh(cyl(.05,.05,1,4),sm);H.s2=new THREE.Mesh(cyl(.05,.05,1,4),sm);bow.add(H.s1);bow.add(H.s2);
 H.nock=new THREE.Group();bow.add(H.nock);var sh=mesh(cyl(.08,.08,8,6),M(0xffe0a0),H.nock,0,4,0);mesh(cone(.22,.8,6),GOLD,H.nock,0,8.2,0);H.nock.rotation.x=PI/2;H.nock.visible=false;
 H.setString=function(d){var a=new V3(0,-6,0),b=new V3(0,6,0),c=new V3(0,0,-d);seg(H.s1,a,c);seg(H.s2,c,b);H.nock.visible=d>.4;H.nock.position.set(0,0,-d)};
 H.setString(0)}

/* Kumbhakarna */
var K=buildHumanoid({type:'rak',skin:0x8a5440,cloth:0x6a0f0c});giveMace(K,0x2e2e36);scene.add(K.root);
K.root.userData.yaw=0;
/* Rama */
var R=buildHumanoid({type:'rama',skin:0x4678c8,cloth:0xf0b02c,belly:.55,chest:.62,thin:.68});giveBow(R);R.root.scale.setScalar(.17);scene.add(R.root);
var ramaGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0x8ab4ff,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.55}));ramaGlow.scale.set(9,9,1);scene.add(ramaGlow);
var mandalaTex=cv(256,256,function(c,w,h){c.translate(128,128);c.strokeStyle='rgba(255,215,120,.95)';c.lineWidth=3;[110,92,60].forEach(function(r){c.beginPath();c.arc(0,0,r,0,TAU);c.stroke()});
 for(var i=0;i<12;i++){c.rotate(TAU/12);c.beginPath();c.moveTo(60,0);c.quadraticCurveTo(84,14,108,0);c.quadraticCurveTo(84,-14,60,0);c.stroke()}});
var mandala=new THREE.Mesh(new THREE.CircleGeometry(3.6,48),new THREE.MeshBasicMaterial({map:mandalaTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.75}));mandala.rotation.x=-PI/2;mandala.position.y=.1;scene.add(mandala);
/* Hanuman */
var HN=buildHumanoid({type:'van',skin:0xd88a2e,cloth:0xd23a22,belly:.9});giveMace(HN,0xd9a93a);HN.root.scale.setScalar(.92);HN.root.position.set(-20,0,70);HN.root.rotation.y=PI;scene.add(HN.root);
HN.arm.R.pivot.rotation.x=-.3;HN.arm.R.elbow.rotation.x=-2.6;HN.arm.L.pivot.rotation.z=-.15;
var hnGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffa040,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.35}));hnGlow.scale.set(34,34,1);hnGlow.position.set(-20,10,70);scene.add(hnGlow);

/* ---------- armies ---------- */
function drawB(c,w,h,txt,bg,fg){c.fillStyle=bg;c.fillRect(0,0,w,h);c.strokeStyle=fg;c.lineWidth=6;c.strokeRect(8,8,w-16,h-16);c.fillStyle=fg;c.font='700 78px "Tiro Devanagari Hindi","Noto Serif Devanagari",serif';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,w/2,h/2+4)}
function bannerTex(txt,bg,fg){var t=cv(256,170,function(c,w,h){drawB(c,w,h,txt,bg,fg)});t.userData={txt:txt,bg:bg,fg:fg};return t}
var banners=[];
function addBanner(x,z,tex,face){var g=new THREE.Group();mesh(cyl(.14,.18,15,6),M(0x3a2414),g,0,7.5,0);mesh(sph(.35),GOLD,g,0,15.2,0);
 var cl=new THREE.Mesh(new THREE.PlaneGeometry(5,3.3,10,5),new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,roughness:.85}));cl.position.set(2.5,13,0);cl.castShadow=false;g.add(cl);
 g.position.set(x,0,z);g.rotation.y=face;scene.add(g);banners.push({m:cl,base:cl.geometry.attributes.position.array.slice(),ph:rand(0,6)})}
var ramTex=bannerTex('राम','#e8741c','#fff1c0'),lankTex=bannerTex('लंका','#2a0808','#e6b23f');
var bannerTexs=[ramTex,lankTex];
if(document.fonts&&document.fonts.load){document.fonts.load('700 40px "Tiro Devanagari Hindi"','राम').then(function(){bannerTexs.forEach(function(t){var u=t.userData;drawB(t.image.getContext('2d'),256,170,u.txt,u.bg,u.fg);t.needsUpdate=true})}).catch(function(){})}
function makeArmy(n,side){
 var sgn=side==='lanka'?-1:1,lg=cyl(.17,.14,1.2,6);lg.translate(0,-.6,0);
 var bodyG=cyl(.58,.48,1.55,8),headG=sph(.42,10,8),spearG=cyl(.05,.05,4.4,4),shieldG=cyl(.62,.62,.08,10),hornG=cone(.1,.6,5),tailG=cyl(.05,.1,2.3,5),helmG=cone(.46,.7,8);
 var mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85}),mats=new THREE.MeshStandardMaterial({color:0xc8c8d0,metalness:.4,roughness:.38}),mh=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.7});
 var body=new THREE.InstancedMesh(bodyG,mat,n),head=new THREE.InstancedMesh(headG,mh,n),spear=new THREE.InstancedMesh(spearG,new THREE.MeshStandardMaterial({color:0x7a5230}),n),shield=new THREE.InstancedMesh(shieldG,mats,n),legs=new THREE.InstancedMesh(lg,mat,n*2);
 var horns=side==='lanka'?new THREE.InstancedMesh(hornG,new THREE.MeshStandardMaterial({color:0xe8dcc0}),n*2):null;
 var helm=side==='lanka'?new THREE.InstancedMesh(helmG,mats,n):null,tails=side==='vanara'?new THREE.InstancedMesh(tailG,mat,n):null;
 var col=new THREE.Color(),A={n:n,side:side,d:[],o:new THREE.Object3D()};
 var pal=side==='lanka'?[0x4a1010,0x2a1a1c,0x5d2216,0x222230,0x6a2412]:[0xc87a36,0xa8602c,0xd8903c,0x9a6a40,0xe0a050];
 var cols=56,rows=Math.ceil(n/cols);
 for(var i=0;i<n;i++){var c=i%cols,r=Math.floor(i/cols);var x=(c-cols/2)*2.4+rand(-.6,.6)+(r%2)*1.2,z=sgn*(48+r*2.9)+rand(-.6,.6);
  if(side==='vanara'&&Math.hypot(x+20,z-70)<11){x+=x<-20?-11:11}
  A.d.push({x:x,z:z,ph:rand(0,TAU),sc:rand(.95,1.2),sp:rand(.7,1.3)});
  col.setHex(pal[i%pal.length]);col.offsetHSL(0,0,rand(-.04,.04));body.setColorAt(i,col);legs.setColorAt(i*2,col);legs.setColorAt(i*2+1,col);
  col.setHex(side==='lanka'?0x4a3028:0x6a4a30);spear.setColorAt(i,col);col.setHex(side==='lanka'?0x8a8a94:0xb89060);shield.setColorAt(i,col);
  col.setHex(side==='lanka'?0x4a5a50:0xc87a36);col.offsetHSL(0,0,rand(-.05,.05));head.setColorAt(i,col);if(tails){col.setHex(pal[i%pal.length]);tails.setColorAt(i,col)}}
 [body,head,spear,shield,legs].forEach(function(m){m.frustumCulled=false;scene.add(m)});if(horns){horns.frustumCulled=false;scene.add(horns)}if(helm){helm.frustumCulled=false;scene.add(helm)}if(tails){tails.frustumCulled=false;scene.add(tails)}
 A.raise=0;A.step=0;
 A.update=function(t,rs){this.step^=1;var o=this.o,ra=this.raise,fy=sgn>0?PI:0;
  for(var i=0;i<n;i++){if((i&1)===this.step&&!this.force)continue;var d=this.d[i],ph=t*2.2*d.sp+d.ph,f=Math.abs(Math.sin(ph)),by=f*(.14+.5*ra),s=d.sc,sw=Math.sin(ph)*(.5+.3*ra);
   o.rotation.set(0,fy,0);o.scale.set(s,s,s);
   o.position.set(d.x,1.9*s+by,d.z);o.updateMatrix();body.setMatrixAt(i,o.matrix);
   o.position.set(d.x,3.1*s+by,d.z);o.updateMatrix();head.setMatrixAt(i,o.matrix);
   o.rotation.set(sw,fy,0);o.position.set(d.x-.26*s,1.2*s+by*.5,d.z);o.updateMatrix();legs.setMatrixAt(i*2,o.matrix);
   o.rotation.set(-sw,fy,0);o.position.set(d.x+.26*s,1.2*s+by*.5,d.z);o.updateMatrix();legs.setMatrixAt(i*2+1,o.matrix);
   o.rotation.set(Math.sin(t*1.7+d.ph)*.08-ra*.25*f,fy,.06);o.position.set(d.x+.8*s,3.4*s+by+ra*f*1.2,d.z);o.updateMatrix();spear.setMatrixAt(i,o.matrix);
   o.rotation.set(PI/2,fy,0);o.position.set(d.x-.8*s,2.0*s+by,d.z+sgn*.5);o.updateMatrix();shield.setMatrixAt(i,o.matrix);
   if(horns){o.rotation.set(0,0,.5);o.position.set(d.x-.28*s,3.5*s+by,d.z);o.updateMatrix();horns.setMatrixAt(i*2,o.matrix);o.rotation.set(0,0,-.5);o.position.set(d.x+.28*s,3.5*s+by,d.z);o.updateMatrix();horns.setMatrixAt(i*2+1,o.matrix);
    o.rotation.set(0,0,0);o.position.set(d.x,3.5*s+by,d.z);o.updateMatrix();helm.setMatrixAt(i,o.matrix)}
   if(tails){o.rotation.set(-sgn*(.9+Math.sin(ph*.7)*.2),fy,0);o.position.set(d.x,1.7*s+by,d.z-sgn*(-.9)*s*0+sgn*.9*s);o.updateMatrix();tails.setMatrixAt(i,o.matrix)}}
  body.instanceMatrix.needsUpdate=head.instanceMatrix.needsUpdate=spear.instanceMatrix.needsUpdate=shield.instanceMatrix.needsUpdate=legs.instanceMatrix.needsUpdate=true;if(horns){horns.instanceMatrix.needsUpdate=true;helm.instanceMatrix.needsUpdate=true}if(tails)tails.instanceMatrix.needsUpdate=true};
 A.force=true;A.update(0);A.force=false;return A}
var lankaArmy=makeArmy(2016,'lanka'),vanaraArmy=makeArmy(2016,'vanara');
for(var bn=0;bn<14;bn++){addBanner(-84+bn*13,-52-rand(0,40),lankTex,0);addBanner(-84+bn*13,52+rand(0,40),ramTex,PI)}

/* ---------- war elephants of Lanka ---------- */
function buildElephant(){var g=new THREE.Group(),sk=M(0x6e655c,{roughness:.92}),dk=M(0x4a423a,{roughness:.95}),cl=M(0x8a1410,{roughness:.8,side:THREE.DoubleSide});
 mesh(sph(1,18,14),sk,g,0,6.4,0).scale.set(3.3,3.0,5.4);
 [[-2,-3.2],[2,-3.2],[-2,3.2],[2,3.2]].forEach(function(p){mesh(cyl(1.15,1.0,5,10),sk,g,p[0],2.5,p[1]);mesh(cyl(1.2,1.2,.5,10),dk,g,p[0],.3,p[1])});
 mesh(sph(1,16,12),sk,g,0,7.6,5.9).scale.set(2.1,2.3,2.4);
 [-1,1].forEach(function(s){var ear=mesh(sph(1,12,10),dk,g,s*2.6,8,5.2);ear.scale.set(.35,2.2,1.7);
  var tk=mesh(cone(.34,3.6,8),M(0xf0e6cc,{roughness:.4}),g,s*1.2,5.6,8.2);tk.rotation.x=PI/2*.78;tk.rotation.z=-s*.12;
  mesh(sph(.28,8,6),M(0x111111),g,s*1.0,8.4,7.8)});
 var tc=new THREE.CatmullRomCurve3([new V3(0,7.2,7.7),new V3(0,5.2,9.0),new V3(0,2.8,9.8),new V3(0,1.4,9.4)]);mesh(new THREE.TubeGeometry(tc,16,.8,8),sk,g);
 var bl=mesh(new THREE.BoxGeometry(6.8,.2,6.6),cl,g,0,9.1,-.2);
 var tp=mesh(new THREE.BoxGeometry(6.8,3.6,.2),GOLD,g,0,7.2,-3.4);tp.scale.set(.0001,.0001,.0001);
 var hw=mesh(new THREE.BoxGeometry(3.4,.4,3.4),GOLD,g,0,9.6,-.2);
 [[-1.6,-1.8],[1.6,-1.8],[-1.6,1.4],[1.6,1.4]].forEach(function(p){mesh(cyl(.12,.12,3,6),GOLD,g,p[0],11,p[1])});
 mesh(cone(2.6,1.4,4),cl,g,0,13.1,-.2).rotation.y=PI/4;
 return g}
[-78,-48,48,78,0].forEach(function(x,i){var e=buildElephant();e.position.set(x,0,-86-(i%2)*14);e.rotation.y=rand(-.2,.2);e.scale.setScalar(1.15);scene.add(e)});

/* ---------- audio ---------- */
var AC=null,master=null,nbuf=null;
function initAudio(){if(!roarEl)loadRoar();if(AC)return;try{var C=window.AudioContext||window.webkitAudioContext;AC=new C();master=AC.createGain();master.gain.value=.75;master.connect(AC.destination);
 nbuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);var d=nbuf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 var s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nbuf;s.loop=true;f.type='lowpass';f.frequency.value=280;g.gain.value=.07;s.connect(f);f.connect(g);g.connect(master);s.start()}catch(e){AC=null}}
function tn(f0,f1,dur,type,vol,delay,lp){if(!AC)return;var t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
 g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.05,dur*.2));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 if(lp){var f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;o.connect(f);f.connect(g)}else o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05)}
function ns(dur,vol,f0,f1,type,delay,q){if(!AC)return;var t=AC.currentTime+(delay||0),s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nbuf;s.loop=true;f.type=type||'lowpass';
 f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);if(q)f.Q.value=q;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.04,dur*.2));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+dur+.05)}
var ROAR_SRC=['/audio/roar.mp3','public/audio/roar.mp3'],roarEl=null,roarIdx=0,roarOK=false;
function loadRoar(){try{roarEl=new Audio();roarEl.preload='auto';roarEl.addEventListener('canplaythrough',function(){roarOK=true});
 roarEl.addEventListener('error',function(){roarOK=false;roarIdx++;if(roarIdx<ROAR_SRC.length){roarEl.src=ROAR_SRC[roarIdx];roarEl.load()}});roarEl.src=ROAR_SRC[0];roarEl.load()}catch(e){roarEl=null}}
function synthRoar(){tn(95,48,2.6,'sawtooth',.38,0,520);tn(190,70,2.2,'sawtooth',.16,.05,700);tn(60,38,2.8,'square',.2,0,200);ns(2.4,.55,900,160,'bandpass',0,1.5)}
var sfx={roar:function(){if(roarOK&&roarEl){try{roarEl.currentTime=0;roarEl.volume=1;var pr=roarEl.play();if(pr&&pr.catch)pr.catch(function(){synthRoar()})}catch(e){synthRoar()}}else synthRoar()},_old:function(){tn(95,48,2.6,'sawtooth',.38,0,520);tn(190,70,2.2,'sawtooth',.16,.05,700);tn(60,38,2.8,'square',.2,0,200);ns(2.4,.55,900,160,'bandpass',0,1.5)},
 boom:function(v){v=v||1;tn(70,26,.9,'sine',.9*v);ns(.8,.7*v,500,50,'lowpass')},twang:function(){tn(520,180,.12,'triangle',.16);ns(.18,.16,3000,900,'highpass')},
 hit:function(){ns(.12,.3,2400,500,'bandpass');tn(180,60,.15,'square',.1)},hurt:function(){tn(120,50,.35,'sawtooth',.3,0,400);ns(.3,.4,800,120,'lowpass')},
 divine:function(){tn(220,880,1,'sine',.25);tn(330,1320,1,'triangle',.12);ns(.9,.25,600,5000,'bandpass',0,3)},explode:function(){tn(90,24,1.4,'sine',1);ns(1.3,.9,1400,60,'lowpass')},
 whoosh:function(){ns(.35,.2,300,2200,'bandpass',0,1.2)},drum:function(v){tn(110,45,.4,'sine',.35*(v||1))},die:function(){tn(80,22,4.5,'sawtooth',.4,0,300);ns(4,.5,600,50,'lowpass')},
 step:function(){tn(60,28,.45,'sine',.5);ns(.3,.25,400,60,'lowpass')}};

/* ---------- ui helpers ---------- */
var shake=0;function addShake(v){shake=Math.min(1.3,shake+v)}
var subTimer=0,capTimer=0;
function say(who,txt,dur){var s=$('subs');s.innerHTML='<b>'+who+'</b>'+txt;s.classList.add('on');clearTimeout(subTimer);subTimer=setTimeout(function(){s.classList.remove('on')},(dur||3.2)*1000)}
function toast(txt){var t=$('toast');t.textContent=txt;t.classList.remove('on');void t.offsetWidth;t.classList.add('on')}
function card(hi,en,sm,dur){var c=$('cap');c.querySelector('.hi').textContent=hi||'';c.querySelector('.en').textContent=en||'';c.querySelector('.sm').textContent=sm||'';c.classList.add('on');clearTimeout(capTimer);capTimer=setTimeout(function(){c.classList.remove('on')},(dur||3)*1000)}
function flashHit(){var h=$('hitflash');h.style.transition='none';h.style.opacity=1;void h.offsetWidth;h.style.transition='opacity .45s';h.style.opacity=0}

/* ---------- effects ---------- */
var effects=[],ringG=new THREE.RingGeometry(.86,1,72),ringE=new THREE.RingGeometry(.955,1,72),circG=new THREE.CircleGeometry(1,48),ringFill=new THREE.RingGeometry(.59,1,72);
function shock(x,z,r0,r1,dur,hex,op,y){var m=new THREE.Mesh(ringG,new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 m.rotation.x=-PI/2;m.position.set(x,y||.25,z);scene.add(m);var t=0;
 effects.push(function(dt){t+=dt;var p=t/dur;if(p>=1){scene.remove(m);m.material.dispose();return false}var e=1-Math.pow(1-p,2.2),r=lerp(r0,r1,e);m.scale.set(r,r,1);m.material.opacity=op*(1-p);return true})}
var craterTex=cv(128,128,function(c,w,h){var g=c.createRadialGradient(64,64,6,64,64,64);g.addColorStop(0,'rgba(10,4,2,.85)');g.addColorStop(.6,'rgba(24,10,5,.55)');g.addColorStop(1,'rgba(24,10,5,0)');c.fillStyle=g;c.fillRect(0,0,w,h)});
function crater(x,z,r){var m=new THREE.Mesh(circG,new THREE.MeshBasicMaterial({map:craterTex,transparent:true,depthWrite:false,opacity:.9}));m.rotation.x=-PI/2;m.position.set(x,.09,z);m.scale.set(r*1.15,r*1.15,1);scene.add(m);var t=0;
 effects.push(function(dt){t+=dt;if(t>9){scene.remove(m);m.material.dispose();return false}m.material.opacity=.9*Math.min(1,(9-t)/3);return true})}
function dustBurst(x,z,n,pw,sz,y){for(var i=0;i<n;i++){var a=rand(0,TAU),v=rand(.3,1)*pw;dust.spawn(x+Math.cos(a)*1.5,(y||.4)+rand(0,.8),z+Math.sin(a)*1.5,Math.cos(a)*v,rand(1,4)*pw*.12,Math.sin(a)*v,0x8a6a48,0x3a2a1e,sz*rand(.6,1),sz*rand(2,3.2),rand(1.2,2.4),-.6,1.3)}}
function sparks(x,y,z,n,pw,hex){for(var i=0;i<n;i++){var a=rand(0,TAU),u=rand(-.3,1),v=rand(.4,1)*pw;fx.spawn(x,y,z,Math.cos(a)*v,u*v+pw*.3,Math.sin(a)*v,hex||0xffe0a0,0xff3a10,rand(.25,.5),.03,rand(.3,.8),16,.4)}}
function fireBurst(x,y,z,n,pw,sz){for(var i=0;i<n;i++){var a=rand(0,TAU),u=rand(-.2,1),v=rand(.2,1)*pw;fx.spawn(x+rand(-1,1),y+rand(0,1.5),z+rand(-1,1),Math.cos(a)*v,u*v*.8+pw*.2,Math.sin(a)*v,0xffd27a,0xb02008,sz*rand(.6,1),sz*rand(1.6,2.4),rand(.5,1.1),-2,.8)}}

function Tele(kind){this.kind=kind;var g=new THREE.Group();g.position.y=.14;scene.add(g);this.g=g;
 function mk(geo,hex,op){var m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));m.rotation.x=-PI/2;g.add(m);return m}
 if(kind==='circle'){this.fill=mk(circG,0xff2a10,.2);this.ch=mk(circG,0xff4a18,.38);this.edge=mk(ringE,0xff8a40,.95)}
 else{this.fill=mk(ringFill,0xff2a10,.2);this.edge=mk(ringE,0xff8a40,.95);this.edge2=mk(ringE,0xff8a40,.95)}}
Tele.prototype.set=function(x,z,r,p){this.g.position.x=x;this.g.position.z=z;p=clamp(p,0,1);
 if(this.kind==='circle'){this.fill.scale.set(r,r,1);this.edge.scale.set(r,r,1);this.ch.scale.set(r*p,r*p,1);this.fill.material.opacity=.14+.12*Math.sin(T*18)}
 else{this.fill.scale.set(r,r,1);this.edge.scale.set(r,r,1);var ri=r*.59;this.edge2.scale.set(ri,ri,1);this.fill.material.opacity=.1+.2*p}};
Tele.prototype.dispose=function(){scene.remove(this.g);this.g.traverse(function(o){if(o.material)o.material.dispose()})};

/* ---------- state ---------- */
var T=0,ts=1;
var boss={hp:1800,max:1800,phase:1,yaw:0,x:0,z:0,atk:null,cool:2.2,flash:0,active:false,dead:false,walkPh:0,stun:0,last:'',sw:null,sw2:0,checkSweep:false,lag:1800};
var P={x:0,z:28,yaw:PI,vx:0,vz:0,hp:10000,max:10000,floor:900,inv:0,roll:0,rollCd:0,rdx:0,rdz:0,shootCd:0,drawT:0,draw:0,div:0,hurtT:0,kx:0,kz:0,walk:0,charge:0,mv:0,since:9};
var inp={x:0,y:0,shoot:false,roll:false,div:false};
var Rg=new THREE.Group(),Rmid=new THREE.Group();Rg.add(Rmid);Rmid.position.y=1.5;Rmid.add(R.root);R.root.position.y=-1.5;scene.add(Rg);
var hazards=[],arrows=[];

/* Kumbhakarna material flash */
var kMats=[];K.root.traverse(function(o){if(o.isMesh&&o.material&&o.material.emissive&&kMats.indexOf(o.material)<0){kMats.push(o.material);o.material.userData.e0=o.material.emissive.getHex()}});
var flashC=new THREE.Color(1,.45,.15),kFl=0;
function flashK(a){a=clamp(a,0,1);if(a===kFl&&a===0)return;kFl=a;kMats.forEach(function(m){m.emissive.setHex(m.userData.e0);if(a>0)m.emissive.lerp(flashC,a*.8)})}

/* pose rig */
var cp={rP:-.3,rE:-1.9,lP:0,lE:0,pitch:0,jaw:0,head:0,lift:0,sag:0},tp={rP:-.3,rE:-1.9,lP:0,lE:0,pitch:0,jaw:0,head:0,lift:0,sag:0},rt={};
function applyPose(dt){for(var k in cp){var r=rt[k]||9;cp[k]+=(tp[k]-cp[k])*(1-Math.exp(-r*dt))}}
function resetTargets(){tp.rP=-.3;tp.rE=-1.9;tp.lP=0;tp.lE=0;tp.pitch=0;tp.jaw=0;tp.head=0;tp.lift=0;tp.sag=0;rt={}}
/* slam geometry measured from the rig itself */
var slamLocal=(function(){K.arm.R.pivot.rotation.x=-.72;K.arm.R.elbow.rotation.x=-.05;K.upper.rotation.x=.32;K.root.updateMatrixWorld(true);var p=new V3();K.maceHead.getWorldPosition(p);var l=K.root.worldToLocal(p);
 K.arm.R.pivot.rotation.x=0;K.arm.R.elbow.rotation.x=0;K.upper.rotation.x=0;return l})();
var tv=new V3(),tv2=new V3();
function slamPoint(){tv.copy(slamLocal);K.root.localToWorld(tv);return tv}

/* ---------- Rama takes a hit (never falls) ---------- */
function hurtRama(dmg,sx,sz){if(P.inv>0||P.roll>0||boss.dead)return false;
 P.hp=Math.max(P.floor,P.hp-dmg);P.inv=.8;P.since=0;var dx=P.x-sx,dz=P.z-sz,d=Math.hypot(dx,dz)||1;P.kx=dx/d*22;P.kz=dz/d*22;P.hurtT=.35;
 addShake(.7);flashHit();sfx.hurt();sparks(P.x,1.4,P.z,22,9,0xffd27a);
 if(P.hp<=P.floor&&!P.fl){P.fl=1;toast('DHARMA PROTECTS HIM');var g=$('grace');g.style.transition='none';g.style.opacity=1;void g.offsetWidth;g.style.transition='opacity 1.2s';g.style.opacity=0}
 return true}

/* ---------- impacts ---------- */
function impactAt(x,z,r,dmg,mag){shock(x,z,1,r*2.1,.7,0xffb060,.85);shock(x,z,1,r*3.4,1.1,0xff7a30,.35);crater(x,z,r);dustBurst(x,z,34,16*mag,2.6);sparks(x,.8,z,34,18*mag,0xffd27a);fireBurst(x,.6,z,14,6*mag,2.4);
 addShake(.6*mag);sfx.boom(mag);if(Math.hypot(P.x-x,P.z-z)<r)hurtRama(dmg,x,z)}

/* ---------- boss: damage / phases ---------- */
function damageBoss(n,x,y,z,crit){if(boss.dead||!boss.active)return;boss.hp=Math.max(0,boss.hp-n);boss.flash=.16;
 if(boss.hp<=0){startDeath();return}
 if(boss.phase===1&&boss.hp<=1200)triggerPhase(2);else if(boss.phase===2&&boss.hp<=600)triggerPhase(3)}
function triggerPhase(n){boss.phase=n;if(boss.atk&&boss.atk.tele)boss.atk.tele.dispose();boss.checkSweep=false;boss.atk={type:'rage',t:0,tele:null,done:false};
 if(n===2){say('KUMBHAKARNA','Your arrows sting, Rama. But Lanka has not yet fallen.',3.6);toast('THE GIANT GROWS WRATHFUL')}
 else{say('KUMBHAKARNA','Then let this be a warrior’s end. Come!',3.6);toast('HIS FURY IS UNBOUND')}}
function endAttack(c){var b=boss;if(b.atk&&b.atk.tele)b.atk.tele.dispose();b.atk=null;b.checkSweep=false;b.cool=c*rand(.75,1.3)*(b.phase===3?.6:b.phase===2?.85:1.1)}
function startAttack(dist){var b=boss,o=['slam'];if(dist<23)o.push('sweep');if(b.phase>=2&&dist<28)o.push('stomp');if(b.phase>=3)o.push('rocks');
 if(o.length>1)o=o.filter(function(x){return x!==b.last});var ty=o[Math.floor(Math.random()*o.length)];b.last=ty;b.atk={type:ty,t:0,hit:false,n:0,tele:null,roar:false};
 if(ty==='slam'||ty==='stomp')b.atk.tele=new Tele('circle');else if(ty==='sweep')b.atk.tele=new Tele('ring')}

function attackUpdate(dt,want,dist){var b=boss,a=b.atk,sp=b.phase===3?.78:b.phase===2?.9:1;a.t+=dt;var t=a.t;b.yawOff=0;
 if(a.type==='slam'){var w=1.15*sp,r=.95*sp;
  if(t<w){tp.rP=-2.95;tp.rE=-.3;tp.pitch=-.3;tp.head=-.2;rt.rP=7;if(t<w-.45)b.yaw=turnTo(b.yaw,want,dt*1.9)}
  else{tp.rP=-.72;tp.rE=-.05;tp.pitch=.32;tp.head=.3;rt.rP=46;rt.rE=46;rt.pitch=30;rt.head=20}
  var sp2=slamPoint();if(a.tele&&t<w+.1)a.tele.set(sp2.x,sp2.z,7,t/w);
  if(!a.hit&&t>=w+.08){a.hit=true;if(a.tele){a.tele.dispose();a.tele=null}impactAt(sp2.x,sp2.z,7,380,1)}
  if(t>=w+.15+r)endAttack(1.1)}
 else if(a.type==='sweep'){var w2=.95*sp,sw=1.5*sp,r2=.85;tp.rP=-.72;tp.rE=-.05;tp.pitch=.25;tp.head=.15;rt.rP=10;
  if(t<w2){b.yawOff=lerp(0,1.55,sm(t/w2));a.tele.set(b.x,b.z,19.5,t/w2)}
  else if(t<w2+sw){var p=(t-w2)/sw;b.yawOff=lerp(1.55,1.55-TAU,sm(p));b.checkSweep=true;if(a.tele)a.tele.g.visible=p<.5;if(Math.floor(t*30)%2===0){K.maceHead.getWorldPosition(tv2);dust.spawn(tv2.x,.6,tv2.z,rand(-2,2),rand(1,3),rand(-2,2),0x8a6a48,0x3a2a1e,1.4,4,1.1,-.6,1)}}
  else{b.checkSweep=false;if(a.tele){a.tele.dispose();a.tele=null}b.yawOff=lerp(1.55-TAU,-TAU,sm((t-w2-sw)/r2));if(t>w2+sw+r2){b.yaw+=0;endAttack(1.0)}}
  if(!a.sfxd&&t>=w2){a.sfxd=true;sfx.whoosh();}}
 else if(a.type==='stomp'){var w3=.85*sp;
  if(t<w3){tp.lift=1;tp.pitch=-.12;rt.lift=8;if(a.tele)a.tele.set(b.x,b.z,9,t/w3)}
  else{tp.lift=0;tp.pitch=.22;rt.lift=50;rt.pitch=26;
   if(!a.hit){a.hit=true;if(a.tele){a.tele.dispose();a.tele=null}b.sw={r:5,hit:false};if(b.phase>=3)b.sw2=.55;addShake(.75);sfx.boom(1.3);dustBurst(b.x,b.z,40,18,3);shock(b.x,b.z,4,46,1.35,0xffc070,.8);
    if(Math.hypot(P.x-b.x,P.z-b.z)<8)hurtRama(220,b.x,b.z)}
   if(t>w3+.9*sp)endAttack(1.0)}}
 else if(a.type==='rocks'){var w4=1.0*sp;tp.rP=-3.0;tp.lP=-3.0;tp.pitch=-.35;tp.head=-.35;tp.jaw=.55;rt.rP=7;rt.lP=7;
  if(t>.35&&!a.roar){a.roar=true;sfx.roar()}
  if(a.n<5&&t>=w4+a.n*.34){var tx,tz;if(a.n===0){tx=P.x+P.vx*.6;tz=P.z+P.vz*.6}else{var an=rand(0,TAU),rd=rand(3,13);tx=P.x+Math.cos(an)*rd;tz=P.z+Math.sin(an)*rd}
   var rk=new THREE.Mesh(new THREE.DodecahedronGeometry(2.2,0),M(0x3a2a22,{roughness:.9,emissive:0xff4a10,emissiveIntensity:.8,flatShading:true}));rk.castShadow=true;rk.position.set(tx,80,tz);scene.add(rk);
   hazards.push({x:tx,z:tz,t:0,fall:1.15,m:rk,tele:(function(){var q=new Tele('circle');q.set(tx,tz,4.8,0);return q})()});a.n++}
  if(a.n>=5&&t>w4+5*.34+.45)endAttack(1.0)}
 else if(a.type==='rage'){tp.rP=-2.8;tp.lP=-2.8;tp.pitch=-.4;tp.head=-.4;tp.jaw=.7;rt.rP=6;rt.lP=6;
  if(t>.3&&!a.hit){a.hit=true;sfx.roar();shock(b.x,b.z,4,48,1.6,0xff8a40,.7);dustBurst(b.x,b.z,30,14,3);addShake(.9);var dx=P.x-b.x,dz=P.z-b.z,d=Math.hypot(dx,dz)||1;P.kx+=dx/d*16;P.kz+=dz/d*16}
  if(t>2.0)endAttack(.7)}}

function bossUpdate(dt){var b=boss;
 if(!b.active||b.dead){if(!b.dead){resetTargets();tp.rP=-.3;if(roarK){tp.pitch=-.35;tp.head=-.5;tp.jaw=.8;rt.pitch=7}}applyPose(dt);return}
 var dx=P.x-b.x,dz=P.z-b.z,dist=Math.hypot(dx,dz),want=Math.atan2(dx,dz),moving=0;resetTargets();b.yawOff=0;
 if(b.stun>0){b.stun-=dt;tp.head=-.5;tp.pitch=-.18;rt.pitch=20}
 else if(!b.atk){b.yaw=turnTo(b.yaw,want,dt*(1.2+b.phase*.45));
  if(dist>19){var v=4.8+b.phase*.9;b.x+=Math.sin(b.yaw)*v*dt;b.z+=Math.cos(b.yaw)*v*dt;moving=v}
  b.cool-=dt;if(b.cool<=0){if(dist>34){b.cool=.3}else startAttack(dist)}}
 else attackUpdate(dt,want,dist);
 var rr=Math.hypot(b.x,b.z);if(rr>26){b.x*=26/rr;b.z*=26/rr}
 /* shockwave ring */
 if(b.sw){var s=b.sw;s.r+=34*dt;var dd=Math.hypot(P.x-b.x,P.z-b.z);if(!s.hit&&Math.abs(dd-s.r)<2.3&&hurtRama(220,b.x,b.z))s.hit=true;if(s.r>50)b.sw=null}
 if(b.sw2>0){b.sw2-=dt;if(b.sw2<=0){shock(b.x,b.z,4,46,1.35,0xffc070,.8);b.sw={r:5,hit:false};addShake(.5);sfx.boom(1)}}
 /* hazards */
 for(var i=hazards.length-1;i>=0;i--){var h=hazards[i];h.t+=dt;var p=h.t/h.fall;h.m.position.y=lerp(80,1.8,p*p);h.m.rotation.x+=dt*3;h.m.rotation.z+=dt*2;h.tele.set(h.x,h.z,4.8,p);
  if(p>=1){scene.remove(h.m);h.tele.dispose();impactAt(h.x,h.z,4.8,260,.7);hazards.splice(i,1)}}
 if(moving){b.walkPh+=dt*moving*.62;var st=Math.floor(b.walkPh/PI);if(st!==b.lastStep){b.lastStep=st;sfx.step();addShake(.1);dustBurst(b.x+Math.sin(b.yaw)*2,b.z+Math.cos(b.yaw)*2,6,5,2)}}
 else b.walkPh+=(Math.round(b.walkPh/PI)*PI-b.walkPh)*Math.min(1,dt*5);
 var wk=moving?1:0;b.wk=(b.wk||0)+(wk-(b.wk||0))*Math.min(1,dt*6);
 applyPose(dt)}

function bossApply(dt){var b=boss,sw=Math.sin(b.walkPh),wk=b.wk||0;
 if(b.dead){return}
 K.root.position.set(b.x,Math.abs(sw)*.3*wk,b.z);K.root.rotation.y=b.yaw+(b.yawOff||0);
 K.legs[0].hip.rotation.x=sw*.62*wk;K.legs[1].hip.rotation.x=-sw*.62*wk-cp.lift*1.15;
 K.legs[0].knee.rotation.x=Math.max(0,-sw)*.7*wk;K.legs[1].knee.rotation.x=Math.max(0,sw)*.7*wk+cp.lift*1.35;
 K.arm.R.pivot.rotation.x=cp.rP+Math.sin(T*1.5)*.02;K.arm.R.elbow.rotation.x=cp.rE;K.arm.L.pivot.rotation.x=cp.lP+sw*.35*wk;K.arm.L.pivot.rotation.z=.1;K.arm.L.elbow.rotation.x=cp.lE-.25;
 K.upper.rotation.x=cp.pitch+Math.sin(T*1.8)*.012;K.upper.scale.y=1+Math.sin(T*1.8)*.008;K.head.rotation.x=cp.head;K.jaw.rotation.x=cp.jaw;
 var eyeI=1.6+Math.sin(T*3)*.4;if(K.eyeMats[0])K.eyeMats[0].emissiveIntensity=boss.hp>0?eyeI+(b.phase-1)*.8:0;
 if(b.flash>0){b.flash-=dt;flashK(Math.max(0,b.flash/.16))}else if(kFl>0)flashK(0)}
function bossPost(){var b=boss;K.root.updateMatrixWorld(true);
 if(b.checkSweep&&b.atk&&!b.atk.hit){K.maceHead.getWorldPosition(tv2);if(tv2.y<6.5&&Math.hypot(P.x-tv2.x,P.z-tv2.z)<4.4&&hurtRama(300,tv2.x,tv2.z))b.atk.hit=true}}

/* ---------- Rama + arrows ---------- */
var sphs=[[0,14,0,5.8],[0,10.4,0,5.2],[0,18.7,0,3.1],[0,5.5,0,4.6]];
var arrowGeo=null;
function arrowMesh(div){var g=new THREE.Group(),s=div?3.2:1,sh=new THREE.Mesh(cyl(.05*s,.05*s,3.4,5),M(div?0xffe3a0:0xf3d9a0,{emissive:div?0xff7a10:0x7a4a10,emissiveIntensity:1.2}));g.add(sh);
 var tip=new THREE.Mesh(cone(.16*s,.6*s,6),M(0xfff2c0,{emissive:0xffa030,emissiveIntensity:1.6,metalness:.4}));tip.position.y=1.95;g.add(tip);
 var gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:div?0xff8a30:0xffcf70,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));gl.scale.set(div?7:2.2,div?7:2.2,1);gl.position.y=1.8;g.add(gl);g.userData.s=s;return g}
function fireArrow(div){R.arm.L.hand.getWorldPosition(tv);var o=tv.clone(),r=Math.random(),pk=r<.55?0:r<.8?1:2;var sp=sphs[pk];
 var tx=boss.x+rand(-1.6,1.6),ty=sp[1]+rand(-1,1),tz=boss.z+rand(-1,1);var dir=new V3(tx-o.x,ty-o.y,tz-o.z).normalize();
 var g=arrowMesh(div);g.position.copy(o).addScaledVector(dir,1.6);g.quaternion.setFromUnitVectors(new V3(0,1,0),dir);scene.add(g);
 arrows.push({g:g,v:dir.multiplyScalar(div?95:80),life:1.8,div:div,head:pk===2});sfx.twang();
 fx.spawn(o.x,o.y,o.z,0,0,0,0xffe0a0,0xff8a20,1.4,.2,.18,0,0)}
function arrowsUpdate(dt){for(var i=arrows.length-1;i>=0;i--){var a=arrows[i],g=a.g,s=g.userData.s;g.position.addScaledVector(a.v,dt);a.life-=dt;
  tv.copy(a.v).normalize();tv2.copy(g.position).addScaledVector(tv,1.95*s);
  if(a.div||Math.random()<.7)fx.spawn(g.position.x,g.position.y,g.position.z,rand(-.5,.5),rand(-.5,.5),rand(-.5,.5),a.div?0xffd27a:0xffe6a8,a.div?0xff3a10:0xff8a30,a.div?1.8:.5,.05,a.div?.55:.28,0,.5);
  var hit=false;for(var k=0;k<sphs.length;k++){var q=sphs[k];if(Math.hypot(tv2.x-boss.x-q[0],tv2.y-q[1],tv2.z-boss.z-q[3-3+2])<q[3]){hit=true;break}}
  if(hit&&boss.active&&!boss.dead){var crit=Math.random()<.13||a.head,dm=a.div?170:Math.round((crit?24:14)*rand(.9,1.1));
   if(a.div){shock(tv2.x,tv2.z,2,26,.9,0xffd27a,.9,tv2.y);fireBurst(tv2.x,tv2.y,tv2.z,70,15,3.6);sparks(tv2.x,tv2.y,tv2.z,60,26,0xfff0c0);addShake(.65);sfx.explode();boss.stun=Math.max(boss.stun,.45)}
   else{sparks(tv2.x,tv2.y,tv2.z,crit?20:10,crit?14:9,crit?0xfff0c0:0xffd27a);fireBurst(tv2.x,tv2.y,tv2.z,3,3,1);sfx.hit();addShake(.04)}
   P.div=Math.min(100,P.div+(a.div?0:crit?7:4.2));damageBoss(dm,tv2.x,tv2.y,tv2.z,crit);scene.remove(g);arrows.splice(i,1);continue}
  if(a.life<=0||g.position.y<0||Math.hypot(g.position.x,g.position.z)>200){scene.remove(g);arrows.splice(i,1)}}}

function updatePlayer(dt,active){var bx=boss.x-P.x,bz=boss.z-P.z,bd=Math.hypot(bx,bz)||1,fx_=bx/bd,fz_=bz/bd,rx=-fz_,rz=fx_;
 P.since+=dt;
 if(active){
  var ix=inp.x,iy=inp.y,il=Math.hypot(ix,iy);if(il>1){ix/=il;iy/=il}
  var mx=fx_*iy+rx*ix,mz=fz_*iy+rz*ix,sp=P.charge>0?4:(P.drawT>0?10:13.5);P.mv=Math.min(1,il);
  if(P.roll>0){P.roll-=dt;P.vx=P.rdx*30*Math.max(.25,P.roll/.46);P.vz=P.rdz*30*Math.max(.25,P.roll/.46);if(Math.random()<.5)dust.spawn(P.x,.3,P.z,rand(-1,1),rand(.5,2),rand(-1,1),0x8a6a48,0x3a2a1e,.7,2,.7,-.5,1)}
  else{P.vx=mx*sp;P.vz=mz*sp;P.rollCd-=dt;
   if(inp.roll&&P.rollCd<=0){inp.roll=false;var dl=Math.hypot(mx,mz);if(dl<.1){mx=-fx_;mz=-fz_;dl=1}P.rdx=mx/dl;P.rdz=mz/dl;P.roll=.46;P.rollCd=.75;P.inv=Math.max(P.inv,.05);sfx.whoosh();P.drawT=0}}
  inp.roll=false;
  P.shootCd-=dt;
  if(P.charge>0){P.charge-=dt;P.draw=1;if(Math.random()<.9)fx.spawn(P.x+rand(-1,1),rand(.3,2.4),P.z+rand(-1,1),0,rand(2,5),0,0x9fd0ff,0xffd27a,.6,.1,.6,0,.5);
   if(P.charge<=0){fireArrow(true);P.div=0;sfx.divine();addShake(.25);P.draw=0}}
  else if(inp.div&&P.div>=100&&P.roll<=0&&boss.active){inp.div=false;P.charge=.55;sfx.divine();toast('AGNEYASTRA')}
  else if(P.drawT>0){P.drawT-=dt;P.draw=1-Math.max(0,P.drawT)/.11;if(P.drawT<=0){fireArrow(false);P.draw=1;P.rel=.1}}
  else{if(inp.shoot&&P.shootCd<=0&&P.roll<=0&&boss.active){P.drawT=.11;P.shootCd=.3}else P.draw+=(0-P.draw)*Math.min(1,dt*14)}
  inp.div=false;
 }else{P.vx=P.vz=0;P.mv=0;P.draw+=(0-P.draw)*Math.min(1,dt*10)}
 P.kx*=Math.pow(.0008,dt);P.kz*=Math.pow(.0008,dt);
 P.x+=(P.vx+P.kx)*dt;P.z+=(P.vz+P.kz)*dt;
 var dx=P.x-boss.x,dz=P.z-boss.z,d=Math.hypot(dx,dz);if(d<5.8&&boss.active){P.x=boss.x+dx/d*5.8;P.z=boss.z+dz/d*5.8}
 var rr=Math.hypot(P.x,P.z);if(rr>40){P.x*=40/rr;P.z*=40/rr}
 if(P.inv>0)P.inv-=dt;if(P.hurtT>0)P.hurtT-=dt;
 if(active&&boss.active&&!boss.dead&&P.hp>P.floor)P.hp=Math.max(P.floor,P.hp-24*dt);
 /* face the giant */
 bx=boss.x-P.x;bz=boss.z-P.z;P.yaw=turnTo(P.yaw,Math.atan2(bx,bz),dt*12);
 Rg.position.set(P.x,0,P.z);Rg.rotation.y=P.yaw;
 if(P.roll>0){var lx=P.rdx*Math.cos(P.yaw)-P.rdz*Math.sin(P.yaw),lz=P.rdx*Math.sin(P.yaw)+P.rdz*Math.cos(P.yaw);Rmid.quaternion.setFromAxisAngle(new V3(lz,0,-lx),(1-P.roll/.46)*TAU)}
 else Rmid.quaternion.set(0,0,0,1);
 /* animation */
 var mvs=Math.hypot(P.vx,P.vz);P.walk+=dt*mvs*.8;var sw=Math.sin(P.walk),am=Math.min(1,mvs/12)*(P.roll>0?0:1);
 R.legs[0].hip.rotation.x=sw*.8*am;R.legs[1].hip.rotation.x=-sw*.8*am;R.legs[0].knee.rotation.x=Math.max(0,-sw)*.9*am;R.legs[1].knee.rotation.x=Math.max(0,sw)*.9*am;
 var cr=P.roll>0?1:0;
 R.arm.L.pivot.rotation.x=cr?-2.6:-1.45;R.arm.L.pivot.rotation.z=.12;R.arm.L.elbow.rotation.x=cr?-1.2:-.05;
 R.arm.R.pivot.rotation.x=cr?-2.6:-1.4;R.arm.R.pivot.rotation.z=-.1;R.arm.R.elbow.rotation.x=cr?-1.2:-.3-P.draw*2.3;
 R.upper.rotation.y=-.35+P.draw*.1;R.upper.rotation.x=.05+(P.hurtT>0?-.25:0)+Math.sin(T*1.7)*.01;R.head.rotation.y=.35;
 R.setString(P.draw*4.6);
 if(R.halo)R.halo.rotation.z+=dt*.8;
 ramaGlow.position.set(P.x,1.3,P.z);ramaGlow.material.opacity=.4+.15*Math.sin(T*3)+(P.charge>0?.5:0)+(P.div>=100?.12:0);var gs=P.charge>0?16:9;ramaGlow.scale.set(gs,gs,1);
 mandala.position.x=P.x;mandala.position.z=P.z;mandala.rotation.z+=dt*.5;mandala.material.opacity=.55+.2*Math.sin(T*2)+(P.div>=100?.25:0);
 ramaL.position.set(P.x,3.5,P.z);ramaL.intensity=(1.1+(P.charge>0?2.5:0)+Math.sin(T*5)*.15)*LK;
 if(Math.random()<.35)fx.spawn(P.x+rand(-.8,.8),rand(.2,2),P.z+rand(-.8,.8),0,rand(.6,1.4),0,0xffe6a0,0x6a9cff,.12,.02,1.1,0,.3)}

/* ---------- ambient ---------- */
function ambient(dt){fireL.intensity=(1.1+Math.sin(T*9)*.25+Math.sin(T*23)*.15)*LK;
 for(var i=0;i<brazierPos.length;i++){var b=brazierPos[i];if(Math.random()<.9)fx.spawn(b.x+rand(-.6,.6),b.y,b.z+rand(-.6,.6),rand(-.4,.4),rand(2.5,4.5),rand(-.4,.4),0xffd27a,0xc02808,rand(1.4,2.2),.3,rand(.7,1.2),-1,.2);
  if(Math.random()<.12)dust.spawn(b.x,b.y+1,b.z,rand(-.5,.5),rand(2,3),rand(-.5,.5),0x4a2a20,0x1a1010,1.5,6,3.5,-.4,.3)}
 if(Math.random()<.6)fx.spawn(rand(-90,90),rand(0,3),rand(-90,90),rand(-1,1),rand(2,5),rand(-1,1),0xffb060,0xff2a10,rand(.12,.3),.02,rand(3,6),-.3,.05);
 for(i=0;i<3;i++)if(Math.random()<.9)fx.spawn(rand(-290,290),rand(30,100),rand(-440,-360),rand(-1,1),rand(3,6),0,0xffb050,0xff4010,rand(14,26),3,rand(1.5,2.5),-1,.3);
 for(i=0;i<groundFires.length;i++){var gp=groundFires[i];if(Math.random()<.85)fx.spawn(gp.x+rand(-1,1),.5,gp.z+rand(-1,1),rand(-.4,.4),rand(3,6),rand(-.4,.4),0xffd27a,0xc02808,rand(2,3.4),.4,rand(.8,1.4),-1,.2);if(Math.random()<.18)dust.spawn(gp.x,2,gp.z,rand(-.6,.6),rand(3,5),rand(-.6,.6),0x2a1812,0x120a08,3,12,rand(3,5),-.3,.2)}
 if(Math.random()<.7){var lf2=lankaFires[Math.floor(Math.random()*lankaFires.length)];dust.spawn(lf2.x,lf2.y,lf2.z,rand(-1,1),rand(5,9),rand(-1,1),0x2a1410,0x120808,24,70,rand(6,9),-.2,.1)}
 for(i=0;i<clouds.length;i++){clouds[i].position.x+=clouds[i].userData.sp*dt*4;if(clouds[i].position.x>850)clouds[i].position.x=-850}}

/* ---------- camera / cinematics ---------- */
var camMode='menu',camT=0,cineKeys=null,cineDur=0,cineSkip=false,camPos=new V3(),camLook=new V3(),orbit=0;
function C3(x,y,z){return new V3(x,y,z)}
function bez(a,b,t){return a.clone().lerp(b,sm(t))}
function plate(hi,en,sm,dur){var n=$('np');n.querySelector('.hi').textContent=hi;n.querySelector('.en').textContent=en;n.querySelector('.sm').textContent=sm||'';n.classList.add('on');clearTimeout(plate.t);plate.t=setTimeout(function(){n.classList.remove('on')},(dur||3.5)*1000)}
var intro=[
 {d:5.5,from:C3(0,230,150),to:C3(0,120,50),lf:C3(0,0,-20),lt:C3(0,10,-60),fn:function(){card('कुम्भकर्ण का अंतिम युद्ध','THE FINAL BATTLE OF KUMBHAKARNA','',4.2)}},
 {d:7.0,from:C3(-32,10,48),to:C3(-4.5,19.2,13),lf:C3(0,13,0),lt:C3(0,18.6,0),fn:function(){roarK=0;plate('कुम्भकर्ण','KUMBHAKARNA','Brother of Ravana',5.5);setTimeout(function(){if(state!=='cine')return;roarK=1;sfx.roar();addShake(.9);shock(0,0,4,60,1.6,0xff8a40,.6);dustBurst(0,0,40,16,3)},2600)}},
 {d:4.4,from:C3(2.6,3.0,21.2),to:C3(.7,3.25,24.0),lf:C3(0,3.0,26),lt:C3(0,3.15,26),fn:function(){roarK=0;plate('राम','RAMA','Prince of Ayodhya',4)}},
 {d:3.4,from:C3(-5,.9,17),to:C3(-2.5,1.3,19.5),lf:C3(0,3.8,26),lt:C3(0,5,34),fn:function(){}},
 {d:4.4,from:C3(-70,16,30),to:C3(-54,19,36),lf:C3(-18,12,68),lt:C3(-18,12,68),fn:function(){plate('हनुमान','HANUMAN','Son of the Wind',4)}},
 {d:4.6,from:C3(0,70,64),to:C3(0,17,54),lf:C3(0,2,0),lt:C3(0,12,0),fn:function(){}}
];
var roarK=0;
function startCine(){camMode='cine';camT=0;cineKeys=intro;cineDur=intro.reduce(function(a,k){return a+k.d},0);root.classList.add('cine');cineIdx=-1;P.x=0;P.z=26;boss.x=0;boss.z=0;boss.yaw=0}
var cineIdx=-1;
function cineUpdate(dt){camT+=dt;var t=camT,i=0,acc=0;while(i<cineKeys.length-1&&t>=acc+cineKeys[i].d){acc+=cineKeys[i].d;i++}var k=cineKeys[i],p=clamp((t-acc)/k.d,0,1);
 if(i!==cineIdx){cineIdx=i;k.fn()}
 camPos.copy(bez(k.from,k.to,p));camLook.copy(bez(k.lf,k.lt,p));
 if(i===0){camPos.x+=Math.sin(p*2)*8}
 if(t>=cineDur||cineSkip)endCine()}
function endCine(){cineSkip=false;camMode='play';root.classList.remove('cine');root.classList.add('play');
 $('cap').classList.remove('on');$('subs').classList.remove('on');
 card('युद्ध आरम्भ','THE BATTLE BEGINS','Stand firm, Rama.',3.2);
 setTimeout(function(){sfx.drum(1.5);sfx.drum(1.5)},250);boss.active=true;boss.cool=2.0;roarK=0;state='play';orbit=P.yaw;say('RAMA','Brother of Ravana, I do not hate you. But Dharma must stand.',3.6)}

/* ---------- death cinematic ---------- */
var deathT=0,deathStage=0;
function startDeath(){boss.dead=true;boss.hp=0;state='dying';deathT=0;deathStage=0;if(boss.atk&&boss.atk.tele)boss.atk.tele.dispose();boss.atk=null;boss.checkSweep=false;
 hazards.forEach(function(h){scene.remove(h.m);h.tele.dispose()});hazards.length=0;root.classList.add('cine');root.classList.remove('play');
 ts=.22;sfx.die();addShake(1.2);P.inv=99;$('subs').classList.remove('on');
 boss.fall={dir:K.root.rotation.y,x:boss.x,z:boss.z}}
function deathUpdate(dt,rdt){deathT+=rdt;var t=deathT;
 if(t>1.2&&ts<1)ts=Math.min(1,ts+rdt*.6);
 var f=boss.fall,p=sm((t-.3)/3.6);
 /* the giant sinks to his knees then topples backwards */
 K.root.rotation.y=f.dir;var kneel=sm(clamp(t/1.8,0,1)),topple=sm(clamp((t-1.6)/2.2,0,1));
 K.legs[0].hip.rotation.x=-1.2*kneel;K.legs[1].hip.rotation.x=-1.0*kneel;K.legs[0].knee.rotation.x=2.1*kneel;K.legs[1].knee.rotation.x=1.9*kneel;
 K.upper.rotation.x=-topple*1.2+.2*kneel;K.head.rotation.x=-.8*topple;K.jaw.rotation.x=.6*(1-topple);
 K.arm.R.pivot.rotation.x=lerp(-.3,.5,topple);K.arm.R.elbow.rotation.x=-.3;K.arm.L.pivot.rotation.x=lerp(-.2,.9,topple);K.arm.L.pivot.rotation.z=lerp(.1,.7,topple);
 K.root.position.set(f.x,lerp(0,-1.8,kneel)-topple*2.6,f.z);
 K.root.rotation.x=-topple*1.25;
 if(K.eyeMats[0])K.eyeMats[0].emissiveIntensity=Math.max(0,1.4*(1-t/2.2));
 if(t>2.4&&deathStage<1){deathStage=1;shock(f.x,f.z,4,70,2.2,0xffc070,.9);dustBurst(f.x,f.z,90,24,5);addShake(1.5);sfx.boom(1.6);
  for(var i=0;i<24;i++)fx.spawn(f.x+rand(-6,6),rand(2,14),f.z+rand(-6,6),rand(-2,2),rand(3,9),rand(-2,2),0xfff0c0,0xffb040,rand(1,2.5),.2,rand(3,6),-1,.2)}
 if(t>2.4)for(i=0;i<2;i++)fx.spawn(f.x+rand(-5,5),rand(4,16),f.z+rand(-5,5),rand(-.6,.6),rand(2,5),rand(-.6,.6),0xffe0a0,0xffa040,rand(.6,1.4),.1,rand(3,6),-.2,.1);
 /* camera: slow push-in, then rise to the sky */
 if(t<3.4){camPos.set(f.x+22*Math.cos(t*.35),7+t*.8,f.z+22*Math.sin(t*.35));camLook.set(f.x,9-t,f.z)}
 else{var q=sm((t-3.4)/6);camPos.set(f.x+22,lerp(10,95,q),f.z+lerp(22,60,q));camLook.set(f.x,lerp(4,0,q),f.z)}
 /* Rama kneels in silence */
 Rmid.rotation.set(0,0,0);P.vx=P.vz=0;
 if(t>3&&deathStage<2){deathStage=2;say('RAMA','Rest, brave warrior. You are freed.',4);$('hud').style.opacity=0}
 if(t>7.5&&deathStage<3){deathStage=3;$('fade').classList.add('on')}
 if(t>9.4&&deathStage<4){deathStage=4;state='over';var e=$('end');e.classList.remove('off');void e.offsetWidth;e.classList.add('show');$('fade').classList.remove('on');root.classList.remove('cine');camMode='over'}
 var ox=f.x+Math.cos(t*.2)*0;ramaGlow.material.opacity=.5}

/* ---------- play camera ---------- */
var camShakeV=new V3();
function playCam(dt){var dx=boss.x-P.x,dz=boss.z-P.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d;
 var back=17+Math.min(6,d*.12),h=10.5+Math.min(4,d*.06);
 var side=-uz*4.2,sideZ=ux*4.2;
 var tx=P.x-ux*back+side,tz=P.z-uz*back+sideZ,ty=h;
 camPos.x+=(tx-camPos.x)*Math.min(1,dt*4.5);camPos.y+=(ty-camPos.y)*Math.min(1,dt*4);camPos.z+=(tz-camPos.z)*Math.min(1,dt*4.5);
 var lx=lerp(P.x,boss.x,.5),lz=lerp(P.z,boss.z,.5),ly=lerp(8,13,clamp(d/30,0,1));
 camLook.x+=(lx-camLook.x)*Math.min(1,dt*6);camLook.y+=(ly-camLook.y)*Math.min(1,dt*6);camLook.z+=(lz-camLook.z)*Math.min(1,dt*6);
 var hh=Math.hypot(camPos.x,camPos.z);if(hh>47){camPos.x*=47/hh;camPos.z*=47/hh}}

/* ---------- HUD ---------- */
var radar=$('radar'),rc=radar.getContext('2d');
function drawRadar(){var w=224,c=rc;c.clearRect(0,0,w,w);c.save();c.translate(112,112);
 c.fillStyle='rgba(15,6,3,.62)';c.beginPath();c.arc(0,0,108,0,TAU);c.fill();c.strokeStyle='rgba(242,193,78,.8)';c.lineWidth=3;c.stroke();
 c.strokeStyle='rgba(242,193,78,.22)';c.lineWidth=1;c.beginPath();c.arc(0,0,72,0,TAU);c.stroke();c.beginPath();c.arc(0,0,36,0,TAU);c.stroke();
 var s=100/42;c.rotate(-(PI-P.yaw)*0);
 var bx=boss.x*s,bz=boss.z*s,px=P.x*s,pz=P.z*s;
 c.fillStyle='rgba(179,32,26,.85)';c.beginPath();c.arc(bx,bz,13,0,TAU);c.fill();c.strokeStyle='#ffb070';c.lineWidth=2;c.stroke();
 c.fillStyle='#6aa8ff';c.beginPath();c.arc(px,pz,6,0,TAU);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();
 var a=Math.atan2(boss.x-P.x,boss.z-P.z);c.strokeStyle='rgba(106,168,255,.8)';c.lineWidth=2;c.beginPath();c.moveTo(px,pz);c.lineTo(px+Math.sin(a)*18,pz+Math.cos(a)*18);c.stroke();
 if(boss.atk&&boss.atk.tele&&boss.atk.type!=='sweep'){c.strokeStyle='rgba(255,90,30,.9)';c.beginPath();c.arc(bx,bz,20+4*Math.sin(T*14),0,TAU);c.stroke()}
 c.restore()}
function updateHUD(dt){var bp=boss.hp/boss.max*100;$('bFill').style.width=bp+'%';$('bLag').style.width=bp+'%';var rp=(P.hp-0)/P.max*100;$('rFill').style.width=rp+'%';$('rLag').style.width=rp+'%';
 $('dFill').style.width=P.div+'%';var dt_=$('divTxt');if(P.div>=100){dt_.textContent='AGNEYASTRA READY  ·  PRESS Q';dt_.classList.add('rdy')}else{dt_.textContent='AGNEYASTRA '+Math.floor(P.div)+'%';dt_.classList.remove('rdy')}
 drawRadar()}

/* ---------- input ---------- */
var keys={};
on(window,'keydown',function(e){if(e.repeat&&(e.code==='Space'))return;keys[e.code]=true;
 if(e.code==='Space'){inp.roll=true;e.preventDefault()}if(e.code==='KeyQ')inp.div=true;if(e.code==='KeyJ'||e.code==='KeyF')inp.shoot=true;
 if((e.code==='Enter'||e.code==='Escape')&&state==='cine')cineSkip=true});
on(window,'keyup',function(e){keys[e.code]=false;if(e.code==='KeyJ'||e.code==='KeyF')inp.shoot=false});
renderer.domElement.addEventListener('mousedown',function(e){if(e.button===0){inp.shoot=true;mouseShoot=true}});
on(window,'mouseup',function(){if(mouseShoot){inp.shoot=false;mouseShoot=false}});
var mouseShoot=false;
on(window,'blur',function(){keys={};inp.shoot=false});
renderer.domElement.addEventListener('contextmenu',function(e){e.preventDefault()});
function readKeys(){var x=0,y=0;if(keys.KeyA||keys.ArrowLeft)x-=1;if(keys.KeyD||keys.ArrowRight)x+=1;if(keys.KeyW||keys.ArrowUp)y+=1;if(keys.KeyS||keys.ArrowDown)y-=1;
 if(joy.on){x=joy.x;y=joy.y}inp.x=x;inp.y=y}
/* touch */
var joy={on:false,x:0,y:0,id:null},isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
if(isTouch)root.classList.add('coarse');
var jEl=$('joy');
jEl.addEventListener('pointerdown',function(e){joy.id=e.pointerId;joy.on=true;jEl.setPointerCapture(e.pointerId);jm(e)});
jEl.addEventListener('pointermove',function(e){if(e.pointerId===joy.id)jm(e)});
function jr(e){if(e.pointerId===joy.id){joy.on=false;joy.x=joy.y=0;jEl.firstElementChild.style.transform='none'}}
jEl.addEventListener('pointerup',jr);jEl.addEventListener('pointercancel',jr);
function jm(e){var r=jEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=(e.clientX-cx)/(r.width/2),dy=(e.clientY-cy)/(r.height/2),l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}joy.x=dx;joy.y=-dy;jEl.firstElementChild.style.transform='translate('+dx*37+'px,'+dy*37+'px)'}
var bS=$('bShoot'),bR=$('bRoll'),bD=$('bDiv');
bS.addEventListener('pointerdown',function(e){e.preventDefault();inp.shoot=true});bS.addEventListener('pointerup',function(){inp.shoot=false});bS.addEventListener('pointercancel',function(){inp.shoot=false});
bR.addEventListener('pointerdown',function(e){e.preventDefault();inp.roll=true});bD.addEventListener('pointerdown',function(e){e.preventDefault();inp.div=true});
on(document,'visibilitychange',function(){if(document.hidden){keys={};inp.shoot=false}});

/* ---------- game flow ---------- */
var state='menu';
function resetGame(){
 K.root.rotation.order='YXZ';
 boss.hp=boss.max;boss.phase=1;boss.dead=false;boss.active=false;boss.atk=null;boss.cool=2;boss.stun=0;boss.x=0;boss.z=0;boss.yaw=0;boss.sw=null;boss.sw2=0;boss.flash=0;boss.fall=null;boss.checkSweep=false;
 P.hp=P.max;P.fl=0;P.x=0;P.z=26;P.yaw=PI;P.inv=0;P.roll=0;P.div=0;P.charge=0;P.drawT=0;P.draw=0;P.kx=P.kz=0;P.since=9;ts=1;deathT=0;
 hazards.forEach(function(h){scene.remove(h.m);h.tele.dispose()});hazards.length=0;arrows.forEach(function(a){scene.remove(a.g)});arrows.length=0;
 K.root.rotation.set(0,0,0);K.root.position.set(0,0,0);K.upper.rotation.set(0,0,0);for(var k in cp){cp[k]=tp[k]=0}cp.rP=tp.rP=-.3;cp.rE=tp.rE=-1.9;flashK(0);
 K.legs[0].hip.rotation.set(0,0,0);K.legs[1].hip.rotation.set(0,0,0);K.legs[0].knee.rotation.set(0,0,0);K.legs[1].knee.rotation.set(0,0,0);
 K.arm.L.pivot.rotation.set(0,0,.1);Rmid.rotation.set(0,0,0);$('hud').style.opacity='';$('fade').classList.remove('on');$('end').classList.remove('show');
 effects.length=0;roarK=0}
function begin(){initAudio();if(AC&&AC.state==='suspended')AC.resume();$('menu').classList.add('off');state='cine';resetGame();startCine()}
$('begin').addEventListener('click',begin);
$('again').addEventListener('click',function(){initAudio();$('end').classList.add('off');$('end').classList.remove('show');state='cine';resetGame();startCine()});
$('skip').addEventListener('click',function(){cineSkip=true});

/* ---------- main loop ---------- */
var clock=new THREE.Clock(),menuT=0;
resetGame();
camPos.set(0,60,150);camLook.set(0,14,0);
function frame(){if(!alive)return;rafId=requestAnimationFrame(frame);var rdt=Math.min(.05,clock.getDelta()),dt=rdt*ts;T+=dt;
 readKeys();
 if(state==='menu'||state==='over'){menuT+=rdt;var a=menuT*.08;camPos.set(Math.sin(a)*95,28,Math.cos(a)*95+10);camLook.set(0,16,0);
  bossPost();resetTargets();tp.rP=-.4;applyPose(dt);bossApply(dt);updatePlayer(dt,false);Rg.position.set(0,0,26)}
 else if(state==='cine'){cineUpdate(rdt);bossUpdate(dt);bossApply(dt);updatePlayer(dt,false);Rg.position.set(P.x,0,P.z)}
 else if(state==='play'){updatePlayer(dt,true);bossUpdate(dt);bossApply(dt);bossPost();arrowsUpdate(dt);playCam(dt);updateHUD(dt)}
 else if(state==='dying'){deathUpdate(dt,rdt);updatePlayer(dt,false);arrowsUpdate(dt)}
 var b=Math.max(P.hp>0?1:0,1);
 /* shared updates */
 lankaArmy.raise=state==='play'||state==='cine'?.6:.2;vanaraArmy.raise=state==='play'?1:.4;
 lankaArmy.update(T,1);vanaraArmy.update(T,1);
 hnGlow.material.opacity=.3+.1*Math.sin(T*2);
 ambient(dt);fx.update(dt);dust.update(dt);fx.mat.uniforms.uScale.value=dust.mat.uniforms.uScale.value=renderer.domElement.height*.85;
 for(var i=effects.length-1;i>=0;i--)if(!effects[i](dt))effects.splice(i,1);
 for(i=0;i<banners.length;i++){var bn=banners[i],pa=bn.m.geometry.attributes.position,bs=bn.base;for(var v=0;v<pa.count;v++){var x=bs[v*3];pa.array[v*3+2]=Math.sin(T*3+bn.ph+x*1.1)*.25*(x/5+.5)}pa.needsUpdate=true}
 /* camera shake */
 shake*=Math.pow(.02,dt);var sk=shake*shake*1.4;
 camera.position.set(camPos.x+rand(-sk,sk),camPos.y+rand(-sk,sk),camPos.z+rand(-sk,sk));camera.lookAt(camLook);
 camera.fov=lerp(camera.fov,state==='play'?(P.charge>0?44:58):50,.1);camera.updateProjectionMatrix();
 sky.position.copy(camera.position);
 renderer.render(scene,camera)}
frame();


  var ex = $('exitBtn'); if (ex) ex.addEventListener('click', function () { if (opts.onExit) opts.onExit(); });
  var dn = $('doneBtn'); if (dn) dn.addEventListener('click', function () { if (opts.onComplete) opts.onComplete(); });

  return function cleanup() {
    alive = false;
    cancelAnimationFrame(rafId);
    timers.forEach(function (id) { window.clearTimeout(id); });
    listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
    try { if (roarEl) { roarEl.pause(); roarEl.src = ''; } } catch (e) {}
    try { if (AC) AC.close(); } catch (e) {}
    try {
      scene.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    } catch (e) {}
  };
}
