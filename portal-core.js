(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.PortalCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var DESTINATIONS=Object.freeze({
    'SYS-CONTROL':'https://docs.google.com/spreadsheets/d/1E_89GQBnOmwv5Nej2B-QEkAdVnFYQbBVQUffHWwI7Vk/',
    'SYS-POTENCIALES':'https://alexpueblag.github.io/potenciales-yod/',
    'SYS-TRACK':'https://alexpueblag.github.io/yod-portal/track-codesarrollos.html',
    'SYS-MIRAMAR':'https://alexpueblag.github.io/real-miramar-board/',
    'SYS-TAREAS':'https://alexpueblag.github.io/board-aurum/',
    'SYS-FLUJO':'https://alexpueblag.github.io/board-flujo-yod/',
    'SYS-INTERIORES':'https://alexpueblag.github.io/interiores-aurum/',
    'SYS-INVERSION':'https://alexpueblag.github.io/yodesarrollo-board/',
    'SYS-MARKETING':'https://alexpueblag.github.io/aurum-board/',
    'SYS-OBRA':'https://alexpueblag.github.io/yod-obra/'
  });
  var TRACK_DESTINATIONS=Object.freeze({
    'PRJ-RM':'https://alexpueblag.github.io/real-miramar-board/',
    'PRJ-ALYSA':'https://alexpueblag.github.io/yod-portal/track-alysa.html',
    'PRJ-MARIA':'https://alexpueblag.github.io/yod-portal/track-maria.html'
  });
  function esc(value){return String(value==null?'':value).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});}
  function state(value){return String(value||'').trim().toLowerCase();}
  function safeByManifest(value,id,manifest){var prefix=manifest[String(id||'')];if(!value||!prefix)return '';try{var u=new URL(String(value)),href=u.href;return u.protocol==='https:'&&href.indexOf(prefix)===0?href:'';}catch(_error){return '';}}
  function safeUrl(value,systemId){return safeByManifest(value,systemId,DESTINATIONS);}
  function safeTrackUrl(value,projectId){return safeByManifest(value,projectId,TRACK_DESTINATIONS);}
  // Resuelve el destino: la URL del Sheet debe coincidir con el allowlist. Si viene vacía,
  // cae al manifiesto fijo; una URL explícita inválida nunca se sustituye silenciosamente.
  function resolveUrl(row){var value=row&&row.url;return value?safeUrl(value,row&&row.system_id):(DESTINATIONS[String(row&&row.system_id||'')]||'');}
  function resolveTrackUrl(row){return safeTrackUrl(row&&row.url,row&&row.project_id)||TRACK_DESTINATIONS[String(row&&row.project_id||'')]||'';}
  // Control Maestro gobierna también la disponibilidad: solo Activo abre. Los estados
  // Mantenimiento/Revisión se muestran, pero no se convierten en enlaces.
  function safeThumb(value){var v=String(value||'');return /^thumbs\/[a-z0-9._-]+$/i.test(v)?v:'thumbs/track.svg';}
  function safeIcon(value){var v=String(value||'').toLowerCase();return /^[a-z0-9-]+$/.test(v)?v:'layout-dashboard';}
  function enabled(row){return state(row&&row.estado)==='activo'&&Boolean(resolveUrl(row));}
  function badge(row){
    if(enabled(row))return {cls:'active',icon:'arrow-up-right',text:'Abrir'};
    var s=state(row.estado);
    if(s==='activo'&&!safeUrl(row&&row.url,row&&row.system_id)&&row&&row.url)return {cls:'maintenance',icon:'alert-triangle',text:'URL inválida'};
    if(s==='mantenimiento')return {cls:'maintenance',icon:'shield-lock',text:'Mantenimiento'};
    if(s==='revisión'||s==='revision')return {cls:'review',icon:'clipboard-check',text:'En revisión'};
    return {cls:'soon',icon:'clock',text:'Próximamente'};
  }
  function card(row){
    var on=enabled(row),b=badge(row),id='portal-'+String(row.system_id||'modulo').replace(/[^a-z0-9_-]/gi,'-');
    var open=on?'<a class="card link active" href="'+esc(resolveUrl(row))+'" target="_blank" rel="noopener" data-system-id="'+esc(row.system_id)+'" aria-labelledby="'+id+'">':'<article class="card disabled state-'+esc(b.cls)+'" data-system-id="'+esc(row.system_id)+'" aria-labelledby="'+id+'">';
    var close=on?'</a>':'</article>';
    return open+'<div class="thumb '+(on?'':'soon')+'"><img src="'+esc(safeThumb(row.miniatura))+'" alt="" aria-hidden="true"></div><div class="body"><div class="row"><span class="ic" aria-hidden="true"><i class="ti ti-'+esc(safeIcon(row.icono))+'"></i></span><span class="badge '+esc(b.cls)+'"><i class="ti ti-'+esc(b.icon)+'" aria-hidden="true"></i>'+esc(b.text)+'</span></div><h2 class="ttl" id="'+id+'">'+esc(row.titulo_portal)+'</h2><p class="desc">'+esc(row.descripcion_portal)+'</p><p class="who"><b>Para:</b> '+esc(row.audiencia)+'</p></div>'+close;
  }
  function cleanRows(rows){return (Array.isArray(rows)?rows:[]).filter(function(r){return r&&r.visible==='SI'&&r.system_id;}).sort(function(a,b){return Number(a.orden)-Number(b.orden);});}
  return Object.freeze({destinations:DESTINATIONS,trackDestinations:TRACK_DESTINATIONS,state:state,safeUrl:safeUrl,safeTrackUrl:safeTrackUrl,resolveUrl:resolveUrl,resolveTrackUrl:resolveTrackUrl,enabled:enabled,badge:badge,card:card,cleanRows:cleanRows,escapeHtml:esc});
});
