/* =====================================================================
   app.js — Anbu Protein Tracker v2
   Local-first + Supabase real-time sync.
   Adds: fat-loss goal engine, reward/streak/badge system, cheat-meal
   unlocks, gamified Mission card, smart food search (auto macros),
   interactive planner / shopping / checklists, confetti & nudges.
   ===================================================================== */
'use strict';
const D = window.PLAN_DATA;
const FDB = window.FOODS_DB || [];
const LS_KEY = 'anbu_tracker_v1';
const SB_KEY = 'anbu_tracker_sb';

/* ---------- tiny helpers ---------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const el = (h) => { const t=document.createElement('template'); t.innerHTML=h.trim(); return t.content.firstElementChild; };
const now = () => new Date().toISOString();
const uid = () => 'x'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const clone = (o) => JSON.parse(JSON.stringify(o));
const esc = (s)=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function buzz(ms){ try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} }
function toast(msg,emoji){ const t=$('#toast'); t.innerHTML=(emoji?emoji+' ':'')+esc(msg); t.classList.remove('with-action'); t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2200); }
function toastAction(msg,emoji,label,fn,ms=4000){ const t=$('#toast'); t.innerHTML=(emoji?emoji+' ':'')+esc(msg)+` <button class="toast-act">${esc(label)}</button>`; t.classList.add('show','with-action');
  $('.toast-act',t).onclick=()=>{ t.classList.remove('show'); fn(); }; clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),ms); }
function floatXP(amount){ if(!amount)return; const p=el(`<div class="xpfloat">+${amount} XP</div>`); document.body.append(p); requestAnimationFrame(()=>p.classList.add('go')); setTimeout(()=>p.remove(),1200); }

/* ---------- dates (local) ---------- */
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function dkey(d){ const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; }
function parseDk(k){ const [y,m,dd]=k.split('-').map(Number); return new Date(y,m-1,dd); }
function planDow(k){ return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][parseDk(k).getDay()]; }
function addDays(k,n){ const d=parseDk(k); d.setDate(d.getDate()+n); return dkey(d); }
function prettyDate(k){ return parseDk(k).toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'}); }
function weekKey(k){ const d=parseDk(k); const onejan=new Date(d.getFullYear(),0,1); const wk=Math.ceil((((d-onejan)/86400000)+onejan.getDay()+1)/7); return d.getFullYear()+'-W'+wk; }
const TODAY=dkey(new Date());

/* =====================================================================
   STATE
   ===================================================================== */
function defaultState(){
  const gd=D.goalDefaults;
  return {
    meta:{
      updatedAt:now(),
      settings:Object.assign({
        userKey:'anbu-'+Math.random().toString(36).slice(2,8),
        waterTarget:D.targets.waterL, gymPerWeek:D.targets.gymPerWeek,
        proteinTarget:0, kcalTarget:0, carbTarget:0, fatTarget:0, autoTargets:true,
        reminders:{ enabled:false, streakTime:'20:30', meals:false },
        theme:'dark', favorites:[], onboarded:false,
      }, clone(gd)),
      library:clone(D.library),
      weeklyPlan:structPlan(clone(D.weeklyPlan)),
      shopping:D.shoppingDefaults.map(s=>({id:uid(),item:s.item,cat:s.cat,qty:'',star:false,done:false})),
      cookTasks:D.cookChecklist.map(t=>({id:uid(),label:t,done:false})),
      cookWeek:weekKey(TODAY),
      rewards:{ lastRedeem:'', redeems:[], badges:{} },
    },
    days:{},
  };
}
function structPlan(wp){ const out={}; for(const dow of D.days){ const src=wp[dow]||{}; out[dow]={cooked:{}}; for(const s of ['breakfast','lunch','evening','dinner']){ const v=src[s]; out[dow][s]= Array.isArray(v)?v : (v? [{name:v}] : []); } } return out; }

let state=loadLocal();
let selDate=TODAY, curTab='today';

function loadLocal(){ try{ const raw=localStorage.getItem(LS_KEY); if(raw){ const s=JSON.parse(raw); if(s&&s.meta&&s.days) return migrate(s); } }catch(e){} const s=defaultState(); computeTargets(s); return s; }
function migrate(s){
  const def=defaultState();
  s.meta.settings=Object.assign({}, def.meta.settings, s.meta.settings);
  if(!s.meta.rewards) s.meta.rewards=def.meta.rewards;
  if(!s.meta.rewards.badges) s.meta.rewards.badges={};
  if(!s.meta.rewards.redeems) s.meta.rewards.redeems=[];
  if(s.meta.rewards.lastRedeem==null) s.meta.rewards.lastRedeem='';
  if(!s.meta.settings.reminders) s.meta.settings.reminders={enabled:false,streakTime:'20:30',meals:false};
  if(!s.meta.settings.theme) s.meta.settings.theme='dark';
  if(!Array.isArray(s.meta.settings.favorites)) s.meta.settings.favorites=[];
  if(s.meta.settings.onboarded==null) s.meta.settings.onboarded=true; // existing users skip onboarding
  // structured plan
  const wp=s.meta.weeklyPlan||{}; const needStruct=Object.values(wp).some(v=>v&&!('cooked'in v)&&!Array.isArray(v.breakfast));
  s.meta.weeklyPlan=structPlan(wp);
  if(!s.meta.cookTasks) s.meta.cookTasks=def.meta.cookTasks;
  if(!s.meta.cookWeek) s.meta.cookWeek=weekKey(TODAY);
  for(const k in s.days){ const d=s.days[k]; if(!d.habits)d.habits={}; if(d.gym&&typeof d.gym!=='object')d.gym={done:false}; }
  computeTargets(s);
  return s;
}
let saveT=null;
function saveLocal(){ localStorage.setItem(LS_KEY,JSON.stringify(state)); }
function touchMeta(){ state.meta.updatedAt=now(); saveLocal(); schedulePush('meta'); }
function getDay(k){ if(!state.days[k]) state.days[k]={logged:[],gym:{done:false,type:'',minutes:null,notes:''},water:0,weight:null,notes:'',habits:{},updatedAt:now()}; if(!state.days[k].habits)state.days[k].habits={}; return state.days[k]; }
function touchDay(k){ const d=getDay(k); d.updatedAt=now(); saveLocal(); schedulePush('day:'+k); }

const S=()=>state.meta.settings;
function latestWeight(){ const keys=Object.keys(state.days).filter(k=>state.days[k].weight!=null).sort(); return keys.length? state.days[keys[keys.length-1]].weight : S().startWeight; }

/* ---------- goal engine ---------- */
function computeTargets(st=state){
  const s=st.meta.settings; if(s.autoTargets===false) return;
  const keys=Object.keys(st.days).filter(k=>st.days[k].weight!=null).sort();
  const w= keys.length? st.days[keys[keys.length-1]].weight : s.startWeight;
  const bmr=10*w + 6.25*s.heightCm - 5*s.age + (s.sex==='female'?-161:5);
  const tdee=bmr*(s.activity||1.5);
  const deficit=(s.rateKgPerWeek||0.5)*1100;
  s.kcalTarget=Math.max(1500, Math.round((tdee-deficit)/10)*10);
  s.proteinTarget=Math.round(w*(s.proteinPerKg||1.8));
  // carbs/fat targets from calories left after protein (≈55/45 split)
  const rem=Math.max(0, s.kcalTarget - s.proteinTarget*4);
  s.carbTarget=Math.round(rem*0.55/4);
  s.fatTarget=Math.round(rem*0.45/9);
}
function applyTheme(){ try{ document.documentElement.dataset.theme = (S().theme==='light'?'light':'dark'); }catch(e){} }
function goalProjection(){
  const s=S(), cur=latestWeight(), togo=cur-s.targetWeight;
  if(togo<=0) return {done:true,cur,togo:0};
  const weeks=togo/(s.rateKgPerWeek||0.5);
  const eta=new Date(); eta.setDate(eta.getDate()+Math.round(weeks*7));
  return {done:false,cur,togo:Math.round(togo*10)/10,weeks:Math.round(weeks),eta:eta.toLocaleDateString(undefined,{month:'short',year:'numeric'})};
}

/* ---------- totals ---------- */
function dayTotals(k){ const d=state.days[k]; const t={p:0,c:0,f:0,kcal:0,items:0}; if(d) for(const it of d.logged){ const q=it.qty||1; t.p+=(it.p||0)*q; t.c+=(it.c||0)*q; t.f+=(it.f||0)*q; t.kcal+=(it.kcal||0)*q; t.items++; } t.p=Math.round(t.p);t.c=Math.round(t.c);t.f=Math.round(t.f);t.kcal=Math.round(t.kcal); return t; }
function planTotals(dow){ const p=state.meta.weeklyPlan[dow]||{}; const t={p:0,kcal:0}; for(const s of ['breakfast','lunch','evening','dinner']) for(const it of (p[s]||[])){ t.p+=it.p||0; t.kcal+=it.kcal||0; } return {p:Math.round(t.p),kcal:Math.round(t.kcal)}; }

/* =====================================================================
   REWARD / STREAK ENGINE
   ===================================================================== */
function isLogged(k){ const d=state.days[k]; return d && d.logged.length>=3; }
function isOnTarget(k){ const d=state.days[k]; if(!d||d.logged.length<3) return false; const t=dayTotals(k), s=S(); return t.p>=s.proteinTarget*0.95 && t.kcal>0 && t.kcal<=s.kcalTarget*1.03; }
function dayPoints(k){ const d=state.days[k]; if(!d) return 0; const t=dayTotals(k), s=S(), sc=D.scoring; let p=0;
  if(t.p>=s.proteinTarget*0.95) p+=sc.proteinHit;
  if(t.kcal>0&&t.kcal<=s.kcalTarget*1.03) p+=sc.underCalorie;
  if(t.items>=3) p+=sc.loggedDay;
  if(d.gym&&d.gym.done) p+=sc.workout;
  if((d.water||0)>=s.waterTarget) p+=sc.waterHit;
  if(d.weight!=null) p+=sc.weightLogged;
  if(d.habits) for(const h of D.habits) if(d.habits[h.id]) p+=h.xp;
  return p;
}
// Forgiving "showing up" streak: counts consecutive days you logged anything.
// (Treats/quality use the stricter onTargetSinceRedeem.) Today is pending-friendly.
function currentStreak(){ const hit=k=>{ const d=state.days[k]; return d&&d.logged.length>=1; };
  let i=0; if(!hit(TODAY)) i=1; let s=0; for(;;i++){ const k=addDays(TODAY,-i); if(parseDk(k) < new Date(2024,0,1)) break; if(hit(k)) s++; else break; } return s; }
function onTargetStreak(){ let i=0; if(!isOnTarget(TODAY)) i=1; let s=0; for(;;i++){ const k=addDays(TODAY,-i); if(parseDk(k) < new Date(2024,0,1)) break; if(isOnTarget(k)) s++; else break; } return s; }
function onTargetSinceRedeem(){ const last=state.meta.rewards.lastRedeem; let n=0; for(const k in state.days){ if((!last||k>last)&&isOnTarget(k)) n++; } return n; }
function totalXP(){ let xp=0; for(const k in state.days) xp+=dayPoints(k); return xp; }
function levelFor(xp){ let cur=D.levels[0]; for(const L of D.levels) if(xp>=L.xp) cur=L; const next=D.levels.find(L=>L.xp>xp); return {cur,next}; }

function computeBadgeState(){
  const got={};
  let proteinHits=0,gym=0,distinct=new Set();
  for(const k in state.days){ const d=state.days[k]; if(dayTotals(k).p>=S().proteinTarget*0.95&&d.logged.length>=3) proteinHits++; if(d.gym&&d.gym.done)gym++; }
  // distinct foods last 7d
  for(let i=0;i<7;i++){ const d=state.days[addDays(TODAY,-i)]; if(d) d.logged.forEach(x=>distinct.add((x.name||'').toLowerCase())); }
  const streak=currentStreak();
  const lost=S().startWeight-latestWeight();
  const anyLog=Object.values(state.days).some(d=>d.logged.length>0);
  // perfect week: last 7 days all on target
  let pw=true; for(let i=0;i<7;i++){ if(!isOnTarget(addDays(TODAY,-i))){pw=false;break;} }
  const map={ first_log:anyLog, streak3:streak>=3, streak7:streak>=7, streak14:streak>=14, streak30:streak>=30,
    protein10:proteinHits>=10, gym10:gym>=10, gym25:gym>=25, lost1:lost>=1, lost3:lost>=3, lost5:lost>=5,
    goalweight:latestWeight()<=S().targetWeight, plants30:distinct.size>=30, perfectweek:pw };
  return map;
}
function checkNewBadges(silent){
  const map=computeBadgeState(); const earned=state.meta.rewards.badges; let fresh=[];
  for(const b of D.badges){ if(map[b.id] && !earned[b.id]){ earned[b.id]=TODAY; fresh.push(b); } }
  if(fresh.length){ touchMeta(); if(!silent){ fresh.forEach((b,i)=>setTimeout(()=>{ toast(`Badge unlocked: ${b.name}`, b.icon); confetti(); buzz(40); }, i*900)); } }
  return fresh;
}
function readyTreats(){ const n=onTargetSinceRedeem(); return D.treats.filter(t=>n>=t.need); }
function nextTreat(){ const n=onTargetSinceRedeem(); return D.treats.find(t=>n<t.need); }
function redeemTreat(t){
  state.meta.rewards.redeems.unshift({treatId:t.id,name:t.name,date:TODAY,icon:t.icon});
  state.meta.rewards.lastRedeem=TODAY; touchMeta();
  confetti(true); buzz([30,40,30]); toast(`Enjoy your ${t.name}! 🎉`, t.icon);
  closeModal(); render();
}

/* =====================================================================
   CONFETTI (no lib)
   ===================================================================== */
function confetti(big){
  const c=document.createElement('canvas'); c.className='confetti-c'; document.body.append(c);
  const ctx=c.getContext('2d'); let W=c.width=innerWidth, H=c.height=innerHeight;
  const cols=['#4ade80','#38bdf8','#fbbf24','#f87171','#a78bfa','#f472b6'];
  const N=big?180:90; const P=[];
  for(let i=0;i<N;i++) P.push({x:Math.random()*W,y:-20-Math.random()*H*0.3,r:4+Math.random()*5,
    vx:-2+Math.random()*4,vy:2+Math.random()*4,col:cols[i%cols.length],rot:Math.random()*6,vr:-.2+Math.random()*.4});
  let t0=performance.now();
  (function frame(t){ const dt=Math.min(32,t-t0); t0=t; ctx.clearRect(0,0,W,H);
    let alive=false;
    for(const p of P){ p.x+=p.vx*dt/16; p.y+=p.vy*dt/16; p.vy+=0.05; p.rot+=p.vr;
      if(p.y<H+20){alive=true;} ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.col; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*1.6); ctx.restore(); }
    if(alive && t-perfStart<2600) requestAnimationFrame(frame); else c.remove();
  })(t0);
  var perfStart=t0;
  addEventListener('resize',()=>{W=c.width=innerWidth;H=c.height=innerHeight;},{once:true});
}

