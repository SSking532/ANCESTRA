const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rnd=(a,b)=>a+Math.random()*(b-a),ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,sstep=(a,b,x)=>{x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)};
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function seeded(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ---------- audio ---------- */
let AC=null,sndOn=true;
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}return AC}
function tone(f,d,type,v,f2){const a=ac();if(!a||!sndOn)return;try{const o=a.createOscillator(),g=a.createGain(),n=a.currentTime;o.type=type||'sine';o.frequency.setValueAtTime(f,n);if(f2)o.frequency.exponentialRampToValueAtTime(f2,n+d);g.gain.setValueAtTime(v||.08,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+d)}catch(e){}}
function noise(d,v,fc){const a=ac();if(!a||!sndOn)return;try{const n=a.currentTime,b=a.createBuffer(1,Math.max(1,a.sampleRate*d|0),a.sampleRate),k=b.getChannelData(0);for(let i=0;i<k.length;i++)k[i]=(Math.random()*2-1)*(1-i/k.length);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=fc||900;g.gain.value=v||.1;s.connect(f);f.connect(g);g.connect(a.destination);s.start(n)}catch(e){}}
const SFX={shot:()=>{tone(260,.14,'triangle',.05,110);noise(.1,.04,3000)},snap:()=>{noise(.12,.07,3500);tone(500,.08,'square',.03,900)},hit:()=>{noise(.3,.16,500);tone(95,.3,'sine',.14,38)},drum:()=>{tone(78,.55,'sine',.2,42);noise(.15,.05,300)},gong:()=>{tone(190,1.6,'sine',.07,180);tone(285,1.2,'sine',.03,280)},whoosh:()=>noise(.35,.07,1800),clash:()=>{noise(.4,.12,2200);tone(660,.4,'triangle',.05,300)},bell:()=>{tone(880,1.1,'sine',.04,870);tone(1320,.8,'sine',.02,1310)},thunder:()=>{noise(1.2,.2,380);tone(60,1.2,'sawtooth',.06,30)},summon:()=>{tone(220,.9,'sine',.06,660);noise(.5,.05,2600)}};
/* ---------- renderer, post-processing ---------- */
const GL=$('#gl'),R=new THREE.WebGLRenderer({canvas:GL,antialias:false,powerPreference:'high-performance'});
R.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.setClearColor(0x080303);
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x8a4a2c,.0085);
const cam=new THREE.PerspectiveCamera(38,1,.1,700);
const GRADE={uniforms:{tDiffuse:{value:null},uT:{value:0},uFlash:{value:new THREE.Vector4(1,.9,.7,0)},uDark:{value:0},uDesat:{value:0},uAb:{value:.0012},uVig:{value:.75}},
vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
fragmentShader:'uniform sampler2D tDiffuse;uniform float uT,uDark,uDesat,uAb,uVig;uniform vec4 uFlash;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}void main(){vec2 c=vUv-.5;float d=length(c);vec2 o=c*uAb*d*6.;vec3 col=vec3(texture2D(tDiffuse,vUv+o).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-o).b);col=aces(col*1.12);float l=dot(col,vec3(.299,.587,.114));col=mix(col,vec3(l),uDesat);col=mix(col,col*vec3(.5,.42,.7)*.55,uDark);col*=1.-uVig*smoothstep(.22,.92,d*1.3);col+=(h(vUv*vec2(1731.,973.)+uT)-.5)*.03;col=mix(col,uFlash.rgb,uFlash.a);gl_FragColor=vec4(col,1.);}'};
let composer,bloom,gradePass;
function buildComposer(){const rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:4});composer=new THREE.EffectComposer(R,rt);composer.addPass(new THREE.RenderPass(scene,cam));bloom=new THREE.UnrealBloomPass(new THREE.Vector2(256,256),.62,.75,.86);composer.addPass(bloom);gradePass=new THREE.ShaderPass(GRADE);composer.addPass(gradePass)}
/* ---------- camera rig ---------- */
const CAM={pos:V3(-12,8,24),look:V3(0,2,0),fov:38,tp:V3(-12,8,24),tl:V3(0,2,0),tf:38,k:2,shake:0,roll:0,sway:1,asp:1.7};
function camTo(p,l,f,k,snap){CAM.tp.set(p[0],p[1],p[2]);CAM.tl.set(l[0],l[1],l[2]);CAM.tf=f||38;CAM.k=k||1.8;if(snap){CAM.pos.copy(CAM.tp);CAM.look.copy(CAM.tl);CAM.fov=CAM.tf}}
function fit(){return Math.min(2.1,Math.max(1,1.78/CAM.asp))}
function camUpdate(dt,t){const a=1-Math.exp(-CAM.k*dt);CAM.pos.lerp(CAM.tp,a);CAM.look.lerp(CAM.tl,a);CAM.fov+=(CAM.tf-CAM.fov)*a;
 const s=CAM.sway*(RM?0:1),sh=RM?0:CAM.shake;cam.position.set(CAM.pos.x+Math.sin(t*.37)*.18*s+(Math.random()-.5)*sh,CAM.pos.y+Math.sin(t*.51)*.1*s+(Math.random()-.5)*sh,CAM.pos.z+Math.cos(t*.29)*.15*s);
 cam.lookAt(CAM.look.x+(Math.random()-.5)*sh*.4,CAM.look.y,CAM.look.z);cam.rotation.z+=CAM.roll;cam.fov=CAM.fov;cam.updateProjectionMatrix();CAM.shake*=Math.pow(.02,dt)}
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);if(composer){composer.setPixelRatio(R.getPixelRatio());composer.setSize(w,h);bloom.resolution.set(w,h)}cam.aspect=w/h;CAM.asp=w/h;cam.updateProjectionMatrix();const hc=$('#hc'),d=Math.min(devicePixelRatio||1,2);hc.width=w*d;hc.height=h*d;if(window.PARTS)for(const p of PARTS)p.mat.uniforms.uScale.value=1}
/* ---------- sky dome ---------- */
const SKY_FS='uniform float uT,uMood,uDark;varying vec3 vD;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}void main(){vec3 d=normalize(vD);float y=d.y;vec3 top=vec3(.05,.025,.06),mid=vec3(.34,.13,.11),hor=vec3(1.1,.6,.24);vec3 col=mix(hor,mid,smoothstep(0.,.22,y));col=mix(col,top,smoothstep(.18,.75,y));if(y<0.)col=mix(hor*.55,vec3(.12,.06,.05),smoothstep(0.,-.3,y));vec3 sd=normalize(vec3(.28,.075,-1.));float s=max(dot(d,sd),0.);col+=vec3(1.,.7,.36)*pow(s,5.)*.9+vec3(1.,.55,.22)*pow(s,38.)*.9+vec3(1.,.93,.7)*pow(s,900.)*14.;vec2 uv=d.xz/(abs(d.y)+.22)*1.5+vec2(uT*.012,0.);float c=fbm(uv*1.7);c=smoothstep(.42,.92,c)*smoothstep(-.02,.28,y);vec3 cc=mix(vec3(.1,.04,.05),vec3(1.1,.55,.24),pow(s,2.5)*.9);col=mix(col,cc,c*.8);float c2=fbm(uv*3.2+7.);col=mix(col,vec3(.05,.02,.03),smoothstep(.55,.9,c2)*.35*smoothstep(0.,.3,y));col*=mix(1.,.5,uMood);col=mix(col,col*vec3(1.15,.65,.65),uMood*.55);col*=1.-uDark*.8;gl_FragColor=vec4(col,1.);}';
function skyMat(){return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uT:{value:0},uMood:{value:0},uDark:{value:0}},vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:SKY_FS})}
const SKY=new THREE.Mesh(new THREE.SphereGeometry(450,32,16),skyMat());SKY.renderOrder=-10;scene.add(SKY);
function buildEnv(){const s=new THREE.Scene(),m=new THREE.Mesh(new THREE.SphereGeometry(50,32,16),skyMat());s.add(m);const pm=new THREE.PMREMGenerator(R);scene.environment=pm.fromScene(s,.02).texture;pm.dispose()}
/* ---------- lights ---------- */
const SUN=new THREE.DirectionalLight(0xffa860,2.6);SUN.position.set(18,14,-30);SUN.castShadow=true;SUN.shadow.mapSize.set(2048,2048);{const c=SUN.shadow.camera;c.left=-20;c.right=20;c.top=14;c.bottom=-10;c.near=1;c.far=90}SUN.shadow.bias=-.0004;SUN.shadow.normalBias=.03;SUN.target.position.set(0,0,0);scene.add(SUN,SUN.target);
const HEMI=new THREE.HemisphereLight(0xffb078,0x2a1410,.75);scene.add(HEMI);
const FILL=new THREE.DirectionalLight(0x8fa4d8,.55);FILL.position.set(-8,6,16);scene.add(FILL);
const FXL=new THREE.PointLight(0xffa050,0,26,1.6);scene.add(FXL);
const FXL2=new THREE.PointLight(0xffd080,0,22,1.6);scene.add(FXL2);
/* ---------- particles ---------- */
const PARTS=[];
class Parts{
 constructor(n,add){this.n=n;this.i=0;const a=k=>new Float32Array(n*k);this.pos=a(3);this.vel=a(3);this.col=a(3);this.sz=a(1);this.s0=a(1);this.al=a(1);this.a0=a(1);this.life=a(1).fill(9);this.max=a(1).fill(1);this.g=a(1);this.gr=a(1);
  const geo=this.geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.pos,3));geo.setAttribute('aColor',new THREE.BufferAttribute(this.col,3));geo.setAttribute('aSize',new THREE.BufferAttribute(this.sz,1));geo.setAttribute('aAlpha',new THREE.BufferAttribute(this.al,1));
  this.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,uniforms:{uScale:{value:600}},
   vertexShader:'attribute float aSize;attribute float aAlpha;attribute vec3 aColor;uniform float uScale;varying vec3 vC;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=aSize*uScale/max(.2,-mv.z);vC=aColor;vA=aAlpha;}',
   fragmentShader:'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5)*2.;float a=smoothstep(1.,0.,d);a*=a;gl_FragColor=vec4(vC,a*vA);}'});
  this.pts=new THREE.Points(geo,this.mat);this.pts.frustumCulled=false;this.pts.renderOrder=add?5:3;scene.add(this.pts);PARTS.push(this)}
 emit(x,y,z,vx,vy,vz,life,size,r,g,b,grav,grow,al){const i=this.i;this.i=(i+1)%this.n;const k=i*3;this.pos[k]=x;this.pos[k+1]=y;this.pos[k+2]=z;this.vel[k]=vx;this.vel[k+1]=vy;this.vel[k+2]=vz;this.col[k]=r;this.col[k+1]=g;this.col[k+2]=b;this.life[i]=0;this.max[i]=life;this.s0[i]=size;this.g[i]=grav||0;this.gr[i]=grow||0;this.a0[i]=al==null?1:al}
 update(dt){for(let i=0;i<this.n;i++){if(this.life[i]>=this.max[i]){this.al[i]=0;continue}const l=this.life[i]+=dt,t=l/this.max[i],k=i*3;this.vel[k+1]-=this.g[i]*dt;this.pos[k]+=this.vel[k]*dt;this.pos[k+1]+=this.vel[k+1]*dt;this.pos[k+2]+=this.vel[k+2]*dt;this.sz[i]=this.s0[i]*(1+this.gr[i]*t);this.al[i]=this.a0[i]*Math.min(1,t*9)*(1-t)}
  const g=this.geo;g.attributes.position.needsUpdate=g.attributes.aColor.needsUpdate=g.attributes.aSize.needsUpdate=g.attributes.aAlpha.needsUpdate=true;this.mat.uniforms.uScale.value=R.domElement.height/(2*Math.tan(cam.fov*Math.PI/360))}}
