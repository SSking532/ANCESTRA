/* ---------- characters ---------- */
const UPV=V3(0,1,0),T1=V3(),T2=V3(),T3=V3();
const mat=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.7,metalness:0},o||{}));
const goldM=()=>mat(0xe6b650,{metalness:1,roughness:.26,emissive:0x7a4408,emissiveIntensity:.45});
function place(m,a,b){m.position.addVectors(a,b).multiplyScalar(.5);T3.subVectors(b,a);const l=T3.length()||.001;m.scale.y=l;m.quaternion.setFromUnitVectors(UPV,T3.divideScalar(l))}
function ik(a,b,l1,l2,pole,out){T1.subVectors(b,a);let d=T1.length();const mx=(l1+l2)*.998;if(d>mx){d=mx;T1.setLength(mx);b.copy(a).add(T1)}d=Math.max(d,.06);const dir=T1.clone().normalize(),x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(l1*l1-x*x,0)),p=pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));if(p.lengthSq()<1e-6)p.set(0,0,1);p.normalize();return out.copy(a).addScaledVector(dir,x).addScaledVector(p,h)}
const mesh=(g,m,cast)=>{const o=new THREE.Mesh(g,m);o.castShadow=cast!==false;return o};
function limbMesh(rt,rb,m){return mesh(new THREE.CylinderGeometry(rt,rb,1,10),m)}
function makeBow(kind){
 const g=new THREE.Group(),wood=kind==='indra'?mat(0x1a0f0c,{roughness:.4,metalness:.4}):mat(0x6a3f18,{roughness:.5}),gold=goldM();
 const crv=new THREE.QuadraticBezierCurve3(V3(-.14,.8,0),V3(.5,0,0),V3(-.14,-.8,0));
 g.add(mesh(new THREE.TubeGeometry(crv,28,kind==='indra'?.032:.027,6),wood));
 for(const s of[1,-1]){const t=mesh(new THREE.SphereGeometry(.04,8,6),gold);t.position.set(-.14,.8*s,0);g.add(t);const c=mesh(new THREE.CylinderGeometry(.034,.034,.16,8),gold);c.position.set(-.1,.7*s,0);c.rotation.z=.25*s;g.add(c)}
 const gr=mesh(new THREE.CylinderGeometry(.04,.04,.2,8),gold);g.add(gr);
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9),3));const str=new THREE.Line(sg,new THREE.LineBasicMaterial({color:0xf4e8cc}));str.frustumCulled=false;g.add(str);
 const ar=new THREE.Group(),shaft=mesh(new THREE.CylinderGeometry(.012,.012,1.15,6),mat(0xe9dcc0,{roughness:.5}),false);shaft.rotation.z=Math.PI/2;shaft.position.x=.575;ar.add(shaft);
 const tip=mesh(new THREE.ConeGeometry(.032,.14,6),goldM(),false);tip.rotation.z=-Math.PI/2;tip.position.x=1.22;ar.add(tip);
 for(let k=0;k<3;k++){const f=mesh(new THREE.PlaneGeometry(.2,.07),mat(0x9b3a24,{side:THREE.DoubleSide}),false);f.position.x=.12;f.rotation.x=k*2.09;ar.add(f)}
 g.add(ar);g.userData={str,sg,ar};return g}
