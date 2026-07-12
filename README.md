# Portal de equipo · Yo Desarrollo

Vestíbulo interno que reúne los tableros de equipo de Yodesarrollo / Aurum en un solo lugar.
Se enlaza desde el menú **Accesos** de yodesarrollo.mx.

- En vivo: https://alexpueblag.github.io/yod-portal/
- El portal **no autentica**: es un directorio. Cada tablero mantiene su propio control de acceso.
- La pestaña `Portal` de **YOD OS · Control Maestro** gobierna orden, visibilidad, textos e iconos.
- URL, estado y sensibilidad se heredan por `system_id` desde la pestaña `Sistemas`.
- `portal-data.json` es una copia operativa generada y verificada; se usa solo si el backend privado no responde.
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
1. Crear o actualizar el registro canónico en `Sistemas`.
2. Agregar su `system_id` en `Portal` y editar orden, visibilidad, descripción, audiencia, icono y miniatura.
3. No duplicar URL, estado o sensibilidad en `Portal`: esas columnas son fórmulas vinculadas a `Sistemas`.
4. Regenerar `portal-data.json` al publicar para conservar una contingencia verificable.
