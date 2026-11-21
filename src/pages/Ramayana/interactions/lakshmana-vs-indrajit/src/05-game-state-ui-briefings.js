/* ---------- state, actors, UI ---------- */
const LK_X=-6,IN_X=6.5,DECK=.8,LZ0=-3.6,LZ1=3.6;
const laneZ=l=>lerp(LZ0,LZ1,l/3);
const GM={recoil:0,t:0,stage:-1,stageT:0,go:false,locked:false,paused:true,res:100,might:100,mood:0,moodT:0,lane:1.5,laneT:1.5,keys:{},ptr:{x:innerWidth*.62,y:innerHeight*.4,down:false},slow:1,fall:0,desatT:0,title:true};
let STG=null,TIMERS=[],LK,IN,VIB,CH,FALLBOW=null;
const later=(s,f)=>TIMERS.push({t:s,f});
const el={who:$('#who'),line:$('#line'),sub:$('#sub'),hint:$('#hint'),ctl:$('#ctl'),dock:$('#dock'),toast:$('#toast'),banner:$('#banner'),ov:$('#ov'),chip:$('#chip'),fR:$('#fR'),fM:$('#fM'),pips:$('#pips'),bars:$('#bars'),tab:$('#tab'),gauge:$('#gauge')};
const NAMES=['The Opening Exchange','The Celestial Weapons',"The Warrior’s Challenge",'The Final Confrontation','The Fall of Indrajit'];
const SUBS=['The prince of Lanka looses the first arrows','Indrajit calls upon the divine astras','The terror of the three worlds presses his attack','Both princes draw for the last time','The field falls silent'];
const ROM=['I','II','III','IV','V'],MIGHT_END=[84,66,50,14,0],MOODS=[0,.12,.25,.5,.72];
function buildActors(){LK=Human('laksh');IN=Human('indra');VIB=Human('vib');CH=makeChariot();scene.add(LK.root,IN.root,VIB.root,CH.g);
 CH.g.position.set(IN_X,0,0);IN.root.position.set(IN_X+.7,DECK,0);IN.P.side=-1;IN.P.aim.set(-1,.05,0);IN.P.headYaw=-1.15;LK.P.side=1;LK.P.headYaw=1.15;
 VIB.root.position.set(-9.6,0,-2.8);VIB.root.visible=false;VIB.P.mode='warn';VIB.P.headYaw=.5;LK.root.position.set(LK_X,0,0)}
