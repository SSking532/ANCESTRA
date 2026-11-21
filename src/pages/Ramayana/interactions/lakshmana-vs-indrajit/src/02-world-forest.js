/* ---------- the world: ground, ridges, Lanka, armies, wreckage ---------- */
const nz=(x,z)=>Math.sin(x*.21)*.5+Math.sin(z*.17+1.3)*.4+Math.sin((x+z)*.09)*.8+Math.sin(x*.5+z*.43)*.18;
const groundH=(x,z)=>{const a=sstep(16,46,Math.abs(x))*2.2+sstep(2,55,-z)*3.4;return a*nz(x,z)*.8+nz(x*2,z*2)*.04};
const PYRES=[];const FIRE_TOP=[];
function dirtTex(){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d'),r=seeded(5);g.fillStyle='#4a3d24';g.fillRect(0,0,512,512);for(let i=0;i<90;i++){const x=r()*512,y=r()*512,rr=20+r()*60,gg=g.createRadialGradient(x,y,0,x,y,rr);gg.addColorStop(0,'rgba(58,84,28,'+(.25+r()*.3)+')');gg.addColorStop(1,'rgba(58,84,28,0)');g.fillStyle=gg;g.fillRect(x-rr,y-rr,rr*2,rr*2)}
 for(let i=0;i<6000;i++){const x=r()*512,y=r()*512,s=r()*3+.5;g.fillStyle='rgba('+(r()<.5?'20,18,8':'150,130,60')+','+(.05+r()*.2)+')';g.beginPath();g.arc(x,y,s,0,7);g.fill()}
 for(let i=0;i<140;i++){g.strokeStyle='rgba(15,8,5,'+(.1+r()*.28)+')';g.lineWidth=.5+r()*1.3;g.beginPath();let x=r()*512,y=r()*512;g.moveTo(x,y);for(let j=0;j<6;j++){x+=r()*30-15;y+=r()*30-15;g.lineTo(x,y)}g.stroke()}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(30,18);t.anisotropy=4;return t}
function buildGround(){const geo=new THREE.PlaneGeometry(320,190,160,95);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)-30;p.setY(i,groundH(x,z))}geo.computeVertexNormals();
 const t=dirtTex(),m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:1.2,color:0xd2c09a,roughness:1,metalness:0}));m.position.z=-30;m.receiveShadow=true;scene.add(m);return m}
function ridge(z,w,hMax,col,sd){const N=180,pos=[],idx=[],r=seeded(sd);for(let i=0;i<=N;i++){const x=lerp(-w/2,w/2,i/N),n=.5*Math.sin(x*.018+sd)+.3*Math.sin(x*.047+sd*2)+.2*Math.sin(x*.11+sd*3.3),h=hMax*(.55+.45*n)*(.8+.2*r());pos.push(x,-4,0,x,h,0);if(i<N){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide}));m.position.set(0,0,z);scene.add(m);return m}

