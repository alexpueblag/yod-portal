(function(){
  'use strict';

  var CATALOG_ENDPOINT='https://script.google.com/macros/s/AKfycby5LKYKRwl0EsNgppOIeD_ArST8vSXRgNO4ns8XZbFW4yjfglzu4io_vhabB8h-J792Tw/exec?action=read&resource=Portal';
  var PORTERO_ENDPOINT='https://script.google.com/macros/s/AKfycbwlDDCWWzOWYZsUpBU9uqsQ7aenQ469PF6s6FkNlBFS1_cJSU5njG9oQmuyELy5zlqzFg/exec';
  var TOKEN_KEY='pyod_clave_v1';
  var ICONS={
    'SYS-POTENCIALES':'map-2','SYS-TRACK':'route','SYS-MIRAMAR':'building-community',
    'SYS-TAREAS':'checklist','SYS-FLUJO':'wallet','SYS-INTERIORES':'armchair-2',
    'SYS-INVERSION':'presentation-analytics','SYS-MARKETING':'speakerphone','SYS-OBRA':'building-skyscraper'
  };
  var state={modules:[],rawRows:[],role:'vista',boards:'',profileReady:false,loading:false};
  var $=function(id){return document.getElementById(id);};

  function greeting(){var h=new Date().getHours();return h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';}
  function timeLabel(date){return new Intl.DateTimeFormat('es-MX',{hour:'2-digit',minute:'2-digit'}).format(date);}
  function setConnection(kind,text){var el=$('connection');el.className='connection '+kind;el.innerHTML='<i class="ti ti-'+(kind==='ok'?'cloud-check':kind==='error'?'cloud-off':'loader-2 spin')+'"></i> '+text;}
  function safeText(value){return String(value==null?'':value);}
  function initials(name){return safeText(name).split(/\s+/).filter(Boolean).slice(0,2).map(function(v){return v.charAt(0);}).join('').toUpperCase()||'YO';}
  function money(value){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(value)||0);}
  function percent(value){return new Intl.NumberFormat('es-MX',{style:'percent',maximumFractionDigits:0}).format(Number(value)||0);}

  function moduleNode(row){
    var url=window.PortalCore.resolveUrl(row);if(!url)return null;
    var link=document.createElement('a');link.className='module-card';link.href=url;link.rel='noopener';
    var top=document.createElement('div');top.className='module-top';
    var icon=document.createElement('span');icon.className='module-icon';icon.innerHTML='<i class="ti ti-'+(ICONS[row.system_id]||window.PortalCore.safeIcon(row.icono))+'"></i>';
    var status=document.createElement('span');status.className='module-state';status.textContent='Disponible';top.append(icon,status);
    var title=document.createElement('h3');title.textContent=safeText(row.titulo_portal)||safeText(row.system_id);
    var desc=document.createElement('p');desc.textContent=safeText(row.descripcion_portal)||'Abrir espacio de trabajo.';
    var foot=document.createElement('footer');var audience=document.createElement('span');audience.textContent=safeText(row.audiencia)||'Equipo autorizado';var arrow=document.createElement('i');arrow.className='ti ti-arrow-up-right';foot.append(audience,arrow);
    link.append(top,title,desc,foot);return link;
  }

  function sidebarNode(row){
    var url=window.PortalCore.resolveUrl(row);if(!url)return null;
    var a=document.createElement('a');a.className='nav-item';a.href=url;a.rel='noopener';a.dataset.systemId=row.system_id;
    var i=document.createElement('i');i.className='ti ti-'+(ICONS[row.system_id]||window.PortalCore.safeIcon(row.icono));
    var s=document.createElement('span');s.textContent=safeText(row.titulo_portal)||safeText(row.system_id);
    a.append(i,s);return a;
  }
  function renderSidebarModules(){
    var box=$('nav-modules');if(!box)return;box.replaceChildren();
    if(!state.profileReady){var h=document.createElement('span');h.className='nav-loading';h.textContent='Inicia sesión para ver tus tableros';box.appendChild(h);return;}
    if(!state.modules.length){var e=document.createElement('span');e.className='nav-loading';e.textContent='Sin tableros disponibles';box.appendChild(e);return;}
    state.modules.forEach(function(row){var n=sidebarNode(row);if(n)box.appendChild(n);});
  }

  function renderModules(rows){
    var grid=$('module-grid');grid.replaceChildren();
    state.rawRows=Array.isArray(rows)?rows:state.rawRows;
    if(!state.profileReady){state.modules=[];var waiting=document.createElement('div');waiting.className='empty-state';waiting.textContent='Inicie sesión para consultar sus módulos autorizados.';grid.appendChild(waiting);grid.setAttribute('aria-busy','false');$('module-count').textContent='—';renderSidebarModules();return;}
    state.modules=window.PortalCore.cleanRows(state.rawRows).filter(function(row){return Boolean(window.PortalCore.resolveUrl(row))&&window.YodAccessPolicy.canOpen(state.boards,row.system_id,state.role);});
    state.modules.forEach(function(row){var node=moduleNode(row);if(node)grid.appendChild(node);});
    if(!grid.children.length){var empty=document.createElement('div');empty.className='empty-state';empty.textContent='No hay módulos disponibles en Control Maestro.';grid.appendChild(empty);}
    grid.setAttribute('aria-busy','false');$('module-count').textContent=String(state.modules.length);renderSidebarModules();buildSearch('');
  }

  async function loadCatalog(){
    if(state.loading)return;state.loading=true;$('refresh').disabled=true;var _mr=$('mobile-refresh');if(_mr)_mr.disabled=true;setConnection('','Actualizando');
    var controller=new AbortController();var timeout=setTimeout(function(){controller.abort();},9000);
    try{
      var response=await fetch(CATALOG_ENDPOINT+'&cb='+Date.now(),{cache:'no-store',credentials:'omit',signal:controller.signal});
      if(!response.ok)throw new Error('HTTP '+response.status);var data=await response.json();
      if(!data.ok||!Array.isArray(data.rows))throw new Error('Respuesta incompleta');
      renderModules(data.rows);$('updated-at').textContent='Hoy, '+timeLabel(new Date());setConnection('ok','En línea');
    }catch(error){
      setConnection('error','Sin conexión');$('updated-at').textContent='No se pudo actualizar';
      if(!state.modules.length){var grid=$('module-grid');grid.setAttribute('aria-busy','false');grid.innerHTML='<div class="empty-state">Control Maestro no respondió. Por seguridad no se habilitaron enlaces. Intente actualizar nuevamente.</div>';}
    }finally{clearTimeout(timeout);state.loading=false;$('refresh').disabled=false;var _mr2=$('mobile-refresh');if(_mr2)_mr2.disabled=false;}
  }

  async function loadIdentity(){
    var token='';try{token=localStorage.getItem(TOKEN_KEY)||'';}catch(_error){}
    if(!token){$('access-status').textContent='Requiere acceso';state.profileReady=false;return;}
    try{
      var response=await fetch(PORTERO_ENDPOINT+'?recurso=canje&t='+encodeURIComponent(token),{cache:'no-store',credentials:'omit'});
      var raw=await response.text();var data=null;try{data=JSON.parse(raw);}catch(_p){}
      var diag=response.ok?(data===null?'respuesta-no-JSON':(data.ok?'':('canje:'+(data.error||'ok=false')))):('HTTP-'+response.status);
      if(!data||!data.ok){console.warn('[YOD OS] canje falló →',diag,{status:response.status,muestra:String(raw).slice(0,200)});var e2=new Error(diag);e2._diag=diag;throw e2;}
      state.role=data.rol||'vista';state.boards=data.boards||'';state.profileReady=true;
      state.personName=String(data.nombre||'').trim();
      var name=data.nombre||data.correo||'Equipo YOD';$('user-name').textContent=name;$('user-role').textContent=state.role;$('avatar').textContent=initials(name);$('first-name').textContent=name.split(/\s|@/)[0];$('access-status').textContent=state.role==='admin'?'Dirección':'Autorizado';
      var persona=state.role==='admin'?'direccion':'colaborador';
      document.documentElement.setAttribute('data-persona',persona);
      var chip=$('role-chip');chip.className='role-chip '+persona;chip.textContent=persona==='direccion'?'Dirección':'Colaborador';
      $('user-role').textContent=persona==='direccion'?'Dirección':'Colaborador';
      if(persona==='direccion'){$('hero-eyebrow').textContent='Centro de operación';$('hero-copy').textContent='Un solo acceso para entrar a la operación completa, sin mover ni duplicar la información de sus tableros.';}
      else{$('hero-eyebrow').textContent='Tu espacio de trabajo';$('hero-copy').textContent='Tus módulos y tus pendientes de la semana, en un solo lugar. Abre lo que necesites.';}
      document.querySelectorAll('.admin-only').forEach(function(el){el.classList.toggle('hidden',state.role!=='admin');});
      var visibleQuick=0;document.querySelectorAll('.quick-card[data-system-id]').forEach(function(el){var allowed=window.YodAccessPolicy.canOpen(state.boards,el.dataset.systemId,state.role);el.classList.toggle('hidden',!allowed);if(allowed)visibleQuick++;});$('quick-section').classList.toggle('hidden',visibleQuick===0);
      if(state.rawRows.length)renderModules(state.rawRows);
      var requests=[loadPulse(token)];if(window.YodAccessPolicy.hasCode(state.boards,'TA')||state.role==='admin')requests.push(loadOperations(token));else renderOperationsLocked();await Promise.allSettled(requests);
    }catch(err){var d=(err&&err._diag)||'error';$('user-role').textContent='Sesión por validar';$('access-status').textContent='Pendiente ('+d+')';$('access-status').title='Diagnóstico del canje: '+d+' — revisa la consola para el detalle.';console.warn('[YOD OS] identidad no validada:',d,err);}
  }

  function renderOperationsLocked(){var panel=$('operation-panel');panel.setAttribute('aria-busy','false');panel.innerHTML='<div class="operation-message"><i class="ti ti-shield-lock"></i><span>Operación semanal no está incluida en los permisos de esta cuenta.</span></div>';}

  // Conciliación de identidad (solo Dirección): cruza los responsables del board
  // contra las personas de Accesos, para cazar los "cruces" — nombres del board
  // que no corresponden a ninguna cuenta, y personas sin tareas a su nombre.
  async function loadReconcile(token){
    var section=$('reconcile');if(!section)return;
    try{
      var url=PORTERO_ENDPOINT+'?recurso=accesos-lista&k='+encodeURIComponent(token)+'&cb='+Date.now();
      var resp=await fetch(url,{cache:'no-store',credentials:'omit'});var data=await resp.json();
      if(!data||!data.ok||!Array.isArray(data.usuarios))return;
      var personas=data.usuarios.filter(function(u){return String(u.estado||'').toLowerCase()==='activo';});
      var tasks=state.allTasks||[];
      var responsables=[];var vistos={};
      tasks.forEach(function(t){var r=String(t&&t.responsable||'').trim();if(r&&!vistos[r.toLowerCase()]){vistos[r.toLowerCase()]=1;responsables.push(r);}});
      // Responsables del board sin cuenta en Accesos
      var huerfanos=responsables.filter(function(r){return !personas.some(function(p){return window.YodOperations.isMine(r,p.nombre||p.correo);});});
      // Personas de Accesos (con TA) sin ninguna tarea a su nombre
      var conTA=personas.filter(function(p){var b=String(p.boards||'');return b.trim()==='*'||b.toUpperCase().split(/[,;| ]+/).indexOf('TA')>-1||String(p.rol||'').toLowerCase()==='admin';});
      var sinTareas=conTA.filter(function(p){return !responsables.some(function(r){return window.YodOperations.isMine(r,p.nombre||p.correo);});});
      renderReconcile(huerfanos,sinTareas,responsables.length,personas.length);
    }catch(e){/* silencioso: es una ayuda, no debe romper la home */}
  }
  function renderReconcile(huerfanos,sinTareas,nResp,nPers){
    var section=$('reconcile'),panel=$('reconcile-panel');if(!section||!panel)return;
    if(!huerfanos.length&&!sinTareas.length){
      section.classList.remove('hidden');
      panel.innerHTML='<div class="reconcile-ok"><i class="ti ti-circle-check"></i><span>Todo cuadra: los '+nResp+' responsables del board corresponden a personas en Accesos.</span></div>';
      return;
    }
    section.classList.remove('hidden');panel.replaceChildren();
    if(huerfanos.length){
      var b1=document.createElement('div');b1.className='reconcile-block warn';
      b1.innerHTML='<h3><i class="ti ti-alert-triangle"></i> Nombres en el board sin cuenta en Accesos</h3><p>Estas personas aparecen como «responsable» en tareas, pero su nombre no coincide con nadie en Accesos. No verán sus tareas en su resumen hasta que el nombre coincida (o se den de alta).</p>';
      var ul=document.createElement('div');ul.className='reconcile-chips';
      huerfanos.forEach(function(n){var c=document.createElement('span');c.className='reconcile-chip';c.textContent=n;ul.appendChild(c);});
      b1.appendChild(ul);panel.appendChild(b1);
    }
    if(sinTareas.length){
      var b2=document.createElement('div');b2.className='reconcile-block';
      b2.innerHTML='<h3><i class="ti ti-user-off"></i> Personas con acceso a Operación sin tareas a su nombre</h3><p>Tienen el tablero, pero no hay tareas donde el «responsable» coincida con su nombre. Puede ser normal, o que el nombre esté escrito distinto en el board.</p>';
      var ul2=document.createElement('div');ul2.className='reconcile-chips';
      sinTareas.forEach(function(p){var c=document.createElement('span');c.className='reconcile-chip muted';c.textContent=p.nombre||p.correo;ul2.appendChild(c);});
      b2.appendChild(ul2);panel.appendChild(b2);
    }
  }

  function taskDueLabel(task){var days=window.YodOperations.daysUntil(task);if(days==null)return {text:'Sin fecha',overdue:false};if(days<0)return {text:Math.abs(days)+' d vencida',overdue:true};if(days===0)return {text:'Vence hoy',overdue:false};return {text:'En '+days+' d',overdue:false};}
  function renderOperations(result){
    var panel=$('operation-panel'),summary=result.summary;panel.replaceChildren();panel.setAttribute('aria-busy','false');
    if(result.source==='cache'){var note=document.createElement('div');note.className='operation-note';note.innerHTML='<i class="ti ti-history"></i><span>Mostrando el último resumen guardado en este dispositivo. La consulta en vivo no respondió; abre el tablero para reintentar.</span>';panel.appendChild(note);}
    var metrics=document.createElement('div');metrics.className='operation-metrics';[['Abiertas',summary.open],['Vencidas',summary.overdue],['Próximos 7 días',summary.dueSoon],['En revisión',summary.review]].forEach(function(item){var box=document.createElement('div');box.className='operation-metric';var label=document.createElement('span');label.textContent=item[0];var value=document.createElement('strong');value.textContent=String(item[1]);box.append(label,value);metrics.appendChild(box);});panel.appendChild(metrics);
    var list=document.createElement('div');list.className='task-list';summary.priority.forEach(function(task){var row=document.createElement('div');row.className='task-row';var title=document.createElement('div');title.className='task-title';var strong=document.createElement('strong');strong.textContent=task.actividad||task.entregable||'Tarea sin título';var project=document.createElement('small');project.textContent=task.proyecto||task.empresa||'Sin proyecto';title.append(strong,project);var person=document.createElement('span');person.className='task-person';person.textContent=task.responsable||'Sin responsable';var status=document.createElement('span');status.className='task-status';status.textContent=window.YodOperations.normalizeStatus(task.estado);var dueInfo=taskDueLabel(task);var due=document.createElement('span');due.className='task-due'+(dueInfo.overdue?' overdue':'');due.textContent=dueInfo.text;row.append(title,person,status,due);list.appendChild(row);});
    if(!summary.priority.length){
      var empty=document.createElement('div');empty.className='operation-message';
      if(result.mine&&summary.total===0){
        empty.innerHTML='<i class="ti ti-user-question"></i><span>No encontramos tareas a tu nombre'+(result.totalEquipo?(' (el equipo tiene '+result.totalEquipo+'). Si esperabas ver las tuyas, revisa que tu nombre en Accesos coincida con el de «responsable» en el tablero.'):'.')+'</span>';
      }else if(result.mine){
        empty.textContent='No tienes tareas abiertas. Todo al día.';
      }else{
        empty.textContent='No hay tareas abiertas que requieran atención.';
      }
      list.appendChild(empty);
    }panel.appendChild(list);
  }
  async function loadOperations(token){
    var panel=$('operation-panel');panel.setAttribute('aria-busy','true');
    try{
      var result=await window.YodOperations.load(token);
      var esAdmin=state.role==='admin';
      state.allTasks=Array.isArray(result.tasks)?result.tasks:[];
      if(esAdmin)loadReconcile(token);
      // Título honesto según el rol
      var titulo=$('operation-title'),eyebrow=titulo&&titulo.closest('.section-head')?titulo.closest('.section-head').querySelector('.eyebrow'):null;
      if(esAdmin){ if(titulo)titulo.textContent='Operación semanal';
      }else{
        // Colaborador: solo SUS tareas (match por responsable)
        var mias=window.YodOperations.tasksForPerson(result.tasks,state.personName||'');
        result={tasks:mias,summary:window.YodOperations.summarize(mias),updatedAt:result.updatedAt,source:result.source,mine:true,personName:state.personName,totalEquipo:(result.tasks||[]).length};
        if(titulo)titulo.textContent='Tus tareas de la semana';
        if(eyebrow)eyebrow.textContent='Solo lo tuyo';
      }
      renderOperations(result);
    }
    catch(error){
      var diag=(error&&(error._diag||error.message))||'error';
      panel.setAttribute('aria-busy','false');
      panel.innerHTML='<div class="operation-message"><i class="ti ti-shield-lock"></i><span>No se pudo consultar Operación semanal con esta sesión ('+String(diag)+'). El tablero original permanece intacto.</span></div>';
      console.warn('[YOD OS] Operación no cargó →',diag,error);
    }
  }

  function pulseMetric(label,value,note,kind){var box=document.createElement('div');box.className='pulse-metric'+(kind?' '+kind:'');var name=document.createElement('span');name.textContent=label;var strong=document.createElement('strong');strong.textContent=value;box.append(name,strong);if(note){var small=document.createElement('small');small.textContent=note;box.appendChild(small);}return box;}
  function renderPulseError(cardId,panelId,label){var card=$(cardId),panel=$(panelId);card.setAttribute('aria-busy','false');panel.innerHTML='<div class="pulse-message"><i class="ti ti-cloud-off"></i><span>No se pudo consultar '+label+' en línea. Use Actualizar para reintentar.</span></div>';}
  function renderFinance(result){var card=$('finance-card'),panel=$('finance-panel'),s=result.summary;card.setAttribute('aria-busy','false');panel.replaceChildren();var grid=document.createElement('div');grid.className='pulse-metrics';grid.append(pulseMetric('Saldo actual',money(s.balance),s.updatedAt||'Fuente: Flujo YOD'),pulseMetric('Pagos pendientes',money(s.payments),s.paymentsCount+' registrados'),pulseMetric('Ingresos esperados',money(s.income),s.incomeCount+' registrados'),pulseMetric('Saldo proyectado',money(s.projected),'Saldo + ingresos − pagos',s.projected<0?'negative':'positive'));panel.appendChild(grid);}
  function renderMarketing(result){var card=$('marketing-card'),panel=$('marketing-panel'),s=result.summary;card.setAttribute('aria-busy','false');panel.replaceChildren();var grid=document.createElement('div');grid.className='pulse-metrics';grid.append(pulseMetric('Leads',String(s.leads),s.period||'Periodo activo'),pulseMetric('Citas',String(s.appointments),percent(s.appointmentRate)+' de leads'),pulseMetric('Clientes',String(s.clients),percent(s.clientRate)+' de leads'),pulseMetric('Sin tocar 24 h',String(s.untouched24h),'Requieren seguimiento',s.untouched24h>0?'alert':''));panel.appendChild(grid);}
  async function loadFinance(token){try{renderFinance(await window.YodFinance.load(token));}catch(_error){renderPulseError('finance-card','finance-panel','Tesorería');}}
  async function loadMarketing(token){try{renderMarketing(await window.YodMarketing.load(token));}catch(_error){renderPulseError('marketing-card','marketing-panel','Marketing');}}
  async function loadPulse(token){
    var financeAllowed=state.role==='admin';var marketingAllowed=state.role==='admin'||window.YodAccessPolicy.hasCode(state.boards,'MK');
    $('finance-card').classList.toggle('hidden',!financeAllowed);$('marketing-card').classList.toggle('hidden',!marketingAllowed);$('pulso').classList.toggle('hidden',!financeAllowed&&!marketingAllowed);
    var requests=[];if(financeAllowed)requests.push(loadFinance(token));if(marketingAllowed)requests.push(loadMarketing(token));await Promise.allSettled(requests);
  }

  function buildSearch(query){
    var box=$('search-results');box.replaceChildren();var term=safeText(query).trim().toLowerCase();
    var matches=state.modules.filter(function(row){return !term||[row.titulo_portal,row.descripcion_portal,row.audiencia].join(' ').toLowerCase().includes(term);});
    matches.forEach(function(row){var a=document.createElement('a');a.className='search-result';a.href=window.PortalCore.resolveUrl(row);a.innerHTML='<i class="ti ti-'+(ICONS[row.system_id]||'layout-dashboard')+'"></i>';var text=document.createElement('span');var strong=document.createElement('strong');strong.textContent=safeText(row.titulo_portal);var small=document.createElement('small');small.textContent=safeText(row.audiencia)||'Equipo autorizado';text.append(strong,small);a.appendChild(text);box.appendChild(a);});
    if(!matches.length){var empty=document.createElement('div');empty.className='empty-state';empty.textContent='No encontramos un módulo con ese nombre.';box.appendChild(empty);}
  }

  function openSearch(){var dialog=$('search-dialog');dialog.showModal();$('search-input').value='';buildSearch('');setTimeout(function(){$('search-input').focus();},0);}
  $('welcome-title').firstChild.textContent=greeting()+', ';
  function refreshAll(){loadCatalog();var token='';try{token=localStorage.getItem(TOKEN_KEY)||'';}catch(_error){}if(!token||!state.profileReady)return;loadPulse(token);if(window.YodAccessPolicy.hasCode(state.boards,'TA')||state.role==='admin')loadOperations(token);}
  $('refresh').addEventListener('click',refreshAll);var _mrb=$('mobile-refresh');if(_mrb)_mrb.addEventListener('click',refreshAll);$('search-trigger').addEventListener('click',openSearch);$('search-input').addEventListener('input',function(e){buildSearch(e.target.value);});
  document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}});
  // Cajón lateral en móvil (☰) — misma navegación que escritorio
  (function(){var shell=document.querySelector('.app-shell');var burger=$('menu-toggle');var scrim=$('nav-scrim');if(!shell)return;if(window.matchMedia&&window.matchMedia('(max-width:900px)').matches){var seen=false;try{seen=sessionStorage.getItem('yod_drawer_seen')==='1';}catch(e){}if(!seen){shell.classList.add('nav-open');try{sessionStorage.setItem('yod_drawer_seen','1');}catch(e){}}}function closeNav(){shell.classList.remove('nav-open');}if(burger)burger.addEventListener('click',function(){shell.classList.toggle('nav-open');});if(scrim)scrim.addEventListener('click',closeNav);document.addEventListener('keydown',function(e){if(e.key==='Escape')closeNav();});var nav=$('nav-modules');if(nav)nav.addEventListener('click',function(e){if(e.target.closest('.nav-item'))closeNav();});if(window.matchMedia){var mq=window.matchMedia('(min-width:901px)');mq.addEventListener('change',function(m){if(m.matches)closeNav();});}})();
  loadIdentity();loadCatalog();
})();
