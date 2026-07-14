'use strict';
const assert=require('node:assert/strict');
require('./os/adapters/operations.js');
require('./os/access-policy.js');
const api=globalThis.YodOperations;
const access=globalThis.YodAccessPolicy;
assert.equal(access.canOpen('TA','SYS-TAREAS','vista'),true);
assert.equal(access.canOpen('FL','SYS-TAREAS','vista'),false);
assert.equal(access.canOpen('MK','SYS-MARKETING','vista'),true);
assert.equal(access.canOpen('TA','SYS-INVERSION','vista'),false);
assert.equal(access.canOpen('*','SYS-INVERSION','vista'),true);
assert.equal(access.canOpen('','SYS-INVERSION','admin'),true);
assert.equal(api.normalizeStatus('Subido'),'En standby');
assert.equal(api.normalizeStatus('Completado'),'Terminado');
const month=new Intl.DateTimeFormat('es-MX',{month:'long'}).format(new Date());
const day=new Date().getDate();
const result=api.summarize([
  {actividad:'Hoy',mes:month,fecha:String(day),estado:'Pendiente'},
  {actividad:'Terminada',mes:month,fecha:String(day),estado:'Terminado'},
  {actividad:'Revisión',mes:month,fecha:String(day),estado:'Subido'},
  {actividad:'Archivada',mes:month,fecha:String(day),estado:'Pendiente',archivada:true}
]);
assert.equal(result.total,3);
assert.equal(result.open,2);
assert.equal(result.dueSoon,2);
assert.equal(result.review,1);
assert.equal(result.priority.length,2);
console.log('YOD OS operations adapter: passed');