/* =====================================================================
   SUPABASE SYNC
   ===================================================================== */
let sb=null,sbCfg=null,sbStatus='local',pushQ=new Set(),pushTimer=null;
function loadSbCfg(){ try{ return JSON.parse(localStorage.getItem(SB_KEY)||'null'); }catch(e){ return null; } }
function setSyncUI(s){ sbStatus=s; const d=$('#syncDot'); if(!d)return; d.className='sync-dot'+(s==='on'?' on':s==='err'?' err':s==='sync'?' sync':''); $('.lbl',d).textContent=s==='on'?'synced':s==='sync'?'syncing…':s==='err'?'error':'local'; }
function initSync(loud){ sbCfg=loadSbCfg(); if(!sbCfg||!sbCfg.url||!sbCfg.key){ setSyncUI('local'); return; }
  if(!window.supabase){ setSyncUI('err'); if(loud)toast('Sync library not loaded — check internet, then reconnect','⚠️'); return; }
  try{ sb=window.supabase.createClient(sbCfg.url,sbCfg.key,{realtime:{params:{eventsPerSecond:3}}}); setSyncUI('sync');
    pullAll().then(()=>{subscribeRealtime();setSyncUI('on');}).catch(e=>{console.error(e);setSyncUI('err');toast('Sync error: '+(e.message||e.code||e),'⚠️');}); }
  catch(e){ console.error(e); setSyncUI('err'); toast('Connect failed: '+(e.message||e),'⚠️'); } }
const uk=()=>S().userKey;
async function pullAll(){ if(!sb)return;
  const {data:meta,error:e1}=await sb.from('app_meta').select('*').eq('user_key',uk()).maybeSingle();
  if(e1&&e1.code!=='PGRST116')throw e1;
  if(meta&&meta.payload&&meta.payload.updatedAt>state.meta.updatedAt) state.meta=migrate({meta:meta.payload,days:state.days}).meta;
  const {data:days,error:e2}=await sb.from('app_days').select('*').eq('user_key',uk()); if(e2)throw e2;
  if(days)for(const r of days){ const k=r.date,l=state.days[k]; if(!l||(r.payload&&r.payload.updatedAt>l.updatedAt)) state.days[k]=r.payload; }
  computeTargets(); saveLocal(); render(); }
function subscribeRealtime(){ if(!sb)return;
  sb.channel('anbu-'+uk())
    .on('postgres_changes',{event:'*',schema:'public',table:'app_meta',filter:'user_key=eq.'+uk()},p=>{ const r=p.new; if(r&&r.payload&&r.payload.updatedAt>state.meta.updatedAt){ state.meta=r.payload; computeTargets(); saveLocal(); render(); toast('Synced from another device','🔄'); } })
    .on('postgres_changes',{event:'*',schema:'public',table:'app_days',filter:'user_key=eq.'+uk()},p=>{ const r=p.new; if(!r)return; const k=r.date,l=state.days[k]; if(!l||(r.payload&&r.payload.updatedAt>l.updatedAt)){ state.days[k]=r.payload; computeTargets(); saveLocal(); if(k===selDate||curTab!=='today')render(); } })
    .subscribe(); }
function schedulePush(w){ if(!sb)return; pushQ.add(w); setSyncUI('sync'); clearTimeout(pushTimer); pushTimer=setTimeout(flushPush,900); }
async function flushPush(){ if(!sb)return; const jobs=[...pushQ]; pushQ.clear();
  try{ for(const j of jobs){ if(j==='meta') await sb.from('app_meta').upsert({user_key:uk(),updated_at:state.meta.updatedAt,payload:state.meta},{onConflict:'user_key'});
    else if(j.startsWith('day:')){ const k=j.slice(4),d=state.days[k]; if(d) await sb.from('app_days').upsert({user_key:uk(),date:k,updated_at:d.updatedAt,payload:d},{onConflict:'user_key,date'}); } }
    setSyncUI('on'); }catch(e){ console.error(e); setSyncUI('err'); toast('Push failed: '+(e.message||e.code||(e&&e.details)||JSON.stringify(e)),'⚠️'); } }
async function fullPushAll(){ if(!sb){ toast('Not connected — Save & connect first','⚠️'); return; } pushQ.add('meta'); Object.keys(state.days).forEach(k=>pushQ.add('day:'+k)); await flushPush(); }

/* =====================================================================
   ROUTER
   ===================================================================== */
function render(){
  // weekly auto-reset of cook checklist
  if(state.meta.cookWeek!==weekKey(TODAY)){ state.meta.cookWeek=weekKey(TODAY); state.meta.cookTasks.forEach(t=>t.done=false); touchMeta(); }
  const v=$('#view'); v.innerHTML='';
  v.append({today:renderToday,week:renderWeek,shop:renderShop,dash:renderDash,more:renderMore}[curTab]());
  $$('#tabbar button').forEach(b=>b.classList.toggle('active',b.dataset.tab===curTab));
  checkNewBadges(false);
  window.scrollTo(0,0);
}

/* =====================================================================
   TAB: TODAY
   ===================================================================== */
function ring(pct,color,label,val,sub){
  const r=52,circ=2*Math.PI*r,off=circ*(1-clamp(pct,0,1));
  return `<div class="ring ${pct>=1?'full':''}"><svg viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="${r}" class="ring-bg"/>
    <circle cx="60" cy="60" r="${r}" stroke="${color}" stroke-dasharray="${circ}" stroke-dashoffset="${off}" class="ring-fg"/>
  </svg><div class="ring-c"><div class="rv">${val}</div><div class="rl">${label}</div>${sub?`<div class="rs">${sub}</div>`:''}</div></div>`;
}
function macroBar(label,val,target,cls){ const pct=Math.min(100,Math.round(val/(target||1)*100)); const over=val>target*1.1;
  return `<div class="macrobar ${cls}"><div class="ml"><span class="mname">${label}</span><span class="mval">${Math.round(val)}<i>/${target}g</i></span></div>
    <div class="mb ${over?'over':''}"><span style="width:${pct}%"></span></div></div>`; }