/* UI helpers */
function buildPips(){el.pips.innerHTML=NAMES.map(()=>'<span class="pip"></span>').join('')}
function pips(){[...el.pips.children].forEach((p,i)=>p.className='pip'+(i<GM.stage?' d':i===GM.stage?' c':''));el.chip.textContent=GM.stage>=0?ROM[GM.stage]+' · '+NAMES[GM.stage].toUpperCase():''}
function say(who,line){el.who.textContent=who;el.line.textContent=line;el.sub.style.opacity=(who||line)?1:0}
function hint(t){el.hint.textContent=t||'';el.hint.style.opacity=t?1:0}
let toastT=0;function toast(t){el.toast.textContent=t;el.toast.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.toast.classList.remove('on'),1100)}
function ctls(list){el.ctl.innerHTML='';for(const a of list){const b=document.createElement('button');b.type='button';b.className='btn';b.innerHTML=a.label+(a.sub?'<small>'+a.sub+'</small>':'');if(a.id)b.id=a.id;b.addEventListener('click',()=>{a.fn();b.blur()});el.ctl.appendChild(b)}}
function pulseBtn(id){const b=document.getElementById(id);if(!b)return;b.classList.add('hit');setTimeout(()=>b.classList.remove('hit'),160)}
function showBanner(i){const b=el.banner;b.querySelector('.n').textContent='STAGE '+ROM[i];b.querySelector('.t').textContent=NAMES[i].toUpperCase();b.querySelector('.s').textContent=SUBS[i];b.classList.remove('on');void b.offsetWidth;b.classList.add('on')}
function overlay(h){el.ov.innerHTML=h;el.ov.classList.add('on')}
function closeOverlay(){el.ov.classList.remove('on');el.ov.innerHTML=''}
function hud(){el.fR.style.width=GM.res+'%';el.fM.style.width=GM.might+'%'}
/* ---------- the astra dock ---------- */
const ICON={varuna:'<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/><path d="M8 15c1.3 1 2.7 1 4 0s2.7-1 4 0"/>',garuda:'<path d="M3 8c3 0 6 1 9 5 3-4 6-5 9-5-1 4-4 8-9 11C7 16 4 12 3 8z"/><path d="M12 13v7M9.5 9.5l2.5 2"/>',surya:'<circle cx="12" cy="12" r="3.6"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',vayavya:'<path d="M3 9h10a3 3 0 1 0-3-3"/><path d="M3 14h14a3 3 0 1 1-3 3"/><path d="M3 19h6"/>',aindra:'<path d="M13 2L5 14h6l-1 8 9-13h-6z"/>',agneya:'<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-10z"/>'};
const AST=[['varuna','VARUNA','lord of the waters'],['garuda','GARUDA','king of the eagles'],['surya','SURYA','the sun, lord of light'],['vayavya','VAYAVYA','the wind god’s weapon'],['agneya','AGNEYA','arrows of consuming fire'],['aindra','AINDRA','the weapon of Indra']];
const DK={};
function buildDock(){el.dock.innerHTML='';AST.forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.className='ast off';b.innerHTML='<span class="k">'+(i+1)+'</span><svg viewBox="0 0 24 24">'+ICON[a[0]]+'</svg><span class="nm">'+a[1]+'<small>'+a[2]+'</small></span>';b.addEventListener('click',()=>castAstra(a[0]));el.dock.appendChild(b);DK[a[0]]={b,on:false,cd:0,max:1,rdy:false}})}
function dockSet(list,cdMax){for(const k in DK){const d=DK[k];d.on=list.includes(k);d.cd=0;d.max=cdMax&&cdMax[k]||1;d.rdy=false;d.b.className='ast '+(d.on?'on':'off')}}
function dockCd(k,s){const d=DK[k];d.cd=s;d.max=s}
function dockReady(k,v){const d=DK[k];d.rdy=v;d.b.classList.toggle('rdy',v)}
function dockTick(dt){for(const k in DK){const d=DK[k];if(d.cd>0){d.cd=Math.max(0,d.cd-dt)}d.b.style.setProperty('--cd',d.cd>0?(d.cd/d.max).toFixed(3):0)}}
function castAstra(k){const d=DK[k];if(!d||!d.on||d.cd>0||!GM.go||!STG||!STG.astra)return;const a=ac();if(a&&a.state==='suspended')a.resume();d.b.classList.add('fire');setTimeout(()=>d.b.classList.remove('fire'),500);STG.astra(k)}
/* ---------- helpers for staging ---------- */
const lkP=()=>LK.root.position;
function shoulderW(ch){const p=ch.root.position,s=ch.sc,bs=ch.P.side;return V3(p.x+bs*.235*s,p.y+(1.5-ch.P.crouch*.12)*s,p.z)}
function aimAt(ch,t){const s=shoulderW(ch);ch.P.aim.copy(t).sub(s).normalize()}
function bowTip(ch,off){const d=ch.P.aim;return ch.root.position.clone().add(ch.bow.position).addScaledVector(d,off==null?.6:off)}
function chestOf(ch,dy){const p=ch.root.position;return V3(p.x,p.y+(dy==null?1.45:dy)*ch.sc,p.z)}
function hurt(n,txt){GM.res=Math.max(0,GM.res-n);CAM.shake=Math.max(CAM.shake,.45);flash(.7,.08,.04,.28);SFX.hit();if(txt)toast(txt);const c=chestOf(LK);burst(c,18,{c:[1,.25,.1],v0:2,v1:8,life:.7,size:.14});if(GM.res<=0&&GM.go)fail()}
function mightTo(v){GM.might=Math.min(GM.might,Math.max(0,v))}
/* ---------- stage flow ---------- */
const GO=2.4;
function mainShot(k,snap){const f=fit();camTo([0,1.9+3.4*f,14.5*f],[.2,1.9,0],38,k||1.6,snap)}
function startStage(i,retry){
 GM.stage=i;STG=STAGES[i];GM.stageT=0;GM.go=false;GM.locked=false;GM.moodT=MOODS[i];GM.lane=GM.laneT=1.5;GM.title=false;
 for(const c of[LK,IN]){Object.assign(c.P,{mode:'idle',draw:0,crouch:0,nock:true,bowOn:true,lowered:false})}LK.P.side=1;IN.P.side=-1;IN.P.mode='bow';IN.P.draw=.3;IN.P.aim.set(-1,.05,0);IN.root.rotation.set(0,0,0);IN.root.position.set(IN_X+.7,DECK,0);GM.fall=0;
 if(FALLBOW){scene.remove(FALLBOW.m);FALLBOW=null}
 if(i<4){VIB.root.visible=false;VIB.root.position.set(-9.6,0,-2.8)}
 el.bars.classList.add('on');pips();ctls([]);hint('');dockSet([]);el.tab.innerHTML='';el.gauge.classList.remove('on');
 const go=()=>{showBanner(i);later(GO-.2,()=>{if(GM.stage===i)el.bars.classList.remove('on')})};
 if(i<4){if(retry)go();else{GM.paused=true;briefing(i,()=>{closeOverlay();GM.paused=false;GM.stageT=0;go()})}}
 STG.init();hud()}
