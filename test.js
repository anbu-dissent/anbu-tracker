/* Headless smoke + logic test (dev only). Run: node test.js */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + ((e.detail && e.detail.message) || e.message || e)));

const html = `<!doctype html><html><body>
<header class="app"><div class="sync-dot" id="syncDot"><span class="dot"></span><span class="lbl">local</span></div></header>
<main id="view"></main>
<nav class="tabbar" id="tabbar">
  <button data-tab="today" class="active"></button><button data-tab="week"></button>
  <button data-tab="shop"></button><button data-tab="dash"></button><button data-tab="more"></button>
</nav>
<div id="modalRoot"></div><div class="toast" id="toast"></div>
</body></html>`;

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/' });
const { window } = dom;
window.Chart = function(){ return { destroy(){} }; };           // stub charts
window.HTMLCanvasElement.prototype.getContext = () => ({ clearRect(){},save(){},translate(){},rotate(){},fillRect(){},restore(){}, set fillStyle(v){} });
window.requestAnimationFrame = () => 0;                          // no-op (confetti)
window.scrollTo = () => {};                                      // jsdom doesn't implement it

function inject(file){ const s = window.document.createElement('script'); s.textContent = fs.readFileSync(file,'utf8'); window.document.body.appendChild(s); }
['data.js','foods-db.js','app.js'].forEach(inject);

// Run assertions inside the realm (so const/function bindings are visible)
const testSrc = `
window.__r = (function(){
  const R = { pass:[], fail:[] };
  const ok=(c,m)=>{ (c?R.pass:R.fail).push(m); };
  try {
    // 1) boot rendered Today
    ok($('#view').children.length>0, 'Today renders');
    // 2) every tab renders without throwing
    for(const tab of ['week','shop','dash','more','today']){ curTab=tab; let threw=false; try{ render(); }catch(e){ threw=true; R.fail.push('render '+tab+': '+e.message); } ok(!threw,'render '+tab); }
    curTab='today';
    // 3) goal engine
    ok(S().kcalTarget>1800 && S().kcalTarget<2600, 'kcal target sane = '+S().kcalTarget);
    ok(S().proteinTarget>=170 && S().proteinTarget<=210, 'protein target sane = '+S().proteinTarget);
    // 4) food search
    ok(searchFoods('paneer').length>=3, 'search paneer');
    ok(searchFoods('').length>50, 'search all >50 = '+searchFoods('').length);
    // 5) logging + totals
    const k = TODAY;
    addLog(k,'breakfast',{name:'Test eggs',p:30,c:2,f:10,kcal:200},1);
    addLog(k,'lunch',{name:'Soya curry',p:26,c:18,f:8,kcal:250},2);
    const t=dayTotals(k);
    ok(t.p===30+52, 'protein total = '+t.p);
    ok(t.kcal===200+500, 'kcal total = '+t.kcal);
    ok(t.items===2, 'item count');
    // 6) streak + on-target: build 4 perfect past days
    for(let i=1;i<=4;i++){ const dk=addDays(TODAY,-i); const d=getDay(dk);
      d.logged=[{name:'a',slot:'breakfast',p:S().proteinTarget,c:0,f:0,kcal:S().kcalTarget-200,qty:1},{name:'b',slot:'lunch',p:5,c:0,f:0,kcal:50,qty:1},{name:'c',slot:'dinner',p:5,c:0,f:0,kcal:50,qty:1}]; }
    ok(isOnTarget(addDays(TODAY,-1)), 'past day on-target');
    const st=currentStreak();
    ok(st>=4, 'streak >=4 = '+st);
    // 7) rewards / treats
    const since=onTargetSinceRedeem();
    ok(since>=4, 'onTargetSinceRedeem = '+since);
    ok(readyTreats().length>=1, 'treat ready (need 3) = '+readyTreats().length);
    ok(nextTreat()!=null, 'nextTreat exists');
    // 8) XP + level
    ok(totalXP()>0, 'xp = '+totalXP());
    ok(levelFor(totalXP()).cur.lvl>=1, 'level computed');
    // 9) badges
    const bm=computeBadgeState();
    ok(bm.first_log===true,'badge first_log');
    ok(bm.streak3===true,'badge streak3');
    // 10) projection
    const pr=goalProjection();
    ok(pr.eta || pr.done, 'projection eta');
    // 11) plan structure migrated to arrays
    ok(Array.isArray(state.meta.weeklyPlan.Mon.breakfast), 'plan structured');
    // 12) modal open/close
    openModal('<div id="mtest">x</div>'); ok(!!$('#mtest'),'modal opens'); closeModal(); ok(!$('#mtest'),'modal closes');
    // 13) render dash again with data (charts path)
    curTab='dash'; try{ render(); ok(true,'dash with data'); }catch(e){ R.fail.push('dash data: '+e.message); }
    // 14) new UX helpers
    ok(recentFoods(8).length>=1, 'recents populated = '+recentFoods(8).length);
    const gr=greeting(TODAY,getDay(TODAY),dayTotals(TODAY),S()); ok(!!(gr&&gr.html), 'greeting html');
    ok(currentStreak()>=1 && onTargetStreak()>=0, 'forgiving + strict streak both compute');
    // 15) ate-the-plan bulk log
    const mk=(function(){ for(let i=0;i<7;i++){ const dk=addDays(TODAY,i); if(planDow(dk)==='Mon') return dk; } return TODAY; })();
    state.meta.weeklyPlan.Mon.breakfast=[{name:'Plan idli',p:12,c:20,f:2,kcal:160}];
    const beforeN=getDay(mk).logged.length; logPlanned(mk,'breakfast',state.meta.weeklyPlan.Mon.breakfast);
    ok(getDay(mk).logged.length>beforeN, 'logPlanned adds planned items');
    curTab='today'; render();
  } catch(e){ R.fail.push('FATAL: '+e.message+' '+(e.stack||'').split('\\n')[1]); }
  return R;
})();
`;
const ts = window.document.createElement('script'); ts.textContent = testSrc; window.document.body.appendChild(ts);

const R = window.__r || { pass: [], fail: ['no result'] };
console.log('\\n=== PASS ('+R.pass.length+') ===');
R.pass.forEach(m => console.log('  ✓ ' + m));
if (R.fail.length){ console.log('\\n=== FAIL ('+R.fail.length+') ==='); R.fail.forEach(m => console.log('  ✗ ' + m)); }
if (errors.length){ console.log('\\n=== RUNTIME ERRORS ==='); errors.forEach(e => console.log('  ! ' + e)); }
console.log('\\nRESULT: ' + (R.fail.length===0 && errors.length===0 ? 'ALL GREEN ✅' : 'ISSUES ❌'));
process.exit(R.fail.length===0 && errors.length===0 ? 0 : 1);
