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
  var state={modules:[],role:'vista',loading:false};
  var $=function(id){return document.getElementById(id);};

  function greeting(){var h=new Date().getHours();return h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';}
  function timeLabel(date){return new Intl.DateTimeFormat('es-MX',{hour:'2-digit',minute:'2-digit'}).format(date);}
  function setConnection(kind,text){var el=$('connection');el.className='connection '+kind;el.innerHTML='<i class="ti ti-'+(kind==='ok'?'cloud-check':kind==='error'?'cloud-off':'loader-2 spin')+'"></i> '+text;}
  function safeText(value){return String(value==null?'':value);}
  function initials(name){return safeText(name).split(/\s+/).filter(Boolean).slice(0,2).map(function(v){return v.charAt(0);}).join('').toUpperCase()||'YO';}

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

  function renderModules(rows){
    var grid=$('module-grid');grid.replaceChildren();
    state.modules=window.PortalCore.cleanRows(rows).filter(function(row){return Boolean(window.PortalCore.resolveUrl(row));});
    state.modules.forEach(function(row){var node=moduleNode(row);if(node)grid.appendChild(node);});
    if(!grid.children.length){var empty=document.createElement('div');empty.className='empty-state';empty.textContent='No hay módulos disponibles en Control Maestro.';grid.appendChild(empty);}
    grid.setAttribute('aria-busy','false');$('module-count').textContent=String(state.modules.length);buildSearch('');
  }

  async function loadCatalog(){
    if(state.loading)return;state.loading=true;$('refresh').disabled=true;$('mobile-refresh').disabled=true;setConnection('','Actualizando');
    var controller=new AbortController();var timeout=setTimeout(function(){controller.abort();},9000);
    try{
      var response=await fetch(CATALOG_ENDPOINT+'&cb='+Date.now(),{cache:'no-store',credentials:'omit',signal:controller.signal});
      if(!response.ok)throw new Error('HTTP '+response.status);var data=await response.json();
      if(!data.ok||!Array.isArray(data.rows))throw new Error('Respuesta incompleta');
      renderModules(data.rows);$('updated-at').textContent='Hoy, '+timeLabel(new Date());setConnection('ok','En línea');
    }catch(error){
      setConnection('error','Sin conexión');$('updated-at').textContent='No se pudo actualizar';
      if(!state.modules.length){var grid=$('module-grid');grid.setAttribute('aria-busy','false');grid.innerHTML='<div class="empty-state">Control Maestro no respondió. Por seguridad no se habilitaron enlaces. Intente actualizar nuevamente.</div>';}
    }finally{clearTimeout(timeout);state.loading=false;$('refresh').disabled=false;$('mobile-refresh').disabled=false;}
  }

  async function loadIdentity(){
    var token='';try{token=localStorage.getItem(TOKEN_KEY)||'';}catch(_error){}
    if(!token){$('access-status').textContent='Requiere acceso';return;}
    try{
      var response=await fetch(PORTERO_ENDPOINT+'?recurso=canje&t='+encodeURIComponent(token),{cache:'no-store'});var data=await response.json();
      if(!data||!data.ok)throw new Error('sesión');state.role=data.rol||'vista';
      var name=data.nombre||data.correo||'Equipo YOD';$('user-name').textContent=name;$('user-role').textContent=state.role;$('avatar').textContent=initials(name);$('first-name').textContent=name.split(/\s|@/)[0];$('access-status').textContent=state.role==='admin'?'Dirección':'Autorizado';
      document.querySelectorAll('.admin-only').forEach(function(el){el.classList.toggle('hidden',state.role!=='admin');});
    }catch(_error){$('user-role').textContent='Sesión por validar';$('access-status').textContent='Validación pendiente';}
  }

  function buildSearch(query){
    var box=$('search-results');box.replaceChildren();var term=safeText(query).trim().toLowerCase();
    var matches=state.modules.filter(function(row){return !term||[row.titulo_portal,row.descripcion_portal,row.audiencia].join(' ').toLowerCase().includes(term);});
    matches.forEach(function(row){var a=document.createElement('a');a.className='search-result';a.href=window.PortalCore.resolveUrl(row);a.innerHTML='<i class="ti ti-'+(ICONS[row.system_id]||'layout-dashboard')+'"></i>';var text=document.createElement('span');var strong=document.createElement('strong');strong.textContent=safeText(row.titulo_portal);var small=document.createElement('small');small.textContent=safeText(row.audiencia)||'Equipo autorizado';text.append(strong,small);a.appendChild(text);box.appendChild(a);});
    if(!matches.length){var empty=document.createElement('div');empty.className='empty-state';empty.textContent='No encontramos un módulo con ese nombre.';box.appendChild(empty);}
  }

  function openSearch(){var dialog=$('search-dialog');dialog.showModal();$('search-input').value='';buildSearch('');setTimeout(function(){$('search-input').focus();},0);}
  $('welcome-title').firstChild.textContent=greeting()+', ';
  $('refresh').addEventListener('click',loadCatalog);$('mobile-refresh').addEventListener('click',loadCatalog);$('search-trigger').addEventListener('click',openSearch);$('search-input').addEventListener('input',function(e){buildSearch(e.target.value);});
  document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}});
  loadIdentity();loadCatalog();
})();