function macroHero(k,day,t,s){
  const kPct=t.kcal/(s.kcalTarget||1), left=Math.round((s.kcalTarget||0)-t.kcal), over=left<0;
  const r=52,circ=2*Math.PI*r,off=circ*(1-clamp(kPct,0,1));
  const card=el(`<div class="card hero">
    <div class="hero-top">
      <div class="calring ${over?'over':''}"><svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="${r}" class="ring-bg"/>
        <circle cx="60" cy="60" r="${r}" class="ring-fg cal" stroke-dasharray="${circ}" stroke-dashoffset="${off}"/></svg>
        <div class="calring-c"><div class="cm">${Math.abs(left)}</div><div class="cs">${over?'over':'left'}</div></div></div>
      <div class="hero-side">
        <div class="hs-row"><span>Goal</span><b>${s.kcalTarget}</b></div>
        <div class="hs-row"><span>Eaten</span><b>${t.kcal}</b></div>
        <div class="hs-row tot"><span>${over?'Over':'Remaining'}</span><b class="${over?'down':'up'}">${Math.abs(left)} kcal</b></div>
        <div class="hs-mini muted">${t.items} item${t.items===1?'':'s'} today</div>
      </div>
    </div>
    <div class="macrobars">
      ${macroBar('Protein',t.p,s.proteinTarget,'p')}
      ${macroBar('Carbs',t.c,s.carbTarget,'c')}
      ${macroBar('Fat',t.f,s.fatTarget,'f')}
    </div>
    <div class="water-row">
      <div class="wr-label">💧 <b>${(day.water||0).toFixed(2).replace(/\.?0+$/,'')}</b> / ${s.waterTarget} L water</div>
      <div class="wr-btns"><button class="chip-btn" data-water="-0.25">−</button><button class="chip-btn pri" data-water="0.25">+250ml</button><button class="chip-btn" data-water="0.5">+500</button></div>
    </div>
    <div class="water-track"><span style="width:${Math.min(100,(day.water||0)/s.waterTarget*100)}%"></span></div>
  </div>`);
  card.querySelectorAll('[data-water]').forEach(b=>b.onclick=()=>{ day.water=Math.max(0,Math.round(((day.water||0)+ +b.dataset.water)*100)/100); touchDay(k); buzz(10); render(); });
  return card;
}
function dateStrip(){ const wrap=el('<div class="datestrip"></div>');
  for(let i=-4;i<=2;i++){ const k=addDays(TODAY,i),d=parseDk(k),has=state.days[k]&&state.days[k].logged.length,ot=isOnTarget(k);
    const chip=el(`<div class="daychip ${k===TODAY?'today':''} ${k===selDate?'sel':''} ${has?'has':''}">
      <div class="dow">${DOW[d.getDay()]}</div><div class="dom">${d.getDate()}</div><div class="pill ${ot?'ot':''}"></div></div>`);
    chip.onclick=()=>{selDate=k;render();}; wrap.append(chip); }
  return wrap;
}
function greeting(k,day,t,s){
  const anyData=Object.values(state.days).some(d=>d.logged.length);
  if(!anyData) return {html:'👋 Welcome! Log your first meal to light your streak 🔥', cls:'g-warm'};
  const ready=readyTreats(), nt=nextTreat(), n=onTargetSinceRedeem(), streak=currentStreak(), ot=isOnTarget(k);
  const protLeft=Math.max(0,Math.round(s.proteinTarget-t.p)), kcalLeft=Math.max(0,s.kcalTarget-t.kcal);
  if(ready.length) return {html:`🎁 <b>${ready[ready.length-1].name}</b> is ready — tap to redeem!`, cls:'g-treat', act:openRedeem};
  if(streak>0 && !ot){ const bits=[]; if(protLeft) bits.push(`${protLeft}g protein`); return {html:`🔥 <b>${streak}-day streak</b> at risk — ${bits.length?bits.join(', ')+' to finish on target':'log to keep it alive'}`, cls:'g-warn'}; }
  if(nt) return {html:`${nt.icon} <b>${nt.need-n}</b> on-target day${nt.need-n===1?'':'s'} to your <b>${nt.name}</b>`, cls:'g-treat', act:openRedeem};
  const h=new Date().getHours();
  return {html: h<11?'☀️ Good morning — fuel up and log breakfast':h<16?'🍱 Lunch time — log it while it’s fresh':h<21?'🌆 Evening — keep the protein coming':'🌙 Close the day strong — log dinner', cls:'g-warm'};
}
function logPlanned(k,slotKey,items){ const day=getDay(k); const beforeOT=isOnTarget(k);
  let added=0; for(const it of items){ if((it.p||it.kcal)) { day.logged.push({logId:uid(),slot:slotKey,name:it.name,p:it.p||0,c:it.c,f:it.f,kcal:it.kcal||0,qty:1}); added++; } }
  if(!added){ toast('Plan items have no macros — add from search'); return; }
  touchDay(k); buzz(15); toast(`Logged ${added} planned item${added===1?'':'s'}`,'📋');
  if(!beforeOT && isOnTarget(k)){ confetti(); buzz([30,40,30]); }
  render();
}
function renderToday(){
  const k=selDate,day=getDay(k),t=dayTotals(k),s=S();
  const sched=D.daySchedule[planDow(k)]||{type:'',shake:''};
  const frag=document.createDocumentFragment();

  frag.append(el(`<div class="row spread" style="margin-bottom:.3rem">
    <h1>${k===TODAY?'Today':prettyDate(k)} <span class="tag t-${sched.type}">${sched.type||''}</span></h1>
    ${k!==TODAY?'<button class="btn sm ghost" id="jt">↩ Today</button>':''}</div>`));
  frag.append(dateStrip());

  if(k!==TODAY) frag.append(el(`<div class="banner g-past">✏️ Editing ${prettyDate(k)} — not today</div>`));
  else { const gr=greeting(k,day,t,s); const b=el(`<div class="banner ${gr.cls}">${gr.html}</div>`); if(gr.act){ b.style.cursor='pointer'; b.onclick=gr.act; } frag.append(b); }

  /* --- MISSION / reward hero --- */
  frag.append(missionCard(k,day,t,s));

  /* --- macros hero --- */
  frag.append(macroHero(k,day,t,s));

  /* --- meals by slot --- */
  const plan=state.meta.weeklyPlan[planDow(k)]||{};
  const planMap={breakfast:plan.breakfast,lunch:plan.lunch,evening:plan.evening,dinner:plan.dinner};
  const sc=el('<div class="card"></div>');
  sc.append(el(`<div class="row spread"><h2>Meals</h2><span class="small muted">shake: ${esc(sched.shake)}</span></div>`));
  for(const slot of D.slots){
    const items=day.logged.filter(x=>x.slot===slot.key);
    const st2=items.reduce((a,x)=>{a.p+=(x.p||0)*(x.qty||1);a.k+=(x.kcal||0)*(x.qty||1);return a;},{p:0,k:0});
    const pl=planMap[slot.key]; const planTxt= pl&&pl.length? pl.map(i=>i.name).join(', ') : (slot.key==='shake'?(sched.shake.includes('Mass')?'Mass shake':'Lean shake'):'');
    const sEl=el(`<div class="slot"><div class="head">
      <span class="time">${slot.time}</span>
      <div class="grow"><div class="name">${slot.label}</div>${planTxt?`<div class="plan">plan: ${esc(planTxt)}</div>`:''}</div>
      <span class="tot">${st2.p?Math.round(st2.p)+'g · '+Math.round(st2.k):''}</span></div><div class="items"></div></div>`);
    const box=$('.items',sEl);
    for(const it of items){ const li=el(`<div class="logitem"><span class="nm">${esc(it.name)}${it.qty&&it.qty!==1?` <span class="faint">×${it.qty}</span>`:''}</span>
      <span class="mac">${Math.round((it.p||0)*(it.qty||1))}g · ${Math.round((it.kcal||0)*(it.qty||1))}</span><span class="x">⋯</span></div>`);
      $('.x',li).onclick=()=>itemMenu(k,it); box.append(li); }
    if(pl&&pl.length&&items.length===0&&pl.some(i=>i.p||i.kcal)){ const pT=pl.reduce((a,i)=>({p:a.p+(i.p||0),k:a.k+(i.kcal||0)}),{p:0,k:0});
      const ap=el(`<button class="btn sm addbtn plan">✓ Ate the plan · ${Math.round(pT.p)}g · ${Math.round(pT.k)}</button>`); ap.onclick=()=>logPlanned(k,slot.key,pl); box.append(ap); }
    const add=el(`<button class="btn sm addbtn">+ Add to ${slot.label}</button>`); add.onclick=()=>openPicker(k,slot.key); box.append(add);
    sc.append(sEl);
  }
  frag.append(sc);

  /* --- habits --- */
  const hc=el('<div class="card"><h2>Daily habits <span class="small faint">+XP</span></h2><div class="habits"></div></div>');
  const hb=$('.habits',hc);
  for(const h of D.habits){ const on=!!day.habits[h.id];
    const chip=el(`<button class="habit ${on?'on':''}"><span class="hi">${h.icon}</span><span class="hl">${h.label}</span><span class="hx">+${h.xp}</span></button>`);
    chip.onclick=()=>{ const turnOn=!day.habits[h.id]; day.habits[h.id]=turnOn; touchDay(k); buzz(8); if(turnOn)floatXP(h.xp); render(); };
    hb.append(chip); }
  frag.append(hc);

  /* --- activity + body --- */
  const g=day.gym||{}; const defType=sched.type==='Gym'?'Gym':sched.type==='Cricket'?'Cricket':'Rest';
  const gc=el(`<div class="card"><h2>Activity & body</h2>
    <label class="row" style="gap:.6rem;margin-bottom:.6rem"><input type="checkbox" id="gd" ${g.done?'checked':''}><span class="grow">Worked out / active</span><span class="small faint">+${D.scoring.workout} XP</span></label>
    <div id="gdt" class="${g.done?'':'hidden'}">
      <div class="row wrap" style="gap:.5rem;margin-bottom:.6rem">
        <select id="gt" style="flex:1">${['Gym','Cricket','Cardio','Walk','Yoga','Other'].map(o=>`<option ${(g.type||defType)===o?'selected':''}>${o}</option>`).join('')}</select>
        <input id="gm" type="number" inputmode="numeric" placeholder="min" value="${g.minutes??''}" style="width:90px"></div>
      <input id="gn" placeholder="Notes (lifts, PRs, feel)" value="${esc(g.notes||'')}"></div>
    <div class="divider"></div>
    <label class="field"><span>Body weight (kg) — drives your fat-loss chart</span><input id="bw" type="number" inputmode="decimal" step="0.1" placeholder="${latestWeight()}" value="${day.weight??''}"></label>
    <label class="field" style="margin-bottom:0"><span>Day notes</span><textarea id="dn" rows="2" placeholder="energy, sleep, cravings…">${esc(day.notes||'')}</textarea></label></div>`);
  $('#gd',gc).onchange=e=>{g.done=e.target.checked;if(g.done&&!g.type)g.type=defType;day.gym=g;touchDay(k);$('#gdt',gc).classList.toggle('hidden',!g.done);if(g.done){buzz(15);}};
  $('#gt',gc).onchange=e=>{g.type=e.target.value;day.gym=g;touchDay(k);};
  $('#gm',gc).onchange=e=>{g.minutes=e.target.value?+e.target.value:null;day.gym=g;touchDay(k);};
  $('#gn',gc).onchange=e=>{g.notes=e.target.value;day.gym=g;touchDay(k);};
  $('#bw',gc).onchange=e=>{ const wasLost=S().startWeight-latestWeight(); day.weight=e.target.value?+e.target.value:null; touchDay(k); computeTargets(); const nowLost=S().startWeight-latestWeight(); if(nowLost>wasLost+0.05){confetti();toast('Weight logged — trending down!','📉');} render(); };
  $('#dn',gc).onchange=e=>{day.notes=e.target.value;touchDay(k);};
  frag.append(gc);

  const jt=$('#jt',frag); if(jt)jt.onclick=()=>{selDate=TODAY;render();};
  return frag;
}

function missionCard(k,day,t,s){
  const streak=currentStreak(), xp=totalXP(), {cur,next}=levelFor(xp);
  const lvlPct= next? (xp-cur.xp)/(next.xp-cur.xp):1;
  const n=onTargetSinceRedeem(), nt=nextTreat(), ready=readyTreats();
  const pPct=clamp(t.p/s.proteinTarget,0,1), under=t.kcal<=s.kcalTarget&&t.kcal>0, prot=t.p>=s.proteinTarget*0.95;
  // today's mission checklist
  const wins=[
    {ok:prot,txt:`Hit ${s.proteinTarget}g protein`},
    {ok:under,txt:`Stay under ${s.kcalTarget} kcal`},
    {ok:(day.water||0)>=s.waterTarget,txt:`Drink ${s.waterTarget}L water`},
    {ok:day.gym&&day.gym.done,txt:'Move your body'},
    {ok:t.items>=3,txt:'Log all meals'},
  ];
  const done=wins.filter(w=>w.ok).length;
  const card=el(`<div class="card mission">
    <div class="row spread">
      <div class="streak ${streak>0?'lit':''}"><span class="fl">🔥</span><span class="num">${streak}</span><span class="sl">day${streak===1?'':'s'}</span></div>
      <div class="lvl"><div class="lt">Lv ${cur.lvl} · ${cur.title}</div><div class="bar lvl"><span style="width:${Math.round(lvlPct*100)}%"></span></div><div class="lx">${xp} XP${next?` · ${next.xp-xp} to Lv ${next.lvl}`:' · MAX'}</div></div>
    </div>
    <div class="mission-mid">
      <div class="mc-ring">${ring(pPct,'#4ade80','protein',t.p+'g','/'+s.proteinTarget)}</div>
      <div class="treat">
        ${ready.length? `<div class="treat-ready" id="redeemBtn"><div class="ti">${ready[ready.length-1].icon}</div><div><div class="tn">${ready[ready.length-1].name} ready!</div><div class="td">Tap to redeem 🎉</div></div></div>`
        : nt? `<div class="treat-prog"><div class="ti">${nt.icon}</div><div class="grow"><div class="tn">${nt.name}</div><div class="bar treat"><span style="width:${Math.round(n/nt.need*100)}%"></span></div><div class="td">${n}/${nt.need} on-target days — <b>${nt.need-n} to go</b></div></div></div>`
        : `<div class="treat-prog"><div class="ti">🏆</div><div><div class="tn">All treats earned!</div><div class="td">Legendary discipline.</div></div></div>`}
      </div>
    </div>
    <div class="mission-wins">${wins.map(w=>`<span class="win ${w.ok?'ok':''}">${w.ok?'✓':'○'} ${w.txt}</span>`).join('')}
      <div class="mission-bar"><span style="width:${done/wins.length*100}%"></span></div>
      <div class="small ${done===wins.length?'up':'muted'}" style="text-align:center;margin-top:.3rem">${done===wins.length?'Perfect day! 💎':`${done}/${wins.length} wins today`}</div>
    </div>
  </div>`);
  const rb=$('#redeemBtn',card); if(rb) rb.onclick=()=>openRedeem();
  const sk=$('.streak',card); if(sk) sk.onclick=()=>{ curTab='dash'; render(); };
  const lv=$('.lvl',card); if(lv) lv.onclick=()=>{ curTab='dash'; render(); };
  return card;
}
function openRedeem(){
  const n=onTargetSinceRedeem(), ready=readyTreats();
  openModal(`<h2>🎁 Redeem a treat</h2>
    <p class="small muted">You've banked <b>${n} on-target days</b>. Redeeming resets the counter — earn the next one fresh.</p>
    <div id="treatList"></div>`);
  const tl=$('#treatList');
  for(const t of D.treats){ const ok=n>=t.need;
    const row=el(`<div class="treat-row ${ok?'':'lock'}"><div class="ti">${t.icon}</div>
      <div class="grow"><div class="tn">${t.name} <span class="faint small">· needs ${t.need} days</span></div><div class="td small muted">${t.desc}</div></div>
      ${ok?'<button class="btn sm primary rd">Redeem</button>':`<span class="small faint">${t.need-n} to go</span>`}</div>`);
    const b=$('.rd',row); if(b)b.onclick=()=>redeemTreat(t); tl.append(row); }
}