function complete(msg){if(GM.locked)return;GM.locked=true;GM.go=false;ctls([]);dockSet([]);el.tab.innerHTML='';el.gauge.classList.remove('on');if(msg)toast(msg);SFX.bell();later(1.8,()=>startStage(GM.stage+1))}
function fail(){GM.go=false;GM.paused=true;ctls([]);SFX.drum();overlay('<div class="card"><div class="eb">THE FIELD OF LANKA</div><h1 style="font-size:clamp(1.2rem,4vw,1.9rem)">Lakshmana Staggers</h1><div class="dv">धैर्य</div><p>His strength is spent, but the son of Sumitra draws breath, steadies his grip and rises to meet the prince of Lanka once more.</p><button class="btn big" id="rise" type="button">Rise Again</button></div>');$('#rise').onclick=()=>{closeOverlay();GM.res=80;GM.paused=false;clearFx();startStage(GM.stage,true)}}
function clearFx(){for(const a of ARR)killArrow(a);ACTIVE.length=0}
function titleCard(){GM.paused=true;GM.stage=-1;STG=null;GM.moodT=0;GM.title=true;pips();say('','');hint('');dockSet([]);ctls([]);
 overlay('<div class="card"><div class="eb">ANCESTRA · THE RAMAYANA</div><h1>LAKSHMANA<span>VS</span>INDRAJIT</h1><div class="dv">लक्ष्मण बनाम इन्द्रजित्</div><p>The rite at Nikumbhila is broken. Meghanada, the greatest warrior of Lanka, rides out in fury, and Lakshmana, prince of Ayodhya, steps onto the field with Vibhishana at his side.</p><p>The greatest warrior of Lanka is about to face the warrior who will bring his story to an end.</p><button class="btn big" id="begin" type="button">Begin the Battle</button></div>');$('#begin').onclick=begin}
