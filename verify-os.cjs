'use strict';
const assert=require('node:assert/strict');
require('./os/adapters/operations.js');
require('./os/adapters/finance.js');
require('./os/adapters/marketing.js');
require('./os/access-policy.js');
const api=globalThis.YodOperations;
const finance=globalThis.YodFinance;
const marketing=globalThis.YodMarketing;
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
const financeSummary=finance.summarize({saldo:{monto:1000,fecha:'2026-07-13'},pagos:[{monto:300,estatus:'Pendiente'},{monto:50,estatus:'Pagado'}],ingresosEsperados:[{monto:500,estatus:'Esperado'}]});
assert.equal(financeSummary.balance,1000);
assert.equal(financeSummary.payments,300);
assert.equal(financeSummary.income,500);
assert.equal(financeSummary.projected,1200);
const marketingSummary=marketing.summarize({meta:{periodo:'Semana'},kpis:{leads:10,citas:4,clientes:1,nuevos_sin_tocar_24h:2},gasto:{semana_actual:5000}});
assert.equal(marketingSummary.appointmentRate,.4);
assert.equal(marketingSummary.clientRate,.1);
assert.equal(marketingSummary.costPerLead,500);
console.log('YOD OS adapters: passed');