/* item adjust */
function itemMenu(k,it){ const day=getDay(k);
  openModal(`<h2>${esc(it.name)}</h2><div class="small muted" style="margin-bottom:.8rem">${it.p||0}g protein · ${it.kcal||0} kcal each</div>
    <label class="field"><span>Quantity (servings)</span><div class="row"><button class="btn" id="qm">−</button><input id="qv" type="number" step="0.5" value="${it.qty||1}" style="text-align:center"><button class="btn" id="qp">+</button></div></label>
    <div class="row" style="gap:.5rem"><button class="btn danger grow" id="rm">Remove</button><button class="btn primary grow" id="ok">Done</button></div>`);
  const qv=$('#qv'); $('#qm').onclick=()=>qv.value=Math.max(0.5,(+qv.value||1)-0.5); $('#qp').onclick=()=>qv.value=(+qv.value||1)+0.5;
  $('#rm').onclick=()=>{day.logged=day.logged.filter(x=>x!==it);touchDay(k);closeModal();render();};
  $('#ok').onclick=()=>{it.qty=+qv.value||1;touchDay(k);closeModal();render();};
}

/* =====================================================================
   SMART FOOD PICKER  (library + offline DB + online + auto macros)
   ===================================================================== */
const SLOT_CAT={pre:'Snack',shake:'Supplement',breakfast:'Breakfast',midmorning:'Snack',lunch:'Dish',evening:'Snack',dinner:'Dish',bed:'Dairy'};
function searchFoods(q){
  q=q.toLowerCase().trim();
  const out=[],seen=new Set();
  const push=(name,p,c,f,kcal,serv,g)=>{ const key=name.toLowerCase(); if(seen.has(key))return; seen.add(key); out.push({name,p:p||0,c:c==null?null:c,f:f==null?null:f,kcal:kcal||0,serv:serv||'',g:g||null}); };
  for(const it of state.meta.library){ if(!q||it.name.toLowerCase().includes(q)) push(it.name,it.p,it.c,it.f,it.kcal,'',it.g||null); }
  for(const it of FDB){ if(!q||it.n.toLowerCase().includes(q)||it.cat.toLowerCase().includes(q)) push(it.n,it.p,it.c,it.f,it.k,it.serv,it.g); }
  if(q) out.sort((a,b)=>{ const as=a.name.toLowerCase().startsWith(q)?0:1, bs=b.name.toLowerCase().startsWith(q)?0:1; if(as!==bs)return as-bs; return a.name.length-b.name.length; });
  return out;
}
function isFav(name){ return S().favorites.includes(name); }
function toggleFav(name){ const f=S().favorites,i=f.indexOf(name); if(i>=0)f.splice(i,1); else f.unshift(name); touchMeta(); }
function favFoods(){ return S().favorites.map(name=>{ const l=state.meta.library.find(x=>x.name===name); if(l)return {name:l.name,p:l.p,c:l.c,f:l.f,kcal:l.kcal,serv:'',g:l.g||null}; const d=FDB.find(x=>x.n===name); if(d)return {name:d.n,p:d.p,c:d.c,f:d.f,kcal:d.k,serv:d.serv,g:d.g}; return {name,p:0,c:null,f:null,kcal:0,serv:'',g:null}; }); }
let lastPickQuery='';
function recentFoods(limit=8){ const seen=new Set(),out=[]; const keys=Object.keys(state.days).sort().reverse();
  for(const k of keys){ const d=state.days[k]; for(let i=d.logged.length-1;i>=0;i--){ const it=d.logged[i]; const key=(it.name||'').toLowerCase(); if(!key||seen.has(key))continue; seen.add(key); out.push({name:it.name,p:it.p,c:it.c,f:it.f,kcal:it.kcal,serv:''}); if(out.length>=limit)return out; } }
  return out; }