function foliageTex(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=seeded(8);g.fillStyle='#6b7a3a';g.fillRect(0,0,256,256);for(let i=0;i<2600;i++){const x=r()*256,y=r()*256,k=r();g.fillStyle=k<.35?'rgba(20,30,10,'+(.25+r()*.4)+')':k<.8?'rgba(110,130,50,'+(.2+r()*.3)+')':'rgba(220,190,90,'+(.15+r()*.25)+')';g.beginPath();g.ellipse(x,y,2+r()*5,1+r()*3,r()*3,0,7);g.fill()}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);return t}
function barkTex(){const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d'),r=seeded(3);g.fillStyle='#3d3226';g.fillRect(0,0,64,256);for(let i=0;i<160;i++){g.strokeStyle='rgba('+(r()<.5?'20,12,6':'130,100,70')+','+(.15+r()*.3)+')';g.lineWidth=1+r()*2;const x=r()*64;g.beginPath();g.moveTo(x,0);g.lineTo(x+r()*8-4,256);g.stroke()}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function lumpy(geo,amp,seed){const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+amp*(Math.sin(x*4.1+seed)*Math.sin(y*3.7+seed*2)+Math.sin(z*5.3+seed*3)*.6);p.setXYZ(i,x*k,y*k,z*k)}geo.computeVertexNormals();return geo}
function buildForest(){
 const r=seeded(31),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),S=new THREE.Vector3(),P=new THREE.Vector3(),C=new THREE.Color();
 const spots=[];
 for(let gx=-84;gx<=84;gx+=6.2)for(let gz=-92;gz<=2;gz+=6.2){let x=gx+(r()-.5)*5,z=gz+(r()-.5)*5;if(r()<.1)continue;if(Math.abs(x)<15&&z>-11&&z<9)continue;if(x>12&&x<32&&z<-46&&r()<.85)continue;if(z>-16&&Math.abs(x)<42)continue;spots.push([x,z,r()])}
 const nT=spots.length,trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.62,1,1,9,1),new THREE.MeshStandardMaterial({map:barkTex(),roughness:1,color:0x9a8f7e}),nT);
 const blobs=[];const banyan=spots.map(s=>s[2]<.16);
 spots.forEach((sp,i)=>{const x=sp[0],z=sp[1],y=groundH(x,z),ban=banyan[i],h=ban?8+r()*3:11+r()*9,rad=ban?.95+r()*.5:.4+r()*.35;
  E.set((r()-.5)*.06,r()*6,(r()-.5)*.06);Q.setFromEuler(E);M4.compose(P.set(x,y+h/2-.4,z),Q,S.set(rad,h,rad));trunk.setMatrixAt(i,M4);C.setHex(0xffffff).multiplyScalar(.55+r()*.5);trunk.setColorAt(i,C);
  const n=ban?7:4+(r()*3|0);for(let k=0;k<n;k++){const a=r()*6.283,d=(ban?2.5+r()*5:r()*2.4),by=ban?h*.8+r()*2.4:h*(.62+r()*.4),sz=ban?3.2+r()*2.4:2.2+r()*2.2;blobs.push([x+Math.cos(a)*d,y+by,z+Math.sin(a)*d,sz,r()])}
  if(ban){for(let k=0;k<5;k++){const a=r()*6.283,d=1.6+r()*3.5;blobs.push([x+Math.cos(a)*d,y+1.2+r()*2,z+Math.sin(a)*d,.001,0])}}});
 trunk.receiveShadow=false;scene.add(trunk);
 const lv=blobs.filter(b=>b[3]>.01),can=new THREE.InstancedMesh(lumpy(new THREE.IcosahedronGeometry(1,2),.22,2),new THREE.MeshStandardMaterial({map:foliageTex(),roughness:.95,color:0xffffff,emissive:0x0c1204,emissiveIntensity:.7}),lv.length);
 lv.forEach((b,i)=>{E.set(r()*3,r()*6,r()*3);Q.setFromEuler(E);M4.compose(P.set(b[0],b[1],b[2]),Q,S.set(b[3],b[3]*.72,b[3]));can.setMatrixAt(i,M4);C.setRGB(.5+b[4]*.5,.62+b[4]*.38,.38+b[4]*.3).multiplyScalar(.55+b[4]*.55);can.setColorAt(i,C)});scene.add(can);
 /* bushes and ferns */
 const bu=[];for(let i=0;i<520;i++){let x=(r()-.5)*150,z=-70+r()*76;if(Math.abs(x)<17&&z>-10&&z<11)continue;bu.push([x,z,.45+r()*.9,r()])}
 const bm=new THREE.InstancedMesh(lumpy(new THREE.IcosahedronGeometry(1,1),.25,5),new THREE.MeshStandardMaterial({map:foliageTex(),roughness:1,color:0xbfd08a}),bu.length);
 bu.forEach((b,i)=>{M4.compose(P.set(b[0],groundH(b[0],b[1])+b[2]*.25,b[1]),Q.identity(),S.set(b[2]*1.4,b[2]*.7,b[2]*1.4));bm.setMatrixAt(i,M4);C.setRGB(.4+b[3]*.5,.55+b[3]*.4,.25+b[3]*.2);bm.setColorAt(i,C)});scene.add(bm);
 const gr=[];for(let i=0;i<2600;i++){const x=(r()-.5)*70,z=-30+r()*40;if(Math.abs(x)<15&&z>-8&&z<10)continue;gr.push([x,z,.35+r()*.6,r()])}
 const gm=new THREE.InstancedMesh(new THREE.ConeGeometry(.07,1,4),new THREE.MeshStandardMaterial({color:0x9aa060,roughness:1}),gr.length);
 gr.forEach((b,i)=>{E.set((r()-.5)*.5,r()*6,(r()-.5)*.5);Q.setFromEuler(E);M4.compose(P.set(b[0],groundH(b[0],b[1])+b[2]*.4,b[1]),Q,S.set(1,b[2],1));gm.setMatrixAt(i,M4);C.setRGB(.35+b[3]*.5,.4+b[3]*.35,.12+b[3]*.1);gm.setColorAt(i,C)});scene.add(gm);
 /* fallen logs */
 const lg=new THREE.InstancedMesh(new THREE.CylinderGeometry(.35,.4,5,8),new THREE.MeshStandardMaterial({map:barkTex(),roughness:1}),12);
 for(let i=0;i<12;i++){let x,z;do{x=(r()-.5)*60;z=-26+r()*30}while(Math.abs(x)<14&&Math.abs(z)<8);E.set(0,r()*6,Math.PI/2);Q.setFromEuler(E);M4.compose(P.set(x,groundH(x,z)+.3,z),Q,S.set(1,.8+r()*.8,1));lg.setMatrixAt(i,M4)}scene.add(lg);
 /* light shafts through the canopy, aligned to the sun */
 const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d'),gg=g.createLinearGradient(0,0,0,256);gg.addColorStop(0,'rgba(255,214,140,0)');gg.addColorStop(.2,'rgba(255,214,140,.9)');gg.addColorStop(1,'rgba(255,190,110,0)');g.fillStyle=gg;g.fillRect(0,0,64,256);const hg=g.createLinearGradient(0,0,64,0);hg.addColorStop(0,'rgba(0,0,0,1)');hg.addColorStop(.5,'rgba(0,0,0,0)');hg.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=hg;g.fillRect(0,0,64,256);
 const st=new THREE.CanvasTexture(c),sd=V3(-18,-14,30).normalize();
 for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(2+r()*3,18),new THREE.MeshBasicMaterial({map:st,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide,opacity:.2,color:new THREE.Color(1.3,1,.6)}));
  m.position.set(-34+i*8+r()*4,11,-26-r()*30);m.quaternion.setFromUnitVectors(V3(0,-1,0),sd);m.rotateY(.5);m.userData={o:.12+r()*.1,p:r()*6};m.material.opacity=m.userData.o;m.renderOrder=2;scene.add(m);SHAFTS.push(m)}
}
function buildDebris(){const r=seeded(23),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),S=new THREE.Vector3(1,1,1),P=new THREE.Vector3(),mat=new THREE.MeshStandardMaterial({color:0x2a1a12,roughness:.9});
 const parts=[[new THREE.TorusGeometry(.55,.07,6,14),30,1],[new THREE.CylinderGeometry(.5,.5,.05,10),22,2],[new THREE.CylinderGeometry(.03,.03,2.2,5),50,3],[new THREE.BoxGeometry(1.2,.35,.35),12,4]];
 for(const p of parts){const m=new THREE.InstancedMesh(p[0],mat,p[1]);for(let i=0;i<p[1];i++){let x,z;do{x=(r()-.5)*70;z=(r()-.5)*40-6}while(Math.abs(z)<5.5&&Math.abs(x)<15);const h=groundH(x,z);E.set(p[2]===3?(r()-.5)*.6:r()*3,r()*6,p[2]===3?(r()-.5)*.6:r()*.5);Q.setFromEuler(E);M4.compose(P.set(x,h+(p[2]===3?1:.3),z),Q,S);m.setMatrixAt(i,M4)}m.castShadow=true;m.receiveShadow=true;scene.add(m)}
}
function buildWorld(){buildGround();ridge(-130,520,60,0x4f3426,2);ridge(-105,480,42,0x33301c,5);ridge(-86,420,26,0x1f2412,8);buildForest();buildDebris()}
let AMB=0;const SHAFTS=[];
function worldUpdate(dt,t,mood){
 for(const p of PYRES){if(Math.random()<.9)SPARK.emit(p[0]+rnd(-.4,.4),p[1]+.4,p[2]+rnd(-.4,.4),rnd(-.3,.3),rnd(1.2,2.8),rnd(-.3,.3),rnd(.7,1.4),rnd(.5,1),1,.55,.2,-.4,.4,.5);if(Math.random()<.5)SMOKE.emit(p[0],p[1]+1.2,p[2],rnd(-.2,.2)-.5,rnd(1.2,2.4),rnd(-.2,.2),rnd(3,5),rnd(1.4,2.4),.1,.06,.05,-.05,2.5,.45)}
 for(const f of FIRE_TOP){if(Math.random()<.7)SPARK.emit(f[0]+rnd(-.5,.5),f[1],f[2],rnd(-.3,.3),rnd(1,2.4),0,rnd(.8,1.6),rnd(.8,1.8),1,.5,.18,-.3,.6,.4);if(Math.random()<.4)SMOKE.emit(f[0],f[1]+1,f[2],-.7,rnd(1.5,3),0,rnd(4,7),rnd(3,5),.1,.06,.05,-.05,2.2,.5)}
 AMB+=dt*46;while(AMB>1){AMB--;SPARK.emit(rnd(-30,30),rnd(.2,6),rnd(-18,10),rnd(-.8,-.2),rnd(.1,.5),rnd(-.2,.2),rnd(4,8),rnd(.05,.11),1,.8,.4,0,0,.55);if(Math.random()<.18)SPARK.emit(rnd(-26,26),rnd(10,15),rnd(-30,6),rnd(-1.2,-.3),-rnd(.6,1.4),rnd(-.3,.3),rnd(5,8),rnd(.08,.15),.55,.7,.2,0,0,.7)}
 if(Math.random()<dt*2.2)SMOKE.emit(rnd(-40,40),.3,rnd(-40,-8),rnd(.2,.7),.05,0,rnd(6,10),rnd(4,7),.55,.38,.28,0,1.2,.1);
 for(const sh of SHAFTS)sh.material.opacity=sh.userData.o*(.75+.25*Math.sin(t*.4+sh.userData.p))}