function begin(){const a=ac();if(a&&a.state==='suspended')a.resume();closeOverlay();GM.res=100;GM.might=100;GM.paused=false;GM.mood=0;clearFx();SFX.drum();startStage(0)}
/* summoned astras flying across the field */
const ACTIVE=[];
function summon(type,from,to,dur,onHit){const o=new Counter(type);ACTIVE.push({o,from:from.clone(),to:to.clone(),t:0,dur,onHit,type});SFX.summon();return ACTIVE[ACTIVE.length-1]}
function activeUpdate(dt){for(let i=ACTIVE.length-1;i>=0;i--){const a=ACTIVE[i];a.t+=dt;const k=Math.min(1,a.t/a.dur),p=a.from.clone().lerp(a.to,ease(k)),d=a.to.clone().sub(a.from).normalize();a.o.update(p,d,dt);a.pos=p;if(k>=1){a.o.dispose();ACTIVE.splice(i,1);if(a.onHit)a.onHit(p)}}}
/* ---------- input ---------- */
const pt=e=>({x:e.clientX,y:e.clientY});
GL.addEventListener('pointermove',e=>{GM.ptr.x=e.clientX;GM.ptr.y=e.clientY;if(STG&&GM.go&&STG.move)STG.move(e.clientX,e.clientY)});
GL.addEventListener('pointerdown',e=>{const a=ac();if(a&&a.state==='suspended')a.resume();try{GL.setPointerCapture(e.pointerId)}catch(_){}GM.ptr.x=e.clientX;GM.ptr.y=e.clientY;GM.ptr.down=true;if(STG&&GM.go&&STG.down)STG.down(e.clientX,e.clientY)});
const pUp=()=>{GM.ptr.down=false;if(STG&&GM.go&&STG.up)STG.up()};GL.addEventListener('pointerup',pUp);GL.addEventListener('pointercancel',pUp);
const KEYS=new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
addEventListener('keydown',e=>{if(KEYS.has(e.code))e.preventDefault();if(GM.paused||!STG||!GM.go||e.repeat)return;GM.keys[e.code]=true;const m={Digit1:'varuna',Digit2:'garuda',Digit3:'surya',Digit4:'vayavya',Digit5:'agneya',Digit6:'aindra'}[e.code];if(m)castAstra(m);else if(STG.key)STG.key(e.code,true)});
addEventListener('keyup',e=>{GM.keys[e.code]=false;if(!GM.paused&&STG&&GM.go&&STG.key)STG.key(e.code,false)});
$('#snd').addEventListener('click',e=>{sndOn=!sndOn;e.target.textContent=sndOn?'SOUND ON':'SOUND OFF';e.target.blur()});
$('#fs').addEventListener('click',e=>{try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen()}catch(_){}e.target.blur()});
/* ---------- main loop ---------- */
const HC=$('#hc'),hx=HC.getContext('2d');
function update(dt){
 GM.t+=dt;const sdt=dt*GM.slow;
 for(let i=TIMERS.length-1;i>=0;i--){TIMERS[i].t-=dt;if(TIMERS[i].t<=0){const f=TIMERS[i].f;TIMERS.splice(i,1);f()}}
 if(!GM.paused&&STG){GM.stageT+=dt;if(!GM.go&&!GM.locked&&GM.stageT>(STG.delay==null?GO:STG.delay)){GM.go=true;if(STG.start)STG.start()}if(GM.go&&STG.update)STG.update(sdt)}
 GM.lane+=(GM.laneT-GM.lane)*Math.min(1,dt*10);LK.root.position.z=laneZ(GM.lane);
 const mv=Math.abs(GM.laneT-GM.lane);LK.P.crouch=(GM.crouchBase||0)+(mv>.25?.35:0);
 IN.P.draw=Math.max(IN.P.base==null?.3:IN.P.base,IN.P.draw-dt*2.4);
 if(GM.title){const a=GM.t*.07;camTo([Math.sin(a)*9-1,3.2+Math.sin(GM.t*.2)*.4,13+Math.cos(a)*3],[0,2,0],36,.9);LK.P.mode='bow';LK.P.draw=.1;LK.P.nock=false;LK.P.aim.set(1,.1,0);IN.P.mode='bow';IN.P.nock=false;IN.P.aim.set(-1,.06,0)}
 GM.mood+=(GM.moodT-GM.mood)*Math.min(1,dt*.8);GM.fall=GM.fall;
 GM.recoil*=Math.pow(.02,dt);if(STG!==S6&&!GM.title){IN.root.position.x=IN_X+.7+GM.recoil;CH.g.position.x=IN_X+GM.recoil*.7}
 LK.update(dt,GM.t);IN.update(dt,GM.t);if(VIB.root.visible)VIB.update(dt,GM.t);CH.update(GM.t,dt);
 if(FALLBOW){const f=FALLBOW;f.v.y-=22*sdt;f.m.position.addScaledVector(f.v,sdt);f.m.rotation.z+=f.w*sdt;if(f.m.position.y<.2&&f.v.y<0){f.m.position.y=.2;f.v.y*=-.2;f.v.x*=.5;f.w*=.4;if(!f.t){f.t=1;burst(f.m.position,14,{c:[.8,.6,.35],v0:1,v1:5,g:6});puff(f.m.position,4,{c:[.3,.2,.14],size:1.2});SFX.snap()}}}
 stepArrows(sdt);activeUpdate(sdt);worldUpdate(dt,GM.t,GM.mood);
 for(const p of PARTS)p.update(dt);tempUpdate(dt);dockTick(dt);hud();
 SKY.material.uniforms.uT.value=GM.t;SKY.material.uniforms.uMood.value=GM.mood;SKY.material.uniforms.uDark.value=GFX.dark;
 const u=gradePass.uniforms;u.uT.value=GM.t%100;u.uFlash.value.set(GFX.fc.x,GFX.fc.y,GFX.fc.z,Math.min(1,GFX.flash));u.uDark.value=GFX.dark;u.uDesat.value+=(GM.desatT-u.uDesat.value)*Math.min(1,dt*.7);
 scene.fog.color.setRGB(.54*(1-GM.mood*.5)*(1-GFX.dark*.8),.29*(1-GM.mood*.5)*(1-GFX.dark*.8),.17*(1-GM.mood*.4));HEMI.intensity=.75*(1-GM.mood*.4)*(1-GFX.dark*.7);SUN.intensity=2.6*(1-GM.mood*.35)*(1-GFX.dark*.7)}