function openPicker(k,slotKey){
  const scanOK='BarcodeDetector'in window;
  openModal(`<div class="picker-search">
      <div class="row spread"><h2>Add food</h2>
        <div class="row" style="gap:.3rem"><button class="btn sm" id="qadd">⚡ Quick</button>${scanOK?'<button class="btn sm" id="scan">📷 Scan</button>':''}<button class="btn sm" id="newFood">+ New</button></div></div>
      <input id="ps" placeholder="Type a food… palak, paneer, banana" autocomplete="off" inputmode="search">
      <div id="chips"></div>
    </div><div id="plist"></div>
    <div class="picker-hint small faint">Tap to log · ⚖ for quantity/grams · ☆ to favourite</div>`);
  const list=$('#plist'),search=$('#ps');
  function quickLog(food){ addLog(k,slotKey,food,1); closeModal(); render(); }
  function strip(arr){ const s=el('<div class="recent-strip"></div>'); arr.forEach(f=>{ const c=el(`<button class="recent-chip">${esc(f.name.split('(')[0].trim())}<i>${f.p}g</i></button>`); c.onclick=()=>quickLog(f); s.append(c); }); return s; }
  function drawChips(){ const box=$('#chips'); box.innerHTML=''; if(search.value)return;
    const favs=favFoods(), rec=recentFoods(8);
    if(favs.length){ box.append(el('<div class="strip-label">★ Favourites</div>')); box.append(strip(favs)); }
    if(rec.length){ box.append(el('<div class="strip-label">Recent</div>')); box.append(strip(rec)); }
  }
  function draw(){ const q=search.value; lastPickQuery=q; const res=searchFoods(q); list.innerHTML=''; drawChips();
    if(!res.length){ list.append(el(`<div class="emptystate">No match for “${esc(q)}”.<br>
      <button class="btn sm" id="qa1">+ Add as custom</button> <button class="btn sm ghost" id="qa2">🌐 Search online</button></div>`));
      const qa1=$('#qa1'); if(qa1)qa1.onclick=()=>customFood(q,nf=>portionSheet(k,slotKey,nf));
      const qa2=$('#qa2'); if(qa2)qa2.onclick=()=>onlineSearch(q,k,slotKey); return; }
    for(const r of res.slice(0,60)){ const fav=isFav(r.name);
      const row=el(`<div class="pickitem"><div class="grow tap"><div class="nm">${esc(r.name)}</div><div class="small faint">${r.serv?esc(r.serv)+' · ':''}${r.kcal} kcal</div></div>
        <span class="mac">${r.p}g</span><button class="favbtn ${fav?'on':''}">${fav?'★':'☆'}</button><button class="qbtn">⚖</button></div>`);
      $('.tap',row).onclick=()=>quickLog(r);
      $('.favbtn',row).onclick=e=>{ e.stopPropagation(); toggleFav(r.name); draw(); };
      $('.qbtn',row).onclick=e=>{ e.stopPropagation(); portionSheet(k,slotKey,r); };
      list.append(row); }
  }
  search.value=lastPickQuery; search.oninput=draw;
  $('#newFood').onclick=()=>customFood(search.value,nf=>portionSheet(k,slotKey,nf));
  $('#qadd').onclick=()=>quickAdd(k,slotKey);
  const sc=$('#scan'); if(sc)sc.onclick=()=>barcodeScan(k,slotKey);
  draw(); setTimeout(()=>search.focus(),50);
}
function quickAdd(k,slotKey){
  openModal(`<h2>⚡ Quick add</h2><p class="small muted">No lookup — just the numbers (great for eating out).</p>
    <label class="field"><span>Name (optional)</span><input id="qa-n" placeholder="Quick add"></label>
    <div class="row" style="gap:.5rem"><label class="field grow"><span>Calories</span><input id="qa-k" type="number" inputmode="numeric"></label><label class="field grow"><span>Protein g</span><input id="qa-p" type="number" inputmode="decimal"></label></div>
    <div class="row"><button class="btn grow" id="qa-x">Back</button><button class="btn primary grow" id="qa-ok">Add</button></div>`);
  $('#qa-x').onclick=()=>openPicker(k,slotKey);
  $('#qa-ok').onclick=()=>{ const kcal=+$('#qa-k').value||0,p=+$('#qa-p').value||0; if(!kcal&&!p){toast('Enter calories or protein');return;} addLog(k,slotKey,{name:$('#qa-n').value.trim()||'Quick add',p,c:null,f:null,kcal},1); closeModal(); render(); };
  setTimeout(()=>$('#qa-k').focus(),50);
}
async function barcodeScan(k,slotKey){
  if(!('BarcodeDetector'in window)){ toast('Scanning not supported here'); return; }
  openModal(`<h2>📷 Scan barcode</h2><p class="small muted" id="scanmsg">Point the rear camera at a barcode…</p>
    <video id="cam" playsinline muted style="width:100%;border-radius:14px;background:#000;aspect-ratio:4/3;object-fit:cover"></video>
    <button class="btn ghost" id="scanx" style="margin-top:.6rem;width:100%">Cancel</button>`);
  const video=$('#cam'); let stream=null,stop=false;
  const det=new window.BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128']});
  $('#scanx').onclick=()=>{ stop=true; if(stream)stream.getTracks().forEach(t=>t.stop()); openPicker(k,slotKey); };
  try{ stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}); video.srcObject=stream; await video.play(); }
  catch(e){ const sm=$('#scanmsg'); if(sm)sm.textContent='Camera blocked — allow it or use search.'; return; }
  (async function tick(){ if(stop)return; try{ const codes=await det.detect(video); if(codes&&codes.length){ stop=true; if(stream)stream.getTracks().forEach(t=>t.stop()); buzz(30); lookupBarcode(codes[0].rawValue,k,slotKey); return; } }catch(e){} requestAnimationFrame(tick); })();
}
async function lookupBarcode(code,k,slotKey){
  openModal(`<h2>🔎 Looking up…</h2><p class="small muted">Barcode ${esc(code)}</p>`);
  try{ const r=await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments`); const j=await r.json();
    if(j.status!==1||!j.product||!j.product.nutriments){ openModal(`<h2>Not found</h2><p class="small muted">No data for ${esc(code)}.</p><button class="btn primary" id="m" style="width:100%">Add manually</button>`); $('#m').onclick=()=>customFood('',nf=>portionSheet(k,slotKey,nf)); return; }
    const N=j.product.nutriments, name=((j.product.product_name||'Product')+(j.product.brands?' · '+j.product.brands.split(',')[0]:'')).slice(0,60);
    portionSheet(k,slotKey,{name,p:Math.round((N.proteins_100g||0)*10)/10,c:Math.round((N.carbohydrates_100g||0)*10)/10,f:Math.round((N.fat_100g||0)*10)/10,kcal:Math.round(N['energy-kcal_100g']||0),serv:'100 g',g:100});
  }catch(e){ toast('Lookup failed (offline?)'); openPicker(k,slotKey); }
}
function portionSheet(k,slotKey,food){
  const hasG=!!food.g; let mode='serv';
  openModal(`<h2>${esc(food.name)}</h2>${food.serv?`<div class="small muted">per ${esc(food.serv)}${hasG?` · ${food.g}g`:''}</div>`:''}
    ${hasG?`<div class="seg" style="margin:.7rem 0"><button data-m="serv" class="active">Servings</button><button data-m="gram">Grams</button></div>`:''}
    <label class="field" style="margin-top:.4rem"><span id="qlabel">Quantity (servings)</span>
      <div class="row"><button class="btn" id="qm">−</button><input id="qv" type="number" step="0.5" value="1" style="text-align:center;font-size:1.15rem"><button class="btn" id="qp">+</button></div></label>
    <div class="row wrap" style="gap:.4rem;margin-bottom:.8rem" id="presets"></div>
    <div class="card tight prevbox" id="prev"></div>
    <div class="row" style="gap:.5rem;margin:.7rem 0"><button class="btn grow" id="favb">${isFav(food.name)?'★ Favourited':'☆ Favourite'}</button>
      <label class="row" style="gap:.4rem;flex:1;justify-content:center"><input type="checkbox" id="save"><span class="small">Save to library</span></label></div>
    <div class="row"><button class="btn grow" id="cancel">Back</button><button class="btn primary grow" id="add">Add</button></div>`);
  const qv=$('#qv');
  function mk(){ const v=+qv.value||0; if(mode==='gram'&&hasG){ const r=v/food.g; return {p:food.p*r,c:food.c==null?null:food.c*r,f:food.f==null?null:food.f*r,kcal:food.kcal*r}; } return {p:food.p*v,c:food.c==null?null:food.c*v,f:food.f==null?null:food.f*v,kcal:food.kcal*v}; }
  function upd(){ const m=mk(); $('#prev').innerHTML=`<div class="row spread"><b style="color:var(--protein)">${Math.round(m.p)}g protein</b><span><b>${Math.round(m.kcal)}</b> kcal</span></div><div class="small muted">${m.c!=null?Math.round(m.c)+'g carb · ':''}${m.f!=null?Math.round(m.f)+'g fat':''}</div>`; }
  function presets(){ const arr=mode==='gram'?[50,100,150,200,250]:[0.5,1,1.5,2,3]; const box=$('#presets'); box.innerHTML=arr.map(x=>`<button class="btn sm qset" data-q="${x}">${x}${mode==='gram'?'g':''}</button>`).join(''); $$('.qset',box).forEach(b=>b.onclick=()=>{qv.value=b.dataset.q;upd();}); }
  $('#qm').onclick=()=>{const st=mode==='gram'?10:0.5;qv.value=Math.max(st,(+qv.value||0)-st);upd();};
  $('#qp').onclick=()=>{const st=mode==='gram'?10:0.5;qv.value=(+qv.value||0)+st;upd();};
  qv.oninput=upd;
  $$('[data-m]').forEach(b=>b.onclick=()=>{ mode=b.dataset.m; $$('[data-m]').forEach(x=>x.classList.toggle('active',x===b)); $('#qlabel').textContent=mode==='gram'?'Amount (grams)':'Quantity (servings)'; qv.step=mode==='gram'?'10':'0.5'; qv.value=mode==='gram'?food.g:1; presets(); upd(); });
  $('#favb').onclick=()=>{ toggleFav(food.name); $('#favb').textContent=isFav(food.name)?'★ Favourited':'☆ Favourite'; };
  $('#cancel').onclick=()=>openPicker(k,slotKey);
  $('#add').onclick=()=>{ const m=mk(); const v=+qv.value||0; const name=(mode==='gram'&&hasG)?`${food.name} (${Math.round(v)}g)`:food.name;
    if($('#save').checked && !state.meta.library.some(x=>x.name===food.name)){ state.meta.library.push({id:uid(),cat:'snack',name:food.name,p:food.p,c:food.c,f:food.f,kcal:food.kcal,g:food.g||null}); touchMeta(); }
    addLog(k,slotKey,{name,p:m.p,c:m.c,f:m.f,kcal:m.kcal},1); closeModal(); render(); };
  presets(); upd();
}
function addLog(k,slotKey,food,q){ const day=getDay(k), s=S();
  const beforeP=dayTotals(k).p, beforeOT=isOnTarget(k);
  const entry={logId:uid(),slot:slotKey,name:food.name,p:food.p||0,c:food.c,f:food.f,kcal:food.kcal||0,qty:q||1};
  day.logged.push(entry); touchDay(k); buzz(10);
  const afterP=dayTotals(k).p, afterOT=isOnTarget(k);
  toastAction('Logged '+food.name.split('(')[0].trim(),'✅','Undo',()=>{ const d=getDay(k); d.logged=d.logged.filter(x=>x!==entry); touchDay(k); render(); });
  if(beforeP<s.proteinTarget*0.95 && afterP>=s.proteinTarget*0.95){ confetti(); floatXP(D.scoring.proteinHit); buzz([20,30,20]); setTimeout(()=>toast('Protein goal smashed! 💪','🎯'),350); }
  if(!beforeOT && afterOT){ confetti(); buzz([30,40,30]); const left=nextTreat()?Math.max(0,nextTreat().need-onTargetSinceRedeem()):0; const nt=nextTreat();
    setTimeout(()=>toast(nt?`On-target day banked! ${left} more to ${nt.name} ${nt.icon}`:'On-target day banked — all treats earned! 🏆','🎯'),650); }
}
function customFood(name,cb){
  openModal(`<h2>Custom food</h2>
    <label class="field"><span>Name</span><input id="c-name" value="${esc(name)}"></label>
    <div class="row" style="gap:.5rem"><label class="field grow"><span>Protein g</span><input id="c-p" type="number" inputmode="decimal"></label><label class="field grow"><span>Calories</span><input id="c-k" type="number" inputmode="numeric"></label></div>
    <div class="row" style="gap:.5rem"><label class="field grow"><span>Carb g (opt)</span><input id="c-c" type="number" inputmode="decimal"></label><label class="field grow"><span>Fat g (opt)</span><input id="c-f" type="number" inputmode="decimal"></label></div>
    <p class="small faint">Tip: leave calories blank to auto-estimate from macros (4·P + 4·C + 9·F).</p>
    <div class="row"><button class="btn grow" id="c-x">Cancel</button><button class="btn primary grow" id="c-ok">Next</button></div>`);
  $('#c-x').onclick=closeModal;
  $('#c-ok').onclick=()=>{ const p=+$('#c-p').value||0,c=$('#c-c').value?+$('#c-c').value:null,f=$('#c-f').value?+$('#c-f').value:null;
    let kcal=+$('#c-k').value; if(!kcal) kcal=Math.round(p*4+(c||0)*4+(f||0)*9);
    const nf={name:$('#c-name').value.trim()||'Custom food',p,c,f,kcal,serv:''}; cb&&cb(nf); };
  setTimeout(()=>$('#c-name').focus(),50);
}
async function onlineSearch(q,k,slotKey){
  if(!q||q.trim().length<2){ toast('Type a food name first'); return; }
  openModal(`<h2>🌐 Online results</h2><div class="small muted">“${esc(q)}” · Open Food Facts (per 100g)</div><div id="ol" style="margin-top:.6rem"><div class="emptystate">Searching…</div></div><button class="btn ghost" id="back" style="margin-top:.5rem">← Back to offline search</button>`);
  $('#back').onclick=()=>openPicker(k,slotKey);
  try{
    const url=`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,serving_size`;
    const r=await fetch(url); const j=await r.json();
    const box=$('#ol'); box.innerHTML='';
    const items=(j.products||[]).filter(p=>p.product_name&&p.nutriments&&p.nutriments['energy-kcal_100g']);
    if(!items.length){ box.append(el('<div class="emptystate">No packaged matches. Try the offline search or add a custom food.</div>')); return; }
    for(const p of items.slice(0,20)){ const N=p.nutriments; const name=(p.product_name+(p.brands?' · '+p.brands.split(',')[0]:'')).slice(0,60);
      const food={name,p:Math.round((N.proteins_100g||0)*10)/10,c:Math.round((N.carbohydrates_100g||0)*10)/10,f:Math.round((N.fat_100g||0)*10)/10,kcal:Math.round(N['energy-kcal_100g']||0),serv:'100 g'};
      const row=el(`<div class="pickitem"><div class="grow"><div class="nm">${esc(food.name)}</div><div class="small faint">per 100g</div></div><span class="mac">${food.p}g · ${food.kcal}</span></div>`);
      row.onclick=()=>portionSheet(k,slotKey,food); box.append(row); }
  }catch(e){ $('#ol').innerHTML='<div class="emptystate">Couldn’t reach the food database (offline?). Use offline search or add custom.</div>'; }
}

/* =====================================================================
   TAB: WEEK  (interactive planner + checklist)
   ===================================================================== */
function renderWeek(){
  const frag=document.createDocumentFragment();
  frag.append(el(`<div class="row spread"><h1>Weekly plan</h1><button class="btn sm accent" id="share">📤 Share</button></div>`));
  const proj=goalProjection();
  frag.append(el(`<div class="card tight small"><b>🎯 ${proj.done?'At goal weight!':'Fat-loss goal'}</b> · ${S().proteinTarget}g protein · ${S().kcalTarget} kcal /day${proj.done?'':` · ${proj.togo}kg to ${S().targetWeight}kg (~${proj.eta})`}<br><span class="muted">Today's row is highlighted. Tap a meal to edit, tap ✓ when cooked.</span></div>`));

  const today=planDow(TODAY);
  const grid=el('<div class="weekgrid"></div>');
  for(const dow of D.days){ const sched=D.daySchedule[dow],plan=state.meta.weeklyPlan[dow],pt=planTotals(dow);
    const wd=el(`<div class="wday ${dow===today?'today':''}"><div class="wh"><span class="d">${dow}</span><span class="t t-${sched.type}">${sched.type}</span>
      <span class="small muted">${pt.p?pt.p+'g · '+pt.kcal+'kcal':''}</span>
      <span class="small faint" style="margin-left:auto">⋯</span></div><div class="wmeals2"></div></div>`);
    $('.wh .small.faint',wd).onclick=()=>dayMenu(dow);
    const mw=$('.wmeals2',wd);
    [['breakfast','🌅'],['lunch','☀️'],['evening','🌆'],['dinner','🌙']].forEach(([key,ic])=>{
      const items=plan[key]||[]; const cooked=plan.cooked&&plan.cooked[key];
      const seg=el(`<div class="mseg"><div class="msl">${ic} <span class="faint">${key}</span>
        <span class="ck ${cooked?'on':''}" title="Cooked">✓</span></div><div class="mchips"></div></div>`);
      $('.ck',seg).onclick=()=>{ plan.cooked=plan.cooked||{}; plan.cooked[key]=!plan.cooked[key]; touchMeta(); render(); };
      const cw=$('.mchips',seg);
      items.forEach(it=>{ const chip=el(`<span class="mchip">${esc(it.name)}${it.p?` <i>${it.p}g</i>`:''}<span class="rm">×</span></span>`);
        $('.rm',chip).onclick=()=>{ plan[key]=items.filter(x=>x!==it); touchMeta(); render(); }; cw.append(chip); });
      const add=el(`<button class="mchip add">+ add</button>`); add.onclick=()=>planPicker(dow,key); cw.append(add);
      mw.append(seg);
    });
    grid.append(wd);
  }
  frag.append(grid);

  // cook checklist
  const cc=el(`<div class="card"><div class="row spread"><h2>🧑‍🍳 Batch-prep checklist</h2><span class="small faint">resets weekly</span></div><div id="cooklist"></div>
    <div class="row" style="gap:.5rem;margin-top:.6rem"><input id="newTask" placeholder="Add prep task…" class="grow"><button class="btn primary" id="addTask">Add</button></div></div>`);
  const cl=$('#cooklist',cc); const tasks=state.meta.cookTasks; const doneN=tasks.filter(t=>t.done).length;
  cc.querySelector('h2').insertAdjacentHTML('beforeend',` <span class="small faint">${doneN}/${tasks.length}</span>`);
  for(const tk of tasks){ const row=el(`<label class="chk ${tk.done?'done':''}"><input type="checkbox" ${tk.done?'checked':''}><span>${esc(tk.label)}</span><span class="rm faint">✕</span></label>`);
    $('input',row).onchange=e=>{ tk.done=e.target.checked; touchMeta(); buzz(8); render(); };
    $('.rm',row).onclick=()=>{ state.meta.cookTasks=tasks.filter(x=>x!==tk); touchMeta(); render(); }; cl.append(row); }
  $('#addTask',cc).onclick=()=>{ const v=$('#newTask',cc).value.trim(); if(!v)return; tasks.push({id:uid(),label:v,done:false}); touchMeta(); render(); };
  $('#newTask',cc).addEventListener('keydown',e=>{if(e.key==='Enter')$('#addTask',cc).click();});
  frag.append(cc);

  $('#share',frag).onclick=shareWithCook;
  return frag;
}
function planPicker(dow,key){
  openModal(`<div class="picker-search"><h2>Plan: ${dow} ${key}</h2><input id="ps" placeholder="Search foods to add…"></div><div id="plist"></div>`);
  const list=$('#plist'),search=$('#ps');
  function draw(){ const res=searchFoods(search.value); list.innerHTML='';
    if(!res.length){ list.append(el(`<div class="emptystate"><button class="btn sm" id="qa">+ Add “${esc(search.value)}” as text</button></div>`)); const qa=$('#qa'); if(qa)qa.onclick=()=>{ addPlan(dow,key,{name:search.value.trim()||'item'}); closeModal(); render(); }; return; }
    for(const r of res.slice(0,50)){ const row=el(`<div class="pickitem"><div class="grow"><div class="nm">${esc(r.name)}</div>${r.serv?`<div class="small faint">${esc(r.serv)}</div>`:''}</div><span class="mac">${r.p}g · ${r.kcal}</span></div>`);
      row.onclick=()=>{ addPlan(dow,key,r); toast('Added to plan','📅'); closeModal(); render(); }; list.append(row); } }
  search.oninput=draw; draw(); setTimeout(()=>search.focus(),50);
}
function addPlan(dow,key,r){ const plan=state.meta.weeklyPlan[dow]; plan[key]=plan[key]||[]; plan[key].push({name:r.name,p:r.p||0,c:r.c,f:r.f,kcal:r.kcal||0}); touchMeta(); }
function dayMenu(dow){
  openModal(`<h2>${dow} options</h2>
    <button class="btn grow" id="copyTo" style="margin-bottom:.5rem">Copy this day's plan to…</button>
    <button class="btn grow danger" id="clearDay" style="margin-bottom:.5rem">Clear all meals</button>
    <button class="btn ghost grow" id="cl">Close</button>`);
  $('#cl').onclick=closeModal;
  $('#clearDay').onclick=()=>{ const p=state.meta.weeklyPlan[dow]; ['breakfast','lunch','evening','dinner'].forEach(s=>p[s]=[]); p.cooked={}; touchMeta(); closeModal(); render(); };
  $('#copyTo').onclick=()=>{ openModal(`<h2>Copy ${dow} → </h2>`+D.days.filter(d=>d!==dow).map(d=>`<button class="btn grow cp" data-d="${d}" style="margin-bottom:.4rem">${d}</button>`).join('')+'<button class="btn ghost grow" id="cl">Cancel</button>');
    $('#cl').onclick=closeModal; $$('.cp').forEach(b=>b.onclick=()=>{ state.meta.weeklyPlan[b.dataset.d]=clone(state.meta.weeklyPlan[dow]); touchMeta(); closeModal(); toast('Copied to '+b.dataset.d,'📋'); render(); }); };
}
function shareWithCook(){
  const L=['*Anbu — Weekly Meal Plan*',''];
  for(const dow of D.days){ const s=D.daySchedule[dow],p=state.meta.weeklyPlan[dow];
    L.push(`*${dow}* (${s.type})`);
    [['Breakfast','breakfast'],['Lunch','lunch'],['Evening','evening'],['Dinner','dinner']].forEach(([lbl,key])=>{ const items=(p[key]||[]).map(i=>i.name).join(', ')||'—'; L.push(`• ${lbl}: ${items}`); });
    L.push(''); }
  L.push('*Batch-prep:*'); state.meta.cookTasks.forEach(t=>L.push('• '+t.label));
  const text=L.join('\n');
  if(navigator.share) navigator.share({title:'Anbu Meal Plan',text}).catch(()=>{}); else navigator.clipboard.writeText(text).then(()=>toast('Plan copied — paste to WhatsApp','📋'));
}

/* =====================================================================
   TAB: SHOPPING
   ===================================================================== */
function renderShop(){
  const frag=document.createDocumentFragment(); const list=state.meta.shopping; const doneN=list.filter(s=>s.done).length;
  frag.append(el(`<div class="row spread"><h1>Shopping</h1><button class="btn sm accent" id="share">📤 Share</button></div>`));
  frag.append(el(`<div class="card tight"><div class="bar" style="height:6px"><span style="width:${list.length?doneN/list.length*100:0}%;background:var(--accent)"></span></div><div class="small muted" style="margin-top:.3rem">${doneN}/${list.length} done</div></div>`));
  const addCard=el(`<div class="card tight"><div class="row" style="gap:.4rem"><input id="ni" placeholder="Add item…" class="grow"><input id="nq" placeholder="qty" style="width:70px"><button class="btn primary" id="ai">Add</button></div></div>`);
  $('#ai',addCard).onclick=()=>{ const v=$('#ni',addCard).value.trim(); if(!v)return; list.unshift({id:uid(),item:v,cat:'Other',qty:$('#nq',addCard).value.trim(),star:false,done:false}); touchMeta(); render(); };
  $('#ni',addCard).addEventListener('keydown',e=>{if(e.key==='Enter')$('#ai',addCard).click();});
  frag.append(addCard);

  const cats=[...new Set(list.map(s=>s.cat))];
  const card=el('<div class="card"></div>');
  for(const c of cats){ card.append(el(`<div class="shopcat"><h3>${esc(c)}</h3></div>`)); const cw=card.lastElementChild;
    for(const s of list.filter(x=>x.cat===c)){ const row=el(`<div class="shopitem ${s.done?'done':''}"><input type="checkbox" ${s.done?'checked':''}>
      <span class="nm">${esc(s.item)}${s.qty?` <span class="faint">· ${esc(s.qty)}</span>`:''}</span>
      <span class="star ${s.star?'on':''}">★</span><span class="x faint">✕</span></div>`);
      $('input',row).onchange=e=>{ s.done=e.target.checked; touchMeta(); buzz(8); row.classList.toggle('done',e.target.checked); };
      $('.star',row).onclick=()=>{ s.star=!s.star; touchMeta(); render(); };
      $('.x',row).onclick=()=>{ state.meta.shopping=list.filter(x=>x!==s); touchMeta(); render(); }; cw.append(row); } }
  frag.append(card);

  frag.append(el(`<div class="row wrap" style="gap:.5rem"><button class="btn ghost grow" id="bp">🍱 Build from this week</button><button class="btn ghost grow" id="cd">Clear checked</button><button class="btn ghost grow" id="rs">Reset list</button></div>`));
  $('#bp',frag).onclick=()=>{ const names=new Set(); for(const dow of D.days){ const p=state.meta.weeklyPlan[dow]; ['breakfast','lunch','evening','dinner'].forEach(k=>(p[k]||[]).forEach(it=>names.add(it.name.split('(')[0].trim()))); }
    let added=0; names.forEach(n=>{ if(!list.some(s=>s.item.toLowerCase()===n.toLowerCase())){ list.push({id:uid(),item:n,cat:'From plan',qty:'',star:false,done:false}); added++; } }); touchMeta(); toast(added+' items added from plan','🍱'); render(); };
  $('#cd',frag).onclick=()=>{ state.meta.shopping=list.filter(s=>!s.done); touchMeta(); render(); };
  $('#rs',frag).onclick=()=>{ if(confirm('Reset to default weekly list?')){ state.meta.shopping=D.shoppingDefaults.map(s=>({id:uid(),item:s.item,cat:s.cat,qty:'',star:false,done:false})); touchMeta(); render(); } };
  $('#share',frag).onclick=()=>{ const txt='*Shopping list*\n'+cats.map(c=>`\n*${c}*\n`+list.filter(s=>s.cat===c&&!s.done).map(s=>'• '+s.item+(s.qty?' — '+s.qty:'')).join('\n')).join('\n'); if(navigator.share)navigator.share({title:'Shopping list',text:txt}).catch(()=>{}); else navigator.clipboard.writeText(txt).then(()=>toast('Copied','📋')); };
  return frag;
}

/* =====================================================================
   TAB: STATS (dashboard + rewards + badges)
   ===================================================================== */
let dashRange=30,charts=[];
function renderDash(){
  charts.forEach(c=>{try{c.destroy();}catch(e){}}); charts=[];
  const frag=document.createDocumentFragment(); const s=S();
  frag.append(el('<h1>Progress & rewards</h1>'));

  // rewards strip
  const xp=totalXP(),{cur,next}=levelFor(xp),streak=currentStreak(),n=onTargetSinceRedeem(),nt=nextTreat();
  const rw=el(`<div class="card mission2">
    <div class="row spread"><div><div class="big">Lv ${cur.lvl}</div><div class="small muted">${cur.title}</div></div>
      <div class="streak lit" style="cursor:default"><span class="fl">🔥</span><span class="num">${streak}</span><span class="sl">streak</span></div>
      <div><div class="big">${xp}</div><div class="small muted">XP</div></div></div>
    <div class="bar lvl" style="margin-top:.6rem"><span style="width:${next?Math.round((xp-cur.xp)/(next.xp-cur.xp)*100):100}%"></span></div>
    ${nt?`<div class="small muted" style="margin-top:.4rem">Next treat <b>${nt.icon} ${nt.name}</b>: ${n}/${nt.need} on-target days</div>`:'<div class="small up" style="margin-top:.4rem">All treats unlocked 🏆</div>'}
    ${readyTreats().length?'<button class="btn primary" id="redeem" style="margin-top:.6rem;width:100%">🎁 Redeem a treat</button>':''}
  </div>`);
  const rb=$('#redeem',rw); if(rb)rb.onclick=openRedeem;
  frag.append(rw);

  const seg=el(`<div class="seg" style="margin-bottom:1rem">${[7,30,90].map(r=>`<button data-r="${r}" class="${r===dashRange?'active':''}">${r}d</button>`).join('')}</div>`);
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{dashRange=+b.dataset.r;render();});
  frag.append(seg);

  const keys=[]; for(let i=dashRange-1;i>=0;i--)keys.push(addDays(TODAY,-i));
  const logged=keys.filter(k=>isLogged(k));
  const proteins=keys.map(k=>dayTotals(k).p),kcals=keys.map(k=>dayTotals(k).kcal),weights=keys.map(k=>state.days[k]?state.days[k].weight:null);
  const gymN=keys.filter(k=>state.days[k]&&state.days[k].gym&&state.days[k].gym.done).length;
  const lp=proteins.filter((p,i)=>logged.includes(keys[i])); const avgP=lp.length?Math.round(lp.reduce((a,b)=>a+b,0)/lp.length):0;
  const lk=kcals.filter((p,i)=>logged.includes(keys[i])); const avgK=lk.length?Math.round(lk.reduce((a,b)=>a+b,0)/lk.length):0;
  const hit=lp.filter(p=>p>=s.proteinTarget*0.95).length, hitPct=lp.length?Math.round(hit/lp.length*100):0;
  const wVals=weights.map((w,i)=>({w,k:keys[i]})).filter(x=>x.w!=null);
  const proj=goalProjection(), lost=Math.round((s.startWeight-latestWeight())*10)/10;

  frag.append(el(`<div class="kpis">
    <div class="kpi"><div class="v">${lost>0?'−':''}${Math.abs(lost)}<small class="muted"> kg</small></div><div class="l">Lost so far</div><div class="d ${lost>0?'up':'muted'}">${proj.done?'goal reached!':proj.togo+'kg to go'}</div></div>
    <div class="kpi"><div class="v">${latestWeight()}<small class="muted"> kg</small></div><div class="l">Current weight</div><div class="d muted">→ ${s.targetWeight}kg by ${proj.eta||'—'}</div></div>
    <div class="kpi"><div class="v">${avgP}<small class="muted"> g</small></div><div class="l">Avg protein</div><div class="d ${avgP>=s.proteinTarget?'up':'down'}">target ${s.proteinTarget}</div></div>
    <div class="kpi"><div class="v">${avgK}</div><div class="l">Avg calories</div><div class="d muted">target ${s.kcalTarget}</div></div>
    <div class="kpi"><div class="v">${hitPct}%</div><div class="l">Protein hit rate</div><div class="d muted">${hit}/${lp.length} days</div></div>
    <div class="kpi"><div class="v">${gymN}</div><div class="l">Workouts</div><div class="d muted">${dashRange}d</div></div>
  </div>`));

  // weekly insights
  (function(){ const thisW=[],lastW=[]; for(let i=0;i<7;i++)thisW.push(addDays(TODAY,-i)); for(let i=7;i<14;i++)lastW.push(addDays(TODAY,-i));
    const avg=(ks,fn)=>{ const v=ks.filter(isLogged).map(fn); return v.length?v.reduce((a,b)=>a+b,0)/v.length:0; };
    const pThis=avg(thisW,k=>dayTotals(k).p), pLast=avg(lastW,k=>dayTotals(k).p), dP=pLast?Math.round(pThis-pLast):0;
    const otThis=thisW.filter(isOnTarget).length, woThis=thisW.filter(k=>state.days[k]&&state.days[k].gym&&state.days[k].gym.done).length;
    const wThis=thisW.map(k=>state.days[k]&&state.days[k].weight).filter(x=>x!=null), wLast=lastW.map(k=>state.days[k]&&state.days[k].weight).filter(x=>x!=null);
    const wChange=(wThis.length&&wLast.length)?Math.round((wThis[0]-wLast[wLast.length-1])*10)/10:null;
    frag.append(el(`<div class="card insights"><h3 style="color:var(--text)">📈 This week</h3><div class="ins-grid">
      <div class="ins"><div class="iv">${Math.round(pThis)}g</div><div class="il">avg protein</div>${pLast?`<div class="id ${dP>=0?'up':'down'}">${dP>=0?'▲':'▼'} ${Math.abs(dP)}g vs last</div>`:''}</div>
      <div class="ins"><div class="iv">${otThis}<small>/7</small></div><div class="il">on-target days</div></div>
      <div class="ins"><div class="iv">${woThis}</div><div class="il">workouts</div></div>
      <div class="ins"><div class="iv">${wChange==null?'—':(wChange<=0?'':'+')+wChange+'kg'}</div><div class="il">weight Δ</div></div>
    </div></div>`));
  })();

  if(logged.length){
    const labels=keys.map(k=>parseDk(k).toLocaleDateString(undefined,{day:'numeric',month:'short'}));
    frag.append(chartCard('Body weight vs goal (kg)',c=>mkWeight(c,keys,weights,s.targetWeight),wVals.length>=2));
    frag.append(chartCard('Protein per day (g)',c=>mkBar(c,labels,proteins,'#4ade80',s.proteinTarget)));
    frag.append(chartCard('Calories per day (deficit = below line)',c=>mkBar(c,labels,kcals,'#38bdf8',s.kcalTarget,true)));
  } else frag.append(el('<div class="card emptystate">Log meals & weight to grow your charts.</div>'));

  // badges
  const map=computeBadgeState(); const bc=el('<div class="card"><h2>🏅 Badges</h2><div class="badges"></div></div>');
  const bw=$('.badges',bc);
  for(const b of D.badges){ const got=!!state.meta.rewards.badges[b.id]||map[b.id];
    bw.append(el(`<div class="badge ${got?'got':''}" title="${esc(b.desc)}"><div class="bi">${b.icon}</div><div class="bn">${b.name}</div></div>`)); }
  frag.append(bc);

  // redeem history
  if(state.meta.rewards.redeems.length){ const rh=el('<div class="card"><h3 style="color:var(--text)">🎁 Treats redeemed</h3></div>');
    state.meta.rewards.redeems.slice(0,10).forEach(r=>rh.append(el(`<div class="row spread small" style="padding:.3rem 0;border-bottom:1px solid var(--line)"><span>${r.icon} ${esc(r.name)}</span><span class="faint">${prettyDate(r.date)}</span></div>`)));
    frag.append(rh); }
  return frag;
}
function chartCard(title,builder,ok=true){ const card=el(`<div class="card"><h3 style="color:var(--text)">${title}</h3>${ok?'<div class="chart-wrap"><canvas></canvas></div>':'<div class="small muted">Log on 2+ days to see this.</div>'}</div>`);
  if(ok) setTimeout(()=>{const ch=builder($('canvas',card));if(ch)charts.push(ch);},0); return card; }
