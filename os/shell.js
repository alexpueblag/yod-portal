/* ==========================================================================
   YOD OS · Shell compartido (shell.js) — la CARA única para todos los boards.
   Se carga como portero.js. Envuelve el contenido existente del board en el
   chrome de YOD OS (barra lateral de tableros + topbar con buscador ⌘K +
   identidad/rol), sin tocar la lógica ni los datos del board.
   Requiere shell.css y la webfont Tabler (ti ti-*).
   ========================================================================== */
(function () {
  'use strict';
  if (window.__YOD_SHELL__) return; window.__YOD_SHELL__ = 1;

  var LSC = 'pyod_clave_v1';
  var PORTAL = 'https://script.google.com/macros/s/AKfycby5LKYKRwl0EsNgppOIeD_ArST8vSXRgNO4ns8XZbFW4yjfglzu4io_vhabB8h-J792Tw/exec?action=read&resource=Portal';
  var PORTERO = 'https://script.google.com/macros/s/AKfycbwlDDCWWzOWYZsUpBU9uqsQ7aenQ469PF6s6FkNlBFS1_cJSU5njG9oQmuyELy5zlqzFg/exec';
  var OS = 'https://alexpueblag.github.io/yod-portal/os/';
  var DEST = {
    'SYS-POTENCIALES': 'https://alexpueblag.github.io/potenciales-yod/',
    'SYS-TRACK': 'https://alexpueblag.github.io/yod-portal/track-codesarrollos.html',
    'SYS-MIRAMAR': 'https://alexpueblag.github.io/real-miramar-board/',
    'SYS-TAREAS': 'https://alexpueblag.github.io/board-aurum/',
    'SYS-FLUJO': 'https://alexpueblag.github.io/board-flujo-yod/',
    'SYS-INTERIORES': 'https://alexpueblag.github.io/interiores-aurum/',
    'SYS-INVERSION': 'https://alexpueblag.github.io/yodesarrollo-board/',
    'SYS-MARKETING': 'https://alexpueblag.github.io/aurum-board/'
  };
  var ICON = { 'SYS-POTENCIALES': 'map-2', 'SYS-TRACK': 'route', 'SYS-MIRAMAR': 'building-community', 'SYS-TAREAS': 'checklist', 'SYS-FLUJO': 'wallet', 'SYS-INTERIORES': 'armchair-2', 'SYS-INVERSION': 'presentation-analytics', 'SYS-MARKETING': 'speakerphone' };
  var NAME = { 'SYS-POTENCIALES': 'Potenciales', 'SYS-TRACK': 'Codesarrollos', 'SYS-MIRAMAR': 'Real Miramar', 'SYS-TAREAS': 'Operación', 'SYS-FLUJO': 'Flujo YOD', 'SYS-INTERIORES': 'Interiores', 'SYS-INVERSION': 'Inversionistas', 'SYS-MARKETING': 'Métricas' };
  var state = { role: '', boards: '', modules: [] };

  function tok() { try { return localStorage.getItem(LSC) || ''; } catch (e) { return ''; } }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function set(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }
  function currentSys() { var here = location.href, best = ''; Object.keys(DEST).forEach(function (k) { if (here.indexOf(DEST[k].replace(/\/$/, '')) === 0) best = k; }); return best; }

  function defaultRows() { return Object.keys(DEST).map(function (k) { return { system_id: k, titulo_portal: NAME[k] }; }); }
  function navItem(row, cur) {
    var url = DEST[row.system_id]; if (!url) return null;
    var a = el('a', 'yod-nav-item' + (row.system_id === cur ? ' active' : ''));
    a.href = url; a.setAttribute('rel', 'noopener');
    a.innerHTML = '<i class="ti ti-' + (ICON[row.system_id] || 'layout-dashboard') + '"></i><span>' + esc(row.titulo_portal || NAME[row.system_id] || row.system_id) + '</span>';
    return a;
  }
  function renderNav(rows, cur) {
    var box = document.getElementById('yodNav'); if (!box) return; box.innerHTML = '';
    state.modules = rows;
    rows.forEach(function (r) { var n = navItem(r, cur); if (n) box.appendChild(n); });
    if (!box.children.length) box.innerHTML = '<span class="yod-nav-loading">Sin tableros</span>';
  }

  function boot() {
    if (document.querySelector('.yod-shell')) return;
    document.body.classList.add('yod-on');
    var cur = currentSys();
    var canvas = el('div', 'yod-canvas');
    while (document.body.firstChild) { canvas.appendChild(document.body.firstChild); }

    var side = el('aside', 'yod-sidebar');
    side.innerHTML = '<a class="yod-brand" href="' + OS + '"><b>YOD</b><span>OS</span></a>'
      + '<nav class="yod-nav"><p class="yod-nav-label">Tableros</p><div id="yodNav"><span class="yod-nav-loading"><i class="ti ti-loader-2 yod-spin"></i> Cargando…</span></div></nav>'
      + '<div class="yod-foot"><div class="yod-avatar" id="yodAv">YO</div><div class="yod-id"><strong id="yodName">Equipo YOD</strong><span id="yodRole">Verificando…</span></div></div>';

    var main = el('main', 'yod-main');
    var top = el('header', 'yod-topbar');
    top.innerHTML = '<button class="yod-burger" id="yodBurger" type="button" aria-label="Abrir tableros"><i class="ti ti-menu-2"></i></button>'
      + '<button class="yod-search" id="yodSearch" type="button"><i class="ti ti-search"></i><span>Buscar un tablero…</span><kbd>⌘ K</kbd></button>'
      + '<div class="yod-top-actions"><span class="yod-role" id="yodChip" style="display:none"></span><a class="yod-home" href="' + OS + '" title="Ir a YOD OS"><i class="ti ti-home-2"></i></a></div>';
    main.appendChild(top); main.appendChild(canvas);

    var shell = el('div', 'yod-shell'); shell.appendChild(side); shell.appendChild(main);
    var scrim = el('div', 'yod-scrim'); shell.appendChild(scrim);
    document.body.appendChild(shell);

    wireDrawer(shell, scrim);
    renderNav(defaultRows(), cur);
    wireSearch();
    loadIdentity();
    loadCatalog(cur);
  }

  function wireDrawer(shell, scrim) {
    function open() { shell.classList.add('yod-nav-open'); }
    function close() { shell.classList.remove('yod-nav-open'); }
    function toggle() { shell.classList.toggle('yod-nav-open'); }
    var burger = document.getElementById('yodBurger');
    if (burger) burger.addEventListener('click', toggle);
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    // al tocar un tablero, cerrar el cajón (aunque navegue, se siente app-nativo)
    var nav = document.getElementById('yodNav');
    if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('.yod-nav-item')) close(); });
    // cerrar al pasar a escritorio
    if (window.matchMedia) window.matchMedia('(min-width:901px)').addEventListener('change', function (m) { if (m.matches) close(); });
  }

  function loadCatalog(cur) {
    fetch(PORTAL + '&cb=' + Date.now(), { cache: 'no-store', credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok || !Array.isArray(d.rows)) return;
        var rows = d.rows.filter(function (r) { return r && r.visible === 'SI' && r.system_id && DEST[r.system_id]; })
          .sort(function (a, b) { return Number(a.orden) - Number(b.orden); });
        if (rows.length) renderNav(rows, cur);
      }).catch(function () { });
  }
  function loadIdentity() {
    var k = tok(); if (!k) { set('yodRole', 'Requiere acceso'); return; }
    fetch(PORTERO + '?recurso=canje&t=' + encodeURIComponent(k), { cache: 'no-store', credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) throw 0;
        state.role = j.rol || 'vista'; state.boards = j.boards || '';
        var nm = j.nombre || j.correo || 'Equipo YOD';
        var persona = state.role === 'admin' ? 'direccion' : 'colaborador';
        set('yodName', nm); set('yodRole', persona === 'direccion' ? 'Dirección' : 'Colaborador');
        var av = document.getElementById('yodAv'); if (av) av.textContent = (nm.split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('') || 'YO').toUpperCase();
        var chip = document.getElementById('yodChip'); if (chip) { chip.className = 'yod-role ' + persona; chip.textContent = persona === 'direccion' ? 'Dirección' : 'Colaborador'; chip.style.display = ''; }
      }).catch(function () { set('yodRole', 'Sesión por validar'); });
  }

  function wireSearch() {
    var trig = document.getElementById('yodSearch'); if (!trig) return;
    var dlg = el('dialog', 'yod-dialog');
    dlg.innerHTML = '<form method="dialog"><i class="ti ti-search" style="color:var(--ymuted);font-size:20px"></i><input id="yodQ" type="search" placeholder="Buscar tablero…" autocomplete="off"><button value="cancel" type="submit" style="border:0;background:none;cursor:pointer;color:var(--ymuted);font-size:19px"><i class="ti ti-x"></i></button></form><div class="yr" id="yodRes"></div>';
    document.body.appendChild(dlg);
    function results(q) {
      var box = document.getElementById('yodRes'); if (!box) return; box.innerHTML = '';
      var t = (q || '').toLowerCase();
      state.modules.filter(function (r) { return !t || String(r.titulo_portal || NAME[r.system_id] || '').toLowerCase().indexOf(t) >= 0; }).forEach(function (r) {
        var url = DEST[r.system_id]; if (!url) return;
        var a = el('a'); a.href = url; a.setAttribute('rel', 'noopener');
        a.innerHTML = '<i class="ti ti-' + (ICON[r.system_id] || 'layout-dashboard') + '"></i><span><strong>' + esc(r.titulo_portal || NAME[r.system_id]) + '</strong></span>';
        box.appendChild(a);
      });
    }
    function open() { results(''); if (dlg.showModal) dlg.showModal(); setTimeout(function () { var q = document.getElementById('yodQ'); if (q) q.focus(); }, 0); }
    trig.addEventListener('click', open);
    dlg.addEventListener('input', function (e) { results(e.target.value); });
    document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
