# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

- `pnpm dev` — servidor de desarrollo Vite
- `pnpm build` — build de producción a `dist/`
- `pnpm preview` — previsualizar el build

Gestor de paquetes: **pnpm** (lockfile `pnpm-lock.yaml`). No hay tests, linter ni typecheck configurados. El proyecto es JS puro (no TypeScript).

`pnpm-workspace.yaml` aprueba el build script de `esbuild` (`allowBuilds: esbuild: true`); sin eso, pnpm lo ignora y el build de Vite falla.

## Despliegue

GitHub Pages vía `.github/workflows/deploy.yml` en push a `main`. El workflow usa `pnpm/action-setup` + `pnpm install --frozen-lockfile` + `pnpm build`, así que `pnpm-lock.yaml` debe estar commiteado y al día o el CI falla con `frozen-lockfile`.

- `vite.config.js` fija `base: "/presupuesto-personal/"`. Todas las URLs absolutas (favicon, redirects) dependen de esa ruta. Si cambia el nombre del repo, cambiar `base` aquí, en `index.html`, en `public/404.html` (`basePath`) y en `emailRedirectTo` de `AuthContext.jsx`.
- `public/404.html` es el fix de SPA para GitHub Pages: reenvía cualquier 404 al `index.html` preservando el `#access_token` de confirmación de email.
- Las variables `VITE_*` se inyectan en build desde GitHub Secrets (Supabase + EmailJS). En local viven en `.env.local` (gitignored).

## Arquitectura

App de presupuesto personal (contexto Perú: sueldos, AFP, ciclo de tarjeta BCP). React 18 + Vite + Supabase (Postgres + Auth). Sin router: la navegación es estado local (`page` en `App.jsx`, mapa `PAGES`). Recharts para gráficos.

### Flujo de arranque (`App.jsx`)

`AuthProvider` → si no hay sesión, `Login`. Con sesión → `AppProvider` (hidrata datos) → si falta `config.afpId`, `Onboarding`; si no, el shell con `Sidebar` + página activa.

### Dos contextos, dos responsabilidades

- **`AuthContext.jsx`** — sesión Supabase con **flujo PKCE**. Tras confirmar email, Supabase redirige con `?code=`; el cliente lo intercambia por sesión (`exchangeCodeForSession`) y limpia la URL. `supabase.js` configura `flowType: "pkce"`.
- **`AppContext.jsx`** — estado global de toda la data del usuario vía `useReducer`. Es el corazón de la app.

### Patrón de estado: optimista + reconciliación

El `dispatch` de `AppContext` es asíncrono y envuelve al reducer. Cada acción:
1. Aplica el cambio en UI inmediatamente (`localDispatch`, optimista) — a menudo con un `id` provisional de `uid()`.
2. Persiste en Supabase en background vía `db`.
3. Reconcilia: reemplaza el id provisional por el UUID real de BD (acciones `REPLACE_*` / `RECONCILE_*`).
4. Si la persistencia falla, **revierte** la actualización optimista (acciones `DELETE_*` / `ROLLBACK_*`) y muestra `errorMsg`.

Al modificar acciones del reducer, mantener este ciclo completo: optimista → persist → reconciliar/revertir. La compra a cuotas (`ADD_CUOTA_COMPRA`) es el caso más complejo: inserta gasto + cuota (+ recurrente opcional), luego recarga las tres colecciones para obtener IDs reales.

La hidratación inicial usa `Promise.allSettled` — si una query falla, esa colección queda con su valor por defecto y el resto carga igual (no se rompe toda la app).

### Capa de datos (`db.js`)

Único punto de acceso a Supabase, agrupado por entidad (`tarjetas`, `gastos`, `cuotas`, `gastosFijos`, `recurrentes`, `ingresos`, `presupuestos`, `deudas`, `config`, `catalogos`). Regla clave:

- **BD usa `snake_case`, la app usa `camelCase`.** Toda fila que sale de Supabase pasa por un `normalize*()` al final del archivo. Al añadir campos, actualizar el `insert`/`update`, el `normalize*` correspondiente y el estado inicial del reducer.
- Los catálogos (`getAfps`, `getTarjetaTipos`) hacen *graceful fallback* a `[]` si la tabla no existe aún — no rompas eso.

### Base de datos (`database/schema.sql`)

Schema normalizado (3FN), v3.1, para ejecutar en el SQL Editor de Supabase sobre una BD vacía. Dos grupos de tablas:
- **Catálogos** (`categorias`, `metodos_pago`, `bancos`, `tipos_deuda`, `afps`, `tarjeta_tipos`): lectura pública (`RLS USING (true)`), datos sembrados por `INSERT`.
- **Tablas por usuario** (`config`, `gastos`, `tarjetas_credito`, `deudas`, etc.): RLS que filtra por `usuario_id = auth.uid()`. Las políticas de escritura necesitan `WITH CHECK` o los inserts fallan aun con RLS activo.

`constants/index.js` tiene `CATEGORIAS_FALLBACK` y `METODOS_FALLBACK` como respaldo local, pero **la fuente de verdad son las tablas de catálogo en Supabase**.

### Fechas — cuidado con UTC

Bug recurrente del proyecto (ver historial git). Las fechas de gasto se guardan como `YYYY-MM-DD`. Para filtrar/mostrar por mes hay que construir `new Date(g.fecha + "T00:00:00")` y usar getters locales, no UTC, o los gastos del día 1 se desfasan al mes anterior. Ver `useGastosMes` en `AppContext.jsx`.

### Lógica de dominio (`utils/index.js`)

- `calcNeto(haberBasico, he25, he100, extras, afpTasa)` — cálculo de boleta peruana: base + asignación familiar + horas extra (HE25/HE100), menos descuento AFP. Constantes en `SUELDO`.
- `periodoActual()` — ciclo de facturación de tarjeta con cierre el día 10 (hardcodeado para BCP).
- `fmt()` formato moneda `es-PE`; `diasPara(dia)` días hasta el día N del mes.

### Componentes compartidos (`components/UI.jsx`)

Kit de UI propio (`Card`, `KPICard`, `Btn`, `Field`, `Badge`, `PageHeader`, `ChartTooltip`, `NumberStepper`, etc.). Reutilizar estos antes de crear nuevos. Estilos vía variables CSS (`var(--bg-base)`, `var(--font-mono)`, ...) definidas en `styles/global.css`; tema oscuro.

## Convenciones

- **Todo el código y comentarios en español.** Los nombres de variables/funciones también.
- IDs provisionales con `uid()` de `utils`; los reales son UUID de Postgres.
- Errores de `db` se lanzan con `check(error)` y los captura el `try/catch` del `dispatch`.