let SPARK,SMOKE;
/* burst helper: n sparks in a sphere / cone */
function burst(p,n,o){o=o||{};const c=o.c||[1,.8,.4],v0=o.v0||2,v1=o.v1||9;for(let i=0;i<n;i++){let dx=rnd(-1,1),dy=rnd(-1,1),dz=rnd(-1,1);if(o.dir){dx=o.dir.x+rnd(-1,1)*(o.spread||.5);dy=o.dir.y+rnd(-1,1)*(o.spread||.5);dz=o.dir.z+rnd(-1,1)*(o.spread||.5)}const l=Math.hypot(dx,dy,dz)||1,v=rnd(v0,v1);SPARK.emit(p.x,p.y,p.z,dx/l*v,dy/l*v,dz/l*v,rnd(.35,o.life||1),rnd(.06,o.size||.2),c[0],c[1],c[2],o.g==null?5:o.g,o.grow||0,o.a||1)}}
function puff(p,n,o){o=o||{};const c=o.c||[.16,.09,.07];for(let i=0;i<n;i++)SMOKE.emit(p.x+rnd(-.3,.3),p.y+rnd(0,.2),p.z+rnd(-.3,.3),rnd(-1,1)*(o.v||1),rnd(.2,1.2)*(o.up||1),rnd(-1,1)*(o.v||1),rnd(1,o.life||2.4),rnd(.5,o.size||1.1),c[0],c[1],c[2],-.1,2.2,o.a||.5)}
