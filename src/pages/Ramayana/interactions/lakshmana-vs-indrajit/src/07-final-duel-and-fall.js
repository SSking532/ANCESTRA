/* ---------- STAGE V: THE FINAL CONFRONTATION (a free duel of arrows) ---------- */
const S5={
 init(){this.cd=0;this.et=1.4;this.hits=0;this.say=0;GM.lane=GM.laneT=1.5;GM.crouchBase=0;LK.P.mode='bow';LK.P.nock=true;LK.P.draw=.4;this.prevMight=GM.might;
  const f=fit();camTo([-1.5,2.6,8.5],[-4.5,1.7,0],30,1,true);later(GO-.4,()=>{if(GM.stage===3)mainShot(1.2)});
  say('INDRAJIT','Enough of this. Let one arrow decide between us!');
  hint('Aim with the pointer. Click or hold to shoot. W / S sidestep. Wear down Indrajit\u2019s might.');
  dockSet([]);ctls([{label:'\u25b2 STEP FARTHER',sub:'W',id:'ln0',fn:()=>S5.step(-1)},{label:'\u25bc STEP NEARER',sub:'S',id:'ln1',fn:()=>S5.step(1)}])},
 step(d){GM.laneT=clamp(Math.round(GM.laneT)+d,0,3)},
 key(c,d){if(!d)return;if(c==='ArrowUp'||c==='KeyW'){this.step(-1);pulseBtn('ln0')}if(c==='ArrowDown'||c==='KeyS'){this.step(1);pulseBtn('ln1')}if(c==='Space')this.fire()},
 down(){this.fire()},
 fire(){if(!GM.go||this.cd>0)return;const o=bowTip(LK,.85),d=LK.P.aim.clone();
  let best=null,bd=2;for(const e of ARR){if(!e.alive||e.kind!=='enemy'||e.p.x<LK_X+2)continue;const tt=(e.p.x-o.x)/(48+(-e.v.x)),pp=e.p.clone().addScaledVector(e.v,tt),line=o.clone().addScaledVector(d,(pp.x-o.x)/Math.max(.1,d.x)),dist=Math.hypot(pp.y-line.y,pp.z-line.z);if(dist<bd){bd=dist;best=pp}}
  if(best)d.copy(best.sub(o).normalize());
  const a=spawnArrow(o,d.multiplyScalar(48),'mine');a.m.scale.setScalar(1.35);this.cd=.3;LK.P.draw=0;SFX.shot();burst(o,8,{dir:LK.P.aim,spread:.4,c:[1,.85,.5],v0:3,v1:9,life:.4,size:.1,g:0})},
 update(dt){
  this.cd-=dt;aimFromPointer();LK.P.nock=this.cd<.08;LK.P.draw=this.cd>0?.4*(1-this.cd/.3):.4;if(GM.ptr.down||GM.keys.Space)this.fire();
  /* Indrajit looses volleys of his own */
  this.et-=dt;const p=1-(GM.might-MIGHT_END[3])/Math.max(1,(this.prevMight-MIGHT_END[3]));
  if(this.et<=0){this.et=lerp(1.35,.8,clamp(p,0,1))*rnd(.8,1.2);const dbl=Math.random()<.3;for(let k=0;k<(dbl?2:1);k++)later(k*.22,()=>{if(GM.stage!==3||!GM.go)return;const t=chestOf(LK,rnd(1,1.9));t.z+=rnd(-.25,.25);aimAt(IN,t);IN.P.draw=1;const o=bowTip(IN,.6);spawnArrow(o,t.clone().sub(o).normalize().multiplyScalar(rnd(13,17)),'enemy');SFX.shot()})}
  for(const e of ARR){if(!e.alive||e.kind!=='enemy')continue;
   for(const m of ARR){if(!m.alive||m.kind!=='mine')continue;if(sweptHit(m,e,1.1)){killArrow(m);killArrow(e);SFX.clash();CAM.shake+=.15;burst(e.p,36,{c:[1,.85,.5],v0:3,v1:13,life:.7,size:.2,g:5});ring(e.p,[1.6,1.2,.6],3,.4,.05);lightAt(e.p,[1,.8,.4],1.2);break}}
   if(!e.alive)continue;
   if(e.pp.x>LK_X+.5&&e.p.x<=LK_X+.5){if(Math.abs(e.p.z-lkP().z)<.75){killArrow(e);hurt(7,'STRUCK')}}}
  for(const m of ARR){if(!m.alive||m.kind!=='mine'||m.p.x<IN_X-1.2)continue;if(Math.abs(m.p.z)<1.25&&m.p.y>.7&&m.p.y<3.1){killArrow(m);SFX.hit();indHit(m.p,1.8,false);this.hits++;if(this.hits%4===0)CAM.shake+=.2}}
  const frac=(GM.might-MIGHT_END[3])/Math.max(1,this.prevMight-MIGHT_END[3]);
  if(frac<.66&&this.say<1){this.say=1;say('INDRAJIT','Your arrows sting, son of Sumitra. They will not be enough.')}
  if(frac<.33&&this.say<2){this.say=2;say('LAKSHMANA','The bow does not tire when dharma draws it.')}
  if(GM.might<=MIGHT_END[3]+.01&&GM.go){for(const a of ARR)killArrow(a);complete('INDRAJIT FALTERS')}},
 hud(g){const b=toScreen(bowTip(LK,.4));g.save();g.setLineDash([2,8]);g.strokeStyle='rgba(240,214,150,.45)';g.lineWidth=1.2;g.beginPath();g.moveTo(b.x,b.y);g.lineTo(GM.ptr.x,GM.ptr.y);g.stroke();g.setLineDash([]);g.strokeStyle='rgba(255,236,180,.9)';g.beginPath();g.arc(GM.ptr.x,GM.ptr.y,11,0,7);g.moveTo(GM.ptr.x-18,GM.ptr.y);g.lineTo(GM.ptr.x-6,GM.ptr.y);g.moveTo(GM.ptr.x+18,GM.ptr.y);g.lineTo(GM.ptr.x+6,GM.ptr.y);g.moveTo(GM.ptr.x,GM.ptr.y-18);g.lineTo(GM.ptr.x,GM.ptr.y-6);g.moveTo(GM.ptr.x,GM.ptr.y+18);g.lineTo(GM.ptr.x,GM.ptr.y+6);g.stroke();g.restore()}};