function Human(kind){
 const K={laksh:{skin:0xb98258,cloth:0xeadfc3,cloth2:0xc3862b,hair:0x140b08,sc:1},indra:{skin:0x6b4634,cloth:0x2a1317,cloth2:0x7a1d17,hair:0x100808,sc:1.08},vib:{skin:0x80664f,cloth:0xcfc7ae,cloth2:0x6f7f84,hair:0xd3cec2,sc:.97}}[kind];
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);body.scale.setScalar(K.sc);
 const skin=mat(K.skin,{roughness:.62}),cloth=mat(K.cloth,{roughness:.85,side:THREE.DoubleSide}),cloth2=mat(K.cloth2,{roughness:.8,side:THREE.DoubleSide}),gold=goldM(),steel=mat(0x1b1517,{metalness:.8,roughness:.38});
 const ch={kind,root,body,P:{mode:'idle',side:1,aim:V3(1,0,0),draw:0,crouch:0,nock:true,headYaw:0,headPitch:0,bowOn:true,lowered:false,ph:Math.random()*6},sc:K.sc,hands:{}};
 const arm=kind==='indra'?skin:skin,legs=[],arms=[],joints=[];
 const mk=(rt,rb,m)=>{const l=limbMesh(rt,rb,m);body.add(l);return l};
 for(const s of[1,-1]){legs.push({s,th:mk(.064,.085,kind==='vib'?cloth:cloth),sh:mk(.045,.062,kind==='indra'?steel:skin),k:V3(),ft:V3()});arms.push({s,up:mk(.05,.066,skin),fo:mk(.04,.052,skin),e:V3(),h:V3()})}
 for(let i=0;i<8;i++){const j=mesh(new THREE.SphereGeometry(i<4?.06:.07,8,6),i<4?skin:(kind==='indra'?steel:skin));body.add(j);joints.push(j)}
 if(kind!=='vib')for(const l of legs){const f=mesh(new THREE.BoxGeometry(.11,.07,.24),kind==='indra'?steel:skin);l.foot=f;body.add(f)}
 /* torso */
 const tor=mesh(new THREE.CylinderGeometry(.24,.17,.62,16),kind==='indra'?steel:kind==='vib'?cloth:skin);tor.scale.z=.64;tor.position.y=1.24;body.add(tor);
 const neck=mesh(new THREE.CylinderGeometry(.05,.06,.14,8),skin);neck.position.y=1.6;body.add(neck);
 if(kind==='laksh'){const th=mesh(new THREE.TorusGeometry(.26,.012,6,16,2.2),gold);th.position.set(0,1.3,.04);th.rotation.z=.95;th.rotation.x=.1;body.add(th);const nk=mesh(new THREE.TorusGeometry(.12,.018,6,16),gold);nk.rotation.x=Math.PI/2;nk.position.y=1.56;body.add(nk);const sa=mesh(new THREE.CylinderGeometry(.19,.205,.12,16),cloth2);sa.position.y=.95;body.add(sa);const tail=mesh(new THREE.PlaneGeometry(.12,.5),cloth2);tail.position.set(.14,.7,.17);body.add(tail);ch.tail=tail}
 if(kind==='indra'){for(let i=0;i<3;i++){const r=mesh(new THREE.TorusGeometry(.215-i*.012,.014,6,18),gold);r.rotation.x=Math.PI/2;r.scale.y=.64;r.position.y=1.4-i*.13;body.add(r)}const bt=mesh(new THREE.CylinderGeometry(.19,.2,.09,16),gold);bt.position.y=.97;body.add(bt);for(const s of[1,-1]){const p=mesh(new THREE.SphereGeometry(.12,10,8),steel);p.position.set(s*.25,1.5,0);body.add(p);const pr=mesh(new THREE.TorusGeometry(.12,.012,6,14),gold);pr.position.copy(p.position);pr.rotation.y=Math.PI/2;body.add(pr)}
  const cape=new THREE.PlaneGeometry(.78,1.35,8,10),cm=mesh(cape,mat(0x7a1c16,{roughness:.8,side:THREE.DoubleSide}));cm.position.set(0,1.55,-.2);cm.geometry.translate(0,-.67,0);body.add(cm);ch.cape=cm;ch.capeO=cape.attributes.position.array.slice()}
 if(kind==='vib'){const rb=mesh(new THREE.CylinderGeometry(.24,.42,1.0,18,1,true),cloth);rb.position.y=.52;body.add(rb);const sh=mesh(new THREE.CylinderGeometry(.25,.3,.5,16,1,true),cloth2);sh.position.y=1.12;sh.scale.z=.7;body.add(sh)}
 else{const sk=mesh(new THREE.CylinderGeometry(.18,kind==='indra'?.36:.33,.66,18,1,true),kind==='indra'?mat(0x2a1317,{side:THREE.DoubleSide,roughness:.7}):cloth);sk.position.y=.64;body.add(sk);if(kind==='indra'){const hm=mesh(new THREE.CylinderGeometry(.35,.36,.04,18,1,true),gold);hm.position.y=.33;body.add(hm)}}
 if(kind!=='vib'){const q=mesh(new THREE.CylinderGeometry(.065,.055,.66,8),mat(kind==='indra'?0x241210:0x5a3a1e,{roughness:.8}));q.position.set(-.13,1.28,-.2);q.rotation.z=.3;body.add(q);for(let i=0;i<5;i++){const a=mesh(new THREE.CylinderGeometry(.008,.008,.28,4),mat(0xe9dcc0),false);a.position.set(-.13+(i-2)*.02-.1,1.66+(i%2)*.03,-.2);a.rotation.z=.3;body.add(a)}}
 /* head */
 const hd=new THREE.Group();hd.position.y=1.74;body.add(hd);ch.head=hd;
 const hs=mesh(new THREE.SphereGeometry(.118,16,12),skin);hs.scale.set(.92,1.08,1);hd.add(hs);
 const nose=mesh(new THREE.ConeGeometry(.026,.07,6),skin);nose.rotation.x=Math.PI/2;nose.position.set(0,-.01,.12);hd.add(nose);
 for(const s of[1,-1]){const e=mesh(new THREE.BoxGeometry(.03,.012,.01),mat(0x0c0605),false);e.position.set(s*.048,.02,.112);hd.add(e);const br=mesh(new THREE.BoxGeometry(.05,.01,.012),mat(K.hair),false);br.position.set(s*.05,.045,.108);hd.add(br);const er=mesh(new THREE.TorusGeometry(.018,.006,5,10),gold);er.position.set(s*.115,-.045,0);hd.add(er)}
 const hair=mesh(new THREE.SphereGeometry(.125,14,10,0,Math.PI*2,0,Math.PI*.62),mat(K.hair,{roughness:.9}));hair.position.set(0,.01,-.018);hair.rotation.x=-.25;hd.add(hair);
 if(kind==='vib'){const bd=mesh(new THREE.ConeGeometry(.08,.22,8),mat(K.hair,{roughness:.95}));bd.position.set(0,-.17,.06);bd.rotation.x=Math.PI;hd.add(bd)}
 if(kind==='indra'){const mu=mesh(new THREE.BoxGeometry(.09,.014,.012),mat(0x100808),false);mu.position.set(0,-.05,.115);hd.add(mu)}
 const pts=kind==='indra'?[[.001,0],[.118,0],[.122,.05],[.1,.12],[.085,.2],[.06,.29],[.035,.38],[.012,.46],[.001,.5]]:kind==='laksh'?[[.001,0],[.118,0],[.122,.04],[.1,.1],[.08,.17],[.055,.23],[.03,.28],[.001,.31]]:[[.001,0],[.12,0],[.123,.03],[.12,.045],[.001,.05]];
 const cr=mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),14),kind==='indra'?mat(0xd9a73e,{metalness:1,roughness:.25,emissive:0x6a3c0a,emissiveIntensity:.5}):gold);cr.position.set(0,.085,0);hd.add(cr);
 const gem=mesh(new THREE.SphereGeometry(.022,8,6),mat(0xb22a1a,{emissive:0xb22a1a,emissiveIntensity:.8}),false);gem.position.set(0,.13,.11);hd.add(gem);
 if(kind==='indra'){for(const s of[-1,1]){const sp=mesh(new THREE.ConeGeometry(.02,.14,6),gold);sp.position.set(s*.1,.22,0);sp.rotation.z=-s*.35;hd.add(sp)}}
 /* props */
 if(kind!=='vib'){ch.bow=makeBow(kind);root.add(ch.bow)}
 if(kind==='vib'){const m=new THREE.Group();m.add(mesh(new THREE.CylinderGeometry(.025,.025,1.5,6),mat(0x4a3a30)));const hdm=mesh(new THREE.SphereGeometry(.13,10,8),mat(0x7a6a5c,{metalness:.7,roughness:.4}));hdm.position.y=.82;m.add(hdm);for(let i=0;i<8;i++){const sp=mesh(new THREE.ConeGeometry(.025,.07,5),mat(0x7a6a5c,{metalness:.7}));const a=i/8*6.283;sp.position.set(Math.cos(a)*.13,.82,Math.sin(a)*.13);sp.rotation.z=-Math.cos(a)*1.4;sp.rotation.x=Math.sin(a)*1.4;m.add(sp)}root.add(m);ch.mace=m}
 ch.legs=legs;ch.arms=arms;ch.joints=joints;
 ch.update=function(dt,t){
  const P=this.P,sc=this.sc,cr=P.crouch*.3,hipY=.93-cr,shY=1.5-P.crouch*.12,bs=P.side,ps=P.ph;
  const br=Math.sin(t*1.9+ps)*.006;body.position.y=br;
  /* legs */
  let ji=0;for(const l of legs){const s=l.s,hp=V3(s*.105,hipY,0),ft=V3(s*(.2+(P.mode==='bow'?.08:0)),0,P.mode==='bow'?(s===bs?.06:-.06):0);ik(hp,ft,.46,.46,V3(0,0,1),l.k);place(l.th,hp,l.k);place(l.sh,l.k,ft);if(l.foot){l.foot.position.set(ft.x,.035,ft.z+.06)}joints[ji++].position.copy(l.k);joints[ji++].position.copy(hp)}
  tor.position.y=1.24-cr*.9;
  /* arms */
  const dir=P.aim,sh=s=>V3(s*.235,shY,0);
  const tgt={};
  if(P.mode==='bow'||P.mode==='lowered'){const sB=sh(bs),sS=sh(-bs);let hB,hS;
   if(P.mode==='bow'){hB=sB.clone().addScaledVector(dir,.6);hS=hB.clone().addScaledVector(dir,-(.2+.46*P.draw));hS.y+=.1*P.draw;hS.z+=.04}else{hB=V3(bs*.3,.86,.1);hS=V3(-bs*.26,.92,.06)}
   tgt[bs]=[hB,P.mode==='bow'?V3(0,-1,.35):V3(0,0,-1)];tgt[-bs]=[hS,P.mode==='bow'?dir.clone().multiplyScalar(-1).add(V3(0,.25,-.35)):V3(0,0,-1)]}
  else if(P.mode==='fold'){for(const s of[1,-1])tgt[s]=[V3(s*.05,1.18,.27),V3(s,-.2,-.3)]}
  else if(P.mode==='warn'){tgt[1]=[V3(.5,1.95,.35),V3(0,0,-1)];tgt[-1]=[V3(-.3,.85,.1),V3(0,0,-1)]}
  else if(P.mode==='down'){for(const s of[1,-1])tgt[s]=[V3(s*.3,.74+Math.sin(t*2+s)*.01,.02),V3(0,0,-1)]}
  else{for(const s of[1,-1])tgt[s]=[V3(s*.27,.92,.08),V3(0,0,-1)]}
  let ai=4;for(const a of arms){const s=a.s,sho=sh(s),tg=tgt[s];ik(sho,tg[0],.3,.29,tg[1],a.e);place(a.up,sho,a.e);place(a.fo,a.e,tg[0]);a.h.copy(tg[0]);joints[ai++].position.copy(a.e);joints[ai+1].position.copy(sho)}
  this.hands={bow:arms.find(a=>a.s===bs).h,str:arms.find(a=>a.s===-bs).h};
  hd.rotation.y=P.headYaw;hd.rotation.x=P.headPitch;hd.position.y=1.74-P.crouch*.12;
  /* bow */
  const B=this.bow;if(B){B.visible=P.bowOn;if(P.bowOn){const h=this.hands.bow;B.position.copy(h).multiplyScalar(sc).add(body.position);B.scale.setScalar(sc);
    if(P.mode==='lowered'){B.rotation.set(0,-Math.PI/2,0)}else B.rotation.set(0,0,Math.atan2(dir.y,dir.x));
    const U=B.userData,dr=P.mode==='bow'?P.draw:0,nx=-.04-(.18+.46*dr)*1+0,nockX=P.mode==='bow'?-(.24+.5*dr):-.18;
    const pa=U.sg.attributes.position.array;pa[0]=-.14;pa[1]=.8;pa[2]=0;pa[3]=nockX;pa[4]=0;pa[5]=0;pa[6]=-.14;pa[7]=-.8;pa[8]=0;U.sg.attributes.position.needsUpdate=true;U.ar.visible=P.nock&&P.mode==='bow';U.ar.position.set(nockX,0,0);
    if(P.mode==='bow'&&dr>0){const hs=this.hands.str;/* string hand follows nock */}}}
  if(this.cape){const p=this.cape.geometry.attributes.position,o=this.capeO;for(let i=0;i<p.count;i++){const y=-o[i*3+1],w=y/1.35;p.array[i*3+2]=o[i*3+2]-w*(.12+.1*Math.sin(t*2.3+y*3+o[i*3]*2));p.array[i*3]=o[i*3]*(1+w*.35)}p.needsUpdate=true;this.cape.geometry.computeVertexNormals()}
  if(this.tail)this.tail.rotation.z=Math.sin(t*2+ps)*.08;
  if(this.mace){const hh=arms.find(a=>a.s===-1).h;this.mace.position.set(hh.x,hh.y-.1,hh.z).multiplyScalar(sc);this.mace.position.y=Math.max(.75,this.mace.position.y)}}
 return ch}