const CH=(extra={})=>Object.assign({responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
  scales:{x:{grid:{display:false},ticks:{color:'#9aa6b6',maxRotation:0,autoSkip:true,maxTicksLimit:7,font:{size:10}}},y:{grid:{color:'#2a313d'},ticks:{color:'#9aa6b6',font:{size:10}},beginAtZero:true}}},extra);
function mkBar(canvas,labels,data,color,target,deficit){ return new Chart(canvas,{type:'bar',
  data:{labels,datasets:[{data,backgroundColor:data.map(v=> deficit? (v>0&&v<=target?color:'#f8717188') : (v>=target*0.95?color:color+'66')),borderRadius:5,maxBarThickness:26},
    {type:'line',data:labels.map(()=>target),borderColor:'#fbbf24',borderDash:[5,4],borderWidth:1,pointRadius:0}]},options:CH()}); }
function mkWeight(canvas,keys,weights,goal){ const labels=keys.map(k=>parseDk(k).toLocaleDateString(undefined,{day:'numeric',month:'short'}));
  return new Chart(canvas,{type:'line',data:{labels,datasets:[
    {data:weights,borderColor:'#a78bfa',backgroundColor:'#a78bfa22',spanGaps:true,tension:.3,pointRadius:3,pointBackgroundColor:'#a78bfa',fill:true},
    {data:labels.map(()=>goal),borderColor:'#4ade80',borderDash:[6,4],borderWidth:1.5,pointRadius:0}]},
    options:CH({scales:{x:{grid:{display:false},ticks:{color:'#9aa6b6',maxTicksLimit:7,font:{size:10}}},y:{grid:{color:'#2a313d'},ticks:{color:'#9aa6b6',font:{size:10}},beginAtZero:false}}})}); }

