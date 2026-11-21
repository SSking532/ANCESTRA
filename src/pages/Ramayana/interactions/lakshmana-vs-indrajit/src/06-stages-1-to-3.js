/* ---------- helpers ---------- */
function diamonds(g,cx,y,n,a,b){const x0=cx-n*7;for(let i=0;i<n;i++){g.fillStyle=i<a?(i<b?'#e8c36e':'#c2482a'):'rgba(240,226,190,.3)';g.save();g.translate(x0+i*14+7,y);g.rotate(.785);g.fillRect(-3.5,-3.5,7,7);g.restore()}}
function aimFromPointer(){const ap=aimPoint(GM.ptr.x,GM.ptr.y,lkP().z);if(!ap)return;const d=ap.sub(shoulderW(LK));if(d.x<2)d.x=2;d.normalize();LK.P.aim.copy(d)}
function indAimLK(dy){const t=chestOf(LK,dy==null?1.4:dy);aimAt(IN,t);if(IN.P.aim.x>-.3){IN.P.aim.x=-.3;IN.P.aim.normalize()}return t}
/* ---------- STAGE I: THE OPENING EXCHANGE ---------- */
const S1={
 init(){this.n=0;this.total=12;this.broke=0;this.res=0;this.sp=0;this.cd=0;this.lastGust=0;LK.P.mode='bow';LK.P.draw=.35;LK.P.nock=true;GM.crouchBase=0;
  camTo([-3.4,1.8,4.6],[-6,1.7,0],32,1,true);later(GO-.5,()=>{if(GM.stage===0)mainShot(1.3)});
  say('INDRAJIT','You walk into a field I was born to rule, son of Sumitra. Count your breaths.');
  hint('Click to loose arrows. They break his arrows in flight, and hits on Indrajit wear down his might. Space also fires · 2 Garuda · 4 Vayavya · 5 Agneya.');
  dockSet(['vayavya','garuda','agneya'],{});ctls([{label:'LOOSE ARROW',sub:'Space',id:'fire1',fn:()=>S1.fire()}])},
 start(){this.sp=.5},
 key(c,d){if(d&&c==='Space'){this.fire();pulseBtn('fire1')}},
 down(){this.fire()},
 fire(){if(!GM.go||this.cd>0)return;const o=bowTip(LK,.85),d=LK.P.aim.clone();
  /* aim assist: lead the nearest enemy arrow that is close to the aim line */
  let best=null,bd=2.2;for(const e of ARR){if(!e.alive||e.kind!=='enemy'||e.p.x<LK_X+2)continue;const tt=(e.p.x-o.x)/(55+(-e.v.x)),pp=e.p.clone().addScaledVector(e.v,tt),line=o.clone().addScaledVector(d,(pp.x-o.x)/Math.max(.1,d.x)),dist=Math.hypot(pp.y-line.y,pp.z-line.z);if(dist<bd){bd=dist;best=pp}}
  if(best)d.copy(best.sub(o).normalize());
  const a=spawnArrow(o,d.multiplyScalar(48),'mine');a.m.scale.setScalar(1.35);this.cd=.2;LK.P.draw=0;SFX.shot();CAM.shake+=.05;burst(o,10,{dir:LK.P.aim,spread:.4,c:[1,.85,.5],v0:3,v1:9,life:.4,size:.1,g:0})},
 astra(k){if(k==='agneya'||k==='garuda'){strikeIndra(k,c=>{this.broke+=c;this.res+=c;toast('SCATTERED');mightTo(100-(100-MIGHT_END[0])*Math.min(this.broke,this.total)/this.total)});return}if(k!=='vayavya')return;dockCd('vayavya',7);const to=chestOf(IN,1.2);summon('vayavya',bowTip(LK,.8),V3(IN_X-2,1.8,0),.6,p=>impactFx('vayavya',p));later(.32,()=>{let c=0;for(const a of ARR)if(a.kind==='enemy'&&a.alive){killArrow(a);burst(a.p,10,{c:[.9,.95,1],v0:2,v1:8,life:.5,size:.12});this.broke++;this.res++;c++}if(c){toast('SCATTERED');mightTo(100-(100-MIGHT_END[0])*this.broke/this.total)}})},
 update(dt){
  this.cd-=dt;aimFromPointer();LK.P.draw=this.cd>0?.35*(1-this.cd/.2):.35;LK.P.nock=this.cd<.06;
  this.sp-=dt;
  if(this.sp<=0&&this.n<this.total){this.n++;const p=this.n/this.total;this.sp=lerp(1.55,.9,p)*(this.n%4===0?.65:1);
   const t=indAimLK(rnd(.9,2.0));t.z+=rnd(-.25,.25);IN.P.draw=1;const sp=lerp(8.5,13.5,p);later(.12,()=>{if(GM.stage!==0)return;const o=bowTip(IN,.6),v=t.clone().sub(o).normalize().multiplyScalar(sp);spawnArrow(o,v,'enemy');SFX.shot()})}
  for(const e of ARR){if(!e.alive||e.kind!=='enemy')continue;
   if(e.p.x<LK_X+.5){killArrow(e);this.res++;hurt(11,'STRUCK');continue}
   for(const m of ARR){if(!m.alive||m.kind!=='mine')continue;if(sweptHit(m,e,1.1)){killArrow(m);killArrow(e);this.broke++;this.res++;mightTo(100-(100-MIGHT_END[0])*this.broke/this.total);SFX.clash();CAM.shake+=.15;burst(e.p,36,{c:[1,.85,.5],v0:3,v1:13,life:.7,size:.2,g:5});ring(e.p,[1.6,1.2,.6],3,.4,.05);lightAt(e.p,[1,.8,.4],1.6);toast(['SHATTERED','TRUE AIM','DEFLECTED'][this.broke%3|0]);break}}}
  for(const m of ARR){if(!m.alive||m.kind!=='mine'||m.p.x<IN_X-1.2)continue;if(Math.abs(m.p.z)<1.2&&m.p.y>.8&&m.p.y<3.0){killArrow(m);SFX.hit();indHit(m.p,2.2,false);toast('HIT');this.landed=(this.landed||0)+1}}
  if(this.n>=this.total&&!ARR.some(a=>a.alive&&a.kind==='enemy')&&GM.go){GM.might=Math.min(GM.might,MIGHT_END[0]);complete('THE OPENING EXCHANGE IS YOURS')}},
 hud(g){const p=toScreen(bowTip(LK,.4));g.save();g.setLineDash([2,8]);g.strokeStyle='rgba(240,214,150,.5)';g.lineWidth=1.2;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(GM.ptr.x,GM.ptr.y);g.stroke();g.setLineDash([]);g.strokeStyle='rgba(255,236,180,.9)';g.beginPath();g.arc(GM.ptr.x,GM.ptr.y,11,0,7);g.moveTo(GM.ptr.x-18,GM.ptr.y);g.lineTo(GM.ptr.x-6,GM.ptr.y);g.moveTo(GM.ptr.x+18,GM.ptr.y);g.lineTo(GM.ptr.x+6,GM.ptr.y);g.moveTo(GM.ptr.x,GM.ptr.y-18);g.lineTo(GM.ptr.x,GM.ptr.y-6);g.moveTo(GM.ptr.x,GM.ptr.y+18);g.lineTo(GM.ptr.x,GM.ptr.y+6);g.stroke();g.restore();diamonds(g,innerWidth/2,innerHeight*.12+36,this.total,this.res,this.broke)}};