/* ---------- STAGE VI: THE FALL OF INDRAJIT ---------- */
const S6={
 delay:.3,
 init(){this.t0=GM.t;this.ev={};this.arrow=null;VIB.root.visible=false;VIB.root.position.set(-9.6,0,-2.8);VIB.P.mode='fold';GM.slow=1;GM.desatT=0;GM.crouchBase=0;LK.P.mode='bow';LK.P.nock=true;LK.P.bowOn=true;GM.lane=GM.laneT=1.5;
  el.bars.classList.add('on');say('','');hint('');dockSet([]);camTo([-1.6,2.0,5.2],[-5.8,1.7,0],34,1,true);showBanner(4)},
 once(k,t,f){if(this.T>=t&&!this.ev[k]){this.ev[k]=1;f()}},
 update(dt){
  const T=this.T=GM.t-this.t0,tipL=bowTip(LK,.9),hit=chestOf(IN,1.45);
  this.once('a',.6,()=>{say('LAKSHMANA','If Rama, son of Dasharatha, is true to dharma and without equal in valour, let this arrow end the son of Ravana.');SFX.gong();camTo([-3.9,1.85,2.7],[-5.2,1.75,0],30,.7)});
  if(T<4){const p=T/4;LK.P.draw=.35+.65*Math.min(1,p*1.5);aimAt(LK,hit);IN.P.base=.9;aimAt(IN,chestOf(LK,1.4));CAM.shake=Math.max(CAM.shake,p*.12);
   SPARK.emit(tipL.x,tipL.y,tipL.z,rnd(-2,2),rnd(-2,2),rnd(-2,2),.6,.1+p*.35,1,.88,.5,0,0,.6+p*.4);lightAt2(tipL,[1.3,1.1,.7],.5+p*2.2);if(Math.random()<p*.55)bolt(tipL,tipL.clone().add(V3(rnd(-2,2),rnd(-2,2),rnd(-1,1))),{n:7,j:.35,life:.13})}
  this.once('rel',4,()=>{LK.P.draw=0;GM.slow=.55;const o=bowTip(LK,.9),a=spawnArrow(o,hit.clone().sub(o).normalize().multiplyScalar(26),'mine');a.m.scale.setScalar(2.2);this.arrow=a;SFX.shot();flash(1,.95,.8,.35);camTo([-.5,2.3,9.5],[1,2.0,0],32,3.2)});
  if(this.arrow&&this.arrow.alive){const a=this.arrow;burst(a.p,6,{c:[1.4,1.2,.7],v0:1,v1:5,life:.5,size:.3,g:0});lightAt(a.p,[1.4,1.1,.6],2.4);if(Math.random()<.5)bolt(a.p,a.p.clone().add(V3(rnd(-1.5,1.5),rnd(-1.5,1.5),rnd(-1,1))),{n:5,j:.3,life:.1});
   if(a.p.x>=hit.x-.3){killArrow(a);this.hitFx(hit)}}
  if(T>4.6){GM.fall=Math.min(1,GM.fall+dt/2.6);const f=ease(GM.fall);IN.root.rotation.z=-f*1.2;IN.root.rotation.x=-f*.15;IN.root.position.set(IN_X+.7+f*.45,DECK-f*.42,0);IN.P.base=.3;IN.P.draw=.3}
  if(T>5.4&&GM.slow<1)GM.slow=Math.min(1,GM.slow+dt*.6);
  this.once('wide',6.4,()=>{camTo([0,3.4,17],[0,1.8,0],34,.5);GM.desatT=.55;GM.moodT=.85;say('THE FIELD OF LANKA','The horses stand still. The roar of the battle dies away on both sides.')});
  this.once('low',8.2,()=>{LK.P.mode='lowered';LK.P.draw=0;LK.P.nock=false;say('THE FIELD OF LANKA','Lakshmana lowers his bow. No cry of victory rises from the field.');camTo([-2.6,1.7,6.8],[-6,1.4,0],32,.45)});
  this.once('vib',11,()=>{VIB.root.visible=true;VIB.P.mode='fold';say('VIBHISHANA','He was my brother’s son. I held him as a child. Dharma asked me to stand where I stood. It did not ask me not to grieve.');SFX.bell()});
  if(T>11){const k=ease(clamp((T-11.3)/7,0,1));VIB.root.position.set(lerp(-9.6,1.6,k),0,lerp(-2.8,-1.2,k));VIB.P.headPitch=clamp((T-13)/2,0,1)*.5;VIB.P.headYaw=.15;if(T>11.5){CAM.tl.set(VIB.root.position.x*.6-1.5,1.5,0);CAM.tp.set(VIB.root.position.x*.5-1.5,1.9,8.5)}}
  if(T>8&&Math.random()<dt*20)SMOKE.emit(rnd(-8,10),.1,rnd(-4,3),rnd(-.4,-1.2),rnd(.1,.4),0,rnd(2,4),rnd(1.2,2.4),.3,.2,.14,0,1.5,.22);
  this.once('end',20.2,()=>{el.bars.classList.remove('on');overlay('<div class="card"><div class="eb">ANCESTRA · YUDDHA KANDA</div><h1 style="font-size:clamp(1.3rem,4.8vw,2.1rem)">The Fall of Indrajit</h1><div class="dv">इन्द्रजित् वध</div><p>Two princes met at the end of one road, each faithful to his own cause. Meghanada, the greatest warrior of Lanka, has fallen, and the war now turns toward Ravana.</p><button class="btn big" id="again" type="button">Fight Again</button></div>');$('#again').onclick=()=>{closeOverlay();GM.slow=1;GM.desatT=0;GM.fall=0;GM.paused=false;clearFx();begin()}})},
 hitFx(p){GM.mightFlag=1;GM.might=0;flash(1,.96,.85,1);CAM.shake=2.2;SFX.thunder();for(let i=0;i<7;i++)bolt(V3(p.x+rnd(-6,6),34,p.z+rnd(-4,4)),p,{n:16,j:1.6,life:.35});sphereFlash(p,[3,2.6,1.6],5,.7);ring(p,[2.6,2,1],16,1.3,.1);ring(p,[1.6,1.3,.8],9,.9,.06);burst(p,160,{c:[1.3,1.1,.6],v0:5,v1:26,life:1.6,size:.3,g:3});puff(p,14,{c:[.3,.22,.16],size:3,life:3.2,a:.6});lightAt(p,[1.4,1.1,.6],5);
  IN.P.mode='down';IN.P.bowOn=false;const b=makeBow('indra');b.userData.ar.visible=false;b.position.copy(IN.root.position).add(IN.bow.position);scene.add(b);FALLBOW={m:b,v:V3(3,6,1.2),w:5};GM.slow=.22;camTo([3.4,2.3,6.0],[6.9,2.0,0],28,2.6)}};
const STAGES=[S1,S2,S3,S5,S6];
/* ---------- boot ---------- */
function boot(){buildComposer();buildEnv();SPARK=new Parts(6000,true);SMOKE=new Parts(1800,false);buildWorld();buildActors();buildPips();buildDock();resize();addEventListener('resize',resize);camTo([-1,3.2,13],[0,2,0],36,1,true);titleCard();requestAnimationFrame(loop)}
boot();
if(location.hash==='#debug')window.__lvi={GM,startStage,begin,STAGES,update,camUpdate,drawHud,composer,CAM,LK,IN,VIB,CH,scene,R,loop:()=>{camUpdate(.016,GM.t);composer.render()}};
