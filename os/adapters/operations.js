(function(root){
  'use strict';
  var ENDPOINT='https://script.google.com/macros/s/AKfycbyZ1p7rGHuU01vWBbynGdmlKTnlyH9CIXyhKivqLHa4rLxcHNneJKsZHv7smnjLsfH1/exec';
  // Mismo caché que escribe el tablero directo de Operación (board-aurum, App.jsx).
  // Como el OS y el tablero comparten origen (alexpueblag.github.io) comparten
  // localStorage: si la consulta en vivo falla podemos mostrar el último resumen
  // conocido, igual que hace el tablero, en vez de un candado sin datos.
  var CACHE_KEY='aurum-cache-v5';
  var MONTHS={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11};

  function normalizeStatus(value){
    var status=String(value||'').trim().toLowerCase();
    if(status==='terminado'||status==='completado')return 'Terminado';
    if(status==='en proceso'||status==='en-proceso')return 'En proceso';
    if(['en standby','en standby.','en revisión','en revision','subido','detenido'].includes(status))return 'En standby';
    return 'Pendiente';
  }
  function dueDate(task){
    var dayMatch=String(task&&task.fecha||'').match(/(\d{1,2})/);var month=MONTHS[String(task&&(task.mesCompromiso||task.mes)||'').toLowerCase()];
    if(!dayMatch||month==null)return null;return new Date(new Date().getFullYear(),month,Number(dayMatch[1]));
  }
  function daysUntil(task){var due=dueDate(task);if(!due)return null;var now=new Date();var today=new Date(now.getFullYear(),now.getMonth(),now.getDate());return Math.round((due-today)/86400000);}
  function isArchived(task){return task&&(task.archivada===true||String(task.archivada).toLowerCase()==='true'||task.borrada===true||String(task.borrada).toLowerCase()==='true');}
  function summarize(tasks){
    var active=(Array.isArray(tasks)?tasks:[]).filter(function(task){return !isArchived(task);});
    var open=active.filter(function(task){return normalizeStatus(task.estado)!=='Terminado';});
    var overdue=open.filter(function(task){var days=daysUntil(task);return days!=null&&days<0;});
    var dueSoon=open.filter(function(task){var days=daysUntil(task);return days!=null&&days>=0&&days<=7;});
    var review=open.filter(function(task){return normalizeStatus(task.estado)==='En standby';});
    var priority=open.slice().sort(function(a,b){var da=daysUntil(a),db=daysUntil(b);if(da==null)return 1;if(db==null)return -1;return da-db;}).slice(0,5);
    return {total:active.length,open:open.length,overdue:overdue.length,dueSoon:dueSoon.length,review:review.length,priority:priority};
  }

  function readCache(){
    try{var raw=localStorage.getItem(CACHE_KEY);if(!raw)return null;var parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed:null;}catch(e){return null;}
  }

  async function fetchLive(token){
    var controller=(typeof AbortController!=='undefined')?new AbortController():null;
    var timer=controller?setTimeout(function(){controller.abort();},12000):null;
    try{
      var response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({k:token,action:'getAll'}),redirect:'follow',credentials:'omit',signal:controller?controller.signal:undefined});
      if(!response.ok)throw new Error('HTTP '+response.status);
      var text=await response.text();var data;
      try{data=JSON.parse(text);}catch(e){throw new Error('no_json');}
      if(!data||!data.ok)throw new Error((data&&data.error)||'operacion');
      return Array.isArray(data.tasks)?data.tasks:[];
    }finally{if(timer)clearTimeout(timer);}
  }

  async function load(token){
    if(!token)throw new Error('sin_sesion');
    try{
      var tasks=await fetchLive(token);
      // guardar en el mismo caché que usa el tablero, por si el tablero directo no se abrió aún
      try{localStorage.setItem(CACHE_KEY,JSON.stringify(tasks));}catch(e){}
      return {tasks:tasks,summary:summarize(tasks),updatedAt:new Date(),source:'live'};
    }catch(err){
      // La consulta en vivo falló. El tablero directo muestra el último caché;
      // hacemos lo mismo aquí para no dejar el OS vacío, marcándolo como caché.
      var cached=readCache();
      if(cached&&cached.length){
        return {tasks:cached,summary:summarize(cached),updatedAt:null,source:'cache',diag:(err&&err.message)||'error'};
      }
      var e2=new Error((err&&err.message)||'error');e2._diag=(err&&err.message)||'error';throw e2;
    }
  }
  root.YodOperations=Object.freeze({load:load,summarize:summarize,normalizeStatus:normalizeStatus,daysUntil:daysUntil});
})(typeof globalThis!=='undefined'?globalThis:this);