/* ---------- STAGE II: THE CELESTIAL WEAPONS ---------- */
const ASTRAS=[{id:'agneya',n:'AGNEYA ASTRA',ans:'varuna',line:'Agneya! Let the fire of the sacrifice consume you, Lakshmana!'},{id:'naga',n:'NAGA ASTRA',ans:'garuda',line:'Serpents of the deep, bind him where he stands!'},{id:'tamasa',n:'TAMASA ASTRA',ans:'surya',line:'Let night fall upon this field. Let him fight blind!'}];
const ANSNAME={varuna:'VARUNA (1)',garuda:'GARUDA (2)',surya:'SURYA (3)'};
const S2={
 init(){const a=[0,1,2,Math.random()*3|0,Math.random()*3|0];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}this.rounds=a;this.r=-1;this.st='idle';this.tt=0;this.wins=0;this.inc=null;this.busy=false;GM.crouchBase=0;LK.P.mode='bow';LK.P.draw=.3;
  camTo([2.5,1.6,8.5],[6.5,2.5,0],32,1,true);later(GO-.4,()=>{if(GM.stage===1)mainShot(1.2)});
  say('INDRAJIT','Mortals fight with arrows. I was given the weapons of the gods.');
  hint('Agneya (fire) \u2192 Varuna 1 \u00b7 Naga (serpents) \u2192 Garuda 2 \u00b7 Tamasa (darkness) \u2192 Surya 3. The right button pulses gold.');
  dockSet(['varuna','garuda','surya','vayavya'],{})},
 start(){this.next()},
 next(){this.r++;if(this.r>=this.rounds.length){GM.might=Math.min(GM.might,MIGHT_END[1]);complete('THE ASTRAS ARE ANSWERED');this.st='end';return}
  this.cur=ASTRAS[this.rounds[this.r]];this.st='invoke';this.tt=0;this.busy=false;IN.P.base=.95;IN.P.draw=1;say('INDRAJIT',this.cur.line);SFX.gong();this.inc=new Incoming(this.cur.id);camTo([2.8,3.2,11.5*fit()],[1.5,2.2,0],34,.9)},
 posAt(p){const o=this.o0,t=this.tgt,e=p*p*(3-2*p);return V3(lerp(o.x,t.x,e),lerp(o.y,t.y,e)+Math.sin(e*Math.PI)*1.2,lerp(o.z,t.z,e))},
 astra(k){if(this.st!=='fly'||this.busy)return;this.busy=true;dockCd(k,1.2);const m=Math.min(this.ft+.6,this.T-.05),meet=this.posAt(m/this.T),ok=k===this.cur.ans;LK.P.draw=1;
  summon(k,bowTip(LK,.8),meet,.6,p=>{if(this.st!=='fly')return;if(ok){this.st='win';this.tt=0;this.wins++;dockReady(this.cur.ans,false);mightTo(84-(84-MIGHT_END[1])*this.wins/this.rounds.length);impactFx(k,p);impactFx(this.cur.id,p);CAM.shake+=.7;SFX.clash();toast('ANSWERED');if(this.inc){this.inc.dispose();this.inc=null}}else{toast('WRONG ASTRA. TRY '+ANSNAME[this.cur.ans]);SFX.snap();ring(p,[1,1,1],2,.4,.04);this.ft=Math.min(this.T-1.4,this.ft+.5);this.busy=false}})},
 update(dt){
  this.tt+=dt;const cc=chestOf(IN,1.4);
  if(this.st==='invoke'){this.o0=bowTip(IN,.5);const t=indAimLK(1.3);aimAt(LK,cc);LK.P.draw=.3;const s=.3+.7*Math.min(1,this.tt/1.4);this.inc.g.scale.setScalar(s);this.inc.update(this.o0,V3(-1,0,0),dt);
   if(this.tt>1.4){this.st='fly';this.ft=0;this.T=Math.max(3.4,5.6-this.r*.4);dockReady(this.cur.ans,true);this.tgt=chestOf(LK,1.35);IN.P.base=.3;SFX.whoosh();this.inc.g.scale.setScalar(1);mainShot(1.4)}}
  else if(this.st==='fly'){this.ft+=dt;const p=Math.min(1,this.ft/this.T),pos=this.posAt(p),dir=this.posAt(Math.min(1,p+.02)).sub(pos).normalize();this.inc.update(pos,dir,dt);this.ipos=pos;aimAt(LK,pos);LK.P.draw=Math.max(LK.P.draw-dt*3,.45);
   if(this.ft>=this.T){hurt(20,'IT STRIKES');impactFx(this.cur.id,pos);CAM.shake+=.9;this.inc.dispose();this.inc=null;dockReady(this.cur.ans,false);this.st='after';this.tt=0}}
  else if(this.st==='win'||this.st==='after'){LK.P.draw=.3;if(this.tt>(this.st==='win'?1.2:1))this.next()}},
 hud(g){if(this.st==='fly'&&this.ipos){const s=toScreen(this.ipos);g.save();g.font='600 12px Cinzel,serif';g.textAlign='center';g.fillStyle='rgba(244,230,196,.95)';g.shadowColor='#000';g.shadowBlur=8;const ly=s.y-Math.max(46,pxPerM(this.ipos)*1.5),t2='ANSWER WITH '+ANSNAME[this.cur.ans],w=Math.max(g.measureText(this.cur.n).width,190)+24;g.shadowBlur=0;g.fillStyle='rgba(14,7,4,.78)';g.fillRect(s.x-w/2,ly-17,w,42);g.strokeStyle='rgba(232,195,110,.8)';g.lineWidth=1;g.strokeRect(s.x-w/2,ly-17,w,42);g.fillStyle='rgba(244,230,196,.98)';g.fillText(this.cur.n,s.x,ly);g.font='600 11px Cinzel,serif';g.fillStyle='rgba(240,205,120,.98)';g.fillText(t2,s.x,ly+16);const f=1-this.ft/this.T;g.strokeStyle='rgba(232,195,110,.9)';g.lineWidth=3;g.beginPath();g.arc(s.x,s.y,Math.max(30,pxPerM(this.ipos)*1.5),-1.57,-1.57+6.283*f);g.stroke();g.restore()}
  diamonds(g,innerWidth/2,innerHeight*.12+36,this.rounds.length,this.r+(this.st==='win'||this.st==='after'?1:0),this.wins)}};