/* =====================================================================
   TAB: MORE (goal, sync, library, data)
   ===================================================================== */
function renderMore(){
  const frag=document.createDocumentFragment(); const s=S();
  frag.append(el('<h1>Settings</h1>'));

  // Appearance
  const appear=el(`<div class="card"><div class="row spread"><h2>🎨 Appearance</h2>
    <div class="seg" style="width:170px"><button data-th="dark" class="${s.theme!=='light'?'active':''}">🌙 Dark</button><button data-th="light" class="${s.theme==='light'?'active':''}">☀️ Light</button></div></div></div>`);
  $$('[data-th]',appear).forEach(b=>b.onclick=()=>{ s.theme=b.dataset.th; applyTheme(); touchMeta(); render(); });
  frag.append(appear);

  // Goal engine
  const proj=goalProjection();
  const goal=el(`<div class="card"><h2>🎯 Fat-loss goal</h2>
    <div class="row" style="gap:.5rem"><label class="field grow"><span>Height (cm)</span><input id="g-h" type="number" value="${s.heightCm}"></label><label class="field grow"><span>Age</span><input id="g-age" type="number" value="${s.age}"></label></div>
    <div class="row" style="gap:.5rem"><label class="field grow"><span>Start weight</span><input id="g-sw" type="number" step="0.1" value="${s.startWeight}"></label><label class="field grow"><span>Target weight</span><input id="g-tw" type="number" step="0.1" value="${s.targetWeight}"></label></div>
    <div class="row" style="gap:.5rem"><label class="field grow"><span>Activity</span><select id="g-act">
      <option value="1.2" ${s.activity==1.2?'selected':''}>Sedentary</option><option value="1.375" ${s.activity==1.375?'selected':''}>Light</option>
      <option value="1.5" ${s.activity==1.5?'selected':''}>Moderate (gym 4x)</option><option value="1.725" ${s.activity==1.725?'selected':''}>Very active</option></select></label>
      <label class="field grow"><span>Loss / week</span><select id="g-rate">
        <option value="0.25" ${s.rateKgPerWeek==0.25?'selected':''}>0.25 kg (easy)</option><option value="0.5" ${s.rateKgPerWeek==0.5?'selected':''}>0.5 kg</option>
        <option value="0.6" ${s.rateKgPerWeek==0.6?'selected':''}>0.6 kg</option><option value="0.75" ${s.rateKgPerWeek==0.75?'selected':''}>0.75 kg</option><option value="1" ${s.rateKgPerWeek==1?'selected':''}>1 kg (aggressive)</option></select></label></div>
    <label class="field"><span>Protein g per kg bodyweight</span><input id="g-ppk" type="number" step="0.1" value="${s.proteinPerKg}"></label>
    <div class="card tight" style="background:var(--surface2)"><div class="small">Computed targets → <b>${s.kcalTarget} kcal</b> · <b>${s.proteinTarget}g protein</b> · ${s.waterTarget}L water<br><span class="muted">${proj.done?'You are at/below target weight! 🏆':`~${proj.weeks} weeks to ${s.targetWeight}kg (around ${proj.eta})`}</span></div></div>
    <div class="row" style="gap:.5rem;margin-top:.6rem"><label class="field grow"><span>Water (L)</span><input id="g-w" type="number" step="0.5" value="${s.waterTarget}"></label><label class="field grow"><span>Gym / week</span><input id="g-gym" type="number" value="${s.gymPerWeek}"></label></div>
    <button class="btn primary" id="saveGoal" style="width:100%">Save & recalculate</button></div>`);
  $('#saveGoal',goal).onclick=()=>{ s.heightCm=+$('#g-h',goal).value||s.heightCm; s.age=+$('#g-age',goal).value||s.age; s.startWeight=+$('#g-sw',goal).value||s.startWeight;
    s.targetWeight=+$('#g-tw',goal).value||s.targetWeight; s.activity=+$('#g-act',goal).value; s.rateKgPerWeek=+$('#g-rate',goal).value; s.proteinPerKg=+$('#g-ppk',goal).value||s.proteinPerKg;
    s.waterTarget=+$('#g-w',goal).value||s.waterTarget; s.gymPerWeek=+$('#g-gym',goal).value||s.gymPerWeek; s.autoTargets=true; computeTargets(); touchMeta(); toast('Goal saved','🎯'); render(); };
  frag.append(goal);

  // Cloud sync
  const cfg=loadSbCfg()||{};
  const sync=el(`<div class="card"><h2>☁️ Cloud sync <span class="tag">${sbStatus}</span></h2>
    <p class="small muted">Sync phone ⇄ laptop in real time. Use the SAME Sync ID on every device. Setup steps in README.md.</p>
    <label class="field"><span>Supabase URL</span><input id="sb-url" placeholder="https://xxxx.supabase.co" value="${esc(cfg.url||'')}"></label>
    <label class="field"><span>Supabase anon key</span><input id="sb-key" placeholder="eyJ…" value="${esc(cfg.key||'')}"></label>
    <label class="field"><span>Sync ID (shared, private)</span><input id="sb-uk" value="${esc(s.userKey)}"></label>
    <div class="row" style="gap:.5rem"><button class="btn primary grow" id="sbSave">Save & connect</button><button class="btn grow" id="sbPush">Push all</button></div>
    <button class="btn ghost danger" id="sbOff" style="margin-top:.5rem">Disconnect</button></div>`);
  $('#sbSave',sync).onclick=()=>{ let url=$('#sb-url',sync).value.trim(),key=$('#sb-key',sync).value.trim(),nk=$('#sb-uk',sync).value.trim();
    if(!url||!key){toast('Enter URL + key');return;}
    url=url.replace(/\/+$/,'');                                   // strip trailing slash
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(url)){ toast('URL must be like https://xxxx.supabase.co (no path/title)','⚠️'); return; }
    if(!/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(key)){ toast('That doesn’t look like the anon key (eyJ…). Use Settings → API.','⚠️'); return; }
    if(nk&&nk!==s.userKey){s.userKey=nk;touchMeta();}
    localStorage.setItem(SB_KEY,JSON.stringify({url,key})); toast('Connecting…'); if(sb){try{sb.removeAllChannels();}catch(e){}} sb=null; initSync(true);
    setTimeout(()=>{ fullPushAll().then(()=>{ if(sb&&sbStatus!=='err') toast('Connected & data pushed ✓','☁️'); }); render(); },1800); };
  $('#sbPush',sync).onclick=()=>fullPushAll().then(()=>toast('Pushed','☁️'));
  $('#sbOff',sync).onclick=()=>{ localStorage.removeItem(SB_KEY); if(sb){try{sb.removeAllChannels();}catch(e){}} sb=null; setSyncUI('local'); render(); };
  frag.append(sync);

  // Reminders
  const rem=remCfg(); const permTxt=notifOK()?(Notification.permission==='granted'?'allowed':Notification.permission==='denied'?'blocked':'not asked'):'unsupported';
  const remCard=el(`<div class="card"><h2>🔔 Reminders <span class="tag">${permTxt}</span></h2>
    <p class="small muted">A daily nudge to log + protect your streak. For reliable background reminders on Android, install the app to your Home Screen first.</p>
    <label class="row" style="gap:.6rem;margin-bottom:.6rem"><input type="checkbox" id="rOn" ${rem.enabled?'checked':''}><span class="grow">Enable reminders</span></label>
    <label class="field"><span>Evening streak-saver time</span><input id="rTime" type="time" value="${rem.streakTime||'20:30'}"></label>
    <label class="row" style="gap:.6rem;margin-bottom:.6rem"><input type="checkbox" id="rMeals" ${rem.meals?'checked':''}><span class="grow">Also remind at meal times (8:30 · 13:30 · 20:30)</span></label>
    <div class="row wrap" style="gap:.5rem"><button class="btn grow" id="rTest">Send test</button><button class="btn ghost grow" id="rIcs">📅 Add to phone calendar</button></div>
    <p class="small faint" style="margin-top:.5rem">Calendar reminder = 100% reliable backup that works even if web notifications don’t.</p></div>`);
  $('#rOn',remCard).onchange=async e=>{ if(e.target.checked){ const ok=await enableReminders(); if(!ok){e.target.checked=false;} render(); } else { S().reminders.enabled=false; touchMeta(); syncRemToIDB(); scheduleReminders(); render(); } };
  $('#rTime',remCard).onchange=e=>{ S().reminders.streakTime=e.target.value; touchMeta(); syncRemToIDB(); scheduleReminders(); };
  $('#rMeals',remCard).onchange=e=>{ S().reminders.meals=e.target.checked; touchMeta(); syncRemToIDB(); scheduleReminders(); };
  $('#rIcs',remCard).onclick=buildICS;
  $('#rTest',remCard).onclick=async()=>{ if(!notifOK()){ toast('Not supported on this browser'); return; } let p=Notification.permission; if(p!=='granted')p=await Notification.requestPermission(); if(p!=='granted'){ toast('Allow notifications first'); return; }
    try{ const opt={body:'Reminders are working 🎉 — see you at log time.',icon:'icon.svg',badge:'icon.svg',tag:'anbu-test'}; if('serviceWorker'in navigator){ const reg=await navigator.serviceWorker.ready; reg.showNotification('Anbu Tracker 🔔',opt); } else new Notification('Anbu Tracker 🔔',opt); }catch(e){ toast('Could not show notification'); } };
  frag.append(remCard);

  // Library
  const libCard=el(`<div class="card"><div class="row spread"><h2>🍽️ My library</h2><button class="btn sm" id="addLib">+ Add</button></div>
    <p class="small muted">Your saved foods. The search also covers 150+ built-in foods + online lookup.</p><div id="libList"></div></div>`);
  drawLib($('#libList',libCard)); $('#addLib',libCard).onclick=()=>customFood('',nf=>{ state.meta.library.push({id:uid(),cat:'snack',name:nf.name,p:nf.p,c:nf.c,f:nf.f,kcal:nf.kcal}); touchMeta(); render(); });
  frag.append(libCard);

  // Data
  const data=el(`<div class="card"><h2>💾 Backup & data</h2>
    <div class="row wrap" style="gap:.5rem"><button class="btn grow" id="exp">Export backup</button><button class="btn grow" id="imp">Import</button></div>
    <input id="impFile" type="file" accept="application/json" class="hidden"><div class="divider"></div>
    <button class="btn ghost danger" id="reset">Reset library & plan to default</button>
    <button class="btn ghost danger" id="wipe" style="margin-top:.5rem">Erase ALL data</button></div>`);
  $('#exp',data).onclick=exportData; $('#imp',data).onclick=()=>$('#impFile',data).click(); $('#impFile',data).onchange=importData;
  $('#reset',data).onclick=()=>{ if(confirm('Restore food library + weekly plan from your meal plan? Logged days kept.')){ state.meta.library=clone(D.library); state.meta.weeklyPlan=structPlan(clone(D.weeklyPlan)); touchMeta(); toast('Restored','♻️'); render(); } };
  $('#wipe',data).onclick=()=>{ if(confirm('Erase ALL data on this device? Cannot be undone.')){ state=defaultState(); computeTargets(); saveLocal(); if(sb)fullPushAll(); selDate=TODAY; toast('Erased'); render(); } };
  frag.append(data);
  frag.append(el(`<div class="center small faint" style="padding:1rem">Anbu Protein Tracker v2 · data on-device${sb?' + cloud':''}</div>`));
  return frag;
}
function drawLib(box){ box.innerHTML='';
  for(const c of Object.keys(D.catLabels)){ const items=state.meta.library.filter(i=>i.cat===c); if(!items.length)continue;
    box.append(el(`<div class="libcat"><h3>${D.catLabels[c]}</h3></div>`)); const w=box.lastElementChild;
    for(const it of items){ const row=el(`<div class="libitem"><span class="nm">${esc(it.name)}</span><span class="mac">${it.p||0}g · ${it.kcal||0}</span><span class="x faint">✏️</span><span class="rm faint">✕</span></div>`);
      $('.x',row).onclick=()=>editLib(it); $('.rm',row).onclick=()=>{ if(confirm('Remove "'+it.name+'"?')){ state.meta.library=state.meta.library.filter(x=>x!==it); touchMeta(); render(); } }; w.append(row); } } }