function drawHud(){hx.setTransform(1,0,0,1,0,0);hx.clearRect(0,0,HC.width,HC.height);const d=HC.width/innerWidth;hx.setTransform(d,0,0,d,0,0);if(STG&&STG.hud&&GM.go)STG.hud(hx)}
let last=0;function loop(ts){const dt=Math.min(.05,Math.max(0,(ts-last)/1000)||0);last=ts;update(dt);camUpdate(dt,GM.t);drawHud();composer.render();requestAnimationFrame(loop)}

/* ---------- Lakshmana's own weapons ---------- */
function chipMight(n){const fl=MIGHT_END[Math.max(0,GM.stage)];GM.might=Math.max(fl,GM.might-n)}
function indHit(p,n,big){chipMight(n);GM.recoil=Math.min(1.1,GM.recoil+(big?.7:.25));IN.P.headPitch=.35;later(.35,()=>{IN.P.headPitch=0});burst(p,big?40:16,{c:[1.4,1.0,.5],v0:3,v1:big?16:9,life:.8,size:big?.26:.16,g:5});if(big)CAM.shake+=.7;lightAt(p,[1,.8,.4],big?2.4:1.2)}
const WEAP={agneya:{dmg:7,cd:9,t:.7,name:'AGNEYA ASTRA'},garuda:{dmg:10,cd:13,t:.8,name:'GARUDA ASTRA'}};
function strikeIndra(k,onClear){const w=WEAP[k],from=bowTip(LK,.8),to=V3(IN_X-1.0,1.9,0);dockCd(k,w.cd);LK.P.draw=1;toast(w.name);
 summon(k,from,to,w.t,p=>{impactFx(k,p);indHit(p,w.dmg,true);ring(p,[1.8,1.4,.7],6,.8,.07);SFX.hit();toast('DIRECT HIT')});
 later(w.t*.55,()=>{let c=0;for(const a of ARR)if(a.alive&&a.kind==='enemy'){killArrow(a);burst(a.p,18,{c:k==='agneya'?[1.4,.6,.2]:[1.3,1.1,.5],v0:2,v1:9,life:.6,size:.16});c++}if(c&&onClear)onClear(c)})}