/* ---------- chariot and horses ---------- */
function makeHorse(col,ph){
 const g=new THREE.Group(),m=mat(col,{roughness:.55,metalness:.1}),gold=goldM(),h={g,ph};
 const body=mesh(new THREE.CapsuleGeometry(.36,.9,6,14),m);body.rotation.z=Math.PI/2;body.position.y=1.05;g.add(body);h.body=body;
 const ch1=mesh(new THREE.SphereGeometry(.4,12,10),m);ch1.position.set(.58,1.07,0);g.add(ch1);const hp=mesh(new THREE.SphereGeometry(.42,12,10),m);hp.position.set(-.58,1.08,0);g.add(hp);
 const neck=new THREE.Group();neck.position.set(.7,1.2,0);neck.rotation.z=-.7;g.add(neck);h.neck=neck;
 const nm=mesh(new THREE.CapsuleGeometry(.17,.55,5,10),m);nm.position.y=.36;neck.add(nm);
 for(let i=0;i<7;i++){const mn=mesh(new THREE.BoxGeometry(.04,.14,.05),mat(0x0a0605));mn.position.set(-.16,.1+i*.1,0);mn.rotation.z=.4;neck.add(mn)}
 const hg=new THREE.Group();hg.position.y=.72;hg.rotation.z=-1.7;neck.add(hg);h.head=hg;
 const hm=mesh(new THREE.CapsuleGeometry(.12,.38,5,10),m);hm.position.y=.2;hg.add(hm);const mz=mesh(new THREE.BoxGeometry(.15,.14,.13),m);mz.position.y=.46;hg.add(mz);
 for(const s of[1,-1]){const e=mesh(new THREE.ConeGeometry(.04,.14,5),m);e.position.set(-.04,-.02,s*.08);hg.add(e);const br=mesh(new THREE.TorusGeometry(.13,.01,5,12),gold);br.position.y=.25;br.rotation.x=Math.PI/2;hg.add(br)}
 const hr=mesh(new THREE.TorusGeometry(.2,.016,6,16),gold);hr.position.y=.12;hr.rotation.y=Math.PI/2;neck.add(hr);
 const cl=mesh(new THREE.TorusGeometry(.4,.018,6,18),gold);cl.position.set(.5,1.07,0);cl.rotation.y=Math.PI/2;g.add(cl);
 const legs=[[.52,.17],[.52,-.17],[-.6,.17],[-.6,-.17]];for(const L of legs){const front=L[0]>0,a=V3(L[0],.85,L[1]),k=V3(L[0]+(front?.04:-.14),.42,L[1]),f=V3(L[0]+(front?0:-.04),.03,L[1]);const u=limbMesh(.05,.09,m),l=limbMesh(.035,.05,m);place(u,a,k);place(l,k,f);g.add(u,l);const ho=mesh(new THREE.CylinderGeometry(.05,.055,.07,8),mat(0x120a07));ho.position.copy(f);g.add(ho)}
 const tail=new THREE.Group();tail.position.set(-.95,1.2,0);g.add(tail);h.tail=tail;let pr=tail;for(let i=0;i<4;i++){const s=new THREE.Group();s.position.y=i?-.2:0;pr.add(s);const seg=mesh(new THREE.CylinderGeometry(.07-i*.012,.06-i*.012,.22,6),mat(0x0a0605));seg.position.y=-.1;s.add(seg);pr=s}h.tailSegs=tail;
 g.rotation.y=Math.PI;return h}