/* ---------- STAGE III: THE WARRIOR'S CHALLENGE ---------- */
const S3={
 init(){this.t=0;this.DUR=26;this.warn=[];this.inv=0;this.q=this.build();GM.lane=GM.laneT=1;GM.crouchBase=0;LK.P.mode='bow';LK.P.nock=false;LK.P.draw=0;LK.P.aim.set(.96,-.08,.2).normalize();
  const f=fit();camTo([-9,7.5,13*f],[-6,1.5,0],36,1,true);later(GO-.4,()=>{if(GM.stage===2)camTo([0,1.2+6.4*f,15.5*f],[0,.9,0],38,1.2)});
  say('INDRAJIT','Three worlds trembled at this bow. Stand still, if you can.');
  hint('Move between the ranks of the field to dodge. Each volley is marked before it flies. ↑ ↓ or W S, or drag the pointer · 2 Garuda · 4 Vayavya · 5 Agneya strike back.');
  dockSet(['vayavya'],{vayavya:9});ctls([{label:'▲ FARTHER',sub:'W',id:'ln0',fn:()=>S3.step(-1)},{label:'▼ NEARER',sub:'S',id:'ln1',fn:()=>S3.step(1)}])},
 build(){const q=[];let t=1.4,last=-1;const R=()=>Math.random()*4|0;
  while(t<this.DUR-2.2){const p=t/this.DUR,k=Math.random();
   if(k<.3||p<.12){let a=R();if(a===last)a=(a+1+(Math.random()*3|0))%4;last=a;q.push({t,lane:a})}
   else if(k<.56){const a=R();let b=R();while(b===a)b=R();q.push({t,lane:a},{t:t+.12,lane:b})}
   else if(k<.8&&p>.3){const s=R();[0,1,2,3].filter(x=>x!==s).forEach((x,i)=>q.push({t:t+i*.06,lane:x}));t+=.35}
   else{const o=Math.random()<.5?[0,1,2]:[3,2,1];o.forEach((x,i)=>q.push({t:t+i*.3,lane:x}));t+=.5}
   t+=lerp(1.5,1,p)}
  return q},
 step(d){GM.laneT=clamp(Math.round(GM.laneT)+d,0,3)},
 key(c,d){if(!d)return;if(c==='ArrowUp'||c==='KeyW'){this.step(-1);pulseBtn('ln0')}if(c==='ArrowDown'||c==='KeyS'){this.step(1);pulseBtn('ln1')}},
 move(x,y){if(GM.ptr.down||matchMedia('(pointer:fine)').matches)this.ptrLane(y)},down(x,y){this.ptrLane(y)},
 ptrLane(y){let b=0,bd=1e9;for(let i=0;i<4;i++){const s=toScreen(V3(LK_X,0,laneZ(i))),d=Math.abs(s.y-y);if(d<bd){bd=d;b=i}}GM.laneT=b},
 astra(k){if(k==='agneya'||k==='garuda'){strikeIndra(k,()=>{this.warn.length=0;for(const e of this.q)if(e.w&&!e.f)e.f=true;toast('SCATTERED')});return}if(k!=='vayavya')return;dockCd('vayavya',9);summon('vayavya',bowTip(LK,.8),V3(IN_X-2,1.6,0),.6,p=>impactFx('vayavya',p));later(.3,()=>{for(const a of ARR)if(a.kind==='enemy'&&a.alive){killArrow(a);burst(a.p,10,{c:[.9,.95,1],v0:2,v1:8,life:.5,size:.12})}this.warn.length=0;for(const e of this.q)if(e.w&&!e.f)e.f=true;toast('SCATTERED')})},
 update(dt){
  this.t+=dt;this.inv-=dt;const L=LK.P;L.mode='bow';L.nock=false;L.draw=0;L.aim.set(.96,-.08,.2).normalize();
  for(const e of this.q){if(!e.w&&this.t>=e.t){e.w=true;this.warn.push({lane:e.lane,t:0})}
   if(!e.f&&this.t>=e.t+.75){e.f=true;const w=this.warn.findIndex(x=>x.lane===e.lane);if(w>=0)this.warn.splice(w,1);const tg=V3(LK_X+.3,1.35,laneZ(e.lane));aimAt(IN,tg);IN.P.draw=1;const o=bowTip(IN,.6),v=tg.clone().sub(o).normalize().multiplyScalar(15);const a=spawnArrow(o,v,'enemy');a.lane=e.lane;SFX.shot()}}
  for(const w of this.warn){w.t+=dt;SPARK.emit(LK_X+.4+rnd(-.3,.3),.2,laneZ(w.lane)+rnd(-.3,.3),0,rnd(.5,1.5),0,.5,.3,1,.3,.1,0,.5,.7)}
  for(const a of ARR){if(!a.alive||a.kind!=='enemy'||a.done)continue;if(a.p.x<=LK_X+.5){a.done=true;if(Math.abs(GM.lane-a.lane)<.6&&this.inv<=0){this.inv=.5;killArrow(a);hurt(9,'STRUCK')}}}
  mightTo(MIGHT_END[1]-(MIGHT_END[1]-MIGHT_END[2])*Math.min(1,this.t/this.DUR));
  if(this.t>this.DUR&&!ARR.some(a=>a.alive&&a.kind==='enemy')&&GM.go){GM.might=Math.min(GM.might,MIGHT_END[2]);complete('YOU HOLD YOUR GROUND')}},
 hud(g){
  for(const w of this.warn){const o=toScreen(bowTip(IN,.6)),t=toScreen(V3(LK_X+.3,.15,laneZ(w.lane))),a=.25+.55*Math.min(1,w.t/.75);g.save();g.setLineDash([4,9]);g.strokeStyle='rgba(255,130,80,'+a.toFixed(2)+')';g.lineWidth=2;g.beginPath();g.moveTo(o.x,o.y);g.lineTo(t.x,t.y);g.stroke();g.setLineDash([]);g.fillStyle='rgba(255,110,60,'+a.toFixed(2)+')';g.beginPath();g.arc(t.x,t.y,9+Math.sin(GM.t*20)*2,0,7);g.fill();g.restore()}
  const w=Math.min(420,innerWidth*.5),x0=innerWidth/2-w/2,y=innerHeight*.9,p=clamp(this.t/this.DUR,0,1);g.fillStyle='rgba(20,10,6,.7)';g.fillRect(x0-1,y-1,w+2,7);g.fillStyle='#e8c36e';g.fillRect(x0,y,w*p,5);g.font='600 10px Cinzel,serif';g.textAlign='center';g.fillStyle='rgba(240,226,190,.9)';g.fillText('COMPOSURE',innerWidth/2,y-8)}};