/* ---------- briefing shown before every stage ---------- */
const BRIEF=[
 {t:'The Opening Exchange',d:'\u092a\u094d\u0930\u0925\u092e \u092f\u0941\u0926\u094d\u0927',p:'Indrajit looses twelve arrows. Break them in the air before they reach you.',l:['<b>AIM</b> with the pointer, <b>CLICK</b> or <b>SPACE</b> to shoot. Shots lean toward the nearest arrow.','An arrow that hits Indrajit himself wears down his might.','<b>2 GARUDA</b>, <b>4 VAYAVYA</b> and <b>5 AGNEYA</b> sit on the right. Each one clears every arrow in the air. Agneya and Garuda also strike Indrajit hard.']},
 {t:'The Celestial Weapons',d:'\u0926\u093f\u0935\u094d\u092f\u093e\u0938\u094d\u0924\u094d\u0930',p:'Indrajit invokes five divine astras. Each has one true answer. Click the matching astra in the dock on the right before his weapon lands.',table:[['AGNEYA ASTRA','a ball of fire','VARUNA ASTRA','water','1'],['NAGA ASTRA','a swarm of serpents','GARUDA ASTRA','the great eagle','2'],['TAMASA ASTRA','a sphere of darkness','SURYA ASTRA','the sun','3']],l:['The correct button will pulse gold. The name of his astra and its answer are shown over the incoming weapon.','A wrong choice only costs you time. If his astra lands it takes a big piece of your resolve.']},
 {t:'The Warrior\u2019s Challenge',d:'\u092f\u094b\u0926\u094d\u0927\u093e',p:'Indrajit presses his attack. Stand in a different rank of the field to dodge each volley.',l:['<b>W / \u2191</b> moves farther, <b>S / \u2193</b> moves nearer. You can also drag the pointer, or use the buttons on the left.','A glowing red line and mark show where the next arrow will land. Leave that rank.','<b>2 GARUDA</b>, <b>4 VAYAVYA</b> and <b>5 AGNEYA</b> wipe out the incoming volley. Hold your ground until the bar at the bottom fills.']},
 {t:'The Final Confrontation',d:'\u0905\u0902\u0924\u093f\u092e \u092f\u0941\u0926\u094d\u0927',p:'No tasks and no trials. Lakshmana and Indrajit trade arrows until one of them breaks.',l:['<b>AIM</b> with the pointer. <b>CLICK</b>, hold the mouse, or press <b>SPACE</b> to shoot. Your arrows break his arrows in the air.','<b>W / \u2191</b> and <b>S / \u2193</b> sidestep, so his arrows pass you by. Any arrow that reaches you costs resolve.','Every arrow that hits Indrajit wears down his might. When it runs out, the end comes.']}];
function briefing(i,done){const b=BRIEF[i],tbl=b.table?'<table class="mt"><tr><th>HE INVOKES</th><th></th><th>YOU ANSWER WITH</th></tr>'+b.table.map(r=>'<tr><td>'+r[0]+'<i>'+r[1]+'</i></td><td class="ar">\u2192</td><td>'+r[2]+'<span class="k">'+r[4]+'</span><i>'+r[3]+'</i></td></tr>').join('')+'</table>':'';
 overlay('<div class="card gd"><div class="eb">STAGE '+ROM[i]+' \u00b7 HOW TO FIGHT</div><h1>'+b.t+'</h1><div class="dv">'+b.d+'</div><p>'+b.p+'</p>'+tbl+'<ul>'+b.l.map(x=>'<li>'+x+'</li>').join('')+'</ul><button class="btn big" id="bgo" type="button">Begin Stage '+ROM[i]+'</button></div>');
 const g=$('#bgo');g.onclick=done;g.focus()}
