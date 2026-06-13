# Presupuesto Personal

App de presupuesto personal con contexto peruano (sueldos, AFP, ciclo de tarjeta BCP). Registra gastos, ingresos, tarjetas de crédito con cuotas, deudas y presupuestos por categoría, con dashboard de KPIs y gráficos.

## Stack

- **React 18** + **Vite 5** (JS puro, sin TypeScript)
- **Supabase** — Postgres + Auth (flujo PKCE)
- **Recharts** — gráficos (lazy-loaded)
- **GitHub Pages** — despliegue

## Comandos

```bash
pnpm dev          # servidor de desarrollo
pnpm build        # build de producción → dist/
pnpm preview      # previsualizar el build
pnpm test         # correr tests (Vitest)
pnpm test:watch   # tests en modo watch
```

Gestor de paquetes: **pnpm** (no usar npm). Node 22+.

## Configuración local

Crear `.env.local` (gitignored) con:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
```

## Base de datos

Ejecutar `database/schema.sql` en el SQL Editor de Supabase sobre una BD vacía. Crea catálogos (lectura pública) y tablas por usuario con RLS (`usuario_id = auth.uid()`).

## Estructura

```
src/
├── App.jsx              # raíz, navegación por estado (sin router)
├── context/
│   ├── AuthContext.jsx  # sesión Supabase (PKCE)
│   └── AppContext.jsx   # estado global (useReducer, patrón optimista)
├── db.js                # capa de acceso a Supabase (snake_case ↔ camelCase)
├── pages/               # Dashboard, Registro, Tarjetas, Ingresos, Deudas, …
├── components/          # Sidebar, UI (design system), ErrorBoundary
├── utils/               # lógica de dominio (calcNeto, periodoActual, …)
└── constants/           # SUELDO, catálogos fallback
```

## Despliegue

Automático vía GitHub Actions (`.github/workflows/deploy.yml`) en cada push a `main`: instala, corre tests, build, y publica a GitHub Pages. Las variables `VITE_*` vienen de GitHub Secrets.

`vite.config.js` fija `base: "/presupuesto-personal/"`. Si cambia el nombre del repo, actualizar también `index.html`, `public/404.html` y `emailRedirectTo` en `AuthContext.jsx`.

## Arquitectura

Detalle completo en [`CLAUDE.md`](./CLAUDE.md): patrón optimista→persist→reconciliar, normalización snake/camel, trampa de fechas UTC, y lógica de la boleta peruana.