function makeChariot(){
 const g=new THREE.Group(),wood=mat(0x2a1810,{roughness:.5,metalness:.25}),gold=goldM(),dark=mat(0x140a07,{roughness:.6}),ch={g,wheels:[]};
 const deck=mesh(new THREE.BoxGeometry(2.3,.14,1.6),wood);deck.position.set(.1,.72,0);g.add(deck);deck.receiveShadow=true;
 const fp=mesh(new THREE.CylinderGeometry(.85,.85,.62,24,1,true,-Math.PI,Math.PI),mat(0x2a1810,{roughness:.5,metalness:.25,side:THREE.DoubleSide}));fp.scale.z=.95;fp.position.set(.35,1.1,0);g.add(fp);
 for(const y of[.79,1.41]){const tr=mesh(new THREE.CylinderGeometry(.86,.86,.06,24,1,true,-Math.PI,Math.PI),mat(0xe6b650,{metalness:1,roughness:.3,emissive:0x6a3c0a,emissiveIntensity:.4,side:THREE.DoubleSide}));tr.scale.z=.95;tr.position.set(.35,y,0);g.add(tr)}
 for(const s of[1,-1]){const rl=mesh(new THREE.BoxGeometry(1.4,.5,.06),wood);rl.position.set(.9,1.0,s*.8);g.add(rl);const rg=mesh(new THREE.BoxGeometry(1.4,.04,.07),gold);rg.position.set(.9,1.26,s*.8);g.add(rg)}
 const em=mesh(new THREE.CircleGeometry(.2,20),gold);em.position.set(-.5,1.1,0);em.rotation.y=-Math.PI/2;g.add(em);
 const ax=mesh(new THREE.CylinderGeometry(.06,.06,2.5,8),dark);ax.rotation.x=Math.PI/2;ax.position.set(.1,.62,0);g.add(ax);
 for(const s of[1,-1]){const w=new THREE.Group();w.position.set(.1,.62,s*1.1);const rim=mesh(new THREE.TorusGeometry(.62,.07,8,28),wood);w.add(rim);const rm2=mesh(new THREE.TorusGeometry(.62,.03,6,28),gold);rm2.position.z=s*.05;w.add(rm2);for(let i=0;i<12;i++){const sp=mesh(new THREE.BoxGeometry(.05,.6,.05),wood);sp.position.set(Math.sin(i/12*3.1416)*0,0,0);sp.geometry.translate(0,.3,0);sp.rotation.z=i/12*6.283;w.add(sp)}const hub=mesh(new THREE.CylinderGeometry(.11,.11,.16,10),gold);hub.rotation.x=Math.PI/2;w.add(hub);g.add(w);ch.wheels.push(w)}
 const pole=mesh(new THREE.CylinderGeometry(.05,.06,3.6,8),dark);pole.rotation.z=Math.PI/2;pole.position.set(-2.4,.85,0);g.add(pole);const yk=mesh(new THREE.CylinderGeometry(.045,.045,1.5,8),dark);yk.rotation.x=Math.PI/2;yk.position.set(-3.45,1.4,0);g.add(yk);
 const bp=mesh(new THREE.CylinderGeometry(.028,.04,4.4,8),mat(0x3a2418));bp.position.set(1.1,3.0,0);g.add(bp);
 const pg=new THREE.PlaneGeometry(2.1,1.0,14,4);pg.translate(1.05,0,0);const pn=mesh(new THREE.Mesh(pg).geometry,mat(0x8f2418,{roughness:.8,side:THREE.DoubleSide,emissive:0x2a0804,emissiveIntensity:.6}),false);pn.position.set(1.1,4.0,0);g.add(pn);ch.pen=pn;ch.penO=pg.attributes.position.array.slice();
 const pe=mesh(new THREE.CircleGeometry(.27,20),gold);pe.position.set(1.0,0,.012);pn.add(pe);
 const h1=makeHorse(0x16100d,0),h2=makeHorse(0x3a2014,1.6);h1.g.position.set(-3.0,0,.62);h2.g.position.set(-2.75,0,-.62);g.add(h1.g,h2.g);ch.horses=[h1,h2];
 ch.update=function(t,dt){for(const h of this.horses){h.neck.rotation.z=-.7+Math.sin(t*1.3+h.ph)*.05;h.head.rotation.z=-1.7+Math.sin(t*1.9+h.ph)*.1;h.body.scale.y=1+Math.sin(t*1.8+h.ph)*.012;let s=h.tail;let k=0;s.rotation.z=Math.sin(t*1.5+h.ph)*.2;let p=s.children[0];while(p){p.rotation.z=Math.sin(t*2+k*.6+h.ph)*.18;p=p.children.find(c=>c.isGroup);k++}}
  const p=this.pen.geometry.attributes.position,o=this.penO;for(let i=0;i<p.count;i++){const x=o[i*3];p.array[i*3+2]=Math.sin(t*3.2-x*3.3)*.16*(x/2.1+.1);p.array[i*3+1]=o[i*3+1]+Math.sin(t*2.4-x*2.2)*.05*x}p.needsUpdate=true}
 return ch}
