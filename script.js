/* Ahorra y Prospera — V6: finanzas funcionales + datos persistentes */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const page = location.pathname.split('/').pop() || 'index.html';
  const isDashboard = page === 'index.html' || page === '';
  const money = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO').replace(/,/g,'.');
  const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // ---------- Theme ----------
  const themeBtn = $('#theme') || $('#themeBtn');
  const savedTheme = localStorage.getItem('ap-theme') || 'dark';
  if (savedTheme === 'light') document.body.classList.add('light');
  if (themeBtn) {
    themeBtn.textContent = document.body.classList.contains('light') ? '☀' : '☾';
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light');
      const light = document.body.classList.contains('light');
      localStorage.setItem('ap-theme', light ? 'light' : 'dark');
      themeBtn.textContent = light ? '☀' : '☾';
      showToast(light ? 'Modo claro activado' : 'Modo oscuro activado');
    });
  }

  // ---------- Toast ----------
  window.showToast = text => {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = text; t.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  };

  // ---------- Entrance animations ----------
  document.body.classList.add('page-ready');
  $$('.hero, .stats article, .card, .list-card, .module-grid, footer').forEach((el, i) => {
    el.classList.add('reveal'); el.style.setProperty('--delay', `${Math.min(i * 55, 500)}ms`);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }), { threshold:.08 });
    $$('.reveal').forEach(el => observer.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('visible'));

  // ---------- Sidebar / Profile ----------
  $$('aside nav a, .sidebar nav a').forEach(a => a.addEventListener('click', () => a.classList.add('nav-click')));
  function toggleProfile() {
    let menu = $('#profile');
    if (!menu) {
      menu = document.createElement('div'); menu.id='profile'; menu.className='profile-menu';
      menu.innerHTML='<b>SQ</b><div><strong>Samuel</strong><small>Perfil personal</small></div><a href="configuracion.html">⚙ Configuración</a>';
      document.body.appendChild(menu);
    }
    menu.classList.toggle('show');
  }
  window.openProfile = toggleProfile;
  $$('.profile, .avatar').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggleProfile(); }));
  document.addEventListener('click', e => { const p=$('#profile'); if(p && !p.contains(e.target) && !e.target.closest('.profile') && !e.target.closest('.avatar')) p.classList.remove('show'); });

  // ---------- Notifications ----------
  function addNotificationUI() {
    const actions = $('.actions'); if (!actions || $('.notification-btn')) return;
    const btn=document.createElement('button'); btn.className='icon-btn notification-btn'; btn.title='Notificaciones'; btn.innerHTML='♢<span class="notification-dot"></span>';
    actions.insertBefore(btn, actions.firstChild);
    const panel=document.createElement('div'); panel.className='notification-panel'; panel.innerHTML='<div class="panel-title">Notificaciones <span>3 nuevas</span></div>' +
      '<div class="notification"><i>↗</i><div><b>Panel actualizado</b><small>Tus datos se guardan automáticamente.</small></div></div>' +
      '<div class="notification"><i>◎</i><div><b>Meta en progreso</b><small>Tu viaje de fin de año sigue avanzando.</small></div></div>' +
      '<div class="notification"><i>✦</i><div><b>Consejo financiero</b><small>Revisa tus gastos antes de cerrar el mes.</small></div></div>';
    document.body.appendChild(panel);
    btn.onclick=e=>{e.stopPropagation();panel.classList.toggle('show')};
    document.addEventListener('click',e=>{if(!panel.contains(e.target)&&!btn.contains(e.target))panel.classList.remove('show')});
  }
  addNotificationUI();

  // ---------- Date ----------
  const headerLabel=$('header label, .topbar .eyebrow');
  if(headerLabel){
    const update=()=>{const d=new Date();headerLabel.dataset.original=headerLabel.dataset.original||headerLabel.textContent;if(isDashboard&&headerLabel.dataset.original.includes('PANEL PRINCIPAL'))headerLabel.textContent=`PANEL PRINCIPAL · ${d.toLocaleDateString('es-CO',{month:'long'}).toUpperCase()} ${d.getFullYear()}`};
    update(); setInterval(update,60000);
  }

  // ---------- Storage ----------
  const base = { income:6200000, expense:2180000, saving:1940000, balance:4850000 };
  const movements = () => read('ap-movements', []);
  function totals(){
    const m=movements();
    return m.reduce((a,x)=>{const v=Number(x.value)||0;if(x.type==='ingreso')a.income+=v;if(x.type==='gasto')a.expense+=v;if(x.type==='ahorro')a.saving+=v;return a},{income:base.income,expense:base.expense,saving:base.saving});
  }
  function currentTotals(){const t=totals();return {...t,balance:base.balance + (t.income-base.income) - (t.expense-base.expense) - (t.saving-base.saving)}}
  const pageType = page === 'ingresos.html' ? 'ingreso' : page === 'gastos.html' ? 'gasto' : page === 'ahorros.html' ? 'ahorro' : null;

  // ---------- Animated money ----------
  function animateMoney(el,target){
    if(!el)return;const startVal=Number(el.dataset.value ?? target);const start=performance.now(),duration=650;
    const tick=now=>{const p=Math.min((now-start)/duration,1),e=1-Math.pow(1-p,3);el.textContent=money(startVal+(target-startVal)*e);if(p<1)requestAnimationFrame(tick);else el.dataset.value=target};
    requestAnimationFrame(tick);
  }

  // ---------- Movement modal ----------
  function buildMovementModal(){
    if($('#movementModal'))return $('#movementModal');
    const modal=document.createElement('div');modal.id='movementModal';modal.className='modal-backdrop';
    modal.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="movementTitle">
      <button class="modal-close" aria-label="Cerrar">×</button><div class="eyebrow">NUEVO MOVIMIENTO</div>
      <h3 id="movementTitle">Registrar movimiento</h3><p class="modal-help">Guarda el movimiento y actualiza automáticamente tu balance, actividad y estadísticas.</p>
      <div class="type-switch"><button class="type active" data-type="gasto">Gasto</button><button class="type" data-type="ingreso">Ingreso</button><button class="type" data-type="ahorro">Ahorro</button></div>
      <label class="field-label">Descripción<input id="mvName" maxlength="60" placeholder="Ej. Mercado"></label>
      <label class="field-label">Valor<input id="mvValue" type="number" min="1" step="1000" inputmode="numeric" placeholder="85000"></label>
      <label class="field-label">Categoría<select id="mvCategory"><option>Alimentación</option><option>Transporte</option><option>Vivienda</option><option>Entretenimiento</option><option>Trabajo</option><option>Compras</option><option>Servicios</option><option>Educación</option><option>Otros</option></select></label>
      <label class="field-label">Fecha<input id="mvDate" type="date"></label>
      <button class="primary modal-save" id="saveMovement">Guardar movimiento →</button>
    </div>`;
    document.body.appendChild(modal);
    let type='gasto';
    const today=new Date();$('#mvDate',modal).value=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
    $$('.type',modal).forEach(b=>b.onclick=()=>{$$('.type',modal).forEach(x=>x.classList.remove('active'));b.classList.add('active');type=b.dataset.type;$('#movementTitle',modal).textContent=type==='gasto'?'Registrar gasto':type==='ingreso'?'Registrar ingreso':'Registrar ahorro';});
    const close=()=>modal.classList.remove('show');$('.modal-close',modal).onclick=close;modal.onclick=e=>{if(e.target===modal)close()};
    $('#saveMovement',modal).onclick=()=>{
      const name=$('#mvName').value.trim(),value=Number($('#mvValue').value),cat=$('#mvCategory').value,date=$('#mvDate').value;
      if(!name||!value||value<1){showToast('Completa la descripción y un valor válido');return}
      const arr=movements();const d=date?new Date(`${date}T12:00:00`):new Date();
      arr.unshift({id:Date.now(),name,value,type,cat,date:d.toLocaleDateString('es-CO',{day:'2-digit',month:'short'}),iso:d.toISOString()});
      save('ap-movements',arr.slice(0,60));close();$('#mvName',modal).value='';$('#mvValue',modal).value='';refreshAll();renderInternalPage();renderChart();showToast(type==='gasto'?'Gasto guardado ✓':type==='ingreso'?'Ingreso guardado ✓':'Ahorro registrado ✓');
    };
    return modal;
  }
  function openMovementModal(type=pageType||'gasto'){const modal=buildMovementModal();modal.classList.add('show');const btn=$(`.type[data-type="${type}"]`,modal);if(btn)btn.click();setTimeout(()=>$('#mvName',modal)?.focus(),120)}
  window.openMovementModal=openMovementModal;

  // Buttons marked by HTML data-action, without the old alert popups.
  $$('[data-action]').forEach(b=>b.addEventListener('click',e=>{
    e.preventDefault();
    if(pageType) openMovementModal(pageType);
    else showToast('Este módulo está preparado para la siguiente etapa ✦');
  }));

  // ---------- Dashboard ----------
  function refreshStats(){
    const t=currentTotals();
    [['balance',t.balance],['income',t.income],['expense',t.expense],['saving',t.saving]].forEach(([id,val])=>{const el=$('#'+id);if(el)animateMoney(el,val)});
    const orb=$('.orb-core');if(orb)orb.innerHTML=`<span>${money(t.balance).replace('$','')}</span><small>balance</small>`;
    const rate=Math.max(0,Math.min(100,Math.round((1-t.expense/Math.max(t.income,1))*100)));const rateEl=$('.health-score');if(rateEl)rateEl.textContent=rate;
    return t;
  }
  function renderMovements(){
    const box=$('#movements');if(!box)return;
    const custom=movements().slice(0,5);const defaults=[{name:'Alimentación',cat:'Restaurante',date:'Hoy · 12:40',value:85000,type:'gasto',icon:'$'},{name:'Pago recibido',cat:'Ingreso',date:'Ayer · 09:15',value:1500000,type:'ingreso',icon:'↑'},{name:'Transporte',cat:'Transporte',date:'Ayer · 18:20',value:42000,type:'gasto',icon:'↗'}];
    const rows=custom.length?custom:defaults;
    box.innerHTML=rows.slice(0,5).map((x,i)=>{const positive=x.type!=='gasto';return `<div class="move move-animated" style="--i:${i}"><span class="move-icon">${x.icon|| (x.type==='ingreso'?'↑':x.type==='ahorro'?'◎':'↘')}</span><div><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.cat||'Otros')} · ${escapeHtml(x.date||'Hoy')}</small></div><strong class="${positive?'positive':''}">${positive?'+':'-'}${money(Math.abs(x.value))}</strong>${x.id?`<button class="move-delete" data-id="${x.id}" title="Eliminar">×</button>`:''}</div>`}).join('');
    $$('.move-delete',box).forEach(btn=>btn.onclick=()=>{save('ap-movements',movements().filter(x=>String(x.id)!==String(btn.dataset.id)));refreshAll();renderInternalPage();renderChart();showToast('Movimiento eliminado')});
  }

  // ---------- Internal pages ----------
  const defaultsByPage={
    ingreso:[['Salario','Ingreso mensual · 01 Sep',4500000,'💼'],['Trabajo freelance','Proyecto web · 28 Ago',850000,'💻'],['Otros ingresos','Pago recibido · 25 Ago',350000,'🎁'],['Rendimiento','Ahorro · 20 Ago',500000,'📈']],
    gasto:[['Alimentación','Restaurante · Hoy',85000,'🍔'],['Transporte','Transporte · Ayer',42000,'🚌'],['Vivienda','Servicios · 30 Ago',320000,'🏠'],['Entretenimiento','Suscripción · 28 Ago',55000,'🎮'],['Compras','Mercado · 27 Ago',180000,'🛒']],
    ahorro:[['Viaje de fin de año','Meta principal · Septiembre',3400000,'✈'],['Fondo de emergencia','Ahorro programado · Agosto',1200000,'🛡'],['Estudio','Meta educativa · Agosto',800000,'🎓'],['Reserva','Ahorro libre · Julio',500000,'◎']]
  };
  function renderInternalPage(){
    if(!pageType)return;
    const card=$('.module-grid .list-card');if(!card)return;
    const items=$$('.list-item',card);const custom=movements().filter(x=>x.type===pageType).slice(0,5);
    const list=custom.length?custom.map(x=>({name:x.name,sub:`${x.cat||'Otros'} · ${x.date||'Hoy'}`,value:x.value,icon:x.type==='ingreso'?'↗':x.type==='ahorro'?'◎':'↘',id:x.id})):defaultsByPage[pageType].map(x=>({name:x[0],sub:x[1],value:x[2],icon:x[3]}));
    items.forEach((el,i)=>{const x=list[i];if(!x){el.style.display='none';return}el.style.display='grid';el.innerHTML=`<div class="item-icon">${x.icon}</div><div><div class="item-title">${escapeHtml(x.name)}</div><div class="item-sub">${escapeHtml(x.sub)}</div></div><div class="item-value">${pageType==='gasto'?'-':'+'}${money(x.value)}</div>${x.id?`<button class="move-delete" data-id="${x.id}" title="Eliminar">×</button>`:''}`});
    const t=currentTotals();const stats=$$('.mini-stat',card.nextElementSibling||document);
    if(pageType==='ingreso'&&stats.length>=3){stats[0].querySelector('strong').textContent=money(t.income);stats[1].querySelector('strong').textContent=money(t.income/6);const max=Math.max(...movements().filter(x=>x.type==='ingreso').map(x=>x.value),4500000);stats[2].querySelector('strong').textContent=money(max)}
    if(pageType==='gasto'&&stats.length>=4){const cats={Alimentación:620000,Vivienda:520000,Transporte:310000,Entretenimiento:180000,Compras:180000};movements().filter(x=>x.type==='gasto').forEach(x=>cats[x.cat]=(cats[x.cat]||0)+x.value);const order=['Alimentación','Vivienda','Transporte','Entretenimiento'];order.forEach((k,i)=>{if(stats[i]){stats[i].querySelector('strong').textContent=money(cats[k]||0)}})}
    if(pageType==='ahorro'&&stats.length>=3){stats[0].querySelector('strong').textContent=money(t.saving);stats[1].querySelector('strong').textContent=money(Math.max(0,t.income-t.expense-t.saving));const g=goals();stats[2].querySelector('strong').textContent=g.length?`${g.length} activa${g.length>1?'s':''}`:'0 activas'}
    $$('.move-delete',card).forEach(btn=>btn.onclick=()=>{save('ap-movements',movements().filter(x=>String(x.id)!==String(btn.dataset.id)));refreshAll();renderInternalPage();renderChart();showToast('Movimiento eliminado')});
  }

  // ---------- Goals ----------
  function defaultGoals(){return [{id:1,name:'Viaje de fin de año',target:5000000,saved:3400000,icon:'✈'}]}
  const goals=()=>read('ap-goals',defaultGoals());
  function renderGoals(){const box=$('#goalList');if(!box)return;box.innerHTML=goals().map(g=>{const p=Math.min(100,Math.round(g.saved/g.target*100));return `<div class="goal-mini"><div class="goal-icon">${g.icon||'◎'}</div><div class="goal-info"><b>${escapeHtml(g.name)}</b><small>${money(g.saved)} de ${money(g.target)}</small><i><b style="width:${p}%"></b></i></div><strong>${p}%</strong></div>`}).join('')}
  function buildGoalModal(){
    if($('#goalModal'))return $('#goalModal');const m=document.createElement('div');m.id='goalModal';m.className='modal-backdrop';m.innerHTML=`<div class="modal"><button class="modal-close">×</button><div class="eyebrow">NUEVA META</div><h3>Crea un objetivo</h3><p class="modal-help">Ponle nombre, valor y deja que el progreso se anime.</p><label class="field-label">Nombre<input id="goalName" placeholder="Ej. Universidad"></label><label class="field-label">Objetivo<input id="goalTarget" type="number" min="1" placeholder="5000000"></label><label class="field-label">Ahorrado<input id="goalSaved" type="number" min="0" placeholder="500000"></label><button class="primary" id="saveGoal">Crear meta →</button></div>`;document.body.appendChild(m);m.querySelector('.modal-close').onclick=()=>m.classList.remove('show');m.onclick=e=>{if(e.target===m)m.classList.remove('show')};$('#saveGoal',m).onclick=()=>{const name=$('#goalName').value.trim(),target=Number($('#goalTarget').value),saved=Math.min(Number($('#goalSaved').value)||0,target);if(!name||!target){showToast('Completa el nombre y objetivo');return}const arr=goals();arr.unshift({id:Date.now(),name,target,saved,icon:'◎'});save('ap-goals',arr.slice(0,8));m.classList.remove('show');renderGoals();renderAchievements();renderAlerts();showToast('Meta creada 🎯')};return m}
  function openGoalModal(){buildGoalModal().classList.add('show');setTimeout(()=>$('#goalName')?.focus(),100)}

  // ---------- Insights ----------
  function renderAchievements(){const grid=$('#achievementGrid');if(!grid)return;const m=movements(),g=goals();const unlocked=[m.length>0,g.length>=2,m.filter(x=>x.type==='ahorro').length>=3,m.filter(x=>x.type==='ingreso').length>=2,g.some(x=>x.saved>=x.target),currentTotals().saving>=2000000];const data=[['⚡','Primer movimiento','Registra tu primer movimiento'],['🎯','Dos metas','Crea dos objetivos'],['◎','Hábito de ahorro','Registra 3 ahorros'],['↗','Ingresos activos','Registra 2 ingresos'],['🏆','Meta cumplida','Completa una meta'],['💚','Ahorro sólido','Supera $2.000.000 ahorrados']];grid.innerHTML=data.map((a,i)=>`<div class="achievement ${unlocked[i]?'unlocked':''}" title="${a[2]}"><span>${a[0]}</span><b>${a[1]}</b><small>${unlocked[i]?'Desbloqueado':'Bloqueado'}</small></div>`).join('');const count=unlocked.filter(Boolean).length;$('#achievementCount').textContent=`${count}/6`;if(count>0)$('#achievementCount').classList.add('achievement-pop')}
  function renderCalendar(){const box=$('#calendar');if(!box)return;const d=new Date(),year=d.getFullYear(),month=d.getMonth(),today=d.getDate(),first=new Date(year,month,1).getDay();const offset=(first+6)%7;const days=new Date(year,month+1,0).getDate();const active=new Set(movements().filter(x=>x.iso).map(x=>{const z=new Date(x.iso);return z.getFullYear()===year&&z.getMonth()===month?z.getDate():0}));$('#calendarMonth').textContent=d.toLocaleDateString('es-CO',{month:'long'});let html='<div class="cal-week">'+['L','M','X','J','V','S','D'].map(x=>`<b>${x}</b>`).join('')+'</div><div class="cal-days">';for(let i=0;i<offset;i++)html+='<span></span>';for(let n=1;n<=days;n++)html+=`<button class="cal-day ${n===today?'today':''} ${active.has(n)?'has-event':''}" data-day="${n}">${n}${active.has(n)?'<i></i>':''}</button>`;html+='</div>';box.innerHTML=html;$$('.cal-day',box).forEach(b=>b.onclick=()=>{const day=b.dataset.day;const list=movements().filter(x=>x.iso&&new Date(x.iso).getDate()==day);showToast(list.length?`${list.length} movimiento(s) el día ${day}`:`Sin movimientos el día ${day}`)})}
  function renderCategories(){const box=$('#categoryBars');if(!box)return;const data={Alimentación:620000,Vivienda:520000,Transporte:310000,Entretenimiento:180000,Compras:180000};movements().filter(x=>x.type==='gasto').forEach(x=>data[x.cat]=(data[x.cat]||0)+x.value);const max=Math.max(...Object.values(data));box.innerHTML=Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`<div class="cat-row"><div><span>${escapeHtml(k)}</span><b>${money(v)}</b></div><i><b style="width:${Math.round(v/max*100)}%"></b></i></div>`).join('')}
  function updateAI(force=false){const el=$('#aiDynamic');if(!el)return;const t=currentTotals();const rate=Math.round(Math.max(0,(t.income-t.expense)/Math.max(t.income,1)*100));const messages=[`Tu capacidad de ahorro estimada es del ${rate}%. Mantén el ritmo y revisa las categorías que más pesan.`,`Tus gastos registrados suman ${money(t.expense)}. Una revisión semanal puede ayudarte a detectar fugas pequeñas.`,`Tienes ${goals().length} meta(s) activas. Convertir un ahorro automático en hábito puede acelerar tus objetivos.`,`Tu balance disponible es ${money(t.balance)}. Vas construyendo una base financiera más estable.`];el.textContent=force?messages[Math.floor(Math.random()*messages.length)]:messages[(new Date().getDate())%messages.length];el.classList.remove('text-pulse');void el.offsetWidth;el.classList.add('text-pulse')}
  function renderAlerts(){const box=$('#smartAlerts');if(!box)return;const t=currentTotals(),rate=(t.income-t.expense)/Math.max(t.income,1),alerts=[];if(rate<.35)alerts.push(['⚠','Revisa tus gastos','Tu margen mensual está por debajo del 35%.']);else alerts.push(['✓','Buen margen','Tu margen actual supera el 35%.']);if(t.expense>2500000)alerts.push(['↘','Gastos elevados','Este mes tus gastos están creciendo.']);else alerts.push(['✦','Gastos controlados','Tu nivel de gasto está dentro de un rango cómodo.']);const g=goals()[0];if(g)alerts.push(['🎯','Meta en progreso',`${Math.max(0,100-Math.round(g.saved/g.target*100))}% para completar ${escapeHtml(g.name)}.`]);box.innerHTML=alerts.map(a=>`<div class="alert-item"><span>${a[0]}</span><div><b>${a[1]}</b><small>${a[2]}</small></div></div>`).join('')}

  // ---------- Simulator ----------
  function setupSimulator(){const inc=$('#simIncome'),rate=$('#simRate');if(!inc||!rate)return;const update=()=>{const i=Number(inc.value),r=Number(rate.value),res=i*r/100;$('#simIncomeValue').textContent=money(i);$('#simRateValue').textContent=r+'%';const el=$('#simResult');el.dataset.value=res;el.textContent=money(res)};inc.oninput=rate.oninput=update;update()}

  // ---------- Internal enhancement ----------
  function internalEnhancements(){
    if(isDashboard)return;const main=$('main');if(!main||$('.v5-internal'))return;const sec=document.createElement('section');sec.className='v5-internal';sec.innerHTML=`<div class="internal-head"><div><label>EXPERIENCIA INTELIGENTE</label><h2>Haz que esta sección <i>trabaje contigo.</i></h2><p>Registra movimientos y revisa cómo cambian tus indicadores.</p></div><button class="primary" id="internalAction">+ Registrar</button></div><div class="internal-grid"><article class="internal-card radar"><div><label>ACTIVIDAD</label><h3>Ritmo de tus datos</h3></div><div class="radar-bars">${[45,72,54,88,62,92,76].map((h,i)=>`<i style="--h:${h}%;--i:${i}"></i>`).join('')}</div><small>Actualizado automáticamente</small></article><article class="internal-card insight-live"><span>✦</span><div><label>MICRO CONSEJO</label><h3 id="internalTip">Una decisión pequeña puede cambiar tu mes.</h3><p>Registra tus movimientos y deja que el análisis se ajuste.</p></div><button class="mini-link" id="newTip">Cambiar consejo</button></article></div>`;const module=$('.module-grid');module?module.after(sec):main.append(sec);if(pageType)$('#internalAction').onclick=()=>openMovementModal(pageType);else $('#internalAction').onclick=()=>showToast('Este módulo está preparado para la siguiente etapa ✦');const tips=['Revisa primero los movimientos que se repiten cada mes.','Una meta clara hace que ahorrar sea más fácil de seguir.','Comparar semanas puede revelar hábitos que pasan desapercibidos.','Registrar cada movimiento convierte tus datos en decisiones.'];let ti=0;$('#newTip').onclick=()=>{ti=(ti+1)%tips.length;$('#internalTip').textContent=tips[ti];showToast('Nuevo consejo ✦')};
  }

  // ---------- Chart ----------
  let financeChart=null;
  function renderChart(){const c=$('#chart');if(!c||!window.Chart)return;const t=currentTotals();const custom=movements();const labels=['Abr','May','Jun','Jul','Ago','Sep'];const incomes=[4.5,5.2,4.8,5.7,5.9,6.2],expenses=[2.8,2.5,3.1,2.7,2.4,2.18];const thisIncome=t.income/1000000,thisExpense=t.expense/1000000;incomes[5]=thisIncome;expenses[5]=thisExpense;if(financeChart){financeChart.data.datasets[0].data=incomes;financeChart.data.datasets[1].data=expenses;financeChart.update();return}financeChart=new Chart(c,{type:'line',data:{labels,datasets:[{label:'Ingresos',data:incomes,tension:.38,borderWidth:3,pointRadius:3,fill:false},{label:'Gastos',data:expenses,tension:.38,borderWidth:2,pointRadius:3,fill:false}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:900,easing:'easeOutQuart'},interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:8,padding:18,font:{size:10},color:'#8fa199'}}},scales:{x:{grid:{display:false},ticks:{color:'#6f8379',font:{size:9}}},y:{grid:{color:'#ffffff09'},ticks:{color:'#6f8379',font:{size:9},callback:v=>'$'+v+'M'}}}}});}

  // ---------- Settings ----------
  setTimeout(()=>{
    const main=$('main');if(!main||isDashboard)return; if(page==='configuracion.html'&&$('.settings-v5'))return;
    if(page==='configuracion.html'){
      const box=document.createElement('section');box.className='settings-v5';box.innerHTML=`<div><label>CONTROL DE EXPERIENCIA</label><h2>Personaliza <i>tu espacio.</i></h2></div><div class="settings-row"><div><b>Animaciones</b><small>Movimiento suave en tarjetas, barras y transiciones.</small></div><button class="toggle ${localStorage.getItem('ap-animations')!=='off'?'on':''}" id="animationToggle"><i></i></button></div><div class="settings-row"><div><b>Restablecer datos de prueba</b><small>Elimina movimientos y metas creadas en este navegador.</small></div><button class="danger-btn" id="resetData">Restablecer</button></div>`;main.append(box);$('#animationToggle').onclick=()=>{const on=localStorage.getItem('ap-animations')==='off';localStorage.setItem('ap-animations',on?'on':'off');document.body.classList.toggle('no-animations',!on);$('#animationToggle').classList.toggle('on',on);showToast(on?'Animaciones activadas ✨':'Animaciones pausadas')};$('#resetData').onclick=()=>{if(confirm('¿Restablecer movimientos y metas creadas?')){localStorage.removeItem('ap-movements');localStorage.removeItem('ap-goals');location.reload()}};
    }
  },200);

  // ---------- Search ----------
  if(!isDashboard){
    $$('.list-card').forEach(card=>{const items=$$('.list-item',card);const head=$('.card-head',card);if(items.length>=3&&head&&!$('.list-search',card)){const input=document.createElement('input');input.className='list-search';input.placeholder='Buscar…';head.appendChild(input);input.oninput=()=>{const q=input.value.toLowerCase();items.forEach(i=>i.classList.toggle('filtered-out',!i.textContent.toLowerCase().includes(q)))}}});
  }

  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openMovementModal()}if(e.key==='Escape'){$('#movementModal')?.classList.remove('show');$('#goalModal')?.classList.remove('show');$('#profile')?.classList.remove('show');$('.notification-panel')?.classList.remove('show')}});
  if(localStorage.getItem('ap-animations')==='off')document.body.classList.add('no-animations');

  // ---------- Init ----------
  function refreshAll(){refreshStats();renderMovements();renderGoals();renderAchievements();renderCalendar();renderCategories();renderAlerts();updateAI(true);window.apV7Refresh?.();}
  buildDashboardFeatures();
  function buildDashboardFeatures(){
    if(!isDashboard||$('.v5-features'))return;const anchor=$('.grid.lower')||$('.lower')||$('.grid');if(!anchor)return;const sec=document.createElement('section');sec.className='v5-features';sec.innerHTML=`<div class="feature-title"><div><label>CONTROL TOTAL</label><h2>Tu dinero, <i>en movimiento.</i></h2><p>Todo lo importante en un solo lugar, con datos que reaccionan a tus decisiones.</p></div><button class="primary" id="quickMove">+ Nuevo movimiento</button></div><div class="feature-grid"><article class="feature-card health-card"><div class="feature-glow"></div><div class="feature-head"><div><label>SALUD FINANCIERA</label><h3>Índice saludable</h3></div><span class="status-dot"></span></div><div class="health-meter"><div class="health-ring"><span class="health-score">82</span><small>/100</small></div><div class="health-copy"><b>Vas por buen camino</b><p>Tu balance y capacidad de ahorro mantienen una tendencia positiva.</p></div></div><div class="health-bars"><div><span>Ahorro</span><i><b style="width:78%"></b></i></div><div><span>Gastos</span><i><b style="width:69%"></b></i></div><div><span>Metas</span><i><b style="width:82%"></b></i></div></div></article><article class="feature-card"><div class="feature-head"><div><label>ALERTAS INTELIGENTES</label><h3>Lo que debes mirar</h3></div><span class="spark">✦</span></div><div id="smartAlerts" class="alert-list"></div></article><article class="feature-card goals-card"><div class="feature-head"><div><label>TUS METAS</label><h3>Objetivos que avanzan</h3></div><button class="mini-link" id="newGoal">+ Crear</button></div><div id="goalList"></div></article><article class="feature-card achievements-card"><div class="feature-head"><div><label>LOGROS</label><h3>Pequeñas victorias</h3></div><span class="achievement-count" id="achievementCount">0/6</span></div><div class="achievement-grid" id="achievementGrid"></div></article><article class="feature-card calendar-card"><div class="feature-head"><div><label>CALENDARIO</label><h3>Actividad del mes</h3></div><span id="calendarMonth"></span></div><div id="calendar"></div></article><article class="feature-card categories-card"><div class="feature-head"><div><label>DÓNDE SE VA</label><h3>Gastos por categoría</h3></div><span>Este mes</span></div><div id="categoryBars"></div></article></div><div class="feature-grid bottom-features"><article class="feature-card simulator"><div class="feature-head"><div><label>SIMULADOR</label><h3>¿Cuánto puedes ahorrar?</h3></div><span class="spark">◌</span></div><div class="sim-row"><label>Ingreso mensual<input id="simIncome" type="range" min="1000000" max="15000000" step="100000" value="4500000"></label><b id="simIncomeValue">$4.500.000</b></div><div class="sim-row"><label>Porcentaje de ahorro<input id="simRate" type="range" min="5" max="50" value="20"></label><b id="simRateValue">20%</b></div><div class="sim-result"><small>Podrías ahorrar</small><strong id="simResult">$900.000</strong><span>al mes</span></div></article><article class="feature-card ai-mini"><div class="ai-mini-orb">✦</div><label>IA FINANCIERA</label><h3>Una mirada rápida</h3><p id="aiDynamic">Analizando tus movimientos…</p><button class="primary" id="refreshAI">Analizar de nuevo</button></article></div>`;anchor.after(sec);$('#quickMove').onclick=()=>openMovementModal();$('#newGoal').onclick=()=>openGoalModal();$('#refreshAI').onclick=()=>updateAI(true);setupSimulator();renderGoals();renderAchievements();renderCalendar();renderCategories();updateAI();refreshStats();
  }
  function setupSimulator(){const inc=$('#simIncome'),rate=$('#simRate');if(!inc||!rate)return;const update=()=>{const i=Number(inc.value),r=Number(rate.value),res=i*r/100;$('#simIncomeValue').textContent=money(i);$('#simRateValue').textContent=r+'%';$('#simResult').textContent=money(res)};inc.oninput=rate.oninput=update;update()}
  internalEnhancements();
  if(isDashboard){refreshStats();renderMovements();renderAlerts();updateAI();renderChart();}
  else {renderInternalPage();}
  if(!isDashboard){setTimeout(()=>{$$('.list-card').forEach(card=>{const items=$$('.list-item',card);const head=$('.card-head',card);if(items.length>=3&&!$('.list-search',card)){const input=document.createElement('input');input.className='list-search';input.placeholder='Buscar…';head?.appendChild(input);input?.addEventListener('input',()=>{const q=input.value.toLowerCase();items.forEach(i=>i.classList.toggle('filtered-out',!i.textContent.toLowerCase().includes(q)))})}})},120)}
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
})();
(() => {
  'use strict';
  const $ = (s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-CO').replace(/,/g,'.');
  const movements=()=>read('ap-movements',[]);
  const goals=()=>read('ap-goals',[{id:1,name:'Viaje de fin de año',target:5000000,saved:3400000,icon:'✈'}]);
  const base={income:6200000,expense:2180000,saving:1940000,balance:4850000};
  const totals=()=>movements().reduce((a,x)=>{const v=Number(x.value)||0;if(x.type==='ingreso')a.income+=v;if(x.type==='gasto')a.expense+=v;if(x.type==='ahorro')a.saving+=v;return a},{...base});
  let total=totals(); total.balance=base.balance+(total.income-base.income)-(total.expense-base.expense)-(total.saving-base.saving);
  const page=location.pathname.split('/').pop()||'index.html';
  const isDash=page==='index.html'||page==='';
  const pageType=page==='ingresos.html'?'ingreso':page==='gastos.html'?'gasto':page==='ahorros.html'?'ahorro':null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  function modal(id,html){
    let m=$('#'+id); if(m)return m;
    m=document.createElement('div');m.id=id;m.className='modal-backdrop';m.innerHTML=`<div class="modal modal-wide"><button class="modal-close" aria-label="Cerrar">×</button>${html}</div>`;document.body.appendChild(m);
    const close=()=>m.classList.remove('show');$('.modal-close',m).onclick=close;m.onclick=e=>{if(e.target===m)close()};return m;
  }

  // ---------- Budget ----------
  function budgetValue(){return Number(localStorage.getItem('ap-budget')||3000000)}
  function budgetModal(){
    const m=modal('budgetModal',`<div class="eyebrow">PRESUPUESTO MENSUAL</div><h3>Controla cuánto puedes gastar</h3><p class="modal-help">Define un límite mensual. Ahorra y Prospera calculará automáticamente tu progreso y alertas.</p><label class="field-label">Presupuesto<input id="budgetInput" type="number" min="1" step="10000" value="${budgetValue()}"></label><div class="budget-preview" id="budgetPreview"></div><button class="primary" id="saveBudget">Guardar presupuesto →</button>`);
    const input=$('#budgetInput',m), preview=$('#budgetPreview',m);
    const update=()=>{const b=Number(input.value)||0,p= b?Math.min(100,total.expense/b*100):0;preview.innerHTML=`<div><span>Gastado</span><b>${money(total.expense)}</b></div><div><span>Disponible</span><b>${money(Math.max(0,b-total.expense))}</b></div><div class="budget-progress"><i><b style="width:${p}%"></b></i><small>${Math.round(p)}% utilizado</small></div>`};
    input.oninput=update;update();$('#saveBudget',m).onclick=()=>{const v=Number(input.value);if(!v||v<1){toast('Ingresa un presupuesto válido');return}localStorage.setItem('ap-budget',v);m.classList.remove('show');renderBudget();renderSmartExtras();toast('Presupuesto actualizado ✓')};return m;
  }
  function renderBudget(){
    if(!isDash)return;
    let box=$('#budgetWidget');
    if(!box){const anchor=$('.v5-features')||$('.grid.lower')||$('main');if(!anchor)return;box=document.createElement('section');box.id='budgetWidget';box.className='smart-section';anchor.before(box)}
    const b=budgetValue(),spent=total.expense,p=Math.min(100,Math.round(spent/b*100)),left=Math.max(0,b-spent),status=p>=100?'Presupuesto superado':p>=80?'Cuidado: te acercas al límite':'Vas bien con tu presupuesto';
    box.innerHTML=`<div class="smart-head"><div><label>CONTROL MENSUAL</label><h2>Presupuesto <i>sin sorpresas.</i></h2><p>${status}. Tienes ${money(left)} disponibles.</p></div><button class="primary" id="editBudget">Editar presupuesto</button></div><div class="budget-card"><div class="budget-main"><span>GASTADO ESTE MES</span><strong>${money(spent)}</strong><small>de ${money(b)}</small></div><div class="budget-ring" style="--p:${p*3.6}deg"><b>${p}%</b><small>utilizado</small></div><div class="budget-bar"><div><span>Progreso</span><b>${money(left)} restantes</b></div><i><b style="width:${p}%"></b></i></div></div>`;
    $('#editBudget').onclick=()=>budgetModal().classList.add('show');
  }

  // ---------- Dynamic category analysis ----------
  function renderSmartExtras(){
    if(!isDash)return;
    let box=$('#categoryWidget');if(!box){const anchor=$('.v5-features');if(!anchor)return;box=document.createElement('section');box.id='categoryWidget';box.className='smart-section';anchor.after(box)}
    const data={Alimentación:620000,Vivienda:520000,Transporte:310000,Entretenimiento:180000,Compras:180000,Servicios:0,Educación:0,Otros:0};
    movements().filter(x=>x.type==='gasto').forEach(x=>data[x.cat]=(data[x.cat]||0)+Number(x.value||0));
    const rows=Object.entries(data).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,6);const max=rows[0]?.[1]||1;
    box.innerHTML=`<div class="smart-head"><div><label>ANÁLISIS DE GASTOS</label><h2>Descubre <i>dónde se va.</i></h2><p>Distribución de tus gastos por categoría.</p></div><a class="primary" href="gastos.html">Ver gastos →</a></div><div class="category-grid">${rows.map(([k,v],i)=>`<article><div><span>${['🍔','🏠','🚌','🎮','🛒','📌'][i]||'•'} ${esc(k)}</span><b>${money(v)}</b></div><i><b style="width:${Math.round(v/max*100)}%"></b></i><small>${total.expense?Math.round(v/total.expense*100):0}% del gasto</small></article>`).join('')}</div>`;
  }

  // ---------- Goal management ----------
  function goalManager(){
    const m=modal('goalManager',`<div class="eyebrow">METAS DE AHORRO</div><h3>Haz crecer tus objetivos</h3><p class="modal-help">Puedes aportar dinero a una meta o crear una nueva.</p><div id="goalManagerList" class="goal-manager-list"></div><div class="goal-create-grid"><input id="gmName" placeholder="Nueva meta"><input id="gmTarget" type="number" min="1" placeholder="Objetivo"><button class="primary" id="gmCreate">Crear</button></div>`);
    const render=()=>{const gs=goals();$('#goalManagerList',m).innerHTML=gs.map(g=>{const p=Math.min(100,Math.round(g.saved/g.target*100));return `<div class="gm-row"><div class="goal-icon">${g.icon||'◎'}</div><div class="gm-info"><b>${esc(g.name)}</b><small>${money(g.saved)} / ${money(g.target)} · ${p}%</small><i><b style="width:${p}%"></b></i></div><button data-deposit="${g.id}">+ Aportar</button></div>`}).join('');
      $$('[data-deposit]',m).forEach(btn=>btn.onclick=()=>depositGoal(Number(btn.dataset.deposit)));
    };
    $('#gmCreate',m).onclick=()=>{const name=$('#gmName',m).value.trim(),target=Number($('#gmTarget',m).value);if(!name||!target){toast('Completa nombre y objetivo');return}const gs=goals();gs.unshift({id:Date.now(),name,target,saved:0,icon:'◎'});save('ap-goals',gs.slice(0,8));$('#gmName',m).value='';$('#gmTarget',m).value='';render();window.renderGoals?.();toast('Nueva meta creada 🎯')};render();return m;
  }
  function depositGoal(id){
    const gs=goals(),g=gs.find(x=>x.id===id);if(!g)return;const amount=Number(prompt(`¿Cuánto quieres aportar a "${g.name}"?`,`100000`));if(!amount||amount<1)return;g.saved=Math.min(g.target,g.saved+amount);save('ap-goals',gs);window.renderGoals?.();renderSmartExtras();toast(g.saved>=g.target?'¡Meta completada! 🏆':'Aporte registrado ✓');const m=$('#goalManager');if(m)m.classList.remove('show');
  }
  function addGoalButton(){
    if(!isDash)return;const btn=$('#newGoal');if(btn){btn.onclick=()=>goalManager().classList.add('show')}
    const goalCard=$('.goal');if(goalCard&&!$('.goal-manage-btn',goalCard)){const b=document.createElement('button');b.className='mini-link goal-manage-btn';b.textContent='Administrar';b.onclick=()=>goalManager().classList.add('show');$('.head',goalCard)?.append(b)}
  }

  // ---------- Export ----------
  function exportCSV(){
    const rows=movements();const header=['Fecha','Tipo','Descripción','Categoría','Valor'];const lines=[header,...rows.map(x=>[x.date||'',x.type,x.name,x.cat||'Otros',x.value])].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','));
    const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ahorra-y-prospera-movimientos.csv';a.click();URL.revokeObjectURL(url);toast('Archivo CSV exportado ✓');
  }
  function addExportButton(){
    const actions=$('.actions');if(!actions||$('.export-btn'))return;const b=document.createElement('button');b.className='icon-btn export-btn';b.title='Exportar movimientos';b.textContent='⇩';b.onclick=exportCSV;actions.insertBefore(b,actions.firstChild);
  }

  // ---------- Investment simulator ----------
  function investmentPanel(){
    const m=modal('investmentPanel',`<div class="eyebrow">SIMULADOR EDUCATIVO</div><h3>Imagina tu inversión</h3><p class="modal-help">Simulación simple para aprender. No es una recomendación financiera.</p><div class="invest-grid"><label class="field-label">Capital inicial<input id="ivCapital" type="number" value="1000000" min="1"></label><label class="field-label">Aporte mensual<input id="ivMonthly" type="number" value="200000" min="0"></label><label class="field-label">Rendimiento anual estimado (%)<input id="ivRate" type="number" value="8" min="0" max="100" step="0.1"></label><label class="field-label">Años<input id="ivYears" type="number" value="5" min="1" max="30"></label></div><div id="ivResult" class="investment-result"></div><button class="primary" id="ivCalc">Calcular escenario →</button>`);
    const calc=()=>{const c=Number($('#ivCapital',m).value)||0,mo=Number($('#ivMonthly',m).value)||0,r=(Number($('#ivRate',m).value)||0)/100/12,y=Number($('#ivYears',m).value)||1,n=y*12;const future=r?c*Math.pow(1+r,n)+mo*((Math.pow(1+r,n)-1)/r):c+mo*n,contrib=c+mo*n,gain=future-contrib;$('#ivResult',m).innerHTML=`<div><span>Capital aportado</span><b>${money(contrib)}</b></div><div><span>Valor simulado</span><b>${money(future)}</b></div><div><span>Crecimiento estimado</span><b>${money(gain)}</b></div>`};$('#ivCalc',m).onclick=calc;calc();return m;
  }
  function enhanceInvestments(){if(page!=='inversiones.html')return;const btn=$('[data-action="primary"]');if(btn){btn.textContent='Simular inversión';btn.onclick=e=>{e.preventDefault();investmentPanel().classList.add('show')}}}

  // ---------- Education ----------
  function enhanceEducation(){
    if(page!=='educacion.html')return;const main=$('main');if(!main||$('#educationLab'))return;const done=read('ap-lessons',{});const sec=document.createElement('section');sec.id='educationLab';sec.className='smart-section';const lessons=[['presupuesto','📊','Presupuesto inteligente','Aprende a repartir tus ingresos y priorizar tus gastos.'],['ahorro','🎯','Hábitos de ahorro','Convierte una meta en un plan semanal sencillo.'],['inversion','📈','Introducción a inversiones','Conoce conceptos como riesgo, plazo y diversificación.'],['deudas','🧾','Control de deudas','Organiza pagos y evita que las cuotas se salgan de control.']];sec.innerHTML=`<div class="smart-head"><div><label>APRENDE Y PROGRESA</label><h2>Educación <i>financiera.</i></h2><p>Lecciones cortas para tomar mejores decisiones con tu dinero.</p></div><span class="data-badge">${Object.values(done).filter(Boolean).length}/${lessons.length} completadas</span></div><div class="lesson-grid">${lessons.map(x=>`<article class="lesson ${done[x[0]]?'done':''}" data-lesson="${x[0]}"><span>${x[1]}</span><h3>${x[2]}</h3><p>${x[3]}</p><button>${done[x[0]]?'Repasar':'Comenzar'} →</button></article>`).join('')}</div>`;main.append(sec);$$('[data-lesson]',sec).forEach(card=>card.querySelector('button').onclick=()=>{const key=card.dataset.lesson;const d=read('ap-lessons',{});d[key]=true;save('ap-lessons',d);card.classList.add('done');card.querySelector('button').textContent='Completada ✓';toast('Lección completada 🎓')});
  }

  // ---------- AI assistant ----------
  function enhanceAI(){
    if(page!=='ia-financiera.html')return;const main=$('main');if(!main||$('#aiLab'))return;const sec=document.createElement('section');sec.id='aiLab';sec.className='smart-section';const rate=Math.round(Math.max(0,(total.income-total.expense)/Math.max(total.income,1)*100));const qs=['¿Cómo puedo ahorrar más?','¿Dónde estoy gastando más?','¿Cómo va mi salud financiera?','¿Qué debería revisar hoy?'];sec.innerHTML=`<div class="smart-head"><div><label>ASISTENTE FINANCIERO</label><h2>Tu análisis, <i>en segundos.</i></h2><p>Consejos basados en los datos guardados en este navegador.</p></div><span class="ai-live">● ACTIVO</span></div><div class="ai-chat"><div class="ai-message"><span>✦</span><div><b>Hola, soy tu asistente.</b><p>Puedo analizar tus gastos, ahorro, metas y presupuesto.</p></div></div><div id="aiResponse" class="ai-response">Tu capacidad de ahorro estimada es del <b>${rate}%</b>.</div><div class="ai-questions">${qs.map((q,i)=>`<button data-q="${i}">${q}</button>`).join('')}</div></div>`;main.append(sec);const responses=[`Tu capacidad de ahorro estimada es del ${rate}%. Revisa gastos repetitivos y dirige una parte del margen hacia una meta.`,`La categoría con mayor peso es Alimentación. Comparar ese gasto semana a semana puede revelar oportunidades.`,`Tu balance disponible es ${money(total.balance)}. Mantienes un margen positivo entre ingresos y gastos.`,`Hoy conviene revisar tu presupuesto y tus movimientos recientes antes de registrar nuevos gastos.`];$$('[data-q]',sec).forEach(b=>b.onclick=()=>{$('#aiResponse',sec).innerHTML=responses[Number(b.dataset.q)];toast('Análisis actualizado ✦')});
  }

  // ---------- Internal page smart panels ----------
  function enhanceInternal(){
    if(isDash||!pageType)return;const main=$('main');if(!main||$('#internalTools'))return;const sec=document.createElement('section');sec.id='internalTools';sec.className='smart-section';const t=total;let content='';
    if(pageType==='gasto')content=`<div class="smart-head"><div><label>CONTROL DE GASTOS</label><h2>Gasta con <i>intención.</i></h2><p>Tu presupuesto mensual es ${money(budgetValue())} y llevas ${money(t.expense)} gastados.</p></div><button class="primary" id="budgetInternal">Configurar presupuesto</button></div><div class="internal-metrics"><article><span>Utilizado</span><b>${Math.min(100,Math.round(t.expense/budgetValue()*100))}%</b></article><article><span>Disponible</span><b>${money(Math.max(0,budgetValue()-t.expense))}</b></article><article><span>Mayor categoría</span><b>Alimentación</b></article></div>`;
    if(pageType==='ingreso')content=`<div class="smart-head"><div><label>INGRESOS</label><h2>Fortalece tus <i>fuentes.</i></h2><p>Tienes ${money(t.income)} registrados y puedes diversificar tus entradas.</p></div><a class="primary" href="gastos.html">Controlar gastos →</a></div><div class="internal-metrics"><article><span>Total</span><b>${money(t.income)}</b></article><article><span>Promedio base</span><b>${money(t.income/6)}</b></article><article><span>Meta sugerida</span><b>${money(t.income*.2)}</b></article></div>`;
    if(pageType==='ahorro')content=`<div class="smart-head"><div><label>PLAN DE AHORRO</label><h2>Haz que cada aporte <i>cuente.</i></h2><p>Tu ahorro registrado es ${money(t.saving)}. Administra tus metas desde aquí.</p></div><button class="primary" id="goalsInternal">Administrar metas</button></div><div class="internal-metrics"><article><span>Ahorro</span><b>${money(t.saving)}</b></article><article><span>Capacidad estimada</span><b>${Math.round(Math.max(0,(t.income-t.expense)/Math.max(t.income,1)*100))}%</b></article><article><span>Metas activas</span><b>${goals().length}</b></article></div>`;
    sec.innerHTML=content;main.append(sec);$('#budgetInternal')?.addEventListener('click',()=>budgetModal().classList.add('show'));$('#goalsInternal')?.addEventListener('click',()=>goalManager().classList.add('show'));
  }

  // ---------- Global quick actions ----------
  function enhanceQuickActions(){
    $$('.quick-actions').forEach(box=>{if(!box||$('.export-mini',box))return;const b=document.createElement('button');b.className='primary export-mini';b.textContent='⇩ Exportar';b.onclick=exportCSV;box.append(b)});
    $$('[data-action="primary"]').forEach(btn=>{if(page==='inversiones.html'||page==='educacion.html'||page==='ia-financiera.html'||page==='configuracion.html')return; if(pageType)btn.onclick=e=>{e.preventDefault();window.openMovementModal?.(pageType)} });
  }

  // ---------- Settings ----------
  function enhanceSettings(){
    if(page!=='configuracion.html')return;const main=$('main');if(!main||$('#settingsPro'))return;const sec=document.createElement('section');sec.id='settingsPro';sec.className='smart-section';sec.innerHTML=`<div class="smart-head"><div><label>HERRAMIENTAS</label><h2>Tu información, <i>bajo control.</i></h2><p>Administra los datos locales de Ahorra y Prospera.</p></div></div><div class="settings-tools"><button id="exportSettings" class="primary">⇩ Exportar movimientos</button><button id="resetLessons" class="secondary-btn">Reiniciar cursos</button><button id="resetEverything" class="danger-btn">Borrar datos creados</button></div>`;main.append(sec);$('#exportSettings').onclick=exportCSV;$('#resetLessons').onclick=()=>{localStorage.removeItem('ap-lessons');location.reload()};$('#resetEverything').onclick=()=>{if(confirm('¿Seguro que quieres borrar movimientos, metas, presupuesto y progreso educativo?')){['ap-movements','ap-goals','ap-budget','ap-lessons'].forEach(k=>localStorage.removeItem(k));location.reload()}};
  }

  // ---------- Notification count ----------
  function dynamicNotification(){
    const dot=$('.notification-dot');if(!dot)return;const alerts=[];if(total.expense>=budgetValue()*.8)alerts.push('Presupuesto cerca del límite');if(goals().some(g=>g.saved>=g.target))alerts.push('Tienes una meta completada');if(movements().length)alerts.push('Datos actualizados');dot.title=alerts.join(' · ')||'Sin alertas nuevas';
  }

  window.apV7Refresh=()=>{total=totals();total.balance=base.balance+(total.income-base.income)-(total.expense-base.expense)-(total.saving-base.saving);renderBudget();renderSmartExtras();dynamicNotification();syncGoalHero();};
  function syncGoalHero(){const card=$('.goal');const g=goals()[0];if(!card||!g)return;const p=Math.min(100,Math.round(g.saved/g.target*100));const title=$('.head h3',card);if(title)title.textContent=g.name;const ring=$('.ring',card);if(ring){ring.style.setProperty('--goal-p',p+'%');const b=$('.ring b',card);if(b)b.textContent=p+'%'}const vals=$$('.between span',card);if(vals.length>=2){vals[0].textContent=money(g.saved);vals[1].textContent=money(g.target)}const prog=$('.progress i',card);if(prog)prog.style.width=p+'%';const text=$('.goal-center + .between + .progress + p',card);if(text)text.innerHTML=p>=100?'¡Meta completada! 🎉':'Te faltan <strong>'+money(Math.max(0,g.target-g.saved))+'</strong> para alcanzar tu meta.';}
  addExportButton();renderBudget();renderSmartExtras();addGoalButton();enhanceInvestments();enhanceEducation();enhanceAI();enhanceInternal();enhanceQuickActions();enhanceSettings();dynamicNotification();syncGoalHero();
})();
