# Portal de equipo · Yo Desarrollo

Vestíbulo interno que reúne los tableros de equipo de Yodesarrollo / Aurum en un solo lugar.
Se enlaza desde el menú **Accesos** de yodesarrollo.mx.

- En vivo: https://alexpueblag.github.io/yod-portal/
- El portal **no autentica**: es un directorio. Cada tablero mantiene su propia clave.
- `noindex` (uso interno). Las vistas previas (`thumbs/`) van **difuminadas** a propósito: ningún dato real legible, porque el repo es público.

## Tableros que lista
| Tarjeta | Board |
|---|---|
| Proyectos y tareas | board-aurum |
| Finanzas | board-flujo-yod |
| Interiores | interiores-aurum (llave-maestra.html) |
| Presentación a inversionistas | yodesarrollo-board |
| Métricas de redes | aurum-board |
| Obra en vivo | yod-obra (Próximamente) |

**Fuera del portal:** Co-desarrolladores-Yod (portal financiero de inversionistas) — acceso directo aparte en el menú.

## Cómo agregar / cambiar un tablero
Hoy las tarjetas están en `index.html`. Para cada tablero: una vista previa difuminada en `thumbs/<nombre>.jpg` + un bloque `<a class="card">`.
Pendiente (recomendado): mover la lista a la hoja `Portal` del Google Sheet (sheet-driven) para administrarla sin tocar código.