function editLib(it){ openModal(`<h2>Edit food</h2>
  <label class="field"><span>Name</span><input id="e-name" value="${esc(it.name)}"></label>
  <div class="row" style="gap:.5rem"><label class="field grow"><span>Protein g</span><input id="e-p" type="number" value="${it.p??''}"></label><label class="field grow"><span>Calories</span><input id="e-k" type="number" value="${it.kcal??''}"></label></div>
  <div class="row" style="gap:.5rem"><label class="field grow"><span>Carb g</span><input id="e-c" type="number" value="${it.c??''}"></label><label class="field grow"><span>Fat g</span><input id="e-f" type="number" value="${it.f??''}"></label></div>
  <div class="row"><button class="btn grow" id="e-x">Cancel</button><button class="btn primary grow" id="e-ok">Save</button></div>`);
  $('#e-x').onclick=closeModal; $('#e-ok').onclick=()=>{ it.name=$('#e-name').value.trim()||it.name; it.p=+$('#e-p').value||0; it.kcal=+$('#e-k').value||0; it.c=$('#e-c').value?+$('#e-c').value:null; it.f=$('#e-f').value?+$('#e-f').value:null; touchMeta(); closeModal(); render(); }; }
function exportData(){ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`anbu-tracker-${TODAY}.json`; a.click(); toast('Backup downloaded','💾'); }
function importData(e){ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{ try{ const s=JSON.parse(r.result); if(!s.meta||!s.days)throw 0; if(confirm('Import backup? Replaces current data.')){ state=migrate(s); saveLocal(); if(sb)fullPushAll(); toast('Imported','✅'); render(); } }catch(err){ alert('Invalid backup file.'); } }; r.readAsText(f); }

/* =====================================================================
   MODAL
   ===================================================================== */
function openModal(html){ closeModal(); const bg=el(`<div class="modal-bg"><div class="modal"><div class="grab"></div>${html}</div></div>`); bg.onclick=e=>{if(e.target===bg)closeModal();}; $('#modalRoot').append(bg); document.body.style.overflow='hidden'; }
function closeModal(){ $('#modalRoot').innerHTML=''; document.body.style.overflow=''; }

/* =====================================================================
   REMINDERS / NOTIFICATIONS  (Android web-push friendly; all guarded)
   ===================================================================== */
function idb(){ return new Promise((res,rej)=>{ if(typeof indexedDB==='undefined')return rej('no-idb'); const r=indexedDB.open('anbu',1); r.onupgradeneeded=()=>r.result.createObjectStore('kv'); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
async function idbSet(k,v){ try{ const db=await idb(); return new Promise(res=>{ const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').put(v,k); tx.oncomplete=()=>res(); tx.onerror=()=>res(); }); }catch(e){} }
let remTimers=[];
const remCfg=()=>S().reminders||{enabled:false,streakTime:'20:30',meals:false};
const notifOK=()=>typeof Notification!=='undefined';
async function syncRemToIDB(){ await idbSet('reminders',remCfg()); }
function reminderList(){ const c=remCfg(),list=[]; if(c.streakTime)list.push({time:c.streakTime,type:'streak'}); if(c.meals)list.push({time:'08:30',type:'breakfast'},{time:'13:30',type:'lunch'},{time:'20:30',type:'dinner'}); return list; }
function msgFor(type){ const t=dayTotals(TODAY),s=S(),streak=currentStreak(),protLeft=Math.max(0,Math.round(s.proteinTarget-t.p));
  if(type==='streak'){ if(isOnTarget(TODAY))return null; return {title:`🔥 ${streak>0?streak+'-day streak':'Streak'} at risk`, body: protLeft?`${protLeft}g protein to hit target — log your dinner.`:'Log today to keep it alive.'}; }
  const has=state.days[TODAY]&&state.days[TODAY].logged.some(x=>x.slot===type); if(has)return null;
  return {title:`Time to log ${type} 🍽️`, body:'Tap to log and bank your XP.'}; }
function showNotif(type){ const m=msgFor(type); if(!m||!notifOK()||Notification.permission!=='granted')return;
  try{ if('serviceWorker'in navigator){ navigator.serviceWorker.ready.then(reg=>reg.showNotification(m.title,{body:m.body,icon:'icon.svg',badge:'icon.svg',tag:'anbu-'+type,data:{url:'./'}})); } else new Notification(m.title,{body:m.body,icon:'icon.svg'}); }catch(e){} }
function scheduleReminders(){ remTimers.forEach(t=>clearTimeout(t)); remTimers=[]; const c=remCfg(); if(!c.enabled||!notifOK()||Notification.permission!=='granted')return;
  const nowD=new Date(); for(const r of reminderList()){ const [h,mm]=r.time.split(':').map(Number); const fire=new Date(); fire.setHours(h,mm,0,0); const delay=fire-nowD; if(delay>1000&&delay<24*3600*1000) remTimers.push(setTimeout(()=>showNotif(r.type),delay)); } }
async function registerPeriodic(){ try{ if(!('serviceWorker'in navigator))return; const reg=await navigator.serviceWorker.ready; if('periodicSync'in reg && navigator.permissions){ const st=await navigator.permissions.query({name:'periodic-background-sync'}); if(st.state==='granted') await reg.periodicSync.register('daily-reminder',{minInterval:18*3600*1000}); } }catch(e){} }
async function enableReminders(){ if(!notifOK()){ toast('Notifications not supported here'); return false; }
  let p=Notification.permission; if(p!=='granted')p=await Notification.requestPermission();
  if(p!=='granted'){ toast('Notifications blocked — allow them in browser settings'); return false; }
  S().reminders.enabled=true; touchMeta(); await syncRemToIDB(); registerPeriodic(); scheduleReminders(); toast('Reminders on','🔔'); return true; }
function buildICS(){ const c=remCfg(); const [h,mm]=(c.streakTime||'20:30').split(':');
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AnbuTracker//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:anbu-daily@tracker','SUMMARY:🔥 Log your meals — keep the streak alive','RRULE:FREQ=DAILY',`DTSTART:20240101T${h}${mm}00`,'DURATION:PT10M','DESCRIPTION:Open Anbu Tracker and log today’s food, water and workout.','BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:Log in Anbu Tracker','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'})); a.download='anbu-daily-reminder.ics'; a.click(); toast('Calendar reminder downloaded','📅'); }

/* ===== Onboarding (first run) ===== */
function maybeOnboard(){ if(S().onboarded) return; openOnboarding(); }
function openOnboarding(){ const s=S();
  openModal(`<h2>👋 Let’s set your goal</h2><p class="small muted">Two taps and your fat-loss targets are calculated for you.</p>
    <div class="row" style="gap:.5rem"><label class="field grow"><span>Height (cm)</span><input id="o-h" type="number" value="${s.heightCm}"></label><label class="field grow"><span>Age</span><input id="o-age" type="number" value="${s.age}"></label></div>
    <div class="row" style="gap:.5rem"><label class="field grow"><span>Weight now (kg)</span><input id="o-sw" type="number" step="0.1" value="${s.startWeight}"></label><label class="field grow"><span>Goal weight (kg)</span><input id="o-tw" type="number" step="0.1" value="${s.targetWeight}"></label></div>
    <label class="field"><span>Pace of fat loss</span><select id="o-rate">
      <option value="0.25">Easy · 0.25 kg/week</option><option value="0.5">Steady · 0.5 kg/week</option>
      <option value="0.6" selected>Recommended · 0.6 kg/week</option><option value="0.75">Fast · 0.75 kg/week</option></select></label>
    <button class="btn primary" id="o-go" style="width:100%">Calculate my targets →</button>
    <button class="btn ghost" id="o-skip" style="width:100%;margin-top:.4rem">Skip for now</button>`);
  $('#o-go').onclick=()=>{ s.heightCm=+$('#o-h').value||s.heightCm; s.age=+$('#o-age').value||s.age; s.startWeight=+$('#o-sw').value||s.startWeight; s.targetWeight=+$('#o-tw').value||s.targetWeight; s.rateKgPerWeek=+$('#o-rate').value; s.autoTargets=true; s.onboarded=true; computeTargets(); touchMeta(); closeModal(); confetti(); toast(`Targets set: ${s.kcalTarget} kcal · ${s.proteinTarget}g protein`,'🎯'); render(); };
  $('#o-skip').onclick=()=>{ s.onboarded=true; touchMeta(); closeModal(); };
}

/* =====================================================================
   BOOT
   ===================================================================== */
applyTheme();
$$('#tabbar button').forEach(b=>b.onclick=()=>{curTab=b.dataset.tab;render();});
render();
maybeOnboard();
initSync();
addEventListener('online',()=>{ if(loadSbCfg()&&!sb)initSync(); });
try{ idbSet('lastOpen',TODAY); syncRemToIDB(); if(remCfg().enabled){ registerPeriodic(); scheduleReminders(); } }catch(e){}
